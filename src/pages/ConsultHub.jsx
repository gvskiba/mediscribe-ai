import { useState } from "react";
import { useNavigate } from "react-router-dom";

/* ─── DESIGN TOKENS ─────────────────────────────────── */
const T = {
  bg: "#050f1e", panel: "#081628", card: "#0b1e36", up: "#0e2544",
  bd: "#1a3555", bhi: "#2a4f7a", blue: "#3b9eff", teal: "#00e5c0",
  gold: "#f5c842", coral: "#ff6b6b", orange: "#ff9f43", purple: "#9b6dff",
  txt: "#e8f0fe", txt2: "#8aaccc", txt3: "#4a6a8a", txt4: "#2e4a6a",
};

/* ─── CONSULT DATA ──────────────────────────────────── */
const SPECIALTIES = [
  {
    id: "cardiology",
    icon: "🫀",
    label: "Cardiology",
    color: "#ff6b6b",
    glow: "rgba(255,107,107,0.3)",
    glass: "rgba(255,107,107,0.07)",
    border: "rgba(255,107,107,0.3)",
    indications: ["STEMI/NSTEMI", "New CHF exacerbation", "Unstable arrhythmia", "Endocarditis", "Cardiac tamponade", "Pre-op clearance (high-risk)"],
    mustProvide: ["ECG (with timestamp)", "Troponin trend", "Echo if available", "Current BP & HR", "Medication list (anticoagulants)", "Last cath / EF"],
    questions: ["Is this ischemia or demand?", "Anticoagulate or hold?", "Cath lab activation criteria met?", "Admit to tele or CCU?"],
    pearls: ["Always have a 12-lead in hand before calling.", "Know the EF if you have it — changes everything.", "Troponin trend matters more than single value."],
  },
  {
    id: "neurology",
    icon: "🧠",
    label: "Neurology",
    color: "#9b6dff",
    glow: "rgba(155,109,255,0.3)",
    glass: "rgba(155,109,255,0.07)",
    border: "rgba(155,109,255,0.28)",
    indications: ["Acute stroke / TIA", "New seizure or status epilepticus", "Altered mental status (unexplained)", "Meningitis/encephalitis", "Guillain-Barré", "CNS mass lesion"],
    mustProvide: ["NIHSS score", "Last known well time", "CT/MRI results", "BP (current & trend)", "Medications (anticoagulants, AEDs)", "Full neuro exam"],
    questions: ["tPA candidate?", "EVT candidate? (LVO?)", "EEG needed?", "LP indicated?"],
    pearls: ["Last known well ≠ last seen well.", "Time is brain — call early.", "NIHSS before you pick up the phone."],
  },
  {
    id: "surgery",
    icon: "✂️",
    label: "General Surgery",
    color: "#ff9f43",
    glow: "rgba(255,159,67,0.3)",
    glass: "rgba(255,159,67,0.07)",
    border: "rgba(255,159,67,0.28)",
    indications: ["Acute abdomen", "Bowel obstruction", "Appendicitis", "Perforated viscus", "GI bleed (surgical)", "Incarcerated hernia"],
    mustProvide: ["Vitals trend", "WBC & lactate", "CT abdomen/pelvis (with contrast if possible)", "Last PO / bowel function", "Peritoneal signs on exam", "NPO status"],
    questions: ["OR now vs monitor?", "IV access adequate?", "Consent obtained?", "Anesthesia notified?"],
    pearls: ["Never delay CT for surgical consult.", "Lactate predicts severity.", "Document peritoneal signs carefully."],
  },
  {
    id: "nephrology",
    icon: "🫘",
    label: "Nephrology",
    color: "#00e5c0",
    glow: "rgba(0,229,192,0.3)",
    glass: "rgba(0,229,192,0.07)",
    border: "rgba(0,229,192,0.28)",
    indications: ["AKI requiring dialysis", "Severe hyperkalemia (>6.5)", "Refractory acidosis", "Hypertensive emergency with AKI", "Nephrotic/nephritic syndrome", "CKD exacerbation"],
    mustProvide: ["Creatinine trend (baseline vs current)", "BMP / potassium", "Urine output (hourly if critical)", "UA + urine lytes", "Volume status assessment", "Nephrotoxin exposure history"],
    questions: ["CRRT vs HD?", "Indication for emergent dialysis?", "Fluid resuscitate or restrict?", "Biopsy candidate?"],
    pearls: ["Always get a baseline creatinine.", "FeNa <1% suggests prerenal (but not always).", "Kayexalate takes hours — treat K+ acutely first."],
  },
  {
    id: "pulmonology",
    icon: "🫁",
    label: "Pulmonology",
    color: "#3b9eff",
    glow: "rgba(59,158,255,0.3)",
    glass: "rgba(59,158,255,0.07)",
    border: "rgba(59,158,255,0.28)",
    indications: ["Respiratory failure / intubation decision", "ARDS", "Massive hemoptysis", "Pleural effusion (diagnostic/therapeutic)", "Difficult to wean from vent", "ILD exacerbation"],
    mustProvide: ["ABG (current)", "CXR / CT chest", "O2 requirements trend", "Vent settings if intubated", "PFTs if available", "Sputum / culture data"],
    questions: ["Intubate now vs trial HFNC/BiPAP?", "Bronchoscopy indicated?", "Thoracentesis safe?", "ARDS criteria met?"],
    pearls: ["Don't wait for ABG to intubate if work of breathing is high.", "Low tidal volume 6 mL/kg IBW in ARDS.", "Bilateral effusions in HF — tap if diagnostic uncertainty."],
  },
  {
    id: "gastro",
    icon: "🩺",
    label: "Gastroenterology",
    color: "#f5c842",
    glow: "rgba(245,200,66,0.3)",
    glass: "rgba(245,200,66,0.07)",
    border: "rgba(245,200,66,0.28)",
    indications: ["Upper GI bleed", "Lower GI bleed (ongoing)", "Acute liver failure", "Cholangitis", "Severe pancreatitis", "IBD flare"],
    mustProvide: ["Hemoglobin trend", "Vitals (HR/BP)", "Last scope & findings", "MELD score if liver disease", "Anticoagulation status", "PPI/octreotide given?"],
    questions: ["Scope urgently (<12h) or elective?", "Octreotide / terlipressin?", "TIPS candidate?", "Transplant evaluation?"],
    pearls: ["Rockford/Glasgow-Blatchford score before calling.", "Hold anticoagulants — discuss reversal.", "MRCP before ERCP for cholangitis."],
  },
  {
    id: "infectious",
    icon: "🦠",
    label: "Infectious Disease",
    color: "#3dffa0",
    glow: "rgba(61,255,160,0.3)",
    glass: "rgba(61,255,160,0.07)",
    border: "rgba(61,255,160,0.25)",
    indications: ["Sepsis with unclear source", "MDR organism", "Fungal infection", "HIV with opportunistic infection", "Endocarditis", "CNS infection"],
    mustProvide: ["Blood cultures (before abx)", "Source of infection", "Antibiotic history & sensitivities", "Travel/exposure history", "Immune status (HIV, transplant, chemo)", "Current abx & duration"],
    questions: ["De-escalate or broaden?", "Duration of therapy?", "Source control achieved?", "Repeat cultures needed?"],
    pearls: ["Cultures before antibiotics — always.", "ID loves knowing the source control plan.", "Ask about prior cultures / sensitivities."],
  },
  {
    id: "ortho",
    icon: "🦴",
    label: "Orthopedics",
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.3)",
    glass: "rgba(167,139,250,0.07)",
    border: "rgba(167,139,250,0.28)",
    indications: ["Open fracture", "Hip fracture (admit)", "Septic joint", "Compartment syndrome", "Cauda equina syndrome", "Traumatic dislocation (failed reduction)"],
    mustProvide: ["X-rays (minimum 2 views)", "NV status distal to injury", "Time of injury", "Mechanism", "Last tetanus (open fractures)", "Antibiotic given for open fx?"],
    questions: ["OR urgency (emergent vs next available)?", "Splint or reduce in ED?", "Ortho admit vs discharge with follow-up?", "Compartment pressures needed?"],
    pearls: ["NV exam before and after any reduction.", "Open fractures: cefazolin within 1 hour.", "Compartment syndrome: do not elevate above heart."],
  },
];

const CONSULT_TIPS = [
  { icon: "📞", tip: "Identify yourself, your role, and your location first." },
  { icon: "🎯", tip: "State your ask clearly: 'I need an urgent/routine consult for...'" },
  { icon: "📋", tip: "Use SBAR: Situation → Background → Assessment → Recommendation." },
  { icon: "⏱️", tip: "Have vitals, key labs, and imaging in front of you before calling." },
  { icon: "🔬", tip: "Know the results — don't just say 'labs are pending'." },
  { icon: "🤝", tip: "Document: who you called, when, and their recommendations." },
];

/* ─── SBAR BUILDER ──────────────────────────────────── */
function SBARBuilder({ onClose }) {
  const [sbar, setSbar] = useState({ situation: "", background: "", assessment: "", recommendation: "" });
  const [copied, setCopied] = useState(false);

  const fields = [
    { key: "situation", label: "Situation", placeholder: "I'm calling about [patient], a [age]yo [sex] with [chief complaint]...", icon: "🔴" },
    { key: "background", label: "Background", placeholder: "Relevant history: PMH, current meds, allergies, vitals, key labs/imaging...", icon: "🟡" },
    { key: "assessment", label: "Assessment", placeholder: "I think the problem is... differential includes...", icon: "🟠" },
    { key: "recommendation", label: "Recommendation / Ask", placeholder: "I'd like you to come see the patient / recommend... / advise on...", icon: "🟢" },
  ];

  const fullText = fields.map(f => `${f.label.toUpperCase()}:\n${sbar[f.key]}`).filter(f => f.split("\n")[1]).join("\n\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(3,8,16,0.85)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: T.panel, border: `1px solid ${T.bd}`, borderRadius: 20, width: "100%", maxWidth: 640, maxHeight: "90vh", overflow: "auto", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: T.txt }}>SBAR Builder</div>
            <div style={{ fontSize: 11, color: T.txt3, marginTop: 2 }}>Structure your consult call</div>
          </div>
          <button onClick={onClose} style={{ background: T.up, border: `1px solid ${T.bd}`, borderRadius: 8, color: T.txt3, padding: "6px 14px", cursor: "pointer", fontSize: 13 }}>✕ Close</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {fields.map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.txt2, textTransform: "uppercase", letterSpacing: ".06em", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                {f.icon} {f.label}
              </label>
              <textarea
                rows={3}
                placeholder={f.placeholder}
                value={sbar[f.key]}
                onChange={e => setSbar(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: "100%", background: T.up, border: `1px solid ${T.bd}`, borderRadius: 10, padding: "10px 14px", color: T.txt, fontSize: 13, fontFamily: "'DM Sans',sans-serif", resize: "vertical", outline: "none", lineHeight: 1.5 }}
              />
            </div>
          ))}
        </div>
        {fullText && (
          <div style={{ marginTop: 16 }}>
            <button onClick={handleCopy} style={{ background: copied ? "rgba(0,229,192,0.15)" : T.up, border: `1px solid ${copied ? T.teal : T.bd}`, borderRadius: 10, color: copied ? T.teal : T.txt2, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600, width: "100%" }}>
              {copied ? "✓ Copied!" : "📋 Copy SBAR Script"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── SPECIALTY CARD ────────────────────────────────── */
function SpecialtyCard({ spec, isActive, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: isActive ? spec.glass.replace("0.07", "0.18") : hov ? spec.glass : "rgba(8,22,40,0.6)",
        border: `1px solid ${isActive ? spec.border : hov ? spec.border : T.bd}`,
        borderRadius: 14, padding: "14px 16px", cursor: "pointer",
        transition: "all 0.2s", display: "flex", alignItems: "center", gap: 12,
        boxShadow: isActive ? `0 0 20px ${spec.glow}` : "none",
      }}
    >
      <span style={{ fontSize: 24 }}>{spec.icon}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? spec.color : T.txt2 }}>{spec.label}</span>
    </div>
  );
}

/* ─── DETAIL PANEL ──────────────────────────────────── */
function DetailPanel({ spec }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ background: spec.glass.replace("0.07", "0.15"), border: `1px solid ${spec.border}`, borderRadius: 16, padding: "20px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${spec.color}, transparent)`, borderRadius: "16px 16px 0 0" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: spec.glass.replace("0.07", "0.25"), border: `1px solid ${spec.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>{spec.icon}</div>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: T.txt }}>{spec.label} Consult</div>
            <div style={{ fontSize: 12, color: T.txt3, marginTop: 3 }}>Quick reference guide for effective consults</div>
          </div>
        </div>
      </div>

      {/* 3 columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {/* Indications */}
        <div style={{ background: "rgba(8,22,40,0.7)", border: `1px solid ${T.bd}`, borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: T.teal, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 10, fontWeight: 700 }}>📋 Indications</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {spec.indications.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12, color: T.txt2, lineHeight: 1.4 }}>
                <span style={{ color: spec.color, flexShrink: 0, marginTop: 1 }}>•</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Must Provide */}
        <div style={{ background: "rgba(8,22,40,0.7)", border: `1px solid ${T.bd}`, borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: T.gold, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 10, fontWeight: 700 }}>📦 Must Have Ready</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {spec.mustProvide.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12, color: T.txt2, lineHeight: 1.4 }}>
                <span style={{ color: T.gold, flexShrink: 0, marginTop: 1 }}>✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Key Questions */}
        <div style={{ background: "rgba(8,22,40,0.7)", border: `1px solid ${T.bd}`, borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: T.orange, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 10, fontWeight: 700 }}>❓ Key Questions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {spec.questions.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12, color: T.txt2, lineHeight: 1.4 }}>
                <span style={{ color: T.orange, flexShrink: 0, marginTop: 1 }}>→</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pearls */}
      <div style={{ background: "rgba(8,22,40,0.7)", border: `1px solid rgba(155,109,255,0.25)`, borderRadius: 14, padding: "16px 20px" }}>
        <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: T.purple, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 10, fontWeight: 700 }}>💡 Clinical Pearls</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {spec.pearls.map((p, i) => (
            <div key={i} style={{ background: "rgba(155,109,255,0.08)", border: "1px solid rgba(155,109,255,0.2)", borderRadius: 10, padding: "8px 14px", fontSize: 12, color: T.txt2, lineHeight: 1.5, flex: "1 1 200px" }}>
              {p}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ─────────────────────────────────────── */
export default function ConsultHub() {
  const navigate = useNavigate();
  const [activeSpec, setActiveSpec] = useState(SPECIALTIES[0]);
  const [showSBAR, setShowSBAR] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = SPECIALTIES.filter(s =>
    !search || s.label.toLowerCase().includes(search.toLowerCase()) ||
    s.indications.some(i => i.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.txt, fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        textarea:focus, input:focus { outline: none; border-color: rgba(0,229,192,0.5) !important; }
        textarea { font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #1a3555; border-radius: 3px; }
      `}</style>

      {showSBAR && <SBARBuilder onClose={() => setShowSBAR(false)} />}

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${T.bd}`, padding: "18px 32px", display: "flex", alignItems: "center", gap: 16, background: T.panel }}>
        <button onClick={() => navigate(-1)} style={{ background: T.up, border: `1px solid ${T.bd}`, borderRadius: 8, color: T.txt3, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>← Back</button>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,rgba(59,158,255,0.2),rgba(0,229,192,0.1))", border: `1px solid rgba(59,158,255,0.35)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📡</div>
        <div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: T.txt }}>Consult Hub</div>
          <div style={{ fontSize: 12, color: T.txt3 }}>Specialty consult preparation · SBAR builder · What to have ready</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <input
            placeholder="Search specialty or indication..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: T.up, border: `1px solid ${T.bd}`, borderRadius: 10, padding: "8px 16px", color: T.txt, fontSize: 13, width: 260 }}
          />
          <button
            onClick={() => setShowSBAR(true)}
            style={{ background: "rgba(0,229,192,0.12)", border: "1px solid rgba(0,229,192,0.35)", borderRadius: 10, color: T.teal, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
          >
            📋 SBAR Builder
          </button>
        </div>
      </div>

      {/* Quick tips strip */}
      <div style={{ background: "rgba(59,158,255,0.05)", borderBottom: `1px solid ${T.bd}`, padding: "10px 32px", display: "flex", gap: 24, overflowX: "auto" }}>
        {CONSULT_TIPS.map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0, fontSize: 11, color: T.txt3 }}>
            <span>{t.icon}</span>
            <span>{t.tip}</span>
          </div>
        ))}
      </div>

      {/* Body */}
      <div style={{ display: "flex", gap: 0, height: "calc(100vh - 130px)" }}>
        {/* Sidebar */}
        <div style={{ width: 220, flexShrink: 0, borderRight: `1px solid ${T.bd}`, padding: "16px 12px", overflowY: "auto", background: T.panel, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: T.txt4, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 4, paddingLeft: 4 }}>Specialties</div>
          {filtered.map(spec => (
            <SpecialtyCard key={spec.id} spec={spec} isActive={activeSpec?.id === spec.id} onClick={() => setActiveSpec(spec)} />
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 0", color: T.txt4, fontSize: 12 }}>No results for "{search}"</div>
          )}
        </div>

        {/* Detail */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {activeSpec ? <DetailPanel spec={activeSpec} /> : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: T.txt4, fontSize: 14 }}>
              Select a specialty to view consult guide
            </div>
          )}
        </div>
      </div>
    </div>
  );
}