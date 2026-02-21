import TopAuthor from '../models/TopAuthor.js';
import ProductSchemaModel from '../models/Product.model.js'; // 🟢 FIXED: Aapka actual model name

// 🟢 1. Save Top Author
export const saveTopAuthor = async (req, res) => {
    try {
        const { authorId, bookId, role, quote, active, order } = req.body;

        // Check if author already exists in list
        const existing = await TopAuthor.findOne({ authorId });
        if (existing) {
            return res.status(400).json({ status: false, msg: "This author is already in the Featured list!" });
        }

        const newTopAuthor = new TopAuthor({
            authorId,
            bookId, // Selected Book from Search Dropdown
            role,   // Padma Bhushan etc.
            quote,  // Author's Quote
            active: active === true || active === 'yes' || active === 'true',
            order: order || 0
        });

        await newTopAuthor.save();
        res.status(201).json({ status: true, msg: "Top Author added successfully!" });
    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// 🟢 2. List (Frontend Website + Admin Table)
export const listTopAuthors = async (req, res) => {
    try {
        const { authorName, active } = req.query; // 🟢 Catching filters from query
        let query = {};

        if (active === 'true') {
            query.active = true;
        } else if (active === 'false') {
            query.active = false;
        };

       // 🟢 FIXED: 'const' ko 'let' kiya taaki filter apply kar sakein
       let data = await TopAuthor.find(query)
           .populate('authorId', 'first_name last_name picture') 
           .populate('bookId', 'title default_image bagchee_id') 
           .sort({ order: 1, createdAt: -1 });

       // 🟢 Author Name Search Logic
       if (authorName && authorName.trim() !== "") {
           const searchLower = authorName.toLowerCase();
           data = data.filter(item => {
               const fullName = `${item.authorId?.first_name || ''} ${item.authorId?.last_name || ''}`.toLowerCase();
               return fullName.includes(searchLower);
           });
       }

        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};

// 🟢 3. Search Inventory (Exactly like your New & Noteworthy Logic)
export const searchInventory = async (req, res) => {
    try {
        const { q } = req.query;
        let query = {};

        if (q) {
            query = {
                $or: [
                    { title: { $regex: q, $options: 'i' } },
                    { bagchee_id: { $regex: q, $options: 'i' } },
                    { isbn13: { $regex: q, $options: 'i' } }
                ]
            };
        }

        // Sirf active products hi select karne ke liye dropdown mein
        const products = await ProductSchemaModel.find(query)
            .select('title default_image bagchee_id isbn13')
            .limit(20);

        res.status(200).json({ status: true, data: products });
    } catch (error) {
        res.status(500).json({ status: false, msg: "Search failed", error: error.message });
    }
};

// 🟢 4. Read One (For Edit)
export const getTopAuthor = async (req, res) => {
    try {
        const data = await TopAuthor.findById(req.params.id)
            .populate('authorId')
            .populate('bookId');

        if (!data) return res.status(404).json({ status: false, msg: "Not found" });
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};

// 🟢 5. Update
export const updateTopAuthor = async (req, res) => {
    try {
        const { authorId, bookId, role, quote, active, order } = req.body;

        const updated = await TopAuthor.findByIdAndUpdate(
            req.params.id,
            {
                authorId,
                bookId,
                role,
                quote,
                active: active === true || active === 'yes' || active === 'true',
                order
            },
            { new: true }
        );

        res.status(200).json({ status: true, msg: "Updated successfully!", data: updated });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};

// 🟢 6. Delete
export const deleteTopAuthor = async (req, res) => {
    try {
        await TopAuthor.findByIdAndDelete(req.params.id);
        res.status(200).json({ status: true, msg: "Deleted!" });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};