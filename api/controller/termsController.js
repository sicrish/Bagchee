import Terms from '../models/Terms.js';

// 🟢 GET logic
export const getTerms = async (req, res) => {
    try {
        let data = await Terms.findOne();
        if (!data) {
            data = await Terms.create({ title: 'Terms of Use' });
        }
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};

// 🟢 UPDATE logic (Upsert)
export const updateTerms = async (req, res) => {
    try {
        const updated = await Terms.findOneAndUpdate(
            {}, 
            req.body,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        res.status(200).json({ status: true, msg: "Terms of Use updated! 📝", data: updated });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};