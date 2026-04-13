const mongoose = require("mongoose");

const JobseekerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    phone: {
        type: String,
        required: true,
        unique: true
    },

    type: {
        type: String,
        enum: ["online", "field"],
        default: "online"
    },

    sublocation: String,
    location: String,

    age: Number,
    gender: String,

    idNumber: String, //  added
    disability: String, //  added

    primarySkill: String,
    otherSkills: String,

    educationLevel: String,

    cv: String,

}, {
    timestamps: true //  auto adds createdAt & updatedAt
});

module.exports = mongoose.model("Jobseeker", JobseekerSchema);