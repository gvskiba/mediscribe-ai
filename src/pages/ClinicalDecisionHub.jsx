// ClinicalDecisionHub.jsx — v3
// Bedside Clinical Decision Rules with AI Interpretation
//
// Rules: Canadian CT Head (Stiell 2001) · PECARN <2yr / 2-18yr (Kuppermann 2009)
//        New Orleans (Haydel 2000) · ABCD2 TIA Score (Johnston 2007)
//        PERC + Modified Wells PE (Kline 2008 / Wells 2000)
//        HEART Score (Backus 2010) · CURB-65 PNA (Lim 2003)
//        San Francisco Syncope Rule (Quinn 2004)
//        Ottawa Ankle & Foot (Stiell 1992)
//        Canadian C-Spine Rule + NEXUS (Stiell 2001 / Hoffman 2000)
//
// Route: /ClinicalDecisionHub
// Constraints: no form, no localStorage, straight quotes only,
//   single react import, border before borderLeft/etc, < 1600 lines

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
const InvokeLLM = (params) => base44.integrations.Core.InvokeLLM(params);
const ClinicalNote = base44.entities.ClinicalNote;

(() => {
  if (document.getElementById("cdh3-fonts")) return;
  const l = document.createElement("link");
  l.id = "cdh3-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "cdh3-css";
  s.textContent = `
    @keyframes cdh-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
    .cdh-in{animation:cdh-in .18s ease forwards}
    @keyframes shimmer-cdh{0%{background-position:-200% center}100%{background-position:200% center}}
    .shimmer-cdh{background:linear-gradient(90deg,#f0f4ff 0%,#9b6dff 40%,#00d4b4 65%,#f0f4ff 100%);
      background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;animation:shimmer-cdh 4s linear infinite;}
    @keyframes ai-pulse{0%,100%{opacity:.6}50%{opacity:1}}
    .ai-pulse{animation:ai-pulse 1.4s ease infinite;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#080510", panel:"#0e0a1a",
  txt:"#f0ecff", txt2:"#c4b8e8", txt3:"#8a7ab4", txt4:"#7a6cb0",
  teal:"#00d4b4", gold:"#f5c842", coral:"#ff5c5c", blue:"#6b9fff",
  orange:"#ff9f43", purple:"#b06dff", green:"#3dffa0", red:"#ff3d3d",
  lavender:"#c4aaff",
};

const CATEGORIES = [
  { id:"neuro",   label:"Neurological",       icon:"🧠", color:T.purple,
    rules:[
      { id:"canadian_ct",  name:"Canadian CT Head",    icon:"🍁" },
      { id:"pecarn_lt2",   name:"PECARN < 2 yrs",      icon:"👶" },
      { id:"pecarn_gte2",  name:"PECARN 2-18 yrs",     icon:"🧒" },
      { id:"new_orleans",  name:"New Orleans",          icon:"🎺" },
      { id:"abcd2",        name:"ABCD2 (TIA)",          icon:"🧬" },
    ] },
  { id:"cardiac", label:"Cardiac / Pulmonary", icon:"❤️", color:T.coral,
    rules:[
      { id:"perc_wells",  name:"PERC + Wells (PE)",    icon:"🫁" },
      { id:"heart_score", name:"HEART Score (ACS)",    icon:"💓" },
      { id:"curb65",      name:"CURB-65 (PNA)",        icon:"🫧" },
      { id:"sf_syncope",  name:"SF Syncope Rule",       icon:"⚡" },
    ] },
  { id:"trauma",  label:"Trauma / Ortho",      icon:"🦴", color:T.orange,
    rules:[
      { id:"ottawa",      name:"Ottawa Ankle & Foot",   icon:"🦶" },
      { id:"cspine",      name:"C-Spine CCR + NEXUS",   icon:"🦴" },
    ] },
];

// ── Shared Primitives ──────────────────────────────────────────────────
function CriterionCheck({ label, sub, state, onToggle, color }) {
  const isPos = state === true, isNeg = state === false;
  return (
    <div style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:5,
      padding:"7px 10px", borderRadius:8, transition:"all .1s",
      background:isPos ? `${color}12` : isNeg ? "rgba(14,10,26,0.5)" : "rgba(14,10,26,0.3)",
      border:`1px solid ${isPos ? color+"44" : isNeg ? "rgba(45,30,80,0.3)" : "rgba(45,30,80,0.2)"}`,
      borderLeft:`3px solid ${isPos ? color : isNeg ? "rgba(45,30,80,0.4)" : "rgba(45,30,80,0.2)"}` }}>
      <div style={{ display:"flex", gap:4, flexShrink:0, marginTop:2 }}>
        <button onClick={() => onToggle(true)}
          style={{ width:20, height:20, borderRadius:4, cursor:"pointer",
            border:`2px solid ${isPos ? color : "rgba(74,61,122,0.5)"}`,
            background:isPos ? color : "transparent",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
          {isPos && <span style={{ color:"#080510", fontSize:9, fontWeight:900 }}>✓</span>}
        </button>
        <button onClick={() => onToggle(false)}
          style={{ width:20, height:20, borderRadius:4, cursor:"pointer",
            border:`2px solid ${isNeg ? T.txt3 : "rgba(74,61,122,0.3)"}`,
            background:isNeg ? "rgba(74,61,122,0.25)" : "transparent",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
          {isNeg && <span style={{ color:T.txt3, fontSize:10, fontWeight:700 }}>✕</span>}
        </button>
      </div>
      <div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12,
          color:isPos ? color : T.txt2, lineHeight:1.4 }}>{label}</div>
        {sub && <div style={{ fontFamily:"'DM Sans',sans-serif",
          fontSize:11.5, color:T.txt4, marginTop:1, lineHeight:1.35 }}>{sub}</div>}
      </div>
    </div>
  );
}

function ScoreSelect({ crit, value, onChange }) {
  return (
    <div style={{ marginBottom:7, padding:"9px 11px", borderRadius:9,
      background:"rgba(14,10,26,0.5)",
      border:`1px solid ${value !== undefined ? T.coral+"33" : "rgba(45,30,80,0.3)"}`,
      borderLeft:`3px solid ${value !== undefined ? T.coral : "rgba(45,30,80,0.25)"}` }}>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12,
        color:value !== undefined ? T.coral : T.txt2, marginBottom:6 }}>
        {crit.label}
        {value !== undefined && <span style={{ marginLeft:8,
          fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.gold }}>
          {value} pt
        </span>}
      </div>
      <div style={{ display:"flex", gap:5 }}>
        {crit.options.map(opt => (
          <button key={opt.val} onClick={() => onChange(crit.key, opt.val)}
            style={{ flex:1, padding:"6px 4px", borderRadius:7, cursor:"pointer",
              textAlign:"center", transition:"all .1s",
              border:`1px solid ${value===opt.val ? T.coral+"55" : "rgba(45,30,80,0.4)"}`,
              background:value===opt.val ? `${T.coral}14` : "transparent" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13,
              fontWeight:700, color:value===opt.val ? T.coral : T.txt3, marginBottom:2 }}>
              {opt.val}
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, lineHeight:1.3,
              color:value===opt.val ? T.txt2 : T.txt4 }}>{opt.label}</div>
            {opt.sub && value===opt.val && (
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:8,
                color:T.txt4, marginTop:2, lineHeight:1.3 }}>{opt.sub}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultBanner({ result }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    try {
      navigator.clipboard?.writeText(`${result.label} — ${result.sub}`);
      setCopied(true); setTimeout(() => setCopied(false), 1600);
    } catch {}
  };
  if (!result) return (
    <div style={{ padding:"11px 14px", borderRadius:10, marginBottom:12,
      background:"rgba(14,10,26,0.6)", border:"1px solid rgba(45,30,80,0.3)" }}>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
        color:T.txt4, textAlign:"center" }}>
        Evaluate criteria above to generate recommendation
      </div>
    </div>
  );
  return (
    <div style={{ padding:"13px 15px", borderRadius:10, marginBottom:12,
      background:`${result.color}0d`, border:`2px solid ${result.color}55` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
        <div style={{ fontFamily:"'Playfair Display',serif",
          fontWeight:900, fontSize:19, color:result.color, lineHeight:1.2 }}>
          {result.label}
        </div>
        <button onClick={copy} title="Copy result"
          style={{ flexShrink:0, marginTop:2, padding:"3px 8px", borderRadius:6,
            cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            border:`1px solid ${result.color}44`,
            background:copied ? `${result.color}18` : "transparent",
            color:copied ? result.color : T.txt4 }}>
          {copied ? "✓" : "⎘"}
        </button>
      </div>
      <div style={{ fontFamily:"'DM Sans',sans-serif",
        fontSize:12, color:T.txt2, lineHeight:1.65, marginTop:4 }}>{result.sub}</div>
    </div>
  );
}

function AIBlock({ ruleName, ruleCtx, posCrit, negCrit, recommendation, context, color }) {
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState(null);
  const canRun = posCrit.length > 0 || negCrit.length > 0;
  const c = color || T.purple;
  const run = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await InvokeLLM({
        prompt:`You are an emergency medicine clinical decision support AI assisting a physician at bedside.

Rule: ${ruleName}
Context: ${ruleCtx}
Positive / present: ${posCrit.join(" | ") || "None"}
Negative / absent: ${negCrit.join(" | ") || "None"}
Rule recommendation: ${recommendation || "Incomplete"}
Physician context: ${context.trim() || "None"}

Be concise. Do NOT restate criteria. Focus on:
1. Rule applicability (exclusion violations, population mismatches)
2. Clinical nuances the checklist cannot capture
3. Gestalt override situations
4. Disposition and observation considerations
5. Additional workup beyond what the rule addresses`,
        response_json_schema:{
          type:"object",
          properties:{
            applicability_note:{ type:"string", description:"Applicability concern. Empty string if fully applicable." },
            clinical_reasoning:{ type:"string", description:"2-3 sentence interpretation beyond checklist." },
            caveats:{ type:"array", items:{ type:"string" }, description:"Up to 3 caveats. Empty array if none." },
            disposition:{ type:"string", description:"Practical disposition in 1-2 sentences." },
            additional_workup:{ type:"array", items:{ type:"string" }, description:"Additional workup. Empty array if none." },
          },
          required:["clinical_reasoning","caveats","disposition","additional_workup"],
        },
      });
      setResult(res);
    } catch { setError("AI analysis unavailable."); }
    setLoading(false);
  };
  return (
    <div style={{ marginTop:10 }}>
      <button onClick={run} disabled={loading || !canRun}
        style={{ display:"flex", alignItems:"center", justifyContent:"center",
          gap:7, width:"100%", padding:"10px 0", borderRadius:9,
          cursor:canRun ? "pointer" : "not-allowed",
          fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:12, transition:"all .14s",
          border:`1px solid ${canRun ? c+"55" : "rgba(45,30,80,0.3)"}`,
          background:canRun ? `${c}10` : "rgba(14,10,26,0.4)",
          color:canRun ? c : T.txt4 }}>
        {loading ? <><span className="ai-pulse">✦</span> Analyzing...</>
                 : <><span>✦</span> AI Clinical Interpretation</>}
      </button>
      {!canRun && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
        color:T.txt4, textAlign:"center", marginTop:4 }}>
        Evaluate at least one criterion first
      </div>}
      {error && <div style={{ marginTop:7, padding:"8px 10px", borderRadius:8,
        background:"rgba(255,92,92,0.07)", border:"1px solid rgba(255,92,92,0.2)",
        fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.coral }}>{error}</div>}
      {result && (
        <div className="cdh-in" style={{ marginTop:9, padding:"12px 14px",
          borderRadius:11, background:`${c}08`, border:`1px solid ${c}2a` }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:c, letterSpacing:1.5, textTransform:"uppercase", marginBottom:9 }}>
            ✦ AI Clinical Interpretation
          </div>
          {result.applicability_note && (
            <div style={{ marginBottom:8, padding:"6px 9px", borderRadius:6,
              background:`${T.coral}09`, border:`1px solid ${T.coral}22` }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                color:T.coral, letterSpacing:1.2, textTransform:"uppercase", marginBottom:2 }}>
                Applicability
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:T.txt2, lineHeight:1.6 }}>{result.applicability_note}</div>
            </div>
          )}
          <div style={{ marginBottom:8 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              color:c, letterSpacing:1.2, textTransform:"uppercase", marginBottom:3 }}>Reasoning</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:T.txt2, lineHeight:1.7 }}>{result.clinical_reasoning}</div>
          </div>
          {result.caveats?.length > 0 && (
            <div style={{ marginBottom:8 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                color:T.gold, letterSpacing:1.2, textTransform:"uppercase", marginBottom:4 }}>Caveats</div>
              {result.caveats.map((cv,i) => (
                <div key={i} style={{ display:"flex", gap:6, marginBottom:3 }}>
                  <span style={{ color:T.gold, fontSize:7, marginTop:4, flexShrink:0 }}>▸</span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif",
                    fontSize:11, color:T.txt2, lineHeight:1.6 }}>{cv}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginBottom:result.additional_workup?.length > 0 ? 8 : 0 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              color:T.teal, letterSpacing:1.2, textTransform:"uppercase", marginBottom:3 }}>Disposition</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5,
              color:T.txt2, lineHeight:1.65 }}>{result.disposition}</div>
          </div>
          {result.additional_workup?.length > 0 && (
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                color:T.blue, letterSpacing:1.2, textTransform:"uppercase", marginBottom:4 }}>
                Additional Workup
              </div>
              {result.additional_workup.map((w,i) => (
                <div key={i} style={{ display:"flex", gap:6, marginBottom:3 }}>
                  <span style={{ color:T.blue, fontSize:7, marginTop:4, flexShrink:0 }}>▸</span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif",
                    fontSize:11, color:T.txt2, lineHeight:1.6 }}>{w}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop:8, fontFamily:"'JetBrains Mono',monospace",
            fontSize:9, color:T.txt4, letterSpacing:1.1, textAlign:"right" }}>
            AI-ASSISTED · NOT A SUBSTITUTE FOR CLINICAL JUDGMENT
          </div>
        </div>
      )}
    </div>
  );
}

function ContextBox({ value, onChange, placeholder, color }) {
  return (
    <>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
        color:T.txt4, letterSpacing:1.2, textTransform:"uppercase",
        marginBottom:5, marginTop:10 }}>
        Clinical Context (optional — enhances AI)
      </div>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={2}
        placeholder={placeholder}
        style={{ width:"100%", padding:"8px 10px", borderRadius:8, outline:"none",
          resize:"vertical", fontFamily:"'DM Sans',sans-serif", fontSize:11.5,
          color:T.txt2, lineHeight:1.6, boxSizing:"border-box",
          background:"rgba(14,10,26,0.8)",
          border:`1px solid ${value ? (color||T.purple)+"33" : "rgba(45,30,80,0.35)"}` }} />
    </>
  );
}

// ── Binary Rules Data ──────────────────────────────────────────────────
const BINARY_RULES = {
  canadian_ct:{
    name:"Canadian CT Head Rule", color:T.purple, citation:"Stiell et al, Lancet 2001",
    applies:"GCS 13-15, blunt head trauma within 24h, LOC / amnesia / disorientation, age >= 16",
    excludes:"Anticoagulation · bleeding disorder · obvious open skull fracture · GCS < 13 · post-injury seizure",
    sensitivity:"High-risk factors 100% sensitive for neurosurgery. Medium-risk 98.4% for CT abnormality.",
    groups:[
      { label:"High Risk — CT for Neurosurgical Intervention", color:T.coral, criteria:[
        { key:"gcs_lt15",  label:"GCS < 15 at 2 hours after injury" },
        { key:"skull_fx",  label:"Suspected open or depressed skull fracture" },
        { key:"basal",     label:"Any sign of basal skull fracture", sub:"Hemotympanum, raccoon eyes, Battle's sign, CSF oto/rhinorrhea" },
        { key:"vomiting",  label:"Vomiting >= 2 episodes" },
        { key:"age_65",    label:"Age >= 65 years" },
      ]},
      { label:"Medium Risk — CT for Brain Injury Detection", color:T.gold, criteria:[
        { key:"amnesia",   label:"Amnesia before impact >= 30 minutes" },
        { key:"mech",      label:"Dangerous mechanism", sub:"MVA, pedestrian/cyclist struck, ejection, fall > 3 ft or 5 stairs" },
      ]},
    ],
    evaluate(c) {
      const hi  = ["gcs_lt15","skull_fx","basal","vomiting","age_65"].some(k => c[k]);
      const med = ["amnesia","mech"].some(k => c[k]);
      const all = ["gcs_lt15","skull_fx","basal","vomiting","age_65","amnesia","mech"].every(k => k in c);
      if (hi)  return { label:"CT Indicated", color:T.coral,  sub:"High-risk criterion present — CT head for neurosurgical intervention." };
      if (med) return { label:"CT Indicated", color:T.orange, sub:"Medium-risk criterion present — CT head for brain injury detection." };
      if (all) return { label:"CT Not Indicated", color:T.teal, sub:"All Canadian CT Head Rule criteria negative — CT not required per rule." };
      return null;
    },
  },
  pecarn_lt2:{
    name:"PECARN — Age < 2 Years", color:T.blue, citation:"Kuppermann et al, Lancet 2009",
    applies:"Children < 2 years, head trauma within 24h, GCS >= 14",
    excludes:"Trivial mechanism (fall < 3 ft, no signs/symptoms) · GCS < 14 · Penetrating trauma",
    sensitivity:"High+intermediate combined: 100% for ciTBI. Low-risk: ciTBI rate < 0.02%.",
    groups:[
      { label:"High Risk — CT Recommended", color:T.coral, criteria:[
        { key:"ams",        label:"Altered mental status", sub:"Agitation, somnolence, repetitive questioning, slow response" },
        { key:"palpable_fx",label:"Palpable skull fracture" },
      ]},
      { label:"Intermediate Risk — Observation vs CT (Physician Judgment)", color:T.gold, criteria:[
        { key:"loc_5",      label:"Loss of consciousness >= 5 seconds" },
        { key:"not_normal", label:"Not acting normally per parent" },
        { key:"sev_mech",   label:"Severe mechanism", sub:"MVA ejection/rollover/death; pedestrian struck; fall > 3 ft; high-impact head strike" },
        { key:"scalp",      label:"Non-frontal scalp hematoma" },
      ]},
    ],
    evaluate(c) {
      const hi  = ["ams","palpable_fx"].some(k => c[k]);
      const mid = ["loc_5","not_normal","sev_mech","scalp"].some(k => c[k]);
      const all = ["ams","palpable_fx","loc_5","not_normal","sev_mech","scalp"].every(k => k in c);
      if (hi)  return { label:"CT Recommended", color:T.coral, sub:"High-risk criterion present — ciTBI risk warrants CT." };
      if (mid) return { label:"Observation vs CT — Physician Judgment", color:T.gold, sub:"Intermediate finding. Observe 4-6h; CT if clinical deterioration or multiple criteria present." };
      if (all) return { label:"CT Not Recommended", color:T.teal, sub:"Low-risk PECARN — ciTBI < 0.02%. Discharge with written return precautions." };
      return null;
    },
  },
  pecarn_gte2:{
    name:"PECARN — Age 2-18 Years", color:T.teal, citation:"Kuppermann et al, Lancet 2009",
    applies:"Children 2-18 years, head trauma within 24h, GCS >= 14",
    excludes:"Trivial mechanism with no signs/symptoms · GCS < 14 · Penetrating trauma",
    sensitivity:"High+intermediate combined: 100% for ciTBI. Low-risk: ciTBI < 0.05%.",
    groups:[
      { label:"High Risk — CT Recommended", color:T.coral, criteria:[
        { key:"ams2",     label:"Altered mental status", sub:"Agitation, somnolence, repetitive questioning, slow response" },
        { key:"basilar",  label:"Signs of basilar skull fracture", sub:"Hemotympanum, raccoon eyes, Battle's sign, CSF oto/rhinorrhea" },
      ]},
      { label:"Intermediate Risk — Observation vs CT", color:T.gold, criteria:[
        { key:"loc2",       label:"Loss of consciousness" },
        { key:"vomiting2",  label:"History of vomiting" },
        { key:"sev_mech2",  label:"Severe mechanism", sub:"MVA ejection/rollover/death; pedestrian struck; fall > 5 ft; high-impact head strike" },
        { key:"severe_ha",  label:"Severe headache" },
      ]},
    ],
    evaluate(c) {
      const hi  = ["ams2","basilar"].some(k => c[k]);
      const mid = ["loc2","vomiting2","sev_mech2","severe_ha"].some(k => c[k]);
      const all = ["ams2","basilar","loc2","vomiting2","sev_mech2","severe_ha"].every(k => k in c);
      if (hi)  return { label:"CT Recommended", color:T.coral, sub:"High-risk criterion present — CT recommended." };
      if (mid) return { label:"Observation vs CT — Physician Judgment", color:T.gold, sub:"Intermediate finding. Single criterion + low concern: observation reasonable. Multiple: CT favored." };
      if (all) return { label:"CT Not Recommended", color:T.teal, sub:"Low-risk PECARN — ciTBI < 0.05%. Discharge with written return precautions." };
      return null;
    },
  },
  new_orleans:{
    name:"New Orleans Criteria", color:T.orange, citation:"Haydel et al, NEJM 2000",
    applies:"GCS 15 after minor head injury with brief LOC, age >= 16",
    excludes:"Anticoagulation · prior neurologic disease · focal neurologic deficit · GCS < 15",
    sensitivity:"100% sensitive for traumatic intracranial injury in GCS 15 with LOC. Specificity 25%.",
    groups:[
      { label:"CT Indicated if ANY Present", color:T.orange, criteria:[
        { key:"ha",      label:"Headache" },
        { key:"vomit",   label:"Vomiting" },
        { key:"age60",   label:"Age > 60 years" },
        { key:"intox",   label:"Drug or alcohol intoxication" },
        { key:"amnesia", label:"Deficits in short-term memory" },
        { key:"trauma",  label:"Physical evidence of trauma above clavicle", sub:"Scalp laceration, facial injury, tenderness" },
        { key:"seizure", label:"Seizure" },
      ]},
    ],
    evaluate(c) {
      const keys = ["ha","vomit","age60","intox","amnesia","trauma","seizure"];
      const any  = keys.some(k => c[k]);
      const all  = keys.every(k => k in c);
      if (any) return { label:"CT Indicated", color:T.coral, sub:"One or more New Orleans criteria present — CT head recommended." };
      if (all) return { label:"CT Not Indicated", color:T.teal, sub:"All New Orleans criteria absent — CT not required. 100% sensitive for intracranial injury in GCS 15 with LOC." };
      return null;
    },
  },
  curb65:{
    name:"CURB-65", color:T.blue, citation:"Lim et al, Thorax 2003",
    applies:"Adults with community-acquired pneumonia (CAP). Each criterion 1 point; score 0-5.",
    excludes:"Hospitalized patients · Non-CAP pneumonia — validated in community-onset CAP only",
    sensitivity:"Score >= 3: 86% sensitive for 30-day mortality. Score predicts disposition, not diagnosis.",
    groups:[
      { label:"Score 1 Point Each — Check All Present", color:T.blue, criteria:[
        { key:"conf",  label:"Confusion (new onset)", sub:"Abbreviated mental test <= 8 or new disorientation to person, place, or time" },
        { key:"bun",   label:"BUN > 19 mg/dL", sub:"Urea > 7 mmol/L" },
        { key:"rr",    label:"Respiratory rate >= 30 breaths/min" },
        { key:"bp",    label:"SBP < 90 mmHg OR DBP <= 60 mmHg" },
        { key:"age65", label:"Age >= 65 years" },
      ]},
    ],
    evaluate(c) {
      const keys = ["conf","bun","rr","bp","age65"];
      const score = keys.filter(k => c[k]===true).length;
      const evalCt = keys.filter(k => k in c).length;
      if (evalCt === 0) return null;
      const sfx = evalCt < 5 ? ` (${evalCt}/5 evaluated)` : "";
      if (score <= 1) return { label:`CURB-65: ${score} — Low Risk${sfx}`, color:T.teal,
        sub:`30-day mortality ~${score===0 ? "1.5" : "5.1"}%. Outpatient treatment appropriate. Consider comorbidities and social support.` };
      if (score === 2) return { label:`CURB-65: 2 — Moderate Risk${sfx}`, color:T.gold,
        sub:"30-day mortality ~9.2%. Short inpatient admission recommended. Consider clinical context and trajectory." };
      return { label:`CURB-65: ${score} — Severe${sfx}`, color:T.coral,
        sub:`30-day mortality ~${score===3 ? "14.5" : score===4 ? "40" : ">57"}%. Inpatient admission required. CURB-65 >= 3: assess ICU or stepdown need.` };
    },
  },
  sf_syncope:{
    name:"San Francisco Syncope Rule", color:T.lavender, citation:"Quinn et al, Ann Emerg Med 2004",
    applies:"Adults presenting after syncope as chief complaint. Predicts serious outcome at 7 days.",
    excludes:"Age < 18 · Seizure as primary cause · ETOH intoxication · Trauma-induced syncope",
    sensitivity:"98% sensitive for serious outcome at 7 days (MI, arrhythmia, PE, stroke, SAH, hemorrhage). Specificity 56%.",
    groups:[
      { label:"High Risk — Any Positive = Serious Outcome at 7 Days", color:T.lavender, criteria:[
        { key:"ecg",  label:"Abnormal ECG", sub:"New changes vs prior, non-sinus rhythm, or new conduction abnormality" },
        { key:"dysp", label:"Shortness of breath on presentation or found on exam" },
        { key:"hct",  label:"Hematocrit < 30%" },
        { key:"sbp",  label:"SBP < 90 mmHg on any triage or ED reading" },
        { key:"chf",  label:"History of congestive heart failure" },
      ]},
    ],
    evaluate(c) {
      const keys = ["ecg","dysp","hct","sbp","chf"];
      const any = keys.some(k => c[k]===true);
      const all = keys.every(k => k in c);
      if (any) return { label:"High Risk — Admit or Extended Observation", color:T.coral,
        sub:"One or more SF Syncope criteria positive. Serious outcome risk at 7 days — admission or extended ED observation warranted." };
      if (all) return { label:"Low Risk — Discharge Candidate", color:T.teal,
        sub:"All 5 SF Syncope criteria absent (sensitivity 98%). Low serious outcome risk. Discharge with close outpatient follow-up if clinical picture consistent." };
      return null;
    },
  },
};

function BinaryPanel({ ruleId }) {
  const rule = BINARY_RULES[ruleId];
  const [checked, setChecked] = useState({});
  const [ctx,     setCtx]     = useState("");
  const toggle = (key, val) => setChecked(p => { const n={...p}; p[key]===val ? delete n[key] : n[key]=val; return n; });
  const result    = rule.evaluate(checked);
  const allCrit   = rule.groups.flatMap(g => g.criteria);
  const countEval = allCrit.filter(c => c.key in checked).length;
  const posLabels = allCrit.filter(c => checked[c.key]===true).map(c => c.label);
  const negLabels = allCrit.filter(c => checked[c.key]===false).map(c => c.label);

  return (
    <div className="cdh-in">
      <div style={{ padding:"9px 12px", borderRadius:9, marginBottom:11,
        background:`${rule.color}08`, border:`1px solid ${rule.color}28`,
        borderLeft:`3px solid ${rule.color}` }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:7 }}>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              color:rule.color, letterSpacing:1.2, textTransform:"uppercase", marginBottom:2 }}>Applies To</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10.5,
              color:T.txt3, lineHeight:1.5 }}>{rule.applies}</div>
          </div>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              color:T.coral, letterSpacing:1.2, textTransform:"uppercase", marginBottom:2 }}>Exclusions</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10.5,
              color:T.txt3, lineHeight:1.5 }}>{rule.excludes}</div>
          </div>
        </div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5, color:T.txt4 }}>
          <span style={{ color:rule.color }}>◉ </span>{rule.sensitivity}
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <div style={{ flex:1, height:3, borderRadius:3, background:"rgba(45,30,80,0.3)" }}>
          <div style={{ height:"100%", borderRadius:3, transition:"width .2s",
            width:`${allCrit.length ? (countEval/allCrit.length)*100 : 0}%`,
            background:posLabels.length > 0 ? T.coral : T.teal }} />
        </div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, flexShrink:0 }}>
          {countEval}/{allCrit.length}
          {posLabels.length > 0 && <span style={{ color:T.coral }}> · {posLabels.length} pos</span>}
        </div>
      </div>
      <ResultBanner result={result} />
      {rule.groups.map((g, gi) => (
        <div key={gi} style={{ marginBottom:10 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:g.color, letterSpacing:1.4, textTransform:"uppercase", marginBottom:6,
            display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:5, height:5, borderRadius:"50%", background:g.color }} />
            {g.label}
          </div>
          {g.criteria.map(c => (
            <CriterionCheck key={c.key} label={c.label} sub={c.sub}
              state={c.key in checked ? checked[c.key] : undefined}
              onToggle={val => toggle(c.key, val)} color={g.color} />
          ))}
        </div>
      ))}
      {countEval > 0 && (
        <button onClick={() => setChecked({})}
          style={{ marginBottom:8, padding:"5px 13px", borderRadius:7, cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
            border:"1px solid rgba(45,30,80,0.4)", background:"transparent", color:T.txt4 }}>
          ↺ Clear all
        </button>
      )}
      <ContextBox value={ctx} onChange={setCtx} color={rule.color}
        placeholder="e.g. On warfarin INR 2.8, GCS briefly 13 at scene per EMS..." />
      <AIBlock ruleName={rule.name}
        ruleCtx={`${rule.applies}. Excludes: ${rule.excludes}. ${rule.sensitivity}`}
        posCrit={posLabels} negCrit={negLabels}
        recommendation={result ? `${result.label}: ${result.sub}` : "Incomplete"}
        context={ctx} color={rule.color} />
      <div style={{ marginTop:10, fontFamily:"'JetBrains Mono',monospace",
        fontSize:9, color:T.txt4, letterSpacing:1.2 }}>{rule.citation}</div>
    </div>
  );
}

// ── PERC + Wells Panel ─────────────────────────────────────────────────
const PERC_ITEMS = [
  { key:"age50",    label:"Age >= 50 years" },
  { key:"hr100",    label:"Heart rate >= 100 bpm" },
  { key:"sat95",    label:"O2 saturation < 95% on room air" },
  { key:"leg",      label:"Unilateral leg swelling" },
  { key:"hemo",     label:"Hemoptysis" },
  { key:"surg",     label:"Surgery or trauma within 4 weeks" },
  { key:"prior_pe", label:"Prior DVT or PE" },
  { key:"hormone",  label:"Estrogen / hormone use", sub:"OCP, HRT, hormone-containing medications" },
];
const WELLS_ITEMS = [
  { key:"dvt",    label:"Clinical signs/symptoms of DVT", sub:"Leg swelling, tenderness along deep veins", pts:3 },
  { key:"alt_dx", label:"PE is #1 diagnosis or equally likely", pts:3,
    sub:"Check only if PE is genuinely primary or co-equal diagnosis — this criterion alone scores 3 pts (PE likely), directing CTA directly" },
  { key:"hr100w", label:"Heart rate > 100 bpm",                                                           pts:1.5 },
  { key:"immob",  label:"Immobilization >= 3 days OR surgery in past 4 weeks",                            pts:1.5 },
  { key:"prior",  label:"Prior DVT or PE",                                                                pts:1.5 },
  { key:"hemow",  label:"Hemoptysis",                                                                      pts:1 },
  { key:"malig",  label:"Malignancy on treatment or palliative",                                          pts:1 },
];

function PERCWellsPanel() {
  const [pretest, setPretest] = useState(null);
  const [perc,    setPerc]    = useState({});
  const [wells,   setWells]   = useState({});
  const [ddimer,  setDdimer]  = useState(null);
  const [ctx,     setCtx]     = useState("");

  const togPerc  = (k,v) => setPerc(p  => { const n={...p}; p[k]===v ? delete n[k] : n[k]=v; return n; });
  const togWells = (k,v) => setWells(p => { const n={...p}; p[k]===v ? delete n[k] : n[k]=v; return n; });

  const percAnyPos  = PERC_ITEMS.some(c => perc[c.key]===true);
  const percAllNeg  = PERC_ITEMS.every(c => perc[c.key]===false);
  const percAllEval = PERC_ITEMS.every(c => c.key in perc);
  const showWells   = pretest==="not_low" || (pretest==="low" && (percAnyPos || (percAllEval && !percAllNeg)));
  const wellsScore  = WELLS_ITEMS.reduce((s,c) => s + (wells[c.key] ? c.pts : 0), 0);
  const wellsAllEval= WELLS_ITEMS.every(c => c.key in wells);

  let result = null;
  if (pretest==="low" && percAllEval && percAllNeg) {
    result = { label:"PE Ruled Out — PERC Negative", color:T.teal,
      sub:"Low pretest probability + all 8 PERC criteria absent. No D-dimer or CTA required." };
  } else if (showWells && wellsAllEval) {
    if (wellsScore <= 4) {
      if (ddimer==="neg") result = { label:"PE Excluded", color:T.teal,
        sub:`Wells ${wellsScore} (PE unlikely <= 4) + D-dimer negative — PE excluded without CTA.` };
      else if (ddimer==="pos") result = { label:"CTA Chest Indicated", color:T.coral,
        sub:`Wells ${wellsScore} (PE unlikely <= 4) + D-dimer positive — proceed to CTA chest.` };
      else result = { label:"Order D-dimer", color:T.gold,
        sub:`Wells ${wellsScore} (PE unlikely <= 4). If negative: PE excluded. If positive: CTA.` };
    } else {
      result = { label:"CTA Chest Indicated", color:T.coral,
        sub:`Wells ${wellsScore} (PE likely > 4). Proceed directly to CTA — D-dimer not useful at this probability.` };
    }
  }

  const posCrit = [
    ...PERC_ITEMS.filter(c => perc[c.key]===true).map(c => "PERC+ "+c.label),
    ...WELLS_ITEMS.filter(c => wells[c.key]===true).map(c => `${c.label} (+${c.pts}pts)`),
  ];
  const negCrit = [
    ...PERC_ITEMS.filter(c => perc[c.key]===false).map(c => "PERC- "+c.label),
    ...WELLS_ITEMS.filter(c => wells[c.key]===false).map(c => c.label),
  ];

  const Step = ({ n, label, color: sc }) => (
    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
      color:sc, letterSpacing:1.4, textTransform:"uppercase", marginBottom:7,
      display:"flex", alignItems:"center", gap:7 }}>
      <div style={{ width:18, height:18, borderRadius:"50%", background:sc, flexShrink:0,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontFamily:"'Playfair Display',serif", fontWeight:900,
        fontSize:10, color:"#080510" }}>{n}</div>
      {label}
    </div>
  );

  return (
    <div className="cdh-in">
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, marginBottom:12,
        padding:"9px 12px", borderRadius:9,
        background:`${T.coral}08`, border:`1px solid ${T.coral}28`,
        borderLeft:`3px solid ${T.coral}` }}>
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:T.coral, letterSpacing:1.2, textTransform:"uppercase", marginBottom:2 }}>PERC Rule</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5, color:T.txt3, lineHeight:1.5 }}>
            Low pretest only. All 8 absent: PE ruled out. Sensitivity 97.4%.
          </div>
        </div>
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:T.blue, letterSpacing:1.2, textTransform:"uppercase", marginBottom:2 }}>Modified Wells</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5, color:T.txt3, lineHeight:1.5 }}>
            {"<="} 4 (PE unlikely): D-dimer. {">"} 4 (PE likely): CTA directly.
          </div>
        </div>
      </div>
      <ResultBanner result={result} />
      <div style={{ marginBottom:12 }}>
        <Step n="1" label="Clinical Pretest Probability (Gestalt)" color={T.purple} />
        <div style={{ display:"flex", gap:7 }}>
          {[
            { val:"low",     label:"Low",             sub:"< 15% — PE not leading concern", color:T.teal },
            { val:"not_low", label:"Moderate / High", sub:">= 15% — PE on differential",  color:T.coral },
          ].map(opt => (
            <button key={opt.val} onClick={() => setPretest(opt.val)}
              style={{ flex:1, padding:"9px 10px", borderRadius:9, cursor:"pointer",
                textAlign:"left", transition:"all .1s",
                border:`1px solid ${pretest===opt.val ? opt.color+"55" : "rgba(45,30,80,0.4)"}`,
                background:pretest===opt.val ? `${opt.color}10` : "transparent" }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:12,
                color:pretest===opt.val ? opt.color : T.txt2, marginBottom:2 }}>{opt.label}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5, color:T.txt4 }}>{opt.sub}</div>
            </button>
          ))}
        </div>
      </div>
      {pretest==="low" && (
        <div style={{ marginBottom:12 }}>
          <Step n="2" label="PERC — All 8 must be absent (x) to rule out PE" color={T.coral} />
          {PERC_ITEMS.map(c => (
            <CriterionCheck key={c.key} label={c.label} sub={c.sub}
              state={c.key in perc ? perc[c.key] : undefined}
              onToggle={val => togPerc(c.key, val)} color={T.coral} />
          ))}
        </div>
      )}
      {showWells && (
        <div style={{ marginBottom:12 }}>
          <Step n={pretest==="low" ? "3" : "2"}
            label={`Wells Score${WELLS_ITEMS.some(c => wells[c.key]) ? ` — ${wellsScore.toFixed(1)} pts (${wellsScore<=4 ? "PE Unlikely <=4" : "PE Likely >4"})` : ""}`}
            color={T.blue} />
          {WELLS_ITEMS.map(c => (
            <CriterionCheck key={c.key} label={`${c.label}  (+${c.pts})`}
              sub={c.sub}
              state={c.key in wells ? wells[c.key] : undefined}
              onToggle={val => togWells(c.key, val)} color={T.blue} />
          ))}
        </div>
      )}
      {showWells && wellsAllEval && wellsScore <= 4 && (
        <div style={{ marginBottom:12 }}>
          <Step n={pretest==="low" ? "4" : "3"} label="D-dimer Result (Wells <= 4)" color={T.gold} />
          <div style={{ display:"flex", gap:7 }}>
            {[
              { val:"neg", label:"Negative", sub:"PE excluded — no CTA needed", color:T.teal },
              { val:"pos", label:"Positive",  sub:"Elevated — proceed to CTA",  color:T.coral },
            ].map(opt => (
              <button key={opt.val} onClick={() => setDdimer(ddimer===opt.val ? null : opt.val)}
                style={{ flex:1, padding:"9px 10px", borderRadius:8, cursor:"pointer",
                  textAlign:"left", transition:"all .1s",
                  border:`1px solid ${ddimer===opt.val ? opt.color+"55" : "rgba(45,30,80,0.4)"}`,
                  background:ddimer===opt.val ? `${opt.color}10` : "transparent" }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:12,
                  color:ddimer===opt.val ? opt.color : T.txt2, marginBottom:2 }}>{opt.label}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5, color:T.txt4 }}>{opt.sub}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      <ContextBox value={ctx} onChange={setCtx} color={T.coral}
        placeholder="e.g. 58yo F post-hip fracture, immobilized 5 days, HR 108, O2 94% RA..." />
      <AIBlock ruleName="PERC + Modified Wells for PE"
        ruleCtx="PERC: low pretest only, all 8 absent = PE ruled out. Wells: <=4 PE unlikely (D-dimer), >4 PE likely (CTA directly)."
        posCrit={posCrit} negCrit={negCrit}
        recommendation={result ? `${result.label}: ${result.sub}` : "Incomplete"}
        context={ctx} color={T.coral} />
      <div style={{ marginTop:10, fontFamily:"'JetBrains Mono',monospace",
        fontSize:9, color:T.txt4, letterSpacing:1.2 }}>
        PERC: Kline et al, J Thromb Haemost 2008 · Wells: Wells et al, Thromb Haemost 2000
      </div>
    </div>
  );
}

// ── HEART Score Panel ──────────────────────────────────────────────────
const HEART_CRIT = [
  { key:"H", label:"History",
    options:[
      { val:0, label:"Slightly suspicious",   sub:"Mostly non-specific features" },
      { val:1, label:"Moderately suspicious", sub:"Mixed typical/atypical" },
      { val:2, label:"Highly suspicious",     sub:"Classic ACS presentation" },
    ] },
  { key:"E", label:"ECG",
    options:[
      { val:0, label:"Normal" },
      { val:1, label:"Non-specific change",     sub:"LBBB, LVH, early repol, digoxin, nonspecific ST/T" },
      { val:2, label:"Significant ST deviation", sub:"New ST depression/elevation, T-wave inversion" },
    ] },
  { key:"A", label:"Age",
    options:[
      { val:0, label:"< 45 years" },
      { val:1, label:"45-65 years" },
      { val:2, label:"> 65 years" },
    ] },
  { key:"R", label:"Risk Factors",
    options:[
      { val:0, label:"None known" },
      { val:1, label:"1-2 risk factors", sub:"HTN, hyperlipidemia, DM, obesity, smoking, family hx CAD" },
      { val:2, label:">= 3 RF OR prior atherosclerotic disease", sub:"Prior MI, PCI/CABG, stroke, PAD" },
    ] },
  { key:"T", label:"Troponin (index)",
    options:[
      { val:0, label:"<= Normal limit", sub:"Serial troponin at 3h required before finalizing low-risk disposition" },
      { val:1, label:"1-3x upper limit of normal" },
      { val:2, label:"> 3x upper limit of normal" },
    ] },
];

function HeartPanel() {
  const [scores, setScores] = useState({});
  const [ctx,    setCtx]    = useState("");
  const onChange = (key, val) => setScores(p => ({...p, [key]:val}));
  const total  = Object.values(scores).reduce((s,v) => s+v, 0);
  const allSet = HEART_CRIT.every(c => c.key in scores);
  const result = allSet
    ? total <= 3 ? { label:`HEART ${total} — Low Risk`, color:T.teal,
        sub:"MACE risk ~1.7% at 6 weeks. Requires serial troponin (0 and 3h) before discharge. Outpatient stress testing or cardiology follow-up within 72h." }
      : total <= 6 ? { label:`HEART ${total} — Moderate Risk`, color:T.gold,
        sub:"MACE risk ~12-16.6%. Observation, serial troponins (0, 3, 6h), stress testing or cardiology referral." }
      : { label:`HEART ${total} — High Risk`, color:T.coral,
        sub:"MACE risk ~50-65%. Early invasive strategy. Cardiology consult. Likely ACS — admit." }
    : null;

  const posCrit = HEART_CRIT.filter(c => c.key in scores && scores[c.key] > 0)
    .map(c => `${c.label}: ${c.options.find(o => o.val===scores[c.key])?.label} (${scores[c.key]}pt)`);
  const negCrit = HEART_CRIT.filter(c => scores[c.key]===0).map(c => `${c.label}: 0 (normal/low risk)`);

  return (
    <div className="cdh-in">
      <div style={{ padding:"9px 12px", borderRadius:9, marginBottom:11,
        background:`${T.coral}08`, border:`1px solid ${T.coral}28`,
        borderLeft:`3px solid ${T.coral}` }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5, color:T.txt3, lineHeight:1.5 }}>
          Each component scored 0-2. Total 0-10. Validated for MACE (MI, revascularization, death) at 6 weeks.
          Backus et al, Ann Emerg Med 2010 · Index troponin T=0 does NOT exclude ACS — serial troponin required.
        </div>
      </div>
      {Object.keys(scores).length > 0 && (
        <div style={{ marginBottom:11, padding:"11px 14px", borderRadius:10,
          background:`${allSet ? (result?.color||T.gold) : T.gold}0a`,
          border:`1px solid ${allSet ? (result?.color||T.gold) : T.gold}30` }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:36,
              fontWeight:700, color:allSet ? (result?.color||T.gold) : T.gold }}>
              {total}
            </div>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11.5, color:T.txt4 }}>/ 10</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5, color:T.txt3 }}>
                {!allSet ? `${Object.keys(scores).length}/5 scored`
                  : total<=3 ? "Low Risk" : total<=6 ? "Moderate Risk" : "High Risk"}
              </div>
            </div>
            <div style={{ flex:1, display:"flex", gap:3 }}>
              {HEART_CRIT.map(c => (
                <div key={c.key} style={{ flex:1, height:4, borderRadius:2,
                  background:c.key in scores
                    ? scores[c.key]===0 ? T.teal : scores[c.key]===1 ? T.gold : T.coral
                    : "rgba(45,30,80,0.3)" }} />
              ))}
            </div>
          </div>
        </div>
      )}
      {allSet && <ResultBanner result={result} />}
      {HEART_CRIT.map(c => (
        <ScoreSelect key={c.key} crit={c} value={scores[c.key]} onChange={onChange} />
      ))}
      {Object.keys(scores).length > 0 && (
        <button onClick={() => setScores({})}
          style={{ marginBottom:8, padding:"5px 13px", borderRadius:7, cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
            border:"1px solid rgba(45,30,80,0.4)", background:"transparent", color:T.txt4 }}>
          ↺ Clear
        </button>
      )}
      <ContextBox value={ctx} onChange={setCtx} color={T.coral}
        placeholder="e.g. 62yo M, diaphoretic, index troponin pending, prior CABG 2018..." />
      <AIBlock ruleName="HEART Score for Chest Pain / ACS Risk Stratification"
        ruleCtx="Scores 0-10 across History, ECG, Age, Risk factors, Troponin. Low (0-3): ~1.7% MACE. Moderate (4-6): ~12-16.6%. High (7-10): ~50-65% MACE at 6 weeks. Serial troponin required before finalizing low-risk discharge."
        posCrit={posCrit} negCrit={negCrit}
        recommendation={result ? `${result.label}: ${result.sub}` : "Incomplete"}
        context={ctx} color={T.coral} />
    </div>
  );
}

// ── ABCD2 TIA Score Panel ──────────────────────────────────────────────
const ABCD2_CRIT = [
  { key:"A", label:"Age",
    options:[
      { val:0, label:"< 60 years" },
      { val:1, label:">= 60 years" },
    ] },
  { key:"B", label:"Blood Pressure (initial evaluation)",
    options:[
      { val:0, label:"SBP < 140 AND DBP < 90" },
      { val:1, label:"SBP >= 140 OR DBP >= 90" },
    ] },
  { key:"C", label:"Clinical Features of TIA",
    options:[
      { val:0, label:"Other symptom", sub:"Visual only, isolated sensory, isolated dizziness, etc." },
      { val:1, label:"Speech disturbance without weakness" },
      { val:2, label:"Unilateral weakness", sub:"Arm, leg, or face — any limb weakness is 2 points" },
    ] },
  { key:"D", label:"Duration of TIA Symptoms",
    options:[
      { val:0, label:"< 10 minutes" },
      { val:1, label:"10-59 minutes" },
      { val:2, label:">= 60 minutes" },
    ] },
  { key:"D2", label:"Diabetes",
    options:[
      { val:0, label:"No" },
      { val:1, label:"Yes", sub:"On medication or fasting glucose > 126 mg/dL" },
    ] },
];

function ABCD2Panel() {
  const [scores, setScores] = useState({});
  const [ctx,    setCtx]    = useState("");
  const onChange = (key, val) => setScores(p => ({...p, [key]:val}));
  const total  = Object.values(scores).reduce((s,v) => s+v, 0);
  const allSet = ABCD2_CRIT.every(c => c.key in scores);
  const result = allSet
    ? total <= 3 ? { label:`ABCD2: ${total} — Low Risk`, color:T.teal,
        sub:"2-day stroke risk ~1.0%, 7-day ~1.2%. Consider neurology follow-up within 24h. Strong evidence for dual antiplatelet therapy (aspirin + clopidogrel) x 21 days." }
      : total <= 5 ? { label:`ABCD2: ${total} — Moderate Risk`, color:T.gold,
        sub:"2-day stroke risk ~4.1%, 7-day ~5.9%. Admit or 24h observation with imaging (MRI DWI preferred). Neurology urgently." }
      : { label:`ABCD2: ${total} — High Risk`, color:T.coral,
        sub:"2-day stroke risk ~8.1%, 7-day ~11.7%. Admit. MRI DWI + CTA head/neck + cardiac monitoring. Urgent neurology." }
    : null;

  const posCrit = ABCD2_CRIT.filter(c => c.key in scores && scores[c.key] > 0)
    .map(c => `${c.label}: ${c.options.find(o => o.val===scores[c.key])?.label} (${scores[c.key]}pt)`);
  const negCrit = ABCD2_CRIT.filter(c => scores[c.key]===0).map(c => `${c.label}: 0`);

  return (
    <div className="cdh-in">
      <div style={{ padding:"9px 12px", borderRadius:9, marginBottom:11,
        background:`${T.purple}08`, border:`1px solid ${T.purple}28`,
        borderLeft:`3px solid ${T.purple}` }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5, color:T.txt3, lineHeight:1.5 }}>
          Applies to TIA with symptom resolution. Johnston et al, Lancet 2007.
          Score 0-7 — predicts 2-day and 7-day stroke risk. Best used as one input alongside imaging,
          vascular workup, and clinical judgment — not as sole admission criterion.
        </div>
      </div>
      {Object.keys(scores).length > 0 && (
        <div style={{ marginBottom:11, padding:"11px 14px", borderRadius:10,
          background:`${allSet ? (result?.color||T.gold) : T.gold}0a`,
          border:`1px solid ${allSet ? (result?.color||T.gold) : T.gold}30` }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:36,
              fontWeight:700, color:allSet ? (result?.color||T.gold) : T.gold }}>
              {total}
            </div>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11.5, color:T.txt4 }}>/ 7</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5, color:T.txt3 }}>
                {!allSet ? `${Object.keys(scores).length}/5 scored`
                  : total<=3 ? "Low Risk" : total<=5 ? "Moderate Risk" : "High Risk"}
              </div>
            </div>
            <div style={{ flex:1, display:"flex", gap:3 }}>
              {ABCD2_CRIT.map(c => (
                <div key={c.key} style={{ flex:1, height:4, borderRadius:2,
                  background:c.key in scores
                    ? scores[c.key]===0 ? T.teal : scores[c.key]===1 ? T.gold : T.coral
                    : "rgba(45,30,80,0.3)" }} />
              ))}
            </div>
          </div>
        </div>
      )}
      {allSet && <ResultBanner result={result} />}
      {ABCD2_CRIT.map(c => (
        <ScoreSelect key={c.key} crit={c} value={scores[c.key]} onChange={onChange} />
      ))}
      {Object.keys(scores).length > 0 && (
        <button onClick={() => setScores({})}
          style={{ marginBottom:8, padding:"5px 13px", borderRadius:7, cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
            border:"1px solid rgba(45,30,80,0.4)", background:"transparent", color:T.txt4 }}>
          ↺ Clear
        </button>
      )}
      <div style={{ padding:"8px 10px", borderRadius:8, marginBottom:8,
        background:`${T.gold}08`, border:`1px solid ${T.gold}22` }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:T.gold, letterSpacing:1.2, textTransform:"uppercase", marginBottom:3 }}>
          Dual Antiplatelet (all TIA risk tiers)
        </div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt3, lineHeight:1.6 }}>
          Aspirin 162-325 mg + clopidogrel 75 mg (after 300-600 mg load) x 21 days —
          reduces early stroke risk by ~30% (POINT, CHANCE trials). Start in ED for all TIA if no contraindication.
          Do not use for stroke (completed infarct).
        </div>
      </div>
      <ContextBox value={ctx} onChange={setCtx} color={T.purple}
        placeholder="e.g. 68yo M, 20-min left arm weakness now resolved, AF on no anticoagulation, BP 168/94..." />
      <AIBlock ruleName="ABCD2 Score for TIA Risk Stratification"
        ruleCtx="ABCD2 0-7: Low (0-3) ~1% 2-day stroke, Moderate (4-5) ~4.1%, High (6-7) ~8.1%. Johnston 2007. Should be combined with imaging and vascular workup — not used as sole admission determinant."
        posCrit={posCrit} negCrit={negCrit}
        recommendation={result ? `${result.label}: ${result.sub}` : "Incomplete"}
        context={ctx} color={T.purple} />
      <div style={{ marginTop:10, fontFamily:"'JetBrains Mono',monospace",
        fontSize:9, color:T.txt4, letterSpacing:1.2 }}>
        Johnston et al, Lancet 2007 · POINT trial (Johnston 2018) · CHANCE trial (Wang 2013)
      </div>
    </div>
  );
}

// ── Ottawa Ankle & Foot Panel ──────────────────────────────────────────
function OttawaPanel() {
  const [anklePain, setAnklePain] = useState(null);
  const [footPain,  setFootPain]  = useState(null);
  const [ankle,     setAnkle]     = useState({});
  const [foot,      setFoot]      = useState({});
  const [ctx,       setCtx]       = useState("");

  const togA = (k,v) => setAnkle(p => { const n={...p}; p[k]===v ? delete n[k] : n[k]=v; return n; });
  const togF = (k,v) => setFoot(p  => { const n={...p}; p[k]===v ? delete n[k] : n[k]=v; return n; });

  const ANKLE_C = [
    { key:"lat",  label:"Bone tenderness at posterior edge or tip of lateral malleolus", sub:"Posterior 6cm of fibula or tip" },
    { key:"med",  label:"Bone tenderness at posterior edge or tip of medial malleolus",  sub:"Posterior 6cm of tibia or tip" },
    { key:"wt_a", label:"Unable to bear weight immediately AND in ED (4 steps)" },
  ];
  const FOOT_C = [
    { key:"mt5",  label:"Bone tenderness at base of 5th metatarsal" },
    { key:"nav",  label:"Bone tenderness at navicular bone" },
    { key:"wt_f", label:"Unable to bear weight immediately AND in ED (4 steps)" },
  ];

  const ankleResult = anklePain===false
    ? { label:"Ankle X-Ray Not Indicated", color:T.teal, sub:"No malleolar zone pain — Ottawa Ankle Rule entry criterion not met." }
    : anklePain===true && ANKLE_C.every(c => c.key in ankle)
      ? ANKLE_C.some(c => ankle[c.key])
        ? { label:"Ankle X-Ray Indicated", color:T.coral, sub:"Ottawa Ankle Rule positive — one or more criteria present." }
        : { label:"Ankle X-Ray Not Indicated", color:T.teal, sub:"All ankle Ottawa criteria absent. X-ray not required (sensitivity 96.4%)." }
      : null;

  const footResult = footPain===false
    ? { label:"Foot X-Ray Not Indicated", color:T.teal, sub:"No midfoot zone pain — Ottawa Foot Rule entry criterion not met." }
    : footPain===true && FOOT_C.every(c => c.key in foot)
      ? FOOT_C.some(c => foot[c.key])
        ? { label:"Foot X-Ray Indicated", color:T.coral, sub:"Ottawa Foot Rule positive — one or more criteria present." }
        : { label:"Foot X-Ray Not Indicated", color:T.teal, sub:"All foot Ottawa criteria absent. X-ray not required (sensitivity 99.6%)." }
      : null;

  const posCrit = [
    ...ANKLE_C.filter(c => ankle[c.key]===true).map(c => "Ankle: "+c.label),
    ...FOOT_C.filter(c  => foot[c.key]===true).map(c  => "Foot: "+c.label),
  ];
  const negCrit = [
    ...ANKLE_C.filter(c => ankle[c.key]===false).map(c => "Ankle absent: "+c.label),
    ...FOOT_C.filter(c  => foot[c.key]===false).map(c  => "Foot absent: "+c.label),
  ];

  const ZoneQ = ({ label, value, onChange: onCh, color: zc }) => (
    <>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4, marginBottom:6 }}>{label}</div>
      <div style={{ display:"flex", gap:5, marginBottom:9 }}>
        {[{v:true,l:"Yes"},{v:false,l:"No"}].map(o => (
          <button key={String(o.v)} onClick={() => onCh(o.v)}
            style={{ flex:1, padding:"7px 0", borderRadius:7, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
              border:`1px solid ${value===o.v ? zc+"55" : "rgba(45,30,80,0.4)"}`,
              background:value===o.v ? `${zc}12` : "transparent",
              color:value===o.v ? zc : T.txt4 }}>{o.l}</button>
        ))}
      </div>
    </>
  );

  const MiniRes = ({ result: r }) => r ? (
    <div style={{ marginTop:8, padding:"8px 11px", borderRadius:8,
      background:`${r.color}0c`, border:`1px solid ${r.color}44` }}>
      <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
        fontSize:12, color:r.color, marginBottom:2 }}>{r.label}</div>
      <div style={{ fontFamily:"'DM Sans',sans-serif",
        fontSize:10, color:T.txt2, lineHeight:1.5 }}>{r.sub}</div>
    </div>
  ) : null;

  return (
    <div className="cdh-in">
      <div style={{ padding:"9px 12px", borderRadius:9, marginBottom:12,
        background:`${T.orange}08`, border:`1px solid ${T.orange}28`,
        borderLeft:`3px solid ${T.orange}` }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5, color:T.txt3, lineHeight:1.5 }}>
          Adults with acute ankle/foot injury within <strong>10 days</strong> (strict cutoff). Stiell et al, Lancet 1992.
          Not validated: age under 18, osteoporosis, pregnancy, distracting injury, AMS.
        </div>
      </div>
      {/* mobile-responsive two-column grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:14 }}>
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.orange, letterSpacing:1.4, textTransform:"uppercase", marginBottom:8 }}>
            Ankle X-Ray
          </div>
          <ZoneQ label="Pain in malleolar zone?" value={anklePain}
            onChange={setAnklePain} color={T.orange} />
          {anklePain===true && ANKLE_C.map(c => (
            <CriterionCheck key={c.key} label={c.label} sub={c.sub}
              state={c.key in ankle ? ankle[c.key] : undefined}
              onToggle={val => togA(c.key, val)} color={T.orange} />
          ))}
          <MiniRes result={ankleResult} />
        </div>
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.gold, letterSpacing:1.4, textTransform:"uppercase", marginBottom:8 }}>
            Foot X-Ray
          </div>
          <ZoneQ label="Pain in midfoot zone?" value={footPain}
            onChange={setFootPain} color={T.gold} />
          {footPain===true && FOOT_C.map(c => (
            <CriterionCheck key={c.key} label={c.label} sub={c.sub}
              state={c.key in foot ? foot[c.key] : undefined}
              onToggle={val => togF(c.key, val)} color={T.gold} />
          ))}
          <MiniRes result={footResult} />
        </div>
      </div>
      <ContextBox value={ctx} onChange={setCtx} color={T.orange}
        placeholder="e.g. 22yo athlete, inversion injury, significant lateral ankle swelling, cannot weight bear..." />
      <AIBlock ruleName="Ottawa Ankle and Foot Rules"
        ruleCtx="Ottawa rules: adults, acute ankle/foot injury within 10 days (strict). Entry criterion: pain in malleolar zone (ankle) or midfoot zone (foot). Not validated in children under 18."
        posCrit={posCrit} negCrit={negCrit}
        recommendation={[ankleResult, footResult].filter(Boolean).map(r => r.label).join(" | ") || "Incomplete"}
        context={ctx} color={T.orange} />
      <div style={{ marginTop:10, fontFamily:"'JetBrains Mono',monospace",
        fontSize:9, color:T.txt4, letterSpacing:1.2 }}>
        Stiell et al, Lancet 1992 · Ankle sensitivity 96.4% · Foot sensitivity 99.6%
      </div>
    </div>
  );
}

// ── Canadian C-Spine + NEXUS Panel ─────────────────────────────────────
function CSpinePanel() {
  const [ccr,    setCCR]    = useState({});
  const [canRot, setCanRot] = useState(null);
  const [nexus,  setNexus]  = useState({});
  const [ctx,    setCtx]    = useState("");

  const togC = (k,v) => setCCR(p   => { const n={...p}; p[k]===v ? delete n[k] : n[k]=v; return n; });
  const togN = (k,v) => setNexus(p => { const n={...p}; p[k]===v ? delete n[k] : n[k]=v; return n; });

  const CCR_HI = [
    { key:"age65",       label:"Age >= 65 years" },
    { key:"danger",      label:"Dangerous mechanism", sub:"Fall > 3ft/5 stairs, axial load, high-speed MVC/rollover/ejection, bicycle/MRC collision" },
    { key:"paresthesia", label:"Paresthesias in extremities" },
  ];
  const CCR_LO = [
    { key:"simple_mvc",   label:"Simple rear-end MVC", sub:"Not pushed into traffic, not high speed, not rollover, not struck by bus/truck" },
    { key:"sitting_ed",   label:"Sitting position in ED" },
    { key:"ambulatory",   label:"Ambulatory at any time after injury" },
    { key:"delayed_pain", label:"Delayed onset of neck pain (not immediate)" },
    { key:"no_midline",   label:"Absence of midline c-spine tenderness" },
  ];
  const NX = [
    { key:"nx_tender",   label:"Posterior midline c-spine tenderness" },
    { key:"nx_intox",    label:"Evidence of intoxication" },
    { key:"nx_alert",    label:"Altered level of alertness", sub:"GCS < 15, confused, disoriented, not following commands" },
    { key:"nx_neuro",    label:"Focal neurological deficit" },
    { key:"nx_distract", label:"Painful distracting injury" },
  ];

  const hiAny     = CCR_HI.some(c => ccr[c.key]===true);
  const hiAllEval = CCR_HI.every(c => c.key in ccr);
  const loAny     = CCR_LO.some(c => ccr[c.key]===true);
  const loAllEval = CCR_LO.every(c => c.key in ccr);

  let ccrResult = null;
  if (hiAny) {
    ccrResult = { label:"Imaging Required", color:T.coral, sub:"High-risk criterion present — CT c-spine indicated." };
  } else if (hiAllEval) {
    if (loAny) {
      if (canRot===true)  ccrResult = { label:"No Imaging Required", color:T.teal,
        sub:"No high-risk factors. Low-risk factor present. Patient can rotate neck 45° bilaterally." };
      else if (canRot===false) ccrResult = { label:"Imaging Required", color:T.coral,
        sub:"Low-risk factor present but patient cannot rotate 45° — imaging required." };
      else ccrResult = { label:"Assess Rotation", color:T.gold,
        sub:"No high-risk factors, low-risk present. Can patient actively rotate neck 45° left AND right?" };
    } else if (loAllEval) {
      ccrResult = { label:"Imaging Required", color:T.orange,
        sub:"No high-risk factors but no low-risk factors present — imaging required per Canadian C-Spine Rule." };
    }
  }

  const nxAnyPos = NX.some(c => nexus[c.key]===true);
  const nxAllNeg = NX.every(c => nexus[c.key]===false);
  const nexusResult = nxAnyPos
    ? { label:"Imaging Required", color:T.coral, sub:"One or more NEXUS criteria present — c-spine imaging required." }
    : nxAllNeg
      ? { label:"No Imaging Required", color:T.teal, sub:"All 5 NEXUS criteria absent — c-spine cleared without imaging (sensitivity 99.6%)." }
      : null;

  const posCrit = [
    ...CCR_HI.filter(c => ccr[c.key]===true).map(c => "CCR-Hi: "+c.label),
    ...CCR_LO.filter(c => ccr[c.key]===true).map(c => "CCR-Lo: "+c.label),
    ...NX.filter(c => nexus[c.key]===true).map(c => "NEXUS+: "+c.label),
  ];
  const negCrit = [
    ...CCR_HI.filter(c => ccr[c.key]===false).map(c => "CCR-Hi absent: "+c.label),
    ...NX.filter(c => nexus[c.key]===false).map(c => "NEXUS-: "+c.label),
  ];

  const MiniRes = ({ result: r }) => r ? (
    <div style={{ marginBottom:10, padding:"8px 10px", borderRadius:8,
      background:`${r.color}0c`, border:`1px solid ${r.color}44` }}>
      <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
        fontSize:12, color:r.color, marginBottom:2 }}>{r.label}</div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt2, lineHeight:1.5 }}>{r.sub}</div>
    </div>
  ) : null;

  return (
    <div className="cdh-in">
      <div style={{ padding:"9px 12px", borderRadius:9, marginBottom:12,
        background:`${T.blue}08`, border:`1px solid ${T.blue}28`,
        borderLeft:`3px solid ${T.blue}` }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5, color:T.txt3, lineHeight:1.5 }}>
          Both: alert (GCS 15), stable adult trauma. CCR: sensitivity 99.4%, specificity 45.1%.
          NEXUS: sensitivity 99.6%, specificity 12.9%. CCR preferred when both applicable — higher specificity.
        </div>
      </div>
      {/* mobile-responsive two-column grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:14 }}>
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.blue, letterSpacing:1.4, textTransform:"uppercase", marginBottom:3 }}>
            Canadian C-Spine Rule
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:T.txt4, marginBottom:9 }}>
            Stiell et al, JAMA 2001
          </div>
          <MiniRes result={ccrResult} />
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:T.coral, letterSpacing:1.2, textTransform:"uppercase", marginBottom:5 }}>
            High-Risk (any → imaging)
          </div>
          {CCR_HI.map(c => (
            <CriterionCheck key={c.key} label={c.label} sub={c.sub}
              state={c.key in ccr ? ccr[c.key] : undefined}
              onToggle={val => togC(c.key, val)} color={T.coral} />
          ))}
          {hiAllEval && !hiAny && (
            <>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                color:T.gold, letterSpacing:1.2, textTransform:"uppercase",
                marginTop:9, marginBottom:5 }}>
                Low-Risk (any → assess rotation)
              </div>
              {CCR_LO.map(c => (
                <CriterionCheck key={c.key} label={c.label} sub={c.sub}
                  state={c.key in ccr ? ccr[c.key] : undefined}
                  onToggle={val => togC(c.key, val)} color={T.gold} />
              ))}
            </>
          )}
          {hiAllEval && !hiAny && loAny && (
            <div style={{ marginTop:8 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                color:T.teal, letterSpacing:1.2, textTransform:"uppercase", marginBottom:5 }}>
                Can patient rotate 45° left AND right?
              </div>
              <div style={{ display:"flex", gap:5 }}>
                {[{v:true,l:"Yes — rotate OK",c:T.teal},{v:false,l:"No — cannot",c:T.coral}].map(o => (
                  <button key={String(o.v)} onClick={() => setCanRot(canRot===o.v ? null : o.v)}
                    style={{ flex:1, padding:"7px 4px", borderRadius:7, cursor:"pointer",
                      fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:10,
                      border:`1px solid ${canRot===o.v ? o.c+"55" : "rgba(45,30,80,0.4)"}`,
                      background:canRot===o.v ? `${o.c}12` : "transparent",
                      color:canRot===o.v ? o.c : T.txt4 }}>{o.l}</button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.lavender, letterSpacing:1.4, textTransform:"uppercase", marginBottom:3 }}>
            NEXUS Criteria
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:T.txt4, marginBottom:9 }}>
            Hoffman et al, NEJM 2000
          </div>
          <MiniRes result={nexusResult} />
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5, color:T.txt4,
            marginBottom:7, lineHeight:1.5 }}>
            ALL 5 must be absent (x) to clear c-spine without imaging.
          </div>
          {NX.map(c => (
            <CriterionCheck key={c.key} label={c.label} sub={c.sub}
              state={c.key in nexus ? nexus[c.key] : undefined}
              onToggle={val => togN(c.key, val)} color={T.lavender} />
          ))}
        </div>
      </div>
      <ContextBox value={ctx} onChange={setCtx} color={T.blue}
        placeholder="e.g. 34yo rear-end MVC at 30mph, ambulatory at scene, posterior neck pain, no paresthesias..." />
      <AIBlock ruleName="Canadian C-Spine Rule + NEXUS"
        ruleCtx="CCR: GCS 15, stable, adult trauma. Three-step: high-risk (any→imaging), low-risk (any→assess rotation), can rotate 45° (yes→clear). NEXUS: all 5 absent→clear."
        posCrit={posCrit} negCrit={negCrit}
        recommendation={[ccrResult?.label, nexusResult?.label].filter(Boolean).join(" / ") || "Incomplete"}
        context={ctx} color={T.blue} />
    </div>
  );
}

// ── QuickNote / Send to Chart ──────────────────────────────────────────
function ChartSendPanel({ ruleName }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [err,  setErr]  = useState(false);

  const template = `[Notrya ClinicalDecisionHub — ${ruleName}]
Key positive findings: 
Key negative findings: 
Rule recommendation: 
AI clinical reasoning: 
Plan / disposition: 

Generated via Notrya ClinicalDecisionHub. Review and complete before chart submission.`;

  const send = async () => {
    setErr(false);
    try {
      await ClinicalNote.create({
        note_text: note || template,
        note_type:  "Clinical Decision Rule",
        source:     "QN-Handoff",
        status:     "pending",
      });
      setSent(true);
      setTimeout(() => { setOpen(false); setSent(false); setNote(""); }, 2000);
    } catch { setErr(true); }
  };

  return (
    <div style={{ marginTop:14 }}>
      <button onClick={() => { setOpen(p => !p); if (!note) setNote(template); setSent(false); setErr(false); }}
        style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 14px",
          borderRadius:9, cursor:"pointer",
          fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12,
          border:`1px solid ${T.teal}44`, background:`${T.teal}09`, color:T.teal }}>
        📋 Send to Chart
      </button>
      {open && (
        <div className="cdh-in" style={{ marginTop:8, padding:"12px 14px",
          borderRadius:10, background:"rgba(8,5,16,0.95)",
          border:`1px solid ${T.teal}33` }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:T.teal, letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
            Send to QuickNote / ClinicalNoteStudio
          </div>
          <textarea value={note || template} onChange={e => setNote(e.target.value)} rows={8}
            style={{ width:"100%", padding:"9px 11px", borderRadius:8,
              outline:"none", resize:"vertical", boxSizing:"border-box",
              fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt2,
              lineHeight:1.65, background:"rgba(14,10,26,0.9)",
              border:`1px solid ${T.teal}33` }} />
          <div style={{ display:"flex", gap:8, marginTop:8, alignItems:"center" }}>
            <button onClick={send}
              style={{ padding:"8px 18px", borderRadius:8, cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:12,
                border:`1px solid ${T.teal}66`, background:`${T.teal}18`,
                color:sent ? T.green : T.teal }}>
              {sent ? "✓ Sent to Chart" : "Send to QuickNote"}
            </button>
            <button onClick={() => setOpen(false)}
              style={{ padding:"8px 12px", borderRadius:8, cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif", fontSize:11,
                border:"1px solid rgba(45,30,80,0.4)",
                background:"transparent", color:T.txt4 }}>
              Cancel
            </button>
            {err && <span style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:10, color:T.coral }}>
              Entity write failed — check Base44 connection
            </span>}
          </div>
          <div style={{ marginTop:7, fontFamily:"'DM Sans',sans-serif",
            fontSize:11.5, color:T.txt4, lineHeight:1.5 }}>
            Creates ClinicalNote entity · source: "QN-Handoff" · status: "pending"
            · Opens in ClinicalNoteStudio for completion
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════
export default function ClinicalDecisionHub({ embedded = false }) {
  const navigate = useNavigate();
  const [cat,  setCat]  = useState("neuro");
  const [rule, setRule] = useState("canadian_ct");
  const activeCat  = CATEGORIES.find(c => c.id === cat);
  const activeRule = activeCat?.rules.find(r => r.id === rule);

  function ActivePanel() {
    if (rule in BINARY_RULES)    return <BinaryPanel key={rule} ruleId={rule} />;
    if (rule === "perc_wells")   return <PERCWellsPanel key={rule} />;
    if (rule === "heart_score")  return <HeartPanel key={rule} />;
    if (rule === "abcd2")        return <ABCD2Panel key={rule} />;
    if (rule === "ottawa")       return <OttawaPanel key={rule} />;
    if (rule === "cspine")       return <CSpinePanel key={rule} />;
    return null;
  }

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",
      background:embedded ? "transparent" : T.bg,
      minHeight:embedded ? "auto" : "100vh", color:T.txt }}>
      <div style={{ maxWidth:900, margin:"0 auto", padding:embedded ? "0" : "0 16px" }}>

        {!embedded && (
          <div style={{ padding:"18px 0 14px" }}>
            <button onClick={() => navigate("/hub")}
              style={{ marginBottom:10, display:"inline-flex", alignItems:"center", gap:7,
                fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
                padding:"5px 14px", borderRadius:8, background:"rgba(8,5,16,0.8)",
                border:"1px solid rgba(45,30,80,0.5)", color:T.txt3, cursor:"pointer" }}>
              ← Back to Hub
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <div style={{ background:"rgba(8,5,16,0.95)", border:"1px solid rgba(45,30,80,0.6)",
                borderRadius:10, padding:"5px 12px", display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.purple, letterSpacing:3 }}>NOTRYA</span>
                <span style={{ color:T.txt4, fontFamily:"'JetBrains Mono',monospace", fontSize:10 }}>/</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:11.5, color:T.txt3, letterSpacing:2 }}>DECISION</span>
              </div>
              <div style={{ height:1, flex:1,
                background:"linear-gradient(90deg,rgba(176,109,255,0.5),transparent)" }} />
            </div>
            <h1 className="shimmer-cdh"
              style={{ fontFamily:"'Playfair Display',serif",
                fontSize:"clamp(22px,4vw,38px)", fontWeight:900,
                letterSpacing:-0.5, lineHeight:1.1 }}>
              Clinical Decision Rules
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt4, marginTop:4 }}>
              Canadian CT · PECARN · New Orleans · ABCD2 TIA ·
              PERC + Wells · HEART · CURB-65 · SF Syncope ·
              Ottawa Ankle/Foot · C-Spine CCR + NEXUS · AI
            </p>
          </div>
        )}

        {/* Category selector */}
        <div style={{ display:"flex", gap:6, marginBottom:10 }}>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => { setCat(c.id); setRule(c.rules[0].id); }}
              style={{ flex:1, padding:"10px 8px", borderRadius:10, cursor:"pointer",
                textAlign:"center", transition:"all .14s",
                border:`1px solid ${cat===c.id ? c.color+"66" : "rgba(45,30,80,0.5)"}`,
                background:cat===c.id ? `${c.color}12` : "rgba(14,10,26,0.6)" }}>
              <div style={{ fontSize:20, marginBottom:3 }}>{c.icon}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                color:cat===c.id ? c.color : T.txt4 }}>{c.label}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.txt4, marginTop:2 }}>{c.rules.length} rules</div>
            </button>
          ))}
        </div>

        {/* Rule selector */}
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", padding:"5px",
          marginBottom:14, background:"rgba(14,10,26,0.85)",
          border:"1px solid rgba(45,30,80,0.4)", borderRadius:10 }}>
          {activeCat?.rules.map(r => (
            <button key={r.id} onClick={() => setRule(r.id)}
              style={{ display:"flex", alignItems:"center", gap:5,
                padding:"7px 11px", borderRadius:8, cursor:"pointer",
                flex:1, justifyContent:"center",
                fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                transition:"all .12s",
                border:`1px solid ${rule===r.id ? activeCat.color+"66" : "rgba(45,30,80,0.5)"}`,
                background:rule===r.id ? `${activeCat.color}12` : "transparent",
                color:rule===r.id ? activeCat.color : T.txt4 }}>
              <span style={{ fontSize:13 }}>{r.icon}</span>
              <span>{r.name}</span>
            </button>
          ))}
        </div>

        <ActivePanel />

        {/* QuickNote integration */}
        <ChartSendPanel ruleName={activeRule?.name || rule} />

        {!embedded && (
          <div style={{ textAlign:"center", padding:"24px 0 16px",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA DECISION RULES · CANADIAN CT & CCR (STIELL 2001) · PECARN (KUPPERMANN 2009) ·
            NEW ORLEANS (HAYDEL 2000) · ABCD2 (JOHNSTON 2007) · PERC (KLINE 2008) ·
            WELLS (WELLS 2000) · HEART (BACKUS 2010) · CURB-65 (LIM 2003) ·
            SF SYNCOPE (QUINN 2004) · OTTAWA (STIELL 1992) · NEXUS (HOFFMAN 2000) · CLINICAL SUPPORT ONLY
          </div>
        )}
      </div>
    </div>
  );
}