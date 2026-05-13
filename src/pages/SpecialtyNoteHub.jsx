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

// ─── GLOBAL NOTE REGISTRY (grid display for all 3 tiers) ─────────────────────
const NOTES = [
  { id:"death",           tier:1, icon:"📋", title:"Death Pronouncement",          color:T.txt4,   sub:"Pronouncement of death — clinical note" },
  { id:"critical_care",   tier:1, icon:"🏥", title:"Critical Care Note",           color:T.red,    sub:"99291/99292 billing attestation" },
  { id:"resident_attest", tier:1, icon:"👨‍⚕️", title:"Resident Attestation",         color:T.teal,   sub:"Supervising attending attestation" },
  { id:"split_shared",    tier:1, icon:"🤝", title:"Split/Shared — APP Cosign",    color:T.purple, sub:"CMS 2024 Final Rule · -FS modifier" },
  { id:"ama",             tier:1, icon:"⚠️", title:"AMA / Refusal of Care",        color:T.amber,  sub:"Capacity assessment · Legal documentation" },
  { id:"cardiac_arrest",  tier:2, icon:"💔", title:"Cardiac Arrest Resuscitation", color:T.red,    sub:"ACLS timeline · Hs and Ts · Outcome" },
  { id:"proc_sedation",   tier:2, icon:"💊", title:"Procedural Sedation",          color:T.blue,   sub:"Monitoring · Personnel · Recovery" },
  { id:"capacity",        tier:2, icon:"⚖️", title:"Capacity Assessment",          color:T.gold,   sub:"Appelbaum four-criteria determination" },
  { id:"elopement",       tier:2, icon:"🚪", title:"Elopement Note",               color:T.amber,  sub:"LWBS · Left during evaluation" },
  { id:"emtala",          tier:3, icon:"🚑", title:"Transfer / EMTALA",            color:T.blue,   sub:"EMTALA-compliant transfer documentation" },
  { id:"dnr_goc",         tier:3, icon:"🕊️", title:"DNR / Goals of Care",          color:T.teal,   sub:"Code status · Goals of care discussion" },
  { id:"restraint",       tier:3, icon:"🔒", title:"Restraint Documentation",      color:T.orange, sub:"Behavioral or medical · Least restrictive" },
  { id:"forensic",        tier:3, icon:"🔍", title:"Forensic / Suspected Abuse",   color:T.red,    sub:"Mandatory reporting · Chain of custody" },
];

const TIER_META = {
  1:{ label:"Tier 1 — Essential",  color:T.red,   sub:"High medicolegal exposure · Every shift" },
  2:{ label:"Tier 2 — High Value", color:T.gold,  sub:"Weekly use · Significant liability" },
  3:{ label:"Tier 3 — Complete",   color:T.teal,  sub:"Less frequent · High stakes when needed" },
};

// ─── T1 NOTE CONFIGS ─────────────────────────────────────────────────────────
const T1 = {

  death: {
    fields: [
      { id:"dt",     label:"Date & Time of Pronouncement",  type:"dt",  req:true },
      { id:"circ",   label:"Circumstances",                  type:"sel", req:true, opts:[
        "Cardiac arrest — resuscitation attempted",
        "Cardiac arrest — DNR/DNI, resuscitation not initiated",
        "Cardiac arrest — prehospital ROSC, subsequent death",
        "Expected death — terminal illness / comfort care",
        "Traumatic arrest",
        "Apparent natural death",
      ]},
      { id:"res",    label:"Resuscitative Efforts",          type:"chk", opts:["Full resuscitation attempted","Terminated per ACLS protocol","DNR on file — not initiated","Comfort measures only"] },
      { id:"rdur",   label:"Resuscitation Duration",         type:"txt", ph:"e.g., 35 minutes ACLS, 10 cycles CPR" },
      { id:"exam",   label:"Examination at Pronouncement",   type:"chk", opts:["Pupils fixed and dilated bilaterally","No spontaneous respiratory effort","Asystole confirmed on monitor","No carotid or femoral pulse","No response to painful stimulus","Corneal reflex absent","Rigor mortis present","Dependent lividity present"] },
      { id:"rhythm", label:"Rhythm at Death",                type:"sel", opts:["Asystole","PEA — agonal rhythm","VF — refractory","Pulseless VT — refractory"] },
      { id:"fam",    label:"Family Notification",            type:"chk", opts:["Family present at time of death","Family notified by phone","Social work notified","Chaplain notified","Unable to reach family — attempts documented"] },
      { id:"notif",  label:"Required Notifications",         type:"chk", opts:["Attending physician notified","ME/Coroner notified","ME declined jurisdiction","OPO notified per federal regulations","Death certificate initiated"] },
      { id:"cod",    label:"Primary Cause of Death",         type:"txt", req:true, ph:"e.g., Cardiac arrest due to acute MI" },
      { id:"contrib",label:"Contributing Conditions",        type:"txt", ph:"e.g., CAD, HTN, DM2" },
      { id:"notes",  label:"Additional Notes",               type:"ta",  ph:"Family counseling, circumstances, additional documentation..." },
    ],
    ai: (f) => `You are Notrya AI. Draft a complete medicolegally sound death pronouncement note for an emergency medicine provider.
Date/Time: ${f.dt||"—"} | Circumstances: ${f.circ||"—"}
Resuscitation: ${arr(f.res)} | Duration: ${f.rdur||"N/A"}
Exam Findings: ${arr(f.exam)} | Rhythm: ${f.rhythm||"—"}
Family Notification: ${arr(f.fam)} | Required Notifications: ${arr(f.notif)}
Cause of Death: ${f.cod||"—"} | Contributing: ${f.contrib||"none"} | Notes: ${f.notes||"none"}
Write: (1) Time and Date of Pronouncement, (2) Clinical Examination Findings, (3) Summary of Resuscitative Efforts, (4) Cause of Death, (5) Notifications Made, (6) Physician Attestation. Under 250 words. Do NOT fabricate details not provided.`,
  },

  critical_care: {
    fields: [
      { id:"provider", label:"Attending Physician",              type:"txt", req:true, ph:"Dr. Gabriel Skiba, MD" },
      { id:"dt",       label:"Date & Start Time",                type:"dt",  req:true },
      { id:"mins",     label:"Total Critical Care Time (min)",   type:"num", req:true, ph:"e.g., 45" },
      { id:"organs",   label:"Organ Systems Involved",           type:"chk", opts:["Respiratory failure / mechanical ventilation","Cardiovascular — shock / hemodynamic instability","Neurological — altered consciousness / seizure","Renal failure / acute kidney injury","Hepatic failure","Hematologic — coagulopathy / hemorrhage","Metabolic — severe acidosis / electrolyte emergency","Sepsis / septic shock"] },
      { id:"ivx",      label:"Critical Care Interventions",      type:"chk", opts:["Endotracheal intubation / airway management","Mechanical ventilation management","Central venous access","Arterial line placement","Vasopressor initiation/titration","Blood product transfusion","Emergent cardioversion / defibrillation","ACLS / resuscitation","Emergent dialysis","Chest tube placement","POCUS — hemodynamic assessment"] },
      { id:"imp",      label:"Clinical Impression & Assessment", type:"ta",  req:true, ph:"Critical illness summary, working diagnosis, acuity justification, differential, management rationale..." },
      { id:"plan",     label:"Disposition & Plan",               type:"ta",  ph:"ICU admission, consults placed, ongoing management..." },
    ],
    ai: (f) => {
      const m = parseInt(f.mins) || 0;
      const u = Math.max(0, Math.floor((m - 30) / 30));
      return `You are Notrya AI. Draft a Critical Care note with 2025 CPT/CMS billing attestation.
Provider: ${f.provider||"—"} | Date: ${f.dt||"—"} | Total Time: ${m} min
Billing: 99291 (first 30–74 min)${u>0?` + ${u}x 99292 (additional 30-min units)`:""}
Organ Systems: ${arr(f.organs)}
Interventions: ${arr(f.ivx)}
Impression: ${f.imp||"—"} | Plan: ${f.plan||"—"}
Write: (1) Critical illness justification and acuity, (2) Organ systems involved, (3) Interventions performed, (4) Assessment and plan, (5) Required time attestation paragraph: "I personally provided direct, face-to-face critical care to this patient for ${m} minutes. The patient required constant physician attendance due to the critical nature of the illness. Time documented represents only direct care time and excludes time not spent in direct patient care, per CPT guidelines." Under 300 words. Do NOT fabricate.`;
    },
  },

  resident_attest: {
    fields: [
      { id:"res",  label:"Resident Name",               type:"txt", req:true, ph:"Dr. [Name], PGY-[X]" },
      { id:"att",  label:"Attending Physician",          type:"txt", req:true, ph:"Dr. Gabriel Skiba, MD" },
      { id:"dt",   label:"Date & Time of Attestation",  type:"dt",  req:true },
      { id:"rev",  label:"Elements Personally Reviewed",type:"chk", opts:["History of present illness","Review of systems","Physical examination","Diagnostic data — labs, imaging, ECG","Assessment and differential diagnosis","Medical decision-making","Disposition and plan"] },
      { id:"type", label:"Level of Attestation",         type:"sel", req:true, opts:[
        "I reviewed the history, examination, data, assessment, and plan with the resident and agree with the documented findings",
        "I reviewed the history, examination, data, and plan and have made modifications as noted",
        "I personally performed the history and physical and confirm the key elements of the resident note",
        "I was present and directly supervised the resident for this entire encounter",
      ]},
      { id:"mod",  label:"Modifications Made (if any)", type:"ta",  ph:"Describe any changes to assessment, plan, or documentation..." },
      { id:"ctx",  label:"Clinical Context (optional)", type:"txt", ph:"e.g., 58M chest pain, ruled in for NSTEMI" },
    ],
    ai: (f) => `You are Notrya AI. Generate a formal CMS Teaching Physician-compliant attending attestation for the medical record.
Resident: ${f.res||"—"} | Attending: ${f.att||"—"} | Date/Time: ${f.dt||"—"}
Elements Reviewed: ${arr(f.rev)}
Attestation Level: ${f.type||"—"}
Modifications: ${f.mod||"none"} | Clinical Context: ${f.ctx||""}
Draft a formal attestation statement including: (1) attending name and credentials, (2) resident name and year, (3) elements personally reviewed, (4) attestation statement verbatim as selected, (5) any modifications documented, (6) date and time. Meets CMS Teaching Physician documentation requirements. Under 150 words. Professional tone.`,
  },

  split_shared: {
    fields: [
      { id:"app",    label:"APP Name",                          type:"txt", req:true, ph:"[Name], PA-C / NP" },
      { id:"role",   label:"APP Role",                          type:"sel", req:true, opts:["Physician Assistant (PA-C)","Nurse Practitioner (NP/APRN)","Certified Nurse Midwife","Clinical Nurse Specialist"] },
      { id:"att",    label:"Supervising Attending",             type:"txt", req:true, ph:"Dr. Gabriel Skiba, MD" },
      { id:"dt",     label:"Date & Time",                       type:"dt",  req:true },
      { id:"etype",  label:"Encounter Type",                    type:"sel", req:true, opts:[
        "Split/shared — substantive portion performed by attending",
        "Split/shared — substantive portion performed by APP",
        "Incident-to — physician present in suite, direct supervision",
        "Independent APP billing — physician not involved",
      ]},
      { id:"contr",  label:"Attending Substantive Contribution",type:"chk", opts:["Performed or reviewed the history","Performed or reviewed the physical examination","Performed or reviewed the medical decision-making","Counseling comprised greater than 50% of encounter time","Performed key portion of a procedure"] },
      { id:"attmin", label:"Attending Face-to-Face Time (min)", type:"num", ph:"e.g., 15" },
      { id:"totmin", label:"Total Encounter Time (min)",        type:"num", ph:"e.g., 45" },
      { id:"em",     label:"E/M Level Billed",                  type:"sel", opts:["99281","99282","99283","99284","99285"] },
      { id:"notes",  label:"Additional Notes",                  type:"ta",  ph:"Contribution details, clinical context..." },
    ],
    ai: (f) => `You are Notrya AI. Draft a CMS 2024 Final Rule compliant split/shared encounter attestation for the medical record.
APP: ${f.app||"—"} (${f.role||"—"}) | Attending: ${f.att||"—"} | Date: ${f.dt||"—"}
Encounter Type: ${f.etype||"—"}
Attending Contribution: ${arr(f.contr)}
Attending F2F: ${f.attmin||"—"} min | Total Time: ${f.totmin||"—"} min | E/M Level: ${f.em||"—"}
Notes: ${f.notes||"none"}
Draft attestation including: (1) both providers identified with credentials, (2) substantive portion clearly stated, (3) required CMS language — "I have personally reviewed the [elements] with the APP and take responsibility for the management of this patient's care," (4) -FS modifier justification, (5) date/time signature line. Compliant with CMS 2024 Final Rule. Under 200 words.`,
  },

  ama: {
    fields: [
      { id:"dt",    label:"Date & Time",                       type:"dt",  req:true },
      { id:"rtype", label:"Type of Refusal",                   type:"sel", req:true, opts:["Against Medical Advice — leaving hospital","Refusal of specific treatment","Refusal of diagnostic workup","Left Without Being Seen (LWBS)","Left Without Treatment Completion"] },
      { id:"cap",   label:"Appelbaum Criteria Assessed",       type:"chk", opts:["1. UNDERSTANDING — states diagnosis, treatment, purpose","2. APPRECIATION — illness applies to them, consequences real","3. REASONING — weighs risks/benefits, logical reasoning demonstrated","4. EXPRESSING — communicates consistent, stable choice"] },
      { id:"capdet",label:"Capacity Determination",            type:"sel", req:true, opts:["Patient HAS capacity — informed refusal documented","Patient LACKS capacity — surrogate/guardian consulted","Capacity UNCLEAR — psychiatry consulted"] },
      { id:"risks", label:"Risks Explained to Patient",        type:"chk", opts:["Death","Permanent disability","Disease progression / worsening","Need for emergent surgery or intervention","Loss of limb or organ function","Stroke / MI risk"] },
      { id:"risksp",label:"Specific Risks Documented",         type:"ta",  ph:"e.g., Risk of STEMI, cardiac arrest, and death without emergent catheterization..." },
      { id:"alts",  label:"Alternatives Offered",              type:"ta",  ph:"e.g., Oral medications to take home, partial treatment, follow-up arranged..." },
      { id:"under", label:"Patient Demonstrated Understanding",type:"sel", opts:["Patient verbalized understanding of all risks","Partial understanding documented","Patient refused to discuss risks"] },
      { id:"wit",   label:"Witness to Refusal",                type:"txt", ph:"Name, role (e.g., RN Jane Smith)" },
      { id:"sig",   label:"Patient Signature",                 type:"sel", opts:["Signed AMA form","Refused to sign — documented","Verbal refusal only — witness present"] },
      { id:"fam",   label:"Family / Surrogate Notification",   type:"txt", ph:"e.g., Wife notified by phone, advised to return if..." },
      { id:"dispo", label:"Disposition & Follow-Up",           type:"ta",  ph:"Instructions given, return precautions, follow-up arranged..." },
    ],
    ai: (f) => `You are Notrya AI. Draft a medicolegally complete AMA / Refusal of Care note. This note must withstand legal scrutiny.
Date: ${f.dt||"—"} | Type: ${f.rtype||"—"}
Capacity Criteria Met: ${arr(f.cap)} | Determination: ${f.capdet||"—"}
Risks Explained: ${arr(f.risks)} | Specific Risks: ${f.risksp||"—"}
Alternatives Offered: ${f.alts||"—"} | Understanding: ${f.under||"—"}
Witness: ${f.wit||"—"} | Signature: ${f.sig||"—"}
Family Notification: ${f.fam||"none"} | Disposition: ${f.dispo||"—"}
Sections: (1) Capacity Assessment — Appelbaum four criteria individually addressed, (2) Informed Refusal — all risks explicitly listed, (3) Alternatives Offered, (4) Patient Understanding Demonstrated, (5) Witness and Signature Documentation, (6) Disposition and Follow-Up, (7) Physician Attestation. Flag any missing required elements in brackets. Under 350 words. Do NOT fabricate.`,
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
  const nc = note?.color || T.teal;

  return (
    <div style={{maxWidth:760,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <button onClick={onBack} style={{background:"rgba(42,77,114,0.25)",border:`1px solid ${T.bdr}`,borderRadius:8,padding:"6px 14px",fontFamily:T.ff,fontSize:12,color:T.txt2,cursor:"pointer"}}>← Back</button>
        <span style={{fontSize:22}}>{note?.icon}</span>
        <div>
          <div style={{fontFamily:T.fs,fontSize:17,fontWeight:700,color:T.txt}}>{note?.title}</div>
          <div style={{fontFamily:T.ff,fontSize:11,color:T.txt4,marginTop:1}}>{note?.sub}</div>
        </div>
        <div style={{marginLeft:"auto",padding:"3px 10px",background:`${nc}18`,border:`1px solid ${nc}44`,borderRadius:6,fontFamily:T.fm,fontSize:9,color:nc,letterSpacing:1.2,textTransform:"uppercase"}}>TIER {note?.tier}</div>
      </div>

      <div style={card}>
        <div style={{fontFamily:T.fm,fontSize:9,fontWeight:700,color:T.txt4,letterSpacing:1,textTransform:"uppercase",marginBottom:14}}>Clinical Documentation</div>
        {cfg.fields.map(f => <Field key={f.id} f={f} val={form[f.id]} setVal={v=>set(f.id,v)} />)}
      </div>

      <div style={{textAlign:"center",marginBottom:16}}>
        <button onClick={generate} disabled={busy}
          style={{background:busy?"rgba(42,77,114,0.2)":`linear-gradient(135deg,rgba(45,212,191,0.15),rgba(59,158,255,0.15))`,border:`1px solid ${busy?T.bdr:T.teal}`,borderRadius:10,padding:"11px 30px",fontFamily:T.ff,fontSize:14,fontWeight:600,color:busy?T.txt4:T.teal,cursor:busy?"not-allowed":"pointer",transition:"all .15s"}}>
          {busy ? "⏳ Generating Note…" : "✨ AI Generate Note"}
        </button>
      </div>

      {err && <div style={{...card,border:`1px solid ${T.red}55`,color:T.red,fontSize:13}}>{err}</div>}

      {aiOut && (
        <div style={{...card,border:`1px solid rgba(45,212,191,0.3)`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontFamily:T.fm,fontSize:9,fontWeight:700,color:T.teal,letterSpacing:1,textTransform:"uppercase"}}>Generated Note</div>
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

// ─── MAIN HUB COMPONENT ───────────────────────────────────────────────────────
export default function SpecialtyNoteHub() {
  const [active, setActive] = useState(null);

  const pick = (note) => {
    if (note.tier === 1) { setActive(note.id); return; }
    window.location.href = createPageUrl(`SpecialtyNoteHubT${note.tier}`) + "?n=" + note.id;
  };

  if (active) {
    const note = NOTES.find(n=>n.id===active);
    return (
      <div style={{minHeight:"100vh",background:T.bg,padding:"24px 20px"}}>
        <NoteBuilder note={note} cfg={T1[active]} onBack={()=>setActive(null)} />
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",background:T.bg,padding:"24px 20px",fontFamily:T.ff,color:T.txt}}>
      <div style={{maxWidth:920,margin:"0 auto"}}>

        {/* Header */}
        <div style={{marginBottom:28}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <span style={{fontSize:24}}>📝</span>
            <div style={{fontFamily:T.fs,fontSize:24,fontWeight:700,color:T.txt}}>Specialty Note Hub</div>
          </div>
          <div style={{fontFamily:T.ff,fontSize:13,color:T.txt4}}>Medicolegal documentation · Attestation · Compliance notes · 13 note types across 3 tiers</div>
        </div>

        {/* Tier sections */}
        {[1,2,3].map(tier => {
          const tm = TIER_META[tier];
          const notes = NOTES.filter(n=>n.tier===tier);
          return (
            <div key={tier} style={{marginBottom:28}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                <div style={{width:3,height:20,background:tm.color,borderRadius:2,flexShrink:0}} />
                <div>
                  <div style={{fontFamily:T.ff,fontSize:12,fontWeight:700,color:tm.color,letterSpacing:.4}}>{tm.label}</div>
                  <div style={{fontFamily:T.ff,fontSize:11,color:T.txt4}}>{tm.sub}</div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(236px,1fr))",gap:10}}>
                {notes.map(note => (
                  <button key={note.id} onClick={()=>pick(note)}
                    style={{background:"linear-gradient(135deg,rgba(14,35,64,0.88),rgba(8,22,40,0.96))",border:"1px solid rgba(42,77,114,0.38)",borderRadius:12,padding:"14px 16px",cursor:"pointer",textAlign:"left",outline:"none",transition:"all .15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.border=`1px solid ${note.color}55`;e.currentTarget.style.background=`linear-gradient(135deg,${note.color}0e,rgba(8,22,40,0.96))`;}}
                    onMouseLeave={e=>{e.currentTarget.style.border="1px solid rgba(42,77,114,0.38)";e.currentTarget.style.background="linear-gradient(135deg,rgba(14,35,64,0.88),rgba(8,22,40,0.96))";}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <span style={{fontSize:16}}>{note.icon}</span>
                      <span style={{fontFamily:T.fm,fontSize:8,fontWeight:700,color:note.color,letterSpacing:1.2,textTransform:"uppercase"}}>T{tier}</span>
                    </div>
                    <div style={{fontFamily:T.ff,fontSize:13,fontWeight:600,color:T.txt,marginBottom:3}}>{note.title}</div>
                    <div style={{fontFamily:T.ff,fontSize:11,color:T.txt4,lineHeight:1.35}}>{note.sub}</div>
                    {tier !== 1 && <div style={{marginTop:8,fontFamily:T.ff,fontSize:10,color:T.txt4}}>Open in Tier {tier} page →</div>}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}