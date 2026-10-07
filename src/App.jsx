import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import { isAdminUser, isStaffUser } from "./api";

// Pages load only when opened, so the first screen appears faster.
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const POS = lazy(() => import("./pages/POS"));
const Payment = lazy(() => import("./pages/Payment"));
const ProductManagement = lazy(() => import("./pages/ProductManagement"));
const Orders = lazy(() => import("./pages/Orders"));
const Customers = lazy(() => import("./pages/Customers"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Users = lazy(() => import("./pages/Users"));
const Reports = lazy(() => import("./pages/Reports"));
const Logs = lazy(() => import("./pages/Logs"));

function ProtectedRoute({ children, staffOnly = false, adminOnly = false }) {

    const user = localStorage.getItem("siomai_user");

    if (!user) {
        return <Navigate to="/" replace />;
    }

    // Clients (buyers) can only open the POS pages.
    if (staffOnly && !isStaffUser()) {
        return <Navigate to="/pos" replace />;
    }

    // Only Admin / Owner can open the Users page.
    if (adminOnly && !isAdminUser()) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}


function App() {

    return (

        <BrowserRouter>

            <Suspense fallback={<div className="page-loading">Loading...</div>}>
            <Routes>

                {/* LOGIN */}
                <Route
                    path="/"
                    element={<Login />}
                />


                {/* REGISTER (creates Client accounts only) */}
                <Route
                    path="/register"
                    element={<Register />}
                />


                {/* DASHBOARD */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute staffOnly>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />


                {/* POS */}
                <Route
                    path="/pos"
                    element={
                        <ProtectedRoute>
                            <POS />
                        </ProtectedRoute>
                    }
                />


                {/* PAYMENT */}
                <Route
                    path="/payment"
                    element={
                        <ProtectedRoute>
                            <Payment />
                        </ProtectedRoute>
                    }
                />
                <Route
    path="/products"
    element={
        <ProtectedRoute staffOnly>
            <ProductManagement />
        </ProtectedRoute>
    }
/>

                {/* ORDERS (staff only) */}
                <Route
                    path="/orders"
                    element={
                        <ProtectedRoute staffOnly>
                            <Orders />
                        </ProtectedRoute>
                    }
                />

                {/* CUSTOMERS (staff only) */}
                <Route
                    path="/customers"
                    element={
                        <ProtectedRoute staffOnly>
                            <Customers />
                        </ProtectedRoute>
                    }
                />

                {/* INVENTORY (staff only) */}
                <Route
                    path="/inventory"
                    element={
                        <ProtectedRoute staffOnly>
                            <Inventory />
                        </ProtectedRoute>
                    }
                />

                {/* USERS (Admin / Owner only) */}
                <Route
                    path="/users"
                    element={
                        <ProtectedRoute staffOnly adminOnly>
                            <Users />
                        </ProtectedRoute>
                    }
                />

                {/* REPORTS (staff only) */}
                <Route
                    path="/reports"
                    element={
                        <ProtectedRoute staffOnly>
                            <Reports />
                        </ProtectedRoute>
                    }
                />

                {/* LOGS (Admin / Owner only) */}
                <Route
                    path="/logs"
                    element={
                        <ProtectedRoute staffOnly adminOnly>
                            <Logs />
                        </ProtectedRoute>
                    }
                />

                {/* UNKNOWN PAGE */}
                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/dashboard"
                            replace
                        />
                    }
                />

            </Routes>
            </Suspense>

        </BrowserRouter>
    );
}


export default App;