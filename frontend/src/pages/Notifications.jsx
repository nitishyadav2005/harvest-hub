
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getNotifications } from "../services/notificationService";
import "./Notifications.css";

export default function Notifications() {
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadNotifications = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getNotifications();
            setNotifications(data || []);

        } catch (err) {
            console.error("Notifications loading error:", err);
            setError("Notifications load nahi ho payi. Please retry.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    const formatDate = (date) => {
        if (!date) return "";

        return new Date(`${date}T00:00:00`).toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );
    };

    const overdueCount = notifications.filter(
        item => item.status === "OVERDUE"
    ).length;

    const todayCount = notifications.filter(
        item => item.status === "DUE TODAY"
    ).length;

    return (
        <div className="hh-dashboard">
            <Sidebar />

            <main className="hh-main">

                {/* Topbar */}
                <header className="hh-topbar">
                    <span className="hh-topbar-label">
                        Notifications & Reminders
                    </span>

                    <div className="hh-topbar-actions">
                        <button
                            type="button"
                            className="hh-notification-bell"
                            onClick={() => navigate("/notifications")}
                            title="Notifications"
                        >
                            🔔
                            <span className="hh-notification-count">
                                {notifications.length}
                            </span>
                        </button>

                        <div className="hh-topbar-divider"></div>

                        <div className="hh-profile">
                            <span className="hh-avatar">N</span>

                            <div>
                                <strong>Nitish Yadav</strong>
                                <small>Farm Manager</small>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="hh-content">

                    {/* Welcome Section */}
                    <section className="hh-welcome">
                        <div>
                            <p className="hh-eyebrow">
                                STAY UPDATED
                            </p>

                            <h1>Notifications 🔔</h1>

                            <p>
                                Keep track of your farm activities and
                                equipment maintenance.
                            </p>
                        </div>
                    </section>

                    {/* Notification Summary */}
                    <section className="notification-summary">

                        <article>
                            <span>🔔</span>

                            <div>
                                <small>Total Reminders</small>
                                <h2>{notifications.length}</h2>
                            </div>
                        </article>

                        <article>
                            <span>⚠️</span>

                            <div>
                                <small>Overdue</small>
                                <h2>{overdueCount}</h2>
                            </div>
                        </article>

                        <article>
                            <span>📅</span>

                            <div>
                                <small>Due Today</small>
                                <h2>{todayCount}</h2>
                            </div>
                        </article>

                    </section>

                    {/* All Notifications */}
                    <section className="hh-panel notification-panel">

                        <div className="hh-panel-heading">
                            <div>
                                <h3>All Notifications</h3>

                                <p>
                                    Your operations and equipment reminders.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={loadNotifications}
                                disabled={loading}
                            >
                                ↻ {loading ? "Loading..." : "Refresh"}
                            </button>
                        </div>

                        {/* Loading */}
                        {loading ? (

                            <div className="notification-empty">
                                Loading notifications...
                            </div>

                        ) : error ? (

                            /* Error */
                            <div className="notification-empty">
                                <p>{error}</p>

                                <button
                                    type="button"
                                    onClick={loadNotifications}
                                >
                                    Retry
                                </button>
                            </div>

                        ) : notifications.length === 0 ? (

                            /* Empty State */
                            <div className="notification-empty">
                                <span>🔔</span>

                                <h3>No notifications yet</h3>

                                <p>
                                    Upcoming operations and equipment
                                    service alerts will appear here.
                                </p>

                                <button
                                    type="button"
                                    onClick={() => navigate("/operations")}
                                >
                                    View Operations
                                </button>
                            </div>

                        ) : (

                            /* Notification List */
                            <div className="notification-list">

                                {notifications.map((item, index) => {
                                    const status = item.status || "UPCOMING";

                                    const statusClass = status
                                        .toLowerCase()
                                        .replace(/\s+/g, "-");

                                    return (
                                        <article
                                            className={`notification-card ${statusClass}`}
                                            key={item.id ?? `${item.category}-${item.date}-${index}`}
                                        >

                                            <div className="notification-icon">
                                                {item.icon || "🔔"}
                                            </div>

                                            <div className="notification-details">

                                                <div className="notification-title-row">
                                                    <h3>
                                                        {item.title || "Farm Reminder"}
                                                    </h3>

                                                    <span
                                                        className={`notification-status ${statusClass}`}
                                                    >
                                                        {status}
                                                    </span>
                                                </div>

                                                <p>
                                                    {item.description || "You have a pending farm activity."}
                                                </p>

                                                <small>
                                                    {item.category === "OPERATION"
                                                        ? "Farm Operation"
                                                        : "Equipment Maintenance"}

                                                    {" · "}

                                                    {formatDate(item.date)}
                                                </small>

                                            </div>

                                        </article>
                                    );
                                })}

                            </div>
                        )}

                    </section>

                </div>
            </main>
        </div>
    );
}
