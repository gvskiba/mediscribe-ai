// WoundCareHub.jsx
// Wound Care & Laceration Reference — standalone + embeddable.

import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

(() => {
  if (document.getElementById("wound-fonts")) return;
  const l = document.createElement("link");
  l.id = "wound-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "wound-css";
  s.textContent = `
    @keyframes wd-fade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
    .wd-fade{animation:wd-fade .18s ease forwards;}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    .shimmer-text{background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#9b6dff 52%,#00e5c0 72%,#e8f0fe 100%);
    background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
    background-clip:text;animation:shimmer 5s linear infinite;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", panel:"#081628",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444",
  cyan:"#00d4ff",
};

const ABX_INDICATIONS = [
  {
    id:"bite_dog", label:"Dog Bite", color:T.orange, icon:"🐕",
    risk:"Moderate — Pasteurella, Capnocytophaga, Staph",
    prophylaxis:"Yes — all dog bites except clean, superficial, low-risk",
    drug:"Amoxicillin-clavulanate 875/125 mg PO BID x 3-5 days",
    penicillin_allergy:"Doxycycline 100 mg PO BID + metronidazole 500 mg TID x 3-5 days",
    duration:"3-5 days (prophylaxis); 10-14 days (established infection)",
    extra:"Consider rabies PEP if wild animal, bat, or unvaccinated domestic animal. Irrigate copiously.",
  },
  {
    id:"bite_cat", label:"Cat Bite", color:T.purple, icon:"🐈",
    risk:"High (80% infection rate) — Pasteurella multocida, deep puncture",
    prophylaxis:"Yes — all cat bites, especially hand/wrist",
    drug:"Amoxicillin-clavulanate 875/125 mg PO BID x 3-5 days",
    penicillin_allergy:"Doxycycline 100 mg PO BID + metronidazole 500 mg TID",
    duration:"3-5 days prophylaxis; 10-14 days infection",
    extra:"Cat bites are deep punctures with very high infection risk — treat all. Most should not be closed primarily.",
  },
  {
    id:"bite_human", label:"Human Bite", color:T.red, icon:"🦷",
    risk:"High — polymicrobial including anaerobes, Eikenella corrodens",
    prophylaxis:"Yes — all human bites",
    drug:"Amoxicillin-clavulanate 875/125 mg PO BID x 3-5 days",
    penicillin_allergy:"Moxifloxacin 400 mg PO daily x 3-5 days",
    duration:"3-5 days prophylaxis",
    extra:"Fight bite (MCP laceration over tooth): high infection risk, do not close primarily, admit if signs of infection. Consider HIV, Hep B/C PEP.",
  },
  {
    id:"open_fracture", label:"Open Fracture", color:T.red, icon:"🦴",
    risk:"Very high — needs orthopedics and IV antibiotics",
    prophylaxis:"Yes — IV antibiotics, not PO",
    drug:"Cefazolin 2g IV q8h (Grade I/II); add gentamicin for Grade III; metronidazole if farm/soil",
    penicillin_allergy:"Clindamycin 600 mg IV q8h + gentamicin",
    duration:"24h (Grade I/II); 48-72h (Grade III)",
    extra:"Gustilo classification guides duration. Cover wound with saline-soaked gauze. OR within 6-8h. Tetanus prophylaxis.",
  },
  {
    id:"hand_laceration", label:"Hand / Finger", color:T.blue, icon:"🤚",
    risk:"Moderate — Staph, Strep; higher risk if tendon/joint involvement",
    prophylaxis:"Selected — if: contaminated, deep, over joint, crush",
    drug:"Cephalexin 500 mg PO QID x 3-5 days",
    penicillin_allergy:"Clindamycin 300 mg PO TID x 3-5 days",
    duration:"3-5 days",
    extra:"Examine extensor tendon with finger in flexion — missed extensor injuries are common. Test grip strength and ROM.",
  },
  {
    id:"intraoral", label:"Intraoral / Lip", color:T.gold, icon:"👄",
    risk:"Moderate — oral flora, anaerobes",
    prophylaxis:"Selected — through-and-through lip/cheek, bites, contaminated",
    drug:"Amoxicillin-clavulanate 875/125 mg PO BID x 3-5 days",
    penicillin_allergy:"Metronidazole 500 mg TID + azithromycin 500 mg daily",
    duration:"3-5 days",
    extra:"Penicillin V 500 mg QID acceptable alternative for isolated intraoral wounds without skin involvement.",
  },
  {
    id:"contaminated", label:"Highly Contaminated", color:T.coral, icon:"🌿",
    risk:"High — soil, feces, marine, foreign body",
    prophylaxis:"Yes — for soil/farm wounds, water exposure, immunocompromised",
    drug:"Amoxicillin-clavulanate 875/125 mg PO BID (land/soil); add doxycycline for marine",
    penicillin_allergy:"Trimethoprim-sulfamethoxazole DS BID + metronidazole TID",
    duration:"3-5 days",
    extra:"Marine wounds: Vibrio risk — doxycycline 100 mg BID + cefepime or ciprofloxacin. Freshwater: Aeromonas — add ciprofloxacin.",
  },
  {
    id:"immunocompromised", label:"Immunocompromised", color:T.purple, icon:"💊",
    risk:"High — impaired wound healing and infection control",
    prophylaxis:"Threshold lower — consider for wounds that would not otherwise require it",
    drug:"Amoxicillin-clavulanate 875/125 mg PO BID as baseline",
    penicillin_allergy:"Clindamycin 300 mg PO TID",
    duration:"5-7 days",
    extra:"Includes: DM, steroids, chemotherapy, HIV with low CD4, renal/hepatic failure, splenectomy. Lower threshold to admit if any sign of early infection.",
  },
  {
    id:"clean_low_risk", label:"Clean Low-Risk", color:T.teal, icon:"✂️",
    risk:"Low — Staph, Strep; most clean lacerations do not need antibiotics",
    prophylaxis:"No — routine prophylaxis not recommended",
    drug:"None — routine antibiotic prophylaxis does not reduce infection in clean wounds",
    penicillin_allergy:"N/A",
    duration:"N/A",
    extra:"Thorough irrigation is the most effective infection prevention. Clean lacerations on face, scalp, and trunk have very low infection rates.",
  },
];

const TETANUS_WOUND_TYPES = [
  { id:"clean_minor", label:"Clean, minor wound", tetanusRisk:false },
  { id:"other",       label:"All other wounds",   tetanusRisk:true,
    hint:"Contaminated, puncture, avulsion, crush, burn, frostbite, >6h old" },
];

function tetanusDecision(woundType, vacStatus, lastBoosterYrs) {
  if (!woundType || !vacStatus) return null;
  const clean    = woundType === "clean_minor";
  const unk_lt3  = vacStatus === "unknown" || vacStatus === "less_than_3";
  const complete = vacStatus === "complete";
  const lastBst  = parseFloat(lastBoosterYrs) || 999;

  if (clean) {
    if (unk_lt3)                   return { tdap:true,  tig:false, note:"Tdap if not previously vaccinated (preferred over Td)" };
    if (complete && lastBst < 5)   return { tdap:false, tig:false, note:"Booster current — no prophylaxis needed" };
    if (complete && lastBst < 10)  return { tdap:false, tig:false, note:"No prophylaxis needed" };
    if (complete && lastBst >= 10) return { tdap:true,  tig:false, note:"Tdap booster (preferred) or Td" };
    return { tdap:false, tig:false, note:"No prophylaxis needed" };
  } else {
    if (unk_lt3)                   return { tdap:true,  tig:true,  note:"Tdap + TIG 250 units IM at separate sites" };
    if (complete && lastBst < 5)   return { tdap:false, tig:false, note:"Booster current — no prophylaxis needed" };
    if (complete && lastBst < 10)  return { tdap:true,  tig:false, note:"Tdap booster — series complete" };
    return { tdap:true,  tig:false, note:"Tdap booster" };
  }
}

const CLOSURE_METHODS = [
  {
    method:"Primary Closure", timing:"Within 6-8h (face up to 12-24h)",
    color:T.teal, icon:"🪡",
    suitable:["Clean or minimally contaminated wounds","Wounds < 6h old (face up to 12-24h)","Adequate blood supply — face, scalp excellent","Wounds can be closed without tension"],
    notSuitable:["Heavily contaminated or infected wounds","Puncture wounds, especially bites","Wounds >12h old (except face/scalp)","Crush injuries with devitalized tissue"],
    techniques:["Simple interrupted: workhorse — use for most lacerations","Vertical mattress: for wound edges that invert or high tension","Horizontal mattress: for broad dead space or skin fragility","Subcuticular/running: excellent cosmesis — face/cosmetic areas","Staples: scalp, trunk, extremities — rapid, low scarring"],
  },
  {
    method:"Delayed Primary Closure", timing:"3-5 days after initial wound care",
    color:T.gold, icon:"⏰",
    suitable:["Contaminated wounds that need irrigation and observation","Bite wounds (except face) — allow early infection to declare","Wounds >12h old in most locations","Wounds with significant devitalized tissue after debridement"],
    notSuitable:["Wounds with adequate perfusion that can be closed primarily","Face wounds (usually primary closure acceptable)"],
    techniques:["Pack wound with saline-moistened gauze — change BID","Leave loose sutures in place to facilitate delayed closure","Re-evaluate at 3-5 days — close if no signs of infection","Closure with simple interrupted once wound appears clean"],
  },
  {
    method:"Secondary Intention", timing:"Allow to heal without closure",
    color:T.purple, icon:"🌱",
    suitable:["Infected wounds requiring open management","Small puncture wounds with good drainage","Wounds after I&D of abscess","Wounds with significant tissue loss"],
    notSuitable:["Wounds where secondary healing would result in poor functional outcome","Wounds over joints (contracture risk)","Large wounds requiring reconstruction"],
    techniques:["Moist wound healing — saline-moistened dressing BID","Wound VAC (negative pressure) for large wounds","Silvadene or antibiotic-impregnated dressings if infection risk","Close follow-up — plastic surgery if poor healing at 2 weeks"],
  },
  {
    method:"Tissue Adhesive (Dermabond)", timing:"Immediate — within 8h",
    color:T.cyan, icon:"🔵",
    suitable:["Clean wounds < 3 cm on low-tension areas","Linear, easily approximated wound edges","Scalp lacerations (clean, non-gaping)","Pediatric lacerations to avoid suture anxiety"],
    notSuitable:["High-tension areas (joints, hands)","Mucosal surfaces or areas with moisture","Contaminated wounds","Wounds with irregular edges or tissue gap"],
    techniques:["Approximate wound edges manually first — hold for 30 sec","Apply 3 thin layers — allow each to dry before next","Do NOT apply inside wound — topical only","Advise patient: no petroleum-based products over adhesive"],
  },
  {
    method:"Steri-Strips", timing:"Immediate — within 8h",
    color:T.blue, icon:"🩹",
    suitable:["Superficial wounds with minimal tension","Wounds in elderly patients with fragile skin","Wounds over bony prominences where adhesion is good","Adjunct to reinforce sutured repairs"],
    notSuitable:["Hairy areas without shaving","Areas exposed to moisture (hands, feet, axilla)","Wounds requiring precise deep layer closure"],
    techniques:["Ensure skin is clean and dry — benzoin tincture improves adhesion","Apply strips perpendicular to wound, bridging edges","Leave strips in place until they fall off naturally (5-10 days)","Do not apply strips over each other — allow skin to breathe"],
  },
];

const SPECIAL_LOCATIONS = [
  {
    location:"Face", color:T.purple, icon:"😊",
    blood_supply:"Excellent — infection risk very low",
    closure_timing:"Up to 12-24h post-injury acceptable",
    key_considerations:[
      "Meticulous anatomic layer-by-layer closure — align landmarks",
      "Vermilion border: must be precisely aligned — off by 1mm is noticeable",
      "Eyebrow: never shave — hair pattern guides alignment",
      "Eyelid: refer to ophthalmology if tarsal plate or canaliculus involved",
      "Through-and-through: close mucosa, muscle, then skin",
    ],
    suture_choice:"5-0 or 6-0 nylon for skin; 4-0 absorbable for subcutaneous",
    removal:"5 days face; 3-4 days eyelid",
    followup:"Plastic surgery if complex, near eyes, or poor cosmetic result anticipated",
    abx:"Not routinely indicated for clean facial lacerations",
  },
  {
    location:"Hand / Fingers", color:T.blue, icon:"🤚",
    blood_supply:"Good but small vessels — ischemia from tourniquet or tight sutures",
    closure_timing:"Within 6-8h; delayed acceptable for contaminated wounds",
    key_considerations:[
      "Full neurovascular exam before anesthetic: 2-point discrimination, cap refill, sensation",
      "Test ALL tendons through full ROM — partial tendon lacerations missed without full flexion",
      "Extensor tendon over MCP: assume fight bite — do not close primarily",
      "Ring avulsion: call hand surgery — vascular injury requires emergent repair",
      "Tip amputation with bone exposure: refer to hand surgery vs local flap",
    ],
    suture_choice:"4-0 or 5-0 nylon; consider skin staples for clean lacerations",
    removal:"10-14 days (hands under tension longer)",
    followup:"Hand surgery/plastic for tendon injury, nerve injury, or amputation",
    abx:"Selected — contaminated, over joints, bite wounds",
  },
  {
    location:"Scalp", color:T.teal, icon:"🧑",
    blood_supply:"Extremely vascular — significant bleeding expected",
    closure_timing:"Most scalp wounds close well even delayed up to 12-24h",
    key_considerations:[
      "Direct pressure controls bleeding — galeal layer is key",
      "Shave only the wound edges — not the surrounding scalp",
      "Galea: close separately with 2-0 or 3-0 absorbable if gaping — prevents hematoma",
      "Staples preferred — fast, strong, low scarring in scalp",
      "Palpate wound for fracture before closing — do CT if concern",
    ],
    suture_choice:"Staples preferred; 3-0 nylon for cosmetic areas; 3-0 absorbable for galeal layer",
    removal:"7-10 days (staples or sutures)",
    followup:"Neurosurgery if underlying fracture or neurologic signs",
    abx:"Not routinely indicated — excellent blood supply, low infection rate",
  },
  {
    location:"Foot / Sole", color:T.orange, icon:"🦶",
    blood_supply:"Good — but dependent on perfusion (DM, PVD risk factors)",
    closure_timing:"Within 6-8h; high contamination risk from footwear/environment",
    key_considerations:[
      "Examine for foreign body — glass and metal common — X-ray first",
      "Plantar wounds over weight-bearing surfaces: non-weight-bearing for 1-2 weeks",
      "Puncture wounds in diabetics: high risk of deep space infection — low threshold to probe",
      "Lawnmower injuries: extensive debridement, orthopedics, vascular surgery often needed",
      "Compartment syndrome risk after high-energy foot trauma",
    ],
    suture_choice:"4-0 nylon for skin; 3-0 absorbable for deep layers",
    removal:"10-14 days (weight-bearing stress on sutures)",
    followup:"Orthopedics for tendon/joint/fracture involvement; vascular surgery if perfusion concern",
    abx:"Yes for contaminated wounds; diabetics: lower threshold",
  },
  {
    location:"Lip / Mouth", color:T.gold, icon:"👄",
    blood_supply:"Excellent",
    closure_timing:"Up to 12h for intraoral; 6-8h for through-and-through",
    key_considerations:[
      "Vermilion border must be perfectly aligned — place first suture at border",
      "Through-and-through: close mucosa with 4-0 chromic, then orbicularis, then skin",
      "Intraoral lacerations < 1cm often heal without closure",
      "Large intraoral lacerations: 4-0 chromic gut or absorbable — do not use nylon in mouth",
      "Check occlusion after repair — can affect bite if not aligned correctly",
    ],
    suture_choice:"5-0 or 6-0 nylon for skin; 4-0 chromic or Vicryl for mucosa",
    removal:"5 days for skin; mucosa is absorbable",
    followup:"ENT or oral surgery for complex through-and-through or vermilion misalignment",
    abx:"Selected — penicillin-based for through-and-through or bite wounds",
  },
];

// ── Irrigation Calculator ─────────────────────────────────────────────────────
function IrrigationCalc() {
  const [lengthCm,  setLengthCm]  = useState("");
  const [contamination, setContam]= useState("clean");

  const calcVolume = useMemo(() => {
    const len = parseFloat(lengthCm) || 0;
    if (!len) return null;
    const basePerCm = contamination === "contaminated" ? 150 : 100;
    const volume    = Math.round(len * basePerCm);
    return { volume };
  }, [lengthCm, contamination]);

  return (
    <div>
      <div style={{ padding:"8px 11px", borderRadius:8, marginBottom:10,
        background:"rgba(0,229,192,0.07)",
        border:"1px solid rgba(0,229,192,0.25)" }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
          color:T.txt3, lineHeight:1.65 }}>
          High-pressure irrigation (5-8 psi) with normal saline is the single most effective intervention
          to reduce wound infection. More volume is better — do not under-irrigate.
        </div>
      </div>

      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:10 }}>
        <div style={{ flex:1, minWidth:140 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.3, textTransform:"uppercase", marginBottom:4 }}>
            Wound Length (cm)
          </div>
          <input type="number" value={lengthCm}
            onChange={e => setLengthCm(e.target.value)}
            placeholder="e.g. 3"
            style={{ width:"100%", padding:"8px 11px",
              background:"rgba(14,37,68,0.75)",
              border:`1px solid ${lengthCm ? T.teal+"55" : "rgba(42,79,122,0.4)"}`,
              borderRadius:7, outline:"none",
              fontFamily:"'JetBrains Mono',monospace", fontSize:20,
              fontWeight:700, color:T.teal }} />
        </div>
        <div style={{ flex:1, minWidth:180 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.3, textTransform:"uppercase", marginBottom:4 }}>
            Contamination Level
          </div>
          <div style={{ display:"flex", gap:5 }}>
            {[
              { id:"clean",        label:"Clean"        },
              { id:"contaminated", label:"Contaminated" },
            ].map(c => (
              <button key={c.id} onClick={() => setContam(c.id)}
                style={{ flex:1, padding:"8px 8px", borderRadius:7, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                  transition:"all .12s",
                  border:`1px solid ${contamination===c.id
                    ? c.id==="contaminated" ? T.coral+"66" : T.teal+"66"
                    : "rgba(42,79,122,0.4)"}`,
                  background:contamination===c.id
                    ? c.id==="contaminated" ? "rgba(255,107,107,0.12)" : "rgba(0,229,192,0.1)"
                    : "transparent",
                  color:contamination===c.id
                    ? c.id==="contaminated" ? T.coral : T.teal
                    : T.txt4 }}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {calcVolume && (
        <div style={{ padding:"12px 14px", borderRadius:10,
          background:"rgba(0,229,192,0.07)",
          border:"2px solid rgba(0,229,192,0.4)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.txt4, letterSpacing:1.5, textTransform:"uppercase", marginBottom:2 }}>
                Irrigation Volume
              </div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:36, fontWeight:700, color:T.teal, lineHeight:1 }}>
                {calcVolume.volume}
              </div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:10, color:T.teal }}>mL</div>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:T.txt2, lineHeight:1.6 }}>
                <div>Target pressure: 5-8 psi (18-gauge catheter with 35 mL syringe or commercial shield)</div>
                <div style={{ marginTop:3 }}>
                  Technique: 35 mL syringe + 18-gauge catheter or splash shield.
                  Hold 2-3 cm above wound. Irrigate all recesses.
                </div>
                <div style={{ marginTop:3, color:T.txt4 }}>
                  Solution: Normal saline preferred.
                  Tap water acceptable for low-contamination wounds.
                  Avoid hydrogen peroxide and betadine — cytotoxic to tissues.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop:10, display:"grid",
        gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:7 }}>
        {[
          { label:"Pressure target",  val:"5-8 psi",               color:T.teal   },
          { label:"Clean wound",      val:"100 mL/cm",              color:T.green  },
          { label:"Contaminated",     val:"150-200 mL/cm",          color:T.coral  },
          { label:"Bite wounds",      val:"200+ mL/cm",             color:T.red    },
          { label:"Avoid",            val:"H2O2, betadine scrub",   color:T.gold   },
          { label:"Acceptable",       val:"Tap water for low-risk", color:T.blue   },
        ].map(b => (
          <div key={b.label} style={{ padding:"6px 10px", borderRadius:7,
            background:`${b.color}09`,
            border:`1px solid ${b.color}25` }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1, textTransform:"uppercase" }}>{b.label}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:12, fontWeight:700, color:b.color, marginTop:2 }}>{b.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tetanus Decision Tree ─────────────────────────────────────────────────────
function TetanusTree() {
  const [woundType,      setWoundType]   = useState("");
  const [vacStatus,      setVacStatus]   = useState("");
  const [lastBoosterYrs, setLastBooster] = useState("");

  const decision = useMemo(() =>
    tetanusDecision(woundType, vacStatus, lastBoosterYrs),
    [woundType, vacStatus, lastBoosterYrs]
  );

  const selStyle = (active, color) => ({
    flex:"1 1 auto", padding:"8px 10px", borderRadius:8, cursor:"pointer",
    textAlign:"left", transition:"all .12s",
    border:`1px solid ${active ? color+"66" : "rgba(26,53,85,0.4)"}`,
    background:active ? `${color}14` : "rgba(8,22,40,0.5)",
    color:active ? color : T.txt4,
    fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
  });

  return (
    <div>
      <div style={{ marginBottom:10 }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.txt4, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>
          Step 1 — Wound Type
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {TETANUS_WOUND_TYPES.map(wt => (
            <button key={wt.id} onClick={() => setWoundType(wt.id)}
              style={selStyle(woundType===wt.id, wt.tetanusRisk ? T.coral : T.teal)}>
              <div>{wt.label}</div>
              {wt.hint && (
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9,
                  color:T.txt4, marginTop:2, fontWeight:400 }}>{wt.hint}</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {woundType && (
        <div style={{ marginBottom:10 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>
            Step 2 — Tetanus Vaccination History
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {[
              { id:"complete",    label:"Complete series (3+ doses)", color:T.teal   },
              { id:"less_than_3", label:"Less than 3 doses received", color:T.orange },
              { id:"unknown",     label:"Unknown / undocumented",     color:T.coral  },
            ].map(vs => (
              <button key={vs.id} onClick={() => setVacStatus(vs.id)}
                style={selStyle(vacStatus===vs.id, vs.color)}>
                {vs.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {woundType && vacStatus === "complete" && (
        <div style={{ marginBottom:10 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>
            Step 3 — Years Since Last Tetanus Booster
          </div>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            {[
              { label:"Less than 5 years", val:"3"  },
              { label:"5 to 10 years",     val:"7"  },
              { label:"More than 10 years",val:"11" },
            ].map(opt => (
              <button key={opt.val}
                onClick={() => setLastBooster(opt.val)}
                style={selStyle(lastBoosterYrs===opt.val, T.purple)}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {decision && (
        <div style={{ padding:"12px 14px", borderRadius:10,
          background:decision.tdap || decision.tig
            ? "rgba(255,159,67,0.1)" : "rgba(61,255,160,0.07)",
          border:`2px solid ${decision.tdap || decision.tig
            ? T.orange+"55" : T.green+"55"}` }}>
          <div style={{ fontFamily:"'Playfair Display',serif",
            fontWeight:700, fontSize:15,
            color:decision.tdap || decision.tig ? T.orange : T.green,
            marginBottom:8 }}>
            {decision.tdap || decision.tig ? "Prophylaxis Required" : "No Prophylaxis Needed"}
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:8 }}>
            {[
              { label:"Tdap / Td",
                val:decision.tdap ? "Give now" : "Not required",
                color:decision.tdap ? T.orange : T.teal },
              { label:"TIG (250 units IM)",
                val:decision.tig ? "Give now (separate site)" : "Not required",
                color:decision.tig ? T.red : T.teal },
            ].map(b => (
              <div key={b.label} style={{ padding:"7px 11px", borderRadius:8,
                background:`${b.color}0d`, border:`1px solid ${b.color}33` }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:T.txt4, letterSpacing:1, marginBottom:2 }}>{b.label}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:13, fontWeight:700, color:b.color }}>{b.val}</div>
              </div>
            ))}
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:T.txt2, lineHeight:1.6 }}>{decision.note}</div>
        </div>
      )}

      <div style={{ marginTop:10, padding:"8px 11px", borderRadius:8,
        background:"rgba(42,79,122,0.08)",
        border:"1px solid rgba(42,79,122,0.25)" }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.txt4, letterSpacing:1.5, textTransform:"uppercase", marginBottom:5 }}>
          Tetanus Reference
        </div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
          color:T.txt4, lineHeight:1.65 }}>
          Tdap preferred over Td if patient has never received Tdap.
          TIG provides immediate passive immunity — give opposite deltoid from Tdap.
          Pregnancy: Tdap recommended 27-36 weeks regardless of prior Tdap history.
          Immunocompromised: give TIG for all but clean minor wounds regardless of vaccination status.
        </div>
      </div>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, icon, accent, open, onToggle, badge, children }) {
  const ac = accent || T.teal;
  return (
    <div style={{ marginBottom:8 }}>
      <button onClick={onToggle}
        style={{ display:"flex", alignItems:"center", gap:8, width:"100%",
          padding:"9px 13px",
          background:open
            ? `linear-gradient(135deg,${ac}12,rgba(8,22,40,0.92))`
            : "rgba(8,22,40,0.65)",
          border:`1px solid ${open ? ac+"55" : "rgba(26,53,85,0.4)"}`,
          borderRadius:open ? "10px 10px 0 0" : 10,
          cursor:"pointer", textAlign:"left", transition:"all .15s" }}>
        <span style={{ fontSize:16 }}>{icon}</span>
        <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
          fontSize:13, color:open ? ac : T.txt3, flex:1 }}>{title}</span>
        {badge && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            fontWeight:700, padding:"2px 8px", borderRadius:4,
            background:`${badge.color}18`, border:`1px solid ${badge.color}40`,
            color:badge.color, letterSpacing:1, textTransform:"uppercase" }}>
            {badge.text}
          </span>
        )}
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:open ? ac : T.txt4, letterSpacing:1, marginLeft:6 }}>
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && (
        <div style={{ padding:"12px 13px",
          background:"rgba(8,22,40,0.65)",
          border:`1px solid ${ac}33`, borderTop:"none",
          borderRadius:"0 0 10px 10px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function WoundCareHub({
  embedded = false,
  demo, medications, allergies, pmhSelected,
}) {
  const navigate = useNavigate();
  const [sIrrig, setSIrrig] = useState(true);
  const [sClose, setSClose] = useState(false);
  const [sAbx,   setSAbx]   = useState(false);
  const [sTet,   setSTet]   = useState(false);
  const [sSpec,  setSSpec]  = useState(false);

  const [selectedAbx,   setSelectedAbx]   = useState(null);
  const [selectedLoc,   setSelectedLoc]   = useState(null);
  const [selectedClose, setSelectedClose] = useState(null);

  const hasPenAllergy = useMemo(() => {
    const all = (allergies || []).map(a =>
      (typeof a === "string" ? a : a.name || "").toLowerCase()
    );
    return all.some(a =>
      a.includes("penicillin") || a.includes("amoxicillin") ||
      a.includes("ampicillin") || a.includes("augmentin")
    );
  }, [allergies]);

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",
      background: embedded ? "transparent" : T.bg,
      minHeight:  embedded ? "auto" : "100vh",
      color:T.txt }}>

      <div style={{ maxWidth:1100, margin:"0 auto",
        padding: embedded ? "0" : "0 16px" }}>

        {!embedded && (
          <div style={{ padding:"18px 0 14px" }}>
            <button onClick={() => navigate("/hub")}
              style={{ marginBottom:10, display:"inline-flex",
                alignItems:"center", gap:7,
                fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
                background:"rgba(14,37,68,0.7)",
                border:"1px solid rgba(42,79,122,0.5)",
                borderRadius:8, padding:"5px 14px",
                color:T.txt3, cursor:"pointer" }}>
              {"← Back to Hub"}
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <div style={{ background:"rgba(5,15,30,0.9)",
                border:"1px solid rgba(42,79,122,0.6)",
                borderRadius:10, padding:"5px 12px",
                display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.purple, letterSpacing:3 }}>NOTRYA</span>
                <span style={{ color:T.txt4, fontFamily:"'JetBrains Mono',monospace", fontSize:10 }}>/</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.txt3, letterSpacing:2 }}>WOUND</span>
              </div>
              <div style={{ height:1, flex:1,
                background:"linear-gradient(90deg,rgba(0,229,192,0.5),transparent)" }} />
            </div>
            <h1 className="shimmer-text"
              style={{ fontFamily:"'Playfair Display',serif",
                fontSize:"clamp(22px,4vw,38px)", fontWeight:900,
                letterSpacing:-0.5, lineHeight:1.1 }}>
              Wound Care Reference
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:T.txt4, marginTop:4 }}>
              Irrigation Calculator · Closure Guide · Antibiotic Prophylaxis · Tetanus · Special Locations
            </p>
          </div>
        )}

        {embedded && (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <span style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:15, color:T.teal }}>
              Wound Care
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
              background:"rgba(0,229,192,0.1)",
              border:"1px solid rgba(0,229,192,0.25)",
              borderRadius:4, padding:"2px 7px" }}>
              Irrigation · Closure · Tetanus · Abx
            </span>
            {hasPenAllergy && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.coral, letterSpacing:1,
                background:"rgba(255,107,107,0.1)",
                border:"1px solid rgba(255,107,107,0.35)",
                borderRadius:4, padding:"2px 8px" }}>
                {"⛔ PENICILLIN ALLERGY — Alternate abx shown"}
              </span>
            )}
          </div>
        )}

        {hasPenAllergy && (
          <div style={{ padding:"8px 12px", borderRadius:9, marginBottom:10,
            background:"rgba(255,107,107,0.08)",
            border:"1px solid rgba(255,107,107,0.3)" }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:T.coral, lineHeight:1.6 }}>
              <strong>Penicillin allergy detected</strong> — all antibiotic recommendations
              below are showing the penicillin-allergy alternative as the primary choice.
              Verify allergy type (rash vs anaphylaxis) and cross-reactivity risk before prescribing.
            </div>
          </div>
        )}

        {/* 1. Irrigation */}
        <Section title="Wound Irrigation Calculator" icon="💧" accent={T.teal}
          open={sIrrig} onToggle={() => setSIrrig(p => !p)}>
          <IrrigationCalc />
        </Section>

        {/* 2. Closure */}
        <Section title="Wound Closure Method Guide" icon="🪡" accent={T.purple}
          open={sClose} onToggle={() => setSClose(p => !p)}>
          <div style={{ display:"grid",
            gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:8 }}>
            {CLOSURE_METHODS.map(cm => (
              <div key={cm.method}
                onClick={() => setSelectedClose(p => p===cm.method ? null : cm.method)}
                style={{ padding:"10px 12px", borderRadius:9, cursor:"pointer",
                  transition:"all .15s",
                  background:`${cm.color}09`,
                  border:`1px solid ${selectedClose===cm.method ? cm.color+"66" : cm.color+"28"}`,
                  borderTop:`3px solid ${cm.color}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
                  <span style={{ fontSize:18 }}>{cm.icon}</span>
                  <div>
                    <div style={{ fontFamily:"'Playfair Display',serif",
                      fontWeight:700, fontSize:13, color:cm.color }}>{cm.method}</div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace",
                      fontSize:8, color:T.txt4, marginTop:1 }}>{cm.timing}</div>
                  </div>
                </div>
                {selectedClose === cm.method && (
                  <div style={{ marginTop:8, borderTop:"1px solid rgba(26,53,85,0.3)",
                    paddingTop:8 }}>
                    {[
                      { label:"Suitable for", items:cm.suitable,    color:T.teal  },
                      { label:"Avoid when",   items:cm.notSuitable, color:T.coral },
                      { label:"Techniques",   items:cm.techniques,  color:T.blue  },
                    ].map(sec => (
                      <div key={sec.label} style={{ marginBottom:7 }}>
                        <div style={{ fontFamily:"'JetBrains Mono',monospace",
                          fontSize:8, color:sec.color, letterSpacing:1,
                          textTransform:"uppercase", marginBottom:4 }}>{sec.label}</div>
                        {sec.items.map((item, i) => (
                          <div key={i} style={{ display:"flex", gap:5,
                            alignItems:"flex-start", marginBottom:2 }}>
                            <span style={{ color:sec.color, fontSize:7,
                              marginTop:3, flexShrink:0 }}>{"▸"}</span>
                            <span style={{ fontFamily:"'DM Sans',sans-serif",
                              fontSize:10, color:T.txt3, lineHeight:1.5 }}>{item}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* 3. Antibiotics */}
        <Section title="Antibiotic Prophylaxis by Wound Type" icon="💊" accent={T.orange}
          open={sAbx} onToggle={() => setSAbx(p => !p)}>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:10 }}>
            {ABX_INDICATIONS.map(a => (
              <button key={a.id}
                onClick={() => setSelectedAbx(p => p===a.id ? null : a.id)}
                style={{ display:"flex", alignItems:"center", gap:6,
                  padding:"5px 12px", borderRadius:20, cursor:"pointer",
                  transition:"all .12s",
                  border:`1px solid ${selectedAbx===a.id ? a.color+"77" : a.color+"33"}`,
                  background:selectedAbx===a.id ? `${a.color}18` : `${a.color}08`,
                  color:selectedAbx===a.id ? a.color : T.txt4,
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11 }}>
                <span>{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>

          {selectedAbx && (() => {
            const abx = ABX_INDICATIONS.find(a => a.id === selectedAbx);
            if (!abx) return null;
            const showAlt = hasPenAllergy && abx.penicillin_allergy !== "N/A";
            return (
              <div style={{ padding:"11px 13px", borderRadius:9,
                background:`${abx.color}09`,
                border:`1px solid ${abx.color}33`,
                borderLeft:`4px solid ${abx.color}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <span style={{ fontSize:20 }}>{abx.icon}</span>
                  <div>
                    <div style={{ fontFamily:"'Playfair Display',serif",
                      fontWeight:700, fontSize:14, color:abx.color }}>{abx.label}</div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                      color:T.txt4, marginTop:1 }}>Risk: {abx.risk}</div>
                  </div>
                  <div style={{ marginLeft:"auto",
                    fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                    fontWeight:700, padding:"3px 10px", borderRadius:20,
                    background: abx.prophylaxis.startsWith("Yes")
                      ? "rgba(255,107,107,0.12)" : "rgba(61,255,160,0.1)",
                    border:`1px solid ${abx.prophylaxis.startsWith("Yes")
                      ? "rgba(255,107,107,0.4)" : "rgba(61,255,160,0.4)"}`,
                    color:abx.prophylaxis.startsWith("Yes") ? T.coral : T.green }}>
                    {abx.prophylaxis.startsWith("Yes") ? "ABX Indicated" :
                     abx.prophylaxis.startsWith("No")  ? "No ABX Needed" : "Selected"}
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
                  gap:8, marginBottom:8 }}>
                  <div style={{ padding:"8px 10px", borderRadius:7,
                    background: showAlt ? "rgba(255,107,107,0.07)" : `${abx.color}09`,
                    border:`1px solid ${showAlt ? T.coral+"33" : abx.color+"25"}` }}>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace",
                      fontSize:8, letterSpacing:1, textTransform:"uppercase",
                      color:showAlt ? T.coral : abx.color, marginBottom:4 }}>
                      {showAlt ? "Penicillin Allergy Alternative" : "First-Line Antibiotic"}
                    </div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                      color:T.txt2 }}>{showAlt ? abx.penicillin_allergy : abx.drug}</div>
                  </div>
                  <div style={{ padding:"8px 10px", borderRadius:7,
                    background:"rgba(42,79,122,0.1)",
                    border:"1px solid rgba(42,79,122,0.25)" }}>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace",
                      fontSize:8, color:T.txt4, letterSpacing:1,
                      textTransform:"uppercase", marginBottom:4 }}>Duration</div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif",
                      fontSize:11, color:T.txt2 }}>{abx.duration}</div>
                  </div>
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10.5,
                  color:T.txt4, lineHeight:1.6 }}>{abx.extra}</div>
              </div>
            );
          })()}
        </Section>

        {/* 4. Tetanus */}
        <Section title="Tetanus Prophylaxis Decision" icon="💉" accent={T.gold}
          open={sTet} onToggle={() => setSTet(p => !p)}>
          <TetanusTree />
        </Section>

        {/* 5. Special Locations */}
        <Section title="Special Location Considerations" icon="📍" accent={T.blue}
          open={sSpec} onToggle={() => setSSpec(p => !p)}>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:10 }}>
            {SPECIAL_LOCATIONS.map(loc => (
              <button key={loc.location}
                onClick={() => setSelectedLoc(p => p===loc.location ? null : loc.location)}
                style={{ display:"flex", alignItems:"center", gap:6,
                  padding:"6px 14px", borderRadius:20, cursor:"pointer",
                  transition:"all .12s",
                  border:`1px solid ${selectedLoc===loc.location ? loc.color+"77" : loc.color+"33"}`,
                  background:selectedLoc===loc.location ? `${loc.color}18` : `${loc.color}08`,
                  color:selectedLoc===loc.location ? loc.color : T.txt4,
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11 }}>
                <span>{loc.icon}</span>
                {loc.location}
              </button>
            ))}
          </div>

          {selectedLoc && (() => {
            const loc = SPECIAL_LOCATIONS.find(l => l.location === selectedLoc);
            if (!loc) return null;
            return (
              <div style={{ padding:"11px 13px", borderRadius:9,
                background:`${loc.color}09`,
                border:`1px solid ${loc.color}33`,
                borderLeft:`4px solid ${loc.color}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                  <span style={{ fontSize:22 }}>{loc.icon}</span>
                  <div>
                    <div style={{ fontFamily:"'Playfair Display',serif",
                      fontWeight:700, fontSize:15, color:loc.color }}>{loc.location}</div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                      color:T.txt4, marginTop:1 }}>Blood supply: {loc.blood_supply}</div>
                  </div>
                </div>
                <div style={{ display:"grid",
                  gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",
                  gap:8, marginBottom:8 }}>
                  {[
                    { label:"Closure Timing", val:loc.closure_timing, color:T.teal   },
                    { label:"Suture Choice",  val:loc.suture_choice,  color:T.blue   },
                    { label:"Suture Removal", val:loc.removal,        color:T.purple },
                    { label:"Antibiotics",    val:loc.abx,            color:T.orange },
                    { label:"Follow-up",      val:loc.followup,       color:T.gold   },
                  ].map(f => (
                    <div key={f.label} style={{ padding:"7px 9px", borderRadius:7,
                      background:`${f.color}09`, border:`1px solid ${f.color}22` }}>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace",
                        fontSize:8, color:f.color, letterSpacing:1,
                        textTransform:"uppercase", marginBottom:3 }}>{f.label}</div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif",
                        fontSize:11, color:T.txt3 }}>{f.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
                  marginBottom:6 }}>Key Considerations</div>
                {loc.key_considerations.map((c, i) => (
                  <div key={i} style={{ display:"flex", gap:6,
                    alignItems:"flex-start", marginBottom:4 }}>
                    <span style={{ color:loc.color, fontSize:7,
                      marginTop:3, flexShrink:0 }}>{"▸"}</span>
                    <span style={{ fontFamily:"'DM Sans',sans-serif",
                      fontSize:11, color:T.txt2, lineHeight:1.55 }}>{c}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </Section>

        {!embedded && (
          <div style={{ textAlign:"center", padding:"24px 0 16px",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.5 }}>
            NOTRYA WOUND CARE HUB · VERIFY WITH LOCAL PROTOCOLS · ANTIBIOTIC CHOICES MAY VARY BY REGIONAL RESISTANCE PATTERNS
          </div>
        )}
      </div>
    </div>
  );
}