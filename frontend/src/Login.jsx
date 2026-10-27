
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);


    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await api.post("/auth/login", {
                email: email.trim(),
                password: password,
            });

            console.log("Login response:", response.data);
            // Save JWT token in browser
            localStorage.setItem("token", response.data.token);
            navigate("/dashboard");
        } catch (err) {
            console.error("Login error:", err.response?.data || err.message);

            setError(
                err.response?.data?.message ||
                "Login failed. Check backend and credentials."
            );
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="login-page">
            <div className="login-card">
                <h1>Welcome Back</h1>
                <p>Sign in to your HarvestHub account</p>

                <form onSubmit={handleLogin}>
                    <label htmlFor="email">Email Address</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    {error && <p className="login-error">{error}</p>}

                    <button type="submit" disabled={loading}>
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <p>
                    Don't have an account? <Link to="/register">Create Account</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
