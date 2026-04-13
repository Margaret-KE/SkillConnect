const express = require("express");
const router = express.Router();
const Job = require("../models/Job");

const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

/* ================= FORMAT JOB ================= */
function formatJob(j) {
    return {
        _id: j._id.toString(),
        id: j._id.toString(),

        title: j.title || "",
        skill: j.skill || "",
        location: j.location || "",
        description: j.description || "",

        employerId: j.employerId || "",
        employerName: j.employerName || "",
        company: j.employerName || "",

        status: j.status || "pending",

        date: j.date || j.createdAt || new Date()
    };
}

/* =====================================================
   CREATE JOB (EMPLOYER ONLY)
===================================================== */
router.post(
    "/",
    verifyToken,
    allowRoles("employer"),
    async(req, res) => {
        try {
            const job = new Job({
                title: req.body.title,
                skill: req.body.skill,
                location: req.body.location,
                description: req.body.description || "",
                employerId: req.user.id,
                employerName: req.user.name || "",
                status: "pending",
                date: new Date()
            });

            await job.save();

            res.json({
                success: true,
                job: formatJob(job)
            });

        } catch (err) {
            console.error("POST JOB ERROR:", err);
            res.status(500).json({
                success: false,
                message: "Server error creating job"
            });
        }
    }
);

/* =====================================================
   GET ALL JOBS (PUBLIC)
===================================================== */
router.get("/", async(req, res) => {
    try {
        const jobs = await Job.find().sort({ date: -1 });
        res.json(jobs.map(formatJob));

    } catch (err) {
        console.error("GET JOBS ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Server error fetching jobs"
        });
    }
});

/* =====================================================
   APPROVE JOB (ADMIN ONLY)
===================================================== */
router.put(
    "/:id/approve",
    verifyToken,
    allowRoles("admin"),
    async(req, res) => {
        try {
            const job = await Job.findByIdAndUpdate(
                req.params.id, { status: "approved" }, { new: true }
            );

            if (!job) {
                return res.status(404).json({
                    success: false,
                    message: "Job not found"
                });
            }

            res.json({
                success: true,
                job: formatJob(job)
            });

        } catch (err) {
            console.error("APPROVE ERROR:", err);
            res.status(500).json({
                success: false,
                message: "Failed to approve job"
            });
        }
    }
);

/* =====================================================
   REJECT JOB (ADMIN ONLY)
===================================================== */
router.put(
    "/:id/reject",
    verifyToken,
    allowRoles("admin"),
    async(req, res) => {
        try {
            const job = await Job.findByIdAndUpdate(
                req.params.id, { status: "rejected" }, { new: true }
            );

            if (!job) {
                return res.status(404).json({
                    success: false,
                    message: "Job not found"
                });
            }

            res.json({
                success: true,
                job: formatJob(job)
            });

        } catch (err) {
            console.error("REJECT ERROR:", err);
            res.status(500).json({
                success: false,
                message: "Failed to reject job"
            });
        }
    }
);

/* =====================================================
   UPDATE JOB (EMPLOYER OWNER ONLY)
===================================================== */
router.put(
    "/:id",
    verifyToken,
    allowRoles("employer"),
    async(req, res) => {
        try {
            const job = await Job.findById(req.params.id);

            if (!job) {
                return res.status(404).json({
                    success: false,
                    message: "Job not found"
                });
            }

            // 🔐 OWNER CHECK
            if (job.employerId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: "Not authorized"
                });
            }

            const updatedJob = await Job.findByIdAndUpdate(
                req.params.id, {
                    ...req.body,
                    status: "pending", // force re-approval
                    date: new Date()
                }, { new: true }
            );

            res.json({
                success: true,
                job: formatJob(updatedJob)
            });

        } catch (err) {
            console.error("UPDATE ERROR:", err);
            res.status(500).json({
                success: false,
                message: "Failed to update job"
            });
        }
    }
);

/* =====================================================
   DELETE JOB
   - ADMIN → delete ANY
   - EMPLOYER → delete OWN ONLY
===================================================== */
router.delete(
    "/:id",
    verifyToken,
    allowRoles("admin", "employer"),
    async(req, res) => {
        try {
            const job = await Job.findById(req.params.id);

            if (!job) {
                return res.status(404).json({
                    success: false,
                    message: "Job not found"
                });
            }

            // 🔐 If employer → must own job
            if (req.user.role === "employer" && job.employerId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: "Not authorized"
                });
            }

            await Job.findByIdAndDelete(req.params.id);

            res.json({
                success: true,
                message: "Job deleted successfully"
            });

        } catch (err) {
            console.error("DELETE ERROR:", err);
            res.status(500).json({
                success: false,
                message: "Failed to delete job"
            });
        }
    }
);

module.exports = router;