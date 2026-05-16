// LabResultsUploader.jsx — Bulk lab upload + clinical range cross-reference
// Accepts pasted text or file upload, parses labs, flags abnormals with tox-relevant context

import { useState, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444", cyan:"#00d4ff",
};

// ── Standard clinical ranges with tox-specific context ─────────────────────
const CLINICAL_RANGES = [
  // Electrolytes
  { name:"Sodium",         aliases:["Na","sodium","na+"],        unit:"mEq/L",  lo:136, hi:145, critLo:120, critHi:160, toxContext:"Hyponatremia: salicylate, MDMA, psychogenic polydipsia. Hypernatremia: lithium DI." },
  { name:"Potassium",      aliases:["K","potassium","k+"],       unit:"mEq/L",  lo:3.5, hi:5.0, critLo:2.5, critHi:6.5, toxContext:"Hypokalemia: theophylline, beta-agonists, barium. Hyperkalemia: digoxin, fluoride, succinylcholine." },
  { name:"Chloride",       aliases:["Cl","chloride"],             unit:"mEq/L",  lo:98,  hi:106 },
  { name:"Bicarbonate",    aliases:["HCO3","bicarbonate","bicarb","co2","CO2"], unit:"mEq/L", lo:22, hi:29, critLo:10, critHi:40, toxContext:"Low HCO3: salicylates, methanol, ethylene glycol, cyanide, iron, INH. High: metabolic alkalosis (diuretics, vomiting)." },
  { name:"Anion Gap",      aliases:["AG","anion gap"],            unit:"mEq/L",  lo:8,   hi:12, critHi:20, toxContext:"Elevated AG (MUDPILES): methanol, uremia, DKA, propylene glycol, INH, lactate, ethylene glycol, salicylates." },
  { name:"Glucose",        aliases:["glucose","gluc","glu","bg","blood glucose"], unit:"mg/dL", lo:70, hi:100, critLo:40, critHi:500, toxContext:"Hypoglycemia: insulin, ethanol, sulfonylureas, beta-blockers, salicylates. Hyperglycemia: catecholamines, corticosteroids." },
  { name:"BUN",            aliases:["BUN","bun","urea"],          unit:"mg/dL",  lo:7,   hi:20, critHi:100 },
  { name:"Creatinine",     aliases:["Cr","creatinine","creat"],   unit:"mg/dL",  lo:0.6, hi:1.2, critHi:5.0, toxContext:"Elevated Cr: rhabdomyolysis (cocaine, stimulants, statins), ethylene glycol nephropathy." },

  // Hematology
  { name:"Hemoglobin",     aliases:["Hgb","Hb","hemoglobin","hgb"], unit:"g/dL", lo:12.0, hi:17.5, critLo:7.0, critHi:20.0, toxContext:"Anemia: lead, arsenic, nitrite-induced hemolysis. Elevated: CO poisoning (falsely normal SpO2)." },
  { name:"Hematocrit",     aliases:["Hct","hematocrit"],           unit:"%",     lo:36,  hi:52, critLo:21, critHi:60 },
  { name:"WBC",            aliases:["WBC","wbc","white blood cells","leukocytes"], unit:"K/uL", lo:4.5, hi:11.0, critHi:30.0, toxContext:"Elevated WBC: corticosteroids, lithium, beta-agonists, stimulants, G-CSF. Leukopenia: clozapine, carbamazepine, colchicine." },
  { name:"Platelets",      aliases:["Plt","platelets","thrombocytes"], unit:"K/uL", lo:150, hi:400, critLo:50, critHi:1000, toxContext:"Thrombocytopenia: heparin (HIT), quinine, valproate, ETOH, chemotherapy." },

  // Liver
  { name:"AST",            aliases:["AST","ast","sgot"],           unit:"U/L",   lo:10,  hi:40, critHi:1000, toxContext:"Elevated: APAP hepatotoxicity, ETOH, mushroom poisoning, iron, halothane. Peak AST 24-72h after APAP ingestion." },
  { name:"ALT",            aliases:["ALT","alt","sgpt"],           unit:"U/L",   lo:7,   hi:56, critHi:1000, toxContext:"Elevated: APAP (primary hepatotoxin), carbon tetrachloride, amatoxin mushrooms. Rising ALT + INR = imminent liver failure." },
  { name:"Total Bilirubin",aliases:["T.Bili","tbili","total bili","bilirubin"], unit:"mg/dL", lo:0.2, hi:1.2, critHi:10, toxContext:"Elevated: hemolysis (arsenic, copper, nitrites), APAP liver failure, amatoxin." },
  { name:"INR / PT",       aliases:["INR","inr","pt","prothrombin"], unit:"",   lo:0.8, hi:1.2, critHi:3.0, toxContext:"Elevated INR: APAP liver failure (stop NAC criteria = INR <2), warfarin, rodenticide (superwarfarin), amatoxin." },

  // Cardiac / Misc
  { name:"Troponin",       aliases:["troponin","trop","tnI","ctnT","hstrop"], unit:"ng/mL", lo:0, hi:0.04, critHi:1.0, toxContext:"Elevated: CO poisoning, stimulants (cocaine/meth), sympathomimetics, anthracyclines." },
  { name:"Lactate",        aliases:["lactate","lactic acid","lac"], unit:"mmol/L", lo:0.5, hi:2.2, critHi:4.0, toxContext:"Elevated: cyanide, CO, metformin (MALA), iron, INH, salicylates, epinephrine. >8 mmol/L with normal pH → consider cyanide." },
  { name:"Magnesium",      aliases:["Mg","magnesium","mg2+"],      unit:"mEq/L",  lo:1.7, hi:2.4, critLo:1.0, critHi:5.0, toxContext:"Hypermagnesemia: antacid/laxative OD, hyperalimentation. Hypomagnesemia: alcoholism, diuretics, malnutrition." },
  { name:"Phosphorus",     aliases:["Phos","phosphorus","phosphate","po4"], unit:"mg/dL", lo:2.5, hi:4.5, critLo:1.0, toxContext:"Hypophosphatemia: APAP recovery (hepatic regeneration), malnutrition, DKA treatment, alcoholism." },
  { name:"Calcium",        aliases:["Ca","calcium","ca2+","total calcium"], unit:"mg/dL", lo:8.5, hi:10.5, critLo:6.5, critHi:13.5, toxContext:"Hypocalcemia: hydrofluoric acid (HF) burns — chelates calcium → fatal arrhythmia. Ethylene glycol oxalate crystallization." },
  { name:"Lipase",         aliases:["lipase"],                     unit:"U/L",   lo:0,   hi:160, critHi:1000 },
  { name:"Acetaminophen",  aliases:["APAP","apap","acetaminophen","tylenol","paracetamol"], unit:"mcg/mL", lo:0, hi:20, critHi:150, toxContext:"≥150 mcg/mL at 4h = treat with NAC. Plot on Rumack-Matthew nomogram ≥4h post-ingestion." },
  { name:"Salicylate",     aliases:["salicylate","aspirin","asa"], unit:"mg/dL", lo:0, hi:30, critHi:80, toxContext:"30–80 mg/dL = toxic; ≥80 = severe (dialysis consideration). Classic: AGMA + respiratory alkalosis." },
  { name:"Ethanol",        aliases:["ethanol","etoh","alcohol","etOH"], unit:"mg/dL", lo:0, hi:20, critHi:400 },
  { name:"CO Level",       aliases:["CO","COHgb","cohgb","carboxyhemoglobin","co level"], unit:"%", lo:0, hi:3, critHi:25, toxContext:"≥25% or neurologic symptoms → HBO2 consultation. Pulse oximetry unreliable with CO. Treat all smokers empirically." },
  { name:"Methemoglobin",  aliases:["MetHb","methb","methemoglobin"], unit:"%", lo:0, hi:1, critHi:20, toxContext:"≥30% or symptomatic at any level → methylene blue 1-2 mg/kg IV. Causes: dapsone, benzocaine, nitrites. G6PD → exchange transfusion instead." },
  { name:"pH (arterial)",  aliases:["pH","arterial pH","art pH","abg ph"], unit:"", lo:7.35, hi:7.45, critLo:7.1, critHi:7.6, toxContext:"Acidemia: salicylates, methanol, ethylene glycol, cyanide, iron, INH, carbon monoxide. Alkalemia: sympathomimetics (early), salicylates (early)." },
  { name:"pCO2",           aliases:["pco2","co2 partial pressure","pCO2"], unit:"mmHg", lo:35, hi:45, critLo:20, critHi:70 },
  { name:"Digoxin Level",  aliases:["digoxin","dig level","digitalis"], unit:"ng/mL", lo:0.5, hi:2.0, critHi:5.0, toxContext:"Therapeutic 0.5–2.0 ng/mL. Toxicity: >5 ng/mL or life-threatening dysrhythmia → Digibind. Hyperkalemia potentiates toxicity." },
  { name:"Lithium Level",  aliases:["lithium","li level"],          unit:"mEq/L",  lo:0.6, hi:1.2, critHi:2.5, toxContext:"Toxicity: >1.5 mEq/L (chronic); >2.5 mEq/L (acute) → consider hemodialysis. Nephrogenic DI, sinus node dysfunction, tremor." },
];

// ── Parse a raw pasted lab text into [{name, value, unit}] ──────────────────
function parseLabText(text) {
  const lines = text.split(/[\n;]+/).map(l => l.trim()).filter(Boolean);
  const results = [];

  for (const line of lines) {
    // Match patterns like "Na 138", "K+: 4.2", "Troponin=0.02", "Lactate 3.5 mmol/L"
    const match = line.match(/^([A-Za-z][A-Za-z0-9+\-\s./]*?)\s*[=:>\-]?\s*([\d.]+)\s*([A-Za-z/%]*)/);
    if (!match) continue;
    const rawName = match[1].trim();
    const rawVal  = parseFloat(match[2]);
    const rawUnit = match[3]?.trim() || "";
    if (isNaN(rawVal)) continue;

    // Find matching range definition
    const range = CLINICAL_RANGES.find(r =>
      r.aliases.some(a => a.toLowerCase() === rawName.toLowerCase()) ||
      r.name.toLowerCase() === rawName.toLowerCase()
    );

    results.push({
      rawName,
      value: rawVal,
      unit: rawUnit || range?.unit || "",
      range: range || null,
      matched: !!range,
    });
  }
  return results;
}

// ── Classify each result ─────────────────────────────────────────────────────
function classifyResult(entry) {
  if (!entry.range) return { status:"unknown", color:T.txt4, label:"Unknown" };
  const { value, range } = entry;
  if (range.critLo != null && value < range.critLo) return { status:"critical_low",  color:T.red,    label:"CRITICAL LOW" };
  if (range.critHi != null && value > range.critHi) return { status:"critical_high", color:T.red,    label:"CRITICAL HIGH" };
  if (value < range.lo)                             return { status:"low",            color:T.orange, label:"LOW" };
  if (value > range.hi)                             return { status:"high",           color:T.gold,   label:"HIGH" };
  return { status:"normal", color:T.green, label:"NORMAL" };
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LabResultsUploader() {
  const [rawText,    setRawText]    = useState("");
  const [results,    setResults]    = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading,  setAiLoading]  = useState(false);
  const [aiErr,      setAiErr]      = useState(false);
  const [copied,     setCopied]     = useState(false);
  const fileRef = useRef(null);

  const handleParse = useCallback(() => {
    if (!rawText.trim()) return;
    const parsed = parseLabText(rawText);
    setResults(parsed);
    setAiAnalysis(null);
    setAiErr(false);
  }, [rawText]);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setRawText(ev.target.result);
      setResults(null);
      setAiAnalysis(null);
    };
    reader.readAsText(file);
  }, []);

  const handleAIAnalysis = useCallback(async () => {
    if (!results?.length || aiLoading) return;
    setAiLoading(true); setAiErr(false); setAiAnalysis(null);

    const abnormals = results.filter(r => {
      const cl = classifyResult(r);
      return cl.status !== "normal" && cl.status !== "unknown";
    });

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a board-certified emergency medicine toxicologist. A patient's lab results have been submitted for cross-reference against clinical toxicology guidelines.

Lab Results:
${results.map(r => `${r.rawName}: ${r.value} ${r.unit} [${classifyResult(r).label}]`).join("\n")}

Flagged Abnormals:
${abnormals.map(r => `${r.rawName}: ${r.value} ${r.unit} — ${r.range?.toxContext || "no tox context"}`).join("\n") || "None"}

Based on the pattern of abnormalities, provide:
1. The most likely toxicological or clinical syndrome
2. The most critical lab findings requiring immediate action
3. Specific antidote or treatment recommendations based on the lab pattern
4. Any additional labs you'd order

Be concise and clinically actionable. Return valid JSON only.`,
        response_json_schema: {
          type: "object",
          properties: {
            likely_syndrome:    { type: "string" },
            critical_findings:  { type: "array", items: { type: "string" } },
            recommendations:    { type: "array", items: { type: "string" } },
            additional_labs:    { type: "array", items: { type: "string" } },
            clinical_pearl:     { type: "string" },
          },
          required: ["likely_syndrome","critical_findings","recommendations"],
        },
      });
      setAiAnalysis(res);
    } catch {
      setAiErr(true);
    }
    setAiLoading(false);
  }, [results, aiLoading]);

  const handleCopyReport = useCallback(() => {
    if (!results) return;
    const lines = ["LAB RESULTS — CLINICAL CROSS-REFERENCE REPORT", "=" .repeat(48), ""];
    results.forEach(r => {
      const cl = classifyResult(r);
      lines.push(`${r.rawName.padEnd(22)} ${String(r.value).padStart(8)} ${r.unit.padEnd(10)} [${cl.label}]`);
      if (r.range?.toxContext && cl.status !== "normal") {
        lines.push(`  → Tox Context: ${r.range.toxContext}`);
      }
    });
    if (aiAnalysis) {
      lines.push("", "AI TOXICOLOGY ANALYSIS", "=" .repeat(48));
      lines.push(`Likely Syndrome: ${aiAnalysis.likely_syndrome}`);
      if (aiAnalysis.critical_findings?.length) {
        lines.push("", "Critical Findings:");
        aiAnalysis.critical_findings.forEach(f => lines.push(`  • ${f}`));
      }
      if (aiAnalysis.recommendations?.length) {
        lines.push("", "Recommendations:");
        aiAnalysis.recommendations.forEach(r => lines.push(`  • ${r}`));
      }
    }
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  }, [results, aiAnalysis]);

  const clearAll = () => { setRawText(""); setResults(null); setAiAnalysis(null); setAiErr(false); };

  const abnormalCount  = results?.filter(r => { const cl = classifyResult(r); return cl.status !== "normal" && cl.status !== "unknown"; }).length || 0;
  const criticalCount  = results?.filter(r => classifyResult(r).status.startsWith("critical")).length || 0;
  const unmatchedCount = results?.filter(r => !r.matched).length || 0;

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: T.teal }}>
          Lab Results Uploader
        </div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize: 11, color: T.txt4, marginTop: 2, lineHeight: 1.55 }}>
          Paste lab results or upload a text file — values are cross-referenced against standard clinical ranges with toxicology context
        </div>
      </div>

      {/* Input area */}
      {!results && (
        <div>
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            placeholder={`Paste lab results in any format, e.g.:\n\nNa 128\nK 6.8\nBicarb 11\nAnion Gap 22\nLactate 6.2\nAPAP 210\nAST 1450\n\nOr upload a .txt file below`}
            style={{
              width: "100%", minHeight: 160, padding: "12px 14px",
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${rawText ? "rgba(0,229,192,0.4)" : "rgba(26,53,85,0.5)"}`,
              borderRadius: 10, color: T.txt, fontFamily: "'JetBrains Mono',monospace",
              fontSize: 12, lineHeight: 1.7, outline: "none", resize: "vertical",
              boxSizing: "border-box", transition: "border-color .2s",
            }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={handleParse}
              disabled={!rawText.trim()}
              style={{
                flex: "1 1 140px", padding: "10px 16px", borderRadius: 9, cursor: rawText.trim() ? "pointer" : "default",
                border: `1px solid ${T.teal}55`, background: `linear-gradient(135deg,${T.teal}1e,${T.teal}08)`,
                color: rawText.trim() ? T.teal : T.txt4, fontFamily: "'DM Sans',sans-serif",
                fontSize: 13, fontWeight: 600, opacity: rawText.trim() ? 1 : 0.5, transition: "all .2s",
              }}
            >
              ⚗ Analyze Labs
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                padding: "10px 16px", borderRadius: 9, cursor: "pointer",
                border: "1px solid rgba(59,158,255,0.35)",
                background: "rgba(59,158,255,0.07)", color: T.blue,
                fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600,
              }}
            >
              📁 Upload File
            </button>
            <input ref={fileRef} type="file" accept=".txt,.csv" style={{ display: "none" }} onChange={handleFileUpload} />
          </div>

          {/* Format hint */}
          <div style={{ marginTop: 10, padding: "9px 13px", borderRadius: 8, background: "rgba(8,22,40,0.6)", border: "1px solid rgba(26,53,85,0.4)" }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: T.txt4, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 5 }}>
              Accepted Formats
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 18px" }}>
              {["Na: 138", "K 4.2", "Lactate=3.5", "APAP 210 mcg/mL", "pH 7.28", "COHgb 18%"].map(ex => (
                <span key={ex} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: T.teal }}>{ex}</span>
              ))}
            </div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: T.txt4, marginTop: 4 }}>
              One result per line · Name then value · Units optional
            </div>
          </div>
        </div>
      )}

      {/* Results panel */}
      {results && (
        <div className="tox-fade">
          {/* Summary bar */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
            borderRadius: 10, marginBottom: 12, flexWrap: "wrap",
            background: "rgba(8,22,40,0.8)", border: "1px solid rgba(26,53,85,0.5)",
          }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: T.txt3, fontWeight: 700 }}>
              {results.length} labs parsed
            </span>
            {criticalCount > 0 && (
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700, color: T.red, background: "rgba(255,68,68,0.15)", border: "1px solid rgba(255,68,68,0.4)", borderRadius: 5, padding: "2px 8px" }}>
                ⚠ {criticalCount} CRITICAL
              </span>
            )}
            {abnormalCount > 0 && (
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: T.orange, background: "rgba(255,159,67,0.12)", border: "1px solid rgba(255,159,67,0.35)", borderRadius: 5, padding: "2px 8px" }}>
                {abnormalCount} abnormal
              </span>
            )}
            {unmatchedCount > 0 && (
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: T.txt4, background: "rgba(26,53,85,0.3)", borderRadius: 5, padding: "2px 8px" }}>
                {unmatchedCount} unrecognized
              </span>
            )}
            <div style={{ flex: 1 }} />
            <button onClick={handleCopyReport} style={{ padding: "5px 11px", borderRadius: 7, cursor: "pointer", border: `1px solid ${copied ? T.green+"55" : "rgba(26,53,85,0.5)"}`, background: copied ? "rgba(61,255,160,0.1)" : "rgba(255,255,255,0.05)", color: copied ? T.green : T.txt4, fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600 }}>
              {copied ? "✓ Copied" : "Copy Report"}
            </button>
            <button onClick={clearAll} style={{ padding: "5px 11px", borderRadius: 7, cursor: "pointer", border: "1px solid rgba(26,53,85,0.45)", background: "rgba(255,255,255,0.04)", color: T.txt4, fontFamily: "'DM Sans',sans-serif", fontSize: 11 }}>
              Clear
            </button>
          </div>

          {/* Lab results table */}
          <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid rgba(26,53,85,0.5)", marginBottom: 12 }}>
            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 80px 110px", gap: 0, padding: "7px 14px", background: "rgba(8,22,40,0.9)", borderBottom: "1px solid rgba(26,53,85,0.5)" }}>
              {["Test", "Value", "Ref Range", "Status"].map(h => (
                <div key={h} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: T.txt4, letterSpacing: 1.2, textTransform: "uppercase" }}>{h}</div>
              ))}
            </div>

            {/* Rows */}
            {results.map((r, i) => {
              const cl = classifyResult(r);
              const isCrit = cl.status.startsWith("critical");
              const isAbnormal = cl.status !== "normal" && cl.status !== "unknown";
              return (
                <div key={i} style={{
                  display: "flex", flexDirection: "column",
                  borderBottom: i < results.length - 1 ? "1px solid rgba(26,53,85,0.3)" : "none",
                  background: isCrit ? "rgba(255,68,68,0.07)" : isAbnormal ? `${cl.color}07` : "transparent",
                }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 80px 110px", gap: 0, padding: "9px 14px", alignItems: "center" }}>
                    {/* Name */}
                    <div>
                      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: isAbnormal ? 600 : 400, color: isAbnormal ? T.txt : T.txt3 }}>
                        {r.range?.name || r.rawName}
                      </div>
                      {!r.matched && (
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: T.txt4, marginTop: 1 }}>unrecognized test</div>
                      )}
                    </div>
                    {/* Value */}
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, fontWeight: 700, color: cl.color }}>
                      {r.value} <span style={{ fontSize: 9, fontWeight: 400, color: T.txt4 }}>{r.unit}</span>
                    </div>
                    {/* Ref range */}
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.txt4, lineHeight: 1.4 }}>
                      {r.range ? `${r.range.lo}–${r.range.hi}` : "—"}
                      {r.range?.unit && <div style={{ fontSize: 8 }}>{r.range.unit}</div>}
                    </div>
                    {/* Status badge */}
                    <div>
                      <span style={{
                        fontFamily: "'JetBrains Mono',monospace", fontSize: 8, fontWeight: 700,
                        color: cl.color, background: `${cl.color}18`,
                        border: `1px solid ${cl.color}40`, borderRadius: 4,
                        padding: "2px 7px", textTransform: "uppercase", letterSpacing: 0.8,
                        display: "inline-block", whiteSpace: "nowrap",
                      }}>
                        {isCrit && "⚠ "}{cl.label}
                      </span>
                    </div>
                  </div>
                  {/* Tox context — only for abnormal matched results */}
                  {isAbnormal && r.range?.toxContext && (
                    <div style={{ padding: "0 14px 9px 14px" }}>
                      <div style={{
                        padding: "6px 10px", borderRadius: 6,
                        background: `${cl.color}0d`, border: `1px solid ${cl.color}25`,
                        fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.txt3, lineHeight: 1.55,
                      }}>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: cl.color, textTransform: "uppercase", letterSpacing: 1, marginRight: 6 }}>TOX:</span>
                        {r.range.toxContext}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* AI Analysis section */}
          {!aiAnalysis && !aiLoading && (
            <button
              onClick={handleAIAnalysis}
              style={{
                width: "100%", padding: "11px", borderRadius: 9, cursor: "pointer",
                border: `1px solid ${T.purple}55`,
                background: `linear-gradient(135deg,${T.purple}18,${T.purple}06)`,
                color: T.purple, fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600,
                transition: "all .2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${T.purple}26`; }}
              onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(135deg,${T.purple}18,${T.purple}06)`; }}
            >
              🧬 AI Toxicology Analysis — Interpret Pattern of Abnormalities
            </button>
          )}

          {aiLoading && (
            <div style={{ padding: "14px", textAlign: "center", color: T.purple, fontFamily: "'DM Sans',sans-serif", fontSize: 12, background: "rgba(155,109,255,0.06)", border: "1px solid rgba(155,109,255,0.2)", borderRadius: 9 }}>
              Analyzing lab pattern...
            </div>
          )}

          {aiErr && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.3)", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.red }}>
              Analysis failed — check connection and retry
            </div>
          )}

          {aiAnalysis && (
            <div className="tox-fade" style={{ marginTop: 12 }}>
              {/* Likely syndrome */}
              <div style={{ padding: "12px 16px", borderRadius: 10, marginBottom: 10, background: "rgba(155,109,255,0.09)", border: "1px solid rgba(155,109,255,0.35)" }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: T.purple, letterSpacing: 1.3, textTransform: "uppercase", marginBottom: 5 }}>AI — Likely Syndrome</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: T.txt, lineHeight: 1.3 }}>{aiAnalysis.likely_syndrome}</div>
              </div>

              {/* Critical findings */}
              {aiAnalysis.critical_findings?.length > 0 && (
                <div style={{ padding: "11px 14px", borderRadius: 9, marginBottom: 10, background: "rgba(255,68,68,0.07)", border: "1px solid rgba(255,68,68,0.3)" }}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: T.red, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 7 }}>Critical Findings</div>
                  {aiAnalysis.critical_findings.map((f, i) => (
                    <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start", marginBottom: 5 }}>
                      <span style={{ color: T.red, fontSize: 7, marginTop: 4, flexShrink: 0 }}>◆</span>
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.txt2, lineHeight: 1.6 }}>{f}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {aiAnalysis.recommendations?.length > 0 && (
                <div style={{ padding: "11px 14px", borderRadius: 9, marginBottom: 10, background: "rgba(0,229,192,0.06)", border: "1px solid rgba(0,229,192,0.25)" }}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: T.teal, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 7 }}>Treatment Recommendations</div>
                  {aiAnalysis.recommendations.map((rec, i) => (
                    <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start", marginBottom: 5 }}>
                      <span style={{ color: T.teal, fontSize: 7, marginTop: 4, flexShrink: 0 }}>◆</span>
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.txt2, lineHeight: 1.6 }}>{rec}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Additional labs */}
              {aiAnalysis.additional_labs?.length > 0 && (
                <div style={{ padding: "11px 14px", borderRadius: 9, marginBottom: 10, background: "rgba(59,158,255,0.06)", border: "1px solid rgba(59,158,255,0.25)" }}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: T.blue, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 7 }}>Additional Labs to Order</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {aiAnalysis.additional_labs.map((lab, i) => (
                      <span key={i} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: T.blue, background: "rgba(59,158,255,0.1)", border: "1px solid rgba(59,158,255,0.3)", borderRadius: 6, padding: "3px 9px" }}>{lab}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Pearl */}
              {aiAnalysis.clinical_pearl && (
                <div style={{ padding: "11px 14px", borderRadius: 9, background: "rgba(245,200,66,0.07)", border: "1px solid rgba(245,200,66,0.25)" }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: T.gold, letterSpacing: 1, textTransform: "uppercase" }}>Pearl: </span>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.txt2, lineHeight: 1.65 }}>{aiAnalysis.clinical_pearl}</span>
                </div>
              )}

              <div style={{ marginTop: 8, fontFamily: "'DM Sans',sans-serif", fontSize: 9, color: T.txt4, textAlign: "right" }}>
                AI analysis · Verify with Poison Control 1-800-222-1222
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}