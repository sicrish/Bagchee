import mongoose from 'mongoose';
import dotenv from 'dotenv';

// .env file read karne ke liye
dotenv.config();

const connectDB = async () => {
    try {
        // MNC Logic: Pehle Cloud URL dhundo, nahi mile toh Local use karo
        const db_url = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/Bagchee_Store";

        // Connection Options (Naye versions me jarurat nahi hoti, par safety ke liye)
        const connectionInstance = await mongoose.connect(db_url);

        console.log(`\n✅ MongoDB Connected! DB Host: ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.log("❌ MONGODB Connection FAILED:", error);
        
        // MNC Rule: Agar Database hi nahi chala, toh App chalne ka koi fayda nahi.
        // Isliye process ko wahin rok do (Exit).
        process.exit(1); 
    }
};

export default connectDB;