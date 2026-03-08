import { useState } from "react";
import { base44 } from "@/api/base44Client";

const G = {
  navy:"#050f1e", slate:"#0b1d35", panel:"#0d2240", edge:"#162d4f",
  border:"#1e3a5f", muted:"#2a4d72", dim:"#4a7299", text:"#c8ddf0",
  bright:"#e8f4ff", teal:"#00d4bc", amber:"#f5a623", red:"#ff5c6c",
  green:"#2ecc71", purple:"#9b6dff", blue:"#4a90d9",
};

const btn = (bg, fg="#fff", br="transparent") => ({
  padding:"9px 18px", borderRadius:8, fontFamily:"inherit", fontSize:12.5, fontWeight:700,
  cursor:"pointer", display:"inline-flex", alignItems:"center", gap:6,
  border:`1px solid ${br}`, background:bg, color:fg, transition:"all .15s", whiteSpace:"nowrap",
});

const SAMPLE_HL7 = `MSH|^~\\&|LAB|HOSP|EHR|CLINIC|20240310120000||ORU^R01|MSG001|P|2.5
PID|1||MRN12345||DOE^JOHN^^||19800101|M
OBR|1||REQ001|CBC^Complete Blood Count
OBX|1|NM|WBC^Leukocytes|6.8|10*3/uL|4.5-11.0|N|||F
OBX|2|NM|RBC^Erythrocytes|3.1|10*6/uL|4.5-5.9|L|||F
OBX|3|NM|HGB^Hemoglobin|9.4|g/dL|13.5-17.5|L|||F
OBX|4|NM|HCT^Hematocrit|28.2|%|41-53|L|||F
OBX|5|NM|PLT^Platelets|420|10*3/uL|150-400|H|||F
OBR|2||REQ002|BMP^Basic Metabolic Panel
OBX|6|NM|NA^Sodium|138|mEq/L|135-145|N|||F
OBX|7|NM|K^Potassium|5.9|mEq/L|3.5-5.0|H|||F
OBX|8|NM|CR^Creatinine|2.3|mg/dL|0.6-1.2|H|||F
OBX|9|NM|GLU^Glucose|312|mg/dL|70-99|H|||F
OBX|10|NM|BUN^Blood Urea Nitrogen|42|mg/dL|7-20|H|||F`;

const SAMPLE_FHIR = JSON.stringify({
  resourceType: "Bundle",
  type: "collection",
  entry: [
    { resource: { resourceType:"DiagnosticReport", status:"final", code:{ text:"Lipid Panel" },
      result:[
        { reference:"Observation/1" }, { reference:"Observation/2" },
        { reference:"Observation/3" }, { reference:"Observation/4" }
      ]
    }},
    { resource: { resourceType:"Observation", id:"1", status:"final",
      code:{ coding:[{ code:"2093-3", display:"Total Cholesterol" }] },
      valueQuantity:{ value:258, unit:"mg/dL" },
      referenceRange:[{ text:"<200 mg/dL" }],
      interpretation:[{ coding:[{ code:"H" }] }]
    }},
    { resource: { resourceType:"Observation", id:"2", status:"final",
      code:{ coding:[{ code:"2085-9", display:"HDL Cholesterol" }] },
      valueQuantity:{ value:32, unit:"mg/dL" },
      referenceRange:[{ text:">40 mg/dL" }],
      interpretation:[{ coding:[{ code:"L" }] }]
    }},
    { resource: { resourceType:"Observation", id:"3", status:"final",
      code:{ coding:[{ code:"13457-7", display:"LDL Cholesterol" }] },
      valueQuantity:{ value:178, unit:"mg/dL" },
      referenceRange:[{ text:"<130 mg/dL" }],
      interpretation:[{ coding:[{ code:"H" }] }]
    }},
    { resource: { resourceType:"Observation", id:"4", status:"final",
      code:{ coding:[{ code:"2571-8", display:"Triglycerides" }] },
      valueQuantity:{ value:240, unit:"mg/dL" },
      referenceRange:[{ text:"<150 mg/dL" }],
      interpretation:[{ coding:[{ code:"H" }] }]
    }}
  ]
}, null, 2);

// Parse HL7 ORU^R01 OBX segments into lab_findings format
function parseHL7(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const results = [];
  for (const line of lines) {
    if (!line.startsWith("OBX")) continue;
    const fields = line.split("|");
    const name = fields[3]?.split("^")[1] || fields[3] || "";
    const value = fields[5] || "";
    const unit = fields[6] || "";
    const refRange = fields[7] || "";
    const flag = fields[8] || "N";
    const status = flag === "H" || flag === "HH" ? "abnormal"
      : flag === "L" || flag === "LL" ? "abnormal"
      : flag === "C" || flag === "P" ? "critical"
      : "normal";
    results.push({ test_name: name.trim(), result: value.trim(), unit: unit.trim(), reference_range: refRange.trim(), status });
  }
  return results;
}

// Parse FHIR R4 Bundle with Observation resources
function parseFHIR(text) {
  const bundle = JSON.parse(text);
  const results = [];
  if (bundle.resourceType === "Bundle" && bundle.entry) {
    for (const entry of bundle.entry) {
      const res = entry.resource;
      if (res?.resourceType !== "Observation") continue;
      const name = res.code?.coding?.[0]?.display || res.code?.text || "Unknown";
      const value = res.valueQuantity?.value?.toString() || res.valueString || "";
      const unit = res.valueQuantity?.unit || "";
      const refRange = res.referenceRange?.[0]?.text || res.referenceRange?.[0]?.low?.value + "–" + res.referenceRange?.[0]?.high?.value || "";
      const interpCode = res.interpretation?.[0]?.coding?.[0]?.code || "N";
      const status = ["H","HH","HU"].includes(interpCode) || ["L","LL","LU"].includes(interpCode) ? "abnormal"
        : ["A","AA"].includes(interpCode) ? "critical"
        : "normal";
      results.push({ test_name: name, result: value, unit, reference_range: refRange, status });
    }
  }
  return results;
}

export default function ExternalLabImporter({ note, noteId, queryClient, onImportDone }) {
  const [format, setFormat] = useState("hl7");
  const [inputText, setInputText] = useState("");
  const [parsed, setParsed] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleParse() {
    setParseError(null); setParsed(null); setSaved(false);
    try {
      const results = format === "hl7" ? parseHL7(inputText) : parseFHIR(inputText);
      if (!results.length) { setParseError("No lab results found. Check the format and try again."); return; }
      setParsed(results);
    } catch (e) {
      setParseError("Parse error: " + e.message);
    }
  }

  async function handleImport() {
    if (!parsed?.length) return;
    setSaving(true);
    try {
      const existing = note?.lab_findings || [];
      const merged = [...existing, ...parsed];
      await base44.entities.ClinicalNote.update(noteId, { lab_findings: merged });
      queryClient.invalidateQueries({ queryKey: ["studioNote", noteId] });
      setSaved(true);
      if (onImportDone) onImportDone();
    } catch (e) {
      setParseError("Import failed: " + e.message);
    }
    setSaving(false);
  }

  const abnCount = parsed?.filter(r => r.status === "abnormal" || r.status === "critical").length || 0;

  return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: 19, fontWeight: 700, color: G.bright, display: "flex", alignItems: "center", gap: 10 }}>
          🔗 External Lab Import
        </div>
        <div style={{ fontSize: 12, color: G.dim, marginTop: 3 }}>
          Paste HL7 v2.x or FHIR R4 data to auto-map results into Labs & Imaging
        </div>
      </div>

      {/* Format selector */}
      <div style={{ display: "flex", gap: 6 }}>
        {[["hl7", "HL7 v2.x", "🏥"], ["fhir", "FHIR R4 JSON", "⚡"]].map(([id, label, icon]) => (
          <button key={id} onClick={() => { setFormat(id); setParsed(null); setParseError(null); setSaved(false); }}
            style={{ padding: "7px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              background: format === id ? `rgba(0,212,188,.12)` : "transparent",
              border: `1px solid ${format === id ? G.teal : G.border}`,
              color: format === id ? G.teal : G.dim, transition: "all .15s" }}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Sample data loader */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 11, color: G.muted }}>Try sample data:</span>
        <button onClick={() => { setInputText(format === "hl7" ? SAMPLE_HL7 : SAMPLE_FHIR); setParsed(null); setSaved(false); }}
          style={{ padding: "4px 11px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            background: "rgba(74,144,217,.1)", border: "1px solid rgba(74,144,217,.3)", color: G.blue }}>
          Load {format === "hl7" ? "Sample HL7" : "Sample FHIR"}
        </button>
        {inputText && <button onClick={() => { setInputText(""); setParsed(null); setParseError(null); setSaved(false); }}
          style={{ padding: "4px 11px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "inherit",
            background: "transparent", border: `1px solid ${G.border}`, color: G.dim }}>
          Clear
        </button>}
      </div>

      {/* Text input */}
      <textarea
        value={inputText}
        onChange={e => { setInputText(e.target.value); setParsed(null); setSaved(false); setParseError(null); }}
        placeholder={format === "hl7"
          ? "Paste HL7 ORU^R01 message here...\n\nMSH|^~\\&|LAB|HOSP...\nOBX|1|NM|WBC^Leukocytes|6.8|10*3/uL|4.5-11.0|N\n..."
          : "Paste FHIR R4 Bundle JSON here...\n\n{ \"resourceType\": \"Bundle\", \"entry\": [...] }"}
        rows={10}
        style={{ width: "100%", background: "rgba(11,29,53,.6)", border: `1px solid ${G.border}`, borderRadius: 10,
          padding: "13px 15px", fontFamily: "monospace", fontSize: 11.5, color: G.bright,
          lineHeight: 1.75, resize: "vertical", outline: "none" }}
      />

      {/* Parse button */}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleParse} disabled={!inputText.trim()}
          style={{ ...btn(`linear-gradient(135deg,${G.teal},#00a896)`), opacity: !inputText.trim() ? 0.5 : 1 }}>
          🔍 Parse {format === "hl7" ? "HL7" : "FHIR"}
        </button>
      </div>

      {/* Parse error */}
      {parseError && (
        <div style={{ padding: "10px 14px", borderRadius: 9, background: "rgba(255,92,108,.08)", border: "1px solid rgba(255,92,108,.3)", color: G.red, fontSize: 12.5 }}>
          ⚠ {parseError}
        </div>
      )}

      {/* Parsed preview */}
      {parsed && (
        <div style={{ background: G.panel, border: `1px solid ${G.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "11px 16px", background: "rgba(0,0,0,.2)", borderBottom: `1px solid ${G.border}`,
            display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: G.bright, flex: 1 }}>
              ✓ Parsed {parsed.length} Lab Result{parsed.length !== 1 ? "s" : ""}
            </span>
            {abnCount > 0 && (
              <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 9px", borderRadius: 20,
                background: "rgba(255,92,108,.12)", border: "1px solid rgba(255,92,108,.3)", color: G.red }}>
                ⚠ {abnCount} abnormal
              </span>
            )}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Test", "Result", "Units", "Reference", "Status"].map(h => (
                    <th key={h} style={{ fontFamily: "monospace", fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".08em",
                      color: G.dim, padding: "8px 14px", borderBottom: `1px solid ${G.border}`,
                      background: G.edge, textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsed.map((r, i) => {
                  const isAbn = r.status === "abnormal" || r.status === "critical";
                  const rowColor = isAbn ? G.red : G.green;
                  return (
                    <tr key={i} style={{ background: isAbn ? "rgba(255,92,108,.04)" : "transparent" }}>
                      <td style={{ padding: "8px 14px", fontSize: 12.5, fontWeight: 600, color: G.bright, borderBottom: `1px solid rgba(30,58,95,.3)` }}>{r.test_name}</td>
                      <td style={{ padding: "8px 14px", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: isAbn ? G.red : G.teal, borderBottom: `1px solid rgba(30,58,95,.3)` }}>{r.result}</td>
                      <td style={{ padding: "8px 14px", fontFamily: "monospace", fontSize: 11, color: G.dim, borderBottom: `1px solid rgba(30,58,95,.3)` }}>{r.unit}</td>
                      <td style={{ padding: "8px 14px", fontFamily: "monospace", fontSize: 11, color: G.muted, borderBottom: `1px solid rgba(30,58,95,.3)` }}>{r.reference_range || "—"}</td>
                      <td style={{ padding: "8px 14px", borderBottom: `1px solid rgba(30,58,95,.3)` }}>
                        <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20,
                          background: `${rowColor}18`, border: `1px solid ${rowColor}44`, color: rowColor }}>
                          {r.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ padding: "12px 16px", borderTop: `1px solid ${G.border}`, display: "flex", alignItems: "center", gap: 10 }}>
            {saved ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 8,
                background: "rgba(46,204,113,.1)", border: "1px solid rgba(46,204,113,.3)", color: G.green, fontSize: 12.5, fontWeight: 700 }}>
                ✓ {parsed.length} result{parsed.length !== 1 ? "s" : ""} imported into Labs & Imaging
              </div>
            ) : (
              <button onClick={handleImport} disabled={saving}
                style={{ ...btn(`linear-gradient(135deg,${G.green},#28a87a)`), opacity: saving ? 0.6 : 1 }}>
                {saving ? "Importing…" : `📥 Import ${parsed.length} Result${parsed.length !== 1 ? "s" : ""} into Note`}
              </button>
            )}
            <span style={{ fontSize: 11, color: G.muted }}>
              Results will appear in the Labs Analysis section
            </span>
          </div>
        </div>
      )}
    </div>
  );
}