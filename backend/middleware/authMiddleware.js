const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

/* ================= VERIFY TOKEN ================= */
function verifyToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: "No token provided" });
        }

        // SUPPORT BOTH:
        // "Bearer token" OR "token"
        const token = authHeader.startsWith("Bearer ") ?
            authHeader.split(" ")[1] :
            authHeader;

        if (!token) {
            return res.status(401).json({ message: "Malformed token" });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        req.user = decoded; // { id, username, role }
        next();

    } catch (err) {
        console.error("Auth error:", err.message);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}

/* ================= ROLE GUARD ================= */
function allowRoles(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Access denied" });
        }

        next();
    };
}

module.exports = {
    verifyToken,
    allowRoles
};