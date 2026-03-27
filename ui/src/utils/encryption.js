import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.REACT_APP_ENCRYPTION_SECRET;
if (!SECRET_KEY) {
    console.error('REACT_APP_ENCRYPTION_SECRET is not set. Encryption will fail.');
}

export const encryptData = (data) => {
    try {
        if (!data) return "";
        
        // 🔒 MNC Standard: Object ko JSON string mein badlo
        const dataString = typeof data === 'object' ? JSON.stringify(data) : data;
        
        // Encrypt karo aur seedha string return karo
        return CryptoJS.AES.encrypt(dataString, SECRET_KEY).toString();
    } catch (error) {
        return "";
    }
};