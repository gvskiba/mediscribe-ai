import { useState, useMemo, useCallback, useRef, useEffect } from "react";

// FIX: SSR guard added — IIFE now safe in non-browser environments
(() => {
  if (typeof document === "undefined") return;
  if (document.getElementById("meds-tab-fonts")) return;
  const l = document.createElement("link"); l.id = "meds-tab-fonts";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "meds-tab-css";
  s.textContent = `
    @keyframes mt-in    { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    @keyframes mt-slide { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
    .mt-in    { animation: mt-in .25s ease forwards; }
    .mt-slide { animation: mt-slide .2s ease forwards; }
    .mt-chip:hover { opacity:.8; transform:translateY(-1px); transition:all .15s; }
    .mt-section-toggle { transition: background .15s; }
    .mt-section-toggle:hover { background: rgba(59,158,255,0.08) !important; }
    .mt-pmh-check:hover { border-color: rgba(0,229,192,0.6) !important; background: rgba(0,229,192,0.06) !important; transition: all .13s; }
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e",panel:"#081628",card:"#0b1e36",up:"#0e2544",
  b:"rgba(26,53,85,0.8)",
  txt:"#e8f0fe",txt2:"#8aaccc",txt3:"#4a6a8a",txt4:"#2e4a6a",
  coral:"#ff6b6b",gold:"#f5c842",teal:"#00e5c0",blue:"#3b9eff",
  orange:"#ff9f43",purple:"#9b6dff",green:"#3dffa0",cyan:"#00d4ff",
};

const glass = (x={}) => ({backdropFilter:"blur(24px) saturate(200%)",WebkitBackdropFilter:"blur(24px) saturate(200%)",background:"rgba(8,22,40,0.78)",border:"1px solid rgba(26,53,85,0.5)",borderRadius:14,...x});
const inp   = (focus,err) => ({width:"100%",background:"rgba(14,37,68,0.8)",border:`1px solid ${err?"rgba(255,107,107,0.55)":focus?"rgba(59,158,255,0.55)":"rgba(26,53,85,0.55)"}`,borderRadius:9,padding:"8px 12px",color:T.txt,fontFamily:"DM Sans",fontSize:13,outline:"none",boxSizing:"border-box",transition:"border-color .15s"});
const row   = (x={}) => ({display:"flex",alignItems:"center",gap:8,...x});
const col   = (x={}) => ({display:"flex",flexDirection:"column",gap:6,...x});

const CONTROLLED_KEYWORDS = [
  "morphine","oxycodone","hydrocodone","hydromorphone","fentanyl","codeine","tramadol",
  "buprenorphine","methadone","dilaudid","percocet","vicodin","oxycontin","norco",
  "lorazepam","diazepam","alprazolam","clonazepam","midazolam","temazepam","oxazepam",
  "chlordiazepoxide","ativan","valium","xanax","klonopin",
  "zolpidem","zaleplon","eszopiclone","ambien","lunesta",
  "amphetamine","methylphenidate","dextroamphetamine","adderall","ritalin","vyvanse",
  "carisoprodol","soma",
];

const PDMP_METHODS = [
  "Checked state PDMP portal",
  "Delegate checked PDMP",
  "Patient provided documentation",
  "PDMP integrated in EHR",
  "Waived — emergency dispensing exception",
];

const BEERS_DB = [
  {keywords:["alprazolam","clonazepam","diazepam","lorazepam","oxazepam","temazepam","triazolam","chlordiazepoxide","flurazepam","clorazepate","nitrazepam","midazolam"],concern:"Benzodiazepine",risk:"Cognitive impairment, delirium, falls, fractures, and MVA risk in older adults — all benzodiazepines regardless of half-life.",alt:"Non-pharmacologic approaches; buspirone or SSRI/SNRI for anxiety. If BZD unavoidable, use lowest dose for shortest duration."},
  {keywords:["zolpidem","zaleplon","eszopiclone"],concern:"Z-drug / Sedative-Hypnotic",risk:"Similar risk profile to benzodiazepines — cognitive impairment, delirium, falls, fractures in elderly.",alt:"CBT-I is first-line for insomnia. Melatonin 0.5-5mg or low-dose doxepin (3-6mg) have more favorable profiles."},
  {keywords:["diphenhydramine","hydroxyzine","promethazine","chlorpheniramine","cyproheptadine","brompheniramine","clemastine","dexchlorpheniramine","triprolidine","doxylamine"],concern:"First-Generation Antihistamine (Anticholinergic)",risk:"Highly anticholinergic — confusion, acute delirium, urinary retention, constipation, dry mouth. Diphenhydramine can precipitate acute delirium even at normal doses in elderly.",alt:"Second-gen antihistamines (loratadine, cetirizine, fexofenadine) for allergy symptoms. Melatonin for sleep."},
  {keywords:["amitriptyline","imipramine","doxepin","trimipramine","clomipramine","nortriptyline"],concern:"Tricyclic Antidepressant",risk:"Strongly anticholinergic and sedating; orthostatic hypotension causing falls; QTc prolongation and arrhythmia risk in elderly.",alt:"SSRIs or SNRIs for depression; duloxetine/pregabalin for neuropathic pain. Low-dose doxepin (3-6mg) for insomnia is acceptable."},
  {keywords:["oxybutynin","tolterodine","hyoscyamine","dicyclomine","fesoterodine","flavoxate","solifenacin","darifenacin","propantheline"],concern:"Anticholinergic / Bladder Relaxant",risk:"Anticholinergic effects — cognitive impairment, delirium, urinary retention, constipation; oxybutynin has highest CNS penetration.",alt:"Mirabegron (beta-3 agonist) has much lower anticholinergic burden; pelvic floor training; bladder retraining."},
  {keywords:["ibuprofen","naproxen","diclofenac","meloxicam","indomethacin","etodolac","oxaprozin","piroxicam","sulindac","ketoprofen","ketorolac","diflunisal"],concern:"NSAID (Systemic)",risk:"5x increased risk of GI bleeding/peptic ulcer; AKI (especially with RAAS inhibitors or diuretics); fluid retention worsening HF; hypertension exacerbation.",alt:"Acetaminophen preferred for pain in older adults. Topical NSAIDs (diclofenac gel) have lower systemic absorption. If oral NSAID necessary, add PPI."},
  {keywords:["tramadol","ultram","conzip"],concern:"Tramadol (Opioid-like)",risk:"Fall and fracture risk, cognitive impairment, hyponatremia (SIADH), lowers seizure threshold, serotonin syndrome risk particularly with SSRIs/SNRIs.",alt:"Acetaminophen for mild-moderate pain. If opioid needed, start at 25-50% lower dose with close monitoring."},
  {keywords:["cyclobenzaprine","carisoprodol","methocarbamol","chlorzoxazone","orphenadrine","baclofen"],concern:"Skeletal Muscle Relaxant",risk:"Anticholinergic effects, sedation, increased fall risk; carisoprodol metabolizes to meprobamate (abuse potential). Most muscle-relaxant evidence base is poor across all ages.",alt:"Physical therapy is preferred. Heat/cold application, NSAIDs (cautiously), low-dose cyclobenzaprine with monitoring if needed."},
  {keywords:["glyburide","glibenclamide","chlorpropamide"],concern:"Long-Acting Sulfonylurea",risk:"Prolonged hypoglycemia risk — glyburide has active metabolites with extended duration in elderly; fall and fracture risk from hypoglycemia.",alt:"Shorter-acting sulfonylureas (glipizide IR); metformin (if eGFR allows); DPP-4 inhibitors; SGLT2 inhibitors."},
  {keywords:["nitrofurantoin","macrobid","macrodantin"],concern:"Nitrofurantoin",risk:"Pulmonary toxicity (fibrosis) and hepatotoxicity with long-term use; inadequate drug concentrations if CrCl <30 mL/min making it ineffective and potentially harmful.",alt:"Fosfomycin (single dose), trimethoprim (alone), or amoxicillin-clavulanate for UTI if CrCl <30. Short course acceptable if CrCl >=30."},
  {keywords:["metoclopramide","reglan"],concern:"Metoclopramide",risk:"Risk of tardive dyskinesia (potentially irreversible) with long-term use; risk is higher in elderly. Avoid for >12 weeks.",alt:"Ondansetron for nausea/vomiting. If gastroparesis, dietary modifications + consider domperidone (outside US)."},
  {keywords:["megestrol","megace"],concern:"Megestrol Acetate",risk:"DVT/PE risk; adrenal suppression. Minimal benefit for appetite stimulation with significant harms in elderly.",alt:"Address underlying causes of weight loss. Mirtazapine has appetite-stimulating properties. Dronabinol is an option."},
];

const ALLERGY_KEYWORDS = {
  penicillin:    ["amoxicillin","ampicillin","penicillin","piperacillin","oxacillin","nafcillin","dicloxacillin","augmentin","amox-clav"],
  sulfonamide:   ["sulfamethoxazole","bactrim","septra","sulfadiazine","sulfasalazine","trimethoprim-sulfa"],
  nsaid:         ["ibuprofen","naproxen","aspirin","diclofenac","indomethacin","ketorolac","meloxicam","celecoxib","piroxicam","motrin","advil","aleve"],
  opioid:        ["morphine","oxycodone","hydrocodone","hydromorphone","fentanyl","codeine","tramadol","buprenorphine","methadone","dilaudid","percocet","vicodin"],
  benzodiazepine:["lorazepam","diazepam","alprazolam","clonazepam","midazolam","temazepam","oxazepam","chlordiazepoxide","ativan","valium","xanax","klonopin"],
  fluoroquinolone:["ciprofloxacin","levofloxacin","moxifloxacin","norfloxacin","ofloxacin","cipro","levaquin","avelox"],
  macrolide:     ["azithromycin","clarithromycin","erythromycin","zithromax","biaxin"],
  tetracycline:  ["doxycycline","tetracycline","minocycline","vibramycin"],
  cephalosporin: ["cephalexin","cefazolin","ceftriaxone","cefdinir","cefuroxime","cefpodoxime","cefepime","ancef","rocephin","keflex"],
  statin:        ["atorvastatin","simvastatin","rosuvastatin","pravastatin","lovastatin","fluvastatin","pitavastatin","lipitor","crestor","zocor"],
  ssri:          ["sertraline","fluoxetine","paroxetine","citalopram","escitalopram","fluvoxamine","zoloft","prozac","paxil","lexapro"],
  "ace-inhibitor":["lisinopril","enalapril","captopril","ramipril","benazepril","quinapril","fosinopril"],
  "beta-blocker": ["metoprolol","atenolol","carvedilol","propranolol","bisoprolol","labetalol","nadolol"],
};

const PMH_CATS = [
  { label:"Cardiovascular", color:T.coral, icon:"❤️", items:["HTN","CAD / Angina","Prior MI","HFrEF","HFpEF","Atrial Fibrillation","SVT","PAD","DVT / PE","Hyperlipidemia","Cardiomyopathy","Pacemaker / ICD","Valvular Disease"]},
  { label:"Pulmonary", color:T.blue, icon:"🫁", items:["Asthma","COPD","OSA","Pulmonary Hypertension","ILD / Pulmonary Fibrosis","Prior PE","Recurrent Pneumonia"]},
  { label:"Metabolic / Endocrine", color:T.green, icon:"🩸", items:["DM Type 1","DM Type 2","Obesity (BMI >30)","Hypothyroidism","Hyperthyroidism","Metabolic Syndrome","Adrenal Insufficiency","Cushing Syndrome"]},
  { label:"GI / Hepatic", color:T.orange, icon:"🫃", items:["GERD","IBD (Crohn's / UC)","Cirrhosis / Liver Disease","NAFLD / NASH","PUD / GI Bleed","Celiac Disease","Pancreatitis (prior)","Cholecystectomy"]},
  { label:"Renal / GU", color:T.cyan, icon:"🫘", items:["CKD","ESRD on Hemodialysis","Kidney Stones","BPH","Neurogenic Bladder","Recurrent UTI","PKD"]},
  { label:"Neurological", color:T.purple, icon:"🧠", items:["Epilepsy / Seizures","CVA / TIA","Migraines","Parkinson Disease","Dementia / Alzheimer's","Peripheral Neuropathy","MS","Myasthenia Gravis","Essential Tremor"]},
  { label:"Psychiatric", color:T.gold, icon:"💭", items:["Depression","Anxiety Disorder","Bipolar Disorder","Schizophrenia / Psychosis","PTSD","ADHD","OCD","Eating Disorder","Alcohol Use Disorder","Substance Use Disorder"]},
  { label:"Oncologic / Heme", color:T.coral, icon:"🔬", items:["Active Malignancy","Cancer in Remission","Hematologic Malignancy","Sickle Cell Disease","Coagulopathy","On Anticoagulation","Anemia (chronic)"]},
  { label:"Immunologic / Infectious", color:T.teal, icon:"🦠", items:["HIV / AIDS","Hepatitis B","Hepatitis C","Autoimmune (SLE / RA / other)","Immunocompromised","Solid Organ Transplant","Recurrent C. diff"]},
  { label:"Musculoskeletal", color:T.txt2, icon:"🦴", items:["Osteoporosis","Osteoarthritis","Rheumatoid Arthritis","Gout","Fibromyalgia","Chronic Back Pain","Prior Fractures"]},
];

const SOC_DEFAULTS = { tobacco:"never",tobaccoDetail:"",alcohol:"none",alcoholDetail:"",drugs:"never",drugsDetail:"",living:"",employment:"",exercise:"none",notes:"" };
const TOBACCO_OPTS  = ["never","former","current (light <1ppd)","current (heavy >=1ppd)","vaping / e-cig","smokeless tobacco"];
const ALCOHOL_OPTS  = ["none","occasional (<1/wk)","social (1-7/wk)","regular (>7/wk)","concerning / heavy","prior AUD (in remission)"];
const DRUGS_OPTS    = ["never","prior (in remission)","current (recreational)","current (dependent)","cannabis only","on MAT (buprenorphine/methadone)"];
const LIVING_OPTS   = ["","lives alone","with family / partner","assisted living","nursing / long-term care facility","homeless / unstable housing","other"];
const EMPLOY_OPTS   = ["","employed full-time","employed part-time","unemployed","retired","on disability","student","homemaker"];
const EXERCISE_OPTS = ["none","sedentary","light (walks occasionally)","moderate (30 min 3x/wk)","active (daily exercise)"];
const FREQ_OPTS_MED = ["Daily","BID","TID","QID","QHS","Q4-6h PRN","PRN","Weekly","Monthly","Continuous / infusion","Other"];
const ROUTE_OPTS_MED= ["PO","IV","IM","SC","SL","Topical","Inhaled","Patch","Rectal","Ophthalmic","Intranasal","Other"];

function matchBeers(str) {
  if (!str || !str.trim()) return null;
  const lower = str.toLowerCase();
  for (const entry of BEERS_DB) {
    for (const kw of entry.keywords) { if (lower.includes(kw)) return entry; }
  }
  return null;
}

function matchControlled(str) {
  if (!str || !str.trim()) return false;
  const lower = str.toLowerCase();
  return CONTROLLED_KEYWORDS.some(kw => lower.includes(kw));
}

function matchAllergyMed(medStr, allergies) {
  if (!medStr || !allergies || !allergies.length) return null;
  const lower = medStr.toLowerCase();
  for (const allergy of allergies) {
    const allergyLower = allergy.toLowerCase().replace(/[\s-]/g, "");
    for (const [cls, keywords] of Object.entries(ALLERGY_KEYWORDS)) {
      if (!cls.includes(allergyLower) && !allergyLower.includes(cls.replace(/-/g, "").slice(0,5))) continue;
      for (const kw of keywords) { if (lower.includes(kw)) return `${allergy} allergy — possible cross-reactivity`; }
    }
    for (const [cls, keywords] of Object.entries(ALLERGY_KEYWORDS)) {
      for (const kw of keywords) {
        if (allergyLower.includes(kw.slice(0,5)) || kw.includes(allergyLower.slice(0,5))) {
          if (lower.includes(kw)) return `Possible ${allergy} cross-reactivity`;
        }
      }
    }
  }
  return null;
}

function parsePastedMeds(text) {
  if (!text.trim()) return [];
  return text.split(/\n|;/).map(l=>l.trim()).filter(l=>l.length>1)
    .map(l=>l.replace(/^\d+[\.\)]\s*/,"").replace(/^-\s*/,"").trim())
    .filter(l=>l.length>1&&l.length<200);
}

function buildMedString(name, dose, route, freq) {
  const parts = [name.trim()];
  if (dose.trim())  parts.push(dose.trim());
  if (route.trim() && route !== "PO") parts.push(route);
  if (freq.trim())  parts.push(freq.trim());
  return parts.join(" ");
}

function parseSocHxStr(str) {
  if (!str) return { ...SOC_DEFAULTS };
  try { return { ...SOC_DEFAULTS, ...JSON.parse(str) }; } catch { return { ...SOC_DEFAULTS, notes: str }; }
}
function socHxToStr(obj) { return JSON.stringify(obj); }

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────
function Badge({ label, color, size }) {
  const fs = size === "sm" ? 9 : 10;
  return (
    <span style={{ fontFamily:"JetBrains Mono",fontSize:fs,fontWeight:700,padding:"2px 7px",borderRadius:20,background:`${color}18`,border:`1px solid ${color}44`,color,whiteSpace:"nowrap",textTransform:"uppercase",letterSpacing:1 }}>
      {label}
    </span>
  );
}

function BeersInlineBanner({ entry }) {
  if (!entry) return null;
  return (
    <div className="mt-in" style={{ padding:"10px 13px",background:"rgba(245,200,66,0.09)",border:"1px solid rgba(245,200,66,0.45)",borderLeft:"3px solid rgba(245,200,66,0.8)",borderRadius:9,marginTop:4 }}>
      <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:5 }}>
        <span style={{ fontSize:13 }}>👴</span>
        <span style={{ fontFamily:"JetBrains Mono",fontSize:9,color:T.gold,letterSpacing:1.2,textTransform:"uppercase" }}>Beers Criteria — {entry.concern}</span>
      </div>
      <div style={{ fontFamily:"DM Sans",fontSize:11.5,color:"#f5e28a",lineHeight:1.6,marginBottom:4 }}><strong>Risk:</strong> {entry.risk}</div>
      <div style={{ fontFamily:"DM Sans",fontSize:11.5,color:T.txt3,lineHeight:1.6 }}><strong style={{color:T.teal}}>Alternative:</strong> {entry.alt}</div>
    </div>
  );
}

function SectionHeader({ icon, title, count, color, expanded, onToggle, trailing }) {
  return (
    <div className="mt-section-toggle"
      style={{ width:"100%",display:"flex",alignItems:"center",gap:10,padding:"13px 16px",background:"transparent",cursor:"pointer",textAlign:"left" }}>
      <div onClick={onToggle} style={{ display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0 }}>
        <span style={{ fontSize:16 }}>{icon}</span>
        <span style={{ fontFamily:"Playfair Display",fontWeight:700,fontSize:14,color:T.txt,flex:1 }}>{title}</span>
        {count > 0 && <span style={{ fontFamily:"JetBrains Mono",fontSize:10,color:color||T.teal,background:`${color||T.teal}18`,padding:"2px 8px",borderRadius:10 }}>{count}</span>}
      </div>
      {trailing}
      <span onClick={onToggle} style={{ fontFamily:"JetBrains Mono",fontSize:11,color:T.txt3,marginLeft:2,cursor:"pointer" }}>{expanded ? "▲" : "▼"}</span>
    </div>
  );
}

function FieldLabel({ children, required }) {
  return (
    <label style={{ fontFamily:"DM Sans",fontSize:10,fontWeight:600,color:T.txt3,textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:3 }}>
      {children}{required && <span style={{color:T.coral}}> *</span>}
    </label>
  );
}

function SelectField({ value, onChange, options }) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{ ...inp(false),cursor:"pointer" }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export default function MedsTab({
  medications, setMedications,
  allergies, setAllergies,
  pmhSelected, setPmhSelected,
  pmhExtra, setPmhExtra,
  surgHx, setSurgHx,
  famHx, setFamHx,
  socHx, setSocHx,
  pmhExpanded, setPmhExpanded,
  onAdvance,
  patientAge,
  pdmpState, setPdmpState,
}) {
  const [drugInput,  setDrugInput]  = useState("");
  const [doseInput,  setDoseInput]  = useState("");
  const [routeInput, setRouteInput] = useState("PO");
  const [freqInput,  setFreqInput]  = useState("Daily");
  const [medsOpen,   setMedsOpen]   = useState(true);
  const [addMedOpen, setAddMedOpen] = useState(false);
  const [pasteOpen,  setPasteOpen]  = useState(false);
  const [pasteText,  setPasteText]  = useState("");
  const [parsedPaste,setParsedPaste]= useState([]);
  const [allergyInput, setAllergyInput] = useState("");
  const [allergyOpen,  setAllergyOpen]  = useState(true);
  const [pmhOpen,   setPmhOpen]   = useState(false);
  const [activePmhCat, setActivePmhCat] = useState(0);
  const [hxOpen, setHxOpen] = useState(false);
  const [socOpen, setSocOpen] = useState(false);
  const [soc, setSoc] = useState(() => parseSocHxStr(socHx));
  const [ageInput, setAgeInput] = useState(patientAge || "");

  // ── FIX: refs for focus management ───────────────────────────────────────
  const allergyRef = useRef(null);
  const drugRef    = useRef(null);
  const pasteRef   = useRef(null);

  // ── FIX: auto-focus allergy input on mount ────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => allergyRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  // ── FIX: Cmd+Enter → advance (unless paste textarea is focused → parse) ──
  useEffect(() => {
    const h = (e) => {
      if (!(e.metaKey || e.ctrlKey) || e.key !== "Enter") return;
      e.preventDefault();
      // If paste panel is open and its textarea is focused → parse instead
      if (pasteOpen && document.activeElement === pasteRef.current) {
        setParsedPaste(parsePastedMeds(pasteText));
        return;
      }
      onAdvance?.();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [pasteOpen, pasteText, onAdvance]);

  // ── FIX: Cmd+M → toggle add-med panel and focus drug input ───────────────
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "m" || e.key === "M")) {
        e.preventDefault();
        setAddMedOpen(v => {
          const next = !v;
          if (next) {
            setPasteOpen(false);
            setTimeout(() => drugRef.current?.focus(), 60);
          }
          return next;
        });
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const isGeriatric = parseInt(ageInput) >= 65;

  const pmhList  = Object.keys(pmhSelected || {}).filter(k => pmhSelected[k]);
  const pmhCount = pmhList.length;

  const beersWarning      = useMemo(() => isGeriatric ? matchBeers(drugInput) : null, [drugInput, isGeriatric]);
  const allergyWarning    = useMemo(() => matchAllergyMed(drugInput, allergies), [drugInput, allergies]);
  const controlledWarning = useMemo(() => matchControlled(drugInput), [drugInput]);

  const controlledInList = useMemo(() =>
    medications.filter(m => matchControlled(m)),
  [medications]);
  const pdmpRequired = controlledInList.length > 0;

  const handleAddMed = useCallback(() => {
    const name = drugInput.trim();
    if (!name) return;
    const medStr = buildMedString(name, doseInput, routeInput, freqInput);
    setMedications(prev => [...prev, medStr]);
    setDrugInput(""); setDoseInput(""); setRouteInput("PO"); setFreqInput("Daily");
    setAddMedOpen(false);
  }, [drugInput, doseInput, routeInput, freqInput, setMedications]);

  const handleRemoveMed = useCallback((i) => {
    setMedications(prev => prev.filter((_,j) => j !== i));
  }, [setMedications]);

  const handleAddAllergy = useCallback(() => {
    const a = allergyInput.trim();
    if (!a || allergies.includes(a.toLowerCase())) return;
    setAllergies(prev => [...prev, a.toLowerCase()]);
    setAllergyInput("");
  }, [allergyInput, allergies, setAllergies]);

  const handleRemoveAllergy = useCallback((i) => {
    setAllergies(prev => prev.filter((_,j) => j !== i));
  }, [setAllergies]);

  const handleTogglePMH = useCallback((cond) => {
    setPmhSelected(prev => ({ ...(prev||{}), [cond]: !(prev||{})[cond] }));
  }, [setPmhSelected]);

  const handlePasteParse = useCallback(() => { setParsedPaste(parsePastedMeds(pasteText)); }, [pasteText]);

  const handleAcceptParsed = useCallback(() => {
    if (!parsedPaste.length) return;
    setMedications(prev => {
      const existing = new Set(prev.map(m => m.toLowerCase()));
      return [...prev, ...parsedPaste.filter(m => !existing.has(m.toLowerCase()))];
    });
    setPasteText(""); setParsedPaste([]); setPasteOpen(false);
  }, [parsedPaste, setMedications]);

  const handleSocChange = useCallback((key, val) => {
    setSoc(prev => {
      const next = { ...prev, [key]: val };
      setSocHx(socHxToStr(next));
      return next;
    });
  }, [setSocHx]);

  const beersCount = useMemo(() => {
    if (!isGeriatric) return 0;
    return medications.filter(m => matchBeers(m)).length;
  }, [medications, isGeriatric]);

  const allergyFlagCount = useMemo(() =>
    medications.filter(m => matchAllergyMed(m, allergies)).length,
  [medications, allergies]);

  // ── FIX: handlePasteKeyDown now catches both Ctrl+Enter and Cmd+Enter ─────
  // Note: Cmd+Enter is intercepted by the global handler above; this catches
  // the case where focus is in the textarea and the global handler calls
  // handlePasteParse for us. We only need Ctrl here for non-Mac users.
  function handlePasteKeyDown(e) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handlePasteParse();
  }

  // ── FIX: PMH category keyboard navigation ─────────────────────────────────
  const handlePmhCatKey = useCallback((e, idx) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setActivePmhCat(i => Math.min(i + 1, PMH_CATS.length - 1));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActivePmhCat(i => Math.max(i - 1, 0));
    }
  }, []);

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:0,height:"100%",overflowY:"auto",padding:"0 0 80px 0" }}>

      {/* ── Stats bar ── */}
      <div style={{ display:"flex",alignItems:"center",flexWrap:"wrap",gap:8,padding:"12px 20px",borderBottom:"1px solid rgba(26,53,85,0.4)",background:"rgba(5,15,30,0.5)",flexShrink:0 }}>
        {[
          { label:`${medications.length} Meds`,       color:T.teal,   show:true },
          { label:`${allergies.length} Allergies`,    color:T.coral,  show:true },
          { label:`${pmhCount} PMH`,                  color:T.blue,   show:true },
          { label:`${beersCount} Beers`,              color:T.gold,   show:beersCount>0 },
          { label:`${allergyFlagCount} DDI/Allergy`,  color:T.orange, show:allergyFlagCount>0 },
          { label:`PDMP Required`,                    color:"#ff9f43",show:pdmpRequired && !pdmpState?.checked },
          { label:`PDMP \u2713`,                      color:T.teal,   show:pdmpRequired && !!pdmpState?.checked },
        ].filter(s => s.show).map(s=>(
          <span key={s.label} style={{ fontFamily:"JetBrains Mono",fontSize:10,color:s.color,background:`${s.color}15`,padding:"3px 10px",borderRadius:20,border:`1px solid ${s.color}33` }}>{s.label}</span>
        ))}
        <div style={{ flex:1 }}/>
        <div style={{ display:"flex",alignItems:"center",gap:6,padding:"3px 10px",borderRadius:8,background:isGeriatric?"rgba(245,200,66,0.1)":"rgba(14,37,68,0.6)",border:`1px solid ${isGeriatric?"rgba(245,200,66,0.4)":"rgba(26,53,85,0.5)"}` }}>
          <span style={{ fontFamily:"JetBrains Mono",fontSize:10,color:isGeriatric?T.gold:T.txt3 }}>{isGeriatric?"👴":"👤"}</span>
          <input placeholder="Age" value={ageInput} onChange={e=>setAgeInput(e.target.value)}
            type="number" min="0" max="120"
            style={{ background:"transparent",border:"none",outline:"none",color:isGeriatric?T.gold:T.txt,fontFamily:"JetBrains Mono",fontSize:11,width:32 }} />
          <span style={{ fontFamily:"JetBrains Mono",fontSize:9,color:isGeriatric?T.gold:T.txt3 }}>{isGeriatric?"yr — Beers":"yr"}</span>
        </div>
      </div>

      <div style={{ padding:"14px 20px",display:"flex",flexDirection:"column",gap:12 }}>

        {/* ── Medications ── */}
        <div style={{ ...glass({borderRadius:14}),overflow:"hidden" }}>
          <SectionHeader icon="💊" title="Current Medications" count={medications.length} color={T.teal}
            expanded={medsOpen} onToggle={()=>setMedsOpen(v=>!v)}
            trailing={
              <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                <button onClick={e=>{e.stopPropagation();setPasteOpen(v=>!v);setAddMedOpen(false);}}
                  style={{ padding:"3px 9px",borderRadius:7,background:pasteOpen?"rgba(59,158,255,0.15)":"rgba(26,53,85,0.5)",border:`1px solid ${pasteOpen?"rgba(59,158,255,0.5)":"rgba(42,77,114,0.4)"}`,color:pasteOpen?T.blue:T.txt3,fontFamily:"DM Sans",fontWeight:600,fontSize:10.5,cursor:"pointer",whiteSpace:"nowrap" }}>
                  📋 Paste
                </button>
                <button onClick={e=>{e.stopPropagation();setAddMedOpen(v=>!v);setPasteOpen(false);setTimeout(()=>drugRef.current?.focus(),60);}}
                  style={{ padding:"3px 9px",borderRadius:7,background:addMedOpen?"rgba(0,229,192,0.15)":"rgba(26,53,85,0.5)",border:`1px solid ${addMedOpen?"rgba(0,229,192,0.5)":"rgba(42,77,114,0.4)"}`,color:addMedOpen?T.teal:T.txt3,fontFamily:"DM Sans",fontWeight:600,fontSize:10.5,cursor:"pointer",display:"flex",alignItems:"center",gap:4 }}>
                  + Add <span style={{ fontFamily:"JetBrains Mono",fontSize:8,color:addMedOpen?T.teal:T.txt4,opacity:.7 }}>⌘M</span>
                </button>
              </div>
            }
          />
          {medsOpen && (
            <div style={{ padding:"0 16px 14px" }}>
              {pasteOpen && (
                <div className="mt-in" style={{ display:"flex",flexDirection:"column",gap:8,padding:"12px 14px",background:"rgba(59,158,255,0.06)",border:"1px solid rgba(59,158,255,0.2)",borderRadius:10,marginBottom:10 }}>
                  <div style={{ fontFamily:"DM Sans",fontSize:11.5,color:T.txt3 }}>Paste a medication list — one med per line, or semicolons. Ctrl/Cmd+Enter to parse.</div>
                  <textarea ref={pasteRef} value={pasteText} onChange={e=>setPasteText(e.target.value)} onKeyDown={handlePasteKeyDown} rows={5}
                    placeholder={"Metformin 500mg BID\nLisinopril 10mg daily\nAtorvastatin 40mg nightly"}
                    style={{ ...inp(!!pasteText),resize:"vertical",lineHeight:1.6,fontFamily:"JetBrains Mono",fontSize:12 }} />
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <button onClick={handlePasteParse} style={{ padding:"7px 16px",borderRadius:8,background:`${T.blue}22`,border:`1px solid ${T.blue}44`,color:T.blue,fontFamily:"DM Sans",fontWeight:700,fontSize:12,cursor:"pointer" }}>Parse List</button>
                    {parsedPaste.length > 0 && <span style={{ fontFamily:"DM Sans",fontSize:11.5,color:T.txt2,marginLeft:6 }}>{parsedPaste.length} found</span>}
                    <div style={{ flex:1 }}/>
                    {parsedPaste.length > 0 && (
                      <button onClick={handleAcceptParsed} style={{ padding:"7px 16px",borderRadius:8,background:`${T.teal}22`,border:`1px solid ${T.teal}44`,color:T.teal,fontFamily:"DM Sans",fontWeight:700,fontSize:12,cursor:"pointer" }}>Accept All ({parsedPaste.length})</button>
                    )}
                  </div>
                  {parsedPaste.length > 0 && (
                    <div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>
                      {parsedPaste.map((m,i) => {
                        const b = isGeriatric ? matchBeers(m) : null;
                        return <span key={i} style={{ padding:"4px 11px",borderRadius:20,background:b?"rgba(245,200,66,0.1)":"rgba(0,229,192,0.08)",border:`1px solid ${b?"rgba(245,200,66,0.4)":"rgba(0,229,192,0.25)"}`,fontFamily:"DM Sans",fontWeight:500,fontSize:12,color:b?T.gold:T.teal }}>{b?"👴 ":""}{m}</span>;
                      })}
                    </div>
                  )}
                </div>
              )}
              {addMedOpen && (
                <div className="mt-in" style={{ display:"flex",flexDirection:"column",gap:10,padding:"12px 14px",background:"rgba(0,229,192,0.04)",border:"1px solid rgba(0,229,192,0.2)",borderRadius:10,marginBottom:10 }}>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr auto",gap:8 }}>
                    <div>
                      <FieldLabel required>Drug Name</FieldLabel>
                      {/* FIX: ref added; focus is handled by Cmd+M useEffect and the + Add button click */}
                      <input ref={drugRef} value={drugInput} onChange={e=>setDrugInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&drugInput.trim()&&handleAddMed()}
                        placeholder="e.g., Metformin, Lisinopril 10mg..." style={inp(!!drugInput)} />
                    </div>
                    <div style={{ display:"flex",flexDirection:"column",justifyContent:"flex-end" }}>
                      <button onClick={handleAddMed} disabled={!drugInput.trim()}
                        style={{ padding:"8px 18px",borderRadius:9,background:drugInput.trim()?`linear-gradient(135deg,${T.teal},#00b4d8)`:"rgba(26,53,85,0.4)",border:"none",color:drugInput.trim()?"#050f1e":T.txt4,fontFamily:"DM Sans",fontWeight:700,fontSize:13,cursor:drugInput.trim()?"pointer":"not-allowed",whiteSpace:"nowrap",height:38 }}>
                        + Add
                      </button>
                    </div>
                  </div>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
                    <div><FieldLabel>Dose</FieldLabel><input value={doseInput} onChange={e=>setDoseInput(e.target.value)} placeholder="e.g., 10mg, 500mg" style={inp(!!doseInput)} /></div>
                    <div><FieldLabel>Route</FieldLabel><SelectField value={routeInput} onChange={setRouteInput} options={ROUTE_OPTS_MED} /></div>
                    <div><FieldLabel>Frequency</FieldLabel><SelectField value={freqInput} onChange={setFreqInput} options={FREQ_OPTS_MED} /></div>
                  </div>
                  {isGeriatric && beersWarning && <BeersInlineBanner entry={beersWarning} />}
                  {allergyWarning && (
                    <div className="mt-in" style={{ padding:"8px 12px",background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.4)",borderLeft:"3px solid rgba(255,107,107,0.8)",borderRadius:8,fontFamily:"DM Sans",fontSize:12,color:T.coral }}>
                      ⚠ {allergyWarning}
                    </div>
                  )}
                  {controlledWarning && (
                    <div className="mt-in" style={{ padding:"8px 12px",background:"rgba(255,159,67,0.08)",border:"1px solid rgba(255,159,67,0.35)",borderLeft:"3px solid #ff9f43",borderRadius:8,fontFamily:"DM Sans",fontSize:12,color:"#ffb870" }}>
                      📋 Controlled substance detected — PDMP check required before dispensing. Document below after checking.
                    </div>
                  )}
                  {!isGeriatric && drugInput && matchBeers(drugInput) && (
                    <div style={{ padding:"7px 11px",background:"rgba(245,200,66,0.07)",border:"1px solid rgba(245,200,66,0.25)",borderRadius:8,fontFamily:"DM Sans",fontSize:11,color:"#b8922a" }}>
                      👴 This drug appears on the AGS Beers Criteria. Set patient age ≥65 above to see full risk details.
                    </div>
                  )}
                </div>
              )}
              {medications.length === 0 ? (
                <div style={{ padding:"20px 12px",textAlign:"center",color:T.txt4,fontFamily:"DM Sans",fontSize:13 }}>No medications added — use Add (⌘M) or Paste above</div>
              ) : (
                <div style={{ display:"flex",flexWrap:"wrap",gap:7 }}>
                  {medications.map((m, i) => {
                    const beers    = isGeriatric ? matchBeers(m) : null;
                    const allergyX = matchAllergyMed(m, allergies);
                    const ctrl     = matchControlled(m);
                    return (
                      <div key={i} className="mt-chip mt-slide"
                        style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"6px 11px",borderRadius:20,
                          background: beers?"rgba(245,200,66,0.1)":allergyX?"rgba(255,107,107,0.1)":ctrl?"rgba(255,159,67,0.08)":"rgba(14,37,68,0.8)",
                          border:`1px solid ${beers?"rgba(245,200,66,0.4)":allergyX?"rgba(255,107,107,0.4)":ctrl?"rgba(255,159,67,0.3)":"rgba(42,77,114,0.4)"}`,
                          maxWidth:"100%",flexWrap:"nowrap" }}>
                        {beers    && <span title={`Beers: ${beers.concern}`} style={{ fontSize:11,cursor:"help" }}>👴</span>}
                        {allergyX && <span title={allergyX} style={{ fontSize:11,cursor:"help" }}>⚠</span>}
                        {ctrl     && <span title="Controlled substance — PDMP required" style={{ fontSize:11,cursor:"help" }}>📋</span>}
                        <span style={{ fontFamily:"DM Sans",fontWeight:500,fontSize:12.5,color:beers?T.gold:allergyX?T.coral:ctrl?"#ffb870":T.txt2,maxWidth:220,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{m}</span>
                        <button onClick={()=>handleRemoveMed(i)} style={{ background:"transparent",border:"none",color:T.txt4,cursor:"pointer",fontSize:11,padding:"0 1px",flexShrink:0,lineHeight:1 }}>✕</button>
                      </div>
                    );
                  })}
                </div>
              )}
              {isGeriatric && beersCount > 0 && (
                <div style={{ marginTop:10,padding:"8px 12px",background:"rgba(245,200,66,0.07)",border:"1px solid rgba(245,200,66,0.25)",borderRadius:8,fontFamily:"DM Sans",fontSize:11.5,color:"#b8922a" }}>
                  👴 <strong>{beersCount} medication{beersCount>1?"s":""}</strong> on the AGS 2023 Beers Criteria detected. Consider medication review for this ≥65 patient.
                </div>
              )}

              {/* ── PDMP Documentation ── */}
              {pdmpRequired && (
                <div className="mt-in" style={{ marginTop:12,padding:"12px 14px",background:pdmpState?.checked?"rgba(0,229,192,0.06)":"rgba(255,159,67,0.07)",border:`1px solid ${pdmpState?.checked?"rgba(0,229,192,0.25)":"rgba(255,159,67,0.3)"}`,borderLeft:`3px solid ${pdmpState?.checked?"var(--npi-teal, #00e5c0)":"#ff9f43"}`,borderRadius:10 }}>
                  <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:8 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                      <span style={{ fontSize:14 }}>📋</span>
                      <div>
                        <div style={{ fontFamily:"JetBrains Mono",fontSize:9,letterSpacing:1.5,textTransform:"uppercase",color:pdmpState?.checked?"#00e5c0":"#ff9f43" }}>
                          PDMP Check {pdmpState?.checked ? "— Documented" : "— Required"}
                        </div>
                        <div style={{ fontFamily:"DM Sans",fontSize:10,color:T.txt4,marginTop:1 }}>
                          {controlledInList.slice(0,3).join(", ")}{controlledInList.length>3?` +${controlledInList.length-3} more`:""}
                        </div>
                      </div>
                    </div>
                    {!pdmpState?.checked && (
                      <button onClick={() => setPdmpState(p => ({ ...p, checked:true, timestamp:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",hour12:false}) }))}
                        style={{ padding:"6px 14px",borderRadius:7,cursor:"pointer",background:"rgba(255,159,67,0.12)",border:"1px solid rgba(255,159,67,0.45)",fontFamily:"DM Sans",fontWeight:700,fontSize:12,color:"#ff9f43",whiteSpace:"nowrap" }}>
                        ✓ Stamp PDMP Checked
                      </button>
                    )}
                    {pdmpState?.checked && (
                      <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                        <span style={{ fontFamily:"JetBrains Mono",fontSize:10,color:"#00e5c0" }}>✓ {pdmpState.timestamp}</span>
                        <button onClick={() => setPdmpState(p => ({ ...p, checked:false, timestamp:"", method:"" }))}
                          style={{ background:"transparent",border:"none",color:T.txt4,cursor:"pointer",fontSize:11,padding:"0 2px" }}>✕</button>
                      </div>
                    )}
                  </div>
                  {pdmpState?.checked && (
                    <div>
                      <FieldLabel>Method</FieldLabel>
                      <SelectField value={pdmpState?.method||""} onChange={v => setPdmpState(p => ({ ...p, method:v }))}
                        options={["", ...PDMP_METHODS]} />
                    </div>
                  )}
                  {!pdmpState?.checked && (
                    <div style={{ fontFamily:"DM Sans",fontSize:11,color:T.txt4,lineHeight:1.6 }}>
                      Controlled substance(s) on medication list. Most states require a PDMP query before prescribing Schedule II–IV medications. Stamp when checked to document compliance.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Allergies ── */}
        <div style={{ ...glass({borderRadius:14}),overflow:"hidden" }}>
          <SectionHeader icon="⚠️" title="Allergies & Intolerances" count={allergies.length} color={T.coral} expanded={allergyOpen} onToggle={()=>setAllergyOpen(v=>!v)} />
          {allergyOpen && (
            <div style={{ padding:"0 16px 14px",display:"flex",flexDirection:"column",gap:10 }}>
              <div style={{ display:"flex",gap:8 }}>
                {/* FIX: ref added for auto-focus on mount */}
                <input ref={allergyRef} value={allergyInput} onChange={e=>setAllergyInput(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&allergyInput.trim()&&handleAddAllergy()}
                  placeholder="Add allergy (e.g., penicillin, NSAIDs, latex, shellfish, contrast)..."
                  style={{ ...inp(!!allergyInput),flex:1 }} />
                <button onClick={handleAddAllergy} disabled={!allergyInput.trim()}
                  style={{ padding:"8px 18px",borderRadius:9,background:allergyInput.trim()?`${T.coral}22`:"rgba(26,53,85,0.4)",border:`1px solid ${allergyInput.trim()?`${T.coral}44`:"rgba(26,53,85,0.3)"}`,color:allergyInput.trim()?T.coral:T.txt4,fontFamily:"DM Sans",fontWeight:700,fontSize:12,cursor:allergyInput.trim()?"pointer":"not-allowed",whiteSpace:"nowrap" }}>
                  + Add
                </button>
              </div>
              {allergies.length === 0 ? (
                <div style={{ padding:"10px 14px",borderRadius:9,background:"rgba(61,255,160,0.06)",border:"1px solid rgba(61,255,160,0.25)",fontFamily:"DM Sans",fontSize:13,color:T.green,fontWeight:600 }}>✓ NKDA — No Known Drug Allergies</div>
              ) : (
                <div style={{ display:"flex",flexWrap:"wrap",gap:7 }}>
                  {allergies.map((a, i) => (
                    <div key={i} className="mt-chip" style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:20,background:"rgba(255,107,107,0.12)",border:"1px solid rgba(255,107,107,0.4)" }}>
                      <span style={{ fontFamily:"DM Sans",fontWeight:600,fontSize:13,color:T.coral }}>⚠ {a}</span>
                      <button onClick={()=>handleRemoveAllergy(i)} style={{ background:"transparent",border:"none",color:T.txt4,cursor:"pointer",fontSize:11,padding:"0 1px",lineHeight:1 }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
              {allergies.length > 0 && (
                <details style={{ cursor:"pointer" }}>
                  <summary style={{ fontFamily:"DM Sans",fontSize:11.5,color:T.txt3,userSelect:"none",listStyle:"none",display:"flex",alignItems:"center",gap:6 }}>
                    <span style={{ fontSize:10,color:T.txt4 }}>▶</span> Cross-reactivity reference
                  </summary>
                  <div style={{ marginTop:8,display:"flex",flexDirection:"column",gap:6 }}>
                    {[{allergy:"Penicillin",cross:"Cephalosporins (~1-2% cross-reactivity); Carbapenems (~1%)"},{allergy:"Sulfonamide (antibiotic)",cross:"Non-antibiotic sulfonamides (furosemide, thiazides, sulfonylureas) — no class cross-reactivity"},{allergy:"NSAID / Aspirin",cross:"All COX-1 inhibiting NSAIDs; selective COX-2 inhibitors (celecoxib) may be tolerated"},{allergy:"Fluoroquinolone",cross:"Class-wide cross-reactivity likely — avoid all fluoroquinolones"},].map((r,i)=>(
                      <div key={i} style={{ padding:"7px 11px",background:"rgba(14,37,68,0.5)",border:"1px solid rgba(255,159,67,0.15)",borderRadius:8,fontFamily:"DM Sans",fontSize:11.5,color:T.txt2,lineHeight:1.5 }}>
                        <strong style={{color:T.orange}}>{r.allergy}:</strong> {r.cross}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>

        {/* ── Past Medical History ── */}
        <div style={{ ...glass({borderRadius:14}),overflow:"hidden" }}>
          <SectionHeader icon="📋" title="Past Medical History" count={pmhCount} color={T.blue} expanded={pmhExpanded} onToggle={()=>setPmhExpanded(v=>!v)} />
          {pmhExpanded && (
            <div style={{ padding:"0 16px 14px" }}>
              {/* FIX: PMH category tabs — ArrowLeft/Right navigate between categories */}
              <div style={{ display:"flex",gap:4,flexWrap:"wrap",marginBottom:12 }}>
                {PMH_CATS.map((cat, i) => (
                  <button key={i} onClick={()=>setActivePmhCat(i)}
                    onKeyDown={e=>handlePmhCatKey(e, i)}
                    style={{ padding:"4px 10px",borderRadius:20,background:activePmhCat===i?`${cat.color}22`:"transparent",border:`1px solid ${activePmhCat===i?cat.color+"55":"rgba(42,77,114,0.3)"}`,color:activePmhCat===i?cat.color:T.txt3,fontFamily:"DM Sans",fontWeight:600,fontSize:11,cursor:"pointer",whiteSpace:"nowrap",transition:"all .13s" }}>
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
              <div className="mt-in" style={{ display:"flex",flexWrap:"wrap",gap:6,marginBottom:12 }}>
                {PMH_CATS[activePmhCat].items.map(cond => {
                  const selected = !!(pmhSelected||{})[cond];
                  const cat = PMH_CATS[activePmhCat];
                  return (
                    <button key={cond} onClick={()=>handleTogglePMH(cond)} className="mt-pmh-check"
                      style={{ padding:"6px 13px",borderRadius:9,background:selected?`${cat.color}22`:"rgba(14,37,68,0.7)",border:`1px solid ${selected?cat.color+"66":"rgba(42,77,114,0.35)"}`,color:selected?cat.color:T.txt2,fontFamily:"DM Sans",fontWeight:selected?700:400,fontSize:12,cursor:"pointer" }}>
                      {selected && "✓ "}{cond}
                    </button>
                  );
                })}
              </div>
              {pmhCount > 0 && (
                <div style={{ padding:"10px 13px",background:"rgba(59,158,255,0.06)",border:"1px solid rgba(59,158,255,0.2)",borderRadius:9,marginBottom:10 }}>
                  <div style={{ fontFamily:"JetBrains Mono",fontSize:9,color:T.blue,textTransform:"uppercase",letterSpacing:1,marginBottom:6 }}>Selected Conditions</div>
                  <div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>
                    {pmhList.slice(0,8).map(c=>(
                      <span key={c} style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"3px 9px",borderRadius:20,background:"rgba(59,158,255,0.12)",border:"1px solid rgba(59,158,255,0.3)",fontFamily:"DM Sans",fontSize:11.5,color:T.blue }}>
                        {c}
                        <button onClick={()=>handleTogglePMH(c)} style={{ background:"transparent",border:"none",color:T.txt4,cursor:"pointer",fontSize:10,padding:"0",lineHeight:1 }}>✕</button>
                      </span>
                    ))}
                    {pmhCount > 8 && <span style={{ fontFamily:"DM Sans",fontSize:11,color:T.txt4 }}>+{pmhCount-8}</span>}
                  </div>
                </div>
              )}
              <div>
                <FieldLabel>Additional PMH / Details</FieldLabel>
                <textarea value={pmhExtra} onChange={e=>setPmhExtra(e.target.value)} rows={2}
                  placeholder="Additional medical history, dates, severity, complications..."
                  style={{ ...inp(!!pmhExtra),resize:"vertical",lineHeight:1.6 }} />
              </div>
            </div>
          )}
        </div>

        {/* ── Surgical / Family History ── */}
        <div style={{ ...glass({borderRadius:14}),overflow:"hidden" }}>
          <SectionHeader icon="✂️" title="Surgical & Family History" count={0} color={T.purple} expanded={hxOpen} onToggle={()=>setHxOpen(v=>!v)} />
          {hxOpen && (
            <div style={{ padding:"0 16px 14px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
              <div>
                <FieldLabel>Surgical / Procedural History</FieldLabel>
                <textarea value={surgHx} onChange={e=>setSurgHx(e.target.value)} rows={4}
                  placeholder={"2019 - Appendectomy\n2021 - CABG x3\n2023 - Right knee replacement"}
                  style={{ ...inp(!!surgHx),resize:"vertical",lineHeight:1.6 }} />
              </div>
              <div>
                <FieldLabel>Family History</FieldLabel>
                <textarea value={famHx} onChange={e=>setFamHx(e.target.value)} rows={4}
                  placeholder={"Father: MI at 55, DM Type 2\nMother: Breast cancer\nSibling: HTN"}
                  style={{ ...inp(!!famHx),resize:"vertical",lineHeight:1.6 }} />
              </div>
            </div>
          )}
        </div>

        {/* ── Social History ── */}
        <div style={{ ...glass({borderRadius:14}),overflow:"hidden" }}>
          <SectionHeader icon="🏠" title="Social History" count={0} color={T.cyan} expanded={socOpen} onToggle={()=>setSocOpen(v=>!v)} />
          {socOpen && (
            <div style={{ padding:"0 16px 14px" }}>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12 }}>
                <div>
                  <FieldLabel>Tobacco</FieldLabel>
                  <SelectField value={soc.tobacco} onChange={v=>handleSocChange("tobacco",v)} options={TOBACCO_OPTS} />
                  {(soc.tobacco.includes("current")||soc.tobacco.includes("former")) && (
                    <input value={soc.tobaccoDetail} onChange={e=>handleSocChange("tobaccoDetail",e.target.value)} placeholder="Pack-years, quit date..." style={{ ...inp(!!soc.tobaccoDetail),marginTop:6,fontSize:11 }} />
                  )}
                </div>
                <div>
                  <FieldLabel>Alcohol</FieldLabel>
                  <SelectField value={soc.alcohol} onChange={v=>handleSocChange("alcohol",v)} options={ALCOHOL_OPTS} />
                  {soc.alcohol !== "none" && (
                    <input value={soc.alcoholDetail} onChange={e=>handleSocChange("alcoholDetail",e.target.value)} placeholder="Drinks/day, type..." style={{ ...inp(!!soc.alcoholDetail),marginTop:6,fontSize:11 }} />
                  )}
                </div>
                <div>
                  <FieldLabel>Substance Use</FieldLabel>
                  <SelectField value={soc.drugs} onChange={v=>handleSocChange("drugs",v)} options={DRUGS_OPTS} />
                  {soc.drugs !== "never" && (
                    <input value={soc.drugsDetail} onChange={e=>handleSocChange("drugsDetail",e.target.value)} placeholder="Substances, last use..." style={{ ...inp(!!soc.drugsDetail),marginTop:6,fontSize:11 }} />
                  )}
                </div>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12 }}>
                <div><FieldLabel>Living Situation</FieldLabel><SelectField value={soc.living} onChange={v=>handleSocChange("living",v)} options={LIVING_OPTS} /></div>
                <div><FieldLabel>Employment</FieldLabel><SelectField value={soc.employment} onChange={v=>handleSocChange("employment",v)} options={EMPLOY_OPTS} /></div>
                <div><FieldLabel>Exercise Level</FieldLabel><SelectField value={soc.exercise} onChange={v=>handleSocChange("exercise",v)} options={EXERCISE_OPTS} /></div>
              </div>
              <div>
                <FieldLabel>Additional Social History Notes</FieldLabel>
                <textarea value={soc.notes} onChange={e=>handleSocChange("notes",e.target.value)} rows={2}
                  placeholder="Occupation details, travel history, support system, advance directives, safety concerns..."
                  style={{ ...inp(!!soc.notes),resize:"vertical",lineHeight:1.6 }} />
              </div>
            </div>
          )}
        </div>

        {/* ── FIX: Keyboard legend ──────────────────────────────────────────── */}
        <div style={{ display:"flex",flexWrap:"wrap",gap:12,padding:"8px 12px",background:"rgba(14,37,68,.5)",border:"1px solid rgba(26,53,85,0.4)",borderRadius:8 }}>
          {[
            ["Enter",   "Add allergy / med (in input)"],
            ["⌘M",      "Open / close Add Med panel"],
            ["⌘↵",      "→ SDOH (from anywhere)"],
            ["⌘/Ctrl+↵","Parse paste list (in paste box)"],
            ["←→",      "Navigate PMH categories (on tab)"],
          ].map(([k, d]) => (
            <div key={k} style={{ display:"flex",alignItems:"center",gap:5,fontSize:11,color:"var(--npi-txt4, #5a82a8)" }}>
              <kbd style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,background:"rgba(14,37,68,.8)",border:"1px solid rgba(42,77,114,0.5)",borderRadius:3,padding:"0 5px",color:"var(--npi-blue, #3b9eff)" }}>{k}</kbd>
              {d}
            </div>
          ))}
        </div>

        <button onClick={onAdvance}
          style={{ alignSelf:"flex-end",padding:"11px 28px",borderRadius:12,background:`linear-gradient(135deg,${T.teal},#00b4d8)`,border:"none",color:"#050f1e",fontFamily:"DM Sans",fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 20px rgba(0,229,192,0.25)" }}>
          Continue to SDOH
          <kbd style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,background:"rgba(5,15,30,.3)",borderRadius:4,padding:"0 6px",color:"rgba(5,15,30,.8)" }}>⌘↵</kbd>
        </button>
      </div>
    </div>
  );
}