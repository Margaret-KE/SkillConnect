const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
    name: String,
    phone: String,
    service: String,
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Request", requestSchema);