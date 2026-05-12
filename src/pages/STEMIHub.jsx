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
const sL   = (c = T.coral) => ({ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: c, margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 8 });
const dv   = { height: 1, background: T.border, margin: "10px 0" };

const TERRITORIES = [
  { lead: "II, III, aVF",      territory: "Inferior",        artery: "RCA (80%) or LCx (20%)",    caveat: "Check V3R/V4R for RV infarct · avoid nitrates if RV involvement" },
  { lead: "V1–V4",             territory: "Anterior / Septal", artery: "LAD (proximal)",           caveat: "Highest mortality · largest territory · LV dysfunction common" },
  { lead: "V3–V5",             territory: "Anterior",         artery: "LAD (mid)",                 caveat: "Moderate-sized infarct · LV function generally preserved" },
  { lead: "I, aVL, V5–V6",    territory: "Lateral",          artery: "LCx or diagonal branch",   caveat: "May coexist with anterior or inferior STEMI" },
  { lead: "V1–V6 + I + aVL",  territory: "Extensive Anterior", artery: "Proximal LAD (pre-diagonal)", caveat: "Very high mortality · complete LAD territory · cardiogenic shock risk" },
  { lead: "V1–V2 ST depression + tall R", territory: "Posterior", artery: "RCA or LCx",          caveat: "STEMI equivalent · use posterior leads V7–V9 to confirm · often missed" },
  { lead: "V3R, V4R",          territory: "Right Ventricular", artery: "RCA proximal",            caveat: "Complicates 25–40% of inferior MI · avoid nitrates/diuretics/morphine · preload dependent" },
];

const ANTIPLATELETS = [
  { drug: "Aspirin",               dose: "324 mg PO (non-enteric) loading · then 81 mg/day", timing: "Immediately on arrival", color: T.teal },
  { drug: "Ticagrelor (Brilinta)",  dose: "180 mg PO loading · then 90 mg BID × 12 months", timing: "In ED before cath lab", color: T.coral, pref: "Preferred P2Y12" },
  { drug: "Prasugrel (Effient)",    dose: "60 mg PO loading · then 10 mg/day × 12 months", timing: "At time of PCI (NOT before — bleeding risk if anatomy unknown)", color: T.amber, pref: "At time of PCI" },
  { drug: "Clopidogrel (Plavix)",  dose: "600 mg PO loading · then 75 mg/day × 12 months", timing: "If ticagrelor/prasugrel unavailable or contraindicated", color: T.blue },
];

const LYTICS_CI_ABS = [
  "Prior intracranial hemorrhage (any time)",
  "Ischemic stroke within 3 months",
  "Structural cerebrovascular lesion (AVM)",
  "Intracranial malignancy",
  "Suspected aortic dissection",
  "Active significant internal bleeding (not menses)",
  "Significant closed-head or facial trauma within 3 months",
];

const LYTICS_CI_REL = [
  "Poorly controlled hypertension (SBP > 180/DBP > 110)",
  "History of prior ischemic stroke (> 3 months)",
  "Known intracranial pathology not listed above",
  "Traumatic or prolonged CPR > 10 min",
  "Major surgery within 3 weeks",
  "Recent GI or GU bleeding (within 2–4 weeks)",
  "Pregnancy",
  "Active peptic ulcer",
  "Age > 75 (increased ICH risk with fibrinolytics)",
];

export default function STEMIHub({ onBack }) {
  const navigate = useNavigate();
  const handleBack = () => onBack ? onBack() : navigate("/CriticalProtocolsPage");

  const [tab, setTab]         = useState(0);
  const [selTerritory, setSelTerritory] = useState(null);
  const [rvInfarct, setRvInfarct] = useState(false);
  const [lyticsStep, setLyticsStep] = useState(null);
  const TABS = ["ECG + Diagnosis", "Activation", "Medications", "Complications"];

  const selTerr = TERRITORIES.find(t => t.lead === selTerritory);

  // ── TAB 0: ECG + DIAGNOSIS ────────────────────────────────────────────
  const T0 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Time = Myocardium — Goal Door-to-Balloon ≤ 90 min</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Every 30-min delay in reperfusion increases mortality by ~7.5%. Activate cath lab immediately on ECG recognition — do not wait for labs, repeat ECGs, or stabilization.</div>
      </div>

      <div style={sL()}>STEMI Diagnostic Criteria</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 8 }}>New ST Elevation (J-point) in ≥ 2 Contiguous Leads</div>
        {[
          { criteria: "Men &lt; 40 years — V2–V3", threshold: "≥ 2.5 mm" },
          { criteria: "Men ≥ 40 years — V2–V3", threshold: "≥ 2.0 mm" },
          { criteria: "Women — V2–V3",           threshold: "≥ 1.5 mm" },
          { criteria: "All leads except V2–V3",  threshold: "≥ 1.0 mm" },
          { criteria: "New LBBB + ischemic symptoms", threshold: "STEMI equivalent" },
          { criteria: "Posterior leads V7–V9",   threshold: "≥ 0.5 mm (posterior STEMI)" },
          { criteria: "Right leads V3R, V4R",    threshold: "≥ 0.5 mm (RV STEMI)" },
        ].map(({ criteria, threshold }) => (
          <div key={criteria} style={{ display: "flex", justifyContent: "space-between", paddingBottom: 5, marginBottom: 5, borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 11.5, color: T.muted }}>{criteria}</span>
            <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: T.coral }}>{threshold}</span>
          </div>
        ))}
      </div>

      <div style={sL(T.blue)}>STEMI Equivalents — Do NOT Miss</div>
      {[
        { eq: "New LBBB",           detail: "New or presumed-new LBBB with ischemic symptoms = STEMI equivalent · activate cath lab · Sgarbossa criteria to confirm ischemia in LBBB" },
        { eq: "De Winter T-waves",  detail: "Upsloping ST depression in V1–V6 + peaked T-waves · LAD occlusion equivalent · often missed as 'non-STEMI' · immediate cath" },
        { eq: "Posterior STEMI",    detail: "ST depression V1–V2 + dominant R wave + upright T wave → flip leads → posterior STEMI · V7–V9 confirm · RCA or LCx" },
        { eq: "Wellens Syndrome",   detail: "Biphasic (Type A) or deeply inverted (Type B) T-waves in V2–V3 after chest pain relief · critical LAD stenosis · HIGH risk of massive anterior MI · do NOT stress test · urgent cath" },
        { eq: "aVR Elevation + diffuse ST depression", detail: "Left main or proximal LAD equivalent · cardiogenic shock likely · highest mortality STEMI pattern" },
      ].map(({ eq, detail }) => (
        <div key={eq} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${T.blue}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.blue, marginBottom: 2 }}>{eq}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
        </div>
      ))}

      <div style={sL(T.gold)}>Territory Localizer — tap to identify artery</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
        {TERRITORIES.map(t => (
          <div key={t.lead}
            style={{ ...G(), padding: "10px 13px", border: `1.5px solid ${selTerritory === t.lead ? T.coral + "70" : T.border}`, background: selTerritory === t.lead ? "rgba(244,63,94,0.08)" : T.glass, cursor: "pointer", transition: "all 0.18s" }}
            onClick={() => setSelTerritory(selTerritory === t.lead ? null : t.lead)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: T.coral, minWidth: 120 }}>{t.lead}</span>
                <span style={{ fontSize: 12, color: T.white }}>{t.territory}</span>
              </div>
              <span style={{ ...tag(T.teal), fontSize: 9 }}>{t.artery}</span>
            </div>
            {selTerritory === t.lead && (
              <div style={{ marginTop: 8, paddingTop: 6, borderTop: `1px solid rgba(244,63,94,0.2)` }}>
                <div style={{ fontSize: 11.5, color: T.amber }}>{t.caveat}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={sL(T.purple)}>RV Infarct Protocol</div>
      <div style={{ ...card({ background: "rgba(167,139,250,0.07)", borderColor: "rgba(167,139,250,0.3)" }) }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, marginBottom: 8 }}>Suspect in ALL Inferior MI — Check V3R/V4R</div>
        {[
          { step: "Diagnosis", detail: "ST elevation ≥ 0.5 mm in V4R · record right-sided ECG (V3R–V6R) · JVD without pulmonary edema + hypotension after nitroglycerin = classic triad" },
          { step: "Key Management", detail: "PRELOAD DEPENDENT — volume resuscitation is treatment · Avoid: nitrates (vasodilate → drop preload) · diuretics · morphine · ACE inhibitors acutely" },
          { step: "Fluids",    detail: "0.9% NS 500 mL bolus → assess response · may need 1–2L to maintain hemodynamics · if no response → inotropes (dobutamine) · not more fluid" },
          { step: "Arrhythmia", detail: "High-grade AV block common (complete block) · transcutaneous pacing ready · maintain sinus rhythm (AV synchrony critical for RV filling)" },
        ].map(({ step, detail }) => (
          <div key={step} style={{ ...G({ borderRadius: 9, marginBottom: 7 }), padding: "9px 12px", borderLeft: `3px solid ${T.purple}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, marginBottom: 2 }}>{step}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{detail}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── TAB 1: ACTIVATION ─────────────────────────────────────────────────
  const T1 = (
    <div>
      <div style={{ ...G({ borderRadius: 14, border: `2px solid ${T.coral}55`, background: "rgba(244,63,94,0.08)", marginBottom: 16 }), padding: "14px" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.coral, marginBottom: 4 }}>⚡ STEMI Activation — Simultaneous Parallel Actions</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>All actions below begin simultaneously the moment STEMI is recognized. No action waits for another. Cath lab activation and medication administration happen in parallel.</div>
      </div>

      <div style={sL()}>Simultaneous Actions on STEMI Recognition</div>
      {[
        { n: "A", label: "ACTIVATE CATH LAB",        detail: "Single call to activate entire cath team · notify interventional cardiologist · page cath lab staff · estimated arrival time · every second matters", color: T.coral, time: "T = 0" },
        { n: "B", label: "12-LEAD ECG",               detail: "If not already done · right-sided ECG (V3R/V4R) for all inferior MIs · posterior leads (V7–V9) if posterior pattern · serial ECGs if diagnosis unclear", color: T.teal, time: "T = 0" },
        { n: "C", label: "IV ACCESS + LABS",          detail: "2 large-bore IVs · type &amp; screen · CBC · BMP · coagulation · troponin (do NOT wait for result) · point-of-care glucose · renal function for contrast dosing", color: T.blue, time: "T = 0" },
        { n: "D", label: "MEDICATIONS",               detail: "Aspirin 324 mg PO · anticoagulation (UFH) · P2Y12 inhibitor (ticagrelor preferred) · oxygen only if SpO₂ &lt; 90% · NO routine morphine (increases mortality) · nitrates only if no RV infarct + BP adequate", color: T.gold, time: "T = 0–5 min" },
        { n: "E", label: "PATIENT PREPARATION",       detail: "Consent (brief) · NPO status · Foley catheter · groin/wrist prep · baseline neuro exam · notify family · DNAR / goals of care if relevant · ECG monitoring and defibrillator at bedside", color: T.purple, time: "T = 0–10 min" },
        { n: "F", label: "TRANSFER TO CATH LAB",      detail: "Patient transferred directly to cath lab from ED · bypass CCU for stable patients · continue monitoring during transfer · resuscitation equipment accompanies patient", color: T.amber, time: "T ≤ 90 min" },
      ].map(({ n, label, detail, color, time }) => (
        <div key={n} style={{ ...card({ marginBottom: 8 }), display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 28, height: 28, borderRadius: 9, background: color + "22", border: `1.5px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color, fontFamily: T.mono, flexShrink: 0 }}>{n}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color }}>{label}</span>
              <span style={{ ...tag(color), fontSize: 9, whiteSpace: "nowrap", marginLeft: 6 }}>{time}</span>
            </div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
          </div>
        </div>
      ))}

      <div style={sL(T.gold)}>Time Targets</div>
      {[
        { metric: "Door-to-ECG",          target: "≤ 10 minutes", color: T.teal },
        { metric: "Door-to-balloon (PCI)", target: "≤ 90 minutes (≤ 60 min if transferred from PCI-capable hospital)", color: T.coral },
        { metric: "Door-to-needle (Lytics)", target: "≤ 30 minutes (if no PCI available)", color: T.amber },
        { metric: "First medical contact to balloon", target: "≤ 120 minutes total", color: T.gold },
        { metric: "Symptom onset to reperfusion", target: "≤ 12 hours (benefit up to 12h · consider 12–24h if ongoing ischemia)", color: T.blue },
      ].map(({ metric, target, color }) => (
        <div key={metric} style={{ ...G({ borderRadius: 9 }), padding: "9px 12px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: T.muted }}>{metric}</span>
          <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color }}>{target}</span>
        </div>
      ))}

      <div style={sL(T.purple)}>PCI vs Fibrinolysis Decision</div>
      <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
        <div style={card({ background: "rgba(20,184,166,0.07)", borderColor: "rgba(20,184,166,0.3)" })}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, marginBottom: 8 }}>Primary PCI — Preferred Strategy</div>
          {["PCI-capable hospital available within 120 min first-medical-contact",
            "Cardiogenic shock or acute severe HF (regardless of delay)",
            "Contraindication to fibrinolysis",
            "Symptom onset > 3h (lytics less effective)",
            "Diagnosis uncertain (PCI is also diagnostic)"].map((s, i) => (
            <div key={i} style={{ fontSize: 11.5, color: T.muted, display: "flex", gap: 7, marginBottom: 4 }}>
              <span style={{ color: T.teal }}>✓</span>{s}
            </div>
          ))}
        </div>
        <div style={card({ background: "rgba(245,158,11,0.07)", borderColor: "rgba(245,158,11,0.25)" })}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, marginBottom: 8 }}>Fibrinolysis — When PCI Not Available in Time</div>
          {["Expected PCI delay > 120 min from first medical contact",
            "Symptom onset ≤ 3h + expected delay to PCI",
            "No absolute contraindications",
            "Transfer to PCI center AFTER lysis for 'pharmaco-invasive strategy' (PCI in 3–24h post-lytics)"].map((s, i) => (
            <div key={i} style={{ fontSize: 11.5, color: T.muted, display: "flex", gap: 7, marginBottom: 4 }}>
              <span style={{ color: T.gold }}>●</span>{s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── TAB 2: MEDICATIONS ────────────────────────────────────────────────
  const T2 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Dual Antiplatelet Therapy (DAPT) — Cornerstone of STEMI</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Aspirin + P2Y12 inhibitor reduce mortality and reinfarction. Start as early as possible. Continue P2Y12 inhibitor for minimum 12 months after PCI with stent.</div>
      </div>

      <div style={sL()}>Antiplatelet Therapy</div>
      {ANTIPLATELETS.map(({ drug, dose, timing, color, pref }) => (
        <div key={drug} style={{ ...card({ marginBottom: 8, borderLeft: `3px solid ${color}` }) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color }}>{drug}</span>
              {pref && <span style={{ ...tag(color), fontSize: 9, marginLeft: 8 }}>{pref}</span>}
            </div>
            <span style={{ ...tag(T.teal), fontSize: 9 }}>{timing}</span>
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 12, color: T.white, marginBottom: 3 }}>{dose}</div>
        </div>
      ))}

      <div style={sL(T.blue)}>Anticoagulation</div>
      {[
        { drug: "UFH (Primary PCI)", dose: "70–100 units/kg IV bolus (max 10,000 units) before PCI · no ACT target pre-spec · adjust per protocol", note: "Standard anticoagulant for STEMI-PCI · additional doses in cath lab per protocol", color: T.blue },
        { drug: "Bivalirudin",      dose: "0.75 mg/kg IV bolus → 1.75 mg/kg/h during PCI", note: "Alternative to UFH + GPIIb/IIIa · lower bleeding risk · higher stent thrombosis risk in some studies", color: T.teal },
        { drug: "Enoxaparin",       dose: "0.5 mg/kg IV bolus + SC dosing if PCI delayed", note: "For fibrinolysis strategy or initial anticoagulation pre-PCI · avoid if CrCl &lt; 30", color: T.purple },
        { drug: "Fondaparinux",     dose: "2.5 mg IV once (STEMI with lytics strategy)", note: "NOT for primary PCI (catheter thrombosis risk) · use with fibrinolysis only · avoid if CrCl &lt; 30", color: T.amber },
      ].map(({ drug, dose, note, color }) => (
        <div key={drug} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 3 }}>{drug}</div>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.white, marginBottom: 3 }}>{dose}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{note}</div>
        </div>
      ))}

      <div style={sL(T.gold)}>Adjunctive Medications</div>
      {[
        { drug: "Oxygen",          dose: "Only if SpO₂ &lt; 90%", note: "Routine O₂ in normoxic STEMI increases infarct size (AVOID-HF study) · only for hypoxia or shock", color: T.teal },
        { drug: "Nitroglycerin",   dose: "0.4 mg SL q 5 min × 3 · IV 5–200 mcg/min if HTN or CHF", note: "AVOID if: SBP &lt; 90 · RV infarct · PDE5 inhibitor &lt; 24h · severe AS · tachycardia/bradycardia", color: T.gold },
        { drug: "Beta-blockers",   dose: "Metoprolol tartrate 5 mg IV q 5 min × 3 (if tolerated) → 25–50 mg PO BID", note: "Start within 24h if no CHF · bradycardia · hypotension · or AV block · oral preferred over IV · reduce arrhythmias and reinfarction", color: T.purple },
        { drug: "High-intensity Statin", dose: "Atorvastatin 80 mg PO or Rosuvastatin 40 mg PO", note: "Load before PCI if possible · reduces periprocedural MI · plaque stabilization · LDL target &lt; 70 mg/dL", color: T.blue },
        { drug: "ACE Inhibitor",   dose: "Captopril 6.25 mg TID or Lisinopril 5 mg daily · start within 24h", note: "Especially if EF &lt; 40% · anterior MI · HF · diabetes · avoid if hypotensive or AKI", color: T.amber },
        { drug: "Morphine — AVOID", dose: "DO NOT GIVE routinely", note: "CRUSADE registry: morphine delays P2Y12 absorption by up to 2h → worse outcomes · use only for refractory chest pain not responding to nitrates + beta-blockers", color: T.coral },
      ].map(({ drug, dose, note, color }) => (
        <div key={drug} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color }}>{drug}</span>
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, color: drug.includes("AVOID") ? T.coral : T.white, marginBottom: 3 }}>{dose}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{note}</div>
        </div>
      ))}

      <div style={sL(T.coral)}>Fibrinolysis — Alteplase Protocol</div>
      <div style={{ ...card({ marginBottom: 12 }) }}>
        <div style={{ fontFamily: T.mono, fontSize: 13, color: T.coral, fontWeight: 700, marginBottom: 8 }}>Accelerated Alteplase (tPA) — STEMI Standard</div>
        {[
          { step: "15 mg IV bolus over 2 min", detail: "Immediate IV push" },
          { step: "0.75 mg/kg over 30 min (max 50 mg)", detail: "Infusion — most of the dose" },
          { step: "0.5 mg/kg over 60 min (max 35 mg)", detail: "Remaining infusion" },
          { step: "Max total dose: 100 mg", detail: "Weight-based with hard cap" },
        ].map(({ step, detail }, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 7, alignItems: "center" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: T.coral + "22", border: `1px solid ${T.coral}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: T.coral, flexShrink: 0 }}>{i + 1}</div>
            <div>
              <span style={{ fontFamily: T.mono, fontSize: 12, color: T.coral }}>{step}</span>
              <span style={{ fontSize: 11, color: T.dim, marginLeft: 8 }}>{detail}</span>
            </div>
          </div>
        ))}
        <div style={dv} />
        <div style={{ fontSize: 10.5, fontWeight: 700, color: T.coral, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Absolute Contraindications</div>
        {LYTICS_CI_ABS.map((c, i) => <div key={i} style={{ fontSize: 11.5, color: T.muted, display: "flex", gap: 7, marginBottom: 4 }}><span style={{ color: T.coral }}>✗</span>{c}</div>)}
      </div>
    </div>
  );

  // ── TAB 3: COMPLICATIONS ──────────────────────────────────────────────
  const T3 = (
    <div>
      <div style={sL()}>Mechanical Complications — Usually Day 2–7</div>
      {[
        { comp: "Free Wall Rupture",        timing: "Day 1–5 (biphasic: early + late peak)", color: T.coral, urgent: true,
          signs: "Sudden hemodynamic collapse · electromechanical dissociation · pericardial tamponade · Beck's triad",
          mgmt: "Emergent pericardiocentesis (temporary) · immediate cardiac surgery · highest mortality mechanical complication" },
        { comp: "Ventricular Septal Defect (VSD)", timing: "Day 2–7 · peak day 3–5", color: T.coral, urgent: true,
          signs: "New harsh holosystolic murmur (LLSB) · acute biventricular failure · sudden deterioration",
          mgmt: "Emergent surgery (mortality 20–50% with surgery vs 90% without) · IABP for stabilization · PCI has limited role once VSD present" },
        { comp: "Acute Mitral Regurgitation", timing: "Day 2–7 · papillary muscle rupture", color: T.coral, urgent: true,
          signs: "New soft systolic murmur (may be soft if low flow) · acute pulmonary edema · hemodynamic collapse · posterior MI most common (posteromedial papillary has single blood supply)",
          mgmt: "Emergent surgical repair/replacement · IABP bridge · afterload reduction (nitroprusside) · inotropes" },
        { comp: "LV Thrombus",               timing: "Days to weeks · anterior MI", color: T.amber, urgent: false,
          signs: "Echo finding · risk of embolism · elevated D-dimer", mgmt: "Anticoagulation (warfarin target INR 2–3 or DOAC) × 3–6 months · triple therapy if on DAPT post-PCI (high bleeding risk)" },
        { comp: "Pericarditis (Dressler Syndrome)", timing: "Weeks to months post-MI", color: T.gold, urgent: false,
          signs: "Pleuritic chest pain · friction rub · diffuse ST elevation on ECG · fever", mgmt: "NSAIDs + colchicine · avoid anticoagulants if effusion present · steroids only for refractory cases" },
      ].map(({ comp, timing, color, urgent, signs, mgmt }) => (
        <div key={comp} style={{ ...card({ marginBottom: 9, borderLeft: `3px solid ${color}` }) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color }}>{comp}</span>
            <div style={{ display: "flex", gap: 5 }}>
              {urgent && <span style={{ ...tag(T.coral), fontSize: 9 }}>URGENT</span>}
              <span style={{ ...tag(color), fontSize: 9 }}>{timing}</span>
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 6 }}><span style={{ fontWeight: 600, color: T.white }}>Signs: </span>{signs}</div>
          <div style={aBox(color, 0)}>
            <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 2 }}>Management</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{mgmt}</div>
          </div>
        </div>
      ))}

      <div style={sL(T.purple)}>Arrhythmia Management</div>
      {[
        { arrhythmia: "Ventricular Fibrillation / pVT", mgmt: "Immediate defibrillation (200J biphasic) · ACLS · amiodarone 300 mg IV after 3rd shock · reperfusion is definitive treatment", color: T.coral },
        { arrhythmia: "Accelerated Idioventricular Rhythm (AIVR)", mgmt: "Reperfusion rhythm — benign in STEMI · HR 60–100 · no treatment needed · do NOT give lidocaine", color: T.green },
        { arrhythmia: "Complete Heart Block (Inferior MI)", mgmt: "Temporary transcutaneous pacing while awaiting PCI · resolves with reperfusion in most cases · transvenous pacing if unresponsive or prolonged · AVOID atropine in anterior MI heart block", color: T.amber },
        { arrhythmia: "Sinus Bradycardia / Junctional (Inferior)", mgmt: "Usually benign with inferior MI (vagal) · atropine 0.5–1 mg IV if symptomatic · dopamine or pacing if refractory · resolves with reperfusion", color: T.gold },
        { arrhythmia: "AF / Atrial Flutter",     mgmt: "Rate control (metoprolol or diltiazem) · anticoagulation · cardioversion if hemodynamically unstable · treat ischemia (often resolves with reperfusion)", color: T.blue },
      ].map(({ arrhythmia, mgmt, color }) => (
        <div key={arrhythmia} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{arrhythmia}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{mgmt}</div>
        </div>
      ))}

      <div style={sL(T.teal)}>Post-STEMI Checklist Before Discharge</div>
      <div style={{ ...card() }}>
        {["DAPT: Aspirin + P2Y12 inhibitor (minimum 12 months) — document duration",
          "High-intensity statin (atorvastatin 80 mg or rosuvastatin 40 mg)",
          "Beta-blocker (if EF &lt; 40% or HTN) — titrate to HR 55–65",
          "ACE inhibitor or ARB (especially if EF &lt; 40% · anterior MI · DM)",
          "Eplerenone/spironolactone if EF &lt; 40% + DM or HF symptoms",
          "Echo for EF assessment (predicts ICD candidacy at 40 days post-MI)",
          "Cardiac rehab referral",
          "Smoking cessation counseling",
          "Dietary counseling · activity restrictions for 2 weeks",
          "Follow-up with cardiologist within 1–2 weeks"].map((s, i) => (
          <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}>
            <span style={{ color: T.teal }}>✓</span>{s}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(244,63,94,0.09) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(59,130,246,0.08) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>
      <div style={{ padding: "20px 20px 0" }}>
        <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 16 }}>
          ← Critical Protocols
        </button>
        <div>
          <span style={pill("linear-gradient(135deg,#3b82f6,#1e3a8a)")}>❤️ Cardiac</span>
          <span style={pill("linear-gradient(135deg,#f43f5e,#be185d)")}>AHA/ACC 2013/2023</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>STEMI</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>Territory localizer · STEMI equivalents · Cath lab activation · DAPT · Fibrinolysis · Mechanical complications</p>
      </div>
      <div style={{ display: "flex", gap: 4, padding: "0 20px", marginBottom: 18, overflowX: "auto", scrollbarWidth: "none" }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: "7px 15px", borderRadius: 9, border: `1.5px solid ${tab === i ? T.coral : T.border}`, background: tab === i ? "rgba(244,63,94,0.14)" : T.glass, color: tab === i ? T.coral : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, whiteSpace: "nowrap", transition: "all 0.18s", backdropFilter: "blur(8px)" }}>
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