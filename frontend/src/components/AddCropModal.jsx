
import { useEffect, useState } from "react";
import api from "../services/api";
import "./AddCropModal.css";

export default function AddCropModal({
                                         fields,
                                         onClose,
                                         onSuccess,
                                         crop = null,
                                         initialFieldId = null
                                     }) {
    const isEditing = crop !== null;

    const [fieldId, setFieldId] = useState(
        String(crop?.fieldId ?? initialFieldId ?? fields[0]?.id ?? "")
    );

    const [name, setName] = useState(crop?.name || "");
    const [season, setSeason] = useState(crop?.season || "Rabi");

    const [sowingDate, setSowingDate] = useState(
        crop?.sowingDate || ""
    );

    const [expectedHarvestDate, setExpectedHarvestDate] = useState(
        crop?.expectedHarvestDate || ""
    );

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        setFieldId(
            String(crop?.fieldId ?? initialFieldId ?? fields[0]?.id ?? "")
        );

        setName(crop?.name || "");
        setSeason(crop?.season || "Rabi");
        setSowingDate(crop?.sowingDate || "");
        setExpectedHarvestDate(crop?.expectedHarvestDate || "");
        setError("");
    }, [crop, fields, initialFieldId]);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        if (!fieldId) {
            setError("Please select a field.");
            return;
        }

        if (!name.trim()) {
            setError("Crop name is required.");
            return;
        }

        if (
            sowingDate &&
            expectedHarvestDate &&
            expectedHarvestDate < sowingDate
        ) {
            setError("Harvest date cannot be before sowing date.");
            return;
        }

        const cropData = {
            name: name.trim(),
            season,
            sowingDate: sowingDate || null,
            expectedHarvestDate: expectedHarvestDate || null
        };

        try {
            setSaving(true);

            if (isEditing) {
                await api.put(`/crops/${crop.id}`, cropData);
            } else {
                await api.post(`/fields/${fieldId}/crops`, cropData);
            }

            await onSuccess();
            onClose();
        } catch (err) {
            console.error("Save crop error:", err);

            setError(
                err.response?.data?.message ||
                err.response?.data?.detail ||
                err.response?.data?.error ||
                (
                    isEditing
                        ? "Crop update nahi hua. Please try again."
                        : "Crop save nahi hui. Please try again."
                )
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <div
            className="hc-modal-backdrop"
            onMouseDown={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !saving
                ) {
                    onClose();
                }
            }}
        >
            <section
                className="hc-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="hc-modal-title"
            >
                <div className="hc-modal-heading">
                    <div>
                        <p className="hc-eyebrow">HARVESTHUB</p>

                        <h2 id="hc-modal-title">
                            {isEditing ? "Edit Crop 🌱" : "Add New Crop 🌱"}
                        </h2>

                        <p>
                            {isEditing
                                ? "Update your crop details."
                                : "Plan your next harvest."}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="hc-close"
                        onClick={onClose}
                        disabled={saving}
                        aria-label="Close popup"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {fields.length === 0 ? (
                        <p className="hc-error">
                            No fields found. Please add a field first.
                        </p>
                    ) : (
                        <>
                            <div className="hc-group">
                                <label htmlFor="hc-field">
                                    Select Field *
                                </label>

                                <select
                                    id="hc-field"
                                    value={fieldId}
                                    onChange={(event) =>
                                        setFieldId(event.target.value)
                                    }
                                    required
                                    disabled={saving || isEditing}
                                >
                                    {fields.map((field) => (
                                        <option
                                            key={field.id}
                                            value={String(field.id)}
                                        >
                                            {field.name} — {field.farmName || "Farm"}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="hc-group">
                                <label htmlFor="hc-name">
                                    Crop Name *
                                </label>

                                <input
                                    id="hc-name"
                                    type="text"
                                    value={name}
                                    onChange={(event) =>
                                        setName(event.target.value)
                                    }
                                    placeholder="e.g. Wheat, Rice, Potato"
                                    maxLength={100}
                                    required
                                    disabled={saving}
                                />
                            </div>

                            <div className="hc-group">
                                <label htmlFor="hc-season">
                                    Season *
                                </label>

                                <select
                                    id="hc-season"
                                    value={season}
                                    onChange={(event) =>
                                        setSeason(event.target.value)
                                    }
                                    required
                                    disabled={saving}
                                >
                                    <option value="Rabi">Rabi</option>
                                    <option value="Kharif">Kharif</option>
                                    <option value="Zaid">Zaid</option>
                                </select>
                            </div>

                            <div className="hc-date-row">
                                <div className="hc-group">
                                    <label htmlFor="hc-sowing">
                                        Sowing Date
                                    </label>

                                    <input
                                        id="hc-sowing"
                                        type="date"
                                        value={sowingDate}
                                        onChange={(event) =>
                                            setSowingDate(event.target.value)
                                        }
                                        max={expectedHarvestDate || undefined}
                                        disabled={saving}
                                    />
                                </div>

                                <div className="hc-group">
                                    <label htmlFor="hc-harvest">
                                        Expected Harvest
                                    </label>

                                    <input
                                        id="hc-harvest"
                                        type="date"
                                        value={expectedHarvestDate}
                                        onChange={(event) =>
                                            setExpectedHarvestDate(event.target.value)
                                        }
                                        min={sowingDate || undefined}
                                        disabled={saving}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {error && (
                        <p className="hc-error" role="alert">
                            {error}
                        </p>
                    )}

                    <div className="hc-modal-actions">
                        <button
                            type="button"
                            className="hc-secondary"
                            onClick={onClose}
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
                                : isEditing
                                    ? "Update Crop"
                                    : "Save Crop"}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}
