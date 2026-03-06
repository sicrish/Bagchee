import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';

dotenv.config();

// 🗝️ Secret Key ko .env se uthayein (Best Practice)
const SECRET_KEY = process.env.ENCRYPTION_SECRET||"Bagchee_secret_data_key_2026";

// Function: Encrypted Payload se asli data nikalne ke liye
export const decryptPayload = (payload) => {
    try {
        if (!payload) return null;

        const bytes = CryptoJS.AES.decrypt(payload, SECRET_KEY);
        const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
        
        return JSON.parse(decryptedData);
    } catch (error) {
        console.error("Decryption failed:", error.message);
        return null;
    }
};