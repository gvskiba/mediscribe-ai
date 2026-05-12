import { useState } from "react";

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
const sL   = (c = T.green) => ({ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: c, margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 8 });
const dv   = { height: 1, background: T.border, margin: "10px 0" };

export default function PostPartumHemorrhageHub({ onBack }) {
  const [tab, setTab]     = useState(0);
  const [cause, setCause] = useState(null);
  const TABS = ["Recognition", "Immediate Management", "Surgical Causes", "Massive Transfusion"];

  const CAUSES = [
    {
      id: "atony", name: "Uterine Atony", color: T.amber, icon: "🫘",
      freq: "50–60% of primary PPH",
      mech: "Failure of uterine muscle to contract after placental delivery → placental site vessels remain patent → continued bleeding",
      features: "Soft, boggy, enlarged uterus · heavy vaginal bleeding immediately after delivery · may have retained products or clots in uterus",
      risk: "Prolonged labor · augmentation/induction · operative delivery (forceps/vacuum) · obesity · multiparity · chorioamnionitis",
      tx: "Fundal massage · IV oxytocin 10 units IV or IM · continue massage until firm · methylergonovine 0.2 mg IM (if BP controlled) · carboprost 250 mcg IM q 15 min (max 8 doses) · consider tranexamic acid · OR for refractory cases",
    },
    {
      id: "placenta", name: "Placental Disorders", color: T.coral, icon: "🩸",
      freq: "~5–10% of primary PPH",
      mech: "Abnormal placentation (accreta/increta/percreta) or retained placental products → failure of hemostasis at placental site",
      features: "Excessive bleeding with attempted placental removal · placental tissue adherent to uterine wall · retained placental fragments visible on ultrasound · fever + foul lochia if infected",
      risk: "Prior cesarean · uterine curettage · placenta previa/abruption · advanced maternal age",
      tx: "Manual exploration of uterus · remove retained products · avoid aggressive curettage (risk of perforation) · oxytocin infusion · if placenta accreta → proceed to OR for hysterectomy",
    },
    {
      id: "laceration", name: "Genital Tract Trauma", color: T.purple, icon: "🔴",
      freq: "~20–25% of PPH",
      mech: "Lacerations of cervix · vagina · perineum · or bladder from delivery trauma → direct bleeding from vessels",
      features: "Continuous bright bleeding despite contracted uterus · bleeding from specific laceration site on examination · perineal swelling/ecchymosis",
      risk: "Operative delivery (forceps/vacuum) · macrosomia · precipitous delivery · episiotomy",
      tx: "Visualization with good lighting · repair of cervical/vaginal lacerations under direct visualization · 2-0 or 3-0 absorbable suture · for complex injuries → OB consult or OR",
    },
    {
      id: "coagulopathy", name: "Coagulopathy", color: T.blue, icon: "⚗️",
      freq: "~5–10% of PPH (may be multifactorial)",
      mech: "DIC from placental abruption · amniotic fluid embolism · or massive transfusion → consumption of platelets and clotting factors · impaired hemostasis",
      features: "Oozing from IV sites · echymoses · persistent heavy bleeding despite uterotonic agents · abnormal PT/INR · low platelets · low fibrinogen",
      risk: "Placental abruption · preeclampsia/HELLP · amniotic fluid embolism · massive hemorrhage",
      tx: "Type & crossmatch · CBC · PT/INR · fibrinogen · activate massive transfusion protocol if ongoing bleeding · fresh frozen plasma · platelets · cryoprecipitate · consider TXA",
    },
    {
      id: "inversion", name: "Uterine Inversion", color: T.gold, icon: "↩️",
      freq: "~1 in 2,500–5,000 deliveries",
      mech: "Uterine fundus inverts into uterine cavity during third stage (usually from excessive traction on cord or fundus) → loss of uterine tone · direct blood loss · shock",
      features: "Sudden large vaginal bleeding with expulsion of fundus through cervix · severe pain · maternal shock · palpable mass in vagina or at introitus",
      risk: "Excessive cord traction · retained placenta · uterine atony · placental removal before adequate contraction",
      tx: "EMERGENCY: Do NOT delay · call anesthesia/OB stat · place large-bore IV · start aggressive fluid resuscitation · DO NOT attempt to remove placenta before replacement of uterus · reposition uterus with hand elevation (Johnson maneuver) · give tocolytics (terbutaline/nifedipine) to relax uterus · may need anesthesia assistance · oxytocin after successful replacement",
    },
    {
      id: "amniotic", name: "Amniotic Fluid Embolism", color: T.teal, icon: "⚡",
      freq: "Rare (1 in 40,000) but often fatal",
      mech: "Amniotic fluid enters maternal circulation during labor/delivery → anaphylactic-type reaction → pulmonary vasoconstriction · RV failure · DIC · cardiovascular collapse",
      features: "Sudden onset dyspnea · chest pain · hypotension · altered mental status · seizures · cardiac arrest · often during active labor or immediately post-delivery · profound DIC",
      risk: "Operative delivery · cesarean · placental abruption · uterine rupture · polyhydramnios",
      tx: "EMERGENCY: ABCs · high-flow O₂ · IV access · epinephrine IM/IV if cardiac arrest · aggressive fluid resuscitation · prepare for ICU · activate massive transfusion protocol · treat DIC with FFP/cryoprecipitate · ECMO if available",
    },
  ];

  const selCause = CAUSES.find(c => c.id === cause);

  // ── TAB 0: RECOGNITION ──────────────────────────────────────────────────
  const T0 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Postpartum Hemorrhage — Time to Treatment is Critical</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>PPH is the leading cause of maternal death worldwide. Primary PPH occurs within 24h of delivery · secondary PPH within 24h to 12 weeks. Recognition relies on quantified blood loss assessment + maternal vital signs + clinical context. Early intervention prevents mortality.</div>
      </div>

      <div style={sL(T.coral)}>Blood Loss Classification (ACOG)</div>
      {[
        { grade: "Grade 1", loss: "≤ 500 mL", signs: "Normal vitals · minimal symptoms · normal CBC", tx: "Routine care", color: T.teal },
        { grade: "Grade 2", loss: "500–1000 mL", signs: "Tachycardia (100–120) · mild BP drop · anxiety · cool extremities", tx: "IV fluids · monitor · consider transfusion if ongoing", color: T.gold },
        { grade: "Grade 3", loss: "1000–1500 mL", signs: "Marked tachycardia (>120) · systolic BP drop 15–30 mmHg · confusion · oliguria starting", tx: "Activate massive transfusion · aggressive resuscitation · identify source", color: T.amber },
        { grade: "Grade 4", loss: "> 1500 mL", signs: "Severe shock · SBP < 90 · unresponsive · severe oliguria/anuria", tx: "EMERGENCY · massive transfusion protocol · OR readiness · ICU", color: T.coral },
      ].map(({ grade, loss, signs, tx, color }) => (
        <div key={grade} style={{ ...card({ marginBottom: 8, borderLeft: `3px solid ${color}` }) }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 3 }}>{grade} — {loss}</div>
          <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 5 }}><span style={{ fontWeight: 600, color }}>Signs: </span>{signs}</div>
          <div style={aBox(color, 0)}>
            <div style={{ fontSize: 11, fontWeight: 700, color }}>Management</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{tx}</div>
          </div>
        </div>
      ))}

      <div style={sL()}>Etiology Selector — tap for details</div>
      {CAUSES.map(c => (
        <div key={c.id}
          style={{ ...G(), padding: "12px 14px", marginBottom: 8, border: `1.5px solid ${cause === c.id ? c.color + "70" : T.border}`, background: cause === c.id ? c.color + "0d" : T.glass, cursor: "pointer", transition: "all 0.2s" }}
          onClick={() => setCause(cause === c.id ? null : c.id)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 18 }}>{c.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: c.color }}>{c.name}</div>
                <div style={{ fontSize: 10, color: T.dim }}>{c.freq}</div>
              </div>
            </div>
            <span style={{ fontSize: 13, color: cause === c.id ? c.color : T.dim }}>{cause === c.id ? "▲" : "▼"}</span>
          </div>
          {cause === c.id && (
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${c.color}30` }}>
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Mechanism</div>
                <div style={{ fontSize: 11.5, color: T.muted }}>{c.mech}</div>
              </div>
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Clinical Features</div>
                <div style={{ fontSize: 11.5, color: T.muted }}>{c.features}</div>
              </div>
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Risk Factors</div>
                <div style={{ fontSize: 11.5, color: T.muted }}>{c.risk}</div>
              </div>
              <div style={aBox(c.color, 0)}>
                <div style={{ fontSize: 11, fontWeight: 700, color: c.color, marginBottom: 2 }}>Treatment</div>
                <div style={{ fontSize: 11.5, color: T.muted }}>{c.tx}</div>
              </div>
            </div>
          )}
        </div>
      ))}

      <div style={sL(T.blue)}>Red Flags — Assume PPH Severity</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 7 }}>
        {[
          { flag: "Tachycardia > 100", detail: "Even with normal BP — early sign of hypovolemia", color: T.coral },
          { flag: "Altered mental status", detail: "Confusion · anxiety · restlessness = poor perfusion", color: T.coral },
          { flag: "Persistent heavy bleeding", detail: "Despite uterotonic agents · consider surgical cause", color: T.amber },
          { flag: "Signs of shock", detail: "Cool extremities · weak pulses · oliguria = Class III–IV", color: T.coral },
          { flag: "Rigid / tender abdomen", detail: "Possible uterine rupture or inversion", color: T.purple },
          { flag: "Oozing from IV sites", detail: "Suggests DIC — activate massive transfusion", color: T.blue },
        ].map(({ flag, detail, color }) => (
          <div key={flag} style={{ ...G({ borderRadius: 9 }), padding: "9px 11px", borderLeft: `3px solid ${color}` }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color, marginBottom: 2 }}>{flag}</div>
            <div style={{ fontSize: 11, color: T.muted }}>{detail}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── TAB 1: IMMEDIATE MANAGEMENT ──────────────────────────────────────────
  const T1 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Hemorrhage Control Algorithm</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Time-sensitive: activate help immediately · large-bore IV access · continuous monitoring · quantify blood loss · identify source · provide resuscitation. First 30 min are critical.</div>
      </div>

      <div style={sL()}>Immediate Action Steps</div>
      {[
        { step: "1. Call for Help", detail: "OB provider · anesthesia · blood bank · OR team standby · activate emergency protocol", color: T.coral },
        { step: "2. Large-bore IV Access", detail: "≥ 18G (preferably 16G or larger) · 2 lines minimum · send for type & cross · CBC · PT/INR · fibrinogen", color: T.teal },
        { step: "3. Assess Bleeding Source", detail: "Inspect placental site · check for retained products · digital exam for lacerations · assess uterine tone · palpate for inversion/rupture", color: T.gold },
        { step: "4. Fundal Massage", detail: "If atony suspected · firm bimanual massage · express clots · repeat if uterus becomes atonic · continue until firm", color: T.purple },
        { step: "5. Uterotonic Agents", detail: "Oxytocin 10 units IV/IM · methylergonovine 0.2 mg IM (avoid if hypertensive) · carboprost 250 mcg IM q 15 min · avoid concurrent use of methylergonovine + carboprost", color: T.blue },
        { step: "6. IV Fluids & Blood Products", detail: "Warm IV fluids · prepare PRBC · follow massive transfusion protocol if ongoing loss > 1000 mL", color: T.amber },
      ].map(({ step, detail, color }) => (
        <div key={step} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{step}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
        </div>
      ))}

      <div style={sL(T.teal)}>Uterotonic Medications</div>
      {[
        { drug: "Oxytocin (Pitocin)",         dose: "10 units IM or IV push · then 10–40 units in 500 mL saline at 10–40 mU/min", onset: "IV: immediate · IM: 3–5 min", note: "First-line · avoid rapid IV push (hypotension)", color: T.teal },
        { drug: "Methylergonovine (Methergine)", dose: "0.2 mg IM · repeat q 2–4 h PRN (max 5 doses)", onset: "IM: 2–5 min · PO: 6–15 min", note: "Avoid if SBP > 140 or diastolic > 90 · caution in coronary disease", color: T.gold },
        { drug: "Carboprost (Hemabate)",      dose: "250 mcg IM · repeat q 15 min (max 8 doses / 2 mg)", onset: "IM: 5–10 min", note: "Bronchospasm risk in asthma/COPD · avoid concurrent methylergonovine", color: T.purple },
        { drug: "Misoprostol (Cytotec)",      dose: "800 mcg PR (rectal) · PO 400–600 mcg", onset: "Slow (20–30 min)", note: "Less effective than IV agents · diarrhea/fever side effects · consider if other agents unavailable", color: T.blue },
      ].map(({ drug, dose, onset, note, color }) => (
        <div key={drug} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 3 }}>{drug}</div>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.white, marginBottom: 2 }}>{dose}</div>
          <div style={{ fontSize: 11, color: T.dim, marginBottom: 2 }}>Onset: {onset}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{note}</div>
        </div>
      ))}

      <div style={sL(T.green)}>Tranexamic Acid (TXA)</div>
      <div style={{ ...card({ marginBottom: 14, borderLeft: `3px solid ${T.green}` }) }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.green, marginBottom: 4 }}>Consider Early in Moderate–Severe PPH</div>
        <div style={{ fontFamily: T.mono, fontSize: 12, color: T.white, marginBottom: 3 }}>1 g IV over 10 min (may repeat once after 30 min if ongoing bleeding)</div>
        <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 3 }}>Mechanism: Plasmin inhibitor · reduces fibrinolysis · may reduce need for transfusion if given early</div>
        <div style={{ fontSize: 11, color: T.dim }}>Note: No evidence of thrombotic risk in PPH context · give within 3h of symptom onset for efficacy</div>
      </div>
    </div>
  );

  // ── TAB 2: SURGICAL CAUSES ──────────────────────────────────────────────
  const T2 = (
    <div>
      <div style={{ ...G({ borderRadius: 14, border: `2px solid ${T.purple}55`, background: "rgba(167,139,250,0.08)", marginBottom: 16 }), padding: "14px" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.purple, marginBottom: 4 }}>Surgical Indications for PPH</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Consider OR if: bleeding uncontrolled after 15–20 min uterotonic therapy · signs of shock · identifiable surgical cause (inversion, rupture, placenta accreta) · need for definitive hemostasis.</div>
      </div>

      <div style={sL()}>Operative Management Options</div>
      {[
        { surg: "B-Lynch Suture", indication: "Uterine atony refractory to oxytocin/carboprost", technique: "Compress uterine bleeding vessels with circumferential suturing · preserves uterine function", success: "80–90%", color: T.teal },
        { surg: "Uterine Artery Ligation", indication: "Bleeding from lower uterine segment · failure of conservative measures", technique: "Ligate uteroovarian ligament medial to ovary · reduces perfusion by 85%", success: "90%+", color: T.gold },
        { surg: "Internal Iliac Ligation", indication: "Massive pelvic hemorrhage · failure of uterine artery ligation", technique: "Ligate internal iliac bilaterally · reduces pelvic perfusion by 50%", success: "95%+", color: T.purple },
        { surg: "Peripartum Hysterectomy", indication: "Uncontrolled hemorrhage · placenta accreta · uterine rupture · failed conservative measures", technique: "Removal of uterus after delivery · only definitive hemostasis", success: "100%", color: T.coral },
      ].map(({ surg, indication, technique, success, color }) => (
        <div key={surg} style={{ ...card({ marginBottom: 8, borderLeft: `3px solid ${color}` }) }}>
          <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 4 }}>{surg}</div>
          <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 6 }}><span style={{ fontWeight: 600 }}>Indication: </span>{indication}</div>
          <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 3 }}>{technique}</div>
          <div style={{ fontSize: 11, color: T.dim }}>Success: {success}</div>
        </div>
      ))}

      <div style={sL(T.coral)}>High-Risk Diagnoses</div>
      {[
        { dx: "Placenta Accreta/Increta/Percreta", sign: "Abnormally invasive placenta · risk with prior cesarean · previa", mgmt: "Anticipate hemorrhage · have OR ready · type & cross · prepare for hysterectomy · consider ICU · may need ICU for transfusion/DIC", color: T.coral },
        { dx: "Uterine Rupture", sign: "Severe shock · abdominal pain · vaginal bleeding · fetal distress", mgmt: "Emergency laparotomy · repair vs hysterectomy · manage DIC · transfuse aggressively", color: T.purple },
        { dx: "Amniotic Fluid Embolism", sign: "Sudden dyspnea · hypotension · DIC · cardiac arrest", mgmt: "EMERGENCY · epinephrine · ICU/ECMO · massive transfusion · supportive care", color: T.teal },
      ].map(({ dx, sign, mgmt, color }) => (
        <div key={dx} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 3 }}>{dx}</div>
          <div style={{ fontSize: 11, color: T.dim, marginBottom: 2 }}>{sign}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{mgmt}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 3: MASSIVE TRANSFUSION ──────────────────────────────────────────
  const T3 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Massive Transfusion Protocol (MTP)</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Defined as transfusion of ≥ 4 units PRBCs in ≤ 4 hours OR ongoing hemorrhage with hemodynamic instability despite resuscitation. Goal: early use of FFP · platelets · cryoprecipitate to prevent/reverse DIC.</div>
      </div>

      <div style={sL()}>MTP Activation Criteria</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div style={card({ borderLeft: `3px solid ${T.coral}`, padding: "12px" })}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.coral, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>Activate if:</div>
          {["Grade 3–4 PPH ongoing", "Shock (SBP < 90)", "DIC signs (oozing from sites)", "Ongoing heavy bleeding despite uterotonic agents", "Inversion / rupture / major placental disorder"].map((s, i) => (
            <div key={i} style={{ fontSize: 11, color: T.muted, marginBottom: 3, display: "flex", gap: 5 }}><span style={{ color: T.coral }}>●</span>{s}</div>
          ))}
        </div>
        <div style={card({ borderLeft: `3px solid ${T.teal}`, padding: "12px" })}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.teal, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>Initial Ratio (1:1:1):</div>
          {["1 unit PRBCs (type O neg if type pending)", "1 unit FFP (or thawed FFP)", "1 unit platelets", "Monitor labs q 2–4h", "Adjust based on values & ongoing loss"].map((s, i) => (
            <div key={i} style={{ fontSize: 11, color: T.muted, marginBottom: 3, display: "flex", gap: 5 }}><span style={{ color: T.teal }}>✓</span>{s}</div>
          ))}
        </div>
      </div>

      <div style={sL(T.blue)}>Blood Products & Dosing</div>
      {[
        { prod: "Packed RBCs", dose: "1 unit raises Hgb by ~1 g/dL · target Hgb 7–9 g/dL initially (higher if ongoing loss)", note: "Type & cross when possible", color: T.teal },
        { prod: "Fresh Frozen Plasma (FFP)", dose: "10–15 mL/kg (typically 2–4 units) · replace 1:1 with RBCs in MTP", note: "Contains all clotting factors · takes time to thaw", color: T.blue },
        { prod: "Platelets", dose: "1 unit per 10 kg body weight · maintain count > 50,000 in hemorrhage", note: "6 pooled units or 1 apheresis unit = 1 transfusion", color: T.gold },
        { prod: "Cryoprecipitate", dose: "10 units IV · raises fibrinogen by ~50–100 mg/dL", note: "Contains fibrinogen · factor VIII · vWF · used if fibrinogen &lt; 100 mg/dL", color: T.purple },
      ].map(({ prod, dose, note, color }) => (
        <div key={prod} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{prod}</div>
          <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 2 }}>{dose}</div>
          <div style={{ fontSize: 11, color: T.dim }}>{note}</div>
        </div>
      ))}

      <div style={sL(T.purple)}>Lab Monitoring in MTP</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        {[
          { f: "Hemoglobin/Hematocrit", v: "Baseline · q 2–4h during active transfusion · target 7–9 g/dL (higher if ongoing loss)" },
          { f: "Platelets", v: "Baseline · q 4h · maintain > 50,000 in hemorrhage (some recommend > 75,000)" },
          { f: "PT/INR", v: "Baseline · q 4–6h · FFP if INR > 1.5" },
          { f: "Fibrinogen", v: "Baseline · q 4–6h · cryoprecipitate if &lt; 100 mg/dL · normal &gt; 150 mg/dL" },
          { f: "Calcium", v: "Check if transfusing &gt; 10 units · calcium gluconate if symptomatic hypocalcemia (from citrate)" },
        ].map(({ f, v }) => (
          <div key={f} style={{ display: "flex", gap: 10, paddingBottom: 6, marginBottom: 6, borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, minWidth: 100, flexShrink: 0 }}>{f}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={sL(T.teal)}>DIC Management</div>
      <div style={{ ...card({ background: "rgba(20,184,166,0.07)", borderColor: "rgba(20,184,166,0.3)" }) }}>
        {[
          { item: "Recognize early: oozing from IV sites · petechiae · prolonged bleeding", color: T.coral },
          { item: "Send PT/INR · platelets · fibrinogen immediately", color: T.teal },
          { item: "Activate MTP · prepare for aggressive transfusion", color: T.teal },
          { item: "Give FFP early (1:1:1 ratio) · cryoprecipitate if fibrinogen &lt; 100", color: T.purple },
          { item: "Consider TXA if early (within 3h of hemorrhage onset)", color: T.gold },
          { item: "Address underlying cause (remove retained products · repair lacerations · OR if needed)", color: T.blue },
          { item: "Monitor obstetric labs q 4–6h · adjust transfusion ratios based on labs", color: T.teal },
        ].map(({ item, color }, i) => (
          <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 6 }}>
            <span style={{ color, flexShrink: 0 }}>●</span>{item}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(244,63,94,0.12) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(245,158,11,0.07) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>
      <div style={{ padding: "20px 20px 0" }}>
        {onBack && (<button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 16 }}>← Critical Protocols</button>)}
        <div>
          <span style={pill("linear-gradient(135deg,#f43f5e,#be123c)")}>🩸 Obstetric Emergency</span>
          <span style={pill("linear-gradient(135deg,#a78bfa,#7c3aed)")}>ACOG / SMFM 2021</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>Postpartum Hemorrhage</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>Primary & secondary PPH · atony · placental disorders · DIC · massive transfusion · hysterectomy · uterine artery ligation</p>
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