import { useState } from "react";

// ─── SECTION CONFIGURATION ────────────────────────
const SECTION_CONFIG = {
  key: "[SECTION_KEY]",           // e.g., "demographics", "cc", "vitals"
  title: "[SECTION_TITLE]",       // e.g., "Demographics", "Chief Complaint"
  icon: "[SECTION_ICON]",         // e.g., "👤", "💬", "📈"
  description: "[DESCRIPTION]",   // e.g., "Patient basic information"
};

// ─── FORM FIELDS ──────────────────────────────────
const FORM_FIELDS = [
  // [PASTE YOUR FIELDS HERE — example format below]
  // { id: "firstName", label: "First Name", type: "text", placeholder: "Enter first name…" },
  // { id: "lastName", label: "Last Name", type: "text", placeholder: "Enter last name…" },
  // { id: "age", label: "Age", type: "number", placeholder: "0" },
];

// ─── MAIN COMPONENT ───────────────────────────────
export default function [COMPONENT_NAME]() {
  const [formData, setFormData] = useState(
    FORM_FIELDS.reduce((acc, field) => ({ ...acc, [field.id]: "" }), {})
  );
  const [saved, setSaved] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    console.log("Saving data:", formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ padding: "20px 28px", maxWidth: "900px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "24px", marginBottom: "8px" }}>{SECTION_CONFIG.icon}</div>
        <h1 style={{ fontSize: "20px", fontWeight: "600", color: "#e8f0fe", marginBottom: "4px" }}>
          {SECTION_CONFIG.title}
        </h1>
        <p style={{ fontSize: "12px", color: "#4a6a8a" }}>{SECTION_CONFIG.description}</p>
      </div>

      {/* Form */}
      <div
        style={{
          background: "#081628",
          border: "1px solid #1a3555",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          {FORM_FIELDS.map((field) => (
            <div key={field.id} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label
                style={{
                  fontSize: "10px",
                  color: "#4a6a8a",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontWeight: "500",
                }}
              >
                {field.label}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  name={field.id}
                  value={formData[field.id]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  style={{
                    background: "#0e2544",
                    border: "1px solid #1a3555",
                    borderRadius: "6px",
                    padding: "10px",
                    color: "#e8f0fe",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "13px",
                    minHeight: "100px",
                    outline: "none",
                    transition: "border-color 0.15s",
                  }}
                />
              ) : (
                <input
                  type={field.type}
                  name={field.id}
                  value={formData[field.id]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  style={{
                    background: "#0e2544",
                    border: "1px solid #1a3555",
                    borderRadius: "6px",
                    padding: "10px",
                    color: "#e8f0fe",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "13px",
                    outline: "none",
                    transition: "border-color 0.15s",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleSave}
            style={{
              background: "#00e5c0",
              color: "#050f1e",
              border: "none",
              borderRadius: "6px",
              padding: "8px 16px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "filter 0.15s",
            }}
            onMouseEnter={(e) => (e.target.style.filter = "brightness(1.15)")}
            onMouseLeave={(e) => (e.target.style.filter = "none")}
          >
            {saved ? "✓ Saved" : "💾 Save"}
          </button>
          <button
            style={{
              background: "#0e2544",
              border: "1px solid #1a3555",
              borderRadius: "6px",
              padding: "8px 16px",
              fontSize: "12px",
              color: "#8aaccc",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = "#2a4f7a";
              e.target.style.color = "#e8f0fe";
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = "#1a3555";
              e.target.style.color = "#8aaccc";
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div
        style={{
          background: "#0b1e36",
          border: "1px solid #1a3555",
          borderRadius: "12px",
          padding: "14px 16px",
        }}
      >
        <p style={{ fontSize: "12px", color: "#8aaccc", margin: 0 }}>
          💡 Fill in the fields above and click Save to continue. Data is stored locally until the full chart is completed.
        </p>
      </div>
    </div>
  );
}