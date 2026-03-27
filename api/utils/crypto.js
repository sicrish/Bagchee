import CryptoJS from 'crypto-js';

if (!process.env.ENCRYPTION_SECRET) {
    throw new Error('ENCRYPTION_SECRET env var is required but not set');
}
const SECRET_KEY = process.env.ENCRYPTION_SECRET;

// Function: Encrypted Payload se asli data nikalne ke liye
export const decryptPayload = (payload) => {
    try {
        if (!payload) return null;

        const bytes = CryptoJS.AES.decrypt(payload, SECRET_KEY);
        const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
        
        return JSON.parse(decryptedData);
    } catch (error) {
        return null;
    }
};