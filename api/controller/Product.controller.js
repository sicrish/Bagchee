import ProductSchemaModel from '../models/Product.model.js';
import SettingsModel from '../models/Settings.js';
import AuthorModel from '../models/Author.js';
import PublisherModel from '../models/Publisher.js';
import SeriesModel from '../models/Series.js';

import { saveFileLocal, deleteFileLocal } from '../utils/fileHandler.js';

// ==========================================
// 🛠️ HELPER FUNCTIONS (Inhe sabse upar rakhna zaroori hai)
// ==========================================

// 1. Array Parser (JSON string ya comma separated string ko array banata hai)
const cleanArray = (data) => {
    if (!data) return [];

    // Agar pehle se array hai
    if (Array.isArray(data)) {
        // Kabhi kabhi FormData double stringify ho jata hai ['["id"]'], usko fix karne ke liye
        if (data.length === 1 && typeof data[0] === 'string' && data[0].startsWith('[')) {
            try { return JSON.parse(data[0]); } catch (e) { return data; }
        }
        return data;
    }

    // Agar string hai
    if (typeof data === 'string') {
        try {
            return JSON.parse(data);
        } catch (e) {
            // Fallback: Comma separated
            return data.split(',').map(s => s.trim()).filter(Boolean);
        }
    }
    return [];
};

// 2. Boolean Parser
const parseBoolean = (value) => {
    const s = String(value).toLowerCase();
    return (s === 'active' || s === 'true' || value === true);
};

// 3. Dynamic Image Processor
const processDynamicImages = async (files, orders, folderName) => {
    let processedList = [];
    // Ensure inputs are arrays
    const fileArray = Array.isArray(files) ? files : (files ? [files] : []);
    const orderArray = Array.isArray(orders) ? orders : (orders ? [orders] : []);

    for (let i = 0; i < fileArray.length; i++) {
        try {
            const path = await saveFileLocal(fileArray[i], folderName);
            processedList.push({
                image: path,
                order: Number(orderArray[i]) || 0
            });
        } catch (err) {
            console.error("Dynamic Image Upload Error:", err);
        }
    }
    return processedList;
};


// 🟢 NEW HELPER: Build Common Filters (Category, Price, Author, etc.)
const buildCommonFilters = (query) => {
    let filter = { isActive: true }; // Default active only

    const {
        keyword, minPrice, maxPrice, categoryId, categories,
        formats, languages, authors, publishers, series,
        title, isbn10, isbn13, product_type
    } = query;

    // Search
    if (keyword) {
        filter.$or = [
            { title: { $regex: keyword, $options: 'i' } },
            { isbn13: { $regex: keyword, $options: 'i' } },
            { isbn10: { $regex: keyword, $options: 'i' } },
            { bagchee_id: { $regex: keyword, $options: 'i' } }
        ];
    }

    // Filters
    if (title) filter.title = { $regex: title, $options: 'i' };
    if (isbn10) filter.isbn10 = { $regex: isbn10, $options: 'i' };
    if (isbn13) filter.isbn13 = { $regex: isbn13, $options: 'i' };
    if (product_type) filter.product_type = product_type;

    // Category Logic
    if (categories) {
        const catArray = categories.split(',').map(c => c.trim());
        filter.$or = [
            { categoryId: { $in: catArray } },
            { product_categories: { $in: catArray } }
        ];
    } else if (categoryId) {
        filter.categoryId = categoryId;
    }

    // Price Range
    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Arrays (Formats, Langs, etc.)
    if (formats) filter.product_formats = { $in: formats.split(',').map(f => f.trim()) };
    if (languages) {
        const langArray = languages.split(',').map(l => l.trim());
        filter.$or = [
            { language: { $in: langArray } },
            { product_languages: { $in: langArray } }
        ];
    }
    if (authors) {
        const authArray = authors.split(',').map(id => id.trim());
        filter.$or = [{ author: { $in: authArray } }, { authors: { $in: authArray } }];
    }
    if (publishers) filter.publisher = { $in: publishers.split(',').map(id => id.trim()) };
    if (series) filter.series = { $in: series.split(',').map(id => id.trim()) };

    return filter;
};


// ==========================================
// 🟢 2. GET SALE PRODUCTS (Only Category Filter)
// ==========================================
export const getSaleProducts = async (req, res) => {
    try {
        let { page, limit, categoryId, categories } = req.query; // Sirf category params nikale
        page = Number(page) || 1;
        limit = Number(limit) || 12;
        const skip = (page - 1) * limit;

        const settings = await SettingsModel.findOne().sort({ createdAt: -1 });
        const threshold = settings ? settings.sale_threshold : 0;

        // 🟢 Step 1: Base Filter (Active + Discount Logic)
        const filter = {
            isActive: true,
            discount: { $gte: threshold, $gt: 0 }
        };

        // 🟢 Step 2: Sirf Category Filter Apply karo
        // (buildCommonFilters use nahi kiya taaki price/author ignore ho jayein)
        if (categories) {
            const catArray = categories.split(',').map(c => c.trim());
            filter.$or = [
                { categoryId: { $in: catArray } },
                { product_categories: { $in: catArray } }
            ];
        } else if (categoryId) {
            filter.categoryId = categoryId;
        }

        // 🟢 Step 3: Data Fetch
        const products = await ProductSchemaModel.find(filter)
            .sort({ discount: -1 }) // Sort by Discount High to Low
            .skip(skip)
            .limit(limit);

        const total = await ProductSchemaModel.countDocuments(filter);

        res.status(200).json({
            status: true,
            msg: `Showing products with discount >= ${threshold}%`,
            data: products, total, page, limit
        });

    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};



// ==========================================
// 🟢 1. SAVE PRODUCT (Create)
// ==========================================
export const save = async (req, res) => {
    try {
        const catId = req.body.categoryId || req.body.leading_category;
        const authId = req.body.author || req.body.author_id;

        if (!catId || !authId) return res.status(400).json({ msg: "Category and Author are required" });

        let coverFile = req.files?.producticon || req.files?.default_image;
        if (!coverFile) return res.status(400).json({ msg: "Book cover image is required" });

        // Image Saves
        let coverPath = await saveFileLocal(coverFile, 'products');
        let tocPath = (req.files?.tocImage || req.files?.toc_image) ? await saveFileLocal(req.files.tocImage || req.files.toc_image, 'products') : "";

        // Dynamic Images
        const tocList = await processDynamicImages(req.files?.toc_images, req.body.toc_images_order, 'products');
        const relatedList = await processDynamicImages(req.files?.related_images, req.body.related_images_order, 'products');
        const sampleList = await processDynamicImages(req.files?.sample_images, req.body.sample_images_order, 'products');

        const productDetails = {
            categoryId: catId,
            author: authId,
            publisher: req.body.publisher || null,
            series: req.body.series || null,

            title: req.body.title,
            isbn10: req.body.isbn10 || "",
            isbn13: req.body.isbn13 || req.body.isbn || "",

            // 🟢 Pricing & Numbers
            price: Number(req.body.price),
            real_price: Number(req.body.real_price || 0),
            inr_price: Number(req.body.inr_price || 0),
            discount: Number(req.body.discount || 0),

            // 🟢 Stock & Availability Logic
            stock: req.body.stock === 'inactive' ? 'inactive' : 'active', // String Status
            availability: Number(req.body.availability) || 0,            // Number Quantity

            // Physical
            pages: Number(req.body.pages || req.body.total_pages || 0),
            weight: req.body.weight,
            edition: req.body.edition,
            volume: req.body.volume,
            series_number: req.body.series_number,
            pub_date: req.body.pub_date,
            new_release_until: req.body.new_release_until || null,

            // Content
            synopsis: req.body.synopsis || "",
            criticsNote: req.body.critics_note || "",
            aboutAuthorText: req.body.search_text || "",
            notes: req.body.notes,
            source: req.body.source,

            // Images
            default_image: coverPath,
            toc_image: tocPath,
            toc_images: tocList,
            related_images: relatedList,
            sample_images: sampleList,

            // Flags
            isActive: parseBoolean(req.body.active),
            isRecommended: parseBoolean(req.body.recommended),
            upcoming: parseBoolean(req.body.upcoming),
            upcoming_date: req.body.upcoming === 'active' ? (req.body.upcoming_date || null) : null,
            isNewRelease: parseBoolean(req.body.new_release),
            isExclusive: parseBoolean(req.body.exclusive),

            // Ratings & Shipping
            rating: Number(req.body.rating || 0),
            rated_times: Number(req.body.rated_times || 0),
            ship_days: Number(req.body.ship_days || 3),
            deliver_days: Number(req.body.deliver_days || 7),
            related_products: req.body.related_products || "",

            // Arrays
            product_categories: cleanArray(req.body.product_categories),
            product_languages: cleanArray(req.body.product_languages),
            product_tags: cleanArray(req.body.product_tags),
            product_formats: cleanArray(req.body.product_formats),
            authors: cleanArray(req.body.authors)
        };

        const savedProduct = await ProductSchemaModel.create(productDetails);
        savedProduct.bagchee_id = `BB${savedProduct._id.toString()}`;
        await savedProduct.save();

        res.status(201).json({ status: true, msg: "Product saved successfully", data: savedProduct });

    } catch (error) {
        console.error("Save Error:", error);
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// ==========================================
// 🟢 2. UPDATE PRODUCT (Full Fix)
// ==========================================
export const update = async (req, res) => {
    try {
        const id = req.params.id || req.body.id;
        if (!id) return res.status(400).json({ status: false, msg: "Product ID is required" });

        const oldProduct = await ProductSchemaModel.findById(id);
        if (!oldProduct) return res.status(404).json({ status: false, msg: "Product not found" });

        // 1. Initialize Object
        let updateData = { ...req.body };

        // 2. 🟢 STOCK LOGIC (Status: Active/Inactive String)
        if (req.body.stock) {
            const s = String(req.body.stock).toLowerCase();
            updateData.stock = (s === 'inactive' || s === 'false') ? 'inactive' : 'active';
        }

        // 3. 🟢 AVAILABILITY LOGIC (Quantity: Number)
        if (req.body.availability !== undefined) {
            updateData.availability = Number(req.body.availability) || 0;
        }

        // 4. SHIPPING LOGIC (Numbers)
        if (req.body.ship_days) updateData.ship_days = Number(req.body.ship_days);
        if (req.body.deliver_days) updateData.deliver_days = Number(req.body.deliver_days);

        // 5. BOOLEAN FLAGS
        if (req.body.active !== undefined) updateData.isActive = parseBoolean(req.body.active);
        if (req.body.recommended !== undefined) updateData.isRecommended = parseBoolean(req.body.recommended);
        if (req.body.upcoming !== undefined) {
            updateData.upcoming = parseBoolean(req.body.upcoming);
            // 🟢 Logic: Agar frontend se upcoming 'active' aa raha hai to date update karo, varna null
            updateData.upcoming_date = req.body.upcoming === 'active' ? (req.body.upcoming_date || null) : null;
        }
        if (req.body.new_release !== undefined) updateData.isNewRelease = parseBoolean(req.body.new_release);
        if (req.body.exclusive !== undefined) updateData.isExclusive = parseBoolean(req.body.exclusive); // 🟢 Ye nayi line add karein


        // 6. ARRAYS
        if (req.body.authors) updateData.authors = cleanArray(req.body.authors);
        if (req.body.product_categories) updateData.product_categories = cleanArray(req.body.product_categories);
        if (req.body.product_languages) updateData.product_languages = cleanArray(req.body.product_languages);
        if (req.body.product_tags) updateData.product_tags = cleanArray(req.body.product_tags);
        if (req.body.product_formats) updateData.product_formats = cleanArray(req.body.product_formats);

        // 7. NUMBERS
        if (req.body.price) updateData.price = Number(req.body.price);
        if (req.body.real_price) updateData.real_price = Number(req.body.real_price);
        if (req.body.inr_price) updateData.inr_price = Number(req.body.inr_price);
        if (req.body.discount) updateData.discount = Number(req.body.discount);
        if (req.body.total_pages) updateData.pages = Number(req.body.total_pages);
        if (req.body.rating) updateData.rating = Number(req.body.rating);
        if (req.body.rated_times) updateData.rated_times = Number(req.body.rated_times);

        // 8. IMAGE UPDATES
        if (req.files) {
            // Main Cover
            if (req.files.default_image) {
                const newPath = await saveFileLocal(req.files.default_image, 'products');
                if (oldProduct.default_image) await deleteFileLocal(oldProduct.default_image);
                updateData.default_image = newPath;
            }
            // TOC Image
            if (req.files.toc_image) {
                const newPath = await saveFileLocal(req.files.toc_image, 'products');
                if (oldProduct.toc_image) await deleteFileLocal(oldProduct.toc_image);
                updateData.toc_image = newPath;
            }

            // Dynamic Images (Append to existing)
            const newToc = await processDynamicImages(req.files.toc_images, req.body.toc_images_order, 'products');
            if (newToc.length > 0) updateData.toc_images = [...(oldProduct.toc_images || []), ...newToc];

            const newRelated = await processDynamicImages(req.files.related_images, req.body.related_images_order, 'products');
            if (newRelated.length > 0) updateData.related_images = [...(oldProduct.related_images || []), ...newRelated];

            const newSample = await processDynamicImages(req.files.sample_images, req.body.sample_images_order, 'products');
            if (newSample.length > 0) updateData.sample_images = [...(oldProduct.sample_images || []), ...newSample];
        }

        // 9. EXECUTE DB UPDATE
        const updatedProduct = await ProductSchemaModel.findByIdAndUpdate(id, updateData, { new: true });

        res.status(200).json({
            status: true,
            msg: "Product updated successfully",
            data: updatedProduct
        });

    } catch (error) {
        console.error("🔴 Update Error:", error);
        res.status(500).json({ status: false, msg: "Internal Server Error", error: error.message });
    }
}
// 🟢 2. GET FILTER OPTIONS (NEW) 
// (Ye naya function h sidebar ke liye data laane ko)
// ==========================================
export const getFilterOptions = async (req, res) => {
    try {
        // 1. Unique Formats nikalo
        const formats = await ProductSchemaModel.distinct("product_formats");

        // 2. Unique Languages nikalo
        const languages = await ProductSchemaModel.distinct("language");

        // 3. Max Price nikalo (Range Slider ke liye)
        const priceStats = await ProductSchemaModel.findOne().sort({ price: -1 }).select("price");
        const maxPrice = priceStats ? priceStats.price : 10000;

        let authors = [];
        let publishers = [];
        let series = [];

        try {
            // Yahan hum { } bhej rahe hain taaki SAARA data aa jaye
            authors = await AuthorModel.find({}).select("first_name last_name").sort({ first_name: 1 });
        } catch (err) { console.error("Author Fetch Error:", err.message); }

        try {
            publishers = await PublisherModel.find({}).select("name title").sort({ name: 1, title: 1 });
        } catch (err) { console.error("Publisher Fetch Error:", err.message); }

        try {
            series = await SeriesModel.find({}).select("title").sort({ title: 1 });
        } catch (err) { console.error("Series Fetch Error:", err.message); }

        console.log(`Fetched: ${authors.length} Authors, ${publishers.length} Publishers, ${series.length} Series`);

        res.status(200).json({
            status: true,
            data: {
                formats: formats.filter(Boolean), // Remove null/empty
                languages: languages.filter(Boolean),
                maxPrice,
                authors,
                publishers,
                series
            }
        });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};

// ==========================================
// 🟢 2. FETCH (Updated for Search)
// ==========================================
export const fetch = async (req, res) => {
    try {
        // A. Single ID Fetch
        if (req.params.id) {
            const product = await ProductSchemaModel.findById(req.params.id)
                .populate('categoryId', 'title')
                .populate('author', 'first_name last_name')
                .populate('series', 'title');

            if (!product) return res.status(200).json({ status: false, msg: "Product not found" });
            return res.status(200).json({ status: true, data: product });
        }

        // B. List Fetch with Search & Filters
        const {
            page, limit, sort, keyword, minPrice, maxPrice, categoryId, categories,
            formats, languages, isFeatured, isNewRelease, isRecommended,isExclusive,
            title, bagchee_id, isbn10, isbn13, id, product_type,
            showAll, authors, publishers, series
        } = req.query;

        let queryObj = {}; // Default: Sirf active products dikhana

        if (showAll !== 'true') {
            queryObj.isActive = true;
        }

        // --- 1. SEARCH LOGIC ---
        if (keyword) {
            queryObj.$or = [
                { title: { $regex: keyword, $options: 'i' } },
                { isbn13: { $regex: keyword, $options: 'i' } },
                { isbn10: { $regex: keyword, $options: 'i' } },
                { bagchee_id: { $regex: keyword, $options: 'i' } }
            ];
        }

        if (title) queryObj.title = { $regex: title, $options: 'i' };
        if (bagchee_id) queryObj.bagchee_id = { $regex: bagchee_id, $options: 'i' };
        if (isbn10) queryObj.isbn10 = { $regex: isbn10, $options: 'i' };
        if (isbn13) queryObj.isbn13 = { $regex: isbn13, $options: 'i' };
        if (product_type) queryObj.product_type = product_type;

        // ID Filter
        if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
            queryObj._id = id;
        }

        // --- 2. CATEGORY LOGIC ---
        if (categories) {
            const catArray = categories.split(',').map(c => c.trim());
            queryObj.$or = [
                { categoryId: { $in: catArray } },
                { product_categories: { $in: catArray } }
            ];
        } else if (categoryId) {
            queryObj.categoryId = categoryId;
        }

        // --- 3. FORMAT & LANGUAGE ---
        if (formats) {
            const formatArray = formats.split(',').map(f => f.trim());
            queryObj.product_formats = { $in: formatArray };
        }
        if (languages) {
            const langArray = languages.split(',').map(l => l.trim());
            queryObj.$or = [
                { language: { $in: langArray } },
                { product_languages: { $in: langArray } }
            ];
        }
        // Authors Filter
        if (authors) {
            const authArray = authors.split(',').map(id => id.trim());
            // Check both single author field AND authors array
            queryObj.$or = [
                { author: { $in: authArray } },
                { authors: { $in: authArray } }
            ];
        }

        // Publishers Filter
        if (publishers) {
            const pubArray = publishers.split(',').map(id => id.trim());
            queryObj.publisher = { $in: pubArray };
        }

        // Series Filter
        if (series) {
            const seriesArray = series.split(',').map(id => id.trim());
            queryObj.series = { $in: seriesArray };
        }

        // --- 4. FLAGS ---
        if (isFeatured === 'true') queryObj.isFeatured = true;
        if (isNewRelease === 'true') queryObj.isNewRelease = true;
        if (isRecommended === 'true') queryObj.isRecommended = true;
        if (isExclusive === 'true') queryObj.isExclusive = true;
        // --- 5. PRICE ---
        if (minPrice || maxPrice) {
            queryObj.price = {};
            if (minPrice) queryObj.price.$gte = Number(minPrice);
            if (maxPrice) queryObj.price.$lte = Number(maxPrice);
        }

        // --- 6. RATING & DATE ---
        if (req.query.rating) {
            queryObj.rating = { $gte: Number(req.query.rating) };
        }
        if (req.query.daysOld) {
            const days = Number(req.query.daysOld);
            const dateFrom = new Date();
            dateFrom.setDate(dateFrom.getDate() - days);
            queryObj.createdAt = { $gte: dateFrom };
        }

        // --- 7. SORTING (8 Options Logic) ---
        let sortOption = { createdAt: -1 }; // Default: Newest

        // 1. Newest
        if (sort === 'newest') sortOption = { createdAt: -1 };

        // 2. Bestselling
        if (sort === 'bestseller') sortOption = { soldCount: -1 };

        // 3. Publication Date (Note: String sorting)
        if (sort === 'publication_date') sortOption = { pub_date: -1 };

        // 4. Price: Low to High
        if (sort === 'price_low') sortOption = { price: 1 };

        // 5. Price: High to Low
        if (sort === 'price_high') sortOption = { price: -1 };

        // 6. Title: A-Z
        if (sort === 'title_asc') sortOption = { title: 1 };

        // 7. Title: Z-A
        if (sort === 'title_desc') sortOption = { title: -1 };

        // 8. Highly Rated
        if (sort === 'rating') sortOption = { rating: -1 };


        // --- 8. PAGINATION & EXECUTION ---
        const pageNum = Number(page) || 1;
        const pageSize = Number(limit) || 36;
        const skip = (pageNum - 1) * pageSize;

        const products = await ProductSchemaModel.find(queryObj)
            .populate('categoryId', 'title categorytitle')
            .populate('author', 'first_name last_name')
            .populate('publisher', 'name title')       // Publisher details
            .populate('series', 'title')
            .sort(sortOption)
            .skip(skip)
            .limit(pageSize);

        const total = await ProductSchemaModel.countDocuments(queryObj);

        res.status(200).json({
            status: true,
            data: products,
            total,
            page: pageNum,
            limit: pageSize,
            totalPages: Math.ceil(total / pageSize)
        });

    } catch (error) {
        console.error("Fetch Error:", error);
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};



// ==========================================
// 🟢 4. DELETE PRODUCT
// ==========================================
export const deleteProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const product = await ProductSchemaModel.findById(id);
        if (!product) return res.status(404).json({ status: false, msg: "Product not found" });

        // Delete Main Images
        if (product.producticonname) await deleteFileLocal(product.producticonname);
        if (product.toc_image) await deleteFileLocal(product.toc_image);

        // Delete Dynamic Images (Loop)
        if (product.toc_images) for (let img of product.toc_images) await deleteFileLocal(img.image);
        if (product.related_images) for (let img of product.related_images) await deleteFileLocal(img.image);
        if (product.sample_images) for (let img of product.sample_images) await deleteFileLocal(img.image);

        await ProductSchemaModel.findByIdAndDelete(id);
        res.status(200).json({ status: true, msg: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ status: false, msg: "Error deleting", error: error.message });
    }
};

export const getRecommended = async (req, res) => {
    try {
        // 1. Frontend se Page aur Limit lein (Default: Page 1, Limit 6)
        let { page, limit } = req.query;

        page = Number(page) || 1;
        limit = Number(limit) || 6; // 🟢 Default 6 rakha hai aapke frontend ke hisab se
        const skip = (page - 1) * limit;

        const query = {
            isActive: true,
            isRecommended: true // Sirf Admin dwara recommend ki gayi books
        };

        // 2. Data Fetch karein (Pagination + Sorting ke saath)
        const products = await ProductSchemaModel.find(query)
            .populate('author', 'first_name last_name') // Author ka naam dikhane ke liye
            .sort({ createdAt: -1 }) // 🟢 Jo 'Latest' recommend ki gayi hai wo upar aayegi
            .skip(skip)   // Piche ke pages skip karega
            .limit(limit); // Jitni frontend ne mangi (e.g., 6)

        // 3. Total Count (Pagination ke liye zaroori hai)
        const total = await ProductSchemaModel.countDocuments(query);

        res.status(200).json({
            status: true,
            data: products,
            total,
            page,
            limit
        });

    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};



// ==========================================
// 🟢 3. GET BEST SELLERS (With Filters)
// ==========================================
export const getBestSellers = async (req, res) => {
    try {
        let { page, limit } = req.query;
        page = Number(page) || 1;
        limit = Number(limit) || 6;
        const skip = (page - 1) * limit;

        const settings = await SettingsModel.findOne().sort({ createdAt: -1 });
        const threshold = settings ? (settings.bestseller_threshold || 1) : 1;

        // 🟢 Filters + Bestseller Logic
        const filter = buildCommonFilters(req.query);
        filter.soldCount = { $gte: threshold }; // Sold Count Logic

        const products = await ProductSchemaModel.find(filter)
            .sort({ soldCount: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await ProductSchemaModel.countDocuments(filter);

        res.status(200).json({ status: true, data: products, total, page, limit });

    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};

// ==========================================
// 🟢 1. GET NEW ARRIVALS (With Auto-Expire & Filters)
// ==========================================
export const getNewArrivals = async (req, res) => {
    try {
        let { page, limit } = req.query;
        page = Number(page) || 1;
        limit = Number(limit) || 12;
        const skip = (page - 1) * limit;

        // 🟢 STEP 1: Auto-Expire Logic (Jo date nikal gayi unhe inactive karo)
        const today = new Date();
        await ProductSchemaModel.updateMany(
            {
                isNewRelease: true,
                new_release_until: { $lt: today },
                new_release_until: { $ne: null }
            },
            { $set: { isNewRelease: false, new_release_until: null } }
        );

        // 🟢 STEP 2: Settings se default days nikalo
        const settings = await SettingsModel.findOne().sort({ createdAt: -1 });
        const days = settings ? settings.new_arrival_time : 30;
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - days);

        // 🟢 STEP 3: Base Filters + New Release Logic
        const filter = buildCommonFilters(req.query);

        // Add 'New Release' specific logic to existing filters
        filter.$and = [
            {
                $or: [
                    { isNewRelease: true }, // Manually set flag
                    { createdAt: { $gte: dateFrom } } // Automatically new by date
                ]
            }
        ];

        const products = await ProductSchemaModel.find(filter)
            .populate('categoryId', 'title categorytitle')
            .populate('author', 'first_name last_name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await ProductSchemaModel.countDocuments(filter);

        res.status(200).json({ status: true, data: products, total, page, limit });

    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};