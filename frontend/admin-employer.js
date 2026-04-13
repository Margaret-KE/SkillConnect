console.log("✅ Admin Employer Dashboard Loaded (Production Ready)");

/* ================= SESSION ================= */
const loggedAdmin = JSON.parse(localStorage.getItem("loggedAdmin"));

if (!loggedAdmin) {
    alert("Admin login required");
    window.location.href = "admin-login.html";
}

/* ================= API ================= */
const API_BASE = "https://your-backend-domain.com/api";

/* ================= AUTH HEADER ================= */
function getHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${loggedAdmin.token || ""}`
    };
}

/* ================= STATE ================= */
let allJobs = [];
let allUsers = [];

/* ================= PAGINATION ================= */
let skillsPage = 1;
let jobseekersPage = 1;
const rowsPerPage = 8;

/* ================= SAFE FETCH ================= */
async function apiGet(url) {
    try {
        const res = await fetch(`${API_BASE}${url}`, {
            headers: getHeaders()
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(data.message || "Request failed");

        return data;

    } catch (err) {
        console.error("API ERROR:", err.message);
        alert(err.message);
        return [];
    }
}

/* ================= LOAD DATA ================= */
async function loadData() {
    try {
        allJobs = await apiGet("/jobs");
        allUsers = await apiGet("/jobseekers");

        renderJobs();
        renderSkills();
        renderJobseekers();

    } catch (err) {
        console.error("Load failed:", err);
    }
}

/* =====================================================
   JOBS
===================================================== */
function renderJobs() {
    const tbody = document.querySelector("#adminJobsTable tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!allJobs.length) {
        tbody.innerHTML = "<tr><td colspan='7'>No jobs found</td></tr>";
        return;
    }

    allJobs.forEach(job => {

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${job.title || "-"}</td>
            <td>${job.skill || "-"}</td>
            <td>${job.location || "-"}</td>
            <td>${job.company || job.employerName || "-"}</td>
            <td>${job.status || "-"}</td>
            <td>${job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "-"}</td>
            <td>
                ${job.status === "pending" ? `
                    <button onclick="approveJob('${job._id || job.id}')">Approve</button>
                    <button onclick="deleteJob('${job._id || job.id}')">Delete</button>
                ` : `
                    <button onclick="deleteJob('${job._id || job.id}')">Delete</button>
                `}
            </td>
        `;

        tbody.appendChild(tr);
    });
}

/* ================= JOB ACTIONS (FIXED) ================= */
async function approveJob(id) {
    try {
        const res = await fetch(`${API_BASE}/jobs/${id}/approve`, {
            method: "PUT",
            headers: getHeaders()
        });

        if (!res.ok) throw new Error("Approval failed");

        loadData();

    } catch (err) {
        alert(err.message);
    }
}

async function deleteJob(id) {
    if (!confirm("Delete this job?")) return;

    try {
        const res = await fetch(`${API_BASE}/jobs/${id}`, {
            method: "DELETE",
            headers: getHeaders()
        });

        if (!res.ok) throw new Error("Delete failed");

        loadData();

    } catch (err) {
        alert(err.message);
    }
}

/* =====================================================
   USERS
===================================================== */
function filterUsers(type) {
    return allUsers.filter(u => u.type === type);
}

/* ================= FIELD ================= */
function renderSkills() {
    const tbody = document.querySelector("#skillsTable tbody");
    if (!tbody) return;

    const nameFilter = document.getElementById("skillNameFilter")?.value.toLowerCase() || "";
    const subFilter = document.getElementById("skillSublocationFilter")?.value.toLowerCase() || "";
    const genderFilter = document.getElementById("skillGenderFilter")?.value || "";

    let data = filterUsers("field");

    data = data.filter(u =>
        (!nameFilter ||
            u.name?.toLowerCase().includes(nameFilter) ||
            u.primarySkill?.toLowerCase().includes(nameFilter)
        ) &&
        (!subFilter || u.sublocation?.toLowerCase().includes(subFilter)) &&
        (!genderFilter || u.gender === genderFilter)
    );

    tbody.innerHTML = "";

    const start = (skillsPage - 1) * rowsPerPage;
    const page = data.slice(start, start + rowsPerPage);

    if (!page.length) {
        tbody.innerHTML = "<tr><td colspan='6'>No data</td></tr>";
        return;
    }

    page.forEach(u => {
        tbody.innerHTML += `
            <tr>
                <td>${u.name || "-"}</td>
                <td>${u.gender || "-"}</td>
                <td>${u.age || "-"}</td>
                <td>${u.sublocation || "-"}</td>
                <td>${u.primarySkill || "-"}</td>
                <td>
                    <button onclick="viewUser('${u._id}')">View</button>
                    <button onclick="deleteUser('${u._id}')">Delete</button>
                </td>
            </tr>
        `;
    });
}

/* ================= JOBSEEKERS ================= */
function renderJobseekers() {
    const tbody = document.querySelector("#jobseekersTable tbody");
    if (!tbody) return;

    const nameFilter = document.getElementById("jobseekerNameFilter")?.value.toLowerCase() || "";
    const subFilter = document.getElementById("jobseekerSublocationFilter")?.value.toLowerCase() || "";
    const genderFilter = document.getElementById("jobseekerGenderFilter")?.value || "";

    let data = filterUsers("online");

    data = data.filter(u =>
        (!nameFilter ||
            u.name?.toLowerCase().includes(nameFilter) ||
            u.primarySkill?.toLowerCase().includes(nameFilter)
        ) &&
        (!subFilter || u.sublocation?.toLowerCase().includes(subFilter)) &&
        (!genderFilter || u.gender === genderFilter)
    );

    tbody.innerHTML = "";

    const start = (jobseekersPage - 1) * rowsPerPage;
    const page = data.slice(start, start + rowsPerPage);

    if (!page.length) {
        tbody.innerHTML = "<tr><td colspan='6'>No data</td></tr>";
        return;
    }

    page.forEach(u => {
        tbody.innerHTML += `
            <tr>
                <td>${u.name || "-"}</td>
                <td>${u.gender || "-"}</td>
                <td>${u.age || "-"}</td>
                <td>${u.phone || "-"}</td>
                <td>${u.sublocation || "-"}</td>
                <td>${u.primarySkill || "-"}</td>
                <td>
                    <button onclick="viewUser('${u._id}')">View</button>
                    <button onclick="deleteUser('${u._id}')">Delete</button>
                </td>
            </tr>
        `;
    });
}

/* ================= USER ACTIONS ================= */
function viewUser(id) {
    const user = allUsers.find(u => u._id === id);
    if (!user) return;

    const modal = document.getElementById("viewModal");
    const body = document.getElementById("modalBody");

    body.innerHTML = Object.entries(user)
        .map(([k, v]) => `<p><b>${k}:</b> ${v}</p>`)
        .join("");

    modal.style.display = "block";
}

function closeModal() {
    document.getElementById("viewModal").style.display = "none";
}

async function deleteUser(id) {
    if (!confirm("Delete this user?")) return;

    try {
        const res = await fetch(`${API_BASE}/jobseekers/${id}`, {
            method: "DELETE",
            headers: getHeaders()
        });

        if (!res.ok) throw new Error("Delete failed");

        loadData();

    } catch (err) {
        alert(err.message);
    }
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", loadData);