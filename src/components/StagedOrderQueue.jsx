import { useState } from "react";

const CATEGORIES = [
  "Labs", "Imaging", "Medications", "Consults",
  "Procedures", "Nursing", "Disposition"
];

const CAT = {
  Labs:        { bg: "rgba(59,130,246,0.14)",  bd: "rgba(59,130,246,0.35)",  tx: "#93c5fd" },
  Imaging:     { bg: "rgba(139,92,246,0.14)",  bd: "rgba(139,92,246,0.35)",  tx: "#c4b5fd" },
  Medications: { bg: "rgba(16,185,129,0.14)",  bd: "rgba(16,185,129,0.35)",  tx: "#6ee7b7" },
  Consults:    { bg: "rgba(245,158,11,0.14)",  bd: "rgba(245,158,11,0.35)",  tx: "#fcd34d" },
  Procedures:  { bg: "rgba(239,68,68,0.14)",   bd: "rgba(239,68,68,0.35)",   tx: "#fca5a5" },
  Nursing:     { bg: "rgba(20,184,166,0.14)",  bd: "rgba(20,184,166,0.35)",  tx: "#5eead4" },
  Disposition: { bg: "rgba(249,115,22,0.14)",  bd: "rgba(249,115,22,0.35)",  tx: "#fdba74" },
};

const TRIGGERS = [
  "Lab result review",
  "Troponin elevated",
  "Troponin negative x2",
  "Creatinine > 2.0",
  "Lactate > 2.0",
  "WBC elevated",
  "Lipase elevated",
  "CT result review",
  "X-ray result review",
  "Vital sign change",
  "Clinical reassessment",
  "Consult recommendation",
  "Nursing assessment",
  "On disposition decision",
  "Custom",
];

function nowTime() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: true
  });
}

function OrderChip({ order, onRemove, showTime = false }) {
  const c = CAT[order.category] || CAT.Labs;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      background: c.bg, border: `1px solid ${c.bd}`,
      borderRadius: "6px", padding: "4px 10px",
      fontSize: "12px", color: c.tx,
      margin: "3px", lineHeight: 1.3,
    }}>
      <span style={{ fontSize: "9px", opacity: 0.65, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {order.category}
      </span>
      <span style={{ color: "#e2e8f0" }}>{order.text}</span>
      {showTime && order.addedAt && (
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "#f59e0b", opacity: 0.7 }}>
          {order.addedAt}
        </span>
      )}
      {onRemove && (
        <span
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{ cursor: "pointer", opacity: 0.45, marginLeft: "2px", fontSize: "11px" }}
        >
          ✕
        </span>
      )}
    </span>
  );
}

export default function StagedOrderQueue({ embedded = false, onPhasesChange }) {
  const updatePhases = (updater) => {
    setPhases(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (onPhasesChange) onPhasesChange(next);
      return next;
    });
  };

  const [phases, setPhases] = useState([
    {
      id: 1,
      label: "Phase 1 — Initial Orders",
      trigger: "On arrival",
      status: "active",
      firedAt: nowTime(),
      orders: [],
      note: "",
    },
  ]);

  const [addOrderFor, setAddOrderFor] = useState(null);
  const [orderForm, setOrderForm] = useState({ text: "", category: "Labs" });
  const [showAddPhase, setShowAddPhase] = useState(false);
  const [phaseForm, setPhaseForm] = useState({ label: "", trigger: "", note: "" });
  const [showNurse, setShowNurse] = useState(false);
  const [firedId, setFiredId] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);

  const addPhase = () => {
    if (!phaseForm.label) return;
    const id = Date.now();
    updatePhases(prev => [...prev, {
      id,
      label: phaseForm.label,
      trigger: phaseForm.trigger,
      note: phaseForm.note,
      status: "staged",
      firedAt: null,
      orders: [],
    }]);
    setPhaseForm({ label: "", trigger: "", note: "" });
    setShowAddPhase(false);
  };

  const firePhase = (id) => {
    const t = nowTime();
    updatePhases(prev => prev.map(p =>
      p.id === id ? { ...p, status: "active", firedAt: t } : p
    ));
    setFiredId(id);
    setTimeout(() => setFiredId(null), 3000);
  };

  const removePhase = (id) => {
    updatePhases(prev => prev.filter(p => p.id !== id));
  };

  const addOrder = (phaseId) => {
    if (!orderForm.text.trim()) return;
    updatePhases(prev => prev.map(p =>
      p.id === phaseId
        ? { ...p, orders: [...p.orders, { id: Date.now(), ...orderForm, text: orderForm.text.trim(), addedAt: nowTime() }] }
        : p
    ));
    setOrderForm({ text: "", category: "Labs" });
    setAddOrderFor(null);
  };

  const removeOrder = (phaseId, orderId) => {
    updatePhases(prev => prev.map(p =>
      p.id === phaseId
        ? { ...p, orders: p.orders.filter(o => o.id !== orderId) }
        : p
    ));
  };

  const totalActive   = phases.filter(p => p.status === "active").reduce((n, p) => n + p.orders.length, 0);
  const totalStaged   = phases.filter(p => p.status === "staged").reduce((n, p) => n + p.orders.length, 0);
  const pendingPhases = phases.filter(p => p.status === "staged").length;
  const allActive     = phases.filter(p => p.status === "active").flatMap(p => p.orders.map(o => ({ ...o, phaseLabel: p.label })));
  const allStaged     = phases.filter(p => p.status === "staged").flatMap(p => p.orders.map(o => ({ ...o, phaseLabel: p.label, trigger: p.trigger })));

  const wrap = {
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    background: embedded ? "transparent" : "linear-gradient(160deg, #0d1b2e 0%, #091422 100%)",
    minHeight: embedded ? "auto" : "100vh",
    color: "#e2e8f0",
    padding: embedded ? "0" : "1.5rem",
  };

  const pCard = (status) => ({
    background: status === "active" ? "rgba(20,184,166,0.04)" : "rgba(245,158,11,0.03)",
    border: `1px solid ${status === "active" ? "rgba(20,184,166,0.18)" : "rgba(245,158,11,0.15)"}`,
    borderLeft: `3px solid ${status === "active" ? "#14b8a6" : "#f59e0b"}`,
    borderRadius: "12px",
    padding: "1.1rem 1.25rem",
    marginBottom: "0.65rem",
  });

  const pBadge = (status) => ({
    background: status === "active" ? "rgba(20,184,166,0.18)" : "rgba(245,158,11,0.15)",
    border: `1px solid ${status === "active" ? "rgba(20,184,166,0.4)" : "rgba(245,158,11,0.35)"}`,
    color: status === "active" ? "#14b8a6" : "#f59e0b",
    borderRadius: "20px", padding: "2px 9px",
    fontSize: "10px", fontWeight: "800",
    textTransform: "uppercase", letterSpacing: "0.07em",
  });

  const btn = (v) => ({
    background:
      v === "teal"  ? "rgba(20,184,166,0.14)"
      : v === "gold" ? "rgba(245,158,11,0.14)"
      : v === "fire" ? "rgba(245,158,11,0.18)"
      : v === "red"  ? "rgba(239,68,68,0.1)"
      : "rgba(255,255,255,0.05)",
    border:
      v === "teal"  ? "1px solid rgba(20,184,166,0.4)"
      : v === "gold" ? "1px solid rgba(245,158,11,0.4)"
      : v === "fire" ? "1px solid rgba(245,158,11,0.5)"
      : v === "red"  ? "1px solid rgba(239,68,68,0.3)"
      : "1px solid rgba(255,255,255,0.09)",
    color:
      v === "teal" ? "#14b8a6"
      : v === "gold" || v === "fire" ? "#f59e0b"
      : v === "red" ? "#f87171"
      : "#94a3b8",
    borderRadius: "8px", padding: "6px 13px",
    fontSize: "12px", fontWeight: "600",
    cursor: "pointer", whiteSpace: "nowrap",
  });

  const statCard = (color) => ({
    background: `rgba(${color},0.07)`,
    border: `1px solid rgba(${color},0.18)`,
    borderRadius: "10px", padding: "0.75rem 1rem",
    flex: 1, minWidth: 0,
  });

  const inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px", padding: "7px 12px",
    color: "#e2e8f0", fontSize: "13px",
    boxSizing: "border-box", outline: "none", fontFamily: "inherit",
  };

  const selectStyle = { ...inputStyle, background: "#0b1a2f", cursor: "pointer" };

  const labelStyle = {
    display: "block", fontSize: "10px", fontWeight: "700",
    textTransform: "uppercase", letterSpacing: "0.08em",
    color: "#4b5e78", marginBottom: "4px",
  };

  return (
    <div style={wrap}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.1rem", gap: "8px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "38px", height: "38px", borderRadius: "10px",
            background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.28)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
          }}>
            <svg width="18" height="18" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </div>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.35rem", fontWeight: "700", color: "#f1f5f9", margin: 0, lineHeight: 1.2 }}>
              Staged Order Queue
            </h2>
            <div style={{ fontSize: "11px", color: "#4b5e78", marginTop: "2px" }}>
              Anticipatory phased order management
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button style={btn("default")} onClick={() => setShowTimeline(!showTimeline)}>
            {showTimeline ? "Hide Timeline" : "Timeline"}
          </button>
          <button style={btn("default")} onClick={() => setShowNurse(!showNurse)}>
            {showNurse ? "Hide" : "Nurse View"}
          </button>
          <button style={btn("gold")} onClick={() => { setPhaseForm({ label: "", trigger: "", note: "" }); setShowAddPhase(!showAddPhase); }}>
            + Add Phase
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "0.65rem", marginBottom: "1.1rem" }}>
        <div style={statCard("20,184,166")}>
          <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#14b8a6", lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>{totalActive}</div>
          <div style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", color: "#4b5e78", marginTop: "3px" }}>Active Orders</div>
        </div>
        <div style={statCard("245,158,11")}>
          <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#f59e0b", lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>{totalStaged}</div>
          <div style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", color: "#4b5e78", marginTop: "3px" }}>Staged Orders</div>
        </div>
        <div style={statCard("148,163,184")}>
          <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#94a3b8", lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>{pendingPhases}</div>
          <div style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", color: "#4b5e78", marginTop: "3px" }}>Pending Phases</div>
        </div>
      </div>

      {/* Fired banner */}
      {firedId && (
        <div style={{
          background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
          borderRadius: "8px", padding: "8px 16px", marginBottom: "0.75rem",
          fontSize: "13px", color: "#10b981", textAlign: "center", fontWeight: "600"
        }}>
          ✓ Phase fired — orders are now active. Notify nursing.
        </div>
      )}

      {/* Add Phase form */}
      {showAddPhase && (
        <div style={{
          background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: "12px", padding: "1.1rem 1.25rem", marginBottom: "0.85rem"
        }}>
          <div style={{ fontSize: "11px", fontWeight: "800", color: "#f59e0b", letterSpacing: "0.06em", marginBottom: "0.85rem", textTransform: "uppercase" }}>
            New Order Phase
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div>
              <label style={labelStyle}>Phase Name *</label>
              <input style={inputStyle}
                placeholder="e.g., Phase 2 — Lab Driven Orders"
                value={phaseForm.label}
                onChange={e => setPhaseForm(f => ({ ...f, label: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStyle}>Fire Trigger</label>
              <select style={{ ...selectStyle, width: "100%" }}
                value={phaseForm.trigger}
                onChange={e => setPhaseForm(f => ({ ...f, trigger: e.target.value }))}
              >
                <option value="">Select trigger...</option>
                {TRIGGERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={labelStyle}>Clinical Note (optional)</label>
            <input style={inputStyle}
              placeholder="e.g., Fire after troponin returns — add serial troponins + echo if positive"
              value={phaseForm.note}
              onChange={e => setPhaseForm(f => ({ ...f, note: e.target.value }))}
            />
          </div>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button style={btn("default")} onClick={() => setShowAddPhase(false)}>Cancel</button>
            <button style={{ ...btn("gold"), opacity: !phaseForm.label ? 0.4 : 1 }} onClick={addPhase} disabled={!phaseForm.label}>
              Add Phase
            </button>
          </div>
        </div>
      )}

      {/* Phase cards */}
      {phases.map((phase) => (
        <div key={phase.id} style={pCard(phase.status)}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "0.65rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={pBadge(phase.status)}>{phase.status === "active" ? "● Active" : "○ Staged"}</span>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#e2e8f0" }}>{phase.label}</span>
              {phase.trigger && (
                <span style={{ fontSize: "10px", color: "#64748b", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "5px", padding: "2px 7px" }}>
                  ⚡ {phase.trigger}
                </span>
              )}
              {phase.firedAt && (
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "#f59e0b" }}>{phase.firedAt}</span>
              )}
            </div>
            <div style={{ display: "flex", gap: "5px" }}>
              {phase.status === "staged" && (
                <button style={btn("fire")} onClick={() => firePhase(phase.id)}>▶ Fire Phase</button>
              )}
              <button style={btn("teal")} onClick={() => setAddOrderFor(addOrderFor === phase.id ? null : phase.id)}>
                + Order
              </button>
              {phase.id !== phases[0].id && (
                <button style={btn("red")} onClick={() => removePhase(phase.id)}>✕</button>
              )}
            </div>
          </div>

          {phase.note && (
            <div style={{ fontSize: "12px", color: "#64748b", fontStyle: "italic", marginBottom: "0.5rem", paddingLeft: "4px" }}>
              {phase.note}
            </div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", minHeight: "30px", alignItems: "flex-start" }}>
            {phase.orders.length === 0 ? (
              <span style={{ fontSize: "12px", color: "#334155", fontStyle: "italic", padding: "4px 0" }}>
                No orders in this phase yet — tap + Order to add
              </span>
            ) : (
              phase.orders.map(o => (
                <OrderChip key={o.id} order={o} onRemove={() => removeOrder(phase.id, o.id)} />
              ))
            )}
          </div>

          {addOrderFor === phase.id && (
            <div style={{ marginTop: "0.65rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", padding: "0.75rem" }}>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "180px" }}>
                  <label style={labelStyle}>Order Text</label>
                  <input
                    style={inputStyle}
                    placeholder="e.g., Troponin high-sensitivity, CBC w/ diff..."
                    value={orderForm.text}
                    onChange={e => setOrderForm(f => ({ ...f, text: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && addOrder(phase.id)}
                    autoFocus
                  />
                </div>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select style={selectStyle} value={orderForm.category} onChange={e => setOrderForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <button style={btn("teal")} onClick={() => addOrder(phase.id)}>Add</button>
                <button style={btn("default")} onClick={() => setAddOrderFor(null)}>✕</button>
              </div>
              <div style={{ fontSize: "10px", color: "#334155", marginTop: "5px" }}>Press Enter to add quickly</div>
            </div>
          )}
        </div>
      ))}

      {/* Nurse Summary Panel */}
      {showNurse && (
        <div style={{ background: "rgba(20,184,166,0.04)", border: "1px solid rgba(20,184,166,0.18)", borderRadius: "12px", padding: "1.1rem 1.25rem", marginTop: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.85rem" }}>
            <svg width="14" height="14" fill="none" stroke="#14b8a6" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span style={{ fontSize: "12px", fontWeight: "800", color: "#14b8a6", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Nursing View — Active + Anticipated Orders
            </span>
          </div>

          {allActive.length > 0 && (
            <div style={{ marginBottom: "0.85rem" }}>
              <div style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", color: "#4b5e78", marginBottom: "6px" }}>✓ Currently Active</div>
              {allActive.map(o => (
                <div key={o.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "4px 0", fontSize: "13px" }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#14b8a6", flexShrink: 0 }} />
                  <span style={{ color: CAT[o.category]?.tx || "#94a3b8", fontSize: "10px", fontWeight: "700", minWidth: "72px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{o.category}</span>
                  <span style={{ color: "#cbd5e1" }}>{o.text}</span>
                </div>
              ))}
            </div>
          )}

          {allStaged.length > 0 && (
            <div>
              <div style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", color: "#4b5e78", marginBottom: "6px" }}>⏳ Anticipated (Staged — Not Yet Ordered)</div>
              {allStaged.map(o => (
                <div key={o.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "4px 0", fontSize: "13px" }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />
                  <span style={{ color: CAT[o.category]?.tx || "#94a3b8", fontSize: "10px", fontWeight: "700", minWidth: "72px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{o.category}</span>
                  <span style={{ color: "#94a3b8" }}>{o.text}</span>
                  {o.trigger && (
                    <span style={{ fontSize: "10px", color: "#4b5e78", background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "4px", padding: "1px 6px", whiteSpace: "nowrap" }}>
                      awaiting: {o.trigger}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {allActive.length === 0 && allStaged.length === 0 && (
            <div style={{ fontSize: "13px", color: "#334155" }}>No orders entered yet. Add orders to each phase above.</div>
          )}
        </div>
      )}

      {/* Order Timeline */}
      {showTimeline && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "1.1rem 1.25rem", marginTop: "0.5rem" }}>
          <div style={{ fontSize: "12px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.85rem" }}>Order Timeline</div>
          {phases.map((phase, idx) => (
            <div key={phase.id} style={{ display: "flex", gap: "12px", marginBottom: "0.65rem" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: phase.status === "active" ? "#14b8a6" : "#f59e0b", flexShrink: 0, marginTop: "3px" }} />
                {idx < phases.length - 1 && (
                  <div style={{ width: "1px", flex: 1, minHeight: "20px", background: "rgba(255,255,255,0.08)", marginTop: "2px" }} />
                )}
              </div>
              <div style={{ flex: 1, paddingBottom: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: phase.status === "active" ? "#e2e8f0" : "#94a3b8" }}>{phase.label}</span>
                  {phase.firedAt && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "#f59e0b" }}>{phase.firedAt}</span>}
                  {phase.status === "staged" && <span style={{ fontSize: "10px", color: "#64748b" }}>— awaiting: {phase.trigger || "manual fire"}</span>}
                </div>
                {phase.orders.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {phase.orders.map(o => <OrderChip key={o.id} order={o} showTime />)}
                  </div>
                ) : (
                  <span style={{ fontSize: "11px", color: "#334155", fontStyle: "italic" }}>No orders</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}