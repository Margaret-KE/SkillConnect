const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
    title: String,
    skill: String,
    location: String,
    description: String,

    employerId: String,
    employerName: String,

    status: {
        type: String,
        default: "pending"
    },

    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Job", jobSchema);