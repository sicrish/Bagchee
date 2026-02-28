import SideBannerTwo from '../models/SideBannerTwo.js';
import { saveFileLocal, deleteFileLocal } from '../utils/fileHandler.js';

export const saveBanner = async (req, res) => {
    try {
        const { link1, link2, isActive, order } = req.body;
        let image1Path = "";
        let image2Path = "";

        if (req.files && req.files.image1) {
            image1Path = await saveFileLocal(req.files.image1, 'side-banners');
        }
        if (req.files && req.files.image2) {
            image2Path = await saveFileLocal(req.files.image2, 'side-banners');
        }

        const newBanner = new SideBannerTwo({
            image1: image1Path,
            link1,
            image2: image2Path,
            link2,
            isActive: isActive === 'true',
            order
        });

        await newBanner.save();
        res.status(201).json({ status: true, msg: "Side Banner 2 added successfully!", data: newBanner });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};

export const listBanners = async (req, res) => {
    try {
        const data = await SideBannerTwo.find().sort({ order: 1, createdAt: -1 });
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};

export const getBanner = async (req, res) => {
    try {
        const data = await SideBannerTwo.findById(req.params.id);
        if (!data) return res.status(404).json({ status: false, msg: "Banner not found" });
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};

export const updateBanner = async (req, res) => {
    try {
        const { link1, link2, isActive, order } = req.body;
        const oldBanner = await SideBannerTwo.findById(req.params.id);
        if (!oldBanner) return res.status(404).json({ status: false, msg: "Banner not found" });

        let updateData = { link1, link2, isActive: isActive === 'true', order };

        if (req.files?.image1) {
            const newPath1 = await saveFileLocal(req.files.image1, 'side-banners');
            updateData.image1 = newPath1;
            if (oldBanner.image1) await deleteFileLocal(oldBanner.image1);
        }
        if (req.files?.image2) {
            const newPath2 = await saveFileLocal(req.files.image2, 'side-banners');
            updateData.image2 = newPath2;
            if (oldBanner.image2) await deleteFileLocal(oldBanner.image2);
        }

        const updatedBanner = await SideBannerTwo.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.status(200).json({ status: true, msg: "Banner 2 updated successfully!", data: updatedBanner });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};

export const deleteBanner = async (req, res) => {
    try {
        const banner = await SideBannerTwo.findById(req.params.id);
        if (!banner) return res.status(404).json({ status: false, msg: "Banner not found" });
        if (banner.image1) await deleteFileLocal(banner.image1);
        if (banner.image2) await deleteFileLocal(banner.image2);
        await SideBannerTwo.findByIdAndDelete(req.params.id);
        res.status(200).json({ status: true, msg: "Banner deleted successfully!" });
    } catch (error) {
        res.status(500).json({ status: false, msg: error.message });
    }
};