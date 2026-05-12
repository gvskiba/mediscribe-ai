import { useState } from "react";
import { useNavigate } from "react-router-dom";

(() => {
  if (typeof document === "undefined") return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap";
  document.head.appendChild(l);
})();

const T = {
  bg: "#0a1628", glass: "rgba(255,255,255,0.04)", glassMid: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.08)", teal: "#14b8a6", gold: "#f59e0b", coral: "#f43f5e",
  green: "#22c55e", blue: "#3b82f6", purple: "#a78bfa", amber: "#fb923c",
  white: "#f0f4f8", muted: "rgba(240,244,248,0.55)", dim: "rgba(240,244,248,0.28)",
  sans: "'DM Sans', sans-serif", serif: "'Playfair Display', serif", mono: "'JetBrains Mono', monospace",
};
const G    = (x = {}) => ({ background: T.glass, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: `1px solid ${T.border}`, borderRadius: 14, ...x });
const pill = (bg)     => ({ display: "inline-block", background: bg, borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginRight: 6, marginBottom: 10 });
const tag  = (c)      => ({ display: "inline-block", background: c + "22", border: `1px solid ${c}44`, borderRadius: 5, padding: "2px 8px", fontSize: 10.5, fontWeight: 600, color: c });
const card = (x = {}) => ({ ...G(), padding: "14px 16px", ...x });
const aBox = (c, mb = 10) => ({ background: c + "14", border: `1px solid ${c}40`, borderRadius: 10, padding: "10px 14px", marginBottom: mb });
const sL   = (c = T.teal) => ({ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: c, margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 8 });
const dv   = { height: 1, background: T.border, margin: "10px 0" };

const CAUSES = [
  { cause: "Malignancy", pct: "~50%",  color: T.coral,  detail: "Lung · breast · lymphoma · leukemia · melanoma · most common cause of large effusion · often bloody · tamponade may be first presentation", tx: "Pericardiocentesis + cytology · oncology consult · possible sclerotherapy or pericardial window for recurrence" },
  { cause: "Idiopathic / Viral Pericarditis", pct: "~15–20%", color: T.blue, detail: "Most common cause overall including small effusions · Coxsackievirus · echovirus · usually self-limited", tx: "NSAIDs + colchicine · steroids for refractory · pericardiocentesis if large + hemodynamic compromise" },
  { cause: "Post-cardiac procedure", pct: "~10%",  color: T.amber, detail: "Cardiac surgery · PCI · ablation · device implantation · pacemaker/ICD leads · diagnosis often delayed 24–72h", tx: "Emergent pericardiocentesis · cardiac surgery if hematoma / clot" },
  { cause: "Aortic Dissection (Type A)", pct: "~5%", color: T.coral, detail: "Retrograde dissection → hemopericardium · DO NOT drain → decompression may worsen dissection by releasing tamponade on aortic tear", tx: "IMMEDIATE cardiac surgery — pericardiocentesis is CONTRAINDICATED (removes tamponading pressure on aortic tear)" },
  { cause: "Uremic Pericarditis", pct: "~5%",  color: T.gold,  detail: "CKD/ESRD · fibrinous exudate · bloody effusion · large volume · usually responds to dialysis", tx: "Urgent dialysis (intensive) · pericardiocentesis if hemodynamically compromised + not responding to dialysis" },
  { cause: "Trauma / Hemopericardium", pct: "~5%", color: T.amber, detail: "Penetrating trauma · blunt cardiac injury · iatrogenic (post-procedure) · rapidly accumulating blood → rapid tamponade despite small volume", tx: "Emergent surgical drainage · pericardiocentesis as temporizing bridge for penetrating trauma" },
  { cause: "Hypothyroidism", pct: "Rare", color: T.purple, detail: "Slowly accumulating effusion · often asymptomatic until large · low-density fluid on echo · check TSH in unexplained large effusion", tx: "Thyroid replacement · effusion resolves slowly · pericardiocentesis if hemodynamic compromise" },
  { cause: "Bacterial / Purulent", pct: "Rare", color: T.teal,  detail: "Post-sternotomy infection · immunocompromised · septicemia · high mortality without drainage · fibrinous/loculated", tx: "Emergent pericardiocentesis + irrigation + surgical drainage · IV antibiotics · pericardial window" },
];

export default function CardiacTamponadeHub({ onBack }) {
  const navigate = useNavigate();
  const handleBack = () => onBack ? onBack() : navigate("/CriticalProtocolsPage");

  const [tab, setTab]     = useState(0);
  const [cause, setCause] = useState(null);
  const [pocusView, setPocusView] = useState("Subcostal");
  const [step, setStep]   = useState(null);
  const TABS = ["Recognition", "POCUS Diagnosis", "Pericardiocentesis", "Monitoring"];

  const selCause = CAUSES.find(c => c.cause === cause);

  const POCUS_VIEWS = {
    Subcostal: {
      color: T.teal,
      findings: ["Pericardial effusion (echo-free space around heart)", "RV collapse during diastole (most sensitive sign)", "RA collapse during systole (early sign)", "Exaggerated cardiac motion ('swinging heart')", "Plethoric IVC (&gt; 2.1 cm, &lt; 50% collapse)"],
      how: "Place probe in subxiphoid position with indicator toward patient's left · aim toward left shoulder · liver as acoustic window",
      pearl: "Start here in emergency — fastest view to rule in tamponade. RV diastolic collapse is the most sensitive echo sign.",
    },
    "Parasternal Long": {
      color: T.blue,
      findings: ["Posterior effusion (behind LV)", "RA or RV wall motion abnormalities", "Effusion size estimation: small &lt; 1cm · moderate 1–2cm · large &gt; 2cm", "Fibrinous strands or septations (exudative vs transudative)"],
      how: "Left sternal border 3rd–4th intercostal space · indicator toward right shoulder",
      pearl: "Best view for effusion size quantification. Posterior effusions in PLAX = most common location to see fluid first.",
    },
    "Apical 4-Chamber": {
      color: T.purple,
      findings: ["RA / LA collapse during systole", "Exaggerated interventricular septal movement with respiration (Doppler correlate of pulsus paradoxus)", "Mitral E-wave variation &gt; 25% with respiration (tamponade physiology)", "Tricuspid E-wave variation &gt; 40% with respiration"],
      how: "Patient left lateral decubitus · apex of LV · indicator toward right shoulder",
      pearl: "Use Doppler here to demonstrate respiratory variation in mitral/tricuspid flow — confirms tamponade physiology before clinical decompensation.",
    },
    "IVC / Subcostal": {
      color: T.gold,
      findings: ["IVC &gt; 2.1 cm = elevated CVP", "IVC collapse &lt; 50% with sniff = plethoric IVC", "Confirms elevated right-sided pressures", "Collapsing IVC = low CVP (not tamponade unless effusion confirmed)"],
      how: "Rotate probe from cardiac subcostal view to image IVC entering right atrium",
      pearl: "Plethoric IVC (large, non-collapsing) in the context of effusion and hemodynamic compromise = tamponade until proven otherwise.",
    },
  };

  const selView = POCUS_VIEWS[pocusView];

  // ── TAB 0: RECOGNITION ──────────────────────────────────────────────────
  const T0 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Tamponade is a Clinical + Hemodynamic Diagnosis — Do NOT Wait for Echo</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Cardiac tamponade = pericardial effusion compressing cardiac chambers → obstructive shock. Rate of accumulation matters MORE than volume — 150 mL rapid accumulation causes tamponade; 2L slowly accumulated may not.</div>
      </div>

      <div style={sL()}>Beck's Triad — Classic (Rare to See All Three)</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
        {[
          { sign: "Hypotension", detail: "Reduced cardiac output from restricted filling · narrow pulse pressure", color: T.coral },
          { sign: "Elevated JVP", detail: "Venous congestion as blood backs up · JVD · Kussmaul's sign", color: T.amber },
          { sign: "Muffled Heart Sounds", detail: "Fluid surrounding heart attenuates sounds · difficult to auscultate", color: T.gold },
        ].map(({ sign, detail, color }) => (
          <div key={sign} style={card({ padding: "12px", textAlign: "center", borderLeft: `3px solid ${color}` })}>
            <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 4 }}>{sign}</div>
            <div style={{ fontSize: 10.5, color: T.muted }}>{detail}</div>
          </div>
        ))}
      </div>

      <div style={sL(T.gold)}>Full Clinical Presentation</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        <div style={card({ padding: "12px 13px", borderLeft: `3px solid ${T.amber}` })}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.amber, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>Symptoms</div>
          {["Dyspnea · orthopnea", "Chest pressure or fullness", "Anxiety · restlessness", "Syncope or near-syncope", "Fatigue · weakness", "Palpitations"].map((s, i) => (
            <div key={i} style={{ fontSize: 11, color: T.muted, marginBottom: 3, display: "flex", gap: 5 }}><span style={{ color: T.amber }}>●</span>{s}</div>
          ))}
        </div>
        <div style={card({ padding: "12px 13px", borderLeft: `3px solid ${T.coral}` })}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.coral, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>Signs</div>
          {["Tachycardia (almost universal)", "Hypotension / narrow pulse pressure", "JVD / elevated JVP", "Pulsus paradoxus &gt; 10 mmHg", "Ewart's sign (dullness at left base)", "Kussmaul's sign (JVP rises with inspiration)"].map((s, i) => (
            <div key={i} style={{ fontSize: 11, color: T.muted, marginBottom: 3, display: "flex", gap: 5 }}><span style={{ color: T.coral }}>●</span>{s}</div>
          ))}
        </div>
      </div>

      <div style={sL(T.purple)}>Pulsus Paradoxus — Measuring it at the Bedside</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5, marginBottom: 8 }}>
          Normal: SBP drops 0–10 mmHg during inspiration. In tamponade: exaggerated drop &gt; 10 mmHg due to ventricular interdependence.
        </div>
        {[
          { n: 1, step: "Inflate BP cuff above systolic pressure" },
          { n: 2, step: "Slowly deflate until Korotkoff sounds heard only during expiration — note this pressure" },
          { n: 3, step: "Continue deflating until sounds heard throughout respiratory cycle — note this pressure" },
          { n: 4, step: "Difference between the two pressures = pulsus paradoxus" },
          { n: 5, step: "&gt; 10 mmHg = significant pulsus paradoxus · &gt; 20 mmHg = severe tamponade physiology" },
        ].map(({ n, step }) => (
          <div key={n} style={{ display: "flex", gap: 10, marginBottom: 5 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: T.purple + "22", border: `1px solid ${T.purple}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: T.purple, flexShrink: 0 }}>{n}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{step}</div>
          </div>
        ))}
        <div style={{ ...aBox(T.gold, 0), marginTop: 8 }}>
          <div style={{ fontSize: 11.5, color: T.muted }}>Pulsus may be absent in: severe AR (aortic regurgitation) · ASD · pulmonary hypertension · LV dysfunction · positive pressure ventilation (paradox reversed)</div>
        </div>
      </div>

      <div style={sL(T.teal)}>ECG Findings</div>
      {[
        { finding: "Electrical alternans", detail: "Alternating QRS axis/amplitude with each beat — 'swinging heart' · pathognomonic for large effusion · 20% sensitivity but 100% specific for tamponade", color: T.teal },
        { finding: "Sinus tachycardia",    detail: "Almost universal — compensatory mechanism", color: T.gold },
        { finding: "Low voltage QRS",      detail: "&lt; 5 mm in limb leads · &lt; 10 mm precordial leads · fluid attenuates electrical signal", color: T.amber },
        { finding: "PR depression",         detail: "Diffuse PR depression + saddle-shaped ST elevation = concurrent pericarditis", color: T.blue },
      ].map(({ finding, detail, color }) => (
        <div key={finding} style={{ ...G(), padding: "9px 12px", marginBottom: 6, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{finding}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{detail}</div>
        </div>
      ))}

      <div style={sL(T.amber)}>Causes — tap to expand</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {CAUSES.map(c => (
          <button key={c.cause} onClick={() => setCause(cause === c.cause ? null : c.cause)}
            style={{ padding: "5px 11px", borderRadius: 8, border: `1.5px solid ${cause === c.cause ? c.color : T.border}`, background: cause === c.cause ? c.color + "20" : T.glass, color: cause === c.cause ? c.color : T.muted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, transition: "all 0.15s" }}>
            {c.cause}
          </button>
        ))}
      </div>
      {selCause && (
        <div style={{ ...card({ border: `1.5px solid ${selCause.color}55`, marginBottom: 14 }) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: selCause.color }}>{selCause.cause}</span>
            <span style={{ fontSize: 10, color: T.dim }}>{selCause.pct}</span>
          </div>
          <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 8 }}>{selCause.detail}</div>
          <div style={aBox(selCause.color, 0)}>
            <div style={{ fontSize: 11, fontWeight: 700, color: selCause.color, marginBottom: 2 }}>Treatment</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{selCause.tx}</div>
          </div>
        </div>
      )}
    </div>
  );

  // ── TAB 1: POCUS DIAGNOSIS ───────────────────────────────────────────
  const T1 = (
    <div>
      <div style={aBox(T.teal, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, marginBottom: 2 }}>POCUS is the Diagnostic Tool of Choice</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Bedside echo diagnoses tamponade in minutes. Start with subcostal view. Sensitivity 95–100% for hemodynamically significant effusions in experienced hands.</div>
      </div>

      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
        {Object.keys(POCUS_VIEWS).map(v => (
          <button key={v} onClick={() => setPocusView(v)}
            style={{ padding: "7px 13px", borderRadius: 9, border: `1.5px solid ${pocusView === v ? POCUS_VIEWS[v].color : T.border}`, background: pocusView === v ? POCUS_VIEWS[v].color + "20" : T.glass, color: pocusView === v ? POCUS_VIEWS[v].color : T.muted, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, transition: "all 0.15s" }}>
            {v}
          </button>
        ))}
      </div>

      {selView && (
        <div style={{ ...card({ border: `1.5px solid ${selView.color}55`, marginBottom: 14 }) }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: selView.color, marginBottom: 10 }}>{pocusView} View</div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>How to Obtain</div>
          <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 10 }}>{selView.how}</div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: selView.color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Key Findings</div>
          {selView.findings.map((f, i) => (
            <div key={i} style={{ fontSize: 11.5, color: T.muted, display: "flex", gap: 7, marginBottom: 4 }}>
              <span style={{ color: selView.color, flexShrink: 0 }}>●</span>{f}
            </div>
          ))}
          <div style={{ ...aBox(T.gold, 0), marginTop: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, marginBottom: 2 }}>⚡ Pearl</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{selView.pearl}</div>
          </div>
        </div>
      )}

      <div style={sL()}>Echo Signs — Hierarchy of Sensitivity</div>
      {[
        { sign: "RA systolic collapse",                   sens: "High",   spec: "Moderate", detail: "Earliest sign · RA free wall inverts during systole · seen before hemodynamic compromise", color: T.gold },
        { sign: "RV diastolic collapse",                  sens: "Highest", spec: "High",    detail: "Most sensitive for tamponade · RV free wall indents during diastole · cardiac output begins to fall · see best in subcostal or parasternal short", color: T.coral },
        { sign: "Mitral E-wave respiratory variation &gt; 25%", sens: "High", spec: "High",   detail: "Doppler finding = tamponade physiology even before clinical signs · use 4-chamber view · confirms ventricular interdependence", color: T.purple },
        { sign: "Plethoric IVC (&gt; 2.1 cm, &lt; 50% collapse)", sens: "High", spec: "Moderate", detail: "Reflects elevated right heart pressures · combined with effusion + RV collapse = strong tamponade evidence · may be absent in hypovolemia-related (post-trauma)", color: T.blue },
        { sign: "Electrical alternans on ECG",            sens: "Low",    spec: "High",    detail: "Pathognomonic but only 20% sensitive · large effusions only · swinging heart motion", color: T.teal },
      ].map(({ sign, sens, spec, detail, color }) => (
        <div key={sign} style={{ ...card({ marginBottom: 8, borderLeft: `3px solid ${color}` }) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color }}>{sign}</span>
            <div style={{ display: "flex", gap: 5 }}>
              <span style={{ ...tag(T.teal), fontSize: 9 }}>Sens: {sens}</span>
              <span style={{ ...tag(T.purple), fontSize: 9 }}>Spec: {spec}</span>
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{detail}</div>
        </div>
      ))}

      <div style={sL(T.coral)}>Effusion Size Classification</div>
      {[
        { size: "Trivial / Small",  depth: "&lt; 0.5 cm",  vol: "&lt; 100 mL",    significance: "Usually not hemodynamically significant · monitor", color: T.green },
        { size: "Moderate",         depth: "0.5–2 cm",  vol: "100–500 mL",  significance: "Hemodynamic significance depends on rate of accumulation and RV collapse signs", color: T.gold },
        { size: "Large",            depth: "2–4 cm",    vol: "500–1000 mL", significance: "High risk of tamponade · assess for RV collapse · pulsus paradoxus", color: T.amber },
        { size: "Very Large",       depth: "&gt; 4 cm",    vol: "&gt; 1000 mL",   significance: "Tamponade very likely if symptomatic · urgent drainage", color: T.coral },
      ].map(({ size, depth, vol, significance, color }) => (
        <div key={size} style={{ ...G({ borderRadius: 9 }), padding: "9px 12px", marginBottom: 6, borderLeft: `3px solid ${color}` }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 90 }}>{size}</span>
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.white }}>{depth} · {vol}</span>
          </div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{significance}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 2: PERICARDIOCENTESIS ────────────────────────────────────────
  const T2 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Pericardiocentesis — Lifesaving Procedure in Tamponade</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Even 50–100 mL of fluid removal can dramatically improve hemodynamics. Use echo guidance whenever available. Call cardiology/cardiothoracic surgery for complex cases.</div>
      </div>

      <div style={{ ...G({ borderRadius: 14, border: `2px solid ${T.coral}55`, background: "rgba(244,63,94,0.08)", marginBottom: 14 }), padding: "13px 14px" }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.coral, marginBottom: 8 }}>⚠ AORTIC DISSECTION — Do NOT Drain</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Pericardiocentesis in Type A aortic dissection removes the tamponading pressure on the aortic tear → catastrophic hemorrhage. The effusion is a safety valve. Take immediately to cardiac surgery.</div>
      </div>

      <div style={sL()}>Pericardiocentesis Technique — Step by Step</div>
      {[
        { n: 1, step: "Patient Preparation",       detail: "HOB 30–45° (heart closer to chest wall) · continuous ECG monitoring · SpO₂ · large-bore IV · atropine drawn up (vagal reaction) · echo guidance set up · confirm effusion location and optimal entry point", color: T.teal },
        { n: 2, step: "Subxiphoid Approach",       detail: "Entry point: 1 cm below xiphoid and 1 cm left of midline · direction: toward left shoulder at 30–45° from skin surface · alternative: parasternal (3rd–5th ICS, left sternal border) for anterior effusions", color: T.blue },
        { n: 3, step: "Echo-Guided Insertion",      detail: "Use bubble test or agitated saline flush into needle — bubbles seen in pericardial space (not cardiac chambers) confirm correct location · OR track needle tip toward effusion on echo", color: T.purple },
        { n: 4, step: "ECG Monitoring",             detail: "Connect alligator clip from ECG lead to needle hub · ST elevation or premature beats = needle touching myocardium → PULL BACK immediately · historical technique — echo guidance preferred", color: T.gold },
        { n: 5, step: "Fluid Aspiration",           detail: "Aspirate 50–100 mL → reassess hemodynamics immediately · continue aspiration · bloody fluid: check hematocrit (blood in pericardial space does not clot after several hours — if it clots, you may be in ventricle) · send for cytology, cultures, cell count, LDH, protein", color: T.amber },
        { n: 6, step: "Pericardial Drain Placement", detail: "Convert to Seldinger technique → pigtail catheter for ongoing drainage · leave drain for 24–48h if significant reaccumulation · connect to gravity drainage or gentle suction · remove when output &lt; 25 mL/day", color: T.coral },
      ].map(({ n, step, detail, color }) => (
        <div key={n} style={{ ...card({ marginBottom: 8 }), display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: color + "22", border: `1.5px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color, flexShrink: 0 }}>{n}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 3 }}>{step}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
          </div>
        </div>
      ))}

      <div style={sL(T.gold)}>Pericardial Fluid Analysis</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        {[
          { test: "Appearance",           dx: "Serous = transudative (HF · hypoalbuminemia) · Hemorrhagic = malignancy · trauma · post-procedure · Purulent = infectious · Sanguineous = trauma · dissection · Anticoagulated" },
          { test: "LDH / Protein",        dx: "Light's criteria (same as pleural) · Exudate: protein &gt; 3g/dL or LDH &gt; 200 IU/L or fluid/serum ratio &gt; 0.5" },
          { test: "Cell count + diff",    dx: "Lymphocytes predominant = malignancy · TB · viral · PMNs = bacterial" },
          { test: "Cytology",             dx: "Malignant cells · sensitivity 70–80% for malignant effusion · send ≥ 50 mL for best yield" },
          { test: "Culture + sensitivity", dx: "Bacterial · fungal · AFB · pericardial culture sensitivity varies · low yield for viral" },
          { test: "Hematocrit",           dx: "Bloody tap vs hemopericardium: pericardial blood does not clot after first 24h (defibrinated) · if clots rapidly → likely from ventricle" },
          { test: "ADA (Adenosine Deaminase)", dx: "&gt; 40 IU/L suggests TB pericarditis · in correct clinical context" },
        ].map(({ test, dx }, i) => (
          <div key={test} style={{ display: "flex", gap: 10, paddingBottom: 6, marginBottom: 6, borderBottom: i < 6 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.gold, minWidth: 150, flexShrink: 0 }}>{test}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{dx}</div>
          </div>
        ))}
      </div>

      <div style={sL(T.purple)}>Surgical Options</div>
      {[
        { opt: "Pericardial Window", detail: "Subxiphoid surgical approach · creates permanent opening · best for recurrent malignant effusions · prevents reaccumulation · can be done under local anesthesia · pleuropericardial window if pleural effusion coexists", color: T.purple },
        { opt: "Pericardiectomy",    detail: "Complete pericardial removal · constrictive pericarditis (post-radiation · TB · post-op) · rarely needed acutely · major surgery with significant morbidity · thoracotomy required", color: T.blue },
        { opt: "Sclerotherapy",      detail: "Instillation of sclerosing agent (tetracycline · bleomycin · cisplatin) after drainage · malignant effusions · prevents reaccumulation · less common than pericardial window", color: T.teal },
      ].map(({ opt, detail, color }) => (
        <div key={opt} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{opt}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{detail}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 3: MONITORING ────────────────────────────────────────────────
  const T3 = (
    <div>
      <div style={sL()}>Immediate Stabilization — Bridge to Drainage</div>
      {[
        { tx: "IV Fluid Challenge",     detail: "500 mL–1L NS bolus · increases RV preload → temporarily improves CO · buys time until drainage · watch for worsening JVD · do NOT over-fluid", color: T.teal },
        { tx: "Avoid Diuretics",        detail: "Diuretics reduce preload → worsens tamponade physiology · completely contraindicated unless clear fluid overload from separate cause · tamponade requires preload", color: T.coral },
        { tx: "Vasopressors",           detail: "Norepinephrine 0.05–0.5 mcg/kg/min if hypotension persists despite fluids · maintain coronary perfusion while preparing for drainage · do NOT delay drainage for hemodynamic optimization", color: T.gold },
        { tx: "Avoid Positive Pressure Ventilation (if possible)", detail: "Positive pressure reduces RV preload → worsens tamponade · if intubation required: pre-drain if possible · use lowest PEEP · expect hemodynamic deterioration with induction · ketamine preferred induction agent (maintains SVR) · have pericardiocentesis set ready", color: T.amber },
        { tx: "Position",               detail: "Semi-recumbent (30–45°) · reduces cardiac compression · improves hemodynamics · do NOT lay flat · sitting upright for lucid patients", color: T.blue },
      ].map(({ tx, detail, color }) => (
        <div key={tx} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{tx}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
        </div>
      ))}

      <div style={sL(T.green)}>Post-Drainage Monitoring</div>
      {[
        { freq: "Every 15 min × 2h",  items: "BP · HR · JVP reassessment · SpO₂ · pericardial drain output · echo reassessment", color: T.coral },
        { freq: "Every 1h × 6h",      items: "Drain output (ml) · hemodynamic stability · reaccumulation signs · vital signs", color: T.gold },
        { freq: "Every 4–6h",          items: "Echo for reaccumulation · electrolytes · CBC · labs per underlying cause", color: T.teal },
        { freq: "Daily",              items: "Drain output · decide on drain removal (&lt; 25 mL/day) · cause workup · oncology/cardiology plan", color: T.green },
      ].map(({ freq, items, color }) => (
        <div key={freq} style={{ ...G(), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, fontWeight: 700, color, minWidth: 120, flexShrink: 0 }}>{freq}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{items}</div>
        </div>
      ))}

      <div style={sL(T.coral)}>Escalation Triggers</div>
      {["BP &lt; 90 despite fluids + vasopressors → emergent pericardiocentesis, even if echo guidance unavailable",
        "Pericardial drain output suddenly stops (clot) → flush gently with 10 mL NS · if no output → reposition or replace drain",
        "Echo shows reaccumulation to pre-drainage size → prolonged drainage vs. pericardial window",
        "Bloody output not decreasing after 24h → hemopericardium (post-op · trauma) → surgical evaluation",
        "Cardiac arrest developing → pericardiocentesis during ACLS · open thoracotomy if PEA from tamponade"].map((t, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 6, lineHeight: 1.4 }}>
          <span style={{ color: T.coral, flexShrink: 0 }}>⚠</span>{t}
        </div>
      ))}

      <div style={sL(T.purple)}>Disposition</div>
      <div style={{ ...card() }}>
        {[
          { level: "ICU",           detail: "All hemodynamically significant tamponade · post-pericardiocentesis monitoring · recurrent effusion · malignant effusion · hemopericardium · post-cardiac surgery · active vasopressor requirement" },
          { level: "Cardiology ICU / CCU", detail: "Post-procedure monitoring · drain in place · cardiac cause (post-MI · post-procedure) · high risk of reaccumulation · needs cardiology + cardiac surgery availability" },
          { level: "Telemetry",     detail: "Small stable effusion without hemodynamic compromise · drain removed · pericarditis + effusion responding to medical treatment · close monitoring · serial echo" },
          { level: "Cardiothoracic Surgery Consult", detail: "Aortic dissection · post-cardiac surgery hemopericardium · loculated effusion · failure of needle drainage · recurrent effusion (pericardial window consideration) · any bloody drain output not clearing" },
        ].map(({ level, detail }, i) => (
          <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, minWidth: 160, flexShrink: 0 }}>{level}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(20,184,166,0.09) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(244,63,94,0.07) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>
      <div style={{ padding: "20px 20px 0" }}>
        <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 16 }}>
          ← Critical Protocols
        </button>
        <div>
          <span style={pill("linear-gradient(135deg,#3b82f6,#1e3a8a)")}>❤️ Cardiac</span>
          <span style={pill("linear-gradient(135deg,#0d9488,#065f46)")}>ACC/AHA / Echo</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>Cardiac Tamponade</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>Beck's triad · Pulsus paradoxus · 4-view POCUS guide · Pericardiocentesis technique · Aortic dissection warning</p>
      </div>
      <div style={{ display: "flex", gap: 4, padding: "0 20px", marginBottom: 18, overflowX: "auto", scrollbarWidth: "none" }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: "7px 15px", borderRadius: 9, border: `1.5px solid ${tab === i ? T.teal : T.border}`, background: tab === i ? "rgba(20,184,166,0.14)" : T.glass, color: tab === i ? T.teal : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, whiteSpace: "nowrap", transition: "all 0.18s", backdropFilter: "blur(8px)" }}>
            {t}
          </button>
        ))}
      </div>
      <div style={{ padding: "0 20px" }}>
        {tab === 0 && T0}{tab === 1 && T1}{tab === 2 && T2}{tab === 3 && T3}
      </div>
    </div>
  );
}