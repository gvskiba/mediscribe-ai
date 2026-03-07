import React, { useState, useEffect } from "react";
import { Copy, CheckCircle, PenLine, RotateCcw, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";

const T = {
  navy: "#050f1e", panel: "#0d2240", edge: "#162d4f", border: "#1e3a5f",
  dim: "#4a7299", text: "#c8ddf0", bright: "#e8f4ff", teal: "#00d4bc",
  amber: "#f5a623", green: "#2ecc71", purple: "#9b6dff", red: "#ff5c6c",
};

const STATUS_CONFIG = {
  draft:        { color: T.dim,    label: "Draft" },
  ai_generated: { color: T.purple, label: "AI Generated" },
  reviewed:     { color: T.amber,  label: "Reviewed" },
  signed:       { color: T.green,  label: "Signed" },
};

export default function NoteOutputPanel({ note, onNoteChange, onRegenerate, isGenerating, template }) {
  const [showSignModal, setShowSignModal] = useState(false);
  const [status, setStatus] = useState("draft");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (note && status === "draft") setStatus("ai_generated");
    if (!note) setStatus("draft");
  }, [note]);

  const handleCopy = () => {
    if (!note) return;
    navigator.clipboard.writeText(note);
    setCopied(true);
    toast.success("Note copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSign = () => {
    setStatus("signed");
    setShowSignModal(false);
    toast.success("Note signed successfully");
  };

  const wordCount = note ? note.trim().split(/\s+/).length : 0;
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;

  return (
    <div style={{ width: 320, flexShrink: 0, background: T.panel, borderLeft: `1px solid ${T.border}`, display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.bright }}>Note Output</span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
            background: `${statusCfg.color}18`, color: statusCfg.color, border: `1px solid ${statusCfg.color}40`,
          }}>{statusCfg.label}</span>
        </div>
        {note && (
          <div style={{ fontSize: 10, color: T.dim }}>
            {wordCount} words · {template?.name}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
        {isGenerating ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%", border: `3px solid ${T.border}`, borderTopColor: T.teal,
              animation: "spin 0.8s linear infinite",
            }} />
            <div style={{ fontSize: 13, color: T.dim, textAlign: "center" }}>
              Generating clinical note…<br />
              <span style={{ fontSize: 11, color: "#2a4d72" }}>This may take a few seconds</span>
            </div>
          </div>
        ) : note ? (
          <textarea
            value={note}
            onChange={e => onNoteChange(e.target.value)}
            style={{
              width: "100%", height: "100%", minHeight: 400, background: "transparent", border: "none",
              color: T.text, fontSize: 12, lineHeight: 1.7, resize: "none", outline: "none",
              fontFamily: "DM Sans, sans-serif",
            }}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 10, opacity: 0.5 }}>
            <FileText size={40} color={T.dim} />
            <div style={{ fontSize: 12, color: T.dim, textAlign: "center", lineHeight: 1.5 }}>
              Select a template, fill the required fields, and click<br />
              <strong style={{ color: T.teal }}>Generate Note with AI</strong>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {note && (
        <div style={{ padding: "12px 14px", borderTop: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button onClick={handleCopy} style={btnStyle(T.border, T.dim)}>
              {copied ? <><CheckCircle size={13} color={T.teal} /> Copied</> : <><Copy size={13} /> Copy</>}
            </button>
            <button onClick={onRegenerate} disabled={isGenerating} style={btnStyle(T.border, T.dim)}>
              <RotateCcw size={13} /> Regenerate
            </button>
          </div>
          {status !== "signed" && (
            <button onClick={() => setShowSignModal(true)} style={{
              width: "100%", padding: "10px 0", borderRadius: 8, fontSize: 12.5, fontWeight: 700,
              background: `linear-gradient(135deg, ${T.teal}, #00a896)`, border: "none",
              color: "#050f1e", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              <PenLine size={14} /> Sign Note
            </button>
          )}
          {status === "signed" && (
            <div style={{
              width: "100%", padding: "10px 0", borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: `${T.green}18`, border: `1px solid ${T.green}40`, color: T.green,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              <CheckCircle size={14} /> Note Signed
            </div>
          )}
        </div>
      )}

      {/* Sign Modal */}
      {showSignModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#0e2240", border: `1px solid ${T.border}`, borderRadius: 16,
            padding: 28, maxWidth: 440, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.bright, marginBottom: 12 }}>Sign Note</div>
            <div style={{ fontSize: 12, color: T.dim, lineHeight: 1.6, marginBottom: 20, padding: "12px 14px", background: "rgba(255,255,255,0.04)", borderRadius: 8, borderLeft: `3px solid ${T.teal}` }}>
              I attest that this note accurately reflects my clinical assessment and management of this patient on the date noted. AI-generated content has been reviewed and edited as appropriate.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowSignModal(false)} style={btnStyle(T.border, T.dim, true)}>
                Cancel
              </button>
              <button onClick={handleSign} style={{
                flex: 1, padding: "9px 0", borderRadius: 8, fontSize: 13, fontWeight: 700,
                background: `linear-gradient(135deg, ${T.teal}, #00a896)`, border: "none",
                color: "#050f1e", cursor: "pointer",
              }}>
                Sign Note
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function btnStyle(border, color, full = false) {
  return {
    flex: full ? 1 : undefined, width: full ? "100%" : undefined,
    padding: "8px 0", borderRadius: 8, fontSize: 12, fontWeight: 600,
    background: "rgba(255,255,255,0.04)", border: `1px solid ${border}`,
    color, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
    transition: "all 0.12s",
  };
}