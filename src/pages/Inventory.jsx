import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { API, IMAGE_URL, apiFetch } from "../api";

const INVENTORY_API = `${API}/inventory/index.php`;
const ADJUST_API = `${API}/inventory/adjust.php`;

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

    return Number.isNaN(date.getTime())
        ? String(value)
        : date.toLocaleString("en-PH", {
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


function Inventory() {

    const user = JSON.parse(
        localStorage.getItem("siomai_user") || "null"
    );

    const [products, setProducts] = useState([]);
    const [logs, setLogs] = useState([]);
    const [summary, setSummary] = useState(null);
    const [limit, setLimit] = useState(10);

    const [search, setSearch] = useState("");
    const [stockFilter, setStockFilter] = useState("all");

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [adjusting, setAdjusting] = useState(null);
    const [type, setType] = useState("add");
    const [quantity, setQuantity] = useState("");
    const [saving, setSaving] = useState(false);


    const loadInventory = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await apiFetch(INVENTORY_API);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || "Failed to load inventory.");
            }

            setProducts(result.products || []);
            setLogs(result.logs || []);
            setSummary(result.summary || null);
            setLimit(result.low_stock_limit || 10);

        } catch (err) {

            setError(err.message || "Failed to load inventory.");

        } finally {

            setLoading(false);
        }
    };


    useEffect(() => {
        loadInventory();
    }, []);


    const stockState = (stock) => {

        if (Number(stock) <= 0) {
            return "out";
        }

        if (Number(stock) <= limit) {
            return "low";
        }

        return "ok";
    };

    const visibleProducts = products.filter((product) => {

        const matchesSearch =
            product.product_name.toLowerCase().includes(search.toLowerCase()) ||
            (product.category || "").toLowerCase().includes(search.toLowerCase());

        const state = stockState(product.stock);

        const matchesFilter =
            stockFilter === "all" || stockFilter === state;

        return matchesSearch && matchesFilter;
    });


    const openAdjust = (product) => {
        setAdjusting(product);
        setType("add");
        setQuantity("");
        setError("");
    };


    const saveAdjustment = async (event) => {

        event.preventDefault();

        try {

            setSaving(true);
            setError("");
            setMessage("");

            const response = await apiFetch(ADJUST_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    product_id: adjusting.id,
                    type,
                    quantity: Number(quantity)
                })
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || "Failed to update stock.");
            }

            setAdjusting(null);
            setMessage(result.message);

            await loadInventory();

        } catch (err) {

            setError(err.message || "Failed to update stock.");

        } finally {

            setSaving(false);
        }
    };


    return (

        <div className="app-shell">

            <Sidebar
                active="Inventory"
                user={user}
            />

            <main className="main-content">

                <header className="topbar">

                    <div>
                        <h1>Inventory</h1>
                        <p>Track and adjust product stock.</p>
                    </div>

                    <div className="user-badge">
                        <strong>{user?.name}</strong>
                        <span>{user?.role_name || "User"}</span>
                    </div>

                </header>


                <section className="stat-grid">

                    <div className="stat-card">
                        <span>Total Products</span>
                        <strong>{summary?.total_products ?? 0}</strong>
                        <small>In the database</small>
                    </div>

                    <div className="stat-card">
                        <span>Low Stock</span>
                        <strong>{summary?.low_stock ?? 0}</strong>
                        <small>{limit} or fewer left</small>
                    </div>

                    <div className="stat-card">
                        <span>Out of Stock</span>
                        <strong>{summary?.out_of_stock ?? 0}</strong>
                        <small>Needs restocking</small>
                    </div>

                    <div className="stat-card">
                        <span>Stock Value</span>
                        <strong>{peso(summary?.stock_value)}</strong>
                        <small>Price × stock</small>
                    </div>

                </section>


                {message && (
                    <div className="orders-success inventory-gap">{message}</div>
                )}

                {error && !adjusting && (
                    <div className="orders-error inventory-gap">{error}</div>
                )}


                <section className="panel orders-panel">

                    <div className="panel-title">
                        <h3>Stock Levels</h3>
                        <span>
                            {visibleProducts.length} product
                            {visibleProducts.length !== 1 ? "s" : ""}
                        </span>
                    </div>


                    <div className="orders-filters">

                        <input
                            type="text"
                            placeholder="Search product or category"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />

                        <select
                            value={stockFilter}
                            onChange={(event) => setStockFilter(event.target.value)}
                        >
                            <option value="all">All stock levels</option>
                            <option value="low">Low stock</option>
                            <option value="out">Out of stock</option>
                            <option value="ok">In stock</option>
                        </select>

                    </div>


                    {loading ? (

                        <div className="orders-empty">Loading inventory...</div>

                    ) : visibleProducts.length === 0 ? (

                        <div className="orders-empty">No products found.</div>

                    ) : (

                        <div className="orders-table-wrapper">

                            <table className="orders-table">

                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Category</th>
                                        <th>Price</th>
                                        <th>Stock</th>
                                        <th>Level</th>
                                        <th>Value</th>
                                        <th></th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {visibleProducts.map((product) => {

                                        const state = stockState(product.stock);

                                        return (

                                            <tr key={product.id}>

                                                <td>
                                                    <div className="inventory-product">

                                                        {product.image ? (
                                                            <img
                                                                src={IMAGE_URL + product.image}
                                                                alt={product.product_name}
                                                                className="inventory-thumb"
                                                            />
                                                        ) : (
                                                            <div className="inventory-thumb inventory-thumb-empty">
                                                                SH
                                                            </div>
                                                        )}

                                                        <strong>{product.product_name}</strong>

                                                    </div>
                                                </td>

                                                <td>{product.category || "—"}</td>

                                                <td>{peso(product.price)}</td>

                                                <td>
                                                    <strong>{product.stock}</strong>
                                                </td>

                                                <td>
                                                    <span className={`orders-badge stock-${state}`}>
                                                        {state === "out"
                                                            ? "Out of stock"
                                                            : state === "low"
                                                                ? "Low stock"
                                                                : "In stock"}
                                                    </span>
                                                </td>

                                                <td>
                                                    {peso(Number(product.stock) * Number(product.price))}
                                                </td>

                                                <td>
                                                    <button
                                                        type="button"
                                                        className="secondary-btn"
                                                        onClick={() => openAdjust(product)}
                                                    >
                                                        Adjust
                                                    </button>
                                                </td>

                                            </tr>
                                        );
                                    })}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>


                <section className="panel orders-panel">

                    <div className="panel-title">
                        <h3>Recent Stock Movements</h3>
                        <span>Latest {logs.length}</span>
                    </div>

                    {logs.length === 0 ? (

                        <div className="orders-empty">
                            No stock movements yet.
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
                                            <td>{formatDate(log.created_at)}</td>
                                            <td>{log.product_name || "—"}</td>
                                            <td>{actionLabel(log.action)}</td>
                                            <td>{log.quantity}</td>
                                            <td>{log.user_name || "—"}</td>
                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>

            </main>


            {adjusting && (

                <div className="orders-modal-overlay">

                    <div className="orders-modal">

                        <div className="orders-modal-header">

                            <div>
                                <h2>Adjust Stock</h2>
                                <p>
                                    {adjusting.product_name} — currently {adjusting.stock} in stock
                                </p>
                            </div>

                            <button
                                type="button"
                                className="orders-modal-close"
                                onClick={() => setAdjusting(null)}
                            >
                                ×
                            </button>

                        </div>


                        {error && (
                            <div className="orders-error">{error}</div>
                        )}


                        <form className="orders-form" onSubmit={saveAdjustment}>

                            <label>Action</label>
                            <select
                                value={type}
                                onChange={(event) => setType(event.target.value)}
                            >
                                <option value="add">Add stock</option>
                                <option value="remove">Remove stock</option>
                            </select>

                            <label>Quantity</label>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={quantity}
                                onChange={(event) => setQuantity(event.target.value)}
                                required
                            />

                            <div className="orders-modal-actions">

                                <button
                                    type="button"
                                    className="secondary-btn"
                                    onClick={() => setAdjusting(null)}
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


export default Inventory;
