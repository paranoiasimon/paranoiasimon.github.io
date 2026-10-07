// One place for the backend address.
//
//  - On your computer (npm run dev): http://localhost/siomai-house-pos
//  - On the live site (Vercel): empty, so requests go to this same website at
//    /backend/..., and vercel.json forwards them to your PHP host.
//  - Override anytime with VITE_API_BASE (see .env.example).
const configured = import.meta.env.VITE_API_BASE;

export const API_BASE =
    configured !== undefined
        ? String(configured).replace(/\/$/, "")
        : import.meta.env.PROD
            ? ""
            : "http://localhost/siomai-house-pos";

export const API = `${API_BASE}/backend/api`;
export const IMAGE_URL = `${API_BASE}/backend/images/`;

// fetch() that always sends the PHP session cookie and
// sends the user back to login if the session has expired.
export async function apiFetch(url, options = {}) {
    const response = await fetch(url, {
        credentials: "include",
        ...options,
    });

    if (response.status === 401) {
        localStorage.removeItem("siomai_user");
        window.location.href = "/";
    }

    return response;
}

export async function logoutUser(navigate) {
    try {
        await fetch(`${API}/auth/logout.php`, {
            method: "POST",
            credentials: "include",
        });
    } catch {
        // Continue logout even if the server is unreachable.
    }

    localStorage.removeItem("siomai_user");
    navigate("/", { replace: true });
}

// Admin, Owner, Cashier and Staff see everything.
// Any other role (Client / buyer) only gets the POS.
// Decided by role NAME, so it works whatever ID each role has in your database.
const STAFF_ROLES = ["admin", "owner", "cashier", "staff"];

export function getStoredUser() {
    try {
        return JSON.parse(localStorage.getItem("siomai_user"));
    } catch {
        return null;
    }
}

export function isStaffUser(user = getStoredUser()) {
    const role = String(user?.role_name || "").trim().toLowerCase();
    return STAFF_ROLES.includes(role);
}

// Only Admin and Owner can manage user accounts.
export function isAdminUser(user = getStoredUser()) {
    const role = String(user?.role_name || "").trim().toLowerCase();
    return role === "admin" || role === "owner";
}
