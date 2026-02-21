import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_UPLOAD_DIR = path.join(__dirname, '../uploads');

// 🟢 SAVE FUNCTION (With Security & Folder Support)
export const saveFileLocal = async (file, folderName = '') => {
    try {   
        if (!file) return null;

        // ==========================================
        // 🛡️ SECURITY 1: SIZE CHECK (5MB)
        // ==========================================
        const MAX_SIZE = 50 * 1024 * 1024; 
        if (file.size > MAX_SIZE) {
            throw new Error(`File too large! Max 50MB allowed.`);
        }

        // ==========================================
        // 🛡️ SECURITY 2: EXTENSION & MIME CHECK
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

        // Extension Valid?
        if (!Object.keys(allowedTypes).includes(fileExt)) {
            throw new Error("Invalid file type! Only Images and Docs allowed.");
        }

        // MIME Type Valid? (Spoofing Check)
        if (allowedTypes[fileExt] !== file.mimetype && !file.mimetype.startsWith('image/')) {
             if(file.mimetype !== 'application/octet-stream') { 
                 throw new Error("File content mismatch (Possible Attack).");
             }
        }

        // ==========================================
        // 📂 ORGANIZATION: DYNAMIC FOLDER
        // ==========================================
        // Agar folderName aaya (e.g. 'users'), to usme save karo
        const targetDir = folderName ? path.join(BASE_UPLOAD_DIR, folderName) : BASE_UPLOAD_DIR;

        // Auto Create Folder
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // ==========================================
        // 🛡️ SECURITY 3: SAFE FILENAME
        // ==========================================
        const originalName = path.parse(file.name).name;
        // Sirf A-Z, 0-9 allow karo
        const safeName = originalName.replace(/[^a-zA-Z0-9-_]/g, '').substring(0, 50); 

        if(safeName.length === 0) throw new Error("Invalid Filename.");

        const fileName = `${safeName}-${Date.now()}${fileExt}`;
        const uploadPath = path.join(targetDir, fileName);

        // 💾 Save File
        await file.mv(uploadPath);

        // Return DB Path (e.g. /uploads/users/my-pic.jpg)
        const dbPath = folderName ? `/uploads/${folderName}/${fileName}` : `/uploads/${fileName}`;
        return dbPath; 

    } catch (error) {
        throw new Error(error.message); 
    }
};

// ==========================================
// 🗑️ DELETE FUNCTION
// ==========================================
export const deleteFileLocal = async (relativeFilePath) => {
    try {
        if (!relativeFilePath) return;
        if (relativeFilePath.startsWith('http')) return; 

        const fullPath = path.join(__dirname, '..', relativeFilePath);

        // Security: Ensure path is inside 'uploads'
        if (!fullPath.startsWith(BASE_UPLOAD_DIR)) {
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