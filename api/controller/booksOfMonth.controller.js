import prisma from '../lib/prisma.js';

// Old MongoDB: BooksOfMonth.products[] was embedded ObjectId array.
// Now: BooksOfMonthProduct junction table (booksOfMonthId, productId).
// BooksOfMonthProduct has a Prisma @relation to Product — include: { product: true } works.
// isActive, expiryDate fields match Prisma BooksOfMonth schema exactly.

export const saveBooksOfMonth = async (req, res) => {
    try {
        const { id, monthName, headline, products, expiryDate, isActive } = req.body;
        if (!monthName) return res.status(400).json({ status: false, msg: 'Month name is required.' });
        if (!expiryDate) return res.status(400).json({ status: false, msg: 'Expiry date is required.' });
        if (!products || products.length === 0) {
            return res.status(400).json({ status: false, msg: 'Please select at least one product' });
        }
        const productIds = products.map(p => parseInt(p));
        const activeFlag = isActive === true || isActive === 'yes';

        if (id) {
            // Update: replace junction rows
            await prisma.booksOfMonthProduct.deleteMany({ where: { booksOfMonthId: parseInt(id) } });
            const updated = await prisma.booksOfMonth.update({
                where: { id: parseInt(id) },
                data: {
                    monthName,
                    headline: headline || '',
                    expiryDate: new Date(expiryDate),
                    isActive: activeFlag,
                    products: { create: productIds.map(pid => ({ productId: pid })) }
                }
            });
            return res.json({ status: true, msg: 'Updated successfully', data: updated });
        } else {
            // Create: deactivate all existing, then create new
            if (activeFlag) {
                await prisma.booksOfMonth.updateMany({ data: { isActive: false } });
            }
            const newData = await prisma.booksOfMonth.create({
                data: {
                    monthName,
                    headline: headline || '',
                    expiryDate: new Date(expiryDate),
                    isActive: activeFlag,
                    products: { create: productIds.map(pid => ({ productId: pid })) }
                }
            });
            res.json({ status: true, msg: 'New Month Selection Saved successfully', data: newData });
        }
    } catch (error) {
        console.error('BooksOfMonth save error:', error?.code, error?.message);
        if (error?.code === 'P2002') return res.status(400).json({ status: false, msg: 'A duplicate product was detected. Please remove duplicates and try again.' });
        if (error?.code === 'P2003') return res.status(400).json({ status: false, msg: 'One or more selected products could not be found. Please refresh and try again.' });
        if (error?.code === 'P2025') return res.status(404).json({ status: false, msg: 'This selection no longer exists. Please go back and refresh.' });
        res.status(500).json({ status: false, msg: 'Failed to save selection. Please try again.' });
    }
};

export const getActiveBooksOfMonth = async (req, res) => {
    try {
        const today = new Date();
        const data = await prisma.booksOfMonth.findFirst({
            where: { isActive: true, expiryDate: { gt: today } },
            include: {
                products: {
                    include: {
                        product: {
                            select: { id: true, title: true, price: true, inrPrice: true, realPrice: true, discount: true, defaultImage: true, bagcheeId: true, isbn13: true, isActive: true }
                        }
                    }
                }
            }
        });
        if (!data || data.products.length === 0) {
            return res.json({ status: false, msg: 'Selection has expired or no products available' });
        }
        // Filter out deleted/inactive products
        const validProducts = data.products.filter(p => p.product && p.product.isActive);
        if (validProducts.length === 0) {
            return res.json({ status: false, msg: 'No active products in this selection' });
        }
        res.json({ status: true, data: { ...data, products: validProducts } });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Failed to fetch active selection.' });
    }
};

export const getAllBooksOfMonthHistory = async (req, res) => {
    try {
        const history = await prisma.booksOfMonth.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                products: {
                    include: {
                        product: { select: { id: true, title: true, price: true, bagcheeId: true, defaultImage: true, slug: true } }
                    }
                }
            }
        });
        res.json({ status: true, data: history });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Failed to fetch history.' });
    }
};

export const deleteBooksOfMonth = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        // Junction rows deleted automatically via onDelete: Cascade
        await prisma.booksOfMonth.delete({ where: { id } });
        res.json({ status: true, msg: 'Selection deleted successfully' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Record not found' });
        res.status(500).json({ status: false, msg: 'Failed to delete selection.' });
    }
};

export const toggleBooksOfMonthStatus = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const data = await prisma.booksOfMonth.findUnique({ where: { id } });
        if (!data) return res.status(404).json({ status: false, msg: 'Not found' });
        const updated = await prisma.booksOfMonth.update({ where: { id }, data: { isActive: !data.isActive } });
        res.json({ status: true, msg: `Status updated to ${updated.isActive ? 'Active' : 'Inactive'}` });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Failed to update status.' });
    }
};
