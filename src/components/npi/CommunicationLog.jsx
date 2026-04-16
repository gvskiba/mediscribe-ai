// CommunicationLog.jsx
// Structured communication event log for the NPI workflow.
// Captures patient education, family discussions, consultant callbacks,
// PCP notifications, and care coordination events with teach-back fields.
// Generates chart-ready note language from structured entries.
//
// Props:
//   demo, cc, providerName
//   events          — array of communication events (held in parent state)
//   onEventsChange  — (events[]) => void — called on every add/remove
//   onNoteText      — (text: string) => void — push assembled text to note studio
//
// Constraints: no form, no localStorage, no router, no sonner, no alert,
//   straight quotes only, border before borderTop/etc.

import { useState, useCallback, useMemo } from "react";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36", up:"#0e2544",
  bd:"rgba(26,53,85,0.8)", txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0",
};

// ── Event type config ─────────────────────────────────────────────────────────
const EVENT_TYPES = [
  {
    id:"patient_education",
    label:"Patient Education",
    icon:"\uD83D\uDCDA",
    color:T.teal,
    defaultParticipant:"Patient",
    summaryPlaceholder:"Topics covered: diagnosis, medications, activity restrictions, return precautions\u2026",
    hasTeachback:true,
    noteTemplate: (e) => {
      const parts = [`Patient education provided at ${e.timestamp}`];
      if (e.participants) parts.push(`(${e.participants})`);
      if (e.summary) parts.push(`regarding ${e.summary}`);
      if (e.teachback) parts.push("Teach-back completed \u2014 patient verbalized understanding");
      if (e.teachbackResponse) parts.push(`Patient stated: "${e.teachbackResponse}"`);
      if (e.barriers?.length) parts.push(`Barriers noted: ${e.barriers.join(", ")}`);
      if (e.accommodations?.length) parts.push(`Accommodations: ${e.accommodations.join(", ")}`);
      return parts.join(". ") + ".";
    },
  },
  {
    id:"family_meeting",
    label:"Family Discussion",
    icon:"\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67",
    color:T.blue,
    defaultParticipant:"Patient and family",
    summaryPlaceholder:"Discussion topics, decisions made, family concerns addressed\u2026",
    hasTeachback:false,
    noteTemplate: (e) => {
      const parts = [`Family meeting conducted at ${e.timestamp}`];
      if (e.participants) parts.push(`with ${e.participants}`);
      if (e.summary) parts.push(e.summary);
      return parts.join(" \u2014 ") + ".";
    },
  },
  {
    id:"consult_callback",
    label:"Consultant Callback",
    icon:"\uD83D\uDCDE",
    color:T.purple,
    defaultParticipant:"",
    summaryPlaceholder:"Consultant name, service, recommendations received\u2026",
    hasTeachback:false,
    noteTemplate: (e) => {
      const parts = [`Consultation callback received at ${e.timestamp}`];
      if (e.participants) parts.push(`from ${e.participants}`);
      if (e.summary) parts.push(`Recommendations: ${e.summary}`);
      return parts.join(". ") + ".";
    },
  },
  {
    id:"pcp_notify",
    label:"PCP / Specialist Notification",
    icon:"\uD83C\uDFE5",
    color:T.gold,
    defaultParticipant:"",
    summaryPlaceholder:"Provider name, clinic, what was communicated, agreed follow-up plan\u2026",
    hasTeachback:false,
    noteTemplate: (e) => {
      const parts = [`Outpatient provider notified at ${e.timestamp}`];
      if (e.participants) parts.push(`(${e.participants})`);
      if (e.summary) parts.push(e.summary);
      return parts.join(". ") + ".";
    },
  },
  {
    id:"social_work",
    label:"Social Work Referral",
    icon:"\uD83E\uDD1D",
    color:T.orange,
    defaultParticipant:"Social work",
    summaryPlaceholder:"Referral reason, social worker name, plan\u2026",
    hasTeachback:false,
    noteTemplate: (e) => {
      const parts = [`Social work consultation placed at ${e.timestamp}`];
      if (e.participants && e.participants !== "Social work") parts.push(`(${e.participants})`);
      if (e.summary) parts.push(e.summary);
      return parts.join(". ") + ".";
    },
  },
  {
    id:"pharmacy",
    label:"Pharmacy Communication",
    icon:"\uD83D\uDC8A",
    color:"#3dffa0",
    defaultParticipant:"Pharmacist",
    summaryPlaceholder:"Medications counseled, interactions reviewed, prescription sent\u2026",
    hasTeachback:false,
    noteTemplate: (e) => {
      const parts = [`Pharmacy communication at ${e.timestamp}`];
      if (e.participants && e.participants !== "Pharmacist") parts.push(`(${e.participants})`);
      if (e.summary) parts.push(e.summary);
      return parts.join(". ") + ".";
    },
  },
  {
    id:"nursing_report",
    label:"Nursing Report / Handoff",
    icon:"\uD83E\uDE7A",
    color:T.blue,
    defaultParticipant:"Nursing staff",
    summaryPlaceholder:"Nurse name, key information communicated, pending items\u2026",
    hasTeachback:false,
    noteTemplate: (e) => {
      const parts = [`Nursing report given at ${e.timestamp}`];
      if (e.participants && e.participants !== "Nursing staff") parts.push(`to ${e.participants}`);
      if (e.summary) parts.push(e.summary);
      return parts.join(". ") + ".";
    },
  },
  {
    id:"interpreter",
    label:"Interpreter Services",
    icon:"\uD83C\uDF10",
    color:T.purple,
    defaultParticipant:"",
    summaryPlaceholder:"Interpreter name / ID, language, sessions covered\u2026",
    hasTeachback:false,
    noteTemplate: (e) => {
      const parts = [`Interpreter services utilized at ${e.timestamp}`];
      if (e.participants) parts.push(`(${e.participants})`);
      if (e.summary) parts.push(e.summary);
      return parts.join(". ") + ".";
    },
  },
  {
    id:"other",
    label:"Other Communication",
    icon:"\uD83D\uDCAC",
    color:T.txt3,
    defaultParticipant:"",
    summaryPlaceholder:"Participants, what was communicated, any follow-up required\u2026",
    hasTeachback:false,
    noteTemplate: (e) => {
      const parts = [`Communication documented at ${e.timestamp}`];
      if (e.participants) parts.push(`with ${e.participants}`);
      if (e.summary) parts.push(e.summary);
      return parts.join(". ") + ".";
    },
  },
];

// ── Teach-back barriers ────────────────────────────────────────────────────────
const BARRIERS = [
  "Language barrier", "Low health literacy", "Pain / discomfort",
  "Emotional distress", "Cognitive impairment", "Hearing difficulty",
  "Visual impairment", "No barriers identified",
];

// ── Accommodations ────────────────────────────────────────────────────────────
const ACCOMMODATIONS = [
  "Professional interpreter used", "Written materials provided",
  "Simplified language used", "Family member included",
  "AV aids / diagrams used", "Follow-up call scheduled",
];

// ── Sentence builder ──────────────────────────────────────────────────────────
function buildSentence(event) {
  const def = EVENT_TYPES.find(t => t.id === event.type);
  if (!def) return "";
  return def.noteTemplate(event);
}

// ── Assemble full note block ───────────────────────────────────────────────────
function buildNoteBlock(events, patientName, providerName) {
  if (!events.length) return "";
  const header = `COMMUNICATION LOG${patientName ? " \u2014 " + patientName : ""}`;
  const lines  = events.map(e => {
    const def = EVENT_TYPES.find(t => t.id === e.type);
    return `[${def?.label || e.type}] ${buildSentence(e)}`;
  });
  const footer = `Documented by: ${providerName || "ED Provider"} \u00b7 ${new Date().toLocaleDateString()}`;
  return [header, ...lines, footer].join("\n");
}

// ── Timestamp helper ──────────────────────────────────────────────────────────
function nowHHMM() {
  return new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", hour12:false });
}

// ── Empty form state ──────────────────────────────────────────────────────────
const BLANK_FORM = {
  type:"patient_education", timestamp:"", participants:"", summary:"",
  teachback:false, teachbackResponse:"",
  barriers:[], accommodations:[],
};

// ── Sub-components ─────────────────────────────────────────────────────────────
function EventCard({ event, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  const def      = EVENT_TYPES.find(t => t.id === event.type);
  const sentence = buildSentence(event);

  return (
    <div style={{ borderRadius:10, background:T.card, border:`1px solid ${def?.color || T.bd}22`, borderLeft:`3px solid ${def?.color || T.blue}` }}>
      {/* Header row */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 13px", cursor:"pointer" }}
        onClick={() => setExpanded(x => !x)}>
        <span style={{ fontSize:14, lineHeight:1, flexShrink:0 }}>{def?.icon}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, color:def?.color || T.txt }}>
              {def?.label}
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4 }}>
              {event.timestamp}
            </span>
            {event.participants && (
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt3 }}>
                \u00b7 {event.participants}
              </span>
            )}
            {event.teachback && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.teal, background:"rgba(0,229,192,.1)", border:"1px solid rgba(0,229,192,.25)", borderRadius:3, padding:"1px 5px", letterSpacing:"0.5px" }}>
                TEACH-BACK \u2713
              </span>
            )}
          </div>
          {!expanded && event.summary && (
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {event.summary}
            </div>
          )}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
          <span style={{ color:T.txt4, fontSize:10 }}>{expanded ? "\u25b2" : "\u25bc"}</span>
          <button onClick={e => { e.stopPropagation(); onRemove(event.id); }}
            style={{ background:"none", border:"none", color:T.txt4, cursor:"pointer", fontSize:12, padding:"1px 4px", lineHeight:1 }}>
            \u2715
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding:"0 13px 12px", borderTop:`1px solid ${T.bd}` }}>
          {event.summary && (
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt2, lineHeight:1.6, marginTop:9, marginBottom:8 }}>
              {event.summary}
            </div>
          )}
          {event.teachback && event.teachbackResponse && (
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.teal, fontStyle:"italic", marginBottom:6 }}>
              Patient stated: "{event.teachbackResponse}"
            </div>
          )}
          {event.barriers?.length > 0 && (
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt3, marginBottom:4 }}>
              Barriers: {event.barriers.join(", ")}
            </div>
          )}
          {event.accommodations?.length > 0 && (
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt3, marginBottom:8 }}>
              Accommodations: {event.accommodations.join(", ")}
            </div>
          )}
          {/* Generated sentence preview */}
          <div style={{ padding:"7px 10px", borderRadius:7, background:T.up, border:`1px solid ${T.bd}`, fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt3, lineHeight:1.6, fontStyle:"italic" }}>
            {sentence}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function CommunicationLog({
  demo = {}, cc = {}, providerName = "",
  events = [], onEventsChange,
  onNoteText,
}) {
  const [form,        setForm]        = useState({ ...BLANK_FORM, timestamp:nowHHMM() });
  const [addingEvent, setAddingEvent] = useState(false);
  const [noteCopied,  setNoteCopied]  = useState(false);

  const patientName = [demo.firstName, demo.lastName].filter(Boolean).join(" ") || "Patient";

  // ── Derived ───────────────────────────────────────────────────────────────
  const currentTypeDef = EVENT_TYPES.find(t => t.id === form.type) || EVENT_TYPES[0];

  const educationEvents = useMemo(() => events.filter(e => e.type === "patient_education"), [events]);
  const teachbackDone   = educationEvents.some(e => e.teachback);
  const noteBlock       = useMemo(() => buildNoteBlock(events, patientName, providerName), [events, patientName, providerName]);

  // ── Stats for header ──────────────────────────────────────────────────────
  const typeCounts = useMemo(() => {
    const counts = {};
    events.forEach(e => { counts[e.type] = (counts[e.type] || 0) + 1; });
    return counts;
  }, [events]);

  // ── Add event ─────────────────────────────────────────────────────────────
  const handleAdd = useCallback(() => {
    if (!form.summary.trim() && !form.participants.trim()) return;
    const newEvent = { ...form, id: Date.now() };
    const updated = [...events, newEvent];
    onEventsChange?.(updated);
    setForm({ ...BLANK_FORM, timestamp:nowHHMM() });
    setAddingEvent(false);
  }, [form, events, onEventsChange]);

  // ── Remove event ──────────────────────────────────────────────────────────
  const handleRemove = useCallback((id) => {
    onEventsChange?.(events.filter(e => e.id !== id));
  }, [events, onEventsChange]);

  // ── Copy note block ───────────────────────────────────────────────────────
  const copyNote = useCallback(() => {
    if (!noteBlock) return;
    navigator.clipboard?.writeText(noteBlock).then(() => {
      setNoteCopied(true);
      setTimeout(() => setNoteCopied(false), 2500);
    });
  }, [noteBlock]);

  // ── Toggle multi-select helpers ───────────────────────────────────────────
  const toggleArr = (field, val) =>
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(val)
        ? prev[field].filter(x => x !== val)
        : [...prev[field], val],
    }));

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflowY:"auto", background:T.bg, color:T.txt, fontFamily:"'DM Sans',sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ padding:"16px 22px 14px", borderBottom:`1px solid ${T.bd}`, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap", marginBottom:12 }}>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:T.txt }}>
              Communication Log
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4, marginTop:2 }}>
              Patient education \u00b7 Family discussions \u00b7 Provider notifications \u00b7 Care coordination
            </div>
          </div>
          <button onClick={() => { setAddingEvent(x => !x); setForm({ ...BLANK_FORM, timestamp:nowHHMM() }); }}
            style={{ padding:"7px 16px", borderRadius:8, border:`1px solid ${addingEvent ? T.bd : "rgba(0,229,192,.4)"}`, background: addingEvent ? "rgba(42,77,114,.2)" : "rgba(0,229,192,.1)", color: addingEvent ? T.txt4 : T.teal, fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, cursor:"pointer", flexShrink:0, transition:"all .15s" }}>
            {addingEvent ? "\u2715 Cancel" : "+ Log Communication"}
          </button>
        </div>

        {/* Stats strip */}
        {events.length > 0 && (
          <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, letterSpacing:"0.08em", alignSelf:"center", textTransform:"uppercase", marginRight:3 }}>
              {events.length} event{events.length > 1 ? "s" : ""}:
            </div>
            {Object.entries(typeCounts).map(([type, count]) => {
              const def = EVENT_TYPES.find(t => t.id === type);
              return (
                <span key={type} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, padding:"2px 9px", borderRadius:20, background:`${def?.color || T.blue}12`, border:`1px solid ${def?.color || T.blue}30`, color:def?.color || T.blue }}>
                  {def?.icon} {def?.label} {count > 1 ? `\u00d7${count}` : ""}
                </span>
              );
            })}
            {teachbackDone && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, padding:"2px 9px", borderRadius:20, background:"rgba(0,229,192,.1)", border:"1px solid rgba(0,229,192,.3)", color:T.teal, letterSpacing:"0.5px" }}>
                \u2713 TEACH-BACK
              </span>
            )}
          </div>
        )}
      </div>

      <div style={{ padding:"16px 22px 60px", display:"flex", flexDirection:"column", gap:14 }}>

        {/* ── Add event form ── */}
        {addingEvent && (
          <div style={{ padding:"16px", borderRadius:12, background:T.panel, border:`1px solid ${currentTypeDef.color}33`, borderTop:`2px solid ${currentTypeDef.color}77` }}>

            {/* Event type selector */}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:8 }}>
                Event Type
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {EVENT_TYPES.map(t => (
                  <button key={t.id} onClick={() => setForm(prev => ({ ...prev, type:t.id, participants:t.defaultParticipant }))}
                    style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 11px", borderRadius:20, border:`1px solid ${form.type===t.id ? t.color+"66" : T.bd}`, background: form.type===t.id ? `${t.color}15` : "transparent", color: form.type===t.id ? t.color : T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight: form.type===t.id ? 600 : 400, cursor:"pointer", transition:"all .12s", whiteSpace:"nowrap" }}>
                    <span>{t.icon}</span>{t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Core fields */}
            <div style={{ display:"grid", gridTemplateColumns:"130px 1fr", gap:10, marginBottom:10 }}>
              <div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:5 }}>Time</div>
                <input type="text" value={form.timestamp} onChange={e => setForm(p => ({ ...p, timestamp:e.target.value }))}
                  placeholder="HH:MM"
                  style={{ width:"100%", background:T.up, border:`1px solid ${T.bd}`, borderRadius:7, padding:"7px 10px", color:T.txt, fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, outline:"none", boxSizing:"border-box", textAlign:"center" }} />
              </div>
              <div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:5 }}>
                  {form.type === "consult_callback" ? "Consultant Name / Service" :
                   form.type === "pcp_notify"       ? "Provider Name / Clinic" :
                   form.type === "interpreter"      ? "Interpreter Name / Language" :
                   "Participants"}
                </div>
                <input type="text" value={form.participants} onChange={e => setForm(p => ({ ...p, participants:e.target.value }))}
                  placeholder={currentTypeDef.defaultParticipant || "Who was involved?"}
                  style={{ width:"100%", background:T.up, border:`1px solid ${T.bd}`, borderRadius:7, padding:"7px 10px", color:T.txt, fontFamily:"'DM Sans',sans-serif", fontSize:12, outline:"none", boxSizing:"border-box" }} />
              </div>
            </div>

            <div style={{ marginBottom:10 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:5 }}>Content Summary</div>
              <textarea
                value={form.summary} onChange={e => setForm(p => ({ ...p, summary:e.target.value }))}
                rows={3} placeholder={currentTypeDef.summaryPlaceholder}
                style={{ width:"100%", background:T.up, border:`1px solid ${T.bd}`, borderRadius:7, padding:"8px 10px", color:T.txt, fontFamily:"'DM Sans',sans-serif", fontSize:12, lineHeight:1.6, resize:"vertical", outline:"none", boxSizing:"border-box" }} />
            </div>

            {/* Teach-back fields — only for patient_education */}
            {currentTypeDef.hasTeachback && (
              <div style={{ padding:"12px 13px", borderRadius:9, background:T.up, border:`1px solid ${form.teachback ? "rgba(0,229,192,.3)" : T.bd}`, marginBottom:10 }}>
                <div onClick={() => setForm(p => ({ ...p, teachback:!p.teachback }))}
                  style={{ display:"flex", alignItems:"center", gap:9, cursor:"pointer", marginBottom: form.teachback ? 10 : 0 }}>
                  <div style={{ width:18, height:18, borderRadius:4, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background: form.teachback ? "rgba(0,229,192,.15)" : "transparent", border:`1.5px solid ${form.teachback ? T.teal : T.txt4}` }}>
                    {form.teachback && <span style={{ color:T.teal, fontSize:11, fontWeight:900, lineHeight:1 }}>\u2713</span>}
                  </div>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color: form.teachback ? T.teal : T.txt3 }}>
                    Teach-back completed (JCAHO EP.5)
                  </span>
                </div>

                {form.teachback && (
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    <div>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:5 }}>
                        Patient verbalization <span style={{ color:T.txt4, textTransform:"none", letterSpacing:0 }}>(what patient said)</span>
                      </div>
                      <input type="text" value={form.teachbackResponse}
                        onChange={e => setForm(p => ({ ...p, teachbackResponse:e.target.value }))}
                        placeholder="Patient stated they would return for chest pain, worsening shortness of breath, or fever\u2026"
                        style={{ width:"100%", background:T.card, border:`1px solid rgba(0,229,192,.25)`, borderRadius:7, padding:"7px 10px", color:T.txt, fontFamily:"'DM Sans',sans-serif", fontSize:12, outline:"none", boxSizing:"border-box" }} />
                    </div>

                    <div>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:6 }}>
                        Barriers
                      </div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                        {BARRIERS.map(b => {
                          const on = form.barriers.includes(b);
                          return (
                            <button key={b} onClick={() => toggleArr("barriers", b)}
                              style={{ padding:"3px 10px", borderRadius:20, border:`1px solid ${on ? "rgba(245,200,66,.5)" : T.bd}`, background: on ? "rgba(245,200,66,.1)" : "transparent", color: on ? T.gold : T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight: on ? 600 : 400, cursor:"pointer", transition:"all .12s" }}>
                              {b}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:6 }}>
                        Accommodations made
                      </div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                        {ACCOMMODATIONS.map(a => {
                          const on = form.accommodations.includes(a);
                          return (
                            <button key={a} onClick={() => toggleArr("accommodations", a)}
                              style={{ padding:"3px 10px", borderRadius:20, border:`1px solid ${on ? "rgba(59,158,255,.5)" : T.bd}`, background: on ? "rgba(59,158,255,.1)" : "transparent", color: on ? T.blue : T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight: on ? 600 : 400, cursor:"pointer", transition:"all .12s" }}>
                              {a}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Preview sentence */}
            {(form.summary || form.participants) && (
              <div style={{ padding:"8px 10px", borderRadius:7, background:T.up, border:`1px solid ${T.bd}`, fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt3, lineHeight:1.6, fontStyle:"italic", marginBottom:12 }}>
                Preview: {buildSentence({ ...form, id:0 })}
              </div>
            )}

            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <button onClick={() => { setAddingEvent(false); setForm({ ...BLANK_FORM, timestamp:nowHHMM() }); }}
                style={{ padding:"7px 16px", borderRadius:7, border:`1px solid ${T.bd}`, background:"transparent", color:T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:12, cursor:"pointer" }}>
                Cancel
              </button>
              <button onClick={handleAdd} disabled={!form.summary.trim() && !form.participants.trim()}
                style={{ padding:"7px 20px", borderRadius:7, border:"none", background: (!form.summary.trim() && !form.participants.trim()) ? "rgba(42,77,114,.3)" : `linear-gradient(135deg,${currentTypeDef.color},${currentTypeDef.color}bb)`, color: (!form.summary.trim() && !form.participants.trim()) ? T.txt4 : "#050f1e", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, cursor: (!form.summary.trim() && !form.participants.trim()) ? "not-allowed" : "pointer", transition:"all .15s" }}>
                Log Event
              </button>
            </div>
          </div>
        )}

        {/* ── Event timeline ── */}
        {events.length === 0 && !addingEvent && (
          <div style={{ padding:"48px 20px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
            <div style={{ fontSize:36 }}>\uD83D\uDCAC</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:T.txt }}>
              No communications logged yet
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt4, maxWidth:360, lineHeight:1.7 }}>
              Log patient education, family discussions, consultant callbacks, and provider notifications. Every entry auto-generates chart-ready note language.
            </div>
            <button onClick={() => setAddingEvent(true)}
              style={{ padding:"10px 24px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#00e5c0,#00b4d8)", color:"#050f1e", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700, cursor:"pointer", marginTop:4 }}>
              + Log First Communication
            </button>
          </div>
        )}

        {events.length > 0 && (
          <>
            {/* Timeline */}
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {events.map(e => (
                <EventCard key={e.id} event={e} onRemove={handleRemove} />
              ))}
            </div>

            {/* Note export block */}
            <div style={{ padding:"14px 16px", borderRadius:12, background:T.panel, border:"1px solid rgba(0,229,192,.2)", borderTop:"2px solid rgba(0,229,192,.55)", marginTop:4 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10, flexWrap:"wrap", gap:8 }}>
                <div>
                  <span style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700, color:T.teal }}>
                    Generated Note Text
                  </span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4, marginLeft:10 }}>
                    {events.length} event{events.length > 1 ? "s" : ""} \u00b7 ready to copy
                  </span>
                </div>
                <div style={{ display:"flex", gap:7 }}>
                  <button onClick={copyNote}
                    style={{ padding:"5px 13px", borderRadius:6, border:`1px solid ${noteCopied ? "rgba(0,229,192,.4)" : T.bd}`, background: noteCopied ? "rgba(0,229,192,.1)" : "transparent", color: noteCopied ? T.teal : T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600, cursor:"pointer", transition:"all .2s" }}>
                    {noteCopied ? "\u2713 Copied" : "\u29C9 Copy"}
                  </button>
                  {onNoteText && (
                    <button onClick={() => onNoteText(noteBlock)}
                      style={{ padding:"5px 13px", borderRadius:6, border:"none", background:T.teal, color:"#050f1e", fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                      Apply to Note \u2192
                    </button>
                  )}
                </div>
              </div>
              <div style={{ background:T.up, borderRadius:8, padding:"10px 12px", border:`1px solid ${T.bd}`, fontFamily:"'DM Sans',sans-serif", fontSize:11.5, color:T.txt2, lineHeight:1.8, whiteSpace:"pre-wrap" }}>
                {noteBlock}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}