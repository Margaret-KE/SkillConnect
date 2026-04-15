const express = require("express");
const router = express.Router();

const Admin = require("../models/Admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

const JWT_SECRET = process.env.JWT_SECRET || "skillconnect_secret_key";

/* ================= ADMIN LOGIN ================= */
router.post("/login", async(req, res) => {
    const { username, password } = req.body;

    try {
        const admin = await Admin.findOne({ username });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // Support both hashed + legacy plain passwords
        let isMatch = false;

        if (admin.password.startsWith("$2b$")) {
            isMatch = await bcrypt.compare(password, admin.password);
        } else {
            isMatch = password === admin.password;
        }

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const token = jwt.sign({
                id: admin._id,
                role: admin.role || "admin"
            },
            JWT_SECRET, { expiresIn: "1d" }
        );

        res.json({
            success: true,
            token,
            admin: {
                id: admin._id,
                username: admin.username,
                role: admin.role || "admin"
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ================= CREATE ADMIN (SUPER ADMIN ONLY) ================= */
router.post("/create", verifyToken, allowRoles("superadmin"), async(req, res) => {
    try {
        const { username, password } = req.body;

        const exists = await Admin.findOne({ username });

        if (exists) {
            return res.json({
                success: false,
                message: "Admin already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = await Admin.create({
            username,
            password: hashedPassword,
            role: "admin"
        });

        res.json({
            success: true,
            admin: {
                id: newAdmin._id,
                username: newAdmin.username,
                role: newAdmin.role
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ================= GET ALL ADMINS ================= */
router.get("/all", verifyToken, async(req, res) => {
    try {
        const admins = await Admin.find().select("-password");
        res.json(admins);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ================= DELETE ADMIN ================= */
router.delete("/delete/:id", verifyToken, allowRoles("superadmin"), async(req, res) => {
    try {
        const adminToDelete = await Admin.findById(req.params.id);

        if (!adminToDelete) {
            return res.status(404).json({ message: "Admin not found" });
        }

        if (adminToDelete.role === "superadmin") {
            return res.status(403).json({
                message: "Cannot delete super admin"
            });
        }

        const totalAdmins = await Admin.countDocuments();

        if (totalAdmins <= 1) {
            return res.status(403).json({
                message: "Cannot delete last admin"
            });
        }

        await Admin.findByIdAndDelete(req.params.id);

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;