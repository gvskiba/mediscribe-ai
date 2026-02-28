import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";

export default function SaveGuidelineModal({ guideline, onClose, onSaved }) {
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const tagArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await base44.entities.SavedGuideline.create({
        title: guideline.title,
        url: guideline.url,
        description: guideline.description,
        source: guideline.source,
        tags: tagArray,
        notes: notes.trim(),
        saved_date: new Date().toISOString(),
      });

      onSaved?.();
      onClose();
    } catch (error) {
      console.error("Failed to save guideline:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#f8f9fa",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 20px 25px rgba(0, 0, 0, 0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1f2937", margin: 0 }}>Save Guideline</h2>
            <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0 0" }}>{guideline.title}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#9ca3af",
              padding: "4px",
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tags */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#1f2937", marginBottom: "6px" }}>
            Tags (comma-separated)
          </label>
          <input
            type="text"
            placeholder="e.g., cardiology, urgent, important"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "13px",
              boxSizing: "border-box",
              outline: "none",
            }}
          />
        </div>

        {/* Notes */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#1f2937", marginBottom: "6px" }}>
            Notes
          </label>
          <textarea
            placeholder="Add any notes about this guideline..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "13px",
              fontFamily: "inherit",
              boxSizing: "border-box",
              outline: "none",
              minHeight: "80px",
              resize: "vertical",
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              background: "#fff",
              color: "#374151",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              background: "#2563eb",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 500,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              transition: "all 0.2s",
            }}
          >
            {saving ? "Saving..." : "Save Guideline"}
          </button>
        </div>
      </div>
    </div>
  );
}