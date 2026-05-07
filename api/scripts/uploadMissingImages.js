/**
 * uploadMissingImages.js  —  #4
 * Finds all products whose cover image is NOT a Cloudinary/full URL,
 * locates the actual file on the VPS filesystem, uploads it to Cloudinary,
 * and updates the product record with the new URL.
 *
 * Also handles products_images, products_tocs, and products_sample_images tables.
 *
 * Run on VPS:
 *   node /opt/bagchee/api/scripts/uploadMissingImages.js
 *
 * Optional env override for image root (default below):
 *   IMAGE_ROOT=/var/www/bagchee.com/webroot/assets/images \
 *     node /opt/bagchee/api/scripts/uploadMissingImages.js
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});

const log = (m) => console.log(`[${new Date().toISOString().slice(11,19)}] ${m}`);

// Common image root locations on Bagchee VPS (tried in order)
const IMAGE_ROOTS = (process.env.IMAGE_ROOT ? [process.env.IMAGE_ROOT] : [
    '/var/www/bagchee.com/webroot/assets/images',
    '/var/www/bagchee.com/assets/images',
    '/var/www/www.bagchee.com/webroot/assets/images',
    '/home/bagchee/public_html/assets/images',
    '/opt/bagchee/old_site/assets/images',
]);

// Sub-folders to try when looking for a product cover image filename
const COVER_SUBDIRS = ['books', 'products', 'items', ''];
// Sub-folders for gallery/toc/sample images
const GALLERY_SUBDIRS = ['books', 'products', 'items', 'gallery', ''];

/**
 * Resolve a filename to an actual path on disk.
 * Tries each IMAGE_ROOT + each subdir combination.
 */
function findFile(filename, subdirs = COVER_SUBDIRS) {
    if (!filename) return null;
    // Strip any leading slashes or path components — we only want the bare filename
    const bare = path.basename(filename);
    for (const root of IMAGE_ROOTS) {
        for (const sub of subdirs) {
            const full = sub ? path.join(root, sub, bare) : path.join(root, bare);
            if (fs.existsSync(full)) return full;
        }
    }
    return null;
}

/** Upload a local file to Cloudinary and return the secure URL. */
async function uploadToCloudinary(filePath, folder = 'bagchee/products') {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
            filePath,
            { folder, resource_type: 'image', format: 'webp', quality: 'auto' },
            (err, res) => (err ? reject(err) : resolve(res.secure_url))
        );
    });
}

/** Returns true if the string already is a full URL (Cloudinary or otherwise). */
const isFullUrl = (v) => v && (v.startsWith('http://') || v.startsWith('https://'));

async function main() {
    // Verify Cloudinary credentials are present
    if (!process.env.CLOUD_NAME || !process.env.CLOUD_API_KEY || !process.env.CLOUD_API_SECRET) {
        log('ERROR: Cloudinary env vars (CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET) are missing.');
        process.exit(1);
    }

    log('Checking IMAGE_ROOTS...');
    const reachable = IMAGE_ROOTS.filter(r => fs.existsSync(r));
    if (reachable.length === 0) {
        log('ERROR: None of the IMAGE_ROOT paths exist on this machine.');
        log('Set IMAGE_ROOT=/path/to/images and re-run.');
        process.exit(1);
    }
    log(`  Reachable roots: ${reachable.join(', ')}`);

    // ------------------------------------------------------------------
    // 1. Product cover images (defaultImage column)
    // ------------------------------------------------------------------
    log('--- Product cover images ---');
    const products = await prisma.product.findMany({
        where: {
            defaultImage: { not: null },
        },
        select: { id: true, defaultImage: true },
    });

    const missingCovers = products.filter(p => !isFullUrl(p.defaultImage));
    log(`  ${missingCovers.length} products with non-URL defaultImage`);

    let coverOk = 0, coverMiss = 0, coverErr = 0;
    for (const p of missingCovers) {
        const filePath = findFile(p.defaultImage, COVER_SUBDIRS);
        if (!filePath) { coverMiss++; continue; }
        try {
            const url = await uploadToCloudinary(filePath, 'bagchee/products');
            await prisma.product.update({ where: { id: p.id }, data: { defaultImage: url } });
            coverOk++;
            if (coverOk % 50 === 0) log(`  ...${coverOk} covers uploaded`);
        } catch (e) {
            log(`  ERROR product ${p.id} (${p.defaultImage}): ${e.message}`);
            coverErr++;
        }
    }
    log(`  Cover images: ${coverOk} uploaded, ${coverMiss} file not found, ${coverErr} errors`);

    // ------------------------------------------------------------------
    // 2. Product gallery images (products_images table)
    // ------------------------------------------------------------------
    log('--- Gallery images (products_images) ---');
    const galleryRows = await prisma.productImage.findMany({
        where: { file: { not: '' } },
        select: { id: true, file: true },
    });
    const missingGallery = galleryRows.filter(r => !isFullUrl(r.file));
    log(`  ${missingGallery.length} gallery images to process`);

    let galOk = 0, galMiss = 0, galErr = 0;
    for (const r of missingGallery) {
        const filePath = findFile(r.file, GALLERY_SUBDIRS);
        if (!filePath) { galMiss++; continue; }
        try {
            const url = await uploadToCloudinary(filePath, 'bagchee/products/gallery');
            await prisma.productImage.update({ where: { id: r.id }, data: { file: url } });
            galOk++;
        } catch (e) {
            log(`  ERROR gallery ${r.id}: ${e.message}`);
            galErr++;
        }
    }
    log(`  Gallery: ${galOk} uploaded, ${galMiss} not found, ${galErr} errors`);

    // ------------------------------------------------------------------
    // 3. TOC images (products_tocs table)
    // ------------------------------------------------------------------
    log('--- TOC images (products_tocs) ---');
    const tocRows = await prisma.productToc.findMany({
        where: { file: { not: '' } },
        select: { id: true, file: true },
    });
    const missingToc = tocRows.filter(r => !isFullUrl(r.file));
    log(`  ${missingToc.length} TOC images to process`);

    let tocOk = 0, tocMiss = 0, tocErr = 0;
    for (const r of missingToc) {
        const filePath = findFile(r.file, GALLERY_SUBDIRS);
        if (!filePath) { tocMiss++; continue; }
        try {
            const url = await uploadToCloudinary(filePath, 'bagchee/products/toc');
            await prisma.productToc.update({ where: { id: r.id }, data: { file: url } });
            tocOk++;
        } catch (e) {
            log(`  ERROR TOC ${r.id}: ${e.message}`);
            tocErr++;
        }
    }
    log(`  TOC: ${tocOk} uploaded, ${tocMiss} not found, ${tocErr} errors`);

    // ------------------------------------------------------------------
    // 4. Sample images (products_sample_images table)
    // ------------------------------------------------------------------
    log('--- Sample images (products_sample_images) ---');
    const sampleRows = await prisma.productSampleImage.findMany({
        where: { file: { not: '' } },
        select: { id: true, file: true },
    });
    const missingSample = sampleRows.filter(r => !isFullUrl(r.file));
    log(`  ${missingSample.length} sample images to process`);

    let smpOk = 0, smpMiss = 0, smpErr = 0;
    for (const r of missingSample) {
        const filePath = findFile(r.file, GALLERY_SUBDIRS);
        if (!filePath) { smpMiss++; continue; }
        try {
            const url = await uploadToCloudinary(filePath, 'bagchee/products/samples');
            await prisma.productSampleImage.update({ where: { id: r.id }, data: { file: url } });
            smpOk++;
        } catch (e) {
            log(`  ERROR sample ${r.id}: ${e.message}`);
            smpErr++;
        }
    }
    log(`  Samples: ${smpOk} uploaded, ${smpMiss} not found, ${smpErr} errors`);

    // ------------------------------------------------------------------
    // Summary
    // ------------------------------------------------------------------
    log('=== SUMMARY ===');
    log(`  Covers:  ${coverOk} uploaded, ${coverMiss} not found on disk, ${coverErr} errors`);
    log(`  Gallery: ${galOk} uploaded, ${galMiss} not found, ${galErr} errors`);
    log(`  TOC:     ${tocOk} uploaded, ${tocMiss} not found, ${tocErr} errors`);
    log(`  Samples: ${smpOk} uploaded, ${smpMiss} not found, ${smpErr} errors`);

    if (coverMiss + galMiss + tocMiss + smpMiss > 0) {
        log(`  NOTE: ${coverMiss + galMiss + tocMiss + smpMiss} files not found on disk.`);
        log(`  Try setting IMAGE_ROOT to the correct path if the old site is mounted elsewhere.`);
    }

    log('Done ✅');
    await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
