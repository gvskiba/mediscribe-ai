import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search } from "lucide-react";
import DashboardTopBar from "../components/dashboard/DashboardTopBar";

const T = {
  navy: "#050f1e",
  slate: "#0b1d35",
  panel: "#0e2340",
  edge: "#162d4f",
  border: "#1e3a5f",
  muted: "#2a4d72",
  dim: "#4a7299",
  text: "#c8ddf0",
  bright: "#e8f4ff",
  teal: "#00d4bc",
  teal2: "#00a896",
  amber: "#f5a623",
  red: "#ff5c6c",
  green: "#2ecc71",
  purple: "#9b6dff",
  rose: "#f472b6",
  gold: "#fbbf24",
};

const pageData = {
  app: { name: "ClinAI", page: "Provider Dashboard", session: { status: "AI_ACTIVE" } },
  provider: {
    name: "Dr. Alexandra Reyes",
    initials: "AR",
    specialty: "Emergency Medicine",
    role: "Attending Physician",
    avatar: "👩‍⚕️",
    greeting: "Good morning",
    stats: [
      { label: "Active Patients", value: "7", color: T.teal },
      { label: "Notes Pending", value: "3", color: T.amber },
      { label: "Orders Queue", value: "12", color: T.purple },
      { label: "Shift Hours", value: "4.2", color: T.green },
    ],
  },
  shift: {
    start: "06:00",
    end: "18:00",
    type: "Day Shift",
    unit: "Emergency Department — Bay 7",
  },
  calendar: {
    shiftStart: "06:00",
    upcomingEvents: [
      { time: "10:30", label: "Trauma bay — incoming GSW", color: T.red },
      { time: "12:00", label: "Team handoff / lunch huddle", color: T.amber },
      { time: "14:00", label: "Procedure: LP — Bay 4", color: T.teal },
    ],
    onCallDays: [3, 7, 14, 21, 28],
    markedDays: [
      { day: 5, label: "CME — Airway Workshop", color: T.purple },
      { day: 12, label: "Grand Rounds", color: T.teal },
      { day: 19, label: "Board Review Session", color: T.amber },
    ],
  },
  openEvidence: {
    brandName: "OpenEvidence",
    brandIcon: "⚡",
    baseUrl: "https://www.openevidence.com/search?q=",
    placeholder: "Search clinical evidence, guidelines, drug interactions…",
    specialty: "Emergency Medicine",
    recentQueries: [
      "tPA contraindications ischemic stroke",
      "ketamine RSI dosing renal failure",
      "HEART score ACS risk stratification",
      "sepsis lactate clearance targets",
      "PE Wells criteria low probability",
    ],
    topicChips: [
      { label: "RSI Protocols", query: "rapid sequence intubation protocol", color: "teal" },
      { label: "Sepsis Bundles", query: "sepsis 1 hour bundle SSCG 2024", color: "red" },
      { label: "STEMI Workup", query: "STEMI diagnosis management guidelines", color: "amber" },
      { label: "Tox & Antidotes", query: "toxicology antidotes emergency", color: "purple" },
      { label: "Airway Management", query: "difficult airway algorithm emergency", color: "teal" },
      { label: "Stroke Thrombolysis", query: "tPA alteplase stroke contraindications", color: "rose" },
      { label: "Fluid Resuscitation", query: "IV fluid resuscitation shock emergency", color: "green" },
      { label: "Pain Management", query: "multimodal analgesia emergency medicine", color: "amber" },
      { label: "DVT / PE", query: "VTE diagnosis treatment emergency", color: "purple" },
      { label: "Pediatric EM", query: "pediatric emergency dosing resuscitation", color: "rose" },
    ],
  },
  medicalNews: {
    panelTitle: "EM Medical News",
    filterTabs: [
      { id: "all", label: "All", active: true },
      { id: "resuscitation", label: "Resuscitation", active: false },
      { id: "toxicology", label: "Toxicology", active: false },
      { id: "trauma", label: "Trauma", active: false },
      { id: "cardiology", label: "Cardiology", active: false },
      { id: "airway", label: "Airway", active: false },
    ],
    articles: [
      {
        id: "n001",
        title: "High-Flow Nasal Cannula vs. NIV in Acute Hypoxic Respiratory Failure",
        source: "NEJM",
        sourceBadgeColor: "rgba(255,92,108,0.15)",
        sourceTextColor: "#ff8a95",
        topic: "resuscitation",
        topicColor: T.teal,
        recency: "2h ago",
        impact: "high",
      },
      {
        id: "n002",
        title: "Fentanyl Adulteration in Stimulant Supply: New Surveillance Data",
        source: "Annals EM",
        sourceBadgeColor: "rgba(155,109,255,0.15)",
        sourceTextColor: "#b894ff",
        topic: "toxicology",
        topicColor: T.purple,
        recency: "5h ago",
        impact: "high",
      },
      {
        id: "n003",
        title: "AI-Guided Triage Scoring Reduces Door-to-ECG Time",
        source: "JAMA EM",
        sourceBadgeColor: "rgba(0,212,188,0.12)",
        sourceTextColor: T.teal,
        topic: "cardiology",
        topicColor: T.amber,
        recency: "8h ago",
        impact: "featured",
      },
    ],
  },
  patientNotes: {
    panelTitle: "Patient Notes",
    notes: [
      { id: "pn001", patientName: "Marcus Thornton", mrn: "PT-20847", avatar: "👨", noteType: "ER Note — Subjective", status: "urgent", statusLabel: "In Progress", bay: "Bay 7", time: "09:14" },
      { id: "pn002", patientName: "Elena Vasquez", mrn: "PT-20831", avatar: "👩", noteType: "ER Note — Assessment", status: "active", statusLabel: "Active", bay: "Bay 3", time: "08:45" },
      { id: "pn003", patientName: "Robert Kim", mrn: "PT-20819", avatar: "👨", noteType: "Discharge Summary", status: "active", statusLabel: "Pending Sign", bay: "Bay 11", time: "08:20" },
      { id: "pn004", patientName: "Sarah Okonkwo", mrn: "PT-20808", avatar: "👩", noteType: "ER Note — Plan", status: "active", statusLabel: "Active", bay: "Bay 2", time: "07:55" },
      { id: "pn005", patientName: "James Whitfield", mrn: "PT-20795", avatar: "👨", noteType: "ER Note — Objective", status: "stable", statusLabel: "Stable", bay: "Bay 5", time: "07:30" },
      { id: "pn006", patientName: "Priya Nair", mrn: "PT-20781", avatar: "👩", noteType: "ER Note — Complete", status: "complete", statusLabel: "Signed", bay: "Discharged", time: "06:40" },
    ],
  },
};

function WelcomeBar({ user }) {
  const [stats, setStats] = useState([
    { label: "Active Patients", value: "—", color: T.teal },
    { label: "Notes Pending", value: "—", color: T.amber },
    { label: "Orders Queue", value: "—", color: T.purple },
    { label: "Shift Hours", value: "—", color: T.green },
  ]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const notes = await base44.entities.ClinicalNote.list();
        const draftNotes = notes?.filter(n => n.status === "draft")?.length || 0;
        const pendingNotes = notes?.filter(n => n.status === "finalized")?.length || 0;

        setStats([
          { label: "Active Patients", value: String(draftNotes), color: T.teal },
          { label: "Notes Pending", value: String(pendingNotes), color: T.amber },
          { label: "Orders Queue", value: "—", color: T.purple },
          { label: "Shift Hours", value: "4.2", color: T.green },
        ]);
      } catch (error) {
        console.error("Failed to load stats:", error);
      }
    };
    loadStats();
  }, []);

  const provider = pageData.provider;
  const lastName = user?.full_name?.split(" ").pop() || "Reyes";
  const specialties = {
    emergency_medicine: "Emergency Medicine",
    internal_medicine: "Internal Medicine",
    family_medicine: "Family Medicine",
    pediatrics: "Pediatrics",
    cardiology: "Cardiology",
    pulmonology: "Pulmonology",
    neurology: "Neurology",
    psychiatry: "Psychiatry",
    surgery: "Surgery",
    orthopedics: "Orthopedics",
  };
  const providerTypes = { md: "Dr.", do: "Dr.", pa: "PA", np: "NP", other: "" };
  const specialty = user?.clinical_settings?.medical_specialty ? specialties[user.clinical_settings.medical_specialty] : null;
  const prefix = providerTypes[user?.clinical_settings?.provider_type] || "Dr.";
  
  return (
    <div style={{ background: `linear-gradient(135deg, ${T.panel}, rgba(0,212,188,0.04))`, border: `1px solid ${T.border}`, borderRadius: "14px", padding: "16px 24px", display: "flex", alignItems: "center", gap: "20px", position: "relative", overflow: "hidden" }}>
      <div style={{ height: "3px", width: "100%", background: `linear-gradient(90deg, ${T.teal}, ${T.purple}, ${T.amber})`, position: "absolute", top: 0, left: 0 }} />
      <div style={{ position: "absolute", right: "-40px", top: "-40px", width: "180px", height: "180px", background: `radial-gradient(circle, rgba(0,212,188,0.06), transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ fontFamily: "Playfair Display, serif", fontSize: "22px", color: T.bright, fontWeight: 500 }}>
        {provider.greeting}, <span style={{ color: T.teal }}>{prefix} {lastName}</span>
      </div>
      {specialty && (
        <div style={{ background: "rgba(239,68,68,0.15)", border: `1px solid rgba(239,68,68,0.3)`, borderRadius: "12px", padding: "12px 16px", textAlign: "center", marginLeft: "auto" }}>
          <div style={{ fontSize: "14px", color: "#ef4444", fontWeight: 600 }}>
            {specialty}
          </div>
        </div>
      )}
      <div style={{ marginLeft: "auto", display: "flex", gap: "12px" }}>
        {stats.map((stat, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 16px", background: T.edge, borderRadius: "10px", border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: "11px", color: T.dim, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {stat.label}
            </div>
            <div style={{ fontSize: "18px", color: stat.color, fontWeight: 600, marginTop: "4px" }}>{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClockCalPanel() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = String(time.getHours()).padStart(2, "0");
  const minutes = String(time.getMinutes()).padStart(2, "0");
  const seconds = time.getSeconds();
  const dateStr = time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  // Get the current month and year, and calculate correct calendar days
  const currentMonth = time.getMonth();
  const currentYear = time.getFullYear();
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  // Create array with empty slots for days before the first of the month
  const calendarDays = Array(startingDayOfWeek).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  const today = time.getDate();

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: "14px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Clock Section */}
      <div style={{ padding: "24px 20px 16px", background: `linear-gradient(180deg, rgba(0,212,188,0.04), transparent)`, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontFamily: "Playfair Display, serif", fontSize: "52px", color: T.bright, fontWeight: 400, lineHeight: 1, letterSpacing: "-0.02em" }}>
          {hours}
          <span style={{ animation: "clockColon 1s infinite", color: T.teal }}>:</span>
          {minutes}
        </div>
        <svg width="56" height="56" viewBox="0 0 56 56" style={{ marginTop: "12px", transform: "rotate(-90deg)" }}>
          <circle cx="28" cy="28" r="24" fill="none" stroke={T.edge} strokeWidth="3" />
          <circle cx="28" cy="28" r="24" fill="none" stroke={T.teal} strokeWidth="3" strokeDasharray="150.8" strokeDashoffset={150.8 * (1 - seconds / 60)} />
        </svg>
        <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", color: T.dim, marginTop: "8px" }}>
          {dateStr}
        </div>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "11px", color: T.teal, background: `rgba(0,212,188,0.08)`, border: `1px solid rgba(0,212,188,0.15)`, borderRadius: "6px", padding: "3px 10px", display: "inline-block", marginTop: "6px" }}>
          Shift: 4h 28m
        </div>
      </div>

      {/* Calendar Section */}
      <div style={{ padding: "14px 16px" }}>
        <div style={{ fontFamily: "Playfair Display, serif", fontSize: "15px", color: T.bright, fontWeight: 500, marginBottom: "12px" }}>
          {time.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
          {["S", "M", "T", "W", "T", "F", "S"].map(d => (
            <div key={d} style={{ fontSize: "10px", color: T.dim, fontWeight: 600, textAlign: "center", padding: "4px 0" }}>
              {d}
            </div>
          ))}
          {calendarDays.map((day, idx) => (
            <div
              key={idx}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                cursor: day ? "pointer" : "default",
                transition: "all 0.15s",
                border: day === today ? `1px solid ${T.teal}` : `1px solid transparent`,
                background: day === today ? T.teal : (day ? T.edge : "transparent"),
                color: day === today ? T.navy : T.text,
                fontWeight: day === today ? 700 : 400,
              }}
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div style={{ padding: "0 16px 14px" }}>
        <div style={{ fontSize: "10px", color: T.dim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
          Upcoming
        </div>
        {pageData.calendar.upcomingEvents.map((event, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "9px", padding: "8px 10px", borderRadius: "8px", background: T.edge, border: `1px solid ${T.border}`, marginBottom: "6px" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: event.color, marginTop: "4px", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", color: T.dim }}>
                {event.time}
              </div>
              <div style={{ fontSize: "12px", color: T.text }}>{event.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SearchPanel() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const handleSearch = (q) => {
    if (q.trim()) {
      const searchUrl = `https://www.openevidence.com/search?q=${encodeURIComponent(q)}`;
      window.open(searchUrl, "_blank");
    }
  };

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: "14px", overflow: "hidden" }}>
      {/* Brand Bar */}
      <div style={{ padding: "13px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "Playfair Display, serif", fontSize: "15px", color: T.bright, display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "26px", height: "26px", borderRadius: "7px", background: `linear-gradient(135deg, ${T.teal}, ${T.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", color: "white" }}>
            {pageData.openEvidence.brandIcon}
          </div>
          {pageData.openEvidence.brandName}
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ margin: "14px 16px", display: "flex", gap: "8px" }}>
        <input
          type="text"
          placeholder={pageData.openEvidence.placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
          style={{
            flex: 1,
            background: T.edge,
            border: `1px solid ${T.border}`,
            borderRadius: "10px",
            padding: "10px 14px",
            color: T.bright,
            fontSize: "14px",
            outline: "none",
            transition: "all 0.2s",
          }}
          onFocus={(e) => { e.target.style.borderColor = T.teal; e.target.style.boxShadow = `0 0 0 3px rgba(0,212,188,0.15)`; }}
          onBlur={(e) => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }}
        />
        <button onClick={() => handleSearch(query)} style={{ padding: "10px 18px", borderRadius: "10px", background: `linear-gradient(135deg, ${T.teal}, ${T.teal2})`, color: T.navy, fontWeight: 600, fontSize: "13px", cursor: "pointer", border: "none" }}>
          Search
        </button>
      </div>

      {/* Recent Queries */}
      <div style={{ padding: "0 16px 10px" }}>
        <div style={{ fontSize: "10px", color: T.dim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
          Recent
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {pageData.openEvidence.recentQueries.map((q, i) => (
            <button
              key={i}
              onClick={() => { setQuery(q); handleSearch(q); }}
              style={{ padding: "4px 10px", borderRadius: "6px", background: T.edge, border: `1px solid ${T.border}`, color: T.text, fontSize: "12px", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.teal; e.currentTarget.style.color = T.teal; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text; }}
            >
              {q.substring(0, 20)}...
            </button>
          ))}
        </div>
      </div>

      {/* Topic Chips */}
      <div style={{ padding: "0 16px 14px" }}>
        <div style={{ fontSize: "10px", color: T.dim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
          Topics
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {pageData.openEvidence.topicChips.map((chip, i) => {
            const colorMap = { teal: T.teal, amber: T.amber, purple: T.purple, rose: T.rose, red: T.red, green: T.green };
            const chipColor = colorMap[chip.color] || T.teal;
            return (
              <button
                key={i}
                onClick={() => { setQuery(chip.query); handleSearch(chip.query); }}
                style={{ padding: "5px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 500, cursor: "pointer", transition: "all 0.15s", background: `rgba(${parseInt(chipColor.slice(1, 3), 16)},${parseInt(chipColor.slice(3, 5), 16)},${parseInt(chipColor.slice(5, 7), 16)},0.1)`, color: chipColor, border: `1px solid rgba(${parseInt(chipColor.slice(1, 3), 16)},${parseInt(chipColor.slice(3, 5), 16)},${parseInt(chipColor.slice(5, 7), 16)},0.2)` }}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NewsPanel() {
  const [activeTab, setActiveTab] = useState("all");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const newsData = pageData.medicalNews;

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Search medical journals, publications, and clinical websites for the latest news and studies in these categories: Resuscitation, Toxicology, Trauma, Cardiology, and Airway. Focus on recent publications from NEJM, Annals of Emergency Medicine, JAMA EM, and other major medical journals published in the last 2 weeks.

Return structured data as JSON:
{
  "articles": [
    {
      "title": "Article title",
      "source": "Journal abbreviation (e.g., NEJM, Annals EM, JAMA EM)",
      "topic": "resuscitation|toxicology|trauma|cardiology|airway",
      "recency": "Xh ago or Xd ago",
      "impact": "high|featured",
      "summary": "One sentence summary"
    }
  ]
}

Return 5-8 articles total.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              articles: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    source: { type: "string" },
                    topic: { type: "string" },
                    recency: { type: "string" },
                    impact: { type: "string" },
                    summary: { type: "string" }
                  }
                }
              }
            }
          }
        });

        if (result && result.articles && Array.isArray(result.articles)) {
          const topicColorMap = {
            resuscitation: T.teal,
            toxicology: T.purple,
            trauma: T.red,
            cardiology: T.amber,
            airway: T.rose,
          };
          const sourceBadgeMap = {
            "NEJM": { bg: "rgba(255,92,108,0.15)", text: "#ff8a95" },
            "Annals EM": { bg: "rgba(155,109,255,0.15)", text: "#b894ff" },
            "JAMA EM": { bg: "rgba(0,212,188,0.12)", text: T.teal },
            "Circulation": { bg: "rgba(244,114,182,0.15)", text: "#f472b6" },
            "CHEST": { bg: "rgba(59,130,246,0.15)", text: "#60a5fa" },
            "Lancet": { bg: "rgba(34,197,94,0.15)", text: "#22c55e" },
          };

          const processed = result.articles.map((article, idx) => ({
            id: `n${idx}`,
            title: article.title,
            source: article.source,
            sourceBadgeColor: sourceBadgeMap[article.source]?.bg || "rgba(42,77,114,0.15)",
            sourceTextColor: sourceBadgeMap[article.source]?.text || T.dim,
            topic: article.topic,
            topicColor: topicColorMap[article.topic] || T.teal,
            recency: article.recency,
            impact: article.impact,
          }));
          setArticles(processed);
        }
      } catch (error) {
        console.error("Failed to fetch news:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const filteredArticles = articles.filter(article => 
    activeTab === "all" || article.topic === activeTab
  );

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: "14px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "4px", padding: "8px 14px", overflowX: "auto", borderBottom: `1px solid ${T.border}` }}>
        {newsData.filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "5px 12px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
              border: activeTab === tab.id ? `1px solid rgba(0,212,188,0.3)` : "1px solid transparent",
              background: activeTab === tab.id ? "rgba(0,212,188,0.15)" : "transparent",
              color: activeTab === tab.id ? T.teal : T.dim,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { if (activeTab !== tab.id) { e.currentTarget.style.background = T.edge; e.currentTarget.style.color = T.text; } }}
            onMouseLeave={(e) => { if (activeTab !== tab.id) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.dim; } }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* News Cards */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: "16px", textAlign: "center", color: T.dim, fontSize: "12px" }}>Loading medical news...</div>
        ) : filteredArticles.length === 0 ? (
          <div style={{ padding: "16px", textAlign: "center", color: T.dim, fontSize: "12px" }}>
            No articles in this category
          </div>
        ) : (
          filteredArticles.map((article) => (
            <div
              key={article.id}
              style={{
                display: "flex",
                gap: "12px",
                padding: "12px 16px",
                borderBottom: `1px solid ${T.border}`,
                cursor: "pointer",
                transition: "all 0.2s",
                borderLeft: "3px solid transparent",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `rgba(22,45,79,0.5)`; e.currentTarget.style.borderLeftColor = article.topicColor; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderLeftColor = "transparent"; }}
            >
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: article.topicColor, marginTop: "5px", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", color: T.bright, fontWeight: 500, lineHeight: 1.4, marginBottom: "4px" }}>
                  {article.title}
                </div>
                <div style={{ fontSize: "11px", color: T.dim, display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ padding: "2px 7px", borderRadius: "4px", fontSize: "9px", fontWeight: 600, background: article.sourceBadgeColor, color: article.sourceTextColor }}>
                    {article.source}
                  </span>
                  <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{article.recency}</span>
                  {article.impact && <span style={{ color: article.impact === "high" ? T.amber : T.teal }}>
                    {article.impact === "high" ? "★ HIGH" : "✦ FEATURED"}
                  </span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function NotesPanel() {
  const [notes, setNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const recentNotes = await base44.entities.ClinicalNote.list('-updated_date', 6);
        setNotes(recentNotes || []);
      } catch (error) {
        console.error("Failed to load notes:", error);
      } finally {
        setLoading(false);
      }
    };
    loadNotes();
  }, []);

  const statusColorMap = {
    draft: T.dim,
    finalized: T.green,
    amended: T.amber,
  };

  const filteredNotes = notes.filter((note) =>
    note.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (note.patient_id && note.patient_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: "14px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: "13px", color: T.bright, fontWeight: 600, marginBottom: "8px" }}>Recent Notes</div>
        <input
          type="text"
          placeholder="Filter notes…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            background: T.edge,
            border: `1px solid ${T.border}`,
            borderRadius: "8px",
            padding: "8px 12px",
            color: T.text,
            fontSize: "12px",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Notes List */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: "16px", textAlign: "center", color: T.dim, fontSize: "12px" }}>Loading notes...</div>
        ) : filteredNotes.length === 0 ? (
          <div style={{ padding: "16px", textAlign: "center", color: T.dim, fontSize: "12px" }}>No notes found</div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "10px 14px",
                borderBottom: `1px solid ${T.border}`,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onClick={() => window.location.href = `?page=NoteDetail&id=${note.id}`}
              onMouseEnter={(e) => { e.currentTarget.style.background = `rgba(22,45,79,0.5)`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: statusColorMap[note.status] || T.dim, marginTop: "4px", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", color: T.bright, fontWeight: 500, marginBottom: "2px" }}>
                  {note.patient_name}
                </div>
                <div style={{ fontSize: "11px", color: T.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {note.note_type || "Note"} • {note.status}
                </div>
              </div>
              <div style={{ marginLeft: "auto", fontSize: "10px", color: T.dim, fontFamily: "JetBrains Mono, monospace", flexShrink: 0 }}>
                {new Date(note.updated_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Bar */}
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${T.border}`, display: "flex", gap: "8px" }}>
        <button
          onClick={async () => {
            const newNote = await base44.entities.ClinicalNote.create({
              raw_note: "",
              patient_name: "New Patient",
              status: "draft",
            });
            window.location.href = `?page=NoteDetail&id=${newNote.id}`;
          }}
          style={{ flex: 1, padding: "8px", borderRadius: "6px", background: `linear-gradient(135deg, ${T.teal}, ${T.teal2})`, color: T.navy, fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "none" }}
        >
          + New Note
        </button>
        <button 
          onClick={() => window.location.href = "?page=NotesLibrary"}
          style={{ flex: 1, padding: "8px", borderRadius: "6px", background: T.edge, color: T.text, fontSize: "12px", fontWeight: 600, cursor: "pointer", border: `1px solid ${T.border}` }}>
          View All
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => setUser(null));
  }, []);

  return (
    <div style={{ background: T.navy, minHeight: "100vh", width: "100%", fontFamily: "DM Sans, sans-serif" }}>
      <style>{`
        @keyframes clockColon {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
      `}</style>

      {/* Top Bar */}
      <DashboardTopBar user={user} />

      {/* Grid Layout */}
      <div style={{ padding: "18px 20px", paddingTop: "100px", display: "grid", gridTemplateColumns: "280px 1fr 300px", gridTemplateRows: "auto auto 1fr", gap: "14px", alignContent: "start", maxWidth: "100%" }}>
        {/* Welcome Bar - Full Width */}
        <div style={{ gridColumn: "1 / -1" }}>
          <WelcomeBar user={user} />
        </div>

        {/* Clock/Cal - Left */}
        <div style={{ gridColumn: 1, gridRow: "2 / 4" }}>
          <ClockCalPanel />
        </div>

        {/* Search Panel - Center Top */}
        <div style={{ gridColumn: 2, gridRow: 2 }}>
          <SearchPanel />
        </div>

        {/* News Panel - Center Bottom */}
        <div style={{ gridColumn: 2, gridRow: 3 }}>
          <NewsPanel />
        </div>

        {/* Notes Panel - Right */}
        <div style={{ gridColumn: 3, gridRow: "2 / 4" }}>
          <NotesPanel />
        </div>
      </div>
    </div>
  );
}