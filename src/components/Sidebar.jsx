import { useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { getStoredUser, isAdminUser, isStaffUser, logoutUser } from "../api";

function Sidebar({
    active,
    user,
    onLogout
}) {

    const navigate = useNavigate();


    const allMenu = [
        ["Dashboard", "🏠", "/dashboard"],
        ["POS", "🛒", "/pos"],
        ["Products", "📦", "/products"],
        ["Orders", "🧾", "/orders"],
        ["Customers", "👥", "/customers"],
        ["Inventory", "📊", "/inventory"],
        ["Users", "👤", "/users"],
        ["Reports", "📈", "/reports"],
        ["Logs", "🔐", "/logs"]
    ];

    // Clients (buyers) only see the POS.
    // Staff see everything; Users and Logs are for Admin / Owner only.
    const menu = isStaffUser(getStoredUser())
        ? allMenu.filter(([name]) => !["Users", "Logs"].includes(name) || isAdminUser())
        : allMenu.filter(([name]) => name === "POS");


    return (

        <aside className="sidebar">

            <div className="brand">

                <div className="brand-logo">
                    <Logo />
                </div>

                <div>

                    <strong>
                        Siomai House
                    </strong>

                    <span>
                        POS SYSTEM
                    </span>

                </div>

            </div>


            <nav className="side-nav">

                {menu.map(
                    ([name, icon, path]) => (

                        <button
                            key={name}
                            className={
                                active === name
                                    ? "nav-item active"
                                    : "nav-item"
                            }
                            onClick={() => {

                                if (path !== "#") {
                                    navigate(path);
                                }

                            }}
                        >

                            <span className="nav-icon">
                                {icon}
                            </span>

                            <span>
                                {name}
                            </span>

                        </button>

                    )
                )}

            </nav>


            <div className="sidebar-bottom">

                <div className="mini-user">

                    <div className="avatar">

                        {user?.name
                            ?.charAt(0)
                            .toUpperCase()}

                    </div>


                    <div>

                        <strong>
                            {user?.name}
                        </strong>

                        <span>
                            {user?.role_name ||
                                user?.role ||
                                "User"}
                        </span>

                    </div>

                </div>


                <button
                    className="logout-btn"
                    onClick={() => logoutUser(navigate)}
                >
                    ↪ Logout
                </button>

            </div>

        </aside>
    );
}

export default Sidebar;