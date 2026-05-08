// QuickNoteExamHelper.jsx
// Parses exam text by organ system and renders per-system copy buttons.
// Also hosts the Auto-PE-from-CC button (passes through to QuickNote's autoExamFromCC).

import { useState, useMemo } from "react";

const PE_LABELS = [
  "General","HEENT","Head","Eyes","Ears","Nose","Throat","Mouth","Neck",
  "Cardiovascular","CV","Cardiac","Heart",
  "Respiratory","Pulmonary","Lungs","Chest",
  "Abdomen","Abdominal","GI",
  "GU","Genitourinary","Urinary","Pelvic","Pelvis","Rectal",
  "Musculoskeletal","MSK","Extremities","Ext","Back","Spine",
  "Skin","Dermatological","Integumentary",
  "Neurological","Neurologic","Neuro",
  "Psychiatric","Psych","Mental Status",
  "Lymph","Vascular","Peripheral Vascular","Breast",
];

const EXAM_RE = new RegExp(
  `(${PE_LABELS.map(l => l.replace(/\s/,"\\s?")).join("|")})\\s*:`,
  "gi"
);

function parseExamBySystems(examText) {
  if (!examText?.trim()) return [];
  const matches = [...examText.matchAll(EXAM_RE)];
  if (matches.length === 0) return [{ label:"Physical Exam", text:examText.trim() }];
  const parts = [];
  for (let i = 0; i < matches.length; i++) {
    const m     = matches[i];
    const label = m[1];
    const start = m.index + m[0].length;
    const end   = matches[i + 1]?.index ?? examText.length;
    const text  = examText.slice(start, end).trim().replace(/\.\s*$/, "");
    if (text) parts.push({ label, text });
  }
  return parts;
}

function SysCopyBtn({ text }) {
  const [done, setDone] = useState(false);
  return (
    <button onClick={() => {
      if (!text) return;
      navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1800); });
    }} style={{
      padding:"2px 9px", borderRadius:5, cursor:"pointer", flexShrink:0,
      border:`1px solid ${done?"rgba(61,255,160,.5)":"rgba(245,200,66,.35)"}`,
      background:done?"rgba(61,255,160,.08)":"rgba(245,200,66,.06)",
      color:done?"var(--qn-green)":"var(--qn-gold)",
      fontFamily:"'JetBrains Mono',monospace", fontWeight:700, fontSize:9, letterSpacing:.3, transition:"all .14s",
    }}>
      {done ? "✓" : "Copy"}
    </button>
  );
}

export function QuickNoteExamHelper({ exam, cc, autoExamFromCC, autoExamBusy }) {
  const [open,        setOpen]        = useState(true);
  const [inclHeading, setInclHeading] = useState(true);
  const [copiedAll,   setCopiedAll]   = useState(false);

  const systems = useMemo(() => parseExamBySystems(exam), [exam]);
  const hasContent = exam?.trim()?.length > 0;

  const copyAll = () => {
    const text = systems.map(s =>
      inclHeading ? `${s.label}: ${s.text}.` : `${s.text}.`
    ).join("\n");
    navigator.clipboard?.writeText(text).then(() => { setCopiedAll(true); setTimeout(() => setCopiedAll(false), 1800); });
  };

  const copySystem = (sys) => inclHeading ? `${sys.label}: ${sys.text}.` : `${sys.text}.`;

  if (!hasContent && !autoExamFromCC) return null;

  return (
    <div style={{
      marginBottom:10,
      background:"rgba(245,200,66,.04)",
      border:"1px solid rgba(245,200,66,.18)",
      borderRadius:12,
      overflow:"hidden",
    }}>
      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"7px 14px",
        borderBottom: (open && hasContent) ? "1px solid rgba(245,200,66,.12)" : "none",
        cursor:"pointer",
      }} onClick={() => setOpen(p => !p)}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{
            fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
            color:"var(--qn-gold)", letterSpacing:1.5, textTransform:"uppercase",
          }}>
            Physical Exam · Per-System Copy
          </span>
          {hasContent && (
            <span style={{
              fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:"var(--qn-txt4)", background:"rgba(245,200,66,.1)",
              border:"1px solid rgba(245,200,66,.2)", borderRadius:4, padding:"1px 6px",
            }}>
              {systems.length} system{systems.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:7 }} onClick={e => e.stopPropagation()}>
          {/* Auto-PE button */}
          {autoExamFromCC && cc?.trim() && (
            <button onClick={autoExamFromCC} disabled={autoExamBusy}
              style={{
                padding:"2px 9px", borderRadius:5, cursor:autoExamBusy?"not-allowed":"pointer",
                border:`1px solid ${autoExamBusy?"rgba(42,79,122,.3)":"rgba(155,109,255,.45)"}`,
                background:autoExamBusy?"rgba(14,37,68,.4)":"rgba(155,109,255,.08)",
                color:autoExamBusy?"var(--qn-txt4)":"var(--qn-purple)",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                letterSpacing:.3, transition:"all .13s",
              }}>
              {autoExamBusy ? "● Generating…" : "✦ Auto-PE"}
            </button>
          )}

          {/* Heading toggle — only when content exists */}
          {hasContent && (
            <button onClick={() => setInclHeading(p => !p)}
              style={{
                padding:"2px 9px", borderRadius:5, cursor:"pointer",
                border:`1px solid ${inclHeading?"rgba(245,200,66,.45)":"rgba(42,79,122,.4)"}`,
                background:inclHeading?"rgba(245,200,66,.08)":"transparent",
                color:inclHeading?"var(--qn-gold)":"var(--qn-txt4)",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                letterSpacing:.3, transition:"all .13s",
              }}>
              {inclHeading ? "Heading On" : "Heading Off"}
            </button>
          )}

          {/* Copy all */}
          {hasContent && (
            <button onClick={copyAll}
              style={{
                padding:"2px 9px", borderRadius:5, cursor:"pointer",
                border:`1px solid ${copiedAll?"rgba(61,255,160,.5)":"rgba(245,200,66,.35)"}`,
                background:copiedAll?"rgba(61,255,160,.08)":"rgba(245,200,66,.07)",
                color:copiedAll?"var(--qn-green)":"var(--qn-gold)",
                fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
                letterSpacing:.3, transition:"all .14s",
              }}>
              {copiedAll ? "✓ All Copied" : "Copy All"}
            </button>
          )}

          <span onClick={() => setOpen(p => !p)}
            style={{ cursor:"pointer", color:"var(--qn-txt4)", fontSize:11, lineHeight:1 }}>
            {open ? "▲" : "▼"}
          </span>
        </div>
      </div>

      {/* System rows */}
      {open && hasContent && (
        <div style={{ padding:"6px 10px 8px" }}>
          {systems.map((sys, i) => (
            <div key={i} style={{
              display:"flex", alignItems:"flex-start", gap:8,
              padding:"4px 6px", borderRadius:6, marginBottom:3,
              background: i % 2 === 0 ? "rgba(255,255,255,.02)" : "transparent",
            }}>
              <span style={{
                fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
                color:"var(--qn-gold)", minWidth:108, flexShrink:0, paddingTop:1, letterSpacing:.2,
              }}>
                {sys.label}
              </span>
              <span style={{
                flex:1, fontSize:11, color:"var(--qn-txt2)",
                lineHeight:1.5, fontFamily:"'DM Sans',sans-serif",
              }}>
                {sys.text}
              </span>
              <SysCopyBtn text={copySystem(sys)} />
            </div>
          ))}

          {/* Empty exam with auto-PE available */}
          {systems.length === 0 && autoExamFromCC && cc?.trim() && (
            <div style={{ padding:"8px 4px", fontSize:11, color:"var(--qn-txt4)",
              fontFamily:"'DM Sans',sans-serif" }}>
              Enter exam findings or use ✦ Auto-PE to generate a template from the chief complaint.
            </div>
          )}

          <div style={{
            marginTop:6, fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--qn-txt4)", letterSpacing:.5,
          }}>
            {inclHeading
              ? "Copies with system label — paste into labeled EHR PE fields"
              : "Copies text only — toggle Heading On if your EHR field needs the label"}
          </div>
        </div>
      )}

      {/* Empty state — no content, show Auto-PE prompt */}
      {open && !hasContent && cc?.trim() && autoExamFromCC && (
        <div style={{
          padding:"8px 14px", fontSize:11, color:"var(--qn-txt4)",
          fontFamily:"'DM Sans',sans-serif",
          borderTop:"1px solid rgba(245,200,66,.1)",
        }}>
          No exam entered. Use <strong style={{ color:"var(--qn-purple)" }}>✦ Auto-PE</strong> to
          generate a pertinent exam template for <em style={{ color:"var(--qn-gold)" }}>{cc}</em>.
        </div>
      )}
    </div>
  );
}