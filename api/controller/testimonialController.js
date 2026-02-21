import Testimonial from '../models/Testimonial.js';

// 🟢 GET logic
export const getTestimonial = async (req, res) => {
    try {
        let data = await Testimonial.findOne();
        if (!data) {
            data = await Testimonial.create({ title: 'Testimonials' });
        }
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};

// 🟢 UPDATE logic (Upsert)
export const updateTestimonial = async (req, res) => {
    try {
        const updated = await Testimonial.findOneAndUpdate(
            {}, 
            req.body,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        res.status(200).json({ status: true, msg: "Testimonials updated! ⭐", data: updated });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};