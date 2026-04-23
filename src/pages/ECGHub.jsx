// ECGHub.jsx
// Notrya constraint fixes applied:
//   1. Removed `import { useNavigate } from "react-router-dom"` -- crashes outside Router context
//      Replaced with onBack prop (same pattern as LabInterpreter, MedsTab, DDxEngine)
//   2. Added `typeof document === "undefined"` guard to font IIFE
//   3. Added embedded + onBack props to main component
//   4. embedded=true suppresses standalone chrome (back button, header, footer)
//   5. Tab order resequenced: STEMI first (clinical), Pattern Library last (reference)

import { useState, useCallback, useMemo, useEffect } from "react";
// Sub-components -- register these files in Base44 under components/ecg/
// and update the import paths to match your project structure.
import ECGAIInterpreter from "@/components/ecg/ECGAIInterpreter";
import ECGNSTEMIHub     from "@/components/ecg/ECGNSTEMIHub";
import ECGAFPathway     from "@/components/ecg/ECGAFPathway";

// ── Font Injection ────────────────────────────────────────────────────
// FIX: typeof document guard -- prevents ReferenceError in non-browser environments
(() => {
  if (typeof document === "undefined") return;
  if (document.getElementById("ecg-fonts")) return;
  const l = document.createElement("link");
  l.id = "ecg-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "ecg-css";
  s.textContent = `
    *{box-sizing:border-box;margin:0;padding:0;}
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:rgba(42,79,122,0.5);border-radius:2px;}
    @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    @keyframes traceDraw{from{stroke-dashoffset:3000}to{stroke-dashoffset:0}}
    .fade-in{animation:fadeSlide .25s ease forwards;}
    .shimmer-text{background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#ff6b6b 52%,#f5c842 72%,#e8f0fe 100%);background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 5s linear infinite;}
    .ecg-line{stroke-dasharray:3000;animation:traceDraw 1.4s ease forwards;}
    .pat-card:hover{transform:translateY(-1px);transition:transform .15s;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36", up:"#0e2544",
  b:"rgba(26,53,85,0.8)", bhi:"rgba(42,79,122,0.9)",
  txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  red:"#ff4444", orange:"#ff9f43", yellow:"#f5c842", green:"#3dffa0",
  blue:"#3b9eff", purple:"#9b6dff", teal:"#00e5c0", coral:"#ff6b6b", cyan:"#00d4ff",
};
const glass = {backdropFilter:"blur(24px) saturate(200%)",WebkitBackdropFilter:"blur(24px) saturate(200%)",background:"rgba(8,22,40,0.75)",border:"1px solid rgba(42,79,122,0.35)",borderRadius:16};

// ── SVG ECG Trace Paths ──────────────────────────────────────────────
const W = {
  normal:
    "M0,58 L10,58 Q14,58 19,48 Q24,38 29,48 Q34,58 38,58 L40,62 L43,12 L47,67 L51,58 L62,58 Q66,58 72,41 Q78,24 84,41 Q90,58 96,58 L108,58 Q112,58 117,48 Q122,38 127,48 Q132,58 136,58 L138,62 L141,12 L145,67 L149,58 L160,58 Q164,58 170,41 Q176,24 182,41 Q188,58 194,58 L280,58",
  stemi:
    "M0,58 L10,58 Q14,58 19,48 Q24,38 29,48 Q34,58 38,58 L40,62 L44,10 L48,68 L52,42 L68,31 L85,26 Q93,18 101,26 Q109,34 115,48 L120,58 L280,58",
  posterior:
    "M0,58 L10,58 L12,62 L16,8 L26,54 L34,70 L52,70 L68,70 Q75,70 81,48 Q87,26 93,48 Q99,70 105,70 L120,58 L280,58",
  deWinter:
    "M0,58 L10,58 Q14,58 19,48 Q24,38 29,48 Q34,58 38,58 L40,62 L44,12 L48,70 L52,74 L94,13 L100,17 Q107,33 112,58 L280,58",
  avr:
    "M0,58 L10,58 L12,52 L17,40 L21,52 L24,63 L27,67 L31,58 L40,44 L57,36 Q64,28 71,36 Q78,44 85,57 L88,58 L280,58",
  wellensA:
    "M0,58 L10,58 Q14,58 19,48 Q24,38 29,48 Q34,58 38,58 L40,62 L43,14 L47,68 L51,58 L55,58 Q59,58 64,47 Q69,36 74,47 Q79,58 84,64 Q89,70 95,64 Q101,58 107,58 L280,58",
  wellensB:
    "M0,58 L10,58 Q14,58 19,48 Q24,38 29,48 Q34,58 38,58 L40,62 L43,14 L47,68 L51,58 L55,58 Q61,58 68,67 Q75,76 82,67 Q89,58 95,58 L280,58",
  brugada1:
    "M0,58 L10,58 L12,54 L15,65 L19,14 L25,32 Q31,41 39,48 Q47,55 53,61 Q59,66 65,70 Q71,72 75,67 Q79,62 83,58 L280,58",
  brugada2:
    "M0,58 L10,58 L12,54 L15,65 L19,14 L25,30 Q31,38 39,44 Q47,50 54,44 Q61,38 68,35 Q74,39 80,48 Q86,57 90,58 L280,58",
  wpw:
    "M0,58 L8,58 Q12,58 17,48 Q22,38 27,48 Q32,58 36,56 Q39,54 41,38 L45,10 L49,65 L53,58 L61,58 Q65,58 71,66 Q77,74 83,66 Q89,58 95,58 L280,58",
  arvc:
    "M0,58 L10,58 Q14,58 18,48 Q22,38 26,48 Q30,58 34,58 L36,62 L39,14 L42,68 L46,58 L47,62 L50,55 L53,62 L56,58 L62,58 Q66,58 71,65 Q76,72 82,65 Q88,58 94,58 L280,58",
  longqt:
    "M0,58 L10,58 Q14,58 18,48 Q22,38 26,48 Q30,58 34,58 L36,62 L39,12 L43,66 L47,58 L88,58 Q93,58 99,40 Q105,22 111,40 Q117,58 123,58 L280,58",
  hyperkalemia:
    "M0,58 L10,58 Q14,58 18,51 Q22,45 26,51 Q30,58 34,58 L36,62 L40,12 L44,68 L48,58 L52,58 L64,6 L76,58 L280,58",
  tca:
    "M0,58 L10,58 Q14,58 18,48 Q22,38 26,48 Q30,58 34,56 L36,61 L38,67 L43,10 L53,72 L59,58 L86,58 Q91,58 97,40 Q103,22 109,40 Q115,58 121,58 L280,58",
};

// ── Pattern Data ──────────────────────────────────────────────────────
const STEMI_PATS = [
  { id:"stemi", label:"Classic STEMI", lead:"V1-V4 (ant) · II/III/aVF (inf) · I/aVL (lat)", color:T.red, path:W.stemi,
    keyFeature:"STE >= 1mm (limb) or >= 2mm (precordial) in >=2 contiguous leads at J-point",
    criteria:["J-point elevation >= 1mm in >=2 contiguous limb leads","J-point elevation >= 2mm in >=2 contiguous precordial leads","Hyperacute T waves: tall, broad, asymmetric -- may precede STE by minutes","Reciprocal ST depression in anatomically opposite leads (inferior STEMI -> aVL depression)","New LBBB in appropriate clinical context = STEMI equivalent"],
    management:"Cath lab activation -- door-to-balloon goal < 90 min. ASA 325 mg + heparin + P2Y12 inhibitor. Avoid thrombolytics if PCI available.",
    pitfall:"STEMI can be completely painless in diabetics and the elderly. Check ECG in all undifferentiated syncope, AMS, and cardiogenic shock.",
    risk:"critical", evidence:"Class 1, B-NR -- 2025 ACC/AHA ACS",
  },
  { id:"posterior", label:"Posterior STEMI", lead:"V1-V3 (reciprocal) · confirm V7-V9", color:T.coral, path:W.posterior,
    keyFeature:"Tall broad R + ST depression + upright T in V1-V3 = mirror of posterior territory STE",
    criteria:["Tall R wave in V1 (R:S ratio > 1, R > 30ms wide)","ST depression in V1-V3 (not typical ischemia -- it is reciprocal STE)","Upright, tall T waves in V1-V3 (reciprocal of posterior T inversion)","Confirm: posterior leads V7-V9 -- STE >= 0.5mm is diagnostic","Often associated with inferior STEMI (RCA) or lateral STEMI (LCx)"],
    management:"Treat as STEMI equivalent -- activate cath. Place posterior leads V7-V9. Aspirin + heparin + P2Y12.",
    pitfall:"Most commonly missed STEMI. Providers look for ST elevation -- posterior STEMI shows depression in V1-V3. The tall upright T is a key clue.",
    risk:"critical",
  },
  { id:"deWinter", label:"De Winter T Waves", lead:"V1-V6 (precordial)", color:T.orange, path:W.deWinter,
    keyFeature:"J-point ST depression + upsloping ST segment + tall symmetric peaked T -- NO precordial STE",
    criteria:["Upsloping ST depression >= 1-3mm at J-point in V1-V6","Tall, prominent, symmetric peaked T waves following upsloping depression","No ST elevation in the precordial leads (this is the trap)","Often accompanied by STE in aVR","Represents complete proximal LAD occlusion"],
    management:"STEMI equivalent -- activate cath lab immediately. Proximal LAD occlusion. Same management as anterior STEMI.",
    pitfall:"ST depression + tall T is dismissed as demand ischemia or LVH. This is LAD occlusion. If you see it, call the cath lab.",
    risk:"critical",
  },
  { id:"wellensA", label:"Wellens Syndrome A", lead:"V2-V3 (precordial)", color:T.orange, path:W.wellensA,
    keyFeature:"Biphasic T waves in V2-V3: positive initial deflection then negative terminal component",
    criteria:["Biphasic T wave in V2-V3: positive (up) then negative (down) deflection","Preserved R wave amplitude (no significant Q waves)","Minimal or no ST elevation (< 1mm)","Hallmark: history of chest pain that is now RESOLVED in the ED","Represents critical proximal LAD stenosis in pain-free window"],
    management:"Urgent cardiology consult -- PCI within hours. Do NOT stress test -- can precipitate anterior STEMI. NPO, heparinize, cardiology at bedside.",
    pitfall:"Patient is pain-free in the ED and looks well. This pattern = active proximal LAD lesion on the verge of total occlusion.",
    risk:"critical",
  },
  { id:"wellensB", label:"Wellens Syndrome B", lead:"V2-V3 (precordial)", color:T.orange, path:W.wellensB,
    keyFeature:"Deep, symmetric T wave inversions in V2-V3 -- the more recognizable Wellens pattern",
    criteria:["Deep symmetric T wave inversions (> 2mm) in V2-V3","No significant R wave loss or Q waves","Characteristic: seen in pain-free interval after resolved chest pain","More specific than Wellens A; same critical proximal LAD significance","May extend to V1-V4 in severe lesions"],
    management:"Same as Wellens A -- urgent PCI. No stress testing. Heparin + P2Y12 + cardiology at bedside.",
    pitfall:"Deep T inversions in V2-V3 attributed to prior MI or normal variant. Context is everything -- chest pain + this pattern = Wellens B.",
    risk:"critical",
  },
  { id:"avr", label:"aVR Elevation (LMCA/3VD)", lead:"aVR (+-V1) with diffuse depression", color:T.red, path:W.avr,
    keyFeature:"STE in aVR >= 1mm + diffuse ST depression in >=6 leads = global subendocardial ischemia",
    criteria:["ST elevation in aVR >= 1mm","STE in aVR greater than STE in V1 (suggests LMCA over proximal LAD)","Diffuse ST depression in >=6 leads (I, II, V4-V6 most prominent)","Pattern indicates LMCA occlusion, proximal LAD stenosis, or severe 3-vessel disease","Associated with cardiogenic shock and high in-hospital mortality"],
    management:"Emergent cath -- LMCA occlusion has highest MI mortality. Consider IABP or Impella. Cardiothoracic surgery on standby.",
    pitfall:"Diffuse ST depression dismissed as demand ischemia from sepsis or tachycardia. The STE in aVR is the key distinguishing feature.",
    risk:"critical", evidence:"Class 1, B-NR -- 2025 ACC/AHA ACS",
  },
];

const DANGER_PATS = [
  { id:"brugada1", label:"Brugada Type 1 (Coved)", lead:"V1-V2 (move leads to 2nd ICS for sensitivity)", color:T.purple, path:W.brugada1,
    keyFeature:"Coved ST: J-point elevation >= 2mm + downsloping ST + inverted T in V1-V2",
    criteria:["rsR' or rSR' in V1-V2 (RBBB-like morphology)","J-wave/ST elevation >= 2mm with coved (concave-down) shape","ST segment slopes downward from the peak to the inverted T wave","Spontaneous Type 1 = diagnostic; drug-induced = diagnostic (procainamide/ajmaline challenge)","Associated with SCN5A sodium channel loss-of-function mutation"],
    management:"ICD for symptomatic Brugada (resuscitated arrest, syncope). Avoid sodium-channel-blocking drugs, fever, large meals, excess alcohol. Quinidine as adjunct.",
    pitfall:"Pattern is dynamic -- a normal ECG does not exclude Brugada syndrome. Fever classically unmasks the pattern -- check ECG in febrile syncope.",
    risk:"high", evidence:"Class 1, B-NR -- 2017 ACC/AHA/HRS VA",
  },
  { id:"brugada2", label:"Brugada Type 2 (Saddle-back)", lead:"V1-V2", color:T.purple, path:W.brugada2,
    keyFeature:"J-point elevation >= 2mm with saddle-back morphology (dip then positive or biphasic T)",
    criteria:["J-wave elevation >= 2mm in V1-V2","Saddle-back shape: high takeoff with ST that descends, then rises to positive or biphasic T","NOT diagnostic for Brugada syndrome alone -- requires drug provocation to convert to Type 1","Drug challenge with ajmaline or flecainide if available","Type 2 prevalence is 10x higher than Type 1 in the general population"],
    management:"Electrophysiology referral for provocation testing. Educate on Brugada-aggravating substances (brugadadrugs.org). Family screening.",
    pitfall:"Type 2 is frequently misidentified as Type 1. Key difference: saddle-back (positive terminal T) vs coved (inverted terminal T). Type 2 alone is NOT diagnostic.",
    risk:"high",
  },
  { id:"wpw", label:"WPW / Pre-Excitation", lead:"All 12 leads -- delta wave visible in multiple leads", color:T.yellow, path:W.wpw,
    keyFeature:"Short PR < 120ms + delta wave (slurred initial QRS) + wide QRS -- accessory pathway",
    criteria:["PR interval < 120ms (< 3 small boxes)","Delta wave: gradual initial slurring of QRS upstroke","Wide QRS > 120ms from delta wave contribution","Discordant ST-T changes opposite to delta wave direction","Risk of sudden death via pre-excited AF degenerating to VF"],
    management:"Electrophysiology referral for ablation. In pre-excited AF (wide, irregular, very fast): use procainamide or ibutilide -- NEVER adenosine, verapamil, diltiazem, or digoxin.",
    pitfall:"WPW with AF is frequently misidentified as VT (wide complex, irregular). Giving calcium-channel blockers or adenosine can cause VF. The irregular rate distinguishes it from VT.",
    risk:"high",
  },
  { id:"arvc", label:"ARVC / Epsilon Wave", lead:"V1-V3 · best seen with 3x gain", color:T.teal, path:W.arvc,
    keyFeature:"Epsilon wave: small terminal deflection after QRS in V1-V3 + T wave inversions V1-V3",
    criteria:["Epsilon wave: small notch or deflection at the terminal QRS in V1-V3 (increase gain to 3x to visualize)","T wave inversions in V1-V3 in the absence of complete RBBB","LBBB-morphology PVCs or VT (right ventricular origin)","Signal-averaged ECG shows late potentials","Structural RV abnormality on echo or cardiac MRI (fibro-fatty replacement)"],
    management:"Cardiology/EP referral. Restrict competitive athletics -- ARVC is a leading cause of sudden death in young athletes. ICD in high-risk patients. Sotalol for VT suppression.",
    pitfall:"Epsilon wave is extremely subtle at standard gain. Always increase to 3x in V1-V3 in young patients with LBBB-morphology VT or syncope.",
    risk:"high",
  },
  { id:"longqt", label:"Long QT / TdP Risk", lead:"All leads -- measure longest QT", color:T.red, path:W.longqt,
    keyFeature:"QTc >= 500ms = high TdP risk; QTc >= 600ms = imminent TdP in acquired prolongation",
    criteria:["QTc > 440ms (male) or > 460ms (female) = prolonged","QTc 440-500ms: borderline -- review drugs, correct electrolytes","QTc >= 500ms: high risk for Torsades de Pointes","QTc >= 600ms: treat immediately even if no symptoms","Congenital (LQTS1-3: KCNQ1, HERG, SCN5A) vs acquired (drugs, electrolytes)"],
    management:"Correct K+ > 4.0 mEq/L and Mg2+ > 2.0 mEq/L. Stop all QT-prolonging drugs. Mg2+ 2g IV for TdP. Overdrive pacing (rate 90-110) for recurrent TdP.",
    pitfall:"Always measure QT manually -- automated QT measurements are inaccurate in 30% of cases. Measure QTc in a long-cycle RR interval (not after short RR).",
    risk:"high",
  },
  { id:"hyperkalemia", label:"Hyperkalemia Spectrum", lead:"All leads -- peaked T best in precordials", color:T.orange, path:W.hyperkalemia,
    keyFeature:"Narrow, symmetric, peaked (tented) T waves -> PR widening -> QRS widening -> sine wave -> VF",
    criteria:["K > 5.5: narrow symmetric peaked T waves (tented, narrow base)","K > 6.5: PR prolongation, P wave flattening and widening","K > 7.0: QRS widening, ST changes, loss of P waves","K > 8.0: sine wave pattern, VF/PEA imminent","Hyperacute T in hyperkalemia = narrow and symmetric; STEMI = broad and asymmetric"],
    management:"Calcium gluconate 1g IV (membrane stabilization -- immediate). Insulin 10U + D50W (30-min onset). Sodium bicarb if acidemic. Kayexalate. Dialysis if severe or refractory.",
    pitfall:"Peaked T waves in hyperkalemia mimic early STEMI (hyperacute T waves). Check BMP first. Key difference: hyperkalemia T waves are narrow and symmetric; STEMI T waves are broader.",
    risk:"high",
  },
  { id:"tca", label:"TCA / Sodium Channel Toxicity", lead:"aVR + limb leads + precordials", color:T.yellow, path:W.tca,
    keyFeature:"QRS > 120ms + terminal R in aVR >= 3mm + right axis terminal deflection + prolonged QTc",
    criteria:["QRS > 120ms (sodium channel blockade)","Terminal R wave in aVR >= 3mm (rightward terminal QRS axis)","R/S ratio in aVR > 0.7","QTc prolongation (concurrent potassium channel effect)","Sinus tachycardia (anticholinergic effect)"],
    management:"Sodium bicarbonate 1-2 mEq/kg IV bolus. Repeat every 3-5 min for QRS > 120ms. Maintain serum pH 7.45-7.55. Intralipid emulsion for refractory toxicity.",
    pitfall:"TCA toxicity is asymptomatic early -- the ECG is diagnostic before clinical deterioration. QRS widening + sinus tachycardia in a young overdose patient = TCA until proven otherwise.",
    risk:"high",
  },
];

const STEPS = [
  { n:1, label:"Rate", icon:"📈", color:T.teal,
    normal:"60-100 bpm",
    method:"300 / (large boxes between R waves). Or count QRS complexes in 6-second strip x 10.",
    flags:["< 50: symptomatic bradycardia -- determine type (sinus, junctional, AV block, escape)","50-60: bradycardia -- assess symptoms, medications, athlete baseline","100-150 bpm: tachycardia -- P-wave analysis, narrow vs wide, regular vs irregular","> 150: SVT vs VT algorithm -- treat hemodynamically unstable patients first","> 200: suspect pre-excitation (WPW with AF) -- avoid AV nodal blockers"],
  },
  { n:2, label:"Rhythm", icon:"🔁", color:T.blue,
    normal:"Regular, P before every QRS, QRS after every P at consistent intervals",
    method:"Mark R-R intervals across the strip with calipers. Compare P-P vs R-R regularity.",
    flags:["Irregularly irregular with no P waves: atrial fibrillation","Regular rhythm with occasional dropped beats: AV block -- measure PR","Progressively lengthening PR then dropped beat: Mobitz I (Wenckebach)","Constant PR with sudden dropped beats: Mobitz II (more dangerous -- can progress to CHB)","Complete AV dissociation (P independent of QRS): third-degree heart block"],
  },
  { n:3, label:"Axis", icon:"🧭", color:T.purple,
    normal:"Normal axis: -30 to +90 degrees. Lead I positive, aVF positive.",
    method:"Step 1: Lead I positive or negative? Step 2: aVF positive or negative? Quadrant from both.",
    flags:["Normal: I positive, aVF positive (-30 to +90)","LAD: I positive, aVF negative -- consider inferior MI, LBBB, LAFB, LVH","RAD: I negative, aVF positive -- consider RVH, RBBB, lateral MI, acute PE","Extreme (NW): I negative, aVF negative -- hyperkalemia, ventricular paced rhythm, VT","Note: axis is diagnostic context, not diagnosis -- correlate with other findings"],
  },
  { n:4, label:"PR Interval", icon:"⏱", color:T.coral,
    normal:"120-200ms (3-5 small boxes)",
    method:"Onset of P wave to onset of QRS complex. Measure in lead II or whichever shows a clear P.",
    flags:["< 120ms: pre-excitation (WPW delta wave), junctional rhythm, AVRT -- look for delta wave","200-300ms: first-degree AV block -- benign alone but not always","Progressively lengthening then dropped QRS: Mobitz I -- usually benign, vagal","> 300ms: high-degree AV block -- urgent evaluation","No fixed PR relationship: third-degree (complete) AV block -- emergency pacing"],
  },
  { n:5, label:"QRS Width & Morphology", icon:"⚡", color:T.yellow,
    normal:"< 120ms (< 3 small boxes). Narrow = supraventricular origin.",
    method:"Measure the widest QRS across all 12 leads. Identify RBBB or LBBB morphology.",
    flags:["RBBB: rSR' (rabbit ears) in V1, wide S wave in I and V6, QRS 120-150ms","LBBB: broad notched R in I/V5/V6, QS pattern in V1, no septal Q waves in lateral leads","LBBB + chest pain: use Sgarbossa criteria -- concordant STE >= 1mm or STE > 25% of preceding S wave","Wide QRS + regular tachycardia: VT until proven otherwise -- Brugada algorithm","Delta wave + wide QRS: WPW -- short PR confirms pre-excitation"],
  },
  { n:6, label:"ST Segment", icon:"📊", color:T.red,
    normal:"Isoelectric +-0.5mm above or below TP baseline",
    method:"Measure at J-point relative to TP segment. Assess morphology: concave (pericarditis), convex (STEMI), flat/downsloping (ischemia).",
    flags:["Focal elevation + reciprocal depression: STEMI pattern -- identify territory, activate cath","Diffuse saddle-shaped STE + PR depression: acute pericarditis","ST depression in V1-V3: posterior STEMI (reciprocal) or subendocardial ischemia","aVR STE + diffuse depression: LMCA/proximal LAD or 3-vessel disease","Coved STE in V1-V2: Brugada Type 1 -- not ischemia"],
  },
  { n:7, label:"T Waves", icon:"🌊", color:T.orange,
    normal:"Upright in I, II, V3-V6. Inverted in aVR. Variable in III, V1, aVL.",
    method:"Assess all 12 leads: polarity (upright vs inverted), symmetry (asymmetric = normal; symmetric peaked = hyperkalemia/ischemia), and amplitude.",
    flags:["Hyperacute T (tall, broad, asymmetric): earliest STEMI sign -- compare to prior","Narrow symmetric peaked T (tented): hyperkalemia -- check potassium before cath","Inverted V1-V3: ARVC (look for epsilon), posterior MI reciprocal, or normal in V1","Deep symmetric inversions V2-V3: Wellens B -- proximal LAD critical stenosis","Biphasic (positive then negative): Wellens A -- same clinical significance as Wellens B"],
  },
  { n:8, label:"QT / QTc Interval", icon:"📏", color:T.green,
    normal:"QTc < 440ms (male), < 460ms (female). QTc >= 500ms = high Torsades risk.",
    method:"Start of QRS to end of T wave. Correct using Bazett: QTc = QT / sqrt(RR in seconds). Use a long RR interval for accuracy.",
    flags:["Always measure manually -- automated QTc wrong in ~30% of cases","Use the lead with the longest visible T wave for manual measurement","QTc 440-500ms: address causes -- drugs (azithromycin, antipsychotics, methadone), electrolytes","QTc >= 500ms: high TdP risk -- hold offending drugs, give Mg2+ 2g IV, monitor continuously","QTc >= 600ms: imminent TdP -- Mg2+ IV, overdrive pacing, electrophysiology consult emergently"],
  },
];

// FIX: tab order resequenced -- clinical tools first, reference library last
const TABS = [
  {id:"stemi",      label:"ACS",             icon:"🫀"},
  {id:"danger",     label:"Dangerous",       icon:"⚠️"},
  {id:"qtcalc",     label:"QTc Calc",        icon:"📐"},
  {id:"tools",      label:"Clinical Tools",  icon:"🛠"},
  {id:"ai",         label:"AI Interpret",    icon:"🤖"},
  {id:"systematic", label:"Systematic Read", icon:"🔍"},
];

const TOOL_TABS = [
  {id:"territory", label:"STEMI Localizer",  icon:"🗺"},
  {id:"avblock",   label:"AV Block",         icon:"📶"},
  {id:"wct",       label:"Wide Complex",     icon:"⚡"},
  {id:"chads",     label:"CHA2DS2-VASc",     icon:"🩸"},
  {id:"serial",    label:"Serial ECG",       icon:"⏱"},
  {id:"af",        label:"AF Pathway",       icon:"💙"},
];

// ── Module-Scope Primitives ──────────────────────────────────────────
function AmbientBg() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
      <div style={{position:"absolute",top:"-15%",left:"-10%",width:"55%",height:"55%",background:"radial-gradient(circle,rgba(255,68,68,0.08) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",bottom:"-10%",right:"-5%",width:"50%",height:"50%",background:"radial-gradient(circle,rgba(59,158,255,0.07) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",top:"40%",left:"30%",width:"35%",height:"35%",background:"radial-gradient(circle,rgba(155,109,255,0.05) 0%,transparent 70%)"}}/>
    </div>
  );
}

function EcgTrace({ d, color, animate }) {
  return (
    <svg viewBox="0 0 280 80" style={{width:"100%",height:"auto",display:"block"}} preserveAspectRatio="xMidYMid meet">
      <defs>
        <pattern id="sg" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
          <path d="M14,0 L0,0 0,14" fill="none" stroke="rgba(255,60,60,0.1)" strokeWidth="0.4"/>
        </pattern>
        <pattern id="lg" x="0" y="0" width="70" height="70" patternUnits="userSpaceOnUse">
          <path d="M70,0 L0,0 0,70" fill="none" stroke="rgba(255,60,60,0.2)" strokeWidth="0.8"/>
        </pattern>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      <rect width="280" height="80" fill="rgba(4,10,22,0.7)" rx="6"/>
      <rect width="280" height="80" fill="url(#sg)"/>
      <rect width="280" height="80" fill="url(#lg)"/>
      <line x1="0" y1="58" x2="280" y2="58" stroke="rgba(255,60,60,0.1)" strokeWidth="0.8" strokeDasharray="2,6"/>
      <path d={d} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        filter="url(#glow)"
        className={animate ? "ecg-line" : ""}
        style={animate ? {strokeDasharray:3000} : {}}/>
    </svg>
  );
}

function RiskBadge({ level }) {
  const c = level === "critical" ? T.red : level === "high" ? T.orange : T.yellow;
  return (
    <span style={{fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,color:c,
      background:`${c}20`,border:`1px solid ${c}44`,
      padding:"2px 8px",borderRadius:4,textTransform:"uppercase",letterSpacing:1,flexShrink:0}}>
      {level}
    </span>
  );
}

function BulletRow({ text, color }) {
  return (
    <div style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:5}}>
      <span style={{color:color||T.teal,fontSize:9,marginTop:3,flexShrink:0}}>▸</span>
      <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{text}</span>
    </div>
  );
}

function PatternCard({ pat, expanded, onToggle, animate }) {
  return (
    <div className="pat-card" onClick={onToggle}
      style={{...glass,cursor:"pointer",overflow:"hidden",
        border:`1px solid ${expanded ? pat.color+"55" : "rgba(42,79,122,0.35)"}`,
        borderTop:`3px solid ${pat.color}`,
        transition:"border-color .15s"}}>
      <div style={{padding:"12px 14px 10px"}}>
        <div style={{marginBottom:10}}>
          <EcgTrace d={pat.path} color={pat.color} animate={animate && expanded}/>
        </div>
        <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:13,color:pat.color,marginBottom:3}}>{pat.label}</div>
            <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,marginBottom:5}}>{pat.lead}</div>
            <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5}}>{pat.keyFeature}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0}}>
            <RiskBadge level={pat.risk}/>
            <span style={{color:T.txt4,fontSize:12}}>{expanded ? "▲" : "▼"}</span>
          </div>
        </div>
      </div>
      {expanded && (
        <div className="fade-in" style={{borderTop:"1px solid rgba(42,79,122,0.3)",padding:"14px 14px 16px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
                textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Diagnostic Criteria</div>
              {pat.criteria.map((c,i) => <BulletRow key={i} text={c} color={pat.color}/>)}
            </div>
            <div>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
                textTransform:"uppercase",letterSpacing:1,marginBottom:8,
                display:"flex",alignItems:"center",gap:7}}>
                Management
                {pat.evidence && (
                  <span style={{fontFamily:"JetBrains Mono",fontSize:7,color:T.teal,
                    background:"rgba(0,229,192,0.1)",border:"1px solid rgba(0,229,192,0.3)",
                    borderRadius:4,padding:"1px 6px",letterSpacing:0.5,textTransform:"none",
                    fontWeight:400}}>{pat.evidence}</span>
                )}
              </div>
              <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt,lineHeight:1.6,marginBottom:12}}>
                {pat.management}
              </div>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.orange,
                textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Common Pitfall</div>
              <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5,fontStyle:"italic"}}>
                {pat.pitfall}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepCard({ step, expanded, onToggle }) {
  return (
    <div onClick={onToggle}
      style={{...glass,cursor:"pointer",borderLeft:`3px solid ${step.color}`,marginBottom:10,overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px"}}>
        <div style={{width:26,height:26,borderRadius:"50%",background:`${step.color}22`,
          border:`1px solid ${step.color}55`,display:"flex",alignItems:"center",
          justifyContent:"center",flexShrink:0}}>
          <span style={{fontFamily:"JetBrains Mono",fontSize:11,fontWeight:700,color:step.color}}>{step.n}</span>
        </div>
        <span style={{fontSize:15}}>{step.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:13,color:T.txt}}>{step.label}</div>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4}}>Normal: {step.normal}</div>
        </div>
        <span style={{color:T.txt4,fontSize:12}}>{expanded ? "▲" : "▼"}</span>
      </div>
      {expanded && (
        <div className="fade-in" style={{padding:"0 16px 14px",borderTop:"1px solid rgba(42,79,122,0.3)"}}>
          <div style={{fontFamily:"DM Sans",fontSize:12,color:T.teal,
            marginBottom:10,paddingTop:10,fontWeight:600}}>
            Method: {step.method}
          </div>
          {step.flags.map((f,i) => (
            <div key={i} style={{display:"flex",gap:8,marginBottom:5}}>
              <span style={{color:step.color,fontSize:9,marginTop:3,flexShrink:0}}>▸</span>
              <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{f}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────
// ── Tool 1: STEMI Territory Localizer ────────────────────────────────
// Per 2025 ACC/AHA/ACEP ACS Guideline
const LEADS_LIST = ["I","II","III","aVF","aVL","aVR","V1","V2","V3","V4","V5","V6"];

function stemiTerritory(ls) {
  const ste  = l => ls[l] === "ste";
  const std  = l => ls[l] === "std";
  const steN = a => a.filter(ste).length;
  const stdN = a => a.filter(std).length;
  if (!Object.values(ls).some(v => v && v !== "normal")) return null;
  if (ste("aVR") && stdN(["I","II","V4","V5","V6"]) >= 3)
    return {label:"LMCA / Proximal LAD / 3-Vessel Disease",culprit:"Left Main or 3VD",color:T.red,
      action:"Emergent cath -- highest ACS mortality. Intravascular imaging Class 1 (2025). Consider Impella for cardiogenic shock (Class 2a). Radial approach preferred (Class 1).",
      pitfall:"Diffuse STD + aVR STE dismissed as demand ischemia. STE in aVR > V1 points to LMCA over proximal LAD.",
      source:"2025 ACC/AHA ACS Guideline (Class 1)"};
  if (stdN(["V1","V2","V3"]) >= 2 && steN(["V1","V2","V3","V4"]) === 0)
    return {label:"Posterior Wall STEMI Equivalent",culprit:"RCA (posterior descending) or LCx",color:T.coral,
      action:"Place posterior leads V7-V9 immediately. STE >= 0.5mm = diagnostic. Activate cath. Treat as full STEMI. Radial preferred.",
      pitfall:"Most missed STEMI. Depression in V1-V3 = posterior elevation mirrored. The tall upright T in V1-V3 is the second sign.",
      source:"2025 ACC/AHA ACS Guideline (STEMI Equivalent)"};
  if (steN(["II","III","aVF"]) >= 2) {
    const rv = ste("V1") || (std("aVL") && ste("III") && ste("II"));
    return {label:"Inferior STEMI" + (rv ? " + Possible RV Involvement" : ""),
      culprit:rv ? "Proximal RCA -- obtain V4R to confirm RV MI" : "RCA (80%) or LCx (20%)",color:T.orange,
      action:rv ? "Obtain right-sided leads V4R. STE >= 0.5mm = RV MI. AVOID nitrates. Cautious IV fluids for preload-dependent RV. Activate cath."
               : "Activate cath. ASA + heparin + P2Y12. Complete revascularization recommended (Class 1, 2025). Monitor for high-degree AV block.",
      pitfall:"RV MI is volume-dependent -- nitrates can cause fatal hypotension. STE in V1 with inferior STEMI = proximal RCA.",
      source:"2025 ACC/AHA ACS Guideline (Class 1)"};
  }
  if (steN(["V1","V2","V3","V4"]) >= 2) {
    const ext  = ste("V5") || ste("V6") || ste("I") || ste("aVL");
    const prox = ste("V1") && ste("V2");
    return {label:ext ? "Extensive Anterior / Anterolateral STEMI" : "Anterior / Anteroseptal STEMI",
      culprit:prox ? "Proximal LAD (before D1/S1 -- highest risk)" : "Mid-LAD",color:T.red,
      action:"Activate cath. Largest myocardium at risk. Monitor for complete AV block and VF. Impella reasonable if cardiogenic shock (Class 2a). Complete revascularization recommended.",
      pitfall:"De Winter pattern (upsloping STD + peaked T in V1-V4, NO STE) = proximal LAD occlusion. Activate cath. Do not dismiss anterior changes without excluding De Winter.",
      source:"2025 ACC/AHA ACS Guideline (Class 1)"};
  }
  if (steN(["I","aVL","V5","V6"]) >= 2)
    return {label:"Lateral STEMI",culprit:"LCx or First Diagonal (D1)",color:T.orange,
      action:"Activate cath. ASA + heparin + P2Y12. Obtain inferior leads -- lateral STEMI frequently extends inferiorly. Radial approach preferred.",
      pitfall:"High lateral MI (I, aVL only) has small STE -- easy to underread. Reciprocal STD in II/III/aVF is the diagnostic tip-off.",
      source:"2025 ACC/AHA ACS Guideline (Class 1)"};
  return {label:"Nonspecific / Pattern Unclear",culprit:"Indeterminate",color:T.txt4,
    action:"Serial ECGs required (Class 1): 0, 30, 60 min. Obtain posterior leads (V7-V9) and right-sided leads (V4R) if territory unclear. High-sensitivity troponin at 0 and 1-2 hours.",
    pitfall:"Normal or nonspecific ECG does not rule out complete coronary occlusion (OMI paradigm). Serial ECG + troponin mandatory for high-suspicion ACS.",
    source:"2025 ACC/AHA ACS Guideline"};
}

function STEMILocalizer({ leadStates, setLeadStates }) {
  function cycle(lead) {
    setLeadStates(prev => {
      const cur = prev[lead] || "normal";
      return {...prev, [lead]: cur==="normal"?"ste":cur==="ste"?"std":"normal"};
    });
  }
  const result = stemiTerritory(leadStates);
  return (
    <div>
      <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,marginBottom:10}}>
        Tap each lead to cycle:
        <span style={{color:T.red,fontWeight:700}}> STE</span>
        <span style={{color:T.txt4}}> {"->"} </span>
        <span style={{color:T.blue,fontWeight:700}}>STD</span>
        <span style={{color:T.txt4}}> {"->"} Normal</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:6,marginBottom:10}}>
        {LEADS_LIST.map(lead => {
          const st = leadStates[lead] || "normal";
          const bc = st==="ste"?T.red:st==="std"?T.blue:"rgba(42,79,122,0.4)";
          const bg = st==="ste"?`${T.red}18`:st==="std"?`${T.blue}18`:"rgba(8,22,40,0.5)";
          return (
            <button key={lead} onClick={() => cycle(lead)}
              style={{padding:"8px 4px",borderRadius:8,border:`1px solid ${bc}`,background:bg,
                color:bc,fontFamily:"JetBrains Mono",fontSize:11,fontWeight:700,
                cursor:"pointer",transition:"all .12s",textAlign:"center"}}>
              {lead}
              {st !== "normal" && <div style={{fontSize:7,marginTop:1}}>{st.toUpperCase()}</div>}
            </button>
          );
        })}
      </div>
      <button onClick={() => setLeadStates({})} style={{marginBottom:12,padding:"4px 12px",
        borderRadius:6,border:"1px solid rgba(42,79,122,0.35)",background:"transparent",
        color:T.txt4,fontFamily:"JetBrains Mono",fontSize:8,letterSpacing:1,
        textTransform:"uppercase",cursor:"pointer"}}>Clear All</button>
      {result ? (
        <div className="fade-in" style={{padding:"14px 16px",borderRadius:12,
          background:`${result.color}0d`,border:`1px solid ${result.color}33`}}>
          <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:16,
            color:result.color,marginBottom:3}}>{result.label}</div>
          <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3,marginBottom:12}}>
            Likely culprit: {result.culprit}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div style={{padding:"9px 11px",borderRadius:8,background:"rgba(0,229,192,0.06)",
              border:"1px solid rgba(0,229,192,0.2)"}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.teal,
                letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>Action</div>
              <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5}}>{result.action}</div>
            </div>
            <div style={{padding:"9px 11px",borderRadius:8,background:"rgba(255,159,67,0.06)",
              border:"1px solid rgba(255,159,67,0.2)"}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.orange,
                letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>Pitfall</div>
              <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5,fontStyle:"italic"}}>{result.pitfall}</div>
            </div>
          </div>
          <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,textAlign:"right"}}>
            {result.source}
          </div>
        </div>
      ) : (
        <div style={{padding:"14px",borderRadius:10,textAlign:"center",
          background:"rgba(42,79,122,0.1)",border:"1px solid rgba(42,79,122,0.25)",
          fontFamily:"DM Sans",fontSize:12,color:T.txt4}}>
          Select lead findings above to localize territory and culprit artery
        </div>
      )}
    </div>
  );
}

// ── Tool 2: AV Block Classifier ───────────────────────────────────────
// Per 2018 ACC/AHA Bradycardia and Cardiac Conduction Delay Guideline
const AV_TREE = [
  {id:"q1",q:"Does every P wave conduct to a QRS (1:1 P:QRS ratio)?",yes:"q2",no:"q3"},
  {id:"q2",q:"What is the PR interval?",
    options:[{label:"Short -- < 120ms",next:"pre_exc"},{label:"Normal -- 120-200ms",next:"nsr"},
             {label:"Prolonged -- > 200ms",next:"first"}]},
  {id:"q3",q:"What best describes the P:QRS relationship?",
    options:[
      {label:"PR progressively lengthens, then a beat drops",next:"mobitz1"},
      {label:"PR is constant, then a beat suddenly drops",next:"mobitz2"},
      {label:"P waves and QRS complexes march independently",next:"chb"},
      {label:"Every other P wave is blocked (2:1 pattern)",next:"two1"},
      {label:"P waves absent or fibrillatory baseline",next:"nop"},
    ]},
];
const AV_RES = {
  nsr:{label:"Normal Sinus Rhythm",color:T.green,urgency:"None",
    detail:"PR 120-200ms, 1:1 conduction. No AV conduction abnormality.",
    action:"No specific ECG-based intervention. Review if clinical bradycardia present.",
    source:"Normal -- no guideline intervention"},
  pre_exc:{label:"Pre-Excitation / Short PR",color:T.yellow,urgency:"Moderate",
    detail:"PR < 120ms. Evaluate for delta wave (WPW) or junctional origin.",
    action:"Look for delta wave. WPW: EP referral for ablation. Pre-excited AF: procainamide or ibutilide. NEVER adenosine, verapamil, or digoxin in WPW+AF.",
    source:"2015 ACC/AHA/HRS SVT Guideline"},
  first:{label:"First-Degree AV Block",color:T.yellow,urgency:"Low",
    detail:"PR > 200ms, 1:1 conduction. All P waves conduct -- delayed at AV node.",
    action:"Benign in isolation. Review for causative drugs (beta-blockers, CCBs, digoxin). No pacing required.",
    source:"2018 ACC/AHA Bradycardia Guideline"},
  mobitz1:{label:"Mobitz I -- Wenckebach",color:T.orange,urgency:"Moderate",
    detail:"Progressive PR lengthening then dropped QRS. Block site: AV node. Usually reversible.",
    action:"Address reversible causes (inferior MI, vagal tone, AV-nodal drugs). Atropine if symptomatic. Rarely requires pacing.",
    source:"2018 ACC/AHA Bradycardia Guideline"},
  mobitz2:{label:"Mobitz II",color:T.red,urgency:"High -- Pacing Likely",
    detail:"Constant PR then sudden dropped beat without warning. Block site: His-Purkinje. High risk of progression to CHB.",
    action:"Urgent cardiology. Transcutaneous pacing if unstable. Permanent pacemaker indicated (Class 1). Avoid all AV-nodal blocking agents.",
    source:"2018 ACC/AHA Bradycardia Guideline (Class 1 PPM)"},
  chb:{label:"Third-Degree (Complete) AV Block",color:T.red,urgency:"Critical",
    detail:"Complete AV dissociation. P rate and QRS rate are independent. Escape rhythm maintains output -- may fail.",
    action:"Transcutaneous pacing immediately if unstable. Atropine is temporizing only. Transvenous pacing. Assess for reversible cause: inferior MI, Lyme disease, drug toxicity, hyperkalemia.",
    source:"2018 ACC/AHA Bradycardia Guideline (Class 1 pacing)"},
  two1:{label:"2:1 AV Block -- Type Indeterminate",color:T.red,urgency:"High",
    detail:"Cannot distinguish Mobitz I vs II from a 2:1 pattern on a single strip. Treat as Mobitz II until proven otherwise.",
    action:"Treat as high-degree block. Narrow QRS suggests AV nodal (Mobitz I). Wide QRS suggests infranodal (Mobitz II). Urgent cardiology consult.",
    source:"2018 ACC/AHA Bradycardia Guideline"},
  nop:{label:"No Organized P Waves",color:T.orange,urgency:"Moderate",
    detail:"Absent P waves: consider AFib, junctional rhythm, or atrial standstill.",
    action:"Assess for irregularly irregular narrow complex (AFib). Check K+, digoxin level. If junctional escape with slow rate, assess hemodynamics and prepare atropine.",
    source:"2023 ACC/AHA/ACCP/HRS AF Guideline"},
};

function AVBlockClassifier({ avAnswers, setAvAnswers }) {
  function answer(qId, val) { setAvAnswers(prev => ({...prev,[qId]:val})); }
  function reset() { setAvAnswers({}); }
  let nodeId = "q1";
  for (;;) {
    const node = AV_TREE.find(n => n.id === nodeId);
    if (!node) break;
    const ans = avAnswers[nodeId];
    if (!ans) break;
    if (node.yes && ans === "yes") { nodeId = node.yes; continue; }
    if (node.no  && ans === "no")  { nodeId = node.no;  continue; }
    if (node.options) { const o = node.options.find(x => x.label === ans); if (o) { nodeId = o.next; continue; } }
    break;
  }
  const result = AV_RES[nodeId];
  const currentNode = AV_TREE.find(n => n.id === nodeId);
  return (
    <div>
      {Object.keys(avAnswers).length > 0 && (
        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10,alignItems:"center"}}>
          {Object.values(avAnswers).map((a,i) => (
            <div key={i} style={{padding:"2px 9px",borderRadius:5,
              background:"rgba(0,229,192,0.08)",border:"1px solid rgba(0,229,192,0.25)",
              fontFamily:"DM Sans",fontSize:10,color:T.teal}}>{a}</div>
          ))}
          <button onClick={reset} style={{padding:"2px 9px",borderRadius:5,cursor:"pointer",
            border:"1px solid rgba(42,79,122,0.35)",background:"transparent",
            fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,letterSpacing:1,textTransform:"uppercase"}}>
            Reset</button>
        </div>
      )}
      {currentNode && !result && (
        <div className="fade-in" style={{padding:"14px 16px",borderRadius:12,
          background:"rgba(8,22,40,0.6)",border:"1px solid rgba(42,79,122,0.45)"}}>
          <div style={{fontFamily:"DM Sans",fontWeight:600,fontSize:13,color:T.txt,marginBottom:12}}>
            {currentNode.q}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {currentNode.yes && (
              <>
                <button onClick={() => answer(currentNode.id,"yes")} style={{padding:"9px 14px",
                  borderRadius:8,cursor:"pointer",textAlign:"left",
                  border:"1px solid rgba(61,255,160,0.35)",background:"rgba(61,255,160,0.06)",
                  fontFamily:"DM Sans",fontSize:12,color:T.green,fontWeight:600}}>Yes</button>
                <button onClick={() => answer(currentNode.id,"no")} style={{padding:"9px 14px",
                  borderRadius:8,cursor:"pointer",textAlign:"left",
                  border:"1px solid rgba(255,107,107,0.35)",background:"rgba(255,107,107,0.06)",
                  fontFamily:"DM Sans",fontSize:12,color:T.coral,fontWeight:600}}>No</button>
              </>
            )}
            {currentNode.options && currentNode.options.map(opt => (
              <button key={opt.label} onClick={() => answer(currentNode.id,opt.label)}
                style={{padding:"9px 14px",borderRadius:8,cursor:"pointer",textAlign:"left",
                  border:"1px solid rgba(42,79,122,0.4)",background:"rgba(8,22,40,0.5)",
                  fontFamily:"DM Sans",fontSize:12,color:T.txt2,fontWeight:500,transition:"all .12s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(59,158,255,0.5)";e.currentTarget.style.color=T.txt;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(42,79,122,0.4)";e.currentTarget.style.color=T.txt2;}}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {result && (
        <div className="fade-in" style={{padding:"14px 16px",borderRadius:12,
          background:`${result.color}0d`,border:`1px solid ${result.color}33`}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:16,color:result.color}}>
              {result.label}
            </div>
            <span style={{fontFamily:"JetBrains Mono",fontSize:8,fontWeight:700,color:result.color,
              background:`${result.color}18`,border:`1px solid ${result.color}44`,borderRadius:4,
              padding:"2px 8px",textTransform:"uppercase",letterSpacing:1}}>{result.urgency}</span>
          </div>
          <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,marginBottom:10,lineHeight:1.5}}>
            {result.detail}
          </div>
          <div style={{padding:"9px 11px",borderRadius:8,marginBottom:8,
            background:"rgba(0,229,192,0.06)",border:"1px solid rgba(0,229,192,0.2)"}}>
            <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.teal,
              letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Action</div>
            <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5}}>{result.action}</div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4}}>{result.source}</div>
            <button onClick={reset} style={{padding:"4px 12px",borderRadius:6,cursor:"pointer",
              border:"1px solid rgba(42,79,122,0.4)",background:"transparent",
              fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,letterSpacing:1,textTransform:"uppercase"}}>
              Start Over</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tool 3: Wide Complex Tachycardia Differentiator ───────────────────
// Brugada 4-step algorithm per 2017 ACC/AHA/HRS VA Guideline + 2025 AHA ACLS
const WCT_STEPS = [
  {id:0,q:"Is the rhythm irregular?",
    hint:"Irregularly irregular + wide complex = WPW with AF until proven otherwise",yesSpecial:true},
  {id:1,q:"Brugada Step 1: Absence of RS complex in ALL precordial leads (V1-V6)?",
    hint:"RS = any lead with both R wave and S wave. Pure R, QS, or QR = no RS complex",yesVT:true},
  {id:2,q:"Brugada Step 2: RS interval > 100ms in ANY precordial lead?",
    hint:"Measure from R onset to S nadir. Slurred, wide S wave suggests infranodal origin",yesVT:true},
  {id:3,q:"Brugada Step 3: AV dissociation present?",
    hint:"P waves marching independently of QRS. Capture beats or fusion beats are pathognomonic for VT",yesVT:true},
  {id:4,q:"Brugada Step 4: Morphology criteria met for VT?",
    hint:"RBBB: R > R-prime in V1, or rS in V6. LBBB: R onset > 30ms or notched S descent in V1/V2, or Q wave in V6",
    yesVT:true,last:true},
];

function WCTDifferentiator({ wctAnswers, setWctAnswers }) {
  function answer(id, val) { setWctAnswers(prev => ({...prev,[id]:val})); }
  function reset() { setWctAnswers({}); }
  let curId = 0, vtStep = null, svt = false, special = false;
  for (let i = 0; i < WCT_STEPS.length; i++) {
    const s = WCT_STEPS[i];
    const a = wctAnswers[s.id];
    if (a === undefined) { curId = s.id; break; }
    if (s.yesSpecial && a === "yes") { special = true; break; }
    if (s.yesVT      && a === "yes") { vtStep  = s.id;  break; }
    if (s.last       && a === "no")  { svt     = true;  break; }
    curId = s.id + 1;
  }
  const step = WCT_STEPS.find(s => s.id === curId);
  return (
    <div>
      <div style={{padding:"8px 12px",borderRadius:8,marginBottom:12,
        background:"rgba(155,109,255,0.07)",border:"1px solid rgba(155,109,255,0.25)",
        fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5}}>
        <strong style={{color:T.purple}}>Brugada rule:</strong> If ANY step is YES, the answer is VT. Work through all 4 before concluding SVT. Clinical default: wide complex regular tachycardia = VT until proven otherwise.
      </div>
      {Object.keys(wctAnswers).length > 0 && (
        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10,alignItems:"center"}}>
          {Object.entries(wctAnswers).map(([id,a]) => (
            <div key={id} style={{padding:"2px 9px",borderRadius:5,fontSize:10,
              background:a==="yes"?"rgba(255,68,68,0.1)":"rgba(59,158,255,0.1)",
              border:`1px solid ${a==="yes"?"rgba(255,68,68,0.3)":"rgba(59,158,255,0.3)"}`,
              fontFamily:"DM Sans",color:a==="yes"?T.coral:T.blue}}>
              Step {id}: {a.toUpperCase()}
            </div>
          ))}
          <button onClick={reset} style={{padding:"2px 9px",borderRadius:5,cursor:"pointer",
            border:"1px solid rgba(42,79,122,0.35)",background:"transparent",
            fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,letterSpacing:1,textTransform:"uppercase"}}>Reset</button>
        </div>
      )}
      {special && (
        <div className="fade-in" style={{padding:"14px 16px",borderRadius:12,
          background:"rgba(245,200,66,0.08)",border:"1px solid rgba(245,200,66,0.35)"}}>
          <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:16,color:T.yellow,marginBottom:6}}>
            WPW + Atrial Fibrillation (Pre-Excited AF)
          </div>
          <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5,marginBottom:10}}>
            DO NOT give adenosine, verapamil, diltiazem, or digoxin -- can accelerate accessory pathway conduction and precipitate VF. Use procainamide 15-17 mg/kg IV over 30-60 min. Ibutilide is an alternative. Synchronized cardioversion if hemodynamically unstable.
          </div>
          <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4}}>2015 ACC/AHA/HRS SVT Guideline (Class 3 Harm: AV nodal blockers)</div>
          <button onClick={reset} style={{marginTop:8,padding:"4px 12px",borderRadius:6,cursor:"pointer",
            border:"1px solid rgba(42,79,122,0.4)",background:"transparent",
            fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,letterSpacing:1,textTransform:"uppercase"}}>Start Over</button>
        </div>
      )}
      {vtStep !== null && !special && (
        <div className="fade-in" style={{padding:"14px 16px",borderRadius:12,
          background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.35)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
            <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:16,color:T.red}}>
              Ventricular Tachycardia
            </div>
            <span style={{fontFamily:"JetBrains Mono",fontSize:8,fontWeight:700,color:T.red,
              background:"rgba(255,68,68,0.15)",border:"1px solid rgba(255,68,68,0.35)",
              borderRadius:4,padding:"2px 8px"}}>STEP {vtStep} POSITIVE</span>
          </div>
          <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5,marginBottom:10}}>
            Unstable: synchronized cardioversion biphasic 100-200J (Class 1). Stable: amiodarone 150mg IV over 10 min then 1mg/min. NEVER CCBs or adenosine. Obtain 12-lead. Correct K+ and Mg2+.
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4}}>2017 ACC/AHA/HRS VA Guideline / 2025 AHA ACLS</div>
            <button onClick={reset} style={{padding:"4px 12px",borderRadius:6,cursor:"pointer",
              border:"1px solid rgba(42,79,122,0.4)",background:"transparent",
              fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,letterSpacing:1,textTransform:"uppercase"}}>Start Over</button>
          </div>
        </div>
      )}
      {svt && (
        <div className="fade-in" style={{padding:"14px 16px",borderRadius:12,
          background:"rgba(59,158,255,0.07)",border:"1px solid rgba(59,158,255,0.3)"}}>
          <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:16,color:T.blue,marginBottom:6}}>
            SVT with Aberrant Conduction (by exclusion)
          </div>
          <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5,marginBottom:10}}>
            All 4 Brugada criteria absent -- SVT with aberrancy is diagnosis of exclusion. Adenosine 6mg IV rapid push is diagnostic and therapeutic. If any uncertainty remains, treat as VT.
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4}}>2015 ACC/AHA/HRS SVT Guideline</div>
            <button onClick={reset} style={{padding:"4px 12px",borderRadius:6,cursor:"pointer",
              border:"1px solid rgba(42,79,122,0.4)",background:"transparent",
              fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,letterSpacing:1,textTransform:"uppercase"}}>Start Over</button>
          </div>
        </div>
      )}
      {step && !special && vtStep === null && !svt && (
        <div className="fade-in" style={{padding:"14px 16px",borderRadius:12,
          background:"rgba(8,22,40,0.6)",border:"1px solid rgba(42,79,122,0.45)"}}>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
            letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>
            {step.id === 0 ? "Step 0 -- Regularity Check" : `Step ${step.id} of 4 -- Brugada Criterion ${step.id}`}
          </div>
          <div style={{fontFamily:"DM Sans",fontWeight:600,fontSize:13,color:T.txt,marginBottom:5}}>{step.q}</div>
          {step.hint && <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4,
            marginBottom:12,lineHeight:1.4,fontStyle:"italic"}}>{step.hint}</div>}
          <div style={{display:"flex",gap:8}}>
            <button onClick={() => answer(step.id,"yes")} style={{flex:1,padding:"10px",borderRadius:8,
              cursor:"pointer",border:"1px solid rgba(255,107,107,0.4)",background:"rgba(255,107,107,0.08)",
              fontFamily:"DM Sans",fontSize:12,fontWeight:700,color:T.coral}}>Yes</button>
            <button onClick={() => answer(step.id,"no")} style={{flex:1,padding:"10px",borderRadius:8,
              cursor:"pointer",border:"1px solid rgba(59,158,255,0.4)",background:"rgba(59,158,255,0.08)",
              fontFamily:"DM Sans",fontSize:12,fontWeight:700,color:T.blue}}>No</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tool 4: CHA2DS2-VASc Calculator ──────────────────────────────────
// Per 2023 ACC/AHA/ACCP/HRS Atrial Fibrillation Guideline
const CHAD_ITEMS = [
  {key:"chf",    label:"Congestive heart failure or LV dysfunction", pts:1, color:T.coral },
  {key:"htn",    label:"Hypertension (treated or untreated)",         pts:1, color:T.orange},
  {key:"a75",    label:"Age >= 75 years",                            pts:2, color:T.red   },
  {key:"dm",     label:"Diabetes mellitus",                          pts:1, color:T.orange},
  {key:"stroke", label:"Prior stroke, TIA, or thromboembolism",      pts:2, color:T.red   },
  {key:"vasc",   label:"Vascular disease (MI, PAD, aortic plaque)",  pts:1, color:T.coral },
  {key:"a65",    label:"Age 65-74 years (select only one age group)", pts:1, color:T.yellow},
  {key:"female", label:"Female sex (risk modifier, not independent)", pts:1, color:T.blue  },
];
const CHAD_BLANK = {chf:false,htn:false,a75:false,dm:false,stroke:false,vasc:false,a65:false,female:false};

function chadInterpret(score, female) {
  const adj = female ? score - 1 : score;
  if (adj <= 0) return {label:"Low Risk -- OAC Not Recommended",color:T.green,
    action:"Anticoagulation not recommended. Address modifiable AF risk factors (hypertension, obesity, sleep apnea, alcohol). Reassess annually.",
    source:"2023 ACC/AHA/ACCP/HRS AF Guideline"};
  if (adj === 1) return {label:"Low-Moderate Risk -- Shared Decision",color:T.yellow,
    action:"OAC may be omitted or considered based on patient preferences and bleeding risk. Shared decision-making. Reassess with any clinical change.",
    source:"2023 ACC/AHA/ACCP/HRS AF Guideline"};
  return {label:"Anticoagulation Recommended -- Class 1",color:T.teal,
    action:"OAC recommended. Prefer DOAC over warfarin (Class 1). Assess HAS-BLED for bleeding risk. Renal function guides DOAC selection. Do not withhold OAC solely for fall risk.",
    source:"2023 ACC/AHA/ACCP/HRS AF Guideline (Class 1)"};
}

function CHADVAScCalc({ chadVars, setChadVars }) {
  function toggle(key) {
    if (key === "a75" || key === "a65") {
      setChadVars(prev => ({...prev,a75:key==="a75"?!prev.a75:false,a65:key==="a65"?!prev.a65:false}));
    } else {
      setChadVars(prev => ({...prev,[key]:!prev[key]}));
    }
  }
  const score = CHAD_ITEMS.reduce((s,it) => s + (chadVars[it.key] ? it.pts : 0), 0);
  const hasAny = Object.values(chadVars).some(Boolean);
  const res = hasAny ? chadInterpret(score, chadVars.female) : null;
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:14}}>
        {CHAD_ITEMS.map(item => {
          const on = chadVars[item.key];
          return (
            <button key={item.key} onClick={() => toggle(item.key)}
              style={{padding:"9px 12px",borderRadius:9,cursor:"pointer",textAlign:"left",
                border:`1px solid ${on?item.color+"55":"rgba(42,79,122,0.3)"}`,
                background:on?`${item.color}10`:"rgba(8,22,40,0.5)",transition:"all .12s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                <div style={{fontFamily:"DM Sans",fontSize:11,lineHeight:1.4,
                  color:on?item.color:T.txt3,fontWeight:on?600:400}}>{item.label}</div>
                <div style={{fontFamily:"JetBrains Mono",fontSize:11,fontWeight:700,
                  color:on?item.color:T.txt4,flexShrink:0}}>+{item.pts}</div>
              </div>
            </button>
          );
        })}
      </div>
      <div style={{display:"flex",alignItems:"stretch",gap:12,marginBottom:12}}>
        <div style={{padding:"12px 20px",borderRadius:12,background:"rgba(8,22,40,0.7)",
          border:"1px solid rgba(42,79,122,0.5)",textAlign:"center",minWidth:90,
          display:"flex",flexDirection:"column",justifyContent:"center"}}>
          <div style={{fontFamily:"JetBrains Mono",fontSize:40,fontWeight:700,lineHeight:1,
            color:score>=2?T.teal:score===1?T.yellow:T.txt4}}>{score}</div>
          <div style={{fontFamily:"DM Sans",fontSize:9,color:T.txt4,marginTop:4}}>CHA2DS2-VASc</div>
        </div>
        {res ? (
          <div className="fade-in" style={{flex:1,padding:"12px 14px",borderRadius:10,
            background:`${res.color}0d`,border:`1px solid ${res.color}33`}}>
            <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:13,color:res.color,marginBottom:5}}>
              {res.label}
            </div>
            <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5,marginBottom:5}}>
              {res.action}
            </div>
            <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4}}>{res.source}</div>
          </div>
        ) : (
          <div style={{flex:1,padding:"12px 14px",borderRadius:10,display:"flex",alignItems:"center",
            background:"rgba(42,79,122,0.1)",border:"1px solid rgba(42,79,122,0.25)",
            fontFamily:"DM Sans",fontSize:12,color:T.txt4}}>
            Select risk factors to calculate stroke risk and get anticoagulation recommendation
          </div>
        )}
      </div>
      <button onClick={() => setChadVars(CHAD_BLANK)} style={{padding:"4px 12px",borderRadius:6,
        border:"1px solid rgba(42,79,122,0.35)",background:"transparent",
        color:T.txt4,fontFamily:"JetBrains Mono",fontSize:8,
        letterSpacing:1,textTransform:"uppercase",cursor:"pointer"}}>Clear</button>
    </div>
  );
}

// ── Tool 5: Serial ECG Timer ──────────────────────────────────────────
// Per 2025 ACC/AHA/ACEP ACS Guideline -- Class 1 serial ECG recommendation
function SerialECGTimer({ timerStart, setTimerStart, tickNow }) {
  const elapsed = timerStart && tickNow ? Math.floor((tickNow - timerStart) / 1000) : null;
  function fmt(sec) {
    if (sec === null) return "--:--";
    return `${Math.floor(sec/60)}:${(sec%60).toString().padStart(2,"0")}`;
  }
  function countdown(total, target) {
    const diff = target - total;
    if (diff <= 0) return {label:"OBTAIN NOW",color:T.red,done:true};
    const m = Math.floor(diff/60), s = diff%60;
    return {label:`${m}:${s.toString().padStart(2,"0")}`,color:m<5?T.orange:T.teal,done:false};
  }
  const pts = [
    {t:0,    label:"ECG #1 -- Initial (Arrival)",note:"Obtain immediately -- within 10 min of first medical contact (Class 1)"},
    {t:1800, label:"ECG #2 -- 30 Minutes",       note:"Serial ECG when initial nondiagnostic and suspicion is high (Class 1)"},
    {t:3600, label:"ECG #3 -- 60 Minutes",        note:"Serial ECG if symptoms persist or clinical condition changes (Class 1)"},
  ];
  return (
    <div>
      <div style={{padding:"10px 14px",borderRadius:8,marginBottom:14,
        background:"rgba(0,229,192,0.07)",border:"1px solid rgba(0,229,192,0.2)",
        fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.6}}>
        <strong style={{color:T.teal}}>Class 1 -- 2025 ACC/AHA/ACEP ACS Guideline:</strong> Serial 12-lead ECGs at 0, 30, and 60 minutes when initial ECG is nondiagnostic, ACS suspicion is high, symptoms persist, or clinical condition deteriorates.
      </div>
      <div style={{textAlign:"center",marginBottom:16}}>
        {!timerStart ? (
          <button onClick={() => setTimerStart(Date.now())}
            style={{padding:"14px 36px",borderRadius:12,cursor:"pointer",
              border:"1px solid rgba(0,229,192,0.5)",
              background:"linear-gradient(135deg,rgba(0,229,192,0.18),rgba(0,229,192,0.06))",
              fontFamily:"DM Sans",fontWeight:700,fontSize:15,color:T.teal}}>
            Start Serial ECG Clock
          </button>
        ) : (
          <div>
            <div style={{fontFamily:"JetBrains Mono",fontSize:52,fontWeight:700,
              color:T.teal,lineHeight:1,marginBottom:4}}>{fmt(elapsed)}</div>
            <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4,marginBottom:14}}>
              elapsed since ECG #1
            </div>
            <button onClick={() => setTimerStart(null)}
              style={{padding:"5px 18px",borderRadius:7,cursor:"pointer",
                border:"1px solid rgba(255,107,107,0.3)",background:"rgba(255,107,107,0.06)",
                fontFamily:"JetBrains Mono",fontSize:8,color:T.coral,
                letterSpacing:1,textTransform:"uppercase"}}>Reset</button>
          </div>
        )}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {pts.map((cp,i) => {
          const done = elapsed !== null && elapsed >= cp.t;
          const next = !done && pts.slice(0,i).every(p => elapsed !== null && elapsed >= p.t);
          const cd   = elapsed !== null && !done ? countdown(elapsed, cp.t) : null;
          return (
            <div key={i} style={{padding:"10px 14px",borderRadius:9,
              background:done?"rgba(61,255,160,0.06)":next?"rgba(0,229,192,0.07)":"rgba(8,22,40,0.4)",
              border:`1px solid ${done?"rgba(61,255,160,0.3)":next?"rgba(0,229,192,0.35)":"rgba(42,79,122,0.25)"}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:13,
                    color:done?T.green:next?T.teal:T.txt3}}>
                    {done ? "Completed: " : next ? "Next: " : ""}{cp.label}
                  </div>
                  <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt4,marginTop:2}}>{cp.note}</div>
                </div>
                {cd && <div style={{fontFamily:"JetBrains Mono",fontSize:15,fontWeight:700,
                  color:cd.color,flexShrink:0,marginLeft:12}}>{cd.label}</div>}
                {done && <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.green,
                  flexShrink:0}}>DONE</div>}
              </div>
            </div>
          );
        })}
      </div>
      {elapsed !== null && (
        <div style={{marginTop:12,padding:"9px 12px",borderRadius:8,
          background:"rgba(245,200,66,0.07)",border:"1px solid rgba(245,200,66,0.2)",
          fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5}}>
          Immediately repeat ECG if: new or worsening symptoms, hemodynamic deterioration, new arrhythmia, or any clinical change -- do not wait for scheduled interval.
        </div>
      )}
    </div>
  );
}

// Props:
//   embedded  -- true when used as NPI tab; suppresses standalone chrome
//   onBack    -- callback for Back to Hub button (only shown when !embedded && onBack provided)
//   demo, vitals, cc, medications, pmhSelected -- NPI patient context (optional, reserved for AI tab)
export default function ECGHub({
  embedded = false,
  onBack,
  demo, vitals, cc, medications, pmhSelected,
}) {
  const [tab,      setTab]      = useState("stemi");
  const [expanded, setExpanded] = useState(null);
  const [stepExp,  setStepExp]  = useState(null);
  const [qtMs,     setQtMs]     = useState("");
  const [hrBpm,    setHrBpm]    = useState("");

  // Clinical Tools state
  const [activeTool,  setActiveTool]  = useState("territory");
  const [leadStates,  setLeadStates]  = useState({});
  const [avAnswers,   setAvAnswers]   = useState({});
  const [wctAnswers,  setWctAnswers]  = useState({});
  const [chadVars,    setChadVars]    = useState(CHAD_BLANK);
  const [timerStart,  setTimerStart]  = useState(null);
  const [tickNow,     setTickNow]     = useState(null);
  const [afAnswers,   setAfAnswers]   = useState({});
  const [acsSubTab,   setAcsSubTab]   = useState("stemi");

  useEffect(() => {
    if (!timerStart) { setTickNow(null); return; }
    setTickNow(Date.now());
    const id = setInterval(() => setTickNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timerStart]);


  const toggle     = useCallback(id => setExpanded(p => p === id ? null : id), []);
  const toggleStep = useCallback(n  => setStepExp(p  => p === n  ? null : n),  []);

  const qtResult = useMemo(() => {
    const qt = parseFloat(qtMs);
    const hr = parseFloat(hrBpm);
    if (!qt || !hr || hr <= 0 || qt <= 0) return null;
    const rrSec      = 60 / hr;
    const bazett     = Math.round(qt / Math.sqrt(rrSec));
    const fridericia = Math.round(qt / Math.pow(rrSec, 1/3));
    let interp, ic, risk;
    if      (bazett >= 600) { interp = "Critically Prolonged";          ic = T.red;    risk = "Imminent TdP -- Mg2+ IV, overdrive pacing, EP consult"; }
    else if (bazett >= 500) { interp = "Markedly Prolonged";            ic = T.red;    risk = "High TdP risk -- stop QT-prolonging drugs, Mg2+ 2g IV"; }
    else if (bazett >= 460) { interp = "Prolonged (Female threshold)";  ic = T.orange; risk = "Elevated risk -- review drug list, correct K+ > 4.0 and Mg2+ > 2.0"; }
    else if (bazett >= 440) { interp = "Borderline / Prolonged (Male)"; ic = T.yellow; risk = "Monitor -- correct electrolytes, audit drug list"; }
    else if (bazett <= 340) { interp = "Short QT";                      ic = T.yellow; risk = "Possible Short QT syndrome or hypercalcemia"; }
    else                    { interp = "Normal";                         ic = T.green;  risk = "No TdP risk based on QTc alone"; }
    return { bazett, fridericia, rr: Math.round(rrSec * 1000), interp, ic, risk };
  }, [qtMs, hrBpm]);

  const allPats = [...STEMI_PATS, ...DANGER_PATS];

  return (
    <div style={{fontFamily:"DM Sans",
      background: embedded ? "transparent" : T.bg,
      minHeight:  embedded ? "auto"        : "100vh",
      position:"relative", overflow:"hidden", color:T.txt}}>

      {!embedded && <AmbientBg/>}

      <div style={{position:"relative",zIndex:1,maxWidth:1440,margin:"0 auto",
        padding: embedded ? "0" : "0 16px"}}>

        {/* ── Standalone header ── */}
        {!embedded && (
          <div style={{padding:"18px 0 14px"}}>
            {onBack && (
              <button onClick={onBack}
                style={{display:"inline-flex",alignItems:"center",gap:6,marginBottom:12,
                  padding:"6px 14px",borderRadius:8,
                  border:"1px solid rgba(42,79,122,0.5)",
                  background:"rgba(14,37,68,0.6)",color:T.txt3,
                  fontFamily:"DM Sans",fontSize:12,fontWeight:600,
                  cursor:"pointer",transition:"all .15s",backdropFilter:"blur(10px)"}}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(59,158,255,0.5)"; e.currentTarget.style.color = T.txt; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(42,79,122,0.5)";  e.currentTarget.style.color = T.txt3; }}>
                Back to Hub
              </button>
            )}
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <div style={{backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",
                background:"rgba(5,15,30,0.85)",border:"1px solid rgba(26,53,85,0.6)",
                borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.teal,letterSpacing:3}}>NOTRYA</span>
                <span style={{color:T.txt4,fontFamily:"JetBrains Mono",fontSize:10}}>/</span>
                <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3,letterSpacing:2}}>ECG HUB</span>
              </div>
              <div style={{height:1,flex:1,background:"linear-gradient(90deg,rgba(42,79,122,0.6),transparent)"}}/>
              <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1}}>{allPats.length} PATTERNS</span>
            </div>
            <h1 className="shimmer-text"
              style={{fontFamily:"Playfair Display",fontSize:"clamp(24px,4vw,40px)",fontWeight:900,letterSpacing:-1,lineHeight:1.1}}>
              ECG Hub
            </h1>
            <p style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3,marginTop:4}}>
              12-lead interpretation · STEMI equivalents · Dangerous patterns · QTc calculator · Systematic approach
            </p>
          </div>
        )}

        {/* ── Embedded compact header ── */}
        {embedded && (
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <span style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:15,color:T.red}}>
              ECG Hub
            </span>
            <span style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,
              letterSpacing:1.5,textTransform:"uppercase",
              background:"rgba(255,68,68,0.1)",border:"1px solid rgba(255,68,68,0.25)",
              borderRadius:4,padding:"2px 7px"}}>
              {allPats.length} Patterns · QTc Calc · Systematic Read
            </span>
          </div>
        )}

        {/* Stat Banner */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:10,marginBottom:16}}>
          {[
            {label:"Door-to-ECG",   value:"<= 10 min",    sub:"All chest pain",        color:T.red   },
            {label:"STEMI D2B",     value:"< 90 min",     sub:"Door-to-balloon",        color:T.coral },
            {label:"QTc High Risk", value:">= 500 ms",    sub:"TdP threshold",          color:T.orange},
            {label:"WPW + AF",      value:"Procainamide", sub:"No AV-nodal blockers",   color:T.yellow},
            {label:"Wide Complex",  value:"VT First",     sub:"Until proven otherwise", color:T.purple},
          ].map((b,i) => (
            <div key={i} style={{...glass,padding:"10px 14px",borderLeft:`3px solid ${b.color}`,
              background:`linear-gradient(135deg,${b.color}12,rgba(8,22,40,0.8))`}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:14,fontWeight:700,color:b.color}}>{b.value}</div>
              <div style={{fontFamily:"DM Sans",fontWeight:600,color:T.txt,fontSize:10,margin:"2px 0"}}>{b.label}</div>
              <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt4}}>{b.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{...glass,padding:"7px",display:"flex",gap:5,marginBottom:16,flexWrap:"wrap"}}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setExpanded(null); }}
              style={{flex:"1 1 auto",fontFamily:"DM Sans",fontWeight:600,fontSize:12,
                padding:"9px 8px",borderRadius:10,
                border:`1px solid ${tab === t.id ? "rgba(255,68,68,0.5)" : "transparent"}`,
                background:tab === t.id
                  ? "linear-gradient(135deg,rgba(255,68,68,0.18),rgba(255,68,68,0.07))"
                  : "transparent",
                color:tab === t.id ? T.coral : T.txt3,
                cursor:"pointer",textAlign:"center",transition:"all .15s",whiteSpace:"nowrap"}}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── STEMI & EQUIVALENTS ─────────────────────────────────── */}
        {tab === "stemi" && (
          <div className="fade-in">
            {/* ACS sub-tabs */}
            <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}>
              {[{id:"stemi",label:"STEMI & Equivalents",icon:"🫀"},
                {id:"nstemi",label:"NSTEMI Assessment",icon:"📈"}].map(t => (
                <button key={t.id} onClick={() => setAcsSubTab(t.id)}
                  style={{padding:"7px 14px",borderRadius:8,cursor:"pointer",whiteSpace:"nowrap",
                    fontFamily:"DM Sans",fontWeight:600,fontSize:12,transition:"all .12s",
                    border:`1px solid ${acsSubTab===t.id?"rgba(255,68,68,0.5)":"rgba(42,79,122,0.3)"}`,
                    background:acsSubTab===t.id?"rgba(255,68,68,0.12)":"rgba(8,22,40,0.5)",
                    color:acsSubTab===t.id?T.coral:T.txt4}}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            {acsSubTab === "nstemi" && (
              <ECGNSTEMIHub embedded={true}/>
            )}
            {acsSubTab === "stemi" && <div>
            <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.red,
              textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>
              STEMI & Equivalents -- Not all STEMIs show ST elevation
            </div>
            <div style={{padding:"10px 14px",background:"rgba(255,68,68,0.07)",
              border:"1px solid rgba(255,68,68,0.22)",borderRadius:10,marginBottom:16,
              fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              <strong style={{color:T.red}}>OMI vs STEMI:</strong> The Occlusion MI (OMI) paradigm recognizes that complete coronary occlusion can occur without classic STE. De Winter, Posterior STEMI, Wellens, and hyperacute T waves all represent OMI requiring cath lab activation. A "normal" ECG does not rule out complete occlusion -- serial ECGs and troponin are mandatory.
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {STEMI_PATS.map(pat => (
                <PatternCard key={pat.id} pat={pat} expanded={expanded === pat.id}
                  onToggle={() => toggle(pat.id)} animate={true}/>
              ))}
            </div>
            </div>}  {/* end acsSubTab === "stemi" */}
          </div>
        )}

        {/* ── DANGEROUS PATTERNS ──────────────────────────────────── */}
        {tab === "danger" && (
          <div className="fade-in">
            <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.orange,
              textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>
              Dangerous Patterns -- Misread = missed cardiac arrest
            </div>
            <div style={{padding:"10px 14px",background:"rgba(255,159,67,0.07)",
              border:"1px solid rgba(255,159,67,0.22)",borderRadius:10,marginBottom:16,
              fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              <strong style={{color:T.orange}}>Wide complex tachycardia rule:</strong> Treat every wide complex regular tachycardia as VT until an alternate diagnosis is confirmed with certainty. A patient who is hemodynamically stable with WCT is still probably in VT. Never give calcium-channel blockers to an undifferentiated wide complex tachycardia.
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {DANGER_PATS.map(pat => (
                <PatternCard key={pat.id} pat={pat} expanded={expanded === pat.id}
                  onToggle={() => toggle(pat.id)} animate={true}/>
              ))}
            </div>
          </div>
        )}

        {/* ── QTc CALCULATOR ──────────────────────────────────────── */}
        {tab === "qtcalc" && (
          <div className="fade-in">
            <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.teal,
              textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>
              QTc Calculator -- Bazett + Fridericia Formulas
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,alignItems:"start"}}>

              <div style={{...glass,padding:"22px 24px"}}>
                <div style={{fontFamily:"Playfair Display",fontSize:20,fontWeight:700,color:T.txt,marginBottom:20}}>
                  QT Interval Calculator
                </div>
                <div style={{marginBottom:16}}>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt4,
                    textTransform:"uppercase",letterSpacing:1,marginBottom:7}}>QT Interval (ms)</div>
                  <input type="number" value={qtMs} onChange={e => setQtMs(e.target.value)}
                    placeholder="e.g. 440"
                    style={{width:"100%",background:"rgba(14,37,68,0.8)",
                      border:"1px solid rgba(42,79,122,0.5)",borderRadius:10,
                      padding:"11px 14px",color:T.txt,fontFamily:"JetBrains Mono",
                      fontSize:18,outline:"none",transition:"border-color .15s"}}
                    onFocus={e => e.target.style.borderColor = T.teal}
                    onBlur={e  => e.target.style.borderColor = "rgba(42,79,122,0.5)"}/>
                  <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4,marginTop:5}}>
                    Measure from QRS onset to end of T wave. Use the longest QT across all 12 leads.
                  </div>
                </div>
                <div style={{marginBottom:20}}>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt4,
                    textTransform:"uppercase",letterSpacing:1,marginBottom:7}}>Heart Rate (bpm)</div>
                  <input type="number" value={hrBpm} onChange={e => setHrBpm(e.target.value)}
                    placeholder="e.g. 72"
                    style={{width:"100%",background:"rgba(14,37,68,0.8)",
                      border:"1px solid rgba(42,79,122,0.5)",borderRadius:10,
                      padding:"11px 14px",color:T.txt,fontFamily:"JetBrains Mono",
                      fontSize:18,outline:"none",transition:"border-color .15s"}}
                    onFocus={e => e.target.style.borderColor = T.teal}
                    onBlur={e  => e.target.style.borderColor = "rgba(42,79,122,0.5)"}/>
                  <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4,marginTop:5}}>
                    Use the RR interval of the beat containing the QT being measured for accuracy.
                  </div>
                </div>
                {!qtResult && (
                  <div style={{padding:"16px",background:"rgba(42,79,122,0.15)",
                    border:"1px solid rgba(42,79,122,0.3)",borderRadius:10,
                    textAlign:"center",fontFamily:"DM Sans",fontSize:12,color:T.txt4}}>
                    Enter QT interval and heart rate above
                  </div>
                )}
                {qtResult && (
                  <div className="fade-in"
                    style={{background:`${qtResult.ic}10`,border:`1px solid ${qtResult.ic}44`,borderRadius:12,padding:"18px 20px"}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
                      <div>
                        <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
                          textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Bazett QTc</div>
                        <div style={{fontFamily:"JetBrains Mono",fontSize:32,fontWeight:700,
                          color:qtResult.ic,lineHeight:1}}>{qtResult.bazett}</div>
                        <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt4,marginTop:3}}>QT / sqrt(RR sec)</div>
                      </div>
                      <div>
                        <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
                          textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Fridericia QTc</div>
                        <div style={{fontFamily:"JetBrains Mono",fontSize:32,fontWeight:700,
                          color:T.txt2,lineHeight:1}}>{qtResult.fridericia}</div>
                        <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt4,marginTop:3}}>QT / cbrt(RR sec)</div>
                      </div>
                    </div>
                    <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:15,
                      color:qtResult.ic,marginBottom:5}}>{qtResult.interp}</div>
                    <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6}}>
                      {qtResult.risk}
                    </div>
                    <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,marginTop:12}}>
                      RR = {qtResult.rr} ms · Fridericia more accurate at HR outside 60-100 bpm
                    </div>
                  </div>
                )}
                <div style={{marginTop:16,padding:"12px 14px",background:"rgba(0,229,192,0.07)",
                  border:"1px solid rgba(0,229,192,0.2)",borderRadius:10}}>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.teal,
                    textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Formulas</div>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.txt2,lineHeight:1.8}}>
                    Bazett: QTc = QT / sqrt(RR)<br/>
                    Fridericia: QTc = QT / RR^(1/3)<br/>
                    <span style={{fontSize:10,color:T.txt4}}>RR in seconds = 60 / HR(bpm)</span>
                  </div>
                </div>
              </div>

              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <div style={{...glass,padding:"20px 22px"}}>
                  <div style={{fontFamily:"Playfair Display",fontSize:18,fontWeight:700,color:T.txt,marginBottom:14}}>
                    QTc Reference
                  </div>
                  {[
                    {r:"<= 340 ms",  i:"Short QT",              c:T.yellow, a:"Short QT syndrome, hypercalcemia, digitalis"},
                    {r:"341-439 ms", i:"Normal (male)",          c:T.green,  a:"No action required based on QTc alone"},
                    {r:"341-459 ms", i:"Normal (female)",        c:T.green,  a:"No action required based on QTc alone"},
                    {r:"440-499 ms", i:"Borderline / Prolonged", c:T.yellow, a:"Review drugs, correct electrolytes, monitor"},
                    {r:"500-599 ms", i:"Markedly Prolonged",     c:T.orange, a:"Stop offending drugs · Mg2+ 2g IV · K+ > 4.0"},
                    {r:">= 600 ms",  i:"Critically Prolonged",   c:T.red,    a:"Imminent TdP · pacing · EP consult emergently"},
                  ].map((row,i) => (
                    <div key={i} style={{display:"grid",gridTemplateColumns:"100px 1fr",gap:10,
                      padding:"8px 0",borderBottom:"1px solid rgba(42,79,122,0.2)"}}>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:10,fontWeight:700,
                        color:row.c,lineHeight:1.4}}>{row.r}</div>
                      <div>
                        <div style={{fontFamily:"DM Sans",fontWeight:600,fontSize:11,
                          color:row.c,marginBottom:2}}>{row.i}</div>
                        <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,lineHeight:1.3}}>{row.a}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{...glass,padding:"18px 20px"}}>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,
                    textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>
                    Common Causes of QT Prolongation
                  </div>
                  {[
                    "Electrolytes: hypokalemia, hypomagnesemia, hypocalcemia",
                    "Antipsychotics: haloperidol, quetiapine, ziprasidone, thioridazine",
                    "Antiarrhythmics: class Ia (procainamide, quinidine), class III (amiodarone, sotalol)",
                    "Antibiotics: azithromycin, fluoroquinolones, metronidazole",
                    "Other: methadone, TCA overdose, ondansetron, hydroxychloroquine",
                    "Cardiac: myocarditis, post-MI, HCM",
                    "Congenital: Romano-Ward (LQTS1/2/3), Jervell-Lange-Nielsen",
                    "Hypothyroidism, hypothermia, SAH (catecholamine surge)",
                  ].map((c,i) => <BulletRow key={i} text={c} color={T.orange}/>)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── AI INTERPRETATION */}
        {tab === "ai" && (
          <div className="fade-in">
            <ECGAIInterpreter embedded={true}
              demo={demo} vitals={vitals} cc={cc}
              medications={medications} pmhSelected={pmhSelected}/>
          </div>
        )}

        {/* ── CLINICAL TOOLS */}
        {tab === "tools" && (
          <div className="fade-in">
            <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.teal,
              textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>
              Clinical Decision Tools -- 2025 ACS / 2023 AF / 2018 Bradycardia / 2017 VA Guidelines
            </div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:14}}>
              {TOOL_TABS.map(t => (
                <button key={t.id} onClick={() => setActiveTool(t.id)}
                  style={{fontFamily:"DM Sans",fontWeight:600,fontSize:11,
                    padding:"7px 12px",borderRadius:8,cursor:"pointer",whiteSpace:"nowrap",
                    border:`1px solid ${activeTool===t.id?"rgba(0,229,192,0.5)":"rgba(42,79,122,0.3)"}`,
                    background:activeTool===t.id?"rgba(0,229,192,0.12)":"rgba(8,22,40,0.5)",
                    color:activeTool===t.id?T.teal:T.txt4,transition:"all .12s"}}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            <div style={{...glass,padding:"18px 20px"}}>
              {activeTool === "territory" && (
                <div>
                  <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:17,color:T.txt,marginBottom:3}}>STEMI Territory Localizer</div>
                  <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4,marginBottom:14}}>Select lead findings to identify territory, culprit artery, and 2025 guideline-based action</div>
                  <STEMILocalizer leadStates={leadStates} setLeadStates={setLeadStates}/>
                </div>
              )}
              {activeTool === "avblock" && (
                <div>
                  <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:17,color:T.txt,marginBottom:3}}>AV Block Classifier</div>
                  <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4,marginBottom:14}}>Step through P:QRS relationship to classify block degree and pacing urgency</div>
                  <AVBlockClassifier avAnswers={avAnswers} setAvAnswers={setAvAnswers}/>
                </div>
              )}
              {activeTool === "wct" && (
                <div>
                  <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:17,color:T.txt,marginBottom:3}}>Wide Complex Tachycardia Differentiator</div>
                  <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4,marginBottom:14}}>Brugada 4-step algorithm: VT vs SVT with aberrancy</div>
                  <WCTDifferentiator wctAnswers={wctAnswers} setWctAnswers={setWctAnswers}/>
                </div>
              )}
              {activeTool === "chads" && (
                <div>
                  <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:17,color:T.txt,marginBottom:3}}>CHA2DS2-VASc Stroke Risk</div>
                  <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4,marginBottom:14}}>AF stroke risk and anticoagulation recommendation per 2023 ACC/AHA AF Guideline</div>
                  <CHADVAScCalc chadVars={chadVars} setChadVars={setChadVars}/>
                </div>
              )}
              {activeTool === "serial" && (
                <div>
                  <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:17,color:T.txt,marginBottom:3}}>Serial ECG Protocol Timer</div>
                  <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4,marginBottom:14}}>Class 1: serial ECGs at 0, 30, and 60 min for nondiagnostic initial ECG with high ACS suspicion</div>
                  <SerialECGTimer timerStart={timerStart} setTimerStart={setTimerStart} tickNow={tickNow}/>
                </div>
              )}
              {activeTool === "af" && (
                <div>
                  <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:17,color:T.txt,marginBottom:3}}>AF Clinical Decision Pathway</div>
                  <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt4,marginBottom:14}}>Stability, onset timing, cardioversion vs rate control, anticoagulation -- 2023 ACC/AHA AF Guideline</div>
                  <ECGAFPathway embedded={true} afAnswers={afAnswers} setAfAnswers={setAfAnswers}/>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SYSTEMATIC READ ──────────────────────────────────────── */}
        {tab === "systematic" && (
          <div className="fade-in">
            <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.teal,
              textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>
              Systematic ECG Interpretation -- Same 8 steps, every ECG, every time
            </div>
            <div style={{padding:"10px 14px",background:"rgba(0,229,192,0.07)",
              border:"1px solid rgba(0,229,192,0.22)",borderRadius:10,marginBottom:16,
              fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              The most dangerous ECG read is a non-systematic one. Anchoring on the chief complaint causes missed patterns -- a chest pain patient's Brugada sign or a sepsis patient's hyperkalemia are both found only by completing all 8 steps regardless of the presenting picture.
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
              <div style={{paddingRight:6}}>
                {STEPS.slice(0,4).map(step => (
                  <StepCard key={step.n} step={step} expanded={stepExp === step.n}
                    onToggle={() => toggleStep(step.n)}/>
                ))}
              </div>
              <div style={{paddingLeft:6}}>
                {STEPS.slice(4).map(step => (
                  <StepCard key={step.n} step={step} expanded={stepExp === step.n}
                    onToggle={() => toggleStep(step.n)}/>
                ))}
              </div>
            </div>
            <div style={{...glass,padding:"16px 20px",marginTop:6}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.yellow,
                textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>
                High-Yield Pearls for ECG Reading
              </div>
              {[
                "Always compare to a prior ECG -- a subtle new change carries far more diagnostic weight than any isolated finding.",
                "Serial ECGs are more valuable than a single snapshot -- obtain at 0, 30, and 60 minutes for undifferentiated chest pain.",
                "In LBBB + chest pain, apply modified Sgarbossa: concordant STE >= 1mm in any lead = STEMI equivalent. Perform STEMIs in LBBB.",
                "QTc should be measured manually in at least 2-3 leads -- machine QTc is unreliable in 30% of ECGs, especially with bundle branch blocks.",
                "aVR is the 13th lead. STE in aVR with diffuse depression = LMCA or proximal LAD -- do not dismiss as artifact.",
                "In atrial fibrillation with a rapid irregular wide complex response: this is WPW + AF until proven otherwise. Do not give adenosine.",
              ].map((p,i) => (
                <div key={i} style={{display:"flex",gap:8,marginBottom:8}}>
                  <span style={{color:T.yellow,fontSize:10,marginTop:2,flexShrink:0}}>💎</span>
                  <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6}}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}

                {/* Footer (standalone only) */}
        {!embedded && (
          <div style={{textAlign:"center",paddingBottom:24,paddingTop:14}}>
            <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5}}>
              NOTRYA ECG HUB · PATTERNS ARE EDUCATIONAL REFERENCES -- INTERPRET ALL ECGs IN FULL CLINICAL CONTEXT · ECG MISREAD IS A LEADING SOURCE OF EM LIABILITY
            </span>
          </div>
        )}
      </div>
    </div>
  );
}