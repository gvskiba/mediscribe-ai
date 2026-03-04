import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, Check, AlertTriangle, Copy, ChevronDown, ChevronUp, Plus, Zap, Activity } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import VitalSignsDisplayPanel from "./VitalSignsDisplayPanel";
import VitalsInputPanel from "./VitalsInputPanel";

/* ── Theme ─────────────────────────────────────────────── */
const T = {
  navy:   "#050f1e",
  slate:  "#0b1d35",
  panel:  "#0e2340",
  edge:   "#162d4f",
  border: "#1e3a5f",
  muted:  "#2a4d72",
  dim:    "#4a7299",
  text:   "#c8ddf0",
  bright: "#e8f4ff",
  teal:   "#00d4bc",
  teal2:  "#00a896",
  amber:  "#f5a623",
  red:    "#ff5c6c",
  green:  "#2ecc71",
  purple: "#9b6dff",
  rose:   "#f472b6",
};

/* ── Vital Sign Definitions ─────────────────────────────── */
const VITAL_DEFS = [
  {
    id: "heart_rate", label: "Heart Rate", unit: "bpm", short: "HR",
    path: ["heart_rate", "value"],
    normalRange: [60, 100],
    icon: "🫀",
  },
  {
    id: "blood_pressure", label: "Blood Pressure", unit: "mmHg", short: "BP",
    path: null, // special
    normalRange: [90, 140], // systolic
    icon: "💉",
  },
  {
    id: "respiratory_rate", label: "Resp Rate", unit: "br/min", short: "RR",
    path: ["respiratory_rate", "value"],
    normalRange: [12, 20],
    icon: "🫁",
  },
  {
    id: "oxygen_saturation", label: "O₂ Sat", unit: "%", short: "SpO₂",
    path: ["oxygen_saturation", "value"],
    normalRange: [95, 100],
    icon: "🫧",
  },
  {
    id: "temperature", label: "Temperature", unit: "°F", short: "Temp",
    path: ["temperature", "value"],
    normalRange: [97, 99],
    icon: "🌡️",
  },
  {
    id: "weight", label: "Weight", unit: "lbs", short: "Wt",
    path: ["weight", "value"],
    normalRange: null,
    icon: "⚖️",
  },
];

const OLDCARTS_FIELDS = [
  { key: "O", label: "Onset", field: "onset", placeholder: "When did it start?" },
  { key: "L", label: "Location", field: "location", placeholder: "Where is it?" },
  { key: "D", label: "Duration", field: "duration", placeholder: "How long?" },
  { key: "C", label: "Character", field: "character", placeholder: "Sharp, dull, burning?" },
  { key: "A", label: "Aggravating", field: "aggravating", placeholder: "What makes it worse?" },
  { key: "R", label: "Relieving", field: "relieving", placeholder: "What makes it better?" },
  { key: "T", label: "Timing", field: "timing", placeholder: "Constant vs intermittent?" },
  { key: "S", label: "Severity", field: "severity", placeholder: "Scale 0–10?" },
];

const ROS_SYSTEMS = [
  { id: "constitutional", label: "Constitutional", symptoms: ["Fever", "Chills", "Weight loss", "Fatigue", "Night sweats", "Appetite changes"] },
  { id: "cardiovascular", label: "Cardiovascular", symptoms: ["Chest pain", "Palpitations", "Syncope", "Edema", "Orthopnea", "PND"] },
  { id: "pulmonary", label: "Pulmonary", symptoms: ["Shortness of breath", "Cough", "Hemoptysis", "Wheezing", "Pleuritic pain"] },
  { id: "gastrointestinal", label: "GI / Abdomen", symptoms: ["Nausea", "Vomiting", "Diarrhea", "Constipation", "Abdominal pain", "Melena"] },
  { id: "genitourinary", label: "Genitourinary", symptoms: ["Dysuria", "Hematuria", "Frequency", "Urgency", "Flank pain"] },
  { id: "musculoskeletal", label: "MSK", symptoms: ["Joint pain", "Swelling", "Back pain", "Muscle weakness", "Limited ROM"] },
  { id: "neurological", label: "Neurological", symptoms: ["Headache", "Dizziness", "Numbness", "Tingling", "Vision changes", "Weakness"] },
  { id: "skin", label: "Skin / HEENT", symptoms: ["Rash", "Pruritus", "Jaundice", "Sore throat", "Ear pain", "Nasal congestion"] },
];

/* ── Helpers ─────────────────────────────────────────────── */
function getVitalValue(vitals, def) {
  if (!vitals) return null;
  if (def.id === "blood_pressure") {
    const sys = vitals?.blood_pressure?.systolic;
    const dia = vitals?.blood_pressure?.diastolic;
    if (sys && dia) return `${sys}/${dia}`;
    if (sys) return `${sys}`;
    return null;
  }
  if (!def.path) return null;
  let v = vitals;
  for (const k of def.path) { v = v?.[k]; }
  return v ?? null;
}

function getVitalStatus(vitals, def) {
  const v = getVitalValue(vitals, def);
  if (v === null) return "empty";
  if (!def.normalRange) return "normal";
  const num = def.id === "blood_pressure"
    ? parseInt(String(v).split("/")[0])
    : Number(v);
  if (isNaN(num)) return "normal";
  if (num < def.normalRange[0] || num > def.normalRange[1]) {
    const delta = Math.max(
      def.normalRange[0] - num,
      num - def.normalRange[1]
    );
    return delta > (def.normalRange[1] - def.normalRange[0]) * 0.2 ? "critical" : "warning";
  }
  return "normal";
}

const statusColor = { normal: T.green, warning: T.amber, critical: T.red, empty: T.border };
const statusBg = {
  normal: { border: `1px solid ${T.border}`, background: T.edge },
  warning: { border: "1px solid rgba(245,166,35,0.35)", background: "rgba(245,166,35,0.04)" },
  critical: { border: "1px solid rgba(255,92,108,0.45)", background: "rgba(255,92,108,0.05)" },
  empty: { border: `1px solid ${T.border}`, background: T.edge },
};

function Panel({ children, style = {} }) {
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column", ...style }}>
      {children}
    </div>
  );
}

function PanelHeader({ icon, title, action, iconBg, iconColor }) {
  return (
    <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {icon && (
          <div style={{ width: 20, height: 20, borderRadius: 5, background: iconBg || "rgba(0,212,188,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
            {typeof icon === "string" ? icon : <span style={{ color: iconColor || T.teal }}>{icon}</span>}
          </div>
        )}
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: T.dim }}>{title}</span>
      </div>
      {action}
    </div>
  );
}

/* ── Vital Card ─────────────────────────────────────────── */
function VitalCard({ def, vitals, onEdit }) {
  const value = getVitalValue(vitals, def);
  const status = getVitalStatus(vitals, def);
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [inputSys, setInputSys] = useState("");
  const [inputDia, setInputDia] = useState("");

  const startEdit = () => {
    if (def.id === "blood_pressure") {
      const parts = String(value || "").split("/");
      setInputSys(parts[0] || "");
      setInputDia(parts[1] || "");
    } else {
      setInputVal(value !== null ? String(value) : "");
    }
    setEditing(true);
  };

  const commit = () => {
    if (def.id === "blood_pressure") {
      onEdit({ blood_pressure: { systolic: parseFloat(inputSys), diastolic: parseFloat(inputDia), unit: "mmHg" } });
    } else {
      onEdit({ [def.id]: { value: parseFloat(inputVal), unit: def.unit } });
    }
    setEditing(false);
  };

  const col = statusColor[status];

  return (
    <div
      onClick={startEdit}
      style={{ ...statusBg[status], borderRadius: 12, padding: "14px 16px", cursor: "pointer", position: "relative", overflow: "hidden", transition: "all 0.2s" }}
      onMouseEnter={e => { if (!editing) e.currentTarget.style.borderColor = col; }}
      onMouseLeave={e => { if (!editing) e.currentTarget.style.borderColor = statusBg[status].border.replace("1px solid ", ""); }}
    >
      <div style={{ fontSize: 10, color: T.dim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{def.label}</div>
      {editing ? (
        <div onClick={e => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {def.id === "blood_pressure" ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input autoFocus value={inputSys} onChange={e => setInputSys(e.target.value)} placeholder="Sys" style={{ width: 52, background: T.slate, border: `1px solid ${T.border}`, color: T.bright, borderRadius: 6, padding: "4px 8px", fontSize: 14, outline: "none" }} />
              <span style={{ color: T.dim }}>/</span>
              <input value={inputDia} onChange={e => setInputDia(e.target.value)} placeholder="Dia" style={{ width: 52, background: T.slate, border: `1px solid ${T.border}`, color: T.bright, borderRadius: 6, padding: "4px 8px", fontSize: 14, outline: "none" }} />
            </div>
          ) : (
            <input autoFocus value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }} style={{ width: "100%", background: T.slate, border: `1px solid ${T.border}`, color: T.bright, borderRadius: 6, padding: "4px 8px", fontSize: 14, outline: "none" }} />
          )}
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={commit} style={{ flex: 1, padding: "4px", borderRadius: 6, background: `rgba(0,212,188,0.15)`, border: `1px solid ${T.teal}`, color: T.teal, fontSize: 11, cursor: "pointer" }}>Save</button>
            <button onClick={() => setEditing(false)} style={{ flex: 1, padding: "4px", borderRadius: 6, background: "transparent", border: `1px solid ${T.border}`, color: T.dim, fontSize: 11, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontFamily: "Playfair Display, serif", fontSize: 26, fontWeight: 500, color: value !== null ? col : T.muted, lineHeight: 1 }}>
              {value !== null ? value : "—"}
            </span>
            {value !== null && <span style={{ fontSize: 11, color: T.dim }}>{def.unit}</span>}
          </div>
          {def.normalRange && value !== null && (
            <div style={{ marginTop: 8, height: 3, background: T.border, borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${Math.min(100, Math.max(0, ((Number(String(value).split("/")[0]) - def.normalRange[0]) / (def.normalRange[1] - def.normalRange[0])) * 100))}%`,
                background: col, borderRadius: 2,
              }} />
            </div>
          )}
          {value === null && <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>Click to enter</div>}
        </>
      )}
    </div>
  );
}

/* ── Vitals Panel ───────────────────────────────────────── */
function VitalsPanel({ note, noteId, queryClient }) {
  const vitals = note?.vital_signs || {};
  const [saving, setSaving] = useState(false);

  const handleEdit = async (update) => {
    setSaving(true);
    const newVitals = { ...vitals, ...update };
    await base44.entities.ClinicalNote.update(noteId, { vital_signs: newVitals });
    queryClient.invalidateQueries({ queryKey: ["note", noteId] });
    setSaving(false);
  };

  const criticalCount = VITAL_DEFS.filter(d => getVitalStatus(vitals, d) === "critical").length;
  const warningCount = VITAL_DEFS.filter(d => getVitalStatus(vitals, d) === "warning").length;

  return (
    <Panel>
      <PanelHeader icon="🫀" title="Vital Signs"
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {criticalCount > 0 && (
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(255,92,108,0.1)", color: T.red, border: "1px solid rgba(255,92,108,0.2)", fontWeight: 600 }}>
                {criticalCount} critical
              </span>
            )}
            {warningCount > 0 && (
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(245,166,35,0.1)", color: T.amber, border: "1px solid rgba(245,166,35,0.2)", fontWeight: 600 }}>
                {warningCount} warning
              </span>
            )}
            {saving && <Loader2 size={12} className="animate-spin" style={{ color: T.dim }} />}
          </div>
        }
      />
      <div style={{ padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, overflowY: "auto" }}>
        {VITAL_DEFS.map(def => (
          <VitalCard key={def.id} def={def} vitals={vitals} onEdit={handleEdit} />
        ))}
      </div>
      {/* BMI row */}
      {vitals?.weight?.value && vitals?.height?.value && (
        <div style={{ padding: "10px 16px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 16, fontSize: 12, color: T.dim }}>
          <span>BMI: <span style={{ color: T.bright, fontWeight: 600 }}>
            {(vitals.weight.value / ((vitals.height.value * 0.0254) ** 2)).toFixed(1)}
          </span></span>
          <span>Ht: <span style={{ color: T.text }}>{vitals.height?.value} {vitals.height?.unit || "in"}</span></span>
        </div>
      )}
    </Panel>
  );
}

/* ── HPI Panel ──────────────────────────────────────────── */
function HPIPanel({ note, noteId, queryClient, analyzingRawData, setAnalyzingRawData, setStructuredPreview, setShowStructuredPreview }) {
  const [oldcarts, setOldcarts] = useState({});
  const [narrative, setNarrative] = useState(note?.history_of_present_illness || "");
  const [editingField, setEditingField] = useState(null);
  const [tempVal, setTempVal] = useState("");
  const [generatingHPI, setGeneratingHPI] = useState(false);
  const [saving, setSaving] = useState(false);

  // Parse existing HPI into OLDCARTS if possible
  useEffect(() => {
    setNarrative(note?.history_of_present_illness || "");
  }, [note?.id]);

  const saveNarrative = async (val) => {
    setSaving(true);
    await base44.entities.ClinicalNote.update(noteId, { history_of_present_illness: val });
    queryClient.invalidateQueries({ queryKey: ["note", noteId] });
    setSaving(false);
  };

  const generateHPI = async () => {
    if (!note?.chief_complaint && !oldcarts) return;
    setGeneratingHPI(true);
    try {
      const oldcartsText = OLDCARTS_FIELDS
        .filter(f => oldcarts[f.field])
        .map(f => `${f.label}: ${oldcarts[f.field]}`)
        .join(", ");
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a professional, concise HPI narrative for an ER note.
Chief Complaint: ${note.chief_complaint || "N/A"}
OLDCARTS: ${oldcartsText || "not yet documented"}
Existing HPI: ${narrative || "none"}
Patient: ${note.patient_name || "patient"}, ${note.patient_age || ""} y/o ${note.patient_gender || ""}
Write a single paragraph narrative HPI in third person, past tense. Be specific and clinically precise. Under 120 words.`,
      });
      const newNarrative = typeof result === "string" ? result : result?.text || "";
      setNarrative(newNarrative);
      await saveNarrative(newNarrative);
      toast.success("HPI generated");
    } catch {
      toast.error("Failed to generate HPI");
    } finally {
      setGeneratingHPI(false);
    }
  };

  const analyzeNote = async () => {
    if (!note?.raw_note && !note?.chief_complaint) { toast.error("No note data to analyze"); return; }
    setAnalyzingRawData(true);
    try {
      const response = await base44.functions.invoke('analyzeAndStructureNote', { noteId });
      setStructuredPreview(response.data.structured);
      setShowStructuredPreview(true);
      queryClient.invalidateQueries({ queryKey: ["note", noteId] });
    } catch { toast.error("Failed to analyze note"); } finally { setAnalyzingRawData(false); }
  };

  return (
    <Panel>
      <PanelHeader icon="📋" title="History of Present Illness"
        action={
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={generateHPI} disabled={generatingHPI}
              style={{ padding: "4px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer", border: `1px solid ${T.border}`, background: "transparent", color: T.dim, display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.purple; e.currentTarget.style.color = T.purple; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.dim; }}
            >
              {generatingHPI ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
              AI Draft
            </button>
            <button onClick={analyzeNote} disabled={analyzingRawData}
              style={{ padding: "4px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer", border: "none", background: `linear-gradient(135deg, ${T.teal}, ${T.teal2})`, color: T.navy, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}
            >
              {analyzingRawData ? <Loader2 size={10} className="animate-spin" /> : <Zap size={10} />}
              AI Structure
            </button>
          </div>
        }
      />

      {/* OLDCARTS Grid */}
      <div style={{ padding: "12px 14px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {OLDCARTS_FIELDS.map(field => (
            <div key={field.field}
              onClick={() => { setEditingField(field.field); setTempVal(oldcarts[field.field] || ""); }}
              style={{ background: T.edge, borderRadius: 8, padding: "9px 12px", border: `1px solid ${editingField === field.field ? T.teal : T.border}`, cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { if (editingField !== field.field) e.currentTarget.style.borderColor = T.muted; }}
              onMouseLeave={e => { if (editingField !== field.field) e.currentTarget.style.borderColor = T.border; }}
            >
              <div style={{ fontSize: 9, color: T.teal, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 3 }}>
                {field.key} — {field.label}
              </div>
              {editingField === field.field ? (
                <input
                  autoFocus
                  value={tempVal}
                  onChange={e => setTempVal(e.target.value)}
                  onBlur={() => { setOldcarts(o => ({ ...o, [field.field]: tempVal })); setEditingField(null); }}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") { setOldcarts(o => ({ ...o, [field.field]: tempVal })); setEditingField(null); } }}
                  placeholder={field.placeholder}
                  style={{ width: "100%", background: "transparent", border: "none", color: T.bright, fontSize: 13, outline: "none", fontWeight: 500 }}
                />
              ) : (
                <div style={{ fontSize: 13, color: oldcarts[field.field] ? T.bright : T.muted, fontWeight: oldcarts[field.field] ? 500 : 400, lineHeight: 1.4 }}>
                  {oldcarts[field.field] || field.placeholder}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Narrative */}
      <div style={{ padding: "12px 14px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 10, color: T.dim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Narrative</div>
        <textarea
          value={narrative}
          onChange={e => setNarrative(e.target.value)}
          onBlur={() => saveNarrative(narrative)}
          placeholder="Document the history of present illness narrative…"
          style={{
            flex: 1, minHeight: 120, width: "100%", background: T.edge, border: `1px solid ${T.border}`, color: T.bright,
            fontSize: 13, padding: "12px 14px", borderRadius: 10, outline: "none", resize: "vertical", lineHeight: 1.75,
            fontFamily: "DM Sans, sans-serif", transition: "border-color 0.2s",
          }}
          onFocus={e => { e.target.style.borderColor = T.teal + "88"; }}
          onBlurCapture={e => { e.target.style.borderColor = T.border; }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, fontSize: 11, color: T.dim }}>
          <span>{narrative.length} chars</span>
          {saving && <span style={{ color: T.teal }}>Saving…</span>}
        </div>
      </div>
    </Panel>
  );
}

/* ── ROS Panel ──────────────────────────────────────────── */
function ROSPanel({ note, noteId, queryClient }) {
  const [rosState, setRosState] = useState({});
  const [activeSystem, setActiveSystem] = useState(ROS_SYSTEMS[0].id);
  const [generatingROS, setGeneratingROS] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleSymptom = async (systemId, symptom, present) => {
    const updated = {
      ...rosState,
      [systemId]: {
        ...(rosState[systemId] || {}),
        [symptom]: present,
      },
    };
    setRosState(updated);
    setSaving(true);
    const rosText = buildROSText(updated);
    await base44.entities.ClinicalNote.update(noteId, { review_of_systems: rosText });
    queryClient.invalidateQueries({ queryKey: ["note", noteId] });
    setSaving(false);
  };

  const buildROSText = (state) => {
    return ROS_SYSTEMS.map(sys => {
      const sysState = state[sys.id] || {};
      const present = Object.entries(sysState).filter(([, v]) => v === true).map(([k]) => k);
      const absent = Object.entries(sysState).filter(([, v]) => v === false).map(([k]) => k);
      if (!present.length && !absent.length) return null;
      return `${sys.label}: ${present.length ? `Positive for ${present.join(", ")}. ` : ""}${absent.length ? `Denies ${absent.join(", ")}.` : ""}`.trim();
    }).filter(Boolean).join("\n");
  };

  const markAllNormal = async () => {
    const updated = {};
    ROS_SYSTEMS.forEach(sys => {
      updated[sys.id] = {};
      sys.symptoms.forEach(s => { updated[sys.id][s] = false; });
    });
    setRosState(updated);
    setSaving(true);
    const rosText = buildROSText(updated);
    await base44.entities.ClinicalNote.update(noteId, { review_of_systems: rosText });
    queryClient.invalidateQueries({ queryKey: ["note", noteId] });
    setSaving(false);
    toast.success("ROS set to all normal");
  };

  const generateROS = async () => {
    setGeneratingROS(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this clinical presentation, generate a Review of Systems for an ER note.
Chief Complaint: ${note?.chief_complaint || "N/A"}
HPI: ${note?.history_of_present_illness || "N/A"}
Return which symptoms are present (true) or absent (false) for each system.`,
        response_json_schema: {
          type: "object",
          properties: {
            systems: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  system: { type: "string" },
                  symptoms: { type: "array", items: { type: "object", properties: { name: { type: "string" }, present: { type: "boolean" } } } }
                }
              }
            }
          }
        }
      });
      const updated = { ...rosState };
      (result.systems || []).forEach(sys => {
        const match = ROS_SYSTEMS.find(s => s.label.toLowerCase().includes(sys.system.toLowerCase()) || sys.system.toLowerCase().includes(s.label.toLowerCase()));
        if (match) {
          updated[match.id] = updated[match.id] || {};
          (sys.symptoms || []).forEach(s => { updated[match.id][s.name] = s.present; });
        }
      });
      setRosState(updated);
      const rosText = buildROSText(updated);
      await base44.entities.ClinicalNote.update(noteId, { review_of_systems: rosText });
      queryClient.invalidateQueries({ queryKey: ["note", noteId] });
      toast.success("ROS generated");
    } catch {
      toast.error("Failed to generate ROS");
    } finally {
      setGeneratingROS(false);
    }
  };

  const activeSystemDef = ROS_SYSTEMS.find(s => s.id === activeSystem);
  const sysState = rosState[activeSystem] || {};

  const documentedCount = ROS_SYSTEMS.filter(s => {
    const st = rosState[s.id] || {};
    return Object.keys(st).length > 0;
  }).length;

  const positiveCount = ROS_SYSTEMS.reduce((acc, s) => {
    return acc + Object.values(rosState[s.id] || {}).filter(v => v === true).length;
  }, 0);

  return (
    <Panel>
      <PanelHeader icon="📝" title="Review of Systems"
        action={
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {saving && <Loader2 size={10} className="animate-spin" style={{ color: T.dim }} />}
            <button onClick={markAllNormal}
              style={{ padding: "3px 9px", borderRadius: 5, fontSize: 10, cursor: "pointer", border: `1px solid ${T.border}`, background: "transparent", color: T.dim, transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.green; e.currentTarget.style.color = T.green; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.dim; }}
            >All Normal</button>
            <button onClick={generateROS} disabled={generatingROS}
              style={{ padding: "3px 9px", borderRadius: 5, fontSize: 10, cursor: "pointer", border: `1px solid ${T.border}`, background: "transparent", color: T.dim, display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.purple; e.currentTarget.style.color = T.purple; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.dim; }}
            >
              {generatingROS ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} AI
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div style={{ padding: "8px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 14, fontSize: 11 }}>
        <span style={{ color: T.dim }}>{documentedCount}/{ROS_SYSTEMS.length} systems</span>
        {positiveCount > 0 && <span style={{ color: T.red }}>+{positiveCount} positive</span>}
      </div>

      {/* System tabs */}
      <div style={{ display: "flex", flexDirection: "column", gap: 1, padding: "6px 6px 0", overflowY: "auto" }}>
        {ROS_SYSTEMS.map(sys => {
          const st = rosState[sys.id] || {};
          const hasData = Object.keys(st).length > 0;
          const hasPositive = Object.values(st).some(v => v === true);
          const isActive = activeSystem === sys.id;
          return (
            <button key={sys.id} onClick={() => setActiveSystem(sys.id)}
              style={{
                padding: "7px 10px", borderRadius: 7, textAlign: "left", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 12, transition: "all 0.15s",
                background: isActive ? "rgba(0,212,188,0.06)" : "transparent",
                borderLeft: `3px solid ${isActive ? T.teal : "transparent"}`,
                color: isActive ? T.teal : T.text,
              }}
            >
              <span style={{ flex: 1, fontWeight: isActive ? 600 : 400 }}>{sys.label}</span>
              {hasPositive && <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.red, flexShrink: 0 }} />}
              {hasData && !hasPositive && <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>

      {/* Symptoms for active system */}
      {activeSystemDef && (
        <div style={{ padding: "10px 12px 14px", borderTop: `1px solid ${T.border}`, marginTop: 4 }}>
          <div style={{ fontSize: 10, color: T.dim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{activeSystemDef.label}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {activeSystemDef.symptoms.map(symptom => {
              const val = sysState[symptom];
              return (
                <div key={symptom} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", borderRadius: 6, border: `1px solid ${val === true ? "rgba(255,92,108,0.2)" : val === false ? "rgba(0,212,188,0.15)" : T.border}`, background: val === true ? "rgba(255,92,108,0.04)" : val === false ? "rgba(0,212,188,0.04)" : "transparent" }}>
                  <span style={{ flex: 1, fontSize: 12, color: T.text }}>{symptom}</span>
                  <button onClick={() => toggleSymptom(activeSystem, symptom, false)}
                    style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, cursor: "pointer", border: `1px solid ${val === false ? T.teal : T.border}`, background: val === false ? "rgba(0,212,188,0.1)" : "transparent", color: val === false ? T.teal : T.dim, transition: "all 0.15s" }}>
                    Denies
                  </button>
                  <button onClick={() => toggleSymptom(activeSystem, symptom, true)}
                    style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, cursor: "pointer", border: `1px solid ${val === true ? T.red : T.border}`, background: val === true ? "rgba(255,92,108,0.1)" : "transparent", color: val === true ? "#ff8a95" : T.dim, transition: "all 0.15s" }}>
                    Present
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Panel>
  );
}

/* ── Main SubjectiveTab ─────────────────────────────────── */
export default function SubjectiveTab({
  note, noteId, queryClient,
  templates, selectedTemplate, setSelectedTemplate,
  analyzingRawData, setAnalyzingRawData,
  structuredPreview, setStructuredPreview,
  showStructuredPreview, setShowStructuredPreview,
  isFirstTab, isLastTab, handleBack, handleNext,
  // unused but accepted for API compatibility
  checkingGrammar, setCheckingGrammar,
  grammarSuggestions, setGrammarSuggestions,
  loadingVitalAnalysis, setLoadingVitalAnalysis,
  vitalSignsAnalysis, setVitalSignsAnalysis,
  vitalSignsHistory, setVitalSignsHistory,
  rosNormal, setRosNormal,
}) {
  return (
    <div style={{
      background: T.navy,
      minHeight: "100%",
      fontFamily: "DM Sans, sans-serif",
      padding: "18px 22px 24px",
    }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&family=Playfair+Display:wght@400;500;600&family=JetBrains+Mono:wght@300;400;500&display=swap" />

      {/* 3-column grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 300px",
        gap: 14,
        alignItems: "start",
      }}>
        {/* Left: Vitals Display Panel */}
        <VitalSignsDisplayPanel vitals={note?.vital_signs} title="VITAL SIGNS" />

        {/* Center: HPI */}
        <HPIPanel
          note={note} noteId={noteId} queryClient={queryClient}
          analyzingRawData={analyzingRawData} setAnalyzingRawData={setAnalyzingRawData}
          setStructuredPreview={setStructuredPreview} setShowStructuredPreview={setShowStructuredPreview}
        />

        {/* Right: ROS */}
        <ROSPanel note={note} noteId={noteId} queryClient={queryClient} />
      </div>
    </div>
  );
}