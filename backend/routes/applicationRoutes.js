const express = require("express");
const router = express.Router();
const Application = require("../models/Application");

const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

/* ================= FORMAT APPLICATION ================= */
function formatApp(a) {
    return {
        _id: a._id.toString(),
        id: a._id.toString(),

        jobId: a.jobId || "",
        jobTitle: a.jobTitle || "",

        employerId: a.employerId || "",
        employerName: a.employerName || "",

        applicantId: a.applicantId || "",
        applicantName: a.applicantName || a.name || "",
        applicantPhone: a.applicantPhone || a.phone || "",

        status: a.status || "applied",

        date: a.date || a.createdAt || new Date()
    };
}

/* =====================================================
   APPLY FOR JOB (USER ONLY)
===================================================== */
router.post(
    "/",
    verifyToken,
    allowRoles("user"),
    async(req, res) => {
        try {
            const {
                jobId,
                jobTitle,
                employerId,
                employerName
            } = req.body;

            const applicantId = req.user.id;
            const applicantName = req.user.name || "";
            const applicantPhone = req.user.phone || "";

            if (!jobId || !applicantPhone) {
                return res.status(400).json({
                    success: false,
                    message: "jobId and applicantPhone required"
                });
            }

            // prevent duplicate
            const exists = await Application.findOne({
                jobId,
                applicantPhone
            });

            if (exists) {
                return res.json({
                    success: false,
                    message: "Already applied"
                });
            }

            const app = new Application({
                jobId,
                jobTitle,
                employerId,
                employerName,

                applicantId,
                applicantName,
                applicantPhone,

                status: "applied",
                date: new Date()
            });

            await app.save();

            res.json({
                success: true,
                application: formatApp(app)
            });

        } catch (err) {
            console.error("APPLY ERROR:", err);
            res.status(500).json({
                success: false,
                message: "Server error while applying"
            });
        }
    }
);

/* =====================================================
   GET ALL APPLICATIONS (ADMIN ONLY)
===================================================== */
router.get(
    "/",
    verifyToken,
    allowRoles("admin"),
    async(req, res) => {
        try {
            const apps = await Application.find().sort({ date: -1 });
            res.json(apps.map(formatApp));

        } catch (err) {
            console.error("GET APPS ERROR:", err);
            res.status(500).json({
                success: false,
                message: "Failed to fetch applications"
            });
        }
    }
);

/* =====================================================
   GET APPLICATIONS BY EMPLOYER (OWNER ONLY)
===================================================== */
router.get(
    "/employer/:employerId",
    verifyToken,
    allowRoles("employer"),
    async(req, res) => {
        try {
            // 🔐 ensure employer sees ONLY own data
            if (req.user.id !== req.params.employerId) {
                return res.status(403).json({
                    success: false,
                    message: "Not authorized"
                });
            }

            const apps = await Application.find({
                employerId: req.user.id
            }).sort({ date: -1 });

            res.json(apps.map(formatApp));

        } catch (err) {
            console.error("EMPLOYER APPS ERROR:", err);
            res.status(500).json({
                success: false,
                message: "Failed to fetch employer applications"
            });
        }
    }
);

/* =====================================================
   GET USER APPLICATIONS (OWNER ONLY)
===================================================== */
router.get(
    "/user/:phone",
    verifyToken,
    allowRoles("user"),
    async(req, res) => {
        try {
            if (req.user.phone !== req.params.phone) {
                return res.status(403).json({
                    success: false,
                    message: "Not authorized"
                });
            }

            const apps = await Application.find({
                applicantPhone: req.user.phone
            }).sort({ date: -1 });

            res.json(apps.map(formatApp));

        } catch (err) {
            console.error("USER APPS ERROR:", err);
            res.status(500).json({
                success: false,
                message: "Failed to fetch user applications"
            });
        }
    }
);

/* =====================================================
   INVITE JOBSEEKER (EMPLOYER ONLY)
===================================================== */
router.post(
    "/invite",
    verifyToken,
    allowRoles("employer"),
    async(req, res) => {
        try {
            const {
                jobId,
                jobTitle,
                applicantId,
                applicantName,
                applicantPhone
            } = req.body;

            if (!jobId || !applicantPhone) {
                return res.status(400).json({
                    success: false,
                    message: "jobId and applicantPhone required"
                });
            }

            const exists = await Application.findOne({
                jobId,
                applicantPhone
            });

            if (exists) {
                return res.json({
                    success: false,
                    message: "Already invited or applied"
                });
            }

            const invite = new Application({
                jobId,
                jobTitle,
                employerId: req.user.id,
                employerName: req.user.name || "",

                applicantId,
                applicantName,
                applicantPhone,

                status: "invited",
                date: new Date()
            });

            await invite.save();

            res.json({
                success: true,
                application: formatApp(invite)
            });

        } catch (err) {
            console.error("INVITE ERROR:", err);
            res.status(500).json({
                success: false,
                message: "Failed to send invite"
            });
        }
    }
);

/* =====================================================
   UPDATE APPLICATION STATUS
   - EMPLOYER → their applicants
   - ADMIN → all
===================================================== */
router.put(
    "/:id",
    verifyToken,
    allowRoles("admin", "employer"),
    async(req, res) => {
        try {
            const app = await Application.findById(req.params.id);

            if (!app) {
                return res.status(404).json({
                    success: false,
                    message: "Application not found"
                });
            }

            // 🔐 employer can only update own applications
            if (
                req.user.role === "employer" &&
                app.employerId !== req.user.id
            ) {
                return res.status(403).json({
                    success: false,
                    message: "Not authorized"
                });
            }

            app.status = req.body.status || app.status;
            app.date = new Date();

            await app.save();

            res.json({
                success: true,
                application: formatApp(app)
            });

        } catch (err) {
            console.error("UPDATE ERROR:", err);
            res.status(500).json({
                success: false,
                message: "Failed to update application"
            });
        }
    }
);

/* =====================================================
   DELETE APPLICATION (ADMIN ONLY)
===================================================== */ 
router.delete(
    "/:id",
    verifyToken,
    allowRoles("admin"),
    async(req, res) => {
        try {
            const deleted = await Application.findByIdAndDelete(req.params.id);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: "Application not found"
                });
            }

            res.json({
                success: true,
                message: "Application deleted"
            });

        } catch (err) {
            console.error("DELETE ERROR:", err);
            res.status(500).json({
                success: false,
                message: "Failed to delete application"
            });
        }
    }
);

module.exports = router;