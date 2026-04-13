console.log("✅ Backend DB Mode Active (Production API Layer)");

/* ================= API BASE ================= */
const API_BASE = "https://your-backend-domain.com/api";

/* ================= TOKEN ================= */
function getToken() {
    return (
        localStorage.getItem("jobseekerToken") ||
        localStorage.getItem("employerToken") ||
        localStorage.getItem("adminToken")
    );
}

/* ================= HEADERS ================= */
function authHeaders() {
    const token = getToken();

    return {
        "Content-Type": "application/json",
        ...(token && { "Authorization": `Bearer ${token}` })
    };
}

/* ================= SAFE FETCH WRAPPER ================= */
async function apiRequest(endpoint, options = {}) {
    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
                ...authHeaders(),
                ...(options.headers || {})
            }
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            throw new Error(data.message || "Request failed");
        }

        return data;

    } catch (err) {
        console.error(`API ERROR [${endpoint}]:`, err.message);
        throw err;
    }
}

/* ================= JOBS ================= */
async function getJobs() {
    return await apiRequest("/jobs");
}

/* ================= USERS ================= */
async function getUsers() {
    return await apiRequest("/jobseekers");
}

/* ================= APPLICATIONS ================= */
async function getApplications() {
    return await apiRequest("/applications");
}

/* ================= SINGLE JOB ================= */
async function getJobById(id) {
    return await apiRequest(`/jobs/${id}`);
}

/* ================= PROFILE (optional reuse) ================= */
async function getMyProfile(role = "jobseeker") {
    return await apiRequest(`/${role}/profile`);
}