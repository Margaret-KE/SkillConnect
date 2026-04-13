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
// ✅ increased for CV uploads (base64 files)

/* ================= ROUTES ================= */
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const requestRoutes = require("./routes/requestRoutes");
const jobseekerRoutes = require("./routes/jobseekerRoutes");
const authRoutes = require("./routes/authRoutes");

/* ================= API MOUNTING ================= */
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/jobseekers", jobseekerRoutes);

/* ================= HEALTH CHECK ================= */
app.get("/", (req, res) => {
    res.json({
        status: "OK",
        message: " SkillConnect API Running",
        time: new Date().toISOString()
    });
});

/* ================= ERROR HANDLER (IMPORTANT) ================= */
app.use((err, req, res, next) => {
    console.error(" Server Error:", err.message);
    res.status(500).json({
        success: false,
        message: "Internal Server Error"
    });
});

/* ================= DATABASE CONNECTION ================= */
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log(" MongoDB Connected");
    })
    .catch(err => {
        console.error(" DB Error:", err);
        process.exit(1);
    });

/* ================= START SERVER ================= */
app.listen(PORT, () => {
    console.log(` Server running on port ${PORT}`);
});