import { useState } from "react";
import { useNavigate } from "react-router-dom";

(() => {
  if (typeof document === "undefined") return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap";
  document.head.appendChild(l);
})();

const T = {
  bg: "#0a1628",
  glass: "rgba(255,255,255,0.04)",
  glassMid: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.08)",
  teal: "#14b8a6", gold: "#f59e0b", coral: "#f43f5e",
  green: "#22c55e", blue: "#3b82f6", purple: "#a78bfa",
  white: "#f0f4f8", muted: "rgba(240,244,248,0.55)", dim: "rgba(240,244,248,0.28)",
  sans: "'DM Sans', sans-serif", serif: "'Playfair Display', serif",
};

const CATEGORIES = [
  {
    label: "Resuscitation", color: T.coral, icon: "🚨",
    protocols: [
      { name: "Sepsis / Septic Shock",            desc: "Hour-1 bundle · empiric ABX · vasopressor ladder",                              page: "SepsisHub" },
      { name: "Anaphylaxis",                       desc: "Epinephrine dosing · 2nd-line agents · biphasic risk · disposition",            page: "AnaphylaxisHub" },
      { name: "Airway / RSI",                      desc: "Pre-oxygenation · induction + paralytic selection · failed airway algorithm",   page: "AirwayRSIHub" },
    ],
  },
  {
    label: "Neurologic", color: T.purple, icon: "🧠",
    protocols: [
      { name: "Status Epilepticus",                desc: "Benzodiazepine → levetiracetam → phenytoin → anesthetic ladder",               page: "StatusEpilepticusHub" },
      { name: "Hypertensive Emergency",            desc: "End-organ targeted agent selection · MAP reduction targets",                    page: "HypertensiveEmergencyHub" },
      { name: "Meningitis",                        desc: "Dex before antibiotics · empiric coverage by age/risk · LP decision",          page: "MeningitisHub" },
    ],
  },
  {
    label: "Metabolic", color: T.teal, icon: "⚗️",
    protocols: [
      { name: "DKA / HHS",                        desc: "Fluid replacement · insulin protocol · K⁺ replacement · anion gap closure",    page: "DKAHub" },
      { name: "Hyperkalemia",                      desc: "C-DIGFAST · membrane stabilization → shift → eliminate ladder",                page: "HyperkalemiaHub" },
      { name: "Rhabdomyolysis",                    desc: "Aggressive IVF protocol · urine alkalization · CK trending · complications",   page: "RhabdomyolysisHub" },
    ],
  },
  {
    label: "Cardiac / Pulmonary", color: T.blue, icon: "❤️",
    protocols: [
      { name: "Massive / Submassive PE",           desc: "Risk stratification · anticoagulation selection · thrombolytic decision tree",  page: "MassivePEHub" },
      { name: "Acute Decompensated Heart Failure", desc: "NPPV criteria · diuretic dosing · vasodilator selection · disposition triggers", page: "ADHFHub" },
    ],
  },
  {
    label: "Endocrine / Other", color: T.gold, icon: "🔬",
    protocols: [
      { name: "Adrenal Crisis",                   desc: "Hydrocortisone dosing · resuscitation · precipitant identification",            page: "AdrenalCrisisHub" },
      { name: "Thyroid Storm",                     desc: "Burch-Wartofsky score · PTU → iodine → propranolol → dexamethasone",           page: "ThyroidStormHub" },
      { name: "Acute Liver Failure",               desc: "NAC protocol · encephalopathy grading · transplant criteria · ICU triggers",   page: "AcuteLiverFailureHub" },
    ],
  },
];

function ProtocolCard({ p, color, onNavigate }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => onNavigate(p.page)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 16px",
        background: hovered ? "rgba(255,255,255,0.07)" : T.glass,
        backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
        border: `1px solid ${hovered ? color + "55" : T.border}`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 12, cursor: "pointer",
        transition: "all 0.18s",
        transform: hovered ? "translateX(3px)" : "none",
      }}
    >
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.green, boxShadow: `0 0 6px ${T.green}`, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 3 }}>{p.name}</div>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{p.desc}</div>
      </div>
      <div style={{ fontSize: 16, color: hovered ? color : T.dim, transition: "color 0.18s", flexShrink: 0 }}>→</div>
    </div>
  );
}

export default function CriticalProtocolsPage({ onBack, onNavigate }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleNavigate = (page) => onNavigate ? onNavigate(page) : navigate(`/${page}`);
  const handleBack     = ()     => onBack     ? onBack()         : navigate(-1);

  const q = query.toLowerCase().trim();
  const filtered = CATEGORIES
    .map(cat => ({
      ...cat,
      protocols: cat.protocols.filter(p =>
        !q || p.name.toLowerCase().includes(q) || cat.label.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
      ),
    }))
    .filter(cat => cat.protocols.length > 0);

  const total = CATEGORIES.reduce((n, c) => n + c.protocols.length, 0);

  return (
    <div style={{
      minHeight: "100vh",
      background: `radial-gradient(ellipse 65% 40% at 10% 0%, rgba(20,184,166,0.10) 0%, transparent 60%), radial-gradient(ellipse 55% 35% at 90% 100%, rgba(244,63,94,0.08) 0%, transparent 55%), ${T.bg}`,
      fontFamily: T.sans, color: T.white, paddingBottom: 80,
    }}>

      {/* Header */}
      <div style={{ padding: "24px 20px 0" }}>
        <button onClick={handleBack}
          style={{ background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 18 }}>
          ← Hub Selector
        </button>

        <div style={{ marginBottom: 10 }}>
          {[
            { label: "⚡ Critical Care",     bg: "linear-gradient(135deg,#f43f5e,#be185d)" },
            { label: "ACEP / SSC Aligned",   bg: "linear-gradient(135deg,#0d9488,#065f46)" },
          ].map(b => (
            <span key={b.label} style={{ display: "inline-block", background: b.bg, borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginRight: 6 }}>
              {b.label}
            </span>
          ))}
        </div>

        <h1 style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 700, margin: "0 0 6px", lineHeight: 1.1 }}>Critical Protocols</h1>
        <p style={{ color: T.muted, fontSize: 13, margin: "0 0 20px" }}>Evidence-based ED resuscitation pathways · {total} protocols</p>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 24 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: T.dim, pointerEvents: "none" }}>⌕</span>
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search protocols, categories…"
            style={{
              width: "100%", padding: "10px 14px 10px 36px",
              background: T.glassMid, border: `1px solid ${query ? T.teal + "60" : T.border}`,
              borderRadius: 10, color: T.white, fontSize: 13, fontFamily: T.sans,
              outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
            }}
          />
          {query && (
            <button onClick={() => setQuery("")}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.dim, cursor: "pointer", fontSize: 16 }}>
              ×
            </button>
          )}
        </div>
      </div>

      {/* Protocol List */}
      <div style={{ padding: "0 20px" }}>
        {filtered.length === 0 && (
          <div style={{ background: T.glass, border: `1px solid ${T.border}`, borderRadius: 14, padding: "32px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
            <div style={{ color: T.muted, fontSize: 13 }}>No protocols match "{query}"</div>
          </div>
        )}

        {filtered.map(cat => (
          <div key={cat.label} style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 3, height: 20, background: cat.color, borderRadius: 2 }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: cat.color }}>
                {cat.icon} {cat.label}
              </span>
              <div style={{ flex: 1, height: 1, background: cat.color + "25" }} />
              <span style={{ fontSize: 11, color: T.dim }}>{cat.protocols.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {cat.protocols.map(p => (
                <ProtocolCard key={p.page} p={p} color={cat.color} onNavigate={handleNavigate} />
              ))}
            </div>
          </div>
        ))}

        <div style={{ background: T.glass, border: `1px solid rgba(255,255,255,0.05)`, borderRadius: 10, padding: "12px 16px", marginTop: 8 }}>
          <p style={{ fontSize: 11, color: T.dim, margin: 0, lineHeight: 1.6, textAlign: "center" }}>
            All protocols reflect current evidence-based guidelines (SSC 2021, ACEP, AHA, AES).<br />
            Always apply clinical judgment. Not a substitute for institutional policies.
          </p>
        </div>
      </div>
    </div>
  );
}