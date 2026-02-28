import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp'; // 🟢 Fast loading ke liye essential

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_UPLOAD_DIR = path.join(__dirname, '../uploads');

// 🟢 SAVE FUNCTION (Optimized for MNC Standards)
export const saveFileLocal = async (file, folderName = '') => {
    try {   
        if (!file) return null;

        // ==========================================
        // 🛡️ SECURITY 1: SIZE CHECK (10MB for processing)
        // ==========================================
        const MAX_SIZE = 10 * 1024 * 1024; 
        if (file.size > MAX_SIZE) {
            throw new Error(`File too large! Max 10MB allowed for optimization.`);
        }

        // ==========================================
        // 🛡️ SECURITY 2: EXTENSION CHECK
        // ==========================================
        const allowedTypes = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.webp': 'image/webp',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };

        const fileExt = path.extname(file.name).toLowerCase();
        if (!Object.keys(allowedTypes).includes(fileExt)) {
            throw new Error("Invalid file type! Only Images and Docs allowed.");
        }

        // ==========================================
        // 📂 ORGANIZATION: DYNAMIC FOLDER
        // ==========================================
        const targetDir = folderName ? path.join(BASE_UPLOAD_DIR, folderName) : BASE_UPLOAD_DIR;
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // ==========================================
        // 🛡️ SECURITY 3: SAFE FILENAME & WEBP CONVERSION
        // ==========================================
        const originalName = path.parse(file.name).name;
        const safeName = originalName.replace(/[^a-zA-Z0-9-_]/g, '').substring(0, 50); 
        
        // 🟢 Check if it's an image for Sharp processing
        const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(fileExt);
        
        // Agar image hai toh extension humesha .webp rakhenge fast loading ke liye
        const finalExt = isImage ? '.webp' : fileExt;
        const fileName = `${safeName}-${Date.now()}${finalExt}`;
        const uploadPath = path.join(targetDir, fileName);

        // ==========================================
        // 🚀 CORE CHANGE: SHARP VS MV LOGIC
        // ==========================================
        if (isImage) {
            // 🟢 MNC STANDARD: Image ko resize aur compress karke save karein
            await sharp(file.data)
                .resize(800, null, { // Max 800px width, height auto maintain hogi
                    withoutEnlargement: true, 
                    fit: 'inside' 
                })
                .webp({ quality: 80 }) // 80% quality par WebP (Best balance)
                .toFile(uploadPath);
        } else {
            // ⚪ NORMAL: PDF/Docs ke liye purana mv logic
            await file.mv(uploadPath);
        }

        // Return DB Path
        const dbPath = folderName ? `/uploads/${folderName}/${fileName}` : `/uploads/${fileName}`;
        return dbPath; 

    } catch (error) {
        console.error("Save File Error:", error.message);
        throw new Error(error.message); 
    }
};

// ==========================================
// 🗑️ DELETE FUNCTION (Security Fixed)
// ==========================================
export const deleteFileLocal = async (relativeFilePath) => {
    try {
        if (!relativeFilePath || relativeFilePath.startsWith('http')) return; 

        // Correct path normalization
        const cleanPath = relativeFilePath.startsWith('/') ? relativeFilePath.slice(1) : relativeFilePath;
        const fullPath = path.join(__dirname, '..', cleanPath);

        // Security: Check if path is actually inside uploads
        const relativeTarget = path.relative(BASE_UPLOAD_DIR, fullPath);
        const isSafe = relativeTarget && !relativeTarget.startsWith('..') && !path.isAbsolute(relativeTarget);

        if (!isSafe) {
             console.warn("⚠️ Security Warning: Attempt to delete outside uploads dir");
             return;
        }

        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log("🗑️ Local file deleted:", relativeFilePath);
        }
    } catch (error) {
        console.error("Delete Error:", error.message);
    }
};