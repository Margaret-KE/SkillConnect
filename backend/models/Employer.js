const mongoose = require("mongoose");

const employerSchema = new mongoose.Schema({
    companyName: String,
    employerId: String
});

module.exports = mongoose.model("Employer", employerSchema);