import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.REACT_APP_ENCRYPTION_SECRET || "Bagchee_secret_data_key_2026"; 

export const decryptBody = (req, res, next) => {
    const cipherText = req.body?.data || req.body?.payload;

    if (cipherText && typeof cipherText === 'string') {
        try {
            // 🔓 1. Decrypt logic
            const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
            const decryptedString = bytes.toString(CryptoJS.enc.Utf8).trim();

            if (!decryptedString) {
                return res.status(400).json({ status: false, msg: "Security Key Mismatch." });
            }

            // 🔄 2. Recursive Parsing (MNC Standard)
            let finalData = JSON.parse(decryptedString);
            
            // Loop tab tak chalega jab tak humein asli Object na mil jaye
            // Isse "Double Encryption" wali problem jadd se khatam ho jayegi
            while (typeof finalData === 'string') {
                finalData = JSON.parse(finalData);
            }

            // 🟢 3. Nested Data Fix (Aapka issue yahi tha)
            // Agar khulne ke baad wapas { data: '...' } mile, toh uske andar wala nikalo
            if (finalData && (finalData.data || finalData.payload)) {
                const subCipherText = finalData.data || finalData.payload;
                const subBytes = CryptoJS.AES.decrypt(subCipherText, SECRET_KEY);
                const subDecrypted = subBytes.toString(CryptoJS.enc.Utf8);
                finalData = JSON.parse(subDecrypted);
            }

            // 🚀 4. Final Re-assignment
            req.body = finalData;

            // console.log("✅ DECRYPTION COMPLETE. Controller Received:", req.body);
            next();
        } catch (error) {
            console.error("🔥 Decryption Middleware Error:", error.message);
            return res.status(400).json({ status: false, msg: "Invalid encryption format." });
        }
    } else {
        next();
    }
};