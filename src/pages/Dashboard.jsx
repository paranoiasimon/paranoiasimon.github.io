import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { API, apiFetch } from "../api";

function Dashboard() {

    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);

    useEffect(() => {

        const savedUser =
            localStorage.getItem("siomai_user");

        if (!savedUser) {
            navigate("/", { replace: true });
            return;
        }

        setUser(JSON.parse(savedUser));

        apiFetch(`${API}/dashboard/stats.php`)
            .then((response) => response.json())
            .then((result) => {
                if (result.success) {
                    setStats(result);
                }
            })
            .catch(() => {});

    }, [navigate]);


    function logout() {

        localStorage.removeItem("siomai_user");

        navigate("/", {
            replace: true
        });
    }


    if (!user) {
        return null;
    }


    return (

        <div className="app-shell">

            <Sidebar
                active="Dashboard"
                user={user}
                onLogout={logout}
            />


            <main className="main-content">

                <header className="topbar">

                    <div>
                        <h1>
                            Dashboard
                        </h1>

                        <p>
                            Siomai House Point of Sale System
                        </p>
                    </div>


                    <div className="user-badge">

                        <strong>
                            {user.name}
                        </strong>

                        <span>
                            {user.role_name ||
                                user.role ||
                                "User"}
                        </span>

                    </div>

                </header>


                <section className="welcome-card">

                    <div>

                        <span className="eyebrow">
                            WELCOME BACK
                        </span>

                        <h2>
                            Hello, {user.name}!
                        </h2>

                        <p>
                            Manage your sales, products,
                            orders, customers and inventory.
                        </p>

                    </div>


                    <button
                        className="primary-btn"
                        onClick={() =>
                            navigate("/pos")
                        }
                    >
                        Open POS
                    </button>

                </section>


                <section className="stat-grid">

                    <div className="stat-card">
                        <span>
                            Today's Sales
                        </span>

                        <strong>
                            ₱{Number(stats?.today_sales || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </strong>

                        <small>
                            Cancelled orders excluded
                        </small>
                    </div>


                    <div className="stat-card">
                        <span>
                            Today's Orders
                        </span>

                        <strong>
                            {stats?.today_orders ?? 0}
                        </strong>

                        <small>
                            Completed orders
                        </small>
                    </div>


                    <div className="stat-card">
                        <span>
                            Products
                        </span>

                        <strong>
                            {stats?.products ?? 0}
                        </strong>

                        <small>
                            Database products
                        </small>
                    </div>


                    <div className="stat-card">
                        <span>
                            Low Stock
                        </span>

                        <strong>
                            {stats?.low_stock ?? 0}
                        </strong>

                        <small>
                            Needs attention
                        </small>
                    </div>

                </section>


                <section className="panel-grid">

                    <div className="panel">

                        <div className="panel-title">

                            <h3>
                                Quick Actions
                            </h3>

                            <span>
                                Common tasks
                            </span>

                        </div>


                        <div className="quick-actions">

                            <button
                                onClick={() =>
                                    navigate("/pos")
                                }
                            >
                                🛒 New Order
                            </button>

                            <button>
                                📦 Products
                            </button>

                            <button>
                                👥 Customers
                            </button>

                            <button>
                                📋 Orders
                            </button>

                        </div>

                    </div>


                    <div className="panel">

                        <div className="panel-title">

                            <h3>
                                System Status
                            </h3>

                            <span>
                                Current session
                            </span>

                        </div>


                        <div className="status-row">

                            <span>
                                Login
                            </span>

                            <b className="status-ok">
                                Active
                            </b>

                        </div>


                        <div className="status-row">

                            <span>
                                Account
                            </span>

                            <b>
                                {user.email}
                            </b>

                        </div>


                        <div className="status-row">

                            <span>
                                Role
                            </span>

                            <b>
                                {user.role_name ||
                                    user.role ||
                                    "User"}
                            </b>

                        </div>

                    </div>

                </section>

            </main>

        </div>
    );
}

export default Dashboard;