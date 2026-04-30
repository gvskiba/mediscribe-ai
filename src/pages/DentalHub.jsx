import { useState } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const PAGES = {
  OVERVIEW: "overview",
  ABSCESS: "abscess",
  TRAUMA: "trauma",
  PAIN: "pain",
  PERICORONITIS: "pericoronitis",
  POSTOP: "postop",
};

const NAV_ITEMS = [
  { id: PAGES.OVERVIEW,     label: "Overview",        icon: "🦷" },
  { id: PAGES.ABSCESS,      label: "Abscess / Ludwig's", icon: "🔴" },
  { id: PAGES.TRAUMA,       label: "Dental Trauma",   icon: "⚡" },
  { id: PAGES.PAIN,         label: "Pain & Blocks",   icon: "💉" },
  { id: PAGES.PERICORONITIS,label: "Pericoronitis",   icon: "🔬" },
  { id: PAGES.POSTOP,       label: "Post-Procedure",  icon: "🩹" },
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
      <div style={S.pageTitle}>Abscess &amp; Deep Space Infections</div>
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
            <div style={S.cardTitle}>I&amp;D Indications</div>
            <ul style={S.list}>
              <li>Fluctuant abscess on exam</li>
              <li>CT-confirmed drainable collection</li>
              <li>No improvement on antibiotics 24–48h</li>
              <li>Intraoral I&amp;D if accessible (mucosal approach)</li>
            </ul>
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}>Intraoral I&amp;D Technique</div>
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
          {[
            { cls: "Ellis Class I", sub: "Enamel Only", color: "alertBlue", tx: ["No pulp or dentin exposed","Smooth sharp edges with emery board","Dental follow-up non-urgent (1–2 weeks)","Cosmetic repair by dentist"] },
            { cls: "Ellis Class II", sub: "Enamel + Dentin", color: "alertYellow", tx: ["Yellow/cream dentin visible","Sensitive to air/cold","Cover with calcium hydroxide paste (Dycal) or zinc oxide","Dental follow-up within 24h","Primary teeth: non-vital → extraction consideration"] },
            { cls: "Ellis Class III", sub: "Enamel + Dentin + Pulp", color: "alertRed", tx: ["Pink/red pulp exposure or frank bleeding","Severe pain","Cover with moist cotton + calcium hydroxide paste","Urgent dental/endodontic referral same day","Risk: pulp necrosis, abscess if untreated >24h"] },
          ].map(({ cls, sub, color, tx }) => (
            <div key={cls} style={S[color]}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <strong>{cls}</strong>
                <span style={S.pill(color === "alertRed" ? "red" : color === "alertYellow" ? "yellow" : "blue")}>{sub}</span>
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
            <div style={S.cardTitle}>Luxation Types &amp; Management</div>
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
      <div style={S.pageTitle}>Pain Management &amp; Nerve Blocks</div>
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
      <div style={S.pageTitle}>Pericoronitis &amp; Soft Tissue Infections</div>
      <div style={S.pageSub}>PERICORONITIS · ANUG · HERPETIC STOMATITIS</div>
      <div style={S.card}>
        <div style={S.cardTitle}>Pericoronitis — Grading &amp; Management</div>
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
        <div style={{ ...S.alertRed, margin: "8px 0" }}>
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
              ["Fever","Low-grade 24–48h",">38.5°C after 48h"],
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

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────

export default function DentalHub() {
  const [page, setPage] = useState(PAGES.OVERVIEW);

  const renderPage = () => {
    switch (page) {
      case PAGES.OVERVIEW:      return <OverviewPage setPage={setPage} />;
      case PAGES.ABSCESS:       return <AbscessPage />;
      case PAGES.TRAUMA:        return <TraumaPage />;
      case PAGES.PAIN:          return <PainPage />;
      case PAGES.PERICORONITIS: return <PericoronitisPage />;
      case PAGES.POSTOP:        return <PostopPage />;
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