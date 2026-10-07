import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { API, apiFetch } from "../api";

const ORDERS_API = `${API}/orders/index.php`;
const DETAILS_API = `${API}/orders/details.php`;

const peso = (value) =>
    "₱" +
    Number(value || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

const formatDate = (value) => {

    if (!value) {
        return "—";
    }

    const date = new Date(String(value).replace(" ", "T"));

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
};

const emptyFilters = {
    search: "",
    payment_method: "",
    from: "",
    to: ""
};


function Orders() {

    const user = JSON.parse(
        localStorage.getItem("siomai_user") || "null"
    );

    const [orders, setOrders] = useState([]);
    const [summary, setSummary] = useState(null);
    const [filters, setFilters] = useState(emptyFilters);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selected, setSelected] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);


    const loadOrders = async (activeFilters = filters) => {

        try {

            setLoading(true);
            setError("");

            const query = new URLSearchParams();

            Object.entries(activeFilters).forEach(([key, value]) => {
                if (value) {
                    query.set(key, value);
                }
            });

            const response = await apiFetch(
                `${ORDERS_API}?${query.toString()}`
            );

            const result = await response.json();

            if (!result.success) {
                throw new Error(
                    result.message || "Failed to load orders."
                );
            }

            setOrders(result.orders || []);
            setSummary(result.summary || null);

        } catch (err) {

            console.error("ORDERS ERROR:", err);

            setError(err.message || "Failed to load orders.");

        } finally {

            setLoading(false);
        }
    };


    useEffect(() => {
        loadOrders(emptyFilters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const applyFilters = (event) => {
        event.preventDefault();
        loadOrders(filters);
    };

    const resetFilters = () => {
        setFilters(emptyFilters);
        loadOrders(emptyFilters);
    };

    const updateFilter = (field) => (event) =>
        setFilters({ ...filters, [field]: event.target.value });


    const openDetails = async (orderId) => {

        try {

            setDetailsLoading(true);
            setSelected({ order: null, items: [] });

            const response = await apiFetch(
                `${DETAILS_API}?id=${orderId}`
            );

            const result = await response.json();

            if (!result.success) {
                throw new Error(
                    result.message || "Failed to load order."
                );
            }

            setSelected({
                order: result.order,
                items: result.items || []
            });

        } catch (err) {

            setSelected(null);
            setError(err.message || "Failed to load order.");

        } finally {

            setDetailsLoading(false);
        }
    };


    return (

        <div className="app-shell">

            <Sidebar
                active="Orders"
                user={user}
            />

            <main className="main-content">

                <header className="topbar">

                    <div>
                        <h1>Orders</h1>
                        <p>Sales history of Siomai House.</p>
                    </div>

                    <div className="user-badge">
                        <strong>{user?.name}</strong>
                        <span>{user?.role_name || "User"}</span>
                    </div>

                </header>


                <section className="stat-grid">

                    <div className="stat-card">
                        <span>Today's Sales</span>
                        <strong>{peso(summary?.today_sales)}</strong>
                        <small>Cancelled orders excluded</small>
                    </div>

                    <div className="stat-card">
                        <span>Today's Orders</span>
                        <strong>{summary?.today_orders ?? 0}</strong>
                        <small>Orders placed today</small>
                    </div>

                    <div className="stat-card">
                        <span>Total Sales</span>
                        <strong>{peso(summary?.total_sales)}</strong>
                        <small>All time</small>
                    </div>

                    <div className="stat-card">
                        <span>Total Orders</span>
                        <strong>{summary?.total_orders ?? 0}</strong>
                        <small>All time</small>
                    </div>

                </section>


                <section className="panel orders-panel">

                    <div className="panel-title">
                        <h3>Order History</h3>
                        <span>
                            {orders.length} order
                            {orders.length !== 1 ? "s" : ""} shown
                        </span>
                    </div>


                    <form
                        className="orders-filters"
                        onSubmit={applyFilters}
                    >

                        <input
                            type="text"
                            placeholder="Search order # or cashier"
                            value={filters.search}
                            onChange={updateFilter("search")}
                        />

                        <select
                            value={filters.payment_method}
                            onChange={updateFilter("payment_method")}
                        >
                            <option value="">All payments</option>
                            <option value="Cash">Cash</option>
                            <option value="GCash">GCash</option>
                            <option value="Card">Card</option>
                        </select>

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
                            onClick={resetFilters}
                        >
                            Reset
                        </button>

                    </form>


                    {error && (
                        <div className="orders-error">
                            {error}
                        </div>
                    )}


                    {loading ? (

                        <div className="orders-empty">
                            Loading orders...
                        </div>

                    ) : orders.length === 0 ? (

                        <div className="orders-empty">
                            No orders found.
                        </div>

                    ) : (

                        <div className="orders-table-wrapper">

                            <table className="orders-table">

                                <thead>
                                    <tr>
                                        <th>Order</th>
                                        <th>Date</th>
                                        <th>Cashier</th>
                                        <th>Items</th>
                                        <th>Payment</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                        <th></th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {orders.map((order) => (

                                        <tr key={order.id}>

                                            <td>
                                                <strong>#{order.id}</strong>
                                            </td>

                                            <td>{formatDate(order.created_at)}</td>

                                            <td>{order.cashier_name || "—"}</td>

                                            <td>{order.items_count}</td>

                                            <td>{order.payment_method}</td>

                                            <td>
                                                <strong>
                                                    {peso(order.total_amount)}
                                                </strong>
                                            </td>

                                            <td>
                                                <span
                                                    className={
                                                        order.status === "Cancelled"
                                                            ? "orders-badge cancelled"
                                                            : "orders-badge completed"
                                                    }
                                                >
                                                    {order.status}
                                                </span>
                                            </td>

                                            <td>
                                                <button
                                                    type="button"
                                                    className="secondary-btn"
                                                    onClick={() =>
                                                        openDetails(order.id)
                                                    }
                                                >
                                                    View
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


            {selected && (

                <div
                    className="orders-modal-overlay"
                    onClick={() => setSelected(null)}
                >

                    <div
                        className="orders-modal"
                        onClick={(event) => event.stopPropagation()}
                    >

                        {detailsLoading || !selected.order ? (

                            <div className="orders-empty">
                                Loading order...
                            </div>

                        ) : (

                            <>

                                <div className="orders-modal-header">

                                    <div>
                                        <h2>Order #{selected.order.id}</h2>
                                        <p>{formatDate(selected.order.created_at)}</p>
                                    </div>

                                    <button
                                        type="button"
                                        className="orders-modal-close"
                                        onClick={() => setSelected(null)}
                                    >
                                        ×
                                    </button>

                                </div>


                                <table className="orders-table">

                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Qty</th>
                                            <th>Price</th>
                                            <th>Subtotal</th>
                                        </tr>
                                    </thead>

                                    <tbody>

                                        {selected.items.map((item) => (

                                            <tr key={item.id}>
                                                <td>
                                                    {item.product_name ||
                                                        `Product #${item.product_id}`}
                                                </td>
                                                <td>{item.quantity}</td>
                                                <td>{peso(item.price)}</td>
                                                <td>{peso(item.subtotal)}</td>
                                            </tr>

                                        ))}

                                    </tbody>

                                </table>


                                <div className="orders-summary">

                                    <div className="status-row">
                                        <span>Cashier</span>
                                        <strong>{selected.order.cashier_name || "—"}</strong>
                                    </div>

                                    <div className="status-row">
                                        <span>Payment method</span>
                                        <strong>{selected.order.payment_method}</strong>
                                    </div>

                                    {selected.order.payment_method === "Cash" && (
                                        <>
                                            <div className="status-row">
                                                <span>Cash received</span>
                                                <strong>{peso(selected.order.cash_received)}</strong>
                                            </div>

                                            <div className="status-row">
                                                <span>Change</span>
                                                <strong>{peso(selected.order.change_amount)}</strong>
                                            </div>
                                        </>
                                    )}

                                    <div className="status-row orders-total">
                                        <span>Total</span>
                                        <strong>{peso(selected.order.total_amount)}</strong>
                                    </div>

                                </div>


                                <div className="orders-modal-actions">
                                    <button
                                        type="button"
                                        className="secondary-btn"
                                        onClick={() => setSelected(null)}
                                    >
                                        Close
                                    </button>
                                </div>

                            </>

                        )}

                    </div>

                </div>

            )}

        </div>
    );
}


export default Orders;
