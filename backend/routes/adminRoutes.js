const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");

router.post("/login", async(req, res) => {
    const { username, password } = req.body;

    try {
        const admin = await Admin.findOne({ username, password });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        res.json({
            success: true,
            admin
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;