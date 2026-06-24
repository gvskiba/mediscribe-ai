// QuickNoteComponents.jsx
// Extracted UI components for QuickNote.jsx
// Exported: dispColor, StepProgress, InputZone, MedsAllergyZone,
//           MDMResult, DispositionResult, DifferentialCard, QuickDDxCard,
//           ClinicalCalcsCard, DiagnosisCodingCard, InterventionsCard

import { useState, useEffect, useRef } from "react";
import { PLAN_CATEGORIES } from "@/pages/QuickNotePrompts";
import { CCPicker, TemplatePicker } from "./QuickNotePickers";
import { SmartFillBar } from "./QuickNoteSmartFill";
import { MedsAllergyZone } from "./QuickNoteMeds";
import { DifferentialCard, QuickDDxCard, MDMResult } from "./QuickNoteMDM";
import { ClinicalCalcsCard } from "./QuickNoteCalcs";
import { DiagnosisCodingCard, InterventionsCard, DispositionResult } from "./QuickNoteDisposition";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function mdmLevelColor(level) {
  if (!level) return "#6b9ec8";
  const l = level.toLowerCase();
  if (l.includes("high"))            return "#ff4444";
  if (l.includes("moderate"))        return "#ff9f43";
  if (l.includes("low"))             return "#f5c842";
  if (l.includes("straightforward")) return "#3dffa0";
  return "#3b9eff";
}

export function dispColor(disp) {
  if (!disp) return "#6b9ec8";
  const d = disp.toLowerCase();
  if (d.includes("icu"))        return "#ff4444";
  if (d.includes("admit"))      return "#ff6b6b";
  if (d.includes("obs"))        return "#ff9f43";
  if (d.includes("transfer"))   return "#9b6dff";
  if (d.includes("precaution")) return "#f5c842";
  return "#3dffa0";
}

function SectionLabel({ children, color, style: extraStyle }) {
  return (
    <div className="qn-section-lbl"
      style={{ ...(color ? { color } : {}), ...(extraStyle || {}) }}>
      {children}
    </div>
  );
}

// Safe string coercion — prevents React Error #31 when AI returns unexpected objects
function s(val) {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

// ─── STEP PROGRESS ────────────────────────────────────────────────────────────
export function StepProgress({ phase1Done, phase2Done, p2Open }) {
  const steps = [
    { n:1, label:"Initial Assessment", sub:"CC · Vitals · HPI · ROS · Exam", done:phase1Done },
    { n:2, label:"Workup & Disposition", sub:"Labs · Imaging · Recheck Vitals", done:phase2Done },
  ];
  return (
    <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom:14,
      padding:"10px 14px", borderRadius:10,
      background:"rgba(8,22,40,.6)", border:"1px solid rgba(42,79,122,.3)" }}
      className="no-print">
      {steps.map((step, i) => {
        const isActive = step.n === 1 ? !phase1Done : p2Open;
        const color = step.done ? "var(--qn-green)" : isActive ? "var(--qn-teal)" : "var(--qn-txt4)";
        return (
          <div key={step.n} style={{ display:"flex", alignItems:"center", flex: i === 0 ? "0 0 auto" : 1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:26, height:26, borderRadius:"50%", flexShrink:0,
                display:"flex", alignItems:"center", justifyContent:"center",
                background: step.done ? "rgba(61,255,160,.15)" : isActive ? "rgba(0,229,192,.12)" : "rgba(42,79,122,.2)",
                border:`1.5px solid ${step.done ? "rgba(61,255,160,.5)" : isActive ? "rgba(0,229,192,.4)" : "rgba(42,79,122,.4)"}`,
                fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700, color }}>
                {step.done ? "✓" : step.n}
              </div>
              <div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                  fontSize:12, color, lineHeight:1.2 }}>{step.label}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:"var(--qn-txt4)", letterSpacing:.5 }}>{step.sub}</div>
              </div>
            </div>
            {i === 0 && (
              <div style={{ flex:1, height:1.5, margin:"0 14px",
                background: phase1Done
                  ? "linear-gradient(90deg,rgba(61,255,160,.5),rgba(0,229,192,.3))"
                  : "rgba(42,79,122,.3)",
                borderRadius:1, minWidth:24 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── INPUT ZONE ───────────────────────────────────────────────────────────────
export function InputZone({ label, value, onChange, placeholder, rows, phase, ref: _ref, onRef, onKeyDown, copyable, templateType, smartfill, kbdHint, vitalsTrendLink }) {
  const inputRef = useRef();
  const [copiedField, setCopiedField] = useState(false);
  const [showPicker,  setShowPicker]  = useState(false);
  useEffect(() => { if (onRef) onRef(inputRef); }, [onRef]);
  const phaseClass = phase === 1 ? " active-phase" : phase === 2 ? " p2-active" : "";
  const handleCopy = () => {
    if (!value.trim()) return;
    navigator.clipboard.writeText(value.trim()).then(() => {
      setCopiedField(true);
      setTimeout(() => setCopiedField(false), 2000);
    });
  };
  const handleKeyDown = e => {
    if (templateType && e.ctrlKey && (e.key === "t" || e.key === "T") && !e.metaKey) {
      e.preventDefault(); setShowPicker(p => !p); return;
    }
    if (onKeyDown) onKeyDown(e);
  };
  return (
    <div style={{ position:"relative" }}>
      <div style={{ display:"flex", alignItems:"center", marginBottom:6 }}>
        <SectionLabel color={phase === 2 ? "var(--qn-blue)" : undefined}
          style={{ marginBottom:0, flex:1 }}>
          {label}
          {kbdHint && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"rgba(107,158,200,.5)", background:"rgba(42,79,122,.2)",
              border:"1px solid rgba(42,79,122,.35)", borderRadius:4,
              padding:"1px 6px", marginLeft:7, letterSpacing:.5,
              verticalAlign:"middle" }}>
              {kbdHint}
            </span>
          )}
          {vitalsTrendLink && (
            <span onClick={vitalsTrendLink}
              style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:"var(--qn-teal)", background:"rgba(0,229,192,.08)",
                border:"1px solid rgba(0,229,192,.25)", borderRadius:4,
                padding:"1px 7px", marginLeft:7, letterSpacing:.5,
                cursor:"pointer", verticalAlign:"middle", transition:"all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,229,192,.18)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,229,192,.08)"; }}>
              📈 VitalsHub
            </span>
          )}
        </SectionLabel>
        <div style={{ display:"flex", gap:5 }}>
          {templateType && (
            <button onClick={() => setShowPicker(p => !p)}
              style={{ padding:"1px 8px", borderRadius:5, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                border:`1px solid ${showPicker ? "rgba(0,229,192,.5)" : "rgba(42,79,122,.4)"}`,
                background:showPicker ? "rgba(0,229,192,.1)" : "rgba(14,37,68,.5)",
                color:showPicker ? "var(--qn-teal)" : "var(--qn-txt4)",
                letterSpacing:.5, textTransform:"uppercase", transition:"all .15s" }}>
              {templateType === "cc" ? "Ctrl+T · CC" : "Ctrl+T · Template"}
            </button>
          )}
          {copyable && value.trim() && (
            <button onClick={handleCopy}
              style={{ padding:"1px 8px", borderRadius:5, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                border:`1px solid ${copiedField ? "rgba(61,255,160,.5)" : "rgba(42,79,122,.4)"}`,
                background:copiedField ? "rgba(61,255,160,.08)" : "rgba(14,37,68,.5)",
                color:copiedField ? "var(--qn-green)" : "var(--qn-txt4)",
                letterSpacing:.5, textTransform:"uppercase", transition:"all .15s" }}>
              {copiedField ? "✓" : "Copy"}
            </button>
          )}
        </div>
      </div>
      {showPicker && templateType === "cc" && (
        <CCPicker
          onInsert={text => { onChange(text); inputRef.current?.focus(); }}
          onClose={() => setShowPicker(false)}
        />
      )}
      {showPicker && templateType !== "cc" && (
        <TemplatePicker
          type={templateType}
          hasContent={Boolean(value.trim())}
          onInsert={text => { onChange(text); inputRef.current?.focus(); }}
          onClose={() => setShowPicker(false)}
        />
      )}
      {smartfill && <SmartFillBar value={value} onChange={onChange} />}
      <textarea
        ref={inputRef}
        className={`qn-ta${phaseClass}`}
        data-phase={phase || 1}
        rows={rows || 4}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}

// ─── CLINICAL PLAN SELECTOR ───────────────────────────────────────────────────
export function ClinicalPlanSelector({ selectedIds, onChange, onCopy, onClose, copied }) {
  const totalCount = PLAN_CATEGORIES.reduce((sum, cat) => sum + cat.items.length, 0);
  const selectedCount = selectedIds ? selectedIds.size : 0;

  const toggle = (id) => {
    const next = new Set(selectedIds || []);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange(next);
  };

  const selectAll = () => {
    const next = new Set();
    PLAN_CATEGORIES.forEach(cat => cat.items.forEach(item => next.add(item.id)));
    onChange(next);
  };

  const selectNone = () => onChange(new Set());

  const toggleCategory = (cat) => {
    const allSelected = cat.items.every(item => selectedIds && selectedIds.has(item.id));
    const next = new Set(selectedIds || []);
    if (allSelected) {
      cat.items.forEach(item => next.delete(item.id));
    } else {
      cat.items.forEach(item => next.add(item.id));
    }
    onChange(next);
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(3,8,16,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "#081628", border: "1px solid rgba(0,184,154,0.25)", borderRadius: 12, width: 540, maxWidth: "96vw", maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}
      >
        {/* Header */}
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid rgba(0,184,154,0.12)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, color: "#00e5c0" }}>Clinical Plan</span>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(200,223,240,0.4)", fontSize: 18, lineHeight: 1, padding: 0 }}>✕</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: selectedCount > 0 ? "#00e5c0" : "rgba(200,223,240,0.3)" }}>
              {selectedCount} / {totalCount} items selected
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {[["All", selectAll], ["None", selectNone]].map(([label, action]) => (
                <button key={label} onClick={action} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700, textTransform: "uppercase", border: "1px solid rgba(0,184,154,0.25)", background: "transparent", color: "rgba(200,223,240,0.45)", borderRadius: 4, padding: "3px 10px", cursor: "pointer" }}>{label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", padding: "12px 20px", flex: 1 }}>
          {PLAN_CATEGORIES.map(cat => {
            const allSel = cat.items.every(item => selectedIds && selectedIds.has(item.id));
            const someSel = !allSel && cat.items.some(item => selectedIds && selectedIds.has(item.id));
            const catStatus = allSel ? { label: "✓ All", color: "#00e5c0" } : someSel ? { label: "partial", color: "rgba(200,223,240,0.3)" } : { label: "none", color: "rgba(200,223,240,0.2)" };
            return (
              <div key={cat.id} style={{ marginBottom: 14 }}>
                <div onClick={() => toggleCategory(cat)} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", marginBottom: 6 }}>
                  <span style={{ fontSize: 13 }}>{cat.icon}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "rgba(200,223,240,0.5)", flex: 1 }}>{cat.label}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: catStatus.color }}>{catStatus.label}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                  {cat.items.map(item => {
                    const sel = selectedIds && selectedIds.has(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggle(item.id)}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 5, cursor: "pointer", transition: "all 0.1s", border: sel ? "1px solid rgba(0,229,192,0.35)" : "1px solid rgba(0,184,154,0.08)", background: sel ? "rgba(0,229,192,0.07)" : "rgba(11,30,54,0.3)" }}
                      >
                        <div style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: sel ? "1px solid #00e5c0" : "1px solid rgba(200,223,240,0.2)", background: sel ? "#00e5c0" : "transparent" }}>
                          {sel && <span style={{ color: "#081628", fontSize: 9, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                        </div>
                        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "11.5px", color: sel ? "#c8dff0" : "rgba(200,223,240,0.45)", lineHeight: 1.3 }}>{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(0,184,154,0.12)", display: "flex", gap: 10, flexShrink: 0, alignItems: "center" }}>
          <button onClick={onClose} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, textTransform: "uppercase", border: "1px solid rgba(200,223,240,0.15)", background: "transparent", color: "rgba(200,223,240,0.4)", padding: "9px 18px", borderRadius: 6, cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={onCopy}
            disabled={selectedCount === 0}
            style={{ flex: 1, fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, textTransform: "uppercase", border: copied ? "1px solid rgba(0,229,192,0.8)" : "1px solid rgba(0,229,192,0.5)", background: copied ? "rgba(0,229,192,0.18)" : "rgba(0,229,192,0.1)", color: "#00e5c0", padding: "9px 18px", borderRadius: 6, cursor: selectedCount === 0 ? "not-allowed" : "pointer", opacity: selectedCount === 0 ? 0.4 : 1, transition: "all 0.15s" }}
          >
            {copied ? "✓ Copied to Clipboard" : `Copy Note (${selectedCount} plan items)`}
          </button>
          <button
            onClick={() => { onChange(null); onCopy(); }}
            style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700, textTransform: "uppercase", border: "1px solid rgba(0,184,154,0.2)", background: "transparent", color: "rgba(0,229,192,0.5)", padding: "9px 14px", borderRadius: 6, cursor: "pointer" }}
          >
            Skip Plan
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── RE-EXPORTS ───────────────────────────────────────────────────────────────
export { MedsAllergyZone };
export { DifferentialCard, QuickDDxCard, MDMResult, ClinicalCalcsCard };
export { DiagnosisCodingCard, InterventionsCard, DispositionResult };

export function InlineCopyBtn({ getValue, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    const text = typeof getValue === "function" ? getValue() : getValue;
    if (!text?.trim()) return;
    try { await navigator.clipboard.writeText(text.trim()); }
    catch {
      const el = document.createElement("textarea");
      el.value = text.trim();
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handle} title={label} style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 9px", borderRadius:4, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:9.5, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", border: copied ? "1px solid #00e5c0" : "1px solid rgba(0,184,154,0.2)", background: copied ? "rgba(0,229,192,0.1)" : "transparent", color: copied ? "#00e5c0" : "rgba(200,223,240,0.35)", transition:"all 0.15s", flexShrink:0, lineHeight:1 }}>
      {copied ? "✓" : "⎘"} {copied ? "Copied" : "Copy"}
    </button>
  );
}