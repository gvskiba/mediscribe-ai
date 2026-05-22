import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// ── All hubs in one flat list ──────────────────────────────────────────────────
const ALL_HUBS = [
  // Critical Care
  { id:"cardiac",       route:"/cardiac-hub",              icon:"🫀", title:"Cardiac Hub",                category:"Critical Care",   badge:"2025 ACC/AHA",   color:"#ff6b6b" },
  { id:"resus",         route:"/resus-hub",                icon:"💓", title:"Resuscitation Hub",          category:"Critical Care",   badge:"ACLS·PALS",      color:"#ff4444" },
  { id:"shock",         route:"/shock-hub",                icon:"🚨", title:"Shock Hub",                  category:"Critical Care",   badge:"ACEP 2023",      color:"#ff6b6b" },
  { id:"sepsis-abx",    route:"/sepsis-hub",               icon:"🦠", title:"Sepsis Hub",                 category:"Critical Care",   badge:"SSC 2021",       color:"#f5c842" },
  { id:"sepsisabx",     route:"/SepsisHub",                icon:"💉", title:"Sepsis ABX Hub",             category:"Critical Care",   badge:"SOURCE-BASED",   color:"#3dffa0" },
  { id:"sepsis-bundle", route:"/SepsisBundleTracker",      icon:"📊", title:"Sepsis Bundle Tracker",      category:"Critical Care",   badge:"CMS SEP-1",      color:"#f5c842" },
  { id:"critical-protocols", route:"/CriticalProtocolsPage", icon:"⚡", title:"Critical Protocols",         category:"Critical Care",   badge:"ACEP/SSC",       color:"#f43f5e" },
  { id:"trauma",        route:"/trauma-hub",               icon:"🩹", title:"Trauma Hub",                 category:"Critical Care",   badge:"ATLS 11th Ed",   color:"#ff9f43" },
  { id:"critical-drip", route:"/CriticalCareDripHub",      icon:"💧", title:"Critical Care Drip Hub",     category:"Critical Care",   badge:"ICU Tools",      color:"#ff6060" },
  { id:"stroke",        route:"/stroke-hub",               icon:"🧠", title:"Stroke Hub",                 category:"Critical Care",   badge:"AHA 2023",       color:"#9b6dff" },
  { id:"antidote",      route:"/antidote-hub",             icon:"🧬", title:"Antidote Hub",               category:"Critical Care",   badge:"ANTIDOTES",      color:"#3dffa0" },

  // Chief Complaint
  { id:"chestpain",     route:"/ChestPainHub",             icon:"💓", title:"Chest Pain Hub",             category:"Chief Complaint", badge:"HEART·EDACS",    color:"#ff6b6b" },
  { id:"dyspnea",       route:"/DyspneaHub",               icon:"💨", title:"Dyspnea Hub",                category:"Chief Complaint", badge:"BLUE·PE",        color:"#3b9eff" },
  { id:"headache",      route:"/HeadacheHub",              icon:"🤕", title:"Headache Hub",               category:"Chief Complaint", badge:"OTTAWA·SAH",     color:"#9b6dff" },
  { id:"abdpain",       route:"/AbdominalPainHub",         icon:"🔴", title:"Abdominal Pain Hub",         category:"Chief Complaint", badge:"ALVARADO",       color:"#ff9f43" },
  { id:"ams",           route:"/ams-hub",                  icon:"😵", title:"AMS Hub",                    category:"Chief Complaint", badge:"AEIOU-TIPS",     color:"#9b6dff" },
  { id:"syncope",       route:"/syncope-hub",              icon:"💫", title:"Syncope Hub",                category:"Chief Complaint", badge:"SFSR·CSRS",      color:"#f5c842" },
  { id:"dvt",           route:"/dvt-hub",                  icon:"🩸", title:"DVT / VTE Hub",              category:"Chief Complaint", badge:"DOAC·WELLS",     color:"#3b9eff" },
  { id:"pain",          route:"/pain-hub",                 icon:"🩺", title:"Pain Hub",                   category:"Chief Complaint", badge:"MULTIMODAL",     color:"#ff9f43" },
  { id:"seizure",       route:"/seizure-hub",              icon:"⚡", title:"Seizure Hub",                category:"Chief Complaint", badge:"STATUS EPI",     color:"#9b6dff" },

  // Diagnostics
  { id:"ecg",           route:"/ecg-hub",                  icon:"📈", title:"ECG Hub",                    category:"Diagnostics",     badge:"ACC/AHA",        color:"#00d4ff" },
  { id:"labs",          route:"/LabHub",                   icon:"🧪", title:"Lab Hub",                    category:"Diagnostics",     badge:"AI·TRENDS",      color:"#3dffa0" },
  { id:"scores",        route:"/score-hub",                icon:"🎯", title:"Score Hub",                  category:"Diagnostics",     badge:"12+ TOOLS",      color:"#3b9eff" },
  { id:"pocus",         route:"/pocus-hub",                icon:"🔊", title:"POCUS Hub",                  category:"Diagnostics",     badge:"BEDSIDE",        color:"#00d4ff" },
  { id:"radiology",     route:"/radiology-hub",            icon:"🩻", title:"Radiology Hub",              category:"Diagnostics",     badge:"IMAGING",        color:"#82aece" },
  { id:"imaging",       route:"/imaging-interpreter",      icon:"🩻", title:"Imaging Interpreter",        category:"Diagnostics",     badge:"AI",             color:"#82aece" },
  { id:"critical-inbox",route:"/critical-inbox",           icon:"🔴", title:"Critical Results Inbox",     category:"Diagnostics",     badge:"ALERTS",         color:"#ff4444" },

  // Pharmacology
  { id:"pharma",        route:"/unified-pharma",           icon:"⚗",  title:"Unified Pharmacology Hub",   category:"Pharmacology",    badge:"AI-Powered",     color:"#00b4d8" },
  { id:"weightdose",    route:"/weight-dose",              icon:"⚖️", title:"Weight / Drip Dosing",       category:"Pharmacology",    badge:"30 DRUGS",       color:"#00e5c0" },
  { id:"fluids",        route:"/FluidElectrolyteCalculator",icon:"🧪",title:"Fluid & Electrolyte Calc",   category:"Pharmacology",    badge:"Na·K·HCO3",      color:"#4ade80" },
  { id:"abxsteward",    route:"/AntibioticStewardshipHub", icon:"💉", title:"Antibiotic Stewardship",     category:"Pharmacology",    badge:"DE-ESCALATE",    color:"#3dffa0" },
  { id:"drugcompare",   route:"/DrugComparisonHub",        icon:"🔬", title:"Drug Comparison Hub",        category:"Pharmacology",    badge:"SIDE-BY-SIDE",   color:"#00b4d8" },
  { id:"medrec",        route:"/MedRecHub",                icon:"📋", title:"Med Reconciliation",         category:"Pharmacology",    badge:"AI·INTERACTIONS",color:"#9b6dff" },
  { id:"dischargerx",   route:"/DischargeRxCard",          icon:"💊", title:"Discharge Rx Card",          category:"Pharmacology",    badge:"DOSE·DURATION",  color:"#f5c842" },
  { id:"tox",           route:"/tox-hub",                  icon:"☠️", title:"Toxicology Hub",             category:"Pharmacology",    badge:"ANTIDOTES",      color:"#3dffa0" },
  { id:"order-gen",     route:"/order-generator",          icon:"📋", title:"Order Generator",            category:"Pharmacology",    badge:"CPOE BRIDGE",    color:"#3b9eff" },

  // Specialty
  { id:"peds",          route:"/peds-hub",                 icon:"👶", title:"Pediatric Hub",              category:"Specialty",       badge:"PALS 2025",      color:"#b99bff" },
  { id:"ob",            route:"/ob-hub",                   icon:"🤰", title:"OB/GYN Hub",                 category:"Specialty",       badge:"ACOG",           color:"#ff6b9d" },
  { id:"psych",         route:"/psyche-hub",               icon:"💭", title:"Psychiatry Hub",             category:"Specialty",       badge:"DROPERIDOL",     color:"#ff6b9d" },
  { id:"dental",        route:"/DentalHub",                icon:"🦷", title:"Dental Hub",                 category:"Specialty",       badge:"DENTAL EM",      color:"#00b4d8" },
  { id:"derm",          route:"/derm-hub",                 icon:"🩺", title:"Dermatology Hub",            category:"Specialty",       badge:"ABCDE·DDx",      color:"#00e5c0" },
  { id:"ortho",         route:"/ortho-hub",                icon:"🦴", title:"Orthopaedic Hub",            category:"Specialty",       badge:"AI-SPLINTS",     color:"#a78bfa" },

  // Procedures
  { id:"airway",        route:"/airway-hub",               icon:"🌬️",title:"Airway Hub",                 category:"Procedures",      badge:"DAS 2022",       color:"#3b9eff" },
  { id:"surgical-airway",route:"/surgical-airway-hub",     icon:"✂️", title:"Surgical Airway",            category:"Procedures",      badge:"CRIC",           color:"#ff4444" },
  { id:"wound",         route:"/wound-care-hub",           icon:"🩹", title:"Wound Care Hub",             category:"Procedures",      badge:"CLOSURE",        color:"#ff9f43" },
  { id:"procedure-hub", route:"/procedure-hub",            icon:"🔧", title:"Procedure Hub",              category:"Procedures",      badge:"CPT CODES",      color:"#00d4ff" },
  { id:"ed-proc-notes", route:"/ed-procedure-notes",       icon:"📝", title:"ED Procedure Notes",         category:"Procedures",      badge:"TEMPLATES",      color:"#00d4ff" },
  { id:"pocus2",        route:"/pocus-hub",                icon:"🔬", title:"POCUS Hub",                  category:"Procedures",      badge:"BEDSIDE",        color:"#00d4ff" },
  { id:"rapid",         route:"/rapid-assessment-hub",     icon:"⚡", title:"Rapid Assessment",           category:"Procedures",      badge:"10 TEMPLATES",   color:"#06b6d4" },

  // Documentation & Tools
  { id:"quicknote",     route:"/QuickNote",                icon:"📋", title:"QuickNote",                  category:"Tools",           badge:"AI-Powered",     color:"#00e5c0" },
  { id:"autocoder",     route:"/AutoCoder",                icon:"🤖", title:"AutoCoder",                  category:"Tools",           badge:"ICD·CPT·E/M",    color:"#9b6dff" },
  { id:"ddx",           route:"/ddx-engine",               icon:"🔎", title:"DDx Engine",                 category:"Tools",           badge:"AI-Powered",     color:"#3b9eff" },
  { id:"narrative",     route:"/narrative-engine",         icon:"✍️", title:"Clinical Narrative Engine",  category:"Tools",           badge:"AI-Powered",     color:"#9b6dff" },
  { id:"clinpres",      route:"/ClinicalPresentationHub",  icon:"🏥", title:"Clinical Presentation Hub",  category:"Tools",           badge:"EVIDENCE-BASED", color:"#3b9eff" },
  { id:"discharge",     route:"/discharge-hub",            icon:"🏠", title:"Discharge Hub",              category:"Tools",           badge:"AI-POWERED",     color:"#00d4ff" },
  { id:"consult",       route:"/consult-hub",              icon:"📡", title:"Consult Hub",                category:"Tools",           badge:"16 SPECIALTIES", color:"#9b6dff" },
  { id:"knowledge",     route:"/KnowledgeBaseV2",          icon:"📖", title:"Knowledge Base",             category:"Tools",           badge:"GUIDELINES",     color:"#6b63ff" },
  { id:"calculator",    route:"/Calculators",              icon:"🧮", title:"Clinical Calculators",       category:"Tools",           badge:"40+ TOOLS",      color:"#00e5c0" },
  { id:"score-hub",     route:"/score-hub",                icon:"🎯", title:"Score Hub",                  category:"Tools",           badge:"12+ SCORES",     color:"#3b9eff" },
  { id:"triage",        route:"/triage-hub",               icon:"🏷️",title:"Triage Hub",                 category:"Tools",           badge:"ESI v4",         color:"#fb923c" },
  { id:"id-hub",        route:"/id-hub",                   icon:"🦠", title:"Infectious Disease Hub",     category:"Tools",           badge:"AI ID COACH",    color:"#3dffa0" },

  // Workflow & Dashboard
  { id:"command-center",route:"/command-center",           icon:"⚕️", title:"Command Center",             category:"Workflow",        badge:"AI BRIEFING",    color:"#00e5c0" },
  { id:"ed-tracking",   route:"/EDTrackingBoard",          icon:"📊", title:"ED Tracking Board",          category:"Workflow",        badge:"LIVE",           color:"#00e5c0" },
  { id:"dispo-board",   route:"/DispositionBoard",         icon:"🚪", title:"Disposition Board",          category:"Workflow",        badge:"BOARDING",       color:"#00e5c0" },
  { id:"shift-dash",    route:"/ShiftDashboard",           icon:"🏥", title:"Shift Dashboard",            category:"Workflow",        badge:"AUTO-REFRESH",   color:"#00e5c0" },
  { id:"huddle",        route:"/huddle-board",             icon:"👥", title:"Huddle Board",               category:"Workflow",        badge:"REAL-TIME",      color:"#00e5c0" },
  { id:"new-patient",   route:"/NewPatientInput",          icon:"🆕", title:"New Patient Input",          category:"Workflow",        badge:"CLINICAL WF",    color:"#00e5c0" },
  { id:"vitals",        route:"/VitalsHub",                icon:"📈", title:"Vitals Hub",                 category:"Workflow",        badge:"LIVE",           color:"#3b9eff" },
  { id:"calendar",      route:"/Calendar",                 icon:"📅", title:"Provider Schedule",          category:"Workflow",        badge:"SHIFTS",         color:"#00e5c0" },
  { id:"preferences",   route:"/UserPreferences",          icon:"⚙️", title:"Provider Preferences",       category:"Workflow",        badge:"SETTINGS",       color:"#82aece" },
];

// Deduplicate by route (keep first occurrence)
const seen = new Set();
const HUBS = ALL_HUBS.filter(h => {
  if (seen.has(h.route)) return false;
  seen.add(h.route);
  return true;
});

const CATEGORIES = ["All", ...Array.from(new Set(HUBS.map(h => h.category)))];

const CAT_COLORS = {
  "Critical Care":   "#ff6b6b",
  "Chief Complaint": "#3b9eff",
  "Diagnostics":     "#00d4ff",
  "Pharmacology":    "#00b4d8",
  "Specialty":       "#ff6b9d",
  "Procedures":      "#ff9f43",
  "Tools":           "#9b6dff",
  "Workflow":        "#00e5c0",
};

export default function HubIndex() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return HUBS.filter(h => {
      const catMatch = activeCategory === "All" || h.category === activeCategory;
      const searchMatch = !q || h.title.toLowerCase().includes(q) || h.badge.toLowerCase().includes(q) || h.category.toLowerCase().includes(q);
      return catMatch && searchMatch;
    });
  }, [search, activeCategory]);

  const grouped = useMemo(() => {
    if (activeCategory !== "All") return null;
    const groups = {};
    filtered.forEach(h => {
      if (!groups[h.category]) groups[h.category] = [];
      groups[h.category].push(h);
    });
    return groups;
  }, [filtered, activeCategory]);

  return (
    <div style={{ minHeight: "100vh", background: "#050f1e", color: "#f2f7ff", fontFamily: "'DM Sans', sans-serif", padding: "24px 20px 60px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;600&family=DM+Sans:wght@400;500;600&display=swap');
        .hub-card { transition: transform 0.15s, box-shadow 0.15s, background 0.15s, border-color 0.15s; }
        .hub-card:hover { transform: translateY(-3px); }
        .cat-pill { transition: all 0.15s; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
      `}</style>

      {/* Header */}
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#3b9eff,#00e5c0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#050f1e" }}>L</div>
              <h1 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#ffffff", lineHeight: 1 }}>Lakonyx Hub Index</h1>
              <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "rgba(0,229,192,0.1)", color: "#00e5c0", border: "1px solid rgba(0,229,192,0.3)" }}>{HUBS.length} HUBS</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#82aece" }}>Every clinical hub in one place — search, filter, and navigate instantly</p>
          </div>
          <button onClick={() => navigate("/hub")} style={{ padding: "8px 18px", borderRadius: 10, border: "1px solid rgba(59,158,255,0.4)", background: "rgba(59,158,255,0.08)", color: "#3b9eff", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Hub Selector →
          </button>
        </div>

        {/* Search bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px", height: 44, borderRadius: 12, background: "rgba(8,22,44,0.9)", border: `1px solid ${search ? "rgba(59,158,255,0.5)" : "rgba(26,53,85,0.6)"}`, marginBottom: 16, transition: "border-color 0.15s", maxWidth: 520 }}>
          <span style={{ fontSize: 15, opacity: 0.4 }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${HUBS.length} hubs…`}
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#f2f7ff", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "#82aece", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
          )}
          {!search && (
            <kbd style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#5a82a8", background: "rgba(42,79,122,0.2)", border: "1px solid rgba(42,79,122,0.3)", borderRadius: 4, padding: "2px 6px" }}>⌘K</kbd>
          )}
        </div>

        {/* Category filter pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
          {CATEGORIES.map(cat => {
            const active = activeCategory === cat;
            const color = cat === "All" ? "#00e5c0" : (CAT_COLORS[cat] || "#82aece");
            return (
              <button key={cat} className="cat-pill" onClick={() => setActiveCategory(cat)}
                style={{ padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", background: active ? `${color}20` : "rgba(8,22,44,0.8)", border: `1px solid ${active ? color + "60" : "rgba(26,53,85,0.5)"}`, color: active ? color : "#82aece", boxShadow: active ? `0 0 10px ${color}18` : "none" }}>
                {cat}
                {cat !== "All" && <span style={{ marginLeft: 5, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, opacity: 0.7 }}>{HUBS.filter(h => h.category === cat).length}</span>}
              </button>
            );
          })}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#5a82a8", fontFamily: "'JetBrains Mono', monospace", alignSelf: "center" }}>{filtered.length} shown</span>
        </div>

        {/* Hub grid — grouped by category when "All" is selected */}
        {grouped ? (
          Object.entries(grouped).map(([cat, hubs]) => (
            <div key={cat} style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 3, height: 14, borderRadius: 2, background: CAT_COLORS[cat] || "#82aece", flexShrink: 0 }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: CAT_COLORS[cat] || "#82aece", textTransform: "uppercase", letterSpacing: "0.1em" }}>{cat}</span>
                <div style={{ height: 1, flex: 1, background: (CAT_COLORS[cat] || "#82aece") + "20" }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#5a82a8" }}>{hubs.length} hub{hubs.length !== 1 ? "s" : ""}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
                {hubs.map(hub => <HubCard key={hub.id} hub={hub} navigate={navigate} />)}
              </div>
            </div>
          ))
        ) : (
          filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#5a82a8" }}>
              <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.3 }}>🔍</div>
              <div style={{ fontSize: 14, color: "#82aece" }}>No hubs match <strong style={{ color: "#b8d4f0" }}>"{search}"</strong></div>
              <button onClick={() => { setSearch(""); setActiveCategory("All"); }} style={{ marginTop: 12, fontSize: 11, color: "#3b9eff", background: "transparent", border: "none", cursor: "pointer" }}>Clear filters</button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
              {filtered.map(hub => <HubCard key={hub.id} hub={hub} navigate={navigate} />)}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function HubCard({ hub, navigate }) {
  const [hov, setHov] = useState(false);
  return (
    <div className="hub-card"
      onClick={() => navigate(hub.route)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ padding: "12px 14px", borderRadius: 12, cursor: "pointer", background: hov ? hub.color + "14" : hub.color + "09", border: `1px solid ${hov ? hub.color + "50" : hub.color + "22"}`, boxShadow: hov ? `0 6px 20px rgba(0,0,0,0.35), 0 0 0 1px ${hub.color}20` : "none", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: hub.color + "18", border: `1px solid ${hub.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>{hub.icon}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#f2f7ff", fontFamily: "'Playfair Display', serif", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{hub.title}</div>
          <span style={{ fontSize: 8, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, padding: "1px 6px", borderRadius: 20, background: hub.color + "18", border: `1px solid ${hub.color}28`, color: hub.color }}>{hub.badge}</span>
        </div>
        <span style={{ fontSize: 12, color: hov ? hub.color : "#2e4a6a", transition: "color 0.15s", flexShrink: 0 }}>→</span>
      </div>
      <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: hov ? hub.color + "cc" : "#3a5f80", textTransform: "uppercase", letterSpacing: "0.08em" }}>{hub.category}</div>
    </div>
  );
}