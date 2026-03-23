import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import MDMPanel from "@/components/mdm/MDMPanel";
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
  const [currentTab, setCurrentTab] = useState(() => new URLSearchParams(window.location.search).get('tab') || 'demo');
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
    <div style={{ position: 'fixed', inset: 0, marginLeft: 72, background: S.bg, color: S.txt, fontFamily: "'DM Sans', sans-serif", fontSize: 13, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── TOP BAR ── */}
      <div style={{ flexShrink: 0, background: S.panel, borderBottom: `1px solid ${S.border}`, display: 'flex', flexDirection: 'column' }}>

        {/* Row 1 */}
        <div style={{ height: 44, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8, borderBottom: `1px solid rgba(26,53,85,0.5)` }}>
          <span style={{ fontSize: 12, color: S.txt2, fontWeight: 500 }}>Welcome, <strong style={{ color: S.txt }}>Dr. Gabriel Skiba</strong></span>
          <div style={{ width: 1, height: 20, background: S.border }} />
          {[['8', 'ACTIVE'], ['14', 'PENDING', true], ['3', 'ORDERS'], ['11.6', 'HOURS']].map(([v, l, alert]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, background: S.up, border: `1px solid ${S.border}`, borderRadius: 6, padding: '3px 10px' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: alert ? S.gold : S.txt }}>{v}</span>
              <span style={{ fontSize: 9, color: S.txt3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{l}</span>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ background: S.up, border: `1px solid ${S.border}`, borderRadius: 6, padding: '3px 10px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: S.txt2 }}>{clock}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,229,192,0.08)', border: '1px solid rgba(0,229,192,0.3)', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: S.teal }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: S.teal }} /> AI ON
            </div>
            <button onClick={resetForm} style={{ background: S.teal, color: S.bg, border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ New Patient</button>
          </div>
        </div>

        {/* Row 2 */}
        <div style={{ height: 44, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8, overflow: 'hidden' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, background: S.up, border: `1px solid ${S.border}`, borderRadius: 20, padding: '1px 8px', color: S.teal, whiteSpace: 'nowrap' }}>PT-4-471-8820</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 600, color: S.txt, whiteSpace: 'nowrap' }}>{patientName}</span>
          <span style={{ fontSize: 11, color: S.txt3, whiteSpace: 'nowrap' }}>{demo.age ? `${demo.age} y/o` : '67 y/o'} · {demo.sex || 'Male'} · {demo.dob || '03/14/1957'}</span>
          {cc.text && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: S.orange, whiteSpace: 'nowrap' }}>CC: {cc.text}</span>}
          <div style={{ width: 1, height: 18, background: S.border, flexShrink: 0 }} />
          {[
            ['BP', vitals.bp || '158/94', vbAbn(vitals.hr, null, 140)],
            ['HR', vitals.hr || '108', vbAbn(vitals.hr, 50, 100)],
            ['RR', vitals.rr || '18', false],
            ['SpO₂', (vitals.spo2 || '93') + '%', vbAbn(vitals.spo2, 94, null)],
            ['T', (vitals.temp || '37.1') + '°C', false],
            ['GCS', vitals.gcs || '15', false],
          ].map(([lbl, val, abn]) => (
            <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, whiteSpace: 'nowrap' }}>
              <span style={{ color: S.txt4, fontSize: 9 }}>{lbl}</span>
              <span style={{ color: abn ? S.coral : S.txt2 }}>{val}</span>
            </div>
          ))}
          <div style={{ width: 1, height: 18, background: S.border, flexShrink: 0 }} />
          {allergies.length > 0 && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'rgba(255,107,107,0.15)', color: S.coral, border: `1px solid rgba(255,107,107,0.3)`, whiteSpace: 'nowrap' }}>⚠ ALLERGY</span>}
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'rgba(255,107,107,0.15)', color: S.coral, border: `1px solid rgba(255,107,107,0.3)`, whiteSpace: 'nowrap' }}>MONITORING</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'rgba(0,229,192,0.1)', color: S.teal, border: `1px solid rgba(0,229,192,0.3)`, whiteSpace: 'nowrap' }}>Room 4B</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            {[['📋 Orders', false], ['📝 SOAP Note', false]].map(([label]) => (
              <button key={label} style={{ background: S.up, border: `1px solid ${S.border}`, borderRadius: 6, padding: '4px 10px', fontSize: 11, color: S.txt2, cursor: 'pointer', whiteSpace: 'nowrap' }}>{label}</button>
            ))}
            <button style={{ background: 'rgba(255,107,107,0.15)', color: S.coral, border: `1px solid rgba(255,107,107,0.3)`, borderRadius: 6, padding: '4px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>🚪 Discharge</button>
            <button onClick={savePatient} style={{ background: S.teal, color: S.bg, border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>💾 Save Chart</button>
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT SIDEBAR */}
        <aside style={{ width: 170, flexShrink: 0, background: S.panel, borderRight: `1px solid ${S.border}`, overflowY: 'auto', padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {SIDEBAR_GROUPS.map((group, gi) => (
            <div key={gi}>
              {gi > 0 && <div style={{ height: 1, background: S.border, margin: '6px 4px' }} />}
              <div style={{ fontSize: 9, color: S.txt4, textTransform: 'uppercase', letterSpacing: '0.08em', padding: gi === 0 ? '4px 8px 4px' : '10px 8px 4px', fontWeight: 600 }}>{group.label}</div>
              {group.items.map(item => {
                const status = getTabStatus(item.id);
                const isActive = currentTab === item.id;
                return (
                  <div key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px', borderRadius: 6,
                      cursor: 'pointer', border: `1px solid ${isActive ? 'rgba(59,158,255,0.3)' : 'transparent'}`,
                      background: isActive ? 'rgba(59,158,255,0.1)' : 'transparent',
                      fontSize: 12, color: isActive ? S.blue : S.txt2, userSelect: 'none',
                    }}
                  >
                    <span style={{ fontSize: 13, width: 18, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                      background: dotColor(status),
                      boxShadow: status === 'done' ? `0 0 5px rgba(0,229,192,0.5)` : status === 'partial' ? `0 0 5px rgba(255,159,67,0.5)` : 'none'
                    }} />
                  </div>
                );
              })}
            </div>
          ))}
        </aside>

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
            <ROSTab rosState={rosState} setRosState={setRosState} rosSymptoms={rosSymptoms} setRosSymptoms={setRosSymptoms} rosNotes={rosNotes} setRosNotes={setRosNotes} />
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
            <div style={{ margin: '-18px -22px -30px', height: 'calc(100vh - 160px)' }}>
              <MDMPanel patientName={patientName} chiefComplaint={cc.text} vitals={vitals} />
            </div>
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

        {/* AI PANEL */}
        <aside style={{ width: 280, flexShrink: 0, background: S.panel, borderLeft: `1px solid ${S.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', borderBottom: `1px solid ${S.border}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: S.teal, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: S.txt2 }}>Notrya AI</span>
              <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, background: S.up, border: `1px solid ${S.border}`, borderRadius: 20, padding: '1px 6px', color: S.txt3 }}>claude-sonnet-4</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {[['📋 Summarise', 'Summarise what I have entered so far.'], ['🔍 Check', 'Check my entries for completeness.'], ['📝 Draft', 'Draft a note from the data entered.']].map(([label, q]) => (
                <button key={label} onClick={() => sendAI(q)} style={{ padding: '3px 9px', borderRadius: 20, fontSize: 10, cursor: 'pointer', background: S.up, border: `1px solid ${S.border}`, color: S.txt2 }}>{label}</button>
              ))}
            </div>
          </div>
          <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {aiMessages.map((m, i) => (
              <div key={i} style={{
                padding: '8px 10px', borderRadius: 8, fontSize: 11, lineHeight: 1.5,
                background: m.role === 'sys' ? S.up : m.role === 'user' ? 'rgba(59,158,255,0.12)' : 'rgba(0,229,192,0.07)',
                border: `1px solid ${m.role === 'sys' ? S.border : m.role === 'user' ? 'rgba(59,158,255,0.25)' : 'rgba(0,229,192,0.18)'}`,
                color: m.role === 'sys' ? S.txt3 : S.txt,
                fontStyle: m.role === 'sys' ? 'italic' : 'normal',
              }}>{m.text}</div>
            ))}
            {aiLoading && (
              <div style={{ display: 'flex', gap: 5, padding: '10px 12px', alignItems: 'center' }}>
                {[0, 200, 400].map(delay => (
                  <div key={delay} style={{ width: 6, height: 6, borderRadius: '50%', background: S.teal, animation: `bounce 1.2s ${delay}ms ease-in-out infinite` }} />
                ))}
              </div>
            )}
          </div>
          <div style={{ padding: '8px 10px', borderTop: `1px solid ${S.border}`, flexShrink: 0, display: 'flex', gap: 5 }}>
            <input
              style={{ flex: 1, background: S.up, border: `1px solid ${S.border}`, borderRadius: 6, padding: '6px 8px', color: S.txt, fontSize: 11, outline: 'none', fontFamily: "'DM Sans', sans-serif" }}
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendAI()}
              placeholder="Ask anything…"
            />
            <button onClick={() => sendAI()} style={{ background: S.teal, color: S.bg, border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>↑</button>
          </div>
        </aside>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div style={{ flexShrink: 0, height: 50, background: S.panel, borderTop: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8, zIndex: 100 }}>
        <button onClick={navBack} style={{ background: S.up, border: `1px solid ${S.border}`, borderRadius: 6, padding: '5px 14px', fontSize: 12, color: S.txt2, cursor: 'pointer' }}>← Back</button>
        <span style={{ fontSize: 11, color: S.txt3 }}>{prevLabel}</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, margin: '0 auto' }}>
          {ALL_TABS.map((id) => {
            const status = getTabStatus(id);
            const isCurrent = id === currentTab;
            return (
              <div key={id} onClick={() => setCurrentTab(id)} title={SIDEBAR_GROUPS.flatMap(g => g.items).find(i => i.id === id)?.label} style={{
                width: isCurrent ? 10 : 8, height: isCurrent ? 10 : 8,
                borderRadius: '50%', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
                background: isCurrent ? S.blue : dotColor(status),
                boxShadow: isCurrent ? `0 0 6px rgba(59,158,255,0.5)` : 'none',
              }} />
            );
          })}
        </div>

        <span style={{ fontSize: 12, color: S.txt, fontWeight: 500 }}>{currentLabel}</span>
        <button onClick={navNext} style={{ background: S.teal, color: S.bg, border: 'none', borderRadius: 6, padding: '6px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Next →</button>
      </div>

      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:0.4}40%{transform:translateY(-6px);opacity:1}}`}</style>
    </div>
  );
}