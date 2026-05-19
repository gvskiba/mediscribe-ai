import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Flat index: keyword/tag -> array of reference IDs
// This mirrors commandkit_reference.js tags so we can match without importing frontend code
const REFERENCE_INDEX = {
  "chest pain":         ["heart_score", "perc_rule", "wells_pe", "stemi_criteria"],
  "acs":                ["heart_score", "stemi_criteria", "chadsvasc"],
  "mace":               ["heart_score"],
  "troponin":           ["heart_score"],
  "cardiac":            ["heart_score", "stemi_criteria", "chadsvasc"],
  "pe":                 ["perc_rule", "wells_pe"],
  "pulmonary embolism": ["perc_rule", "wells_pe"],
  "dyspnea":            ["perc_rule", "wells_pe", "curb65"],
  "dvt":                ["wells_pe"],
  "sepsis":             ["qsofa", "curb65"],
  "infection":          ["qsofa", "curb65"],
  "shock":              ["qsofa"],
  "pneumonia":          ["curb65", "qsofa"],
  "cap":                ["curb65"],
  "c-spine":            ["nexus"],
  "cervical":           ["nexus"],
  "trauma":             ["nexus", "gcs", "rule_of_nines", "ottawa_ankle"],
  "tia":                ["abcd2", "chadsvasc"],
  "stroke":             ["abcd2", "tpa_checklist", "hunt_hess", "chadsvasc"],
  "tpa":                ["tpa_checklist"],
  "alteplase":          ["tpa_checklist"],
  "thrombolysis":       ["tpa_checklist"],
  "stemi":              ["stemi_criteria", "heart_score"],
  "st elevation":       ["stemi_criteria"],
  "mi":                 ["stemi_criteria", "heart_score"],
  "ecg":                ["stemi_criteria", "heart_score"],
  "pci":                ["stemi_criteria"],
  "ankle":              ["ottawa_ankle"],
  "foot":               ["ottawa_ankle"],
  "fracture":           ["ottawa_ankle", "nexus"],
  "orthopedic":         ["ottawa_ankle"],
  "dka":                ["dka_criteria"],
  "diabetic ketoacidosis": ["dka_criteria"],
  "ketoacidosis":       ["dka_criteria"],
  "diabetes":           ["dka_criteria", "chadsvasc"],
  "glucose":            ["dka_criteria"],
  "acidosis":           ["dka_criteria"],
  "gcs":                ["gcs"],
  "consciousness":      ["gcs"],
  "ams":                ["gcs"],
  "tbi":                ["gcs", "nexus"],
  "intubation":         ["gcs"],
  "sah":                ["hunt_hess"],
  "subarachnoid":       ["hunt_hess"],
  "headache":           ["hunt_hess"],
  "aneurysm":           ["hunt_hess"],
  "burns":              ["rule_of_nines"],
  "tbsa":               ["rule_of_nines"],
  "burn":               ["rule_of_nines"],
  "afib":               ["chadsvasc"],
  "atrial fibrillation":["chadsvasc"],
  "anticoagulation":    ["chadsvasc"],
  "doac":               ["chadsvasc"],
  "appendicitis":       ["alvarado"],
  "abdominal pain":     ["alvarado"],
  "rlq":                ["alvarado"],
};

// Reference metadata for the response (mirrors commandkit_reference.js structure)
const REFERENCE_META = {
  heart_score:    { name: "HEART Score",                  category: "scoring",   clinicalUse: "ACS risk stratification in chest pain — predicts 30-day MACE",         hubLink: "ECGHub" },
  perc_rule:      { name: "PERC Rule",                    category: "criteria",  clinicalUse: "Rule OUT PE without imaging — low pre-test probability only",           hubLink: null },
  wells_pe:       { name: "Wells Score — PE",             category: "scoring",   clinicalUse: "Pre-test probability for pulmonary embolism",                            hubLink: null },
  qsofa:          { name: "qSOFA",                        category: "criteria",  clinicalUse: "Rapid bedside sepsis-related organ dysfunction screen",                  hubLink: "SepsisHub" },
  curb65:         { name: "CURB-65",                      category: "scoring",   clinicalUse: "Pneumonia severity — inpatient vs outpatient disposition",               hubLink: "SepsisHub" },
  nexus:          { name: "NEXUS Criteria",               category: "criteria",  clinicalUse: "Clear cervical spine clinically without imaging in blunt trauma",        hubLink: null },
  abcd2:          { name: "ABCD2 Score",                  category: "scoring",   clinicalUse: "2-day stroke risk after TIA — guides admission vs outpatient workup",    hubLink: "StrokeHub" },
  tpa_checklist:  { name: "tPA Eligibility — Ischemic Stroke", category: "checklist", clinicalUse: "Inclusion and exclusion criteria before alteplase administration",  hubLink: "StrokeHub" },
  stemi_criteria: { name: "STEMI Criteria",               category: "threshold", clinicalUse: "ECG criteria for ST-elevation MI — triggers emergent reperfusion",      hubLink: "ECGHub" },
  ottawa_ankle:   { name: "Ottawa Ankle Rules",           category: "criteria",  clinicalUse: "Need for ankle or foot X-ray after injury",                             hubLink: "OrthoHub" },
  dka_criteria:   { name: "DKA Diagnostic Criteria",      category: "criteria",  clinicalUse: "Diagnosis and severity classification of diabetic ketoacidosis",         hubLink: "ElectrolyteAcidBaseHub" },
  gcs:            { name: "Glasgow Coma Scale",           category: "scoring",   clinicalUse: "Objective level of consciousness assessment",                            hubLink: "AirwayHub" },
  hunt_hess:      { name: "Hunt & Hess Scale",            category: "scoring",   clinicalUse: "Subarachnoid hemorrhage severity — surgical risk and prognosis",         hubLink: "StrokeHub" },
  rule_of_nines:  { name: "Rule of Nines + Parkland Formula", category: "formula", clinicalUse: "Estimate TBSA burned and calculate fluid resuscitation volume",        hubLink: null },
  chadsvasc:      { name: "CHA₂DS₂-VASc Score",          category: "scoring",   clinicalUse: "Annual stroke risk in non-valvular afib — guides anticoagulation",       hubLink: "ECGHub" },
  alvarado:       { name: "Alvarado Score",               category: "scoring",   clinicalUse: "Appendicitis probability — guide CT vs surgical consult",                hubLink: null },
};

function matchReferences(textBlob) {
  const lower = textBlob.toLowerCase();
  const hitIds = new Set();
  for (const [keyword, ids] of Object.entries(REFERENCE_INDEX)) {
    if (lower.includes(keyword)) {
      ids.forEach(id => hitIds.add(id));
    }
  }
  return Array.from(hitIds).map(id => ({ id, ...REFERENCE_META[id] }));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    // Accept: diagnoses (array), assessment (string), chief_complaint (string), raw_note (string)
    const { diagnoses, assessment, chief_complaint, raw_note, noteId } = body;

    // Build a text blob from whatever is provided
    const textParts = [
      Array.isArray(diagnoses) ? diagnoses.join(' ') : (diagnoses || ''),
      assessment || '',
      chief_complaint || '',
      raw_note || '',
    ].filter(Boolean);

    // If noteId provided, also load from DB
    let noteText = textParts.join(' ');
    if (noteId && !noteText.trim()) {
      const note = await base44.entities.ClinicalNote.get(noteId);
      if (note) {
        noteText = [
          Array.isArray(note.diagnoses) ? note.diagnoses.join(' ') : '',
          note.assessment || '',
          note.chief_complaint || '',
          note.raw_note || '',
        ].filter(Boolean).join(' ');
      }
    }

    if (!noteText.trim()) {
      return Response.json({ suggestions: [] });
    }

    const matched = matchReferences(noteText);

    return Response.json({
      suggestions: matched,
      count: matched.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});