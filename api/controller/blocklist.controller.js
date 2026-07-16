import prisma from '../lib/prisma.js';
import { invalidateBlocklistCache } from '../lib/blocklist.js';

// Admin CRUD for blocked customers (emails / IPs / countries). Enforcement lives in
// order.controller.js saveOrder via lib/blocklist.js findBlockMatch.

const KINDS = new Set(['email', 'ip', 'country']);

export const listBlocked = async (req, res) => {
    try {
        const data = await prisma.blockedParty.findMany({ orderBy: { createdAt: 'desc' } });
        res.json({ status: true, data });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Failed to load blocklist' });
    }
};

export const createBlocked = async (req, res) => {
    try {
        const kind = String(req.body.kind || '').toLowerCase().trim();
        let value = String(req.body.value || '').trim();
        const note = String(req.body.note || '').trim();
        if (!KINDS.has(kind)) return res.status(400).json({ status: false, msg: 'kind must be email, ip or country' });
        if (!value) return res.status(400).json({ status: false, msg: 'value is required' });
        if (kind === 'email') value = value.toLowerCase();
        if (kind === 'country') {
            value = value.toUpperCase();
            if (!/^[A-Z]{2}$/.test(value))
                return res.status(400).json({ status: false, msg: 'country must be a 2-letter ISO code (e.g. BD)' });
        }
        const entry = await prisma.blockedParty.upsert({
            where: { kind_value: { kind, value } },
            update: { note },
            create: { kind, value, note },
        });
        invalidateBlocklistCache();
        res.status(201).json({ status: true, data: entry });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Failed to add blocklist entry' });
    }
};

export const deleteBlocked = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ status: false, msg: 'Invalid id' });
        await prisma.blockedParty.delete({ where: { id } });
        invalidateBlocklistCache();
        res.json({ status: true, msg: 'Removed' });
    } catch (error) {
        if (error?.code === 'P2025') return res.status(404).json({ status: false, msg: 'Entry not found' });
        res.status(500).json({ status: false, msg: 'Failed to remove entry' });
    }
};
