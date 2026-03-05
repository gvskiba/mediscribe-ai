import React, { useMemo, useState } from "react";

const T = {
  navy:"#050f1e", panel:"#0d2240", edge:"#162d4f",
  border:"#1e3a5f", muted:"#2a4d72", dim:"#4a7299", text:"#c8ddf0",
  bright:"#e8f4ff", teal:"#00d4bc", teal2:"#00a896", amber:"#f5a623",
  red:"#ff5c6c", green:"#2ecc71", purple:"#9b6dff", blue:"#4a90d9",
};

// ─── PK-guided dosing logic keyed by drug name ─────────────────────────────
// Each entry: fn(age, wt, crcl, setting) → { dose, freq, route, note, warning }
const DRUG_CALC = {
  "Vancomycin": (age, wt, crcl) => {
    const dailyDose = Math.round(wt * 27.5 / 250) * 250; // 25-30 mg/kg/day, round to 250mg
    let freq, note, warning;
    if (crcl === null) {
      freq = "q8–12h"; note = "AUC/MIC-guided dosing. Target AUC 400–600. Pharmacy consult recommended."; warning = null;
    } else if (crcl >= 60) {
      freq = "q8–12h"; note = "Normal renal function. AUC-guided dosing preferred over trough-only monitoring."; warning = null;
    } else if (crcl >= 30) {
      freq = "q12–24h"; note = "Mild renal impairment — extend interval. Pharmacy consult for AUC monitoring."; warning = "Interval extended for CrCl 30–59 mL/min";
    } else if (crcl >= 15) {
      freq = "q24–48h"; note = "Moderate impairment — significantly extend interval. Consider loading dose 25 mg/kg then monitor AUC closely."; warning = "⚠ Significant dose accumulation risk";
    } else {
      freq = "post-HD (TDD/HD)"; note = "Severe impairment/dialysis — dose after each HD session. Monitor pre-HD levels."; warning = "⚠ Dialysis dosing — post-HD supplementation";
    }
    const perDose = crcl !== null && crcl < 30
      ? `${Math.round(wt * 15 / 250) * 250}–${Math.round(wt * 20 / 250) * 250} mg`
      : `${Math.round(wt * 12.5 / 250) * 250}–${Math.round(wt * 15 / 250) * 250} mg`;
    return { dose: `${perDose} IV ${freq}`, totalDaily: `${dailyDose} mg/day (${Math.round(wt * 27.5)} mg/day calc)`, route: "IV", note, warning };
  },

  "Daptomycin": (age, wt, crcl) => {
    const stdDose = Math.round(wt * 6);
    const highDose = Math.round(wt * 8);
    let freq = "q24h", warning = null, note;
    if (crcl !== null && crcl < 30) {
      freq = "q48h"; warning = "⚠ CrCl <30 — extend to q48h"; note = "Standard dose, extended interval. Monitor CK weekly.";
    } else {
      note = "6 mg/kg for SSTI; 8–10 mg/kg for bacteremia/endocarditis. NOT for pulmonary infections (inactivated by surfactant).";
    }
    return { dose: `${stdDose}–${highDose} mg IV ${freq}`, totalDaily: `${stdDose} mg (6 mg/kg) to ${highDose} mg (8 mg/kg)`, route: "IV", note, warning };
  },

  "Piperacillin-tazobactam": (age, wt, crcl, setting) => {
    let dose, note, warning = null;
    if (crcl === null || crcl >= 40) {
      dose = setting === "icu" ? "4.5g IV q6h (extend infusion over 4h)" : "4.5g IV q6h";
      note = "Extended infusion (4h) increases time above MIC for Pseudomonas. Preferred for ICU/severe infections.";
    } else if (crcl >= 20) {
      dose = "2.25g IV q6h"; note = "Reduced dose for CrCl 20–40 mL/min."; warning = "Dose reduced for renal impairment";
    } else {
      dose = "2.25g IV q8h"; note = "Severe impairment — 8h interval. Consult pharmacy."; warning = "⚠ CrCl <20 — max 2.25g q8h";
    }
    return { dose, totalDaily: "13.5g/day standard, 6.75–9g/day renal-adjusted", route: "IV", note, warning };
  },

  "Ceftriaxone": (age, wt, crcl, setting) => {
    const dose = setting === "icu" || setting === "meningitis" ? "2g IV q12–24h" : "1–2g IV q24h";
    return { dose, totalDaily: "1–4g/day", route: "IV", note: "No renal adjustment needed — hepatically cleared. Biliary sludging with prolonged use >7 days.", warning: null };
  },

  "Cefepime": (age, wt, crcl) => {
    let dose, warning = null, note;
    if (crcl === null || crcl >= 60) {
      dose = "2g IV q8–12h"; note = "Standard dosing. Use q8h for serious infections, Pseudomonas.";
    } else if (crcl >= 30) {
      dose = "2g IV q12h"; note = "Mild impairment — extend interval."; warning = "Interval extended";
    } else if (crcl >= 11) {
      dose = "1g IV q12h"; note = "Moderate impairment."; warning = "⚠ Reduced dose CrCl 11–29";
    } else {
      dose = "500mg IV q24h"; note = "Severe impairment/dialysis. Supplement after HD."; warning = "⚠ Severe impairment — reduced dose";
    }
    return { dose, totalDaily: "4–6g/day standard", route: "IV", note, warning };
  },

  "Meropenem": (age, wt, crcl, setting) => {
    let dose, note, warning = null;
    if (crcl === null || crcl >= 50) {
      dose = setting === "icu" ? "2g IV q8h" : "1g IV q8h"; note = "Use 2g q8h for CNS infections, VAP, or suspected MDR organisms.";
    } else if (crcl >= 26) {
      dose = "1g IV q12h"; note = "CrCl 26–50."; warning = "Interval extended for renal impairment";
    } else if (crcl >= 10) {
      dose = "500mg IV q12h"; note = "CrCl 10–25."; warning = "⚠ Reduced dose";
    } else {
      dose = "500mg IV q24h"; note = "Dialysis — supplement after HD."; warning = "⚠ Severe impairment/dialysis";
    }
    return { dose, totalDaily: "3–6g/day", route: "IV", note, warning };
  },

  "Ciprofloxacin": (age, wt, crcl, setting) => {
    let dose, note, warning = null;
    const isIV = setting === "inpatient" || setting === "icu";
    if (crcl === null || crcl >= 50) {
      dose = isIV ? "400mg IV q8–12h" : "500–750mg PO q12h"; note = "High oral bioavailability (~70–80%). Switch IV→PO as soon as tolerating.";
    } else if (crcl >= 30) {
      dose = isIV ? "400mg IV q12h" : "500mg PO q12h"; note = "Mild-moderate impairment."; warning = "Interval extended";
    } else {
      dose = "250–500mg PO q24h"; note = "Severe impairment — PO q24h. Avoid IV if possible."; warning = "⚠ CrCl <30 — avoid high doses";
    }
    return { dose, totalDaily: isIV ? "800–1200mg IV/day" : "500–1500mg PO/day", route: isIV ? "IV" : "PO", note, warning };
  },

  "Levofloxacin": (age, wt, crcl) => {
    let dose, note, warning = null;
    if (crcl === null || crcl >= 50) {
      dose = "750mg IV/PO q24h"; note = "Near 100% oral bioavailability — switch IV→PO immediately when tolerating. 5 days for CAP/SSTI, 7 days for complicated UTI.";
    } else if (crcl >= 20) {
      dose = "750mg × 1, then 500mg q24h"; note = "Loading dose, then reduced maintenance."; warning = "Reduced maintenance dose";
    } else {
      dose = "750mg × 1, then 250mg q24h"; note = "Severe impairment."; warning = "⚠ Severe impairment — 250mg/day maintenance";
    }
    return { dose, totalDaily: "500–750mg/day", route: "IV/PO", note, warning };
  },

  "TMP-SMX": (age, wt, crcl) => {
    let dose, note, warning = null;
    if (crcl === null || crcl >= 30) {
      dose = "1–2 DS tabs PO BID"; note = "Each DS tab = TMP 160mg / SMX 800mg. Check local E. coli resistance before empiric use.";
    } else if (crcl >= 15) {
      dose = "1 DS tab PO q24h (50% dose reduction)"; note = "Reduce dose for CrCl 15–29."; warning = "50% dose reduction";
    } else {
      dose = "AVOID (CrCl <15)"; note = "Contraindicated in severe renal impairment."; warning = "⚠ CONTRAINDICATED — CrCl <15";
    }
    return { dose, totalDaily: "2 DS tabs (TMP 320mg) to 4 DS tabs (TMP 640mg)/day", route: "PO", note, warning };
  },

  "Metronidazole": (age, wt, crcl) => ({
    dose: "500mg IV/PO q8h",
    totalDaily: "1500mg/day",
    route: "IV/PO",
    note: "No renal adjustment needed — primarily hepatically metabolized. High oral bioavailability (100%) — switch to PO when possible.",
    warning: null,
  }),

  "Nitrofurantoin": (age, wt, crcl) => {
    if (crcl !== null && crcl < 30) {
      return { dose: "AVOID (CrCl <30)", totalDaily: "—", route: "PO", note: "Contraindicated — inadequate urinary concentration and risk of peripheral neuropathy.", warning: "⚠ CONTRAINDICATED — CrCl <30" };
    }
    return { dose: "100mg ER PO BID × 5 days", totalDaily: "200mg/day", route: "PO", note: "Only for uncomplicated cystitis — NOT for pyelonephritis. Use with caution if CrCl 30–45.", warning: crcl !== null && crcl < 45 ? "Use with caution — CrCl 30–45" : null };
  },

  "Azithromycin": (age, wt, crcl) => ({
    dose: "500mg IV/PO q24h",
    totalDaily: "500mg/day",
    route: "IV/PO",
    note: "No renal adjustment needed. High tissue concentrations — long tissue half-life ~68h. QTc monitoring if cardiac disease.",
    warning: null,
  }),

  "Cefazolin": (age, wt, crcl) => {
    let dose, warning = null, note;
    if (crcl === null || crcl >= 55) {
      dose = "1–2g IV q8h"; note = "Preferred for MSSA infections over vancomycin. Also first-choice surgical prophylaxis.";
    } else if (crcl >= 35) {
      dose = "1g IV q12h"; note = "Mild-moderate impairment."; warning = "Extended interval";
    } else {
      dose = "500mg IV q12h"; note = "Severe impairment."; warning = "⚠ Dose reduced";
    }
    return { dose, totalDaily: "3–6g/day", route: "IV", note, warning };
  },

  "Ertapenem": (age, wt, crcl) => {
    let dose, warning = null, note;
    if (crcl === null || crcl >= 30) {
      dose = "1g IV q24h"; note = "Once-daily carbapenem. No Pseudomonas activity — use for ESBL organisms from urinary/abdominal sources.";
    } else {
      dose = "500mg IV q24h"; note = "CrCl <30."; warning = "⚠ Reduced dose CrCl <30";
    }
    return { dose, totalDaily: "500mg–1g/day", route: "IV", note, warning };
  },

  "Linezolid": (age, wt, crcl) => ({
    dose: "600mg IV/PO q12h",
    totalDaily: "1200mg/day",
    route: "IV/PO",
    note: "No renal adjustment needed. 100% oral bioavailability — switch IV→PO immediately. Monitor for serotonin syndrome, thrombocytopenia (CBC weekly). Avoid MAOIs.",
    warning: null,
  }),

  "Clindamycin": (age, wt, crcl) => ({
    dose: "600–900mg IV q8h → 300–450mg PO TID",
    totalDaily: "1200–2700mg IV / 900–1350mg PO",
    route: "IV→PO",
    note: "No renal adjustment needed. High oral bioavailability (~90%). Excellent SSTI and bone/joint coverage. Monitor for C. diff.",
    warning: null,
  }),

  "Fluconazole": (age, wt, crcl) => {
    let dose, warning = null, note;
    if (crcl === null || crcl >= 50) {
      dose = "400mg IV/PO loading, then 200–400mg q24h"; note = "High oral bioavailability (~90%) — switch to PO as soon as possible. NOT active against Aspergillus, Candida krusei.";
    } else {
      dose = "200mg IV/PO q24h (50% dose reduction)"; note = "CrCl <50 — halve maintenance dose."; warning = "50% dose reduction CrCl <50";
    }
    return { dose, totalDaily: "200–400mg/day maintenance", route: "IV/PO", note, warning };
  },

  "Ampicillin-sulbactam": (age, wt, crcl) => {
    let dose, warning = null, note;
    if (crcl === null || crcl >= 30) {
      dose = "3g IV q6h"; note = "Contains sulbactam with Acinetobacter activity. Check local resistance before use for HAP.";
    } else if (crcl >= 15) {
      dose = "3g IV q8h"; note = "Moderate impairment."; warning = "Extended interval";
    } else {
      dose = "3g IV q12h"; note = "Severe impairment."; warning = "⚠ Extended to q12h";
    }
    return { dose, totalDaily: "9–12g/day", route: "IV", note, warning };
  },

  "Amoxicillin": (age, wt, crcl) => ({
    dose: "1g PO TID or 875mg PO BID",
    totalDaily: "2.625–3g/day",
    route: "PO",
    note: "First-line for typical CAP (non-severe, no comorbidities). No renal adjustment typically needed for standard doses.",
    warning: null,
  }),

  "Amoxicillin-clavulanate": (age, wt, crcl) => ({
    dose: "875/125mg PO BID or 500/125mg PO TID",
    totalDaily: "1750/250mg–1500/375mg per day",
    route: "PO",
    note: "Extended-release (2000/125mg q12h) for higher-risk CAP outpatients. Avoid if CrCl <30 (use standard release q24h instead).",
    warning: crcl !== null && crcl < 30 ? "Use standard release q24h if CrCl <30" : null,
  }),

  "Doxycycline": (age, wt, crcl) => ({
    dose: "100mg PO/IV BID",
    totalDaily: "200mg/day",
    route: "PO",
    note: "No renal adjustment needed. High oral bioavailability (~93%) — prefer PO. Avoid in pregnancy/children <8 yrs. Take with food.",
    warning: null,
  }),

  "Cephalexin": (age, wt, crcl) => ({
    dose: "500mg PO QID",
    totalDaily: "2g/day",
    route: "PO",
    note: "First-line for non-purulent SSTI (streptococcal cellulitis). No MRSA activity — use TMP-SMX if MRSA suspected.",
    warning: null,
  }),

  "Cefdinir": (age, wt, crcl) => {
    let dose = "300mg PO BID or 600mg PO daily";
    const warning = crcl !== null && crcl < 30 ? "Reduce to 300mg PO daily if CrCl <30" : null;
    return { dose, totalDaily: "600mg/day", route: "PO", note: "Oral cephalosporin for mild CAP, SSTI. Good Streptococcus coverage.", warning };
  },
};

// ─── Extract all drug names from an infection's regimens ───────────────────
function extractDrugsFromInfection(infection, setting) {
  if (!infection) return [];
  const seen = new Set();
  const result = [];
  const regimens = infection.regimens[setting] || infection.regimens["inpatient"] || [];
  for (const reg of regimens) {
    for (const d of reg.drugs) {
      if (d.name && !d.connector) {
        // Normalize: strip parenthetical alternatives
        const name = d.name.split(" or ")[0].split("/")[0].trim();
        const key = name.toLowerCase();
        if (!seen.has(key) && DRUG_CALC[name]) {
          seen.add(key);
          result.push({ name, label: d.label || "", regimen: reg.title });
        }
      }
    }
  }
  return result;
}

function DoseCard({ drug, result }) {
  const routeColor = result.route === "IV" ? T.blue : result.route === "PO" ? T.green : T.purple;
  return (
    <div style={{ background: T.panel, border: `1px solid ${result.warning ? "rgba(245,166,35,.4)" : T.border}`, borderRadius: 11, overflow: "hidden", marginBottom: 10 }}>
      <div style={{ padding: "10px 14px", background: "rgba(22,45,79,.45)", borderBottom: `1px solid rgba(30,58,95,.5)`, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: T.bright, flex: 1 }}>{drug.name}</span>
        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: `${routeColor}20`, color: routeColor, border: `1px solid ${routeColor}40` }}>{result.route}</span>
      </div>
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
        {result.warning && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 7, background: "rgba(245,166,35,.08)", border: "1px solid rgba(245,166,35,.25)", fontSize: 11, color: T.amber, fontWeight: 600 }}>
            <span>⚠</span> {result.warning}
          </div>
        )}
        <div>
          <span style={{ fontSize: "9.5px", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".07em", color: T.dim }}>Calculated Dose</span>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: T.teal, marginTop: 2 }}>{result.dose}</div>
        </div>
        {result.totalDaily && (
          <div>
            <span style={{ fontSize: "9.5px", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".07em", color: T.dim }}>Total Daily</span>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.dim, marginTop: 2 }}>{result.totalDaily}</div>
          </div>
        )}
        {result.note && (
          <div style={{ fontSize: 11, color: T.text, lineHeight: 1.55, borderTop: `1px solid rgba(30,58,95,.4)`, paddingTop: 7, marginTop: 2 }}>
            {result.note}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DosageCalculator({ infection, setting, age, wt, crcl }) {
  const [open, setOpen] = useState(false);

  const hasParams = age && wt;
  const drugs = useMemo(() => extractDrugsFromInfection(infection, setting), [infection, setting]);
  const calculatedDrugs = useMemo(() => {
    if (!hasParams) return [];
    return drugs
      .map(d => ({ drug: d, result: DRUG_CALC[d.name]?.(parseFloat(age), parseFloat(wt), crcl, setting) }))
      .filter(x => x.result);
  }, [drugs, age, wt, crcl, setting, hasParams]);

  if (!infection) return null;

  return (
    <div style={{ background: "rgba(0,212,188,.04)", border: "1px solid rgba(0,212,188,.2)", borderRadius: 13, overflow: "hidden", marginBottom: 18 }}>
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(0,212,188,.15)", border: "1px solid rgba(0,212,188,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>⚖️</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.teal }}>Patient-Specific Dosage Calculator</div>
          <div style={{ fontSize: 11, color: T.dim, marginTop: 1 }}>
            {hasParams
              ? `${calculatedDrugs.length} drug${calculatedDrugs.length !== 1 ? "s" : ""} calculated for ${age}y / ${wt}kg${crcl !== null ? ` / CrCl ${crcl} mL/min` : ""}`
              : "Enter patient age and weight in the left panel to enable"}
          </div>
        </div>
        {hasParams && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {crcl !== null && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: crcl >= 60 ? "rgba(46,204,113,.12)" : crcl >= 30 ? "rgba(245,166,35,.12)" : "rgba(255,92,108,.12)", color: crcl >= 60 ? T.green : crcl >= 30 ? T.amber : T.red }}>
                CrCl {crcl}
              </span>
            )}
            <span style={{ fontSize: 12, color: T.teal, fontWeight: 700 }}>{open ? "▲" : "▼"}</span>
          </div>
        )}
        {!hasParams && (
          <span style={{ fontSize: 11, color: T.muted, fontFamily: "'JetBrains Mono', monospace" }}>needs params</span>
        )}
      </button>

      {/* Body */}
      {open && hasParams && (
        <div style={{ borderTop: "1px solid rgba(0,212,188,.15)", padding: "14px 16px" }}>
          {calculatedDrugs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "18px 0", color: T.muted, fontSize: 12 }}>
              No calculable drugs found for this infection/setting combination.
            </div>
          ) : (
            <>
              <div style={{ fontSize: "9.5px", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".09em", color: T.teal, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <span>Patient:</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: T.bright, fontWeight: 600 }}>
                  {age}y · {wt}kg{crcl !== null ? ` · CrCl ${crcl} mL/min` : " · CrCl unknown"}
                </span>
              </div>
              {calculatedDrugs.map(({ drug, result }) => (
                <DoseCard key={drug.name} drug={drug} result={result} />
              ))}
              <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.6, borderTop: `1px solid rgba(30,58,95,.4)`, paddingTop: 10, marginTop: 4 }}>
                ⚠ Doses are calculated from CG equation and standard guidelines. Always verify with clinical pharmacist, patient-specific factors (hepatic function, drug interactions, obesity), and institutional protocols. These recommendations are decision-support tools only.
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}