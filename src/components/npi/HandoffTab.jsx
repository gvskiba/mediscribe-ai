import { useState } from "react";

// Literature: I-PASS reduced information loss 75%→37.5% in pediatric ED (AHRQ 2023)
// SBAR (Situation-Background-Assessment-Recommendation) — ISBAR variant widely used in
// acute care nursing and physician handoffs; Joint Commission endorsed.

// ── Section config ────────────────────────────────────────────────────────────
const SECTION_DEFS = [
  { id:"demographics",  label:"Demographics",  icon:"👤" },
  { id:"vitals",        label:"Vitals",         icon:"📊" },
  { id:"meds",          label:"Meds / Allergies", icon:"💊" },
  { id:"pmh",           label:"PMH",            icon:"📋" },
  { id:"ros",           label:"ROS",            icon:"🔍" },
  { id:"pe",            label:"Physical Exam",  icon:"🩺" },
  { id:"consults",      label:"Consults",       icon:"👥" },
  { id:"disposition",   label:"Disposition",   icon:"🏥" },
  { id:"sdoh",          label:"SDOH",           icon:"🌐" },
];

export default function HandoffTab({ demo, cc, vitals, medications, allergies, pmhSelected,
  rosState, peState, peFindings, esiLevel, registration, sdoh, consults,
  disposition, dispReason, onAdvance }) {

  const patientName = [demo.firstName, demo.lastName].filter(Boolean).join(" ") || "New Patient";
  const pmhList     = Object.keys(pmhSelected || {}).filter(k => pmhSelected[k]);

  // ── Section selector state ────────────────────────────────────────────────
  const [sections, setSections] = useState({
    demographics: true, vitals: true, meds: true, pmh: true,
    ros: true, pe: true, consults: true, disposition: true, sdoh: false,
  });
  const toggleSection = (id) => setSections(p => ({ ...p, [id]: !p[id] }));

  // ── Format state ──────────────────────────────────────────────────────────
  const [format, setFormat] = useState("ipass"); // "ipass" | "sbar"

  // ── I-PASS field state ────────────────────────────────────────────────────
  const [severity,       setSeverity]       = useState(esiLevel<=2?"Critical":esiLevel===3?"Serious":"Stable");
  const [patientSummary, setPatientSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [actions,        setActions]        = useState([]);
  const [actionInput,    setActionInput]    = useState("");
  const [situation,      setSituation]      = useState("");
  const [synthesis,      setSynthesis]      = useState("");
  const [handoffDone,    setHandoffDone]    = useState(false);

  // ── SBAR field state ──────────────────────────────────────────────────────
  const [sbarSituation,      setSbarSituation]      = useState("");
  const [sbarBackground,     setSbarBackground]     = useState("");
  const [sbarAssessment,     setSbarAssessment]     = useState("");
  const [sbarRecommendation, setSbarRecommendation] = useState("");
  const [sbarLoading,        setSbarLoading]        = useState(false);

  // ── Build context string respecting section toggles ───────────────────────
  function buildContext() {
    const META_SKIP = ["_remainderNeg","_remainderNormal","_mode","_visual"];
    const rosPos = Object.entries(rosState||{})
      .filter(([k,v]) => !META_SKIP.includes(k) && v==="has-positives").map(([k])=>k);
    const peAbnLines = Object.entries(peState||{})
      .filter(([k,v]) => !META_SKIP.includes(k) && (v==="abnormal"||v==="has-positives"||v==="mixed"))
      .map(([k]) => {
        const sf = peFindings?.[k];
        const findings = sf ? Object.entries(sf.findings||{}).filter(([,v])=>v==="abnormal").map(([f])=>f.replace(/-/g," ")).join(", ") : "";
        const note = sf?.note?.trim() || "";
        return `${k}${findings ? ": "+findings : ""}${note ? " ("+note+")" : ""}`;
      }).join("; ") || "none";

    const parts = [];
    if (sections.demographics) {
      parts.push(`Patient: ${patientName}, ${demo.age||"?"}y ${demo.sex||""}.`);
      parts.push(`CC: ${cc.text||"not documented"}.`);
      if (registration?.room) parts.push(`Room ${registration.room}.`);
    }
    if (sections.vitals) {
      parts.push(`Vitals: BP ${vitals.bp||"-"} HR ${vitals.hr||"-"} SpO2 ${vitals.spo2||"-"} T ${vitals.temp||"-"}.`);
    }
    if (sections.meds) {
      parts.push(`Allergies: ${allergies.join(", ")||"NKDA"}. Meds: ${medications.slice(0,4).join("; ")||"none"}.`);
    }
    if (sections.pmh) {
      parts.push(`PMH: ${pmhList.slice(0,4).join(", ")||"none"}.`);
    }
    if (sections.ros && rosPos.length) {
      parts.push(`ROS positives: ${rosPos.join(", ")}.`);
    }
    if (sections.pe && peAbnLines !== "none") {
      parts.push(`PE abnormals: ${peAbnLines}.`);
    }
    if (sections.consults) {
      const pend = consults.filter(c=>c.status==="pending").map(c=>c.service);
      if (pend.length) parts.push(`Pending consults: ${pend.join(", ")}.`);
    }
    if (sections.disposition && disposition) {
      parts.push(`Disposition: ${disposition}${dispReason ? " — "+dispReason.slice(0,60) : ""}.`);
    }
    if (sections.sdoh && sdoh) {
      const flags = Object.entries(sdoh).filter(([,v])=>v&&v!=="unknown"&&v!==false).map(([k])=>k);
      if (flags.length) parts.push(`SDOH: ${flags.join(", ")}.`);
    }
    return parts.join(" ");
  }

  // ── AI: generate I-PASS patient summary ───────────────────────────────────
  async function generatePatientSummary() {
    setSummaryLoading(true);
    try {
      const ctx = buildContext();
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:300,
          system:"Write a 2-3 sentence physician-to-physician I-PASS handoff summary. Return ONLY valid JSON: {\"summary\":\"...\"}",
          messages:[{ role:"user", content:"Write a 2-3 sentence I-PASS patient summary for an ED handoff. Include: patient identity, chief complaint, key history, current status, pertinent positives and negatives.\n\n"+ctx }],
        }),
      });
      const data = await res.json();
      const raw = (data.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim();
      setPatientSummary(JSON.parse(raw)?.summary || "");
    } catch(_) { setPatientSummary("AI unavailable \u2014 please enter patient summary manually."); }
    finally    { setSummaryLoading(false); }
  }

  // ── AI: generate full SBAR ────────────────────────────────────────────────
  async function generateSBAR() {
    setSbarLoading(true);
    try {
      const ctx = buildContext();
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:700,
          system:`Generate a physician-to-physician SBAR handoff for an ED encounter.
Return ONLY valid JSON with exactly four keys:
{
  "situation": "1-2 sentences: who is this patient, why are they here, current severity",
  "background": "2-3 sentences: relevant PMH, meds, allergies, pertinent history",
  "assessment": "2-3 sentences: current clinical status, key findings, working diagnosis",
  "recommendation": "numbered list of specific actions and disposition plan"
}
Be clinically precise. Use standard medical abbreviations. No padding.`,
          messages:[{ role:"user", content:ctx }],
        }),
      });
      const data = await res.json();
      const raw = (data.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(raw);
      setSbarSituation(parsed.situation||"");
      setSbarBackground(parsed.background||"");
      setSbarAssessment(parsed.assessment||"");
      setSbarRecommendation(parsed.recommendation||"");
    } catch(_) {
      setSbarSituation("AI unavailable \u2014 please enter manually.");
    }
    finally { setSbarLoading(false); }
  }

  function addAction() {
    if (!actionInput.trim()) return;
    setActions(p => [...p, { id:Date.now(), text:actionInput.trim(), done:false }]);
    setActionInput("");
  }
  function toggleAction(id) { setActions(p => p.map(a => a.id===id?{...a,done:!a.done}:a)); }
  function removeAction(id) { setActions(p => p.filter(a => a.id!==id)); }

  const sevColor = severity==="Critical"?"var(--npi-coral)":severity==="Serious"?"var(--npi-orange)":"var(--npi-teal)";
  const iaBase = {
    width:"100%", background:"rgba(14,37,68,0.8)",
    border:"1px solid rgba(26,53,85,0.55)", borderRadius:9,
    padding:"9px 12px", color:"var(--npi-txt)",
    fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none",
    boxSizing:"border-box", resize:"vertical", lineHeight:1.6,
  };

  function SbarSection({ letter, label, color, value, onChange, placeholder, rows=3 }) {
    return (
      <div style={{ padding:"14px 16px", borderRadius:10, background:"rgba(14,37,68,0.7)", border:`1px solid ${color}22`, borderTop:`2px solid ${color}55` }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
          <div style={{ width:22, height:22, borderRadius:11, flexShrink:0, background:`${color}22`, border:`1px solid ${color}55`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700, color }}>
            {letter}
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color, letterSpacing:1.8, textTransform:"uppercase" }}>{label}</div>
        </div>
        <textarea value={value} onChange={e=>onChange(e.target.value)} rows={rows} style={iaBase} placeholder={placeholder} />
      </div>
    );
  }

  function IPassSection({ letter, label, color, children }) {
    return (
      <div style={{ padding:"14px 16px", borderRadius:10, background:"rgba(14,37,68,0.7)", border:`1px solid ${color}22`, borderTop:`2px solid ${color}55` }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
          <div style={{ width:22, height:22, borderRadius:11, flexShrink:0, background:`${color}22`, border:`1px solid ${color}55`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700, color }}>
            {letter}
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color, letterSpacing:1.8, textTransform:"uppercase" }}>{label}</div>
        </div>
        {children}
      </div>
    );
  }

  const activeCount = Object.values(sections).filter(Boolean).length;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflowY:"auto" }}>

      {/* ── Header ── */}
      <div style={{ padding:"11px 20px", borderBottom:"1px solid rgba(26,53,85,0.4)", background:"rgba(5,15,30,0.6)", display:"flex", alignItems:"center", gap:12, flexShrink:0, flexWrap:"wrap" }}>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, color:"var(--npi-txt)" }}>
            {format === "sbar" ? "SBAR Handoff" : "I-PASS Handoff"}
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--npi-txt4)" }}>
            {patientName}{demo.age ? ` \xb7 ${demo.age}y` : ""}
          </div>
        </div>

        {/* Format toggle */}
        <div style={{ display:"flex", gap:0, borderRadius:7, overflow:"hidden", border:"1px solid rgba(26,53,85,0.5)", flexShrink:0 }}>
          {[["ipass","I-PASS"],["sbar","SBAR"]].map(([key, lbl]) => (
            <button key={key} onClick={() => setFormat(key)}
              style={{ padding:"5px 14px", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight: format===key ? 700 : 400, background: format===key ? "rgba(0,229,192,0.14)" : "transparent", color: format===key ? "var(--npi-teal)" : "var(--npi-txt4)", borderLeft: key==="sbar" ? "1px solid rgba(26,53,85,0.5)" : "none", transition:"all .12s" }}>
              {lbl}
            </button>
          ))}
        </div>

        <div style={{ flex:1 }} />

        {handoffDone && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"var(--npi-green)", background:"rgba(61,255,160,0.1)", padding:"4px 10px", borderRadius:6, border:"1px solid rgba(61,255,160,0.3)" }}>
            \u2713 HANDOFF COMPLETE
          </span>
        )}
      </div>

      {/* ── Section selector ── */}
      <div style={{ padding:"10px 20px", borderBottom:"1px solid rgba(26,53,85,0.3)", background:"rgba(5,12,24,0.5)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--npi-txt4)", letterSpacing:"1.2px", textTransform:"uppercase", flexShrink:0 }}>
            Include ({activeCount}):
          </span>
          {SECTION_DEFS.map(s => {
            const on = sections[s.id];
            return (
              <button key={s.id} onClick={() => toggleSection(s.id)}
                style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:20, border:`1px solid ${on ? "rgba(0,229,192,0.4)" : "rgba(26,53,85,0.5)"}`, background: on ? "rgba(0,229,192,0.1)" : "transparent", color: on ? "var(--npi-teal)" : "var(--npi-txt4)", fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight: on ? 600 : 400, cursor:"pointer", transition:"all .12s", whiteSpace:"nowrap" }}>
                <span style={{ fontSize:11 }}>{s.icon}</span>
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding:"14px 20px", display:"flex", flexDirection:"column", gap:10, paddingBottom:80 }}>

        {/* ════ SBAR FORMAT ════ */}
        {format === "sbar" && (
          <>
            <div style={{ display:"flex", justifyContent:"flex-end" }}>
              <button onClick={generateSBAR} disabled={sbarLoading}
                style={{ padding:"5px 14px", borderRadius:7, border:"1px solid rgba(0,229,192,0.4)", background:"rgba(0,229,192,0.1)", color:"var(--npi-teal)", fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600, cursor:sbarLoading?"default":"pointer" }}>
                {sbarLoading ? "Generating\u2026" : "\u2728 AI Generate SBAR"}
              </button>
            </div>

            <SbarSection letter="S" label="Situation" color="var(--npi-coral)"
              value={sbarSituation} onChange={setSbarSituation} rows={3}
              placeholder={`${patientName} is a ${demo.age||"?"}y ${demo.sex||"patient"} presenting with ${cc.text||"chief complaint not documented"}. Severity: ${severity}.`} />

            <SbarSection letter="B" label="Background" color="var(--npi-blue)"
              value={sbarBackground} onChange={setSbarBackground} rows={3}
              placeholder="Relevant PMH, current medications, allergies, and pertinent history for this presentation\u2026" />

            <SbarSection letter="A" label="Assessment" color="var(--npi-gold)"
              value={sbarAssessment} onChange={setSbarAssessment} rows={3}
              placeholder="Current clinical status, key exam and lab findings, working diagnosis\u2026" />

            <SbarSection letter="R" label="Recommendation" color="var(--npi-purple)"
              value={sbarRecommendation} onChange={setSbarRecommendation} rows={4}
              placeholder={"1. Pending troponin result at 3h — if elevated, activate cardiology consult\n2. Repeat BP in 30 min\n3. Discharge when ambulating well and pain controlled"} />

            {/* SBAR handoff complete */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:4, flexWrap:"wrap", gap:8 }}>
              <button onClick={()=>setHandoffDone(h=>!h)}
                style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 18px", borderRadius:9, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:12, background:handoffDone?"rgba(61,255,160,0.15)":"rgba(26,53,85,0.4)", border:`1px solid ${handoffDone?"rgba(61,255,160,0.4)":"rgba(42,77,114,0.4)"}`, color:handoffDone?"var(--npi-green)":"var(--npi-txt4)" }}>
                {handoffDone ? "\u2713 Handoff Complete" : "\u25a1 Mark Handoff Complete"}
              </button>
              {onAdvance && (
                <button onClick={onAdvance} style={{ padding:"9px 22px", borderRadius:9, background:"linear-gradient(135deg,#00e5c0,#00b4d8)", border:"none", color:"#050f1e", fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                  Proceed to Discharge &#9654;
                </button>
              )}
            </div>
          </>
        )}

        {/* ════ I-PASS FORMAT ════ */}
        {format === "ipass" && (
          <>
            <IPassSection letter="I" label="Illness Severity" color={sevColor}>
              <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                {["Critical","Serious","Stable"].map(s => {
                  const sc = s==="Critical"?"var(--npi-coral)":s==="Serious"?"var(--npi-orange)":"var(--npi-teal)";
                  const act = severity===s;
                  return (
                    <button key={s} onClick={()=>setSeverity(s)}
                      style={{ padding:"7px 20px", borderRadius:8, cursor:"pointer", background:act?`${sc}18`:"transparent", border:"1px solid", borderColor:act?sc:"rgba(42,77,114,0.35)", color:sc, fontFamily:"'DM Sans',sans-serif", fontWeight:act?700:400, fontSize:13 }}>
                      {s}
                    </button>
                  );
                })}
                {esiLevel && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"var(--npi-txt4)", marginLeft:4 }}>ESI {esiLevel} on arrival</span>}
              </div>
            </IPassSection>

            <IPassSection letter="P" label="Patient Summary" color="var(--npi-blue)">
              <button onClick={generatePatientSummary} disabled={summaryLoading}
                style={{ marginBottom:8, padding:"5px 14px", borderRadius:7, border:"1px solid rgba(59,158,255,0.4)", background:"rgba(59,158,255,0.1)", color:"var(--npi-blue)", fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600, cursor:summaryLoading?"default":"pointer" }}>
                {summaryLoading ? "Generating\u2026" : "\u2728 AI Generate"}
              </button>
              <textarea value={patientSummary} onChange={e=>setPatientSummary(e.target.value)}
                rows={4} style={iaBase}
                placeholder="2-3 sentences: patient identity, chief complaint, key PMH, current clinical status, pertinent findings\u2026" />
            </IPassSection>

            <IPassSection letter="A" label="Action List" color="var(--npi-gold)">
              <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:8 }}>
                {sections.consults && consults.filter(c=>c.status==="pending").map(c=>(
                  <div key={c.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", borderRadius:7, background:"rgba(245,200,66,0.06)", border:"1px solid rgba(245,200,66,0.2)" }}>
                    <span style={{ color:"var(--npi-gold)", fontSize:11 }}>\u23f3</span>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12.5, color:"var(--npi-txt2)", flex:1 }}>
                      Awaiting {c.service} consult{c.question?`: ${c.question.slice(0,60)}`:""}
                    </span>
                  </div>
                ))}
                {actions.map(a=>(
                  <div key={a.id} style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <button onClick={()=>toggleAction(a.id)}
                      style={{ width:18, height:18, borderRadius:4, flexShrink:0, padding:0, border:`1px solid ${a.done?"var(--npi-teal)":"rgba(42,77,114,0.5)"}`, background:a.done?"rgba(0,229,192,0.15)":"transparent", cursor:"pointer", color:"var(--npi-teal)", fontSize:10, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {a.done?"\u2713":""}
                    </button>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12.5, color:a.done?"var(--npi-txt4)":"var(--npi-txt2)", flex:1, textDecoration:a.done?"line-through":"none" }}>{a.text}</span>
                    <button onClick={()=>removeAction(a.id)} style={{ background:"transparent", border:"none", color:"var(--npi-txt4)", cursor:"pointer", fontSize:11 }}>\u2715</button>
                  </div>
                ))}
                {actions.length===0 && (!sections.consults || consults.filter(c=>c.status==="pending").length===0) && (
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"var(--npi-txt4)", fontStyle:"italic" }}>No pending actions</div>
                )}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <input value={actionInput} onChange={e=>setActionInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&actionInput.trim())addAction();}}
                  placeholder="Add item (e.g., Follow-up CBC at 6h, CT results pending)"
                  style={{ ...iaBase, resize:"none", flex:1, lineHeight:1.4 }} />
                <button onClick={addAction}
                  style={{ padding:"8px 16px", borderRadius:9, background:"rgba(245,200,66,0.12)", border:"1px solid rgba(245,200,66,0.35)", color:"var(--npi-gold)", fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:12, cursor:"pointer", whiteSpace:"nowrap" }}>
                  + Add
                </button>
              </div>
            </IPassSection>

            <IPassSection letter="S" label="Situation Awareness & Contingency" color="var(--npi-purple)">
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5, color:"var(--npi-txt4)", marginBottom:6 }}>
                Anticipated changes and if/then contingency plans for the receiving provider
              </div>
              {sections.sdoh && sdoh && Object.entries(sdoh).some(([,v])=>v&&v!=="unknown"&&v!==false) && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:8 }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", textTransform:"uppercase", letterSpacing:"0.08em", alignSelf:"center", marginRight:3 }}>SDOH:</span>
                  {Object.entries(sdoh).filter(([,v])=>v&&v!=="unknown"&&v!==false).map(([k,v])=>(
                    <span key={k} style={{ fontSize:10, padding:"2px 8px", borderRadius:10, background:"rgba(167,139,250,.1)", border:"1px solid rgba(167,139,250,.25)", color:"var(--npi-purple)", fontFamily:"'DM Sans',sans-serif" }}>
                      {k.replace(/_/g," ")}{typeof v==="string"&&v!=="true"?": "+v:""}
                    </span>
                  ))}
                </div>
              )}
              {registration?.room && (
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"var(--npi-txt4)", marginBottom:6 }}>
                  Room {registration.room}{registration?.mrn ? "  \xb7  MRN "+registration.mrn : ""}
                </div>
              )}
              <textarea value={situation} onChange={e=>setSituation(e.target.value)}
                rows={3} style={iaBase}
                placeholder={"If BP drops below 90 \u2192 NS bolus + call senior resident\nIf troponin elevated \u2192 activate cardiology consult"} />
            </IPassSection>

            <IPassSection letter="S" label="Synthesis by Receiver" color="var(--npi-teal)">
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5, color:"var(--npi-txt4)", marginBottom:6 }}>
                Receiving provider read-back: summarize key points, active issues, and pending items
              </div>
              <textarea value={synthesis} onChange={e=>setSynthesis(e.target.value)}
                rows={3} style={iaBase}
                placeholder="Receiving provider confirms understanding of patient status, active issues, pending actions, and contingency plans\u2026" />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10, flexWrap:"wrap", gap:8 }}>
                <button onClick={()=>setHandoffDone(h=>!h)}
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 18px", borderRadius:9, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:12, background:handoffDone?"rgba(61,255,160,0.15)":"rgba(26,53,85,0.4)", border:`1px solid ${handoffDone?"rgba(61,255,160,0.4)":"rgba(42,77,114,0.4)"}`, color:handoffDone?"var(--npi-green)":"var(--npi-txt4)" }}>
                  {handoffDone?"\u2713 Handoff Complete":"\u25a1 Mark Handoff Complete"}
                </button>
                {onAdvance && (
                  <button onClick={onAdvance} style={{ padding:"9px 22px", borderRadius:9, background:"linear-gradient(135deg,#00e5c0,#00b4d8)", border:"none", color:"#050f1e", fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                    Proceed to Discharge &#9654;
                  </button>
                )}
              </div>
            </IPassSection>
          </>
        )}
      </div>
    </div>
  );
}