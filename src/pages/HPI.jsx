import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import CreateTemplateModal from "@/components/hpi/CreateTemplateModal";

// ── Font + CSS Injection ────────────────────────────────────────────
(() => {
  if (document.getElementById("hpi-fonts")) return;
  const l = document.createElement("link"); l.id = "hpi-fonts";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "hpi-css";
  s.textContent = `
    @keyframes hpi-in    { from{opacity:0;transform:translateY(6px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
    @keyframes hpi-chip  { from{opacity:0;transform:scale(.88)} to{opacity:1;transform:scale(1)} }
    @keyframes hpi-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(255,107,107,0.4)} 50%{box-shadow:0 0 0 10px rgba(255,107,107,0)} }
    @keyframes hpi-type  { from{opacity:0;transform:translateX(-4px)} to{opacity:1;transform:translateX(0)} }
    @keyframes hpi-wave  { 0%,100%{height:6px} 50%{height:20px} }
    @keyframes hpi-spin  { to{transform:rotate(360deg)} }
    @keyframes hpi-shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
    @keyframes hpi-blink { 0%,100%{opacity:1} 50%{opacity:0} }
    .hpi-in    { animation: hpi-in .32s cubic-bezier(.34,1.56,.64,1) forwards; }
    .hpi-chip  { animation: hpi-chip .2s cubic-bezier(.34,1.56,.64,1) forwards; }
    .hpi-type  { animation: hpi-type .25s ease forwards; }
    .chip-btn  { transition: all .15s ease; cursor: pointer; }
    .chip-btn:hover { transform: translateY(-2px) scale(1.04); }
    .chip-btn:active { transform: scale(.95); }
    .cc-card   { transition: all .18s ease; cursor: pointer; }
    .cc-card:hover { transform: translateY(-3px); }
    .hpi-shimmer {
      background: linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#00e5c0 55%,#e8f0fe 100%);
      background-size:250% auto; -webkit-background-clip:text;
      -webkit-text-fill-color:transparent; background-clip:text;
      animation: hpi-shimmer 5s linear infinite;
    }
    .slot-active { animation: hpi-blink 1s ease infinite; }
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:rgba(42,79,122,0.5);border-radius:2px;}
    select option { background:#0e2340; color:#c8ddf0; }
  `;
  document.head.appendChild(s);
})();

// ── Design Tokens ───────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36", up:"#0e2544",
  b:"rgba(26,53,85,0.8)", bhi:"rgba(42,79,122,0.9)",
  txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  coral:"#ff6b6b", gold:"#f5c842", teal:"#00e5c0", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", cyan:"#00d4ff",
  rose:"#f472b6",
};

// ── Glass Helpers ────────────────────────────────────────────────────
const glass = (x={}) => ({ backdropFilter:"blur(24px) saturate(200%)", WebkitBackdropFilter:"blur(24px) saturate(200%)", background:"rgba(8,22,40,0.75)", border:"1px solid rgba(26,53,85,0.45)", borderRadius:14, ...x });
const deepGlass = (x={}) => ({ backdropFilter:"blur(40px) saturate(220%)", WebkitBackdropFilter:"blur(40px) saturate(220%)", background:"rgba(5,15,30,0.88)", border:"1px solid rgba(26,53,85,0.7)", ...x });

// ═══════════════════════════════════════════════════════════════════
// CHIEF COMPLAINT DATA — Contextual OPQRST chips per CC
// ═══════════════════════════════════════════════════════════════════
const CC_DATA = {
  chest_pain: {
    icon:"❤️", label:"Chest Pain", color:T.coral,
    gl:"rgba(255,107,107,0.12)", cat:"Cardiac",
    onset:     ["sudden","gradual","acute on chronic","insidious","exertional"],
    quality:   ["pressure","crushing","squeezing","sharp","burning","tearing","pleuritic","dull","aching"],
    location:  ["substernal","left-sided","right-sided","diffuse","epigastric","precordial","midsternal"],
    severity:  null, // uses NRS slider
    radiation: ["non-radiating","left arm","jaw","right arm","back","bilateral shoulders","shoulder","neck"],
    duration:  ["< 5 min","5–30 min","30 min–2 hrs","2–6 hrs","6–24 hrs","days","weeks","intermittent × days"],
    timing:    ["constant","intermittent","episodic","progressive","waxing and waning","crescendo"],
    worse:     ["exertion","inspiration","lying flat","palpation","eating","cold air","stress","movement"],
    better:    ["rest","nitroglycerin","position change","antacids","leaning forward","oxygen"],
    assoc:     ["dyspnea","diaphoresis","nausea","vomiting","palpitations","syncope","near-syncope","fever","cough","leg swelling","orthopnea","PND"],
    neg:       ["no diaphoresis","no syncope","no dyspnea","no palpitations","no fever","no trauma","no leg swelling","no cough"],
    riskFlags: { onset:"sudden", qual:["tearing","ripping"], msg:"⚠ Consider aortic dissection workup" },
  },
  dyspnea: {
    icon:"🫁", label:"Shortness of Breath", color:T.blue,
    gl:"rgba(59,158,255,0.12)", cat:"Pulmonary",
    onset:     ["sudden","gradual","acute","subacute","insidious","acute on chronic"],
    quality:   ["air hunger","unable to catch breath","cannot complete sentences","labored","wheezing","tightness","smothering"],
    location:  ["at rest","with exertion","lying flat","with activity","at night"],
    severity:  null,
    radiation: ["non-specific"],
    duration:  ["minutes","< 1 hr","1–6 hrs","6–24 hrs","days","weeks","progressive"],
    timing:    ["constant","intermittent","episodic","progressive","nocturnal","positional"],
    worse:     ["exertion","lying flat","allergen exposure","cold air","stress","eating","physical activity"],
    better:    ["sitting upright","supplemental O₂","bronchodilators","position change","rest"],
    assoc:     ["chest pain","cough","wheezing","fever","leg swelling","palpitations","hemoptysis","orthopnea","PND","sputum production"],
    neg:       ["no chest pain","no fever","no leg swelling","no hemoptysis","no wheezing","no cough"],
    riskFlags: { onset:"sudden", qual:["air hunger"], msg:"⚠ Evaluate for PE/pneumothorax" },
  },
  abd_pain: {
    icon:"🫃", label:"Abdominal Pain", color:T.orange,
    gl:"rgba(255,159,67,0.12)", cat:"GI / GU",
    onset:     ["sudden","gradual","crampy","acute","colicky","insidious","acute on chronic"],
    quality:   ["sharp","crampy","dull","aching","colicky","burning","pressure","constant","knife-like"],
    location:  ["RUQ","LUQ","RLQ","LLQ","periumbilical","diffuse","epigastric","suprapubic","flank","RLQ migrating from periumbilical"],
    severity:  null,
    radiation: ["non-radiating","back","shoulder","groin","pelvis","right shoulder","bilateral flank"],
    duration:  ["< 30 min","30 min–2 hrs","2–6 hrs","6–24 hrs","days","weeks"],
    timing:    ["constant","intermittent","episodic","postprandial","nocturnal","progressive"],
    worse:     ["eating","movement","palpation","breathing","defecation","urination","fatty foods","lying flat"],
    better:    ["NPO","antacids","NSAIDs","defecation","urination","position change","heat"],
    assoc:     ["nausea","vomiting","fever","diarrhea","constipation","hematuria","dysuria","vaginal discharge","anorexia","jaundice","hematemesis","melena","hematochezia"],
    neg:       ["no fever","no nausea","no vomiting","no diarrhea","no hematuria","no hematochezia","no jaundice"],
    riskFlags: { onset:"sudden", loc:"periumbilical", msg:"⚠ R/O appendicitis — assess migration pattern" },
  },
  headache: {
    icon:"🧠", label:"Headache", color:T.purple,
    gl:"rgba(155,109,255,0.12)", cat:"Neuro",
    onset:     ["sudden thunderclap","gradual","acute","subacute","insidious","worst headache of life","upon waking"],
    quality:   ["throbbing","pulsating","pressure","tight band-like","stabbing","sharp","dull","constant","drilling","splitting"],
    location:  ["bilateral","unilateral left","unilateral right","frontal","occipital","temporal","parietal","vertex","periorbital","retroorbital"],
    severity:  null,
    radiation: ["non-radiating","neck","jaw","eye","facial","shoulder"],
    duration:  ["< 1 hr","1–4 hrs","4–72 hrs","days","weeks","progressive"],
    timing:    ["constant","intermittent","progressive","episodic","nocturnal","on awakening"],
    worse:     ["light (photophobia)","sound (phonophobia)","movement","Valsalva","bending forward","exertion","lying flat","bright lights","odors"],
    better:    ["dark room","quiet","analgesics","triptans","rest","sleep","cold compress","caffeine"],
    assoc:     ["nausea","vomiting","photophobia","phonophobia","visual aura","neck stiffness","fever","altered consciousness","focal neuro deficit","lacrimation","rhinorrhea","diplopia"],
    neg:       ["no fever","no neck stiffness","no focal neuro deficit","no visual changes","no vomiting","no aura","no altered consciousness"],
    riskFlags: { onset:"sudden thunderclap", msg:"⚠ CRITICAL: Thunderclap onset — R/O SAH urgently" },
  },
  back_pain: {
    icon:"🦴", label:"Back Pain", color:T.gold,
    gl:"rgba(245,200,66,0.12)", cat:"MSK",
    onset:     ["sudden","gradual","after lifting","after twisting","acute on chronic","traumatic","insidious"],
    quality:   ["sharp","dull","aching","crampy","burning","shooting","electric","stiffness","radiating"],
    location:  ["lumbar","thoracic","cervical","lumbosacral","right paravertebral","left paravertebral","bilateral","midline","sacral"],
    severity:  null,
    radiation: ["non-radiating","right leg","left leg","bilateral legs","groin","hip","buttock","to toe","perineum"],
    duration:  ["hours","days","weeks","months","acute on chronic"],
    timing:    ["constant","intermittent","worse AM","worse end of day","episodic","progressive"],
    worse:     ["forward flexion","extension","sitting","standing","walking","lifting","lying flat","Valsalva"],
    better:    ["rest","walking","NSAIDs","position change","heat","stretching","lying down"],
    assoc:     ["leg weakness","numbness/tingling","bowel changes","bladder changes","saddle anesthesia","fever","weight loss","trauma","fall"],
    neg:       ["no saddle anesthesia","no bowel/bladder dysfunction","no leg weakness","no fever","no weight loss","no trauma"],
    riskFlags: { assoc:["saddle anesthesia","bowel changes","bladder changes"], msg:"⚠ Cauda equina: STAT MRI indicated" },
  },
  syncope: {
    icon:"😵", label:"Syncope / Near-Syncope", color:T.cyan,
    gl:"rgba(0,212,255,0.12)", cat:"Cardiac/Neuro",
    onset:     ["sudden","preceded by prodrome","upon standing","during exertion","during Valsalva","emotional trigger"],
    quality:   ["complete LOC","near-syncope","presyncope","witnessed by others","unwitnessed","recurrent","first episode"],
    location:  ["standing","sitting","lying to standing","exertional","toileting","coughing","supine"],
    severity:  null,
    radiation: ["N/A"],
    duration:  ["< 30 sec","30 sec–2 min","2–5 min","prolonged > 5 min","unknown"],
    timing:    ["single episode","recurrent","progressive frequency"],
    worse:     ["standing","dehydration","heat","exertion","Valsalva","pain/fear","prolonged standing"],
    better:    ["lying supine","fluids","cool environment"],
    assoc:     ["diaphoresis","pallor","palpitations","chest pain","dyspnea","incontinence","convulsive movements","confusion","tongue bite","prodrome","nausea"],
    neg:       ["no chest pain","no palpitations prior","no tongue bite","no post-ictal state","no incontinence","no trauma","no prior episodes"],
    riskFlags: { onset:"during exertion", msg:"⚠ Exertional syncope — high risk; cardiac evaluation urgent" },
  },
  ams: {
    icon:"🌀", label:"Altered Mental Status", color:T.rose,
    gl:"rgba(244,114,182,0.12)", cat:"Neuro",
    onset:     ["sudden","acute","gradual","subacute","unknown","fluctuating","waxing and waning"],
    quality:   ["confusion","agitation","lethargy","obtundation","stupor","combativeness","disorientation","hallucinations","bizarre behavior"],
    location:  ["N/A — global"],
    severity:  null,
    radiation: ["N/A"],
    duration:  ["hours","days","weeks","unknown","progressive"],
    timing:    ["fluctuating","progressive","constant","intermittent","worse at night (sundowning)"],
    worse:     ["nighttime","unfamiliar environment","pain","urinary retention","medication change"],
    better:    ["familiar persons","reorientation","pain control","quiet environment"],
    assoc:     ["fever","headache","neck stiffness","focal neuro deficit","seizure","incontinence","recent fall","medication change","polysubstance use","metabolic derangement"],
    neg:       ["no fever","no focal neuro deficit","no headache","no neck stiffness","no seizure","no trauma","no recent medication change"],
    riskFlags: { onset:"sudden", msg:"⚠ Sudden AMS — R/O stroke, ICH, metabolic emergency" },
  },
  extremity: {
    icon:"💪", label:"Extremity / Joint Pain", color:T.teal,
    gl:"rgba(0,229,192,0.12)", cat:"MSK / Ortho",
    onset:     ["sudden","after trauma","gradual","after activity","acute on chronic","spontaneous","after fall","overuse"],
    quality:   ["sharp","dull","throbbing","aching","stiffness","swelling","warmth","limited ROM","locking","giving way"],
    location:  ["right shoulder","left shoulder","right elbow","left elbow","right wrist","left wrist","right hand","left hand","right hip","left hip","right knee","left knee","right ankle","left ankle","right foot","left foot"],
    severity:  null,
    radiation: ["non-radiating","distal","proximal","along nerve distribution"],
    duration:  ["hours","days","weeks","chronic","acute on chronic"],
    timing:    ["constant","intermittent","with movement","AM stiffness","after activity","weight-bearing"],
    worse:     ["weight-bearing","movement","palpation","passive ROM","active ROM","cold","rest"],
    better:    ["elevation","rest","ice","NSAIDs","heat","immobilization"],
    assoc:     ["swelling","erythema","warmth","restricted ROM","numbness","tingling","weakness","deformity","skin changes","fever","rash"],
    neg:       ["no deformity","no swelling","no erythema","no neurovascular deficit","no fever","no skin breakdown"],
    riskFlags: { assoc:["fever"], loc:["right knee","left knee","right ankle"], msg:"⚠ Septic joint must be ruled out" },
  },
  fever: {
    icon:"🌡️", label:"Fever / Infection", color:"#ff7043",
    gl:"rgba(255,112,67,0.12)", cat:"Infectious",
    onset:     ["sudden","gradual","acute","subacute","low-grade for days","high-grade acute"],
    quality:   ["subjective fever","measured fever","rigors/chills","night sweats","drenching sweats","intermittent","continuous"],
    location:  ["N/A — systemic","+ localizing symptoms below"],
    severity:  null,
    radiation: ["N/A"],
    duration:  ["hours","days","1–2 weeks","> 2 weeks","recurrent"],
    timing:    ["constant","intermittent","quotidian","tertian","nocturnal"],
    worse:     ["nighttime","exertion"],
    better:    ["antipyretics","antibiotics (started)","rest"],
    assoc:     ["cough","dysuria","neck stiffness","headache","rash","joint pain","diarrhea","abdominal pain","sore throat","ear pain","localized pain","altered mental status","photophobia"],
    neg:       ["no neck stiffness","no rash","no localizing symptoms","no urinary symptoms","no respiratory symptoms","no travel history","no animal exposure"],
    riskFlags: { temp:">40°C", msg:"⚠ Hyperpyrexia — consider CNS infection, sepsis, drug reaction" },
  },
  nv: {
    icon:"🤢", label:"Nausea / Vomiting", color:T.green,
    gl:"rgba(61,255,160,0.12)", cat:"GI",
    onset:     ["sudden","gradual","after eating","morning","after medication","acute","insidious"],
    quality:   ["nausea alone","nausea + vomiting","bilious","bloody","coffee-ground","food contents","projectile","dry heaves"],
    location:  ["N/A — GI"],
    severity:  null,
    radiation: ["N/A"],
    duration:  ["hours","< 1 day","1–3 days","days","weeks"],
    timing:    ["constant","intermittent","postprandial","morning","with movement"],
    worse:     ["eating","movement","odors","medications","standing","motion"],
    better:    ["NPO","antiemetics","lying still","clear liquids"],
    assoc:     ["abdominal pain","diarrhea","fever","headache","vertigo","blood in emesis","weight loss","jaundice","last oral intake"],
    neg:       ["no blood in emesis","no abdominal pain","no fever","no diarrhea","no blood in stool"],
    riskFlags: { qual:["bloody","coffee-ground"], msg:"⚠ GI bleed — STAT assessment required" },
  },
  palpitations: {
    icon:"💓", label:"Palpitations", color:T.coral,
    gl:"rgba(255,107,107,0.12)", cat:"Cardiac",
    onset:     ["sudden","gradual","upon exertion","at rest","nocturnal","after caffeine/stimulants","after alcohol"],
    quality:   ["racing","fluttering","pounding","skipping beats","irregular","regular","single beats","sustained"],
    location:  ["N/A — cardiac"],
    severity:  null,
    radiation: ["N/A"],
    duration:  ["seconds","< 5 min","5–30 min","hours","ongoing"],
    timing:    ["constant","paroxysmal","episodic","recurrent","new onset"],
    worse:     ["exertion","caffeine","alcohol","stress","lying on left side","positional"],
    better:    ["Valsalva","vagal maneuvers","rest","stopping activity"],
    assoc:     ["chest pain","dyspnea","syncope","near-syncope","diaphoresis","anxiety","fever","palpable thyroid"],
    neg:       ["no chest pain","no syncope","no dyspnea","no prior episodes","no cardiac history","no drug use"],
    riskFlags: { assoc:["syncope","chest pain"], msg:"⚠ Syncope + palpitations — high-risk dysrhythmia suspected" },
  },
  dizziness: {
    icon:"💫", label:"Dizziness / Vertigo", color:T.blue,
    gl:"rgba(59,158,255,0.12)", cat:"Neuro / ENT",
    onset:     ["sudden","with position change","upon standing","gradual","episodic","recurrent"],
    quality:   ["true vertigo — room spinning","lightheadedness","presyncope","imbalance","dysequilibrium","spinning sensation","rocking"],
    location:  ["N/A"],
    severity:  null,
    radiation: ["N/A"],
    duration:  ["seconds","< 1 min","1–20 min","hours","days","constant"],
    timing:    ["constant","intermittent","positional","episodic","progressive"],
    worse:     ["head movement","rolling in bed","standing","Dix-Hallpike","visual stimulation"],
    better:    ["lying still","closing eyes","certain positions","antihistamines"],
    assoc:     ["nausea","vomiting","tinnitus","hearing loss","headache","facial droop","diplopia","dysarthria","ataxia","falls","ear pain"],
    neg:       ["no focal neuro deficit","no headache","no hearing loss","no tinnitus","no diplopia","no dysarthria","no facial droop"],
    riskFlags: { assoc:["diplopia","dysarthria","facial droop","ataxia"], msg:"⚠ Central vertigo signs — STAT MRI for posterior fossa pathology" },
  },
  trauma: {
    icon:"🦺", label:"Trauma / Injury", color:T.orange,
    gl:"rgba(255,159,67,0.12)", cat:"Trauma",
    onset:     ["MVA","fall","assault","sports injury","work injury","recreational injury","self-inflicted","unknown mechanism"],
    quality:   ["blunt","penetrating","crush","blast","burn","high-energy","low-energy"],
    location:  ["head","neck","chest","abdomen","pelvis","spine","upper extremity","lower extremity","face","multiple regions"],
    severity:  null,
    radiation: ["N/A"],
    duration:  ["< 1 hr ago","1–6 hrs ago","6–24 hrs ago","> 24 hrs ago"],
    timing:    ["single event","repetitive","ongoing"],
    worse:     ["movement","palpation","weight-bearing"],
    better:    ["immobilization","ice","analgesia"],
    assoc:     ["LOC","amnesia","headache","neck pain","chest pain","abdominal pain","extremity deformity","open wound","diaphoresis","blood at urethral meatus","pelvic instability"],
    neg:       ["no LOC","no amnesia","no neck pain","no abdominal pain","no extremity deformity","no diaphoresis"],
    riskFlags: { mech:"MVA", msg:"⚠ High-energy mechanism — activate trauma protocol" },
  },
  urinary: {
    icon:"🚽", label:"Urinary Symptoms", color:"#38bdf8",
    gl:"rgba(56,189,248,0.12)", cat:"GU / Renal",
    onset:     ["sudden","gradual","acute","subacute","hours","days"],
    quality:   ["dysuria","burning","frequency","urgency","hematuria","flank pain","suprapubic pressure","hesitancy","weak stream","incomplete emptying"],
    location:  ["suprapubic","flank (right)","flank (left)","bilateral flank","perineal","urethral","diffuse"],
    severity:  null,
    radiation: ["non-radiating","groin","testicle","labia","inner thigh","back"],
    duration:  ["hours","1–2 days","days","weeks","recurrent"],
    timing:    ["constant","intermittent","with urination","with movement"],
    worse:     ["urination","movement","palpation","sexual activity","holding urine"],
    better:    ["urinating","antibiotics (started)","analgesics","hydration"],
    assoc:     ["fever","chills","nausea","vomiting","hematuria","vaginal discharge","penile discharge","back pain","altered mental status"],
    neg:       ["no fever","no hematuria","no back pain","no vaginal discharge","no nausea","no vomiting"],
    riskFlags: { assoc:["fever","altered mental status"], msg:"⚠ Fever + urinary sx — evaluate for pyelonephritis / urosepsis" },
  },
  allergic: {
    icon:"🤧", label:"Allergic Reaction / Anaphylaxis", color:"#f472b6",
    gl:"rgba(244,114,182,0.12)", cat:"Allergy / Immunology",
    onset:     ["immediate (< 5 min)","within 30 min","1–2 hrs after exposure","delayed (hours)","unknown trigger"],
    quality:   ["urticaria","angioedema","facial swelling","throat tightness","difficulty swallowing","stridor","diffuse rash","pruritus","flushing"],
    location:  ["localized","generalized","face/lips/tongue","throat","extremities","torso"],
    severity:  null,
    radiation: ["N/A — systemic"],
    duration:  ["< 30 min","30 min–2 hrs","hours","biphasic (recurrence)"],
    timing:    ["constant","improving","worsening","biphasic"],
    worse:     ["further allergen exposure","exertion","upright position"],
    better:    ["epinephrine","antihistamines","corticosteroids","supine position","oxygen"],
    assoc:     ["dyspnea","wheezing","stridor","chest tightness","hypotension","syncope","nausea","vomiting","abdominal pain","diaphoresis","tachycardia"],
    neg:       ["no stridor","no dyspnea","no hypotension","no throat swelling","no prior reactions"],
    riskFlags: { assoc:["stridor","dyspnea","hypotension"], msg:"⚠ ANAPHYLAXIS — administer epinephrine IM immediately" },
  },
  eye: {
    icon:"👁️", label:"Eye Complaint", color:"#34d399",
    gl:"rgba(52,211,153,0.12)", cat:"Ophthalmology",
    onset:     ["sudden","gradual","after trauma","upon waking","with activity","insidious"],
    quality:   ["pain","redness","vision loss","blurry vision","diplopia","photophobia","foreign body sensation","discharge","tearing","flashes/floaters","itching"],
    location:  ["right eye","left eye","bilateral","periorbital"],
    severity:  null,
    radiation: ["non-radiating","headache","periorbital","facial"],
    duration:  ["minutes","hours","days","weeks"],
    timing:    ["constant","intermittent","progressive","sudden onset"],
    worse:     ["light (photophobia)","movement","reading","touch","bright environments"],
    better:    ["closing eye","dark room","eye drops","cold compress"],
    assoc:     ["headache","nausea","vomiting","fever","trauma","contact lens use","chemical exposure","halos around lights","eye discharge"],
    neg:       ["no vision loss","no diplopia","no trauma","no chemical exposure","no contact lens use","no headache"],
    riskFlags: { qual:["vision loss","flashes/floaters"], msg:"⚠ Acute vision loss or floaters — STAT ophthalmology evaluation" },
  },
  stroke_sx: {
    icon:"🧠", label:"Stroke Symptoms / Focal Neuro Deficit", color:"#a78bfa",
    gl:"rgba(167,139,250,0.12)", cat:"Neuro",
    onset:     ["sudden — exact time known","sudden — last known well","gradual","stuttering","wake-up stroke (found on waking)"],
    quality:   ["facial droop","arm weakness","leg weakness","speech difficulty (aphasia)","slurred speech (dysarthria)","vision change","diplopia","ataxia","numbness / paresthesia","vertigo","dysphagia"],
    location:  ["right-sided weakness","left-sided weakness","bilateral","face only","arm and face","leg only"],
    severity:  null,
    radiation: ["N/A"],
    duration:  ["< 1 hr (possible TIA)","1–24 hrs (possible TIA)","ongoing (> 24 hrs)","resolving"],
    timing:    ["constant","improving","worsening","fluctuating"],
    worse:     ["activity","lying flat"],
    better:    ["tPA (if applicable)","thrombectomy consideration"],
    assoc:     ["headache","nausea","vomiting","altered consciousness","seizure","palpitations","chest pain","hypertension","atrial fibrillation history"],
    neg:       ["no headache","no seizure","no trauma","no prior stroke","no anticoagulant use","no recent surgery"],
    riskFlags: { onset:"sudden — exact time known", msg:"⚠ STROKE ALERT — activate code stroke, NIHSS, STAT CT/CTA" },
  },
  seizure: {
    icon:"⚡", label:"Seizure", color:"#fb923c",
    gl:"rgba(251,146,60,0.12)", cat:"Neuro",
    onset:     ["provoked (known trigger)","unprovoked (first seizure)","breakthrough (known epilepsy)","unknown","febrile (pediatric)"],
    quality:   ["tonic-clonic (grand mal)","focal / partial","absence","myoclonic","status epilepticus","postictal state","witnessed","unwitnessed"],
    location:  ["N/A — generalized","focal onset (right side)","focal onset (left side)"],
    severity:  null,
    radiation: ["N/A"],
    duration:  ["< 1 min","1–5 min","5–30 min","> 30 min (status epilepticus)","unknown duration"],
    timing:    ["single episode","cluster","recurrent","status epilepticus"],
    worse:     ["sleep deprivation","medication non-compliance","alcohol/drug use","fever","metabolic derangement","flashing lights"],
    better:    ["benzodiazepines","antiepileptics"],
    assoc:     ["LOC","tongue bite","urinary incontinence","post-ictal confusion","headache","injury from fall","fever","aura","prior seizure history"],
    neg:       ["no tongue bite","no incontinence","no post-ictal state","no prior seizure history","no fever","no trauma","no recent medication change"],
    riskFlags: { qual:["status epilepticus"], msg:"⚠ Status epilepticus — benzodiazepines STAT, neurology activation" },
  },
  gi_bleed: {
    icon:"🩸", label:"GI Bleeding", color:"#f87171",
    gl:"rgba(248,113,113,0.12)", cat:"GI",
    onset:     ["sudden","gradual","acute","recurrent","first episode"],
    quality:   ["hematemesis (bright red)","coffee-ground emesis","melena (black tarry stool)","hematochezia (bright red rectal)","maroon stool","occult blood only"],
    location:  ["upper GI (esophagus/stomach/duodenum)","lower GI (colon/rectum)","unknown source"],
    severity:  null,
    radiation: ["non-radiating","abdominal pain","back pain"],
    duration:  ["hours","days","weeks","recurrent"],
    timing:    ["constant","intermittent","progressive"],
    worse:     ["NSAIDs","anticoagulants","alcohol","aspirin"],
    better:    ["NPO","PPI therapy","endoscopy"],
    assoc:     ["abdominal pain","nausea","vomiting","dizziness","syncope","dysphagia","weight loss","epigastric pain","known cirrhosis","anticoagulant use"],
    neg:       ["no abdominal pain","no syncope","no prior episodes","no anticoagulant use","no NSAID use","no known liver disease"],
    riskFlags: { qual:["hematemesis (bright red)","melena (black tarry stool)"], msg:"⚠ Acute upper GI bleed — IV access, type & screen, GI consult" },
  },
  sore_throat: {
    icon:"🥾", label:"Sore Throat / Pharyngitis", color:"#f97316",
    gl:"rgba(249,115,22,0.12)", cat:"ENT",
    onset:     ["sudden","gradual","acute","subacute","progressive"],
    quality:   ["sore throat","odynophagia","dysphagia","throat tightness","muffled voice","hot-potato voice","drooling","trismus"],
    location:  ["bilateral tonsils","right tonsil","left tonsil","posterior pharynx","peritonsillar","diffuse"],
    severity:  null,
    radiation: ["non-radiating","ear","jaw","neck"],
    duration:  ["hours","1–2 days","days","weeks","recurrent"],
    timing:    ["constant","worse with swallowing","progressive"],
    worse:     ["swallowing","eating","drinking","speaking","opening mouth"],
    better:    ["analgesics","salt water gargle","antibiotics (started)","cold liquids","steroids"],
    assoc:     ["fever","drooling","trismus","uvular deviation","cervical lymphadenopathy","rash","cough","runny nose","headache","stridor"],
    neg:       ["no stridor","no drooling","no trismus","no uvular deviation","no rash","no difficulty breathing"],
    riskFlags: { qual:["hot-potato voice","trismus","drooling"], msg:"⚠ Peritonsillar abscess or epiglottitis — airway evaluation urgent" },
  },
  ear_pain: {
    icon:"👂", label:"Ear Pain / Hearing Loss", color:"#a78bfa",
    gl:"rgba(167,139,250,0.12)", cat:"ENT",
    onset:     ["sudden","gradual","after swimming","after air travel","after trauma","with URI"],
    quality:   ["otalgia (ear pain)","hearing loss","tinnitus","ear fullness","discharge","itching","vertigo associated","popping sensation"],
    location:  ["right ear","left ear","bilateral","external canal","middle ear"],
    severity:  null,
    radiation: ["non-radiating","jaw","neck","temporal","teeth"],
    duration:  ["hours","days","weeks","chronic"],
    timing:    ["constant","intermittent","with swallowing","with chewing"],
    worse:     ["chewing","pulling on ear","lying on affected side","swallowing","air travel"],
    better:    ["analgesics","antibiotic drops","warm compress","upright position"],
    assoc:     ["fever","hearing loss","tinnitus","vertigo","discharge","URI symptoms","jaw pain","headache"],
    neg:       ["no fever","no discharge","no hearing loss","no vertigo","no facial droop","no trauma"],
    riskFlags: { assoc:["facial droop"], msg:"⚠ Facial nerve involvement — consider Ramsay Hunt syndrome or malignant otitis externa" },
  },
  epistaxis: {
    icon:"🩸", label:"Epistaxis (Nosebleed)", color:"#fb7185",
    gl:"rgba(251,113,133,0.12)", cat:"ENT",
    onset:     ["sudden","spontaneous","after trauma","after nose blowing","recurrent"],
    quality:   ["anterior bleed","posterior bleed","bilateral","unilateral right","unilateral left","heavy / soaking gauze","mild / self-limited"],
    location:  ["right nostril","left nostril","bilateral","posterior nasopharynx"],
    severity:  null,
    radiation: ["N/A"],
    duration:  ["< 10 min","10–30 min","> 30 min","hours","recurrent"],
    timing:    ["intermittent","constant","recurrent"],
    worse:     ["anticoagulants","aspirin","NSAIDs","hypertension","dry air","nose blowing"],
    better:    ["direct pressure","nasal packing","cauterization","sitting forward"],
    assoc:     ["hypertension","anticoagulant use","trauma","blood thinners","liver disease","hematemesis"],
    neg:       ["no anticoagulant use","no trauma","no posterior bleeding","no hemoptysis","no prior episodes"],
    riskFlags: { qual:["posterior bleed"], msg:"⚠ Posterior epistaxis — ENT consult, posterior packing or balloon tamponade" },
  },
  rash: {
    icon:"🦱", label:"Rash / Skin Complaint", color:"#4ade80",
    gl:"rgba(74,222,128,0.12)", cat:"Derm",
    onset:     ["sudden","gradual","after new medication","after allergen exposure","after outdoor exposure","insidious"],
    quality:   ["macular","papular","vesicular / blistering","urticarial (hives)","petechial / purpuric","erythematous","target lesions","diffuse","confluent","pruritic","painful","burning","crusting","desquamating"],
    location:  ["face","trunk","extremities","generalized / diffuse","palms and soles","intertriginous areas","dermatomal distribution","mucosal involvement"],
    severity:  null,
    radiation: ["non-spreading","spreading","dermatomal","proximal to distal"],
    duration:  ["hours","days","weeks","chronic / recurrent"],
    timing:    ["constant","intermittent","progressive","waxing and waning"],
    worse:     ["heat","scratching","sunlight","contact with irritant","sweating"],
    better:    ["antihistamines","topical steroids","cool compress","avoiding trigger"],
    assoc:     ["fever","pruritus","joint pain","mucosal lesions","lymphadenopathy","recent illness","new medication","travel history","tick exposure","sick contacts"],
    neg:       ["no fever","no mucosal involvement","no joint pain","no lymphadenopathy","no new medications","no sick contacts","no travel"],
    riskFlags: { qual:["petechial / purpuric"], msg:"⚠ Petechiae / purpura — R/O meningococcemia, TTP, vasculitis — urgent workup" },
  },
  dvt_leg: {
    icon:"🦵", label:"Leg Swelling / DVT Concern", color:"#60a5fa",
    gl:"rgba(96,165,250,0.12)", cat:"Vascular",
    onset:     ["sudden","gradual","progressive","after prolonged immobility","after flight / travel","after surgery","insidious"],
    quality:   ["unilateral swelling","bilateral swelling","pitting edema","non-pitting","erythema","warmth","tenderness","cord palpable","heaviness"],
    location:  ["right calf","left calf","right thigh","left thigh","bilateral lower extremities","right foot/ankle","left foot/ankle"],
    severity:  null,
    radiation: ["non-radiating","groin","thigh","knee"],
    duration:  ["hours","days","weeks","chronic"],
    timing:    ["constant","worse end of day","progressive"],
    worse:     ["standing","walking","heat","prolonged sitting"],
    better:    ["elevation","compression","anticoagulation (if DVT confirmed)","rest"],
    assoc:     ["dyspnea","chest pain","tachycardia","fever","erythema","warmth","recent immobility","recent surgery","oral contraceptive use","malignancy history"],
    neg:       ["no dyspnea","no chest pain","no fever","no erythema","no prior DVT","no recent travel","no malignancy"],
    riskFlags: { assoc:["dyspnea","chest pain"], msg:"⚠ DVT + dyspnea/chest pain — evaluate for pulmonary embolism" },
  },
  dental: {
    icon:"🦷", label:"Dental / Jaw Pain", color:"#e2e8f0",
    gl:"rgba(226,232,240,0.08)", cat:"Dental",
    onset:     ["sudden","gradual","after eating","spontaneous","progressive","after dental procedure"],
    quality:   ["toothache","throbbing","sharp","dull aching","jaw pain","facial swelling","trismus","gum pain","abscess","sensitivity to hot/cold"],
    location:  ["upper jaw (maxillary)","lower jaw (mandibular)","right-sided","left-sided","bilateral","tooth #_","TMJ"],
    severity:  null,
    radiation: ["non-radiating","ear","neck","temporal","eye"],
    duration:  ["hours","days","weeks","chronic / recurrent"],
    timing:    ["constant","intermittent","with eating","spontaneous","worse at night"],
    worse:     ["eating","hot foods","cold foods","biting","pressure","lying flat"],
    better:    ["analgesics","NSAIDs","antibiotics (started)","cold compress","dental procedure"],
    assoc:     ["fever","facial swelling","trismus","dysphagia","neck swelling","cervical lymphadenopathy"],
    neg:       ["no fever","no facial swelling","no trismus","no dysphagia","no neck swelling"],
    riskFlags: { assoc:["trismus","dysphagia","neck swelling"], msg:"⚠ Ludwig's angina or deep space neck infection — airway and surgical evaluation urgent" },
  },
  psychiatric: {
    icon:"💭", label:"Psychiatric / Behavioral", color:"#c084fc",
    gl:"rgba(192,132,252,0.12)", cat:"Psychiatric",
    onset:     ["sudden","gradual","acute decompensation","subacute","chronic with acute exacerbation","first episode"],
    quality:   ["suicidal ideation","homicidal ideation","self-harm","agitation","psychosis","hallucinations","paranoia","mania","severe depression","acute anxiety / panic","dissociation","substance intoxication","substance withdrawal"],
    location:  ["N/A"],
    severity:  null,
    radiation: ["N/A"],
    duration:  ["hours","days","weeks","chronic","first episode"],
    timing:    ["constant","intermittent","progressive","episodic","acute on chronic"],
    worse:     ["substance use","medication non-compliance","stressors","sleep deprivation","isolation"],
    better:    ["medications","de-escalation","safe environment","social support","psychiatric hold"],
    assoc:     ["substance use","medication non-compliance","recent trauma","prior psychiatric history","prior hospitalizations","command hallucinations","access to means","prior suicide attempts","homelessness"],
    neg:       ["no command hallucinations","no access to means","no prior suicide attempts","no substance use","no homicidal ideation","no prior psychiatric hospitalizations"],
    riskFlags: { qual:["suicidal ideation","homicidal ideation"], msg:"⚠ SI/HI present — safety assessment, remove means, psychiatric consultation" },
  },
  wound: {
    icon:"🩹", label:"Wound / Laceration", color:"#fbbf24",
    gl:"rgba(251,191,36,0.12)", cat:"Wound Care",
    onset:     ["acute injury","MVA","fall","assault","self-inflicted","work injury","bite (human)","bite (animal)","puncture wound"],
    quality:   ["laceration","puncture","avulsion","crush injury","bite wound","burn","abrasion","degloving"],
    location:  ["scalp","face","forehead","chin","hand","arm","leg","foot","trunk","neck","finger"],
    severity:  null,
    radiation: ["N/A"],
    duration:  ["< 1 hr ago","1–6 hrs ago","6–12 hrs ago","> 12 hrs ago"],
    timing:    ["single event"],
    worse:     ["movement","contamination","delay in care"],
    better:    ["direct pressure","irrigation","closure","analgesia"],
    assoc:     ["neurovascular deficit","tendon involvement","foreign body","contamination","bone exposed","active bleeding","signs of infection","tetanus status unknown"],
    neg:       ["no neurovascular deficit","no tendon involvement","no foreign body","no active bleeding","no infection signs","tetanus up to date"],
    riskFlags: { assoc:["bone exposed","tendon involvement"], msg:"⚠ Deep structure involvement — orthopedic or hand surgery evaluation" },
  },
};

const CC_LIST = Object.entries(CC_DATA).map(([id, d]) => ({ id, ...d }));

// ── Narrative Builder ────────────────────────────────────────────────
function buildNarrative(ccId, fields, customText, patientName) {
  if (!ccId) return "";
  const cc = CC_DATA[ccId];
  if (!cc) return customText || "";
  const name = patientName || "The patient";
  const parts = [];

  // Opener
  let opener = `${name} presents`;
  if (fields.onset) opener += ` with ${fields.onset} onset`;
  const qText = fields.quality?.length ? fields.quality.join(", ") + " " : "";
  opener += ` with ${qText}${cc.label.toLowerCase()}`;
  if (fields.location && fields.location !== "N/A — global" && fields.location !== "N/A") {
    const locText = fields.location.startsWith("N/A") ? "" : ` — ${fields.location}`;
    opener += locText;
  }
  parts.push(opener);

  // Severity + Duration + Timing
  const detail = [];
  if (fields.severity !== null && fields.severity !== undefined) detail.push(`${fields.severity}/10 severity`);
  if (fields.duration) detail.push(`${fields.duration} duration`);
  if (fields.timing) detail.push(fields.timing);
  if (detail.length) parts.push(detail.join(", "));

  // Radiation
  if (fields.radiation && fields.radiation !== "N/A" && fields.radiation !== "non-radiating") {
    parts.push(`Radiating to the ${fields.radiation}`);
  } else if (fields.radiation === "non-radiating") {
    parts.push("Pain is non-radiating");
  }

  // Modifying
  const worse = fields.worse?.filter(Boolean) || [];
  const better = fields.better?.filter(Boolean) || [];
  if (worse.length || better.length) {
    let mod = "Symptoms are";
    if (worse.length) mod += ` aggravated by ${worse.join(" and ")}`;
    if (better.length) mod += `${worse.length ? " and" : ""} relieved by ${better.join(" and ")}`;
    parts.push(mod);
  }

  // Associated
  if (fields.assoc?.length) {
    parts.push(`Associated symptoms include ${fields.assoc.join(", ")}`);
  }

  // Pertinent negatives
  if (fields.neg?.length) {
    parts.push(`The patient denies ${fields.neg.join(", ")}`);
  }

  // Custom text
  if (customText?.trim()) parts.push(customText.trim());

  return parts.filter(Boolean).join(". ") + (parts.length ? "." : "");
}

// ── Completion Score ────────────────────────────────────────────────
function getCompletion(fields) {  // Fix 8: removed unused ccId param
  const checks = [
    !!fields.onset, !!fields.quality?.length, !!fields.location,
    fields.severity !== null && fields.severity !== undefined,
    !!fields.duration, !!fields.timing, !!fields.radiation,
    !!(fields.worse?.length || fields.better?.length),
    !!fields.assoc?.length,
  ];
  return { score: checks.filter(Boolean).length, total: checks.length };
}

// ═══════════════════════════════════════════════════════════════════
// CHIP COMPONENT
// ═══════════════════════════════════════════════════════════════════
function Chip({ label, selected, onClick, color = T.teal }) {  // Fix 7: removed unused `multi` prop
  const sel = selected;
  return (
    <button className="chip-btn hpi-chip"
      onClick={onClick}
      style={{
        padding: "6px 14px", borderRadius: 20, border: `1px solid ${sel ? color+"88" : "rgba(42,79,122,0.4)"}`,
        background: sel ? `${color}22` : "rgba(14,37,68,0.7)",
        color: sel ? color : T.txt2,
        fontFamily: "DM Sans", fontSize: 12.5, fontWeight: sel ? 700 : 400,
        display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
        boxShadow: sel ? `0 0 8px ${color}44` : "none",
      }}>
      {sel && <span style={{ fontSize: 10 }}>✓</span>}
      {label}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════
// NRS SEVERITY SLIDER
// ═══════════════════════════════════════════════════════════════════
function SeveritySelector({ value, onChange, color }) {
  const levels = [0,1,2,3,4,5,6,7,8,9,10];
  const getColor = (n) => {
    if (n === null) return T.txt4;
    if (n <= 2) return T.teal;
    if (n <= 4) return T.green;
    if (n <= 6) return T.gold;
    if (n <= 8) return T.orange;
    return T.coral;
  };
  return (
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
      {levels.map(n => (
        <button key={n} className="chip-btn" onClick={() => onChange(value === n ? null : n)}
          style={{
            width: 38, height: 38, borderRadius: 10,
            background: value === n ? `${getColor(n)}25` : "rgba(14,37,68,0.7)",
            border: `1.5px solid ${value === n ? getColor(n) : "rgba(42,79,122,0.3)"}`,
            color: value === n ? getColor(n) : T.txt3,
            fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: 13,
            boxShadow: value === n ? `0 0 10px ${getColor(n)}55` : "none",
          }}>
          {n}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CHIP ROW — collapsible OPQRST section
// ═══════════════════════════════════════════════════════════════════
function ChipSection({ title, icon, items, selected, multi, onChange, color, type }) {
  const [expanded, setExpanded] = useState(true);
  const isSelected = multi ? (selected?.length > 0) : selected !== null && selected !== undefined;

  const toggle = (item) => {
    if (multi) {
      const cur = selected || [];
      onChange(cur.includes(item) ? cur.filter(x => x !== item) : [...cur, item]);
    } else {
      onChange(selected === item ? null : item);
    }
  };

  return (
    <div style={{ marginBottom: 10 }}>
      <button onClick={() => setExpanded(!expanded)}
        style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", cursor: "pointer", padding: "4px 0", width: "100%" }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: isSelected ? color : T.txt3, textTransform: "uppercase", letterSpacing: 2, fontWeight: 700 }}>
          {title}
        </span>
        {isSelected && (
          <span style={{ fontFamily: "DM Sans", fontSize: 11, color, background: `${color}22`, padding: "2px 8px", borderRadius: 20, marginLeft: 4 }}>
            {multi ? (selected?.join(", ").substring(0, 30) + (selected?.join(", ").length > 30 ? "…" : "")) : selected}
          </span>
        )}
        <span style={{ marginLeft: "auto", color: T.txt4, fontSize: 11 }}>{expanded ? "▼" : "▶"}</span>
      </button>
      {expanded && (
        <div style={{ paddingLeft: 22, paddingTop: 6 }}>
          {type === "nrs" ? (
            <SeveritySelector value={selected} onChange={onChange} color={color} />
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {items.map(item => (
                <Chip key={item} label={item}
                  selected={multi ? (selected || []).includes(item) : selected === item}
                  onClick={() => toggle(item)} color={color} multi={multi} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// AUDIO RECORDER
// ═══════════════════════════════════════════════════════════════════
function AudioRecorder({ onTranscript, accentColor }) {
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef(null);

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-US";
    r.onresult = (e) => {
      let interim = "", final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      setInterimText(interim);
      if (final) { onTranscript(final); setInterimText(""); }
    };
    r.onerror = () => { setRecording(false); setInterimText(""); };
    r.onend = () => { setRecording(false); setInterimText(""); };
    recognitionRef.current = r;
    r.start();
    setRecording(true);
  }, [onTranscript]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setRecording(false);
    setInterimText("");
  }, []);

  if (!supported) return (
    <div style={{ fontFamily: "DM Sans", fontSize: 11, color: T.txt3, padding: "6px 10px", background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: 8 }}>
      Voice input not supported in this browser. Use Chrome for dictation.
    </div>
  );

  return (
    <div>
      <button onClick={recording ? stop : start}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 20px", borderRadius: 50,
          background: recording
            ? `linear-gradient(135deg,${T.coral},#c0392b)`
            : `linear-gradient(135deg,${accentColor},${accentColor}bb)`,
          border: "none", cursor: "pointer",
          color: "#fff", fontFamily: "DM Sans", fontWeight: 700, fontSize: 13,
          boxShadow: recording ? `0 0 0 0 ${T.coral}` : `0 4px 16px ${accentColor}44`,
          animation: recording ? "hpi-pulse 2s ease infinite" : "none",
          transition: "all .3s",
        }}>
        {recording ? (
          <>
            <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 20 }}>
              {[0,1,2,3,4].map(i => (
                <div key={i} style={{ width: 3, background: "white", borderRadius: 2, animation: `hpi-wave 1s ease ${i * 0.12}s infinite`, height: 6 }} />
              ))}
            </div>
            Recording — Tap to Stop
          </>
        ) : (
          <><span style={{ fontSize: 16 }}>🎙</span> Voice Dictation</>
        )}
      </button>
      {interimText && (
        <div style={{ marginTop: 8, padding: "8px 12px", background: "rgba(14,37,68,0.6)", border: "1px solid rgba(42,79,122,0.4)", borderRadius: 8, fontFamily: "DM Sans", fontSize: 12, color: T.txt2, fontStyle: "italic" }}>
          ✍ {interimText}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CC GRID — initial chief complaint selector with category filter
// ═══════════════════════════════════════════════════════════════════
const CC_CATEGORIES = ["All", ...Array.from(new Set(CC_LIST.map(cc => cc.cat))).sort()];

function CCGrid({ onSelect }) {
  const [activeCat, setActiveCat] = useState("All");
  const filtered = activeCat === "All" ? CC_LIST : CC_LIST.filter(cc => cc.cat === activeCat);

  return (
    <div className="hpi-in">
      <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: T.txt3, textTransform: "uppercase", letterSpacing: 3, marginBottom: 10 }}>SELECT CHIEF COMPLAINT</div>

      {/* Category filter strip */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
        {CC_CATEGORIES.map(cat => {
          const isActive = activeCat === cat;
          const ccForCat = cat === "All" ? CC_LIST : CC_LIST.filter(c => c.cat === cat);
          const accentColor = cat === "All" ? T.teal : (ccForCat[0]?.color || T.teal);
          return (
            <button key={cat} onClick={() => setActiveCat(cat)}
              style={{
                padding: "6px 14px", borderRadius: 8,
                border: `1px solid ${isActive ? accentColor + "66" : "rgba(26,53,85,0.5)"}`,
                background: isActive ? `${accentColor}22` : "rgba(8,22,40,0.6)",
                color: isActive ? accentColor : T.txt3,
                fontFamily: "DM Sans", fontSize: 12, fontWeight: isActive ? 700 : 400,
                cursor: "pointer", whiteSpace: "nowrap",
                transition: "all .15s",
                display: "flex", alignItems: "center", gap: 5,
              }}>
              {cat !== "All" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? accentColor : T.txt4, display: "inline-block", flexShrink: 0 }} />}
              {cat}
              {cat !== "All" && <span style={{ fontFamily: "JetBrains Mono", fontSize: 9, opacity: isActive ? 0.8 : 0.4 }}>{ccForCat.length}</span>}
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
        {filtered.map((cc, i) => (
          <div key={cc.id} className="cc-card hpi-in" onClick={() => onSelect(cc.id)}
            style={{
              ...glass({ borderRadius: 12, background: `linear-gradient(135deg,${cc.gl},rgba(8,22,40,0.8))`, borderColor: cc.gl }),
              padding: "14px 14px", cursor: "pointer",
              animationDelay: `${i * 0.03}s`,
            }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{cc.icon}</div>
            <div style={{ fontFamily: "DM Sans", fontWeight: 700, fontSize: 12.5, color: T.txt, marginBottom: 2 }}>{cc.label}</div>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: cc.color, textTransform: "uppercase", letterSpacing: 1 }}>{cc.cat}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// OPQRST BUILDER — main chip interface
// ═══════════════════════════════════════════════════════════════════
function OPQRSTBuilder({ ccId, fields, onChange, color }) {
  const cc = CC_DATA[ccId];
  if (!cc) return null;

  const set = (key) => (val) => onChange({ ...fields, [key]: val });

  const sections = [
    { key: "onset",    icon: "⏱", title: "Onset",               items: cc.onset,    multi: false },
    { key: "quality",  icon: "📝", title: "Quality / Character", items: cc.quality,  multi: true  },
    { key: "location", icon: "📍", title: "Location",            items: cc.location, multi: false },
    { key: "severity", icon: "🔢", title: "Severity (NRS 0–10)", items: [],          multi: false, type: "nrs" },
    { key: "duration", icon: "⏳", title: "Duration",            items: cc.duration, multi: false },
    { key: "radiation",icon: "↗️", title: "Radiation",           items: cc.radiation,multi: false },
    { key: "timing",   icon: "🔄", title: "Timing",              items: cc.timing,   multi: false },
    { key: "worse",    icon: "📈", title: "Aggravating Factors",  items: cc.worse,    multi: true  },
    { key: "better",   icon: "📉", title: "Relieving Factors",    items: cc.better,   multi: true  },
    { key: "assoc",    icon: "➕", title: "Associated Symptoms",  items: cc.assoc,    multi: true  },
    { key: "neg",      icon: "➖", title: "Pertinent Negatives",  items: cc.neg,      multi: true  },
  ];

  return (
    <div className="hpi-in" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {sections.map(s => (
        <ChipSection key={s.key} title={s.title} icon={s.icon}
          items={s.items} selected={fields[s.key]} multi={s.multi}
          onChange={set(s.key)} color={color} type={s.type} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// NARRATIVE PANEL — live preview
// ═══════════════════════════════════════════════════════════════════
function NarrativePanel({ narrative, ccId, fields, color, onAIEnhance, aiLoading, onCopy, copied, onEdit, editMode, editValue, onEditChange, onGenerateSummary, summaryLoading }) {
  const comp = getCompletion(fields);
  const pct = Math.round((comp.score / comp.total) * 100);
  const isEmpty = !narrative;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%" }}>
      {/* Completion indicator */}
      {ccId && (
        <div style={{ ...glass({ borderRadius: 12 }), padding: "10px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: T.txt3, textTransform: "uppercase", letterSpacing: 2, flex: 1 }}>HPI COMPLETENESS</span>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 12, fontWeight: 700, color: pct === 100 ? T.green : pct >= 66 ? T.teal : T.gold }}>{pct}%</span>
          </div>
          <div style={{ background: "rgba(26,53,85,0.5)", borderRadius: 4, height: 6, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? T.green : pct >= 66 ? T.teal : T.gold, borderRadius: 4, transition: "width .4s ease" }} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
            {["onset","quality","location","severity","duration","timing","radiation","modifiers","associated"].map((e, i) => {
              const fieldKey = ["onset","quality","location","severity","duration","timing","radiation","worse","assoc"][i];
              const done = fieldKey === "worse"
                ? (fields.worse?.length || fields.better?.length)
                : fieldKey === "quality" ? fields.quality?.length
                : fieldKey === "assoc" ? fields.assoc?.length
                : (fields[fieldKey] !== null && fields[fieldKey] !== undefined);
              return (
                <span key={e} style={{ fontFamily: "JetBrains Mono", fontSize: 9, padding: "2px 6px", borderRadius: 4, background: done ? `${color}22` : "rgba(26,53,85,0.3)", color: done ? color : T.txt4, textTransform: "uppercase", letterSpacing: 1 }}>
                  {done ? "✓ " : ""}{e}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Narrative */}
      <div style={{ ...glass({ borderRadius: 14, flex: 1, borderColor: isEmpty ? "rgba(26,53,85,0.4)" : color + "55" }), padding: "16px 18px", display: "flex", flexDirection: "column", minHeight: 200 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: isEmpty ? T.txt4 : color, textTransform: "uppercase", letterSpacing: 2, flex: 1 }}>LIVE HPI NARRATIVE</span>
          {!isEmpty && (
            <button onClick={() => onEdit(!editMode)}
              style={{ padding: "3px 10px", borderRadius: 6, background: editMode ? `${color}22` : "transparent", border: `1px solid ${editMode ? color+"55" : "rgba(42,79,122,0.4)"}`, color: editMode ? color : T.txt3, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans" }}>
              {editMode ? "✓ Done" : "✏ Edit"}
            </button>
          )}
        </div>

        {isEmpty ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, color: T.txt4 }}>
            <span style={{ fontSize: 36 }}>📄</span>
            <span style={{ fontFamily: "DM Sans", fontSize: 13 }}>Select a chief complaint to begin</span>
          </div>
        ) : editMode ? (
          <textarea value={editValue} onChange={e => onEditChange(e.target.value)} rows={10}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: T.txt, fontFamily: "DM Sans", fontSize: 14, lineHeight: 1.9, resize: "none", width: "100%" }} />
        ) : (
          <div className="hpi-type" key={narrative.length} style={{ fontFamily: "DM Sans", fontSize: 14, color: T.txt, lineHeight: 1.9, flex: 1 }}>
            {narrative}
          </div>
        )}
      </div>

      {/* Actions */}
      {ccId && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={onAIEnhance} disabled={aiLoading || isEmpty}
            style={{ flex: "1 1 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 14px", borderRadius: 10, background: aiLoading ? `${color}20` : `linear-gradient(135deg,${color},${color}bb)`, border: "none", color: aiLoading ? color : "#fff", fontWeight: 700, fontSize: 12, cursor: isEmpty || aiLoading ? "not-allowed" : "pointer", fontFamily: "DM Sans" }}>
            {aiLoading ? (
              <><div style={{ width: 14, height: 14, border: `2px solid ${color}`, borderTopColor: "transparent", borderRadius: "50%", animation: "hpi-spin 1s linear infinite" }} /> Enhancing…</>
            ) : "✨ AI Enhance"}
          </button>
          <button onClick={onGenerateSummary} disabled={isEmpty || summaryLoading}
            style={{ padding: "10px 14px", borderRadius: 10, background: summaryLoading ? "rgba(155,109,255,0.1)" : "rgba(155,109,255,0.15)", border: `1px solid ${summaryLoading ? "rgba(155,109,255,0.3)" : "rgba(155,109,255,0.5)"}`, color: "#9b6dff", fontWeight: 700, fontSize: 12, cursor: isEmpty || summaryLoading ? "not-allowed" : "pointer", fontFamily: "DM Sans", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
            {summaryLoading ? <><div style={{ width: 12, height: 12, border: "2px solid #9b6dff", borderTopColor: "transparent", borderRadius: "50%", animation: "hpi-spin 1s linear infinite" }} /> Drafting…</> : "🧠 Clinical Summary"}
          </button>
          <button onClick={onCopy} disabled={isEmpty}
            style={{ padding: "10px 16px", borderRadius: 10, background: "rgba(14,37,68,0.8)", border: `1px solid ${copied ? T.green+"66" : "rgba(42,79,122,0.4)"}`, color: copied ? T.green : T.txt2, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "DM Sans", whiteSpace: "nowrap" }}>
            {copied ? "✓ Copied!" : "📋 Copy"}
          </button>
          <button
            onClick={() => {
              const w = window.open("", "_blank");
              if (!w) { alert("Popup blocked — please allow popups to print."); return; }
              w.document.write(`<!DOCTYPE html><html><head><title>HPI</title><style>body{font-family:'Segoe UI',sans-serif;max-width:700px;margin:40px auto;line-height:1.8;color:#1f2937;font-size:14px;} h2{border-bottom:2px solid #1f2937;padding-bottom:8px;}</style></head><body><h2>History of Present Illness</h2><p>${(editMode ? editValue : narrative)}</p><p style="font-size:11px;color:#9ca3af;margin-top:32px">Notrya · ${new Date().toLocaleString()}</p></body></html>`);
              w.document.close(); setTimeout(() => w.print(), 250);
            }}
            disabled={isEmpty}
            style={{ padding: "10px 16px", borderRadius: 10, background: "rgba(14,37,68,0.8)", border: "1px solid rgba(42,79,122,0.4)", color: T.txt2, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "DM Sans", whiteSpace: "nowrap" }}>
            🖨 Print
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE STRIP
// ═══════════════════════════════════════════════════════════════════
function TemplateStrip({ onApply, currentCC, templates = [] }) {
  const visible = currentCC ? templates.filter(t => t.cc === currentCC) : templates;
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(visible.length > 0);
  }, [currentCC, templates]);
  return (
    <div style={{ ...deepGlass({ borderRadius: 0, borderTop: "1px solid rgba(26,53,85,0.6)", borderBottom: "none", borderLeft: "none", borderRight: "none" }), padding: "0" }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: "100%", padding: "10px 24px", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: T.teal, textTransform: "uppercase", letterSpacing: 2 }}>⚡ QUICK TEMPLATES</span>
        {visible.length > 0 && <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: T.teal, background: "rgba(0,229,192,0.15)", border: "1px solid rgba(0,229,192,0.3)", borderRadius: 20, padding: "2px 8px" }}>{visible.length}</span>}
        <span style={{ fontFamily: "DM Sans", fontSize: 11, color: T.txt4 }}>{visible.length === 0 ? "— No templates for this complaint" : "— Pre-fill complete HPI for common presentations"}</span>
        <span style={{ marginLeft: "auto", fontFamily: "JetBrains Mono", fontSize: 11, color: T.txt4 }}>{open ? "▲ Close" : "▼ Show"}</span>
      </button>
      {open && visible.length > 0 && (
        <div style={{ padding: "0 24px 14px", display: "flex", gap: 8, overflowX: "auto", flexWrap: "nowrap" }}>
          {visible.map(t => (
            <button key={t.id} onClick={() => { onApply(t); setOpen(false); }}
              style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 10, background: "rgba(0,229,192,0.08)", border: "1px solid rgba(0,229,192,0.25)", color: "#00e5c0", fontFamily: "DM Sans", fontWeight: 600, fontSize: 12, cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,229,192,0.15)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,229,192,0.08)"; }}>
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN HPI PAGE
// ═══════════════════════════════════════════════════════════════════
const EMPTY_FIELDS = {
  onset: null, quality: [], location: null, severity: null,
  radiation: null, duration: null, timing: null,
  worse: [], better: [], assoc: [], neg: [],
};

export default function HPIPage() {
  const [quickTemplates, setQuickTemplates] = useState([]);
  const [ccId, setCCId] = useState(null);
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [customText, setCustomText] = useState("");
  const [patientName, setPatientName] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editValue, setEditValue] = useState("");
  // Fix 2: finalNarrative holds user-committed edits so "Done" doesn't discard changes
  const [finalNarrative, setFinalNarrative] = useState(null);
  const [aiLoading, setAILoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [clinicalSummary, setClinicalSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryCopied, setSummaryCopied] = useState(false);

  // Load templates from DB on mount
  const loadTemplates = useCallback(() => {
    base44.entities.HPITemplate.list("order", 100).then(rows => {
      setQuickTemplates(rows.map(r => ({
        id: r.id,
        label: r.label,
        icon: r.icon || "📋",
        cc: r.cc,
        fields: r.hpi_fields || {},
      })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const cc = ccId ? CC_DATA[ccId] : null;
  const activeColor = cc?.color || T.teal;

  // Build narrative from chips
  const generatedNarrative = useMemo(
    () => buildNarrative(ccId, fields, customText, patientName),
    [ccId, fields, customText, patientName]
  );

  // Fix 2: displayNarrative uses finalNarrative (committed edit) when available;
  // falls back to generated. Toggling edit off commits editValue to finalNarrative.
  const displayNarrative = editMode
    ? editValue
    : (finalNarrative ?? generatedNarrative);

  const handleEditToggle = (on) => {
    if (on) {
      // Opening edit — seed with current display
      setEditValue(displayNarrative);
      setEditMode(true);
    } else {
      // Closing edit — commit the edited value so it persists
      setFinalNarrative(editValue.trim() || null);
      setEditMode(false);
    }
  };

  // Select CC
  const selectCC = (id) => {
    setCCId(id);
    setFields(EMPTY_FIELDS);
    setCustomText("");
    setEditMode(false);
    setEditValue("");
    setFinalNarrative(null); // Fix 2: clear committed edit on CC change
  };

  // Apply template
  const applyTemplate = (t) => {
    setCCId(t.cc);
    setFields({ ...EMPTY_FIELDS, ...(t.fields || t.hpi_fields || {}) });
    setEditMode(false);
    setFinalNarrative(null); // Fix 2: clear committed edit on template apply
  };

  // Voice transcript → append to customText
  // Fix 9: wrapped in useCallback so AudioRecorder.start dep [onTranscript] stays stable
  const handleTranscript = useCallback((text) => {
    setCustomText(prev => (prev ? prev + " " + text : text).trim());
    setShowCustom(true);
  }, []);

  // AI Enhance
  const handleAIEnhance = async () => {
    if (!displayNarrative || aiLoading) return;
    setAILoading(true);
    try {
      const enhanced = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI — a clinical documentation assistant for emergency medicine. Enhance the following HPI to be medically professional, complete, and clinically precise. Preserve ALL clinical facts exactly. Improve fluency and add transitional phrases. Keep it 3–5 sentences. Return ONLY the improved narrative, no preamble.\n\nHPI to enhance:\n${displayNarrative}`,
      });
      setEditValue(typeof enhanced === "string" ? enhanced : enhanced?.data || displayNarrative);
      setEditMode(true);
    } catch (e) { console.error(e); }
    setAILoading(false);
  };

  // Copy
  const handleCopy = () => {
    if (!displayNarrative) return;
    navigator.clipboard.writeText(displayNarrative);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Clinical Summary
  const handleGenerateSummary = async () => {
    if (!ccId || !displayNarrative || summaryLoading) return;
    setSummaryLoading(true);
    setShowSummary(true);
    try {
      const res = await base44.functions.invoke('generateHPISummary', {
        ccLabel: cc?.label,
        hpiNarrative: displayNarrative,
        fields,
        patientName,
        patientAge: "",
        patientGender: "",
      });
      setClinicalSummary(res.data?.summary || "");
    } catch (e) {
      setClinicalSummary("Error generating summary. Please try again.");
    }
    setSummaryLoading(false);
  };

  // Save
  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Clinical risk flag
  const riskFlag = useMemo(() => {
    if (!cc?.riskFlags) return null;
    const rf = cc.riskFlags;
    // Fix 4: check rf.onset
    if (rf.onset && fields.onset === rf.onset) return rf.msg;
    // check rf.qual
    if (rf.qual && fields.quality?.some(q => rf.qual.includes(q))) return rf.msg;
    // check rf.assoc
    if (rf.assoc && fields.assoc?.some(a => rf.assoc?.includes(a))) return rf.msg;
    // Fix 5: check rf.mech (trauma MVA — onset array used as mechanism)
    if (rf.mech && fields.onset === rf.mech) return rf.msg;
    // Fix 4: check rf.temp — fires when severity is 9 or 10 as proxy for hyperpyrexia
    if (rf.temp && fields.severity !== null && fields.severity >= 9) return rf.msg;
    return null;
  }, [cc, fields]);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "DM Sans, sans-serif", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", paddingTop: 80 }}>

      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "60%", height: "60%", background: `radial-gradient(circle,${activeColor}18 0%,transparent 70%)`, transition: "background 1.2s ease" }} />
        <div style={{ position: "absolute", bottom: "-15%", right: "-5%", width: "50%", height: "50%", background: "radial-gradient(circle,rgba(0,212,255,0.07) 0%,transparent 70%)" }} />
      </div>

      {/* Header */}
      <div style={{ ...deepGlass({ borderRadius: 0 }), padding: "14px 24px", flexShrink: 0, zIndex: 10, position: "relative", borderBottom: "1px solid rgba(26,53,85,0.6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ ...deepGlass({ borderRadius: 9 }), padding: "5px 12px", display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: T.teal, letterSpacing: 3 }}>NOTRYA</span>
            <span style={{ color: T.txt3, fontFamily: "JetBrains Mono", fontSize: 10 }}>/</span>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: T.txt3, letterSpacing: 2 }}>HPI</span>
          </div>
          <div style={{ height: 1, width: 40, background: "rgba(42,77,114,0.5)" }} />

          {/* Patient name quick-input */}
          <input
            placeholder="Patient name (optional)…"
            value={patientName}
            onChange={e => setPatientName(e.target.value)}
            style={{ background: "rgba(14,37,68,0.7)", border: "1px solid rgba(42,77,114,0.4)", borderRadius: 8, padding: "6px 12px", color: T.txt, fontFamily: "DM Sans", fontSize: 12, outline: "none", width: 180 }}
            onFocus={e => e.target.style.borderColor = activeColor}
            onBlur={e => e.target.style.borderColor = "rgba(42,77,114,0.4)"}
          />

          {ccId && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: `${activeColor}22`, border: `1px solid ${activeColor}44` }}>
              <span>{cc.icon}</span>
              <span style={{ fontFamily: "DM Sans", fontWeight: 700, fontSize: 12, color: activeColor }}>{cc.label}</span>
              <button onClick={() => selectCC(null)} style={{ background: "transparent", border: "none", color: T.txt4, cursor: "pointer", fontSize: 12, padding: "0 0 0 4px" }}>✕</button>
            </div>
          )}

          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <AudioRecorder onTranscript={handleTranscript} accentColor={activeColor} />
            {ccId && (
              <button onClick={() => setShowCreateTemplate(true)}
                style={{ padding: "9px 16px", borderRadius: 10, background: "rgba(59,158,255,0.12)", border: "1px solid rgba(59,158,255,0.4)", color: "#3b9eff", fontFamily: "DM Sans", fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
                ⭐ Save Template
              </button>
            )}
            <button onClick={handleSave}
              style={{ padding: "9px 20px", borderRadius: 10, background: saved ? `linear-gradient(135deg,${T.green},#27ae60)` : `linear-gradient(135deg,${activeColor},${activeColor}bb)`, border: "none", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "DM Sans", transition: "all .3s" }}>
              {saved ? "✓ Saved!" : "💾 Save HPI"}
            </button>
          </div>
        </div>
      </div>

      {/* Title row */}
      <div style={{ padding: "16px 24px 0", position: "relative", zIndex: 1 }}>
        <h1 className="hpi-shimmer" style={{ fontFamily: "Playfair Display", fontSize: "clamp(22px,4vw,38px)", fontWeight: 900, letterSpacing: -1, lineHeight: 1.1 }}>
          History of Present Illness
        </h1>
        <p style={{ fontFamily: "DM Sans", fontSize: 12, color: T.txt3, marginTop: 4 }}>
          Tap a chief complaint → select descriptors → narrative builds in real time
          <span style={{ color: T.txt4, marginLeft: 8 }}>— No unnecessary clicks. No forms.</span>
        </p>
      </div>

      {/* Risk Flag */}
      {riskFlag && (
        <div style={{ margin: "8px 24px 0", padding: "10px 16px", background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.4)", borderRadius: 10, fontFamily: "DM Sans", fontSize: 12.5, color: T.coral, fontWeight: 600, position: "relative", zIndex: 1, animation: "hpi-in .3s ease" }}>
          {riskFlag}
        </div>
      )}

      {/* Main layout */}
      <div style={{ display: "flex", flex: 1, gap: 14, padding: "14px 24px 0", position: "relative", zIndex: 1, minHeight: 0, overflow: "hidden" }}>

        {/* LEFT — CC Grid or OPQRST Builder */}
        <div style={{ flex: "0 0 55%", overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>

          {!ccId ? (
            <CCGrid onSelect={selectCC} />
          ) : (
            <div style={{ ...glass({ borderRadius: 14 }), padding: "16px 18px", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 22 }}>{cc.icon}</span>
                <div>
                  <div style={{ fontFamily: "Playfair Display", fontSize: 16, fontWeight: 700, color: T.txt }}>{cc.label}</div>
                  <div style={{ fontFamily: "DM Sans", fontSize: 11, color: T.txt3 }}>Tap chips to build your narrative</div>
                </div>
                <button onClick={() => selectCC(null)} style={{ marginLeft: "auto", padding: "4px 10px", borderRadius: 7, background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.25)", color: T.coral, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans" }}>
                  ← Change CC
                </button>
              </div>
              <OPQRSTBuilder ccId={ccId} fields={fields} onChange={setFields} color={activeColor} />

              {/* Custom / Free Text */}
              <div style={{ marginTop: 14, borderTop: "1px solid rgba(26,53,85,0.4)", paddingTop: 12 }}>
                <button onClick={() => setShowCustom(!showCustom)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "JetBrains Mono", fontSize: 10, color: showCustom ? activeColor : T.txt3, textTransform: "uppercase", letterSpacing: 2, display: "flex", alignItems: "center", gap: 6 }}>
                  ✏ {showCustom ? "▼" : "▶"} Additional Notes / Free Text
                </button>
                {showCustom && (
                  <textarea value={customText} onChange={e => setCustomText(e.target.value)}
                    placeholder="Add context, history, risk factors, medications, prior workup, or any details not captured above…"
                    rows={4}
                    style={{ width: "100%", marginTop: 8, background: "rgba(14,37,68,0.8)", border: `1px solid rgba(42,79,122,0.4)`, borderRadius: 10, padding: "10px 14px", color: T.txt, fontFamily: "DM Sans", fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.65 }}
                    onFocus={e => e.target.style.borderColor = activeColor}
                    onBlur={e => e.target.style.borderColor = "rgba(42,79,122,0.4)"}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Live Narrative */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
          <NarrativePanel
            narrative={displayNarrative}
            ccId={ccId}
            fields={fields}
            color={activeColor}
            onAIEnhance={handleAIEnhance}
            aiLoading={aiLoading}
            onCopy={handleCopy}
            copied={copied}
            onEdit={handleEditToggle}
            editMode={editMode}
            editValue={editValue}
            onEditChange={setEditValue}
            onGenerateSummary={handleGenerateSummary}
            summaryLoading={summaryLoading}
          />

          {/* Clinical Summary Panel */}
          {showSummary && ccId && (
            <div style={{ ...glass({ borderRadius: 14, borderColor: T.purple + "55", background: "linear-gradient(135deg,rgba(155,109,255,0.08),rgba(8,22,40,0.85))" }), padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: T.purple, textTransform: "uppercase", letterSpacing: 2, flex: 1 }}>🧠 CLINICAL SUMMARY</span>
                <button onClick={() => { setSummaryCopied(true); navigator.clipboard.writeText(clinicalSummary); setTimeout(() => setSummaryCopied(false), 1500); }}
                  disabled={!clinicalSummary || summaryLoading}
                  style={{ padding: "3px 10px", borderRadius: 6, background: summaryCopied ? `${T.green}22` : "rgba(14,37,68,0.8)", border: `1px solid ${summaryCopied ? T.green + "66" : "rgba(42,79,122,0.4)"}`, color: summaryCopied ? T.green : T.txt2, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans" }}>
                  {summaryCopied ? "✓ Copied" : "📋 Copy"}
                </button>
                <button onClick={() => setShowSummary(false)}
                  style={{ padding: "3px 8px", borderRadius: 6, background: "transparent", border: "1px solid rgba(42,79,122,0.3)", color: T.txt4, fontSize: 11, cursor: "pointer" }}>✕</button>
              </div>
              {summaryLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", color: T.txt3, fontFamily: "DM Sans", fontSize: 13 }}>
                  <div style={{ width: 16, height: 16, border: `2px solid ${T.purple}`, borderTopColor: "transparent", borderRadius: "50%", animation: "hpi-spin 1s linear infinite" }} />
                  Analyzing HPI fields with GPT-4o…
                </div>
              ) : (
                <p style={{ fontFamily: "DM Sans", fontSize: 13.5, color: T.txt, lineHeight: 1.85, margin: 0 }}>{clinicalSummary}</p>
              )}
            </div>
          )}

          {/* Voice transcript pending */}
          {customText && !showCustom && (
            <div style={{ ...glass({ borderRadius: 12, background: "rgba(0,229,192,0.06)", borderColor: "rgba(0,229,192,0.25)" }), padding: "12px 16px" }}>
              <div style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: T.teal, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>🎙 DICTATED ADDITION</div>
              <div style={{ fontFamily: "DM Sans", fontSize: 12.5, color: T.txt2, lineHeight: 1.7, fontStyle: "italic" }}>"{customText}"</div>
              <button onClick={() => { setCustomText(""); }} style={{ marginTop: 8, padding: "3px 10px", borderRadius: 6, background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.25)", color: T.coral, fontSize: 10, cursor: "pointer", fontFamily: "DM Sans" }}>
                Clear
              </button>
            </div>
          )}

        </div>
      </div>

      {showCreateTemplate && (
        <CreateTemplateModal
          onClose={() => setShowCreateTemplate(false)}
          onSaved={loadTemplates}
          currentCC={ccId}
          currentFields={fields}
        />
      )}

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "7px", borderTop: "1px solid rgba(26,53,85,0.3)", position: "relative", zIndex: 2 }}>
        <span style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: T.txt4, letterSpacing: 2 }}>
          NOTRYA HPI · {CC_LIST.length} CHIEF COMPLAINTS · OPQRST + PERTINENT NEGATIVES · VOICE + AI ENHANCED
        </span>
      </div>
    </div>
  );
}