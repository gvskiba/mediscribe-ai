// QuickNoteProcedure.jsx
// Structured procedure note generator for common ED procedures
// Exported: ProcedureNoteModal

import React, { useState } from "react";

const PROCEDURES = [
  {
    id:"laceration", label:"Laceration Repair",
    fields:[
      { key:"location",    label:"Location",          ph:"e.g. Right forehead, 2cm laceration" },
      { key:"length",      label:"Length (cm)",        ph:"e.g. 2.5" },
      { key:"depth",       label:"Depth",              ph:"e.g. superficial/full-thickness/into subcutaneous fat" },
      { key:"mechanism",   label:"Mechanism",          ph:"e.g. blunt force, sharp object" },
      { key:"anesthesia",  label:"Anesthesia",         ph:"e.g. 1% lidocaine with epi 3mL local infiltration" },
      { key:"irrigation",  label:"Irrigation",         ph:"e.g. Copious NS irrigation with 18g angiocath" },
      { key:"closure",     label:"Closure",            ph:"e.g. 4-0 nylon simple interrupted x 6, Dermabond" },
      { key:"complications",label:"Complications",     ph:"None" },
      { key:"neuro",       label:"Neuro intact distal?",ph:"Sensation and motor intact" },
    ],
    template:(f) => `PROCEDURE NOTE — LACERATION REPAIR\n\nIndication: Traumatic laceration requiring repair.\nLocation: ${f.location||"___"}.\nWound description: ${f.length||"___"}cm laceration, ${f.depth||"___"} depth, ${f.mechanism||"___"} mechanism. Wound edges were examined; no foreign body, tendon, or bony involvement noted.\nNeurovascular status: ${f.neuro||"Sensation and motor function intact distal to wound"}.\nAnesthesia: ${f.anesthesia||"Local anesthetic infiltrated"}. Adequate anesthesia achieved.\nWound preparation: ${f.irrigation||"Wound copiously irrigated with normal saline"}. Wound debrided of devitalized tissue.\nClosure: ${f.closure||"___"}.\nPost-procedure: Wound re-examined. Good approximation of wound edges. Sterile dressing applied. Wound care and return precautions discussed.\nComplications: ${f.complications||"None"}.\n\nPatient tolerated procedure well.`,
  },
  {
    id:"inc_drainage", label:"Incision & Drainage",
    fields:[
      { key:"location",    label:"Location/Size",      ph:"e.g. Right axilla, 3cm fluctuant abscess" },
      { key:"anesthesia",  label:"Anesthesia",         ph:"e.g. 1% lidocaine with epi local infiltration" },
      { key:"technique",   label:"Technique",          ph:"e.g. #11 blade, cruciate incision" },
      { key:"drainage",    label:"Drainage",           ph:"e.g. ~5mL thick purulent material expressed" },
      { key:"packing",     label:"Packing",            ph:"e.g. 0.25in iodoform gauze, 6cm" },
      { key:"cx",          label:"Culture sent?",      ph:"Yes — wound culture sent" },
      { key:"abx",         label:"Antibiotics",        ph:"e.g. TMP-SMX DS BID x 5 days, or none" },
      { key:"complications",label:"Complications",     ph:"None" },
    ],
    template:(f) => `PROCEDURE NOTE — INCISION & DRAINAGE\n\nIndication: Cutaneous abscess requiring drainage.\nLocation/size: ${f.location||"___"}.\nAnesthesia: ${f.anesthesia||"Local anesthetic infiltrated"}. Adequate anesthesia achieved.\nTechnique: Area prepped with chlorhexidine. ${f.technique||"Incision made with #11 blade"}. Blunt dissection to break up loculations.\nDrainage: ${f.drainage||"Purulent material expressed and evacuated"}.\n${f.cx||"Wound culture sent"}.\nPacking: ${f.packing||"Wound packed"}.\nAntibiotics: ${f.abx||"See discharge medications"}.\nPost-procedure: Patient given wound care and follow-up instructions. Packing removal in 24-48 hours.\nComplications: ${f.complications||"None"}.\n\nPatient tolerated procedure well.`,
  },
  {
    id:"lumbar_puncture", label:"Lumbar Puncture",
    fields:[
      { key:"indication",  label:"Indication",         ph:"e.g. r/o meningitis, SAH workup" },
      { key:"position",    label:"Position",            ph:"e.g. lateral decubitus/seated" },
      { key:"level",       label:"Interspace",         ph:"e.g. L3-L4" },
      { key:"attempts",    label:"Attempts",           ph:"e.g. First attempt successful" },
      { key:"opening",     label:"Opening Pressure",   ph:"e.g. 18 cmH2O" },
      { key:"appearance",  label:"CSF Appearance",     ph:"e.g. clear, colorless, xanthochromic" },
      { key:"tubes",       label:"Tubes Sent",         ph:"e.g. Tubes 1-4: cell count, glucose/protein, culture, additional studies" },
      { key:"complications",label:"Complications",     ph:"None" },
    ],
    template:(f) => `PROCEDURE NOTE — LUMBAR PUNCTURE\n\nIndication: ${f.indication||"___"}. Risks, benefits, and alternatives discussed; written consent obtained.\nPosition: ${f.position||"Lateral decubitus"} position. Area prepped with betadine and draped sterilely.\nProcedure: Under sterile technique, ${f.level||"L3-L4"} interspace identified by anatomical landmarks. 20-gauge Quincke spinal needle advanced; free flow of CSF confirmed.\n${f.attempts||""}.\nOpening pressure: ${f.opening||"___"} cmH2O.\nCSF appearance: ${f.appearance||"___"}.\nTubes: ${f.tubes||"Tubes 1-4 collected and sent"}.\nComplications: ${f.complications||"None"}. Patient tolerated procedure well. Post-procedure neurological exam unchanged.`,
  },
  {
    id:"cardioversion", label:"Synchronized Cardioversion",
    fields:[
      { key:"indication",  label:"Indication/Rhythm",  ph:"e.g. Unstable atrial flutter with RVR" },
      { key:"consent",     label:"Consent",            ph:"e.g. Emergent/patient unable — clinical necessity" },
      { key:"sedation",    label:"Sedation",           ph:"e.g. Midazolam 2mg IV, Fentanyl 50mcg IV" },
      { key:"joules",      label:"Energy/Attempts",    ph:"e.g. 100J x1 — successful cardioversion" },
      { key:"result",      label:"Post-cardioversion",  ph:"e.g. Normal sinus rhythm at 78 bpm" },
      { key:"complications",label:"Complications",     ph:"None" },
    ],
    template:(f) => `PROCEDURE NOTE — SYNCHRONIZED CARDIOVERSION\n\nIndication: ${f.indication||"___"}. Patient hemodynamically unstable.\nConsent: ${f.consent||"Emergent cardioversion; clinical necessity superseded formal consent process"}.\nPreparation: IV access confirmed. Continuous cardiac monitoring, pulse oximetry, and BP monitoring applied. Defibrillation pads applied in anterolateral position. Resuscitation equipment at bedside.\nSedation: ${f.sedation||"___"}. Adequate sedation achieved.\nProcedure: Synchronized cardioversion performed. ${f.joules||"___"}.\nResult: ${f.result||"___"}.\nPost-procedure: Patient monitored. Vital signs stable. Repeat ECG obtained.\nComplications: ${f.complications||"None"}.\n\nPatient tolerated procedure well.`,
  },
  {
    id:"intubation", label:"Endotracheal Intubation (RSI)",
    fields:[
      { key:"indication",  label:"Indication",         ph:"e.g. Respiratory failure, GCS <8, airway protection" },
      { key:"premed",      label:"Pre-medication",     ph:"e.g. Lidocaine, Fentanyl — or none" },
      { key:"induction",   label:"Induction Agent",    ph:"e.g. Ketamine 200mg IV" },
      { key:"paralytic",   label:"Paralytic",          ph:"e.g. Succinylcholine 160mg IV" },
      { key:"blade",       label:"Blade/Device",       ph:"e.g. Mac 3 DL, video laryngoscopy" },
      { key:"tube",        label:"ETT Size/Depth",     ph:"e.g. 7.5 ETT at 23cm at lip" },
      { key:"confirmation",label:"Confirmation",       ph:"e.g. EtCO2 confirmed, bilateral BS, CXR ordered" },
      { key:"vent",        label:"Initial Vent Settings",ph:"e.g. VC-AC 500x14, FiO2 100%, PEEP 5" },
      { key:"attempts",    label:"Attempts",           ph:"e.g. First attempt, Cormack-Lehane grade I" },
      { key:"complications",label:"Complications",     ph:"None" },
    ],
    template:(f) => `PROCEDURE NOTE — RAPID SEQUENCE INTUBATION\n\nIndication: ${f.indication||"___"}. Decision made for definitive airway management.\nPreparation: Patient positioned with head of bed at 20°, ramped. IV access x2 confirmed. Monitoring applied. BVM, suction, and surgical airway equipment at bedside. Pre-oxygenation performed.\nPre-medication: ${f.premed||"None"}.\nInduction: ${f.induction||"___"}.\nParalytic: ${f.paralytic||"___"}.\nLaryngoscopy: ${f.blade||"___"} used. ${f.attempts||"First attempt"}.\nPlacement: ${f.tube||"ETT advanced"}.\nConfirmation: ${f.confirmation||"EtCO2 waveform confirmed. Bilateral breath sounds confirmed. CXR ordered"}.\nInitial ventilator settings: ${f.vent||"___"}.\nComplications: ${f.complications||"None"}.\n\nPost-intubation sedation and analgesia initiated per protocol.`,
  },
  {
    id:"fracture_reduction", label:"Fracture Reduction",
    fields:[
      { key:"fracture",    label:"Fracture",           ph:"e.g. Distal radius fracture, dorsally angulated 25°" },
      { key:"neuro_pre",   label:"Neuro exam pre",     ph:"e.g. Intact sensation, cap refill <2s" },
      { key:"analgesia",   label:"Analgesia/Sedation", ph:"e.g. Hematoma block with 5mL 1% lidocaine" },
      { key:"technique",   label:"Reduction technique", ph:"e.g. Traction-countertraction with dorsal pressure" },
      { key:"postreduction",label:"Post-reduction XR", ph:"e.g. Acceptable alignment, <5° angulation" },
      { key:"immobilization",label:"Immobilization",   ph:"e.g. Volar sugar-tong splint, well-padded" },
      { key:"neuro_post",  label:"Neuro exam post",    ph:"e.g. Intact, unchanged" },
      { key:"complications",label:"Complications",     ph:"None" },
    ],
    template:(f) => `PROCEDURE NOTE — FRACTURE REDUCTION\n\nIndication: ${f.fracture||"___"} requiring reduction.\nPre-procedure neurovascular exam: ${f.neuro_pre||"Intact"}.\nAnalgesia: ${f.analgesia||"___"}. Adequate analgesia achieved.\nTechnique: ${f.technique||"Closed reduction performed"}.\nPost-reduction imaging: ${f.postreduction||"___"}.\nImmobilization: ${f.immobilization||"___"}. Splint/cast well-padded, neurovascularly intact after application.\nPost-procedure neurovascular exam: ${f.neuro_post||"Intact, unchanged from pre-procedure"}.\nComplications: ${f.complications||"None"}.\n\nOrthopaedics follow-up arranged. Return precautions reviewed.`,
  },
];

export function ProcedureNoteModal({ onInsert, onClose }) {
  const [selected,  setSelected]  = useState(null);
  const [fields,    setFields]    = useState({});
  const [generated, setGenerated] = useState("");
  const [copied,    setCopied]    = useState(false);

  const proc = PROCEDURES.find(p => p.id === selected);

  const updateField = (key, val) => setFields(f => ({ ...f, [key]: val }));

  const generate = () => {
    if (!proc) return;
    setGenerated(proc.template(fields));
  };

  const copyAndInsert = () => {
    if (!generated) return;
    navigator.clipboard.writeText(generated);
    setCopied(true);
    if (onInsert) onInsert(generated);
    setTimeout(() => { setCopied(false); onClose(); }, 1500);
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9998,
      background:"rgba(5,15,30,.9)", display:"flex",
      alignItems:"center", justifyContent:"center",
      backdropFilter:"blur(4px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{ background:"rgba(8,22,40,.98)",
          border:"1px solid rgba(42,79,122,.6)", borderRadius:16,
          padding:"20px 24px", maxWidth:680, width:"95%",
          maxHeight:"85vh", overflowY:"auto",
          boxShadow:"0 20px 60px rgba(0,0,0,.8)" }}>

        <div style={{ display:"flex", alignItems:"center", marginBottom:16 }}>
          <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
            fontSize:16, color:"var(--qn-txt)", flex:1 }}>Procedure Note</span>
          <button onClick={onClose}
            style={{ background:"transparent", border:"none",
              cursor:"pointer", color:"var(--qn-txt4)", fontSize:18 }}>✕</button>
        </div>

        {/* Procedure picker */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:16 }}>
          {PROCEDURES.map(p => (
            <button key={p.id} onClick={() => { setSelected(p.id); setFields({}); setGenerated(""); }}
              style={{ padding:"8px 10px", borderRadius:8, cursor:"pointer", textAlign:"left",
                fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                transition:"all .12s",
                border:`1px solid ${selected===p.id ? "rgba(0,229,192,.5)" : "rgba(42,79,122,.35)"}`,
                background:selected===p.id ? "rgba(0,229,192,.12)" : "rgba(14,37,68,.5)",
                color:selected===p.id ? "var(--qn-teal)" : "var(--qn-txt3)" }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Fields */}
        {proc && (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
              {proc.fields.map(f => (
                <div key={f.key}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                    color:"var(--qn-txt4)", letterSpacing:.8, textTransform:"uppercase",
                    marginBottom:3 }}>{f.label}</div>
                  <input value={fields[f.key]||""} onChange={e => updateField(f.key, e.target.value)}
                    placeholder={f.ph}
                    style={{ width:"100%", padding:"5px 8px", borderRadius:7, fontSize:11,
                      background:"rgba(14,37,68,.8)", border:"1px solid rgba(42,79,122,.45)",
                      color:"var(--qn-txt)", fontFamily:"'DM Sans',sans-serif",
                      outline:"none", boxSizing:"border-box",
                      transition:"border-color .15s" }}
                    onFocus={e => e.target.style.borderColor="rgba(0,229,192,.5)"}
                    onBlur={e  => e.target.style.borderColor="rgba(42,79,122,.45)"} />
                </div>
              ))}
            </div>

            <button onClick={generate}
              style={{ marginBottom:12, padding:"7px 18px", borderRadius:8, cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:12,
                border:"1px solid rgba(0,229,192,.4)", background:"rgba(0,229,192,.1)",
                color:"var(--qn-teal)", transition:"all .15s" }}>
              ✦ Generate Note
            </button>
          </>
        )}

        {/* Preview */}
        {generated && (
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"var(--qn-txt4)", letterSpacing:1, textTransform:"uppercase",
              marginBottom:6 }}>Preview</div>
            <div style={{ padding:"12px 14px", borderRadius:10, whiteSpace:"pre-wrap",
              background:"rgba(14,37,68,.7)", border:"1px solid rgba(42,79,122,.4)",
              fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--qn-txt2)",
              lineHeight:1.7, marginBottom:12, maxHeight:280, overflowY:"auto" }}>
              {generated}
            </div>
            <button onClick={copyAndInsert}
              style={{ padding:"9px 24px", borderRadius:9, cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:12,
                border:`1px solid ${copied ? "rgba(61,255,160,.6)" : "rgba(0,229,192,.5)"}`,
                background:copied ? "rgba(61,255,160,.15)" : "rgba(0,229,192,.12)",
                color:copied ? "var(--qn-green)" : "var(--qn-teal)",
                transition:"all .15s" }}>
              {copied ? "✓ Copied to Clipboard" : "📋 Copy & Close"}
            </button>
            <div style={{ marginTop:6, fontFamily:"'JetBrains Mono',monospace", fontSize:7,
              color:"rgba(107,158,200,.4)", letterSpacing:.4 }}>
              Paste into EHR procedure note field — verify all fields before signing
            </div>
          </div>
        )}
      </div>
    </div>
  );
}