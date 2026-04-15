// ShiftHandoffGenerator.jsx — P1 rebuild
// Auto-populates I-PASS from full encounter context on mount.
// Physician edits pre-populated content — does not author from scratch.
//
// Yale JAMA Network Open 2024: handoffs add ~33% more EHR time per encounter.
// Auto-population reduces authoring to editing.
//
// I-PASS: Illness Severity · Patient Summary · Action List
//         Situation Awareness · Synthesis by Receiver
//
// Props: demo, cc, vitals, medications, allergies, pmhSelected,
//        rosState, peState, peFindings, mdmState,
//        esiLevel, registration, sdoh, consults,
//        disposition, dispReason, dispTime, doorTime,
//        providerName, onAdvance, onToast
//
// Constraints: no form, no localStorage, no router, straight quotes only,
//   single react import, border before borderTop/etc.,
//   finally { setBusy(false) } on all async functions

import { useState, useEffect, useCallback, useMemo } from "react";

const T = {
  bg:"#050f1e",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444",
};

// ── Derivation helpers ────────────────────────────────────────────────────────

function deriveIllnessSeverity(vitals, esiLevel, disposition) {
  const hr   = parseFloat(vitals?.hr   || 0);
  const sbp  = parseFloat((vitals?.bp  || "").split("/")[0]) || 0;
  const spo2 = parseFloat(vitals?.spo2 || 0);
  const rr   = parseFloat(vitals?.rr   || 0);
  const esi  = parseInt(esiLevel || 3);
  const disp = (disposition || "").toLowerCase();
  const critV = (hr > 130 || hr < 40) || (sbp > 0 && sbp < 80) ||
                (spo2 > 0 && spo2 < 88) || rr > 30;
  if (esi === 1 || disp === "cath_lab" || disp === "or" || critV) return "unstable";
  const abnV = hr > 110 || (sbp > 0 && sbp < 90) ||
               (spo2 > 0 && spo2 < 93) || rr > 24;
  if (esi === 2 || disp === "admit" || disp === "obs" || abnV) return "watcher";
  return "stable";
}

function buildSummary(demo, cc, vitals, pmhSelected, peFindings, mdmState) {
  const age = demo?.age ? `${demo.age}yo` : "";
  const sex = demo?.sex || "";
  const pt  = [age, sex].filter(Boolean).join(" ");
  const ccT = cc?.text || "unknown complaint";
  const pmh = (pmhSelected || []).slice(0, 4).join(", ");
  const vs  = [
    vitals?.hr   && `HR ${vitals.hr}`,
    vitals?.bp   && `BP ${vitals.bp}`,
    vitals?.spo2 && `SpO2 ${vitals.spo2}%`,
    vitals?.temp && parseFloat(vitals.temp) > 38.2 && `T ${vitals.temp}C`,
  ].filter(Boolean).join(", ");
  const dx = mdmState?.workingDiagnosis || mdmState?.primaryDx || "";
  return [
    `${pt || "Patient"} presenting with ${ccT}.`,
    pmh    ? `PMH: ${pmh}.` : "",
    vs     ? `Vitals: ${vs}.` : "",
    dx     ? `Working Dx: ${dx}.` : "",
  ].filter(Boolean).join(" ").trim();
}

function buildActionList(vitals, disposition, consults, medications) {
  const acts = [];
  const sbp  = parseFloat((vitals?.bp || "").split("/")[0]) || 0;
  const spo2 = parseFloat(vitals?.spo2 || 0);
  const disp = (disposition || "").toLowerCase();
  if (sbp > 0 && sbp < 90) acts.push("[ ] Monitor blood pressure — hypotensive on arrival");
  if (spo2 > 0 && spo2 < 93) acts.push("[ ] Reassess respiratory status and O2 requirement");
  if (disp === "admit" || disp === "obs")
    acts.push("[ ] Await bed assignment and notify receiving team");
  if (disp === "transfer")
    acts.push("[ ] Confirm transfer acceptance and arrange transport");
  if (disp === "discharge")
    acts.push("[ ] Discharge when stable and instructions complete");
  (consults || [])
    .filter(c => c.specialty || c.service)
    .forEach(c => acts.push(`[ ] Await ${c.specialty || c.service} consult response`));
  if (acts.length === 0) {
    acts.push("[ ] Await pending lab and imaging results");
    acts.push("[ ] Reassess at [time]");
  }
  return acts.join("\n");
}

function buildContingency(vitals, cc, disposition) {
  const plans = [];
  const ccT  = (cc?.text || "").toLowerCase();
  const sbp  = parseFloat((vitals?.bp || "").split("/")[0]) || 0;
  const spo2 = parseFloat(vitals?.spo2 || 0);
  const hr   = parseFloat(vitals?.hr   || 0);
  if (sbp > 0 && sbp < 100)
    plans.push("If SBP drops below 80: 500 mL NS bolus, notify senior, consider vasopressors");
  if (spo2 > 0 && spo2 < 95)
    plans.push("If SpO2 drops below 90%: escalate O2 delivery, consider BIPAP/intubation");
  if (hr > 120)
    plans.push("If HR remains >130: obtain 12-lead EKG, consider cardiology notification");
  if (/chest|angina|acs/.test(ccT))
    plans.push("If worsening chest pain or new EKG changes: activate cath lab, repeat troponin");
  if (/stroke|neuro|weakness|aphasia/.test(ccT))
    plans.push("If new neurologic deficits: repeat NIHSS, urgent neurology notification");
  if (/sepsis|infect|fever/.test(ccT))
    plans.push("If hemodynamic deterioration: reassess fluids, escalate per sepsis protocol");
  if (/overdose|ingestion|tox/.test(ccT))
    plans.push("If mental status declines: reassess airway, contact poison control");
  if (/seiz|epilep/.test(ccT))
    plans.push("If repeat seizure: lorazepam 2 mg IV/IM, monitor airway, neurology");
  if (!plans.length) {
    plans.push("If clinical deterioration: notify senior physician immediately");
    plans.push("If patient requests to leave: complete capacity assessment and AMA documentation");
  }
  return plans.map((p, i) => `${i + 1}. ${p}`).join("\n");
}

const SEV = {
  stable:   { label:"Stable",   color:T.teal,  emoji:"🟢", desc:"No immediate concerns" },
  watcher:  { label:"Watcher",  color:T.gold,  emoji:"🟡", desc:"Potential for deterioration — monitor closely" },
  unstable: { label:"Unstable", color:T.coral, emoji:"🔴", desc:"Active resuscitation or critical intervention" },
};

export default function ShiftHandoffGenerator({
  demo, cc, vitals, medications, allergies, pmhSelected,
  rosState, peState, peFindings, mdmState,
  esiLevel, registration, sdoh, consults,
  disposition, dispReason, dispTime, doorTime,
  providerName, onAdvance, onToast,
}) {
  const [severity,  setSeverity]   = useState("stable");
  const [summary,   setSummary]    = useState("");
  const [actions,   setActions]    = useState("");
  const [contPlan,  setContPlan]   = useState("");
  const [synthesis, setSynthesis]  = useState(false);
  const [ready,     setReady]      = useState(false);
  const [edited,    setEdited]     = useState({});
  const [copied,    setCopied]     = useState(false);
  const [polishing, setPolishing]  = useState({});
  const [aiBusy,    setAiBusy]     = useState(false);

  // ── Auto-populate on mount — physician edits, never authors from scratch ──
  useEffect(() => {
    setSeverity(deriveIllnessSeverity(vitals, esiLevel, disposition));
    setSummary(buildSummary(demo, cc, vitals, pmhSelected, peFindings, mdmState));
    setActions(buildActionList(vitals, disposition, consults, medications));
    setContPlan(buildContingency(vitals, cc, disposition));
    setReady(true);
  }, []); // runs once on mount

  // ── LOS ──────────────────────────────────────────────────────────────────
  const los = useMemo(() => {
    if (!doorTime) return null;
    const m = doorTime.match(/(\d{1,2}):(\d{2})/);
    if (!m) return null;
    const d = new Date();
    d.setHours(parseInt(m[1]), parseInt(m[2]), 0, 0);
    const min = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
    const h = Math.floor(min / 60), mm = min % 60;
    return { min, display: h > 0 ? `${h}h ${mm}m` : `${mm}m` };
  }, [doorTime]);

  const losc = los ? (los.min >= 300 ? T.coral : los.min >= 180 ? T.gold : T.teal) : T.teal;

  // ── Full note string ──────────────────────────────────────────────────────
  const fullNote = useMemo(() => {
    const pt  = [demo?.age && `${demo.age}yo`, demo?.sex].filter(Boolean).join(" ");
    const mrn = registration?.mrn || demo?.mrn || "";
    const now = new Date().toLocaleString();
    const name = providerName ? `Handoff from Dr. ${providerName}` : "Shift Handoff Note";
    const sevC = SEV[severity] || SEV.stable;
    return [
      `${name}${pt ? " — " + pt : ""}${mrn ? " (MRN: " + mrn + ")" : ""}`,
      doorTime ? `Door: ${doorTime}${los ? "  |  LOS: " + los.display : ""}` : "",
      `Generated: ${now}`,
      "",
      "── I: ILLNESS SEVERITY ─────────────────────────────",
      `${sevC.emoji} ${sevC.label.toUpperCase()} — ${sevC.desc}`,
      "",
      "── P: PATIENT SUMMARY ──────────────────────────────",
      summary,
      "",
      "── A: ACTION LIST ──────────────────────────────────",
      actions,
      "",
      "── S: SITUATION AWARENESS & CONTINGENCY PLANS ──────",
      contPlan,
      "",
      "── S: SYNTHESIS ────────────────────────────────────",
      synthesis
        ? "Oncoming provider acknowledged receipt and read back key information."
        : "[ ] Pending read-back from oncoming provider",
      "",
      dispTime    ? `Disposition time: ${dispTime}` : "",
      disposition ? `Disposition: ${disposition.toUpperCase()}` : "",
    ].filter(l => l !== null && l !== undefined).join("\n").trim();
  }, [demo, registration, providerName, doorTime, los, severity,
      summary, actions, contPlan, synthesis, dispTime, disposition]);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(fullNote).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      onToast?.("Handoff copied to clipboard", "success");
    });
  }, [fullNote, onToast]);

  // ── AI polish single field ────────────────────────────────────────────────
  const polishField = useCallback(async (key, val, setter) => {
    setPolishing(p => ({ ...p, [key]:true }));
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "anthropic-dangerous-direct-browser-access":"true",
        },
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:400,
          system:"You are an emergency physician polishing an I-PASS handoff field. Improve clarity and clinical precision. Return ONLY the improved text — no explanation. Preserve format ([ ] for action lists, numbered for contingency plans).",
          messages:[{
            role:"user",
            content:`Field: ${key}\nPatient CC: ${cc?.text || ""}\nDisposition: ${disposition || ""}\n\nCurrent:\n${val}\n\nPolish this.`,
          }],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const improved = data.content?.find(b => b.type === "text")?.text || val;
      setter(improved);
      setEdited(p => ({ ...p, [key]:true }));
    } catch (e) {
      onToast?.("Polish error — " + (e.message || "API"), "error");
    } finally {
      setPolishing(p => ({ ...p, [key]:false }));
    }
  }, [cc, disposition, onToast]);

  // ── AI full regeneration ──────────────────────────────────────────────────
  const regenerate = useCallback(async () => {
    setAiBusy(true);
    try {
      const pt  = [demo?.age && `${demo.age}yo`, demo?.sex].filter(Boolean).join(" ");
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "anthropic-dangerous-direct-browser-access":"true",
        },
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:'You are an emergency physician writing an I-PASS shift handoff. Return ONLY valid JSON with keys: "patient_summary", "action_list", "contingency". No markdown. Action list uses [ ] format. Contingency uses numbered if/then statements.',
          messages:[{
            role:"user",
            content:`Generate I-PASS handoff.
Patient: ${pt || "unknown"}
CC: ${cc?.text || "not recorded"}
Vitals: HR ${vitals?.hr || "?"} BP ${vitals?.bp || "?"} SpO2 ${vitals?.spo2 || "?"}% T ${vitals?.temp || "?"}
PMH: ${(pmhSelected || []).join(", ") || "none"}
Meds: ${(medications || []).map(m => typeof m === "string" ? m : m.name || "").filter(Boolean).slice(0, 5).join(", ") || "none"}
Disposition: ${disposition || "unknown"}${dispReason ? " — " + dispReason : ""}
Consults: ${(consults || []).map(c => c.specialty || c.service || "").filter(Boolean).join(", ") || "none"}
${mdmState?.workingDiagnosis ? "Working Dx: " + mdmState.workingDiagnosis : ""}`,
          }],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const raw    = data.content?.find(b => b.type === "text")?.text || "{}";
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      if (parsed.patient_summary) setSummary(parsed.patient_summary);
      if (parsed.action_list)     setActions(parsed.action_list);
      if (parsed.contingency)     setContPlan(parsed.contingency);
      onToast?.("Handoff regenerated", "success");
    } catch (e) {
      onToast?.("AI error — " + (e.message || "API"), "error");
    } finally {
      setAiBusy(false);
    }
  }, [demo, cc, vitals, pmhSelected, medications, disposition,
      dispReason, consults, mdmState, onToast]);

  const mark = key => setEdited(p => ({ ...p, [key]:true }));
  const sevC = SEV[severity] || SEV.stable;
  const editCount = Object.keys(edited).length;
  const pt = [demo?.age && `${demo.age}yo`, demo?.sex].filter(Boolean).join(" ");
  const mrn = registration?.mrn || demo?.mrn || "";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14,
      fontFamily:"'DM Sans',sans-serif", color:T.txt }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center",
        justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontFamily:"'Playfair Display',serif",
            fontWeight:700, fontSize:15, color:T.blue }}>
            I-PASS Shift Handoff
          </span>
          {ready && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.teal, letterSpacing:1.5, textTransform:"uppercase",
              background:"rgba(0,229,192,0.1)",
              border:"1px solid rgba(0,229,192,0.3)",
              borderRadius:4, padding:"2px 8px" }}>
              Auto-populated
            </span>
          )}
          {editCount > 0 && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.gold, letterSpacing:1,
              background:"rgba(245,200,66,0.1)",
              border:"1px solid rgba(245,200,66,0.3)",
              borderRadius:4, padding:"2px 7px" }}>
              {editCount} field{editCount !== 1 ? "s" : ""} edited
            </span>
          )}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          {los && (
            <div style={{ display:"flex", alignItems:"center", gap:5,
              padding:"3px 10px", borderRadius:20,
              background:`${losc}0d`, border:`1px solid ${losc}35` }}>
              <div style={{ width:5, height:5, borderRadius:"50%", background:losc }} />
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:9, fontWeight:700, color:losc }}>
                LOS {los.display}
              </span>
            </div>
          )}
          <button onClick={regenerate} disabled={aiBusy}
            style={{ display:"flex", alignItems:"center", gap:5,
              fontFamily:"'DM Sans',sans-serif", fontWeight:600,
              fontSize:11, padding:"5px 13px", borderRadius:8,
              cursor:aiBusy ? "not-allowed" : "pointer",
              border:"1px solid rgba(155,109,255,0.4)",
              background:"rgba(155,109,255,0.1)",
              color:aiBusy ? T.txt4 : T.purple }}>
            <span>🧠</span>
            {aiBusy ? "Generating..." : "AI Regenerate"}
          </button>
          <button onClick={copy}
            style={{ display:"flex", alignItems:"center", gap:5,
              fontFamily:"'DM Sans',sans-serif", fontWeight:600,
              fontSize:11, padding:"5px 13px", borderRadius:8,
              cursor:"pointer",
              border:`1px solid ${copied ? T.green + "66" : "rgba(42,79,122,0.4)"}`,
              background:copied ? "rgba(61,255,160,0.1)" : "rgba(42,79,122,0.12)",
              color:copied ? T.green : T.txt4 }}>
            {copied ? "✓ Copied" : "Copy Note"}
          </button>
        </div>
      </div>

      {/* Patient strip */}
      {(pt || mrn || cc?.text) && (
        <div style={{ display:"flex", alignItems:"center", gap:8,
          padding:"6px 12px", borderRadius:8, flexWrap:"wrap",
          background:"rgba(14,37,68,0.55)",
          border:"1px solid rgba(26,53,85,0.45)" }}>
          {pt  && <span style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:10, fontWeight:700, color:T.txt2 }}>{pt}</span>}
          {mrn && <span style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:9, color:T.txt4 }}>MRN {mrn}</span>}
          {cc?.text && <span style={{ fontFamily:"'DM Sans',sans-serif",
            fontSize:11, color:T.txt3 }}>· {cc.text}</span>}
          {disposition && (
            <span style={{ marginLeft:"auto",
              fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              letterSpacing:1, textTransform:"uppercase",
              color:T.orange, background:"rgba(255,159,67,0.1)",
              border:"1px solid rgba(255,159,67,0.3)",
              borderRadius:4, padding:"1px 7px" }}>
              {disposition}
            </span>
          )}
        </div>
      )}

      {/* ── I: Illness Severity ───────────────────────────────────────────── */}
      <div style={{ padding:"12px 14px", borderRadius:10,
        background:`${sevC.color}09`,
        border:`1px solid ${sevC.color}35`,
        borderLeft:`4px solid ${sevC.color}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
          <div style={{ width:24, height:24, borderRadius:"50%",
            background:sevC.color, display:"flex",
            alignItems:"center", justifyContent:"center",
            fontFamily:"'Playfair Display',serif",
            fontWeight:900, fontSize:12, color:"#050f1e" }}>I</div>
          <span style={{ fontFamily:"'Playfair Display',serif",
            fontWeight:700, fontSize:14, color:sevC.color }}>
            Illness Severity
          </span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1, marginLeft:4 }}>
            Auto-derived · click to override
          </span>
        </div>
        <div style={{ display:"flex", gap:7 }}>
          {Object.entries(SEV).map(([key, cfg]) => (
            <button key={key} onClick={() => setSeverity(key)}
              style={{ flex:1, display:"flex", flexDirection:"column",
                alignItems:"center", gap:5, padding:"10px 8px",
                borderRadius:9, cursor:"pointer", transition:"all .15s",
                border:`1px solid ${severity === key ? cfg.color + "77" : cfg.color + "22"}`,
                background:severity === key ? `${cfg.color}18` : `${cfg.color}07` }}>
              <span style={{ fontSize:20 }}>{cfg.emoji}</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700,
                fontSize:12, color:severity === key ? cfg.color : T.txt4 }}>
                {cfg.label}
              </span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9,
                color:severity === key ? cfg.color : T.txt4,
                textAlign:"center", lineHeight:1.4 }}>
                {cfg.desc}
              </span>
              {severity === key && (
                <div style={{ height:2, width:20, borderRadius:1, background:cfg.color }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── P, A, S fields ────────────────────────────────────────────────── */}
      {[
        { key:"summary",  letter:"P", title:"Patient Summary",
          color:T.purple, value:summary,  setter:setSummary,  rows:4,
          hint:"Demographics · CC · key findings · plan" },
        { key:"actions",  letter:"A", title:"Action List",
          color:T.orange, value:actions,  setter:setActions,  rows:5,
          hint:"[ ] pending task format" },
        { key:"contPlan", letter:"S", title:"Situation Awareness & Contingency Plans",
          color:T.coral,  value:contPlan, setter:setContPlan, rows:4,
          hint:"Numbered if/then contingency statements" },
      ].map(f => (
        <div key={f.key} style={{ padding:"12px 14px", borderRadius:10,
          background:`${f.color}07`,
          border:`1px solid ${edited[f.key] ? f.color + "44" : f.color + "25"}`,
          borderLeft:`4px solid ${f.color}` }}>
          <div style={{ display:"flex", alignItems:"center",
            justifyContent:"space-between", marginBottom:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:24, height:24, borderRadius:"50%",
                background:f.color, display:"flex",
                alignItems:"center", justifyContent:"center",
                fontFamily:"'Playfair Display',serif",
                fontWeight:900, fontSize:12, color:"#050f1e",
                flexShrink:0 }}>{f.letter}</div>
              <div>
                <div style={{ fontFamily:"'Playfair Display',serif",
                  fontWeight:700, fontSize:13, color:f.color }}>
                  {f.title}
                </div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:8, color:T.txt4, marginTop:1 }}>
                  {f.hint}
                  {edited[f.key] && (
                    <span style={{ color:T.gold, marginLeft:8 }}>· edited</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => polishField(f.key, f.value, f.setter)}
              disabled={polishing[f.key] || !f.value.trim()}
              style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                letterSpacing:1, textTransform:"uppercase",
                padding:"3px 9px", borderRadius:6, cursor:"pointer",
                border:`1px solid ${f.color}44`,
                background:`${f.color}0d`,
                color:polishing[f.key] ? T.txt4 : f.color }}>
              {polishing[f.key] ? "✨ Polishing..." : "✨ Polish"}
            </button>
          </div>
          <textarea value={f.value}
            onChange={e => { f.setter(e.target.value); mark(f.key); }}
            rows={f.rows}
            style={{ width:"100%", resize:"vertical",
              background:"rgba(8,22,40,0.65)",
              border:`1px solid ${edited[f.key]
                ? f.color + "44" : "rgba(26,53,85,0.45)"}`,
              borderRadius:8, padding:"9px 11px", outline:"none",
              fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:T.txt, lineHeight:1.65 }} />
        </div>
      ))}

      {/* ── S: Synthesis ──────────────────────────────────────────────────── */}
      <div style={{ padding:"12px 14px", borderRadius:10,
        background:"rgba(0,229,192,0.06)",
        border:`1px solid ${synthesis ? "rgba(0,229,192,0.4)" : "rgba(0,229,192,0.2)"}`,
        borderLeft:"4px solid " + T.teal }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
          <div style={{ width:24, height:24, borderRadius:"50%",
            background:T.teal, display:"flex",
            alignItems:"center", justifyContent:"center",
            fontFamily:"'Playfair Display',serif",
            fontWeight:900, fontSize:12, color:"#050f1e" }}>S</div>
          <span style={{ fontFamily:"'Playfair Display',serif",
            fontWeight:700, fontSize:13, color:T.teal }}>
            Synthesis by Receiver
          </span>
        </div>
        <button onClick={() => setSynthesis(p => !p)}
          style={{ display:"flex", alignItems:"center", gap:9,
            cursor:"pointer", border:"none",
            background:"transparent", textAlign:"left", width:"100%" }}>
          <div style={{ width:20, height:20, borderRadius:5, flexShrink:0,
            border:`2px solid ${synthesis ? T.teal : "rgba(42,79,122,0.5)"}`,
            background:synthesis ? T.teal : "transparent",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            {synthesis && (
              <span style={{ color:"#050f1e", fontSize:10, fontWeight:900 }}>✓</span>
            )}
          </div>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
            color:synthesis ? T.teal : T.txt3 }}>
            {synthesis
              ? "Oncoming provider acknowledged receipt and read back key information"
              : "Mark when oncoming provider has read back key information"}
          </span>
        </button>
      </div>

      {/* ── Footer / advance ──────────────────────────────────────────────── */}
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"center", flexWrap:"wrap", gap:10,
        padding:"10px 14px", borderRadius:10,
        background:synthesis ? "rgba(61,255,160,0.06)" : "rgba(14,37,68,0.5)",
        border:`1px solid ${synthesis ? "rgba(61,255,160,0.3)" : "rgba(26,53,85,0.35)"}` }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
          color:synthesis ? T.green : T.txt4 }}>
          {synthesis
            ? "✓ Handoff complete — all I-PASS elements documented"
            : "Complete I-PASS elements and confirm read-back to finish"}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={copy}
            style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
              fontSize:12, padding:"7px 16px", borderRadius:9,
              cursor:"pointer",
              border:`1px solid ${copied ? T.green + "66" : "rgba(42,79,122,0.45)"}`,
              background:copied ? "rgba(61,255,160,0.1)" : "rgba(42,79,122,0.12)",
              color:copied ? T.green : T.txt4 }}>
            {copied ? "✓ Copied" : "Copy Note"}
          </button>
          {onAdvance && (
            <button onClick={onAdvance}
              style={{ padding:"8px 20px", borderRadius:9,
                background:"linear-gradient(135deg,#00e5c0,#00b4d8)",
                border:"none", color:"#050f1e",
                fontFamily:"'DM Sans',sans-serif",
                fontWeight:700, fontSize:13, cursor:"pointer" }}>
              Discharge Instructions &#9654;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}