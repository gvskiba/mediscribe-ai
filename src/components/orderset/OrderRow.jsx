import React, { useState, useRef } from "react";
import { G, CAT_CFG, PRI_CFG, BADGES } from "./orderSetData";
import { Pencil, Check, X } from "lucide-react";

export default function OrderRow({ order, onToggle, onEdit, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(order.detail);
  const [hovered, setHovered] = useState(false);
  const taRef = useRef(null);

  function startEdit(e) {
    e.stopPropagation();
    setDraft(order.detail);
    setEditing(true);
    setTimeout(() => taRef.current?.focus(), 60);
  }
  function saveEdit(e) {
    e?.stopPropagation();
    onEdit(order.id, draft);
    setEditing(false);
  }
  function cancelEdit(e) {
    e?.stopPropagation();
    setEditing(false);
  }

  const pri = PRI_CFG[order.priority] || PRI_CFG.routine;
  const cat = CAT_CFG[order.cat] || {};
  const isSelected = order.selected;

  const activeBadges = [];
  if (order.required)     activeBadges.push("REQUIRED");
  if (order.high_alert)   activeBadges.push("HIGH ALERT");
  if (order.modified)     activeBadges.push("MODIFIED");
  if (order.ai_suggested) activeBadges.push("AI");
  else if (order.custom_added) activeBadges.push("CUSTOM");

  return (
    <div
      style={{
        background: isSelected
          ? `linear-gradient(90deg,rgba(0,212,188,.04),rgba(0,212,188,.01))`
          : "transparent",
        border: `1px solid ${isSelected ? "rgba(0,212,188,.22)" : "rgba(30,58,95,.5)"}`,
        borderRadius: 9,
        marginBottom: 5,
        transition: "all .12s",
        opacity: isSelected ? 1 : 0.65,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px",
          cursor: "pointer",
        }}
        onClick={() => !editing && onToggle(order.id)}
      >
        {/* Checkbox */}
        <div
          style={{
            width: 17, height: 17, borderRadius: 4, flexShrink: 0, marginTop: 2,
            border: `2px solid ${isSelected ? G.teal : G.muted}`,
            background: isSelected ? G.teal : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all .12s",
          }}
        >
          {isSelected && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="#050f1e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? G.bright : G.text }}>
              {order.name}
            </span>
            {/* Priority badge */}
            <span style={{
              fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 20,
              color: pri.color, background: pri.bg, border: `1px solid ${pri.color}44`,
            }}>{pri.label}</span>
            {/* Other badges */}
            {activeBadges.map(k => {
              const b = BADGES[k];
              return (
                <span key={k} style={{
                  fontSize: 8.5, fontWeight: 800, padding: "1px 6px", borderRadius: 20,
                  color: b.color, background: b.bg, border: `1px solid ${b.color}44`,
                }}>{b.label}</span>
              );
            })}
          </div>

          {/* Detail / edit */}
          {editing ? (
            <div onClick={e => e.stopPropagation()} style={{ marginTop: 6 }}>
              <textarea
                ref={taRef}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                rows={3}
                style={{
                  width: "100%", background: "rgba(11,29,53,.8)", border: `1px solid ${G.teal}66`,
                  borderRadius: 7, padding: "8px 10px", fontFamily: "monospace", fontSize: 11.5,
                  color: G.bright, lineHeight: 1.7, resize: "vertical", outline: "none",
                }}
              />
              <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
                <button onClick={saveEdit} style={{
                  display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
                  borderRadius: 6, background: G.teal, border: "none", color: G.navy,
                  fontSize: 11, fontWeight: 700, cursor: "pointer",
                }}>
                  <Check size={11} /> Save
                </button>
                <button onClick={cancelEdit} style={{
                  display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
                  borderRadius: 6, background: "transparent", border: `1px solid ${G.border}`,
                  color: G.dim, fontSize: 11, cursor: "pointer",
                }}>
                  <X size={11} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 11.5, color: G.dim, marginTop: 3, lineHeight: 1.6 }}>
              {order.detail}
            </div>
          )}

          {/* Guideline citation */}
          {order.guideline && !editing && (
            <div style={{ marginTop: 4, fontSize: 10, color: G.purple, opacity: .75 }}>
              📖 {order.guideline}
            </div>
          )}
        </div>

        {/* Hover actions */}
        {hovered && !editing && (
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            <button onClick={startEdit} style={{
              width: 24, height: 24, borderRadius: 6, background: "rgba(74,144,217,.12)",
              border: `1px solid rgba(74,144,217,.3)`, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", color: G.blue,
            }}>
              <Pencil size={11} />
            </button>
            {order.custom_added && (
              <button onClick={() => onRemove(order.id)} style={{
                width: 24, height: 24, borderRadius: 6, background: "rgba(255,92,108,.1)",
                border: `1px solid rgba(255,92,108,.3)`, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", color: G.red,
              }}>
                <X size={11} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}