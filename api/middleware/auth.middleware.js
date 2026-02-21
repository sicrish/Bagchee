import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    const authHeader = req.header("Authorization");
    console.log("Auth Header Received:", authHeader);
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ success: false, msg: "Access Denied" });
    }

    try {
        const secretKey = process.env.JWT_SECRET_KEY;
        const verified = jwt.verify(token, secretKey);
        req.user = verified; 
        next();
    } catch (err) {
        res.status(401).json({ success: false, msg: "Invalid Token" });
    }
};

export default authMiddleware;