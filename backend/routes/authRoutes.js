const router = require("express").Router();
const jwt = require("jsonwebtoken");
const Jobseeker = require("../models/Jobseeker");

/* ================= ENV ================= */
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

/* ================= LOGIN / AUTO REGISTER ================= */
router.post("/login", async (req, res) => {
    try {
        const { name, phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Phone number is required"
            });
        }

        let user = await Jobseeker.findOne({ phone });

        /* ================= AUTO REGISTER ================= */
        if (!user) {
            user = await Jobseeker.create({
                name: name || "User",
                phone,
                type: "online"
            });
        }

        /* ================= JWT TOKEN ================= */
        const token = jwt.sign(
            {
                id: user._id,
                type: user.type
            },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                type: user.type
            }
        });

    } catch (err) {
        console.error("❌ AUTH ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Authentication failed"
        });
    }
});

/* ================= VERIFY TOKEN (IMPORTANT FOR FRONTEND) ================= */
router.get("/me", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "No token provided"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await Jobseeker.findById(decoded.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json(user);

    } catch (err) {
        console.error("❌ VERIFY ERROR:", err.message);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
});

module.exports = router;