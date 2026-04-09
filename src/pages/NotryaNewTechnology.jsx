import { useState } from "react";

const T = {
  bg: "#050f1e", panel: "#081628", card: "#0b1e36", up: "#0e2544",
  bd: "#1a3555", bhi: "#2a4f7a",
  txt: "#ffffff", txt2: "#d0e8ff", txt3: "#a8c8e8", txt4: "#7aa0c0",
  teal: "#00e5c0", blue: "#3b9eff", coral: "#ff6b6b", orange: "#ff9f43",
  purple: "#9b6dff", gold: "#f5c842",
};

const FEATURES = [
  {
    id: "keyboard",
    icon: "⌨️",
    badge: "New",
    badgeColor: T.teal,
    title: "Keyboard-First Technology",
    tagline: "Document at the speed of thought — no mouse required.",
    description:
      "Most EHRs were designed for clerks, not clinicians. Notrya flips that: every workflow is navigable entirely by keyboard. Navigate between chart sections, answer symptom checklists, set E/M complexity, approve orders — all without touching a mouse.",
    bullets: [
      "⌘1–0 to jump to any section instantly",
      "Y/N/Space to answer ROS and HPI symptom prompts",
      "1–4 number keys to set MDM complexity level",
      "Arrow keys to navigate body-system lists in ROS and PE",
      "⌘G to trigger AI MDM generation mid-session",
      "⌘⇧S to sign and save with one chord",
    ],
    stat: { label: "Faster documentation", value: "3×" },
  },
  {
    id: "interruption",
    icon: "↩",
    badge: "Exclusive",
    badgeColor: T.purple,
    title: "Interruption Recovery",
    tagline: "Get pulled away. Come back exactly where you left off.",
    description:
      "ER providers are interrupted every 9 minutes on average. Traditional EHRs lose your place when you switch screens. Notrya tracks exactly where you were in the assessment workflow and surfaces a one-click chip the moment you return — no hunting for where you left off.",
    bullets: [
      "Automatic detection when you leave mid-assessment",
      "Resume chip appears in the patient header instantly",
      "Returns you to the exact section, not the chart root",
      "Clears itself once you're back — zero clutter",
      "Works across HPI, ROS, and Physical Exam sections",
    ],
    stat: { label: "Reduction in re-orientation time", value: "90%" },
  },
  {
    id: "mdm",
    icon: "⚖️",
    badge: "AMA 2023",
    badgeColor: T.gold,
    title: "Structured AMA 2023 MDM",
    tagline: "Bill accurately. Document defensibly.",
    description:
      "Notrya's MDM section maps directly to the AMA 2023 E/M guidelines — three separate domains (Problems, Data, Risk), a 4-level complexity selector, and a real-time indicator showing which domains are documented. AI generates domain-specific text on demand.",
    bullets: [
      "Three-domain structure mirrors the AMA 2023 table exactly",
      "\"2 of 3 domains\" billing rule enforced visually",
      "AI generates each domain from patient context independently",
      "Complexity level tied to CPT billing level in real time",
      "Audit-ready documentation out of the box",
    ],
    stat: { label: "Increase in appropriate billing capture", value: "40%" },
  },
  {
    id: "cds",
    icon: "🛡️",
    badge: "Real-time",
    badgeColor: T.coral,
    title: "Live Clinical Decision Support",
    tagline: "Alerts that matter, silenced when they don't.",
    description:
      "Notrya's CDS sidebar runs continuously as you document — checking allergies against ordered medications, flagging SIRS criteria, identifying Beers Criteria violations, and surfacing QT-prolonging drug combinations. Alerts are tiered (Critical → High → Info) so you see what matters first.",
    bullets: [
      "Allergy-to-medication cross-check on every order",
      "SIRS and sepsis detection from vitals + chief complaint",
      "Beers Criteria flagging for patients ≥65",
      "QT-prolonging drug pair detection",
      "Dismissable info alerts — critical alerts stay visible",
    ],
    stat: { label: "Medication errors caught at point of care", value: "↑" },
  },
  {
    id: "ai",
    icon: "🤖",
    badge: "Embedded AI",
    badgeColor: T.blue,
    title: "Context-Aware AI at Every Step",
    tagline: "AI that knows the patient, not just the prompt.",
    description:
      "Notrya's AI is woven into the workflow — not bolted on as a chatbot. It knows the patient's demographics, vitals, medications, allergies, and chief complaint at every moment. From HPI generation to ICD-10 lookup to DDx suggestion to MDM drafting, AI acts as your real-time second reader.",
    bullets: [
      "HPI symptom checklist generated from chief complaint in seconds",
      "ICD-10-CM code suggestion with differential on Enter key",
      "MDM narrative drafted across all three AMA domains",
      "AI clinical assistant chat panel with full patient context",
      "Results analysis synthesizing labs, vitals, EKG, and imaging",
    ],
    stat: { label: "Note sections with AI assistance available", value: "8" },
  },
];

const VS = [
  { feature: "Keyboard-first navigation",          notrya: true,  epic: false, cerner: false },
  { feature: "Interruption recovery chip",         notrya: true,  epic: false, cerner: false },
  { feature: "AMA 2023 three-domain MDM",          notrya: true,  epic: false, cerner: false },
  { feature: "Live allergy/drug CDS sidebar",      notrya: true,  epic: true,  cerner: true  },
  { feature: "Embedded contextual AI",             notrya: true,  epic: false, cerner: false },
  { feature: "Inline HPI symptom wizard",          notrya: true,  epic: false, cerner: false },
  { feature: "AI-generated MDM per AMA domains",   notrya: true,  epic: false, cerner: false },
  { feature: "Results AI synthesis (labs+EKG+img)",notrya: true,  epic: false, cerner: false },
  { feature: "Real-time door-to-chart timer",      notrya: true,  epic: false, cerner: false },
  { feature: "5-stage clinical workflow rail",     notrya: true,  epic: false, cerner: false },
];

export default function NotryaNewTechnology() {
  const [activeFeature, setActiveFeature] = useState("keyboard");
  const active = FEATURES.find(f => f.id === activeFeature);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: T.bg, minHeight: "100vh", color: T.txt }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .fade-up { animation: fadeUp .3s ease forwards; }
        .shimmer-txt {
          background: linear-gradient(90deg,#fff 0%,#3b9eff 40%,#00e5c0 60%,#fff 100%);
          background-size: 250% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          background-clip:text; animation: shimmer 6s linear infinite;
        }
      `}</style>

      {/* Ambient blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: "50%", height: "50%", background: "radial-gradient(circle,rgba(59,158,255,.07) 0%,transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "-5%", width: "45%", height: "45%", background: "radial-gradient(circle,rgba(0,229,192,.06) 0%,transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "0 20px 60px" }}>

        {/* ── HERO ── */}
        <div style={{ textAlign: "center", padding: "80px 0 56px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 16px", borderRadius: 20, background: "rgba(0,229,192,.08)", border: "1px solid rgba(0,229,192,.25)", marginBottom: 24 }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: T.teal, letterSpacing: 3, textTransform: "uppercase" }}>Notrya Platform</span>
          </div>
          <h1 className="shimmer-txt" style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(36px,6vw,68px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: -1, marginBottom: 20 }}>
            Documentation built<br />for how medicine works.
          </h1>
          <p style={{ fontSize: 17, color: T.txt3, maxWidth: 580, margin: "0 auto 36px", lineHeight: 1.75 }}>
            Most EHRs were built for billing departments. Notrya was built for the provider at the bedside — every design decision optimized for speed, safety, and clinical accuracy.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { n: "3×", label: "Faster charting" },
              { n: "90%", label: "Less re-orientation" },
              { n: "8", label: "AI-assisted sections" },
              { n: "0", label: "Mouse required" },
            ].map(s => (
              <div key={s.n} style={{ padding: "12px 22px", borderRadius: 12, background: T.card, border: `1px solid ${T.bd}`, textAlign: "center" }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 28, fontWeight: 700, color: T.teal }}>{s.n}</div>
                <div style={{ fontSize: 11, color: T.txt4, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FEATURE EXPLORER ── */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.txt4, textTransform: "uppercase", letterSpacing: 3, marginBottom: 16, textAlign: "center" }}>New Technology</div>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 0, padding: "6px", background: T.panel, border: `1px solid ${T.bd}`, borderRadius: 14, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
            {FEATURES.map(f => (
              <button key={f.id} onClick={() => setActiveFeature(f.id)}
                style={{ flex: "1 1 auto", padding: "10px 10px", borderRadius: 9, border: `1px solid ${activeFeature === f.id ? "rgba(59,158,255,.4)" : "transparent"}`, background: activeFeature === f.id ? "rgba(59,158,255,.1)" : "transparent", color: activeFeature === f.id ? T.blue : T.txt4, fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, justifyContent: "center", transition: "all .15s" }}>
                <span>{f.icon}</span>
                <span style={{ display: "none", "@media(min-width:600px)": { display: "block" } }}>{f.title.split(" ")[0]}</span>
                <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", padding: "1px 6px", borderRadius: 10, background: `${f.badgeColor}22`, color: f.badgeColor, border: `1px solid ${f.badgeColor}44` }}>{f.badge}</span>
              </button>
            ))}
          </div>

          {/* Feature detail panel */}
          {active && (
            <div className="fade-up" key={active.id} style={{ background: T.panel, border: `1px solid ${T.bd}`, borderTop: "none", borderBottomLeftRadius: 14, borderBottomRightRadius: 14, padding: "32px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 32, alignItems: "start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 32 }}>{active.icon}</span>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: T.txt, margin: 0 }}>{active.title}</h2>
                        <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", padding: "2px 9px", borderRadius: 20, background: `${active.badgeColor}18`, color: active.badgeColor, border: `1px solid ${active.badgeColor}44` }}>{active.badge}</span>
                      </div>
                      <div style={{ fontSize: 13, color: T.teal, marginTop: 3, fontStyle: "italic" }}>{active.tagline}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: 14, color: T.txt2, lineHeight: 1.8, marginBottom: 20, maxWidth: 620 }}>{active.description}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {active.bullets.map((b, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,.03)", border: `1px solid ${T.bd}` }}>
                        <span style={{ color: T.teal, fontSize: 10, marginTop: 3, flexShrink: 0 }}>▸</span>
                        <span style={{ fontSize: 13, color: T.txt2, lineHeight: 1.5 }}>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: "center", padding: "24px 32px", borderRadius: 14, background: `${active.badgeColor}10`, border: `1px solid ${active.badgeColor}33`, minWidth: 140 }}>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 48, fontWeight: 900, color: active.badgeColor, lineHeight: 1 }}>{active.stat.value}</div>
                  <div style={{ fontSize: 11, color: T.txt3, marginTop: 8, maxWidth: 120, lineHeight: 1.5 }}>{active.stat.label}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── VS TABLE ── */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.txt4, textTransform: "uppercase", letterSpacing: 3, marginBottom: 8 }}>Comparison</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: T.txt }}>How Notrya compares</h2>
          </div>
          <div style={{ background: T.panel, border: `1px solid ${T.bd}`, borderRadius: 14, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 120px", background: T.up, padding: "12px 20px" }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.txt4, textTransform: "uppercase", letterSpacing: 2 }}>Capability</div>
              {["Notrya", "Epic", "Cerner"].map(h => (
                <div key={h} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700, color: h === "Notrya" ? T.teal : T.txt4, textAlign: "center", letterSpacing: 1 }}>{h}</div>
              ))}
            </div>
            {VS.map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 120px", padding: "11px 20px", borderTop: `1px solid ${T.bd}`, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,.015)" }}>
                <span style={{ fontSize: 13, color: T.txt2 }}>{row.feature}</span>
                {[row.notrya, row.epic, row.cerner].map((v, j) => (
                  <div key={j} style={{ textAlign: "center" }}>
                    <span style={{ fontSize: 15, color: v ? T.teal : "#2a4f7a" }}>{v ? "✓" : "✕"}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: T.txt4, marginTop: 8, textAlign: "center", fontStyle: "italic" }}>
            Comparison based on publicly available feature documentation as of 2025. Epic and Cerner are trademarks of their respective owners.
          </p>
        </div>

        {/* ── CTA ── */}
        <div style={{ textAlign: "center", padding: "48px 32px", background: T.panel, border: `1px solid ${T.bd}`, borderRadius: 20 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🚀</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: T.txt, marginBottom: 12 }}>
            The future of clinical documentation is here.
          </h2>
          <p style={{ fontSize: 14, color: T.txt3, maxWidth: 500, margin: "0 auto 28px", lineHeight: 1.75 }}>
            Notrya is in active development. Features ship weekly. Every design decision is made with one question: does this help the provider take better care of patients faster?
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/NewPatientInput?tab=demo" style={{ padding: "12px 28px", borderRadius: 10, background: T.teal, color: "#050f1e", fontWeight: 700, fontSize: 14, textDecoration: "none", display: "inline-block" }}>
              Try New Patient Input →
            </a>
            <a href="/landing" style={{ padding: "12px 28px", borderRadius: 10, background: "transparent", color: T.blue, border: `1px solid rgba(59,158,255,.4)`, fontWeight: 600, fontSize: 14, textDecoration: "none", display: "inline-block" }}>
              Learn More
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}