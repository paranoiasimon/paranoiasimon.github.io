import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { API, apiFetch } from "../api";

const STAFF_LIST_API = `${API}/users/index.php`;
const STAFF_SAVE_API = `${API}/users/save.php`;
const STAFF_REMOVE_API = `${API}/users/remove.php`;

const CLIENT_LIST_API = `${API}/clients/index.php`;
const CLIENT_SAVE_API = `${API}/clients/save.php`;
const CLIENT_REMOVE_API = `${API}/clients/remove.php`;

const emptyForm = {
    id: 0,
    name: "",
    email: "",
    role_id: "",
    status: "Active",
    password: "",
    phone: "",
    address: ""
};


function Users() {

    const currentUser = JSON.parse(
        localStorage.getItem("siomai_user") || "null"
    );

    const [staff, setStaff] = useState([]);
    const [clients, setClients] = useState([]);
    const [roles, setRoles] = useState([]);
    const [me, setMe] = useState(0);

    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // "staff" or "client": which table the popup is editing
    const [kind, setKind] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);


    const loadAll = async (term = search) => {

        try {

            setLoading(true);
            setError("");

            const query = `?search=${encodeURIComponent(term)}`;

            const [staffResponse, clientResponse] = await Promise.all([
                apiFetch(STAFF_LIST_API + query),
                apiFetch(CLIENT_LIST_API + query)
            ]);

            const staffResult = await staffResponse.json();
            const clientResult = await clientResponse.json();

            if (!staffResult.success) {
                throw new Error(staffResult.message || "Failed to load staff accounts.");
            }

            if (!clientResult.success) {
                throw new Error(clientResult.message || "Failed to load client accounts.");
            }

            setStaff(staffResult.users || []);
            setRoles(staffResult.roles || []);
            setMe(staffResult.me || 0);
            setClients(clientResult.clients || []);

        } catch (err) {

            setError(err.message || "Failed to load accounts.");

        } finally {

            setLoading(false);
        }
    };


    useEffect(() => {
        loadAll("");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const openAdd = (type) => {
        setKind(type);
        setForm({
            ...emptyForm,
            role_id: roles.length ? String(roles[roles.length - 1].id) : ""
        });
        setError("");
    };

    const openEditStaff = (user) => {
        setKind("staff");
        setForm({
            ...emptyForm,
            id: user.id,
            name: user.name || "",
            email: user.email || "",
            role_id: String(user.role_id || ""),
            status: user.status || "Active"
        });
        setError("");
    };

    const openEditClient = (client) => {
        setKind("client");
        setForm({
            ...emptyForm,
            id: client.id,
            name: client.name || "",
            email: client.email || "",
            status: client.status || "Active",
            phone: client.phone || "",
            address: client.address || ""
        });
        setError("");
    };

    const closeModal = () => setKind(null);

    const updateField = (field) => (event) =>
        setForm({ ...form, [field]: event.target.value });


    const saveAccount = async (event) => {

        event.preventDefault();

        try {

            setSaving(true);
            setError("");
            setMessage("");

            const isStaff = kind === "staff";

            const body = isStaff
                ? {
                    id: form.id,
                    name: form.name,
                    email: form.email,
                    role_id: Number(form.role_id),
                    status: form.status,
                    password: form.password
                }
                : {
                    id: form.id,
                    name: form.name,
                    email: form.email,
                    status: form.status,
                    password: form.password,
                    phone: form.phone,
                    address: form.address
                };

            const response = await apiFetch(
                isStaff ? STAFF_SAVE_API : CLIENT_SAVE_API,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                }
            );

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || "Failed to save account.");
            }

            closeModal();
            setMessage(result.message);

            await loadAll();

        } catch (err) {

            setError(err.message || "Failed to save account.");

        } finally {

            setSaving(false);
        }
    };


    const removeAccount = async (type, account) => {

        const confirmed = window.confirm(
            `Delete the account of "${account.name}"?\n\nThis cannot be undone.`
        );

        if (!confirmed) {
            return;
        }

        try {

            setError("");
            setMessage("");

            const response = await apiFetch(
                type === "staff" ? STAFF_REMOVE_API : CLIENT_REMOVE_API,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: account.id })
                }
            );

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || "Failed to delete account.");
            }

            setMessage(result.message);

            await loadAll();

        } catch (err) {

            setError(err.message || "Failed to delete account.");
        }
    };


    const statusBadge = (status) => (
        <span
            className={
                status === "Active"
                    ? "orders-badge status-active"
                    : "orders-badge status-inactive"
            }
        >
            {status}
        </span>
    );


    return (

        <div className="app-shell">

            <Sidebar
                active="Users"
                user={currentUser}
            />

            <main className="main-content">

                <header className="topbar">

                    <div>
                        <h1>Users</h1>
                        <p>Staff accounts and client accounts are kept separately.</p>
                    </div>

                    <div className="users-header-actions">

                        <button
                            type="button"
                            className="primary-btn"
                            onClick={() => openAdd("staff")}
                        >
                            + Add Staff
                        </button>

                        <button
                            type="button"
                            className="secondary-btn"
                            onClick={() => openAdd("client")}
                        >
                            + Add Client
                        </button>

                    </div>

                </header>


                {message && (
                    <div className="orders-success">{message}</div>
                )}

                {error && !kind && (
                    <div className="orders-error">{error}</div>
                )}


                <form
                    className="orders-filters"
                    onSubmit={(event) => {
                        event.preventDefault();
                        loadAll(search);
                    }}
                >

                    <input
                        type="text"
                        placeholder="Search name or email in both tables"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />

                    <button type="submit" className="primary-btn">
                        Search
                    </button>

                    <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => {
                            setSearch("");
                            loadAll("");
                        }}
                    >
                        Reset
                    </button>

                </form>


                <section className="panel orders-panel">

                    <div className="panel-title">
                        <h3>Staff Accounts</h3>
                        <span>
                            Admin, Owner, Cashier and Staff · {staff.length}
                        </span>
                    </div>

                    {loading ? (

                        <div className="orders-empty">Loading accounts...</div>

                    ) : staff.length === 0 ? (

                        <div className="orders-empty">No staff accounts found.</div>

                    ) : (

                        <div className="orders-table-wrapper">

                            <table className="orders-table">

                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th></th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {staff.map((user) => (

                                        <tr key={user.id}>

                                            <td>
                                                <strong>{user.name}</strong>

                                                {user.id === me && (
                                                    <span className="orders-hint"> (you)</span>
                                                )}
                                            </td>

                                            <td>{user.email}</td>

                                            <td>
                                                <span className="orders-badge role-badge">
                                                    {user.role_name || "—"}
                                                </span>
                                            </td>

                                            <td>{statusBadge(user.status)}</td>

                                            <td className="orders-row-actions">

                                                <button
                                                    type="button"
                                                    className="secondary-btn"
                                                    onClick={() => openEditStaff(user)}
                                                >
                                                    Edit
                                                </button>

                                                {user.id !== me && (
                                                    <button
                                                        type="button"
                                                        className="orders-danger-btn"
                                                        onClick={() => removeAccount("staff", user)}
                                                    >
                                                        Delete
                                                    </button>
                                                )}

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>


                <section className="panel orders-panel">

                    <div className="panel-title">
                        <h3>Client Accounts</h3>
                        <span>
                            Buyers who register · {clients.length}
                        </span>
                    </div>

                    {loading ? (

                        <div className="orders-empty">Loading accounts...</div>

                    ) : clients.length === 0 ? (

                        <div className="orders-empty">No client accounts found.</div>

                    ) : (

                        <div className="orders-table-wrapper">

                            <table className="orders-table">

                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Status</th>
                                        <th></th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {clients.map((client) => (

                                        <tr key={client.id}>

                                            <td>
                                                <strong>{client.name}</strong>
                                            </td>

                                            <td>{client.email}</td>

                                            <td>{client.phone || "—"}</td>

                                            <td>{statusBadge(client.status)}</td>

                                            <td className="orders-row-actions">

                                                <button
                                                    type="button"
                                                    className="secondary-btn"
                                                    onClick={() => openEditClient(client)}
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    className="orders-danger-btn"
                                                    onClick={() => removeAccount("client", client)}
                                                >
                                                    Delete
                                                </button>

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>

            </main>


            {kind && (

                <div className="orders-modal-overlay">

                    <div className="orders-modal">

                        <div className="orders-modal-header">

                            <div>
                                <h2>
                                    {form.id ? "Edit" : "Add"}{" "}
                                    {kind === "staff" ? "Staff Account" : "Client Account"}
                                </h2>
                                <p>
                                    {kind === "staff"
                                        ? "Admin, Owner, Cashier or Staff."
                                        : "A buyer who orders in the POS."}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="orders-modal-close"
                                onClick={closeModal}
                            >
                                ×
                            </button>

                        </div>


                        {error && (
                            <div className="orders-error">{error}</div>
                        )}


                        <form className="orders-form" onSubmit={saveAccount}>

                            <label>Name</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={updateField("name")}
                                required
                            />

                            <label>Email</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={updateField("email")}
                                required
                            />

                            {kind === "staff" && (
                                <>
                                    <label>Role</label>
                                    <select
                                        value={form.role_id}
                                        onChange={updateField("role_id")}
                                        required
                                    >
                                        <option value="" disabled>Choose a role</option>
                                        {roles.map((role) => (
                                            <option key={role.id} value={role.id}>
                                                {role.role_name}
                                            </option>
                                        ))}
                                    </select>
                                </>
                            )}

                            {kind === "client" && (
                                <>
                                    <label>Phone</label>
                                    <input
                                        type="text"
                                        value={form.phone}
                                        onChange={updateField("phone")}
                                    />

                                    <label>Address</label>
                                    <input
                                        type="text"
                                        value={form.address}
                                        onChange={updateField("address")}
                                    />
                                </>
                            )}

                            <label>Status</label>
                            <select
                                value={form.status}
                                onChange={updateField("status")}
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>

                            <label>
                                {form.id ? "New password" : "Password"}
                            </label>
                            <input
                                type="password"
                                placeholder={
                                    form.id
                                        ? "Leave blank to keep the current password"
                                        : "At least 8 characters"
                                }
                                value={form.password}
                                onChange={updateField("password")}
                                required={!form.id}
                            />

                            <div className="orders-modal-actions">

                                <button
                                    type="button"
                                    className="secondary-btn"
                                    onClick={closeModal}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="primary-btn"
                                    disabled={saving}
                                >
                                    {saving ? "Saving..." : "Save"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}


export default Users;
