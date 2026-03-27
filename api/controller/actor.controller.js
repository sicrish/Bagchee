import prisma from '../lib/prisma.js';
import { saveFileLocal, deleteFileLocal } from '../utils/fileHandler.js';

// Field mapping: first_name→firstName, last_name→lastName. picture stays same.

export const saveActor = async (req, res) => {
    try {
        const { first_name, last_name, origin, profile } = req.body;
        if (!first_name || first_name.trim() === '') return res.status(400).json({ status: false, msg: 'First Name is required.' });
        let picturePath = null;
        if (req.files && (req.files.picture || req.files.image)) {
            try { picturePath = await saveFileLocal(req.files.picture || req.files.image, 'actors'); }
            catch (uploadError) { return res.status(400).json({ status: false, msg: uploadError.message }); }
        }
        const newActor = await prisma.actor.create({
            data: {
                firstName: first_name.trim(),
                lastName: last_name ? last_name.trim() : '',
                picture: picturePath,
                origin: origin || null,
                profile: profile || null
            }
        });
        res.status(201).json({ status: true, msg: 'Actor added successfully!', data: newActor });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getAllActors = async (req, res) => {
    try {
        const actors = await prisma.actor.findMany({ orderBy: { firstName: 'asc' } });
        res.status(200).json({ status: true, data: actors });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getActorById = async (req, res) => {
    try {
        const actor = await prisma.actor.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!actor) return res.status(404).json({ status: false, msg: 'Actor not found' });
        res.status(200).json({ status: true, data: actor });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updateActor = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const existing = await prisma.actor.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ status: false, msg: 'Actor not found' });
        const { first_name, last_name, origin, profile } = req.body;
        const updateData = {};
        if (first_name !== undefined) updateData.firstName = first_name.trim();
        if (last_name !== undefined) updateData.lastName = last_name.trim();
        if (origin !== undefined) updateData.origin = origin;
        if (profile !== undefined) updateData.profile = profile;
        if (req.files && (req.files.picture || req.files.image)) {
            try {
                const newPath = await saveFileLocal(req.files.picture || req.files.image, 'actors');
                if (newPath) {
                    if (existing.picture) await deleteFileLocal(existing.picture);
                    updateData.picture = newPath;
                }
            } catch (uploadError) { return res.status(400).json({ status: false, msg: uploadError.message }); }
        }
        const updated = await prisma.actor.update({ where: { id }, data: updateData });
        res.status(200).json({ status: true, msg: 'Actor updated successfully!', data: updated });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Update failed' });
    }
};

export const deleteActor = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const actor = await prisma.actor.findUnique({ where: { id } });
        if (!actor) return res.status(404).json({ status: false, msg: 'Actor not found' });
        if (actor.picture) await deleteFileLocal(actor.picture);
        await prisma.actor.delete({ where: { id } });
        res.status(200).json({ status: true, msg: 'Actor deleted successfully!' });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Delete failed' });
    }
};
