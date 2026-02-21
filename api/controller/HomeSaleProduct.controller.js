import HomeSaleProductModel from "../models/HomeSaleProduct.model.js";
import ProductModel from "../models/Product.model.js"; 

// ==========================================
// 🟢 1. SAVE (Connect Product)
// ==========================================
export const save = async (req, res) => {
    try {
        const { productId, isActive, order } = req.body;

        if (!productId) {
            return res.status(400).json({ status: false, msg: "Product ID is required" });
        }

        // 1️⃣ Find in Main Product Collection
        const mainProduct = await ProductModel.findOne({
            $or: [
                { bagchee_id: productId.trim() },
                { isbn13: productId.trim() },
                { isbn10: productId.trim() }
            ]
        });

        if (!mainProduct) {
            return res.status(404).json({ status: false, msg: "Product not found in inventory!" });
        }

        // 2️⃣ Check Duplicate
        const existing = await HomeSaleProductModel.findOne({ product: mainProduct._id });
        if (existing) {
            return res.status(400).json({ status: false, msg: "This product is already listed in Home Sale." });
        }

        // 3️⃣ Create Link
        const newSaleProduct = await HomeSaleProductModel.create({
            product: mainProduct._id, 
            isActive: isActive === 'yes' || isActive === true,
            order: Number(order) || 0
        });

        res.status(201).json({ status: true, msg: "Connected & Added successfully", data: newSaleProduct });

    } catch (error) {
        console.error("Save Error:", error);
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// ==========================================
// 🟢 2. LIST (Fetch Data)
// ==========================================
export const list = async (req, res) => {
    try {
        const { page, limit, order } = req.query;
        const isExport = limit === 'all';
        const pageNum = Number(page) || 1;
        const pageSize = isExport ? 100000 : (Number(limit) || 25);
        const skip = (pageNum - 1) * pageSize;

        let sortObj = { order: 1, createdAt: -1 };

        const items = await HomeSaleProductModel.find()
            .populate('product', 'title bagchee_id isbn13 default_image') 
            .sort(sortObj)
            .skip(isExport ? 0 : skip)
            .limit(pageSize);

        const total = await HomeSaleProductModel.countDocuments();

        const formattedData = items.map(item => {
            const prod = item.product || {}; 
            return {
                _id: item._id,
                productId: prod.bagchee_id || 'N/A', 
                title: prod.title || 'Product Deleted',
                image: prod.default_image || '',
                isActive: item.isActive,
                order: item.order,
                createdAt: item.createdAt
            };
        });

        res.status(200).json({ status: true, data: formattedData, total, page: pageNum, limit: pageSize });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// ==========================================
// 🟢 3. GET ONE
// ==========================================
export const getOne = async (req, res) => {
    try {
        const item = await HomeSaleProductModel.findById(req.params.id).populate('product', 'bagchee_id title');
        if (!item) return res.status(404).json({ status: false, msg: "Not found" });

        const data = {
            _id: item._id,
            productId: item.product?.bagchee_id || '',
            title: item.product?.title || '',
            isActive: item.isActive,
            order: item.order
        };

        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error" });
    }
};

// ==========================================
// 🟢 4. UPDATE
// ==========================================
export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { productId, isActive, order } = req.body;

        const homeSaleItem = await HomeSaleProductModel.findById(id);
        if (!homeSaleItem) return res.status(404).json({ msg: "Entry not found" });

        if (productId) {
            const mainProduct = await ProductModel.findOne({
                $or: [{ bagchee_id: productId }, { isbn13: productId }, { isbn10: productId }]
            });
            if (mainProduct) {
                homeSaleItem.product = mainProduct._id;
            }
        }

        if (isActive !== undefined) homeSaleItem.isActive = (isActive === 'yes' || isActive === true);
        if (order !== undefined) homeSaleItem.order = Number(order);

        await homeSaleItem.save();
        res.status(200).json({ status: true, msg: "Updated successfully" });
    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error" });
    }
};

// ==========================================
// 🟢 5. DELETE
// ==========================================
export const remove = async (req, res) => {
    try {
        await HomeSaleProductModel.findByIdAndDelete(req.params.id);
        res.status(200).json({ status: true, msg: "Removed from Home Sale" });
    } catch (error) {
        res.status(500).json({ status: false, msg: "Error deleting" });
    }
};

// ==========================================
// 🟢 6. SEARCH MAIN INVENTORY (For Frontend Dropdown)
// ==========================================
export const searchMainInventory = async (req, res) => {
    try {
        const { q } = req.query; // Frontend bhejega: ?q=Harry Potter
        
        if (!q) return res.status(200).json({ status: true, data: [] });

        const products = await ProductModel.find({
            $or: [
                { title: { $regex: q, $options: 'i' } },      // Title Search
                { bagchee_id: { $regex: q, $options: 'i' } }, // ID Search
                { isbn13: { $regex: q, $options: 'i' } },     // ISBN Search
                { isbn10: { $regex: q, $options: 'i' } }
            ]
        })
        .select('title bagchee_id isbn13 default_image') // Sirf zaruri data bhejo
        .limit(10); // Sirf top 10 results taaki dropdown fast rahe

        res.status(200).json({ status: true, data: products });

    } catch (error) {
        console.error("Search Inventory Error:", error);
        res.status(500).json({ status: false, msg: "Server Error" });
    }
};

// ... existing imports ...

// ==========================================
// 🟢 7. FETCH FOR HOME (Frontend API)
// ==========================================
export const fetchForHome = async (req, res) => {
    try {
        // Frontend sends page & limit
        let { page, limit } = req.query;

        page = Number(page) || 1;
        limit = Number(limit) || 6; // Default 6 for slider
        const skip = (page - 1) * limit;

        // Fetch Active Sale Items
        const items = await HomeSaleProductModel.find({ isActive: true })
            .sort({ order: 1 }) // Sort by Admin Order
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'product',
                select: 'title author price real_price producticonname default_image discount oldPrice isbn13 bagchee_id',
                populate: { path: 'author', select: 'name first_name last_name' } 
            });

        // Filter out null products (deleted ones)
        const validItems = items.filter(item => item.product != null);
        
        // Total count for pagination
        const total = await HomeSaleProductModel.countDocuments({ isActive: true });

        res.status(200).json({ 
            status: true, 
            data: validItems,
            total,
            page,
            limit
        });

    } catch (error) {
        console.error("Home Sale Fetch Error:", error);
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};