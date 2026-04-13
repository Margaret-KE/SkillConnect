console.log("✅ Employer Dashboard Loaded");

/* ================= CONFIG ================= */
const API_BASE = "https://your-backend-domain.com/api";

/* ================= AUTH ================= */
const token = localStorage.getItem("employerToken");

if (!token) {
    alert("Login required");
    window.location.href = "employer-login.html";
}

/* ================= HEADERS ================= */
function getHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

/* ================= STATE ================= */
let USERS = [];
let JOBS = [];
let APPS = [];
let EMPLOYER = null;

/* ================= LOAD DATA ================= */
async function loadAllData() {
    try {
        const [meRes, usersRes, jobsRes, appsRes] = await Promise.all([
            fetch(`${API_BASE}/auth/me`, { headers: getHeaders() }),
            fetch(`${API_BASE}/jobseekers`, { headers: getHeaders() }),
            fetch(`${API_BASE}/jobs`, { headers: getHeaders() }),
            fetch(`${API_BASE}/applications`, { headers: getHeaders() })
        ]);

        if (!meRes.ok || !usersRes.ok || !jobsRes.ok || !appsRes.ok) {
            throw new Error("Failed to load data");
        }

        EMPLOYER = await meRes.json();
        USERS = await usersRes.json();
        JOBS = await jobsRes.json();
        APPS = await appsRes.json();

        renderAll();

    } catch (err) {
        console.error("❌ Load failed:", err);
        alert("Server error loading dashboard");
    }
}

/* ================= FILTER ================= */
function filterUsers(list, search, location) {
    return list.filter(u => {
        const txt = search?.toLowerCase() || "";
        const loc = location?.toLowerCase() || "";

        return (
            (!txt ||
                u.name?.toLowerCase().includes(txt) ||
                u.primarySkill?.toLowerCase().includes(txt)
            ) &&
            (!loc ||
                u.sublocation?.toLowerCase().includes(loc)
            )
        );
    });
}

/* ================= MATCH SCORE ================= */
function matchScore(user, job) {
    if (!user?.primarySkill || !job?.skill) return 0;

    const u = user.primarySkill.toLowerCase();
    const j = job.skill.toLowerCase();

    if (u === j) return 100;
    if (u.includes(j) || j.includes(u)) return 70;

    return 30;
}

/* ================= RENDER FIELD JOBSEEKERS ================= */
function renderFieldTable() {
    const tbody = document.querySelector("#fieldTable tbody");
    if (!tbody) return;

    const data = filterUsers(
        USERS.filter(u => u.type === "field"),
        document.getElementById("fieldSearch")?.value,
        document.getElementById("fieldLocation")?.value
    );

    tbody.innerHTML = "";

    if (!data.length) {
        tbody.innerHTML = "<tr><td colspan='9'>No data</td></tr>";
        return;
    }

    data.forEach(u => {
        const bestMatch = Math.max(...JOBS.map(j => matchScore(u, j)));

        tbody.innerHTML += `
            <tr>
                <td>${u.name || "-"}</td>
                <td>${u.gender || "-"}</td>
                <td>${u.age || "-"}</td>
                <td>${u.phone || "-"}</td>
                <td>${u.sublocation || "-"}</td>
                <td>${u.primarySkill || "-"}</td>
                <td>${bestMatch}%</td>
                <td>${u.date ? new Date(u.date).toLocaleDateString() : "-"}</td>
                <td>
                    <button onclick="invite('${u._id}')">Invite</button>
                </td>
            </tr>
        `;
    });
}

/* ================= RENDER ONLINE ================= */
function renderOnlineTable() {
    const tbody = document.querySelector("#onlineTable tbody");
    if (!tbody) return;

    const data = filterUsers(
        USERS.filter(u => u.type === "online"),
        document.getElementById("onlineSearch")?.value,
        document.getElementById("onlineLocation")?.value
    );

    tbody.innerHTML = "";

    if (!data.length) {
        tbody.innerHTML = "<tr><td colspan='9'>No data</td></tr>";
        return;
    }

    data.forEach(u => {
        const bestMatch = Math.max(...JOBS.map(j => matchScore(u, j)));

        tbody.innerHTML += `
            <tr>
                <td>${u.name || "-"}</td>
                <td>${u.gender || "-"}</td>
                <td>${u.age || "-"}</td>
                <td>${u.phone || "-"}</td>
                <td>${u.sublocation || "-"}</td>
                <td>${u.primarySkill || "-"}</td>
                <td>${bestMatch}%</td>
                <td>${u.date ? new Date(u.date).toLocaleDateString() : "-"}</td>
                <td>
                    <button onclick="invite('${u._id}')">Invite</button>
                </td>
            </tr>
        `;
    });
}

/* ================= JOBS ================= */
function renderJobsTable() {
    const tbody = document.querySelector("#jobsTable tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    JOBS.forEach(job => {
        tbody.innerHTML += `
            <tr>
                <td>${job.title}</td>
                <td>${job.skill}</td>
                <td>${job.location || "-"}</td>
                <td>${job.status}</td>
                <td>${job.date ? new Date(job.date).toLocaleDateString() : "-"}</td>
            </tr>
        `;
    });
}

/* ================= INVITE (FIXED) ================= */
async function invite(workerId) {
    const job = JOBS.find(j => j.status === "approved");
    if (!job) return alert("No approved jobs");

    const user = USERS.find(u => u._id === workerId);
    if (!user) return alert("User not found");

    try {
        const res = await fetch(`${API_BASE}/applications/invite`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
                jobId: job._id,
                jobTitle: job.title,
                employerId: EMPLOYER._id,
                employerName: EMPLOYER.company || EMPLOYER.name,
                workerId: user._id,
                name: user.name,
                phone: user.phone,
                status: "invited"
            })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || "Invite failed");
            return;
        }

        alert("Invitation sent");

    } catch (err) {
        console.error(err);
        alert("Server error");
    }
}

/* ================= DELETE JOB ================= */
async function deleteJob(id) {
    if (!confirm("Delete job?")) return;

    await fetch(`${API_BASE}/jobs/${id}`, {
        method: "DELETE",
        headers: getHeaders()
    });

    await loadAllData();
}

/* ================= RENDER ALL ================= */
function renderAll() {
    renderFieldTable();
    renderOnlineTable();
    renderJobsTable();
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", loadAllData);