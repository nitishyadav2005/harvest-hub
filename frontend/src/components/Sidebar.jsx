
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Sidebar.css";

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

const navItems = [
    { icon: "⌂", label: "Dashboard", path: "/dashboard" },
    { icon: "♧", label: "Fields & Crops", path: "/fields-crops" },
    { icon: "🌱", label: "Crop Planning", path: "/crop-planning" },
    { icon: "↗", label: "Field Operations", path: "/operations" },
    { icon: "₹", label: "Finances", path: "/finance" },
    { icon: "⚙", label: "Equipment & Maintenance", path: "/equipment" },
];

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    // Close on Escape key press or browser navigation
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape" && isOpen) {
                setIsOpen(false);
            }
        };
        const handlePopState = () => setIsOpen(false);

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("popstate", handlePopState);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("popstate", handlePopState);
        };
    }, [isOpen]);

    // Prevent body scroll when drawer is open on mobile
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    const handleNavigate = (path) => {
        setIsOpen(false);
        navigate(path);
    };

    return (
        <>
            {/* Mobile Top Header (Displayed on mobile/tablet <= 1024px) */}
            <div className="hh-mobile-header">
                <button
                    type="button"
                    className="hh-hamburger-btn"
                    onClick={() => setIsOpen(true)}
                    aria-label="Open navigation menu"
                    aria-expanded={isOpen}
                >
                    <span className="hh-hamburger-line" />
                    <span className="hh-hamburger-line" />
                    <span className="hh-hamburger-line" />
                </button>

                <div className="hh-mobile-brand">
                    <div className="hh-brand-logo">
                        <SproutLogo />
                    </div>
                    <span>HarvestHub</span>
                </div>
            </div>

            {/* Mobile Drawer Overlay Backdrop */}
            {isOpen && (
                <div
                    className="hh-sidebar-overlay"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar Navigation */}
            <aside className={`hh-sidebar ${isOpen ? "open" : ""}`}>
                <div className="hh-sidebar-top">
                    <div className="hh-brand">
                        <div className="hh-brand-logo">
                            <SproutLogo />
                        </div>
                        <span>HarvestHub</span>
                    </div>

                    <button
                        type="button"
                        className="hh-sidebar-close"
                        onClick={() => setIsOpen(false)}
                        aria-label="Close navigation menu"
                    >
                        ✕
                    </button>
                </div>

                <nav className="hh-nav">
                    {navItems.map((item) => (
                        <button
                            key={item.path}
                            type="button"
                            className={`hh-nav-item ${
                                location.pathname === item.path ? "active" : ""
                            }`}
                            onClick={() => handleNavigate(item.path)}
                        >
                            <span className="hh-nav-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="hh-sidebar-art">
                    <div className="hh-sun">☀</div>
                    <div className="hh-farm">🏡</div>
                    <div className="hh-field-lines">〰 〰 〰</div>
                    <p>Growing a better tomorrow.</p>
                </div>

                <div className="hh-sidebar-footer">
                    <span>♧</span>
                    <div>
                        <strong>HarvestHub</strong>
                        <small>Farm Management</small>
                    </div>
                </div>
            </aside>
        </>
    );
}
