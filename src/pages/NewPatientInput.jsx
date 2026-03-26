import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import MedicalDecisionMaking from "@/pages/MedicalDecisionMaking";
import DischargeSummaryTab from "@/components/notes/DischargeSummaryTab/index";

import DemoTab from "@/components/npi/DemoTab";
import CCTab from "@/components/npi/CCTab";
import VitalsTab from "@/components/npi/VitalsTab";
import MedsTab from "@/components/npi/MedsTab";
import ROSTab from "@/components/npi/ROSTab";
import PETab from "@/components/npi/PETab";
import AutoCoderTab from "@/components/npi/AutoCoderTab";
import PatientChart from "@/pages/PatientChart";
import NotryaApp from "@/pages/NotryaApp";
import EDProcedureNotes from "@/pages/EDProcedureNotes";
import MedicationReferencePage from "@/pages/MedicationReference";

import { ROS_SYSTEMS, PE_SYSTEMS, PMH_SYSTEMS, TABS } from "@/components/npi/npiData";

const SIDEBAR_GROUPS = [
  {
    label: 'Intake',
    items: [
      { id: 'chart',     icon: '📊', label: 'Patient Chart' },
      { id: 'demo',      icon: '👤', label: 'Demographics' },
      { id: 'cc',        icon: '💬', label: 'Chief Complaint' },
      { id: 'vit',       icon: '📈', label: 'Vitals' },
    ]
  },
  {
    label: 'Documentation',
    items: [
      { id: 'meds',      icon: '💊', label: 'Meds & PMH' },
      { id: 'ros',       icon: '🔍', label: 'Review of Systems' },
      { id: 'pe',        icon: '🩺', label: 'Physical Exam' },
      { id: 'mdm',       icon: '⚖️', label: 'MDM' },
    ]
  },
  {
    label: 'Disposition',
    items: [
      { id: 'orders',    icon: '📋', label: 'Orders' },
      { id: 'discharge', icon: '🚪', label: 'Discharge' },
      { id: 'erplan',    icon: '🗺️', label: 'ER Plan Builder' },
    ]
  },
  {
    label: 'Tools',
    items: [
      { id: 'autocoder', icon: '🤖', label: 'AutoCoder' },
      { id: 'erx',       icon: '💉', label: 'eRx' },
      { id: 'procedures',icon: '✂️', label: 'Procedures' },
      { id: 'medref',    icon: '🧬', label: 'ED Med Ref' },
    ]
  },
];

const ALL_TABS = SIDEBAR_GROUPS.flatMap(g => g.items).map(i => i.id);

export default function NewPatientInput() {
  const navigate = useNavigate();

  const [demo, setDemo] = useState({ firstName: '', lastName: '', age: '', dob: '', sex: '', mrn: '', insurance: '', insuranceId: '', address: '', city: '', phone: '', email: '', emerg: '', height: '', weight: '', lang: '', notes: '', pronouns: '' });
  const [cc, setCC] = useState({ text: '', onset: '', duration: '', severity: '', quality: '', radiation: '', aggravate: '', relieve: '', assoc: '', hpi: '' });
  const [vitals, setVitals] = useState({});
  const [medications, setMedications] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [pmhSelected, setPmhSelected] = useState({});
  const [pmhExtra, setPmhExtra] = useState('');
  const [surgHx, setSurgHx] = useState('');
  const [famHx, setFamHx] = useState('');
  const [socHx, setSocHx] = useState('');
  const [rosState, setRosState] = useState({});
  const [rosSymptoms, setRosSymptoms] = useState({});
  const [rosNotes, setRosNotes] = useState({});
  const [peState, setPeState] = useState({});
  const [peFindings, setPeFindings] = useState({});
  const [selectedCC, setSelectedCC] = useState(-1);
  const location = useLocation();
  const [currentTab, setCurrentTab] = useState(() => new URLSearchParams(window.location.search).get('tab') || 'demo');

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab) setCurrentTab(tab);
  }, [location.search]);
  const [parseText, setParseText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [pmhExpanded, setPmhExpanded] = useState({ cardio: true, endo: true });
  const [avpu, setAvpu] = useState('');
  const [o2del, setO2del] = useState('');
  const [pain, setPain] = useState('');
  const [triage, setTriage] = useState('');
  const [aiMessages, setAiMessages] = useState([{ role: 'sys', text: 'Assistant ready. Select a quick action or ask a clinical question.' }]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [clock, setClock] = useState('');
  const chatRef = useRef(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiUnread, setAiUnread] = useState(0);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`);
    };
    tick();
    const t = setInterval(tick, 10000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    localStorage.setItem('npiPatientData', JSON.stringify({ firstName: demo.firstName, lastName: demo.lastName, age: demo.age, dob: demo.dob, sex: demo.sex, mrn: demo.mrn, weight: demo.weight, insurance: demo.insurance, insuranceId: demo.insuranceId, medications, allergies }));
  }, [demo, medications, allergies]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [aiMessages, aiLoading]);

  const patientName = [demo.firstName, demo.lastName].filter(Boolean).join(' ') || 'New Patient';

  const getTabStatus = (id) => {
    if (id === 'demo') return (demo.firstName || demo.age) ? (demo.firstName && demo.age ? 'done' : 'partial') : 'empty';
    if (id === 'cc')   return cc.text ? 'done' : 'empty';
    if (id === 'vit')  return Object.values(vitals).some(v => v) ? 'done' : 'empty';
    if (id === 'meds') return (medications.length > 0 || Object.values(pmhSelected).some(Boolean)) ? 'partial' : 'empty';
    if (id === 'ros')  return Object.values(rosState).some(v => v > 0) ? 'partial' : 'empty';
    if (id === 'pe')   return Object.values(peState).some(v => v > 0) ? 'partial' : 'empty';
    return 'empty';
  };

  const dotColor = (status) => {
    if (status === 'done')    return 'var(--teal)';
    if (status === 'partial') return 'var(--orange)';
    if (status === 'current') return 'var(--blue)';
    return 'var(--txt4)';
  };

  const appendAiMsg = (role, text) => { setAiMessages(prev => [...prev, { role, text }]); if (!aiOpen) setAiUnread(n => n + 1); };

  const buildContext = () => {
    let ctx = `Patient: ${patientName}, Age ${demo.age || '?'}, ${demo.sex || '?'}. CC: ${cc.text || 'not entered'}. `;
    if (medications.length) ctx += `Meds: ${medications.join(', ')}. `;
    if (allergies.length) ctx += `Allergies: ${allergies.join(', ')}. `;
    return ctx;
  };

  const sendAI = async (q) => {
    const question = q || aiInput.trim();
    if (!question || aiLoading) return;
    setAiInput('');
    appendAiMsg('user', question);
    setAiLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical assistant in the Notrya patient input tool. Keep responses concise and actionable. [Patient context: ${buildContext()}]\nQuestion: ${question}`,
      });
      appendAiMsg('bot', typeof res === 'string' ? res : JSON.stringify(res));
    } catch (e) {
      appendAiMsg('bot', '⚠️ Unable to connect to AI service.');
    }
    setAiLoading(false);
  };

  const smartParse = async () => {
    if (!parseText.trim()) { toast.error('Please enter some text to parse.'); return; }
    setParsing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract structured patient data from the following text. Return ONLY valid JSON.\nText: ${parseText}`,
        response_json_schema: {
          type: 'object',
          properties: {
            firstName: { type: 'string' }, lastName: { type: 'string' }, age: { type: 'string' }, sex: { type: 'string' }, dob: { type: 'string' },
            cc: { type: 'string' }, onset: { type: 'string' }, duration: { type: 'string' }, severity: { type: 'string' }, quality: { type: 'string' },
            bp: { type: 'string' }, hr: { type: 'string' }, rr: { type: 'string' }, spo2: { type: 'string' }, temp: { type: 'string' }, gcs: { type: 'string' },
            medications: { type: 'array', items: { type: 'string' } },
            allergies: { type: 'array', items: { type: 'string' } },
            pmh: { type: 'array', items: { type: 'string' } },
          }
        }
      });
      setDemo(prev => ({ ...prev, firstName: result.firstName || prev.firstName, lastName: result.lastName || prev.lastName, age: result.age || prev.age, sex: result.sex || prev.sex, dob: result.dob || prev.dob }));
      setCC(prev => ({ ...prev, text: result.cc || prev.text, onset: result.onset || prev.onset, duration: result.duration || prev.duration, severity: result.severity || prev.severity, quality: result.quality || prev.quality }));
      setVitals(prev => ({ ...prev, bp: result.bp || prev.bp || '', hr: result.hr || prev.hr || '', rr: result.rr || prev.rr || '', spo2: result.spo2 || prev.spo2 || '', temp: result.temp || prev.temp || '', gcs: result.gcs || prev.gcs || '' }));
      (result.medications || []).forEach(m => { if (m && !medications.includes(m)) setMedications(p => [...p, m]); });
      (result.allergies || []).forEach(a => { if (a && !allergies.includes(a)) setAllergies(p => [...p, a]); });
      toast.success('Patient data extracted!');
    } catch (e) {
      toast.error('Could not parse automatically.');
    }
    setParsing(false);
  };

  const savePatient = async () => {
    try {
      const pmhList = Object.entries(pmhSelected).filter(([, v]) => v > 0).map(([k]) => k);
      const payload = {
        raw_note: parseText || `Patient ${patientName} presenting with ${cc.text || 'unspecified complaint'}`,
        patient_name: patientName, patient_id: demo.mrn || '', patient_age: demo.age || '',
        patient_gender: demo.sex?.toLowerCase() === 'male' ? 'male' : demo.sex?.toLowerCase() === 'female' ? 'female' : 'other',
        date_of_birth: demo.dob || '', chief_complaint: cc.text || '',
        history_of_present_illness: cc.hpi || '',
        vital_signs: { blood_pressure: vitals.bp || '', heart_rate: vitals.hr ? { value: parseFloat(vitals.hr), unit: 'bpm' } : undefined },
        medical_history: pmhList.join(', '), medications, allergies, status: 'draft',
      };
      const created = await base44.entities.ClinicalNote.create(payload);
      toast.success('Patient saved — opening Clinical Note Studio');
      navigate(`/ClinicalNoteStudio?noteId=${created.id}`);
    } catch (e) {
      toast.error('Failed to save: ' + e.message);
    }
  };

  const resetForm = () => {
    setDemo({ firstName: '', lastName: '', age: '', dob: '', sex: '', mrn: '', insurance: '', insuranceId: '', address: '', city: '', phone: '', email: '', emerg: '', height: '', weight: '', lang: '', notes: '', pronouns: '' });
    setCC({ text: '', onset: '', duration: '', severity: '', quality: '', radiation: '', aggravate: '', relieve: '', assoc: '', hpi: '' });
    setVitals({}); setMedications([]); setAllergies([]); setPmhSelected({});
    setRosState({}); setRosSymptoms({}); setRosNotes({}); setPeState({}); setPeFindings({});
    navigate('/NewPatientInput?tab=demo'); setParseText('');
    toast.success('New patient form cleared');
  };

  const navNext = () => { const i = ALL_TABS.indexOf(currentTab); if (i < ALL_TABS.length - 1) navigate(`/NewPatientInput?tab=${ALL_TABS[i + 1]}`); };
  const navBack = () => { const i = ALL_TABS.indexOf(currentTab); if (i > 0) navigate(`/NewPatientInput?tab=${ALL_TABS[i - 1]}`); };

  const currentLabel = SIDEBAR_GROUPS.flatMap(g => g.items).find(i => i.id === currentTab)?.label || '';
  const prevLabel = ALL_TABS.indexOf(currentTab) > 0 ? (SIDEBAR_GROUPS.flatMap(g => g.items).find(i => i.id === ALL_TABS[ALL_TABS.indexOf(currentTab) - 1])?.label || '') : '';

  const S = { // style tokens
    bg: '#050f1e', panel: '#081628', card: '#0b1e36', up: '#0e2544',
    border: '#1a3555', borderHi: '#2a4f7a',
    blue: '#3b9eff', cyan: '#00d4ff', teal: '#00e5c0',
    gold: '#f5c842', coral: '#ff6b6b', orange: '#ff9f43',
    txt: '#e8f0fe', txt2: '#8aaccc', txt3: '#4a6a8a', txt4: '#2e4a6a',
  };

  const vbAbn = (v, lo, hi) => {
    if (!v) return false;
    const n = parseFloat(v);
    return (hi && n > hi) || (lo && n < lo);
  };

  const FAB_CSS = `
    .npi-fab-ring { position:fixed; bottom:66px; right:22px; width:52px; height:52px; border-radius:50%; z-index:399; pointer-events:none; animation:fabring 2.4s ease-out infinite; }
    @keyframes fabring { 0%{box-shadow:0 0 0 0 rgba(0,229,192,.5)} 70%{box-shadow:0 0 0 14px rgba(0,229,192,0)} 100%{box-shadow:0 0 0 0 rgba(0,229,192,0)} }
    .npi-fab { position:fixed; bottom:66px; right:22px; width:52px; height:52px; border-radius:50%; background:linear-gradient(135deg,#00e5c0 0%,#00b8a9 100%); border:none; cursor:pointer; z-index:400; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 20px rgba(0,229,192,.35),0 2px 8px rgba(0,0,0,.4); transition:transform .2s,box-shadow .2s; font-size:20px; }
    .npi-fab:hover { transform:scale(1.08); box-shadow:0 6px 28px rgba(0,229,192,.5),0 4px 12px rgba(0,0,0,.4); }
    .npi-fab.open { transform:scale(0.94); }
    .npi-fab-badge { position:absolute; top:-3px; right:-3px; width:18px; height:18px; border-radius:50%; background:#ff6b6b; border:2px solid #050f1e; font-size:9px; font-weight:700; color:#fff; display:flex; align-items:center; justify-content:center; animation:badgepop .3s cubic-bezier(.34,1.56,.64,1); }
    @keyframes badgepop { 0%{transform:scale(0)} 100%{transform:scale(1)} }
    .npi-ai-float { position:fixed; bottom:130px; right:18px; width:340px; height:520px; background:#081628; border:1px solid #2a4f7a; border-radius:16px; z-index:400; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 12px 48px rgba(0,0,0,.6),0 4px 16px rgba(0,229,192,.08); transform-origin:bottom right; animation:npi-chatopen .22s cubic-bezier(.34,1.3,.64,1); }
    @keyframes npi-chatopen { 0%{opacity:0;transform:scale(.85) translateY(20px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
    .npi-ai-hdr { flex-shrink:0; padding:0 14px; background:linear-gradient(135deg,rgba(0,229,192,.12) 0%,rgba(59,158,255,.06) 100%); border-bottom:1px solid #1a3555; display:flex; flex-direction:column; }
    .npi-ai-hdr-top { height:44px; display:flex; align-items:center; gap:8px; }
    .npi-ai-avatar { width:28px; height:28px; border-radius:50%; background:rgba(0,229,192,.15); border:1px solid rgba(0,229,192,.4); display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0; }
    .npi-ai-close { margin-left:auto; width:24px; height:24px; border-radius:50%; background:#0e2544; border:1px solid #1a3555; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#4a6a8a; font-size:13px; transition:all .15s; }
    .npi-ai-close:hover { border-color:#2a4f7a; color:#e8f0fe; }
    .npi-ai-chips { display:flex; gap:4px; flex-wrap:wrap; padding-bottom:10px; }
    .npi-ai-chip { padding:3px 9px; border-radius:20px; font-size:10px; cursor:pointer; background:#0e2544; border:1px solid #1a3555; color:#8aaccc; transition:all .15s; white-space:nowrap; }
    .npi-ai-chip:hover { border-color:#00e5c0; color:#00e5c0; background:rgba(0,229,192,.06); }
    .npi-ai-ctx { margin:0 14px 10px; background:rgba(59,158,255,.08); border:1px solid rgba(59,158,255,.2); border-radius:6px; padding:5px 10px; font-size:10px; color:#3b9eff; font-family:'JetBrains Mono',monospace; display:flex; align-items:center; gap:6px; flex-shrink:0; }
    .npi-ai-msgs { flex:1; overflow-y:auto; padding:10px 12px; display:flex; flex-direction:column; gap:8px; }
    .npi-ai-msgs::-webkit-scrollbar { width:3px; } .npi-ai-msgs::-webkit-scrollbar-thumb { background:#1a3555; border-radius:2px; }
    .npi-bubble { max-width:88%; padding:9px 11px; border-radius:12px; font-size:12px; line-height:1.55; animation:bubblein .18s ease-out; }
    @keyframes bubblein { 0%{opacity:0;transform:translateY(6px)} 100%{opacity:1;transform:translateY(0)} }
    .npi-bubble.sys { background:#0e2544; color:#4a6a8a; font-style:italic; border:1px solid #1a3555; max-width:100%; font-size:11px; }
    .npi-bubble.user { background:rgba(59,158,255,.15); border:1px solid rgba(59,158,255,.25); color:#e8f0fe; align-self:flex-end; border-bottom-right-radius:3px; }
    .npi-bubble.bot { background:#0b1e36; border:1px solid #1a3555; color:#e8f0fe; align-self:flex-start; border-bottom-left-radius:3px; }
    .npi-typing { display:flex; gap:4px; padding:9px 11px; background:#0b1e36; border:1px solid #1a3555; border-radius:12px; border-bottom-left-radius:3px; align-self:flex-start; align-items:center; }
    .npi-typing span { width:5px; height:5px; border-radius:50%; background:#00e5c0; animation:typing 1.2s ease-in-out infinite; }
    .npi-typing span:nth-child(2){animation-delay:.2s} .npi-typing span:nth-child(3){animation-delay:.4s}
    @keyframes typing{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-5px);opacity:1}}
    .npi-ai-input-row { flex-shrink:0; padding:10px 12px; border-top:1px solid #1a3555; display:flex; gap:6px; align-items:flex-end; background:#081628; }
    .npi-ai-input { flex:1; background:#0e2544; border:1px solid #1a3555; border-radius:10px; padding:8px 10px; color:#e8f0fe; font-size:12px; outline:none; resize:none; font-family:'DM Sans',sans-serif; line-height:1.4; max-height:80px; transition:border-color .15s; }
    .npi-ai-input:focus { border-color:rgba(0,229,192,.5); } .npi-ai-input::placeholder { color:#2e4a6a; }
    .npi-ai-send { width:34px; height:34px; border-radius:50%; flex-shrink:0; background:#00e5c0; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:15px; color:#050f1e; font-weight:700; transition:all .15s; }
    .npi-ai-send:hover { filter:brightness(1.15); transform:scale(1.05); }
    .npi-ai-send:disabled { background:#0e2544; border:1px solid #1a3555; color:#2e4a6a; cursor:not-allowed; transform:none; }
    .npi-ai-footer { padding:5px 14px; border-top:1px solid rgba(26,53,85,.4); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .npi-model-badge { font-family:'JetBrains Mono',monospace; font-size:9px; background:#0e2544; border:1px solid #1a3555; border-radius:20px; padding:2px 8px; color:#2e4a6a; }
    .npi-ai-dot { width:5px; height:5px; border-radius:50%; background:#00e5c0; animation:aipulse 2s ease-in-out infinite; }
    @keyframes aipulse{0%,100%{box-shadow:0 0 0 0 rgba(0,229,192,.4)}50%{box-shadow:0 0 0 5px rgba(0,229,192,0)}}
  `;

  return (
    <div style={{ color: S.txt, fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>

      {/* FLOATING AI FAB — only on non-chart tabs */}
      {currentTab !== 'chart' && (
        <>
          {!aiOpen && <div className="npi-fab-ring" />}
          <button className={`npi-fab${aiOpen ? ' open' : ''}`} onClick={() => { setAiOpen(o => !o); setAiUnread(0); }} title="Notrya AI">
            {aiOpen ? '✕' : '🤖'}
            {!aiOpen && aiUnread > 0 && <span className="npi-fab-badge">{aiUnread}</span>}
          </button>
          {aiOpen && (
            <div className="npi-ai-float">
              <div className="npi-ai-hdr">
                <div className="npi-ai-hdr-top">
                  <div className="npi-ai-avatar">🤖</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f0fe' }}>Notrya AI</div>
                    <div style={{ fontSize: 10, color: '#00e5c0', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'JetBrains Mono,monospace' }}><div className="npi-ai-dot" /> Live · Patient Context</div>
                  </div>
                  <div className="npi-ai-close" onClick={() => setAiOpen(false)}>✕</div>
                </div>
                <div className="npi-ai-chips">
                  {[['📝 Summarize','Summarize the patient data entered so far.'],['💊 Drug Check','Check for interactions in the current medication list.'],['🔍 DDx','Suggest a differential diagnosis for the chief complaint.'],['📋 Orders','What orders are appropriate for this presentation?']].map(([lbl,q]) => (
                    <button key={lbl} className="npi-ai-chip" onClick={() => sendAI(q)}>{lbl}</button>
                  ))}
                </div>
              </div>
              <div className="npi-ai-ctx">
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b9eff', flexShrink: 0 }} />
                <span>{patientName} · {demo.age ? demo.age + 'y' : 'age ?'} · {cc.text || 'CC not entered'}</span>
              </div>
              <div className="npi-ai-msgs" ref={chatRef}>
                {aiMessages.map((m, i) => (
                  <div key={i} className={`npi-bubble ${m.role}`}>{m.text}</div>
                ))}
                {aiLoading && <div className="npi-typing"><span /><span /><span /></div>}
              </div>
              <div className="npi-ai-input-row">
                <textarea className="npi-ai-input" rows={1} placeholder="Ask about this patient…" value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAI(); } }} />
                <button className="npi-ai-send" onClick={() => sendAI()} disabled={aiLoading || !aiInput.trim()}>↑</button>
              </div>
              <div className="npi-ai-footer"><span className="npi-model-badge">Powered by Notrya AI</span></div>
            </div>
          )}
        </>
      )}

      {/* MAIN CONTENT */}
      <main style={{ padding: '0', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {currentTab === 'demo' && (
            <DemoTab demo={demo} setDemo={setDemo} parseText={parseText} setParseText={setParseText} parsing={parsing} onSmartParse={smartParse} />
          )}
          {currentTab === 'cc' && (
            <CCTab cc={cc} setCC={setCC} selectedCC={selectedCC} setSelectedCC={setSelectedCC} />
          )}
          {currentTab === 'vit' && (
            <VitalsTab vitals={vitals} setVitals={setVitals} avpu={avpu} setAvpu={setAvpu} o2del={o2del} setO2del={setO2del} pain={pain} setPain={setPain} triage={triage} setTriage={setTriage} />
          )}
          {currentTab === 'meds' && (
            <MedsTab medications={medications} setMedications={setMedications} allergies={allergies} setAllergies={setAllergies} pmhSelected={pmhSelected} setPmhSelected={setPmhSelected} pmhExtra={pmhExtra} setPmhExtra={setPmhExtra} surgHx={surgHx} setSurgHx={setSurgHx} famHx={famHx} setFamHx={setFamHx} socHx={socHx} setSocHx={setSocHx} pmhExpanded={pmhExpanded} setPmhExpanded={setPmhExpanded} />
          )}
          {currentTab === 'ros' && (
            <ROSTab />
          )}
          {currentTab === 'pe' && (
            <PETab peState={peState} setPeState={setPeState} peFindings={peFindings} setPeFindings={setPeFindings} />
          )}
          {currentTab === 'chart' && (
            <div style={{ margin: '-20px -24px', minHeight: 'calc(100vh - 138px)', overflow: 'hidden' }}>
              <NotryaApp />
            </div>
          )}
          {currentTab === 'mdm' && (
            <MedicalDecisionMaking embedded patientName={patientName} chiefComplaint={cc.text} />
          )}
          {currentTab === 'discharge' && (
            <div style={{ margin: '-20px -24px', height: 'calc(100vh - 138px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <DischargeSummaryTab
                note={{
                  assessment: cc.text || '',
                  summary: cc.hpi || '',
                  diagnoses: [],
                  medications,
                  allergies,
                }}
                noteId={null}
                queryClient={null}
                isFirstTab={() => false}
                isLastTab={() => true}
                handleBack={() => navigate('/NewPatientInput?tab=medref')}
                handleNext={() => {}}
              />
            </div>
          )}
          {currentTab === 'autocoder' && (
            <AutoCoderTab patientName={patientName} patientMrn={demo.mrn} patientDob={demo.dob} patientAge={demo.age} patientGender={demo.sex} chiefComplaint={cc.text} vitals={vitals} medications={medications} allergies={allergies} pmhSelected={pmhSelected} rosState={rosState} rosSymptoms={rosSymptoms} peState={peState} peFindings={peFindings} />
          )}
          {currentTab === 'erplan' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center', height: 300 }}>
              <div style={{ fontSize: 32 }}>🗺️</div>
              <div style={{ color: S.txt2, fontSize: 14 }}>ER Plan Builder</div>
              <button onClick={() => navigate('/ERPlanBuilder')} style={{ background: S.teal, color: S.bg, border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Open ER Plan Builder →</button>
            </div>
          )}
          {currentTab === 'erx' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center', height: 300 }}>
              <div style={{ fontSize: 32 }}>💉</div>
              <div style={{ color: S.txt2, fontSize: 14 }}>eRx — Electronic Prescriptions</div>
              <button onClick={() => navigate('/ERx')} style={{ background: S.teal, color: S.bg, border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Open eRx →</button>
            </div>
          )}
          {currentTab === 'procedures' && (
            <EDProcedureNotes
              embedded
              patientName={patientName}
              patientAllergies={allergies.join(', ')}
              physicianName={''}
            />
          )}
          {currentTab === 'medref' && (
            <div style={{ margin: '-20px -24px', height: 'calc(100vh - 138px)', overflow: 'auto' }}>
              <MedicationReferencePage embedded />
            </div>
          )}
          {currentTab === 'orders' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center', height: 300 }}>
              <div style={{ fontSize: 32 }}>📋</div>
              <div style={{ color: S.txt2, fontSize: 14 }}>Orders</div>
              <button onClick={() => navigate('/OrderSetBuilder')} style={{ background: S.teal, color: S.bg, border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Open Order Set Builder →</button>
            </div>
          )}
      </main>

      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:0.4}40%{transform:translateY(-6px);opacity:1}}`}</style>
      <style>{FAB_CSS}</style>
    </div>
  );
}