import { useState } from "react";

// ── TOKENS ────────────────────────────────────────────────────────────────────
const P = {
  bg: "#0a1628", bgD: "#060e1a",
  glass: "rgba(255,255,255,0.055)", gb: "rgba(0,188,212,0.18)",
  teal: "#00bcd4", tL: "rgba(0,188,212,0.14)",
  gold: "#ffd700", gL: "rgba(255,215,0,0.1)",
  red: "#ff5252", rL: "rgba(255,82,82,0.12)",
  grn: "#69f0ae", gnL: "rgba(105,240,174,0.1)",
  amber: "#ffab40", aL: "rgba(255,171,64,0.1)",
  txt: "#e8eef7", dim: "#7a8fa6",
};
const PL = "'Playfair Display',Georgia,serif";
const DM = "'DM Sans',system-ui,sans-serif";
const MO = "'JetBrains Mono','Courier New',monospace";

// ── STYLE HELPERS ─────────────────────────────────────────────────────────────
const glassPanel = (extra = {}) => ({
  background: P.glass, border: `1px solid ${P.gb}`,
  backdropFilter: "blur(12px)", borderRadius: 12, padding: "16px 20px", ...extra,
});
const inp = {
  background: "rgba(0,0,0,0.35)", border: `1px solid ${P.gb}`,
  borderRadius: 8, color: P.txt, fontFamily: MO, fontSize: 14,
  padding: "8px 12px", width: "100%", outline: "none", boxSizing: "border-box",
};
const lbl = {
  display: "block", fontFamily: DM, fontSize: 11, color: P.dim,
  marginBottom: 4, letterSpacing: "0.06em", textTransform: "uppercase",
};
const Btn = ({ active, color = P.teal, onClick, children, style = {} }) => (
  <button onClick={onClick} style={{
    background: active ? color : "rgba(255,255,255,0.07)",
    border: `1px solid ${active ? color : "rgba(255,255,255,0.12)"}`,
    borderRadius: 8, color: active ? (color === P.gold ? "#0a1628" : "#fff") : P.dim,
    cursor: "pointer", fontFamily: DM, fontSize: 13, fontWeight: 600,
    padding: "7px 18px", transition: "all 0.18s", ...style,
  }}>{children}</button>
);
const StepCard = ({ num, label, children, color = P.teal }) => (
  <div style={{ ...glassPanel(), marginBottom: 10, borderLeft: `3px solid ${color}` }}>
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      <span style={{
        fontFamily: MO, fontSize: 10, color, border: `1px solid ${color}`,
        borderRadius: "50%", minWidth: 20, height: 20, display: "inline-flex",
        alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>{num}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: DM, fontSize: 11, color: P.dim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{label}</div>
        {children}
      </div>
    </div>
  </div>
);
const Pill = ({ text, color }) => (
  <span style={{
    background: `${color}22`, border: `1px solid ${color}44`,
    borderRadius: 6, color, fontFamily: DM, fontSize: 11,
    fontWeight: 700, padding: "2px 9px", letterSpacing: "0.04em",
  }}>{text}</span>
);
const ValRow = ({ label: rowLabel, value, unit = "", color = P.gold }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
    <span style={{ fontFamily: DM, fontSize: 12, color: P.dim }}>{rowLabel}</span>
    <span style={{ fontFamily: MO, fontSize: 13, color }}>
      {value}<span style={{ fontSize: 11, color: P.dim, marginLeft: 4 }}>{unit}</span>
    </span>
  </div>
);
const AlertBox = ({ text, color = P.amber }) => (
  <div style={{ background: `${color}18`, border: `1px solid ${color}44`, borderRadius: 8, padding: "9px 14px", marginTop: 8, display: "flex", alignItems: "flex-start", gap: 8 }}>
    <span style={{ color, fontSize: 13 }}>⚠</span>
    <span style={{ fontFamily: DM, fontSize: 12, color: P.txt, lineHeight: 1.5 }}>{text}</span>
  </div>
);
const FG = ({ label: fLabel, value, onChange, placeholder = "", half = false }) => (
  <div style={{ flex: half ? "1 1 calc(50% - 6px)" : "1 1 100%" }}>
    <div style={lbl}>{fLabel}</div>
    <input style={inp} type="number" value={value}
      onChange={e => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);
const Row = ({ children }) => (
  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{children}</div>
);

// ── ABG LOGIC ─────────────────────────────────────────────────────────────────
function interpretABG(pH, pCO2, HCO3, Na, Cl, isVBG, respType) {
  const aPH = isVBG ? +pH + 0.035 : +pH;
  const aPCO2 = isVBG ? +pCO2 - 6 : +pCO2;
  const hco3 = +HCO3;

  const pHStatus = aPH < 7.35 ? "Acidemia" : aPH > 7.45 ? "Alkalemia" : "Normal pH";

  let disorder = "Normal";
  if (aPH < 7.35) {
    if (hco3 < 22 && aPCO2 > 45) disorder = "Mixed: MetAcid + RespAcid";
    else if (hco3 < 22) disorder = "Metabolic Acidosis";
    else if (aPCO2 > 45) disorder = "Respiratory Acidosis";
    else disorder = "Acidemia — unclear primary";
  } else if (aPH > 7.45) {
    if (hco3 > 26 && aPCO2 < 35) disorder = "Mixed: MetAlk + RespAlk";
    else if (hco3 > 26) disorder = "Metabolic Alkalosis";
    else if (aPCO2 < 35) disorder = "Respiratory Alkalosis";
    else disorder = "Alkalemia — unclear primary";
  } else {
    if (hco3 < 22 && aPCO2 < 35) disorder = "Mixed: MetAcid + RespAlk (normalized pH)";
    else if (hco3 > 26 && aPCO2 > 45) disorder = "Mixed: MetAlk + RespAcid (normalized pH)";
  }

  let comp = null, compStatus = "";
  const d = disorder;
  if (d === "Metabolic Acidosis") {
    const exp = 1.5 * hco3 + 8;
    comp = { label: "Expected pCO2 (Winters)", exp: exp.toFixed(1), low: (exp - 2).toFixed(1), high: (exp + 2).toFixed(1), measured: aPCO2.toFixed(1) };
    compStatus = aPCO2 > exp + 2 ? "Inadequate compensation → concurrent Resp Acidosis"
      : aPCO2 < exp - 2 ? "Excessive compensation → concurrent Resp Alkalosis"
      : "Appropriate respiratory compensation";
  } else if (d === "Metabolic Alkalosis") {
    const exp = 0.7 * hco3 + 21;
    comp = { label: "Expected pCO2", exp: exp.toFixed(1), low: (exp - 5).toFixed(1), high: (exp + 5).toFixed(1), measured: aPCO2.toFixed(1) };
    compStatus = aPCO2 > exp + 5 ? "Inadequate compensation → concurrent Resp Acidosis"
      : aPCO2 < exp - 5 ? "Excessive compensation → concurrent Resp Alkalosis"
      : "Appropriate respiratory compensation";
  } else if (d === "Respiratory Acidosis") {
    const expA = 24 + (aPCO2 - 40) * 0.1;
    const expC = 24 + (aPCO2 - 40) * 0.35;
    const exp = respType === "chronic" ? expC : expA;
    comp = { label: `Expected HCO3 (${respType})`, exp: exp.toFixed(1), low: (exp - 2).toFixed(1), high: (exp + 2).toFixed(1), measured: hco3.toFixed(1), acute: expA.toFixed(1), chronic: expC.toFixed(1) };
    compStatus = hco3 > exp + 2 ? "Excess HCO3 → concurrent Metabolic Alkalosis"
      : hco3 < exp - 2 ? "Insufficient HCO3 → concurrent Metabolic Acidosis"
      : "Appropriate metabolic compensation";
  } else if (d === "Respiratory Alkalosis") {
    const expA = 24 - (40 - aPCO2) * 0.2;
    const expC = 24 - (40 - aPCO2) * 0.5;
    const exp = respType === "chronic" ? expC : expA;
    comp = { label: `Expected HCO3 (${respType})`, exp: exp.toFixed(1), low: (exp - 2).toFixed(1), high: (exp + 2).toFixed(1), measured: hco3.toFixed(1), acute: expA.toFixed(1), chronic: expC.toFixed(1) };
    compStatus = hco3 < exp - 2 ? "Excess HCO3 drop → concurrent Metabolic Acidosis"
      : hco3 > exp + 2 ? "Insufficient HCO3 drop → concurrent Metabolic Alkalosis"
      : "Appropriate metabolic compensation";
  }

  let ag = null, agInterp = "", dd = null, ddInterp = "";
  if (Na && Cl) {
    ag = +Na - (+Cl + hco3);
    agInterp = ag > 12 ? "Elevated AG (HAGMA)" : ag < 6 ? "Low AG (hypoalbuminemia, IgG paraprotein)" : "Normal AG";
    if (ag > 12 && d === "Metabolic Acidosis") {
      dd = (ag - 12) / (24 - hco3);
      ddInterp = dd < 0.4 ? "Pure NAGMA (hyperchloremic)"
        : dd < 1 ? "Mixed HAGMA + NAGMA"
        : dd <= 2 ? "Pure HAGMA"
        : "HAGMA + concurrent Metabolic Alkalosis";
    }
  }

  return { aPH, aPCO2, pHStatus, disorder, comp, compStatus, ag, agInterp, dd, ddInterp };
}

// ── ABG TAB ───────────────────────────────────────────────────────────────────
function ABGTab() {
  const [mode, setMode] = useState("abg");
  const [respType, setRespType] = useState("acute");
  const [v, setV] = useState({ pH: "", pCO2: "", HCO3: "", Na: "", Cl: "" });
  const [result, setResult] = useState(null);
  const set = k => val => setV(p => ({ ...p, [k]: val }));

  const run = () => {
    if (!v.pH || !v.pCO2 || !v.HCO3) return;
    setResult(interpretABG(v.pH, v.pCO2, v.HCO3, v.Na, v.Cl, mode === "vbg", respType));
  };

  const dc = d => {
    if (!d || d === "Normal") return P.grn;
    if (d.toLowerCase().includes("acid")) return P.red;
    if (d.toLowerCase().includes("alk")) return P.amber;
    return P.teal;
  };

  const ddx = {
    "Metabolic Acidosis": { ha: "MUDPILES — Methanol • Uremia • DKA • Propylene glycol • Isoniazid/Iron • Lactic acidosis • Ethylene glycol • Salicylates", na: "HARDUPS — Hyperalimentation • Acetazolamide • RTA • Diarrhea • Ureteroenteric fistula • Pancreatic fistula • Saline excess" },
    "Metabolic Alkalosis": "Vomiting/NG suction • Diuretics (loop/thiazide) • Hyperaldosteronism • Post-hypercapnia • Contraction alkalosis • Antacid overuse",
    "Respiratory Acidosis": "COPD exacerbation • Pneumonia • Neuromuscular disease • Opioid/sedative overdose • Obesity hypoventilation • Chest wall deformity",
    "Respiratory Alkalosis": "Anxiety/hyperventilation • Pulmonary embolism • Pneumonia • Hepatic failure • Salicylate toxicity • Mechanical overventilation • Altitude",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <Btn active={mode === "abg"} onClick={() => setMode("abg")}>ABG</Btn>
        <Btn active={mode === "vbg"} onClick={() => setMode("vbg")}>VBG</Btn>
        {mode === "vbg" && <span style={{ fontFamily: DM, fontSize: 12, color: P.amber }}>Offset applied: pH +0.035 | pCO2 correlation ±6 mmHg</span>}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <Btn active={respType === "acute"} onClick={() => setRespType("acute")} style={{ fontSize: 12, padding: "5px 13px" }}>Acute</Btn>
          <Btn active={respType === "chronic"} onClick={() => setRespType("chronic")} style={{ fontSize: 12, padding: "5px 13px" }}>Chronic</Btn>
        </div>
      </div>

      <Row>
        <FG label="pH" value={v.pH} onChange={set("pH")} placeholder="7.35 – 7.45" half />
        <FG label="pCO2 (mmHg)" value={v.pCO2} onChange={set("pCO2")} placeholder="35 – 45" half />
        <FG label="HCO3 (mEq/L)" value={v.HCO3} onChange={set("HCO3")} placeholder="22 – 26" half />
        <FG label="Na — optional, for AG" value={v.Na} onChange={set("Na")} placeholder="135 – 145" half />
        <FG label="Cl — optional, for AG" value={v.Cl} onChange={set("Cl")} placeholder="98 – 106" half />
      </Row>

      <Btn active onClick={run} style={{ alignSelf: "flex-start", padding: "9px 26px", fontSize: 14 }}>Interpret</Btn>

      {result && (
        <div>
          {mode === "vbg" && (
            <div style={{ ...glassPanel({ marginBottom: 10 }), background: `${P.amber}12`, borderColor: `${P.amber}44` }}>
              <span style={{ fontFamily: DM, fontSize: 12, color: P.amber }}>
                Estimated arterial: pH ≈ {result.aPH.toFixed(3)} | pCO2 ≈ {result.aPCO2.toFixed(0)} mmHg
              </span>
            </div>
          )}

          <StepCard num={1} label="pH Status" color={dc(result.pHStatus)}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <Pill text={result.pHStatus} color={dc(result.pHStatus)} />
              <span style={{ fontFamily: MO, fontSize: 14, color: P.txt }}>pH {result.aPH.toFixed(3)}</span>
            </div>
          </StepCard>

          <StepCard num={2} label="Primary Disorder" color={dc(result.disorder)}>
            <Pill text={result.disorder} color={dc(result.disorder)} />
            {result.disorder === "Metabolic Acidosis" && result.ag !== null && result.ag > 12 && (
              <div style={{ fontFamily: DM, fontSize: 11, color: P.dim, marginTop: 6, lineHeight: 1.5 }}>{ddx["Metabolic Acidosis"].ha}</div>
            )}
            {result.disorder === "Metabolic Acidosis" && result.ag !== null && result.ag <= 12 && (
              <div style={{ fontFamily: DM, fontSize: 11, color: P.dim, marginTop: 6, lineHeight: 1.5 }}>{ddx["Metabolic Acidosis"].na}</div>
            )}
            {result.disorder === "Metabolic Acidosis" && !result.ag && (
              <div style={{ fontFamily: DM, fontSize: 11, color: P.dim, marginTop: 6 }}>Enter Na + Cl to calculate AG and classify HAGMA vs NAGMA</div>
            )}
            {ddx[result.disorder] && typeof ddx[result.disorder] === "string" && (
              <div style={{ fontFamily: DM, fontSize: 11, color: P.dim, marginTop: 6, lineHeight: 1.5 }}>{ddx[result.disorder]}</div>
            )}
          </StepCard>

          {result.comp && (
            <StepCard num={3} label="Expected Compensation" color={P.teal}>
              <ValRow label={result.comp.label} value={`${result.comp.low} – ${result.comp.high}`} unit="expected range" />
              <ValRow label="Measured" value={result.comp.measured} color={P.txt} />
              {result.comp.acute && (
                <div style={{ display: "flex", gap: 18, marginTop: 5 }}>
                  <span style={{ fontFamily: DM, fontSize: 11, color: P.dim }}>Acute: {result.comp.acute}</span>
                  <span style={{ fontFamily: DM, fontSize: 11, color: P.dim }}>Chronic: {result.comp.chronic}</span>
                </div>
              )}
              <div style={{ marginTop: 8 }}>
                <Pill text={result.compStatus} color={result.compStatus.includes("Appropriate") ? P.grn : P.amber} />
              </div>
            </StepCard>
          )}

          {result.ag !== null && (
            <StepCard num={4} label="Anion Gap" color={result.ag > 12 ? P.red : P.grn}>
              <ValRow label="AG = Na − (Cl + HCO3)" value={result.ag.toFixed(1)} unit="mEq/L" color={result.ag > 12 ? P.red : P.grn} />
              <div style={{ marginTop: 6 }}><Pill text={result.agInterp} color={result.ag > 12 ? P.red : P.grn} /></div>
              {result.dd !== null && (
                <div style={{ marginTop: 10 }}>
                  <ValRow label="Delta-Delta ratio" value={result.dd.toFixed(2)} color={P.teal} />
                  <div style={{ marginTop: 6 }}><Pill text={result.ddInterp} color={P.teal} /></div>
                </div>
              )}
            </StepCard>
          )}
        </div>
      )}
    </div>
  );
}

// ── ELECTROLYTES TAB ──────────────────────────────────────────────────────────
function ElectrolytesTab() {
  const [sub, setSub] = useState("k");
  const [K, setK] = useState("");
  const [access, setAccess] = useState("peripheral");
  const [curNa, setCurNa] = useState("");
  const [naWt, setNaWt] = useState("");
  const [sex, setSex] = useState("m");
  const [naChron, setNaChron] = useState("chronic");
  const [totCa, setTotCa] = useState("");
  const [albumin, setAlbumin] = useState("");
  const [mg, setMg] = useState("");

  const kVal = parseFloat(K);
  const kProt = () => {
    if (!kVal || kVal >= 3.5) return kVal >= 3.5 ? { level: "Normal", color: P.grn, dose: "No replacement indicated", rate: "—", monitor: "Routine" } : null;
    if (kVal >= 3.0) return { level: "Mild Hypokalemia", color: P.amber, dose: "40 mEq PO preferred; or 20 mEq IV in 100mL over 2h", rate: "10 mEq/hr peripheral", monitor: "Recheck in 4–6h" };
    if (kVal >= 2.5) return { level: "Moderate Hypokalemia", color: "#ff7043", dose: "40–60 mEq IV; replace Mg2+ concurrently (MgSO4 2g IV)", rate: access === "central" ? "20 mEq/hr central" : "10 mEq/hr peripheral (max)", monitor: "Continuous telemetry · recheck q2–4h" };
    return { level: "Severe Hypokalemia", color: P.red, dose: "60–80 mEq IV; central access preferred; always correct Mg2+", rate: access === "central" ? "20–40 mEq/hr central" : "10 mEq/hr peripheral — inadequate; obtain central access", monitor: "Continuous telemetry · recheck q1–2h · ICU consideration" };
  };
  const kR = kProt();

  const naR = () => {
    const na = parseFloat(curNa), w = parseFloat(naWt);
    if (!na || !w) return null;
    const tbw = w * (sex === "m" ? 0.6 : 0.5);
    const deficit = tbw * (140 - na);
    return { tbw: tbw.toFixed(1), deficit: deficit.toFixed(0), maxDay: naChron === "chronic" ? "8–10 mEq/L" : "1–2 mEq/hr; max 8–10 mEq" };
  };
  const naResult = naR();

  const corrCa = () => {
    const ca = parseFloat(totCa), alb = parseFloat(albumin);
    if (!ca || !alb) return null;
    const corr = ca + 0.8 * (4 - alb);
    return { corrected: corr.toFixed(2), low: corr < 8.5, high: corr > 10.5 };
  };
  const caR = corrCa();
  const mgVal = parseFloat(mg);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[["k", "Potassium"], ["na", "Sodium Deficit"], ["ca", "Calcium / Mg"]].map(([id, title]) => (
          <Btn key={id} active={sub === id} onClick={() => setSub(id)}>{title}</Btn>
        ))}
      </div>

      {sub === "k" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Row>
            <FG label="Serum K (mEq/L)" value={K} onChange={setK} placeholder="3.5 – 5.0" half />
            <div style={{ flex: "1 1 calc(50% - 6px)" }}>
              <div style={lbl}>IV Access</div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn active={access === "peripheral"} onClick={() => setAccess("peripheral")} style={{ fontSize: 12, padding: "6px 12px" }}>Peripheral</Btn>
                <Btn active={access === "central"} onClick={() => setAccess("central")} style={{ fontSize: 12, padding: "6px 12px" }}>Central</Btn>
              </div>
            </div>
          </Row>

          {kR && (
            <div style={{ ...glassPanel(), borderLeft: `3px solid ${kR.color}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                <Pill text={kR.level} color={kR.color} />
                {kVal && <span style={{ fontFamily: MO, fontSize: 16, color: kR.color }}>K = {kVal.toFixed(1)} mEq/L</span>}
              </div>
              <ValRow label="Replacement" value={kR.dose} color={P.txt} />
              <ValRow label="Max infusion rate" value={kR.rate} color={P.gold} />
              <ValRow label="Monitoring" value={kR.monitor} color={P.teal} />
              {kVal && kVal < 3.5 && <ValRow label="Est. deficit" value={`~${((3.5 - kVal) * 100).toFixed(0)}`} unit="mEq total body" color={P.amber} />}
              <AlertBox text="Never give K IV push. Peripheral bag max: 40 mEq/L (10 mEq per 100 mL). Hypomagnesemia impairs repletion — replace Mg2+ concurrently." />
            </div>
          )}

          <div style={glassPanel()}>
            <div style={{ fontFamily: DM, fontSize: 13, fontWeight: 600, color: P.teal, marginBottom: 8 }}>Causes of Hypokalemia</div>
            {[["GI loss", "Vomiting, NG suction, diarrhea, fistula"],
              ["Renal loss", "Loop/thiazide diuretics, hyperaldosteronism, RTA type I/II, Mg deficiency"],
              ["Transcellular shift", "Insulin, alkalosis, beta-2 agonists, hypokalemic periodic paralysis"],
              ["Inadequate intake", "Rarely sole cause; contributes in elderly, alcoholism, anorexia"]
            ].map(([cat, cause]) => (
              <div key={cat} style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontFamily: DM, fontSize: 12, fontWeight: 600, color: P.gold, minWidth: 130 }}>{cat}</span>
                <span style={{ fontFamily: DM, fontSize: 12, color: P.dim }}>{cause}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {sub === "na" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Row>
            <FG label="Current Na (mEq/L)" value={curNa} onChange={setCurNa} placeholder="< 135" half />
            <FG label="Weight (kg)" value={naWt} onChange={setNaWt} placeholder="70" half />
          </Row>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={lbl}>Sex (TBW factor)</div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn active={sex === "m"} onClick={() => setSex("m")} style={{ fontSize: 12, padding: "6px 12px" }}>Male 60%</Btn>
                <Btn active={sex === "f"} onClick={() => setSex("f")} style={{ fontSize: 12, padding: "6px 12px" }}>Female 50%</Btn>
              </div>
            </div>
            <div>
              <div style={lbl}>Duration</div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn active={naChron === "acute"} onClick={() => setNaChron("acute")} style={{ fontSize: 12, padding: "6px 12px" }}>Acute &lt;48h</Btn>
                <Btn active={naChron === "chronic"} onClick={() => setNaChron("chronic")} style={{ fontSize: 12, padding: "6px 12px" }}>Chronic / Unknown</Btn>
              </div>
            </div>
          </div>

          {naResult && (
            <div style={glassPanel()}>
              <ValRow label="Total Body Water" value={naResult.tbw} unit="L" />
              <ValRow label="Na Deficit (target 140)" value={naResult.deficit} unit="mEq" color={P.red} />
              <ValRow label="Max correction" value={naResult.maxDay} unit="per 24h" color={P.amber} />
              <div style={{ marginTop: 12, fontFamily: DM, fontSize: 13, fontWeight: 600, color: P.teal }}>3% NaCl (513 mEq Na/L)</div>
              <ValRow label="Symptomatic rescue" value="100 mL bolus IV" unit="× 2–3, q10–20 min until sz/coma resolves" color={P.txt} />
              <ValRow label="Non-emergent rate" value="Titrate to correction rate" unit="recheck Na q2–4h" color={P.txt} />
              <AlertBox text={naChron === "chronic" ? "CHRONIC: Max 8–10 mEq/L/24h. Rapid correction → Osmotic Demyelination Syndrome (ODS). If overcorrected: D5W + DDAVP to re-lower Na." : "ACUTE (<48h): May correct 1–2 mEq/hr. Recheck Na q2h. Total still should not exceed 8–10 mEq/24h."} color={naChron === "chronic" ? P.red : P.amber} />
            </div>
          )}
        </div>
      )}

      {sub === "ca" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Row>
            <FG label="Total Ca (mg/dL)" value={totCa} onChange={setTotCa} placeholder="8.5 – 10.5" half />
            <FG label="Albumin (g/dL)" value={albumin} onChange={setAlbumin} placeholder="4.0" half />
          </Row>
          {caR && (
            <div style={{ ...glassPanel(), borderLeft: `3px solid ${caR.low ? P.red : caR.high ? P.amber : P.grn}` }}>
              <ValRow label="Corrected Ca" value={caR.corrected} unit="mg/dL" color={caR.low ? P.red : caR.high ? P.amber : P.grn} />
              <div style={{ marginTop: 6 }}>
                <Pill text={caR.low ? "Hypocalcemia" : caR.high ? "Hypercalcemia" : "Normal corrected Ca"} color={caR.low ? P.red : caR.high ? P.amber : P.grn} />
              </div>
              {caR.low && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontFamily: DM, fontSize: 13, fontWeight: 600, color: P.teal, marginBottom: 8 }}>Replacement</div>
                  <ValRow label="Symptomatic / Severe" value="Ca gluconate 1–2g IV over 10–20 min" unit="(repeat q10 min PRN)" color={P.txt} />
                  <ValRow label="VFib / Tetany (emergent)" value="CaCl2 1g IV" unit="3× elemental Ca vs gluconate" color={P.red} />
                  <ValRow label="Maintenance infusion" value="Ca gluconate 1–2g/hr" unit="titrate to iCa >1.1" color={P.txt} />
                  <AlertBox text="CaCl2 extravasation → tissue necrosis. Use central line. Ca gluconate safer peripherally." />
                </div>
              )}
            </div>
          )}

          <div style={glassPanel()}>
            <div style={{ fontFamily: DM, fontSize: 13, fontWeight: 600, color: P.teal, marginBottom: 8 }}>Magnesium Replacement</div>
            <Row>
              <FG label="Serum Mg (mEq/L)" value={mg} onChange={setMg} placeholder="1.5 – 2.5" half />
            </Row>
            {[
              [1.5, 99, P.amber, "Mild (1.5–1.8)", "Mg oxide 400–800 mg PO BID; recheck q24h"],
              [1.0, 1.5, "#ff7043", "Moderate (1.0–1.5)", "MgSO4 2g IV over 1h; repeat q4–6h PRN; check UO and DTRs"],
              [0, 1.0, P.red, "Severe (<1.0) / Symptomatic", "MgSO4 4–8g IV over 4–8h; monitor DTRs, UO, respiratory rate, serum Mg q2h"],
            ].map(([lo, hi, color, level, tx]) => {
              const mgV = parseFloat(mg);
              const active = mg && mgV >= lo && mgV < hi;
              return (
                <div key={level} style={{ padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", opacity: mg && !active ? 0.45 : 1 }}>
                  <div style={{ fontFamily: DM, fontSize: 11, color, fontWeight: 700, marginBottom: 2 }}>{level}</div>
                  <div style={{ fontFamily: DM, fontSize: 12, color: P.dim }}>{tx}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── SODIUM DISORDERS TAB ──────────────────────────────────────────────────────
function SodiumTab() {
  const [mode, setMode] = useState("hypo");
  const [serNa, setSerNa] = useState("");
  const [serOsm, setSerOsm] = useState("");
  const [urOsm, setUrOsm] = useState("");
  const [urNa, setUrNa] = useState("");
  const [glucose, setGlucose] = useState("");
  const [volStatus, setVolStatus] = useState("eu");
  const [duration, setDuration] = useState("unknown");
  const [weight, setWeight] = useState("");
  const [sexH, setSexH] = useState("m");
  const [result, setResult] = useState(null);

  const interpretHypo = () => {
    const na = parseFloat(serNa), sOsm = parseFloat(serOsm),
      uOsm = parseFloat(urOsm), uNa = parseFloat(urNa), glu = parseFloat(glucose);
    const steps = [];

    if (sOsm) {
      if (sOsm > 295) {
        const corrNa = na + 1.6 * (glu - 100) / 100;
        steps.push({ title: "Hypertonic Hyponatremia", color: P.amber, body: `Osmotically active solute present. Causes: hyperglycemia, mannitol, sorbitol.${glu ? ` Corrected Na = ${corrNa.toFixed(1)} mEq/L.` : " Enter glucose to calculate corrected Na."}` });
      } else if (sOsm >= 280) {
        steps.push({ title: "Isotonic — Pseudohyponatremia", color: P.amber, body: "Osmolar gap suggests artifact. Check: hypertriglyceridemia (>1500 mg/dL), hyperproteinemia (IgG myeloma). True Na is normal. Confirm with direct ISE method." });
      } else {
        steps.push({ title: "Hypotonic Hyponatremia confirmed", color: P.teal, body: "Serum Osm <280 mOsm/kg. True dilutional hyponatremia. Proceed to urine osmolality." });
        if (uOsm) {
          if (uOsm < 100) {
            steps.push({ title: "Urine Osm <100 — Maximal dilution", color: P.grn, body: "Kidney appropriately suppressing ADH. Causes: primary polydipsia (>3 L/day), beer potomania, reset osmostat. Urine output often >3 L/day." });
          } else {
            steps.push({ title: `Urine Osm ${uOsm} — Impaired dilution`, color: P.amber, body: "ADH active or renal inability to dilute. Continue to urine Na and volume status." });
            if (urNa !== "" && !isNaN(uNa)) {
              if (uNa < 20) {
                steps.push({ title: volStatus === "hypo" ? "Low Urine Na + Hypovolemic — Non-renal loss" : "Low Urine Na — Na-avid state", color: P.red, body: volStatus === "hypo" ? "GI losses (vomiting, diarrhea, fistula), skin losses, third-spacing. Tx: isotonic saline resuscitation." : "CHF, cirrhosis, nephrotic syndrome. Effective circulating volume low despite euvolemia/hypervolemia." });
              } else {
                const dx = volStatus === "hypo" ? "Cerebral salt wasting, Addison disease, salt-wasting nephropathy, diuretics (measure after 24–48h off)."
                  : "SIADH (Serum Osm <280, Urine Osm >100, Urine Na >40, euvolemic, no diuretics/hypothyroid/AI). Also: hypothyroidism, adrenal insufficiency.";
                steps.push({ title: volStatus === "hypo" ? "High Urine Na + Hypovolemic — Renal Na wasting" : "High Urine Na + Euvolemic — SIADH most likely", color: P.teal, body: dx });
              }
            }
          }
        }
      }
    } else {
      steps.push({ title: "Enter serum osmolality to begin", color: P.dim, body: "Serum Osm classifies hyponatremia as hypertonic, isotonic (pseudohyponatremia), or hypotonic." });
    }

    const mgmt = duration === "acute"
      ? ["Acute (<48h): Correct 1–2 mEq/hr; max 8–10 mEq total in 24h", "Symptomatic (sz, coma): 3% NaCl 100 mL IV bolus × 2–3 until sx resolve, then slow", "Asymptomatic: 0.5–1 mEq/hr correction rate"]
      : ["Chronic/Unknown: MAX 8–10 mEq/L per 24h — ODS risk", "Asymptomatic SIADH: free water restrict 800–1000 mL/day + treat underlying cause", "If FWR fails: oral urea 15–30g/day, demeclocycline, or tolvaptan (monitor Na rate closely)", "Overcorrection (>10 mEq/24h): relower with D5W ± DDAVP 2–4 mcg IV q8h"];
    if (volStatus === "hypo") mgmt.unshift("Hypovolemic: NS first — Na will self-correct. Monitor closely for overcorrection.");

    setResult({ steps, mgmt });
  };

  const interpretHyper = () => {
    const na = parseFloat(serNa), uOsmV = parseFloat(urOsm), w = parseFloat(weight);
    const steps = [];

    if (uOsmV) {
      if (uOsmV < 300) {
        steps.push({ title: "Urine Osm <300 — Diabetes Insipidus", color: P.red, body: "ADH absent or ineffective. DDAVP trial: response → Central DI (trauma, neurosurgery, meningitis, sarcoid, Sheehan). No response → Nephrogenic DI (lithium, demeclocycline, hypercalcemia, hypokalemia, genetic V2R mutation)." });
      } else if (uOsmV < 800) {
        steps.push({ title: "Urine Osm 300–800 — Partial DI or osmotic diuresis", color: P.amber, body: "Consider: partial central/nephrogenic DI, osmotic diuresis (hyperglycemia, mannitol, urea, post-ATN). Check urine glucose." });
      } else {
        steps.push({ title: "Urine Osm >800 — Extrarenal water loss", color: P.grn, body: "Kidney appropriately concentrating urine. Cause is inadequate free water intake or extrarenal losses: insensible (fever, burns, tachypnea), GI (lactulose, osmotic diarrhea). Increase free water intake." });
      }
    }

    if (na && w) {
      const tbw = w * (sexH === "m" ? 0.6 : 0.5);
      const fwd = tbw * (na / 140 - 1);
      steps.push({ title: "Free Water Deficit", color: P.teal, body: `TBW = ${tbw.toFixed(1)}L | Free water deficit ≈ ${fwd.toFixed(1)}L | Replace at ~${(fwd / 48).toFixed(1)} mL/hr (rough; titrate to serum Na). Recheck Na q4–6h.` });
    }

    const mgmt = ["Max correction: 10–12 mEq/L per 24h; 0.5 mEq/hr in chronic hypernatremia", "Replace with D5W IV or enteral free water (NG if NPO)", "Rapid correction risks cerebral edema in chronic hypernatremia", "Central DI: DDAVP 1–2 mcg IV/SC q8–24h; titrate to UO and Na", "Nephrogenic DI: amiloride (lithium-induced), HCTZ + low Na diet, indomethacin", "Treat underlying cause"];
    setResult({ steps, mgmt });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Btn active={mode === "hypo"} color={P.teal} onClick={() => { setMode("hypo"); setResult(null); }}>Hyponatremia</Btn>
        <Btn active={mode === "hyper"} color={P.amber} onClick={() => { setMode("hyper"); setResult(null); }}>Hypernatremia</Btn>
      </div>

      <Row>
        <FG label="Serum Na (mEq/L)" value={serNa} onChange={setSerNa} placeholder={mode === "hypo" ? "< 135" : "> 145"} half />
        <FG label="Serum Osmolality (mOsm/kg)" value={serOsm} onChange={setSerOsm} placeholder="280 – 295" half />
        <FG label="Urine Osmolality (mOsm/kg)" value={urOsm} onChange={setUrOsm} placeholder="spot urine" half />
        {mode === "hypo" && <FG label="Urine Na (mEq/L)" value={urNa} onChange={setUrNa} placeholder="spot urine Na" half />}
        {mode === "hypo" && <FG label="Serum Glucose (mg/dL)" value={glucose} onChange={setGlucose} placeholder="optional — corrected Na" half />}
        {mode === "hyper" && <FG label="Weight (kg)" value={weight} onChange={setWeight} placeholder="for FWD calc" half />}
      </Row>

      {mode === "hypo" && (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={lbl}>Volume Status</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[["hypo", "Hypovolemic"], ["eu", "Euvolemic"], ["hyper", "Hypervolemic"]].map(([val, title]) => (
                <Btn key={val} active={volStatus === val} onClick={() => setVolStatus(val)} style={{ fontSize: 12, padding: "5px 11px" }}>{title}</Btn>
              ))}
            </div>
          </div>
          <div>
            <div style={lbl}>Duration</div>
            <div style={{ display: "flex", gap: 6 }}>
              <Btn active={duration === "acute"} onClick={() => setDuration("acute")} style={{ fontSize: 12, padding: "5px 11px" }}>Acute &lt;48h</Btn>
              <Btn active={duration !== "acute"} onClick={() => setDuration("unknown")} style={{ fontSize: 12, padding: "5px 11px" }}>Chronic / Unknown</Btn>
            </div>
          </div>
        </div>
      )}

      {mode === "hyper" && (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={lbl}>Sex</div>
          <Btn active={sexH === "m"} onClick={() => setSexH("m")} style={{ fontSize: 12, padding: "5px 12px" }}>Male</Btn>
          <Btn active={sexH === "f"} onClick={() => setSexH("f")} style={{ fontSize: 12, padding: "5px 12px" }}>Female</Btn>
        </div>
      )}

      <Btn active onClick={mode === "hypo" ? interpretHypo : interpretHyper}
        color={mode === "hypo" ? P.teal : P.amber}
        style={{ alignSelf: "flex-start", padding: "9px 26px", fontSize: 14 }}>
        {mode === "hypo" ? "Analyze Hyponatremia" : "Analyze Hypernatremia"}
      </Btn>

      {result && (
        <div>
          {result.steps.map((s, i) => (
            <StepCard key={i} num={i + 1} label={s.title} color={s.color}>
              <div style={{ fontFamily: DM, fontSize: 12, color: P.dim, lineHeight: 1.6 }}>{s.body}</div>
            </StepCard>
          ))}
          <div style={{ ...glassPanel(), borderLeft: `3px solid ${P.gold}` }}>
            <div style={{ fontFamily: DM, fontSize: 13, fontWeight: 600, color: P.gold, marginBottom: 8 }}>Management</div>
            {result.mgmt.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 8, padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ color: P.gold, fontFamily: MO, fontSize: 11, flexShrink: 0 }}>{i + 1}.</span>
                <span style={{ fontFamily: DM, fontSize: 12, color: P.txt, lineHeight: 1.5 }}>{m}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── HYPERKALEMIA TAB ──────────────────────────────────────────────────────────
const TX = [
  { order: 1, name: "Calcium Gluconate", mech: "Membrane stabilization", color: P.red,
    dose: "1g (10 mL of 10%) IV over 2–3 min; repeat q5 min if EKG changes persist", onset: "1–3 min", dur: "30–60 min",
    effect: "No K lowering — cardiac protection only", note: "If digoxin toxicity: infuse over 20–30 min (Ca potentiates dig). CaCl2 is 3× more elemental Ca — reserve for cardiac arrest.", when: "EKG changes or K ≥6.5", thresh: 5.5 },
  { order: 2, name: "Regular Insulin + D50W", mech: "Transcellular shift", color: P.amber,
    dose: "10 units regular insulin IV + D50W 25g (1 amp); omit dextrose if glucose >250", onset: "15–30 min", dur: "4–6 hr",
    effect: "↓ K 0.5–1.5 mEq/L", note: "Monitor glucose q1h × 4h. Peak hypoglycemia risk at 1–4h. Consider D10W infusion after.", when: "K ≥5.5", thresh: 5.5 },
  { order: 3, name: "Nebulized Albuterol", mech: "Transcellular shift (beta-2)", color: P.amber,
    dose: "10–20 mg nebulized (4–8× standard dose; standard 2.5 mg neb is subtherapeutic)", onset: "20–30 min", dur: "2–4 hr",
    effect: "↓ K 0.5–1.0 mEq/L — additive with insulin", note: "Tachycardia expected. Use cautiously in ischemic HD or active ACS.", when: "K ≥5.5 — additive to insulin", thresh: 5.5 },
  { order: 4, name: "Sodium Bicarbonate", mech: "Transcellular shift (alkalosis)", color: P.teal,
    dose: "50–100 mEq IV (1–2 amps) over 5–10 min", onset: "30–60 min", dur: "2 hr",
    effect: "Modest — most effective with concurrent metabolic acidosis", note: "Minimal effect at normal pH. Do NOT co-administer with Ca in same IV line (precipitates).", when: "Concurrent metabolic acidosis", thresh: 5.5 },
  { order: 5, name: "Furosemide", mech: "Renal elimination", color: P.grn,
    dose: "40–80 mg IV (if not anuric and volume-replete)", onset: "15–30 min", dur: "6 hr",
    effect: "Increases urinary K excretion", note: "Ineffective in oligo/anuria or severe AKI. May need higher doses if chronic loop diuretic use.", when: "Functioning kidneys, volume-replete", thresh: 5.5 },
  { order: 6, name: "Patiromer / SZC (Lokelma)", mech: "GI cation exchange — elimination", color: P.grn,
    dose: "Patiromer (Veltassa): 8.4g PO daily | SZC (Lokelma): 10g PO TID × 48h, then 5–10g daily", onset: "2–6h (SZC faster)", dur: "Ongoing",
    effect: "↓ K 0.5–1.0 mEq/L over hours–days", note: "Not for acute emergencies — use for maintenance. Avoid Kayexalate (sodium polystyrene sulfonate) — risk of bowel necrosis, especially post-op.", when: "Subacute / discharge planning", thresh: 5.0 },
  { order: 7, name: "Emergent Hemodialysis", mech: "Definitive elimination", color: P.red,
    dose: "HD preferred; CRRT if hemodynamically unstable", onset: "During treatment", dur: "Session-dependent",
    effect: "↓ K 1–2 mEq/L per hour of HD", note: "Indications: K ≥6.5 refractory to meds, AKI/CKD, life-threatening arrhythmia. Contact nephrology early.", when: "Refractory / AKI / EKG instability", thresh: 6.5 },
];

function HyperkalemiaTab() {
  const [K, setK] = useState("");
  const kVal = parseFloat(K);

  const ekgChanges = () => {
    if (!kVal) return [];
    const out = [];
    if (kVal < 5.5) out.push({ finding: "No expected EKG changes", detail: "EKG changes begin at K ≥5.5. Current level is mild-moderate.", color: P.grn });
    if (kVal >= 5.5) out.push({ finding: "Peaked T waves", detail: "Narrow-based, symmetric, tall T waves. Best seen V2–V4. First EKG change.", color: P.amber });
    if (kVal >= 6.0) out.push({ finding: "PR prolongation + early QRS widening", detail: "P-R interval >200 ms. QRS begins to widen. P wave amplitude decreasing.", color: "#ff7043" });
    if (kVal >= 6.5) out.push({ finding: "P wave flattening / loss", detail: "Atrial standstill. Junctional or ventricular escape rhythm. Significant QRS widening.", color: P.red });
    if (kVal >= 7.0) out.push({ finding: "Sine wave pattern", detail: "QRS and T wave merge. Pre-terminal. Imminent VFib or pulseless VT — treat as cardiac emergency.", color: P.red });
    return out;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Row>
        <FG label="Serum K (mEq/L)" value={K} onChange={setK} placeholder="5.0 – 7.5+" half />
        {kVal >= 6.5 && (
          <div style={{ flex: "1 1 calc(50% - 6px)" }}>
            <AlertBox text="CRITICAL K ≥6.5. Emergent treatment. Cardiac monitor now. Activate dialysis early." color={P.red} />
          </div>
        )}
      </Row>

      {kVal > 0 && (
        <div style={glassPanel()}>
          <div style={{ fontFamily: DM, fontSize: 13, fontWeight: 600, color: P.teal, marginBottom: 10 }}>Expected EKG Changes at K = {kVal.toFixed(1)}</div>
          {ekgChanges().map((e, i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", alignItems: "flex-start" }}>
              <div style={{ minWidth: 200 }}><Pill text={e.finding} color={e.color} /></div>
              <span style={{ fontFamily: DM, fontSize: 12, color: P.dim, lineHeight: 1.5 }}>{e.detail}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ fontFamily: PL, fontSize: 17, color: P.gold }}>Treatment Cascade</div>
      <div style={{ fontFamily: DM, fontSize: 12, color: P.dim, marginTop: -8 }}>Steps 1–3 are additive and should be initiated simultaneously in emergent hyperkalemia.</div>

      {TX.filter(t => !kVal || kVal >= t.thresh).map(t => (
        <div key={t.order} style={{ ...glassPanel(), borderLeft: `3px solid ${t.color}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: MO, fontSize: 10, color: t.color, border: `1px solid ${t.color}`, borderRadius: "50%", width: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{t.order}</span>
            <span style={{ fontFamily: PL, fontSize: 15, color: P.txt }}>{t.name}</span>
            <Pill text={t.mech} color={t.color} />
            <span style={{ marginLeft: "auto", fontFamily: DM, fontSize: 11, color: P.dim, fontStyle: "italic" }}>{t.when}</span>
          </div>
          <ValRow label="Dose" value={t.dose} color={P.txt} />
          <ValRow label="Onset" value={t.onset} color={P.teal} />
          <ValRow label="Duration" value={t.dur} color={P.dim} />
          <ValRow label="K-lowering effect" value={t.effect} color={P.gold} />
          <AlertBox text={t.note} color={t.color} />
        </div>
      ))}
    </div>
  );
}

// ── MAIN HUB ──────────────────────────────────────────────────────────────────
export default function ElectrolyteAcidBaseHub() {
  const [tab, setTab] = useState("abg");
  const TABS = [
    { id: "abg", icon: "🫧", label: "ABG / VBG Analyzer" },
    { id: "electrolytes", icon: "⚗", label: "Electrolyte Replacement" },
    { id: "sodium", icon: "⚖", label: "Sodium Disorders" },
    { id: "hyperkalemia", icon: "⚡", label: "Hyperkalemia" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: P.bg, fontFamily: DM, color: P.txt, padding: 0 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.3; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      <div style={{ padding: "24px 24px 0", borderBottom: `1px solid ${P.gb}`, background: "rgba(0,0,0,0.18)" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <div style={{ fontFamily: PL, fontSize: 26, fontWeight: 700, color: P.teal, marginBottom: 3 }}>
            Electrolyte & Acid-Base Hub
          </div>
          <div style={{ fontFamily: DM, fontSize: 13, color: P.dim, marginBottom: 18 }}>
            ABG/VBG interpretation · Electrolyte replacement · Sodium disorders · Hyperkalemia management
          </div>
          <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                background: tab === t.id ? `${P.teal}18` : "transparent",
                border: "none", borderBottom: tab === t.id ? `2px solid ${P.teal}` : "2px solid transparent",
                color: tab === t.id ? P.teal : P.dim, cursor: "pointer",
                fontFamily: DM, fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
                padding: "10px 18px", transition: "all 0.15s", borderRadius: "6px 6px 0 0",
              }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "24px 24px 40px" }}>
        {tab === "abg" && <ABGTab />}
        {tab === "electrolytes" && <ElectrolytesTab />}
        {tab === "sodium" && <SodiumTab />}
        {tab === "hyperkalemia" && <HyperkalemiaTab />}
      </div>
    </div>
  );
}