import express from 'express';
const router = express.Router();

import * as usercontroller from '../controller/user.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

// PUBLIC — no auth needed
router.post("/register",        usercontroller.register);
router.post("/login",           usercontroller.login);
router.post("/forgot-password", usercontroller.forgotPassword);
router.post("/reset-password",  usercontroller.resetPassword);

// ADMIN — fetch/list all users or single user by id
router.get("/fetch",    adminAuth, usercontroller.fetch);
router.get("/list",     adminAuth, usercontroller.fetch);
router.get("/get/:id",  adminAuth, usercontroller.fetchUserById);

// AUTH — verify own token
router.get("/verify", authMiddleware, usercontroller.verifyUser);

// AUTH — user updates/deletes own account
router.patch("/update",    authMiddleware, usercontroller.update);
router.delete("/delete",   authMiddleware, usercontroller.deleteuser);

// ADMIN — admin updates/deletes any account by id
router.patch("/update/:id",  adminAuth, usercontroller.update);
router.delete("/delete/:id", adminAuth, usercontroller.deleteuser);

// AUTH — password change
router.post("/change-password", authMiddleware, usercontroller.changePassword);

// AUTH — wishlist
router.post("/add-wishlist",    authMiddleware, usercontroller.addToWishlist);
router.post("/remove-wishlist", authMiddleware, usercontroller.removeFromWishlist);
router.get("/get-wishlist",     authMiddleware, usercontroller.getWishlist);

// AUTH — addresses
router.post("/add-address",    authMiddleware, usercontroller.addAddress);
router.post("/delete-address", authMiddleware, usercontroller.deleteAddress);
router.get("/get-addresses",   authMiddleware, usercontroller.getAddresses);

export default router;
