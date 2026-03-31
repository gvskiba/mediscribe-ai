import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

/* ─── DATA ──────────────────────────────────────── */
const LAB_PANELS = {
  cbc: { name:'Complete Blood Count', labs:[
    {name:'WBC',units:'K/uL',ref:'4.5-11.0',id:'wbc'},{name:'RBC',units:'M/uL',ref:'4.5-5.5',id:'rbc'},
    {name:'Hemoglobin',units:'g/dL',ref:'13.5-17.5',id:'hgb'},{name:'Hematocrit',units:'%',ref:'38-50',id:'hct'},
    {name:'Platelets',units:'K/uL',ref:'150-400',id:'plt'},{name:'MCV',units:'fL',ref:'80-100',id:'mcv'},
    {name:'Neutrophils',units:'%',ref:'40-70',id:'neut'},{name:'Lymphocytes',units:'%',ref:'20-40',id:'lymph'},
  ]},
  bmp: { name:'Basic Metabolic Panel', labs:[
    {name:'Sodium',units:'mEq/L',ref:'136-145',id:'na'},{name:'Potassium',units:'mEq/L',ref:'3.5-5.0',id:'k'},
    {name:'Chloride',units:'mEq/L',ref:'98-106',id:'cl'},{name:'CO2',units:'mEq/L',ref:'22-30',id:'co2'},
    {name:'BUN',units:'mg/dL',ref:'7-20',id:'bun'},{name:'Creatinine',units:'mg/dL',ref:'0.7-1.3',id:'cr'},
    {name:'Glucose',units:'mg/dL',ref:'70-100',id:'glu'},{name:'Calcium',units:'mg/dL',ref:'8.5-10.5',id:'ca'},
  ]},
  cmp: { name:'Comprehensive Metabolic Panel', labs:[
    {name:'AST',units:'U/L',ref:'10-40',id:'ast'},{name:'ALT',units:'U/L',ref:'7-56',id:'alt'},
    {name:'Alk Phos',units:'U/L',ref:'44-147',id:'alkp'},{name:'Bilirubin Total',units:'mg/dL',ref:'0.1-1.2',id:'tbili'},
    {name:'Albumin',units:'g/dL',ref:'3.5-5.0',id:'alb'},{name:'Total Protein',units:'g/dL',ref:'6.0-8.3',id:'tp'},
  ]},
  cardiac: { name:'Cardiac Markers', labs:[
    {name:'Troponin I',units:'ng/mL',ref:'0.00-0.04',id:'trop'},{name:'hs-Troponin',units:'ng/L',ref:'0-14',id:'hstrop'},
    {name:'BNP',units:'pg/mL',ref:'0-100',id:'bnp'},{name:'D-Dimer',units:'ng/mL',ref:'0-500',id:'ddimer'},
    {name:'CK-MB',units:'ng/mL',ref:'0-5',id:'ckmb'},{name:'Lactate',units:'mmol/L',ref:'0.5-2.0',id:'lactate'},
  ]},
  coag: { name:'Coagulation', labs:[
    {name:'PT',units:'sec',ref:'11-13.5',id:'pt'},{name:'INR',units:'',ref:'0.8-1.1',id:'inr'},
    {name:'PTT',units:'sec',ref:'25-35',id:'ptt'},{name:'Fibrinogen',units:'mg/dL',ref:'200-400',id:'fib'},
  ]},
  ua: { name:'Urinalysis', labs:[
    {name:'UA Color',units:'',ref:'Yellow',id:'ua_color'},{name:'UA Clarity',units:'',ref:'Clear',id:'ua_clarity'},
    {name:'UA pH',units:'',ref:'5.0-8.0',id:'ua_ph'},{name:'UA Protein',units:'',ref:'Negative',id:'ua_protein'},
    {name:'UA Glucose',units:'',ref:'Negative',id:'ua_glucose'},{name:'UA Leukocytes',units:'',ref:'Negative',id:'ua_leuk'},
    {name:'UA Nitrites',units:'',ref:'Negative',id:'ua_nit'},{name:'UA Blood',units:'',ref:'Negative',id:'ua_blood'},
  ]},
  misc: { name:'Miscellaneous', labs:[
    {name:'CRP',units:'mg/L',ref:'0-10',id:'crp'},{name:'Procalcitonin',units:'ng/mL',ref:'0-0.1',id:'proCalc'},
    {name:'Lipase',units:'U/L',ref:'0-160',id:'lipase'},{name:'TSH',units:'mIU/L',ref:'0.4-4.0',id:'tsh'},
    {name:'Lactate',units:'mmol/L',ref:'0.5-2.0',id:'lactate2'},{name:'Ammonia',units:'umol/L',ref:'15-45',id:'ammonia'},
    {name:'Ethanol',units:'mg/dL',ref:'0',id:'etoh'},{name:'Acetaminophen',units:'mcg/mL',ref:'10-30',id:'apap'},
  ]},
};

const QA_ITEMS = {
  med:['Aspirin 324mg PO','Nitroglycerin 0.4mg SL','Heparin drip','Morphine 4mg IV','Ketorolac 30mg IV','Ondansetron 4mg IV','NS 1L bolus','LR 1L bolus','Metoprolol 5mg IV','Ceftriaxone 1g IV','Vancomycin 1g IV','Lorazepam 2mg IV'],
  proc:['IV Access (PIV)','Central Line','Arterial Line','Foley Catheter','Intubation','Chest Tube','Lumbar Puncture','Paracentesis','Cardioversion','Splint Application','Laceration Repair','Procedural Sedation'],
  consult:['Cardiology','Pulmonology','GI','Surgery — General','Orthopedics','Neurology','Neurosurgery','Psychiatry','ICU/Critical Care','Hospitalist','Toxicology','Interventional Radiology'],
  note:['Patient re-assessed','Family updated','Patient tolerating PO','Patient ambulating','Discussed risks/benefits with patient','Condition unchanged','Called to bedside — patient worsened','Spoke with PCP'],
};

const EKG_QUICK = ['Normal Sinus Rhythm','Sinus Tachycardia','Sinus Bradycardia','Atrial Fibrillation','Atrial Flutter','SVT','LBBB','RBBB','1st Degree AV Block','3rd Degree AV Block','ST Elevation','ST Depression','T-wave Inversion','Q Waves','LVH','Prolonged QTc','Normal Axis','Left Axis Deviation','PVCs','Ventricular Tachycardia'];

const MDM_LEVELS = ['','Straightforward','Low','Moderate','High'];

/* ─── STYLES ─────────────────────────────────────── */
const S = {
  bg:'#050f1e', panel:'#081628', card:'#0b1e36', up:'#0e2544',
  border:'#1a3555', borderHi:'#2a4f7a',
  blue:'#3b9eff', teal:'#00e5c0', coral:'#ff6b6b', orange:'#ff9f43',
  gold:'#f5c842', purple:'#9b6dff', green:'#3dffa0',
  txt:'#e8f0fe', txt2:'#8aaccc', txt3:'#4a6a8a', txt4:'#2e4a6a',
};

const CSS = `
@keyframes mdm-fadein { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:translateY(0)} }
@keyframes mdm-load { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
@keyframes mdm-toast { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
@keyframes mdm-aiPulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(0,229,192,.4)} 50%{opacity:.8;box-shadow:0 0 0 5px rgba(0,229,192,0)} }

.mdm-section { background:${S.panel}; border:1px solid ${S.border}; border-radius:12px; padding:16px 18px; animation:mdm-fadein .25s ease; }
.mdm-tab-bar { display:flex; gap:2px; background:${S.card}; border:1px solid ${S.border}; border-radius:8px; padding:3px; }
.mdm-tab { padding:6px 16px; border-radius:6px; font-size:12px; font-weight:500; cursor:pointer; color:${S.txt3}; border:none; background:transparent; font-family:'DM Sans',sans-serif; transition:all .2s; }
.mdm-tab:hover { color:${S.txt2}; }
.mdm-tab.active { background:${S.blue}; color:white; font-weight:600; }
.mdm-tab .cnt { font-family:'JetBrains Mono',monospace; font-size:9px; padding:1px 5px; border-radius:10px; background:rgba(255,255,255,.15); margin-left:3px; }
.mdm-tab:not(.active) .cnt { background:${S.up}; color:${S.txt4}; }

.mdm-mode-btn { padding:4px 12px; border-radius:6px; font-size:11px; cursor:pointer; border:1px solid ${S.border}; background:${S.up}; color:${S.txt3}; font-family:'DM Sans',sans-serif; transition:all .2s; display:inline-flex; align-items:center; gap:4px; }
.mdm-mode-btn:hover { border-color:${S.borderHi}; color:${S.txt2}; }
.mdm-mode-btn.active { border-color:rgba(59,158,255,.4); color:${S.blue}; background:rgba(59,158,255,.08); }

.mdm-qa-cat { padding:5px 12px; border-radius:20px; font-size:11px; cursor:pointer; border:1px solid ${S.border}; background:${S.up}; color:${S.txt3}; transition:all .15s; font-family:'DM Sans',sans-serif; display:inline-flex; align-items:center; gap:4px; }
.mdm-qa-cat:hover { border-color:${S.borderHi}; color:${S.txt2}; }
.mdm-qa-cat.active { border-color:rgba(59,158,255,.4); color:${S.blue}; background:rgba(59,158,255,.08); }
.mdm-qa-item { padding:4px 11px; border-radius:6px; font-size:11px; cursor:pointer; border:1px solid ${S.border}; background:${S.card}; color:${S.txt2}; transition:all .15s; font-family:'DM Sans',sans-serif; }
.mdm-qa-item:hover { border-color:${S.borderHi}; color:${S.txt}; background:${S.up}; }

.mdm-tl-entry { position:relative; padding:8px 0 14px; }
.mdm-tl-dot { position:absolute; left:-22px; top:12px; width:12px; height:12px; border-radius:50%; border:2px solid ${S.border}; background:${S.panel}; z-index:1; }
.mdm-tl-dot.med { border-color:${S.teal}; background:rgba(0,229,192,.2); }
.mdm-tl-dot.proc { border-color:${S.purple}; background:rgba(155,109,255,.2); }
.mdm-tl-dot.consult { border-color:${S.gold}; background:rgba(245,200,66,.2); }
.mdm-tl-dot.note { border-color:${S.orange}; background:rgba(255,159,67,.2); }
.mdm-tl-dot.vital { border-color:${S.blue}; background:rgba(59,158,255,.2); }
.mdm-tl-card { background:${S.card}; border:1px solid ${S.border}; border-radius:8px; padding:10px 12px; transition:border-color .15s; }
.mdm-tl-card:hover { border-color:${S.borderHi}; }
.tl-type-med { color:${S.teal}; }
.tl-type-proc { color:${S.purple}; }
.tl-type-consult { color:${S.gold}; }
.tl-type-note { color:${S.orange}; }
.tl-type-vital { color:${S.blue}; }

.mdm-ekg-chip { padding:4px 11px; border-radius:6px; font-size:11px; cursor:pointer; border:1px solid ${S.border}; background:${S.card}; color:${S.txt2}; transition:all .15s; font-family:'DM Sans',sans-serif; }
.mdm-ekg-chip:hover { border-color:${S.borderHi}; }
.mdm-ekg-chip.on { border-color:rgba(61,255,160,.4); color:${S.green}; background:rgba(61,255,160,.06); }

.mdm-vt-mini { background:${S.card}; border:1px solid ${S.border}; border-radius:8px; padding:8px 12px; min-width:90px; flex:1; max-width:130px; }
.mdm-resp-card { background:${S.card}; border:1px solid ${S.border}; border-radius:10px; padding:12px 14px; }

.mdm-assess-pill { padding:6px 14px; border-radius:8px; font-size:12px; cursor:pointer; border:1px solid ${S.border}; background:${S.card}; color:${S.txt3}; transition:all .18s; font-family:'DM Sans',sans-serif; user-select:none; }
.mdm-assess-pill:hover { border-color:${S.borderHi}; color:${S.txt2}; }
.mdm-assess-pill.improved { border-color:rgba(0,229,192,.4); color:${S.teal}; background:rgba(0,229,192,.08); font-weight:600; }
.mdm-assess-pill.worsened { border-color:rgba(255,107,107,.4); color:${S.coral}; background:rgba(255,107,107,.08); font-weight:600; }
.mdm-assess-pill.unchanged { border-color:rgba(245,200,66,.4); color:${S.gold}; background:rgba(245,200,66,.08); font-weight:600; }

.mdm-ai-interp { background:linear-gradient(135deg,rgba(0,229,192,.04),rgba(59,158,255,.04)); border:1px solid rgba(0,229,192,.2); border-radius:10px; padding:14px 16px; animation:mdm-fadein .3s ease; }
.mdm-load-bar { height:3px; background:${S.card}; border-radius:2px; overflow:hidden; margin:8px 0; }
.mdm-load-inner { height:100%; width:30%; background:linear-gradient(90deg,${S.teal},${S.blue}); border-radius:2px; animation:mdm-load 1.2s ease-in-out infinite; }

.mdm-c-lvl { padding:4px 12px; border-radius:6px; font-size:11px; font-weight:500; cursor:pointer; transition:all .2s; border:1px solid transparent; font-family:'JetBrains Mono',monospace; color:${S.txt4}; background:transparent; }
.mdm-c-lvl:hover { color:${S.txt3}; background:${S.up}; }
.mdm-c-lvl.active { border-color:${S.purple}; color:${S.purple}; background:rgba(155,109,255,.1); font-weight:700; }

.mdm-modal-bg { position:fixed; inset:0; background:rgba(5,15,30,.8); z-index:1000; display:flex; align-items:center; justify-content:center; }
.mdm-modal { background:${S.panel}; border:1px solid ${S.border}; border-radius:16px; width:560px; max-height:80vh; overflow-y:auto; padding:24px; }

.mdm-paste-zone { border:2px dashed ${S.border}; border-radius:10px; padding:28px; text-align:center; cursor:pointer; background:rgba(59,158,255,.02); transition:all .2s; }
.mdm-paste-zone:hover { border-color:${S.blue}; background:rgba(59,158,255,.06); }

.mdm-results-table { width:100%; border-collapse:separate; border-spacing:0; }
.mdm-results-table th { font-size:9px; color:${S.txt4}; text-transform:uppercase; letter-spacing:.06em; padding:6px 10px; text-align:left; border-bottom:1px solid ${S.border}; font-weight:600; }
.mdm-results-table td { padding:7px 10px; border-bottom:1px solid rgba(26,53,85,.4); font-size:12px; }
.mdm-results-table tr:hover td { background:rgba(59,158,255,.03); }
.lab-val.normal { color:${S.teal}; font-family:'JetBrains Mono',monospace; font-weight:600; }
.lab-val.high { color:${S.coral}; font-family:'JetBrains Mono',monospace; font-weight:600; }
.lab-val.low { color:${S.blue}; font-family:'JetBrains Mono',monospace; font-weight:600; }
.lab-val.critical { color:${S.coral}; font-family:'JetBrains Mono',monospace; font-weight:600; }
.flag-h { background:rgba(255,107,107,.15); color:${S.coral}; padding:1px 5px; border-radius:3px; font-size:9px; font-weight:700; }
.flag-l { background:rgba(59,158,255,.15); color:${S.blue}; padding:1px 5px; border-radius:3px; font-size:9px; font-weight:700; }
.flag-c { background:rgba(255,107,107,.25); color:${S.coral}; padding:1px 5px; border-radius:3px; font-size:9px; font-weight:700; }

.mdm-field-input { background:${S.up}; border:1px solid ${S.border}; border-radius:6px; padding:7px 10px; color:${S.txt}; font-family:'DM Sans',sans-serif; font-size:13px; outline:none; transition:border-color .15s; width:100%; }
.mdm-field-input:focus { border-color:${S.blue}; }
.mdm-field-input::placeholder { color:${S.txt4}; }
.mdm-field-textarea { background:${S.up}; border:1px solid ${S.border}; border-radius:6px; padding:8px 10px; color:${S.txt}; font-family:'DM Sans',sans-serif; font-size:13px; outline:none; resize:vertical; min-height:50px; width:100%; transition:border-color .15s; line-height:1.5; }
.mdm-field-textarea:focus { border-color:${S.blue}; }
.mdm-field-textarea::placeholder { color:${S.txt4}; }
.mdm-field-select { background:${S.up}; border:1px solid ${S.border}; border-radius:6px; padding:7px 10px; color:${S.txt}; font-family:'DM Sans',sans-serif; font-size:13px; outline:none; cursor:pointer; width:100%; }
.mdm-toast-el { position:fixed; top:20px; right:24px; z-index:9999; background:${S.panel}; border:1px solid rgba(0,229,192,.3); border-radius:10px; padding:10px 18px; font-size:12px; color:${S.teal}; box-shadow:0 8px 30px rgba(0,0,0,.4); font-weight:500; animation:mdm-toast .3s ease; }
`;

/* ─── HELPERS ─────────────────────────────────────── */
function getLabFlag(value, ref) {
  const num = parseFloat(value);
  if (isNaN(num)) {
    const v = value.toLowerCase();
    if (['positive','detected','present'].includes(v)) return 'H';
    return '';
  }
  const parts = ref.split('-');
  if (parts.length !== 2) return '';
  const low = parseFloat(parts[0]), high = parseFloat(parts[1]);
  if (isNaN(low) || isNaN(high)) return '';
  if (num > high * 2) return 'C';
  if (num > high) return 'H';
  if (num < low) return 'L';
  return '';
}

function now() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

/* ─── COMPONENT ──────────────────────────────────── */
export default function MDMTab({ patientName = 'Patient', chiefComplaint = '', vitals = {}, medications = [], allergies = [], rosState = {}, peState = {} }) {
  const [labs, setLabs] = useState({});      // { id: { name, units, ref, value, flag } }
  const [imaging, setImaging] = useState([]);
  const [ekgFindings, setEkgFindings] = useState([]);
  const [ekgText, setEkgText] = useState('');
  const [timeline, setTimeline] = useState([]);
  const [vitalsHistory, setVitalsHistory] = useState(() => {
    if (vitals.bp || vitals.hr) {
      return [{ time:'Arrival', bp: vitals.bp || '—', hr: parseInt(vitals.hr) || 0, rr: parseInt(vitals.rr) || 0, spo2: parseInt(vitals.spo2) || 0, temp: parseFloat(vitals.temp) || 0, pain: parseInt(vitals.pain) || 0, gcs: parseInt(vitals.gcs) || 15 }];
    }
    return [{ time:'Arrival', bp:'158/96', hr:112, rr:18, spo2:98, temp:98.6, pain:7, gcs:15 }];
  });
  const [assessment, setAssessment] = useState(null);
  const [dispo, setDispo] = useState(null);
  const [mdmLevel, setMdmLevel] = useState(3);
  const [respNotes, setRespNotes] = useState('');
  const [notePreview, setNotePreview] = useState('');
  const [showNote, setShowNote] = useState(false);

  // UI state
  const [resultTab, setResultTab] = useState('labs');
  const [labMode, setLabMode] = useState('quick');
  const [activePanel, setActivePanel] = useState('cbc');
  const [qaCategory, setQaCategory] = useState('med');
  const [aiInterp, setAiInterp] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState(null); // 'addEntry' | 'vitals' | 'imaging'
  const [entryType, setEntryType] = useState('med');
  const [entryDesc, setEntryDesc] = useState('');
  const [entryTime, setEntryTime] = useState(now);
  const [pasteText, setPasteText] = useState('');
  const [manualLab, setManualLab] = useState({ name:'', value:'', units:'', ref:'' });
  const [imagingForm, setImagingForm] = useState({ type:'CT', name:'', result:'', status:'Preliminary', time:now() });
  const [vitalsForm, setVitalsForm] = useState({ bpSys:'', bpDia:'', hr:'', rr:'', spo2:'', temp:'', pain:'', gcs:'', time:now() });

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2200); }

  /* ── Labs ── */
  function updateLab(id, name, units, ref, value) {
    setLabs(prev => {
      if (!value.trim()) { const next = {...prev}; delete next[id]; return next; }
      const flag = getLabFlag(value, ref);
      return { ...prev, [id]: { name, units, ref, value, flag } };
    });
  }

  function parsePastedLabs() {
    const lines = pasteText.split('\n');
    let found = 0;
    const shortMap = { wbc:'wbc',rbc:'rbc',hgb:'hgb',hemoglobin:'hgb',hct:'hct',hematocrit:'hct',plt:'plt',platelets:'plt',na:'na',sodium:'na',k:'k',potassium:'k',cl:'cl',co2:'co2',bun:'bun',cr:'cr',creatinine:'cr',glu:'glu',glucose:'glu',ca:'ca',calcium:'ca',ast:'ast',alt:'alt',trop:'trop',troponin:'trop',bnp:'bnp',ddimer:'ddimer',lactate:'lactate',pt:'pt',inr:'inr',ptt:'ptt',crp:'crp',tsh:'tsh',lipase:'lipase' };
    lines.forEach(line => {
      const parts = line.trim().split(/[\s:,|]+/).filter(Boolean);
      for (let i = 0; i < parts.length - 1; i++) {
        const token = parts[i].toLowerCase().replace(/[^a-z0-9]/g,'');
        const mappedId = shortMap[token];
        if (!mappedId) continue;
        const val = parts[i+1];
        if (!val || isNaN(parseFloat(val))) continue;
        Object.values(LAB_PANELS).forEach(panel => {
          panel.labs.forEach(lab => {
            if (lab.id === mappedId) { updateLab(lab.id, lab.name, lab.units, lab.ref, val); found++; }
          });
        });
      }
    });
    showToast(found > 0 ? `✓ Parsed ${found} lab values` : '⚠ Could not parse — try Quick Entry');
  }

  function addManualLab() {
    if (!manualLab.name || !manualLab.value) return;
    const id = 'manual_' + Date.now();
    const flag = getLabFlag(manualLab.value, manualLab.ref);
    setLabs(prev => ({ ...prev, [id]: { ...manualLab, flag } }));
    setManualLab({ name:'', value:'', units:'', ref:'' });
    showToast(`✓ ${manualLab.name} added`);
  }

  /* ── Imaging ── */
  function saveImaging() {
    if (!imagingForm.name) { showToast('⚠ Enter study name'); return; }
    setImaging(prev => [...prev, { id:'img_'+Date.now(), ...imagingForm }]);
    addTimelineEntry('note', imagingForm.time, `📷 ${imagingForm.type}: ${imagingForm.name} — ${imagingForm.status}`);
    setModal(null);
    setImagingForm({ type:'CT', name:'', result:'', status:'Preliminary', time:now() });
    showToast(`✓ ${imagingForm.name} added`);
  }

  /* ── EKG ── */
  function toggleEkgFinding(f) {
    setEkgFindings(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  }

  function saveEkg() {
    const t = ekgText.trim();
    if (t || ekgFindings.length) {
      const combined = ekgFindings.length ? ekgFindings.join(', ') : t;
      addTimelineEntry('note', now(), `💓 EKG: ${combined}`);
      showToast('✓ EKG saved');
    }
  }

  /* ── Timeline ── */
  function addTimelineEntry(type, time, body) {
    setTimeline(prev => [{ id:'tl_'+Date.now(), type, time, body }, ...prev]);
  }

  function addCustomEntry() {
    if (!entryDesc) { showToast('⚠ Enter description'); return; }
    addTimelineEntry(entryType, entryTime, entryDesc);
    setModal(null); setEntryDesc('');
    showToast('✓ Entry added');
  }

  /* ── Vitals ── */
  function addVitals() {
    const { bpSys, bpDia, hr, rr, spo2, temp, pain, gcs, time } = vitalsForm;
    const prev = vitalsHistory.at(-1);
    const entry = {
      time: time || now(),
      bp: bpSys && bpDia ? `${bpSys}/${bpDia}` : prev?.bp || '—',
      hr: parseInt(hr) || prev?.hr, rr: parseInt(rr) || prev?.rr,
      spo2: parseInt(spo2) || prev?.spo2, temp: parseFloat(temp) || prev?.temp,
      pain: !isNaN(parseInt(pain)) ? parseInt(pain) : prev?.pain || 0,
      gcs: parseInt(gcs) || prev?.gcs || 15,
    };
    setVitalsHistory(prev => [...prev, entry]);
    addTimelineEntry('vital', entry.time, `BP ${entry.bp} | HR ${entry.hr} | RR ${entry.rr} | SpO₂ ${entry.spo2}% | T ${entry.temp}°F | Pain ${entry.pain}/10`);
    setModal(null);
    setVitalsForm({ bpSys:'', bpDia:'', hr:'', rr:'', spo2:'', temp:'', pain:'', gcs:'', time:now() });
    showToast('📈 Vitals recorded');
  }

  /* ── AI Interpret ── */
  async function runAI() {
    const labList = Object.values(labs);
    if (!labList.length && !imaging.length && !ekgFindings.length) { showToast('⚠ Add results first'); return; }
    setAiLoading(true); setAiInterp(null);
    const allergyStr = allergies.length ? allergies.join(', ') : 'NKDA';
    const medStr = medications.length ? medications.slice(0, 6).join(', ') : 'None';
    let ctx = `Patient: ${patientName}, CC: ${chiefComplaint || 'Not specified'}, Allergies: ${allergyStr}, Current Meds: ${medStr}\n`;
    if (labList.length) ctx += 'Labs:\n' + labList.map(l => `${l.name}: ${l.value} ${l.units} (ref: ${l.ref})${l.flag ? ' ['+l.flag+']':''}`).join('\n') + '\n';
    if (imaging.length) ctx += 'Imaging:\n' + imaging.map(i => `${i.type} ${i.name}: ${i.result||'Pending'} (${i.status})`).join('\n') + '\n';
    if (ekgFindings.length) ctx += `EKG: ${ekgFindings.join(', ')}\n`;
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI, a clinical decision support system in an emergency medicine EHR. Interpret the following results for this patient. Be concise and clinically actionable. Flag abnormals with severity. Identify clinical significance related to chief complaint. End with 1-3 suggested additional orders prefixed with "ORDER:". Use **bold** for key findings. Under 180 words.\n\n${ctx}`,
      });
      setAiInterp(typeof res === 'string' ? res : JSON.stringify(res));
    } catch { setAiInterp('⚠ Could not reach AI service.'); }
    setAiLoading(false);
  }

  /* ── MDM Auto-calc ── */
  function autoCalcMDM() {
    const labList = Object.values(labs);
    const dataPoints = labList.length + imaging.length + (ekgFindings.length > 0 ? 1 : 0);
    const abnormals = labList.filter(l => l.flag).length;
    let level = 1;
    if (dataPoints >= 6 || abnormals >= 3) level = 3;
    else if (dataPoints >= 3 || abnormals >= 1) level = 2;
    if (imaging.length >= 2 || abnormals >= 4) level = 4;
    setMdmLevel(level);
    showToast(`🧮 MDM Level: ${MDM_LEVELS[level]}`);
  }

  /* ── Generate Note ── */
  function generateNote() {
    const labList = Object.values(labs);
    let note = '';
    if (labList.length) {
      note += 'DATA REVIEWED — LABORATORY:\n';
      const normal = labList.filter(l => !l.flag).map(l => `${l.name} ${l.value}`);
      const abnormal = labList.filter(l => l.flag).map(l => `${l.name} ${l.value} [${l.flag}]`);
      if (normal.length) note += normal.join(', ') + '.\n';
      if (abnormal.length) note += 'ABNORMAL: ' + abnormal.join(', ') + '.\n';
      note += '\n';
    }
    if (imaging.length) {
      note += 'IMAGING:\n';
      imaging.forEach(img => { note += `- ${img.type} ${img.name}: ${img.result || 'Pending'} (${img.status})\n`; });
      note += '\n';
    }
    if (ekgFindings.length || ekgText) note += `EKG: ${ekgFindings.join(', ') || ekgText}\n\n`;
    if (timeline.length) {
      note += 'ED COURSE:\n';
      [...timeline].reverse().forEach(e => { note += `[${e.time}] ${e.body}\n`; });
      note += '\n';
    }
    if (assessment) note += `RESPONSE TO TREATMENT: Patient ${assessment}.\n${respNotes ? respNotes + '\n' : ''}\n`;
    if (dispo) {
      const labels = { discharge:'Discharge home', observe:'Observation unit', admit:'Admit to hospital', transfer:'Transfer to facility', ama:'AMA' };
      note += `DISPOSITION: ${labels[dispo]}\n`;
    }
    note += `\nMDM COMPLEXITY: ${MDM_LEVELS[mdmLevel]}\n`;
    setNotePreview(note);
    setShowNote(true);
  }

  /* ── Computed values ── */
  const labList = Object.values(labs);
  const ekgCount = ekgFindings.length || (ekgText ? 1 : 0);

  /* ── Shared styles ── */
  const box = { background:S.panel, border:`1px solid ${S.border}`, borderRadius:12, padding:'16px 18px', animation:'mdm-fadein .25s ease' };
  const btnGhost = { background:S.up, border:`1px solid ${S.border}`, borderRadius:6, padding:'4px 10px', fontSize:11, color:S.txt2, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", display:'inline-flex', alignItems:'center', gap:4, whiteSpace:'nowrap' };
  const btnPrimary = { background:S.teal, color:S.bg, border:'none', borderRadius:6, padding:'4px 12px', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", display:'inline-flex', alignItems:'center', gap:4 };
  const btnBlue = { background:S.blue, color:'white', border:'none', borderRadius:6, padding:'4px 12px', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" };
  const btnPurple = { background:'rgba(155,109,255,.12)', color:S.purple, border:`1px solid rgba(155,109,255,.3)`, borderRadius:6, padding:'4px 12px', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" };
  const lbl = { fontSize:9, color:S.txt3, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:500 };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14, fontFamily:"'DM Sans',sans-serif" }}>
      <style>{CSS}</style>

      {/* Toast */}
      {toast && <div className="mdm-toast-el">{toast}</div>}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:20 }}>⚖️</span>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:600, color:S.txt }}>Medical Decision Making</div>
          <div style={{ fontSize:12, color:S.txt3, marginTop:1 }}>Results · ED Course · Treatment Response</div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
          <button style={btnGhost} onClick={generateNote}>📄 Preview MDM Note</button>
        </div>
      </div>

      {/* MDM Complexity Bar */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', background:`linear-gradient(90deg,rgba(59,158,255,.04),rgba(155,109,255,.04))`, border:`1px solid ${S.border}`, borderRadius:10, flexWrap:'wrap' }}>
        <span style={{ fontSize:10, color:S.txt3, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600, whiteSpace:'nowrap' }}>MDM Level</span>
        <div style={{ display:'flex', gap:3 }}>
          {[1,2,3,4].map(lvl => (
            <button key={lvl} className={`mdm-c-lvl${mdmLevel === lvl ? ' active' : ''}`} onClick={() => setMdmLevel(lvl)}>
              {['Straightforward','Low','Moderate','High'][lvl-1]}
            </button>
          ))}
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:600, color:S.blue }}>{labList.length + imaging.length + (ekgCount > 0 ? 1 : 0)}</div>
            <div style={{ fontSize:8, color:S.txt4, textTransform:'uppercase' }}>Data Points</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:600, color:S.purple }}>{labList.filter(l => l.flag).length + imaging.length}</div>
            <div style={{ fontSize:8, color:S.txt4, textTransform:'uppercase' }}>Abnormals</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:600, color:S.coral }}>
              {['Low','Low','Mod','Mod','High'][mdmLevel]}
            </div>
            <div style={{ fontSize:8, color:S.txt4, textTransform:'uppercase' }}>Risk</div>
          </div>
          <button style={btnPurple} onClick={autoCalcMDM}>🧮 Auto-Calc</button>
        </div>
      </div>

      {/* ── SECTION 1: RESULTS ── */}
      <div style={box}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
          <span style={{ fontSize:16 }}>🔬</span>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:S.txt }}>Results — Labs, Imaging &amp; EKG</div>
            <div style={{ fontSize:11, color:S.txt3 }}>Enter or paste results for AI interpretation</div>
          </div>
          <button style={{ ...btnPrimary, marginLeft:'auto' }} onClick={runAI} disabled={aiLoading}>
            {aiLoading ? '⏳ Analyzing…' : '🧠 AI Interpret All'}
          </button>
        </div>

        {/* Result Tabs */}
        <div className="mdm-tab-bar" style={{ marginBottom:14 }}>
          {[['labs','🧪 Labs',labList.length],['imaging','📷 Imaging',imaging.length],['ekg','💓 EKG',ekgCount]].map(([id, label, cnt]) => (
            <button key={id} className={`mdm-tab${resultTab === id ? ' active' : ''}`} onClick={() => setResultTab(id)}>
              {label} <span className="cnt">{cnt}</span>
            </button>
          ))}
        </div>

        {/* LABS */}
        {resultTab === 'labs' && (
          <div>
            <div style={{ display:'flex', gap:4, marginBottom:10 }}>
              {[['quick','⚡ Quick Entry'],['paste','📋 Paste'],['manual','✏️ Manual']].map(([m, lbl2]) => (
                <button key={m} className={`mdm-mode-btn${labMode === m ? ' active' : ''}`} onClick={() => setLabMode(m)}>{lbl2}</button>
              ))}
            </div>

            {labMode === 'quick' && (
              <div>
                <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
                  {Object.keys(LAB_PANELS).map(key => (
                    <div key={key} className={`mdm-qa-cat${activePanel === key ? ' active' : ''}`} onClick={() => setActivePanel(key)}>
                      {LAB_PANELS[key].name.split(' ')[0]}
                    </div>
                  ))}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(155px,1fr))', gap:6 }}>
                  {LAB_PANELS[activePanel].labs.map(lab => (
                    <div key={lab.id} style={{ background:S.card, border:`1px solid ${labs[lab.id] ? 'rgba(59,158,255,.3)' : S.border}`, borderRadius:8, padding:'8px 10px' }}>
                      <div style={{ fontSize:10, color:S.txt3, marginBottom:3 }}>{lab.name} <span style={{ color:S.txt4 }}>{lab.units}</span></div>
                      <input className="mdm-field-input" style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, padding:'4px 8px', background:S.up }}
                        placeholder={lab.ref} defaultValue={labs[lab.id]?.value || ''}
                        onBlur={e => updateLab(lab.id, lab.name, lab.units, lab.ref, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {labMode === 'paste' && (
              <div>
                <textarea className="mdm-field-textarea" style={{ minHeight:120, fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}
                  value={pasteText} onChange={e => setPasteText(e.target.value)}
                  placeholder="Paste lab results text here…&#10;Example:&#10;WBC 12.4  Na 138  K 4.1  Cr 1.0  Troponin 0.04" />
                <button style={{ ...btnBlue, marginTop:8 }} onClick={parsePastedLabs}>🔍 Parse &amp; Import</button>
              </div>
            )}

            {labMode === 'manual' && (
              <div style={{ display:'flex', gap:8, alignItems:'flex-end', flexWrap:'wrap' }}>
                {[['name','Lab Name','e.g., Troponin I'],['value','Value','0.04'],['units','Units','ng/mL'],['ref','Reference','0.00-0.04']].map(([k, lbl2, ph]) => (
                  <div key={k} style={{ flex: k === 'name' ? 2 : 1, minWidth:80 }}>
                    <label style={{ ...lbl, display:'block', marginBottom:2 }}>{lbl2}</label>
                    <input className="mdm-field-input" placeholder={ph} value={manualLab[k]} onChange={e => setManualLab(p => ({ ...p, [k]: e.target.value }))} />
                  </div>
                ))}
                <button style={{ ...btnPrimary, height:34 }} onClick={addManualLab}>+ Add</button>
              </div>
            )}

            {/* Results Table */}
            {labList.length > 0 && (
              <div style={{ marginTop:12, maxHeight:300, overflowY:'auto' }}>
                <table className="mdm-results-table">
                  <thead><tr><th>Test</th><th>Result</th><th>Flag</th><th>Reference</th><th>Units</th></tr></thead>
                  <tbody>
                    {labList.map((lab, i) => (
                      <tr key={i}>
                        <td style={{ color:S.txt, fontWeight:500, fontSize:12 }}>{lab.name}</td>
                        <td><span className={`lab-val ${lab.flag === 'C' ? 'critical' : lab.flag === 'H' ? 'high' : lab.flag === 'L' ? 'low' : 'normal'}`}>{lab.value}</span></td>
                        <td>{lab.flag ? <span className={`flag-${lab.flag.toLowerCase()}`}>{lab.flag}</span> : <span style={{ color:S.txt4 }}>—</span>}</td>
                        <td style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:S.txt4 }}>{lab.ref}</td>
                        <td style={{ fontSize:11, color:S.txt4 }}>{lab.units}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* AI Interpretation */}
            {aiLoading && (
              <div className="mdm-ai-interp" style={{ marginTop:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:S.teal, animation:'mdm-aiPulse 2s ease-in-out infinite' }} />
                  <span style={{ fontSize:12, fontWeight:600, color:S.teal }}>Notrya AI Analyzing…</span>
                </div>
                <div className="mdm-load-bar"><div className="mdm-load-inner" /></div>
              </div>
            )}
            {aiInterp && !aiLoading && (
              <div className="mdm-ai-interp" style={{ marginTop:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:S.teal, animation:'mdm-aiPulse 2s ease-in-out infinite' }} />
                  <span style={{ fontSize:12, fontWeight:600, color:S.teal }}>AI Interpretation</span>
                  <button style={{ ...btnGhost, marginLeft:'auto', fontSize:10 }} onClick={() => setAiInterp(null)}>✕ Dismiss</button>
                </div>
                <div style={{ fontSize:12, lineHeight:1.7, color:S.txt2 }}
                  dangerouslySetInnerHTML={{ __html: aiInterp.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong style="color:#e8f0fe">$1</strong>') }} />
              </div>
            )}
          </div>
        )}

        {/* IMAGING */}
        {resultTab === 'imaging' && (
          <div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
              {['X-Ray','CT','Ultrasound','MRI','CTA'].map(t => (
                <button key={t} className="mdm-qa-cat" onClick={() => { setImagingForm(p => ({ ...p, type:t, name:'', time:now() })); setModal('imaging'); }}>{t}</button>
              ))}
            </div>
            {imaging.length === 0
              ? <div style={{ color:S.txt4, fontSize:12, textAlign:'center', padding:'20px 0' }}>No imaging studies yet</div>
              : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:10 }}>
                {imaging.map(img => {
                  const colors = { 'X-Ray':S.blue, 'CT':S.orange, 'CTA':S.coral, 'Ultrasound':S.teal, 'MRI':S.purple };
                  return (
                    <div key={img.id} style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:10, padding:'12px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                        <span style={{ fontSize:10, fontWeight:600, color: colors[img.type] || S.txt3, textTransform:'uppercase' }}>{img.type}</span>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, background:S.up, border:`1px solid ${S.border}`, borderRadius:10, padding:'1px 6px', color:S.txt4 }}>{img.status}</span>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:S.txt4, marginLeft:'auto' }}>{img.time}</span>
                      </div>
                      <div style={{ fontSize:13, fontWeight:500, color:S.txt, marginBottom:6 }}>{img.name}</div>
                      <div style={{ fontSize:11, lineHeight:1.6, color:S.txt3 }}>{img.result || <em style={{ color:S.txt4 }}>No results yet</em>}</div>
                    </div>
                  );
                })}
              </div>
            }
          </div>
        )}

        {/* EKG */}
        {resultTab === 'ekg' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'flex', gap:8, alignItems:'flex-start', flexWrap:'wrap' }}>
              <textarea className="mdm-field-textarea" style={{ flex:1, minWidth:200, minHeight:80, fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}
                value={ekgText} onChange={e => setEkgText(e.target.value)}
                placeholder="Enter EKG interpretation…&#10;e.g., NSR, rate 82, no ST changes" />
              <button style={{ ...btnBlue, marginTop:4 }} onClick={saveEkg}>💾 Save EKG</button>
            </div>
            <div>
              <label style={{ ...lbl, display:'block', marginBottom:4 }}>Quick Findings</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {EKG_QUICK.map(f => (
                  <div key={f} className={`mdm-ekg-chip${ekgFindings.includes(f) ? ' on' : ''}`} onClick={() => toggleEkgFinding(f)}>{f}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 2: ED COURSE ── */}
      <div style={box}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
          <span style={{ fontSize:16 }}>📋</span>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:S.txt }}>ED Course &amp; Management</div>
            <div style={{ fontSize:11, color:S.txt3 }}>Timeline of interventions and clinical events</div>
          </div>
          <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
            <button style={btnGhost} onClick={() => { setModal('vitals'); setVitalsForm(p => ({ ...p, time:now() })); }}>+ New Vitals</button>
            <button style={btnGhost} onClick={() => { setModal('addEntry'); setEntryTime(now()); }}>+ Add Entry</button>
          </div>
        </div>

        {/* Vitals Trend */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:600, color:S.txt2, marginBottom:8 }}>Vital Signs Trend</div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {[
              { label:'BP', fn: v => parseInt(v.bp), isAbn: v => parseInt(v.bp) > 140 },
              { label:'HR', fn: v => v.hr, isAbn: v => v.hr > 100 || v.hr < 60 },
              { label:'SpO₂', fn: v => v.spo2, isAbn: v => v.spo2 < 94 },
              { label:'Pain', fn: v => v.pain, isAbn: v => v.pain >= 7 },
            ].map(({ label, fn, isAbn }) => {
              const latest = vitalsHistory.at(-1);
              const bars = vitalsHistory.map(fn);
              const max = Math.max(...bars, 1);
              const abn = isAbn(latest);
              const dispVal = label === 'BP' ? latest.bp : label === 'SpO₂' ? latest.spo2+'%' : label === 'Pain' ? latest.pain+'/10' : latest[label.toLowerCase()] ?? '—';
              return (
                <div key={label} className="mdm-vt-mini">
                  <div style={{ fontSize:9, color:S.txt4, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:2 }}>{label}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:16, fontWeight:600, color: abn ? S.coral : S.teal }}>{dispVal}</div>
                  <div style={{ display:'flex', alignItems:'flex-end', gap:2, height:20, marginTop:4 }}>
                    {bars.map((b, i) => (
                      <div key={i} style={{ width:6, borderRadius:2, background: (abn && i === bars.length-1) ? S.coral : S.blue, opacity: i === bars.length-1 ? 1 : 0.4, height: `${Math.max(3, (b/max)*20)}px` }} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ height:1, background:S.border, margin:'8px 0' }} />

        {/* Quick Add */}
        <div style={{ marginBottom:12 }}>
          <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:8 }}>
            {[['med','💊 Medications'],['proc','🔧 Procedures'],['consult','📞 Consults'],['note','📝 Notes']].map(([cat, lbl2]) => (
              <div key={cat} className={`mdm-qa-cat${qaCategory === cat ? ' active' : ''}`} onClick={() => setQaCategory(cat)}>{lbl2}</div>
            ))}
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
            {(QA_ITEMS[qaCategory] || []).map(item => (
              <div key={item} className="mdm-qa-item" onClick={() => {
                addTimelineEntry(qaCategory, now(), item);
                showToast(`✓ ${item}`);
              }}>{item}</div>
            ))}
          </div>
        </div>

        <div style={{ height:1, background:S.border, margin:'8px 0' }} />

        {/* Timeline */}
        <div style={{ position:'relative', paddingLeft:28 }}>
          {timeline.length === 0
            ? <div style={{ textAlign:'center', color:S.txt4, fontSize:12, padding:'20px 0' }}>No entries yet — use Quick Add or + Add Entry</div>
            : <>
              <div style={{ position:'absolute', left:10, top:0, bottom:0, width:2, background:S.border }} />
              {timeline.map((entry, i) => (
                <div key={entry.id} className="mdm-tl-entry">
                  <div className={`mdm-tl-dot ${entry.type}`} />
                  <div className="mdm-tl-card">
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:S.txt4 }}>{entry.time}</span>
                      <span className={`tl-type-${entry.type}`} style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                        {{ med:'Medication', proc:'Procedure', consult:'Consult', note:'Note', vital:'Vitals' }[entry.type] || entry.type}
                      </span>
                      <button onClick={() => setTimeline(p => p.filter((_, j) => j !== i))} style={{ marginLeft:'auto', width:20, height:20, borderRadius:4, border:`1px solid ${S.border}`, background:S.up, color:S.txt4, fontSize:10, cursor:'pointer' }}>✕</button>
                    </div>
                    <div style={{ fontSize:12, color:S.txt2, lineHeight:1.5 }}>{entry.body}</div>
                  </div>
                </div>
              ))}
            </>
          }
        </div>
      </div>

      {/* ── SECTION 3: RESPONSE TO TREATMENT ── */}
      <div style={box}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
          <span style={{ fontSize:16 }}>📊</span>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:S.txt }}>Response to Treatment</div>
            <div style={{ fontSize:11, color:S.txt3 }}>Document patient response and clinical trajectory</div>
          </div>
          <span style={{ marginLeft:'auto', fontFamily:"'JetBrains Mono',monospace", fontSize:10, padding:'2px 9px', borderRadius:20, fontWeight:600, background: assessment ? (assessment === 'improved' || assessment === 'resolved' ? 'rgba(0,229,192,.12)' : assessment === 'worsened' ? 'rgba(255,107,107,.15)' : 'rgba(245,200,66,.12)') : 'rgba(59,158,255,.12)', color: assessment ? (assessment === 'improved' || assessment === 'resolved' ? S.teal : assessment === 'worsened' ? S.coral : S.gold) : S.blue, border:`1px solid ${assessment ? (assessment === 'improved' || assessment === 'resolved' ? 'rgba(0,229,192,.3)' : assessment === 'worsened' ? 'rgba(255,107,107,.3)' : 'rgba(245,200,66,.3)') : 'rgba(59,158,255,.3)'}` }}>
            {assessment ? assessment.toUpperCase() : 'PENDING'}
          </span>
        </div>

        {/* Before/After */}
        {vitalsHistory.length >= 2 && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            {[
              { label:'Blood Pressure', before: vitalsHistory[0].bp, after: vitalsHistory.at(-1).bp, beforeN: parseInt(vitalsHistory[0].bp), afterN: parseInt(vitalsHistory.at(-1).bp), lower:true },
              { label:'Heart Rate', before: vitalsHistory[0].hr, after: vitalsHistory.at(-1).hr, beforeN: vitalsHistory[0].hr, afterN: vitalsHistory.at(-1).hr, lower:true },
              { label:'SpO₂', before: vitalsHistory[0].spo2+'%', after: vitalsHistory.at(-1).spo2+'%', beforeN: vitalsHistory[0].spo2, afterN: vitalsHistory.at(-1).spo2, lower:false },
              { label:'Pain Score', before: vitalsHistory[0].pain+'/10', after: vitalsHistory.at(-1).pain+'/10', beforeN: vitalsHistory[0].pain, afterN: vitalsHistory.at(-1).pain, lower:true },
            ].map(c => {
              const delta = c.afterN - c.beforeN;
              let status = 'unchanged';
              if (c.lower) { if (delta < 0) status='improved'; else if (delta > 0) status='worsened'; }
              else { if (delta > 0) status='improved'; else if (delta < 0) status='worsened'; }
              return (
                <div key={c.label} className="mdm-resp-card">
                  <div style={{ fontSize:10, color:S.txt3, textTransform:'uppercase', letterSpacing:'0.04em', fontWeight:600, marginBottom:8 }}>{c.label}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:600, color:S.txt3 }}>{c.before}</span>
                    <span style={{ color:S.txt4, fontSize:16 }}>→</span>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:600, color: status==='improved' ? S.teal : status==='worsened' ? S.coral : S.txt2 }}>{c.after}</span>
                    {delta !== 0 && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, padding:'2px 6px', borderRadius:4, background: status==='improved' ? 'rgba(0,229,192,.12)' : 'rgba(255,107,107,.12)', color: status==='improved' ? S.teal : S.coral }}>{delta > 0 ? '+' : ''}{Math.round(delta*10)/10}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Assessment Pills */}
        <div style={{ marginBottom:12 }}>
          <label style={{ ...lbl, display:'block', marginBottom:6 }}>Overall Response</label>
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            {[['improved','✅ Improved','improved'],['unchanged','➡️ Unchanged','unchanged'],['worsened','⚠️ Worsened','worsened'],['resolved','🎯 Resolved','improved']].map(([val, lbl2, cls]) => (
              <div key={val} className={`mdm-assess-pill${assessment === val ? ' ' + cls : ''}`} onClick={() => setAssessment(val)}>{lbl2}</div>
            ))}
          </div>
        </div>

        <div>
          <label style={{ ...lbl, display:'block', marginBottom:4 }}>Response Notes</label>
          <textarea className="mdm-field-textarea" style={{ minHeight:60 }} value={respNotes} onChange={e => setRespNotes(e.target.value)} placeholder="Document treatment response, reassessment findings, clinical decision rationale…" />
        </div>

        {/* Disposition */}
        <div style={{ marginTop:14 }}>
          <label style={{ ...lbl, display:'block', marginBottom:6 }}>Disposition Leaning</label>
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            {[['discharge','🏠 Discharge'],['observe','👁️ Observation'],['admit','🏥 Admit'],['transfer','🚑 Transfer'],['ama','⚠️ AMA']].map(([val, lbl2]) => (
              <div key={val} className={`mdm-qa-cat${dispo === val ? ' active' : ''}`} onClick={() => setDispo(val)}>{lbl2}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Note Preview */}
      {showNote && (
        <div style={box}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <span style={{ fontSize:16 }}>📄</span>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:S.txt }}>Generated MDM Note</div>
              <div style={{ fontSize:11, color:S.txt3 }}>Auto-generated from your documentation</div>
            </div>
            <button style={{ ...btnGhost, marginLeft:'auto' }} onClick={() => { navigator.clipboard?.writeText(notePreview); showToast('📋 Copied!'); }}>📋 Copy</button>
            <button style={btnGhost} onClick={() => setShowNote(false)}>✕</button>
          </div>
          <pre style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:8, padding:'14px 16px', fontFamily:"'JetBrains Mono',monospace", fontSize:11.5, lineHeight:1.7, color:S.txt2, whiteSpace:'pre-wrap', maxHeight:350, overflowY:'auto' }}>{notePreview}</pre>
        </div>
      )}

      {/* ── MODALS ── */}
      {modal === 'addEntry' && (
        <div className="mdm-modal-bg" onClick={e => { if(e.target === e.currentTarget) setModal(null); }}>
          <div className="mdm-modal">
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:600, color:S.txt, marginBottom:16 }}>Add Timeline Entry</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div>
                <label style={{ ...lbl, display:'block', marginBottom:2 }}>Type</label>
                <select className="mdm-field-select" value={entryType} onChange={e => setEntryType(e.target.value)}>
                  <option value="med">💊 Medication</option><option value="proc">🔧 Procedure</option>
                  <option value="consult">📞 Consult</option><option value="note">📝 Clinical Note</option>
                  <option value="vital">📈 Vitals Re-check</option>
                </select>
              </div>
              <div>
                <label style={{ ...lbl, display:'block', marginBottom:2 }}>Description</label>
                <textarea className="mdm-field-textarea" value={entryDesc} onChange={e => setEntryDesc(e.target.value)} placeholder="Describe the intervention or event…" />
              </div>
              <div style={{ flex:1 }}>
                <label style={{ ...lbl, display:'block', marginBottom:2 }}>Time</label>
                <input type="time" className="mdm-field-input" value={entryTime} onChange={e => setEntryTime(e.target.value)} />
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:20, paddingTop:14, borderTop:`1px solid ${S.border}` }}>
              <button style={btnGhost} onClick={() => setModal(null)}>Cancel</button>
              <button style={btnPrimary} onClick={addCustomEntry}>+ Add Entry</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'vitals' && (
        <div className="mdm-modal-bg" onClick={e => { if(e.target === e.currentTarget) setModal(null); }}>
          <div className="mdm-modal">
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:600, color:S.txt, marginBottom:16 }}>New Vital Signs</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
              {[['bpSys','BP Systolic','120'],['bpDia','BP Diastolic','80'],['hr','Heart Rate','72'],['rr','Resp Rate','16'],['spo2','SpO₂ %','98'],['temp','Temp °F','98.6'],['pain','Pain (0-10)','5'],['gcs','GCS','15'],['time','Time','']].map(([k, lbl2, ph]) => (
                <div key={k}>
                  <label style={{ ...lbl, display:'block', marginBottom:2 }}>{lbl2}</label>
                  <input type={k === 'time' ? 'time' : 'number'} className="mdm-field-input" style={{ fontFamily:"'JetBrains Mono',monospace" }} placeholder={ph} value={vitalsForm[k]} onChange={e => setVitalsForm(p => ({ ...p, [k]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:20, paddingTop:14, borderTop:`1px solid ${S.border}` }}>
              <button style={btnGhost} onClick={() => setModal(null)}>Cancel</button>
              <button style={btnPrimary} onClick={addVitals}>📈 Add Vitals</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'imaging' && (
        <div className="mdm-modal-bg" onClick={e => { if(e.target === e.currentTarget) setModal(null); }}>
          <div className="mdm-modal">
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:600, color:S.txt, marginBottom:16 }}>Add Imaging Study</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ display:'flex', gap:8 }}>
                <div style={{ flex:1 }}>
                  <label style={{ ...lbl, display:'block', marginBottom:2 }}>Study Type</label>
                  <select className="mdm-field-select" value={imagingForm.type} onChange={e => setImagingForm(p => ({ ...p, type:e.target.value }))}>
                    {['X-Ray','CT','CT with Contrast','CTA','Ultrasound','MRI','Fluoroscopy'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ flex:2 }}>
                  <label style={{ ...lbl, display:'block', marginBottom:2 }}>Study Name</label>
                  <input className="mdm-field-input" placeholder="e.g., CT Head without contrast" value={imagingForm.name} onChange={e => setImagingForm(p => ({ ...p, name:e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={{ ...lbl, display:'block', marginBottom:2 }}>Result / Impression</label>
                <textarea className="mdm-field-textarea" style={{ minHeight:100, fontFamily:"'JetBrains Mono',monospace", fontSize:11 }} value={imagingForm.result} onChange={e => setImagingForm(p => ({ ...p, result:e.target.value }))} placeholder="Paste radiology read or type impression…" />
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <div style={{ flex:1 }}>
                  <label style={{ ...lbl, display:'block', marginBottom:2 }}>Status</label>
                  <select className="mdm-field-select" value={imagingForm.status} onChange={e => setImagingForm(p => ({ ...p, status:e.target.value }))}>
                    {['Preliminary','Final','Wet Read','Pending'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ flex:1 }}>
                  <label style={{ ...lbl, display:'block', marginBottom:2 }}>Time</label>
                  <input type="time" className="mdm-field-input" value={imagingForm.time} onChange={e => setImagingForm(p => ({ ...p, time:e.target.value }))} />
                </div>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:20, paddingTop:14, borderTop:`1px solid ${S.border}` }}>
              <button style={btnGhost} onClick={() => setModal(null)}>Cancel</button>
              <button style={btnPrimary} onClick={saveImaging}>💾 Save Study</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}