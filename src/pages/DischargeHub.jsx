import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

(() => {
  if (document.getElementById("dh-fonts")) return;
  const l = document.createElement("link"); l.id = "dh-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "dh-css";
  s.textContent = `
    *{box-sizing:border-box;}
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:rgba(42,79,122,0.5);border-radius:2px;}
    @keyframes dhFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes dhShimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    @keyframes dhSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    .dh-fade{animation:dhFade .22s ease forwards;}
    .dh-spin{animation:dhSpin 1s linear infinite;display:inline-block;}
    .dh-shimmer{
      background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#00d4ff 52%,#00e5c0 72%,#e8f0fe 100%);
      background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;animation:dhShimmer 5s linear infinite;
    }
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  red:"#ff4444", coral:"#ff6b6b", orange:"#ff9f43",
  yellow:"#f5c842", green:"#3dffa0", teal:"#00e5c0",
  blue:"#3b9eff", purple:"#9b6dff", cyan:"#00d4ff", rose:"#f472b6",
};
const glass = {
  backdropFilter:"blur(24px) saturate(200%)",
  WebkitBackdropFilter:"blur(24px) saturate(200%)",
  background:"rgba(8,22,40,0.78)",
  border:"1px solid rgba(42,79,122,0.35)",
  borderRadius:14,
};

// ── Disposition Decision Criteria ─────────────────────────────────
const DISPOSITIONS = [
  {
    id:"home",
    label:"Discharge Home",
    icon:"🏠",
    color:T.teal,
    criteria:[
      "Vital signs stable × 1–2 h observation (HR, BP, SpO₂, temperature at baseline)",
      "Pain adequately controlled on oral medications",
      "Tolerating PO — no ongoing vomiting, adequate oral intake for outpatient medications",
      "Ambulatory and functional at baseline (or caregiver who can assist)",
      "Reliable follow-up confirmed within 24–72 h as appropriate",
      "Patient (or caregiver) understands discharge instructions and return precautions",
      "Social support adequate — not discharged to unsafe or unsupported environment",
      "Medications prescribed: prescriptions sent, filled, or provided",
    ],
    redFlags:[
      "Uncontrolled pain requiring IV medications",
      "Persistent abnormal vital signs",
      "Unable to tolerate PO — oral medication compliance at risk",
      "No reliable follow-up arranged",
      "Social situation unsafe (domestic violence, homelessness, substance use without support)",
    ],
  },
  {
    id:"obs",
    label:"Observation / Short Stay",
    icon:"🛏️",
    color:T.yellow,
    criteria:[
      "Diagnosis requires serial labs, imaging, or clinical reassessment before final disposition",
      "Expected to resolve or clarify within 24–48 h without full inpatient admission level of care",
      "Classic examples: chest pain rule-out ACS (serial troponins), syncope workup, mild DKA",
      "Renal function trending but not yet stable — needs serial electrolytes",
      "Presenting complaint improved significantly but full resolution not yet achieved",
      "Social barrier to safe discharge but clinically improving — short observation to arrange support",
    ],
    redFlags:[
      "True inpatient-level diagnosis requiring active IV treatment > 48 h",
      "Condition likely to deteriorate without escalation of care level",
      "Surgical pathology requiring OR — observation is not holding pattern for OR",
    ],
  },
  {
    id:"admit",
    label:"Inpatient Admission",
    icon:"🏥",
    color:T.orange,
    criteria:[
      "Active IV medication requirement beyond 24 h (antibiotics, anticoagulation, vasopressors)",
      "Monitoring requirement: continuous cardiac monitor, frequent neuro checks, ventilator management",
      "Surgical condition requiring operative intervention or post-operative care",
      "Condition with significant risk of rapid deterioration requiring nurse-to-patient ratio > ward level",
      "Acute organ dysfunction requiring active management (AKI, hepatic failure, respiratory failure)",
      "High-risk social situation with inability to provide outpatient safety (active SI with plan, no support)",
    ],
    redFlags:[
      "Any hemodynamic instability (MAP < 65 despite fluids, O2 requirement > 4L, GCS < 14 — consider ICU)",
      "New diagnosis requiring inpatient workup + treatment initiation (new malignancy, new cirrhosis complications)",
    ],
  },
  {
    id:"icu",
    label:"ICU / Step-Down",
    icon:"🚨",
    color:T.coral,
    criteria:[
      "Any vasopressor requirement",
      "Mechanical ventilation (intubated or high-flow O2 with trajectory toward intubation)",
      "Continuous infusion of titratable medications (heparin, insulin drip, nicardipine, labetalol)",
      "GCS ≤ 8 or rapidly declining neuro status requiring close monitoring",
      "Post-cardiac arrest (ROSC) — therapeutic hypothermia protocol",
      "Septic shock with ongoing resuscitation",
      "Active massive hemorrhage — massive transfusion protocol active",
      "Acute MI requiring emergent intervention or hemodynamic monitoring",
    ],
    redFlags:[
      "Any of the above = ICU — do not admit to floor with these findings",
      "Rapid deterioration pathway: if floor bed is only option, place ICU consult and document clinical status clearly",
    ],
  },
  {
    id:"transfer",
    label:"Transfer to Higher Level",
    icon:"🚑",
    color:T.purple,
    criteria:[
      "Definitive care requires capability not available at current facility (cardiac cath, neurosurgery, ECMO, burn unit, NICU)",
      "STEMI requiring primary PCI — door-to-balloon time at receiving facility must be < 90 min",
      "Ruptured AAA, Type A dissection — vascular surgery / cardiothoracic surgery required immediately",
      "Pediatric critical illness at adult-only facility — transfer to pediatric center",
      "Burns requiring burn center (> 10% TBSA, full thickness, face/hands/genitalia/feet, circumferential, inhalation)",
      "Trauma requiring trauma center activation (penetrating, hemodynamic instability, multi-system)",
    ],
    redFlags:[
      "Stabilize before transfer: airway secured, large-bore access, blood products running if hemorrhaging",
      "Never transfer an unstable patient without calling receiving physician directly — verbal report mandatory",
      "Document: vital signs, interventions, and clinical status at time of transfer in chart",
    ],
  },
];

// ── Discharge Checklist Items ─────────────────────────────────────
const CHECKLIST_GROUPS = [
  {
    label:"Medical Clearance",
    color:T.teal,
    items:[
      { id:"vitals",       text:"Vital signs at baseline × 1 h (or documented stable trend)" },
      { id:"pain",         text:"Pain controlled on oral analgesics — IV narcotics not required last 2 h" },
      { id:"po",           text:"Tolerating PO — has taken at least one oral medication or fluids without vomiting" },
      { id:"ambulation",   text:"Ambulating safely — or caregiver can safely assist at home" },
      { id:"clinical",     text:"Clinical condition improved or stabilized — documented in physician note" },
      { id:"labs",         text:"All pending critical labs reviewed and actioned or communicated" },
    ],
  },
  {
    label:"Medications",
    color:T.blue,
    items:[
      { id:"rx_sent",      text:"All prescriptions sent electronically to pharmacy (or paper Rx given)" },
      { id:"rx_explained", text:"Patient/caregiver verbalized understanding of each medication and indication" },
      { id:"allergy",      text:"Allergy reconciliation completed — no known drug-allergy conflicts in discharge Rx" },
      { id:"med_list",     text:"Updated medication list provided — includes new, changed, and discontinued medications" },
      { id:"controlled",   text:"Controlled substances: quantity appropriate, prescription monitoring program checked" },
    ],
  },
  {
    label:"Patient Education",
    color:T.purple,
    items:[
      { id:"dx_explained", text:"Diagnosis explained in plain language — patient/caregiver can state their diagnosis" },
      { id:"activity",     text:"Activity restrictions reviewed (weight-bearing, driving, lifting, sexual activity)" },
      { id:"diet",         text:"Diet instructions reviewed (cardiac diet, diabetic diet, low-salt, clear liquids, etc.)" },
      { id:"wound",        text:"Wound care instructions given and demonstrated if applicable (dressing changes, drain care)" },
      { id:"return_prec",  text:"Return precautions given: specific symptoms that should prompt immediate return to ED" },
      { id:"written",      text:"Written discharge instructions provided in patient's primary language" },
    ],
  },
  {
    label:"Follow-Up",
    color:T.orange,
    items:[
      { id:"fu_booked",    text:"Follow-up appointment confirmed — specific date, time, provider, location" },
      { id:"fu_who",       text:"Correct follow-up provider identified (PCP, specialist, surgery) per diagnosis" },
      { id:"labs_fu",      text:"Pending results plan: patient knows what tests are outstanding and who will notify them" },
      { id:"referrals",    text:"Any specialist referrals placed and confirmed (not just 'told patient to call')" },
      { id:"imaging",      text:"Outpatient imaging ordered if applicable and patient knows where/when" },
    ],
  },
  {
    label:"Social & Safety",
    color:T.rose,
    items:[
      { id:"transport",    text:"Safe transport home arranged — patient not driving if sedated, post-procedure, or impaired" },
      { id:"caregiver",    text:"Caregiver available at home if patient requires assistance (elderly, post-op, pediatric)" },
      { id:"social_work",  text:"Social work consulted if concerns about food security, housing, or home safety" },
      { id:"abuse_screen", text:"Domestic violence / elder abuse screen completed if applicable — resources provided" },
      { id:"substance",    text:"Substance use addressed — referral, naloxone Rx (opioid use), or brief intervention documented" },
    ],
  },
];

// ── Return Precautions Library ────────────────────────────────────
const RETURN_PRECAUTIONS = [
  {
    category:"Chest / Cardiac",
    color:T.coral,
    icon:"🫀",
    conditions:[
      { dx:"Chest Pain Rule-Out", precautions:["Chest pain returns or worsens","Shortness of breath at rest or with minimal activity","Palpitations or new irregular heartbeat","Sweating associated with chest discomfort","Pain radiates to arm, jaw, or back"] },
      { dx:"Hypertension", precautions:["Headache (especially occipital, thunderclap)","Vision changes, blurred vision","Chest pain or shortness of breath","Confusion or speech changes"] },
      { dx:"AFib (rate-controlled, discharged)", precautions:["Return of palpitations lasting > 30 minutes","Shortness of breath significantly worsening","Lightheadedness or near-syncope","Any chest pain","Signs of stroke (face droop, arm weakness, speech difficulty)"] },
    ],
  },
  {
    category:"Respiratory",
    color:T.cyan,
    icon:"🫁",
    conditions:[
      { dx:"CAP (discharged on oral antibiotics)", precautions:["Fever > 38.5°C after 48 h on antibiotics","Worsening shortness of breath or O2 requirement","New chest pain","Unable to take oral antibiotics (vomiting)","Confusion or altered mental status"] },
      { dx:"Asthma / COPD Exacerbation", precautions:["Rescue inhaler needed more than q4h","Shortness of breath worsens despite medications","Cyanosis or inability to speak full sentences","Peak flow < 50% predicted (if patient has meter)"] },
    ],
  },
  {
    category:"Abdominal / GI",
    color:T.orange,
    icon:"🟤",
    conditions:[
      { dx:"Abdominal Pain (benign / uncomplicated)", precautions:["Pain significantly worsens or becomes constant","Fever > 38.5°C","Vomiting that prevents oral intake > 12 h","Abdominal rigidity or board-like abdomen","Blood in stool, black tarry stool, or bright red rectal bleeding"] },
      { dx:"Diverticulitis (mild, outpatient)", precautions:["Worsening pain not responding to antibiotics at 48 h","Fever persists or returns","Inability to tolerate liquids","New rectal bleeding"] },
    ],
  },
  {
    category:"Neuro / Head",
    color:T.purple,
    icon:"🧠",
    conditions:[
      { dx:"Syncope (workup negative)", precautions:["Recurrent syncope","Chest pain or palpitations prior to syncope","Any neurological symptoms (weakness, vision change, speech difficulty)","Seizure activity"] },
      { dx:"Headache (migraines, tension — benign)", precautions:["'Worst headache of my life' — sudden onset thunderclap","Fever + stiff neck (meningism)","Neurological changes: vision loss, weakness, speech difficulty","Headache wakes from sleep or progressive worsening over days"] },
      { dx:"Concussion (mild TBI discharged)", precautions:["Loss of consciousness","Seizure","Worsening headache not responding to OTC analgesics","Repeated vomiting (> 2 episodes)","Confusion worsening or new focal neurological deficits","One pupil larger than the other"] },
    ],
  },
  {
    category:"Wound / Ortho",
    color:T.yellow,
    icon:"🩹",
    conditions:[
      { dx:"Lacerations / Wound Care", precautions:["Increasing redness, warmth, or swelling around wound","Purulent discharge from wound","Red streaks extending from wound","Fever > 38°C","Wound edges separate or sutures/staples lost"] },
      { dx:"Fracture (splinted / casted)", precautions:["Increased pain not relieved by elevation and ice","Fingers/toes distal to cast: numbness, tingling, or unable to move","Cast becomes wet, cracked, or too tight","Swelling above or below cast significantly increased","Skin breakdown or sores under cast"] },
    ],
  },
  {
    category:"Pediatric",
    color:T.blue,
    icon:"👶",
    conditions:[
      { dx:"Fever / Viral Illness (child discharged)", precautions:["Fever > 39°C in infant < 3 months regardless","Fever persists > 5 days without improvement","Child inconsolable or unable to arouse","Rash + fever (non-blanching = return immediately)","Difficulty breathing or fast breathing","Refusal to drink liquids / signs of dehydration"] },
      { dx:"Gastroenteritis (child, discharged)", precautions:["Unable to keep down any fluids × 8 h","Signs of dehydration: no wet diapers × 8 h, no tears, sunken eyes, dry mouth","Blood in stool","Abdomen becomes rigid or severely tender"] },
    ],
  },
];

// ── Tabs ─────────────────────────────────────────────────────────
const TABS = [
  {id:"disposition", label:"Disposition Guide",    icon:"🏠"},
  {id:"checklist",   label:"Discharge Checklist",  icon:"✅"},
  {id:"precautions", label:"Return Precautions",   icon:"⚠️"},
  {id:"generator",   label:"AI Discharge Note",    icon:"🤖"},
];

// ── Primitives ────────────────────────────────────────────────────
function AmbientBg() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
      <div style={{position:"absolute",top:"-10%",left:"-5%",width:"50%",height:"50%",background:"radial-gradient(circle,rgba(0,212,255,0.07) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",bottom:"-10%",right:"-5%",width:"50%",height:"50%",background:"radial-gradient(circle,rgba(0,229,192,0.07) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",top:"45%",left:"35%",width:"30%",height:"30%",background:"radial-gradient(circle,rgba(59,158,255,0.04) 0%,transparent 70%)"}}/>
    </div>
  );
}

// ── Disposition Card ──────────────────────────────────────────────
function DispositionCard({ dispo, expanded, onToggle }) {
  return (
    <div style={{...glass,overflow:"hidden",marginBottom:10,cursor:"pointer",
      border:`1px solid ${expanded?dispo.color+"55":"rgba(42,79,122,0.35)"}`,
      borderTop:`3px solid ${dispo.color}`,transition:"border-color .15s"}}>
      <div onClick={onToggle}
        style={{padding:"14px 18px",display:"flex",alignItems:"center",gap:14,
          background:`linear-gradient(135deg,${dispo.color}09,rgba(8,22,40,0.93))`}}>
        <span style={{fontSize:26,flexShrink:0}}>{dispo.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:16,color:dispo.color}}>{dispo.label}</div>
          <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4,marginTop:2}}>{dispo.criteria[0]}</div>
        </div>
        <span style={{color:T.txt4,fontSize:12,flexShrink:0}}>{expanded?"▲":"▼"}</span>
      </div>
      {expanded && (
        <div className="dh-fade" style={{borderTop:"1px solid rgba(42,79,122,0.28)",padding:"14px 18px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:0}}>
            <div style={{padding:"10px 13px",background:`${dispo.color}0a`,border:`1px solid ${dispo.color}25`,borderRadius:10}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,color:dispo.color,
                letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>✅ Criteria to Admit / Discharge Here</div>
              {dispo.criteria.map((c,i)=>(
                <div key={i} style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:5}}>
                  <span style={{color:dispo.color,fontSize:8,marginTop:3,flexShrink:0}}>▸</span>
                  <span style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5}}>{c}</span>
                </div>
              ))}
            </div>
            <div style={{padding:"10px 13px",background:"rgba(255,68,68,0.05)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:10}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,color:T.red,
                letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>🚨 Red Flags — Escalate</div>
              {dispo.redFlags.map((r,i)=>(
                <div key={i} style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:5}}>
                  <span style={{color:T.red,fontSize:8,marginTop:3,flexShrink:0}}>▸</span>
                  <span style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5}}>{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Checklist ─────────────────────────────────────────────────────
function DischargeChecklist() {
  const [checked, setChecked] = useState({});
  const toggle = (id) => setChecked(p=>({...p,[id]:!p[id]}));

  const totalItems = CHECKLIST_GROUPS.reduce((a,g)=>a+g.items.length,0);
  const totalChecked = Object.values(checked).filter(Boolean).length;
  const pct = Math.round((totalChecked/totalItems)*100);

  return (
    <div className="dh-fade">
      {/* Progress */}
      <div style={{...glass,padding:"14px 18px",marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <span style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.teal,fontWeight:700}}>Discharge Readiness</span>
          <span style={{fontFamily:"JetBrains Mono",fontSize:14,fontWeight:700,color:pct===100?T.green:pct>=70?T.yellow:T.txt3}}>{pct}%</span>
        </div>
        <div style={{height:6,background:"rgba(26,53,85,0.6)",borderRadius:4,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${T.teal},${pct===100?T.green:T.blue})`,borderRadius:4,transition:"width .4s ease"}}/>
        </div>
        <div style={{marginTop:6,fontFamily:"DM Sans",fontSize:11,color:T.txt4}}>
          {totalChecked} of {totalItems} items complete
          {pct===100&&<span style={{color:T.green,marginLeft:8,fontWeight:700}}>✓ Ready for discharge</span>}
        </div>
      </div>

      {CHECKLIST_GROUPS.map((grp,gi)=>(
        <div key={gi} style={{...glass,marginBottom:10,overflow:"hidden"}}>
          <div style={{padding:"10px 16px",background:`linear-gradient(135deg,${grp.color}09,rgba(8,22,40,0.93))`,
            borderBottom:"1px solid rgba(42,79,122,0.3)",display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:3,height:16,borderRadius:2,background:grp.color,flexShrink:0}}/>
            <span style={{fontFamily:"JetBrains Mono",fontSize:10,fontWeight:700,color:grp.color,
              letterSpacing:1.5,textTransform:"uppercase"}}>{grp.label}</span>
            <span style={{marginLeft:"auto",fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4}}>
              {grp.items.filter(it=>checked[it.id]).length}/{grp.items.length}
            </span>
          </div>
          <div style={{padding:"10px 16px"}}>
            {grp.items.map((item)=>(
              <label key={item.id}
                style={{display:"flex",alignItems:"flex-start",gap:10,padding:"7px 10px",borderRadius:8,cursor:"pointer",
                  background:checked[item.id]?`${grp.color}08`:"transparent",
                  border:`1px solid ${checked[item.id]?grp.color+"30":"transparent"}`,
                  marginBottom:4,transition:"all .15s"}}>
                <div onClick={()=>toggle(item.id)}
                  style={{width:18,height:18,borderRadius:5,flexShrink:0,marginTop:1,
                    background:checked[item.id]?grp.color:"rgba(14,37,68,0.6)",
                    border:`1.5px solid ${checked[item.id]?grp.color:"rgba(42,79,122,0.5)"}`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:11,color:"#050f1e",fontWeight:700,transition:"all .15s"}}>
                  {checked[item.id]&&"✓"}
                </div>
                <span style={{fontFamily:"DM Sans",fontSize:12,color:checked[item.id]?T.txt2:T.txt3,lineHeight:1.55,
                  textDecoration:checked[item.id]?"line-through":"none",transition:"all .15s"}}>
                  {item.text}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <div style={{display:"flex",justifyContent:"center",gap:10,marginTop:6}}>
        <button onClick={()=>setChecked({})}
          style={{fontFamily:"DM Sans",fontSize:12,fontWeight:600,padding:"7px 18px",
            borderRadius:10,cursor:"pointer",border:"1px solid rgba(42,79,122,0.4)",
            background:"transparent",color:T.txt3}}>
          Reset All
        </button>
        <button
          onClick={()=>{
            const all={};
            CHECKLIST_GROUPS.forEach(g=>g.items.forEach(it=>{all[it.id]=true;}));
            setChecked(all);
          }}
          style={{fontFamily:"DM Sans",fontSize:12,fontWeight:600,padding:"7px 18px",
            borderRadius:10,cursor:"pointer",border:`1px solid ${T.teal}44`,
            background:`${T.teal}10`,color:T.teal}}>
          Check All
        </button>
      </div>
    </div>
  );
}

// ── Return Precautions ────────────────────────────────────────────
function ReturnPrecautionsPanel() {
  const [activeCat, setActiveCat] = useState(null);
  const [activeDx, setActiveDx] = useState(null);

  const selectedCat = RETURN_PRECAUTIONS.find(c=>c.category===activeCat);
  const selectedDx = selectedCat?.conditions.find(c=>c.dx===activeDx);

  return (
    <div className="dh-fade">
      <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3,marginBottom:12}}>
        Select a category and diagnosis to view return precaution language.
      </div>

      {/* Category pills */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
        {RETURN_PRECAUTIONS.map(cat=>(
          <button key={cat.category}
            onClick={()=>{setActiveCat(cat.category===activeCat?null:cat.category);setActiveDx(null);}}
            style={{fontFamily:"DM Sans",fontSize:11,fontWeight:600,padding:"6px 14px",
              borderRadius:20,cursor:"pointer",transition:"all .15s",
              border:`1px solid ${activeCat===cat.category?cat.color+"88":cat.color+"33"}`,
              background:activeCat===cat.category?`${cat.color}20`:`${cat.color}08`,
              color:activeCat===cat.category?cat.color:T.txt3}}>
            {cat.icon} {cat.category}
          </button>
        ))}
      </div>

      {/* Diagnosis selector */}
      {selectedCat && (
        <div className="dh-fade" style={{...glass,padding:"12px 14px",marginBottom:12}}>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:selectedCat.color,
            letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Select Diagnosis</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {selectedCat.conditions.map(cond=>(
              <button key={cond.dx}
                onClick={()=>setActiveDx(cond.dx===activeDx?null:cond.dx)}
                style={{fontFamily:"DM Sans",fontSize:11,fontWeight:600,padding:"5px 13px",
                  borderRadius:8,cursor:"pointer",transition:"all .15s",
                  border:`1px solid ${activeDx===cond.dx?selectedCat.color+"88":"rgba(42,79,122,0.4)"}`,
                  background:activeDx===cond.dx?`${selectedCat.color}18`:"rgba(14,37,68,0.5)",
                  color:activeDx===cond.dx?selectedCat.color:T.txt2}}>
                {cond.dx}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Precautions display */}
      {selectedDx && (
        <div className="dh-fade" style={{...glass,padding:"14px 16px",
          border:`1px solid ${selectedCat.color}44`,
          borderTop:`3px solid ${selectedCat.color}`}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div>
              <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:15,color:selectedCat.color}}>{selectedDx.dx}</div>
              <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4,marginTop:2}}>Return to the Emergency Department if any of the following:</div>
            </div>
            <button
              onClick={()=>navigator.clipboard.writeText(`Return to the ED immediately if you experience any of the following:\n\n${selectedDx.precautions.map((p,i)=>`${i+1}. ${p}`).join("\n")}`)}
              style={{fontFamily:"DM Sans",fontSize:11,fontWeight:600,padding:"5px 12px",
                borderRadius:8,cursor:"pointer",border:`1px solid ${selectedCat.color}44`,
                background:`${selectedCat.color}10`,color:selectedCat.color,whiteSpace:"nowrap"}}>
              📋 Copy
            </button>
          </div>
          <div style={{padding:"12px 14px",background:"rgba(14,37,68,0.5)",borderRadius:10}}>
            {selectedDx.precautions.map((p,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:i<selectedDx.precautions.length-1?8:0}}>
                <span style={{fontFamily:"JetBrains Mono",fontSize:10,fontWeight:700,
                  color:selectedCat.color,flexShrink:0,minWidth:18}}>{i+1}.</span>
                <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt,lineHeight:1.6}}>{p}</span>
              </div>
            ))}
          </div>
          <div style={{marginTop:10,fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4}}>
            ⚕ Verify precautions are appropriate for this patient's specific clinical context before using.
          </div>
        </div>
      )}

      {!activeCat && (
        <div style={{...glass,padding:"32px",textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:10}}>⚠️</div>
          <div style={{fontFamily:"DM Sans",fontSize:13,color:T.txt3}}>Select a category above to view return precautions</div>
        </div>
      )}
    </div>
  );
}

// ── AI Discharge Note Generator ───────────────────────────────────
function DischargeNoteGenerator() {
  const [form, setForm] = useState({
    name:"", age:"", sex:"", dx:"", hpi:"",
    treatment:"", fu:"", rx:"", restrictions:"", precautions:"",
  });
  const [generating, setGenerating] = useState(false);
  const [note, setNote] = useState(null);
  const [err, setErr] = useState(null);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const generate = useCallback(async () => {
    if (!form.dx || !form.hpi) return;
    setGenerating(true); setErr(null); setNote(null);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a professional, patient-friendly ED discharge summary note for the following patient. Write in clear, plain language that a patient can understand. Include all sections below.

Patient Information:
- Name: ${form.name||"[Patient]"}
- Age/Sex: ${form.age||"?"}yo ${form.sex||""}
- Diagnosis: ${form.dx}
- Clinical Summary (HPI): ${form.hpi}
- Treatment Received in ED: ${form.treatment||"Not specified"}
- Discharge Medications/Prescriptions: ${form.rx||"Per physician"}
- Activity/Diet Restrictions: ${form.restrictions||"As tolerated"}
- Follow-Up Plan: ${form.fu||"To be arranged"}
- Return Precautions: ${form.precautions||"Standard precautions for diagnosis"}

Generate a discharge note with these sections:
1. DIAGNOSIS
2. WHAT HAPPENED (plain language summary of the visit)
3. WHAT WE DID (treatments and tests performed)
4. YOUR MEDICATIONS (clear list with purpose)
5. ACTIVITY AND DIET INSTRUCTIONS
6. FOLLOW-UP PLAN
7. WHEN TO RETURN TO THE EMERGENCY DEPARTMENT (specific red flags)
8. PHYSICIAN CLOSING STATEMENT

Use plain language. Be thorough but concise. Format with clear section headers.`,
        response_json_schema: {
          type:"object",
          properties:{
            note:{type:"string",description:"Complete formatted discharge note text"}
          }
        }
      });
      setNote(result.note || result);
    } catch(e) {
      setErr("Error generating note: " + (e.message||"Unknown error"));
    } finally { setGenerating(false); }
  }, [form]);

  const fields = [
    {k:"name",    label:"Patient Name",           ph:"John Smith", half:true},
    {k:"age",     label:"Age",                    ph:"54",         half:true},
    {k:"sex",     label:"Sex",                    ph:"Male/Female",half:true},
    {k:"dx",      label:"Diagnosis *",            ph:"e.g. Acute Appendicitis, Community-Acquired Pneumonia", half:false},
    {k:"hpi",     label:"Brief Clinical Summary *",ph:"What brought the patient in, key findings, clinical course in ED", area:true, half:false},
    {k:"treatment",label:"Treatment in ED",       ph:"IV antibiotics, oxygen, IV fluids, laceration repair...", area:true, half:false},
    {k:"rx",      label:"Discharge Medications",  ph:"Amoxicillin 500mg TID × 7d, Ibuprofen 600mg q8h PRN pain...", area:true, half:false},
    {k:"restrictions",label:"Restrictions",       ph:"No driving × 24h, light activity × 1 week, soft diet...", half:false},
    {k:"fu",      label:"Follow-Up Plan",          ph:"PCP in 3 days, Orthopedics in 1 week at (clinic)...", half:false},
    {k:"precautions",label:"Return Precautions",  ph:"Return if fever > 38.5C, worsening pain, vomiting...", area:true, half:false},
  ];

  return (
    <div className="dh-fade">
      <div style={{padding:"10px 14px",background:"rgba(0,212,255,0.07)",
        border:"1px solid rgba(0,212,255,0.2)",borderRadius:10,marginBottom:14,
        fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
        🤖 <strong style={{color:T.cyan}}>AI Discharge Note:</strong> Fill in the clinical details and the AI
        will generate a complete, patient-friendly discharge summary ready to print or copy.
      </div>

      <div style={{...glass,padding:"16px 18px",marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {fields.map(f=>(
            <div key={f.k} style={{gridColumn:f.half?"auto":"1 / -1"}}>
              <label style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt3,
                textTransform:"uppercase",letterSpacing:1.5,display:"block",marginBottom:4,fontWeight:700}}>
                {f.label}
              </label>
              {f.area ? (
                <textarea value={form[f.k]} onChange={e=>set(f.k,e.target.value)}
                  placeholder={f.ph} rows={3}
                  style={{width:"100%",background:"rgba(14,37,68,0.7)",
                    border:`1px solid ${form[f.k]?"rgba(0,212,255,0.45)":"rgba(42,79,122,0.3)"}`,
                    borderRadius:8,padding:"8px 12px",outline:"none",resize:"vertical",
                    fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.65}}/>
              ) : (
                <input value={form[f.k]} onChange={e=>set(f.k,e.target.value)}
                  placeholder={f.ph}
                  style={{width:"100%",background:"rgba(14,37,68,0.7)",
                    border:`1px solid ${form[f.k]?"rgba(0,212,255,0.45)":"rgba(42,79,122,0.3)"}`,
                    borderRadius:8,padding:"8px 12px",outline:"none",
                    fontFamily:"DM Sans",fontSize:12,color:T.txt2}}/>
              )}
            </div>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:12,gap:8}}>
          <button onClick={()=>{setForm({name:"",age:"",sex:"",dx:"",hpi:"",treatment:"",fu:"",rx:"",restrictions:"",precautions:""});setNote(null);}}
            style={{fontFamily:"DM Sans",fontSize:12,fontWeight:600,padding:"8px 16px",
              borderRadius:10,cursor:"pointer",border:"1px solid rgba(42,79,122,0.4)",
              background:"transparent",color:T.txt3}}>
            Clear
          </button>
          <button onClick={generate} disabled={generating||!form.dx||!form.hpi}
            style={{fontFamily:"DM Sans",fontWeight:700,fontSize:12,padding:"8px 22px",
              borderRadius:10,cursor:generating||!form.dx||!form.hpi?"not-allowed":"pointer",
              border:`1px solid ${!form.dx||!form.hpi?"rgba(42,79,122,0.3)":"rgba(0,212,255,0.5)"}`,
              background:!form.dx||!form.hpi?"rgba(42,79,122,0.15)":"linear-gradient(135deg,rgba(0,212,255,0.22),rgba(0,212,255,0.08))",
              color:!form.dx||!form.hpi?T.txt4:T.cyan}}>
            {generating?<><span className="dh-spin">⚙</span> Generating...</>:"📄 Generate Discharge Note"}
          </button>
        </div>
      </div>

      {err && (
        <div style={{padding:"10px 14px",background:"rgba(255,68,68,0.1)",
          border:"1px solid rgba(255,68,68,0.3)",borderRadius:10,marginBottom:12,
          fontFamily:"DM Sans",fontSize:12,color:T.coral}}>{err}</div>
      )}

      {generating && (
        <div style={{...glass,padding:"32px",textAlign:"center"}}>
          <span className="dh-spin" style={{fontSize:32,display:"block",marginBottom:10}}>⚙</span>
          <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2}}>Generating discharge note for {form.dx}...</div>
        </div>
      )}

      {note && !generating && (
        <div className="dh-fade" style={{...glass,padding:"16px 18px",
          border:"1px solid rgba(0,212,255,0.3)",
          borderTop:"3px solid rgba(0,212,255,0.6)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.cyan,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>
              📄 Discharge Note — {form.dx}
            </span>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>navigator.clipboard.writeText(typeof note==="object"?JSON.stringify(note):note)}
                style={{fontFamily:"DM Sans",fontSize:11,fontWeight:600,padding:"5px 12px",
                  borderRadius:8,cursor:"pointer",border:`1px solid ${T.cyan}44`,
                  background:`${T.cyan}10`,color:T.cyan}}>
                📋 Copy
              </button>
              <button onClick={()=>window.print()}
                style={{fontFamily:"DM Sans",fontSize:11,fontWeight:600,padding:"5px 12px",
                  borderRadius:8,cursor:"pointer",border:"1px solid rgba(42,79,122,0.4)",
                  background:"transparent",color:T.txt3}}>
                🖨️ Print
              </button>
            </div>
          </div>
          <pre style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.75,
            whiteSpace:"pre-wrap",wordBreak:"break-word",maxHeight:480,overflowY:"auto",
            padding:"12px",background:"rgba(5,15,30,0.6)",borderRadius:10}}>
            {typeof note==="object" ? JSON.stringify(note, null, 2) : note}
          </pre>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function DischargeHub() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("disposition");
  const [expandedDispo, setExpandedDispo] = useState(null);

  return (
    <div style={{fontFamily:"DM Sans, sans-serif",background:T.bg,minHeight:"100vh",
      position:"relative",overflow:"hidden",color:T.txt}}>
      <AmbientBg/>
      <div style={{position:"relative",zIndex:1,maxWidth:1100,margin:"0 auto",padding:"0 16px"}}>

        {/* Header */}
        <div style={{padding:"18px 0 14px"}}>
          <button onClick={()=>navigate("/hub")}
            style={{marginBottom:10,display:"inline-flex",alignItems:"center",gap:7,
              fontFamily:"DM Sans",fontSize:12,fontWeight:600,
              background:"rgba(14,37,68,0.7)",border:"1px solid rgba(42,79,122,0.5)",
              borderRadius:8,padding:"5px 14px",color:T.txt3,cursor:"pointer",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.color=T.txt2;e.currentTarget.style.borderColor="rgba(0,212,255,0.4)";}}
            onMouseLeave={e=>{e.currentTarget.style.color=T.txt3;e.currentTarget.style.borderColor="rgba(42,79,122,0.5)";}}>
            ← Back to Hub
          </button>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",
              background:"rgba(5,15,30,0.9)",border:"1px solid rgba(42,79,122,0.6)",
              borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.cyan,letterSpacing:3}}>NOTRYA</span>
              <span style={{color:T.txt4,fontFamily:"JetBrains Mono",fontSize:10}}>/</span>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3,letterSpacing:2}}>DISCHARGE</span>
            </div>
            <div style={{height:1,flex:1,background:"linear-gradient(90deg,rgba(0,212,255,0.5),transparent)"}}/>
          </div>
          <h1 className="dh-shimmer"
            style={{fontFamily:"Playfair Display",fontSize:"clamp(24px,4vw,40px)",fontWeight:900,letterSpacing:-1,lineHeight:1.1}}>
            Discharge Hub
          </h1>
          <p style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3,marginTop:4}}>
            Disposition Decision Guide · Discharge Checklist · Return Precautions · AI Discharge Note Generator
          </p>
        </div>

        {/* Stat banner */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:16}}>
          {[
            {label:"Disposition Guides", value:"5",    sub:"Home to ICU criteria",      color:T.teal  },
            {label:"Checklist Items",    value:"26",   sub:"Across 5 domains",           color:T.cyan  },
            {label:"Return Precautions", value:"11",   sub:"Dx-specific language",       color:T.orange},
            {label:"AI Note Generator",  value:"Live", sub:"Full discharge summary",     color:T.blue  },
          ].map((b,i)=>(
            <div key={i} style={{...glass,padding:"9px 13px",borderLeft:`3px solid ${b.color}`,
              background:`linear-gradient(135deg,${b.color}12,rgba(8,22,40,0.8))`,borderRadius:10}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:14,fontWeight:700,color:b.color,lineHeight:1}}>{b.value}</div>
              <div style={{fontFamily:"DM Sans",fontWeight:600,color:T.txt,fontSize:10,margin:"3px 0"}}>{b.label}</div>
              <div style={{fontFamily:"DM Sans",fontSize:9,color:T.txt4}}>{b.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{...glass,padding:"6px",display:"flex",gap:5,marginBottom:16}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{flex:"1 1 auto",fontFamily:"DM Sans",fontWeight:600,fontSize:12,padding:"9px 8px",
                borderRadius:10,
                border:`1px solid ${tab===t.id?"rgba(0,212,255,0.5)":"transparent"}`,
                background:tab===t.id?"linear-gradient(135deg,rgba(0,212,255,0.18),rgba(0,212,255,0.07))":"transparent",
                color:tab===t.id?T.cyan:T.txt3,
                cursor:"pointer",textAlign:"center",transition:"all .15s"}}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ═══ DISPOSITION TAB ═══ */}
        {tab==="disposition" && (
          <div className="dh-fade">
            <div style={{padding:"10px 14px",background:"rgba(0,212,255,0.06)",
              border:"1px solid rgba(0,212,255,0.18)",borderRadius:10,marginBottom:14,
              fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              📋 Use this guide to determine the appropriate level of care for your patient.
              Each option includes criteria for appropriate disposition and red flags that should prompt escalation.
            </div>
            {DISPOSITIONS.map(d=>(
              <DispositionCard key={d.id} dispo={d}
                expanded={expandedDispo===d.id}
                onToggle={()=>setExpandedDispo(p=>p===d.id?null:d.id)}/>
            ))}
          </div>
        )}

        {/* ═══ CHECKLIST TAB ═══ */}
        {tab==="checklist" && <DischargeChecklist/>}

        {/* ═══ PRECAUTIONS TAB ═══ */}
        {tab==="precautions" && <ReturnPrecautionsPanel/>}

        {/* ═══ AI NOTE TAB ═══ */}
        {tab==="generator" && <DischargeNoteGenerator/>}

        {/* Footer */}
        <div style={{textAlign:"center",paddingBottom:24,paddingTop:14}}>
          <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5}}>
            NOTRYA DISCHARGE HUB · CLINICAL DECISION SUPPORT · VERIFY ALL DECISIONS WITH ATTENDING PHYSICIAN · AI FOR EDUCATIONAL SUPPORT ONLY
          </span>
        </div>
      </div>
    </div>
  );
}