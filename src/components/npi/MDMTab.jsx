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
    {name:'ESR',units:'mm/hr',ref:'0-20',id:'esr'},{name:'CRP',units:'mg/L',ref:'0-10',id:'crp'},
    {name:'Procalcitonin',units:'ng/mL',ref:'0-0.1',id:'proCalc'},{name:'Lipase',units:'U/L',ref:'0-160',id:'lipase'},
    {name:'Ammonia',units:'umol/L',ref:'15-45',id:'ammonia'},{name:'TSH',units:'mIU/L',ref:'0.4-4.0',id:'tsh'},
    {name:'Ethanol',units:'mg/dL',ref:'0',id:'etoh'},{name:'Acetaminophen',units:'mcg/mL',ref:'10-30',id:'apap'},
  ]},
};

const QA_ITEMS = {
  med: ['Aspirin 324mg PO','Nitroglycerin 0.4mg SL','Heparin drip','Morphine 4mg IV','Ketorolac 30mg IV','Ondansetron 4mg IV','NS 1L bolus','LR 1L bolus','Metoprolol 5mg IV','Lorazepam 2mg IV','Ceftriaxone 1g IV','Azithromycin 500mg IV','Vancomycin 1g IV','Piperacillin-Tazobactam 4.5g IV'],
  proc: ['IV Access (PIV)','Central Line','Arterial Line','Foley Catheter','NG Tube','Intubation','Chest Tube','Lumbar Puncture','Paracentesis','Thoracentesis','Cardioversion','Laceration Repair','I&D','Procedural Sedation'],
  consult: ['Cardiology','Pulmonology','GI','Surgery — General','Orthopedics','Neurology','Neurosurgery','Psychiatry','OB/GYN','Urology','ENT','Toxicology','Interventional Radiology','ICU/Critical Care','Hospitalist'],
  note: ['Patient re-assessed','Family updated','Patient requests pain medication','Patient ambulating','Patient tolerating PO','Patient requesting discharge','Discussed risks/benefits with patient','Condition unchanged','Called to bedside — patient worsened','Spoke with PCP'],
};

const EKG_QUICK = ['Normal Sinus Rhythm','Sinus Tachycardia','Sinus Bradycardia','Atrial Fibrillation','Atrial Flutter','SVT','LBBB','RBBB','1st Degree AV Block','ST Elevation','ST Depression','T-wave Inversion','Q Waves','LVH','Prolonged QTc','Normal Axis','PVCs','Ventricular Tachycardia'];

const MDM_LEVELS = ['Straightforward','Low','Moderate','High'];

/* ─── STYLES ─────────────────────────────────────── */
const S = {
  bg:'#050f1e', panel:'#081628', card:'#0b1e36', up:'#0e2544',
  border:'#1a3555', borderHi:'#2a4f7a',
  blue:'#3b9eff', teal:'#00e5c0', gold:'#f5c842', coral:'#ff6b6b',
  orange:'#ff9f43', purple:'#9b6dff', green:'#3dffa0',
  txt:'#e8f0fe', txt2:'#8aaccc', txt3:'#4a6a8a', txt4:'#2e4a6a',
};

const CSS = `
@keyframes mdm-fadein { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:translateY(0)} }
@keyframes mdm-load { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
@keyframes mdm-toast { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }

.mdm-tab-btn { padding:6px 16px; border-radius:6px; font-size:12px; font-weight:500; cursor:pointer; transition:all .2s; color:${S.txt3}; border:none; background:transparent; font-family:'DM Sans',sans-serif; display:flex; align-items:center; gap:5px; }
.mdm-tab-btn:hover { color:${S.txt2}; }
.mdm-tab-btn.active { background:${S.blue}; color:white; font-weight:600; }
.mdm-tab-cnt { font-family:'JetBrains Mono',monospace; font-size:9px; padding:1px 5px; border-radius:10px; background:rgba(255,255,255,.15); }
.mdm-tab-btn:not(.active) .mdm-tab-cnt { background:${S.up}; color:${S.txt4}; }

.mdm-res-mode { padding:4px 12px; border-radius:6px; font-size:11px; font-weight:500; cursor:pointer; transition:all .2s; color:${S.txt3}; border:1px solid ${S.border}; background:${S.up}; font-family:'DM Sans',sans-serif; display:flex; align-items:center; gap:4px; }
.mdm-res-mode:hover { border-color:${S.borderHi}; color:${S.txt2}; }
.mdm-res-mode.active { border-color:rgba(59,158,255,.4); color:${S.blue}; background:rgba(59,158,255,.08); }

.mdm-qa-cat { padding:5px 12px; border-radius:20px; font-size:11px; cursor:pointer; border:1px solid ${S.border}; background:${S.up}; color:${S.txt3}; transition:all .15s; user-select:none; font-family:'DM Sans',sans-serif; display:flex; align-items:center; gap:4px; }
.mdm-qa-cat:hover { border-color:${S.borderHi}; color:${S.txt2}; }
.mdm-qa-cat.active { border-color:rgba(59,158,255,.4); color:${S.blue}; background:rgba(59,158,255,.08); }

.mdm-qa-item { padding:4px 11px; border-radius:6px; font-size:11px; cursor:pointer; border:1px solid ${S.border}; background:${S.card}; color:${S.txt2}; transition:all .15s; font-family:'DM Sans',sans-serif; }
.mdm-qa-item:hover { border-color:${S.borderHi}; color:${S.txt}; background:${S.up}; }

.mdm-assess-pill { padding:6px 14px; border-radius:8px; font-size:12px; cursor:pointer; border:1px solid ${S.border}; background:${S.card}; color:${S.txt3}; transition:all .18s; font-family:'DM Sans',sans-serif; user-select:none; }
.mdm-assess-pill:hover { border-color:${S.borderHi}; color:${S.txt2}; }
.mdm-assess-pill.improved { border-color:rgba(0,229,192,.4); color:${S.teal}; background:rgba(0,229,192,.08); }
.mdm-assess-pill.unchanged { border-color:rgba(245,200,66,.4); color:${S.gold}; background:rgba(245,200,66,.08); }
.mdm-assess-pill.worsened { border-color:rgba(255,107,107,.4); color:${S.coral}; background:rgba(255,107,107,.08); }

.mdm-tl-dot { position:absolute; left:-22px; top:12px; width:12px; height:12px; border-radius:50%; border:2px solid ${S.border}; background:${S.panel}; z-index:1; }
.mdm-tl-dot.med { border-color:${S.teal}; background:rgba(0,229,192,.2); }
.mdm-tl-dot.proc { border-color:${S.purple}; background:rgba(155,109,255,.2); }
.mdm-tl-dot.consult { border-color:${S.gold}; background:rgba(245,200,66,.2); }
.mdm-tl-dot.note { border-color:${S.orange}; background:rgba(255,159,67,.2); }
.mdm-tl-dot.vital { border-color:${S.blue}; background:rgba(59,158,255,.2); }
.mdm-tl-dot.resp { border-color:${S.green}; background:rgba(61,255,160,.2); }

.mdm-ekg-chip { padding:4px 11px; border-radius:6px; font-size:11px; cursor:pointer; border:1px solid ${S.border}; background:${S.card}; color:${S.txt2}; transition:all .15s; font-family:'DM Sans',sans-serif; }
.mdm-ekg-chip:hover { border-color:${S.borderHi}; color:${S.txt}; }
.mdm-ekg-chip.on { border-color:rgba(61,255,160,.4); color:${S.green}; background:rgba(61,255,160,.06); }

.mdm-ai-interp { background:linear-gradient(135deg,rgba(0,229,192,.04) 0%,rgba(59,158,255,.04) 100%); border:1px solid rgba(0,229,192,.2); border-radius:10px; padding:14px 16px; animation:mdm-fadein .3s ease; }
.mdm-loading-bar { height:3px; background:${S.card}; border-radius:2px; overflow:hidden; margin:8px 0; }
.mdm-loading-inner { height:100%; width:30%; background:linear-gradient(90deg,${S.teal},${S.blue}); border-radius:2px; animation:mdm-load 1.2s ease-in-out infinite; }

.mdm-modal-overlay { position:fixed; inset:0; background:rgba(5,15,30,.8); z-index:1000; display:flex; align-items:center; justify-content:center; opacity:0; pointer-events:none; transition:opacity .2s; }
.mdm-modal-overlay.open { opacity:1; pointer-events:auto; }
.mdm-modal { background:${S.panel}; border:1px solid ${S.border}; border-radius:16px; width:520px; max-height:80vh; overflow-y:auto; padding:24px; transform:translateY(10px) scale(.97); transition:transform .3s cubic-bezier(.34,1.56,.64,1); }
.mdm-modal-overlay.open .mdm-modal { transform:translateY(0) scale(1); }

.mdm-toast { position:fixed; top:20px; right:24px; z-index:9999; background:${S.panel}; border:1px solid rgba(0,229,192,.3); border-radius:10px; padding:10px 18px; font-size:12px; color:${S.teal}; box-shadow:0 8px 30px rgba(0,0,0,.4); font-weight:500; animation:mdm-toast .3s ease; font-family:'DM Sans',sans-serif; }

.mdm-imaging-card { background:${S.card}; border:1px solid ${S.border}; border-radius:10px; padding:12px 14px; transition:all .2s; }
.mdm-imaging-card:hover { border-color:${S.borderHi}; }

.mdm-c-lvl { padding:4px 12px; border-radius:6px; font-size:11px; font-weight:500; cursor:pointer; transition:all .2s; border:1px solid transparent; font-family:'JetBrains Mono',monospace; color:${S.txt4}; background:transparent; }
.mdm-c-lvl:hover { color:${S.txt3}; background:${S.up}; }
.mdm-c-lvl.active { border-color:${S.purple}; color:${S.purple}; background:rgba(155,109,255,.1); font-weight:700; }

.mdm-dispo-btn { padding:5px 12px; border-radius:20px; font-size:11px; cursor:pointer; border:1px solid ${S.border}; background:${S.up}; color:${S.txt3}; transition:all .15s; user-select:none; font-family:'DM Sans',sans-serif; display:flex; align-items:center; gap:4px; }
.mdm-dispo-btn:hover { border-color:${S.borderHi}; color:${S.txt2}; }
.mdm-dispo-btn.active { border-color:rgba(59,158,255,.4); color:${S.blue}; background:rgba(59,158,255,.08); }

.mdm-field-input { background:${S.up}; border:1px solid ${S.border}; border-radius:6px; padding:7px 10px; color:${S.txt}; font-family:'DM Sans',sans-serif; font-size:13px; outline:none; transition:border-color .15s; width:100%; }
.mdm-field-input:focus { border-color:${S.blue}; }
.mdm-field-input::placeholder { color:${S.txt4}; }
.mdm-field-textarea { background:${S.up}; border:1px solid ${S.border}; border-radius:6px; padding:8px 10px; color:${S.txt}; font-family:'DM Sans',sans-serif; font-size:13px; outline:none; resize:vertical; min-height:60px; width:100%; transition:border-color .15s; line-height:1.5; }
.mdm-field-textarea:focus { border-color:${S.blue}; }
.mdm-field-textarea::placeholder { color:${S.txt4}; }
.mdm-field-select { background:${S.up}; border:1px solid ${S.border}; border-radius:6px; padding:7px 10px; color:${S.txt}; font-family:'DM Sans',sans-serif; font-size:13px; outline:none; cursor:pointer; width:100%; }
`;

function getLabFlag(value, ref) {
  const num = parseFloat(value);
  if (isNaN(num)) {
    const v = value.toLowerCase();
    if (v === 'positive' || v === 'detected' || v === 'present') return 'H';
    return '';
  }
  const parts = ref.split('-');
  if (parts.length !== 2) return '';
  const lo = parseFloat(parts[0]), hi = parseFloat(parts[1]);
  if (isNaN(lo) || isNaN(hi)) return '';
  if (num > hi * 2) return 'C';
  if (num > hi) return 'H';
  if (num < lo) return 'L';
  return '';
}

export default function MDMTab({ patientName = 'Patient', chiefComplaint = '', vitals = {} }) {
  const [labs, setLabs] = useState([]);
  const [imaging, setImaging] = useState([]);
  const [ekgs, setEkgs] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [vitalsHistory, setVitalsHistory] = useState([{time:'Arrival',bp:'158/96',hr:112,rr:18,spo2:98,temp:98.6,pain:7,gcs:15}]);
  const [assessment, setAssessment] = useState(null);
  const [dispo, setDispo] = useState(null);
  const [mdmLevel, setMdmLevel] = useState(2);
  const [toast, setToast] = useState('');

  // Result tabs
  const [resultTab, setResultTab] = useState('labs');
  const [labMode, setLabMode] = useState('quick');
  const [activePanel, setActivePanel] = useState('cbc');
  const [labValues, setLabValues] = useState({});
  const [ekgText, setEkgText] = useState('');
  const [labPasteText, setLabPasteText] = useState('');

  // Timeline
  const [qaCat, setQaCat] = useState('med');

  // Modals
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showImagingModal, setShowImagingModal] = useState(false);
  const [entryType, setEntryType] = useState('med');
  const [entryDesc, setEntryDesc] = useState('');
  const [entryTime, setEntryTime] = useState('');
  const [imgType, setImgType] = useState('CT');
  const [imgName, setImgName] = useState('');
  const [imgResult, setImgResult] = useState('');
  const [imgStatus, setImgStatus] = useState('Final');
  const [imgTime, setImgTime] = useState('');
  const [newV, setNewV] = useState({bpSys:'',bpDia:'',hr:'',rr:'',spo2:'',temp:'',pain:'',gcs:'',time:''});

  // AI interp
  const [aiInterp, setAiInterp] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Note preview
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState('');

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2200); }

  function now() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  // ── Labs ──
  function updateLabValue(id, name, units, ref, value) {
    if (!value.trim()) {
      setLabs(prev => prev.filter(l => l.id !== id));
      setLabValues(prev => { const n = {...prev}; delete n[id]; return n; });
    } else {
      const flag = getLabFlag(value, ref);
      setLabValues(prev => ({...prev, [id]: value}));
      setLabs(prev => {
        const idx = prev.findIndex(l => l.id === id);
        if (idx >= 0) return prev.map(l => l.id === id ? {...l, value, flag} : l);
        return [...prev, {id, name, units, ref, value, flag}];
      });
    }
  }

  function parsePastedLabs() {
    const lines = labPasteText.split('\n');
    let found = 0;
    lines.forEach(line => {
      const parts = line.trim().split(/[\s:]+/).filter(Boolean);
      for (let i = 0; i < parts.length - 1; i++) {
        const token = parts[i].toLowerCase();
        const shortcuts = {wbc:'wbc',hgb:'hgb',hct:'hct',plt:'plt',na:'na',k:'k',cr:'cr',bun:'bun',glu:'glu',trop:'trop',bnp:'bnp',inr:'inr',pt:'pt',ptt:'ptt',lactate:'lactate',ddimer:'ddimer'};
        const matchId = shortcuts[token];
        if (matchId) {
          Object.values(LAB_PANELS).forEach(panel => {
            const lab = panel.labs.find(l => l.id === matchId);
            if (lab) {
              const val = parts[i+1];
              if (val && !isNaN(parseFloat(val))) {
                updateLabValue(lab.id, lab.name, lab.units, lab.ref, val);
                found++;
              }
            }
          });
        }
      }
    });
    showToast(found > 0 ? `✓ Parsed ${found} lab values` : '⚠ Could not parse — try Quick Entry');
  }

  // ── Imaging ──
  function saveImaging() {
    if (!imgName.trim()) { showToast('⚠ Enter study name'); return; }
    const entry = {id:'img_'+Date.now(), type:imgType, name:imgName, result:imgResult, status:imgStatus, time:imgTime || now()};
    setImaging(prev => [...prev, entry]);
    addTimelineEntry('note', entry.time, `📷 ${imgType}: ${imgName} — ${imgStatus}`);
    setShowImagingModal(false);
    setImgName(''); setImgResult('');
    showToast(`✓ ${imgName} added`);
  }

  // ── EKG ──
  function toggleEKG(f) {
    setEkgs(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  }
  function saveEKG() {
    const text = ekgText.trim() || ekgs.join(', ');
    if (text) {
      addTimelineEntry('note', now(), `💓 EKG: ${text}`);
      showToast('✓ EKG interpretation saved');
    }
  }

  // ── Timeline ──
  function addTimelineEntry(type, time, body) {
    setTimeline(prev => [{id:'tl_'+Date.now(), type, time: time || now(), body}, ...prev]);
  }

  function addCustomEntry() {
    if (!entryDesc.trim()) { showToast('⚠ Enter a description'); return; }
    addTimelineEntry(entryType, entryTime || now(), entryDesc);
    setShowAddEntry(false);
    setEntryDesc('');
    showToast('✓ Entry added');
  }

  function addVitals() {
    const sys = newV.bpSys, dia = newV.bpDia;
    const entry = {
      time: newV.time || now(),
      bp: sys && dia ? `${sys}/${dia}` : vitalsHistory.at(-1)?.bp || '—',
      hr: parseInt(newV.hr) || vitalsHistory.at(-1)?.hr,
      rr: parseInt(newV.rr) || vitalsHistory.at(-1)?.rr,
      spo2: parseInt(newV.spo2) || vitalsHistory.at(-1)?.spo2,
      temp: parseFloat(newV.temp) || vitalsHistory.at(-1)?.temp,
      pain: newV.pain !== '' ? parseInt(newV.pain) : vitalsHistory.at(-1)?.pain,
      gcs: parseInt(newV.gcs) || vitalsHistory.at(-1)?.gcs || 15,
    };
    setVitalsHistory(prev => [...prev, entry]);
    addTimelineEntry('vital', entry.time, `BP ${entry.bp} | HR ${entry.hr} | RR ${entry.rr} | SpO₂ ${entry.spo2}% | T ${entry.temp}°F | Pain ${entry.pain}/10`);
    setShowVitalsModal(false);
    setNewV({bpSys:'',bpDia:'',hr:'',rr:'',spo2:'',temp:'',pain:'',gcs:'',time:''});
    showToast('📈 Vitals recorded');
  }

  // ── AI Interpretation ──
  async function runAIInterp() {
    if (labs.length === 0 && imaging.length === 0 && ekgs.length === 0) { showToast('⚠ Enter some results first'); return; }
    setAiLoading(true);
    let ctx = `Patient: ${patientName}, CC: ${chiefComplaint || 'Unknown'}\n\n`;
    if (labs.length) { ctx += 'LABS:\n'; labs.forEach(l => { ctx += `${l.name}: ${l.value} ${l.units} (ref: ${l.ref})${l.flag?' ['+l.flag+']':''}\n`; }); }
    if (imaging.length) { ctx += '\nIMAGING:\n'; imaging.forEach(i => { ctx += `${i.type} ${i.name}: ${i.result||'Pending'} (${i.status})\n`; }); }
    if (ekgs.length) ctx += `\nEKG: ${ekgs.join(', ')}\n`;
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical AI assistant in an ED EHR. Interpret the following results for this patient.\n\n${ctx}\n\nProvide:\n1. Key findings (flag abnormals)\n2. Clinical significance for the chief complaint\n3. Any suggested additional orders (prefix with "ORDER:")\n\nBe concise and clinically actionable. Under 200 words.`,
      });
      const text = typeof res === 'string' ? res : JSON.stringify(res);
      const orders = [];
      const cleanText = text.split('\n').filter(l => {
        if (l.trim().startsWith('ORDER:')) { orders.push(l.replace('ORDER:','').trim()); return false; }
        return true;
      }).join('\n');
      setAiInterp({ text: cleanText, orders });
    } catch {
      setAiInterp({ text: '⚠ Could not reach AI service.', orders: [] });
    }
    setAiLoading(false);
  }

  // ── MDM Note ──
  function generateNote() {
    let lines = [];
    if (labs.length) {
      lines.push('DATA REVIEWED:');
      const normal = labs.filter(l => !l.flag).map(l => `${l.name} ${l.value}`);
      const abnormal = labs.filter(l => l.flag).map(l => `${l.name} ${l.value} [${l.flag}]`);
      if (normal.length) lines.push('Labs: ' + normal.join(', '));
      if (abnormal.length) lines.push('ABNORMAL: ' + abnormal.join(', '));
      lines.push('');
    }
    if (imaging.length) { lines.push('Imaging:'); imaging.forEach(i => { lines.push(`- ${i.type} ${i.name}: ${i.result||'Pending'} (${i.status})`); }); lines.push(''); }
    if (ekgs.length) { lines.push(`EKG: ${ekgs.join(', ')}`); lines.push(''); }
    if (timeline.length) { lines.push('ED COURSE:'); [...timeline].reverse().forEach(e => { lines.push(`[${e.time}] ${e.body}`); }); lines.push(''); }
    if (assessment) { lines.push(`RESPONSE TO TREATMENT: Patient ${assessment}.`); lines.push(''); }
    if (dispo) { const dl = {discharge:'Discharge home',observe:'Observation unit',admit:'Admit to hospital',transfer:'Transfer',ama:'AMA'}; lines.push(`DISPOSITION: ${dl[dispo]}`); }
    lines.push(`\nMDM COMPLEXITY: ${MDM_LEVELS[mdmLevel]}`);
    setNoteText(lines.join('\n'));
    setShowNote(true);
  }

  // ── Counts ──
  const labAbn = labs.filter(l => l.flag).length;
  const totalDataPts = labs.length + imaging.length + (ekgs.length > 0 ? 1 : 0);

  const box = {background:S.panel, border:`1px solid ${S.border}`, borderRadius:12, padding:'16px 18px'};
  const btnGhost = {background:S.up, border:`1px solid ${S.border}`, borderRadius:6, padding:'4px 10px', fontSize:11, color:S.txt2, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", display:'inline-flex', alignItems:'center', gap:4, whiteSpace:'nowrap'};
  const btnPrimary = {background:S.teal, color:S.bg, border:'none', borderRadius:6, padding:'4px 12px', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", display:'inline-flex', alignItems:'center', gap:4};
  const btnPurple = {background:'rgba(155,109,255,.12)', color:S.purple, border:`1px solid rgba(155,109,255,.3)`, borderRadius:6, padding:'4px 12px', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif"};
  const lbl = {fontSize:9, color:S.txt3, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:500, display:'block', marginBottom:4};

  return (
    <div style={{display:'flex', flexDirection:'column', gap:14, fontFamily:"'DM Sans',sans-serif"}}>
      <style>{CSS}</style>
      {toast && <div className="mdm-toast">{toast}</div>}

      {/* Header */}
      <div style={{display:'flex', alignItems:'center', gap:10}}>
        <span style={{fontSize:20}}>⚖️</span>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:600, color:S.txt}}>Medical Decision Making</div>
          <div style={{fontSize:12, color:S.txt3, marginTop:1}}>Results interpretation, ED course, and treatment response</div>
        </div>
        <div style={{marginLeft:'auto', display:'flex', gap:6}}>
          <button style={btnGhost} onClick={generateNote}>📄 Preview MDM Note</button>
        </div>
      </div>

      {/* MDM Complexity Bar */}
      <div style={{...box, background:'linear-gradient(90deg,rgba(59,158,255,.04) 0%,rgba(155,109,255,.04) 100%)', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap'}}>
        <span style={{fontSize:10, color:S.txt3, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600, whiteSpace:'nowrap'}}>MDM Level</span>
        <div style={{display:'flex', gap:3}}>
          {MDM_LEVELS.map((l, i) => (
            <button key={l} className={`mdm-c-lvl${mdmLevel === i ? ' active' : ''}`} onClick={() => setMdmLevel(i)}>{l}</button>
          ))}
        </div>
        <div style={{marginLeft:'auto', display:'flex', gap:16, alignItems:'center'}}>
          <div style={{display:'flex', gap:14}}>
            {[{val:totalDataPts, lbl:'Data Points', color:S.blue},{val:Math.max(1, Math.ceil(labAbn/2)), lbl:'Diagnoses', color:S.purple},{val:['Low','Low','Mod','Mod','High'][mdmLevel+1]||'Mod', lbl:'Risk', color:S.coral}].map(m => (
              <div key={m.lbl} style={{display:'flex', flexDirection:'column', alignItems:'center', gap:1}}>
                <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:600, color:m.color}}>{m.val}</span>
                <span style={{fontSize:8, color:S.txt4, textTransform:'uppercase', letterSpacing:'0.04em'}}>{m.lbl}</span>
              </div>
            ))}
          </div>
          <button style={btnPurple} onClick={() => { const l = Math.min(3, Math.floor(totalDataPts/2)); setMdmLevel(l); showToast(`🧮 MDM: ${MDM_LEVELS[l]}`); }}>🧮 Auto-Calculate</button>
        </div>
      </div>

      {/* ── SECTION 1: RESULTS ── */}
      <div style={box}>
        <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:14}}>
          <span style={{fontSize:16}}>🔬</span>
          <div>
            <div style={{fontSize:14, fontWeight:600, color:S.txt}}>Results — Labs, Imaging & EKG</div>
            <div style={{fontSize:11, color:S.txt3}}>Enter, paste, or add results for AI interpretation</div>
          </div>
          <button style={{...btnPrimary, marginLeft:'auto'}} onClick={runAIInterp} disabled={aiLoading}>
            {aiLoading ? '⏳ Interpreting…' : '🧠 AI Interpret All'}
          </button>
        </div>

        {/* Result Tabs */}
        <div style={{display:'flex', gap:2, background:S.card, border:`1px solid ${S.border}`, borderRadius:8, padding:3, width:'fit-content', marginBottom:14}}>
          {[['labs','🧪 Labs',labs.length],['imaging','📷 Imaging',imaging.length],['ekg','💓 EKG',ekgs.length]].map(([t,lbl2,cnt]) => (
            <button key={t} className={`mdm-tab-btn${resultTab===t?' active':''}`} onClick={() => setResultTab(t)}>
              {lbl2} <span className="mdm-tab-cnt">{cnt}</span>
            </button>
          ))}
        </div>

        {/* LABS */}
        {resultTab === 'labs' && (
          <div>
            <div style={{display:'flex', gap:4, marginBottom:10, flexWrap:'wrap'}}>
              {[['quick','⚡ Quick Entry'],['paste','📋 Paste'],['manual','✏️ Manual']].map(([m,lbl2]) => (
                <div key={m} className={`mdm-res-mode${labMode===m?' active':''}`} onClick={() => setLabMode(m)}>{lbl2}</div>
              ))}
            </div>

            {labMode === 'quick' && (
              <div>
                <div style={{display:'flex', gap:5, flexWrap:'wrap', marginBottom:10}}>
                  {Object.entries(LAB_PANELS).map(([k, p]) => (
                    <div key={k} className={`mdm-qa-cat${activePanel===k?' active':''}`} onClick={() => setActivePanel(k)}>{p.name.split(' ')[0]}</div>
                  ))}
                </div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:6, maxHeight:280, overflowY:'auto'}}>
                  {LAB_PANELS[activePanel].labs.map(lab => (
                    <div key={lab.id} style={{background:S.card, border:`1px solid ${S.border}`, borderRadius:8, padding:'8px 10px'}}>
                      <div style={{fontSize:10, color:S.txt3, marginBottom:3}}>{lab.name} <span style={{color:S.txt4}}>{lab.units}</span></div>
                      <input type="text" className="mdm-field-input" style={{fontFamily:"'JetBrains Mono',monospace", fontSize:13, padding:'4px 8px', background:S.up}}
                        placeholder={lab.ref} value={labValues[lab.id] || ''}
                        onChange={e => updateLabValue(lab.id, lab.name, lab.units, lab.ref, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {labMode === 'paste' && (
              <div>
                <textarea className="mdm-field-textarea" style={{minHeight:100, fontFamily:"'JetBrains Mono',monospace", fontSize:11}} value={labPasteText} onChange={e => setLabPasteText(e.target.value)} placeholder={"Paste lab results text here…\nExample:\nWBC 12.4  Na 138  K 4.1  Cr 1.0  Trop 0.08"} />
                <button style={{...btnPrimary, marginTop:8}} onClick={parsePastedLabs}>🔍 Parse & Import</button>
              </div>
            )}

            {labMode === 'manual' && (
              <div style={{display:'flex', gap:8, alignItems:'flex-end', flexWrap:'wrap'}}>
                <div style={{flex:2}}><label style={lbl}>Lab Name</label><input type="text" className="mdm-field-input" id="ml-name" placeholder="e.g., Troponin I" /></div>
                <div style={{flex:1}}><label style={lbl}>Value</label><input type="text" className="mdm-field-input" id="ml-val" placeholder="0.04" style={{fontFamily:"'JetBrains Mono',monospace"}} /></div>
                <div style={{flex:1}}><label style={lbl}>Units</label><input type="text" className="mdm-field-input" id="ml-units" placeholder="ng/mL" /></div>
                <div style={{flex:1}}><label style={lbl}>Reference</label><input type="text" className="mdm-field-input" id="ml-ref" placeholder="0.00-0.04" /></div>
                <button style={{...btnPrimary, height:34}} onClick={() => {
                  const name = document.getElementById('ml-name').value.trim();
                  const val = document.getElementById('ml-val').value.trim();
                  const units = document.getElementById('ml-units').value.trim();
                  const ref = document.getElementById('ml-ref').value.trim();
                  if (!name || !val) return;
                  const id = 'manual_'+Date.now();
                  setLabs(prev => [...prev, {id, name, units, ref, value:val, flag:getLabFlag(val,ref)}]);
                  showToast(`✓ ${name} added`);
                }}>+ Add</button>
              </div>
            )}

            {/* Results Table */}
            {labs.length > 0 && (
              <div style={{marginTop:12, maxHeight:300, overflowY:'auto'}}>
                <table style={{width:'100%', borderCollapse:'separate', borderSpacing:0}}>
                  <thead>
                    <tr>
                      {['Test','Result','Flag','Reference'].map(h => (
                        <th key={h} style={{fontSize:9, color:S.txt4, textTransform:'uppercase', letterSpacing:'0.06em', padding:'6px 10px', textAlign:'left', borderBottom:`1px solid ${S.border}`, fontWeight:600, background:S.panel}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {labs.map(lab => {
                      const valColor = lab.flag==='C' ? S.coral : lab.flag==='H' ? S.coral : lab.flag==='L' ? S.blue : S.teal;
                      return (
                        <tr key={lab.id}>
                          <td style={{padding:'7px 10px', borderBottom:`1px solid rgba(26,53,85,.4)`, color:S.txt, fontWeight:500, fontSize:12}}>{lab.name}</td>
                          <td style={{padding:'7px 10px', borderBottom:`1px solid rgba(26,53,85,.4)`, fontFamily:"'JetBrains Mono',monospace", fontWeight:600, fontSize:12, color:valColor}}>{lab.value}</td>
                          <td style={{padding:'7px 10px', borderBottom:`1px solid rgba(26,53,85,.4)`}}>
                            {lab.flag ? <span style={{fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:4, background:`rgba(255,107,107,.2)`, color:S.coral}}>{lab.flag}</span> : <span style={{color:S.txt4}}>—</span>}
                          </td>
                          <td style={{padding:'7px 10px', borderBottom:`1px solid rgba(26,53,85,.4)`, fontSize:10, color:S.txt4, fontFamily:"'JetBrains Mono',monospace"}}>{lab.ref}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* AI Interpretation */}
            {aiLoading && (
              <div className="mdm-ai-interp" style={{marginTop:12}}>
                <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:8}}>
                  <div style={{width:8, height:8, borderRadius:'50%', background:S.teal}} />
                  <span style={{fontSize:12, fontWeight:600, color:S.teal}}>AI Interpreting…</span>
                </div>
                <div className="mdm-loading-bar"><div className="mdm-loading-inner" /></div>
              </div>
            )}
            {aiInterp && !aiLoading && (
              <div className="mdm-ai-interp" style={{marginTop:12}}>
                <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:10}}>
                  <div style={{width:8, height:8, borderRadius:'50%', background:S.teal}} />
                  <span style={{fontSize:12, fontWeight:600, color:S.teal}}>AI Interpretation</span>
                  <button style={{...btnGhost, marginLeft:'auto', fontSize:10}} onClick={() => setAiInterp(null)}>✕ Dismiss</button>
                </div>
                <div style={{fontSize:12, lineHeight:1.7, color:S.txt2}} dangerouslySetInnerHTML={{__html: aiInterp.text.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong style="color:#e8f0fe">$1</strong>')}} />
                {aiInterp.orders.length > 0 && (
                  <div style={{marginTop:10}}>
                    <span style={{fontSize:10, color:S.txt3, textTransform:'uppercase', fontWeight:600, letterSpacing:'0.04em'}}>Suggested Orders</span>
                    <div style={{display:'flex', flexWrap:'wrap', gap:5, marginTop:6}}>
                      {aiInterp.orders.map((o,i) => (
                        <div key={i} style={{display:'inline-flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:20, fontSize:11, cursor:'pointer', border:`1px solid rgba(0,229,192,.3)`, background:'rgba(0,229,192,.06)', color:S.teal, fontFamily:"'DM Sans',sans-serif"}}
                          onClick={e => { e.currentTarget.style.background='rgba(0,229,192,.15)'; e.currentTarget.style.fontWeight='600'; showToast(`📋 Order added: ${o}`); }}>+ {o}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* IMAGING */}
        {resultTab === 'imaging' && (
          <div>
            <div style={{display:'flex', gap:8, marginBottom:12, flexWrap:'wrap', alignItems:'center'}}>
              {['X-Ray','CT','Ultrasound','MRI','CTA'].map(t => (
                <div key={t} className="mdm-qa-cat" onClick={() => { setImgType(t); setImgName(''); setImgResult(''); setImgTime(now()); setShowImagingModal(true); }}>{t}</div>
              ))}
              <button style={{...btnGhost, marginLeft:'auto'}} onClick={() => { setImgType('CT'); setImgName(''); setImgResult(''); setImgTime(now()); setShowImagingModal(true); }}>+ Add Study</button>
            </div>
            {imaging.length === 0 ? (
              <div style={{color:S.txt4, fontSize:12}}>No imaging studies yet</div>
            ) : (
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:10}}>
                {imaging.map(img => {
                  const colors = {'X-Ray':S.blue, 'CT':S.orange, 'CTA':S.coral, 'Ultrasound':S.teal, 'MRI':S.purple};
                  return (
                    <div key={img.id} className="mdm-imaging-card">
                      <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:8}}>
                        <span style={{fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em', color:colors[img.type]||S.txt3}}>{img.type}</span>
                        <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, padding:'1px 6px', borderRadius:10, background:S.up, color:S.txt3, border:`1px solid ${S.border}`}}>{img.status}</span>
                        <span style={{marginLeft:'auto', fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:S.txt4}}>{img.time}</span>
                      </div>
                      <div style={{fontSize:13, fontWeight:500, color:S.txt, marginBottom:6}}>{img.name}</div>
                      <div style={{fontSize:11, lineHeight:1.6, color:S.txt3}}>{img.result || <em style={{color:S.txt4}}>No results yet</em>}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* EKG */}
        {resultTab === 'ekg' && (
          <div>
            <div style={{display:'flex', gap:8, marginBottom:12, alignItems:'flex-end', flexWrap:'wrap'}}>
              <div style={{flex:1, minWidth:200}}>
                <label style={lbl}>EKG Interpretation</label>
                <textarea className="mdm-field-textarea" style={{minHeight:60, fontFamily:"'JetBrains Mono',monospace", fontSize:11}} value={ekgText} onChange={e => setEkgText(e.target.value)} placeholder="Enter or paste EKG interpretation…" />
              </div>
              <button style={btnPrimary} onClick={saveEKG}>💾 Save EKG</button>
            </div>
            <div style={{fontSize:9, color:S.txt4, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600, marginBottom:6}}>Quick Findings</div>
            <div style={{display:'flex', flexWrap:'wrap', gap:4}}>
              {EKG_QUICK.map(f => (
                <div key={f} className={`mdm-ekg-chip${ekgs.includes(f)?' on':''}`} onClick={() => toggleEKG(f)}>{f}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 2: ED COURSE ── */}
      <div style={box}>
        <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:14}}>
          <span style={{fontSize:16}}>📋</span>
          <div>
            <div style={{fontSize:14, fontWeight:600, color:S.txt}}>ED Course & Management</div>
            <div style={{fontSize:11, color:S.txt3}}>Timeline of interventions, re-assessments, and clinical events</div>
          </div>
          <button style={{...btnGhost, marginLeft:'auto'}} onClick={() => { setEntryTime(now()); setShowAddEntry(true); }}>+ Add Entry</button>
        </div>

        {/* Vitals Mini Strip */}
        <div style={{marginBottom:14}}>
          <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:8}}>
            <span style={{fontSize:11, fontWeight:600, color:S.txt2}}>Vital Signs</span>
            <button style={{...btnGhost, fontSize:10}} onClick={() => { setNewV({bpSys:'',bpDia:'',hr:'',rr:'',spo2:'',temp:'',pain:'',gcs:'',time:now()}); setShowVitalsModal(true); }}>+ New Vitals</button>
          </div>
          <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
            {vitalsHistory.length > 0 && (() => {
              const latest = vitalsHistory.at(-1);
              return [
                {lbl:'BP', val:latest.bp, abn: parseInt(latest.bp) > 140 || parseInt(latest.bp) < 90},
                {lbl:'HR', val:latest.hr, abn: latest.hr > 100 || latest.hr < 60},
                {lbl:'SpO₂', val:latest.spo2+'%', abn: latest.spo2 < 94},
                {lbl:'RR', val:latest.rr, abn: latest.rr > 20 || latest.rr < 12},
                {lbl:'Temp', val:latest.temp+'°F', abn: latest.temp > 100.4},
                {lbl:'Pain', val:latest.pain+'/10', abn: latest.pain >= 7},
              ].map(m => (
                <div key={m.lbl} style={{background:S.card, border:`1px solid ${S.border}`, borderRadius:8, padding:'8px 12px', minWidth:90}}>
                  <div style={{fontSize:9, color:S.txt4, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:2}}>{m.lbl}</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:16, fontWeight:600, color:m.abn ? S.coral : S.teal}}>{m.val}</div>
                  {vitalsHistory.length > 1 && <div style={{fontSize:9, color:S.txt4, marginTop:2}}>{vitalsHistory.length} readings</div>}
                </div>
              ));
            })()}
          </div>
        </div>

        <div style={{height:1, background:S.border, margin:'8px 0'}} />

        {/* Quick Add */}
        <div style={{marginBottom:12}}>
          <div style={{display:'flex', gap:5, flexWrap:'wrap', marginBottom:8}}>
            {Object.keys(QA_ITEMS).map(cat => (
              <div key={cat} className={`mdm-qa-cat${qaCat===cat?' active':''}`} onClick={() => setQaCat(cat)}>
                {cat==='med'?'💊 Medications':cat==='proc'?'🔧 Procedures':cat==='consult'?'📞 Consults':'📝 Notes'}
              </div>
            ))}
          </div>
          <div style={{display:'flex', flexWrap:'wrap', gap:4}}>
            {QA_ITEMS[qaCat].map(item => (
              <div key={item} className="mdm-qa-item" onClick={() => { addTimelineEntry(qaCat, now(), item); showToast(`✓ Added: ${item}`); }}>{item}</div>
            ))}
          </div>
        </div>

        <div style={{height:1, background:S.border, margin:'8px 0'}} />

        {/* Timeline */}
        <div style={{position:'relative', paddingLeft:28}}>
          <div style={{position:'absolute', left:10, top:0, bottom:0, width:2, background:S.border}} />
          {timeline.length === 0 ? (
            <div style={{textAlign:'center', color:S.txt4, fontSize:12, padding:'20px 0'}}>No entries yet — use Quick Add or + Add Entry above</div>
          ) : timeline.map((entry, i) => (
            <div key={entry.id} style={{position:'relative', padding:'8px 0 14px', animation:'mdm-fadein .3s ease'}}>
              <div className={`mdm-tl-dot ${entry.type}`} />
              <div style={{background:S.card, border:`1px solid ${S.border}`, borderRadius:8, padding:'10px 12px'}}>
                <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:4}}>
                  <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:S.txt4}}>{entry.time}</span>
                  <span style={{fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em', color:{med:S.teal,proc:S.purple,consult:S.gold,note:S.orange,vital:S.blue,resp:S.green}[entry.type]||S.txt2}}>
                    {entry.type}
                  </span>
                  <button style={{marginLeft:'auto', width:20, height:20, borderRadius:4, border:`1px solid ${S.border}`, background:S.up, color:S.txt4, fontSize:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}} onClick={() => setTimeline(prev => prev.filter((_,j) => j !== i))}>✕</button>
                </div>
                <div style={{fontSize:12, color:S.txt2, lineHeight:1.5}}>{entry.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 3: RESPONSE TO TREATMENT ── */}
      <div style={box}>
        <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:14}}>
          <span style={{fontSize:16}}>📊</span>
          <div>
            <div style={{fontSize:14, fontWeight:600, color:S.txt}}>Response to Treatment</div>
            <div style={{fontSize:11, color:S.txt3}}>Document patient response and clinical trajectory</div>
          </div>
          <span style={{marginLeft:'auto', fontFamily:"'JetBrains Mono',monospace", fontSize:11, padding:'2px 9px', borderRadius:20, fontWeight:600, background: assessment ? (assessment==='improved'||assessment==='resolved'?'rgba(0,229,192,.12)':assessment==='worsened'?'rgba(255,107,107,.15)':'rgba(245,200,66,.12)') : S.up, color: assessment ? (assessment==='improved'||assessment==='resolved'?S.teal:assessment==='worsened'?S.coral:S.gold) : S.txt3, border:`1px solid ${assessment?(assessment==='improved'||assessment==='resolved'?'rgba(0,229,192,.3)':assessment==='worsened'?'rgba(255,107,107,.3)':'rgba(245,200,66,.3)'):S.border}`}}>
            {assessment ? assessment.toUpperCase() : 'PENDING'}
          </span>
        </div>

        <div style={{marginBottom:14}}>
          <label style={{...lbl, marginBottom:6}}>Overall Response</label>
          <div style={{display:'flex', gap:5, flexWrap:'wrap'}}>
            {[['improved','✅ Improved'],['unchanged','➡️ Unchanged'],['worsened','⚠️ Worsened'],['resolved','🎯 Resolved']].map(([v, lbl2]) => (
              <div key={v} className={`mdm-assess-pill${assessment===v?' '+v:''}`} onClick={() => setAssessment(v)}>{lbl2}</div>
            ))}
          </div>
        </div>

        {/* Before / After */}
        {vitalsHistory.length >= 2 && (
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14}}>
            {[
              {lbl:'Blood Pressure', before:vitalsHistory[0].bp, after:vitalsHistory.at(-1).bp, lower:true},
              {lbl:'Heart Rate', before:vitalsHistory[0].hr, after:vitalsHistory.at(-1).hr, lower:true},
              {lbl:'SpO₂', before:vitalsHistory[0].spo2+'%', after:vitalsHistory.at(-1).spo2+'%', lower:false},
              {lbl:'Pain Score', before:vitalsHistory[0].pain+'/10', after:vitalsHistory.at(-1).pain+'/10', lower:true},
            ].map(c => {
              const beforeN = parseFloat(c.before), afterN = parseFloat(c.after);
              const delta = afterN - beforeN;
              const improved = c.lower ? delta < 0 : delta > 0;
              const worsened = c.lower ? delta > 0 : delta < 0;
              return (
                <div key={c.lbl} style={{background:S.card, border:`1px solid ${S.border}`, borderRadius:8, padding:'10px 12px'}}>
                  <div style={{fontSize:9, color:S.txt3, textTransform:'uppercase', letterSpacing:'0.04em', fontWeight:600, marginBottom:6}}>{c.lbl}</div>
                  <div style={{display:'flex', alignItems:'center', gap:8}}>
                    <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:600, color:S.txt3}}>{c.before}</span>
                    <span style={{color:S.txt4}}>→</span>
                    <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:600, color: improved ? S.teal : worsened ? S.coral : S.txt2}}>{c.after}</span>
                    {delta !== 0 && <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:11, padding:'2px 6px', borderRadius:4, background: improved ? 'rgba(0,229,192,.12)' : worsened ? 'rgba(255,107,107,.12)' : S.up, color: improved ? S.teal : worsened ? S.coral : S.txt4}}>{delta > 0 ? '+' : ''}{Math.round(delta*10)/10}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{marginBottom:14}}>
          <label style={lbl}>Response Notes</label>
          <textarea className="mdm-field-textarea" style={{minHeight:60}} placeholder="Document treatment response, reassessment findings, clinical decision rationale…" />
        </div>

        <div>
          <label style={{...lbl, marginBottom:6}}>Disposition</label>
          <div style={{display:'flex', gap:5, flexWrap:'wrap'}}>
            {[['discharge','🏠 Discharge'],['observe','👁️ Observation'],['admit','🏥 Admit'],['transfer','🚑 Transfer'],['ama','⚠️ AMA']].map(([v, lbl2]) => (
              <div key={v} className={`mdm-dispo-btn${dispo===v?' active':''}`} onClick={() => setDispo(v)}>{lbl2}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Note Preview */}
      {showNote && (
        <div style={box}>
          <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:14}}>
            <span style={{fontSize:16}}>📄</span>
            <div>
              <div style={{fontSize:14, fontWeight:600, color:S.txt}}>Generated MDM Note</div>
              <div style={{fontSize:11, color:S.txt3}}>Auto-generated from your documentation</div>
            </div>
            <button style={{...btnGhost, marginLeft:'auto'}} onClick={() => { navigator.clipboard?.writeText(noteText); showToast('📋 Copied!'); }}>📋 Copy</button>
            <button style={btnGhost} onClick={() => setShowNote(false)}>✕ Close</button>
          </div>
          <pre style={{background:S.card, border:`1px solid ${S.border}`, borderRadius:8, padding:'14px 16px', fontFamily:"'JetBrains Mono',monospace", fontSize:11.5, lineHeight:1.7, color:S.txt2, whiteSpace:'pre-wrap', maxHeight:400, overflowY:'auto'}}>
            {noteText}
          </pre>
        </div>
      )}

      {/* Add Entry Modal */}
      <div className={`mdm-modal-overlay${showAddEntry?' open':''}`} onClick={e => { if (e.target === e.currentTarget) setShowAddEntry(false); }}>
        <div className="mdm-modal">
          <div style={{fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:600, color:S.txt, marginBottom:16}}>Add Timeline Entry</div>
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            <div><label style={lbl}>Type</label>
              <select className="mdm-field-select" value={entryType} onChange={e => setEntryType(e.target.value)}>
                {[['med','💊 Medication'],['proc','🔧 Procedure'],['consult','📞 Consult'],['note','📝 Clinical Note'],['vital','📈 Vitals Re-check'],['resp','📊 Response Assessment']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Description</label>
              <textarea className="mdm-field-textarea" value={entryDesc} onChange={e => setEntryDesc(e.target.value)} placeholder="Describe the intervention or event…" />
            </div>
            <div><label style={lbl}>Time</label><input type="time" className="mdm-field-input" value={entryTime} onChange={e => setEntryTime(e.target.value)} /></div>
          </div>
          <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:20, paddingTop:14, borderTop:`1px solid ${S.border}`}}>
            <button style={btnGhost} onClick={() => setShowAddEntry(false)}>Cancel</button>
            <button style={btnPrimary} onClick={addCustomEntry}>+ Add Entry</button>
          </div>
        </div>
      </div>

      {/* Vitals Modal */}
      <div className={`mdm-modal-overlay${showVitalsModal?' open':''}`} onClick={e => { if (e.target === e.currentTarget) setShowVitalsModal(false); }}>
        <div className="mdm-modal">
          <div style={{fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:600, color:S.txt, marginBottom:16}}>New Vital Signs</div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
            {[['bpSys','BP Systolic','120'],['bpDia','BP Diastolic','80'],['hr','Heart Rate','72'],['rr','Resp Rate','16'],['spo2','SpO₂ %','98'],['temp','Temp °F','98.6'],['pain','Pain (0-10)','5'],['gcs','GCS','15'],['time','Time','']].map(([k,l,ph]) => (
              <div key={k}><label style={lbl}>{l}</label><input type={k==='time'?'time':'number'} step={k==='temp'?'0.1':'1'} className="mdm-field-input" style={{fontFamily:"'JetBrains Mono',monospace"}} placeholder={ph} value={newV[k]} onChange={e => setNewV(prev => ({...prev, [k]:e.target.value}))} /></div>
            ))}
          </div>
          <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:20, paddingTop:14, borderTop:`1px solid ${S.border}`}}>
            <button style={btnGhost} onClick={() => setShowVitalsModal(false)}>Cancel</button>
            <button style={btnPrimary} onClick={addVitals}>📈 Add Vitals</button>
          </div>
        </div>
      </div>

      {/* Imaging Modal */}
      <div className={`mdm-modal-overlay${showImagingModal?' open':''}`} onClick={e => { if (e.target === e.currentTarget) setShowImagingModal(false); }}>
        <div className="mdm-modal">
          <div style={{fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:600, color:S.txt, marginBottom:16}}>Add Imaging Study</div>
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            <div style={{display:'flex', gap:8}}>
              <div style={{flex:1}}><label style={lbl}>Study Type</label>
                <select className="mdm-field-select" value={imgType} onChange={e => setImgType(e.target.value)}>
                  {['X-Ray','CT','CT with Contrast','CTA','Ultrasound','MRI','Fluoroscopy'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{flex:2}}><label style={lbl}>Study Name</label><input type="text" className="mdm-field-input" value={imgName} onChange={e => setImgName(e.target.value)} placeholder="e.g., CT Head without contrast" /></div>
            </div>
            <div><label style={lbl}>Result / Impression</label><textarea className="mdm-field-textarea" style={{minHeight:80, fontFamily:"'JetBrains Mono',monospace", fontSize:11}} value={imgResult} onChange={e => setImgResult(e.target.value)} placeholder="Paste or type the radiology read/impression…" /></div>
            <div style={{display:'flex', gap:8}}>
              <div style={{flex:1}}><label style={lbl}>Status</label><select className="mdm-field-select" value={imgStatus} onChange={e => setImgStatus(e.target.value)}>{['Preliminary','Final','Wet Read','Pending'].map(s => <option key={s}>{s}</option>)}</select></div>
              <div style={{flex:1}}><label style={lbl}>Time</label><input type="time" className="mdm-field-input" value={imgTime} onChange={e => setImgTime(e.target.value)} /></div>
            </div>
          </div>
          <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:20, paddingTop:14, borderTop:`1px solid ${S.border}`}}>
            <button style={btnGhost} onClick={() => setShowImagingModal(false)}>Cancel</button>
            <button style={btnPrimary} onClick={saveImaging}>💾 Save Study</button>
          </div>
        </div>
      </div>
    </div>
  );
}