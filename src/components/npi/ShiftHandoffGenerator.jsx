// ShiftHandoffGenerator.jsx
// AI-assembled structured handoff note using I-PASS framework.
// Pulls from full encounter state — works as case "handoff" enhancement
// or standalone within HandoffTab.
//
// I-PASS: Illness severity, Patient summary, Action list,
//         Situation awareness, Synthesis by receiver
//
// Props:
//   demo, cc, vitals, vitalsHistory, medications, allergies,
//   pmhSelected, rosState, peState, peFindings,
//   mdmState, consults, disposition, dispReason, dispTime,
//   esiLevel, registration, sdoh, sepsisBundle,
//   providerName, doorTime, onToast
//
// Constraints: no form, no localStorage, no router, straight quotes only,
//   single react import, border before borderTop/etc.,
//   finally { setBusy(false) } on async functions

import { useState, useCallback, useMemo } from "react";

const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444", cyan:"#0dd4ff",
};

// ── I-PASS severity levels ────────────────────────────────────────────────────
const SEVERITY_LEVELS = [
  { id:"stable",   label:"Stable",           color:T.teal,   icon:"🟢",
    desc:"Anticipated clinical course; no urgent actions needed" },
  { id:"watcher",  label:"Watcher",          color:T.gold,   icon:"🟡",
    desc:"Potential to deteriorate; specific triggers to watch for" },
  { id:"unstable", label:"Unstable",         color:T.coral,  icon:"🔴",
    desc:"Uncertain prognosis; active management required" },
];

// ── Pending item types ────────────────────────────────────────────────────────
const PENDING_TYPES = [
  { id:"result",    label:"Pending Result",     color:T.blue   },
  { id:"consult",   label:"Pending Consult",    color:T.purple },
  { id:"procedure", label:"Pending Procedure",  color:T.orange },
  { id:"action",    label:"Action Required",    color:T.coral  },
  { id:"family",    label:"Family/Communication",color:T.gold  },
];

// ── Assemble context for AI ───────────────────────────────────────────────────
function buildHandoffContext(props) {
  const {
    demo, cc, vitals, medications, allergies, pmhSelected,
    mdmState, consults, disposition, dispReason, esiLevel,
    providerName, doorTime, pendingItems, severity,
  } = props;

  const lines = [];
  const demoLine = [demo?.age ? demo.age + "yo" : "", demo?.sex || ""].filter(Boolean).join(" ");
  if (demoLine) lines.push(`Patient: ${demoLine}`);
  if (demo?.firstName || demo?.lastName)
    lines.push(`Name: ${[demo.firstName, demo.lastName].filter(Boolean).join(" ")}`);
  if (esiLevel)  lines.push(`ESI: ${esiLevel}`);
  if (doorTime)  lines.push(`Arrival: ${doorTime}`);
  if (cc?.text)  lines.push(`CC: ${cc.text}`);

  const vs = [];
  if (vitals?.hr)   vs.push(`HR ${vitals.hr}`);
  if (vitals?.bp)   vs.push(`BP ${vitals.bp}`);
  if (vitals?.rr)   vs.push(`RR ${vitals.rr}`);
  if (vitals?.spo2) vs.push(`SpO2 ${vitals.spo2}%`);
  if (vitals?.temp) vs.push(`T ${vitals.temp}C`);
  if (vs.length) lines.push(`Vitals: ${vs.join("  ")}`);

  const pmh = (pmhSelected||[]).slice(0,6);
  if (pmh.length) lines.push(`PMH: ${pmh.join(", ")}`);

  const meds = (medications||[])
    .map(m => typeof m === "string" ? m : m.name||"")
    .filter(Boolean).slice(0,6);
  if (meds.length) lines.push(`Meds: ${meds.join(", ")}`);

  const alls = (allergies||[])
    .map(a => typeof a === "string" ? a : a.name||"")
    .filter(Boolean).join(", ");
  if (alls) lines.push(`Allergies: ${alls || "NKDA"}`);

  if (mdmState?.narrative?.trim())
    lines.push(`MDM/Assessment: ${mdmState.narrative.slice(0, 600)}${mdmState.narrative.length > 600 ? "..." : ""}`);

  const cons = (consults||[]).map(c => c.service||c.name||c.specialty).filter(Boolean);
  if (cons.length) lines.push(`Consults: ${cons.join(", ")}`);

  if (disposition) lines.push(`Planned Disposition: ${disposition}${dispReason ? " — " + dispReason : ""}`);

  if (pendingItems?.length)
    lines.push(`Pending: ${pendingItems.map(p => `[${p.type}] ${p.text}`).join("; ")}`);

  lines.push(`Illness Severity (I-PASS): ${severity || "not set"}`);
  lines.push(`Outgoing provider: ${providerName || "[provider]"}`);

  return lines.join("\n");
}

// ── Pending item row ───────────────────────────────────────────────────────────
function PendingRow({ item, onRemove }) {
  const pt = PENDING_TYPES.find(t => t.id === item.type) || PENDING_TYPES[0];
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8,
      padding:"5px 9px", borderRadius:7, marginBottom:4,
      background:`${pt.color}09`,
      border:`1px solid ${pt.color}28` }}>
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
        fontWeight:700, color:pt.color, letterSpacing:0.5,
        flexShrink:0 }}>{pt.label}</span>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
        color:T.txt2, flex:1 }}>{item.text}</span>
      {item.contingency && (
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
          color:T.txt4, fontStyle:"italic" }}>
          If: {item.contingency}
        </span>
      )}
      <button onClick={onRemove}
        style={{ background:"none", border:"none", color:T.txt4,
          cursor:"pointer", fontSize:11, padding:"1px 3px",
          flexShrink:0 }}>✕</button>
    </div>
  );
}

// ── IPASS section card ────────────────────────────────────────────────────────
function IPassCard({ letter, title, color, content }) {
  if (!content) return null;
  return (
    <div style={{ padding:"11px 13px", borderRadius:9, marginBottom:9,
      background:"rgba(8,22,40,0.65)",
      border:`1px solid ${color}35`,
      borderLeft:`4px solid ${color}` }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
        <div style={{ width:28, height:28, borderRadius:6, flexShrink:0,
          background:`${color}18`, border:`1px solid ${color}44`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontFamily:"'JetBrains Mono',monospace", fontSize:14,
          fontWeight:700, color }}>
          {letter}
        </div>
        <span style={{ fontFamily:"'Playfair Display',serif",
          fontWeight:700, fontSize:13, color }}>{title}</span>
      </div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
        color:T.txt2, lineHeight:1.75, whiteSpace:"pre-wrap" }}>
        {content}
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function ShiftHandoffGenerator({
  demo, cc, vitals, vitalsHistory, medications, allergies,
  pmhSelected, rosState, peState, peFindings,
  mdmState, consults, disposition, dispReason, dispTime,
  esiLevel, registration, sdoh, sepsisBundle,
  providerName, doorTime, onToast,
}) {
  const [severity,       setSeverity]       = useState("stable");
  const [pendingItems,   setPendingItems]   = useState([]);
  const [newPendType,    setNewPendType]    = useState("result");
  const [newPendText,    setNewPendText]    = useState("");
  const [newPendConting, setNewPendConting] = useState("");
  const [receivingDoc,   setReceivingDoc]   = useState("");
  const [busy,           setBusy]           = useState(false);
  const [result,         setResult]         = useState(null);
  const [error,          setError]          = useState(null);
  const [copied,         setCopied]         = useState(false);

  // ── Format toggle — I-PASS (default) or SBAR ─────────────────────────────
  const [format, setFormat] = useState("ipass"); // "ipass" | "sbar"

  // ── Section selector — controls what context is sent to AI ───────────────
  const [sections, setSections] = useState({
    demographics: true, vitals: true, meds: true, pmh: true,
    mdm: true, consults: true, disposition: true, pending: true,
  });
  const toggleSec = (id) => setSections(p => ({ ...p, [id]: !p[id] }));

  const SECTION_CHIPS = [
    { id:"demographics", label:"Demographics" },
    { id:"vitals",       label:"Vitals"       },
    { id:"meds",         label:"Meds/Allergies"},
    { id:"pmh",          label:"PMH"          },
    { id:"mdm",          label:"MDM"          },
    { id:"consults",     label:"Consults"     },
    { id:"disposition",  label:"Disposition"  },
    { id:"pending",      label:"Pending Items"},
  ];

  const sevConfig = SEVERITY_LEVELS.find(s => s.id === severity);

  // ── Add pending item ────────────────────────────────────────────────────────
  const addPending = useCallback(() => {
    if (!newPendText.trim()) return;
    setPendingItems(p => [...p, {
      id: Date.now(), type:newPendType,
      text:newPendText.trim(),
      contingency:newPendConting.trim(),
    }]);
    setNewPendText(""); setNewPendConting("");
  }, [newPendType, newPendText, newPendConting]);

  // ── Generate handoff ────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      // Build context respecting section toggles
      const ctxProps = {
        demo:         sections.demographics ? demo        : {},
        cc:           sections.demographics ? cc         : {},
        vitals:       sections.vitals        ? vitals     : {},
        medications:  sections.meds          ? medications: [],
        allergies:    sections.meds          ? allergies  : [],
        pmhSelected:  sections.pmh           ? pmhSelected: [],
        mdmState:     sections.mdm           ? mdmState   : null,
        consults:     sections.consults      ? consults   : [],
        disposition:  sections.disposition   ? disposition: "",
        dispReason:   sections.disposition   ? dispReason : "",
        esiLevel,
        providerName, doorTime,
        pendingItems: sections.pending ? pendingItems : [],
        severity,
      };
      const ctx = buildHandoffContext(ctxProps);

      // ── System prompt branches by format ──────────────────────────────────
      const ipassSystem = `You are generating a structured I-PASS emergency department shift handoff. Be clinically precise, actionable, and concise. Do not pad with unnecessary details.

Respond ONLY with valid JSON, no markdown fences:
{
  "i_illness_severity": "One sentence: severity level and its basis",
  "p_patient_summary": "Concise clinical narrative: who is this patient, what happened, what was found, what was done. 3-5 sentences.",
  "a_action_list": "Numbered list of specific actions still needed. Format as: 1. [Action] — [responsible party or timing]. Include all pending items.",
  "s_situation_awareness": "Key contingencies — If X occurs, then do Y. What could go wrong and what should be done. Specific triggers and responses.",
  "synthesis_note": "One sentence summary for verbal read-back by the receiving provider",
  "critical_values": "Any lab, imaging, or vital sign thresholds that require immediate action — omit section if none",
  "code_status": "Document code status and surrogate if known — omit if not documented"
}`;

      const sbarSystem = `You are generating a structured SBAR emergency department handoff for physician-to-physician communication. Be clinically precise and concise.

Respond ONLY with valid JSON, no markdown fences:
{
  "situation": "1-2 sentences: patient identity, chief complaint, current severity, and immediate issue",
  "background": "2-3 sentences: relevant PMH, current medications, allergies, pertinent history contributing to this presentation",
  "assessment": "2-3 sentences: current clinical status, key exam and investigation findings, working diagnosis and differential",
  "recommendation": "Numbered list of specific actions, pending items, and disposition plan. Format as: 1. [Action] — [timing/owner]",
  "synthesis_note": "One sentence read-back summary for verbal confirmation by receiving provider"
}`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "anthropic-dangerous-direct-browser-access":"true",
        },
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1800,
          system: format === "sbar" ? sbarSystem : ipassSystem,
          messages:[{
            role:"user",
            content:`Generate ${format === "sbar" ? "SBAR" : "I-PASS"} handoff for:\n\n${ctx}`,
          }],
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const raw = data.content?.find(b => b.type === "text")?.text || "{}";
      setResult(JSON.parse(raw.replace(/```json|```/g, "").trim()));
      onToast?.("Handoff generated", "success");
    } catch (e) {
      setError("Error: " + (e.message || "Check API connectivity"));
      onToast?.("Handoff generation failed", "error");
    } finally {
      setBusy(false);
    }
  }, [demo, cc, vitals, medications, allergies, pmhSelected,
      mdmState, consults, disposition, dispReason, esiLevel,
      providerName, doorTime, pendingItems, severity,
      sections, format, onToast]);

  // ── Copy full handoff ───────────────────────────────────────────────────────
  const copyHandoff = useCallback(() => {
    if (!result) return;
    const ts      = new Date().toLocaleString("en-US", { hour12:false });
    const demoLine = [demo?.age ? demo.age + "yo" : "", demo?.sex || ""].filter(Boolean).join(" ");
    const patLine  = [demo?.firstName, demo?.lastName].filter(Boolean).join(" ") || "Patient";

    let text;
    if (format === "sbar") {
      text = [
        "SBAR SHIFT HANDOFF",
        `${ts}  ·  ${providerName || "Provider"} → ${receivingDoc || "[Receiving Provider]"}`,
        `Patient: ${patLine}${demoLine ? " (" + demoLine + ")" : ""}  ·  ESI ${esiLevel || "?"}  ·  Arrival ${doorTime || "—"}`,
        "═".repeat(60),
        "",
        "S — SITUATION",
        result.situation,
        "",
        "B — BACKGROUND",
        result.background,
        "",
        "A — ASSESSMENT",
        result.assessment,
        "",
        "R — RECOMMENDATION",
        result.recommendation,
        result.synthesis_note ? "\nSYNTHESIS\n" + result.synthesis_note : "",
        "",
        "═".repeat(60),
      ].filter(s => s !== null).join("\n");
    } else {
      text = [
        "I-PASS SHIFT HANDOFF",
        `${ts}  ·  ${providerName || "Provider"} → ${receivingDoc || "[Receiving Provider]"}`,
        `Patient: ${patLine}${demoLine ? " (" + demoLine + ")" : ""}  ·  ESI ${esiLevel || "?"}  ·  Arrival ${doorTime || "—"}`,
        "═".repeat(60),
        "",
        `I — ILLNESS SEVERITY: ${sevConfig?.icon || ""} ${sevConfig?.label?.toUpperCase() || ""}`,
        result.i_illness_severity,
        "",
        "P — PATIENT SUMMARY",
        result.p_patient_summary,
        "",
        "A — ACTION LIST",
        result.a_action_list,
        "",
        "S — SITUATION AWARENESS",
        result.s_situation_awareness,
        result.critical_values ? "\nCRITICAL VALUES\n" + result.critical_values : "",
        result.code_status     ? "\nCODE STATUS\n"     + result.code_status     : "",
        "",
        "SYNTHESIS",
        result.synthesis_note,
        "",
        "═".repeat(60),
      ].filter(s => s !== null).join("\n");
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      onToast?.("Handoff copied", "success");
    });
  }, [result, format, demo, providerName, receivingDoc, esiLevel,
      doorTime, sevConfig, onToast]);

  // ── Context summary ─────────────────────────────────────────────────────────
  const hasContext = Boolean(cc?.text || mdmState?.narrative || demo?.age);

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", color:T.txt }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center",
        gap:10, marginBottom:12, flexWrap:"wrap" }}>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Playfair Display',serif",
            fontWeight:700, fontSize:16, color:T.teal }}>
            Shift Handoff Generator
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
            color:T.txt4, marginTop:1 }}>
            {format === "sbar" ? "SBAR framework" : "I-PASS framework"} · AI-assembled · Pending items tracker
          </div>
        </div>

        {/* Format toggle */}
        <div style={{ display:"flex", gap:0, borderRadius:7, overflow:"hidden", border:"1px solid rgba(42,79,122,0.45)", flexShrink:0 }}>
          {[["ipass","I-PASS"],["sbar","SBAR"]].map(([key, lbl]) => (
            <button key={key}
              onClick={() => { if (!result) setFormat(key); }}
              title={result ? "Reset handoff to change format" : ""}
              style={{ padding:"5px 14px", border:"none",
                cursor: result ? "not-allowed" : "pointer",
                fontFamily:"'DM Sans',sans-serif", fontSize:11,
                fontWeight: format===key ? 700 : 400,
                background: format===key ? "rgba(0,229,192,0.14)" : "transparent",
                color: format===key ? T.teal : T.txt4,
                borderLeft: key==="sbar" ? "1px solid rgba(42,79,122,0.4)" : "none",
                transition:"all .12s", opacity: result ? 0.55 : 1 }}>
              {lbl}
            </button>
          ))}
        </div>

        {result && (
          <div style={{ display:"flex", gap:7 }}>
            <button onClick={copyHandoff}
              style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                fontSize:11, padding:"6px 14px", borderRadius:7,
                cursor:"pointer", transition:"all .15s",
                border:`1px solid ${copied ? T.green+"66" : "rgba(42,79,122,0.4)"}`,
                background:copied ? "rgba(61,255,160,0.1)" : "rgba(42,79,122,0.15)",
                color:copied ? T.green : T.txt4 }}>
              {copied ? "✓ Copied" : "Copy Handoff"}
            </button>
            <button onClick={() => setResult(null)}
              style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                padding:"6px 10px", borderRadius:7, cursor:"pointer",
                border:"1px solid rgba(42,79,122,0.35)",
                background:"transparent", color:T.txt4,
                letterSpacing:1, textTransform:"uppercase" }}>
              Reset
            </button>
          </div>
        )}
      </div>

      {/* ── Setup panel (pre-generate) ───────────────────────────────────────── */}
      {!result && (
        <div>
          {/* Section selector */}
          <div style={{ padding:"9px 12px", borderRadius:8, marginBottom:10,
            background:"rgba(8,22,40,0.55)", border:"1px solid rgba(42,79,122,0.35)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.txt4, letterSpacing:"1.2px", textTransform:"uppercase", flexShrink:0 }}>
                Include:
              </span>
              {SECTION_CHIPS.map(s => {
                const on = sections[s.id];
                return (
                  <button key={s.id} onClick={() => toggleSec(s.id)}
                    style={{ padding:"3px 10px", borderRadius:20, cursor:"pointer",
                      border:`1px solid ${on ? "rgba(0,229,192,0.38)" : "rgba(42,79,122,0.4)"}`,
                      background: on ? "rgba(0,229,192,0.09)" : "transparent",
                      color: on ? T.teal : T.txt4,
                      fontFamily:"'DM Sans',sans-serif", fontSize:10,
                      fontWeight: on ? 600 : 400, whiteSpace:"nowrap",
                      transition:"all .12s" }}>
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Context strip */}
          <div style={{ padding:"8px 12px", borderRadius:8, marginBottom:10,
            background:"rgba(8,22,40,0.6)",
            border:`1px solid ${hasContext ? "rgba(0,212,255,0.25)" : "rgba(42,79,122,0.3)"}` }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10.5,
              color:hasContext ? T.cyan : T.txt4 }}>
              {hasContext

                ? "⚡ Encounter data loaded — CC, vitals, MDM, consults, and disposition will be included"
                : "⚠ Limited encounter data — complete CC and MDM for a complete handoff"}
            </div>
          </div>

          {/* Severity selector */}
          <div style={{ marginBottom:12 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
              marginBottom:7 }}>I — Illness Severity</div>
            <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
              {SEVERITY_LEVELS.map(lv => (
                <button key={lv.id} onClick={() => setSeverity(lv.id)}
                  style={{ flex:"1 1 160px", padding:"10px 12px",
                    borderRadius:9, cursor:"pointer", textAlign:"left",
                    transition:"all .15s",
                    border:`1px solid ${severity===lv.id ? lv.color+"66" : "rgba(26,53,85,0.4)"}`,
                    background:severity===lv.id
                      ? `linear-gradient(135deg,${lv.color}18,rgba(8,22,40,0.95))`
                      : "rgba(8,22,40,0.55)" }}>
                  <div style={{ display:"flex", alignItems:"center",
                    gap:7, marginBottom:3 }}>
                    <span style={{ fontSize:16 }}>{lv.icon}</span>
                    <span style={{ fontFamily:"'Playfair Display',serif",
                      fontWeight:700, fontSize:13,
                      color:severity===lv.id ? lv.color : T.txt3 }}>
                      {lv.label}
                    </span>
                  </div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                    color:T.txt4 }}>{lv.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Pending items */}
          <div style={{ marginBottom:12 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
              marginBottom:7 }}>A — Pending Actions & Results</div>

            {pendingItems.map((item, i) => (
              <PendingRow key={item.id} item={item}
                onRemove={() => setPendingItems(p => p.filter(x => x.id !== item.id))} />
            ))}

            {/* Add new pending item */}
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:6 }}>
              {/* Type selector */}
              <div style={{ position:"relative", flexShrink:0 }}>
                <select value={newPendType}
                  onChange={e => setNewPendType(e.target.value)}
                  style={{ padding:"7px 24px 7px 9px",
                    background:"rgba(14,37,68,0.75)",
                    border:"1px solid rgba(42,79,122,0.4)",
                    borderRadius:7, outline:"none",
                    appearance:"none", WebkitAppearance:"none",
                    fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                    color:PENDING_TYPES.find(t=>t.id===newPendType)?.color||T.txt,
                    cursor:"pointer", letterSpacing:0.5 }}>
                  {PENDING_TYPES.map(pt => (
                    <option key={pt.id} value={pt.id}>{pt.label}</option>
                  ))}
                </select>
                <span style={{ position:"absolute", right:8, top:"50%",
                  transform:"translateY(-50%)", color:T.txt4,
                  fontSize:8, pointerEvents:"none" }}>▼</span>
              </div>
              <input value={newPendText}
                onChange={e => setNewPendText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addPending()}
                placeholder="e.g. troponin 3h, CT read, ortho callback..."
                style={{ flex:2, minWidth:160, padding:"7px 10px",
                  background:"rgba(14,37,68,0.7)",
                  border:"1px solid rgba(42,79,122,0.4)",
                  borderRadius:7, outline:"none",
                  fontFamily:"'DM Sans',sans-serif", fontSize:12,
                  color:T.txt }} />
              <input value={newPendConting}
                onChange={e => setNewPendConting(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addPending()}
                placeholder="If positive → (optional)"
                style={{ flex:1, minWidth:130, padding:"7px 10px",
                  background:"rgba(14,37,68,0.7)",
                  border:"1px solid rgba(42,79,122,0.35)",
                  borderRadius:7, outline:"none",
                  fontFamily:"'DM Sans',sans-serif", fontSize:11,
                  color:T.txt4 }} />
              <button onClick={addPending}
                style={{ padding:"7px 14px", borderRadius:7, cursor:"pointer",
                  border:"1px solid rgba(0,212,255,0.4)",
                  background:"rgba(0,212,255,0.08)", color:T.cyan,
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                  fontSize:12 }}>+ Add</button>
            </div>
          </div>

          {/* Receiving provider */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
              marginBottom:4 }}>Receiving Provider (optional)</div>
            <input value={receivingDoc}
              onChange={e => setReceivingDoc(e.target.value)}
              placeholder="Name of oncoming physician or PA"
              style={{ width:"100%", padding:"7px 10px",
                background:"rgba(14,37,68,0.7)",
                border:"1px solid rgba(42,79,122,0.4)",
                borderRadius:7, outline:"none",
                fontFamily:"'DM Sans',sans-serif", fontSize:12,
                color:T.txt }} />
          </div>

          {/* Generate button */}
          <button onClick={handleGenerate} disabled={busy}
            style={{ width:"100%", padding:"11px 0", borderRadius:10,
              cursor:busy ? "not-allowed" : "pointer",
              border:`1px solid ${busy ? "rgba(42,79,122,0.3)" : "rgba(0,212,255,0.5)"}`,
              background:busy
                ? "rgba(42,79,122,0.15)"
                : "linear-gradient(135deg,rgba(0,212,255,0.18),rgba(0,212,255,0.06))",
              color:busy ? T.txt4 : T.cyan,
              fontFamily:"'DM Sans',sans-serif", fontWeight:700,
              fontSize:13, transition:"all .15s" }}>
            {busy ? "⚙ Assembling handoff..." : format === "sbar" ? "🤝 Generate SBAR Handoff" : "🤝 Generate I-PASS Handoff"}
          </button>

          {error && (
            <div style={{ padding:"8px 12px", borderRadius:8, marginTop:8,
              background:"rgba(255,107,107,0.08)",
              border:"1px solid rgba(255,107,107,0.3)",
              fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:T.coral }}>{error}</div>
          )}
        </div>
      )}

      {/* ── Output ──────────────────────────────────────────────────────────── */}
      {result && (
        <div>
          {/* Provider/time badge */}
          <div style={{ display:"flex", alignItems:"center", gap:10,
            padding:"10px 14px", borderRadius:9, marginBottom:12,
            background:`${sevConfig?.color||T.teal}10`,
            border:`1px solid ${sevConfig?.color||T.teal}44` }}>
            <span style={{ fontSize:20 }}>{format === "sbar" ? "📋" : sevConfig?.icon}</span>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif",
                fontWeight:700, fontSize:14,
                color:sevConfig?.color||T.teal }}>
                {format === "sbar" ? "SBAR" : sevConfig?.label}
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:10, color:T.txt4, marginTop:1 }}>
                {providerName && `${providerName} → `}
                {receivingDoc || "Oncoming provider"}
                {" · "}
                {new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", hour12:false })}
              </div>
            </div>
          </div>

          {/* ── SBAR output ── */}
          {format === "sbar" && (
            <>
              <IPassCard letter="S" title="Situation"    color={T.coral}  content={result.situation}       />
              <IPassCard letter="B" title="Background"   color={T.blue}   content={result.background}      />
              <IPassCard letter="A" title="Assessment"   color={T.gold}   content={result.assessment}      />
              <IPassCard letter="R" title="Recommendation" color={T.purple} content={result.recommendation} />
              {result.synthesis_note && (
                <div style={{ padding:"10px 14px", borderRadius:9,
                  background:"rgba(0,229,192,0.07)",
                  border:"1px solid rgba(0,229,192,0.3)" }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    color:T.teal, letterSpacing:1.5, textTransform:"uppercase",
                    marginBottom:6 }}>Synthesis — Read Back</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13,
                    color:T.txt, lineHeight:1.75, fontStyle:"italic" }}>
                    "{result.synthesis_note}"
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── I-PASS output ── */}
          {format === "ipass" && (
            <>
              <IPassCard letter="I" title="Illness Severity"
                color={sevConfig?.color||T.teal}
                content={result.i_illness_severity} />
              <IPassCard letter="P" title="Patient Summary"
                color={T.blue}
                content={result.p_patient_summary} />
              <IPassCard letter="A" title="Action List"
                color={T.orange}
                content={result.a_action_list} />
              <IPassCard letter="S" title="Situation Awareness & Contingency Planning"
                color={T.coral}
                content={result.s_situation_awareness} />

              {result.critical_values && (
                <div style={{ padding:"8px 12px", borderRadius:8, marginBottom:9,
                  background:"rgba(255,68,68,0.07)",
                  border:"1px solid rgba(255,68,68,0.3)" }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    color:T.red, letterSpacing:1.5, textTransform:"uppercase",
                    marginBottom:4 }}>Critical Values / Thresholds</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    color:T.txt2, lineHeight:1.65 }}>{result.critical_values}</div>
                </div>
              )}

              {result.code_status && (
                <div style={{ padding:"8px 12px", borderRadius:8, marginBottom:9,
                  background:"rgba(42,79,122,0.1)",
                  border:"1px solid rgba(42,79,122,0.3)" }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
                    marginBottom:4 }}>Code Status</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    color:T.txt2 }}>{result.code_status}</div>
                </div>
              )}

              {result.synthesis_note && (
                <div style={{ padding:"10px 14px", borderRadius:9,
                  background:"rgba(0,212,255,0.07)",
                  border:"1px solid rgba(0,212,255,0.3)" }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    color:T.cyan, letterSpacing:1.5, textTransform:"uppercase",
                    marginBottom:6 }}>Synthesis — Read Back</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13,
                    color:T.txt, lineHeight:1.75, fontStyle:"italic" }}>
                    "{result.synthesis_note}"
                  </div>
                </div>
              )}
            </>
          )}

          <div style={{ textAlign:"center", marginTop:12 }}>
            <button onClick={() => setResult(null)}
              style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                fontSize:11, padding:"6px 18px", borderRadius:8,
                cursor:"pointer",
                border:"1px solid rgba(42,79,122,0.4)",
                background:"transparent", color:T.txt4 }}>
              ↺ New Handoff
            </button>
          </div>
        </div>
      )}
    </div>
  );
}