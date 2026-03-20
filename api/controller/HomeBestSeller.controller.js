import HomeBestSellerModel from "../models/HomeBestSeller.model.js";
import ProductModel from "../models/Product.model.js"; 

// ==========================================
// 🟢 1. SAVE (Admin: Add Product Manually)
// ==========================================
export const save = async (req, res) => {
    try {
        const { productId, isActive, order } = req.body;
        if (!productId) return res.status(400).json({ msg: "Product ID required" });

        const mainProduct = await ProductModel.findOne({
            $or: [{ bagchee_id: productId }, { isbn13: productId }, { isbn10: productId }]
        });

        if (!mainProduct) return res.status(404).json({ msg: "Product not found" });

        const existing = await HomeBestSellerModel.findOne({ product: mainProduct._id });
        if (existing) return res.status(400).json({ msg: "Already in Best Sellers" });

        const newItem = await HomeBestSellerModel.create({
            product: mainProduct._id,
            isActive: isActive === 'yes' || isActive === true,
            order: Number(order) || 0
        });

        res.status(201).json({ status: true, msg: "Added to Best Seller", data: newItem });
    } catch (error) {
        res.status(500).json({ msg: "Server Error", error: error.message });
    }
};

// ==========================================
// 🟢 2. LIST (Admin: Table View with Pagination)
// ==========================================
export const list = async (req, res) => {
    try {
        const { page, limit } = req.query;

        const isExport = limit === 'all';
        const pageNum = Number(page) || 1;
        const pageSize = isExport ? 100000 : (Number(limit) || 25);
        const skip = (pageNum - 1) * pageSize;

        // Populate product details
        const items = await HomeBestSellerModel.find()
            .populate('product', 'title bagchee_id isbn13 isbn10 default_image') 
            .sort({ order: 1, createdAt: -1 })
            .skip(isExport ? 0 : skip)
            .limit(pageSize);

        const total = await HomeBestSellerModel.countDocuments();

        // Data Formatting for Frontend
        const formattedData = items.map(item => ({
            _id: item._id,       
            productId: item.product?.bagchee_id || 'N/A', 
            title: item.product?.title || 'Product Deleted',
            image: item.product?.default_image || '',
            isActive: item.isActive,
            order: item.order,
            createdAt: item.createdAt,
            product: item.product // Export ke liye
        }));

        res.status(200).json({ 
            status: true, 
            data: formattedData, 
            total, 
            page: pageNum, 
            limit: pageSize 
        });
    } catch (error) {
        res.status(500).json({ msg: "Server Error" });
    }
};

// ==========================================
// 🟢 3. GET ONE (Admin: Edit Form Populate) - MISSING THA
// ==========================================
export const getOne = async (req, res) => {
    try {
        const item = await HomeBestSellerModel.findById(req.params.id).populate('product', 'bagchee_id title');
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
// 🟢 4. UPDATE (Admin: Edit Save) - MISSING THA
// ==========================================
export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { productId, isActive, order } = req.body;

        const item = await HomeBestSellerModel.findById(id);
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
// 🟢 5. DELETE (Admin: Remove)
// ==========================================
export const remove = async (req, res) => {
    try {
        await HomeBestSellerModel.findByIdAndDelete(req.params.id);
        res.status(200).json({ status: true, msg: "Removed successfully" });
    } catch (error) {
        res.status(500).json({ msg: "Error deleting" });
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

// ==========================================
// 🟢 7. FETCH FOR HOME (Frontend: Hybrid Logic)
// ==========================================
export const fetchForHome = async (req, res) => {
    try {
        let { page, limit } = req.query;
        page = Number(page) || 1;
        limit = Number(limit) || 6;

        // --- STEP 1: Fetch Manual Admin Products ---
        const manualEntries = await HomeBestSellerModel.find({ isActive: true })
            .sort({ order: 1 })
            .populate({
                path: 'product',
                select: 'title author price real_price producticonname default_image discount oldPrice isbn13 bagchee_id soldCount inr_price isbn10',
                populate: { path: 'author', select: 'name first_name last_name' }
            });

        const manualProducts = manualEntries
            .map(item => item.product)
            .filter(prod => prod != null);

        const manualIds = manualProducts.map(prod => prod._id);

        // --- STEP 2: Fetch Auto Best Sellers ---
        const autoLimit = 50; 
        const autoProducts = await ProductModel.find({
            _id: { $nin: manualIds }, 
            isActive: true,
            soldCount: { $gt: 0 } 
        })
        .sort({ soldCount: -1 })
        .limit(autoLimit)
        .populate('author', 'name first_name last_name')
        .select('title author price real_price producticonname default_image discount oldPrice isbn13 bagchee_id soldCount');

        // --- STEP 3: Merge ---
        const combinedList = [...manualProducts, ...autoProducts];

        // --- STEP 4: Paginate ---
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        
        const paginatedData = combinedList.slice(startIndex, endIndex);
        const total = combinedList.length;

        res.status(200).json({ 
            status: true, 
            data: paginatedData,
            total,
            page,
            limit,
            sectionTitle: "Best Sellers",
            sectionTagline: "Our most popular picks"
        });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};