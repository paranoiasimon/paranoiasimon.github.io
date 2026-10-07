import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { API, isStaffUser } from "../api";

function Login() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);


    async function handleLogin(event) {

        event.preventDefault();

        setMessage("");
        setLoading(true);

        try {

            const response = await fetch(
                `${API}/auth/login.php`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    credentials: "include",

                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );


            const rawResponse = await response.text();



            let result;

            try {

                result = JSON.parse(rawResponse);

            } catch {

                console.error(
                    "PHP returned invalid JSON:",
                    rawResponse
                );

                setMessage(
                    "PHP returned an invalid response. Check the browser console."
                );

                return;
            }


            if (result.success) {

                // Remove old login session
                localStorage.removeItem("siomai_user");


                // Save logged-in user
                localStorage.setItem(
                    "siomai_user",
                    JSON.stringify(result.user)
                );




                // Staff go to the dashboard, clients (buyers) go to the POS
                navigate(isStaffUser(result.user) ? "/dashboard" : "/pos");

            } else {

                setMessage(
                    result.message || "Login failed."
                );
            }


        } catch (error) {

            console.error("LOGIN ERROR:", error);

            setMessage(
                "Connection error: " + error.message
            );


        } finally {

            setLoading(false);
        }
    }


    return (

        <div className="login-page">

            <div className="login-card">

                <div className="login-logo">

                    <div className="logo-placeholder">
                        <Logo />
                    </div>

                </div>


                <h1>
                    Siomai House
                </h1>


                <p className="subtitle">
                    Point of Sale System
                </p>


                <form onSubmit={handleLogin}>

                    <label>
                        Email
                    </label>


                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(event) =>
                            setEmail(event.target.value)
                        }
                        required
                    />


                    <label>
                        Password
                    </label>


                    <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(event) =>
                            setPassword(event.target.value)
                        }
                        required
                    />


                    {message && (

                        <div className="login-message">
                            {message}
                        </div>

                    )}


                    <button
                        type="submit"
                        disabled={loading}
                    >

                        {loading
                            ? "LOGGING IN..."
                            : "LOGIN"
                        }

                    </button>

                </form>


                <p className="register-text">

                    Don't have an account?

                    <span
                        onClick={() => navigate("/register")}
                        style={{ cursor: "pointer" }}
                    >
                        Register
                    </span>

                </p>

            </div>

        </div>
    );
}


export default Login;