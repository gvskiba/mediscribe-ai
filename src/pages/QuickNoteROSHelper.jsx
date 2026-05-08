// QuickNoteROSHelper.jsx
// Parses the ros text string by organ system and renders individual copy buttons
// per system — solving the EHR per-field ROS pasting problem.
// Drop-in: renders between Phase1Panel and MDM in QuickNote.jsx.

import { useState, useMemo } from "react";

// ── System label registry ─────────────────────────────────────────────────────
const SYSTEM_LABELS = [
  "Constitutional","HEENT","Eyes","Ears","Nose","Throat","ENT",
  "Cardiovascular","CV","Cardiac",
  "Respiratory","Pulmonary",
  "GI","Gastrointestinal","Abdominal","Abdomen",
  "GU","Genitourinary","Urinary",
  "MSK","Musculoskeletal","Musculo-skeletal",
  "Neurological","Neurologic","Neuro","Neurological/Psychiatric",
  "Psychiatric","Psych","Psychological",
  "Skin","Dermatological","Integumentary","Dermatology",
  "Endocrine","Endocrinologic",
  "Hematologic","Hematological","Heme","Lymphatic",
  "Immunologic","Allergic","Allergy",
  "Vascular","Extremities","Back","Neck","Musculoskeletal/Extremities",
];

const SYSTEM_RE = new RegExp(
  `(${SYSTEM_LABELS.map(l => l.replace(/[-/]/g, "[-/]")).join("|")})\\s*:`,
  "gi"
);

// ── Parser ────────────────────────────────────────────────────────────────────
function parseROSBySystems(rosText) {
  if (!rosText?.trim()) return [];

  const matches = [...rosText.matchAll(SYSTEM_RE)];
  if (matches.length === 0) {
    return [{ label: "ROS", text: rosText.trim() }];
  }

  const parts = [];
  for (let i = 0; i < matches.length; i++) {
    const m     = matches[i];
    const label = m[1];
    const start = m.index + m[0].length;
    const end   = matches[i + 1]?.index ?? rosText.length;
    const text  = rosText.slice(start, end).trim().replace(/\.\s*$/, "");
    if (text) parts.push({ label, text });
  }
  return parts;
}

// ── Per-system copy button ────────────────────────────────────────────────────
function SysCopyBtn({ text }) {
  const [done, setDone] = useState(false);
  const go = () => {
    if (!text) return;
    navigator.clipboard?.writeText(text).then(() => {
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    });
  };
  return (
    <button
      onClick={go}
      title={`Copy: ${text.slice(0, 60)}...`}
      style={{
        padding: "2px 9px",
        borderRadius: 5,
        cursor: "pointer",
        border: `1px solid ${done ? "rgba(61,255,160,.5)" : "rgba(0,229,192,.3)"}`,
        background: done ? "rgba(61,255,160,.08)" : "rgba(0,229,192,.06)",
        color: done ? "var(--qn-green)" : "var(--qn-teal)",
        fontFamily: "'JetBrains Mono',monospace",
        fontWeight: 700,
        fontSize: 9,
        letterSpacing: 0.3,
        flexShrink: 0,
        transition: "all .14s",
      }}
    >
      {done ? "✓" : "Copy"}
    </button>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function QuickNoteROSHelper({ ros }) {
  const [open,        setOpen]        = useState(true);
  const [inclHeading, setInclHeading] = useState(true);
  const [copiedAll,   setCopiedAll]   = useState(false);

  const systems = useMemo(() => parseROSBySystems(ros), [ros]);

  if (!ros?.trim() || systems.length === 0) return null;

  const copyAll = () => {
    const text = inclHeading
      ? systems.map(s => `${s.label}: ${s.text}.`).join("\n")
      : systems.map(s => `${s.text}.`).join("\n");
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1800);
    });
  };

  const copySystem = (sys) =>
    inclHeading ? `${sys.label}: ${sys.text}.` : `${sys.text}.`;

  return (
    <div
      style={{
        marginBottom: 10,
        background: "rgba(0,229,192,.04)",
        border: "1px solid rgba(0,229,192,.18)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "7px 14px",
          borderBottom: open ? "1px solid rgba(0,229,192,.12)" : "none",
          cursor: "pointer",
        }}
        onClick={() => setOpen(p => !p)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 9,
              fontWeight: 700,
              color: "var(--qn-teal)",
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            ROS · Per-System Copy
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 8,
              color: "var(--qn-txt4)",
              background: "rgba(0,229,192,.1)",
              border: "1px solid rgba(0,229,192,.2)",
              borderRadius: 4,
              padding: "1px 6px",
            }}
          >
            {systems.length} system{systems.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div
          style={{ display: "flex", alignItems: "center", gap: 7 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Heading toggle */}
          <button
            onClick={() => setInclHeading(p => !p)}
            style={{
              padding: "2px 9px",
              borderRadius: 5,
              cursor: "pointer",
              border: `1px solid ${inclHeading ? "rgba(245,200,66,.45)" : "rgba(42,79,122,.4)"}`,
              background: inclHeading ? "rgba(245,200,66,.08)" : "transparent",
              color: inclHeading ? "var(--qn-gold)" : "var(--qn-txt4)",
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: 0.3,
              transition: "all .13s",
            }}
          >
            {inclHeading ? "Heading On" : "Heading Off"}
          </button>

          {/* Copy all */}
          <button
            onClick={copyAll}
            style={{
              padding: "2px 9px",
              borderRadius: 5,
              cursor: "pointer",
              border: `1px solid ${copiedAll ? "rgba(61,255,160,.5)" : "rgba(0,229,192,.35)"}`,
              background: copiedAll ? "rgba(61,255,160,.08)" : "rgba(0,229,192,.07)",
              color: copiedAll ? "var(--qn-green)" : "var(--qn-teal)",
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 0.3,
              transition: "all .14s",
            }}
          >
            {copiedAll ? "✓ All Copied" : "Copy All"}
          </button>

          {/* Chevron */}
          <span
            onClick={() => setOpen(p => !p)}
            style={{
              cursor: "pointer",
              color: "var(--qn-txt4)",
              fontSize: 11,
              lineHeight: 1,
            }}
          >
            {open ? "▲" : "▼"}
          </span>
        </div>
      </div>

      {/* System rows */}
      {open && (
        <div style={{ padding: "6px 10px 8px" }}>
          {systems.map((sys, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                padding: "4px 6px",
                borderRadius: 6,
                marginBottom: 3,
                background: i % 2 === 0 ? "rgba(255,255,255,.02)" : "transparent",
              }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 9,
                  fontWeight: 700,
                  color: "var(--qn-teal)",
                  minWidth: 108,
                  flexShrink: 0,
                  paddingTop: 1,
                  letterSpacing: 0.2,
                }}
              >
                {sys.label}
              </span>

              <span
                style={{
                  flex: 1,
                  fontSize: 11,
                  color: "var(--qn-txt2)",
                  lineHeight: 1.5,
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                {sys.text}
              </span>

              <SysCopyBtn text={copySystem(sys)} />
            </div>
          ))}

          <div
            style={{
              marginTop: 6,
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 8,
              color: "var(--qn-txt4)",
              letterSpacing: 0.5,
            }}
          >
            {inclHeading
              ? "Copies with system label — paste into labeled EHR ROS fields"
              : "Copies text only — toggle Heading On if your EHR field needs the label"}
          </div>
        </div>
      )}
    </div>
  );
}

export default QuickNoteROSHelper;