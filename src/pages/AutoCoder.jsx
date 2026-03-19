import { useState, useRef, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import ClaimValidationPanel from '../components/autocoder/ClaimValidationPanel';
import { runValidation } from '../components/autocoder/claimValidation';
import ClinicalTabBar from '../components/shared/ClinicalTabBar';

const TABS = ['note', 'icd', 'cpt', 'billing'];

const SAMPLE_NOTE = `CHIEF COMPLAINT: Chest pain, shortness of breath.

HPI: Mr. James Hartwell is a 67-year-old male with a history of hypertension and type 2 diabetes presenting with 2 days of substernal chest pressure radiating to the left arm, rated 6/10, associated with mild dyspnea on exertion and mild diaphoresis. Denies syncope, nausea, vomiting.

PMH:
- Hypertension — on lisinopril 10mg daily, poorly controlled
- Type 2 diabetes mellitus — last A1c 8.4%
- Hyperlipidemia — on atorvastatin 20mg
- GERD

MEDICATIONS: Lisinopril 10mg, atorvastatin 20mg, metformin 1000mg BID, pantoprazole 40mg, aspirin 81mg (started today).

ALLERGIES: Penicillin (rash), sulfa drugs.

PHYSICAL EXAM:
- BP 158/96 mmHg, HR 88, RR 16, SpO2 96% on RA, Temp 98.8°F
- General: Alert and oriented, mild distress
- Cardiovascular: Regular rate and rhythm, no murmurs
- Pulmonary: Clear to auscultation bilaterally

DIAGNOSTIC STUDIES:
- 12-lead EKG: Performed in office — non-specific ST changes in V4-V6
- Troponin I, BMP, CBC, lipid panel: ordered and pending

ASSESSMENT:
1. Unstable angina — rule out NSTEMI, EKG changes noted
2. Hypertension, stage 2 — suboptimal control on current regimen
3. Type 2 diabetes mellitus, uncontrolled — A1c 8.4%
4. Hyperlipidemia — continue statin

PLAN:
- Emergent cardiology referral placed (Dr. Chen)
- Aspirin 81mg daily initiated
- Increase lisinopril to 20mg daily for hypertension
- Refer to diabetes education for glycemic control
- Patient counseled extensively on symptoms, when to call 911
- Total face-to-face time: 40 minutes, more than 50% spent counseling

MDM: High complexity — new presenting problem with uncertain prognosis, ordering labs/imaging, prescription drug management, referral to specialist.`;

function confClass(n) { return n >= 85 ? 'high' : n >= 65 ? 'med' : 'low'; }

const RVU_MAP = { '99211': 1.3, '99212': 2.6, '99213': 3.9, '99214': 5.2, '99215': 7.2, '93000': 1.0, '71046': 1.5, '80053': 0.8, '85025': 0.7, '84484': 0.5 };

export default function AutoCoder({ patientName = '', patientMrn = '', patientDob = '', patientAge = '', patientGender = '', chiefComplaint = '', vitals = {}, medications = [], allergies = [], pmhSelected = {} }) {
  const [tab, setTab] = useState('note');
  
  // Build note from NPI context if available
  const buildContextNote = () => {
    if (!patientName && !chiefComplaint) return SAMPLE_NOTE;
    let note = '';
    if (patientName || patientAge || patientGender) note += `${patientName || 'Patient'} is a ${patientAge}-year-old ${patientGender || 'unknown'}\n\n`;
    if (chiefComplaint) note += `CHIEF COMPLAINT: ${chiefComplaint}\n\n`;
    if (Object.keys(vitals).length) {
      note += `VITALS:\n`;
      Object.entries(vitals).forEach(([k, v]) => { if (v) note += `- ${k.toUpperCase()}: ${v}\n`; });
      note += '\n';
    }
    if (medications.length) note += `MEDICATIONS: ${medications.join(', ')}\n\n`;
    if (allergies.length) note += `ALLERGIES: ${allergies.join(', ')}\n\n`;
    if (Object.keys(pmhSelected).length) note += `PAST MEDICAL HISTORY: ${Object.keys(pmhSelected).filter(k => pmhSelected[k] > 0).join(', ')}\n\n`;
    return note || SAMPLE_NOTE;
  };
  
  const [noteText, setNoteText] = useState(() => buildContextNote());
  const [icdCodes, setIcdCodes] = useState([]);
  const [cptCodes, setCptCodes] = useState([]);
  const [aiRationale, setAiRationale] = useState('');
  const [aiPanel, setAiPanel] = useState(null); // { principalDx, emLevel, icdRows, cptRows, rationale }
  const [aiMessages, setAiMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [extractDone, setExtractDone] = useState(false);
  const [extractSummary, setExtractSummary] = useState('');
  const [icdManualCode, setIcdManualCode] = useState('');
  const [icdManualDesc, setIcdManualDesc] = useState('');
  const [cptManualCode, setCptManualCode] = useState('');
  const [cptManualDesc, setCptManualDesc] = useState('');
  const [toast, setToast] = useState(false);
  const aiBodyRef = useRef(null);

  const selIcd = icdCodes.filter(c => c.selected);
  const selCpt = cptCodes.filter(c => c.selected);

  const switchTab = (t) => setTab(t);
  const navNext = () => { const i = TABS.indexOf(tab); if (i < TABS.length - 1) setTab(TABS[i + 1]); };
  const navBack = () => { const i = TABS.indexOf(tab); if (i > 0) setTab(TABS[i - 1]); };

  const showToast = () => { setToast(true); setTimeout(() => setToast(false), 2200); };

  const runExtraction = async () => {
    if (!noteText.trim()) return;
    setLoading(true);
    setAiMessages([{ type: 'thinking' }]);
    try {
      const prompt = `You are an expert medical coder (CPC certified) with deep knowledge of ICD-10-CM and CPT coding guidelines.

Analyze this clinical note and extract the most appropriate codes. Return ONLY valid JSON in exactly this format (no markdown, no explanation outside the JSON):

{
  "icd10": [
    {
      "code": "I20.0",
      "description": "Unstable angina",
      "category": "Primary Dx",
      "confidence": 95,
      "rationale": "Patient presents with classic unstable angina symptoms"
    }
  ],
  "cpt": [
    {
      "code": "99215",
      "description": "Office or other outpatient visit, high complexity MDM",
      "category": "E&M",
      "confidence": 90,
      "modifier": "",
      "rationale": "High complexity MDM, 40 minutes face-to-face with >50% counseling"
    }
  ],
  "summary": "Brief 2-3 sentence coding rationale explaining the principal diagnosis, any comorbidities captured, and E&M level justification.",
  "em_level": "99215",
  "principal_dx": "I20.0"
}

Guidelines:
- ICD-10: Include principal diagnosis first, then comorbidities actively managed, then relevant secondary diagnoses. Use most specific code.
- CPT: Include E&M code based on documented MDM or time, plus any procedures performed.
- Confidence: 90-99 high (clear documentation), 70-89 medium (implied), 50-69 low (uncertain)
- Category for ICD: "Primary Dx", "Comorbidity", "Secondary Dx"
- Category for CPT: "E&M", "Procedure", "Diagnostic"

Clinical Note:
${noteText}`;

      const result = await base44.integrations.Core.InvokeLLM({ prompt, model: 'claude_sonnet_4_6' });
      let parsed;
      try {
        const clean = (typeof result === 'string' ? result : JSON.stringify(result)).replace(/```json|```/g, '').trim();
        parsed = JSON.parse(clean);
      } catch (e) {
        throw new Error('Could not parse AI response. Please try again.');
      }

      const ts = Date.now();
      setIcdCodes((parsed.icd10 || []).map((c, i) => ({ ...c, selected: true, id: 'icd-' + ts + '-' + i })));
      setCptCodes((parsed.cpt || []).map((c, i) => ({ ...c, selected: true, id: 'cpt-' + ts + '-' + i, modifier: c.modifier || '' })));
      setAiRationale(parsed.summary || '');
      setAiPanel(parsed);
      setAiMessages([{ type: 'result', data: parsed }]);
      setExtractDone(true);
      const total = (parsed.icd10 || []).length + (parsed.cpt || []).length;
      setExtractSummary(`Extracted ${(parsed.icd10 || []).length} ICD-10 and ${(parsed.cpt || []).length} CPT codes. Principal Dx: ${parsed.principal_dx || '—'} | E&M: ${parsed.em_level || '—'}`);
    } catch (err) {
      setAiMessages([{ type: 'error', text: err.message }]);
    }
    setLoading(false);
  };

  const toggleCode = (type, id, checked) => {
    if (type === 'icd') setIcdCodes(prev => prev.map(c => c.id === id ? { ...c, selected: checked } : c));
    else setCptCodes(prev => prev.map(c => c.id === id ? { ...c, selected: checked } : c));
  };
  const removeCode = (type, id) => {
    if (type === 'icd') setIcdCodes(prev => prev.filter(c => c.id !== id));
    else setCptCodes(prev => prev.filter(c => c.id !== id));
  };
  const editCode = (type, id) => {
    const arr = type === 'icd' ? icdCodes : cptCodes;
    const c = arr.find(x => x.id === id);
    if (!c) return;
    const newCode = prompt('Edit code:', c.code);
    if (newCode === null) return;
    const newDesc = prompt('Edit description:', c.description);
    if (newDesc === null) return;
    const update = arr.map(x => x.id === id ? { ...x, code: newCode.trim().toUpperCase(), description: newDesc.trim() } : x);
    if (type === 'icd') setIcdCodes(update);
    else setCptCodes(update);
  };
  const selectAll = (type) => {
    if (type === 'icd') setIcdCodes(prev => prev.map(c => ({ ...c, selected: true })));
    else setCptCodes(prev => prev.map(c => ({ ...c, selected: true })));
  };
  const clearAll = (type) => {
    if (type === 'icd') setIcdCodes(prev => prev.map(c => ({ ...c, selected: false })));
    else setCptCodes(prev => prev.map(c => ({ ...c, selected: false })));
  };
  const addManual = (type) => {
    const code = (type === 'icd' ? icdManualCode : cptManualCode).trim().toUpperCase();
    const desc = (type === 'icd' ? icdManualDesc : cptManualDesc).trim() || '(description pending)';
    if (!code) return;
    const obj = { code, description: desc, category: type === 'icd' ? 'Secondary Dx' : 'Procedure', confidence: 80, rationale: 'Manually added', selected: true, modifier: '', id: type + '-manual-' + Date.now() };
    if (type === 'icd') { setIcdCodes(prev => [...prev, obj]); setIcdManualCode(''); setIcdManualDesc(''); }
    else { setCptCodes(prev => [...prev, obj]); setCptManualCode(''); setCptManualDesc(''); }
  };

  const copyBilling = () => {
    let txt = `BILLING SUMMARY — Notrya\nDate: ${new Date().toLocaleDateString()}\n\nICD-10 CODES:\n`;
    selIcd.forEach(c => { txt += `  ${c.code}  ${c.description}\n`; });
    txt += `\nCPT CODES:\n`;
    selCpt.forEach(c => { txt += `  ${c.code}  ${c.description}${c.modifier ? ' (' + c.modifier + ')' : ''}\n`; });
    txt += `\nRATIONALE:\n${aiRationale}`;
    navigator.clipboard.writeText(txt).then(showToast);
  };

  const exportCSV = () => {
    let csv = 'Type,Code,Description,Category,Confidence,Modifier\n';
    selIcd.forEach(c => { csv += `ICD-10,${c.code},"${c.description}",${c.category},${c.confidence}%,\n`; });
    selCpt.forEach(c => { csv += `CPT,${c.code},"${c.description}",${c.category},${c.confidence}%,${c.modifier || ''}\n`; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `notrya-codes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  // Run validation for badge counts
  const { denialCount, warningCount } = useMemo(() => {
    if (selIcd.length + selCpt.length === 0) return { denialCount: 0, warningCount: 0 };
    const findings = runValidation(selIcd, selCpt);
    return {
      denialCount: findings.filter(f => f.type === 'denial').length,
      warningCount: findings.filter(f => f.type === 'warning').length,
    };
  }, [selIcd, selCpt]);

  const avgConf = selIcd.length + selCpt.length > 0
    ? Math.round([...selIcd, ...selCpt].reduce((a, c) => a + c.confidence, 0) / (selIcd.length + selCpt.length))
    : null;
  const totalRVU = selCpt.reduce((a, c) => a + (RVU_MAP[c.code] || 2.0), 0);

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
    :root {
      --bg:#050f1e; --bg2:#0a1929; --bg3:#0f2237; --bg4:#132840;
      --border:#1a3550; --border2:#1f4060;
      --text:#e8f0f8; --text2:#8fadc8; --text3:#4d7a9e;
      --accent:#00c6ff; --accent2:#0096d6;
      --green:#00e5a0; --green2:#00b880; --amber:#f5a623; --red:#ff4757; --purple:#a855f7;
      --mono:'JetBrains Mono',monospace; --serif:'Playfair Display',Georgia,serif; --sans:'DM Sans',sans-serif;
    }
    .ac-root { background:var(--bg); color:var(--text); font-family:var(--sans); font-size:14px; height:100vh; overflow:hidden; display:flex; flex-direction:column; }
    .ac-navbar { height:50px; background:var(--bg2); border-bottom:1px solid var(--border); display:flex; align-items:center; padding:0 16px; gap:12px; flex-shrink:0; }
    .ac-logo { font-family:var(--serif); font-size:20px; font-weight:700; background:linear-gradient(135deg,var(--accent),var(--green)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    .ac-divider { width:1px; height:24px; background:var(--border2); }
    .ac-page-title { font-family:var(--serif); font-size:15px; color:var(--text2); font-weight:400; }
    .ac-pill { font-family:var(--mono); font-size:11px; padding:3px 10px; border-radius:20px; border:1px solid var(--border2); color:var(--text3); background:var(--bg3); }
    .ac-pill.live { border-color:var(--green); color:var(--green); }
    .ac-vitals { height:38px; background:var(--bg3); border-bottom:1px solid var(--border); display:flex; align-items:center; padding:0 16px; gap:20px; font-family:var(--mono); font-size:11px; flex-shrink:0; }
    .ac-layout { display:grid; grid-template-columns:220px 1fr 295px; flex:1; overflow:hidden; }
    .ac-sidebar { background:var(--bg2); border-right:1px solid var(--border); overflow-y:auto; padding:12px 0; display:flex; flex-direction:column; gap:2px; }
    .ac-sidebar::-webkit-scrollbar { width:4px; } .ac-sidebar::-webkit-scrollbar-thumb { background:var(--border2); border-radius:2px; }
    .sb-sec { padding:6px 14px 4px; font-size:10px; font-weight:600; color:var(--text3); letter-spacing:.1em; text-transform:uppercase; }
    .sb-item { display:flex; align-items:center; gap:9px; padding:8px 14px; cursor:pointer; border-left:2px solid transparent; transition:.15s; color:var(--text2); font-size:13px; }
    .sb-item:hover { background:var(--bg3); color:var(--text); }
    .sb-item.on { background:var(--bg3); color:var(--accent); border-left-color:var(--accent); }
    .sb-badge { margin-left:auto; font-family:var(--mono); font-size:10px; padding:1px 6px; border-radius:10px; min-width:20px; text-align:center; }
    .sb-badge.n { background:var(--bg4); color:var(--text3); }
    .sb-badge.info { background:rgba(0,198,255,.12); color:var(--accent); }
    .sb-badge.alert { background:rgba(255,71,87,.18); color:var(--red); }
    .sb-badge.ok { background:rgba(0,229,160,.12); color:var(--green); }
    .ac-main { overflow-y:auto; background:var(--bg); }
    .ac-main::-webkit-scrollbar { width:5px; } .ac-main::-webkit-scrollbar-thumb { background:var(--border2); border-radius:2px; }
    .ac-ai { background:var(--bg2); border-left:1px solid var(--border); display:flex; flex-direction:column; overflow:hidden; }
    .ac-ai-hdr { padding:12px 14px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:8px; flex-shrink:0; }
    .ai-dot { width:7px; height:7px; border-radius:50%; background:var(--green); box-shadow:0 0 6px var(--green); animation:pulse-g 2s infinite; }
    @keyframes pulse-g { 0%,100%{box-shadow:0 0 4px var(--green2);}50%{box-shadow:0 0 12px var(--green),0 0 20px rgba(0,229,160,.3);} }
    .ai-body { flex:1; overflow-y:auto; padding:14px; display:flex; flex-direction:column; gap:10px; }
    .ai-body::-webkit-scrollbar { width:3px; } .ai-body::-webkit-scrollbar-thumb { background:var(--border2); border-radius:2px; }
    .ai-msg { background:var(--bg3); border:1px solid var(--border); border-radius:10px; padding:12px; font-size:12px; color:var(--text2); line-height:1.65; animation:fadeUp .3s ease; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
    .ai-sec { color:var(--text); font-weight:600; font-size:11px; margin:8px 0 4px; text-transform:uppercase; letter-spacing:.06em; }
    .ai-code { font-family:var(--mono); font-size:11px; color:var(--accent); background:var(--bg4); border-radius:4px; padding:1px 5px; }
    .ai-row { display:flex; justify-content:space-between; align-items:baseline; padding:4px 0; border-bottom:1px solid var(--border); font-size:11px; }
    .ai-row:last-child { border-bottom:none; }
    .ac-bottom { height:76px; background:var(--bg2); border-top:1px solid var(--border); display:flex; flex-direction:column; flex-shrink:0; }
    .btabs { display:flex; align-items:center; padding:0 16px; border-bottom:1px solid var(--border); height:38px; gap:2px; }
    .btab { padding:0 16px; height:38px; display:flex; align-items:center; gap:6px; cursor:pointer; border-bottom:2px solid transparent; color:var(--text3); font-size:12px; font-weight:500; background:transparent; border-top:none; border-left:none; border-right:none; transition:.15s; white-space:nowrap; font-family:var(--sans); }
    .btab:hover { color:var(--text2); }
    .btab.on { color:var(--accent); border-bottom-color:var(--accent); }
    .tab-cnt { font-family:var(--mono); font-size:10px; padding:1px 5px; border-radius:8px; background:var(--bg4); color:var(--text3); }
    .btab.on .tab-cnt { background:rgba(0,198,255,.15); color:var(--accent); }
    .bnav2 { display:flex; align-items:center; padding:0 16px; height:38px; gap:8px; }
    .nbtn { padding:4px 14px; border-radius:5px; font-size:12px; font-weight:500; cursor:pointer; transition:.15s; border:1px solid var(--border2); background:transparent; color:var(--text2); font-family:var(--sans); }
    .nbtn:hover { background:var(--bg3); color:var(--text); }
    .nbtn.primary { background:var(--accent2); color:#fff; border-color:var(--accent2); }
    .nbtn.primary:hover { background:var(--accent); border-color:var(--accent); }
    .nbtn.success { background:rgba(0,229,160,.12); color:var(--green); border-color:var(--green2); }
    .panel { display:none; flex:1; flex-direction:column; padding:20px; gap:16px; }
    .panel.on { display:flex; }
    .sec-title { font-family:var(--serif); font-size:22px; font-weight:600; color:var(--text); }
    .sec-sub { font-size:12px; color:var(--text3); margin-top:4px; }
    .card { background:var(--bg2); border:1px solid var(--border); border-radius:10px; overflow:hidden; }
    .card-hdr { padding:10px 14px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:8px; }
    .card-title { font-size:12px; font-weight:600; color:var(--text); letter-spacing:.04em; }
    .card-body { padding:14px; }
    .note-area { width:100%; min-height:200px; background:var(--bg3); border:1px solid var(--border); border-radius:8px; color:var(--text); font-family:var(--sans); font-size:13px; line-height:1.7; padding:14px; resize:vertical; transition:.2s; outline:none; }
    .note-area:focus { border-color:var(--accent2); box-shadow:0 0 0 2px rgba(0,150,214,.15); }
    .note-area::placeholder { color:var(--text3); }
    .tip-bar { background:rgba(0,198,255,.07); border:1px solid rgba(0,198,255,.2); border-radius:8px; padding:10px 14px; font-size:12px; color:var(--text2); display:flex; align-items:flex-start; gap:8px; line-height:1.6; }
    .empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:48px; text-align:center; color:var(--text3); border:1px dashed var(--border); border-radius:10px; }
    .code-row { display:flex; align-items:flex-start; gap:10px; padding:12px; border-radius:8px; border:1px solid var(--border); background:var(--bg3); transition:.2s; animation:fadeUp .3s ease; }
    .code-row:hover { border-color:var(--border2); }
    .code-row.sel { border-color:var(--accent2); background:rgba(0,150,214,.06); }
    .code-chk { width:16px; height:16px; border-radius:4px; border:1px solid var(--border2); background:transparent; cursor:pointer; flex-shrink:0; margin-top:2px; accent-color:var(--accent2); }
    .code-num { font-family:var(--mono); font-size:14px; font-weight:600; color:var(--accent); letter-spacing:.05em; margin-right:8px; }
    .code-desc { font-size:13px; color:var(--text); line-height:1.45; }
    .code-meta { display:flex; align-items:center; gap:8px; margin-top:5px; flex-wrap:wrap; }
    .cat { font-size:10px; padding:2px 7px; border-radius:10px; font-weight:600; letter-spacing:.04em; text-transform:uppercase; }
    .cat-dx { background:rgba(168,85,247,.18); color:var(--purple); border:1px solid rgba(168,85,247,.3); }
    .cat-proc { background:rgba(0,198,255,.12); color:var(--accent); border:1px solid rgba(0,198,255,.25); }
    .conf-bar { width:50px; height:3px; background:var(--border); border-radius:2px; overflow:hidden; display:inline-block; vertical-align:middle; }
    .conf-fill { height:100%; border-radius:2px; }
    .conf-fill.high { background:var(--green); } .conf-fill.med { background:var(--amber); } .conf-fill.low { background:var(--red); }
    .code-act-btn { padding:3px 8px; border-radius:4px; font-size:11px; cursor:pointer; border:1px solid var(--border2); background:transparent; color:var(--text3); font-family:var(--sans); transition:.15s; }
    .code-act-btn:hover { background:var(--bg4); color:var(--text); }
    .code-act-btn.danger:hover { background:rgba(255,71,87,.1); color:var(--red); border-color:var(--red); }
    .sum-grid { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:10px; }
    .sum-card { background:var(--bg3); border:1px solid var(--border); border-radius:8px; padding:12px; }
    .sum-label { font-size:10px; color:var(--text3); text-transform:uppercase; letter-spacing:.06em; }
    .sum-val { font-family:var(--mono); font-size:20px; font-weight:600; color:var(--text); margin-top:4px; }
    .billing-table { width:100%; border-collapse:collapse; }
    .billing-table th { text-align:left; font-size:10px; font-weight:600; color:var(--text3); text-transform:uppercase; letter-spacing:.08em; padding:6px 10px; border-bottom:1px solid var(--border); }
    .billing-table td { padding:10px; font-size:12px; color:var(--text2); border-bottom:1px solid var(--border); }
    .billing-table tr:last-child td { border-bottom:none; }
    .billing-table tr:hover td { background:var(--bg3); }
    .add-row { display:flex; gap:8px; align-items:center; }
    .code-input { background:var(--bg3); border:1px solid var(--border); border-radius:6px; color:var(--text); font-family:var(--mono); font-size:13px; padding:6px 10px; outline:none; transition:.15s; width:130px; }
    .code-input:focus { border-color:var(--accent2); }
    .desc-input { flex:1; background:var(--bg3); border:1px solid var(--border); border-radius:6px; color:var(--text); font-family:var(--sans); font-size:13px; padding:6px 10px; outline:none; transition:.15s; }
    .desc-input:focus { border-color:var(--accent2); }
    .dots span { display:inline-block; width:5px; height:5px; border-radius:50%; background:var(--accent); margin:0 2px; animation:blink 1.2s infinite; }
    .dots span:nth-child(2){animation-delay:.2s;} .dots span:nth-child(3){animation-delay:.4s;}
    @keyframes blink { 0%,80%,100%{opacity:.2} 40%{opacity:1} }
    .spin { width:16px; height:16px; border-radius:50%; border:2px solid var(--border2); border-top-color:var(--accent); animation:spin .8s linear infinite; }
    @keyframes spin { to{transform:rotate(360deg)} }
    .copy-toast { position:fixed; bottom:90px; right:20px; background:var(--green2); color:#fff; padding:8px 16px; border-radius:6px; font-size:12px; font-weight:600; opacity:0; transform:translateY(10px); transition:.3s; pointer-events:none; z-index:200; }
    .copy-toast.show { opacity:1; transform:none; }
    .abn { color:var(--red); animation:glow-red 1.8s ease-in-out infinite; }
    @keyframes glow-red { 0%,100%{text-shadow:0 0 4px rgba(255,71,87,.4);}50%{text-shadow:0 0 12px rgba(255,71,87,.9);} }
  `;

  const CodeRow = ({ code, type }) => {
    const cc = confClass(code.confidence);
    const catCls = code.category?.includes('Primary') ? 'cat-dx' : 'cat-proc';
    return (
      <div className={`code-row${code.selected ? ' sel' : ''}`}>
        <input type="checkbox" className="code-chk" checked={code.selected} onChange={e => toggleCode(type, code.id, e.target.checked)} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className="code-num">{code.code}</span>
          <span className="code-desc">{code.description}</span>
          <div className="code-meta">
            <span className={`cat ${catCls}`}>{code.category}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div className="conf-bar"><div className={`conf-fill ${cc}`} style={{ width: code.confidence + '%' }} /></div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)' }}>{code.confidence}%</span>
            </div>
            {code.rationale && <span style={{ fontSize: 11, color: 'var(--text3)', fontStyle: 'italic' }}>{code.rationale}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button className="code-act-btn" onClick={() => editCode(type, code.id)}>Edit</button>
          <button className="code-act-btn danger" onClick={() => removeCode(type, code.id)}>✕</button>
        </div>
      </div>
    );
  };

  return (
    <div className="ac-root">
      <style>{CSS}</style>

      {/* Navbar */}
      <nav className="ac-navbar">
        <span className="ac-logo">Notrya</span>
        <div className="ac-divider" />
        <span className="ac-page-title">ICD-10 / CPT Auto-Coder</span>
        <div style={{ flex: 1 }} />
        <span className="ac-pill">Encounter: {new Date().toISOString().slice(0, 10)}</span>
        <span className="ac-pill live">● AI Ready</span>
      </nav>

      {/* Vitals Bar */}
      <div className="ac-vitals">
        <span style={{ fontFamily: 'var(--serif)', fontSize: 13, color: 'var(--text)', marginRight: 8 }}>{patientName || 'Patient'}</span>
        <span style={{ color: 'var(--border2)' }}>|</span>
        {patientMrn && <><span style={{ color: 'var(--text3)' }}>MRN</span><span>{patientMrn}</span></>}
        {patientDob && <><span style={{ color: 'var(--text3)' }}>DOB</span><span>{patientDob}</span></>}
        {patientAge && <><span style={{ color: 'var(--text3)' }}>Age</span><span>{patientAge}</span></>}
        {vitals.bp && <><span style={{ color: 'var(--text3)' }}>BP</span><span className={vitals.bp.includes('/158') ? 'abn' : ''}>{vitals.bp}</span></>}
        {vitals.hr && <><span style={{ color: 'var(--text3)' }}>HR</span><span>{vitals.hr}</span></>}
        {vitals.spo2 && <><span style={{ color: 'var(--text3)' }}>SpO₂</span><span>{vitals.spo2}%</span></>}
        {vitals.temp && <><span style={{ color: 'var(--text3)' }}>Temp</span><span>{vitals.temp}°C</span></>}
      </div>

      {/* Layout */}
      <div className="ac-layout">

        {/* Sidebar */}
        <aside className="ac-sidebar">
          <div className="sb-sec">Coding</div>
          {[
            { id: 'note', icon: '📋', label: 'Note Input', badge: noteText ? '✓' : '—', bc: 'n' },
            { id: 'icd', icon: '🏥', label: 'ICD-10 Codes', badge: icdCodes.length, bc: 'info' },
            { id: 'cpt', icon: '⚕️', label: 'CPT Codes', badge: cptCodes.length, bc: 'info' },
            { id: 'billing', icon: '💳', label: 'Billing Summary', badge: denialCount > 0 ? `⚠ ${denialCount}` : selIcd.length + selCpt.length || '—', bc: denialCount > 0 ? 'alert' : selIcd.length + selCpt.length > 0 ? 'ok' : 'n' },
          ].map(s => (
            <div key={s.id} className={`sb-item${tab === s.id ? ' on' : ''}`} onClick={() => switchTab(s.id)}>
              <span style={{ fontSize: 14 }}>{s.icon}</span>{s.label}
              <span className={`sb-badge ${s.bc}`}>{s.badge}</span>
            </div>
          ))}
          <div className="sb-sec" style={{ marginTop: 12 }}>Patient</div>
          {[['👤','Demographics'],['💊','Medications','7','n'],['⚠️','Allergies','2','alert'],['📁','Past Encounters','14','n']].map(([icon,label,badge,bc]) => (
            <div key={label} className="sb-item"><span style={{fontSize:14}}>{icon}</span>{label}{badge && <span className={`sb-badge ${bc||'n'}`}>{badge}</span>}</div>
          ))}
          <div className="sb-sec" style={{ marginTop: 12 }}>Tools</div>
          {[['🧬','DDx Engine'],['📝','Clinical Note'],['📨','Referral Letter'],['🤝','SBAR Handoff']].map(([icon,label]) => (
            <div key={label} className="sb-item"><span style={{fontSize:14}}>{icon}</span>{label}</div>
          ))}
        </aside>

        {/* Main */}
        <main className="ac-main">

          {/* Note Input */}
          <div className={`panel${tab === 'note' ? ' on' : ''}`}>
            <div>
              <div className="sec-title">Clinical Note Input</div>
              <div className="sec-sub">Paste or type the encounter note — AI will extract diagnosis and procedure codes</div>
            </div>
            <div className="tip-bar">
              <span style={{ fontSize: 14 }}>💡</span>
              <span>Include the HPI, assessment, plan, and any procedures performed. The more detail provided, the more accurate the code suggestions. Supports SOAP, H&P, discharge summaries, and procedure notes.</span>
            </div>
            <div className="card">
              <div className="card-hdr">
                <span className="card-title">ENCOUNTER NOTE</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  <button className="nbtn" onClick={() => setNoteText(SAMPLE_NOTE)}>Load Sample Note</button>
                  <button className="nbtn" onClick={() => setNoteText('')}>Clear</button>
                </div>
              </div>
              <div className="card-body">
                <textarea className="note-area" rows={14} placeholder="Paste clinical note here…" value={noteText} onChange={e => setNoteText(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {!loading && (
                <button className="nbtn primary" onClick={runExtraction}>✦ Extract ICD-10 &amp; CPT Codes</button>
              )}
              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text3)', fontSize: 13 }}>
                  <div className="spin" /><span>AI is analyzing the clinical note…</span>
                </div>
              )}
              {extractDone && !loading && (
                <button className="nbtn" onClick={() => switchTab('icd')}>View Codes →</button>
              )}
            </div>
            {extractDone && !loading && (
              <div className="tip-bar" style={{ background: 'rgba(0,229,160,.07)', borderColor: 'rgba(0,229,160,.3)' }}>
                <span>✅</span>
                <span>{extractSummary}</span>
                <div style={{ marginLeft: 'auto' }}>
                  <button className="nbtn success" onClick={() => switchTab('icd')}>View ICD-10 →</button>
                </div>
              </div>
            )}
          </div>

          {/* ICD-10 */}
          <div className={`panel${tab === 'icd' ? ' on' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div><div className="sec-title">ICD-10 Diagnosis Codes</div><div className="sec-sub">AI-suggested codes — review, edit, and confirm</div></div>
              <div style={{ flex: 1 }} />
              <button className="nbtn" onClick={() => selectAll('icd')}>Select All</button>
              <button className="nbtn" onClick={() => clearAll('icd')}>Clear All</button>
            </div>
            {icdCodes.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: 36, opacity: .3 }}>🏥</div>
                <div style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 500 }}>No ICD-10 codes yet</div>
                <div style={{ fontSize: 12, maxWidth: 280, lineHeight: 1.6 }}>Enter a clinical note and run the AI extractor to generate diagnosis codes</div>
                <button className="nbtn primary" onClick={() => switchTab('note')}>← Go to Note Input</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {icdCodes.map(c => <CodeRow key={c.id} code={c} type="icd" />)}
                </div>
                <div className="card">
                  <div className="card-hdr"><span className="card-title">ADD ICD-10 CODE MANUALLY</span></div>
                  <div className="card-body">
                    <div className="add-row">
                      <input className="code-input" placeholder="e.g. I10" value={icdManualCode} onChange={e => setIcdManualCode(e.target.value)} />
                      <input className="desc-input" placeholder="Description (optional)" value={icdManualDesc} onChange={e => setIcdManualDesc(e.target.value)} />
                      <button className="nbtn primary" onClick={() => addManual('icd')}>Add</button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* CPT */}
          <div className={`panel${tab === 'cpt' ? ' on' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div><div className="sec-title">CPT Procedure Codes</div><div className="sec-sub">AI-suggested procedure and E&amp;M codes — review, edit, and confirm</div></div>
              <div style={{ flex: 1 }} />
              <button className="nbtn" onClick={() => selectAll('cpt')}>Select All</button>
              <button className="nbtn" onClick={() => clearAll('cpt')}>Clear All</button>
            </div>
            {cptCodes.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: 36, opacity: .3 }}>⚕️</div>
                <div style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 500 }}>No CPT codes yet</div>
                <div style={{ fontSize: 12, maxWidth: 280, lineHeight: 1.6 }}>Run the AI extractor on a clinical note to generate procedure and E&M codes</div>
                <button className="nbtn primary" onClick={() => switchTab('note')}>← Go to Note Input</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {cptCodes.map(c => <CodeRow key={c.id} code={c} type="cpt" />)}
                </div>
                <div className="card">
                  <div className="card-hdr"><span className="card-title">ADD CPT CODE MANUALLY</span></div>
                  <div className="card-body">
                    <div className="add-row">
                      <input className="code-input" placeholder="e.g. 99214" style={{ width: 110 }} value={cptManualCode} onChange={e => setCptManualCode(e.target.value)} />
                      <input className="desc-input" placeholder="Description" value={cptManualDesc} onChange={e => setCptManualDesc(e.target.value)} />
                      <button className="nbtn primary" onClick={() => addManual('cpt')}>Add</button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Billing */}
          <div className={`panel${tab === 'billing' ? ' on' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div><div className="sec-title">Billing Summary</div><div className="sec-sub">Final code set for claim submission — selected codes only</div></div>
              <div style={{ flex: 1 }} />
              <button className="nbtn" onClick={copyBilling}>📋 Copy</button>
              <button className="nbtn success" onClick={exportCSV}>↓ Export</button>
            </div>

            {/* Validation Engine */}
            {(selIcd.length + selCpt.length > 0) && (
              <div className="card">
                <div className="card-hdr">
                  <span style={{ fontSize: 14 }}>🛡️</span>
                  <span className="card-title">CLAIM VALIDATION — NCCI EDITS &amp; LCD CHECKS</span>
                </div>
                <div className="card-body">
                  <ClaimValidationPanel selIcd={selIcd} selCpt={selCpt} />
                </div>
              </div>
            )}

            <div className="sum-grid">
              <div className="sum-card"><div className="sum-label">ICD-10 Codes</div><div className="sum-val" style={{ color: 'var(--accent)' }}>{selIcd.length}</div></div>
              <div className="sum-card"><div className="sum-label">CPT Codes</div><div className="sum-val" style={{ color: 'var(--accent)' }}>{selCpt.length}</div></div>
              <div className="sum-card"><div className="sum-label">Avg Confidence</div><div className="sum-val" style={{ color: 'var(--green)' }}>{avgConf !== null ? avgConf + '%' : '—'}</div></div>
              <div className="sum-card"><div className="sum-label">Est. RVU</div><div className="sum-val" style={{ color: 'var(--amber)' }}>{selCpt.length ? totalRVU.toFixed(1) : '—'}</div></div>
            </div>
            {selIcd.length + selCpt.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: 36, opacity: .3 }}>💳</div>
                <div style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 500 }}>No codes selected</div>
                <div style={{ fontSize: 12, maxWidth: 280, lineHeight: 1.6 }}>Select codes in the ICD-10 and CPT tabs to populate the billing summary</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="card">
                  <div className="card-hdr"><span className="card-title">DIAGNOSIS CODES (ICD-10)</span></div>
                  <div style={{ padding: 0 }}>
                    <table className="billing-table">
                      <thead><tr><th>Code</th><th>Description</th><th>Type</th><th>Conf.</th></tr></thead>
                      <tbody>{selIcd.map(c => (
                        <tr key={c.id}>
                          <td style={{ fontFamily: 'var(--mono)', color: 'var(--accent)', fontSize: 13 }}>{c.code}</td>
                          <td>{c.description}</td>
                          <td><span className="cat cat-dx" style={{ fontSize: 10 }}>{c.category}</span></td>
                          <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{c.confidence}%</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
                <div className="card">
                  <div className="card-hdr"><span className="card-title">PROCEDURE &amp; E&amp;M CODES (CPT)</span></div>
                  <div style={{ padding: 0 }}>
                    <table className="billing-table">
                      <thead><tr><th>Code</th><th>Description</th><th>Type</th><th>Modifier</th><th>Conf.</th></tr></thead>
                      <tbody>{selCpt.map(c => (
                        <tr key={c.id}>
                          <td style={{ fontFamily: 'var(--mono)', color: 'var(--accent)', fontSize: 13 }}>{c.code}</td>
                          <td>{c.description}</td>
                          <td><span className="cat cat-proc" style={{ fontSize: 10 }}>{c.category}</span></td>
                          <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{c.modifier || '—'}</td>
                          <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{c.confidence}%</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
                {aiRationale && (
                  <div className="card">
                    <div className="card-hdr"><span className="card-title">AI CODING RATIONALE</span></div>
                    <div className="card-body" style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>{aiRationale}</div>
                  </div>
                )}
              </div>
            )}
          </div>

        </main>

        {/* AI Panel */}
        <aside className="ac-ai">
          <div className="ac-ai-hdr">
            <div className="ai-dot" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', letterSpacing: '.04em' }}>AI CODING ASSISTANT</span>
            <div style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)' }}>claude-sonnet</div>
          </div>
          <div className="ai-body" ref={aiBodyRef}>
            {aiMessages.length === 0 && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text3)', textAlign: 'center', padding: 20 }}>
                <div style={{ fontSize: 32, opacity: .4 }}>🤖</div>
                <div style={{ fontSize: 12, lineHeight: 1.6 }}>Enter a clinical note and click <strong style={{ color: 'var(--accent)' }}>Extract Codes</strong> to run AI analysis.</div>
              </div>
            )}
            {aiMessages.map((msg, i) => {
              if (msg.type === 'thinking') return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text3)', fontSize: 12 }}>
                  <div className="dots"><span /><span /><span /></div>Parsing clinical note…
                </div>
              );
              if (msg.type === 'error') return <div key={i} className="ai-msg" style={{ color: 'var(--red)' }}>{msg.text}</div>;
              if (msg.type === 'result') {
                const p = msg.data;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="ai-msg">
                      <div className="ai-sec">Principal Dx</div>
                      <span className="ai-code" style={{ fontSize: 14 }}>{p.principal_dx || '—'}</span>
                      <span style={{ color: 'var(--text2)', fontSize: 12, marginLeft: 6 }}>{(p.icd10 || [])[0]?.description || ''}</span>
                      <div className="ai-sec" style={{ marginTop: 10 }}>E&amp;M Level</div>
                      <span className="ai-code" style={{ fontSize: 14 }}>{p.em_level || '—'}</span>
                    </div>
                    <div className="ai-msg">
                      <div className="ai-sec">ICD-10 Summary</div>
                      {(p.icd10 || []).map((c, j) => (
                        <div key={j} className="ai-row">
                          <span><span className="ai-code">{c.code}</span> <span style={{ fontSize: 11, color: 'var(--text2)' }}>{c.description}</span></span>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>{c.confidence}%</span>
                        </div>
                      ))}
                    </div>
                    <div className="ai-msg">
                      <div className="ai-sec">CPT Summary</div>
                      {(p.cpt || []).map((c, j) => (
                        <div key={j} className="ai-row">
                          <span><span className="ai-code">{c.code}</span> <span style={{ fontSize: 11, color: 'var(--text2)' }}>{c.category}</span></span>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>{c.confidence}%</span>
                        </div>
                      ))}
                    </div>
                    <div className="ai-msg">
                      <div className="ai-sec">Rationale</div>
                      <span style={{ fontSize: 12, lineHeight: 1.65 }}>{p.summary || ''}</span>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </aside>
      </div>

      {/* Bottom Nav */}
      <div className="ac-bottom">
        <div className="btabs">
          {[['note','📋 Note Input'],['icd','🏥 ICD-10'],['cpt','⚕️ CPT'],['billing','💳 Billing Summary']].map(([id, label]) => (
            <button key={id} className={`btab${tab === id ? ' on' : ''}`} onClick={() => switchTab(id)}>
              {label}
              <span className="tab-cnt">
                {id === 'icd' ? icdCodes.length : id === 'cpt' ? cptCodes.length : id === 'billing' ? selIcd.length + selCpt.length : ''}
              </span>
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>Step {TABS.indexOf(tab) + 1} of 4</span>
        </div>
        <div className="bnav2">
          <button className="nbtn" onClick={navBack} style={{ opacity: tab === 'note' ? .4 : 1, pointerEvents: tab === 'note' ? 'none' : 'auto' }}>← Back</button>
          <div style={{ flex: 1 }} />
          <button className="nbtn primary" onClick={navNext} style={{ opacity: tab === 'billing' ? .4 : 1, pointerEvents: tab === 'billing' ? 'none' : 'auto' }}>Next →</button>
        </div>
      </div>

      <div className={`copy-toast${toast ? ' show' : ''}`}>Copied to clipboard!</div>
      
      <ClinicalTabBar currentPage="AutoCoder" />
    </div>
  );
}