import AuthorsPublishers from '../models/AuthorsPublishers.js';

// 🟢 GET logic
export const getData = async (req, res) => {
    try {
        let data = await AuthorsPublishers.findOne();
        if (!data) {
            data = await AuthorsPublishers.create({ title: 'Authors & Publishers' });
        }
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};

// 🟢 UPDATE logic (Upsert)
export const updateData = async (req, res) => {
    try {
        const updated = await AuthorsPublishers.findOneAndUpdate(
            {}, 
            req.body,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        res.status(200).json({ status: true, msg: "Data updated successfully! ✍️", data: updated });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};