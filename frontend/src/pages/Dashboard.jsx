
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNotifications } from "../services/notificationService";

import api from "../services/api";
import AddFieldModal from "../components/AddFieldModal";
import AddCropModal from "../components/AddCropModal";
import Sidebar from "../components/Sidebar";

import "./Dashboard.css";
import "./Operations.css";
import "./Finance.css";
import "./Equipment.css";

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

const actions = [
    { icon: "▥", title: "Add Field", detail: "Register a new field" },
    { icon: "🌱", title: "Plan Crop", detail: "Plan crop rotation" },
    { icon: "▦", title: "Log Operation", detail: "Record field activities" },
    { icon: "₹", title: "Add Transaction", detail: "Record income and expenses" },
    { icon: "⚒️", title: "Add Equipment", detail: "Register farm equipment" },
];

function Dashboard() {
    const navigate = useNavigate();

    const [farms, setFarms] = useState([]);
    const [fields, setFields] = useState([]);
    const [crops, setCrops] = useState([]);
    const [operations, setOperations] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showAddField, setShowAddField] = useState(false);
    const [showAddCrop, setShowAddCrop] = useState(false);
    const [showAddOperation, setShowAddOperation] = useState(false);
    const [showAddTransaction, setShowAddTransaction] = useState(false);
    const [showAddEquipment, setShowAddEquipment] = useState(false);

    const [selectedField, setSelectedField] = useState("");
    const [savingOperation, setSavingOperation] = useState(false);
    const [operationError, setOperationError] = useState("");

    const [farmId, setFarmId] = useState(null);
    const [savingTransaction, setSavingTransaction] = useState(false);
    const [transactionError, setTransactionError] = useState("");

    const [savingEquipment, setSavingEquipment] = useState(false);
    const [equipmentError, setEquipmentError] = useState("");

    const [notificationCount, setNotificationCount] = useState(0);

    const initialEquipmentForm = {
        name: "",
        equipmentType: "Tractor",
        brand: "",
        model: "",
        purchaseDate: "",
        lastServiceDate: "",
        nextServiceDate: "",
        status: "ACTIVE",
        notes: "",
    };

    const [equipmentForm, setEquipmentForm] = useState(initialEquipmentForm);

    const initialTransactionForm = {
        type: "INCOME",
        category: "",
        title: "",
        amount: "",
        transactionDate: new Date().toISOString().slice(0, 10),
        notes: "",
    };

    const [transactionForm, setTransactionForm] = useState(
        initialTransactionForm
    );

    const [operationForm, setOperationForm] = useState({
        title: "",
        operationType: "Irrigation",
        scheduledDate: "",
        cost: "",
        notes: "",
    });

    const loadFarmData = useCallback(async () => {
        try {
            setError("");

            const farmResponse = await api.get("/farms");
            const farmList = farmResponse.data;

            setFarmId(farmList.length > 0 ? farmList[0].id : null);

            const fieldResponses = await Promise.all(
                farmList.map((farm) => api.get(`/farms/${farm.id}/fields`))
            );

            const fieldList = fieldResponses.flatMap(
                (response) => response.data
            );

            const cropResponses = await Promise.all(
                fieldList.map((field) => api.get(`/fields/${field.id}/crops`))
            );

            const cropList = cropResponses.flatMap(
                (response) => response.data
            );

            const operationResponses = await Promise.all(
                fieldList.map((field) =>
                    api.get(`/fields/${field.id}/operations`)
                )
            );

            const operationList = operationResponses.flatMap(
                (response) => response.data
            );

            setFarms(farmList);
            setFields(fieldList);
            setCrops(cropList);
            setOperations(operationList);
        } catch (err) {
            console.error("Dashboard data error:", err);
            setError(
                "Farm data load nahi ho paya. Please retry or login again."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadFarmData();
    }, [loadFarmData]);

    useEffect(() => {
        const loadNotificationCount = async () => {
            try {
                const data = await getNotifications();
                setNotificationCount(data.length);
            } catch (err) {
                console.error("Notification count error:", err);
                setNotificationCount(0);
            }
        };

        loadNotificationCount();
    }, [operations]);

    const totalFields = fields.length;

    const totalFieldArea = fields.reduce(
        (total, field) => total + Number(field.area || 0),
        0
    );

    const totalFarmArea = farms.reduce(
        (total, farm) => total + Number(farm.totalArea || 0),
        0
    );

    const formatArea = (area) => Number(area.toFixed(2)).toString();

    const dateKey = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayString = dateKey(today);

    const upcomingOperations = operations
        .filter((operation) => {
            const status = String(operation.status || "PLANNED").toUpperCase();

            return (
                status !== "COMPLETED" &&
                status !== "CANCELLED" &&
                operation.scheduledDate &&
                operation.scheduledDate >= todayString
            );
        })
        .sort((a, b) =>
            String(a.scheduledDate).localeCompare(String(b.scheduledDate))
        );

    const totalOperationCost = operations.reduce(
        (total, operation) =>
            total + Number(operation.operationCost ?? operation.cost ?? 0),
        0
    );

    const currency = (amount) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(Number(amount || 0));

    const activity = Array.from({ length: 7 }, (_, index) => {
        const day = new Date();
        day.setHours(0, 0, 0, 0);
        day.setDate(day.getDate() - (6 - index));

        const dateString = dateKey(day);

        const dayOperations = operations.filter(
            (operation) => operation.scheduledDate === dateString
        );

        return {
            day: day.toLocaleDateString("en-IN", { weekday: "short" }),
            first: dayOperations.length,
            second: dayOperations.filter(
                (operation) =>
                    String(operation.status || "").toUpperCase() ===
                    "COMPLETED"
            ).length,
        };
    });

    const maxActivity = Math.max(
        4,
        ...activity.map((item) => Math.max(item.first, item.second))
    );

    const stats = [
        {
            title: "Total Fields",
            value: loading ? "..." : totalFields.toString(),
            detail: `${formatArea(totalFieldArea)} acres total`,
            icon: "▥",
            color: "fields",
        },
        {
            title: "Active Crops",
            value: loading ? "..." : crops.length.toString(),
            detail:
                crops.length === 0
                    ? "No crop data yet"
                    : "Crops registered in your fields",
            icon: "🌱",
            color: "crops",
        },
        {
            title: "Upcoming Operations",
            value: loading ? "..." : upcomingOperations.length.toString(),
            detail:
                upcomingOperations.length === 0
                    ? "No upcoming operations"
                    : "Planned or in-progress activities",
            icon: "↗",
            color: "operations",
        },
        {
            title: "Operation Costs",
            value: loading ? "..." : currency(totalOperationCost),
            detail:
                operations.length === 0
                    ? "No operation costs recorded"
                    : `Across ${operations.length} recorded operations`,
            icon: "₹",
            color: "expenses",
        },
    ];

    const openAddOperation = () => {
        setOperationForm({
            title: "",
            operationType: "Irrigation",
            scheduledDate: "",
            cost: "",
            notes: "",
        });

        setSelectedField(fields.length ? String(fields[0].id) : "");
        setOperationError("");
        setShowAddOperation(true);
    };

    const closeAddOperation = () => {
        if (savingOperation) return;
        setShowAddOperation(false);
        setOperationError("");
    };

    const handleOperationChange = (event) => {
        const { name, value } = event.target;
        setOperationForm((previous) => ({ ...previous, [name]: value }));
    };

    const handleOperationSubmit = async (event) => {
        event.preventDefault();
        setOperationError("");

        if (!selectedField) {
            setOperationError("Please select a field first.");
            return;
        }

        if (!operationForm.title.trim()) {
            setOperationError("Please enter an operation title.");
            return;
        }

        if (!operationForm.scheduledDate) {
            setOperationError("Please select a scheduled date.");
            return;
        }

        if (
            operationForm.cost !== "" &&
            (!Number.isFinite(Number(operationForm.cost)) ||
                Number(operationForm.cost) < 0)
        ) {
            setOperationError("Please enter a valid operation cost.");
            return;
        }

        try {
            setSavingOperation(true);

            const payload = {
                title: operationForm.title.trim(),
                operationType: operationForm.operationType,
                scheduledDate: operationForm.scheduledDate,
                status: "PLANNED",
                operationCost:
                    operationForm.cost === "" ? 0 : Number(operationForm.cost),
                notes: operationForm.notes.trim(),
            };

            await api.post(`/fields/${selectedField}/operations`, payload);

            setShowAddOperation(false);

            setOperationForm({
                title: "",
                operationType: "Irrigation",
                scheduledDate: "",
                cost: "",
                notes: "",
            });

            await loadFarmData();
        } catch (err) {
            console.error("Dashboard operation save error:", err);
            setOperationError(
                err.response?.data?.message ||
                "Operation save nahi hua. Please try again."
            );
        } finally {
            setSavingOperation(false);
        }
    };

    const openAddTransaction = () => {
        setTransactionForm({
            ...initialTransactionForm,
            transactionDate: new Date().toISOString().slice(0, 10),
        });
        setTransactionError("");
        setShowAddTransaction(true);
    };

    const closeAddTransaction = () => {
        if (savingTransaction) return;
        setShowAddTransaction(false);
        setTransactionError("");
    };

    const handleTransactionChange = (event) => {
        const { name, value } = event.target;

        setTransactionForm((previous) => ({
            ...previous,
            [name]: value,
            ...(name === "type" ? { category: "" } : {}),
        }));
    };

    const handleTransactionSubmit = async (event) => {
        event.preventDefault();
        setTransactionError("");

        if (!farmId) {
            setTransactionError("Farm details load nahi hue. Please retry.");
            return;
        }

        try {
            setSavingTransaction(true);

            const payload = {
                farmId,
                type: transactionForm.type,
                category: transactionForm.category,
                title: transactionForm.title.trim(),
                amount: Number(transactionForm.amount),
                transactionDate: transactionForm.transactionDate,
                notes: transactionForm.notes.trim(),
            };

            await api.post("/finance/transactions", payload);

            setShowAddTransaction(false);
            setTransactionForm({
                ...initialTransactionForm,
                transactionDate: new Date().toISOString().slice(0, 10),
            });

            await loadFarmData();
        } catch (err) {
            console.error("Transaction save error:", err);
            setTransactionError(
                err.response?.data?.message ||
                "Transaction save nahi ho saka. Please try again."
            );
        } finally {
            setSavingTransaction(false);
        }
    };

    function handleQuickAction(title) {
        if (title === "Add Field") {
            setShowAddField(true);
        } else if (title === "Plan Crop") {
            setShowAddCrop(true);
        } else if (title === "Log Operation") {
            openAddOperation();
        } else if (title === "Add Transaction") {
            openAddTransaction();
        } else if (title === "Add Equipment") {
            setEquipmentForm(initialEquipmentForm);
            setEquipmentError("");
            setShowAddEquipment(true);
        }
    }

    const updateEquipmentField = (event) => {
        const { name, value } = event.target;
        setEquipmentForm((previous) => ({ ...previous, [name]: value }));
    };

    const closeEquipmentForm = () => {
        if (savingEquipment) return;
        setEquipmentForm(initialEquipmentForm);
        setEquipmentError("");
        setShowAddEquipment(false);
    };

    const handleAddEquipment = async (event) => {
        event.preventDefault();
        setEquipmentError("");

        if (!farmId) {
            setEquipmentError("Equipment add karne se pehle farm create karo.");
            return;
        }

        if (!equipmentForm.name.trim()) {
            setEquipmentError("Please enter equipment name.");
            return;
        }

        if (!equipmentForm.equipmentType.trim()) {
            setEquipmentError("Please select equipment type.");
            return;
        }

        try {
            setSavingEquipment(true);

            const payload = {
                ...equipmentForm,
                name: equipmentForm.name.trim(),
                equipmentType: equipmentForm.equipmentType.trim(),
                brand: equipmentForm.brand.trim() || null,
                model: equipmentForm.model.trim() || null,
                purchaseDate: equipmentForm.purchaseDate || null,
                lastServiceDate: equipmentForm.lastServiceDate || null,
                nextServiceDate: equipmentForm.nextServiceDate || null,
                status: equipmentForm.status || "ACTIVE",
                notes: equipmentForm.notes.trim() || null,
            };

            await api.post(`/farms/${farmId}/equipment`, payload);

            setEquipmentForm(initialEquipmentForm);
            setShowAddEquipment(false);
            await loadFarmData();
        } catch (err) {
            console.error("Equipment save error:", err);
            setEquipmentError(
                err.response?.data?.message ||
                "Equipment add nahi ho paya. Please try again."
            );
        } finally {
            setSavingEquipment(false);
        }
    };

    return (
        <div className="hh-dashboard">
            <Sidebar />

            <main className="hh-main">

                <header className="hh-topbar">
    <span className="hh-topbar-label">
        Farm Management &amp; Crop Planning
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
    {notificationCount}
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
                    <section className="hh-welcome">
                        <div>
                            <p className="hh-eyebrow">YOUR FARM AT A GLANCE</p>
                            <h1>
                                Welcome to HarvestHub <span>🌱</span>
                            </h1>
                            <p>
                                Manage your fields, plan crops and grow with
                                confidence.
                            </p>
                        </div>

                        <div className="hh-weather">
                            <span className="hh-weather-icon">☀️</span>
                            <div>
                                <strong>Farm Overview</strong>
                                <small>Your farming workspace</small>
                            </div>
                        </div>
                    </section>

                    {error && (
                        <div role="alert" className="hh-error-message">
                            {error}
                            <button
                                type="button"
                                onClick={loadFarmData}
                                style={{ marginLeft: "12px" }}
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    <section className="hh-stat-grid">
                        {stats.map((stat) => (
                            <article className="hh-stat-card" key={stat.title}>
                                <div className="hh-stat-top">
                                    <span className={`hh-stat-icon ${stat.color}`}>
                                        {stat.icon}
                                    </span>
                                    <span className="hh-stat-arrow">↗</span>
                                </div>
                                <p>{stat.title}</p>
                                <h2>{stat.value}</h2>
                                <small>{stat.detail}</small>
                            </article>
                        ))}
                    </section>

                    <section className="hh-middle-grid">
                        <article className="hh-panel hh-crop-panel">
                            <div className="hh-panel-heading">
                                <div>
                                    <h3>Crop Overview</h3>
                                    <p>Area distribution across your fields</p>
                                </div>
                                <span className="hh-season-label">This Season</span>
                            </div>

                            <div className="hh-crop-content">
                                <div className="hh-donut">
                                    <div className="hh-donut-hole">
                                        <strong>
                                            {loading
                                                ? "..."
                                                : `${formatArea(totalFieldArea)} acres`}
                                        </strong>
                                        <small>Total Field Area</small>
                                    </div>
                                </div>

                                <div className="hh-legend">
                                    {loading ? (
                                        <p>Loading fields...</p>
                                    ) : fields.length > 0 ? (
                                        fields.map((field, index) => {
                                            const colors = [
                                                "wheat",
                                                "potato",
                                                "mustard",
                                                "other",
                                            ];

                                            return (
                                                <div
                                                    className="hh-legend-row"
                                                    key={field.id ?? `${field.name}-${index}`}
                                                >
                                                    <span
                                                        className={`hh-dot ${colors[index % colors.length]}`}
                                                    />
                                                    <span>{field.name}</span>
                                                    <small>
                                                        {formatArea(Number(field.area || 0))}{" "}
                                                        {field.areaUnit || "acres"}
                                                    </small>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p>No fields added yet.</p>
                                    )}
                                </div>
                            </div>
                        </article>

                        <article className="hh-panel hh-activity-panel">
                            <div className="hh-panel-heading">
                                <div>
                                    <h3>Farm Activity</h3>
                                    <p>Weekly activity overview</p>
                                </div>
                            </div>

                            <div className="hh-chart">
                                <div className="hh-chart-grid">
                                    {[8, 6, 4, 2, 0].map((n) => (
                                        <div className="hh-chart-row" key={n}>
                                            <span>{n}</span>
                                            <div className="hh-chart-line" />
                                        </div>
                                    ))}
                                </div>

                                <div className="hh-bars">
                                    {activity.map((item) => (
                                        <div className="hh-bar-group" key={item.day}>
                                            <div className="hh-bar-pair">
                                                <span
                                                    style={{
                                                        height: `${(item.first / maxActivity) * 100}%`,
                                                    }}
                                                />
                                                <span
                                                    style={{
                                                        height: `${(item.second / maxActivity) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                            <small>{item.day}</small>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="hh-chart-legend">
                                <span><i /> Scheduled Operations</span>
                                <span><i /> Completed Operations</span>
                            </div>

                            {!loading && operations.length === 0 && (
                                <p className="hh-chart-empty">
                                    Your operation activity will appear here
                                    after you add activities.
                                </p>
                            )}
                        </article>
                    </section>

                    <section className="hh-panel hh-quick-panel">
                        <div className="hh-panel-heading">
                            <div>
                                <h3>Quick Actions</h3>
                                <p>Shortcuts for your daily farm tasks</p>
                            </div>
                        </div>

                        <div className="hh-action-grid">
                            {actions.map((action, index) => (
                                <button
                                    type="button"
                                    className="hh-action"
                                    key={action.title}
                                    onClick={() => handleQuickAction(action.title)}
                                >
                                    <span className={`hh-action-icon action-${index}`}>
                                        {action.icon}
                                    </span>
                                    <strong>{action.title}</strong>
                                    <small>{action.detail}</small>
                                </button>
                            ))}
                        </div>
                    </section>
                </div>
            </main>

            <aside className="hh-right-column">
                <div className="hh-promo">
                    <span>GROW WITH CONFIDENCE</span>
                    <h2>
                        Better Farming,
                        <br />
                        Brighter Future.
                    </h2>
                    <p>Plan. Grow. Harvest.</p>
                    <div className="hh-promo-plant">🌱　🌾　🚜</div>
                </div>

                <section className="hh-panel hh-upcoming">
                    <div className="hh-panel-heading">
                        <div><h3>Upcoming Operations</h3></div>
                        <button type="button" onClick={() => navigate("/operations")}>
                            View All
                        </button>
                    </div>

                    {loading ? (
                        <p>Loading operations...</p>
                    ) : upcomingOperations.length > 0 ? (
                        upcomingOperations.slice(0, 4).map((operation) => (
                            <div className="hh-operation" key={operation.id}>
                                <span className="hh-operation-icon">🌱</span>
                                <div className="hh-operation-info">
                                    <strong>
                                        {operation.title ||
                                            operation.operationType ||
                                            "Farm Operation"}
                                    </strong>
                                    <small>
                                        {operation.fieldName ||
                                            operation.field?.name ||
                                            fields.find(
                                                (field) =>
                                                    Number(field.id) ===
                                                    Number(operation.fieldId)
                                            )?.name ||
                                            "Farm field"}
                                    </small>
                                </div>
                                <span className="hh-operation-date">
                                    {new Date(
                                        `${operation.scheduledDate}T00:00:00`
                                    ).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                    })}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p>
                            {operations.length === 0
                                ? "No operations added yet. Use Log Operation to create one."
                                : "No upcoming operations. You're all caught up!"}
                        </p>
                    )}
                </section>

                <div className="hh-quote">
                    <span>“</span>
                    <p>
                        Good planning today leads to a better harvest tomorrow.
                    </p>
                    <small>— Your HarvestHub Journal</small>
                </div>

                <p className="hh-demo-note">
                    {loading
                        ? "Loading farm data..."
                        : `Farm area: ${formatArea(totalFarmArea)} acres · Field area: ${formatArea(totalFieldArea)} acres`}
                </p>
            </aside>

            {showAddField && (
                <AddFieldModal
                    farms={farms}
                    onClose={() => setShowAddField(false)}
                    onSuccess={loadFarmData}
                />
            )}

            {showAddCrop && (
                <AddCropModal
                    fields={fields}
                    onClose={() => setShowAddCrop(false)}
                    onSuccess={loadFarmData}
                />
            )}

            {/* Add Operation popup */}
            {showAddOperation && (
                <div
                    className="hc-modal-backdrop"
                    onMouseDown={(event) => {
                        if (
                            event.target === event.currentTarget &&
                            !savingOperation
                        ) {
                            closeAddOperation();
                        }
                    }}
                >
                    <section
                        className="hc-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="dashboard-operation-title"
                        onMouseDown={(event) => event.stopPropagation()}
                    >
                        <div className="hc-modal-heading">
                            <div>
                                <p className="hc-eyebrow">FIELD MANAGEMENT</p>
                                <h2 id="dashboard-operation-title">Add New Operation</h2>
                                <p>Schedule an activity for your field.</p>
                            </div>
                            <button
                                type="button"
                                className="hc-close"
                                onClick={closeAddOperation}
                                disabled={savingOperation}
                                aria-label="Close modal"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleOperationSubmit}>
                            <div className="hc-group">
                                <label htmlFor="dashboard-operation-field">
                                    Select Field *
                                </label>
                                <select
                                    id="dashboard-operation-field"
                                    value={selectedField}
                                    onChange={(event) => setSelectedField(event.target.value)}
                                    required
                                    disabled={savingOperation}
                                >
                                    <option value="">Select a field</option>
                                    {fields.map((field) => (
                                        <option key={field.id} value={String(field.id)}>
                                            {field.name}
                                            {field.area
                                                ? ` (${field.area} ${field.areaUnit || "acres"})`
                                                : ""}
                                        </option>
                                    ))}
                                </select>
                                {fields.length === 0 && (
                                    <p>Please add a field in Fields &amp; Crops first.</p>
                                )}
                            </div>

                            <div className="hc-group">
                                <label htmlFor="dashboard-operation-name">
                                    Operation Title *
                                </label>
                                <input
                                    id="dashboard-operation-name"
                                    type="text"
                                    name="title"
                                    value={operationForm.title}
                                    onChange={handleOperationChange}
                                    placeholder="e.g. Morning irrigation"
                                    maxLength={100}
                                    required
                                    disabled={savingOperation}
                                />
                            </div>

                            <div className="hc-group">
                                <label htmlFor="dashboard-operation-type">
                                    Operation Type *
                                </label>
                                <select
                                    id="dashboard-operation-type"
                                    name="operationType"
                                    value={operationForm.operationType}
                                    onChange={handleOperationChange}
                                    required
                                    disabled={savingOperation}
                                >
                                    <option value="Irrigation">Irrigation</option>
                                    <option value="Planting">Planting</option>
                                    <option value="Fertilizing">Fertilizing</option>
                                    <option value="Pest Control">Pest Control</option>
                                    <option value="Weeding">Weeding</option>
                                    <option value="Harvesting">Harvesting</option>
                                    <option value="Soil Preparation">Soil Preparation</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="hc-group">
                                <label htmlFor="dashboard-operation-cost">
                                    Operation Cost (₹)
                                </label>
                                <input
                                    id="dashboard-operation-cost"
                                    type="number"
                                    name="cost"
                                    value={operationForm.cost}
                                    onChange={handleOperationChange}
                                    placeholder="Enter operation cost"
                                    min="0"
                                    step="0.01"
                                    disabled={savingOperation}
                                />
                            </div>

                            <div className="hc-group">
                                <label htmlFor="dashboard-operation-date">
                                    Scheduled Date *
                                </label>
                                <input
                                    id="dashboard-operation-date"
                                    type="date"
                                    name="scheduledDate"
                                    value={operationForm.scheduledDate}
                                    onChange={handleOperationChange}
                                    required
                                    disabled={savingOperation}
                                />
                            </div>

                            <div className="hc-group">
                                <label htmlFor="dashboard-operation-notes">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    id="dashboard-operation-notes"
                                    name="notes"
                                    value={operationForm.notes}
                                    onChange={handleOperationChange}
                                    placeholder="Add details about this activity..."
                                    rows={3}
                                    maxLength={1000}
                                    disabled={savingOperation}
                                />
                            </div>

                            {operationError && (
                                <div className="hc-error" role="alert">
                                    {operationError}
                                </div>
                            )}

                            <div className="hc-modal-actions">
                                <button
                                    type="button"
                                    className="hc-secondary"
                                    onClick={closeAddOperation}
                                    disabled={savingOperation}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="hc-primary"
                                    disabled={savingOperation || fields.length === 0}
                                >
                                    {savingOperation ? "Saving..." : "Save Operation"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}

            {/* Add Transaction popup */}
            {showAddTransaction && (
                <div
                    className="finance-modal-overlay"
                    onMouseDown={(event) => {
                        if (
                            event.target === event.currentTarget &&
                            !savingTransaction
                        ) {
                            closeAddTransaction();
                        }
                    }}
                >
                    <section
                        className="finance-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="dashboard-transaction-title"
                        onMouseDown={(event) => event.stopPropagation()}
                    >
                        <div className="finance-modal-header">
                            <div className="finance-modal-heading">
                                <h2 id="dashboard-transaction-title">
                                    Add New Farm Transaction
                                </h2>
                                <p>Record your farm income and expenses.</p>
                            </div>
                            <button
                                type="button"
                                className="finance-close-btn"
                                onClick={closeAddTransaction}
                                disabled={savingTransaction}
                                aria-label="Close dialog"
                            >
                                ×
                            </button>
                        </div>

                        <form
                            className="finance-form"
                            onSubmit={handleTransactionSubmit}
                        >
                            <label>
                                Transaction Type *
                                <select
                                    name="type"
                                    value={transactionForm.type}
                                    onChange={handleTransactionChange}
                                    required
                                    disabled={savingTransaction}
                                >
                                    <option value="INCOME">Income</option>
                                    <option value="EXPENSE">Expense</option>
                                </select>
                            </label>

                            <label>
                                Transaction Title *
                                <input
                                    name="title"
                                    value={transactionForm.title}
                                    onChange={handleTransactionChange}
                                    placeholder="e.g. Wheat sale"
                                    maxLength={200}
                                    required
                                    disabled={savingTransaction}
                                />
                            </label>

                            <label>
                                Category *
                                <select
                                    name="category"
                                    value={transactionForm.category}
                                    onChange={handleTransactionChange}
                                    required
                                    disabled={savingTransaction}
                                >
                                    <option value="">Select category</option>
                                    {transactionForm.type === "INCOME" ? (
                                        <>
                                            <option value="Crop Sale">Crop Sale</option>
                                            <option value="Other Income">Other Income</option>
                                            <option value="Government Subsidy">
                                                Government Subsidy
                                            </option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="Seeds">Seeds</option>
                                            <option value="Fertilizer">Fertilizer</option>
                                            <option value="Labour">Labour</option>
                                            <option value="Equipment">Equipment</option>
                                            <option value="Irrigation">Irrigation</option>
                                            <option value="Other Expense">Other Expense</option>
                                        </>
                                    )}
                                </select>
                            </label>

                            <label>
                                Amount (₹) *
                                <input
                                    name="amount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={transactionForm.amount}
                                    onChange={handleTransactionChange}
                                    placeholder="Enter amount"
                                    required
                                    disabled={savingTransaction}
                                />
                            </label>

                            <label>
                                Transaction Date *
                                <input
                                    name="transactionDate"
                                    type="date"
                                    value={transactionForm.transactionDate}
                                    onChange={handleTransactionChange}
                                    required
                                    disabled={savingTransaction}
                                />
                            </label>

                            <label className="finance-form-full">
                                Transaction Notes
                                <textarea
                                    name="notes"
                                    value={transactionForm.notes}
                                    onChange={handleTransactionChange}
                                    placeholder="Add transaction details..."
                                    maxLength={1000}
                                    rows={3}
                                    disabled={savingTransaction}
                                />
                            </label>

                            {transactionError && (
                                <div className="finance-error" role="alert">
                                    {transactionError}
                                </div>
                            )}

                            <div className="finance-modal-actions">
                                <button
                                    type="button"
                                    className="finance-secondary-btn"
                                    onClick={closeAddTransaction}
                                    disabled={savingTransaction}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="finance-primary-btn"
                                    disabled={savingTransaction || !farmId}
                                >
                                    {savingTransaction
                                        ? "Saving..."
                                        : "Save Transaction"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}

            {/* Add Equipment popup — separate from Transaction popup */}
            {showAddEquipment && (
                <div
                    className="equipment-modal-overlay"
                    onMouseDown={(event) => {
                        if (
                            event.target === event.currentTarget &&
                            !savingEquipment
                        ) {
                            closeEquipmentForm();
                        }
                    }}
                >
                    <section
                        className="equipment-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="dashboard-equipment-title"
                        onMouseDown={(event) => event.stopPropagation()}
                    >
                        <header className="equipment-modal-header">
                            <div>
                                <h2 id="dashboard-equipment-title">
                                    Add New Farm Equipment
                                </h2>
                                <p>
                                    Register machine specifications, maintenance
                                    schedules, and service dates.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="equipment-modal-close"
                                onClick={closeEquipmentForm}
                                disabled={savingEquipment}
                                aria-label="Close form"
                            >
                                ×
                            </button>
                        </header>

                        <form onSubmit={handleAddEquipment}>
                            <div className="equipment-form-grid">
                                <label>
                                    Equipment Name *
                                    <input
                                        name="name"
                                        value={equipmentForm.name}
                                        onChange={updateEquipmentField}
                                        placeholder="e.g. Mahindra 575 DI Tractor"
                                        maxLength={150}
                                        required
                                        disabled={savingEquipment}
                                    />
                                </label>

                                <label>
                                    Model / Specification
                                    <input
                                        name="model"
                                        value={equipmentForm.model}
                                        onChange={updateEquipmentField}
                                        placeholder="e.g. 47 HP Power Steering"
                                        maxLength={100}
                                        disabled={savingEquipment}
                                    />
                                </label>

                                <label>
                                    Equipment Type *
                                    <select
                                        name="equipmentType"
                                        value={equipmentForm.equipmentType}
                                        onChange={updateEquipmentField}
                                        required
                                        disabled={savingEquipment}
                                    >
                                        <option value="Tractor">Tractor</option>
                                        <option value="Harvester">Harvester</option>
                                        <option value="Plough">Plough</option>
                                        <option value="Sprayer">Sprayer</option>
                                        <option value="Irrigation Pump">Irrigation Pump</option>
                                        <option value="Seed Drill">Seed Drill</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </label>

                                <label>
                                    Current Operating Status
                                    <select
                                        name="status"
                                        value={equipmentForm.status}
                                        onChange={updateEquipmentField}
                                        disabled={savingEquipment}
                                    >
                                        <option value="ACTIVE">
                                            Operational (Field Ready)
                                        </option>
                                        <option value="MAINTENANCE">
                                            Under Maintenance
                                        </option>
                                        <option value="INACTIVE">Inactive</option>
                                    </select>
                                </label>

                                <label>
                                    Brand
                                    <input
                                        name="brand"
                                        value={equipmentForm.brand}
                                        onChange={updateEquipmentField}
                                        placeholder="e.g. Mahindra"
                                        maxLength={100}
                                        disabled={savingEquipment}
                                    />
                                </label>

                                <label>
                                    Purchase Date
                                    <input
                                        type="date"
                                        name="purchaseDate"
                                        value={equipmentForm.purchaseDate}
                                        onChange={updateEquipmentField}
                                        disabled={savingEquipment}
                                    />
                                </label>

                                <label>
                                    Last Serviced Date
                                    <input
                                        type="date"
                                        name="lastServiceDate"
                                        value={equipmentForm.lastServiceDate}
                                        onChange={updateEquipmentField}
                                        disabled={savingEquipment}
                                    />
                                </label>

                                <label>
                                    Next Scheduled Maintenance
                                    <input
                                        type="date"
                                        name="nextServiceDate"
                                        value={equipmentForm.nextServiceDate}
                                        onChange={updateEquipmentField}
                                        min={equipmentForm.lastServiceDate || undefined}
                                        disabled={savingEquipment}
                                    />
                                </label>

                                <label className="equipment-full-width">
                                    Equipment Notes &amp; Guidelines
                                    <textarea
                                        name="notes"
                                        value={equipmentForm.notes}
                                        onChange={updateEquipmentField}
                                        placeholder="e.g. Engine oil specification, tyre pressure, service instructions..."
                                        rows={3}
                                        maxLength={1000}
                                        disabled={savingEquipment}
                                    />
                                </label>
                            </div>

                            {equipmentError && (
                                <p className="equipment-modal-error" role="alert">
                                    {equipmentError}
                                </p>
                            )}

                            <div className="equipment-form-actions">
                                <button
                                    type="button"
                                    className="fc-button fc-secondary"
                                    onClick={closeEquipmentForm}
                                    disabled={savingEquipment}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="fc-button fc-primary"
                                    disabled={savingEquipment || !farmId}
                                >
                                    {savingEquipment ? "Saving..." : "Save Equipment"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
