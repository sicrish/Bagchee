import authMiddleware from './auth.middleware.js';

// Chains authMiddleware (JWT verify) -> allows role 'admin' OR 'staff'.
//
// Used ONLY on catalog data-entry routes (products, categories, sub-categories,
// authors, actors, artists, publishers, series, tags, languages, labels) so a
// restricted 'staff' login can do data entry. Every other admin route keeps
// adminAuth (admin-only), so a staff token is rejected there by default — that
// default-deny is the real security boundary, not the hidden sidebar menus.
const adminOrStaff = (req, res, next) => {
    authMiddleware(req, res, () => {
        const role = req.user?.role;
        if (role !== 'admin' && role !== 'staff') {
            return res.status(403).json({ status: false, msg: 'Admin access required' });
        }
        next();
    });
};

export default adminOrStaff;
