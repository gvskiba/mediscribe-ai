// PsychHub.jsx — Psychiatric Emergency Hub
//
// Clinical basis:
//   - Agitation: DOMINO trial (Isbister 2023) — droperidol + midazolam Level B
//   - DORM II: droperidol alone vs droperidol + midazolam
//   - ACEP October 2023 Clinical Policy — Level B: droperidol + midazolam
//     preferred first-line for undifferentiated ED agitation
//   - SI/HI risk: Columbia-Suicide Severity Rating Scale (C-SSRS) principles
//   - CIWA-Ar: Sullivan 1989 — 10-item alcohol withdrawal scale
//   - Serotonin syndrome: Hunter Criteria (Dunkley 2003)
//   - NMS: diagnostic criteria, bromocriptine/dantrolene dosing
//
// Route: /PsychHub
// Constraints: no form, no localStorage, straight quotes only,
//   single react import, border before borderTop/etc.

import { useState } from "react";
import { useNavigate } from "react-router-dom";

(() => {
  if (document.getElementById("psych-fonts")) return;
  const l = document.createElement("link");
  l.id = "psych-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "psych-css";
  s.textContent = `
    @keyframes p-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
    .p-in{animation:p-in .18s ease forwards}
    @keyframes shimmer-p{0%{background-position:-200% center}100%{background-position:200% center}}
    .shimmer-p{background:linear-gradient(90deg,#f0f4ff 0%,#f472b6 40%,#9b6dff 65%,#f0f4ff 100%);
      background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;animation:shimmer-p 4s linear infinite;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#0d050f", panel:"#180a1a",
  txt:"#fdf0ff", txt2:"#d4a8e8", txt3:"#9a68b8", txt4:"#604878",
  teal:"#00d4b4", gold:"#f5c842", coral:"#ff5c5c", blue:"#4da6ff",
  orange:"#ff9f43", purple:"#b06dff", green:"#3dffa0", red:"#ff3d3d",
  rose:"#f472b6", lavender:"#c4aaff",
};

const TABS = [
  { id:"agitation", label:"Agitation",      icon:"⚡", color:T.coral  },
  { id:"sihi",      label:"SI / HI Risk",   icon:"🔍", color:T.orange },
  { id:"ciwa",      label:"CIWA-Ar",        icon:"🍺", color:T.gold   },
  { id:"syndromes", label:"Toxic Syndromes",icon:"💊", color:T.purple },
];

function Card({ color, title, children }) {
  return (
    <div style={{ padding:"11px 13px", borderRadius:10, marginBottom:10,
      background:`${color}07`, border:`1px solid ${color}28`,
      borderLeft:`3px solid ${color}` }}>
      {title && <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
        color, letterSpacing:1.5, textTransform:"uppercase", marginBottom:7 }}>
        {title}</div>}
      {children}
    </div>
  );
}

function Bullet({ text, sub, color }) {
  return (
    <div style={{ display:"flex", gap:7, alignItems:"flex-start", marginBottom:5 }}>
      <span style={{ color:color||T.purple, fontSize:7, marginTop:4, flexShrink:0 }}>▸</span>
      <div>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5,
          color:T.txt2, lineHeight:1.6 }}>{text}</span>
        {sub && <div style={{ fontFamily:"'DM Sans',sans-serif",
          fontSize:10, color:T.txt4, marginTop:1 }}>{sub}</div>}
      </div>
    </div>
  );
}

function Check({ label, sub, checked, onToggle, color }) {
  return (
    <button onClick={onToggle}
      style={{ display:"flex", alignItems:"flex-start", gap:9, width:"100%",
        padding:"8px 12px", borderRadius:8, cursor:"pointer", textAlign:"left",
        border:"none", marginBottom:4, transition:"all .1s",
        background:checked ? `${color||T.purple}10` : "rgba(24,10,26,0.7)",
        borderLeft:`3px solid ${checked ? (color||T.purple) : "rgba(80,40,120,0.4)"}` }}>
      <div style={{ width:17, height:17, borderRadius:4, flexShrink:0, marginTop:1,
        border:`2px solid ${checked ? (color||T.purple) : "rgba(96,72,120,0.5)"}`,
        background:checked ? (color||T.purple) : "transparent",
        display:"flex", alignItems:"center", justifyContent:"center" }}>
        {checked && <span style={{ color:"#0d050f", fontSize:9, fontWeight:900 }}>✓</span>}
      </div>
      <div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
          fontSize:12, color:checked ? (color||T.purple) : T.txt2 }}>{label}</div>
        {sub && <div style={{ fontFamily:"'DM Sans',sans-serif",
          fontSize:10, color:T.txt4, marginTop:1 }}>{sub}</div>}
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 1 — AGITATION PROTOCOL
// ACEP October 2023 Level B: droperidol + midazolam first-line
// ═══════════════════════════════════════════════════════════════════════════
function AgitationTab() {
  const [stage, setStage] = useState("initial");

  return (
    <div className="p-in">
      {/* ACEP 2023 update banner */}
      <div style={{ padding:"9px 13px", borderRadius:10, marginBottom:12,
        background:"rgba(255,92,92,0.08)",
        border:"1px solid rgba(255,92,92,0.35)",
        borderLeft:"3px solid rgba(255,92,92,0.7)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            fontWeight:700, color:T.coral, letterSpacing:1.5,
            textTransform:"uppercase" }}>ACEP October 2023 — Level B Update</span>
        </div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5,
          color:T.txt2, lineHeight:1.65 }}>
          <strong style={{ color:T.coral }}>Droperidol 5 mg + midazolam 5 mg IM</strong> is now
          the preferred first-line regimen for undifferentiated ED agitation —
          faster onset, fewer repeat doses, better clinician safety than haloperidol + lorazepam
          (DOMINO trial; DORM II).
        </div>
      </div>

      {/* Escalation stages */}
      <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
        {[
          { id:"initial",     label:"Verbal De-escalation",  color:T.teal   },
          { id:"mild",        label:"Mild Agitation",        color:T.gold   },
          { id:"moderate",    label:"Moderate Agitation",    color:T.orange },
          { id:"severe",      label:"Severe / Violent",      color:T.coral  },
        ].map(s => (
          <button key={s.id} onClick={() => setStage(s.id)}
            style={{ flex:1, padding:"8px 10px", borderRadius:9, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
              transition:"all .12s",
              border:`1px solid ${stage===s.id ? s.color+"66" : s.color+"22"}`,
              background:stage===s.id ? `${s.color}14` : "transparent",
              color:stage===s.id ? s.color : T.txt4 }}>
            {s.label}
          </button>
        ))}
      </div>

      {stage === "initial" && (
        <Card color={T.teal} title="Verbal De-escalation — Always First">
          {[
            "Speak calmly, at eye level — avoid sudden movements",
            "Offer food, water, blanket — meet basic needs first",
            "Remove stimulation: dim lights, reduce noise, limit staff in room",
            "Name, validate, empathize: 'I can see you are scared. I want to help.'",
            "Offer choices, not ultimatums — restores perceived control",
            "Do NOT argue, challenge delusions, or threaten restraint",
            "Set clear limits on behaviors (not emotions): 'Hitting staff is not okay, but we can talk.'",
            "Have security present but not visible if possible",
          ].map((b, i) => <Bullet key={i} text={b} color={T.teal} />)}
          <div style={{ marginTop:8, padding:"7px 10px", borderRadius:7,
            background:"rgba(245,200,66,0.08)",
            border:"1px solid rgba(245,200,66,0.25)" }}>
            <Bullet text="Excited delirium / hyperadrenergic state: do NOT attempt prolonged verbal de-escalation — proceed to chemical sedation. These patients can arrest suddenly." color={T.gold} />
          </div>
        </Card>
      )}

      {stage === "mild" && (
        <Card color={T.gold} title="Mild Agitation — Oral First">
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10.5,
            color:T.txt3, marginBottom:10 }}>
            Cooperative, redirectable, no immediate safety threat.
            Oral preferred over IM when safe.
          </div>
          {[
            { drug:"Lorazepam", dose:"1–2 mg PO/SL", note:"Benzodiazepine — anxiety/withdrawal-driven agitation" },
            { drug:"Olanzapine (Zyprexa)", dose:"5–10 mg PO (wafer preferred)", note:"Atypical antipsychotic — psychosis-driven agitation. Avoid IM if oral accepted." },
            { drug:"Quetiapine (Seroquel)", dose:"25–100 mg PO", note:"Lower EPS risk — useful in elderly or dementia. Slower onset." },
            { drug:"Haloperidol", dose:"2.5–5 mg PO", note:"Classic — effective, high EPS risk. Avoid in Parkinson's or Lewy body dementia." },
          ].map((d, i) => (
            <div key={i} style={{ padding:"8px 10px", borderRadius:8, marginBottom:6,
              background:"rgba(245,200,66,0.06)",
              border:"1px solid rgba(245,200,66,0.22)" }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
                fontSize:12, color:T.gold, marginBottom:2 }}>{d.drug} — {d.dose}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:10.5, color:T.txt4 }}>{d.note}</div>
            </div>
          ))}
        </Card>
      )}

      {stage === "moderate" && (
        <Card color={T.orange} title="Moderate Agitation — IM Protocol">
          <div style={{ padding:"10px 13px", borderRadius:9, marginBottom:10,
            background:"rgba(176,109,255,0.1)",
            border:"1px solid rgba(176,109,255,0.45)",
            borderLeft:"3px solid rgba(176,109,255,0.7)" }}>
            <div style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:15, color:T.purple, marginBottom:6 }}>
              First-Line — ACEP 2023 Level B
            </div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:13, fontWeight:700, color:T.rose, marginBottom:6 }}>
              Droperidol 5 mg IM + Midazolam 5 mg IM
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:11, color:T.txt2, lineHeight:1.6, marginBottom:6 }}>
              Simultaneous IM injections, different sites.
              Median sedation onset 7 min. Fewer repeat doses than alternatives.
            </div>
            {[
              "Droperidol: QTc monitoring recommended — baseline EKG if feasible. Contraindicated if QTc > 500 ms.",
              "Midazolam: respiratory monitoring required. BVM at bedside. Resuscitation-capable RN present.",
              "Evidence: DOMINO trial (Isbister 2023) — droperidol + midazolam vs haloperidol + lorazepam vs midazolam alone. Combination arm: fastest sedation, fewest repeat doses.",
              "Avoid prone + restraint positioning simultaneously — asphyxia risk.",
            ].map((b, i) => <Bullet key={i} text={b} color={T.purple} />)}
          </div>

          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
            marginBottom:6 }}>Dose adjustments</div>
          {[
            { context:"Elderly (> 65) or medically frail", dose:"Droperidol 2.5 mg + midazolam 2 mg IM" },
            { context:"Already partially sedated",          dose:"Droperidol 5 mg IM alone (omit midazolam)" },
            { context:"Stimulant intoxication (cocaine, meth)", dose:"Midazolam 5 mg IM alone — avoid droperidol (QTc concern)" },
            { context:"Alcohol intoxication alone",         dose:"Midazolam 2–5 mg IM — benzodiazepine preferred" },
            { context:"Pregnant",                           dose:"Haloperidol 5 mg IM (Category C, limited data) — avoid droperidol" },
          ].map((d, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8,
              padding:"6px 0", borderBottom:"1px solid rgba(80,40,120,0.2)" }}>
              <div style={{ flex:1, fontFamily:"'DM Sans',sans-serif",
                fontSize:11, color:T.txt3 }}>{d.context}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:10, fontWeight:700, color:T.orange, flexShrink:0 }}>
                {d.dose}
              </div>
            </div>
          ))}
        </Card>
      )}

      {stage === "severe" && (
        <Card color={T.coral} title="Severe / Violent — Immediate Chemical Restraint">
          <div style={{ padding:"9px 12px", borderRadius:8, marginBottom:10,
            background:"rgba(255,61,61,0.08)",
            border:"1px solid rgba(255,61,61,0.35)" }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700,
              fontSize:12, color:T.red, marginBottom:4 }}>
              Immediate risk to patient or staff — pharmacologic restraint required
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:11, color:T.txt3 }}>
              Proceed to chemical sedation without prolonged verbal de-escalation.
              Safety of staff and patient is the priority.
            </div>
          </div>
          {[
            { label:"First-Line (ACEP 2023 Level B)",
              content:"Droperidol 10 mg IM + midazolam 5 mg IM — higher droperidol dose for severe agitation. Monitor QTc. Airway backup.", color:T.purple },
            { label:"If tracheal intubation required",
              content:"Ketamine 4–5 mg/kg IM for chemical sedation before RSI. Fastest dissociative onset without IV access.", color:T.orange },
            { label:"Second-Line (if droperidol unavailable)",
              content:"Haloperidol 10 mg IM + lorazepam 2 mg IM. Slower onset. Higher EPS risk. ACEP Level C.", color:T.gold },
            { label:"Post-sedation monitoring",
              content:"Continuous SpO2, cardiac monitor, RASS q15 min. QTc on 12-lead EKG. Avoid prone positioning. Log all medications + timing.", color:T.teal },
          ].map((s, i) => (
            <div key={i} style={{ padding:"9px 11px", borderRadius:9, marginBottom:7,
              background:`${s.color}08`, border:`1px solid ${s.color}28`,
              borderLeft:`3px solid ${s.color}` }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:s.color, letterSpacing:1.3, textTransform:"uppercase",
                marginBottom:4 }}>{s.label}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:11, color:T.txt2, lineHeight:1.6 }}>{s.content}</div>
            </div>
          ))}
        </Card>
      )}

      {/* Second-line reference */}
      <Card color={T.txt4} title="Second-Line Regimens (ACEP Level C)">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
          {[
            { drug:"Haloperidol + lorazepam", dose:"5 mg + 2 mg IM", note:"Standard regimen prior to 2023 evidence. Still effective." },
            { drug:"Ketamine", dose:"4–5 mg/kg IM", note:"Rapid dissociation. Useful when IV/IO unavailable. Risk: laryngospasm, emergence." },
            { drug:"Ziprasidone", dose:"20 mg IM", note:"Atypical. QTc prolongation risk — avoid with QTc > 450 ms." },
            { drug:"Droperidol alone", dose:"5 mg IM", note:"Without midazolam. Slower than combination (DORM II)." },
          ].map((d, i) => (
            <div key={i} style={{ padding:"8px 10px", borderRadius:8,
              background:"rgba(24,10,26,0.6)",
              border:"1px solid rgba(80,40,120,0.3)" }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                fontSize:11, color:T.txt3, marginBottom:2 }}>{d.drug}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:10, fontWeight:700, color:T.lavender,
                marginBottom:2 }}>{d.dose}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:9.5, color:T.txt4 }}>{d.note}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 2 — SI / HI RISK
// ═══════════════════════════════════════════════════════════════════════════
const SI_HIGH_RISK = [
  { label:"Specific plan with means available", color:T.red,    urgent:true  },
  { label:"Intent to act — expressed or inferred", color:T.red, urgent:true  },
  { label:"Access to means (weapon, medication stockpile)", color:T.coral, urgent:true },
  { label:"Recent serious attempt (< 3 months)",     color:T.coral, urgent:true  },
  { label:"Current intoxication + suicidal ideation", color:T.coral, urgent:true  },
  { label:"Male sex + age > 45",         color:T.orange, urgent:false },
  { label:"Hopelessness (BHS ≥ 9)",      color:T.orange, urgent:false },
  { label:"Social isolation, recent loss",color:T.gold,   urgent:false },
  { label:"Prior psychiatric hospitalization", color:T.gold, urgent:false },
  { label:"Chronic pain or terminal illness",  color:T.txt3, urgent:false },
];

function SIHITab() {
  const [siChecks, setSiChecks] = useState({});
  const [hiChecks, setHiChecks] = useState({});

  const highRisk = SI_HIGH_RISK.filter(c => c.urgent && siChecks[c.label]).length > 0;
  const modRisk  = !highRisk && SI_HIGH_RISK.filter(c => siChecks[c.label]).length > 0;
  const anySet   = Object.keys(siChecks).length > 0;

  return (
    <div className="p-in">
      {/* Interview framework */}
      <Card color={T.orange} title="Suicidal Ideation — C-SSRS Inspired Interview Framework">
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10.5,
          color:T.txt3, marginBottom:10, lineHeight:1.6 }}>
          Columbia Protocol — escalating question sequence. Stop when patient declines or
          when highest positive response establishes risk level.
        </div>
        {[
          { q:"1. Passive wish to be dead",     prompt:"Have you had thoughts that you would be better off dead or that you wish you could go to sleep and not wake up?",     level:"Ideation" },
          { q:"2. Active suicidal ideation",     prompt:"Have you had thoughts of killing yourself?",                                                                          level:"Ideation" },
          { q:"3. Intent without plan",          prompt:"Have you thought about how you might kill yourself?",                                                                 level:"Plan" },
          { q:"4. Plan with some intent",        prompt:"Do you have a plan? Have you thought about when/where/how?",                                                          level:"Plan" },
          { q:"5. Intent to act",                prompt:"Are you intending to act on these thoughts?",                                                                        level:"Intent" },
        ].map((item, i) => (
          <div key={i} style={{ padding:"8px 11px", borderRadius:8, marginBottom:6,
            background:"rgba(24,10,26,0.7)",
            border:"1px solid rgba(80,40,120,0.3)" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.orange, letterSpacing:1, marginBottom:3 }}>
              {item.q} — {item.level}
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:11, color:T.txt2, fontStyle:"italic" }}>
              "{item.prompt}"
            </div>
          </div>
        ))}
      </Card>

      {/* Risk factor checklist */}
      <Card color={T.coral} title="Risk Factor Assessment">
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.red, letterSpacing:1.3, marginBottom:5 }}>
          HIGH RISK — immediate action required
        </div>
        {SI_HIGH_RISK.filter(c => c.urgent).map(c => (
          <Check key={c.label} label={c.label}
            checked={!!siChecks[c.label]}
            onToggle={() => setSiChecks(p => ({ ...p, [c.label]:!p[c.label] }))}
            color={c.color} />
        ))}
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.gold, letterSpacing:1.3, margin:"8px 0 5px" }}>
          MODERATE RISK — factors increasing overall risk
        </div>
        {SI_HIGH_RISK.filter(c => !c.urgent).map(c => (
          <Check key={c.label} label={c.label}
            checked={!!siChecks[c.label]}
            onToggle={() => setSiChecks(p => ({ ...p, [c.label]:!p[c.label] }))}
            color={c.color} />
        ))}
        {anySet && (
          <div style={{ marginTop:8, padding:"10px 12px", borderRadius:9,
            background:highRisk ? "rgba(255,61,61,0.09)" : modRisk ? "rgba(255,159,67,0.08)" : "rgba(0,212,180,0.07)",
            border:`1px solid ${highRisk ? "rgba(255,61,61,0.4)" : modRisk ? "rgba(255,159,67,0.35)" : "rgba(0,212,180,0.3)"}` }}>
            <div style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:15,
              color:highRisk ? T.red : modRisk ? T.orange : T.teal }}>
              {highRisk ? "High Risk — Immediate Psychiatric Evaluation Required"
                : modRisk ? "Moderate Risk — Psychiatric Consultation"
                : "Lower Risk — Clinical Judgment + Safety Planning"}
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:11, color:T.txt3, marginTop:4, lineHeight:1.55 }}>
              {highRisk
                ? "1:1 sitter, remove means from environment (IV tubing, belts, sharps), psychiatric emergency evaluation, consider involuntary hold if patient refuses care."
                : modRisk
                ? "Psychiatric consultation. Document risk-benefit assessment. Safety planning. Avoid premature discharge."
                : "Safety plan, follow-up within 24–48h, means restriction counseling. Return precautions."}
            </div>
          </div>
        )}
      </Card>

      {/* HI section */}
      <Card color={T.red} title="Homicidal Ideation — Duty to Warn">
        {[
          "Assess: specific target identified? Plan? Access to means? History of violence?",
          "Tarasoff duty — if specific identifiable third party at risk, clinician has duty to warn (state law varies)",
          "Document threat assessment thoroughly. Involve social work and psychiatry.",
          "High-risk: specific plan + identified victim → law enforcement notification, inpatient psychiatric admission",
          "Means restriction: document weapons, provide removal guidance to family/caregivers",
        ].map((b, i) => <Bullet key={i} text={b} color={T.red} />)}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 3 — CIWA-Ar (Alcohol Withdrawal)
// ═══════════════════════════════════════════════════════════════════════════
const CIWA_ITEMS = [
  { key:"nausea",     label:"Nausea / Vomiting", max:7,
    levels:["None","Mild nausea, no vomiting","","Intermittent nausea with retching","","","","Constant nausea, frequent dry heaves and vomiting"] },
  { key:"tremor",     label:"Tremor", max:7,
    levels:["None","Barely visible","","Moderate with arms extended","","","","Severe even at rest"] },
  { key:"sweats",     label:"Paroxysmal Sweats", max:7,
    levels:["None","Barely perceptible","","Beads of sweat on forehead","","","","Drenching sweats"] },
  { key:"anxiety",    label:"Anxiety", max:7,
    levels:["None","Mildly anxious","","Moderately anxious","","","","Equivalent to acute panic"] },
  { key:"agitation",  label:"Agitation", max:7,
    levels:["Normal","Somewhat more than normal","","Moderately fidgety and restless","","","","Paces about, thrashes"] },
  { key:"tactile",    label:"Tactile Disturbances", max:7,
    levels:["None","Very mild itch/pins/needles","","Mild itch/pins/needles","Moderately severe","Severe","Very severe","Continuous hallucinations"] },
  { key:"auditory",   label:"Auditory Disturbances", max:7,
    levels:["None","Very mild harshness","","Mild harshness/frightening","Moderately severe","Severe","Very severe","Continuous hallucinations"] },
  { key:"visual",     label:"Visual Disturbances", max:7,
    levels:["None","Very mild sensitivity","","Mild sensitivity","Moderately severe","Severe","Very severe","Continuous hallucinations"] },
  { key:"headache",   label:"Headache / Fullness", max:7,
    levels:["None","Very mild","","Mild","Moderately severe","Severe","Very severe","Extremely severe"] },
  { key:"orientation",label:"Orientation / Clouding", max:4,
    levels:["Fully oriented","Can't serial additions or date","Uncertain about date (within 2 days)","Disoriented about date (> 2 days)","Disoriented to place/person"] },
];

function CIWATab() {
  const [scores, setScores] = useState({});
  const total = CIWA_ITEMS.reduce((s, i) => s + (scores[i.key] || 0), 0);
  const anySet = Object.keys(scores).length > 0;

  const strata = total < 10
    ? { label:"Mild Withdrawal",    color:T.teal,   tx:"Oral thiamine + CIWA monitoring q1–4h. Benzodiazepines PRN for symptoms ≥ 8–10 on repeated assessments." }
    : total < 15
    ? { label:"Moderate Withdrawal", color:T.gold,   tx:"IV access. Thiamine 100 mg IV. Lorazepam 2 mg IV q1h PRN (symptom-triggered). Monitor q1h." }
    : { label:"Severe Withdrawal",   color:T.coral,  tx:"ICU-level monitoring. Lorazepam 2–4 mg IV q15–30 min until sedated. Consider phenobarbital. Airway assessment." };

  return (
    <div className="p-in">
      <Card color={T.gold} title="CIWA-Ar Score — Alcohol Withdrawal Assessment">
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between", marginBottom:10 }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
            color:T.txt4, lineHeight:1.5, maxWidth:300 }}>
            Sullivan 1989. Score each item 0 to maximum. Total range 0–67.
            Assess q1h until stable, then q4h.
          </div>
          <div style={{ fontFamily:"'Playfair Display',serif",
            fontSize:52, fontWeight:900,
            color:anySet ? strata.color : T.txt4, lineHeight:1 }}>
            {total}
          </div>
        </div>

        {CIWA_ITEMS.map(item => (
          <div key={item.key} style={{ marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center",
              justifyContent:"space-between", marginBottom:5 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.gold, letterSpacing:1.3,
                textTransform:"uppercase" }}>{item.label}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:11, fontWeight:700,
                color:scores[item.key] > 0 ? T.gold : T.txt4 }}>
                {scores[item.key] || 0} / {item.max}
              </div>
            </div>
            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
              {item.levels.map((level, score) => (
                level !== "" && (
                  <button key={score}
                    onClick={() => setScores(p => ({ ...p, [item.key]:score }))}
                    title={level}
                    style={{ padding:"4px 10px", borderRadius:7,
                      cursor:"pointer", fontSize:10, fontWeight:600,
                      transition:"all .1s",
                      fontFamily:"'JetBrains Mono',monospace",
                      border:`1px solid ${scores[item.key]===score ? T.gold+"66" : "rgba(80,40,120,0.35)"}`,
                      background:scores[item.key]===score ? "rgba(245,200,66,0.15)" : "transparent",
                      color:scores[item.key]===score ? T.gold : T.txt4 }}>
                    {score}
                  </button>
                )
              ))}
            </div>
            {scores[item.key] > 0 && (
              <div style={{ fontFamily:"'DM Sans',sans-serif",
                fontSize:9, color:T.txt4, marginTop:2, fontStyle:"italic" }}>
                {item.levels[scores[item.key]]}
              </div>
            )}
          </div>
        ))}

        {anySet && (
          <div style={{ padding:"10px 13px", borderRadius:9,
            background:`${strata.color}09`, border:`1px solid ${strata.color}35` }}>
            <div style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:16, color:strata.color, marginBottom:4 }}>
              {strata.label} (Score {total})
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:11.5, color:T.txt2, lineHeight:1.6 }}>{strata.tx}</div>
          </div>
        )}
      </Card>

      <Card color={T.orange} title="Alcohol Withdrawal — Additional Management">
        {[
          "Thiamine 100 mg IV BEFORE glucose — in ALL patients with ETOH or nutritional risk",
          "High-risk for severe withdrawal: prior DTs or seizures, daily heavy use, CIWA > 15 on presentation",
          "Phenobarbital: 10–15 mg/kg IV for benzodiazepine-resistant withdrawal — increasing evidence as first-line in some centers",
          "Dexmedetomidine: adjunct, not standalone — does not prevent seizures",
          "ETOH infusion: only in select cases (ICU, consultation-guided) — not standard ED practice",
          "Seizure prophylaxis: benzodiazepines are the evidence-based agent — phenytoin does NOT prevent alcohol withdrawal seizures",
          "Magnesium repletion: frequently deficient. Correct if Mg < 2 mEq/L.",
        ].map((b, i) => <Bullet key={i} text={b} color={T.orange} />)}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 4 — TOXIC SYNDROMES
// ═══════════════════════════════════════════════════════════════════════════
const SYNDROMES = [
  {
    id:"serotonin", label:"Serotonin Syndrome", icon:"⬆️", color:T.coral,
    alert:"Hunter Criteria: clonus is the key finding — inducible clonus = serotonin syndrome until proven otherwise",
    criteria:["Clonus (inducible, spontaneous, or ocular) — KEY feature","Agitation + diaphoresis + tremor","Hyperreflexia","Hyperthermia (temp > 38°C in severe cases)","Common causes: SSRI + tramadol, SSRI + linezolid, SSRI + fentanyl (high dose)"],
    tx:["Discontinue ALL serotonergic agents immediately","Cyproheptadine 12 mg PO × 1, then 2 mg q2h (max 32 mg/day) — serotonin antagonist","Benzodiazepines for agitation/seizures","Cooling for hyperthermia — aggressive if > 41°C","Severe: paralysis + intubation if temp > 41°C or refractory seizures"],
    pearl:"NMS vs serotonin syndrome: NMS is SLOW onset (days), bradyreflexia, lead-pipe rigidity. Serotonin syndrome is RAPID onset (hours), hyperreflexia, clonus.",
  },
  {
    id:"nms", label:"Neuroleptic Malignant Syndrome", icon:"🔥", color:T.orange,
    alert:"NMS is potentially fatal — stop antipsychotic, aggressive supportive care, ICU admission",
    criteria:["Recent antipsychotic exposure (hours to days — can be weeks with depot)","Hyperthermia (> 38°C)","Muscle rigidity (lead-pipe — not clonus)","Autonomic instability: diaphoresis, tachycardia, labile BP","Altered mental status, encephalopathy","Elevated CK (often > 1000 IU/L)"],
    tx:["Discontinue antipsychotic IMMEDIATELY","Dantrolene 1–3 mg/kg IV (skeletal muscle relaxant) — primary agent for severe NMS","Bromocriptine 2.5–5 mg PO/NG TID (dopamine agonist) — adjunct","Benzodiazepines for agitation and rigidity","Aggressive cooling, IV fluids, ICU monitoring","Avoid other antipsychotics and dopamine antagonists (metoclopramide, prochlorperazine)"],
    pearl:"CK > 10,000 IU/L = rhabdomyolysis — aggressive hydration, urine output > 200 mL/hr target. Renal failure risk.",
  },
  {
    id:"anticholinergic", label:"Anticholinergic Toxidrome", icon:"🌡️", color:T.gold,
    alert:"Hot as a hare, dry as a bone, blind as a bat, mad as a hatter, red as a beet, full as a flask",
    criteria:["Hyperthermia","Dry skin and mucous membranes (no sweating)","Mydriasis (dilated pupils)","Tachycardia","Urinary retention, ileus","Agitated delirium, hallucinations (visual)"],
    tx:["Benzodiazepines for agitation","Physostigmine 1–2 mg IV slowly — ONLY for pure anticholinergic (not mixed TCA/antihistamine)","Cooling for hyperthermia","Foley catheter for urinary retention","Avoid physostigmine in TCA overdose — seizures and cardiac arrest"],
    pearl:"Physostigmine is definitive treatment for pure anticholinergic toxidrome. Contraindicated with TCA coingestant. Can resolve delirium, improve vital signs, reduce benzodiazepine requirements.",
  },
  {
    id:"sympathomimetic", label:"Sympathomimetic Toxidrome", icon:"⚡", color:T.purple,
    alert:"Excited delirium is a subset — sudden cardiac arrest risk, proceed to chemical sedation without delay",
    criteria:["Hypertension + tachycardia","Hyperthermia","Diaphoresis (sweating — differentiates from anticholinergic)","Mydriasis","Agitation, psychosis","Causes: cocaine, amphetamine, methamphetamine, bath salts, PCP"],
    tx:["Benzodiazepines FIRST — lorazepam 2–4 mg IV or midazolam 5 mg IM for agitation","Avoid beta-blockers (unopposed alpha vasoconstriction)","Cooling for hyperthermia — aggressive if > 40°C","Phentolamine for hypertensive emergency (alpha blocker)","Excited delirium: immediate chemical sedation — ketamine 4 mg/kg IM or droperidol + midazolam"],
    pearl:"Excited delirium: agitation + hyperthermia + tachycardia in stimulant intoxication — sudden cardiac arrest can occur. Do NOT prolonged restraint without chemical sedation.",
  },
];

function SyndromesTab() {
  const [active, setActive] = useState("serotonin");
  const syn = SYNDROMES.find(s => s.id === active);
  return (
    <div className="p-in">
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
        {SYNDROMES.map(s => (
          <button key={s.id} onClick={() => setActive(s.id)}
            style={{ display:"flex", alignItems:"center", gap:6, flex:1,
              padding:"8px 12px", borderRadius:9, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
              transition:"all .12s",
              border:`1px solid ${active===s.id ? s.color+"66" : s.color+"22"}`,
              background:active===s.id ? `${s.color}12` : "transparent",
              color:active===s.id ? s.color : T.txt4 }}>
            <span style={{ fontSize:14 }}>{s.icon}</span>{s.label}
          </button>
        ))}
      </div>
      {syn && (
        <div>
          <div style={{ padding:"9px 12px", borderRadius:8, marginBottom:10,
            background:`${syn.color}0a`, border:`1px solid ${syn.color}35` }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:syn.color, letterSpacing:1.5, textTransform:"uppercase",
              marginBottom:3 }}>⚡ Alert</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:12, fontWeight:600, color:syn.color }}>{syn.alert}</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:syn.color, letterSpacing:1.3, textTransform:"uppercase",
                marginBottom:6 }}>Diagnostic Features</div>
              {syn.criteria.map((c, i) => <Bullet key={i} text={c} color={syn.color} />)}
            </div>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.teal, letterSpacing:1.3, textTransform:"uppercase",
                marginBottom:6 }}>Management</div>
              {syn.tx.map((t, i) => <Bullet key={i} text={t} color={T.teal} />)}
            </div>
          </div>
          <div style={{ marginTop:10, padding:"9px 12px", borderRadius:9,
            background:`${syn.color}09`, border:`1px solid ${syn.color}30` }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:syn.color, letterSpacing:1.3,
              textTransform:"uppercase" }}>💎 Pearl: </span>
            <span style={{ fontFamily:"'DM Sans',sans-serif",
              fontSize:11.5, color:T.txt2, lineHeight:1.65 }}>{syn.pearl}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════
export default function PsychHub({ embedded = false }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("agitation");
  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",
      background:embedded ? "transparent" : T.bg,
      minHeight:embedded ? "auto" : "100vh", color:T.txt }}>
      <div style={{ maxWidth:900, margin:"0 auto",
        padding:embedded ? "0" : "0 16px" }}>
        {!embedded && (
          <div style={{ padding:"18px 0 14px" }}>
            <button onClick={() => navigate("/hub")}
              style={{ marginBottom:10, display:"inline-flex",
                alignItems:"center", gap:7, fontFamily:"'DM Sans',sans-serif",
                fontSize:12, fontWeight:600, padding:"5px 14px", borderRadius:8,
                background:"rgba(13,5,15,0.8)",
                border:"1px solid rgba(80,40,120,0.5)",
                color:T.txt3, cursor:"pointer" }}>← Back to Hub</button>
            <h1 className="shimmer-p"
              style={{ fontFamily:"'Playfair Display',serif",
                fontSize:"clamp(22px,4vw,38px)",
                fontWeight:900, letterSpacing:-0.5, lineHeight:1.1 }}>
              Psychiatric Emergency Hub
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:T.txt4, marginTop:4 }}>
              Agitation (ACEP 2023 Droperidol Level B) · SI/HI Risk · CIWA-Ar
              · Serotonin Syndrome · NMS · Anticholinergic · Sympathomimetic
            </p>
          </div>
        )}
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", padding:"6px",
          marginBottom:14, background:"rgba(24,10,26,0.85)",
          border:"1px solid rgba(80,40,120,0.4)", borderRadius:12 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display:"flex", alignItems:"center", gap:6,
                padding:"8px 13px", borderRadius:9, cursor:"pointer", flex:1,
                justifyContent:"center", fontFamily:"'DM Sans',sans-serif",
                fontWeight:600, fontSize:12, transition:"all .15s",
                border:`1px solid ${tab===t.id ? t.color+"77" : "rgba(80,40,120,0.5)"}`,
                background:tab===t.id ? `${t.color}14` : "transparent",
                color:tab===t.id ? t.color : T.txt4 }}>
              <span style={{ fontSize:13 }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
        {tab === "agitation" && <AgitationTab />}
        {tab === "sihi"      && <SIHITab />}
        {tab === "ciwa"      && <CIWATab />}
        {tab === "syndromes" && <SyndromesTab />}
        {!embedded && (
          <div style={{ textAlign:"center", padding:"24px 0 16px",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA PSYCH HUB · ACEP OCTOBER 2023 LEVEL B · DOMINO TRIAL (ISBISTER 2023)
            · C-SSRS · CIWA-AR (SULLIVAN 1989) · CLINICAL DECISION SUPPORT ONLY
          </div>
        )}
      </div>
    </div>
  );
}