const express = require("express");
const router = express.Router();
const Request = require("../models/Request");

/* ================= CREATE REQUEST ================= */
router.post("/", async(req, res) => {
    try {
        const request = new Request({
            name: req.body.name,
            phone: req.body.phone,
            service: req.body.service
        });

        await request.save();

        res.json({
            success: true,
            request: {
                id: request._id.toString(),
                name: request.name,
                phone: request.phone,
                service: request.service,
                date: request.date
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ================= GET ALL REQUESTS ================= */
router.get("/", async(req, res) => {
    try {
        const requests = await Request.find().sort({ date: -1 });

        const formatted = requests.map(r => ({
            id: r._id.toString(),
            name: r.name,
            phone: r.phone,
            service: r.service,
            date: r.date
        }));

        res.json(formatted);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ================= DELETE REQUEST ================= */
router.delete("/:id", async(req, res) => {
    try {
        await Request.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;