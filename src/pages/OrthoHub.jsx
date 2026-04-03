import { useState } from "react";
import { useNavigate } from "react-router-dom";

(() => {
  if (document.getElementById("ortho-fonts")) return;
  const l = document.createElement("link"); l.id = "ortho-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "ortho-css";
  s.textContent = `
    *{box-sizing:border-box;margin:0;padding:0;}
    ::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-thumb{background:rgba(42,79,122,0.5);border-radius:2px;}
    @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    .ortho-fade{animation:fadeSlide .22s ease forwards;}
    .ortho-shimmer{background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#22d3ee 52%,#a78bfa 72%,#e8f0fe 100%);background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 5s linear infinite;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg: "#050f1e", panel: "#081628", card: "#0b1e36", up: "#0e2544",
  b: "rgba(26,53,85,0.8)", bhi: "rgba(42,79,122,0.9)",
  txt: "#e8f0fe", txt2: "#8aaccc", txt3: "#4a6a8a", txt4: "#2e4a6a",
  coral: "#ff6b6b", orange: "#ff9f43", yellow: "#f5c842",
  green: "#3dffa0", teal: "#00e5c0", blue: "#3b9eff",
  purple: "#a78bfa", cyan: "#22d3ee", bone: "#e8d5b7",
};

const glass = {
  backdropFilter: "blur(24px) saturate(200%)",
  WebkitBackdropFilter: "blur(24px) saturate(200%)",
  background: "rgba(8,22,40,0.78)",
  border: "1px solid rgba(42,79,122,0.35)",
  borderRadius: 14,
};

// ── Data ─────────────────────────────────────────────────────────────────────

const FRACTURE_MGMT = [
  {
    id: "hip", label: "Hip Fracture", icon: "🦴", color: T.coral, urgency: "high",
    types: ["Femoral neck (intracapsular)", "Intertrochanteric (extracapsular)", "Subtrochanteric"],
    workup: ["AP pelvis + lateral hip", "CBC, BMP, coags, type & screen", "EKG (pre-op)", "Chest X-ray", "Urinalysis"],
    management: [
      "Pain control: femoral nerve block preferred (reduces opioid requirements)",
      "Surgical timing: within 24–48 hours if medically optimized",
      "Femoral neck → hemiarthroplasty or THA (displaced); cannulated screws (non-displaced)",
      "Intertrochanteric → cephalomedullary nail (IM nail)",
      "DVT prophylaxis: LMWH or aspirin post-op",
      "PT/OT: weight-bearing as tolerated post-op",
    ],
    pearls: [
      "Garden classification for femoral neck: I (impacted valgus) → IV (complete displacement). Garden III–IV → arthroplasty.",
      "Do NOT delay surgery for cardiac work-up unless new instability. Delay > 48 h increases 30-day mortality.",
      "Trochanteric fractures → IM nail superior to sliding hip screw (DHS) for reverse-oblique or subtrochanteric patterns.",
      "Ottawa rules do NOT apply to hip — always image if clinical suspicion.",
    ],
    badge: "AAOS",
  },
  {
    id: "ankle", label: "Ankle Fracture", icon: "🦶", color: T.blue, urgency: "moderate",
    types: ["Weber A (below syndesmosis)", "Weber B (at syndesmosis)", "Weber C (above syndesmosis)", "Bimalleolar / Trimalleolar", "Maisonneuve fracture"],
    workup: ["AP, lateral, mortise views", "Ottawa Ankle Rules before imaging", "Stress mortise views (if Weber B + instability)", "CT if comminuted or posterior malleolus involved"],
    management: [
      "Weber A (stable): Short leg cast or boot, WB as tolerated, 4–6 weeks",
      "Weber B stable: Boot, weekly follow-up, repeat X-ray at 1 week",
      "Weber B unstable / Weber C: ORIF — fibula plate + syndesmotic screws if diastasis",
      "Bimalleolar / Trimalleolar: ORIF (medial malleolus screw + fibula plate)",
      "Posterior malleolus > 25% articular surface → fix",
      "Neurovascular check before and after splinting",
    ],
    pearls: [
      "Medial clear space > 4 mm = mortise instability → ORIF indicated.",
      "Maisonneuve: proximal fibula fracture + medial instability — check proximal fibula on every ankle injury.",
      "Syndesmotic injury: Cotton test and external rotation stress test intraoperatively.",
      "Post-reduction check for peroneal nerve (foot drop) and posterior tibial nerve (plantar sensation).",
    ],
    badge: "AO Foundation",
  },
  {
    id: "wrist", label: "Distal Radius Fracture", icon: "🦾", color: T.teal, urgency: "moderate",
    types: ["Colles' (dorsal displacement)", "Smith's (volar displacement)", "Barton's (articular, rim fracture)", "Intraarticular comminuted"],
    workup: ["PA, lateral, oblique wrist X-rays", "CT if intraarticular (>2 mm step-off consideration)", "Check for scaphoid fracture (snuffbox tenderness)"],
    management: [
      "Non-displaced / minimally displaced: Sugar-tong splint → short arm cast 6 weeks",
      "Acceptable alignment: radial inclination >15°, radial height >10 mm, volar tilt <20° dorsal",
      "Closed reduction: traction + ulnar deviation + flexion (Colles')",
      "ORIF indications: >2 mm articular step-off, dorsal tilt >20°, shortening >5 mm, instability",
      "Volar locking plate (VLP): most common ORIF approach",
      "Post-ORIF: early finger ROM, formal hand therapy",
    ],
    pearls: [
      "Check median nerve (thenar atrophy, thumb opposition, 2-point discrimination) — carpal tunnel syndrome risk.",
      "Lunate facet fractures → high instability, typically require ORIF.",
      "Assess DRUJ (distal radioulnar joint) after reduction — pronation/supination restriction = DRUJ injury.",
      "Pediatric: Salter-Harris classification. SH II most common. Growth plate involvement requires pediatric orthopedic consult.",
    ],
    badge: "AO Foundation",
  },
  {
    id: "clavicle", label: "Clavicle Fracture", icon: "🩻", color: T.yellow, urgency: "low",
    types: ["Midshaft (80%)", "Distal third", "Medial (rare)"],
    workup: ["AP chest + clavicle view", "Zanca view for distal clavicle", "Assess for pneumothorax, brachial plexus, vascular injury"],
    management: [
      "Midshaft non-displaced: Sling 3–6 weeks, pendulum exercises early",
      "Midshaft displaced/comminuted: Surgery if >2 cm shortening, >100% displacement, open, neurovascular compromise",
      "Distal: Type I (stable) → sling; Type II (ligament-disrupted) → ORIF",
      "Return to sport: typically 8–12 weeks",
    ],
    pearls: [
      "Most clavicle fractures heal conservatively — surgery for specific indications only.",
      "Distal type II: CC ligament disrupted → vertical instability → ORIF reduces non-union risk.",
      "Skin tenting with midshaft displacement → relative urgency for surgery (open fracture risk).",
      "Obtain Zanca view (15° cephalad tilt) to fully evaluate distal clavicle.",
    ],
    badge: "Evidence-Based",
  },
  {
    id: "vertebral", label: "Spine Fracture", icon: "🏗️", color: T.purple, urgency: "critical",
    types: ["Compression fracture (osteoporotic)", "Burst fracture", "Chance fracture (flexion-distraction)", "Fracture-dislocation"],
    workup: ["CT spine (protocol): more sensitive than plain films", "MRI if neuro deficit, cord injury, posterior ligamentous complex concern", "CBC, BMP", "Bladder scan (neurogenic bladder)", "GCS + ASIA impairment scale"],
    management: [
      "Immobilization: hard cervical collar (C-spine), log-roll precautions",
      "Neurological exam: serial ASIA scores",
      "Compression fracture (stable): TLSO brace, bisphosphonates if osteoporotic, kyphoplasty if pain refractory",
      "Burst fracture: CT to assess canal compromise; surgical if > 50% canal, kyphosis >20°, or neuro deficit",
      "Chance fracture: Often flexion-lap belt injury — rule out intraabdominal injury (40% associated injury)",
      "Traumatic cord injury: early surgical decompression if incomplete injury; avoid steroids (NASCIS data refuted)",
    ],
    pearls: [
      "TLICS (Thoracolumbar Injury Classification) or AO Spine classification guides surgical decision-making.",
      "Chance fracture: seat-belt sign + midback pain + FAST + CT = high suspicion. 40% have hollow viscus injury.",
      "MRI within 24 h for all incomplete spinal cord injuries — decompression within 24 h may improve outcomes.",
      "Do NOT use methylprednisolone for acute SCI — NASCIS III: increased infections without neurological benefit.",
    ],
    badge: "ATLS / AO Spine",
  },
];

const JOINT_DISLOCATIONS = [
  {
    id: "shoulder", label: "Shoulder Dislocation", icon: "💪", color: T.coral,
    direction: "Anterior (95%) / Posterior / Inferior (luxatio erecta)",
    prereduction: ["Neurovascular exam: axillary nerve (lateral deltoid sensation)", "AP + lateral (or Y-view) to confirm direction", "Hill-Sachs (humeral head), Bankart (glenoid rim) injury screening", "Assess rotator cuff post-reduction"],
    techniques: [
      "Cunningham: patient seated, arm adducted, gentle massage of deltoid/biceps → patient performs own reduction",
      "External Rotation (Hennepin): supine, elbow 90°, slowly externally rotate arm to 90°",
      "Stimson: prone, 5–10 lb weight, traction-countertraction — least force",
      "FARES: figure-of-eight arm motion during traction",
      "Milch: arm abducted overhead, gentle traction + external rotation",
    ],
    post: ["Post-reduction X-ray (AP + Grashey)", "Sling 1–3 weeks (shorter in elderly)", "Early pendulum exercises", "Ortho follow-up: Bankart repair if age < 25 (high recurrence 80–90%)"],
    pearl: "First-time dislocation in patient < 25: surgical stabilization strongly recommended (recurrence rate 80–90% without repair). Posterior dislocation: classic after seizure or electrocution — often missed on AP film. Get Y-view or CT.",
  },
  {
    id: "knee", label: "Knee Dislocation", icon: "🦵", color: T.red || "#ff4444",
    direction: "Anterior (most common), Posterior, Medial, Lateral, Rotatory",
    prereduction: ["Immediate vascular assessment: ABI (Ankle-Brachial Index)", "ABI < 0.9 → CTA popliteal → OR", "Peroneal nerve exam (foot dorsiflexion, dorsal sensation web space)", "AP + lateral knee", "Ottawa Knee Rules for plain films"],
    techniques: [
      "Inline traction with gentle reduction — often spontaneously reduces before ED arrival",
      "Popliteal artery repair takes priority over ligament reconstruction",
      "Long-leg posterior splint in 15° flexion after reduction",
    ],
    post: ["Post-reduction ABI immediately after", "MRI for ligament inventory (PCL, ACL, collaterals, menisci)", "Observation 6–8 h for vascular injury (delayed thrombosis)", "Vascular surgery consult if ABI < 0.9"],
    pearl: "Popliteal artery injury in 25–40% of knee dislocations. ABI < 0.9 = emergent CTA/vascular surgery. Even spontaneous reduction is a true dislocation until proven otherwise. Peroneal nerve palsy 20–40% — document carefully.",
  },
  {
    id: "hip-dislocation", label: "Hip Dislocation", icon: "🏃", color: T.orange,
    direction: "Posterior (90%) — femoral head posterior to acetabulum with hip flexed-adducted. Anterior: rare.",
    prereduction: ["Assess sciatic nerve (dorsiflexion, plantar flexion, sensation)", "AP pelvis + Judet views", "Exclude femoral neck fracture BEFORE traction (cannot do Allis if femoral neck broken)"],
    techniques: [
      "Allis: patient supine on floor, assistant stabilizes pelvis, provider applies inline traction + gradual internal/external rotation",
      "Stimson: prone, hip hanging off stretcher, downward pressure on thigh + traction",
      "Captain Morgan: provider's knee under patient's flexed knee as fulcrum",
    ],
    post: ["Post-reduction X-ray AP pelvis", "CT hip: look for intraarticular fragments, associated fracture", "Ortho consult: early reduction (< 6 h) reduces AVN risk", "Touch-down WB if no fracture, non-WB if fracture"],
    pearl: "Reduce within 6 hours to minimize avascular necrosis (AVN) risk. Sciatic nerve injury in 10–20% posterior dislocations. Always get post-reduction CT — intraarticular fragments require OR.",
  },
  {
    id: "finger", label: "Finger Dislocation", icon: "☝️", color: T.green,
    direction: "PIP dorsal most common. DIP and MCP also occur.",
    prereduction: ["PA + lateral + oblique digit films", "Check vascular supply (capillary refill)", "Assess for volar plate, collateral, or tendon rupture", "Digital block before reduction"],
    techniques: [
      "Dorsal PIP: gentle traction + dorsal pressure on base of middle phalanx",
      "Volar PIP (rare, complex): may be irreducible → OR if unable to reduce in 1–2 attempts",
      "MCP: complex if 'button-holed' through volar plate → do not force traction → OR",
    ],
    post: ["Post-reduction films", "Buddy tape 3–6 weeks for PIP", "Splint in slight flexion if volar plate rupture", "Hand surgery if irreducible, open, or extensor/flexor tendon rupture"],
    pearl: "PIP dorsal dislocation: test active PIP extension after reduction — central slip rupture leads to boutonnière deformity if missed. Volar PIP dislocation = complex = higher OR rate.",
  },
];

const ORTHO_EMERGENCIES = [
  {
    id: "compartment", label: "Compartment Syndrome", color: T.red || "#ff4444", icon: "🚨", urgency: "CRITICAL — 6 HOUR WINDOW",
    presentation: "6 P's: Pain (out of proportion), Pressure, Paresthesias, Paralysis (late), Pallor (late), Pulselessness (very late)",
    mechanism: "Increased pressure within closed fascial compartment → ischemia. Tibial shaft fractures #1 cause. Also: crush injury, casts, IVDA, reperfusion.",
    diagnosis: ["Clinical: pain with passive stretch most sensitive (dorsiflexion for calf, finger extension for forearm)", "Compartment pressure: needle manometry", "Delta P = Diastolic BP − Compartment Pressure", "Delta P < 30 mmHg → fasciotomy indicated", "Normal compartment pressure: < 20 mmHg"],
    management: ["Remove all circumferential dressings IMMEDIATELY", "Elevate to heart level (NOT above — reduces perfusion)", "Fasciotomy if Delta P < 30 mmHg or clinical diagnosis", "Orthopedic surgery → emergent 4-compartment fasciotomy (leg) or volar forearm fasciotomy", "Monitor urine output, CK, BMP (rhabdomyolysis risk)", "Fasciotomy wounds left open → delayed primary closure 48–72 h"],
    pearl: "Pulselessness and pallor are LATE findings — do not wait for these. Pain with passive stretch + tense compartment = fasciotomy now. Normal pulse does NOT exclude compartment syndrome.",
  },
  {
    id: "open-fracture", label: "Open Fracture", color: T.orange, icon: "⚠️", urgency: "HIGH",
    presentation: "Fracture with skin breach communicating with fracture site. Gustilo-Anderson classification guides management.",
    mechanism: "High-energy trauma most common. Contamination risk is primary concern.",
    diagnosis: ["Gustilo Type I: < 1 cm wound, clean, simple fracture", "Gustilo Type II: 1–10 cm wound, moderate contamination", "Gustilo Type III: > 10 cm or high energy, severe contamination. IIIC = vascular injury", "X-ray fracture and wound. CT for complex fractures.", "Pulse ox and ABI if vascular injury suspected"],
    management: ["Tetanus prophylaxis", "IV antibiotics WITHIN 1 HOUR: cefazolin 2g IV (add gentamicin for Type III; add penicillin if soil/fecal contamination)", "Wound irrigation in ED with NS (do not scrub wound)", "Sterile dressing: saline-moistened gauze", "Splint fracture", "OR within 6–24 hours: irrigation, debridement, fracture stabilization", "Wound cultures at debridement"],
    pearl: "Time to antibiotics is critical — every hour delay increases infection risk. DO NOT do primary wound closure in ED. Type IIIC requires vascular surgery within 6 h to limb salvage.",
  },
  {
    id: "septic-joint", label: "Septic Arthritis", color: T.yellow, icon: "🦠", urgency: "HIGH",
    presentation: "Hot, swollen, painful joint with fever. Inability to range the joint passively is classic.",
    mechanism: "Hematogenous seeding most common. Staph aureus #1 in adults. Neisseria gonorrhoeae in sexually active adults < 35.",
    diagnosis: ["Joint aspiration (arthrocentesis) BEFORE antibiotics if possible", "Synovial WBC > 50,000/mm³ (>75% PMN) = septic until proven otherwise", "Crystal exam (gout/pseudogout on DDx)", "Blood cultures × 2", "STI screening (NAAT) if gonorrhea suspected", "X-ray to rule out osteomyelitis, gas, or foreign body"],
    management: ["IV antibiotics: vancomycin (MRSA coverage) + ceftriaxone if GC suspected", "Surgical irrigation and debridement (I&D): open or arthroscopic — SAME DAY", "Hip septic arthritis → emergent OR (avascular necrosis risk)", "Serial joint aspirations for non-surgical candidates (specific circumstances only)", "Repeat CBC, CRP, ESR to monitor response"],
    pearl: "Kocher criteria for pediatric hip septic arthritis: fever, ESR >40, WBC >12,000, non-weight-bearing. 3–4 criteria = >93% probability. Pediatric hip → emergent OR regardless of aspiration results.",
  },
  {
    id: "cauda", label: "Cauda Equina Syndrome", color: T.purple, icon: "🧠", urgency: "CRITICAL — SURGICAL EMERGENCY",
    presentation: "Low back pain + bilateral leg weakness/numbness + saddle anesthesia + bowel/bladder dysfunction",
    mechanism: "Compression of cauda equina nerve roots (below L1). Most common: large central disc herniation L4-L5 or L5-S1. Also: tumor, hematoma, abscess.",
    diagnosis: ["MRI lumbar spine EMERGENTLY (with and without contrast)", "Do NOT delay MRI for labs or plain films if clinical suspicion", "Post-void residual > 300 mL = urinary retention (high specificity)", "Saddle anesthesia: test S3-S5 dermatome (perineum, inner thighs, genitalia)"],
    management: ["Neurosurgery/spine surgery consult immediately", "Emergent surgical decompression within 24–48 h (sooner = better)", "Bladder scan and catheterize if retention", "Corticosteroids: not routinely indicated", "Document neurological deficits serially (ASIA scale)"],
    pearl: "Urinary retention (retention > incontinence) is the most common bladder symptom. Incontinence = worse prognosis (overdistended bladder). Decompression within 24 h significantly improves bladder/bowel outcomes.",
  },
];

const ORTHO_SCORES = [
  {
    id: "ottawa-ankle", label: "Ottawa Ankle Rules", color: T.blue, icon: "📏",
    description: "Clinical decision rule to determine need for ankle/foot X-ray. Validated: sensitivity ~99%, reduces X-ray use 30–40%.",
    criteria: [
      { region: "Ankle X-ray Indicated If:", items: ["Bony tenderness at posterior edge / tip of LATERAL malleolus (distal 6 cm)", "Bony tenderness at posterior edge / tip of MEDIAL malleolus (distal 6 cm)", "Inability to bear weight: 4 steps immediately after injury AND in ED"] },
      { region: "Foot X-ray Indicated If:", items: ["Bony tenderness at base of 5th metatarsal", "Bony tenderness at navicular bone", "Inability to bear weight: 4 steps immediately after injury AND in ED"] },
    ],
    caveats: ["Not applicable: children < 5, pregnancy, isolated skin injuries, intoxicated patients, distracting injuries, diminished sensation", "Always check proximal fibula (Maisonneuve)"],
  },
  {
    id: "ottawa-knee", label: "Ottawa Knee Rules", color: T.teal, icon: "📐",
    description: "Knee X-ray indicated if ANY of:",
    criteria: [
      { region: "Knee X-ray if:", items: ["Age ≥ 55", "Isolated patellar tenderness (no other knee tenderness)", "Tenderness at head of fibula", "Inability to flex knee to 90°", "Inability to bear weight (4 steps)"] },
    ],
    caveats: ["Sensitivity ~99% for fractures", "Pittsburgh knee rules: alternative — age < 12 or ≥ 50, or mechanism is fall/blunt trauma"],
  },
  {
    id: "kocher", label: "Kocher Criteria (Pediatric Hip)", color: T.coral, icon: "👶",
    description: "Differentiates septic arthritis from transient synovitis in children. Each criterion = 1 point.",
    criteria: [
      { region: "Criteria (1 point each):", items: ["Fever (temperature > 38.5°C)", "Non-weight-bearing", "ESR > 40 mm/hr", "WBC > 12,000 cells/mm³"] },
      { region: "Predicted Probability:", items: ["0 criteria: < 0.2%", "1 criterion: 3%", "2 criteria: 40%", "3 criteria: 93%", "4 criteria: 99%"] },
    ],
    caveats: ["CRP > 2 mg/dL may replace or augment ESR (Caird modification)", "Septic hip → emergent OR for I&D regardless"],
  },
  {
    id: "neer", label: "Neer Classification (Proximal Humerus)", color: T.purple, icon: "🦴",
    description: "Fracture parts: humeral head, greater tuberosity, lesser tuberosity, humeral shaft. A 'part' = displaced > 1 cm or angulated > 45°.",
    criteria: [
      { region: "Classification:", items: ["1-part: Any fracture without displacement → conservative", "2-part: 1 displaced part → may treat conservatively or ORIF", "3-part: 2 displaced parts → ORIF or hemiarthroplasty", "4-part: 3 displaced parts → hemiarthroplasty or reverse TSA (elderly)"] },
    ],
    caveats: ["Age and bone quality heavily influence surgical vs conservative decision", "Check axillary nerve (lateral deltoid patch) in all proximal humerus fractures"],
  },
];

const TABS = [
  { id: "fractures", label: "Fracture Management", icon: "🦴" },
  { id: "dislocations", label: "Dislocations", icon: "💪" },
  { id: "emergencies", label: "Ortho Emergencies", icon: "🚨" },
  { id: "scores", label: "Scores & Rules", icon: "📏" },
];

function AmbientBg() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      <div style={{ position: "absolute", top: "-10%", left: "-5%", width: "50%", height: "50%", background: "radial-gradient(circle,rgba(167,139,250,0.07) 0%,transparent 70%)" }} />
      <div style={{ position: "absolute", bottom: "-10%", right: "-5%", width: "45%", height: "45%", background: "radial-gradient(circle,rgba(34,211,238,0.06) 0%,transparent 70%)" }} />
    </div>
  );
}

function BulletRow({ text, color }) {
  return (
    <div style={{ display: "flex", gap: 7, alignItems: "flex-start", marginBottom: 4 }}>
      <span style={{ color: color || T.teal, fontSize: 8, marginTop: 3, flexShrink: 0 }}>▸</span>
      <span style={{ fontFamily: "DM Sans", fontSize: 12, color: T.txt2, lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

function Badge({ label, color }) {
  return (
    <span style={{ fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${color}18`, border: `1px solid ${color}44`, color, letterSpacing: 1, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

// ── FractureCard ──────────────────────────────────────────────────────────────
function FractureCard({ fx }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ ...glass, overflow: "hidden", borderTop: `3px solid ${fx.color}` }}>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>{fx.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "Playfair Display", fontWeight: 700, fontSize: 15, color: fx.color }}>{fx.label}</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 3 }}>
              {fx.types.map((t, i) => <span key={i} style={{ fontFamily: "DM Sans", fontSize: 10, color: T.txt3, background: "rgba(14,37,68,0.6)", border: "1px solid rgba(42,79,122,0.3)", borderRadius: 4, padding: "1px 6px" }}>{t}</span>)}
            </div>
          </div>
          <Badge label={fx.badge} color={fx.color} />
        </div>
        <button onClick={() => setOpen(!open)} style={{ fontFamily: "DM Sans", fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(42,79,122,0.4)", background: "transparent", color: T.txt3, cursor: "pointer" }}>
          {open ? "▲ collapse" : "▼ management + pearls"}
        </button>
      </div>
      {open && (
        <div className="ortho-fade" style={{ padding: "0 16px 16px", borderTop: "1px solid rgba(42,79,122,0.2)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
            <div style={{ padding: "10px 12px", background: "rgba(14,37,68,0.5)", border: "1px solid rgba(42,79,122,0.25)", borderRadius: 10 }}>
              <div style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: T.cyan, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>Workup</div>
              {fx.workup.map((w, i) => <BulletRow key={i} text={w} color={T.cyan} />)}
            </div>
            <div style={{ padding: "10px 12px", background: "rgba(14,37,68,0.5)", border: "1px solid rgba(42,79,122,0.25)", borderRadius: 10 }}>
              <div style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: fx.color, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>Management</div>
              {fx.management.map((m, i) => <BulletRow key={i} text={m} color={fx.color} />)}
            </div>
          </div>
          <div style={{ marginTop: 8, padding: "10px 12px", background: `${T.yellow}0a`, border: `1px solid ${T.yellow}22`, borderRadius: 10 }}>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: T.yellow, fontWeight: 700, letterSpacing: 1, marginBottom: 5 }}>💎 PEARLS</div>
            {fx.pearls.map((p, i) => <BulletRow key={i} text={p} color={T.yellow} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── DislocationCard ───────────────────────────────────────────────────────────
function DislocationCard({ d }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ ...glass, overflow: "hidden", borderTop: `3px solid ${d.color}` }}>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>{d.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "Playfair Display", fontWeight: 700, fontSize: 15, color: d.color }}>{d.label}</div>
            <div style={{ fontFamily: "DM Sans", fontSize: 11, color: T.txt3, marginTop: 2 }}>{d.direction}</div>
          </div>
        </div>
        <button onClick={() => setOpen(!open)} style={{ fontFamily: "DM Sans", fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(42,79,122,0.4)", background: "transparent", color: T.txt3, cursor: "pointer" }}>
          {open ? "▲ collapse" : "▼ techniques + post-reduction"}
        </button>
      </div>
      {open && (
        <div className="ortho-fade" style={{ padding: "0 16px 16px", borderTop: "1px solid rgba(42,79,122,0.2)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 10 }}>
            <div style={{ padding: "10px 12px", background: "rgba(14,37,68,0.5)", border: "1px solid rgba(42,79,122,0.25)", borderRadius: 10 }}>
              <div style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: T.orange, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>Pre-Reduction</div>
              {d.prereduction.map((p, i) => <BulletRow key={i} text={p} color={T.orange} />)}
            </div>
            <div style={{ padding: "10px 12px", background: "rgba(14,37,68,0.5)", border: "1px solid rgba(42,79,122,0.25)", borderRadius: 10 }}>
              <div style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: d.color, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>Techniques</div>
              {d.techniques.map((t, i) => <BulletRow key={i} text={t} color={d.color} />)}
            </div>
            <div style={{ padding: "10px 12px", background: "rgba(14,37,68,0.5)", border: "1px solid rgba(42,79,122,0.25)", borderRadius: 10 }}>
              <div style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: T.green, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>Post-Reduction</div>
              {d.post.map((p, i) => <BulletRow key={i} text={p} color={T.green} />)}
            </div>
          </div>
          <div style={{ marginTop: 8, padding: "10px 12px", background: `${T.yellow}0a`, border: `1px solid ${T.yellow}22`, borderRadius: 10 }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: T.yellow, fontWeight: 700, letterSpacing: 1 }}>💎 PEARL </span>
            <span style={{ fontFamily: "DM Sans", fontSize: 12, color: T.txt2, lineHeight: 1.5 }}>{d.pearl}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── EmergencyCard ─────────────────────────────────────────────────────────────
function EmergencyCard({ em }) {
  const [open, setOpen] = useState(false);
  const urgColor = em.urgency.includes("CRITICAL") ? "#ff4444" : T.orange;
  return (
    <div style={{ ...glass, overflow: "hidden", borderTop: `3px solid ${urgColor}`, background: `linear-gradient(135deg,${urgColor}06,rgba(8,22,40,0.88))` }}>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 22 }}>{em.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "Playfair Display", fontWeight: 700, fontSize: 16, color: urgColor }}>{em.label}</div>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 700, color: urgColor, marginTop: 3, letterSpacing: 1 }}>{em.urgency}</div>
          </div>
        </div>
        <div style={{ fontFamily: "DM Sans", fontSize: 12, color: T.txt2, lineHeight: 1.6, marginBottom: 8 }}>{em.presentation}</div>
        <button onClick={() => setOpen(!open)} style={{ fontFamily: "DM Sans", fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 8, border: `1px solid ${urgColor}44`, background: `${urgColor}0d`, color: urgColor, cursor: "pointer" }}>
          {open ? "▲ collapse" : "▼ diagnosis + management"}
        </button>
      </div>
      {open && (
        <div className="ortho-fade" style={{ padding: "0 16px 16px", borderTop: "1px solid rgba(42,79,122,0.2)" }}>
          <div style={{ fontFamily: "DM Sans", fontSize: 12, color: T.txt2, marginTop: 10, marginBottom: 8, lineHeight: 1.6 }}><strong style={{ color: T.txt }}>Mechanism:</strong> {em.mechanism}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ padding: "10px 12px", background: "rgba(14,37,68,0.5)", border: "1px solid rgba(42,79,122,0.25)", borderRadius: 10 }}>
              <div style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: T.cyan, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>Diagnosis</div>
              {em.diagnosis.map((d, i) => <BulletRow key={i} text={d} color={T.cyan} />)}
            </div>
            <div style={{ padding: "10px 12px", background: `${urgColor}08`, border: `1px solid ${urgColor}22`, borderRadius: 10 }}>
              <div style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: urgColor, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>Management</div>
              {em.management.map((m, i) => <BulletRow key={i} text={m} color={urgColor} />)}
            </div>
          </div>
          <div style={{ marginTop: 8, padding: "10px 12px", background: `${T.yellow}0a`, border: `1px solid ${T.yellow}22`, borderRadius: 10 }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: T.yellow, fontWeight: 700, letterSpacing: 1 }}>💎 PEARL </span>
            <span style={{ fontFamily: "DM Sans", fontSize: 12, color: T.txt2, lineHeight: 1.5 }}>{em.pearl}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ScoreCard ─────────────────────────────────────────────────────────────────
function ScoreCard({ sc }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ ...glass, overflow: "hidden", borderTop: `3px solid ${sc.color}` }}>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 20 }}>{sc.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "Playfair Display", fontWeight: 700, fontSize: 15, color: sc.color }}>{sc.label}</div>
            <div style={{ fontFamily: "DM Sans", fontSize: 11, color: T.txt3, marginTop: 2, lineHeight: 1.5 }}>{sc.description}</div>
          </div>
        </div>
        <button onClick={() => setOpen(!open)} style={{ fontFamily: "DM Sans", fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(42,79,122,0.4)", background: "transparent", color: T.txt3, cursor: "pointer" }}>
          {open ? "▲ collapse" : "▼ view criteria"}
        </button>
      </div>
      {open && (
        <div className="ortho-fade" style={{ padding: "0 16px 16px", borderTop: "1px solid rgba(42,79,122,0.2)" }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${sc.criteria.length}, 1fr)`, gap: 10, marginTop: 10 }}>
            {sc.criteria.map((c, i) => (
              <div key={i} style={{ padding: "10px 12px", background: "rgba(14,37,68,0.5)", border: "1px solid rgba(42,79,122,0.25)", borderRadius: 10 }}>
                <div style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: sc.color, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>{c.region}</div>
                {c.items.map((item, j) => <BulletRow key={j} text={item} color={sc.color} />)}
              </div>
            ))}
          </div>
          {sc.caveats?.length > 0 && (
            <div style={{ marginTop: 8, padding: "8px 12px", background: `${T.orange}0a`, border: `1px solid ${T.orange}22`, borderRadius: 10 }}>
              <div style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: T.orange, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>⚠ CAVEATS</div>
              {sc.caveats.map((c, i) => <BulletRow key={i} text={c} color={T.orange} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OrthoHub() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("fractures");

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", background: T.bg, minHeight: "100vh", position: "relative", overflow: "hidden", color: T.txt }}>
      <AmbientBg />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1400, margin: "0 auto", padding: "0 16px" }}>

        {/* Header */}
        <div style={{ padding: "18px 0 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ backdropFilter: "blur(40px)", background: "rgba(5,15,30,0.9)", border: "1px solid rgba(42,79,122,0.6)", borderRadius: 10, padding: "5px 12px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: T.cyan, letterSpacing: 3 }}>NOTRYA</span>
              <span style={{ color: T.txt4, fontFamily: "JetBrains Mono", fontSize: 10 }}>/</span>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: T.txt3, letterSpacing: 2 }}>ORTHO HUB</span>
            </div>
            <div style={{ height: 1, flex: 1, background: "linear-gradient(90deg,rgba(42,79,122,0.6),transparent)" }} />
            <button onClick={() => navigate("/hub")} style={{ padding: "5px 14px", borderRadius: 8, background: "rgba(14,37,68,0.6)", border: "1px solid rgba(42,79,122,0.4)", color: T.txt2, fontFamily: "DM Sans", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>← Hub</button>
          </div>
          <h1 className="ortho-shimmer" style={{ fontFamily: "Playfair Display", fontSize: "clamp(26px,4vw,42px)", fontWeight: 900, letterSpacing: -1, lineHeight: 1.1 }}>Orthopaedic Hub</h1>
          <p style={{ fontFamily: "DM Sans", fontSize: 12, color: T.txt3, marginTop: 4 }}>Fracture Management · Dislocations · Ortho Emergencies · Decision Rules</p>
        </div>

        {/* Stat Banner */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Fractures", value: "5 Types", sub: "Hip · Ankle · Wrist · Spine", color: T.coral },
            { label: "Dislocations", value: "4 Joints", sub: "Techniques + Post-care", color: T.blue },
            { label: "Emergencies", value: "4 Critical", sub: "Compartment · Septic Joint", color: "#ff4444" },
            { label: "Ottawa Rules", value: "~99%", sub: "Sensitivity for fractures", color: T.teal },
            { label: "Compartment ΔP", value: "< 30 mmHg", sub: "→ Fasciotomy threshold", color: T.orange },
            { label: "Hip AVN", value: "< 6 hr", sub: "Reduction window", color: T.purple },
          ].map((b, i) => (
            <div key={i} style={{ ...glass, padding: "9px 13px", borderLeft: `3px solid ${b.color}`, background: `linear-gradient(135deg,${b.color}12,rgba(8,22,40,0.8))`, borderRadius: 10 }}>
              <div style={{ fontFamily: "JetBrains Mono", fontSize: 13, fontWeight: 700, color: b.color }}>{b.value}</div>
              <div style={{ fontFamily: "DM Sans", fontWeight: 600, color: T.txt, fontSize: 10, margin: "3px 0" }}>{b.label}</div>
              <div style={{ fontFamily: "DM Sans", fontSize: 9, color: T.txt4 }}>{b.sub}</div>
            </div>
          ))}
        </div>

        {/* Tab Bar */}
        <div style={{ ...glass, padding: "6px", display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: "1 1 auto", fontFamily: "DM Sans", fontWeight: 600, fontSize: 12, padding: "9px 8px", borderRadius: 10, border: `1px solid ${tab === t.id ? "rgba(34,211,238,0.5)" : "transparent"}`, background: tab === t.id ? "linear-gradient(135deg,rgba(34,211,238,0.18),rgba(34,211,238,0.07))" : "transparent", color: tab === t.id ? T.cyan : T.txt3, cursor: "pointer", textAlign: "center", transition: "all .15s", whiteSpace: "nowrap" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── Fractures Tab ── */}
        {tab === "fractures" && (
          <div className="ortho-fade">
            <div style={{ padding: "10px 14px", background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.2)", borderRadius: 10, marginBottom: 14, fontFamily: "DM Sans", fontSize: 12, color: T.txt2, lineHeight: 1.7 }}>
              🦴 Evidence-based fracture management protocols covering workup, acceptable alignment, operative indications, and clinical pearls. Click any card to expand.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 12 }}>
              {FRACTURE_MGMT.map(fx => <FractureCard key={fx.id} fx={fx} />)}
            </div>
          </div>
        )}

        {/* ── Dislocations Tab ── */}
        {tab === "dislocations" && (
          <div className="ortho-fade">
            <div style={{ padding: "10px 14px", background: "rgba(59,158,255,0.06)", border: "1px solid rgba(59,158,255,0.2)", borderRadius: 10, marginBottom: 14, fontFamily: "DM Sans", fontSize: 12, color: T.txt2, lineHeight: 1.7 }}>
              💪 Reduction techniques, pre- and post-reduction checklists, and critical neurovascular assessments. Always document neuro exam before and after.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 12 }}>
              {JOINT_DISLOCATIONS.map(d => <DislocationCard key={d.id} d={d} />)}
            </div>
          </div>
        )}

        {/* ── Emergencies Tab ── */}
        {tab === "emergencies" && (
          <div className="ortho-fade">
            <div style={{ padding: "10px 14px", background: "rgba(255,68,68,0.06)", border: "1px solid rgba(255,68,68,0.2)", borderRadius: 10, marginBottom: 14, fontFamily: "DM Sans", fontSize: 12, color: T.txt2, lineHeight: 1.7 }}>
              🚨 Time-critical orthopaedic emergencies requiring immediate recognition and action. Do not wait for late findings — act on early clinical signs.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {ORTHO_EMERGENCIES.map(em => <EmergencyCard key={em.id} em={em} />)}
            </div>
          </div>
        )}

        {/* ── Scores Tab ── */}
        {tab === "scores" && (
          <div className="ortho-fade">
            <div style={{ padding: "10px 14px", background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 10, marginBottom: 14, fontFamily: "DM Sans", fontSize: 12, color: T.txt2, lineHeight: 1.7 }}>
              📏 Validated clinical decision tools and classification systems used in emergency orthopaedics.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 12 }}>
              {ORTHO_SCORES.map(sc => <ScoreCard key={sc.id} sc={sc} />)}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", paddingBottom: 24, paddingTop: 14 }}>
          <span style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: T.txt4, letterSpacing: 1.5 }}>
            NOTRYA ORTHO HUB · AAOS · AO FOUNDATION · ATLS · VERIFY ALL CLINICAL DECISIONS WITH LOCAL PROTOCOLS
          </span>
        </div>
      </div>
    </div>
  );
}