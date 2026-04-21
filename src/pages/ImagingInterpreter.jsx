// ImagingInterpreter.jsx  v3
// Evidence-based upgrades (literature review):
//   1. Anti-Satisfaction-of-Search prompting     6. PE risk stratification (massive/submassive/low)
//   2. Alliterative / anchoring bias guard       7. Stroke time-window flag (tPA/thrombectomy)
//   3. AI confidence flagging per finding        8. CT scout image reminder
//   4. Expanded X-ray don't-miss checklist       9. ACR Appropriateness Criteria alignment
//   5. Incidental findings tracker + follow-up  10. Fatigue flag (5 pm–7 am shift alert)

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

// ─── STYLE INJECTION ──────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("img3-css")) return;
  const s = document.createElement("style"); s.id = "img3-css";
  s.textContent = `
    :root{
      --img-bg:#050f1e;--img-panel:#081628;--img-card:#0b1e36;
      --img-txt:#f2f7ff;--img-txt2:#b8d4f0;--img-txt3:#82aece;--img-txt4:#5a82a8;
      --img-teal:#00e5c0;--img-gold:#f5c842;--img-coral:#ff6b6b;--img-blue:#3b9eff;
      --img-orange:#ff9f43;--img-purple:#9b6dff;--img-green:#3dffa0;--img-red:#ff4444;
      --img-bd:rgba(42,79,122,0.4);--img-up:rgba(14,37,68,0.75);
    }
    @keyframes img3fade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
    .img3-fade{animation:img3fade .18s ease both}
    @keyframes img3shim{0%{background-position:-200% center}100%{background-position:200% center}}
    .img3-shim{
      background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#9b6dff 52%,#3b9eff 72%,#e8f0fe 100%);
      background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;animation:img3shim 5s linear infinite
    }
    .img3-opt{
      padding:5px 11px;border-radius:7px;cursor:pointer;transition:all .13s;
      font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;
      background:rgba(14,37,68,.6);border:1px solid rgba(42,79,122,.3);color:var(--img-txt4)
    }
    .img3-opt.on{border-color:rgba(0,229,192,.5);background:rgba(0,229,192,.1);color:var(--img-teal);font-weight:700}
    .img3-opt:focus{outline:2px solid var(--img-teal);outline-offset:1px}
    .img3-ti{
      background:var(--img-up);border:1px solid var(--img-bd);border-radius:8px;
      padding:8px 10px;color:var(--img-txt);font-family:'JetBrains Mono',monospace;
      font-size:11px;outline:none;width:100%;box-sizing:border-box;transition:border-color .15s
    }
    .img3-ti:focus{border-color:rgba(0,229,192,.5)}
    @media print{
      .no-print{display:none!important}
      body{background:#fff!important}
      .print-target{color:#111!important;background:#fff!important;padding:20px}
      .print-target *{color:#111!important;background:transparent!important;border-color:#ccc!important}
    }
  `;
  document.head.appendChild(s);
  if (!document.getElementById("img3-fonts")) {
    const l = document.createElement("link"); l.id = "img3-fonts"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
    document.head.appendChild(l);
  }
})();

// ─── SHARED PROMPT STRINGS (Recs 1, 2, 3, 5, 8, 9) ───────────────────────────
const SYS_PRE = `COGNITIVE BIAS PREVENTION — apply before generating output:
1. ANTI-SATISFACTION-OF-SEARCH (causes 22% of all diagnostic errors): After identifying the primary finding, conduct a mandatory second systematic pass of ALL finding sections. Do NOT reduce vigilance once the first abnormality is found. Explicitly identify co-existing pathology.
2. ALLITERATIVE / ANCHORING BIAS: Derive your assessment independently from the body of the report findings. Evaluate whether findings in the body support or CONTRADICT the radiologist's impression. Flag any discordance in critical_findings.
3. FRAMING BIAS: Identify clinically relevant findings beyond the stated clinical question in the report header.
4. CONFIDENCE PER FINDING: For every item in key_findings, assign a confidence field: "high" = clearly and directly stated; "moderate" = implied or indirect language; "low" = inferred, uncertain, or based on ambiguous/hedging language ("possible","cannot exclude","may represent").`;

const SYS_SUF = `
INCIDENTALS (Rec 5): Include incidentals_requiring_followup array for ANY finding requiring outpatient follow-up. Schema: [{finding, recommendation, urgency ("routine"|"soon"|"urgent"), guideline}]. Apply Fleischner Society 2017 for pulmonary nodules; ACR Bosniak 2019 for renal cysts; ACR LI-RADS for hepatic lesions in known cirrhosis; ACR whitepaper for adrenal incidentalomas (>4 cm or suspicious features = surgery referral).
ACR ALIGNMENT (Rec 9): In further_imaging, explicitly reference ACR Appropriateness Criteria or relevant society guidelines where applicable. Examples: "ACR AC: MRI wrist 'Usually Appropriate' for suspected occult scaphoid — obtain within 72h"; "Fleischner: 6-8mm solid nodule in high-risk patient — CT chest in 6-12 months".
Respond ONLY in valid JSON, no markdown fences.`;

const SYS_SCOUT = `
SCOUT IMAGE (Rec 8): Note that the CT scout/topogram must be reviewed independently — cervical spine fractures, rib fractures, and pathology outside the primary field of view are commonly identified on scout alone and are a documented source of missed diagnoses. Include scout_reviewed in dont_miss_checklist.`;

// ─── PANEL DEFINITIONS ────────────────────────────────────────────────────────
const o = (key, label, opts) => ({ key, label, type:"opts", opts });
const t = (key, label, ph)   => ({ key, label, type:"text", ph });

const PANELS = [
  {
    id:"cxr", label:"Chest X-Ray", short:"CXR", icon:"🫁", color:"#3b9eff",
    ph:"Paste CXR report — include Findings and Impression sections...",
    sf:[
      o("lungs",   "Lungs",              ["Clear bilaterally","R opacification","L opacification","Bilateral infiltrates","R effusion","L effusion","R pneumothorax","L pneumothorax","Pulmonary edema","Bilateral effusions"]),
      o("cardiac", "Cardiac silhouette", ["Normal","Borderline enlarged","Cardiomegaly"]),
      o("medias",  "Mediastinum",        ["Normal","Widened","Pneumomediastinum"]),
      o("bones",   "Bones / Ribs",       ["Intact","R rib fracture","L rib fracture","Multiple rib fractures","Clavicle fracture","Vertebral abnormality"]),
      t("lines",   "Lines / Tubes",      "ETT at _cm, CVC tip in SVC, NGT, etc."),
      t("imp",     "Impression",         "IMPRESSION: "),
    ],
    sys:`${SYS_PRE}

You are an ED physician interpreting a chest X-ray for immediate management. Include dont_miss_checklist keys: pneumothorax, hemothorax, pneumonia, pulmonary_edema, pleural_effusion, pneumomediastinum, widened_mediastinum, cardiomegaly, free_air_under_diaphragm, endotracheal_tube, lines_tubes, pulmonary_nodule_incidental. PULMONARY NODULES: If a nodule is identified, apply Fleischner Society 2017 guidelines in incidentals_requiring_followup based on size, morphology, and smoking history.${SYS_SUF}`,
  },
  {
    id:"ct_head", label:"CT Head", short:"CT Head", icon:"🧠", color:"#9b6dff",
    ph:"Paste CT head report — include hemorrhage assessment, ventricles, and impression...",
    sf:[
      o("hem",    "Hemorrhage",      ["None","Subdural (SDH)","Epidural (EDH)","Subarachnoid (SAH)","Intraparenchymal (IPH)","Intraventricular (IVH)","Multiple types"]),
      o("mls",    "Midline shift",   ["None","< 5 mm","5–10 mm","> 10 mm"]),
      o("vents",  "Ventricles",      ["Normal","Hydrocephalus","Compressed/collapsed"]),
      o("stroke", "Stroke changes",  ["None","Early ischemic changes","Established infarct","Hyperdense MCA sign","Posterior fossa changes"]),
      o("skull",  "Skull",           ["Intact","Linear fracture","Depressed fracture","Basilar fracture signs"]),
      t("imp",    "Impression",      "IMPRESSION: "),
    ],
    sys:`${SYS_PRE}

You are an ED physician interpreting a CT head for acute management. Include neurosurgery_consult field (emergent/urgent/routine/not indicated — reason). TIME CRITICALITY (Rec 7): If acute ischemic stroke changes are present, include time_critical field stating tPA eligibility window (0–4.5h from last known well), LVO thrombectomy window (0–24h), and NIHSS/ASPECTS implications. For hemorrhage, state surgical threshold. Include dont_miss_checklist keys: intracranial_hemorrhage, sdh_details, edh_details, sah, stroke_early_changes, hyperdense_mca, mass_effect, midline_shift, herniation, hydrocephalus, skull_fracture, scout_reviewed.${SYS_SCOUT}${SYS_SUF}`,
  },
  {
    id:"ct_chest", label:"CT Chest / PE", short:"CT PE", icon:"💨", color:"#00e5c0",
    ph:"Paste CT chest or CT pulmonary angiography report...",
    sf:[
      o("pe",     "Pulmonary embolism", ["None","Segmental","Lobar","Main pulmonary artery","Saddle embolus","Bilateral lobar"]),
      o("rv",     "RV strain",          ["None","Mild RV dilation","RV:LV > 0.9","D-sign present","Septal flattening"]),
      o("ptx",    "Pneumothorax",       ["None","Small R","Small L","Large R","Large L","Tension signs"]),
      o("aorta",  "Aorta",              ["Normal","Type A dissection","Type B dissection","Aortic aneurysm","Intramural hematoma"]),
      o("consol", "Consolidation",      ["None","RUL","RML","RLL","LUL","LLL","Bilateral"]),
      o("effus",  "Pleural effusion",   ["None","Small R","Small L","Moderate R","Moderate L","Large bilateral"]),
      t("imp",    "Impression",         "IMPRESSION: "),
    ],
    sys:`${SYS_PRE}

You are an ED physician interpreting CT chest/CTPA for immediate management. Include pe_management field if PE present. PE RISK STRATIFICATION (Rec 6): Include pe_risk_tier field — "Massive" (hemodynamic instability: SBP<90 or shock — systemic lytics/surgical embolectomy), "Submassive" (RV:LV>0.9 on CT, troponin/BNP elevated, hemodynamically stable — consider CDT vs anticoagulation), or "Low-risk" (no RV strain, hemodynamically stable — anticoagulation). Include dont_miss_checklist keys: pulmonary_embolism, pe_burden, rv_strain, pneumothorax, hemothorax, aortic_dissection, pneumonia_consolidation, pleural_effusion, pericardial_effusion, pneumomediastinum, incidental_findings, scout_reviewed.${SYS_SCOUT}${SYS_SUF}`,
  },
  {
    id:"ct_abd", label:"CT Abd/Pelvis", short:"CT A/P", icon:"🫃", color:"#ff9f43",
    ph:"Paste CT abdomen/pelvis report — include all organ assessments and impression...",
    sf:[
      o("freeair",  "Free air",        ["None","Present — perforation"]),
      o("appendix", "Appendix",        ["Normal","Appendicitis","Perforated appendicitis","Not visualized"]),
      o("gb",       "Gallbladder",     ["Normal","Acute cholecystitis","Stones without cholecystitis","Gangrenous cholecystitis","Perforation"]),
      o("bowel",    "Bowel",           ["Normal","Small bowel obstruction","Large bowel obstruction","Pneumatosis intestinalis","Mesenteric ischemia"]),
      o("aaa",      "Aorta / AAA",     ["Normal","AAA < 5 cm","AAA >= 5 cm","Rupture signs","Aortic dissection"]),
      o("gyn",      "Gyn / Pelvis",    ["N/A","Normal female pelvis","Ectopic pregnancy","Ovarian torsion","TOA / pelvic abscess"]),
      t("imp",      "Impression",      "IMPRESSION: "),
    ],
    sys:`${SYS_PRE}

You are an ED physician interpreting CT abdomen/pelvis for immediate management. Include surgical_consult field (emergent/urgent/routine/not indicated — reason). Include dont_miss_checklist keys: free_air, appendicitis, cholecystitis, bowel_obstruction, aaa, mesenteric_ischemia, diverticulitis, urolithiasis, gynecologic, solid_organ_injury, ascites, incidental_findings, scout_reviewed.${SYS_SCOUT}${SYS_SUF}`,
  },
  {
    id:"mri_brain", label:"MRI Brain", short:"MRI Brain", icon:"🔬", color:"#ff6b6b",
    ph:"Paste MRI brain report — include DWI, FLAIR, and post-contrast sequences if available...",
    sf:[
      o("dwi",       "DWI / Acute infarct",  ["No restriction","Acute infarct present","Subacute infarct","Chronic infarct only"]),
      o("territory", "Vascular territory",   ["N/A","MCA right","MCA left","ACA territory","PCA territory","Posterior fossa / cerebellar","Brainstem","Watershed / border zone","Multiple territories"]),
      o("hem",       "Hemorrhage",           ["None","Microhemorrhages only","Lobar hemorrhage","Deep hemorrhage","Subarachnoid blood","Cortical SAH"]),
      o("mass",      "Mass / Enhancement",   ["None","Non-enhancing lesion","Ring-enhancing lesion","Diffuse leptomeningeal enhancement","PRES pattern","Dural enhancement"]),
      o("wm",        "White matter",         ["Normal","Nonspecific WM changes","Demyelinating plaques","Watershed ischemia","Toxic/metabolic changes"]),
      t("imp",       "Impression",           "IMPRESSION: "),
    ],
    sys:`${SYS_PRE}

You are an ED physician interpreting an MRI brain for acute management. Include neurology_consult field (emergent/urgent/routine/not indicated — reason). TIME CRITICALITY (Rec 7): If acute DWI-restricted infarct is identified, include time_critical field: state tPA window (0–4.5h from last known well), thrombectomy window (0–24h for LVO or large territory), Wake-Up/Unknown-Onset protocol eligibility (DWI-FLAIR mismatch), and posterior circulation / brainstem implications. Include dont_miss_checklist keys: acute_infarct, lvo_territory, posterior_circulation, brainstem_involvement, hemorrhage, hemorrhage_type, mass_effect, midline_shift, herniation, enhancement_pattern, white_matter_changes, hydrocephalus, restricted_diffusion_pattern.${SYS_SUF}`,
  },
  {
    id:"xray_ortho", label:"X-Ray Extremity", short:"X-Ray", icon:"🦴", color:"#f5c842",
    ph:"Paste extremity or skeletal X-ray report — specify body part and include impression...",
    sf:[
      o("extremity", "Extremity / Region",  ["Hand / wrist","Forearm","Elbow","Humerus","Shoulder","Foot / ankle","Tibia / fibula","Knee","Femur","Hip / pelvis","Clavicle","Cervical spine","Thoracic spine","Lumbar spine","Ribs"]),
      o("fracture",  "Fracture",            ["None","Non-displaced","Minimally displaced","Displaced","Comminuted","Avulsion","Pathologic / insufficiency","Cortical buckle / torus","Salter-Harris"]),
      o("dislocate", "Dislocation",         ["None","Dislocation present","Subluxation","Reduced — post-reduction film"]),
      o("effusion",  "Joint effusion",      ["None","Small","Moderate","Large / lipohemarthrosis"]),
      o("align",     "Alignment",           ["Normal","Varus angulation","Valgus angulation","Shortening","Rotational deformity","Bayonet apposition"]),
      t("notes",     "Additional findings", "Periosteal reaction, soft tissue, foreign body, hardware..."),
    ],
    sys:`${SYS_PRE}

You are an ED physician interpreting a skeletal/extremity X-ray for immediate management. Include orthopedic_consult field (emergent/urgent/routine/not indicated — management plan). EXPANDED EVIDENCE-BASED DON'T-MISS LIST (Rec 4 — from peer-reviewed ED missed fracture literature): HAND/WRIST: scaphoid waist and tubercle (X-ray negative does not exclude — MRI is gold standard per ACR AC, obtain within 72h if clinical suspicion), hamate hook, pisiform, gamekeeper's thumb UCL avulsion at 1st MCP, metacarpal base fractures, volar plate avulsions. ELBOW: posterior fat pad sign (95% associated with occult radial head/neck fracture — treat as radial head fracture clinically even if X-ray negative), radial neck, coronoid process, capitellum. FOOT/ANKLE: Lisfranc injury (fleck sign at 2nd MT base, >2mm TMT joint gap — obtain weight-bearing films or CT if any clinical suspicion — missed Lisfranc causes permanent disability), Jones vs. dancer's fracture at 5th MT base (management differs critically: Jones = non-weight-bearing/possible ORIF, dancer's = symptomatic treatment), Maisonneuve fracture (proximal fibula fracture with deltoid injury when ankle mechanism — must X-ray entire fibula), lateral process of talus (snowboarder's fracture — commonly missed). KNEE: Segond fracture (small vertical avulsion at lateral tibial plateau — virtually pathognomonic for ACL tear and lateral capsular injury, warrants MRI). HIP/PELVIS (especially elderly): impacted/valgus-impacted femoral neck fractures may appear hyperdense not hypodense — MRI or CT if clinical suspicion high despite negative X-ray. SPINE: odontoid (C2) and C1 ring fractures, thoracolumbar junction T11–L2. Include dont_miss_checklist keys: scaphoid_or_wrist_occult, posterior_fat_pad_elbow, lisfranc_injury, jones_vs_dancers_distinction, maisonneuve_fracture, segond_fracture, femoral_neck_elderly, growth_plate_injury_salter, vascular_injury_risk, compartment_syndrome_risk, open_fracture_risk, spinal_instability.${SYS_SUF}`,
  },
  {
    id:"pocus", label:"POCUS", short:"POCUS", icon:"📡", color:"#3dffa0",
    ph:"Paste POCUS findings — include exam type, views obtained, key findings, and image quality...",
    sf:[
      o("exam",      "Exam type",          ["FAST / eFAST","Cardiac / echo","Aortic","Biliary","Renal / hydronephrosis","DVT lower extremity","Lung","IVC / volume status","Soft tissue / abscess","Procedural guidance"]),
      o("quality",   "Image quality",      ["Adequate","Limited — body habitus","Limited — bowel gas","Limited — technical","Nondiagnostic"]),
      o("freefluid", "Free fluid (FAST)",  ["None","Pelvis (Douglas/Morison)","Perihepatic — Morrison's pouch","Perisplenic","Left paracolic","All 4 views positive"]),
      o("cardiac",   "Cardiac findings",   ["N/A","Normal EF","Reduced EF","Wall motion abnormality","Pericardial effusion — small","Pericardial effusion — large","Tamponade physiology","RV dilation"]),
      o("aorta",     "Aorta diameter",     ["N/A","Normal < 3 cm","3.0–4.5 cm","4.5–5.5 cm",">= 5.5 cm AAA","Cannot visualize"]),
      t("findings",  "Key findings",       "Describe primary finding, echo quality, IVC assessment..."),
    ],
    sys:`${SYS_PRE}

You are an ED physician interpreting a point-of-care ultrasound (POCUS) for immediate management. Include pocus_adequacy field (adequate/limited/nondiagnostic — reason). Note POCUS is operator-dependent; include confirmatory imaging recommendations. Include dont_miss_checklist keys: free_fluid_presence, pericardial_effusion, tamponade_physiology, cardiac_function, aortic_diameter, ectopic_pregnancy_concern, hydronephrosis, dvt_present, pneumothorax_lung_sliding, ivc_collapsibility, abscess_identification.${SYS_SUF}`,
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function buildPatientCtx(demo, vitals, cc, pmhSelected, medications) {
  const lines = [];
  if (demo?.age || demo?.sex) lines.push(`${demo?.age || ""}yo ${demo?.sex || ""}`.trim());
  if (cc?.text) lines.push(`CC: ${cc.text}`);
  const vs = [];
  if (vitals?.hr)   vs.push(`HR ${vitals.hr}`);
  if (vitals?.bp)   vs.push(`BP ${vitals.bp}`);
  if (vitals?.spo2) vs.push(`SpO2 ${vitals.spo2}%`);
  if (vitals?.temp) vs.push(`T ${vitals.temp}C`);
  if (vs.length) lines.push(`Vitals: ${vs.join("  ")}`);
  const pmh = (pmhSelected || []).slice(0, 5);
  if (pmh.length) lines.push(`PMH: ${pmh.join(", ")}`);
  const meds = (medications || []).map(m => typeof m === "string" ? m : m.name || "").filter(Boolean).slice(0, 4);
  if (meds.length) lines.push(`Meds: ${meds.join(", ")}`);
  return lines.join("\n");
}

function composeStructuredReport(panel, selections, texts) {
  const lines = [`STRUCTURED FINDINGS -- ${panel.label.toUpperCase()}`];
  for (const f of panel.sf) {
    if (f.type === "opts") { const s = selections[f.key]; if (s) lines.push(`${f.label}: ${s}`); }
    else { const tx = texts[f.key]?.trim(); if (tx) lines.push(`${f.label}: ${tx}`); }
  }
  return lines.join("\n");
}

function sevColor(sev) {
  return sev === "critical" ? "#ff4444" : sev === "concerning" ? "#ff6b6b"
    : sev === "incidental" ? "#3b9eff" : "#00e5c0";
}

function confStyle(c) {
  return c === "high"     ? ["#3dffa0","rgba(61,255,160,.1)","rgba(61,255,160,.28)"]
    : c === "moderate"    ? ["#f5c842","rgba(245,200,66,.1)","rgba(245,200,66,.28)"]
    : c === "low"         ? ["#ff6b6b","rgba(255,107,107,.1)","rgba(255,107,107,.28)"]
    : null;
}

function urgStyle(u) {
  return u === "urgent" ? ["var(--img-red)","rgba(255,68,68,.12)","rgba(255,68,68,.4)"]
    : u === "soon"      ? ["var(--img-gold)","rgba(245,200,66,.1)","rgba(245,200,66,.3)"]
    : ["var(--img-txt4)","rgba(42,79,122,.15)","rgba(42,79,122,.3)"];
}

function peTierStyle(tier) {
  if (!tier) return null;
  const t = tier.toLowerCase();
  if (t.includes("massive") && !t.includes("sub")) return ["var(--img-red)","rgba(255,68,68,.14)","rgba(255,68,68,.55)"];
  if (t.includes("sub")) return ["var(--img-orange)","rgba(255,159,67,.1)","rgba(255,159,67,.45)"];
  return ["var(--img-green)","rgba(61,255,160,.07)","rgba(61,255,160,.3)"];
}

// ─── CONSULT / MANAGEMENT FIELDS ─────────────────────────────────────────────
const CONSULT_FIELDS = [
  ["neurosurgery_consult", "Neurosurgery",  "#9b6dff"],
  ["neurology_consult",    "Neurology",     "#9b6dff"],
  ["pe_management",        "PE Management", "#00e5c0"],
  ["surgical_consult",     "Surgery",       "#ff9f43"],
  ["orthopedic_consult",   "Orthopedics",   "#f5c842"],
  ["pocus_adequacy",       "POCUS Quality", "#3dffa0"],
];

// ─── STRUCTURED ENTRY ─────────────────────────────────────────────────────────
function StructuredEntry({ panel, selections, texts, onSelect, onText, onSubmit, busy, panelColor }) {
  const btnRefs = useRef({});
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {panel.sf.map((f, fi) => (
        <div key={f.key}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--img-txt4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>
            {f.label}
          </div>
          {f.type === "opts" ? (
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {f.opts.map((opt, oi) => (
                <button key={opt}
                  ref={el => { btnRefs.current[`${fi}-${oi}`] = el; }}
                  className={`img3-opt${selections[f.key] === opt ? " on" : ""}`}
                  onClick={() => onSelect(f.key, selections[f.key] === opt ? null : opt)}
                  onKeyDown={e => {
                    const jump = (key) => {
                      const el = btnRefs.current[key] ||
                        document.querySelector(`.img3-ti[data-fk="${(panel.sf[fi+(key.startsWith(String(fi+1)) ? 1 : -1)] || {}).key}"]`);
                      if (el) { e.preventDefault(); el.focus(); }
                    };
                    if (e.key === "ArrowRight") { e.preventDefault(); btnRefs.current[`${fi}-${oi+1}`]?.focus(); }
                    else if (e.key === "ArrowLeft") { e.preventDefault(); btnRefs.current[`${fi}-${oi-1}`]?.focus(); }
                    else if (e.key === "ArrowDown" || e.key === "Tab") {
                      const nf = panel.sf[fi+1];
                      if (nf) { e.preventDefault();
                        (nf.type === "text"
                          ? document.querySelector(`.img3-ti[data-fk="${nf.key}"]`)
                          : btnRefs.current[`${fi+1}-0`])?.focus();
                      }
                    } else if (e.key === "ArrowUp") {
                      const pf = panel.sf[fi-1];
                      if (pf) { e.preventDefault();
                        (pf.type === "text"
                          ? document.querySelector(`.img3-ti[data-fk="${pf.key}"]`)
                          : btnRefs.current[`${fi-1}-0`])?.focus();
                      }
                    }
                  }}
                >{opt}</button>
              ))}
            </div>
          ) : (
            <input className="img3-ti" data-fk={f.key}
              value={texts[f.key] || ""} onChange={e => onText(f.key, e.target.value)}
              placeholder={f.ph}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const nf = panel.sf[fi+1];
                  if (nf) (nf.type === "text"
                    ? document.querySelector(`.img3-ti[data-fk="${nf.key}"]`)
                    : btnRefs.current[`${fi+1}-0`])?.focus();
                  else onSubmit();
                }
              }}
            />
          )}
        </div>
      ))}
      <button onClick={onSubmit} disabled={busy}
        style={{ padding:"10px 0", borderRadius:10, cursor:busy ? "not-allowed" : "pointer",
          border:`1px solid ${busy ? "rgba(42,79,122,.3)" : panelColor+"66"}`,
          background:busy ? "rgba(14,37,68,.5)" : `linear-gradient(135deg,${panelColor}18,${panelColor}06)`,
          color:busy ? "var(--img-txt4)" : panelColor,
          fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:13, transition:"all .15s" }}>
        {busy ? "Interpreting..." : `Interpret ${panel.label}`}
      </button>
    </div>
  );
}

// ─── RESULT DISPLAY ───────────────────────────────────────────────────────────
function ImagingResult({ result, panel }) {
  if (!result) return null;
  const pc = panel.color;

  return (
    <div className="img3-fade print-target">

      {/* Rec 7 — Time-critical banner */}
      {result.time_critical && (
        <div style={{ padding:"10px 13px", borderRadius:9, marginBottom:9,
          background:"rgba(255,68,68,.14)", border:"2px solid rgba(255,68,68,.55)",
          display:"flex", alignItems:"flex-start", gap:9 }}>
          <span style={{ fontSize:16, flexShrink:0, lineHeight:1.4 }}>⏱</span>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"var(--img-red)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:3 }}>
              Time-Critical — Act Now
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              fontWeight:600, color:"var(--img-txt2)", lineHeight:1.5 }}>{result.time_critical}</div>
          </div>
        </div>
      )}

      {/* Headline */}
      <div style={{ padding:"10px 13px", borderRadius:9, marginBottom:9,
        background:`${pc}0c`, border:`1px solid ${pc}33` }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:pc, letterSpacing:1.5, textTransform:"uppercase", marginBottom:3 }}>Summary</div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
          fontSize:15, color:"var(--img-txt)", lineHeight:1.4 }}>{result.headline}</div>
      </div>

      {/* Critical */}
      {result.critical_findings?.length > 0 && (
        <div style={{ padding:"9px 12px", borderRadius:8, marginBottom:9,
          background:"rgba(255,68,68,.1)", border:"1px solid rgba(255,68,68,.4)" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--img-red)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>
            Critical Findings
          </div>
          {result.critical_findings.map((f, i) => (
            <div key={i} style={{ display:"flex", gap:6, alignItems:"flex-start", marginBottom:3 }}>
              <span style={{ color:"var(--img-red)", fontSize:7, marginTop:3, flexShrink:0 }}>▸</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                fontWeight:600, color:"var(--img-txt2)" }}>{f}</span>
            </div>
          ))}
        </div>
      )}

      {/* Key findings — Rec 3: confidence badges */}
      {result.key_findings?.length > 0 && (
        <div style={{ marginBottom:9 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--img-txt4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>
            Key Findings
          </div>
          {result.key_findings.map((f, i) => {
            const sc = sevColor(f.severity);
            const cs = confStyle(f.confidence);
            return (
              <div key={i} style={{ padding:"7px 10px", borderRadius:7, marginBottom:4,
                background:`${sc}09`, border:`1px solid ${sc}28`, borderLeft:`3px solid ${sc}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap", marginBottom:2 }}>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700,
                    fontSize:12, color:"var(--img-txt)" }}>{f.finding}</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, fontWeight:700,
                    color:sc, letterSpacing:1, textTransform:"uppercase",
                    background:`${sc}18`, border:`1px solid ${sc}35`,
                    borderRadius:4, padding:"1px 6px" }}>{f.severity}</span>
                  {cs && (
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                      color:cs[0], letterSpacing:.8, textTransform:"uppercase",
                      background:cs[1], border:`1px solid ${cs[2]}`,
                      borderRadius:4, padding:"1px 6px" }}>
                      {f.confidence} conf
                    </span>
                  )}
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                  color:"var(--img-txt3)" }}>{f.significance}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Don't-miss checklist */}
      {result.dont_miss_checklist && (
        <div style={{ padding:"10px 12px", borderRadius:9, marginBottom:9,
          background:"rgba(8,22,40,.65)", border:"1px solid rgba(42,79,122,.35)" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--img-gold)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
            Don't Miss Checklist
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
            {Object.entries(result.dont_miss_checklist).map(([key, val]) => {
              if (!val) return null;
              const absent   = /absent|normal|none|no |negative|reviewed/i.test(String(val));
              const critical = /present|tension|positive|type a|rupture|perforation|torsion|infarct|hemorrhage|aaa|ectopic|fat pad|segond|maisonneuve|lisfranc|jones/i.test(String(val));
              const dot = absent ? "var(--img-green)" : critical ? "var(--img-red)" : "var(--img-gold)";
              const label = key.replace(/_/g," ").replace(/\b\w/g, c => c.toUpperCase());
              return (
                <div key={key} style={{ display:"flex", alignItems:"flex-start", gap:7,
                  padding:"4px 7px", borderRadius:6,
                  background:critical ? "rgba(255,68,68,.07)" : "transparent" }}>
                  <div style={{ width:7, height:7, borderRadius:"50%",
                    background:dot, flexShrink:0, marginTop:3 }} />
                  <div style={{ flex:1 }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace",
                      fontSize:8, color:"var(--img-txt4)", letterSpacing:.5 }}>
                      {label}{": "}
                    </span>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                      color:absent ? "var(--img-txt4)" : critical ? "var(--img-coral)" : "var(--img-gold)" }}>
                      {val}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rec 6 — PE risk tier */}
      {result.pe_risk_tier && (() => {
        const pts = peTierStyle(result.pe_risk_tier);
        if (!pts) return null;
        const [c, bg, bd] = pts;
        return (
          <div style={{ padding:"9px 12px", borderRadius:9, marginBottom:9,
            background:bg, border:`2px solid ${bd}`,
            display:"flex", alignItems:"center", gap:10 }}>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:c, letterSpacing:1.5, textTransform:"uppercase", marginBottom:2 }}>
                PE Risk Tier
              </div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
                fontSize:14, color:"var(--img-txt)" }}>{result.pe_risk_tier}</div>
            </div>
          </div>
        );
      })()}

      {/* Consult / management */}
      {CONSULT_FIELDS.map(([field, label, color]) => result[field] ? (
        <div key={field} style={{ padding:"8px 11px", borderRadius:8, marginBottom:9,
          background:`${color}09`, border:`1px solid ${color}38` }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color, letterSpacing:1.5, textTransform:"uppercase" }}>{label}: </span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:"var(--img-txt2)" }}>{result[field]}</span>
        </div>
      ) : null)}

      {/* Actions + Imaging */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, marginBottom:9 }}>
        {result.immediate_actions?.length > 0 && (
          <div style={{ padding:"9px 11px", borderRadius:8,
            background:"rgba(0,229,192,.06)", border:"1px solid rgba(0,229,192,.25)" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"var(--img-teal)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:7 }}>
              Immediate Actions
            </div>
            {result.immediate_actions.map((a, i) => (
              <div key={i} style={{ display:"flex", gap:6, alignItems:"flex-start", marginBottom:4 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                  color:"var(--img-teal)", flexShrink:0, minWidth:16 }}>{i+1}.</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                  color:"var(--img-txt2)", lineHeight:1.5 }}>{a}</span>
              </div>
            ))}
          </div>
        )}
        {result.further_imaging && (
          <div style={{ padding:"9px 11px", borderRadius:8,
            background:"rgba(59,158,255,.06)", border:"1px solid rgba(59,158,255,.25)" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"var(--img-blue)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:7 }}>
              Further Imaging
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:"var(--img-txt2)", lineHeight:1.65 }}>{result.further_imaging}</div>
          </div>
        )}
      </div>

      {/* Rec 5 — Incidentals tracker */}
      {result.incidentals_requiring_followup?.length > 0 && (
        <div style={{ padding:"10px 12px", borderRadius:9, marginBottom:9,
          background:"rgba(59,158,255,.06)", border:"1px solid rgba(59,158,255,.32)" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--img-blue)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
            Incidentals Requiring Follow-up
          </div>
          {result.incidentals_requiring_followup.map((item, i) => {
            const [c, bg, bd] = urgStyle(item.urgency);
            return (
              <div key={i} style={{ display:"flex", gap:9, alignItems:"flex-start",
                padding:"7px 9px", borderRadius:7, marginBottom:5,
                background:"rgba(14,37,68,.4)", border:"1px solid rgba(42,79,122,.3)" }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:c, background:bg, border:`1px solid ${bd}`,
                  borderRadius:5, padding:"2px 7px", flexShrink:0,
                  textTransform:"uppercase", letterSpacing:.5, marginTop:1 }}>
                  {item.urgency || "routine"}
                </span>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    fontWeight:600, color:"var(--img-txt)", marginBottom:2 }}>{item.finding}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                    color:"var(--img-txt3)", lineHeight:1.5,
                    marginBottom:item.guideline ? 3 : 0 }}>{item.recommendation}</div>
                  {item.guideline && (
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                      color:"var(--img-blue)", letterSpacing:.3 }}>{item.guideline}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pearl */}
      {result.pearls && (
        <div style={{ padding:"8px 11px", borderRadius:8,
          background:"rgba(155,109,255,.07)", border:"1px solid rgba(155,109,255,.25)" }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--img-purple)", letterSpacing:1.5, textTransform:"uppercase" }}>
            Pearl:{" "}
          </span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:"var(--img-txt2)" }}>{result.pearls}</span>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ImagingInterpreter({
  embedded = false,
  demo, vitals, cc, pmhSelected, medications,
}) {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState("cxr");
  const [mode,        setMode]        = useState({});
  const [reports,     setReports]     = useState({});
  const [selections,  setSelections]  = useState({});
  const [textInputs,  setTextInputs]  = useState({});
  const [results,     setResults]     = useState({});
  const [busy,        setBusy]        = useState({});
  const [errors,      setErrors]      = useState({});
  const [copied,      setCopied]      = useState({});

  // Rec 10 — Fatigue flag (5pm-7am)
  const isFatigueRisk = useMemo(() => { const h = new Date().getHours(); return h >= 17 || h <= 7; }, []);
  const [fatigueDismissed, setFatigueDismissed] = useState(false);

  const panel     = PANELS.find(p => p.id === activePanel);
  const panelMode = mode[activePanel] || "paste";

  // Keyboard panel switching 1-7
  useEffect(() => {
    const fn = e => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      const n = parseInt(e.key);
      if (!isNaN(n) && n >= 1 && n <= PANELS.length) { e.preventDefault(); setActivePanel(PANELS[n-1].id); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  const patientCtx = useMemo(
    () => buildPatientCtx(demo, vitals, cc, pmhSelected, medications),
    [demo, vitals, cc, pmhSelected, medications]
  );

  const setReport = useCallback((pid, val) => {
    setReports(p => ({ ...p, [pid]:val }));
    setResults(p => ({ ...p, [pid]:null }));
    setErrors(p  => ({ ...p, [pid]:null }));
  }, []);

  const setSelection = useCallback((pid, fk, val) => {
    setSelections(p => ({ ...p, [pid]:{ ...(p[pid]||{}), [fk]:val } }));
    setResults(p => ({ ...p, [pid]:null }));
  }, []);

  const setTextInput = useCallback((pid, fk, val) => {
    setTextInputs(p => ({ ...p, [pid]:{ ...(p[pid]||{}), [fk]:val } }));
  }, []);

  const handleInterpret = useCallback(async (panelId, reportOverride) => {
    const p      = PANELS.find(x => x.id === panelId);
    const report = reportOverride ?? reports[panelId]?.trim();
    if (!report || !p) return;
    setBusy(prev  => ({ ...prev, [panelId]:true }));
    setErrors(prev => ({ ...prev, [panelId]:null }));
    setResults(prev=> ({ ...prev, [panelId]:null }));
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `PATIENT CONTEXT:\n${patientCtx || "Not provided"}\n\nRADIOLOGY REPORT:\n${report}\n\nSYSTEM INSTRUCTIONS:\n${p.sys}`,
        response_json_schema: {
          type:"object",
          properties:{
            headline:                      { type:"string" },
            critical_findings:             { type:"array",  items:{ type:"string" } },
            key_findings:                  { type:"array",  items:{ type:"object" } },
            dont_miss_checklist:           { type:"object" },
            incidentals_requiring_followup:{ type:"array",  items:{ type:"object" } },
            neurosurgery_consult:          { type:"string" },
            neurology_consult:             { type:"string" },
            pe_management:                 { type:"string" },
            pe_risk_tier:                  { type:"string" },
            time_critical:                 { type:"string" },
            surgical_consult:              { type:"string" },
            orthopedic_consult:            { type:"string" },
            pocus_adequacy:                { type:"string" },
            immediate_actions:             { type:"array",  items:{ type:"string" } },
            further_imaging:               { type:"string" },
            pearls:                        { type:"string" },
          },
        },
      });
      setResults(prev => ({ ...prev, [panelId]:response }));
    } catch (e) {
      setErrors(prev => ({ ...prev, [panelId]:"Error: " + (e.message || "Check API connectivity") }));
    } finally {
      setBusy(prev => ({ ...prev, [panelId]:false }));
    }
  }, [reports, patientCtx]);

  const handleStructuredSubmit = useCallback((panelId) => {
    const p = PANELS.find(x => x.id === panelId);
    if (!p) return;
    handleInterpret(panelId, composeStructuredReport(p, selections[panelId]||{}, textInputs[panelId]||{}));
  }, [selections, textInputs, handleInterpret]);

  const copyResult = useCallback((panelId) => {
    const r = results[panelId];
    if (!r) return;
    const p = PANELS.find(x => x.id === panelId);
    const chk = r.dont_miss_checklist
      ? "\nCHECKLIST:\n" + Object.entries(r.dont_miss_checklist).filter(([,v])=>v)
          .map(([k,v]) => `  ${k.replace(/_/g," ").toUpperCase()}: ${v}`).join("\n") : "";
    const inc = r.incidentals_requiring_followup?.length
      ? "\nINCIDENTALS REQUIRING FOLLOW-UP:\n" + r.incidentals_requiring_followup
          .map(i => `  [${(i.urgency||"routine").toUpperCase()}] ${i.finding} -- ${i.recommendation}${i.guideline ? ` (${i.guideline})` : ""}`).join("\n") : "";
    const consults = CONSULT_FIELDS.filter(([f]) => r[f])
      .map(([f, lbl]) => `\n${lbl.toUpperCase()}: ${r[f]}`).join("");
    const text = [
      `IMAGING INTERPRETATION -- ${p?.label?.toUpperCase()}`,
      new Date().toLocaleString(), "",
      `SUMMARY: ${r.headline}`,
      r.time_critical ? `\nTIME-CRITICAL: ${r.time_critical}` : "",
      r.pe_risk_tier  ? `\nPE RISK TIER: ${r.pe_risk_tier}` : "",
      r.critical_findings?.length ? "\nCRITICAL:\n" + r.critical_findings.map(f => `  * ${f}`).join("\n") : "",
      r.key_findings?.length ? "\nFINDINGS:\n" + r.key_findings.map(f =>
        `  - ${f.finding} [${(f.severity||"").toUpperCase()}|conf:${f.confidence||"?"}] -- ${f.significance}`).join("\n") : "",
      chk, consults, inc,
      r.immediate_actions?.length ? "\nIMMEDIATE ACTIONS:\n" + r.immediate_actions.map((a,i) => `  ${i+1}. ${a}`).join("\n") : "",
      r.further_imaging ? `\nFURTHER IMAGING: ${r.further_imaging}` : "",
      r.pearls ? `\nCLINICAL PEARL: ${r.pearls}` : "",
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(prev => ({ ...prev, [panelId]:true }));
      setTimeout(() => setCopied(prev => ({ ...prev, [panelId]:false })), 2500);
    });
  }, [results]);

  const clearPanel = useCallback((panelId) => {
    setReports(p    => ({ ...p, [panelId]:"" }));
    setResults(p    => ({ ...p, [panelId]:null }));
    setErrors(p     => ({ ...p, [panelId]:null }));
    setSelections(p => ({ ...p, [panelId]:{} }));
    setTextInputs(p => ({ ...p, [panelId]:{} }));
  }, []);

  const hasResult = Boolean(results[activePanel]);
  const isBusy    = Boolean(busy[activePanel]);
  const hasReport = panelMode === "paste"
    ? Boolean(reports[activePanel]?.trim())
    : Object.values(selections[activePanel]||{}).some(Boolean) ||
      Object.values(textInputs[activePanel]||{}).some(v => v?.trim());
  const hasError = Boolean(errors[activePanel]);

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",
      background:embedded ? "transparent" : "var(--img-bg)",
      minHeight:embedded ? "auto" : "100vh", color:"var(--img-txt)" }}>
      <div style={{ maxWidth:1200, margin:"0 auto", padding:embedded ? "0" : "0 16px" }}>

        {/* Standalone header */}
        {!embedded && (
          <div style={{ padding:"18px 0 14px" }} className="no-print">
            <button onClick={() => navigate("/hub")}
              style={{ marginBottom:10, display:"inline-flex", alignItems:"center", gap:7,
                fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
                background:"rgba(14,37,68,.7)", border:"1px solid rgba(42,79,122,.5)",
                borderRadius:8, padding:"5px 14px", color:"var(--img-txt3)", cursor:"pointer" }}>
              Back to Hub
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <div style={{ background:"rgba(5,15,30,.9)", border:"1px solid rgba(42,79,122,.6)",
                borderRadius:10, padding:"5px 12px", display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                  color:"var(--img-purple)", letterSpacing:3 }}>NOTRYA</span>
                <span style={{ color:"var(--img-txt4)", fontFamily:"'JetBrains Mono',monospace", fontSize:10 }}>/</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                  color:"var(--img-txt3)", letterSpacing:2 }}>IMAGING</span>
              </div>
              <div style={{ height:1, flex:1,
                background:"linear-gradient(90deg,rgba(0,229,192,.5),transparent)" }} />
            </div>
            <h1 className="img3-shim" style={{ fontFamily:"'Playfair Display',serif",
              fontSize:"clamp(22px,4vw,38px)", fontWeight:900,
              letterSpacing:-.5, lineHeight:1.1, margin:0 }}>
              Imaging Interpreter
            </h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:"var(--img-txt4)", marginTop:4, marginBottom:0 }}>
              7 Panels · Anti-SOS Prompting · Confidence Flags · Incidental Tracker · PE Risk Tier · Stroke Time-Window · ACR Alignment
            </p>
          </div>
        )}

        {embedded && (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }} className="no-print">
            <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
              fontSize:15, color:"var(--img-teal)" }}>Imaging Interpreter</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"var(--img-txt4)", letterSpacing:1.5, textTransform:"uppercase",
              background:"rgba(0,229,192,.1)", border:"1px solid rgba(0,229,192,.25)",
              borderRadius:4, padding:"2px 7px" }}>7 Panels · Keys 1-7 · v3</span>
          </div>
        )}

        {/* Rec 10 — Fatigue flag */}
        {isFatigueRisk && !fatigueDismissed && (
          <div style={{ padding:"8px 12px", borderRadius:8, marginBottom:10,
            background:"rgba(245,200,66,.08)", border:"1px solid rgba(245,200,66,.35)",
            display:"flex", alignItems:"center", gap:9 }} className="no-print">
            <span style={{ fontSize:14, flexShrink:0 }}>Warning</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:"var(--img-gold)", flex:1, lineHeight:1.5 }}>
              <b>Late-shift alert (5 pm - 7 am).</b> Diagnostic error rates increase during overnight hours. Apply an extra systematic secondary search pass before acting on AI interpretation results.
            </span>
            <button onClick={() => setFatigueDismissed(true)}
              style={{ background:"transparent", border:"none", cursor:"pointer",
                color:"var(--img-txt4)", fontFamily:"'JetBrains Mono',monospace",
                fontSize:11, padding:"0 4px", flexShrink:0 }}>x</button>
          </div>
        )}

        {/* Tab strip */}
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:10,
          overflowX:"auto", paddingBottom:2 }} className="no-print">
          {PANELS.map((p, idx) => {
            const active = activePanel === p.id;
            const done   = Boolean(results[p.id]);
            return (
              <button key={p.id} onClick={() => setActivePanel(p.id)}
                title={`${p.label} (press ${idx+1})`}
                style={{ display:"inline-flex", alignItems:"center", gap:6,
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12,
                  padding:"7px 14px", borderRadius:9, cursor:"pointer", transition:"all .15s",
                  border:`1px solid ${active ? p.color+"66" : "rgba(26,53,85,.4)"}`,
                  background:active
                    ? `linear-gradient(135deg,${p.color}18,${p.color}06)` : "rgba(8,22,40,.5)",
                  color:active ? p.color : "var(--img-txt4)", flexShrink:0 }}>
                <span>{p.icon}</span>
                <span>{embedded ? p.short : p.label}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:active ? p.color : "var(--img-txt4)",
                  background:"rgba(42,79,122,.25)", borderRadius:4,
                  padding:"1px 5px", border:"1px solid rgba(42,79,122,.3)" }}>{idx+1}</span>
                {done && <span style={{ width:6, height:6, borderRadius:"50%",
                  background:"var(--img-green)", flexShrink:0 }} />}
              </button>
            );
          })}
        </div>

        {/* Mode + action bar */}
        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:12,
          flexWrap:"wrap" }} className="no-print">
          {["paste","structured"].map(m => (
            <button key={m} onClick={() => setMode(prev => ({ ...prev, [activePanel]:m }))}
              style={{ padding:"5px 13px", borderRadius:7, cursor:"pointer", transition:"all .15s",
                fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:1,
                textTransform:"uppercase",
                border:`1px solid ${panelMode === m ? "rgba(0,229,192,.45)" : "var(--img-bd)"}`,
                background:panelMode === m ? "rgba(0,229,192,.09)" : "transparent",
                color:panelMode === m ? "var(--img-teal)" : "var(--img-txt4)" }}>
              {m === "paste" ? "Paste Report" : "Structured Entry"}
            </button>
          ))}
          <div style={{ flex:1 }} />
          {hasResult && <>
            <button onClick={() => copyResult(activePanel)}
              style={{ padding:"5px 13px", borderRadius:7, cursor:"pointer", transition:"all .15s",
                fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                border:`1px solid ${copied[activePanel] ? "rgba(61,255,160,.5)" : "var(--img-bd)"}`,
                background:copied[activePanel] ? "rgba(61,255,160,.1)" : "transparent",
                color:copied[activePanel] ? "var(--img-green)" : "var(--img-txt3)" }}>
              {copied[activePanel] ? "Copied" : "Copy to Chart"}
            </button>
            <button onClick={() => window.print()}
              style={{ padding:"5px 13px", borderRadius:7, cursor:"pointer", transition:"all .15s",
                fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                border:"1px solid rgba(245,200,66,.35)", background:"rgba(245,200,66,.07)",
                color:"var(--img-gold)" }}>Print</button>
          </>}
          {(hasResult || hasReport) && (
            <button onClick={() => clearPanel(activePanel)}
              style={{ padding:"5px 10px", borderRadius:7, cursor:"pointer",
                border:"1px solid var(--img-bd)", background:"transparent",
                color:"var(--img-txt4)", fontFamily:"'JetBrains Mono',monospace",
                fontSize:8, letterSpacing:1, textTransform:"uppercase" }}>Clear</button>
          )}
        </div>

        {/* Patient context banner */}
        {patientCtx && (
          <div style={{ padding:"7px 11px", borderRadius:8, marginBottom:12,
            background:"rgba(0,229,192,.06)", border:"1px solid rgba(0,229,192,.2)" }} className="no-print">
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"var(--img-teal)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:3 }}>
              Patient Context -- included in interpretation
            </div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              color:"var(--img-txt4)", whiteSpace:"pre-wrap" }}>{patientCtx}</div>
          </div>
        )}

        {/* Main layout */}
        <div style={{ display:"grid",
          gridTemplateColumns:hasResult ? (embedded ? "1fr" : "1fr 1.2fr") : "1fr",
          gap:12, alignItems:"start" }}>

          {/* Input pane */}
          <div className="no-print">
            {panelMode === "paste" ? (
              <div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:panel?.color, letterSpacing:1.5, textTransform:"uppercase", marginBottom:5 }}>
                  {panel?.icon}{" Paste "}{panel?.label}{" Report"}
                </div>
                <textarea value={reports[activePanel] || ""}
                  onChange={e => setReport(activePanel, e.target.value)}
                  rows={embedded ? 8 : 12}
                  placeholder={panel?.ph || "Paste radiology report here..."}
                  style={{ width:"100%", resize:"vertical", boxSizing:"border-box",
                    background:"rgba(14,37,68,.75)",
                    border:`1px solid ${hasReport ? (panel?.color||"#00e5c0")+"44" : "rgba(42,79,122,.35)"}`,
                    borderRadius:9, padding:"11px 12px", outline:"none",
                    fontFamily:"'JetBrains Mono',monospace", fontSize:11,
                    color:"var(--img-txt3)", lineHeight:1.65 }} />
                <button onClick={() => handleInterpret(activePanel)} disabled={isBusy || !hasReport}
                  style={{ width:"100%", marginTop:8, padding:"10px 0", borderRadius:10,
                    cursor:isBusy || !hasReport ? "not-allowed" : "pointer",
                    border:`1px solid ${!hasReport ? "rgba(42,79,122,.3)" : (panel?.color||"#00e5c0")+"66"}`,
                    background:!hasReport ? "rgba(42,79,122,.15)"
                      : `linear-gradient(135deg,${panel?.color||"#00e5c0"}18,${panel?.color||"#00e5c0"}06)`,
                    color:!hasReport ? "var(--img-txt4)" : (panel?.color||"var(--img-teal)"),
                    fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:13, transition:"all .15s" }}>
                  {isBusy ? "Interpreting..." : `Interpret ${panel?.label}`}
                </button>
              </div>
            ) : (
              <StructuredEntry panel={panel}
                selections={selections[activePanel] || {}}
                texts={textInputs[activePanel] || {}}
                onSelect={(fk, val) => setSelection(activePanel, fk, val)}
                onText={(fk, val)   => setTextInput(activePanel, fk, val)}
                onSubmit={() => handleStructuredSubmit(activePanel)}
                busy={isBusy} panelColor={panel?.color || "#00e5c0"}
              />
            )}
            {hasError && (
              <div style={{ padding:"8px 11px", borderRadius:8, marginTop:8,
                background:"rgba(255,107,107,.08)", border:"1px solid rgba(255,107,107,.3)",
                fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--img-coral)" }}>
                {errors[activePanel]}
              </div>
            )}
            {!hasReport && !hasError && (
              <div style={{ marginTop:10, padding:"9px 12px", borderRadius:8,
                background:"rgba(42,79,122,.08)", border:"1px solid rgba(42,79,122,.25)" }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:"var(--img-txt4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:5 }}>
                  How to Use
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                  color:"var(--img-txt4)", lineHeight:1.65 }}>
                  Paste the full radiology report including findings and impression.
                  Structured mode uses guided fields with arrow-key navigation.
                  Keys 1-7 switch panels. Results include per-finding confidence ratings,
                  incidental follow-up tracker, PE risk stratification, stroke time-windows,
                  expanded X-ray don't-miss checklist, and ACR-aligned imaging recommendations.
                </div>
              </div>
            )}
          </div>

          {/* Results pane */}
          {hasResult && (
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:panel?.color, letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}
                className="no-print">
                ED Interpretation -- {panel?.label}
              </div>
              <ImagingResult result={results[activePanel]} panel={panel} />
            </div>
          )}
        </div>

        {/* Status strip */}
        {PANELS.some(p => results[p.id]) && (
          <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginTop:12,
            padding:"8px 12px", borderRadius:9,
            background:"rgba(8,22,40,.6)", border:"1px solid rgba(26,53,85,.35)" }}
            className="no-print">
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"var(--img-txt4)", letterSpacing:1.5, textTransform:"uppercase",
              alignSelf:"center" }}>Interpreted:</span>
            {PANELS.filter(p => results[p.id]).map(p => (
              <button key={p.id} onClick={() => setActivePanel(p.id)}
                style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 9px",
                  borderRadius:6, cursor:"pointer", border:`1px solid ${p.color}44`,
                  background:`${p.color}10`, fontFamily:"'JetBrains Mono',monospace",
                  fontSize:9, color:p.color, letterSpacing:.5 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:p.color }} />
                {p.short}
              </button>
            ))}
          </div>
        )}

        {!embedded && (
          <div style={{ textAlign:"center", padding:"24px 0 16px",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--img-txt4)", letterSpacing:1.5 }} className="no-print">
            NOTRYA IMAGING INTERPRETER v3 · EVIDENCE-BASED AI DECISION SUPPORT ·
            ALWAYS CONFIRM WITH FORMAL RADIOLOGY READ · NOT A SUBSTITUTE FOR RADIOLOGIST INTERPRETATION
          </div>
        )}
      </div>
    </div>
  );
}