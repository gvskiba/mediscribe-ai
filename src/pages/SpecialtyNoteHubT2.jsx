import { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

// ─── THEME ───────────────────────────────────────────────────────────────────
const T = {
  bg:"#081628", surf:"rgba(14,35,64,0.85)", bdr:"rgba(42,77,114,0.45)",
  teal:"#2dd4bf", gold:"#f5c842", blue:"#3b9eff", red:"#ff5c6c",
  amber:"#f5a623", green:"#2ecc71", purple:"#9b6dff", orange:"#f97316",
  txt:"#e8edf5", txt2:"#a8c0d6", txt4:"#4a7299",
  ff:"'DM Sans',sans-serif", fs:"'Playfair Display',serif", fm:"'JetBrains Mono',monospace",
};

// ─── T2 NOTE REGISTRY ─────────────────────────────────────────────────────────
const NOTES_T2 = [
  { id:"cardiac_arrest", icon:"💔", title:"Cardiac Arrest Resuscitation", color:T.red,   sub:"ACLS timeline · Hs and Ts · Outcome" },
  { id:"proc_sedation",  icon:"💊", title:"Procedural Sedation",          color:T.blue,  sub:"Monitoring · Personnel · Recovery" },
  { id:"capacity",       icon:"⚖️", title:"Capacity Assessment",          color:T.gold,  sub:"Appelbaum four-criteria determination" },
  { id:"elopement",      icon:"🚪", title:"Elopement Note",               color:T.amber, sub:"LWBS · Left during evaluation" },
];

// ─── T2 NOTE CONFIGS ─────────────────────────────────────────────────────────
const T2 = {

  cardiac_arrest: {
    fields: [
      { id:"dt",        label:"Time of Arrest / Discovery",          type:"dt",  req:true },
      { id:"witnessed", label:"Witnessed Status",                     type:"sel", opts:["Witnessed — bystander CPR initiated","Witnessed — no CPR until EMS arrival","Unwitnessed — found in arrest","In-hospital arrest — witnessed","In-hospital arrest — found unresponsive"] },
      { id:"rhythm",    label:"Initial Rhythm",                       type:"sel", req:true, opts:["Ventricular fibrillation","Pulseless VT","Asystole","PEA","Unknown — prehospital"] },
      { id:"cpr",       label:"CPR Initiated (time)",                 type:"txt", ph:"e.g., 14:32" },
      { id:"shock",     label:"First Shock (time + joules)",          type:"txt", ph:"e.g., 14:34 — 200J biphasic" },
      { id:"epi",       label:"Epinephrine Doses / Times",            type:"txt", ph:"e.g., 14:34, 14:38, 14:42 — 3 doses total" },
      { id:"ivx",       label:"ACLS Interventions",                   type:"chk", opts:["Endotracheal intubation","Supraglottic airway (LMA/King)","BVM ventilation","IO access established","Central venous access","Amiodarone administered","Lidocaine administered","Sodium bicarbonate","Calcium administered","Magnesium administered","Thrombolytics administered","Pericardiocentesis","Finger thoracostomy / chest tube","Transcutaneous pacing"] },
      { id:"hsts",      label:"Reversible Causes Addressed (Hs & Ts)",type:"chk", opts:["Hypovolemia — IV fluids","Hypoxia — airway secured, ventilation optimized","Hydrogen ion (acidosis) — bicarb, ventilation","Hypo/Hyperkalemia — labs, calcium/bicarb","Hypothermia — warming initiated","Tension pneumothorax — decompressed","Tamponade — POCUS, pericardiocentesis","Toxins — antidote/treatment given","Thrombosis MI — cath lab activated","Thrombosis PE — lytics considered/given"] },
      { id:"pocus",     label:"POCUS Findings",                       type:"ta",  ph:"e.g., Global hypokinesis, no tamponade, IVC collapsed, no RV strain..." },
      { id:"downtime",  label:"Total Downtime (minutes)",             type:"num", req:true, ph:"e.g., 28" },
      { id:"rosc",      label:"ROSC Time (if achieved)",              type:"txt", ph:"e.g., 14:54 — ROSC after 3rd shock" },
      { id:"outcome",   label:"Outcome",                              type:"sel", req:true, opts:["ROSC achieved — admitted to ICU","ROSC achieved — cath lab activated","ROSC achieved — transferred to higher level of care","Resuscitation unsuccessful — death pronounced","Resuscitation terminated per protocol"] },
      { id:"family",    label:"Family Notification",                  type:"ta",  ph:"e.g., Wife notified in person by Dr. Skiba at 15:10..." },
      { id:"attmd",     label:"Attending Physician Role",             type:"sel", opts:["Attending present and directing throughout","Attending present at critical junctures","Resident primary with attending at bedside","Attending notified by phone — resident primary"] },
    ],
    ai: (f) => `You are Notrya AI. Draft a complete medicolegally sound cardiac arrest resuscitation note for an emergency medicine provider.
Arrest Time: ${f.dt||"—"} | Witnessed: ${f.witnessed||"—"} | Initial Rhythm: ${f.rhythm||"—"}
CPR Started: ${f.cpr||"—"} | First Shock: ${f.shock||"—"} | Epinephrine: ${f.epi||"—"}
ACLS Interventions: ${arr(f.ivx)}
Reversible Causes (Hs and Ts): ${arr(f.hsts)}
POCUS: ${f.pocus||"not performed"} | Total Downtime: ${f.downtime||"—"} min | ROSC: ${f.rosc||"not achieved"}
Outcome: ${f.outcome||"—"} | Family: ${f.family||"—"} | Attending Role: ${f.attmd||"—"}
Sections: (1) Arrest Circumstances and Initial Response, (2) Resuscitation Timeline with interventions in chronological order, (3) Reversible Causes Addressed, (4) POCUS Findings, (5) Outcome, (6) Family Notification, (7) Physician Attestation. Under 400 words. Do NOT fabricate timing or interventions not listed.`,
  },

  proc_sedation: {
    fields: [
      { id:"dt",       label:"Date & Time",                      type:"dt",  req:true },
      { id:"proc",     label:"Procedure Performed",              type:"txt", req:true, ph:"e.g., Shoulder reduction, cardioversion, abscess I&D" },
      { id:"ind",      label:"Indication",                       type:"txt", ph:"e.g., Acute anterior shoulder dislocation, neurovascularly intact" },
      { id:"agent",    label:"Sedation Agent",                   type:"sel", req:true, opts:["Ketamine IV","Ketamine IM","Propofol","Etomidate","Midazolam + Fentanyl","Fentanyl + Ketamine","Nitrous oxide","Other"] },
      { id:"dose",     label:"Dose & Route",                     type:"txt", ph:"e.g., Ketamine 1 mg/kg IV = 90 mg" },
      { id:"asa",      label:"ASA Classification",               type:"sel", opts:["ASA I — normal healthy patient","ASA II — mild systemic disease","ASA III — severe systemic disease","ASA IV — severe disease with constant threat (contraindicated)"] },
      { id:"mp",       label:"Mallampati / Airway",              type:"sel", opts:["Class I — full visualization of soft palate and uvula","Class II — partial visualization of uvula","Class III — soft palate and base of uvula visible","Class IV — only hard palate visible","Not formally assessed"] },
      { id:"npo",      label:"NPO Status",                       type:"sel", opts:["Fasting greater than 6 hours (solids) / greater than 2 hours (liquids)","Fasting greater than 2 hours (liquids only)","Not fasting — procedure urgency outweighs risk","Unknown"] },
      { id:"monitor",  label:"Monitoring Employed",              type:"chk", opts:["Continuous pulse oximetry","End-tidal CO2 (capnography)","Continuous cardiac monitoring","Blood pressure q5 minutes","IV access confirmed patent","Supplemental O2","Airway equipment at bedside"] },
      { id:"staff",    label:"Personnel Present",                type:"chk", opts:["Procedure physician","Dedicated sedation physician (two-provider model)","Registered nurse — dedicated monitoring","Respiratory therapy"] },
      { id:"depth",    label:"Deepest Level of Sedation",        type:"sel", opts:["Minimal — anxiolysis only","Moderate — purposeful response to verbal/touch","Deep — not easily aroused, ventilation intact","General — unarousable, airway intervention required"] },
      { id:"comp",     label:"Complications",                    type:"chk", opts:["None — uneventful","Transient hypoxia — resolved with O2","Laryngospasm — managed","Vomiting — airway maintained","Apnea — required BVM","Hypotension — IV fluids given","Emergence reaction (ketamine)","Airway intervention required"] },
      { id:"success",  label:"Procedure Outcome",                type:"sel", opts:["Successful — first attempt","Successful — repeat attempt required","Unsuccessful — alternative plan","Aborted — patient deterioration"] },
      { id:"recovery", label:"Recovery Criteria Met",            type:"chk", opts:["Airway patent and protected","Spontaneous ventilation maintained","SpO2 at or above 95% on room air or baseline","Hemodynamically stable","Responds to verbal stimulation","Returns to baseline mental status"] },
      { id:"dispo",    label:"Disposition",                      type:"sel", opts:["Discharged home — all recovery criteria met","Admitted for observation","Admitted — planned procedure","Transferred to OR"] },
    ],
    ai: (f) => `You are Notrya AI. Draft a complete procedural sedation note. Must be medicolegally complete.
Date/Time: ${f.dt||"—"} | Procedure: ${f.proc||"—"} | Indication: ${f.ind||"—"}
Agent: ${f.agent||"—"} | Dose: ${f.dose||"—"} | ASA: ${f.asa||"—"} | Mallampati: ${f.mp||"—"} | NPO: ${f.npo||"—"}
Monitoring: ${arr(f.monitor)} | Personnel: ${arr(f.staff)}
Sedation Depth: ${f.depth||"—"} | Complications: ${arr(f.comp)}
Outcome: ${f.success||"—"} | Recovery Criteria: ${arr(f.recovery)} | Disposition: ${f.dispo||"—"}
Sections: (1) Pre-sedation assessment — ASA class, airway, NPO status, (2) Sedation agent, dose, route, rationale, (3) Monitoring and personnel present, (4) Procedure description and outcome, (5) Intra-sedation events and complications, (6) Recovery criteria met, (7) Disposition. Under 300 words. Do NOT fabricate.`,
  },

  capacity: {
    fields: [
      { id:"dt",    label:"Date & Time of Assessment",          type:"dt",  req:true },
      { id:"reason",label:"Reason for Formal Assessment",       type:"txt", req:true, ph:"e.g., Patient refusing blood transfusion for GI bleed" },
      { id:"u",     label:"1. Understanding — Patient Can State:",type:"ta", ph:"Patient's verbatim/paraphrased demonstration: states diagnosis, proposed treatment, purpose of treatment..." },
      { id:"a",     label:"2. Appreciation — Patient Acknowledges:",type:"ta",ph:"Patient appreciates illness applies to them, consequences are real for them specifically..." },
      { id:"r",     label:"3. Reasoning — Patient Demonstrates:", type:"ta", ph:"Ability to weigh risks/benefits, consider alternatives, engage in logical reasoning..." },
      { id:"e",     label:"4. Expressing Choice — Patient States:",type:"ta", ph:"Consistent, stable decision communicated clearly and reproducibly..." },
      { id:"det",   label:"Capacity Determination",             type:"sel", req:true, opts:["Patient HAS decision-making capacity — all four criteria met","Patient LACKS capacity — one or more criteria not met","Capacity UNCERTAIN — psychiatry consultation requested"] },
      { id:"basis", label:"Basis for Determination",            type:"ta",  ph:"Summarize clinical reasoning for the capacity determination..." },
      { id:"psych", label:"Psychiatry Consultation",            type:"sel", opts:["Not indicated — clinical assessment sufficient","Requested — pending","Completed — findings documented","Declined by patient"] },
      { id:"surr",  label:"Surrogate / Decision-Maker (if lacks capacity)", type:"txt", ph:"e.g., Healthcare POA — spouse John Smith, notified" },
      { id:"plan",  label:"Outcome and Plan",                   type:"ta",  ph:"e.g., Patient has capacity. Informed refusal documented. AMA note completed. Risks and alternatives explained..." },
    ],
    ai: (f) => `You are Notrya AI. Draft a formal capacity assessment note using Appelbaum's four-criteria framework.
Date/Time: ${f.dt||"—"} | Reason: ${f.reason||"—"}
Understanding: ${f.u||"not documented"}
Appreciation: ${f.a||"not documented"}
Reasoning: ${f.r||"not documented"}
Expressing Choice: ${f.e||"not documented"}
Determination: ${f.det||"—"} | Basis: ${f.basis||"—"}
Psychiatry: ${f.psych||"—"} | Surrogate: ${f.surr||"N/A"}
Plan: ${f.plan||"—"}
Structure: (1) Reason for Assessment, (2) Capacity Criteria — address each of the four Appelbaum criteria individually with clinical evidence, (3) Capacity Determination with unambiguous statement, (4) Basis for Determination, (5) Plan — surrogate, psychiatry, or informed refusal next steps. Meets medicolegal standards. Under 300 words.`,
  },

  elopement: {
    fields: [
      { id:"dt",       label:"Date & Time Last Seen",             type:"dt",  req:true },
      { id:"disc",     label:"Time Elopement Discovered",         type:"txt", ph:"e.g., 16:45 — nursing staff discovered patient absent" },
      { id:"etype",    label:"Type of Elopement",                 type:"sel", req:true, opts:["Left Without Being Seen (LWBS) — prior to physician evaluation","Left Without Treatment (LWT) — after triage, before physician evaluation","Left During Evaluation — physician evaluation incomplete","Left Against Advice — advised to stay, refused","Eloped from monitored area — safety concern"] },
      { id:"status",   label:"Clinical Status at Elopement",      type:"ta",  ph:"e.g., Triaged ESI-3 for chest pain. Awaiting ECG and troponin. Vitals stable: BP 142/88, HR 92, SpO2 98%..." },
      { id:"risk",     label:"Clinical Risk Assessment",          type:"sel", opts:["Low risk — stable vitals, non-emergent complaint","Moderate risk — concerning symptoms, workup incomplete","High risk — potentially life-threatening (ACS, stroke, sepsis)","Unknown — insufficient evaluation completed"] },
      { id:"contact",  label:"Attempts to Contact Patient",       type:"chk", opts:["Phone call — no answer","Phone call — voicemail left","Family member contacted","Emergency contact notified","Callback number obtained at triage","Unable to contact — no information available"] },
      { id:"sec",      label:"Security / Administration Notified",type:"sel", opts:["Yes — security and charge nurse notified","Yes — charge nurse and attending notified","Not notified — low risk LWBS","N/A"] },
      { id:"comm",     label:"Risks Communicated (if reached)",   type:"ta",  ph:"If patient was reached: document risks of leaving, recommendations to return, follow-up instructions..." },
      { id:"fu",       label:"Follow-Up Arranged",                type:"txt", ph:"e.g., Callback instructions left, told to return to ED or call 911 if symptoms worsen" },
      { id:"att",      label:"Attending Physician",               type:"txt", req:true, ph:"Dr. Gabriel Skiba, MD" },
    ],
    ai: (f) => `You are Notrya AI. Draft an elopement documentation note for an emergency medicine provider.
Last Seen: ${f.dt||"—"} | Discovered: ${f.disc||"—"} | Type: ${f.etype||"—"}
Clinical Status: ${f.status||"—"} | Risk Level: ${f.risk||"—"}
Contact Attempts: ${arr(f.contact)} | Security/Admin: ${f.sec||"—"}
Risks Communicated: ${f.comm||"not reached"} | Follow-Up: ${f.fu||"none"} | Attending: ${f.att||"—"}
Sections: (1) Circumstances of Elopement, (2) Clinical Status and Risk Assessment, (3) Actions Taken — contacts and notifications, (4) Information Provided to Patient (if reached), (5) Disposition and Follow-Up, (6) Physician Attestation. Objective factual tone. Under 200 words.`,
  },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const arr = (v) => Array.isArray(v) && v.length ? v.join("; ") : "—";

// ─── FIELD RENDERER ───────────────────────────────────────────────────────────
function Field({ f, val, setVal }) {
  const base = { width:"100%", background:"rgba(8,22,40,0.6)", border:`1px solid ${T.bdr}`, borderRadius:8, padding:"9px 12px", fontFamily:T.ff, fontSize:13, color:T.txt, outline:"none", boxSizing:"border-box" };
  const LBL  = { display:"block", fontFamily:T.ff, fontSize:10, fontWeight:700, color:T.txt4, letterSpacing:.7, textTransform:"uppercase", marginBottom:5 };
  const WRAP = { marginBottom:14 };
  const chks = Array.isArray(val) ? val : [];

  if (f.type === "chk") return (
    <div style={WRAP}>
      <span style={LBL}>{f.label}{f.req && <span style={{color:T.red,marginLeft:3}}>*</span>}</span>
      {f.opts.map(o => (
        <label key={o} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:5,cursor:"pointer"}}>
          <input type="checkbox" style={{width:14,height:14,accentColor:T.teal,marginTop:2,flexShrink:0,cursor:"pointer"}}
            checked={chks.includes(o)}
            onChange={e => setVal(e.target.checked ? [...chks,o] : chks.filter(x=>x!==o))} />
          <span style={{fontFamily:T.ff,fontSize:13,color:T.txt2,lineHeight:1.4}}>{o}</span>
        </label>
      ))}
    </div>
  );
  if (f.type === "sel") return (
    <div style={WRAP}>
      <span style={LBL}>{f.label}{f.req && <span style={{color:T.red,marginLeft:3}}>*</span>}</span>
      <select style={{...base,cursor:"pointer"}} value={val||""} onChange={e=>setVal(e.target.value)}>
        <option value="">Select…</option>
        {f.opts.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
  if (f.type === "ta") return (
    <div style={WRAP}>
      <span style={LBL}>{f.label}{f.req && <span style={{color:T.red,marginLeft:3}}>*</span>}</span>
      <textarea style={{...base,minHeight:72,resize:"vertical"}} value={val||""} placeholder={f.ph||""}
        onChange={e=>setVal(e.target.value)} />
    </div>
  );
  return (
    <div style={WRAP}>
      <span style={LBL}>{f.label}{f.req && <span style={{color:T.red,marginLeft:3}}>*</span>}</span>
      <input type={f.type==="dt"?"datetime-local":f.type==="num"?"number":"text"}
        style={base} value={val||""} placeholder={f.ph||""} onChange={e=>setVal(e.target.value)} />
    </div>
  );
}

// ─── NOTE BUILDER ─────────────────────────────────────────────────────────────
function NoteBuilder({ note, cfg, onBack }) {
  const [form,   setForm]   = useState({});
  const [aiOut,  setAiOut]  = useState("");
  const [busy,   setBusy]   = useState(false);
  const [copied, setCopied] = useState(false);
  const [err,    setErr]    = useState("");

  const set = (id, v) => setForm(p=>({...p,[id]:v}));

  const generate = useCallback(async () => {
    setBusy(true); setErr(""); setAiOut("");
    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt: cfg.ai(form) });
      setAiOut(typeof res === "string" ? res : JSON.stringify(res));
    } catch(e) { setErr("AI generation failed. Please try again."); }
    setBusy(false);
  }, [form, cfg]);

  const copy = useCallback(() => {
    if (!aiOut) return;
    navigator.clipboard.writeText(aiOut).then(() => { setCopied(true); setTimeout(()=>setCopied(false),2500); });
  }, [aiOut]);

  const card = { background:T.surf, border:`1px solid ${T.bdr}`, borderRadius:14, padding:20, marginBottom:16 };
  const nc = note?.color || T.gold;

  return (
    <div style={{maxWidth:760,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <button onClick={onBack} style={{background:"rgba(42,77,114,0.25)",border:`1px solid ${T.bdr}`,borderRadius:8,padding:"6px 14px",fontFamily:T.ff,fontSize:12,color:T.txt2,cursor:"pointer"}}>← Back</button>
        <span style={{fontSize:22}}>{note?.icon}</span>
        <div>
          <div style={{fontFamily:T.fs,fontSize:17,fontWeight:700,color:T.txt}}>{note?.title}</div>
          <div style={{fontFamily:T.ff,fontSize:11,color:T.txt4,marginTop:1}}>{note?.sub}</div>
        </div>
        <div style={{marginLeft:"auto",padding:"3px 10px",background:`${nc}18`,border:`1px solid ${nc}44`,borderRadius:6,fontFamily:T.fm,fontSize:9,color:nc,letterSpacing:1.2,textTransform:"uppercase"}}>TIER 2</div>
      </div>

      <div style={card}>
        <div style={{fontFamily:T.fm,fontSize:9,fontWeight:700,color:T.txt4,letterSpacing:1,textTransform:"uppercase",marginBottom:14}}>Clinical Documentation</div>
        {cfg.fields.map(f => <Field key={f.id} f={f} val={form[f.id]} setVal={v=>set(f.id,v)} />)}
      </div>

      <div style={{textAlign:"center",marginBottom:16}}>
        <button onClick={generate} disabled={busy}
          style={{background:busy?"rgba(42,77,114,0.2)":`linear-gradient(135deg,rgba(245,200,66,0.12),rgba(59,158,255,0.12))`,border:`1px solid ${busy?T.bdr:T.gold}`,borderRadius:10,padding:"11px 30px",fontFamily:T.ff,fontSize:14,fontWeight:600,color:busy?T.txt4:T.gold,cursor:busy?"not-allowed":"pointer",transition:"all .15s"}}>
          {busy ? "⏳ Generating Note…" : "✨ AI Generate Note"}
        </button>
      </div>

      {err && <div style={{...card,border:`1px solid ${T.red}55`,color:T.red,fontSize:13}}>{err}</div>}

      {aiOut && (
        <div style={{...card,border:`1px solid rgba(245,200,66,0.3)`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontFamily:T.fm,fontSize:9,fontWeight:700,color:T.gold,letterSpacing:1,textTransform:"uppercase"}}>Generated Note</div>
            <button onClick={copy}
              style={{background:copied?"rgba(46,204,113,0.12)":"rgba(42,77,114,0.25)",border:`1px solid ${copied?T.green:T.bdr}`,borderRadius:7,padding:"4px 14px",fontFamily:T.ff,fontSize:12,color:copied?T.green:T.txt2,cursor:"pointer",transition:"all .15s"}}>
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <pre style={{fontFamily:T.ff,fontSize:13,color:T.txt,lineHeight:1.75,whiteSpace:"pre-wrap",margin:0}}>{aiOut}</pre>
        </div>
      )}
    </div>
  );
}

// ─── TIER 2 HUB ──────────────────────────────────────────────────────────────
export default function SpecialtyNoteHubT2() {
  const [active, setActive] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get("n") || null;
  });

  const goHub = () => { window.location.href = createPageUrl("SpecialtyNoteHub"); };

  if (active) {
    const note = NOTES_T2.find(n=>n.id===active);
    if (!note) return null;
    return (
      <div style={{minHeight:"100vh",background:T.bg,padding:"24px 20px"}}>
        <NoteBuilder note={note} cfg={T2[active]} onBack={()=>setActive(null)} />
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",background:T.bg,padding:"24px 20px",fontFamily:T.ff,color:T.txt}}>
      <div style={{maxWidth:860,margin:"0 auto"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24,flexWrap:"wrap"}}>
          <button onClick={goHub} style={{background:"rgba(42,77,114,0.25)",border:`1px solid ${T.bdr}`,borderRadius:8,padding:"6px 14px",fontFamily:T.ff,fontSize:12,color:T.txt2,cursor:"pointer"}}>← Specialty Note Hub</button>
          <div style={{width:3,height:20,background:T.gold,borderRadius:2}} />
          <div>
            <div style={{fontFamily:T.fs,fontSize:20,fontWeight:700,color:T.txt}}>Tier 2 — High Value Notes</div>
            <div style={{fontFamily:T.ff,fontSize:12,color:T.txt4}}>Weekly use · Significant liability · 4 note types</div>
          </div>
        </div>

        {/* Note grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
          {NOTES_T2.map(note => (
            <button key={note.id} onClick={()=>setActive(note.id)}
              style={{background:"linear-gradient(135deg,rgba(14,35,64,0.88),rgba(8,22,40,0.96))",border:"1px solid rgba(42,77,114,0.38)",borderRadius:14,padding:"18px 18px",cursor:"pointer",textAlign:"left",outline:"none",transition:"all .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.border=`1px solid ${note.color}55`;e.currentTarget.style.background=`linear-gradient(135deg,${note.color}0e,rgba(8,22,40,0.96))`;}}
              onMouseLeave={e=>{e.currentTarget.style.border="1px solid rgba(42,77,114,0.38)";e.currentTarget.style.background="linear-gradient(135deg,rgba(14,35,64,0.88),rgba(8,22,40,0.96))";}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <span style={{fontSize:22}}>{note.icon}</span>
                <span style={{fontFamily:T.fm,fontSize:8,fontWeight:700,color:note.color,letterSpacing:1.2,textTransform:"uppercase"}}>TIER 2</span>
              </div>
              <div style={{fontFamily:T.ff,fontSize:14,fontWeight:600,color:T.txt,marginBottom:4}}>{note.title}</div>
              <div style={{fontFamily:T.ff,fontSize:11,color:T.txt4,lineHeight:1.4}}>{note.sub}</div>
              <div style={{marginTop:10,display:"inline-block",padding:"3px 10px",background:`${note.color}14`,border:`1px solid ${note.color}33`,borderRadius:5,fontFamily:T.ff,fontSize:10,color:note.color}}>Open Note →</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}