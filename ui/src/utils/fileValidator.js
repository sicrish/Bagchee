import toast from 'react-hot-toast';

/**
 * 🚀 DYNAMIC IMAGE VALIDATOR (MNC Standard)
 * Handles both Single File and Array/FileList (Multiple files)
 */
export const validateImageFiles = (filesInput, maxSizeMB = 10) => {
    // Agar koi file nahi hai, toh false return karo
    if (!filesInput) return false;

    // 🟢 MAGIC TRICK: Data normalization
    // Agar input FileList hai (Multiple) ya Array hai, toh usko array bana lo.
    // Agar single File object hai, toh usko bhi ek array mein daal do taaki loop chal sake.
    const filesArray = filesInput instanceof FileList 
        ? Array.from(filesInput) 
        : Array.isArray(filesInput) 
            ? filesInput 
            : [filesInput];

    const maxSizeBytes = maxSizeMB * 1024 * 1024; // MB to Bytes
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

    // 🟢 Har ek file ko check karo
    for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];

        // 1. Format Check
        if (!validImageTypes.includes(file.type)) {
            toast.error(`❌ Invalid format: ${file.name}. Only JPG, PNG, and WEBP allowed.`);
            return false; // Process ruk jayega
        }

        // 2. Size Check
        if (file.size > maxSizeBytes) {
            toast.error(`❌ File too large: ${file.name}. Max size allowed is ${maxSizeMB}MB.`);
            return false; // Process ruk jayega
        }
    }

    // ✅ Agar saari files pass ho gayi, tabhi aage badho
    return true;
};