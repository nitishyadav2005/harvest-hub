
import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import AddFieldModal from "../components/AddFieldModal";
import AddCropModal from "../components/AddCropModal";
import Sidebar from "../components/Sidebar";
import "./FieldsCrops.css";

function EditIcon() {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
        </svg>
    );
}

function DeleteIcon() {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="m19 6-1 14H6L5 6" />
            <path d="M10 11v5M14 11v5" />
        </svg>
    );
}

export default function FieldsCrops() {
    const [farms, setFarms] = useState([]);
    const [fields, setFields] = useState([]);
    const [crops, setCrops] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showAddField, setShowAddField] = useState(false);
    const [editingField, setEditingField] = useState(null);

    const [showAddCrop, setShowAddCrop] = useState(false);
    const [editingCrop, setEditingCrop] = useState(null);
    const [initialCropFieldId, setInitialCropFieldId] = useState(null);

    const loadData = useCallback(async () => {
        try {
            setError("");

            const farmResponse = await api.get("/farms");
            const farmList = farmResponse.data;

            const fieldResponses = await Promise.all(
                farmList.map((farm) =>
                    api.get(`/farms/${farm.id}/fields`)
                )
            );

            const fieldList = fieldResponses.flatMap(
                (response) => response.data
            );

            const cropResponses = await Promise.all(
                fieldList.map((field) =>
                    api.get(`/fields/${field.id}/crops`)
                )
            );

            const cropList = cropResponses.flatMap(
                (response) => response.data
            );

            setFarms(farmList);
            setFields(fieldList);
            setCrops(cropList);
        } catch (err) {
            console.error("Fields and crops error:", err);
            setError(
                err.response?.data?.message ||
                "Data load nahi hua. Please retry."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    function openAddField() {
        setEditingField(null);
        setShowAddField(true);
    }

    function openEditField(field) {
        setEditingField(field);
        setShowAddField(true);
    }

    function closeFieldModal() {
        setShowAddField(false);
        setEditingField(null);
    }

    function openAddCrop(fieldId = null) {
        setEditingCrop(null);
        setInitialCropFieldId(fieldId);
        setShowAddCrop(true);
    }

    function openEditCrop(crop) {
        setInitialCropFieldId(null);
        setEditingCrop(crop);
        setShowAddCrop(true);
    }

    function closeCropModal() {
        setShowAddCrop(false);
        setEditingCrop(null);
        setInitialCropFieldId(null);
    }

    async function handleDeleteField(field) {
        const fieldCrops = crops.filter(
            (crop) => Number(crop.fieldId) === Number(field.id)
        );

        const message = fieldCrops.length > 0
            ? `Field "${field.name}" has ${fieldCrops.length} crop(s). Delete the field? The request may fail if crops are still linked to it.`
            : `Are you sure you want to delete field "${field.name}"?`;

        if (!window.confirm(message)) {
            return;
        }

        try {
            setError("");

            await api.delete(`/fields/${field.id}`);

            await loadData();
        } catch (err) {
            console.error("Delete field error:", err);

            setError(
                err.response?.data?.message ||
                "Field delete nahi hua. Linked crops ya server error check karo."
            );
        }
    }

    async function handleDeleteCrop(crop) {
        if (
            !window.confirm(
                `Are you sure you want to delete crop "${crop.name}"?`
            )
        ) {
            return;
        }

        try {
            setError("");

            await api.delete(`/crops/${crop.id}`);

            await loadData();
        } catch (err) {
            console.error("Delete crop error:", err);

            setError(
                err.response?.data?.message ||
                "Crop delete nahi hui. Please try again."
            );
        }
    }

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

                            <h1>Fields &amp; Crops 🌱</h1>

                            <p>
                                Manage your fields and keep track of every crop.
                            </p>
                        </div>

                        <div className="fc-header-actions">
                            <button
                                type="button"
                                className="fc-button fc-secondary"
                                onClick={openAddField}
                            >
                                + Add Field
                            </button>

                            <button
                                type="button"
                                className="fc-button fc-primary"
                                onClick={() => openAddCrop()}
                            >
                                + Add New Crop
                            </button>
                        </div>
                    </header>

                    {/* Error Message */}
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
                            <span>Total Fields</span>
                            <strong>{fields.length}</strong>
                        </article>

                        <article>
                            <span>Total Crops</span>
                            <strong>{crops.length}</strong>
                        </article>

                        <article>
                            <span>Crop Seasons</span>
                            <strong>
                                {
                                    new Set(
                                        crops
                                            .map((crop) => crop.season)
                                            .filter(Boolean)
                                    ).size
                                }
                            </strong>
                        </article>
                    </section>

                    {/* Fields Section */}
                    <section className="fc-section">
                        <div className="fc-section-heading">
                            <div>
                                <h2>My Fields</h2>
                                <p>Fields registered in your farms</p>
                            </div>
                        </div>

                        {loading ? (
                            <p>Loading fields...</p>
                        ) : fields.length === 0 ? (
                            <div className="fc-empty">
                                <span>🌾</span>

                                <h3>No fields added yet</h3>

                                <p>
                                    Add your first field to start managing crops.
                                </p>

                                <button
                                    type="button"
                                    className="fc-button fc-primary"
                                    onClick={openAddField}
                                >
                                    + Add Field
                                </button>
                            </div>
                        ) : (
                            <div className="fc-grid">
                                {fields.map((field) => {
                                    const fieldCrops = crops.filter(
                                        (crop) =>
                                            Number(crop.fieldId) ===
                                            Number(field.id)
                                    );

                                    return (
                                        <article
                                            className="fc-field-card"
                                            key={field.id}
                                        >
                                            {/* Field Top */}
                                            <div className="fc-field-top">
                                                <span className="fc-field-icon">
                                                    🌱
                                                </span>

                                                <span className="fc-count">
                                                    {fieldCrops.length} crops
                                                </span>
                                            </div>

                                            {/* Field Name + Actions */}
                                            <div className="fc-field-title-row">
                                                <h3>{field.name}</h3>

                                                <div className="fc-row-actions">


                                                    <button
                                                        type="button"
                                                        className="fc-icon-action fc-icon-delete"
                                                        title="Delete field"
                                                        aria-label={`Delete ${field.name}`}
                                                        onClick={() =>
                                                            handleDeleteField(field)
                                                        }
                                                    >
                                                        <DeleteIcon />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Field Area */}
                                            <p className="fc-area">
                                                {field.area}{" "}
                                                {field.areaUnit || "acres"}
                                            </p>

                                            {/* Field Details */}
                                            <div className="fc-details">
                                                <p>
                                                    <span>Soil</span>

                                                    <strong>
                                                        {field.soilType ||
                                                            "Not specified"}
                                                    </strong>
                                                </p>

                                                <p>
                                                    <span>Irrigation</span>

                                                    <strong>
                                                        {field.irrigationType ||
                                                            "Not specified"}
                                                    </strong>
                                                </p>
                                            </div>

                                            {/* Crops Heading */}
                                            <div className="fc-crops-heading">
                                                <strong>
                                                    Crops in this field
                                                </strong>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openAddCrop(field.id)
                                                    }
                                                >
                                                    + Add
                                                </button>
                                            </div>

                                            {/* Crop List */}
                                            {fieldCrops.length === 0 ? (
                                                <p className="fc-no-crops">
                                                    No crops added yet.
                                                </p>
                                            ) : (
                                                <div className="fc-crop-list">
                                                    {fieldCrops.map((crop) => (
                                                        <div
                                                            className="fc-crop-item"
                                                            key={crop.id}
                                                        >
                                                            <span>🌿</span>

                                                            <div className="fc-crop-info">
                                                                <strong>
                                                                    {crop.name}
                                                                </strong>

                                                                <small>
                                                                    {crop.season ||
                                                                        "Season not set"}

                                                                    {crop.status
                                                                        ? ` · ${crop.status}`
                                                                        : ""}
                                                                </small>

                                                                {crop.sowingDate && (
                                                                    <small>
                                                                        Sowing:{" "}
                                                                        {crop.sowingDate}
                                                                    </small>
                                                                )}

                                                                {crop.expectedHarvestDate && (
                                                                    <small>
                                                                        Harvest:{" "}
                                                                        {crop.expectedHarvestDate}
                                                                    </small>
                                                                )}
                                                            </div>

                                                            {/* Crop Edit/Delete */}
                                                            <div className="fc-row-actions fc-crop-actions">
                                                                <button
                                                                    type="button"
                                                                    className="fc-icon-action fc-icon-edit"
                                                                    title="Edit crop"
                                                                    aria-label={`Edit ${crop.name}`}
                                                                    onClick={() =>
                                                                        openEditCrop(crop)
                                                                    }
                                                                >
                                                                    <EditIcon />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="fc-icon-action fc-icon-delete"
                                                                    title="Delete crop"
                                                                    aria-label={`Delete ${crop.name}`}
                                                                    onClick={() =>
                                                                        handleDeleteCrop(crop)
                                                                    }
                                                                >
                                                                    <DeleteIcon />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* Add/Edit Field Modal */}
                    {showAddField && (
                        <AddFieldModal
                            farms={farms}
                            field={editingField}
                            onClose={closeFieldModal}
                            onSuccess={loadData}
                        />
                    )}

                    {/* Add/Edit Crop Modal */}
                    {showAddCrop && (
                        <AddCropModal
                            fields={fields}
                            crop={editingCrop}
                            initialFieldId={initialCropFieldId}
                            onClose={closeCropModal}
                            onSuccess={loadData}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}
