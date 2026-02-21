import HomeNewNoteworthyModel from "../models/HomeNewNoteworthy.model.js";
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

        // 1️⃣ Find Main Product using ID/ISBN
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

        // 2️⃣ Check Duplicate in this list
        const existing = await HomeNewNoteworthyModel.findOne({ product: mainProduct._id });
        if (existing) {
            return res.status(400).json({ status: false, msg: "This product is already listed here." });
        }

        // 3️⃣ Save Reference
        const newItem = await HomeNewNoteworthyModel.create({
            product: mainProduct._id, 
            isActive: isActive === 'yes' || isActive === true,
            order: Number(order) || 0
        });

        res.status(201).json({ status: true, msg: "Added successfully", data: newItem });

    } catch (error) {
        console.error("Save Error:", error);
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// ==========================================
// 🟢 2. LIST (Populate Data)
// ==========================================
export const list = async (req, res) => {
    try {
        const { page, limit, order } = req.query;

        const isExport = limit === 'all';
        const pageNum = Number(page) || 1;
        const pageSize = isExport ? 100000 : (Number(limit) || 25);
        const skip = (pageNum - 1) * pageSize;

        let sortObj = { order: 1, createdAt: -1 }; 

        // 🟢 Fetch & Populate
        const items = await HomeNewNoteworthyModel.find()
            .populate('product', 'title bagchee_id isbn13 isbn10 default_image') 
            .sort(sortObj)
            .skip(isExport ? 0 : skip)
            .limit(pageSize);

        const total = await HomeNewNoteworthyModel.countDocuments();

        // 🟢 Format for Frontend Table
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

        res.status(200).json({ 
            status: true, 
            data: formattedData, 
            total, 
            page: pageNum, 
            limit: pageSize 
        });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};


// 🟢 7. FETCH FOR HOME (Frontend API with Pagination)
// ==========================================
export const fetchForHome = async (req, res) => {
    try {
        // 1. Receive Page & Limit from Frontend
        let { page, limit } = req.query;

        page = Number(page) || 1;
        limit = Number(limit) || 6; // Default 6 items
        const skip = (page - 1) * limit;

        // 2. Fetch with Pagination
        const items = await HomeNewNoteworthyModel.find({ isActive: true })
            .sort({ order: 1 }) // Order wise sort
            .skip(skip)         // 👈 Skip logic for pagination
            .limit(limit)       // 👈 Limit logic
            .populate({
                path: 'product',
                select: 'title author price real_price inr_price producticonname default_image discount oldPrice isbn13 bagchee_id',
                // Agar Author bhi ek Reference ID h, to use bhi populate karein:
                populate: { path: 'author', select: 'name first_name last_name' } 
            });

        // 3. Count Total Documents (Zaroori hai taaki frontend ko Total Pages pata chale)
        const total = await HomeNewNoteworthyModel.countDocuments({ isActive: true });

        // Filter valid items (in case main product delete ho gaya ho)
        const validItems = items.filter(item => item.product != null);

        res.status(200).json({ 
            status: true, 
            data: validItems,
            total: total, // 👈 Total count bhejna zaroori hai
            page,
            limit,
            sectionTitle: "New & Notable",
            sectionTagline: "Handpicked additions to our collection"
        });

    } catch (error) {
        console.error("Home Fetch Error:", error);
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// ==========================================
// 🟢 3. GET ONE (For Edit Form)
// ==========================================
export const getOne = async (req, res) => {
    try {
        const item = await HomeNewNoteworthyModel.findById(req.params.id).populate('product', 'bagchee_id title');
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

        const item = await HomeNewNoteworthyModel.findById(id);
        if (!item) return res.status(404).json({ msg: "Entry not found" });

        // Update Product Link if ID changed
        if (productId) {
            const mainProduct = await ProductModel.findOne({
                $or: [{ bagchee_id: productId }, { isbn13: productId }, { isbn10: productId }]
            });
            if (mainProduct) {
                item.product = mainProduct._id;
            }
        }

        if (isActive !== undefined) item.isActive = (isActive === 'yes' || isActive === true);
        if (order !== undefined) item.order = Number(order);

        await item.save();

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
        await HomeNewNoteworthyModel.findByIdAndDelete(req.params.id);
        res.status(200).json({ status: true, msg: "Deleted successfully" });
    } catch (error) {
        res.status(500).json({ status: false, msg: "Error deleting" });
    }
};

// ==========================================
// 🟢 6. SEARCH INVENTORY (For Dropdown)
// ==========================================
export const searchMainInventory = async (req, res) => {
    try {
        const { q } = req.query; 
        if (!q) return res.status(200).json({ status: true, data: [] });

        const products = await ProductModel.find({
            $or: [
                { title: { $regex: q, $options: 'i' } },      
                { bagchee_id: { $regex: q, $options: 'i' } }, 
                { isbn13: { $regex: q, $options: 'i' } }, 
                { isbn10: { $regex: q, $options: 'i' } }
            ]
        })
        .select('title bagchee_id isbn13 isbn10 default_image') 
        .limit(10); 

        res.status(200).json({ status: true, data: products });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error" });
    }
};