import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { API, IMAGE_URL, apiFetch } from "../api";

const API_URL = `${API}/products/index.php`;

function POS() {
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [category, setCategory] = useState("All");
    const [search, setSearch] = useState("");

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);

            const response = await apiFetch(API_URL);
            const result = await response.json();

            if (result.success) {
                setProducts(result.products);
            } else {
                setMessage(result.message || "Unable to load products.");
            }
        } catch (error) {
            console.error(error);
            setMessage("Cannot connect to the Products API.");
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product) => {
        if (Number(product.stock) <= 0) {
            setMessage(`${product.product_name} is out of stock.`);
            return;
        }

        setMessage("");

        setCart((currentCart) => {
            const existing = currentCart.find(
                (item) => item.id === product.id
            );

            if (existing) {
                if (existing.quantity >= Number(product.stock)) {
                    setMessage(
                        `Only ${product.stock} ${product.product_name} available.`
                    );
                    return currentCart;
                }

                return currentCart.map((item) =>
                    item.id === product.id
                        ? {
                              ...item,
                              quantity: item.quantity + 1,
                              subtotal:
                                  (item.quantity + 1) *
                                  Number(item.price),
                          }
                        : item
                );
            }

            return [
                ...currentCart,
                {
                    ...product,
                    quantity: 1,
                    subtotal: Number(product.price),
                },
            ];
        });
    };

const increaseQuantity = (id) => {
    setCart((currentCart) =>
        currentCart.map((item) => {
            if (Number(item.id) !== Number(id)) {
                return item;
            }

            const stock = Number(item.stock);
            const currentQuantity = Number(item.quantity);

            if (currentQuantity >= stock) {
                setMessage(
                    `Only ${stock} ${item.product_name} available.`
                );
                return item;
            }

            const quantity = currentQuantity + 1;

            return {
                ...item,
                quantity: quantity,
                subtotal: quantity * Number(item.price),
            };
        })
    );
};

const decreaseQuantity = (id) => {
    setCart((currentCart) =>
        currentCart
            .map((item) => {
                if (Number(item.id) !== Number(id)) {
                    return item;
                }

                const quantity = Number(item.quantity) - 1;

                return {
                    ...item,
                    quantity: quantity,
                    subtotal: quantity * Number(item.price),
                };
            })
            .filter((item) => item.quantity > 0)
    );
};

    const removeFromCart = (id) => {
        setCart((currentCart) =>
            currentCart.filter((item) => item.id !== id)
        );
    };

    const clearCart = () => {
        setCart([]);
        setMessage("");
    };

    const total = cart.reduce(
        (sum, item) => sum + Number(item.subtotal),
        0
    );

    const categories = [
        "All",
        ...new Set(
            products
                .map((product) => product.category)
                .filter(Boolean)
        ),
    ];

    const filteredProducts = products.filter((product) => {
        const matchesCategory =
            category === "All" || product.category === category;

        const matchesSearch = product.product_name
            .toLowerCase()
            .includes(search.toLowerCase());

        return matchesCategory && matchesSearch;
    });

    return (
        <div className="app-layout">
            <Sidebar />

            <main className="main-content pos-page">
                <div className="pos-header">
                    <div>
                        <h1>Point of Sale</h1>
                        <p>Select products to create an order.</p>
                    </div>

                    <button
                        className="back-dashboard-btn"
                        onClick={() => navigate("/dashboard")}
                    >
                        Dashboard
                    </button>
                </div>

                {message && (
                    <div className="pos-message">
                        {message}
                    </div>
                )}

                <div className="pos-layout">
                    <section className="products-section">
                        <div className="product-toolbar">
                            <input
                                type="text"
                                placeholder="Search product..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                                className="product-search"
                            />

                            <div className="category-buttons">
                                {categories.map((item) => (
                                    <button
                                        key={item}
                                        className={
                                            category === item
                                                ? "category-btn active"
                                                : "category-btn"
                                        }
                                        onClick={() =>
                                            setCategory(item)
                                        }
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <div className="empty-products">
                                Loading products...
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="empty-products">
                                No products found.
                            </div>
                        ) : (
                            <div className="product-grid">
                                {filteredProducts.map((product) => {
                                    const outOfStock =
                                        Number(product.stock) <= 0 ||
                                        product.status !== "Available";

                                    return (
                                        <div
                                            className={
                                                outOfStock
                                                    ? "product-card disabled"
                                                    : "product-card"
                                            }
                                            key={product.id}
                                        >
                                            <div className="product-image-container">
                                                {product.image ? (
                                                    <img
                                                        src={
                                                            IMAGE_URL +
                                                            product.image
                                                        }
                                                        alt={
                                                            product.product_name
                                                        }
                                                        className="product-image"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display =
                                                                "none";
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="no-image">
                                                        No Image
                                                    </div>
                                                )}
                                            </div>

                                            <div className="product-info">
                                                <h3>
                                                    {
                                                        product.product_name
                                                    }
                                                </h3>

                                                <p className="product-category">
                                                    {product.category}
                                                </p>

                                                <div className="product-bottom">
                                                    <strong>
                                                        ₱
                                                        {Number(
                                                            product.price
                                                        ).toFixed(2)}
                                                    </strong>

                                                    <span
                                                        className={
                                                            outOfStock
                                                                ? "stock out"
                                                                : "stock"
                                                        }
                                                    >
                                                        Stock:{" "}
                                                        {
                                                            product.stock
                                                        }
                                                    </span>
                                                </div>

                                                <button
                                                    className="add-product-btn"
                                                    disabled={
                                                        outOfStock
                                                    }
                                                    onClick={() =>
                                                        addToCart(
                                                            product
                                                        )
                                                    }
                                                >
                                                    {outOfStock
                                                        ? "Unavailable"
                                                        : "Add to Order"}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    <aside className="cart-section">
                        <div className="cart-header">
                            <div>
                                <h2>Current Order</h2>
                                <p>
                                    {cart.length} item
                                    {cart.length !== 1 ? "s" : ""}
                                </p>
                            </div>

                            {cart.length > 0 && (
                                <button
                                    className="clear-cart-btn"
                                    onClick={clearCart}
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        <div className="cart-items">
                            {cart.length === 0 ? (
                                <div className="empty-cart">
                                    <div className="empty-cart-icon">
                                        🛒
                                    </div>
                                    <h3>No items yet</h3>
                                    <p>
                                        Select a product to add it
                                        to the order.
                                    </p>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div
                                        className="cart-item"
                                        key={item.id}
                                    >
                                        <div className="cart-item-info">
                                            <h4>
                                                {item.product_name}
                                            </h4>

                                            <span>
                                                ₱
                                                {Number(
                                                    item.price
                                                ).toFixed(2)}
                                            </span>
                                        </div>

                                        <div className="cart-item-actions">
                                        <div className="quantity-control">
    <button
        type="button"
        onClick={() => decreaseQuantity(item.id)}
    >
        −
    </button>

    <span>{item.quantity}</span>

    <button
        type="button"
        onClick={() => increaseQuantity(item.id)}
    >
        +
    </button>
</div>

                                            <strong>
                                                ₱
                                                {Number(
                                                    item.subtotal
                                                ).toFixed(2)}
                                            </strong>
                                        </div>

                                        <button
                                            className="remove-item-btn"
                                            onClick={() =>
                                                removeFromCart(
                                                    item.id
                                                )
                                            }
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="cart-summary">
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <strong>
                                    ₱{total.toFixed(2)}
                                </strong>
                            </div>

                            <div className="summary-row">
                                <span>Discount</span>
                                <strong>₱0.00</strong>
                            </div>

                            <div className="summary-divider"></div>

                            <div className="total-row">
                                <span>Total</span>
                                <strong>
                                    ₱{total.toFixed(2)}
                                </strong>
                            </div>

                            <button
                                className="checkout-btn"
                                disabled={cart.length === 0}
                                onClick={() =>
    navigate("/payment", {
        state: {
            cart: cart,
            total: total,
        },
    })
}
                            >
                                Proceed to Payment
                            </button>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}

export default POS;