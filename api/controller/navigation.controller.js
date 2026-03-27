import prisma from '../lib/prisma.js';

// Field mapping: name→item, link→itemLink, status('active'/'inactive')→active(Boolean),
// dropdown('active'/'inactive')→hasDropdown(Boolean), dropdown_content→dropdownContent, order→ord

export const createNav = async (req, res) => {
    try {
        const { name, link, order, status, dropdown, dropdown_content } = req.body;
        if (!name || name.trim() === '') return res.status(400).json({ status: false, msg: 'Navigation Name (Item) is required' });
        if (!link || link.trim() === '') return res.status(400).json({ status: false, msg: 'Link URL is required' });
        const cleanName = name.trim();
        const existing = await prisma.navigation.findFirst({ where: { item: { equals: cleanName, mode: 'insensitive' } } });
        if (existing) return res.status(400).json({ status: false, msg: 'Navigation item already exists' });
        const newNav = await prisma.navigation.create({
            data: {
                item: cleanName,
                itemLink: link.trim(),
                ord: Number(order) || 0,
                active: status !== 'inactive',
                hasDropdown: dropdown === 'active',
                dropdownContent: dropdown_content || ''
            }
        });
        res.status(201).json({ status: true, msg: 'Navigation item added', data: newNav });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getAllNavs = async (req, res) => {
    try {
        const navs = await prisma.navigation.findMany({ orderBy: { ord: 'asc' } });
        res.status(200).json({ status: true, data: navs });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getNavById = async (req, res) => {
    try {
        const nav = await prisma.navigation.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!nav) return res.status(404).json({ status: false, msg: 'Not found' });
        res.status(200).json({ status: true, data: nav });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updateNav = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name, link, order, status, dropdown, dropdown_content } = req.body;
        if (!name || name.trim() === '') return res.status(400).json({ status: false, msg: 'Navigation Name is required' });
        const cleanName = name.trim();
        const existing = await prisma.navigation.findFirst({ where: { item: { equals: cleanName, mode: 'insensitive' }, NOT: { id } } });
        if (existing) return res.status(400).json({ status: false, msg: 'Navigation name already exists.' });
        const updated = await prisma.navigation.update({
            where: { id },
            data: {
                item: cleanName,
                itemLink: link ? link.trim() : undefined,
                ord: order !== undefined ? Number(order) : undefined,
                active: status !== undefined ? status !== 'inactive' : undefined,
                hasDropdown: dropdown !== undefined ? dropdown === 'active' : undefined,
                dropdownContent: dropdown_content
            }
        });
        res.status(200).json({ status: true, msg: 'Updated successfully', data: updated });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Navigation not found' });
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const deleteNav = async (req, res) => {
    try {
        await prisma.navigation.delete({ where: { id: parseInt(req.params.id) } });
        res.status(200).json({ status: true, msg: 'Deleted successfully' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Navigation not found' });
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
