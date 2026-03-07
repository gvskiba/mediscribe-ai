import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import {
  Plus, X, Printer, FileText, Check, Loader2, Search,
  ChevronDown, Sparkles, AlertTriangle, Pill
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const T = {
  bg: "#050f1e", surface: "#0b1829", card: "#0e2040",
  border: "#1a2d45", border2: "#1e3555",
  text: "#c8ddf0", bright: "#e8f4ff", muted: "#4a7299", dim: "#2a4d72",
  green: "#2ecc71", green_dim: "#001a10",
  amber: "#f5a623", amber_dim: "#2a1500",
  red: "#ff5c6c", red_dim: "#2a0a0f",
  blue: "#3b82f6", blue_dim: "#0d1e3a",
  teal: "#00d4bc", teal2: "#00a896", teal_dim: "#002e28",
};

const ROUTES = ["PO","IV","IM","SC","SL","IN","TOP","INH","PR","NG","Other"];
const FREQUENCIES = ["Once","STAT","BID","TID","QID","Q4H","Q6H","Q8H","Q12H","Q24H","PRN","Daily","Weekly","Other"];
const DURATIONS = ["1 day","2 days","3 days","5 days","7 days","10 days","14 days","21 days","30 days","90 days","Ongoing","Until follow-up"];

// Common med search list for typeahead
const COMMON_MEDS = [
  "Acetaminophen","Amoxicillin","Amoxicillin-Clavulanate","Azithromycin","Cephalexin",
  "Ciprofloxacin","Doxycycline","Ibuprofen","Lisinopril","Metformin","Metoprolol",
  "Omeprazole","Prednisone","Trimethoprim-Sulfamethoxazole","Albuterol","Atorvastatin",
  "Amlodipine","Pantoprazole","Losartan","Gabapentin","Metronidazole","Ceftriaxone",
  "Vancomycin","Piperacillin-Tazobactam","Meropenem","Furosemide","Morphine","Oxycodone",
  "Hydrocodone","Tramadol","Ondansetron","Promethazine","Diphenhydramine","Hydroxyzine",
  "Lorazepam","Diazepam","Alprazolam","Sertraline","Escitalopram","Fluoxetine",
  "Levothyroxine","Insulin Glargine","Insulin Regular","Warfarin","Rivaroxaban","Apixaban",
  "Aspirin","Clopidogrel","Atenolol","Carvedilol","Spironolactone","Hydrochlorothiazide",
];

function MedSearchInput({ onSelect }) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);

  const filtered = query.length >= 1
    ? COMMON_MEDS.filter(m => m.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  const handleSelect = (name) => {
    onSelect(name);
    setQuery("");
    setShowDropdown(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && query.trim()) {
      handleSelect(query.trim());
    }
    if (e.key === "Escape") setShowDropdown(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.muted }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setShowDropdown(true); }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder="Search or type medication name…"
            style={{
              width: "100%", background: T.surface, border: `1px solid ${T.border2}`,
              borderRadius: 8, color: T.text, fontSize: 13, padding: "9px 12px 9px 32px",
              outline: "none", boxSizing: "border-box"
            }}
            onFocusin={e => e.target.style.borderColor = T.teal}
          />
        </div>
        <button
          onClick={() => query.trim() && handleSelect(query.trim())}
          disabled={!query.trim()}
          style={{
            padding: "9px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
            border: "none", background: query.trim() ? T.teal : T.dim, color: T.bg, flexShrink: 0, transition: "all 0.15s"
          }}
        >
          <Plus size={14} style={{ display: "inline", marginRight: 4 }} />Add
        </button>
      </div>
      {showDropdown && filtered.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: T.card, border: `1px solid ${T.border2}`, borderRadius: 8,
          zIndex: 50, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", maxHeight: 240, overflowY: "auto"
        }}>
          {filtered.map(name => (
            <div
              key={name}
              onMouseDown={() => handleSelect(name)}
              style={{
                padding: "9px 14px", cursor: "pointer", fontSize: 13, color: T.text,
                borderBottom: `1px solid ${T.border}`, transition: "background 0.1s"
              }}
              onMouseEnter={e => e.currentTarget.style.background = T.surface}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RxRow({ rx, onChange, onRemove, index }) {
  const [open, setOpen] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      style={{
        background: T.card, border: `1px solid ${T.border2}`, borderRadius: 10,
        borderLeft: `3px solid ${T.teal}`, overflow: "hidden", marginBottom: 8
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer" }} onClick={() => setOpen(v => !v)}>
        <div style={{
          width: 22, height: 22, borderRadius: "50%", background: T.teal_dim, border: `1px solid ${T.teal}50`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          fontSize: 10, fontWeight: 700, color: T.teal
        }}>{index + 1}</div>
        <input
          value={rx.name}
          onChange={e => { e.stopPropagation(); onChange({ ...rx, name: e.target.value }); }}
          onClick={e => e.stopPropagation()}
          placeholder="Medication name"
          style={{
            flex: 1, background: "transparent", border: "none", color: T.bright,
            fontSize: 14, fontWeight: 600, outline: "none"
          }}
        />
        {rx.dose && <span style={{ fontSize: 11, color: T.teal, flexShrink: 0 }}>{rx.dose} {rx.unit}</span>}
        {rx.route && <span style={{ fontSize: 11, color: T.muted, flexShrink: 0 }}>{rx.route}</span>}
        {rx.frequency && <span style={{ fontSize: 11, color: T.muted, flexShrink: 0 }}>{rx.frequency}</span>}
        <button onClick={e => { e.stopPropagation(); setOpen(v => !v); }} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", flexShrink: 0 }}>
          <ChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
        </button>
        <button onClick={e => { e.stopPropagation(); onRemove(); }} style={{ background: "none", border: "none", color: T.dim, cursor: "pointer", flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.color = T.red}
          onMouseLeave={e => e.currentTarget.style.color = T.dim}
        ><X size={14} /></button>
      </div>

      {/* Detail fields */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "0 14px 14px", borderTop: `1px solid ${T.border}`, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, paddingTop: 12 }}>
              {/* Dose */}
              <div>
                <label style={{ fontSize: 10, color: T.muted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Dose</label>
                <input
                  value={rx.dose}
                  onChange={e => onChange({ ...rx, dose: e.target.value })}
                  placeholder="e.g. 500"
                  style={{ width: "100%", background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 6, color: T.text, fontSize: 12, padding: "6px 10px", outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = T.teal}
                  onBlur={e => e.target.style.borderColor = T.border2}
                />
              </div>
              {/* Unit */}
              <div>
                <label style={{ fontSize: 10, color: T.muted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Unit</label>
                <select value={rx.unit} onChange={e => onChange({ ...rx, unit: e.target.value })}
                  style={{ width: "100%", background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 6, color: T.text, fontSize: 12, padding: "6px 10px", outline: "none" }}>
                  {["mg","mcg","g","mEq","units","mL","mg/kg","mcg/kg","mg/kg/day","mL/hr","Other"].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              {/* Route */}
              <div>
                <label style={{ fontSize: 10, color: T.muted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Route</label>
                <select value={rx.route} onChange={e => onChange({ ...rx, route: e.target.value })}
                  style={{ width: "100%", background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 6, color: T.text, fontSize: 12, padding: "6px 10px", outline: "none" }}>
                  {ROUTES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              {/* Frequency */}
              <div>
                <label style={{ fontSize: 10, color: T.muted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Frequency</label>
                <select value={rx.frequency} onChange={e => onChange({ ...rx, frequency: e.target.value })}
                  style={{ width: "100%", background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 6, color: T.text, fontSize: 12, padding: "6px 10px", outline: "none" }}>
                  {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              {/* Duration */}
              <div>
                <label style={{ fontSize: 10, color: T.muted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Duration</label>
                <select value={rx.duration} onChange={e => onChange({ ...rx, duration: e.target.value })}
                  style={{ width: "100%", background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 6, color: T.text, fontSize: 12, padding: "6px 10px", outline: "none" }}>
                  {DURATIONS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              {/* Quantity */}
              <div>
                <label style={{ fontSize: 10, color: T.muted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Qty / Refills</label>
                <input
                  value={rx.qty}
                  onChange={e => onChange({ ...rx, qty: e.target.value })}
                  placeholder="e.g. #30 / 0"
                  style={{ width: "100%", background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 6, color: T.text, fontSize: 12, padding: "6px 10px", outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = T.teal}
                  onBlur={e => e.target.style.borderColor = T.border2}
                />
              </div>
              {/* Instructions — full width */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 10, color: T.muted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Instructions / Sig</label>
                <textarea
                  value={rx.instructions}
                  onChange={e => onChange({ ...rx, instructions: e.target.value })}
                  placeholder="e.g. Take 1 tablet by mouth twice daily with food"
                  rows={2}
                  style={{ width: "100%", background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 6, color: T.text, fontSize: 12, padding: "6px 10px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
                  onFocus={e => e.target.style.borderColor = T.teal}
                  onBlur={e => e.target.style.borderColor = T.border2}
                />
              </div>
              {/* Notes */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 10, color: T.muted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Clinical Notes / Special Instructions</label>
                <input
                  value={rx.notes}
                  onChange={e => onChange({ ...rx, notes: e.target.value })}
                  placeholder="e.g. Monitor renal function, avoid in pregnancy"
                  style={{ width: "100%", background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 6, color: T.text, fontSize: 12, padding: "6px 10px", outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = T.amber}
                  onBlur={e => e.target.style.borderColor = T.border2}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PrintPreview({ prescriptions, note, providerName, onClose }) {
  const handlePrint = () => {
    const win = window.open("", "_blank");
    const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Prescription — ${note.patient_name || "Patient"}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; background: #fff; padding: 40px; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 16px; margin-bottom: 20px; }
    .header h1 { font-size: 20pt; font-weight: bold; margin-bottom: 4px; }
    .header p { font-size: 10pt; color: #333; }
    .patient-box { border: 1px solid #ccc; border-radius: 4px; padding: 12px; margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .patient-box .field { font-size: 11pt; }
    .patient-box .label { font-size: 9pt; color: #555; text-transform: uppercase; letter-spacing: 0.05em; }
    .rx-item { border: 1px solid #000; border-radius: 4px; padding: 16px; margin-bottom: 14px; page-break-inside: avoid; }
    .rx-num { font-size: 9pt; color: #666; margin-bottom: 6px; }
    .rx-name { font-size: 16pt; font-weight: bold; margin-bottom: 6px; }
    .rx-dose { font-size: 12pt; margin-bottom: 4px; }
    .rx-sig { font-style: italic; font-size: 11pt; margin-bottom: 6px; border-left: 3px solid #333; padding-left: 10px; }
    .rx-meta { font-size: 9pt; color: #555; display: flex; gap: 20px; flex-wrap: wrap; }
    .rx-notes { font-size: 10pt; color: #444; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #ccc; }
    .footer { margin-top: 40px; border-top: 1px solid #000; padding-top: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
    .sig-line { width: 260px; border-bottom: 1px solid #000; margin-bottom: 4px; height: 36px; }
    .disclaimer { font-size: 8pt; color: #666; margin-top: 20px; text-align: center; border-top: 1px dashed #ccc; padding-top: 8px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>PRESCRIPTION</h1>
    <p>Date: ${date}</p>
  </div>

  <div class="patient-box">
    <div>
      <div class="label">Patient Name</div>
      <div class="field">${note.patient_name || "—"}</div>
    </div>
    <div>
      <div class="label">Date of Birth</div>
      <div class="field">${note.date_of_birth || "—"}</div>
    </div>
    <div>
      <div class="label">MRN / Patient ID</div>
      <div class="field">${note.patient_id || "—"}</div>
    </div>
    <div>
      <div class="label">Allergies</div>
      <div class="field">${(note.allergies || ["NKDA"]).join(", ")}</div>
    </div>
    <div>
      <div class="label">Diagnosis</div>
      <div class="field">${(note.diagnoses || []).slice(0, 2).join("; ") || "—"}</div>
    </div>
    <div>
      <div class="label">Date of Service</div>
      <div class="field">${note.date_of_visit || date}</div>
    </div>
  </div>

  ${prescriptions.map((rx, i) => `
  <div class="rx-item">
    <div class="rx-num">Rx ${i + 1} of ${prescriptions.length}</div>
    <div class="rx-name">${rx.name || "Unknown Medication"}</div>
    <div class="rx-dose">${rx.dose ? `${rx.dose} ${rx.unit}` : ""} ${rx.route ? `• ${rx.route}` : ""} ${rx.frequency ? `• ${rx.frequency}` : ""}</div>
    ${rx.instructions ? `<div class="rx-sig">Sig: ${rx.instructions}</div>` : ""}
    <div class="rx-meta">
      ${rx.duration ? `<span>Duration: ${rx.duration}</span>` : ""}
      ${rx.qty ? `<span>Quantity: ${rx.qty}</span>` : ""}
    </div>
    ${rx.notes ? `<div class="rx-notes">⚠ ${rx.notes}</div>` : ""}
  </div>
  `).join("")}

  <div class="footer">
    <div>
      <div class="sig-line"></div>
      <div style="font-size:10pt;">Prescriber Signature</div>
      <div style="font-size:11pt; margin-top:6px; font-weight:bold;">${providerName || "Provider Name"}</div>
    </div>
    <div style="text-align:right; font-size:10pt; color:#555;">
      <div>${prescriptions.length} medication${prescriptions.length !== 1 ? "s" : ""} prescribed</div>
      <div>Generated: ${date}</div>
    </div>
  </div>

  <div class="disclaimer">
    This prescription was generated by an electronic health record system. Verify all information before dispensing.
    This document must bear the prescriber's original signature to be valid.
  </div>
</body>
</html>`;
    win.document.write(html);
    win.document.close();
    win.print();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "min(700px, 96vw)", maxHeight: "90vh", background: T.card, border: `1px solid ${T.border2}`, borderRadius: 12, display: "flex", flexDirection: "column", boxShadow: "0 32px 80px rgba(0,0,0,0.7)", overflow: "hidden" }}
      >
        {/* Modal header */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12 }}>
          <FileText size={18} style={{ color: T.teal }} />
          <span style={{ fontSize: 15, fontWeight: 600, color: T.bright, flex: 1 }}>Prescription Preview</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}><X size={16} /></button>
        </div>

        {/* Scrollable preview */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {/* Patient header */}
          <div style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 8, padding: "12px 16px", marginBottom: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              ["Patient", note.patient_name || "—"],
              ["DOB", note.date_of_birth || "—"],
              ["MRN", note.patient_id || "—"],
              ["Allergies", (note.allergies || ["NKDA"]).join(", ")],
              ["Diagnosis", (note.diagnoses || []).slice(0,2).join("; ") || "—"],
              ["Date", note.date_of_visit || new Date().toLocaleDateString()],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: 9, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13, color: T.text }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Rx items */}
          {prescriptions.map((rx, i) => (
            <div key={i} style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 8, padding: "14px 16px", marginBottom: 10, borderLeft: `3px solid ${T.teal}` }}>
              <div style={{ fontSize: 9, color: T.muted, marginBottom: 4 }}>Rx {i + 1}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.bright, marginBottom: 4 }}>{rx.name || "—"}</div>
              <div style={{ fontSize: 12, color: T.teal, marginBottom: 6 }}>
                {rx.dose && `${rx.dose} ${rx.unit}`}{rx.route && ` • ${rx.route}`}{rx.frequency && ` • ${rx.frequency}`}{rx.duration && ` • ${rx.duration}`}
              </div>
              {rx.instructions && (
                <div style={{ fontSize: 12, color: T.text, background: T.bg, padding: "6px 10px", borderRadius: 5, borderLeft: `2px solid ${T.teal}`, marginBottom: 6 }}>
                  Sig: {rx.instructions}
                </div>
              )}
              {rx.qty && <div style={{ fontSize: 11, color: T.muted }}>Qty: {rx.qty}</div>}
              {rx.notes && (
                <div style={{ marginTop: 8, fontSize: 11, color: T.amber, display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <AlertTriangle size={11} style={{ marginTop: 1, flexShrink: 0 }} /> {rx.notes}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 10, justifyContent: "flex-end", background: T.surface }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 7, fontSize: 12, color: T.muted, background: "transparent", border: `1px solid ${T.border2}`, cursor: "pointer" }}>
            Close
          </button>
          <button
            onClick={handlePrint}
            style={{ padding: "8px 20px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", background: T.teal, color: T.bg, display: "flex", alignItems: "center", gap: 6 }}
            onMouseEnter={e => { e.currentTarget.style.background = "#00efd8"; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.teal; }}
          >
            <Printer size={14} /> Print / Download
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const newRx = (name = "") => ({
  id: Math.random().toString(36).slice(2),
  name,
  dose: "",
  unit: "mg",
  route: "PO",
  frequency: "BID",
  duration: "7 days",
  qty: "",
  instructions: "",
  notes: "",
});

export default function PrescriptionBuilder({ note, noteId, queryClient }) {
  const [prescriptions, setPrescriptions] = useState(() =>
    (note.medications || []).map(m => newRx(typeof m === "string" ? m.split("—")[0].trim() : m))
  );
  const [providerName, setProviderName] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const addMed = (name) => {
    setPrescriptions(prev => [...prev, newRx(name)]);
  };

  const updateRx = (id, updated) => {
    setPrescriptions(prev => prev.map(rx => rx.id === id ? updated : rx));
  };

  const removeRx = (id) => {
    setPrescriptions(prev => prev.filter(rx => rx.id !== id));
  };

  const handleAIFill = async () => {
    if (prescriptions.length === 0) return toast.error("Add medications first");
    setAiLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical pharmacist. For each medication listed below, provide the standard outpatient prescribing details based on common diagnoses.

Patient diagnoses: ${(note.diagnoses || []).join(", ") || "not specified"}
Patient allergies: ${(note.allergies || ["NKDA"]).join(", ")}

Medications to fill:
${prescriptions.map(rx => rx.name).join("\n")}

For each medication, return standard dosing for an adult outpatient unless context suggests otherwise.`,
        response_json_schema: {
          type: "object",
          properties: {
            medications: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  dose: { type: "string" },
                  unit: { type: "string" },
                  route: { type: "string" },
                  frequency: { type: "string" },
                  duration: { type: "string" },
                  qty: { type: "string" },
                  instructions: { type: "string" },
                  notes: { type: "string" }
                }
              }
            }
          }
        }
      });
      if (result.medications?.length) {
        setPrescriptions(prev => prev.map((rx, i) => {
          const ai = result.medications.find(m => m.name?.toLowerCase().includes(rx.name.toLowerCase())) || result.medications[i];
          if (!ai) return rx;
          return {
            ...rx,
            dose: rx.dose || ai.dose || "",
            unit: rx.unit !== "mg" ? rx.unit : (ai.unit || rx.unit),
            route: rx.route !== "PO" ? rx.route : (ai.route || rx.route),
            frequency: rx.frequency !== "BID" ? rx.frequency : (ai.frequency || rx.frequency),
            duration: rx.duration !== "7 days" ? rx.duration : (ai.duration || rx.duration),
            qty: rx.qty || ai.qty || "",
            instructions: rx.instructions || ai.instructions || "",
            notes: rx.notes || ai.notes || "",
          };
        }));
        toast.success("AI filled prescription details");
      }
    } catch { toast.error("AI fill failed"); }
    finally { setAiLoading(false); }
  };

  const saveToRecord = async () => {
    setSaving(true);
    const medStrings = prescriptions.map(rx =>
      `${rx.name}${rx.dose ? ` ${rx.dose}${rx.unit}` : ""} ${rx.route} ${rx.frequency}${rx.duration ? ` × ${rx.duration}` : ""}${rx.instructions ? ` — ${rx.instructions}` : ""}`
    );
    await base44.entities.ClinicalNote.update(noteId, { medications: medStrings });
    queryClient.invalidateQueries({ queryKey: ["note", noteId] });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    toast.success("Prescription saved to patient record");
  };

  return (
    <div style={{ background: T.bg, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ padding: "12px 20px", borderBottom: `1px solid ${T.border}`, background: T.surface, display: "flex", alignItems: "center", gap: 10 }}>
        <Pill size={16} style={{ color: T.teal }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: T.bright, flex: 1 }}>Prescription Builder</span>
        {prescriptions.length > 0 && (
          <span style={{ fontSize: 11, color: T.muted }}>{prescriptions.length} medication{prescriptions.length !== 1 ? "s" : ""}</span>
        )}
        <button
          onClick={handleAIFill}
          disabled={aiLoading || prescriptions.length === 0}
          style={{ padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1px solid ${T.teal}50`, background: T.teal_dim, color: T.teal, display: "flex", alignItems: "center", gap: 5, opacity: prescriptions.length === 0 ? 0.5 : 1 }}
          onMouseEnter={e => { if (prescriptions.length > 0) { e.currentTarget.style.background = T.teal; e.currentTarget.style.color = T.bg; } }}
          onMouseLeave={e => { e.currentTarget.style.background = T.teal_dim; e.currentTarget.style.color = T.teal; }}
        >
          {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          AI Auto-Fill
        </button>
        <button
          onClick={() => setShowPreview(true)}
          disabled={prescriptions.length === 0}
          style={{ padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1px solid ${T.border2}`, background: "transparent", color: T.muted, display: "flex", alignItems: "center", gap: 5, opacity: prescriptions.length === 0 ? 0.4 : 1 }}
          onMouseEnter={e => { if (prescriptions.length > 0) { e.currentTarget.style.borderColor = T.blue; e.currentTarget.style.color = T.blue; } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.muted; }}
        >
          <FileText size={12} /> Preview & Print
        </button>
        <button
          onClick={saveToRecord}
          disabled={saving || prescriptions.length === 0}
          style={{ padding: "6px 14px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", background: saved ? T.green : T.teal, color: T.bg, display: "flex", alignItems: "center", gap: 5, opacity: prescriptions.length === 0 ? 0.4 : 1 }}
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : saved ? <Check size={12} /> : null}
          {saving ? "Saving…" : saved ? "Saved!" : "Save to Record"}
        </button>
      </div>

      {/* Provider name */}
      <div style={{ padding: "10px 20px", borderBottom: `1px solid ${T.border}`, background: T.surface, display: "flex", alignItems: "center", gap: 10 }}>
        <label style={{ fontSize: 11, color: T.muted, flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>Prescriber</label>
        <input
          value={providerName}
          onChange={e => setProviderName(e.target.value)}
          placeholder="Dr. Name, MD — appears on printed prescription"
          style={{ flex: 1, background: T.card, border: `1px solid ${T.border2}`, borderRadius: 6, color: T.text, fontSize: 12, padding: "6px 10px", outline: "none" }}
          onFocus={e => e.target.style.borderColor = T.teal}
          onBlur={e => e.target.style.borderColor = T.border2}
        />
      </div>

      {/* Med search */}
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}` }}>
        <MedSearchInput onSelect={addMed} />
      </div>

      {/* Rx list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
        {prescriptions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", opacity: 0.5 }}>
            <Pill size={32} style={{ color: T.muted, margin: "0 auto 12px" }} />
            <div style={{ fontFamily: "serif", fontSize: 15, fontStyle: "italic", color: T.muted }}>No medications added yet</div>
            <div style={{ fontSize: 12, color: T.dim, marginTop: 4 }}>Search above or type a medication name to get started</div>
          </div>
        ) : (
          <AnimatePresence>
            {prescriptions.map((rx, i) => (
              <RxRow
                key={rx.id}
                rx={rx}
                index={i}
                onChange={updated => updateRx(rx.id, updated)}
                onRemove={() => removeRx(rx.id)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Print preview modal */}
      <AnimatePresence>
        {showPreview && (
          <PrintPreview
            prescriptions={prescriptions}
            note={note}
            providerName={providerName}
            onClose={() => setShowPreview(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}