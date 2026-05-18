import React, { useState } from "react";

// ════════════════════════════════════════════════════════════
//  STEMI HUB — Phase 2 Port to Notrya Glassmorphism
//  Original: standalone T/G design system
//  Ported:   Notrya CSS vars + glassmorphism primitives
//  Props:    onBack (fn) · embedded (bool)
//  Tabs:     ECG & Diagnosis · Activation · Medications · Complications
// ════════════════════════════════════════════════════════════

// ── Color accent palette (matches Notrya CardiacHub vars) ──
const A = {
  coral:  { bg:"rgba(255,107,107,0.07)",  br:"rgba(255,107,107,0.30)",  c:"var(--coral)"  },
  teal:   { bg:"rgba(0,229,192,0.07)",    br:"rgba(0,229,192,0.30)",    c:"var(--teal)"   },
  blue:   { bg:"rgba(59,158,255,0.07)",   br:"rgba(59,158,255,0.30)",   c:"var(--blue)"   },
  gold:   { bg:"rgba(245,200,66,0.07)",   br:"rgba(245,200,66,0.30)",   c:"var(--gold)"   },
  purple: { bg:"rgba(155,109,255,0.09)",  br:"rgba(155,109,255,0.30)",  c:"var(--purple)" },
  orange: { bg:"rgba(255,159,67,0.07)",   br:"rgba(255,159,67,0.30)",   c:"var(--orange)" },
  green:  { bg:"rgba(61,255,160,0.07)",   br:"rgba(61,255,160,0.30)",   c:"var(--green)"  },
};

// ── Style helpers ───────────────────────────────────────────
const gBox = (extra={}) => ({
  background:"rgba(8,22,40,0.65)",
  backdropFilter:"blur(16px)",
  WebkitBackdropFilter:"blur(16px)",
  border:"1px solid var(--border)",
  borderRadius:12,
  ...extra,
});

const aBox = (key, mb=10) => ({
  background:A[key].bg,
  border:`1px solid ${A[key].br}`,
  borderRadius:10,
  padding:"10px 14px",
  marginBottom:mb,
});

// ── Shared micro-components ─────────────────────────────────
function Bul({c, children}){
  return(
    <div style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:5}}>
      <span style={{color:c||"var(--txt3)",fontSize:10,marginTop:3,flexShrink:0}}>▸</span>
      <span style={{fontSize:12,color:"var(--txt2)",lineHeight:1.55}}>{children}</span>
    </div>
  );
}

function SLabel({c="var(--teal)", children}){
  return(
    <div style={{fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:c,margin:"18px 0 10px",display:"flex",alignItems:"center",gap:8}}>
      <div style={{height:1,width:20,background:c,opacity:.3,flexShrink:0}}/>
      {children}
      <div style={{height:1,flex:1,background:c,opacity:.15}}/>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  CLINICAL DATA
// ════════════════════════════════════════════════════════════

const TERRITORIES = [
  { lead:"II, III, aVF",        territory:"Inferior",            artery:"RCA (80%) · LCx (20%)",       color:"orange",
    caveat:"Check V3R/V4R for RV infarct · avoid nitrates if RV involvement · AV block common" },
  { lead:"V1–V4",               territory:"Anterior / Septal",   artery:"LAD (proximal)",               color:"coral",
    caveat:"Highest mortality · largest territory · cardiogenic shock risk · watch for new LBBB" },
  { lead:"V3–V5",               territory:"Anterior",            artery:"LAD (mid)",                    color:"coral",
    caveat:"Moderate-sized infarct · LV function generally preserved compared to proximal LAD" },
  { lead:"I, aVL, V5–V6",      territory:"Lateral",             artery:"LCx or diagonal branch",       color:"blue",
    caveat:"May coexist with anterior or inferior STEMI · isolated lateral MI often small" },
  { lead:"V1–V6 + I + aVL",    territory:"Extensive Anterior",  artery:"Proximal LAD (pre-diagonal)",  color:"coral",
    caveat:"Very high mortality · complete LAD territory · cardiogenic shock very likely · LVAD consideration early" },
  { lead:"V1–V2 STD + tall R",  territory:"Posterior",           artery:"RCA or LCx",                   color:"purple",
    caveat:"STEMI equivalent · order posterior leads V7–V9 · STE ≥ 0.5mm confirms · often missed as NSTEMI" },
  { lead:"V3R, V4R",            territory:"Right Ventricular",   artery:"Proximal RCA",                 color:"gold",
    caveat:"Complicates 25–40% of inferior MI · avoid nitrates / diuretics / morphine · fluid resuscitate · preload dependent" },
];

const STEMI_EQUIVALENTS = [
  { eq:"New LBBB",             color:"coral",
    detail:"New or presumed-new LBBB + ischemic symptoms = STEMI equivalent · activate cath lab · Sgarbossa criteria to confirm ischemia: concordant STE ≥ 1mm, discordant STE ≥ 5mm (Smith-modified ≥ 25% of S-wave), or STD ≥ 1mm in V1–V3" },
  { eq:"De Winter T-Waves",    color:"orange",
    detail:"Upsloping ST depression ≥ 1mm at J-point + tall symmetric T-waves in V1–V6 · LAD occlusion equivalent · often misread as NSTEMI or 'early repolarization' · immediate cath lab regardless of troponin" },
  { eq:"Posterior STEMI",      color:"purple",
    detail:"ST depression V1–V2 + dominant R wave ≥ 0.04s + upright T wave → posterior STEMI · confirm with V7–V9 (STE ≥ 0.5mm) · RCA or LCx · order posterior leads proactively for all inferior MI" },
  { eq:"Wellens Syndrome",     color:"blue",
    detail:"Type A: biphasic T-waves in V2–V3 · Type B: deeply inverted T-waves V2–V3 · occurs during chest pain-free interval · critical proximal LAD stenosis · HIGH risk of massive anterior MI · do NOT stress test · urgent cath · may have normal troponin on presentation" },
  { eq:"aVR Elevation + Diffuse STD", color:"coral",
    detail:"STE in aVR ≥ 1mm + diffuse ST depression ≥ 6 leads · left main or proximal LAD equivalent · cardiogenic shock likely · highest mortality STEMI pattern · immediate interventional cardiology" },
];

const ACTIVATION_CHECKLIST = [
  { key:"ecg",      label:"12-lead ECG interpreted — STEMI confirmed",                         time:"0 min",    color:"coral"  },
  { key:"rightecg", label:"Right-sided ECG (V3R–V4R) if inferior STEMI",                      time:"0 min",    color:"orange" },
  { key:"notify",   label:"Cath lab activated · attending cardiologist notified",              time:"≤ 10 min", color:"coral"  },
  { key:"asp",      label:"Aspirin 324 mg PO chewed — non-enteric",                           time:"0 min",    color:"teal"   },
  { key:"iv",       label:"IV access × 2 (≥ 16G) + STAT bloods drawn",                       time:"0 min",    color:"blue"   },
  { key:"monitor",  label:"Continuous 12-lead monitoring · SpO₂ · BP",                        time:"0 min",    color:"blue"   },
  { key:"p2y12",    label:"P2Y12 loaded — ticagrelor 180 mg PO preferred",                   time:"≤ 10 min", color:"teal"   },
  { key:"heparin",  label:"UFH 60 U/kg IV (max 4,000 U) ordered",                            time:"≤ 15 min", color:"purple" },
  { key:"bparms",   label:"BP both arms measured — rule out aortic dissection",               time:"0 min",    color:"gold"   },
  { key:"echo",     label:"Bedside echo — only if does NOT delay cath lab",                   time:"ASAP",     color:"blue"   },
  { key:"npo",      label:"NPO — nothing by mouth",                                           time:"0 min",    color:"gold"   },
  { key:"consent",  label:"Informed consent obtained (or documented emergency exception)",    time:"Pre-cath", color:"purple" },
  { key:"cxr",      label:"Portable CXR — only if does NOT delay cath lab",                  time:"ASAP",     color:"blue"   },
];

const ANTIPLATELETS = [
  { drug:"Aspirin",    dose:"324 mg PO chewed · then 81 mg/day indefinitely",                    timing:"Immediately on arrival",             note:"COR I · give all STEMI unless true allergy",           pref:false },
  { drug:"Ticagrelor", dose:"180 mg PO loading · then 90 mg BID × 12 months",                   timing:"Before cath if no prior stroke/TIA", note:"COR I · preferred P2Y12 · more potent than clopidogrel", pref:true  },
  { drug:"Prasugrel",  dose:"60 mg PO loading · then 10 mg/day × 12 months",                   timing:"At time of PCI only — not pre-Rx",   note:"COR I at PCI · avoid if prior stroke/TIA · age > 75 · wt < 60 kg", pref:false },
  { drug:"Clopidogrel",dose:"600 mg PO loading · then 75 mg/day × 12 months",                  timing:"If preferred P2Y12 contraindicated",  note:"COR IIa · less potent · fallback agent",               pref:false },
];

const LYTICS_ABS = [
  "Prior intracranial hemorrhage (any time)",
  "Ischemic stroke within 3 months",
  "Structural cerebrovascular lesion (AVM · aneurysm)",
  "Known intracranial malignancy",
  "Suspected aortic dissection",
  "Active significant internal bleeding (not menses)",
  "Significant closed-head or facial trauma within 3 months",
];

const LYTICS_REL = [
  "Poorly controlled HTN (SBP > 180 / DBP > 110) at presentation",
  "History of prior ischemic stroke (> 3 months)",
  "Traumatic or prolonged CPR (> 10 min)",
  "Major surgery within 3 weeks",
  "Recent internal bleeding within 2–4 weeks",
  "Non-compressible vascular punctures",
  "Pregnancy",
  "Active peptic ulcer",
  "Age > 75 (increased ICH risk — consider dose reduction)",
];

const COMPLICATIONS = [
  { key:"shock", icon:"🩸", title:"Cardiogenic Shock", incidence:"15–20% of STEMI", color:"coral",
    def:"SBP < 90 mmHg > 30 min despite adequate filling · OR vasopressor / MCS required · OR CI < 1.8 L/min/m² with hypoperfusion signs (cool, altered, oliguric)",
    items:["Immediate revascularization (PCI) — only intervention proven to improve survival · COR I regardless of time from onset",
           "Norepinephrine first-line vasopressor (SOAP-II trial) — target MAP ≥ 65 mmHg",
           "Dobutamine 2.5–10 mcg/kg/min for low output without severe hypotension",
           "IABP: uncertain mortality benefit (IABP-SHOCK II) — may use for temporary stabilization",
           "Impella CP / 5.5: emerging data for refractory shock · escalate early before full deterioration",
           "VA-ECMO: severe refractory shock or cardiac arrest bridge · high mortality regardless",
           "Activate STEMI Shock Team protocol · early CT surgery involvement"]},
  { key:"vsr", icon:"🫀", title:"Ventricular Septal Rupture", incidence:"< 1% (rare post-stenting era)", color:"purple",
    def:"New harsh holosystolic murmur + rapid hemodynamic deterioration · typically 3–5 days post-STEMI (earlier with reperfusion) · inferior > anterior",
    items:["Echo: color Doppler showing left-to-right shunt through septum — diagnostic",
           "Distinguish from acute MR: VSR → step-up in right heart O₂ saturation on PA catheter",
           "IABP to reduce afterload and shunt fraction — bridge to surgery",
           "Emergent surgical repair (primary closure or patch) — high operative mortality but far better than medical alone",
           "Percutaneous VSR closure: less established · high residual shunt rate · consider for surgical non-candidates"]},
  { key:"mr", icon:"🫀", title:"Acute Mitral Regurgitation", incidence:"Rare · < 1%", color:"orange",
    def:"Papillary muscle rupture or dysfunction · posterior PM more affected (single blood supply, RCA) · inferior STEMI · acute pulmonary edema + new systolic murmur",
    items:["Echo: flail leaflet / papillary muscle rupture · severe MR jet · pulmonary HTN on Doppler",
           "Rapid hemodynamic deterioration — fulminant pulmonary edema + cardiogenic shock",
           "IABP + vasodilators (reduce afterload) — bridge only · definitive = surgery",
           "Emergency mitral valve repair or replacement — timing urgent/emergent",
           "Medical management alone is nearly universally fatal in complete PM rupture"]},
  { key:"rupture", icon:"💔", title:"Free Wall Rupture", incidence:"< 1% — often fatal", color:"coral",
    def:"Acute tamponade + PEA arrest · typically 1–5 days post-STEMI · anterior STEMI · elderly · women · late presenters · NSAIDs/steroids are risk factors",
    items:["Sudden hemodynamic collapse + PEA arrest — tamponade physiology on bedside echo",
           "Subacute form (pseudoaneurysm): contained rupture → pericardial effusion without immediate arrest · may be discovered incidentally",
           "Emergent pericardiocentesis as bridge only — NOT definitive treatment",
           "Immediate cardiac surgery — suture repair or patch closure",
           "Overall prognosis very poor — most do not survive to OR · advance family goals-of-care discussion"]},
  { key:"arrhythmia", icon:"⚡", title:"Arrhythmia Complications", incidence:"Up to 50% — leading early cause of death", color:"gold",
    def:"Most malignant arrhythmias occur within 24–48h from ischemia-mediated electrical instability. Correct all electrolytes aggressively.",
    items:["VF / pulseless VT: defibrillate 200J biphasic immediately · amiodarone 150 mg IV · ACLS · urgent PCI",
           "AIVR (accelerated idioventricular rhythm): reperfusion arrhythmia · 60–100 bpm · usually benign · observe · no treatment",
           "Sustained monomorphic VT: cardiovert if unstable · amiodarone if stable · rule out recurrent ischemia",
           "Complete heart block (inferior MI): proximal RCA · transcutaneous pacing → transvenous pacing · often resolves post-reperfusion",
           "Sinus bradycardia / Mobitz I (inferior): atropine 0.5–1 mg IV · avoid in Mobitz II / complete block → TCP directly",
           "New AF: rate control (diltiazem / β-blocker) + anticoagulation · if unstable → synchronized cardioversion"]},
  { key:"ischemia", icon:"🔁", title:"Recurrent Ischemia", incidence:"3–10% post-PCI", color:"blue",
    def:"New or recurrent chest pain + ECG changes post-STEMI treatment · stent thrombosis vs. infarct extension vs. new vessel event · treat as new STEMI until proven otherwise",
    items:["Acute stent thrombosis: sudden onset, typically within 30 days · recurrent ST changes in stented territory · emergent repeat cath",
           "In-stent restenosis: gradual onset weeks–months · recurrent stable angina · non-emergent cath",
           "Reinfarction: new chest pain + new STE or LBBB · urgent cath lab reactivation per STEMI protocol",
           "Dressler Syndrome (pericarditis): 1–8 weeks post-MI · pleuritic pain · saddle ST elevation · treat with NSAIDs + colchicine"]},
];

// ════════════════════════════════════════════════════════════
//  TAB COMPONENTS
// ════════════════════════════════════════════════════════════

function ECGTab(){
  const [selLead, setSelLead] = useState(null);

  return(
    <div>
      <div style={aBox("coral",16)}>
        <div style={{fontSize:12,fontWeight:700,color:"var(--coral)",marginBottom:4}}>Time = Myocardium — Every 30-Min Delay Increases Mortality ~7.5%</div>
        <div style={{fontSize:11.5,color:"var(--txt3)",lineHeight:1.6}}>Activate cath lab immediately on ECG recognition. Do NOT wait for labs, repeat ECGs, troponin results, or stabilisation. Door-to-balloon ≤ 90 min is a Class I recommendation.</div>
      </div>

      {/* Diagnostic Criteria */}
      <SLabel c="var(--coral)">Diagnostic Criteria — J-Point Elevation ≥ 2 Contiguous Leads</SLabel>
      <div style={{...gBox({padding:"14px 16px",marginBottom:14})}}>
        {[
          {criteria:"Men < 40 years — V2–V3",         threshold:"≥ 2.5 mm"},
          {criteria:"Men ≥ 40 years — V2–V3",         threshold:"≥ 2.0 mm"},
          {criteria:"Women — V2–V3",                   threshold:"≥ 1.5 mm"},
          {criteria:"All other leads (any sex / age)", threshold:"≥ 1.0 mm"},
          {criteria:"Posterior leads V7–V9",           threshold:"≥ 0.5 mm → posterior STEMI"},
          {criteria:"Right-sided V3R, V4R",            threshold:"≥ 0.5 mm → RV STEMI"},
          {criteria:"New LBBB + ischemic symptoms",    threshold:"STEMI equivalent — activate"},
        ].map(({criteria,threshold},i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:5,marginBottom:5,borderBottom:i<6?"1px solid var(--border)":"none"}}>
            <span style={{fontSize:12,color:"var(--txt2)"}}>{criteria}</span>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,color:"var(--coral)",flexShrink:0,marginLeft:12}}>{threshold}</span>
          </div>
        ))}
      </div>

      {/* STEMI Equivalents */}
      <SLabel c="var(--blue)">STEMI Equivalents — Do NOT Miss</SLabel>
      {STEMI_EQUIVALENTS.map(({eq,detail,color})=>(
        <div key={eq} style={{...gBox({padding:"10px 12px",marginBottom:7,borderLeft:`3px solid ${A[color].c}`})}}>
          <div style={{fontSize:12,fontWeight:700,color:A[color].c,marginBottom:3}}>{eq}</div>
          <div style={{fontSize:11.5,color:"var(--txt3)",lineHeight:1.45}}>{detail}</div>
        </div>
      ))}

      {/* Territory Localizer */}
      <SLabel c="var(--gold)">Territory Localizer — tap lead group to identify culprit artery</SLabel>
      <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:14}}>
        {TERRITORIES.map(t=>{
          const isOpen = selLead === t.lead;
          return(
            <div key={t.lead} onClick={()=>setSelLead(isOpen ? null : t.lead)}
              style={{...gBox({padding:"10px 13px",cursor:"pointer",transition:"all 0.18s",border:`1px solid ${isOpen ? A[t.color].br : "var(--border)"}`,background:isOpen ? A[t.color].bg : "rgba(8,22,40,0.65)"})}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,color:A[t.color].c,minWidth:130,flexShrink:0}}>{t.lead}</span>
                <span style={{fontSize:12,color:"var(--txt)",flex:1}}>{t.territory}</span>
                <span style={{fontSize:9,background:A[t.color].bg,border:`1px solid ${A[t.color].br}`,borderRadius:20,padding:"2px 8px",color:A[t.color].c,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,flexShrink:0,whiteSpace:"nowrap"}}>{t.artery}</span>
              </div>
              {isOpen&&(
                <div style={{marginTop:8,paddingTop:8,borderTop:`1px solid ${A[t.color].br}`,fontSize:11.5,color:A[t.color].c,lineHeight:1.45}}>
                  ⚠ {t.caveat}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* RV Infarct Protocol */}
      <SLabel c="var(--gold)">RV Infarct Protocol — Suspect in ALL Inferior STEMI</SLabel>
      <div style={{...gBox({padding:"14px 16px",border:"1px solid rgba(245,200,66,0.30)"})}}>
        <div style={{fontSize:12,fontWeight:700,color:"var(--gold)",marginBottom:10}}>Obtain V3R–V6R for every inferior STEMI — ST elevation ≥ 0.5 mm in V4R is diagnostic</div>
        {[
          {step:"Diagnosis",    detail:"JVD + hypotension + clear lung fields = classic triad · nitroglycerin-induced hypotension is a red flag for RV dependence",                  color:"gold"},
          {step:"Do NOT Give",  detail:"Nitrates (vasodilate → catastrophic preload drop) · Diuretics · Morphine · ACE inhibitors acutely — all reduce preload and can precipitate shock", color:"coral"},
          {step:"Fluid Resus",  detail:"0.9% NS 500 mL bolus → assess response · may need 1–2L to maintain hemodynamics · if no response → dobutamine 2.5–10 mcg/kg/min",         color:"teal"},
          {step:"Arrhythmia",   detail:"High-grade AV block common with proximal RCA occlusion · transcutaneous pacing ready at bedside · AV synchrony critical for RV filling",   color:"blue"},
        ].map(({step,detail,color})=>(
          <div key={step} style={{...aBox(color,7)}}>
            <div style={{fontSize:12,fontWeight:700,color:A[color].c,marginBottom:3}}>{step}</div>
            <div style={{fontSize:11.5,color:"var(--txt3)"}}>{detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivationTab(){
  const [checked, setChecked] = useState({});
  const toggle = (key) => setChecked(p=>({...p,[key]:!p[key]}));
  const done = ACTIVATION_CHECKLIST.filter(c=>checked[c.key]).length;
  const pct  = Math.round((done / ACTIVATION_CHECKLIST.length) * 100);

  return(
    <div>
      {/* Time targets */}
      <SLabel c="var(--coral)">Time Targets — 2025 ACC/AHA Class I</SLabel>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:16}}>
        {[
          {icon:"📋",label:"Door-to-ECG",    target:"≤ 10 min", color:"var(--blue)"},
          {icon:"🏥",label:"Door-to-Balloon",target:"≤ 90 min", color:"var(--coral)"},
          {icon:"💉",label:"Door-to-Needle", target:"≤ 30 min", color:"var(--gold)"},
          {icon:"🚁",label:"FMC-to-Device",  target:"≤ 120 min",color:"var(--teal)"},
        ].map((t,i)=>(
          <div key={i} style={{...gBox({padding:"10px 12px"}),display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:18,flexShrink:0}}>{t.icon}</span>
            <div>
              <div style={{fontSize:10,color:"var(--txt3)"}}>{t.label}</div>
              <div style={{fontSize:16,fontWeight:700,color:t.color,fontFamily:"'JetBrains Mono',monospace"}}>{t.target}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Reperfusion strategy */}
      <SLabel c="var(--blue)">Reperfusion Strategy Decision</SLabel>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
        <div style={{...gBox({padding:"12px 13px",borderLeft:"3px solid var(--teal)"})}}>
          <div style={{fontSize:12,fontWeight:700,color:"var(--teal)",marginBottom:6}}>Primary PCI — Preferred</div>
          {["PCI-capable center available","FMC-to-device ≤ 120 min achievable","Symptom onset < 12h (up to 24h if ongoing ischemia)","Cardiogenic shock or high-risk STEMI (any time from onset)","Fibrinolysis contraindicated"].map((s,i)=><Bul key={i} c="var(--teal)">{s}</Bul>)}
        </div>
        <div style={{...gBox({padding:"12px 13px",borderLeft:"3px solid var(--gold)"})}}>
          <div style={{fontSize:12,fontWeight:700,color:"var(--gold)",marginBottom:6}}>Fibrinolysis — When PCI Not Achievable</div>
          {["PCI NOT achievable within 120 min of FMC","Symptom onset < 12h · no absolute CIs","Door-to-needle ≤ 30 min","TNK (tenecteplase) — weight-based single IV bolus","Transfer immediately post-lysis for rescue PCI (within 3–24h)"].map((s,i)=><Bul key={i} c="var(--gold)">{s}</Bul>)}
        </div>
      </div>

      {/* Activation Checklist */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"var(--teal)"}}>STEMI Activation Checklist</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:90,height:4,background:"rgba(26,53,85,0.8)",borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${pct}%`,background:"var(--teal)",borderRadius:2,transition:"width .3s"}}/>
          </div>
          <span style={{fontSize:10,color:"var(--teal)",fontFamily:"'JetBrains Mono',monospace",fontWeight:700,whiteSpace:"nowrap"}}>{done}/{ACTIVATION_CHECKLIST.length}</span>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        {ACTIVATION_CHECKLIST.map(({key,label,time,color})=>{
          const on=!!checked[key];
          return(
            <div key={key} onClick={()=>toggle(key)}
              style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",background:on?A[color].bg:"rgba(14,37,68,0.4)",border:`1px solid ${on?A[color].br:"var(--border)"}`,borderRadius:8,padding:"8px 12px",transition:"all .15s",backdropFilter:"blur(8px)"}}>
              <div style={{width:18,height:18,borderRadius:4,flexShrink:0,border:`1.5px solid ${on?A[color].c:"rgba(42,79,122,0.6)"}`,background:on?A[color].c:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                {on&&<span style={{color:"var(--bg)",fontSize:10,fontWeight:900,lineHeight:1}}>✓</span>}
              </div>
              <span style={{fontSize:12,color:on?"var(--txt2)":"var(--txt2)",flex:1,textDecoration:on?"line-through":"none",opacity:on?0.65:1}}>{label}</span>
              <span style={{fontSize:9,color:on?A[color].c:"var(--txt4)",fontFamily:"'JetBrains Mono',monospace",flexShrink:0}}>{time}</span>
            </div>
          );
        })}
      </div>
      {done===ACTIVATION_CHECKLIST.length&&(
        <div style={{...aBox("teal",0),marginTop:12,textAlign:"center"}}>
          <div style={{fontSize:12,fontWeight:700,color:"var(--teal)"}}>✓ STEMI Activation Complete — {ACTIVATION_CHECKLIST.length}/{ACTIVATION_CHECKLIST.length} items</div>
        </div>
      )}
    </div>
  );
}

function MedicationsTab(){
  return(
    <div>
      <div style={aBox("blue",14)}>
        <div style={{fontSize:11.5,color:"var(--txt3)",lineHeight:1.6}}>For interactive TNK weight-based dosing calculator — use the <strong style={{color:"var(--coral)"}}>ACS Protocol</strong> hub (TNK Tool tab). For full anticoagulation options (UFH · bivalirudin · enoxaparin) — see <strong style={{color:"var(--coral)"}}>ACS Protocol → Rx tab</strong>.</div>
      </div>

      {/* Antiplatelets */}
      <SLabel>Antiplatelets — Dual Antiplatelet Therapy (DAPT) Required</SLabel>
      {ANTIPLATELETS.map(({drug,dose,timing,note,pref})=>(
        <div key={drug} style={{...gBox({padding:"12px 14px",marginBottom:8,borderLeft:`3px solid ${pref ? "var(--teal)" : "rgba(42,79,122,0.6)"}`})}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
            <span style={{fontSize:13,fontWeight:700,color:pref?"var(--teal)":"var(--txt)"}}>{drug}</span>
            {pref&&<span style={{fontSize:9,background:"rgba(0,229,192,0.12)",border:"1px solid rgba(0,229,192,0.35)",borderRadius:20,padding:"1px 7px",color:"var(--teal)",fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>PREFERRED P2Y12</span>}
          </div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:"var(--txt2)",marginBottom:4}}>{dose}</div>
          <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
            <span style={{fontSize:11,color:"var(--orange)"}}>⏰ {timing}</span>
            <span style={{fontSize:11,color:"var(--txt3)"}}>{note}</span>
          </div>
        </div>
      ))}

      {/* Fibrinolytic CIs */}
      <SLabel c="var(--coral)">Fibrinolytic Contraindications</SLabel>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        <div style={{...gBox({padding:"12px 13px"})}}>
          <div style={{fontSize:11,fontWeight:700,color:"var(--coral)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>🚫 Absolute</div>
          {LYTICS_ABS.map((item,i)=><Bul key={i} c="var(--coral)">{item}</Bul>)}
        </div>
        <div style={{...gBox({padding:"12px 13px"})}}>
          <div style={{fontSize:11,fontWeight:700,color:"var(--gold)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>⚠ Relative</div>
          {LYTICS_REL.map((item,i)=><Bul key={i} c="var(--gold)">{item}</Bul>)}
        </div>
      </div>

      {/* Adjuncts */}
      <SLabel c="var(--gold)">Key Adjunctive Medications — COR I Unless Noted</SLabel>
      {[
        {drug:"UFH",             dose:"60 U/kg IV bolus (max 4,000 U) → 12 U/kg/h (max 1,000 U/h)",          note:"Standard anticoagulation for primary PCI",           color:"blue"},
        {drug:"Bivalirudin",     dose:"0.75 mg/kg IV → 1.75 mg/kg/h during PCI",                             note:"Alternative to UFH · less bleeding · COR IIa",      color:"teal"},
        {drug:"Atorvastatin",    dose:"80 mg PO STAT · high-intensity statin",                               note:"COR I · start immediately regardless of LDL baseline",color:"purple"},
        {drug:"Metoprolol",      dose:"25–50 mg PO q6–12h (oral route) — start within 24h",                  note:"Avoid if bradycardia / AV block / shock / AHF",      color:"orange"},
        {drug:"ACE Inhibitor",   dose:"Lisinopril 2.5–5 mg PO BID — start within 24h if tolerated",         note:"COR I especially anterior STEMI / reduced EF",       color:"gold"},
        {drug:"Oxygen",          dose:"Supplement ONLY if SpO₂ < 90%",                                       note:"COR III (harm) for routine use — hyperoxia is harmful",color:"teal"},
      ].map(({drug,dose,note,color})=>(
        <div key={drug} style={{...gBox({padding:"9px 12px",marginBottom:6,borderLeft:`3px solid ${A[color].c}`})}}>
          <div style={{fontSize:12,fontWeight:700,color:A[color].c,marginBottom:3}}>{drug}</div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--txt2)",marginBottom:3}}>{dose}</div>
          <div style={{fontSize:11,color:"var(--txt3)"}}>{note}</div>
        </div>
      ))}
    </div>
  );
}

function ComplicationsTab(){
  const [open, setOpen] = useState(null);
  const toggle = (key) => setOpen(p=>p===key ? null : key);

  return(
    <div>
      <div style={aBox("orange",16)}>
        <div style={{fontSize:11.5,color:"var(--txt3)",lineHeight:1.6}}>Mechanical complications are rare but rapidly lethal. New murmur + hemodynamic deterioration post-STEMI requires immediate bedside echo. Tap each complication to expand full management.</div>
      </div>

      {COMPLICATIONS.map(({key,icon,title,incidence,color,def,items})=>{
        const isOpen = open===key;
        return(
          <div key={key} style={{marginBottom:8,borderRadius:12,overflow:"hidden",border:`1px solid ${isOpen?A[color].br:"var(--border)"}`,backdropFilter:"blur(12px)"}}>
            <div onClick={()=>toggle(key)}
              style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",cursor:"pointer",background:isOpen?A[color].bg:"rgba(8,22,40,0.65)",transition:"all .2s"}}>
              <span style={{fontSize:18,flexShrink:0}}>{icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:A[color].c}}>{title}</div>
                <div style={{fontSize:10,color:"var(--txt4)",fontFamily:"'JetBrains Mono',monospace",marginTop:2}}>{incidence}</div>
              </div>
              <span style={{fontSize:10,color:"var(--txt4)",flexShrink:0}}>{isOpen?"▲":"▼"}</span>
            </div>
            {isOpen&&(
              <div style={{padding:"12px 14px",borderTop:`1px solid ${A[color].br}`,background:"rgba(5,12,24,0.88)"}}>
                <div style={{fontSize:11.5,color:"var(--txt3)",marginBottom:10,lineHeight:1.5,fontStyle:"italic",paddingBottom:8,borderBottom:"1px solid var(--border)"}}>{def}</div>
                {items.map((item,i)=><Bul key={i} c={A[color].c}>{item}</Bul>)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ════════════════════════════════════════════════════════════
const TABS_META = [
  {label:"ECG & Diagnosis", icon:"📈"},
  {label:"Activation",      icon:"⚡"},
  {label:"Medications",     icon:"💊"},
  {label:"Complications",   icon:"⚠️"},
];

export default function STEMIHub({onBack, embedded=false}){
  const [tab, setTab] = useState(0);

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14,fontFamily:"'DM Sans',sans-serif"}}>

      {/* Page Header — matches GlassPageHeader pattern from CardiacHub */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,background:"rgba(8,22,40,0.72)",border:"1px solid rgba(255,107,107,0.28)",borderRadius:14,padding:"14px 18px",borderLeft:"3px solid var(--coral)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",boxShadow:"0 4px 24px rgba(0,0,0,0.4)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {onBack&&(
            <button onClick={onBack} style={{background:"rgba(26,53,85,0.6)",border:"1px solid rgba(42,79,122,0.6)",borderRadius:8,padding:"5px 10px",color:"var(--txt3)",fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",backdropFilter:"blur(8px)"}}>
              ← Back
            </button>
          )}
          <div style={{width:44,height:44,borderRadius:12,background:"rgba(255,107,107,0.12)",border:"1px solid rgba(255,107,107,0.30)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🫀</div>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:"var(--txt)"}}>STEMI Hub</span>
              <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",background:"rgba(255,107,107,0.10)",color:"var(--coral)",border:"1px solid rgba(255,107,107,0.30)",borderRadius:20,padding:"2px 9px",fontWeight:700}}>2025 ACC/AHA</span>
            </div>
            <div style={{fontSize:11,color:"var(--txt3)",marginTop:2}}>Territory localizer · STEMI equivalents · Activation checklist · Post-STEMI complications</div>
          </div>
        </div>
      </div>

      {/* Time Banner — matches TimeBanner pattern */}
      <div style={{display:"flex",gap:8}}>
        {[
          {icon:"📋",label:"Door-to-ECG",    target:"≤ 10 min", color:"var(--blue)"},
          {icon:"🏥",label:"Door-to-Balloon",target:"≤ 90 min", color:"var(--coral)"},
          {icon:"💉",label:"Door-to-Needle", target:"≤ 30 min", color:"var(--gold)"},
          {icon:"🚁",label:"FMC-to-Device",  target:"≤ 120 min",color:"var(--teal)"},
        ].map((t,i)=>(
          <div key={i} style={{flex:1,background:"rgba(8,22,40,0.65)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 10px",display:"flex",alignItems:"center",gap:8,backdropFilter:"blur(10px)"}}>
            <span style={{fontSize:14,flexShrink:0}}>{t.icon}</span>
            <div>
              <div style={{fontSize:9,color:"var(--txt3)"}}>{t.label}</div>
              <div style={{fontSize:11,fontWeight:700,color:t.color,fontFamily:"'JetBrains Mono',monospace"}}>{t.target}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Bar — matches CardiacHub tab bar pattern */}
      <div style={{display:"flex",gap:4,background:"rgba(8,22,40,0.65)",border:"1px solid rgba(26,53,85,0.75)",borderRadius:10,padding:4,backdropFilter:"blur(12px)"}}>
        {TABS_META.map((t,i)=>(
          <button key={t.label} onClick={()=>setTab(i)}
            style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:7,fontSize:12,fontWeight:tab===i?700:500,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,flex:1,justifyContent:"center",transition:"all .2s",background:tab===i?"rgba(255,107,107,0.12)":"transparent",border:tab===i?"1px solid rgba(255,107,107,0.30)":"1px solid transparent",color:tab===i?"var(--coral)":"var(--txt3)"}}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Content — matches GlassSectionBox pattern */}
      <div style={{background:"rgba(8,22,40,0.65)",border:"1px solid rgba(26,53,85,0.75)",borderRadius:14,padding:"18px 20px",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",boxShadow:"0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,paddingBottom:12,borderBottom:"1px solid rgba(26,53,85,0.6)"}}>
          <span style={{fontSize:18}}>{TABS_META[tab].icon}</span>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:"var(--txt)"}}>{TABS_META[tab].label} — STEMI</div>
            <div style={{fontSize:11,color:"var(--txt3)"}}>2025 ACC/AHA/ACEP/NAEMSP/SCAI ACS Guideline</div>
          </div>
          <span style={{marginLeft:"auto",fontSize:10,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,padding:"3px 10px",borderRadius:20,background:"linear-gradient(90deg,rgba(255,107,107,.1),rgba(245,200,66,.08))",border:"1px solid rgba(255,107,107,.25)",color:"var(--coral)"}}>STEMI · CLASS I</span>
        </div>
        {tab===0 && <ECGTab/>}
        {tab===1 && <ActivationTab/>}
        {tab===2 && <MedicationsTab/>}
        {tab===3 && <ComplicationsTab/>}
      </div>

    </div>
  );
}