import { useState } from "react";

const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  b:"rgba(26,53,85,0.8)", bhi:"rgba(42,79,122,0.9)",
  txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  red:"#ff4444", coral:"#ff6b6b", orange:"#ff9f43",
  yellow:"#f5c842", green:"#3dffa0", teal:"#00e5c0",
  blue:"#3b9eff", purple:"#9b6dff", cyan:"#00d4ff",
};

const glass = {
  backdropFilter:"blur(24px) saturate(200%)",
  WebkitBackdropFilter:"blur(24px) saturate(200%)",
  background:"rgba(8,22,40,0.78)",
  border:"1px solid rgba(42,79,122,0.35)",
  borderRadius:14,
};

const XRAY_CASES = [
  {
    id: "distal-radius",
    label: "Distal Radius Fracture",
    icon: "🦾",
    color: T.teal,
    view: "Wrist AP / Lateral",
    patterns: [
      {
        label: "Non-Displaced",
        badge: "CONSERVATIVE",
        badgeColor: T.green,
        url: "https://media.base44.com/images/public/69876015478a19e360c5e3ea/643d54638_generated_image.png",
        findings: [
          "Subtle fracture line at distal radius metaphysis",
          "No cortical angulation or displacement",
          "Radial inclination preserved (>15°)",
          "Volar tilt within normal limits",
          "Radial height maintained (>10 mm)",
        ],
        management: "Sugar-tong splint → short arm cast × 6 weeks. Weekly follow-up X-rays × 2 weeks to confirm no late displacement.",
        classification: "AO Type A2 — extra-articular, non-displaced",
      },
      {
        label: "Displaced (Colles')",
        badge: "ORIF CONSIDER",
        badgeColor: T.orange,
        url: "https://media.base44.com/images/public/69876015478a19e360c5e3ea/f950539d0_generated_image.png",
        findings: [
          "Dorsal angulation of distal fragment (dinner-fork deformity)",
          "Radial shortening >5 mm",
          "Loss of volar tilt — dorsal >20° tilt",
          "Possible articular step-off at radiocarpal joint",
          "Assess DRUJ disruption on lateral view",
        ],
        management: "Closed reduction attempt under hematoma block. ORIF with volar locking plate (VLP) if: >2mm articular step-off, dorsal tilt >20° post-reduction, shortening >5mm.",
        classification: "AO Type A3/B — displaced, possible intra-articular",
      },
    ],
  },
  {
    id: "ankle",
    label: "Ankle Fracture",
    icon: "🦶",
    color: T.blue,
    view: "Ankle AP Mortise",
    patterns: [
      {
        label: "Weber A (Stable)",
        badge: "NON-OPERATIVE",
        badgeColor: T.green,
        url: "https://media.base44.com/images/public/69876015478a19e360c5e3ea/fa56dd107_generated_image.png",
        findings: [
          "Transverse fibular fracture BELOW the tibial plafond",
          "Intact syndesmosis — mortise congruent",
          "Medial clear space ≤4 mm (normal)",
          "No talar shift",
          "Tibiofibular overlap preserved",
        ],
        management: "Walking boot or short leg cast × 4–6 weeks. Weight-bearing as tolerated. No syndesmotic injury — no stress views needed.",
        classification: "Weber A = Danis-Weber / AO 44-B1",
      },
      {
        label: "Weber C (Unstable)",
        badge: "ORIF INDICATED",
        badgeColor: T.red,
        url: "https://media.base44.com/images/public/69876015478a19e360c5e3ea/8bc52964b_generated_image.png",
        findings: [
          "Fibular fracture ABOVE the syndesmosis",
          "Widened medial clear space >4 mm (mortise instability)",
          "Talar lateral shift — subluxation",
          "Tibiofibular clear space >5 mm (syndesmotic disruption)",
          "Look for medial malleolus fracture or deltoid disruption",
        ],
        management: "ORIF mandatory: fibula lateral plate + syndesmotic screw(s) if diastasis. Check Cotton test intraoperatively. Touch-down WB × 6 weeks post-op.",
        classification: "Weber C = syndesmotic disruption — AO 44-C",
      },
    ],
  },
  {
    id: "hip",
    label: "Femoral Neck Fracture",
    icon: "🦴",
    color: T.coral,
    view: "AP Pelvis / Lateral Hip",
    patterns: [
      {
        label: "Non-Displaced (Garden I–II)",
        badge: "CANNULATED SCREWS",
        badgeColor: T.yellow,
        url: "https://media.base44.com/images/public/69876015478a19e360c5e3ea/3b9a6e979_generated_image.png",
        findings: [
          "Subtle fracture line at femoral neck",
          "Valgus impaction — trabeculae buckled",
          "Femoral head position maintained",
          "No shortening or external rotation",
          "Garden alignment index ~160° on AP (normal ~160–180°)",
        ],
        management: "Surgical fixation within 24–48h: 3 cannulated screws in inverted triangle. Lower AVN risk than displaced (~10%). NWB × 6–8 weeks post-op.",
        classification: "Garden I (incomplete, valgus impacted) / Garden II (complete, non-displaced)",
      },
      {
        label: "Displaced (Garden III–IV)",
        badge: "ARTHROPLASTY",
        badgeColor: T.red,
        url: "https://media.base44.com/images/public/69876015478a19e360c5e3ea/6336ada2b_generated_image.png",
        findings: [
          "Complete fracture through femoral neck",
          "Femoral head displaced — varus and posterior",
          "Shortening of affected extremity visible",
          "External rotation of distal fragment",
          "High AVN risk — disrupted medial femoral circumflex artery",
        ],
        management: "Hemiarthroplasty (elderly, low demand) or THA (active, healthy <70y). Surgery within 24–48h. AVN risk 15–35% even with early surgery.",
        classification: "Garden III (partial displacement) / Garden IV (complete displacement, head dissociated)",
      },
    ],
  },
  {
    id: "shoulder",
    label: "Shoulder Dislocation",
    icon: "💪",
    color: T.purple,
    view: "AP Shoulder",
    patterns: [
      {
        label: "Normal Alignment",
        badge: "NORMAL",
        badgeColor: T.green,
        url: "https://media.base44.com/images/public/69876015478a19e360c5e3ea/2303a93c7_generated_image.png",
        findings: [
          "Humeral head centered in glenoid fossa",
          "Normal glenohumeral joint space ~4–6 mm",
          "Greater tuberosity intact — no fracture",
          "Acromiohumeral distance >6 mm (normal)",
          "No Hill-Sachs or Bankart defect visible",
        ],
        management: "Normal reference image. Compare with dislocation view for spatial orientation before reduction attempt.",
        classification: "Normal glenohumeral anatomy — reference view",
      },
      {
        label: "Anterior Dislocation",
        badge: "REDUCE NOW",
        badgeColor: T.red,
        url: "https://media.base44.com/images/public/69876015478a19e360c5e3ea/604f70a7b_generated_image.png",
        findings: [
          "Humeral head displaced ANTERIOR and INFERIOR to glenoid",
          "Subcoracoid position — most common (65–70%)",
          "Loss of normal shoulder contour ('squared off' shoulder)",
          "Check for greater tuberosity fracture (15–35% of cases)",
          "Hill-Sachs deformity: posterolateral humeral head impaction",
        ],
        management: "Reduce urgently. Cunningham or FARES technique preferred (no sedation). Post-reduction X-ray mandatory. Sling × 2–3 weeks. MRI if recurrent — Bankart repair if age <25.",
        classification: "Anterior glenohumeral dislocation — subcoracoid (most common)",
      },
    ],
  },
  {
    id: "hand",
    label: "Hand Fractures",
    icon: "✋",
    color: T.yellow,
    view: "Hand AP / Oblique",
    patterns: [
      {
        label: "Boxer's Fracture (5th MC Neck)",
        badge: "USUALLY CONSERVATIVE",
        badgeColor: T.orange,
        url: "https://media.base44.com/images/public/69876015478a19e360c5e3ea/fd34ae4a3_generated_image.png",
        findings: [
          "Fracture at neck of 5th metacarpal",
          "Apex dorsal angulation — volar displacement of head",
          "Measure angulation on true lateral view",
          "Rotational deformity: check on clinical exam (finger cascade)",
          "Acceptable: <40° small finger, <30° ring finger",
        ],
        management: "Ulnar gutter splint at 70–90° MCP flexion. If angulation >40°: closed reduction + ulnar gutter. ORIF if rotational deformity or multiple metacarpal fractures.",
        classification: "Metacarpal neck fracture — 5th (boxer's fracture)",
      },
      {
        label: "Scaphoid Waist Fracture",
        badge: "THUMB SPICA",
        badgeColor: T.teal,
        url: "https://media.base44.com/images/public/69876015478a19e360c5e3ea/0a132204e_generated_image.png",
        findings: [
          "Fracture line at scaphoid waist (middle third)",
          "May be subtle — obtain 4 views + ulnar deviation PA",
          "Snuffbox tenderness with normal X-ray → treat as scaphoid",
          "Check for cortical disruption at radial waist",
          "No displacement on this view — measure gap on CT if needed",
        ],
        management: "Thumb spica cast × 8–12 weeks if non-displaced. ORIF if displaced >1mm, proximal pole, or athlete. MRI if X-ray negative but snuffbox tender (sensitivity >95%).",
        classification: "Scaphoid waist fracture — Herbert Type A2 (non-displaced)",
      },
    ],
  },
];

// Annotation overlays — hotspot positions as percentage of image dimensions
const ANNOTATIONS = {
  "non-displaced": [
    { x: 52, y: 38, label: "Fracture line", color: T.yellow },
    { x: 40, y: 55, label: "Radius", color: T.teal },
  ],
  "displaced": [
    { x: 55, y: 35, label: "Dorsal angulation", color: T.red },
    { x: 45, y: 50, label: "Shortening", color: T.orange },
  ],
};

function XRayImage({ pattern, caseColor }) {
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [zoom, setZoom] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <button
          onClick={() => setShowAnnotations(a => !a)}
          style={{
            fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 700,
            padding: "4px 10px", borderRadius: 6, cursor: "pointer",
            background: showAnnotations ? `${T.yellow}22` : "rgba(8,22,40,0.8)",
            border: `1px solid ${showAnnotations ? T.yellow + "66" : "rgba(42,79,122,0.4)"}`,
            color: showAnnotations ? T.yellow : T.txt4,
            transition: "all 0.15s",
          }}
        >
          {showAnnotations ? "🔴 HIDE ANNOTATIONS" : "🟡 SHOW ANNOTATIONS"}
        </button>
        <button
          onClick={() => setZoom(z => !z)}
          style={{
            fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 700,
            padding: "4px 10px", borderRadius: 6, cursor: "pointer",
            background: zoom ? `${caseColor}22` : "rgba(8,22,40,0.8)",
            border: `1px solid ${zoom ? caseColor + "66" : "rgba(42,79,122,0.4)"}`,
            color: zoom ? caseColor : T.txt4,
            transition: "all 0.15s",
          }}
        >
          {zoom ? "🔍 ZOOM OUT" : "🔍 ZOOM IN"}
        </button>
        <span style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: T.txt4, marginLeft: "auto" }}>
          Click image to toggle zoom
        </span>
      </div>

      {/* Image + overlay */}
      <div
        onClick={() => setZoom(z => !z)}
        style={{
          position: "relative", borderRadius: 10, overflow: "hidden",
          border: `2px solid ${caseColor}44`, cursor: "zoom-in",
          background: "#000",
          transition: "transform 0.3s",
          transform: zoom ? "scale(1.04)" : "scale(1)",
        }}
      >
        <img
          src={pattern.url}
          alt={pattern.label}
          style={{
            width: "100%", display: "block", objectFit: "cover",
            maxHeight: zoom ? 420 : 300,
            transition: "max-height 0.3s",
            filter: "brightness(0.95) contrast(1.05)",
          }}
        />

        {/* Watermark */}
        <div style={{
          position: "absolute", top: 8, left: 10,
          fontFamily: "JetBrains Mono", fontSize: 8, color: "rgba(255,255,255,0.35)",
          letterSpacing: 1.5, pointerEvents: "none",
        }}>
          MOCK · EDUCATIONAL USE ONLY
        </div>

        {/* Badge */}
        <div style={{
          position: "absolute", top: 8, right: 10,
          fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 700,
          padding: "3px 8px", borderRadius: 6,
          background: `${pattern.badgeColor}22`,
          border: `1px solid ${pattern.badgeColor}55`,
          color: pattern.badgeColor,
          backdropFilter: "blur(8px)",
          pointerEvents: "none",
        }}>
          {pattern.badge}
        </div>

        {/* Annotation dots */}
        {showAnnotations && (ANNOTATIONS[pattern.label.toLowerCase().replace(/[^a-z]/g, "-")] || []).map((ann, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${ann.x}%`, top: `${ann.y}%`,
            transform: "translate(-50%,-50%)",
            pointerEvents: "none",
          }}>
            <div style={{
              width: 12, height: 12, borderRadius: "50%",
              background: ann.color, opacity: 0.85,
              boxShadow: `0 0 10px ${ann.color}`,
              animation: "pulse 1.5s infinite",
            }} />
            <div style={{
              position: "absolute", left: 16, top: -4,
              fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 700,
              color: ann.color, whiteSpace: "nowrap",
              background: "rgba(5,15,30,0.85)", padding: "1px 6px", borderRadius: 4,
              border: `1px solid ${ann.color}44`,
            }}>
              {ann.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function XRayViewer() {
  const [activeCaseId, setActiveCaseId] = useState(XRAY_CASES[0].id);
  const [patternIdx, setPatternIdx] = useState(0);

  const activeCase = XRAY_CASES.find(c => c.id === activeCaseId);
  const pattern = activeCase.patterns[patternIdx];

  const handleCaseChange = (id) => {
    setActiveCaseId(id);
    setPatternIdx(0);
  };

  return (
    <div>
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.4); }
          50% { box-shadow: 0 0 0 6px rgba(255,255,255,0); }
        }
      `}</style>

      {/* Info banner */}
      <div style={{
        padding: "10px 14px", background: "rgba(0,212,255,0.06)",
        border: "1px solid rgba(0,212,255,0.2)", borderRadius: 10,
        marginBottom: 16, fontFamily: "DM Sans", fontSize: 12, color: T.txt2, lineHeight: 1.7,
      }}>
        🩻 <strong style={{ color: T.cyan }}>X-Ray Viewer:</strong> Toggle between fracture patterns to compare radiographic findings. Click the image to zoom. Enable annotations to highlight key findings. All images are simulated for educational reference only.
      </div>

      {/* Case selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {XRAY_CASES.map(c => (
          <button
            key={c.id}
            onClick={() => handleCaseChange(c.id)}
            style={{
              flex: "1 1 auto", fontFamily: "DM Sans", fontWeight: 600, fontSize: 12,
              padding: "10px 10px", borderRadius: 10, cursor: "pointer", textAlign: "center",
              border: `2px solid ${activeCaseId === c.id ? c.color + "88" : "rgba(42,79,122,0.35)"}`,
              background: activeCaseId === c.id ? `${c.color}14` : "rgba(8,22,40,0.78)",
              color: activeCaseId === c.id ? c.color : T.txt3,
              transition: "all 0.15s",
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 3 }}>{c.icon}</div>
            <div>{c.label}</div>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 8, color: T.txt4, marginTop: 2 }}>{c.view}</div>
          </button>
        ))}
      </div>

      {/* Pattern toggle */}
      <div style={{
        ...glass, padding: "8px", display: "flex", gap: 6, marginBottom: 16,
      }}>
        {activeCase.patterns.map((p, i) => (
          <button
            key={i}
            onClick={() => setPatternIdx(i)}
            style={{
              flex: "1 1 auto", fontFamily: "DM Sans", fontWeight: 700, fontSize: 13,
              padding: "12px 10px", borderRadius: 10, cursor: "pointer", textAlign: "center",
              border: `2px solid ${patternIdx === i ? p.badgeColor + "88" : "rgba(42,79,122,0.3)"}`,
              background: patternIdx === i ? `${p.badgeColor}14` : "transparent",
              color: patternIdx === i ? p.badgeColor : T.txt3,
              transition: "all 0.15s",
            }}
          >
            <span style={{
              display: "inline-block", width: 10, height: 10, borderRadius: "50%",
              background: patternIdx === i ? p.badgeColor : T.txt4,
              marginRight: 8, verticalAlign: "middle",
            }} />
            {p.label}
          </button>
        ))}
      </div>

      {/* Main viewer */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
        {/* X-ray image */}
        <div style={{ ...glass, padding: "14px 16px" }}>
          <div style={{
            fontFamily: "JetBrains Mono", fontSize: 9, color: activeCase.color,
            textTransform: "uppercase", letterSpacing: 2, marginBottom: 10,
          }}>
            {activeCase.label} — {pattern.label}
          </div>
          <XRayImage pattern={pattern} caseColor={activeCase.color} />
        </div>

        {/* Findings panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Classification */}
          <div style={{
            ...glass, padding: "12px 16px",
            borderTop: `3px solid ${activeCase.color}`,
            background: `linear-gradient(135deg,${activeCase.color}08,rgba(8,22,40,0.9))`,
          }}>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 8, color: activeCase.color, fontWeight: 700, letterSpacing: 1.5, marginBottom: 5 }}>CLASSIFICATION</div>
            <div style={{ fontFamily: "DM Sans", fontSize: 12, color: T.txt, lineHeight: 1.5 }}>{pattern.classification}</div>
          </div>

          {/* Radiographic findings */}
          <div style={{ ...glass, padding: "12px 16px", borderLeft: `3px solid ${T.yellow}` }}>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 8, color: T.yellow, fontWeight: 700, letterSpacing: 1.5, marginBottom: 8 }}>🔍 RADIOGRAPHIC FINDINGS</div>
            {pattern.findings.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
                <span style={{
                  fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 700,
                  color: T.yellow, flexShrink: 0, marginTop: 2,
                }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ fontFamily: "DM Sans", fontSize: 12, color: T.txt2, lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
          </div>

          {/* Management */}
          <div style={{ ...glass, padding: "12px 16px", borderLeft: `3px solid ${pattern.badgeColor}` }}>
            <div style={{
              fontFamily: "JetBrains Mono", fontSize: 8, fontWeight: 700, letterSpacing: 1.5, marginBottom: 6,
              color: pattern.badgeColor,
            }}>
              ⚕ MANAGEMENT
            </div>
            <div style={{ fontFamily: "DM Sans", fontSize: 12, color: T.txt, lineHeight: 1.7 }}>{pattern.management}</div>
          </div>
        </div>
      </div>
    </div>
  );
}