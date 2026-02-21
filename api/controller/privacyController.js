import Privacy from '../models/Privacy.js';

// 🟢 GET: Humesha ek hi privacy document fetch karega
export const getPrivacy = async (req, res) => {
    try {
        let data = await Privacy.findOne();
        if (!data) {
            data = await Privacy.create({ title: 'Privacy Policy' });
        }
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};

// 🟢 UPDATE: Upsert logic (hai toh update, nahi toh create)
export const updatePrivacy = async (req, res) => {
    try {
        const updated = await Privacy.findOneAndUpdate(
            {}, 
            req.body,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        res.status(200).json({ status: true, msg: "Privacy Policy updated! 🔒", data: updated });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};