import prisma from '../lib/prisma.js';

// TopAuthor: authorId (Int FK → authors.id), bookId (Int? FK → products.id).
// SCHEMA-CHECK: TopAuthor has no Prisma @relation to Author or Product — fetched separately.
// active (Boolean), order (Int), role (String), quote (String).

export const saveTopAuthor = async (req, res) => {
    try {
        const { authorId, bookId, role, quote, active, order } = req.body;
        const existing = await prisma.topAuthor.findFirst({ where: { authorId: parseInt(authorId) } });
        if (existing) return res.status(400).json({ status: false, msg: 'This author is already in the Featured list!' });
        const newTopAuthor = await prisma.topAuthor.create({
            data: {
                authorId: parseInt(authorId),
                bookId: bookId ? parseInt(bookId) : null,
                role: role || '',
                quote: quote || '',
                active: active === true || active === 'yes' || active === 'true',
                order: Number(order) || 0
            }
        });
        res.status(201).json({ status: true, msg: 'Top Author added successfully!', data: newTopAuthor });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const listTopAuthors = async (req, res) => {
    try {
        const { authorName, active } = req.query;
        const where = {};
        if (active === 'true') where.active = true;
        else if (active === 'false') where.active = false;

        const items = await prisma.topAuthor.findMany({ where, orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] });

        const authorIds = items.map(i => i.authorId);
        const bookIds = items.filter(i => i.bookId).map(i => i.bookId);

        const [authors, books] = await Promise.all([
            authorIds.length > 0
                ? prisma.author.findMany({ where: { id: { in: authorIds } }, select: { id: true, firstName: true, lastName: true, picture: true } })
                : [],
            bookIds.length > 0
                ? prisma.product.findMany({ where: { id: { in: bookIds } }, select: { id: true, title: true, defaultImage: true, bagcheeId: true } })
                : []
        ]);

        const authorMap = Object.fromEntries(authors.map(a => [a.id, a]));
        const bookMap = Object.fromEntries(books.map(b => [b.id, b]));

        let data = items.map(item => ({
            ...item,
            authorId: authorMap[item.authorId] || null,
            bookId: item.bookId ? (bookMap[item.bookId] || null) : null
        }));

        // Author name filter (post-query since no DB relation)
        if (authorName && authorName.trim() !== '') {
            const searchLower = authorName.toLowerCase();
            data = data.filter(item => {
                const a = item.authorData;
                const fullName = `${a?.firstName || ''} ${a?.lastName || ''}`.toLowerCase();
                return fullName.includes(searchLower);
            });
        }

        res.status(200).json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const searchInventory = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(200).json({ status: true, data: [] });
        const products = await prisma.product.findMany({
            where: { OR: [{ title: { contains: q, mode: 'insensitive' } }, { bagcheeId: { contains: q, mode: 'insensitive' } }, { isbn13: { contains: q, mode: 'insensitive' } }] },
            select: { id: true, title: true, defaultImage: true, bagcheeId: true, isbn13: true },
            take: 20
        });
        res.status(200).json({ status: true, data: products });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Search failed' });
    }
};

export const getTopAuthor = async (req, res) => {
    try {
        const item = await prisma.topAuthor.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!item) return res.status(404).json({ status: false, msg: 'Not found' });
        const [author, book] = await Promise.all([
            prisma.author.findUnique({ where: { id: item.authorId } }),
            item.bookId ? prisma.product.findUnique({ where: { id: item.bookId } }) : Promise.resolve(null)
        ]);
        res.status(200).json({ status: true, data: { ...item, authorId: author, bookId: book } });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updateTopAuthor = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { authorId, bookId, role, quote, active, order } = req.body;

        const updateData = {};
        if (authorId !== undefined) {
            const aId = parseInt(authorId);
            if (isNaN(aId)) return res.status(400).json({ status: false, msg: 'Invalid authorId' });
            updateData.authorId = aId;
        }
        if (bookId !== undefined) updateData.bookId = bookId ? parseInt(bookId) : null;
        if (role    !== undefined) updateData.role   = role;
        if (quote   !== undefined) updateData.quote  = quote;
        if (active  !== undefined) updateData.active = active === true || active === 'yes' || active === 'true';
        if (order   !== undefined) updateData.order  = Number(order) || 0;

        const updated = await prisma.topAuthor.update({ where: { id }, data: updateData });
        res.status(200).json({ status: true, msg: 'Updated successfully!', data: updated });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Not found' });
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const deleteTopAuthor = async (req, res) => {
    try {
        await prisma.topAuthor.delete({ where: { id: parseInt(req.params.id) } });
        res.status(200).json({ status: true, msg: 'Deleted!' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Not found' });
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
