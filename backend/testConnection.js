require("dotenv").config();
const mongoose = require("mongoose");

async function testConnection() {
    try {
        console.log("🔄 Connecting to MongoDB...");

        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing in .env file");
        }

        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000, // 10s timeout
        });

        console.log("✅ MongoDB connection successful");

        await mongoose.disconnect();
        console.log("🔌 Disconnected cleanly");

        process.exit(0);

    } catch (err) {
        console.error("❌ MongoDB connection failed:");
        console.error(err.message);

        try {
            await mongoose.disconnect();
        } catch (e) {}

        process.exit(1);
    }
}

testConnection();