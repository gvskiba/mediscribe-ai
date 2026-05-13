import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Font Loader ──────────────────────────────────────────────────────────────
(() => {
  if (typeof document === "undefined") return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap";
  document.head.appendChild(l);
})();

// ── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  bg: "#0a1628", glass: "rgba(255,255,255,0.04)", glassMid: "rgba(255,255,255,0.07)",
  glassHover: "rgba(255,255,255,0.09)", border: "rgba(255,255,255,0.08)",
  teal: "#14b8a6", gold: "#f59e0b", coral: "#f43f5e", green: "#22c55e",
  blue: "#3b82f6", purple: "#a78bfa", amber: "#fb923c", pink: "#f472b6",
  white: "#f0f4f8", muted: "rgba(240,244,248,0.55)", dim: "rgba(240,244,248,0.28)",
  sans: "'DM Sans', sans-serif", serif: "'Playfair Display', serif", mono: "'JetBrains Mono', monospace",
};
const G = (x = {}) => ({
  background: T.glass, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
  border: `1px solid ${T.border}`, borderRadius: 14, ...x,
});

// ── Protocol Data ─────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    label: "Resuscitation", color: T.coral, icon: "🚨",
    protocols: [
      { name: "Sepsis / Septic Shock",           desc: "Hour-1 bundle · empiric ABX by source · vasopressor ladder · POCUS",             page: "SepsisHub",               status: "live" },
      { name: "Anaphylaxis",                     desc: "Epinephrine dosing · 2nd-line agents · biphasic risk · disposition",             page: "AnaphylaxisHub",          status: "live" },
      { name: "Airway / RSI",                    desc: "LEMON · MOANS · 7 Ps · drug selector · failed airway · cricothyrotomy",          page: "AirwayRSIHub",            status: "live" },
      { name: "Cardiogenic Shock",               desc: "Hemodynamic profiles · inotropes · MCS · IABP · Impella decision tree",          page: "CardiogenicShockHub",     status: "building" },
      { name: "Massive GI Bleed",                desc: "Resuscitation · transfusion ratio · endoscopy timing · variceal vs non-variceal", page: "MassiveGIBleedHub",       status: "building" },
      { name: "Massive Transfusion Protocol",    desc: "1:1:1 ratio · TXA dosing · damage control resuscitation · product triggers",     page: "MTPHub",                  status: "building" },
      { name: "Heat Stroke",                     desc: "Classic vs exertional · cooling protocols · end-organ damage · ICU triggers",    page: "HeatStrokeHub",           status: "building" },
    ],
  },
  {
    label: "Neurologic", color: T.purple, icon: "🧠",
    protocols: [
      { name: "Status Epilepticus",              desc: "5-phase ladder · benzo → AED → anesthetic · VITAMINS causes",                    page: "StatusEpilepticusHub",    status: "live" },
      { name: "Hypertensive Emergency",          desc: "End-organ targeted agent selection · 9 scenarios · MAP reduction targets",        page: "HypertensiveEmergencyHub",status: "live" },
      { name: "Meningitis",                      desc: "Dex before antibiotics · empiric coverage by age · CSF profiles · LP calculator", page: "MeningitisHub",           status: "live" },
      { name: "Acute Ischemic Stroke",           desc: "tPA eligibility · thrombectomy window · NIHSS · BP management · imaging",        page: "AcuteIschemicStrokeHub",  status: "building" },
      { name: "Subarachnoid Hemorrhage",         desc: "Hunt-Hess grading · nimodipine · vasospasm · neurosurgery triggers",             page: "SAHHub",                  status: "building" },
      { name: "Myasthenic Crisis",               desc: "Cholinergic vs myasthenic · IVIG · plasmapheresis · ventilator weaning",         page: "MyasthenicCrisisHub",     status: "building" },
    ],
  },
  {
    label: "Metabolic", color: T.teal, icon: "⚗️",
    protocols: [
      { name: "DKA / HHS",                       desc: "AG calculator · 6 I's causes · fluid protocol · insulin + K⁺ replacement",       page: "DKAHub",                  status: "live" },
      { name: "Hyperkalemia",                    desc: "C-DIGFAST · ECG changes by level · stabilize → shift → eliminate",              page: "HyperkalemiaHub",         status: "live" },
      { name: "Rhabdomyolysis",                  desc: "CK severity classifier · MUSCLE causes · IVF calculator · AKI · compartment",   page: "RhabdomyolysisHub",       status: "live" },
      { name: "Severe Hyponatremia",             desc: "Symptomatic correction · 3% NaCl bolus · ODS prevention · SIADH workup",        page: "HyponatremiaHub",         status: "building" },
      { name: "Hypercalcemic Crisis",            desc: "Saline diuresis · bisphosphonates · calcitonin · dialysis · malignancy",        page: "HypercalcemiaHub",        status: "building" },
      { name: "Neuroleptic Malignant Syndrome",  desc: "NMS vs serotonin syndrome · bromocriptine · dantrolene · cooling protocol",     page: "NMSHub",                  status: "building" },
    ],
  },
  {
    label: "Cardiac / Pulmonary", color: T.blue, icon: "❤️",
    protocols: [
      { name: "Massive / Submassive PE",         desc: "sPESI · PERC + Wells · thrombolytic decision tree · anticoagulation dosing",    page: "MassivePEHub",            status: "live" },
      { name: "Acute Decompensated Heart Failure",desc: "Stevenson phenotypes · diuretic calculator · NPPV · inotropes",                page: "ADHFHub",                 status: "live" },
      { name: "STEMI",                           desc: "Door-to-balloon · lytics decision · cath lab activation · reperfusion",         page: "STEMIHub",                status: "building" },
      { name: "Cardiac Tamponade",               desc: "Beck's triad · echo findings · pericardiocentesis technique · drainage",        page: "CardiacTamponadeHub",     status: "building" },
      { name: "Status Asthmaticus",              desc: "NIPPV · heliox · magnesium · ketamine RSI · ventilator strategy",              page: "StatusAsthmaticusHub",    status: "building" },
      { name: "Tension Pneumothorax",            desc: "Clinical diagnosis · needle vs finger thoracostomy · tube thoracostomy",        page: "TensionPneumothoraxHub",  status: "building" },
    ],
  },
  {
    label: "Endocrine / Other", color: T.gold, icon: "🔬",
    protocols: [
      { name: "Adrenal Crisis",                  desc: "Primary vs secondary · 4 I's · hydrocortisone protocol · cosyntropin test",     page: "AdrenalCrisisHub",        status: "live" },
      { name: "Thyroid Storm",                   desc: "BWPS calculator · PTU before iodine · dexamethasone · complication management", page: "ThyroidStormHub",         status: "live" },
      { name: "Acute Liver Failure",             desc: "King's College criteria · NAC protocol · HE grading · MELD · transplant",       page: "AcuteLiverFailureHub",    status: "live" },
    ],
  },
  {
    label: "Toxicologic", color: T.amber, icon: "☠️",
    protocols: [
      { name: "Opioid Overdose",                 desc: "Naloxone dosing · routes · observation criteria · buprenorphine initiation",    page: "OpioidOverdoseHub",       status: "building" },
      { name: "Alcohol Withdrawal / DTs",        desc: "CIWA protocol · benzo ladder · phenobarbital · seizure prophylaxis",           page: "AlcoholWithdrawalHub",    status: "building" },
      { name: "Toxic Alcohol Poisoning",         desc: "Methanol · ethylene glycol · fomepizole · anion gap · dialysis indications",   page: "ToxicAlcoholHub",         status: "building" },
      { name: "Sympathomimetic Toxidrome",       desc: "Cocaine · meth · MDMA · benzo first · phentolamine · avoid beta-blockers",    page: "SympathomimeticHub",      status: "building" },
    ],
  },
  {
    label: "Hematologic", color: T.green, icon: "🩸",
    protocols: [
      { name: "TTP / HUS",                       desc: "ADAMTS13 · plasmapheresis urgency · avoid platelets · blood smear",            page: "TTPHub",                  status: "building" },
      { name: "Anticoagulant Reversal",           desc: "4-factor PCC · andexanet · idarucizumab · Vitamin K · warfarin vs DOAC",      page: "AnticoagulantReversalHub",status: "building" },
      { name: "Sickle Cell Crisis",              desc: "Vaso-occlusive · acute chest syndrome · exchange transfusion · hydroxyurea",   page: "SickleCellHub",          status: "building" },
    ],
  },
  {
    label: "Obstetric", color: T.pink, icon: "🤰",
    protocols: [
      { name: "Postpartum Hemorrhage",           desc: "Uterotonic ladder · massive transfusion · surgical escalation · Bakri balloon", page: "PostPartumHemorrhageHub", status: "building" },
      { name: "HELLP Syndrome",                  desc: "Diagnosis criteria · delivery timing · magnesium · steroids · platelet threshold",page: "HELLPHub",              status: "building" },
    ],
  },
];

const TOTAL    = CATEGORIES.reduce((n, c) => n + c.protocols.length, 0);
const LIVE     = CATEGORIES.reduce((n, c) => n + c.protocols.filter(p => p.status === "live").length, 0);
const BUILDING = TOTAL - LIVE;

// ── Component ─────────────────────────────────────────────────────────────────
export default function CriticalProtocolsPage({ onBack, onNavigate }) {
  const [query, setQuery]           = useState("");
  const [filter, setFilter]         = useState("all");
  const [hoveredCard, setHoveredCard] = useState(null);
  const routerNavigate = useNavigate();
  const handleNavigate = (page) => {
    if (onNavigate) { onNavigate(page); } else { routerNavigate(`/${page}`); }
  };

  const q = query.toLowerCase().trim();
  const filtered = CATEGORIES.map(cat => ({
    ...cat,
    protocols: cat.protocols.filter(p => {
      const matchQ = !q || p.name.toLowerCase().includes(q) || cat.label.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q);
      const matchF = filter === "all" || p.status === filter;
      return matchQ && matchF;
    }),
  })).filter(cat => cat.protocols.length > 0);

  return (
    <div style={{
      minHeight: "100vh",
      background: `
        radial-gradient(ellipse 65% 40% at 10% 0%, rgba(20,184,166,0.10) 0%, transparent 60%),
        radial-gradient(ellipse 55% 35% at 90% 100%, rgba(244,63,94,0.08) 0%, transparent 55%),
        radial-gradient(ellipse 40% 30% at 50% 50%, rgba(59,130,246,0.04) 0%, transparent 60%),
        ${T.bg}`,
      fontFamily: T.sans, color: T.white, paddingBottom: 80,
    }}>

      {/* ── Header ── */}
      <div style={{ padding: "24px 20px 0" }}>
        {onBack && (
          <button onClick={onBack}
            style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 18 }}>
            ← Hub Selector
          </button>
        )}

        <div style={{ marginBottom: 10 }}>
          {[{ label: "⚡ Critical Care", bg: "linear-gradient(135deg,#f43f5e,#be185d)" },
            { label: "ACEP / SSC / AHA Aligned", bg: "linear-gradient(135deg,#0d9488,#065f46)" }].map(b => (
            <span key={b.label} style={{ display: "inline-block", background: b.bg, borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginRight: 6 }}>{b.label}</span>
          ))}
        </div>

        <h1 style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 700, margin: "0 0 6px", lineHeight: 1.1 }}>Critical Protocols</h1>
        <p style={{ color: T.muted, fontSize: 13, margin: "0 0 14px" }}>
          Evidence-based ED resuscitation pathways · {TOTAL} protocols across {CATEGORIES.length} categories
        </p>

        {/* Live / Building stats */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {[{ label: `${LIVE} Live`, color: T.green }, { label: `${BUILDING} Building`, color: T.gold }].map(({ label, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: color === T.green ? `0 0 5px ${color}` : "none" }} />
              <span style={{ fontSize: 12, color: T.muted }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: T.border, borderRadius: 2, marginBottom: 18, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(LIVE / TOTAL) * 100}%`, background: `linear-gradient(90deg, ${T.teal}, ${T.blue})`, borderRadius: 2, transition: "width 0.5s" }} />
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: T.dim, pointerEvents: "none" }}>⌕</span>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search protocols, categories…"
            style={{ width: "100%", padding: "10px 14px 10px 36px", background: T.glassMid, border: `1px solid ${query ? T.teal + "60" : T.border}`, borderRadius: 10, color: T.white, fontSize: 13, fontFamily: T.sans, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }} />
          {query && (
            <button onClick={() => setQuery("")}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.dim, cursor: "pointer", fontSize: 16 }}>×</button>
          )}
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 6, marginBottom: 22 }}>
          {[{ k: "all", label: `All  ${TOTAL}` }, { k: "live", label: `✓ Live  ${LIVE}` }, { k: "building", label: `⟳ Building  ${BUILDING}` }].map(({ k, label }) => (
            <button key={k} onClick={() => setFilter(k)}
              style={{ padding: "5px 13px", borderRadius: 8, border: `1.5px solid ${filter === k ? T.teal : T.border}`, background: filter === k ? "rgba(20,184,166,0.15)" : T.glass, color: filter === k ? T.teal : T.muted, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, transition: "all 0.15s" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Protocol Categories ── */}
      <div style={{ padding: "0 20px" }}>
        {filtered.length === 0 && (
          <div style={{ ...G(), padding: "32px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
            <div style={{ color: T.muted, fontSize: 13 }}>No protocols match "{query}"</div>
          </div>
        )}

        {filtered.map(cat => (
          <div key={cat.label} style={{ marginBottom: 28 }}>
            {/* Category Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 3, height: 20, background: cat.color, borderRadius: 2 }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: cat.color }}>
                {cat.icon} {cat.label}
              </span>
              <div style={{ flex: 1, height: 1, background: cat.color + "25" }} />
              <span style={{ fontSize: 11, color: T.dim }}>{cat.protocols.filter(p => p.status === "live").length}/{cat.protocols.length}</span>
            </div>

            {/* Protocol Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {cat.protocols.map(p => {
                const isLive    = p.status === "live";
                const isHovered = hoveredCard === p.page && isLive;
                return (
                  <div key={p.page}
                    onClick={() => isLive && handleNavigate(p.page)}
                    onMouseEnter={() => setHoveredCard(p.page)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "13px 16px",
                      background: isHovered ? T.glassHover : T.glass,
                      backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
                      border: `1px solid ${isHovered ? cat.color + "55" : T.border}`,
                      borderLeft: `3px solid ${isLive ? cat.color : T.border}`,
                      borderRadius: 12,
                      cursor: isLive ? "pointer" : "default",
                      transition: "all 0.18s",
                      transform: isHovered ? "translateX(3px)" : "translateX(0)",
                      opacity: isLive ? 1 : 0.6,
                    }}>

                    {/* Status dot */}
                    <div style={{ flexShrink: 0 }}>
                      {isLive
                        ? <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.green, boxShadow: `0 0 6px ${T.green}` }} />
                        : <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.gold, opacity: 0.7 }} />
                      }
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: T.white }}>{p.name}</span>
                        {!isLive && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: T.gold, background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 4, padding: "1px 6px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                            Building
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{p.desc}</div>
                    </div>

                    {/* Arrow */}
                    <div style={{ fontSize: 15, color: isHovered ? cat.color : T.dim, transition: "color 0.18s", flexShrink: 0 }}>
                      {isLive ? "→" : "⟳"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div style={{ ...G({ borderRadius: 10 }), padding: "12px 16px", marginTop: 8, borderColor: "rgba(255,255,255,0.05)" }}>
          <p style={{ fontSize: 11, color: T.dim, margin: 0, lineHeight: 1.6, textAlign: "center" }}>
            All protocols reflect current evidence-based guidelines (SSC 2021, ACEP, AHA, AES, AASLD, ASH).<br />
            Always apply clinical judgment. Not a substitute for institutional policies.
          </p>
        </div>
      </div>
    </div>
  );
}