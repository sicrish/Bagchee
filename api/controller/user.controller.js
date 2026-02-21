import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import sendMail from './email.controller.js';
import UserSchemaModel from '../models/user.model.js';
import dotenv from 'dotenv';

// 🟢 1. Local File Utilities Import (Cloudinary Removed)
import { saveFileLocal, deleteFileLocal } from '../utils/fileHandler.js';

dotenv.config();

// ==========================================
// 🔐 VERIFY USER (Token Check)
// ==========================================
export const verifyUser = async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(400).json({ success: false, msg: "Invalid Token Data" });
        }
        const user = await UserSchemaModel.findById(req.user.userId).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, msg: "User not found" });
        }
        res.status(200).json({ 
            success: true, 
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role, 
                profileImage: user.profileImage
            } 
        });
    } catch (error) {
        console.error("Verify Error:", error);
        res.status(500).json({ success: false, msg: "Server Error during verification" });
    }
};

// ==========================================
// 📝 REGISTER USER (Local Storage & Safe)
// ==========================================
export const register = async (req, res) => {
    try {
        console.log("🔹 Register Request Body:", req.body);

        // 1. Data Extraction (Frontend aur Backend dono styles handle karein)
        let { 
            // React se ye aayenge:
            firstName, lastName, 
            // Admin panel se ye aa sakte hain:
            firstname, lastname, 
            // Common fields:
            username, email, password, status, company, phone, membership, membershipStart, membershipEnd, isGuest
        } = req.body;

        // 🟢 FIX 1: Name Normalization (Sabko ek variable me lo)
        // Agar 'firstname' hai to wo lo, nahi to 'firstName', nahi to empty string
        const finalFirstName = firstname || firstName || "";
        const finalLastName = lastname || lastName || "";

        // 🟢 FIX 2: Generate Full Name (Model me 'name' required hai isliye ye zaruri hai)
        const fullName = `${finalFirstName} ${finalLastName}`.trim() || username || "Unknown User";

        // 🟢 FIX 3: Auto-Generate Username (Agar missing hai)
        if (!username && email) {
            username = email.split('@')[0]; 
        }
        if (!finalFirstName) {
            return res.status(400).json({ status: false, msg: "First Name is required." });
        }
       // 2. Strict Validation (Specific Messages)
       if (!email) {
        return res.status(400).json({ status: false, msg: "Email is required." });
    }

    if (!password) {
        return res.status(400).json({ status: false, msg: "Password is required." });
    }

        // 3. Duplicate Check
        const existingUser = await UserSchemaModel.findOne({ 
            $or: [{ email: email }, { username: username }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ status: false, msg: "User already exists with this email or username." });
        }

        // 4. Image Upload Logic (Same as before)
        let profileImageUrl = "";
        if (req.files && req.files.profileImage) {
            try {
                profileImageUrl = await saveFileLocal(req.files.profileImage, "users");
            } catch (uploadError) {
                return res.status(400).json({ status: false, msg: uploadError.message });
            }
        }

        // 5. Password Hashing
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 6. Create User Object
        // Yahan hum model ko 'firstname', 'lastname' aur 'name' teeno de rahe hain
        const newUser = new UserSchemaModel({
            name: fullName,           // ✅ Required field satisfied
            firstname: finalFirstName, // ✅ Data consistency
            lastname: finalLastName,   // ✅ Data consistency
            username: username,
            email: email,
            password: hashedPassword,
            role: "user",
            status: status || 1,
            company: company || "",
            // Phone check (Empty string mat bhejo, undefined bhejo taaki unique error na aaye)
            phone: (phone && phone.trim() !== "") ? phone : undefined,
            profileImage: profileImageUrl,
            membership: membership || "inactive",
            membershipStart: membershipStart || null,
            membershipEnd: membershipEnd || null,
            isGuest: isGuest || "inactive"
        });

        // 7. Save to DB
        // Tumhara pre('save') hook chalega, par kyunki humne data pehle hi sahi de diya hai, wo confuse nahi hoga.
        const user = await newUser.save();

        // Optional: Send Email
        if(user){
            try { await sendMail(user.email, user.name); } catch(e) { console.error("Email failed", e); }
        }

        res.status(201).json({ status: true, msg: "User registered successfully", userId: user._id });

    } catch (error) {
        console.error("🔥 Register Controller Crash:", error);
        
        if (error.code === 11000) {
            // Duplicate key error handle karne ke liye
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({ status: false, msg: `Duplicate value entered for ${field}` });
        }
        res.status(500).json({ status: false, msg: "Registration failed due to server error.", error: error.message });
    }
};

// ==========================================
// 🔑 LOGIN USER
// ==========================================
export const login = async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body; 

        if (!email || !password) {
            return res.status(400).json({ status: false, msg: "Email and Password required" });
        }

        const user = await UserSchemaModel.findOne({ email: email });
        if (!user) return res.status(404).json({ status: false, msg: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ status: false, msg: "Invalid Credentials" });

        const secretKey = process.env.JWT_SECRET_KEY; 
        const payload = { subject: user.email, userId: user._id, role: user.role };
        const expireTime = rememberMe ? '7d' : '1h';
        const token = jwt.sign(payload, secretKey, { expiresIn: expireTime });

        res.status(200).json({ 
            status: true,
            msg: "Login Success",
            token: token, 
            userDetails: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,          
                profileImage: user.profileImage, 
                role: user.role,
                membership: user.membership
            }
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ status: false, msg: "Login Error", error: error.message });
    }
};

// ==========================================
// 📋 FETCH USERS
// ==========================================
export const fetch = async (req, res) => {
    try {
        const condition_obj = req.query; 
        const userList = await UserSchemaModel.find(condition_obj);
        
        if (userList.length > 0) {
            res.status(200).json({ status: true, data: userList });
        } else {
            res.status(404).json({ status: false, msg: "No users found" });
        }
    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error" });
    }
};

// ==========================================
// 👤 FETCH SINGLE USER
// ==========================================
export const fetchUserById = async (req, res) => {
    try {
        const { id } = req.params;
        if(!id) return res.status(400).json({ status: false, msg: "ID missing" });

        const user = await UserSchemaModel.findById(id);
        
        if (user) {
            res.status(200).json({ status: true, data: user });
        } else {
            res.status(404).json({ status: false, msg: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// ==========================================
// ✏️ UPDATE USER (Safe Local Image Swap)
// ==========================================
export const update = async (req, res) => {
    try {
        const userId = req.body.userId || req.params.id;
        const { ...updateFields } = req.body;

        if (!userId) {
            return res.status(400).json({ status: false, msg: "User ID is required" });
        }

        // Clean Phone Number
        if (updateFields.phone === "") {
            updateFields.phone = undefined;
        }

        // 🟢 IMAGE UPDATE LOGIC
        if (req.files && req.files.profileImage) {
            try {
                // 1. Pehle user dhundo
                const currentUser = await UserSchemaModel.findById(userId);

                // 2. Nayi image save karne ki koshish karo
                const newImagePath = await saveFileLocal(req.files.profileImage);
                
                // Agar save success ho gaya, tabhi purani delete karo (Safety)
                if (newImagePath) {
                    if (currentUser && currentUser.profileImage) {
                        await deleteFileLocal(currentUser.profileImage);
                    }
                    // Fields update karo
                    updateFields.profileImage = newImagePath;
                }

            } catch (uploadError) {
                console.error("Image Update Failed:", uploadError.message);
                return res.status(400).json({ status: false, msg: `Image Error: ${uploadError.message}` });
            }
        }

        // Manual Name Sync Logic
        if (updateFields.firstname || updateFields.lastname) {
            const currentUser = await UserSchemaModel.findById(userId);
            const fName = updateFields.firstname || (currentUser ? currentUser.firstname : "");
            const lName = updateFields.lastname || (currentUser ? currentUser.lastname : "");
            updateFields.name = `${fName} ${lName}`.trim();
        }

        // Database Update
        const user = await UserSchemaModel.findByIdAndUpdate(
            userId,
            { $set: updateFields },
            { new: true, runValidators: true } 
        );

        if (user) {
            res.status(200).json({ status: true, msg: "Profile Updated Successfully", data: user });
        } else {
            res.status(404).json({ status: false, msg: "User not found" });
        }

    } catch (error) {
        console.error("🔥 Update Controller Crash:", error);
        if (error.code === 11000) {
            return res.status(400).json({ status: false, msg: "Duplicate data (Email/Phone/Username) exists." });
        }
        res.status(500).json({ status: false, msg: "Update Failed", error: error.message });
    }
};

// ==========================================
// 🗑️ DELETE USER (Local File Cleanup)
// ==========================================
export const deleteuser = async (req, res) => {
    try {
        const userId = req.params.id || req.body._id;
        if(!userId) return res.status(400).json({status: false, msg: "User ID Required"});

        const userToDelete = await UserSchemaModel.findById(userId);
        if (!userToDelete) return res.status(404).json({ status: false, msg: "User not found" });

        // 🟢 Delete Local Image
        if (userToDelete.profileImage) {
            try {
                await deleteFileLocal(userToDelete.profileImage);
            } catch (e) { 
                console.error("Image delete failed (ignoring to continue user delete):", e); 
            }
        }

        await UserSchemaModel.deleteOne({ _id: userId });
        res.status(200).json({ status: true, msg: "User deleted successfully" });
        
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ status: false, msg: "Deletion Failed", error: error.message });
    }
};  

// 7. WISHLIST LOGIC (Unchanged)
export const addToWishlist = async (req, res) => {
    try {
        const { userId, productId } = req.body;
        const user = await UserSchemaModel.findByIdAndUpdate(
            userId,
            { $addToSet: { wishlist: productId } }, 
            { new: true }
        );
        res.status(200).json({ status: true, msg: "Added to wishlist", wishlist: user.wishlist });
    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

export const removeFromWishlist = async (req, res) => {
    try {
        const { userId, productId } = req.body;
        const user = await UserSchemaModel.findByIdAndUpdate(
            userId,
            { $pull: { wishlist: productId } },
            { new: true }
        );
        res.status(200).json({ status: true, msg: "Removed from wishlist", wishlist: user.wishlist });
    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

export const getWishlist = async (req, res) => {
    try {
        const userId = req.query.userId;
        const user = await UserSchemaModel.findById(userId).populate("wishlist");

        if (!user) {
            return res.status(404).json({ status: false, msg: "User not found" });
        }
        res.status(200).json({ status: true, wishlist: user.wishlist });
    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// 8. CHANGE PASSWORD (Unchanged)
export const changePassword = async (req, res) => {
    try {
        const { userId, oldPassword, newPassword } = req.body;

        const user = await UserSchemaModel.findById(userId);
        if (!user) {
            return res.status(404).json({ status: false, msg: "User not found" });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ status: false, msg: "Incorrect old password" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ status: true, msg: "Password changed successfully" });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// 9. ADDRESS MANAGEMENT (Unchanged)
export const addAddress = async (req, res) => {
    try {
        const { userId, ...addressData } = req.body;
        if (!userId) return res.status(400).json({ status: false, msg: "User ID required" });

        const user = await UserSchemaModel.findByIdAndUpdate(
            userId,
            { $push: { address: addressData } }, 
            { new: true }
        );

        if (user) {
            res.status(200).json({ status: true, msg: "Address added", addresses: user.address });
        } else {
            res.status(404).json({ status: false, msg: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

export const deleteAddress = async (req, res) => {
    try {
        const { userId, addressId } = req.body;
        if (!userId || !addressId) return res.status(400).json({ status: false, msg: "Ids required" });

        const user = await UserSchemaModel.findByIdAndUpdate(
            userId,
            { $pull: { address: { _id: addressId } } }, 
            { new: true }
        );

        if (user) {
            res.status(200).json({ status: true, msg: "Address deleted", addresses: user.address });
        } else {
            res.status(404).json({ status: false, msg: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

export const getAddresses = async (req, res) => {
    try {
        const userId = req.query.userId;
        if(!userId) return res.status(400).json({ status: false, msg: "User ID required" });

        const user = await UserSchemaModel.findById(userId);
        if (user) {
            res.status(200).json({ status: true, addresses: user.address });
        } else {
            res.status(404).json({ status: false, msg: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};