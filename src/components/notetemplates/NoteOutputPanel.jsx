import React, { useState } from "react";
import { Copy, RefreshCw, CheckCircle, Loader2, FileSignature } from "lucide-react";
import { toast } from "sonner";

const T = {
  navy: "#050f1e", panel: "#0d2240", edge: "#162d4f", border: "#1e3a5f",
  dim: "#4a7299", text: "#c8ddf0", bright: "#e8f4ff", teal: "#00d4bc", amber: "#f5a623",
};

const STATUS = {
  draft:        { color: "#4a7299", label: "Draft" },
  ai_generated: { color: "#9b6dff", label: "AI Generated" },
  reviewed:     { color: "#f5a623", label: "Reviewed" },
  signed:       { color: "#2ecc71", label: "Signed" },
};

export default function NoteOutputPanel({ note, onNoteChange, onRegenerate, isGenerating, template }) {
  const [status, setStatus] = useState("draft");
  const [showSignModal, setShowSignModal] = useState(false);
  const [signatureNote, setSignatureNote] = useState("");

  const handleCopy = () => {
    if (!note) return;
    navigator.clipboard.writeText(note);
    toast.success("Note copied to clipboard");
  };

  const handleSign = () => {
    setStatus("signed");
    setShowSignModal(false);
    toast.success("Note signed and attested");
  };

  const st = STATUS[status] || STATUS.draft;

  return (
    <div style={{
      width: 380, flexShrink: 0, background: T.panel, borderLeft: `1px solid ${T.border}`,
      display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.bright }}>📄 Generated Note</div>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
            background: `${st.color}20`, color: st.color, border: `1px solid ${st.color}40`,
          }}>{st.label}</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <ActionButton onClick={handleCopy} disabled={!note} icon={<Copy size={12} />} label="Copy" />
          <ActionButton onClick={onRegenerate} disabled={isGenerating || !template} icon={<RefreshCw size={12} />} label="Regenerate" />
          <ActionButton onClick={() => setShowSignModal(true)} disabled={!note || status === "signed"} icon={<FileSignature size={12} />} label="Sign" accent />
        </div>
      </div>

      {/* Note content */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {isGenerating ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
            <Loader2 size={28} color={T.teal} style={{ animation: "spin 1s linear infinite" }} />
            <div style={{ fontSize: 13, color: T.dim }}>AI is generating your note…</div>
          </div>
        ) : note ? (
          <textarea
            value={note}
            onChange={e => onNoteChange(e.target.value)}
            style={{
              width: "100%", height: "100%", padding: "16px", background: "transparent",
              border: "none", outline: "none", resize: "none", fontSize: 12.5, lineHeight: 1.7,
              color: T.text, fontFamily: "DM Sans, sans-serif", boxSizing: "border-box",
            }}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 10, padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 32 }}>✨</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.dim }}>Your AI-generated note will appear here</div>
            <div style={{ fontSize: 11, color: T.dim, lineHeight: 1.5 }}>
              Fill in the required fields and click "Generate Note with AI"
            </div>
          </div>
        )}
      </div>

      {/* Sign Modal */}
      {showSignModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 999, background: "rgba(5,15,30,0.85)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
          <div style={{ width: "100%", maxWidth: 440, background: T.navy, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.bright, marginBottom: 6 }}>Sign & Attest Note</div>
            <div style={{ fontSize: 12, color: T.dim, marginBottom: 16, lineHeight: 1.5 }}>
              By signing, you attest that this note accurately reflects the clinical encounter and meets documentation standards.
            </div>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.dim, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              Signature Note (optional)
            </label>
            <textarea
              value={signatureNote}
              onChange={e => setSignatureNote(e.target.value)}
              placeholder="Electronically signed by…"
              rows={3}
              style={{
                width: "100%", padding: "8px 10px", background: "rgba(255,255,255,0.06)",
                border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, color: T.bright,
                outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "DM Sans, sans-serif",
              }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowSignModal(false)}
                style={{ padding: "8px 18px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, color: T.text, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button type="button" onClick={handleSign}
                style={{ padding: "8px 20px", borderRadius: 8, background: "linear-gradient(135deg, #2ecc71, #27ae60)", border: "none", color: "#050f1e", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle size={13} /> Sign Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionButton({ onClick, disabled, icon, label, accent }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7,
        fontSize: 11, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        background: accent ? (disabled ? "rgba(255,255,255,0.05)" : "rgba(46,204,113,0.15)") : "rgba(255,255,255,0.05)",
        border: `1px solid ${accent ? (disabled ? T.border : "#2ecc71") : T.border}`,
        color: disabled ? T.dim : (accent ? "#2ecc71" : T.text),
        opacity: disabled ? 0.5 : 1, transition: "all 0.15s",
      }}
    >
      {icon} {label}
    </button>
  );
}