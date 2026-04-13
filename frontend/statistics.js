console.log("📊 Statistics Module Loaded (Production Ready)");

const API_BASE = "https://your-backend-domain.com/api";

/* ================= AUTH ================= */
const adminToken = localStorage.getItem("adminToken");

if (!adminToken) {
    alert("Admin login required");
    window.location.href = "admin-login.html";
}

/* ================= HEADERS ================= */
function getHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
    };
}

/* ================= CHART INSTANCES ================= */
let skillChartInstance = null;
let ageChartInstance = null;

/* ================= SAFE CHART DESTROY ================= */
function destroyChart(chart) {
    if (chart && typeof chart.destroy === "function") {
        chart.destroy();
    }
}

/* ================= LOAD STATISTICS ================= */
async function loadStats() {
    try {
        const res = await fetch(`${API_BASE}/jobseekers`, {
            headers: getHeaders()
        });

        if (!res.ok) throw new Error("Failed to fetch jobseekers");

        const records = await res.json();

        if (!Array.isArray(records)) {
            throw new Error("Invalid data format from server");
        }

        renderSkillChart(records);
        renderAgeChart(records);

    } catch (err) {
        console.error("❌ Stats error:", err.message);
    }
}

/* ================= SKILL CHART ================= */
function renderSkillChart(records) {
    const canvas = document.getElementById("skillChart");
    if (!canvas) return;

    const skillMap = {};

    records.forEach(r => {
        const skill = (r.primarySkill || "Unknown").trim();
        skillMap[skill] = (skillMap[skill] || 0) + 1;
    });

    destroyChart(skillChartInstance);

    skillChartInstance = new Chart(canvas, {
        type: "pie",
        data: {
            labels: Object.keys(skillMap),
            datasets: [{
                data: Object.values(skillMap)
            }]
        }
    });
}

/* ================= AGE CHART ================= */
function renderAgeChart(records) {
    const canvas = document.getElementById("ageChart");
    if (!canvas) return;

    const ageRanges = {
        "18–25": 0,
        "26–35": 0,
        "36–45": 0,
        "46–55": 0,
        "56+": 0
    };

    records.forEach(r => {
        const age = Number(r.age);

        if (!age || age <= 0) return;

        if (age <= 25) ageRanges["18–25"]++;
        else if (age <= 35) ageRanges["26–35"]++;
        else if (age <= 45) ageRanges["36–45"]++;
        else if (age <= 55) ageRanges["46–55"]++;
        else ageRanges["56+"]++;
    });

    destroyChart(ageChartInstance);

    ageChartInstance = new Chart(canvas, {
        type: "bar",
        data: {
            labels: Object.keys(ageRanges),
            datasets: [{
                data: Object.values(ageRanges)
            }]
        }
    });
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", loadStats);

/* ================= AUTO REFRESH ================= */
let refreshInterval = setInterval(loadStats, 60000);