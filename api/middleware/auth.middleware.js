import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    const authHeader = req.header("Authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ status: false, msg: "Access Denied" });
    }

    try {
        const secretKey = process.env.JWT_SECRET_KEY;
        const verified = jwt.verify(token, secretKey);
        req.user = verified;
        next();
    } catch (err) {
        return res.status(401).json({ status: false, msg: "Invalid Token" });
    }
};

export default authMiddleware;