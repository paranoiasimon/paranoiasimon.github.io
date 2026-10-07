import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { API, IMAGE_URL, apiFetch } from "../api";

const PRODUCTS_API = `${API}/products/index.php`;

const CREATE_API = `${API}/products/create.php`;

const UPDATE_API = `${API}/products/update.php`;

const DELETE_API = `${API}/products/delete.php`;

const ENABLE_API = `${API}/products/enable.php`;

const REMOVE_API = `${API}/products/remove.php`;


function ProductManagement() {

    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const [form, setForm] = useState({
        product_name: "",
        category: "",
        price: "",
        stock: "",
        status: "Available",
        image: ""
    });

    const user = JSON.parse(
        localStorage.getItem("siomai_user") || "null"
    );

    const loadProducts = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await apiFetch(PRODUCTS_API);

            const result = await response.json();

            if (!result.success) {
                throw new Error(
                    result.message || "Failed to load products."
                );
            }

            setProducts(result.products || []);

        } catch (err) {

            console.error("PRODUCT LOAD ERROR:", err);

            setError(
                "Failed to load products: " + err.message
            );

        } finally {

            setLoading(false);

        }
    };


    useEffect(() => {
        loadProducts();
    }, []);


    const openAddModal = () => {

        setEditingProduct(null);

        setForm({
            product_name: "",
            category: "",
            price: "",
            stock: "",
            status: "Available",
            image: ""
        });

        setMessage("");
        setError("");
        setShowModal(true);
    };


    const openEditModal = (product) => {

        setEditingProduct(product);

        setForm({
            product_name: product.product_name || "",
            category: product.category || "",
            price: product.price || "",
            stock: product.stock || "",
            status: product.status || "Available",
            image: product.image || ""
        });

        setMessage("");
        setError("");
        setShowModal(true);
    };


    const closeModal = () => {

        setShowModal(false);
        setEditingProduct(null);

        setForm({
            product_name: "",
            category: "",
            price: "",
            stock: "",
            status: "Available",
            image: ""
        });

        setMessage("");
        setError("");
    };


    const handleChange = (event) => {

        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };


    const saveProduct = async (event) => {

        event.preventDefault();

        setMessage("");
        setError("");

        try {

            const api = editingProduct
                ? UPDATE_API
                : CREATE_API;

            const body = editingProduct
                ? {
                    id: Number(editingProduct.id),
                    product_name: form.product_name,
                    category: form.category,
                    price: Number(form.price),
                    stock: Number(form.stock),
                    status: form.status,
                    image: form.image
                }
                : {
                    product_name: form.product_name,
                    category: form.category,
                    price: Number(form.price),
                    stock: Number(form.stock),
                    image: form.image
                };

            const response = await apiFetch(api, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(body)
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(
                    result.message || "Failed to save product."
                );
            }

            setMessage(
                editingProduct
                    ? "Product updated successfully."
                    : "Product added successfully."
            );

            await loadProducts();

            setTimeout(() => {
                closeModal();
            }, 700);

        } catch (err) {

            console.error("PRODUCT SAVE ERROR:", err);

            setError(
                err.message || "Failed to save product."
            );
        }
    };


    const disableProduct = async (product) => {

        const confirmed = window.confirm(
            `Disable "${product.product_name}"?`
        );

        if (!confirmed) {
            return;
        }

        try {

            setError("");
            setMessage("");

            const response = await apiFetch(DELETE_API, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    id: Number(product.id)
                })
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(
                    result.message || "Failed to disable product."
                );
            }

            setMessage("Product disabled successfully.");

            await loadProducts();

        } catch (err) {

            console.error("PRODUCT DELETE ERROR:", err);

            setError(
                err.message || "Failed to disable product."
            );
        }
    };


    const enableProduct = async (product) => {

        try {

            setError("");
            setMessage("");

            const response = await apiFetch(ENABLE_API, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    id: Number(product.id)
                })
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(
                    result.message || "Failed to enable product."
                );
            }

            setMessage("Product enabled successfully.");

            await loadProducts();

        } catch (err) {

            console.error("PRODUCT ENABLE ERROR:", err);

            setError(
                err.message || "Failed to enable product."
            );
        }
    };


    const removeProduct = async (product) => {

        const confirmed = window.confirm(
            `Permanently delete "${product.product_name}"?\n\nPast orders keep the product name. This cannot be undone.`
        );

        if (!confirmed) {
            return;
        }

        try {

            setError("");
            setMessage("");

            const response = await apiFetch(REMOVE_API, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    id: Number(product.id)
                })
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(
                    result.message || "Failed to delete product."
                );
            }

            setMessage("Product deleted successfully.");
            window.scrollTo({ top: 0, behavior: "smooth" });

            await loadProducts();

        } catch (err) {

            console.error("PRODUCT REMOVE ERROR:", err);

            setError(
                err.message || "Failed to delete product."
            );
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };


    const handleLogout = () => {

        localStorage.removeItem("siomai_user");

        navigate("/");
    };


    return (

        <div className="app-shell">

            <Sidebar
                active="Products"
                user={user}
                onLogout={handleLogout}
            />


            <main className="main-content">

                <div className="page-header">

                    <div>
                        <h1>Product Management</h1>

                        <p>
                            Manage Siomai House products,
                            prices and stock.
                        </p>
                    </div>


                    <button
                        type="button"
                        className="primary-btn"
                        onClick={openAddModal}
                    >
                        + Add Product
                    </button>

                </div>


                {message && (
                    <div className="success-message">
                        {message}
                    </div>
                )}


                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}


                <div className="products-card">

                    <div className="products-card-header">

                        <div>
                            <h2>Products</h2>

                            <span>
                                {products.length} product
                                {products.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                    </div>


                    {loading ? (

                        <div className="empty-products">
                            Loading products...
                        </div>

                    ) : products.length === 0 ? (

                        <div className="empty-products">
                            No products found.
                        </div>

                    ) : (

                        <div className="products-table-wrapper">

                            <table className="products-table">

                                <thead>

                                    <tr>
                                        <th>ID</th>
                                        <th>Product</th>
                                        <th>Category</th>
                                        <th>Price</th>
                                        <th>Stock</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>

                                </thead>


                                <tbody>

                                    {products.map((product) => (

                                        <tr key={product.id}>

                                            <td>
                                                #{product.id}
                                            </td>


                                            <td>

                                                <div className="product-info">

                                                    {product.image ? (

                                                        <img
                                                            src={
                                                                IMAGE_URL +
                                                                product.image
                                                            }
                                                            alt={
                                                                product.product_name
                                                            }
                                                            className="product-thumb"
                                                        />

                                                    ) : (

                                                        <div className="product-thumb-placeholder">
                                                            SH
                                                        </div>

                                                    )}


                                                    <strong>
                                                        {product.product_name}
                                                    </strong>

                                                </div>

                                            </td>


                                            <td>
                                                {product.category || "-"}
                                            </td>


                                            <td>
                                                ₱
                                                {Number(
                                                    product.price
                                                ).toFixed(2)}
                                            </td>


                                            <td>

                                                <span
                                                    className={
                                                        Number(product.stock) <= 5
                                                            ? "stock-low"
                                                            : "stock-normal"
                                                    }
                                                >
                                                    {product.stock}
                                                </span>

                                            </td>


                                            <td>

                                                <span
                                                    className={
                                                        product.status === "Available"
                                                            ? "status-available"
                                                            : "status-unavailable"
                                                    }
                                                >
                                                    {product.status}
                                                </span>

                                            </td>


                                            <td>

                                                <div className="product-actions">

                                                    <button
                                                        type="button"
                                                        className="edit-btn"
                                                        onClick={() =>
                                                            openEditModal(product)
                                                        }
                                                    >
                                                        Edit
                                                    </button>


                                                    {product.status === "Available" && (

                                                        <button
                                                            type="button"
                                                            className="disable-btn"
                                                            onClick={() =>
                                                                disableProduct(product)
                                                            }
                                                        >
                                                            Disable
                                                        </button>

                                                    )}

                                                    {product.status !== "Available" && (

                                                        <button
                                                            type="button"
                                                            className="enable-btn"
                                                            onClick={() =>
                                                                enableProduct(product)
                                                            }
                                                        >
                                                            Enable
                                                        </button>

                                                    )}

                                                    <button
                                                        type="button"
                                                        className="delete-btn"
                                                        onClick={() =>
                                                            removeProduct(product)
                                                        }
                                                    >
                                                        Delete
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            </main>


            {showModal && (

                <div className="modal-overlay">

                    <div className="product-modal">

                        <div className="modal-header">

                            <div>

                                <h2>
                                    {editingProduct
                                        ? "Edit Product"
                                        : "Add Product"}
                                </h2>

                                <p>
                                    Enter product information below.
                                </p>

                            </div>


                            <button
                                type="button"
                                className="modal-close"
                                onClick={closeModal}
                            >
                                ×
                            </button>

                        </div>


                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}


                        <form onSubmit={saveProduct}>

                            <div className="form-grid">

                                <div className="form-group">

                                    <label>
                                        Product Name
                                    </label>

                                    <input
                                        type="text"
                                        name="product_name"
                                        value={form.product_name}
                                        onChange={handleChange}
                                        placeholder="Enter product name"
                                        required
                                    />

                                </div>


                                <div className="form-group">

                                    <label>
                                        Category
                                    </label>

                                    <input
                                        type="text"
                                        name="category"
                                        value={form.category}
                                        onChange={handleChange}
                                        placeholder="e.g. Siomai"
                                    />

                                </div>


                                <div className="form-group">

                                    <label>
                                        Price
                                    </label>

                                    <input
                                        type="number"
                                        name="price"
                                        value={form.price}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        required
                                    />

                                </div>


                                <div className="form-group">

                                    <label>
                                        Stock
                                    </label>

                                    <input
                                        type="number"
                                        name="stock"
                                        value={form.stock}
                                        onChange={handleChange}
                                        min="0"
                                        placeholder="0"
                                        required
                                    />

                                </div>


                                {editingProduct && (

                                    <div className="form-group">

                                        <label>
                                            Status
                                        </label>

                                        <select
                                            name="status"
                                            value={form.status}
                                            onChange={handleChange}
                                        >
                                            <option value="Available">
                                                Available
                                            </option>

                                            <option value="Unavailable">
                                                Unavailable
                                            </option>

                                        </select>

                                    </div>

                                )}


                                <div className="form-group">

                                    <label>
                                        Image Filename
                                    </label>

                                    <input
                                        type="text"
                                        name="image"
                                        value={form.image}
                                        onChange={handleChange}
                                        placeholder="e.g. it_1.jpg"
                                    />

                                    <small>
                                        Example: it_1.jpg
                                    </small>

                                </div>

                            </div>


                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={closeModal}
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    className="primary-btn"
                                >
                                    {editingProduct
                                        ? "Update Product"
                                        : "Add Product"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default ProductManagement;