
import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import "./FieldsCrops.css";
import "../components/AddCropModal.css";
import "./Operations.css";


function EditIcon() {
    return (
        <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
        </svg>
    );
}

function DeleteIcon() {
    return (
        <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v5" />
            <path d="M14 11v5" />
        </svg>
    );
}


export default function Operations() {
    const [fields, setFields] = useState([]);
    const [operations, setOperations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [formError, setFormError] = useState("");
    const [selectedField, setSelectedField] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        title: "",
        operationType: "Irrigation",
        scheduledDate: "",
        status: "PLANNED",
        cost: "",
        notes: ""
    });

    // Load farms, fields and their operations
    const loadData = useCallback(async () => {
        try {
            setError("");

            const farmResponse = await api.get("/farms");
            const farmList = farmResponse.data;

            const fieldResponses = await Promise.all(
                farmList.map(farm =>
                    api.get(`/farms/${farm.id}/fields`)
                )
            );

            const fieldList = fieldResponses.flatMap(
                response => response.data
            );

            const operationResponses = await Promise.all(
                fieldList.map(async field => {
                    const response = await api.get(
                        `/fields/${field.id}/operations`
                    );

                    return response.data.map(operation => ({
                        ...operation,
                        fieldId: operation.fieldId ?? field.id
                    }));
                })
            );

            setFields(fieldList);
            setOperations(operationResponses.flat());
        } catch (err) {
            console.error("Operations load error:", err);

            setError(
                err.response?.data?.message ||
                "Operations load nahi hue. Please retry."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Reset and close modal
    const resetForm = () => {
        setForm({
            title: "",
            operationType: "Irrigation",
            scheduledDate: "",
            status: "PLANNED",
            notes: ""
        });

        setEditingId(null);
        setFormError("");
        setShowForm(false);
    };

    // Open modal for adding an operation
    const openAddForm = () => {
        setForm({
            title: "",
            operationType: "Irrigation",
            scheduledDate: "",
            status: "PLANNED",
            notes: ""
        });

        setEditingId(null);
        setFormError("");
        setError("");

        setSelectedField(fields.length ? String(fields[0].id) : "");
        setShowForm(true);
    };

    // Open modal for editing an operation
    const startEdit = operation => {
        setSelectedField(String(operation.fieldId ?? ""));

        setForm({
            title: operation.title || "",
            operationType: operation.operationType || "Other",
            scheduledDate: operation.scheduledDate || "",
            status: operation.status || "PLANNED",
            cost: operation.operationCost ?? operation.cost ?? "",
            notes: operation.notes || ""
        });

        setEditingId(operation.id);
        setFormError("");
        setError("");
        setShowForm(true);
    };

    // Handle form inputs
    const handleChange = event => {
        const { name, value } = event.target;

        setForm(previous => ({
            ...previous,
            [name]: value
        }));
    };

    // Save or update operation
    const handleSubmit = async event => {
        event.preventDefault();
        setFormError("");

        if (!editingId && !selectedField) {
            setFormError("Please add a field before creating an operation.");
            return;
        }

        if (!form.title.trim()) {
            setFormError("Please enter an operation title.");
            return;
        }

        if (!form.scheduledDate) {
            setFormError("Please select a scheduled date.");
            return;
        }

        try {
            setSaving(true);

            const payload = {
                title: form.title.trim(),
                operationType: form.operationType,
                scheduledDate: form.scheduledDate,
                status: form.status,
                operationCost: form.cost === "" ? 0 : Number(form.cost),
                notes: form.notes.trim()
            };

            if (editingId) {
                await api.put(`/operations/${editingId}`, payload);
            } else {
                await api.post(
                    `/fields/${selectedField}/operations`,
                    payload
                );
            }

            // Refresh data before closing the modal
            await loadData();
            resetForm();
        } catch (err) {
            console.error("Save operation error:", err);

            setFormError(
                err.response?.data?.message ||
                "Operation save nahi hua. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    // Delete operation
    const deleteOperation = async id => {
        if (!window.confirm("Are you sure you want to delete this operation?")) {
            return;
        }

        try {
            setError("");

            await api.delete(`/operations/${id}`);
            await loadData();
        } catch (err) {
            console.error("Delete operation error:", err);

            setError(
                err.response?.data?.message ||
                "Operation delete nahi hua. Please try again."
            );
        }
    };


    const markAsComplete = async operation => {
        try {
            setError("");

            await api.put(`/operations/${operation.id}`, {
                title: operation.title,
                operationType: operation.operationType,
                scheduledDate: operation.scheduledDate,
                status: "COMPLETED",
                notes: operation.notes || ""
            });

            await loadData();
        } catch (err) {
            console.error("Complete operation error:", err);

            setError(
                err.response?.data?.message ||
                "Operation complete mark nahi hua. Please try again."
            );
        }
    };


    // Counts
    const today = new Date().toLocaleDateString("en-CA");

    const upcomingCount = operations.filter(operation =>
        operation.scheduledDate >= today &&
        operation.status !== "COMPLETED" &&
        operation.status !== "CANCELLED"
    ).length;

    const completedCount = operations.filter(
        operation => operation.status === "COMPLETED"
    ).length;

    const getFieldName = fieldId => {
        const field = fields.find(
            item => Number(item.id) === Number(fieldId)
        );

        return field ? field.name : "Unknown field";
    };

    const getStatusLabel = status => {
        if (status === "PLANNED") return "Planned";
        if (status === "IN_PROGRESS") return "In Progress";
        if (status === "COMPLETED") return "Completed";
        if (status === "CANCELLED") return "Cancelled";

        return status || "Planned";
    };

    return (
        <div className="hh-dashboard fc-shell">
            <Sidebar />

            <main className="hh-main fc-main">
                <div className="fc-page">

                    {/* Page Header */}
                    <header className="fc-header">
                        <div>
                            <p className="fc-eyebrow">
                                HARVESTHUB MANAGEMENT
                            </p>

                            <h1>Field Operations 🚜</h1>

                            <p>
                                Schedule and manage your farm activities.
                            </p>
                        </div>

                        <div className="fc-header-actions">
                            <button
                                type="button"
                                className="fc-button fc-primary"
                                onClick={openAddForm}
                            >
                                + Add Operation
                            </button>
                        </div>
                    </header>

                    {/* Page Error */}
                    {error && (
                        <div className="fc-error" role="alert">
                            <span>{error}</span>

                            <button
                                type="button"
                                onClick={loadData}
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Summary Cards */}
                    <section className="fc-summary">
                        <article>
                            <span>Total Operations</span>
                            <strong>{operations.length}</strong>
                        </article>

                        <article>
                            <span>Upcoming</span>
                            <strong>{upcomingCount}</strong>
                        </article>

                        <article>
                            <span>Completed</span>
                            <strong>{completedCount}</strong>
                        </article>
                    </section>

                    {/* Add / Edit Operation Modal */}
                    {showForm && (
                        <div
                            className="hc-modal-backdrop"
                            onMouseDown={event => {
                                if (event.target === event.currentTarget && !saving) {
                                    resetForm();
                                }
                            }}
                        >
                            <section
                                className="hc-modal"
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="operation-modal-title"
                                onMouseDown={event => event.stopPropagation()}
                            >
                                <div className="hc-modal-heading">
                                    <div>
                                        <p className="hc-eyebrow">
                                            FIELD MANAGEMENT
                                        </p>

                                        <h2 id="operation-modal-title">
                                            {editingId
                                                ? "Edit Operation"
                                                : "Add New Operation"}
                                        </h2>

                                        <p>
                                            Schedule an activity for your field.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className="hc-close"
                                        onClick={resetForm}
                                        disabled={saving}
                                        aria-label="Close modal"
                                    >
                                        ×
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit}>
                                    <div className="hc-group">
                                        <label htmlFor="operation-field">
                                            Select Field *
                                        </label>

                                        <select
                                            id="operation-field"
                                            value={selectedField}
                                            onChange={event =>
                                                setSelectedField(event.target.value)
                                            }
                                            required
                                            disabled={Boolean(editingId) || saving}
                                        >
                                            <option value="">
                                                Select a field
                                            </option>

                                            {fields.map(field => (
                                                <option
                                                    key={field.id}
                                                    value={String(field.id)}
                                                >
                                                    {field.name}
                                                    {field.area
                                                        ? ` (${field.area} ${field.areaUnit || ""})`
                                                        : ""}
                                                </option>
                                            ))}
                                        </select>

                                        {fields.length === 0 && (
                                            <p>
                                                No fields found. Add a field first
                                                from Fields & Crops.
                                            </p>
                                        )}
                                    </div>

                                    <div className="hc-group">
                                        <label htmlFor="operation-title">
                                            Operation Title *
                                        </label>

                                        <input
                                            id="operation-title"
                                            type="text"
                                            name="title"
                                            placeholder="e.g. Morning irrigation"
                                            value={form.title}
                                            onChange={handleChange}
                                            maxLength={100}
                                            required
                                            disabled={saving}
                                        />
                                    </div>


                                    {/* Operation Type */}
                                    <div className="hc-group">
                                        <label htmlFor="operation-type">
                                            Operation Type *
                                        </label>

                                        <select
                                            id="operation-type"
                                            name="operationType"
                                            value={form.operationType}
                                            onChange={handleChange}
                                            required
                                            disabled={saving}
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

                                    {/* NEW: Operation Cost */}
                                    <div className="hc-group">
                                        <label htmlFor="operation-cost">
                                            Operation Cost (₹)
                                        </label>

                                        <input
                                            id="operation-cost"
                                            type="number"
                                            name="cost"
                                            value={form.cost}
                                            onChange={handleChange}
                                            placeholder="Enter operation cost"
                                            min="0"
                                            step="0.01"
                                            disabled={saving}
                                        />
                                    </div>

                                    {/* Scheduled Date */}
                                    <div className="hc-group">
                                        <label htmlFor="operation-date">
                                            Scheduled Date *
                                        </label>

                                        {/* Yahan tumhara existing Scheduled Date input bilkul same rahega */}
                                    </div>


                                    <div className="hc-group">
                                        <label htmlFor="operation-date">
                                            Scheduled Date *
                                        </label>

                                        <input
                                            id="operation-date"
                                            type="date"
                                            name="scheduledDate"
                                            value={form.scheduledDate}
                                            onChange={handleChange}
                                            required
                                            disabled={saving}
                                        />
                                    </div>

                                    {editingId && (
                                        <div className="hc-group">
                                            <label htmlFor="operation-status">
                                                Status
                                            </label>

                                            <select
                                                id="operation-status"
                                                name="status"
                                                value={form.status}
                                                onChange={handleChange}
                                                disabled={saving}
                                            >
                                                <option value="PLANNED">
                                                    Planned
                                                </option>

                                                <option value="IN_PROGRESS">
                                                    In Progress
                                                </option>

                                                <option value="COMPLETED">
                                                    Completed
                                                </option>

                                                <option value="CANCELLED">
                                                    Cancelled
                                                </option>
                                            </select>
                                        </div>
                                    )}

                                    <div className="hc-group">
                                        <label htmlFor="operation-notes">
                                            Notes (Optional)
                                        </label>

                                        <textarea
                                            id="operation-notes"
                                            name="notes"
                                            placeholder="Add any details about this activity..."
                                            value={form.notes}
                                            onChange={handleChange}
                                            rows={3}
                                            maxLength={1000}
                                            disabled={saving}
                                        />
                                    </div>

                                    {formError && (
                                        <div
                                            className="hc-error"
                                            role="alert"
                                        >
                                            {formError}
                                        </div>
                                    )}

                                    <div className="hc-modal-actions">
                                        <button
                                            type="button"
                                            className="hc-secondary"
                                            onClick={resetForm}
                                            disabled={saving}
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="submit"
                                            className="hc-primary"
                                            disabled={saving || fields.length === 0}
                                        >
                                            {saving
                                                ? "Saving..."
                                                : editingId
                                                    ? "Update Operation"
                                                    : "Save Operation"}
                                        </button>
                                    </div>
                                </form>
                            </section>
                        </div>
                    )}

                    {/* Scheduled Activities */}
                    <section className="fc-section">
                        <div className="fc-section-heading">
                            <div>
                                <h2>Scheduled Activities</h2>
                                <p>
                                    View and manage your farm operations.
                                </p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="fc-empty">
                                Loading operations...
                            </div>
                        ) : operations.length === 0 ? (
                            <div className="fc-empty">
                                <h3>No operations yet</h3>

                                <p>
                                    Add your first farm activity to get started.
                                </p>

                                <button
                                    type="button"
                                    className="fc-button fc-primary"
                                    onClick={openAddForm}
                                >
                                    + Add Operation
                                </button>
                            </div>
                        ) : (

                            <div className="fc-card-grid">
                                {operations.map((operation) => (
                                    <div className="fc-card operation-card" key={operation.id}>
                                        <div className="operation-card-header">
                                            <div>
                    <span className="operation-type-label">
                        {operation.operationType}
                    </span>
                                                <h3 className="operation-card-title">
                                                    {operation.title}
                                                </h3>
                                            </div>

                                            <span
                                                className={`operation-status ${
                                                    operation.status === "COMPLETED"
                                                        ? "status-completed"
                                                        : "status-scheduled"
                                                }`}
                                            >
                    {operation.status === "COMPLETED"
                        ? "Completed"
                        : "Scheduled"}
                </span>
                                        </div>

                                        <div className="operation-card-details">

                                            <div className="operation-detail">
                                                <span className="operation-detail-label">FIELD</span>
                                                <span className="operation-detail-value">
        {operation.fieldName ||
            operation.field?.name ||
            fields.find(
                (field) => String(field.id) === String(operation.fieldId)
            )?.name ||
            "Field"}
    </span>
                                            </div>


                                            <div className="operation-detail">
                                                <span className="operation-detail-label">DATE</span>
                                                <span className="operation-detail-value">
                        {operation.scheduledDate || "Not scheduled"}
                    </span>
                                            </div>
                                        </div>

                                        <div className="operation-cost-panel">
                                            <span>Operation Cost</span>
                                            <strong>
                                                ₹{Number(
                                                operation.operationCost ?? operation.cost ?? 0
                                            ).toLocaleString("en-IN")}
                                            </strong>
                                        </div>

                                        {operation.notes && (
                                            <div className="operation-notes">
                                                <span className="operation-detail-label">NOTES</span>
                                                <p>{operation.notes}</p>
                                            </div>
                                        )}


                                        <div className="operation-actions">
                                            {operation.status === "COMPLETED" ? (
                                                <div className="operation-logged-date">
                                                    <svg
                                                        width="17"
                                                        height="17"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="1.8"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        aria-hidden="true"
                                                    >
                                                        <circle cx="12" cy="12" r="9" />
                                                        <path d="m8 12 2.5 2.5L16 9" />
                                                    </svg>

                                                    <span>
                Logged on{" "}
                                                        <strong>
                    {operation.completedAt
                        ? new Date(operation.completedAt).toLocaleDateString(
                            "en-CA",
                            { timeZone: "UTC" }
                        )
                        : "Date not recorded"}
                </strong>
            </span>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="operation-complete-btn"
                                                    onClick={() => markAsComplete(operation)}
                                                >
                                                    <svg
                                                        width="17"
                                                        height="17"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="1.8"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        aria-hidden="true"
                                                    >
                                                        <circle cx="12" cy="12" r="9" />
                                                        <path d="m8 12 2.5 2.5L16 9" />
                                                    </svg>
                                                    Mark Completed
                                                </button>
                                            )}


                                            <div className="operation-actions-right op-actions">
                                                <button
                                                    type="button"
                                                    className="fc-icon-action fc-icon-edit"
                                                    onClick={() => startEdit(operation)}
                                                    aria-label="Edit operation"
                                                    title="Edit Operation"
                                                >
                                                    <EditIcon />
                                                </button>

                                                <button
                                                    type="button"
                                                    className="fc-icon-action fc-icon-delete"
                                                    onClick={() => deleteOperation(operation.id)}
                                                    aria-label="Delete operation"
                                                    title="Delete Operation"
                                                >
                                                    <DeleteIcon />
                                                </button>
                                            </div>

                                        </div>

                                    </div>
                                ))}
                            </div>

                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
