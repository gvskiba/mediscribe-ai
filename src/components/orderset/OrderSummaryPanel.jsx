import React, { useState } from "react";
import { G, CAT_CFG, PRI_CFG } from "./orderSetData";
import { AlertTriangle, PenLine, Save, Sparkles } from "lucide-react";

export default function OrderSummaryPanel({
  condition, orders, user, aiLoading,
  onAISuggest, onSignClick, onSaveTemplate,
}) {
  const selected = orders.filter(o => o.selected);
  const statCount    = selected.filter(o => o.priority === "stat").length;
  const urgentCount  = selected.filter(o => o.priority === "urgent").length;
  const routineCount = selected.filter(o => o.priority === "routine").length;

  const required_deselected = orders.filter(o => o.required && !o.selected);
  const highAlerts = selected.filter(o => o.high_alert);

  const catCounts = Object.entries(CAT_CFG).map(([key, cfg]) => {
    const catOrders = orders.filter(o => o.cat === key);
    const sel = catOrders.filter(o => o.selected).length;
    return { key, cfg, sel, total: catOrders.length };
  }).filter(c => c.total > 0);

  return (
    <div style={{
      width: 280, flexShrink: 0, background: `linear-gradient(170deg,${G.slate},${G.navy})`,
      borderLeft: `1px solid ${G.border}`, display: "flex", flexDirection: "column",
      overflowY: "auto", height: "100%",
    }}>
      {/* Condition chip */}
      {condition && (
        <div style={{ padding: "12px 14px", borderBottom: `1px solid ${G.border}` }}>
          <div style={{ fontSize: 18, marginBottom: 3 }}>{condition.icon}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: G.bright }}>{condition.name}</div>
          <div style={{ fontSize: 10.5, color: G.dim, marginTop: 2 }}>{condition.guideline}</div>
        </div>
      )}

      {/* Stats */}
      <div style={{ padding: "12px 14px", borderBottom: `1px solid rgba(30,58,95,.5)` }}>
        <div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".09em", color: G.dim, marginBottom: 8 }}>
          Order Summary
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {[
            { label: "STAT",    count: statCount,    color: PRI_CFG.stat.color,    bg: PRI_CFG.stat.bg },
            { label: "URGENT",  count: urgentCount,  color: PRI_CFG.urgent.color,  bg: PRI_CFG.urgent.bg },
            { label: "ROUTINE", count: routineCount, color: PRI_CFG.routine.color, bg: PRI_CFG.routine.bg },
          ].map(item => (
            <div key={item.label} style={{
              flex: 1, padding: "6px 6px", borderRadius: 8,
              background: item.bg, border: `1px solid ${item.color}33`,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: item.color, lineHeight: 1 }}>{item.count}</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: item.color, marginTop: 2 }}>{item.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: G.dim }}>Total selected</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: G.teal }}>{selected.length}</span>
        </div>
      </div>

      {/* Category breakdown */}
      <div style={{ padding: "10px 14px", borderBottom: `1px solid rgba(30,58,95,.5)` }}>
        <div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".09em", color: G.dim, marginBottom: 8 }}>
          By Category
        </div>
        {catCounts.map(({ key, cfg, sel, total }) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
            <span style={{ fontSize: 13, width: 20 }}>{cfg.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 10.5, color: G.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cfg.label}</span>
                <span style={{ fontSize: 10, color: sel > 0 ? cfg.color : G.muted, fontWeight: 700 }}>{sel}/{total}</span>
              </div>
              <div style={{ height: 3, borderRadius: 2, background: `${cfg.color}22` }}>
                <div style={{ height: "100%", width: `${(sel / total) * 100}%`, background: cfg.color, borderRadius: 2, transition: "width .3s" }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Warnings */}
      {required_deselected.length > 0 && (
        <div style={{ margin: "10px 14px 0", padding: "10px 12px", background: "rgba(255,92,108,.07)", border: `1px solid rgba(255,92,108,.25)`, borderRadius: 9 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <AlertTriangle size={12} style={{ color: G.red, flexShrink: 0 }} />
            <span style={{ fontSize: 10.5, fontWeight: 700, color: G.red }}>Required Deselected ({required_deselected.length})</span>
          </div>
          {required_deselected.slice(0, 4).map(o => (
            <div key={o.id} style={{ fontSize: 10, color: G.text, marginBottom: 3 }}>• {o.name}</div>
          ))}
          {required_deselected.length > 4 && <div style={{ fontSize: 10, color: G.muted }}>+{required_deselected.length - 4} more…</div>}
        </div>
      )}
      {highAlerts.length > 0 && (
        <div style={{ margin: "8px 14px 0", padding: "8px 12px", background: "rgba(255,140,66,.07)", border: `1px solid rgba(255,140,66,.25)`, borderRadius: 9 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: G.orange, marginBottom: 4 }}>⚠ {highAlerts.length} High-Alert Med{highAlerts.length > 1 ? "s" : ""}</div>
          {highAlerts.map(o => <div key={o.id} style={{ fontSize: 10, color: G.text, marginBottom: 2 }}>• {o.name}</div>)}
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Signing physician */}
      <div style={{ padding: "12px 14px", borderTop: `1px solid ${G.border}` }}>
        <div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".09em", color: G.dim, marginBottom: 7 }}>
          Signing Physician
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%", background: `rgba(0,212,188,.12)`,
            border: `1px solid rgba(0,212,188,.3)`, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 14, flexShrink: 0,
          }}>👤</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: G.bright }}>
              {user?.full_name || "Physician"}
            </div>
            <div style={{ fontSize: 10, color: G.dim }}>{user?.email || ""}</div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: "0 12px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
        <button
          onClick={onAISuggest}
          disabled={aiLoading}
          style={{
            padding: "9px 14px", borderRadius: 8, fontFamily: "inherit", fontSize: 12.5, fontWeight: 700,
            background: aiLoading ? "rgba(155,109,255,.08)" : "rgba(155,109,255,.12)",
            border: `1px solid rgba(155,109,255,.3)`, color: G.purple,
            cursor: aiLoading ? "default" : "pointer", display: "flex", alignItems: "center", gap: 7,
            transition: "all .15s",
          }}
          onMouseEnter={e => { if (!aiLoading) e.currentTarget.style.background = "rgba(155,109,255,.2)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = aiLoading ? "rgba(155,109,255,.08)" : "rgba(155,109,255,.12)"; }}
        >
          <Sparkles size={14} />
          {aiLoading ? "AI Analyzing…" : "AI Suggest Orders"}
        </button>

        <button
          onClick={onSaveTemplate}
          style={{
            padding: "9px 14px", borderRadius: 8, fontFamily: "inherit", fontSize: 12.5, fontWeight: 700,
            background: "transparent", border: `1px solid ${G.border}`, color: G.text,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 7, transition: "all .15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = G.dim; e.currentTarget.style.color = G.bright; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.color = G.text; }}
        >
          <Save size={14} /> Save as Template
        </button>

        <button
          onClick={onSignClick}
          disabled={selected.length === 0}
          style={{
            padding: "11px 14px", borderRadius: 9, fontFamily: "inherit", fontSize: 13.5, fontWeight: 800,
            background: selected.length > 0
              ? `linear-gradient(135deg,${G.teal},#00a896)`
              : `rgba(0,212,188,.05)`,
            border: `1px solid ${selected.length > 0 ? "transparent" : "rgba(0,212,188,.2)"}`,
            color: selected.length > 0 ? G.navy : "rgba(0,212,188,.4)",
            cursor: selected.length > 0 ? "pointer" : "default",
            display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
            transition: "all .15s",
          }}
        >
          <PenLine size={15} />
          Sign {selected.length > 0 ? `${selected.length} Orders` : "Orders"}
        </button>
      </div>
    </div>
  );
}