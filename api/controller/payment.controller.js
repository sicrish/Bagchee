import prisma from '../lib/prisma.js';
import { saveFileLocal, deleteFileLocal } from '../utils/fileHandler.js';

// Field mapping: isActive→active, order→ord, additional_text→additionalText,
// additional_text_isActive→additionalTextActive. Dropped: image_public_id (no cloud storage).

export const savePayment = async (req, res) => {
    try {
        const data = req.body;
        if (!data.title) return res.status(400).json({ status: false, msg: 'Payment Title is required' });
        const active = data.status !== 'inactive';
        const additionalTextActive = data.additional_text_status === 'active';
        let imagePath = '';
        if (req.files && req.files.image) {
            try { imagePath = await saveFileLocal(req.files.image, 'payments'); }
            catch (uploadError) { return res.status(400).json({ status: false, msg: uploadError.message }); }
        }
        const newPayment = await prisma.payment.create({
            data: {
                title: data.title,
                active,
                ord: Number(data.order) || 0,
                additionalText: data.additional_text || '',
                additionalTextActive,
                image: imagePath
            }
        });
        res.status(201).json({ status: true, msg: 'Payment method added successfully!', data: newPayment });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getAllPayments = async (req, res) => {
    try {
        const pageNum = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.limit) || 10;
        const skip = (pageNum - 1) * pageSize;
        const [list, total] = await Promise.all([
            prisma.payment.findMany({ orderBy: { ord: 'asc' }, skip, take: pageSize }),
            prisma.payment.count()
        ]);
        res.status(200).json({ status: true, data: list, total, totalPages: Math.ceil(total / pageSize), page: pageNum });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getPaymentById = async (req, res) => {
    try {
        const payment = await prisma.payment.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!payment) return res.status(404).json({ status: false, msg: 'Payment method not found' });
        res.status(200).json({ status: true, data: payment });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updatePayment = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const data = req.body;
        const { remove_image } = req.body;
        const existing = await prisma.payment.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ status: false, msg: 'Payment method not found' });
        const updateData = {
            title: data.title,
            ord: Number(data.order) || 0,
            additionalText: data.additional_text
        };
        if (data.status === 'active') updateData.active = true;
        else if (data.status === 'inactive') updateData.active = false;
        if (data.additional_text_status === 'active') updateData.additionalTextActive = true;
        else if (data.additional_text_status === 'inactive') updateData.additionalTextActive = false;
        if (req.files && req.files.image) {
            try {
                const newImagePath = await saveFileLocal(req.files.image, 'payments');
                if (newImagePath) {
                    if (existing.image) await deleteFileLocal(existing.image);
                    updateData.image = newImagePath;
                }
            } catch (uploadError) { return res.status(400).json({ status: false, msg: uploadError.message }); }
        } else if (remove_image === 'true') {
            if (existing.image) await deleteFileLocal(existing.image);
            updateData.image = '';
        }
        const updated = await prisma.payment.update({ where: { id }, data: updateData });
        res.status(200).json({ status: true, msg: 'Payment updated successfully!', data: updated });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Payment not found' });
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const deletePayment = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const payment = await prisma.payment.findUnique({ where: { id } });
        if (!payment) return res.status(404).json({ status: false, msg: 'Payment method not found' });
        if (payment.image) await deleteFileLocal(payment.image);
        await prisma.payment.delete({ where: { id } });
        res.status(200).json({ status: true, msg: 'Payment deleted successfully!' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ status: false, msg: 'Payment not found' });
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
