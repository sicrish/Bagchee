import prisma from '../lib/prisma.js';
import { saveFileLocal, deleteFileLocal } from '../utils/fileHandler.js';

// Field mapping: first_name→firstName, last_name→lastName. role, origin, profile same.

export const saveArtist = async (req, res) => {
    try {
        const { first_name, last_name, role, origin, profile } = req.body;
        if (!first_name || first_name.trim() === '') return res.status(400).json({ status: false, msg: 'First Name is required.' });
        let picturePath = null;
        if (req.files && (req.files.picture || req.files.image)) {
            try { picturePath = await saveFileLocal(req.files.picture || req.files.image, 'artists'); }
            catch (uploadError) { return res.status(400).json({ status: false, msg: uploadError.message }); }
        }
        const newArtist = await prisma.artist.create({
            data: {
                firstName: first_name.trim(),
                lastName: last_name ? last_name.trim() : '',
                picture: picturePath,
                role: role || null,
                origin: origin || null,
                profile: profile || null
            }
        });
        res.status(201).json({ status: true, msg: 'Artist added successfully!', data: newArtist });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getAllArtists = async (req, res) => {
    try {
        const artists = await prisma.artist.findMany({ orderBy: { firstName: 'asc' } });
        res.status(200).json({ status: true, data: artists });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getArtistById = async (req, res) => {
    try {
        const artist = await prisma.artist.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!artist) return res.status(404).json({ status: false, msg: 'Artist not found' });
        res.status(200).json({ status: true, data: artist });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const updateArtist = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const existing = await prisma.artist.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ status: false, msg: 'Artist not found' });
        const { first_name, last_name, role, origin, profile } = req.body;
        const updateData = {};
        if (first_name !== undefined) updateData.firstName = first_name.trim();
        if (last_name !== undefined) updateData.lastName = last_name.trim();
        if (role !== undefined) updateData.role = role;
        if (origin !== undefined) updateData.origin = origin;
        if (profile !== undefined) updateData.profile = profile;
        if (req.files && (req.files.picture || req.files.image)) {
            try {
                const newPath = await saveFileLocal(req.files.picture || req.files.image, 'artists');
                if (newPath) {
                    if (existing.picture) await deleteFileLocal(existing.picture);
                    updateData.picture = newPath;
                }
            } catch (uploadError) { return res.status(400).json({ status: false, msg: uploadError.message }); }
        }
        const updated = await prisma.artist.update({ where: { id }, data: updateData });
        res.status(200).json({ status: true, msg: 'Artist updated successfully!', data: updated });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Update failed' });
    }
};

export const deleteArtist = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const artist = await prisma.artist.findUnique({ where: { id } });
        if (!artist) return res.status(404).json({ status: false, msg: 'Artist not found' });
        if (artist.picture) await deleteFileLocal(artist.picture);
        await prisma.artist.delete({ where: { id } });
        res.status(200).json({ status: true, msg: 'Artist deleted successfully!' });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Delete failed' });
    }
};
