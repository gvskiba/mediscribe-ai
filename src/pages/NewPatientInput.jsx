import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import MedicalDecisionMaking from "@/pages/MedicalDecisionMaking";
import DischargePlanningWrapper from "@/components/discharge/DischargePlanningWrapper.jsx";

import DemoTab from "@/components/npi/DemoTab";
import CCTab from "@/components/npi/CCTab";
import VitalsTab from "@/components/npi/VitalsTab";
import MedsTab from "@/components/npi/MedsTab";
import ROSTab from "@/components/npi/ROSTab";
import PETab from "@/components/npi/PETab";
import AutoCoderTab from "@/components/npi/AutoCoderTab";
import PatientChart from "@/pages/PatientChart";

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

  const appendAiMsg = (role, text) => setAiMessages(prev => [...prev, { role, text }]);

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
    setCurrentTab('demo'); setParseText('');
    toast.success('New patient form cleared');
  };

  const navNext = () => { const i = ALL_TABS.indexOf(currentTab); if (i < ALL_TABS.length - 1) setCurrentTab(ALL_TABS[i + 1]); };
  const navBack = () => { const i = ALL_TABS.indexOf(currentTab); if (i > 0) setCurrentTab(ALL_TABS[i - 1]); };

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

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 138px)', background: S.bg, color: S.txt, fontFamily: "'DM Sans', sans-serif", fontSize: 13, overflow: 'hidden' }}>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '18px 22px 30px', display: 'flex', flexDirection: 'column', gap: 18 }}>
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
            <div style={{ margin: '-18px -22px -30px', minHeight: 'calc(100vh - 200px)' }}>
              <PatientChart />
            </div>
          )}
          {currentTab === 'mdm' && (
            <MedicalDecisionMaking embedded patientName={patientName} chiefComplaint={cc.text} />
          )}
          {currentTab === 'discharge' && (
            <div style={{ margin: '-18px -22px -30px', height: 'calc(100vh - 160px)' }}>
              <DischargePlanningWrapper patientName={patientName} patientDob={demo.dob} patientId={demo.mrn} patientAge={demo.age} patientGender={demo.sex} chiefComplaint={cc.text} diagnoses={[]} medications={medications} allergies={allergies} />
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center', height: 300 }}>
              <div style={{ fontSize: 32 }}>✂️</div>
              <div style={{ color: S.txt2, fontSize: 14 }}>ED Procedure Notes</div>
              <button onClick={() => navigate('/EDProcedureNotes')} style={{ background: S.teal, color: S.bg, border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Open Procedures →</button>
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
    </div>
  );
}