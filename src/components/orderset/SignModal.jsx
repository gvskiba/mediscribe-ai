import React, { useState } from "react";
import { G, PRI_CFG, CAT_CFG } from "./orderSetData";
import { PenLine, X } from "lucide-react";

export default function SignModal({ condition, orders, user, onSign, onClose }) {
  const [note, setNote] = useState("");
  const [signing, setSigning] = useState(false);

  const selected = orders.filter(o => o.selected);
  const statCount    = selected.filter(o => o.priority === "stat").length;
  const urgentCount  = selected.filter(o => o.priority === "urgent").length;
  const routineCount = selected.filter(o => o.priority === "routine").length;

  async function handleSign() {
    setSigning(true);
    await onSign(note);
    setSigning(false);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,.72)", display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <div style={{
        background: `linear-gradient(160deg,${G.panel},${G.slate})`,
        border: `1px solid ${G.border}`, borderRadius: 16,
        width: "100%", maxWidth: 580, maxHeight: "90vh",
        display: "flex", flexDirection: "column", overflow: "hidden",
        boxShadow: "0 24px 64px rgba(0,0,0,.6)",
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 22px 14px", borderBottom: `1px solid ${G.border}`,
          display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "rgba(0,212,188,.1)", border: "1px solid rgba(0,212,188,.25)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>✍️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: G.bright }}>Sign Order Set</div>
            <div style={{ fontSize: 11, color: G.dim }}>{condition?.name} · {selected.length} orders</div>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 7, background: "rgba(255,92,108,.08)",
            border: "1px solid rgba(255,92,108,.25)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", color: G.red,
          }}>
            <X size={14} />
          </button>
        </div>

        {/* Summary counts */}
        <div style={{ padding: "14px 22px", borderBottom: `1px solid rgba(30,58,95,.5)`, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { label: "STAT",    count: statCount,    ...PRI_CFG.stat },
              { label: "URGENT",  count: urgentCount,  ...PRI_CFG.urgent },
              { label: "ROUTINE", count: routineCount, ...PRI_CFG.routine },
            ].map(item => (
              <div key={item.label} style={{
                flex: 1, padding: "10px 8px", borderRadius: 9,
                background: item.bg, border: `1px solid ${item.color}33`, textAlign: "center",
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: item.color, lineHeight: 1 }}>{item.count}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: item.color, marginTop: 3 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Order preview list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 22px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: G.dim, marginBottom: 8 }}>
            Orders to Sign
          </div>
          {selected.map((o, i) => {
            const cat = CAT_CFG[o.cat] || {};
            const pri = PRI_CFG[o.priority] || PRI_CFG.routine;
            return (
              <div key={o.id} style={{
                display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 10px",
                background: i % 2 === 0 ? "rgba(22,45,79,.4)" : "transparent",
                borderRadius: 7, marginBottom: 3,
              }}>
                <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{cat.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: G.bright }}>{o.name}</span>
                    <span style={{ fontSize: 8.5, fontWeight: 800, padding: "1px 5px", borderRadius: 20, color: pri.color, background: pri.bg }}>{pri.label}</span>
                    {o.high_alert && <span style={{ fontSize: 8.5, fontWeight: 800, padding: "1px 5px", borderRadius: 20, color: G.orange, background: "rgba(255,140,66,.12)" }}>HIGH ALERT</span>}
                  </div>
                  <div style={{ fontSize: 10.5, color: G.dim, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.detail}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Signature note + physician */}
        <div style={{ padding: "12px 22px", borderTop: `1px solid rgba(30,58,95,.5)`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", background: "rgba(0,212,188,.1)",
              border: "1px solid rgba(0,212,188,.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
            }}>👤</div>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: G.bright }}>{user?.full_name || "Physician"}</span>
              <span style={{ fontSize: 10.5, color: G.dim, marginLeft: 6 }}>{new Date().toLocaleString()}</span>
            </div>
          </div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Optional signature note or clinical comment…"
            rows={2}
            style={{
              width: "100%", background: "rgba(11,29,53,.6)", border: `1px solid ${G.border}`,
              borderRadius: 9, padding: "9px 12px", fontFamily: "inherit", fontSize: 12,
              color: G.bright, lineHeight: 1.65, resize: "none", outline: "none", marginBottom: 10,
            }}
          />
          <div style={{ fontSize: 10, color: G.muted, lineHeight: 1.6, marginBottom: 12, padding: "8px 10px", background: "rgba(255,92,108,.04)", border: "1px solid rgba(255,92,108,.15)", borderRadius: 7 }}>
            ⚖️ By signing, you confirm you have reviewed all selected orders, they are clinically appropriate for this patient, and you accept clinical and legal responsibility for their execution. This action is time-stamped and recorded in the audit log.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} style={{
              flex: 1, padding: "10px", borderRadius: 9, fontFamily: "inherit", fontSize: 13, fontWeight: 700,
              background: "transparent", border: `1px solid ${G.border}`, color: G.text, cursor: "pointer",
            }}>Cancel</button>
            <button onClick={handleSign} disabled={signing} style={{
              flex: 2, padding: "10px", borderRadius: 9, fontFamily: "inherit", fontSize: 14, fontWeight: 800,
              background: signing ? "rgba(0,212,188,.3)" : `linear-gradient(135deg,${G.teal},#00a896)`,
              border: "none", color: G.navy, cursor: signing ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <PenLine size={16} />
              {signing ? "Signing…" : `Sign ${selected.length} Orders`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}