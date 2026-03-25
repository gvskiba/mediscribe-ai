import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import MedicalChatbot from "./components/ai/MedicalChatbot";
import OfflineSync from "./components/offline/OfflineSync";

/* ─────────────────────────────────────────────
   DESIGN TOKENS (inlined so layout is self-contained)
───────────────────────────────────────────── */
const T = {
  bg:        '#050f1e',
  panel:     '#081628',
  card:      '#0b1e36',
  up:        '#0e2544',
  border:    '#1a3555',
  borderHi:  '#2a4f7a',
  blue:      '#3b9eff',
  teal:      '#00e5c0',
  gold:      '#f5c842',
  coral:     '#ff6b6b',
  orange:    '#ff9f43',
  txt:       '#e8f0fe',
  txt2:      '#8aaccc',
  txt3:      '#4a6a8a',
  txt4:      '#2e4a6a',
};

/* ─────────────────────────────────────────────
   APP-LEVEL ICON SIDEBAR NAVIGATION
───────────────────────────────────────────── */
const APP_ICONS = [
  { icon: '🏠', label: 'Home',      page: '/' },
  { icon: '📊', label: 'Dashboard', page: '/Dashboard' },
  { icon: '🆕', label: 'New PT',    page: '/NewPatientInput' },
  { icon: '📝', label: 'New Note',  page: '/NewNote' },
  { icon: '👥', label: 'Patients',  page: '/PatientDashboard' },
  { icon: '🔄', label: 'Shift',     page: '/Shift' },
  { icon: '💊', label: 'Drugs',     page: '/DrugsBugs' },
  { icon: '🧮', label: 'Calc',      page: '/Calculators' },
];

/* ─────────────────────────────────────────────
   CHART SECTION SIDEBAR GROUPS
───────────────────────────────────────────── */
const CHART_GROUPS = [
  {
    label: 'Intake',
    items: [
      { icon: '📊', label: 'Patient Chart',      page: '/PatientChart' },
      { icon: '👤', label: 'Demographics',       page: '/NewPatientInput?tab=demo' },
      { icon: '💬', label: 'Chief Complaint',    page: '/NewPatientInput?tab=cc' },
      { icon: '📈', label: 'Vitals',             page: '/NewPatientInput?tab=vit' },
    ]
  },
  {
    label: 'Documentation',
    items: [
      { icon: '💊', label: 'Meds & PMH',         page: '/NewPatientInput?tab=meds' },
      { icon: '🔍', label: 'Review of Systems',  page: '/NewPatientInput?tab=ros' },
      { icon: '🩺', label: 'Physical Exam',      page: '/NewPatientInput?tab=pe' },
      { icon: '⚖️', label: 'MDM',               page: '/MedicalDecisionMaking' },
    ]
  },
  {
    label: 'Disposition',
    items: [
      { icon: '📋', label: 'Orders',            page: '/OrderSetBuilder' },
      { icon: '🚪', label: 'Discharge',         page: '/DischargePlanning' },
      { icon: '🗺️', label: 'ER Plan Builder',   page: '/ERPlanBuilder' },
    ]
  },
  {
    label: 'Tools',
    items: [
      { icon: '🤖', label: 'AutoCoder',         page: '/AutoCoder' },
      { icon: '💉', label: 'eRx',               page: '/ERx' },
      { icon: '✂️', label: 'Procedures',        page: '/EDProcedureNotes' },
    ]
  },
];

const ALL_CHART_ITEMS = CHART_GROUPS.flatMap(g => g.items);

/* ─────────────────────────────────────────────
   PAGE ABBREVIATIONS for logo box
───────────────────────────────────────────── */
const PAGE_ABBR = {
  Dashboard: 'Db', PatientDashboard: 'Pt', NewPatientInput: 'NP',
  PatientChart: 'Pc', ClinicalNoteStudio: 'Cs', NoteCreationHub: 'Nh',
  NoteEditorTabs: 'Ne', NotesLibrary: 'Nl', Results: 'Re',
  DischargePlanning: 'Dc', OrderSetBuilder: 'Os', BillingDashboard: 'Bi',
  AutoCoder: 'Ac', NursingFlowsheet: 'Nf', ClinicalDecisionSupport: 'Cd',
  DiagnosticStewardship: 'Ds', DrugsBugs: 'Db', AntibioticStewardship: 'Ab',
  MedicationReference: 'Mr', CMELearningCenter: 'Ce', PediatricDosing: 'Pd',
  MedicalKnowledgeBase: 'Kb', KnowledgeBaseV2: 'K2', PatientEducationGenerator: 'Pe',
  EDProcedureNotes: 'Ed', Calculators: 'Ca', NoteTemplates: 'Nt',
  CustomTemplates: 'Ct', SmartTemplates: 'St', Snippets: 'Sn',
  AddendumManager: 'Am', AppSettings: 'As', UserSettings: 'Us', UserPreferences: 'Up',
  Shift: 'Sh', CommandCenter: 'Cc', ERPlanBuilder: 'Ep', ERx: 'Rx',
  MedicalDecisionMaking: 'Md', Home: 'Hm',
};

/* ─────────────────────────────────────────────
   PAGES WHERE CHART SIDEBAR IS HIDDEN
   (landing/utility pages — no patient context)
───────────────────────────────────────────── */
const NO_CHART_SIDEBAR = new Set([
  'Home', 'Dashboard', 'AppSettings', 'UserSettings', 'UserPreferences',
  'CMELearningCenter', 'MedicalKnowledgeBase', 'KnowledgeBaseV2',
  'MedicalNews', 'Calendar', 'Calculators', 'DrugsBugs', 'AntibioticStewardship',
  'MedicationReference', 'DrugReference', 'PediatricDosing', 'Snippets',
  'NoteTemplates', 'CustomTemplates', 'SmartTemplates', 'AddendumManager',
  'CantMissDiagnoses', 'CommandCenter', 'Shift', 'NursingFlowsheet',
]);

/* ─────────────────────────────────────────────
   PAGES THAT RENDER FULL-SCREEN (no shell)
───────────────────────────────────────────── */
const FULLSCREEN_PAGES = new Set([
  'ClinicalNoteStudio', 'NoteDetail', 'PatientDashboard',
  'ERPlanBuilder', 'ERx',
  'MedicationReference', 'KnowledgeBaseV2', 'PatientEducationGenerator',
  'DiagnosticStewardship', 'NoteCreationHub',
  'EDProcedureNotesNew',
  'AutoCoder', 'NursingFlowsheet', 'ClinicalDecisionSupport',
  'DischargePlanning', 'UserPreferences', 'NoteTemplates', 'CustomTemplates',
]);

/* ═══════════════════════════════════════════════════
   GLOBAL CSS
═══════════════════════════════════════════════════ */
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');

.v2-shell *, .v2-shell *::before, .v2-shell *::after { box-sizing: border-box; }
.v2-shell { font-family: 'DM Sans', sans-serif; }

/* ICON SIDEBAR */
.v2-isb {
  position: fixed; top: 0; left: 0; bottom: 0; width: 56px;
  background: #040d19; border-right: 1px solid #1a3555;
  display: flex; flex-direction: column; align-items: center; z-index: 300;
}
.v2-isb-logo {
  width: 100%; height: 48px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border-bottom: 1px solid #1a3555;
}
.v2-isb-logo-box {
  width: 30px; height: 30px; background: #3b9eff; border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Playfair Display', serif; font-size: 12px; font-weight: 700;
  color: white; cursor: pointer; transition: transform 0.2s;
  user-select: none;
}
.v2-isb-logo-box:hover { filter: brightness(1.2); }
.v2-isb-scroll {
  flex: 1; width: 100%; display: flex; flex-direction: column; align-items: center;
  padding: 8px 0; gap: 2px; overflow-y: auto;
}
.v2-isb-btn {
  width: 42px; height: 42px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 2px; border-radius: 6px; cursor: pointer; transition: all 0.15s;
  color: #4a6a8a; border: 1px solid transparent; font-size: 16px;
  text-decoration: none;
}
.v2-isb-btn:hover { background: #0e2544; border-color: #1a3555; color: #8aaccc; }
.v2-isb-btn.active { background: rgba(59,158,255,0.1); border-color: rgba(59,158,255,0.3); color: #3b9eff; }
.v2-isb-lbl { font-size: 8px; line-height: 1; white-space: nowrap; color: inherit; }
.v2-isb-sep { width: 30px; height: 1px; background: #1a3555; margin: 4px 0; flex-shrink: 0; }
.v2-isb-bottom {
  padding: 8px 0; border-top: 1px solid #1a3555;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
}

/* TOP BAR */
.v2-top {
  position: fixed; top: 0; left: 56px; right: 0; height: 88px;
  background: #081628; border-bottom: 1px solid #1a3555;
  z-index: 200; display: flex; flex-direction: column;
}
.v2-top-r1 {
  height: 44px; flex-shrink: 0;
  display: flex; align-items: center; padding: 0 14px; gap: 8px;
  border-bottom: 1px solid rgba(26,53,85,0.5);
}
.v2-top-r2 {
  height: 44px; flex-shrink: 0;
  display: flex; align-items: center; padding: 0 14px; gap: 7px; overflow: hidden;
}
.v2-welcome { font-size: 12px; color: #8aaccc; font-weight: 500; white-space: nowrap; }
.v2-welcome strong { color: #e8f0fe; }
.v2-vsep { width: 1px; height: 20px; background: #1a3555; flex-shrink: 0; }
.v2-stat {
  display: flex; align-items: center; gap: 5px;
  background: #0e2544; border: 1px solid #1a3555; border-radius: 6px; padding: 3px 10px;
  cursor: pointer; transition: border-color 0.15s;
}
.v2-stat:hover { border-color: #2a4f7a; }
.v2-stat-v { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600; color: #e8f0fe; }
.v2-stat-v.alert { color: #f5c842; }
.v2-stat-l { font-size: 9px; color: #4a6a8a; text-transform: uppercase; letter-spacing: 0.04em; }
.v2-r1-right { margin-left: auto; display: flex; align-items: center; gap: 6px; }
.v2-clock {
  background: #0e2544; border: 1px solid #1a3555; border-radius: 6px;
  padding: 3px 10px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #8aaccc;
}
.v2-aion {
  display: flex; align-items: center; gap: 4px;
  background: rgba(0,229,192,0.08); border: 1px solid rgba(0,229,192,0.3);
  border-radius: 6px; padding: 3px 10px; font-size: 11px; font-weight: 600; color: #00e5c0;
}
.v2-aion-dot { width: 6px; height: 6px; border-radius: 50%; background: #00e5c0; animation: v2aipulse 2s ease-in-out infinite; }
@keyframes v2aipulse { 0%,100%{box-shadow:0 0 0 0 rgba(0,229,192,0.4)} 50%{box-shadow:0 0 0 5px rgba(0,229,192,0)} }
.v2-newpt {
  background: #00e5c0; color: #050f1e; border: none; border-radius: 6px;
  padding: 4px 12px; font-size: 11px; font-weight: 700; cursor: pointer; white-space: nowrap;
  font-family: 'DM Sans', sans-serif;
}
.v2-newpt:hover { filter: brightness(1.15); }
/* Row 2 items */
.v2-chart-badge {
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  background: #0e2544; border: 1px solid #1a3555; border-radius: 20px;
  padding: 1px 8px; color: #00e5c0; white-space: nowrap; flex-shrink: 0;
}
.v2-pt-name {
  font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 600;
  color: #e8f0fe; white-space: nowrap; flex-shrink: 0;
}
.v2-pt-meta { font-size: 11px; color: #4a6a8a; white-space: nowrap; flex-shrink: 0; }
.v2-pt-cc {
  font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600;
  color: #ff9f43; white-space: nowrap; flex-shrink: 0;
}
.v2-vital { display: flex; align-items: center; gap: 3px; font-family: 'JetBrains Mono', monospace; font-size: 10.5px; white-space: nowrap; flex-shrink: 0; }
.v2-vital .vl { color: #2e4a6a; font-size: 9px; }
.v2-vital .vv { color: #8aaccc; }
.v2-vital .vv.abn { color: #ff6b6b; animation: v2glowred 2s ease-in-out infinite; }
@keyframes v2glowred { 0%,100%{text-shadow:0 0 4px rgba(255,107,107,0.4)} 50%{text-shadow:0 0 10px rgba(255,107,107,0.9)} }
.v2-badge-monitor { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 4px; background: rgba(255,107,107,0.15); color: #ff6b6b; border: 1px solid rgba(255,107,107,0.3); white-space: nowrap; flex-shrink: 0; }
.v2-badge-room { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 4px; background: rgba(0,229,192,0.1); color: #00e5c0; border: 1px solid rgba(0,229,192,0.3); white-space: nowrap; flex-shrink: 0; }
.v2-chart-acts { margin-left: auto; display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
.v2-btn-ghost {
  background: #0e2544; border: 1px solid #1a3555; border-radius: 6px;
  padding: 4px 10px; font-size: 11px; color: #8aaccc; cursor: pointer;
  display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; transition: all 0.15s;
  font-family: 'DM Sans', sans-serif;
}
.v2-btn-ghost:hover { border-color: #2a4f7a; color: #e8f0fe; }
.v2-btn-teal {
  background: #00e5c0; color: #050f1e; border: none; border-radius: 6px;
  padding: 4px 12px; font-size: 11px; font-weight: 600; cursor: pointer;
  display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;
  font-family: 'DM Sans', sans-serif;
}
.v2-btn-teal:hover { filter: brightness(1.15); }
.v2-btn-coral {
  background: rgba(255,107,107,0.15); color: #ff6b6b; border: 1px solid rgba(255,107,107,0.3);
  border-radius: 6px; padding: 4px 12px; font-size: 11px; font-weight: 600; cursor: pointer;
  display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;
  font-family: 'DM Sans', sans-serif;
}
.v2-btn-coral:hover { background: rgba(255,107,107,0.25); }

/* CHART SECTION SIDEBAR */
.v2-csb {
  position: fixed; top: 88px; left: 56px; bottom: 50px; width: 170px;
  background: #081628; border-right: 1px solid #1a3555;
  overflow-y: auto; padding: 10px 8px;
  display: flex; flex-direction: column; gap: 1px; z-index: 100;
}
.v2-csb-group {
  font-size: 9px; color: #2e4a6a; text-transform: uppercase;
  letter-spacing: 0.08em; padding: 10px 8px 4px; font-weight: 600;
}
.v2-csb-group:first-child { padding-top: 4px; }
.v2-csb-item {
  display: flex; align-items: center; gap: 7px; padding: 6px 8px; border-radius: 6px;
  cursor: pointer; transition: all 0.15s; border: 1px solid transparent;
  font-size: 12px; color: #8aaccc; user-select: none; text-decoration: none;
}
.v2-csb-item:hover { background: #0e2544; border-color: #1a3555; color: #e8f0fe; }
.v2-csb-item.active { background: rgba(59,158,255,0.1); border-color: rgba(59,158,255,0.3); color: #3b9eff; }
.v2-csb-icon { font-size: 13px; width: 18px; text-align: center; flex-shrink: 0; }
.v2-csb-dot { width: 6px; height: 6px; border-radius: 50%; background: #1a3555; margin-left: auto; flex-shrink: 0; }
.v2-csb-dot.done    { background: #00e5c0; box-shadow: 0 0 5px rgba(0,229,192,0.5); }
.v2-csb-dot.partial { background: #ff9f43; box-shadow: 0 0 5px rgba(255,159,67,0.5); }
.v2-csb-div { height: 1px; background: #1a3555; margin: 6px 4px; }
.v2-csb::-webkit-scrollbar { width: 4px; }
.v2-csb::-webkit-scrollbar-thumb { background: #1a3555; border-radius: 2px; }

/* CONTENT AREA */
.v2-content-with-sb { margin-left: 226px; } /* 56 icon + 170 chart sb */
.v2-content-no-sb   { margin-left: 56px; }
.v2-content-wrap {
  margin-top: 88px; margin-bottom: 50px;
  min-height: calc(100vh - 138px); overflow-y: auto;
}
.v2-content-inner { padding: 20px 24px; max-width: 1200px; }
.v2-content-full { padding: 0; max-width: none; width: 100%; height: 100%; }

/* BOTTOM BAR */
.v2-bot {
  position: fixed; bottom: 0; left: 56px; right: 0; height: 50px;
  background: #081628; border-top: 1px solid #1a3555;
  display: flex; align-items: center; padding: 0 16px; gap: 8px; z-index: 200;
}
.v2-bot-dots { display: flex; align-items: center; gap: 5px; margin: 0 auto; }
.v2-bot-dot {
  width: 8px; height: 8px; border-radius: 50%; cursor: pointer;
  transition: all 0.2s; flex-shrink: 0; position: relative;
}
.v2-bot-dot.done    { background: #00e5c0; box-shadow: 0 0 4px rgba(0,229,192,0.4); }
.v2-bot-dot.current { background: #3b9eff; box-shadow: 0 0 6px rgba(59,158,255,0.5); width: 10px; height: 10px; }
.v2-bot-dot.partial { background: #ff9f43; }
.v2-bot-dot.empty   { background: #2e4a6a; }
.v2-bot-dot:hover::after {
  content: attr(data-tip); position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
  background: #0b1e36; border: 1px solid #1a3555; border-radius: 4px;
  padding: 2px 8px; font-size: 10px; color: #8aaccc; white-space: nowrap; pointer-events: none; z-index: 10;
}
.v2-bot-lbl  { font-size: 11px; color: #4a6a8a; white-space: nowrap; }
.v2-bot-clbl { font-size: 12px; color: #e8f0fe; font-weight: 500; white-space: nowrap; }
`;

/* ═══════════════════════════════════════════════════
   DOT STATE HELPERS
═══════════════════════════════════════════════════ */
const STEP_STATES = [
  'done', 'partial', 'done', 'empty',
  'partial', 'empty', 'empty', 'empty',
  'empty', 'empty', 'empty',
  'empty', 'empty', 'empty',
];

/* ═══════════════════════════════════════════════════
   LAYOUT COMPONENT
═══════════════════════════════════════════════════ */
export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [clock, setClock] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`);
    };
    tick();
    const t = setInterval(tick, 10000);
    return () => clearInterval(t);
  }, []);

  const isFullscreen = FULLSCREEN_PAGES.has(currentPageName);
  const showChartSidebar = !NO_CHART_SIDEBAR.has(currentPageName) && !isFullscreen;
  const pageAbbr = PAGE_ABBR[currentPageName] || currentPageName?.slice(0, 2) || 'Nx';

  // Find active chart item
  const activePath = location.pathname + location.search;
  const activeChartIdx = ALL_CHART_ITEMS.findIndex(i => i.page === activePath || i.page.split('?')[0] === location.pathname);
  const activeChartItem = ALL_CHART_ITEMS[activeChartIdx];

  // Stepper nav
  const navPrev = () => { if (activeChartIdx > 0) navigate(ALL_CHART_ITEMS[activeChartIdx - 1].page); };
  const navNext = () => { if (activeChartIdx < ALL_CHART_ITEMS.length - 1) navigate(ALL_CHART_ITEMS[activeChartIdx + 1].page); };
  const prevLabel = activeChartIdx > 0 ? ALL_CHART_ITEMS[activeChartIdx - 1].label : '';
  const curLabel  = activeChartItem?.label || currentPageName || '';

  if (isFullscreen) {
    return (
      <div className="v2-shell">
        <style>{GLOBAL_CSS}</style>
        <OfflineSync />
        {children}
        <MedicalChatbot />
      </div>
    );
  }

  return (
    <div className="v2-shell" style={{ background: T.bg, minHeight: '100vh', color: T.txt }}>
      <style>{GLOBAL_CSS}</style>
      <OfflineSync />

      {/* ── ICON SIDEBAR ── */}
      <aside className="v2-isb">
        <div className="v2-isb-logo">
          <div className="v2-isb-logo-box">{pageAbbr}</div>
        </div>
        <div className="v2-isb-scroll">
          {APP_ICONS.map(item => (
            <Link
              key={item.page}
              to={item.page}
              className={`v2-isb-btn${location.pathname === item.page ? ' active' : ''}`}
              title={item.label}
            >
              <span>{item.icon}</span>
              <span className="v2-isb-lbl">{item.label}</span>
            </Link>
          ))}
        </div>
        <div className="v2-isb-bottom">
          <Link to="/AppSettings" className={`v2-isb-btn${currentPageName === 'AppSettings' ? ' active' : ''}`} title="Settings">
            <span>⚙️</span>
            <span className="v2-isb-lbl">Settings</span>
          </Link>
        </div>
      </aside>

      {/* ── MERGED TOP BAR ── */}
      <header className="v2-top">
        {/* Row 1 */}
        <div className="v2-top-r1">
          <span className="v2-welcome">
            Welcome, <strong>{user?.full_name ? `Dr. ${user.full_name}` : 'Dr. Skiba'}</strong>
          </span>
          <div className="v2-vsep" />
          {[['8','Active',false],['14','Pending',true],['3','Orders',false],['11.6','Hours',false]].map(([v,l,a]) => (
            <div key={l} className="v2-stat">
              <span className={`v2-stat-v${a ? ' alert' : ''}`}>{v}</span>
              <span className="v2-stat-l">{l}</span>
            </div>
          ))}
          <div className="v2-r1-right">
            <div className="v2-clock">{clock}</div>
            <div className="v2-aion"><div className="v2-aion-dot" /> AI ON</div>
            <button className="v2-newpt" onClick={() => navigate('/NewPatientInput')}>+ New Patient</button>
          </div>
        </div>

        {/* Row 2 */}
        <div className="v2-top-r2">
          <span className="v2-chart-badge">PT-4-471-8820</span>
          <span className="v2-pt-name">New Patient</span>
          <span className="v2-pt-meta">67 y/o · Male · 03/14/1957</span>
          <span className="v2-pt-cc">CC: Chest Pain</span>
          <div className="v2-vsep" />
          {[['BP','158/94',true],['HR','108',true],['RR','18',false],['SpO₂','93%',false],['T','37.1°C',false],['GCS','15',false]].map(([l,v,abn]) => (
            <div key={l} className="v2-vital">
              <span className="vl">{l}</span>
              <span className={`vv${abn ? ' abn' : ''}`}>{v}</span>
            </div>
          ))}
          <div className="v2-vsep" />
          <span className="v2-badge-monitor">MONITORING</span>
          <span className="v2-badge-room">Room 4B</span>
          <div className="v2-chart-acts">
            <button className="v2-btn-ghost">📋 Orders</button>

            <button className="v2-btn-teal">💾 Save Chart</button>
          </div>
        </div>
      </header>

      {/* ── CHART SECTION SIDEBAR ── */}
      {showChartSidebar && (
        <aside className="v2-csb">
          {CHART_GROUPS.map((group, gi) => (
            <div key={gi}>
              {gi > 0 && <div className="v2-csb-div" />}
              <div className="v2-csb-group">{group.label}</div>
              {group.items.map((item, ii) => {
                const globalIdx = CHART_GROUPS.slice(0, gi).reduce((a, g) => a + g.items.length, 0) + ii;
                const isActive = location.pathname === item.page.split('?')[0];
                const dotState = STEP_STATES[globalIdx] || 'empty';
                return (
                  <Link
                    key={item.page}
                    to={item.page}
                    className={`v2-csb-item${isActive ? ' active' : ''}`}
                  >
                    <span className="v2-csb-icon">{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    <span className={`v2-csb-dot ${dotState}`} />
                  </Link>
                );
              })}
            </div>
          ))}
        </aside>
      )}

      {/* ── MAIN CONTENT ── */}
      <div
        className={`v2-content-wrap ${showChartSidebar ? 'v2-content-with-sb' : 'v2-content-no-sb'}`}
        style={{ minHeight: 'calc(100vh - 138px)' }}
      >
        <div className="v2-content-inner">
          {children}
        </div>
      </div>

      {/* ── BOTTOM BAR ── */}
      <footer className="v2-bot">
        <button className="v2-btn-ghost" onClick={navPrev}>← Back</button>
        {prevLabel && <span className="v2-bot-lbl">{prevLabel}</span>}

        <div className="v2-bot-dots">
          {ALL_CHART_ITEMS.map((item, i) => {
            const isCurrent = i === activeChartIdx;
            const state = isCurrent ? 'current' : STEP_STATES[i] || 'empty';
            return (
              <div
                key={i}
                className={`v2-bot-dot ${state}`}
                data-tip={item.label}
                onClick={() => navigate(item.page)}
                title={item.label}
              />
            );
          })}
        </div>

        <span className="v2-bot-clbl">{curLabel}</span>
        <button className="v2-btn-teal" onClick={navNext} style={{ padding: '6px 16px', fontSize: 12, fontWeight: 700 }}>Next →</button>
      </footer>

      <MedicalChatbot />
    </div>
  );
}