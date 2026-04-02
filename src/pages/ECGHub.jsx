import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

// ── Fonts ──────────────────────────────────────────────────────────────────
(() => {
  const ID = "notrya-ecg-fonts";
  if (document.getElementById(ID)) return;
  const l = document.createElement("link");
  l.id = ID; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;900&family=JetBrains+Mono:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
})();

const T = {
  bg: "#04080f", panel: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.08)",
  borderHi: "rgba(255,255,255,0.15)", shine: "inset 0 1px 0 rgba(255,255,255,0.1)",
  txt: "#f0f4ff", txt2: "#a5b8d8", txt3: "#5a7490", txt4: "#2e4060",
  red: "#f87171", orange: "#fb923c", yellow: "#fbbf24", green: "#34d399",
  blue: "#60a5fa", purple: "#a78bfa", teal: "#2dd4bf", cyan: "#22d3ee",
};

// ── ECG Rhythm Data ────────────────────────────────────────────────────────
const RHYTHMS = [
  {
    id: "nsr", label: "Normal Sinus Rhythm", category: "normal",
    color: T.green, icon: "✅",
    rate: "60–100 bpm", regularity: "Regular",
    p_wave: "Upright in I, II, aVF; inverted in aVR", pr: "0.12–0.20 sec", qrs: "≤ 0.12 sec", qt: "0.36–0.44 sec",
    description: "Normal sinus node depolarization with normal AV and ventricular conduction.",
    criteria: ["Rate 60–100 bpm", "P wave before every QRS", "Constant PR interval (0.12–0.20 sec)", "QRS ≤ 0.12 sec", "P upright in II, inverted in aVR"],
    causes: ["Healthy baseline cardiac rhythm"],
    management: ["No intervention required", "Treat underlying cause if associated symptoms"],
    pearl: "NSR does not exclude significant pathology — assess the full ECG including ST segments, QTc, and axis.",
    severity: "benign",
  },
  {
    id: "stemi", label: "STEMI", category: "emergency",
    color: T.red, icon: "🚨",
    rate: "Variable", regularity: "Usually regular",
    p_wave: "Normal (may be absent in posterior)", pr: "Normal", qrs: "Normal or wide if BBB", qt: "May be prolonged",
    description: "ST-elevation myocardial infarction — complete occlusion of a coronary artery requiring immediate reperfusion.",
    criteria: ["ST elevation ≥ 1 mm in ≥ 2 contiguous limb leads", "ST elevation ≥ 2 mm in ≥ 2 contiguous precordial leads", "New LBBB with symptoms (Sgarbossa criteria)", "Posterior MI: ST depression V1–V3 + tall R wave"],
    territories: [
      { name: "Anterior (LAD)", leads: "V1–V4", artery: "LAD", note: "Highest risk — large territory, cardiogenic shock risk" },
      { name: "Inferior (RCA)", leads: "II, III, aVF", artery: "RCA (80%) / LCx (20%)", note: "Check right-sided leads (V4R) for RV involvement" },
      { name: "Lateral (LCx)", leads: "I, aVL, V5–V6", artery: "Left Circumflex", note: "May be subtle; check aVL carefully" },
      { name: "Posterior (RCA/LCx)", leads: "V1–V3 (reciprocal)", artery: "RCA or LCx", note: "ST depression + tall R in V1–V3; perform posterior leads" },
    ],
    management: ["Activate STEMI alert immediately — door-to-balloon goal < 90 min", "Aspirin 325 mg PO chewed", "Heparin bolus per weight-based protocol", "Do NOT give nitrates if inferior STEMI + possible RV infarct (hypotension risk)", "Cath lab activation — contact interventional cardiology NOW"],
    equivalents: ["Wellens Syndrome Type A/B (LAD stenosis)", "de Winter T-waves (LAD occlusion)", "Sgarbossa-positive LBBB", "Hyperacute T-waves (early STEMI)", "Posterior STEMI (reciprocal changes V1–V3)"],
    pearl: "Sgarbossa Criteria for LBBB: concordant ST elevation ≥ 1 mm (5 pts), concordant ST depression ≥ 1 mm in V1–V3 (3 pts), discordant ST elevation ≥ 5 mm (2 pts). Score ≥ 3 = 90% specificity for AMI.",
    severity: "critical",
  },
  {
    id: "afib", label: "Atrial Fibrillation", category: "arrhythmia",
    color: T.orange, icon: "〰️",
    rate: "60–170+ bpm (ventricular)", regularity: "Irregularly irregular",
    p_wave: "Absent — fibrillatory baseline (f-waves)", pr: "Not measurable", qrs: "≤ 0.12 sec (unless aberrant)", qt: "Variable",
    description: "Chaotic atrial electrical activity causing disorganized atrial depolarization and irregularly irregular ventricular response.",
    criteria: ["Irregularly irregular R-R intervals", "No identifiable P waves", "Fibrillatory baseline (f-waves best seen V1)", "QRS typically narrow (unless aberrant conduction or pre-excitation)"],
    causes: ["HTN (most common)", "CAD, HF, valvular disease (MR, MS)", "Hyperthyroidism, pulmonary disease", "EtOH, stimulants, caffeine excess", "Post-operative (POAF)", "Idiopathic (lone afib < 60 yo)"],
    management: ["Rate control: metoprolol 5 mg IV q5 min (max 15 mg) OR diltiazem 0.25 mg/kg IV", "Rhythm control if < 48h or anticoagulated ≥ 3 weeks: cardioversion", "Anticoagulation: CHA₂DS₂-VASc score guides stroke risk", "New-onset hemodynamically unstable: synchronized cardioversion 200 J biphasic"],
    pearl: "WPW + AFib = AVOID AV nodal blockers (adenosine, beta-blockers, CCBs, digoxin) — they accelerate conduction via accessory pathway causing VF. Use procainamide or direct cardioversion.",
    severity: "urgent",
  },
  {
    id: "aflutter", label: "Atrial Flutter", category: "arrhythmia",
    color: T.orange, icon: "🏔️",
    rate: "Atrial 250–350; Ventricular 75–175 (2:1 or 3:1 block)", regularity: "Regular or regularly irregular",
    p_wave: "Sawtooth flutter waves (F-waves) best seen II, III, aVF", pr: "Variable (2:1, 3:1, 4:1 block)", qrs: "Narrow unless aberrant",  qt: "Variable",
    description: "Macro-reentrant circuit in right atrium creating organized atrial rate ~300 bpm with fixed AV block ratio.",
    criteria: ["Sawtooth F-waves at ~300 bpm (best in II, III, aVF)", "Regular ventricular rate at fixed ratio (2:1 most common = ventricular rate ~150)", "If ventricular rate is exactly 150 — always suspect flutter 2:1", "No isoelectric baseline between atrial deflections"],
    causes: ["Similar to AFib — HTN, CAD, HF, valvular disease", "Post-cardiac surgery", "COPD, pulmonary disease"],
    management: ["Rate control: diltiazem or beta-blockers (same as AFib)", "Cardioversion: often responsive at low energy (50–100 J biphasic)", "Anticoagulation: same as AFib per CHA₂DS₂-VASc", "Ablation: flutter-specific (cavotricuspid isthmus) highly effective > 95%"],
    pearl: "Ventricular rate exactly 150 bpm = atrial flutter 2:1 until proven otherwise. Apply vagal maneuver or adenosine to transiently slow rate and unmask flutter waves.",
    severity: "urgent",
  },
  {
    id: "svt", label: "SVT (AVNRT / AVRT)", category: "arrhythmia",
    color: T.yellow, icon: "⚡",
    rate: "150–250 bpm", regularity: "Regular",
    p_wave: "Buried in or just after QRS (AVNRT) or retrograde P after QRS (AVRT)", pr: "Short or unmeasurable", qrs: "Narrow (usually)", qt: "Shortened due to rate",
    description: "Paroxysmal supraventricular tachycardia from reentrant circuit at or above the AV node.",
    criteria: ["Regular narrow complex tachycardia 150–250 bpm", "Abrupt onset and termination", "P waves absent or retrograde (RP < PR)", "No delta wave unless WPW (AVRT)"],
    causes: ["Idiopathic (young healthy patients)", "WPW or accessory pathway (AVRT)", "Caffeine, stimulants, anxiety", "Structural heart disease (less common)"],
    management: ["Vagal maneuvers first: modified Valsalva (REVERT maneuver) — 43% conversion", "Adenosine 6 mg rapid IV push + flush; 12 mg if no response (×2)", "If hemodynamically unstable: synchronized cardioversion 100–200 J biphasic", "Diltiazem or beta-blocker for recurrence prevention"],
    pearl: "REVERT maneuver: strain for 15 sec, then immediately supine with passive leg raise — 43% conversion vs 17% standard Valsalva. Adenosine half-life is < 10 sec — must be given as rapid push into large vein with immediate flush.",
    severity: "urgent",
  },
  {
    id: "vt", label: "Ventricular Tachycardia", category: "emergency",
    color: T.red, icon: "💥",
    rate: "100–250 bpm", regularity: "Regular (usually)",
    p_wave: "Dissociated from QRS (AV dissociation)", pr: "Not applicable (AV dissociation)", qrs: "> 0.12 sec (wide complex)", qt: "Prolonged",
    description: "Rapid ventricular rhythm arising below the bundle of His — always life-threatening until proven otherwise.",
    criteria: ["Wide complex tachycardia (QRS > 0.12 sec) at rate > 100", "AV dissociation (P waves unrelated to QRS) — pathognomonic if present", "Fusion beats — partial capture of ventricle by sinus impulse", "Capture beats — narrow QRS amid wide complex tachycardia", "Brugada criteria: concordance, northwest axis, no RS complex in V1–V6"],
    causes: ["Structural heart disease — most common (post-MI scar, cardiomyopathy)", "Electrolyte abnormalities: hypokalemia, hypomagnesemia", "QT prolongation — torsades de pointes variant", "Channelopathies: Brugada, ARVC, LQTS"],
    management: ["Pulseless VT: immediate defibrillation 200 J biphasic, CPR, epinephrine 1 mg IV", "Unstable with pulse: synchronized cardioversion 100 J biphasic", "Stable VT: amiodarone 150 mg IV over 10 min, then 1 mg/min × 6h", "Correct electrolytes: K+ goal > 4.0, Mg > 2.0", "Torsades: magnesium 2 g IV over 5–10 min + overdrive pacing"],
    pearl: "Assume VT first in any wide complex tachycardia — NEVER empirically treat as SVT with aberrancy. AV dissociation, fusion beats, and capture beats are diagnostic. Adenosine in VT can cause hemodynamic collapse.",
    severity: "critical",
  },
  {
    id: "vfib", label: "Ventricular Fibrillation", category: "emergency",
    color: T.red, icon: "☠️",
    rate: "No organized rate — chaotic", regularity: "Chaotic — no organized activity",
    p_wave: "None", pr: "None", qrs: "None — chaotic undulation", qt: "Not applicable",
    description: "Completely disorganized ventricular electrical activity — no effective cardiac output. Cardiac arrest.",
    criteria: ["Chaotic, irregular waveform with no identifiable P, QRS, or T", "No organized rhythm", "Patient pulseless and unresponsive"],
    causes: ["Acute MI (most common)", "Severe cardiomyopathy", "Electrolyte abnormalities", "Long QT → torsades → VF", "WPW + AFib with rapid pre-excited conduction", "Hypothermia, electrocution"],
    management: ["Defibrillation 200 J biphasic — immediate, before CPR if witnessed", "High-quality CPR 30:2, minimize interruptions", "Epinephrine 1 mg IV q3–5 min", "Amiodarone 300 mg IV bolus after 3rd shock, 150 mg after 5th", "Identify and treat reversible causes: H's and T's"],
    pearl: "For every 1-minute delay in defibrillation, survival decreases ~10%. Shock first if witnessed VF — begin CPR immediately if defibrillator not immediately available. After ROSC: targeted temperature management 32–36°C × 24h.",
    severity: "critical",
  },
  {
    id: "wpw", label: "Wolff-Parkinson-White (WPW)", category: "preexcitation",
    color: T.purple, icon: "⚡",
    rate: "Normal at baseline (60–100)", regularity: "Regular at baseline",
    p_wave: "Normal", pr: "Short (< 0.12 sec)", qrs: "Wide — delta wave slurs initial QRS upstroke", qt: "Prolonged due to wide QRS",
    description: "Accessory pathway (Bundle of Kent) bypasses AV node causing ventricular pre-excitation — risk of life-threatening tachycardia.",
    criteria: ["Short PR interval (< 0.12 sec)", "Delta wave (slurred upstroke of QRS)", "Wide QRS complex (> 0.12 sec total)", "Secondary ST-T changes (discordant)"],
    causes: ["Congenital accessory pathway (Bundle of Kent)", "More common in males", "Associated with Ebstein anomaly"],
    management: ["Asymptomatic: risk stratify — electrophysiology referral", "WPW + SVT: adenosine generally safe (anterograde via AV node)", "WPW + AFib: AVOID AV nodal blockers → procainamide or cardioversion", "Definitive: catheter ablation of accessory pathway (~95% cure rate)"],
    pearl: "WPW + AFib is immediately life-threatening — rapid conduction via accessory pathway can reach 300 bpm causing VF. AV nodal blockers (adenosine, beta-blockers, CCBs, digoxin) are contraindicated. Use procainamide 17 mg/kg IV or cardioversion.",
    severity: "urgent",
  },
  {
    id: "avblock1", label: "1st Degree AV Block", category: "conduction",
    color: T.green, icon: "🟡",
    rate: "60–100 bpm (normal)", regularity: "Regular",
    p_wave: "Normal", pr: "> 0.20 sec (prolonged but constant)", qrs: "≤ 0.12 sec", qt: "Normal",
    description: "Prolonged but constant PR interval — delayed but not blocked AV conduction. Every P wave conducts.",
    criteria: ["PR interval > 0.20 sec (> 5 small boxes)", "Every P wave followed by QRS", "Constant PR interval — never varies", "Normal QRS morphology"],
    causes: ["Athletic heart (increased vagal tone)", "Inferior MI (RCA occlusion)", "AV nodal disease, fibrosis", "Medications: beta-blockers, CCBs, digoxin, amiodarone"],
    management: ["Usually benign — no treatment required", "Monitor for progression to higher-degree AV block", "Stop offending medications if symptomatic", "Pacing not indicated unless severely prolonged and symptomatic (rare)"],
    pearl: "1st degree AV block in the setting of inferior MI may progress to 2nd or 3rd degree block — requires continuous monitoring. Isolated 1st degree AV block in athletes is a normal variant from high vagal tone.",
    severity: "benign",
  },
  {
    id: "avblock2m", label: "2nd Degree AV Block — Mobitz I (Wenckebach)", category: "conduction",
    color: T.yellow, icon: "🌊",
    rate: "Usually normal ventricular rate", regularity: "Irregular — grouped beating pattern",
    p_wave: "Normal; P:QRS ratio > 1:1", pr: "Progressively lengthens until a QRS drops", qrs: "Normal when conducted", qt: "Normal",
    description: "Progressive PR prolongation until a P wave fails to conduct — typically at the AV node. Usually benign.",
    criteria: ["Progressive PR prolongation (each beat longer than previous)", "Sudden dropped QRS (non-conducted P wave)", "Cycle repeats — grouped beating", "RR intervals progressively shorten before dropped beat"],
    causes: ["Inferior MI (RCA territory — AV nodal branch)", "High vagal tone (athletes, sleep)", "AV nodal disease", "Digoxin toxicity, beta-blockers, CCBs"],
    management: ["Usually benign — monitor on telemetry", "If inferior MI: usually resolves with reperfusion", "Atropine 0.5 mg IV if symptomatic (rate-related)", "Pacing rarely required (unlike Mobitz II)"],
    pearl: "Wenckebach is 'warm and fuzzy' — block is at the AV node, QRS is narrow, and it rarely progresses to complete heart block. Mobitz II is the dangerous one — block is infranodal and more likely to progress to CHB requiring pacing.",
    severity: "moderate",
  },
  {
    id: "avblock2ii", label: "2nd Degree AV Block — Mobitz II", category: "conduction",
    color: T.orange, icon: "⚠️",
    rate: "Variable — depends on degree of block (2:1, 3:1)", regularity: "Irregular (regularly irregular)",
    p_wave: "Normal; more P waves than QRS complexes", pr: "Constant PR in conducted beats — then sudden drop", qrs: "Wide (usually — infranodal block)", qt: "Normal to prolonged",
    description: "Sudden non-conducted P waves without prior PR prolongation — infranodal block, high risk of progression to CHB.",
    criteria: ["Constant PR interval in conducted beats", "Sudden dropped QRS without PR lengthening", "P:QRS ratio > 1:1 (2:1, 3:1, etc)", "QRS often wide (bundle branch disease below AV node)"],
    causes: ["Anterior MI (LAD territory — bundle branch damage)", "Cardiac surgery or catheterization", "Myocarditis, Lyme disease", "Idiopathic conduction system disease (Lenegre)"],
    management: ["Transcutaneous pacing on standby immediately", "Permanent pacemaker indicated — unpredictable progression to CHB", "Avoid medications that slow AV conduction", "Cardiology consult — admission for pacemaker placement"],
    pearl: "Mobitz II always requires pacemaker evaluation — it can progress to complete heart block without warning. A 2:1 block cannot be classified as Mobitz I or II without a sequence showing PR changes — need at least two conducted beats in a row.",
    severity: "urgent",
  },
  {
    id: "chb", label: "Complete Heart Block (3rd Degree AV Block)", category: "conduction",
    color: T.red, icon: "🛑",
    rate: "Atrial: 60–100; Ventricular: 20–40 (escape)", regularity: "Regular P-P and R-R independently",
    p_wave: "Normal P waves with no relation to QRS", pr: "Variable — no constant PR interval", qrs: "Wide (junctional or ventricular escape)", qt: "Prolonged",
    description: "Complete failure of AV conduction — atria and ventricles beat independently. Hemodynamically unstable emergency.",
    criteria: ["P waves and QRS completely independent (AV dissociation)", "Regular P-P interval at normal rate", "Regular R-R interval at slow escape rate (20–40 if ventricular)", "Wide escape QRS if ventricular focus; narrow if junctional (higher rate, more stable)"],
    causes: ["Inferior MI (RCA — usually temporary)", "Anterior MI (LAD — usually permanent, pacemaker required)", "Lyme carditis", "Medications: digoxin toxicity, beta-blockers, CCBs", "Degenerative conduction disease"],
    management: ["Atropine 0.5–1 mg IV (effective only if junctional escape)", "Transcutaneous pacing immediately if hemodynamically unstable", "Transvenous pacing — definitive until permanent pacer placed", "Cardiology and electrophysiology consult STAT"],
    pearl: "Junctional escape in CHB has narrow QRS and rate 40–60 — more stable. Ventricular escape has wide QRS and rate 20–40 — less reliable, more emergent. In inferior MI, CHB is usually reversible; in anterior MI, usually requires permanent pacemaker.",
    severity: "critical",
  },
  {
    id: "lbbb", label: "Left Bundle Branch Block", category: "conduction",
    color: T.cyan, icon: "↙️",
    rate: "Depends on underlying rhythm", regularity: "Depends on underlying rhythm",
    p_wave: "Normal", pr: "Normal or slightly prolonged", qrs: "> 0.12 sec (broad, notched)", qt: "Prolonged (due to wide QRS)",
    description: "Complete failure of left bundle conduction causing sequential ventricular activation — QRS ≥ 0.12 sec with characteristic morphology.",
    criteria: ["QRS ≥ 0.12 sec", "Broad, notched R (M-shape) in lateral leads (I, aVL, V5–V6)", "Broad S in V1", "Absence of Q waves in I, V5–V6 (normally present)", "ST depression and T-wave inversions in lateral leads (secondary changes)"],
    causes: ["CAD and prior MI (most common)", "Cardiomyopathy (dilated, hypertrophic)", "Hypertension with LVH", "Aortic stenosis", "Idiopathic (Lenegre disease)"],
    management: ["New LBBB + chest pain: treat as STEMI equivalent until proven otherwise", "Apply Sgarbossa criteria to identify concurrent MI", "Echo to assess LV function", "Cardiac resynchronization therapy (CRT-D) if HFrEF + QRS > 130 ms"],
    pearl: "New LBBB in the context of acute chest pain is a STEMI equivalent — activate the cath lab. Modified Sgarbossa: ST/S ratio > 0.25 in any lead with discordant changes is highly specific for concurrent MI (Better-Smith modification).",
    severity: "moderate",
  },
  {
    id: "rbbb", label: "Right Bundle Branch Block", category: "conduction",
    color: T.blue, icon: "↗️",
    rate: "Depends on underlying rhythm", regularity: "Depends on underlying rhythm",
    p_wave: "Normal", pr: "Normal", qrs: "> 0.12 sec", qt: "Prolonged",
    description: "Delayed right ventricular activation causing characteristic RSR' pattern in V1 and broad S in lateral leads.",
    criteria: ["QRS ≥ 0.12 sec", "RSR' (rabbit ears) in V1–V2", "Broad S wave in leads I, aVL, V5–V6", "T-wave inversion in V1–V3 (normal secondary change)", "Incomplete RBBB: QRS 0.10–0.12 sec with same morphology"],
    causes: ["Normal variant (isolated RBBB, often in otherwise healthy patients)", "PE — new RBBB + S1Q3T3 pattern", "RV pressure overload (pulmonary HTN)", "Brugada syndrome (RBBB-like pattern + ST elevation V1–V3)", "ASD, congenital heart disease"],
    management: ["Isolated RBBB without symptoms: may be benign", "New RBBB + dyspnea: evaluate for PE immediately", "New RBBB + anterior MI: bifascicular block with risk of CHB — pacing standby", "Brugada pattern: cardiology and EP referral"],
    pearl: "New RBBB + right heart strain pattern (S1Q3T3) in a dyspneic patient = PE until proven otherwise. S1Q3T3 alone has poor sensitivity (20%) but high specificity — its presence should trigger CTA chest immediately.",
    severity: "moderate",
  },
  {
    id: "longqt", label: "Long QT Syndrome", category: "repolarization",
    color: T.purple, icon: "📏",
    rate: "Normal unless torsades de pointes", regularity: "Regular at baseline",
    p_wave: "Normal", pr: "Normal", qrs: "Normal", qt: "QTc > 450 ms (male) or > 470 ms (female)",
    description: "Prolonged ventricular repolarization predisposing to torsades de pointes and sudden cardiac death.",
    criteria: ["QTc > 450 ms (males) or > 470 ms (females) — symptomatic concern", "QTc > 500 ms — high risk for torsades de pointes", "Measure QT in lead II or V5; QTc = QT ÷ √(RR interval in seconds)"],
    causes: ["Congenital: LQT1 (KCNQ1), LQT2 (KCNH2), LQT3 (SCN5A)", "Acquired: antibiotics (azithromycin), antipsychotics (haloperidol), antiarrhythmics (sotalol, amiodarone)", "Electrolytes: hypokalemia, hypomagnesemia, hypocalcemia", "Acute MI, myocarditis, bradycardia"],
    management: ["Torsades de Pointes: magnesium 2 g IV over 2–5 min (even if Mg normal)", "Correct electrolytes aggressively: K+ > 4.5, Mg > 2.0", "Overdrive pacing at 90–110 bpm suppresses torsades", "Stop all QT-prolonging medications immediately", "Congenital LQT: beta-blockers, ICD for high-risk patients"],
    pearl: "Rule of thumb: QTc > 500 ms = high torsades risk. Torsades is self-terminating but frequently recurs and can degenerate to VF. Give magnesium empirically even if level is normal — it stabilizes cardiac membranes. Never treat torsades with amiodarone (further prolongs QT).",
    severity: "urgent",
  },
  {
    id: "brugada", label: "Brugada Syndrome", category: "channelopathy",
    color: T.purple, icon: "🧬",
    rate: "Normal at baseline", regularity: "Regular at baseline",
    p_wave: "Normal", pr: "Normal or slightly prolonged", qrs: "RBBB-like morphology in V1–V3", qt: "Normal",
    description: "Inherited sodium channelopathy causing characteristic ECG pattern and risk of sudden cardiac death from VF.",
    criteria: ["Type 1 (Diagnostic): Coved ST elevation ≥ 2 mm with negative T wave in ≥ 1 of V1–V2 (spontaneous or drug-induced)", "Type 2: Saddle-back pattern ST elevation — not diagnostic alone", "Spontaneous type 1 pattern higher risk than drug-induced"],
    causes: ["Autosomal dominant SCN5A mutation (30%)", "Fever can unmask pattern (febrile Brugada)", "Sodium channel blockers (ajmaline, flecainide) provoke pattern in latent cases", "Male predominance, Asian ethnicity higher prevalence"],
    management: ["Asymptomatic type 1: risk stratification with EP study", "Symptomatic (syncope, aborted SCA): ICD implantation", "Treat fever aggressively — reduce to normothermia", "Avoid sodium channel blockers, avoid excessive EtOH", "Quinidine for recurrent ICD shocks (quinidine reduces VT/VF burden)"],
    pearl: "Brugada pattern can be unmasked by fever, sodium channel blockers, hyponatremia, or vagotonic states. Febrile Brugada — check ECG during every fever in known Brugada patients. ICDs in Brugada do not require ATP therapy — first therapy should be shock.",
    severity: "urgent",
  },
  {
    id: "hyperkalemia", label: "Hyperkalemia (ECG Changes)", category: "electrolyte",
    color: T.yellow, icon: "🧪",
    rate: "Variable (bradycardia as worsens)", regularity: "Regular early; irregular late",
    p_wave: "Flattened and widened → absent in severe", pr: "Prolonged with increasing K+", qrs: "Widening → sine wave pattern in severe", qt: "Variable",
    description: "Progressive ECG changes with rising serum potassium — from peaked T waves to fatal sine wave and cardiac arrest.",
    criteria: ["K+ 5.5–6.5: peaked, narrow T waves (first sign)", "K+ 6.5–7.5: PR prolongation, QRS widening, P wave loss", "K+ > 7.5: progressive QRS widening → sine wave pattern", "K+ > 8–9: VF or asystole"],
    causes: ["Renal failure (most common)", "ACEi/ARB + K-sparing diuretics", "Acidosis (0.6 mEq/L rise per 0.1 pH unit drop)", "Rhabdomyolysis, hemolysis, crush injury", "Addison disease, hypoaldosteronism"],
    management: ["QRS > 120 ms or hemodynamic instability: calcium gluconate 3 g IV over 10 min (membrane stabilization)", "Insulin 10 units IV + dextrose 50 g IV (shifts K+ into cells — onset 15 min)", "Albuterol 10–20 mg nebulized (shifts K+ — onset 20–30 min)", "Kayexalate or patiromer for non-emergent removal", "Dialysis for severe or refractory hyperkalemia"],
    pearl: "Calcium stabilizes the cardiac membrane within 2–3 minutes — it does NOT lower serum K+. Check every ECG in renal patients for peaked T waves. Do not rely solely on the serum K+ level — ECG changes determine treatment urgency.",
    severity: "urgent",
  },
  {
    id: "pe_ecg", label: "Pulmonary Embolism (ECG)", category: "other",
    color: T.blue, icon: "🫁",
    rate: "Sinus tachycardia (most common)", regularity: "Regular (sinus tachycardia)",
    p_wave: "Normal or P pulmonale", pr: "Normal", qrs: "May show RBBB or S1Q3T3", qt: "Prolonged in massive PE",
    description: "ECG in PE is primarily useful for risk stratification and ruling out other diagnoses (STEMI). No single ECG finding is diagnostic.",
    criteria: ["Sinus tachycardia — most common finding (44%)", "S1Q3T3: deep S in I, Q in III, inverted T in III (20% sensitivity)", "New RBBB — right heart strain", "T-wave inversions V1–V4 (right heart strain pattern)", "Normal ECG does not exclude PE — 25% of PE have normal ECG"],
    causes: ["DVT (proximal > distal)", "Prolonged immobility, surgery, malignancy", "Oral contraceptives, pregnancy", "Air, fat, amniotic fluid embolism"],
    management: ["If ECG shows RBBB + hemodynamic instability → systemic thrombolytics (tPA 100 mg over 2h)", "Heparin anticoagulation for submassive and massive PE", "Catheter-directed thrombolysis for submassive with deterioration", "Surgical embolectomy for contraindication to lysis with massive PE"],
    pearl: "S1Q3T3 has only 20% sensitivity for PE — a negative finding does NOT exclude it. Sinus tachycardia is the most sensitive but least specific. A normal ECG in a tachycardic patient should raise suspicion for PE.",
    severity: "urgent",
  },
];

const CATEGORIES = [
  { id: "all", label: "All", icon: "📊", color: T.txt2 },
  { id: "emergency", label: "Emergency", icon: "🚨", color: T.red },
  { id: "arrhythmia", label: "Arrhythmias", icon: "〰️", color: T.orange },
  { id: "conduction", label: "Conduction", icon: "⚙️", color: T.cyan },
  { id: "preexcitation", label: "Pre-excitation", icon: "⚡", color: T.purple },
  { id: "repolarization", label: "Repolarization", icon: "📏", color: T.purple },
  { id: "channelopathy", label: "Channelopathies", icon: "🧬", color: T.purple },
  { id: "electrolyte", label: "Electrolytes", icon: "🧪", color: T.yellow },
  { id: "normal", label: "Normal", icon: "✅", color: T.green },
  { id: "other", label: "Other", icon: "🔬", color: T.blue },
];

const SEVERITY_CONFIG = {
  critical: { label: "Critical", color: T.red, bg: "rgba(248,113,113,0.15)" },
  urgent: { label: "Urgent", color: T.orange, bg: "rgba(251,146,60,0.12)" },
  moderate: { label: "Moderate", color: T.yellow, bg: "rgba(251,191,36,0.10)" },
  benign: { label: "Benign", color: T.green, bg: "rgba(52,211,153,0.10)" },
};

const INTERVALS = [
  { key: "rate", label: "Rate", icon: "❤️" },
  { key: "regularity", label: "Regularity", icon: "📐" },
  { key: "p_wave", label: "P Wave", icon: "Ⓟ" },
  { key: "pr", label: "PR Interval", icon: "→" },
  { key: "qrs", label: "QRS", icon: "△" },
  { key: "qt", label: "QT", icon: "⟺" },
];

// ── ECG Tracing SVG ────────────────────────────────────────────────────────
function ECGTracing({ color = T.green, type = "nsr" }) {
  const waves = {
    nsr: "M0,40 L20,40 L25,35 L30,40 L45,40 L50,10 L55,50 L58,40 L65,30 L70,40 L85,40 L90,40 L95,35 L100,40 L115,40 L120,10 L125,50 L128,40 L135,30 L140,40",
    afib: "M0,40 L5,38 L8,42 L12,39 L16,41 L20,38 L24,42 L28,40 L33,37 L36,43 L44,40 L48,10 L53,50 L56,40 L60,39 L64,42 L68,38 L72,41 L76,40 L82,37 L85,42 L95,40 L100,10 L105,50 L108,40",
    vt: "M0,40 L10,40 L15,15 L25,55 L35,40 L50,40 L55,15 L65,55 L75,40 L90,40 L95,15 L105,55 L115,40 L130,40 L135,15 L145,55",
    stemi: "M0,40 L20,40 L25,42 L30,40 L45,40 L50,10 L52,25 L55,20 L60,22 L65,30 L70,40 L85,40 L90,42 L95,40 L110,40 L115,10 L117,25 L120,20 L125,22 L130,30 L135,40",
    lbbb: "M0,40 L15,40 L20,35 L28,45 L35,37 L42,40 L50,10 L55,45 L65,40 L80,40 L85,35 L93,45 L100,37 L107,40 L115,10 L120,45 L130,40",
    chb: "M0,40 L10,36 L13,40 L30,40 L40,10 L45,50 L47,40 L60,40 L70,36 L73,40 L90,40 L110,36 L113,40 L130,40 L150,10 L155,50",
  };
  const d = waves[type] || waves.nsr;
  return (
    <svg viewBox="0 0 160 60" style={{ width: "100%", height: 56, display: "block" }}>
      <defs>
        <linearGradient id={`ecg-grad-${type}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="20%" stopColor={color} stopOpacity="1" />
          <stop offset="80%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id={`ecg-glow-${type}`}>
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Grid */}
      {[0, 32, 64, 96, 128, 160].map(x => (
        <line key={`v${x}`} x1={x} y1="0" x2={x} y2="60" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
      ))}
      {[0, 15, 30, 45, 60].map(y => (
        <line key={`h${y}`} x1="0" y1={y} x2="160" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
      ))}
      <path d={d} fill="none" stroke={`url(#ecg-grad-${type})`} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" filter={`url(#ecg-glow-${type})`} />
    </svg>
  );
}

// ── Rhythm List Item ───────────────────────────────────────────────────────
function RhythmRow({ rhythm, active, onClick }) {
  const sev = SEVERITY_CONFIG[rhythm.severity] || SEVERITY_CONFIG.benign;
  return (
    <div onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10,
      border: `1px solid ${active ? rhythm.color + "50" : "rgba(42,79,122,0.3)"}`,
      background: active ? `${rhythm.color}12` : "rgba(8,22,40,0.4)",
      cursor: "pointer", transition: "all .15s",
    }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{rhythm.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "DM Sans", fontSize: 12, fontWeight: 600, color: active ? rhythm.color : T.txt, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{rhythm.label}</div>
        <div style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: T.txt4, marginTop: 1 }}>{rhythm.rate}</div>
      </div>
      <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: sev.bg, color: sev.color, whiteSpace: "nowrap", flexShrink: 0 }}>{sev.label}</span>
    </div>
  );
}

// ── Interval Row ───────────────────────────────────────────────────────────
function IntervalRow({ icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, background: "rgba(14,37,68,0.6)", border: "1px solid rgba(42,79,122,0.3)" }}>
      <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: T.txt3, width: 18, textAlign: "center", flexShrink: 0 }}>{icon}</span>
      <span style={{ fontFamily: "DM Sans", fontSize: 11, color: T.txt3, width: 80, flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: T.txt, flex: 1 }}>{value}</span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ECGHub() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("stemi");
  const [catFilter, setCatFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [aiInput, setAiInput] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});

  const filtered = RHYTHMS.filter(r =>
    (catFilter === "all" || r.category === catFilter) &&
    r.label.toLowerCase().includes(search.toLowerCase())
  );

  const current = RHYTHMS.find(r => r.id === selected) || RHYTHMS[0];
  const sev = SEVERITY_CONFIG[current.severity] || SEVERITY_CONFIG.benign;

  const toggleCheck = (key) => setCheckedItems(p => ({ ...p, [key]: !p[key] }));

  const runAI = async () => {
    if (!aiInput.trim() || aiBusy) return;
    setAiBusy(true); setAiResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a board-certified cardiologist and electrophysiologist. Answer this ECG/arrhythmia question concisely and accurately. Return ONLY valid JSON.
Question: ${aiInput}
Format: {"summary":"Direct clinical answer","keyPoints":["Point 1","Point 2","Point 3"],"management":["Action 1","Action 2"],"caution":"Warning or null"}`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            keyPoints: { type: "array", items: { type: "string" } },
            management: { type: "array", items: { type: "string" } },
            caution: { type: "string" },
          }
        }
      });
      setAiResult(res);
    } catch (e) {
      setAiResult({ summary: "AI query failed. Please try again.", keyPoints: [], management: [], caution: null });
    } finally {
      setAiBusy(false);
    }
  };

  const glass = {
    background: "rgba(8,22,40,0.7)", backdropFilter: "blur(20px)",
    border: "1px solid rgba(42,79,122,0.35)", borderRadius: 14,
    boxShadow: "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
  };

  const sidebarItems = [
    { icon: "🏠", label: "Home", to: "/" },
    { icon: "📊", label: "Dash", to: "/Dashboard" },
    { icon: "👥", label: "Patients", to: "/PatientDashboard" },
    { icon: "🏥", label: "Hub", to: "/hub" },
    { icon: "🏷️", label: "Triage", to: "/triage-hub" },
    { icon: "⚡", label: "Rapid", to: "/rapid-assessment-hub" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg, fontFamily: "DM Sans, sans-serif", color: T.txt, position: "relative" }}>

      {/* Ambient background */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-5%", left: "15%", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${T.red}12 0%, transparent 65%)` }} />
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${T.blue}10 0%, transparent 65%)` }} />
        <div style={{ position: "absolute", top: "40%", left: "5%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${T.purple}08 0%, transparent 65%)` }} />
      </div>

      <style>{`
        @keyframes ecg-appear { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: rgba(42,79,122,0.5); border-radius: 2px; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.18); }
        button { outline: none; }
      `}</style>

      {/* Left Sidebar */}
      <nav style={{ width: 72, flexShrink: 0, background: "#040d19", borderRight: "1px solid rgba(26,53,85,0.7)", display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0", gap: 2, position: "relative", zIndex: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: `linear-gradient(135deg, ${T.red}40, ${T.red}20)`, border: `1px solid ${T.red}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 12 }}>❤️</div>
        {sidebarItems.map(item => (
          <button key={item.to} onClick={() => navigate(item.to)} title={item.label}
            style={{ width: 52, height: 52, borderRadius: 11, border: "1px solid transparent", background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, cursor: "pointer", transition: "all .2s", color: T.txt4 }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(14,37,68,0.6)"; e.currentTarget.style.color = T.txt2; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.txt4; }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 8, fontWeight: 600 }}>{item.label}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => navigate("/hub")} title="Hub"
          style={{ width: 52, height: 52, borderRadius: 11, border: `1px solid ${T.red}30`, background: `${T.red}10`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, cursor: "pointer", color: T.red, fontSize: 9, fontWeight: 700 }}>
          <span style={{ fontSize: 18 }}>🏥</span>
          Hub
        </button>
      </nav>

      {/* Main */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", zIndex: 1, overflow: "hidden", maxHeight: "100vh" }}>

        {/* Header */}
        <header style={{ ...glass, borderRadius: 0, borderLeft: "none", borderRight: "none", borderTop: "none", padding: "16px 28px", flexShrink: 0, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${T.red}30, ${T.red}15)`, border: `1px solid ${T.red}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🫀</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <h1 style={{ fontFamily: "Playfair Display", fontSize: 24, fontWeight: 700, color: T.txt, lineHeight: 1, margin: 0 }}>ECG Interpretation Hub</h1>
              <span style={{ fontSize: 9, fontFamily: "JetBrains Mono", fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: `${T.red}18`, color: T.red, border: `1px solid ${T.red}35` }}>{RHYTHMS.length} RHYTHMS</span>
            </div>
            <p style={{ fontFamily: "DM Sans", fontSize: 12, color: T.txt3, margin: 0 }}>Systematic ECG analysis · Diagnostic criteria · Evidence-based management · AI interpreter</p>
          </div>
          {/* Stat chips */}
          <div style={{ display: "flex", gap: 8 }}>
            {[["⚡", "Rate", "HR"], ["📐", "Rhythm", "P-QRS-T"], ["🔬", "Axis", "0–90°"]].map(([ico, l, v]) => (
              <div key={l} style={{ background: "rgba(14,37,68,0.7)", border: "1px solid rgba(42,79,122,0.4)", borderRadius: 10, padding: "8px 12px", textAlign: "center", minWidth: 60 }}>
                <div style={{ fontSize: 14 }}>{ico}</div>
                <div style={{ fontSize: 9, color: T.txt4, fontFamily: "JetBrains Mono", textTransform: "uppercase", letterSpacing: 1 }}>{l}</div>
              </div>
            ))}
          </div>
        </header>

        {/* Body */}
        <div style={{ flex: 1, display: "flex", gap: 0, overflow: "hidden" }}>

          {/* Left Panel — Rhythm List */}
          <div style={{ width: 260, flexShrink: 0, borderRight: "1px solid rgba(42,79,122,0.3)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "12px 12px 8px", flexShrink: 0 }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rhythms…"
                style={{ width: "100%", background: "rgba(14,37,68,0.8)", border: "1px solid rgba(42,79,122,0.4)", borderRadius: 9, padding: "7px 12px", color: T.txt, fontFamily: "DM Sans", fontSize: 12, outline: "none" }}
                onFocus={e => e.target.style.borderColor = `${T.red}60`}
                onBlur={e => e.target.style.borderColor = "rgba(42,79,122,0.4)"} />
              <div style={{ display: "flex", gap: 4, marginTop: 8, overflowX: "auto", paddingBottom: 4 }}>
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setCatFilter(cat.id)}
                    style={{ padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: catFilter === cat.id ? 700 : 400, fontFamily: "DM Sans", cursor: "pointer", whiteSpace: "nowrap", transition: "all .15s", background: catFilter === cat.id ? `${cat.color}18` : "transparent", border: `1px solid ${catFilter === cat.id ? cat.color + "50" : "rgba(42,79,122,0.3)"}`, color: catFilter === cat.id ? cat.color : T.txt4 }}>
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "4px 12px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
              {filtered.length === 0 && <div style={{ textAlign: "center", padding: 20, color: T.txt4, fontSize: 12 }}>No rhythms found</div>}
              {filtered.map(r => (
                <RhythmRow key={r.id} rhythm={r} active={selected === r.id} onClick={() => { setSelected(r.id); setActiveTab("overview"); setCheckedItems({}); }} />
              ))}
            </div>
            <div style={{ padding: "8px 12px", borderTop: "1px solid rgba(42,79,122,0.3)", fontFamily: "JetBrains Mono", fontSize: 9, color: T.txt4, textAlign: "center" }}>
              {filtered.length}/{RHYTHMS.length} rhythms
            </div>
          </div>

          {/* Right Panel — Detail */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }} key={current.id}>

            {/* Rhythm Header with ECG Tracing */}
            <div style={{ ...glass, padding: "20px 22px", borderLeft: `4px solid ${current.color}`, background: `linear-gradient(135deg, ${current.color}14, rgba(8,22,40,0.9))`, animation: "ecg-appear .3s ease" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
                <span style={{ fontSize: 36 }}>{current.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                    <h2 style={{ fontFamily: "Playfair Display", fontSize: 24, fontWeight: 700, color: T.txt, margin: 0 }}>{current.label}</h2>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: sev.bg, border: `1px solid ${current.color}40`, color: sev.color }}>{sev.label.toUpperCase()}</span>
                    <span style={{ fontSize: 9, fontFamily: "JetBrains Mono", padding: "3px 9px", borderRadius: 20, background: `${current.color}12`, border: `1px solid ${current.color}30`, color: current.color, textTransform: "uppercase", letterSpacing: 1 }}>{current.category}</span>
                  </div>
                  <p style={{ fontFamily: "DM Sans", fontSize: 13, color: T.txt2, margin: 0, lineHeight: 1.55 }}>{current.description}</p>
                </div>
              </div>
              {/* ECG Tracing */}
              <div style={{ background: "rgba(4,8,15,0.7)", borderRadius: 10, border: `1px solid ${current.color}20`, padding: "8px 12px" }}>
                <div style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: T.txt4, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Representative Tracing</div>
                <ECGTracing color={current.color} type={["stemi", "vt", "vfib", "chb"].includes(current.id) ? current.id : ["afib", "aflutter"].includes(current.id) ? "afib" : ["lbbb", "rbbb"].includes(current.id) ? "lbbb" : "nsr"} />
              </div>
            </div>

            {/* Tab Nav */}
            <div style={{ display: "flex", gap: 4, background: "rgba(8,22,40,0.6)", border: "1px solid rgba(42,79,122,0.3)", borderRadius: 12, padding: 4 }}>
              {[
                { id: "overview", label: "Overview", icon: "📋" },
                { id: "criteria", label: "Criteria", icon: "✅" },
                { id: "management", label: "Management", icon: "💊" },
                { id: "ai", label: "AI Interpreter", icon: "🤖" },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 12px", borderRadius: 9, border: `1px solid ${activeTab === tab.id ? current.color + "40" : "transparent"}`, background: activeTab === tab.id ? `${current.color}18` : "transparent", color: activeTab === tab.id ? current.color : T.txt3, fontFamily: "DM Sans", fontSize: 12, fontWeight: activeTab === tab.id ? 700 : 400, cursor: "pointer", transition: "all .15s" }}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "ecg-appear .3s ease" }}>
                {/* Interval Grid */}
                <div style={{ ...glass, padding: "16px 18px" }}>
                  <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: T.txt4, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>ECG Intervals & Morphology</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {INTERVALS.map(iv => <IntervalRow key={iv.key} icon={iv.icon} label={iv.label} value={current[iv.key] || "—"} />)}
                  </div>
                </div>
                {/* Causes */}
                <div style={{ ...glass, padding: "16px 18px" }}>
                  <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: T.txt4, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>Common Causes / Etiology</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {(current.causes || []).map((c, i) => (
                      <span key={i} style={{ fontSize: 11, fontFamily: "DM Sans", padding: "4px 10px", borderRadius: 20, background: `${current.color}10`, border: `1px solid ${current.color}25`, color: T.txt2 }}>{c}</span>
                    ))}
                  </div>
                </div>
                {/* Pearl */}
                {current.pearl && (
                  <div style={{ padding: "14px 18px", background: `linear-gradient(135deg, ${current.color}12, rgba(8,22,40,0.8))`, border: `1px solid ${current.color}30`, borderRadius: 14 }}>
                    <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: current.color, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>💎 Clinical Pearl</div>
                    <p style={{ fontFamily: "DM Sans", fontSize: 13, color: T.txt2, lineHeight: 1.7, fontStyle: "italic", margin: 0 }}>{current.pearl}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "criteria" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "ecg-appear .3s ease" }}>
                <div style={{ ...glass, padding: "16px 18px" }}>
                  <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: T.txt4, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Diagnostic Criteria — Checklist</div>
                  {(current.criteria || []).map((c, i) => {
                    const key = `${current.id}-${i}`;
                    const checked = !!checkedItems[key];
                    return (
                      <div key={i} onClick={() => toggleCheck(key)}
                        style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 9, marginBottom: 5, cursor: "pointer", background: checked ? `${current.color}10` : "rgba(14,37,68,0.4)", border: `1px solid ${checked ? current.color + "40" : "rgba(42,79,122,0.3)"}`, transition: "all .15s" }}>
                        <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${checked ? current.color : "rgba(42,79,122,0.6)"}`, background: checked ? current.color : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", marginTop: 1 }}>
                          {checked && <span style={{ fontSize: 11, color: "#050f1e" }}>✓</span>}
                        </div>
                        <span style={{ fontFamily: "DM Sans", fontSize: 12, color: checked ? current.color : T.txt2, lineHeight: 1.5, textDecoration: checked ? "line-through" : "none", opacity: checked ? 0.7 : 1 }}>{c}</span>
                      </div>
                    );
                  })}
                </div>
                {/* STEMI territories */}
                {current.territories && (
                  <div style={{ ...glass, padding: "16px 18px" }}>
                    <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: T.red, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>🗺️ STEMI Territories</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {current.territories.map((ter, i) => (
                        <div key={i} style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(14,37,68,0.5)", border: "1px solid rgba(42,79,122,0.3)" }}>
                          <div style={{ fontFamily: "DM Sans", fontSize: 12, fontWeight: 700, color: T.red, marginBottom: 3 }}>{ter.name}</div>
                          <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: T.yellow, marginBottom: 4 }}>Leads: {ter.leads}</div>
                          <div style={{ fontSize: 10, color: T.txt3, marginBottom: 3 }}>Artery: {ter.artery}</div>
                          <div style={{ fontSize: 10, color: T.txt2, lineHeight: 1.4 }}>{ter.note}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* STEMI equivalents */}
                {current.equivalents && (
                  <div style={{ ...glass, padding: "16px 18px" }}>
                    <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: T.orange, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>⚡ STEMI Equivalents</div>
                    {current.equivalents.map((eq, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                        <span style={{ color: T.orange, fontSize: 11, flexShrink: 0, marginTop: 1 }}>▸</span>
                        <span style={{ fontFamily: "DM Sans", fontSize: 12, color: T.txt2 }}>{eq}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "management" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "ecg-appear .3s ease" }}>
                <div style={{ ...glass, padding: "16px 18px", borderLeft: `3px solid ${current.color}` }}>
                  <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: T.txt4, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Management Protocol</div>
                  {(current.management || []).map((step, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 12px", marginBottom: 6, background: "rgba(14,37,68,0.5)", border: "1px solid rgba(42,79,122,0.3)", borderRadius: 9 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 7, background: `${current.color}20`, border: `1px solid ${current.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 700, color: current.color, flexShrink: 0 }}>{i + 1}</div>
                      <p style={{ fontFamily: "DM Sans", fontSize: 12, color: T.txt2, margin: 0, lineHeight: 1.55 }}>{step}</p>
                    </div>
                  ))}
                </div>
                {current.pearl && (
                  <div style={{ padding: "14px 18px", background: `linear-gradient(135deg, ${current.color}12, rgba(8,22,40,0.8))`, border: `1px solid ${current.color}30`, borderRadius: 14 }}>
                    <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: current.color, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>💎 Clinical Pearl</div>
                    <p style={{ fontFamily: "DM Sans", fontSize: 13, color: T.txt2, lineHeight: 1.7, fontStyle: "italic", margin: 0 }}>{current.pearl}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "ai" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "ecg-appear .3s ease" }}>
                <div style={{ ...glass, padding: "20px 22px", borderLeft: `3px solid ${T.purple}` }}>
                  <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: T.purple, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>🤖 AI ECG Interpreter</div>
                  <p style={{ fontFamily: "DM Sans", fontSize: 12, color: T.txt3, marginBottom: 12 }}>Ask any ECG or arrhythmia question — interpreted by an AI cardiology consultant.</p>
                  <textarea value={aiInput} onChange={e => setAiInput(e.target.value)} rows={4}
                    placeholder={`e.g. "What is the Sgarbossa criteria for LBBB?"\n     "How do I differentiate VT from SVT with aberrancy?"\n     "What causes a prolonged QTc?"`}
                    style={{ width: "100%", background: "rgba(14,37,68,0.7)", border: `1px solid ${T.purple}30`, borderRadius: 10, padding: "12px 14px", color: T.txt, fontFamily: "DM Sans", fontSize: 13, outline: "none", lineHeight: 1.6, resize: "vertical" }}
                    onFocus={e => e.target.style.borderColor = `${T.purple}60`}
                    onBlur={e => e.target.style.borderColor = `${T.purple}30`} />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
                    <button onClick={() => { setAiInput(""); setAiResult(null); }}
                      style={{ padding: "8px 16px", borderRadius: 9, border: "1px solid rgba(42,79,122,0.4)", background: "transparent", color: T.txt3, fontFamily: "DM Sans", fontSize: 12, cursor: "pointer" }}>Clear</button>
                    <button onClick={runAI} disabled={aiBusy || !aiInput.trim()}
                      style={{ padding: "8px 22px", borderRadius: 9, border: `1px solid ${T.purple}50`, background: `${T.purple}20`, color: T.purple, fontFamily: "DM Sans", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: aiBusy || !aiInput.trim() ? 0.5 : 1, transition: "opacity .2s" }}>
                      {aiBusy ? "⏳ Thinking…" : "🤖 Ask AI"}
                    </button>
                  </div>
                </div>
                {aiResult && (
                  <div style={{ ...glass, padding: "18px 22px", animation: "ecg-appear .3s ease" }}>
                    {aiResult.summary && (
                      <div style={{ padding: "12px 14px", borderRadius: 10, background: `${T.purple}12`, border: `1px solid ${T.purple}30`, marginBottom: 12 }}>
                        <p style={{ fontFamily: "Playfair Display", fontSize: 14, color: T.txt, fontStyle: "italic", lineHeight: 1.6, margin: 0 }}>{aiResult.summary}</p>
                      </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: aiResult.caution ? 10 : 0 }}>
                      {[{ k: "keyPoints", label: "Key Points", color: T.cyan }, { k: "management", label: "Clinical Actions", color: T.green }]
                        .filter(s => aiResult[s.k]?.length > 0)
                        .map(({ k, label, color }) => (
                          <div key={k} style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(14,37,68,0.5)", border: `1px solid ${color}20` }}>
                            <div style={{ fontFamily: "JetBrains Mono", fontSize: 9, color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{label}</div>
                            {aiResult[k].map((pt, idx) => <div key={idx} style={{ fontSize: 12, color: T.txt2, marginBottom: 5, lineHeight: 1.45 }}>▸ {pt}</div>)}
                          </div>
                        ))}
                    </div>
                    {aiResult.caution && aiResult.caution !== "null" && (
                      <div style={{ padding: "10px 14px", borderRadius: 9, background: `${T.orange}10`, border: `1px solid ${T.orange}30` }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: T.orange, marginRight: 6 }}>⚠ Caution:</span>
                        <span style={{ fontSize: 12, color: T.txt2 }}>{aiResult.caution}</span>
                      </div>
                    )}
                  </div>
                )}
                {/* Quick Prompts */}
                <div style={{ ...glass, padding: "14px 18px" }}>
                  <div style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: T.txt4, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Quick Prompts</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {[
                      "Sgarbossa criteria for LBBB + ACS",
                      "How to differentiate VT from SVT with aberrancy",
                      "Wellens syndrome patterns A and B",
                      "de Winter T-wave pattern",
                      "Torsades de pointes management",
                      "WPW + AFib emergency treatment",
                    ].map(prompt => (
                      <button key={prompt} onClick={() => setAiInput(prompt)}
                        style={{ fontSize: 11, fontFamily: "DM Sans", padding: "5px 12px", borderRadius: 20, background: "rgba(14,37,68,0.6)", border: `1px solid ${T.purple}25`, color: T.txt3, cursor: "pointer", transition: "all .15s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = `${T.purple}50`; e.currentTarget.style.color = T.purple; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = `${T.purple}25`; e.currentTarget.style.color = T.txt3; }}>
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}