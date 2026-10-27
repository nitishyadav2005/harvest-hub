import { useState } from "react";
import { Link } from "react-router-dom";
import "./Login.css";
import "./Register.css";
import api from "../services/api";

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

function MailIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
            <path d="m4.5 7 7.5 5.5L19.5 7" />
        </svg>
    );
}

function UserIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 20c.5-4 3-6 7-6s6.5 2 7 6" />
        </svg>
    );
}

function FarmIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 20h18" />
            <path d="M5 20V10l7-5 7 5v10" />
            <path d="M9 20v-5h6v5" />
            <path d="M16 5V3h3v4" />
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
                    <path d="M10.5 10.5a2.1 2.1 0 0 0 3 3" />
                    <path d="M9.8 5.2A10 10 0 0 1 12 5c5 0 8.5 5 8.5 7s-3.5 7-8.5 7c-1.5 0-2.8-.4-4-1" />
                    <path d="M6 7.2C4.4 8.5 3.5 10.3 3.5 12c0 2 2.5 5.5 6 6.6" />
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

function Register() {
    const [fullName, setFullName] = useState("");
    const [farmName, setFarmName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setMessage("");

        if (password.length < 8) {
            setError("Password must contain at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const response = await api.post("/auth/register", {
                fullName: fullName.trim(),
                farmName: farmName.trim(),
                email: email.trim(),
                password,
                confirmPassword,
            });

            setMessage(
                response.data.message || "Account created successfully."
            );

            setFullName("");
            setFarmName("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");
        } catch (error) {
            const serverMessage = error.response?.data?.message;

            setError(
                typeof serverMessage === "string"
                    ? serverMessage
                    : "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="login-page">
            <section className="login-content register-content">

                <header className="brand-section">
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
                </header>

                <section className="auth-card register-card">

                    <div className="auth-tabs">
                        <Link to="/login" className="auth-tab">
                            <span className="tab-icon">↪</span>
                            Login
                        </Link>

                        <div className="auth-tab active" aria-current="page">
                            <span className="tab-icon">✦</span>
                            Create Account
                        </div>
                    </div>

                    <div className="register-heading">
                        <h2>Create your account</h2>
                        <p>Start managing your farm with HarvestHub.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="register-form">

                        <div className="register-fields">

                            <div className="field-group">
                                <label htmlFor="fullName">FULL NAME</label>

                                <div className="input-box">
                  <span className="input-icon">
                    <UserIcon />
                  </span>

                                    <input
                                        id="fullName"
                                        type="text"
                                        placeholder="Your full name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        autoComplete="name"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="field-group">
                                <label htmlFor="farmName">FARM NAME</label>

                                <div className="input-box">
                  <span className="input-icon">
                    <FarmIcon />
                  </span>

                                    <input
                                        id="farmName"
                                        type="text"
                                        placeholder="e.g. Green Valley Farm"
                                        value={farmName}
                                        onChange={(e) => setFarmName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="field-group register-field-full">
                                <label htmlFor="registerEmail">EMAIL ADDRESS</label>

                                <div className="input-box">
                  <span className="input-icon">
                    <MailIcon />
                  </span>

                                    <input
                                        id="registerEmail"
                                        type="email"
                                        placeholder="farmer@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        autoComplete="email"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="field-group">
                                <label htmlFor="registerPassword">PASSWORD</label>

                                <div className="input-box">
                  <span className="input-icon">
                    <LockIcon />
                  </span>

                                    <input
                                        id="registerPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="At least 8 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="eye-button"
                                        aria-label="Toggle password visibility"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                    >
                                        <EyeIcon hidden={showPassword} />
                                    </button>
                                </div>
                            </div>

                            <div className="field-group">
                                <label htmlFor="confirmPassword">CONFIRM PASSWORD</label>

                                <div className="input-box">
                  <span className="input-icon">
                    <LockIcon />
                  </span>

                                    <input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Re-enter password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        autoComplete="new-password"
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="eye-button"
                                        aria-label="Toggle confirm password visibility"
                                        onClick={() =>
                                            setShowConfirmPassword((prev) => !prev)
                                        }
                                    >
                                        <EyeIcon hidden={showConfirmPassword} />
                                    </button>
                                </div>
                            </div>

                        </div>

                        {error && (
                            <p className="register-feedback error" role="alert">
                                {error}
                            </p>
                        )}

                        {message && (
                            <p className="register-feedback success" role="status">
                                {message}
                            </p>
                        )}


                        <button
                            type="submit"
                            className="login-button register-submit"
                            disabled={loading}
                        >
  <span>
    {loading ? "Creating Account..." : "Create HarvestHub Account"}
  </span>
                            <span className="arrow">→</span>
                        </button>


                    </form>

                    <div className="register-signin">
                        Already have an account?
                        <Link to="/login">Login</Link>
                    </div>

                </section>

                <footer className="login-footer">
                    <span className="footer-shield">♢</span>
                    <span>HarvestHub Farm Management</span>
                    <span className="footer-dot">•</span>
                    <span>Responsive &amp; Farmer-Friendly</span>
                </footer>

            </section>
        </main>
    );
}

export default Register;