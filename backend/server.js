const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

/* ================= CONFIG ================= */
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

/* ================= SECURITY MIDDLEWARE ================= */
app.use(cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true
}));

app.use(express.json({ limit: "10mb" }));

/* ================= ROUTES ================= */
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const requestRoutes = require("./routes/requestRoutes");
const jobseekerRoutes = require("./routes/jobseekerRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes"); // ✅ ADD THIS

/* ================= API MOUNTING ================= */
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/jobseekers", jobseekerRoutes);
app.use("/api/admin", adminRoutes); // ✅ ADD THIS

/* ================= HEALTH CHECK ================= */
app.get("/", (req, res) => {
    res.json({
        status: "OK",
        message: "SkillConnect API Running",
        time: new Date().toISOString()
    });
});

/* ================= ERROR HANDLER ================= */
app.use((err, req, res, next) => {
    console.error("Server Error:", err.message);
    res.status(500).json({
        success: false,
        message: "Internal Server Error"
    });
});

/* ================= SUPERADMIN BOOTSTRAP ================= */
const Admin = require("./models/Admin");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

async function createFirstSuperAdmin() {
    try {
        const count = await Admin.countDocuments();

        if (count > 0) {
            console.log("Admin already exists. Bootstrap skipped.");
            return;
        }

        const rawPassword = crypto.randomBytes(6).toString("hex");
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        await Admin.create({
            username: "owner",
            password: hashedPassword,
            role: "superadmin"
        });

        console.log("SUPERADMIN CREATED");
        console.log("Username: owner");
        console.log("Password:", rawPassword);
        console.log("CHANGE PASSWORD AFTER LOGIN");

        // ⚠️ Email removed on purpose (safe optional system)

    } catch (err) {
        console.error("Bootstrap error:", err.message);
    }
}

/* ================= DATABASE CONNECTION ================= */
mongoose.connect(MONGO_URI)
    .then(async() => {
        console.log("MongoDB Connected");

        await createFirstSuperAdmin(); // 🔐 safe bootstrap

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error("DB Error:", err);
        process.exit(1);
    });