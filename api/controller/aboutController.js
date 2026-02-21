import About from '../models/About.js';

// 🟢 GET: Humesha pehla document fetch karega
export const getAboutUs = async (req, res) => {
    try {
        let data = await About.findOne();
        if (!data) {
            // Agar pehli baar hai toh empty data bhejega
            data = await About.create({ title: 'About Us' });
        }
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};

// 🟢 UPDATE: Agar record nahi hai toh banayega, hai toh update karega
export const updateAboutUs = async (req, res) => {
    try {
        const updated = await About.findOneAndUpdate(
            {}, // Empty filter means target first document
            req.body,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        res.status(200).json({ status: true, msg: "About Us updated! ✨", data: updated });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};