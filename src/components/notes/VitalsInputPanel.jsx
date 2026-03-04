import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Sparkles, ClipboardPaste, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const T = {
  navy: "#050f1e", slate: "#0b1d35", panel: "#0e2340", edge: "#162d4f",
  border: "#1e3a5f", muted: "#2a4d72", dim: "#4a7299", text: "#c8ddf0",
  bright: "#e8f4ff", teal: "#00d4bc", teal2: "#00a896", amber: "#f5a623",
  red: "#ff5c6c", green: "#2ecc71", purple: "#9b6dff",
};

const VITALS_CONFIG = [
  { id: "temperature",      label: "Temp",  unit: "°F", placeholder: "98.6", normalRange: [97, 99.5],  isBP: false },
  { id: "heart_rate",       label: "HR",    unit: "bpm", placeholder: "72",  normalRange: [60, 100],   isBP: false },
  { id: "blood_pressure",   label: "BP",    unit: "mmHg", placeholder: "120/80", normalRange: null,   isBP: true  },
  { id: "respiratory_rate", label: "RR",    unit: "br/min", placeholder: "16", normalRange: [12, 20], isBP: false },
  { id: "oxygen_saturation",label: "SpO₂",  unit: "%", placeholder: "98",   normalRange: [95, 100],   isBP: false },
  { id: "weight",           label: "Weight", unit: "lbs", placeholder: "150", normalRange: null,      isBP: false },
  { id: "height",           label: "Height", unit: "in", placeholder: "68",  normalRange: null,       isBP: false },
];

function getStatus(config, vitals) {
  if (!config.normalRange) return "neutral";
  if (config.isBP) {
    const sys = vitals?.blood_pressure?.systolic;
    if (!sys) return "neutral";
    if (sys < 90 || sys > 140) return sys < 80 || sys > 160 ? "critical" : "warning";
    return "normal";
  }
  const val = vitals?.[config.id]?.value;
  if (val === undefined || val === "") return "neutral";
  const num = parseFloat(val);
  if (isNaN(num)) return "neutral";
  const [lo, hi] = config.normalRange;
  if (num < lo || num > hi) {
    const delta = Math.max(lo - num, num - hi);
    return delta > (hi - lo) * 0.25 ? "critical" : "warning";
  }
  return "normal";
}

const statusColors = {
  neutral:  { border: T.border,                        bg: T.edge,                        label: T.dim },
  normal:   { border: "rgba(46,204,113,0.3)",           bg: "rgba(46,204,113,0.05)",        label: T.green },
  warning:  { border: "rgba(245,166,35,0.35)",          bg: "rgba(245,166,35,0.05)",        label: T.amber },
  critical: { border: "rgba(255,92,108,0.45)",          bg: "rgba(255,92,108,0.06)",        label: T.red },
};

// Parse pasted text into vitals object
function parsePastedVitals(text) {
  const result = {};
  const t = text.toLowerCase();

  const extract = (pattern) => {
    const m = t.match(pattern);
    return m ? parseFloat(m[1]) : null;
  };

  // Temperature
  const temp = extract(/\btemp(?:erature)?\s*[:\-]?\s*([\d.]+)/);
  if (temp) result.temperature = { value: temp, unit: "F" };

  // Heart rate
  const hr = extract(/\b(?:hr|heart\s*rate|pulse)\s*[:\-]?\s*([\d.]+)/);
  if (hr) result.heart_rate = { value: hr, unit: "bpm" };

  // Blood pressure
  const bpM = t.match(/\bbp\s*[:\-]?\s*(\d+)\s*\/\s*(\d+)/);
  if (bpM) result.blood_pressure = { systolic: parseFloat(bpM[1]), diastolic: parseFloat(bpM[2]), unit: "mmHg" };

  // Respiratory rate
  const rr = extract(/\b(?:rr|resp(?:iratory)?\s*rate?)\s*[:\-]?\s*([\d.]+)/);
  if (rr) result.respiratory_rate = { value: rr, unit: "breaths/min" };

  // O2
  const o2 = extract(/\b(?:spo2|o2\s*sat|sat(?:uration)?|o2)\s*[:\-]?\s*([\d.]+)/);
  if (o2) result.oxygen_saturation = { value: o2, unit: "%" };

  // Weight
  const wt = extract(/\bweight\s*[:\-]?\s*([\d.]+)/);
  if (wt) result.weight = { value: wt, unit: "lbs" };

  return result;
}

export default function VitalsInputPanel({ note, noteId, queryClient }) {
  const [vitals, setVitals] = useState(note?.vital_signs || {});
  const [bpInput, setBpInput] = useState(
    note?.vital_signs?.blood_pressure
      ? `${note.vital_signs.blood_pressure.systolic}/${note.vital_signs.blood_pressure.diastolic}`
      : ""
  );
  const [pasteText, setPasteText] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(true);

  const saveVitals = async (updated) => {
    setSaving(true);
    try {
      await base44.entities.ClinicalNote.update(noteId, { vital_signs: updated });
      queryClient.invalidateQueries({ queryKey: ["note", noteId] });
    } catch {
      toast.error("Failed to save vitals");
    }
    setSaving(false);
  };

  const handleFieldChange = (configId, value) => {
    const updated = { ...vitals, [configId]: { ...vitals[configId], value: parseFloat(value) || value, unit: VITALS_CONFIG.find(c => c.id === configId)?.unit || "" } };
    setVitals(updated);
  };

  const handleBpChange = (raw) => {
    setBpInput(raw);
    const m = raw.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (m) {
      const updated = { ...vitals, blood_pressure: { systolic: parseFloat(m[1]), diastolic: parseFloat(m[2]), unit: "mmHg" } };
      setVitals(updated);
    }
  };

  const handleBlur = () => saveVitals(vitals);

  const handleParse = () => {
    if (!pasteText.trim()) return;
    const parsed = parsePastedVitals(pasteText);
    if (!Object.keys(parsed).length) { toast.error("Could not parse any vitals from the text"); return; }
    const merged = { ...vitals, ...parsed };
    // Sync BP input field
    if (parsed.blood_pressure) {
      setBpInput(`${parsed.blood_pressure.systolic}/${parsed.blood_pressure.diastolic}`);
    }
    setVitals(merged);
    saveVitals(merged);
    setPasteText("");
    setShowPaste(false);
    toast.success(`Parsed ${Object.keys(parsed).length} vital signs`);
  };

  const handleAnalyze = async () => {
    const hasAny = Object.keys(vitals).some(k => vitals[k]?.value !== undefined || vitals[k]?.systolic);
    if (!hasAny) { toast.error("Enter vitals before analyzing"); return; }
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const vitalsText = VITALS_CONFIG.map(c => {
        if (c.isBP) {
          const bp = vitals.blood_pressure;
          return bp?.systolic ? `BP: ${bp.systolic}/${bp.diastolic} mmHg` : null;
        }
        const v = vitals[c.id]?.value;
        return v !== undefined && v !== "" ? `${c.label}: ${v} ${c.unit}` : null;
      }).filter(Boolean).join(", ");

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical AI assistant. Analyze these vital signs and identify any abnormalities.
Patient: ${note?.patient_name || "Unknown"}, ${note?.patient_age || ""} ${note?.patient_gender || ""}
Vitals: ${vitalsText}
Chief Complaint: ${note?.chief_complaint || "N/A"}

Return a structured JSON analysis.`,
        response_json_schema: {
          type: "object",
          properties: {
            overall_status: { type: "string", enum: ["normal", "concerning", "critical"] },
            summary: { type: "string" },
            abnormalities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  vital: { type: "string" },
                  value: { type: "string" },
                  finding: { type: "string" },
                  severity: { type: "string", enum: ["mild", "moderate", "severe"] },
                  clinical_significance: { type: "string" }
                }
              }
            },
            clinical_impression: { type: "string" },
            recommended_actions: { type: "array", items: { type: "string" } }
          }
        }
      });
      setAnalysis(result);
      setShowAnalysis(true);
    } catch {
      toast.error("Analysis failed");
    }
    setAnalyzing(false);
  };

  const criticals = VITALS_CONFIG.filter(c => getStatus(c, vitals) === "critical");
  const warnings = VITALS_CONFIG.filter(c => getStatus(c, vitals) === "warning");

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: 5, background: "rgba(0,212,188,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>🫀</div>
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: T.dim }}>Vital Signs</span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {criticals.length > 0 && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(255,92,108,0.1)", color: T.red, border: "1px solid rgba(255,92,108,0.2)", fontWeight: 600 }}>{criticals.length} critical</span>}
          {warnings.length > 0 && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(245,166,35,0.1)", color: T.amber, border: "1px solid rgba(245,166,35,0.2)", fontWeight: 600 }}>{warnings.length} warning</span>}
          {saving && <Loader2 size={11} className="animate-spin" style={{ color: T.dim }} />}
          <button
            onClick={() => setShowPaste(p => !p)}
            title="Paste & parse vitals text"
            style={{ padding: "3px 9px", borderRadius: 5, fontSize: 10, cursor: "pointer", border: `1px solid ${T.border}`, background: showPaste ? "rgba(0,212,188,0.08)" : "transparent", color: showPaste ? T.teal : T.dim, display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s" }}
          >
            <ClipboardPaste size={10} /> Paste
          </button>
        </div>
      </div>

      {/* Paste area */}
      {showPaste && (
        <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.border}`, background: T.slate }}>
          <div style={{ fontSize: 10, color: T.dim, marginBottom: 6 }}>Paste raw vitals text (e.g. "HR 88, BP 142/90, Temp 101.2, SpO2 96%")</div>
          <textarea
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            placeholder="Paste vitals here…"
            rows={2}
            style={{ width: "100%", background: T.edge, border: `1px solid ${T.border}`, color: T.bright, borderRadius: 8, padding: "8px 10px", fontSize: 12, fontFamily: "DM Sans, sans-serif", outline: "none", resize: "none" }}
            onFocus={e => e.target.style.borderColor = T.teal}
            onBlur={e => e.target.style.borderColor = T.border}
          />
          <button
            onClick={handleParse}
            style={{ marginTop: 6, padding: "5px 16px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", background: `linear-gradient(135deg, ${T.teal}, ${T.teal2})`, color: T.navy }}
          >Parse Vitals</button>
        </div>
      )}

      {/* Input grid */}
      <div style={{ padding: "12px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {VITALS_CONFIG.map(config => {
          const status = getStatus(config, vitals);
          const sc = statusColors[status];
          const currentVal = config.isBP ? bpInput : (vitals[config.id]?.value ?? "");

          return (
            <div key={config.id} style={{ border: sc.border, background: sc.bg, borderRadius: 10, padding: "9px 12px", display: "flex", flexDirection: "column", gap: 4, transition: "border-color 0.2s" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: T.dim }}>{config.label}</span>
                <span style={{ fontSize: 9, color: sc.label }}>{config.unit}</span>
              </div>
              <input
                type={config.isBP ? "text" : "number"}
                value={currentVal}
                onChange={e => config.isBP ? handleBpChange(e.target.value) : handleFieldChange(config.id, e.target.value)}
                onBlur={handleBlur}
                placeholder={config.placeholder}
                step={config.id === "temperature" ? "0.1" : "1"}
                style={{
                  background: "transparent", border: "none", color: T.bright,
                  fontSize: 18, fontWeight: 500, outline: "none", width: "100%",
                  fontFamily: "Playfair Display, serif"
                }}
              />
              {status === "critical" && <div style={{ fontSize: 9, color: T.red }}>⚠ Critical</div>}
              {status === "warning"  && <div style={{ fontSize: 9, color: T.amber }}>⚡ Abnormal</div>}
            </div>
          );
        })}
      </div>

      {/* BMI */}
      {vitals?.weight?.value && vitals?.height?.value && (
        <div style={{ padding: "6px 14px", borderTop: `1px solid ${T.border}`, fontSize: 11, color: T.dim, display: "flex", gap: 14 }}>
          <span>BMI: <strong style={{ color: T.bright }}>{(vitals.weight.value / ((vitals.height.value * 0.0254) ** 2)).toFixed(1)}</strong></span>
          <span>Ht: <strong style={{ color: T.text }}>{vitals.height.value} {vitals.height.unit || "in"}</strong></span>
        </div>
      )}

      {/* AI Analyze button */}
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${T.border}` }}>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          style={{ width: "100%", padding: "8px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${T.border}`, background: analyzing ? "rgba(155,109,255,0.08)" : "rgba(155,109,255,0.1)", color: T.purple, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.15s" }}
          onMouseEnter={e => { if (!analyzing) e.currentTarget.style.borderColor = T.purple; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; }}
        >
          {analyzing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          {analyzing ? "Analyzing…" : "AI Analyze Vitals"}
        </button>
      </div>

      {/* Analysis results */}
      {analysis && (
        <div style={{ borderTop: `1px solid ${T.border}` }}>
          <button
            onClick={() => setShowAnalysis(p => !p)}
            style={{ width: "100%", padding: "9px 14px", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", color: T.dim, fontSize: 11 }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {analysis.overall_status === "critical" ? <AlertTriangle size={12} style={{ color: T.red }} /> :
               analysis.overall_status === "concerning" ? <AlertTriangle size={12} style={{ color: T.amber }} /> :
               <CheckCircle2 size={12} style={{ color: T.green }} />}
              <strong style={{ color: analysis.overall_status === "critical" ? T.red : analysis.overall_status === "concerning" ? T.amber : T.green, textTransform: "capitalize" }}>
                {analysis.overall_status}
              </strong>
              {" — AI Vital Analysis"}
            </span>
            {showAnalysis ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {showAnalysis && (
            <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Summary */}
              <div style={{ fontSize: 12, color: T.text, lineHeight: 1.7 }}>{analysis.summary}</div>

              {/* Abnormalities */}
              {analysis.abnormalities?.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: T.dim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Abnormal Findings</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {analysis.abnormalities.map((ab, i) => (
                      <div key={i} style={{
                        padding: "8px 10px", borderRadius: 8, fontSize: 12,
                        border: ab.severity === "severe" ? "1px solid rgba(255,92,108,0.3)" : ab.severity === "moderate" ? "1px solid rgba(245,166,35,0.3)" : `1px solid ${T.border}`,
                        background: ab.severity === "severe" ? "rgba(255,92,108,0.05)" : ab.severity === "moderate" ? "rgba(245,166,35,0.05)" : T.edge,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          <span style={{ fontWeight: 600, color: ab.severity === "severe" ? T.red : ab.severity === "moderate" ? T.amber : T.amber }}>{ab.vital}: {ab.value}</span>
                          <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 3, background: ab.severity === "severe" ? "rgba(255,92,108,0.15)" : "rgba(245,166,35,0.15)", color: ab.severity === "severe" ? T.red : T.amber, fontWeight: 700, textTransform: "uppercase" }}>{ab.severity}</span>
                        </div>
                        <div style={{ color: T.text, lineHeight: 1.6 }}>{ab.finding}</div>
                        {ab.clinical_significance && <div style={{ color: T.dim, fontSize: 11, marginTop: 3 }}>{ab.clinical_significance}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clinical impression */}
              {analysis.clinical_impression && (
                <div style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(0,212,188,0.05)", border: `1px solid rgba(0,212,188,0.15)`, fontSize: 12, color: T.text, lineHeight: 1.7 }}>
                  <span style={{ fontSize: 10, color: T.teal, fontWeight: 600, display: "block", marginBottom: 4 }}>CLINICAL IMPRESSION</span>
                  {analysis.clinical_impression}
                </div>
              )}

              {/* Actions */}
              {analysis.recommended_actions?.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: T.dim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Recommended Actions</div>
                  {analysis.recommended_actions.map((a, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 4, fontSize: 12, color: T.text }}>
                      <span style={{ color: T.teal, fontSize: 10, marginTop: 3 }}>→</span>
                      {a}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}