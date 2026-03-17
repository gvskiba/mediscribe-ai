const ER_CONDITIONS = [
  {
    id: "stemi",
    name: "STEMI",
    fullName: "ST-Elevation Myocardial Infarction",
    icon: "❤️‍🔥",
    color: "#ef4444",
    category: "cardiac",
    urgency: "CRITICAL",
    tag: "Door-to-Balloon <90 min",
    keyPoints: [
      "Activate Cath Lab immediately — do not wait for troponin",
      "Aspirin 325 mg PO (chew) + P2Y12 inhibitor (ticagrelor 180 mg or clopidogrel 600 mg)",
      "Anticoagulation: Heparin 60 units/kg IV bolus (max 4000 units)",
      "Morphine only if refractory pain — CRUSADE data suggests harm",
      "Nitroglycerin: AVOID in RV infarction (inferior MI + hypotension)",
      "Oxygen only if SpO₂ <90%",
    ],
    medications: [
      { name: "Aspirin", dose: "325 mg PO (chew)", timing: "Immediate", note: "Irreversible COX-1 inhibition" },
      { name: "Ticagrelor", dose: "180 mg PO load", timing: "Immediate", note: "Preferred P2Y12; faster onset vs clopidogrel" },
      { name: "Heparin UFH", dose: "60 units/kg IV bolus (max 4000U); 12 units/kg/hr infusion", timing: "Immediate", note: "Weight-based nomogram; aPTT target 50–70 sec" },
      { name: "Nitroglycerin", dose: "0.4 mg SL q5min × 3 (if no RV infarct)", timing: "For chest pain", note: "CONTRAINDICATED if SBP <90 or RV infarction" },
      { name: "Metoprolol", dose: "5 mg IV q5min × 3 (if stable)", timing: "Early beta-blockade", note: "Avoid if HR <60, SBP <100, or HF signs" },
    ],
    workup: ["12-lead ECG within 10 min", "Troponin I/T (do NOT delay PCI)", "CBC, BMP, coags", "CXR (portable)", "Bedside echo if diagnosis uncertain"],
    disposition: "Immediate cath lab activation. PCI preferred over thrombolytics if available within 120 min.",
    refs: ["ACC/AHA STEMI Guidelines 2013/2022", "GUSTO Trial", "TRITON-TIMI 38"],
  },
  {
    id: "nstemi_ua",
    name: "NSTEMI / UA",
    fullName: "Non-ST Elevation MI / Unstable Angina",
    icon: "🫀",
    color: "#f97316",
    category: "cardiac",
    urgency: "HIGH",
    tag: "Risk-Stratify with TIMI/GRACE",
    keyPoints: [
      "TIMI score ≥3 or GRACE >140 = high risk → early invasive strategy (<24h)",
      "Dual antiplatelet therapy: Aspirin + P2Y12 (hold if CABG possible)",
      "Anticoagulation: LMWH (enoxaparin) preferred over UFH for most",
      "Avoid nitroglycerin if PDE-5 inhibitor within 24–48h",
      "Serial ECGs and troponins q3–6h",
    ],
    medications: [
      { name: "Aspirin", dose: "325 mg PO load, then 81 mg daily", timing: "Immediate", note: "Do not delay" },
      { name: "Ticagrelor", dose: "180 mg PO load, then 90 mg BID", timing: "Immediate (if no CABG planned)", note: "Preferred over clopidogrel in NSTEMI" },
      { name: "Enoxaparin", dose: "1 mg/kg SQ q12h (0.75 mg/kg if >75y)", timing: "After antiplatelets", note: "Avoid if CrCl <30 — use UFH" },
      { name: "Nitroglycerin", dose: "0.4 mg SL q5min × 3; IV infusion 5–200 mcg/min", timing: "For active ischemia", note: "Titrate IV to symptom relief" },
    ],
    workup: ["Serial troponins q3h (hs-troponin) or q6h", "Serial ECGs", "TIMI/GRACE score", "Echo for wall motion", "CBC, BMP, coags, lipids"],
    disposition: "Admit CCU/telemetry. Early invasive (<24h) for high-risk. Conservative for low-risk.",
    refs: ["ACC/AHA UA/NSTEMI Guidelines 2014", "PLATO Trial", "TIMACS Trial"],
  },
  {
    id: "chf_acute",
    name: "Acute Decompensated HF",
    fullName: "Acute Decompensated Heart Failure / Flash Pulmonary Edema",
    icon: "🫁",
    color: "#3b82f6",
    category: "cardiac",
    urgency: "HIGH",
    tag: "LMNOP Mnemonic",
    keyPoints: [
      "LMNOP: Lasix, Morphine (caution), Nitrates, Oxygen, Position (upright)",
      "High-flow O₂ or CPAP/BiPAP first — avoid intubation if possible",
      "Furosemide IV: 1–2.5× patient's usual oral dose (min 40 mg if diuretic-naïve)",
      "Nitroglycerin: potent venodilator — use early in flash pulm edema",
      "BNP/NT-proBNP to confirm diagnosis and severity",
      "Avoid aggressive diuresis if ACS is precipitant",
    ],
    medications: [
      { name: "Furosemide", dose: "40–160 mg IV (1–2.5× oral dose)", timing: "Immediate", note: "Monitor urine output; repeat q2–6h if inadequate diuresis" },
      { name: "Nitroglycerin", dose: "SL 0.4 mg q5min × 3; IV infusion 5–200 mcg/min", timing: "Early — preload reduction", note: "Titrate to SBP >90 mmHg; monitor for hypotension" },
      { name: "BiPAP/CPAP", dose: "CPAP 5–10 cmH₂O or BiPAP 10/5", timing: "Immediate for hypoxia", note: "Reduces intubation rate 40%; titrate FiO₂ to SpO₂ ≥94%" },
      { name: "Morphine", dose: "2–4 mg IV PRN", timing: "Caution — use sparingly", note: "Reduces anxiety/preload; associated with worse outcomes in some studies" },
    ],
    workup: ["BNP or NT-proBNP", "CXR (pulmonary edema pattern)", "ECG (ACS/arrhythmia?)", "CBC, BMP (creatinine, K+)", "Bedside echo", "Troponin"],
    disposition: "ICU/CCU for respiratory failure/hemodynamic compromise. Telemetry for stable. Address precipitant.",
    refs: ["AHA/ACC HF Guidelines 2022", "JAMA Cardiology 2020"],
  },
  {
    id: "pe_massive",
    name: "Pulmonary Embolism",
    fullName: "Acute Pulmonary Embolism (Massive / Submassive)",
    icon: "🫁",
    color: "#8b5cf6",
    category: "pulm",
    urgency: "CRITICAL",
    tag: "Bedside Echo / CTPA",
    keyPoints: [
      "Massive PE: SBP <90 mmHg or circulatory collapse → systemic thrombolysis",
      "Submassive PE: hemodynamically stable + RV dysfunction → consider catheter-directed or systemic lytics",
      "Anticoagulate immediately unless contraindicated",
      "Bedside echo: RV dilation, septal flattening (D-sign), McConnell's sign",
      "Wells score + high-sensitivity D-dimer for risk stratification",
      "Hold anticoagulation 24h post-systemic tPA (stroke guidelines)",
    ],
    medications: [
      { name: "Alteplase (tPA)", dose: "100 mg IV over 2h (massive PE) OR 0.6 mg/kg over 15 min (fast protocol)", timing: "Massive PE / arrest", note: "CPR during tPA okay; hold heparin during infusion; restart when aPTT <80" },
      { name: "Heparin UFH", dose: "80 units/kg IV bolus, then 18 units/kg/hr", timing: "Immediate (submassive/low-risk)", note: "Preferred for potential lytics — easier reversal than LMWH" },
      { name: "Rivaroxaban", dose: "15 mg PO BID × 21 days (outpatient/low-risk)", timing: "Oral option for hemodynamically stable", note: "Avoid if massive PE — GI absorption unreliable in shock" },
      { name: "Enoxaparin", dose: "1 mg/kg SQ q12h", timing: "Submassive/stable PE", note: "Avoid if CrCl <30 or potential lytics needed" },
    ],
    workup: ["CTPA (gold standard)", "Bedside echo", "Troponin + BNP (RV strain)", "D-dimer (low-risk rule-out)", "Lower extremity duplex", "ABG if hypoxic"],
    disposition: "Massive/arrest → ICU + ID/IR for catheter-directed therapy. Submassive → ICU/stepdown. Low-risk PESI class I/II → consider outpatient.",
    refs: ["AHA PE Guidelines 2019", "PESI Score", "MOPETT Trial", "SEATTLE II Trial"],
  },
  {
    id: "aortic_dissection",
    name: "Aortic Dissection",
    fullName: "Acute Aortic Dissection (Type A / Type B)",
    icon: "🩸",
    color: "#ef4444",
    category: "cardiac",
    urgency: "CRITICAL",
    tag: "Do NOT anticoagulate",
    keyPoints: [
      "Type A (ascending): Emergency surgical repair — do NOT delay",
      "Type B (descending): Medical management — HR and BP control",
      "Target HR <60 bpm AND SBP 100–120 mmHg",
      "IV beta-blocker FIRST (reduce dP/dt), then vasodilator if needed",
      "AVOID nitroprusside/hydralazine without beta-blockade (reflex tachycardia = shear force)",
      "Do NOT anticoagulate without surgical consultation",
    ],
    medications: [
      { name: "Esmolol", dose: "500 mcg/kg IV bolus, then 50–300 mcg/kg/min infusion", timing: "First-line — HR control", note: "Titratable, short-acting; target HR <60 bpm" },
      { name: "Labetalol", dose: "20 mg IV over 2 min; repeat 40–80 mg q10min; max 300 mg", timing: "Alternative to esmolol", note: "Combined alpha/beta — good for both HR and BP" },
      { name: "Nicardipine", dose: "5–15 mg/hr IV infusion (titrate)", timing: "Add for BP if beta-blockade alone insufficient", note: "Only AFTER adequate beta-blockade; never before" },
      { name: "Morphine", dose: "2–4 mg IV q5–10 min PRN", timing: "Pain management", note: "Reduces catecholamine surge and sympathetic drive" },
    ],
    workup: ["CT Aorta with IV contrast (diagnostic)", "CXR (widened mediastinum)", "Bedside echo (pericardial effusion, AR)", "BMP, CBC, coags, type & screen", "Troponin (rule out ACS)"],
    disposition: "Type A → immediate cardiac surgery consultation. Type B → ICU, vascular surgery consult, medical management.",
    refs: ["AHA/ACC Thoracic Aorta Guidelines 2022", "IRAD Registry"],
  },
  {
    id: "stroke_ischemic",
    name: "Ischemic Stroke",
    fullName: "Acute Ischemic Stroke",
    icon: "🧠",
    color: "#8b5cf6",
    category: "neuro",
    urgency: "CRITICAL",
    tag: "Door-to-Needle <60 min",
    keyPoints: [
      "Activate Stroke Code immediately — time = brain (1.9M neurons/min)",
      "tPA eligibility: onset ≤4.5h, no contraindications, NIHSS ≥4–5",
      "NIHSS ≥6 + LVO on CTA → mechanical thrombectomy (up to 24h in selected)",
      "BP target: <185/110 before tPA; <180/105 after tPA × 24h",
      "Do NOT lower BP aggressively if not giving tPA (permissive HTN up to 220/120)",
      "Hold anticoagulation 24h after IV tPA",
    ],
    medications: [
      { name: "Alteplase (tPA)", dose: "0.9 mg/kg IV (max 90 mg); 10% over 1 min, rest over 60 min", timing: "≤4.5h from onset (or last known well)", note: "Absolute CI: recent ICH, intracranial tumor, active bleeding, severe HTN uncontrolled" },
      { name: "Labetalol", dose: "10–20 mg IV over 1–2 min; repeat q10–20 min PRN", timing: "BP >185/110 before tPA", note: "Target BP <185/110 for tPA eligibility; <180/105 after" },
      { name: "Nicardipine", dose: "5–15 mg/hr IV (titrate for BP)", timing: "Alternative BP agent", note: "Preferred for drip-based control" },
      { name: "Aspirin", dose: "325 mg PO/NGT (if NOT giving tPA)", timing: "Within 24–48h of stroke onset", note: "Delay 24h after tPA; safe for non-tPA patients" },
    ],
    workup: ["Non-contrast CT head (rule out hemorrhage)", "CTA head and neck (LVO?)", "MRI DWI (if CT negative)", "Glucose immediately (hypoglycemia mimic)", "12-lead ECG (AFib?)", "CBC, BMP, PT/INR, lipids"],
    disposition: "Stroke unit admission. LVO → IR/neurology for thrombectomy. tPA patient → ICU ×24h neuro monitoring.",
    refs: ["AHA/ASA Stroke Guidelines 2019/2023", "NINDS tPA Trial", "DAWN/DEFUSE-3 Trials"],
  },
  {
    id: "hypertensive_emergency",
    name: "Hypertensive Emergency",
    fullName: "Hypertensive Emergency with End-Organ Damage",
    icon: "🔴",
    color: "#ef4444",
    category: "cardiac",
    urgency: "HIGH",
    tag: "Reduce MAP 25% in 1st hour",
    keyPoints: [
      "Target: reduce MAP by no more than 25% in first hour, then to 160/100 over 2–6h",
      "Exception: Aortic dissection → rapid HR + BP control (see Dissection protocol)",
      "Exception: Ischemic stroke → permissive HTN unless giving tPA",
      "Labetalol (IV) or Nicardipine (IV) are first-line for most hypertensive emergencies",
      "Avoid oral agents — unreliable absorption and unpredictable effect",
      "Identify end-organ damage: brain, heart, kidneys, eyes, aorta",
    ],
    medications: [
      { name: "Labetalol", dose: "20 mg IV over 2 min; repeat 40–80 mg q10min; OR 1–2 mg/min infusion", timing: "First-line (most presentations)", note: "Avoid asthma, decompensated HF, cocaine-induced HTN" },
      { name: "Nicardipine", dose: "5 mg/hr IV; titrate by 2.5 mg/hr q5–15 min; max 15 mg/hr", timing: "First-line (preferred in neuro)", note: "Excellent titrability; preferred for stroke-related HTN urgency" },
      { name: "Hydralazine", dose: "10–20 mg IV q20–30 min PRN (eclampsia/pregnancy)", timing: "Preferred in pregnancy", note: "Unpredictable response — prefer labetalol/nicardipine in non-OB patients" },
      { name: "Nitroprusside", dose: "0.3–0.5 mcg/kg/min IV (titrate to effect)", timing: "Aortic dissection / hypertensive encephalopathy", note: "Cyanide toxicity risk >48–72h; use with caution in renal failure" },
    ],
    workup: ["ECG", "CXR", "BMP (creatinine, K+)", "Urinalysis (RBC casts = nephropathy)", "Troponin", "CT head if neuro symptoms", "Fundoscopy (papilledema)"],
    disposition: "ICU for IV drips. Admit for end-organ workup. Oral step-down when hemodynamically stable.",
    refs: ["AHA/ACC HTN Guidelines 2017", "JNC 8", "JNC 7 Hypertensive Emergency"],
  },
  {
    id: "anaphylaxis",
    name: "Anaphylaxis",
    fullName: "Anaphylaxis / Anaphylactic Shock",
    icon: "⚠️",
    color: "#f59e0b",
    category: "allergy",
    urgency: "CRITICAL",
    tag: "Epinephrine is FIRST-LINE",
    keyPoints: [
      "Epinephrine IM (thigh) is FIRST-LINE — do not delay for antihistamines",
      "Dose: 0.3–0.5 mg IM (1:1000 concentration) q5–15 min PRN",
      "IV epinephrine ONLY for refractory shock (careful titration required)",
      "Diphenhydramine and corticosteroids are ADJUNCTS — not primary treatment",
      "Biphasic reaction: 20% risk up to 72h — observe ≥4–6h post-episode",
      "Airway: early intubation if stridor/angioedema (edema progresses rapidly)",
    ],
    medications: [
      { name: "Epinephrine", dose: "0.3–0.5 mg IM (outer thigh, 1:1000); repeat q5–15 min", timing: "IMMEDIATE — first-line", note: "EpiPen 0.3 mg adults / 0.15 mg pediatric; IV only for refractory shock" },
      { name: "Diphenhydramine", dose: "25–50 mg IV/IM/PO", timing: "After epinephrine", note: "H1 blocker — adjunct only; does NOT replace epi" },
      { name: "Ranitidine/Famotidine", dose: "Famotidine 20 mg IV", timing: "After epinephrine", note: "H2 blocker — adjunct for cutaneous symptoms" },
      { name: "Methylprednisolone", dose: "125 mg IV (adults)", timing: "After epinephrine", note: "Reduces biphasic reaction risk; onset delayed 4–6h" },
      { name: "Albuterol", dose: "2.5 mg neb q20 min × 3 (for bronchospasm)", timing: "If bronchospasm predominant", note: "Adjunct to epinephrine for airway symptoms" },
    ],
    workup: ["Clinical diagnosis — do not delay treatment for labs", "Serum tryptase (draw at 1h, 4h, baseline) — confirms mast cell activation", "ECG if chest pain/arrhythmia", "Identify and remove trigger"],
    disposition: "Observe ≥4–6h (biphasic risk). Prescribe epinephrine auto-injector on discharge. Allergy follow-up.",
    refs: ["WAO Anaphylaxis Guidelines 2020", "ACAAI Guidelines", "ACEP Anaphylaxis Policy"],
  },
  {
    id: "dka",
    name: "Diabetic Ketoacidosis",
    fullName: "Diabetic Ketoacidosis (DKA)",
    icon: "🧪",
    color: "#f59e0b",
    category: "endo",
    urgency: "HIGH",
    tag: "Fluids → Insulin → K+ replacement",
    keyPoints: [
      "Fluids FIRST — start insulin only after K+ ≥3.5 mEq/L (risk of fatal hypokalemia)",
      "Fluid: 1L NS over 1st hour, then 250–500 mL/hr based on hemodynamics",
      "Regular insulin 0.1 units/kg/hr IV infusion (or 0.1 units/kg bolus then 0.1 units/kg/hr)",
      "Replace K+: K 3.5–5.5 → 20–40 mEq/hr IV; K <3.5 → replace before insulin",
      "Target: glucose reduction 50–75 mg/dL/hr; close anion gap; mental status improvement",
      "Bicarbonate: ONLY if pH <6.9 (controversial, generally avoid)",
    ],
    medications: [
      { name: "Normal Saline (0.9% NS)", dose: "1 L IV over 1h, then 250–500 mL/hr", timing: "Immediate — before insulin", note: "Switch to 0.45% NS or D5 0.45 NS when glucose <250 mg/dL" },
      { name: "Regular Insulin", dose: "0.1 units/kg/hr IV continuous infusion", timing: "ONLY after K+ ≥3.5", note: "Do NOT bolus unless absolutely needed; check glucose q1h" },
      { name: "Potassium Chloride", dose: "20–40 mEq/hr IV (if K 3.5–5.5); HOLD insulin if K <3.5", timing: "Concurrent with fluids", note: "Replace aggressively — insulin drives K+ intracellularly" },
      { name: "Sodium Bicarbonate", dose: "100 mEq IV over 2h (only if pH <6.9)", timing: "Only in severe acidosis", note: "Generally avoided — paradoxical CNS acidosis risk" },
    ],
    workup: ["ABG/VBG (pH, HCO₃)", "BMP q2–4h", "Ketones (urine or serum β-hydroxybutyrate)", "CBC (leukocytosis expected)", "Anion gap: Na – (Cl + HCO₃) — normal 12±2", "UA/cultures (identify precipitant)"],
    disposition: "ICU for severe (pH <7.0, AMS, K+ <3.0). Medical floor for mild-moderate. Identify and treat precipitant (infection, missed insulin, new DM).",
    refs: ["ADA DKA Guidelines 2023", "JCEM DKA Protocol"],
  },
  {
    id: "hhs",
    name: "Hyperosmolar Hyperglycemic State",
    fullName: "Hyperosmolar Hyperglycemic State (HHS)",
    icon: "🧪",
    color: "#f59e0b",
    category: "endo",
    urgency: "HIGH",
    tag: "Glucose >600 + No Ketosis",
    keyPoints: [
      "HHS: glucose often 600–1200 mg/dL, serum osm >320, minimal ketones",
      "Massive fluid deficit (8–10 L typical) — aggressive rehydration is key",
      "Insulin less critical than fluids — fluid alone reduces glucose substantially",
      "Avoid rapid glucose correction — cerebral edema risk in children especially",
      "Mortality 10–20% (vs 1–5% in DKA) — older patients, often precipitated by infection",
      "K+ replacement critical as in DKA — insulin causes intracellular shift",
    ],
    medications: [
      { name: "Normal Saline (0.9% NS)", dose: "1 L IV over 1h, then 500 mL/hr × 4h, then 250 mL/hr", timing: "Immediate — massive rehydration", note: "Total fluid deficit typically 8–10 L; pace correction to avoid cerebral edema" },
      { name: "Regular Insulin", dose: "0.1 units/kg/hr IV (after volume initiated)", timing: "After fluids started", note: "Glucose will drop with fluids alone; target 50–75 mg/dL/hr reduction" },
      { name: "Potassium Chloride", dose: "20–40 mEq/hr if K 3.5–5.5", timing: "Ongoing — replace throughout", note: "Insulin drives K+ intracellularly; anticipate hypokalemia" },
    ],
    workup: ["BMP q2–4h", "Serum osmolality: 2×Na + glucose/18 + BUN/2.8 (target <310)", "CBC, blood cultures (rule out sepsis precipitant)", "UA", "ECG"],
    disposition: "ICU — high mortality, frequent monitoring required. Identify precipitant (infection most common).",
    refs: ["ADA HHS Guidelines 2023"],
  },
  {
    id: "status_epilepticus",
    name: "Status Epilepticus",
    fullName: "Status Epilepticus (Convulsive)",
    icon: "⚡",
    color: "#8b5cf6",
    category: "neuro",
    urgency: "CRITICAL",
    tag: "Benzodiazepine → AED → Anesthesia",
    keyPoints: [
      "Phase 1 (0–5 min): IV access, glucose check, benzodiazepine ready",
      "Phase 2 (5–20 min): Benzodiazepine — lorazepam 0.1 mg/kg IV preferred",
      "Phase 3 (20–40 min): 2nd-line AED — levetiracetam, fosphenytoin, valproate (ESETT trial: comparable)",
      "Phase 4 (>40 min): Refractory SE → general anesthesia (propofol, midazolam, ketamine infusion)",
      "Check glucose IMMEDIATELY — hypoglycemia is treatable cause",
      "Continuous EEG monitoring if non-convulsive SE suspected after convulsions stop",
    ],
    medications: [
      { name: "Lorazepam", dose: "0.1 mg/kg IV (max 4 mg); repeat ×1 in 5–10 min", timing: "Phase 1 first-line", note: "IM/IN if no IV access: 0.1 mg/kg (max 4 mg)" },
      { name: "Midazolam", dose: "0.2 mg/kg IM (max 10 mg) OR 0.1 mg/kg IN (max 5 mg)", timing: "If no IV — pre-hospital or peds", note: "Faster IM absorption than lorazepam if no IV" },
      { name: "Levetiracetam", dose: "60 mg/kg IV over 10 min (max 4500 mg)", timing: "2nd-line (after benzo failure)", note: "ESETT trial: equal efficacy to fosphenytoin and valproate; fewer drug interactions" },
      { name: "Fosphenytoin", dose: "20 mg PE/kg IV (max 150 mg PE/min)", timing: "2nd-line alternative", note: "Cardiac monitoring required; IM option if no IV" },
      { name: "Propofol", dose: "1–2 mg/kg IV bolus, then 2–10 mg/kg/hr infusion", timing: "Refractory SE (>40 min)", note: "Requires intubation; propofol infusion syndrome risk >48h" },
    ],
    workup: ["Glucose stat (bedside)", "BMP, CBC, LFTs, toxicology", "AED levels (if on therapy)", "CT head (after stabilization)", "LP if meningitis suspected", "Continuous EEG"],
    disposition: "ICU for refractory SE. Neurology consultation. Identify and treat underlying cause.",
    refs: ["AES/ACEP Status Epilepticus Guidelines 2016", "ESETT Trial NEJM 2019"],
  },
  {
    id: "epiglottitis",
    name: "Epiglottitis",
    fullName: "Acute Epiglottitis / Supraglottitis",
    icon: "🔴",
    color: "#ef4444",
    category: "ent",
    urgency: "CRITICAL",
    tag: "Airway Emergency — Senior Airway NOW",
    keyPoints: [
      "Airway is the PRIORITY — do not leave patient unattended",
      "Do NOT attempt to visualize pharynx in agitated patient (may precipitate obstruction)",
      "Position of comfort (tripod position) — do NOT force supine",
      "Senior anesthesiologist + ENT at bedside for awake fiberoptic intubation",
      "Have surgical airway (cricothyrotomy) equipment ready",
      "Blood cultures + antibiotics AFTER airway is secured",
    ],
    medications: [
      { name: "Ceftriaxone", dose: "2 g IV q12–24h", timing: "After airway secured", note: "Covers H. influenzae, Streptococci, Staphylococci" },
      { name: "Dexamethasone", dose: "10 mg IV × 1, then 4 mg IV q6h", timing: "After airway secured", note: "Reduces airway edema; evidence limited but widely used" },
      { name: "Heliox", dose: "70:30 helium-oxygen mixture", timing: "Bridge while preparing airway", note: "Reduces airway resistance in partial obstruction; buys time" },
      { name: "Vancomycin", dose: "25–30 mg/kg IV load if MRSA concern", timing: "Add if healthcare-associated or no response", note: "Add if no response to ceftriaxone at 24–48h" },
    ],
    workup: ["Lateral neck XR (thumbprint sign — classic)", "CT neck (if stable, uncertain diagnosis)", "Blood cultures before antibiotics (after airway)", "CBC, BMP"],
    disposition: "ICU with airway. ENT + anesthesia at bedside. Convert to oral antibiotics when improving and airway stable.",
    refs: ["AAO-HNS Epiglottitis Guidelines", "UpToDate 2023"],
  },
  {
    id: "meningitis",
    name: "Bacterial Meningitis",
    fullName: "Acute Bacterial Meningitis",
    icon: "🧠",
    color: "#ef4444",
    category: "neuro",
    urgency: "CRITICAL",
    tag: "Antibiotics within 30 min of Dx",
    keyPoints: [
      "Do NOT delay antibiotics for LP — if LP delayed >30 min, give antibiotics first",
      "Dexamethasone 0.15 mg/kg q6h × 4 days — BEFORE or with 1st antibiotic dose",
      "Empiric coverage: Ceftriaxone + Vancomycin + Dexamethasone",
      "Add Ampicillin if >50y, immunocompromised, pregnancy (Listeria coverage)",
      "CT head before LP only if: focal neuro deficit, AMS, papilledema, seizure, immunocompromised",
      "Classic triad: fever + neck stiffness + AMS (present in only 44%)",
    ],
    medications: [
      { name: "Dexamethasone", dose: "0.15 mg/kg IV q6h × 4 days (max 10 mg/dose)", timing: "BEFORE or with first antibiotic", note: "Reduces mortality and neurological sequelae; most effective for S. pneumoniae" },
      { name: "Ceftriaxone", dose: "2 g IV q12h", timing: "Within 30 min of presentation", note: "Covers S. pneumoniae, N. meningitidis, gram-negatives" },
      { name: "Vancomycin", dose: "15–20 mg/kg IV q8–12h (AUC-guided)", timing: "With ceftriaxone", note: "For PCN-resistant S. pneumoniae coverage" },
      { name: "Ampicillin", dose: "2 g IV q4h", timing: "Add for Listeria risk", note: "Required: age >50, immunocompromised, alcoholism, pregnancy" },
      { name: "Acyclovir", dose: "10 mg/kg IV q8h (add if HSV encephalitis in DDx)", timing: "Empirically if encephalitis suspected", note: "HSE: temporal lobe involvement, behavioral changes; cannot wait for HSV PCR" },
    ],
    workup: ["LP: opening pressure, cell count, glucose, protein, gram stain, culture, PCR panel", "CT head (if indicated before LP)", "Blood cultures × 2", "CBC, BMP, PT/INR", "CXR (pneumococcal source)"],
    disposition: "ICU for AMS, seizures, hemodynamic compromise. Contact precautions for N. meningitidis.",
    refs: ["IDSA Meningitis Guidelines 2004/Update 2017", "European ESCMID 2016", "NEJM 2017"],
  },
  {
    id: "septic_arthritis",
    name: "Septic Arthritis",
    fullName: "Septic Arthritis / Acute Joint Infection",
    icon: "🦴",
    color: "#f59e0b",
    category: "ortho",
    urgency: "HIGH",
    tag: "Joint aspiration before antibiotics",
    keyPoints: [
      "Aspiration of joint is BOTH diagnostic AND therapeutic (reduces pressure, cultures)",
      "Do NOT give antibiotics until after joint aspiration unless hemodynamically unstable",
      "WBC >50,000/mm³ in synovial fluid strongly suggests septic arthritis (>100k highly likely)",
      "Crystal arthritis (gout, CPPD) can coexist with septic arthritis",
      "Urgent orthopedic consultation for surgical irrigation/debridement",
      "Native joints: S. aureus most common; Gonococcal (GC) in sexually active young adults",
    ],
    medications: [
      { name: "Vancomycin", dose: "25–30 mg/kg IV load, then 15–20 mg/kg q8–12h", timing: "After joint aspiration", note: "MRSA + S. aureus coverage; standard empiric choice" },
      { name: "Ceftriaxone", dose: "2 g IV q24h", timing: "After joint aspiration", note: "Add for gram-negative or gonococcal coverage; GC: 1g IM/IV × 1 dose (uncomplicated)" },
      { name: "Vancomycin + Cefepime", dose: "Vanc 25–30 mg/kg + Cefepime 2 g IV q8h", timing: "Healthcare-associated or IV drug use", note: "Broader gram-negative coverage including Pseudomonas" },
    ],
    workup: ["Joint aspiration: WBC, diff, gram stain, culture, crystals", "Blood cultures × 2", "CBC, BMP, CRP, ESR", "XR of affected joint", "Synovial fluid glucose + LDH", "STI screen if GC suspected (urine NAAT)"],
    disposition: "Admit for IV antibiotics + orthopedic consultation. Surgical washout often required for S. aureus.",
    refs: ["IDSA Septic Arthritis Guidelines", "ACR 2020"],
  },
  {
    id: "necrotizing_fasciitis",
    name: "Necrotizing Fasciitis",
    fullName: "Necrotizing Fasciitis / Fournier's Gangrene",
    icon: "🩹",
    color: "#ef4444",
    category: "ssti",
    urgency: "CRITICAL",
    tag: "Surgery within HOURS — Not Hours to Spare",
    keyPoints: [
      "Surgical debridement within hours is LIFE-SAVING — do not delay for imaging",
      "Classic signs: pain out of proportion, skin necrosis, crepitus, skin anesthesia",
      "LRINEC score ≥6 suggests NF but clinical suspicion overrides score",
      "CT scan useful if diagnosis unclear but do NOT delay surgery for imaging if clinically obvious",
      "Polymicrobial (Type I) most common — cover gram-positive, gram-negative, anaerobes",
      "Type II: Group A Strep alone — add clindamycin for toxin suppression",
    ],
    medications: [
      { name: "Vancomycin", dose: "25–30 mg/kg IV + Pip-Tazo 4.5 g IV q6h", timing: "Immediately — before surgery", note: "Broad polymicrobial coverage for Type I NF" },
      { name: "Clindamycin", dose: "600–900 mg IV q8h (add for Group A Strep)", timing: "Add if Streptococcal NF suspected", note: "Inhibits toxin production (TSST, SPE) — critical for streptococcal TSS" },
      { name: "IVIG", dose: "1–2 g/kg IV × 1 dose (consider in streptococcal TSS)", timing: "Adjunct for refractory streptococcal TSS", note: "Evidence limited; may reduce mortality in Strep TSS" },
      { name: "Meropenem", dose: "1–2 g IV q8h (extended infusion)", timing: "If ESBL/MDR risk or HAI source", note: "Escalate from Pip-Tazo if healthcare-associated" },
    ],
    workup: ["CT soft tissue (gas tracking along fascial planes = hallmark)", "CBC (leukocytosis, LRINEC)", "BMP (hyponatremia, renal failure)", "CRP, lactate", "Blood cultures × 2", "Wound cultures at time of debridement"],
    disposition: "OR immediately. ICU post-op. Multiple debridements often required. ID consultation.",
    refs: ["SCCM NF Guidelines", "LRINEC Score", "NEJM Necrotizing Fasciitis 2017"],
  },
  {
    id: "gi_bleed_upper",
    name: "Upper GI Bleed",
    fullName: "Acute Upper Gastrointestinal Hemorrhage",
    icon: "🩸",
    color: "#ef4444",
    category: "gi",
    urgency: "HIGH",
    tag: "GCS/Blatchford Score Risk Stratify",
    keyPoints: [
      "Large bore IV × 2, volume resuscitation with LR/NS or PRBCs if hemodynamically unstable",
      "Transfuse if Hgb <7 (restrictive strategy — TRICC/TRIGGER trials); <8 if cardiac disease",
      "PPI: IV pantoprazole 80 mg bolus then 8 mg/hr — reduces rebleeding post-endoscopy",
      "Hold anticoagulation; reverse if on warfarin (INR >2.5 → Vit K + FFP/4-factor PCC)",
      "Urgent endoscopy within 24h (12h if high-risk: hemodynamic instability, active bleeding)",
      "Variceal bleed: octreotide + antibiotics + endoscopy (see Sepsis antibiotics — SBP prophylaxis)",
    ],
    medications: [
      { name: "Pantoprazole", dose: "80 mg IV bolus, then 8 mg/hr × 72h", timing: "Before endoscopy", note: "Reduces high-risk stigmata at endoscopy; post-hemostasis rebleeding reduction" },
      { name: "Octreotide", dose: "50 mcg IV bolus, then 50 mcg/hr (variceal only)", timing: "Variceal bleed — immediate", note: "Reduces portal pressure; continue × 3–5 days" },
      { name: "Ceftriaxone", dose: "1 g IV q24h (for variceal/cirrhotic patients)", timing: "Variceal bleed / cirrhosis", note: "SBP prophylaxis in cirrhosis — reduces infection and mortality" },
      { name: "TXA (Tranexamic Acid)", dose: "1 g IV over 10 min, then 1 g over 8h (not routinely recommended)", timing: "Controversial — HALT-IT trial negative for UGI", note: "Evidence does NOT support routine use in UGI bleed" },
    ],
    workup: ["CBC (Hgb, plt), BMP, coags, type & screen/crossmatch", "Liver function (cirrhosis?)", "Nasogastric aspirate (if diagnosis uncertain)", "Blatchford / GCS score", "Urgent GI consultation for endoscopy"],
    disposition: "ICU for hemodynamic instability/active bleeding. Medical floor with GI monitoring for stable high-risk. Outpatient for low-risk Blatchford 0.",
    refs: ["ASGE GI Bleed Guidelines 2012", "HALT-IT Trial Lancet 2020", "TRICC Trial"],
  },
  {
    id: "acute_liver_failure",
    name: "Acute Liver Failure",
    fullName: "Acute Liver Failure (ALF)",
    icon: "🟡",
    color: "#f59e0b",
    category: "gi",
    urgency: "CRITICAL",
    tag: "APAP Overdose — Most Common Cause",
    keyPoints: [
      "Most common cause in US: acetaminophen overdose (50% of ALF cases)",
      "N-Acetylcysteine (NAC): indicated for ALL APAP-induced ALF regardless of timing",
      "Encephalopathy + INR ≥1.5 = ALF definition; brain edema main cause of death",
      "Contact liver transplant center early — rapid deterioration possible",
      "Avoid sedatives (precipitate HE); avoid nephrotoxins",
      "Correct coagulopathy only if active bleeding or procedural need (INR does NOT need correction otherwise)",
    ],
    medications: [
      { name: "N-Acetylcysteine (NAC)", dose: "150 mg/kg IV over 1h, then 50 mg/kg over 4h, then 100 mg/kg over 16h", timing: "Immediately — all APAP-induced ALF", note: "Use Rumack-Matthew nomogram for APAP overdose. Oral protocol: 140 mg/kg then 70 mg/kg q4h × 17 doses" },
      { name: "Lactulose", dose: "30–45 mL PO/NGT TID–QID (titrate to 2–3 soft stools/day)", timing: "Hepatic encephalopathy", note: "Reduces ammonia absorption; avoid if bowel obstruction" },
      { name: "Rifaximin", dose: "550 mg PO BID", timing: "Grade 2+ hepatic encephalopathy", note: "Non-absorbable antibiotic; reduces intestinal ammonia production" },
      { name: "Mannitol", dose: "0.5–1 g/kg IV bolus (for severe ICP elevation)", timing: "Grade 3–4 HE with ICP elevation", note: "Temporary ICP control while awaiting transplant" },
    ],
    workup: ["LFTs, bilirubin, GGT, PT/INR (q4–6h)", "APAP level (serum)", "Toxicology screen", "Viral hepatitis panel (HAV, HBV, HCV)", "Autoimmune panel (ANA, ASMA)", "CT abdomen", "Serum ammonia (hepatic encephalopathy marker)"],
    disposition: "ICU. Liver transplant center consultation. King's College Criteria or MELD-Na for transplant listing.",
    refs: ["AASLD ALF Guidelines 2021", "Rumack-Matthew Nomogram", "King's College Criteria"],
  },
  {
    id: "thyroid_storm",
    name: "Thyroid Storm",
    fullName: "Thyroid Storm / Thyrotoxic Crisis",
    icon: "🌡️",
    color: "#ef4444",
    category: "endo",
    urgency: "CRITICAL",
    tag: "Burch-Wartofsky Score ≥45",
    keyPoints: [
      "Burch-Wartofsky Point Scale (BWPS) ≥45 = thyroid storm; 25–44 = impending storm",
      "Treatment sequence: PTU/MMI → iodine (wait 1h) → beta-blocker → steroids",
      "Give PTU BEFORE potassium iodide (SSKI) — iodine provides substrate if given first",
      "Propranolol: reduces HR AND blocks peripheral T4→T3 conversion",
      "ICU admission — mortality 10–30% without treatment",
      "Identify precipitant: infection, surgery, iodine load, cessation of antithyroid meds",
    ],
    medications: [
      { name: "Propylthiouracil (PTU)", dose: "500–1000 mg PO loading, then 250 mg q4–6h", timing: "First — inhibits synthesis AND T4→T3 conversion", note: "Preferred over methimazole in storm — additional T4→T3 block" },
      { name: "Lugol's Solution (SSKI)", dose: "5–10 drops PO q8h", timing: "1 hour AFTER PTU/MMI", note: "Wolff-Chaikoff effect — blocks T4 release; must give PTU first" },
      { name: "Propranolol", dose: "60–80 mg PO q4h OR 0.5–1 mg IV slowly q10 min", timing: "Concurrent with PTU", note: "Reduces HR, peripheral T4→T3 conversion, adrenergic symptoms" },
      { name: "Hydrocortisone", dose: "100 mg IV q8h", timing: "Concurrent", note: "Blocks T4→T3 conversion; relative adrenal insufficiency in thyroid storm" },
    ],
    workup: ["TSH (suppressed), free T4, free T3", "CBC, BMP, LFTs", "Blood cultures (infectious precipitant)", "ECG (AF, sinus tach)", "BWPS score calculation"],
    disposition: "ICU. Endocrinology consultation. Treat precipitant.",
    refs: ["JCEM Thyroid Storm 2016", "ATA Guidelines 2016", "Burch-Wartofsky Point Scale"],
  },
  {
    id: "adrenal_crisis",
    name: "Adrenal Crisis",
    fullName: "Acute Adrenal Insufficiency / Addisonian Crisis",
    icon: "⚠️",
    color: "#f59e0b",
    category: "endo",
    urgency: "CRITICAL",
    tag: "Hydrocortisone before labs if unstable",
    keyPoints: [
      "Life-threatening — do NOT wait for cortisol results if clinical suspicion is high",
      "Classic presentation: hypotension, hyponatremia, hyperkalemia, hypoglycemia, eosinophilia",
      "Hydrocortisone is drug of choice — has both glucocorticoid AND mineralocorticoid activity",
      "Give dextrose if hypoglycemic",
      "Precipitants: infection/stress in known AI, bilateral adrenal hemorrhage, pituitary apoplexy, sudden steroid withdrawal",
      "Do NOT use dexamethasone if still need cosyntropin stim test (doesn't cross-react with cortisol assay)",
    ],
    medications: [
      { name: "Hydrocortisone", dose: "100 mg IV bolus, then 50–100 mg IV q6–8h (or 200 mg/24h continuous)", timing: "Immediate — before labs if unstable", note: "Covers both glucocorticoid and mineralocorticoid needs; taper after acute crisis" },
      { name: "Normal Saline (0.9% NS)", dose: "1 L IV over 30–60 min, then 500 mL/hr × 4h", timing: "Immediate fluid resuscitation", note: "Volume depletion is key pathophysiology; aggressive resuscitation needed" },
      { name: "Dextrose 50% (D50W)", dose: "25 mL IV (if hypoglycemic)", timing: "If glucose <60", note: "Glucose often low in adrenal crisis; correct immediately" },
      { name: "Fludrocortisone", dose: "0.1 mg PO daily (after acute stabilization)", timing: "Oral step-down for primary AI", note: "Mineralocorticoid replacement — not needed in secondary AI" },
    ],
    workup: ["Random cortisol (draw before steroids if possible)", "ACTH stimulation test (when stable)", "ACTH level", "BMP (hyponatremia, hyperkalemia, hypoglycemia)", "CBC (eosinophilia, lymphocytosis)", "Blood cultures if infection suspected"],
    disposition: "ICU/HDU. Endocrinology consultation. Taper steroids as tolerated. Treat precipitant.",
    refs: ["Endocrine Society Adrenal Insufficiency Guidelines 2016", "JCEM 2016"],
  },
  {
    id: "acute_pancreatitis",
    name: "Acute Pancreatitis",
    fullName: "Acute Pancreatitis (Mild / Moderate / Severe)",
    icon: "🫃",
    color: "#f59e0b",
    category: "gi",
    urgency: "HIGH",
    tag: "Fluids + Pain + NPO (Early PO now recommended)",
    keyPoints: [
      "Aggressive early IV fluids: LR preferred over NS (reduces SIRS, organ failure — WATERFALL trial)",
      "Early oral feeding (within 24h) is now preferred over prolonged NPO",
      "Analgesia: opioids appropriate — morphine or hydromorphone; NSAIDs effective if tolerated",
      "Antibiotics only if infected pancreatic necrosis — NOT for prophylaxis",
      "Ranson/BISAP/APACHE-II for severity scoring",
      "ERCP within 24–48h if gallstone pancreatitis + cholangitis",
    ],
    medications: [
      { name: "Lactated Ringer's (LR)", dose: "500 mL bolus over 1h, then 250–500 mL/hr × first 12–24h", timing: "Immediate — aggressive early resuscitation", note: "WATERFALL trial: LR reduced SIRS vs NS. Target urine output >0.5 mL/kg/hr" },
      { name: "Morphine / Hydromorphone", dose: "Morphine 2–4 mg IV PRN or Hydromorphone 0.2–0.6 mg IV PRN", timing: "Pain management", note: "Historic morphine-avoidance myth is debunked — opioids are safe and effective" },
      { name: "Ondansetron", dose: "4–8 mg IV q6–8h PRN", timing: "Nausea/vomiting control", note: "Adjunct antiemetic; NGT only if intractable vomiting with aspiration risk" },
    ],
    workup: ["Lipase (3× ULN), amylase (less specific)", "BMP, CBC, LFTs, lipid panel", "Calcium (hypocalcemia in severe)", "CT abdomen with contrast (if diagnosis unclear or severe at 48–72h)", "RUQ ultrasound (gallstones)", "BISAP score: BUN>25, AMS, SIRS, age>60, pleural effusion"],
    disposition: "ICU for severe/necrotizing. Surgical/GI consultation for complications. Most mild cases: medical floor.",
    refs: ["ACG Pancreatitis Guidelines 2013", "WATERFALL Trial NEJM 2022", "BISAP Score"],
  },
];

const CATEGORY_COLORS = {
  cardiac: "#ef4444",
  pulm: "#3b82f6",
  neuro: "#8b5cf6",
  allergy: "#f59e0b",
  endo: "#10b981",
  gi: "#f97316",
  ent: "#ec4899",
  ortho: "#6366f1",
  ssti: "#f87171",
};

const URGENCY_CONFIG = {
  CRITICAL: { bg: "rgba(239,68,68,0.12)", color: "#ef4444", border: "rgba(239,68,68,0.3)" },
  HIGH: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "rgba(245,158,11,0.3)" },
  MODERATE: { bg: "rgba(59,130,246,0.12)", color: "#3b82f6", border: "rgba(59,130,246,0.3)" },
};

const ER_CONDITION_CATEGORIES = [
  { id: "all", label: "All Conditions", icon: "🏥" },
  { id: "cardiac", label: "Cardiac", icon: "❤️" },
  { id: "neuro", label: "Neuro", icon: "🧠" },
  { id: "pulm", label: "Pulmonary", icon: "🫁" },
  { id: "endo", label: "Endocrine", icon: "🧪" },
  { id: "gi", label: "GI", icon: "🫃" },
  { id: "allergy", label: "Allergy/Immuno", icon: "⚠️" },
  { id: "ssti", label: "SSTI", icon: "🩹" },
  { id: "ent", label: "ENT/Airway", icon: "🔴" },
  { id: "ortho", label: "Ortho", icon: "🦴" },
];

const CSS_CONDITIONS = `
.cond-grid { display: flex; flex-direction: column; gap: 10px; }
.cond-card { background: var(--c1); border: 1px solid var(--br); border-radius: 14px; overflow: hidden; cursor: pointer; transition: all .18s; }
.cond-card:hover { border-color: var(--br2); background: var(--c2); }
.cond-card.open { border-color: var(--br2); }
.cond-header { display: flex; align-items: center; gap: 12px; padding: 13px 16px; }
.cond-icon { font-size: 22px; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.cond-title-wrap { flex: 1; min-width: 0; }
.cond-name { font-size: 14px; font-weight: 700; color: var(--tx); }
.cond-full { font-size: 11px; color: var(--tx2); margin-top: 2px; }
.cond-badges { display: flex; align-items: center; gap: 7px; flex-shrink: 0; }
.cond-urgency { font-size: 9px; font-weight: 800; letter-spacing: .08em; padding: 3px 8px; border-radius: 4px; border: 1px solid; }
.cond-tag { font-size: 10px; color: var(--tx3); background: var(--c3); padding: 3px 9px; border-radius: 4px; }
.cond-chevron { color: var(--tx3); font-size: 11px; transition: transform .15s; flex-shrink: 0; }
.cond-chevron.open { transform: rotate(180deg); }
.cond-body { border-top: 1px solid var(--br); padding: 14px 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.cond-section-title { font-size: 9px; letter-spacing: .1em; text-transform: uppercase; color: var(--tx3); margin-bottom: 8px; font-weight: 700; }
.cond-keypoints { display: flex; flex-direction: column; gap: 4px; }
.cond-kp { display: flex; gap: 7px; font-size: 11px; color: var(--tx2); line-height: 1.5; }
.cond-kp-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--teal); margin-top: 5px; flex-shrink: 0; }
.cond-med-table { width: 100%; border-collapse: collapse; }
.cond-med-table th { font-size: 9px; letter-spacing: .08em; text-transform: uppercase; color: var(--tx3); text-align: left; padding: 0 8px 5px; }
.cond-med-table td { padding: 5px 8px; border-top: 1px solid var(--br); font-size: 11px; vertical-align: top; }
.cond-med-name { font-weight: 700; color: var(--tx); }
.cond-med-dose { font-family: monospace; color: var(--teal); font-size: 11px; font-weight: 600; line-height: 1.4; }
.cond-med-timing { font-size: 10px; color: var(--yel); }
.cond-med-note { font-size: 10px; color: var(--tx3); margin-top: 2px; line-height: 1.4; }
.cond-full-row { grid-column: 1 / -1; }
.cond-workup-chips { display: flex; flex-wrap: wrap; gap: 5px; }
.cond-wu-chip { font-size: 10px; background: var(--c3); border: 1px solid var(--br); border-radius: 4px; padding: 3px 9px; color: var(--tx2); }
.cond-disposition { font-size: 11px; color: var(--tx2); background: rgba(0,196,160,0.06); border: 1px solid rgba(0,196,160,0.15); border-radius: var(--r); padding: 8px 12px; line-height: 1.6; }
.cond-refs { display: flex; flex-wrap: wrap; gap: 5px; }
.cond-ref { font-size: 9px; color: var(--tx3); background: var(--c3); border: 1px solid var(--br); border-radius: 3px; padding: 2px 7px; }
.cond-filter-bar { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 14px; }
.cond-filter-btn { padding: 5px 12px; border-radius: 20px; font-size: 11px; cursor: pointer; border: 1px solid var(--br); background: var(--c1); color: var(--tx2); transition: all .15s; font-family: var(--f); }
.cond-filter-btn:hover { border-color: var(--br2); color: var(--tx); }
.cond-filter-btn.active { background: var(--tdim); border-color: var(--br2); color: var(--teal); font-weight: 600; }
.cond-search { display: flex; align-items: center; gap: 8px; background: var(--c1); border: 1px solid var(--br); border-radius: var(--r); padding: 0 12px; margin-bottom: 12px; transition: border-color .15s; }
.cond-search:focus-within { border-color: var(--br2); }
.cond-search input { flex: 1; background: transparent; border: none; outline: none; color: var(--tx); font-size: 13px; padding: 9px 0; font-family: var(--f); }
.cond-search input::placeholder { color: var(--tx3); }
@media(max-width: 768px) { .cond-body { grid-template-columns: 1fr; } }
`;

import { useState, useMemo } from "react";

export default function ERConditions() {
  const [expandedId, setExpandedId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return ER_CONDITIONS.filter(c => {
      const matchCat = activeCategory === "all" || c.category === activeCategory;
      const q = search.toLowerCase();
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.fullName.toLowerCase().includes(q) || c.keyPoints.some(k => k.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [activeCategory, search]);

  return (
    <>
      <style>{CSS_CONDITIONS}</style>
      <div>
        <div className="sh" style={{ marginBottom: 12 }}>
          <div className="sh-l">
            <div className="sh-ico" style={{ background: "rgba(239,68,68,0.1)" }}>🏥</div>
            <span className="sh-ttl">ER DISEASES & CONDITIONS</span>
          </div>
          <span className="sh-m">Evidence-based · ACEP / AHA / IDSA · {filtered.length} conditions</span>
        </div>

        <div className="cond-search">
          <span style={{ color: "var(--tx3)", fontSize: 14 }}>🔍</span>
          <input
            placeholder="Search conditions, symptoms, medications..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <span onClick={() => setSearch("")} style={{ cursor: "pointer", color: "var(--tx3)", fontSize: 14 }}>✕</span>}
        </div>

        <div className="cond-filter-bar">
          {ER_CONDITION_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`cond-filter-btn ${activeCategory === cat.id ? "active" : ""}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        <div className="cond-grid">
          {filtered.length === 0 && (
            <div className="empty"><div className="empty-i">🔍</div><div className="empty-t">No conditions match your search</div></div>
          )}
          {filtered.map(cond => {
            const isOpen = expandedId === cond.id;
            const urgCfg = URGENCY_CONFIG[cond.urgency] || URGENCY_CONFIG.MODERATE;
            const catColor = CATEGORY_COLORS[cond.category] || "#00c4a0";
            return (
              <div key={cond.id} className={`cond-card ${isOpen ? "open" : ""}`} style={isOpen ? { borderColor: catColor + "44" } : {}}>
                <div className="cond-header" onClick={() => setExpandedId(isOpen ? null : cond.id)}>
                  <div className="cond-icon" style={{ background: catColor + "18" }}>
                    {cond.icon}
                  </div>
                  <div className="cond-title-wrap">
                    <div className="cond-name">{cond.name}</div>
                    <div className="cond-full">{cond.fullName}</div>
                  </div>
                  <div className="cond-badges">
                    <span className="cond-urgency" style={{ background: urgCfg.bg, color: urgCfg.color, borderColor: urgCfg.border }}>
                      {cond.urgency}
                    </span>
                    <span className="cond-tag">{cond.tag}</span>
                    <span className={`cond-chevron ${isOpen ? "open" : ""}`}>▼</span>
                  </div>
                </div>

                {isOpen && (
                  <div className="cond-body">
                    {/* Key Points */}
                    <div>
                      <div className="cond-section-title">⚡ Key Clinical Points</div>
                      <div className="cond-keypoints">
                        {cond.keyPoints.map((kp, i) => (
                          <div key={i} className="cond-kp">
                            <div className="cond-kp-dot" style={{ background: catColor }} />
                            <span>{kp}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Workup */}
                    <div>
                      <div className="cond-section-title">🔬 Workup / Investigations</div>
                      <div className="cond-workup-chips">
                        {cond.workup.map((w, i) => (
                          <span key={i} className="cond-wu-chip">{w}</span>
                        ))}
                      </div>
                    </div>

                    {/* Medications — full row */}
                    <div className="cond-full-row">
                      <div className="cond-section-title">💊 Medications & Dosing</div>
                      <table className="cond-med-table">
                        <thead>
                          <tr>
                            <th>MEDICATION</th>
                            <th>DOSE</th>
                            <th>TIMING</th>
                            <th>NOTES</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cond.medications.map((med, i) => (
                            <tr key={i}>
                              <td><div className="cond-med-name">{med.name}</div></td>
                              <td><div className="cond-med-dose">{med.dose}</div></td>
                              <td><div className="cond-med-timing">{med.timing}</div></td>
                              <td><div className="cond-med-note">{med.note}</div></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Disposition */}
                    <div className="cond-full-row">
                      <div className="cond-section-title">🏥 Disposition</div>
                      <div className="cond-disposition">{cond.disposition}</div>
                    </div>

                    {/* References */}
                    <div className="cond-full-row">
                      <div className="cond-section-title">📚 References</div>
                      <div className="cond-refs">
                        {cond.refs.map((r, i) => (
                          <span key={i} className="cond-ref">{r}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}