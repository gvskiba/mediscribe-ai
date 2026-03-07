import React, { useState } from "react";
import { G, CAT_CFG } from "./orderSetData";
import OrderRow from "./OrderRow";
import { Plus, ChevronDown, ChevronRight } from "lucide-react";

export default function CategorySection({ cat, orders, onToggle, onEdit, onRemove, onAddCustom }) {
  const [open, setOpen] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDetail, setCustomDetail] = useState("");

  const cfg = CAT_CFG[cat] || { icon: "📋", label: cat, color: G.teal };
  const selectedCount = orders.filter(o => o.selected).length;
  const total = orders.length;

  function handleBulkToggle(e) {
    e.stopPropagation();
    const allSelected = orders.every(o => o.selected);
    orders.forEach(o => { if (allSelected !== !o.selected) onToggle(o.id); });
    if (allSelected) orders.forEach(o => { if (o.selected) onToggle(o.id); });
    else orders.forEach(o => { if (!o.selected) onToggle(o.id); });
  }

  function submitCustom() {
    if (!customName.trim()) return;
    onAddCustom(cat, customName.trim(), customDetail.trim());
    setCustomName(""); setCustomDetail(""); setShowAdd(false);
  }

  const allSelected = orders.every(o => o.selected);
  const someSelected = orders.some(o => o.selected) && !allSelected;

  return (
    <div style={{ marginBottom: 12, background: G.panel, border: `1px solid ${G.border}`, borderRadius: 12, overflow: "hidden" }}>
      {/* Category header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
          cursor: "pointer", background: `linear-gradient(90deg,${cfg.color}0d,transparent)`,
          borderBottom: open ? `1px solid rgba(30,58,95,.5)` : "none",
          userSelect: "none",
        }}
      >
        {/* Bulk checkbox */}
        <div
          onClick={handleBulkToggle}
          style={{
            width: 16, height: 16, borderRadius: 4, flexShrink: 0,
            border: `2px solid ${allSelected ? cfg.color : someSelected ? cfg.color : G.muted}`,
            background: allSelected ? cfg.color : someSelected ? `${cfg.color}55` : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "all .12s",
          }}
        >
          {allSelected && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="#050f1e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          {someSelected && !allSelected && <div style={{ width: 7, height: 2, background: cfg.color, borderRadius: 1 }} />}
        </div>
        <span style={{ fontSize: 18, flexShrink: 0 }}>{cfg.icon}</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: G.bright }}>{cfg.label}</span>
        <span style={{ fontSize: 11, color: cfg.color, fontWeight: 700 }}>{selectedCount}/{total}</span>
        <div style={{
          width: 50, height: 4, borderRadius: 2, background: `${cfg.color}22`,
          overflow: "hidden",
        }}>
          <div style={{ height: "100%", width: `${(selectedCount/total)*100}%`, background: cfg.color, borderRadius: 2, transition: "width .3s" }} />
        </div>
        {open ? <ChevronDown size={13} style={{ color: G.dim, flexShrink: 0 }} /> : <ChevronRight size={13} style={{ color: G.dim, flexShrink: 0 }} />}
      </div>

      {/* Orders */}
      {open && (
        <div style={{ padding: "10px 12px 6px" }}>
          {orders.map(o => (
            <OrderRow key={o.id} order={o} onToggle={onToggle} onEdit={onEdit} onRemove={onRemove} />
          ))}

          {/* Add custom */}
          {showAdd ? (
            <div style={{ marginTop: 6, padding: "10px 12px", background: "rgba(11,29,53,.5)", border: `1px dashed ${cfg.color}55`, borderRadius: 9 }}>
              <input
                placeholder="Order name…"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                autoFocus
                style={{
                  width: "100%", background: "rgba(22,45,79,.5)", border: `1px solid ${G.border}`,
                  borderRadius: 7, padding: "7px 10px", color: G.bright, fontFamily: "inherit", fontSize: 12,
                  marginBottom: 6, outline: "none",
                }}
              />
              <textarea
                placeholder="Order detail / dose / frequency…"
                value={customDetail}
                onChange={e => setCustomDetail(e.target.value)}
                rows={2}
                style={{
                  width: "100%", background: "rgba(22,45,79,.5)", border: `1px solid ${G.border}`,
                  borderRadius: 7, padding: "7px 10px", color: G.text, fontFamily: "monospace", fontSize: 11,
                  marginBottom: 8, outline: "none", resize: "vertical", lineHeight: 1.6,
                }}
              />
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={submitCustom} style={{
                  padding: "5px 12px", borderRadius: 6, background: cfg.color, border: "none",
                  color: G.navy, fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, cursor: "pointer",
                }}>+ Add</button>
                <button onClick={() => setShowAdd(false)} style={{
                  padding: "5px 12px", borderRadius: 6, background: "transparent", border: `1px solid ${G.border}`,
                  color: G.dim, fontFamily: "inherit", fontSize: 11.5, cursor: "pointer",
                }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              style={{
                width: "100%", padding: "7px 12px", background: "transparent",
                border: `1px dashed ${cfg.color}44`, borderRadius: 8, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6, marginTop: 4, marginBottom: 4,
                color: cfg.color, opacity: .7, fontFamily: "inherit", fontSize: 11.5, transition: "opacity .12s",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "1"}
              onMouseLeave={e => e.currentTarget.style.opacity = ".7"}
            >
              <Plus size={13} /> Add custom {cfg.label.toLowerCase()} order
            </button>
          )}
        </div>
      )}
    </div>
  );
}