
import { useState } from "react";
import api from "../services/api";
import "./AddFieldModal.css";

function AddFieldModal({ farms, onClose, onSuccess }) {
    const [farmId, setFarmId] = useState(
        farms.length > 0 ? String(farms[0].id) : ""
    );
    const [name, setName] = useState("");
    const [area, setArea] = useState("");
    const [areaUnit, setAreaUnit] = useState("acres");
    const [soilType, setSoilType] = useState("");
    const [irrigationType, setIrrigationType] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        if (!farmId) {
            setError("Please create a farm before adding a field.");
            return;
        }

        if (!name.trim()) {
            setError("Please enter a field name.");
            return;
        }

        if (!area || Number(area) <= 0) {
            setError("Area must be greater than zero.");
            return;
        }

        try {
            setSaving(true);

            await api.post(`/farms/${farmId}/fields`, {
                name: name.trim(),
                area: Number(area),
                areaUnit,
                soilType,
                irrigationType,
            });

            await onSuccess();
            onClose();
        } catch (err) {
            console.error("Add field error:", err);
            setError(
                err.response?.data?.message ||
                "Field save nahi hua. Please try again."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <div
            className="hh-modal-backdrop"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !saving) {
                    onClose();
                }
            }}
        >
            <section
                className="hh-field-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="hh-field-modal-title"
            >
                <div className="hh-modal-header">
                    <div>
                        <p className="hh-modal-eyebrow">HARVESTHUB</p>
                        <h2 id="hh-field-modal-title">Add New Field</h2>
                        <p>Enter the details of your field below.</p>
                    </div>

                    <button
                        type="button"
                        className="hh-modal-close"
                        onClick={onClose}
                        disabled={saving}
                        aria-label="Close popup"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {farms.length > 1 && (
                        <div className="hh-form-group">
                            <label htmlFor="hh-farm">Farm</label>
                            <select
                                id="hh-farm"
                                value={farmId}
                                onChange={(event) =>
                                    setFarmId(event.target.value)
                                }
                                required
                            >
                                {farms.map((farm) => (
                                    <option
                                        key={farm.id}
                                        value={String(farm.id)}
                                    >
                                        {farm.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {farms.length === 0 && (
                        <p className="hh-form-error">
                            No farm found. Please create a farm first.
                        </p>
                    )}

                    <div className="hh-form-group">
                        <label htmlFor="hh-field-name">Field Name *</label>
                        <input
                            id="hh-field-name"
                            type="text"
                            placeholder="e.g. North Field"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            maxLength={150}
                            required
                        />
                    </div>

                    <div className="hh-form-row">
                        <div className="hh-form-group">
                            <label htmlFor="hh-field-area">Area *</label>
                            <input
                                id="hh-field-area"
                                type="number"
                                placeholder="e.g. 2"
                                value={area}
                                onChange={(event) => setArea(event.target.value)}
                                min="0.01"
                                step="any"
                                required
                            />
                        </div>

                        <div className="hh-form-group">
                            <label htmlFor="hh-area-unit">Unit</label>
                            <select
                                id="hh-area-unit"
                                value={areaUnit}
                                onChange={(event) =>
                                    setAreaUnit(event.target.value)
                                }
                            >
                                <option value="acres">Acres</option>
                                <option value="hectares">Hectares</option>
                                <option value="bigha">Bigha</option>
                            </select>
                        </div>
                    </div>

                    <div className="hh-form-group">
                        <label htmlFor="hh-soil-type">Soil Type</label>
                        <select
                            id="hh-soil-type"
                            value={soilType}
                            onChange={(event) =>
                                setSoilType(event.target.value)
                            }
                        >
                            <option value="">Select soil type</option>
                            <option value="Loamy">Loamy</option>
                            <option value="Clay">Clay</option>
                            <option value="Sandy">Sandy</option>
                            <option value="Silt">Silt</option>
                            <option value="Black">Black soil</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="hh-form-group">
                        <label htmlFor="hh-irrigation-type">
                            Irrigation Type
                        </label>
                        <select
                            id="hh-irrigation-type"
                            value={irrigationType}
                            onChange={(event) =>
                                setIrrigationType(event.target.value)
                            }
                        >
                            <option value="">Select irrigation type</option>
                            <option value="Drip">Drip</option>
                            <option value="Sprinkler">Sprinkler</option>
                            <option value="Flood">Flood</option>
                            <option value="Rainfed">Rainfed</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {error && (
                        <p className="hh-form-error" role="alert">
                            {error}
                        </p>
                    )}

                    <div className="hh-modal-actions">
                        <button
                            type="button"
                            className="hh-btn-secondary"
                            onClick={onClose}
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="hh-btn-primary"
                            disabled={saving || farms.length === 0}
                        >
                            {saving ? "Saving..." : "Save Field"}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}

export default AddFieldModal;
