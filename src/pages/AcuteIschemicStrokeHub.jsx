import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Font Loader ──────────────────────────────────────────────────────────────
(() => {
  if (typeof document === "undefined") return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap";
  document.head.appendChild(l);
})();

// ── Tokens ───────────────────────────────────────────────────────────────────
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
const sL   = (c = T.purple) => ({ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: c, margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 8 });
const dv   = { height: 1, background: T.border, margin: "10px 0" };
const inp  = { padding: "9px 12px", background: T.glassMid, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: T.mono, fontWeight: 600, outline: "none" };

// ── NIHSS Items ───────────────────────────────────────────────────────────────
const NIHSS_ITEMS = [
  { id: "loc",      label: "1a. Level of Consciousness",        max: 3, desc: "0=Alert · 1=Drowsy · 2=Obtunded · 3=Unresponsive" },
  { id: "loc_q",    label: "1b. LOC Questions (month/age)",     max: 2, desc: "0=Both correct · 1=One correct · 2=Neither" },
  { id: "loc_c",    label: "1c. LOC Commands (eyes/hand)",      max: 2, desc: "0=Both correct · 1=One correct · 2=Neither" },
  { id: "gaze",     label: "2. Best Gaze",                      max: 2, desc: "0=Normal · 1=Partial palsy · 2=Forced deviation" },
  { id: "visual",   label: "3. Visual Fields",                  max: 3, desc: "0=No loss · 1=Partial hemianopia · 2=Complete hemianopia · 3=Bilateral" },
  { id: "facial",   label: "4. Facial Palsy",                   max: 3, desc: "0=Normal · 1=Minor · 2=Partial · 3=Complete" },
  { id: "arm_l",    label: "5a. Motor Arm (Left)",              max: 4, desc: "0=No drift · 1=Drift · 2=Falls · 3=No effort against gravity · 4=No movement" },
  { id: "arm_r",    label: "5b. Motor Arm (Right)",             max: 4, desc: "0=No drift · 1=Drift · 2=Falls · 3=No effort · 4=No movement" },
  { id: "leg_l",    label: "6a. Motor Leg (Left)",              max: 4, desc: "0=No drift · 1=Drift · 2=Falls · 3=No effort against gravity · 4=No movement" },
  { id: "leg_r",    label: "6b. Motor Leg (Right)",             max: 4, desc: "0=No drift · 1=Drift · 2=Falls · 3=No effort · 4=No movement" },
  { id: "ataxia",   label: "7. Limb Ataxia",                    max: 2, desc: "0=Absent · 1=Present in one limb · 2=Present in two limbs" },
  { id: "sensory",  label: "8. Sensory",                        max: 2, desc: "0=Normal · 1=Mild-moderate loss · 2=Severe loss or coma" },
  { id: "language", label: "9. Best Language",                  max: 3, desc: "0=Normal · 1=Mild-moderate aphasia · 2=Severe aphasia · 3=Mute / global" },
  { id: "dysarth",  label: "10. Dysarthria",                    max: 2, desc: "0=Normal · 1=Mild-moderate · 2=Severe / unintelligible" },
  { id: "neglect",  label: "11. Extinction / Neglect",          max: 2, desc: "0=Normal · 1=Partial neglect · 2=Profound neglect" },
];

const TPA_ABS_CI = [
  "Intracranial hemorrhage on CT (any type)",
  "Significant head trauma or prior stroke within 3 months",
  "Symptoms suggest subarachnoid hemorrhage",
  "Arterial puncture at non-compressible site within 7 days",
  "History of prior intracranial hemorrhage",
  "Intracranial neoplasm, AVM, or aneurysm",
  "Recent intracranial or intraspinal surgery",
  "SBP > 185 or DBP > 110 mmHg despite treatment",
  "Active internal bleeding",
  "Acute bleeding diathesis (PLT < 100k · INR > 1.7 · aPTT > 40 · PT > 15)",
];

const TPA_REL_CI_3H = [
  "Minor or rapidly improving symptoms (use clinical judgment)",
  "Pregnancy (relative — benefit may outweigh risk in severe stroke)",
  "Seizure at stroke onset (if deficits are post-ictal, not ischemic)",
  "Major surgery or serious trauma within 14 days",
  "GI or urinary tract hemorrhage within 21 days",
  "MI within 3 months",
];

const TPA_REL_CI_3_45H = [
  "Age > 80 years",
  "Severe stroke (NIHSS > 25)",
  "Oral anticoagulant use regardless of INR",
  "History of both diabetes AND prior stroke",
];

const TERRITORIES = [
  { artery: "MCA (Superior Division)", color: T.blue,   deficits: "Contralateral face + arm weakness > leg · Broca's aphasia (dominant) · neglect (non-dominant) · gaze deviation toward lesion" },
  { artery: "MCA (Inferior Division)", color: T.purple, deficits: "Wernicke's aphasia (dominant) · contralateral visual field deficit · spatial neglect (non-dominant) · minimal motor deficits" },
  { artery: "MCA (Complete)",          color: T.coral,  deficits: "Dense contralateral hemiplegia + hemisensory loss · global aphasia (dominant) · profound neglect · head/gaze deviation" },
  { artery: "ACA",                     color: T.teal,   deficits: "Contralateral leg > arm weakness · incontinence · abulia · personality change · grasp reflex" },
  { artery: "PCA",                     color: T.gold,   deficits: "Contralateral hemianopia · alexia without agraphia (dominant) · sensory loss · memory impairment (bilateral = coma)" },
  { artery: "Basilar / Posterior",     color: T.amber,  deficits: "COMA + crossed findings (ipsilateral CN + contralateral body) · vertigo · dysarthria · ataxia · INO · Locked-in syndrome" },
  { artery: "Lacunar",                 color: T.green,  deficits: "Pure motor hemiplegia · pure sensory · ataxic-hemiparesis · dysarthria-clumsy hand · no cortical signs (aphasia/neglect)" },
];

// ── Main Component ───────────────────────────────────────────────────────────
export default function AcuteIschemicStrokeHub({ onBack }) {
  const navigate = useNavigate();
  const handleBack = () => onBack ? onBack() : navigate("/CriticalProtocolsPage");

  const [tab, setTab]     = useState(0);
  const [nihss, setNihss] = useState({});
  const [wt, setWt]       = useState("");
  const [lkw, setLkw]     = useState("");
  const [sbp, setSbp]     = useState("");
  const [dbp, setDbp]     = useState("");
  const [territory, setTerritory] = useState(null);
  const TABS = ["Recognition", "tPA Eligibility", "Thrombectomy", "Management"];

  const nihssScore = NIHSS_ITEMS.reduce((s, i) => s + (nihss[i.id] || 0), 0);
  const nihssSev   = nihssScore === 0 ? { label: "No Stroke / TIA", color: T.green }
    : nihssScore <= 4  ? { label: "Minor Stroke", color: T.gold }
    : nihssScore <= 15 ? { label: "Moderate Stroke", color: T.amber }
    : nihssScore <= 20 ? { label: "Moderate-Severe", color: T.coral }
    : { label: "Severe Stroke", color: T.coral };

  const wtNum   = parseFloat(wt);
  const tpaDose = !isNaN(wtNum) && wt ? {
    total:    Math.min(wtNum * 0.9, 90).toFixed(1),
    bolus:    Math.min(wtNum * 0.09, 9).toFixed(1),
    infusion: Math.min(wtNum * 0.81, 81).toFixed(1),
  } : null;

  const bpEligible = sbp !== "" && dbp !== "" ? parseFloat(sbp) <= 185 && parseFloat(dbp) <= 110 : null;
  const selTerritory = TERRITORIES.find(t => t.artery === territory);

  // ── TAB 0: RECOGNITION ────────────────────────────────────────────────────
  const T0 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Time = Brain — 1.9 million neurons lost per minute</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Activate stroke protocol immediately. Do NOT wait for labs or imaging to begin the evaluation. Door-to-CT goal: 25 min. Door-to-needle goal: 60 min.</div>
      </div>

      <div style={sL()}>BE-FAST Screening</div>
      {[
        { l: "B", w: "Balance",  d: "Sudden loss of balance or coordination · unsteady gait · falls", color: T.blue },
        { l: "E", w: "Eyes",     d: "Sudden visual changes · double vision · visual field loss · eye deviation", color: T.purple },
        { l: "F", w: "Face",     d: "Ask patient to smile — facial droop · asymmetry · one-sided weakness", color: T.coral },
        { l: "A", w: "Arms",     d: "Arm drift test — pronator drift · one arm drifts down when eyes closed", color: T.amber },
        { l: "S", w: "Speech",   d: "Slurred speech · aphasia · unable to repeat 'the sky is blue in Cincinnati'", color: T.gold },
        { l: "T", w: "Time",     d: "Note time of LAST KNOWN WELL (LKW) — or time symptoms discovered if found down", color: T.teal },
      ].map(({ l, w, d, color }) => (
        <div key={l} style={{ ...G(), padding: "10px 13px", marginBottom: 7, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: color + "22", border: `1.5px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color, fontFamily: T.mono, flexShrink: 0 }}>{l}</div>
          <div><div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 2 }}>{w}</div><div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{d}</div></div>
        </div>
      ))}

      <div style={sL(T.blue)}>Vascular Territory Localizer</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {TERRITORIES.map(t => (
          <button key={t.artery}
            style={{ padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${territory === t.artery ? t.color : T.border}`, background: territory === t.artery ? t.color + "20" : T.glass, color: territory === t.artery ? t.color : T.muted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, transition: "all 0.15s" }}
            onClick={() => setTerritory(territory === t.artery ? null : t.artery)}>
            {t.artery}
          </button>
        ))}
      </div>
      {selTerritory && (
        <div style={{ ...card({ border: `1.5px solid ${selTerritory.color}55`, marginBottom: 14 }) }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: selTerritory.color, marginBottom: 6 }}>{selTerritory.artery}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.6 }}>{selTerritory.deficits}</div>
        </div>
      )}

      <div style={sL(T.gold)}>Stroke Mimics — Always Consider</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
        {[
          { m: "Hypoglycemia",       clue: "Most important — check glucose immediately" },
          { m: "Todd's Paralysis",   clue: "Post-ictal focal weakness · history of seizure" },
          { m: "Complex Migraine",   clue: "Hemiplegic migraine · prior history · gradual" },
          { m: "Conversion Disorder",clue: "Non-anatomic pattern · inconsistent exam" },
          { m: "Brain Tumor",        clue: "Often subacute · headache · seizure history" },
          { m: "MS Exacerbation",    clue: "Prior episodes · INO · young patient" },
        ].map(({ m, clue }) => (
          <div key={m} style={{ ...G({ borderRadius: 9 }), padding: "10px 12px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, marginBottom: 2 }}>{m}</div>
            <div style={{ fontSize: 11, color: T.muted }}>{clue}</div>
          </div>
        ))}
      </div>

      <div style={sL()}>NIHSS Calculator</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        {NIHSS_ITEMS.map(item => (
          <div key={item.id} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: T.muted }}>{item.label}</span>
              <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: nihss[item.id] > 0 ? T.coral : T.dim }}>{nihss[item.id] || 0}</span>
            </div>
            <div style={{ fontSize: 10, color: T.dim, marginBottom: 5 }}>{item.desc}</div>
            <div style={{ display: "flex", gap: 4 }}>
              {Array.from({ length: item.max + 1 }, (_, i) => (
                <button key={i}
                  style={{ flex: 1, padding: "5px 0", borderRadius: 6, border: `1px solid ${nihss[item.id] === i ? T.purple : T.border}`, background: nihss[item.id] === i ? "rgba(167,139,250,0.2)" : T.glass, color: nihss[item.id] === i ? T.purple : T.dim, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: T.mono, transition: "all 0.12s" }}
                  onClick={() => setNihss(p => ({ ...p, [item.id]: i }))}>
                  {i}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div style={dv} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>NIHSS Total</span>
          <span style={{ fontFamily: T.mono, fontSize: 26, fontWeight: 800, color: nihssSev.color }}>{nihssScore}</span>
        </div>
        <div style={aBox(nihssSev.color, 4)}>
          <div style={{ fontSize: 13, fontWeight: 700, color: nihssSev.color }}>{nihssSev.label}</div>
        </div>
        <button onClick={() => setNihss({})}
          style={{ marginTop: 8, padding: "5px 12px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.glass, color: T.dim, fontSize: 11, cursor: "pointer", fontFamily: T.sans }}>
          Reset
        </button>
      </div>
    </div>
  );

  // ── TAB 1: tPA ELIGIBILITY ────────────────────────────────────────────────
  const T1 = (
    <div>
      <div style={{ ...G({ borderRadius: 14, border: `2px solid ${T.teal}55`, background: "rgba(20,184,166,0.08)", marginBottom: 16 }), padding: "14px" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.teal, marginBottom: 4 }}>Alteplase (tPA) Eligibility Checklist</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>AHA/ASA 2019 Guidelines · Door-to-needle goal: 60 min · Onset-to-treatment goal: ≤ 4.5 hours</div>
      </div>

      <div style={sL()}>Time Window Assessment</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, marginBottom: 8 }}>Last Known Well (LKW)</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <input value={lkw} onChange={e => setLkw(e.target.value)} placeholder="Time of LKW (e.g. 14:30)" type="time"
            style={{ ...inp, flex: 1 }} />
        </div>
        {lkw && (() => {
          const now  = new Date();
          const lkwT = new Date();
          const [h, m] = lkw.split(":").map(Number);
          lkwT.setHours(h, m, 0, 0);
          if (lkwT > now) lkwT.setDate(lkwT.getDate() - 1);
          const mins = Math.floor((now - lkwT) / 60000);
          const hrs  = (mins / 60).toFixed(1);
          const in3h = mins <= 180;
          const in45 = mins <= 270;
          return (
            <div style={aBox(in3h ? T.green : in45 ? T.gold : T.coral, 0)}>
              <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 800, color: in3h ? T.green : in45 ? T.gold : T.coral, marginBottom: 4 }}>
                {hrs} hours ({mins} min) since LKW
              </div>
              <div style={{ fontSize: 12, color: T.muted }}>
                {in3h ? "✓ Within 3h window — standard eligibility" : in45 ? "✓ Within 3–4.5h window — check extended criteria" : "✗ Beyond 4.5h — tPA not indicated · assess for thrombectomy"}
              </div>
            </div>
          );
        })()}
      </div>

      <div style={sL()}>Blood Pressure Check</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.07em" }}>SBP (mmHg)</div>
            <input value={sbp} onChange={e => setSbp(e.target.value)} placeholder="185" type="number" style={{ ...inp, width: "100%", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.07em" }}>DBP (mmHg)</div>
            <input value={dbp} onChange={e => setDbp(e.target.value)} placeholder="110" type="number" style={{ ...inp, width: "100%", boxSizing: "border-box" }} />
          </div>
        </div>
        {bpEligible !== null && (
          <div style={aBox(bpEligible ? T.green : T.coral, 0)}>
            <div style={{ fontSize: 12, fontWeight: 700, color: bpEligible ? T.green : T.coral }}>
              {bpEligible ? "✓ BP eligible for tPA (≤ 185/110)" : "✗ BP too high — treat before tPA · target ≤ 185/110"}
            </div>
            {!bpEligible && <div style={{ fontSize: 11.5, color: T.muted, marginTop: 3 }}>Labetalol 10–20 mg IV over 1–2 min · repeat × 1 OR Nicardipine 5 mg/h → titrate</div>}
          </div>
        )}
      </div>

      <div style={sL(T.teal)}>tPA Dose Calculator (0.9 mg/kg · max 90 mg)</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <input value={wt} onChange={e => setWt(e.target.value)} placeholder="Weight (kg)" type="number" style={{ ...inp, flex: 1 }} />
          <span style={{ fontSize: 12, color: T.muted }}>kg</span>
        </div>
        {tpaDose && (
          <div>
            {[
              { label: "Total dose",                val: `${tpaDose.total} mg`,    note: "0.9 mg/kg · max 90 mg",         color: T.teal },
              { label: "IV Bolus (10% over 1 min)", val: `${tpaDose.bolus} mg`,    note: "Give first",                    color: T.coral },
              { label: "Infusion (90% over 60 min)",val: `${tpaDose.infusion} mg`, note: "Remaining dose over 1 hour",    color: T.gold },
            ].map(({ label, val, note, color }) => (
              <div key={label} style={{ ...G({ borderRadius: 9, marginBottom: 7 }), padding: "10px 13px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, color: T.muted, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 11, color: T.dim }}>{note}</div>
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 800, color }}>{val}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={sL(T.coral)}>Absolute Contraindications</div>
      <div style={{ ...card({ background: "rgba(244,63,94,0.07)", borderColor: "rgba(244,63,94,0.25)", marginBottom: 12 }) }}>
        {TPA_ABS_CI.map((c, i) => (
          <div key={i} style={{ fontSize: 11.5, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}>
            <span style={{ color: T.coral, flexShrink: 0 }}>✗</span>{c}
          </div>
        ))}
      </div>

      <div style={sL(T.gold)}>Relative Contraindications (0–3h window)</div>
      <div style={{ ...card({ marginBottom: 12 }) }}>
        {TPA_REL_CI_3H.map((c, i) => (
          <div key={i} style={{ fontSize: 11.5, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}>
            <span style={{ color: T.gold, flexShrink: 0 }}>⚠</span>{c}
          </div>
        ))}
      </div>

      <div style={sL(T.amber)}>Additional Exclusions for 3–4.5h Window</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        {TPA_REL_CI_3_45H.map((c, i) => (
          <div key={i} style={{ fontSize: 11.5, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}>
            <span style={{ color: T.amber, flexShrink: 0 }}>⚠</span>{c}
          </div>
        ))}
      </div>

      <div style={sL(T.green)}>Post-tPA Management</div>
      {[
        "No anticoagulants or antiplatelets for 24h after tPA",
        "BP target: ≤ 180/105 mmHg × 24h — use nicardipine or labetalol",
        "No arterial lines, NG tubes, or urinary catheters × 30 min after infusion (if possible)",
        "Neuro checks q 15 min × 2h · q 30 min × 6h · q 1h × 16h",
        "If neuro deterioration during infusion → STOP tPA · Stat CT for hemorrhage",
        "MRI/CT at 24h before starting antithrombotics",
      ].map((order, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 6, lineHeight: 1.4 }}>
          <span style={{ color: T.green, flexShrink: 0 }}>▸</span>{order}
        </div>
      ))}
    </div>
  );

  // ── TAB 2: THROMBECTOMY ───────────────────────────────────────────────────
  const T2 = (
    <div>
      <div style={aBox(T.blue, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.blue, marginBottom: 2 }}>Mechanical Thrombectomy — Game Changer</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>For large vessel occlusions (LVO), thrombectomy has shown benefit up to 24h from LKW in selected patients. tPA + thrombectomy superior to thrombectomy alone for eligible patients.</div>
      </div>

      <div style={sL()}>Thrombectomy Eligibility (AHA/ASA 2019)</div>
      {[
        { crit: "Pre-stroke mRS 0–1 (functionally independent)",               status: "required", color: T.teal },
        { crit: "Causative occlusion of ICA or MCA (M1 segment)",              status: "required", color: T.teal },
        { crit: "Age ≥ 18 (benefit shown in elderly)",                          status: "required", color: T.teal },
        { crit: "NIHSS ≥ 6",                                                    status: "required", color: T.teal },
        { crit: "ASPECTS ≥ 6 (Alberta Stroke Program Early CT Score)",          status: "required", color: T.teal },
        { crit: "Treatment within 6h of onset (Class I — strongest evidence)",  status: "standard", color: T.gold },
        { crit: "6–16h with DAWN or DEFUSE-3 criteria (mismatch imaging)",      status: "extended", color: T.amber },
        { crit: "16–24h with DAWN criteria (highly selected patients)",          status: "extended", color: T.coral },
      ].map(({ crit, status, color }) => (
        <div key={crit} style={{ ...G(), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ ...tag(color), fontSize: 9, whiteSpace: "nowrap", flexShrink: 0 }}>{status}</span>
          <span style={{ fontSize: 11.5, color: T.muted }}>{crit}</span>
        </div>
      ))}

      <div style={sL(T.purple)}>Extended Window Trials</div>
      {[
        { trial: "DAWN (2018)",     window: "6–24h", selection: "Clinical-core mismatch · NIHSS ≥ 10 (age < 80) or ≥ 20 (age > 80) · Core infarct < 31mL (age < 80) or < 21mL (age > 80)", nnt: "NNT 2.8 for functional independence" },
        { trial: "DEFUSE-3 (2018)", window: "6–16h", selection: "Perfusion-core mismatch ratio ≥ 1.8 · mismatch volume ≥ 15mL · ischemic core < 70mL · NIHSS ≥ 6", nnt: "NNT 3.6 for functional independence" },
      ].map(({ trial, window, selection, nnt }) => (
        <div key={trial} style={{ ...card({ marginBottom: 9 }) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.purple }}>{trial}</span>
            <span style={{ ...tag(T.purple), fontSize: 10 }}>{window}</span>
          </div>
          <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 5 }}>{selection}</div>
          <div style={{ fontSize: 11.5, color: T.green, fontWeight: 600 }}>{nnt}</div>
        </div>
      ))}

      <div style={sL(T.teal)}>LVO Detection — ED Bedside Signs</div>
      {[
        "NIHSS ≥ 6 → high sensitivity for LVO (72%)",
        "Gaze deviation toward lesion (frontal eye field involvement)",
        "Global aphasia + hemiplegia → likely M1 occlusion (dominant hemisphere)",
        "Dense MCA sign on CT (hyperdense artery)",
        "CT-Angiography is gold standard — order simultaneously with CT head",
      ].map((s, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}>
          <span style={{ color: T.teal }}>▸</span>{s}
        </div>
      ))}

      <div style={sL(T.gold)}>Imaging Protocol</div>
      {[
        { img: "Non-contrast CT Head (STAT)",       purpose: "Rule out hemorrhage · ASPECTS scoring · always first",                          time: "< 25 min from arrival" },
        { img: "CT Angiography (CTA) Head + Neck",  purpose: "LVO detection · vessel anatomy for thrombectomy planning",                      time: "Simultaneously with CT" },
        { img: "CT Perfusion (CTP)",                purpose: "Penumbra vs core infarct · extended window eligibility (DAWN/DEFUSE)",          time: "If extended window suspected" },
        { img: "MRI + DWI (if available)",          purpose: "Most sensitive for early ischemia · wake-up stroke · posterior fossa strokes",   time: "If CT negative + high suspicion" },
      ].map(({ img, purpose, time }) => (
        <div key={img} style={{ ...card({ marginBottom: 8 }) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>{img}</span>
            <span style={{ ...tag(T.teal), fontSize: 9, whiteSpace: "nowrap", marginLeft: 6 }}>{time}</span>
          </div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{purpose}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 3: MANAGEMENT ─────────────────────────────────────────────────────
  const T3 = (
    <div>
      <div style={sL()}>Blood Pressure Targets</div>
      {[
        { scenario: "tPA eligible (pre-treatment)",        target: "≤ 185/110 mmHg before giving tPA",                                  color: T.teal },
        { scenario: "Post-tPA × 24h",                     target: "≤ 180/105 mmHg",                                                    color: T.gold },
        { scenario: "Not tPA eligible (no reperfusion)",   target: "Treat only if > 220/120 · max 15% reduction in 24h",               color: T.amber },
        { scenario: "Post-thrombectomy (successful)",      target: "≤ 180/105 mmHg (same as post-tPA)",                                color: T.blue },
        { scenario: "Large hemispheric infarct risk",      target: "Avoid hypotension — MAP ≥ 70 to maintain penumbral perfusion",     color: T.purple },
      ].map(({ scenario, target, color }) => (
        <div key={scenario} style={{ ...G(), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color, minWidth: 160, flexShrink: 0 }}>{scenario}</div>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.white }}>{target}</div>
        </div>
      ))}

      <div style={aBox(T.coral, 14)}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Permissive Hypertension in Ischemic Stroke</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>DO NOT aggressively lower BP in acute ischemic stroke without reperfusion therapy. Autoregulation is impaired in ischemic tissue — BP supports collateral perfusion of the penumbra.</div>
      </div>

      <div style={sL(T.teal)}>Supportive Stroke Care</div>
      {[
        { item: "Glucose",          detail: "Treat hypoglycemia immediately · target 140–180 mg/dL · avoid hyperglycemia (worsens infarct)",                                            color: T.gold },
        { item: "Temperature",      detail: "Treat fever aggressively (acetaminophen) · target normothermia · fever worsens neuronal injury",                                           color: T.amber },
        { item: "Oxygen",           detail: "Supplement only if SpO₂ < 94% · avoid hyperoxia · no routine O₂ in non-hypoxic patients",                                                color: T.blue },
        { item: "DVT Prophylaxis",  detail: "Mechanical compression from day 1 · hold anticoagulation first 24–48h (tPA) · start pharmacologic based on infarct size/hemorrhagic transformation risk", color: T.teal },
        { item: "Swallowing",       detail: "NPO until swallowing screen passed · NG tube if prolonged dysphagia · aspiration pneumonia prevention",                                   color: T.purple },
        { item: "Positioning",      detail: "Head of bed flat for first 24h (↑ cerebral perfusion) · except if at aspiration risk or elevated ICP",                                   color: T.green },
      ].map(({ item, detail, color }) => (
        <div key={item} style={{ ...G(), padding: "9px 12px", marginBottom: 6, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{item}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{detail}</div>
        </div>
      ))}

      <div style={sL(T.gold)}>Antithrombotic Therapy</div>
      {[
        { ind: "Non-LVO ischemic stroke (no tPA)", tx: "Aspirin 325 mg within 24–48h · dual antiplatelet (aspirin + clopidogrel) for minor stroke or high-risk TIA (POINT trial) × 21 days", color: T.teal },
        { ind: "Post-tPA (24h)",                   tx: "CT/MRI at 24h to exclude hemorrhage → then aspirin ± dual antiplatelet based on mechanism",                                          color: T.gold },
        { ind: "AF-related stroke",                tx: "Anticoagulation (DOAC preferred) — start 4–14 days after stroke depending on infarct size · bridging not recommended",               color: T.purple },
        { ind: "Cardioembolic (non-AF)",           tx: "Anticoagulate after ruling out hemorrhagic transformation · warfarin (mechanical valves) or DOAC (most others)",                    color: T.blue },
        { ind: "Large artery atherosclerosis",     tx: "Dual antiplatelet × 21 days → single antiplatelet long-term · high-intensity statin · strict BP and lipid control",                color: T.amber },
      ].map(({ ind, tx, color }) => (
        <div key={ind} style={{ ...card({ marginBottom: 8, borderLeft: `3px solid ${color}` }) }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 3 }}>{ind}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{tx}</div>
        </div>
      ))}

      <div style={sL(T.coral)}>Door-to-Treatment Time Targets</div>
      {[
        { metric: "Door-to-CT",               target: "≤ 25 minutes",                              color: T.teal },
        { metric: "Door-to-CT interpretation", target: "≤ 45 minutes",                              color: T.gold },
        { metric: "Door-to-needle (tPA)",      target: "≤ 60 minutes",                              color: T.coral },
        { metric: "Door-to-puncture (EVT)",    target: "≤ 90 minutes",                              color: T.purple },
        { metric: "Onset-to-tPA",              target: "≤ 4.5 hours",                               color: T.amber },
        { metric: "Onset-to-puncture",         target: "≤ 6h standard · ≤ 24h selected (DAWN/DEFUSE)", color: T.blue },
      ].map(({ metric, target, color }) => (
        <div key={metric} style={{ ...G(), padding: "9px 12px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: T.muted }}>{metric}</span>
          <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color }}>{target}</span>
        </div>
      ))}

      <div style={sL(T.purple)}>Disposition</div>
      <div style={{ ...card() }}>
        {[
          { level: "Stroke Unit / Neuro ICU", detail: "All tPA patients · thrombectomy · large hemispheric infarct · posterior fossa (brainstem/cerebellar) · declining neuro status" },
          { level: "Monitored Stroke Bed",    detail: "Moderate stroke not receiving IV tPA · AF requiring anticoagulation decision · need for cardiac monitoring (telemetry 24h minimum)" },
          { level: "Neurology Consult",       detail: "All acute ischemic strokes · tPA decisions · thrombectomy triage · secondary prevention planning · etiological workup" },
          { level: "Neurosurgery",            detail: "Large cerebellar infarct (compression risk) · hydrocephalus · malignant MCA syndrome (hemicraniectomy in < 60 years)" },
          { level: "Rehab / PT/OT",           detail: "Begin within 24h of admission for stable patients · early mobilization reduces complications" },
        ].map(({ level, detail }, i) => (
          <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: i < 4 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, minWidth: 150, flexShrink: 0 }}>{level}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(167,139,250,0.09) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(59,130,246,0.08) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>

      <div style={{ padding: "20px 20px 0" }}>
        <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 16 }}>
          ← Critical Protocols
        </button>
        <div>
          <span style={pill("linear-gradient(135deg,#a78bfa,#6d28d9)")}>🧠 Neurologic</span>
          <span style={pill("linear-gradient(135deg,#0d9488,#065f46)")}>AHA/ASA 2019</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>Acute Ischemic Stroke</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>BE-FAST · NIHSS calculator · tPA eligibility + dosing · LVO thrombectomy · DAWN/DEFUSE-3 · BP targets</p>
      </div>

      <div style={{ display: "flex", gap: 4, padding: "0 20px", marginBottom: 18, overflowX: "auto", scrollbarWidth: "none" }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: "7px 15px", borderRadius: 9, border: `1.5px solid ${tab === i ? T.purple : T.border}`, background: tab === i ? "rgba(167,139,250,0.14)" : T.glass, color: tab === i ? T.purple : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, whiteSpace: "nowrap", transition: "all 0.18s", backdropFilter: "blur(8px)" }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 20px" }}>
        {tab === 0 && T0}
        {tab === 1 && T1}
        {tab === 2 && T2}
        {tab === 3 && T3}
      </div>
    </div>
  );
}