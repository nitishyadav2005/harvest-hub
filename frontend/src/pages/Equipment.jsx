
import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import "./Equipment.css";

function EquipmentIcon({ type, size = 36 }) {
    const value = String(type || "").toLowerCase();

    if (value.includes("pump") || value.includes("irrigation")) {
        return (
            <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <path d="M24 5C20 12 12 20 12 29a12 12 0 0 0 24 0C36 20 28 12 24 5Z" fill="#D6F1DF" stroke="#247647" strokeWidth="2.5" />
                <path d="M18 30c0 4 2.5 6 6 6M8 40h32" stroke="#247647" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
        );
    }

    if (value.includes("seed") || value.includes("sprayer") || value.includes("plough") || value.includes("plow")) {
        return (
            <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <path d="M24 40V13" stroke="#247647" strokeWidth="2.8" strokeLinecap="round" />
                <path d="M24 25C12 25 9 17 10 10c9 0 15 5 14 15Z" fill="#CDEBD4" stroke="#247647" strokeWidth="2.2" strokeLinejoin="round" />
                <path d="M24 32c12 0 15-7 14-14-9 0-15 5-14 14Z" fill="#E5F5E9" stroke="#247647" strokeWidth="2.2" strokeLinejoin="round" />
                <path d="M15 42h18" stroke="#247647" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
        );
    }

    if (value.includes("harvest")) {
        return (
            <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <path d="M7 30h34l-4-12H18l-5 6H7v6Z" fill="#D6F1DF" stroke="#247647" strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M18 18V9h12l7 9M6 34h36" stroke="#247647" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="16" cy="34" r="5" fill="#FFFFFF" stroke="#247647" strokeWidth="2.5" />
                <circle cx="34" cy="34" r="5" fill="#FFFFFF" stroke="#247647" strokeWidth="2.5" />
            </svg>
        );
    }

    return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <path d="M7 28h8l4-12h12l5 12h5v7H7v-7Z" fill="#D6F1DF" stroke="#247647" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M19 16V9h10l4 7M4 28h5M35 28h7" stroke="#247647" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="15" cy="35" r="5" fill="#FFFFFF" stroke="#247647" strokeWidth="2.5" />
            <circle cx="34" cy="35" r="4" fill="#FFFFFF" stroke="#247647" strokeWidth="2.5" />
        </svg>
    );
}

function ServiceIcon({ type }) {
    const value = String(type || "").toLowerCase();

    if (value.includes("oil") || value.includes("engine")) {
        return (
            <svg viewBox="0 0 24 24" width="25" height="25" fill="none" aria-hidden="true">
                <path d="M12 3C10 7 6 11 6 15a6 6 0 0 0 12 0c0-4-4-8-6-12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M9 16c0 1.5 1 2.5 2.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        );
    }

    return (
        <svg viewBox="0 0 24 24" width="25" height="25" fill="none" aria-hidden="true">
            <path d="M4 7h16M6 4h12M6 7l1 13h10l1-13M9 10v7M15 10v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function SummaryIcon({ type }) {
    if (type === "clock") {
        return (
            <svg viewBox="0 0 24 24" width="25" height="25" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        );
    }

    if (type === "warning") {
        return (
            <svg viewBox="0 0 24 24" width="25" height="25" fill="none" aria-hidden="true">
                <path d="M12 3 22 20H2L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M12 9v5m0 3h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        );
    }

    if (type === "check") {
        return (
            <svg viewBox="0 0 24 24" width="25" height="25" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
                <path d="m7 12 3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    }

    return <EquipmentIcon type="Tractor" size={29} />;
}

export default function Equipment() {
    const [farms, setFarms] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [maintenance, setMaintenance] = useState([]);
    const [selectedEquipment, setSelectedEquipment] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [saving, setSaving] = useState(false);

    const [showEquipmentForm, setShowEquipmentForm] = useState(false);
    const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);

    const [equipmentForm, setEquipmentForm] = useState({
        name: "",
        equipmentType: "Tractor",
        brand: "",
        model: "",
        purchaseDate: "",
        lastServiceDate: "",
        nextServiceDate: "",
        status: "ACTIVE",
        notes: ""
    });

    const [maintenanceForm, setMaintenanceForm] = useState({
        maintenanceType: "",
        scheduledDate: "",
        cost: "",
        notes: ""
    });

    const loadData = useCallback(async () => {
        try {
            setError("");

            const farmResponse = await api.get("/farms");
            const farmList = farmResponse.data || [];

            setFarms(farmList);

            const equipmentResponses = await Promise.all(
                farmList.map(farm => api.get(`/farms/${farm.id}/equipment`))
            );

            const allEquipment = equipmentResponses.flatMap(
                response => response.data || []
            );

            setEquipment(allEquipment);

            const maintenanceResponses = await Promise.all(
                allEquipment.map(item => api.get(`/equipment/${item.id}/maintenance`))
            );

            setMaintenance(
                maintenanceResponses.flatMap(response => response.data || [])
            );
        } catch (err) {
            console.error("Equipment loading error:", err);
            setError(
                err.response?.data?.message ||
                "Equipment data load nahi hua. Please retry."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (!showEquipmentForm && !showMaintenanceForm) return;

        const handleEscape = event => {
            if (event.key === "Escape" && !saving) {
                resetEquipmentForm();
                resetMaintenanceForm();
            }
        };

        document.addEventListener("keydown", handleEscape);

        return () => document.removeEventListener("keydown", handleEscape);
    }, [showEquipmentForm, showMaintenanceForm, saving]);

    const updateEquipmentField = event => {
        const { name, value } = event.target;
        setEquipmentForm(previous => ({ ...previous, [name]: value }));
    };

    const updateMaintenanceField = event => {
        const { name, value } = event.target;
        setMaintenanceForm(previous => ({ ...previous, [name]: value }));
    };

    const resetEquipmentForm = () => {
        setEquipmentForm({
            name: "",
            equipmentType: "Tractor",
            brand: "",
            model: "",
            purchaseDate: "",
            lastServiceDate: "",
            nextServiceDate: "",
            status: "ACTIVE",
            notes: ""
        });
        setShowEquipmentForm(false);
    };

    const resetMaintenanceForm = () => {
        setMaintenanceForm({
            maintenanceType: "",
            scheduledDate: "",
            cost: "",
            notes: ""
        });
        setShowMaintenanceForm(false);
        setSelectedEquipment(null);
    };

    const openEquipmentForm = () => {
        setError("");
        setSuccess("");
        setShowEquipmentForm(true);
    };

    const addEquipment = async event => {
        event.preventDefault();

        if (farms.length === 0) {
            setError("Equipment add karne se pehle farm create karo.");
            setShowEquipmentForm(false);
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

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
                notes: equipmentForm.notes.trim() || null
            };

            await api.post(`/farms/${farms[0].id}/equipment`, payload);

            resetEquipmentForm();
            setSuccess("Equipment successfully add ho gaya.");
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || "Equipment add nahi ho paya.");
        } finally {
            setSaving(false);
        }
    };

    const scheduleMaintenance = async event => {
        event.preventDefault();
        if (!selectedEquipment) return;

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            await api.post(`/equipment/${selectedEquipment.id}/maintenance`, {
                maintenanceType: maintenanceForm.maintenanceType.trim(),
                scheduledDate: maintenanceForm.scheduledDate,
                cost: maintenanceForm.cost === "" ? 0 : Number(maintenanceForm.cost),
                notes: maintenanceForm.notes.trim() || null
            });

            resetMaintenanceForm();
            setSuccess("Maintenance successfully schedule ho gayi.");
            await loadData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Maintenance schedule nahi ho payi."
            );
        } finally {
            setSaving(false);
        }
    };

    const completeMaintenance = async id => {
        if (!window.confirm("Is maintenance ko completed mark karein?")) return;

        try {
            setError("");
            setSuccess("");

            await api.put(`/maintenance/${id}/complete`);

            setSuccess("Maintenance completed mark ho gayi.");
            await loadData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Maintenance complete nahi ho payi."
            );
        }
    };

    const deleteEquipment = async item => {
        if (!window.confirm(`${item.name} ko delete karna chahte ho?`)) return;

        try {
            setError("");
            setSuccess("");

            await api.delete(`/equipment/${item.id}`);

            setSuccess("Equipment delete ho gaya.");
            await loadData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Equipment delete nahi ho paya. Iske maintenance records ho sakte hain."
            );
        }
    };

    const deleteMaintenance = async id => {
        if (!window.confirm("Ye maintenance record delete karein?")) return;

        try {
            setError("");
            setSuccess("");

            await api.delete(`/maintenance/${id}`);

            setSuccess("Maintenance record delete ho gaya.");
            await loadData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Maintenance record delete nahi ho paya."
            );
        }
    };

    const getEquipmentName = equipmentId => {
        const item = equipment.find(
            entry => Number(entry.id) === Number(equipmentId)
        );
        return item?.name || "Equipment";
    };

    const formatDate = date => {
        if (!date) return "Not recorded";

        const parts = String(date).split("-");
        if (parts.length !== 3) return date;

        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    const formatMaintenanceType = type => {
        if (!type) return "Maintenance";

        return type.toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase());
    };

    const today = new Date().toLocaleDateString("en-CA");

    const overdueCount = maintenance.filter(
        item => item.status !== "COMPLETED" && item.scheduledDate < today
    ).length;

    const upcomingCount = maintenance.filter(
        item => item.status !== "COMPLETED" && item.scheduledDate >= today
    ).length;

    const completedCount = maintenance.filter(
        item => item.status === "COMPLETED"
    ).length;

    return (
        <div className="hh-dashboard fc-shell">
            <Sidebar />

            <main className="hh-main fc-main">
                <div className="fc-page equipment-page">
                    <header className="fc-header">
                        <div>
                            <p className="fc-eyebrow">HARVESTHUB MANAGEMENT</p>
                            <h1>Equipment &amp; Maintenance</h1>
                            <p>Manage farm machinery and keep every service on schedule.</p>
                        </div>

                        <div className="fc-header-actions">
                            <button
                                type="button"
                                className="fc-button fc-primary"
                                onClick={openEquipmentForm}
                            >
                                + Add Equipment
                            </button>
                        </div>
                    </header>

                    {error && (
                        <div className="fc-error equipment-message" role="alert">
                            <span>{error}</span>
                            <button type="button" onClick={loadData}>Retry</button>
                        </div>
                    )}

                    {success && (
                        <div className="equipment-success" role="status">
                            <span>{success}</span>
                            <button
                                type="button"
                                onClick={() => setSuccess("")}
                                aria-label="Dismiss message"
                            >
                                ×
                            </button>
                        </div>
                    )}

                    <section className="fc-summary equipment-summary">
                        <article className="equipment-stat-card">
                            <span className="equipment-stat-icon">
                                <SummaryIcon type="fleet" />
                            </span>
                            <div>
                                <span>Fleet Size</span>
                                <strong>{equipment.length}</strong>
                                <small>Registered equipment</small>
                            </div>
                        </article>

                        <article className="equipment-stat-card">
                            <span className="equipment-stat-icon is-upcoming">
                                <SummaryIcon type="clock" />
                            </span>
                            <div>
                                <span>Due Soon</span>
                                <strong>{upcomingCount}</strong>
                                <small>Upcoming services</small>
                            </div>
                        </article>

                        <article className="equipment-stat-card">
                            <span className="equipment-stat-icon is-overdue">
                                <SummaryIcon type="warning" />
                            </span>
                            <div>
                                <span>Overdue</span>
                                <strong>{overdueCount}</strong>
                                <small>Pending past due date</small>
                            </div>
                        </article>

                        <article className="equipment-stat-card">
                            <span className="equipment-stat-icon is-completed">
                                <SummaryIcon type="check" />
                            </span>
                            <div>
                                <span>Serviced</span>
                                <strong>{completedCount}</strong>
                                <small>Completed service records</small>
                            </div>
                        </article>
                    </section>

                    {/* Add Equipment Modal */}
                    {showEquipmentForm && (
                        <div
                            className="equipment-modal-overlay"
                            onMouseDown={event => {
                                if (event.target === event.currentTarget && !saving) {
                                    resetEquipmentForm();
                                }
                            }}
                        >
                            <section
                                className="equipment-modal"
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="equipment-modal-title"
                            >
                                <header className="equipment-modal-header">
                                    <div>
                                        <h2 id="equipment-modal-title">Add New Farm Equipment</h2>
                                        <p>Register machine specifications, maintenance schedules, and service dates.</p>
                                    </div>

                                    <button
                                        type="button"
                                        className="equipment-modal-close"
                                        onClick={resetEquipmentForm}
                                        disabled={saving}
                                        aria-label="Close form"
                                    >
                                        ×
                                    </button>
                                </header>

                                <form onSubmit={addEquipment}>
                                    <div className="equipment-form-grid">
                                        <label>
                                            Equipment Name *
                                            <input
                                                name="name"
                                                value={equipmentForm.name}
                                                onChange={updateEquipmentField}
                                                placeholder="e.g. Mahindra 575 DI Tractor"
                                                required
                                                maxLength={150}
                                                disabled={saving}
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
                                                disabled={saving}
                                            />
                                        </label>

                                        <label>
                                            Equipment Type *
                                            <select
                                                name="equipmentType"
                                                value={equipmentForm.equipmentType}
                                                onChange={updateEquipmentField}
                                                required
                                                disabled={saving}
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
                                                disabled={saving}
                                            >
                                                <option value="ACTIVE">Operational (Field Ready)</option>
                                                <option value="MAINTENANCE">Under Maintenance</option>
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
                                                disabled={saving}
                                            />
                                        </label>

                                        <label>
                                            Purchase Date
                                            <input
                                                type="date"
                                                name="purchaseDate"
                                                value={equipmentForm.purchaseDate}
                                                onChange={updateEquipmentField}
                                                disabled={saving}
                                            />
                                        </label>

                                        <label>
                                            Last Serviced Date
                                            <input
                                                type="date"
                                                name="lastServiceDate"
                                                value={equipmentForm.lastServiceDate}
                                                onChange={updateEquipmentField}
                                                disabled={saving}
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
                                                disabled={saving}
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
                                                disabled={saving}
                                            />
                                        </label>
                                    </div>

                                    <div className="equipment-form-actions">
                                        <button
                                            type="button"
                                            className="fc-button fc-secondary"
                                            onClick={resetEquipmentForm}
                                            disabled={saving}
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="submit"
                                            className="fc-button fc-primary"
                                            disabled={saving}
                                        >
                                            {saving ? "Saving..." : "Save Equipment"}
                                        </button>
                                    </div>
                                </form>
                            </section>
                        </div>
                    )}

                    {/* Equipment Fleet */}
                    <section className="fc-section equipment-section">
                        <div className="fc-section-heading">
                            <div>
                                <h2>My Equipment</h2>
                                <p>Machinery registered in your farms.</p>
                            </div>
                        </div>

                        {loading ? (
                            <p>Loading equipment...</p>
                        ) : equipment.length === 0 ? (
                            <div className="fc-empty">
                                <span className="equipment-machine-icon">
                                    <EquipmentIcon type="Tractor" size={42} />
                                </span>
                                <h3>No equipment added yet</h3>
                                <p>Add your first equipment to start tracking maintenance.</p>
                                <button
                                    type="button"
                                    className="fc-button fc-primary"
                                    onClick={openEquipmentForm}
                                >
                                    + Add Equipment
                                </button>
                            </div>
                        ) : (
                            <div className="fc-grid equipment-grid">
                                {equipment.map(item => (
                                    <article
                                        className="fc-field-card equipment-card"
                                        key={item.id}
                                    >
                                        <div className="fc-field-top">
                                            <span className="fc-field-icon equipment-machine-icon">
                                                <EquipmentIcon type={item.equipmentType} size={38} />
                                            </span>

                                            <span className="equipment-status">
                                                {item.status || "ACTIVE"}
                                            </span>
                                        </div>

                                        <h3>{item.name}</h3>

                                        <p className="fc-area">
                                            {item.equipmentType}
                                            {item.brand ? ` · ${item.brand}` : ""}
                                            {item.model ? ` · ${item.model}` : ""}
                                        </p>

                                        <div className="fc-details">
                                            <p>
                                                <span>Last service</span>
                                                <strong>{formatDate(item.lastServiceDate)}</strong>
                                            </p>
                                            <p>
                                                <span>Next service</span>
                                                <strong>{formatDate(item.nextServiceDate)}</strong>
                                            </p>
                                            <p>
                                                <span>Purchase date</span>
                                                <strong>{formatDate(item.purchaseDate)}</strong>
                                            </p>
                                        </div>

                                        {item.notes && (
                                            <p className="equipment-notes">{item.notes}</p>
                                        )}

                                        <div className="equipment-card-actions">
                                            <button
                                                type="button"
                                                className="fc-button fc-secondary"
                                                onClick={() => {
                                                    setSelectedEquipment(item);
                                                    setMaintenanceForm({
                                                        maintenanceType: "",
                                                        scheduledDate: "",
                                                        cost: "",
                                                        notes: ""
                                                    });
                                                    setError("");
                                                    setSuccess("");
                                                    setShowMaintenanceForm(true);
                                                }}
                                            >
                                                + Schedule Service
                                            </button>

                                            <button
                                                type="button"
                                                className="fc-button equipment-delete"
                                                onClick={() => deleteEquipment(item)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Schedule Service Modal */}
                    {showMaintenanceForm && selectedEquipment && (
                        <div
                            className="equipment-modal-backdrop"
                            onMouseDown={event => {
                                if (event.target === event.currentTarget && !saving) {
                                    resetMaintenanceForm();
                                }
                            }}
                        >
                            <section
                                className="equipment-service-modal"
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="service-modal-title"
                            >
                                <div className="equipment-modal-heading">
                                    <div>
                                        <p className="fc-eyebrow">HARVESTHUB</p>
                                        <h2 id="service-modal-title">Schedule Service</h2>
                                        <p>Plan maintenance for your farm equipment.</p>
                                    </div>

                                    <button
                                        type="button"
                                        className="equipment-modal-close"
                                        onClick={resetMaintenanceForm}
                                        disabled={saving}
                                        aria-label="Close popup"
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="equipment-selected-info">
                                    <span>
                                        <EquipmentIcon type={selectedEquipment.equipmentType} size={36} />
                                    </span>
                                    <div>
                                        <small>Selected Equipment</small>
                                        <strong>{selectedEquipment.name}</strong>
                                        <p>
                                            {selectedEquipment.equipmentType || "Equipment"}
                                            {selectedEquipment.brand ? ` · ${selectedEquipment.brand}` : ""}
                                        </p>
                                    </div>
                                </div>

                                <form onSubmit={scheduleMaintenance}>
                                    <div className="equipment-form-grid">
                                        <label>
                                            Maintenance Type *
                                            <input
                                                name="maintenanceType"
                                                value={maintenanceForm.maintenanceType}
                                                onChange={updateMaintenanceField}
                                                placeholder="e.g. Regular Servicing"
                                                maxLength={100}
                                                required
                                                disabled={saving}
                                            />
                                        </label>

                                        <label>
                                            Scheduled Date *
                                            <input
                                                type="date"
                                                name="scheduledDate"
                                                value={maintenanceForm.scheduledDate}
                                                onChange={updateMaintenanceField}
                                                min={new Date().toLocaleDateString("en-CA")}
                                                required
                                                disabled={saving}
                                            />
                                        </label>

                                        <label className="equipment-full-width">
                                            Estimated Cost (₹)
                                            <input
                                                type="number"
                                                name="cost"
                                                value={maintenanceForm.cost}
                                                onChange={updateMaintenanceField}
                                                placeholder="Enter estimated cost"
                                                min="0"
                                                step="0.01"
                                                disabled={saving}
                                            />
                                        </label>

                                        <label className="equipment-full-width">
                                            Service Notes
                                            <textarea
                                                name="notes"
                                                value={maintenanceForm.notes}
                                                onChange={updateMaintenanceField}
                                                placeholder="Add service details or instructions..."
                                                rows={3}
                                                disabled={saving}
                                            />
                                        </label>
                                    </div>

                                    {error && (
                                        <p className="equipment-modal-error" role="alert">
                                            {error}
                                        </p>
                                    )}

                                    <div className="equipment-form-actions">
                                        <button
                                            type="button"
                                            className="fc-button fc-secondary"
                                            onClick={resetMaintenanceForm}
                                            disabled={saving}
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="submit"
                                            className="fc-button fc-primary"
                                            disabled={saving}
                                        >
                                            {saving ? "Scheduling..." : "Schedule Service"}
                                        </button>
                                    </div>
                                </form>
                            </section>
                        </div>
                    )}

                    {/* Maintenance Records */}
                    <section className="fc-section equipment-section">
                        <div className="fc-section-heading equipment-maintenance-heading">
                            <div className="equipment-maintenance-heading-text">
                                <h2>Maintenance Records</h2>
                                <p>Track upcoming, overdue and completed services.</p>
                            </div>

                            <span className="equipment-record-count">
        {maintenance.length} records
    </span>
                        </div>

                        {loading ? (
                            <p>Loading maintenance records...</p>
                        ) : maintenance.length === 0 ? (
                            <div className="fc-empty">
                                <span className="equipment-maintenance-icon">
                                    <ServiceIcon type="Maintenance" />
                                </span>
                                <h3>No maintenance scheduled</h3>
                                <p>Schedule a service from any equipment card.</p>
                            </div>
                        ) : (
                            <div className="equipment-maintenance-list">
                                {maintenance.map(record => {
                                    const overdue =
                                        record.status !== "COMPLETED" &&
                                        record.scheduledDate < today;

                                    return (

                                        <article className="equipment-maintenance-card" key={record.id}>
                                            {/* Left: Maintenance details */}
                                            <div className="equipment-maintenance-info">
        <span className="equipment-maintenance-icon">
            <ServiceIcon type={record.maintenanceType} />
        </span>

                                                <div className="equipment-maintenance-details">
                                                    <h3>{formatMaintenanceType(record.maintenanceType)}</h3>

                                                    <p className="maintenance-equipment-name">
                                                        {getEquipmentName(record.equipmentId)}
                                                    </p>

                                                    <p className="maintenance-date">
                                                        <span>Scheduled:</span>
                                                        <strong>{formatDate(record.scheduledDate)}</strong>
                                                    </p>

                                                    {record.status === "COMPLETED" && (
                                                        <p className="maintenance-date">
                                                            <span>Completed:</span>
                                                            <strong>{formatDate(record.completedDate)}</strong>
                                                        </p>
                                                    )}

                                                    {record.notes && (
                                                        <p className="maintenance-notes">{record.notes}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Middle: Price */}
                                            <div className="equipment-maintenance-price">
                                                <strong>
                                                    ₹{Number(record.cost || 0).toLocaleString("en-IN")}
                                                </strong>
                                            </div>

                                            {/* Status */}
                                            <div className="equipment-maintenance-status">
        <span
            className={
                "equipment-record-status " +
                (record.status === "COMPLETED"
                    ? "is-completed"
                    : overdue
                        ? "is-overdue"
                        : "is-upcoming")
            }
        >
            {record.status === "COMPLETED"
                ? "COMPLETED"
                : overdue
                    ? "OVERDUE"
                    : "UPCOMING"}
        </span>
                                            </div>

                                            {/* Right: Actions */}
                                            <div className="equipment-maintenance-actions">
                                                {record.status !== "COMPLETED" && (
                                                    <button
                                                        type="button"
                                                        className="fc-button fc-primary"
                                                        onClick={() => completeMaintenance(record.id)}
                                                    >
                                                        Mark Complete
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    className="fc-button equipment-delete"
                                                    onClick={() => deleteMaintenance(record.id)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </article>

                                    );
                                })}
                            </div>
                        )}
                    </section>

                    <p className="equipment-footer">
                        {completedCount} maintenance record(s) completed.
                    </p>
                </div>
            </main>
        </div>
    );
}
