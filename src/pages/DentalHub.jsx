import { useState } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const PAGES = {
  OVERVIEW: "overview",
  ABSCESS: "abscess",
  TRAUMA: "trauma",
  PAIN: "pain",
  PERICORONITIS: "pericoronitis",
  POSTOP: "postop",
  TRIAGE: "triage",
  PEDS: "peds",
  DISCHARGE: "discharge",
  TMJ: "tmj",
  MIMICS: "mimics",
  SALIVARY: "salivary",
  NOTATION: "notation",
};

const NAV_ITEMS = [
  { id: PAGES.OVERVIEW,     label: "Overview",        icon: "🦷" },
  { id: PAGES.TRIAGE,       label: "Triage Tree",     icon: "🔀" },
  { id: PAGES.ABSCESS,      label: "Abscess / Ludwig's", icon: "🔴" },
  { id: PAGES.TRAUMA,       label: "Dental Trauma",   icon: "⚡" },
  { id: PAGES.PAIN,         label: "Pain & Blocks",   icon: "💉" },
  { id: PAGES.PERICORONITIS,label: "Pericoronitis",   icon: "🔬" },
  { id: PAGES.POSTOP,       label: "Post-Procedure",  icon: "🩹" },
  { id: PAGES.PEDS,         label: "Pediatric",       icon: "👶" },
  { id: PAGES.DISCHARGE,    label: "Discharge",       icon: "📋" },
  { id: PAGES.TMJ,          label: "TMJ Dislocation", icon: "🦴" },
  { id: PAGES.MIMICS,       label: "Pain Mimics",     icon: "❤️" },
  { id: PAGES.SALIVARY,     label: "Salivary Glands", icon: "💧" },
  { id: PAGES.NOTATION,     label: "Tooth Notation",  icon: "🔢" },
];

// ─── STYLES ───────────────────────────────────────────────────────────────────

const S = {
  hub: {
    minHeight: "100vh",
    background: "var(--bg-primary, #0a0e1a)",
    color: "var(--text-primary, #e8eaf6)",
    fontFamily: "'DM Sans', sans-serif",
    padding: "0 0 80px 0",
  },
  header: {
    background: "rgba(15,20,40,0.92)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(100,140,255,0.15)",
    padding: "16px 20px 12px",
    position: "sticky",
    top: 0,
    zIndex: 50,
  },
  headerTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.4rem",
    fontWeight: 700,
    color: "#a8c4ff",
    margin: 0,
    letterSpacing: "0.02em",
  },
  headerSub: {
    fontSize: "0.72rem",
    color: "rgba(168,196,255,0.55)",
    margin: "2px 0 0",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  scrollNav: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    padding: "12px 16px",
    background: "rgba(10,14,26,0.7)",
    borderBottom: "1px solid rgba(100,140,255,0.08)",
    scrollbarWidth: "none",
  },
  navBtn: (active) => ({
    flexShrink: 0,
    padding: "6px 14px",
    borderRadius: 20,
    border: active ? "1px solid rgba(100,160,255,0.6)" : "1px solid rgba(100,140,255,0.15)",
    background: active ? "rgba(60,100,200,0.35)" : "rgba(255,255,255,0.04)",
    color: active ? "#a8c4ff" : "rgba(200,210,240,0.65)",
    fontSize: "0.76rem",
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  }),
  page: {
    padding: "20px 16px",
    maxWidth: 720,
    margin: "0 auto",
  },
  pageTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.3rem",
    color: "#a8c4ff",
    marginBottom: 4,
    fontWeight: 700,
  },
  pageSub: {
    fontSize: "0.78rem",
    color: "rgba(168,196,255,0.5)",
    marginBottom: 20,
    letterSpacing: "0.04em",
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(100,140,255,0.12)",
    borderRadius: 12,
    padding: "14px 16px",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: "0.88rem",
    fontWeight: 700,
    color: "#c8d8ff",
    marginBottom: 8,
    letterSpacing: "0.02em",
  },
  alertRed: {
    background: "rgba(220,50,50,0.12)",
    border: "1px solid rgba(220,80,80,0.3)",
    borderRadius: 10,
    padding: "12px 14px",
    marginBottom: 12,
    fontSize: "0.82rem",
    color: "#ffb3b3",
  },
  alertYellow: {
    background: "rgba(220,180,30,0.1)",
    border: "1px solid rgba(220,180,30,0.25)",
    borderRadius: 10,
    padding: "12px 14px",
    marginBottom: 12,
    fontSize: "0.82rem",
    color: "#ffe08a",
  },
  alertBlue: {
    background: "rgba(60,120,220,0.12)",
    border: "1px solid rgba(80,140,255,0.25)",
    borderRadius: 10,
    padding: "12px 14px",
    marginBottom: 12,
    fontSize: "0.82rem",
    color: "#9dc4ff",
  },
  pill: (color) => ({
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 12,
    fontSize: "0.7rem",
    fontWeight: 600,
    background: color === "red" ? "rgba(220,60,60,0.2)" : color === "yellow" ? "rgba(220,180,30,0.2)" : "rgba(60,120,220,0.2)",
    color: color === "red" ? "#ff9a9a" : color === "yellow" ? "#ffe08a" : "#9dc4ff",
    border: `1px solid ${color === "red" ? "rgba(220,60,60,0.35)" : color === "yellow" ? "rgba(220,180,30,0.3)" : "rgba(60,120,220,0.3)"}`,
    marginRight: 6,
    marginBottom: 4,
  }),
  mono: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.78rem",
    color: "#7dd3fc",
    background: "rgba(0,0,0,0.25)",
    borderRadius: 6,
    padding: "2px 7px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.78rem",
    marginTop: 8,
  },
  th: {
    textAlign: "left",
    padding: "6px 8px",
    background: "rgba(60,100,200,0.2)",
    color: "#a8c4ff",
    fontWeight: 600,
    borderBottom: "1px solid rgba(100,140,255,0.2)",
  },
  td: {
    padding: "6px 8px",
    borderBottom: "1px solid rgba(100,140,255,0.07)",
    color: "#c8d8ff",
    verticalAlign: "top",
  },
  list: {
    margin: "6px 0",
    paddingLeft: 18,
    lineHeight: 1.7,
    fontSize: "0.82rem",
    color: "#c8d8ff",
  },
  divider: {
    border: "none",
    borderTop: "1px solid rgba(100,140,255,0.1)",
    margin: "14px 0",
  },
  overviewGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 20,
  },
  overviewCard: (color) => ({
    background: `rgba(${color},0.08)`,
    border: `1px solid rgba(${color},0.2)`,
    borderRadius: 12,
    padding: "16px",
    cursor: "pointer",
    transition: "all 0.2s",
  }),
  overviewIcon: {
    fontSize: "1.8rem",
    marginBottom: 8,
  },
  overviewLabel: {
    fontSize: "0.84rem",
    fontWeight: 700,
    color: "#c8d8ff",
    marginBottom: 4,
  },
  overviewDesc: {
    fontSize: "0.72rem",
    color: "rgba(168,196,255,0.55)",
    lineHeight: 1.5,
  },
};

// ─── DIAGRAMS ─────────────────────────────────────────────────────────────────

function ToothCrossSectionDiagram() {
  return (
    <svg viewBox="0 0 340 220" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxWidth: 340, display: "block", margin: "0 auto 4px" }}>
      {/* Crown outline */}
      <path d="M100,30 Q110,10 140,15 Q170,8 200,15 Q230,10 240,30 Q255,55 250,90 Q245,115 220,130 Q200,140 170,142 Q140,140 120,130 Q95,115 90,90 Q85,55 100,30Z" fill="rgba(60,100,200,0.08)" stroke="rgba(100,140,255,0.4)" strokeWidth="1.5"/>
      {/* Root left */}
      <path d="M120,130 Q110,155 108,185 Q115,200 125,195 Q132,178 135,155 Q140,142 150,142" fill="rgba(60,100,200,0.06)" stroke="rgba(100,140,255,0.3)" strokeWidth="1.5"/>
      {/* Root right */}
      <path d="M220,130 Q230,155 232,185 Q225,200 215,195 Q208,178 205,155 Q200,142 190,142" fill="rgba(60,100,200,0.06)" stroke="rgba(100,140,255,0.3)" strokeWidth="1.5"/>
      {/* Pulp chamber */}
      <path d="M148,50 Q155,40 170,38 Q185,40 192,50 Q198,65 195,90 Q192,108 182,118 Q176,124 170,125 Q164,124 158,118 Q148,108 145,90 Q142,65 148,50Z" fill="rgba(220,80,80,0.25)" stroke="rgba(220,80,80,0.5)" strokeWidth="1.2"/>
      {/* Root canals */}
      <path d="M158,118 Q152,135 148,160 Q150,175 155,173 Q160,158 162,140 Q165,128 168,125" fill="rgba(220,80,80,0.18)" stroke="rgba(220,80,80,0.4)" strokeWidth="1"/>
      <path d="M182,118 Q188,135 192,160 Q190,175 185,173 Q180,158 178,140 Q175,128 172,125" fill="rgba(220,80,80,0.18)" stroke="rgba(220,80,80,0.4)" strokeWidth="1"/>
      {/* Dentin layer shading */}
      <path d="M110,40 Q120,22 140,20 Q170,14 200,20 Q220,22 230,40 Q242,62 238,92 Q232,118 212,130 Q192,140 170,142 Q148,140 128,130 Q108,118 102,92 Q98,62 110,40Z M148,50 Q155,40 170,38 Q185,40 192,50 Q198,65 195,90 Q192,108 182,118 Q176,124 170,125 Q164,124 158,118 Q148,108 145,90 Q142,65 148,50Z" fill="rgba(220,180,30,0.1)" stroke="none"/>
      {/* Ellis I zone — enamel top */}
      <path d="M120,44 Q140,25 170,20 Q200,25 220,44" fill="none" stroke="rgba(100,180,255,0.8)" strokeWidth="2.5" strokeDasharray="4,3"/>
      {/* Ellis II zone — dentin */}
      <path d="M107,72 Q100,55 110,40 Q120,25 140,20" fill="none" stroke="rgba(220,180,30,0.9)" strokeWidth="2" strokeDasharray="4,3"/>
      <path d="M233,72 Q240,55 230,40 Q220,25 200,20" fill="none" stroke="rgba(220,180,30,0.9)" strokeWidth="2" strokeDasharray="4,3"/>
      {/* Labels */}
      <text x="258" y="36" fontSize="9.5" fill="#9dc4ff" fontFamily="DM Sans,sans-serif" fontWeight="600">ENAMEL</text>
      <text x="258" y="48" fontSize="8.5" fill="rgba(157,196,255,0.6)" fontFamily="DM Sans,sans-serif">Ellis I</text>
      <line x1="230" y1="32" x2="255" y2="35" stroke="rgba(100,180,255,0.5)" strokeWidth="1"/>
      <text x="258" y="76" fontSize="9.5" fill="#ffe08a" fontFamily="DM Sans,sans-serif" fontWeight="600">DENTIN</text>
      <text x="258" y="88" fontSize="8.5" fill="rgba(255,224,138,0.6)" fontFamily="DM Sans,sans-serif">Ellis II</text>
      <line x1="238" y1="68" x2="255" y2="73" stroke="rgba(220,180,30,0.5)" strokeWidth="1"/>
      <text x="258" y="108" fontSize="9.5" fill="#ff9a9a" fontFamily="DM Sans,sans-serif" fontWeight="600">PULP</text>
      <text x="258" y="120" fontSize="8.5" fill="rgba(255,154,154,0.6)" fontFamily="DM Sans,sans-serif">Ellis III</text>
      <line x1="196" y1="82" x2="255" y2="105" stroke="rgba(220,80,80,0.5)" strokeWidth="1"/>
      <text x="36" y="160" fontSize="9" fill="rgba(168,196,255,0.55)" fontFamily="DM Sans,sans-serif">PDL</text>
      <text x="36" y="172" fontSize="9" fill="rgba(168,196,255,0.55)" fontFamily="DM Sans,sans-serif">space</text>
      <line x1="68" y1="165" x2="108" y2="172" stroke="rgba(100,140,255,0.3)" strokeWidth="1"/>
      <text x="60" y="198" fontSize="9" fill="rgba(168,196,255,0.55)" fontFamily="DM Sans,sans-serif">Root</text>
      <text x="55" y="210" fontSize="9" fill="rgba(168,196,255,0.55)" fontFamily="DM Sans,sans-serif">canals</text>
      <line x1="90" y1="200" x2="148" y2="185" stroke="rgba(220,80,80,0.3)" strokeWidth="1"/>
      {/* Title */}
      <text x="170" y="215" fontSize="8.5" fill="rgba(168,196,255,0.4)" fontFamily="DM Sans,sans-serif" textAnchor="middle" letterSpacing="1">TOOTH CROSS SECTION</text>
    </svg>
  );
}

// ─── PAGES ────────────────────────────────────────────────────────────────────

function OverviewPage({ setPage }) {
  const cards = [
    { id: PAGES.ABSCESS, icon: "🔴", label: "Abscess / Ludwig's", desc: "Fascial space infections, airway threat, I&D, antibiotics", color: "220,60,60" },
    { id: PAGES.TRAUMA, icon: "⚡", label: "Dental Trauma", desc: "Ellis fractures, avulsion, luxation, alveolar fracture", color: "220,160,30" },
    { id: PAGES.PAIN, icon: "💉", label: "Pain & Nerve Blocks", desc: "IAN, mental, infraorbital blocks — dosing & landmarks", color: "60,180,100" },
    { id: PAGES.PERICORONITIS, icon: "🔬", label: "Pericoronitis", desc: "Soft tissue infections, ANUG, herpetic stomatitis", color: "60,120,220" },
    { id: PAGES.POSTOP, icon: "🩹", label: "Post-Procedure", desc: "Dry socket, post-extraction bleeding, MRONJ awareness", color: "140,80,220" },
  ];
  return (
    <div style={S.page}>
      <div style={S.pageTitle}>Dental Emergencies</div>
      <div style={S.pageSub}>EMERGENCY MEDICINE REFERENCE · NOTRYA</div>
      <div style={S.alertRed}>
        <strong>⚠️ Airway Threat:</strong> Ludwig's angina, deep space infections, and rapid floor-of-mouth swelling require immediate airway assessment. Secure early — intubation may become impossible.
      </div>
      <div style={S.overviewGrid}>
        {cards.map(c => (
          <div key={c.id} style={S.overviewCard(c.color)} onClick={() => setPage(c.id)}>
            <div style={S.overviewIcon}>{c.icon}</div>
            <div style={S.overviewLabel}>{c.label}</div>
            <div style={S.overviewDesc}>{c.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ ...S.alertBlue, marginBottom: 12 }}>
        <strong>ADA 2019 Antibiotic Decision Rule (ED Context)</strong>
        <div style={{ marginTop: 8, fontSize: "0.79rem", lineHeight: 1.8 }}>
          <div>1. <strong>Systemic signs present?</strong> (fever, trismus, dysphagia, cellulitis, lymphadenopathy)</div>
          <div style={{ paddingLeft: 14 }}>→ Yes: <span style={{ color: "#a8e6cf" }}>Prescribe antibiotics + escalate</span></div>
          <div style={{ paddingLeft: 14 }}>→ No: Continue to step 2</div>
          <div>2. <strong>Definitive dental treatment available now?</strong> (in-office extraction, I&D, RCT)</div>
          <div style={{ paddingLeft: 14 }}>→ Yes (dental office): <span style={{ color: "#ffb3b3" }}>Antibiotics NOT indicated</span> per ADA</div>
          <div style={{ paddingLeft: 14 }}>→ No (ED/after hours): <span style={{ color: "#a8e6cf" }}>Prescribe antibiotics</span> — ED is the safety net</div>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Antibiotic Reference — ED Prescribing</div>
        <div style={{ fontSize: "0.72rem", color: "rgba(168,196,255,0.5)", marginBottom: 8 }}>ADA first-line: Amoxicillin. Augmentin reserved for moderate/failed therapy. (ADA 2019)</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Indication</th>
              <th style={S.th}>First-Line</th>
              <th style={S.th}>PCN Allergy</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Localized abscess — no systemic signs", "Amox 500mg TID × 3–5d", "Clindamycin 300mg TID × 3–5d"],
              ["Abscess + systemic signs / failed amox", "Augmentin 875mg BID × 5–7d", "Clinda 300mg TID + Flagyl 500mg TID"],
              ["Ludwig's angina", "Amp-sulbactam 3g IV q6h", "Clinda 600mg IV q8h + Metro 500mg IV q8h"],
              ["Pericoronitis (moderate–severe)", "Amox 500mg TID × 5d", "Clindamycin 300mg TID × 5d"],
            ].map(([ind, first, pcn], i) => (
              <tr key={i}>
                <td style={S.td}>{ind}</td>
                <td style={S.td}><span style={S.mono}>{first}</span></td>
                <td style={S.td}><span style={{ ...S.mono, color: "#ffa8a8" }}>{pcn}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ fontSize: "0.72rem", color: "#ffe08a", marginTop: 10 }}>
          ⚠️ Clindamycin resistance increasing — use only when amoxicillin contraindicated. Follow up with dentist within <strong>7 days</strong> (ADA DQA quality metric).
        </div>
      </div>
    </div>
  );
}

function AbscessPage() {
  const [tab, setTab] = useState("types");
  return (
    <div style={S.page}>
      <div style={S.pageTitle}>Abscess & Deep Space Infections</div>
      <div style={S.pageSub}>FASCIAL SPACE SPREAD · AIRWAY RISK · MANAGEMENT</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[["types","Abscess Types"],["ludwigs","Ludwig's Angina"],["management","Management"],["abx","Antibiotics"]].map(([id,label]) => (
          <button key={id} style={S.navBtn(tab===id)} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      {tab === "types" && (
        <>
          {[
            { title: "Dentoalveolar (Periapical) Abscess", color: "red", items: ["Origin: pulpal necrosis → periapical spread", "Tender to percussion, localized swelling", "Fluctuant = I&D; non-fluctuant = antibiotics + referral", "Most common ED dental infection"] },
            { title: "Periodontal Abscess", color: "yellow", items: ["Origin: gingival pocket — vital tooth", "Swelling adjacent to tooth, bleeding gums", "Irrigation + antibiotics + dental referral", "Distinguish from periapical: vitality testing, X-ray"] },
            { title: "Pericoronal Abscess", color: "yellow", items: ["Around erupting/impacted tooth (usually wisdom tooth)", "Trismus, difficulty swallowing, bad taste", "Irrigation, antibiotics, OMFS referral if severe", "Can progress to deep space infection"] },
            { title: "Deep Space Infection", color: "red", items: ["Submandibular, sublingual, submental, masticator, parapharyngeal", "Rapid spread across fascial planes", "Airway compromise risk — do NOT delay imaging", "CT neck with contrast: evaluate extent", "IV antibiotics + urgent OMFS/ENT"] },
          ].map((item) => (
            <div key={item.title} style={item.color === "red" ? S.alertRed : S.alertYellow}>
              <strong>{item.title}</strong>
              <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                {item.items.map((i, idx) => <li key={idx}>{i}</li>)}
              </ul>
            </div>
          ))}
        </>
      )}
      {tab === "ludwigs" && (
        <>
          <div style={S.alertRed}>
            <strong>⚠️ AIRWAY EMERGENCY</strong> — Ludwig's Angina is bilateral submandibular/sublingual/submental cellulitis. Do NOT wait for fluctuance. Intubation may become impossible as edema progresses.
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}>Diagnostic Criteria</div>
            <ul style={S.list}>
              <li>Bilateral involvement of submandibular + sublingual spaces</li>
              <li>Gangrenous serosanguinous infiltration (not frank pus)</li>
              <li>Connective tissue, fascia, muscle involvement — NOT glandular</li>
              <li>Spread by continuity, NOT lymphatics</li>
            </ul>
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}>Airway Threat Staging</div>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Stage</th><th style={S.th}>Signs</th><th style={S.th}>Action</th></tr></thead>
              <tbody>
                {[
                  ["Stage 1", "Submandibular swelling, normal speech", "IV abx, monitor, early OMFS/ENT consult"],
                  ["Stage 2", "Floor-of-mouth elevation, muffled voice, drooling", "Anesthesia at bedside, prepare for difficult airway"],
                  ["Stage 3", "Stridor, inability to swallow, neck rigidity", "Emergent awake fiberoptic or surgical airway"],
                ].map(([s, signs, act], i) => (
                  <tr key={i}><td style={S.td}>{s}</td><td style={S.td}>{signs}</td><td style={S.td}>{act}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}>Workup</div>
            <ul style={S.list}>
              <li><strong>CT Neck with contrast</strong> — evaluate extent, identify drainable collections</li>
              <li>CBC, BMP, blood cultures ×2 before antibiotics</li>
              <li>Lateral soft tissue neck X-ray if CT unavailable</li>
              <li>Dental panoramic X-ray (Panorex) — identify source tooth</li>
            </ul>
          </div>
          <div style={S.alertBlue}>
            <strong>Airway Pearl:</strong> Consider early awake nasal fiberoptic intubation. RSI risks complete airway loss if laryngoscopy fails in the setting of trismus and floor-of-mouth induration.
          </div>
        </>
      )}
      {tab === "management" && (
        <>
          <div style={S.card}>
            <div style={S.cardTitle}>I&D Indications</div>
            <ul style={S.list}>
              <li>Fluctuant abscess on exam</li>
              <li>CT-confirmed drainable collection</li>
              <li>No improvement on antibiotics 24–48h</li>
              <li>Intraoral I&D if accessible (mucosal approach)</li>
            </ul>
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}>Intraoral I&D Technique</div>
            <ul style={S.list}>
              <li>Topical benzocaine gel 20% → local infiltration</li>
              <li>Nick with #11 blade at point of maximal fluctuance</li>
              <li>Curved hemostat — spread to break loculations</li>
              <li>Pack with iodoform gauze if cavity &gt;1cm</li>
              <li>Rinse: chlorhexidine 0.12% or warm saline</li>
              <li>Re-check in 24–48h; <strong>dental follow-up within 7 days</strong> (ADA DQA quality metric)</li>
            </ul>
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}>Antibiotics-Only Criteria</div>
            <ul style={S.list}>
              <li>Non-fluctuant cellulitis (no drainable collection)</li>
              <li>Immunocompetent, non-toxic appearance</li>
              <li>No trismus, dysphagia, or voice change</li>
              <li>Early infection without fascial space spread</li>
            </ul>
          </div>
          <div style={S.alertYellow}>
            <strong>Admission Criteria:</strong> Trismus, dysphagia, floor-of-mouth involvement, fever &gt;39°C, immunocompromised, failed outpatient antibiotics, inability to take PO, deep space infection on CT.
          </div>
        </>
      )}
      {tab === "abx" && (
        <>
          <div style={S.alertBlue}>
            <strong>ADA 2019 Antibiotic Stewardship — ED Decision Framework</strong>
            <div style={{ marginTop: 8, lineHeight: 1.9 }}>
              <div>• <strong>Systemic signs</strong> (fever, trismus, dysphagia, cellulitis) → antibiotics indicated regardless</div>
              <div>• <strong>Localized abscess, no systemic signs</strong> → ADA recommends antibiotics only if definitive dental treatment unavailable</div>
              <div>• <strong>ED = "treatment unavailable" context</strong> → prescribe + ensure 7-day dental follow-up (ADA DQA metric)</div>
              <div>• <strong>Immunocompromised</strong> → lower threshold; prescribe antibiotics for any dental infection</div>
            </div>
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}>Outpatient — Tiered by Severity</div>
            <div style={{ fontSize: "0.72rem", color: "rgba(168,196,255,0.5)", marginBottom: 8 }}>ADA first-line: Amoxicillin. Reserve Augmentin for moderate severity or amox treatment failure.</div>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Tier</th><th style={S.th}>Drug</th><th style={S.th}>Dose</th><th style={S.th}>Duration</th></tr></thead>
              <tbody>
                {[
                  ["1st — simple abscess","Amoxicillin (ADA preferred)","500mg PO TID","3–5 days"],
                  ["1st alt — PCN allergy","Clindamycin†","300mg PO TID","3–5 days"],
                  ["2nd — mod/failed amox","Amox-Clavulanate (Augmentin)","875/125mg PO BID","5–7 days"],
                  ["Adjunct (anaerobes)","Metronidazole + Amox","500mg PO TID each","5–7 days"],
                ].map(([tier,d,dose,dur],i) => (
                  <tr key={i}><td style={{ ...S.td, color: "#88aadd", fontSize: "0.74rem" }}>{tier}</td><td style={S.td}>{d}</td><td style={S.td}><span style={S.mono}>{dose}</span></td><td style={S.td}>{dur}</td></tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontSize: "0.72rem", color: "#ffe08a", marginTop: 8 }}>† Clindamycin resistance increasing vs oral anaerobes — use only when amoxicillin truly contraindicated.</div>
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}>Inpatient / Severe / Ludwig's — IV</div>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Drug</th><th style={S.th}>Dose</th></tr></thead>
              <tbody>
                {[
                  ["Ampicillin-Sulbactam (Unasyn)", "3g IV q6h"],
                  ["Piperacillin-Tazobactam (Zosyn)", "3.375g IV q6h"],
                  ["Clindamycin (PCN allergy)", "600–900mg IV q8h"],
                  ["Metronidazole + Ceftriaxone", "Metro 500mg IV q8h + CTX 1g IV q24h"],
                  ["Vancomycin (MRSA concern)", "15–20mg/kg IV q8–12h"],
                ].map(([d,dose],i) => (
                  <tr key={i}><td style={S.td}>{d}</td><td style={S.td}><span style={S.mono}>{dose}</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={S.alertYellow}>
            <strong>Opioid Stewardship:</strong> Dental pain — prescribe NSAIDs + APAP combination first. NIDCR data (2025) confirms opioid dental prescriptions declining in EDs; antibiotic stewardship still lags. Document indication if prescribing either.
          </div>
        </>
      )}
    </div>
  );
}

function TraumaPage() {
  const [tab, setTab] = useState("ellis");
  return (
    <div style={S.page}>
      <div style={S.pageTitle}>Dental Trauma</div>
      <div style={S.pageSub}>FRACTURES · AVULSION · LUXATION · ALVEOLAR</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[["ellis","Ellis Fractures"],["avulsion","Avulsion"],["luxation","Luxation"],["alveolar","Alveolar Fx"]].map(([id,label]) => (
          <button key={id} style={S.navBtn(tab===id)} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      {tab === "ellis" && (
        <>
          <div style={S.alertBlue}>Crown fractures are classified by the Ellis system. Management depends on pulp involvement and whether the tooth is primary or permanent.</div>
          <div style={{ ...S.card, padding: "12px 10px 8px" }}>
            <div style={{ ...S.cardTitle, marginBottom: 6 }}>Tooth Anatomy — Ellis Fracture Zones</div>
            <ToothCrossSectionDiagram />
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 4, fontSize: "0.7rem" }}>
              <span style={{ color: "#9dc4ff" }}>■ Class I — Enamel</span>
              <span style={{ color: "#ffe08a" }}>■ Class II — Dentin</span>
              <span style={{ color: "#ff9a9a" }}>■ Class III — Pulp</span>
            </div>
          </div>
          {[
            { cls: "Ellis Class I", sub: "Enamel Only", color: "alertBlue", tx: ["No pulp or dentin exposed","Smooth sharp edges with emery board","Dental follow-up non-urgent (1–2 weeks)","Cosmetic repair by dentist"] },
            { cls: "Ellis Class II", sub: "Enamel + Dentin", color: "alertYellow", tx: ["Yellow/cream dentin visible","Sensitive to air/cold","Cover with calcium hydroxide paste (Dycal) or zinc oxide","Dental follow-up within 24h","Primary teeth: non-vital → extraction consideration"] },
            { cls: "Ellis Class III", sub: "Enamel + Dentin + Pulp", color: "alertRed", tx: ["Pink/red pulp exposure or frank bleeding","Severe pain","Cover with moist cotton + calcium hydroxide paste","Urgent dental/endodontic referral same day","Risk: pulp necrosis, abscess if untreated >24h"] },
          ].map(({ cls, sub, color, tx }) => (
            <div key={cls} style={S[color]}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <strong>{cls}</strong><span style={S.pill(color === "alertRed" ? "red" : color === "alertYellow" ? "yellow" : "blue")}>{sub}</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>{tx.map((t,i) => <li key={i}>{t}</li>)}</ul>
            </div>
          ))}
          <div style={S.card}>
            <div style={S.cardTitle}>Primary vs Permanent Tooth Rule</div>
            <ul style={S.list}>
              <li><strong>Primary (baby) teeth:</strong> More conservative — often observation or extraction to protect developing permanent tooth below</li>
              <li><strong>Permanent teeth:</strong> Aggressive preservation — every attempt to save tooth structure</li>
              <li>Age 6–12: mixed dentition — verify tooth type before management</li>
            </ul>
          </div>
        </>
      )}
      {tab === "avulsion" && (
        <>
          <div style={S.alertRed}><strong>Time-Critical:</strong> Reimplantation within 30 min = best prognosis. After 60 min dry time, prognosis is poor due to PDL cell death.</div>
          <div style={S.card}>
            <div style={S.cardTitle}>Storage Media (Best → Worst)</div>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Medium</th><th style={S.th}>Viability</th><th style={S.th}>Notes</th></tr></thead>
              <tbody>
                {[
                  ["Hank's Balanced Salt Solution (HBSS)", "Up to 6h", "Best — Save-A-Tooth kit"],
                  ["Cold whole milk", "Up to 3h", "Best widely available option"],
                  ["Saline", "Up to 1h", "Acceptable if no milk"],
                  ["Patient's saliva (buccal vestibule)", "20–30 min", "Risk of contamination"],
                  ["Water", "<1h", "Hypotonic — damages PDL cells"],
                  ["Dry transport", "<5 min", "Worst — minimizes immediately"],
                ].map(([m,v,n],i) => <tr key={i}><td style={S.td}>{m}</td><td style={S.td}>{v}</td><td style={S.td}>{n}</td></tr>)}
              </tbody>
            </table>
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}>Reimplantation Protocol</div>
            <ul style={S.list}>
              <li>Handle by crown — do NOT touch root surface</li>
              <li>Rinse gently with saline (do NOT scrub root)</li>
              <li>Local anesthesia: inferior alveolar or infiltration block</li>
              <li>Irrigate socket with saline — remove clot</li>
              <li>Insert tooth with gentle digital pressure</li>
              <li>Verify position clinically and with X-ray</li>
              <li>Flexible splint 7–14 days (<strong>dental follow-up within 24–48h; dentist check at 7 days</strong>)</li>
              <li>Antibiotics: Doxycycline 100mg BID × 7d or Amox 500mg TID × 7d</li>
              <li>Tetanus prophylaxis if soil contamination</li>
            </ul>
          </div>
          <div style={S.alertYellow}><strong>Primary Tooth Avulsion:</strong> Do NOT reimplant primary teeth — risk of damage to developing permanent tooth bud below.</div>
        </>
      )}
      {tab === "luxation" && (
        <>
          <div style={S.card}>
            <div style={S.cardTitle}>Luxation Types & Management</div>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Type</th><th style={S.th}>Description</th><th style={S.th}>ED Management</th></tr></thead>
              <tbody>
                {[
                  ["Concussion","Trauma without displacement; tender to percussion","Soft diet 2wk; dental f/u 1wk"],
                  ["Subluxation","Loosened but not displaced; abnormal mobility","Soft diet; flexible splint if mobile; dental 24–48h"],
                  ["Extrusive Luxation","Partially displaced out of socket (elongated)","Reposition + splint; urgent dental f/u"],
                  ["Lateral Luxation","Displaced laterally; alveolar bone fracture likely","Reposition under local anesthesia; rigid splint 4wk"],
                  ["Intrusive Luxation","Forced into socket — most severe","Do NOT reposition in ED; urgent OMFS; orthodontic extrusion"],
                ].map(([t,d,m],i) => <tr key={i}><td style={S.td}>{t}</td><td style={S.td}>{d}</td><td style={S.td}>{m}</td></tr>)}
              </tbody>
            </table>
          </div>
          <div style={S.alertBlue}><strong>Splinting:</strong> Flexible splints (wire + composite) preferred over rigid for most luxations. Rigid splints only for alveolar fractures or severe lateral luxations. Duration: 2–4 weeks depending on type.</div>
        </>
      )}
      {tab === "alveolar" && (
        <>
          <div style={S.card}>
            <div style={S.cardTitle}>Alveolar Fracture Recognition</div>
            <ul style={S.list}>
              <li>Segment of teeth move together as a unit (pathognomonic)</li>
              <li>Occlusal abnormality — teeth don't meet properly</li>
              <li>Step-off palpable along alveolar ridge</li>
              <li>Confirm with dental X-ray or panoramic view</li>
            </ul>
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}>Management</div>
            <ul style={S.list}>
              <li>Manually reposition fragment into normal alignment</li>
              <li>Rigid splint spanning 2 teeth beyond fracture on each side</li>
              <li>Duration: 4–6 weeks</li>
              <li>Antibiotics: Amoxicillin 500mg TID × 7 days</li>
              <li>Urgent OMFS follow-up — operative fixation may be needed</li>
              <li>Evaluate for concomitant mandible/maxilla fracture</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function PainPage() {
  const [tab, setTab] = useState("blocks");
  return (
    <div style={S.page}>
      <div style={S.pageTitle}>Pain Management & Nerve Blocks</div>
      <div style={S.pageSub}>REGIONAL ANESTHESIA · ANALGESICS · DRY SOCKET</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[["blocks","Nerve Blocks"],["dosing","Drug Dosing"],["drysocket","Dry Socket"],["analgesics","Analgesics"]].map(([id,label]) => (
          <button key={id} style={S.navBtn(tab===id)} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      {tab === "blocks" && (
        <>
          {[
            { name: "Inferior Alveolar Nerve Block (IAN)", covers: "Lower molar, premolar, anterior teeth (ipsilateral), lower lip, chin", technique: ["Open mouth wide — visualize pterygomandibular raphe","Needle insertion: medial to ramus, 1cm above occlusal plane at raphe","Advance 20–25mm; aspirate; inject 1.5–2mL slowly","Covers entire ipsilateral mandibular dentition","Onset: 3–5 minutes"] },
            { name: "Mental Nerve Block", covers: "Lower premolars, lower lip, chin (ipsilateral)", technique: ["Palpate mental foramen: between premolars at mid-root level","Intraoral: enter at depth of vestibule between premolars","Advance toward foramen; do NOT enter foramen","Inject 1–2mL; onset 2–3 min","Extraoral: inject just inferior to foramen from skin"] },
            { name: "Infraorbital Nerve Block", covers: "Upper anterior teeth, upper lip, lateral nose, lower eyelid", technique: ["Palpate infraorbital foramen: 1cm below orbital rim, midpupillary line","Intraoral approach: retract upper lip, enter vestibule at upper premolar","Advance toward foramen superiorly; aspirate","Inject 1–1.5mL slowly","Apply pressure over injection site 1 min"] },
            { name: "Posterior Superior Alveolar (PSA) Block", covers: "Upper molars (except MB root of first molar)", technique: ["Retract cheek — identify maxillary tuberosity","Needle at 45° to occlusal plane, directed superiorly-posteriorly-medially","Advance 16mm along tuberosity — small risk of pterygoid plexus hematoma","Aspirate carefully; inject 1.5–2mL","Avoid in patients on anticoagulants if possible"] },
          ].map(({ name, covers, technique }) => (
            <div key={name} style={S.card}>
              <div style={S.cardTitle}>{name}</div>
              <div style={{ fontSize: "0.76rem", color: "#88aadd", marginBottom: 8 }}><strong>Covers:</strong> {covers}</div>
              <ul style={S.list}>{technique.map((t,i) => <li key={i}>{t}</li>)}</ul>
            </div>
          ))}
        </>
      )}
      {tab === "dosing" && (
        <>
          <div style={S.card}>
            <div style={S.cardTitle}>Local Anesthetic Dosing</div>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Agent</th><th style={S.th}>Concentration</th><th style={S.th}>Max Dose</th><th style={S.th}>Duration</th></tr></thead>
              <tbody>
                {[
                  ["Lidocaine 2%","1.8mL/cartridge","4.4mg/kg (plain) / 7mg/kg (epi)","1–2h (plain) / 3–4h (epi)"],
                  ["Lidocaine 2% + Epi 1:100k","1.8mL/cartridge","7mg/kg","3–5h"],
                  ["Bupivacaine 0.5%","Various","2.5mg/kg (plain) / 3mg/kg (epi)","4–8h"],
                  ["Mepivacaine 3%","1.8mL/cartridge","4.4mg/kg","45–90 min"],
                ].map(([a,c,m,d],i) => <tr key={i}><td style={S.td}>{a}</td><td style={S.td}>{c}</td><td style={S.td}><span style={S.mono}>{m}</span></td><td style={S.td}>{d}</td></tr>)}
              </tbody>
            </table>
          </div>
          <div style={S.alertYellow}><strong>Epinephrine Contraindications:</strong> Use plain lidocaine for end-arteries (digits, nose tip, penis, ear). Relative: uncontrolled HTN, cocaine use in past 24h, pheochromocytoma. Low-dose epi (1:200,000) is safe for dental blocks in most patients including cardiac history.</div>
        </>
      )}
      {tab === "drysocket" && (
        <>
          <div style={S.card}>
            <div style={S.cardTitle}>Alveolar Osteitis (Dry Socket)</div>
            <ul style={S.list}>
              <li><strong>Onset:</strong> 3–5 days post-extraction</li>
              <li><strong>Mechanism:</strong> Loss of blood clot → bare exposed bone</li>
              <li><strong>Classic presentation:</strong> Severe throbbing pain radiating to ear/jaw, empty socket, bad taste/odor</li>
              <li><strong>Risk factors:</strong> Smoking, oral contraceptives, poor hygiene, traumatic extraction</li>
            </ul>
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}>ED Treatment</div>
            <ul style={S.list}>
              <li>Irrigate socket with warm saline via curved-tip syringe</li>
              <li>Pack with iodoform gauze + eugenol (zinc oxide eugenol paste or Alvogyl packing)</li>
              <li>Repack every 1–3 days until symptoms resolve (dentist follow-up)</li>
              <li>NSAIDs ± short opioid course (3–5 days max)</li>
              <li>Chlorhexidine 0.12% rinse BID</li>
              <li>Antibiotics generally NOT indicated unless signs of infection</li>
            </ul>
          </div>
        </>
      )}
      {tab === "analgesics" && (
        <>
          <div style={S.card}>
            <div style={S.cardTitle}>Analgesic Ladder — Dental Pain</div>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Step</th><th style={S.th}>Agent</th><th style={S.th}>Dose</th></tr></thead>
              <tbody>
                {[
                  ["1st line","Ibuprofen","600–800mg PO q6–8h with food"],
                  ["1st line (combo)","Ibuprofen + Acetaminophen","Ibu 400mg + APAP 500mg q6h"],
                  ["2nd line","Ketorolac (ED use)","30mg IV/IM or 20mg intranasal"],
                  ["2nd line","Naproxen","500mg PO BID"],
                  ["Adjunct","Dexamethasone","0.1mg/kg IV/PO — reduces dental pain swelling"],
                  ["Opioid (last resort)","Oxycodone 5mg or Tramadol 50mg","q4–6h × 3 days max — only if severe, no contraindication"],
                ].map(([s,a,d],i) => <tr key={i}><td style={S.td}>{s}</td><td style={S.td}>{a}</td><td style={S.td}><span style={S.mono}>{d}</span></td></tr>)}
              </tbody>
            </table>
          </div>
          <div style={S.alertBlue}><strong>Combination NSAIDs + APAP</strong> is as effective as opioids for dental pain and is preferred. Document opioid stewardship rationale if prescribing narcotics for dental complaints.</div>
        </>
      )}
    </div>
  );
}

function PericoronitisPage() {
  return (
    <div style={S.page}>
      <div style={S.pageTitle}>Pericoronitis & Soft Tissue Infections</div>
      <div style={S.pageSub}>PERICORONITIS · ANUG · HERPETIC STOMATITIS</div>
      <div style={S.card}>
        <div style={S.cardTitle}>Pericoronitis — Grading & Management</div>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Grade</th><th style={S.th}>Features</th><th style={S.th}>Treatment</th></tr></thead>
          <tbody>
            {[
              ["Mild","Localized pain, slight swelling of operculum, no systemic signs","Irrigation under operculum (chlorhexidine/saline), analgesics, dental f/u"],
              ["Moderate","Pain radiating to ear/throat, mild trismus, cervical lymphadenopathy","Above + Amoxicillin 500mg TID × 5d or Clindamycin 300mg TID × 5d"],
              ["Severe","High fever, severe trismus, dysphagia, facial swelling, floor-of-mouth involvement","Admit, IV antibiotics, OMFS consultation, airway monitoring"],
            ].map(([g,f,t],i) => <tr key={i}><td style={S.td}>{g}</td><td style={S.td}>{f}</td><td style={S.td}>{t}</td></tr>)}
          </tbody>
        </table>
      </div>
      <div style={S.alertYellow}><strong>Pericoronitis Irrigation Technique:</strong> Curved blunt-tip syringe under gingival flap (operculum) of partially erupted wisdom tooth. Flush with chlorhexidine 0.12% or warm saline. Can provide immediate relief.</div>
      <hr style={S.divider} />
      <div style={S.card}>
        <div style={S.cardTitle}>Acute Necrotizing Ulcerative Gingivitis (ANUG / Vincent's Angina / Trench Mouth)</div>
        <ul style={S.list}>
          <li><strong>Classic triad:</strong> Painful ulcerated gingival papillae, spontaneous bleeding, fetid breath</li>
          <li>Punched-out "cratered" interdental papillae with pseudomembrane</li>
          <li>Fever, malaise, cervical lymphadenopathy</li>
          <li><strong>Risk factors:</strong> Stress, smoking, malnutrition, HIV/immunosuppression</li>
        </ul>
        <div style={{ ...S.cardTitle, marginTop: 10 }}>Treatment</div>
        <ul style={S.list}>
          <li>Metronidazole 500mg PO TID × 7 days (drug of choice)</li>
          <li>Amoxicillin 500mg TID × 7 days as alternative</li>
          <li>Chlorhexidine 0.12% rinse BID</li>
          <li>Analgesics (NSAIDs preferred)</li>
          <li>Dental follow-up within 48–72h for debridement</li>
          <li>Consider HIV testing if recurrent or severe</li>
        </ul>
      </div>
      <hr style={S.divider} />
      <div style={S.card}>
        <div style={S.cardTitle}>Primary Herpetic Gingivostomatitis</div>
        <ul style={S.list}>
          <li>HSV-1 primary infection — typically children, young adults</li>
          <li>Prodrome: fever, malaise, cervical adenopathy</li>
          <li>Multiple vesicles → ulcers on keratinized gingiva AND movable mucosa</li>
          <li>Distinguish from aphthous: herpes involves attached gingiva</li>
        </ul>
        <div style={{ marginTop: 8 }}>
          <span style={S.pill("blue")}>Acyclovir 400mg PO 5×/day × 7d</span>
          <span style={S.pill("blue")}>Or Valacyclovir 1g BID × 7d</span>
          <span style={S.pill("yellow")}>Supportive: Fluids, APAP/NSAIDs, viscous lidocaine rinse</span>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Aphthous Ulcers (Canker Sores)</div>
        <ul style={S.list}>
          <li>Round/oval ulcers with gray-white base and erythematous halo</li>
          <li>Only on movable (non-keratinized) mucosa — not gingiva/hard palate</li>
          <li>Minor (&lt;1cm): self-limited 7–14 days</li>
          <li>Major (&gt;1cm): may scar, 6+ weeks healing</li>
          <li><strong>Treatment:</strong> Triamcinolone paste 0.1% (Kenalog) TID-QID, Magic Mouthwash (viscous lidocaine + Benadryl + Maalox), dexamethasone elixir swish-spit</li>
        </ul>
      </div>
    </div>
  );
}

function PostopPage() {
  return (
    <div style={S.page}>
      <div style={S.pageTitle}>Post-Procedure Complications</div>
      <div style={S.pageSub}>BLEEDING · DRY SOCKET · MRONJ · OSTEOMYELITIS</div>
      <div style={S.card}>
        <div style={S.cardTitle}>Post-Extraction Bleeding — Management Steps</div>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Step</th><th style={S.th}>Intervention</th></tr></thead>
          <tbody>
            {[
              ["1","Clear clot — irrigate socket with saline"],
              ["2","Gauze pressure × 20–30 min (bite down firmly)"],
              ["3","Topical thrombin-soaked gelfoam into socket"],
              ["4","Suture figure-of-eight over socket if persistent"],
              ["5","Absorbable gelatin sponge (Gelfoam) ± oxidized cellulose (Surgicel)"],
              ["6","Tranexamic acid 500mg PO or apply 5% tranexamic acid–soaked gauze"],
              ["7","Check INR/anticoagulation status — consider reversal agents if supratherapeutic"],
              ["8","Oral surgery consult if uncontrolled after above"],
            ].map(([s,i]) => <tr key={s}><td style={{ ...S.td, color: "#a8c4ff", fontWeight: 700 }}>{s}</td><td style={S.td}>{i}</td></tr>)}
          </tbody>
        </table>
      </div>
      <div style={S.alertYellow}><strong>Anticoagulated Patients:</strong> Most dental procedures can proceed without stopping anticoagulation with local hemostasis. INR &lt;3.5 is generally acceptable. Avoid stopping anticoagulation for minor dental extractions — thromboembolism risk outweighs dental bleeding risk in most patients.</div>
      <hr style={S.divider} />
      <div style={S.card}>
        <div style={S.cardTitle}>MRONJ — Medication-Related Osteonecrosis of the Jaw</div>
        <div style={S.alertRed} style={{ margin: "8px 0" }}>
          <strong>Risk Drugs:</strong> Bisphosphonates (alendronate, zoledronic acid), Denosumab (Prolia/Xgeva), Bevacizumab, Sunitinib, Steroids long-term
        </div>
        <ul style={S.list}>
          <li><strong>Definition:</strong> Exposed necrotic bone in jaw &gt;8 weeks, on antiresorptive/antiangiogenic therapy, no radiation history</li>
          <li>Stage 0: Tooth pain, unexplained odontalgia, sinus symptoms — no exposed bone</li>
          <li>Stage 1: Exposed/necrotic bone, asymptomatic, no infection</li>
          <li>Stage 2: Exposed bone + pain + infection</li>
          <li>Stage 3: Exposed bone extending beyond alveolar — pathologic fracture, fistula, osteolysis</li>
        </ul>
        <div style={{ ...S.cardTitle, marginTop: 10 }}>ED Role</div>
        <ul style={S.list}>
          <li>Do NOT debride or attempt sequestrectomy in ED</li>
          <li>Antibiotics if infection: Amoxicillin 500mg TID or Clindamycin 300mg TID</li>
          <li>Chlorhexidine 0.12% rinse BID</li>
          <li>Pain management (NSAIDs + APAP)</li>
          <li>Urgent OMFS referral — do NOT refer to general dentist alone</li>
        </ul>
      </div>
      <hr style={S.divider} />
      <div style={S.card}>
        <div style={S.cardTitle}>Post-Op Infection vs Normal Healing</div>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Feature</th><th style={S.th}>Normal</th><th style={S.th}>Infection</th></tr></thead>
          <tbody>
            {[
              ["Pain","Peaks 24–48h, improves after","Worsens after day 3–4 or plateaus"],
              ["Swelling","Peaks 48–72h, resolves","Persistent or increasing after day 3"],
              ["Fever","Low-grade 24–48h","&gt;38.5°C after 48h"],
              ["Discharge","Slight serosanguinous","Purulent, foul-smelling"],
              ["Trismus","Mild if near wisdom tooth","Progressive worsening"],
            ].map(([f,n,i]) => <tr key={f}><td style={S.td}>{f}</td><td style={S.td}>{n}</td><td style={{ ...S.td, color: "#ffb3b3" }}>{i}</td></tr>)}
          </tbody>
        </table>
      </div>
      <div style={S.alertBlue}>
        <strong>ADA Antibiotic Prophylaxis Reminder:</strong> ADA recommends prophylaxis only for patients with specific cardiac conditions (per AHA) or certain immunocompromising conditions before dental procedures. It is NOT indicated for prosthetic joints (2024 AAOS guidance). If asked to prescribe prophylaxis in the ED before a dental procedure, verify the indication is evidence-based — 67% of dental prophylaxis prescriptions in a recent VA study were not indicated.
      </div>
      <div style={{ ...S.alertBlue, background: "rgba(40,200,120,0.08)", border: "1px solid rgba(40,200,120,0.2)", color: "#a8e6cf" }}>
        <strong>📅 Discharge Standard — All Dental Complaints:</strong> Instruct every patient to follow up with a dentist within <strong>7 days</strong>. This is an ADA Dental Quality Alliance (DQA) quality measure tracked by payers. Document the referral instruction in your note.
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Infective Endocarditis Prophylaxis — AHA/ADA</div>
        <div style={{ fontSize: "0.76rem", color: "rgba(168,196,255,0.55)", marginBottom: 8 }}>Prophylaxis indicated ONLY before invasive dental procedures in these cardiac conditions:</div>
        <ul style={S.list}>
          <li>Prosthetic cardiac valve (mechanical or bioprosthetic)</li>
          <li>Prior infective endocarditis</li>
          <li>Unrepaired cyanotic congenital heart disease (including palliative shunts)</li>
          <li>Repaired CHD with residual defects at/adjacent to prosthetic material</li>
          <li>Cardiac transplant with valvulopathy</li>
        </ul>
        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#c8d8ff", margin: "10px 0 4px" }}>Regimen</div>
        <ul style={S.list}>
          <li>Amoxicillin <span style={S.mono}>2g PO</span> 30–60 min before procedure</li>
          <li>PCN allergy: Clindamycin <span style={S.mono}>600mg PO</span> or Azithromycin <span style={S.mono}>500mg PO</span></li>
          <li>Unable to take PO: Ampicillin <span style={S.mono}>2g IV/IM</span> within 30 min before</li>
        </ul>
        <div style={{ background: "rgba(220,60,60,0.1)", border: "1px solid rgba(220,60,60,0.25)", borderRadius: 8, padding: "8px 10px", marginTop: 8, fontSize: "0.76rem", color: "#ffb3b3" }}>
          <strong>NOT indicated for:</strong> Prosthetic joints, diabetes, MVP without regurgitation, prior CABG, pacemakers. 67% of dental prophylaxis prescriptions in a recent VA study were not indicated per AHA/ADA.
        </div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Osteomyelitis of the Jaw — Red Flags</div>
        <ul style={S.list}>
          <li>Deep bone pain unresponsive to antibiotics</li>
          <li>Paresthesia of lower lip (inferior alveolar nerve involvement)</li>
          <li>Pathologic fracture, sinus tract</li>
          <li>Panorex: moth-eaten bone pattern, sequestrum</li>
          <li>CT jaw: cortical destruction, periosteal reaction</li>
          <li>Treatment: IV antibiotics 6+ weeks, surgical debridement — OMFS/Infectious Disease</li>
        </ul>
      </div>
    </div>
  );
}

function TriagePage({ setPage }) {
  const Box = ({ children, color = "rgba(100,140,255,0.12)", border = "rgba(100,140,255,0.2)" }) => (
    <div style={{ background: color, border: `1px solid ${border}`, borderRadius: 8, padding: "8px 12px", fontSize: "0.79rem", color: "#c8d8ff", lineHeight: 1.6 }}>{children}</div>
  );
  const Arrow = () => <div style={{ textAlign: "center", color: "rgba(168,196,255,0.4)", fontSize: "1.1rem", margin: "2px 0" }}>↓</div>;
  const Branch = ({ left, right, leftColor, rightColor }) => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "2px 0" }}>
      <div style={{ background: leftColor || "rgba(220,60,60,0.12)", border: "1px solid rgba(220,60,60,0.3)", borderRadius: 8, padding: "8px 10px", fontSize: "0.76rem", color: "#ffb3b3" }}>{left}</div>
      <div style={{ background: rightColor || "rgba(60,180,100,0.1)", border: "1px solid rgba(60,180,100,0.25)", borderRadius: 8, padding: "8px 10px", fontSize: "0.76rem", color: "#a8e6cf" }}>{right}</div>
    </div>
  );
  return (
    <div style={S.page}>
      <div style={S.pageTitle}>Dental Triage Decision Tree</div>
      <div style={S.pageSub}>CHIEF COMPLAINT → ACUITY → PATHWAY</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[["pain","Tooth Pain"],["trauma","Trauma"],["swelling","Swelling"],["postop","Post-Op"]].map(([id,label]) => (
          <button key={id} style={S.navBtn(false)} onClick={() => {
            if(id==="trauma") setPage(PAGES.TRAUMA);
            else if(id==="postop") setPage(PAGES.POSTOP);
          }}>{label}</button>
        ))}
      </div>
      <div style={{ ...S.cardTitle, marginBottom: 10, color: "#a8c4ff" }}>🦷 Tooth Pain / Toothache</div>
      <Box>Chief complaint: dental pain, toothache, "tooth hurts"</Box>
      <Arrow/>
      <Box>Fever, trismus, dysphagia, floor-of-mouth swelling, muffled voice?</Box>
      <Branch left="YES → Deep space / Ludwig's risk. CT neck + IV access. Go to Abscess page ↗" right="NO → Continue below"/>
      <Arrow/>
      <Box>Visible swelling intraoral or extraoral (cheek/jaw)?</Box>
      <Branch left="YES → Dental abscess. I&D if fluctuant. Antibiotics. 7-day follow-up." right="NO → Pulpitis or periapical. Analgesics. Dental referral 24–48h."/>
      <Arrow/>
      <Box color="rgba(60,100,200,0.1)">Immunocompromised? (DM, steroids, HIV, chemo, transplant)</Box>
      <Branch left="YES → Lower threshold for antibiotics + admission consideration" right="NO → Outpatient Amox + analgesics. 7-day follow-up." leftColor="rgba(220,180,30,0.12)" rightColor="rgba(60,180,100,0.1)"/>
      <div style={{ height: 16 }}/>
      <div style={{ ...S.cardTitle, marginBottom: 10, color: "#a8c4ff" }}>💥 Dental Trauma</div>
      <Box>Chief complaint: knocked-out tooth, broken tooth, facial trauma</Box>
      <Arrow/>
      <Box>Tooth avulsed (completely out of socket)?</Box>
      <Branch left="YES → Time critical. Storage media? Reimplant if permanent + &lt;60 min. Avulsion protocol ↗" right="NO → Fracture or luxation. Ellis classification. Nerve block for pain."/>
      <Arrow/>
      <Box>Signs of alveolar fracture? (segment of teeth moving together, malocclusion)</Box>
      <Branch left="YES → Reposition + rigid splint. OMFS urgently." right="NO → Classify luxation type. Flexible splint if mobile. Dental 24h."/>
      <div style={{ height: 16 }}/>
      <div style={{ ...S.cardTitle, marginBottom: 10, color: "#a8c4ff" }}>🔴 Facial/Jaw Swelling</div>
      <Box>Swelling location: submandibular / floor of mouth / neck?</Box>
      <Arrow/>
      <Branch left="YES floor-of-mouth → Ludwig's. AIRWAY PRIORITY. CT neck. Anesthesia to bedside." right="Cheek / localized → Dental abscess. CT if deep space suspected."/>
      <div style={{ ...S.alertYellow, marginTop: 12 }}>
        <strong>Never-Miss Rule:</strong> Any patient with dental complaint + stridor, drooling, muffled "hot potato" voice, or inability to open mouth → airway emergency. Do not send to triage waiting area.
      </div>
    </div>
  );
}

function PedsPage() {
  return (
    <div style={S.page}>
      <div style={S.pageTitle}>Pediatric Dental Emergencies</div>
      <div style={S.pageSub}>PRIMARY TEETH · AGE-BASED DECISIONS · ABUSE FLAGS</div>
      <div style={S.alertBlue}>
        <strong>Core Principle:</strong> Primary (deciduous) teeth are managed more conservatively than permanent teeth. The developing permanent tooth bud below is at risk from any aggressive intervention.
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Eruption Timeline — Quick Reference</div>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Teeth</th><th style={S.th}>Erupt</th><th style={S.th}>Shed</th></tr></thead>
          <tbody>
            {[
              ["Lower central incisors","6–10 mo","6–7 yr"],
              ["Upper central incisors","8–12 mo","7–8 yr"],
              ["First molars (primary)","13–19 mo","9–11 yr"],
              ["Canines (primary)","16–23 mo","10–12 yr"],
              ["Second molars (primary)","23–33 mo","10–12 yr"],
              ["First permanent molars","6–7 yr","—"],
              ["Permanent incisors","6–9 yr","—"],
            ].map(([t,e,s],i) => <tr key={i}><td style={S.td}>{t}</td><td style={S.td}>{e}</td><td style={S.td}>{s}</td></tr>)}
          </tbody>
        </table>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Avulsion — Primary vs Permanent</div>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Tooth Type</th><th style={S.th}>Management</th><th style={S.th}>Rationale</th></tr></thead>
          <tbody>
            {[
              ["Primary (baby) tooth","DO NOT reimplant","Risk of damaging permanent bud below"],
              ["Permanent tooth","Reimplant ASAP","Follow standard avulsion protocol"],
              ["Uncertain (age 6–8)","Identify tooth first","Check eruption timeline + X-ray"],
            ].map(([t,m,r],i) => <tr key={i}><td style={S.td}>{t}</td><td style={S.td}>{m}</td><td style={S.td}>{r}</td></tr>)}
          </tbody>
        </table>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Pediatric Antibiotic Dosing</div>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Drug</th><th style={S.th}>Dose</th><th style={S.th}>Max</th></tr></thead>
          <tbody>
            {[
              ["Amoxicillin","40–45 mg/kg/day ÷ TID","500mg/dose"],
              ["Amox-Clavulanate","40–45 mg/kg/day ÷ BID","875mg/dose"],
              ["Clindamycin (PCN allergy)","10–13 mg/kg/day ÷ TID","300mg/dose"],
              ["Metronidazole","7.5 mg/kg/dose TID","500mg/dose"],
            ].map(([d,dose,mx],i) => <tr key={i}><td style={S.td}>{d}</td><td style={S.td}><span style={S.mono}>{dose}</span></td><td style={S.td}>{mx}</td></tr>)}
          </tbody>
        </table>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Pediatric Analgesics</div>
        <ul style={S.list}>
          <li>Ibuprofen: <span style={S.mono}>10 mg/kg PO q6–8h</span> (max 400mg/dose) — preferred</li>
          <li>Acetaminophen: <span style={S.mono}>15 mg/kg PO q4–6h</span> (max 1g/dose)</li>
          <li>Combination: Ibu + APAP alternating q3h for moderate pain</li>
          <li>No opioids for dental pain in children unless extraordinary circumstances</li>
        </ul>
      </div>
      <div style={S.alertRed}>
        <strong>⚠️ Child Abuse Red Flags — Dental/Oral</strong>
        <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
          <li>Frenulum tear in pre-ambulatory child (&lt;6–9 months) — classic forced feeding injury</li>
          <li>Multiple dental injuries at different stages of healing</li>
          <li>Patterned bruising on face, ear, or neck in a young child</li>
          <li>Bilateral mandible fractures without appropriate mechanism</li>
          <li>Delay in seeking care for significant dental trauma</li>
          <li>Story inconsistent with injury pattern or child's developmental stage</li>
        </ul>
        <div style={{ marginTop: 8 }}>If abuse suspected → Mandatory report. Social work consult. Full skeletal survey.</div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Space Maintainer Awareness</div>
        <ul style={S.list}>
          <li>Premature loss of primary molar → loss of space for erupting permanent tooth</li>
          <li>Refer to dentist/orthodontist for space maintainer consideration within 2–4 weeks</li>
          <li>If space maintainer is broken/dislodged in ED — document, do not attempt adjustment, refer urgently</li>
        </ul>
      </div>
    </div>
  );
}

function DischargePage() {
  const [copied, setCopied] = useState(null);
  const copy = (text, id) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(id); setTimeout(() => setCopied(null), 2000); });
  };
  const templates = [
    {
      id: "abscess",
      label: "Dental Abscess / Toothache",
      icon: "🔴",
      text: `DENTAL ABSCESS — DISCHARGE INSTRUCTIONS

DIAGNOSIS: Dental abscess / dental infection

TREATMENT TODAY: [I&D performed / Antibiotics prescribed / Pain management]

MEDICATIONS:
• [Amoxicillin 500mg — Take 1 capsule 3 times daily for __ days]
• [Ibuprofen 600mg — Take 1 tablet every 6 hours with food as needed for pain]
• [Acetaminophen 500mg — May alternate with ibuprofen every 3 hours]

FOLLOW-UP: See a dentist within 7 DAYS. This is important — the ED treated your pain and infection, but you need definitive dental treatment (root canal, extraction, or further drainage) to fully resolve this.

RETURN TO ED IF:
• Swelling spreads to your neck, floor of mouth, or eye
• Difficulty swallowing, opening your mouth, or breathing
• Fever above 101.5°F (38.6°C) despite antibiotics
• Symptoms worsen after 48 hours on antibiotics

If you don't have a dentist: [Local dental clinic / community health center info]`,
    },
    {
      id: "trauma",
      label: "Dental Trauma",
      icon: "⚡",
      text: `DENTAL TRAUMA — DISCHARGE INSTRUCTIONS

DIAGNOSIS: [Tooth fracture / Tooth avulsion / Tooth luxation]

TREATMENT TODAY: [Tooth reimplanted and splinted / Fracture covered / Splint placed]

FOLLOW-UP: See a dentist within 24–48 HOURS. Dental trauma requires early specialist evaluation for splint adjustment, X-rays, and pulp vitality testing.

TOOTH CARE:
• Eat soft foods only — no biting on injured side
• Avoid extreme temperatures (hot/cold beverages)
• Brush gently around the area with a soft brush
• Rinse gently with warm salt water 2–3 times daily

MEDICATIONS:
• [Ibuprofen 400–600mg every 6–8 hours as needed for pain]
• [Antibiotics if prescribed: ______]

RETURN TO ED IF:
• Tooth becomes loose or falls out
• Increasing pain, swelling, or fever
• Difficulty breathing or swallowing

NOTE: Even if the tooth looks fine now, internal damage (nerve death) can develop over days to weeks — dental follow-up is essential.`,
    },
    {
      id: "postex",
      label: "Post-Extraction / Dry Socket",
      icon: "🩹",
      text: `POST-EXTRACTION COMPLICATION — DISCHARGE INSTRUCTIONS

DIAGNOSIS: [Post-extraction bleeding / Alveolar osteitis (dry socket) / Post-op infection]

TREATMENT TODAY: [Socket packed / Bleeding controlled / Antibiotics prescribed]

FOLLOW-UP: Return to your oral surgeon or dentist within 24–48 HOURS for socket re-evaluation and repacking if needed.

SOCKET CARE:
• Do NOT rinse forcefully for 24 hours after extraction
• After 24 hours: gentle warm salt water rinse 3–4× daily
• No smoking, straws, or spitting (suction dislodges clot)
• Keep gauze in place and bite firmly × 30–45 minutes if bleeding

NORMAL HEALING vs. CONCERN:
• Normal: Some ooze, mild swelling, and discomfort for 2–3 days
• Concerning: Severe worsening pain after day 3, empty-looking socket, bad odor — return for evaluation

MEDICATIONS:
• [Ibuprofen 600mg every 6–8 hours with food]
• [Antibiotics if prescribed: ______]

RETURN TO ED IF:
• Bleeding does not stop with 45 min of firm gauze pressure
• Severe spreading swelling or fever > 101.5°F
• Difficulty swallowing or breathing`,
    },
  ];
  return (
    <div style={S.page}>
      <div style={S.pageTitle}>Discharge Templates</div>
      <div style={S.pageSub}>COPY-PASTE INSTRUCTIONS · ADA 7-DAY FOLLOW-UP</div>
      <div style={{ ...S.alertBlue, marginBottom: 16 }}>
        Tap <strong>Copy</strong> on any template. Each includes the ADA DQA 7-day follow-up instruction and return precautions. Customize bracketed fields before printing or entering into the chart.
      </div>
      {templates.map(({ id, label, icon, text }) => (
        <div key={id} style={{ ...S.card, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={S.cardTitle}>{icon} {label}</div>
            <button onClick={() => copy(text, id)} style={{ ...S.navBtn(copied === id), padding: "5px 14px", fontSize: "0.74rem" }}>
              {copied === id ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <pre style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem", color: "rgba(200,216,255,0.7)", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, lineHeight: 1.6, background: "rgba(0,0,0,0.2)", borderRadius: 6, padding: "10px 12px" }}>{text}</pre>
        </div>
      ))}
    </div>
  );
}

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────

function TMJPage() {
  const [tab, setTab] = useState("reduction");
  return (
    <div style={S.page}>
      <div style={S.pageTitle}>TMJ Dislocation</div>
      <div style={S.pageSub}>ANTERIOR DISLOCATION · REDUCTION TECHNIQUES · POST-CARE</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[["reduction","Reduction"],["technique","Technique"],["postcare","Post-Care"]].map(([id,label]) => (
          <button key={id} style={S.navBtn(tab===id)} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      {tab === "reduction" && (<>
        <div style={S.alertYellow}><strong>Presentation:</strong> Open mouth stuck open, unable to close, jaw deviated (unilateral) or symmetric (bilateral), masseter muscle spasm, pain. Condylar head anterior to articular eminence.</div>
        <div style={S.card}>
          <div style={S.cardTitle}>Pre-Reduction Setup</div>
          <ul style={S.list}>
            <li>Confirm with clinical exam — bilateral palpation of condyles anterior to eminence</li>
            <li>X-ray rarely needed for classic presentation — panorex or Towne's view if uncertain</li>
            <li><strong>Procedural sedation or anxiolysis:</strong> Midazolam 1–2mg IV or intranasal 0.1mg/kg — masseter spasm is the main obstacle</li>
            <li>Alternatively: Intraarticular lidocaine — inject 1–2mL 2% lidocaine just anterior to tragus, inferior to zygomatic arch, directly into TMJ capsule</li>
            <li>Position: Seated upright or semi-reclined, head supported against headrest or wall</li>
          </ul>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Why It Dislocates</div>
          <ul style={S.list}>
            <li>Condylar head translates anterior to articular eminence on wide opening</li>
            <li>Masseter and temporalis spasm locks it in place anteriorly</li>
            <li>Common triggers: yawning, dental procedures, vomiting, intubation, seizure</li>
            <li>Risk factors: connective tissue disorders, prior dislocation, ligamentous laxity</li>
          </ul>
        </div>
      </>)}
      {tab === "technique" && (<>
        <div style={S.card}>
          <div style={S.cardTitle}>Classic Hippocratic Method</div>
          <ul style={S.list}>
            <li>Stand in front of seated patient</li>
            <li>Wrap thumbs in gauze (bite protection)</li>
            <li>Place wrapped thumbs on lower molars bilaterally, fingers under the chin</li>
            <li>Apply firm <strong>downward then posterior</strong> pressure on molars while lifting chin</li>
            <li>Feel/hear a "clunk" as condyle reduces over eminence</li>
            <li>Risk: patient biting down forcefully during reduction — wrap thumbs well</li>
          </ul>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Wrist-Pivot Technique (Provider-Safer)</div>
          <ul style={S.list}>
            <li>Preferred — eliminates bite risk to provider thumbs</li>
            <li>Stand beside patient, same side as dislocation</li>
            <li>Place thenar eminence (base of thumb) on lower molars — NOT thumb tip</li>
            <li>Fingers wrap under mandible at symphysis</li>
            <li>Pivot wrist downward — leverages molar down and back simultaneously</li>
            <li>Fingers provide upward counter-pressure at chin</li>
          </ul>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Extraoral / Gag Reflex Technique</div>
          <ul style={S.list}>
            <li>For patients with trismus preventing intraoral access</li>
            <li>Bilateral thumb pressure on cheeks over zygomatic arch — downward and posterior</li>
            <li>Less force, useful in partial dislocations or TMJ arthritis cases</li>
          </ul>
        </div>
        <div style={S.alertBlue}><strong>Failed Reduction After 2–3 Attempts:</strong> Give adequate anxiolysis/sedation before re-attempting. Prolonged dislocation (&gt;24h) → muscle spasm and edema increase — may require OR under general anesthesia. OMFS consult.</div>
      </>)}
      {tab === "postcare" && (<>
        <div style={S.card}>
          <div style={S.cardTitle}>Post-Reduction Care</div>
          <ul style={S.list}>
            <li>Confirm reduction: patient can close mouth, no anterior condyle palpable</li>
            <li>Barton bandage (chin wrap) or soft cervical collar — keeps mouth partially closed × 24–48h</li>
            <li>Soft diet × 1–2 weeks — no wide opening, no yawning with mouth fully open</li>
            <li>NSAIDs + muscle relaxant (cyclobenzaprine 5–10mg TID × 3–5 days)</li>
            <li>Warm compresses to masseter BID</li>
            <li>Follow-up: oral surgery or maxillofacial within 1–2 weeks</li>
          </ul>
        </div>
        <div style={S.alertYellow}><strong>Recurrent Dislocators:</strong> Refer to OMFS for consideration of eminoplasty, Dautrey procedure, or botulinum toxin injection to lateral pterygoid. ED management is the same each time, but document prior events and refer proactively.</div>
      </>)}
    </div>
  );
}

function MimicsPage() {
  return (
    <div style={S.page}>
      <div style={S.pageTitle}>Orofacial Pain — Don't-Miss Differentials</div>
      <div style={S.pageSub}>CARDIAC · TRIGEMINAL · SINUS · SALIVARY · VASCULAR</div>
      <div style={S.alertRed}>
        <strong>⚠️ Rule Out First:</strong> Jaw/tooth pain can be the sole presentation of cardiac ischemia. An EKG takes 90 seconds. If the pain is bilateral, effort-related, radiation to arm/chest, or the patient has cardiac risk factors — get the EKG before attributing to dental cause.
      </div>
      {[
        { dx: "Acute Coronary Syndrome", flags: "red", details: [
          "Lower jaw pain, bilateral molars, or neck pain without clear dental source",
          "Worse with exertion, relieved with rest",
          "Associated diaphoresis, nausea, dyspnea",
          "Especially inferior STEMI (RCA) — referred pain via vagus to mandible",
          "Action: EKG, troponin, aspirin before any dental workup",
        ]},
        { dx: "Trigeminal Neuralgia", flags: "yellow", details: [
          "Lancinating, electric-shock quality — seconds to 2 minutes",
          "Triggered by light touch: eating, talking, cold wind, brushing",
          "V2 (maxillary) or V3 (mandibular) distribution",
          "No swelling, no fever, normal dental exam",
          "New onset after age 50 — MRI to rule out MS plaque or vascular compression",
          "Treatment: carbamazepine 100–200mg BID (first-line), neurology referral",
        ]},
        { dx: "Sinusitis (Maxillary)", flags: "yellow", details: [
          "Upper molar pain — often bilateral or shifting",
          "Pressure worse with bending forward, Valsalva, or postnasal drainage",
          "Seasonal pattern, concurrent nasal congestion, purulent discharge",
          "Panorex: opacified maxillary sinus, air-fluid level",
          "Percussion of upper molars diffusely tender (not isolated to one tooth)",
          "Treatment: nasal saline, decongestants, antibiotics if bacterial (amoxicillin)",
        ]},
        { dx: "Giant Cell Arteritis (Jaw Claudication)", flags: "red", details: [
          "Age &gt;50, jaw fatigue/pain with chewing that resolves with rest",
          "Temporal headache, scalp tenderness, visual changes (emergency — risk of blindness)",
          "ESR &gt;50, CRP elevated; tender non-pulsatile temporal artery",
          "Action: Prednisone 1mg/kg immediately — do not wait for biopsy",
          "Ophthalmology urgent consult; temporal artery biopsy within 2 weeks",
        ]},
        { dx: "Atypical Odontalgia / Persistent Dentoalveolar Pain", flags: "blue", details: [
          "Constant dull/burning tooth pain without clear dental etiology",
          "Normal X-rays, no abscess, no fracture",
          "Often follows dental procedure or tooth extraction",
          "Neuropathic in origin — central sensitization",
          "Treatment: TCA (nortriptyline 10–25mg QHS), neurology/pain referral",
        ]},
        { dx: "Parotid/Salivary Pathology", flags: "blue", details: [
          "Swelling worse with meals (sialolithiasis) or constant (parotitis/tumor)",
          "Pain at angle of jaw, not tooth-specific",
          "Palpable stone on bimanual exam (Wharton's duct), or pus from Stensen's duct",
          "See Salivary Gland page for full management",
        ]},
      ].map(({ dx, flags, details }) => (
        <div key={dx} style={flags === "red" ? S.alertRed : flags === "yellow" ? S.alertYellow : S.alertBlue}>
          <strong>{dx}</strong>
          <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>{details.map((d,i) => <li key={i}>{d}</li>)}</ul>
        </div>
      ))}
    </div>
  );
}

function SalivaryPage() {
  return (
    <div style={S.page}>
      <div style={S.pageTitle}>Salivary Gland Emergencies</div>
      <div style={S.pageSub}>PAROTITIS · SIALOLITHIASIS · RANULA</div>
      <div style={S.alertYellow}><strong>Key Distinction from Dental Abscess:</strong> Salivary gland pathology causes pre-auricular or submandibular swelling without periapical dental source. Bimanual exam of floor of mouth and duct orifice expression are diagnostic.</div>
      <div style={S.card}>
        <div style={S.cardTitle}>Acute Suppurative Parotitis</div>
        <ul style={S.list}>
          <li><strong>Source:</strong> Staphylococcus aureus (including MRSA) ascending via Stensen's duct</li>
          <li><strong>Risk factors:</strong> Dehydration, post-op, elderly, anticholinergic meds, Sjogren's</li>
          <li><strong>Exam:</strong> Tender pre-auricular/parotid swelling; expressible pus from Stensen's duct (opening at upper 2nd molar) pathognomonic</li>
          <li><strong>CT:</strong> Order if concern for abscess — needs surgical drainage if loculated</li>
        </ul>
        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#c8d8ff", margin: "8px 0 4px" }}>Treatment</div>
        <ul style={S.list}>
          <li>IV fluids — aggressive rehydration (often the precipitating factor)</li>
          <li>Antibiotics: Nafcillin/oxacillin 1–2g IV q4–6h or cefazolin 1g IV q8h</li>
          <li>MRSA risk: Vancomycin 15–20mg/kg IV q8–12h</li>
          <li>Sialagogues: lemon drops, sour candy — stimulate duct flushing</li>
          <li>Warm compresses, massage gland toward duct orifice</li>
          <li>Admit if toxic, abscess on CT, immunocompromised</li>
        </ul>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Sialolithiasis (Salivary Duct Stone)</div>
        <ul style={S.list}>
          <li><strong>Location:</strong> 80% in Wharton's duct (submandibular gland) — floor of mouth</li>
          <li><strong>Classic:</strong> Meal-related swelling and pain, resolves partially between meals</li>
          <li><strong>Exam:</strong> Bimanual palpation of floor of mouth — palpable stone; tender submandibular gland</li>
          <li><strong>Imaging:</strong> Ultrasound (preferred); CT if ultrasound negative but high suspicion</li>
          <li><strong>X-ray:</strong> 80% of submandibular stones are radiopaque on occlusal X-ray</li>
        </ul>
        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#c8d8ff", margin: "8px 0 4px" }}>Treatment</div>
        <ul style={S.list}>
          <li>Hydration + sialagogues (lemon drops, vitamin C lozenges)</li>
          <li>NSAIDs for pain and inflammation</li>
          <li>Massage gland toward duct, moist heat</li>
          <li>Antibiotics if secondary sialadenitis: amoxicillin-clavulanate 875mg BID × 7d</li>
          <li>Anterior stone (&lt;1cm, visible at duct orifice): may dilate with lacrimal probe + manual expression in ED</li>
          <li>ENT/OMFS referral: sialoendoscopy, shock wave lithotripsy, or excision for refractory cases</li>
        </ul>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Ranula</div>
        <ul style={S.list}>
          <li><strong>Origin:</strong> Mucous retention cyst of sublingual gland</li>
          <li><strong>Exam:</strong> Translucent, blue-tinged, fluctuant mass on floor of mouth — unilateral</li>
          <li><strong>Simple ranula:</strong> Confined to floor of mouth above mylohyoid</li>
          <li><strong>Plunging ranula:</strong> Herniates through mylohyoid → neck mass (can mimic deep space infection)</li>
          <li><strong>Do NOT I&D</strong> — high recurrence rate; refer to OMFS for marsupialization or sublingual gland excision</li>
          <li>Antibiotics only if secondarily infected (rare)</li>
        </ul>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Parotitis vs Dental Abscess — Key Differentiators</div>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Feature</th><th style={S.th}>Parotitis</th><th style={S.th}>Dental Abscess</th></tr></thead>
          <tbody>
            {[
              ["Swelling location","Pre-auricular, parotid region","Cheek, submental, submandibular"],
              ["Dental pain","Absent or non-specific","Focal, tooth-specific"],
              ["Duct exam","Pus from Stensen's duct","Normal salivary flow"],
              ["Panorex","Normal teeth/periapex","Periapical lucency, abscess"],
              ["Risk factors","Dehydration, elderly, post-op","Dental caries, periodontal disease"],
            ].map(([f,p,d],i) => <tr key={i}><td style={S.td}>{f}</td><td style={S.td}>{p}</td><td style={S.td}>{d}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NotationPage() {
  const upper = ["8","7","6","5","4","3","2","1","1","2","3","4","5","6","7","8"];
  const lower = ["8","7","6","5","4","3","2","1","1","2","3","4","5","6","7","8"];
  const uNum  = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];
  const lNum  = [32,31,30,29,28,27,26,25,24,23,22,21,20,19,18,17];
  const uFDI  = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
  const lFDI  = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];
  const primU = ["A","B","C","D","E","","","","","","F","G","H","I","J","","","",""];
  const primUArr = ["A","B","C","D","E","F","G","H","I","J"];
  const primLArr = ["K","L","M","N","O","P","Q","R","S","T"];
  const toothType = (pos) => {
    const p = pos % 8;
    if(p===1||p===2) return "Incisor";
    if(p===3) return "Canine";
    if(p===4||p===5) return "Premolar";
    return "Molar";
  };
  const Cell = ({ n, fdi, label }) => (
    <td style={{ ...S.td, textAlign: "center", padding: "4px 2px", borderRight: n===8||n===16||n===24||n===32 ? "2px solid rgba(100,140,255,0.25)" : undefined }}>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.72rem", color: "#a8c4ff", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: "0.6rem", color: "rgba(168,196,255,0.45)" }}>{fdi}</div>
    </td>
  );
  return (
    <div style={S.page}>
      <div style={S.pageTitle}>Tooth Notation Systems</div>
      <div style={S.pageSub}>UNIVERSAL · FDI · PRIMARY · CHART REFERENCE</div>
      <div style={S.alertBlue}>OMFS will ask which tooth number. The <strong>Universal System (1–32)</strong> is standard in the US. Upper right starts at #1, upper left ends at #16; lower left starts at #17, lower right ends at #32.</div>
      <div style={S.card}>
        <div style={S.cardTitle}>Universal System — Permanent Dentition</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ ...S.table, minWidth: 420 }}>
            <thead>
              <tr><th style={{ ...S.th, textAlign: "center", fontSize: "0.65rem" }} colSpan={8}>UPPER RIGHT (Patient's)</th><th style={{ ...S.th, textAlign: "center", fontSize: "0.65rem" }} colSpan={8}>UPPER LEFT (Patient's)</th></tr>
            </thead>
            <tbody>
              <tr>{uNum.map((n,i) => <Cell key={i} n={n} fdi={uFDI[i]} label={String(n)}/>)}</tr>
              <tr>{uNum.map((n,i) => <td key={i} style={{ ...S.td, textAlign:"center", fontSize:"0.65rem", color:"rgba(168,196,255,0.5)", padding:"1px 2px" }}>{upper[i]}</td>)}</tr>
              <tr><td colSpan={16} style={{ height: 8, borderBottom: "2px solid rgba(100,140,255,0.2)" }}></td></tr>
              <tr>{lNum.map((n,i) => <Cell key={i} n={n} fdi={lFDI[i]} label={String(n)}/>)}</tr>
              <tr>{lower.map((n,i) => <td key={i} style={{ ...S.td, textAlign:"center", fontSize:"0.65rem", color:"rgba(168,196,255,0.5)", padding:"1px 2px" }}>{n}</td>)}</tr>
              <tr><th style={{ ...S.th, textAlign: "center", fontSize: "0.65rem" }} colSpan={8}>LOWER RIGHT (Patient's)</th><th style={{ ...S.th, textAlign: "center", fontSize: "0.65rem" }} colSpan={8}>LOWER LEFT (Patient's)</th></tr>
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: "0.7rem", color: "rgba(168,196,255,0.45)", marginTop: 6 }}>Top row = Universal #. Bottom row in gray = FDI number.</div>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Tooth Type by Position</div>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Universal #s</th><th style={S.th}>Type</th><th style={S.th}>Notes</th></tr></thead>
          <tbody>
            {[
              ["1, 16, 17, 32","3rd Molar (Wisdom)","Most commonly impacted; source of pericoronitis"],
              ["2–3, 14–15, 18–19, 30–31","1st & 2nd Molars","Most common abscess source (#3, #14, #19, #30)"],
              ["4–5, 12–13, 20–21, 28–29","Premolars","Common fracture teeth"],
              ["6, 11, 22, 27","Canines (Cuspids)","Longest root — rarely extracted"],
              ["7–10, 23–26","Incisors","Most common trauma/avulsion teeth (#8, #9 upper central)"],
            ].map(([nums,type,note],i) => <tr key={i}><td style={{ ...S.td, fontFamily:"'JetBrains Mono',monospace", fontSize:"0.74rem", color:"#7dd3fc" }}>{nums}</td><td style={S.td}>{type}</td><td style={S.td}>{note}</td></tr>)}
          </tbody>
        </table>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>Primary (Deciduous) Dentition — Universal Letters</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: "0.72rem", color: "rgba(168,196,255,0.55)", marginBottom: 4 }}>UPPER (A–J, right to left)</div>
            <div style={{ display: "flex", gap: 3 }}>{primUArr.map(l => <span key={l} style={{ ...S.mono, fontSize: "0.76rem" }}>{l}</span>)}</div>
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: "0.72rem", color: "rgba(168,196,255,0.55)", marginBottom: 4 }}>LOWER (K–T, right to left)</div>
            <div style={{ display: "flex", gap: 3 }}>{primLArr.map(l => <span key={l} style={{ ...S.mono, fontSize: "0.76rem" }}>{l}</span>)}</div>
          </div>
        </div>
        <ul style={S.list}>
          <li>Upper right 2nd molar = A · Upper right central incisor = E · Upper left central incisor = F · Upper left 2nd molar = J</li>
          <li>Lower right 2nd molar = K · Lower right central incisor = O · Lower left central = P · Lower left 2nd molar = T</li>
        </ul>
      </div>
      <div style={S.card}>
        <div style={S.cardTitle}>FDI / ISO System (International)</div>
        <ul style={S.list}>
          <li>Two-digit system: first digit = quadrant (1–4 permanent, 5–8 primary), second = tooth position (1–8 from midline)</li>
          <li>Quadrant 1 = upper right · 2 = upper left · 3 = lower left · 4 = lower right</li>
          <li>Examples: #11 = upper right central incisor · #36 = lower left 1st molar · #48 = lower right 3rd molar</li>
          <li>Used in international literature and some hospital EHRs — know it for OMFS consults from abroad</li>
        </ul>
      </div>
      <div style={S.alertBlue}><strong>ED Charting Tip:</strong> Always document both the Universal number AND the plain language descriptor: "tooth #19 (lower left 1st molar)" — reduces errors and satisfies OMFS, coding, and nursing simultaneously.</div>
    </div>
  );
}


export default function DentalHub() {
  const [page, setPage] = useState(PAGES.OVERVIEW);

  const renderPage = () => {
    switch (page) {
      case PAGES.OVERVIEW:      return <OverviewPage setPage={setPage} />;
      case PAGES.TRIAGE:        return <TriagePage setPage={setPage} />;
      case PAGES.ABSCESS:       return <AbscessPage />;
      case PAGES.TRAUMA:        return <TraumaPage />;
      case PAGES.PAIN:          return <PainPage />;
      case PAGES.PERICORONITIS: return <PericoronitisPage />;
      case PAGES.POSTOP:        return <PostopPage />;
      case PAGES.PEDS:          return <PedsPage />;
      case PAGES.DISCHARGE:     return <DischargePage />;
      case PAGES.TMJ:           return <TMJPage />;
      case PAGES.MIMICS:        return <MimicsPage />;
      case PAGES.SALIVARY:      return <SalivaryPage />;
      case PAGES.NOTATION:      return <NotationPage />;
      default:                  return <OverviewPage setPage={setPage} />;
    }
  };

  return (
    <div style={S.hub}>
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "1.4rem" }}>🦷</span>
          <div>
            <div style={S.headerTitle}>Dental Hub</div>
            <div style={S.headerSub}>Emergency Dental Reference</div>
          </div>
        </div>
      </div>
      <div style={S.scrollNav}>
        {NAV_ITEMS.map(({ id, label, icon }) => (
          <button key={id} style={S.navBtn(page === id)} onClick={() => setPage(id)}>
            {icon} {label}
          </button>
        ))}
      </div>
      {renderPage()}
    </div>
  );
}