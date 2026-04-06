import { useState, useMemo } from "react";

const T = {
  bg: "#050f1e", panel: "#081628", card: "#0b1e36", up: "#0e2544",
  bd: "#1a3555", bhi: "#2a4f7a",
  teal: "#00e5c0", gold: "#f5c842", coral: "#ff6b6b", blue: "#3b9eff",
  orange: "#ff9f43", purple: "#9b6dff", green: "#3dffa0", red: "#ff4444",
  txt: "#f2f7ff", txt2: "#b8d4f0", txt3: "#82aece", txt4: "#5a82a8",
};

const DRUG_DB = [
  // ── Analgesics ─────────────────────────────────────────────────────
  {
    name: "Morphine", category: "Analgesic", route: "IV/IM",
    adult: "0.1 mg/kg IV q4h prn (max 15 mg/dose)",
    peds: "0.05–0.1 mg/kg IV q2–4h (max 0.1 mg/kg/dose)",
    weightBased: true, dosePerKg: 0.1, maxDose: 15, unit: "mg",
    renal: "Reduce dose 50% if GFR <30. Avoid if GFR <10.",
    hepatic: "Reduce dose; use with caution in severe hepatic impairment.",
    notes: "Monitor for respiratory depression. Have naloxone available.",
    tags: ["opioid", "pain"],
  },
  {
    name: "Fentanyl", category: "Analgesic", route: "IV/IN",
    adult: "1–2 mcg/kg IV (max 100 mcg); 1 mcg/kg IN",
    peds: "1–2 mcg/kg IV or IN (max 100 mcg)",
    weightBased: true, dosePerKg: 1.5, maxDose: 100, unit: "mcg",
    renal: "Use with caution; metabolites may accumulate.",
    hepatic: "Reduce dose in severe hepatic failure.",
    notes: "Rapid onset. Preferred in hemodynamically unstable patients.",
    tags: ["opioid", "pain", "procedural sedation"],
  },
  {
    name: "Ketorolac", category: "Analgesic", route: "IV/IM",
    adult: "15–30 mg IV/IM q6h (max 120 mg/day, limit 5 days)",
    peds: "0.5 mg/kg IV (max 15 mg)",
    weightBased: true, dosePerKg: 0.5, maxDose: 30, unit: "mg",
    renal: "Avoid if GFR <30. Risk of AKI.",
    hepatic: "Use with caution.",
    notes: "NSAID — avoid in GI bleed, renal impairment, elderly.",
    tags: ["NSAID", "pain"],
  },
  {
    name: "Acetaminophen", category: "Analgesic", route: "IV/PO",
    adult: "650–1000 mg PO/IV q6h (max 4 g/day; 2 g/day if hepatic risk)",
    peds: "15 mg/kg PO q4–6h (max 75 mg/kg/day or 4 g/day)",
    weightBased: true, dosePerKg: 15, maxDose: 1000, unit: "mg",
    renal: "No adjustment needed.",
    hepatic: "Max 2 g/day; avoid if severe.",
    notes: "Caution with chronic alcohol use or malnutrition.",
    tags: ["pain", "fever"],
  },

  // ── Antibiotics ────────────────────────────────────────────────────
  {
    name: "Vancomycin", category: "Antibiotic", route: "IV",
    adult: "25–30 mg/kg IV load; then 15–20 mg/kg q8–12h (AUC-guided)",
    peds: "15 mg/kg IV q6h (neonates: 15 mg/kg q12–24h)",
    weightBased: true, dosePerKg: 25, maxDose: 3000, unit: "mg",
    renal: "Extend interval: q12h if GFR 30–60; q24h if GFR <30. Monitor levels.",
    hepatic: "No adjustment needed.",
    notes: "AUC/MIC-guided dosing preferred. Infuse over ≥1h to prevent Red Man Syndrome.",
    tags: ["MRSA", "gram-positive", "serious infection"],
  },
  {
    name: "Ceftriaxone", category: "Antibiotic", route: "IV/IM",
    adult: "1–2 g IV/IM q12–24h",
    peds: "50–100 mg/kg/day IV divided q12–24h (max 4 g/day)",
    weightBased: true, dosePerKg: 50, maxDose: 2000, unit: "mg",
    renal: "No adjustment needed until GFR <10.",
    hepatic: "No adjustment in mild-moderate disease.",
    notes: "Avoid in neonates with hyperbilirubinemia. Biliary sludge with prolonged use.",
    tags: ["sepsis", "pneumonia", "meningitis"],
  },
  {
    name: "Piperacillin-Tazobactam", category: "Antibiotic", route: "IV",
    adult: "3.375 g IV q6h or 4.5 g IV q8h (sepsis: extended 4h infusion)",
    peds: "100 mg/kg (pip component) IV q8h (max 4 g pip/dose)",
    weightBased: false,
    renal: "Reduce dose if GFR <40.",
    hepatic: "No adjustment needed.",
    notes: "Broad-spectrum. Extended infusion improves PK/PD target attainment.",
    tags: ["broad-spectrum", "sepsis", "gram-negative"],
  },
  {
    name: "Metronidazole", category: "Antibiotic", route: "IV/PO",
    adult: "500 mg IV/PO q8h or 1 g IV q12h",
    peds: "7.5 mg/kg IV/PO q8h (max 500 mg/dose)",
    weightBased: true, dosePerKg: 7.5, maxDose: 500, unit: "mg",
    renal: "No adjustment needed.",
    hepatic: "Reduce dose 50% in severe hepatic failure.",
    notes: "Avoid alcohol. Disulfiram-like reaction. Active vs anaerobes & C. diff.",
    tags: ["anaerobe", "C. diff", "abdominal"],
  },

  // ── Sedation / RSI ─────────────────────────────────────────────────
  {
    name: "Ketamine", category: "Sedation / RSI", route: "IV/IM",
    adult: "RSI induction: 1.5–2 mg/kg IV; Procedural: 0.5–1 mg/kg IV; IM: 4–5 mg/kg",
    peds: "RSI: 1–2 mg/kg IV; Procedural: 1–2 mg/kg IV or 4 mg/kg IM",
    weightBased: true, dosePerKg: 1.5, maxDose: 200, unit: "mg",
    renal: "No adjustment needed.",
    hepatic: "Use with caution in severe disease.",
    notes: "Dissociative anesthetic. Preserves airway reflexes. Consider midazolam co-admin for emergence.",
    tags: ["RSI", "procedural sedation", "analgesia"],
  },
  {
    name: "Etomidate", category: "Sedation / RSI", route: "IV",
    adult: "0.3 mg/kg IV (max 20–30 mg)",
    peds: "0.3 mg/kg IV (age >10 yrs)",
    weightBased: true, dosePerKg: 0.3, maxDose: 30, unit: "mg",
    renal: "No adjustment needed.",
    hepatic: "No adjustment needed.",
    notes: "Hemodynamically neutral. Single dose adrenal suppression — caution in septic shock.",
    tags: ["RSI", "induction"],
  },
  {
    name: "Propofol", category: "Sedation / RSI", route: "IV",
    adult: "RSI: 1.5–2.5 mg/kg IV; Sedation: 5–50 mcg/kg/min infusion",
    peds: "Not recommended for prolonged sedation <3 yrs.",
    weightBased: true, dosePerKg: 1.5, maxDose: 200, unit: "mg",
    renal: "No adjustment needed.",
    hepatic: "No adjustment needed.",
    notes: "Propofol infusion syndrome with high doses >48h. Contains soybean oil/egg lecithin.",
    tags: ["sedation", "RSI", "intubation"],
  },
  {
    name: "Succinylcholine", category: "Sedation / RSI", route: "IV/IM",
    adult: "1.5 mg/kg IV (max 200 mg); IM: 3–4 mg/kg",
    peds: "2 mg/kg IV (<10 kg); 1 mg/kg IV (>10 kg)",
    weightBased: true, dosePerKg: 1.5, maxDose: 200, unit: "mg",
    renal: "No adjustment needed.",
    hepatic: "Prolonged effect if pseudocholinesterase deficiency.",
    notes: "Contraindicated: hyperkalemia, burns >48h, crush injury >72h, denervation, NMD.",
    tags: ["RSI", "paralytic", "neuromuscular blockade"],
  },
  {
    name: "Rocuronium", category: "Sedation / RSI", route: "IV",
    adult: "RSI: 1.2 mg/kg IV; Maintenance: 0.1–0.2 mg/kg q30min",
    peds: "RSI: 1.2 mg/kg IV",
    weightBased: true, dosePerKg: 1.2, maxDose: 120, unit: "mg",
    renal: "Prolonged effect if severe renal impairment.",
    hepatic: "Prolonged effect in hepatic failure.",
    notes: "Reversal with sugammadex 16 mg/kg. Preferred when succinylcholine contraindicated.",
    tags: ["RSI", "paralytic", "neuromuscular blockade"],
  },

  // ── Cardiac ────────────────────────────────────────────────────────
  {
    name: "Amiodarone", category: "Cardiac", route: "IV",
    adult: "VF/VT arrest: 300 mg IV push; Stable VT: 150 mg IV over 10 min then 1 mg/min x6h",
    peds: "5 mg/kg IV over 20–60 min (max 300 mg); Arrest: 5 mg/kg rapid IV",
    weightBased: true, dosePerKg: 5, maxDose: 300, unit: "mg",
    renal: "No adjustment needed.",
    hepatic: "Use with caution; may worsen hepatotoxicity.",
    notes: "Multiple drug interactions. Prolongs QT. Thyroid/pulmonary toxicity with chronic use.",
    tags: ["arrhythmia", "VF", "VT", "ACLS"],
  },
  {
    name: "Adenosine", category: "Cardiac", route: "IV",
    adult: "6 mg rapid IV; repeat 12 mg x2 if needed",
    peds: "0.1 mg/kg rapid IV (max 6 mg 1st dose; max 12 mg subsequent)",
    weightBased: true, dosePerKg: 0.1, maxDose: 6, unit: "mg",
    renal: "No adjustment needed.",
    hepatic: "No adjustment needed.",
    notes: "Use proximal large vein with rapid saline flush. Caution in asthma/COPD.",
    tags: ["SVT", "arrhythmia", "AVNRT"],
  },
  {
    name: "Norepinephrine", category: "Cardiac", route: "IV infusion",
    adult: "0.1–0.5 mcg/kg/min IV infusion (titrate to MAP ≥65)",
    peds: "0.1–2 mcg/kg/min IV infusion",
    weightBased: false,
    renal: "No adjustment needed.",
    hepatic: "No adjustment needed.",
    notes: "First-line vasopressor in septic shock. Central line preferred.",
    tags: ["vasopressor", "septic shock", "hypotension"],
  },
  {
    name: "Epinephrine (cardiac arrest)", category: "Cardiac", route: "IV",
    adult: "1 mg IV/IO q3–5 min during CPR",
    peds: "0.01 mg/kg IV/IO (max 1 mg) q3–5 min",
    weightBased: true, dosePerKg: 0.01, maxDose: 1, unit: "mg",
    renal: "No adjustment.",
    hepatic: "No adjustment.",
    notes: "ACLS standard. IM anaphylaxis dose: 0.3–0.5 mg (1:1000) IM lateral thigh.",
    tags: ["ACLS", "cardiac arrest", "anaphylaxis"],
  },

  // ── Neuro / Seizure ────────────────────────────────────────────────
  {
    name: "Lorazepam", category: "Neuro / Seizure", route: "IV/IM",
    adult: "Seizure: 0.1 mg/kg IV (max 4 mg/dose); Sedation: 0.02–0.04 mg/kg IV",
    peds: "Seizure: 0.1 mg/kg IV/IM (max 4 mg)",
    weightBased: true, dosePerKg: 0.1, maxDose: 4, unit: "mg",
    renal: "No adjustment needed.",
    hepatic: "Use with caution in severe hepatic impairment.",
    notes: "First-line benzodiazepine for status epilepticus.",
    tags: ["seizure", "status epilepticus", "sedation"],
  },
  {
    name: "Levetiracetam", category: "Neuro / Seizure", route: "IV",
    adult: "1000–3000 mg IV over 15 min",
    peds: "20–60 mg/kg IV over 15 min (max 3000 mg)",
    weightBased: true, dosePerKg: 30, maxDose: 3000, unit: "mg",
    renal: "Reduce dose if GFR <60. Significant renal excretion.",
    hepatic: "No adjustment needed.",
    notes: "Second-line for status epilepticus. Minimal drug interactions.",
    tags: ["seizure", "status epilepticus", "second-line AED"],
  },
  {
    name: "tPA (Alteplase) — Stroke", category: "Neuro / Seizure", route: "IV",
    adult: "0.9 mg/kg IV (max 90 mg); 10% bolus over 1 min, remainder over 60 min",
    peds: "Not routinely used in peds stroke.",
    weightBased: true, dosePerKg: 0.9, maxDose: 90, unit: "mg",
    renal: "Use with caution.",
    hepatic: "Use with caution.",
    notes: "Must verify inclusion/exclusion criteria. BP <185/110 before administering.",
    tags: ["stroke", "thrombolysis", "tPA"],
  },
];

const CATEGORIES = ["All", ...Array.from(new Set(DRUG_DB.map(d => d.category)))];

function calcDose(drug, weight) {
  if (!drug.weightBased || !weight) return null;
  const raw = drug.dosePerKg * weight;
  const clamped = drug.maxDose ? Math.min(raw, drug.maxDose) : raw;
  return clamped.toFixed(1);
}

function CategoryBadge({ cat }) {
  const colorMap = {
    "Analgesic": T.teal, "Antibiotic": T.green, "Sedation / RSI": T.purple,
    "Cardiac": T.coral, "Neuro / Seizure": T.gold,
  };
  const c = colorMap[cat] || T.blue;
  return (
    <span style={{
      fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700,
      padding: "2px 8px", borderRadius: 20, letterSpacing: 1,
      background: `${c}18`, border: `1px solid ${c}40`, color: c,
    }}>{cat.toUpperCase()}</span>
  );
}

function DrugCard({ drug, weight }) {
  const [expanded, setExpanded] = useState(false);
  const calcResult = calcDose(drug, weight);

  return (
    <div style={{
      background: "rgba(8,22,40,0.82)", border: `1px solid ${T.bd}`,
      borderRadius: 14, overflow: "hidden", transition: "border-color 0.15s",
      ...(expanded ? { borderColor: T.bhi } : {}),
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          padding: "12px 14px", cursor: "pointer",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: T.txt }}>
              {drug.name}
            </span>
            <CategoryBadge cat={drug.category} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: T.txt4,
              background: `${T.up}`, border: `1px solid ${T.bd}`, borderRadius: 4, padding: "1px 6px",
            }}>{drug.route}</span>
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: T.txt3, lineHeight: 1.5 }}>
            <strong style={{ color: T.txt2 }}>Adult:</strong> {drug.adult}
          </div>
        </div>

        {/* Calculated dose badge */}
        {calcResult && (
          <div style={{
            flexShrink: 0, textAlign: "center",
            background: `${T.teal}10`, border: `1px solid ${T.teal}35`,
            borderRadius: 10, padding: "6px 12px",
          }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: T.teal, lineHeight: 1 }}>
              {calcResult}
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: T.txt4, marginTop: 2 }}>
              {drug.unit} ({weight} kg)
            </div>
          </div>
        )}
        <span style={{ color: T.txt4, fontSize: 12, flexShrink: 0, marginTop: 2 }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${T.bd}`, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
          <Row label="Pediatric" value={drug.peds} color={T.blue} />
          <Row label="Renal Adjustment" value={drug.renal} color={T.gold} />
          <Row label="Hepatic Adjustment" value={drug.hepatic} color={T.orange} />
          <Row label="Clinical Pearls" value={drug.notes} color={T.teal} />
          {drug.tags?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 2 }}>
              {drug.tags.map(tag => (
                <span key={tag} style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 10,
                  padding: "2px 8px", borderRadius: 20,
                  background: `${T.up}`, border: `1px solid ${T.bd}`, color: T.txt4,
                }}>#{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700,
        color, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 3,
      }}>{label}</div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: T.txt2, lineHeight: 1.55 }}>{value}</div>
    </div>
  );
}

export default function SmartDosingHub() {
  const [weight, setWeight] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return DRUG_DB.filter(d => {
      const matchCat = category === "All" || d.category === category;
      const matchQ = !q || d.name.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.tags?.some(t => t.toLowerCase().includes(q)) ||
        d.adult.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [search, category]);

  const weightNum = parseFloat(weight) || null;

  return (
    <div style={{
      minHeight: "100vh", background: T.bg, color: T.txt,
      fontFamily: "'DM Sans', sans-serif", padding: "0 0 48px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${T.bhi}; border-radius: 2px; }
        input::placeholder { color: ${T.txt4}; }
      `}</style>

      {/* Hero header */}
      <div style={{
        background: "rgba(8,22,40,0.9)", borderBottom: `1px solid ${T.bd}`,
        padding: "20px 24px 16px", position: "sticky", top: 0, zIndex: 50,
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: 3,
              color: T.teal, background: `${T.teal}10`, border: `1px solid ${T.teal}35`,
              borderRadius: 20, padding: "2px 10px",
            }}>NOTRYA / SMART DOSING</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(22px,3vw,32px)", fontWeight: 700, margin: 0, color: T.txt }}>
                Smart Dosing Hub
              </h1>
              <p style={{ fontSize: 12, color: T.txt3, margin: "4px 0 0" }}>
                Weight-based dosing · Renal & hepatic adjustments · {DRUG_DB.length} ED medications
              </p>
            </div>

            {/* Weight input */}
            <div style={{
              background: `${T.teal}0d`, border: `1px solid ${T.teal}40`,
              borderRadius: 12, padding: "8px 14px",
              display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
            }}>
              <span style={{ fontSize: 18 }}>⚖️</span>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: T.teal, letterSpacing: 2, marginBottom: 3 }}>
                  PATIENT WEIGHT
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="number"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    placeholder="70"
                    style={{
                      width: 70, background: "transparent", border: "none", outline: "none",
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700,
                      color: T.teal, padding: 0,
                    }}
                  />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: T.txt3 }}>kg</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search + filters */}
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search drugs, indications, tags..."
              style={{
                flex: 1, minWidth: 200,
                background: `${T.up}`, border: `1px solid ${T.bd}`,
                borderRadius: 10, padding: "8px 14px",
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.txt,
                outline: "none",
              }}
            />
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {CATEGORIES.map(cat => {
                const active = category === cat;
                return (
                  <button key={cat} onClick={() => setCategory(cat)} style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
                    padding: "5px 12px", borderRadius: 20, cursor: "pointer",
                    textTransform: "uppercase", letterSpacing: 1, transition: "all 0.12s",
                    border: `1px solid ${active ? T.teal + "77" : T.bd}`,
                    background: active ? `${T.teal}14` : "transparent",
                    color: active ? T.teal : T.txt3,
                  }}>{cat}</button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Drug grid */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 24px 0" }}>
        {filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 0",
            fontFamily: "'DM Sans', sans-serif", color: T.txt3,
          }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>💊</div>
            <div style={{ fontSize: 14 }}>No drugs found for "{search}"</div>
          </div>
        ) : (
          <>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
              color: T.txt4, letterSpacing: 2, marginBottom: 12,
            }}>
              {filtered.length} RESULT{filtered.length !== 1 ? "S" : ""}
              {weightNum ? ` · DOSES CALCULATED FOR ${weightNum} KG` : " · ENTER WEIGHT FOR CALCULATED DOSES"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map(drug => (
                <DrugCard key={drug.name} drug={drug} weight={weightNum} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Disclaimer */}
      <div style={{ maxWidth: 1100, margin: "24px auto 0", padding: "0 24px" }}>
        <div style={{
          background: `${T.gold}08`, border: `1px solid ${T.gold}25`,
          borderRadius: 10, padding: "10px 14px",
          fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: T.txt4, lineHeight: 1.6,
        }}>
          ⚠️ <strong style={{ color: T.gold }}>Clinical Decision Support Only.</strong>{" "}
          All dosing recommendations should be verified independently. Adjust for patient-specific factors including renal/hepatic function, weight, allergies, and concurrent medications. Notrya is not a substitute for clinical judgment.
        </div>
      </div>
    </div>
  );
}