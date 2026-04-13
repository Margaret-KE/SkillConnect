const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema({
    jobId: String,
    jobTitle: String,

    employerId: String,
    employerName: String,

    applicantId: String,
    applicantName: String,
    applicantPhone: String,

    skill: String,
    type: String,
    location: String,

    status: {
        type: String,
        default: "applied"
        // applied | invited | accepted | rejected
    },

    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Application", ApplicationSchema);