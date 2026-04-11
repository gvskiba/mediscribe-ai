import { useState } from "react";
import { base44 } from "@/api/base44Client";

// Literature: I-PASS reduced information loss 75%→37.5% in pediatric ED (AHRQ 2023)
export default function HandoffTab({ demo, cc, vitals, medications, allergies, pmhSelected,
  rosState, peState, peFindings, esiLevel, registration, sdoh, consults,
  disposition, dispReason, onAdvance }) {
  const patientName = [demo.firstName, demo.lastName].filter(Boolean).join(" ") || "New Patient";
  const pmhList     = Object.keys(pmhSelected || {}).filter(k => pmhSelected[k]);

  const [severity,       setSeverity]       = useState(esiLevel<=2?"Critical":esiLevel===3?"Serious":"Stable");
  const [patientSummary, setPatientSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [actions,        setActions]        = useState([]);
  const [actionInput,    setActionInput]    = useState("");
  const [situation,      setSituation]      = useState("");
  const [synthesis,      setSynthesis]      = useState("");
  const [handoffDone,    setHandoffDone]    = useState(false);

  async function generatePatientSummary() {
    setSummaryLoading(true);
    try {
      const rosPos = Object.entries(rosState||{}).filter(([,v])=>v==="has-positives").map(([k])=>k);
      const pePos  = Object.entries(peState||{}).filter(([,v])=>v==="abnormal"||v==="has-positives"||v==="mixed").map(([k])=>k);
      const prompt = [
        "Write a 2-3 sentence physician-to-physician I-PASS patient summary for an ED handoff.",
        "Include: patient identity, chief complaint, key history, current clinical status, pertinent positives and negatives.",
        `Patient: ${patientName}, ${demo.age||"?"}y ${demo.sex||""}.`,
        `CC: ${cc.text||"not documented"}.`,
        `Vitals: BP ${vitals.bp||"-"} HR ${vitals.hr||"-"} SpO2 ${vitals.spo2||"-"} T ${vitals.temp||"-"}.`,
        `Allergies: ${allergies.join(", ")||"NKDA"}. Meds: ${medications.slice(0,4).join("; ")||"none"}.`,
        `PMH: ${pmhList.slice(0,4).join(", ")||"none"}.`,
        rosPos.length ? `ROS positives: ${rosPos.join(", ")}.` : "",
        pePos.length  ? `PE abnormals: ${pePos.join(", ")}.`   : "",
        disposition ? `Disposition plan: ${disposition}${dispReason ? " — " + dispReason.slice(0,60) : ""}.` : "",
      ].filter(Boolean).join(" ");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: { type:"object", properties:{ summary:{ type:"string" } } },
      });
      setPatientSummary(res?.summary || "");
    } catch(_) { setPatientSummary("AI unavailable \u2014 please enter patient summary manually."); }
    finally    { setSummaryLoading(false); }
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

  function IPassSection({ letter, label, color, children }) {
    return (
      <div style={{ padding:"14px 16px", borderRadius:10,
        background:"rgba(14,37,68,0.7)",
        border:`1px solid ${color}22`, borderTop:`2px solid ${color}55` }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
          <div style={{ width:22, height:22, borderRadius:11, flexShrink:0,
            background:`${color}22`, border:`1px solid ${color}55`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700, color }}>
            {letter}
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color, letterSpacing:1.8, textTransform:"uppercase" }}>{label}</div>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflowY:"auto" }}>
      <div style={{ padding:"11px 20px", borderBottom:"1px solid rgba(26,53,85,0.4)",
        background:"rgba(5,15,30,0.6)", display:"flex", alignItems:"center",
        gap:12, flexShrink:0 }}>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
            fontSize:15, color:"var(--npi-txt)" }}>I-PASS Handoff</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:"var(--npi-txt4)" }}>{patientName}{demo.age ? ` \xb7 ${demo.age}y` : ""}</div>
        </div>
        <div style={{ flex:1 }}/>
        {handoffDone && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
            color:"var(--npi-green)", background:"rgba(61,255,160,0.1)",
            padding:"4px 10px", borderRadius:6, border:"1px solid rgba(61,255,160,0.3)" }}>
            &#x2713; HANDOFF COMPLETE
          </span>
        )}
      </div>

      <div style={{ padding:"14px 20px", display:"flex", flexDirection:"column",
        gap:10, paddingBottom:80 }}>

        <IPassSection letter="I" label="Illness Severity" color={sevColor}>
          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
            {["Critical","Serious","Stable"].map(s => {
              const sc = s==="Critical"?"var(--npi-coral)":s==="Serious"?"var(--npi-orange)":"var(--npi-teal)";
              const act = severity===s;
              return (
                <button key={s} onClick={()=>setSeverity(s)}
                  style={{ padding:"7px 20px", borderRadius:8, cursor:"pointer",
                    background:act?`${sc}18`:"transparent",
                    border:"1px solid", borderColor:act?sc:"rgba(42,77,114,0.35)",
                    color:sc, fontFamily:"'DM Sans',sans-serif",
                    fontWeight:act?700:400, fontSize:13 }}>
                  {s}
                </button>
              );
            })}
            {esiLevel && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                color:"var(--npi-txt4)", marginLeft:4 }}>
                ESI {esiLevel} on arrival
              </span>
            )}
          </div>
        </IPassSection>

        <IPassSection letter="P" label="Patient Summary" color="var(--npi-blue)">
          <button onClick={generatePatientSummary} disabled={summaryLoading}
            style={{ marginBottom:8, padding:"5px 14px", borderRadius:7,
              border:"1px solid rgba(59,158,255,0.4)", background:"rgba(59,158,255,0.1)",
              color:"var(--npi-blue)", fontFamily:"'DM Sans',sans-serif",
              fontSize:11, fontWeight:600, cursor:summaryLoading?"default":"pointer" }}>
            {summaryLoading ? "Generating\u2026" : "\u2728 AI Generate"}
          </button>
          <textarea value={patientSummary} onChange={e=>setPatientSummary(e.target.value)}
            rows={4} style={iaBase}
            placeholder="2-3 sentences: patient identity, chief complaint, key PMH, current clinical status, pertinent findings\u2026" />
        </IPassSection>

        <IPassSection letter="A" label="Action List" color="var(--npi-gold)">
          <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:8 }}>
            {consults.filter(c=>c.status==="pending").map(c=>(
              <div key={c.id} style={{ display:"flex", alignItems:"center", gap:8,
                padding:"6px 10px", borderRadius:7,
                background:"rgba(245,200,66,0.06)", border:"1px solid rgba(245,200,66,0.2)" }}>
                <span style={{ color:"var(--npi-gold)", fontSize:11 }}>&#x23f3;</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12.5,
                  color:"var(--npi-txt2)", flex:1 }}>
                  Awaiting {c.service} consult{c.question?`: ${c.question.slice(0,60)}`:""}
                </span>
              </div>
            ))}
            {actions.map(a=>(
              <div key={a.id} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <button onClick={()=>toggleAction(a.id)}
                  style={{ width:18, height:18, borderRadius:4, flexShrink:0, padding:0,
                    border:`1px solid ${a.done?"var(--npi-teal)":"rgba(42,77,114,0.5)"}`,
                    background:a.done?"rgba(0,229,192,0.15)":"transparent",
                    cursor:"pointer", color:"var(--npi-teal)", fontSize:10,
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {a.done?"\u2713":""}
                </button>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12.5,
                  color:a.done?"var(--npi-txt4)":"var(--npi-txt2)", flex:1,
                  textDecoration:a.done?"line-through":"none" }}>{a.text}</span>
                <button onClick={()=>removeAction(a.id)}
                  style={{ background:"transparent", border:"none",
                    color:"var(--npi-txt4)", cursor:"pointer", fontSize:11 }}>&#x2715;</button>
              </div>
            ))}
            {actions.length===0 && consults.filter(c=>c.status==="pending").length===0 && (
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                color:"var(--npi-txt4)", fontStyle:"italic" }}>No pending actions</div>
            )}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <input value={actionInput} onChange={e=>setActionInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&actionInput.trim())addAction();}}
              placeholder="Add item (e.g., Follow-up CBC at 6h, CT results pending)"
              style={{ ...iaBase, resize:"none", flex:1, lineHeight:1.4 }} />
            <button onClick={addAction}
              style={{ padding:"8px 16px", borderRadius:9,
                background:"rgba(245,200,66,0.12)", border:"1px solid rgba(245,200,66,0.35)",
                color:"var(--npi-gold)", fontFamily:"'DM Sans',sans-serif",
                fontWeight:700, fontSize:12, cursor:"pointer", whiteSpace:"nowrap" }}>
              + Add
            </button>
          </div>
        </IPassSection>

        <IPassSection letter="S" label="Situation Awareness & Contingency" color="var(--npi-purple)">
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5,
            color:"var(--npi-txt4)", marginBottom:6 }}>
            Anticipated changes and if/then contingency plans for the receiving provider
          </div>
          <textarea value={situation} onChange={e=>setSituation(e.target.value)}
            rows={3} style={iaBase}
            placeholder={"If BP drops below 90 \u2192 NS bolus + call senior resident\nIf troponin elevated \u2192 activate cardiology consult"} />
        </IPassSection>

        <IPassSection letter="S" label="Synthesis by Receiver" color="var(--npi-teal)">
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5,
            color:"var(--npi-txt4)", marginBottom:6 }}>
            Receiving provider read-back: summarize key points, active issues, and pending items
          </div>
          <textarea value={synthesis} onChange={e=>setSynthesis(e.target.value)}
            rows={3} style={iaBase}
            placeholder="Receiving provider confirms understanding of patient status, active issues, pending actions, and contingency plans\u2026" />
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"center", marginTop:10, flexWrap:"wrap", gap:8 }}>
            <button onClick={()=>setHandoffDone(h=>!h)}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 18px",
                borderRadius:9, cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
                fontWeight:700, fontSize:12,
                background:handoffDone?"rgba(61,255,160,0.15)":"rgba(26,53,85,0.4)",
                border:`1px solid ${handoffDone?"rgba(61,255,160,0.4)":"rgba(42,77,114,0.4)"}`,
                color:handoffDone?"var(--npi-green)":"var(--npi-txt4)" }}>
              {handoffDone?"\u2713 Handoff Complete":"\u25a1 Mark Handoff Complete"}
            </button>
            {onAdvance && (
              <button onClick={onAdvance}
                style={{ padding:"9px 22px", borderRadius:9,
                  background:"linear-gradient(135deg,#00e5c0,#00b4d8)", border:"none",
                  color:"#050f1e", fontFamily:"'DM Sans',sans-serif",
                  fontWeight:700, fontSize:13, cursor:"pointer" }}>
                Proceed to Discharge &#9654;
              </button>
            )}
          </div>
        </IPassSection>
      </div>
    </div>
  );
}