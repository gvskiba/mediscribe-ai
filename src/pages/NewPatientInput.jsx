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
import EDOrders from "@/pages/EDOrders";
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


  const navNext = () => { if (currentIdx < allItems.length - 1) navigate(`/NewPatientInput?tab=${allItems[currentIdx + 1].id}`); };
  const navBack = () => { if (currentIdx > 0) navigate(`/NewPatientInput?tab=${allItems[currentIdx - 1].id}`); };


  const T = {
    bg: '#050f1e', panel: '#081628', card: '#0b1e36', up: '#0e2544',
    border: '#1a3555', borderHi: '#2a4f7a',
    blue: '#3b9eff', teal: '#00e5c0', gold: '#f5c842', coral: '#ff6b6b', orange: '#ff9f43',
    txt: '#e8f0fe', txt2: '#8aaccc', txt3: '#4a6a8a', txt4: '#2e4a6a',
  };

  const dotState = (id) => {
    const s = getTabStatus(id);
    if (id === currentTab) return 'current';
    return s;
  };

  const FULLSCREEN_TABS = new Set(['chart', 'orders', 'procedures', 'medref']);
  const isFullscreen = FULLSCREEN_TABS.has(currentTab);

  const allItems = SIDEBAR_GROUPS.flatMap(g => g.items);
  const currentIdx = allItems.findIndex(i => i.id === currentTab);

  const SHELL_CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
    .npi-shell { display: flex; flex-direction: column; height: 100vh; background: ${T.bg}; color: ${T.txt}; font-family: 'DM Sans', sans-serif; overflow: hidden; }
    .npi-topbar { height: 52px; flex-shrink: 0; background: ${T.panel}; border-bottom: 1px solid ${T.border}; display: flex; align-items: center; padding: 0 16px; gap: 10px; z-index: 300; }
    .npi-logo { width: 30px; height: 30px; background: ${T.teal}; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 12px; font-weight: 700; color: #050f1e; flex-shrink: 0; }
    .npi-pt-pill { background: ${T.up}; border: 1px solid ${T.border}; border-radius: 20px; padding: 3px 12px; display: flex; align-items: center; gap: 7px; font-size: 12px; }
    .npi-pt-name { font-family: 'Playfair Display', serif; font-weight: 600; color: ${T.txt}; }
    .npi-pt-meta { color: ${T.txt3}; font-size: 11px; }
    .npi-allergy { background: rgba(255,107,107,.1); border: 1px solid rgba(255,107,107,.3); border-radius: 20px; padding: 2px 9px; font-size: 11px; color: #ff6b6b; font-weight: 600; }
    .npi-vsep { width: 1px; height: 18px; background: ${T.border}; flex-shrink: 0; }
    .npi-topbar-right { margin-left: auto; display: flex; align-items: center; gap: 6px; }
    .npi-btn { background: ${T.up}; border: 1px solid ${T.border}; border-radius: 6px; padding: 4px 11px; font-size: 11px; color: ${T.txt2}; cursor: pointer; transition: all .15s; white-space: nowrap; font-family: 'DM Sans', sans-serif; }
    .npi-btn:hover { border-color: ${T.borderHi}; color: ${T.txt}; }
    .npi-btn-teal { background: ${T.teal}; color: #050f1e; border: none; border-radius: 6px; padding: 4px 12px; font-size: 11px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; }
    .npi-btn-teal:hover { filter: brightness(1.1); }
    .npi-body { flex: 1; display: flex; overflow: hidden; min-height: 0; }
    .npi-sidebar { width: 172px; flex-shrink: 0; background: ${T.panel}; border-right: 1px solid ${T.border}; overflow-y: auto; padding: 10px 8px; display: flex; flex-direction: column; gap: 1px; }
    .npi-sidebar::-webkit-scrollbar { width: 3px; } .npi-sidebar::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 2px; }
    .npi-grp-lbl { font-size: 9px; color: ${T.txt4}; text-transform: uppercase; letter-spacing: .08em; padding: 10px 8px 4px; font-weight: 600; }
    .npi-grp-lbl:first-child { padding-top: 4px; }
    .npi-tab { display: flex; align-items: center; gap: 7px; padding: 6px 8px; border-radius: 6px; cursor: pointer; border: 1px solid transparent; font-size: 12px; color: ${T.txt2}; text-decoration: none; transition: all .15s; }
    .npi-tab:hover { background: ${T.up}; border-color: ${T.border}; color: ${T.txt}; }
    .npi-tab.active { background: rgba(0,229,192,.08); border-color: rgba(0,229,192,.3); color: ${T.teal}; }
    .npi-tab-icon { font-size: 13px; width: 18px; text-align: center; flex-shrink: 0; }
    .npi-tab-dot { width: 6px; height: 6px; border-radius: 50%; background: ${T.border}; margin-left: auto; flex-shrink: 0; }
    .npi-tab-dot.done { background: ${T.teal}; box-shadow: 0 0 5px rgba(0,229,192,.5); }
    .npi-tab-dot.partial { background: ${T.orange}; }
    .npi-tab-dot.current { background: ${T.blue}; box-shadow: 0 0 5px rgba(59,158,255,.5); width: 8px; height: 8px; }
    .npi-grp-div { height: 1px; background: ${T.border}; margin: 6px 4px; }
    .npi-content { flex: 1; overflow-y: auto; min-width: 0; }
    .npi-content::-webkit-scrollbar { width: 4px; } .npi-content::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 2px; }
    .npi-inner { padding: 20px 24px; }
    .npi-fullscreen { padding: 0; height: 100%; overflow: hidden; }
    .npi-botbar { height: 50px; flex-shrink: 0; background: ${T.panel}; border-top: 1px solid ${T.border}; display: flex; align-items: center; padding: 0 16px; gap: 8px; z-index: 300; }
    .npi-stepper { display: flex; align-items: center; gap: 5px; margin: 0 auto; }
    .npi-step { width: 8px; height: 8px; border-radius: 50%; cursor: pointer; transition: all .2s; flex-shrink: 0; }
    .npi-step.done { background: ${T.teal}; box-shadow: 0 0 4px rgba(0,229,192,.4); }
    .npi-step.current { background: ${T.blue}; box-shadow: 0 0 6px rgba(59,158,255,.5); width: 10px; height: 10px; }
    .npi-step.partial { background: ${T.orange}; }
    .npi-step.empty { background: ${T.txt4}; }
    .npi-lbl { font-size: 11px; color: ${T.txt3}; white-space: nowrap; }
    .npi-clbl { font-size: 12px; color: ${T.txt}; font-weight: 600; white-space: nowrap; }
  `;

  return (
    <div className="npi-shell">
      <style>{SHELL_CSS}</style>

      {/* TOP BAR */}
      <header className="npi-topbar">
        <div className="npi-logo">NP</div>
        <div className="npi-pt-pill">
          <span className="npi-pt-name">{patientName}</span>
          {(demo.age || demo.sex) && <span className="npi-pt-meta">{[demo.age && `${demo.age}y`, demo.sex].filter(Boolean).join(' · ')}</span>}
          {demo.mrn && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.txt4 }}>#{demo.mrn}</span>}
        </div>
        {allergies.length > 0 && <span className="npi-allergy">⚠ {allergies.slice(0,3).join(' · ')}{allergies.length > 3 ? ` +${allergies.length-3}` : ''}</span>}
        {cc.text && <>
          <div className="npi-vsep"/>
          <span style={{ fontSize: 12, color: T.orange, fontWeight: 600 }}>CC: {cc.text}</span>
        </>}
        <div className="npi-topbar-right">
          <button className="npi-btn" onClick={resetForm}>🔄 New Patient</button>
          <button className="npi-btn-teal" onClick={savePatient}>💾 Save & Open Note</button>
        </div>
      </header>

      {/* BODY */}
      <div className="npi-body">
        {/* SIDEBAR */}
        <aside className="npi-sidebar">
          {SIDEBAR_GROUPS.map((group, gi) => (
            <div key={gi}>
              {gi > 0 && <div className="npi-grp-div"/>}
              <div className="npi-grp-lbl">{group.label}</div>
              {group.items.map(item => {
                const isActive = currentTab === item.id;
                const st = isActive ? 'current' : getTabStatus(item.id);
                return (
                  <div key={item.id} className={`npi-tab${isActive ? ' active' : ''}`} onClick={() => navigate(`/NewPatientInput?tab=${item.id}`)}>
                    <span className="npi-tab-icon">{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    <span className={`npi-tab-dot ${st}`}/>
                  </div>
                );
              })}
            </div>
          ))}
        </aside>

        {/* CONTENT */}
        <main className={`npi-content`}>
          <div className={isFullscreen ? 'npi-fullscreen' : 'npi-inner'}>
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
          {currentTab === 'ros' && <ROSTab />}
          {currentTab === 'pe' && (
            <PETab peState={peState} setPeState={setPeState} peFindings={peFindings} setPeFindings={setPeFindings} />
          )}
          {currentTab === 'chart' && (
            <div style={{ height: '100%', overflow: 'hidden' }}>
              <NotryaApp embedded={true} />
            </div>
          )}
          {currentTab === 'mdm' && (
            <MedicalDecisionMaking embedded patientName={patientName} chiefComplaint={cc.text} />
          )}
          {currentTab === 'discharge' && (
            <DischargeSummaryTab
              note={{
                assessment: cc.text || '',
                summary: cc.hpi || '',
                history_of_present_illness: cc.hpi || '',
                chief_complaint: cc.text || '',
                diagnoses: [],
                medications,
                allergies,
                patient_name: patientName,
                patient_age: demo.age || '',
                patient_gender: demo.sex || '',
                patient_id: demo.mrn || '',
              }}
              noteId={null}
              queryClient={null}
              isFirstTab={() => false}
              isLastTab={() => true}
              handleBack={() => navigate('/NewPatientInput?tab=medref')}
              handleNext={() => {}}
            />
          )}
          {currentTab === 'autocoder' && (
            <AutoCoderTab patientName={patientName} patientMrn={demo.mrn} patientDob={demo.dob} patientAge={demo.age} patientGender={demo.sex} chiefComplaint={cc.text} vitals={vitals} medications={medications} allergies={allergies} pmhSelected={pmhSelected} rosState={rosState} rosSymptoms={rosSymptoms} peState={peState} peFindings={peFindings} />
          )}
          {currentTab === 'erplan' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center', height: 300 }}>
              <div style={{ fontSize: 32 }}>🗺️</div>
              <div style={{ color: T.txt2, fontSize: 14 }}>ER Plan Builder</div>
              <button onClick={() => navigate('/ERPlanBuilder')} style={{ background: T.teal, color: T.bg, border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Open ER Plan Builder →</button>
            </div>
          )}
          {currentTab === 'erx' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center', height: 300 }}>
              <div style={{ fontSize: 32 }}>💉</div>
              <div style={{ color: T.txt2, fontSize: 14 }}>eRx — Electronic Prescriptions</div>
              <button onClick={() => navigate('/ERx')} style={{ background: T.teal, color: T.bg, border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Open eRx →</button>
            </div>
          )}
          {currentTab === 'procedures' && (
            <EDProcedureNotes embedded patientName={patientName} patientAllergies={allergies.join(', ')} physicianName={''} />
          )}
          {currentTab === 'medref' && (
            <div style={{ height: '100%', overflow: 'auto' }}>
              <MedicationReferencePage embedded />
            </div>
          )}
          {currentTab === 'orders' && (
            <div style={{ height: '100%', overflow: 'hidden' }}>
              <EDOrders embedded />
            </div>
          )}
          </div>
        </main>
      </div>

      {/* BOTTOM BAR */}
      <footer className="npi-botbar">
        <button className="npi-btn" onClick={navBack} disabled={currentIdx <= 0} style={{ opacity: currentIdx <= 0 ? 0.4 : 1 }}>← Back</button>
        {currentIdx > 0 && <span className="npi-lbl">{allItems[currentIdx - 1]?.label}</span>}
        <div className="npi-stepper">
          {allItems.map((item, i) => {
            const s = i === currentIdx ? 'current' : getTabStatus(item.id);
            return <div key={item.id} className={`npi-step ${s}`} onClick={() => navigate(`/NewPatientInput?tab=${item.id}`)} title={item.label}/>;
          })}
        </div>
        <span className="npi-clbl">{allItems[currentIdx]?.label}</span>
        <button className="npi-btn-teal" onClick={navNext} disabled={currentIdx >= allItems.length - 1} style={{ opacity: currentIdx >= allItems.length - 1 ? 0.4 : 1 }}>Next →</button>
      </footer>
    </div>
  );
}