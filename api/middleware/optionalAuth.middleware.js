import jwt from 'jsonwebtoken';

// Tries to verify JWT if present — sets req.user if valid, leaves it undefined if not.
// Never blocks the request. Use on public routes that have optional admin behaviour.
const optionalAuth = (req, res, next) => {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        try {
            req.user = jwt.verify(token, process.env.JWT_SECRET_KEY);
        } catch (_) {
            // Invalid token on a public route — just ignore it
        }
    }
    next();
};

export default optionalAuth;
