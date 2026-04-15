console.log("Admin Dashboard Loaded");

/* ================= CONFIG ================= */
const API_BASE = "/api"; // use relative path for VPS

/* ================= AUTH ================= */
const token = localStorage.getItem("adminToken");

if (!token) {
    alert("Admin login required");
    window.location.href = "admin-login.html";
}

/* ================= HEADERS ================= */
function getAuthHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

/* ================= SAFE FETCH ================= */
async function safeFetch(url, options = {}) {
    try {
        const res = await fetch(url, options);

        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("adminToken");
            localStorage.removeItem("loggedAdmin");
            alert("Session expired. Please login again.");
            window.location.href = "admin-login.html";
            return null;
        }

        return res;

    } catch (err) {
        console.error("Network error:", err);
        alert("Network error");
        return null;
    }
}

/* ================= STATE ================= */
let allUsers = [];
let allJobs = [];
let allApplications = [];
let allRequests = [];

let filteredField = [];
let filteredOnline = [];

let currentPageField = 1;
let currentPageOnline = 1;

const pageSize = 20;

/* ================= LOAD DATA ================= */
async function loadData() {
    try {
        const [usersRes, jobsRes, appsRes, reqRes] = await Promise.all([
            safeFetch(`${API_BASE}/jobseekers`, { headers: getAuthHeaders() }),
            safeFetch(`${API_BASE}/jobs`, { headers: getAuthHeaders() }),
            safeFetch(`${API_BASE}/applications`, { headers: getAuthHeaders() }),
            safeFetch(`${API_BASE}/requests`, { headers: getAuthHeaders() })
        ]);

        if (!usersRes || !jobsRes || !appsRes || !reqRes) return;

        allUsers = await usersRes.json();
        allJobs = await jobsRes.json();
        allApplications = await appsRes.json();
        allRequests = await reqRes.json();

        applyFilters();
        renderJobsTable();
        renderApplications();
        renderRequests();
        updateStats();

    } catch (err) {
        console.error("Load error:", err);
        alert("Failed to load dashboard");
    }
}

/* ================= FILTER USERS ================= */
function applyFilters() {
    const txt = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const subTxt = document.getElementById("sublocationFilter")?.value.toLowerCase() || "";
    const genderVal = document.getElementById("genderFilter")?.value || "";
    const minAge = parseInt(document.getElementById("minAgeFilter")?.value);
    const maxAge = parseInt(document.getElementById("maxAgeFilter")?.value);

    const filterFn = (u) => {
        if (txt &&
            !(u.name?.toLowerCase().includes(txt) ||
                u.primarySkill?.toLowerCase().includes(txt))) return false;

        if (subTxt && !u.sublocation?.toLowerCase().includes(subTxt)) return false;
        if (!isNaN(minAge) && u.age < minAge) return false;
        if (!isNaN(maxAge) && u.age > maxAge) return false;
        if (genderVal && u.gender !== genderVal) return false;

        return true;
    };

    filteredField = allUsers.filter(u => u.type === "field").filter(filterFn);
    filteredOnline = allUsers.filter(u => u.type === "online").filter(filterFn);

    currentPageField = 1;
    currentPageOnline = 1;

    renderFieldTable();
    renderOnlineTable();
}

/* ================= MATCH SCORE ================= */
function calculateMatch(user) {
    const jobs = allJobs.filter(j => j.status === "approved");
    if (!jobs.length) return "0%";

    let match = 0;

    jobs.forEach(job => {
        if (
            user.primarySkill &&
            job.skill &&
            user.primarySkill.toLowerCase().includes(job.skill.toLowerCase())
        ) {
            match++;
        }
    });

    return Math.round((match / jobs.length) * 100) + "%";
}

/* ================= FIELD TABLE ================= */
function renderFieldTable() {
    const tbody = document.querySelector("#fieldTable tbody");
    if (!tbody) return;

    const start = (currentPageField - 1) * pageSize;
    const pageData = filteredField.slice(start, start + pageSize);

    tbody.innerHTML = pageData.length ? "" : "<tr><td colspan='9'>No records</td></tr>";

    pageData.forEach(u => {
        const id = u._id || u.id;

        tbody.innerHTML += `
            <tr>
                <td>${u.name || "-"}</td>
                <td>${u.gender || "-"}</td>
                <td>${u.age || "-"}</td>
                <td>${u.phone || "-"}</td>
                <td>${u.sublocation || "-"}</td>
                <td>${u.primarySkill || "-"}</td>
                <td>${calculateMatch(u)}</td>
                <td>${u.date ? new Date(u.date).toLocaleDateString() : "-"}</td>
                <td>
                    <button onclick="viewUser('${id}')">View</button>
                    <button onclick="deleteUser('${id}')">Delete</button>
                </td>
            </tr>
        `;
    });
}

/* ================= ONLINE TABLE ================= */
function renderOnlineTable() {
    const tbody = document.querySelector("#onlineTable tbody");
    if (!tbody) return;

    const start = (currentPageOnline - 1) * pageSize;
    const pageData = filteredOnline.slice(start, start + pageSize);

    tbody.innerHTML = pageData.length ? "" : "<tr><td colspan='9'>No records</td></tr>";

    pageData.forEach(u => {
        const id = u._id || u.id;

        tbody.innerHTML += `
            <tr>
                <td>${u.name || "-"}</td>
                <td>${u.gender || "-"}</td>
                <td>${u.age || "-"}</td>
                <td>${u.phone || "-"}</td>
                <td>${u.sublocation || "-"}</td>
                <td>${u.primarySkill || "-"}</td>
                <td>${calculateMatch(u)}</td>
                <td>${u.date ? new Date(u.date).toLocaleDateString() : "-"}</td>
                <td>
                    <button onclick="viewUser('${id}')">View</button>
                    <button onclick="deleteUser('${id}')">Delete</button>
                </td>
            </tr>
        `;
    });
}

/* ================= JOBS ================= */
function renderJobsTable() {
    const tbody = document.querySelector("#jobsTable tbody");
    if (!tbody) return;

    tbody.innerHTML = allJobs.length ? "" : "<tr><td colspan='7'>No jobs</td></tr>";

    allJobs.forEach(job => {
                const id = job._id || job.id;

                tbody.innerHTML += `
            <tr>
                <td>${job.title}</td>
                <td>${job.skill}</td>
                <td>${job.location}</td>
                <td>${job.employerName || job.company || "-"}</td>
                <td>${job.description || "-"}</td>
                <td>${job.status}</td>
                <td>
                    ${job.status === "pending"
                        ? `<button onclick="approveJob('${id}')">Approve</button>
                           <button onclick="rejectJob('${id}')">Reject</button>`
                        : "-"}
                </td>
            </tr>
        `;
    });
}

/* ================= JOB ACTIONS ================= */
async function approveJob(id) {
    await safeFetch(`${API_BASE}/jobs/${id}/approve`, {
        method: "PUT",
        headers: getAuthHeaders()
    });
    loadData();
}

async function rejectJob(id) {
    await safeFetch(`${API_BASE}/jobs/${id}/reject`, {
        method: "PUT",
        headers: getAuthHeaders()
    });
    loadData();
}

/* ================= DELETE USER ================= */
async function deleteUser(id) {
    if (!confirm("Delete this user?")) return;

    await safeFetch(`${API_BASE}/jobseekers/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
    });

    loadData();
}

/* ================= APPLICATIONS ================= */
function renderApplications() {
    const tbody = document.getElementById("applicantsTable");
    if (!tbody) return;

    tbody.innerHTML = allApplications.length
        ? ""
        : "<tr><td colspan='6'>No applications</td></tr>";

    allApplications.forEach(a => {
        tbody.innerHTML += `
            <tr>
                <td>${a.applicantName || a.name || "-"}</td>
                <td>${a.applicantPhone || a.phone || "-"}</td>
                <td>${a.jobTitle || "-"}</td>
                <td>${a.employerName || "-"}</td>
                <td>${a.status || "-"}</td>
                <td>${a.date ? new Date(a.date).toLocaleDateString() : "-"}</td>
            </tr>
        `;
    });
}

/* ================= REQUESTS ================= */
function renderRequests() {
    const container = document.getElementById("requestsList");
    if (!container) return;

    container.innerHTML = allRequests.length ? "" : "<p>No requests</p>";

    allRequests.forEach(r => {
        container.innerHTML += `
            <div class="request-item">
                <strong>${r.name}</strong><br>
                ${r.service}<br>
                ${r.phone}
            </div>
        `;
    });
}

/* ================= STATS ================= */
function updateStats() {
    const w = document.getElementById("statWorkers");
    const j = document.getElementById("statJobs");

    if (w) w.textContent = allUsers.length;
    if (j) j.textContent = allJobs.length;
}

/* ================= PDF EXPORT ================= */
function exportTable(type) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const data = type === "field" ? filteredField : filteredOnline;

    if (!data.length) {
        alert("No data to export");
        return;
    }

    doc.setFontSize(14);
    doc.text(`${type.toUpperCase()} JOBSEEKERS REPORT`, 10, 10);

    const rows = data.map(u => [
        u.name || "-",
        u.gender || "-",
        u.age || "-",
        u.phone || "-",
        u.sublocation || "-",
        u.primarySkill || "-",
        calculateMatch(u),
        u.date ? new Date(u.date).toLocaleDateString() : "-"
    ]);

    doc.autoTable({
        head: [["Name", "Gender", "Age", "Phone", "Location", "Skill", "Match %", "Date"]],
        body: rows,
        startY: 20,
        styles: { fontSize: 8 }
    });

    doc.save(`${type}_jobseekers_report.pdf`);
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", loadData);