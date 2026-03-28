import { useState } from "react";
import { useNavigate } from "react-router-dom";

const T = {
  bg: "#050f1e", panel: "rgba(8,22,40,0.72)", card: "rgba(11,30,54,0.6)",
  border: "rgba(26,53,85,0.8)", borderHi: "rgba(42,79,122,0.9)",
  orange: "#ff9f43", orangeGlow: "rgba(255,159,67,0.35)", orangeGlass: "rgba(255,159,67,0.08)",
  teal: "#00e5c0", blue: "#3b9eff", coral: "#ff6b6b", gold: "#f5c842", green: "#3dffa0",
  txt: "#e8f0fe", txt2: "#8aaccc", txt3: "#4a6a8a", txt4: "#2e4a6a",
};

const PROTOCOLS = [
  {
    id: "primary_survey",
    icon: "🔍",
    title: "Primary Survey (ABCDE)",
    badge: "ATLS 10th Ed",
    color: T.orange,
    steps: [
      { letter: "A", label: "Airway + C-Spine", items: ["Assess patency — look, listen, feel", "Jaw thrust (suspected C-spine injury)", "OPA/NPA if unconscious", "RSI if GCS ≤ 8 or airway compromise", "Inline C-spine stabilisation — do NOT remove collar"] },
      { letter: "B", label: "Breathing", items: ["Inspect, auscultate, percuss", "SpO₂ target > 95%", "Tension PTX — needle decompression 2nd ICS MCL", "Open PTX — 3-sided occlusive dressing", "Massive haemothorax — chest tube 5th ICS AAL", "Flail chest — positive pressure ventilation"] },
      { letter: "C", label: "Circulation / Haemorrhage", items: ["Direct pressure on external bleeding", "Tourniquet for extremity haemorrhage", "Pelvic binder if unstable pelvis", "2× large-bore IVs or IO access", "Massive transfusion: 1:1:1 pRBC:FFP:Plt", "Activate MTP if ABC score ≥ 2", "TXA within 3 hours of injury: 1g IV over 10 min"] },
      { letter: "D", label: "Disability (Neuro)", items: ["GCS — E + V + M", "Pupils: size, reactivity, asymmetry", "Blood glucose", "Spinal cord injury screen", "FAST-HEENT if altered"] },
      { letter: "E", label: "Exposure / Environment", items: ["Full exposure — cut away clothing", "Log-roll for posterior exam", "Prevent hypothermia — warm blankets, warm fluids", "Rectal exam if spinal injury suspected", "Secondary survey only after ABCDE complete"] },
    ],
  },
  {
    id: "hemorrhage",
    icon: "🩸",
    title: "Haemorrhage Control",
    badge: "ATLS / TCCC",
    color: T.coral,
    steps: [
      { letter: "1", label: "External Bleeding", items: ["Direct pressure — minimum 3 minutes", "Wound packing (gauze/haemostatic agent)", "Tourniquet: 2–3 inches proximal to wound, note time", "Junctional tourniquet for groin/axilla wounds"] },
      { letter: "2", label: "Internal Bleeding — Pelvis", items: ["Pelvic binder at greater trochanter level", "FAST exam to identify free fluid", "Pelvic X-ray (AP) to identify fracture pattern", "Angioembolisation for arterial pelvic bleed", "Resuscitative Endovascular Balloon Occlusion of Aorta (REBOA) — Zone III"] },
      { letter: "3", label: "Internal Bleeding — Abdomen", items: ["FAST positive + haemodynamically unstable → OR", "FAST negative but suspect → CT abdomen/pelvis with contrast", "DPL if FAST indeterminate + haemo-instability", "Damage control surgery for ongoing haemorrhage"] },
      { letter: "4", label: "Massive Transfusion Protocol", items: ["Activate MTP: ABC score ≥ 2 or clinician judgement", "1:1:1 ratio pRBC : FFP : Platelets", "Calcium gluconate 1g IV after every 4 units pRBC", "Fibrinogen target > 1.5 g/L — give cryoprecipitate", "TXA ≤ 3 hours post-injury: 1g IV bolus + 1g over 8h", "Target: SBP 80–90 mmHg until surgical haemostasis"] },
    ],
  },
  {
    id: "tbi",
    icon: "🧠",
    title: "Traumatic Brain Injury",
    badge: "BTF / ATLS",
    color: T.blue,
    steps: [
      { letter: "1", label: "Severity Classification", items: ["Mild TBI: GCS 13–15", "Moderate TBI: GCS 9–12", "Severe TBI: GCS ≤ 8 — immediate intervention", "CT head: all GCS < 15, LOC, amnesia, focal deficit", "Canadian CT Head Rule for mild TBI"] },
      { letter: "2", label: "Initial Management", items: ["Airway protection: intubate if GCS ≤ 8", "Avoid hypoxia: SpO₂ > 95%, PaO₂ > 60 mmHg", "Avoid hypotension: SBP > 110 mmHg (age < 50)", "Head of bed 30° elevation", "Avoid hyperthermia: target normothermia", "Avoid hypoglycaemia and hyperglycaemia"] },
      { letter: "3", label: "ICP Management", items: ["Mannitol 0.25–1 g/kg IV (serum osm < 320)", "3% NaCl 250 mL IV bolus if mannitol unavailable", "Hyperventilate ONLY for acute herniation (PaCO₂ 35 mmHg)", "Neurosurgery consult for haematoma or midline shift", "ICP monitor if GCS ≤ 8 and abnormal CT", "Target CPP 60–70 mmHg"] },
      { letter: "4", label: "Herniation Signs", items: ["Cushing's triad: HTN + bradycardia + irregular resp", "Unilateral dilated pupil — uncal herniation", "Bilateral fixed dilated pupils — central herniation", "Decerebrate/decorticate posturing", "IMMEDIATE: hyperventilate, mannitol, neurosurgery"] },
    ],
  },
  {
    id: "spine",
    icon: "🦴",
    title: "Spinal Injury",
    badge: "NEXUS / CCR",
    color: T.gold,
    steps: [
      { letter: "1", label: "Clearance Criteria", items: ["NEXUS: 5 criteria — if ALL absent, no imaging needed", "Canadian C-Spine Rule: high-risk factors → CT", "Low-risk: CT C-spine over plain X-ray", "T/L spine imaging if pain/tenderness or mechanism", "MRI if neurological deficit or CT inconclusive"] },
      { letter: "2", label: "Immobilisation", items: ["Rigid cervical collar + long board OR scoop stretcher", "Inline stabilisation during transfers", "Remove board ASAP — max 2 hours to prevent pressure sores", "Keep collar until clinical clearance or imaging", "Log-roll technique for posterior exam"] },
      { letter: "3", label: "Neurogenic Shock", items: ["Bradycardia + hypotension (NOT tachycardia)", "Warm, flushed skin below level of injury", "Fluid resuscitation first-line", "Vasopressors if refractory: norepinephrine", "Atropine for bradycardia", "Target MAP > 85–90 mmHg for 7 days"] },
    ],
  },
  {
    id: "burns",
    icon: "🔥",
    title: "Burns Management",
    badge: "ABA Guidelines",
    color: "#ff8c42",
    steps: [
      { letter: "1", label: "Initial Assessment", items: ["Stop burning process — remove clothing/jewellery", "Airway: singed eyebrows/nasal hair, hoarse voice → intubate early", "TBSA calculation: Rule of Nines", "Depth classification: superficial, partial, full thickness", "Burn centre referral criteria: > 10% TBSA, face/hands/feet/genitals, full thickness"] },
      { letter: "2", label: "Fluid Resuscitation", items: ["Parkland formula: 4 mL × kg × %TBSA (2nd/3rd degree only)", "½ in first 8 hours from time of injury", "½ in next 16 hours", "Use Lactated Ringer's", "Titrate to UO 0.5–1 mL/kg/h (adults)", "Foley catheter for monitoring"] },
      { letter: "3", label: "Wound Care", items: ["Cool water (15–25°C) irrigation ≤ 20 min within 3 hours", "Do NOT use ice — causes vasoconstriction", "Non-adherent dressing (silver sulfadiazine / Mepitel)", "Tetanus prophylaxis if not up to date", "Analgesia: IV morphine or ketamine", "Escharotomy for circumferential full-thickness burns"] },
    ],
  },
];

const QUICK_REFS = [
  { icon: "🩹", label: "ABC Score", desc: "Massive transfusion prediction", detail: "HR > 120 + SBP ≤ 90 + penetrating + FAST+ = 1 pt each. Score ≥ 2 → activate MTP", color: T.orange },
  { icon: "📊", label: "Revised Trauma Score", desc: "Physiological severity", detail: "RTS = RR + SBP + GCS (coded). Score < 11 → significant mortality risk", color: T.coral },
  { icon: "🧮", label: "Injury Severity Score", desc: "Anatomical severity", detail: "ISS ≥ 16 = major trauma. Sum of squares of top 3 AIS scores in different body regions", color: T.blue },
  { icon: "🫀", label: "REBOA Zones", desc: "Aortic occlusion zones", detail: "Zone I (descending aorta) — torso bleeding. Zone III (infrarenal) — pelvic/junctional. Avoid Zone II", color: T.gold },
  { icon: "💉", label: "TXA Dosing", desc: "Tranexamic acid protocol", detail: "1g IV over 10 min within 3h of injury, then 1g over 8h. Do NOT give after 3h — harm", color: T.green },
  { icon: "🩺", label: "Permissive Hypotension", desc: "Haemostatic resuscitation", detail: "Target SBP 80–90 mmHg until surgical haemostasis. Avoid in TBI (maintain SBP > 110)", color: "#b99bff" },
];

function GlassBg() {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {[
        { x: "10%", y: "20%", r: 300, c: "rgba(255,159,67,0.06)" },
        { x: "85%", y: "12%", r: 260, c: "rgba(255,107,107,0.05)" },
        { x: "75%", y: "75%", r: 320, c: "rgba(59,158,255,0.05)" },
        { x: "20%", y: "80%", r: 200, c: "rgba(245,200,66,0.04)" },
        { x: "50%", y: "45%", r: 380, c: "rgba(255,159,67,0.03)" },
      ].map((o, i) => (
        <div key={i} style={{ position: "absolute", left: o.x, top: o.y, width: o.r * 2, height: o.r * 2, borderRadius: "50%", background: `radial-gradient(circle,${o.c} 0%,transparent 68%)`, transform: "translate(-50%,-50%)" }} />
      ))}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.035 }}>
        <defs><pattern id="tg" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0L0 0 0 40" fill="none" stroke="#ff9f43" strokeWidth="0.5" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#tg)" />
      </svg>
    </div>
  );
}

function ProtocolCard({ protocol, isOpen, onToggle }) {
  const [activeStep, setActiveStep] = useState(0);
  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${isOpen ? protocol.color + "40" : T.border}`, background: T.panel, backdropFilter: "blur(18px)", transition: "all 0.3s", boxShadow: isOpen ? `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${protocol.color}15` : "0 3px 14px rgba(0,0,0,0.3)" }}>
      <div onClick={onToggle} style={{ padding: "18px 22px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, background: isOpen ? `linear-gradient(135deg, ${protocol.color}10, transparent)` : "transparent", position: "relative" }}>
        {isOpen && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${protocol.color}, transparent)` }} />}
        <div style={{ width: 46, height: 46, borderRadius: 13, background: `${protocol.color}20`, border: `1px solid ${protocol.color}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{protocol.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: T.txt, marginBottom: 2 }}>{protocol.title}</div>
          <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${protocol.color}15`, border: `1px solid ${protocol.color}25`, color: protocol.color }}>{protocol.badge}</span>
        </div>
        <div style={{ fontSize: 18, color: T.txt3, transition: "transform 0.3s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>⌄</div>
      </div>

      {isOpen && (
        <div style={{ padding: "0 22px 20px" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {protocol.steps.map((step, i) => (
              <button key={i} onClick={() => setActiveStep(i)}
                style={{ padding: "6px 14px", borderRadius: 24, fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", transition: "all 0.2s", background: activeStep === i ? `${protocol.color}20` : "rgba(14,37,68,0.5)", border: `1px solid ${activeStep === i ? protocol.color + "45" : T.border}`, color: activeStep === i ? protocol.color : T.txt3 }}>
                {step.letter}. {step.label}
              </button>
            ))}
          </div>
          <div style={{ background: "rgba(14,37,68,0.5)", borderRadius: 12, padding: "14px 18px", border: `1px solid ${protocol.color}20` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: protocol.color, marginBottom: 10, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: ".06em" }}>{protocol.steps[activeStep].letter}. {protocol.steps[activeStep].label}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {protocol.steps[activeStep].items.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: protocol.color, flexShrink: 0, marginTop: 6 }} />
                  <span style={{ fontSize: 12, color: T.txt2, lineHeight: 1.55 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickRefCard({ ref: r }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ borderRadius: 14, padding: "14px 16px", background: hov ? `${r.color}10` : T.card, border: `1px solid ${hov ? r.color + "35" : T.border}`, backdropFilter: "blur(14px)", transition: "all 0.25s", transform: hov ? "translateY(-3px)" : "none", cursor: "default" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>{r.icon}</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.label}</div>
          <div style={{ fontSize: 10, color: T.txt3 }}>{r.desc}</div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: T.txt2, lineHeight: 1.5 }}>{r.detail}</div>
    </div>
  );
}

export default function TraumaHub() {
  const navigate = useNavigate();
  const [openProtocol, setOpenProtocol] = useState("primary_survey");

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Sans',sans-serif", position: "relative" }}>
      <GlassBg />
      <div style={{ position: "relative", zIndex: 1, padding: "32px 32px 60px", maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ borderRadius: 20, padding: "24px 28px 22px", background: T.panel, backdropFilter: "blur(24px)", border: "1px solid rgba(42,79,122,0.5)", marginBottom: 24, position: "relative", overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2.5, borderRadius: "20px 20px 0 0", background: "linear-gradient(90deg,#ff9f43,#ff6b6b,#f5c842)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <button onClick={() => navigate("/hub")} style={{ padding: "6px 14px", background: "rgba(14,37,68,0.6)", border: "1px solid rgba(42,79,122,0.6)", borderRadius: 10, color: T.txt3, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", flexShrink: 0, transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.color = T.orange; e.currentTarget.style.borderColor = "rgba(255,159,67,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = T.txt3; e.currentTarget.style.borderColor = "rgba(42,79,122,0.6)"; }}>
              ← Hub
            </button>
            <div style={{ width: 58, height: 58, borderRadius: 16, background: "linear-gradient(135deg,rgba(255,159,67,0.22),rgba(255,107,107,0.12))", border: "1px solid rgba(255,159,67,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0, boxShadow: "0 0 22px rgba(255,159,67,0.2)" }}>🩹</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: T.txt, lineHeight: 1 }}>Trauma Hub</span>
                <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "rgba(255,159,67,0.12)", color: T.orange, border: "1px solid rgba(255,159,67,0.3)", letterSpacing: ".06em" }}>ATLS 10th Ed</span>
              </div>
              <p style={{ fontSize: 12, color: T.txt2, margin: 0, lineHeight: 1.6 }}>ATLS · Primary Survey · Haemorrhage Control · TBI · Spinal Injury · Burns Management</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flexShrink: 0 }}>
              {[{ v: "5", l: "Protocols" }, { v: "ABCDE", l: "Framework" }, { v: "1:1:1", l: "MTP Ratio" }, { v: "< 3h", l: "TXA Window" }].map((s, i) => (
                <div key={i} style={{ textAlign: "center", background: "rgba(14,37,68,0.6)", borderRadius: 10, padding: "7px 12px", border: "1px solid rgba(26,53,85,0.8)" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: [T.orange, T.coral, T.gold, T.teal][i], fontFamily: "'JetBrains Mono',monospace", lineHeight: 1 }}>{s.v}</div>
                  <div style={{ fontSize: 9, color: T.txt4, marginTop: 2, textTransform: "uppercase", letterSpacing: ".06em" }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alert banner */}
        <div style={{ borderRadius: 12, padding: "10px 16px", background: "rgba(255,107,107,0.07)", border: "1px solid rgba(255,107,107,0.25)", marginBottom: 20, display: "flex", alignItems: "center", gap: 10, backdropFilter: "blur(10px)" }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span style={{ fontSize: 11, color: T.txt2 }}>
            <strong style={{ color: T.coral }}>Clinical Decision Support Only.</strong> Always follow your institution's trauma protocols and ATLS guidelines. Activate trauma team early for high-mechanism injuries.
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
          {/* Protocols */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: T.txt3, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 4 }}>Evidence-Based Protocols</div>
            {PROTOCOLS.map(p => (
              <ProtocolCard key={p.id} protocol={p} isOpen={openProtocol === p.id} onToggle={() => setOpenProtocol(openProtocol === p.id ? null : p.id)} />
            ))}
          </div>

          {/* Quick Reference */}
          <div style={{ position: "sticky", top: 24 }}>
            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: T.txt3, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>Quick Reference</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {QUICK_REFS.map((r, i) => <QuickRefCard key={i} ref={r} />)}
            </div>
            <div style={{ marginTop: 16, borderRadius: 12, padding: "12px 14px", background: T.panel, border: `1px solid rgba(255,159,67,0.2)`, backdropFilter: "blur(12px)" }}>
              <div style={{ fontSize: 10, color: T.orange, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, marginBottom: 6 }}>⚕ EVIDENCE BASE</div>
              {["ATLS 10th Edition", "TCCC Guidelines", "BTF Guidelines 2023", "ABA Burn Centre Criteria", "NEXUS / Canadian C-Spine Rule"].map((r, i) => (
                <div key={i} style={{ fontSize: 10, color: T.txt4, lineHeight: 1.8 }}>· {r}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        button { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #1a3555; border-radius: 2px; }
      `}</style>
    </div>
  );
}