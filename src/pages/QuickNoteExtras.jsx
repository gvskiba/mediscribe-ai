// QuickNoteExtras.jsx
// SDM block, Provider Attestation, Nursing Handoff, Prior Visits panel
// Exported: SDMBlock, AttestationBlock, NursingHandoff, PriorVisitsPanel

import React, { useState } from "react";

// ─── SHARED DECISION MAKING BLOCK ────────────────────────────────────────────
export function SDMBlock({ disposition, patientName }) {
  const [copied, setCopied] = useState(false);
  const [customized, setCustomized] = useState(false);
  const [extra, setExtra] = useState("");

  const baseText = `Shared Decision Making:\nRisks, benefits, and alternatives to ${disposition || "the proposed plan"} were discussed with ${patientName ? "the patient, " + patientName + "," : "the patient"} and/or their representative in clear, understandable language. The patient verbalized understanding of their diagnosis, the recommended treatment plan, the potential complications of the plan, and the reason for the recommended ${disposition?.toLowerCase().includes("admit") ? "admission" : "disposition"}. The patient was given the opportunity to ask questions, all of which were addressed. The patient agreed with the proposed plan.${extra ? "\n" + extra : ""}`;

  const copy = () => {
    navigator.clipboard.writeText(baseText).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ marginBottom:10, padding:"12px 14px", borderRadius:10,
      background:"rgba(59,158,255,.05)", border:"1px solid rgba(59,158,255,.3)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
          color:"var(--qn-blue)", letterSpacing:1, textTransform:"uppercase", flex:1 }}>
          Shared Decision Making
        </span>
        <button onClick={() => setCustomized(c => !c)}
          style={{ padding:"2px 8px", borderRadius:5, cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace", fontSize:7, fontWeight:700,
            border:`1px solid ${customized ? "rgba(59,158,255,.5)" : "rgba(42,79,122,.4)"}`,
            background:"transparent",
            color:customized ? "var(--qn-blue)" : "var(--qn-txt4)",
            letterSpacing:.4, transition:"all .15s" }}>
          {customized ? "▲ Less" : "+ Add Detail"}
        </button>
        <button onClick={copy}
          style={{ padding:"3px 10px", borderRadius:6, cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
            border:`1px solid ${copied ? "rgba(61,255,160,.5)" : "rgba(59,158,255,.4)"}`,
            background:copied ? "rgba(61,255,160,.1)" : "rgba(59,158,255,.08)",
            color:copied ? "var(--qn-green)" : "var(--qn-blue)",
            letterSpacing:.4, transition:"all .15s" }}>
          {copied ? "✓ Copied" : "Copy SDM"}
        </button>
      </div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
        color:"var(--qn-txt2)", lineHeight:1.7, whiteSpace:"pre-wrap" }}>
        {baseText}
      </div>
      {customized && (
        <textarea value={extra} onChange={e => setExtra(e.target.value)}
          rows={2} placeholder="Add additional context (e.g. interpreter used, specific concerns addressed)..."
          style={{ marginTop:8, width:"100%", padding:"6px 9px", borderRadius:7, fontSize:11,
            background:"rgba(14,37,68,.8)", border:"1px solid rgba(59,158,255,.3)",
            color:"var(--qn-txt)", fontFamily:"'DM Sans',sans-serif",
            outline:"none", resize:"vertical", boxSizing:"border-box", lineHeight:1.55 }} />
      )}
      <div style={{ marginTop:6, fontFamily:"'JetBrains Mono',monospace", fontSize:7,
        color:"rgba(59,158,255,.5)", letterSpacing:.4 }}>
        CMS requirement for borderline dispositions — paste into Physician Documentation field
      </div>
    </div>
  );
}

// ─── PROVIDER ATTESTATION BLOCK ───────────────────────────────────────────────
export function AttestationBlock({ providerName, credentials, facility, mdmLevel }) {
  const [copied, setCopied] = useState(false);
  const now = new Date().toLocaleString("en-US", {
    month:"short", day:"numeric", year:"numeric",
    hour:"2-digit", minute:"2-digit"
  });
  const name = [providerName, credentials].filter(Boolean).join(", ");
  const text = `Physician Attestation:\nI personally evaluated this patient, reviewed the history, physical examination, and all available data, and agree with the documentation above. This note accurately reflects my assessment, medical decision making, and the medical necessity for the provided care.\n\nMDM Level: ${mdmLevel || "See MDM section"}\nFacility: ${facility || "Emergency Department"}\n\n${name || "_____________, MD"}\nEmergency Medicine\n${now}`;

  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ marginBottom:10, padding:"12px 14px", borderRadius:10,
      background:"rgba(155,109,255,.05)", border:"1px solid rgba(155,109,255,.3)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
          color:"var(--qn-purple)", letterSpacing:1, textTransform:"uppercase", flex:1 }}>
          Physician Attestation
        </span>
        <button onClick={copy}
          style={{ padding:"3px 10px", borderRadius:6, cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
            border:`1px solid ${copied ? "rgba(61,255,160,.5)" : "rgba(155,109,255,.4)"}`,
            background:copied ? "rgba(61,255,160,.1)" : "rgba(155,109,255,.08)",
            color:copied ? "var(--qn-green)" : "var(--qn-purple)",
            letterSpacing:.4, transition:"all .15s" }}>
          {copied ? "✓ Copied" : "Copy Attestation"}
        </button>
      </div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
        color:"var(--qn-txt2)", lineHeight:1.7, whiteSpace:"pre-wrap" }}>
        {text}
      </div>
      {!providerName && (
        <div style={{ marginTop:6, padding:"5px 8px", borderRadius:6,
          background:"rgba(245,200,66,.07)", border:"1px solid rgba(245,200,66,.25)",
          fontFamily:"'JetBrains Mono',monospace", fontSize:7,
          color:"var(--qn-gold)", letterSpacing:.4 }}>
          Set your name in Settings → User Preferences to auto-populate this block
        </div>
      )}
    </div>
  );
}

// ─── NURSING HANDOFF BLOCK ────────────────────────────────────────────────────
export function NursingHandoff({ patientName, diagnosis, disposition }) {
  const [copied,  setCopied]  = useState(false);
  const [precautions, setPrecautions] = useState(3);
  const [prescriptions, setPrescriptions] = useState("");
  const [followup, setFollowup] = useState("");
  const [expanded, setExpanded] = useState(false);

  const now = new Date().toLocaleString("en-US", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" });

  const text = [
    `Discharge Documentation — ${now}`,
    `Patient: ${patientName || "_______________"}`,
    `Diagnosis: ${diagnosis || "_______________"}`,
    `Disposition: ${disposition || "Discharge"}`,
    "",
    "Discharge instructions reviewed verbally with patient and/or responsible party.",
    `Patient able to verbalize at least ${precautions} return-to-ED precautions.`,
    `Patient understands their diagnosis and follow-up plan.`,
    followup ? `Follow-up: ${followup}` : "",
    prescriptions ? `Prescriptions provided: ${prescriptions}` : "",
    "",
    "Discharge documentation completed. Patient ambulatory at time of discharge.",
  ].filter(Boolean).join("\n");

  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ marginBottom:10, borderRadius:10,
      background:"rgba(61,255,160,.04)", border:"1px solid rgba(61,255,160,.25)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px",
        cursor:"pointer" }} onClick={() => setExpanded(e => !e)}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
          color:"var(--qn-green)", letterSpacing:1, textTransform:"uppercase", flex:1 }}>
          Nursing Handoff / Discharge Documentation
        </span>
        <button onClick={e => { e.stopPropagation(); copy(); }}
          style={{ padding:"3px 10px", borderRadius:6, cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
            border:`1px solid ${copied ? "rgba(61,255,160,.6)" : "rgba(61,255,160,.3)"}`,
            background:copied ? "rgba(61,255,160,.15)" : "transparent",
            color:copied ? "var(--qn-green)" : "rgba(61,255,160,.7)",
            letterSpacing:.4, transition:"all .15s" }}>
          {copied ? "✓ Copied" : "Copy"}
        </button>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:"var(--qn-txt4)" }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div style={{ padding:"0 14px 14px", borderTop:"1px solid rgba(61,255,160,.15)" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:10, marginBottom:8 }}>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                color:"var(--qn-txt4)", letterSpacing:.8, textTransform:"uppercase",
                marginBottom:3 }}>Precautions Verbalized</div>
              <div style={{ display:"flex", gap:5 }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setPrecautions(n)}
                    style={{ padding:"3px 8px", borderRadius:5, cursor:"pointer",
                      fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
                      border:`1px solid ${precautions===n ? "rgba(61,255,160,.5)" : "rgba(42,79,122,.35)"}`,
                      background:precautions===n ? "rgba(61,255,160,.12)" : "transparent",
                      color:precautions===n ? "var(--qn-green)" : "var(--qn-txt4)",
                      transition:"all .12s" }}>{n}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                color:"var(--qn-txt4)", letterSpacing:.8, textTransform:"uppercase",
                marginBottom:3 }}>Follow-up</div>
              <input value={followup} onChange={e => setFollowup(e.target.value)}
                placeholder="e.g. PCP in 3-5 days"
                style={{ width:"100%", padding:"4px 7px", borderRadius:6, fontSize:11,
                  background:"rgba(14,37,68,.8)", border:"1px solid rgba(42,79,122,.4)",
                  color:"var(--qn-txt)", fontFamily:"'DM Sans',sans-serif",
                  outline:"none", boxSizing:"border-box" }} />
            </div>
          </div>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
              color:"var(--qn-txt4)", letterSpacing:.8, textTransform:"uppercase",
              marginBottom:3 }}>Prescriptions Provided</div>
            <input value={prescriptions} onChange={e => setPrescriptions(e.target.value)}
              placeholder="e.g. Amoxicillin 500mg, Ibuprofen 600mg — or leave blank"
              style={{ width:"100%", padding:"4px 7px", borderRadius:6, fontSize:11,
                background:"rgba(14,37,68,.8)", border:"1px solid rgba(42,79,122,.4)",
                color:"var(--qn-txt)", fontFamily:"'DM Sans',sans-serif",
                outline:"none", boxSizing:"border-box" }} />
          </div>
          <div style={{ marginTop:10, padding:"10px 12px", borderRadius:8,
            background:"rgba(14,37,68,.5)", border:"1px solid rgba(42,79,122,.25)",
            fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:"var(--qn-txt2)", lineHeight:1.7, whiteSpace:"pre-wrap" }}>
            {text}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PRIOR VISITS PANEL ───────────────────────────────────────────────────────
export function PriorVisitsPanel({ visits, loading, onLoad }) {
  const [expanded, setExpanded] = useState(false);

  if (!onLoad) return null;

  return (
    <div style={{ marginBottom:10, borderRadius:10,
      background:"rgba(8,22,40,.5)", border:"1px solid rgba(42,79,122,.35)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 14px",
        cursor:"pointer" }}
        onClick={() => { setExpanded(e => !e); if (!expanded && !visits && !loading) onLoad(); }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
          color:"var(--qn-txt4)", letterSpacing:1, textTransform:"uppercase", flex:1 }}>
          📋 Prior Visits
          {visits?.length > 0 && (
            <span style={{ marginLeft:8, color:"var(--qn-blue)" }}>{visits.length} found</span>
          )}
        </span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:"var(--qn-txt4)" }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div style={{ padding:"0 14px 14px", borderTop:"1px solid rgba(42,79,122,.2)" }}>
          {loading && (
            <div style={{ padding:"12px 0", fontFamily:"'DM Sans',sans-serif",
              fontSize:11, color:"var(--qn-txt4)", textAlign:"center" }}>
              Loading prior visits…
            </div>
          )}
          {!loading && (!visits || !visits.length) && (
            <div style={{ padding:"12px 0", fontFamily:"'DM Sans',sans-serif",
              fontSize:11, color:"var(--qn-txt4)", textAlign:"center" }}>
              No prior visits found
            </div>
          )}
          {visits?.map((v, i) => (
            <div key={i} style={{ marginTop:10, padding:"10px 12px", borderRadius:9,
              background:"rgba(14,37,68,.5)",
              border:"1px solid rgba(42,79,122,.3)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  fontWeight:700, color:"var(--qn-txt4)", letterSpacing:.5 }}>
                  {v.encounter_date || "Date unknown"}
                </span>
                {v.disposition && (
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                    color:"var(--qn-txt4)", background:"rgba(42,79,122,.3)",
                    borderRadius:4, padding:"1px 6px" }}>
                    {v.disposition}
                  </span>
                )}
                {i === 0 && (
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                    color:"var(--qn-teal)", background:"rgba(0,229,192,.1)",
                    border:"1px solid rgba(0,229,192,.25)", borderRadius:4, padding:"1px 6px" }}>
                    Most Recent
                  </span>
                )}
              </div>
              {v.cc && (
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                  fontWeight:600, color:"var(--qn-txt2)", marginBottom:3 }}>
                  CC: {v.cc}
                </div>
              )}
              {v.working_diagnosis && (
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                  color:"var(--qn-txt3)" }}>Dx: {v.working_diagnosis}</div>
              )}
              {v.mdm_level && (
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:"var(--qn-txt4)", marginTop:3 }}>MDM: {v.mdm_level}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MDM PLAN ENTRY ───────────────────────────────────────────────────────────
// All 8 speed features:
// 1. AI auto-populate from MDM   5. Dot-shorthand expansion
// 2. Quick-pick AI chips          6. Voice dictation
// 3. Checkbox mode toggle         7. Inline time entry
// 4. Recent plans library         8. Tabbed layout with preview

import { DictationButton, useSmartText } from "./QuickNoteVoice";

// Plan-specific smart text shortcuts
const PLAN_EXPANSIONS = {
  ".iv":    "• IV access established, NS TKO\n",
  ".ivf":   "• NS 1L IV bolus — ordered\n",
  ".ecg":   "• 12-lead ECG — obtained and reviewed\n",
  ".cxr":   "• CXR PA/lateral — ordered\n",
  ".cbc":   "• CBC, BMP ordered\n",
  ".labs":  "• CBC, BMP, troponin, lactate, UA ordered\n",
  ".asa":   "• Aspirin 325mg PO — given\n",
  ".zofran":"• Ondansetron 4mg IV — given\n",
  ".toradol":"• Ketorolac 30mg IV — given\n",
  ".ativan":"• Lorazepam 1mg IV — given\n",
  ".monitor":"• Continuous cardiac monitoring, pulse oximetry, BP q1h\n",
  ".consult":"• Consult placed — awaiting response\n",
  ".repeat":"• Repeat exam in 30 min\n",
  ".npo":   "• NPO\n",
  ".dc":    "• Discussed diagnosis, plan, and return precautions with patient\n",
};

// In-memory recent plans store (session-scoped, last 8 entries)
const recentPlansStore = { treatment:[], actions:[] };
function saveToRecent(type, text) {
  if (!text?.trim()) return;
  const store = recentPlansStore[type];
  const existing = store.findIndex(r => r.text === text.trim());
  if (existing !== -1) store.splice(existing, 1);
  store.unshift({ text:text.trim(), ts:Date.now() });
  if (store.length > 8) store.pop();
}

// Checkbox item component
function CheckItem({ item, onToggle, onTimeChange }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:7, padding:"4px 0" }}>
      <div onClick={() => onToggle(item.id)}
        style={{ width:15, height:15, borderRadius:4, flexShrink:0, cursor:"pointer",
          border:`2px solid ${item.checked ? "var(--qn-teal)" : "rgba(42,79,122,.5)"}`,
          background:item.checked ? "rgba(0,229,192,.2)" : "transparent",
          display:"flex", alignItems:"center", justifyContent:"center",
          transition:"all .12s" }}>
        {item.checked && <span style={{ fontSize:9, color:"var(--qn-teal)", lineHeight:1 }}>✓</span>}
      </div>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
        color:item.checked ? "var(--qn-txt2)" : "var(--qn-txt3)",
        flex:1, lineHeight:1.4,
        textDecoration:item.checked ? "none" : "none" }}>
        {item.label}
        {item.dose && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:"var(--qn-txt4)", marginLeft:6 }}>{item.dose}</span>}
      </span>
      {item.checked && (
        <input type="time" value={item.time||""} onChange={e => onTimeChange(item.id, e.target.value)}
          placeholder="time"
          style={{ width:78, padding:"2px 5px", borderRadius:5, fontSize:9,
            background:"rgba(14,37,68,.8)", border:"1px solid rgba(42,79,122,.4)",
            color:"var(--qn-txt)", fontFamily:"'JetBrains Mono',monospace",
            outline:"none" }} />
      )}
    </div>
  );
}

export function MDMPlanEntry({
  treatmentPlan, setTreatmentPlan,
  actionPlan,    setActionPlan,
  mdmResult,
  interventions,
  onDraftFromMDM, // callback: (treatmentText, actionText) => void
  base44,
}) {
  const [activeTab,      setActiveTab]      = useState("treatment"); // treatment|actions|preview
  const [mode,           setMode]           = useState("text");      // text|checkbox
  const [checkItems,     setCheckItems]     = useState([]);
  const [draftingMDM,    setDraftingMDM]    = useState(false);
  const [draftingChips,  setDraftingChips]  = useState(false);
  const [treatChips,     setTreatChips]     = useState([]);
  const [actionChips,    setActionChips]    = useState([]);
  const [copiedPlan,     setCopiedPlan]     = useState(false);
  const [showRecent,     setShowRecent]     = useState(false);
  const [recentType,     setRecentType]     = useState(null);

  // Smart text wrappers
  const smartTreatment = useSmartText(treatmentPlan, setTreatmentPlan, PLAN_EXPANSIONS);
  const smartActions   = useSmartText(actionPlan,    setActionPlan,    PLAN_EXPANSIONS);

  // ── AI: Draft from MDM ──────────────────────────────────────────────────
  const draftFromMDM = async () => {
    if (!mdmResult || draftingMDM) return;
    setDraftingMDM(true);
    try {
      // Build treatment text from treatment_recommendations
      const treatLines = (mdmResult.treatment_recommendations || []).map(t => {
        const base = t.intervention.replace(/\s*\[(?:Class\s+I{1,3}[ab]?|Expert\s+consensus)\]\s*/gi, "").trim();
        return `• ${base}`;
      });
      // Build action text from recommended_actions + critical_actions
      const actionLines = [
        ...(mdmResult.critical_actions || []).map(a => `• ${a} [CRITICAL]`),
        ...(mdmResult.recommended_actions || []).map(a => `• ${typeof a === "string" ? a : a.action || a}`),
      ];
      const newTreat  = treatLines.join("\n");
      const newAction = actionLines.join("\n");
      setTreatmentPlan(prev => prev ? prev + "\n" + newTreat : newTreat);
      setActionPlan(prev   => prev ? prev + "\n" + newAction : newAction);
      if (onDraftFromMDM) onDraftFromMDM(newTreat, newAction);
    } finally { setDraftingMDM(false); }
  };

  // ── AI: Generate quick-pick chips ───────────────────────────────────────
  const generateChips = async () => {
    if (!mdmResult || draftingChips) return;
    setDraftingChips(true);
    try {
      const schema = {
        type:"object", required:["treatment_chips","action_chips"],
        properties:{
          treatment_chips:{ type:"array", maxItems:8,
            items:{ type:"object", required:["label"],
              properties:{ label:{type:"string"}, dose:{type:"string"} } } },
          action_chips:{ type:"array", maxItems:8,
            items:{ type:"object", required:["label"],
              properties:{ label:{type:"string"} } } },
        },
      };
      const invokeFn = base44?.integrations?.Core?.InvokeLLM;
      if (!invokeFn) return;
      const res = await invokeFn({
        prompt:`Generate quick-pick plan chips for this ED patient.
Working diagnosis: ${mdmResult.working_diagnosis}
MDM level: ${mdmResult.mdm_level}
Critical actions: ${(mdmResult.critical_actions||[]).join("; ")||"none"}
Treatment recs: ${(mdmResult.treatment_recommendations||[]).map(t=>t.intervention).join("; ")||"none"}

treatment_chips: 4-8 specific treatment items the physician will likely ORDER or GIVE.
Each item: label = short name (e.g. "Aspirin 325mg PO"), dose = dose/route if applicable.
Keep labels concise (≤30 chars). Prioritize highest-evidence items first.

action_chips: 4-8 specific diagnostic or workflow ACTIONS.
Each item: label = short action (e.g. "12-lead ECG", "CXR ordered", "Repeat exam 30min").
Keep labels concise (≤30 chars).

Be specific to THIS diagnosis, not generic. JSON only.`,
        response_json_schema: schema,
      });
      setTreatChips(res?.treatment_chips || []);
      setActionChips(res?.action_chips   || []);
    } catch(e) { console.error("Chips failed:", e); }
    finally { setDraftingChips(false); }
  };

  // ── Checkbox mode: build from interventions or chips ────────────────────
  const buildCheckboxItems = () => {
    const base = interventions?.length
      ? interventions.map(i => ({
          id:      i.id || `ci-${Math.random()}`,
          label:   i.name,
          dose:    i.dose_route || "",
          checked: i.confirmed !== false,
          time:    i.time_given || "",
          type:    i.type,
        }))
      : [
          ...(treatChips.length ? treatChips.map((c,i) => ({
            id:`tc-${i}`, label:c.label, dose:c.dose||"", checked:false, time:"", type:"treatment",
          })) : []),
          ...(actionChips.length ? actionChips.map((c,i) => ({
            id:`ac-${i}`, label:c.label, dose:"", checked:false, time:"", type:"action",
          })) : []),
        ];
    setCheckItems(base);
    setMode("checkbox");
  };

  const toggleCheck = (id) =>
    setCheckItems(prev => prev.map(i => i.id===id ? {...i, checked:!i.checked} : i));

  const updateTime = (id, time) =>
    setCheckItems(prev => prev.map(i => i.id===id ? {...i, time} : i));

  // Convert checked items back to text
  const applyCheckboxToText = () => {
    const treatments = checkItems.filter(i => i.checked && i.type!=="action");
    const actions    = checkItems.filter(i => i.checked && i.type==="action");
    const unchecked  = checkItems.filter(i => i.checked && !["treatment","action"].includes(i.type||""));

    const toLine = (i) => {
      let line = `• ${i.label}`;
      if (i.dose)  line += ` — ${i.dose}`;
      if (i.time)  line += ` (${i.time})`;
      return line;
    };

    if (treatments.length || unchecked.length)
      setTreatmentPlan([...treatments, ...unchecked].map(toLine).join("\n"));
    if (actions.length)
      setActionPlan(actions.map(toLine).join("\n"));

    setMode("text");
  };

  // ── Copy plan ────────────────────────────────────────────────────────────
  const copyPlan = () => {
    const lines = [];
    if (treatmentPlan?.trim()) { lines.push("MY TREATMENT PLAN:"); lines.push(treatmentPlan.trim()); lines.push(""); }
    if (actionPlan?.trim())    { lines.push("MY PLAN FOR THIS VISIT:"); lines.push(actionPlan.trim()); }
    if (!lines.length) return;
    const text = lines.join("\n");
    navigator.clipboard.writeText(text).then(() => {
      saveToRecent("treatment", treatmentPlan);
      saveToRecent("actions",   actionPlan);
      setCopiedPlan(true); setTimeout(() => setCopiedPlan(false), 2000);
    });
  };

  // ── Chip append ──────────────────────────────────────────────────────────
  const appendChip = (chip, target) => {
    const line = `• ${chip.label}${chip.dose ? " — " + chip.dose : ""}\n`;
    if (target === "treatment") setTreatmentPlan(prev => (prev||"") + line);
    else                        setActionPlan(prev    => (prev||"") + line);
  };

  // ── Combined preview text ────────────────────────────────────────────────
  const previewText = [
    treatmentPlan?.trim() ? `MY TREATMENT PLAN:\n${treatmentPlan.trim()}` : "",
    actionPlan?.trim()    ? `MY PLAN FOR THIS VISIT:\n${actionPlan.trim()}` : "",
  ].filter(Boolean).join("\n\n");

  const hasContent = !!(treatmentPlan?.trim() || actionPlan?.trim());
  const hasChips   = treatChips.length > 0 || actionChips.length > 0;

  // ── Shared textarea style ────────────────────────────────────────────────
  const taStyle = {
    width:"100%", padding:"8px 10px", borderRadius:9, resize:"vertical",
    background:"rgba(14,37,68,.75)", border:"1px solid rgba(0,229,192,.25)",
    color:"var(--qn-txt)", fontFamily:"'JetBrains Mono',monospace",
    fontSize:10, outline:"none", boxSizing:"border-box", lineHeight:1.65,
    transition:"border-color .15s",
  };

  return (
    <div style={{ marginTop:12, borderRadius:10,
      background:"rgba(0,229,192,.04)", border:"1px solid rgba(0,229,192,.2)" }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center", gap:6,
        padding:"10px 14px", borderBottom:"1px solid rgba(0,229,192,.12)",
        flexWrap:"wrap" }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
          color:"var(--qn-teal)", letterSpacing:1.2, textTransform:"uppercase", flex:1 }}>
          My Clinical Plan
        </span>

        {/* AI Draft from MDM */}
        <button onClick={draftFromMDM} disabled={!mdmResult || draftingMDM}
          title="Pre-fill from AI treatment recommendations"
          style={{ padding:"3px 10px", borderRadius:6, cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
            border:`1px solid ${draftingMDM ? "rgba(42,79,122,.3)" : "rgba(0,229,192,.4)"}`,
            background:draftingMDM ? "rgba(14,37,68,.4)" : "rgba(0,229,192,.1)",
            color:draftingMDM ? "var(--qn-txt4)" : "var(--qn-teal)",
            letterSpacing:.4, transition:"all .15s" }}>
          {draftingMDM ? "● …" : "✦ Draft from MDM"}
        </button>

        {/* Generate chips */}
        <button onClick={generateChips} disabled={!mdmResult || draftingChips}
          title="Generate quick-pick chips for this diagnosis"
          style={{ padding:"3px 10px", borderRadius:6, cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
            border:`1px solid ${draftingChips ? "rgba(42,79,122,.3)" : "rgba(155,109,255,.4)"}`,
            background:draftingChips ? "rgba(14,37,68,.4)" : "rgba(155,109,255,.08)",
            color:draftingChips ? "var(--qn-txt4)" : "var(--qn-purple)",
            letterSpacing:.4, transition:"all .15s" }}>
          {draftingChips ? "● …" : "⊞ Chips"}
        </button>

        {/* Checkbox mode toggle */}
        <button onClick={() => mode === "checkbox" ? applyCheckboxToText() : buildCheckboxItems()}
          style={{ padding:"3px 10px", borderRadius:6, cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
            border:`1px solid ${mode==="checkbox" ? "rgba(245,200,66,.5)" : "rgba(42,79,122,.4)"}`,
            background:mode==="checkbox" ? "rgba(245,200,66,.12)" : "transparent",
            color:mode==="checkbox" ? "var(--qn-gold)" : "var(--qn-txt4)",
            letterSpacing:.4, transition:"all .15s" }}>
          {mode === "checkbox" ? "✓ Apply" : "☑ Checklist"}
        </button>

        {/* Copy */}
        {hasContent && (
          <button onClick={copyPlan}
            style={{ padding:"3px 10px", borderRadius:6, cursor:"pointer",
              fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
              border:`1px solid ${copiedPlan ? "rgba(61,255,160,.5)" : "rgba(0,229,192,.35)"}`,
              background:copiedPlan ? "rgba(61,255,160,.1)" : "transparent",
              color:copiedPlan ? "var(--qn-green)" : "var(--qn-teal)",
              letterSpacing:.4, transition:"all .15s" }}>
            {copiedPlan ? "✓ Copied" : "Copy"}
          </button>
        )}
      </div>

      {/* ── Quick-pick chips ────────────────────────────────────────────── */}
      {hasChips && (
        <div style={{ padding:"8px 14px 0",
          borderBottom:"1px solid rgba(0,229,192,.08)" }}>
          {treatChips.length > 0 && (
            <div style={{ marginBottom:6 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                color:"var(--qn-teal)", letterSpacing:.8, textTransform:"uppercase",
                marginBottom:4 }}>Treatment Quick-Pick</div>
              <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                {treatChips.map((c, i) => (
                  <button key={i} onClick={() => appendChip(c, "treatment")}
                    style={{ padding:"3px 9px", borderRadius:6, cursor:"pointer",
                      fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:10,
                      border:"1px solid rgba(0,229,192,.3)",
                      background:"rgba(0,229,192,.07)", color:"var(--qn-txt2)",
                      transition:"all .12s", whiteSpace:"nowrap" }}
                    onMouseEnter={e => { e.currentTarget.style.background="rgba(0,229,192,.18)"; e.currentTarget.style.color="var(--qn-txt)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background="rgba(0,229,192,.07)"; e.currentTarget.style.color="var(--qn-txt2)"; }}>
                    + {c.label}{c.dose ? ` (${c.dose})` : ""}
                  </button>
                ))}
              </div>
            </div>
          )}
          {actionChips.length > 0 && (
            <div style={{ marginBottom:8 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                color:"var(--qn-blue)", letterSpacing:.8, textTransform:"uppercase",
                marginBottom:4 }}>Action Quick-Pick</div>
              <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                {actionChips.map((c, i) => (
                  <button key={i} onClick={() => appendChip(c, "action")}
                    style={{ padding:"3px 9px", borderRadius:6, cursor:"pointer",
                      fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:10,
                      border:"1px solid rgba(59,158,255,.3)",
                      background:"rgba(59,158,255,.07)", color:"var(--qn-txt2)",
                      transition:"all .12s", whiteSpace:"nowrap" }}
                    onMouseEnter={e => { e.currentTarget.style.background="rgba(59,158,255,.18)"; e.currentTarget.style.color="var(--qn-txt)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background="rgba(59,158,255,.07)"; e.currentTarget.style.color="var(--qn-txt2)"; }}>
                    + {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:0, padding:"0 14px",
        borderBottom:"1px solid rgba(0,229,192,.1)", marginTop:10 }}>
        {[
          { id:"treatment", label:"Treatment" },
          { id:"actions",   label:"Actions"   },
          { id:"preview",   label:"Both ↗"    },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            style={{ padding:"6px 14px", cursor:"pointer",
              fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
              border:"none", borderBottom:`2px solid ${activeTab===id ? "var(--qn-teal)" : "transparent"}`,
              background:"transparent",
              color:activeTab===id ? "var(--qn-teal)" : "var(--qn-txt4)",
              letterSpacing:.5, transition:"all .15s", marginBottom:-1 }}>
            {label}
          </button>
        ))}
        <div style={{ flex:1 }} />
        {/* Shorthand hint */}
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
          color:"rgba(42,79,122,.5)", alignSelf:"center", letterSpacing:.3 }}>
          .iv .ecg .labs .zofran .monitor…
        </span>
      </div>

      {/* ── Checkbox mode ────────────────────────────────────────────────── */}
      {mode === "checkbox" && (
        <div style={{ padding:"10px 14px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {["treatment","action",""].map(type => {
              const items = checkItems.filter(i =>
                type === "" ? !["treatment","action"].includes(i.type||"") : i.type===type
              );
              if (!items.length) return null;
              const label = type==="treatment" ? "Treatments" : type==="action" ? "Actions" : "Interventions";
              const color = type==="treatment" ? "var(--qn-teal)" : type==="action" ? "var(--qn-blue)" : "var(--qn-gold)";
              return (
                <div key={type||"other"}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                    color, letterSpacing:.8, textTransform:"uppercase", marginBottom:5 }}>
                    {label}
                  </div>
                  {items.map(item => (
                    <CheckItem key={item.id} item={item}
                      onToggle={toggleCheck} onTimeChange={updateTime} />
                  ))}
                </div>
              );
            })}
          </div>
          <button onClick={applyCheckboxToText}
            style={{ marginTop:10, padding:"5px 14px", borderRadius:7, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:11,
              border:"1px solid rgba(245,200,66,.4)", background:"rgba(245,200,66,.1)",
              color:"var(--qn-gold)", transition:"all .15s" }}>
            ✓ Apply Checked Items to Plan
          </button>
        </div>
      )}

      {/* ── Text mode: tabbed fields ─────────────────────────────────────── */}
      {mode === "text" && (
        <div style={{ padding:"10px 14px" }}>

          {/* Treatment tab */}
          {activeTab === "treatment" && (
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                  color:"var(--qn-txt4)", flex:1 }}>
                  Document what you will order or administer
                </span>
                <DictationButton fieldLabel="Treatment Plan"
                  onTranscript={t => setTreatmentPlan(p => (p?p+"\n":"")+t)} />
                {recentPlansStore.treatment.length > 0 && (
                  <button onClick={() => { setRecentType("treatment"); setShowRecent(r=>!r); }}
                    style={{ padding:"2px 8px", borderRadius:5, cursor:"pointer",
                      fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                      border:"1px solid rgba(42,79,122,.4)", background:"transparent",
                      color:"var(--qn-txt4)", letterSpacing:.3 }}>
                    Recent ▾
                  </button>
                )}
              </div>
              {showRecent && recentType==="treatment" && (
                <div style={{ marginBottom:7, padding:"6px 8px", borderRadius:8,
                  background:"rgba(14,37,68,.8)", border:"1px solid rgba(42,79,122,.35)",
                  display:"flex", flexDirection:"column", gap:3 }}>
                  {recentPlansStore.treatment.map((r, i) => (
                    <button key={i}
                      onClick={() => { setTreatmentPlan(r.text); setShowRecent(false); }}
                      style={{ textAlign:"left", padding:"4px 7px", borderRadius:5,
                        background:"transparent", border:"none", cursor:"pointer",
                        fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                        color:"var(--qn-txt3)", lineHeight:1.4,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {r.text.slice(0, 60)}{r.text.length>60?"…":""}
                    </button>
                  ))}
                </div>
              )}
              <textarea value={treatmentPlan} onChange={e => smartTreatment(e.target.value)}
                rows={5} placeholder={"• NS 1L IV bolus — ordered\n• Ondansetron 4mg IV — given\n• Troponin x2 q3h — pending\n\nType .iv .zofran .ecg .labs for shortcuts · 🎤 to dictate"}
                style={taStyle}
                onFocus={e => e.target.style.borderColor="rgba(0,229,192,.5)"}
                onBlur={e  => e.target.style.borderColor="rgba(0,229,192,.25)"} />
            </div>
          )}

          {/* Actions tab */}
          {activeTab === "actions" && (
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                  color:"var(--qn-txt4)", flex:1 }}>
                  Workup ordered, consults placed, and next steps
                </span>
                <DictationButton fieldLabel="Actions"
                  onTranscript={t => setActionPlan(p => (p?p+"\n":"")+t)} />
                {recentPlansStore.actions.length > 0 && (
                  <button onClick={() => { setRecentType("actions"); setShowRecent(r=>!r); }}
                    style={{ padding:"2px 8px", borderRadius:5, cursor:"pointer",
                      fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                      border:"1px solid rgba(42,79,122,.4)", background:"transparent",
                      color:"var(--qn-txt4)", letterSpacing:.3 }}>
                    Recent ▾
                  </button>
                )}
              </div>
              {showRecent && recentType==="actions" && (
                <div style={{ marginBottom:7, padding:"6px 8px", borderRadius:8,
                  background:"rgba(14,37,68,.8)", border:"1px solid rgba(42,79,122,.35)",
                  display:"flex", flexDirection:"column", gap:3 }}>
                  {recentPlansStore.actions.map((r, i) => (
                    <button key={i}
                      onClick={() => { setActionPlan(r.text); setShowRecent(false); }}
                      style={{ textAlign:"left", padding:"4px 7px", borderRadius:5,
                        background:"transparent", border:"none", cursor:"pointer",
                        fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                        color:"var(--qn-txt3)", lineHeight:1.4,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {r.text.slice(0, 60)}{r.text.length>60?"…":""}
                    </button>
                  ))}
                </div>
              )}
              <textarea value={actionPlan} onChange={e => smartActions(e.target.value)}
                rows={5} placeholder={"• 12-lead ECG — done\n• CXR PA/LAT — ordered\n• Cardiology consult placed\n• Repeat exam in 30 min\n\nType .consult .repeat .cxr .monitor for shortcuts · 🎤 to dictate"}
                style={taStyle}
                onFocus={e => e.target.style.borderColor="rgba(0,229,192,.5)"}
                onBlur={e  => e.target.style.borderColor="rgba(0,229,192,.25)"} />
            </div>
          )}

          {/* Preview tab — combined copy preview */}
          {activeTab === "preview" && (
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                color:"var(--qn-txt4)", letterSpacing:.8, textTransform:"uppercase",
                marginBottom:6 }}>
                Copy Preview — exactly what pastes into the chart
              </div>
              {previewText ? (
                <div style={{ padding:"10px 12px", borderRadius:9, whiteSpace:"pre-wrap",
                  background:"rgba(14,37,68,.6)", border:"1px solid rgba(42,79,122,.3)",
                  fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--qn-txt2)",
                  lineHeight:1.75, minHeight:100 }}>
                  {previewText}
                </div>
              ) : (
                <div style={{ padding:"20px", textAlign:"center",
                  fontFamily:"'DM Sans',sans-serif", fontSize:11,
                  color:"var(--qn-txt4)", fontStyle:"italic" }}>
                  No plan entered yet — switch to Treatment or Actions tabs to begin
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ padding:"0 14px 10px", fontFamily:"'JetBrains Mono',monospace",
        fontSize:7, color:"rgba(0,229,192,.3)", letterSpacing:.4 }}>
        Included in Copy MDM and Copy Initial Note · Evidence class labels stripped from chart copy
      </div>
    </div>
  );
}