import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import MDMPanel from "@/components/mdm/MDMPanel";
import DischargePlanningWrapper from "@/components/discharge/DischargePlanningWrapper.jsx";
import ClinicalTabBar from "@/components/shared/ClinicalTabBar";
import "../components/npi/npi.css";

import DemoTab from "@/components/npi/DemoTab";
import CCTab from "@/components/npi/CCTab";
import VitalsTab from "@/components/npi/VitalsTab";
import MedsTab from "@/components/npi/MedsTab";
import ROSTab from "@/components/npi/ROSTab";
import PETab from "@/components/npi/PETab";
import SummaryTab from "@/components/npi/SummaryTab";

import { VITAL_DEFS, ROS_SYSTEMS, PE_SYSTEMS, PMH_SYSTEMS, TABS } from "@/components/npi/npiData";

const SIDEBAR_ITEMS = [
  { id: 'demo', icon: '👤', label: 'Demographics' },
  { id: 'cc', icon: '🗣️', label: 'Chief Complaint' },
  { id: 'vit', icon: '📊', label: 'Vitals' },
  { id: 'meds', icon: '💊', label: 'Medications & PMH' },
  { id: 'ros', icon: '🔍', label: 'Review of Systems' },
  { id: 'pe', icon: '🩺', label: 'Physical Exam' },
  { id: 'sum', icon: '📋', label: 'Summary' },
  { id: 'mdm', icon: '⚖️', label: 'MDM' },
  { id: 'discharge', icon: '🏥', label: 'Discharge' },
];

export default function NewPatientInput() {
  const navigate = useNavigate();

  const [demo, setDemo] = useState({ firstName: '', lastName: '', age: '', dob: '', sex: '', mrn: '', insurance: '', address: '', city: '', phone: '', email: '', emerg: '', height: '', weight: '', lang: '', notes: '', pronouns: '' });
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
  const [currentTab, setCurrentTab] = useState(() => new URLSearchParams(window.location.search).get('tab') || 'demo');
  const [parseText, setParseText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [pmhExpanded, setPmhExpanded] = useState({ cardio: true, endo: true });
  const [avpu, setAvpu] = useState('');
  const [o2del, setO2del] = useState('');
  const [pain, setPain] = useState('');
  const [triage, setTriage] = useState('');
  const [aiMessages, setAiMessages] = useState([{ role: 'sys', text: "Welcome. I'll assist as you build this patient record — suggesting red flags, relevant ROS items, exam findings, and differential diagnoses as you enter data." }]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [convoHistory, setConvoHistory] = useState([]);
  const [aiOpen, setAiOpen] = useState(true);
  const [sbOpen, setSbOpen] = useState(true);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [aiMessages, aiLoading]);

  const patientName = [demo.firstName, demo.lastName].filter(Boolean).join(' ') || 'New Patient';

  const progress = (() => {
    let s = 0;
    if (demo.firstName || demo.age) s++;
    if (cc.text) s++;
    if (Object.values(vitals).some(v => v)) s++;
    if (medications.length > 0 || Object.values(pmhSelected).some(Boolean)) s++;
    if (Object.values(rosState).some(v => v > 0)) s++;
    if (Object.values(peState).some(v => v > 0)) s++;
    return Math.round((s / 6) * 100);
  })();

  const getVitalStatus = (id) => {
    const def = VITAL_DEFS.find(v => v.id === id);
    if (!def) return '';
    const val = parseFloat(vitals[id]);
    if (isNaN(val)) return '';
    if (def.hi !== null && val > def.hi) return 'abn';
    if (def.lo !== null && val < def.lo) return 'lo';
    return 'ok';
  };

  const showTab = (name) => setCurrentTab(name);
  const navNext = () => { const i = TABS.indexOf(currentTab); if (i < TABS.length - 1) setCurrentTab(TABS[i + 1]); };
  const navBack = () => { const i = TABS.indexOf(currentTab); if (i > 0) setCurrentTab(TABS[i - 1]); };

  const appendAiMsg = (role, text) => setAiMessages(prev => [...prev, { role, text }]);

  const buildContext = () => {
    let ctx = `Patient: ${patientName}, Age ${demo.age || '?'}, ${demo.sex || '?'}. CC: ${cc.text || 'not entered'}. `;
    if (medications.length) ctx += `Meds: ${medications.join(', ')}. `;
    if (allergies.length) ctx += `Allergies: ${allergies.join(', ')}. `;
    const pmhList = Object.entries(pmhSelected).filter(([, v]) => v > 0).map(([k]) => k);
    if (pmhList.length) ctx += `PMHx: ${pmhList.join(', ')}. `;
    const rosAbn = ROS_SYSTEMS.filter(s => rosState[s.id] === 2).map(s => s.name);
    if (rosAbn.length) ctx += `ROS abnormal: ${rosAbn.join(', ')}. `;
    const peAbn = PE_SYSTEMS.filter(s => peState[s.id] === 2).map(s => s.name);
    if (peAbn.length) ctx += `PE abnormal: ${peAbn.join(', ')}. `;
    if (vitals.hr) ctx += `HR ${vitals.hr}, SpO2 ${vitals.spo2}%, Temp ${vitals.temp}°C. `;
    return ctx;
  };

  const sendAI = async (q) => {
    const question = q || aiInput.trim();
    if (!question || aiLoading) return;
    setAiInput('');
    appendAiMsg('user', question);
    setAiLoading(true);
    const newHistory = [...convoHistory, { role: 'user', content: `[Patient context: ${buildContext()}]\nQuestion: ${question}` }];
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical assistant in the Notrya patient input tool. Keep responses concise and actionable. Use brief bullet points. [Patient context: ${buildContext()}]\nQuestion: ${question}`,
      });
      const reply = typeof res === 'string' ? res : JSON.stringify(res);
      setConvoHistory([...newHistory, { role: 'assistant', content: reply }]);
      appendAiMsg('bot', reply);
    } catch (e) {
      appendAiMsg('bot', '⚠️ Unable to connect to AI service.');
    }
    setAiLoading(false);
  };

  const aiGenerateNote = async () => {
    appendAiMsg('user', 'Generate a full structured clinical note from this patient data');
    setAiLoading(true);
    try {
      const rosAbn = ROS_SYSTEMS.filter(s => rosState[s.id] === 2).map(s => `${s.name}: ABNORMAL${rosSymptoms[s.id]?.length ? ' — ' + rosSymptoms[s.id].join(', ') : ''}`).join('\n');
      const rosNorm = ROS_SYSTEMS.filter(s => rosState[s.id] === 1).map(s => s.name).join(', ');
      const peAbn = PE_SYSTEMS.filter(s => peState[s.id] === 2).map(s => `${s.name}: ${peFindings[s.id] || 'Abnormal'}`).join('\n');
      const peNorm = PE_SYSTEMS.filter(s => peState[s.id] === 1).map(s => s.name).join(', ');
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a professionally formatted clinical note for this patient. Use standard SOAP structure.\n\n${buildContext()}\nROS Positive: ${rosAbn || 'None'}\nROS Negative: ${rosNorm || 'None'}\nPE Abnormal: ${peAbn || 'None'}\nPE Normal: ${peNorm || 'None'}\n\nFormat: Patient Details, CC, HPI, Vitals, ROS, PE, Initial Impression, Plan.`,
      });
      appendAiMsg('bot', typeof res === 'string' ? res : JSON.stringify(res));
    } catch (e) {
      appendAiMsg('bot', '⚠️ Could not generate note.');
    }
    setAiLoading(false);
  };

  const smartParse = async () => {
    if (!parseText.trim()) { toast.error('Please enter some text to parse.'); return; }
    setParsing(true);
    appendAiMsg('user', '📋 Smart Parse: ' + parseText.substring(0, 80) + '...');
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract structured patient data from the following text. Return ONLY valid JSON.\nText: ${parseText}`,
        response_json_schema: {
          type: 'object',
          properties: {
            firstName: { type: 'string' }, lastName: { type: 'string' }, age: { type: 'string' }, sex: { type: 'string' }, dob: { type: 'string' },
            cc: { type: 'string' }, onset: { type: 'string' }, duration: { type: 'string' }, severity: { type: 'string' }, quality: { type: 'string' },
            radiation: { type: 'string' }, aggravating: { type: 'string' }, relieving: { type: 'string' }, associated: { type: 'string' },
            bp: { type: 'string' }, hr: { type: 'string' }, rr: { type: 'string' }, spo2: { type: 'string' }, temp: { type: 'string' }, gcs: { type: 'string' },
            medications: { type: 'array', items: { type: 'string' } },
            allergies: { type: 'array', items: { type: 'string' } },
            pmh: { type: 'array', items: { type: 'string' } },
          }
        }
      });
      setDemo(prev => ({ ...prev, firstName: result.firstName || prev.firstName, lastName: result.lastName || prev.lastName, age: result.age || prev.age, sex: result.sex || prev.sex, dob: result.dob || prev.dob }));
      setCC(prev => ({ ...prev, text: result.cc || prev.text, onset: result.onset || prev.onset, duration: result.duration || prev.duration, severity: result.severity || prev.severity, quality: result.quality || prev.quality, radiation: result.radiation || prev.radiation, aggravate: result.aggravating || prev.aggravate, relieve: result.relieving || prev.relieve, assoc: result.associated || prev.assoc }));
      setVitals(prev => ({ ...prev, bp: result.bp || prev.bp || '', hr: result.hr || prev.hr || '', rr: result.rr || prev.rr || '', spo2: result.spo2 || prev.spo2 || '', temp: result.temp || prev.temp || '', gcs: result.gcs || prev.gcs || '' }));
      (result.medications || []).forEach(m => { if (m && !medications.includes(m)) setMedications(p => [...p, m]); });
      (result.allergies || []).forEach(a => { if (a && !allergies.includes(a)) setAllergies(p => [...p, a]); });
      const allConditions = PMH_SYSTEMS.flatMap(s => s.conditions);
      (result.pmh || []).forEach(c => {
        allConditions.forEach(pc => {
          if (pc.toLowerCase().includes(c.toLowerCase().split(' ')[0])) {
            setPmhSelected(prev => ({ ...prev, [pc]: prev[pc] || 1 }));
            PMH_SYSTEMS.forEach(sys => { if (sys.conditions.includes(pc)) setPmhExpanded(prev => ({ ...prev, [sys.id]: true })); });
          }
        });
      });
      appendAiMsg('bot', '✅ Patient data extracted and populated into all fields. Review and adjust as needed.');
    } catch (e) {
      appendAiMsg('bot', '⚠️ Could not parse automatically. Please enter data manually.');
    }
    setParsing(false);
  };

  const savePatient = async () => {
    try {
      const pmhList = Object.entries(pmhSelected).filter(([, v]) => v > 0).map(([k]) => k);
      const rosAbnSystems = ROS_SYSTEMS.filter(s => rosState[s.id] === 2);
      const rosNormSystems = ROS_SYSTEMS.filter(s => rosState[s.id] === 1);
      const peAbnSystems = PE_SYSTEMS.filter(s => peState[s.id] === 2);
      const peNormSystems = PE_SYSTEMS.filter(s => peState[s.id] === 1);
      let rosText = '';
      if (rosAbnSystems.length) rosText += 'POSITIVE:\n' + rosAbnSystems.map(s => `  ${s.name}${rosSymptoms[s.id]?.length ? ': ' + rosSymptoms[s.id].join(', ') : ''}`).join('\n');
      if (rosNormSystems.length) rosText += '\nNEGATIVE: ' + rosNormSystems.map(s => s.name).join(', ');
      let peText = '';
      if (peAbnSystems.length) peText += 'ABNORMAL:\n' + peAbnSystems.map(s => `  ${s.name}: ${peFindings[s.id] || 'Abnormal'}`).join('\n');
      if (peNormSystems.length) peText += '\nNORMAL: ' + peNormSystems.map(s => s.name).join(', ');
      const payload = {
        raw_note: parseText || `Patient ${patientName} presenting with ${cc.text || 'unspecified complaint'}`,
        patient_name: patientName, patient_id: demo.mrn || '', patient_age: demo.age || '',
        patient_gender: demo.sex?.toLowerCase() === 'male' ? 'male' : demo.sex?.toLowerCase() === 'female' ? 'female' : 'other',
        date_of_birth: demo.dob || '', chief_complaint: cc.text || '',
        history_of_present_illness: cc.hpi || [cc.onset && `Onset: ${cc.onset}`, cc.duration && `Duration: ${cc.duration}`, cc.quality && `Quality: ${cc.quality}`, cc.radiation && `Radiation: ${cc.radiation}`, cc.aggravate && `Aggravating: ${cc.aggravate}`, cc.relieve && `Relieving: ${cc.relieve}`, cc.assoc && `Associated: ${cc.assoc}`].filter(Boolean).join('. '),
        vital_signs: { blood_pressure: vitals.bp || '', heart_rate: vitals.hr ? { value: parseFloat(vitals.hr), unit: 'bpm' } : undefined, respiratory_rate: vitals.rr ? { value: parseFloat(vitals.rr), unit: 'breaths/min' } : undefined, oxygen_saturation: vitals.spo2 ? { value: parseFloat(vitals.spo2), unit: '%' } : undefined, temperature: vitals.temp ? { value: parseFloat(vitals.temp), unit: 'C' } : undefined },
        medical_history: pmhList.join(', '), medications, allergies, review_of_systems: rosText, physical_exam: peText, status: 'draft',
      };
      const created = await base44.entities.ClinicalNote.create(payload);
      toast.success('Patient saved — opening Clinical Note Studio');
      navigate(`/ClinicalNoteStudio?noteId=${created.id}`);
    } catch (e) {
      toast.error('Failed to save: ' + e.message);
    }
  };

  const resetForm = () => {
    setDemo({ firstName: '', lastName: '', age: '', dob: '', sex: '', mrn: '', insurance: '', address: '', city: '', phone: '', email: '', emerg: '', height: '', weight: '', lang: '', notes: '', pronouns: '' });
    setCC({ text: '', onset: '', duration: '', severity: '', quality: '', radiation: '', aggravate: '', relieve: '', assoc: '', hpi: '' });
    setVitals({}); setMedications([]); setAllergies([]); setPmhSelected({});
    setRosState({}); setRosSymptoms({}); setRosNotes({}); setPeState({}); setPeFindings({});
    setSelectedCC(-1); setCurrentTab('demo'); setParseText('');
    toast.success('New patient form cleared');
  };

  return (
    <div className="npi-root">
      {/* NAVBAR */}
      <nav className="npi-nav">
        <span className="npi-logo">Notrya</span>
        <div className="npi-ndiv" />
        <span className="npi-ntitle">New Patient Input</span>
        <div className="npi-nav-right">
          <button className="npi-nav-btn new" onClick={resetForm}>＋ New Patient</button>
          <button className="npi-nav-btn kb" onClick={() => window.open('/KnowledgeBaseV2', '_blank')}>📚 Knowledge Base</button>
          <button className="npi-save-btn" onClick={savePatient}>💾 Save Patient</button>
          <div className="npi-avatar">DR</div>
        </div>
      </nav>

      {/* VITALS BAR */}
      <div className="npi-vbar">
        <div className="npi-pt-chip">
          <div>
            <div className="npi-pt-name">{patientName}</div>
            <div className="npi-pt-mrn">MRN: {demo.mrn || '—'}</div>
          </div>
        </div>
        <div className="npi-vsep" />
        {VITAL_DEFS.map(v => {
          const val = vitals[v.id] || '—';
          const status = getVitalStatus(v.id);
          return (
            <div key={v.id} className="npi-vchip">
              <div className="npi-vl">{v.label.split(' ')[0]}</div>
              <div className={`npi-vv${status === 'abn' ? ' abn' : status === 'lo' ? ' lo' : ''}`}>{val}{val !== '—' && v.unit === '%' ? '%' : ''}</div>
            </div>
          );
        })}
        <div className="npi-vsep" />
        <div className="npi-vchip">
          <div className="npi-vl">CC</div>
          <div className="npi-vv" style={{ color: 'var(--orange)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cc.text || '—'}</div>
        </div>
        <div className="npi-prog-wrap">
          <div className="npi-prog-label"><span>Completion</span><span>{progress}%</span></div>
          <div className="npi-prog-track"><div className="npi-prog-fill" style={{ width: progress + '%' }} /></div>
        </div>
      </div>

      {/* LAYOUT */}
      <div className="npi-layout">

        {/* SIDEBAR */}
        <aside className={`npi-sb ${sbOpen ? 'open' : 'collapsed'}`}>
          <div className="npi-sb-toggle" onClick={() => setSbOpen(p => !p)} title={sbOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
            {sbOpen ? '◀' : '▶'}
          </div>
          <div className="npi-sb-inner">
            <div className="npi-pt-summary">
              <div className="npi-pts-name">{patientName}</div>
              <div className="npi-pts-meta">Age {demo.age || '—'} · {demo.sex || '—'}</div>
              <div className="npi-pts-cc-label">Chief Complaint</div>
              <div className="npi-pts-cc-val">{cc.text || 'Not entered'}</div>
              {[
                { label: 'Demographics', done: !!(demo.firstName || demo.age) },
                { label: 'Chief Complaint', done: !!cc.text },
                { label: 'Vitals', done: Object.values(vitals).some(v => v) },
                { label: 'Medications & PMH', done: medications.length > 0 || Object.values(pmhSelected).some(v => v > 0) },
                { label: 'Review of Systems', done: Object.values(rosState).some(v => v > 0) },
                { label: 'Physical Exam', done: Object.values(peState).some(v => v > 0) },
              ].map(step => (
                <div key={step.label} className="npi-pts-step">
                  <div className={`npi-step-dot${step.done ? ' done' : ''}`} />
                  <div className="npi-step-label">{step.label}</div>
                </div>
              ))}
            </div>
            <div className="npi-sb-head">Navigation</div>
            {SIDEBAR_ITEMS.map(item => (
              <div key={item.id} className={`npi-sb-item${currentTab === item.id ? ' active' : ''}`} onClick={() => showTab(item.id)}>
                <span>{item.icon}</span><span style={{ flex: 1 }}>{item.label}</span>
              </div>
            ))}
            <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
            <div className="npi-sb-item" style={{ background: 'rgba(0,229,192,.06)', border: '1px solid rgba(0,229,192,.25)', borderRadius: 7, color: 'var(--teal)', fontWeight: 600 }} onClick={() => navigate('/ERPlanBuilder')}>
              <span>🩺</span><span style={{ flex: 1 }}>ER Plan Builder</span><span style={{ fontSize: 9, color: 'var(--teal)', opacity: .7 }}>→</span>
            </div>
            <div className="npi-sb-item" style={{ background: 'rgba(155,109,255,.06)', border: '1px solid rgba(155,109,255,.25)', borderRadius: 7, color: '#9b6dff', fontWeight: 600, marginTop: 4 }} onClick={() => navigate('/EDProcedureNotes')}>
              <span>🩹</span><span style={{ flex: 1 }}>Procedures</span><span style={{ fontSize: 9, color: '#9b6dff', opacity: .7 }}>→</span>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="npi-main">
          <div className={`npi-panel${currentTab === 'demo' ? ' active' : ''}`}>
            <DemoTab demo={demo} setDemo={setDemo} parseText={parseText} setParseText={setParseText} parsing={parsing} onSmartParse={smartParse} />
          </div>
          <div className={`npi-panel${currentTab === 'cc' ? ' active' : ''}`}>
            <CCTab cc={cc} setCC={setCC} selectedCC={selectedCC} setSelectedCC={setSelectedCC} />
          </div>
          <div className={`npi-panel${currentTab === 'vit' ? ' active' : ''}`}>
            <VitalsTab vitals={vitals} setVitals={setVitals} avpu={avpu} setAvpu={setAvpu} o2del={o2del} setO2del={setO2del} pain={pain} setPain={setPain} triage={triage} setTriage={setTriage} />
          </div>
          <div className={`npi-panel${currentTab === 'meds' ? ' active' : ''}`}>
            <MedsTab medications={medications} setMedications={setMedications} allergies={allergies} setAllergies={setAllergies} pmhSelected={pmhSelected} setPmhSelected={setPmhSelected} pmhExtra={pmhExtra} setPmhExtra={setPmhExtra} surgHx={surgHx} setSurgHx={setSurgHx} famHx={famHx} setFamHx={setFamHx} socHx={socHx} setSocHx={setSocHx} pmhExpanded={pmhExpanded} setPmhExpanded={setPmhExpanded} />
          </div>
          <div className={`npi-panel${currentTab === 'ros' ? ' active' : ''}`}>
            <ROSTab rosState={rosState} setRosState={setRosState} rosSymptoms={rosSymptoms} setRosSymptoms={setRosSymptoms} rosNotes={rosNotes} setRosNotes={setRosNotes} />
          </div>
          <div className={`npi-panel${currentTab === 'pe' ? ' active' : ''}`}>
            <PETab peState={peState} setPeState={setPeState} peFindings={peFindings} setPeFindings={setPeFindings} />
          </div>
          <div className={`npi-panel${currentTab === 'sum' ? ' active' : ''}`}>
            <SummaryTab demo={demo} cc={cc} vitals={vitals} medications={medications} allergies={allergies} pmhSelected={pmhSelected} surgHx={surgHx} famHx={famHx} socHx={socHx} rosState={rosState} rosSymptoms={rosSymptoms} peState={peState} peFindings={peFindings} patientName={patientName} onSave={savePatient} onGenerateNote={aiGenerateNote} />
          </div>

          {currentTab === 'mdm' && (
            <div style={{ display: 'flex', flex: 1, minHeight: 0, margin: '-16px -18px', height: 'calc(100vh - 200px)' }}>
              <MDMPanel patientName={patientName} chiefComplaint={cc.text} vitals={vitals} />
            </div>
          )}

          {currentTab === 'discharge' && (
            <div style={{ display: 'flex', flex: 1, minHeight: 0, margin: '-16px -18px -100px', height: 'calc(100vh - 160px)' }}>
              <DischargePlanningWrapper patientName={patientName} patientDob={demo.dob} patientId={demo.mrn} patientAge={demo.age} patientGender={demo.sex} chiefComplaint={cc.text} diagnoses={[]} medications={medications} allergies={allergies} />
            </div>
          )}
        </main>

        {/* AI PANEL — floating bubble when collapsed */}
        {!aiOpen && currentTab !== 'mdm' && (
          <div style={{ position: 'fixed', bottom: 70, right: 24, zIndex: 200 }}>
            <button onClick={() => setAiOpen(true)} style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#3b5bdb,#4c6ef5)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(59,91,219,.5)', fontSize: 22 }} title="Open Notrya AI">💬</button>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderRadius: '50%', background: '#00e5c0', border: '2px solid #050f1e' }} />
          </div>
        )}

        {/* AI PANEL */}
        <aside className="npi-ai-panel" style={{ display: (currentTab === 'mdm' || !aiOpen) ? 'none' : 'flex' }}>
          <div className="npi-ai-header">
            <div className="npi-ai-hrow">
              <div className="npi-ai-dot" />
              <div className="npi-ai-title">Notrya AI</div>
              <div className="npi-ai-model">GPT-4o</div>
              <button onClick={() => setAiOpen(false)} style={{ marginLeft: 8, background: 'none', border: 'none', color: '#4a6a8a', cursor: 'pointer', fontSize: 15, lineHeight: 1, padding: '0 2px' }} title="Collapse">›</button>
            </div>
            <div className="npi-ai-qbtns">
              {[
                ['🚩 Red Flags', 'What are the red flags I should assess for this chief complaint?'],
                ['🩺 Exam Tips', 'Suggest a focused physical exam based on the current patient data'],
                ['🧬 Differentials', 'What are the likely differentials for this presentation?'],
                ['📋 Draft SBAR', 'Summarise what I have entered so far as a clinical handover'],
              ].map(([label, q]) => (
                <button key={label} className="npi-ai-qbtn" onClick={() => sendAI(q)}>{label}</button>
              ))}
            </div>
          </div>
          <div className="npi-ai-chat" ref={chatRef}>
            {aiMessages.map((m, i) => (
              <div key={i} className={`npi-ai-msg ${m.role}`}>
                {m.role === 'bot' && <div className="npi-ai-lbl">Notrya AI</div>}
                {m.text}
              </div>
            ))}
            {aiLoading && <div className="npi-ai-msg loading"><div className="npi-tdot" /><div className="npi-tdot" /><div className="npi-tdot" /></div>}
          </div>
          <div className="npi-ai-input-wrap">
            <div className="npi-ai-row">
              <input className="npi-ai-input" value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendAI()} placeholder="Ask about this patient..." />
              <button className="npi-ai-send" onClick={() => sendAI()}>↑</button>
            </div>
          </div>
        </aside>

      </div>

      {/* BOTTOM TAB BAR */}
      <ClinicalTabBar currentPage="NewPatientInput" currentTab={currentTab} onTabChange={showTab} showNav={true} onBack={navBack} onNext={navNext} />
    </div>
  );
}