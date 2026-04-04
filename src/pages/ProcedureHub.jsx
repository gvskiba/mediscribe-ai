import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

/* ─── Design Tokens ─── */
const T = {
  bg: "#050f1e", panel: "#081628", card: "#0b1e36", up: "#0e2544",
  bd: "#1a3555", bdHi: "#2a4f7a",
  blue: "#3b9eff", teal: "#00e5c0", gold: "#f5c842",
  coral: "#ff6b6b", orange: "#ff9f43", purple: "#9b6dff",
  green: "#22c55e", cyan: "#00d4ff",
  txt: "#e8f0fe", txt2: "#8aaccc", txt3: "#4a6a8a", txt4: "#2e4a6a",
};

/* ─── Procedure Data ─── */
const PROCEDURES = [
  {
    id: "cvc",
    icon: "🩹",
    name: "Central Line (CVC)",
    category: "Vascular Access",
    risk: "high",
    time: "20–40 min",
    badge: "STAT",
    badgeColor: T.coral,
    indication: "Vasopressor infusion, hemodynamic monitoring, poor peripheral access, TPN",
    contraindications: ["Infection at site", "Coagulopathy (relative)", "Uncooperative patient"],
    equipment: ["CVC kit", "Ultrasound", "Sterile drape/gown/gloves", "Chlorhexidine", "Suture", "Dressing"],
    sites: ["Internal jugular (preferred)", "Subclavian", "Femoral (last resort)"],
    steps: [
      "Position patient: Trendelenburg for IJ/SC, supine for femoral",
      "Full sterile prep: chlorhexidine scrub, sterile drape",
      "Ultrasound-guided vein identification and compression test",
      "Lidocaine 1% local anesthesia",
      "Needle access under real-time ultrasound guidance",
      "Confirm venous blood return (non-pulsatile, dark)",
      "Guidewire insertion — watch for arrhythmias",
      "Serial dilation over guidewire",
      "Catheter insertion and secure (3-0 silk suture)",
      "Confirm all lumens flush freely",
      "CXR for IJ/SC: confirm tip at SVC-RA junction, no PTX",
    ],
    complications: ["Pneumothorax", "Arterial puncture", "Hematoma", "Air embolism", "Catheter-related infection", "Arrhythmia"],
    pearls: [
      "Always use real-time ultrasound — reduces complications by >50%",
      "If arterial puncture: remove needle immediately, hold firm pressure",
      "Guidewire should pass freely — never force it",
      "Femoral lines have higher infection risk — remove ASAP",
    ],
    color: T.coral,
  },
  {
    id: "intubation",
    icon: "🌬️",
    name: "RSI / Intubation",
    category: "Airway",
    risk: "high",
    time: "5–10 min",
    badge: "STAT",
    badgeColor: T.coral,
    indication: "Respiratory failure, airway protection, procedural sedation, cardiac arrest",
    contraindications: ["Anticipated difficult airway (consider awake intubation)", "Facial trauma (consider surgical airway)"],
    equipment: ["Laryngoscope (video preferred)", "ETT 7.0–8.0", "Stylet", "10cc syringe", "BVM", "Suction", "ETCO2", "RSI drugs"],
    sites: ["Oral (preferred)", "Nasal (if needed)"],
    steps: [
      "Pre-oxygenate: NRB or BVM 3–5 min, target SpO2 >95%",
      "LEMON assessment: Look, Evaluate 3-3-2, Mallampati, Obstruction, Neck mobility",
      "Prepare: drugs drawn, video laryngoscope on, suction at bedside",
      "Ketamine 1.5 mg/kg IV or Etomidate 0.3 mg/kg IV (induction)",
      "Succinylcholine 1.5 mg/kg IV or Rocuronium 1.2 mg/kg IV (paralytic)",
      "Wait 45–60 seconds for full paralysis",
      "Direct/Video laryngoscopy: BURP maneuver if needed",
      "ETT placement: confirm with direct visualization through cords",
      "Inflate cuff, confirm with ETCO2 + bilateral breath sounds",
      "Secure tube, CXR to confirm depth (tip 2–3 cm above carina)",
    ],
    complications: ["Esophageal intubation", "Right mainstem intubation", "Hypoxia", "Hypotension post-intubation", "Dental trauma", "Aspiration"],
    pearls: [
      "Video laryngoscopy is now standard — use it",
      "Apneic oxygenation during intubation (NC at 15L) buys time",
      "Push-dose epinephrine ready for post-intubation hypotension",
      "ETCO2 is gold standard for ETT confirmation — NOT breath sounds alone",
      "If can't intubate/can't oxygenate → surgical airway immediately",
    ],
    color: T.blue,
  },
  {
    id: "lp",
    icon: "🧠",
    name: "Lumbar Puncture (LP)",
    category: "Neurological",
    risk: "mod",
    time: "15–30 min",
    badge: "URGENT",
    badgeColor: T.orange,
    indication: "Meningitis/encephalitis workup, SAH (negative CT), IIH diagnosis",
    contraindications: ["Elevated ICP / herniation signs", "Coagulopathy (INR >1.5, plt <50K)", "Infection at site", "Spinal cord mass"],
    equipment: ["LP kit", "Spinal needle 20–22G", "Manometer", "Collection tubes (x4)", "Sterile prep", "Lidocaine 1%"],
    sites: ["L3-L4 (preferred)", "L4-L5"],
    steps: [
      "Position: lateral decubitus fetal position OR seated leaning forward",
      "Identify L3-L4 interspace (line between iliac crests = L4)",
      "Sterile prep: chlorhexidine in widening circles",
      "Lidocaine 1% local anesthesia to skin and periosteum",
      "Insert needle bevel up, angled toward umbilicus",
      "Advance with stylet in until 'pop' felt (ligamentum flavum/dura)",
      "Remove stylet — CSF should flow freely",
      "Attach manometer: normal OP 10–20 cmH2O",
      "Collect 4 tubes: 1=cell count, 2=glucose/protein, 3=culture, 4=cell count",
      "Replace stylet before removing needle",
    ],
    complications: ["Post-LP headache (10–30%)", "Herniation (if ICP elevated)", "Hematoma", "Meningitis", "Radicular pain"],
    pearls: [
      "Always get CT head first if focal neuro deficits, altered mental status, or papilledema",
      "Traumatic tap: RBC decreases from tube 1→4, true SAH stays constant",
      "Xanthochromia develops 2–4h after SAH — wait before LP if timing unclear",
      "Blood patch for post-LP headache if persistent >24h",
    ],
    color: T.purple,
  },
  {
    id: "thoracentesis",
    icon: "🫁",
    name: "Thoracentesis",
    category: "Thoracic",
    risk: "mod",
    time: "20–40 min",
    badge: "URGENT",
    badgeColor: T.orange,
    indication: "Diagnosis of pleural effusion, symptomatic large effusion, empyema drainage",
    contraindications: ["Coagulopathy (relative)", "Small effusion <1cm on decubitus", "Uncooperative patient", "Chest wall infection"],
    equipment: ["Thoracentesis kit", "Ultrasound", "14–16G angiocath or dedicated kit", "Large syringe", "3-way stopcock", "Collection bags", "Sterile prep"],
    sites: ["1–2 intercostal spaces below effusion upper border (US-guided)", "Posterior: 7th–9th intercostal space"],
    steps: [
      "Ultrasound: confirm effusion size, mark optimal entry point",
      "Position: seated leaning forward over pillow (posterior approach)",
      "Sterile prep and drape",
      "Lidocaine 1%: skin, subcutaneous, periosteum of rib (superior border of lower rib to avoid NVB)",
      "Insert needle over superior rib margin while aspirating",
      "Once fluid obtained, advance catheter, remove needle",
      "Connect to 3-way stopcock and large syringe or drainage tubing",
      "Drain — limit to 1.5L per session to avoid re-expansion pulmonary edema",
      "Remove catheter at end-expiration",
      "CXR post-procedure to rule out pneumothorax",
    ],
    complications: ["Pneumothorax (5–10%)", "Re-expansion pulmonary edema (>1.5L)", "Hemorrhage", "Infection/empyema", "Liver/spleen laceration"],
    pearls: [
      "Always use ultrasound guidance — reduces pneumothorax risk by 3×",
      "Go OVER the rib to avoid the neurovascular bundle (runs below each rib)",
      "Stop if patient develops cough, chest pain, or dyspnea during procedure",
      "Transudates: send protein, LDH (Light's criteria); exudates: also culture, cytology, pH",
    ],
    color: T.cyan,
  },
  {
    id: "arthrocentesis",
    icon: "🦴",
    name: "Arthrocentesis (Joint Tap)",
    category: "Orthopaedic",
    risk: "low",
    time: "5–15 min",
    badge: "ROUTINE",
    badgeColor: T.teal,
    indication: "Suspected septic arthritis, crystal arthropathy (gout/pseudogout), diagnostic workup",
    contraindications: ["Overlying skin infection/cellulitis", "Prosthetic joint (orthopedics)", "Bacteremia (relative)"],
    equipment: ["18–22G needle (size depends on joint)", "Syringe 10–20cc", "Collection tubes", "Lidocaine 1%", "Sterile prep"],
    sites: ["Knee (most common)", "Ankle", "Shoulder", "Wrist", "Elbow"],
    steps: [
      "Identify landmarks or use ultrasound guidance",
      "Sterile prep: chlorhexidine",
      "Lidocaine 1% to skin only (avoid joint space — bacteriostatic)",
      "Knee: medial or lateral patella approach, needle angled 45° under patella",
      "Aspirate to dryness if possible",
      "Send: cell count/diff, crystal analysis, culture, glucose, LDH",
      "Can inject corticosteroid if infection excluded",
    ],
    complications: ["Iatrogenic infection (<0.01%)", "Hemarthrosis", "Cartilage damage", "Post-injection flare"],
    pearls: [
      "WBC >50,000 = septic arthritis until proven otherwise → ortho consult",
      "Crystals do NOT rule out septic arthritis — can coexist",
      "Milky fluid = pseudogout; yellow-green opaque = septic",
      "Inject steroid only after cultures sent and infection excluded",
    ],
    color: T.green,
  },
  {
    id: "paracentesis",
    icon: "🩺",
    name: "Paracentesis",
    category: "GI / Abdominal",
    risk: "low",
    time: "15–30 min",
    badge: "URGENT",
    badgeColor: T.orange,
    indication: "New ascites workup, SBP evaluation, symptomatic tense ascites",
    contraindications: ["Coagulopathy (relative — INR >2.5, plt <20K)", "Bowel obstruction", "Pregnancy", "Infection at site"],
    equipment: ["Paracentesis kit or 14–18G catheter", "Ultrasound", "Large syringes", "Vacuum bottles", "Sterile prep", "Albumin (if large volume)"],
    sites: ["Left lower quadrant (preferred — 2cm medial to ASIS)", "Right lower quadrant", "Midline infraumbilical (avoid bladder)"],
    steps: [
      "Ultrasound: confirm ascites location and depth, avoid bowel/bladder",
      "Empty bladder (Foley if needed)",
      "Position: semi-recumbent or lateral decubitus",
      "Sterile prep and drape",
      "Lidocaine 1%: skin and peritoneum (Z-track technique)",
      "Insert catheter needle with continuous aspiration",
      "Once fluid obtained: advance catheter, remove needle",
      "Connect to vacuum bottles or large syringes",
      "Large volume: replace with albumin 6–8g per liter drained (if >5L)",
      "Remove catheter, apply pressure/bandage",
    ],
    complications: ["Bleeding", "Infection", "Bowel perforation", "Post-paracentesis circulatory dysfunction"],
    pearls: [
      "INR does NOT need to be corrected routinely — ascitic fluid tamponades bleeding",
      "SBP: PMN >250/mm³ — start antibiotics immediately (cefotaxime 2g IV)",
      "Always send: cell count/diff, albumin, total protein, culture (bedside inoculation)",
      "SAAG >1.1 = portal hypertension; <1.1 = exudate (infection, malignancy)",
    ],
    color: T.gold,
  },
  {
    id: "ioproc",
    icon: "⚡",
    name: "IO Access",
    category: "Vascular Access",
    risk: "low",
    time: "1–3 min",
    badge: "STAT",
    badgeColor: T.coral,
    indication: "Emergency vascular access when IV fails × 2 attempts, cardiac arrest, hemodynamic instability",
    contraindications: ["Fracture at insertion site", "Previous IO in same bone <24h", "Infection at site", "Osteoporosis (relative)"],
    equipment: ["EZ-IO drill + 15G or 25G needle", "Flush syringe (10cc NS)", "IO extension set", "Lidocaine 2% (for awake patients)", "Tegaderm/dressing"],
    sites: ["Proximal tibia (preferred)", "Distal tibia", "Proximal humerus (larger flows)", "Sternum (FAST1)"],
    steps: [
      "Identify landmark: proximal tibia — 2cm below tibial tuberosity, medial flat surface",
      "Clean site with chlorhexidine",
      "Awake patient: 2% lidocaine 0.5cc subQ, then IO lidocaine 2–4cc (slow push)",
      "EZ-IO: hold perpendicular to bone, drill with steady pressure until 'give'",
      "Remove stylet — IO needle should stand unsupported",
      "Aspirate for marrow (may not always get return)",
      "Flush with 10cc NS rapidly — confirm no extravasation",
      "Connect IO extension set, secure with dressing",
      "All resuscitation drugs and fluids can be given IO at same dose",
    ],
    complications: ["Compartment syndrome (extravasation)", "Tibial fracture", "Infection/osteomyelitis", "Fat embolism (rare)"],
    pearls: [
      "IO is equivalent to central access for resuscitation — do not delay",
      "Max dwell time: 24 hours — establish peripheral/central access ASAP",
      "Push drugs with 10–20cc NS flush for rapid systemic delivery",
      "Humerus site: higher flow rates — preferred for large volume resuscitation",
    ],
    color: T.coral,
  },
  {
    id: "foley",
    icon: "🔧",
    name: "Foley Catheter",
    category: "GU",
    risk: "low",
    time: "5–10 min",
    badge: "ROUTINE",
    badgeColor: T.teal,
    indication: "Urinary retention, urine output monitoring, urethral injury evaluation, incontinence management",
    contraindications: ["Suspected urethral disruption (pelvic fracture, blood at meatus)", "Urethral stricture", "Prostate surgery (relative)"],
    equipment: ["Foley catheter 14–18F (male), 14–16F (female)", "Catheter insertion kit", "Sterile drape/gloves", "Betadine/chlorhexidine", "10cc syringe + water", "Drainage bag"],
    sites: ["Urethral", "Suprapubic (if urethral contraindicated)"],
    steps: [
      "Gather equipment; explain procedure to patient",
      "Dorsal lithotomy position for female; supine for male",
      "Sterile drape; cleanse urethral meatus with betadine (front to back in females)",
      "Lubricate catheter tip generously with lidocaine gel",
      "Male: hold penis perpendicular to body, gentle traction",
      "Insert catheter until urine returns, then advance 2–3cm further",
      "Inflate balloon with 10cc sterile water (NEVER if resistance felt)",
      "Gently pull back until resistance felt — balloon now seated",
      "Connect to drainage bag",
    ],
    complications: ["UTI/CAUTI", "Urethral trauma", "False passage", "Bladder spasm", "Balloon inflation in urethra"],
    pearls: [
      "If resistance met in male: try larger catheter or coudé tip (curved)",
      "Never force the catheter — call urology if difficult",
      "Document residual volume: retention >300cc is significant",
      "Remove catheter ASAP — every day of foley = 5% CAUTI risk",
    ],
    color: T.teal,
  },
];

const CATEGORIES = ["All", "Airway", "Vascular Access", "Thoracic", "Neurological", "GI / Abdominal", "Orthopaedic", "GU"];
const RISKS = { low: { label: "Low Risk", color: T.teal }, mod: { label: "Mod Risk", color: T.orange }, high: { label: "High Risk", color: T.coral } };

function Background() {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {[
        { x: "10%", y: "20%", r: 300, c: "rgba(59,158,255,0.05)" },
        { x: "85%", y: "15%", r: 260, c: "rgba(0,229,192,0.05)" },
        { x: "75%", y: "75%", r: 320, c: "rgba(155,109,255,0.05)" },
        { x: "20%", y: "80%", r: 220, c: "rgba(255,107,107,0.04)" },
      ].map((o, i) => (
        <div key={i} style={{ position: "absolute", left: o.x, top: o.y, width: o.r * 2, height: o.r * 2, borderRadius: "50%", background: `radial-gradient(circle, ${o.c} 0%, transparent 70%)`, transform: "translate(-50%,-50%)" }} />
      ))}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.03 }}>
        <defs>
          <pattern id="pg" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0L0 0 0 40" fill="none" stroke="#3b9eff" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pg)" />
      </svg>
    </div>
  );
}

function AIScrubIn({ proc, onClose }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a senior emergency medicine attending. Generate a concise pre-procedure briefing for: ${proc.name}.

Include:
1. Top 3 "go/no-go" safety checks (1 line each)
2. Critical equipment you must confirm before starting (3 items)
3. The single most common fatal mistake and how to avoid it
4. One key anatomical pearl specific to this procedure
5. Immediate rescue if procedure fails (1–2 sentences)

Be direct, clinical, and use EM attending voice. No fluff.`,
        response_json_schema: {
          type: "object",
          properties: {
            go_nogo: { type: "array", items: { type: "string" } },
            critical_equipment: { type: "array", items: { type: "string" } },
            fatal_mistake: { type: "string" },
            anatomical_pearl: { type: "string" },
            rescue_plan: { type: "string" },
          }
        }
      });
      setResult(res);
    } catch (e) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(5,15,30,0.92)", backdropFilter: "blur(16px)" }}>
      <div style={{ width: "min(620px,95vw)", background: T.panel, border: `1px solid ${proc.color}55`, borderRadius: 18, overflow: "hidden", boxShadow: `0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px ${proc.color}33` }}>
        <div style={{ background: `linear-gradient(135deg, ${proc.color}18, transparent)`, padding: "18px 22px", borderBottom: `1px solid ${T.bd}`, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>{proc.icon}</span>
          <div>
            <div style={{ fontFamily: "Playfair Display", fontSize: 18, fontWeight: 700, color: T.txt }}>AI Scrub-In: {proc.name}</div>
            <div style={{ fontSize: 11, color: T.txt3, marginTop: 2 }}>Pre-procedure AI briefing from your attending</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", color: T.txt3, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding: "18px 22px", maxHeight: "70vh", overflowY: "auto" }}>
          {!result && !loading && (
            <div style={{ textAlign: "center", padding: "28px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
              <div style={{ color: T.txt2, fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
                Get an AI-generated pre-procedure briefing tailored to <strong style={{ color: T.txt }}>{proc.name}</strong>.<br />
                Includes go/no-go checks, critical equipment, and rescue planning.
              </div>
              <button onClick={generate}
                style={{ background: `linear-gradient(135deg, ${proc.color}28, ${proc.color}14)`, border: `1px solid ${proc.color}55`, borderRadius: 10, padding: "10px 28px", color: proc.color, fontFamily: "DM Sans", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                ✦ Generate Briefing
              </button>
            </div>
          )}
          {loading && (
            <div style={{ textAlign: "center", padding: "40px 0", color: proc.color }}>
              <div style={{ fontSize: 32, marginBottom: 10, animation: "spin 1.2s linear infinite", display: "inline-block" }}>✦</div>
              <div style={{ fontSize: 12, color: T.txt3 }}>Consulting the attending…</div>
            </div>
          )}
          {result && !result.error && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { title: "✅ Go / No-Go Checks", items: result.go_nogo, type: "list", color: T.teal },
                { title: "🔧 Critical Equipment", items: result.critical_equipment, type: "list", color: T.blue },
                { title: "⚠️ Fatal Mistake to Avoid", text: result.fatal_mistake, type: "text", color: T.coral },
                { title: "🧬 Anatomical Pearl", text: result.anatomical_pearl, type: "text", color: T.purple },
                { title: "🚨 Rescue Plan", text: result.rescue_plan, type: "text", color: T.orange },
              ].map((s, i) => (
                <div key={i} style={{ background: `${s.color}0e`, border: `1px solid ${s.color}33`, borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: s.color, marginBottom: 8, fontFamily: "JetBrains Mono", letterSpacing: 1 }}>{s.title}</div>
                  {s.type === "list" ? (
                    <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
                      {(s.items || []).map((it, j) => <li key={j} style={{ fontSize: 12, color: T.txt2, lineHeight: 1.6 }}>{it}</li>)}
                    </ul>
                  ) : (
                    <div style={{ fontSize: 12, color: T.txt2, lineHeight: 1.7 }}>{s.text}</div>
                  )}
                </div>
              ))}
              <button onClick={generate}
                style={{ marginTop: 4, background: "transparent", border: `1px solid ${T.bd}`, borderRadius: 8, padding: "7px 16px", color: T.txt3, fontSize: 11, cursor: "pointer", fontFamily: "DM Sans" }}>
                ↺ Regenerate
              </button>
            </div>
          )}
          {result?.error && (
            <div style={{ color: T.coral, fontSize: 12, padding: 12 }}>Error: {result.error}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProcedureCard({ proc, onClick }) {
  const [hov, setHov] = useState(false);
  const risk = RISKS[proc.risk];

  return (
    <div
      onClick={() => onClick(proc)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? `linear-gradient(135deg, ${proc.color}18, ${proc.color}08)` : T.panel,
        border: `1px solid ${hov ? proc.color + "55" : T.bd}`,
        borderRadius: 14,
        padding: "16px 18px",
        cursor: "pointer",
        transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        transform: hov ? "translateY(-4px) scale(1.015)" : "translateY(0) scale(1)",
        boxShadow: hov ? `0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px ${proc.color}33` : "0 2px 12px rgba(0,0,0,0.3)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${proc.color}, transparent)`, opacity: hov ? 1 : 0.3, transition: "opacity 0.2s" }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: `${proc.color}18`, border: `1px solid ${proc.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
            {proc.icon}
          </div>
          <div>
            <div style={{ fontFamily: "Playfair Display", fontSize: 14, fontWeight: 700, color: T.txt, lineHeight: 1.2 }}>{proc.name}</div>
            <div style={{ fontSize: 10, color: T.txt3, marginTop: 2 }}>{proc.category}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <span style={{ fontSize: 9, fontFamily: "JetBrains Mono", fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${proc.badgeColor}18`, color: proc.badgeColor, border: `1px solid ${proc.badgeColor}44` }}>{proc.badge}</span>
          <span style={{ fontSize: 9, fontFamily: "JetBrains Mono", padding: "2px 8px", borderRadius: 20, background: `${risk.color}12`, color: risk.color, border: `1px solid ${risk.color}33` }}>{risk.label}</span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: T.txt3, lineHeight: 1.5, marginBottom: 10 }}>{proc.indication.length > 100 ? proc.indication.slice(0, 100) + "…" : proc.indication}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 10, color: T.txt4, fontFamily: "JetBrains Mono" }}>⏱ {proc.time}</span>
        <span style={{ fontSize: 10, color: T.txt4 }}>·</span>
        <span style={{ fontSize: 10, color: T.txt4 }}>{proc.steps.length} steps</span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: proc.color, opacity: hov ? 1 : 0, transition: "opacity 0.2s" }}>View →</span>
      </div>
    </div>
  );
}

function ProcedureDetail({ proc, onClose, onScrubIn }) {
  const [tab, setTab] = useState("steps");
  const tabs = [
    { id: "steps", label: "📋 Steps" },
    { id: "equipment", label: "🔧 Equipment" },
    { id: "complications", label: "⚠️ Complications" },
    { id: "pearls", label: "💡 Pearls" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(5,15,30,0.88)", backdropFilter: "blur(12px)" }}>
      <div style={{ width: "min(700px,95vw)", maxHeight: "90vh", display: "flex", flexDirection: "column", background: T.panel, border: `1px solid ${proc.color}44`, borderRadius: 20, overflow: "hidden", boxShadow: `0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px ${proc.color}22` }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${proc.color}20, transparent)`, padding: "18px 22px 14px", borderBottom: `1px solid ${T.bd}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 32 }}>{proc.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "Playfair Display", fontSize: 22, fontWeight: 700, color: T.txt }}>{proc.name}</div>
              <div style={{ fontSize: 11, color: T.txt3, marginTop: 2 }}>{proc.category} · {proc.time} · {RISKS[proc.risk].label}</div>
            </div>
            <button onClick={onScrubIn}
              style={{ padding: "7px 16px", borderRadius: 8, background: `${proc.color}18`, border: `1px solid ${proc.color}55`, color: proc.color, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "DM Sans", whiteSpace: "nowrap" }}>
              🤖 AI Scrub-In
            </button>
            <button onClick={onClose} style={{ background: "none", border: "none", color: T.txt3, fontSize: 20, cursor: "pointer", padding: "0 4px" }}>✕</button>
          </div>
          <div style={{ fontSize: 12, color: T.txt2, lineHeight: 1.6, background: `${T.up}aa`, borderRadius: 8, padding: "8px 12px" }}>
            <strong style={{ color: T.txt3, fontFamily: "JetBrains Mono", fontSize: 10, letterSpacing: 1 }}>INDICATION: </strong>{proc.indication}
          </div>
          {proc.contraindications.length > 0 && (
            <div style={{ marginTop: 6, fontSize: 11, color: T.coral, background: "rgba(255,107,107,0.07)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: 8, padding: "6px 12px", lineHeight: 1.6 }}>
              <strong style={{ fontFamily: "JetBrains Mono", fontSize: 10, letterSpacing: 1 }}>CONTRAINDICATIONS: </strong>{proc.contraindications.join(" · ")}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${T.bd}`, flexShrink: 0 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: 1, padding: "10px 6px", background: tab === t.id ? `${proc.color}14` : "transparent", border: "none", borderBottom: tab === t.id ? `2px solid ${proc.color}` : "2px solid transparent", color: tab === t.id ? proc.color : T.txt3, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans", transition: "all 0.15s" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 22px 20px" }}>
          {tab === "steps" && (
            <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {proc.steps.map((step, i) => (
                <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: "50%", background: `${proc.color}22`, border: `1px solid ${proc.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 700, color: proc.color }}>{i + 1}</span>
                  <span style={{ fontSize: 13, color: T.txt2, lineHeight: 1.6, paddingTop: 2 }}>{step}</span>
                </li>
              ))}
            </ol>
          )}
          {tab === "equipment" && (
            <div>
              <div style={{ fontSize: 11, color: T.txt3, marginBottom: 10, fontFamily: "JetBrains Mono", letterSpacing: 1 }}>REQUIRED EQUIPMENT</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {proc.equipment.map((eq, i) => (
                  <span key={i} style={{ padding: "5px 12px", borderRadius: 20, background: `${proc.color}12`, border: `1px solid ${proc.color}33`, color: proc.color, fontSize: 12 }}>{eq}</span>
                ))}
              </div>
              {proc.sites && (
                <>
                  <div style={{ fontSize: 11, color: T.txt3, marginBottom: 10, fontFamily: "JetBrains Mono", letterSpacing: 1 }}>INSERTION SITES</div>
                  <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
                    {proc.sites.map((s, i) => <li key={i} style={{ fontSize: 13, color: T.txt2, lineHeight: 1.8 }}>{s}</li>)}
                  </ul>
                </>
              )}
            </div>
          )}
          {tab === "complications" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {proc.complications.map((c, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", background: "rgba(255,107,107,0.06)", border: "1px solid rgba(255,107,107,0.18)", borderRadius: 8, padding: "8px 12px" }}>
                  <span style={{ color: T.coral, fontSize: 12 }}>⚠</span>
                  <span style={{ fontSize: 13, color: T.txt2 }}>{c}</span>
                </div>
              ))}
            </div>
          )}
          {tab === "pearls" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {proc.pearls.map((p, i) => (
                <div key={i} style={{ background: `${T.gold}0e`, border: `1px solid ${T.gold}33`, borderRadius: 10, padding: "10px 14px", display: "flex", gap: 10 }}>
                  <span style={{ color: T.gold, fontSize: 14, flexShrink: 0 }}>💡</span>
                  <span style={{ fontSize: 13, color: T.txt2, lineHeight: 1.6 }}>{p}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProcedureHub() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selected, setSelected] = useState(null);
  const [scrubInProc, setScrubInProc] = useState(null);

  const filtered = PROCEDURES.filter(p => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch = !search || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.indication.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "DM Sans, sans-serif", color: T.txt, position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-thumb { background: #1a3555; border-radius: 3px; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #2e4a6a; }
      `}</style>

      <Background />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "28px 24px 48px" }}>

        {/* Back Button */}
        <button onClick={() => navigate("/hub")}
          style={{ marginBottom: 18, display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "DM Sans", fontSize: 12, fontWeight: 600, background: "rgba(14,37,68,0.7)", border: `1px solid rgba(42,79,122,0.5)`, borderRadius: 8, padding: "5px 14px", color: T.txt3, cursor: "pointer", transition: "all .15s" }}
          onMouseEnter={e => { e.currentTarget.style.color = T.txt2; e.currentTarget.style.borderColor = "rgba(59,158,255,0.4)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = T.txt3; e.currentTarget.style.borderColor = "rgba(42,79,122,0.5)"; }}>
          ← Back to Hub
        </button>

        {/* Header */}
        <div style={{ background: "rgba(8,22,40,0.85)", backdropFilter: "blur(24px)", border: "1px solid rgba(42,79,122,0.5)", borderRadius: 20, padding: "24px 28px 20px", marginBottom: 22, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2.5, borderRadius: "20px 20px 0 0", background: "linear-gradient(90deg,#3b9eff,#00e5c0,#9b6dff,#ff6b6b)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, rgba(59,158,255,0.2), rgba(0,229,192,0.1))", border: "1px solid rgba(59,158,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>✂️</div>
            <div>
              <h1 style={{ fontFamily: "Playfair Display", fontSize: 28, fontWeight: 700, margin: 0, color: T.txt }}>Procedure Hub</h1>
              <p style={{ fontSize: 13, color: T.txt3, margin: "4px 0 0" }}>Bedside procedure guides · Equipment checklists · Complication management · AI Scrub-In coaching</p>
            </div>
            <div style={{ marginLeft: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[{ v: PROCEDURES.length, l: "Procedures" }, { v: "AI", l: "Scrub-In" }, { v: "Step", l: "By Step" }, { v: "EM", l: "Optimized" }].map((s, i) => (
                <div key={i} style={{ textAlign: "center", background: "rgba(14,37,68,0.6)", borderRadius: 10, padding: "7px 12px", border: `1px solid ${T.bd}` }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: [T.blue, T.teal, T.gold, T.purple][i], fontFamily: "JetBrains Mono", lineHeight: 1 }}>{s.v}</div>
                  <div style={{ fontSize: 9, color: T.txt4, marginTop: 3, textTransform: "uppercase", letterSpacing: ".06em" }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Search + Filters */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}>🔍</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search procedures, indications…"
              style={{ width: "100%", background: "rgba(8,22,40,0.8)", border: `1px solid ${T.bdHi}`, borderRadius: 10, padding: "9px 12px 9px 36px", color: T.txt, fontFamily: "DM Sans", fontSize: 13, outline: "none" }} />
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                style={{ padding: "7px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", background: activeCategory === cat ? "rgba(59,158,255,0.15)" : "rgba(8,22,40,0.75)", border: `1px solid ${activeCategory === cat ? "rgba(59,158,255,0.45)" : "rgba(42,79,122,0.5)"}`, color: activeCategory === cat ? T.blue : T.txt3, fontFamily: "DM Sans" }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: T.txt3 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 14 }}>No procedures found</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
            {filtered.map((proc, i) => (
              <ProcedureCard key={proc.id} proc={proc} onClick={p => setSelected(p)} />
            ))}
          </div>
        )}
      </div>

      {selected && !scrubInProc && (
        <ProcedureDetail
          proc={selected}
          onClose={() => setSelected(null)}
          onScrubIn={() => setScrubInProc(selected)}
        />
      )}
      {scrubInProc && (
        <AIScrubIn proc={scrubInProc} onClose={() => setScrubInProc(null)} />
      )}
    </div>
  );
}