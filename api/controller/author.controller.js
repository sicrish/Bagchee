import prisma from '../lib/prisma.js';
import { saveFileLocal, deleteFileLocal } from '../utils/fileHandler.js';

// Field mapping: first_name→firstName, last_name→lastName.
// Added: fullName (computed from firstName+lastName) — used for search index in Prisma schema.

export const saveAuthor = async (req, res) => {
    try {
        const { first_name, last_name, origin, profile } = req.body;
        if (!first_name || first_name.trim() === '') return res.status(400).json({ status: false, msg: 'First Name is required.' });
        let picturePath = null;
        if (req.files && (req.files.picture || req.files.image)) {
            try { picturePath = await saveFileLocal(req.files.picture || req.files.image, 'authors'); }
            catch (uploadError) { return res.status(400).json({ status: false, msg: uploadError.message }); }
        }
        const fn = first_name.trim();
        const ln = last_name ? last_name.trim() : '';
        const newAuthor = await prisma.author.create({
            data: {
                firstName: fn,
                lastName: ln,
                fullName: `${fn} ${ln}`.trim(),
                picture: picturePath,
                origin: origin || null,
                profile: profile || null
            }
        });
        res.status(201).json({ status: true, msg: 'Author added successfully!', data: newAuthor });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getAllAuthors = async (req, res) => {
    try {
        const { q, page, limit } = req.query;
        const pageNum = parseInt(page) || 1;
        const pageSize = parseInt(limit) || 20;
        const skip = (pageNum - 1) * pageSize;
        const where = q ? {
            OR: [
                { firstName: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } },
                { fullName: { contains: q, mode: 'insensitive' } }
            ]
        } : {};
        const [authors, total] = await Promise.all([
            prisma.author.findMany({ where, orderBy: { firstName: 'asc' }, skip, take: pageSize }),
            prisma.author.count({ where })
        ]);
        res.status(200).json({ status: true, data: authors, total, page: pageNum, limit: pageSize, totalPages: Math.ceil(total / pageSize) });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getAuthorBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const createSlug = (name) => name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');

        // Search by the last word of the slug (most distinctive — usually last name)
        // e.g. "dp-chattopadhyaya" → search lastName contains "chattopadhyaya"
        const slugParts = slug.split('-');
        const lastWord = slugParts[slugParts.length - 1];

        const authors = await prisma.author.findMany({
            where: {
                OR: [
                    { lastName: { contains: lastWord, mode: 'insensitive' } },
                    { firstName: { contains: lastWord, mode: 'insensitive' } },
                ]
            },
            take: 50
        });

        // Find exact slug match among results
        const found = authors.find(a => createSlug(`${a.firstName} ${a.lastName}`) === slug);
        if (!found) return res.status(404).json({ status: false, msg: 'Author not found' });
        res.status(200).json({ status: true, data: found });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getAuthorById = async (req, res) => {
    try {
        const author = await prisma.author.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!author) return res.status(404).json({ status: false, msg: 'Author not found' });
        res.status(200).json({ status: true, data: author });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

// GET /authors/batch?ids=1,2,3
export const getAuthorsByIds = async (req, res) => {
    try {
        const ids = (req.query.ids || '').split(',').map(Number).filter(n => !isNaN(n) && n > 0);
        if (!ids.length) return res.json({ status: true, data: [] });
        const authors = await prisma.author.findMany({ where: { id: { in: ids } } });
        res.json({ status: true, data: authors });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updateAuthor = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const existing = await prisma.author.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ status: false, msg: 'Author not found' });
        const { first_name, last_name, origin, profile } = req.body;
        const updateData = {};
        const fn = first_name !== undefined ? first_name.trim() : existing.firstName;
        const ln = last_name !== undefined ? last_name.trim() : existing.lastName;
        if (first_name !== undefined) updateData.firstName = fn;
        if (last_name !== undefined) updateData.lastName = ln;
        if (first_name !== undefined || last_name !== undefined) updateData.fullName = `${fn} ${ln}`.trim();
        if (origin !== undefined) updateData.origin = origin;
        if (profile !== undefined) updateData.profile = profile;
        if (req.files && (req.files.picture || req.files.image)) {
            const newPath = await saveFileLocal(req.files.picture || req.files.image, 'authors');
            if (newPath) {
                if (existing.picture) await deleteFileLocal(existing.picture);
                updateData.picture = newPath;
            }
        }
        const updated = await prisma.author.update({ where: { id }, data: updateData });
        res.status(200).json({ status: true, msg: 'Author updated successfully!', data: updated });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Update failed' });
    }
};

export const deleteAuthor = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const author = await prisma.author.findUnique({ where: { id } });
        if (!author) return res.status(404).json({ status: false, msg: 'Author not found' });
        if (author.picture) await deleteFileLocal(author.picture);
        await prisma.author.delete({ where: { id } });
        res.status(200).json({ status: true, msg: 'Author deleted successfully!' });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Delete failed' });
    }
};
