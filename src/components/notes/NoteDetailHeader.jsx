import React from "react";
import { ChevronLeft, Printer, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

const T = {
  surface: "#0e1320",
  border: "#1a2236",
  border_2: "#243048",
  text: "#dde2ef",
  muted: "#4e5a78",
  dim: "#2d3a56",
  teal: "#00cca3",
};

export default function NoteDetailHeader({ note, status, onSave, onPrint }) {
  return (
    <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 22px", gap: "12px" }}>
        {/* Left: Back Button */}
        <Link
          to={createPageUrl("NotesLibrary")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "5px 10px",
            borderRadius: "6px",
            background: "transparent",
            border: "none",
            fontFamily: "Geist Mono",
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: T.muted,
            cursor: "pointer",
            textDecoration: "none",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = T.teal)}
          onMouseLeave={(e) => (e.currentTarget.style.color = T.muted)}
        >
          <ChevronLeft size={14} /> Notes
        </Link>

        {/* Center: Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, justifyContent: "center", minWidth: 0 }}>
          <span style={{ fontFamily: "Instrument Serif", fontSize: "16px", fontStyle: "italic", color: T.text }}>
            Provider Suite
          </span>
        </div>

        {/* Right: Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          {/* Status Badge */}
          <div
            style={{
              fontFamily: "Geist Mono",
              fontSize: "9px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "5px 10px",
              borderRadius: "5px",
              border: `1px solid ${T.border_2}`,
              color: status === "draft" ? "#f59e0b" : status === "signed" ? "#34d399" : "#a78bfa",
              background:
                status === "draft"
                  ? "rgba(245, 158, 11, 0.1)"
                  : status === "signed"
                    ? "rgba(52, 211, 153, 0.1)"
                    : "rgba(167, 139, 250, 0.1)",
            }}
          >
            {status === "draft" ? "Draft" : status === "signed" ? "Signed" : "Amended"}
          </div>

          {/* Print Button */}
          <button
            onClick={onPrint}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "6px",
              border: `1px solid ${T.border_2}`,
              background: "transparent",
              color: T.muted,
              fontFamily: "Geist Mono",
              fontSize: "9px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = T.teal;
              e.currentTarget.style.color = T.teal;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = T.border_2;
              e.currentTarget.style.color = T.muted;
            }}
          >
            <Printer size={13} /> Print
          </button>

          {/* Save Button */}
          <button
            onClick={onSave}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "6px",
              border: `1px solid ${T.teal}`,
              background: T.teal,
              color: "#080b10",
              fontFamily: "Geist Mono",
              fontSize: "9px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#00efd8";
              e.currentTarget.style.borderColor = "#00efd8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = T.teal;
              e.currentTarget.style.borderColor = T.teal;
            }}
          >
            <Save size={13} /> Save Note
          </button>
        </div>
      </div>
    </div>
  );
}