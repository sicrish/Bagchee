import prisma from '../lib/prisma.js';
import { saveFileLocal, deleteFileLocal } from '../utils/fileHandler.js';

// Field mapping: category→categoryId(Int), ship_in_days→shipInDays(String).
// Dropped: `date` field (not in Prisma schema).
// Dropped: populate('category') — no FK relation defined between Publisher and Category in Prisma.

export const savePublisher = async (req, res) => {
    try {
        const { category, title, company, address, place, email, phone, fax, order, show, slug, ship_in_days } = req.body;
        if (!title) return res.status(400).json({ status: false, msg: 'Title is required.' });
        if (!category) return res.status(400).json({ status: false, msg: 'Category is required.' });
        if (slug) {
            const existingSlug = await prisma.publisher.findFirst({ where: { slug } });
            if (existingSlug) return res.status(400).json({ status: false, msg: 'Slug already exists.' });
        }
        let imagePath = '';
        if (req.files && req.files.image) {
            try { imagePath = await saveFileLocal(req.files.image, 'publishers'); }
            catch (uploadError) { return res.status(400).json({ status: false, msg: uploadError.message }); }
        }
        const newPublisher = await prisma.publisher.create({
            data: {
                title,
                image: imagePath,
                company: company || null,
                address: address || null,
                place: place || null,
                email: email || null,
                phone: phone || null,
                fax: fax || null,
                order: Number(order) || 0,
                show: show === true || show === 'true' || show === 'Yes' || show === 'yes',
                slug: slug || '',
                shipInDays: ship_in_days ? String(ship_in_days) : '3',
                categoryId: parseInt(category) || null
            }
        });
        res.status(201).json({ status: true, msg: 'Publisher added successfully!', data: newPublisher });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getAllPublishers = async (req, res) => {
    try {
        const pageNum = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.limit) || 10;
        const skip = (pageNum - 1) * pageSize;
        const [publishers, total] = await Promise.all([
            prisma.publisher.findMany({ orderBy: { order: 'asc' }, skip, take: pageSize }),
            prisma.publisher.count()
        ]);

        // Resolve category names
        const categoryIds = [...new Set(publishers.map(p => p.categoryId).filter(Boolean))];
        let categoryMap = {};
        if (categoryIds.length > 0) {
            const categories = await prisma.category.findMany({
                where: { id: { in: categoryIds } },
                select: { id: true, title: true }
            });
            categoryMap = Object.fromEntries(categories.map(c => [c.id, c.title]));
        }

        const data = publishers.map(p => ({
            ...p,
            categoryName: p.categoryId ? (categoryMap[p.categoryId] || `ID: ${p.categoryId}`) : null
        }));

        res.status(200).json({ status: true, data, total, totalPages: Math.ceil(total / pageSize), page: pageNum });
    } catch (error) {
        console.error('Publisher list error:', error.message);
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getPublisherById = async (req, res) => {
    try {
        const publisher = await prisma.publisher.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!publisher) return res.status(404).json({ status: false, msg: 'Publisher not found' });
        res.status(200).json({ status: true, data: publisher });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updatePublisher = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const current = await prisma.publisher.findUnique({ where: { id } });
        if (!current) return res.status(404).json({ status: false, msg: 'Publisher not found' });
        const { category, title, company, address, place, email, phone, fax, order, show, slug, ship_in_days } = req.body;
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (company !== undefined) updateData.company = company;
        if (address !== undefined) updateData.address = address;
        if (place !== undefined) updateData.place = place;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (fax !== undefined) updateData.fax = fax;
        if (order !== undefined) updateData.order = Number(order);
        if (show !== undefined) updateData.show = show === true || show === 'true' || show === 'Yes' || show === 'yes';
        if (slug !== undefined) updateData.slug = slug;
        if (ship_in_days !== undefined) updateData.shipInDays = String(ship_in_days);
        if (category !== undefined) updateData.categoryId = parseInt(category) || null;
        if (req.files && req.files.image) {
            try {
                const newPath = await saveFileLocal(req.files.image, 'publishers');
                if (newPath) {
                    if (current.image) await deleteFileLocal(current.image);
                    updateData.image = newPath;
                }
            } catch (uploadError) { return res.status(400).json({ status: false, msg: uploadError.message }); }
        }
        const updated = await prisma.publisher.update({ where: { id }, data: updateData });
        res.status(200).json({ status: true, msg: 'Publisher updated successfully!', data: updated });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Update failed' });
    }
};

export const deletePublisher = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const publisher = await prisma.publisher.findUnique({ where: { id } });
        if (!publisher) return res.status(404).json({ status: false, msg: 'Publisher not found' });
        if (publisher.image) await deleteFileLocal(publisher.image);
        await prisma.publisher.delete({ where: { id } });
        res.status(200).json({ status: true, msg: 'Publisher deleted successfully!' });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Delete failed' });
    }
};
