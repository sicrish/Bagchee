import prisma from '../lib/prisma.js';

// Field mapping: item_id→productId(Int), isActive→active(Boolean).
// Dropped: categoryId (not in Prisma Review schema).
// Note: frontend still sends `item_id` — mapped to productId on save.

export const saveReview = async (req, res) => {
    try {
        const { item_id, email, name, title, review, rating, status, isActive } = req.body;
        if (!item_id) return res.status(400).json({ status: false, msg: 'Item ID is required' });
        if (!name) return res.status(400).json({ status: false, msg: 'Name is required' });
        if (!review) return res.status(400).json({ status: false, msg: 'Review content is required' });
        const active = isActive === true || isActive === 'true' || status === 'active';
        const newReview = await prisma.review.create({
            data: {
                productId: parseInt(item_id),
                email: email || '',
                name,
                title: title || '',
                review,
                rating: Math.min(5, Math.max(1, rating !== undefined && rating !== '' ? Number(rating) : 5)),
                active
            }
        });
        res.status(201).json({ status: true, msg: 'Review saved successfully!', data: newReview });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getAllReviews = async (req, res) => {
    try {
        const pageNum = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.limit) || 10;
        const skip = (pageNum - 1) * pageSize;
        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                orderBy: { createdAt: 'desc' }, skip, take: pageSize,
                include: { product: { select: { title: true, bagcheeId: true } } }
            }),
            prisma.review.count()
        ]);
        res.status(200).json({ status: true, data: reviews, total, totalPages: Math.ceil(total / pageSize), page: pageNum });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getReviewById = async (req, res) => {
    try {
        const review = await prisma.review.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!review) return res.status(404).json({ status: false, msg: 'Review not found' });
        // Map back to frontend format
        const formatted = { ...review, item_id: review.productId, status: review.active ? 'active' : 'inactive' };
        res.status(200).json({ status: true, data: formatted });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updateReview = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { item_id, email, name, title, review, rating, status, isActive } = req.body;
        const updateData = {};
        if (item_id !== undefined) updateData.productId = parseInt(item_id);
        if (email !== undefined) updateData.email = email;
        if (name !== undefined) updateData.name = name;
        if (title !== undefined) updateData.title = title;
        if (review !== undefined) updateData.review = review;
        if (rating !== undefined) updateData.rating = Math.min(5, Math.max(1, rating !== '' ? Number(rating) : 5));
        if (isActive !== undefined) updateData.active = (isActive === true || isActive === 'true');
        else if (status !== undefined) updateData.active = status === 'active';
        const updated = await prisma.review.update({ where: { id }, data: updateData });
        res.status(200).json({ status: true, msg: 'Review updated successfully!', data: updated });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Review not found' });
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const deleteReview = async (req, res) => {
    try {
        await prisma.review.delete({ where: { id: parseInt(req.params.id) } });
        res.status(200).json({ status: true, msg: 'Review deleted successfully!' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Review not found' });
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
