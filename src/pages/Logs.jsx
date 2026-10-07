import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { API, apiFetch } from "../api";

const LOGS_API = `${API}/logs/index.php`;

const formatDate = (value) => {

    if (!value) {
        return "—";
    }

    const date = new Date(String(value).replace(" ", "T"));

    return Number.isNaN(date.getTime())
        ? String(value)
        : date.toLocaleString("en-PH", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });
};

const actionLabel = (action) => {

    const labels = {
        SALE: "Sale",
        RESTOCK: "Stock added",
        ADJUSTMENT: "Stock removed"
    };

    return labels[String(action).toUpperCase()] || action;
};

const emptyFilters = { search: "", status: "", from: "", to: "" };


function Logs() {

    const user = JSON.parse(
        localStorage.getItem("siomai_user") || "null"
    );

    const [tab, setTab] = useState("login");
    const [filters, setFilters] = useState(emptyFilters);

    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    const loadLogs = async (type = tab, activeFilters = filters) => {

        try {

            setLoading(true);
            setError("");

            const query = new URLSearchParams({ type });

            Object.entries(activeFilters).forEach(([key, value]) => {
                if (value) {
                    query.set(key, value);
                }
            });

            const response = await apiFetch(`${LOGS_API}?${query.toString()}`);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || "Failed to load logs.");
            }

            setLogs(result.logs || []);

        } catch (err) {

            setLogs([]);
            setError(err.message || "Failed to load logs.");

        } finally {

            setLoading(false);
        }
    };


    useEffect(() => {
        loadLogs("login", emptyFilters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const switchTab = (type) => {
        setTab(type);
        setFilters(emptyFilters);
        loadLogs(type, emptyFilters);
    };

    const updateFilter = (field) => (event) =>
        setFilters({ ...filters, [field]: event.target.value });


    return (

        <div className="app-shell">

            <Sidebar
                active="Logs"
                user={user}
            />

            <main className="main-content">

                <header className="topbar">

                    <div>
                        <h1>Logs</h1>
                        <p>Who logged in and what happened to the stock.</p>
                    </div>

                    <div className="user-badge">
                        <strong>{user?.name}</strong>
                        <span>{user?.role_name || "User"}</span>
                    </div>

                </header>


                <div className="report-presets logs-tabs">

                    <button
                        type="button"
                        className={tab === "login" ? "report-chip active" : "report-chip"}
                        onClick={() => switchTab("login")}
                    >
                        Login Logs
                    </button>

                    <button
                        type="button"
                        className={tab === "stock" ? "report-chip active" : "report-chip"}
                        onClick={() => switchTab("stock")}
                    >
                        Stock Logs
                    </button>

                </div>


                <section className="panel orders-panel">

                    <div className="panel-title">
                        <h3>{tab === "login" ? "Login Activity" : "Stock Movements"}</h3>
                        <span>
                            Latest {logs.length}
                        </span>
                    </div>


                    <form
                        className="orders-filters"
                        onSubmit={(event) => {
                            event.preventDefault();
                            loadLogs();
                        }}
                    >

                        <input
                            type="text"
                            placeholder={
                                tab === "login"
                                    ? "Search name, email or IP address"
                                    : "Search product or user"
                            }
                            value={filters.search}
                            onChange={updateFilter("search")}
                        />

                        {tab === "login" && (
                            <select
                                value={filters.status}
                                onChange={updateFilter("status")}
                            >
                                <option value="">All results</option>
                                <option value="Success">Successful</option>
                                <option value="Failed">Failed</option>
                            </select>
                        )}

                        <input
                            type="date"
                            value={filters.from}
                            onChange={updateFilter("from")}
                            title="From date"
                        />

                        <input
                            type="date"
                            value={filters.to}
                            onChange={updateFilter("to")}
                            title="To date"
                        />

                        <button type="submit" className="primary-btn">
                            Filter
                        </button>

                        <button
                            type="button"
                            className="secondary-btn"
                            onClick={() => {
                                setFilters(emptyFilters);
                                loadLogs(tab, emptyFilters);
                            }}
                        >
                            Reset
                        </button>

                    </form>


                    {error && (
                        <div className="orders-error">{error}</div>
                    )}


                    {loading ? (

                        <div className="orders-empty">Loading logs...</div>

                    ) : logs.length === 0 ? (

                        <div className="orders-empty">No logs found.</div>

                    ) : tab === "login" ? (

                        <div className="orders-table-wrapper">

                            <table className="orders-table">

                                <thead>
                                    <tr>
                                        <th>Login time</th>
                                        <th>Account</th>
                                        <th>Type</th>
                                        <th>Result</th>
                                        <th>IP address</th>
                                        <th>Logout time</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {logs.map((log) => (

                                        <tr key={log.id}>

                                            <td>{formatDate(log.logged_at)}</td>

                                            <td>
                                                <strong>
                                                    {log.account_name || "Unknown account"}
                                                </strong>

                                                {log.account_email && (
                                                    <div className="orders-hint">
                                                        {log.account_email}
                                                    </div>
                                                )}
                                            </td>

                                            <td>
                                                <span className="orders-badge role-badge">
                                                    {log.account_type}
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className={
                                                        log.status === "Success"
                                                            ? "orders-badge completed"
                                                            : "orders-badge cancelled"
                                                    }
                                                >
                                                    {log.status}
                                                </span>
                                            </td>

                                            <td>{log.ip_address || "—"}</td>

                                            <td>{formatDate(log.logout_at)}</td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    ) : (

                        <div className="orders-table-wrapper">

                            <table className="orders-table">

                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Product</th>
                                        <th>Action</th>
                                        <th>Qty</th>
                                        <th>By</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {logs.map((log, index) => (

                                        <tr key={index}>
                                            <td>{formatDate(log.logged_at)}</td>
                                            <td>{log.product_name || "—"}</td>
                                            <td>{actionLabel(log.action)}</td>
                                            <td>{log.quantity}</td>
                                            <td>{log.account_name}</td>
                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>

            </main>

        </div>
    );
}


export default Logs;
