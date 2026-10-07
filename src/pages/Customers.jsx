import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { API, apiFetch } from "../api";

const LIST_API = `${API}/customers/index.php`;
const SAVE_API = `${API}/customers/save.php`;
const REMOVE_API = `${API}/customers/remove.php`;

const peso = (value) =>
    "₱" +
    Number(value || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

const emptyForm = { id: 0, name: "", phone: "", email: "", address: "" };


function Customers() {

    const user = JSON.parse(
        localStorage.getItem("siomai_user") || "null"
    );

    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);


    const loadCustomers = async (term = search) => {

        try {

            setLoading(true);
            setError("");

            const response = await apiFetch(
                `${LIST_API}?search=${encodeURIComponent(term)}`
            );

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || "Failed to load customers.");
            }

            setCustomers(result.customers || []);

        } catch (err) {

            setError(err.message || "Failed to load customers.");

        } finally {

            setLoading(false);
        }
    };


    useEffect(() => {
        loadCustomers("");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const openAdd = () => {
        setForm(emptyForm);
        setError("");
        setShowModal(true);
    };

    const openEdit = (customer) => {
        setForm({
            id: customer.id,
            name: customer.name || "",
            phone: customer.phone || "",
            email: customer.email || "",
            address: customer.address || ""
        });
        setError("");
        setShowModal(true);
    };

    const updateField = (field) => (event) =>
        setForm({ ...form, [field]: event.target.value });


    const saveCustomer = async (event) => {

        event.preventDefault();

        try {

            setSaving(true);
            setError("");
            setMessage("");

            const response = await apiFetch(SAVE_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || "Failed to save customer.");
            }

            setShowModal(false);
            setMessage(result.message);

            await loadCustomers();

        } catch (err) {

            setError(err.message || "Failed to save customer.");

        } finally {

            setSaving(false);
        }
    };


    const removeCustomer = async (customer) => {

        const confirmed = window.confirm(
            `Delete customer "${customer.name}"?\n\nTheir past orders are kept.`
        );

        if (!confirmed) {
            return;
        }

        try {

            setError("");
            setMessage("");

            const response = await apiFetch(REMOVE_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: customer.id })
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || "Failed to delete customer.");
            }

            setMessage(result.message);

            await loadCustomers();

        } catch (err) {

            setError(err.message || "Failed to delete customer.");
        }
    };


    return (

        <div className="app-shell">

            <Sidebar
                active="Customers"
                user={user}
            />

            <main className="main-content">

                <header className="topbar">

                    <div>
                        <h1>Customers</h1>
                        <p>Manage your Siomai House customers.</p>
                    </div>

                    <button
                        type="button"
                        className="primary-btn"
                        onClick={openAdd}
                    >
                        + Add Customer
                    </button>

                </header>


                {message && (
                    <div className="orders-success">{message}</div>
                )}

                {error && !showModal && (
                    <div className="orders-error">{error}</div>
                )}


                <section className="panel orders-panel">

                    <div className="panel-title">
                        <h3>Customer List</h3>
                        <span>
                            {customers.length} customer
                            {customers.length !== 1 ? "s" : ""}
                        </span>
                    </div>


                    <form
                        className="orders-filters"
                        onSubmit={(event) => {
                            event.preventDefault();
                            loadCustomers(search);
                        }}
                    >

                        <input
                            type="text"
                            placeholder="Search name, phone or email"
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
                                loadCustomers("");
                            }}
                        >
                            Reset
                        </button>

                    </form>


                    {loading ? (

                        <div className="orders-empty">Loading customers...</div>

                    ) : customers.length === 0 ? (

                        <div className="orders-empty">No customers found.</div>

                    ) : (

                        <div className="orders-table-wrapper">

                            <table className="orders-table">

                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Phone</th>
                                        <th>Email</th>
                                        <th>Address</th>
                                        <th>Orders</th>
                                        <th>Total Spent</th>
                                        <th></th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {customers.map((customer) => (

                                        <tr key={customer.id}>

                                            <td>
                                                <strong>{customer.name}</strong>

                                                {customer.client_id && (
                                                    <span className="orders-badge completed customer-tag">
                                                        Account
                                                    </span>
                                                )}
                                            </td>

                                            <td>{customer.phone || "—"}</td>

                                            <td>{customer.email || "—"}</td>

                                            <td>{customer.address || "—"}</td>

                                            <td>{customer.orders_count}</td>

                                            <td>{peso(customer.total_spent)}</td>

                                            <td className="orders-row-actions">

                                                <button
                                                    type="button"
                                                    className="secondary-btn"
                                                    onClick={() => openEdit(customer)}
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    className="orders-danger-btn"
                                                    onClick={() => removeCustomer(customer)}
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


            {showModal && (

                <div className="orders-modal-overlay">

                    <div className="orders-modal">

                        <div className="orders-modal-header">

                            <div>
                                <h2>{form.id ? "Edit Customer" : "Add Customer"}</h2>
                                <p>Enter the customer's information.</p>
                            </div>

                            <button
                                type="button"
                                className="orders-modal-close"
                                onClick={() => setShowModal(false)}
                            >
                                ×
                            </button>

                        </div>


                        {error && (
                            <div className="orders-error">{error}</div>
                        )}


                        <form className="orders-form" onSubmit={saveCustomer}>

                            <label>Name</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={updateField("name")}
                                required
                            />

                            <label>Phone</label>
                            <input
                                type="text"
                                value={form.phone}
                                onChange={updateField("phone")}
                            />

                            <label>Email</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={updateField("email")}
                            />

                            <label>Address</label>
                            <input
                                type="text"
                                value={form.address}
                                onChange={updateField("address")}
                            />

                            <div className="orders-modal-actions">

                                <button
                                    type="button"
                                    className="secondary-btn"
                                    onClick={() => setShowModal(false)}
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


export default Customers;
