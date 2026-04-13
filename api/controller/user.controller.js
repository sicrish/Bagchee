import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import sendMail, { sendPasswordResetEmail } from './email.controller.js';
import prisma from '../lib/prisma.js';
import dotenv from 'dotenv';
import { saveFileLocal, deleteFileLocal } from '../utils/fileHandler.js';

dotenv.config();

// Field mapping: firstname→firstName, lastname→lastName, isGuest(string)→isGuest(Boolean).
// Wishlist: Wishlist junction table (@@unique([userId,productId])) — upsert or P2002 catch.
// Address: separate Address table with userId FK (not embedded array).
// phone: nullable (no unique constraint — use null not undefined).

export const verifyUser = async (req, res) => {
    try {
        if (!req.user?.userId) return res.status(400).json({ success: false, msg: 'Invalid Token Data' });
        const user = await prisma.user.findUnique({
            where: { id: parseInt(req.user.userId) },
            select: { id: true, name: true, email: true, role: true, profileImage: true }
        });
        if (!user) return res.status(404).json({ success: false, msg: 'User not found' });
        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, msg: 'Server Error during verification' });
    }
};

export const register = async (req, res) => {
    try {
        let { firstName, lastName, firstname, lastname, username, email, password,
            status, company, phone, membership, membershipStart, membershipEnd, isGuest } = req.body;

        const finalFirstName = firstname || firstName || '';
        const finalLastName = lastname || lastName || '';
        const fullName = `${finalFirstName} ${finalLastName}`.trim() || username || 'Unknown User';

        if (!username && email) username = email.split('@')[0];
        if (!finalFirstName) return res.status(400).json({ status: false, msg: 'First Name is required.' });
        if (!email) return res.status(400).json({ status: false, msg: 'Email is required.' });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ status: false, msg: 'Invalid email format.' });
        if (!password) return res.status(400).json({ status: false, msg: 'Password is required.' });
        if (password.length < 8) return res.status(400).json({ status: false, msg: 'Password must be at least 8 characters.' });
        if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
            return res.status(400).json({ status: false, msg: 'Password must contain at least one uppercase letter and one number.' });
        }

        const existing = await prisma.user.findFirst({
            where: { OR: [{ email }, { username: username || '' }] }
        });
        if (existing) return res.status(400).json({ status: false, msg: 'User already exists with this email or username.' });

        let profileImageUrl = '';
        if (req.files?.profileImage) {
            try {
                profileImageUrl = await saveFileLocal(req.files.profileImage, 'users');
            } catch (uploadError) {
                return res.status(400).json({ status: false, msg: uploadError.message });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name: fullName,
                firstName: finalFirstName,
                lastName: finalLastName,
                username: username || '',
                email,
                password: hashedPassword,
                role: 'user',
                status: Number(status) || 1,
                company: company || '',
                phone: phone?.trim() || null,
                profileImage: profileImageUrl,
                membership: membership || 'inactive',
                membershipStart: membershipStart ? new Date(membershipStart) : null,
                membershipEnd: membershipEnd ? new Date(membershipEnd) : null,
                isGuest: isGuest === true || isGuest === 'active'
            }
        });

        try { await sendMail(user.email, user.name); } catch (e) { /* email non-critical */ }

        res.status(201).json({ status: true, msg: 'User registered successfully', userId: user.id });
    } catch (error) {
        if (error.code === 'P2002') {
            const field = error.meta?.target?.[0] || 'field';
            return res.status(400).json({ status: false, msg: `Duplicate value for ${field}` });
        }
        res.status(500).json({ status: false, msg: 'Registration failed.' });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;
        if (!email || !password) return res.status(400).json({ status: false, msg: 'Email and Password required' });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ status: false, msg: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ status: false, msg: 'Invalid Credentials' });

        const payload = { subject: user.email, userId: user.id, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: rememberMe ? '7d' : '1h' });

        res.status(200).json({
            status: true, msg: 'Login Success', token,
            userDetails: {
                id: user.id, name: user.name, email: user.email,
                phone: user.phone, profileImage: user.profileImage,
                role: user.role, membership: user.membership,
                forceDirectPayment: user.forceDirectPayment
            }
        });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Login Error' });
    }
};

export const fetch = async (req, res) => {
    try {
        const { page, limit, role, status: statusFilter, email } = req.query;
        const pageNum = Math.max(1, parseInt(page) || 1);
        const pageSize = Math.min(100, Math.max(1, parseInt(limit) || 10));
        const skip = (pageNum - 1) * pageSize;

        const where = {};
        if (role) where.role = role;
        if (statusFilter !== undefined && statusFilter !== '') where.status = parseInt(statusFilter);
        if (email) where.email = { contains: email, mode: 'insensitive' };

        const [userList, total] = await Promise.all([
            prisma.user.findMany({
                where, orderBy: { createdAt: 'desc' }, skip, take: pageSize,
                select: { id: true, name: true, firstName: true, lastName: true, email: true,
                    username: true, phone: true, role: true, status: true, profileImage: true,
                    membership: true, createdAt: true }
            }),
            prisma.user.count({ where })
        ]);

        res.status(200).json({
            status: true, data: userList, total,
            totalPages: Math.ceil(total / pageSize), currentPage: pageNum,
            msg: userList.length > 0 ? 'Users fetched' : 'No users found'
        });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const fetchUserById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (!id) return res.status(400).json({ status: false, msg: 'ID missing' });
        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true, name: true, firstName: true, lastName: true, email: true,
                username: true, phone: true, role: true, status: true, profileImage: true,
                membership: true, membershipStart: true, membershipEnd: true, company: true,
                gender: true, city: true, state: true, pincode: true, country: true, createdAt: true,
                forceDirectPayment: true }
        });
        if (!user) return res.status(404).json({ status: false, msg: 'User not found' });
        res.status(200).json({ status: true, data: user });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const update = async (req, res) => {
    try {
        // If no :id param, user is updating their own profile; admins can update any user by id
        const userId = req.params.id ? parseInt(req.params.id) : parseInt(req.user.userId);
        if (!userId || isNaN(userId)) return res.status(400).json({ status: false, msg: 'User ID is required' });

        // SECURITY: Non-admin users can only update their own profile
        if (req.user.role !== 'admin' && userId !== parseInt(req.user.userId)) {
            return res.status(403).json({ status: false, msg: 'You can only update your own profile' });
        }

        const existing = await prisma.user.findUnique({ where: { id: userId } });
        if (!existing) return res.status(404).json({ status: false, msg: 'User not found' });

        const updateData = {};

        // SECURITY: Only admins can change role, status, or membership fields
        const isAdmin = req.user.role === 'admin';

        // Image update
        if (req.files?.profileImage) {
            try {
                const newPath = await saveFileLocal(req.files.profileImage, 'users');
                if (existing.profileImage) await deleteFileLocal(existing.profileImage);
                updateData.profileImage = newPath;
            } catch (err) {
                return res.status(400).json({ status: false, msg: `Image Error: ${err.message}` });
            }
        }

        // Scalar fields
        const { firstname, lastname, firstName, lastName, username, email, phone,
            company, role, status, membership, membershipStart, membershipEnd, gender,
            city, state, pincode, country } = req.body;

        const fName = firstname || firstName;
        const lName = lastname || lastName;

        if (fName !== undefined) updateData.firstName = fName;
        if (lName !== undefined) updateData.lastName = lName;
        if (fName !== undefined || lName !== undefined) {
            updateData.name = `${fName ?? existing.firstName} ${lName ?? existing.lastName}`.trim();
        }
        if (username !== undefined) updateData.username = username;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone?.trim() || null;
        if (company !== undefined) updateData.company = company;
        // SECURITY: Only admins can escalate roles or change account status/membership
        if (role !== undefined && isAdmin) updateData.role = role;
        if (status !== undefined && isAdmin) updateData.status = parseInt(status);
        if (membership !== undefined && isAdmin) updateData.membership = membership;
        if (membershipStart !== undefined && isAdmin) updateData.membershipStart = membershipStart ? new Date(membershipStart) : null;
        if (membershipEnd !== undefined && isAdmin) updateData.membershipEnd = membershipEnd ? new Date(membershipEnd) : null;
        if (gender !== undefined) updateData.gender = gender;
        if (city !== undefined) updateData.city = city;
        if (state !== undefined) updateData.state = state;
        if (pincode !== undefined) updateData.pincode = pincode;
        if (country !== undefined) updateData.country = country;
        // Admin-only: override payment gateway behaviour for this user
        if (req.body.forceDirectPayment !== undefined && isAdmin) {
            updateData.forceDirectPayment = req.body.forceDirectPayment === true || req.body.forceDirectPayment === 'true';
        }

        const user = await prisma.user.update({ where: { id: userId }, data: updateData });
        res.status(200).json({ status: true, msg: 'Profile Updated Successfully', data: user });
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ status: false, msg: 'Duplicate data (Email/Username) exists.' });
        res.status(500).json({ status: false, msg: 'Update Failed' });
    }
};

export const deleteuser = async (req, res) => {
    try {
        const userId = req.params.id ? parseInt(req.params.id) : parseInt(req.user.userId);
        if (!userId || isNaN(userId)) return res.status(400).json({ status: false, msg: 'User ID Required' });

        // SECURITY: Non-admin users can only delete their own account
        if (req.user.role !== 'admin' && userId !== parseInt(req.user.userId)) {
            return res.status(403).json({ status: false, msg: 'Access denied' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ status: false, msg: 'User not found' });

        if (user.profileImage) {
            try { await deleteFileLocal(user.profileImage); } catch (e) { /* non-critical */ }
        }

        // Cascade: addresses, wishlist, orders deleted automatically via onDelete: Cascade
        await prisma.user.delete({ where: { id: userId } });
        res.status(200).json({ status: true, msg: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Deletion Failed' });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { oldPassword, currentPassword, newPassword } = req.body;
        const prevPassword = oldPassword || currentPassword;
        const user = await prisma.user.findUnique({ where: { id: parseInt(req.user.userId) } });
        if (!user) return res.status(404).json({ status: false, msg: 'User not found' });

        const isMatch = await bcrypt.compare(prevPassword, user.password);
        if (!isMatch) return res.status(400).json({ status: false, msg: 'Incorrect old password' });
        if (!newPassword || newPassword.length < 8) return res.status(400).json({ status: false, msg: 'New password must be at least 8 characters.' });
        if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            return res.status(400).json({ status: false, msg: 'New password must contain at least one uppercase letter and one number.' });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
        res.status(200).json({ status: true, msg: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ status: false, msg: 'Email is required.' });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Return success even if user not found to prevent email enumeration
            return res.status(200).json({ status: true, msg: 'If an account with that email exists, a reset link has been sent.' });
        }

        // Generate a secure random token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        await prisma.user.update({
            where: { id: user.id },
            data: { resetToken, resetTokenExpiry }
        });

        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

        await sendPasswordResetEmail(email, user.name || user.firstName || 'User', resetLink);

        res.status(200).json({ status: true, msg: 'If an account with that email exists, a reset link has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error.message);
        res.status(500).json({ status: false, msg: 'Server Error. Please try again later.' });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, token, newPassword } = req.body;
        if (!email || !token || !newPassword) {
            return res.status(400).json({ status: false, msg: 'Email, token, and new password are required.' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ status: false, msg: 'Password must be at least 8 characters.' });
        }
        if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            return res.status(400).json({ status: false, msg: 'Password must contain at least one uppercase letter and one number.' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ status: false, msg: 'Invalid or expired reset link.' });

        // Validate token and expiry
        if (!user.resetToken || user.resetToken !== token) {
            return res.status(400).json({ status: false, msg: 'Invalid or expired reset link.' });
        }
        if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
            return res.status(400).json({ status: false, msg: 'Reset link has expired. Please request a new one.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            }
        });

        res.status(200).json({ status: true, msg: 'Password reset successfully! You can now login.' });
    } catch (error) {
        console.error('Reset password error:', error.message);
        res.status(500).json({ status: false, msg: 'Server Error. Please try again later.' });
    }
};

// Wishlist — Wishlist junction table with @@unique([userId, productId])
export const addToWishlist = async (req, res) => {
    try {
        const userId = parseInt(req.user.userId);
        const productId = parseInt(req.body.productId);
        // upsert: create if not exists, no-op if already exists
        await prisma.wishlist.upsert({
            where: { userId_productId: { userId, productId } },
            update: {},
            create: { userId, productId }
        });
        const wishlist = await prisma.wishlist.findMany({ where: { userId }, select: { productId: true } });
        res.status(200).json({ status: true, msg: 'Added to wishlist', wishlist: wishlist.map(w => w.productId) });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const removeFromWishlist = async (req, res) => {
    try {
        const userId = parseInt(req.user.userId);
        const productId = parseInt(req.body.productId);
        await prisma.wishlist.deleteMany({ where: { userId, productId } });
        const wishlist = await prisma.wishlist.findMany({ where: { userId }, select: { productId: true } });
        res.status(200).json({ status: true, msg: 'Removed from wishlist', wishlist: wishlist.map(w => w.productId) });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getWishlist = async (req, res) => {
    try {
        const userId = parseInt(req.user.userId);
        const entries = await prisma.wishlist.findMany({
            where: { userId },
            include: {
                product: {
                    select: { id: true, title: true, price: true, inrPrice: true, realPrice: true,
                        discount: true, defaultImage: true, bagcheeId: true, isbn13: true, isActive: true }
                }
            }
        });
        const wishlist = entries.filter(e => e.product).map(e => e.product);
        res.status(200).json({ status: true, wishlist });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

// Address — separate Address table, not embedded array
export const addAddress = async (req, res) => {
    try {
        const userId = parseInt(req.user.userId);
        const { type, firstName, lastname, lastName, houseNo, street,
            address2, landmark, city, state, pincode, country, phone, company, isDefault } = req.body;

        const address = await prisma.address.create({
            data: {
                userId,
                type: type || 'Home',
                firstName: firstName || '',
                lastName: lastname || lastName || '',
                houseNo: houseNo || '',
                street: street || '',
                address2: address2 || '',
                landmark: landmark || '',
                city: city || '',
                state: state || '',
                pincode: pincode || '',
                country: country || 'India',
                phone: phone || '',
                company: company || '',
                isDefault: isDefault === true || isDefault === 'true'
            }
        });
        const addresses = await prisma.address.findMany({ where: { userId } });
        res.status(200).json({ status: true, msg: 'Address added', addresses });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const deleteAddress = async (req, res) => {
    try {
        const userId = parseInt(req.user.userId);
        const { addressId } = req.body;
        if (!addressId) return res.status(400).json({ status: false, msg: 'Address ID required' });
        await prisma.address.deleteMany({ where: { id: parseInt(addressId), userId } });
        const addresses = await prisma.address.findMany({ where: { userId } });
        res.status(200).json({ status: true, msg: 'Address deleted', addresses });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};

export const getAddresses = async (req, res) => {
    try {
        const userId = parseInt(req.user.userId);
        const addresses = await prisma.address.findMany({ where: { userId }, orderBy: { id: 'asc' } });
        res.status(200).json({ status: true, addresses });
    } catch (error) {
        res.status(500).json({ status: false, msg: 'Server Error' });
    }
};
