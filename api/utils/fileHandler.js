import path from 'path';
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});

/**
 * Upload a file to Cloudinary (replaces local disk storage).
 * Keeps the same function signature so all controllers work without changes.
 *
 * @param {object} file - express-fileupload file object
 * @param {string} folderName - subfolder in Cloudinary (e.g. 'categories', 'products')
 * @returns {string} Full Cloudinary URL
 */
export const saveFileLocal = async (file, folderName = '') => {
    try {
        if (!file) return null;

        // Size check (10MB)
        const MAX_SIZE = 10 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            throw new Error('File too large! Max 10MB allowed.');
        }

        // Extension check
        const allowedExts = ['.png', '.jpg', '.jpeg', '.webp', '.pdf', '.doc', '.docx'];
        const fileExt = path.extname(file.name).toLowerCase();
        if (!allowedExts.includes(fileExt)) {
            throw new Error('Invalid file type! Only Images and Docs allowed.');
        }

        const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(fileExt);
        const folder = folderName ? `bagchee/${folderName}` : 'bagchee';

        if (isImage) {
            // Optimize with Sharp: resize to 800px max width, convert to WebP @ 80%
            const optimized = await sharp(file.data)
                .resize(800, null, { withoutEnlargement: true, fit: 'inside' })
                .webp({ quality: 80 })
                .toBuffer();

            // Upload buffer to Cloudinary
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder, format: 'webp', resource_type: 'image' },
                    (err, res) => (err ? reject(err) : resolve(res))
                );
                stream.end(optimized);
            });

            return result.secure_url;
        } else {
            // PDFs/Docs — upload as raw file
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder, resource_type: 'raw' },
                    (err, res) => (err ? reject(err) : resolve(res))
                );
                stream.end(file.data);
            });

            return result.secure_url;
        }
    } catch (error) {
        console.error('Upload Error:', error.message);
        throw new Error(error.message);
    }
};

/**
 * Delete a file from Cloudinary (replaces local file deletion).
 * Handles both Cloudinary URLs and legacy local paths gracefully.
 *
 * @param {string} fileUrl - Cloudinary URL or legacy local path
 */
export const deleteFileLocal = async (fileUrl) => {
    try {
        if (!fileUrl) return;

        // Only delete Cloudinary-hosted files
        if (!fileUrl.includes('cloudinary.com')) return;

        // Extract public_id from Cloudinary URL
        // URL format: https://res.cloudinary.com/{cloud}/image/upload/v123/bagchee/categories/filename.webp
        const parts = fileUrl.split('/upload/');
        if (parts.length < 2) return;

        // Remove version prefix (v123456/) and file extension
        const afterUpload = parts[1].replace(/^v\d+\//, '');
        const publicId = afterUpload.replace(/\.[^/.]+$/, '');

        await cloudinary.uploader.destroy(publicId);
    } catch (_) {
        // Non-critical — file may already be gone
    }
};
