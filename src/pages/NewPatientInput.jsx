import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import MDMPanel from "@/components/mdm/MDMPanel";
import DischargePlanningWrapper from "@/components/discharge/DischargePlanningWrapper.jsx";
import ClinicalTabBar from "@/components/shared/ClinicalTabBar";


import DemoTab from "@/components/npi/DemoTab";
import CCTab from "@/components/npi/CCTab";
import VitalsTab from "@/components/npi/VitalsTab";
import MedsTab from "@/components/npi/MedsTab";
import ROSTab from "@/components/npi/ROSTab";
import PETab from "@/components/npi/PETab";

import AutoCoderTab from "@/components/npi/AutoCoderTab";

import { VITAL_DEFS, ROS_SYSTEMS, PE_SYSTEMS, PMH_SYSTEMS, TABS } from "@/components/npi/npiData";

const SIDEBAR_ITEMS = [
  { id: 'chart', icon: '📊', label: 'Patient Chart' },
  { id: 'demo', icon: '👤', label: 'Demographics' },
  { id: 'cc', icon: '🗣️', label: 'Chief Complaint' },
  { id: 'vit', icon: '📊', label: 'Vitals' },
  { id: 'meds', icon: '💊', label: 'Medications & PMH' },
  { id: 'ros', icon: '🔍', label: 'Review of Systems' },
  { id: 'pe', icon: '🩺', label: 'Physical Exam' },
  { id: 'mdm', icon: '⚖️', label: 'MDM' },
  { id: 'discharge', icon: '🏥', label: 'Discharge' },
  { id: 'autocoder', icon: '💻', label: 'AutoCoder' },
];

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
  const [aiMessages, setAiMessages] = useState([{ role: 'sys', text: "Welcome. I'll assist as you build this patient record — suggesting red flags, relevant ROS items, exam findings, and differential diagnoses as you enter data." }]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [convoHistory, setConvoHistory] = useState([]);
  const [aiOpen, setAiOpen] = useState(true);
  const [sbOpen, setSbOpen] = useState(true);
  const chatRef = useRef(null);

  // Save patient data to localStorage for ERx integration
  useEffect(() => {
    localStorage.setItem('npiPatientData', JSON.stringify({
      firstName: demo.firstName,
      lastName: demo.lastName,
      age: demo.age,
      dob: demo.dob,
      sex: demo.sex,
      mrn: demo.mrn,
      weight: demo.weight,
      crCl: demo.crCl,
      insurance: demo.insurance,
      insuranceId: demo.insuranceId,
      medications: medications,
      allergies: allergies
    }));
  }, [demo, medications, allergies]);

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
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');.npi-root{--bg:#050f1e;--bg-panel:#081628;--bg-card:#0b1e36;--bg-up:#0e2544;--border:#1a3555;--border-hi:#2a4f7a;--blue:#3b9eff;--cyan:#00d4ff;--teal:#00e5c0;--gold:#f5c842;--purple:#9b6dff;--coral:#ff6b6b;--green:#3dffa0;--orange:#ff9f43;--txt:#e8f0fe;--txt2:#8aaccc;--txt3:#4a6a8a;--txt4:#2e4a6a;background:var(--bg);color:var(--txt);font-family:'DM Sans',sans-serif;font-size:13px;display:flex;flex-direction:column;overflow:hidden;height:100vh;margin-left:72px}.npi-root *{box-sizing:border-box}.npi-root input,.npi-root select,.npi-root textarea{font-family:'DM Sans',sans-serif}.npi-nav{height:50px;background:#081628;border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:10px;flex-shrink:0}.npi-nav-welcome{font-size:13px;color:var(--txt2);font-weight:500;white-space:nowrap}.npi-nav-welcome strong{color:var(--txt);font-weight:600}.npi-ndiv{width:1px;height:22px;background:var(--border);flex-shrink:0}.npi-nav-stat{display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg-up);border:1px solid var(--border);border-radius:8px;padding:4px 12px;min-width:70px;cursor:pointer}.npi-nav-stat-val{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:600;color:var(--txt);line-height:1.2}.npi-nav-stat-val.npi-alert{color:var(--gold)}.npi-nav-stat-lbl{font-size:9px;color:var(--txt3);text-transform:uppercase;letter-spacing:.04em}.npi-nav-right{margin-left:auto;display:flex;align-items:center;gap:8px}.npi-nav-specialty{background:var(--bg-up);border:1px solid var(--border);border-radius:8px;padding:5px 12px;font-size:12px;color:var(--txt2);cursor:pointer}.npi-nav-time{background:var(--bg-up);border:1px solid var(--border);border-radius:8px;padding:5px 12px;font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--txt2);cursor:pointer}.npi-nav-ai-on{display:flex;align-items:center;gap:5px;background:rgba(0,229,192,.08);border:1px solid rgba(0,229,192,.3);border-radius:8px;padding:5px 12px;font-size:12px;font-weight:600;color:var(--teal)}.npi-nav-ai-dot{width:7px;height:7px;border-radius:50%;background:var(--teal);animation:ai-pulse 2s ease-in-out infinite}@keyframes ai-pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(0,229,192,.4)}50%{opacity:.8;box-shadow:0 0 0 6px rgba(0,229,192,0)}}.npi-nav-new-pt{background:var(--teal);color:var(--bg);border:none;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap}.npi-sub-navbar{height:42px;background:#0b1e36;border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:10px;flex-shrink:0}.npi-sub-nav-logo{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:#00d4ff;letter-spacing:-.5px}.npi-sub-nav-sep{color:var(--txt4)}.npi-sub-nav-title{font-size:13px;color:var(--txt2);font-weight:500}.npi-sub-nav-badge{background:var(--bg-up);border:1px solid var(--border);border-radius:20px;padding:2px 10px;font-size:11px;color:var(--teal);font-family:'JetBrains Mono',monospace}.npi-sub-nav-right{margin-left:auto;display:flex;align-items:center;gap:8px}.npi-btn-ghost{background:var(--bg-up);border:1px solid var(--border);border-radius:8px;padding:5px 12px;font-size:12px;color:var(--txt2);cursor:pointer;display:inline-flex;align-items:center;gap:5px;transition:all .15s}.npi-btn-ghost:hover{border-color:var(--border-hi);color:var(--txt)}.npi-btn-primary{background:var(--teal);color:var(--bg);border:none;border-radius:8px;padding:5px 14px;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:5px}.npi-btn-coral{background:rgba(255,107,107,.15);border:1px solid rgba(255,107,107,.35);color:var(--coral);border-radius:8px;padding:5px 12px;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:5px}.npi-vbar{height:38px;background:#081628;border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 14px;gap:10px;overflow:hidden;flex-shrink:0}.npi-vb-name{font-family:'Playfair Display',serif;font-size:14px;color:var(--txt);font-weight:600;white-space:nowrap}.npi-vb-meta{font-size:11px;color:var(--txt3);white-space:nowrap}.npi-vb-meta-sm{font-size:10px;color:var(--txt4);white-space:nowrap}.npi-vb-div{width:1px;height:20px;background:var(--border);flex-shrink:0}.npi-vb-vital{display:flex;align-items:center;gap:4px;font-family:'JetBrains Mono',monospace;font-size:11px;white-space:nowrap}.npi-vb-lbl{color:var(--txt3);font-size:10px}.npi-vb-val{color:var(--txt2)}.npi-vb-val.npi-vb-hi{color:var(--gold)}.npi-vb-val.npi-vb-lo{color:var(--blue)}.npi-badge{font-size:11px;font-family:'JetBrains Mono',monospace;padding:2px 9px;border-radius:20px;font-weight:600;white-space:nowrap}.npi-badge-teal{background:rgba(0,229,192,.12);color:var(--teal);border:1px solid rgba(0,229,192,.3)}.npi-badge-blue{background:rgba(59,158,255,.12);color:var(--blue);border:1px solid rgba(59,158,255,.3)}.npi-badge-gold{background:rgba(245,200,66,.12);color:var(--gold);border:1px solid rgba(245,200,66,.3)}.npi-badge-coral{background:rgba(255,107,107,.15);color:var(--coral);border:1px solid rgba(255,107,107,.3)}.npi-badge-orange{background:rgba(255,159,67,.12);color:var(--orange);border:1px solid rgba(255,159,67,.3)}.npi-badge-muted{background:rgba(74,106,138,.2);color:var(--txt3)}.npi-layout{display:flex;flex:1;overflow:hidden}.npi-sb{flex-shrink:0;background:#060e1c;border-right:1px solid var(--border);padding:10px 0;transition:width .25s cubic-bezier(.4,0,.2,1);overflow:hidden;display:flex;flex-direction:column}.npi-sb.open{width:210px}.npi-sb.collapsed{width:36px;overflow-y:hidden}.npi-sb-toggle{display:flex;align-items:center;justify-content:center;padding:8px 0;cursor:pointer;color:var(--txt4);font-size:16px;transition:color .15s}.npi-sb-toggle:hover{color:var(--teal)}.npi-sb.collapsed .npi-sb-inner{display:none}.npi-sb-inner{min-width:210px;overflow-y:auto;flex:1}.npi-sb-inner::-webkit-scrollbar{width:3px}.npi-sb-inner::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}.npi-sb-head{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--txt4);padding:5px 12px 3px}.npi-sb-item{display:flex;align-items:center;gap:7px;padding:7px 12px;cursor:pointer;transition:background .15s;border-left:2px solid transparent;font-size:12px;color:var(--txt2);white-space:nowrap}.npi-sb-item:hover{background:var(--bg-card);color:var(--txt)}.npi-sb-item.active{background:#0a2040;border-left-color:var(--blue);color:var(--blue);font-weight:500}.npi-pt-summary{margin:8px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:9px 11px}.npi-pts-name{font-family:'Playfair Display',serif;font-size:12px;font-weight:600;color:var(--txt);margin-bottom:2px}.npi-pts-meta{font-size:10px;color:var(--txt2);margin-bottom:5px}.npi-pts-cc-label{font-size:9px;color:var(--txt3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}.npi-pts-cc-val{font-size:11px;color:var(--orange);font-style:italic;margin-bottom:6px}.npi-pts-step{display:flex;align-items:center;gap:5px;padding:2px 0}.npi-step-dot{width:7px;height:7px;border-radius:50%;background:var(--bg-up);border:1.5px solid var(--border);flex-shrink:0;transition:all .3s}.npi-step-dot.done{background:var(--teal);border-color:var(--teal)}.npi-step-label{font-size:10px;color:var(--txt3)}.npi-main{flex:1;overflow-y:auto;padding:16px 18px 100px;min-width:0}.npi-main::-webkit-scrollbar{width:4px}.npi-main::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}.npi-panel{display:none;animation:npi-fadeup .22s ease}.npi-panel.active{display:block}@keyframes npi-fadeup{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}.npi-sec-title{font-family:'Playfair Display',serif;font-size:17px;font-weight:600;color:var(--txt);margin-bottom:3px}.npi-sec-sub{font-size:11px;color:var(--txt3);margin-bottom:14px}.npi-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}.npi-grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px}.npi-grid-auto{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px;margin-bottom:14px}.npi-field{display:flex;flex-direction:column;gap:3px}.npi-label{font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.5px;font-weight:600}.npi-label .opt{color:var(--txt4);font-weight:400;text-transform:none;letter-spacing:0}.npi-input{height:35px;background:var(--bg-card);border:1.5px solid var(--border);border-radius:8px;padding:0 10px;color:var(--txt);font-size:13px;outline:none;transition:all .2s;width:100%}.npi-input:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(59,158,255,.1)}.npi-input::placeholder{color:var(--txt4)}.npi-select{height:35px;background:var(--bg-card);border:1.5px solid var(--border);border-radius:8px;padding:0 10px;color:var(--txt);font-size:13px;outline:none;cursor:pointer;width:100%;appearance:none;transition:border-color .2s}.npi-select:focus{border-color:var(--blue)}.npi-textarea{background:var(--bg-card);border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;color:var(--txt);font-size:13px;outline:none;resize:vertical;width:100%;min-height:68px;transition:border-color .2s;line-height:1.5}.npi-textarea:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(59,158,255,.1)}.npi-textarea::placeholder{color:var(--txt4)}.npi-hdiv{height:1px;background:var(--border);margin:16px 0}.npi-hint{font-size:11px;color:var(--txt2);padding:6px 10px;background:var(--bg-card);border:1px solid var(--border);border-radius:5px;border-left:3px solid var(--blue);margin-bottom:12px}.npi-parse-box{background:linear-gradient(135deg,#081628 0%,#0a1e38 100%);border:1.5px solid var(--border-hi);border-radius:12px;padding:14px 16px;margin-bottom:18px;position:relative;overflow:hidden}.npi-parse-title{font-size:12px;font-weight:600;color:var(--teal);margin-bottom:3px}.npi-parse-sub{font-size:11px;color:var(--txt3);margin-bottom:8px}.npi-parse-btn{margin-top:8px;height:32px;padding:0 14px;background:#052520;border:1.5px solid var(--teal);border-radius:7px;color:var(--teal);font-size:12px;font-weight:600;cursor:pointer;transition:all .2s}.npi-parse-btn:hover{background:#0a3530}.npi-parse-btn:disabled{opacity:.5;cursor:wait}.npi-cc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:7px;margin-bottom:14px}.npi-cc-btn{padding:8px 10px;background:var(--bg-card);border:1.5px solid var(--border);border-radius:8px;color:var(--txt2);font-size:11px;cursor:pointer;transition:all .18s;text-align:left;display:flex;flex-direction:column;gap:3px}.npi-cc-btn:hover{border-color:var(--border-hi);color:var(--txt);background:var(--bg-up)}.npi-cc-btn.selected{background:#0a2040;border-color:var(--blue);color:var(--blue)}.npi-cc-icon{font-size:17px}.npi-cc-label{font-size:11px;font-weight:500;line-height:1.2}.npi-vitals-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-bottom:16px}.npi-vit-field{background:var(--bg-card);border:1.5px solid var(--border);border-radius:8px;padding:10px 12px;transition:all .2s;position:relative}.npi-vit-field:focus-within{border-color:var(--blue);box-shadow:0 0 0 3px rgba(59,158,255,.1)}.npi-vit-field.abn-field{border-color:var(--coral)!important;box-shadow:0 0 0 3px rgba(255,107,107,.1)!important}.npi-vit-field.lo-field{border-color:var(--blue)!important}.npi-vit-icon{font-size:15px;margin-bottom:3px}.npi-vit-label-txt{font-size:9px;color:var(--txt3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}.npi-vit-input{width:100%;background:transparent;border:none;outline:none;font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:600;color:var(--txt)}.npi-vit-input::placeholder{color:var(--txt4);font-size:13px;font-weight:400}.npi-vit-unit{font-size:9px;color:var(--txt3);margin-top:2px}.npi-vit-status{position:absolute;top:7px;right:7px;width:7px;height:7px;border-radius:50%;background:var(--border)}.npi-vit-status.abn{background:var(--coral)}.npi-vit-status.lo{background:var(--blue)}.npi-vit-status.ok{background:var(--teal)}.npi-med-tags{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px;min-height:34px;background:var(--bg-card);border:1.5px solid var(--border);border-radius:8px;padding:5px 9px;align-items:center;cursor:text;transition:border-color .2s}.npi-med-tags:focus-within{border-color:var(--cyan)}.npi-med-tag{display:flex;align-items:center;gap:4px;background:#052535;border:1px solid rgba(0,212,255,.25);border-radius:4px;padding:2px 7px;font-size:11px;color:var(--cyan);flex-shrink:0}.npi-allergy-tag{background:#1a0808;border-color:rgba(255,107,107,.3);color:var(--coral)}.npi-med-tag-x{cursor:pointer;color:var(--txt3);font-size:11px;transition:color .15s}.npi-med-tag-x:hover{color:var(--coral)}.npi-med-tag-input{border:none;outline:none;background:transparent;color:var(--txt);font-size:12px;min-width:80px;flex:1}.npi-med-tag-input::placeholder{color:var(--txt4)}.npi-med-hint{font-size:10px;color:var(--txt3);margin-bottom:10px}.npi-quick-med{color:var(--cyan);cursor:pointer;margin-right:2px}.npi-quick-med:hover{text-decoration:underline}.npi-pmh-systems{display:flex;flex-direction:column;gap:6px;margin-bottom:12px}.npi-pmh-sys{background:var(--bg-card);border:1.5px solid var(--border);border-radius:10px;overflow:hidden;transition:border-color .2s}.npi-pmh-sys.has-sel{border-color:var(--blue)}.npi-pmh-sys-hdr{display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;user-select:none;transition:background .15s}.npi-pmh-sys-hdr:hover{background:var(--bg-up)}.npi-pmh-sys-ico{font-size:16px;flex-shrink:0}.npi-pmh-sys-name{font-size:12px;font-weight:600;color:var(--txt);flex:1}.npi-pmh-sys-count{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;padding:1px 7px;border-radius:10px;background:#0a2040;color:var(--blue);min-width:20px;text-align:center}.npi-pmh-sys-count.zero{background:var(--bg-up);color:var(--txt4)}.npi-pmh-sys-chevron{font-size:11px;color:var(--txt3);transition:transform .2s;flex-shrink:0}.npi-pmh-sys-chevron.open{transform:rotate(90deg)}.npi-pmh-sys-body{padding:8px 12px 10px;border-top:1px solid var(--border);display:none;flex-wrap:wrap;gap:5px}.npi-pmh-sys-body.open{display:flex}.npi-pmh-chip{padding:4px 10px;border-radius:5px;border:1.5px solid var(--border);background:transparent;color:var(--txt3);font-size:11px;cursor:pointer;transition:all .18s;user-select:none}.npi-pmh-chip:hover{border-color:var(--border-hi);color:var(--txt2)}.npi-pmh-chip.sel{background:#0a2040;border-color:var(--blue);color:var(--blue);font-weight:500}.npi-pmh-chip.active-pmh{background:#062020;border-color:var(--teal);color:var(--teal)}.npi-ros-toolbar{display:flex;align-items:center;gap:7px;margin-bottom:12px;flex-wrap:wrap}.npi-ros-tool-btn{padding:5px 12px;border-radius:5px;font-size:11px;cursor:pointer;transition:all .18s;border:1.5px solid var(--border);background:transparent;color:var(--txt2)}.npi-ros-tool-btn.teal{border-color:rgba(0,229,192,.4);color:var(--teal);background:#052520}.npi-ros-tool-btn.red{border-color:rgba(255,107,107,.4);color:var(--coral);background:#1a0808}.npi-ros-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;margin-bottom:18px}.npi-ros-card{background:var(--bg-card);border:1.5px solid var(--border);border-radius:12px;padding:12px 14px;transition:all .2s;cursor:pointer;user-select:none;position:relative;overflow:hidden}.npi-ros-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--bg-up);transition:background .2s}.npi-ros-card.s1{border-color:rgba(0,229,192,.35);background:#051e18}.npi-ros-card.s1::before{background:var(--teal)}.npi-ros-card.s2{border-color:rgba(255,107,107,.35);background:#1a0808}.npi-ros-card.s2::before{background:var(--coral)}.npi-ros-card-header{display:flex;align-items:center;gap:7px;margin-bottom:7px}.npi-ros-icon{font-size:16px}.npi-ros-sys-name{font-size:12px;font-weight:600;color:var(--txt);flex:1}.npi-ros-state-btns{display:flex;gap:3px}.npi-rsb{width:24px;height:20px;border-radius:4px;border:1px solid var(--border);background:transparent;cursor:pointer;font-size:11px;transition:all .15s;display:flex;align-items:center;justify-content:center}.npi-rsb.norm{border-color:rgba(0,229,192,.4);color:var(--teal)}.npi-rsb.norm.active-btn{background:#062020;border-color:var(--teal)}.npi-rsb.abn{border-color:rgba(255,107,107,.4);color:var(--coral)}.npi-rsb.abn.active-btn{background:#1a0808;border-color:var(--coral)}.npi-rsb.na{border-color:var(--border);color:var(--txt4)}.npi-rsb.na.active-btn{background:var(--bg-up);color:var(--txt3)}.npi-ros-norm-text{font-size:10px;color:var(--teal);margin-top:5px}.npi-ros-symptoms{display:flex;flex-wrap:wrap;gap:4px;margin-top:7px}.npi-ros-sym-chip{padding:2px 7px;border-radius:4px;font-size:10px;border:1px solid var(--border);color:var(--txt3);cursor:pointer;transition:all .15s}.npi-ros-sym-chip:hover{border-color:var(--border-hi);color:var(--txt2)}.npi-ros-sym-chip.sel-sym{background:#1a0808;border-color:var(--coral);color:var(--coral)}.npi-ros-abn-wrap{margin-top:7px;display:none}.npi-ros-abn-wrap.open{display:block}.npi-ros-abn-input{width:100%;background:rgba(255,107,107,.06);border:1px solid rgba(255,107,107,.25);border-radius:5px;padding:5px 8px;color:var(--txt);font-size:11px;outline:none;resize:none;min-height:48px;line-height:1.4}.npi-ros-abn-input:focus{border-color:rgba(255,107,107,.5)}.npi-pe-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;margin-bottom:18px}.npi-pe-card{background:var(--bg-card);border:1.5px solid var(--border);border-radius:12px;padding:12px 14px;transition:all .2s;position:relative;overflow:hidden}.npi-pe-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--bg-up);transition:background .2s}.npi-pe-card.s1{border-color:rgba(0,229,192,.35);background:#051e18}.npi-pe-card.s1::before{background:var(--teal)}.npi-pe-card.s2{border-color:rgba(255,107,107,.35);background:#1a0808}.npi-pe-card.s2::before{background:var(--coral)}.npi-pe-card-header{display:flex;align-items:center;gap:7px;margin-bottom:7px}.npi-pe-normal-preview{font-size:10px;color:rgba(0,229,192,.7);line-height:1.5;margin-top:2px;font-style:italic;display:none}.npi-pe-card.s1 .npi-pe-normal-preview{display:block}.npi-pe-findings-wrap{margin-top:7px;display:none}.npi-pe-findings-wrap.open{display:block}.npi-pe-findings{width:100%;background:rgba(255,107,107,.06);border:1px solid rgba(255,107,107,.25);border-radius:5px;padding:5px 8px;color:var(--txt);font-size:11px;outline:none;resize:none;min-height:55px;line-height:1.5}.npi-pe-findings:focus{border-color:rgba(255,107,107,.5)}.npi-sum-block{background:var(--bg-card);border:1.5px solid var(--border);border-radius:12px;padding:13px 15px;margin-bottom:10px}.npi-sum-block-title{font-family:'Playfair Display',serif;font-size:14px;font-weight:600;color:var(--txt);margin-bottom:7px;display:flex;align-items:center;gap:7px}.npi-sum-table{width:100%;border-collapse:collapse}.npi-sum-table td{padding:4px 0;font-size:12px;border-bottom:1px solid rgba(26,53,85,.5);vertical-align:top}.npi-sum-table td:first-child{color:var(--txt3);width:38%;padding-right:10px;font-size:11px}.npi-sum-table td:last-child{color:var(--txt)}.npi-sum-table tr:last-child td{border-bottom:none}.npi-ros-item{display:inline-flex;align-items:center;gap:3px;padding:2px 6px;border-radius:3px;font-size:10px;font-weight:600;margin:2px}.npi-ros-item.norm{background:#062020;color:var(--teal)}.npi-ros-item.abn{background:#1a0808;color:var(--coral)}.npi-sum-btns{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}.npi-sum-generate-btn{height:34px;padding:0 16px;background:var(--teal);border:none;border-radius:8px;color:#050f1e;font-size:12px;font-weight:700;cursor:pointer;transition:all .2s}.npi-sum-generate-btn:hover{background:#00ffd0}.npi-sum-studio-btn{height:34px;padding:0 16px;background:#0a2040;border:1px solid var(--blue);border-radius:8px;color:var(--blue);font-size:12px;font-weight:700;cursor:pointer;transition:all .2s}.npi-sum-studio-btn:hover{background:#0e2a55}.npi-ai-panel{width:280px;flex-shrink:0;background:#060e1c;border-left:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden}.npi-ai-header{padding:11px 13px 9px;border-bottom:1px solid var(--border);background:#040d1a;flex-shrink:0}.npi-ai-hrow{display:flex;align-items:center;gap:7px;margin-bottom:7px}.npi-ai-dot{width:7px;height:7px;border-radius:50%;background:var(--teal);animation:npi-pulse 2s infinite}@keyframes npi-pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(0,229,192,.4)}50%{opacity:.8;box-shadow:0 0 0 4px rgba(0,229,192,0)}}.npi-ai-title{font-size:12px;font-weight:600;color:var(--txt);flex:1}.npi-ai-model{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--txt4);background:var(--bg-up);padding:2px 6px;border-radius:3px}.npi-ai-qbtns{display:flex;flex-wrap:wrap;gap:4px}.npi-ai-qbtn{padding:3px 8px;font-size:10px;background:var(--bg-up);border:1px solid var(--border);border-radius:5px;color:var(--txt3);cursor:pointer;transition:all .15s}.npi-ai-qbtn:hover{border-color:var(--teal);color:var(--teal)}.npi-ai-chat{flex:1;padding:11px 13px;overflow-y:auto}.npi-ai-chat::-webkit-scrollbar{width:3px}.npi-ai-chat::-webkit-scrollbar-thumb{background:var(--border)}.npi-ai-msg{padding:8px 10px;border-radius:8px;margin-bottom:7px;font-size:11.5px;line-height:1.6}.npi-ai-msg.sys{background:var(--bg-up);border:1px solid var(--border);color:var(--txt2)}.npi-ai-msg.user{background:#0a2040;border:1px solid rgba(59,158,255,.2);color:var(--txt);text-align:right}.npi-ai-msg.bot{background:#062020;border:1px solid rgba(0,229,192,.15);color:var(--txt2)}.npi-ai-msg.loading{display:flex;gap:4px;align-items:center;background:var(--bg-up);border:1px solid var(--border);padding:11px}.npi-ai-lbl{font-size:9px;text-transform:uppercase;letter-spacing:.6px;color:var(--teal);margin-bottom:3px;font-weight:600}.npi-tdot{width:6px;height:6px;border-radius:50%;background:var(--teal);animation:npi-bounce 1.2s infinite}.npi-tdot:nth-child(2){animation-delay:.2s}.npi-tdot:nth-child(3){animation-delay:.4s}@keyframes npi-bounce{0%,80%,100%{transform:scale(.6);opacity:.5}40%{transform:scale(1);opacity:1}}.npi-ai-input-wrap{padding:9px 13px;border-top:1px solid var(--border);flex-shrink:0}.npi-ai-row{display:flex;gap:6px}.npi-ai-input{flex:1;height:33px;background:var(--bg-up);border:1px solid var(--border);border-radius:7px;padding:0 9px;color:var(--txt);font-size:12px;outline:none;transition:border-color .2s}.npi-ai-input:focus{border-color:var(--teal)}.npi-ai-input::placeholder{color:var(--txt4)}.npi-ai-send{width:33px;height:33px;background:#062020;border:1px solid rgba(0,229,192,.3);border-radius:7px;color:var(--teal);font-size:14px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s}.npi-ai-send:hover{background:#0a3030}`}</style>
      {/* NAVBAR */}
      <nav className="npi-nav">
        <span className="npi-nav-welcome">Welcome, <strong>Dr. Gabriel Skiba</strong></span>
        <div className="npi-ndiv" />
        <div className="npi-nav-stat"><span className="npi-nav-stat-val">8</span><span className="npi-nav-stat-lbl">Active Patients</span></div>
        <div className="npi-nav-stat"><span className="npi-nav-stat-val npi-alert">14</span><span className="npi-nav-stat-lbl">Notes Pending</span></div>
        <div className="npi-nav-stat"><span className="npi-nav-stat-val">3</span><span className="npi-nav-stat-lbl">Orders Queue</span></div>
        <div className="npi-nav-stat"><span className="npi-nav-stat-val">11.6</span><span className="npi-nav-stat-lbl">Shift Hours</span></div>
        <div className="npi-nav-right">
          <div className="npi-nav-specialty">Emergency Medicine ▾</div>
          <div className="npi-nav-time">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
          <div className="npi-nav-ai-on"><div className="npi-nav-ai-dot"></div> AI ON</div>
          <button className="npi-nav-new-pt" onClick={resetForm}>+ New Patient</button>
        </div>
      </nav>

      {/* SUB-NAVBAR */}
      <div className="npi-sub-navbar">
        <span className="npi-sub-nav-logo">notrya</span>
        <span className="npi-sub-nav-sep">|</span>
        <span className="npi-sub-nav-title">Patient Chart</span>
        <span className="npi-sub-nav-badge">PT-4-471-8820</span>
        <div className="npi-sub-nav-right">
          <button className="npi-btn-ghost">← All Patients</button>
          <button className="npi-btn-ghost">📋 Orders</button>
          <button className="npi-btn-ghost">📝 SOAP Note</button>
          <button className="npi-btn-coral">🚪 Discharge</button>
          <button className="npi-btn-primary" onClick={savePatient}>💾 Save Chart</button>
        </div>
      </div>

      {/* VITALS BAR */}
      <div className="npi-vbar">
        <span className="npi-vb-name">{patientName || 'Nakamura, Hiroshi'}</span>
        <span className="npi-vb-meta">67 y/o · Male · DOB 03/14/1957</span>
        <div className="npi-vb-div"></div>
        <div className="npi-vb-vital"><span className="npi-vb-lbl">CC</span><span className="npi-vb-val" style={{ color: 'var(--orange)' }}>{cc.text || 'Chest Pain'}</span></div>
        <div className="npi-vb-div"></div>
        <div className="npi-vb-vital"><span className="npi-vb-lbl">BP</span><span className={`npi-vb-val${vitals.bp && parseFloat(vitals.bp) > 140 ? ' npi-vb-hi' : ''}`}>{vitals.bp || '158/94'}</span></div>
        <div className="npi-vb-vital"><span className="npi-vb-lbl">HR</span><span className={`npi-vb-val${vitals.hr && parseFloat(vitals.hr) > 100 ? ' npi-vb-hi' : ''}`}>{vitals.hr || '108'}</span></div>
        <div className="npi-vb-vital"><span className="npi-vb-lbl">RR</span><span className="npi-vb-val">{vitals.rr || '18'}</span></div>
        <div className="npi-vb-vital"><span className="npi-vb-lbl">SpO₂</span><span className={`npi-vb-val${vitals.spo2 && parseFloat(vitals.spo2) < 95 ? ' npi-vb-lo' : ''}`}>{vitals.spo2 || '93'}</span></div>
        <div className="npi-vb-vital"><span className="npi-vb-lbl">Temp</span><span className="npi-vb-val">{vitals.temp || '37.1°C'}</span></div>
        <div className="npi-vb-vital"><span className="npi-vb-lbl">GCS</span><span className="npi-vb-val">{vitals.gcs || '15'}</span></div>
        <div className="npi-vb-vital"><span className="npi-vb-lbl">Wt</span><span className="npi-vb-val">{vitals.weight || demo.weight ? (vitals.weight || demo.weight) + ' kg' : '82 kg'}</span></div>
        <div className="npi-vb-div"></div>
        <span className="npi-vb-meta-sm">Last vitals 14 min ago</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
          {allergies.length > 0 && <span className="npi-badge npi-badge-coral">⚠ ALLERGY FLAG</span>}
          <span className="npi-badge npi-badge-orange">MONITORING</span>
          <span className="npi-badge npi-badge-blue">Room 4B</span>
          <span className="npi-badge npi-badge-muted" style={{ fontSize: '9px' }}>Arrived 08:26</span>
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
          {currentTab === 'chart' && (
            <iframe 
              src="/patientchart" 
              style={{ 
                border: 'none', 
                width: '100%', 
                height: 'calc(100vh - 200px)', 
                margin: '-16px -18px',
                background: '#050f1e'
              }}
              title="Patient Chart"
            />
          )}

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

          {currentTab === 'autocoder' && (
            <AutoCoderTab 
              patientName={patientName}
              patientMrn={demo.mrn}
              patientDob={demo.dob}
              patientAge={demo.age}
              patientGender={demo.sex}
              chiefComplaint={cc.text}
              vitals={vitals}
              medications={medications}
              allergies={allergies}
              pmhSelected={pmhSelected}
              rosState={rosState}
              rosSymptoms={rosSymptoms}
              peState={peState}
              peFindings={peFindings}
            />
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