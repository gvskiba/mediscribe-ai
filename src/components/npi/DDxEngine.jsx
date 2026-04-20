import { useState, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";

// ─── DDx ENGINE ───────────────────────────────────────────────────────────────
// Canonical location. pages/DDxEngine.jsx re-exports from here.

const PREFIX = "ddx";

if (typeof document !== "undefined") {
  const fontId = `${PREFIX}-fonts`;
  if (!document.getElementById(fontId)) {
    const l = document.createElement("link");
    l.id = fontId; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
    document.head.appendChild(l);
    const s = document.createElement("style");
    s.id = `${PREFIX}-css`;
    s.textContent = `
      @keyframes ${PREFIX}fade  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      @keyframes ${PREFIX}shim  { 0%,100%{background-position:-200% center} 50%{background-position:200% center} }
      @keyframes ${PREFIX}pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      @keyframes ${PREFIX}spin  { to{transform:rotate(360deg)} }
      .${PREFIX}-fade  { animation:${PREFIX}fade  .25s ease both; }
      .${PREFIX}-pulse { animation:${PREFIX}pulse 1.8s ease-in-out infinite; }
      .${PREFIX}-spin  { animation:${PREFIX}spin  1s linear infinite; }
      .${PREFIX}-shim  {
        background:linear-gradient(90deg,#f2f7ff 0%,#fff 25%,#00e5c0 50%,#3b9eff 75%,#f2f7ff 100%);
        background-size:250% auto; -webkit-background-clip:text;
        -webkit-text-fill-color:transparent; background-clip:text;
        animation:${PREFIX}shim 6s linear infinite;
      }
      ::-webkit-scrollbar { width:3px; height:3px; }
      ::-webkit-scrollbar-track { background:transparent; }
      ::-webkit-scrollbar-thumb { background:rgba(42,79,122,.5); border-radius:2px; }
    `;
    document.head.appendChild(s);
  }
}

const T = {
  bg:"#050f1e", txt:"#ffffff", txt2:"#d8ecff", txt3:"#a8ccee", txt4:"#7aaace",
  teal:"#00e5c0", gold:"#f5c842", red:"#ff4444", green:"#3dffa0",
  blue:"#3b9eff", purple:"#9b6dff", orange:"#ff9f43", coral:"#ff6b6b",
};

const glass = {
  backdropFilter:"blur(20px) saturate(180%)", WebkitBackdropFilter:"blur(20px) saturate(180%)",
  background:"rgba(8,22,40,0.78)", border:"1px solid rgba(42,79,122,0.35)", borderRadius:14,
};

const TIER = {
  must_rule_out: { label:"Must Rule Out", color:T.red,    icon:"🚨", rank:0 },
  high:          { label:"High",          color:T.orange, icon:"🔴", rank:1 },
  moderate:      { label:"Moderate",      color:T.gold,   icon:"🟡", rank:2 },
  low:           { label:"Low",           color:T.teal,   icon:"🟢", rank:3 },
};

const CC_QUICK = [
  "Chest Pain", "Shortness of Breath", "Abdominal Pain", "Headache",
  "Syncope", "Altered Mental Status", "Back Pain", "Leg Pain/Swelling",
  "Fever", "Dizziness", "Palpitations", "Trauma — Head",
  "Ankle/Foot Injury", "Knee Injury", "Weakness/Numbness",
];

const RULES = [
  {
    id:"heart", name:"HEART Score", icon:"❤️",
    cc:["Chest Pain","Palpitations","Syncope"],
    desc:"Risk stratification for chest pain patients. Predicts 6-week MACE.",
    cite:"Brady et al., 2010",
    criteria:[
      { id:"history", label:"History", type:"choice", choices:[
        {l:"Slightly suspicious",   p:0},
        {l:"Moderately suspicious", p:1},
        {l:"Highly suspicious",     p:2},
      ]},
      { id:"ekg", label:"EKG", type:"choice", choices:[
        {l:"Normal",                             p:0},
        {l:"Non-specific repolarization change", p:1},
        {l:"Significant ST deviation",           p:2},
      ]},
      { id:"age", label:"Age", type:"choice", choices:[
        {l:"< 45",  p:0},
        {l:"45-64", p:1},
        {l:">= 65", p:2},
      ]},
      { id:"risk", label:"Risk Factors", type:"choice", choices:[
        {l:"No known risk factors",                    p:0},
        {l:"1-2 risk factors or obesity or smoker",    p:1},
        {l:">= 3 RFs or hx atherosclerosis or DM",     p:2},
      ]},
      { id:"trop", label:"Troponin", type:"choice", choices:[
        {l:"<= normal limit",   p:0},
        {l:"1-3x normal",       p:1},
        {l:"> 3x normal",       p:2},
      ]},
    ],
    interpret(score) {
      if (score <= 3) return { label:"Low Risk",      color:T.green,  action:"0.9-1.7% MACE — Consider early discharge with outpatient follow-up" };
      if (score <= 6) return { label:"Moderate Risk", color:T.gold,   action:"12-16.6% MACE — Admit for observation; serial troponins; stress test or cath" };
      return                 { label:"High Risk",     color:T.red,    action:"50-65% MACE — Early invasive strategy; cardiology consult" };
    },
  },
  {
    id:"wells_dvt", name:"Wells DVT", icon:"🦵",
    cc:["Leg Pain/Swelling","Shortness of Breath"],
    desc:"Pre-test probability for deep vein thrombosis.",
    cite:"Wells et al., 1997",
    criteria:[
      { id:"cancer",      label:"Active cancer (treatment or palliation within 6mo)",      type:"bool", points:1  },
      { id:"paralysis",   label:"Paralysis, paresis, or recent plaster immobilization",    type:"bool", points:1  },
      { id:"bedridden",   label:"Recently bedridden >3d or major surgery <12 weeks",       type:"bool", points:1  },
      { id:"tenderness",  label:"Localized tenderness along deep venous system",           type:"bool", points:1  },
      { id:"leg_swollen", label:"Entire leg swollen",                                      type:"bool", points:1  },
      { id:"calf",        label:"Calf swelling >3cm compared with other leg",              type:"bool", points:1  },
      { id:"pitting",     label:"Pitting edema (greater in symptomatic leg)",              type:"bool", points:1  },
      { id:"collateral",  label:"Collateral superficial veins (nonvaricose)",              type:"bool", points:1  },
      { id:"prev_dvt",    label:"Previously documented DVT",                               type:"bool", points:1  },
      { id:"alt_dx",      label:"Alternative diagnosis at least as likely as DVT",        type:"bool", points:-2 },
    ],
    interpret(score) {
      if (score <= 1) return { label:"Low Probability",      color:T.green, action:"DVT unlikely. D-dimer if negative rules out DVT; no imaging needed if PERC met" };
      if (score <= 2) return { label:"Moderate Probability", color:T.gold,  action:"DVT possible. Obtain compression ultrasound" };
      return                 { label:"High Probability",     color:T.red,   action:"DVT likely. Compression ultrasound; consider anticoagulation before imaging" };
    },
  },
  {
    id:"wells_pe", name:"Wells PE", icon:"🫁",
    cc:["Shortness of Breath","Chest Pain","Leg Pain/Swelling","Palpitations","Syncope"],
    desc:"Pre-test clinical probability for pulmonary embolism.",
    cite:"Wells et al., 2000",
    criteria:[
      { id:"dvt_sx",   label:"Clinical signs/symptoms of DVT",                        type:"bool", points:3   },
      { id:"alt_less", label:"PE is #1 diagnosis OR equally likely",                  type:"bool", points:3   },
      { id:"hr100",    label:"Heart rate > 100 bpm",                                  type:"bool", points:1.5 },
      { id:"immob",    label:"Immobilization >=3d or surgery in previous 4 weeks",    type:"bool", points:1.5 },
      { id:"prev_pe",  label:"Previous DVT or PE",                                    type:"bool", points:1.5 },
      { id:"hemopt",   label:"Hemoptysis",                                            type:"bool", points:1   },
      { id:"malig",    label:"Malignancy (treated within 6mo or palliative)",         type:"bool", points:1   },
    ],
    interpret(score) {
      if (score < 2)  return { label:"Low Probability",      color:T.green, action:"~2% PE prevalence. If PERC criteria all absent -> rule out PE. Otherwise D-dimer" };
      if (score <= 6) return { label:"Moderate Probability", color:T.gold,  action:"~17% PE prevalence. D-dimer if <=4; if elevated -> CT-PA. Consider PERC if borderline" };
      return                 { label:"High Probability",     color:T.red,   action:"~65% PE prevalence. Proceed directly to CT-PA. Consider anticoagulation before imaging" };
    },
  },
  {
    id:"perc", name:"PERC Rule", icon:"🫀",
    cc:["Shortness of Breath","Chest Pain","Palpitations"],
    desc:"Rules out PE if ALL 8 criteria are absent AND pre-test probability is low (Wells <2).",
    cite:"Kline et al., 2004",
    criteria:[
      { id:"age50",   label:"Age >= 50",                           type:"bool", points:1 },
      { id:"hr100",   label:"Heart rate >= 100 bpm",               type:"bool", points:1 },
      { id:"spo2",    label:"SpO2 < 95% on room air",              type:"bool", points:1 },
      { id:"leg_sx",  label:"Unilateral leg swelling",             type:"bool", points:1 },
      { id:"hemopt",  label:"Hemoptysis",                          type:"bool", points:1 },
      { id:"surgery", label:"Recent surgery or trauma within 4 weeks", type:"bool", points:1 },
      { id:"prev_pe", label:"Prior PE or DVT",                     type:"bool", points:1 },
      { id:"hormone", label:"Exogenous estrogen use",              type:"bool", points:1 },
    ],
    interpret(score) {
      if (score === 0) return { label:"PERC Negative", color:T.green, action:"PE ruled out — no further workup if low pre-test probability (Wells <2). ~0.3% miss rate" };
      return                  { label:"PERC Positive", color:T.red,   action:"PERC not met — obtain D-dimer and apply Wells criteria. Further workup required" };
    },
  },
  {
    id:"nexus", name:"NEXUS C-Spine", icon:"🦴",
    cc:["Trauma — Head","Weakness/Numbness","Back Pain"],
    desc:"Cervical spine imaging decision rule. All 5 criteria must be ABSENT to clear.",
    cite:"Hoffman et al., 2000",
    criteria:[
      { id:"midline",     label:"Midline cervical tenderness",                       type:"bool", points:1 },
      { id:"focal_neuro", label:"Focal neurological deficit",                        type:"bool", points:1 },
      { id:"altered",     label:"Altered level of alertness",                        type:"bool", points:1 },
      { id:"intox",       label:"Evidence of intoxication",                          type:"bool", points:1 },
      { id:"distract",    label:"Presence of a painful, distracting injury",        type:"bool", points:1 },
    ],
    interpret(score) {
      if (score === 0) return { label:"Low Risk — C-Spine Cleared", color:T.green, action:"No imaging required. 99.6% sensitivity for clinically significant injury" };
      return                  { label:"Imaging Required",            color:T.red,   action:">=1 criterion present — obtain CT C-spine. Consider MRI if neurological deficit" };
    },
  },
  {
    id:"ottawa_ankle", name:"Ottawa Ankle Rule", icon:"🦶",
    cc:["Ankle/Foot Injury"],
    desc:"Indicates need for ankle/foot X-ray after acute ankle injury.",
    cite:"Stiell et al., 1992",
    criteria:[
      { id:"lat_mal",   label:"Bone tenderness at posterior edge or tip of lateral malleolus",  type:"bool", points:1 },
      { id:"med_mal",   label:"Bone tenderness at posterior edge or tip of medial malleolus",   type:"bool", points:1 },
      { id:"wt_bear_a", label:"Unable to bear weight (4 steps) immediately and in ED",         type:"bool", points:1 },
      { id:"5th_met",   label:"Bone tenderness at base of 5th metatarsal (foot zone)",         type:"bool", points:1 },
      { id:"navic",     label:"Bone tenderness at navicular bone (foot zone)",                  type:"bool", points:1 },
    ],
    interpret(score) {
      if (!score) return { label:"No X-ray Indicated", color:T.green, action:"Ottawa negative — X-ray not required. 97-99% sensitive for fracture" };
      return             { label:"X-ray Indicated",    color:T.gold,  action:"One or more criteria met — obtain ankle +/- foot X-ray series" };
    },
  },
  {
    id:"ottawa_knee", name:"Ottawa Knee Rule", icon:"🦵",
    cc:["Knee Injury"],
    desc:"Indicates need for knee X-ray after acute knee injury.",
    cite:"Stiell et al., 1995",
    criteria:[
      { id:"age55",   label:"Age >= 55",                                 type:"bool", points:1 },
      { id:"pat",     label:"Isolated tenderness of the patella",        type:"bool", points:1 },
      { id:"fibula",  label:"Tenderness at head of fibula",              type:"bool", points:1 },
      { id:"flex90",  label:"Inability to flex knee to 90 degrees",      type:"bool", points:1 },
      { id:"wt_bear", label:"Inability to bear weight (4 steps) in ED", type:"bool", points:1 },
    ],
    interpret(score) {
      if (!score) return { label:"No X-ray Indicated", color:T.green, action:"Ottawa Knee negative — X-ray not required. 97% sensitivity for fracture" };
      return             { label:"X-ray Indicated",    color:T.gold,  action:">=1 criterion present — obtain knee X-ray (AP and lateral)" };
    },
  },
  {
    id:"pecarn", name:"PECARN Head CT", icon:"👶",
    cc:["Trauma — Head","Altered Mental Status"],
    desc:"Pediatric head CT decision rule. Apply to children after head trauma.",
    cite:"Kuppermann et al., 2009",
    criteria:[
      { id:"gcs_lt15",    label:"GCS < 15",                                                           type:"bool", points:2 },
      { id:"palpable_fx", label:"Palpable skull fracture",                                            type:"bool", points:2 },
      { id:"ams",         label:"Altered mental status (agitation, somnolence, slow response)",       type:"bool", points:2 },
      { id:"hematoma",    label:"Occipital/parietal/temporal scalp hematoma (if <2yo)",              type:"bool", points:1 },
      { id:"loc_5s",      label:"LOC >= 5 seconds",                                                   type:"bool", points:1 },
      { id:"mech",        label:"Severe mechanism (MVA, fall >1.5m/<2yo or >3ft/>2yo)",              type:"bool", points:1 },
      { id:"acting",      label:"Not acting normally per parent (if <2yo)",                          type:"bool", points:1 },
      { id:"vomiting",    label:"Vomiting (if >=2yo)",                                               type:"bool", points:1 },
      { id:"headache",    label:"Severe headache (if >=2yo)",                                        type:"bool", points:1 },
    ],
    interpret(score) {
      if (score >= 2) return { label:"High Risk — CT Indicated",    color:T.red,   action:"High-risk features present. CT head indicated. Risk of ciTBI >4%" };
      if (score === 1) return { label:"Intermediate — Observe/CT",  color:T.gold,  action:"Intermediate risk. Shared decision: observation vs CT. ciTBI risk ~0.9-1.5%" };
      return                  { label:"Low Risk — CT Not Indicated", color:T.green, action:"Very low risk (<0.02-0.05% ciTBI). CT not routinely indicated. Observe and discharge" };
    },
  },
  {
    id:"canadian_head", name:"Canadian CT Head", icon:"🧠",
    cc:["Trauma — Head","Headache","Altered Mental Status"],
    desc:"Indicates CT for adults with minor head injury (LOC, amnesia, or confusion). GCS 13-15.",
    cite:"Stiell et al., 2001",
    criteria:[
      { id:"gcs_2h",    label:"GCS score < 15 at 2 hours after injury",                                                                type:"bool", points:2 },
      { id:"open_fx",   label:"Suspected open or depressed skull fracture",                                                            type:"bool", points:2 },
      { id:"basal_fx",  label:"Any sign of basal skull fracture (raccoon eyes, hemotympanum, CSF otorrhea/rhinorrhea, Battle's sign)", type:"bool", points:2 },
      { id:"vomiting",  label:"Vomiting >= 2 episodes",                                                                               type:"bool", points:2 },
      { id:"age65",     label:"Age >= 65",                                                                                            type:"bool", points:2 },
      { id:"amnesia30", label:"Amnesia before impact >= 30 minutes",                                                                  type:"bool", points:1 },
      { id:"dangerous", label:"Dangerous mechanism (pedestrian, ejection, fall >3 feet)",                                            type:"bool", points:1 },
    ],
    interpret(score) {
      if (score >= 2) return { label:"High Risk — CT Required",   color:T.red,   action:"High-risk features for neurological intervention or brain injury. CT head indicated" };
      if (score === 1) return { label:"Medium Risk — CT Required", color:T.gold,  action:"Medium-risk features. CT head recommended to detect brain injury (may not need intervention)" };
      return                  { label:"Low Risk — CT Not Required",color:T.green, action:"No high or medium risk criteria. CT not required. 100% sensitive for neurosurgical intervention" };
    },
  },
];

const DDX_SCHEMA = {
  type: "object",
  properties: {
    differentials: {
      type: "array",
      items: {
        type: "object",
        properties: {
          rank:       { type: "number" },
          diagnosis:  { type: "string" },
          tier:       { type: "string" },
          rationale:  { type: "string" },
          keyNext:    { type: "array", items: { type: "string" } },
          rules:      { type: "array", items: { type: "string" } },
        },
      },
    },
    redFlags:       { type: "array", items: { type: "string" } },
    suggestedRules: { type: "array", items: { type: "string" } },
    insight:        { type: "string" },
  },
};

function calcScore(rule, values) {
  return rule.criteria.reduce((sum, c) => {
    if (c.type === "bool")   return sum + (values[c.id] ? c.points : 0);
    if (c.type === "choice") {
      const ch = c.choices[values[c.id] ?? 0];
      return sum + (ch ? ch.p : 0);
    }
    return sum;
  }, 0);
}

function HubBadge({ onBack }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:9 }}>
      <div style={{
        background:"rgba(5,15,30,0.9)", border:"1px solid rgba(42,79,122,0.6)",
        borderRadius:10, padding:"5px 12px", display:"flex", alignItems:"center", gap:8,
      }}>
        <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.gold, letterSpacing:3 }}>NOTRYA</span>
        <span style={{ color:T.txt4, fontFamily:"JetBrains Mono", fontSize:10 }}>/</span>
        <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.txt3, letterSpacing:2 }}>DDX ENGINE</span>
      </div>
      <div style={{ height:1, flex:1, background:"linear-gradient(90deg,rgba(0,229,192,0.5),transparent)" }}/>
      {onBack && (
        <button onClick={onBack} style={{
          fontFamily:"DM Sans", fontSize:11, fontWeight:600, padding:"5px 14px",
          borderRadius:8, cursor:"pointer", border:"1px solid rgba(42,79,122,0.5)",
          background:"rgba(14,37,68,0.6)", color:T.txt3,
        }}>
          Back
        </button>
      )}
    </div>
  );
}

function LocalToast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
      background:"rgba(8,22,40,0.96)", border:"1px solid rgba(0,229,192,0.4)",
      borderRadius:10, padding:"10px 20px",
      fontFamily:"DM Sans", fontWeight:600, fontSize:13, color:T.teal,
      zIndex:99999, pointerEvents:"none",
      animation:`${PREFIX}fade .2s ease both`,
    }}>{msg}</div>
  );
}

function DxCard({ dx, index, onRule }) {
  const [open, setOpen] = useState(index === 0);
  const t = TIER[dx.tier] || TIER.moderate;
  const linked = (dx.rules || []).filter(r => RULES.find(rl => rl.name === r || rl.id === r));

  return (
    <div className={`${PREFIX}-fade`} style={{
      ...glass, overflow:"hidden",
      borderLeft:`3px solid ${t.color}`,
      background: dx.tier === "must_rule_out"
        ? `linear-gradient(135deg,${T.red}0b,rgba(8,22,40,0.82))`
        : "rgba(8,22,40,0.78)",
      animationDelay:`${index * 0.07}s`,
    }}>
      <div onClick={() => setOpen(p => !p)} style={{
        padding:"11px 13px", cursor:"pointer",
        display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10,
      }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:10, flex:1, minWidth:0 }}>
          <div style={{
            fontFamily:"JetBrains Mono", fontWeight:700, fontSize:14,
            color:T.txt4, flexShrink:0, minWidth:18, marginTop:1,
          }}>#{index+1}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:14, color:T.txt, marginBottom:3 }}>
              {dx.diagnosis}
            </div>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap", alignItems:"center" }}>
              <span style={{
                fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
                padding:"2px 7px", borderRadius:20,
                background:`${t.color}18`, border:`1px solid ${t.color}40`, color:t.color,
              }}>{t.icon} {t.label.toUpperCase()}</span>
              {linked.map(r => (
                <button key={r} onClick={e => { e.stopPropagation(); onRule(r); }} style={{
                  fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700,
                  padding:"2px 7px", borderRadius:20, cursor:"pointer",
                  background:`${T.blue}12`, border:`1px solid ${T.blue}30`, color:T.blue,
                }}>
                  📐 {r}
                </button>
              ))}
            </div>
          </div>
        </div>
        <span style={{ color:T.txt4, fontSize:10, flexShrink:0, marginTop:2 }}>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div className={`${PREFIX}-fade`} style={{
          borderTop:"1px solid rgba(42,79,122,0.22)", padding:"10px 13px 12px",
        }}>
          {dx.rationale && (
            <div style={{ marginBottom:9 }}>
              <div style={{
                fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, color:T.txt4,
                letterSpacing:1.5, textTransform:"uppercase", marginBottom:5,
              }}>Rationale</div>
              <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt2, lineHeight:1.65 }}>
                {dx.rationale}
              </div>
            </div>
          )}
          {dx.keyNext?.length > 0 && (
            <div>
              <div style={{
                fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, color:T.teal,
                letterSpacing:1.5, textTransform:"uppercase", marginBottom:5,
              }}>Next Steps</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {dx.keyNext.map((step, i) => (
                  <span key={i} style={{
                    fontFamily:"DM Sans", fontWeight:500, fontSize:11,
                    padding:"3px 9px", borderRadius:20,
                    background:"rgba(0,229,192,0.08)", border:"1px solid rgba(0,229,192,0.18)",
                    color:T.teal,
                  }}>▸ {step}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RuleCalc({ rule }) {
  const [values, setValues] = useState({});
  const score  = useMemo(() => calcScore(rule, values), [rule, values]);
  const result = useMemo(() => rule.interpret(score), [rule, score]);
  const maxPossible = rule.criteria.reduce((s, c) => {
    if (c.type === "bool")   return s + Math.max(0, c.points);
    if (c.type === "choice") return s + Math.max(...c.choices.map(ch => ch.p));
    return s;
  }, 0);

  function setVal(id, val) { setValues(prev => ({ ...prev, [id]: val })); }

  return (
    <div className={`${PREFIX}-fade`} style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{
        ...glass, padding:"12px 14px",
        borderLeft:`3px solid ${T.blue}`, background:`${T.blue}07`,
        display:"flex", justifyContent:"space-between", alignItems:"flex-start",
      }}>
        <div>
          <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:15, color:T.txt, marginBottom:2 }}>
            {rule.icon} {rule.name}
          </div>
          <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt3 }}>{rule.desc}</div>
        </div>
        <div style={{ textAlign:"right", flexShrink:0, marginLeft:12 }}>
          <div style={{
            fontFamily:"JetBrains Mono", fontWeight:700,
            fontSize:"clamp(26px,3vw,36px)", color:result.color, lineHeight:1,
          }}>{score}</div>
          <div style={{ fontFamily:"DM Sans", fontSize:9, color:T.txt4 }}>/ {maxPossible}</div>
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {rule.criteria.map(c => (
          <div key={c.id} style={{
            ...glass, padding:"9px 12px", borderRadius:10,
            background: values[c.id] ? `${T.teal}08` : "rgba(8,22,40,0.6)",
            border:`1px solid ${values[c.id] ? T.teal+"28" : "rgba(42,79,122,0.3)"}`,
          }}>
            {c.type === "bool" ? (
              <div onClick={() => setVal(c.id, !values[c.id])}
                style={{ display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer" }}>
                <div style={{
                  width:18, height:18, borderRadius:5, flexShrink:0, marginTop:1,
                  border:`2px solid ${values[c.id] ? T.teal : "rgba(42,79,122,0.5)"}`,
                  background: values[c.id] ? T.teal : "transparent",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  transition:"all .12s",
                }}>
                  {values[c.id] && (
                    <span style={{ fontSize:10, color:"#050f1e", fontWeight:700 }}>✓</span>
                  )}
                </div>
                <div style={{ flex:1 }}>
                  <span style={{
                    fontFamily:"DM Sans", fontSize:12, color:T.txt,
                    fontWeight: values[c.id] ? 600 : 400,
                  }}>{c.label}</span>
                </div>
                <span style={{
                  fontFamily:"JetBrains Mono", fontSize:10, fontWeight:700,
                  color: c.points < 0 ? T.red : T.teal, flexShrink:0,
                }}>{c.points > 0 ? `+${c.points}` : c.points}</span>
              </div>
            ) : (
              <div>
                <div style={{
                  fontFamily:"DM Sans", fontSize:12, color:T.txt, marginBottom:7, fontWeight:500,
                }}>{c.label}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  {c.choices.map((ch, i) => (
                    <div key={i} onClick={() => setVal(c.id, i)} style={{
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"6px 10px", borderRadius:8, cursor:"pointer",
                      border:`1px solid ${(values[c.id]??0)===i ? T.teal+"45" : "rgba(42,79,122,0.25)"}`,
                      background: (values[c.id]??0)===i ? `${T.teal}12` : "rgba(14,37,68,0.3)",
                      transition:"all .1s",
                    }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{
                          width:12, height:12, borderRadius:"50%", flexShrink:0,
                          border:`2px solid ${(values[c.id]??0)===i ? T.teal : "rgba(42,79,122,0.5)"}`,
                          background: (values[c.id]??0)===i ? T.teal : "transparent",
                          transition:"all .1s",
                        }}/>
                        <span style={{
                          fontFamily:"DM Sans", fontSize:11,
                          color:(values[c.id]??0)===i ? T.txt : T.txt3,
                          fontWeight:(values[c.id]??0)===i ? 600 : 400,
                        }}>{ch.l}</span>
                      </div>
                      <span style={{
                        fontFamily:"JetBrains Mono", fontSize:10, fontWeight:700,
                        color:(values[c.id]??0)===i ? T.teal : T.txt4,
                      }}>+{ch.p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{
        ...glass, padding:"12px 14px",
        borderLeft:`3px solid ${result.color}`, background:`${result.color}0d`,
        display:"flex", alignItems:"center", justifyContent:"space-between", gap:12,
      }}>
        <div style={{ flex:1 }}>
          <div style={{
            fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700,
            color:result.color, letterSpacing:1.5, textTransform:"uppercase", marginBottom:4,
          }}>{result.label}</div>
          <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt2, lineHeight:1.55 }}>
            {result.action}
          </div>
        </div>
        <div style={{
          fontFamily:"JetBrains Mono", fontWeight:700, fontSize:28,
          color:result.color, flexShrink:0, lineHeight:1,
        }}>{score}</div>
      </div>

      <div style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4, textAlign:"right" }}>
        Ref: {rule.cite}
      </div>
    </div>
  );
}

export default function DDxEngine({
  initialCC     = "",
  initialAge    = "",
  initialSex    = "M",
  initialVitals = {},
  onBack,
  onToast,
}) {
  const [cc,      setCc]      = useState(initialCC);
  const [age,     setAge]     = useState(initialAge || "");
  const [sex,     setSex]     = useState(initialSex || "M");
  const [vitals,  setVitals]  = useState({
    hr:   initialVitals.hr   || "",
    sbp:  (initialVitals.bp  || "").split("/")[0] || "",
    dbp:  (initialVitals.bp  || "").split("/")[1] || "",
    rr:   initialVitals.rr   || "",
    spo2: initialVitals.spo2 || "",
    temp: initialVitals.temp || "",
  });
  const [context, setContext] = useState("");

  const [tab,        setTab]        = useState("ddx");
  const [busy,       setBusy]       = useState(false);
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState("");
  const [activeRule, setActiveRule] = useState(null);
  const [localToast, setLocalToast] = useState("");

  const showToast = useCallback((msg, type = "success") => {
    if (onToast) { onToast(msg, type); return; }
    setLocalToast(msg);
    setTimeout(() => setLocalToast(""), 2200);
  }, [onToast]);

  function setVital(k, v) { setVitals(prev => ({ ...prev, [k]: v })); }

  const suggestedRules = useMemo(() => {
    if (!cc) return [];
    return RULES.filter(r =>
      r.cc.some(c => cc.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(cc.toLowerCase()))
    );
  }, [cc]);

  function handleRuleLink(ruleName) {
    const r = RULES.find(rl => rl.name === ruleName || rl.id === ruleName);
    if (r) { setActiveRule(r.id); setTab("rules"); }
  }

  const handleGenerate = useCallback(async () => {
    if (!cc.trim()) return;
    setBusy(true);
    setResult(null);
    setError("");
    try {
      const vStr = Object.entries(vitals)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
        .join(", ");

      const ruleNames = RULES.map(r => r.name).join(", ");
      const ruleIds   = RULES.map(r => r.id).join(", ");

      const prompt = `You are an expert emergency medicine physician. Generate a structured differential diagnosis.

PATIENT:
- Chief Complaint: ${cc}
- Age: ${age || "unknown"}, Sex: ${sex}
- Vitals: ${vStr || "not provided"}
- Clinical context: ${context || "none provided"}

INSTRUCTIONS:
Return structured JSON matching the schema. Include 6-10 differentials.
tier values: "must_rule_out" | "high" | "moderate" | "low"
Always include life-threatening diagnoses in must_rule_out tier even if less likely.
rules field: reference rule names from this list only: ${ruleNames}
suggestedRules field: reference rule IDs from: ${ruleIds}
Be specific and clinically accurate.

TIER DEFINITIONS:
- must_rule_out: Life-threatening — must be excluded even if low probability
- high: Most likely given the clinical picture
- moderate: Reasonable possibility warranting workup
- low: On the differential but less supported by the presentation`;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: DDX_SCHEMA,
      });

      const parsed = typeof res === "object" && res !== null
        ? res
        : JSON.parse(String(res).replace(/```json|```/g, "").trim());

      setResult(parsed);
      if (parsed.suggestedRules?.length) {
        const first = RULES.find(r => parsed.suggestedRules.includes(r.id));
        if (first) setActiveRule(first.id);
      }
      showToast(`${parsed.differentials?.length || 0} differentials generated.`);
    } catch(_) {
      setError("Could not generate DDx. Check your inputs and try again.");
    } finally {
      setBusy(false);
    }
  }, [cc, age, sex, vitals, context, showToast]);

  const rulesByCC = useMemo(() => {
    if (!cc) return RULES;
    const matched = RULES.filter(r =>
      r.cc.some(c => cc.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(cc.toLowerCase()))
    );
    const rest = RULES.filter(r => !matched.includes(r));
    return [...matched, ...rest];
  }, [cc]);

  const activeRuleObj = useMemo(() => RULES.find(r => r.id === activeRule), [activeRule]);

  const TABS = [
    { id:"ddx",   label:"DDx Generator", icon:"🧠" },
    { id:"rules", label:"Decision Rules", icon:"📐" },
  ];

  const inputStyle = {
    background:"rgba(14,37,68,0.8)", border:"1px solid rgba(42,79,122,0.4)",
    borderRadius:8, padding:"7px 11px", fontFamily:"DM Sans", fontSize:12,
    color:T.txt, outline:"none", width:"100%", transition:"border-color .12s",
  };

  return (
    <div style={{
      fontFamily:"DM Sans, sans-serif", background:T.bg,
      color:T.txt, display:"flex", flexDirection:"column", height:"100%",
    }}>
      {localToast && <LocalToast msg={localToast}/>}

      <div style={{ flex:1, overflowY:"auto", padding:"16px 0" }}>

        <div style={{ padding:"0 0 14px" }}>
          <HubBadge onBack={onBack}/>
          <h1 className={`${PREFIX}-shim`} style={{
            fontFamily:"Playfair Display", fontSize:"clamp(20px,3vw,30px)",
            fontWeight:900, letterSpacing:-1, lineHeight:1.1, marginBottom:4,
          }}>DDx Engine</h1>
          <p style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt3 }}>
            AI differential · probability tiers · {RULES.length} embedded decision rules
          </p>
        </div>

        <div style={{ ...glass, padding:"5px", display:"flex", gap:4, marginBottom:14 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex:"1 1 auto", fontFamily:"DM Sans", fontWeight:600, fontSize:12,
              padding:"9px 8px", borderRadius:9, cursor:"pointer", textAlign:"center",
              transition:"all .15s",
              border:`1px solid ${tab===t.id ? T.purple+"50" : "transparent"}`,
              background: tab===t.id ? `linear-gradient(135deg,${T.purple}16,${T.purple}06)` : "transparent",
              color: tab===t.id ? T.purple : T.txt3,
            }}>{t.icon} {t.label}</button>
          ))}
        </div>

        {tab === "ddx" && (
          <div className={`${PREFIX}-fade`}>
            <div style={{
              display:"grid",
              gridTemplateColumns: result ? "1fr 1.6fr" : "1fr",
              gap:14, marginBottom:24, alignItems:"start",
            }}>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ ...glass, padding:"14px" }}>
                  <div style={{
                    fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.purple,
                    letterSpacing:2, textTransform:"uppercase", marginBottom:10,
                  }}>Chief Complaint</div>
                  <input
                    type="text" value={cc} onChange={e => setCc(e.target.value)}
                    placeholder="e.g. Chest pain, Shortness of breath..."
                    style={{ ...inputStyle, border:`1px solid ${cc ? T.purple+"45" : "rgba(42,79,122,0.4)"}`, marginBottom:8 }}
                  />
                  <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                    {CC_QUICK.map(q => (
                      <button key={q} onClick={() => setCc(q)} style={{
                        fontFamily:"DM Sans", fontWeight:500, fontSize:9,
                        padding:"3px 8px", borderRadius:20, cursor:"pointer",
                        border:`1px solid ${cc===q ? T.purple+"55" : T.purple+"1e"}`,
                        background: cc===q ? `${T.purple}14` : `${T.purple}06`,
                        color: cc===q ? T.purple : T.txt4, transition:"all .1s",
                      }}>{q}</button>
                    ))}
                  </div>
                </div>

                <div style={{ ...glass, padding:"14px" }}>
                  <div style={{
                    fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.teal,
                    letterSpacing:2, textTransform:"uppercase", marginBottom:8,
                  }}>Patient & Vitals</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginBottom:8 }}>
                    {[
                      { k:"hr",   ph:"HR",   u:"bpm"  },
                      { k:"sbp",  ph:"SBP",  u:"mmHg" },
                      { k:"rr",   ph:"RR",   u:"/min" },
                      { k:"spo2", ph:"SpO2", u:"%"    },
                      { k:"temp", ph:"Temp", u:"F"    },
                      { k:"dbp",  ph:"DBP",  u:"mmHg" },
                    ].map(({ k, ph, u }) => (
                      <div key={k} style={{ position:"relative" }}>
                        <input type="number" value={vitals[k]}
                          onChange={e => setVital(k, e.target.value)}
                          placeholder={ph}
                          style={{ ...inputStyle, paddingRight:36, fontSize:11 }}
                        />
                        <span style={{
                          position:"absolute", right:9, top:"50%", transform:"translateY(-50%)",
                          fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4,
                        }}>{u}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:7 }}>
                    <div>
                      <div style={{
                        fontFamily:"JetBrains Mono", fontSize:7, color:T.txt4,
                        letterSpacing:1.5, textTransform:"uppercase", marginBottom:3,
                      }}>Age</div>
                      <input type="number" value={age}
                        onChange={e => setAge(e.target.value)}
                        placeholder="Age" style={inputStyle}
                      />
                    </div>
                    <div>
                      <div style={{
                        fontFamily:"JetBrains Mono", fontSize:7, color:T.txt4,
                        letterSpacing:1.5, textTransform:"uppercase", marginBottom:3,
                      }}>Sex</div>
                      <div style={{ display:"flex", gap:4 }}>
                        {["M","F"].map(s => (
                          <button key={s} onClick={() => setSex(s)} style={{
                            flex:1, fontFamily:"JetBrains Mono", fontSize:11, fontWeight:700,
                            padding:"7px", borderRadius:8, cursor:"pointer",
                            border:`1px solid ${sex===s ? T.blue+"55" : "rgba(42,79,122,0.35)"}`,
                            background: sex===s ? `${T.blue}14` : "transparent",
                            color: sex===s ? T.blue : T.txt3,
                          }}>{s}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ ...glass, padding:"14px" }}>
                  <div style={{
                    fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.gold,
                    letterSpacing:2, textTransform:"uppercase", marginBottom:7,
                  }}>Clinical Context</div>
                  <textarea
                    value={context} onChange={e => setContext(e.target.value)} rows={5}
                    placeholder="Symptoms, exam findings, PMH, meds, risk factors, onset/duration, associated symptoms..."
                    style={{ ...inputStyle, resize:"vertical", lineHeight:1.55 }}
                  />
                </div>

                {suggestedRules.length > 0 && (
                  <div style={{ ...glass, padding:"12px 14px", background:`${T.blue}06` }}>
                    <div style={{
                      fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, color:T.blue,
                      letterSpacing:1.5, textTransform:"uppercase", marginBottom:7,
                    }}>Relevant Decision Rules</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                      {suggestedRules.map(r => (
                        <button key={r.id} onClick={() => { setActiveRule(r.id); setTab("rules"); }} style={{
                          fontFamily:"DM Sans", fontWeight:600, fontSize:11,
                          padding:"5px 11px", borderRadius:20, cursor:"pointer",
                          border:`1px solid ${T.blue}35`, background:`${T.blue}0e`, color:T.blue,
                        }}>{r.icon} {r.name}</button>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={handleGenerate} disabled={!cc.trim() || busy} style={{
                  fontFamily:"DM Sans", fontWeight:800, fontSize:14,
                  padding:"14px", borderRadius:10,
                  cursor: cc.trim() && !busy ? "pointer" : "not-allowed",
                  border:`1px solid ${T.purple}50`,
                  background: cc.trim() ? `${T.purple}1c` : "rgba(14,37,68,0.4)",
                  color: cc.trim() ? T.purple : T.txt4,
                  opacity: busy ? 0.7 : 1, transition:"all .12s",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                }}>
                  {busy
                    ? <><span className={`${PREFIX}-spin`} style={{ display:"inline-block", fontSize:16 }}>⚙️</span> Generating Differential...</>
                    : "🧠 Generate Differential"}
                </button>

                {error && (
                  <div style={{
                    ...glass, padding:"10px 14px", borderLeft:`3px solid ${T.red}`,
                    background:`${T.red}0a`, fontFamily:"DM Sans", fontSize:12, color:T.coral,
                  }}>{error}</div>
                )}
              </div>

              {result && (
                <div className={`${PREFIX}-fade`} style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {result.redFlags?.length > 0 && (
                    <div style={{
                      ...glass, padding:"10px 13px",
                      borderLeft:`3px solid ${T.red}`, background:`${T.red}0b`,
                    }}>
                      <div style={{
                        fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, color:T.red,
                        letterSpacing:1.5, textTransform:"uppercase", marginBottom:6,
                      }}>🚨 Immediate Concerns</div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                        {result.redFlags.map((f, i) => (
                          <span key={i} style={{
                            fontFamily:"DM Sans", fontWeight:600, fontSize:11,
                            padding:"3px 9px", borderRadius:20,
                            background:`${T.red}14`, border:`1px solid ${T.red}30`, color:T.coral,
                          }}>{f}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.insight && (
                    <div style={{
                      ...glass, padding:"9px 13px",
                      borderLeft:`3px solid ${T.gold}`, background:`${T.gold}07`,
                      fontFamily:"DM Sans", fontSize:12, color:T.txt2, fontStyle:"italic",
                    }}>
                      💡 {result.insight}
                    </div>
                  )}

                  {["must_rule_out","high","moderate","low"].map(tier => {
                    const items = result.differentials?.filter(d => d.tier === tier) || [];
                    if (!items.length) return null;
                    const tc = TIER[tier];
                    return (
                      <div key={tier}>
                        <div style={{
                          fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
                          color:tc.color, letterSpacing:2, textTransform:"uppercase",
                          marginBottom:6, paddingLeft:4,
                        }}>{tc.icon} {tc.label} ({items.length})</div>
                        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                          {items.map((dx, i) => (
                            <DxCard key={dx.rank || i} dx={dx} index={i} onRule={handleRuleLink}/>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {result.suggestedRules?.length > 0 && (
                    <div style={{ ...glass, padding:"11px 13px", background:`${T.blue}07` }}>
                      <div style={{
                        fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, color:T.blue,
                        letterSpacing:1.5, textTransform:"uppercase", marginBottom:7,
                      }}>📐 AI-Suggested Decision Rules</div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                        {result.suggestedRules.map(rid => {
                          const r = RULES.find(rl => rl.id === rid);
                          return r ? (
                            <button key={rid} onClick={() => { setActiveRule(rid); setTab("rules"); }} style={{
                              fontFamily:"DM Sans", fontWeight:600, fontSize:11,
                              padding:"5px 12px", borderRadius:20, cursor:"pointer",
                              border:`1px solid ${T.blue}40`, background:`${T.blue}10`, color:T.blue,
                            }}>{r.icon} {r.name} →</button>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "rules" && (
          <div className={`${PREFIX}-fade`} style={{
            display:"grid", gridTemplateColumns:"220px 1fr",
            gap:14, marginBottom:24, alignItems:"start",
          }}>
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              {rulesByCC.map(r => {
                const isSuggested = suggestedRules.some(sr => sr.id === r.id);
                return (
                  <button key={r.id} onClick={() => setActiveRule(r.id)} style={{
                    fontFamily:"DM Sans", fontWeight:600, fontSize:12,
                    padding:"9px 12px", borderRadius:10, cursor:"pointer", textAlign:"left",
                    border:`1px solid ${activeRule===r.id ? T.blue+"55" : isSuggested ? T.blue+"25" : "rgba(42,79,122,0.3)"}`,
                    background: activeRule===r.id ? `${T.blue}14` : isSuggested ? `${T.blue}07` : "rgba(8,22,40,0.5)",
                    color: activeRule===r.id ? T.blue : isSuggested ? T.txt2 : T.txt3,
                    display:"flex", alignItems:"center", gap:8, transition:"all .12s",
                  }}>
                    <span style={{ fontSize:14, flexShrink:0 }}>{r.icon}</span>
                    <span style={{ flex:1, lineHeight:1.3 }}>{r.name}</span>
                    {isSuggested && (
                      <span style={{
                        fontFamily:"JetBrains Mono", fontSize:6, color:T.blue,
                        background:`${T.blue}15`, padding:"1px 5px", borderRadius:10,
                      }}>CC</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div>
              {activeRuleObj
                ? <RuleCalc key={activeRuleObj.id} rule={activeRuleObj}/>
                : (
                  <div style={{
                    ...glass, padding:"40px", textAlign:"center",
                    display:"flex", flexDirection:"column", alignItems:"center", gap:10,
                  }}>
                    <span style={{ fontSize:32 }}>📐</span>
                    <span style={{ fontFamily:"DM Sans", fontSize:14, color:T.txt2, fontWeight:600 }}>
                      Select a decision rule
                    </span>
                    <span style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt4 }}>
                      Rules relevant to your CC are highlighted
                    </span>
                  </div>
                )}
            </div>
          </div>
        )}

        <div style={{ textAlign:"center", paddingBottom:16 }}>
          <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA DDX ENGINE · AI-ASSISTED — CLINICAL JUDGMENT REQUIRED
          </span>
        </div>
      </div>
    </div>
  );
}