import authMiddleware from './auth.middleware.js';

// Chains authMiddleware (JWT verify) → admin role check.
// authMiddleware sets req.user from token; if token invalid it responds 401 and never calls next.
// If token is valid but role is not 'admin', we respond 403 here.
const adminAuth = (req, res, next) => {
    authMiddleware(req, res, () => {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ status: false, msg: 'Admin access required' });
        }
        next();
    });
};

export default adminAuth;
