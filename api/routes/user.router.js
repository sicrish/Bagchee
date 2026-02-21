import express from 'express';
const router = express.Router();

// Imports
import * as usercontroller from '../controller/user.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

// ==========================================
// 🟢 1. PUBLIC ROUTES (No Changes)
// ==========================================
router.post("/register", usercontroller.register);
router.post("/login", usercontroller.login);
router.get("/fetch", usercontroller.fetch); // Ye purana fetch hai

// ==========================================
// 🔒 2. AUTH ROUTES (No Changes)
// ==========================================
router.get("/verify", authMiddleware, usercontroller.verifyUser);

// ==========================================
// 🛠️ 3. UPDATE & DELETE (DUAL SUPPORT)
// ==========================================

// ✅ Scenario A: User apna khud ka profile update/delete kar raha hai (Purana Code)
// Isme ID token se ya body se aayegi.
router.patch("/update", authMiddleware, usercontroller.update);
router.delete("/delete", authMiddleware, usercontroller.deleteuser);

// ✅ Scenario B: Admin kisi aur user ko update/delete kar raha hai (Naya Admin Panel)
// Isme ID URL me aayegi (e.g., /update/65a123...)
// Controller logic handle kar lega ki ID kahan se leni hai.
router.patch("/update/:id", authMiddleware, usercontroller.update);
router.delete("/delete/:id", authMiddleware, usercontroller.deleteuser);

// ==========================================
// 📋 4. NEW ADMIN ROUTES (For List & Edit Page)
// ==========================================
// Admin List ke liye (Frontend /list call kar raha hai) - Hum same fetch function use karenge
router.get("/list", usercontroller.fetch); 

// Edit Page ke liye data laana (Single User fetch by ID)
router.get("/get/:id", usercontroller.fetchUserById); 

// ==========================================
// 🔑 5. OTHER FEATURES (No Changes)
// ==========================================
router.post("/change-password", authMiddleware, usercontroller.changePassword);

// User-Specific Features
router.post("/add-wishlist", authMiddleware, usercontroller.addToWishlist);
router.post("/remove-wishlist", authMiddleware, usercontroller.removeFromWishlist);
router.get("/get-wishlist", authMiddleware, usercontroller.getWishlist);

router.post('/add-address', authMiddleware, usercontroller.addAddress);
router.post('/delete-address', authMiddleware, usercontroller.deleteAddress);
router.get('/get-addresses', authMiddleware, usercontroller.getAddresses);

export default router;