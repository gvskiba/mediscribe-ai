import React, { useState } from "react";

/* ─── DATA ─────────────────────────────────────────── */
const PMH_CATEGORIES = [
  { id:'cardiac', icon:'❤️', label:'Cardiac', conditions:['Hypertension','Coronary Artery Disease','Myocardial Infarction','CHF — Systolic (HFrEF)','CHF — Diastolic (HFpEF)','Atrial Fibrillation','Atrial Flutter','SVT','Ventricular Tachycardia','Aortic Stenosis','Mitral Regurgitation','Mitral Valve Prolapse','Pericarditis','Endocarditis','Cardiomyopathy — Dilated','Cardiomyopathy — Hypertrophic','Peripheral Artery Disease','Aortic Aneurysm','DVT','Pulmonary Embolism'] },
  { id:'pulm', icon:'🫁', label:'Pulmonary', conditions:['Asthma','COPD — Emphysema','COPD — Chronic Bronchitis','Pulmonary Fibrosis','Pulmonary Hypertension','Obstructive Sleep Apnea','Pleural Effusion','Pneumothorax Hx','Sarcoidosis','Lung Cancer','Cystic Fibrosis','Tuberculosis'] },
  { id:'endo', icon:'🔬', label:'Endocrine', conditions:['Diabetes Type 1','Diabetes Type 2','DKA History','Hypoglycemia History','Hypothyroidism','Hyperthyroidism','Graves Disease','Hashimoto Thyroiditis','Adrenal Insufficiency','Cushing Syndrome','Pheochromocytoma','PCOS','Metabolic Syndrome','Obesity','Hyperlipidemia'] },
  { id:'gi', icon:'🔥', label:'GI / Liver', conditions:['GERD','Peptic Ulcer Disease','Crohn Disease','Ulcerative Colitis','Diverticulosis','Diverticulitis Hx','Celiac Disease','IBS','Cirrhosis','Hepatitis A','Hepatitis B','Hepatitis C','Fatty Liver (NAFLD)','Pancreatitis — Acute Hx','Pancreatitis — Chronic','Cholecystitis Hx','GI Bleed History','Barrett Esophagus'] },
  { id:'renal', icon:'🫘', label:'Renal / GU', conditions:['CKD — Stage 1','CKD — Stage 2','CKD — Stage 3a','CKD — Stage 3b','CKD — Stage 4','CKD — Stage 5','ESRD on Hemodialysis','ESRD on Peritoneal Dialysis','Kidney Transplant','Nephrotic Syndrome','Kidney Stones (Nephrolithiasis)','BPH','Urinary Incontinence','Recurrent UTI'] },
  { id:'neuro', icon:'🧠', label:'Neurologic', conditions:['Stroke / CVA','TIA','Seizure Disorder — Epilepsy','Seizure Disorder — Single Event','Migraine','Cluster Headache','Multiple Sclerosis','Parkinson Disease','Alzheimer Disease','Dementia — Vascular','Dementia — Lewy Body','Peripheral Neuropathy','Myasthenia Gravis','Bell Palsy Hx','Traumatic Brain Injury'] },
  { id:'psych', icon:'🧩', label:'Psychiatric', conditions:['Depression — MDD','Anxiety — GAD','Panic Disorder','PTSD','Bipolar I','Bipolar II','Schizophrenia','Schizoaffective Disorder','OCD','ADHD','Substance Use — Alcohol','Substance Use — Opioid','Substance Use — Stimulant','Substance Use — Cannabis','Eating Disorder — Anorexia','Eating Disorder — Bulimia','Suicidal Ideation History','Suicide Attempt History'] },
  { id:'heme', icon:'🩸', label:'Heme / Onc', conditions:['Anemia — Iron Deficiency','Anemia — B12 Deficiency','Anemia — Chronic Disease','Sickle Cell Disease','Sickle Cell Trait','Thalassemia','Thrombocytopenia','Factor V Leiden','DVT / PE History','Hemophilia','Leukemia','Lymphoma','Breast Cancer','Lung Cancer','Colon Cancer','Prostate Cancer','Melanoma','Cancer — Other'] },
  { id:'msk', icon:'🦴', label:'MSK / Rheum', conditions:['Osteoarthritis','Rheumatoid Arthritis','Gout','Pseudogout','Lupus / SLE','Fibromyalgia','Osteoporosis','Ankylosing Spondylitis','Psoriatic Arthritis','Spinal Stenosis','Herniated Disc','Chronic Low Back Pain','Osteomyelitis Hx'] },
  { id:'id', icon:'🦠', label:'Infectious', conditions:['HIV / AIDS','HIV on ART','Hepatitis B — Chronic','Hepatitis C — Treated','Tuberculosis — Latent','Tuberculosis — Active Hx','MRSA History','C. difficile History','Recurrent Cellulitis','Endocarditis History','Osteomyelitis History','COVID-19 Hx'] },
  { id:'other', icon:'📋', label:'Other', conditions:['Pregnancy','Postpartum','Organ Transplant','Immunosuppressed','Chronic Pain Syndrome','Fibromyalgia','Ehlers-Danlos','Down Syndrome','Developmental Delay','Wheelchair Bound','Bed Bound','Hospice / Palliative'] },
];

const SURG_QUICK = ['Appendectomy','Cholecystectomy','C-Section','Hysterectomy','CABG','PCI/Stent','Pacemaker/ICD','Hip Replacement','Knee Replacement','Back Surgery','Hernia Repair','Tonsillectomy','Thyroidectomy','Colectomy','Mastectomy','Bariatric Surgery'];
const ALLERGY_QUICK = ['Penicillin','Amoxicillin','Sulfa drugs','Codeine','Morphine','NSAIDs','Aspirin','Iodine/Contrast','Latex','Cephalosporins','Fluoroquinolones','ACE Inhibitors','Tetracycline','Vancomycin','Heparin'];
const REACTIONS = ['Rash','Hives','Anaphylaxis','Swelling','SOB','Nausea','GI upset','Itching','Angioedema','Stevens-Johnson','Throat closure','Seizure','Other'];
const MED_DB = ['Metoprolol 25mg','Metoprolol 50mg','Metoprolol XL 100mg','Lisinopril 5mg','Lisinopril 10mg','Lisinopril 20mg','Amlodipine 5mg','Amlodipine 10mg','Losartan 50mg','Losartan 100mg','Hydrochlorothiazide 25mg','Furosemide 20mg','Furosemide 40mg','Aspirin 81mg','Aspirin 325mg','Clopidogrel 75mg','Warfarin 5mg','Apixaban 5mg','Rivaroxaban 20mg','Atorvastatin 40mg','Atorvastatin 80mg','Rosuvastatin 20mg','Metformin 500mg','Metformin 1000mg','Glipizide 5mg','Insulin Glargine','Insulin Lispro','Empagliflozin 10mg','Semaglutide 0.5mg','Omeprazole 20mg','Pantoprazole 40mg','Gabapentin 300mg','Sertraline 50mg','Sertraline 100mg','Escitalopram 10mg','Duloxetine 60mg','Trazodone 50mg','Albuterol inhaler','Fluticasone inhaler','Tiotropium inhaler','Montelukast 10mg','Levothyroxine 75mcg','Levothyroxine 100mcg','Amoxicillin 500mg','Azithromycin 250mg'];
const FHX_CONDS_INIT = ['Heart Disease','Hypertension','Diabetes','Stroke','Cancer','Lung Disease','Kidney Disease','Mental Illness','Substance Abuse','Blood Disorders'];
const FHX_MEMBERS = ['Mother','Father','Sister','Brother','M.Gma','M.Gpa'];
const SHX_ITEMS = [
  { key:'tobacco', label:'Tobacco', ico:'🚬', opts:['Never','Former','Active'], detail:true, ph:'Pack-years, type…' },
  { key:'alcohol', label:'Alcohol', ico:'🍺', opts:['Never','Social','Daily','Heavy','Former'], detail:true, ph:'Drinks/week…' },
  { key:'drugs', label:'Rec Drugs', ico:'💉', opts:['Never','Former','Active'], detail:true, ph:'Substances…' },
  { key:'exercise', label:'Exercise', ico:'🏃', opts:['None','Light','Moderate','Heavy'], detail:false, ph:'' },
  { key:'occupation', label:'Occupation', ico:'💼', opts:[], detail:true, ph:'Job title…' },
  { key:'living', label:'Living', ico:'🏘️', opts:['Alone','With family','Assisted','SNF','Homeless'], detail:false, ph:'' },
  { key:'adv_dir', label:'Advance Dir', ico:'📋', opts:['None','Full Code','DNR','DNI','DNR/DNI','POLST'], detail:false, ph:'' },
];

/* ─── STYLES ───────────────────────────────────────── */
const S = {
  bg:'#050f1e', panel:'#081628', card:'#0b1e36', up:'#0e2544',
  border:'#1a3555', borderHi:'#2a4f7a',
  blue:'#3b9eff', teal:'#00e5c0', gold:'#f5c842', coral:'#ff6b6b', orange:'#ff9f43', purple:'#9b6dff',
  txt:'#e8f0fe', txt2:'#8aaccc', txt3:'#4a6a8a', txt4:'#2e4a6a',
};

const CSS = `
@keyframes meds-fadein { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:translateY(0)} }
.meds-animate { animation: meds-fadein .2s ease; }
.pmh-tab-btn { padding:6px 16px; border-radius:6px; font-size:12px; cursor:pointer; color:${S.txt3}; background:transparent; border:1px solid transparent; font-family:'DM Sans',sans-serif; font-weight:500; transition:all .15s; display:flex; align-items:center; gap:5px; }
.pmh-tab-btn:hover { color:${S.txt2}; }
.pmh-tab-btn.active { background:${S.up}; color:${S.txt}; border-color:${S.border}; }
.pmh-tab-cnt { font-family:'JetBrains Mono',monospace; font-size:10px; background:${S.up}; border-radius:10px; padding:0 5px; color:${S.txt3}; min-width:16px; text-align:center; }
.pmh-tab-btn.active .pmh-tab-cnt { background:rgba(59,158,255,.15); color:${S.blue}; }
.cat-card { display:flex; flex-direction:column; align-items:center; gap:3px; padding:8px 4px; border-radius:8px; cursor:pointer; border:1px solid ${S.border}; background:${S.card}; transition:all .2s; user-select:none; position:relative; }
.cat-card:hover { border-color:${S.borderHi}; background:${S.up}; }
.cat-card.active { border-color:${S.purple}; background:rgba(155,109,255,.06); box-shadow:0 0 10px rgba(155,109,255,.1); }
.sub-chip { display:inline-flex; align-items:center; gap:4px; padding:4px 12px; border-radius:20px; font-size:11px; cursor:pointer; border:1px solid ${S.border}; background:${S.up}; color:${S.txt2}; transition:all .15s; user-select:none; }
.sub-chip:hover { border-color:${S.borderHi}; color:${S.txt}; }
.sub-chip.on { background:rgba(0,229,192,.1); border-color:${S.teal}; color:${S.teal}; }
.pmh-tag { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:8px; font-size:11px; background:rgba(0,229,192,.08); border:1px solid rgba(0,229,192,.2); color:${S.teal}; animation:meds-fadein .2s ease; }
.qc { display:inline-flex; align-items:center; gap:4px; padding:4px 12px; border-radius:20px; font-size:11px; cursor:pointer; border:1px solid ${S.border}; background:${S.up}; color:${S.txt2}; transition:all .15s; user-select:none; }
.qc:hover { border-color:${S.borderHi}; color:${S.txt}; }
.qc.on { background:rgba(0,229,192,.1); border-color:${S.teal}; color:${S.teal}; }
.deny-btn { padding:3px 10px; border-radius:6px; font-size:10px; cursor:pointer; border:1px solid ${S.border}; background:${S.card}; color:${S.txt3}; transition:all .15s; font-family:'DM Sans',sans-serif; }
.deny-btn:hover { border-color:${S.teal}; color:${S.teal}; }
.deny-btn.on { background:rgba(0,229,192,.08); border-color:${S.teal}; color:${S.teal}; }
.add-input { flex:1; background:${S.up}; border:1px solid ${S.border}; border-radius:6px; padding:7px 12px; color:${S.txt}; font-size:13px; outline:none; font-family:'DM Sans',sans-serif; transition:border-color .15s; }
.add-input:focus { border-color:${S.blue}; }
.add-input::placeholder { color:${S.txt4}; }
.item-row { display:flex; align-items:center; gap:8px; padding:6px 10px; background:${S.card}; border:1px solid ${S.border}; border-radius:8px; animation:meds-fadein .2s ease; }
.item-row:hover { border-color:${S.borderHi}; }
.item-remove { width:22px; height:22px; border-radius:4px; border:1px solid ${S.border}; background:transparent; color:${S.txt4}; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:11px; transition:all .15s; flex-shrink:0; }
.item-remove:hover { border-color:${S.coral}; color:${S.coral}; background:rgba(255,107,107,.08); }
.rxn-chip { font-size:9px; padding:1px 7px; border-radius:10px; cursor:pointer; border:1px solid ${S.border}; background:${S.up}; color:${S.txt3}; transition:all .12s; font-family:'JetBrains Mono',monospace; }
.rxn-chip:hover { border-color:${S.coral}; color:${S.coral}; }
.rxn-chip.on { background:rgba(255,107,107,.12); border-color:${S.coral}; color:${S.coral}; }
.fhx-check { width:18px; height:18px; border-radius:4px; border:1px solid ${S.border}; display:flex; align-items:center; justify-content:center; font-size:10px; color:transparent; cursor:pointer; transition:all .15s; }
.fhx-check.on { border-color:${S.teal}; color:${S.teal}; background:rgba(0,229,192,.1); }
.shx-opt { padding:4px 12px; border-radius:20px; font-size:11px; cursor:pointer; border:1px solid ${S.border}; background:${S.up}; color:${S.txt3}; transition:all .15s; font-family:'DM Sans',sans-serif; }
.shx-opt:hover { border-color:${S.borderHi}; color:${S.txt}; }
.shx-opt.on { background:rgba(59,158,255,.12); border-color:${S.blue}; color:${S.blue}; }
.ac-drop { position:absolute; top:calc(100% + 2px); left:0; right:0; background:${S.card}; border:1px solid ${S.borderHi}; border-radius:8px; max-height:180px; overflow-y:auto; z-index:40; box-shadow:0 8px 30px rgba(0,0,0,.4); }
.ac-item { padding:6px 12px; cursor:pointer; font-size:12px; color:${S.txt2}; transition:background .1s; border-bottom:1px solid ${S.border}; }
.ac-item:last-child { border-bottom:none; }
.ac-item:hover { background:${S.up}; color:${S.txt}; }
.paste-area { background:${S.up}; border:1px solid ${S.border}; border-radius:6px; padding:10px 12px; color:${S.txt}; font-family:'DM Sans',sans-serif; font-size:12px; outline:none; resize:vertical; min-height:100px; width:100%; line-height:1.6; transition:border-color .15s; }
.paste-area:focus { border-color:${S.purple}; }
.paste-area::placeholder { color:${S.txt4}; }
`;

/* ─── COMPONENT ────────────────────────────────────── */
export default function MedsTab({ medications, setMedications, allergies: allergiesProp, setAllergies: setAllergiesProp, pmhSelected, setPmhSelected, pmhExtra, setPmhExtra, surgHx, setSurgHx, famHx, setFamHx, socHx, setSocHx, pmhExpanded, setPmhExpanded }) {
  const [activeTab, setActiveTab] = useState('pmh');
  const [activeCat, setActiveCat] = useState(null);
  const [pmhList, setPmhList] = useState([]);
  const [pmhCustomInput, setPmhCustomInput] = useState('');
  const [denyPMH, setDenyPMH] = useState(false);

  const [meds, setMeds] = useState([]);
  const [medSearch, setMedSearch] = useState('');
  const [medDropdown, setMedDropdown] = useState([]);
  const [medPaste, setMedPaste] = useState('');
  const [denyMeds, setDenyMeds] = useState(false);

  const [allergyList, setAllergyList] = useState([]);
  const [allergyInput, setAllergyInput] = useState('');
  const [denyAllergy, setDenyAllergy] = useState(false);

  const [surgList, setSurgList] = useState([]);
  const [surgInput, setSurgInput] = useState('');
  const [denySurg, setDenySurg] = useState(false);

  const [fhxConditions, setFhxConditions] = useState([...FHX_CONDS_INIT]);
  const [fhxState, setFhxState] = useState({});
  const [fhxInput, setFhxInput] = useState('');
  const [denyFHx, setDenyFHx] = useState(false);

  const [shxState, setShxState] = useState({});

  // ── PMH ──
  function togglePMH(c) {
    setPmhList(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
    setDenyPMH(false);
  }
  function addCustomPMH() {
    if (!pmhCustomInput.trim()) return;
    if (!pmhList.includes(pmhCustomInput.trim())) setPmhList(p => [...p, pmhCustomInput.trim()]);
    setPmhCustomInput('');
    setDenyPMH(false);
  }
  function getGroupedPMH() {
    const grouped = {};
    pmhList.forEach(c => {
      const cat = PMH_CATEGORIES.find(cat => cat.conditions.includes(c));
      const k = cat ? cat.label : 'Custom';
      const ico = cat ? cat.icon : '📋';
      if (!grouped[k]) grouped[k] = { icon: ico, items: [] };
      grouped[k].items.push(c);
    });
    return grouped;
  }

  // ── MEDS ──
  function addMed(name, dose = '', freq = '') {
    setMeds(p => [...p, { name, dose, freq }]);
    setDenyMeds(false);
    setMedSearch('');
    setMedDropdown([]);
  }
  function handleMedSearch(v) {
    setMedSearch(v);
    if (v.length < 2) { setMedDropdown([]); return; }
    setMedDropdown(MED_DB.filter(m => m.toLowerCase().includes(v.toLowerCase())).slice(0, 8));
  }
  function parseMedPaste() {
    const lines = medPaste.split('\n').map(l => l.trim()).filter(Boolean);
    lines.forEach(l => {
      const p = l.match(/^(.+?)\s+(\d+\S*)\s*(.*)?$/);
      if (p) addMed(p[1], p[2], p[3] || '');
      else addMed(l);
    });
    setMedPaste('');
  }

  // ── ALLERGIES ──
  function addAllergy(name) {
    if (!allergyList.find(a => a.name === name)) {
      setAllergyList(p => [...p, { name, reactions: [] }]);
      setDenyAllergy(false);
    }
  }
  function toggleRxn(idx, r) {
    setAllergyList(p => p.map((a, i) => i !== idx ? a : {
      ...a, reactions: a.reactions.includes(r) ? a.reactions.filter(x => x !== r) : [...a.reactions, r]
    }));
  }
  function allergyBadge(rxns) {
    if (rxns.some(r => ['Anaphylaxis','Stevens-Johnson','Throat closure'].includes(r))) return { cls:'sev-severe', label:'SEVERE', color:S.coral, bg:'rgba(255,107,107,0.15)', border:'rgba(255,107,107,0.3)' };
    if (rxns.some(r => ['Angioedema','SOB','Swelling'].includes(r))) return { cls:'sev-mod', label:'MODERATE', color:S.orange, bg:'rgba(255,159,67,0.12)', border:'rgba(255,159,67,0.3)' };
    if (rxns.length) return { cls:'sev-mild', label:'MILD', color:S.gold, bg:'rgba(245,200,66,0.12)', border:'rgba(245,200,66,0.3)' };
    return null;
  }

  // ── SURG ──
  function toggleSurg(s) {
    setSurgList(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
    setDenySurg(false);
  }
  function addCustomSurg() {
    if (!surgInput.trim()) return;
    if (!surgList.includes(surgInput.trim())) setSurgList(p => [...p, surgInput.trim()]);
    setSurgInput('');
    setDenySurg(false);
  }

  // ── FHX ──
  function toggleFHx(cond, member) {
    const k = `${cond}||${member}`;
    setFhxState(p => ({ ...p, [k]: !p[k] }));
    setDenyFHx(false);
  }
  function addFhxCond() {
    if (!fhxInput.trim() || fhxConditions.includes(fhxInput.trim())) return;
    setFhxConditions(p => [...p, fhxInput.trim()]);
    setFhxInput('');
  }

  // ── SHX ──
  function setSHx(key, opt) {
    setShxState(p => ({ ...p, [key]: { ...(p[key] || {}), status: (p[key]?.status === opt ? null : opt) } }));
  }
  function setSHxDetail(key, val) {
    setShxState(p => ({ ...p, [key]: { ...(p[key] || {}), detail: val } }));
  }

  const box = { background:S.panel, border:`1px solid ${S.border}`, borderRadius:12, padding:'16px 18px' };
  const secH = { display:'flex', alignItems:'center', gap:10, marginBottom:14 };
  const inp = { background:S.up, border:`1px solid ${S.border}`, borderRadius:6, padding:'4px 8px', color:S.txt, fontSize:11, outline:'none', fontFamily:"'DM Sans',sans-serif" };

  const tabs = [
    { id:'pmh', icon:'🏥', label:'PMH', cnt: pmhList.length },
    { id:'meds', icon:'💊', label:'Medications', cnt: meds.length },
    { id:'allergies', icon:'⚠️', label:'Allergies', cnt: allergyList.length },
    { id:'surg', icon:'🔪', label:'Surgical Hx', cnt: surgList.length },
    { id:'fhx', icon:'👪', label:'Family Hx', cnt: 0 },
    { id:'shx', icon:'🏠', label:'Social Hx', cnt: 0 },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, fontFamily:"'DM Sans',sans-serif" }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:20 }}>💊</span>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:600, color:S.txt }}>Medications &amp; Past Medical History</div>
          <div style={{ fontSize:12, color:S.txt3, marginTop:1 }}>Categorized conditions · Quick-add meds &amp; allergies · Paste med lists</div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display:'flex', gap:2, background:S.card, borderRadius:8, padding:3, border:`1px solid ${S.border}`, width:'fit-content', flexWrap:'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} className={`pmh-tab-btn${activeTab === t.id ? ' active' : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.icon} {t.label}
            <span className="pmh-tab-cnt">{t.cnt || ''}</span>
          </button>
        ))}
      </div>

      {/* ── PMH ── */}
      {activeTab === 'pmh' && (
        <div style={box} className="meds-animate">
          <div style={{ ...secH }}>
            <span style={{ fontSize:16 }}>🏥</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:600, color:S.txt }}>Past Medical History</div>
              <div style={{ fontSize:11, color:S.txt3 }}>Select a body system → tap specific conditions</div>
            </div>
            <button className={`deny-btn${denyPMH ? ' on' : ''}`} onClick={() => { setDenyPMH(p => !p); if (!denyPMH) { setPmhList([]); setActiveCat(null); } }}>✓ No significant PMH</button>
          </div>

          {/* Category grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(90px,1fr))', gap:6, marginBottom:12 }}>
            {PMH_CATEGORIES.map(cat => {
              const cnt = pmhList.filter(p => cat.conditions.includes(p)).length;
              return (
                <div key={cat.id} className={`cat-card${activeCat === cat.id ? ' active' : ''}`} onClick={() => setActiveCat(activeCat === cat.id ? null : cat.id)}>
                  {cnt > 0 && <span style={{ position:'absolute', top:3, right:3, fontFamily:"'JetBrains Mono',monospace", fontSize:8, background:S.teal, color:S.bg, borderRadius:8, padding:'0 4px', fontWeight:700 }}>{cnt}</span>}
                  <span style={{ fontSize:22 }}>{cat.icon}</span>
                  <span style={{ fontSize:9, fontWeight:600, color: activeCat === cat.id ? S.purple : S.txt3, textTransform:'uppercase', letterSpacing:'0.04em', textAlign:'center', lineHeight:1.2 }}>{cat.label}</span>
                </div>
              );
            })}
          </div>

          {/* Sub-conditions */}
          {activeCat && (() => {
            const cat = PMH_CATEGORIES.find(c => c.id === activeCat);
            return (
              <div style={{ marginBottom:12, padding:'12px 14px', background:S.card, border:`1px solid rgba(155,109,255,0.25)`, borderRadius:10 }} className="meds-animate">
                <div style={{ fontSize:10, color:S.purple, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600, marginBottom:8, display:'flex', alignItems:'center', gap:6 }}><span>{cat.icon}</span> {cat.label} Conditions</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                  {cat.conditions.map(c => (
                    <span key={c} className={`sub-chip${pmhList.includes(c) ? ' on' : ''}`} onClick={() => togglePMH(c)}>{c}</span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Add custom */}
          <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:12 }}>
            <input className="add-input" value={pmhCustomInput} onChange={e => setPmhCustomInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomPMH()} placeholder="Type to add any condition not listed above…" />
            <button onClick={addCustomPMH} style={{ background:S.blue, color:'white', border:'none', borderRadius:6, padding:'7px 14px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>+ Add</button>
          </div>

          <div style={{ height:1, background:S.border, margin:'8px 0' }} />
          <div style={{ fontSize:9, color:S.txt4, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600, marginBottom:8 }}>Selected Conditions · <span style={{ color:S.teal }}>{pmhList.length}</span></div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
            {pmhList.length === 0 ? <div style={{ fontSize:11, color:S.txt4, fontStyle:'italic' }}>No conditions selected</div> : Object.entries(getGroupedPMH()).flatMap(([label, data]) =>
              data.items.map(c => (
                <div key={c} className="pmh-tag">
                  <span style={{ fontSize:8, color:S.txt4, textTransform:'uppercase', letterSpacing:'0.04em' }}>{data.icon} {label}</span>
                  <span style={{ color:S.txt, fontWeight:500 }}>{c}</span>
                  <span style={{ cursor:'pointer', color:S.txt4, fontSize:10 }} onClick={() => togglePMH(c)}>✕</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── MEDS ── */}
      {activeTab === 'meds' && (
        <div style={box} className="meds-animate">
          <div style={secH}>
            <span style={{ fontSize:16 }}>💊</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:600, color:S.txt }}>Current Medications</div>
              <div style={{ fontSize:11, color:S.txt3 }}>Type drug name for autocomplete · Or paste an entire med list below</div>
            </div>
            <button className={`deny-btn${denyMeds ? ' on' : ''}`} onClick={() => { setDenyMeds(p => !p); if (!denyMeds) setMeds([]); }}>✓ Takes no medications</button>
          </div>
          <div style={{ position:'relative', display:'flex', gap:6, marginBottom:12 }}>
            <input className="add-input" value={medSearch} onChange={e => handleMedSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && (() => { if (medSearch.trim()) { addMed(medSearch.trim()); } })()} placeholder="Start typing medication name… (e.g. metoprolol, lisinopril)" style={{ flex:1 }} />
            <button onClick={() => { if (medSearch.trim()) addMed(medSearch.trim()); }} style={{ background:S.blue, color:'white', border:'none', borderRadius:6, padding:'7px 14px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>+ Add</button>
            {medDropdown.length > 0 && (
              <div className="ac-drop" style={{ left:0, right:60 }}>
                {medDropdown.map(m => (
                  <div key={m} className="ac-item" onClick={() => { const p = m.match(/^(.+?)\s+(\d+\S*)$/); if (p) addMed(p[1], p[2]); else addMed(m); }}>{m}</div>
                ))}
              </div>
            )}
          </div>
          <div style={{ fontSize:9, color:S.txt4, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600, marginBottom:6 }}>Active Medication List</div>
          <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:12 }}>
            {meds.length === 0 ? <div style={{ fontSize:11, color:S.txt4, fontStyle:'italic' }}>No medications added</div> :
              meds.map((m, i) => (
                <div key={i} className="item-row">
                  <span style={{ fontSize:12, color:S.txt, fontWeight:500, flex:1 }}>{m.name}</span>
                  {m.dose && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:S.txt3 }}>{m.dose}</span>}
                  {m.freq && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:S.txt3 }}>{m.freq}</span>}
                  <button className="item-remove" onClick={() => setMeds(p => p.filter((_, idx) => idx !== i))}>✕</button>
                </div>
              ))}
          </div>
          <div style={{ height:1, background:S.border, margin:'8px 0' }} />
          <div style={{ fontSize:9, color:S.txt4, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600, marginBottom:6 }}>📋 Paste Med List</div>
          <textarea className="paste-area" value={medPaste} onChange={e => setMedPaste(e.target.value)} placeholder={"Paste full medication list from pharmacy printout or EHR export. One per line.\n\nExample:\nMetoprolol 25mg PO BID\nLisinopril 10mg PO daily"} />
          <button onClick={parseMedPaste} style={{ marginTop:8, background:S.blue, color:'white', border:'none', borderRadius:6, padding:'6px 14px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>🤖 Parse &amp; Add Medications</button>
        </div>
      )}

      {/* ── ALLERGIES ── */}
      {activeTab === 'allergies' && (
        <div style={box} className="meds-animate">
          <div style={secH}>
            <span style={{ fontSize:16 }}>⚠️</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:600, color:S.txt }}>Allergies &amp; Adverse Reactions</div>
              <div style={{ fontSize:11, color:S.txt3 }}>Add drug/substance → select reactions → severity auto-classifies</div>
            </div>
            <button className={`deny-btn${denyAllergy ? ' on' : ''}`} onClick={() => { setDenyAllergy(p => !p); if (!denyAllergy) setAllergyList([]); }}>✓ NKDA</button>
          </div>
          <div style={{ fontSize:9, color:S.txt4, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600, marginBottom:6 }}>Common Drug Allergies — Quick Add</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:12 }}>
            {ALLERGY_QUICK.map(a => (
              <span key={a} className={`qc${allergyList.some(x => x.name === a) ? ' on' : ''}`} onClick={() => {
                if (allergyList.some(x => x.name === a)) setAllergyList(p => p.filter(x => x.name !== a));
                else addAllergy(a);
              }}>{a}</span>
            ))}
          </div>
          <div style={{ display:'flex', gap:6, marginBottom:12 }}>
            <input className="add-input" value={allergyInput} onChange={e => setAllergyInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && allergyInput.trim()) { addAllergy(allergyInput.trim()); setAllergyInput(''); } }} placeholder="Type allergen name (drug, food, environmental)…" style={{ flex:1 }} />
            <button onClick={() => { if (allergyInput.trim()) { addAllergy(allergyInput.trim()); setAllergyInput(''); } }} style={{ background:S.blue, color:'white', border:'none', borderRadius:6, padding:'7px 14px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>+ Add</button>
          </div>
          <div style={{ height:1, background:S.border, margin:'8px 0' }} />
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {allergyList.length === 0 ? <div style={{ fontSize:11, color:S.txt4, fontStyle:'italic' }}>No allergies added</div> :
              allergyList.map((a, i) => {
                const badge = allergyBadge(a.reactions);
                return (
                  <div key={i} style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:10, padding:'10px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                      <span style={{ fontSize:14 }}>⚠️</span>
                      <span style={{ fontSize:13, fontWeight:600, color:S.coral, flex:1 }}>{a.name}</span>
                      {badge && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, padding:'1px 6px', borderRadius:8, fontWeight:600, background:badge.bg, color:badge.color, border:`1px solid ${badge.border}` }}>{badge.label}</span>}
                      <button className="item-remove" onClick={() => setAllergyList(p => p.filter((_, idx) => idx !== i))}>✕</button>
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                      {REACTIONS.map(r => (
                        <span key={r} className={`rxn-chip${a.reactions.includes(r) ? ' on' : ''}`} onClick={() => toggleRxn(i, r)}>{r}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── SURGICAL HX ── */}
      {activeTab === 'surg' && (
        <div style={box} className="meds-animate">
          <div style={secH}>
            <span style={{ fontSize:16 }}>🔪</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:600, color:S.txt }}>Surgical History</div>
              <div style={{ fontSize:11, color:S.txt3 }}>Tap common surgeries or type to add</div>
            </div>
            <button className={`deny-btn${denySurg ? ' on' : ''}`} onClick={() => { setDenySurg(p => !p); if (!denySurg) setSurgList([]); }}>✓ No prior surgeries</button>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:12 }}>
            {SURG_QUICK.map(s => (
              <span key={s} className={`qc${surgList.includes(s) ? ' on' : ''}`} onClick={() => toggleSurg(s)}>{s}</span>
            ))}
          </div>
          <div style={{ display:'flex', gap:6, marginBottom:12 }}>
            <input className="add-input" value={surgInput} onChange={e => setSurgInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomSurg()} placeholder="Type surgery name…" style={{ flex:1 }} />
            <button onClick={addCustomSurg} style={{ background:S.blue, color:'white', border:'none', borderRadius:6, padding:'7px 14px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>+ Add</button>
          </div>
          <div style={{ height:1, background:S.border, margin:'8px 0' }} />
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {surgList.length === 0 ? <div style={{ fontSize:11, color:S.txt4, fontStyle:'italic' }}>No surgeries added</div> :
              surgList.map((s, i) => (
                <div key={i} className="item-row">
                  <span style={{ fontSize:12, color:S.txt, fontWeight:500, flex:1 }}>{s}</span>
                  <button className="item-remove" onClick={() => setSurgList(p => p.filter((_, idx) => idx !== i))}>✕</button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── FAMILY HX ── */}
      {activeTab === 'fhx' && (
        <div style={box} className="meds-animate">
          <div style={secH}>
            <span style={{ fontSize:16 }}>👪</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:600, color:S.txt }}>Family History</div>
              <div style={{ fontSize:11, color:S.txt3 }}>Click cells to mark conditions present in family members</div>
            </div>
            <button className={`deny-btn${denyFHx ? ' on' : ''}`} onClick={() => { setDenyFHx(p => !p); if (!denyFHx) setFhxState({}); }}>✓ Non-contributory</button>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', border:`1px solid ${S.border}`, borderRadius:8 }}>
              <thead>
                <tr>
                  <th style={{ fontSize:8, color:S.txt4, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600, padding:'6px 8px', textAlign:'left', background:S.card, borderBottom:`1px solid ${S.border}`, borderRight:`1px solid ${S.border}` }}>Condition</th>
                  {FHX_MEMBERS.map(m => (
                    <th key={m} style={{ fontSize:8, color:S.txt4, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600, padding:'6px 8px', textAlign:'center', background:S.card, borderBottom:`1px solid ${S.border}`, borderRight:`1px solid ${S.border}` }}>{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fhxConditions.map(cond => (
                  <tr key={cond}>
                    <td style={{ fontSize:11, color:S.txt2, padding:'5px 8px', borderBottom:`1px solid rgba(26,53,85,.3)`, borderRight:`1px solid ${S.border}`, background:S.card }}>{cond}</td>
                    {FHX_MEMBERS.map(m => {
                      const k = `${cond}||${m}`;
                      return (
                        <td key={m} onClick={() => toggleFHx(cond, m)} style={{ padding:'4px', textAlign:'center', borderBottom:`1px solid rgba(26,53,85,.3)`, borderRight:`1px solid ${S.border}`, cursor:'pointer', background: fhxState[k] ? 'rgba(0,229,192,.05)' : 'transparent' }}>
                          <div className={`fhx-check${fhxState[k] ? ' on' : ''}`} style={{ margin:'0 auto' }}>{fhxState[k] ? '✓' : ''}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display:'flex', gap:6, marginTop:12 }}>
            <input className="add-input" value={fhxInput} onChange={e => setFhxInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addFhxCond()} placeholder="Add another condition…" style={{ flex:1 }} />
            <button onClick={addFhxCond} style={{ background:S.blue, color:'white', border:'none', borderRadius:6, padding:'7px 14px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>+ Add Row</button>
          </div>
        </div>
      )}

      {/* ── SOCIAL HX ── */}
      {activeTab === 'shx' && (
        <div style={box} className="meds-animate">
          <div style={secH}>
            <span style={{ fontSize:16 }}>🏠</span>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:S.txt }}>Social History</div>
              <div style={{ fontSize:11, color:S.txt3 }}>Toggle status · Add detail where relevant</div>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column' }}>
            {SHX_ITEMS.map((item, idx) => (
              <div key={item.key} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom: idx < SHX_ITEMS.length - 1 ? `1px solid ${S.border}` : 'none' }}>
                <div style={{ width:110, fontSize:12, color:S.txt2, fontWeight:500, flexShrink:0, display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:16 }}>{item.ico}</span>{item.label}
                </div>
                {item.opts.length > 0 && (
                  <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                    {item.opts.map(o => (
                      <span key={o} className={`shx-opt${shxState[item.key]?.status === o ? ' on' : ''}`} onClick={() => setSHx(item.key, o)}>{o}</span>
                    ))}
                  </div>
                )}
                {item.detail && (
                  <input style={{ ...inp, flex:1, minWidth:120 }} placeholder={item.ph} value={shxState[item.key]?.detail || ''} onChange={e => setSHxDetail(item.key, e.target.value)} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}