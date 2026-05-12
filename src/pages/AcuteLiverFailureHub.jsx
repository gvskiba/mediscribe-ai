import { useState } from "react";

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
const sL   = (c = T.amber) => ({ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: c, margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 8 });
const dv   = { height: 1, background: T.border, margin: "10px 0" };
const inp  = { padding: "9px 12px", background: T.glassMid, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: T.mono, fontWeight: 600, outline: "none" };

// ── HE Grades ─────────────────────────────────────────────────────────────────
const HE_GRADES = [
  { grade: "Grade 1", color: T.gold,  features: "Mild confusion · altered sleep/wake · anxiety · euphoria · asterixis subtle",          airway: "Protect airway — monitor closely" },
  { grade: "Grade 2", color: T.amber, features: "Lethargy · moderate confusion · disorientation · asterixis present · personality changes", airway: "ICU admission — aspiration risk" },
  { grade: "Grade 3", color: T.coral, features: "Severe confusion · somnolent but arousable · marked asterixis · incontinence",             airway: "Intubate for airway protection" },
  { grade: "Grade 4", color: T.coral, features: "Coma — unresponsive to stimuli · decerebrate or decorticate posturing",                    airway: "Intubated — ICP monitoring consider" },
];

// ── Etiology List ─────────────────────────────────────────────────────────────
const ETIOLOGIES = [
  { cause: "Acetaminophen (APAP)", freq: "Most common (US/UK > 50%)",                color: T.teal,   tx: "NAC immediately · Rumack-Matthew nomogram",                                                     prognosis: "Best (hyperacute)" },
  { cause: "Idiosyncratic DILI",   freq: "2nd most common",                           color: T.gold,   tx: "Stop offending drug · NAC for early HE · corticosteroids if autoimmune features",               prognosis: "Variable" },
  { cause: "Viral Hepatitis",      freq: "HAV · HBV · HEV (pregnancy) · HSV · CMV",  color: T.blue,   tx: "Entecavir/tenofovir (HBV) · Acyclovir (HSV) · supportive",                                     prognosis: "Moderate" },
  { cause: "Autoimmune Hepatitis", freq: "AIH — any age · female predominance",       color: T.purple, tx: "Prednisolone 40–60 mg/day · if no response in 7 days → transplant listing",                    prognosis: "Responds to steroids (if early)" },
  { cause: "Ischemic Hepatitis",   freq: "Shock liver · right heart failure · Budd-Chiari", color: T.amber, tx: "Treat underlying shock · anticoagulation for Budd-Chiari · TIPS consideration",           prognosis: "Depends on underlying cause" },
  { cause: "Wilson's Disease",     freq: "Young patients · Kayser-Fleischer rings · hemolytic anemia", color: T.green, tx: "Liver transplant (definitive) · D-penicillamine · plasma exchange (bridge)",  prognosis: "Poor without transplant" },
  { cause: "Amanita phalloides",   freq: "Mushroom poisoning · delayed 24–72h",       color: T.coral,  tx: "NAC + silibinin (milk thistle) if available · penicillin G IV · charcoal (if early)",          prognosis: "Poor — high transplant rate" },
  { cause: "Pregnancy-related",    freq: "AFLP · HELLP syndrome · preeclampsia",       color: T.purple, tx: "Delivery is definitive treatment · NAC · supportive care",                                   prognosis: "Good with delivery" },
  { cause: "Indeterminate",        freq: "Seronegative (~15–20%)",                     color: T.coral,  tx: "Supportive · rule out all known causes · consider autoimmune empirically",                    prognosis: "Poor (worst of all etiologies)" },
];

// ── NAC Bags ─────────────────────────────────────────────────────────────────
const NAC_BAGS = [
  { bag: "Bag 1 — Loading",     dose: "150 mg/kg", multiplier: 150, vol: "200 mL D5W",  time: "60 min"   },
  { bag: "Bag 2 — Maintenance", dose: "50 mg/kg",  multiplier: 50,  vol: "500 mL D5W",  time: "4 hours"  },
  { bag: "Bag 3 — Maintenance", dose: "100 mg/kg", multiplier: 100, vol: "1000 mL D5W", time: "16 hours" },
];

import { useNavigate } from "react-router-dom";

// ── Main Component ───────────────────────────────────────────────────────────
export default function AcuteLiverFailureHub({ onBack }) {
  const navigate = useNavigate();
  const handleBack = () => onBack ? onBack() : navigate("/CriticalProtocolsPage");
  const [tab, setTab]             = useState(0);
  const [heGrade, setHeGrade]     = useState(null);
  const [etiology, setEtiology]   = useState(null);
  const [wt, setWt]               = useState("");
  const [kccType, setKccType]     = useState("APAP");
  const [kccPh, setKccPh]         = useState("");
  const [kccInr, setKccInr]       = useState("");
  const [kccCr, setKccCr]         = useState("");
  const [kccHe, setKccHe]         = useState(false);
  const [kccAge, setKccAge]       = useState(false);
  const [kccEtio, setKccEtio]     = useState(false);
  const [kccJaundice, setKccJaundice] = useState(false);
  const [kccBili, setKccBili]     = useState(false);
  const [meldCr, setMeldCr]       = useState("");
  const [meldBili, setMeldBili]   = useState("");
  const [meldInr, setMeldInr]     = useState("");
  const TABS = ["Recognition", "Treatment", "Workup", "Monitoring"];

  const wtNum = parseFloat(wt);
  const nacDoses = !isNaN(wtNum) && wt !== "" ? NAC_BAGS.map(b => ({ ...b, mgDose: (wtNum * b.multiplier).toFixed(0) })) : null;

  const kccApapMet = kccType === "APAP" && (
    (kccPh !== "" && parseFloat(kccPh) < 7.30) ||
    (parseFloat(kccInr) > 6.5 && parseFloat(kccCr) > 3.4 && kccHe)
  );
  const kccNonApapCount = [parseFloat(kccInr) > 6.5, kccAge, kccEtio, kccJaundice, kccBili].filter(Boolean).length;
  const kccNonApapMet   = kccType === "Non-APAP" && kccNonApapCount >= 3;
  const kccMet          = kccApapMet || kccNonApapMet;

  const meldScore = (() => {
    const cr = parseFloat(meldCr); const bili = parseFloat(meldBili); const inr = parseFloat(meldInr);
    if (isNaN(cr) || isNaN(bili) || isNaN(inr)) return null;
    const crCap = Math.min(Math.max(cr, 1.0), 4.0);
    return Math.round(9.57 * Math.log(crCap) + 3.78 * Math.log(Math.max(bili, 1.0)) + 11.20 * Math.log(Math.max(inr, 1.0)) + 6.43);
  })();

  const selHe   = HE_GRADES.find(h => h.grade === heGrade);
  const selEtio = ETIOLOGIES.find(e => e.cause === etiology);

  const numField = (label, val, setter, placeholder) => (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 10, color: T.muted, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
      <input value={val} onChange={e => setter(e.target.value)} placeholder={placeholder} type="number" step="0.01"
        style={{ ...inp, width: "100%", boxSizing: "border-box" }} />
    </div>
  );

  const checkRow = (label, checked, setter, color = T.coral) => (
    <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 7, cursor: "pointer" }} onClick={() => typeof setter === "function" && setter(!checked)}>
      <div style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${checked ? color : T.border}`, background: checked ? color + "30" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: checked ? color : T.dim, flexShrink: 0 }}>
        {checked && "✓"}
      </div>
      <div style={{ fontSize: 12, color: checked ? T.white : T.muted }}>{label}</div>
    </div>
  );

  // ── TAB 0: RECOGNITION ────────────────────────────────────────────────────
  const Tab0 = (
    <div>
      <div style={aBox(T.coral, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 4 }}>ALF Definition — All Three Required</div>
        {["Coagulopathy: INR ≥ 1.5 (or PT > 15s)", "Hepatic Encephalopathy (any grade)", "No pre-existing liver disease · Onset within 26 weeks"].map((c, i) =>
          <div key={i} style={{ fontSize: 11.5, color: T.muted, display: "flex", gap: 7, marginBottom: 3 }}><span style={{ color: T.coral }}>●</span>{c}</div>
        )}
      </div>

      <div style={sL()}>Hepatic Encephalopathy — West Haven Grading</div>
      {HE_GRADES.map(h => (
        <div key={h.grade}
          style={{ ...G(), padding: "12px 14px", marginBottom: 8, border: `1.5px solid ${heGrade === h.grade ? h.color + "70" : T.border}`, background: heGrade === h.grade ? h.color + "0d" : T.glass, cursor: "pointer", transition: "all 0.2s" }}
          onClick={() => setHeGrade(heGrade === h.grade ? null : h.grade)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: h.color }}>{h.grade}</span>
            <span style={{ fontSize: 13, color: heGrade === h.grade ? h.color : T.dim }}>{heGrade === h.grade ? "▲" : "▼"}</span>
          </div>
          <div style={{ fontSize: 11.5, color: T.muted, marginTop: 3 }}>{h.features.split("·")[0].trim()}…</div>
          {heGrade === h.grade && (
            <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${h.color}30` }}>
              <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 6 }}>{h.features}</div>
              <div style={aBox(h.color, 0)}><div style={{ fontSize: 11.5, color: h.color, fontWeight: 600 }}>→ {h.airway}</div></div>
            </div>
          )}
        </div>
      ))}

      <div style={sL(T.blue)}>Temporal Classification (Onset of Jaundice → HE)</div>
      {[
        { type: "Hyperacute", time: "< 7 days",    causes: "APAP · Amanita · ischemic",                            prognosis: "Paradoxically best (spontaneous survival ~60%)", color: T.green },
        { type: "Acute",      time: "7–28 days",   causes: "Hepatitis A/B/E · APAP late presentation",             prognosis: "Intermediate prognosis", color: T.gold },
        { type: "Subacute",   time: "5–26 weeks",  causes: "Idiosyncratic DILI · seronegative · autoimmune",       prognosis: "Worst prognosis — highest transplant rate", color: T.coral },
      ].map(({ type, time, causes, prognosis, color }) => (
        <div key={type} style={{ ...card({ marginBottom: 8, borderLeft: `3px solid ${color}` }) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color }}>{type}</span>
            <span style={{ ...tag(color), fontSize: 10 }}>{time}</span>
          </div>
          <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 3 }}>{causes}</div>
          <div style={{ fontSize: 11.5, color: color + "bb", fontWeight: 600 }}>{prognosis}</div>
        </div>
      ))}

      <div style={sL(T.teal)}>Etiology — tap for treatment</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: etiology ? 10 : 0 }}>
        {ETIOLOGIES.map(e => (
          <button key={e.cause}
            style={{ padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${etiology === e.cause ? e.color : T.border}`, background: etiology === e.cause ? e.color + "20" : T.glass, color: etiology === e.cause ? e.color : T.muted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, transition: "all 0.15s" }}
            onClick={() => setEtiology(etiology === e.cause ? null : e.cause)}>
            {e.cause}
          </button>
        ))}
      </div>
      {selEtio && (
        <div style={{ ...card({ border: `1.5px solid ${selEtio.color}55`, marginBottom: 14 }) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: selEtio.color }}>{selEtio.cause}</div>
              <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>{selEtio.freq}</div>
            </div>
            <div style={{ ...tag(selEtio.color), fontSize: 9, whiteSpace: "nowrap" }}>Prognosis: {selEtio.prognosis}</div>
          </div>
          <div style={aBox(selEtio.color, 0)}>
            <div style={{ fontSize: 11, fontWeight: 700, color: selEtio.color, marginBottom: 2 }}>Treatment</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{selEtio.tx}</div>
          </div>
        </div>
      )}

      <div style={sL(T.coral)}>King's College Criteria — Transplant Listing</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {["APAP", "Non-APAP"].map(t => (
          <button key={t}
            style={{ flex: 1, padding: "8px", borderRadius: 9, border: `1.5px solid ${kccType === t ? T.coral : T.border}`, background: kccType === t ? "rgba(244,63,94,0.16)" : T.glass, color: kccType === t ? T.coral : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans }}
            onClick={() => setKccType(t)}>{t}-Induced ALF</button>
        ))}
      </div>

      {kccType === "APAP" ? (
        <div style={card({ marginBottom: 14 })}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.coral, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>List if ANY ONE criteria met (after resuscitation)</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {numField("Arterial pH", kccPh, setKccPh, "7.25")}
            {numField("INR", kccInr, setKccInr, "7.0")}
            {numField("Creatinine (mg/dL)", kccCr, setKccCr, "3.5")}
          </div>
          {checkRow("Grade 3–4 HE concurrent with INR > 6.5 and Cr > 3.4", kccHe, setKccHe)}
          <div style={{ ...aBox(kccMet ? T.coral : T.green, 0), marginTop: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: kccMet ? T.coral : T.green }}>
              {kccMet ? "⚠ KCC MET — Transplant listing indicated" : "KCC not met (or incomplete)"}
            </div>
            {kccMet && <div style={{ fontSize: 11.5, color: T.muted, marginTop: 3 }}>Contact transplant center immediately · discuss with hepatology</div>}
          </div>
        </div>
      ) : (
        <div style={card({ marginBottom: 14 })}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.coral, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>List if 3 or more criteria met</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {numField("INR", kccInr, setKccInr, "7.0")}
          </div>
          {checkRow(`INR > 6.5 / PT > 100s${parseFloat(kccInr) > 6.5 ? " ✓" : ""}`, parseFloat(kccInr) > 6.5, null)}
          {checkRow("Age < 10 or > 40 years", kccAge, setKccAge)}
          {checkRow("Etiology: seronegative or idiosyncratic DILI", kccEtio, setKccEtio)}
          {checkRow("Jaundice > 7 days before HE onset", kccJaundice, setKccJaundice)}
          {checkRow("Bilirubin > 17.4 mg/dL (> 300 µmol/L)", kccBili, setKccBili)}
          <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 8 }}>{kccNonApapCount} / 5 criteria met</div>
          <div style={aBox(kccNonApapMet ? T.coral : T.teal, 0)}>
            <div style={{ fontSize: 13, fontWeight: 800, color: kccNonApapMet ? T.coral : T.teal }}>
              {kccNonApapMet ? "⚠ KCC MET — Transplant listing indicated" : `${kccNonApapCount} / 5 — ${kccNonApapCount < 3 ? "KCC not met" : "KCC met"}`}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── TAB 1: TREATMENT ──────────────────────────────────────────────────────
  const Tab1 = (
    <div>
      <div style={sL()}>N-Acetylcysteine (NAC) — Give to All ALF Patients</div>
      <div style={{ ...card({ marginBottom: 12, border: `1.5px solid ${T.teal}50` }) }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, marginBottom: 8 }}>IV NAC 3-Bag Protocol — Dose Calculator</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <input value={wt} onChange={e => setWt(e.target.value)} placeholder="Weight (kg)" type="number"
            style={{ ...inp, flex: 1 }} />
          <span style={{ fontSize: 12, color: T.muted }}>kg</span>
        </div>
        {nacDoses ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {nacDoses.map(({ bag, dose, mgDose, vol, time }, i) => (
              <div key={bag} style={{ ...G({ borderRadius: 10 }), padding: "11px 13px", borderLeft: `3px solid ${[T.coral, T.gold, T.teal][i]}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: [T.coral, T.gold, T.teal][i] }}>{bag}</span>
                  <span style={{ ...tag([T.coral, T.gold, T.teal][i]), fontSize: 9 }}>{time}</span>
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 14, color: T.white, fontWeight: 700, marginBottom: 2 }}>{mgDose} mg</div>
                <div style={{ fontSize: 11, color: T.muted }}>({dose} = {mgDose} mg) in {vol}</div>
              </div>
            ))}
          </div>
        ) : (
          NAC_BAGS.map(({ bag, dose, vol, time }, i) => (
            <div key={bag} style={{ ...G({ borderRadius: 9, marginBottom: 6 }), padding: "9px 12px", borderLeft: `3px solid ${[T.coral, T.gold, T.teal][i]}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: [T.coral, T.gold, T.teal][i] }}>{bag}</span>
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted }}>{time}</span>
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 12, color: T.white }}>{dose} in {vol}</div>
            </div>
          ))
        )}
        <div style={{ ...aBox(T.teal, 0), marginTop: 10 }}>
          <div style={{ fontSize: 11.5, color: T.muted }}>
            <span style={{ color: T.teal, fontWeight: 600 }}>Non-APAP ALF (Lee 2009 NEJM): </span>NAC improved transplant-free survival in early HE (Grade 1–2). Give to all ALF patients.
          </div>
        </div>
      </div>

      <div style={sL(T.purple)}>Hepatic Encephalopathy Management</div>
      {[
        { tx: "Lactulose",    dose: "25–30 mL PO/NG q 1–2h until 2–3 soft stools/day · then 15–30 mL q 6–8h",  note: "First-line — acidify colon → trap NH₃ · reduces ammonia-producing bacteria", color: T.teal },
        { tx: "Rifaximin",    dose: "550 mg PO BID (adjunct to lactulose)",                                      note: "Non-absorbed antibiotic · reduces gut ammonia production", color: T.blue },
        { tx: "Zinc",         dose: "220 mg PO BID",                                                             note: "Cofactor for urea cycle enzymes — often deficient in liver disease", color: T.gold },
        { tx: "Intubation",   dose: "Grade 3–4 HE → early intubation",                                          note: "Airway protection · aspiration prevention · allows sedation for procedures", color: T.coral },
        { tx: "Nutrition",    dose: "1.2–1.5 g/kg/day protein — NOT restricted",                                 note: "Old teaching was wrong — protein restriction worsens outcomes · adequate nutrition essential", color: T.amber },
      ].map(({ tx, dose, note, color }) => (
        <div key={tx} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 3 }}>{tx}</div>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.white, marginBottom: 3 }}>{dose}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{note}</div>
        </div>
      ))}
      <div style={aBox(T.coral, 14)}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: T.coral, marginBottom: 2 }}>⚠ Avoid in HE</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Sedatives · opioids · benzodiazepines · diuretics (electrolyte disturbances) · nephrotoxic agents</div>
      </div>

      <div style={sL(T.gold)}>Coagulopathy — INR is a Prognostic Marker</div>
      <div style={aBox(T.gold, 14)}>
        <div style={{ fontSize: 11.5, color: T.muted }}>
          <span style={{ color: T.gold, fontWeight: 600 }}>Do NOT correct INR prophylactically — </span>INR reflects hepatic synthetic function and is the best prognostic marker. Correcting with FFP obscures severity.
        </div>
      </div>
      {[
        { ind: "Active hemorrhage",                           tx: "FFP 10–15 mL/kg IV + Cryoprecipitate if fibrinogen < 100 mg/dL", color: T.coral },
        { ind: "Invasive procedure (central line, LP, etc.)", tx: "FFP to INR < 2.0 + PLT > 50k · PCC (4-factor) for urgent reversal", color: T.amber },
        { ind: "Vitamin K",                                   tx: "10 mg IV daily × 3 days — replenish K-dependent factors (II, VII, IX, X)", color: T.gold },
        { ind: "Thrombocytopenia",                            tx: "Transfuse if PLT < 50k with bleeding · < 20k prophylactically", color: T.teal },
      ].map(({ ind, tx, color }) => (
        <div key={ind} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{ind}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{tx}</div>
        </div>
      ))}

      <div style={sL(T.blue)}>Systemic Supportive Care</div>
      {[
        { sys: "Hemodynamics", detail: "Norepinephrine for vasoplegic shock · avoid aggressive IVF (worsens cerebral edema) · MAP ≥ 65", color: T.coral },
        { sys: "Hypoglycemia", detail: "Monitor glucose q 1–2h · continuous D10W for sustained hypoglycemia · target 140–180 mg/dL", color: T.gold },
        { sys: "Infection",    detail: "Low threshold for cultures · empiric broad-spectrum antibiotics if deteriorating · antifungals if prolonged", color: T.teal },
        { sys: "Renal",        detail: "Avoid nephrotoxins · CRRT preferred over intermittent HD · avoid furosemide if volume-depleted", color: T.blue },
        { sys: "Nutrition",    detail: "Early enteral nutrition · 1.2–1.5 g/kg/day protein · BCAA supplements if intolerant · NG tube if intubated", color: T.green },
      ].map(({ sys, detail, color }) => (
        <div key={sys} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{sys}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 2: WORKUP ─────────────────────────────────────────────────────────
  const Tab2 = (
    <div>
      <div style={sL()}>Essential Labs — Send Immediately</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        {[
          { test: "INR / PT",           why: "Most important prognostic marker · Do NOT correct unless bleeding/procedure · rising INR = worsening" },
          { test: "Full hepatic panel", why: "ALT · AST · Alk Phos · total/direct bilirubin · albumin (synthetic function)" },
          { test: "Factor V level",     why: "< 20% with Grade 3–4 HE = very poor prognosis without transplant (Clichy criteria — France)" },
          { test: "Ammonia (arterial)", why: "Correlates with HE severity and cerebral edema risk · venous acceptable if arterial unavailable" },
          { test: "BMP",                why: "Hypoglycemia (monitor q 1–2h) · hyponatremia · creatinine (hepatorenal syndrome)" },
          { test: "CBC",                why: "Thrombocytopenia · anemia · leukocytosis from infection" },
          { test: "Coagulation panel",  why: "PT · aPTT · fibrinogen · D-dimer (DIC screen)" },
          { test: "APAP level",         why: "Even if history unclear — APAP toxicity may be underreported · any detectable level in ALF → NAC" },
          { test: "Lactate (arterial)", why: "pH < 7.30 or lactate > 3.5 after resuscitation = King's College Criterion for APAP" },
          { test: "Phosphate",          why: "Hypophosphatemia in APAP ALF — marker of hepatocyte regeneration (good sign)" },
        ].map(({ test, why }, i) => (
          <div key={test} style={{ display: "flex", gap: 10, paddingBottom: 6, marginBottom: 6, borderBottom: i < 9 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.amber, minWidth: 150, flexShrink: 0 }}>{test}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{why}</div>
          </div>
        ))}
      </div>

      <div style={sL(T.coral)}>MELD Score Calculator</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          {numField("Creatinine (mg/dL)", meldCr, setMeldCr, "2.5")}
          {numField("Bilirubin (mg/dL)", meldBili, setMeldBili, "15")}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {numField("INR", meldInr, setMeldInr, "3.5")}
        </div>
        {meldScore !== null && (
          <div style={aBox(meldScore >= 30 ? T.coral : meldScore >= 20 ? T.amber : T.gold, 0)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.muted }}>MELD Score</span>
              <span style={{ fontFamily: T.mono, fontSize: 26, fontWeight: 800, color: meldScore >= 30 ? T.coral : meldScore >= 20 ? T.amber : T.gold }}>{meldScore}</span>
            </div>
            <div style={{ fontSize: 11.5, color: T.muted, marginTop: 4 }}>
              {meldScore >= 40 ? "90-day mortality > 70% · Urgent transplant listing" : meldScore >= 30 ? "Severe — transplant evaluation urgent · 50–70% 90-day mortality" : meldScore >= 20 ? "Significant — hepatology consult · close monitoring" : "Moderate — monitor for progression"}
            </div>
          </div>
        )}
        <div style={{ fontSize: 10.5, color: T.dim, marginTop: 8 }}>Formula: 9.57 × ln(Cr) + 3.78 × ln(Bili) + 11.20 × ln(INR) + 6.43 · Cr capped at 4.0</div>
      </div>

      <div style={sL(T.teal)}>Etiological Workup</div>
      <div style={{ ...card({ marginBottom: 12 }) }}>
        {[
          { category: "Viral",       tests: "HAV IgM · HBsAg + HBeAg + HBcAb IgM · HCV Ab + RNA · HEV IgM · HSV IgM + PCR · CMV/EBV PCR" },
          { category: "Autoimmune",  tests: "ANA · ASMA · Anti-LKM1 · Serum IgG · consider transjugular liver biopsy if safe" },
          { category: "Metabolic",   tests: "Ceruloplasmin · serum copper · 24h urine copper (Wilson's) · iron studies + ferritin" },
          { category: "Toxicology",  tests: "APAP level · urine tox screen · serum ethanol · mushroom ID if applicable" },
          { category: "Vascular",    tests: "Doppler ultrasound · CT/MR venography for Budd-Chiari · portal/hepatic vein flow" },
          { category: "Malignant",   tests: "α-fetoprotein · CT CAP (metastases · lymphoma) · bone marrow biopsy if lymphoma" },
          { category: "Pregnancy",   tests: "β-hCG · BP monitoring · platelet trend (HELLP vs AFLP vs preeclampsia)" },
        ].map(({ category, tests }, i) => (
          <div key={category} style={{ display: "flex", gap: 10, paddingBottom: 6, marginBottom: 6, borderBottom: i < 6 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, minWidth: 100, flexShrink: 0 }}>{category}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{tests}</div>
          </div>
        ))}
      </div>

      <div style={sL(T.purple)}>Imaging</div>
      {[
        { mod: "RUQ Ultrasound + Doppler", ind: "First-line · liver size/echogenicity · portal and hepatic vein flow · ascites · Budd-Chiari screen", color: T.teal },
        { mod: "CT Abdomen/Pelvis",        ind: "If US inconclusive · Budd-Chiari · masses · lymphoma · liver architecture", color: T.blue },
        { mod: "MRI Brain",                ind: "Cerebral edema assessment · herniation risk · Grade 3–4 HE · before ICP monitor", color: T.purple },
        { mod: "CT Head (non-contrast)",   ind: "If MRI unavailable · acute hemorrhage · herniation signs before ICP monitor", color: T.amber },
      ].map(({ mod, ind, color }) => (
        <div key={mod} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{mod}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{ind}</div>
        </div>
      ))}

      <div style={sL(T.gold)}>Thyroid Function Tests</div>
      {[
        { test: "TSH + Free T4",  find: "Hypothyroidism can mimic encephalopathy · hyperthyroidism can cause hepatitis", color: T.gold },
        { test: "ANA + ASMA",     find: "Autoimmune hepatitis screen · if positive, consider steroid trial", color: T.purple },
      ].map(({ test, find, color }) => (
        <div key={test} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{test}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{find}</div>
        </div>
      ))}
    </div>
  );

  // ── TAB 3: MONITORING ─────────────────────────────────────────────────────
  const Tab3 = (
    <div>
      <div style={sL()}>ICU Admission Criteria — ANY ONE</div>
      <div style={{ ...card({ background: "rgba(244,63,94,0.07)", borderColor: "rgba(244,63,94,0.25)", marginBottom: 14 }) }}>
        {["HE Grade 2 or higher", "INR > 2.0 with any encephalopathy", "Evidence of cerebral edema (CT/clinical)", "Hemodynamic instability / vasopressor requirement", "Renal failure (creatinine rising or oliguria)", "Hypoglycemia requiring IV dextrose", "Arterial pH < 7.35 or lactate > 3.5 mmol/L", "Respiratory failure or aspiration risk"].map((c, i) => (
          <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}><span style={{ color: T.coral }}>●</span>{c}</div>
        ))}
      </div>

      <div style={sL(T.purple)}>Cerebral Edema / ICP Management</div>
      {[
        { tx: "HOB 30° elevation",        detail: "Standard for all ALF patients · reduces ICP via venous drainage", color: T.blue },
        { tx: "Hypertonic saline (3%)",   detail: "Target Na⁺ 145–155 mEq/L (prophylactic hypernatremia) · 150 mL bolus or continuous infusion", color: T.teal },
        { tx: "Mannitol 0.5–1 g/kg IV",  detail: "If serum osmolarity < 320 mOsm/kg · repeat q 4–6h PRN · stop if > 320", color: T.gold },
        { tx: "Hyperventilation",         detail: "Target PaCO₂ 35–40 mmHg briefly (bridge only) · reduces cerebral blood flow transiently", color: T.amber },
        { tx: "Therapeutic Hypothermia",  detail: "33–35°C — bridge to transplant in refractory ICP · only at transplant centers", color: T.purple },
        { tx: "ICP Monitor",              detail: "High hemorrhagic risk with coagulopathy · consider transjugular · only at transplant centers with corrected coagulopathy", color: T.coral },
      ].map(({ tx, detail, color }) => (
        <div key={tx} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{tx}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
        </div>
      ))}

      <div style={sL()}>Monitoring Schedule</div>
      {[
        { freq: "Every 1–2h",  items: "Glucose · neurological status · urine output · vasopressor titration",             color: T.coral },
        { freq: "Every 4h",    items: "INR · BMP (Cr · K⁺ · Na⁺) · arterial ammonia · pH · lactate",                    color: T.gold },
        { freq: "Every 6–12h", items: "LFTs · CBC · phosphate · renal function · reassess HE grade",                      color: T.teal },
        { freq: "Every 24h",   items: "MELD score · KCC reassessment · transplant status review · echo if unstable",      color: T.green },
        { freq: "Continuous",  items: "Cardiac monitor · SpO₂ · EtCO₂ (if intubated) · arterial line for invasive BP",   color: T.purple },
      ].map(({ freq, items, color }) => (
        <div key={freq} style={{ ...G(), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, fontWeight: 700, color, minWidth: 100, flexShrink: 0 }}>{freq}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{items}</div>
        </div>
      ))}

      <div style={sL(T.coral)}>Liver Transplant — Listing Triggers</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        {["King's College Criteria met (APAP or non-APAP — see Recognition tab)", "MELD ≥ 30 with progressive course", "Factor V < 20% with Grade 3–4 HE (Clichy criteria)", "Rapid deterioration despite optimal medical therapy", "Grade 3–4 HE with rising INR or rising ammonia"].map((c, i) => (
          <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}><span style={{ color: T.coral }}>●</span>{c}</div>
        ))}
        <div style={aBox(T.gold, 0)}>
          <div style={{ fontSize: 11.5, color: T.muted }}>
            <span style={{ color: T.gold, fontWeight: 600 }}>UNOS Status 1A: </span>ALF with life expectancy &lt; 7 days without transplant · highest priority · call transplant center immediately
          </div>
        </div>
      </div>

      <div style={sL(T.green)}>Prognosis Without Transplant</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
        {[
          { etio: "APAP",              surv: "~65%", color: T.green },
          { etio: "Hepatitis A",       surv: "~60%", color: T.teal },
          { etio: "Hepatitis B",       surv: "~40%", color: T.gold },
          { etio: "AIH",               surv: "~40–60%", color: T.blue },
          { etio: "Idiosyncratic DILI", surv: "~25%", color: T.amber },
          { etio: "Seronegative",      surv: "~15–25%", color: T.coral },
        ].map(({ etio, surv, color }) => (
          <div key={etio} style={{ ...G({ borderRadius: 9 }), padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 3 }}>{etio}</div>
            <div style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 800, color }}>{surv}</div>
            <div style={{ fontSize: 10, color: T.dim }}>spontaneous survival</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(245,158,11,0.09) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(244,63,94,0.08) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>

      <div style={{ padding: "20px 20px 0" }}>
        <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 16 }}>
          ← Critical Protocols
        </button>
        <div>
          <span style={pill("linear-gradient(135deg,#f59e0b,#b45309)")}>🔬 Hepatology</span>
          <span style={pill("linear-gradient(135deg,#0d9488,#065f46)")}>AASLD / King's College</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>Acute Liver Failure</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>King's College Criteria · NAC protocol · HE grading · MELD calculator · Transplant criteria · ICP management</p>
      </div>

      <div style={{ display: "flex", gap: 4, padding: "0 20px", marginBottom: 18, overflowX: "auto", scrollbarWidth: "none" }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: "7px 15px", borderRadius: 9, border: `1.5px solid ${tab === i ? T.amber : T.border}`, background: tab === i ? "rgba(245,158,11,0.14)" : T.glass, color: tab === i ? T.amber : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, whiteSpace: "nowrap", transition: "all 0.18s", backdropFilter: "blur(8px)" }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 20px" }}>
        {tab === 0 && Tab0}
        {tab === 1 && Tab1}
        {tab === 2 && Tab2}
        {tab === 3 && Tab3}
      </div>
    </div>
  );
}