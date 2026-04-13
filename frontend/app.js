console.log("🚀 SkillConnect App Started (Stable Mode)");

/* ================= API BASE (SAFE FALLBACK) ================= */
// Uses api.js if available, otherwise fallback
var API_BASE = (typeof window.API_BASE !== "undefined")
    ? window.API_BASE
    : "http://localhost:5000/api";

/* ================= OFFLINE STORAGE ================= */
const OFFLINE_KEY = "skillconnect_offline_queue";

/* ================= ELEMENTS ================= */
const form = document.getElementById("registerForm");
const successMsg = document.getElementById("successMessage");

/* ================= AUTH (optional use if needed later) ================= */
const token = localStorage.getItem("jobseekerToken");

/* ================= HEADERS ================= */
function getHeaders() {
    return {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
}

/* ================= OFFLINE SAVE ================= */
function saveOffline(data) {
    let queue = JSON.parse(localStorage.getItem(OFFLINE_KEY)) || [];
    queue.push(data);
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(queue));
}

/* ================= SEND TO SERVER ================= */
async function sendToServer(data) {
    const response = await fetch(`${API_BASE}/jobseekers/register`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data)
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(result.message || "Server error");
    }

    return result;
}

/* ================= SYNC OFFLINE DATA ================= */
async function syncOfflineData() {
    const queue = JSON.parse(localStorage.getItem(OFFLINE_KEY)) || [];
    if (!queue.length) return;

    const remaining = [];

    for (let record of queue) {
        try {
            await sendToServer(record);
        } catch (err) {
            remaining.push(record);
        }
    }

    localStorage.setItem(OFFLINE_KEY, JSON.stringify(remaining));
}

/* ================= POPUP ================= */
function showPopup(message, type) {
    if (!successMsg) return;

    successMsg.textContent = message;
    successMsg.style.display = "block";
    successMsg.style.background =
        type === "success" ? "#28a745" : "#ff9800";

    setTimeout(() => {
        successMsg.style.display = "none";
    }, 3000);
}

/* ================= LIVE UPDATE SIGNAL ================= */
function triggerLiveUpdate() {
    localStorage.setItem("skillconnect_last_update", Date.now());
}

/* ================= FORM SUBMISSION ================= */
if (form) {
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const cvInput = document.getElementById("cvUpload");
        let cvBase64 = "";

        const process = async () => {

            const data = {
                id: Date.now() + "_" + Math.random().toString(36).substring(2, 8),

                name: document.getElementById("name").value.trim(),
                phone: document.getElementById("phone").value.trim(),
                sublocation: document.getElementById("sublocation").value.trim(),
                age: parseInt(document.getElementById("age").value) || "",
                gender: document.getElementById("gender").value,
                idNumber: document.getElementById("idNumber").value.trim(),
                disability: document.getElementById("disability").value,

                primarySkill: document.getElementById("primarySkill").value.trim(),
                otherSkills: document.getElementById("otherSkills").value.trim(),

                certificate: document.getElementById("certificate").value,
                educationLevel: document.getElementById("educationLevel").value,

                cv: cvBase64,
                type: document.getElementById("sublocation").value.trim()
                    ? "field"
                    : "online",

                createdAt: new Date().toISOString()
            };

            /* ================= OFFLINE FIRST ================= */
            saveOffline(data);

            /* ================= LIVE UPDATE SIGNAL ================= */
            triggerLiveUpdate();

            /* ================= UI FEEDBACK ================= */
            showPopup("✅ Submission saved successfully", "success");

            /* ================= SEND TO BACKEND ================= */
            try {
                await sendToServer(data);
            } catch (err) {
                console.warn("⚠️ Saved offline (will sync later)");
            }

            form.reset();
        };

        /* ================= CV FILE HANDLING ================= */
        if (cvInput && cvInput.files.length > 0) {
            const reader = new FileReader();
            reader.onload = (e) => {
                cvBase64 = e.target.result;
                process();
            };
            reader.readAsDataURL(cvInput.files[0]);
        } else {
            process();
        }
    });
}

/* ================= AUTO SYNC ================= */
window.addEventListener("online", syncOfflineData);
setInterval(syncOfflineData, 30000);
syncOfflineData();

/* ================= LIVE LISTENER ================= */
window.addEventListener("storage", function (event) {
    if (event.key === "skillconnect_last_update") {
        if (typeof loadFieldSkills === "function") loadFieldSkills();
        if (typeof renderTable === "function") renderTable();
    }
});