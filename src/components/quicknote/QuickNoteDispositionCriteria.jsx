// QuickNoteDispositionCriteria.jsx — P5: Structured Disposition Criteria Builder
import { useState } from "react";

const DISCHARGE = [
  { id:"pain",      label:"Pain / symptoms adequately controlled" },
  { id:"po",        label:"Tolerating PO (fluids, medications)" },
  { id:"ambulate",  label:"Ambulatory or at functional baseline" },
  { id:"vitals",    label:"Vital signs stable at time of discharge" },
  { id:"followup",  label:"Reliable follow-up arranged" },
  { id:"rp",        label:"Return precautions given and understood" },
  { id:"noflags",   label:"No new red flags on reassessment" },
  { id:"sdm",       label:"Disposition discussed — patient agrees" },
  { id:"meds",      label:"Medications reviewed and reconciled" },
  { id:"adult",     label:"Responsible adult accompanying (if applicable)" },
];

const ADMIT = [
  { id:"hemo",      label:"Hemodynamic instability requiring monitoring" },
  { id:"ivmeds",    label:"Requires IV medications unavailable outpatient" },
  { id:"highrisk",  label:"High-risk diagnosis requiring inpatient workup" },
  { id:"adls",      label:"Unable to perform ADLs / unsafe for discharge" },
  { id:"failed",    label:"Failed ED treatment / worsening despite therapy" },
  { id:"procedure", label:"Surgical evaluation or procedure required" },
  { id:"social",    label:"Social / safety concern precluding safe discharge" },
  { id:"pain",      label:"Pain uncontrolled on parenteral therapy" },
];

const OBSERVATION = [
  { id:"serial",    label:"Serial biomarkers / troponins ordered" },
  { id:"monitor",   label:"Symptom monitoring required > 6 hours" },
  { id:"ivfluid",   label:"IV fluids or meds expected < 24h course" },
  { id:"lowinterm", label:"Low-intermediate risk — extended observation appropriate" },
  { id:"pending",   label:"Pending imaging or procedure results" },
  { id:"sdm",       label:"Observation vs discharge discussed with patient" },
];

function buildSentence(selected, type) {
  if (!selected.length) return "";
  const list = selected.map(c => c.label.toLowerCase()).join("; ");
  if (type === "discharge")
    return `Patient was discharged in stable condition after meeting all discharge criteria, including: ${list}. Return precautions and follow-up instructions were reviewed and understood.`;
  if (type === "admit")
    return `Inpatient admission was medically necessary due to: ${list}. Inpatient level of care is required and appropriate.`;
  if (type === "observation")
    return `Patient was placed in observation status for: ${list}. Expected duration is less than 24 hours with clinical reassessment planned.`;
  return list;
}

export function DispositionCriteriaBuilder({ disposition, onAddToNote }) {
  const [checked, setChecked] = useState({});
  const [copied,  setCopied]  = useState(false);
  const [added,   setAdded]   = useState(false);

  if (!disposition) return null;

  const d = disposition.toLowerCase();
  const type     = d.includes("discharge") || d.includes("home") ? "discharge"
                 : d.includes("admit")      || d.includes("inpatient") ? "admit"
                 : d.includes("obs")        || d.includes("hold")      ? "observation"
                 : null;
  if (!type) return null;

  const criteria  = type === "discharge" ? DISCHARGE : type === "admit" ? ADMIT : OBSERVATION;
  const selected  = criteria.filter(c => checked[c.id]);
  const sentence  = buildSentence(selected, type);

  const toggle = id => setChecked(p => ({ ...p, [id]:!p[id] }));
  const selectAll = () => {
    const all = {};
    criteria.forEach(c => { all[c.id] = true; });
    setChecked(all);
  };
  const clearAll = () => setChecked({});

  const ACCENT = type === "discharge" ? "var(--qn-teal)"
               : type === "admit"      ? "var(--qn-coral)"
               : "var(--qn-purple)";
  const BD     = type === "discharge" ? "rgba(0,229,192,.25)"
               : type === "admit"      ? "rgba(255,107,107,.25)"
               : "rgba(155,109,255,.25)";
  const BG     = type === "discharge" ? "rgba(0,229,192,.04)"
               : type === "admit"      ? "rgba(255,107,107,.04)"
               : "rgba(155,109,255,.04)";
  const TITLE  = type === "discharge" ? "Discharge Criteria"
               : type === "admit"      ? "Admission Criteria"
               : "Observation Criteria";

  return (
    <div style={{ marginTop:10, borderRadius:10, overflow:"hidden", border:`1px solid ${BD}`, background:BG }}>
      {/* Header */}
      <div style={{ padding:"8px 14px", borderBottom:`1px solid ${BD}`, display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700, color:ACCENT }}>
          {TITLE}
        </span>
        <span style={{
          fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--qn-txt4)",
          letterSpacing:.5, background:"rgba(42,79,122,.3)", borderRadius:4, padding:"2px 7px",
        }}>
          {selected.length}/{criteria.length} selected
        </span>
        <div style={{ flex:1 }} />
        <button onClick={selectAll} style={{
          padding:"2px 8px", borderRadius:5, cursor:"pointer",
          fontFamily:"'JetBrains Mono',monospace", fontSize:7, fontWeight:700,
          border:`1px solid ${BD}`, background:BG, color:ACCENT, letterSpacing:.5,
        }}>Select All</button>
        <button onClick={clearAll} style={{
          padding:"2px 8px", borderRadius:5, cursor:"pointer",
          fontFamily:"'JetBrains Mono',monospace", fontSize:7,
          border:"1px solid rgba(42,79,122,.3)", background:"transparent", color:"var(--qn-txt4)",
        }}>Clear</button>
      </div>

      {/* Criteria grid */}
      <div style={{ padding:"10px 14px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"5px 12px", marginBottom:10 }}>
          {criteria.map(c => (
            <label key={c.id} style={{
              display:"flex", alignItems:"flex-start", gap:8, cursor:"pointer",
              padding:"5px 8px", borderRadius:6,
              background: checked[c.id] ? BG : "transparent",
              border: `1px solid ${checked[c.id] ? BD : "transparent"}`,
              transition:"all .12s",
            }}>
              <input
                type="checkbox"
                checked={!!checked[c.id]}
                onChange={() => toggle(c.id)}
                style={{ marginTop:2, cursor:"pointer", accentColor:ACCENT }}
              />
              <span style={{
                fontFamily:"'DM Sans',sans-serif", fontSize:12, lineHeight:1.4,
                color: checked[c.id] ? "var(--qn-txt1)" : "var(--qn-txt2)",
                transition:"color .12s",
              }}>
                {c.label}
              </span>
            </label>
          ))}
        </div>

        {/* Generated sentence */}
        {sentence && (
          <div style={{
            padding:"10px 12px", borderRadius:8,
            background:"rgba(14,37,68,.4)", border:"1px solid rgba(42,79,122,.3)", marginBottom:4,
          }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:"var(--qn-txt4)", letterSpacing:1, textTransform:"uppercase", marginBottom:5 }}>
              Generated documentation sentence
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"var(--qn-txt1)", lineHeight:1.6 }}>
              {sentence}
            </div>
            <div style={{ display:"flex", gap:8, marginTop:8 }}>
              {onAddToNote && (
                <button onClick={() => { onAddToNote(sentence); setAdded(true); setTimeout(()=>setAdded(false),2500); }}
                  disabled={added}
                  style={{
                    padding:"4px 12px", borderRadius:7, cursor:added?"default":"pointer",
                    fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
                    border:`1px solid ${added?"rgba(61,255,160,.4)":BD}`, background:added?"rgba(61,255,160,.1)":BG,
                    color:added?"var(--qn-green)":ACCENT, transition:"all .14s",
                  }}>
                  {added ? "✓ Added" : "+ Add to Disposition"}
                </button>
              )}
              <button onClick={() => {
                navigator.clipboard.writeText(sentence).then(() => {
                  setCopied(true); setTimeout(() => setCopied(false), 2000);
                });
              }} style={{
                padding:"4px 12px", borderRadius:7, cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
                border:`1px solid ${copied?"rgba(61,255,160,.4)":"rgba(42,79,122,.35)"}`,
                background:copied?"rgba(61,255,160,.1)":"transparent",
                color:copied?"var(--qn-green)":"var(--qn-txt3)", transition:"all .14s",
              }}>
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}