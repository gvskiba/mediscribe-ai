import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";

const T = {
  navy: "#050f1e", panel: "#0d2240", edge: "#162d4f",
  border: "#1e3a5f", muted: "#2a4d72", dim: "#4a7299", text: "#c8ddf0",
  bright: "#e8f4ff", teal: "#00d4bc", amber: "#f5a623",
  red: "#ff5c6c", green: "#2ecc71", purple: "#9b6dff", blue: "#4a90d9",
};

const acuityColor = (a) => ({ "1": T.red, "2": T.red, "3": T.amber, "4": T.green, "5": T.dim }[a] || T.dim);

function SectionCard({ icon, title, count, color, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ border: `1px solid ${color}33`, borderRadius: 11, overflow: "hidden", marginBottom: 12 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: `${color}0d`, border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 13, color: T.bright }}>{title}</span>
        {count !== undefined && (
          <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 10, background: `${color}22`, color, border: `1px solid ${color}44` }}>{count}</span>
        )}
        <span style={{ fontSize: 11, color: T.dim }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ padding: "10px 14px", borderTop: `1px solid ${color}22` }}>
          {children}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, sub, color }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, paddingBottom: 6, borderBottom: `1px solid rgba(30,58,95,.3)`, marginBottom: 6 }}>
      {color && <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, marginTop: 4, flexShrink: 0 }} />}
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>{label}</span>
        {sub && <span style={{ fontSize: 11, color: T.dim, marginLeft: 6 }}>{sub}</span>}
      </div>
      {value && <span style={{ fontSize: 11.5, fontWeight: 700, color: T.dim, flexShrink: 0 }}>{value}</span>}
    </div>
  );
}

export default function ShiftHandoverModal({ isOpen, onClose, shift, encounters, orders, tasks, activeShift }) {
  const [generating, setGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [incoming, setIncoming] = useState("");
  const printRef = useRef(null);

  if (!isOpen) return null;

  // ── Derived data ──────────────────────────────────────────────────────────
  const pendingPatients = encounters.filter(e => !e.disposition || e.disposition === "pending");
  const criticalPatients = pendingPatients.filter(e => ["1", "2"].includes(e.acuity));
  const unsignedNotes = pendingPatients.filter(e => e.note_status !== "signed");

  const openTasks = tasks.filter(t => t.status === "open");
  const urgentTasks = openTasks.filter(t => t.priority === "urgent");

  const criticalOrders = orders.filter(o => o.is_critical && o.status !== "done" && o.status !== "cancelled");
  const pendingOrders = orders.filter(o => o.status === "pending" || o.status === "in_progress");

  const disposedToday = encounters.filter(e => e.disposition && e.disposition !== "pending");

  // ── AI generation ─────────────────────────────────────────────────────────
  const generateAI = async () => {
    setGenerating(true);
    setAiSummary("");
    const patientList = pendingPatients.map(p =>
      `- Room ${p.room || "?"} | ${p.patient_initials || "Pt"}, ${p.patient_age || "?"}${p.patient_sex ? p.patient_sex : ""}, ESI-${p.acuity} | CC: ${p.chief_complaint} | Dx: ${p.primary_diagnosis || "pending"} | Note: ${p.note_status} | Allergies: ${p.allergies || "NKDA"}`
    ).join("\n");

    const taskList = openTasks.map(t => `- [${t.priority?.toUpperCase()}] ${t.task_text}`).join("\n");

    const critLabList = criticalOrders.map(o => {
      const pt = encounters.find(e => e.id === o.encounter_id);
      return `- ${o.order_name}: ${o.result_value || "critical flag"} — Room ${pt?.room || "?"} (${pt?.patient_initials || "Pt"})`;
    }).join("\n");

    const prompt = `You are a board-certified emergency physician writing a structured shift handover report for the incoming team.

SHIFT DETAILS:
- Provider: ${activeShift?.provider_name}
- Department: ${activeShift?.department || "ED"}
- Shift started: ${activeShift?.shift_start ? new Date(activeShift.shift_start).toLocaleString() : "N/A"}
- Incoming provider: ${incoming || "incoming team"}

ACTIVE PATIENTS (${pendingPatients.length}):
${patientList || "None"}

OPEN TASKS (${openTasks.length}):
${taskList || "None"}

CRITICAL LAB/IMAGING ALERTS (${criticalOrders.length}):
${critLabList || "None"}

PATIENTS DISPOSITIONED THIS SHIFT: ${disposedToday.length}
UNSIGNED NOTES: ${unsignedNotes.length}

Write a concise, professional shift handover report covering:
1. One-sentence shift overview
2. Active patients — each in SBAR format (max 2 sentences each): situation, background, pending/action items
3. Urgent tasks that MUST be completed
4. Critical lab/result alerts with recommended actions
5. Documentation to-do (unsigned notes)
6. Closing recommendations for the incoming team

Keep language clinical, precise, and scannable. Use markdown with headers and bullet points.`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt });
    setAiSummary(result);
    setGenerating(false);
  };

  const handleCopy = () => {
    const text = printRef.current?.innerText || aiSummary;
    navigator.clipboard.writeText(text);
  };

  const handlePrint = () => window.print();

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", backdropFilter: "blur(8px)", zIndex: 300, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "20px 16px", overflowY: "auto" }}
      onClick={onClose}
    >
      <div
        style={{ background: T.navy, border: `1px solid ${T.border}`, borderRadius: 18, width: "100%", maxWidth: 860, fontFamily: "'DM Sans',sans-serif", boxShadow: "0 30px 80px rgba(0,0,0,.5)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: "rgba(155,109,255,.12)", border: "1px solid rgba(155,109,255,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🤝</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.bright }}>Shift Handover Report</div>
            <div style={{ fontSize: 12, color: T.dim, marginTop: 2 }}>
              {activeShift?.provider_name} · {activeShift?.department || "ED"} · {activeShift?.shift_start ? new Date(activeShift.shift_start).toLocaleString() : ""}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,.05)", border: `1px solid ${T.border}`, color: T.dim, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
          {/* LEFT — Structured data */}
          <div style={{ padding: "18px 20px", borderRight: `1px solid ${T.border}`, maxHeight: "70vh", overflowY: "auto" }}>
            <div style={{ fontSize: "9.5px", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".09em", color: T.dim, marginBottom: 12 }}>Live Shift Data</div>

            {/* Stats bar */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
              {[
                { label: "Active Pts", val: pendingPatients.length, color: T.teal },
                { label: "Urgent Tasks", val: urgentTasks.length, color: T.red },
                { label: "Critical Alerts", val: criticalOrders.length, color: T.red },
                { label: "Open Tasks", val: openTasks.length, color: T.amber },
                { label: "Unsigned Notes", val: unsignedNotes.length, color: T.amber },
                { label: "Dispositioned", val: disposedToday.length, color: T.green },
              ].map(s => (
                <div key={s.label} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 9, padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, fontWeight: 700, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: T.dim, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Critical patients */}
            <SectionCard icon="🚨" title="Critical / High-Acuity Patients" count={criticalPatients.length} color={T.red}>
              {criticalPatients.length === 0
                ? <div style={{ fontSize: 12, color: T.muted }}>None</div>
                : criticalPatients.map(p => (
                  <Row key={p.id} label={`Room ${p.room || "?"} — ${p.patient_initials || "Pt"}, ${p.patient_age || "?"}y`} sub={`ESI-${p.acuity} · ${p.chief_complaint}`} value={p.primary_diagnosis || "Dx pending"} color={acuityColor(p.acuity)} />
                ))
              }
            </SectionCard>

            {/* All active patients */}
            <SectionCard icon="👥" title="All Active Patients" count={pendingPatients.length} color={T.blue}>
              {pendingPatients.length === 0
                ? <div style={{ fontSize: 12, color: T.muted }}>None</div>
                : pendingPatients.filter(p => !["1","2"].includes(p.acuity)).map(p => (
                  <Row key={p.id} label={`Room ${p.room || "?"} — ${p.patient_initials || "Pt"}, ${p.patient_age || "?"}y`} sub={`ESI-${p.acuity} · ${p.chief_complaint}`} value={p.note_status === "signed" ? "✓ Signed" : "⚠ Unsigned"} color={acuityColor(p.acuity)} />
                ))
              }
            </SectionCard>

            {/* Critical alerts */}
            {criticalOrders.length > 0 && (
              <SectionCard icon="🧪" title="Critical Lab / Imaging Alerts" count={criticalOrders.length} color={T.red}>
                {criticalOrders.map(o => {
                  const pt = encounters.find(e => e.id === o.encounter_id);
                  return <Row key={o.id} label={o.order_name} sub={`Room ${pt?.room || "?"} · ${pt?.patient_initials || "Pt"}`} value={o.result_value || "Critical"} color={T.red} />;
                })}
              </SectionCard>
            )}

            {/* Pending orders */}
            {pendingOrders.length > 0 && (
              <SectionCard icon="📋" title="Pending Orders" count={pendingOrders.length} color={T.amber}>
                {pendingOrders.slice(0, 10).map(o => {
                  const pt = encounters.find(e => e.id === o.encounter_id);
                  return <Row key={o.id} label={o.order_name} sub={`Room ${pt?.room || "?"}`} value={o.status} />;
                })}
                {pendingOrders.length > 10 && <div style={{ fontSize: 11, color: T.dim }}>+ {pendingOrders.length - 10} more…</div>}
              </SectionCard>
            )}

            {/* Open tasks */}
            <SectionCard icon="✅" title="Open Tasks" count={openTasks.length} color={T.amber}>
              {openTasks.length === 0
                ? <div style={{ fontSize: 12, color: T.muted }}>All clear</div>
                : openTasks.map(t => (
                  <Row key={t.id} label={t.task_text} value={t.priority} color={t.priority === "urgent" ? T.red : T.amber} />
                ))
              }
            </SectionCard>

            {/* Unsigned notes */}
            {unsignedNotes.length > 0 && (
              <SectionCard icon="📝" title="Unsigned Notes" count={unsignedNotes.length} color={T.purple}>
                {unsignedNotes.map(p => (
                  <Row key={p.id} label={`Room ${p.room || "?"} — ${p.patient_initials || "Pt"}`} sub={p.chief_complaint} value={p.note_status} />
                ))}
              </SectionCard>
            )}
          </div>

          {/* RIGHT — AI summary */}
          <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12, maxHeight: "70vh" }}>
            <div style={{ fontSize: "9.5px", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".09em", color: T.dim }}>AI-Generated Summary</div>

            <div>
              <label style={{ fontSize: "9.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: T.dim, display: "block", marginBottom: 4 }}>Incoming Provider Name</label>
              <input
                value={incoming} onChange={e => setIncoming(e.target.value)}
                placeholder="e.g. Dr. Smith"
                style={{ background: "rgba(22,45,79,.8)", border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 11px", fontSize: 12.5, color: T.bright, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "'DM Sans',sans-serif" }}
              />
            </div>

            <button
              onClick={generateAI}
              disabled={generating}
              style={{ padding: "11px 0", borderRadius: 9, fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, cursor: generating ? "not-allowed" : "pointer", background: generating ? "rgba(155,109,255,.1)" : "linear-gradient(135deg,#9b6dff,#7c4dff)", border: generating ? `1px solid ${T.purple}` : "none", color: generating ? T.purple : "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all .2s" }}
            >
              {generating ? (
                <>
                  <span style={{ width: 14, height: 14, border: `2px solid ${T.purple}`, borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                  Generating…
                </>
              ) : "🤖 Generate AI Handover"}
            </button>

            {aiSummary ? (
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                <div
                  ref={printRef}
                  style={{ flex: 1, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px", fontSize: 12.5, color: T.text, lineHeight: 1.7, whiteSpace: "pre-wrap", overflowY: "auto", maxHeight: "calc(70vh - 200px)" }}
                >
                  {aiSummary}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={handleCopy} style={{ flex: 1, padding: "9px 0", borderRadius: 8, fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer", background: "rgba(0,212,188,.08)", border: `1px solid rgba(0,212,188,.25)`, color: T.teal }}>📋 Copy</button>
                  <button onClick={handlePrint} style={{ flex: 1, padding: "9px 0", borderRadius: 8, fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer", background: "rgba(74,144,217,.08)", border: `1px solid rgba(74,144,217,.25)`, color: T.blue }}>🖨 Print</button>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 24 }}>
                <div style={{ fontSize: 32 }}>🤝</div>
                <div style={{ fontSize: 12.5, color: T.dim, textAlign: "center", lineHeight: 1.6 }}>
                  Click <strong style={{ color: T.purple }}>Generate AI Handover</strong> to create a structured SBAR handover report from live shift data — pending patients, critical alerts, open tasks, and more.
                </div>
              </div>
            )}
          </div>
        </div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}