import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Login.css";

function MailIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 6.5h16v11H4z" />
            <path d="m5 7.5 7 5 7-5" />
        </svg>
    );
}

function LockIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="5" y="10" width="14" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
    );
}

function EyeIcon({ hidden }) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            {hidden ? (
                <>
                    <path d="m4 4 16 16" />
                    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                    <path d="M9.9 5.2A10.5 10.5 0 0 1 12 5c5 0 8.5 5 8.5 7s-3.5 7-8.5 7c-1.4 0-2.7-.4-3.8-.9" />
                    <path d="M6.2 7.1C4.5 8.3 3.5 10 3.5 12c0 2 2.2 4.8 5.6 6.2" />
                </>
            ) : (
                <>
                    <path d="M3.5 12S6.2 5 12 5s8.5 7 8.5 7-2.7 7-8.5 7-8.5-7-8.5-7Z" />
                    <circle cx="12" cy="12" r="2.5" />
                </>
            )}
        </svg>
    );
}

function SproutLogo() {
    return (
        <svg viewBox="0 0 64 64" aria-hidden="true">
            <path d="M31 47V29" />
            <path d="M31 36c-8-1-12-5-13-12 7-1 13 3 14 10" />
            <path d="M32 31c1-8 6-13 14-14 0 8-5 14-14 14Z" />
            <path d="M23 47h17" />
        </svg>
    );
}

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await api.post("/auth/login", {
                email: email.trim(),
                password: password,
            });

            console.log("Login API response:", response.data);
            localStorage.setItem("token", response.data.token);
            navigate("/dashboard");
        } catch (err) {
            console.error(
                "Login API error:",
                err.response?.status,
                err.response?.data || err.message
            );

            setError(
                err.response?.data?.message ||
                "Login failed. Please check your email and password."
            );
        } finally {
            setLoading(false);
        }
    };


    const handleDemo = () => {
        setEmail("farmer@example.com");
        setPassword("12345678");
    };

    return (
        <main className="login-page">
            <section className="login-content">

                {/* Brand */}
                <div className="brand-section">
                    <div className="logo-box">
                        <SproutLogo />
                    </div>

                    <h1>HarvestHub</h1>

                    <p className="brand-subtitle">
                        Farm Management &amp; Crop Planning
                    </p>

                    <div className="tagline">
                        “Your farm. Your records. Your harvest.”
                    </div>
                </div>

                {/* Auth Card */}
                <div className="auth-card">

                    {/* Tabs */}
                    <div className="auth-tabs">
                        <div className="auth-tab active">
                            <span className="tab-icon">⌁</span>
                            Login
                        </div>

                        <button
                            type="button"
                            className="auth-tab"
                            onClick={() => navigate("/register")}
                        >
                            <span className="tab-icon">✦</span>
                            Create Account
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">

                        {/* Email */}
                        <div className="field-group">
                            <label htmlFor="email">EMAIL ADDRESS</label>

                            <div className="input-box">
                <span className="input-icon">
                  <MailIcon />
                </span>

                                <input
                                    id="email"
                                    type="email"
                                    placeholder="farmer@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="field-group">
                            <label htmlFor="password">PASSWORD</label>

                            <div className="input-box">
                <span className="input-icon">
                  <LockIcon />
                </span>

                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    required
                                />

                                <button
                                    type="button"
                                    className="eye-button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    aria-label={
                                        showPassword ? "Hide password" : "Show password"
                                    }
                                >
                                    <EyeIcon hidden={showPassword} />
                                </button>
                            </div>
                        </div>

                        {/* Login */}

                        {/* Error message */}
                        {error && <p className="login-error">{error}</p>}

                        {/* Login */}
                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading}
                        >
                            <span>{loading ? "Signing in..." : "Login to HarvestHub"}</span>
                            <span className="arrow">→</span>
                        </button>

                    </form>

                    {/* Register link */}
                    <div className="signup-row">
                        <span>Don't have an account?</span>

                        <Link to="/register">
                            Create Account
                        </Link>
                    </div>

                    <div className="divider" />

                    {/* Demo */}
                    <button
                        type="button"
                        className="demo-card"
                        onClick={handleDemo}
                    >
                        <div className="demo-icon">✣</div>

                        <div className="demo-info">
                            <strong>Quick Demo: Rajesh Kumar</strong>

                            <span>
                farmer@example.com (Green Valley Farm)
              </span>
                        </div>

                        <span className="demo-action">
              Auto Fill
            </span>
                    </button>
                </div>

                {/* Footer */}
                <div className="login-footer">
                    <span className="footer-shield">♢</span>
                    <span>Local IndexedDB Encrypted Storage</span>
                    <span className="footer-dot">•</span>
                    <span>Private &amp; Offline-First</span>
                </div>

            </section>
        </main>
    );
}

export default Login;