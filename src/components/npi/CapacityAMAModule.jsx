// CapacityAMAModule.jsx
// Structured capacity assessment (four Appelbaum criteria) and
// Against Medical Advice (AMA) / refusal of care documentation.
// Generates medicolegally complete notes for both scenarios.

import { useState, useCallback, useMemo } from "react";

const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444",
};

const CRITERIA = [
  {
    id:"understand",
    label:"Understanding",
    criterion:"Patient demonstrates understanding of the medical information provided",
    prompts:[
      "Patient was informed of their diagnosis and its implications",
      "Explained in plain language appropriate to patient's level",
      "Patient was able to restate the diagnosis and condition in own words",
    ],
    assessment:[
      { label:"Demonstrated — repeated information accurately", value:"demonstrated" },
      { label:"Partial — understood main points, not all details", value:"partial"     },
      { label:"Absent — unable to restate diagnosis or condition", value:"absent"      },
    ],
    color:T.blue, icon:"📖",
  },
  {
    id:"appreciate",
    label:"Appreciation",
    criterion:"Patient appreciates how the information applies to their own situation",
    prompts:[
      "Patient was informed of the likely consequences of refusing treatment",
      "Risks of leaving AMA including specific harms relevant to their condition",
      "Benefits of the recommended treatment were explained",
    ],
    assessment:[
      { label:"Demonstrated — acknowledged risks apply to their situation", value:"demonstrated" },
      { label:"Partial — acknowledges some consequences but minimizes others", value:"partial"     },
      { label:"Absent — denies illness applies to them or consequences are irrelevant", value:"absent" },
    ],
    color:T.purple, icon:"🪞",
  },
  {
    id:"reason",
    label:"Reasoning",
    criterion:"Patient can reason through the decision using logical thought processes",
    prompts:[
      "Patient was asked to explain their reasoning for the decision",
      "Patient was able to weigh benefits and risks in a coherent manner",
      "Reasoning was not driven solely by delusions or fixed irrational beliefs",
    ],
    assessment:[
      { label:"Demonstrated — coherent logic even if disagrees with recommendation", value:"demonstrated" },
      { label:"Partial — reasoning present but affected by cognitive impairment or distress", value:"partial" },
      { label:"Absent — reasoning driven by psychosis, delusion, or severe cognitive deficit", value:"absent" },
    ],
    color:T.orange, icon:"🧠",
  },
  {
    id:"express",
    label:"Expression of Choice",
    criterion:"Patient is able to communicate a consistent and stable choice",
    prompts:[
      "Patient expressed a clear and unambiguous decision",
      "Decision was stable over the period of assessment (not fluctuating)",
      "Choice was not coerced by external parties",
    ],
    assessment:[
      { label:"Demonstrated — clear, consistent, and freely expressed", value:"demonstrated" },
      { label:"Partial — expressed but inconsistent across the encounter", value:"partial"     },
      { label:"Absent — unable to communicate or severely inconsistent", value:"absent"       },
    ],
    color:T.teal, icon:"🗣️",
  },
];

function determineCapacity(criteria) {
  const vals = criteria.map(c => c.value);
  if (vals.every(v => v === "demonstrated"))
    return { has:true,  level:"full",    label:"Capacity Present",      color:T.green };
  if (vals.some(v => v === "absent"))
    return { has:false, level:"absent",  label:"Capacity Questionable", color:T.coral };
  if (vals.some(v => v === "partial"))
    return { has:null,  level:"partial", label:"Capacity Uncertain",    color:T.gold  };
  return   { has:null,  level:"unknown", label:"Assessment Incomplete", color:T.txt4  };
}

function buildCapacityNote(mode, criteriaState, notes, amaFields, demo, cc, providerName, ts) {
  const patient = [demo?.firstName, demo?.lastName].filter(Boolean).join(" ") || "Patient";
  const pron    = (demo?.sex||"").toLowerCase() === "f" ? "She" : "He";
  const pronL   = pron.toLowerCase();
  const cap     = determineCapacity(criteriaState);

  const criteriaLines = CRITERIA.map(cr => {
    const val  = criteriaState.find(c => c.id === cr.id)?.value || "not assessed";
    const note = notes[cr.id] || "";
    return `${cr.label.toUpperCase()} (${val}): ${note || "See assessment details."}`;
  }).join("\n");

  if (mode === "capacity") {
    return `CAPACITY ASSESSMENT NOTE
Date/Time: ${ts}
Physician: ${providerName || "[Physician]"}
Patient: ${patient}
Chief Complaint / Reason for Assessment: ${cc?.text || "[reason]"}

ASSESSMENT OF DECISION-MAKING CAPACITY

${patient} was assessed for decision-making capacity using the Appelbaum four-criteria framework.

${criteriaLines}

CAPACITY DETERMINATION: ${cap.label.toUpperCase()}

${cap.has === true
  ? `${patient} demonstrates intact decision-making capacity. ${pron} was able to understand the relevant medical information, appreciate its application to ${pronL}self, reason through the decision logically, and express a consistent choice. ${pron} has the right to make autonomous medical decisions including refusal of recommended treatment.`
  : cap.has === false
  ? `${patient} does not demonstrate decision-making capacity at this time based on the above assessment. The primary deficit is noted in the criteria above. A surrogate decision-maker should be identified. Psychiatric consultation and/or ethics committee involvement should be considered if the situation is non-emergent. In an emergency, proceed with treatment in the patient's best interest.`
  : `Decision-making capacity is uncertain and requires further assessment. Psychiatric consultation is recommended. If decision is urgent, proceed cautiously with the most conservative management option.`}

Attending Physician: ${providerName || "[Physician]"}
Date/Time: ${ts}`;
  }

  const risks  = amaFields.risks        || "[specific risks of leaving against medical advice]";
  const dx     = amaFields.diagnosis    || (cc?.text ? cc.text : "[diagnosis/condition]");
  const rec    = amaFields.recommendation || "[recommended treatment or admission]";
  const reason = amaFields.reason       || "[patient-stated reason for leaving]";
  const contact= amaFields.returnContact || "[return instructions provided]";

  return `AGAINST MEDICAL ADVICE DOCUMENTATION
Date/Time: ${ts}
Physician: ${providerName || "[Physician]"}
Patient: ${patient}
Chief Complaint / Diagnosis: ${dx}

CLINICAL CONTEXT
${patient} presented to the Emergency Department with ${cc?.text || "[chief complaint]"} and was evaluated and found to have ${dx}. The recommended management was ${rec}.

INFORMED REFUSAL
After a thorough discussion with the patient, ${patient} declined the recommended treatment and expressed the desire to leave against medical advice. The following was explicitly discussed:

  1. DIAGNOSIS: ${patient} was informed of the diagnosis of ${dx}.
  2. RECOMMENDED TREATMENT: ${rec} was explained and recommended.
  3. RISKS OF REFUSAL: ${risks}
  4. ALTERNATIVES: Alternative management options were discussed and found to be insufficient to address the clinical concern.
  5. FOLLOW-UP: ${contact}

PATIENT RESPONSE
${patient} acknowledged understanding of the above risks and stated: "${reason}." ${pron} demonstrated decision-making capacity as documented in the capacity assessment and expressed a clear, consistent, and freely made decision to leave.

CAPACITY: ${cap.has !== false ? "Patient demonstrated decision-making capacity at the time of this discussion." : "Capacity concerns noted (see capacity assessment). Decision made to respect patient autonomy while documenting concerns."}

DOCUMENTATION
${patient} was offered and ${amaFields.formSigned ? "signed" : "declined to sign"} the AMA form. The AMA form was witnessed by ${amaFields.witness || "[witness name]"}. ${patient} was given written return precautions and instructed to call 911 or return to the ED immediately if ${amaFields.returnPrec || "symptoms worsen or new concerning symptoms develop"}.

Attending Physician: ${providerName || "[Physician]"}
Date/Time: ${ts}`;
}

function CriterionRow({ cr, state, onUpdate, noteVal, onNote }) {
  const [open, setOpen] = useState(false);
  const col = state?.value === "demonstrated" ? T.green :
              state?.value === "partial"       ? T.gold  :
              state?.value === "absent"        ? T.coral : T.txt4;

  return (
    <div style={{ marginBottom:8, borderRadius:10, overflow:"hidden",
      border:`1px solid ${state?.value ? col+"55" : "rgba(26,53,85,0.4)"}`,
      borderLeft:`4px solid ${cr.color}` }}>

      <div style={{ display:"flex", alignItems:"center", gap:10,
        padding:"9px 12px", cursor:"pointer",
        background:`linear-gradient(135deg,${cr.color}09,rgba(8,22,40,0.9))` }}
        onClick={() => setOpen(p => !p)}>
        <span style={{ fontSize:16, flexShrink:0 }}>{cr.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Playfair Display',serif",
            fontWeight:700, fontSize:13, color:cr.color }}>
            {cr.label}
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
            color:T.txt4, marginTop:1 }}>{cr.criterion}</div>
        </div>
        {state?.value && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            fontWeight:700, letterSpacing:1, textTransform:"uppercase",
            padding:"2px 8px", borderRadius:4,
            background:`${col}15`, border:`1px solid ${col}40`,
            color:col, flexShrink:0 }}>
            {state.value}
          </span>
        )}
        <span style={{ color:T.txt4, fontSize:10, flexShrink:0 }}>
          {open ? "▲" : "▼"}
        </span>
      </div>

      {open && (
        <div style={{ padding:"10px 12px",
          borderTop:"1px solid rgba(26,53,85,0.3)",
          background:"rgba(8,22,40,0.6)" }}>

          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>
            Assessment Prompts Used
          </div>
          <div style={{ marginBottom:10 }}>
            {cr.prompts.map((p, i) => (
              <div key={i} style={{ display:"flex", gap:5, alignItems:"flex-start", marginBottom:3 }}>
                <span style={{ color:cr.color, fontSize:7, marginTop:3, flexShrink:0 }}>▸</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif",
                  fontSize:10, color:T.txt3, lineHeight:1.5 }}>{p}</span>
              </div>
            ))}
          </div>

          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>
            Finding
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:10 }}>
            {cr.assessment.map(opt => {
              const optCol = opt.value==="demonstrated" ? T.green : opt.value==="partial" ? T.gold : T.coral;
              const active = state?.value === opt.value;
              return (
                <button key={opt.value}
                  onClick={() => onUpdate({ id:cr.id, value:opt.value })}
                  style={{ display:"flex", alignItems:"center", gap:8,
                    padding:"7px 10px", borderRadius:7, cursor:"pointer",
                    textAlign:"left", transition:"all .12s",
                    border:`1px solid ${active ? optCol+"66" : "rgba(26,53,85,0.35)"}`,
                    background:active
                      ? opt.value==="demonstrated" ? "rgba(61,255,160,0.1)"
                        : opt.value==="partial"    ? "rgba(245,200,66,0.1)"
                                                   : "rgba(255,107,107,0.1)"
                      : "rgba(8,22,40,0.4)" }}>
                  <div style={{ width:14, height:14, borderRadius:"50%", flexShrink:0,
                    border:`2px solid ${active ? optCol : "rgba(42,79,122,0.5)"}`,
                    background:active ? optCol : "transparent" }} />
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    color:active ? T.txt : T.txt3 }}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>
            Clinician Notes (optional)
          </div>
          <textarea value={noteVal} onChange={e => onNote(cr.id, e.target.value)}
            rows={2} placeholder="Document specific patient responses or behaviors..."
            style={{ width:"100%", resize:"vertical",
              background:"rgba(14,37,68,0.7)",
              border:`1px solid ${noteVal ? cr.color+"44" : "rgba(42,79,122,0.3)"}`,
              borderRadius:7, padding:"7px 9px", outline:"none",
              fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:T.txt, lineHeight:1.5 }} />
        </div>
      )}
    </div>
  );
}

export default function CapacityAMAModule({
  demo, cc, vitals, mdmState, providerName,
  onToast, embedded = false,
}) {
  const [mode,          setMode]          = useState("capacity");
  const [criteriaState, setCriteriaState] = useState([]);
  const [notes,         setNotes]         = useState({});
  const [amaFields,     setAmaFields]     = useState({
    diagnosis:"", recommendation:"", risks:"", reason:"",
    returnContact:"Return to ED if symptoms worsen or you develop new concerns",
    returnPrec:"", formSigned:false, witness:"",
  });
  const [note,   setNote]   = useState("");
  const [copied, setCopied] = useState(false);

  const setAmaField = useCallback((k, v) =>
    setAmaFields(p => ({ ...p, [k]:v })), []);

  const updateCriterion = useCallback((update) =>
    setCriteriaState(p => {
      const idx = p.findIndex(c => c.id === update.id);
      if (idx >= 0) { const next = [...p]; next[idx] = update; return next; }
      return [...p, update];
    }), []);

  const updateNote = useCallback((id, val) =>
    setNotes(p => ({ ...p, [id]:val })), []);

  const cap = useMemo(() =>
    determineCapacity(CRITERIA.map(cr => ({
      ...cr, value: criteriaState.find(c => c.id === cr.id)?.value,
    }))),
    [criteriaState]
  );

  const assessed = criteriaState.filter(c => c.value).length;

  const buildNote = useCallback(() => {
    const ts   = new Date().toLocaleString("en-US", { hour12:false });
    const full = buildCapacityNote(
      mode,
      CRITERIA.map(cr => ({ id:cr.id, value:criteriaState.find(c=>c.id===cr.id)?.value || "not assessed" })),
      notes, amaFields, demo, cc, providerName, ts
    );
    setNote(full);
  }, [mode, criteriaState, notes, amaFields, demo, cc, providerName]);

  const copyNote = useCallback(() => {
    navigator.clipboard.writeText(note).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      onToast?.("Note copied", "success");
    });
  }, [note, onToast]);

  const inputStyle = (val) => ({
    width:"100%", padding:"7px 10px",
    background:"rgba(14,37,68,0.75)",
    border:`1px solid ${val ? "rgba(42,122,160,0.5)" : "rgba(26,53,85,0.4)"}`,
    borderRadius:7, outline:"none",
    fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt,
  });

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", color:T.txt }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center",
        gap:10, marginBottom:12, flexWrap:"wrap" }}>
        <div style={{ flex:1 }}>
          {!embedded && (
            <div style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:17, color:T.gold, marginBottom:2 }}>
              Capacity & AMA Documentation
            </div>
          )}
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4 }}>
            Appelbaum four criteria · Medicolegal note generation
          </div>
        </div>
        <div style={{ display:"flex", gap:5 }}>
          {[
            { id:"capacity", label:"Capacity Assessment", color:T.blue  },
            { id:"ama",      label:"AMA / Refusal",       color:T.coral },
          ].map(m => (
            <button key={m.id} onClick={() => { setMode(m.id); setNote(""); }}
              style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                fontSize:11, padding:"6px 14px", borderRadius:8,
                cursor:"pointer", transition:"all .15s",
                border:`1px solid ${mode===m.id ? m.color+"66" : "rgba(42,79,122,0.35)"}`,
                background:mode===m.id ? `${m.color}15` : "transparent",
                color:mode===m.id ? m.color : T.txt4 }}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CAPACITY MODE ── */}
      {mode === "capacity" && (
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10,
            padding:"10px 14px", borderRadius:10, marginBottom:12,
            background:`${cap.color}10`,
            border:`1px solid ${cap.color}44` }}>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'Playfair Display',serif",
                fontWeight:700, fontSize:15, color:cap.color }}>
                {cap.label}
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                color:T.txt4, marginTop:1 }}>
                {assessed}/4 criteria assessed
              </div>
            </div>
            <div style={{ display:"flex", gap:5 }}>
              {CRITERIA.map(cr => {
                const v = criteriaState.find(c => c.id === cr.id)?.value;
                return (
                  <div key={cr.id} style={{ width:10, height:10, borderRadius:"50%",
                    background: v==="demonstrated" ? T.green :
                                v==="partial"       ? T.gold  :
                                v==="absent"        ? T.coral : T.txt4 }} />
                );
              })}
            </div>
          </div>

          {CRITERIA.map(cr => (
            <CriterionRow
              key={cr.id} cr={cr}
              state={criteriaState.find(c => c.id === cr.id)}
              onUpdate={updateCriterion}
              noteVal={notes[cr.id] || ""}
              onNote={updateNote} />
          ))}

          {cap.has === false && (
            <div style={{ padding:"9px 12px", borderRadius:8,
              marginBottom:10, marginTop:2,
              background:"rgba(255,107,107,0.08)",
              border:"1px solid rgba(255,107,107,0.3)",
              fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:T.coral, lineHeight:1.6 }}>
              Capacity questionable — consider psychiatry consult, identify surrogate decision-maker, and document clearly. In emergency, act in patient's best interest.
            </div>
          )}
        </div>
      )}

      {/* ── AMA MODE ── */}
      {mode === "ama" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
            {[
              { key:"diagnosis",      label:"Diagnosis / Condition",        ph:"e.g. NSTEMI, sepsis, unstable fracture"      },
              { key:"recommendation", label:"Recommended Treatment",        ph:"e.g. hospital admission, IV antibiotics"     },
              { key:"risks",          label:"Specific Risks of Leaving",    ph:"e.g. death, MI, septic shock, limb loss"     },
              { key:"reason",         label:"Patient-Stated Reason",        ph:"e.g. needs to get home for family emergency" },
              { key:"returnContact",  label:"Return / Follow-up Instructions", ph:"Return to ED if..."                       },
              { key:"witness",        label:"Witness to Conversation",      ph:"Nurse name or staff witness"                 },
            ].map(f => (
              <div key={f.key}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:T.txt4, letterSpacing:1.2, textTransform:"uppercase", marginBottom:4 }}>
                  {f.label}
                </div>
                <input value={amaFields[f.key]}
                  onChange={e => setAmaField(f.key, e.target.value)}
                  placeholder={f.ph} style={inputStyle(amaFields[f.key])} />
              </div>
            ))}
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <button onClick={() => setAmaField("formSigned", !amaFields.formSigned)}
              style={{ display:"flex", alignItems:"center", gap:7,
                padding:"7px 14px", borderRadius:8, cursor:"pointer",
                transition:"all .15s",
                border:`1px solid ${amaFields.formSigned ? T.teal+"66" : "rgba(42,79,122,0.4)"}`,
                background:amaFields.formSigned ? "rgba(0,229,192,0.1)" : "rgba(42,79,122,0.15)",
                color:amaFields.formSigned ? T.teal : T.txt4,
                fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11 }}>
              <div style={{ width:14, height:14, borderRadius:3,
                border:`2px solid ${amaFields.formSigned ? T.teal : "rgba(42,79,122,0.5)"}`,
                background:amaFields.formSigned ? T.teal : "transparent",
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                {amaFields.formSigned && (
                  <span style={{ color:T.bg, fontSize:9, fontWeight:900 }}>v</span>
                )}
              </div>
              AMA form signed by patient
            </button>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4 }}>
              {amaFields.formSigned ? "Signed" : "Declined to sign — document reason"}
            </span>
          </div>

          <div style={{ padding:"9px 12px", borderRadius:8, marginBottom:10,
            background:"rgba(59,158,255,0.07)",
            border:"1px solid rgba(59,158,255,0.25)" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.blue, letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>
              Capacity for AMA Decision
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:T.txt2, lineHeight:1.6 }}>
              {assessed >= 4
                ? `Capacity assessed (${cap.label}) — see Capacity Assessment tab for full documentation.`
                : "Complete Capacity Assessment to document basis for AMA decision. Capacity documentation is essential for AMA medicolegal defensibility."}
            </div>
          </div>
        </div>
      )}

      {/* Build note */}
      <div style={{ display:"flex", gap:7, marginTop:10 }}>
        <button onClick={buildNote}
          style={{ flex:1, padding:"10px 0", borderRadius:10,
            cursor:"pointer", transition:"all .15s",
            border:`1px solid ${mode==="capacity" ? "rgba(59,158,255,0.5)" : "rgba(255,107,107,0.5)"}`,
            background:mode==="capacity"
              ? "linear-gradient(135deg,rgba(59,158,255,0.15),rgba(59,158,255,0.05))"
              : "linear-gradient(135deg,rgba(255,107,107,0.15),rgba(255,107,107,0.05))",
            color:mode==="capacity" ? T.blue : T.coral,
            fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:13 }}>
          Build {mode === "capacity" ? "Capacity Assessment" : "AMA Refusal"} Note
        </button>
        {note && (
          <button onClick={copyNote}
            style={{ padding:"10px 20px", borderRadius:10, cursor:"pointer",
              transition:"all .15s",
              border:`1px solid ${copied ? T.green+"66" : "rgba(42,79,122,0.4)"}`,
              background:copied ? "rgba(61,255,160,0.1)" : "rgba(42,79,122,0.15)",
              color:copied ? T.green : T.txt4,
              fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12 }}>
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>

      {/* Note output */}
      {note && (
        <div style={{ marginTop:10 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.teal, letterSpacing:1.5, textTransform:"uppercase", marginBottom:5 }}>
            {mode === "capacity" ? "Capacity Assessment Note" : "AMA Refusal Documentation"}
          </div>
          <pre style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
            color:T.txt3, lineHeight:1.65,
            background:"rgba(5,15,30,0.9)",
            border:"1px solid rgba(42,79,122,0.4)",
            borderRadius:10, padding:"12px 14px",
            whiteSpace:"pre-wrap", wordBreak:"break-word",
            overflowY:"auto", maxHeight:400 }}>
            {note}
          </pre>
          <div style={{ marginTop:5, fontFamily:"'JetBrains Mono',monospace", fontSize:7.5,
            color:"rgba(42,79,122,0.5)", letterSpacing:1 }}>
            NOTRYA CAPACITY/AMA · BASED ON APPELBAUM 1988 CRITERIA · PHYSICIAN REVIEW AND SIGNATURE REQUIRED
          </div>
        </div>
      )}
    </div>
  );
}