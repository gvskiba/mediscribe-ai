// SmartDischargeHub.jsx
// AI-powered discharge instruction generator with medication reconciliation,
// Beers Criteria detection, and reading-level customization
//
// Features:
// - Medication reconciliation with duplicate detection
// - Beers Criteria flagging for elderly patients
// - Return precaution recommendations by chief complaint
// - AI-generated structured discharge documentation
// - Readability level selection (8th grade, 12th grade, college)
// - Clipboard export and print support

import { useState, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";

// ── Design tokens ──────────────────────────────────────────────────────────
const T = {
  bg:"#050d1a", panel:"#09141f",
  txt:"#eef3ff", txt2:"#a8c4e0", txt3:"#6b96bc", txt4:"#3f6585",
  teal:"#00d4b4", gold:"#f5c842", coral:"#ff5c5c", blue:"#4da6ff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff3d3d",
};

// ── Beers Criteria (High-risk meds in elderly) ─────────────────────────────
const BEERS_CRITERIA = {
  antihistamines:["diphenhydramine", "chlorpheniramine", "doxylamine"],
  antispasmodics:["hyoscyamine", "dicyclomine", "belladonna"],
  nsaids:["naproxen", "ibuprofen", "indomethacin", "ketorolac"],
  anticholinergics:["oxybutynin", "benztropine", "atropine"],
  antiarrhythmics:["disopyramide", "flecainide"],
  tricyclicAntidepressants:["amitriptyline", "imipramine", "nortriptyline"],
  opioids:["morphine", "codeine", "meperidine", "tramadol"],
  benzodiazepines:["diazepam", "lorazepam", "alprazolam", "clonazepam"],
  sedatives:["barbiturates", "zolpidem", "eszopiclone"],
};

// ── Return precautions by chief complaint ───────────────────────────────────
const RETURN_PRECAUTIONS = {
  "chest pain":[
    "Chest pain or pressure lasting > 15 minutes not relieved by rest",
    "Shortness of breath or difficulty breathing",
    "Severe or crushing chest pain",
    "Pain radiating to arm, jaw, or back",
    "Lightheadedness, dizziness, or fainting",
  ],
  "shortness of breath":[
    "Worsening shortness of breath or inability to speak full sentences",
    "Coughing up blood or blood-tinged sputum",
    "Chest pain associated with breathing",
    "Lips or fingertips turning blue",
    "Severe wheezing or stridor",
  ],
  "abdominal pain":[
    "Severe abdominal pain or sudden worsening",
    "Vomiting blood or coffee-ground material",
    "Black or tarry stools",
    "Signs of dehydration (extreme thirst, dark urine, dizziness)",
    "Fever > 101.5°F with severe pain",
  ],
  "fever":[
    "Temperature > 103°F (39.4°C)",
    "Fever lasting > 3 days despite medications",
    "Stiff neck with fever and headache",
    "Confusion or severe lethargy",
    "Difficulty breathing or chest pain with fever",
  ],
  "head injury":[
    "Loss of consciousness or confusion",
    "Severe headache not relieved by medications",
    "Vomiting or repeated nausea",
    "Slurred speech or difficulty walking",
    "Seizures or convulsions",
  ],
  default:[
    "Worsening of your primary symptoms",
    "New symptoms that concern you",
    "Signs of infection (fever, redness, warmth, drainage)",
    "Severe pain not controlled by prescribed medications",
    "Any question or concern about your care or recovery",
  ],
};

// ── Helper functions ───────────────────────────────────────────────────────
function detectBeersRisks(medications, patientAge) {
  if (patientAge < 65) return [];
  const risks = [];
  const medStr = (medications || []).join(" ").toLowerCase();
  
  Object.entries(BEERS_CRITERIA).forEach(([category, drugs]) => {
    drugs.forEach(drug => {
      if (medStr.includes(drug.toLowerCase())) {
        risks.push({ category, drug, level:"High" });
      }
    });
  });
  return risks;
}

function detectDuplicates(medications) {
  if (!medications || medications.length === 0) return [];
  const seen = {};
  const dupes = [];
  medications.forEach(med => {
    const key = med.toLowerCase().split(/\s/)[0]; // First word
    if (seen[key]) {
      dupes.push({ med1:seen[key], med2:med });
    } else {
      seen[key] = med;
    }
  });
  return dupes;
}

function getReturnPrecautions(chiefComplaint) {
  const key = chiefComplaint?.toLowerCase() || "default";
  const matches = Object.keys(RETURN_PRECAUTIONS).find(k => key.includes(k));
  return RETURN_PRECAUTIONS[matches || "default"];
}

// ── Reusable UI components ─────────────────────────────────────────────────
function Section({ title, color, children, expanded, onToggle }) {
  return (
    <div style={{ marginBottom:8, borderRadius:10, overflow:"hidden",
      border:`1px solid ${color}30`,
      borderLeft:`3px solid ${color}` }}>
      {title && (
        <button onClick={onToggle}
          style={{ display:"flex", alignItems:"center",
            justifyContent:"space-between", width:"100%",
            padding:"10px 13px", cursor:"pointer", border:"none",
            textAlign:"left", background:`${color}08`,
            transition:"background .1s" }}>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
            fontSize:13, color }}>{title}</span>
          <span style={{ color:T.txt4, fontSize:10 }}>
            {expanded ? "▲" : "▼"}
          </span>
        </button>
      )}
      {expanded !== false && (
        <div style={{ padding:"10px 13px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function MedicationRow({ med, onRemove, beersFlag }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:9,
      padding:"8px 10px", marginBottom:6, borderRadius:8,
      background:"rgba(9,20,31,0.6)", border:"1px solid rgba(30,55,85,0.4)" }}>
      <div style={{ flex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
            fontSize:12, color:T.txt2 }}>{med}</span>
          {beersFlag && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
              color:"#fff", background:T.red, borderRadius:3,
              padding:"2px 6px", fontWeight:700, textTransform:"uppercase" }}>
              Beers
            </span>
          )}
        </div>
      </div>
      <button onClick={onRemove}
        style={{ padding:"4px 10px", borderRadius:6, fontSize:11,
          cursor:"pointer", fontWeight:600,
          background:"rgba(255,61,61,0.15)", color:T.red,
          border:"1px solid rgba(255,61,61,0.3)" }}>
        Remove
      </button>
    </div>
  );
}

function TextInput({ label, value, onChange, multiline }) {
  return (
    <div style={{ marginBottom:10 }}>
      <label style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
        color:T.txt4, letterSpacing:1.2, textTransform:"uppercase",
        display:"block", marginBottom:4 }}>{label}</label>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)}
          style={{ width:"100%", minHeight:80, padding:"10px",
            background:"rgba(9,20,31,0.9)", border:"1px solid rgba(30,55,85,0.4)",
            borderRadius:8, fontFamily:"'DM Sans',sans-serif", fontSize:12,
            color:T.txt2, outline:"none", resize:"vertical" }} />
      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          style={{ width:"100%", padding:"8px 10px",
            background:"rgba(9,20,31,0.9)", border:"1px solid rgba(30,55,85,0.4)",
            borderRadius:8, fontFamily:"'DM Sans',sans-serif", fontSize:12,
            color:T.txt2, outline:"none" }} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function SmartDischargeHub({ encounter, onClose }) {
  const [meds,       setMeds]       = useState([]);
  const [newMed,     setNewMed]     = useState("");
  const [chiefComp,  setChiefComp]  = useState("");
  const [age,        setAge]        = useState("");
  const [readLevel,  setReadLevel]  = useState("12th");
  const [generated,  setGenerated]  = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [expanded,   setExpanded]   = useState({
    meds:true, precautions:true, generate:true
  });

  const beersRisks = useMemo(() =>
    detectBeersRisks(meds, parseInt(age)), [meds, age]);
  const dupes = useMemo(() => detectDuplicates(meds), [meds]);
  const returnPrecautions = useMemo(() =>
    getReturnPrecautions(chiefComp), [chiefComp]);

  const addMed = useCallback(() => {
    if (newMed.trim()) {
      setMeds(p => [...p, newMed.trim()]);
      setNewMed("");
    }
  }, [newMed]);

  const removeMed = useCallback(idx => {
    setMeds(p => p.filter((_, i) => i !== idx));
  }, []);

  const toggleExp = (key) => {
    setExpanded(p => ({...p, [key]:!p[key]}));
  };

  const generateDischarge = async () => {
    setLoading(true);
    try {
      const prompt = `Generate discharge instructions in simple ${readLevel} grade level language for a patient with chief complaint: "${chiefComp}".

Medications prescribed: ${meds.join(", ") || "None"}

Include:
1. Brief explanation of their condition
2. Medication instructions (name, dose, frequency, timing)
3. Activity restrictions and gradual return to normal
4. Warning signs to return to ED
5. Follow-up appointments and timing
6. Lifestyle modifications

Format as clear, numbered sections. Use short sentences. Avoid medical jargon.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        model:"gpt_5_mini",
      });

      setGenerated(result);
    } catch (err) {
      setGenerated(`Error generating instructions: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generated) {
      navigator.clipboard.writeText(generated);
      alert("Discharge instructions copied to clipboard");
    }
  };

  const printInstructions = () => {
    if (generated) {
      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
        <html><head><title>Discharge Instructions</title></head>
        <body style="font-family: sans-serif; line-height: 1.6; padding: 20px;">
          <h1>Discharge Instructions</h1>
          <pre style="white-space: pre-wrap; word-wrap: break-word;">${generated}</pre>
        </body></html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div style={{ background:T.bg, minHeight:"100vh", color:T.txt,
      padding:"16px" }}>
      <div style={{ maxWidth:700, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between", marginBottom:16 }}>
          <h1 style={{ fontFamily:"'Playfair Display',serif",
            fontWeight:700, fontSize:20, margin:0 }}>
            Smart Discharge Hub
          </h1>
          {onClose && (
            <button onClick={onClose}
              style={{ padding:"5px 14px", fontSize:13, fontWeight:600,
                cursor:"pointer", background:"rgba(30,55,85,0.4)",
                border:"1px solid rgba(30,55,85,0.6)",
                borderRadius:8, color:T.txt4 }}>
              ✕ Close
            </button>
          )}
        </div>

        {/* Chief complaint */}
        <TextInput label="Chief Complaint"
          value={chiefComp} onChange={setChiefComp}
          multiline={false} />

        {/* Patient age for Beers screening */}
        <TextInput label="Patient Age"
          value={age} onChange={setAge}
          multiline={false} />

        {/* Medications */}
        <Section title="Medications" color={T.blue}
          expanded={expanded.meds} onToggle={() => toggleExp("meds")}>
          <div style={{ marginBottom:10 }}>
            <div style={{ display:"flex", gap:8 }}>
              <input type="text" value={newMed}
                onChange={e => setNewMed(e.target.value)}
                placeholder="Enter medication (e.g., Lisinopril 10mg)"
                style={{ flex:1, padding:"8px 10px",
                  background:"rgba(9,20,31,0.9)",
                  border:"1px solid rgba(30,55,85,0.4)", borderRadius:8,
                  color:T.txt2, fontSize:12, outline:"none" }} />
              <button onClick={addMed}
                style={{ padding:"8px 16px", borderRadius:8, fontWeight:600,
                  cursor:"pointer", background:T.teal, color:T.bg,
                  border:"none", fontSize:12 }}>
                + Add
              </button>
            </div>
          </div>

          {/* Warnings */}
          {dupes.length > 0 && (
            <div style={{ padding:"8px 10px", borderRadius:7,
              background:"rgba(255,61,61,0.1)",
              border:"1px solid rgba(255,61,61,0.3)",
              marginBottom:10, fontSize:11, color:T.red }}>
              ⚠️ Possible duplicates detected — review medication list
            </div>
          )}

          {beersRisks.length > 0 && (
            <div style={{ padding:"8px 10px", borderRadius:7,
              background:"rgba(245,200,66,0.1)",
              border:"1px solid rgba(245,200,66,0.3)",
              marginBottom:10, fontSize:11, color:T.gold }}>
              ⚠️ {beersRisks.length} Beers Criteria medication{beersRisks.length>1?"s":""} in elderly patient
            </div>
          )}

          {/* Med list */}
          {meds.map((med, i) => (
            <MedicationRow key={i} med={med}
              onRemove={() => removeMed(i)}
              beersFlag={beersRisks.some(b => b.drug.toLowerCase().split(/\s/)[0] ===
                med.toLowerCase().split(/\s/)[0])} />
          ))}
        </Section>

        {/* Return precautions */}
        <Section title="Return Precautions" color={T.coral}
          expanded={expanded.precautions} onToggle={() => toggleExp("precautions")}>
          {returnPrecautions.map((precau, i) => (
            <div key={i} style={{ display:"flex", gap:6, marginBottom:6,
              padding:"7px 0" }}>
              <span style={{ color:T.coral, fontSize:8, marginTop:3, flexShrink:0 }}>▸</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:T.txt2, lineHeight:1.55 }}>{precau}</span>
            </div>
          ))}
        </Section>

        {/* AI generation */}
        <Section title="Generate Instructions" color={T.purple}
          expanded={expanded.generate} onToggle={() => toggleExp("generate")}>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.2, textTransform:"uppercase",
              display:"block", marginBottom:6 }}>Reading Level</label>
            <div style={{ display:"flex", gap:6 }}>
              {["8th", "12th", "college"].map(level => (
                <button key={level}
                  onClick={() => setReadLevel(level)}
                  style={{ flex:1, padding:"7px 12px", borderRadius:7,
                    cursor:"pointer", fontWeight:600, fontSize:11,
                    border:`1px solid ${readLevel===level ? T.purple : "rgba(30,55,85,0.4)"}`,
                    background:readLevel===level ? `${T.purple}15` : "transparent",
                    color:readLevel===level ? T.purple : T.txt4 }}>
                  {level} grade
                </button>
              ))}
            </div>
          </div>

          <button onClick={generateDischarge}
            disabled={loading || !chiefComp || meds.length===0}
            style={{ width:"100%", padding:"10px 16px", borderRadius:8,
              fontWeight:700, fontSize:13, cursor:loading?"default":"pointer",
              background:loading ? "rgba(155,109,255,0.3)" : T.purple,
              color:T.txt, border:"none",
              opacity:(!chiefComp || meds.length===0) ? 0.5 : 1 }}>
            {loading ? "Generating..." : "Generate Discharge Instructions"}
          </button>
        </Section>

        {/* Generated output */}
        {generated && (
          <div style={{ marginTop:16, padding:"12px 14px", borderRadius:10,
            background:"rgba(0,212,180,0.08)",
            border:`1px solid ${T.teal}40` }}>
            <div style={{ display:"flex", alignItems:"center",
              justifyContent:"space-between", marginBottom:10 }}>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                fontSize:13, color:T.teal }}>Generated Instructions</span>
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={copyToClipboard}
                  style={{ padding:"5px 12px", fontSize:11, fontWeight:600,
                    cursor:"pointer", background:`${T.teal}20`,
                    color:T.teal, border:`1px solid ${T.teal}40`,
                    borderRadius:6 }}>
                  📋 Copy
                </button>
                <button onClick={printInstructions}
                  style={{ padding:"5px 12px", fontSize:11, fontWeight:600,
                    cursor:"pointer", background:`${T.teal}20`,
                    color:T.teal, border:`1px solid ${T.teal}40`,
                    borderRadius:6 }}>
                  🖨️ Print
                </button>
              </div>
            </div>
            <pre style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5,
              color:T.txt2, lineHeight:1.65, maxHeight:400, overflowY:"auto",
              whiteSpace:"pre-wrap", wordWrap:"break-word", margin:0 }}>
              {generated}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}