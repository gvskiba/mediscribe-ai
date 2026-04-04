// ============================================================
//  NOTRYA — WoundHub
//  Laceration repair by region · Suture selection
//  Irrigation volumes · Bite protocols · Tetanus & Rabies
// ============================================================

import { useState, useCallback, useMemo } from "react";

const PREFIX = "wh";

(() => {
  const fontId = `${PREFIX}-fonts`;
  if (document.getElementById(fontId)) return;
  const l = document.createElement("link");
  l.id = fontId; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = `${PREFIX}-css`;
  s.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    ::-webkit-scrollbar { width: 3px; height: 3px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(42,79,122,.5); border-radius: 2px; }
    @keyframes ${PREFIX}fade { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
    @keyframes ${PREFIX}shim { 0%,100% { background-position:-200% center } 50% { background-position:200% center } }
    @keyframes ${PREFIX}orb0 { 0%,100% { transform:translate(-50%,-50%) scale(1) }    50% { transform:translate(-50%,-50%) scale(1.1)  } }
    @keyframes ${PREFIX}orb1 { 0%,100% { transform:translate(-50%,-50%) scale(1.07) } 50% { transform:translate(-50%,-50%) scale(.92)   } }
    @keyframes ${PREFIX}orb2 { 0%,100% { transform:translate(-50%,-50%) scale(.95) }  50% { transform:translate(-50%,-50%) scale(1.09)  } }
    .${PREFIX}-fade { animation: ${PREFIX}fade .22s ease both; }
    .${PREFIX}-shim {
      background: linear-gradient(90deg,#f2f7ff 0%,#fff 20%,#ff6b6b 45%,#ff9f43 70%,#f2f7ff 100%);
      background-size: 250% auto;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: ${PREFIX}shim 6s linear infinite;
    }
  `;
  document.head.appendChild(s);
})();

// ── Design Tokens ────────────────────────────────────────────────────
const T = {
  bg:     "#050f1e",
  panel:  "rgba(8,22,40,0.78)",
  card:   "rgba(11,30,54,0.65)",
  up:     "rgba(14,37,68,0.50)",
  txt:    "#f2f7ff",
  txt2:   "#b8d4f0",
  txt3:   "#82aece",
  txt4:   "#5a82a8",
  teal:   "#00e5c0",
  gold:   "#f5c842",
  red:    "#ff4444",
  coral:  "#ff6b6b",
  green:  "#3dffa0",
  blue:   "#3b9eff",
  purple: "#9b6dff",
  orange: "#ff9f43",
  rose:   "#f472b6",
  cyan:   "#00d4ff",
};

// ── Glass surface ────────────────────────────────────────────────────
const glass = {
  backdropFilter:       "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  background:           "rgba(8,22,40,0.78)",
  border:               "1px solid rgba(42,79,122,0.35)",
  borderRadius:         14,
};

// ══════════════════════════════════════════════════════════════════
//  MODULE-SCOPE PRIMITIVES
// ══════════════════════════════════════════════════════════════════

function AmbientBg() {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
      {[
        { l:"10%", t:"15%", r:300, c:"rgba(255,107,107,0.055)" },
        { l:"88%", t:"10%", r:260, c:"rgba(255,159,67,0.050)"  },
        { l:"78%", t:"78%", r:340, c:"rgba(155,109,255,0.040)" },
        { l:"18%", t:"80%", r:220, c:"rgba(59,158,255,0.040)"  },
      ].map((o, i) => (
        <div key={i} style={{
          position:"absolute", left:o.l, top:o.t,
          width:o.r*2, height:o.r*2, borderRadius:"50%",
          background:`radial-gradient(circle,${o.c} 0%,transparent 68%)`,
          transform:"translate(-50%,-50%)",
          animation:`${PREFIX}orb${i%3} ${8+i*1.3}s ease-in-out infinite`,
        }}/>
      ))}
    </div>
  );
}

function HubBadge({ name, onBack }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:9 }}>
      <div style={{
        backdropFilter:"blur(40px)", WebkitBackdropFilter:"blur(40px)",
        background:"rgba(5,15,30,0.9)", border:"1px solid rgba(42,79,122,0.6)",
        borderRadius:10, padding:"5px 12px",
        display:"flex", alignItems:"center", gap:8,
      }}>
        <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.gold, letterSpacing:3 }}>NOTRYA</span>
        <span style={{ color:T.txt4, fontFamily:"JetBrains Mono", fontSize:10 }}>/</span>
        <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.txt3, letterSpacing:2 }}>{name.toUpperCase()}</span>
      </div>
      <div style={{ height:1, flex:1, background:"linear-gradient(90deg,rgba(255,107,107,0.5),transparent)" }}/>
      {onBack && (
        <button onClick={onBack} style={{
          fontFamily:"DM Sans", fontSize:11, fontWeight:600,
          padding:"5px 14px", borderRadius:8, cursor:"pointer",
          border:"1px solid rgba(42,79,122,0.5)",
          background:"rgba(14,37,68,0.6)", color:T.txt3,
        }}>← Hub</button>
      )}
    </div>
  );
}

function StatTile({ value, label, sub, color }) {
  return (
    <div style={{
      ...glass, padding:"9px 13px", borderRadius:10,
      borderLeft:`3px solid ${color}`,
      background:`linear-gradient(135deg,${color}12,rgba(8,22,40,0.8))`,
    }}>
      <div style={{ fontFamily:"JetBrains Mono", fontSize:13, fontWeight:700, color, lineHeight:1 }}>{value}</div>
      <div style={{ fontFamily:"DM Sans", fontWeight:600, color:T.txt, fontSize:10, margin:"3px 0" }}>{label}</div>
      {sub && <div style={{ fontFamily:"DM Sans", fontSize:9, color:T.txt4 }}>{sub}</div>}
    </div>
  );
}

function GBox({ children, style = {}, accent = null }) {
  return (
    <div style={{
      ...glass,
      boxShadow: accent
        ? `0 4px 24px rgba(0,0,0,0.4),0 0 20px ${accent}15`
        : "0 4px 20px rgba(0,0,0,0.38),inset 0 1px 0 rgba(255,255,255,0.025)",
      borderColor: accent ? `${accent}30` : undefined,
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionHeader({ label, color }) {
  return (
    <div style={{
      fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700,
      color: color || T.txt4, letterSpacing:2, textTransform:"uppercase", marginBottom:10,
    }}>
      {label}
    </div>
  );
}

function FilterPill({ label, active, color, onClick }) {
  const c = color || T.coral;
  return (
    <button onClick={onClick} style={{
      fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700,
      padding:"4px 12px", borderRadius:20, cursor:"pointer",
      textTransform:"uppercase", letterSpacing:1, transition:"all .12s",
      border:`1px solid ${active ? c+"77" : c+"28"}`,
      background: active ? `${c}18` : `${c}06`,
      color: active ? c : T.txt3,
    }}>
      {label}
    </button>
  );
}

function BulletRow({ text, color, icon }) {
  return (
    <div style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:6 }}>
      <span style={{ color: color || T.coral, fontSize:10, marginTop:3, flexShrink:0 }}>
        {icon || "▸"}
      </span>
      <span style={{ fontFamily:"DM Sans", fontSize:13, color:T.txt, lineHeight:1.55 }}>{text}</span>
    </div>
  );
}

function Toast({ msg }) {
  return (
    <div style={{
      position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
      background:"rgba(8,22,40,0.96)", border:"1px solid rgba(255,107,107,0.4)",
      borderRadius:10, padding:"10px 20px",
      fontFamily:"DM Sans", fontWeight:600, fontSize:13, color:T.coral,
      zIndex:99999, pointerEvents:"none",
      animation:`${PREFIX}fade .2s ease both`,
    }}>
      {msg}
    </div>
  );
}

function RiskBadge({ level }) {
  const cfg = {
    "Low":      { color:T.green,  bg:"rgba(61,255,160,0.1)",  border:"rgba(61,255,160,0.25)"  },
    "Moderate": { color:T.gold,   bg:"rgba(245,200,66,0.1)",  border:"rgba(245,200,66,0.25)"  },
    "High":     { color:T.coral,  bg:"rgba(255,107,107,0.1)", border:"rgba(255,107,107,0.25)" },
    "Critical": { color:T.red,    bg:"rgba(255,68,68,0.15)",  border:"rgba(255,68,68,0.35)"   },
  };
  const c = cfg[level] || cfg["Low"];
  return (
    <span style={{
      fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
      padding:"2px 8px", borderRadius:20,
      background:c.bg, border:`1px solid ${c.border}`, color:c.color, letterSpacing:.5,
    }}>
      {level}
    </span>
  );
}

function Chip({ label, color }) {
  const c = color || T.blue;
  return (
    <span style={{
      fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
      padding:"2px 8px", borderRadius:6,
      background:`${c}14`, border:`1px solid ${c}30`,
      color:c, letterSpacing:.5, display:"inline-block",
    }}>
      {label}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════
//  CLINICAL DATA
// ══════════════════════════════════════════════════════════════════

const LACERATIONS = [
  {
    region:"Scalp", category:"Head", risk:"Low", icon:"🧠",
    superficialSuture:"3-0 or 4-0 Nylon / Prolene  —  OR staples",
    deepSuture:"2-0 Vicryl (galea only if violated)",
    irrigation:"100–200 mL/cm",
    closure:"Primary; staples preferred for speed",
    removeAt:"7–10 days (staples 5–7)",
    notes:[
      "Staples acceptable and preferred for speed in high-bleed scenarios",
      "Hair apposition technique (HAT) for small wounds — no suture instruments needed",
      "Figure-of-eight sutures for hemostasis when actively bleeding",
      "Palpate for skull fracture / step-off BEFORE any closure",
      "Galea violation → 2-0 Vicryl deep layer required to prevent subgaleal abscess",
    ],
    consult:null, abx:false,
  },
  {
    region:"Forehead", category:"Head", risk:"Low", icon:"😐",
    superficialSuture:"5-0 Nylon or Prolene",
    deepSuture:"4-0 Vicryl buried interrupted",
    irrigation:"100 mL/cm",
    closure:"Primary; layered if >0.5 cm depth",
    removeAt:"5–7 days",
    notes:[
      "Align with horizontal relaxed skin tension lines (RSTLs)",
      "No staples — cosmetically unacceptable on forehead",
      "Evert skin edges precisely; bury Vicryl to minimize surface tension",
      "Check frontalis muscle function and sensation",
      "Deep involvement of galea or periosteum → neurosurgery consult",
    ],
    consult:null, abx:false,
  },
  {
    region:"Face (General)", category:"Head", risk:"Moderate", icon:"🫥",
    superficialSuture:"5-0 or 6-0 Nylon or Prolene",
    deepSuture:"4-0 Vicryl buried interrupted",
    irrigation:"50–100 mL/cm",
    closure:"Primary; layered if deep",
    removeAt:"3–5 days (facial skin heals rapidly)",
    notes:[
      "Cosmetically critical — precise 1:1 edge eversion is essential",
      "Close within 6–8 hrs; may extend to 12–24 hrs for clean wounds",
      "6-0 fast-absorbing gut is acceptable alternative to nylon for facial skin",
      "Parotid duct or facial nerve territory at risk → plastic surgery consult",
      "Bury deep Vicryl to eliminate all surface tension before skin closure",
    ],
    consult:"Plastics if parotid duct or CN VII territory involved", abx:false,
  },
  {
    region:"Eyelid", category:"Head", risk:"High", icon:"👁",
    superficialSuture:"6-0 Fast-absorbing Gut  —  OR 6-0 Nylon",
    deepSuture:"Do NOT suture tarsal plate directly",
    irrigation:"Gentle NS irrigation only — NO high pressure near globe",
    closure:"Superficial primary only; ophthalmology for all complex injuries",
    removeAt:"5–7 days (nylon); fast-gut self-dissolves in 5–7 days",
    notes:[
      "STOP: call ophthalmology if any lid margin involvement",
      "Any medial canthus laceration → evaluate lacrimal canaliculus",
      "Levator aponeurosis or superior tarsus injury → ptosis repair by ophthalmology",
      "Exclude globe perforation (Seidel test) before ANY closure attempt",
      "High-pressure irrigation contraindicated near the globe",
    ],
    consult:"Ophthalmology for lid margin, levator, canalicular, or globe concerns", abx:false,
  },
  {
    region:"Lip", category:"Head", risk:"Moderate", icon:"💋",
    superficialSuture:"5-0 Nylon (skin surface)  /  4-0 Chromic Gut (mucosa)",
    deepSuture:"4-0 Vicryl (orbicularis oris muscle)",
    irrigation:"50–100 mL/cm",
    closure:"Primary; 3-layer for full-thickness",
    removeAt:"5–7 days (skin); mucosa self-dissolves",
    notes:[
      "FIRST: place alignment suture at vermilion border — even 1 mm error is visible",
      "3-layer closure for through-and-through: mucosa → orbicularis → skin",
      "If bite-mechanism: consider delayed closure + oral flora antibiotics",
      "Contamination from oral flora → amoxicillin-clavulanate prophylaxis",
      "Vermilion border misalignment likely → plastics consult before closure",
    ],
    consult:"Plastics if vermilion border alignment uncertain", abx:true,
  },
  {
    region:"Ear (Auricle)", category:"Head", risk:"Moderate", icon:"👂",
    superficialSuture:"4-0 Nylon (skin)",
    deepSuture:"4-0 Vicryl (perichondrium ONLY — never suture cartilage directly)",
    irrigation:"50–100 mL/cm",
    closure:"Primary; preserve all perichondrium",
    removeAt:"7–10 days",
    notes:[
      "NEVER suture cartilage directly — approximate via perichondrium layer",
      "Auricular hematoma → drain immediately; bolster or through-and-through suture to prevent cauliflower ear",
      "Exposed cartilage without perichondrium → ciprofloxacin for Pseudomonas coverage",
      "Partial amputation with >6 mm pedicle → primary reattachment; consider plastics",
      "Pressure dressing or dental roll bolster required post-repair",
    ],
    consult:"Plastics if significant tissue loss or subtotal amputation", abx:true,
  },
  {
    region:"Oral Mucosa / Intraoral", category:"Head", risk:"Low", icon:"🦷",
    superficialSuture:"4-0 Chromic Gut (self-dissolving) — tongue and mucosa",
    deepSuture:"4-0 Chromic Gut",
    irrigation:"Rinse with NS; chlorhexidine rinse acceptable",
    closure:"Close only if >1 cm or gaping; small wounds heal by secondary intention",
    removeAt:"Self-dissolves 5–7 days",
    notes:[
      "Most intraoral wounds <1 cm do NOT require closure — excellent healing",
      "Tongue lacerations: close if >1 cm, gaping, or flap; 4-0 chromic gut",
      "Through-and-through lacerations (skin + oral mucosa) → 3-layer closure required",
      "Oral flora risk → amoxicillin-clavulanate if closure performed",
      "Evaluate for tooth fragment aspiration or embedded tooth fragments in wound",
    ],
    consult:null, abx:false,
  },
  {
    region:"Hand / Dorsum", category:"Extremity", risk:"High", icon:"🖐",
    superficialSuture:"4-0 or 5-0 Nylon",
    deepSuture:"4-0 Vicryl if subcutaneous depth involved",
    irrigation:"100–200 mL/cm high-pressure",
    closure:"Primary if clean; delayed if contaminated or bite mechanism",
    removeAt:"10–12 days",
    notes:[
      "Assess extensor tendon function through full active ROM BEFORE any anesthesia",
      "Two-point discrimination and monofilament testing before nerve block",
      "Allen test to confirm ulnar and radial artery patency",
      "Any tendon, nerve, or vessel injury → hand surgery consult emergently",
      "Fight bite (MCP region) → treat as human bite; delayed closure; augmentin",
    ],
    consult:"Hand surgery if any tendon, nerve, or vessel involvement", abx:false,
  },
  {
    region:"Fingertip / Digit", category:"Extremity", risk:"Moderate", icon:"☝️",
    superficialSuture:"4-0 or 5-0 Nylon (skin)  /  5-0 or 6-0 Chromic Gut (nail bed)",
    deepSuture:"5-0 Chromic Gut (nail bed repair)",
    irrigation:"100 mL/cm; digital block first",
    closure:"Primary; nail bed repair if lacerated under nail",
    removeAt:"10–12 days; nail plate replaced as biological stent",
    notes:[
      "Digital block before any manipulation or irrigation",
      "Subungual hematoma >50% nail area → trephination or nail plate removal for nail bed repair",
      "Nail bed: 5-0 or 6-0 chromic gut; loupes if available for precision",
      "Replace or stent nail plate to maintain nail fold and protect repair",
      "Plain films required to rule out distal phalanx tuft fracture — open fracture needs antibiotics",
    ],
    consult:"Hand surgery for complex nail bed or open distal phalanx fracture", abx:false,
  },
  {
    region:"Palm / Volar Hand", category:"Extremity", risk:"High", icon:"🤲",
    superficialSuture:"4-0 Nylon",
    deepSuture:"3-0 Vicryl (deep palmar fascia if involved)",
    irrigation:"200 mL/cm — highest priority irrigation site",
    closure:"Primary if clean; exclude flexor tendon injury first",
    removeAt:"10–14 days",
    notes:[
      "Test FDS and FDP independently at each finger BEFORE any anesthesia",
      "Palmar puncture wounds: high risk for deep space infection — low closure threshold",
      "Closed fist MCP wound → fight bite protocol; NEVER close primarily",
      "Neurovascular bundles run along digital midlateral lines — test cap refill and sensation",
      "Augmentin for bite mechanism or significant contamination",
    ],
    consult:"Hand surgery for any flexor tendon, neurovascular, or deep space concern", abx:true,
  },
  {
    region:"Extremity (Arm / Leg)", category:"Extremity", risk:"Low", icon:"💪",
    superficialSuture:"3-0 or 4-0 Nylon",
    deepSuture:"3-0 Vicryl (if >0.5 cm depth)",
    irrigation:"50–100 mL/cm",
    closure:"Primary; delayed if contaminated",
    removeAt:"10–14 days lower extremity; 7–10 days upper extremity",
    notes:[
      "Lower extremity wounds have higher infection rates — lower threshold for delayed closure",
      "Do not close under tension over mobile joints — splint if needed post-repair",
      "Compartment syndrome risk in crush or high-energy mechanisms — serial exams",
      "Vascular injury (6 P's: pain, pallor, pulselessness, paresthesia, paralysis, poikilothermia) → vascular surgery stat",
      "Large degloving or tissue loss → plastics consultation",
    ],
    consult:null, abx:false,
  },
  {
    region:"Foot / Sole", category:"Extremity", risk:"Moderate", icon:"🦶",
    superficialSuture:"3-0 or 4-0 Nylon",
    deepSuture:"3-0 Vicryl",
    irrigation:"100–200 mL/cm",
    closure:"Primary for clean; NO closure for puncture wounds",
    removeAt:"12–14 days (increased tension and mobility)",
    notes:[
      "Puncture wounds to plantar foot: clean and probe depth; DO NOT close",
      "Small plantar lacerations heal well by secondary intention",
      "Nail-through-shoe puncture → Pseudomonas risk; ciprofloxacin",
      "Check Lisfranc and calcaneal integrity clinically and with plain films",
      "Non-weight bearing instructions post-closure for plantar wounds",
    ],
    consult:null, abx:false,
  },
  {
    region:"Trunk / Torso", category:"Trunk", risk:"High", icon:"🫀",
    superficialSuture:"3-0 or 4-0 Nylon",
    deepSuture:"2-0 or 3-0 Vicryl",
    irrigation:"50–100 mL/cm (surface only)",
    closure:"Primary for superficial; surgery for penetrating",
    removeAt:"7–10 days",
    notes:[
      "Penetrating abdominal wounds: assess depth — do NOT blindly probe",
      "Fascia violation or peritoneal entry → surgery STAT regardless of stability",
      "Thoracic wounds: pneumothorax and hemothorax must be excluded by CXR",
      "Evisceration → keep bowel moist with saline-soaked gauze; do not reduce; surgery immediately",
      "Stab wounds in stable patients: can explore to fascia in ED — stop there",
    ],
    consult:"Surgery for any wound penetrating beyond superficial fascia", abx:false,
  },
  {
    region:"Neck", category:"Trunk", risk:"Critical", icon:"🫁",
    superficialSuture:"4-0 Nylon (skin only after vascular clearance)",
    deepSuture:"3-0 Vicryl (platysma if violated)",
    irrigation:"Minimal surface only — stabilize airway and vasculature first",
    closure:"Superficial primary; surgical consult for all platysma violations",
    removeAt:"5–7 days",
    notes:[
      "PRIORITY ORDER: Airway → hemorrhage control → neurovascular assessment → closure",
      "Platysma violation → surgical consult regardless of apparent depth",
      "Zone I: below cricoid · Zone II: cricoid to mandible angle · Zone III: above angle",
      "Hard vascular signs (expanding hematoma, bruit, absent pulse) → OR immediately",
      "CTA neck for all penetrating injuries in hemodynamically stable patients",
    ],
    consult:"Surgery / Trauma for any platysma violation or penetrating mechanism", abx:false,
  },
];

const BITES = [
  {
    type:"Dog", icon:"🐕", color:T.orange,
    infectionRisk:"15–20%",
    organisms:["Pasteurella multocida","Streptococcus spp.","Staphylococcus aureus","Capnocytophaga canimorsus","Bacteroides spp."],
    prophylaxis:"Amoxicillin-clavulanate 875/125 mg BID × 3–5 days",
    altProphylaxis:"Doxycycline 100 mg BID + metronidazole 500 mg TID (PCN allergy)",
    closure:"Face: primary closure acceptable (excellent blood supply)\nHands / feet / punctures: delayed primary or secondary intention\nClean wounds <12 hrs in low-risk locations: primary acceptable",
    irrigation:"Copious high-pressure irrigation 150–250 mL/cm with 18g catheter; debride devitalized tissue",
    duration:"3–5 days prophylaxis; extend to 7–10 days if infection established",
    notes:[
      "Most dog bites are crush + avulsion injuries — debride all devitalized tissue before closure",
      "Capnocytophaga canimorsus: serious systemic infection risk in asplenic, immunocompromised, or alcoholic patients",
      "Facial bites: primary closure preferred for cosmesis given excellent facial perfusion",
      "Puncture wounds and hand wounds: delayed closure strongly preferred over primary",
      "Report to animal control if unprovoked attack, stray, or unknown vaccination status",
    ],
    rabiesRisk:"Low if vaccinated domestic dog; higher if stray, unvaccinated, or unknown status",
  },
  {
    type:"Cat", icon:"🐈", color:T.purple,
    infectionRisk:"30–50% — highest among common domestic animals",
    organisms:["Pasteurella multocida (dominant pathogen)","Streptococcus spp.","Staphylococcus aureus","Anaerobes"],
    prophylaxis:"Amoxicillin-clavulanate 875/125 mg BID × 3–5 days for ALL cat bites",
    altProphylaxis:"Doxycycline 100 mg BID (PCN allergy)",
    closure:"Delayed primary for ALL cat bite punctures\nFace: primary acceptable with prophylaxis coverage\nHand bites: always delayed — very high infection and tenosynovitis risk",
    irrigation:"High-pressure irrigation essential; needle injection technique for deep punctures inaccessible by standard syringe",
    duration:"3–5 days minimum; extend to 7–10 days with any signs of infection",
    notes:[
      "Cat bites have the highest infection rate of all common animal bites",
      "Needle-sharp teeth create deep punctures that cannot be adequately irrigated by standard technique",
      "Pasteurella multocida onset is rapid — erythema and swelling within 12–24 hours post-bite",
      "Hand bites: high risk for flexor tenosynovitis and deep space infection — low threshold for hand consult",
      "ALL cat bites should receive prophylactic antibiotics regardless of appearance at time of visit",
    ],
    rabiesRisk:"Moderate — less likely than bat, higher than vaccinated domestic dog",
  },
  {
    type:"Human", icon:"🧑", color:T.coral,
    infectionRisk:"10–50% (clenched fist injuries highest)",
    organisms:["Streptococcus spp.","Staphylococcus aureus","Eikenella corrodens","Oral anaerobes","Fusobacterium spp.","MRSA possible"],
    prophylaxis:"Amoxicillin-clavulanate 875/125 mg BID × 3–5 days",
    altProphylaxis:"Moxifloxacin 400 mg daily (PCN allergy) — covers Eikenella corrodens",
    closure:"Delayed primary for ALL human bites\nClenched fist / fight bite: NEVER close primarily — immediate risk of septic arthritis",
    irrigation:"Copious irrigation; fight bites require careful exploration of MCP joint capsule with finger in full flexion",
    duration:"3–5 days prophylaxis; 10–14 days if infection established",
    notes:[
      "FIGHT BITE (clenched fist striking teeth over MCP): most dangerous human bite pattern",
      "Always examine MCP wounds with finger in BOTH extended and flexed positions — wound migrates proximally with extension",
      "Eikenella corrodens is resistant to clindamycin and first-generation cephalosporins",
      "Assess HIV, Hepatitis B/C exposure risk — obtain baseline serology if exposure likely",
      "MCP joint capsule violation → admit for IV antibiotics; no primary closure",
    ],
    rabiesRisk:"Theoretically possible but no documented cases of human-to-human rabies transmission via bite",
  },
];

const TETANUS = [
  {
    history:"< 3 doses  —  or Unknown history",
    cleanMinor:{ tdap:true,  tig:false, note:"Tdap" },
    allOther:  { tdap:true,  tig:true,  note:"Tdap + TIG 250 IU IM" },
  },
  {
    history:"≥ 3 doses  ·  last booster < 5 years",
    cleanMinor:{ tdap:false, tig:false, note:"Nothing needed" },
    allOther:  { tdap:false, tig:false, note:"Nothing needed" },
  },
  {
    history:"≥ 3 doses  ·  last booster 5–10 years",
    cleanMinor:{ tdap:false, tig:false, note:"Nothing needed" },
    allOther:  { tdap:true,  tig:false, note:"Tdap" },
  },
  {
    history:"≥ 3 doses  ·  last booster > 10 years",
    cleanMinor:{ tdap:true,  tig:false, note:"Tdap" },
    allOther:  { tdap:true,  tig:false, note:"Tdap" },
  },
];

const RABIES_ANIMALS = [
  {
    animal:"Dog / Cat / Ferret — Vaccinated, Available for Observation",
    icon:"🐕🐈",
    risk:"Low",
    action:"Observe animal for 10 days. If animal remains healthy throughout observation: no PEP needed. If animal becomes ill or dies: consult public health immediately and begin PEP.",
    pep:false, color:T.green,
  },
  {
    animal:"Dog / Cat — Unvaccinated or Unknown Vaccination, Available",
    icon:"🐶",
    risk:"Moderate",
    action:"Euthanize and test by DFA if possible. If testing unavailable: consult public health department. PEP may be warranted based on local epidemiology and exposure type.",
    pep:null, color:T.gold,
  },
  {
    animal:"Bat (any direct contact including sleep exposure)",
    icon:"🦇",
    risk:"High",
    action:"PEP indicated UNLESS animal is captured and tests negative by direct fluorescent antibody (DFA). Bat bites often imperceptible — any direct bat contact or sleep exposure warrants PEP.",
    pep:true, color:T.coral,
  },
  {
    animal:"Raccoon / Skunk / Fox / Coyote / Wild Carnivores",
    icon:"🦝",
    risk:"High",
    action:"PEP indicated unless animal is immediately captured and tests negative by DFA. Regard as rabid until proven otherwise. Do not wait for testing if PEP can be started.",
    pep:true, color:T.coral,
  },
  {
    animal:"Rodents — Mouse, Rat, Squirrel, Hamster, Gerbil",
    icon:"🐀",
    risk:"Low",
    action:"PEP almost never indicated. Rodents are rarely infected with rabies. Consult public health for exotic rodents or unusual circumstances (e.g., large urban rat populations in enzootic areas).",
    pep:false, color:T.green,
  },
  {
    animal:"Livestock / Large Animals — Horse, Cattle, Sheep, Goat",
    icon:"🐄",
    risk:"Low–Moderate",
    action:"Consult public health. Rabies possible but uncommon in livestock. Typically observe or test the animal. PEP decisions are individualized based on exposure type and local epidemiology.",
    pep:null, color:T.gold,
  },
];

// ══════════════════════════════════════════════════════════════════
//  SUB-COMPONENTS (module scope — no focus-loss on render)
// ══════════════════════════════════════════════════════════════════

function WoundCard({ lac, expanded, onToggle }) {
  const riskColor = { "Low":T.green, "Moderate":T.gold, "High":T.coral, "Critical":T.red }[lac.risk] || T.txt;
  return (
    <div
      onClick={onToggle}
      style={{
        ...glass, marginBottom:8, cursor:"pointer",
        borderLeft:`3px solid ${riskColor}`,
        background: expanded
          ? `linear-gradient(135deg,${riskColor}10,rgba(8,22,40,0.85))`
          : `linear-gradient(135deg,${riskColor}06,rgba(8,22,40,0.75))`,
        transition:"all .15s",
      }}
    >
      {/* Card header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px" }}>
        <span style={{ fontSize:18 }}>{lac.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
            <span style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:14, color:T.txt }}>{lac.region}</span>
            <Chip label={lac.category} color={T.blue}/>
            <RiskBadge level={lac.risk}/>
            {lac.abx     && <Chip label="ABX ✓"    color={T.orange}/>}
            {lac.consult && <Chip label="Consult"   color={T.purple}/>}
          </div>
          <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, marginTop:3 }}>
            {lac.superficialSuture.split("  —")[0]} · Remove {lac.removeAt}
          </div>
        </div>
        <span style={{ fontFamily:"JetBrains Mono", fontSize:12, color:T.txt4, transform:expanded ? "rotate(90deg)" : "none", transition:"transform .15s" }}>›</span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className={`${PREFIX}-fade`} style={{ padding:"0 14px 14px" }}>
          <div style={{ height:1, background:"rgba(42,79,122,0.3)", marginBottom:12 }}/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
            {[
              { label:"Superficial Suture", val:lac.superficialSuture, color:T.coral  },
              { label:"Deep Suture",         val:lac.deepSuture,        color:T.blue   },
              { label:"Irrigation Volume",   val:lac.irrigation,        color:T.cyan   },
              { label:"Closure Strategy",    val:lac.closure,           color:T.gold   },
            ].map(({ label, val, color }) => (
              <div key={label} style={{
                background:"rgba(14,37,68,0.6)", borderRadius:8,
                border:`1px solid ${color}22`, padding:"8px 10px",
              }}>
                <div style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4, letterSpacing:1, textTransform:"uppercase", marginBottom:3 }}>{label}</div>
                <div style={{ fontFamily:"DM Sans", fontSize:11, color, fontWeight:600, lineHeight:1.45 }}>{val}</div>
              </div>
            ))}
          </div>
          <SectionHeader label="Clinical Notes" color={T.txt4}/>
          {lac.notes.map((n, i) => <BulletRow key={i} text={n} color={riskColor}/>)}
          {(lac.consult || lac.abx) && (
            <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
              {lac.consult && (
                <div style={{ background:"rgba(155,109,255,0.1)", border:"1px solid rgba(155,109,255,0.3)", borderRadius:8, padding:"6px 10px", flex:1 }}>
                  <span style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.purple, letterSpacing:1 }}>CONSULT · </span>
                  <span style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt2 }}>{lac.consult}</span>
                </div>
              )}
              {lac.abx && (
                <div style={{ background:"rgba(255,159,67,0.1)", border:"1px solid rgba(255,159,67,0.3)", borderRadius:8, padding:"6px 10px", flex:1 }}>
                  <span style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.orange, letterSpacing:1 }}>ANTIBIOTICS · </span>
                  <span style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt2 }}>Prophylaxis indicated for this location / mechanism</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BiteCard({ bite }) {
  const [open, setOpen] = useState(false);
  return (
    <GBox style={{ marginBottom:12, cursor:"pointer" }} accent={bite.color}>
      <div onClick={() => setOpen(o => !o)} style={{ padding:"12px 16px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:22 }}>{bite.icon}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:15, color:T.txt }}>{bite.type} Bite</div>
            <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, marginTop:2 }}>
              Infection risk: <span style={{ color:bite.color }}>{bite.infectionRisk}</span>
            </div>
          </div>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            {bite.organisms.slice(0,2).map(o => <Chip key={o} label={o.split(" ")[0]} color={bite.color}/>)}
          </div>
          <span style={{ fontFamily:"JetBrains Mono", fontSize:12, color:T.txt4, marginLeft:8, transform:open ? "rotate(90deg)" : "none", transition:"transform .15s" }}>›</span>
        </div>
      </div>
      {open && (
        <div className={`${PREFIX}-fade`} style={{ padding:"0 16px 16px" }}>
          <div style={{ height:1, background:"rgba(42,79,122,0.3)", marginBottom:12 }}/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
            {[
              { label:"First-line Prophylaxis", val:bite.prophylaxis,    color:bite.color },
              { label:"PCN Allergy",             val:bite.altProphylaxis, color:T.gold     },
              { label:"Closure Strategy",         val:bite.closure,        color:T.cyan     },
              { label:"Irrigation",               val:bite.irrigation,     color:T.blue     },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ background:"rgba(14,37,68,0.6)", borderRadius:8, border:`1px solid ${color}22`, padding:"8px 10px" }}>
                <div style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4, letterSpacing:1, textTransform:"uppercase", marginBottom:3 }}>{label}</div>
                <div style={{ fontFamily:"DM Sans", fontSize:11, color, fontWeight:500, lineHeight:1.45, whiteSpace:"pre-line" }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ background:`${bite.color}0a`, border:`1px solid ${bite.color}22`, borderRadius:8, padding:"8px 10px", marginBottom:10 }}>
            <div style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4, letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>Organisms of Concern</div>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
              {bite.organisms.map(o => <Chip key={o} label={o} color={bite.color}/>)}
            </div>
          </div>
          <SectionHeader label="Key Clinical Points" color={T.txt4}/>
          {bite.notes.map((n, i) => <BulletRow key={i} text={n} color={bite.color}/>)}
          <div style={{ marginTop:8, background:"rgba(59,158,255,0.08)", border:"1px solid rgba(59,158,255,0.22)", borderRadius:8, padding:"6px 10px" }}>
            <span style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.blue, letterSpacing:1 }}>RABIES · </span>
            <span style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt2 }}>{bite.rabiesRisk}</span>
          </div>
        </div>
      )}
    </GBox>
  );
}

// ══════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ══════════════════════════════════════════════════════════════════

export default function WoundHub({ onBack }) {
  const [tab,      setTab]      = useState("laceration");
  const [filter,   setFilter]   = useState("All");
  const [search,   setSearch]   = useState("");
  const [expanded, setExpanded] = useState(null);
  const [toast,    setToast]    = useState("");

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }, []);

  const TABS = [
    { id:"laceration",  label:"Laceration Repair", icon:"🩹" },
    { id:"bites",       label:"Bite Wounds",        icon:"🦷" },
    { id:"prophylaxis", label:"Tetanus / Rabies",   icon:"💉" },
  ];

  const FILTERS = ["All","Head","Extremity","Trunk"];

  const filteredLacs = useMemo(() => {
    return LACERATIONS.filter(l => {
      const matchCat    = filter === "All" || l.category === filter;
      const q           = search.toLowerCase();
      const matchSearch = !q
        || l.region.toLowerCase().includes(q)
        || l.superficialSuture.toLowerCase().includes(q)
        || l.deepSuture.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [filter, search]);

  const ACCENT = T.coral;

  return (
    <div style={{
      fontFamily:"DM Sans, sans-serif",
      background:T.bg, minHeight:"100vh",
      position:"relative", overflowX:"hidden",
      color:T.txt,
    }}>
      <AmbientBg/>
      {toast && <Toast msg={toast}/>}

      <div style={{ position:"relative", zIndex:1, maxWidth:1260, margin:"0 auto", padding:"0 16px" }}>

        {/* ── Header ───────────────────────────────────────────── */}
        <div style={{ padding:"80px 0 14px" }}>
          <HubBadge name="WOUNDHUB" onBack={onBack}/>
          <h1 className={`${PREFIX}-shim`} style={{
            fontFamily:"Playfair Display",
            fontSize:"clamp(24px,4vw,40px)",
            fontWeight:900, letterSpacing:-1, lineHeight:1.1, marginBottom:4,
          }}>
            WoundHub
          </h1>
          <p style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt3 }}>
            Laceration repair by region · Suture type & size · Irrigation volumes · Bite protocols · Tetanus & Rabies decision trees
          </p>
        </div>

        {/* ── Stat banner ──────────────────────────────────────── */}
        <div style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",
          gap:10, marginBottom:16,
        }}>
          <StatTile value="14"     label="Body Regions"      sub="Full suture guidance"   color={ACCENT}    />
          <StatTile value="50–200" label="mL/cm Irrigation"  sub="Pressure-dependent"     color={T.gold}    />
          <StatTile value="3"      label="Bite Protocols"    sub="Dog · Cat · Human"      color={T.orange}  />
          <StatTile value="4.5M"   label="Bites / Year"      sub="US emergency depts"     color={T.purple}  />
        </div>

        {/* ── Tab bar ──────────────────────────────────────────── */}
        <div style={{ ...glass, padding:"5px", display:"flex", gap:4, marginBottom:16 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex:"1 1 auto",
              fontFamily:"DM Sans", fontWeight:600, fontSize:12,
              padding:"9px 8px", borderRadius:9, cursor:"pointer",
              textAlign:"center", transition:"all .15s",
              border:`1px solid ${tab===t.id ? ACCENT+"77" : "transparent"}`,
              background: tab===t.id
                ? `linear-gradient(135deg,${ACCENT}18,${ACCENT}08)`
                : "transparent",
              color: tab===t.id ? ACCENT : T.txt3,
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ══ Tab: Laceration Repair ═══════════════════════════════ */}
        {tab === "laceration" && (
          <div className={`${PREFIX}-fade`}>
            {/* Filter + search row */}
            <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:12, flexWrap:"wrap" }}>
              <div style={{ display:"flex", gap:5, flex:1, flexWrap:"wrap" }}>
                {FILTERS.map(f => (
                  <FilterPill key={f} label={f} active={filter===f} color={ACCENT} onClick={() => setFilter(f)}/>
                ))}
              </div>
              <input
                type="text" value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search region or suture type..."
                style={{
                  background:"rgba(14,37,68,0.8)",
                  border:`1px solid ${search ? ACCENT+"55" : "rgba(42,79,122,0.35)"}`,
                  borderRadius:20, padding:"5px 14px",
                  outline:"none", fontFamily:"DM Sans", fontSize:11,
                  color:T.txt, width:220, transition:"border-color .12s",
                }}
              />
            </div>

            {/* Irrigation primer */}
            <GBox style={{ padding:"12px 16px", marginBottom:12 }} accent={T.cyan}>
              <SectionHeader label="Irrigation Principles" color={T.cyan}/>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:8 }}>
                {[
                  { label:"Device",    val:"18g IV catheter on 35–60 mL syringe",             color:T.cyan   },
                  { label:"Solution",  val:"Normal saline or tap water (equivalent efficacy)", color:T.blue   },
                  { label:"Pressure",  val:"5–8 psi = effective high-pressure irrigation",     color:T.gold   },
                  { label:"Volume",    val:"50–100 mL/cm low-risk · 200+ mL/cm contaminated",  color:ACCENT   },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ background:"rgba(14,37,68,0.5)", borderRadius:8, padding:"7px 10px", border:`1px solid ${color}20` }}>
                    <div style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4, letterSpacing:1, textTransform:"uppercase", marginBottom:2 }}>{label}</div>
                    <div style={{ fontFamily:"DM Sans", fontSize:11, color, lineHeight:1.4 }}>{val}</div>
                  </div>
                ))}
              </div>
            </GBox>

            <SectionHeader
              label={`${filteredLacs.length} region${filteredLacs.length !== 1 ? "s" : ""} — tap to expand`}
              color={T.txt4}
            />
            {filteredLacs.map(lac => (
              <WoundCard
                key={lac.region}
                lac={lac}
                expanded={expanded === lac.region}
                onToggle={() => setExpanded(expanded === lac.region ? null : lac.region)}
              />
            ))}
            {filteredLacs.length === 0 && (
              <div style={{ textAlign:"center", padding:"30px", color:T.txt4, fontFamily:"JetBrains Mono", fontSize:11 }}>
                No results for "{search}"
              </div>
            )}
          </div>
        )}

        {/* ══ Tab: Bite Wounds ══════════════════════════════════════ */}
        {tab === "bites" && (
          <div className={`${PREFIX}-fade`}>
            <GBox style={{ padding:"12px 16px", marginBottom:14 }} accent={T.orange}>
              <SectionHeader label="Bite Wound Principles" color={T.orange}/>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))", gap:8 }}>
                {[
                  { icon:"🚿", label:"Irrigate first",           text:"Copious high-pressure irrigation is the single most effective infection prevention step" },
                  { icon:"⏱", label:"Timing matters",            text:"<8 hrs: primary OK for face / scalp; delayed preferred for hands, feet, punctures" },
                  { icon:"💊", label:"Low threshold for ABX",     text:"All cat bites, human bites, and immunocompromised patients → prophylaxis regardless" },
                  { icon:"📋", label:"Document biting animal",    text:"Species, vaccination status, provoked vs unprovoked, available for observation" },
                ].map(({ icon, label, text }) => (
                  <div key={label} style={{ background:"rgba(14,37,68,0.5)", borderRadius:8, padding:"8px 10px", border:"1px solid rgba(255,159,67,0.2)" }}>
                    <div style={{ fontSize:16, marginBottom:4 }}>{icon}</div>
                    <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:11, color:T.orange, marginBottom:3 }}>{label}</div>
                    <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt2, lineHeight:1.45 }}>{text}</div>
                  </div>
                ))}
              </div>
            </GBox>
            {BITES.map(b => <BiteCard key={b.type} bite={b}/>)}
          </div>
        )}

        {/* ══ Tab: Tetanus / Rabies ══════════════════════════════════ */}
        {tab === "prophylaxis" && (
          <div className={`${PREFIX}-fade`}>

            {/* Tetanus table */}
            <GBox style={{ padding:"14px 16px", marginBottom:14 }} accent={T.green}>
              <SectionHeader label="Tetanus Prophylaxis — Decision Table" color={T.green}/>
              <div style={{ marginBottom:10, fontFamily:"DM Sans", fontSize:11, color:T.txt2 }}>
                <span style={{ color:T.gold, fontWeight:700 }}>"All Other" wounds: </span>
                dirty · contaminated · crush · avulsion · stellate · bite · puncture · frostbite · burn
              </div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"DM Sans", fontSize:12 }}>
                  <thead>
                    <tr>
                      {["Vaccination History","Clean Minor Wound","All Other Wounds"].map(h => (
                        <th key={h} style={{
                          textAlign:"left", padding:"8px 10px",
                          fontFamily:"JetBrains Mono", fontSize:8, letterSpacing:1.5,
                          textTransform:"uppercase", color:T.txt4,
                          borderBottom:"1px solid rgba(42,79,122,0.4)",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TETANUS.map((row, i) => (
                      <tr key={i} style={{ borderBottom:"1px solid rgba(42,79,122,0.2)" }}>
                        <td style={{ padding:"9px 10px", color:T.txt2, fontWeight:600, fontSize:12 }}>{row.history}</td>
                        <td style={{ padding:"9px 10px" }}>
                          <span style={{
                            fontFamily:"JetBrains Mono", fontSize:10, fontWeight:700,
                            color:    row.cleanMinor.tdap ? T.gold  : T.green,
                            background:row.cleanMinor.tdap ? "rgba(245,200,66,0.1)" : "rgba(61,255,160,0.08)",
                            border:   `1px solid ${row.cleanMinor.tdap ? "rgba(245,200,66,0.3)" : "rgba(61,255,160,0.2)"}`,
                            borderRadius:6, padding:"2px 8px",
                          }}>{row.cleanMinor.note}</span>
                        </td>
                        <td style={{ padding:"9px 10px" }}>
                          <span style={{
                            fontFamily:"JetBrains Mono", fontSize:10, fontWeight:700,
                            color:     row.allOther.tig ? T.coral : row.allOther.tdap ? T.gold : T.green,
                            background:row.allOther.tig ? "rgba(255,107,107,0.12)" : row.allOther.tdap ? "rgba(245,200,66,0.1)" : "rgba(61,255,160,0.08)",
                            border:    `1px solid ${row.allOther.tig ? "rgba(255,107,107,0.3)" : row.allOther.tdap ? "rgba(245,200,66,0.3)" : "rgba(61,255,160,0.2)"}`,
                            borderRadius:6, padding:"2px 8px",
                          }}>{row.allOther.note}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop:10, display:"flex", gap:8, flexWrap:"wrap" }}>
                {[
                  { label:"Tdap = Tetanus + Diphtheria + Pertussis (preferred over Td)", color:T.gold   },
                  { label:"TIG = Tetanus Immune Globulin 250 IU IM at different site from Tdap", color:T.coral  },
                  { label:"Td acceptable if Tdap already given within past 10 years", color:T.txt3   },
                ].map(({ label, color }) => (
                  <div key={label} style={{ fontFamily:"DM Sans", fontSize:10, color, background:"rgba(14,37,68,0.5)", borderRadius:6, padding:"4px 8px", border:`1px solid ${color}22` }}>
                    {label}
                  </div>
                ))}
              </div>
            </GBox>

            {/* Rabies PEP */}
            <SectionHeader label="Rabies Post-Exposure Prophylaxis (PEP)" color={T.txt4}/>
            <GBox style={{ padding:"12px 16px", marginBottom:12 }} accent={T.coral}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:8, marginBottom:14 }}>
                {[
                  { label:"RIG Dose",         val:"20 IU/kg total — infiltrate maximum volume into and around wound; administer remainder IM (deltoid)",       color:T.coral  },
                  { label:"Vaccine Series",    val:"Unvaccinated: Days 0, 3, 7, 14\nPreviously vaccinated: Days 0 and 3 only — NO RIG",                       color:T.gold   },
                  { label:"Injection Site",    val:"Vaccine: deltoid ONLY (never gluteal — poor immunogenicity). RIG at different anatomic site from vaccine",  color:T.blue   },
                  { label:"Critical Rule",     val:"RIG is CONTRAINDICATED if previously vaccinated — it inhibits the amnestic immune response",                color:T.purple },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ background:"rgba(14,37,68,0.6)", borderRadius:8, padding:"8px 10px", border:`1px solid ${color}22` }}>
                    <div style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4, letterSpacing:1, textTransform:"uppercase", marginBottom:3 }}>{label}</div>
                    <div style={{ fontFamily:"DM Sans", fontSize:11, color, lineHeight:1.5, whiteSpace:"pre-line" }}>{val}</div>
                  </div>
                ))}
              </div>

              <SectionHeader label="PEP Decision by Animal" color={T.txt4}/>
              {RABIES_ANIMALS.map(a => (
                <div key={a.animal} style={{
                  display:"flex", gap:10, alignItems:"flex-start",
                  marginBottom:8, padding:"8px 10px", borderRadius:8,
                  background:`${a.color}08`, border:`1px solid ${a.color}22`,
                }}>
                  <span style={{ fontSize:18, flexShrink:0, marginTop:2 }}>{a.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4, flexWrap:"wrap" }}>
                      <span style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:12, color:T.txt }}>{a.animal}</span>
                      <RiskBadge level={a.risk}/>
                      {a.pep === true  && <Chip label="PEP INDICATED"          color={T.coral}/>}
                      {a.pep === false && <Chip label="PEP NOT NEEDED"          color={T.green}/>}
                      {a.pep === null  && <Chip label="CONSULT PUBLIC HEALTH"   color={T.gold}/>}
                    </div>
                    <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt2, lineHeight:1.5 }}>{a.action}</div>
                  </div>
                </div>
              ))}
            </GBox>

            {/* Immediate wound management */}
            <GBox style={{ padding:"12px 16px" }} accent={T.blue}>
              <SectionHeader label="Immediate Wound Management — All Animal Bites" color={T.blue}/>
              {[
                "Wash wound immediately with soap and water for ≥ 5 minutes — this single step is the most effective rabies prevention measure available",
                "After soap/water wash: irrigate with virucidal agent (povidone-iodine, 70% ethanol, or dilute chlorhexidine)",
                "Do NOT suture bite wounds unless cosmetically necessary (face) — wound closure increases infection risk",
                "Contact local public health or animal control to coordinate animal observation or testing logistics",
                "Document: date/time, animal species, vaccination status, provoked vs unprovoked, owner contact if available",
              ].map((n, i) => <BulletRow key={i} text={n} color={T.blue}/>)}
            </GBox>

          </div>
        )}

        {/* ── Footer ───────────────────────────────────────────── */}
        <div style={{ textAlign:"center", paddingBottom:24, paddingTop:16 }}>
          <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA · WOUNDHUB · CLINICAL DECISION SUPPORT ONLY · VERIFY WITH LOCAL GUIDELINES
          </span>
        </div>

      </div>
    </div>
  );
}