import { useState } from "react";
import { useNavigate } from "react-router-dom";

const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36", up:"#0e2544",
  b:"rgba(26,53,85,0.8)", bhi:"rgba(42,79,122,0.9)",
  txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  coral:"#ff6b6b", gold:"#f5c842", teal:"#00e5c0", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", cyan:"#00d4ff",
  pink:"#ff6b9d",
};

const CONDITIONS = [
  { id:"pals_arrest",   icon:"🫀", title:"Pediatric Cardiac Arrest", sub:"PALS · CPR · Epinephrine",            cat:"PALS",      color:T.coral,  gl:"rgba(255,107,107,0.1)",  br:"rgba(255,107,107,0.4)" },
  { id:"pals_brady",    icon:"💔", title:"Pediatric Bradycardia",    sub:"Symptomatic · Atropine · Pacing",      cat:"PALS",      color:T.blue,   gl:"rgba(59,158,255,0.1)",   br:"rgba(59,158,255,0.4)"  },
  { id:"pals_tachy",    icon:"⚡", title:"Pediatric Tachycardia",     sub:"SVT · VT · Adenosine · Cardioversion", cat:"PALS",      color:T.orange, gl:"rgba(255,159,67,0.1)",   br:"rgba(255,159,67,0.4)"  },
  { id:"septic_shock",  icon:"🦠", title:"Pediatric Septic Shock",   sub:"Warm/Cold Shock · Fluid · Pressors",   cat:"Critical",  color:T.gold,   gl:"rgba(245,200,66,0.1)",   br:"rgba(245,200,66,0.4)"  },
  { id:"status_epi",    icon:"🧠", title:"Status Epilepticus",       sub:"Seizure Ladder · BZD · Levetiracetam",  cat:"Neuro",     color:T.purple, gl:"rgba(155,109,255,0.1)",  br:"rgba(155,109,255,0.4)" },
  { id:"croup",         icon:"🌬️", title:"Croup",                    sub:"Steeple Sign · Racemic Epi · Dex",     cat:"Airway",    color:T.teal,   gl:"rgba(0,229,192,0.1)",    br:"rgba(0,229,192,0.4)"   },
  { id:"bronchiolitis", icon:"🫁", title:"Bronchiolitis",             sub:"RSV · O₂ · Nasal Suctioning",          cat:"Airway",    color:T.cyan,   gl:"rgba(0,212,255,0.1)",    br:"rgba(0,212,255,0.4)"   },
  { id:"anaphylaxis",   icon:"💉", title:"Pediatric Anaphylaxis",    sub:"Epinephrine IM · Diphenhydramine",      cat:"Critical",  color:T.pink,   gl:"rgba(255,107,157,0.1)",  br:"rgba(255,107,157,0.4)" },
  { id:"dka_peds",      icon:"🩸", title:"Pediatric DKA",            sub:"2-Bag Method · Cerebral Edema",         cat:"Metabolic", color:T.green,  gl:"rgba(61,255,160,0.1)",   br:"rgba(61,255,160,0.4)"  },
  { id:"intussus",      icon:"🔄", title:"Intussusception",          sub:"Currant Jelly · Air Enema Reduction",   cat:"Surgical",  color:T.orange, gl:"rgba(255,159,67,0.1)",   br:"rgba(255,159,67,0.4)"  },
];

const CATS = ["PALS","Critical","Neuro","Airway","Metabolic","Surgical"];

const BANNER = [
  { label:"Epinephrine Dose",   value:"0.01 mg/kg",   sub:"Cardiac arrest / anaphylaxis", color:T.coral },
  { label:"Atropine Min Dose",  value:"0.1 mg",        sub:"Minimum to avoid paradoxical brady", color:T.blue },
  { label:"Fluid Bolus",        value:"10–20 mL/kg",   sub:"Septic shock — reassess after each", color:T.gold },
  { label:"Adenosine SVT",      value:"0.1 mg/kg",     sub:"Max 6 mg first dose; 0.2 mg/kg second", color:T.teal },
];

const DATA = {
  pals_arrest: {
    overview: {
      def: "Pediatric cardiac arrest follows the same PALS algorithm as adults but with critical weight-based dosing differences. The most common rhythms in children are asystole and PEA (often from respiratory failure or shock) rather than VF/pVT. High-quality CPR with minimal interruptions is the single most important intervention. Target compression rate 100–120/min, depth 1/3 AP diameter (~4 cm infant, ~5 cm child).",
      bullets: [
        "Most pediatric arrests are respiratory in origin — optimize airway FIRST",
        "Compression-to-ventilation ratio: 30:2 (1 rescuer) or 15:2 (2 rescuer with advanced airway)",
        "Epinephrine 0.01 mg/kg (0.1 mL/kg of 0.1 mg/mL) IV/IO q3–5 min — no max dose",
        "Shockable (VF/pVT): defibrillate 2 J/kg → CPR 2 min → 4 J/kg → CPR 2 min → 4–10 J/kg",
        "IO access: preferred if IV cannot be established within 2 min — tibia, humeral head",
        "Reversible causes (Hs & Ts): Hypoxia, Hypovolemia, Hypo/Hyperkalemia, Hypothermia, Tension PTX, Tamponade, Toxins, Thrombosis",
      ]
    },
    workup: [
      { icon:"📊", label:"Continuous waveform capnography", detail:"ETCO₂ <10 mmHg = inadequate CPR or confirm arrest. ETCO₂ >35 mmHg = likely ROSC. Use to guide CPR quality in intubated patient." },
      { icon:"💉", label:"Glucose (POC) — STAT", detail:"Hypoglycemia is a common and reversible cause of pediatric arrest. Check immediately. Treat with D10W 5 mL/kg or D25W 2 mL/kg." },
      { icon:"🧪", label:"Blood Gas + Electrolytes (IO/IV)", detail:"pH, K+, Na+, Ca²⁺, glucose. Hyperkalemia and hypocalcemia are reversible arrest causes. Ionized calcium may be low in sepsis-related arrest." },
      { icon:"🫀", label:"Rhythm check q2 min", detail:"Pause CPR briefly for rhythm assessment. Limit interruptions to <10 seconds. Shockable: VF/pVT → shock. Non-shockable: asystole/PEA → CPR + epinephrine." },
      { icon:"🔬", label:"Bedside POCUS (if ROSC)", detail:"Cardiac function, pneumothorax, pericardial effusion (tamponade), hypovolemia. Do not delay CPR for ultrasound." },
    ],
    treatment: [
      { cat:"🅐 First-Line", drug:"Epinephrine (1:10,000)", dose:"0.01 mg/kg IV/IO q3–5 min (= 0.1 mL/kg of 0.1 mg/mL solution); max single dose 1 mg; follow each dose with 5–10 mL NS flush", renal:"No adjustment", ivpo:"IV / IO", deesc:"Give as soon as IV/IO access established. For non-shockable rhythms: give with first cycle. For shockable: give after second shock.", note:"CONCENTRATION CRITICAL: use 0.1 mg/mL (1:10,000) for IV/IO — NOT 1:1000 (10× more concentrated, causes hypertension/MI). Double-check preparation.", ref:"AHA PALS 2020" },
      { cat:"🅐 Shockable", drug:"Defibrillation", dose:"First shock: 2 J/kg → 4 J/kg → 4–10 J/kg; maximum 10 J/kg or adult dose (360 J monophasic / 200 J biphasic)", renal:"N/A", ivpo:"External", deesc:"Resume CPR immediately after each shock without rhythm check. Check rhythm after 2 min CPR cycle. Use pediatric pads/attenuator for <10 kg.", note:"Self-adhesive pads preferred over paddles. Anterior-posterior positioning if small chest. Minimum 5 seconds between CPR cessation and shock delivery.", ref:"AHA PALS 2020" },
      { cat:"🅑 Antiarrhythmic", drug:"Amiodarone", dose:"5 mg/kg IV/IO bolus over 20–60 min; may repeat × 2 (max 15 mg/kg/day); for refractory VF/pVT", renal:"No adjustment", ivpo:"IV / IO", deesc:"Give during CPR — do not delay defibrillation for amiodarone. Lidocaine 1 mg/kg IV/IO is alternative.", note:"Monitor for hypotension and bradycardia post-ROSC. QTc prolongation expected.", ref:"AHA PALS 2020" },
      { cat:"🅒 Reversible", drug:"Calcium Gluconate / Calcium Chloride", dose:"Calcium gluconate: 60 mg/kg IV/IO (0.6 mL/kg of 10% solution). Calcium chloride: 20 mg/kg IV/IO for arrest from hyperkalemia/hypocalcemia", renal:"No adjustment", ivpo:"IV / IO (central line preferred for CaCl₂)", deesc:"Indicated: documented hypocalcemia, hyperkalemia, Ca-channel blocker OD, hypermagnesemia. Not routine for all arrest.", note:"Calcium chloride has 3× more elemental Ca than gluconate. Give slowly if not in arrest — rapid infusion causes bradycardia.", ref:"PALS / Goldfrank's" },
    ],
    followup: [
      "Post-ROSC: target SpO₂ 94–99%, avoid hyperoxia (100% O₂) — wean FiO₂",
      "Targeted temperature management (TTM) 32–36°C for 24h if remains comatose post-ROSC (controversial in peds — consult PICU)",
      "Glucose management: maintain BG 80–180 mg/dL; avoid hypoglycemia and hyperglycemia",
      "Blood pressure: target MAP at or above 5th percentile for age",
      "Neurology consult: EEG within 6h of ROSC for seizure monitoring",
      "Family communication and social work support immediately after resuscitation",
    ]
  },
  pals_brady: {
    overview: {
      def: "Symptomatic bradycardia in children is most commonly from HYPOXIA — treat the airway FIRST before giving any drugs. Bradycardia is defined as HR causing hemodynamic compromise (poor perfusion, altered mental status, hypotension), not just a low number. Vagally-mediated bradycardia (during intubation, suctioning) is common and typically self-limited.",
      bullets: [
        "AIRWAY FIRST: most pediatric bradycardia resolves with oxygenation and ventilation",
        "Symptomatic = poor perfusion + altered mental status + hypotension despite oxygenation",
        "Atropine: 0.02 mg/kg IV/IO — minimum 0.1 mg (to prevent paradoxical bradycardia); max 0.5 mg child, 1 mg adolescent",
        "Epinephrine preferred over dopamine for hemodynamically unstable bradycardia",
        "Consider transcutaneous pacing for complete heart block or post-cardiac surgery bradycardia",
        "AV block: assess for digoxin toxicity, Lyme disease, myocarditis, post-cardiac surgery",
      ]
    },
    workup: [
      { icon:"🫀", label:"12-lead ECG", detail:"P wave morphology, PR interval, AV block degree. Congenital vs acquired AV block. Delta wave (WPW)." },
      { icon:"🧪", label:"Electrolytes — K+, Ca²⁺, Glucose", detail:"Hyperkalemia, hypoglycemia, hypocalcemia all cause bradycardia. Check and replace immediately." },
      { icon:"💊", label:"Medication/Toxin Review", detail:"Digoxin, beta-blockers, calcium channel blockers, alpha-2 agonists (clonidine). Check levels if indicated." },
      { icon:"🔬", label:"Lyme Serology (endemic area)", detail:"Lyme carditis: 3rd-degree AV block in endemic area child. Doxycycline ± ceftriaxone. Often needs temporary pacing." },
      { icon:"🫁", label:"SpO₂ + Capnography", detail:"Confirm oxygenation and ventilation adequate BEFORE drug therapy. Hypoxia is #1 cause." },
    ],
    treatment: [
      { cat:"🅐 First-Line", drug:"Oxygen + Ventilation", dose:"100% O₂ via NRB. BVM ventilation if inadequate respiratory effort. Intubate if airway cannot be maintained.", renal:"N/A", ivpo:"Inhalation", deesc:"If bradycardia resolves with oxygenation alone — no further intervention needed. Do NOT rush to drugs.", note:"Vagally-mediated bradycardia (suctioning, intubation): brief, self-limited. Support oxygenation. Atropine 0.02 mg/kg premedication before intubation in infants <1 year.", ref:"AHA PALS 2020" },
      { cat:"🅐 Antidote", drug:"Atropine", dose:"0.02 mg/kg IV/IO; minimum dose 0.1 mg (CRITICAL — below 0.1 mg causes paradoxical bradycardia); maximum 0.5 mg child / 1.0 mg adolescent; may repeat × 1", renal:"No adjustment", ivpo:"IV / IO / ET (2–3× IV dose)", deesc:"For vagal-mediated or AV nodal bradycardia. Ineffective for denervated hearts (post-transplant).", note:"MINIMUM DOSE 0.1 mg is a PALS hard rule — subthreshold doses stimulate pre-junctional M1 muscarinic receptors → paradoxical heart rate decrease. Always calculate AND check against minimum.", ref:"AHA PALS 2020" },
      { cat:"🅑 Vasopressor", drug:"Epinephrine Infusion", dose:"0.1–1 mcg/kg/min IV/IO infusion (titrate to HR and perfusion); mix: weight (kg) × 0.3 mg in 50 mL NS = 1 mL/hr delivers 0.1 mcg/kg/min", renal:"No adjustment", ivpo:"IV / IO infusion", deesc:"Preferred over dopamine for hemodynamically significant bradycardia refractory to atropine. Titrate to response.", note:"Use rule-of-6 or standard concentration per institution. Verify pump programming carefully — 10× dosing errors are a documented risk.", ref:"AHA PALS 2020" },
    ],
    followup: [
      "Cardiology consult for persistent AV block, structural disease, or post-surgical bradycardia",
      "Holter monitor if intermittent symptomatic bradycardia",
      "Lyme carditis: doxycycline (>8yo) or amoxicillin (<8yo) ± temporary pacing for 3rd degree AV block",
      "Digoxin toxicity: digoxin immune Fab (DigiFab) 1–2 vials IV for symptomatic bradycardia",
    ]
  },
  pals_tachy: {
    overview: {
      def: "Pediatric tachycardia is categorized as narrow-complex (QRS <0.09s) vs wide-complex, and stable vs unstable. SVT is the most common dysrhythmia in children — retrograde P waves, HR often >220/min (infant) or >180/min (child). Sinus tachycardia has identifiable P waves and HR typically <220/min. Wide-complex VT in children is uncommon and often associated with structural heart disease or toxin.",
      bullets: [
        "SVT vs sinus tach: SVT HR often >220/min infant, abrupt onset/offset, no identifiable P waves",
        "Vagal maneuvers first for stable SVT: ice-to-face (infants), Valsalva, carotid massage (not children)",
        "Adenosine: 0.1 mg/kg rapid IV push → flush (max 6 mg first dose; 0.2 mg/kg second dose, max 12 mg)",
        "Unstable SVT/VT with pulse: synchronized cardioversion 0.5–1 J/kg → 2 J/kg",
        "WPW: avoid AV nodal agents (adenosine, digoxin, verapamil) — may accelerate pre-excitation",
        "Verapamil CONTRAINDICATED in infants <1 year — severe cardiovascular collapse risk",
      ]
    },
    workup: [
      { icon:"🫀", label:"12-lead ECG", detail:"P wave axis, PR interval, QRS duration, delta wave (WPW), retrograde P waves (SVT), AV dissociation (VT)." },
      { icon:"📊", label:"Continuous ECG Monitoring", detail:"Rhythm strip during vagal maneuvers and adenosine administration. Document response (abrupt termination = SVT; transient slowing = sinus tach)." },
      { icon:"🧪", label:"Electrolytes + Glucose", detail:"Hypokalemia/hypomagnesemia lower VT threshold. Hypoglycemia in infants. Check and replace." },
      { icon:"💊", label:"Medication/Toxin Screen", detail:"Stimulants (amphetamines, caffeine), digoxin, sympathomimetics. Obtain medication history." },
      { icon:"🫀", label:"Echo (if structural disease suspected)", detail:"Ebstein's anomaly, HCM, ALCAPA, myocarditis. Bedside POCUS to assess systolic function." },
    ],
    treatment: [
      { cat:"🅐 Vagal", drug:"Vagal Maneuvers", dose:"Infants: ice bag to face 15–30 sec (dive reflex). Children: Valsalva (blow through straw). Modified Valsalva (supine leg raise) in older children.", renal:"N/A", ivpo:"Non-pharmacological", deesc:"Try FIRST for all stable SVT. Success rate ~25–50%. Safe. No IV needed.", note:"Carotid massage NOT recommended in children. Ocular pressure NOT recommended (risk of retinal detachment).", ref:"AHA PALS 2020" },
      { cat:"🅐 Antiarrhythmic", drug:"Adenosine", dose:"0.1 mg/kg IV RAPID push (max 6 mg); flush immediately with 5–10 mL NS. If no response after 2 min: 0.2 mg/kg (max 12 mg). Use antecubital or central vein — most proximal IV available", renal:"No adjustment", ivpo:"IV (most proximal site, RAPID push)", deesc:"Works by transiently blocking AV node → terminating re-entry circuit. Must be given as a bolus (half-life 10 sec). May cause brief asystole 3–15 sec — warn family.", note:"Theophylline/caffeine BLOCK adenosine effect — may need higher dose. Dipyridamole POTENTIATES — reduce dose. Transient flushing, dyspnea, chest pain are expected.", ref:"AHA PALS 2020" },
      { cat:"🅑 Cardioversion", drug:"Synchronized Cardioversion (Unstable)", dose:"0.5–1 J/kg; if no conversion: 2 J/kg; sedate first if conscious (ketamine 1–2 mg/kg or midazolam 0.1 mg/kg)", renal:"N/A", ivpo:"External", deesc:"Synchronized mode CRITICAL — unsynchronized shock on T-wave → VF. Confirm 'SYNC' mode active on defibrillator before delivery.", note:"If hemodynamically unstable (poor perfusion, altered mental status) → cardiovert IMMEDIATELY without waiting for adenosine.", ref:"AHA PALS 2020" },
      { cat:"🅒 Antiarrhythmic", drug:"Amiodarone (Wide-complex VT)", dose:"5 mg/kg IV/IO over 20–60 min; may repeat × 2; max 15 mg/kg/day. For hemodynamically STABLE wide-complex VT only — if unstable, cardiovert.", renal:"No adjustment", ivpo:"IV / IO (slow infusion)", deesc:"Monitor for hypotension and QTc prolongation. Procainamide 15 mg/kg IV over 30–60 min is alternative for stable VT.", note:"Do NOT give amiodarone + procainamide together — additive QTc prolongation and hypotension risk.", ref:"AHA PALS 2020" },
    ],
    followup: [
      "Cardiology follow-up within 24–48h for all SVT — risk stratification, consider ablation",
      "WPW: elective EPS + ablation; counsel on SCA risk with strenuous exercise",
      "Parents: teach vagal maneuvers at home (ice-to-face for infants)",
      "Holter or event monitor for recurrent or poorly documented episodes",
      "Avoid caffeine and stimulants in structurally normal SVT",
    ]
  },
  septic_shock: {
    overview: {
      def: "Pediatric septic shock is time-critical. Early recognition and bundle adherence reduces mortality. WARM shock (vasodilatory) = warm extremities, bounding pulses, widened pulse pressure — treat with norepinephrine. COLD shock (cardiogenic/vasoconstrictive) = cool mottled extremities, thready pulses, narrow pulse pressure — treat with epinephrine or dopamine. Fluid resuscitation: 10–20 mL/kg boluses, reassess after each — goal-directed therapy.",
      bullets: [
        "SIRS criteria in children: abnormal WBC OR fever/hypothermia + tachycardia OR bradycardia (infants)",
        "Septic shock: SIRS + suspected infection + cardiovascular dysfunction (fluid unresponsive hypotension or need for vasoactive)",
        "First hour bundle: IV/IO access → fluids 10–20 mL/kg × 3 PRN → blood cultures → antibiotics within 1h",
        "Fluid responsive vs fluid refractory: reassess after each 10 mL/kg — stop at 60 mL/kg if no improvement",
        "Corticosteroids for adrenal insufficiency or steroid-dependent patient — NOT routine in all septic shock",
        "Target: CRT ≤2 sec, urine output >1 mL/kg/hr, MAP >5th percentile for age, mental status normal",
      ]
    },
    workup: [
      { icon:"🩸", label:"Blood Cultures × 2 (before antibiotics)", detail:"Two sets if possible — do not delay antibiotics >45 min for cultures. Central and peripheral if CVC present." },
      { icon:"🔬", label:"CBC + CMP + Lactate + CRP/PCT", detail:"Lactate >2 mmol/L = tissue hypoperfusion. Serial lactate q2h to assess response. Thrombocytopenia + coagulopathy = DIC." },
      { icon:"🫀", label:"Bedside ECHO", detail:"Cardiac function assessment — guides vasopressor selection. Cold shock: impaired LV function → epinephrine. Warm shock: vasodilation → norepinephrine." },
      { icon:"🧪", label:"Cortisol Level (if suspected AI)", detail:"Before steroid administration if time permits. Random cortisol <18 mcg/dL in critically ill = relative AI. Do not delay treatment for result." },
      { icon:"🦠", label:"Source Identification", detail:"CXR, UA/urine culture, LP (if CNS source suspected and safe), wound culture, joint fluid if arthritis suspected." },
    ],
    treatment: [
      { cat:"🅐 Fluid", drug:"Normal Saline (Isotonic Crystalloid)", dose:"10–20 mL/kg IV/IO over 5–10 min; reassess after each bolus; maximum typically 40–60 mL/kg in first hour; STOP if pulmonary edema or hepatomegaly develops", renal:"Monitor urine output; caution with AKI", ivpo:"IV / IO", deesc:"Balanced crystalloids (LR) may be preferred over NS for large volume resuscitation (hyperchloremic acidosis risk with NS). Reassess CRT, HR, BP, mental status after each bolus.", note:"FEAST trial: aggressive fluid bolus in sub-Saharan African children INCREASED mortality. Context matters — reassess after each bolus. Albumin 5% may be used for albumin <2 g/dL.", ref:"SSC Pediatric Guidelines 2020" },
      { cat:"🅐 Vasopressor", drug:"Epinephrine (Cold Shock)", dose:"0.05–0.3 mcg/kg/min IV/IO infusion; titrate to MAP >5th percentile for age and CRT ≤2 sec", renal:"No adjustment", ivpo:"IV / IO (central preferred)", deesc:"Cold shock (impaired cardiac output, poor LV function): epinephrine preferred (inotropy + chronotropy). Start after 2nd fluid bolus if still hypoperfused.", note:"Rule of 6: weight (kg) × 0.6 mg in 100 mL NS = 1 mL/hr delivers 0.1 mcg/kg/min. Verify per institution concentration standards.", ref:"SCCM / AHA" },
      { cat:"🅐 Vasopressor", drug:"Norepinephrine (Warm Shock)", dose:"0.05–0.3 mcg/kg/min IV/IO infusion; titrate to MAP target", renal:"No adjustment", ivpo:"IV / IO (central preferred)", deesc:"Warm shock (vasodilatory, bounding pulses): norepinephrine preferred (vasoconstriction). Add vasopressin 0.03–0.04 units/kg/hr as adjunct if refractory.", note:"Dopamine 5–20 mcg/kg/min is alternative if epinephrine/NE unavailable — less preferred due to adverse effects (tachycardia, immunosuppression).", ref:"SCCM / AHA" },
      { cat:"🅑 Antibiotics", drug:"Broad-Spectrum Empiric Coverage", dose:"Ceftriaxone 100 mg/kg IV q24h (max 2g; 4g for meningitis) + Vancomycin 15 mg/kg IV q6h (target AUC 400–600) for MRSA coverage. Add metronidazole if abdominal source.", renal:"Adjust vancomycin for AKI", ivpo:"IV", deesc:"Narrow coverage based on culture results within 48–72h. Antifungals if immunocompromised or prolonged ICU.", note:"Goal: first dose within 1 hour of sepsis recognition. Neonates: ampicillin + gentamicin (covers GBS/Listeria). Immunocompromised: antipseudomonal coverage (pip-tazo or cefepime).", ref:"SSC 2020 / IDSA" },
      { cat:"🅒 Steroids", drug:"Hydrocortisone (Adrenal Insufficiency)", dose:"Stress dose: 1–2 mg/kg IV q6h (max 50 mg/dose). Septic shock + steroid-dependent: 50 mg/m² /day divided q6–8h", renal:"No adjustment", ivpo:"IV", deesc:"NOT routine for all pediatric septic shock. Indicated: adrenal insufficiency, steroid-dependent patients, catecholamine-refractory shock.", note:"Random cortisol <18 mcg/dL OR no response to ACTH stimulation test = relative adrenal insufficiency. Empiric hydrocortisone acceptable in extremis.", ref:"SSC Peds 2020" },
    ],
    followup: [
      "PICU admission for all pediatric septic shock — minimum 24h continuous monitoring",
      "Daily assessment of antibiotic de-escalation (culture results, clinical improvement)",
      "Vasopressor wean: taper slowly when MAP stable >12h — abrupt wean causes rebound hypotension",
      "Nutritional support: enteral nutrition within 24–48h of PICU admission",
      "DVT prophylaxis: sequential compression devices; pharmacological in older adolescents",
      "Family conference within 24h: diagnosis, expected course, shared decision-making",
    ]
  },
  status_epi: {
    overview: {
      def: "Pediatric status epilepticus (SE): continuous seizure >5 min OR ≥2 seizures without return to baseline. Treat along a time-based escalation ladder. The earlier the intervention, the higher the success rate. After 30 min without treatment, SE becomes pharmacologically refractory. Benzodiazepines are first-line at any stage.",
      bullets: [
        "Phase 1 (0–5 min): stabilize, airway, O₂, glucose, IV/IO access",
        "Phase 2 (5–20 min): BZD × 2 doses (lorazepam 0.1 mg/kg IV OR midazolam 0.2 mg/kg IM/IN)",
        "Phase 3 (20–40 min): 2nd-line agent — levetiracetam 60 mg/kg IV OR valproate 40 mg/kg IV OR fosphenytoin 20 mg/kg IV",
        "Phase 4 (40–60 min): refractory SE — intubation + propofol infusion OR phenobarbital 20 mg/kg IV",
        "Always check glucose — hypoglycemia causes seizures and is easily reversed",
        "Fever alone is not a trigger for aggressive treatment — febrile seizures are generally benign if <15 min",
      ]
    },
    workup: [
      { icon:"🩸", label:"POC Glucose — STAT", detail:"Hypoglycemia is a common, reversible cause of pediatric seizure. Treat BG <60 mg/dL with D10W 2–4 mL/kg. Thiamine 100 mg IV before glucose in at-risk adolescents." },
      { icon:"🧪", label:"BMP + Calcium + Magnesium", detail:"Hyponatremia (water intoxication), hypocalcemia, hypomagnesemia all cause seizures. Critical electrolytes." },
      { icon:"🧠", label:"CT Head (if focal, new onset, or post-traumatic)", detail:"Rule out hemorrhage, mass, herniation. LP AFTER CT if meningitis suspected. Do NOT delay BZD for CT." },
      { icon:"🔬", label:"Antiepileptic Drug Levels", detail:"Subtherapeutic levels in known epileptic is a common cause — check phenytoin, valproate, levetiracetam, carbamazepine levels." },
      { icon:"📊", label:"Continuous EEG (if refractory or post-intubation)", detail:"Non-convulsive SE is common after motor activity ceases — EEG mandatory if no improvement after treatment. 30% of refractory SE is non-convulsive." },
    ],
    treatment: [
      { cat:"🅐 First-Line", drug:"Lorazepam", dose:"0.1 mg/kg IV/IO (max 4 mg); may repeat × 1 after 5 min if no response; give over 1–2 min", renal:"No adjustment", ivpo:"IV / IO", deesc:"First-line for SE when IV access available. Onset 1–3 min. Duration 12–24h (long-acting compared to diazepam).", note:"If no IV: midazolam 0.2 mg/kg IM or 0.3 mg/kg IN (max 10 mg) is equivalent and widely studied. Intranasal: use MAD atomizer.", ref:"AES / ESETT 2019" },
      { cat:"🅐 First-Line (No IV)", drug:"Midazolam IM / Intranasal", dose:"IM: 0.2 mg/kg IM (max 10 mg). Intranasal: 0.3 mg/kg (max 10 mg divided between nostrils)", renal:"No adjustment", ivpo:"IM / IN", deesc:"Equivalent to IV lorazepam for out-of-hospital or no-IV scenarios (RAMPART trial). Faster delivery than IV establishment.", note:"RAMPART trial: IM midazolam superior to IV lorazepam for field seizure cessation. IN midazolam well studied in pediatrics. Use atomizer for IN delivery.", ref:"RAMPART NEJM 2012" },
      { cat:"🅑 Second-Line", drug:"Levetiracetam (Keppra)", dose:"60 mg/kg IV over 10 min (max 4500 mg); preferred second-line at most centers", renal:"Reduce dose in renal failure", ivpo:"IV / IO", deesc:"Non-inferior to valproate and fosphenytoin with better safety profile (no cardiac monitoring required, no hepatotoxicity). Give if BZD fails.", note:"ECLIPSE/ConSEPT trials: levetiracetam comparable to phenytoin with fewer adverse effects. Now preferred second-line at most children's hospitals.", ref:"ConSEPT NEJM 2019" },
      { cat:"🅑 Second-Line", drug:"Valproic Acid (Depakene IV)", dose:"40 mg/kg IV over 10 min (max 3000 mg); alternative to levetiracetam", renal:"No adjustment; avoid in mitochondrial disease", ivpo:"IV", deesc:"Effective for broad-spectrum SE including absence and myoclonic. AVOID in: suspected mitochondrial disease, liver disease, age <2 (hepatotoxicity risk), suspected urea cycle defect.", note:"Ammonia elevation possible — check baseline if prolonged use. Broad-spectrum anticonvulsant, may be preferred for known generalized epilepsy.", ref:"ConSEPT / Epilepsy Society" },
      { cat:"🅒 Refractory", drug:"Phenobarbital + Intubation", dose:"20 mg/kg IV at ≤1 mg/kg/min (max 1g); may follow with 5–10 mg/kg boluses q20 min up to total 40 mg/kg; RSI and intubation for airway protection", renal:"Reduce in renal failure", ivpo:"IV", deesc:"Propofol infusion 1–4 mg/kg/hr after intubation for refractory SE. Continuous midazolam infusion 0.1–2 mg/kg/hr as alternative.", note:"Refractory SE > 60 min: ICU admission mandatory, continuous EEG, ketamine infusion or burst suppression with pentobarbital/propofol for super-refractory SE.", ref:"AES Guidelines" },
    ],
    followup: [
      "Neurology consult for all SE requiring ≥2 medications or with unknown etiology",
      "MRI brain (preferred over CT) within 24h for new-onset SE or focal features",
      "Antiepileptic drug optimization with neurology before discharge",
      "Seizure action plan provided to family — when to call 911, rescue medication instructions",
      "Rescue medication: prescribe rectal diazepam or nasal midazolam for home use",
      "School nurse notification and seizure first-aid training for teachers",
    ]
  },
  croup: {
    overview: {
      def: "Croup (laryngotracheobronchitis) is the most common cause of acute upper airway obstruction in children 6 months–3 years. Caused most commonly by parainfluenza virus. Subglottic inflammation causes the characteristic barky cough, inspiratory stridor, and hoarse voice. Severity ranges from mild (stridor at rest) to severe (tripoding, cyanosis). Corticosteroids are the cornerstone of treatment at all severity levels.",
      bullets: [
        "Classic presentation: barky 'seal-like' cough, inspiratory stridor, hoarse voice, low-grade fever",
        "Steeple sign on AP neck X-ray: subglottic narrowing — NOT required for diagnosis",
        "Differentiate from epiglottitis: epiglottitis has sudden onset, toxic appearance, drooling, thumb sign on lateral neck X-ray",
        "Dexamethasone 0.6 mg/kg PO/IM × 1 dose: effective for all severity levels",
        "Racemic epinephrine for moderate-severe: 0.5 mL of 2.25% in 3 mL NS nebulized",
        "Observe 2–4h post-racemic epi for rebound stridor before discharge",
      ]
    },
    workup: [
      { icon:"👀", label:"Clinical Assessment (Westley Score)", detail:"Stridor (0–2), chest wall retractions (0–3), air entry (0–2), cyanosis (0–4), LOC (0–5). Score ≤2 = mild; 3–5 = moderate; >6 = severe." },
      { icon:"📸", label:"AP Neck X-ray (if diagnosis unclear)", detail:"Steeple sign = subglottic narrowing. Lateral neck X-ray: thumb sign (enlarged epiglottis) = epiglottitis emergency. NOT required for classic croup." },
      { icon:"🌡️", label:"Pulse Oximetry + SpO₂", detail:"Hypoxia (SpO₂ <92%) = severe croup — requires PICU and likely nebulized epinephrine + heliox consideration." },
      { icon:"🫁", label:"Differentiate from Epiglottitis", detail:"Epiglottitis: toxic appearance, high fever, drooling, muffled voice, reluctance to move neck. If suspected — ENT and anesthesia STAT, do NOT examine throat without controlled airway." },
    ],
    treatment: [
      { cat:"🅐 All Severity", drug:"Dexamethasone", dose:"0.6 mg/kg PO/IM × 1 dose (max 16 mg); onset 1–2h; duration 72h. Mild croup: 0.15 mg/kg PO equally effective per some data.", renal:"No adjustment", ivpo:"PO (preferred) / IM / IV", deesc:"Single dose is sufficient — no benefit from repeated dosing. PO dexamethasone suspension (1 mg/mL) is well absorbed. Budesonide 2 mg nebulized is equivalent alternative.", note:"Dexamethasone 0.6 mg/kg is the PALS standard dose. Some centers use 0.15–0.3 mg/kg for mild croup with equal evidence. Higher dose associated with less vomiting and single-dose sufficiency.", ref:"Cochrane / Pediatrics 2018" },
      { cat:"🅐 Moderate-Severe", drug:"Racemic Epinephrine", dose:"0.5 mL of 2.25% racemic epinephrine in 3 mL NS nebulized; OR L-epinephrine 5 mL of 1:1000 (equivalent, less expensive)", renal:"N/A", ivpo:"Nebulized", deesc:"OBSERVE 2–4h post-administration before discharge — rebound stridor possible. If stridor returns after observation, re-administer and admit.", note:"Racemic epinephrine = 50:50 mixture of D/L isomers. L-epinephrine (standard 1:1000) is equally effective at 5 mL dose. Mechanism: mucosal vasoconstriction reduces subglottic edema.", ref:"NEJM Croup Review" },
      { cat:"🅑 Severe", drug:"Heliox (Helium-Oxygen)", dose:"70% helium / 30% oxygen mixture via NRB or face mask — reduces turbulent flow in narrowed subglottis", renal:"N/A", ivpo:"Inhaled", deesc:"Temporizing measure while epinephrine and steroids take effect. SpO₂ can be maintained with 70:30 heliox in most patients. Switch to higher O₂ if SpO₂ <92%.", note:"Heliox reduces airway resistance proportional to gas density — most effective in turbulent (high-velocity) flow states. Limited by O₂ fraction constraint.", ref:"Cochrane Heliox Croup" },
    ],
    followup: [
      "Mild croup (Westley ≤2): discharge with dexamethasone, return precautions (stridor at rest, cyanosis, drooling)",
      "Moderate croup: observe 2–4h after dexamethasone ± racemic epi; admit if persistent stridor at rest",
      "Severe croup: PICU admission; ENT on standby for surgical airway if needed",
      "Recurrent croup: consider subglottic stenosis or airway anomaly — ENT follow-up with airway scope",
      "Return precautions: worsening stridor, respiratory distress, drooling, change in voice quality",
    ]
  },
  bronchiolitis: {
    overview: {
      def: "Bronchiolitis is the most common lower respiratory tract infection in infants <2 years, most commonly caused by RSV (respiratory syncytial virus). Inflammation and edema of small airways causes expiratory obstruction, air trapping, and ventilation-perfusion mismatch. Management is supportive — nasal suctioning and oxygen are the only proven interventions. Bronchodilators, steroids, and antibiotics are NOT recommended by AAP guidelines.",
      bullets: [
        "Peak age: 2–6 months; RSV most common cause (50–80%); also hMPV, rhinovirus, adenovirus",
        "Classic: prodrome URI × 2–3 days → tachypnea + wheeze + crackles + subcostal retractions",
        "Severity indicators: SpO₂ <90%, apnea, feeding difficulty, RR >70/min, severe retractions",
        "High-risk: prematurity, congenital heart disease, immunodeficiency, age <2 months",
        "AAP Guidelines: NO bronchodilators (albuterol), NO steroids, NO antibiotics routinely",
        "HFNC (High-Flow Nasal Cannula): reduces intubation rate in moderate-severe bronchiolitis",
      ]
    },
    workup: [
      { icon:"📊", label:"Clinical Assessment (Respiratory Distress)", detail:"RR, SpO₂, accessory muscle use, nasal flaring, subcostal/intercostal retractions, ability to feed. Gestalt assessment most important." },
      { icon:"🧪", label:"Respiratory Viral Panel (if management changes)", detail:"RSV, hMPV, rhinovirus, adenovirus. Useful for cohorting and family counseling. Does NOT change management." },
      { icon:"📸", label:"CXR (if diagnosis unclear or severe)", detail:"Hyperinflation, peribronchial thickening, atelectasis. NOT routinely recommended by AAP. Useful if fever + consolidation suggests bacterial superinfection." },
      { icon:"🫁", label:"SpO₂ Continuous Monitoring", detail:"Threshold for O₂ supplementation: SpO₂ <90% consistently. Brief desaturations during feeding in otherwise well infant may not require O₂." },
    ],
    treatment: [
      { cat:"🅐 First-Line", drug:"Nasal Suctioning", dose:"Bulb syringe or mechanical suction before feeds and as needed; gentle nasal saline drops instilled before suctioning", renal:"N/A", ivpo:"Procedural", deesc:"MOST EFFECTIVE intervention — clears mucus secretions from narrow infant nasal passages. Improves feeding, reduces WOB. Parent teaching is key.", note:"Avoid deep suctioning (below nasal turbinates) — irritates mucosa, increases secretions, may precipitate apnea. Gentle bulb syringe is sufficient for most cases.", ref:"AAP Bronchiolitis Guidelines 2014 (updated 2023)" },
      { cat:"🅐 Oxygen", drug:"Supplemental Oxygen", dose:"Titrate to SpO₂ ≥90–92% (some centers ≥94%). Low-flow NC 0.5–2 L/min as starting point. HFNC 1–2 L/kg/min for moderate-severe.", renal:"N/A", ivpo:"Inhalation", deesc:"Discontinue O₂ when SpO₂ consistently ≥90–92% on room air. HFNC reduces PICU admission and intubation in moderate-severe bronchiolitis (PARIS trial).", note:"PARIS trial: HFNC vs standard O₂ in bronchiolitis — HFNC reduced treatment failure from 31% to 25%. Consider early HFNC for SpO₂ <92% on 2 L/min NC.", ref:"AAP / PARIS Trial 2018" },
      { cat:"🅑 Hydration", drug:"IV / NG Fluids (Feeding Support)", dose:"NG feeds at maintenance rate if unable to bottle/breastfeed due to respiratory distress. IV: D5 0.45% NS at maintenance if NG not tolerated.", renal:"Adjust for AKI", ivpo:"NG / IV", deesc:"Ensure adequate hydration and nutrition. Discontinue if feeding resumes. Electrolyte monitoring with IV fluids.", note:"Hyponatremia risk with bronchiolitis + IV hypotonic fluids — use isotonic or near-isotonic solutions. Monitor electrolytes q12–24h.", ref:"AAP Guidelines" },
    ],
    followup: [
      "Discharge criteria: SpO₂ ≥90% on room air, adequate PO intake (>50% of normal feeds), RR <60, no apnea",
      "Peak symptoms days 3–5 — counsel parents on worsening before improvement",
      "Return precautions: SpO₂ <90%, apnea, unable to feed, increased work of breathing",
      "RSV prophylaxis: nirsevimab (Beyfortus) for infants <8 months in first RSV season — discuss with pediatrician",
      "High-risk infants: palivizumab (Synagis) prophylaxis consideration for prematurity/CHD",
    ]
  },
  anaphylaxis: {
    overview: {
      def: "Anaphylaxis is a severe, life-threatening systemic hypersensitivity reaction. Epinephrine IM is the FIRST and most important intervention — no contraindications in anaphylaxis. Common triggers in children: food (peanut, tree nut, shellfish, milk, egg), insect venom, medications (beta-lactam antibiotics, NSAIDs), latex. Biphasic anaphylaxis occurs in 5–20% — reactions can recur 1–72h after initial resolution without re-exposure.",
      bullets: [
        "Epinephrine 0.01 mg/kg IM (anterolateral thigh) — maximum 0.5 mg; repeat q5–15 min as needed",
        "IM epinephrine is SUPERIOR to SQ — faster absorption, higher peak levels, fewer rebound reactions",
        "Antihistamines and steroids are ADJUNCTS only — do NOT treat airway obstruction or hypotension",
        "Supine position with legs elevated: maintains venous return; sitting up causes precipitous BP drop ('positional asphyxia')",
        "Biphasic reaction: observe minimum 4–6h after epinephrine; 24h if severe",
        "Always prescribe epinephrine auto-injector at discharge — BOTH doses to patient AND family",
      ]
    },
    workup: [
      { icon:"🩺", label:"Clinical Diagnosis (Do Not Delay Epinephrine for Tests)", detail:"Anaphylaxis is a clinical diagnosis. Cutaneous (urticaria, angioedema) + respiratory or cardiovascular involvement = anaphylaxis. Do NOT wait for lab confirmation." },
      { icon:"🩸", label:"Serum Tryptase (Research / Specialty)", detail:"Peaks 60–90 min after anaphylaxis onset. Elevated confirms mast cell activation. Not routinely needed for acute management. Useful for allergy/immunology follow-up." },
      { icon:"🫀", label:"Continuous ECG + SpO₂", detail:"Cardiovascular collapse: hypotension, tachycardia, arrhythmia. SpO₂ monitoring. EKG for myocardial ischemia from vasospasm (rare)." },
      { icon:"📋", label:"Trigger Identification", detail:"Recent food, medication, insect sting, latex exposure. Document timeline. Essential for allergy testing and avoidance counseling." },
    ],
    treatment: [
      { cat:"🅐 First-Line", drug:"Epinephrine 1:1000 IM", dose:"0.01 mg/kg IM (anterolateral thigh); max 0.5 mg (= max 0.5 mL of 1:1000); repeat q5–15 min PRN. Auto-injector: <15 kg = 0.15 mg (Epipen Jr); ≥25 kg = 0.3 mg (Epipen)", renal:"No contraindications in anaphylaxis", ivpo:"IM (anterolateral thigh)", deesc:"No maximum number of IM doses. Repeat q5–15 min if no improvement. IV epinephrine for cardiac arrest or refractory shock: 0.01 mg/kg IV of 0.1 mg/mL.", note:"INTRAMUSCULAR (not subcutaneous) — IM provides 6× faster absorption, 4× higher peak levels. Anterolateral thigh (not deltoid). This is the single most important intervention.", ref:"WAO / AAP Anaphylaxis 2023" },
      { cat:"🅑 Adjunct", drug:"Diphenhydramine", dose:"1 mg/kg IV/IM/PO (max 50 mg). H2 blocker: ranitidine 1 mg/kg IV (max 50 mg)", renal:"No adjustment", ivpo:"IV / IM / PO", deesc:"Treats urticaria/angioedema symptoms — does NOT reverse bronchospasm or hypotension. ADJUNCT only after epinephrine.", note:"Antihistamines are frequently overemphasized in anaphylaxis — they do not prevent progression or treat life-threatening features. Epinephrine is the treatment.", ref:"AAP / Simons 2023" },
      { cat:"🅑 Adjunct", drug:"Methylprednisolone (Steroid)", dose:"1–2 mg/kg IV/IM (max 125 mg); prednisone 1 mg/kg PO (max 60 mg) if oral route available", renal:"No adjustment", ivpo:"IV / IM / PO", deesc:"Reduces risk of biphasic anaphylaxis (controversial but standard practice). Onset 4–6h — no role in acute cardiovascular/respiratory compromise. ADJUNCT only.", note:"Evidence for steroids in anaphylaxis is limited but practice remains widespread. Give after epinephrine. 3-day oral prednisone taper at discharge to prevent biphasic.", ref:"Cochrane / AAP" },
      { cat:"🅒 Shock", drug:"IV Fluid Bolus + Vasopressors", dose:"IV fluid: 10–20 mL/kg isotonic crystalloid rapidly for hypotension. Vasopressor: epinephrine infusion 0.1–1 mcg/kg/min for refractory shock", renal:"Monitor urine output", ivpo:"IV", deesc:"Supine position + legs elevated WHILE initiating fluids. Avoid upright positioning — precipitates cardiovascular collapse. Glucagon 20–30 mcg/kg IV (max 1 mg) if beta-blocker blunted response.", note:"Beta-blocker patients: refractory anaphylaxis — glucagon 20–30 mcg/kg IV bypasses beta-receptor blockade. Atropine for bradycardia if vagally mediated.", ref:"WAO Guidelines" },
    ],
    followup: [
      "Observe minimum 4–6h after epinephrine (moderate); 24h if severe or biphasic risk factors",
      "Prescribe BOTH Epipen (or equivalent) AND written emergency action plan at discharge — mandatory",
      "Allergy/immunology referral within 4–6 weeks — skin/blood testing, trigger confirmation, immunotherapy",
      "Medic alert bracelet: strongly recommended for all children with anaphylaxis history",
      "Dietary counseling: nutritionist referral for food allergy management (peanut, tree nut, milk, egg avoidance)",
      "OFC (oral food challenge) only under allergy supervision — never attempt at home",
    ]
  },
  dka_peds: {
    overview: {
      def: "Pediatric DKA management differs from adults in one critical way: CEREBRAL EDEMA risk. Rapid fluid administration and aggressive osmolality shifts can precipitate cerebral edema — the leading cause of DKA-related death in children. The 2-bag method (two pre-made bags with different glucose concentrations run simultaneously at a fixed total rate) allows precise glucose management without bag changes.",
      bullets: [
        "DKA definition: BG >200 + pH <7.3 or bicarb <15 + ketonemia/ketonuria",
        "CEREBRAL EDEMA: most feared complication — peaks at 4–12h; early signs: headache, bradycardia, BP rise, deteriorating consciousness",
        "Fluid rate: deficit replacement over 24–48h — do NOT bolus >20 mL/kg (boluses increase cerebral edema risk)",
        "2-bag method: allows gradual glucose adjustment without frequent bag changes (target BG 150–250 mg/dL)",
        "Insulin: 0.05–0.1 units/kg/hr IV — start 1–2h AFTER fluid resuscitation begins",
        "Potassium: add 40 mEq/L KCl to fluids once K+ <5.5 and adequate urine output — hypokalemia is life-threatening",
      ]
    },
    workup: [
      { icon:"🩸", label:"Blood Gas + BMP q1–2h", detail:"pH, bicarb, anion gap — guide resolution. K+ monitoring critical (falls with insulin). Glucose q1h." },
      { icon:"🧠", label:"Neurological Assessment q1–2h", detail:"Headache, vomiting, altered mental status, bradycardia, BP rise = cerebral edema. Have mannitol 1 g/kg or 3% NS ready at bedside." },
      { icon:"💉", label:"Serum Osmolality (Effective)", detail:"Effective osmolality = 2[Na] + [glucose/18]. Rising effective osmolality during treatment = cerebral edema risk. Target gradual decline." },
      { icon:"🧪", label:"Urine Ketones + Urinalysis", detail:"Ketonemia/ketonuria resolution lags glucose — use AG closure and bicarbonate improvement to guide DKA resolution (not just glucose)." },
      { icon:"🔬", label:"HbA1c + Insulin Antibodies (New Diagnosis)", detail:"Confirm type 1 vs type 2 DKA. C-peptide, GAD antibodies, anti-islet cell antibodies for new diagnosis." },
    ],
    treatment: [
      { cat:"🅐 Fluids", drug:"Isotonic Crystalloid (Initial + Maintenance)", dose:"BOLUS: 10–20 mL/kg NS over 30–60 min ONLY if hemodynamically unstable (avoid routine boluses). MAINTENANCE: 1.5× maintenance rate in NS or 0.45% NS + 40 mEq/L KCl (after K+ <5.5). DO NOT exceed 1.5–2× maintenance in first 24h.", renal:"Monitor urine output; adjust rate in AKI", ivpo:"IV", deesc:"2-bag method: Bag A (NS + KCl, no glucose) + Bag B (D10 + NS + KCl). Titrate A:B ratio to maintain BG 150–250 mg/dL at a constant TOTAL rate.", note:"Rapid fluid administration associated with cerebral edema. Target gradual osmolality correction. Typical dehydration in DKA is 5–10% — replace over 24–48h.", ref:"ISPAD Guidelines 2022" },
      { cat:"🅐 Insulin", drug:"Regular Insulin Infusion", dose:"0.05–0.1 units/kg/hr IV continuous infusion; start 1–2h AFTER fluids initiated; target BG fall 50–100 mg/dL/hr; DO NOT give IV insulin bolus", renal:"Reduce rate if BG falling too rapidly or hypoglycemia", ivpo:"IV continuous", deesc:"Once BG <300: add dextrose (2-bag method). Once resolving (pH >7.3, bicarb >15, gap closed): transition to SQ insulin. Overlap SQ with IV by 2h before stopping infusion.", note:"IV bolus insulin NOT recommended in pediatric DKA (accelerates K+ shift → hypokalemia). Low-dose infusion (0.05 units/kg/hr) may be safer for younger/lighter children.", ref:"ISPAD 2022 / BSPED" },
      { cat:"🅑 Electrolytes", drug:"Potassium Chloride + Potassium Phosphate", dose:"K+ <3.5: 0.5 mEq/kg/hr IV (max 1 mEq/kg/hr via central line) + hold insulin. K+ 3.5–5.5: add 40 mEq/L to IV fluids. K+ >5.5: hold K+ supplementation, check q1h", renal:"Reduce replacement rate if oliguria", ivpo:"IV", deesc:"ALL DKA patients will become hypokalemic as insulin drives K+ intracellularly. Replace BEFORE significant hypokalemia develops. Phosphate co-replacement helpful for moderate hypophosphatemia.", note:"K+ <3 with insulin running = life-threatening — stop insulin immediately until K+ replaced. ECG changes of hypokalemia (U waves, flattened T) indicate significant depletion.", ref:"ISPAD 2022" },
      { cat:"🅒 Cerebral Edema", drug:"Mannitol / 3% Hypertonic Saline", dose:"Mannitol: 0.5–1 g/kg IV over 20 min OR 3% NS: 5–10 mL/kg IV over 30 min. Have READY at bedside before starting DKA fluids.", renal:"Caution in AKI with mannitol (osmotic diuresis)", ivpo:"IV", deesc:"FIRST SIGN of cerebral edema (headache, bradycardia, declining GCS) → immediate treatment. Notify PICU, neurosurgery if GCS <13.", note:"3% NS is increasingly preferred over mannitol for pediatric cerebral edema in DKA (avoids diuresis, maintains IV volume). Both are acceptable first-line.", ref:"ISPAD 2022 / Pediatrics" },
    ],
    followup: [
      "PICU admission for: age <2, severe acidosis (pH <7.1), altered mental status, cerebral edema risk factors",
      "Glucose q1h, BMP q2h until pH >7.3 and anion gap closed",
      "Transition to SQ insulin with endocrinology input — overlap IV by 2h before stopping",
      "Endocrinology consult for all new-onset DKA — insulin regimen, carb counting education",
      "Diabetes education: CGM setup, sick-day management, when to go to ER",
      "Screen family for type 1 DM risk (antibodies for first-degree relatives)",
    ]
  },
  intussus: {
    overview: {
      def: "Intussusception is the most common cause of intestinal obstruction in children 3 months–3 years. The ileocolic junction is most commonly involved (95%). Telescoping of proximal bowel into distal bowel compromises blood supply → ischemia → perforation if untreated. Classic triad (colicky pain + vomiting + bloody stool) occurs in <50% — 'currant jelly' stool is a LATE sign.",
      bullets: [
        "Classic triad: episodic colicky abdominal pain + vomiting + currant jelly stool (late sign)",
        "In between pain episodes: child may appear completely normal or lethargic (latter = concerning)",
        "Ultrasound is DIAGNOSTIC: donut/target sign = intussusception (sensitivity/specificity >95%)",
        "Air enema reduction: success rate 60–90% in absence of peritonitis or perforation",
        "Contraindications to air enema: free air on AXR, peritoneal signs, hemodynamic instability",
        "Recurrence rate after air enema: 5–10%; higher in first 24h",
      ]
    },
    workup: [
      { icon:"🔬", label:"Abdominal Ultrasound (DIAGNOSTIC)", detail:"Donut sign (transverse view) / pseudo-kidney sign (longitudinal). Sensitivity >95%, specificity >95%. NO radiation. First-line imaging for suspected intussusception." },
      { icon:"📸", label:"AXR (if perforation suspected)", detail:"Free air = perforation = contraindication to enema. Paucity of gas in RLQ, soft tissue mass. AXR alone insufficient to diagnose or exclude intussusception." },
      { icon:"💉", label:"IV Access + Labs", detail:"CBC, BMP, type and screen (if surgical risk). IV access before enema reduction. Blood available if surgical intervention needed." },
      { icon:"🧠", label:"Mental Status Assessment", detail:"Lethargic/obtunded child with intussusception = prolonged ischemia, near-perforation, or toxic. Emergent surgical consultation." },
    ],
    treatment: [
      { cat:"🅐 Diagnostic + Therapeutic", drug:"Air Enema Reduction (Pneumatic)", dose:"Air enema under fluoroscopic or ultrasound guidance by radiology. Pressure: 80–120 mmHg. Three attempts maximum. Pediatric surgery on standby.", renal:"N/A", ivpo:"Procedural", deesc:"Success = reflux of air into terminal ileum under fluoroscopy. If unsuccessful after 3 attempts → surgical reduction. Recurrence in 5–10%: repeat enema attempt acceptable if no peritonitis.", note:"Air enema preferred over barium/water-soluble (lower perforation risk if occurs, faster if surgery needed). Premedicate with IV fluid bolus and pain management before procedure.", ref:"ACR / Pediatric Radiology" },
      { cat:"🅐 Fluid", drug:"IV Fluid Resuscitation", dose:"10–20 mL/kg NS IV bolus before enema if dehydrated. Maintenance IV fluids after procedure.", renal:"Monitor urine output", ivpo:"IV", deesc:"Dehydration common from vomiting. Adequate fluid status important for enema success and post-procedure monitoring.", note:"NPO status for procedural sedation consideration if general anesthesia needed (surgical cases).", ref:"Standard of Care" },
      { cat:"🅑 Surgical", drug:"Surgical Reduction / Resection", dose:"Indications: failed air enema × 3, perforation/peritonitis, hemodynamic instability, lead point suspected (>2 years — polyp, lymphoma, Meckel's)", renal:"N/A", ivpo:"Procedural/Surgical", deesc:"Laparoscopic approach preferred. Bowel resection if ischemic segment present. Post-op monitoring for recurrence.", note:"Children >2 years with intussusception: higher likelihood of pathological lead point (Meckel's diverticulum, lymphoma, polyp) — low threshold for surgical exploration.", ref:"Pediatric Surgery" },
    ],
    followup: [
      "Observe 4–6h post-successful air enema for recurrence (most occur within 24h)",
      "Pain-free, tolerating PO, and normal clinical exam required before discharge",
      "Return precautions: recurrent crampy pain, blood per rectum, vomiting, fever",
      "Recurrence after enema: return to ED; repeat enema attempted if no peritonitis",
      ">2 yo with intussusception: CT abdomen after recovery to screen for lead point (lymphoma, Meckel's)",
    ]
  },
};

const WEIGHT_RANGES = [
  { label:"Newborn (3 kg)",   kg:3 },
  { label:"3 months (6 kg)", kg:6 },
  { label:"6 months (8 kg)", kg:8 },
  { label:"1 year (10 kg)",  kg:10 },
  { label:"2 years (12 kg)", kg:12 },
  { label:"5 years (18 kg)", kg:18 },
  { label:"8 years (26 kg)", kg:26 },
  { label:"12 years (40 kg)",kg:40 },
];

function calcWeightDoses(doseStr, weightKg) {
  if (!weightKg || weightKg <= 0 || !doseStr) return [];
  const results = [];
  const re = /([\d.]+)(?:\s*[–\-]\s*([\d.]+))?\s*(mg|mcg|g|mL|units?|J)\/kg/gi;
  let m;
  const seen = new Set();
  while ((m = re.exec(doseStr)) !== null) {
    const lo = parseFloat(m[1]);
    const hi = m[2] ? parseFloat(m[2]) : null;
    const unit = m[3];
    const key = `${lo}-${hi}-${unit}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const loD = (lo * weightKg).toFixed(lo < 1 ? 2 : 1);
    const hiD = hi ? (hi * weightKg).toFixed(hi < 1 ? 2 : 1) : null;
    results.push({ label: hiD ? `${lo}–${hi} ${unit}/kg` : `${lo} ${unit}/kg`, calc: hiD ? `${loD}–${hiD} ${unit}` : `${loD} ${unit}` });
  }
  return results;
}

function DrugRow({ d, color, weightKg }) {
  const [open, setOpen] = useState(null);
  const catColors = { "🅐":T.coral, "🅑":T.blue, "🅒":T.teal };
  const cc = catColors[d.cat[0]] || color;
  const weightDoses = calcWeightDoses(d.dose, weightKg);
  const panels = [
    { id:0, icon:"📋", label:"Details", content: <><b style={{color:T.txt2}}>Dose: </b>{d.dose}<br/><br/><b style={{color:T.txt2}}>Route: </b>{d.ivpo}<br/><br/><b style={{color:T.txt2}}>Renal: </b>{d.renal}</> },
    { id:1, icon:"🔧", label:"Alt / Setup", content: <><b style={{color:T.txt2}}>Alt / Setup: </b>{d.deesc}{d.note ? <><br/><br/><b style={{color:T.txt2}}>Clinical Note: </b>{d.note}</> : null}</> },
    { id:2, icon:"📉", label:"Reference", content: <><b style={{color:T.txt2}}>Reference: </b>{d.ref}</> },
  ];
  return (
    <div style={{marginBottom:10,borderRadius:12,overflow:"hidden",border:`1px solid ${open!==null?cc+"66":"rgba(42,79,122,0.3)"}`,background:"rgba(8,22,40,0.6)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:open!==null?`linear-gradient(90deg,${cc}18,transparent)`:"transparent",flexWrap:"wrap"}}>
        <span style={{fontFamily:"JetBrains Mono",fontSize:11,color:cc,background:`${cc}22`,padding:"2px 8px",borderRadius:4,whiteSpace:"nowrap"}}>{d.cat}</span>
        <span style={{fontFamily:"DM Sans",fontWeight:600,color:T.txt,flex:1,fontSize:14}}>{d.drug}</span>
        {weightDoses.length > 0 && (
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {weightDoses.map((wd,i) => (
              <span key={i} style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.gold,background:"rgba(245,200,66,0.15)",border:"1px solid rgba(245,200,66,0.4)",padding:"2px 8px",borderRadius:6,whiteSpace:"nowrap"}}>⚖️ {wd.calc}</span>
            ))}
          </div>
        )}
        <span style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.txt3,flexShrink:0}}>{d.ivpo}</span>
      </div>
      <div style={{padding:"4px 16px 10px",display:"flex",gap:8,flexWrap:"wrap"}}>
        {panels.map(p=>(
          <button key={p.id} onClick={()=>setOpen(open===p.id?null:p.id)} style={{fontFamily:"DM Sans",fontSize:12,padding:"5px 12px",borderRadius:6,border:`1px solid ${open===p.id?cc+"99":"rgba(42,79,122,0.4)"}`,background:open===p.id?`${cc}22`:"rgba(14,37,68,0.8)",color:open===p.id?cc:T.txt2,cursor:"pointer",fontWeight:open===p.id?600:400}}>
            {p.icon} {p.label}
          </button>
        ))}
      </div>
      {open!==null && (
        <div style={{margin:"0 16px 14px",padding:14,background:"rgba(5,15,30,0.7)",borderRadius:10,border:`1px solid ${cc}33`,fontFamily:"DM Sans",fontSize:13,color:T.txt2,lineHeight:1.7}}>
          {panels[open].content}
        </div>
      )}
    </div>
  );
}

export default function PedsHub() {
  const navigate = useNavigate();
  const [sel, setSel] = useState("pals_arrest");
  const [tab, setTab] = useState("overview");
  const [filter, setFilter] = useState("All");
  const [weightVal, setWeightVal] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [quickWeight, setQuickWeight] = useState(null);

  const effectiveWeight = quickWeight || (weightVal ? (weightUnit === "lbs" ? parseFloat(weightVal) * 0.453592 : parseFloat(weightVal)) : 0);

  const cond = CONDITIONS.find(c=>c.id===sel) || CONDITIONS[0];
  const data = DATA[sel] || DATA.pals_arrest;
  const cats = ["All", ...CATS];
  const filtered = filter==="All" ? CONDITIONS : CONDITIONS.filter(c=>c.cat===filter);
  const tabs = [
    { id:"overview", label:"Overview", icon:"📖" },
    { id:"workup",   label:"Workup",   icon:"🔬" },
    { id:"protocol", label:"Protocol", icon:"💉" },
    { id:"followup", label:"Follow-up",icon:"📋" },
  ];

  const glassCard = { background:"rgba(8,22,40,0.75)", border:"1px solid rgba(42,79,122,0.35)", borderRadius:16 };

  return (
    <div style={{ fontFamily:"DM Sans",background:T.bg,minHeight:"100vh",position:"relative",overflow:"hidden" }}>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
        <div style={{position:"absolute",top:"-20%",left:"-10%",width:"60%",height:"60%",background:`radial-gradient(circle,${cond.color}18 0%,transparent 70%)`,transition:"background 1s ease"}}/>
        <div style={{position:"absolute",bottom:"-20%",right:"-10%",width:"50%",height:"50%",background:"radial-gradient(circle,rgba(185,155,255,0.1) 0%,transparent 70%)"}}/>
      </div>

      <div style={{position:"relative",zIndex:1,maxWidth:1200,margin:"0 auto",padding:"0 16px"}}>
        {/* Header */}
        <div style={{padding:"24px 0 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:6}}>
            <button onClick={()=>navigate("/hub")} style={{fontFamily:"DM Sans",fontSize:12,fontWeight:600,padding:"6px 14px",borderRadius:10,border:"1px solid rgba(185,155,255,0.4)",background:"rgba(185,155,255,0.1)",color:"#b99bff",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>← Hub</button>
            <div style={{background:"rgba(5,15,30,0.85)",border:"1px solid rgba(26,53,85,0.6)",borderRadius:12,padding:"6px 14px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.teal,letterSpacing:3,textTransform:"uppercase"}}>NOTRYA</span>
              <span style={{color:T.txt4,fontFamily:"JetBrains Mono",fontSize:10}}>/</span>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3,letterSpacing:2}}>PEDS</span>
            </div>
            <div style={{height:1,flex:1,background:"linear-gradient(90deg,rgba(185,155,255,0.4),transparent)"}}/>
          </div>
          <h1 style={{fontFamily:"Playfair Display,serif",fontSize:"clamp(28px,5vw,46px)",fontWeight:900,letterSpacing:-1,lineHeight:1.1,color:T.txt}}>
            Pediatric Hub
          </h1>
          <p style={{fontFamily:"DM Sans",fontSize:14,color:T.txt3,marginTop:6}}>PALS 2020 · AHA/AAP · Weight-Based Dosing · Broselow</p>
        </div>

        {/* Banner */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10,marginBottom:20}}>
          {BANNER.map((b,i)=>(
            <div key={i} style={{...glassCard,padding:"14px 18px",borderLeft:`3px solid ${b.color}`,background:`linear-gradient(135deg,${b.color}14,rgba(8,22,40,0.8))`}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:18,fontWeight:700,color:b.color}}>{b.value}</div>
              <div style={{fontFamily:"DM Sans",fontWeight:600,color:T.txt,fontSize:13,margin:"2px 0"}}>{b.label}</div>
              <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3}}>{b.sub}</div>
            </div>
          ))}
        </div>

        {/* Main Layout */}
        <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
          {/* Sidebar */}
          <div style={{width:260,flexShrink:0}}>
            <div style={{...glassCard,padding:"10px",marginBottom:10,display:"flex",gap:6,flexWrap:"wrap"}}>
              {cats.map(c=>(
                <button key={c} onClick={()=>setFilter(c)} style={{fontFamily:"DM Sans",fontWeight:600,fontSize:11,padding:"5px 10px",borderRadius:8,border:`1px solid ${filter===c?"rgba(42,79,122,0.8)":"transparent"}`,background:filter===c?"rgba(14,37,68,0.9)":"transparent",color:filter===c?T.txt:T.txt3,cursor:"pointer"}}>
                  {c}
                </button>
              ))}
            </div>
            <div style={{...glassCard,padding:8,overflow:"auto",maxHeight:"calc(100vh - 300px)"}}>
              {filtered.map(c=>(
                <div key={c.id} onClick={()=>{setSel(c.id);setTab("overview")}}
                  style={{position:"relative",padding:"10px 14px",borderRadius:10,marginBottom:4,background:sel===c.id?`linear-gradient(90deg,${c.gl},rgba(14,37,68,0.6))`:"transparent",border:`1px solid ${sel===c.id?c.br:"transparent"}`,cursor:"pointer",transition:"all .2s"}}>
                  {sel===c.id && <div style={{position:"absolute",left:0,top:"10%",height:"80%",width:2,background:c.color,borderRadius:2,boxShadow:`0 0 8px ${c.color}`}}/>}
                  <div style={{display:"flex",gap:10,alignItems:"center"}}>
                    <span style={{fontSize:18}}>{c.icon}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"DM Sans",fontWeight:600,fontSize:13,color:sel===c.id?T.txt:T.txt2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.title}</div>
                      <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.sub}</div>
                    </div>
                    <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:c.color,background:`${c.color}22`,padding:"2px 5px",borderRadius:4,whiteSpace:"nowrap"}}>{c.cat}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div style={{flex:1,minWidth:0}}>
            {/* Condition Header */}
            <div style={{...glassCard,padding:"18px 22px",marginBottom:12,background:`linear-gradient(135deg,${cond.gl},rgba(8,22,40,0.85))`,borderColor:cond.br,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-30,right:-30,fontSize:100,opacity:.06}}>{cond.icon}</div>
              <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                <span style={{fontSize:36}}>{cond.icon}</span>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                    <h2 style={{fontFamily:"Playfair Display,serif",fontSize:"clamp(18px,3vw,26px)",fontWeight:700,color:T.txt}}>{cond.title}</h2>
                    <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:cond.color,background:`${cond.color}22`,padding:"2px 8px",borderRadius:4,border:`1px solid ${cond.color}44`}}>{cond.cat}</span>
                  </div>
                  <div style={{fontFamily:"DM Sans",fontSize:13,color:T.txt2}}>{cond.sub}</div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{...glassCard,padding:"8px",display:"flex",gap:6,marginBottom:14}}>
              {tabs.map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)}
                  style={{flex:1,fontFamily:"DM Sans",fontWeight:600,fontSize:12,padding:"9px 6px",borderRadius:10,border:`1px solid ${tab===t.id?cond.color+"66":"transparent"}`,background:tab===t.id?`linear-gradient(135deg,${cond.color}22,${cond.color}11)`:"transparent",color:tab===t.id?cond.color:T.txt3,cursor:"pointer",textAlign:"center",whiteSpace:"nowrap"}}>
                  <span style={{marginRight:4}}>{t.icon}</span>{t.label}
                </button>
              ))}
            </div>

            {/* Weight Calculator (Protocol tab only) */}
            {tab==="protocol" && (
              <div style={{...glassCard,padding:"12px 16px",marginBottom:10,borderColor:"rgba(185,155,255,0.35)",background:"rgba(185,155,255,0.05)"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <span style={{fontFamily:"JetBrains Mono",fontSize:11,color:"#b99bff",letterSpacing:1}}>⚖️ WEIGHT-BASED DOSING</span>
                  {effectiveWeight > 0 && <span style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.txt3}}>= {effectiveWeight.toFixed(1)} kg — doses in <span style={{color:T.gold}}>gold</span></span>}
                </div>
                {/* Quick age-weight buttons */}
                <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
                  {WEIGHT_RANGES.map(r=>(
                    <button key={r.kg} onClick={()=>{setQuickWeight(quickWeight===r.kg?null:r.kg);setWeightVal("");}} style={{fontFamily:"DM Sans",fontSize:11,padding:"4px 9px",borderRadius:6,border:`1px solid ${quickWeight===r.kg?"rgba(185,155,255,0.6)":"rgba(42,79,122,0.4)"}`,background:quickWeight===r.kg?"rgba(185,155,255,0.2)":"rgba(14,37,68,0.7)",color:quickWeight===r.kg?"#b99bff":T.txt3,cursor:"pointer",whiteSpace:"nowrap"}}>
                      {r.label}
                    </button>
                  ))}
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3}}>Custom:</span>
                  <input type="number" min="0" placeholder="Weight…" value={weightVal} onChange={e=>{setWeightVal(e.target.value);setQuickWeight(null);}}
                    style={{fontFamily:"JetBrains Mono",fontSize:13,width:110,padding:"6px 10px",borderRadius:8,border:"1px solid rgba(185,155,255,0.4)",background:"rgba(14,37,68,0.8)",color:T.txt,outline:"none"}} />
                  <div style={{display:"flex",borderRadius:8,overflow:"hidden",border:"1px solid rgba(42,79,122,0.6)"}}>
                    {["kg","lbs"].map(u=>(
                      <button key={u} onClick={()=>setWeightUnit(u)} style={{padding:"6px 12px",border:"none",cursor:"pointer",fontFamily:"DM Sans",fontWeight:700,fontSize:12,background:weightUnit===u?"rgba(185,155,255,0.25)":"rgba(14,37,68,0.8)",color:weightUnit===u?"#b99bff":T.txt3}}>{u}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content */}
            <div style={{...glassCard,padding:"20px",minHeight:400,overflow:"auto",maxHeight:"calc(100vh - 420px)"}}>
              {tab==="overview" && (
                <div>
                  <div style={{background:"rgba(14,37,68,0.5)",border:"1px solid rgba(42,79,122,0.3)",borderRadius:14,padding:"20px 22px",marginBottom:16}}>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.teal,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>DEFINITION</div>
                    <p style={{fontFamily:"DM Sans",fontSize:14,color:T.txt,lineHeight:1.8}}>{data.overview.def}</p>
                  </div>
                  <div style={{background:"rgba(14,37,68,0.5)",border:"1px solid rgba(42,79,122,0.3)",borderRadius:14,padding:"20px 22px"}}>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.teal,textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>KEY CLINICAL PEARLS</div>
                    {data.overview.bullets.map((b,i)=>(
                      <div key={i} style={{display:"flex",gap:12,marginBottom:12,alignItems:"flex-start"}}>
                        <span style={{color:T.teal,fontFamily:"JetBrains Mono",fontSize:13,minWidth:18}}>▸</span>
                        <span style={{fontFamily:"DM Sans",fontSize:13.5,color:T.txt2,lineHeight:1.65}}>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {tab==="workup" && (
                <div>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.gold,textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>DIAGNOSTIC WORKUP</div>
                  {data.workup.map((item,i)=>(
                    <div key={i} style={{display:"flex",gap:12,padding:"13px 16px",background:"rgba(14,37,68,0.5)",border:"1px solid rgba(42,79,122,0.25)",borderRadius:12,marginBottom:8,alignItems:"flex-start"}}>
                      <span style={{fontSize:18,minWidth:28}}>{item.icon}</span>
                      <div>
                        <div style={{fontFamily:"DM Sans",fontWeight:600,color:T.txt,fontSize:14,marginBottom:4}}>{item.label}</div>
                        <div style={{fontFamily:"DM Sans",fontSize:13,color:T.txt2,lineHeight:1.6}}>{item.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {tab==="protocol" && (
                <div>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.orange,textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>TREATMENT PROTOCOL</div>
                  {data.treatment.map((d,i)=><DrugRow key={i} d={d} color={cond.color} weightKg={effectiveWeight}/>)}
                </div>
              )}
              {tab==="followup" && (
                <div>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.purple,textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>DISCHARGE & FOLLOW-UP</div>
                  {data.followup.map((item,i)=>(
                    <div key={i} style={{display:"flex",gap:14,padding:"12px 16px",background:"rgba(14,37,68,0.5)",border:"1px solid rgba(42,79,122,0.25)",borderRadius:12,marginBottom:8}}>
                      <span style={{fontFamily:"JetBrains Mono",fontSize:12,color:T.purple,minWidth:24}}>{String(i+1).padStart(2,"0")}</span>
                      <span style={{fontFamily:"DM Sans",fontSize:13.5,color:T.txt2,lineHeight:1.65}}>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{textAlign:"center",padding:"16px 0 24px"}}>
          <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt4,letterSpacing:2}}>NOTRYA PEDIATRIC HUB · AHA PALS 2020 · AAP GUIDELINES · FOR CLINICAL REFERENCE ONLY</span>
        </div>
      </div>
    </div>
  );
}