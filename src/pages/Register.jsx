import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { API } from "../api";

function Register() {

    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);


    async function handleRegister(event) {

        event.preventDefault();

        setMessage("");
        setLoading(true);

        try {

            const response = await fetch(
                `${API}/auth/register.php`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        name,
                        email,
                        password,
                        confirmPassword
                    })
                }
            );

            const rawResponse = await response.text();

            let result;

            try {
                result = JSON.parse(rawResponse);
            } catch {
                console.error("PHP returned invalid JSON:", rawResponse);
                setMessage("PHP returned an invalid response. Check the browser console.");
                return;
            }

            if (result.success) {
                setMessage("Account created. You can login now.");
                setTimeout(() => navigate("/"), 1200);
            } else {
                setMessage(result.message || "Registration failed.");
            }

        } catch (error) {

            setMessage("Connection error: " + error.message);

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
                    Create an account
                </p>


                <form onSubmit={handleRegister}>

                    <label>
                        Name
                    </label>

                    <input
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        required
                    />


                    <label>
                        Email
                    </label>

                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />


                    <label>
                        Password
                    </label>

                    <input
                        type="password"
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />


                    <label>
                        Confirm password
                    </label>

                    <input
                        type="password"
                        placeholder="Repeat your password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
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
                            ? "CREATING..."
                            : "REGISTER"
                        }

                    </button>

                </form>


                <p className="register-text">

                    Already have an account?

                    <span
                        onClick={() => navigate("/")}
                        style={{ cursor: "pointer" }}
                    >
                        Login
                    </span>

                </p>

            </div>

        </div>
    );
}


export default Register;
