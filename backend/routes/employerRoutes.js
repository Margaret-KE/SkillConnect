const express = require("express");
const router = express.Router();
const Employer = require("../models/Employer");


// ================= LOGIN (NO PASSWORD) =================
router.post("/login", async(req, res) => {
    const { companyName, employerId } = req.body;

    try {
        let employer = await Employer.findOne({ employerId });

        // 🔥 Auto-register if not exists
        if (!employer) {
            employer = new Employer({
                companyName,
                employerId
            });

            await employer.save();
        }

        res.json({
            success: true,
            employer: {
                id: employer._id.toString(),
                company: employer.companyName,
                employerId: employer.employerId
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;