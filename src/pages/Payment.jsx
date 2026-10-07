import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API, apiFetch } from "../api";

const CHECKOUT_API = `${API}/orders/create.php`;

function Payment() {
    const navigate = useNavigate();
    const location = useLocation();

    const cart = location.state?.cart || [];
    const total = Number(location.state?.total || 0);

    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [cashReceived, setCashReceived] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

const change =
    paymentMethod === "Cash" && cashReceived !== ""
        ? Math.max(Number(cashReceived) - total, 0)
        : 0;

const getCurrentUserId = () => {
    const possibleUsers = [
        localStorage.getItem("siomai_user"),
        localStorage.getItem("user"),
        localStorage.getItem("currentUser"),
        localStorage.getItem("loggedInUser"),
    ];

    for (const value of possibleUsers) {
        if (!value) continue;

        try {
            const user = JSON.parse(value);

            if (user?.id) {
                return Number(user.id);
            }

            if (user?.user_id) {
                return Number(user.user_id);
            }
        } catch {
            // Ignore invalid JSON
        }
    }

    const userId = localStorage.getItem("user_id");

    return userId ? Number(userId) : 0;
};

    const completePayment = async () => {
        setMessage("");

        if (cart.length === 0) {
            setMessage("Your order is empty.");
            return;
        }

        const userId = getCurrentUserId();

        if (!userId) {
            setMessage("User session not found. Please login again.");
            return;
        }

        let amountPaid = total;

        if (paymentMethod === "Cash") {
            amountPaid = Number(cashReceived);

            if (!amountPaid || amountPaid < total) {
                setMessage(
                    `Cash received must be at least ₱${total.toFixed(2)}.`
                );
                return;
            }
        }

        try {
            setLoading(true);

            const response = await apiFetch(CHECKOUT_API, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    user_id: userId,
                    customer_id: null,
                    payment_method: paymentMethod,
                    amount_paid: amountPaid,
                    items: cart.map((item) => ({
                        product_id: Number(item.id),
                        quantity: Number(item.quantity),
                    })),
                }),
            });

            const rawResponse = await response.text();


            let result;

            try {
                result = JSON.parse(rawResponse);
            } catch {
                setMessage(
                    "PHP returned an invalid response. Check the browser console."
                );
                return;
            }

            if (!result.success) {
                setMessage(result.message || "Payment failed.");
                return;
            }

            alert(
                `Payment successful!\n\nOrder #: ${result.order_id}\nTotal: ₱${result.total_amount}\nChange: ₱${result.change_amount}`
            );

            navigate("/pos");
        } catch (error) {
            console.error("CHECKOUT ERROR:", error);
            setMessage("Connection error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="payment-page">
            <div className="payment-card">

                <div className="payment-card-header">
                    <div>
                        <h1>Payment</h1>
                        <p>Complete the customer order.</p>
                    </div>

                    <button
                        type="button"
                        className="back-dashboard-btn"
                        onClick={() => navigate("/pos")}
                    >
                        Back to POS
                    </button>
                </div>

                {message && (
                    <div className="pos-message error">
                        {message}
                    </div>
                )}

                <div className="payment-content">

                    <div className="payment-section">
                        <h2>Order Summary</h2>

                        {cart.map((item) => (
                            <div
                                className="payment-item"
                                key={item.id}
                            >
                                <div>
                                    <strong>
                                        {item.product_name}
                                    </strong>

                                    <span>
                                        {item.quantity} × ₱
                                        {Number(item.price).toFixed(2)}
                                    </span>
                                </div>

                                <strong>
                                    ₱
                                    {Number(
                                        item.subtotal
                                    ).toFixed(2)}
                                </strong>
                            </div>
                        ))}

                        <div className="summary-divider"></div>

                        <div className="total-row">
                            <span>Total</span>
                            <strong>
                                ₱{total.toFixed(2)}
                            </strong>
                        </div>
                    </div>

                    <div className="payment-section">
                        <h2>Payment Method</h2>

                        <div className="payment-methods">

                            <button
                                type="button"
                                className={
                                    paymentMethod === "Cash"
                                        ? "payment-method active"
                                        : "payment-method"
                                }
                                onClick={() => {
                                    setPaymentMethod("Cash");
                                    setCashReceived("");
                                }}
                            >
                                Cash
                            </button>

                            <button
                                type="button"
                                className={
                                    paymentMethod === "GCash"
                                        ? "payment-method active"
                                        : "payment-method"
                                }
                                onClick={() => {
                                    setPaymentMethod("GCash");
                                    setCashReceived("");
                                }}
                            >
                                GCash
                            </button>

                            <button
                                type="button"
                                className={
                                    paymentMethod === "Card"
                                        ? "payment-method active"
                                        : "payment-method"
                                }
                                onClick={() => {
                                    setPaymentMethod("Card");
                                    setCashReceived("");
                                }}
                            >
                                Card
                            </button>

                        </div>

                        {paymentMethod === "Cash" && (
                            <div className="cash-payment">

                                <label>
                                    Cash Received
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Enter cash received"
                                    value={cashReceived}
                                    onChange={(e) =>
                                        setCashReceived(
                                            e.target.value
                                        )
                                    }
                                />

                                <div className="change-display">
                                    <span>Change</span>

                                    <strong>
                                        ₱{change.toFixed(2)}
                                    </strong>
                                </div>

                            </div>
                        )}

                        {paymentMethod !== "Cash" && (
                            <div className="non-cash-message">
                                Customer will pay the exact amount of
                                <strong>
                                    {" "}
                                    ₱{total.toFixed(2)}
                                </strong>
                                .
                            </div>
                        )}

                        <button
                            type="button"
                            className="confirm-payment-btn"
                            disabled={loading || cart.length === 0}
                            onClick={completePayment}
                        >
                            {loading
                                ? "Processing..."
                                : "Confirm Payment"}
                        </button>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default Payment;