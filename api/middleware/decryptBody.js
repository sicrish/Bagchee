import CryptoJS from 'crypto-js';

if (!process.env.ENCRYPTION_SECRET) {
    throw new Error('ENCRYPTION_SECRET env var is required but not set');
}
const SECRET_KEY = process.env.ENCRYPTION_SECRET;

export const decryptBody = (req, res, next) => {
    const cipherText = req.body?.data || req.body?.payload;

    if (cipherText && typeof cipherText === 'string') {
        try {
            const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
            const decryptedString = bytes.toString(CryptoJS.enc.Utf8).trim();

            if (!decryptedString) {
                return res.status(400).json({ status: false, msg: 'Security Key Mismatch.' });
            }

            // Unwrap double-stringified JSON (max 3 iterations to prevent DoS)
            let finalData = JSON.parse(decryptedString);
            let iterations = 0;
            while (typeof finalData === 'string' && iterations < 3) {
                finalData = JSON.parse(finalData);
                iterations++;
            }
            if (typeof finalData === 'string') {
                return res.status(400).json({ status: false, msg: 'Invalid encryption format.' });
            }

            // Handle nested double-encrypted payload
            if (finalData && (finalData.data || finalData.payload)) {
                const subCipherText = finalData.data || finalData.payload;
                const subBytes = CryptoJS.AES.decrypt(subCipherText, SECRET_KEY);
                const subDecrypted = subBytes.toString(CryptoJS.enc.Utf8);
                finalData = JSON.parse(subDecrypted);
            }

            req.body = finalData;
            next();
        } catch (error) {
            return res.status(400).json({ status: false, msg: 'Invalid encryption format.' });
        }
    } else {
        next();
    }
};