import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Download, FileText, Loader2, ChevronDown } from "lucide-react";

const T = {
  navy: "#050f1e",
  panel: "#0e2340",
  border: "#1e3a5f",
  dim: "#4a7299",
  text: "#c8ddf0",
  bright: "#e8f4ff",
  teal: "#00d4bc",
  teal2: "#00a896",
};

export default function ExportPDFButton({ note, noteId }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState(null);

  async function doExport(fmt) {
    setOpen(false);
    setLoading(true);
    setFormat(fmt);
    try {
      const response = await base44.functions.invoke("exportClinicalNote", {
        noteId,
        format: fmt,
      });

      const data = response.data;
      let blob;
      if (fmt === "pdf") {
        // response.data is an object with array values (ArrayBuffer serialized)
        const arr = Object.values(data);
        blob = new Blob([new Uint8Array(arr)], { type: "application/pdf" });
      } else {
        blob = new Blob([data], { type: "text/plain" });
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${note.patient_name || "note"}_${note.date_of_visit || "export"}.${fmt === "pdf" ? "pdf" : "txt"}`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setLoading(false);
      setFormat(null);
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "5px 13px",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          background: "transparent",
          border: `1px solid ${T.border}`,
          color: loading ? T.dim : T.text,
          cursor: loading ? "default" : "pointer",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.borderColor = T.teal;
            e.currentTarget.style.color = T.teal;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = T.border;
          e.currentTarget.style.color = loading ? T.dim : T.text;
        }}
      >
        {loading ? (
          <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
        ) : (
          <Download size={12} />
        )}
        {loading ? `Exporting ${format?.toUpperCase()}…` : "Export"}
        {!loading && <ChevronDown size={10} style={{ opacity: 0.6 }} />}
      </button>

      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 49 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              zIndex: 50,
              background: T.panel,
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              minWidth: 170,
              overflow: "hidden",
              boxShadow: "0 8px 28px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                padding: "6px 14px 5px",
                fontSize: 9.5,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: T.dim,
                borderBottom: `1px solid ${T.border}`,
              }}
            >
              Export Format
            </div>

            {[
              { fmt: "pdf", icon: "📄", label: "Professional PDF", sub: "Formatted for records" },
              { fmt: "text", icon: "📝", label: "Plain Text", sub: "Simple text file" },
            ].map(({ fmt, icon, label, sub }) => (
              <button
                key={fmt}
                onClick={() => doExport(fmt)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 14px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  borderBottom: `1px solid rgba(30,58,95,0.3)`,
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(0,212,188,0.06)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.bright }}>{label}</div>
                  <div style={{ fontSize: 10, color: T.dim, marginTop: 1 }}>{sub}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}