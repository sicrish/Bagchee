import mongoose from 'mongoose';

const homeSectionSchema = new mongoose.Schema({
    section: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    }, tagline: { type: String, default: "" },
}, { timestamps: true });

// ES6 Default Export
const HomeSection = mongoose.model('HomeSection', homeSectionSchema);
export default HomeSection;