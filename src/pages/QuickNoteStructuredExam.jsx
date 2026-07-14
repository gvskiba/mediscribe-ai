// QuickNoteStructuredExam.jsx  v15.0
// Structured one-tap ROS and PE toggle UI for high-volume CCs
// Named exports: ROSStructured, PEStructured, STRUCTURED_ROS, STRUCTURED_PE,
//                hasStructuredROS, hasStructuredPE
//
// Architecture:
//   - Each finding cycles: "(+)" → "(-)" → "N/A" → "(+)"
//   - N/A findings are omitted from the generated note text
//   - Generated text format matches physician charting exactly
//   - Free-text override textarea always available beneath the toggle UI
//   - "Use free text" toggle switches to plain textarea for edge cases
//
// CCs with structured data: chest_pain, shortness_of_breath, altered_mental_status

import { useState, useCallback, useEffect } from "react";

// ─── STRUCTURED ROS DEFINITIONS ───────────────────────────────────────────────
// Each system: { system, findings: [{ id, label, defaultState }] }
// defaultState: "pos" | "neg" | "na"

export const STRUCTURED_ROS = {

  chest_pain: [
    {
      system: "Constitutional",
      findings: [
        { id: "diaphoresis",   label: "Diaphoresis",        defaultState: "neg" },
        { id: "fatigue",       label: "Fatigue",            defaultState: "na"  },
        { id: "fever",         label: "Fever",              defaultState: "neg" },
        { id: "chills",        label: "Chills",             defaultState: "neg" },
      ],
    },
    {
      system: "Cardiovascular",
      findings: [
        { id: "chest_pain",    label: "Chest pain",         defaultState: "pos" },
        { id: "palpitations",  label: "Palpitations",       defaultState: "neg" },
        { id: "syncope",       label: "Syncope",            defaultState: "neg" },
        { id: "near_syncope",  label: "Near-syncope",       defaultState: "neg" },
        { id: "orthopnea",     label: "Orthopnea",          defaultState: "neg" },
        { id: "pnd",           label: "PND",                defaultState: "neg" },
        { id: "leg_edema",     label: "Leg edema",          defaultState: "neg" },
      ],
    },
    {
      system: "Pulmonary",
      findings: [
        { id: "dyspnea",       label: "Dyspnea",            defaultState: "neg" },
        { id: "pleuritic",     label: "Pleuritic component",defaultState: "neg" },
        { id: "hemoptysis",    label: "Hemoptysis",         defaultState: "neg" },
        { id: "cough",         label: "Cough",              defaultState: "neg" },
      ],
    },
    {
      system: "GI",
      findings: [
        { id: "nausea",        label: "Nausea",             defaultState: "neg" },
        { id: "vomiting",      label: "Vomiting",           defaultState: "neg" },
        { id: "heartburn",     label: "Heartburn/reflux",   defaultState: "neg" },
        { id: "abdominal_pain",label: "Abdominal pain",     defaultState: "neg" },
      ],
    },
    {
      system: "Musculoskeletal",
      findings: [
        { id: "reproducible",  label: "Reproducible with palpation", defaultState: "neg" },
        { id: "pain_movement", label: "Pain with movement",          defaultState: "neg" },
        { id: "trauma",        label: "Recent trauma",               defaultState: "neg" },
      ],
    },
    {
      system: "Neurological",
      findings: [
        { id: "headache",      label: "Headache",           defaultState: "neg" },
        { id: "focal_weakness",label: "Focal weakness",     defaultState: "neg" },
        { id: "syncope_neuro", label: "Loss of consciousness", defaultState: "neg" },
      ],
    },
  ],

  shortness_of_breath: [
    {
      system: "Constitutional",
      findings: [
        { id: "fever",         label: "Fever",              defaultState: "neg" },
        { id: "chills",        label: "Chills",             defaultState: "neg" },
        { id: "fatigue",       label: "Fatigue",            defaultState: "neg" },
        { id: "diaphoresis",   label: "Diaphoresis",        defaultState: "neg" },
      ],
    },
    {
      system: "Pulmonary",
      findings: [
        { id: "dyspnea_rest",  label: "Dyspnea at rest",   defaultState: "pos" },
        { id: "dyspnea_exert", label: "Dyspnea on exertion",defaultState: "pos" },
        { id: "wheezing",      label: "Wheezing",           defaultState: "neg" },
        { id: "stridor",       label: "Stridor",            defaultState: "neg" },
        { id: "cough_prod",    label: "Productive cough",   defaultState: "neg" },
        { id: "cough_dry",     label: "Dry cough",          defaultState: "neg" },
        { id: "hemoptysis",    label: "Hemoptysis",         defaultState: "neg" },
        { id: "pleuritic",     label: "Pleuritic chest pain",defaultState: "neg"},
      ],
    },
    {
      system: "Cardiovascular",
      findings: [
        { id: "chest_pain",    label: "Chest pain",         defaultState: "neg" },
        { id: "palpitations",  label: "Palpitations",       defaultState: "neg" },
        { id: "orthopnea",     label: "Orthopnea",          defaultState: "neg" },
        { id: "pnd",           label: "PND",                defaultState: "neg" },
        { id: "leg_edema",     label: "Leg edema",          defaultState: "neg" },
      ],
    },
    {
      system: "Allergic / Immunologic",
      findings: [
        { id: "new_allergen",  label: "New food/medication/allergen exposure", defaultState: "neg" },
        { id: "urticaria",     label: "Rash or urticaria",  defaultState: "neg" },
        { id: "angioedema",    label: "Lip/tongue swelling",defaultState: "neg" },
      ],
    },
    {
      system: "Neurological",
      findings: [
        { id: "focal_weakness",label: "Focal weakness",     defaultState: "neg" },
        { id: "anxiety",       label: "Anxiety",            defaultState: "neg" },
        { id: "ams",           label: "Confusion / AMS",    defaultState: "neg" },
      ],
    },
  ],

  altered_mental_status: [
    {
      system: "Constitutional",
      findings: [
        { id: "fever",         label: "Fever",              defaultState: "neg" },
        { id: "chills",        label: "Chills",             defaultState: "neg" },
        { id: "recent_illness",label: "Recent illness",     defaultState: "neg" },
      ],
    },
    {
      system: "Neurological",
      findings: [
        { id: "headache",      label: "Headache",           defaultState: "neg" },
        { id: "seizure",       label: "Seizure activity",   defaultState: "neg" },
        { id: "focal_weakness",label: "Focal weakness",     defaultState: "neg" },
        { id: "loss_of_consc", label: "Loss of consciousness", defaultState: "neg" },
        { id: "neck_stiffness",label: "Neck stiffness",     defaultState: "neg" },
        { id: "prior_ams",     label: "Prior similar episodes", defaultState: "neg" },
      ],
    },
    {
      system: "Metabolic / Endocrine",
      findings: [
        { id: "diabetes_hx",   label: "Known diabetic",     defaultState: "na"  },
        { id: "liver_disease", label: "Liver disease / EtOH hx", defaultState: "neg" },
        { id: "dialysis",      label: "Dialysis patient",   defaultState: "neg" },
        { id: "thyroid",       label: "Thyroid disease",    defaultState: "neg" },
      ],
    },
    {
      system: "Toxicologic / Substance",
      findings: [
        { id: "etoh",          label: "Alcohol ingestion",  defaultState: "neg" },
        { id: "drug_use",      label: "Illicit substance use", defaultState: "neg" },
        { id: "medication_change", label: "New or changed medications", defaultState: "neg" },
        { id: "overdose",      label: "Medication overdose concern", defaultState: "neg" },
      ],
    },
    {
      system: "Cardiovascular",
      findings: [
        { id: "palpitations",  label: "Palpitations",       defaultState: "neg" },
        { id: "chest_pain",    label: "Chest pain",         defaultState: "neg" },
        { id: "arrhythmia_hx", label: "Known arrhythmia",   defaultState: "neg" },
      ],
    },
  ],
};

// ─── STRUCTURED PE DEFINITIONS ────────────────────────────────────────────────
// Each component: { component, findings: [{ id, label, defaultState, freeText }] }
// freeText: true = this finding has a text input for the physician to fill in
//           (used for things like "HR [VALUE]", "[DISTRESS LEVEL]")

export const STRUCTURED_PE = {

  chest_pain: [
    {
      component: "General",
      findings: [
        { id: "oriented",     label: "Alert and oriented x3",    defaultState: "pos", freeText: false },
        { id: "distress",     label: "No acute distress",        defaultState: "pos", freeText: false },
        { id: "diaphoresis",  label: "Diaphoresis",              defaultState: "neg", freeText: false },
        { id: "pallor",       label: "Pallor",                   defaultState: "neg", freeText: false },
      ],
    },
    {
      component: "Cardiovascular",
      findings: [
        { id: "rrr",          label: "Regular rate and rhythm",  defaultState: "pos", freeText: false },
        { id: "murmur",       label: "Murmur",                   defaultState: "neg", freeText: false },
        { id: "rub",          label: "Friction rub",             defaultState: "neg", freeText: false },
        { id: "gallop",       label: "S3/S4 gallop",             defaultState: "neg", freeText: false },
        { id: "jvd",          label: "JVD",                      defaultState: "neg", freeText: false },
      ],
    },
    {
      component: "Pulmonary",
      findings: [
        { id: "ctab",         label: "Clear to auscultation bilaterally", defaultState: "pos", freeText: false },
        { id: "wheezes",      label: "Wheezes",                  defaultState: "neg", freeText: false },
        { id: "rales",        label: "Rales/crackles",           defaultState: "neg", freeText: false },
        { id: "rhonchi",      label: "Rhonchi",                  defaultState: "neg", freeText: false },
        { id: "decreased_bs", label: "Decreased breath sounds",  defaultState: "neg", freeText: false },
        { id: "acc_muscle",   label: "Accessory muscle use",     defaultState: "neg", freeText: false },
      ],
    },
    {
      component: "Abdomen",
      findings: [
        { id: "soft",         label: "Soft",                     defaultState: "pos", freeText: false },
        { id: "abd_tender",   label: "Epigastric tenderness",    defaultState: "neg", freeText: false },
        { id: "pulsatile",    label: "Pulsatile mass",           defaultState: "neg", freeText: false },
      ],
    },
    {
      component: "Extremities",
      findings: [
        { id: "edema",        label: "Lower extremity edema",    defaultState: "neg", freeText: false },
        { id: "calf_tender",  label: "Calf tenderness",          defaultState: "neg", freeText: false },
        { id: "pulses",       label: "Distal pulses intact bilaterally", defaultState: "pos", freeText: false },
        { id: "cyanosis",     label: "Cyanosis",                 defaultState: "neg", freeText: false },
      ],
    },
  ],

  shortness_of_breath: [
    {
      component: "General",
      findings: [
        { id: "oriented",     label: "Alert and oriented x3",    defaultState: "pos", freeText: false },
        { id: "resp_distress",label: "Respiratory distress",     defaultState: "neg", freeText: false },
        { id: "speaks_full",  label: "Speaking in full sentences",defaultState: "pos", freeText: false },
        { id: "diaphoresis",  label: "Diaphoresis",              defaultState: "neg", freeText: false },
      ],
    },
    {
      component: "HEENT",
      findings: [
        { id: "stridor",      label: "Stridor",                  defaultState: "neg", freeText: false },
        { id: "angioedema",   label: "Angioedema (lip/tongue)",  defaultState: "neg", freeText: false },
        { id: "trachea_mid",  label: "Trachea midline",          defaultState: "pos", freeText: false },
        { id: "mm_moist",     label: "Mucous membranes moist",   defaultState: "pos", freeText: false },
      ],
    },
    {
      component: "Pulmonary",
      findings: [
        { id: "acc_muscle",   label: "Accessory muscle use",     defaultState: "neg", freeText: false },
        { id: "ctab",         label: "Clear to auscultation bilaterally", defaultState: "pos", freeText: false },
        { id: "wheezes",      label: "Wheezes",                  defaultState: "neg", freeText: false },
        { id: "rales",        label: "Rales/crackles",           defaultState: "neg", freeText: false },
        { id: "rhonchi",      label: "Rhonchi",                  defaultState: "neg", freeText: false },
        { id: "decreased_bs", label: "Decreased breath sounds",  defaultState: "neg", freeText: false },
        { id: "sym_rise",     label: "Symmetric chest rise",     defaultState: "pos", freeText: false },
      ],
    },
    {
      component: "Cardiovascular",
      findings: [
        { id: "rrr",          label: "Regular rate and rhythm",  defaultState: "pos", freeText: false },
        { id: "murmur",       label: "Murmur",                   defaultState: "neg", freeText: false },
        { id: "jvd",          label: "JVD",                      defaultState: "neg", freeText: false },
        { id: "s3",           label: "S3 gallop",                defaultState: "neg", freeText: false },
      ],
    },
    {
      component: "Extremities",
      findings: [
        { id: "edema",        label: "Lower extremity edema",    defaultState: "neg", freeText: false },
        { id: "cyanosis",     label: "Cyanosis",                 defaultState: "neg", freeText: false },
        { id: "cap_refill",   label: "Cap refill < 2 seconds",   defaultState: "pos", freeText: false },
      ],
    },
  ],

  altered_mental_status: [
    {
      component: "General",
      findings: [
        { id: "alert",        label: "Alert",                    defaultState: "pos", freeText: false },
        { id: "oriented_x4",  label: "Oriented x4 (person/place/time/situation)", defaultState: "pos", freeText: false },
        { id: "agitated",     label: "Agitated / combative",     defaultState: "neg", freeText: false },
        { id: "diaphoresis",  label: "Diaphoresis",              defaultState: "neg", freeText: false },
        { id: "toxic_appear", label: "Toxic appearing",          defaultState: "neg", freeText: false },
      ],
    },
    {
      component: "Neurological",
      findings: [
        { id: "focal_motor",  label: "Focal motor deficit",      defaultState: "neg", freeText: false },
        { id: "pupils_equal", label: "Pupils equal and reactive",defaultState: "pos", freeText: false },
        { id: "miosis",       label: "Miosis",                   defaultState: "neg", freeText: false },
        { id: "mydriasis",    label: "Mydriasis",                defaultState: "neg", freeText: false },
        { id: "nuchal_rigid", label: "Nuchal rigidity",          defaultState: "neg", freeText: false },
        { id: "asterixis",    label: "Asterixis",                defaultState: "neg", freeText: false },
        { id: "babinski",     label: "Babinski sign",            defaultState: "neg", freeText: false },
      ],
    },
    {
      component: "Toxidrome Assessment",
      findings: [
        { id: "tox_symp",     label: "Sympathomimetic signs (tachycardia/hypertension/diaphoresis/mydriasis)", defaultState: "neg", freeText: false },
        { id: "tox_opioid",   label: "Opioid signs (bradypnea/miosis/decreased consciousness)", defaultState: "neg", freeText: false },
        { id: "tox_anticholinergic", label: "Anticholinergic signs (dry/flushed/mydriasis/tachycardia)", defaultState: "neg", freeText: false },
        { id: "tox_cholinergic",     label: "Cholinergic signs (SLUDGE/miosis)",  defaultState: "neg", freeText: false },
        { id: "serotonin_sx", label: "Serotonin syndrome signs (clonus/diaphoresis/hyperthermia)", defaultState: "neg", freeText: false },
      ],
    },
    {
      component: "HEENT",
      findings: [
        { id: "head_trauma",  label: "Signs of head trauma",     defaultState: "neg", freeText: false },
        { id: "scleral_ict",  label: "Scleral icterus",          defaultState: "neg", freeText: false },
        { id: "tongue_bite",  label: "Tongue bite marks",        defaultState: "neg", freeText: false },
      ],
    },
    {
      component: "Skin",
      findings: [
        { id: "jaundice",     label: "Jaundice",                 defaultState: "neg", freeText: false },
        { id: "needle_marks", label: "IV track marks",           defaultState: "neg", freeText: false },
        { id: "rash",         label: "Rash",                     defaultState: "neg", freeText: false },
      ],
    },
  ],
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

export function hasStructuredROS(ccId) {
  return Boolean(STRUCTURED_ROS[ccId]);
}

export function hasStructuredPE(ccId) {
  return Boolean(STRUCTURED_PE[ccId]);
}

// Build initial state map from definition
function buildInitialState(sections) {
  const state = {};
  sections.forEach(section => {
    section.findings.forEach(f => {
      state[f.id] = f.defaultState; // "pos" | "neg" | "na"
    });
  });
  return state;
}

// Convert state map + sections into note text
function buildROSText(sections, state) {
  const lines = [];
  sections.forEach(section => {
    const positives = [];
    const negatives = [];
    section.findings.forEach(f => {
      if (state[f.id] === "pos") positives.push(f.label.toLowerCase());
      if (state[f.id] === "neg") negatives.push(f.label.toLowerCase());
    });
    if (positives.length === 0 && negatives.length === 0) return;
    const parts = [];
    if (positives.length) parts.push("(+) " + positives.join(", "));
    if (negatives.length) parts.push("(-) " + negatives.join(", "));
    lines.push(`${section.system}: ${parts.join(", ")}`);
  });
  return lines.join("\n");
}

function buildPEText(sections, state) {
  const lines = [];
  sections.forEach(section => {
    const positives = [];
    const negatives = [];
    section.findings.forEach(f => {
      if (state[f.id] === "pos") positives.push(f.label.toLowerCase());
      if (state[f.id] === "neg") negatives.push("no " + f.label.toLowerCase());
    });
    if (positives.length === 0 && negatives.length === 0) return;
    lines.push(`${section.component}: ${[...positives, ...negatives].join(", ")}`);
  });
  return lines.join("\n");
}

// State cycle: pos → neg → na → pos
function cycleState(current) {
  if (current === "pos") return "neg";
  if (current === "neg") return "na";
  return "pos";
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const STATE_STYLES = {
  pos: {
    border:     "1px solid rgba(61,255,160,.5)",
    background: "rgba(61,255,160,.1)",
    color:      "#3dffa0",
    label:      "(+)",
  },
  neg: {
    border:     "1px solid rgba(255,107,107,.4)",
    background: "rgba(255,107,107,.07)",
    color:      "#ff6b6b",
    label:      "(-)",
  },
  na: {
    border:     "1px solid rgba(42,79,122,.3)",
    background: "rgba(14,37,68,.4)",
    color:      "var(--qn-txt4)",
    label:      "N/A",
  },
};

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
function SectionHeader({ label, accentColor }) {
  return (
    <div style={{
      display:       "flex",
      alignItems:    "center",
      gap:           8,
      marginBottom:  6,
      paddingBottom: 4,
      borderBottom:  `1px solid ${accentColor}20`,
    }}>
      <span style={{
        fontFamily:    "'JetBrains Mono',monospace",
        fontSize:      8,
        fontWeight:    700,
        color:         accentColor,
        letterSpacing: 1,
        textTransform: "uppercase",
      }}>
        {label}
      </span>
      <div style={{ flex:1, height:1, background:`${accentColor}15` }} />
    </div>
  );
}

// ─── FINDING TOGGLE BUTTON ────────────────────────────────────────────────────
function FindingToggle({ finding, state, onToggle }) {
  const s    = STATE_STYLES[state] || STATE_STYLES.na;
  const isNA = state === "na";

  return (
    <button
      onClick={() => onToggle(finding.id)}
      title={`${finding.label} — click to cycle (+) / (-) / N/A`}
      style={{
        display:        "flex",
        alignItems:     "center",
        gap:            5,
        padding:        "4px 10px",
        borderRadius:   16,
        cursor:         "pointer",
        border:         s.border,
        background:     s.background,
        transition:     "all .12s",
        opacity:        isNA ? 0.4 : 1,
      }}
    >
      {/* State badge */}
      <span style={{
        fontFamily:  "'JetBrains Mono',monospace",
        fontSize:    9,
        fontWeight:  700,
        color:       s.color,
        flexShrink:  0,
        minWidth:    24,
        textAlign:   "center",
      }}>
        {s.label}
      </span>
      {/* Finding label */}
      <span style={{
        fontFamily:  "'DM Sans',sans-serif",
        fontSize:    11,
        color:       isNA ? "var(--qn-txt4)" : "var(--qn-txt2)",
        fontWeight:  isNA ? 400 : 500,
        transition:  "color .12s",
      }}>
        {finding.label}
      </span>
    </button>
  );
}

// ─── ROSStructured ────────────────────────────────────────────────────────────
export function ROSStructured({ ccId, value, onChange, accentColor = "var(--qn-teal)" }) {
  const sections = STRUCTURED_ROS[ccId];

  // Finding state: { [id]: "pos" | "neg" | "na" }
  const [findingState, setFindingState] = useState(() =>
    buildInitialState(sections)
  );
  const [useFreeText, setUseFreeText] = useState(false);

  // Reset when CC changes
  useEffect(() => {
    const secs = STRUCTURED_ROS[ccId];
    if (secs) {
      const init = buildInitialState(secs);
      setFindingState(init);
      // Seed the text field with the default state immediately
      onChange(buildROSText(secs, init));
    }
    setUseFreeText(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ccId]);

  const handleToggle = useCallback((id) => {
    setFindingState(prev => {
      const next = { ...prev, [id]: cycleState(prev[id]) };
      // Regenerate note text whenever state changes
      onChange(buildROSText(sections, next));
      return next;
    });
  }, [sections, onChange]);

  // Quick actions
  const setAllNeg = useCallback(() => {
    setFindingState(prev => {
      const next = { ...prev };
      sections.forEach(s => s.findings.forEach(f => { next[f.id] = "neg"; }));
      onChange(buildROSText(sections, next));
      return next;
    });
  }, [sections, onChange]);

  const resetToDefaults = useCallback(() => {
    const init = buildInitialState(sections);
    setFindingState(init);
    onChange(buildROSText(sections, init));
  }, [sections, onChange]);

  if (!sections) return null;

  return (
    <div style={{ marginBottom: 4 }}>

      {/* Mode toggle bar */}
      <div style={{
        display:      "flex",
        alignItems:   "center",
        gap:          6,
        marginBottom: 8,
        flexWrap:     "wrap",
      }}>
        <span style={{
          fontFamily:    "'JetBrains Mono',monospace",
          fontSize:      7,
          color:         "var(--qn-txt4)",
          letterSpacing: .4,
          textTransform: "uppercase",
        }}>
          ROS Mode:
        </span>
        <button
          onClick={() => setUseFreeText(false)}
          style={{
            padding:    "2px 9px",
            borderRadius: 5,
            cursor:     "pointer",
            fontFamily: "'JetBrains Mono',monospace",
            fontSize:   7,
            fontWeight: 700,
            border:     `1px solid ${!useFreeText ? accentColor + "60" : "rgba(42,79,122,.3)"}`,
            background: !useFreeText ? `${accentColor}12` : "transparent",
            color:      !useFreeText ? accentColor : "var(--qn-txt4)",
          }}
        >
          ⊞ Structured
        </button>
        <button
          onClick={() => setUseFreeText(true)}
          style={{
            padding:    "2px 9px",
            borderRadius: 5,
            cursor:     "pointer",
            fontFamily: "'JetBrains Mono',monospace",
            fontSize:   7,
            fontWeight: 700,
            border:     `1px solid ${useFreeText ? "rgba(59,158,255,.5)" : "rgba(42,79,122,.3)"}`,
            background: useFreeText ? "rgba(59,158,255,.1)" : "transparent",
            color:      useFreeText ? "var(--qn-blue)" : "var(--qn-txt4)",
          }}
        >
          ✎ Free text
        </button>
        {!useFreeText && (
          <>
            <button
              onClick={setAllNeg}
              style={{
                padding:    "2px 9px",
                borderRadius: 5,
                cursor:     "pointer",
                fontFamily: "'JetBrains Mono',monospace",
                fontSize:   7,
                fontWeight: 700,
                border:     "1px solid rgba(255,107,107,.3)",
                background: "rgba(255,107,107,.05)",
                color:      "rgba(255,107,107,.7)",
              }}
            >
              All (-)
            </button>
            <button
              onClick={resetToDefaults}
              style={{
                padding:    "2px 9px",
                borderRadius: 5,
                cursor:     "pointer",
                fontFamily: "'JetBrains Mono',monospace",
                fontSize:   7,
                fontWeight: 700,
                border:     "1px solid rgba(42,79,122,.3)",
                background: "transparent",
                color:      "var(--qn-txt4)",
              }}
            >
              Reset
            </button>
          </>
        )}
      </div>

      {/* Structured toggle UI */}
      {!useFreeText && (
        <div style={{
          padding:      "12px 14px",
          borderRadius: 10,
          background:   "rgba(14,37,68,.4)",
          border:       `1px solid ${accentColor}20`,
        }}>
          {sections.map(section => (
            <div key={section.system} style={{ marginBottom: 12 }}>
              <SectionHeader label={section.system} accentColor={accentColor} />
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {section.findings.map(finding => (
                  <FindingToggle
                    key={finding.id}
                    finding={finding}
                    state={findingState[finding.id] || "na"}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Live preview */}
          {value && (
            <div style={{
              marginTop:    10,
              padding:      "8px 10px",
              borderRadius: 7,
              background:   "rgba(8,22,40,.5)",
              border:       `1px solid ${accentColor}15`,
            }}>
              <div style={{
                fontFamily:    "'JetBrains Mono',monospace",
                fontSize:      7,
                color:         `${accentColor}70`,
                letterSpacing: .5,
                textTransform: "uppercase",
                marginBottom:  4,
              }}>
                Preview — will appear in note
              </div>
              <pre style={{
                margin:      0,
                fontFamily:  "'DM Sans',sans-serif",
                fontSize:    11,
                color:       "var(--qn-txt3)",
                lineHeight:  1.7,
                whiteSpace:  "pre-wrap",
                wordBreak:   "break-word",
              }}>
                {value}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Free text fallback */}
      {useFreeText && (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={6}
          style={{
            width:        "100%",
            boxSizing:    "border-box",
            resize:       "vertical",
            padding:      "9px 12px",
            borderRadius: 8,
            background:   "rgba(14,37,68,.6)",
            border:       "1px solid rgba(42,79,122,.4)",
            color:        "var(--qn-txt)",
            fontFamily:   "'DM Sans',sans-serif",
            fontSize:     12,
            lineHeight:   1.7,
            outline:      "none",
          }}
          onFocus={e  => { e.target.style.borderColor = `${accentColor}60`; }}
          onBlur={e   => { e.target.style.borderColor = "rgba(42,79,122,.4)"; }}
          placeholder="Review of systems — free text entry..."
        />
      )}
    </div>
  );
}

// ─── PEStructured ─────────────────────────────────────────────────────────────
export function PEStructured({ ccId, value, onChange, accentColor = "var(--qn-teal)" }) {
  const sections = STRUCTURED_PE[ccId];

  const [findingState, setFindingState] = useState(() =>
    buildInitialState(sections)
  );
  const [useFreeText, setUseFreeText] = useState(false);

  // Reset when CC changes
  useEffect(() => {
    const secs = STRUCTURED_PE[ccId];
    if (secs) {
      const init = buildInitialState(secs);
      setFindingState(init);
      onChange(buildPEText(secs, init));
    }
    setUseFreeText(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ccId]);

  const handleToggle = useCallback((id) => {
    setFindingState(prev => {
      const next = { ...prev, [id]: cycleState(prev[id]) };
      onChange(buildPEText(sections, next));
      return next;
    });
  }, [sections, onChange]);

  const setAllNormal = useCallback(() => {
    setFindingState(prev => {
      const next = { ...prev };
      sections.forEach(s => s.findings.forEach(f => {
        // "Normal" for PE = positive for normal-expected findings
        next[f.id] = f.defaultState === "pos" ? "pos" : "neg";
      }));
      onChange(buildPEText(sections, next));
      return next;
    });
  }, [sections, onChange]);

  const resetToDefaults = useCallback(() => {
    const init = buildInitialState(sections);
    setFindingState(init);
    onChange(buildPEText(sections, init));
  }, [sections, onChange]);

  if (!sections) return null;

  return (
    <div style={{ marginBottom: 4 }}>

      {/* Mode toggle bar */}
      <div style={{
        display:      "flex",
        alignItems:   "center",
        gap:          6,
        marginBottom: 8,
        flexWrap:     "wrap",
      }}>
        <span style={{
          fontFamily:    "'JetBrains Mono',monospace",
          fontSize:      7,
          color:         "var(--qn-txt4)",
          letterSpacing: .4,
          textTransform: "uppercase",
        }}>
          PE Mode:
        </span>
        <button
          onClick={() => setUseFreeText(false)}
          style={{
            padding:    "2px 9px",
            borderRadius: 5,
            cursor:     "pointer",
            fontFamily: "'JetBrains Mono',monospace",
            fontSize:   7,
            fontWeight: 700,
            border:     `1px solid ${!useFreeText ? accentColor + "60" : "rgba(42,79,122,.3)"}`,
            background: !useFreeText ? `${accentColor}12` : "transparent",
            color:      !useFreeText ? accentColor : "var(--qn-txt4)",
          }}
        >
          ⊞ Structured
        </button>
        <button
          onClick={() => setUseFreeText(true)}
          style={{
            padding:    "2px 9px",
            borderRadius: 5,
            cursor:     "pointer",
            fontFamily: "'JetBrains Mono',monospace",
            fontSize:   7,
            fontWeight: 700,
            border:     `1px solid ${useFreeText ? "rgba(59,158,255,.5)" : "rgba(42,79,122,.3)"}`,
            background: useFreeText ? "rgba(59,158,255,.1)" : "transparent",
            color:      useFreeText ? "var(--qn-blue)" : "var(--qn-txt4)",
          }}
        >
          ✎ Free text
        </button>
        {!useFreeText && (
          <>
            <button
              onClick={setAllNormal}
              style={{
                padding:    "2px 9px",
                borderRadius: 5,
                cursor:     "pointer",
                fontFamily: "'JetBrains Mono',monospace",
                fontSize:   7,
                fontWeight: 700,
                border:     "1px solid rgba(61,255,160,.3)",
                background: "rgba(61,255,160,.06)",
                color:      "rgba(61,255,160,.7)",
              }}
            >
              All normal
            </button>
            <button
              onClick={resetToDefaults}
              style={{
                padding:    "2px 9px",
                borderRadius: 5,
                cursor:     "pointer",
                fontFamily: "'JetBrains Mono',monospace",
                fontSize:   7,
                fontWeight: 700,
                border:     "1px solid rgba(42,79,122,.3)",
                background: "transparent",
                color:      "var(--qn-txt4)",
              }}
            >
              Reset
            </button>
          </>
        )}
      </div>

      {/* Structured toggle UI */}
      {!useFreeText && (
        <div style={{
          padding:      "12px 14px",
          borderRadius: 10,
          background:   "rgba(14,37,68,.4)",
          border:       `1px solid ${accentColor}20`,
        }}>
          {sections.map(section => (
            <div key={section.component} style={{ marginBottom: 12 }}>
              <SectionHeader label={section.component} accentColor={accentColor} />
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {section.findings.map(finding => (
                  <FindingToggle
                    key={finding.id}
                    finding={finding}
                    state={findingState[finding.id] || "na"}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Live preview */}
          {value && (
            <div style={{
              marginTop:    10,
              padding:      "8px 10px",
              borderRadius: 7,
              background:   "rgba(8,22,40,.5)",
              border:       `1px solid ${accentColor}15`,
            }}>
              <div style={{
                fontFamily:    "'JetBrains Mono',monospace",
                fontSize:      7,
                color:         `${accentColor}70`,
                letterSpacing: .5,
                textTransform: "uppercase",
                marginBottom:  4,
              }}>
                Preview — will appear in note
              </div>
              <pre style={{
                margin:      0,
                fontFamily:  "'DM Sans',sans-serif",
                fontSize:    11,
                color:       "var(--qn-txt3)",
                lineHeight:  1.7,
                whiteSpace:  "pre-wrap",
                wordBreak:   "break-word",
              }}>
                {value}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Free text fallback */}
      {useFreeText && (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={6}
          style={{
            width:        "100%",
            boxSizing:    "border-box",
            resize:       "vertical",
            padding:      "9px 12px",
            borderRadius: 8,
            background:   "rgba(14,37,68,.6)",
            border:       "1px solid rgba(42,79,122,.4)",
            color:        "var(--qn-txt)",
            fontFamily:   "'DM Sans',sans-serif",
            fontSize:     12,
            lineHeight:   1.7,
            outline:      "none",
          }}
          onFocus={e  => { e.target.style.borderColor = `${accentColor}60`; }}
          onBlur={e   => { e.target.style.borderColor = "rgba(42,79,122,.4)"; }}
          placeholder="Physical exam — free text entry..."
        />
      )}
    </div>
  );
}