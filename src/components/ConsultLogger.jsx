import { useState } from "react";

const SPECIALTIES = [
  "Cardiology","Neurology","Neurosurgery","General Surgery","Orthopedics",
  "Vascular Surgery","Gastroenterology","Nephrology","Pulmonology / Critical Care",
  "Infectious Disease","Hematology / Oncology","Psychiatry","Urology","OB/GYN",
  "Ophthalmology","ENT","Plastic Surgery","Interventional Radiology",
  "Palliative Care","Trauma Surgery","Toxicology","Other"
];

const SPEC_COLORS = {
  "Cardiology": "#ef4444","Neurology": "#8b5cf6","Neurosurgery": "#7c3aed",
  "General Surgery": "#f97316","Orthopedics": "#14b8a6","Vascular Surgery": "#06b6d4",
  "Gastroenterology": "#84cc16","Nephrology": "#f59e0b",
  "Pulmonology / Critical Care": "#3b82f6","Infectious Disease": "#10b981",
  "Hematology / Oncology": "#ec4899","Psychiatry": "#a78bfa","Urology": "#fb923c",
  "OB/GYN": "#f472b6","Ophthalmology": "#22d3ee","ENT": "#34d399",
  "Plastic Surgery": "#fb7185","Interventional Radiology": "#60a5fa",
  "Palliative Care": "#94a3b8","Trauma Surgery": "#f87171",
  "Toxicology": "#a3e635","Other": "#64748b"
};

const BLANK = {
  specialty: "", physician: "", reason: "",
  findings: "", recommendation: "", orders: "", disposition: ""
};

function nowTime() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: true
  });
}

function specColor(s) {
  return SPEC_COLORS[s] || "#64748b";
}

export default function ConsultLogger({ embedded = false, onConsultsChange }) {
  const [consults, setConsults] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const updateConsults = (updater) => {
    setConsults(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (onConsultsChange) onConsultsChange(next);
      return next;
    });
  };
  const [form, setForm] = useState({ ...BLANK });
  const [editId, setEditId] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const f = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const openNew = () => {
    setForm({ ...BLANK });
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (c) => {
    setForm({
      specialty: c.specialty, physician: c.physician, reason: c.reason,
      findings: c.findings, recommendation: c.recommendation,
      orders: c.orders, disposition: c.disposition
    });
    setEditId(c.id);
    setShowForm(true);
  };

  const submitForm = () => {
    if (!form.specialty || !form.reason) return;
    if (editId !== null) {
      updateConsults(prev => prev.map(c => c.id === editId ? { ...c, ...form } : c));
      setEditId(null);
    } else {
      const id = Date.now();
      updateConsults(prev => [...prev, { id, time: nowTime(), ...form }]);
      setExpanded(prev => ({ ...prev, [id]: true }));
    }
    setForm({ ...BLANK });
    setShowForm(false);
  };

  const remove = (id) => updateConsults(prev => prev.filter(c => c.id !== id));

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const genMDM = () =>
    consults.map((c, i) =>
      `[CONSULT ${i + 1}] ${c.specialty.toUpperCase()}${c.physician ? " — Dr. " + c.physician : ""} @ ${c.time}\n` +
      `Reason: ${c.reason}\n` +
      (c.findings ? `Findings communicated: ${c.findings}\n` : "") +
      (c.recommendation ? `Recommendation received: ${c.recommendation}\n` : "") +
      (c.orders ? `Orders placed per consult: ${c.orders}\n` : "") +
      (c.disposition ? `Disposition plan: ${c.disposition}` : "")
    ).join("\n\n---\n\n");

  const copyAll = () => {
    navigator.clipboard.writeText(genMDM()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const copyOne = (c) => {
    const text =
      `[CONSULT] ${c.specialty}${c.physician ? " — Dr. " + c.physician : ""} @ ${c.time}\n` +
      `Reason: ${c.reason}\n` +
      (c.findings ? `Findings communicated: ${c.findings}\n` : "") +
      (c.recommendation ? `Recommendation: ${c.recommendation}\n` : "") +
      (c.orders ? `Orders placed: ${c.orders}\n` : "") +
      (c.disposition ? `Disposition: ${c.disposition}` : "");
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(c.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const wrap = {
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    background: embedded ? "transparent" : "linear-gradient(160deg, #0d1b2e 0%, #091422 100%)",
    minHeight: embedded ? "auto" : "100vh",
    color: "#e2e8f0",
    padding: embedded ? "0" : "1.5rem",
  };

  const card = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "1.1rem 1.25rem",
    marginBottom: "0.65rem",
  };

  const formCard = {
    background: "rgba(20,184,166,0.04)",
    border: "1px solid rgba(20,184,166,0.22)",
    borderRadius: "12px",
    padding: "1.25rem",
    marginBottom: "1rem",
  };

  const label = {
    display: "block",
    fontSize: "10px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#4b5e78",
    marginBottom: "4px",
  };

  const input = {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "8px 12px",
    color: "#e2e8f0",
    fontSize: "13px",
    boxSizing: "border-box",
    outline: "none",
    fontFamily: "inherit",
  };

  const textarea = {
    ...input,
    resize: "vertical",
    minHeight: "70px",
    lineHeight: "1.5",
  };

  const select = {
    ...input,
    background: "#0b1a2f",
    cursor: "pointer",
  };

  const btn = (v) => ({
    background:
      v === "teal" ? "rgba(20,184,166,0.15)"
      : v === "ghost" ? "rgba(255,255,255,0.05)"
      : v === "danger" ? "rgba(239,68,68,0.1)"
      : "rgba(255,255,255,0.06)",
    border:
      v === "teal" ? "1px solid rgba(20,184,166,0.45)"
      : v === "ghost" ? "1px solid rgba(255,255,255,0.1)"
      : v === "danger" ? "1px solid rgba(239,68,68,0.3)"
      : "1px solid rgba(255,255,255,0.1)",
    color:
      v === "teal" ? "#14b8a6"
      : v === "danger" ? "#f87171"
      : "#94a3b8",
    borderRadius: "8px",
    padding: "6px 14px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
  });

  const specBadge = (s) => ({
    background: `${specColor(s)}18`,
    border: `1px solid ${specColor(s)}55`,
    color: specColor(s),
    borderRadius: "6px",
    padding: "2px 9px",
    fontSize: "11px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  });

  const kvKey = {
    fontSize: "10px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    color: "#4b5e78",
    paddingTop: "3px",
    whiteSpace: "nowrap",
  };

  const kvVal = {
    fontSize: "13px",
    color: "#cbd5e1",
    lineHeight: "1.55",
  };

  return (
    <div style={wrap}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "38px", height: "38px", borderRadius: "10px",
            background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.28)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
          }}>
            <svg width="18" height="18" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1.35rem", fontWeight: "700", color: "#f1f5f9", margin: 0, lineHeight: 1.2
            }}>
              Consult Logger
            </h2>
            <div style={{ fontSize: "11px", color: "#4b5e78", marginTop: "2px" }}>
              Specialist consultation documentation
            </div>
          </div>
          {consults.length > 0 && (
            <span style={{
              background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.35)",
              color: "#14b8a6", borderRadius: "20px", padding: "2px 11px",
              fontSize: "12px", fontWeight: "700"
            }}>
              {consults.length} consult{consults.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button style={btn("teal")} onClick={openNew}>+ New Consult</button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={formCard}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "#14b8a6", marginBottom: "1rem", letterSpacing: "0.04em" }}>
            {editId !== null ? "EDIT CONSULT" : "NEW SPECIALIST CONSULT"}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div>
              <label style={label}>Specialty *</label>
              <select style={select} value={form.specialty} onChange={f("specialty")}>
                <option value="">Select specialty...</option>
                {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Consulting Physician</label>
              <input style={input} placeholder="Dr. Last Name (optional)" value={form.physician} onChange={f("physician")} />
            </div>
          </div>

          <div style={{ marginBottom: "0.75rem" }}>
            <label style={label}>Reason for Consult *</label>
            <textarea style={textarea}
              placeholder="Clinical question and chief complaint prompting this consult..."
              value={form.reason} onChange={f("reason")} />
          </div>

          <div style={{ marginBottom: "0.75rem" }}>
            <label style={label}>Findings Communicated to Specialist</label>
            <textarea style={textarea}
              placeholder="Vitals, exam findings, labs, imaging you reported to the consultant..."
              value={form.findings} onChange={f("findings")} />
          </div>

          <div style={{ marginBottom: "0.75rem" }}>
            <label style={label}>Recommendation Received</label>
            <textarea style={{ ...textarea, borderColor: "rgba(134,239,172,0.2)" }}
              placeholder="Exact recommendation — be specific. (e.g., Admit for heparin drip, echo in AM, cardiology to see overnight.)"
              value={form.recommendation} onChange={f("recommendation")} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
            <div>
              <label style={label}>Orders Generated from Consult</label>
              <textarea style={{ ...textarea, minHeight: "60px" }}
                placeholder="e.g., Heparin gtt per ACS protocol, Echo AM..."
                value={form.orders} onChange={f("orders")} />
            </div>
            <div>
              <label style={label}>Disposition Plan</label>
              <textarea style={{ ...textarea, minHeight: "60px" }}
                placeholder="e.g., Admit to cardiology floor, follow-up in 48h..."
                value={form.disposition} onChange={f("disposition")} />
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button style={btn("ghost")} onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</button>
            <button
              style={{ ...btn("teal"), opacity: (!form.specialty || !form.reason) ? 0.4 : 1 }}
              onClick={submitForm}
              disabled={!form.specialty || !form.reason}
            >
              {editId !== null ? "Update Consult" : "Log Consult"}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {consults.length === 0 && !showForm && (
        <div style={{
          textAlign: "center", padding: "3.5rem 1rem",
          border: "1px dashed rgba(255,255,255,0.07)", borderRadius: "12px",
          color: "#334155"
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.6rem", opacity: 0.5 }}>
            <svg width="40" height="40" fill="none" stroke="#4b5e78" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: "0 auto" }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div style={{ fontSize: "14px", color: "#4b5e78", marginBottom: "4px" }}>No consults logged</div>
          <div style={{ fontSize: "12px", color: "#334155" }}>
            Tap + New Consult to document your first specialist conversation
          </div>
        </div>
      )}

      {/* Consult cards */}
      {consults.map((c) => (
        <div key={c.id} style={{ ...card, borderLeft: `3px solid ${specColor(c.specialty)}55` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={specBadge(c.specialty)}>{c.specialty}</span>
              {c.physician && (
                <span style={{ fontSize: "12px", color: "#64748b" }}>Dr. {c.physician}</span>
              )}
              <span style={{ fontFamily: "'JetBrains Mono', 'Courier New', monospace", fontSize: "11px", color: "#f59e0b" }}>
                {c.time}
              </span>
            </div>
            <div style={{ display: "flex", gap: "5px" }}>
              <button style={btn("ghost")} onClick={() => copyOne(c)}>
                {copiedId === c.id ? "✓" : "⎘"}
              </button>
              <button style={btn("ghost")} onClick={() => openEdit(c)}>Edit</button>
              <button style={btn("ghost")} onClick={() => toggle(c.id)}>
                {expanded[c.id] ? "▲" : "▼"}
              </button>
              <button style={btn("danger")} onClick={() => remove(c.id)}>✕</button>
            </div>
          </div>

          <div style={{ marginTop: "0.6rem", fontSize: "13px", color: "#94a3b8", lineHeight: "1.5" }}>
            <span style={{ ...kvKey, display: "inline", marginRight: "6px" }}>Reason:</span>
            <span style={{ color: "#cbd5e1" }}>{c.reason}</span>
          </div>

          {c.recommendation && !expanded[c.id] && (
            <div style={{ marginTop: "4px", fontSize: "13px", color: "#86efac", lineHeight: "1.5" }}>
              <span style={{ ...kvKey, display: "inline", marginRight: "6px", color: "#4b5e78" }}>Rec:</span>
              {c.recommendation.length > 120 ? c.recommendation.slice(0, 120) + "…" : c.recommendation}
            </div>
          )}

          {expanded[c.id] && (
            <div style={{
              marginTop: "0.85rem",
              display: "grid", gridTemplateColumns: "120px 1fr",
              gap: "6px 16px",
              paddingTop: "0.75rem",
              borderTop: "1px solid rgba(255,255,255,0.06)"
            }}>
              {c.findings && (
                <>
                  <span style={kvKey}>Findings Sent</span>
                  <span style={kvVal}>{c.findings}</span>
                </>
              )}
              {c.recommendation && (
                <>
                  <span style={kvKey}>Recommendation</span>
                  <span style={{ ...kvVal, color: "#86efac", fontWeight: "500" }}>{c.recommendation}</span>
                </>
              )}
              {c.orders && (
                <>
                  <span style={kvKey}>Orders Placed</span>
                  <span style={{ ...kvVal, fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "#93c5fd" }}>
                    {c.orders}
                  </span>
                </>
              )}
              {c.disposition && (
                <>
                  <span style={kvKey}>Disposition</span>
                  <span style={{ ...kvVal, color: "#fbbf24" }}>{c.disposition}</span>
                </>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Copy to MDM */}
      {consults.length > 0 && (
        <div style={{ marginTop: "0.5rem" }}>
          <button
            onClick={copyAll}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              background: copied ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.08)",
              border: `1px solid ${copied ? "rgba(16,185,129,0.35)" : "rgba(245,158,11,0.3)"}`,
              color: copied ? "#10b981" : "#f59e0b",
              borderRadius: "8px", padding: "8px 18px",
              fontSize: "12px", fontWeight: "700",
              cursor: "pointer", letterSpacing: "0.04em"
            }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              {copied
                ? <path d="M20 6 9 17l-5-5"/>
                : <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>
              }
            </svg>
            {copied ? "Copied to clipboard" : `Copy ${consults.length} Consult${consults.length !== 1 ? "s" : ""} to MDM`}
          </button>
        </div>
      )}
    </div>
  );
}