import React, { useState } from "react";
import { G } from "./orderSetData";
import { X, Save } from "lucide-react";

export default function SaveTemplateModal({ condition, orders, onSave, onClose }) {
  const [name, setName] = useState(condition ? `${condition.name} — Custom` : "");
  const [subtitle, setSubtitle] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim(), subtitle.trim());
    setSaving(false);
    onClose();
  }

  const selectedOrders = orders.filter(o => o.selected);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: `linear-gradient(160deg,${G.panel},${G.slate})`,
        border: `1px solid ${G.border}`, borderRadius: 14, width: "100%", maxWidth: 440,
        overflow: "hidden", boxShadow: "0 16px 48px rgba(0,0,0,.5)",
      }}>
        <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${G.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(240,192,64,.1)", border: "1px solid rgba(240,192,64,.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>📋</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: G.bright }}>Save as Institution Template</div>
            <div style={{ fontSize: 10.5, color: G.dim }}>{selectedOrders.length} selected orders will be saved</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,92,108,.08)", border: "1px solid rgba(255,92,108,.25)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: G.red }}>
            <X size={12} />
          </button>
        </div>
        <div style={{ padding: "16px 20px" }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10.5, fontWeight: 700, color: G.dim, display: "block", marginBottom: 5 }}>TEMPLATE NAME *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              style={{
                width: "100%", background: "rgba(11,29,53,.6)", border: `1px solid ${G.border}`,
                borderRadius: 8, padding: "9px 12px", fontFamily: "inherit", fontSize: 12.5,
                color: G.bright, outline: "none",
              }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10.5, fontWeight: 700, color: G.dim, display: "block", marginBottom: 5 }}>SUBTITLE (optional)</label>
            <input
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
              placeholder="Brief description…"
              style={{
                width: "100%", background: "rgba(11,29,53,.6)", border: `1px solid ${G.border}`,
                borderRadius: 8, padding: "9px 12px", fontFamily: "inherit", fontSize: 12.5,
                color: G.bright, outline: "none",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "9px", borderRadius: 8, fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, background: "transparent", border: `1px solid ${G.border}`, color: G.text, cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSave} disabled={!name.trim() || saving} style={{
              flex: 2, padding: "9px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, fontWeight: 800,
              background: name.trim() ? `linear-gradient(135deg,${G.gold},#c9a000)` : "rgba(240,192,64,.1)",
              border: "none", color: name.trim() ? G.navy : "rgba(240,192,64,.4)",
              cursor: name.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            }}>
              <Save size={13} /> {saving ? "Saving…" : "Save Template"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}