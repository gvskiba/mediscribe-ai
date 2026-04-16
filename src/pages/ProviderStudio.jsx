import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

import DemoTab from "@/components/npi/DemoTab";
import CCTab from "@/components/npi/CCTab";
import VitalsTab from "@/components/npi/VitalsTab";
import MedsTab from "@/components/npi/MedsTab";
import ROSTab from "@/components/npi/ROSTab";
import PETab from "@/components/npi/PETab";
import AutoCoderTab from "@/components/npi/AutoCoderTab";

import NotryaApp from "@/pages/NotryaApp";
import EDProcedureNotes from "@/pages/EDProcedureNotes";
import EDOrders from "@/pages/EDOrders";
import MedicationReferencePage from "@/pages/MedicationReference";
import ACSPage from "@/components/acs/ACSPage";
import ERPlanBuilder from "@/pages/ERPlanBuilder";

// ─── NAV DATA ────────────────────────────────────────
const NAV_DATA = {
  intake: [
    { section: "chart",      icon: "📊", label: "Patient Chart",      abbr: "Pc", dot: "done" },
    { section: "demo",       icon: "👤", label: "Demographics",        abbr: "Dm", dot: "partial" },
    { section: "cc",         icon: "💬", label: "Chief Complaint",     abbr: "Cc", dot: "empty" },
    { section: "vit",        icon: "📈", label: "Vitals",              abbr: "Vt", dot: "empty" },
  ],
  documentation: [
    { section: "meds",       icon: "💊", label: "Meds & PMH",          abbr: "Rx", dot: "empty" },
    { section: "ros",        icon: "🔍", label: "Review of Systems",   abbr: "Rs", dot: "empty" },
    { section: "pe",         icon: "🩺", label: "Physical Exam",       abbr: "Pe", dot: "empty" },
    { section: "mdm",        icon: "⚖️", label: "MDM",                abbr: "Md", dot: "empty" },
  ],
  disposition: [
    { section: "orders",     icon: "📋", label: "Orders",              abbr: "Or", dot: "empty" },
    { section: "discharge",  icon: "🚪", label: "Discharge",           abbr: "Dc", dot: "empty" },
    { section: "erplan",     icon: "🗺️", label: "ER Plan Builder",     abbr: "Ep", dot: "empty" },
  ],
  tools: [
    { section: "autocoder",  icon: "🤖", label: "AutoCoder",           abbr: "Ac", dot: "empty" },
    { section: "erx",        icon: "💉", label: "eRx",                 abbr: "Ex", dot: "empty" },
    { section: "procedures", icon: "✂️", label: "Procedures",          abbr: "Pr", dot: "empty" },
    { section: "medref",     icon: "🧬", label: "ED Med Ref",          abbr: "Mr", dot: "empty" },
    { section: "acs",        icon: "🫀", label: "ACS Protocol",        abbr: "CS", dot: "empty" },
    { section: "tachy",      icon: "⚡", label: "Adult Tachycardia",    abbr: "Tc", dot: "empty" },
    { section: "brady",      icon: "🔻", label: "Adult Bradycardia",   abbr: "Br", dot: "empty" },
    { section: "peds",       icon: "👶", label: "Pediatric ACLS",      abbr: "Pd", dot: "empty" },
    { section: "pregnancy",  icon: "🤰", label: "Arrest in Pregnancy", abbr: "Pg", dot: "empty" },
  ],
};

const GROUP_META = [
  { key: "intake",        icon: "📋", label: "Intake" },
  { key: "documentation", icon: "🩺", label: "Documentation" },
  { key: "disposition",   icon: "🚪", label: "Disposition" },
  { key: "tools",         icon: "🔧", label: "Tools" },
];

const APP_ICONS = [
  { icon: "🏠", label: "Home",     to: "/" },
  { icon: "📊", label: "Dash",     to: "/Dashboard" },
  { icon: "👥", label: "Patients", to: "/PatientDashboard", active: true },
  { icon: "🔄", label: "Shift",    to: "/Shift" },
  "sep",
  { icon: "💊", label: "Drugs",    to: "/DrugsBugs" },
  { icon: "🧮", label: "Calc",     to: "/Calculators" },
];

const ALL_SECTIONS = Object.values(NAV_DATA).flat();

const QUICK_ACTIONS = [
  { icon: "📋", label: "Summarise", prompt: "Summarise what I have entered so far." },
  { icon: "🔍", label: "Check",     prompt: "What am I missing? Check my entries for completeness." },
  { icon: "📝", label: "Draft Note",prompt: "Generate a draft note from the data entered." },
  { icon: "🧠", label: "DDx",       prompt: "Suggest differential diagnoses based on current data." },
];

const SYSTEM_PROMPT =
  "You are Notrya AI — a helpful AI assistant embedded in an emergency medicine documentation platform. Respond in 2–4 concise, actionable sentences. Be direct. Never fabricate data.";

export default function ProviderStudio() {
  const navigate = useNavigate();
  const location = useLocation();

  // ─── Tab from URL ───
  const [currentTab, setCurrentTab] = useState(
    () => new URLSearchParams(window.location.search).get("tab") || "demo"
  );
  useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    if (tab) setCurrentTab(tab);
  }, [location.search]);

  // ─── Active group derived from tab ───
  const [activeGroup, setActiveGroup] = useState(() => {
    const tab = new URLSearchParams(window.location.search).get("tab") || "demo";
    for (const [group, items] of Object.entries(NAV_DATA)) {
      if (items.find((i) => i.section === tab)) return group;
    }
    return "intake";
  });

  // ─── Nav dots ───
  const [navDots, setNavDots] = useState(() => {
    const m = {};
    ALL_SECTIONS.forEach((s) => (m[s.section] = s.dot));
    return m;
  });

  // ─── Clock ───
  const [clock, setClock] = useState("");
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"));
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);

  // ─── Patient form state ───
  const [demo, setDemo] = useState({ firstName: "", lastName: "", age: "", dob: "", sex: "", mrn: "", insurance: "", insuranceId: "", address: "", city: "", phone: "", email: "", emerg: "", height: "", weight: "", lang: "", notes: "", pronouns: "" });
  const [cc, setCC] = useState({ text: "", onset: "", duration: "", severity: "", quality: "", radiation: "", aggravate: "", relieve: "", assoc: "", hpi: "" });
  const [vitals, setVitals] = useState({});
  const [medications, setMedications] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [pmhSelected, setPmhSelected] = useState({});
  const [pmhExtra, setPmhExtra] = useState("");
  const [surgHx, setSurgHx] = useState("");
  const [famHx, setFamHx] = useState("");
  const [socHx, setSocHx] = useState("");
  const [rosState, setRosState] = useState({});
  const [rosSymptoms, setRosSymptoms] = useState({});
  const [rosNotes, setRosNotes] = useState({});
  const [peState, setPeState] = useState({});
  const [peFindings, setPeFindings] = useState({});
  const [selectedCC, setSelectedCC] = useState(-1);
  const [parseText, setParseText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [pmhExpanded, setPmhExpanded] = useState({ cardio: true, endo: true });
  const [avpu, setAvpu] = useState("");
  const [o2del, setO2del] = useState("");
  const [pain, setPain] = useState("");
  const [triage, setTriage] = useState("");
  const [esiLevel, setEsiLevel] = useState("");
  const [registration, setRegistration] = useState({ mrn: "", room: "" });

  // ─── AI state ───
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMsgs, setAiMsgs] = useState([{ role: "sys", text: "Notrya AI ready — select a quick action or ask a clinical question." }]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [history, setHistory] = useState([]);
  const msgsRef = useRef(null);
  const inputRef = useRef(null);
  const pillsRef = useRef(null);

  useEffect(() => {
    msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight, behavior: "smooth" });
  }, [aiMsgs, aiLoading]);

  useEffect(() => {
    if (aiOpen) setTimeout(() => inputRef.current?.focus(), 280);
  }, [aiOpen]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape" && aiOpen) setAiOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [aiOpen]);

  useEffect(() => {
    const row = pillsRef.current;
    if (!row) return;
    const active = row.querySelector(".bn-sub-pill.active");
    active?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [currentTab, activeGroup]);

  // ─── Navigation helpers ───
  const selectGroup = useCallback((group) => {
    setActiveGroup(group);
    const items = NAV_DATA[group];
    const currentInGroup = items.find((i) => i.section === currentTab);
    const target = currentInGroup ? currentTab : items[0].section;
    navigate(`/ProviderStudio?tab=${target}`);
  }, [currentTab, navigate]);

  const selectSection = useCallback((sectionId) => {
    navigate(`/ProviderStudio?tab=${sectionId}`);
    for (const [group, items] of Object.entries(NAV_DATA)) {
      if (items.find((i) => i.section === sectionId)) {
        setActiveGroup(group);
        break;
      }
    }
  }, [navigate]);

  const getGroupBadge = useCallback((groupKey) => {
    const items = NAV_DATA[groupKey];
    const allDone = items.every((i) => navDots[i.section] === "done");
    const anyStarted = items.some((i) => navDots[i.section] === "done" || navDots[i.section] === "partial");
    if (allDone) return "done";
    if (anyStarted) return "partial";
    return "empty";
  }, [navDots]);

  const toggleAI = useCallback(() => {
    setAiOpen((o) => { if (!o) setUnread(0); return !o; });
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || aiLoading) return;
    setAiMsgs((m) => [...m, { role: "user", text: text.trim() }]);
    setAiInput("");
    setAiLoading(true);
    const ctx = `Active section: ${currentTab}`;
    const newHistory = [...history, { role: "user", content: ctx + "\n\n" + text.trim() }];
    setHistory(newHistory);
    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt: SYSTEM_PROMPT + "\n\n" + ctx + "\n\n" + text.trim() });
      const reply = typeof res === "string" ? res : JSON.stringify(res);
      setHistory((h) => [...h, { role: "assistant", content: reply }]);
      setAiMsgs((m) => [...m, { role: "bot", text: reply }]);
      setAiOpen((open) => { if (!open) setUnread((u) => u + 1); return open; });
    } catch {
      setAiMsgs((m) => [...m, { role: "sys", text: "⚠ Connection error — please try again." }]);
    } finally {
      setAiLoading(false);
    }
  }, [aiLoading, history, currentTab]);

  const handleAIKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(aiInput); }
  };

  const renderMsg = (text) =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>").replace(/\*\*(.*?)\*\*/g, '<strong style="color:#00e5c0">$1</strong>');

  // ─── Smart parse ───
  const smartParse = async () => {
    if (!parseText.trim()) { toast.error("Please enter some text to parse."); return; }
    setParsing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract structured patient data from the following text. Return ONLY valid JSON.\nText: ${parseText}`,
        response_json_schema: { type: "object", properties: { firstName: { type: "string" }, lastName: { type: "string" }, age: { type: "string" }, sex: { type: "string" }, dob: { type: "string" }, cc: { type: "string" }, onset: { type: "string" }, duration: { type: "string" }, severity: { type: "string" }, quality: { type: "string" }, bp: { type: "string" }, hr: { type: "string" }, rr: { type: "string" }, spo2: { type: "string" }, temp: { type: "string" }, gcs: { type: "string" }, medications: { type: "array", items: { type: "string" } }, allergies: { type: "array", items: { type: "string" } }, pmh: { type: "array", items: { type: "string" } } } }
      });
      setDemo((prev) => ({ ...prev, firstName: result.firstName || prev.firstName, lastName: result.lastName || prev.lastName, age: result.age || prev.age, sex: result.sex || prev.sex, dob: result.dob || prev.dob }));
      setCC((prev) => ({ ...prev, text: result.cc || prev.text, onset: result.onset || prev.onset, duration: result.duration || prev.duration, severity: result.severity || prev.severity, quality: result.quality || prev.quality }));
      setVitals((prev) => ({ ...prev, bp: result.bp || prev.bp || "", hr: result.hr || prev.hr || "", rr: result.rr || prev.rr || "", spo2: result.spo2 || prev.spo2 || "", temp: result.temp || prev.temp || "", gcs: result.gcs || prev.gcs || "" }));
      (result.medications || []).forEach((m) => { if (m) setMedications((p) => p.includes(m) ? p : [...p, m]); });
      (result.allergies || []).forEach((a) => { if (a) setAllergies((p) => p.includes(a) ? p : [...p, a]); });
      toast.success("Patient data extracted!");
    } catch { toast.error("Could not parse automatically."); }
    setParsing(false);
  };

  const patientName = [demo.firstName, demo.lastName].filter(Boolean).join(" ") || "New Patient";
  const currentItem = ALL_SECTIONS.find((s) => s.section === currentTab);
  const pageAbbr = currentItem?.abbr || "Ps";
  const subItems = NAV_DATA[activeGroup] || [];

  // ─── Render tab content ───
  const renderContent = () => {
    switch (currentTab) {
      case "demo": return <DemoTab demo={demo} setDemo={setDemo} parseText={parseText} setParseText={setParseText} parsing={parsing} onSmartParse={smartParse} esiLevel={esiLevel} setEsiLevel={setEsiLevel} registration={registration} setRegistration={setRegistration} />;
      case "cc":   return <CCTab cc={cc} setCC={setCC} selectedCC={selectedCC} setSelectedCC={setSelectedCC} />;
      case "vit":  return <VitalsTab vitals={vitals} setVitals={setVitals} avpu={avpu} setAvpu={setAvpu} o2del={o2del} setO2del={setO2del} pain={pain} setPain={setPain} triage={triage} setTriage={setTriage} />;
      case "meds": return <MedsTab medications={medications} setMedications={setMedications} allergies={allergies} setAllergies={setAllergies} pmhSelected={pmhSelected} setPmhSelected={setPmhSelected} pmhExtra={pmhExtra} setPmhExtra={setPmhExtra} surgHx={surgHx} setSurgHx={setSurgHx} famHx={famHx} setFamHx={setFamHx} socHx={socHx} setSocHx={setSocHx} pmhExpanded={pmhExpanded} setPmhExpanded={setPmhExpanded} />;
      case "ros":  return <ROSTab />;
      case "pe":   return <PETab peState={peState} setPeState={setPeState} peFindings={peFindings} setPeFindings={setPeFindings} />;
      case "mdm":  return <div style={{ display:"flex", flexDirection:"column", gap:12, alignItems:"center", justifyContent:"center", height:300 }}><div style={{ fontSize:32 }}>⚖️</div><div style={{ color:"#8aaccc" }}>Medical Decision Making</div><button onClick={() => navigate("/NewPatientInput?tab=mdm")} style={{ background:"#00e5c0", color:"#050f1e", border:"none", borderRadius:8, padding:"8px 20px", fontSize:13, fontWeight:700, cursor:"pointer" }}>Open MDM Builder →</button></div>;
      case "chart":    return <div style={{ margin: "-18px -28px", height: "calc(100% + 36px)", overflow: "auto" }}><NotryaApp embedded={true} /></div>;
      case "discharge": return <div style={{ display:"flex", flexDirection:"column", gap:12, alignItems:"center", justifyContent:"center", height:300 }}><div style={{ fontSize:32 }}>🚪</div><div style={{ color:"#8aaccc" }}>Discharge Planning</div><button onClick={() => navigate("/discharge-hub")} style={{ background:"#00e5c0", color:"#050f1e", border:"none", borderRadius:8, padding:"8px 20px", fontSize:13, fontWeight:700, cursor:"pointer" }}>Open Discharge Hub →</button></div>;
      case "orders":   return <div style={{ margin: "-18px -28px", height: "calc(100% + 36px)", overflow: "hidden" }}><EDOrders embedded /></div>;
      case "autocoder": return <AutoCoderTab patientName={patientName} patientMrn={demo.mrn} patientDob={demo.dob} patientAge={demo.age} patientGender={demo.sex} chiefComplaint={cc.text} vitals={vitals} medications={medications} allergies={allergies} pmhSelected={pmhSelected} rosState={rosState} rosSymptoms={rosSymptoms} peState={peState} peFindings={peFindings} />;
      case "procedures": return <EDProcedureNotes embedded patientName={patientName} patientAllergies={allergies.join(", ")} physicianName="" />;
      case "medref": return <div style={{ margin: "-18px -28px", height: "calc(100% + 36px)", overflow: "auto" }}><MedicationReferencePage embedded /></div>;
      case "acs":      return <ACSPage />;
      case "tachy":     return <div style={{ margin: "-18px -28px", height: "calc(100% + 36px)", overflow: "auto", background: "#050f1e" }}><ACSPage defaultSection="tachy" /></div>;
      case "brady":     return <div style={{ margin: "-18px -28px", height: "calc(100% + 36px)", overflow: "auto", background: "#050f1e" }}><ACSPage defaultSection="brady" /></div>;
      case "peds":      return <div style={{ margin: "-18px -28px", height: "calc(100% + 36px)", overflow: "auto", background: "#050f1e" }}><ACSPage defaultSection="peds" /></div>;
      case "pregnancy": return <div style={{ margin: "-18px -28px", height: "calc(100% + 36px)", overflow: "auto", background: "#050f1e" }}><ACSPage defaultSection="pregnancy" /></div>;
      case "erplan": return <div style={{ margin: "-18px -28px", height: "calc(100% + 36px)", overflow: "hidden" }}><ERPlanBuilder embedded /></div>;
      case "erx": return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", justifyContent: "center", height: 300 }}>
          <div style={{ fontSize: 32 }}>💉</div>
          <div style={{ color: "#8aaccc" }}>eRx — Electronic Prescriptions</div>
          <button onClick={() => navigate("/ERx")} style={{ background: "#00e5c0", color: "#050f1e", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Open eRx →</button>
        </div>
      );
      default: return null;
    }
  };

  return (
    <>
      <style>{CSS}</style>

      {/* ═══ ICON SIDEBAR ═══ */}
      <aside className="npi-isb">
        <div className="npi-isb-logo">
          <div className="npi-isb-logo-box">{pageAbbr}</div>
        </div>
        <div className="npi-isb-scroll">
          {APP_ICONS.map((b, i) =>
            b === "sep" ? (
              <div key={i} className="npi-isb-sep" />
            ) : (
              <Link key={i} to={b.to} className={`npi-isb-btn${b.active ? " active" : ""}`} title={b.label}>
                <span>{b.icon}</span>
                <span className="npi-isb-lbl">{b.label}</span>
              </Link>
            )
          )}
        </div>
        <div className="npi-isb-bottom">
          <Link to="/AppSettings" className="npi-isb-btn" title="Settings">
            <span>⚙️</span>
            <span className="npi-isb-lbl">Settings</span>
          </Link>
        </div>
      </aside>

      {/* ═══ TOP BAR ═══ */}
      <header className="npi-top-bar">
        <div className="npi-top-row-1">
          <span className="npi-welcome">Welcome, <strong>Dr. Skiba</strong></span>
          <div className="npi-vsep" />
          <div className="npi-stat"><span className="npi-stat-val">0</span><span className="npi-stat-lbl">Active</span></div>
          <div className="npi-stat"><span className="npi-stat-val alert">14</span><span className="npi-stat-lbl">Pending</span></div>
          <div className="npi-stat"><span className="npi-stat-val">—</span><span className="npi-stat-lbl">Orders</span></div>
          <div className="npi-stat"><span className="npi-stat-val">11.6</span><span className="npi-stat-lbl">Hours</span></div>
          <div className="npi-top-right">
            <div className="npi-clock">{clock}</div>
            <div className="npi-ai-on"><div className="npi-ai-dot" /> AI ON</div>
            <button className="npi-new-pt" onClick={() => navigate("/ProviderStudio?tab=demo")}>+ New Patient</button>
          </div>
        </div>
        <div className="npi-top-row-2">
          <span className="npi-chart-badge">PT-NEW</span>
          <span className="npi-pt-name">{patientName}</span>
          {demo.age && <span className="npi-pt-meta">{demo.age}y · {demo.sex || "—"}</span>}
          {cc.text && <span className="npi-pt-cc">CC: {cc.text}</span>}
          <div className="npi-allergy-wrap" onClick={() => selectSection('meds')}>
            <span>⚠️</span>
            <span className="npi-allergy-lbl">Allergies</span>
            <div className="npi-allergy-pills">
              {allergies.length === 0 ? <span className="npi-allergy-pill npi-muted">None</span> : allergies.slice(0, 2).map(a => <span key={a} className="npi-allergy-pill">{a}</span>)}
            </div>
          </div>
          <div className="npi-vb-div"></div>
          <div className="npi-vb-vital"><span className="npi-vl">BP</span><span className="npi-vv">{vitals.bp || "—"}</span></div>
          <div className="npi-vb-vital"><span className="npi-vl">HR</span><span className={parseInt(vitals.hr) > 120 ? 'npi-vv npi-abn' : 'npi-vv'}>{vitals.hr || "—"}</span></div>
          <div className="npi-vb-vital"><span className="npi-vl">RR</span><span className="npi-vv">{vitals.rr || "—"}</span></div>
          <div className="npi-vb-vital"><span className="npi-vl">SpO₂</span><span className="npi-vv">{vitals.spo2 || "—"}</span></div>
          <div className="npi-vb-vital"><span className="npi-vl">T</span><span className="npi-vv">{vitals.temp || "—"}</span></div>
          <div className="npi-vb-div"></div>
          <span className="npi-status-badge" style={esiLevel ? { background: `rgba(${esiLevel <= 2 ? '255,107,107' : esiLevel === 3 ? '255,159,67' : '0,229,192'},.1)`, color: esiLevel <= 2 ? 'var(--npi-coral)' : esiLevel === 3 ? 'var(--npi-orange)' : 'var(--npi-teal)', border: `1px solid rgba(${esiLevel <= 2 ? '255,107,107' : esiLevel === 3 ? '255,159,67' : '0,229,192'},.3)` } : { color: 'var(--npi-txt4)', border: '1px solid var(--npi-bd)' }}>ESI {esiLevel || '—'}</span>
          <span className="npi-status-badge npi-status-room">Room —</span>
          <div className="npi-top-acts">
            <button className="npi-btn-ghost" onClick={() => selectSection('orders')}>📋 Orders</button>
            <button className="npi-btn-coral" onClick={() => selectSection('discharge')}>🚪 Discharge</button>
            <button className="npi-btn-primary" onClick={async () => {
              try {
                const payload = { raw_note: parseText || `Patient ${patientName} presenting with ${cc.text || "unspecified complaint"}`, patient_name: patientName, patient_id: registration.mrn || demo.mrn || "", patient_age: demo.age || "", patient_gender: demo.sex?.toLowerCase() === "male" ? "male" : demo.sex?.toLowerCase() === "female" ? "female" : "other", date_of_birth: demo.dob || "", chief_complaint: cc.text || "", history_of_present_illness: cc.hpi || "", medications, allergies, status: "draft", registration_mrn: registration.mrn || "", registration_room: registration.room || "", triage_esi_level: esiLevel || "" };
                const created = await base44.entities.ClinicalNote.create(payload);
                toast.success("Patient saved!");
                navigate(`/ClinicalNoteStudio?noteId=${created.id}`);
              } catch (e) { toast.error("Failed to save: " + e.message); }
            }}>💾 Save Chart</button>
          </div>
        </div>
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="npi-main-wrap">
        <main className="npi-content">
          {renderContent()}
        </main>
      </div>

      {/* ═══ AI SCRIM ═══ */}
      <div className={`npi-scrim${aiOpen ? " open" : ""}`} onClick={toggleAI} />

      {/* ═══ AI CHAT OVERLAY ═══ */}
      <div className={`npi-overlay${aiOpen ? " open" : ""}`}>
        <div className="npi-n-hdr">
          <div className="npi-n-hdr-top">
            <div className="npi-n-avatar">🤖</div>
            <div className="npi-n-hdr-info">
              <div className="npi-n-hdr-name">Notrya AI</div>
              <div className="npi-n-hdr-sub"><span className="dot" /> Clinical assistant · online</div>
            </div>
            <button className="npi-n-close" onClick={toggleAI}>✕</button>
          </div>
          <div className="npi-n-quick">
            {QUICK_ACTIONS.map((q) => (
              <button key={q.label} className="npi-n-qbtn" onClick={() => sendMessage(q.prompt)} disabled={aiLoading}>
                {q.icon} {q.label}
              </button>
            ))}
          </div>
        </div>
        <div className="npi-n-msgs" ref={msgsRef}>
          {aiMsgs.map((m, i) => (
            <div key={i} className={`npi-n-msg ${m.role}`} dangerouslySetInnerHTML={{ __html: renderMsg(m.text) }} />
          ))}
          {aiLoading && <div className="npi-n-dots"><span /><span /><span /></div>}
        </div>
        <div className="npi-n-input-bar">
          <textarea
            ref={inputRef}
            className="npi-n-ta"
            rows={1}
            placeholder="Ask anything…"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={handleAIKey}
            onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 90) + "px"; }}
            disabled={aiLoading}
          />
          <button className="npi-n-send" onClick={() => sendMessage(aiInput)} disabled={aiLoading || !aiInput.trim()}>↑</button>
        </div>
      </div>

      {/* ═══ AI FAB ═══ */}
      <button className={`npi-fab${aiOpen ? " open" : ""}`} onClick={toggleAI} title="Notrya AI">
        <span className="npi-fab-icon">{aiOpen ? "✕" : "🤖"}</span>
        <span className={`npi-fab-badge${unread > 0 ? " show" : ""}`}>{unread > 9 ? "9+" : unread}</span>
      </button>

      {/* ═══ BOTTOM NAV ═══ */}
      <nav className="npi-bottom-nav">
        <div className="npi-bn-sub-wrap">
          <div className="npi-bn-sub-row" ref={pillsRef}>
            {subItems.map((item) => (
              <button
                key={item.section}
                className={`npi-bn-sub-pill${item.section === currentTab ? " active" : ""}`}
                onClick={() => selectSection(item.section)}
              >
                <span className="pill-icon">{item.icon}</span>
                {item.label}
                <span className={`pill-dot ${navDots[item.section]}`} />
              </button>
            ))}
          </div>
        </div>
        <div className="npi-bn-groups">
          {GROUP_META.map((g) => (
            <button
              key={g.key}
              className={`npi-bn-group-tab${g.key === activeGroup ? " active" : ""}`}
              onClick={() => selectGroup(g.key)}
            >
              <div className="npi-bn-group-icon">
                {g.icon}
                <span className={`npi-bn-group-badge ${getGroupBadge(g.key)}`} />
              </div>
              <span className="npi-bn-group-label">{g.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}

// ─── CSS ─────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');

:root {
  --npi-bg:#050f1e;--npi-panel:#081628;--npi-card:#0b1e36;--npi-up:#0e2544;
  --npi-bd:#1a3555;--npi-bhi:#2a4f7a;--npi-blue:#3b9eff;--npi-teal:#00e5c0;
  --npi-gold:#f5c842;--npi-coral:#ff6b6b;--npi-orange:#ff9f43;--npi-purple:#9b6dff;
  --npi-txt:#e8f0fe;--npi-txt2:#8aaccc;--npi-txt3:#4a6a8a;--npi-txt4:#2e4a6a;
  --npi-isb:56px;--npi-top:88px;--npi-bot:108px;
}

/* ICON SIDEBAR */
.npi-isb{position:fixed;top:0;left:0;bottom:0;width:var(--npi-isb);background:#040d19;border-right:1px solid var(--npi-bd);display:flex;flex-direction:column;align-items:center;z-index:300}
.npi-isb-logo{width:100%;height:48px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-bottom:1px solid var(--npi-bd)}
.npi-isb-logo-box{width:30px;height:30px;background:var(--npi-blue);border-radius:7px;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:13px;font-weight:700;color:white;cursor:pointer;transition:filter .15s}
.npi-isb-logo-box:hover{filter:brightness(1.2)}
.npi-isb-scroll{flex:1;width:100%;display:flex;flex-direction:column;align-items:center;padding:8px 0;gap:2px;overflow-y:auto}
.npi-isb-btn{width:42px;height:42px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border-radius:6px;cursor:pointer;transition:all .15s;color:var(--npi-txt3);border:1px solid transparent;font-size:15px;text-decoration:none}
.npi-isb-btn:hover{background:var(--npi-up);border-color:var(--npi-bd);color:var(--npi-txt2)}
.npi-isb-btn.active{background:rgba(59,158,255,.1);border-color:rgba(59,158,255,.3);color:var(--npi-blue)}
.npi-isb-lbl{font-size:8px;line-height:1;white-space:nowrap}
.npi-isb-sep{width:30px;height:1px;background:var(--npi-bd);margin:4px 0;flex-shrink:0}
.npi-isb-bottom{padding:8px 0;border-top:1px solid var(--npi-bd);display:flex;flex-direction:column;align-items:center;gap:2px}

/* TOP BAR */
.npi-top-bar{position:fixed;top:0;left:var(--npi-isb);right:0;height:var(--npi-top);background:var(--npi-panel);border-bottom:1px solid var(--npi-bd);z-index:200;display:flex;flex-direction:column}
.npi-top-row-1{height:44px;flex-shrink:0;display:flex;align-items:center;padding:0 14px;gap:8px;border-bottom:1px solid rgba(26,53,85,.5)}
.npi-welcome{font-size:12px;color:var(--npi-txt2);font-weight:500;white-space:nowrap}
.npi-welcome strong{color:var(--npi-txt)}
.npi-vsep{width:1px;height:20px;background:var(--npi-bd);flex-shrink:0}
.npi-stat{display:flex;align-items:center;gap:5px;background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:6px;padding:3px 10px;cursor:pointer}
.npi-stat-val{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;color:var(--npi-txt)}
.npi-stat-val.alert{color:var(--npi-gold)}
.npi-stat-lbl{font-size:9px;color:var(--npi-txt3);text-transform:uppercase;letter-spacing:.04em}
.npi-top-right{margin-left:auto;display:flex;align-items:center;gap:6px}
.npi-clock{background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:6px;padding:3px 10px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--npi-txt2)}
.npi-ai-on{display:flex;align-items:center;gap:4px;background:rgba(0,229,192,.08);border:1px solid rgba(0,229,192,.3);border-radius:6px;padding:3px 10px;font-size:11px;font-weight:600;color:var(--npi-teal)}
.npi-ai-dot{width:6px;height:6px;border-radius:50%;background:var(--npi-teal);animation:npi-ai-pulse 2s ease-in-out infinite}
@keyframes npi-ai-pulse{0%,100%{box-shadow:0 0 0 0 rgba(0,229,192,.4)}50%{box-shadow:0 0 0 5px rgba(0,229,192,0)}}
.npi-new-pt{background:var(--npi-teal);color:var(--npi-bg);border:none;border-radius:6px;padding:4px 12px;font-size:11px;font-weight:700;cursor:pointer;transition:filter .15s;white-space:nowrap}
.npi-new-pt:hover{filter:brightness(1.15)}
.npi-top-row-2{height:44px;flex-shrink:0;display:flex;align-items:center;padding:0 14px;gap:8px;overflow:hidden}
.npi-chart-badge{font-family:'JetBrains Mono',monospace;font-size:10px;background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:20px;padding:1px 8px;color:var(--npi-teal);white-space:nowrap}
.npi-pt-name{font-family:'Playfair Display',serif;font-size:14px;font-weight:600;color:var(--npi-txt);white-space:nowrap}
.npi-pt-meta{font-size:11px;color:var(--npi-txt3);white-space:nowrap}
.npi-pt-cc{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;color:var(--npi-orange);white-space:nowrap}
.npi-top-acts{margin-left:auto;display:flex;align-items:center;gap:5px;flex-shrink:0}
.npi-btn-ghost{background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:6px;padding:4px 10px;font-size:11px;color:var(--npi-txt2);cursor:pointer;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;transition:all .15s;font-family:'DM Sans',sans-serif}
.npi-btn-ghost:hover{border-color:var(--npi-bhi);color:var(--npi-txt)}
.npi-btn-primary{background:var(--npi-teal);color:var(--npi-bg);border:none;border-radius:6px;padding:4px 12px;font-size:11px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;transition:filter .15s;font-family:'DM Sans',sans-serif}
.npi-btn-primary:hover{filter:brightness(1.15)}
.npi-allergy-wrap{display:flex;align-items:center;gap:5px;background:rgba(255,107,107,.08);border:1px solid rgba(255,107,107,.35);border-radius:6px;padding:3px 10px;cursor:pointer;flex-shrink:0;transition:background .15s}
.npi-allergy-wrap:hover{background:rgba(255,107,107,.16)}
.npi-allergy-lbl{font-size:9px;color:var(--npi-coral);text-transform:uppercase;letter-spacing:.06em;font-weight:600;white-space:nowrap}
.npi-allergy-pills{display:flex;gap:4px}
.npi-allergy-pill{font-size:10px;font-weight:600;font-family:'JetBrains Mono',monospace;background:rgba(255,107,107,.2);color:var(--npi-coral);border-radius:4px;padding:1px 6px;white-space:nowrap}
.npi-allergy-pill.npi-muted{background:rgba(74,106,138,.15);color:var(--npi-txt3)}
.npi-vb-div{width:1px;height:18px;background:var(--npi-bd);flex-shrink:0}
.npi-vb-vital{display:flex;align-items:center;gap:3px;font-family:'JetBrains Mono',monospace;font-size:10.5px;white-space:nowrap}
.npi-vl{color:var(--npi-txt4);font-size:9px}
.npi-vv{color:var(--npi-txt2)}
.npi-vv.npi-abn{color:var(--npi-coral);animation:npi-glow-red 2s ease-in-out infinite}
.npi-vv.npi-lo{color:var(--npi-blue);animation:npi-glow-blue 2s ease-in-out infinite}
@keyframes npi-glow-red{0%,100%{text-shadow:0 0 4px rgba(255,107,107,.4)}50%{text-shadow:0 0 10px rgba(255,107,107,.9)}}
@keyframes npi-glow-blue{0%,100%{text-shadow:0 0 4px rgba(59,158,255,.4)}50%{text-shadow:0 0 10px rgba(59,158,255,.9)}}
.npi-status-badge{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;padding:2px 8px;border-radius:4px;white-space:nowrap}
.npi-status-stable{background:rgba(0,229,192,.1);color:var(--npi-teal);border:1px solid rgba(0,229,192,.3)}
.npi-status-unstable{background:rgba(255,107,107,.1);color:var(--npi-coral);border:1px solid rgba(255,107,107,.3)}
.npi-status-muted{background:rgba(74,106,138,.15);color:var(--npi-txt3);border:1px solid var(--npi-bd)}
.npi-status-room{background:rgba(0,229,192,.1);color:var(--npi-teal);border:1px solid rgba(0,229,192,.3)}
.npi-btn-coral{background:rgba(255,107,107,.15);color:var(--npi-coral);border:1px solid rgba(255,107,107,.3);border-radius:6px;padding:4px 12px;font-size:11px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;transition:all .15s;font-family:'DM Sans',sans-serif}
.npi-btn-coral:hover{background:rgba(255,107,107,.25)}

/* MAIN CONTENT */
.npi-main-wrap{position:fixed;top:var(--npi-top);left:var(--npi-isb);right:0;bottom:var(--npi-bot);display:flex;background:var(--npi-bg)}
.npi-content{flex:1;overflow-y:auto;padding:18px 28px 24px;display:flex;flex-direction:column;gap:18px;min-height:0}

/* BOTTOM NAV */
.npi-bottom-nav{position:fixed;bottom:0;left:var(--npi-isb);right:0;height:var(--npi-bot);background:var(--npi-panel);border-top:1px solid var(--npi-bd);z-index:200;display:flex;flex-direction:column}
.npi-bn-sub-wrap{position:relative;flex-shrink:0;height:44px}
.npi-bn-sub-wrap::before,.npi-bn-sub-wrap::after{content:'';position:absolute;top:0;bottom:0;width:24px;z-index:2;pointer-events:none}
.npi-bn-sub-wrap::before{left:0;background:linear-gradient(90deg,var(--npi-panel) 0%,transparent 100%)}
.npi-bn-sub-wrap::after{right:0;background:linear-gradient(-90deg,var(--npi-panel) 0%,transparent 100%)}
.npi-bn-sub-row{height:44px;display:flex;align-items:center;padding:0 12px;gap:6px;overflow-x:auto;overflow-y:hidden;border-bottom:1px solid rgba(26,53,85,.4);scrollbar-width:none;-ms-overflow-style:none}
.npi-bn-sub-row::-webkit-scrollbar{display:none}
.npi-bn-sub-pill{display:flex;align-items:center;gap:5px;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:500;color:var(--npi-txt3);background:transparent;border:1px solid transparent;cursor:pointer;transition:all .2s;white-space:nowrap;flex-shrink:0;font-family:'DM Sans',sans-serif}
.npi-bn-sub-pill:hover{color:var(--npi-txt2);background:var(--npi-up);border-color:var(--npi-bd)}
.npi-bn-sub-pill.active{color:var(--npi-blue);background:rgba(59,158,255,.1);border-color:rgba(59,158,255,.35);font-weight:600}
.npi-bn-sub-pill .pill-icon{font-size:12px}
.npi-bn-sub-pill .pill-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.npi-bn-sub-pill .pill-dot.done{background:var(--npi-teal);box-shadow:0 0 4px rgba(0,229,192,.5)}
.npi-bn-sub-pill .pill-dot.partial{background:var(--npi-orange);box-shadow:0 0 4px rgba(255,159,67,.5)}
.npi-bn-sub-pill .pill-dot.empty{background:var(--npi-txt4)}
.npi-bn-groups{height:64px;flex-shrink:0;display:flex;align-items:stretch}
.npi-bn-group-tab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;position:relative;transition:all .2s;border:none;background:none;font-family:'DM Sans',sans-serif;padding:6px 0}
.npi-bn-group-tab::before{content:'';position:absolute;top:0;left:20%;right:20%;height:2px;background:var(--npi-blue);border-radius:0 0 2px 2px;transform:scaleX(0);transition:transform .25s cubic-bezier(.34,1.56,.64,1)}
.npi-bn-group-tab.active::before{transform:scaleX(1)}
.npi-bn-group-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;background:transparent;border:1px solid transparent;transition:all .2s;position:relative}
.npi-bn-group-tab:hover .npi-bn-group-icon{background:var(--npi-up);border-color:var(--npi-bd)}
.npi-bn-group-tab.active .npi-bn-group-icon{background:rgba(59,158,255,.1);border-color:rgba(59,158,255,.3)}
.npi-bn-group-badge{position:absolute;top:2px;right:2px;width:8px;height:8px;border-radius:50%;border:1.5px solid var(--npi-panel)}
.npi-bn-group-badge.done{background:var(--npi-teal)}
.npi-bn-group-badge.partial{background:var(--npi-orange)}
.npi-bn-group-badge.empty{background:transparent;border-color:transparent}
.npi-bn-group-label{font-size:9px;font-weight:500;letter-spacing:.04em;text-transform:uppercase;color:var(--npi-txt4);transition:color .2s}
.npi-bn-group-tab:hover .npi-bn-group-label{color:var(--npi-txt3)}
.npi-bn-group-tab.active .npi-bn-group-label{color:var(--npi-blue);font-weight:600}
.npi-bn-group-tab+.npi-bn-group-tab{border-left:1px solid rgba(26,53,85,.4)}

/* AI FAB & OVERLAY */
.npi-scrim{position:fixed;inset:0;z-index:9997;background:rgba(3,8,16,.4);backdrop-filter:blur(2px);opacity:0;pointer-events:none;transition:opacity .3s}
.npi-scrim.open{opacity:1;pointer-events:auto}
.npi-fab{position:fixed;bottom:124px;right:24px;z-index:9999;width:52px;height:52px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--npi-teal) 0%,#00b4d8 100%);box-shadow:0 6px 24px rgba(0,229,192,.35);transition:all .35s cubic-bezier(.34,1.56,.64,1);animation:npi-ring 3s ease-in-out infinite}
.npi-fab:hover{transform:scale(1.1)}
.npi-fab.open{animation:none;background:linear-gradient(135deg,var(--npi-coral) 0%,#e05555 100%);box-shadow:0 6px 24px rgba(255,107,107,.35);transform:rotate(90deg)}
@keyframes npi-ring{0%,100%{box-shadow:0 6px 24px rgba(0,229,192,.35),0 0 0 0 rgba(0,229,192,.28)}50%{box-shadow:0 6px 24px rgba(0,229,192,.35),0 0 0 10px rgba(0,229,192,0)}}
.npi-fab-icon{font-size:22px;line-height:1}
.npi-fab-badge{position:absolute;top:-3px;right:-3px;min-width:18px;height:18px;border-radius:10px;background:var(--npi-coral);color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid var(--npi-bg);padding:0 4px;opacity:0;transform:scale(0);transition:all .3s cubic-bezier(.34,1.56,.64,1)}
.npi-fab-badge.show{opacity:1;transform:scale(1)}
.npi-overlay{position:fixed;bottom:180px;right:24px;z-index:9998;width:330px;height:500px;background:#081628;border:1px solid var(--npi-bd);border-radius:18px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.55);opacity:0;transform:translateY(20px) scale(.94);pointer-events:none;transition:all .35s cubic-bezier(.34,1.56,.64,1)}
.npi-overlay.open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}
.npi-n-hdr{padding:14px 14px 10px;flex-shrink:0;border-bottom:1px solid var(--npi-bd);background:linear-gradient(180deg,rgba(0,229,192,.05) 0%,transparent 100%)}
.npi-n-hdr-top{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.npi-n-avatar{width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,var(--npi-teal),var(--npi-blue));display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
.npi-n-hdr-info{flex:1}
.npi-n-hdr-name{font-family:'Playfair Display',serif;font-size:14px;font-weight:600;color:var(--npi-txt)}
.npi-n-hdr-sub{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--npi-txt3);margin-top:2px;display:flex;align-items:center;gap:4px}
.npi-n-hdr-sub .dot{width:5px;height:5px;border-radius:50%;background:var(--npi-teal)}
.npi-n-close{width:28px;height:28px;border-radius:7px;border:1px solid var(--npi-bd);background:var(--npi-up);color:var(--npi-txt3);font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0}
.npi-n-close:hover{border-color:var(--npi-bhi);color:var(--npi-txt2)}
.npi-n-quick{display:flex;flex-wrap:wrap;gap:4px}
.npi-n-qbtn{padding:4px 10px;border-radius:20px;font-size:11px;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .2s;background:var(--npi-up);border:1px solid var(--npi-bd);color:var(--npi-txt2);display:flex;align-items:center;gap:4px}
.npi-n-qbtn:hover{border-color:rgba(0,229,192,.4);color:var(--npi-teal);background:rgba(0,229,192,.06)}
.npi-n-qbtn:disabled{opacity:.4;cursor:not-allowed}
.npi-n-msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:7px}
.npi-n-msgs::-webkit-scrollbar{width:4px}
.npi-n-msgs::-webkit-scrollbar-thumb{background:var(--npi-bd);border-radius:2px}
.npi-n-msg{padding:9px 12px;border-radius:11px;font-size:12px;line-height:1.6;max-width:88%;font-family:'DM Sans',sans-serif}
.npi-n-msg.sys{background:rgba(14,37,68,.6);color:var(--npi-txt3);border:1px solid rgba(26,53,85,.5);align-self:center;max-width:100%;text-align:center;font-size:11px;font-style:italic;border-radius:7px}
.npi-n-msg.user{background:rgba(59,158,255,.12);border:1px solid rgba(59,158,255,.22);color:var(--npi-txt);align-self:flex-end;border-radius:12px 12px 3px 12px}
.npi-n-msg.bot{background:rgba(0,229,192,.06);border:1px solid rgba(0,229,192,.15);color:var(--npi-txt);align-self:flex-start;border-radius:12px 12px 12px 3px}
.npi-n-dots{display:flex;gap:5px;padding:10px 12px;align-self:flex-start;align-items:center}
.npi-n-dots span{width:6px;height:6px;border-radius:50%;background:var(--npi-teal);animation:npi-bounce 1.2s ease-in-out infinite}
.npi-n-dots span:nth-child(2){animation-delay:.15s}
.npi-n-dots span:nth-child(3){animation-delay:.3s}
@keyframes npi-bounce{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-6px);opacity:1}}
.npi-n-input-bar{padding:9px 12px 14px;flex-shrink:0;border-top:1px solid var(--npi-bd);display:flex;gap:7px;align-items:flex-end}
.npi-n-ta{flex:1;background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:10px;padding:8px 11px;color:var(--npi-txt);font-family:'DM Sans',sans-serif;font-size:12px;outline:none;resize:none;min-height:36px;max-height:90px;line-height:1.5;transition:border-color .2s}
.npi-n-ta:focus{border-color:var(--npi-teal)}
.npi-n-ta::placeholder{color:var(--npi-txt4)}
.npi-n-ta:disabled{opacity:.5}
.npi-n-send{width:36px;height:36px;flex-shrink:0;background:linear-gradient(135deg,var(--npi-teal),#00b4d8);border:none;border-radius:10px;color:var(--npi-bg);font-size:17px;font-weight:700;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center}
.npi-n-send:hover{transform:scale(1.08)}
.npi-n-send:disabled{opacity:.4;cursor:not-allowed;transform:none}
`;