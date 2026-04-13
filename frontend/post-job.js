console.log("✅ Employer Post Job Loaded");

/* ================= CONFIG ================= */
const API_BASE = "https://your-backend-domain.com/api";

/* ================= AUTH ================= */
const token = localStorage.getItem("employerToken");

if (!token) {
    alert("Employer login required");
    window.location.href = "employer-login.html";
}

/* ================= HEADERS ================= */
function authHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

/* ================= STATE ================= */
let allJobs = [];

/* ================= ELEMENTS ================= */
const jobTitle = document.getElementById("jobTitle");
const jobSkill = document.getElementById("jobSkill");
const jobLocation = document.getElementById("jobLocation");
const jobDesc = document.getElementById("jobDesc");
const addJobBtn = document.getElementById("addJobBtn");
const jobsTable = document.getElementById("jobsTable");
const logoutBtn = document.getElementById("logoutBtn");

/* ================= LOGOUT ================= */
if (logoutBtn) {
    logoutBtn.onclick = () => {
        localStorage.removeItem("employerToken");
        location.href = "employer-login.html";
    };
}

/* ================= LOAD JOBS ================= */
async function loadJobs() {
    try {
        const res = await fetch(`${API_BASE}/jobs/employer`, {
            headers: authHeaders()
        });

        if (!res.ok) throw new Error("Failed to load jobs");

        allJobs = await res.json();
        renderJobs();

    } catch (err) {
        console.error(err);
        alert("❌ Could not load jobs");
    }
}

/* ================= CREATE JOB ================= */
if (addJobBtn) {
    addJobBtn.onclick = async () => {

        const title = jobTitle.value.trim();
        const skill = jobSkill.value.trim();
        const location = jobLocation.value.trim();
        const description = jobDesc.value.trim();

        if (!title || !skill || !location) {
            alert("Please fill required fields");
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/jobs`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({
                    title,
                    skill,
                    location,
                    description
                })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Failed to create job");
                return;
            }

            alert("✅ Job posted (pending approval)");

            jobTitle.value = "";
            jobSkill.value = "";
            jobLocation.value = "";
            jobDesc.value = "";

            loadJobs();

        } catch (err) {
            console.error(err);
            alert("❌ Server error");
        }
    };
}

/* ================= RENDER ================= */
function renderJobs() {

    if (!jobsTable) return;

    jobsTable.innerHTML = "";

    if (!allJobs.length) {
        jobsTable.innerHTML = `<tr><td colspan="8">No jobs yet</td></tr>`;
        return;
    }

    allJobs.forEach(job => {

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${job.title || "-"}</td>
            <td>${job.skill || "-"}</td>
            <td>${job.location || "-"}</td>
            <td>${job.employerName || "-"}</td>
            <td>${job.description || "-"}</td>
            <td>${job.status || "pending"}</td>
            <td>${job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "-"}</td>
            <td>
                <button onclick="editJob('${job._id}')">Edit</button>
                <button onclick="deleteJob('${job._id}')">Delete</button>
            </td>
        `;

        jobsTable.appendChild(tr);
    });
}

/* ================= DELETE ================= */
async function deleteJob(jobId) {

    if (!confirm("Delete this job?")) return;

    try {
        const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
            method: "DELETE",
            headers: authHeaders()
        });

        if (!res.ok) throw new Error();

        loadJobs();

    } catch (err) {
        console.error(err);
        alert("❌ Delete failed");
    }
}

/* ================= EDIT ================= */
async function editJob(jobId) {

    const job = allJobs.find(j => j._id === jobId);
    if (!job) return;

    const title = prompt("Title:", job.title);
    const skill = prompt("Skill:", job.skill);
    const location = prompt("Location:", job.location);
    const description = prompt("Description:", job.description);

    if (!title || !skill || !location) return;

    try {
        const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({
                title,
                skill,
                location,
                description,
                status: "pending"
            })
        });

        if (!res.ok) throw new Error();

        alert("✅ Updated (sent for approval)");
        loadJobs();

    } catch (err) {
        console.error(err);
        alert("❌ Update failed");
    }
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", loadJobs);