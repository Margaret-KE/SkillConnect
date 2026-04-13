const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Jobseeker = require("../models/Jobseeker");

const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

/* ================= ENV ================= */
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

/* ================= FORMAT USER ================= */
function formatUser(u) {
    return {
        _id: u._id.toString(),
        id: u._id.toString(),

        name: u.name,
        phone: u.phone,
        type: u.type,

        sublocation: u.sublocation,
        location: u.location,
        age: u.age,
        gender: u.gender,

        primarySkill: u.primarySkill,
        otherSkills: u.otherSkills,

        educationLevel: u.educationLevel,
        certificate: u.certificate,
        disability: u.disability,
        idNumber: u.idNumber,
        cv: u.cv,

        date: u.date
    };
}

/* =====================================================
   LOGIN (PUBLIC)
===================================================== */
router.post("/login", async(req, res) => {
    try {
        const { name, phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Phone required"
            });
        }

        let user = await Jobseeker.findOne({ phone });

        if (!user) {
            user = await Jobseeker.create({
                name,
                phone,
                type: "online",
                date: new Date()
            });
        }

        const token = jwt.sign({
                id: user._id,
                role: "user"
            },
            JWT_SECRET, { expiresIn: "7d" }
        );

        res.json({
            success: true,
            token,
            user: formatUser(user)
        });

    } catch (err) {
        console.error("LOGIN ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

/* =====================================================
   GET MY PROFILE (USER)
===================================================== */
router.get("/profile",
    verifyToken,
    allowRoles("user"),
    async(req, res) => {
        try {
            const user = await Jobseeker.findById(req.user.id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            res.json(formatUser(user));

        } catch (err) {
            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);

/* =====================================================
   UPDATE PROFILE (USER)
===================================================== */
router.put("/profile",
    verifyToken,
    allowRoles("user"),
    async(req, res) => {
        try {
            const updated = await Jobseeker.findByIdAndUpdate(
                req.user.id, {
                    $set: {
                        ...req.body,
                        date: new Date()
                    }
                }, { new: true }
            );

            res.json({
                success: true,
                user: formatUser(updated)
            });

        } catch (err) {
            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);

/* =====================================================
   GET ALL JOBSEEKERS (ADMIN ONLY)
===================================================== */
router.get("/",
    verifyToken,
    allowRoles("admin"),
    async(req, res) => {
        try {
            const users = await Jobseeker.find().sort({ date: -1 });

            res.json(users.map(formatUser));

        } catch (err) {
            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);

/* =====================================================
   DELETE USER (ADMIN ONLY)
===================================================== */
router.delete("/:id",
    verifyToken,
    allowRoles("admin"),
    async(req, res) => {
        try {
            await Jobseeker.findByIdAndDelete(req.params.id);

            res.json({
                success: true,
                message: "User deleted"
            });

        } catch (err) {
            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);

module.exports = router;