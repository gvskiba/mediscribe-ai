import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";

const COLORS = {
  navy: "#050f1e",
  slate: "#0b1d35",
  panel: "#0d2240",
  edge: "#162d4f",
  border: "#1e3a5f",
  muted: "#2a4d72",
  dim: "#4a7299",
  text: "#c8ddf0",
  bright: "#e8f4ff",
  teal: "#00d4bc",
  amber: "#f5a623",
  red: "#ff5c6c",
  green: "#2ecc71",
  purple: "#9b6dff",
  blue: "#4a90d9",
  rose: "#f472b6",
  gold: "#f0c040",
  orange: "#ff8c42",
  cyan: "#22d3ee",
};

const MODULES = [
  {
    id: "transcription",
    title: "Live Transcription Studio",
    icon: "🎙️",
    desc: "Ambient mic records patient encounters in real time. AI outputs structured SOAP notes live.",
    page: "LiveTranscription",
    color: COLORS.teal,
    featured: true,
    badges: ["● LIVE", "FLAGSHIP"],
    meta: "",
  },
  {
    id: "soap",
    title: "SOAP Note Compiler",
    icon: "📋",
    desc: "Compile, structure, and finalize SOAP notes from transcription output or manual entry.",
    page: "SoapCompiler",
    color: COLORS.blue,
    badges: ["SOAP"],
    meta: "",
  },
  {
    id: "analysis",
    title: "Clinical Analysis Center",
    icon: "🔬",
    desc: "AI-powered lab, imaging, and EKG analysis. Claude interprets abnormalities and generates clinical impressions.",
    page: "LabsImagingTab",
    color: COLORS.purple,
    badges: ["VISION"],
    meta: "Labs · Imaging · EKG",
  },
  {
    id: "templates",
    title: "Note Templates Library",
    icon: "📄",
    desc: "50+ specialty-specific note templates. Pick a template, fill key fields, AI completes the narrative.",
    page: "NoteTemplates",
    color: COLORS.cyan,
    badges: ["54 TEMPLATES"],
    meta: "ED · ICU · Inpatient · Outpatient",
  },
  {
    id: "orders",
    title: "Order Set Builder",
    icon: "📑",
    desc: "Evidence-based order sets for CHF, Sepsis, Stroke, DKA, COPD, CAP, and PE. AI suggests missing orders.",
    page: "OrderSetBuilder",
    color: COLORS.rose,
    badges: ["276 ORDERS"],
    meta: "7 conditions · AHA/ACC/IDSA",
  },
  {
    id: "discharge",
    title: "Discharge Planning Center",
    icon: "🚪",
    desc: "5-section discharge checklist, AI-generated patient instructions, medication reconciliation, follow-up scheduling.",
    page: "DischargePlanning",
    color: COLORS.orange,
    badges: ["DISCHARGE"],
    meta: "Med rec · PDF export",
  },
];

const COMPLIANCE_MODULES = [
  {
    id: "addendum",
    title: "Addendum & Amendment Manager",
    icon: "✏️",
    desc: "Late-entry addenda, attestations, and co-sign workflows. Full audit trail with timestamps.",
    page: "AddendumManager",
    color: COLORS.amber,
    featured: true,
    badges: ["COMPLIANT"],
    meta: "",
  },
  {
    id: "shift",
    title: "Shift Dashboard",
    icon: "🏥",
    desc: "Complete shift overview: patient census, task queue, pending orders, lab alerts, and handoff summaries.",
    page: "Shift",
    color: COLORS.blue,
    badges: ["SHIFT"],
    meta: "Census · Tasks · Handoff",
  },
];

const REFERENCE_MODULES = [
  {
    id: "drugs",
    title: "Drug Reference & Interactions",
    icon: "💊",
    desc: "Comprehensive drug monographs, real-time interaction checker, contraindications, renal/hepatic dosing.",
    page: "DrugReference",
    color: COLORS.green,
    badges: ["INTERACTIONS"],
    meta: "Dosing · Interactions · Renal",
  },
  {
    id: "antibiotic",
    title: "Antibiotic Stewardship Guide",
    icon: "🦠",
    desc: "Evidence-based antibiotic selection by infection type. MRSA coverage, ESKAPE pathogens, de-escalation protocols.",
    page: "AntibioticStewardship",
    color: COLORS.gold,
    badges: ["STEWARDSHIP"],
    meta: "IDSA · De-escalation · MRSA",
  },
  {
    id: "peds",
    title: "Pediatric Dosing Calculator",
    icon: "👶",
    desc: "Weight-based dosing for pediatric medications, age-specific reference ranges, resuscitation drug calculations.",
    page: "PediatricDosing",
    color: "#60a5fa",
    badges: ["PEDS"],
    meta: "Weight-based · Resuscitation",
  },
  {
    id: "calculators",
    title: "Medical Calculators",
    icon: "🧮",
    desc: "40+ validated clinical calculators: HEART score, CHADS-VASc, Wells criteria, APACHE II, Framingham, GFR.",
    page: "Calculators",
    color: COLORS.teal,
    badges: ["40+ CALC"],
    meta: "Cardiology · Nephrology · Critical Care",
  },
  {
    id: "guidelines",
    title: "Clinical Guidelines Search",
    icon: "📚",
    desc: "Instant AI-powered search across ACC/AHA, IDSA, GOLD, ADA, ASA, and 20+ society guidelines.",
    page: "Guidelines",
    color: COLORS.purple,
    badges: ["GUIDELINES"],
    meta: "ACC · AHA · IDSA · ADA · ASA",
  },
];

// Active Note Widget Component
function ActiveNoteWidget({ navigate }) {
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  const { data: recentNotes = [] } = useQuery({
    queryKey: ["recentNotesHome"],
    queryFn: async () => {
      const notes = await base44.entities.ClinicalNote.list("-updated_date", 10);
      return notes;
    },
  });

  const SECTIONS = [
    { id: "patient_intake", label: "Subjective", icon: "📝" },
    { id: "physical_exam", label: "Physical Exam", icon: "🩺" },
    { id: "labs_imaging", label: "Labs & Imaging", icon: "🧪", route: "Results" },
    { id: "differential", label: "Diagnoses", icon: "⚕️" },
    { id: "treatment_plan", label: "Treatment Plan", icon: "💊" },
    { id: "disposition_plan", label: "Disposition", icon: "🚑" },
  ];

  return (
    <div style={{ position: "relative", zIndex: 1, padding: "0 28px 24px" }}>
      <div style={{ 
        background: COLORS.panel, 
        border: `1px solid ${COLORS.border}`, 
        borderRadius: 18, 
        padding: "20px 24px",
        boxShadow: `0 4px 16px ${COLORS.teal}08`
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ 
            width: 40, 
            height: 40, 
            borderRadius: 10, 
            background: `linear-gradient(135deg, ${COLORS.teal}20, ${COLORS.blue}15)`,
            border: `1px solid ${COLORS.teal}40`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18
          }}>
            📋
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontFamily: "'Playfair Display', serif", 
              fontSize: 18, 
              fontWeight: 700, 
              color: COLORS.bright,
              marginBottom: 2
            }}>
              Active Note
            </div>
            <div style={{ fontSize: 12, color: COLORS.dim }}>
              Select a note and jump to any section
            </div>
          </div>
        </div>

        <select
          value={selectedNoteId || ""}
          onChange={(e) => setSelectedNoteId(e.target.value || null)}
          style={{
            width: "100%",
            background: COLORS.edge,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 10,
            padding: "10px 14px",
            color: COLORS.text,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            outline: "none",
            marginBottom: 16
          }}
        >
          <option value="">Select a clinical note...</option>
          {recentNotes.map(note => (
            <option key={note.id} value={note.id}>
              {note.patient_name || "Unnamed Patient"} — {note.chief_complaint || "No CC"} ({note.date_of_visit || "No date"})
            </option>
          ))}
        </select>

        {selectedNoteId && (
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(3, 1fr)", 
            gap: 8,
            animation: "fadeUp 0.3s ease"
          }}>
            {SECTIONS.map(section => (
              <button
                key={section.id}
                onClick={() => {
                  if (section.route === "Results") {
                    navigate(createPageUrl("Results"));
                  } else {
                    const tab = section.tab || section.id;
                    navigate(`${createPageUrl("ClinicalNoteStudio")}?noteId=${selectedNoteId}&tab=${tab}`);
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: COLORS.edge,
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.text,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${COLORS.teal}10`;
                  e.currentTarget.style.borderColor = `${COLORS.teal}50`;
                  e.currentTarget.style.color = COLORS.teal;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = COLORS.edge;
                  e.currentTarget.style.borderColor = COLORS.border;
                  e.currentTarget.style.color = COLORS.text;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <span style={{ fontSize: 16 }}>{section.icon}</span>
                <span>{section.label}</span>
              </button>
            ))}
          </div>
        )}

        {!selectedNoteId && (
          <div style={{ 
            textAlign: "center", 
            padding: "20px", 
            color: COLORS.muted,
            fontSize: 12
          }}>
            Select a note above to access quick section navigation
          </div>
        )}
      </div>
    </div>
  );
}

function ModuleCard({ module, navigate }) {
  return (
    <button
      onClick={() => navigate(createPageUrl(module.page))}
      style={{
        position: "relative",
        overflow: "hidden",
        padding: 20,
        borderRadius: 14,
        background: COLORS.panel,
        border: `1px solid ${COLORS.border}`,
        textDecoration: "none",
        color: "inherit",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        transition: "all 0.22s",
        cursor: "pointer",
        animation: "fadeUp 0.4s ease both",
        gridColumn: module.featured ? "span 2" : undefined,
        "--card-color": module.color,
        "--hover-color": module.color,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.borderColor = module.color;
        e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px ${module.color}22`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = COLORS.border;
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
        <div
          style={{
            width: module.featured ? 60 : 46,
            height: module.featured ? 60 : 46,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: module.featured ? 28 : 22,
            flexShrink: 0,
            background: `${module.color}18`,
            border: `1px solid ${module.color}40`,
          }}
        >
          {module.icon}
        </div>
        {module.badges && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
            {module.badges.map((badge, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.07em",
                  padding: "2px 7px",
                  borderRadius: 8,
                  background: `${module.color}18`,
                  color: module.color,
                  border: `1px solid ${module.color}35`,
                }}
              >
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 17,
            fontWeight: 700,
            color: COLORS.bright,
            letterSpacing: "-0.01em",
            marginBottom: 6,
            lineHeight: 1.2,
          }}
        >
          {module.title}
        </div>
        <p style={{ fontSize: 12, color: COLORS.dim, lineHeight: 1.6 }}>{module.desc}</p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 1,
          paddingTop: 12,
          borderTop: `1px solid ${COLORS.border}`,
          marginTop: "auto",
        }}
      >
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: COLORS.muted }}>
          {module.meta || ""}
        </span>
        <div style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, background: COLORS.edge, border: `1px solid ${COLORS.border}`, color: COLORS.dim, transition: "all 0.18s" }}>
          →
        </div>
      </div>
    </button>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [clock, setClock] = useState("");

  const formatDisplayName = (name) => {
    if (!name) return "User";
    const formatted = name.split('.')
                         .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                         .join(' ');
    return `Dr. ${formatted}`;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const t = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
      const d = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      setClock(`${d} · ${t}`);
    };
    updateClock();
    const iv = setInterval(updateClock, 1000);
    return () => clearInterval(iv);
  }, []);

  const initials = currentUser?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "—";

  const NAV_ITEMS = [
    { section: "CORE", items: [
      { icon: "🏠", label: "Home", page: "Home" },
      { icon: "📊", label: "Dashboard", page: "Dashboard" },
      { icon: "🏥", label: "Shift", page: "Shift" },
      { icon: "👤", label: "Patients", page: "PatientDashboard" },
    ]},
    { section: "DOCUMENTATION", items: [
      { icon: "🎙️", label: "Transcription", page: "LiveTranscription" },
      { icon: "📋", label: "SOAP", page: "SoapCompiler" },
      { icon: "✨", label: "Note Studio", page: "ClinicalNoteStudio" },
      { icon: "📄", label: "Notes", page: "NotesLibrary" },
      { icon: "📑", label: "Orders", page: "OrderSetBuilder" },
      { icon: "🚪", label: "Discharge", page: "DischargePlanning" },
    ]},
    { section: "RESULTS", items: [
      { icon: "🧪", label: "Labs", page: "Results" },
      { icon: "🔬", label: "Imaging", page: "Results" },
      { icon: "❤️", label: "EKG", page: "Results" },
    ]},
    { section: "REFERENCE", items: [
      { icon: "📚", label: "Guidelines", page: "Guidelines" },
      { icon: "💊", label: "Drugs", page: "DrugReference" },
      { icon: "🦠", label: "Antibiotics", page: "AntibioticStewardship" },
      { icon: "🧮", label: "Calculators", page: "Calculators" },
      { icon: "🧠", label: "Knowledge", page: "MedicalKnowledgeBase" },
    ]},
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: COLORS.navy, minHeight: "100vh", color: COLORS.text, overflowX: "hidden", display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 3px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes glow { 0%,100% { box-shadow: 0 0 20px ${COLORS.teal}20; } 50% { box-shadow: 0 0 40px ${COLORS.teal}50; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }
      `}</style>

      {/* Sidebar */}
      <div style={{ 
        width: 72, 
        background: "linear-gradient(180deg, #0a1628 0%, #050f1e 100%)", 
        borderRight: `1px solid ${COLORS.border}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 0",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
        overflowY: "auto"
      }}>
        {/* Logo */}
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: COLORS.bright,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Playfair Display', serif",
          fontSize: 20,
          fontWeight: 900,
          color: COLORS.navy,
          marginBottom: 24
        }}>
          N.
        </div>

        {/* Nav sections */}
        {NAV_ITEMS.map((section, idx) => (
          <div key={idx} style={{ width: "100%", marginBottom: 16 }}>
            <div style={{ 
              fontFamily: "'JetBrains Mono', monospace", 
              fontSize: 7, 
              fontWeight: 700, 
              color: COLORS.muted, 
              letterSpacing: "0.1em",
              textAlign: "center",
              marginBottom: 8,
              padding: "0 4px"
            }}>
              {section.section}
            </div>
            {section.items.map(item => (
              <button
                key={item.page}
                onClick={() => navigate(createPageUrl(item.page))}
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  padding: "10px 8px",
                  background: "transparent",
                  border: "none",
                  color: COLORS.dim,
                  fontSize: 24,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  position: "relative"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${COLORS.teal}12`;
                  e.currentTarget.style.color = COLORS.teal;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = COLORS.dim;
                }}
              >
                <span>{item.icon}</span>
                <span style={{ 
                  fontSize: 9, 
                  fontWeight: 500, 
                  fontFamily: "'DM Sans', sans-serif",
                  textAlign: "center"
                }}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>

      <div style={{ marginLeft: 72, flex: 1, position: "relative" }}>
        <div style={{ position: "fixed", inset: 0, left: 72, zIndex: 0, pointerEvents: "none", background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${COLORS.teal}14 0%, transparent 70%)` }} />

      {/* Navbar */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 200,
          height: 58,
          background: "rgba(11,29,53,0.92)",
          borderBottom: `1px solid ${COLORS.border}`,
          backdropFilter: "blur(16px)",
          display: "flex",
          alignItems: "center",
          padding: "0 28px",
          gap: 18,
        }}
      >
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate(createPageUrl("Home"));
          }}
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 22,
            fontWeight: 700,
            color: COLORS.bright,
            letterSpacing: "-0.02em",
            textDecoration: "none",
            cursor: "pointer",
          }}
        >
          Notrya
        </a>
        <div style={{ width: 1, height: 20, background: COLORS.border }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: COLORS.teal, letterSpacing: "0.1em" }}>
          COMMAND CENTER
        </span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: `${COLORS.red}18`, border: `1px solid ${COLORS.red}40` }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.red, animation: "pulse 1.2s infinite" }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: COLORS.red, letterSpacing: "0.08em" }}>
            LIVE
          </span>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: COLORS.dim, letterSpacing: "0.05em", minWidth: 160 }}>
          {clock}
        </span>
        {currentUser && (
          <button
            onClick={() => navigate(createPageUrl("UserPreferences"))}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 10, 
              padding: "6px 14px", 
              borderRadius: 10, 
              background: COLORS.panel, 
              border: `1px solid ${COLORS.border}`,
              cursor: "pointer",
              transition: "all 0.15s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = COLORS.teal;
              e.currentTarget.style.background = `${COLORS.teal}10`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = COLORS.border;
              e.currentTarget.style.background = COLORS.panel;
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${COLORS.teal}60, ${COLORS.blue}60)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                color: COLORS.navy,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {initials}
            </div>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: COLORS.text, fontWeight: 500 }}>
              {formatDisplayName(currentUser.full_name)}
            </span>
          </button>
        )}
      </nav>

      {/* Hero */}
      <div style={{ position: "relative", zIndex: 1, padding: "52px 28px 36px", display: "flex", alignItems: "flex-start", gap: 48 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: COLORS.teal, letterSpacing: "0.14em", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 24, height: 1, background: COLORS.teal }} />
            NOTRYA AI PLATFORM
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 900, color: COLORS.bright, lineHeight: 1.08, letterSpacing: "-0.03em", marginBottom: 16 }}>
            Command <span style={{ color: COLORS.teal }}>Center.</span>
          </h1>
          <p style={{ fontSize: 15, color: COLORS.dim, lineHeight: 1.7, maxWidth: 480, marginBottom: 28 }}>
            Your complete AI-powered clinical documentation suite. Transcribe, analyze, order, document, and comply — all from one unified platform.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={() => navigate(createPageUrl("PatientDashboard"))}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "11px 22px",
                borderRadius: 11,
                background: `linear-gradient(135deg, ${COLORS.teal}22, ${COLORS.blue}16)`,
                border: `1px solid ${COLORS.teal}50`,
                color: COLORS.teal,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.18s",
                animation: "glow 3s infinite",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <span>🎙️</span> Start New Session
            </button>
            <button
              onClick={() => navigate(createPageUrl("Shift"))}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "11px 22px",
                borderRadius: 11,
                background: COLORS.edge,
                border: `1px solid ${COLORS.border}`,
                color: COLORS.dim,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.18s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = COLORS.dim;
                e.currentTarget.style.color = COLORS.text;
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.color = COLORS.dim;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span>🏥</span> Shift Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Active Note Widget */}
      <ActiveNoteWidget navigate={navigate} />

      {/* Quick Launch */}
      <div style={{ position: "relative", zIndex: 1, padding: "0 28px 24px" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {MODULES.slice(0, 6).map((m) => (
            <button
              key={m.id}
              onClick={() => navigate(createPageUrl(m.page))}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 16px",
                borderRadius: 10,
                background: COLORS.edge,
                border: `1px solid ${COLORS.border}`,
                textDecoration: "none",
                color: COLORS.text,
                fontSize: 13,
                fontWeight: 500,
                transition: "all 0.15s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${m.color}50`;
                e.currentTarget.style.color = m.color;
                e.currentTarget.style.background = `${m.color}0f`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.color = COLORS.text;
                e.currentTarget.style.background = COLORS.edge;
              }}
            >
              <span>{m.icon}</span>
              {m.title.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Core AI Modules */}
      <div style={{ position: "relative", zIndex: 1, padding: "0 28px 40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, paddingBottom: 14, borderBottom: `1px solid ${COLORS.border}` }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: COLORS.dim, letterSpacing: "0.12em" }}>
            CORE AI MODULES
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: COLORS.muted, padding: "2px 7px", borderRadius: 8, background: COLORS.edge, border: `1px solid ${COLORS.border}` }}>
            {MODULES.length} tools
          </span>
          <div style={{ flex: 1, height: 1, background: COLORS.border }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
          {MODULES.map((m) => (
            <ModuleCard key={m.id} module={m} navigate={navigate} />
          ))}
        </div>
      </div>

      {/* Compliance & Administration */}
      <div style={{ position: "relative", zIndex: 1, padding: "0 28px 40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, paddingBottom: 14, borderBottom: `1px solid ${COLORS.border}` }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: COLORS.dim, letterSpacing: "0.12em" }}>
            COMPLIANCE & ADMINISTRATION
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: COLORS.muted, padding: "2px 7px", borderRadius: 8, background: COLORS.edge, border: `1px solid ${COLORS.border}` }}>
            {COMPLIANCE_MODULES.length} tools
          </span>
          <div style={{ flex: 1, height: 1, background: COLORS.border }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
          {COMPLIANCE_MODULES.map((m) => (
            <ModuleCard key={m.id} module={m} navigate={navigate} />
          ))}
        </div>
      </div>

      {/* Clinical Reference */}
      <div style={{ position: "relative", zIndex: 1, padding: "0 28px 40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, paddingBottom: 14, borderBottom: `1px solid ${COLORS.border}` }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: COLORS.dim, letterSpacing: "0.12em" }}>
            CLINICAL REFERENCE
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: COLORS.muted, padding: "2px 7px", borderRadius: 8, background: COLORS.edge, border: `1px solid ${COLORS.border}` }}>
            {REFERENCE_MODULES.length} tools
          </span>
          <div style={{ flex: 1, height: 1, background: COLORS.border }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, maxWidth: "100%" }}>
          {REFERENCE_MODULES.map((m) => (
            <ModuleCard key={m.id} module={m} navigate={navigate} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ position: "relative", zIndex: 1, padding: "20px 28px", borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: COLORS.muted, letterSpacing: "0.06em" }}>
          NOTRYA AI PLATFORM · v2.4.1 · © 2026 · All clinical data is PHI-protected under HIPAA
        </div>
        <div style={{ display: "flex", gap: 20 }}>
           <a href="#" onClick={(e) => e.preventDefault()} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: COLORS.muted, textDecoration: "none", letterSpacing: "0.06em", transition: "color 0.15s", cursor: "pointer" }} onMouseEnter={(e) => e.currentTarget.style.color = COLORS.text} onMouseLeave={(e) => e.currentTarget.style.color = COLORS.muted}>
             Support
           </a>
           <a href="#" onClick={(e) => e.preventDefault()} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: COLORS.muted, textDecoration: "none", letterSpacing: "0.06em", transition: "color 0.15s", cursor: "pointer" }} onMouseEnter={(e) => e.currentTarget.style.color = COLORS.text} onMouseLeave={(e) => e.currentTarget.style.color = COLORS.muted}>
             Documentation
           </a>
           <a href="#" onClick={(e) => e.preventDefault()} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: COLORS.muted, textDecoration: "none", letterSpacing: "0.06em", transition: "color 0.15s", cursor: "pointer" }} onMouseEnter={(e) => e.currentTarget.style.color = COLORS.text} onMouseLeave={(e) => e.currentTarget.style.color = COLORS.muted}>
             Privacy Policy
           </a>
         </div>
      </footer>
      </div>
      </div>
      );
      }