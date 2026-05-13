// QuickNoteHelpers.jsx
// Utility functions extracted from QuickNote.jsx

// ─── CRITICAL VALUE DETECTOR ──────────────────────────────────────────────────
export function detectCriticalValues(labsText) {
  if (!labsText) return [];
  const flags = [];
  const rules = [
    { re:/K\+?\s*[:\-]?\s*([0-9.]+)/i,            label:"K+",          lo:3.0,  hi:6.0  },
    { re:/Na\+?\s*[:\-]?\s*([0-9.]+)/i,           label:"Na+",         lo:125,  hi:155  },
    { re:/glucose\s*[:\-]?\s*([0-9.]+)/i,         label:"Glucose",     lo:50,   hi:500  },
    { re:/lactate\s*[:\-]?\s*([0-9.]+)/i,         label:"Lactate",     lo:null, hi:4.0  },
    { re:/troponin[^0-9]*([0-9.]+)/i,             label:"Troponin",    lo:null, hi:0.04 },
    { re:/creatinine\s*[:\-]?\s*([0-9.]+)/i,      label:"Creatinine",  lo:null, hi:4.0  },
    { re:/ph\s*[:\-]?\s*([0-9.]+)/i,              label:"pH",          lo:7.2,  hi:7.6  },
    { re:/hgb\s*[:\-]?\s*([0-9.]+)/i,             label:"Hgb",         lo:7.0,  hi:null },
    { re:/inr\s*[:\-]?\s*([0-9.]+)/i,             label:"INR",         lo:null, hi:4.0  },
    { re:/wbc\s*[:\-]?\s*([0-9.]+)/i,             label:"WBC",         lo:null, hi:30   },
  ];
  rules.forEach(({ re, label, lo, hi }) => {
    const m = labsText.match(re);
    if (!m) return;
    const val = parseFloat(m[1]);
    if (isNaN(val)) return;
    if ((lo !== null && val < lo) || (hi !== null && val > hi))
      flags.push({ label, value: m[1] });
  });
  return flags;
}

// ─── OPQRST gap detection ─────────────────────────────────────────────────────
const OPQRST_REQUIRED = {
  "chest pain":           ["Onset","Character","Location","Radiation","Severity","Aggravating","Relieving","Associated"],
  "shortness of breath":  ["Onset","Severity","Timing","Aggravating","Relieving","Associated"],
  "abdominal pain":       ["Onset","Character","Location","Severity","Timing","Aggravating","Relieving","Associated"],
  "headache":             ["Onset","Character","Location","Severity","Timing","Aggravating","Relieving","Associated"],
  "back pain":            ["Onset","Character","Location","Radiation","Severity","Timing","Aggravating","Relieving","Associated"],
  "dizziness":            ["Onset","Character","Timing","Aggravating","Relieving","Associated"],
  "syncope":              ["Onset","Timing","Associated"],
  "palpitations":         ["Onset","Character","Timing","Aggravating","Relieving","Associated"],
  "altered mental status":["Onset","Character","Associated"],
  "fever":                ["Onset","Associated"],
  "nausea":               ["Onset","Timing","Aggravating","Relieving","Associated"],
};
const OPQRST_DEFAULT = ["Onset","Severity","Associated"];

export function getExpectedOPQRST(ccText) {
  const lower = (ccText || "").toLowerCase();
  for (const [key, fields] of Object.entries(OPQRST_REQUIRED)) {
    if (lower.includes(key)) return fields;
  }
  return OPQRST_DEFAULT;
}

// ─── Slot serialization ───────────────────────────────────────────────────────
export function serializeSlot(slotState, idx) {
  const { cc="",vitals="",hpi="",ros="",exam="",labs="",imaging="",ekg="",newVitals="",
    medsRaw="",allergiesRaw="",parsedMeds=[],parsedAllergies=[],
    mdmResult=null,dispResult=null,icdSelected=[],interventions=[],
    hpiSummary=null,hpiMode="original",encounterType="adult",
    patientName="",patientAge="" } = slotState;
  const blob = JSON.stringify({ vitals,ekg,newVitals,medsRaw,allergiesRaw,
    parsedMeds,parsedAllergies,mdmResult,dispResult,icdSelected,interventions,
    hpiSummary,hpiMode,encounterType,patientName,patientAge });
  return { source:"QN-SlotCache", status:"active",
    patient_identifier:`slot:${idx}`,
    encounter_date:new Date().toISOString().split("T")[0],
    cc,hpi_raw:hpi,ros_raw:ros,exam_raw:exam,labs_raw:labs,imaging_raw:imaging,
    full_note_text:vitals, working_diagnosis:mdmResult?.working_diagnosis||"",
    mdm_level:mdmResult?.mdm_level||"",mdm_narrative:mdmResult?.mdm_narrative||"",
    meds_raw:medsRaw,allergies_raw:allergiesRaw,raw_note:blob };
}

export function deserializeSlot(record) {
  let blob = {};
  try { blob = JSON.parse(record.raw_note||"{}"); } catch {}
  return { cc:record.cc||"",hpi:record.hpi_raw||"",ros:record.ros_raw||"",
    exam:record.exam_raw||"",labs:record.labs_raw||"",imaging:record.imaging_raw||"",
    vitals:blob.vitals||record.full_note_text||"",ekg:blob.ekg||"",
    newVitals:blob.newVitals||"",medsRaw:blob.medsRaw||"",allergiesRaw:blob.allergiesRaw||"",
    parsedMeds:blob.parsedMeds||[],parsedAllergies:blob.parsedAllergies||[],
    mdmResult:blob.mdmResult||null,dispResult:blob.dispResult||null,
    icdSelected:blob.icdSelected||[],interventions:blob.interventions||[],
    hpiSummary:blob.hpiSummary||null,hpiMode:blob.hpiMode||"original",
    encounterType:blob.encounterType||"adult",patientName:blob.patientName||"",
    patientAge:blob.patientAge||"",p2Open:!!(blob.mdmResult),
    savedNoteId:null,lastActivity:Date.now() };
}