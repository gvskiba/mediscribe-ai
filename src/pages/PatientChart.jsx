import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function PatientChart() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [loaderMsg, setLoaderMsg] = useState('Loading patient chart…');
  const [demoMode, setDemoMode] = useState(false);
  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [problems, setProblems] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [meds, setMeds] = useState([]);
  const [labs, setLabs] = useState([]);
  const [imaging, setImaging] = useState([]);
  const [note, setNote] = useState(null);
  const [shift, setShift] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [activeSection, setActiveSection] = useState('s-overview');
  const [activeTab, setActiveTab] = useState({ problems: 'active', meds: 'ed' });
  const aiMsgsRef = useRef(null);

  const DEMO = {
    user: { full_name: 'Dr. Gabriel Skiba', specialty: 'Emergency Medicine' },
    shift: { activePatients: 8, notesPending: 14, ordersQueue: 3, shiftHours: '11.6' },
    patient: {
      id: 'demo-1', firstName: 'Hiroshi', lastName: 'Nakamura',
      dateOfBirth: '1957-03-14', sex: 'Male', mrn: '4-471-8820', room: '4B',
      chiefComplaint: 'Chest Pain', status: 'MONITORING',
      attendingName: 'Dr. Skiba', triageLevel: 'ESI-2',
      insuranceName: 'Medicare', arrivedAt: new Date(Date.now() - 90 * 60000).toISOString(),
      hasAllergyFlag: true
    },
    vitals: {
      bp: '158/94', hr: 108, rr: 18, spo2: 93, temperature: '37.1°C',
      gcs: 15, weight: 82, recordedAt: new Date(Date.now() - 14 * 60000).toISOString()
    },
    timeline: [
      { type: 'arrival', occurredAt: new Date(Date.now() - 90 * 60000).toISOString(), title: 'Patient Arrived · Ambulance', detail: 'EMS reported acute onset chest pain radiating to left arm, onset ~60 min prior. Diaphoretic on arrival.' },
      { type: 'order', occurredAt: new Date(Date.now() - 84 * 60000).toISOString(), title: 'Triage Complete · ESI-2', detail: 'BP 162/98, HR 112, SpO₂ 91% RA. Placed on 2L NC. 12-lead ECG ordered STAT.' },
      { type: 'result', occurredAt: new Date(Date.now() - 78 * 60000).toISOString(), title: '12-Lead ECG Completed', detail: 'Sinus tachycardia at 110 bpm. ST depression in leads V4–V6. No STEMI criteria met. Cardiology notified.' },
      { type: 'med', occurredAt: new Date(Date.now() - 70 * 60000).toISOString(), title: 'IV Access · Labs Drawn', detail: '18G IV R antecubital. Troponin-I, BMP, CBC, BNP, coag panel sent. Aspirin 325mg PO given.' },
      { type: 'critical', occurredAt: new Date(Date.now() - 25 * 60000).toISOString(), title: '🚨 Critical Lab Result — Troponin-I', detail: 'Troponin-I = 0.84 ng/mL (ref <0.04). Confirmed NSTEMI. Heparin drip initiated.' },
      { type: 'consult', occurredAt: new Date(Date.now() - 10 * 60000).toISOString(), title: 'Cardiology Consult — Dr. Chen', detail: 'Evaluated at bedside. Recommends urgent cath lab. Ticagrelor 180mg PO administered.' },
      { type: 'current', occurredAt: new Date().toISOString(), title: 'Awaiting Echo · Cath Lab on standby', detail: 'Patient hemodynamically stable. Repeat vitals q15 min. Serial ECGs in progress.' },
    ],
    problems: [
      { icdCode: 'I21.4', name: 'Non-ST Elevation MI', status: 'active', onsetDate: new Date().toISOString() },
      { icdCode: 'I10', name: 'Hypertension, Essential', status: 'active', onsetYear: '2019' },
      { icdCode: 'E11.65', name: 'Type 2 DM w/ hyperglycemia', status: 'active', onsetYear: '2021' },
      { icdCode: 'I25.10', name: 'Coronary Artery Disease', status: 'active', onsetYear: '2022' },
      { icdCode: 'Z87.39', name: 'Hx of tobacco use', status: 'historical', onsetYear: '2015' },
      { icdCode: 'K21.0', name: 'GERD', status: 'historical', onsetYear: '2018' },
    ],
    allergies: [
      { allergen: 'Penicillin', severity: 'severe', reaction: 'Anaphylaxis', confirmedDate: '2018-06-01' },
      { allergen: 'Iodinated Contrast', severity: 'moderate', reaction: 'Urticaria', confirmedDate: '2020-03-15' },
      { allergen: 'Codeine', severity: 'mild', reaction: 'Nausea/Vomiting', reportedBy: 'Reported by patient' },
    ],
    meds: [
      { name: 'Aspirin', dose: '325 mg', frequency: '× 1 dose', route: 'PO', status: 'ed_given', administeredAt: new Date(Date.now() - 70 * 60000).toISOString(), administeredBy: 'Nurse T. Reyes' },
      { name: 'Heparin', dose: '4000U bolus→800U/hr', frequency: 'Drip active', route: 'IV', status: 'ed_given', administeredAt: new Date(Date.now() - 23 * 60000).toISOString(), administeredBy: 'Dr. Skiba' },
      { name: 'Ticagrelor', dose: '180 mg loading', frequency: '× 1 dose', route: 'PO', status: 'ed_given', administeredAt: new Date(Date.now() - 9 * 60000).toISOString(), administeredBy: 'Dr. Chen' },
      { name: 'Metoprolol', dose: '50 mg', frequency: 'BID', route: 'PO', status: 'home' },
      { name: 'Lisinopril', dose: '10 mg', frequency: 'Daily', route: 'PO', status: 'held' },
      { name: 'Atorvastatin', dose: '40 mg', frequency: 'Nightly', route: 'PO', status: 'home' },
      { name: 'Metformin', dose: '1000 mg', frequency: 'BID', route: 'PO', status: 'home' },
    ],
    labs: [
      { panel: 'Cardiac Markers', testName: 'Troponin-I', value: '0.84', unit: 'ng/mL', referenceRange: '<0.04', flag: 'hi', collectedAt: new Date(Date.now() - 25 * 60000).toISOString() },
      { panel: 'Cardiac Markers', testName: 'BNP', value: '812', unit: 'pg/mL', referenceRange: '<100', flag: 'hi', collectedAt: new Date(Date.now() - 25 * 60000).toISOString() },
      { panel: 'Cardiac Markers', testName: 'CK-MB', value: '3.2', unit: 'ng/mL', referenceRange: '0–6.3', flag: 'ok', collectedAt: new Date(Date.now() - 25 * 60000).toISOString() },
      { panel: 'Basic Metabolic', testName: 'Na⁺', value: '138', unit: 'mEq/L', referenceRange: '136–145', flag: 'ok', collectedAt: new Date(Date.now() - 70 * 60000).toISOString() },
      { panel: 'Basic Metabolic', testName: 'K⁺', value: '5.4', unit: 'mEq/L', referenceRange: '3.5–5.0', flag: 'hi', collectedAt: new Date(Date.now() - 70 * 60000).toISOString() },
      { panel: 'Basic Metabolic', testName: 'Creatinine', value: '1.1', unit: 'mg/dL', referenceRange: '0.7–1.2', flag: 'ok', collectedAt: new Date(Date.now() - 70 * 60000).toISOString() },
      { panel: 'Basic Metabolic', testName: 'Glucose', value: '218', unit: 'mg/dL', referenceRange: '70–100', flag: 'hi', collectedAt: new Date(Date.now() - 70 * 60000).toISOString() },
      { panel: 'Basic Metabolic', testName: 'HCO₃⁻', value: '22', unit: 'mEq/L', referenceRange: '22–29', flag: 'ok', collectedAt: new Date(Date.now() - 70 * 60000).toISOString() },
    ],
    imaging: [
      { studyType: 'Chest X-Ray (PA/Lat)', modality: 'XR', status: 'resulted', orderedAt: new Date(Date.now() - 84 * 60000).toISOString(), resultedAt: new Date(Date.now() - 62 * 60000).toISOString(), radiologist: 'Dr. Patel', finding: 'Mild cardiomegaly. No pneumothorax. Mild pulmonary vascular congestion. No frank consolidation or pleural effusion.' },
      { studyType: 'Echocardiogram (TTE)', modality: 'ECHO', status: 'pending', orderedAt: new Date(Date.now() - 9 * 60000).toISOString(), finding: null },
    ],
    note: {
      content: `CHIEF COMPLAINT: Acute chest pain, left arm radiation, diaphoresis. Onset ~60 minutes prior to arrival.

HPI: Mr. Nakamura is a 67-year-old male with known CAD, HTN, and T2DM who presented via EMS with acute onset chest pain 9/10, radiating to the left arm, associated with diaphoresis and mild dyspnea. Denies syncope or palpitations. Last took metoprolol this morning.

PHYSICAL EXAM:
Gen: Alert, oriented ×3, moderate distress, diaphoretic.
CV: Tachycardic, regular, no murmurs, rubs, or gallops.
Resp: Mild tachypnea, clear bilaterally.

ASSESSMENT & PLAN:
1. NSTEMI (I21.4) — Troponin-I 0.84 (>20× ULN). Lateral ST changes on ECG.
   • Aspirin 325mg ✓ | Ticagrelor 180mg ✓ | Heparin drip ✓
   • Cardiology at bedside — urgent PCI being arranged
2. Hypertension — holding lisinopril; BP monitored closely
3. T2DM — glucose 218, insulin sliding scale initiated
4. Hyperkalemia (K⁺ 5.4) — repeat BMP in 2 hours

DISPOSITION: Admit to Cardiac ICU. Cath lab on standby.`
    }
  };

  useEffect(() => {
    init();
  }, [searchParams]);

  useEffect(() => {
    if (aiMsgsRef.current) {
      aiMsgsRef.current.scrollTop = aiMsgsRef.current.scrollHeight;
    }
  }, [aiMessages]);

  const init = async () => {
    try {
      setLoaderMsg('Loading chart…');
      const patientId = searchParams.get('patientId') || searchParams.get('id');

      let livePatient = null;
      if (patientId) {
        try {
          // BASE44: livePatient = await base44.entities.Patient.get(patientId);
        } catch (e) {
          console.warn('fetchPatient failed:', e);
        }
      }

      const isDemo = !livePatient;
      setDemoMode(isDemo);

      if (isDemo) {
        setCurrentUser(DEMO.user);
        setShift(DEMO.shift);
        setPatient(DEMO.patient);
        setVitals(DEMO.vitals);
        setTimeline(DEMO.timeline);
        setProblems(DEMO.problems);
        setAllergies(DEMO.allergies);
        setMeds(DEMO.meds);
        setLabs(DEMO.labs);
        setImaging(DEMO.imaging);
        setNote(DEMO.note);
        setAiMessages([{ role: 'sys', text: '⚡ Running in demo mode — Base44 entities not yet connected. All data shown is sample data.' }]);
      } else {
        // Fetch real data
        const user = await base44.auth.me().catch(() => DEMO.user);
        setCurrentUser(user);
        setShift(DEMO.shift);
        setPatient(livePatient);
        // BASE44: Fetch all other entities here
        setAiMessages([{ role: 'sys', text: 'Patient chart loaded. Select a quick action or ask a clinical question.' }]);
      }

      setLoading(false);
    } catch (err) {
      console.error('Chart init error:', err);
      setDemoMode(true);
      setCurrentUser(DEMO.user);
      setShift(DEMO.shift);
      setPatient(DEMO.patient);
      setVitals(DEMO.vitals);
      setTimeline(DEMO.timeline);
      setProblems(DEMO.problems);
      setAllergies(DEMO.allergies);
      setMeds(DEMO.meds);
      setLabs(DEMO.labs);
      setImaging(DEMO.imaging);
      setNote(DEMO.note);
      setAiMessages([{ role: 'sys', text: '⚠ Error during load (' + err.message + '). Showing demo data.' }]);
      setLoading(false);
    }
  };

  const calcAge = (dob) => {
    if (!dob) return null;
    const b = new Date(dob), n = new Date();
    let a = n.getFullYear() - b.getFullYear();
    if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
    return a;
  };

  const formatDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }); } catch { return '—'; }
  };

  const formatTime = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }); } catch { return '—'; }
  };

  const timeAgo = (d) => {
    const m = Math.floor((Date.now() - new Date(d)) / 60000);
    return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : Math.floor(m / 60) + ' hr ago';
  };

  const isToday = (d) => {
    if (!d) return false;
    const dt = new Date(d), t = new Date();
    return dt.getFullYear() === t.getFullYear() && dt.getMonth() === t.getMonth() && dt.getDate() === t.getDate();
  };

  const esc = (s) => String(s || '');

  const triageBadge = (l) => ({ 'ESI-1': 'badge-coral', 'ESI-2': 'badge-orange', 'ESI-3': 'badge-gold', 'ESI-4': 'badge-teal', 'ESI-5': 'badge-muted' }[l] ?? 'badge-muted');

  const getVitalClass = (id, val, { hi, lo } = {}) => {
    const n = parseFloat(String(val));
    if (isNaN(n)) return 'val';
    if (hi !== null && hi !== undefined && n > hi) return 'val hi';
    if (lo !== null && lo !== undefined && n < lo) return 'val lo';
    return 'val';
  };

  const vitalCls = (key, val) => {
    const n = parseFloat(String(val));
    if (key === 'bp') return n > 140 ? 'text-coral' : n < 90 ? 'text-blue' : 'text-teal';
    if (key === 'hr') return n > 100 ? 'text-gold' : n < 50 ? 'text-blue' : 'text-teal';
    return 'text-teal';
  };

  const bpStatus = (val) => { const n = parseFloat(String(val)); return n > 140 ? '↑ Hypertensive' : n < 90 ? '↓ Hypotensive' : 'Normal range'; };
  const hrStatus = (val) => { const n = parseFloat(String(val)); return n > 100 ? 'Tachycardic' : n < 50 ? 'Bradycardic' : 'Normal range'; };

  const activeProblems = problems.filter(p => p.status === 'active');
  const historicalProblems = problems.filter(p => p.status !== 'active');
  const edMeds = meds.filter(m => m.status === 'ed_given');
  const homeMeds = meds.filter(m => m.status === 'home');
  const heldMeds = meds.filter(m => m.status === 'held');
  const critLabs = labs.filter(l => l.flag === 'hi' || l.flag === 'lo');
  const todayDx = problems.filter(p => isToday(p.onsetDate));

  const labPanels = labs.reduce((acc, l) => {
    const panel = l.panel ?? 'General';
    if (!acc[panel]) acc[panel] = [];
    acc[panel].push(l);
    return acc;
  }, {});

  const dotClass = (section) => {
    if (section === 'overview') return 'done';
    if (section === 'timeline') return 'done';
    if (section === 'problems') return activeProblems.length ? 'partial' : '';
    if (section === 'meds') return meds.length ? 'done' : '';
    if (section === 'labs') return critLabs.length ? 'alert' : labs.length ? 'done' : '';
    if (section === 'imaging') return imaging.length ? 'partial' : '';
    if (section === 'allergies') return allergies.length ? 'done' : '';
    if (section === 'note') return note?.content ? 'done' : '';
    return '';
  };

  const scrollToSection = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const switchTab = (category, tab) => {
    setActiveTab(prev => ({ ...prev, [category]: tab }));
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
        :root{--bg:#050f1e;--bg-panel:#081628;--bg-card:#0b1e36;--bg-up:#0e2544;--border:#1a3555;--border-hi:#2a4f7a;--blue:#3b9eff;--cyan:#00d4ff;--teal:#00e5c0;--gold:#f5c842;--purple:#9b6dff;--coral:#ff6b6b;--green:#3dffa0;--orange:#ff9f43;--txt:#e8f0fe;--txt2:#8aaccc;--txt3:#4a6a8a;--txt4:#2e4a6a;--nav-h:50px;--sub-nav-h:42px;--vit-h:38px;--icon-sb:65px;--sb-w:220px;--ai-w:295px;--r:8px;--rl:12px;--main-top:calc(var(--nav-h) + var(--sub-nav-h) + var(--vit-h))}
        .pc-body{background:var(--bg);color:var(--txt);font-family:'DM Sans',sans-serif;font-size:14px;margin:0;padding:0;height:100vh;overflow:hidden;position:fixed;inset:0}
        .icon-sidebar{position:fixed;top:0;left:0;bottom:0;width:var(--icon-sb);background:#040d19;border-right:1px solid var(--border);display:flex;flex-direction:column;align-items:center;z-index:200}
        .isb-logo{width:100%;height:var(--nav-h);flex-shrink:0;display:flex;align-items:center;justify-content:center;border-bottom:1px solid var(--border)}
        .isb-logo-box{width:34px;height:34px;background:var(--blue);border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:white;cursor:pointer}
        .isb-scroll{overflow-y:auto;width:100%;flex:1;display:flex;flex-direction:column;align-items:center;padding:6px 0 10px;gap:1px}
        .isb-group-label{font-size:8px;color:var(--txt4);text-transform:uppercase;letter-spacing:.08em;text-align:center;padding:6px 4px 2px;width:100%}
        .isb-btn{width:48px;height:46px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border-radius:var(--r);cursor:pointer;transition:all .15s;color:var(--txt3);border:1px solid transparent}
        .isb-btn:hover{background:var(--bg-up);border-color:var(--border);color:var(--txt2)}
        .isb-btn.active{background:rgba(59,158,255,.1);border-color:rgba(59,158,255,.3);color:var(--blue)}
        .isb-icon{font-size:16px;line-height:1} .isb-lbl{font-size:8.5px;line-height:1;white-space:nowrap}
        .isb-sep{width:36px;height:1px;background:var(--border);margin:4px 0;flex-shrink:0}
        .isb-new-badge{background:rgba(59,158,255,.2);border:1px solid rgba(59,158,255,.4);border-radius:4px;padding:1px 3px;font-size:9px;color:var(--blue);font-weight:700}
        .navbar{position:fixed;top:0;left:var(--icon-sb);right:0;height:var(--nav-h);background:var(--bg-panel);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:10px;z-index:100}
        .nav-welcome{font-size:13px;color:var(--txt2);font-weight:500;white-space:nowrap}
        .nav-welcome strong{color:var(--txt);font-weight:600}
        .nav-sep{width:1px;height:22px;background:var(--border);flex-shrink:0}
        .nav-stat{display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:4px 12px;min-width:70px;cursor:pointer}
        .nav-stat-val{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:600;color:var(--txt);line-height:1.2}
        .nav-stat-val.alert{color:var(--gold)}
        .nav-stat-lbl{font-size:9px;color:var(--txt3);text-transform:uppercase;letter-spacing:.04em}
        .nav-right{margin-left:auto;display:flex;align-items:center;gap:8px}
        .nav-specialty{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:5px 12px;font-size:12px;color:var(--txt2);cursor:pointer}
        .nav-time{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:5px 12px;font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--txt2);cursor:pointer}
        .nav-ai-on{display:flex;align-items:center;gap:5px;background:rgba(0,229,192,.08);border:1px solid rgba(0,229,192,.3);border-radius:var(--r);padding:5px 12px;font-size:12px;font-weight:600;color:var(--teal)}
        .nav-ai-dot{width:7px;height:7px;border-radius:50%;background:var(--teal);animation:ai-pulse 2s ease-in-out infinite}
        @keyframes ai-pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(0,229,192,.4)}50%{opacity:.8;box-shadow:0 0 0 6px rgba(0,229,192,0)}}
        .nav-new-pt{background:var(--teal);color:var(--bg);border:none;border-radius:var(--r);padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap}
        .sub-navbar{position:fixed;top:var(--nav-h);left:var(--icon-sb);right:0;height:var(--sub-nav-h);background:var(--bg-card);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:10px;z-index:99}
        .sub-nav-logo{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:var(--cyan);letter-spacing:-.5px}
        .sub-nav-sep{color:var(--txt4)}
        .sub-nav-title{font-size:13px;color:var(--txt2);font-weight:500}
        .sub-nav-badge{background:var(--bg-up);border:1px solid var(--border);border-radius:20px;padding:2px 10px;font-size:11px;color:var(--teal);font-family:'JetBrains Mono',monospace}
        .sub-nav-right{margin-left:auto;display:flex;align-items:center;gap:8px}
        .btn-ghost{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:5px 12px;font-size:12px;color:var(--txt2);cursor:pointer;display:inline-flex;align-items:center;gap:5px;transition:all .15s}
        .btn-ghost:hover{border-color:var(--border-hi);color:var(--txt)}
        .btn-primary{background:var(--teal);color:var(--bg);border:none;border-radius:var(--r);padding:5px 14px;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:5px}
        .btn-blue{background:var(--blue);color:white;border:none;border-radius:var(--r);padding:5px 14px;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:5px}
        .btn-coral{background:rgba(255,107,107,.15);border:1px solid rgba(255,107,107,.35);color:var(--coral);border-radius:var(--r);padding:5px 12px;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:5px}
        .vitals-bar{position:fixed;top:calc(var(--nav-h) + var(--sub-nav-h));left:var(--icon-sb);right:0;height:var(--vit-h);background:var(--bg-panel);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 14px;gap:10px;z-index:98;overflow:hidden}
        .vb-name{font-family:'Playfair Display',serif;font-size:14px;color:var(--txt);font-weight:600;white-space:nowrap}
        .vb-meta{font-size:11px;color:var(--txt3);white-space:nowrap}
        .vb-div{width:1px;height:20px;background:var(--border);flex-shrink:0}
        .vb-vital{display:flex;align-items:center;gap:4px;font-family:'JetBrains Mono',monospace;font-size:11px;white-space:nowrap}
        .vb-vital .lbl{color:var(--txt3);font-size:10px} .vb-vital .val{color:var(--txt2)}
        .vb-vital .val.hi{color:var(--gold);animation:glow-gold 2s ease-in-out infinite}
        .vb-vital .val.lo{color:var(--blue);animation:glow-blue 2s ease-in-out infinite}
        .vb-vital .val.crit{color:var(--coral);animation:glow-red 2s ease-in-out infinite}
        @keyframes glow-red{0%,100%{text-shadow:0 0 4px rgba(255,107,107,.4)}50%{text-shadow:0 0 10px rgba(255,107,107,.9)}}
        @keyframes glow-blue{0%,100%{text-shadow:0 0 4px rgba(59,158,255,.4)}50%{text-shadow:0 0 10px rgba(59,158,255,.9)}}
        @keyframes glow-gold{0%,100%{text-shadow:0 0 4px rgba(245,200,66,.4)}50%{text-shadow:0 0 10px rgba(245,200,66,.9)}}
        .main-wrap{position:fixed;top:var(--main-top);left:var(--icon-sb);right:0;bottom:0;display:flex}
        .sidebar{width:var(--sb-w);flex-shrink:0;background:var(--bg-panel);border-right:1px solid var(--border);overflow-y:auto;padding:14px 10px;display:flex;flex-direction:column;gap:6px}
        .sb-label{font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.06em;padding:0 4px;margin-top:4px}
        .sb-nav-btn{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:var(--r);cursor:pointer;transition:all .15s;border:1px solid transparent;font-size:12px;color:var(--txt2)}
        .sb-nav-btn:hover{background:var(--bg-up);border-color:var(--border);color:var(--txt)}
        .sb-nav-btn.active{background:rgba(59,158,255,.1);border-color:rgba(59,158,255,.3);color:var(--blue)}
        .sb-nav-btn .icon{font-size:14px;width:18px;text-align:center}
        .sb-dot{width:7px;height:7px;border-radius:50%;background:var(--border);margin-left:auto;flex-shrink:0}
        .sb-dot.done{background:var(--teal);box-shadow:0 0 6px rgba(0,229,192,.5)}
        .sb-dot.partial{background:var(--orange);box-shadow:0 0 6px rgba(255,159,67,.5)}
        .sb-dot.alert{background:var(--coral);box-shadow:0 0 6px rgba(255,107,107,.5)}
        .sb-divider{height:1px;background:var(--border);margin:8px 0}
        .sb-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--rl);padding:12px;margin-bottom:2px}
        .content{flex:1;overflow-y:auto;padding:18px 20px 30px;display:flex;flex-direction:column;gap:16px}
        .ai-panel{width:var(--ai-w);flex-shrink:0;background:var(--bg-panel);border-left:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden}
        .ai-header{padding:12px 14px;border-bottom:1px solid var(--border);flex-shrink:0}
        .ai-header-top{display:flex;align-items:center;gap:8px;margin-bottom:8px}
        .ai-dot{width:8px;height:8px;border-radius:50%;background:var(--teal);flex-shrink:0;animation:ai-pulse 2s ease-in-out infinite}
        .ai-label{font-size:12px;font-weight:600;color:var(--txt2)}
        .ai-model{margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:10px;background:var(--bg-up);border:1px solid var(--border);border-radius:20px;padding:1px 7px;color:var(--txt3)}
        .ai-quick-btns{display:flex;flex-wrap:wrap;gap:4px}
        .ai-qbtn{padding:3px 9px;border-radius:20px;font-size:11px;cursor:pointer;background:var(--bg-up);border:1px solid var(--border);color:var(--txt2);transition:all .15s}
        .ai-qbtn:hover{border-color:var(--teal);color:var(--teal);background:rgba(0,229,192,.06)}
        .ai-msgs{flex:1;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:8px}
        .ai-msg{padding:9px 11px;border-radius:var(--r);font-size:12px;line-height:1.55}
        .ai-msg.sys{background:var(--bg-up);color:var(--txt3);font-style:italic;border:1px solid var(--border)}
        .ai-msg.user{background:rgba(59,158,255,.12);border:1px solid rgba(59,158,255,.25);color:var(--txt2)}
        .ai-msg.bot{background:rgba(0,229,192,.07);border:1px solid rgba(0,229,192,.18);color:var(--txt)}
        .ai-loader{display:flex;gap:5px;padding:10px 12px;align-items:center}
        .ai-loader span{width:6px;height:6px;border-radius:50%;background:var(--teal);animation:bounce 1.2s ease-in-out infinite}
        .ai-loader span:nth-child(2){animation-delay:.2s} .ai-loader span:nth-child(3){animation-delay:.4s}
        @keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-6px);opacity:1}}
        .ai-input-wrap{padding:10px 12px;border-top:1px solid var(--border);flex-shrink:0;display:flex;gap:6px}
        .ai-input{flex:1;background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:7px 10px;color:var(--txt);font-size:12px;outline:none;resize:none;font-family:'DM Sans',sans-serif}
        .ai-input:focus{border-color:var(--teal)}
        .ai-send{background:var(--teal);color:var(--bg);border:none;border-radius:var(--r);padding:7px 12px;font-size:13px;cursor:pointer;font-weight:700}
        .section-box{background:var(--bg-panel);border:1px solid var(--border);border-radius:var(--rl);padding:16px 18px}
        .sec-header{display:flex;align-items:center;gap:10px;margin-bottom:14px}
        .sec-icon{font-size:18px}
        .sec-title{font-family:'Playfair Display',serif;font-size:17px;font-weight:600;color:var(--txt)}
        .sec-subtitle{font-size:12px;color:var(--txt3);margin-top:1px}
        .card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--rl);padding:14px 16px}
        .badge{font-size:11px;font-family:'JetBrains Mono',monospace;padding:2px 9px;border-radius:20px;font-weight:600;white-space:nowrap}
        .badge-teal{background:rgba(0,229,192,.12);color:var(--teal);border:1px solid rgba(0,229,192,.3)}
        .badge-blue{background:rgba(59,158,255,.12);color:var(--blue);border:1px solid rgba(59,158,255,.3)}
        .badge-gold{background:rgba(245,200,66,.12);color:var(--gold);border:1px solid rgba(245,200,66,.3)}
        .badge-coral{background:rgba(255,107,107,.15);color:var(--coral);border:1px solid rgba(255,107,107,.3)}
        .badge-orange{background:rgba(255,159,67,.12);color:var(--orange);border:1px solid rgba(255,159,67,.3)}
        .badge-purple{background:rgba(155,109,255,.12);color:var(--purple);border:1px solid rgba(155,109,255,.3)}
        .badge-muted{background:rgba(74,106,138,.2);color:var(--txt3)}
        .divider{height:1px;background:var(--border);margin:12px 0}
        .flex{display:flex} .flex-col{display:flex;flex-direction:column}
        .gap-4{gap:4px} .gap-6{gap:6px} .gap-8{gap:8px} .gap-10{gap:10px} .gap-12{gap:12px}
        .flex-1{flex:1} .items-center{align-items:center} .justify-between{justify-content:space-between}
        .ml-auto{margin-left:auto}
        .mt-8{margin-top:8px} .mt-12{margin-top:12px}
        .mb-8{margin-bottom:8px} .mb-12{margin-bottom:12px}
        .text-mono{font-family:'JetBrains Mono',monospace}
        .text-muted{color:var(--txt3)} .text-dim{color:var(--txt4)}
        .text-teal{color:var(--teal)} .text-blue{color:var(--blue)}
        .text-coral{color:var(--coral)} .text-gold{color:var(--gold)}
        .text-orange{color:var(--orange)} .text-purple{color:var(--purple)}
        .text-sm{font-size:12px} .text-xs{font-size:11px}
        .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
        .col-full{grid-column:1/-1}
        .allergy-tag{display:inline-flex;align-items:center;gap:5px;background:rgba(255,107,107,.1);border:1px solid rgba(255,107,107,.3);border-radius:20px;padding:3px 10px;font-size:11px;color:var(--coral);font-weight:600}
        .allergy-tag .sev{font-size:9px;color:rgba(255,107,107,.6);text-transform:uppercase;letter-spacing:.05em}
        .allergy-tag.moderate{background:rgba(255,159,67,.08);border-color:rgba(255,159,67,.25);color:var(--orange)}
        .allergy-tag.moderate .sev{color:rgba(255,159,67,.6)}
        .allergy-tag.mild{background:rgba(74,106,138,.2);border-color:var(--border);color:var(--txt3)}
        .allergy-tag.mild .sev{color:var(--txt4)}
        .timeline{display:flex;flex-direction:column}
        .tl-item{display:flex;gap:12px}
        .tl-spine{display:flex;flex-direction:column;align-items:center;width:20px;flex-shrink:0}
        .tl-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:4px}
        .tl-line{flex:1;width:1px;background:var(--border);min-height:16px}
        .tl-item:last-child .tl-line{display:none}
        .tl-body{padding-bottom:14px;flex:1}
        .tl-time{font-size:10px;color:var(--txt4);font-family:'JetBrains Mono',monospace}
        .tl-event{font-size:12px;color:var(--txt);font-weight:500}
        .tl-detail{font-size:11px;color:var(--txt3);margin-top:2px;line-height:1.45}
        .problem-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:var(--r);border:1px solid transparent;transition:all .15s}
        .problem-row:hover{background:var(--bg-up);border-color:var(--border)}
        .problem-icd{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--txt4);min-width:64px}
        .problem-name{font-size:12px;color:var(--txt);flex:1}
        .problem-onset{font-size:11px;color:var(--txt3)}
        .med-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:var(--r);border:1px solid transparent;transition:all .15s}
        .med-row:hover{background:var(--bg-up);border-color:var(--border)}
        .med-name{font-size:12px;color:var(--txt);font-weight:500;flex:1}
        .med-dose{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--blue)}
        .med-freq{font-size:11px;color:var(--txt3)}
        .med-route{font-size:10px;background:var(--bg-up);border:1px solid var(--border);border-radius:4px;padding:1px 6px;color:var(--txt3);font-family:'JetBrains Mono',monospace}
        .lab-table{width:100%;border-collapse:collapse}
        .lab-table th{font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.05em;padding:6px 8px;text-align:left;border-bottom:1px solid var(--border)}
        .lab-table td{font-size:12px;padding:7px 8px;border-bottom:1px solid rgba(26,53,85,.5);vertical-align:middle}
        .lab-table tr:last-child td{border-bottom:none}
        .lab-table tr:hover td{background:rgba(14,37,68,.5)}
        .lab-val{font-family:'JetBrains Mono',monospace;font-weight:600}
        .lab-val.hi{color:var(--coral)} .lab-val.lo{color:var(--blue)} .lab-val.ok{color:var(--teal)}
        .lab-ref{font-size:10px;color:var(--txt4);font-family:'JetBrains Mono',monospace}
        .lab-flag{width:10px;height:10px;border-radius:50%;flex-shrink:0}
        .lab-flag.hi{background:var(--coral);box-shadow:0 0 5px rgba(255,107,107,.5)}
        .lab-flag.lo{background:var(--blue);box-shadow:0 0 5px rgba(59,158,255,.5)}
        .lab-flag.ok{background:var(--teal);box-shadow:0 0 5px rgba(0,229,192,.4)}
        .stat-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--rl);padding:12px 14px;display:flex;flex-direction:column;gap:4px}
        .stat-val{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:600;line-height:1}
        .stat-lbl{font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.05em}
        .stat-sub{font-size:11px;color:var(--txt4);margin-top:2px}
        .imaging-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--rl);padding:12px 14px;display:flex;gap:12px;align-items:flex-start;cursor:pointer;transition:border-color .15s}
        .imaging-card:hover{border-color:var(--border-hi)}
        .imaging-icon{font-size:28px;flex-shrink:0;line-height:1}
        .imaging-body{flex:1}
        .imaging-title{font-size:13px;font-weight:600;color:var(--txt)}
        .imaging-meta{font-size:11px;color:var(--txt3);margin-top:2px}
        .imaging-finding{font-size:12px;color:var(--txt2);margin-top:6px;line-height:1.5;background:var(--bg-up);border-left:2px solid var(--border-hi);border-radius:0 4px 4px 0;padding:6px 8px}
        .note-preview{background:var(--bg-up);border:1px solid var(--border);border-radius:var(--r);padding:10px 12px;font-size:12px;color:var(--txt2);line-height:1.75;white-space:pre-wrap}
        .tab-bar{display:flex;gap:2px;border-bottom:1px solid var(--border);margin-bottom:14px}
        .tab{padding:6px 14px;font-size:12px;color:var(--txt3);cursor:pointer;border-bottom:2px solid transparent;transition:all .15s;margin-bottom:-1px}
        .tab:hover{color:var(--txt2)} .tab.active{color:var(--blue);border-bottom-color:var(--blue);font-weight:600}
        .page-loader{position:fixed;inset:0;background:var(--bg);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;z-index:999}
        .page-loader.hidden{display:none}
        .loader-logo{font-family:'Playfair Display',serif;font-size:32px;font-weight:700;color:var(--cyan)}
        .loader-bar-wrap{width:200px;height:3px;background:var(--bg-up);border-radius:2px;overflow:hidden}
        .loader-bar{height:100%;background:var(--teal);border-radius:2px;animation:load-fill 1.2s ease forwards}
        @keyframes load-fill{from{width:0}to{width:100%}}
        .loader-msg{font-size:12px;color:var(--txt3)}
        .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 20px;gap:8px;color:var(--txt4);text-align:center}
        .empty-state .icon{font-size:28px;opacity:.4} .empty-state .msg{font-size:12px}
      `}</style>

      <div className="pc-body">
        {/* PAGE LOADER */}
        {loading && (
          <div className="page-loader">
            <div className="loader-logo">notrya</div>
            <div className="loader-bar-wrap"><div className="loader-bar"></div></div>
            <div className="loader-msg">{loaderMsg}</div>
          </div>
        )}

        {/* DEMO BANNER */}
        {demoMode && !loading && (
          <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: 'rgba(245,200,66,.12)', border: '1px solid rgba(245,200,66,.4)', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '4px 16px', fontSize: '11px', color: '#f5c842', fontFamily: '"JetBrains Mono",monospace', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={(e) => e.currentTarget.style.display = 'none'}>
            ⚡ DEMO MODE — sample data · <span style={{ textDecoration: 'underline', opacity: .7 }}>Connect Base44 entities to show live data</span> <span style={{ opacity: .5, marginLeft: '4px' }}>✕</span>
          </div>
        )}

        {/* ICON SIDEBAR */}
        <aside className="icon-sidebar">
          <div className="isb-logo"><div className="isb-logo-box">N.</div></div>
          <div className="isb-scroll">
            <span className="isb-group-label">CORE</span>
            <div className="isb-btn"><span className="isb-icon">🏠</span><span className="isb-lbl">Home</span></div>
            <div className="isb-btn"><span className="isb-icon">📊</span><span className="isb-lbl">Dashboard</span></div>
            <div className="isb-btn"><span className="isb-icon">🔄</span><span className="isb-lbl">Shift</span></div>
            <div className="isb-btn active"><span className="isb-icon">👥</span><span className="isb-lbl">Patients</span></div>
            <div className="isb-btn"><span className="isb-new-badge">NEW</span><span className="isb-lbl">New Pt</span></div>
            <div className="isb-sep"></div>
            <span className="isb-group-label">DOCUMENTATION</span>
            <div className="isb-btn"><span className="isb-icon">✨</span><span className="isb-lbl">Note Hub</span></div>
            <div className="isb-btn"><span className="isb-icon">🎙️</span><span className="isb-lbl">Transcription</span></div>
            <div className="isb-btn"><span className="isb-icon">📄</span><span className="isb-lbl">SOAP</span></div>
            <div className="isb-btn"><span className="isb-icon">📝</span><span className="isb-lbl">Note Studio</span></div>
            <div className="isb-btn"><span className="isb-icon">🗒️</span><span className="isb-lbl">Notes</span></div>
            <div className="isb-btn"><span className="isb-icon">⚖️</span><span className="isb-lbl">MDM</span></div>
            <div className="isb-btn"><span className="isb-icon">📋</span><span className="isb-lbl">Orders</span></div>
            <div className="isb-btn"><span className="isb-icon">🚪</span><span className="isb-lbl">Discharge</span></div>
            <div className="isb-sep"></div>
            <span className="isb-group-label">REFERENCE</span>
            <div className="isb-btn"><span className="isb-icon">💊</span><span className="isb-lbl">Drugs</span></div>
            <div className="isb-btn"><span className="isb-icon">🦠</span><span className="isb-lbl">Antibiotics</span></div>
            <div className="isb-btn"><span className="isb-icon">🧮</span><span className="isb-lbl">Calculators</span></div>
          </div>
        </aside>

        {/* NAVBAR */}
        <nav className="navbar">
          <span className="nav-welcome">Welcome, <strong>{currentUser?.full_name || '—'}</strong></span>
          <div className="nav-sep"></div>
          <div className="nav-stat"><span className="nav-stat-val">{shift?.activePatients || '—'}</span><span className="nav-stat-lbl">Active Patients</span></div>
          <div className="nav-stat"><span className="nav-stat-val alert">{shift?.notesPending || '—'}</span><span className="nav-stat-lbl">Notes Pending</span></div>
          <div className="nav-stat"><span className="nav-stat-val">{shift?.ordersQueue || '—'}</span><span className="nav-stat-lbl">Orders Queue</span></div>
          <div className="nav-stat"><span className="nav-stat-val">{shift?.shiftHours || '—'}</span><span className="nav-stat-lbl">Shift Hours</span></div>
          <div className="nav-right">
            <div className="nav-specialty">{currentUser?.specialty || '—'} ▾</div>
            <div className="nav-time">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
            <div className="nav-ai-on"><div className="nav-ai-dot"></div> AI ON</div>
            <button className="nav-new-pt">+ New Patient</button>
          </div>
        </nav>

        {/* SUB-NAVBAR */}
        <div className="sub-navbar">
          <span className="sub-nav-logo">notrya</span>
          <span className="sub-nav-sep">|</span>
          <span className="sub-nav-title">Patient Chart</span>
          <span className="sub-nav-badge">PT-{patient?.mrn || '—'}</span>
          <div className="sub-nav-right">
            <button className="btn-ghost">← All Patients</button>
            <button className="btn-ghost">📋 Orders</button>
            <button className="btn-ghost">📝 SOAP Note</button>
            <button className="btn-coral">🚪 Discharge</button>
            <button className="btn-primary">💾 Save Chart</button>
          </div>
        </div>

        {/* VITALS BAR */}
        <div className="vitals-bar">
          <span className="vb-name">{patient ? `${patient.lastName}, ${patient.firstName}` : '—'}</span>
          <span className="vb-meta text-muted">{patient ? `${calcAge(patient.dateOfBirth) || '—'} y/o · ${patient.sex || '—'} · DOB ${formatDate(patient.dateOfBirth)}` : '—'}</span>
          <div className="vb-div"></div>
          <div className="vb-vital"><span className="lbl">CC</span><span className="val" style={{ color: 'var(--orange)' }}>{patient?.chiefComplaint || '—'}</span></div>
          <div className="vb-div"></div>
          <div className="vb-vital"><span className="lbl">BP</span><span className={getVitalClass('bp', vitals?.bp, { hi: 140 })}>{vitals?.bp || '—'}</span></div>
          <div className="vb-vital"><span className="lbl">HR</span><span className={getVitalClass('hr', vitals?.hr, { hi: 100, lo: 50 })}>{vitals?.hr || '—'}</span></div>
          <div className="vb-vital"><span className="lbl">RR</span><span className={getVitalClass('rr', vitals?.rr, { hi: 20, lo: 10 })}>{vitals?.rr || '—'}</span></div>
          <div className="vb-vital"><span className="lbl">SpO₂</span><span className={getVitalClass('spo2', vitals?.spo2, { lo: 95 })}>{vitals?.spo2 || '—'}</span></div>
          <div className="vb-vital"><span className="lbl">Temp</span><span className="val">{vitals?.temperature || '—'}</span></div>
          <div className="vb-vital"><span className="lbl">GCS</span><span className={getVitalClass('gcs', vitals?.gcs, { lo: 14 })}>{vitals?.gcs || '—'}</span></div>
          <div className="vb-vital"><span className="lbl">Wt</span><span className="val">{vitals?.weight ? vitals.weight + ' kg' : '—'}</span></div>
          <div className="vb-div"></div>
          <span className="text-muted text-xs">{vitals?.recordedAt ? 'Last vitals ' + timeAgo(vitals.recordedAt) : ''}</span>
          <div className="ml-auto flex gap-8 items-center">
            {patient?.hasAllergyFlag && <span className="badge badge-coral">⚠ ALLERGY FLAG</span>}
            <span className={`badge ${triageBadge(patient?.status)}`}>{patient?.status || 'UNKNOWN'}</span>
            {patient?.room && <span className="badge badge-blue">Room {patient.room}</span>}
            {patient?.arrivedAt && <span className="badge badge-muted" style={{ fontSize: '9px' }}>Arrived {formatTime(patient.arrivedAt)}</span>}
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="main-wrap">
          {/* SIDEBAR */}
          <aside className="sidebar">
            <div className="sb-card">
              {patient ? (
                <>
                  <div className="flex items-center gap-8">
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(59,158,255,.15)', border: '1px solid rgba(59,158,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display',serif", fontSize: '14px', fontWeight: 700, color: 'var(--blue)', flexShrink: 0 }}>
                      {(patient.firstName?.[0] || '') + (patient.lastName?.[0] || '')}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt)' }}>{patient.lastName}, {patient.firstName}</div>
                      <div className="text-muted text-xs">MRN {patient.mrn || '—'}</div>
                    </div>
                  </div>
                  <div className="divider" style={{ margin: '8px 0' }}></div>
                  <div className="flex justify-between" style={{ fontSize: '11px' }}><span className="text-muted">Attending</span><span style={{ color: 'var(--txt2)', fontWeight: 500 }}>{patient.attendingName || '—'}</span></div>
                  <div className="flex justify-between" style={{ fontSize: '11px', marginTop: '4px' }}><span className="text-muted">Triage</span><span className={`badge ${triageBadge(patient.triageLevel)}`} style={{ fontSize: '9px', padding: '1px 6px' }}>{patient.triageLevel || '—'}</span></div>
                  <div className="flex justify-between" style={{ fontSize: '11px', marginTop: '4px' }}><span className="text-muted">Insurance</span><span style={{ color: 'var(--txt2)' }}>{patient.insuranceName || '—'}</span></div>
                </>
              ) : (
                <div className="empty-state" style={{ padding: '16px 0' }}><div className="icon">👤</div><div className="msg">Loading…</div></div>
              )}
            </div>
            <div className="sb-label">Chart Sections</div>
            {[
              { id: 's-overview', icon: '📊', label: 'Overview', dot: 'overview' },
              { id: 's-timeline', icon: '🕐', label: 'Timeline', dot: 'timeline' },
              { id: 's-problems', icon: '🏷️', label: 'Problem List', dot: 'problems' },
              { id: 's-meds', icon: '💊', label: 'Medications', dot: 'meds' },
              { id: 's-labs', icon: '🧪', label: 'Labs', dot: 'labs' },
              { id: 's-imaging', icon: '🩻', label: 'Imaging', dot: 'imaging' },
              { id: 's-allergies', icon: '⚠️', label: 'Allergies', dot: 'allergies' },
              { id: 's-note', icon: '📝', label: 'Current Note', dot: 'note' },
            ].map(s => (
              <div key={s.id} className={`sb-nav-btn ${activeSection === s.id ? 'active' : ''}`} onClick={() => scrollToSection(s.id)}>
                <span className="icon">{s.icon}</span> {s.label}
                <span className={`sb-dot ${dotClass(s.dot)}`}></span>
              </div>
            ))}
            <div className="sb-divider"></div>
            <div className="sb-label">Flags</div>
            <div>
              {critLabs.length > 0 && (
                <div className="sb-card" style={{ borderColor: 'rgba(255,107,107,.25)', marginBottom: '4px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--coral)', fontWeight: 600 }}>🚨 Critical Results</div>
                  <div className="text-xs text-muted mt-8">{critLabs.slice(0, 3).map(l => l.testName + (l.flag === 'hi' ? ' ▲' : ' ▼')).join(' · ')}</div>
                </div>
              )}
              {todayDx.length > 0 && (
                <div className="sb-card" style={{ borderColor: 'rgba(255,159,67,.25)', marginBottom: '4px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--orange)', fontWeight: 600 }}>⚕️ New Dx Today</div>
                  <div className="text-xs text-muted mt-8">{todayDx.map(p => p.name).join(', ')}</div>
                </div>
              )}
              {critLabs.length === 0 && todayDx.length === 0 && (
                <div className="text-xs text-muted" style={{ padding: '4px 8px' }}>No active flags.</div>
              )}
            </div>
          </aside>

          {/* CONTENT */}
          <main className="content">
            {/* OVERVIEW */}
            <div id="s-overview">
              <div className="grid-4">
                {vitals?.bp && (
                  <div className="stat-card">
                    <div className={`stat-val ${vitalCls('bp', vitals.bp)}`}>{vitals.bp}</div>
                    <div className="stat-lbl">Blood Pressure</div>
                    <div className="stat-sub">{bpStatus(vitals.bp)}</div>
                  </div>
                )}
                {vitals?.hr && (
                  <div className="stat-card">
                    <div className={`stat-val ${vitalCls('hr', vitals.hr)}`}>{vitals.hr}</div>
                    <div className="stat-lbl">Heart Rate</div>
                    <div className="stat-sub">{hrStatus(vitals.hr)}</div>
                  </div>
                )}
                {vitals?.spo2 && (
                  <div className="stat-card">
                    <div className={`stat-val ${parseFloat(vitals.spo2) < 95 ? 'text-blue' : 'text-teal'}`}>{vitals.spo2}%</div>
                    <div className="stat-lbl">SpO₂</div>
                    <div className="stat-sub"></div>
                  </div>
                )}
                {!vitals && <div className="empty-state col-full"><div className="icon">📊</div><div className="msg">No vitals data available.</div></div>}
              </div>
            </div>

            {/* TIMELINE */}
            <div className="section-box" id="s-timeline">
              <div className="sec-header">
                <span className="sec-icon">🕐</span>
                <div><div className="sec-title">Visit Timeline</div><div className="sec-subtitle">{timeline.length ? timeline.length + ' events' : 'ED encounter events'}</div></div>
                <button className="btn-ghost ml-auto" style={{ fontSize: '11px' }}>+ Add Event</button>
              </div>
              <div className="timeline">
                {timeline.length === 0 ? (
                  <div className="empty-state"><div className="icon">🕐</div><div className="msg">No events recorded.</div></div>
                ) : (
                  timeline.map((e, i) => {
                    const colors = { arrival: 'var(--txt3)', critical: 'var(--coral)', order: 'var(--blue)', result: 'var(--coral)', consult: 'var(--purple)', med: 'var(--teal)', current: 'var(--teal)' };
                    const color = colors[e.type] || 'var(--txt4)';
                    const glow = e.type === 'critical' ? 'box-shadow:0 0 8px rgba(255,107,107,.6);' : '';
                    return (
                      <div key={i} className="tl-item">
                        <div className="tl-spine">
                          <div className="tl-dot" style={{ background: color, boxShadow: glow }}></div>
                          {i < timeline.length - 1 && <div className="tl-line"></div>}
                        </div>
                        <div className="tl-body">
                          <div className="tl-time">{formatTime(e.occurredAt)}</div>
                          <div className="tl-event">{e.title}</div>
                          {e.detail && <div className="tl-detail">{e.detail}</div>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* PROBLEMS + ALLERGIES */}
            <div className="grid-2" style={{ gap: '16px' }}>
              <div className="section-box" id="s-problems">
                <div className="sec-header">
                  <span className="sec-icon">🏷️</span>
                  <div><div className="sec-title">Problem List</div><div className="sec-subtitle">Active & historical diagnoses</div></div>
                  <button className="btn-ghost ml-auto" style={{ fontSize: '11px' }}>+ Add</button>
                </div>
                <div className="tab-bar">
                  <div className={`tab ${activeTab.problems === 'active' ? 'active' : ''}`} onClick={() => switchTab('problems', 'active')}>Active ({activeProblems.length})</div>
                  <div className={`tab ${activeTab.problems === 'hx' ? 'active' : ''}`} onClick={() => switchTab('problems', 'hx')}>Historical ({historicalProblems.length})</div>
                </div>
                <div style={{ display: activeTab.problems === 'active' ? 'block' : 'none' }}>
                  {activeProblems.length === 0 ? (
                    <div className="empty-state"><div className="icon">🏷️</div><div className="msg">No active problems.</div></div>
                  ) : (
                    activeProblems.map(p => (
                      <div key={p.icdCode} className="problem-row">
                        <span className="problem-icd">{p.icdCode || '—'}</span>
                        <span className="problem-name">{p.name}{isToday(p.onsetDate) && <span className="badge badge-coral" style={{ fontSize: '9px', marginLeft: '4px' }}>TODAY</span>}</span>
                        <span className="problem-onset text-xs">{p.onsetYear || formatDate(p.onsetDate) || '—'}</span>
                      </div>
                    ))
                  )}
                </div>
                <div style={{ display: activeTab.problems === 'hx' ? 'block' : 'none' }}>
                  {historicalProblems.length === 0 ? (
                    <div className="empty-state"><div className="icon">🏷️</div><div className="msg">No historical problems.</div></div>
                  ) : (
                    historicalProblems.map(p => (
                      <div key={p.icdCode} className="problem-row">
                        <span className="problem-icd">{p.icdCode || '—'}</span>
                        <span className="problem-name">{p.name}</span>
                        <span className="problem-onset text-xs">{p.onsetYear || formatDate(p.onsetDate) || '—'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="section-box" id="s-allergies">
                <div className="sec-header">
                  <span className="sec-icon">⚠️</span>
                  <div><div className="sec-title">Allergies</div><div className="sec-subtitle">Documented reactions</div></div>
                  <button className="btn-ghost ml-auto" style={{ fontSize: '11px' }}>+ Add</button>
                </div>
                <div className="flex flex-col gap-8">
                  {allergies.length === 0 ? (
                    <div className="empty-state"><div className="icon">⚠️</div><div className="msg">No allergies documented.</div></div>
                  ) : (
                    allergies.map((a, i) => {
                      const cls = a.severity === 'moderate' ? ' moderate' : a.severity === 'mild' ? ' mild' : '';
                      const src = a.confirmedDate ? 'Confirmed ' + formatDate(a.confirmedDate) : (a.reportedBy || 'Reported by patient');
                      return (
                        <div key={i} className="flex items-center justify-between">
                          <div className={`allergy-tag${cls}`}>⚠ {a.allergen} <span className="sev">· {a.severity} · {a.reaction}</span></div>
                          <span className="text-xs text-muted">{src}</span>
                        </div>
                      );
                    })
                  )}
                </div>
                {allergies.some(a => /contrast/i.test(a.allergen) || /penicillin/i.test(a.allergen)) && (
                  <>
                    <div className="divider"></div>
                    <div className="note-preview" style={{ fontStyle: 'italic' }}>
                      {allergies.some(a => /contrast/i.test(a.allergen)) && '⚠ Contrast allergy — pre-medication protocol required before CT. '}
                      {allergies.some(a => /penicillin/i.test(a.allergen)) && '⚠ Penicillin allergy — verify cross-reactivity before any beta-lactam.'}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* MEDICATIONS */}
            <div className="section-box" id="s-meds">
              <div className="sec-header">
                <span className="sec-icon">💊</span>
                <div><div className="sec-title">Medications</div><div className="sec-subtitle">Home medications + ED administration record</div></div>
                <div className="flex gap-8 ml-auto">
                  <button className="btn-ghost" style={{ fontSize: '11px' }}>📋 Reconcile</button>
                  <button className="btn-ghost" style={{ fontSize: '11px' }}>+ Add</button>
                </div>
              </div>
              <div className="tab-bar">
                <div className={`tab ${activeTab.meds === 'ed' ? 'active' : ''}`} onClick={() => switchTab('meds', 'ed')}>ED Given ({edMeds.length})</div>
                <div className={`tab ${activeTab.meds === 'home' ? 'active' : ''}`} onClick={() => switchTab('meds', 'home')}>Home Meds ({homeMeds.length})</div>
                <div className={`tab ${activeTab.meds === 'held' ? 'active' : ''}`} onClick={() => switchTab('meds', 'held')}>Held ({heldMeds.length})</div>
              </div>
              <div style={{ display: activeTab.meds === 'ed' ? 'block' : 'none' }}>
                {edMeds.length === 0 ? (
                  <div className="empty-state"><div className="icon">💊</div><div className="msg">No ED medications recorded.</div></div>
                ) : (
                  edMeds.map((m, i) => (
                    <div key={i} className="med-row">
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--teal)', flexShrink: 0 }}></div>
                      <span className="med-name">{m.name}</span>
                      <span className="med-dose">{m.dose || '—'}</span>
                      <span className="med-freq">{m.frequency || ''}</span>
                      <span className="med-route">{m.route || '—'}</span>
                      {m.administeredAt && <span className="text-xs text-muted ml-auto">{formatTime(m.administeredAt)}{m.administeredBy ? ' · ' + m.administeredBy : ''}</span>}
                    </div>
                  ))
                )}
              </div>
              <div style={{ display: activeTab.meds === 'home' ? 'block' : 'none' }}>
                {homeMeds.length === 0 ? (
                  <div className="empty-state"><div className="icon">💊</div><div className="msg">No home medications on file.</div></div>
                ) : (
                  homeMeds.map((m, i) => (
                    <div key={i} className="med-row">
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--border)', flexShrink: 0 }}></div>
                      <span className="med-name">{m.name}</span>
                      <span className="med-dose">{m.dose || '—'}</span>
                      <span className="med-freq">{m.frequency || ''}</span>
                      <span className="med-route">{m.route || '—'}</span>
                    </div>
                  ))
                )}
              </div>
              <div style={{ display: activeTab.meds === 'held' ? 'block' : 'none' }}>
                {heldMeds.length === 0 ? (
                  <div className="empty-state"><div className="icon">💊</div><div className="msg">No held medications.</div></div>
                ) : (
                  heldMeds.map((m, i) => (
                    <div key={i} className="med-row">
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--coral)', flexShrink: 0 }}></div>
                      <span className="med-name">{m.name}</span>
                      <span className="med-dose">{m.dose || '—'}</span>
                      <span className="med-freq">{m.frequency || ''}</span>
                      <span className="med-route">{m.route || '—'}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* LABS */}
            <div className="section-box" id="s-labs">
              <div className="sec-header">
                <span className="sec-icon">🧪</span>
                <div><div className="sec-title">Laboratory Results</div><div className="sec-subtitle">{labs.length ? `Most recent panel — collected ${formatTime(labs[0]?.collectedAt)}` : '—'}</div></div>
                <div className="flex items-center gap-8 ml-auto">
                  {critLabs.length > 0 && <span className="badge badge-coral">⚠ {critLabs.length} Critical</span>}
                  <button className="btn-ghost" style={{ fontSize: '11px' }}>+ Order Labs</button>
                </div>
              </div>
              <div className="grid-2" style={{ gap: '16px' }}>
                {labs.length === 0 ? (
                  <div className="empty-state col-full"><div className="icon">🧪</div><div className="msg">No lab results yet.</div></div>
                ) : (
                  Object.entries(labPanels).map(([name, rows]) => (
                    <div key={name}>
                      <div className="text-xs text-muted mb-8" style={{ textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>{name}</div>
                      <table className="lab-table">
                        <thead><tr><th></th><th>Test</th><th>Value</th><th>Reference</th><th>Time</th></tr></thead>
                        <tbody>
                          {rows.map((r, i) => (
                            <tr key={i}>
                              <td><div className={`lab-flag ${r.flag || 'ok'}`}></div></td>
                              <td className="text-muted" style={{ fontSize: '12px' }}>{r.testName}</td>
                              <td><span className={`lab-val ${r.flag || 'ok'}`}>{r.value}</span> <span className="text-xs text-muted">{r.unit || ''}</span></td>
                              <td className="lab-ref">{r.referenceRange || '—'}</td>
                              <td className="text-xs text-muted">{formatTime(r.collectedAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* IMAGING */}
            <div className="section-box" id="s-imaging">
              <div className="sec-header">
                <span className="sec-icon">🩻</span>
                <div><div className="sec-title">Imaging</div><div className="sec-subtitle">Completed and pending studies</div></div>
                <button className="btn-ghost ml-auto" style={{ fontSize: '11px' }}>+ Order Study</button>
              </div>
              <div className="flex flex-col gap-10">
                {imaging.length === 0 ? (
                  <div className="empty-state"><div className="icon">🩻</div><div className="msg">No imaging studies ordered.</div></div>
                ) : (
                  imaging.map((s, i) => {
                    const statusBadge = { resulted: 'badge-teal', pending: 'badge-gold', ordered: 'badge-muted' }[s.status] || 'badge-muted';
                    const statusText = { resulted: 'RESULTED', pending: 'IN PROGRESS', ordered: 'ORDERED' }[s.status] || '';
                    const icon = s.modalityIcon || ({ XR: '🫁', CT: '🧠', MRI: '🧲', ECHO: '❤️', US: '🔊' }[s.modality?.toUpperCase()] || '🩻');
                    return (
                      <div key={i} className="imaging-card">
                        <div className="imaging-icon">{icon}</div>
                        <div className="imaging-body">
                          <div className="flex items-center gap-8">
                            <div className="imaging-title">{s.studyType || s.modality || '—'}</div>
                            <span className={`badge ${statusBadge}`}>{statusText}</span>
                          </div>
                          <div className="imaging-meta">Ordered {formatTime(s.orderedAt)}{s.resultedAt ? ' · Resulted ' + formatTime(s.resultedAt) : ''}{s.radiologist ? ' · Rad: ' + s.radiologist : ''}</div>
                          <div className="imaging-finding" style={{ color: s.finding ? 'var(--txt2)' : 'var(--txt4)', fontStyle: s.finding ? 'normal' : 'italic' }}>{s.finding || 'Results pending.'}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* NOTE */}
            <div className="section-box" id="s-note">
              <div className="sec-header">
                <span className="sec-icon">📝</span>
                <div><div className="sec-title">Current Note Draft</div><div className="sec-subtitle">Auto-assembled — review and sign</div></div>
                <div className="flex gap-8 ml-auto">
                  <button className="btn-ghost">✨ Regenerate</button>
                  <button className="btn-blue">✍ Sign Note</button>
                </div>
              </div>
              <div className="note-preview" dangerouslySetInnerHTML={{ __html: note?.content?.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') || `No note draft found for ${patient ? patient.firstName + ' ' + patient.lastName : 'this patient'}. Click "✨ Regenerate" to generate one from chart data.` }}></div>
            </div>
          </main>

          {/* AI PANEL */}
          <aside className="ai-panel">
            <div className="ai-header">
              <div className="ai-header-top">
                <div className="ai-dot"></div>
                <span className="ai-label">Notrya AI</span>
                <span className="ai-model">claude-sonnet-4</span>
              </div>
              <div className="ai-quick-btns">
                <button className="ai-qbtn">📋 Summarize</button>
                <button className="ai-qbtn">💊 Drug Check</button>
                <button className="ai-qbtn">🔍 Workup</button>
                <button className="ai-qbtn">🚪 Disposition</button>
                <button className="ai-qbtn">📚 Guidelines</button>
              </div>
            </div>
            <div className="ai-msgs" ref={aiMsgsRef}>
              {aiMessages.map((msg, i) => (
                <div key={i} className={`ai-msg ${msg.role}`} dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></div>
              ))}
            </div>
            <div className="ai-input-wrap">
              <textarea
                className="ai-input"
                rows="2"
                placeholder="Ask anything about this patient…"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                  }
                }}
              ></textarea>
              <button className="ai-send">↑</button>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}