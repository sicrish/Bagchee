import BooksOfMonth from '../models/BooksOfMonth.model.js';

// 🟢 1. Create or Update (Admin side)
export const saveBooksOfMonth = async (req, res) => {
    try {
        const { id, monthName, headline, products, expiryDate } = req.body;

        // Validation: Ensure products is an array and not empty
        if (!products || products.length === 0) {
            return res.status(400).json({ status: false, msg: "Please select at least one product" });
        }

        if (id) {
            // Case 1: Update existing record
            const updated = await BooksOfMonth.findByIdAndUpdate(
                id, 
                { monthName, headline, products, expiryDate, isActive: true }, 
                { new: true }
            );
            return res.json({ status: true, msg: "Updated successfully", data: updated });
        } else {
            // Case 2: Create new record
            // 🟢 Logic: Naya save karne se pehle purane saare records ko deactivate kar do
            await BooksOfMonth.updateMany({}, { isActive: false });

            const newData = await BooksOfMonth.create({ 
                monthName, 
                headline, 
                products, 
                expiryDate,
                isActive: true 
            });
            res.json({ status: true, msg: "New Month Selection Saved successfully", data: newData });
        }
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};

// 🟢 2. Fetch for Website (Auto-Expiry Logic)
export const getActiveBooksOfMonth = async (req, res) => {
    try {
        const today = new Date();
        
        // Find the active record where today's date is less than expiryDate
        const data = await BooksOfMonth.findOne({
            isActive: true,
            expiryDate: { $gt: today } // Check: Is today still before expiry?
        }).populate({
            path: 'products',
            // Sirf wahi products dikhao jo isActive: true hain
            match: { isActive: true },
            populate: { path: 'author', select: 'first_name last_name' }
        });

        if (!data || data.products.length === 0) {
            return res.json({ status: false, msg: "Selection has expired or no products available" });
        }
        
        res.json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};

// 🟢 3. Admin History List (All records with full details)
export const getAllBooksOfMonthHistory = async (req, res) => {
    try {
        // Admin ke liye hum products bhi populate karenge taaki table mein dikh sake
        const history = await BooksOfMonth.find()
            .populate('products', 'title price bagchee_id')
            .sort({ createdAt: -1 });
            
        res.json({ status: true, data: history });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};

// 🟢 4. Delete (Admin side)
export const deleteBooksOfMonth = async (req, res) => {
    try {
        const id = req.params.id;
        const result = await BooksOfMonth.findByIdAndDelete(id);
        
        if (!result) return res.status(404).json({ status: false, msg: "Record not found" });
        
        res.json({ status: true, msg: "Selection deleted successfully" });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};

// 🟢 5. Toggle Status Manual (Optional - Use for quick activate/deactivate)
export const toggleBooksOfMonthStatus = async (req, res) => {
    try {
        const data = await BooksOfMonth.findById(req.params.id);
        data.isActive = !data.isActive;
        await data.save();
        res.json({ status: true, msg: `Status updated to ${data.isActive ? 'Active' : 'Inactive'}` });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};