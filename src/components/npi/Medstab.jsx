import { useState, useCallback } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const PMH_GROUPS = [
  {
    key: "cardio", label: "Cardiovascular", icon: "❤️",
    conditions: ["Hypertension","CAD / Ischemic Heart Disease","Heart Failure (HFrEF)","Heart Failure (HFpEF)","Atrial Fibrillation","Valvular Heart Disease","Pacemaker / ICD","Prior MI","PVD / PAD","DVT / PE","Hyperlipidemia"],
  },
  {
    key: "endo", label: "Endocrine / Metabolic", icon: "⚗️",
    conditions: ["Type 1 Diabetes","Type 2 Diabetes","Hypothyroidism","Hyperthyroidism","Obesity (BMI >30)","Metabolic Syndrome","Adrenal Insufficiency","Cushing's Syndrome"],
  },
  {
    key: "pulm", label: "Pulmonary", icon: "🫁",
    conditions: ["Asthma","COPD","OSA (on CPAP/BiPAP)","Interstitial Lung Disease","Pulmonary Hypertension","Prior TB","Bronchiectasis","Lung Cancer"],
  },
  {
    key: "gi", label: "GI / Hepatic", icon: "🫃",
    conditions: ["GERD / PUD","IBD (Crohn's / UC)","IBS","Cirrhosis","Hepatitis B","Hepatitis C","Pancreatitis","Colorectal Cancer","Diverticulosis"],
  },
  {
    key: "renal", label: "Renal", icon: "🫘",
    conditions: ["CKD (Stage 1–2)","CKD (Stage 3–4)","CKD (Stage 5 / ESRD)","Dialysis (HD / PD)","Nephrolithiasis","PKD","Renal Transplant"],
  },
  {
    key: "neuro", label: "Neurological", icon: "🧠",
    conditions: ["Epilepsy / Seizure Disorder","Stroke / TIA","Parkinson's Disease","Multiple Sclerosis","Dementia / Alzheimer's","Migraines","Neuropathy","Spinal Cord Injury"],
  },
  {
    key: "psych", label: "Psychiatric", icon: "🧘",
    conditions: ["Depression","Anxiety / GAD","Bipolar Disorder","Schizophrenia","PTSD","ADHD","OCD","Substance Use Disorder","Alcohol Use Disorder"],
  },
  {
    key: "onc", label: "Oncologic", icon: "🎗️",
    conditions: ["Active Malignancy","Prior Malignancy (in remission)","On Chemotherapy","Radiation History","Bone Marrow Transplant","Immunosuppressed"],
  },
  {
    key: "msk", label: "MSK / Rheum", icon: "🦴",
    conditions: ["Osteoarthritis","Rheumatoid Arthritis","Gout","SLE / Lupus","Osteoporosis","Fibromyalgia","Chronic Back Pain"],
  },
  {
    key: "heme", label: "Hematologic", icon: "🩸",
    conditions: ["Anemia (chronic)","Sickle Cell Disease","Bleeding Disorder","Clotting Disorder (hypercoagulable)","On Anticoagulation","On Antiplatelet Therapy","G6PD Deficiency"],
  },
];

const ALLERGY_REACTIONS = ["Anaphylaxis", "Urticaria / Hives", "Rash / Erythema", "Angioedema", "Bronchospasm", "GI Upset / Nausea", "Unknown / Unspecified"];

const COMMON_MEDS_SUGGESTIONS = [
  "Aspirin 81mg","Atorvastatin 40mg","Lisinopril 10mg","Metoprolol succinate 50mg","Metformin 1000mg",
  "Amlodipine 5mg","Omeprazole 20mg","Levothyroxine 50mcg","Albuterol MDI","Furosemide 40mg",
  "Warfarin","Apixaban 5mg","Rivaroxaban 20mg","Sertraline 50mg","Gabapentin 300mg",
  "Hydrochlorothiazide 25mg","Losartan 50mg","Carvedilol 12.5mg","Prednisone","Insulin (basal)",
];

const COMMON_ALLERGY_SUGGESTIONS = [
  "Penicillin","Sulfa / Sulfonamides","NSAIDs / Aspirin","Cephalosporins","Fluoroquinolones",
  "Codeine","Morphine","Contrast Dye","Latex","Vancomycin",
];

const SMOKING_OPTS = ["Never","Former smoker","Current smoker < 1 ppd","Current smoker ≥ 1 ppd"];
const ALCOHOL_OPTS = ["None / Rare","Social (< 7 drinks/wk)","Moderate (7–14 drinks/wk)","Heavy (> 14 drinks/wk)","Alcohol Use Disorder"];
const DRUG_OPTS   = ["None","Marijuana (occasional)","Marijuana (daily)","Cocaine / Stimulants","Opioid misuse","IV drug use","On MAT (buprenorphine/methadone)"];

const CSS = `
.mst-root{--bg:#050f1e;--panel:#081628;--card:#0b1e36;--up:#0e2544;--bd:#1a3555;--bhi:#2a4f7a;
  --teal:#00e5c0;--gold:#f5c842;--coral:#ff6b6b;--blue:#3b9eff;--orange:#ff9f43;--green:#3dffa0;
  --t:#f2f7ff;--t2:#b8d4f0;--t3:#82aece;--t4:#5a82a8;
  font-family:'DM Sans',sans-serif;display:flex;flex-direction:column;gap:20px;}
.mst-root *{box-sizing:border-box;}
.mst-root ::-webkit-scrollbar{width:3px;}
.mst-root ::-webkit-scrollbar-thumb{background:var(--bhi);border-radius:2px;}

.mst-section{background:rgba(8,22,40,.82);border:1px solid var(--bd);border-radius:12px;overflow:hidden;}
.mst-sec-hdr{display:flex;align-items:center;gap:10px;padding:11px 16px;background:rgba(11,30,54,.6);
  border-bottom:1px solid rgba(26,53,85,.4);cursor:pointer;user-select:none;}
.mst-sec-hdr:hover{background:rgba(14,37,68,.7);}
.mst-sec-icon{font-size:15px;flex-shrink:0;}
.mst-sec-title{font-size:13px;font-weight:600;color:var(--t);flex:1;}
.mst-sec-badge{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;
  padding:2px 8px;border-radius:20px;white-space:nowrap;}
.mst-sec-badge.has{background:rgba(0,229,192,.1);color:var(--teal);border:1px solid rgba(0,229,192,.3);}
.mst-sec-badge.empty{background:rgba(90,130,168,.1);color:var(--t4);border:1px solid rgba(90,130,168,.2);}
.mst-sec-chev{font-size:11px;color:var(--t4);transition:transform .2s;flex-shrink:0;}
.mst-sec-chev.open{transform:rotate(90deg);}
.mst-sec-body{padding:14px 16px;display:flex;flex-direction:column;gap:10px;}

/* Tags */
.mst-tag{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;
  font-size:11px;font-weight:600;font-family:'DM Sans',sans-serif;white-space:nowrap;}
.mst-tag-teal{background:rgba(0,229,192,.12);border:1px solid rgba(0,229,192,.35);color:var(--teal);}
.mst-tag-coral{background:rgba(255,107,107,.12);border:1px solid rgba(255,107,107,.35);color:var(--coral);}
.mst-tag-blue{background:rgba(59,158,255,.12);border:1px solid rgba(59,158,255,.35);color:var(--blue);}
.mst-tag-gold{background:rgba(245,200,66,.12);border:1px solid rgba(245,200,66,.35);color:var(--gold);}
.mst-tag-x{background:none;border:none;cursor:pointer;font-size:11px;color:inherit;opacity:.7;padding:0 0 0 2px;line-height:1;}
.mst-tag-x:hover{opacity:1;}

/* PMH grid */
.mst-pmh-grp{margin-bottom:8px;}
.mst-pmh-grp-hdr{display:flex;align-items:center;gap:6px;margin-bottom:6px;cursor:pointer;}
.mst-pmh-grp-label{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:1.5px;
  text-transform:uppercase;color:var(--t4);}
.mst-pmh-grid{display:flex;flex-wrap:wrap;gap:5px;}
.mst-pmh-chip{font-size:11px;padding:4px 10px;border-radius:20px;cursor:pointer;
  border:1px solid rgba(42,77,114,.4);background:transparent;color:var(--t3);transition:all .12s;}
.mst-pmh-chip.sel{background:rgba(59,158,255,.12);border-color:rgba(59,158,255,.45);color:var(--blue);}

/* Input row */
.mst-input-row{display:flex;gap:8px;}
.mst-inp{flex:1;background:rgba(14,37,68,.8);border:1px solid var(--bd);border-radius:8px;
  padding:8px 12px;color:var(--t);font-family:'DM Sans',sans-serif;font-size:13px;outline:none;
  transition:border-color .15s;}
.mst-inp:focus{border-color:var(--bhi);}
.mst-inp::placeholder{color:var(--t4);font-style:italic;}
.mst-add-btn{padding:8px 14px;border-radius:8px;background:rgba(0,229,192,.1);
  border:1px solid rgba(0,229,192,.35);color:var(--teal);font-weight:700;font-size:12px;
  cursor:pointer;white-space:nowrap;font-family:'DM Sans',sans-serif;}
.mst-add-btn:hover{background:rgba(0,229,192,.18);}
.mst-add-btn:disabled{opacity:.35;cursor:not-allowed;}

/* Suggestion pills */
.mst-suggestions{display:flex;flex-wrap:wrap;gap:4px;margin-top:2px;}
.mst-sug{font-size:10px;padding:3px 8px;border-radius:12px;cursor:pointer;
  background:rgba(14,37,68,.6);border:1px solid rgba(42,77,114,.35);color:var(--t4);transition:all .1s;}
.mst-sug:hover{background:rgba(59,158,255,.1);border-color:rgba(59,158,255,.3);color:var(--t2);}

/* Select */
.mst-select{background:rgba(14,37,68,.8);border:1px solid var(--bd);border-radius:8px;
  padding:8px 12px;color:var(--t);font-family:'DM Sans',sans-serif;font-size:13px;outline:none;
  cursor:pointer;width:100%;}

/* Textarea */
.mst-ta{width:100%;background:rgba(14,37,68,.6);border:1px solid var(--bd);border-radius:8px;
  padding:9px 12px;color:var(--t);font-family:'DM Sans',sans-serif;font-size:13px;
  line-height:1.6;resize:vertical;outline:none;min-height:68px;}
.mst-ta:focus{border-color:var(--bhi);}
.mst-ta::placeholder{color:var(--t4);font-style:italic;}

/* Context summary */
.mst-summary{background:rgba(0,229,192,.04);border:1px solid rgba(0,229,192,.2);
  border-radius:10px;padding:12px 14px;}
.mst-summary-lbl{font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:2px;
  text-transform:uppercase;color:var(--teal);margin-bottom:8px;}
.mst-summary-row{display:flex;gap:8px;align-items:baseline;margin-bottom:4px;font-size:12px;}
.mst-summary-key{color:var(--t4);font-family:'JetBrains Mono',monospace;font-size:10px;
  min-width:90px;flex-shrink:0;}
.mst-summary-val{color:var(--t2);line-height:1.5;}

/* Context signal bar */
.mst-signal-bar{display:flex;align-items:center;gap:8px;padding:8px 12px;
  background:rgba(14,37,68,.5);border:1px solid var(--bd);border-radius:8px;}
.mst-signal-fill{height:5px;border-radius:3px;transition:width .5s;}
.mst-signal-bg{flex:1;height:5px;background:rgba(26,53,85,.6);border-radius:3px;overflow:hidden;}
.mst-signal-label{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--t4);white-space:nowrap;}
.mst-signal-count{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;white-space:nowrap;}

/* Allergy reaction select */
.mst-allergy-row{display:flex;gap:6px;align-items:center;padding:6px 10px;
  background:rgba(255,107,107,.07);border:1px solid rgba(255,107,107,.2);border-radius:8px;}
.mst-allergy-name{flex:1;font-size:12px;font-weight:600;color:var(--coral);}
.mst-allergy-rx{background:rgba(14,37,68,.8);border:1px solid rgba(255,107,107,.25);border-radius:6px;
  padding:4px 8px;color:var(--t3);font-family:'DM Sans',sans-serif;font-size:11px;outline:none;cursor:pointer;}
.mst-allergy-del{background:none;border:none;color:rgba(255,107,107,.6);cursor:pointer;font-size:13px;flex-shrink:0;}
.mst-allergy-del:hover{color:var(--coral);}

/* Context score indicator */
.mst-cx-score{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;
  padding:3px 10px;border-radius:6px;white-space:nowrap;}
.mst-cx-score.low{background:rgba(255,107,107,.1);color:var(--coral);border:1px solid rgba(255,107,107,.3);}
.mst-cx-score.mid{background:rgba(245,200,66,.1);color:var(--gold);border:1px solid rgba(245,200,66,.3);}
.mst-cx-score.good{background:rgba(0,229,192,.1);color:var(--teal);border:1px solid rgba(0,229,192,.3);}
`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function useListInput(list, setList) {
  const [input, setInput] = useState("");
  const add = useCallback((val) => {
    const v = (val || input).trim();
    if (!v || list.includes(v)) return;
    setList(p => [...p, v]);
    setInput("");
  }, [input, list, setList]);
  const remove = useCallback((v) => setList(p => p.filter(x => x !== v)), [setList]);
  return { input, setInput, add, remove };
}

function TagList({ items, cls = "mst-tag-teal", onRemove }) {
  if (!items.length) return null;
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
      {items.map(item => (
        <span key={item} className={`mst-tag ${cls}`}>
          {item}
          {onRemove && <button className="mst-tag-x" onClick={() => onRemove(item)}>✕</button>}
        </span>
      ))}
    </div>
  );
}

function Section({ icon, title, badge, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mst-section">
      <div className="mst-sec-hdr" onClick={() => setOpen(o => !o)}>
        <span className="mst-sec-icon">{icon}</span>
        <span className="mst-sec-title">{title}</span>
        <span className={`mst-sec-badge ${badge > 0 ? "has" : "empty"}`}>
          {badge > 0 ? `${badge} entered` : "empty"}
        </span>
        <span className={`mst-sec-chev${open ? " open" : ""}`}>›</span>
      </div>
      {open && <div className="mst-sec-body">{children}</div>}
    </div>
  );
}

// ─── CONTEXT COMPLETENESS SCORE ───────────────────────────────────────────────
function contextScore(medications, allergies, pmhSelected, surgHx, famHx, socHx, smoking, alcohol) {
  let score = 0;
  if (medications.length)  score += 25;
  if (allergies.length)    score += 20;
  const pmhCount = Object.values(pmhSelected).filter(Boolean).length;
  if (pmhCount > 0)        score += 20;
  if (pmhCount >= 3)       score += 5;
  if (surgHx.trim())       score += 10;
  if (famHx.trim())        score += 5;
  if (socHx.trim())        score += 5;
  if (smoking !== "")      score += 5;
  if (alcohol !== "")      score += 5;
  return Math.min(100, score);
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Medstab({
  medications = [], setMedications = () => {},
  allergies = [], setAllergies = () => {},
  allergyReactions = {}, setAllergyReactions = () => {},
  pmhSelected = {}, setPmhSelected = () => {},
  pmhExtra = "", setPmhExtra = () => {},
  surgHx = "", setSurgHx = () => {},
  famHx = "", setFamHx = () => {},
  socHx = "", setSocHx = () => {},
  smoking = "", setSmoking = () => {},
  alcohol = "", setAlcohol = () => {},
  drugUse = "", setDrugUse = () => {},
  occupation = "", setOccupation = () => {},
  codeStatus = "", setCodeStatus = () => {},
  onAdvance = () => {},
}) {
  const meds = useListInput(medications, setMedications);
  const [allergyInput, setAllergyInput] = useState("");
  const [openGroups, setOpenGroups] = useState({ cardio: true, endo: true });

  const addAllergy = (val) => {
    const v = (val || allergyInput).trim();
    if (!v || allergies.includes(v)) return;
    setAllergies(p => [...p, v]);
    setAllergyInput("");
  };
  const removeAllergy = (v) => {
    setAllergies(p => p.filter(x => x !== v));
    setAllergyReactions(p => { const n = { ...p }; delete n[v]; return n; });
  };
  const setRxn = (allergy, rxn) => setAllergyReactions(p => ({ ...p, [allergy]: rxn }));

  const togglePMH = (condition) => {
    setPmhSelected(p => ({ ...p, [condition]: !p[condition] }));
  };
  const toggleGroup = (key) => setOpenGroups(p => ({ ...p, [key]: !p[key] }));

  const pmhCount = Object.values(pmhSelected).filter(Boolean).length;
  const score = contextScore(medications, allergies, pmhSelected, surgHx, famHx, socHx, smoking, alcohol);
  const scoreCls = score >= 70 ? "good" : score >= 35 ? "mid" : "low";
  const scoreLabel = score >= 70 ? "Strong context" : score >= 35 ? "Partial context" : "Minimal context";

  return (
    <div className="mst-root">
      <style>{CSS}</style>

      {/* ── Context signal bar ── */}
      <div className="mst-signal-bar">
        <span className="mst-signal-label">CLINICAL CONTEXT</span>
        <div className="mst-signal-bg">
          <div className="mst-signal-fill" style={{
            width: `${score}%`,
            background: score >= 70 ? "var(--teal)" : score >= 35 ? "var(--gold)" : "var(--coral)",
          }} />
        </div>
        <span className={`mst-cx-score ${scoreCls}`}>{score}% — {scoreLabel}</span>
      </div>

      <div style={{ fontSize:11, color:"var(--t4)", fontFamily:"'DM Sans',sans-serif", lineHeight:1.6, padding:"0 2px" }}>
        This tab captures the patient's background clinical context. Complete entries here power downstream
        clinical decision support, DDx generation, drug safety checks, MDM complexity scoring, and order recommendations.
      </div>

      {/* ── 1. Active Medications ── */}
      <Section icon="💊" title="Active Medications" badge={medications.length} defaultOpen>
        <div style={{ fontSize:11, color:"var(--t4)", fontFamily:"'JetBrains Mono',monospace", letterSpacing:.5, marginBottom:2 }}>
          Include dose and frequency where known (e.g. "Metformin 1000mg PO BID")
        </div>
        <div className="mst-input-row">
          <input
            className="mst-inp"
            value={meds.input}
            onChange={e => meds.setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); meds.add(); } }}
            placeholder="Medication name, dose, frequency…"
          />
          <button className="mst-add-btn" onClick={() => meds.add()} disabled={!meds.input.trim()}>+ Add</button>
        </div>
        {/* Suggestions */}
        <div className="mst-suggestions">
          {COMMON_MEDS_SUGGESTIONS.filter(s => !medications.includes(s)).slice(0, 12).map(s => (
            <button key={s} className="mst-sug" onClick={() => meds.add(s)}>{s}</button>
          ))}
        </div>
        <TagList items={medications} cls="mst-tag-blue" onRemove={meds.remove} />
        {medications.length === 0 && (
          <div style={{ fontSize:12, color:"var(--t4)", fontStyle:"italic" }}>
            No medications entered — or select "NKDA" equivalent below.
          </div>
        )}
        <button
          onClick={() => { if (!medications.includes("No active medications / NKMA")) meds.add("No active medications / NKMA"); }}
          style={{ alignSelf:"flex-start", padding:"5px 12px", borderRadius:7, background:"transparent",
            border:"1px solid rgba(0,229,192,.25)", color:"var(--teal)", fontSize:11, fontWeight:600,
            cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
          ✓ No active medications
        </button>
      </Section>

      {/* ── 2. Allergies & Reactions ── */}
      <Section icon="⚠️" title="Allergies & Reactions" badge={allergies.length} defaultOpen>
        <div style={{ fontSize:11, color:"var(--t4)", fontFamily:"'JetBrains Mono',monospace", letterSpacing:.5, marginBottom:2 }}>
          Document allergen and reaction type — used for drug safety checks and MDM
        </div>
        <div className="mst-input-row">
          <input
            className="mst-inp"
            value={allergyInput}
            onChange={e => setAllergyInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addAllergy(); } }}
            placeholder="Allergen (e.g. Penicillin, Shellfish, Latex)…"
          />
          <button className="mst-add-btn" onClick={() => addAllergy()} disabled={!allergyInput.trim()}>+ Add</button>
        </div>
        <div className="mst-suggestions">
          {COMMON_ALLERGY_SUGGESTIONS.filter(s => !allergies.includes(s)).map(s => (
            <button key={s} className="mst-sug" onClick={() => addAllergy(s)}>{s}</button>
          ))}
        </div>
        {allergies.map(a => (
          <div key={a} className="mst-allergy-row">
            <span className="mst-allergy-name">⚠ {a}</span>
            <select className="mst-allergy-rx"
              value={allergyReactions[a] || ""}
              onChange={e => setRxn(a, e.target.value)}>
              <option value="">Reaction type…</option>
              {ALLERGY_REACTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button className="mst-allergy-del" onClick={() => removeAllergy(a)}>✕</button>
          </div>
        ))}
        {allergies.length === 0 && (
          <button
            onClick={() => addAllergy("NKDA")}
            style={{ alignSelf:"flex-start", padding:"5px 12px", borderRadius:7, background:"transparent",
              border:"1px solid rgba(0,229,192,.25)", color:"var(--teal)", fontSize:11, fontWeight:600,
              cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
            ✓ NKDA — No known drug allergies
          </button>
        )}
      </Section>

      {/* ── 3. Past Medical History ── */}
      <Section icon="📋" title="Past Medical History" badge={pmhCount}>
        <div style={{ fontSize:11, color:"var(--t4)", fontFamily:"'JetBrains Mono',monospace", letterSpacing:.5, marginBottom:4 }}>
          Select all active/known conditions — drives MDM complexity and CDS rules
        </div>
        {PMH_GROUPS.map(grp => (
          <div key={grp.key} className="mst-pmh-grp">
            <div className="mst-pmh-grp-hdr" onClick={() => toggleGroup(grp.key)}>
              <span style={{ fontSize:13 }}>{grp.icon}</span>
              <span className="mst-pmh-grp-label">{grp.label}</span>
              <span style={{ fontSize:9, color:"var(--t4)", fontFamily:"'JetBrains Mono',monospace", marginLeft:"auto" }}>
                {openGroups[grp.key] ? "▲" : "▼"}
              </span>
            </div>
            {openGroups[grp.key] && (
              <div className="mst-pmh-grid">
                {grp.conditions.map(c => (
                  <button key={c} className={`mst-pmh-chip${pmhSelected[c] ? " sel" : ""}`}
                    onClick={() => togglePMH(c)}>
                    {pmhSelected[c] ? "✓ " : ""}{c}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--t4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:5 }}>
            Additional PMH (free text)
          </div>
          <textarea className="mst-ta" value={pmhExtra} onChange={e => setPmhExtra(e.target.value)}
            placeholder="Any additional conditions not listed above…" rows={2} />
        </div>
        {pmhCount > 0 && (
          <TagList items={Object.keys(pmhSelected).filter(k => pmhSelected[k])} cls="mst-tag-blue" onRemove={k => togglePMH(k)} />
        )}
      </Section>

      {/* ── 4. Surgical History ── */}
      <Section icon="🔪" title="Surgical History" badge={surgHx.trim() ? 1 : 0}>
        <textarea className="mst-ta" value={surgHx} onChange={e => setSurgHx(e.target.value)}
          placeholder="e.g. Appendectomy 2018, CABG × 3 vessels 2021, L knee arthroplasty 2023…"
          rows={3} />
      </Section>

      {/* ── 5. Family History ── */}
      <Section icon="👪" title="Family History" badge={famHx.trim() ? 1 : 0}>
        <div style={{ fontSize:11, color:"var(--t4)", fontStyle:"italic", marginBottom:4 }}>
          Relevant hereditary conditions — affects risk stratification and MDM documentation
        </div>
        <textarea className="mst-ta" value={famHx} onChange={e => setFamHx(e.target.value)}
          placeholder="e.g. Father: MI age 52, CAD; Mother: T2DM, breast cancer; Sibling: sudden cardiac death…"
          rows={3} />
      </Section>

      {/* ── 6. Social History ── */}
      <Section icon="🏘️" title="Social History" badge={[smoking, alcohol, drugUse, occupation].filter(Boolean).length}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--t4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:5 }}>Tobacco Use</div>
            <select className="mst-select" value={smoking} onChange={e => setSmoking(e.target.value)}>
              <option value="">Select…</option>
              {SMOKING_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--t4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:5 }}>Alcohol Use</div>
            <select className="mst-select" value={alcohol} onChange={e => setAlcohol(e.target.value)}>
              <option value="">Select…</option>
              {ALCOHOL_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--t4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:5 }}>Substance Use</div>
            <select className="mst-select" value={drugUse} onChange={e => setDrugUse(e.target.value)}>
              <option value="">Select…</option>
              {DRUG_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--t4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:5 }}>Occupation</div>
            <input className="mst-inp" value={occupation} onChange={e => setOccupation(e.target.value)}
              placeholder="e.g. Nurse, Construction worker…" />
          </div>
        </div>
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--t4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:5 }}>Additional Social History</div>
          <textarea className="mst-ta" value={socHx} onChange={e => setSocHx(e.target.value)}
            placeholder="Living situation, support system, travel history, exposures, recent life stressors…"
            rows={2} />
        </div>
      </Section>

      {/* ── 7. Code Status ── */}
      <Section icon="📄" title="Code Status / Goals of Care" badge={codeStatus ? 1 : 0}>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {["Full Code","DNR","DNR/DNI","Comfort Measures Only","Limited Resuscitation","Not yet established"].map(opt => {
            const active = codeStatus === opt;
            return (
              <button key={opt} onClick={() => setCodeStatus(active ? "" : opt)}
                style={{ padding:"8px 14px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:600,
                  fontFamily:"'DM Sans',sans-serif", transition:"all .12s",
                  border: `1px solid ${active ? "rgba(0,229,192,.5)" : "rgba(42,77,114,.4)"}`,
                  background: active ? "rgba(0,229,192,.1)" : "transparent",
                  color: active ? "var(--teal)" : "var(--t3)" }}>
                {opt}
              </button>
            );
          })}
        </div>
      </Section>

      {/* ── Context summary ── */}
      {(medications.length > 0 || allergies.length > 0 || pmhCount > 0) && (
        <div className="mst-summary">
          <div className="mst-summary-lbl">Clinical Context Summary — Downstream Use</div>
          {medications.length > 0 && (
            <div className="mst-summary-row">
              <span className="mst-summary-key">Medications</span>
              <span className="mst-summary-val">{medications.slice(0, 4).join(", ")}{medications.length > 4 ? ` +${medications.length - 4} more` : ""}</span>
            </div>
          )}
          {allergies.length > 0 && (
            <div className="mst-summary-row">
              <span className="mst-summary-key">Allergies</span>
              <span className="mst-summary-val" style={{ color:"var(--coral)" }}>
                ⚠ {allergies.join(", ")}
              </span>
            </div>
          )}
          {pmhCount > 0 && (
            <div className="mst-summary-row">
              <span className="mst-summary-key">PMH ({pmhCount})</span>
              <span className="mst-summary-val">
                {Object.keys(pmhSelected).filter(k => pmhSelected[k]).slice(0, 4).join(", ")}
                {pmhCount > 4 ? ` +${pmhCount - 4} more` : ""}
              </span>
            </div>
          )}
          {smoking && (
            <div className="mst-summary-row">
              <span className="mst-summary-key">Tobacco</span>
              <span className="mst-summary-val">{smoking}</span>
            </div>
          )}
          {codeStatus && (
            <div className="mst-summary-row">
              <span className="mst-summary-key">Code Status</span>
              <span className="mst-summary-val" style={{ fontWeight:700, color:"var(--gold)" }}>{codeStatus}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Advance button ── */}
      <button onClick={onAdvance}
        style={{ padding:"11px 0", borderRadius:10, background:"linear-gradient(135deg,var(--teal),#00b4d8)",
          border:"none", color:"#050f1e", fontWeight:700, fontSize:14, cursor:"pointer",
          fontFamily:"'DM Sans',sans-serif", letterSpacing:.3 }}>
        Continue to SDOH Screening →
      </button>
    </div>
  );
}