
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import AddCropModal from "../components/AddCropModal";
import "./CropPlanning.css";
import "./FieldsCrops.css";

const initialForm = {
    fieldId: "",
    name: "",
    season: "",
    sowingDate: "",
    expectedHarvestDate: ""
};

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

const getErrorMessage = (err, fallback) =>
    err.response?.data?.message ||
    err.response?.data?.detail ||
    err.response?.data?.error ||
    fallback;

const formatDate = (date) => {
    if (!date) return "Not set";

    const parts = String(date).split("-");
    if (parts.length !== 3) return date;

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const getStatus = (status) =>
    (status || "PLANNED").toUpperCase().replaceAll("_", " ");

export default function CropPlanning() {
    const [fields, setFields] = useState([]);
    const [crops, setCrops] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    // Add/Edit Crop popup
    const [showAddCropModal, setShowAddCropModal] = useState(false);
    const [cropToEdit, setCropToEdit] = useState(null);

    // Existing inline edit form state
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(initialForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [success, setSuccess] = useState("");

    const [editingCropId, setEditingCropId] = useState(null);
    const [deletingCropId, setDeletingCropId] = useState(null);

    // Search and filters
    const [searchText, setSearchText] = useState("");
    const [seasonFilter, setSeasonFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [fieldFilter, setFieldFilter] = useState("ALL");

    // Load farms, fields and crops
    const loadData = useCallback(async (showLoader = true) => {
        if (showLoader) {
            setLoading(true);
        }

        setError("");

        try {
            const farmResponse = await api.get("/farms");

            const farmList = Array.isArray(farmResponse.data)
                ? farmResponse.data
                : [];

            const fieldResponses = await Promise.all(
                farmList.map(async (farm) => {
                    const response = await api.get(
                        `/farms/${farm.id}/fields`
                    );

                    const farmFields = Array.isArray(response.data)
                        ? response.data
                        : [];

                    return farmFields.map((field) => ({
                        ...field,
                        farmId: farm.id,
                        farmName: farm.name || "Farm"
                    }));
                })
            );

            const fieldList = fieldResponses.flat();

            const cropResponses = await Promise.all(
                fieldList.map(async (field) => {
                    const response = await api.get(
                        `/fields/${field.id}/crops`
                    );

                    const fieldCrops = Array.isArray(response.data)
                        ? response.data
                        : [];

                    return fieldCrops.map((crop) => ({
                        ...crop,
                        fieldId: field.id,
                        fieldName: field.name || `Field ${field.id}`
                    }));
                })
            );

            setFields(fieldList);
            setCrops(cropResponses.flat());
        } catch (err) {
            console.error("Crop Planning error:", err);

            setError(
                getErrorMessage(
                    err,
                    "Crop data load nahi hua. Please retry."
                )
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRefresh = async () => {
        setRefreshing(true);
        setSuccess("");
        await loadData(false);
    };

    const getFieldName = (fieldId) => {
        const field = fields.find(
            (item) => Number(item.id) === Number(fieldId)
        );

        return field?.name || `Field ${fieldId ?? ""}`;
    };

    const handleFormChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));

        setFormError("");
        setSuccess("");
    };

    // Open Add Crop popup
    const openAddForm = () => {
        setShowForm(false);
        setEditingCropId(null);
        setCropToEdit(null);
        setForm(initialForm);
        setFormError("");
        setSuccess("");
        setShowAddCropModal(true);
    };

    // Close Add/Edit Crop popup
    const handleCloseAddCropModal = () => {
        setShowAddCropModal(false);
        setCropToEdit(null);
    };

    // Open Edit Crop popup
    const handleEditCrop = (crop) => {
        setShowForm(false);
        setEditingCropId(null);
        setCropToEdit(crop);
        setFormError("");
        setSuccess("");
        setShowAddCropModal(true);
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setEditingCropId(null);
        setForm(initialForm);
        setFormError("");
    };

    // Update crop using the existing inline form
    const handleSaveCrop = async (event) => {
        event.preventDefault();

        setFormError("");
        setSuccess("");

        if (!form.fieldId) {
            setFormError("Please select a field.");
            return;
        }

        if (!form.name.trim()) {
            setFormError("Crop name is required.");
            return;
        }

        if (!form.season) {
            setFormError("Please select a season.");
            return;
        }

        if (
            form.sowingDate &&
            form.expectedHarvestDate &&
            form.expectedHarvestDate < form.sowingDate
        ) {
            setFormError(
                "Harvest date cannot be before sowing date."
            );
            return;
        }

        const cropData = {
            name: form.name.trim(),
            season: form.season,
            sowingDate: form.sowingDate || null,
            expectedHarvestDate: form.expectedHarvestDate || null
        };

        try {
            setSaving(true);

            await api.put(`/crops/${editingCropId}`, cropData);

            setShowForm(false);
            setEditingCropId(null);
            setForm(initialForm);
            setSuccess("Crop updated successfully!");

            await loadData(false);
        } catch (err) {
            console.error("Update crop error:", err);

            setFormError(
                getErrorMessage(
                    err,
                    "Crop update nahi hua. Please try again."
                )
            );
        } finally {
            setSaving(false);
        }
    };

    // Delete crop after confirmation
    const handleDeleteCrop = async (crop) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${crop.name}"?`
        );

        if (!confirmed) return;

        setDeletingCropId(crop.id);
        setError("");
        setSuccess("");
        setFormError("");

        try {
            await api.delete(`/crops/${crop.id}`);

            if (editingCropId === crop.id) {
                setShowForm(false);
                setEditingCropId(null);
                setForm(initialForm);
            }

            setSuccess(`${crop.name} deleted successfully!`);

            await loadData(false);
        } catch (err) {
            console.error("Delete crop error:", err);

            setError(
                getErrorMessage(
                    err,
                    "Crop delete nahi hua. Please try again."
                )
            );
        } finally {
            setDeletingCropId(null);
        }
    };

    // Statistics
    const plannedCount = crops.filter(
        (crop) => getStatus(crop.status) === "PLANNED"
    ).length;

    const growingCount = crops.filter((crop) =>
        ["GROWING", "IN PROGRESS"].includes(getStatus(crop.status))
    ).length;

    const harvestedCount = crops.filter(
        (crop) => getStatus(crop.status) === "HARVESTED"
    ).length;

    const fieldsInUse = new Set(
        crops.map((crop) => Number(crop.fieldId))
    ).size;

    const today = new Date().toLocaleDateString("en-CA");

    const upcomingHarvests = crops.filter(
        (crop) =>
            crop.expectedHarvestDate &&
            crop.expectedHarvestDate >= today &&
            getStatus(crop.status) !== "HARVESTED"
    );

    // Search and filters
    const filteredCrops = useMemo(() => {
        const query = searchText.trim().toLowerCase();

        return crops.filter((crop) => {
            const matchesSearch =
                !query ||
                (crop.name || "").toLowerCase().includes(query) ||
                getFieldName(crop.fieldId).toLowerCase().includes(query);

            const matchesSeason =
                seasonFilter === "ALL" ||
                crop.season === seasonFilter;

            const matchesStatus =
                statusFilter === "ALL" ||
                getStatus(crop.status) === statusFilter;

            const matchesField =
                fieldFilter === "ALL" ||
                String(crop.fieldId) === fieldFilter;

            return (
                matchesSearch &&
                matchesSeason &&
                matchesStatus &&
                matchesField
            );
        });
    }, [
        crops,
        fields,
        searchText,
        seasonFilter,
        statusFilter,
        fieldFilter
    ]);

    const clearFilters = () => {
        setSearchText("");
        setSeasonFilter("ALL");
        setStatusFilter("ALL");
        setFieldFilter("ALL");
    };

    const getStatusClass = (status) => {
        const value = getStatus(status);

        if (value === "HARVESTED") return "harvested";

        if (["GROWING", "IN PROGRESS"].includes(value)) {
            return "growing";
        }

        return "planned";
    };

    return (
        <div className="hh-dashboard fc-shell">
            <Sidebar />

            <main className="hh-main cp-main">
                <div className="cp-page">
                    <header className="cp-header">
                        <div>
                            <p className="fc-eyebrow">
                                HARVESTHUB MANAGEMENT
                            </p>

                            <h1>Crop Planning 🌱</h1>

                            <p>
                                Track your crops, growing seasons and
                                upcoming harvests.
                            </p>
                        </div>
                    </header>

                    {error && (
                        <div className="cp-error-message" role="alert">
                            <p>{error}</p>

                            <button
                                type="button"
                                className="cp-refresh"
                                onClick={handleRefresh}
                                disabled={refreshing}
                            >
                                {refreshing ? "Retrying..." : "Try Again"}
                            </button>
                        </div>
                    )}

                    <section className="cp-stats">
                        <article>
                            <span>Total Crop Plans</span>
                            <strong>{crops.length}</strong>
                        </article>

                        <article>
                            <span>Fields in Use</span>
                            <strong>{fieldsInUse}</strong>
                        </article>

                        <article>
                            <span>Upcoming Harvests</span>
                            <strong>{upcomingHarvests.length}</strong>
                        </article>

                        <article>
                            <span>Planned Crops</span>
                            <strong>{plannedCount}</strong>
                        </article>
                    </section>

                    <section className="cp-section">
                        <div className="cp-section-heading">
                            <div>
                                <h2>Your Crop Plans</h2>
                                <p>
                                    Manage crop records from your fields.
                                </p>
                            </div>

                            <div className="cp-actions">
                                <button
                                    type="button"
                                    className="cp-add-button"
                                    onClick={openAddForm}
                                    disabled={loading || fields.length === 0}
                                >
                                    + Plan New Crop
                                </button>
                            </div>
                        </div>

                        {success && (
                            <p className="cp-success" role="status">
                                {success}
                            </p>
                        )}

                        {/* Existing inline Edit Crop form */}
                        {showForm && (
                            <form
                                className="cp-form"
                                onSubmit={handleSaveCrop}
                            >
                                <h3>Edit Crop</h3>

                                {formError && (
                                    <p
                                        className="cp-error-message"
                                        role="alert"
                                    >
                                        {formError}
                                    </p>
                                )}

                                <div className="cp-form-grid">
                                    <label>
                                        Select Field *
                                        <select
                                            name="fieldId"
                                            value={form.fieldId}
                                            onChange={handleFormChange}
                                            required
                                            disabled
                                        >
                                            {fields.map((field) => (
                                                <option
                                                    key={field.id}
                                                    value={String(field.id)}
                                                >
                                                    {field.name ||
                                                        `Field ${field.id}`}
                                                    {field.farmName
                                                        ? ` — ${field.farmName}`
                                                        : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label>
                                        Crop Name *
                                        <input
                                            name="name"
                                            value={form.name}
                                            onChange={handleFormChange}
                                            placeholder="e.g. Wheat"
                                            maxLength={100}
                                            required
                                            disabled={saving}
                                        />
                                    </label>

                                    <label>
                                        Season *
                                        <select
                                            name="season"
                                            value={form.season}
                                            onChange={handleFormChange}
                                            required
                                            disabled={saving}
                                        >
                                            <option value="">
                                                Select season
                                            </option>
                                            <option value="Kharif">
                                                Kharif
                                            </option>
                                            <option value="Rabi">
                                                Rabi
                                            </option>
                                            <option value="Zaid">
                                                Zaid
                                            </option>
                                        </select>
                                    </label>

                                    <label>
                                        Sowing Date
                                        <input
                                            type="date"
                                            name="sowingDate"
                                            value={form.sowingDate}
                                            onChange={handleFormChange}
                                            max={
                                                form.expectedHarvestDate ||
                                                undefined
                                            }
                                            disabled={saving}
                                        />
                                    </label>

                                    <label>
                                        Expected Harvest Date
                                        <input
                                            type="date"
                                            name="expectedHarvestDate"
                                            value={form.expectedHarvestDate}
                                            onChange={handleFormChange}
                                            min={form.sowingDate || undefined}
                                            disabled={saving}
                                        />
                                    </label>
                                </div>

                                <div className="cp-form-actions">
                                    <button
                                        type="button"
                                        className="cp-cancel-button"
                                        onClick={handleCancelForm}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="cp-add-button"
                                        disabled={saving}
                                    >
                                        {saving ? "Saving..." : "Update Crop"}
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="cp-filters">
                            <input
                                type="search"
                                value={searchText}
                                onChange={(event) =>
                                    setSearchText(event.target.value)
                                }
                                placeholder="Search crop or field..."
                                aria-label="Search crops or fields"
                            />

                            <select
                                value={fieldFilter}
                                onChange={(event) =>
                                    setFieldFilter(event.target.value)
                                }
                                aria-label="Filter by field"
                            >
                                <option value="ALL">All Fields</option>

                                {fields.map((field) => (
                                    <option
                                        key={field.id}
                                        value={String(field.id)}
                                    >
                                        {field.name || `Field ${field.id}`}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={seasonFilter}
                                onChange={(event) =>
                                    setSeasonFilter(event.target.value)
                                }
                                aria-label="Filter by season"
                            >
                                <option value="ALL">All Seasons</option>
                                <option value="Kharif">Kharif</option>
                                <option value="Rabi">Rabi</option>
                                <option value="Zaid">Zaid</option>
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(event.target.value)
                                }
                                aria-label="Filter by status"
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="PLANNED">Planned</option>
                                <option value="GROWING">Growing</option>
                                <option value="HARVESTED">Harvested</option>
                            </select>

                            <button
                                type="button"
                                className="cp-refresh"
                                onClick={clearFilters}
                            >
                                Clear Filters
                            </button>
                        </div>

                        {loading ? (
                            <div className="cp-empty">
                                <p>Loading crop plans...</p>
                            </div>
                        ) : crops.length === 0 ? (
                            <div className="cp-empty">
                                <span>🌾</span>
                                <h3>No crop plans yet</h3>
                                <p>
                                    Click Add Crop to create your first
                                    crop plan.
                                </p>
                            </div>
                        ) : filteredCrops.length === 0 ? (
                            <div className="cp-empty">
                                <h3>No matching crops</h3>
                                <p>
                                    Search ya filters change karke try karo.
                                </p>

                                <button
                                    type="button"
                                    className="cp-refresh"
                                    onClick={clearFilters}
                                >
                                    Clear Filters
                                </button>
                            </div>
                        ) : (
                            <div className="cp-table-wrap">
                                <table className="cp-table">
                                    <thead>
                                    <tr>
                                        <th>Crop</th>
                                        <th>Field</th>
                                        <th>Season</th>
                                        <th>Sowing Date</th>
                                        <th>Expected Harvest</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                    </thead>

                                    <tbody>
                                    {filteredCrops.map((crop) => (
                                        <tr key={crop.id}>
                                            <td>
                                                <strong>{crop.name}</strong>
                                            </td>

                                            <td>
                                                {getFieldName(crop.fieldId)}
                                            </td>

                                            <td>{crop.season || "—"}</td>

                                            <td>
                                                {formatDate(crop.sowingDate)}
                                            </td>

                                            <td>
                                                {formatDate(
                                                    crop.expectedHarvestDate
                                                )}
                                            </td>

                                            <td>
                                                    <span
                                                        className={`cp-status ${getStatusClass(
                                                            crop.status
                                                        )}`}
                                                    >
                                                        {getStatus(crop.status)}
                                                    </span>
                                            </td>

                                            <td>
                                                <div className="cp-actions">
                                                    <button
                                                        type="button"
                                                        className="fc-icon-action fc-icon-edit"
                                                        onClick={() =>
                                                            handleEditCrop(crop)
                                                        }
                                                        disabled={
                                                            saving ||
                                                            deletingCropId !== null
                                                        }
                                                        title="Edit Crop"
                                                        aria-label={`Edit ${crop.name}`}
                                                    >
                                                        <EditIcon />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="fc-icon-action fc-icon-delete"
                                                        onClick={() =>
                                                            handleDeleteCrop(crop)
                                                        }
                                                        disabled={
                                                            saving ||
                                                            deletingCropId !== null
                                                        }
                                                        title={
                                                            deletingCropId ===
                                                            crop.id
                                                                ? "Deleting..."
                                                                : "Delete Crop"
                                                        }
                                                        aria-label={`Delete ${crop.name}`}
                                                    >
                                                        <DeleteIcon />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {!loading && crops.length > 0 && (
                            <p className="cp-results-count">
                                Showing {filteredCrops.length} of {crops.length} crops
                            </p>
                        )}
                    </section>

                    <section className="cp-stats cp-status-summary">
                        <article>
                            <span>Growing Crops</span>
                            <strong>{growingCount}</strong>
                        </article>

                        <article>
                            <span>Harvested Crops</span>
                            <strong>{harvestedCount}</strong>
                        </article>
                    </section>
                </div>
            </main>

            {/* Shared Add/Edit Crop popup */}
            {showAddCropModal && (
                <AddCropModal
                    fields={fields}
                    crop={cropToEdit}
                    onClose={handleCloseAddCropModal}
                    onSuccess={async () => {
                        const wasEditing = cropToEdit !== null;

                        setShowAddCropModal(false);
                        setCropToEdit(null);
                        setFormError("");

                        await loadData(false);

                        setSuccess(
                            wasEditing
                                ? "Crop updated successfully!"
                                : "Crop added successfully!"
                        );
                    }}
                />
            )}
        </div>
    );
}
