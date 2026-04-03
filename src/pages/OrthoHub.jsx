import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import XRayViewer from "../components/ortho/XRayViewer";

// ── Font + CSS Injection ──────────────────────────────────────────────────────
(() => {
  if (document.getElementById("ortho-fonts")) return;
  const l = document.createElement("link"); l.id = "ortho-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "ortho-css";
  s.textContent = `
    *{box-sizing:border-box;margin:0;padding:0;}
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:rgba(42,79,122,0.5);border-radius:2px;}
    @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    .fade-in{animation:fadeSlide .22s ease forwards;}
    .shimmer-text{background:linear-gradient(90deg,#e8f0fe 0%,#fff 28%,#ff9f43 50%,#f5c842 68%,#e8f0fe 100%);background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 5s linear infinite;}
    .step-num{display:flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;flex-shrink:0;}
  `;
  document.head.appendChild(s);
})();

// ── Design Tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36", up:"#0e2544",
  b:"rgba(26,53,85,0.8)", bhi:"rgba(42,79,122,0.9)",
  txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  red:"#ff4444", coral:"#ff6b6b", orange:"#ff9f43",
  yellow:"#f5c842", green:"#3dffa0", teal:"#00e5c0",
  blue:"#3b9eff", purple:"#9b6dff", cyan:"#00d4ff", rose:"#f472b6",
};
const glass = {
  backdropFilter:"blur(24px) saturate(200%)",
  WebkitBackdropFilter:"blur(24px) saturate(200%)",
  background:"rgba(8,22,40,0.78)",
  border:"1px solid rgba(42,79,122,0.35)",
  borderRadius:14,
};

const SPLINTS = [
  { id:"post-ankle", label:"Posterior Ankle Splint", icon:"🦶", color:T.orange, svgType:"ankle",
    indications:["Ankle fractures (stable, non-displaced)","Severe ankle sprains (grade II–III)","Achilles tendon rupture","Calcaneus fractures — temporary immobilization"],
    position:"Ankle at 90° neutral (plantargrade). Knee flexed 15–20° during application to reduce muscle tension. Avoid any plantar flexion — 'foot drop' position leads to equinus contracture.",
    padding:["Stockinette full length — toes to mid-calf","Webril cast padding × 2–3 layers (more over bony prominences)","Double padding over: lateral malleolus, medial malleolus, heel, dorsum of foot","8–10 plaster slabs 3–4 inches wide · length: heel to fibular head"],
    steps:["Measure plaster from toe web to fibular head — pre-wet and wring","Apply padding with 50% overlap, extra layers over malleoli and heel","Lay wet plaster slab along posterior surface, mold to plantigrade position","Overwrap with Ace bandage in figure-of-8 around ankle then spiral up","Hold until set (3–5 min plaster) — do NOT indent with fingertips, use palms","Elevate and ice — recheck neurovascular in 20–30 min"],
    pearls:["Bivalved cast preferred if significant swelling expected","Equinus contracture starts within 48–72h in plantar flexion position","Posterior splint less constrictive than stirrup — better for acute swelling","Check cap refill and sensation immediately after application"] },
  { id:"sugar-tong", label:"Sugar-Tong Forearm Splint", icon:"🦴", color:T.orange, svgType:"sugartong",
    indications:["Distal radius fractures (Colles, Smith, Barton)","Distal radioulnar joint injuries","Distal ulna fractures","Post-reduction immobilization of forearm fractures"],
    position:"Elbow at 90° flexion. Forearm in neutral rotation (thumb up — neither pronated nor supinated). This is the key feature: blocks both pronation AND supination simultaneously.",
    padding:["Stockinette from mid-palm to above elbow","Webril × 2–3 layers — extra over radial styloid, ulnar styloid, olecranon","4-inch plaster slab × 12–15 slabs thick","Path: volar forearm → around elbow → dorsal forearm (U-shape)"],
    steps:["Measure length: palmar crease → around elbow → 3 cm below axilla","Maintain forearm neutral rotation throughout — hold thumb toward ceiling","Apply padding generous at elbow — bony olecranon needs extra layers","Wet plaster slab, wring gently, apply along volar forearm around elbow tip to dorsum","Mold with palms — three-point mold for distal radius fractures","Overwrap with Ace bandage, leave fingers free and mobile"],
    pearls:["Neutral rotation is lost when thumb drifts down to pronation — check repeatedly","Three-point mold for distal radius: dorsal pressure distal fragment, volar pressure proximal, volar pressure carpus","Elbow padding critical — pressure ulcers develop rapidly over olecranon","Leave MCP joints free — finger stiffness is a major complication"] },
  { id:"thumb-spica", label:"Thumb Spica Splint", icon:"👍", color:T.yellow, svgType:"thumbspica",
    indications:["Scaphoid fractures (snuffbox tenderness = treat as scaphoid until proven otherwise)","Thumb UCL injuries (gamekeeper's / skier's thumb)","1st CMC fractures (Bennett, Rolando)","Thumb MCP/IP fractures or dislocations"],
    position:"Thumb in the 'position of function' — slightly abducted and opposed, as if holding a glass. Wrist in 10–20° extension. IP joint of thumb left free if possible for scaphoid immobilization.",
    padding:["Stockinette from thumb tip to mid-forearm","Webril over thumb and hand — extra layer over 1st CMC and anatomic snuffbox","3-inch plaster slab × 8–10 layers","Path: radial aspect of forearm → wrist → around thumb to tip"],
    steps:["Measure from thumb tip along radial border of forearm to mid-forearm","Place thumb in functional position with gentle padding separation from index finger","Apply padding — tuck carefully into first web space without wrinkles","Lay plaster along radial forearm, loop around thumb to volar aspect","Mold carefully around thenar eminence — avoid tight constriction at 1st web space","Overwrap with Ace — make sure thumb tip is visible for neurovascular check"],
    pearls:["Snuffbox tenderness with negative X-ray = thumb spica + MRI in 5–7 days","Bennett fracture requires precise reduction — orthopedic consult","Leave IP joint free when possible — functional benefit without compromising scaphoid immobilization","Web space constriction = median nerve compromise — check sensation 1st web space"] },
  { id:"ulnar-gutter", label:"Ulnar Gutter Splint", icon:"✊", color:T.purple, svgType:"ulgutter",
    indications:["4th and 5th metacarpal fractures (boxer's fracture)","4th and 5th proximal phalanx fractures","Small/ring finger PIP/DIP injuries","5th CMC fractures"],
    position:"Wrist 20–30° extension. 4th and 5th MCP joints at 70–90° flexion (intrinsic-plus position). PIP and DIP joints in full extension or slight (5–10°) flexion. This prevents intrinsic tightening and flexion contracture.",
    padding:["Stockinette from fingertips to mid-forearm","Webril × 2–3 layers including 4th and 5th fingers","Extra padding over 4th/5th metacarpal heads and PIP joints","3–4 inch plaster × 8–10 slabs"],
    steps:["Buddy-tape ring and small fingers before splint application for added stability","Position: wrist extended, 4th/5th MCP at 70–90° (important — do NOT leave MCP extended)","Apply padding with fingers separated slightly by extra layer","Lay plaster on ulnar aspect of forearm, extend over 4th and 5th digits to fingertip level","Mold snugly around MCP joints — do not lose the intrinsic-plus position during molding","Ace wrap — confirm position maintained, check 3rd/4th web spaces for pressure"],
    pearls:["Boxer's fracture: acceptable angulation is <40° small finger, <30° ring finger — >40° requires reduction","Intrinsic-plus position (MCP flexed, IP extended) PREVENTS the dreaded 'clawing' contracture","MCP extension in splint leads to collateral ligament shortening — permanent stiffness","10° rotational deformity = 2.5 cm scissoring overlap of fingers — check finger alignment with gentle composite flexion"] },
  { id:"long-arm", label:"Long Arm Posterior Splint", icon:"💪", color:T.blue, svgType:"longarm",
    indications:["Supracondylar humerus fractures (post-reduction, pediatric)","Distal humerus fractures","Elbow dislocations (post-reduction)","Radius/ulna shaft fractures","Olecranon fractures (non-operative candidates)"],
    position:"Elbow at 90° flexion. Forearm in neutral rotation (thumb up). Supracondylar fractures: may require slight adjustment per fracture pattern — follow orthopedic guidance. Wrist in neutral or slight extension.",
    padding:["Stockinette from palm to axillary crease","Extra Webril layers: olecranon, medial/lateral epicondyles, radial head","4-inch plaster slab for forearm, 4–5 inch for arm portion","Must cover 2/3 of extremity circumference for adequate immobilization"],
    steps:["Two-slab technique preferred: posterior forearm slab + posterior arm slab overlapped at elbow","Measure arm slab: axillary crease to olecranon tip — measure forearm slab: olecranon to palmar crease","Apply stockinette and padding with extra layers at all bony prominences","Apply forearm slab first (volar to dorsal), then arm slab from olecranon to axilla","Overlap slabs at olecranon by 4–6 cm — this is the load-bearing point","Mold with palms only — NO fingertip indentations","Ace wrap distal to proximal, check radial pulse and finger sensation before patient leaves"],
    pearls:["Supracondylar fracture: anterior interosseous nerve (AIN) most commonly injured — test FDP/FPL (OK sign)","Check radial pulse BEFORE and AFTER reduction and splinting — vascular injury is limb-threatening","Olecranon needs at least 3 extra layers of padding — skin necrosis risk is high","Elbow is swollen — check hourly for the first 2–4h in high-risk fractures"] },
];

// ── Fracture Classification Data ──────────────────────────────────────────────
const SALTER_HARRIS = [
  { grade:"I", color:T.green, mnemonic:"S — Straight through", memory:"Same (growth plate only)",
    description:"Fracture through physis only. Epiphysis separated from metaphysis. Growth plate not visible on X-ray — may be normal appearing.",
    xray:"Widened physis · soft tissue swelling · may be normal on plain films — stress views or MRI needed",
    prognosis:"Excellent. Growth disturbance uncommon (<1%). Treat with closed reduction and casting.",
    treatment:"Closed reduction if displaced. Long leg cast (ankle/knee) or thumb spica (wrist). Orthopedic follow-up in 5–7 days.",
    examples:["Distal fibula — most common SH fracture","Distal radius (young children)","Proximal humerus"] },
  { grade:"II", color:T.teal, mnemonic:"A — Above (exits through metaphysis)", memory:"Above the physis",
    description:"Most common type (75%). Fracture through physis and exits through metaphysis. Periosteum intact on compression side — Thurston-Holland fragment (metaphyseal spike).",
    xray:"Triangular metaphyseal fragment (Thurston-Holland sign). Physis appears widened.",
    prognosis:"Very good. Growth arrest uncommon. Metaphyseal fragment confirms diagnosis.",
    treatment:"Usually closed reduction and casting. ORIF if unstable or irreducible. Orthopedic follow-up.",
    examples:["Distal radius — most common overall","Distal femur","Proximal tibia"] },
  { grade:"III", color:T.orange, mnemonic:"L — Lower (exits through epiphysis)", memory:"Lower — through epiphysis",
    description:"Fracture through physis and exits through epiphysis (joint surface). Intra-articular fracture. The fracture line exits laterally through the epiphysis.",
    xray:"Fracture through epiphysis visible on X-ray. Articular surface disrupted. Look for subtle joint space widening.",
    prognosis:"Fair. Growth disturbance possible. Articular incongruity leads to post-traumatic arthritis if inadequately reduced.",
    treatment:"ORIF if >2 mm displacement. Anatomic reduction of articular surface critical. Orthopedic consult.",
    examples:["Distal tibia — Tillaux fracture variant","Distal femur","Proximal tibia (lateral plateau in adolescents)"] },
  { grade:"IV", color:T.orange, mnemonic:"T — Through everything", memory:"Through everything",
    description:"Fracture through metaphysis, physis, AND epiphysis. Vertical fracture crossing all three zones. High risk of growth arrest due to bony bridge formation across physis.",
    xray:"Vertical fracture line crossing all three zones. Displacement common. CT often needed for surgical planning.",
    prognosis:"Poor without anatomic reduction. Growth arrest in 25–50%. Leg length discrepancy and angular deformity.",
    treatment:"Anatomic ORIF required — cannot leave physeal step-off. Avoid hardware crossing physis when possible.",
    examples:["Lateral condyle humerus (children) — most common SH IV","Distal tibia","Medial epicondyle avulsion"] },
  { grade:"V", color:T.red, mnemonic:"R — Rammed / Crush", memory:"Ruined — crush injury",
    description:"Crush injury to physis. No fracture line visible. Axial loading compresses and destroys growth plate. Often diagnosed retrospectively when premature physeal closure occurs.",
    xray:"Usually normal acutely. Diagnosis of exclusion. Growth arrest (physeal bar) seen on follow-up films.",
    prognosis:"Very poor. Premature physeal closure almost universal. Significant growth disturbance expected.",
    treatment:"Immobilization acutely. Long-term orthopedic monitoring for growth disturbance. Epiphysiodesis of contralateral side may be needed.",
    examples:["Distal femur after high-energy trauma","Ankle mortise (tibiotalar impaction)","Spine compression (vertebral endplate)"] },
];

const GUSTILO = [
  { grade:"I", color:T.green, label:"Type I — Low Energy, Clean",
    wound:"Wound < 1 cm. Clean puncture wound, usually inside-out (bone punctures skin).",
    contamination:"Minimal. Low-energy mechanism.",
    soft_tissue:"Minimal soft tissue damage. No significant crushing.",
    management:"IV antibiotics within 1 hour (cefazolin). Wound irrigation and debridement in OR. Primary closure usually feasible after debridement.",
    coverage:"Primary closure acceptable after thorough debridement.",
    antibiotic:"Cefazolin 2 g IV q8h × 24–72h. Add gentamicin if contaminated.",
    prognosis:"Infection rate ~1–2%. Excellent healing expected." },
  { grade:"II", color:T.orange, label:"Type II — Moderate Energy",
    wound:"Wound 1–10 cm. Higher energy mechanism than type I.",
    contamination:"Moderate. Contamination present but not extensive.",
    soft_tissue:"Moderate soft tissue damage. Periosteum intact. No flaps or degloving.",
    management:"IV antibiotics within 1 hour. OR debridement mandatory. Assess for primary vs. delayed closure.",
    coverage:"Primary closure usually feasible after 48–72h delayed primary closure window.",
    antibiotic:"Cefazolin 2 g IV q8h. Add metronidazole if farm/soil contamination.",
    prognosis:"Infection rate ~2–5%. Good prognosis with adequate debridement." },
  { grade:"IIIA", color:T.orange, label:"Type IIIA — Severe, Adequate Coverage",
    wound:"Wound > 10 cm OR high energy mechanism (gunshot, MVA). Extensive soft tissue injury.",
    contamination:"Heavy contamination common.",
    soft_tissue:"Extensive periosteal stripping but adequate soft tissue coverage of bone remains possible.",
    management:"Aggressive debridement (may require return to OR in 48–72h). External fixation for bone stability. Orthoplastics early involvement.",
    coverage:"Adequate bone coverage possible with local tissue. May require flap.",
    antibiotic:"Cefazolin + gentamicin. Add penicillin G if farm contamination (Clostridium). Continue 72h.",
    prognosis:"Infection rate ~7–15%. Amputation rate 4–7%." },
  { grade:"IIIB", color:T.coral, label:"Type IIIB — Severe, Inadequate Coverage",
    wound:"Extensive periosteal stripping. Bone exposure with massive contamination.",
    contamination:"Massive. Farm injuries, sewage, blast.",
    soft_tissue:"Soft tissue defect — bone coverage NOT achievable with local tissue. Requires plastic surgery flap.",
    management:"Serial debridement. External fixation. Plastic surgery consult for flap coverage. Vacuum-assisted closure (VAC) bridging.",
    coverage:"Requires rotational or free flap. Do NOT close under tension.",
    antibiotic:"Cefazolin + gentamicin + penicillin G (if soil). Culture-directed therapy post-debridement.",
    prognosis:"Infection rate ~10–50%. Amputation rate up to 16%." },
  { grade:"IIIC", color:T.red, label:"Type IIIC — Vascular Injury",
    wound:"Any type III fracture with arterial injury requiring vascular repair.",
    contamination:"Variable — mechanism determines contamination level.",
    soft_tissue:"Variable — associated with IIIA or IIIB pattern in most cases.",
    management:"Vascular surgery STAT. Damage control orthopedics — stabilize with external fixator. Fasciotomy often required. Amputation rate high if ischemia time >6h.",
    coverage:"After vascular repair — staged soft tissue management.",
    antibiotic:"Broad spectrum: cefazolin + gentamicin + metronidazole. Early cultures.",
    prognosis:"Amputation rate 25–90% depending on ischemia time and contamination. Poor overall." },
];

const MASON_CLASSES = [
  { grade:"I", color:T.green, desc:"Non-displaced radial head fracture. < 2 mm displacement. No block to forearm rotation.", tx:"Sling for comfort × 1–2 weeks. Early ROM at 48–72h. NSAIDs. No splinting needed." },
  { grade:"II", color:T.orange, desc:"Partial articular fracture. > 2 mm displacement OR angulation. May have mechanical block to forearm rotation.", tx:"ORIF if >2 mm displacement or block to rotation. Aspiration of hemarthrosis + lidocaine injection for immediate ROM testing." },
  { grade:"III", color:T.red, desc:"Comminuted radial head fracture — not reconstructable. Associated with elbow instability.", tx:"Radial head arthroplasty (excision alone not recommended). Repair associated ligament injuries. Terrible Triad if with coronoid fracture + LCL rupture." },
];

// ── Reduction Techniques Data ─────────────────────────────────────────────────
const REDUCTIONS = [
  { id:"shoulder", label:"Glenohumeral Dislocation", icon:"💪", color:T.blue, svgType:"shoulder",
    types:["Anterior (95–97% of all dislocations)","Posterior (2–4% — associated with seizures, electrocution)","Inferior (luxatio erecta — rare, <1%)"],
    prereduction:"Confirm dislocation on X-ray (AP + Y-view or axillary). Assess neurovascular: axillary nerve (regimental badge area — lateral deltoid sensation), radial pulse. Identify associated greater tuberosity fracture (may require different management).",
    techniques:[
      { name:"Cunningham Technique", color:T.teal, sedation:"None required — no analgesia needed when done correctly", time:"2–3 min if done correctly",
        steps:["Seat patient upright, arm adducted to side (not arm hanging)","Massage the three muscle bellies: biceps, deltoid, trapezius — in that order — for 2–3 min each","During massage, instruct patient to RELAX the arm completely — narrate relaxation","Once biceps is fully relaxed, gentle external rotation occurs spontaneously","Reduction occurs with a 'clunk' — confirm with post-reduction X-ray"],
        pearls:"Requires patient cooperation. Works by eliminating muscle spasm rather than force. Success rate >90% when technique is perfect. Common error: patient not seated correctly or provider applying force instead of awaiting spontaneous reduction." },
      { name:"FARES Method", color:T.blue, sedation:"Minimal — IV ketorolac or low-dose opioid", time:"3–5 min",
        steps:["Patient supine. Provider holds wrist with two hands, arm at side","Continuous traction in line with body + slow oscillation (small vertical movements ~2 cm amplitude, 2 Hz)","While oscillating, slowly abduct to 90° — maintain oscillation throughout","At 90° abduction, add external rotation while continuing oscillation","Reduction typically occurs at 90–120° abduction"],
        pearls:"Oscillation is the critical element — it fatigues the rotator cuff muscles. Do NOT stop oscillating. Success rate ~88% without sedation." },
      { name:"Stimson Technique", color:T.purple, sedation:"Minimal — IV analgesic helpful", time:"5–15 min (gravity-dependent)",
        steps:["Patient prone with arm hanging off stretcher","Attach 5–10 lb weight to wrist (or have provider hold gentle traction)","Allow gravity + muscle fatigue to achieve reduction over 10–15 min","Provider may gently internally/externally rotate wrist to assist","Reduction confirmed when patient reports relief of pain and 'clunk'"],
        pearls:"Requires patient cooperation and time. Works via gravity and muscle fatigue. Less appropriate when time-sensitive. Excellent for providers alone without assistant." },
      { name:"Scapular Manipulation", color:T.orange, sedation:"IV analgesic + midazolam recommended", time:"2–5 min",
        steps:["Patient prone OR upright leaning forward","Assistant provides gentle downward traction on arm (5–10 lb or weight)","Provider uses both thumbs on inferior angle of scapula","Rotate inferior scapular tip medially while pushing superior scapula laterally","Aim to realign glenoid fossa with humeral head — reduction occurs with clunk"],
        pearls:"Can be combined with traction-countertraction. High success rate (79–96%). Relatively atraumatic — good for elderly patients or those with Hill-Sachs deformity." },
    ],
    post:"Post-reduction X-ray (AP + axillary). Recheck axillary nerve sensation. Sling × 2–3 weeks. Ortho follow-up 5–7 days. MRI if recurrent or Hill-Sachs suspected." },
  { id:"digit", label:"Digit Dislocation (PIP/MCP)", icon:"🖐", color:T.yellow, svgType:"digit",
    types:["Dorsal PIP dislocation (most common — volar plate injury)","Volar PIP dislocation (rare — associated with central slip rupture)","MCP dislocation (complex = interposition of volar plate)"],
    prereduction:"X-ray to rule out associated fracture (especially volar lip fracture of base of middle phalanx — volar plate avulsion). Assess skin integrity. Perform digital block (10 min before reduction).",
    techniques:[
      { name:"Traction-Countertraction (Dorsal PIP)", color:T.yellow, sedation:"Digital block (see Nerve Blocks tab)", time:"Immediate post-block",
        steps:["Perform digital block — wait 5–10 min for full effect","Grasp middle phalanx, apply gentle longitudinal traction","Counter-traction on proximal phalanx by assistant or provider","While maintaining traction, flex PIP joint to clear volar plate","Apply gentle volar pressure on dorsal base of middle phalanx","Reduction confirmed by restoration of joint contour and pain relief"],
        pearls:"DO NOT use force — volar plate may be interposed. If resistance felt, stop and get X-ray. Simple dislocations reduce easily with proper digital block." },
      { name:"Hyperextension Technique (Dorsal PIP)", color:T.orange, sedation:"Digital block", time:"Immediate post-block",
        steps:["After digital block, slightly exaggerate dorsal deformity first","This disengages the volar plate from the articular surface","Apply traction while simultaneously flexing the digit","The joint slides back into position as deformity is reversed","DO NOT use this technique if volar lip fracture present (>40% articular involvement)"],
        pearls:"Quicker than traction-countertraction when done correctly. Contraindicated with significant volar lip fracture — risks further displacement." },
      { name:"Complex MCP Dislocation Reduction", color:T.orange, sedation:"Procedural sedation often required", time:"Varies",
        steps:["Simple MCP: traction + extension of wrist to relax flexor tendons, then flex MCP","Complex MCP (dimpled skin = volar plate interposed): DO NOT apply traction","Complex MCP requires ORIF — traction worsens volar plate entrapment","Dorsal surgical approach to extract volar plate from joint space"],
        pearls:"The 'dimple sign' (skin puckering over volar joint) = complex dislocation = NO traction = surgical case. This is the key decision point for MCP dislocations." },
    ],
    post:"Buddy tape to adjacent finger × 3–6 weeks (PIP). Early ROM critical — stiffness is the main complication. Extension block splinting for volar lip fractures >40% articular surface. Ortho if reduction unstable or fracture-dislocation." },
  { id:"patella", label:"Patellar Dislocation", icon:"🦵", color:T.teal, svgType:"patella",
    types:["Lateral patellar dislocation (>95% — majority are first-time)","Superior dislocation (rare)","Intra-articular dislocation (very rare)"],
    prereduction:"X-ray to rule out osteochondral fracture (common with acute patellar dislocation — up to 40%). Assess for joint effusion (hemarthrosis = likely osteochondral injury). Test VMO atrophy (indicates recurrent instability).",
    techniques:[
      { name:"Extension Reduction", color:T.teal, sedation:"IV analgesic helpful; often reduces without sedation", time:"1–2 min",
        steps:["Patient supine. Extend the knee fully while applying medial pressure on the patella","As knee approaches full extension, quadriceps relaxes and patella slides medially","Simultaneous medial pressure on lateral patella border aids reduction","Reduction typically occurs at ~30° short of full extension","Confirm with IMMEDIATE improvement in pain and restoration of knee contour"],
        pearls:"DO NOT flex the knee first — this tightens the lateral retinaculum. Full extension relaxes the lateral structures and quadriceps tension. Most lateral patellar dislocations reduce with this technique alone." },
      { name:"Lateral-to-Medial Pressure Technique", color:T.green, sedation:"None or minimal analgesia", time:"30–60 seconds",
        steps:["Flex hip to 90° (relaxes rectus femoris and hip flexors)","While hip is flexed, slowly extend knee","As knee extends, apply firm medial pressure on lateral border of patella","Guide patella into trochlear groove with gentle, sustained pressure","Confirm reduction — assess patellar tracking with knee ROM"],
        pearls:"Hip flexion is the key step that differentiates this from simple extension. By relaxing the rectus femoris, required reduction force is dramatically reduced." },
    ],
    post:"Knee immobilizer × 2–4 weeks (controversial — early ROM preferred in many guidelines). MRI recommended for first-time dislocation (rule out osteochondral fracture, assess MPFL). Ortho follow-up. Aspirate tense hemarthrosis if affecting comfort. Recurrence rate ~15–44% after first dislocation." },
  { id:"hip", label:"Hip Dislocation (Posterior)", icon:"🍖", color:T.orange, svgType:"hip",
    types:["Posterior dislocation (90% — leg internally rotated, flexed, adducted = 'dashboard injury')","Anterior dislocation (10% — leg externally rotated and abducted)","Central fracture-dislocation (acetabular fracture)"],
    prereduction:"X-ray hip (AP + Judet views if fracture suspected). CT often needed. Check sciatic nerve (peroneal division): dorsiflexion, eversion, sensation dorsal foot. TIME-CRITICAL: >6h = AVN risk rises sharply. Procedural sedation required.",
    techniques:[
      { name:"Allis Technique (Posterior)", color:T.orange, sedation:"Procedural sedation + muscle relaxant REQUIRED", time:"Immediately under sedation",
        steps:["Patient supine on low stretcher or floor. Assistant stabilizes pelvis (ILIAC CRESTS — not thighs)","Provider stands on stretcher above patient, foot straddling patient's hips","Flex hip to 90°. Flex knee to 90° (relaxes hamstrings)","Apply VERTICAL traction (toward ceiling) — inline with femoral shaft","Gentle internal→external rotation while maintaining vertical traction","Clunk confirms reduction — leg will re-externally rotate if anterior, fall neutral if posterior"],
        pearls:"Adequate muscle relaxation is more important than force — succinylcholine IV can be used for refractory cases. Never force — acetabular fracture risk. Second provider stabilizing pelvis is essential." },
      { name:"Stimson Technique (Posterior)", color:T.blue, sedation:"Procedural sedation required", time:"5–10 min under sedation",
        steps:["Patient PRONE with hip and knee at 90° hanging off stretcher edge","Provider applies downward pressure on popliteal fossa (posterior knee)","Gentle internal→external rotation of tibia","Gravity + muscle relaxation allows reduction","Less commonly used in ED — requires prone positioning"],
        pearls:"Useful when Allis fails or patient body habitus limits Allis. Requires adequate sedation depth." },
    ],
    post:"Post-reduction CT scan mandatory (exclude acetabular fracture, loose bodies, femoral head fracture). Hip precautions × 6–12 weeks. NWB × 6 weeks. Ortho admission. Vascular follow-up if AVN concern." },
  { id:"elbow", label:"Elbow Dislocation", icon:"🦾", color:T.purple, svgType:"elbow",
    types:["Posterior/posterolateral (98% — FOOSH mechanism)","Anterior (rare, associated with olecranon fracture)","Divergent dislocation (rare — radius and ulna dislocate separately)"],
    prereduction:"X-ray (AP + lateral). Assess neurovascular: anterior interosseous nerve (AIN — OK sign), medial epicondyle avulsion fracture (incarcerated in joint = ORIF needed), check brachial artery pulse.",
    techniques:[
      { name:"Traction-Countertraction", color:T.purple, sedation:"Procedural sedation strongly recommended", time:"2–5 min under sedation",
        steps:["Patient supine. Assistant holds humerus firmly against stretcher (countertraction)","Provider grasps wrist and applies steady longitudinal traction — DO NOT jerk","While maintaining traction, apply anterior pressure on olecranon tip with thumbs","Gently flex elbow while continuing traction — clunk = reduction","Check radial pulse and AIN function immediately post-reduction"],
        pearls:"Adequate sedation is the key to success — most failed reductions are due to inadequate muscle relaxation. Never apply extreme force. If resistance felt, re-image to exclude fracture-dislocation." },
      { name:"Cunningham Elbow Technique", color:T.teal, sedation:"IV analgesic + midazolam", time:"3–5 min",
        steps:["Patient seated. Flex elbow to 90°, arm adducted, forearm supinated","Provider places hand on dorsum of patient's forearm from below","Patient attempts to flex elbow against provider's light resistance","Instruct patient: 'Try to touch your shoulder' — this fires biceps and brachialis","Active muscle contraction reduces the dislocation via muscular mechanism"],
        pearls:"Patient cooperation required. Works best with partial dislocation or immediately after injury before significant muscle spasm. Excellent option when sedation is contraindicated." },
    ],
    post:"Post-reduction X-ray (AP + lateral). Apply long arm posterior splint at 90°. Vascular check × 2h. Orthopedic consult. Active ROM at 5–7 days to prevent stiffness — the most common long-term complication." },
];

// ── Nerve Block Data ──────────────────────────────────────────────────────────
const NERVE_BLOCKS = [
  { id:"digital", label:"Digital Nerve Block", icon:"☝️", color:T.orange, svgType:"digital",
    indication:"Finger/toe lacerations, nail bed repairs, digit reductions, paronychia I&D, subungual hematoma drainage",
    anatomy:"Each digit has 4 digital nerves: 2 dorsal and 2 volar (proper digital nerves). Web space technique blocks all 4 with 2 injections. Transthecal technique via flexor tendon sheath.",
    agents:[
      { drug:"Lidocaine 1% (plain)", max:"4.5 mg/kg", concentration:"10 mg/mL", typicalVol:"1.5–2 mL per web space", onset:"2–5 min", duration:"60–90 min", note:"First line — no epinephrine needed for digital blocks (myth: epi is safe in digits)" },
      { drug:"Bupivacaine 0.25%", max:"2.5 mg/kg", concentration:"2.5 mg/mL", typicalVol:"1.5–2 mL per web space", onset:"5–10 min", duration:"4–8 h", note:"For prolonged procedures or post-procedure analgesia" },
      { drug:"Ropivacaine 0.5%", max:"3 mg/kg", concentration:"5 mg/mL", typicalVol:"1–1.5 mL per web space", onset:"5–10 min", duration:"6–12 h", note:"Preferred for longer-acting block with less cardiovascular toxicity than bupivacaine" },
    ],
    technique:[
      "25–27 gauge needle. Identify web space between digits.",
      "Insert needle at dorsal web space, advance toward volar skin (do not exit).",
      "Aspirate — then inject 1–1.5 mL as needle is slowly withdrawn to dorsal entry point.",
      "Redirect 45° volarly, inject additional 0.5 mL near volar digital nerve.",
      "Repeat on other side of digit for complete ring block.",
      "Wait 5–10 min before procedure — test with sharp vs. dull.",
    ],
    contraindications:["Active infection at injection site","Severe vascular disease (relative)"],
    pearl:"Epinephrine-containing agents are NO LONGER absolutely contraindicated in digital blocks — evidence shows they are safe with standard concentrations. However, avoid in patients with vascular disease or Raynaud's." },
  { id:"hematoma", label:"Hematoma Block (Distal Radius)", icon:"🦴", color:T.orange, svgType:"hematoma",
    indication:"Distal radius fractures requiring closed reduction. Wrist blocks that cannot wait for regional anesthesia. Alternative to procedural sedation in low-risk patients.",
    anatomy:"Fracture hematoma at distal radius. Inject into fracture site — local anesthetic diffuses through hematoma to anesthetize fracture nerve endings. Supplemental block of dorsal cutaneous branch of ulnar nerve may be needed.",
    agents:[
      { drug:"Lidocaine 1% (plain)", max:"4.5 mg/kg", concentration:"10 mg/mL", typicalVol:"5–10 mL into hematoma", onset:"5–10 min", duration:"45–90 min", note:"Standard agent. Add 1–2 mL for supplemental dorsal ulnar cutaneous block." },
      { drug:"Lidocaine 2% (plain)", max:"4.5 mg/kg", concentration:"20 mg/mL", typicalVol:"5 mL into hematoma", onset:"3–5 min", duration:"45–90 min", note:"Use if larger volume not desired. Same total dose limit." },
    ],
    technique:[
      "Clean dorsoradial wrist with chlorhexidine. Use sterile technique.",
      "Identify fracture site on X-ray — typically 1–2 cm proximal to dorsal radial styloid.",
      "22–25 gauge needle, insert perpendicular to skin into fracture hematoma.",
      "Aspirate: dark blood confirms intrahematoma position — essential step.",
      "Inject 5–10 mL lidocaine 1% slowly. Moderate resistance is expected.",
      "Add 1–2 mL at dorsoradial wrist (snuffbox area) for radial sensory branch.",
      "Wait 5–10 min. Test with firm pressure on fracture site before reduction.",
    ],
    contraindications:["Open fracture (inject through wound contamination — use hematoma block with caution)","Significant soft tissue swelling limiting landmark identification","Active skin infection"],
    pearl:"Hematoma block produces analgesia equivalent to procedural sedation in multiple RCTs for distal radius reduction. Advantages: no recovery time, no respiratory monitoring, outpatient-friendly. Must confirm intrahematoma position with aspiration of dark blood." },
  { id:"wrist-median", label:"Median Nerve Block (Wrist)", icon:"✋", color:T.blue, svgType:"wristblock",
    indication:"Carpal tunnel procedures, palmar laceration repair, thenar eminence procedures, 1st–3rd digit procedures (combines with ulnar for complete hand coverage)",
    anatomy:"Median nerve enters wrist between flexor carpi radialis (FCR) and palmaris longus (PL) tendons. Passes under flexor retinaculum. Sensory: palmar hand, volar 1st–3rd digits and radial half 4th, dorsal tips of same.",
    agents:[
      { drug:"Lidocaine 1% + Epi 1:200,000", max:"7 mg/kg", concentration:"10 mg/mL", typicalVol:"3–5 mL", onset:"3–5 min", duration:"2–4 h", note:"Epinephrine extends duration significantly at wrist — safe to use here" },
      { drug:"Bupivacaine 0.25%", max:"2.5 mg/kg", concentration:"2.5 mg/mL", typicalVol:"3–5 mL", onset:"10–15 min", duration:"6–12 h", note:"Long-acting — excellent for post-procedure analgesia" },
    ],
    technique:[
      "Wrist in neutral. Identify FCR and PL by asking patient to oppose thumb and small finger.",
      "PL is medial (ulnar) to FCR. Median nerve lies directly ulnar to PL (or medial to FCR if PL absent in 14%).",
      "25 gauge needle at proximal wrist crease, between FCR and PL, 1 cm medial to PL.",
      "Advance 1 cm perpendicular to skin. Inject 3–5 mL as fan-like deposit.",
      "Paresthesia to fingers confirms proximity — withdraw 1 mm before injecting (never inject into nerve).",
      "Do NOT inject if firm resistance felt (intraneural injection risk).",
    ],
    contraindications:["Infection at injection site","Prior carpal tunnel surgery (altered anatomy)"],
    pearl:"Palmaris longus is absent in 14% of the population — absent PL does not exclude this technique. Use FCR as the primary landmark. Paresthesia = confirm proximity but back off 1 mm before injection." },
  { id:"wrist-ulnar", label:"Ulnar Nerve Block (Wrist)", icon:"🖐", color:T.purple, svgType:"wristblock",
    indication:"4th/5th digit lacerations, hypothenar procedures, intrinsic hand muscle blocks, combined with median for complete volar hand anesthesia",
    anatomy:"Ulnar nerve at wrist: between flexor carpi ulnaris (FCU) and ulnar artery. Divides into superficial (sensory) and deep (motor) branches at Guyon's canal. Sensory: hypothenar, volar 4th (ulnar half) and 5th digits, dorsal ulnar hand.",
    agents:[
      { drug:"Lidocaine 1% + Epi 1:200,000", max:"7 mg/kg", concentration:"10 mg/mL", typicalVol:"3–5 mL", onset:"3–5 min", duration:"2–4 h", note:"Standard for wrist blocks" },
      { drug:"Ropivacaine 0.5%", max:"3 mg/kg", concentration:"5 mg/mL", typicalVol:"3–5 mL", onset:"10–15 min", duration:"8–12 h", note:"Long-acting; less cardiotoxic than bupivacaine at equivalent volumes" },
    ],
    technique:[
      "Identify FCU tendon by resisted wrist flexion with ulnar deviation.",
      "Ulnar nerve lies RADIAL to FCU and DORSAL to ulnar artery at wrist level.",
      "25 gauge needle between FCU and ulnar artery at proximal wrist crease.",
      "Inject 3–5 mL lateral to FCU, directing slightly dorsal to reach both branches.",
      "Palpate pulse: ensure needle is not intravascular — aspirate before injecting.",
      "Add dorsal wrist injection (1–2 mL subcutaneous) for dorsal ulnar sensory branch.",
    ],
    contraindications:["Infection at injection site","Known Guyon's canal mass/pathology"],
    pearl:"The ulnar artery is immediately radial to the nerve — aspirate carefully. Inject LATERAL to FCU (radial side of the tendon), NOT through the tendon. Dorsal branch often requires separate injection at dorsomedial wrist." },
  { id:"wrist-radial", label:"Radial Nerve Block (Wrist)", icon:"👆", color:T.teal, svgType:"wristblock",
    indication:"Dorsoradial hand procedures, 1st web space, thumb dorsum, anatomic snuffbox, radial forearm procedures",
    anatomy:"Superficial radial nerve (sensory only at wrist) emerges from under brachioradialis at mid-forearm, becomes subcutaneous. Divides into multiple branches crossing the anatomic snuffbox. Sensory: dorsal radial hand, dorsal 1st–3rd digits proximal phalanges.",
    agents:[
      { drug:"Lidocaine 1%", max:"4.5 mg/kg", concentration:"10 mg/mL", typicalVol:"5–8 mL subcutaneous", onset:"5 min", duration:"60–90 min", note:"Large volume needed for complete field block (superficial nerve, multiple branches)" },
      { drug:"Bupivacaine 0.25%", max:"2.5 mg/kg", concentration:"2.5 mg/mL", typicalVol:"5–8 mL subcutaneous", onset:"10–15 min", duration:"6–8 h", note:"Long-acting for procedures of dorsal hand" },
    ],
    technique:[
      "Radial nerve block at wrist = subcutaneous FIELD BLOCK (not specific fascicular injection).",
      "Identify radial styloid and dorsal wrist crease.",
      "Start at radial styloid — inject subcutaneously toward dorsal midline.",
      "Continue subcutaneous injection in line toward ulnar side — create a 'bracelet' of anesthetic.",
      "Aim: 5–8 cm band of subcutaneous anesthetic from radial styloid to dorsal midwrist.",
      "Large volume required — use diluted lidocaine 1% to stay within dose limits.",
    ],
    contraindications:["Infection at injection site"],
    pearl:"The superficial radial nerve is highly variable in branching pattern — this is why a field block (subcutaneous band) works better than a targeted injection. The 'bracelet block' at the wrist reliably captures all branches regardless of anatomic variation." },
  { id:"femoral", label:"Femoral Nerve Block", icon:"🦵", color:T.rose, svgType:"femoral",
    indication:"Femoral shaft fractures (ED pain management, bridge to surgical anesthesia), patella fractures, quadriceps tendon repairs, anterior thigh procedures",
    anatomy:"Femoral nerve exits femoral triangle LATERAL to femoral artery, deep to fascia iliaca. Mnemonic: NAVEL lateral to medial — Nerve, Artery, Vein, Empty space, Lymphatics. Ultrasound-guided strongly preferred in ED.",
    agents:[
      { drug:"Ropivacaine 0.5%", max:"3 mg/kg", concentration:"5 mg/mL", typicalVol:"15–20 mL", onset:"15–20 min", duration:"12–24 h", note:"Preferred for femoral block — best safety profile for large volume" },
      { drug:"Bupivacaine 0.25%", max:"2.5 mg/kg", concentration:"2.5 mg/mL", typicalVol:"20–30 mL", onset:"15–20 min", duration:"12–24 h", note:"Effective but higher cardiotoxicity risk at large volumes — use ropivacaine if available" },
    ],
    technique:[
      "ULTRASOUND-GUIDED strongly preferred. Linear probe, high frequency.",
      "Patient supine. Identify femoral artery in femoral triangle (pulsatile).",
      "Femoral nerve: hyperechoic 'honeycomb' structure LATERAL to femoral artery.",
      "In-plane approach from lateral — 22 gauge 50mm needle, bevel up.",
      "Target: inject BELOW fascia iliaca, LATERAL to femoral artery, adjacent to nerve.",
      "Hydrodissect nerve with 1–2 mL to confirm position, then inject full volume.",
      "If ultrasound unavailable: landmark technique — 1 cm lateral to femoral artery pulse, below inguinal ligament.",
    ],
    contraindications:["Infection at injection site","Anticoagulation (relative — compressible site)","Prior femoral bypass surgery (altered anatomy)"],
    pearl:"Ultrasound guidance reduces failure rate from ~25% to <5%. Signs of intravascular injection: rapid disappearance of nerve on US, blood on aspiration. Have lipid emulsion (Intralipid 20%) available for all regional blocks — LAST (local anesthetic systemic toxicity) treatment. Dose limit: ropivacaine 3 mg/kg is the maximum for peripheral nerve blocks." },
];

const TABS = [
  {id:"splints",   label:"Splinting",   icon:"🩹"},
  {id:"fractures", label:"Fractures",   icon:"🦴"},
  {id:"xray",      label:"X-Ray Viewer",icon:"🩻"},
  {id:"reductions",label:"Reductions",  icon:"🔄"},
  {id:"blocks",    label:"Nerve Blocks",icon:"💉"},
];

const SPLINT_PROMPTS = {
  ankle: `Create an SVG (viewBox="0 0 220 158") medical illustration of a posterior ankle splint. Background: <rect width="220" height="158" fill="#050f1e" rx="8"/>. Draw: (1) Lower leg outline as a tall rounded rectangle in dark warm brown #2e1f0c with lighter stroke #5a3e1a, positioned center-left, widening slightly at calf. (2) Foot shape extending to the right at 90 degrees, same brown tones. (3) Cream-colored plaster slab #c8b896 as a wide rounded rectangle along the full posterior (back) surface of the leg and wrapping under the heel — this is the KEY feature. (4) Diagonal Ace bandage wrap lines in tan #b8945a going spirally around the leg. (5) Text labels in fontFamily="monospace" fontSize="8": fill="#ff9f43" texts: 'TIBIA' and 'FIBULA' near the leg, 'POSTERIOR SLAB' with a short pointer line to the cream slab, 'HEEL' near the bottom. (6) Footer: text fill="#ff9f43" fontSize="7" at y="153": 'POSITION: 90° NEUTRAL — NO PLANTARFLEXION'. Return ONLY the complete SVG element.`,

  sugartong: `Create an SVG (viewBox="0 0 220 158") medical illustration of a sugar-tong forearm splint. Background: <rect width="220" height="158" fill="#050f1e" rx="8"/>. Draw: (1) Forearm anatomy: two bone shapes (radius and ulna) in dark brown #2e1f0c with stroke #5a3e1a, running vertically through the center, with the hand/wrist region at the bottom. (2) Elbow region at the top as a wider rounded shape. (3) The KEY feature — a U-shaped plaster slab #c8b896: one slab along the volar (front/palm) forearm going down, curving around the elbow at top, and returning along the dorsal (back) forearm — a classic U-shape that prevents rotation. (4) Label the two arms: fill="#fb923c" fontSize="8": 'VOLAR' on left arm, 'DORSAL' on right arm, 'ELBOW' at the curve, 'NEUTRAL ROTATION' below hand. (5) A small upward-pointing thumb indicator to show neutral (thumb-up) position. (6) Footer text fill="#fb923c" fontSize="7" y="153": 'FOREARM NEUTRAL ROTATION — THUMB UP'. Return ONLY the complete SVG element.`,

  thumbspica: `Create an SVG (viewBox="0 0 220 158") medical illustration of a thumb spica splint on a right wrist/hand. Background: <rect width="220" height="158" fill="#050f1e" rx="8"/>. Draw: (1) Wrist and hand anatomy — a forearm shape transitioning into a hand, with four fingers on one side (drawn as small rectangles) in dark brown #2e1f0c. (2) The thumb extending off at an angle (abducted), shown as a separate rounded shape. (3) KEY feature: a radial-side plaster slab #c8b896 running along the radial (thumb side) border of the forearm, curving around the base of the thumb and encasing it up to near the IP joint — leave thumb tip slightly visible. (4) Dashed line at thumb IP joint indicating where splint ends. (5) Labels fill="#f5c842" fontSize="8": 'RADIAL SLAB', '1st CMC', 'THUMB IP FREE', 'SCAPHOID' with pointer to anatomical snuffbox region. (6) Footer fill="#f5c842" fontSize="7" y="153": 'THUMB FUNCTIONAL POSITION — WRIST 20° EXT'. Return ONLY the complete SVG element.`,

  ulgutter: `Create an SVG (viewBox="0 0 220 158") medical illustration of an ulnar gutter splint on a right hand. Background: <rect width="220" height="158" fill="#050f1e" rx="8"/>. Draw: (1) Forearm and hand anatomy in dark brown #2e1f0c — draw the ulna as a bone shape, and show a hand with 5 distinct finger shapes. (2) KEY feature: the ulnar gutter plaster slab #c8b896 along the ULNAR (pinky) side of the hand and forearm, forming a channel/gutter that cradles the ring (4th) and small (5th) fingers. (3) Show the 4th and 5th fingers clearly flexed at the MCP joint (~80°) and extended at the IP joints — the intrinsic-plus position. (4) Small arc annotation showing the ~80° MCP angle. (5) Labels fill="#a78bfa" fontSize="8": 'ULNAR SLAB', '4th FINGER', '5th FINGER', 'MCP 70-90°', 'IP EXTENDED'. (6) Footer fill="#a78bfa" fontSize="7" y="153": '4th/5th DIGITS — INTRINSIC-PLUS POSITION'. Return ONLY the complete SVG element.`,

  longarm: `Create an SVG (viewBox="0 0 220 158") medical illustration of a long arm posterior splint. Background: <rect width="220" height="158" fill="#050f1e" rx="8"/>. Draw: (1) Full arm anatomy: upper arm (humerus) as a long vertical shape at top, elbow joint as a rounded hinge in the middle (bent at 90°), forearm (radius/ulna) extending to the lower right at 90° angle — all in dark brown #2e1f0c with stroke #5a3e1a. The arm makes an L-shape. (2) KEY feature: a long continuous posterior plaster slab #c8b896 running along the entire posterior surface of the arm — from upper arm, around the back of the elbow, down the posterior forearm to the wrist. (3) Show padding detail as slightly lighter brown near bony prominences (elbow). (4) A circular dashed arc at the elbow indicating 90° angle. (5) Labels fill="#60a5fa" fontSize="8": 'HUMERUS', 'POSTERIOR SLAB', 'OLECRANON (pad well)', 'FOREARM NEUTRAL'. (6) Footer fill="#60a5fa" fontSize="7" y="153": 'ELBOW 90° · FOREARM NEUTRAL · WRIST NEUTRAL'. Return ONLY the complete SVG element.`,
};

// ── Splint Photos ────────────────────────────────────────────────────────────
const SPLINT_PHOTOS = {
  ankle:      "https://media.base44.com/images/public/69876015478a19e360c5e3ea/6da007f64_generated_image.png",
  sugartong:  "https://media.base44.com/images/public/69876015478a19e360c5e3ea/e6f35951f_generated_image.png",
  thumbspica: "https://media.base44.com/images/public/69876015478a19e360c5e3ea/a4af15ff5_generated_image.png",
  ulgutter:   "https://media.base44.com/images/public/69876015478a19e360c5e3ea/0ad3c5e4c_generated_image.png",
  longarm:    "https://media.base44.com/images/public/69876015478a19e360c5e3ea/3f2bc5e50_generated_image.png",
};

function AISplintImage({ sp }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError]   = useState(false);
  const src = SPLINT_PHOTOS[sp.svgType];

  if (!src || error) return <SplintSvg type={sp.svgType}/>;

  return (
    <div style={{position:"relative",borderRadius:8,overflow:"hidden",border:`1px solid ${sp.color}33`,background:"#050f1e"}}>
      {!loaded && (
        <div style={{width:"100%",height:158,display:"flex",alignItems:"center",justifyContent:"center",gap:10,flexDirection:"column"}}>
          <div style={{width:22,height:22,border:`2px solid ${sp.color}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.75s linear infinite"}}/>
          <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:sp.color,letterSpacing:1}}>LOADING…</span>
        </div>
      )}
      <img
        src={src}
        alt={sp.label}
        onLoad={()=>setLoaded(true)}
        onError={()=>setError(true)}
        style={{width:"100%",display:loaded?"block":"none",borderRadius:8,objectFit:"cover",maxHeight:220}}
      />
    </div>
  );
}

// ── SVG Schematics (Fallback) ─────────────────────────────────────────────────
function SplintSvg({ type }) {
  const sv = {borderRadius:8,width:"100%",display:"block"};
  if (type==="ankle") return (
    <svg viewBox="0 0 200 130" style={sv}>
      <rect width="200" height="130" fill="#050f1e" rx="7"/>
      <text x="6" y="11" fill="#3a2a10" fontSize="7" fontFamily="monospace">POSTERIOR ANKLE SPLINT</text>
      <ellipse cx="100" cy="55" rx="28" ry="50" fill="#2a1e0e" stroke="#5a3e1a" strokeWidth="1.5"/>
      <ellipse cx="68" cy="90" rx="38" ry="14" fill="#1e1508" stroke="#4a3015" strokeWidth="1.2"/>
      <rect x="62" y="73" width="76" height="32" rx="5" fill="#251a08" stroke="#ff9f43" strokeWidth="2" opacity="0.85"/>
      <text x="76" y="92" fill="#ff9f43" fontSize="9" fontFamily="monospace">POSTERIOR</text>
      <text x="82" y="102" fill="#ff9f43" fontSize="9" fontFamily="monospace">SLAB</text>
      <line x1="80" y1="58" x2="80" y2="74" stroke="#f5c842" strokeWidth="1.5" strokeDasharray="3,2"/>
      <text x="56" y="53" fill="#8a6e48" fontSize="7" fontFamily="monospace">FIBULA</text>
      <text x="110" y="65" fill="#8a6e48" fontSize="7" fontFamily="monospace">TIBIA</text>
      <path d="M100 104 Q95 115 90 122 L110 122 Q105 115 100 104" fill="#2a1e0e" stroke="#4a3015" strokeWidth="1"/>
      <text x="6" y="126" fill="#ff9f43" fontSize="7" fontFamily="monospace">POSITION: 90° NEUTRAL — NO PLANTARFLEXION</text>
    </svg>
  );
  if (type==="sugartong") return (
    <svg viewBox="0 0 200 130" style={sv}>
      <rect width="200" height="130" fill="#050f1e" rx="7"/>
      <text x="6" y="11" fill="#3a2a10" fontSize="7" fontFamily="monospace">SUGAR-TONG FOREARM SPLINT</text>
      <rect x="70" y="16" width="22" height="68" rx="6" fill="#2a1e0e" stroke="#5a3e1a" strokeWidth="1.5"/>
      <ellipse cx="81" cy="88" rx="18" ry="10" fill="#1e1508" stroke="#4a3015" strokeWidth="1.2"/>
      <rect x="58" y="20" width="10" height="60" rx="4" fill="#251a08" stroke="#fb923c" strokeWidth="2" opacity="0.85"/>
      <path d="M58 80 Q52 90 58 100 L68 100 Q62 90 68 80" fill="#251a08" stroke="#fb923c" strokeWidth="2" opacity="0.85"/>
      <rect x="94" y="20" width="10" height="60" rx="4" fill="#251a08" stroke="#fb923c" strokeWidth="2" opacity="0.85"/>
      <path d="M94 80 Q100 90 94 100 L104 100 Q98 90 104 80" fill="#251a08" stroke="#fb923c" strokeWidth="2" opacity="0.85"/>
      <text x="40" y="55" fill="#fb923c" fontSize="8" fontFamily="monospace">VOLAR</text>
      <text x="108" y="55" fill="#fb923c" fontSize="8" fontFamily="monospace">DORSAL</text>
      <line x1="58" y1="38" x2="56" y2="38" stroke="#f5c842" strokeWidth="0.8"/>
      <line x1="104" y1="38" x2="106" y2="38" stroke="#f5c842" strokeWidth="0.8"/>
      <line x1="56" y1="38" x2="56" y2="24" stroke="#f5c842" strokeWidth="1" strokeDasharray="2,2"/>
      <line x1="106" y1="38" x2="106" y2="24" stroke="#f5c842" strokeWidth="1" strokeDasharray="2,2"/>
      <text x="60" y="22" fill="#f5c842" fontSize="7" fontFamily="monospace">U-SHAPE</text>
      <text x="6" y="126" fill="#fb923c" fontSize="7" fontFamily="monospace">FOREARM NEUTRAL ROTATION — THUMB UP</text>
    </svg>
  );
  if (type==="thumbspica") return (
    <svg viewBox="0 0 200 130" style={sv}>
      <rect width="200" height="130" fill="#050f1e" rx="7"/>
      <text x="6" y="11" fill="#3a2a10" fontSize="7" fontFamily="monospace">THUMB SPICA SPLINT</text>
      <rect x="80" y="24" width="30" height="70" rx="8" fill="#2a1e0e" stroke="#5a3e1a" strokeWidth="1.5"/>
      <rect x="52" y="38" width="15" height="42" rx="6" fill="#2a1e0e" stroke="#5a3e1a" strokeWidth="1.2"/>
      <ellipse cx="59" cy="42" rx="10" ry="8" fill="#1e1508" stroke="#4a3015" strokeWidth="1"/>
      <rect x="44" y="22" width="10" height="70" rx="4" fill="#251a08" stroke="#f5c842" strokeWidth="2" opacity="0.85"/>
      <path d="M44 22 Q38 18 42 12 L54 12 Q50 18 54 22" fill="#251a08" stroke="#f5c842" strokeWidth="1.5" opacity="0.85"/>
      <text x="28" y="58" fill="#f5c842" fontSize="8" fontFamily="monospace">RADIAL</text>
      <text x="28" y="68" fill="#f5c842" fontSize="8" fontFamily="monospace">SLAB</text>
      <text x="56" y="46" fill="#8a6e48" fontSize="7" fontFamily="monospace">1st CMC</text>
      <text x="84" y="65" fill="#8a6e48" fontSize="8" fontFamily="monospace">RADIUS</text>
      <text x="6" y="126" fill="#f5c842" fontSize="7" fontFamily="monospace">THUMB: FUNCTIONAL POSITION — WRIST 20° EXT</text>
    </svg>
  );
  if (type==="ulgutter") return (
    <svg viewBox="0 0 200 130" style={sv}>
      <rect width="200" height="130" fill="#050f1e" rx="7"/>
      <text x="6" y="11" fill="#3a2a10" fontSize="7" fontFamily="monospace">ULNAR GUTTER SPLINT</text>
      <rect x="78" y="22" width="32" height="72" rx="8" fill="#2a1e0e" stroke="#5a3e1a" strokeWidth="1.5"/>
      <rect x="118" y="38" width="12" height="40" rx="5" fill="#2a1e0e" stroke="#5a3e1a" strokeWidth="1.2"/>
      <rect x="132" y="38" width="12" height="40" rx="5" fill="#2a1e0e" stroke="#5a3e1a" strokeWidth="1.2"/>
      <rect x="116" y="28" width="32" height="70" rx="4" fill="#251a08" stroke="#a78bfa" strokeWidth="2" opacity="0.85"/>
      <text x="124" y="66" fill="#a78bfa" fontSize="7" fontFamily="monospace">ULNAR</text>
      <text x="124" y="76" fill="#a78bfa" fontSize="7" fontFamily="monospace">SLAB</text>
      <line x1="118" y1="56" x2="116" y2="56" stroke="#a78bfa" strokeWidth="2"/>
      <line x1="148" y1="56" x2="150" y2="56" stroke="#a78bfa" strokeWidth="2"/>
      <text x="80" y="65" fill="#8a6e48" fontSize="8" fontFamily="monospace">ULNA</text>
      <text x="6" y="118" fill="#a78bfa" fontSize="7" fontFamily="monospace">4th/5th MCP 70–90° FLEX · IP EXTENDED</text>
      <text x="6" y="127" fill="#4a3820" fontSize="7" fontFamily="monospace">INTRINSIC-PLUS POSITION — PREVENTS CONTRACTURE</text>
    </svg>
  );
  if (type==="longarm") return (
    <svg viewBox="0 0 200 130" style={sv}>
      <rect width="200" height="130" fill="#050f1e" rx="7"/>
      <text x="6" y="11" fill="#3a2a10" fontSize="7" fontFamily="monospace">LONG ARM POSTERIOR SPLINT</text>
      <rect x="84" y="12" width="24" height="60" rx="7" fill="#2a1e0e" stroke="#5a3e1a" strokeWidth="1.5"/>
      <ellipse cx="96" cy="75" rx="16" ry="10" fill="#1a1408" stroke="#4a3015" strokeWidth="1.2"/>
      <rect x="82" y="72" width="26" height="45" rx="6" fill="#2a1e0e" stroke="#5a3e1a" strokeWidth="1.5"/>
      <rect x="72" y="14" width="12" height="102" rx="4" fill="#251a08" stroke="#60a5fa" strokeWidth="2" opacity="0.9"/>
      <text x="56" y="55" fill="#60a5fa" fontSize="7" fontFamily="monospace">POST</text>
      <text x="56" y="64" fill="#60a5fa" fontSize="7" fontFamily="monospace">SLAB</text>
      <ellipse cx="95" cy="74" rx="6" ry="6" fill="none" stroke="#f5c842" strokeWidth="1.5" strokeDasharray="3,2"/>
      <text x="108" y="78" fill="#f5c842" fontSize="7" fontFamily="monospace">ELBOW 90°</text>
      <text x="6" y="127" fill="#60a5fa" fontSize="7" fontFamily="monospace">ELBOW 90° · FOREARM NEUTRAL · WRIST NEUTRAL</text>
    </svg>
  );
  return null;
}

const FRACTURE_PHOTOS = {
  salter: {
    I:   "https://media.base44.com/images/public/69876015478a19e360c5e3ea/03a826353_generated_image.png",
    II:  "https://media.base44.com/images/public/69876015478a19e360c5e3ea/87ba062d4_generated_image.png",
    III: "https://media.base44.com/images/public/69876015478a19e360c5e3ea/6107e8ab9_generated_image.png",
    IV:  "https://media.base44.com/images/public/69876015478a19e360c5e3ea/a1a3b262b_generated_image.png",
    V:   "https://media.base44.com/images/public/69876015478a19e360c5e3ea/ac24ffc8c_generated_image.png",
  },
  gustilo: {
    I:    "https://media.base44.com/images/public/69876015478a19e360c5e3ea/d785c928c_generated_image.png",
    II:   "https://media.base44.com/images/public/69876015478a19e360c5e3ea/de985e2f4_generated_image.png",
    IIIA: "https://media.base44.com/images/public/69876015478a19e360c5e3ea/44aeeb277_generated_image.png",
    IIIB: "https://media.base44.com/images/public/69876015478a19e360c5e3ea/b09800676_generated_image.png",
    IIIC: "https://media.base44.com/images/public/69876015478a19e360c5e3ea/57e19222b_generated_image.png",
  },
  mason: [
    "https://media.base44.com/images/public/69876015478a19e360c5e3ea/430411ca8_generated_image.png",
    "https://media.base44.com/images/public/69876015478a19e360c5e3ea/67d97c208_generated_image.png",
    "https://media.base44.com/images/public/69876015478a19e360c5e3ea/d051287c2_generated_image.png",
  ],
};

function BoneSvg({ type, grade, masonIndex }) {
  let src = null;
  if (type === "salter")  src = FRACTURE_PHOTOS.salter[grade];
  if (type === "gustilo") src = FRACTURE_PHOTOS.gustilo[grade];
  if (type === "mason")   src = FRACTURE_PHOTOS.mason[masonIndex];

  if (!src) return null;
  return (
    <img
      src={src}
      alt={`${type} ${grade}`}
      style={{width:"100%",borderRadius:8,display:"block",objectFit:"cover",border:"1px solid rgba(42,79,122,0.3)"}}
    />
  );
}

// ── Card Components ───────────────────────────────────────────────────────────
function SplintCard({ sp }) {
  const [tab, setTab] = useState("steps");
  return (
    <div style={{...glass,overflow:"hidden",borderLeft:`4px solid ${sp.color}`,marginBottom:0}}>
      <div style={{padding:"14px 16px 10px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <span style={{fontSize:16}}>{sp.icon}</span>
          <div style={{flex:1}}>
            <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:16,color:sp.color}}>{sp.label}</div>
            <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,marginTop:1}}>Position: {sp.position.substring(0,70)}…</div>
          </div>
        </div>
        <AISplintImage sp={sp}/>
        <div style={{display:"flex",gap:5,marginTop:10,flexWrap:"wrap"}}>
          {["steps","padding","position","pearls"].map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              style={{fontFamily:"JetBrains Mono",fontSize:9,fontWeight:600,padding:"4px 9px",borderRadius:6,
                border:`1px solid ${tab===t?sp.color+"66":"rgba(42,79,122,0.35)"}`,
                background:tab===t?`${sp.color}14`:"transparent",
                color:tab===t?sp.color:T.txt4,cursor:"pointer",textTransform:"uppercase",letterSpacing:0.8}}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="fade-in" key={tab} style={{padding:"0 16px 16px",borderTop:"1px solid rgba(42,79,122,0.2)"}}>
        {tab==="steps" && (
          <div style={{paddingTop:10}}>
            {sp.steps.map((s,i)=>(
              <div key={i} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
                <span className="step-num" style={{background:`${sp.color}18`,border:`1px solid ${sp.color}44`,fontSize:9,fontFamily:"JetBrains Mono",fontWeight:600,color:sp.color}}>{i+1}</span>
                <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6}}>{s}</span>
              </div>
            ))}
          </div>
        )}
        {tab==="padding" && (
          <div style={{paddingTop:10}}>
            {sp.padding.map((s,i)=>(
              <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:6}}>
                <span style={{color:sp.color,fontSize:8,marginTop:4,flexShrink:0}}>▸</span>
                <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{s}</span>
              </div>
            ))}
          </div>
        )}
        {tab==="position" && (
          <div style={{paddingTop:10,padding:"10px 12px",background:`${sp.color}0a`,border:`1px solid ${sp.color}22`,borderRadius:10,marginTop:10}}>
            <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:sp.color,fontWeight:600,letterSpacing:1,marginBottom:6}}>POSITION INSTRUCTIONS</div>
            <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt,lineHeight:1.7}}>{sp.position}</div>
            <div style={{marginTop:10}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt3,letterSpacing:1,marginBottom:6}}>INDICATIONS</div>
              {sp.indications.map((ind,i)=>(
                <div key={i} style={{display:"flex",gap:8,marginBottom:4}}>
                  <span style={{color:sp.color,fontSize:8,marginTop:3,flexShrink:0}}>▸</span>
                  <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{ind}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab==="pearls" && (
          <div style={{paddingTop:10}}>
            {sp.pearls.map((p,i)=>(
              <div key={i} style={{display:"flex",gap:8,padding:"8px 10px",background:"rgba(8,22,40,0.7)",border:"1px solid rgba(42,79,122,0.2)",borderRadius:8,marginBottom:6}}>
                <span style={{color:T.yellow,flexShrink:0}}>💎</span>
                <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{p}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReductionCard({ red }) {
  const [techIdx, setTechIdx] = useState(0);
  const [section, setSection] = useState("steps");
  const tech = red.techniques[techIdx];
  return (
    <div style={{...glass,overflow:"hidden",borderTop:`3px solid ${red.color}`,marginBottom:0}}>
      <div style={{padding:"14px 16px 10px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <span style={{fontSize:16}}>{red.icon}</span>
          <div style={{flex:1}}>
            <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:16,color:red.color}}>{red.label}</div>
          </div>
        </div>
        <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,lineHeight:1.5,marginBottom:8}}>{red.prereduction}</div>
        {/* Technique selector */}
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
          {red.techniques.map((t,i)=>(
            <button key={i} onClick={()=>{setTechIdx(i);setSection("steps");}}
              style={{fontFamily:"DM Sans",fontSize:10,fontWeight:600,padding:"4px 10px",borderRadius:8,
                border:`1px solid ${techIdx===i?t.color+"66":"rgba(42,79,122,0.35)"}`,
                background:techIdx===i?`${t.color}14`:"transparent",color:techIdx===i?t.color:T.txt3,cursor:"pointer"}}>
              {t.name}
            </button>
          ))}
        </div>
      </div>
      <div key={`${red.id}-${techIdx}`} className="fade-in" style={{padding:"0 16px 16px",borderTop:"1px solid rgba(42,79,122,0.2)"}}>
        <div style={{display:"flex",gap:5,margin:"10px 0 10px",flexWrap:"wrap"}}>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,padding:"3px 8px",borderRadius:5,background:`${tech.color}14`,border:`1px solid ${tech.color}33`,color:tech.color}}>
            ⊕ {tech.sedation}
          </div>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,padding:"3px 8px",borderRadius:5,background:"rgba(8,22,40,0.7)",border:"1px solid rgba(42,79,122,0.2)",color:T.txt3}}>
            ⏱ {tech.time}
          </div>
        </div>
        <div style={{display:"flex",gap:5,marginBottom:10}}>
          {["steps","pearl"].map(s=>(
            <button key={s} onClick={()=>setSection(s)}
              style={{fontFamily:"JetBrains Mono",fontSize:9,padding:"3px 9px",borderRadius:6,
                border:`1px solid ${section===s?tech.color+"66":"rgba(42,79,122,0.35)"}`,
                background:section===s?`${tech.color}12`:"transparent",color:section===s?tech.color:T.txt4,cursor:"pointer",textTransform:"uppercase"}}>
              {s}
            </button>
          ))}
        </div>
        {section==="steps" && (
          <div>
            {tech.steps.map((st,i)=>(
              <div key={i} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
                <span className="step-num" style={{background:`${tech.color}18`,border:`1px solid ${tech.color}44`,fontSize:9,fontFamily:"JetBrains Mono",fontWeight:600,color:tech.color}}>{i+1}</span>
                <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6}}>{st}</span>
              </div>
            ))}
          </div>
        )}
        {section==="pearl" && (
          <div style={{padding:"10px 12px",background:`${T.yellow}0a`,border:`1px solid ${T.yellow}22`,borderRadius:10}}>
            <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.yellow,fontWeight:600,letterSpacing:1}}>💎 PEARL </span>
            <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>{tech.pearls}</span>
          </div>
        )}
        {section==="steps" && (
          <div style={{marginTop:10,padding:"8px 10px",background:"rgba(8,22,40,0.6)",border:"1px solid rgba(42,79,122,0.15)",borderRadius:8}}>
            <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,letterSpacing:1,marginBottom:5}}>POST-REDUCTION</div>
            <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,lineHeight:1.5}}>{red.post}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function BlockCard({ blk }) {
  const [section, setSection] = useState("technique");
  return (
    <div style={{...glass,overflow:"hidden",borderTop:`3px solid ${blk.color}`,marginBottom:0}}>
      <div style={{padding:"14px 16px 10px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <span style={{fontSize:16}}>{blk.icon}</span>
          <div style={{flex:1}}>
            <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:15,color:blk.color}}>{blk.label}</div>
            <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt4,marginTop:1}}>{blk.indication}</div>
          </div>
        </div>
        {/* Dosing table */}
        <div style={{borderRadius:9,overflow:"hidden",border:"1px solid rgba(42,79,122,0.25)",marginBottom:8}}>
          <div style={{display:"grid",gridTemplateColumns:"1.5fr .8fr .8fr .6fr 1fr",background:"rgba(8,22,40,0.9)",padding:"5px 8px",gap:4}}>
            {["Agent","Max Dose","Vol","Onset","Duration"].map(h=>(
              <div key={h} style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,fontWeight:600,textTransform:"uppercase",letterSpacing:0.8}}>{h}</div>
            ))}
          </div>
          {blk.agents.map((a,i)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:"1.5fr .8fr .8fr .6fr 1fr",padding:"7px 8px",gap:4,background:i%2===0?"rgba(8,22,40,0.5)":"rgba(8,22,40,0.4)",borderTop:"1px solid rgba(42,79,122,0.12)"}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:blk.color,fontWeight:600}}>{a.drug}</div>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt2}}>{a.max}</div>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt2}}>{a.typicalVol}</div>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.green}}>{a.onset}</div>
              <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.yellow}}>{a.duration}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:5}}>
          {["technique","anatomy","contraindications","pearl"].map(s=>(
            <button key={s} onClick={()=>setSection(s)}
              style={{fontFamily:"JetBrains Mono",fontSize:9,padding:"3px 9px",borderRadius:6,
                border:`1px solid ${section===s?blk.color+"66":"rgba(42,79,122,0.35)"}`,
                background:section===s?`${blk.color}12`:"transparent",color:section===s?blk.color:T.txt4,cursor:"pointer",textTransform:"uppercase",letterSpacing:0.5}}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div key={section} className="fade-in" style={{padding:"0 16px 16px",borderTop:"1px solid rgba(42,79,122,0.2)"}}>
        {section==="technique" && (
          <div style={{paddingTop:10}}>
            {blk.technique.map((s,i)=>(
              <div key={i} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
                <span className="step-num" style={{background:`${blk.color}18`,border:`1px solid ${blk.color}44`,fontSize:9,fontFamily:"JetBrains Mono",fontWeight:600,color:blk.color}}>{i+1}</span>
                <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.6}}>{s}</span>
              </div>
            ))}
          </div>
        )}
        {section==="anatomy" && (
          <div style={{paddingTop:10,padding:"10px 12px",background:"rgba(8,22,40,0.6)",border:"1px solid rgba(42,79,122,0.2)",borderRadius:10,marginTop:10}}>
            <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:blk.color,fontWeight:600,letterSpacing:1,marginBottom:6}}>ANATOMY</div>
            <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt,lineHeight:1.7}}>{blk.anatomy}</div>
          </div>
        )}
        {section==="contraindications" && (
          <div style={{paddingTop:10}}>
            {blk.contraindications.map((c,i)=>(
              <div key={i} style={{display:"flex",gap:8,padding:"7px 10px",background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,marginBottom:5}}>
                <span style={{color:T.red,flexShrink:0,fontSize:11}}>⊘</span>
                <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{c}</span>
              </div>
            ))}
            <div style={{marginTop:10,padding:"9px 12px",background:"rgba(239,68,68,0.05)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:8}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.red,fontWeight:600,letterSpacing:1,marginBottom:5}}>LAST PROTOCOL — LOCAL ANESTHETIC TOXICITY</div>
              <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,lineHeight:1.5}}>Intralipid 20% must be immediately available. Bolus: 1.5 mL/kg IV over 1 min. Infusion: 0.25 mL/kg/min. Max total dose: 12 mL/kg. Repeat bolus × 2 if no response at 5 min intervals.</div>
            </div>
          </div>
        )}
        {section==="pearl" && (
          <div style={{paddingTop:10,padding:"10px 12px",background:`${T.yellow}0a`,border:`1px solid ${T.yellow}22`,borderRadius:10,marginTop:10}}>
            <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.yellow,fontWeight:600,letterSpacing:1}}>💎 PEARL </span>
            <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>{blk.pearl}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Ambient Background ────────────────────────────────────────────────────────
function AmbientBg() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
      <div style={{position:"absolute",top:"-10%",right:"-5%",width:"50%",height:"50%",background:"radial-gradient(circle,rgba(245,158,11,0.07) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",bottom:"-12%",left:"-8%",width:"45%",height:"45%",background:"radial-gradient(circle,rgba(251,191,36,0.05) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",top:"45%",right:"20%",width:"30%",height:"30%",background:"radial-gradient(circle,rgba(96,165,250,0.04) 0%,transparent 70%)"}}/>
    </div>
  );
}
function Bullet({ text, color }) {
  return (
    <div style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:5}}>
      <span style={{color:color||T.orange,fontSize:8,marginTop:3,flexShrink:0}}>▸</span>
      <span style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{text}</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function OrthoHub() {
  const navigate = useNavigate();
  const [tab,        setTab]       = useState("splints");
  const [shGrade,    setShGrade]   = useState("I");
  const [gustGrade,  setGustGrade] = useState("I");
  const [masonGrade, setMasonGrade]= useState(0);
  const [fracType,   setFracType]  = useState("salter");

  const activeSH   = SALTER_HARRIS.find(s=>s.grade===shGrade);
  const activeGust = GUSTILO.find(g=>g.grade===gustGrade);

  return (
    <div style={{fontFamily:"DM Sans, sans-serif",background:T.bg,minHeight:"100vh",position:"relative",overflow:"hidden",color:T.txt}}>
      <AmbientBg/>
      <div style={{position:"relative",zIndex:1,maxWidth:1440,margin:"0 auto",padding:"0 18px"}}>

        {/* Header */}
        <div style={{padding:"18px 0 14px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",background:"rgba(5,15,30,0.92)",border:"1px solid rgba(42,79,122,0.5)",borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.orange,letterSpacing:3}}>NOTRYA</span>
              <span style={{color:T.txt4,fontFamily:"JetBrains Mono",fontSize:10}}>/</span>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3,letterSpacing:2}}>ORTHO HUB</span>
            </div>
            <div style={{height:1,flex:1,background:"linear-gradient(90deg,rgba(42,79,122,0.5),transparent)"}}/>            <button onClick={()=>navigate("/hub")} style={{padding:"5px 14px",borderRadius:8,background:"rgba(14,37,68,0.6)",border:"1px solid rgba(42,79,122,0.4)",color:"#8aaccc",fontFamily:"DM Sans",fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0}}>← Hub</button>
          </div>
          <h1 className="shimmer-text" style={{fontFamily:"Playfair Display",fontSize:"clamp(28px,4.5vw,48px)",fontWeight:700,letterSpacing:-1,lineHeight:1.05}}>OrthoHub</h1>
          <p style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3,marginTop:4}}>Splinting Guides · Fracture Classification · Dislocation Reductions · Procedural Nerve Blocks</p>
        </div>

        {/* Stat Banner */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:16}}>
          {[
            {label:"Splint Types",  value:"5",         sub:"Ankle · Sugar-tong · Spica · Gutter · Long arm", color:T.orange},
            {label:"Salter-Harris", value:"Types I–V",  sub:"Physeal injury classification",   color:T.teal},
            {label:"Gustilo",       value:"5 Grades",   sub:"Open fracture severity system",   color:T.orange},
            {label:"Reductions",    value:"5 Joints",   sub:"Shoulder · Digit · Patella · Hip · Elbow", color:T.blue},
            {label:"Nerve Blocks",  value:"6 Types",    sub:"Digital · Hematoma · Wrist · Femoral", color:T.purple},
            {label:"LAST Protocol", value:"Intralipid", sub:"1.5 mL/kg IV bolus first-line",   color:T.red},
          ].map((b,i)=>(
            <div key={i} style={{...glass,padding:"9px 12px",borderLeft:`3px solid ${b.color}`,background:`linear-gradient(135deg,${b.color}0e,rgba(8,22,40,0.85))`,borderRadius:10}}>
              <div style={{fontFamily:"JetBrains Mono",fontSize:12,fontWeight:600,color:b.color,lineHeight:1}}>{b.value}</div>
              <div style={{fontFamily:"DM Sans",fontWeight:600,color:T.txt,fontSize:10,margin:"3px 0"}}>{b.label}</div>
              <div style={{fontFamily:"DM Sans",fontSize:9,color:T.txt4,lineHeight:1.3}}>{b.sub}</div>
            </div>
          ))}
        </div>

        {/* Tab Bar */}
        <div style={{...glass,padding:"6px",display:"flex",gap:4,marginBottom:16}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{flex:"1 1 auto",fontFamily:"DM Sans",fontWeight:600,fontSize:12,padding:"10px 8px",borderRadius:10,
                border:`1px solid ${tab===t.id?"rgba(245,158,11,0.5)":"transparent"}`,
                background:tab===t.id?"linear-gradient(135deg,rgba(245,158,11,0.15),rgba(245,158,11,0.05))":"transparent",
                color:tab===t.id?T.orange:T.txt3,cursor:"pointer",textAlign:"center",transition:"all .15s"}}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── Splints Tab ── */}
        {tab==="splints" && (
          <div className="fade-in">
            <div style={{padding:"10px 14px",background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:10,marginBottom:14,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              🩹 <strong style={{color:T.orange}}>Splinting Principles:</strong> Splints (as opposed to casts) leave one side open for swelling — always preferred in acute injuries. Apply stockinette → padding (generous over bony prominences) → plaster → overwrap. Padding rule: when in doubt, add more — pressure injuries are preventable.
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(340px,1fr))",gap:14}}>
              {SPLINTS.map(sp=><SplintCard key={sp.id} sp={sp}/>)}
            </div>
          </div>
        )}

        {/* ── Fractures Tab ── */}
        {tab==="fractures" && (
          <div className="fade-in">
            {/* Fracture system selector */}
            <div style={{...glass,padding:"8px",display:"flex",gap:6,marginBottom:16}}>
              {[{id:"salter",label:"Salter-Harris (Physeal)",color:T.teal},{id:"gustilo",label:"Gustilo-Anderson (Open)",color:T.orange},{id:"mason",label:"Mason (Radial Head)",color:T.purple}].map(f=>(
                <button key={f.id} onClick={()=>setFracType(f.id)}
                  style={{flex:"1 1 auto",fontFamily:"DM Sans",fontWeight:600,fontSize:12,padding:"9px 8px",borderRadius:9,
                    border:`1px solid ${fracType===f.id?f.color+"55":"transparent"}`,
                    background:fracType===f.id?`${f.color}12`:"transparent",color:fracType===f.id?f.color:T.txt3,cursor:"pointer"}}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Salter-Harris */}
            {fracType==="salter" && (
              <div className="fade-in">
                <div style={{padding:"10px 14px",background:"rgba(45,212,191,0.06)",border:"1px solid rgba(45,212,191,0.2)",borderRadius:10,marginBottom:14,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
                  🦴 <strong style={{color:T.teal}}>Salter-Harris Classification:</strong> Applied to physeal (growth plate) injuries in skeletally immature patients. Mnemonic: <strong style={{color:T.yellow}}>SALTR</strong> — Straight through physis · Above (metaphysis) · Lower (epiphysis) · Through all three · Rammed/crushed. Higher grade = worse prognosis for growth.
                </div>
                <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
                  {SALTER_HARRIS.map(sh=>(
                    <button key={sh.grade} onClick={()=>setShGrade(sh.grade)}
                      style={{...glass,padding:"10px 16px",border:`2px solid ${shGrade===sh.grade?sh.color+"88":"rgba(42,79,122,0.35)"}`,
                        background:shGrade===sh.grade?`${sh.color}14`:"rgba(8,22,40,0.8)",
                        cursor:"pointer",borderRadius:10,flex:"1 1 auto",textAlign:"center",transition:"all .15s"}}>
                      <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:18,color:shGrade===sh.grade?sh.color:T.txt2}}>Type {sh.grade}</div>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,marginTop:2}}>{sh.mnemonic}</div>
                    </button>
                  ))}
                </div>
                {activeSH && (
                  <div className="fade-in" key={shGrade}>
                    <div style={{display:"grid",gridTemplateColumns:"220px 1fr",gap:14}}>
                      <div>
                        <BoneSvg type="salter" grade={shGrade}/>
                        <div style={{...glass,padding:"12px 14px",marginTop:12,borderLeft:`3px solid ${activeSH.color}`}}>
                          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:activeSH.color,fontWeight:600,letterSpacing:1,marginBottom:6}}>EXAMPLES</div>
                          {activeSH.examples.map((e,i)=><Bullet key={i} text={e} color={activeSH.color}/>)}
                        </div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:10}}>
                        <div style={{...glass,padding:"14px 18px",borderTop:`4px solid ${activeSH.color}`,background:`linear-gradient(135deg,${activeSH.color}08,rgba(8,22,40,0.9))`}}>
                          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                            <h3 style={{fontFamily:"Playfair Display",fontSize:22,fontWeight:700,color:activeSH.color,margin:0}}>Type {activeSH.grade}</h3>
                            <span style={{fontFamily:"JetBrains Mono",fontSize:10,padding:"3px 9px",borderRadius:6,background:`${activeSH.color}14`,border:`1px solid ${activeSH.color}33`,color:activeSH.color}}>{activeSH.mnemonic}</span>
                          </div>
                          <div style={{fontFamily:"DM Sans",fontSize:13,color:T.txt,lineHeight:1.7}}>{activeSH.description}</div>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                          <div style={{...glass,padding:"12px 14px"}}>
                            <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt3,fontWeight:600,letterSpacing:1,marginBottom:6}}>X-RAY FINDINGS</div>
                            <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.5}}>{activeSH.xray}</div>
                          </div>
                          <div style={{...glass,padding:"12px 14px",borderLeft:`3px solid ${activeSH.color}`}}>
                            <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:activeSH.color,fontWeight:600,letterSpacing:1,marginBottom:6}}>PROGNOSIS</div>
                            <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt,lineHeight:1.5,fontWeight:500}}>{activeSH.prognosis}</div>
                          </div>
                        </div>
                        <div style={{...glass,padding:"12px 14px"}}>
                          <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.yellow,fontWeight:600,letterSpacing:1,marginBottom:6}}>TREATMENT</div>
                          <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt,lineHeight:1.6}}>{activeSH.treatment}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Gustilo-Anderson */}
            {fracType==="gustilo" && (
              <div className="fade-in">
                <div style={{padding:"10px 14px",background:"rgba(251,146,60,0.06)",border:"1px solid rgba(251,146,60,0.2)",borderRadius:10,marginBottom:14,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
                  🦴 <strong style={{color:T.orange}}>Gustilo-Anderson Classification:</strong> Standardizes open fracture severity to guide antibiotic selection, coverage requirements, and prognosis. The key variables: wound size, contamination level, and soft tissue coverage adequacy. Antibiotics within 1 hour = single most evidence-based intervention.
                </div>
                <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
                  {GUSTILO.map(g=>(
                    <button key={g.grade} onClick={()=>setGustGrade(g.grade)}
                      style={{...glass,padding:"10px 14px",border:`2px solid ${gustGrade===g.grade?g.color+"88":"rgba(42,79,122,0.35)"}`,
                        background:gustGrade===g.grade?`${g.color}14`:"rgba(8,22,40,0.8)",
                        cursor:"pointer",borderRadius:10,flex:"1 1 auto",textAlign:"center",transition:"all .15s"}}>
                      <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:16,color:gustGrade===g.grade?g.color:T.txt2}}>{g.grade}</div>
                      <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,marginTop:2}}>{g.wound.substring(0,22)}…</div>
                    </button>
                  ))}
                </div>
                {activeGust && (
                  <div className="fade-in" key={gustGrade}>
                    <div style={{display:"grid",gridTemplateColumns:"220px 1fr",gap:14}}>
                      <BoneSvg type="gustilo" grade={gustGrade}/>
                      <div style={{display:"flex",flexDirection:"column",gap:10}}>
                        <div style={{...glass,padding:"14px 18px",borderTop:`4px solid ${activeGust.color}`,background:`linear-gradient(135deg,${activeGust.color}08,rgba(8,22,40,0.9))`}}>
                          <h3 style={{fontFamily:"Playfair Display",fontSize:20,fontWeight:700,color:activeGust.color,margin:"0 0 8px 0"}}>{activeGust.label}</h3>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                            {[{label:"Wound",val:activeGust.wound},{label:"Contamination",val:activeGust.contamination},{label:"Soft Tissue",val:activeGust.soft_tissue},{label:"Coverage",val:activeGust.coverage}].map((r,i)=>(
                              <div key={i}>
                                <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,fontWeight:600,letterSpacing:1,marginBottom:3}}>{r.label.toUpperCase()}</div>
                                <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt2,lineHeight:1.5}}>{r.val}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                          <div style={{...glass,padding:"12px 14px",borderLeft:`3px solid ${T.teal}`}}>
                            <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.teal,fontWeight:600,letterSpacing:1,marginBottom:6}}>ANTIBIOTIC REGIMEN</div>
                            <div style={{fontFamily:"JetBrains Mono",fontSize:11,color:T.txt,lineHeight:1.6}}>{activeGust.antibiotic}</div>
                          </div>
                          <div style={{...glass,padding:"12px 14px",borderLeft:`3px solid ${activeGust.color}`}}>
                            <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:activeGust.color,fontWeight:600,letterSpacing:1,marginBottom:6}}>PROGNOSIS</div>
                            <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt,lineHeight:1.5,fontWeight:500}}>{activeGust.prognosis}</div>
                          </div>
                        </div>
                        <div style={{...glass,padding:"12px 14px"}}>
                          <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.yellow,fontWeight:600,letterSpacing:1,marginBottom:6}}>MANAGEMENT</div>
                          <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt,lineHeight:1.6}}>{activeGust.management}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mason Radial Head */}
            {fracType==="mason" && (
              <div className="fade-in">
                <div style={{padding:"10px 14px",background:"rgba(167,139,250,0.06)",border:"1px solid rgba(167,139,250,0.2)",borderRadius:10,marginBottom:14,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
                  🦴 <strong style={{color:T.purple}}>Mason Classification — Radial Head Fractures:</strong> Most common elbow fracture in adults. Key decision point: is there a mechanical block to forearm rotation? Aspiration + lidocaine injection into the radiocapitellar joint allows accurate ROM assessment (if block present after aspiration → likely Mason II or III).
                </div>
                <div style={{display:"flex",gap:8,marginBottom:14}}>
                  {MASON_CLASSES.map((m,i)=>(
                    <button key={i} onClick={()=>setMasonGrade(i)}
                      style={{...glass,flex:"1 1 auto",padding:"10px 16px",border:`2px solid ${masonGrade===i?m.color+"88":"rgba(42,79,122,0.35)"}`,
                        background:masonGrade===i?`${m.color}14`:"rgba(8,22,40,0.8)",cursor:"pointer",borderRadius:10,textAlign:"center",transition:"all .15s"}}>
                      <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:20,color:masonGrade===i?m.color:T.txt2}}>Type {i+1}</div>
                    </button>
                  ))}
                </div>
                {(()=>{
                  const m = MASON_CLASSES[masonGrade];
                  return (
                    <div className="fade-in" key={masonGrade} style={{...glass,padding:"18px 20px",borderTop:`4px solid ${m.color}`,background:`linear-gradient(135deg,${m.color}08,rgba(8,22,40,0.92))`}}>
                      <h3 style={{fontFamily:"Playfair Display",fontSize:20,fontWeight:700,color:m.color,marginBottom:10}}>Mason Type {masonGrade+1}</h3>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                        <div style={{padding:"12px 14px",background:`${m.color}08`,border:`1px solid ${m.color}22`,borderRadius:10}}>
                          <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:m.color,fontWeight:600,letterSpacing:1,marginBottom:6}}>DESCRIPTION</div>
                          <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt,lineHeight:1.7}}>{m.desc}</div>
                        </div>
                        <div style={{padding:"12px 14px",background:"rgba(8,22,40,0.7)",border:"1px solid rgba(42,79,122,0.25)",borderRadius:10}}>
                          <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.yellow,fontWeight:600,letterSpacing:1,marginBottom:6}}>TREATMENT</div>
                          <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt,lineHeight:1.7}}>{m.tx}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ── X-Ray Viewer Tab ── */}
        {tab==="xray" && (
          <div className="fade-in">
            <XRayViewer />
          </div>
        )}

        {/* ── Reductions Tab ── */}
        {tab==="reductions" && (
          <div className="fade-in">
            <div style={{padding:"10px 14px",background:"rgba(96,165,250,0.06)",border:"1px solid rgba(96,165,250,0.2)",borderRadius:10,marginBottom:14,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              🔄 <strong style={{color:T.blue}}>Reduction Principles:</strong> Adequate analgesia / sedation is the single most important factor in successful reduction. Muscle relaxation outweighs force every time. Always image pre- and post-reduction. Recheck neurovascular after every reduction. Document informed consent including risks of associated injury.
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(400px,1fr))",gap:14}}>
              {REDUCTIONS.map(r=><ReductionCard key={r.id} red={r}/>)}
            </div>
          </div>
        )}

        {/* ── Nerve Blocks Tab ── */}
        {tab==="blocks" && (
          <div className="fade-in">
            <div style={{padding:"10px 14px",background:"rgba(167,139,250,0.06)",border:"1px solid rgba(167,139,250,0.2)",borderRadius:10,marginBottom:14,fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.7}}>
              💉 <strong style={{color:T.purple}}>Nerve Block Safety:</strong> Maximum dose limits are per-patient weight — always calculate before drawing up. <strong style={{color:T.red}}>Intralipid 20% must be immediately available</strong> before any peripheral nerve block. Aspirate before every injection. Inject slowly — stop if patient reports metallic taste, tinnitus, or perioral tingling (early LAST signs).
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(380px,1fr))",gap:14}}>
              {NERVE_BLOCKS.map(b=><BlockCard key={b.id} blk={b}/>)}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{textAlign:"center",paddingBottom:24,paddingTop:16}}>
          <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5}}>
            NOTRYA ORTHO HUB · SALTER-HARRIS · GUSTILO-ANDERSON · MASON · VERIFY ALL CLINICAL DECISIONS WITH SPECIALIST CONSULTATION
          </span>
        </div>

      </div>
    </div>
  );
}