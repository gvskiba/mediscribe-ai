// EDProcedureNotes.jsx
// ED Procedure Note Builder — standalone hub + embedded in NPI case "procedures"
// Covers: Laceration, I&D, LP, Central Line, Thoracentesis, Arthrocentesis,
//         Intubation, Chest Tube, Paracentesis, Foley Catheterization
//
// Props (embedded mode):
//   embedded        bool     — hides back-nav header
//   patientName     string
//   patientAllergies string
//   physicianName   string
//
// Constraints: no form, no localStorage, no router import, straight quotes only,
//   single react import, border before borderTop/etc., finally { setBusy(false) }

import { useState, useCallback } from "react";

// ── Font injection (idempotent) ───────────────────────────────────────────────
(() => {
  if (document.getElementById("proc-fonts")) return;
  const l = document.createElement("link");
  l.id = "proc-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "proc-css";
  s.textContent = `
    @keyframes proc-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    .proc-fade{animation:proc-fade .2s ease forwards;}
    @keyframes proc-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    .proc-spin{animation:proc-spin 1s linear infinite;display:inline-block;}
    @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
    .shimmer-text{
      background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#9b6dff 52%,#00e5c0 72%,#e8f0fe 100%);
      background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;animation:shimmer 5s linear infinite;
    }
  `;
  document.head.appendChild(s);
})();

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36", up:"#0e2544",
  b:"rgba(26,53,85,0.8)", bhi:"rgba(42,79,122,0.9)",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", cyan:"#00d4ff",
};

// ── CPT helpers ───────────────────────────────────────────────────────────────
function lacCPT(f) {
  const len  = parseFloat(f.length) || 0;
  const site = f.site_group || "trunk";
  const comp = f.complexity || "simple";
  if (comp === "complex") return "13100-13160 (complex repair — verify site/length)";
  const face = site === "face";
  const hand = site === "hand_foot";
  if (comp === "intermediate") {
    if (face) {
      if (len <= 2.5) return "12051"; if (len <= 5.0) return "12052";
      if (len <= 7.5) return "12053"; if (len <= 12.5) return "12054";
      if (len <= 20)  return "12055"; if (len <= 30)   return "12056";
      return "12057";
    }
    if (hand) {
      if (len <= 2.5) return "12041"; if (len <= 7.5) return "12042";
      if (len <= 12.5) return "12044"; if (len <= 20) return "12045";
      if (len <= 30)   return "12046"; return "12047";
    }
    if (len <= 2.5) return "12031"; if (len <= 7.5) return "12032";
    if (len <= 12.5) return "12034"; if (len <= 20) return "12035";
    if (len <= 30)   return "12036"; return "12037";
  }
  // simple
  if (face) {
    if (len <= 2.5) return "12011"; if (len <= 5.0) return "12013";
    if (len <= 7.5) return "12014"; if (len <= 12.5) return "12015";
    if (len <= 20)  return "12016"; if (len <= 30)   return "12017";
    return "12018";
  }
  if (len <= 2.5) return "12001"; if (len <= 7.5) return "12002";
  if (len <= 12.5) return "12004"; if (len <= 20) return "12005";
  if (len <= 30)   return "12006"; return "12007";
}

function arthroCPT(f) {
  const j = f.joint || "";
  if (/finger|toe|IP|MCP|MTP/i.test(j)) return "20600";
  if (/wrist|elbow|ankle|TMJ/i.test(j))  return "20605";
  return "20610";
}

// ── Procedure data ────────────────────────────────────────────────────────────
const PROCEDURES = [
  // ── 1. Laceration Repair ──────────────────────────────────────────────────
  {
    id:"lac", name:"Laceration Repair", icon:"🪡", color:T.teal,
    cptFn: f => lacCPT(f),
    fields:[
      {id:"indication",    label:"Indication",            type:"text",     placeholder:"e.g. traumatic laceration requiring closure"},
      {id:"consent",       label:"Consent",               type:"select",   options:["Verbal","Written","Implied — emergency","Unable to obtain — reason documented"]},
      {id:"location",      label:"Wound Location",        type:"text",     placeholder:"e.g. left forehead, 2cm above lateral brow"},
      {id:"site_group",    label:"Site Group (for CPT)",  type:"select",   options:["trunk","face","hand_foot","extremity"]},
      {id:"length",        label:"Length",                type:"number",   unit:"cm",  placeholder:"2.5"},
      {id:"depth",         label:"Depth",                 type:"select",   options:["superficial (skin only)","subcutaneous tissue","fascia","muscle"]},
      {id:"complexity",    label:"Complexity",            type:"select",   options:["simple","intermediate","complex"]},
      {id:"contamination", label:"Contamination",         type:"select",   options:["clean","contaminated","grossly contaminated"]},
      {id:"anesthesia",    label:"Anesthesia",            type:"text",     placeholder:"e.g. 1% lidocaine with epinephrine, 3 mL"},
      {id:"prep",          label:"Wound Prep",            type:"text",     placeholder:"e.g. betadine scrub, saline irrigation 200 mL"},
      {id:"closure",       label:"Closure Type",          type:"text",     placeholder:"e.g. 4-0 nylon simple interrupted x6"},
      {id:"dressing",      label:"Dressing Applied",      type:"text",     placeholder:"e.g. bacitracin, non-stick pad, tape"},
      {id:"nv_intact",     label:"Neurovascular Status",  type:"select",   options:["intact distally","deficit noted — see below"]},
      {id:"complications", label:"Complications",         type:"text",     placeholder:"None"},
      {id:"followup",      label:"Follow-up",             type:"text",     placeholder:"e.g. 5-7 days for suture removal"},
    ],
    noteBuilder:(f, meta) => `PROCEDURE NOTE — LACERATION REPAIR
Date/Time: ${meta.ts}
Physician: ${meta.physician}
Patient: ${meta.patient}

PROCEDURE: Laceration Repair  |  CPT: ${lacCPT(f)}
INDICATION: ${f.indication || "[indication]"}
CONSENT: ${f.consent || "verbal"} consent obtained. Risks, benefits, and alternatives including non-closure were discussed.

PROCEDURE:
The patient was placed in a comfortable position. Wound examination revealed a ${f.complexity || "simple"}, ${f.contamination || "clean"} laceration measuring ${f.length || "[length]"} cm in length located at ${f.location || "[location]"}. Wound depth extended to ${f.depth || "subcutaneous tissue"}.

Anesthesia: ${f.anesthesia || "[anesthetic, volume]"} was administered with adequate effect.
Wound preparation: ${f.prep || "Wound irrigated with normal saline and prepped in standard fashion."} Hemostasis achieved.
Closure: ${f.closure || "[closure details]"}. Wound edges well-approximated with good cosmetic result.
Dressing: ${f.dressing || "Standard wound dressing applied."}

POST-PROCEDURE ASSESSMENT:
Neurovascular status distal to repair: ${f.nv_intact || "intact"}. Patient tolerated procedure well without acute distress. Written wound care and return precautions provided. Follow-up: ${f.followup || "5-7 days for suture removal"}.

COMPLICATIONS: ${f.complications || "None"}`,
  },

  // ── 2. Incision & Drainage ────────────────────────────────────────────────
  {
    id:"id_abs", name:"Incision & Drainage", icon:"💉", color:T.coral,
    cptFn: f => f.complexity === "complicated" ? "10061" : "10060",
    fields:[
      {id:"indication",    label:"Indication",            type:"text",   placeholder:"e.g. cutaneous abscess requiring drainage"},
      {id:"consent",       label:"Consent",               type:"select", options:["Verbal","Written","Implied — emergency"]},
      {id:"location",      label:"Abscess Location",      type:"text",   placeholder:"e.g. right gluteal, medial aspect"},
      {id:"size",          label:"Abscess Size",          type:"text",   placeholder:"e.g. 3 x 2 cm fluctuant area"},
      {id:"complexity",    label:"Complexity",            type:"select", options:["simple","complicated"]},
      {id:"anesthesia",    label:"Anesthesia",            type:"text",   placeholder:"e.g. 1% lidocaine field block, 5 mL"},
      {id:"incision",      label:"Incision",              type:"text",   placeholder:"e.g. 1.5 cm linear incision over point of fluctuance"},
      {id:"drainage",      label:"Drainage",              type:"text",   placeholder:"e.g. ~15 mL purulent material expressed, malodorous"},
      {id:"loculations",   label:"Loculations",           type:"select", options:["none — unilocular","present — broken down with hemostat","extensive loculations"]},
      {id:"irrigation",    label:"Wound Irrigation",      type:"text",   placeholder:"e.g. irrigated with 100 mL saline via angiocath"},
      {id:"culture",       label:"Culture Sent",          type:"select", options:["Yes — wound culture sent","No"]},
      {id:"packing",       label:"Packing",               type:"text",   placeholder:"e.g. 0.25-inch iodoform gauze, 6 cm packed loosely"},
      {id:"dressing",      label:"Dressing",              type:"text",   placeholder:"e.g. 4x4 gauze, secured with tape"},
      {id:"abx",           label:"Antibiotics",           type:"text",   placeholder:"e.g. TMP-SMX DS BID x 5 days / none indicated"},
      {id:"complications", label:"Complications",         type:"text",   placeholder:"None"},
      {id:"followup",      label:"Follow-up",             type:"text",   placeholder:"e.g. 48 hours for recheck and packing removal"},
    ],
    noteBuilder:(f, meta) => `PROCEDURE NOTE — INCISION & DRAINAGE
Date/Time: ${meta.ts}
Physician: ${meta.physician}
Patient: ${meta.patient}

PROCEDURE: Incision & Drainage of Abscess  |  CPT: ${f.complexity === "complicated" ? "10061" : "10060"}
INDICATION: ${f.indication || "[indication]"}
CONSENT: ${f.consent || "verbal"} consent obtained. Risks and benefits discussed including recurrence and need for antibiotics.

PROCEDURE:
Location: ${f.location || "[location]"}. Fluctuant area measuring ${f.size || "[size]"} identified on examination.
Anesthesia: ${f.anesthesia || "[anesthetic]"} administered with adequate effect.
Technique: ${f.incision || "[incision details]"} made with #11 blade. ${f.drainage || "[drainage description]"}. Loculations: ${f.loculations || "none identified"}. ${f.irrigation || "Wound irrigated with saline."} Packing: ${f.packing || "[packing details]"}.
Dressing: ${f.dressing || "Standard dressing applied."}
Culture: ${f.culture || "not sent"}.
Antibiotics: ${f.abx || "none indicated at this time"}.

POST-PROCEDURE ASSESSMENT:
Patient tolerated procedure well. Wound care and return precautions provided. Follow-up: ${f.followup || "48 hours for packing removal and wound recheck"}.

COMPLICATIONS: ${f.complications || "None"}`,
  },

  // ── 3. Lumbar Puncture ────────────────────────────────────────────────────
  {
    id:"lp", name:"Lumbar Puncture", icon:"🔬", color:T.purple,
    cptFn: f => f.type === "therapeutic" ? "62272" : "62270",
    fields:[
      {id:"indication",    label:"Indication",             type:"text",   placeholder:"e.g. suspected bacterial meningitis / subarachnoid hemorrhage"},
      {id:"consent",       label:"Consent",                type:"select", options:["Written","Verbal","Implied — emergency","Unable — reason documented"]},
      {id:"type",          label:"Procedure Type",         type:"select", options:["diagnostic","therapeutic"]},
      {id:"position",      label:"Position",               type:"select", options:["lateral decubitus","seated upright"]},
      {id:"level",         label:"Interspace",             type:"select", options:["L3-4","L4-5","L2-3","L5-S1"]},
      {id:"anesthesia",    label:"Local Anesthesia",       type:"text",   placeholder:"e.g. 1% lidocaine, 3 mL subcutaneous and deep"},
      {id:"needle",        label:"Needle",                 type:"text",   placeholder:"e.g. 22-gauge Quincke spinal needle, 3.5 inch"},
      {id:"attempts",      label:"Attempts",               type:"select", options:["1","2","3",">3 — attending notified"]},
      {id:"op",            label:"Opening Pressure",       type:"number", unit:"cmH2O", placeholder:"18"},
      {id:"appearance",    label:"CSF Appearance",         type:"select", options:["clear and colorless","cloudy/turbid","bloody — see xanthochromia","xanthochromic","frankly purulent"]},
      {id:"tubes",         label:"Tubes Collected",        type:"text",   placeholder:"e.g. 4 tubes, 1 mL each — tubes 1 and 4 for RBC comparison"},
      {id:"studies",       label:"CSF Studies Sent",       type:"text",   placeholder:"e.g. cell count, glucose, protein, Gram stain, culture, HSV PCR"},
      {id:"cp",            label:"Closing Pressure",       type:"number", unit:"cmH2O", placeholder:""},
      {id:"complications", label:"Complications",          type:"text",   placeholder:"None — post-LP headache precautions discussed"},
    ],
    noteBuilder:(f, meta) => `PROCEDURE NOTE — LUMBAR PUNCTURE
Date/Time: ${meta.ts}
Physician: ${meta.physician}
Patient: ${meta.patient}

PROCEDURE: Lumbar Puncture (${f.type || "diagnostic"})  |  CPT: ${f.type === "therapeutic" ? "62272" : "62270"}
INDICATION: ${f.indication || "[indication]"}
CONSENT: ${f.consent || "written"} consent obtained. Risks including post-LP headache, bleeding, infection, and rare neurologic injury discussed.

Pre-procedure neurological exam documented. No contraindications identified (no papilledema, no focal deficits, coagulation status acceptable).

PROCEDURE:
Position: ${f.position || "lateral decubitus"} with knees flexed to chest.
Level: ${f.level || "L3-4"} interspace identified by palpation of iliac crests.
Prep: Skin prepped with povidone-iodine in standard fashion and draped sterile.
Anesthesia: ${f.anesthesia || "[local anesthetic]"} administered creating adequate wheal.
Needle: ${f.needle || "22-gauge spinal needle"} advanced with bevel perpendicular to dural fibers.
Attempts: ${f.attempts || "1"}. Stylet removed — CSF observed.
Opening pressure: ${f.op || "[value]"} cmH2O.
CSF appearance: ${f.appearance || "clear and colorless"}.
Tubes collected: ${f.tubes || "[tube details]"}.
Studies sent: ${f.studies || "[studies]"}.
${f.cp ? `Closing pressure: ${f.cp} cmH2O.` : ""}
Stylet replaced and needle withdrawn. Sterile dressing applied.

POST-PROCEDURE:
Patient tolerated procedure well. Instructed to remain supine for 30-60 minutes. Post-LP headache precautions and return instructions provided. Caffeine recommended if headache develops.

COMPLICATIONS: ${f.complications || "None"}`,
  },

  // ── 4. Central Venous Access ──────────────────────────────────────────────
  {
    id:"cvl", name:"Central Line", icon:"🩺", color:T.blue,
    cptFn: f => {
      const age = parseInt(f.patient_age) || 99;
      const site = f.site || "";
      if (age < 5) return "36555";
      if (/femoral/i.test(site)) return "36558";
      return "36556";
    },
    fields:[
      {id:"indication",    label:"Indication",             type:"text",   placeholder:"e.g. vasopressor administration, no peripheral access"},
      {id:"consent",       label:"Consent",                type:"select", options:["Written","Verbal","Implied — emergency","Unable — emergent"]},
      {id:"patient_age",   label:"Patient Age (for CPT)",  type:"number", unit:"years", placeholder:"45"},
      {id:"site",          label:"Access Site",            type:"select", options:["Right internal jugular","Left internal jugular","Right subclavian","Left subclavian","Right femoral","Left femoral"]},
      {id:"guidance",      label:"Guidance",               type:"select", options:["ultrasound — real-time","ultrasound — site marking only","landmark technique"]},
      {id:"position",      label:"Patient Position",       type:"text",   placeholder:"e.g. Trendelenburg, head turned left"},
      {id:"anesthesia",    label:"Local Anesthesia",       type:"text",   placeholder:"e.g. 1% lidocaine, 5 mL"},
      {id:"needle_passes", label:"Needle Passes to Access",type:"select", options:["1","2","3",">3"]},
      {id:"venous_conf",   label:"Venous Confirmation",    type:"select", options:["dark non-pulsatile blood — venous confirmed","ultrasound-confirmed compressible vein","pressure transducer — venous waveform"]},
      {id:"wire",          label:"Wire Passage",           type:"select", options:["smooth and unimpeded","mild resistance — repositioned","ectopy noted — resolved with withdrawal"]},
      {id:"catheter",      label:"Catheter",               type:"text",   placeholder:"e.g. triple-lumen 7Fr, 16 cm, sutured in place"},
      {id:"lumens",        label:"All Lumens",             type:"select", options:["all lumens flush and aspirate freely","proximal only aspirates","distal only aspirates"]},
      {id:"cxr",           label:"Post-procedure CXR",     type:"select", options:["ordered — tip at cavoatrial junction, no pneumothorax","ordered — pending","not applicable (femoral)"]},
      {id:"complications", label:"Complications",          type:"text",   placeholder:"None"},
    ],
    noteBuilder:(f, meta) => {
      const age = parseInt(f.patient_age) || 99;
      const cpt = age < 5 ? "36555" : /femoral/i.test(f.site||"") ? "36558" : "36556";
      return `PROCEDURE NOTE — CENTRAL VENOUS CATHETER PLACEMENT
Date/Time: ${meta.ts}
Physician: ${meta.physician}
Patient: ${meta.patient}

PROCEDURE: Central Venous Access  |  CPT: ${cpt}
INDICATION: ${f.indication || "[indication]"}
CONSENT: ${f.consent || "verbal"} consent obtained. Risks including pneumothorax, arterial puncture, infection, bleeding, and catheter malposition discussed.

PROCEDURE:
Site: ${f.site || "[site]"}. Patient positioned: ${f.position || "[position]"}.
Guidance: ${f.guidance || "ultrasound — real-time"}.
Skin prepped with chlorhexidine-alcohol and draped in full sterile fashion. Operator in sterile gown and gloves, mask, and cap (maximal barrier precautions).
Anesthesia: ${f.anesthesia || "[local anesthetic]"}.
Venous access: achieved after ${f.needle_passes || "1"} needle pass(es). ${f.venous_conf || "Venous position confirmed."} Wire: ${f.wire || "passed smoothly"}. Serial dilation performed. Catheter: ${f.catheter || "[catheter details]"} placed. ${f.lumens || "All lumens aspirate and flush freely."} Catheter secured.

CXR: ${f.cxr || "ordered"}.

POST-PROCEDURE:
Patient tolerated procedure well. Line is functioning. Daily reassessment of continued need documented per protocol.

COMPLICATIONS: ${f.complications || "None"}`;
    },
  },

  // ── 5. Thoracentesis ─────────────────────────────────────────────────────
  {
    id:"thora", name:"Thoracentesis", icon:"🫁", color:T.cyan,
    cptFn: f => f.guidance === "no imaging" ? "32554" : "32555",
    fields:[
      {id:"indication",    label:"Indication",             type:"text",   placeholder:"e.g. diagnostic — bilateral effusions, new fever / therapeutic — symptomatic dyspnea"},
      {id:"consent",       label:"Consent",                type:"select", options:["Written","Verbal","Implied — emergency"]},
      {id:"type",          label:"Procedure Type",         type:"select", options:["diagnostic","therapeutic"]},
      {id:"side",          label:"Side",                   type:"select", options:["right","left","bilateral — staged"]},
      {id:"guidance",      label:"Guidance",               type:"select", options:["ultrasound — real-time","ultrasound — site marking only","no imaging"]},
      {id:"position",      label:"Position",               type:"text",   placeholder:"e.g. seated leaning forward, arms on pillow stand"},
      {id:"level",         label:"Entry Level",            type:"text",   placeholder:"e.g. one interspace below effusion on ultrasound, posterior axillary line"},
      {id:"anesthesia",    label:"Local Anesthesia",       type:"text",   placeholder:"e.g. 1% lidocaine, 10 mL to periosteum of rib"},
      {id:"needle",        label:"Needle/Catheter",        type:"text",   placeholder:"e.g. 8Fr Turkel Safety Thoracentesis System"},
      {id:"appearance",    label:"Fluid Appearance",       type:"select", options:["straw-colored (transudative)","dark yellow/amber","hemorrhagic","milky/chylous","purulent/empyema","sanguineous"]},
      {id:"volume",        label:"Volume Removed",         type:"number", unit:"mL",   placeholder:"500"},
      {id:"studies",       label:"Pleural Studies Sent",   type:"text",   placeholder:"e.g. LDH, protein, pH, cell count, culture, cytology"},
      {id:"cxr",           label:"Post-procedure CXR",     type:"select", options:["ordered — no pneumothorax, residual effusion as expected","ordered — pneumothorax identified","not yet resulted"]},
      {id:"complications", label:"Complications",          type:"text",   placeholder:"None"},
    ],
    noteBuilder:(f, meta) => `PROCEDURE NOTE — THORACENTESIS
Date/Time: ${meta.ts}
Physician: ${meta.physician}
Patient: ${meta.patient}

PROCEDURE: Thoracentesis (${f.type || "diagnostic"})  |  CPT: ${f.guidance === "no imaging" ? "32554" : "32555"}
INDICATION: ${f.indication || "[indication]"}
CONSENT: ${f.consent || "written"} consent obtained. Risks including pneumothorax, bleeding, infection, and re-expansion pulmonary edema discussed.

PROCEDURE:
Side: ${f.side || "[side]"} pleural space. Effusion confirmed on bedside ultrasound prior to procedure.
Position: ${f.position || "seated, leaning forward"}.
Entry site: ${f.level || "[level]"}, over superior aspect of rib to avoid neurovascular bundle.
Guidance: ${f.guidance || "ultrasound — real-time"}.
Skin prepped with chlorhexidine and draped sterile.
Anesthesia: ${f.anesthesia || "[local anesthetic]"}.
Needle/catheter: ${f.needle || "[device]"} advanced into pleural space. Fluid obtained.
Fluid appearance: ${f.appearance || "[appearance]"}.
Volume removed: ${f.volume || "[volume]"} mL.
Studies sent: ${f.studies || "[studies]"}.
Needle removed, sterile dressing applied.

Post-procedure CXR: ${f.cxr || "ordered"}.

POST-PROCEDURE:
Patient tolerated procedure well. Respiratory status improved/stable. Monitored for 1 hour post-procedure.

COMPLICATIONS: ${f.complications || "None"}`,
  },

  // ── 6. Arthrocentesis ────────────────────────────────────────────────────
  {
    id:"arthro", name:"Arthrocentesis", icon:"🦴", color:T.gold,
    cptFn: f => arthroCPT(f),
    fields:[
      {id:"indication",    label:"Indication",             type:"text",   placeholder:"e.g. suspected septic arthritis / acute gout / diagnostic"},
      {id:"consent",       label:"Consent",                type:"select", options:["Verbal","Written"]},
      {id:"joint",         label:"Joint",                  type:"text",   placeholder:"e.g. right knee, left wrist, right MTP"},
      {id:"approach",      label:"Approach",               type:"text",   placeholder:"e.g. medial parapatellar, lateral parapatellar"},
      {id:"guidance",      label:"Guidance",               type:"select", options:["landmark technique","ultrasound-guided"]},
      {id:"anesthesia",    label:"Anesthesia",             type:"text",   placeholder:"e.g. skin wheal 1% lidocaine; no intra-articular anesthetic (crystal study pending)"},
      {id:"aspiration",    label:"Aspiration",             type:"text",   placeholder:"e.g. 15 mL straw-colored fluid aspirated / unable to aspirate"},
      {id:"synovial",      label:"Synovial Fluid Appearance", type:"select", options:["clear/straw-colored (normal)","yellow, cloudy (inflammatory)","frankly purulent (septic)","hemorrhagic (trauma/coagulopathy)","chalky white (tophaceous gout)"]},
      {id:"studies",       label:"Fluid Studies Sent",     type:"text",   placeholder:"e.g. cell count, crystal analysis, Gram stain, culture, glucose, LDH"},
      {id:"injection",     label:"Joint Injection",        type:"text",   placeholder:"e.g. methylprednisolone 40 mg + 2 mL lidocaine 1% injected / none — septic arthritis suspected"},
      {id:"complications", label:"Complications",          type:"text",   placeholder:"None"},
      {id:"followup",      label:"Follow-up",              type:"text",   placeholder:"e.g. culture results in 48h, orthopedics if cell count suggestive of septic joint"},
    ],
    noteBuilder:(f, meta) => `PROCEDURE NOTE — ARTHROCENTESIS
Date/Time: ${meta.ts}
Physician: ${meta.physician}
Patient: ${meta.patient}

PROCEDURE: Arthrocentesis  |  CPT: ${arthroCPT(f)}
INDICATION: ${f.indication || "[indication]"}
CONSENT: ${f.consent || "verbal"} consent obtained. Risks including infection, bleeding, and cartilage injury discussed.

PROCEDURE:
Joint: ${f.joint || "[joint]"}.
Approach: ${f.approach || "[approach]"}.
Guidance: ${f.guidance || "landmark technique"}.
Skin prepped with chlorhexidine. ${f.anesthesia || "Local anesthesia administered."}
Aspiration: ${f.aspiration || "[aspiration result]"}.
Fluid appearance: ${f.synovial || "[appearance]"}.
Studies sent: ${f.studies || "[studies]"}.
${f.injection ? `Injection: ${f.injection}.` : "No injection performed."}
Sterile dressing applied. Joint moved through range of motion — tolerated well.

POST-PROCEDURE:
Patient tolerated procedure well. Ice and rest advised. ${f.followup || "[follow-up plan]"}.

COMPLICATIONS: ${f.complications || "None"}`,
  },

  // ── 7. Endotracheal Intubation ────────────────────────────────────────────
  {
    id:"ett", name:"Intubation (RSI)", icon:"😮", color:T.orange,
    cptFn: () => "31500",
    fields:[
      {id:"indication",    label:"Indication",             type:"text",   placeholder:"e.g. hypoxic respiratory failure, GCS 6, airway protection"},
      {id:"consent",       label:"Consent",                type:"select", options:["Implied — emergency / altered mental status","Verbal — patient awake","Written"]},
      {id:"preoxygenation",label:"Pre-oxygenation",        type:"text",   placeholder:"e.g. 15 LPM NRB x 3 min, SpO2 99%; BVM x 2 min with OPA"},
      {id:"induction",     label:"Induction Agent",        type:"text",   placeholder:"e.g. ketamine 200 mg IV (2 mg/kg)"},
      {id:"paralytic",     label:"Paralytic",              type:"text",   placeholder:"e.g. succinylcholine 160 mg IV (1.5 mg/kg)"},
      {id:"pretreatment",  label:"Pre-treatment Agents",   type:"text",   placeholder:"e.g. fentanyl 100 mcg IV, lidocaine 100 mg IV / none"},
      {id:"blade",         label:"Laryngoscope",           type:"text",   placeholder:"e.g. video laryngoscope (GlideScope), Mac 4 blade"},
      {id:"view",          label:"Cormack-Lehane Grade",   type:"select", options:["Grade I — full glottis visible","Grade II — partial arytenoids visible","Grade III — epiglottis only","Grade IV — no laryngeal structures"]},
      {id:"attempts",      label:"Intubation Attempts",    type:"select", options:["1","2 — first attempt unsuccessful (reason documented)","3 — backup plan initiated"]},
      {id:"stylet",        label:"Adjuncts Used",          type:"text",   placeholder:"e.g. bougie, BURP maneuver, shoulder roll / none"},
      {id:"tube",          label:"ETT Size and Depth",     type:"text",   placeholder:"e.g. 7.5 cuffed ETT, 23 cm at lip, cuff inflated to 25 cmH2O"},
      {id:"confirmation",  label:"Position Confirmation",  type:"text",   placeholder:"e.g. ETCO2 waveform positive, bilateral BS equal, CXR ordered — tip 3 cm above carina"},
      {id:"post_settings", label:"Initial Vent Settings",  type:"text",   placeholder:"e.g. AC/VC: TV 420 mL (6 mL/kg IBW), RR 16, FiO2 100%, PEEP 5"},
      {id:"complications", label:"Complications",          type:"text",   placeholder:"None — SpO2 maintained throughout"},
    ],
    noteBuilder:(f, meta) => `PROCEDURE NOTE — ENDOTRACHEAL INTUBATION
Date/Time: ${meta.ts}
Physician: ${meta.physician}
Patient: ${meta.patient}

PROCEDURE: Endotracheal Intubation (Rapid Sequence Intubation)  |  CPT: 31500
INDICATION: ${f.indication || "[indication]"}
CONSENT: ${f.consent || "implied emergency consent"}

PRE-PROCEDURE:
Pre-oxygenation: ${f.preoxygenation || "[pre-oxygenation]"}.
Difficult airway assessment performed. Backup airway plan established. Surgical airway kit at bedside.

MEDICATIONS:
Pre-treatment: ${f.pretreatment || "none"}.
Induction agent: ${f.induction || "[induction agent, dose]"}.
Paralytic: ${f.paralytic || "[paralytic, dose]"}.

PROCEDURE:
Laryngoscopy: ${f.blade || "[laryngoscope]"}.
View: ${f.view || "Cormack-Lehane [grade]"}.
Attempts: ${f.attempts || "1"}.
${f.stylet ? `Adjuncts used: ${f.stylet}.` : ""}
Tube: ${f.tube || "[ETT size and depth]"}.
Position confirmed: ${f.confirmation || "[confirmation method]"}.

VENTILATOR SETTINGS:
${f.post_settings || "[initial vent settings]"}.

POST-PROCEDURE:
Patient intubated and mechanically ventilated. Hemodynamics stable. Sedation and analgesia initiated. Restraints applied per protocol.

COMPLICATIONS: ${f.complications || "None"}`,
  },

  // ── 8. Chest Tube ────────────────────────────────────────────────────────
  {
    id:"ct", name:"Chest Tube", icon:"🫀", color:T.coral,
    cptFn: () => "32551",
    fields:[
      {id:"indication",    label:"Indication",             type:"text",   placeholder:"e.g. large pneumothorax / hemothorax / empyema"},
      {id:"consent",       label:"Consent",                type:"select", options:["Written","Verbal","Implied — emergency"]},
      {id:"side",          label:"Side",                   type:"select", options:["right","left"]},
      {id:"position",      label:"Patient Position",       type:"text",   placeholder:"e.g. supine, arm abducted and hand behind head"},
      {id:"site",          label:"Entry Site",             type:"text",   placeholder:"e.g. 4th-5th ICS, anterior axillary line"},
      {id:"guidance",      label:"Guidance",               type:"select", options:["ultrasound — site confirmed","landmark technique","fluoroscopy-guided"]},
      {id:"anesthesia",    label:"Anesthesia",             type:"text",   placeholder:"e.g. 1% lidocaine 10 mL — skin, subcutaneous, rib periosteum, parietal pleura"},
      {id:"tube_size",     label:"Tube Size",              type:"text",   placeholder:"e.g. 28 Fr thoracostomy tube"},
      {id:"technique",     label:"Technique",              type:"select", options:["blunt dissection — standard thoracostomy","Seldinger technique — small-bore pigtail","finger thoracostomy (emergency — no tube placed yet)"]},
      {id:"drainage",      label:"Initial Drainage",       type:"text",   placeholder:"e.g. 400 mL serosanguineous fluid, air rush on entry"},
      {id:"position_conf", label:"Tube Position",          type:"text",   placeholder:"e.g. 4 cm inserted past last hole, directed posteriorly and apically"},
      {id:"suction",       label:"Connected To",           type:"select", options:["water seal — -20 cmH2O suction","water seal only","Heimlich valve (outpatient)"]},
      {id:"cxr",           label:"Post-procedure CXR",     type:"select", options:["ordered — tube in good position, lung re-expanding","ordered — pending","pneumothorax expanding — troubleshooting initiated"]},
      {id:"complications", label:"Complications",          type:"text",   placeholder:"None"},
    ],
    noteBuilder:(f, meta) => `PROCEDURE NOTE — CHEST TUBE THORACOSTOMY
Date/Time: ${meta.ts}
Physician: ${meta.physician}
Patient: ${meta.patient}

PROCEDURE: Tube Thoracostomy  |  CPT: 32551
INDICATION: ${f.indication || "[indication]"}
CONSENT: ${f.consent || "verbal"} consent obtained. Risks including bleeding, infection, lung injury, and tube malposition discussed.

PROCEDURE:
Side: ${f.side || "[side]"}. Pathology confirmed on imaging prior to procedure.
Position: ${f.position || "[position]"}.
Entry site: ${f.site || "[site]"}.
Guidance: ${f.guidance || "landmark technique"}.
Prep: Skin prepped with chlorhexidine-alcohol and draped widely in sterile fashion.
Anesthesia: ${f.anesthesia || "[local anesthetic]"} to skin, subcutaneous tissue, rib periosteum, and parietal pleura.
Technique: ${f.technique || "Blunt dissection through chest wall into pleural space. Finger-sweep confirmed no adhesions in tract."}
Tube: ${f.tube_size || "[tube size]"} placed. Initial drainage: ${f.drainage || "[drainage]"}.
Position: ${f.position_conf || "[tube position]"}.
Tube connected to: ${f.suction || "water seal at -20 cmH2O suction"}.
Secured with 0-silk suture and petroleum gauze dressing.

CXR: ${f.cxr || "ordered"}.

POST-PROCEDURE:
Patient tolerated procedure well. Hemodynamics stable. Drainage system functioning. Tube output monitored per protocol.

COMPLICATIONS: ${f.complications || "None"}`,
  },

  // ── 9. Paracentesis ──────────────────────────────────────────────────────
  {
    id:"para", name:"Paracentesis", icon:"🫃", color:T.green,
    cptFn: f => f.guidance === "no imaging" ? "49082" : "49083",
    fields:[
      {id:"indication",    label:"Indication",             type:"text",   placeholder:"e.g. diagnostic — new ascites / therapeutic — respiratory compromise"},
      {id:"consent",       label:"Consent",                type:"select", options:["Written","Verbal"]},
      {id:"type",          label:"Procedure Type",         type:"select", options:["diagnostic","large-volume therapeutic"]},
      {id:"site",          label:"Entry Site",             type:"select", options:["left lower quadrant (LLQ)","right lower quadrant (RLQ)","midline infraumbilical","flank"]},
      {id:"guidance",      label:"Guidance",               type:"select", options:["ultrasound — real-time","ultrasound — site marking","no imaging"]},
      {id:"anesthesia",    label:"Local Anesthesia",       type:"text",   placeholder:"e.g. 1% lidocaine, 5 mL skin and deep track"},
      {id:"needle",        label:"Needle/Catheter",        type:"text",   placeholder:"e.g. 15-gauge Caldwell-type paracentesis needle with 5 Fr pigtail catheter"},
      {id:"appearance",    label:"Fluid Appearance",       type:"select", options:["clear straw-colored (transudative)","turbid/cloudy (exudative/SBP)","bile-stained","frankly bloody","chylous (milky)"]},
      {id:"volume",        label:"Volume Removed",         type:"number", unit:"mL", placeholder:"4000"},
      {id:"studies",       label:"Fluid Studies Sent",     type:"text",   placeholder:"e.g. cell count, albumin, protein, culture in blood culture bottles, cytology"},
      {id:"albumin",       label:"Albumin Replacement",    type:"text",   placeholder:"e.g. 25% albumin 50 g IV (8 g per liter removed) / not indicated — diagnostic tap"},
      {id:"complications", label:"Complications",          type:"text",   placeholder:"None"},
    ],
    noteBuilder:(f, meta) => `PROCEDURE NOTE — PARACENTESIS
Date/Time: ${meta.ts}
Physician: ${meta.physician}
Patient: ${meta.patient}

PROCEDURE: Paracentesis (${f.type || "diagnostic"})  |  CPT: ${f.guidance === "no imaging" ? "49082" : "49083"}
INDICATION: ${f.indication || "[indication]"}
CONSENT: ${f.consent || "written"} consent obtained. Risks including bleeding, infection, bowel perforation, and fluid leak discussed.

PROCEDURE:
Site: ${f.site || "[site]"}, away from surgical scars and superficial vessels. Ascites confirmed by bedside ultrasound. Guidance: ${f.guidance || "ultrasound — real-time"}.
Skin prepped with chlorhexidine and draped sterile.
Anesthesia: ${f.anesthesia || "[local anesthetic]"}.
Catheter: ${f.needle || "[needle/catheter]"} inserted using Z-track technique.
Fluid appearance: ${f.appearance || "[appearance]"}.
Volume removed: ${f.volume || "[volume]"} mL.
Studies sent: ${f.studies || "[studies]"}.
Catheter removed, sterile dressing applied.
Albumin replacement: ${f.albumin || "not required — diagnostic tap"}.

POST-PROCEDURE:
Patient tolerated procedure well. Entry site hemostatic. Vital signs stable throughout.

COMPLICATIONS: ${f.complications || "None"}`,
  },

  // ── 10. Foley Catheterization ─────────────────────────────────────────────
  {
    id:"foley", name:"Foley Catheterization", icon:"💧", color:T.blue,
    cptFn: () => "51702",
    fields:[
      {id:"indication",    label:"Indication",             type:"text",   placeholder:"e.g. urinary retention, 800 mL PVR on bedside ultrasound"},
      {id:"consent",       label:"Consent",                type:"select", options:["Verbal","Unable — altered"]},
      {id:"size",          label:"Catheter Size",          type:"select", options:["14 Fr","16 Fr","18 Fr","20 Fr","22 Fr","24 Fr Coude"]},
      {id:"balloon",       label:"Balloon Inflated",       type:"select", options:["10 mL — standard","5 mL — pediatric","30 mL — hemostasis"]},
      {id:"difficulty",    label:"Insertion",              type:"select", options:["routine — single pass","mild resistance — gentle pressure applied","difficult — Coude tip required","difficult — urology consulted"]},
      {id:"return",        label:"Initial Return",         type:"text",   placeholder:"e.g. 650 mL clear yellow urine; immediate large volume clear return"},
      {id:"urine_color",   label:"Urine Appearance",       type:"select", options:["clear yellow","cloudy/pyuria","frank hematuria","tea-colored","concentrated/amber"]},
      {id:"ua_sent",       label:"UA / Culture",           type:"select", options:["UA and culture sent","UA only sent","not indicated"]},
      {id:"secured",       label:"Secured and Connected",  type:"text",   placeholder:"e.g. secured to thigh, connected to closed drainage system"},
      {id:"complications", label:"Complications",          type:"text",   placeholder:"None"},
    ],
    noteBuilder:(f, meta) => `PROCEDURE NOTE — URINARY CATHETERIZATION
Date/Time: ${meta.ts}
Physician: ${meta.physician}
Patient: ${meta.patient}

PROCEDURE: Urethral Catheterization (Foley)  |  CPT: 51702
INDICATION: ${f.indication || "[indication]"}
CONSENT: ${f.consent || "verbal"} consent obtained. Risks including infection, trauma, and balloon complications explained.

PROCEDURE:
Standard sterile technique employed. Perineum prepped with betadine.
Catheter: ${f.size || "16 Fr"} urethral catheter inserted.
Insertion: ${f.difficulty || "routine single pass"}.
Balloon: ${f.balloon || "10 mL balloon"} inflated without resistance and catheter gently retracted to confirm position in bladder.
Initial return: ${f.return || "[return description]"}.
Urine appearance: ${f.urine_color || "clear yellow"}.
Catheter: ${f.secured || "secured to thigh and connected to closed drainage system"}.
UA/Culture: ${f.ua_sent || "sent per protocol"}.

POST-PROCEDURE:
Patient comfortable. Drainage system patent and functioning. Daily reassessment of catheter necessity per protocol.

COMPLICATIONS: ${f.complications || "None"}`,
  },
];

// ── Field renderer ────────────────────────────────────────────────────────────
function FieldInput({ def, value, onChange }) {
  const base = {
    width:"100%",
    background:"rgba(14,37,68,0.75)",
    border:`1px solid ${value ? "rgba(42,122,160,0.5)" : "rgba(26,53,85,0.4)"}`,
    borderRadius:7, outline:"none",
    fontFamily:"'DM Sans',sans-serif", fontSize:12,
    color:T.txt, transition:"border-color .1s",
  };

  if (def.type === "select") {
    return (
      <div style={{ position:"relative" }}>
        <select value={value || ""} onChange={e => onChange(e.target.value)}
          style={{ ...base, padding:"7px 28px 7px 10px",
            appearance:"none", WebkitAppearance:"none", cursor:"pointer",
            color: value ? T.txt : T.txt4 }}>
          <option value="">— select —</option>
          {def.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <span style={{ position:"absolute", right:10, top:"50%",
          transform:"translateY(-50%)", color:T.txt4,
          fontSize:9, pointerEvents:"none" }}>▼</span>
      </div>
    );
  }
  if (def.type === "textarea") {
    return (
      <textarea value={value || ""} onChange={e => onChange(e.target.value)}
        placeholder={def.placeholder || ""}
        rows={2}
        style={{ ...base, padding:"7px 10px", resize:"vertical", lineHeight:1.55 }} />
    );
  }
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <input type={def.type === "number" ? "number" : "text"}
        value={value || ""} onChange={e => onChange(e.target.value)}
        placeholder={def.placeholder || ""}
        style={{ ...base, flex:1, padding:"7px 10px" }} />
      {def.unit && (
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:T.txt4, flexShrink:0, letterSpacing:1 }}>{def.unit}</span>
      )}
    </div>
  );
}

// ── Procedure picker card ─────────────────────────────────────────────────────
function ProcCard({ proc, onSelect }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={() => onSelect(proc.id)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display:"flex", flexDirection:"column", alignItems:"flex-start",
        gap:5, padding:"12px 14px",
        background: hover
          ? `linear-gradient(135deg,${proc.color}18,rgba(8,22,40,0.95))`
          : "rgba(8,22,40,0.7)",
        border:`1px solid ${hover ? proc.color+"66" : "rgba(26,53,85,0.4)"}`,
        borderTop:`3px solid ${proc.color}`,
        borderRadius:10, cursor:"pointer", textAlign:"left",
        transition:"all .15s" }}>
      <span style={{ fontSize:22 }}>{proc.icon}</span>
      <div>
        <div style={{ fontFamily:"'Playfair Display',serif",
          fontWeight:700, fontSize:13, color:proc.color }}>{proc.name}</div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.txt4, letterSpacing:1, marginTop:2 }}>CPT auto-code</div>
      </div>
    </button>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function EDProcedureNotes({
  embedded = false,
  patientName = "",
  patientAllergies = "",
  physicianName = "",
}) {
  const [activeId,  setActiveId]  = useState(null);
  const [fields,    setFields]    = useState({});
  const [note,      setNote]      = useState("");
  const [copied,    setCopied]    = useState(false);
  const [showNote,  setShowNote]  = useState(false);

  const proc = PROCEDURES.find(p => p.id === activeId) || null;
  const cpt  = proc ? proc.cptFn(fields) : "";

  const setField = useCallback((id, val) => {
    setFields(p => ({ ...p, [id]:val }));
    setNote("");
    setShowNote(false);
  }, []);

  const handleSelect = useCallback((id) => {
    setActiveId(id);
    setFields({});
    setNote("");
    setShowNote(false);
  }, []);

  const buildNote = useCallback(() => {
    if (!proc) return;
    const meta = {
      ts: new Date().toLocaleString("en-US", {
        month:"2-digit", day:"2-digit", year:"numeric",
        hour:"2-digit", minute:"2-digit", hour12:false
      }),
      physician: physicianName || "[Physician]",
      patient:   patientName   || "[Patient]",
    };
    const built = proc.noteBuilder(fields, meta);
    setNote(built);
    setShowNote(true);
  }, [proc, fields, physicianName, patientName]);

  const copyNote = useCallback(() => {
    if (!note) return;
    navigator.clipboard.writeText(note).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [note]);

  const ts = new Date().toLocaleString("en-US", {
    month:"2-digit", day:"2-digit", year:"numeric",
    hour:"2-digit", minute:"2-digit", hour12:false,
  });

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",
      background: embedded ? "transparent" : T.bg,
      minHeight: embedded ? "auto" : "100vh",
      color:T.txt, padding: embedded ? "0" : "0 16px" }}>

      <div style={{ maxWidth:1100, margin:"0 auto",
        padding: embedded ? "0" : "18px 0 40px" }}>

        {/* Header — standalone only */}
        {!embedded && (
          <div style={{ marginBottom:18 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <div style={{ background:"rgba(5,15,30,0.9)",
                border:"1px solid rgba(42,79,122,0.6)",
                borderRadius:10, padding:"5px 12px",
                display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.purple, letterSpacing:3 }}>NOTRYA</span>
                <span style={{ color:T.txt4, fontFamily:"'JetBrains Mono',monospace", fontSize:10 }}>/</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, color:T.txt3, letterSpacing:2 }}>PROCEDURES</span>
              </div>
              <div style={{ height:1, flex:1,
                background:"linear-gradient(90deg,rgba(255,159,67,0.5),transparent)" }} />
            </div>
            <h1 className="shimmer-text"
              style={{ fontFamily:"'Playfair Display',serif",
                fontSize:"clamp(22px,4vw,36px)", fontWeight:900,
                letterSpacing:-0.5, lineHeight:1.1 }}>
              Procedure Note Builder
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:T.txt4, marginTop:4 }}>
              10 ED Procedures · Structured Documentation · CPT Auto-Code · Formatted Note Export
            </p>
          </div>
        )}

        {/* Embedded subheader */}
        {embedded && (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
            <span style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:16, color:T.orange }}>
              Procedure Note Builder
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:8, color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
              background:"rgba(255,159,67,0.1)",
              border:"1px solid rgba(255,159,67,0.25)",
              borderRadius:4, padding:"2px 7px" }}>
              10 procedures
            </span>
            {patientName && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:9, color:T.txt4, marginLeft:"auto" }}>
                {patientName}
              </span>
            )}
          </div>
        )}

        {/* Stat strip */}
        {!activeId && (
          <div style={{ display:"grid",
            gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",
            gap:8, marginBottom:16 }}>
            {[
              {v:"10", l:"Procedures", c:T.orange},
              {v:"CPT", l:"Auto-Coded", c:T.teal},
              {v:"Full", l:"Note Templates", c:T.purple},
              {v:"1-click", l:"Copy to Chart", c:T.green},
            ].map(b => (
              <div key={b.l} style={{ padding:"8px 12px",
                background:`linear-gradient(135deg,${b.c}12,rgba(8,22,40,0.8))`,
                border:`1px solid ${b.c}28`,
                borderLeft:`3px solid ${b.c}`, borderRadius:9 }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:14, fontWeight:700, color:b.c }}>{b.v}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif",
                  fontSize:10, color:T.txt3, marginTop:2 }}>{b.l}</div>
              </div>
            ))}
          </div>
        )}

        {/* Procedure picker */}
        {!activeId && (
          <div className="proc-fade">
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
              marginBottom:10 }}>
              Select Procedure to Begin Documentation
            </div>
            <div style={{ display:"grid",
              gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:8 }}>
              {PROCEDURES.map(p => (
                <ProcCard key={p.id} proc={p} onSelect={handleSelect} />
              ))}
            </div>
          </div>
        )}

        {/* Active procedure form */}
        {proc && (
          <div className="proc-fade">
            {/* Header bar */}
            <div style={{ display:"flex", alignItems:"center", gap:10,
              marginBottom:14, flexWrap:"wrap" }}>
              <button onClick={() => setActiveId(null)}
                style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                  fontWeight:600, padding:"5px 12px", borderRadius:8,
                  cursor:"pointer",
                  border:"1px solid rgba(42,79,122,0.4)",
                  background:"rgba(14,37,68,0.7)", color:T.txt4 }}>
                Back
              </button>
              <span style={{ fontSize:22 }}>{proc.icon}</span>
              <div style={{ flex:1 }}>
                <span style={{ fontFamily:"'Playfair Display',serif",
                  fontWeight:700, fontSize:16, color:proc.color }}>
                  {proc.name}
                </span>
              </div>
              {/* CPT live display */}
              <div style={{ padding:"5px 12px",
                background:`${proc.color}12`,
                border:`1px solid ${proc.color}35`,
                borderRadius:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:8, color:proc.color, letterSpacing:1,
                  textTransform:"uppercase" }}>CPT </span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:12, fontWeight:700, color:proc.color }}>
                  {cpt || "—"}
                </span>
              </div>
            </div>

            {/* Meta strip */}
            <div style={{ display:"flex", gap:16, flexWrap:"wrap",
              padding:"7px 12px", borderRadius:8, marginBottom:14,
              background:"rgba(8,22,40,0.6)",
              border:"1px solid rgba(26,53,85,0.35)",
              fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4 }}>
              <span>Time: {ts}</span>
              {patientName    && <span>Patient: {patientName}</span>}
              {physicianName  && <span>MD: {physicianName}</span>}
              {patientAllergies && (
                <span style={{ color:T.coral }}>Allergies: {patientAllergies}</span>
              )}
            </div>

            {/* Fields grid */}
            <div style={{ display:"grid",
              gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",
              gap:10, marginBottom:14 }}>
              {proc.fields.map(def => (
                <div key={def.id}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
                    marginBottom:4 }}>
                    {def.label}
                  </div>
                  <FieldInput
                    def={def}
                    value={fields[def.id] || ""}
                    onChange={v => setField(def.id, v)}
                  />
                </div>
              ))}
            </div>

            {/* Build note button */}
            <div style={{ display:"flex", gap:8, alignItems:"center",
              marginBottom:14 }}>
              <button onClick={buildNote}
                style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700,
                  fontSize:13, padding:"10px 26px", borderRadius:10,
                  cursor:"pointer",
                  border:`1px solid ${proc.color}77`,
                  background:`linear-gradient(135deg,${proc.color}22,${proc.color}08)`,
                  color:proc.color, transition:"all .15s" }}>
                Build Procedure Note
              </button>
              {note && (
                <button onClick={copyNote}
                  style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                    fontSize:12, padding:"10px 20px", borderRadius:10,
                    cursor:"pointer", transition:"all .15s",
                    border:`1px solid ${copied ? T.green+"77" : "rgba(42,79,122,0.4)"}`,
                    background: copied ? "rgba(61,255,160,0.1)" : "rgba(42,79,122,0.15)",
                    color: copied ? T.green : T.txt3 }}>
                  {copied ? "Copied!" : "Copy Note"}
                </button>
              )}
              {note && (
                <button onClick={() => setShowNote(p => !p)}
                  style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                    padding:"10px 14px", borderRadius:10, cursor:"pointer",
                    border:"1px solid rgba(42,79,122,0.35)",
                    background:"transparent", color:T.txt4,
                    letterSpacing:1, textTransform:"uppercase" }}>
                  {showNote ? "Hide" : "Show"} Note
                </button>
              )}
            </div>

            {/* Note output */}
            {note && showNote && (
              <div className="proc-fade">
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:T.teal, letterSpacing:1.5, textTransform:"uppercase",
                  marginBottom:6 }}>
                  Formatted Procedure Note — Copy to Chart
                </div>
                <pre style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11,
                  color:T.txt2, lineHeight:1.7,
                  background:"rgba(5,15,30,0.9)",
                  border:"1px solid rgba(42,79,122,0.4)",
                  borderRadius:10, padding:"14px 16px",
                  whiteSpace:"pre-wrap", wordBreak:"break-word",
                  overflowY:"auto", maxHeight:520 }}>
                  {note}
                </pre>
                <div style={{ marginTop:6,
                  fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:"rgba(42,79,122,0.55)", letterSpacing:1 }}>
                  NOTRYA PROCEDURE NOTES — VERIFY ALL ENTRIES BEFORE SIGNING — CPT CODES REQUIRE ATTENDING CONFIRMATION
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}