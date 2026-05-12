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

const SCAI_STAGES = [
  { stage: "A — At Risk",       color: T.green,  bg: "rgba(34,197,94,0.08)",   mortality: "~3%",  desc: "No CS yet · risk factors present (large MI, prior HF, worsening hemodynamics)", hemodynamics: "SBP > 100 · normal perfusion · lactate < 2", mgmt: "Optimize medical therapy · monitor closely" },
  { stage: "B — Beginning",     color: T.teal,   bg: "rgba(20,184,166,0.08)",  mortality: "~8%",  desc: "Relative hypotension or tachycardia without hypoperfusion", hemodynamics: "SBP < 90 or MAP < 60 · JVD or rales · lactate < 2", mgmt: "Volume assessment · consider low-dose vasopressor" },
  { stage: "C — Classic",       color: T.gold,   bg: "rgba(245,158,11,0.08)",  mortality: "~25%", desc: "Hypoperfusion requiring intervention beyond volume", hemodynamics: "SBP < 90 · lactate ≥ 2 · UO < 30 mL/h · altered mentation", mgmt: "Vasopressor + inotrope · early cath lab · MCS consideration" },
  { stage: "D — Deteriorating", color: T.amber,  bg: "rgba(251,146,60,0.08)",  mortality: "~40%", desc: "Failed initial stabilization · escalating support required", hemodynamics: "Persistent shock despite escalating vasopressors · rising lactate", mgmt: "MCS escalation · IABP/Impella · consider ECMO · transfer if needed" },
  { stage: "E — Extremis",      color: T.coral,  bg: "rgba(244,63,94,0.09)",   mortality: "~75%", desc: "Cardiac collapse · CPR · refractory", hemodynamics: "PEA/VF · pH < 7.2 · lactate > 8 · refractory arrest", mgmt: "ECPR consideration · aggressive MCS · goals of care discussion" },
];

const CAUSES = [
  { cause: "Acute MI / STEMI",              freq: "Most common (~80%)",         color: T.coral,  tx: "Emergent PCI / revascularization — do NOT delay for hemodynamic stabilization" },
  { cause: "Acute Decompensated HF",        freq: "Chronic HF exacerbation",    color: T.blue,   tx: "Inotropes · diuresis after perfusion restored · address precipitant" },
  { cause: "Myocarditis",                   freq: "Viral / autoimmune",         color: T.purple, tx: "Immunosuppression if giant cell myocarditis · MCS bridge to recovery" },
  { cause: "Takotsubo (Stress CMP)",        freq: "Emotional/physical stress",  color: T.teal,   tx: "Supportive · avoid catecholamines (worsen apical ballooning) · typically recovers" },
  { cause: "Acute Valvular Emergency",      freq: "Acute MR · AS · AR",         color: T.gold,   tx: "Emergent surgical/transcatheter intervention · IABP for MR · urgent echo" },
  { cause: "RV Failure / Massive PE",       freq: "RV infarct · PE",            color: T.amber,  tx: "Avoid aggressive LV preload reduction · RV inotropes · consider thrombolytics/thrombectomy" },
  { cause: "Cardiac Tamponade",             freq: "Post-MI · post-procedure",   color: T.green,  tx: "Pericardiocentesis · surgical drainage if clot · never give aggressive IVF" },
];

const MCS_OPTIONS = [
  {
    device: "IABP (Intra-Aortic Balloon Pump)", color: T.teal,
    support: "0.5 L/min CO augmentation (modest)", timing: "Diastolic inflation / systolic deflation",
    use: "LV afterload reduction · augments diastolic coronary perfusion · STEMI-CS most evidence (though IABP-SHOCK II neutral)",
    limit: "Requires regular rhythm · contraindicated in aortic regurgitation or aortic dissection",
  },
  {
    device: "Impella CP / 5.5", color: T.blue,
    support: "2.5–5.5 L/min CO (Impella CP 3.5 / 5.5 max)", timing: "Continuous axial flow across aortic valve",
    use: "More powerful than IABP · LV unloading · STEMI-CS · high-risk PCI support · bridge to recovery or LVAD/transplant",
    limit: "Arterial access required · contraindicated in aortic stenosis (severe) · mechanical MV · LV thrombus · needs echocardiographic guidance",
  },
  {
    device: "VA-ECMO (Veno-Arterial)", color: T.coral,
    support: "3–7 L/min full circulatory support", timing: "Continuous extracorporeal bypass",
    use: "Massive cardiogenic shock · cardiac arrest (ECPR) · bridge to decision · Stage D–E SCAI",
    limit: "Does NOT directly unload LV (may worsen LV distension) · Impella + ECMO (ECPELLA) for combined support · complex cannulation · vascular complications · team expertise required",
  },
  {
    device: "TandemHeart", color: T.purple,
    support: "3.5–4.5 L/min", timing: "Trans-septal left atrial drainage → femoral artery",
    use: "LV unloading · high-risk PCI · alternative to Impella if aortic valve pathology",
    limit: "Trans-septal puncture required · technically complex · less widely used",
  },
];

export default function CardiogenicShockHub({ onBack }) {
  const navigate = useNavigate();
  const handleBack = () => onBack ? onBack() : navigate("/CriticalProtocolsPage");

  const [tab, setTab]     = useState(0);
  const [scaiStage, setScaiStage] = useState(null);
  const [causeExpanded, setCauseExpanded] = useState(null);
  const [mcsExpanded, setMcsExpanded]     = useState(null);
  const TABS = ["Recognition", "Treatment", "MCS Devices", "Monitoring"];

  // ── TAB 0: RECOGNITION ──────────────────────────────────────────────────
  const T0 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Cardiogenic Shock — Pump Failure Causing End-Organ Hypoperfusion</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>In-hospital mortality 40–50%. STEMI-CS requires emergent revascularization regardless of hemodynamic status. Early MCS escalation before irreversible end-organ damage is key.</div>
      </div>

      <div style={sL()}>Diagnostic Criteria</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>All three criteria required</div>
        {[
          { crit: "Hypotension", detail: "SBP < 90 mmHg for ≥ 30 min OR vasopressor requirement to maintain SBP ≥ 90", color: T.coral },
          { crit: "Reduced Cardiac Output", detail: "CI < 2.2 L/min/m² (on PA catheter) OR clinical signs of low CO (cool extremities · narrow pulse pressure · altered mentation)", color: T.amber },
          { crit: "End-Organ Hypoperfusion", detail: "UO < 0.5 mL/kg/h · lactate ≥ 2 mmol/L · altered mental status · cold/mottled extremities · CRT > 3 sec", color: T.gold },
        ].map(({ crit, detail, color }, i) => (
          <div key={crit} style={{ ...G({ borderRadius: 9, marginBottom: 7 }), padding: "10px 12px", borderLeft: `3px solid ${color}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{crit}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{detail}</div>
          </div>
        ))}
        <div style={{ fontSize: 11, color: T.dim, marginTop: 4 }}>Note: Some patients have CS without initial hypotension — "normotensive CS" — rely on end-organ markers</div>
      </div>

      <div style={sL()}>SCAI Shock Classification — tap to expand</div>
      {SCAI_STAGES.map(s => (
        <div key={s.stage}
          style={{ ...G(), padding: "12px 14px", marginBottom: 8, border: `1.5px solid ${scaiStage === s.stage ? s.color + "70" : T.border}`, background: scaiStage === s.stage ? s.bg : T.glass, cursor: "pointer", transition: "all 0.2s" }}
          onClick={() => setScaiStage(scaiStage === s.stage ? null : s.stage)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 800, color: s.color }}>{s.stage}</span>
              <span style={{ fontSize: 11.5, color: T.muted }}>{s.desc.split("·")[0]}</span>
            </div>
            <span style={{ ...tag(s.color), fontSize: 9 }}>Mortality {s.mortality}</span>
          </div>
          {scaiStage === s.stage && (
            <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${s.color}30` }}>
              <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 6 }}>{s.desc}</div>
              <div style={{ fontSize: 11.5, color: T.dim, marginBottom: 8 }}><span style={{ color: s.color, fontWeight: 600 }}>Hemodynamics: </span>{s.hemodynamics}</div>
              <div style={aBox(s.color, 0)}>
                <div style={{ fontSize: 11, fontWeight: 700, color: s.color, marginBottom: 2 }}>Management</div>
                <div style={{ fontSize: 11.5, color: T.muted }}>{s.mgmt}</div>
              </div>
            </div>
          )}
        </div>
      ))}

      <div style={sL(T.gold)}>Causes — tap to expand</div>
      {CAUSES.map(({ cause, freq, color, tx }) => {
        const open = causeExpanded === cause;
        return (
          <div key={cause} style={{ ...G(), padding: "11px 14px", marginBottom: 7, border: `1.5px solid ${open ? color + "60" : T.border}`, background: open ? color + "0a" : T.glass, cursor: "pointer", transition: "all 0.18s" }}
            onClick={() => setCauseExpanded(open ? null : cause)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color }}>{cause}</span>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 10, color: T.dim }}>{freq}</span>
                <span style={{ fontSize: 13, color: open ? color : T.dim }}>{open ? "▲" : "▼"}</span>
              </div>
            </div>
            {open && (
              <div style={{ marginTop: 8, paddingTop: 6, borderTop: `1px solid ${color}30` }}>
                <div style={aBox(color, 0)}>
                  <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 2 }}>Treatment Priority</div>
                  <div style={{ fontSize: 11.5, color: T.muted }}>{tx}</div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ── TAB 1: TREATMENT ────────────────────────────────────────────────────
  const T1 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Simultaneous Stabilization + Revascularization</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>For STEMI-CS: activate cath lab immediately. Do NOT delay PCI for hemodynamic stabilization — revascularization IS the treatment. Use vasopressors to bridge.</div>
      </div>

      <div style={sL()}>Immediate Priorities</div>
      {[
        { n: 1, label: "Activate Cath Lab (if STEMI / ACS)",             detail: "Goal door-to-balloon ≤ 90 min · CS does not change revascularization priority — it increases it · multi-vessel PCI: culprit only initially (CULPRIT-SHOCK trial)", color: T.coral },
        { n: 2, label: "Hemodynamic Monitoring",                         detail: "Arterial line (continuous BP) · CVP line · consider PA catheter for SCAI C–D · echo (POCUS) for rapid LV/RV assessment · Foley for UO", color: T.teal },
        { n: 3, label: "Vasopressor — Norepinephrine",                   detail: "First-line vasopressor (SOAP II) · 0.1–0.5 mcg/kg/min titrate to MAP ≥ 65 · Dopamine associated with higher arrhythmia rate — avoid", color: T.gold },
        { n: 4, label: "Inotrope — Dobutamine",                          detail: "2–20 mcg/kg/min for low cardiac output · add to norepinephrine if persistent low CO · milrinone if beta-blocked (PDE inhibitor not receptor-dependent) · arrhythmia risk", color: T.amber },
        { n: 5, label: "MCS (Mechanical Circulatory Support)",            detail: "SCAI C–D: IABP or Impella · SCAI D–E: consider ECMO · early MCS before irreversible end-organ damage · SHOCK trial: revascularization + IABP improved outcomes", color: T.purple },
        { n: 6, label: "Treat Underlying Cause",                         detail: "STEMI → PCI · Tamponade → pericardiocentesis · Massive PE → lytics/thrombectomy · Acute MR/VSD → emergent surgical repair", color: T.blue },
      ].map(({ n, label, detail, color }) => (
        <div key={n} style={{ ...card({ marginBottom: 8 }), display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: color + "22", border: `1.5px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color, flexShrink: 0 }}>{n}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
          </div>
        </div>
      ))}

      <div style={sL(T.teal)}>Vasoactive Drug Reference</div>
      {[
        { drug: "Norepinephrine",   dose: "0.01–0.5 mcg/kg/min",     moa: "α1 + β1 · vasopressor + mild inotrope",      best: "First-line CS vasopressor (SOAP II) · MAP support", color: T.coral },
        { drug: "Dobutamine",       dose: "2–20 mcg/kg/min",         moa: "β1 agonist · positive inotropy + vasodilation", best: "Low CO with adequate BP · combine with NE if hypotensive", color: T.amber },
        { drug: "Milrinone",        dose: "0.125–0.75 mcg/kg/min", moa: "PDE-3 inhibitor · inotrope + vasodilator",      best: "Beta-blocked patients · pulmonary HTN · RV failure · caution in hypotension", color: T.purple },
        { drug: "Vasopressin",      dose: "0.01–0.04 U/min (fixed)", moa: "V1 receptor · pure vasopressor",              best: "Adjunct to NE for refractory vasoplegia · saves NE dose", color: T.gold },
        { drug: "Epinephrine",      dose: "0.01–0.5 mcg/kg/min",    moa: "α + β · vasopressor + strong inotrope",       best: "Refractory CS · bridge to MCS or cardiac arrest · tachyarrhythmia risk high", color: T.blue },
        { drug: "Dopamine",         dose: "2–20 mcg/kg/min",        moa: "Dopaminergic + β + α (dose-dependent)",      best: "Avoid — higher arrhythmia rate than NE (SOAP II trial) · use only if NE unavailable", color: T.teal },
      ].map(({ drug, dose, moa, best, color }) => (
        <div key={drug} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color }}>{drug}</span>
            <span style={{ fontFamily: T.mono, fontSize: 11, color }}>{dose}</span>
          </div>
          <div style={{ fontSize: 11, color: T.dim, marginBottom: 2 }}>{moa}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{best}</div>
        </div>
      ))}

      <div style={sL(T.gold)}>Evidence Pearls</div>
      {[
        { trial: "CULPRIT-SHOCK (2017)", finding: "Culprit-only PCI during STEMI-CS → lower 30-day mortality and renal replacement therapy vs immediate multi-vessel PCI. Stage non-culprit vessels.", color: T.coral },
        { trial: "SOAP II (2010)",       finding: "Norepinephrine vs dopamine in CS: NE associated with fewer arrhythmias (24.1% vs 12.4%) and lower 28-day mortality subgroup. NE is first-line.", color: T.gold },
        { trial: "IABP-SHOCK II (2012)", finding: "IABP vs no IABP in STEMI-CS: no mortality benefit. IABP downgraded but still used as bridge and for hemodynamic stabilization.", color: T.teal },
        { trial: "SHOCK Trial (1999)",   finding: "Early revascularization vs initial medical stabilization in STEMI-CS: 6-month mortality benefit with early revascularization. Established standard of care.", color: T.blue },
      ].map(({ trial, finding, color }) => (
        <div key={trial} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{trial}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{finding}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 2: MCS DEVICES ──────────────────────────────────────────────────
  const T2 = (
    <div>
      <div style={aBox(T.purple, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, marginBottom: 2 }}>Mechanical Circulatory Support — Escalation Ladder</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>MCS decision should be early — before refractory shock, multi-organ failure, or cardiac arrest. Each device has different hemodynamic effects, access requirements, and support levels.</div>
      </div>

      <div style={sL()}>MCS Escalation by SCAI Stage</div>
      {[
        { stage: "SCAI C",   device: "IABP or Impella CP",                color: T.gold },
        { stage: "SCAI D",   device: "Impella 5.0/5.5 or IABP + Inotrope", color: T.amber },
        { stage: "SCAI E",   device: "VA-ECMO ± Impella (ECPELLA)",         color: T.coral },
      ].map(({ stage, device, color }) => (
        <div key={stage} style={{ ...G({ borderRadius: 9 }), padding: "10px 14px", marginBottom: 7, display: "flex", gap: 14, alignItems: "center", borderLeft: `3px solid ${color}` }}>
          <div style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 800, color, minWidth: 65 }}>{stage}</div>
          <div style={{ fontSize: 12, color: T.white }}>{device}</div>
        </div>
      ))}

      <div style={sL()}>Device Details — tap to expand</div>
      {MCS_OPTIONS.map(({ device, color, support, timing, use, limit }) => {
        const open = mcsExpanded === device;
        return (
          <div key={device} style={{ ...G(), padding: "12px 14px", marginBottom: 9, border: `1.5px solid ${open ? color + "65" : T.border}`, background: open ? color + "0d" : T.glass, cursor: "pointer", transition: "all 0.2s" }}
            onClick={() => setMcsExpanded(open ? null : device)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color }}>{device}</span>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ ...tag(color), fontSize: 9 }}>{support}</span>
                <span style={{ fontSize: 13, color: open ? color : T.dim }}>{open ? "▲" : "▼"}</span>
              </div>
            </div>
            {open && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${color}30` }}>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Mechanism / Timing</div>
                  <div style={{ fontSize: 11.5, color: T.muted }}>{timing}</div>
                </div>
                <div style={aBox(T.green, 10)}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: T.green, marginBottom: 2 }}>Best Use</div>
                  <div style={{ fontSize: 11.5, color: T.muted }}>{use}</div>
                </div>
                <div style={aBox(T.coral, 0)}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Limitations / Contraindications</div>
                  <div style={{ fontSize: 11.5, color: T.muted }}>{limit}</div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div style={sL(T.coral)}>ECPELLA — VA-ECMO + Impella Combined</div>
      <div style={{ ...card({ background: "rgba(244,63,94,0.07)", borderColor: "rgba(244,63,94,0.3)", marginBottom: 14 }) }}>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.6 }}>
          VA-ECMO alone increases LV afterload → LV distension → elevated filling pressures → pulmonary edema. Adding Impella decompresses the LV (unloads), reducing pulmonary edema and improving myocardial recovery. The combination (ECPELLA) provides maximum support in refractory CS/ECPR situations.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          <span style={tag(T.coral)}>Refractory SCAI D–E</span>
          <span style={tag(T.purple)}>ECPR (cardiac arrest + ECMO)</span>
          <span style={tag(T.blue)}>Bridge to decision/transplant</span>
        </div>
      </div>

      <div style={sL(T.teal)}>Right Ventricular Failure — Special Considerations</div>
      <div style={{ ...card() }}>
        {["RV infarct or RV-dominant failure → avoid LV preload reduction (NTG, diuretics) — RV needs preload",
          "Inhaled pulmonary vasodilators: inhaled nitric oxide (iNO) or inhaled epoprostenol — reduce RV afterload",
          "RV-specific inotropes: dobutamine + low-dose vasopressin (maintain SVR without increasing PVR)",
          "Impella RP: right-sided Impella for RV failure — percutaneous · limited availability",
          "VA-ECMO with percutaneous RVAD for biventricular failure"].map((t, i) => (
          <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: i < 4 ? 7 : 0, lineHeight: 1.4 }}>
            <span style={{ color: T.teal, flexShrink: 0 }}>▸</span>{t}
          </div>
        ))}
      </div>
    </div>
  );

  // ── TAB 3: MONITORING ───────────────────────────────────────────────────
  const T3 = (
    <div>
      <div style={sL()}>Hemodynamic Targets</div>
      {[
        { param: "MAP",             target: "≥ 65 mmHg (higher if baseline hypertensive · ≥ 70 for end-organ perfusion)", color: T.green },
        { param: "CI (Cardiac Index)", target: "≥ 2.2 L/min/m² (PA catheter goal)",                                      color: T.teal },
        { param: "Lactate",         target: "Trending down · < 2 mmol/L at 6h (clearance ≥ 10%/2h)",                      color: T.gold },
        { param: "Urine Output",    target: "≥ 0.5 mL/kg/h (renal perfusion marker)",                                     color: T.blue },
        { param: "ScvO₂",           target: "≥ 65% (mixed venous — reflects tissue O₂ extraction)",                       color: T.purple },
        { param: "PCWP",            target: "14–18 mmHg (PA catheter · avoid congestion and low preload)",                 color: T.amber },
      ].map(({ param, target, color }) => (
        <div key={param} style={{ ...G(), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, minWidth: 120, flexShrink: 0 }}>{param}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{target}</div>
        </div>
      ))}

      <div style={sL()}>Monitoring Schedule</div>
      {[
        { freq: "Every 15 min",  items: "BP (arterial line) · HR · SpO₂ · mental status · UO",                color: T.coral },
        { freq: "Every 1–2h",   items: "Vasopressor titration · end-organ assessment · lactate",                 color: T.gold },
        { freq: "Every 4h",     items: "BMP (creatinine · K⁺) · ABG · PA catheter readings (if placed)",         color: T.teal },
        { freq: "Every 6–12h",  items: "Lactate trend · LFTs · coagulation · CBC · troponin · echo if deteriorating", color: T.green },
        { freq: "Continuous",   items: "Arterial BP · cardiac monitor · SpO₂ · EtCO₂ if intubated",               color: T.purple },
      ].map(({ freq, items, color }) => (
        <div key={freq} style={{ ...G(), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, fontWeight: 700, color, minWidth: 100, flexShrink: 0 }}>{freq}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{items}</div>
        </div>
      ))}

      <div style={sL(T.coral)}>Escalation Triggers</div>
      {["Lactate rising or not clearing at 6h → escalate MCS · reassess vasopressor dose · check for missed cause",
        "Urine output < 0.3 mL/kg/h despite MAP ≥ 65 → consider PA catheter · adjust preload/afterload",
        "SCAI stage worsening (B→C or C→D) → proactive MCS implantation before Stage E",
        "Refractory VT/VF → anti-arrhythmic therapy (amiodarone) · electrolyte correction · consider ablation",
        "Rising troponin despite revascularization → stunned vs infarcted myocardium · reassess anatomy"].map((t, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 7, lineHeight: 1.4 }}>
          <span style={{ color: T.coral, flexShrink: 0 }}>⚠</span>{t}
        </div>
      ))}

      <div style={sL(T.purple)}>Goals of Care</div>
      <div style={{ ...card() }}>
        {[
          { phase: "Bridge to Recovery",      desc: "Reversible cause (myocarditis · Takotsubo · ischemia with successful revascularization) · expectation of native cardiac recovery with temporary MCS" },
          { phase: "Bridge to Decision",       desc: "Uncertain prognosis · need time for organ recovery assessment · high-risk patient · use MCS to stabilize while evaluating options" },
          { phase: "Bridge to Transplant",     desc: "End-stage HF · not expected to recover · listed for cardiac transplant · temporary MCS as bridge (ECMO · short-term Impella)" },
          { phase: "Bridge to LVAD (Durable)", desc: "Not transplant candidate but expected to survive with LVAD · HeartMate 3 / HVAD · durable MCS" },
          { phase: "Palliative / Comfort",     desc: "Multi-organ failure · irreversible neurologic injury · age/comorbidities preclude meaningful recovery · shift goals to comfort measures" },
        ].map(({ phase, desc }, i) => (
          <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: i < 4 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, minWidth: 140, flexShrink: 0 }}>{phase}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{desc}</div>
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
          <span style={pill("linear-gradient(135deg,#f43f5e,#be185d)")}>🚨 Resuscitation</span>
          <span style={pill("linear-gradient(135deg,#1d4ed8,#1e3a8a)")}>SCAI / ACC</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>Cardiogenic Shock</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>SCAI classification · CULPRIT-SHOCK · Vasopressor/inotrope selection · IABP · Impella · VA-ECMO · Goals of care</p>
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
        {tab === 0 && T0}
        {tab === 1 && T1}
        {tab === 2 && T2}
        {tab === 3 && T3}
      </div>
    </div>
  );
}