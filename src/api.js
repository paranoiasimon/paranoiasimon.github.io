// Central API configuration for both PC and Android/LAN use.
//
// When the React app is opened on your PC:
//   http://localhost:5173
// the API automatically uses:
//   http://localhost/siomai-house-pos
//
// When the React app is opened from an Android phone on the same Wi-Fi:
//   http://192.168.x.x:5173
// the API automatically uses the same PC IP:
//   http://192.168.x.x/siomai-house-pos
//
// You can still override this with VITE_API_BASE in a .env file.
const browserHost = typeof window !== "undefined" ? window.location.hostname : "localhost";

export const API_BASE =
    import.meta.env.VITE_API_BASE || `http://${browserHost}/siomai-house-pos`;

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
