import prisma from '../lib/prisma.js';

// Old Mongoose model was single-record (findOne/upsert).
// Prisma schema now has a full multi-record Testimonial table with: title, madeBy, content, active.
// Full CRUD added. getTestimonial + updateTestimonial kept for backward compatibility.

export const saveTestimonial = async (req, res) => {
    try {
        const { title, madeBy, content, active } = req.body;
        if (!title) return res.status(400).json({ status: false, msg: 'Title is required' });
        const newItem = await prisma.testimonial.create({
            data: {
                title,
                madeBy: madeBy || '',
                content: content || '',
                active: active === true || active === 'true'
            }
        });
        res.status(201).json({ status: true, msg: 'Testimonial added successfully!', data: newItem });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const listTestimonials = async (req, res) => {
    try {
        const pageNum = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.limit) || 10;
        const skip = (pageNum - 1) * pageSize;
        const [data, total] = await Promise.all([
            prisma.testimonial.findMany({ orderBy: { createdAt: 'desc' }, skip, take: pageSize }),
            prisma.testimonial.count()
        ]);
        res.status(200).json({ status: true, data, total, totalPages: Math.ceil(total / pageSize), page: pageNum });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

// Backward-compat: returns first record (old single-record usage)
export const getTestimonial = async (req, res) => {
    try {
        const data = await prisma.testimonial.findFirst({ orderBy: { id: 'asc' } });
        if (!data) return res.status(404).json({ status: false, msg: 'No testimonial record found' });
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getTestimonialById = async (req, res) => {
    try {
        const data = await prisma.testimonial.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!data) return res.status(404).json({ status: false, msg: 'Testimonial not found' });
        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

// Backward-compat: updates by id if provided, else updates first record
export const updateTestimonial = async (req, res) => {
    try {
        const id = req.params.id ? parseInt(req.params.id) : undefined;
        const { title, madeBy, content, active, pageContent, page_content, metaTitle, meta_title, metaDesc, meta_description, metaKeywords, meta_keywords } = req.body;
        const updatePayload = {};
        if (title !== undefined) updatePayload.title = title;
        if (madeBy !== undefined) updatePayload.madeBy = madeBy;
        if (content !== undefined) updatePayload.content = content;
        if (active !== undefined) updatePayload.active = (active === true || active === 'true');
        const pc = pageContent || page_content;
        if (pc !== undefined) updatePayload.pageContent = pc || '';
        const mt = metaTitle || meta_title;
        if (mt !== undefined) updatePayload.metaTitle = mt || '';
        const md = metaDesc || meta_description;
        if (md !== undefined) updatePayload.metaDesc = md || '';
        const mk = metaKeywords || meta_keywords;
        if (mk !== undefined) updatePayload.metaKeywords = mk || '';
        if (id) {
            const updated = await prisma.testimonial.update({ where: { id }, data: updatePayload });
            return res.status(200).json({ status: true, msg: 'Testimonial updated!', data: updated });
        }
        // Upsert first record (old behavior)
        const first = await prisma.testimonial.findFirst({ orderBy: { id: 'asc' } });
        if (first) {
            const updated = await prisma.testimonial.update({ where: { id: first.id }, data: updatePayload });
            return res.status(200).json({ status: true, msg: 'Testimonials updated!', data: updated });
        }
        const created = await prisma.testimonial.create({ data: { title: 'Testimonials', ...updatePayload } });
        res.status(200).json({ status: true, msg: 'Testimonials updated!', data: created });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Not found' });
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const deleteTestimonial = async (req, res) => {
    try {
        await prisma.testimonial.delete({ where: { id: parseInt(req.params.id) } });
        res.status(200).json({ status: true, msg: 'Testimonial deleted!' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Not found' });
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
