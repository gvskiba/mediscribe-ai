import { useState } from "react";

// ── Font injection (idempotent) ───────────────────────────────────────────────
(() => {
  if (document.getElementById("notrya-cps-fonts")) return;
  const l = document.createElement("link");
  l.id = "notrya-cps-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=DM+Sans:wght@400;600;700&display=swap";
  document.head.appendChild(l);
})();

// ── Section definitions ───────────────────────────────────────────────────────
const SECTIONS = [
  {
    id:    "registration",
    icon:  "👤",
    label: "Patient",
    check: ({ demo }) => !!(demo?.firstName || demo?.lastName),
  },
  {
    id:    "vitals",
    icon:  "📊",
    label: "Vitals",
    check: ({ vitals }) => !!(vitals?.bp && vitals?.hr),
  },
  {
    id:    "ros",
    icon:  "🔍",
    label: "ROS",
    check: ({ rosState }) => {
      if (!rosState) return false;
      const META = ["_remainderNeg","_remainderNormal","_mode","_visual"];
      return Object.entries(rosState).some(([k,v]) => !META.includes(k) && v && v !== "not-asked");
    },
  },
  {
    id:    "pe",
    icon:  "🩺",
    label: "Exam",
    check: ({ peState }) => {
      if (!peState) return false;
      const META = ["_remainderNeg","_remainderNormal","_mode","_visual"];
      return Object.entries(peState).some(([k,v]) => !META.includes(k) && v && v !== "not-examined");
    },
  },
  {
    id:    "mdm",
    icon:  "⚖️",
    label: "MDM",
    check: ({ mdmComplexity, mdmDomainsCount }) =>
      mdmComplexity > 0 && mdmDomainsCount >= 2,
  },
  {
    id:    "disposition",
    icon:  "📋",
    label: "Dispo",
    check: ({ disposition }) => !!disposition,
  },
];

// ── Color helpers ─────────────────────────────────────────────────────────────
function sectionColor(done, active) {
  if (done)   return "#00e5c0";
  if (active) return "#3b9eff";
  return "#1a3550";
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function Tooltip({ children, tip }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: "50%",
          transform: "translateX(-50%)", whiteSpace: "nowrap",
          background: "rgba(5,15,30,.97)", border: "1px solid rgba(59,158,255,.25)",
          borderRadius: 6, padding: "4px 10px",
          fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#a5b8d8",
          zIndex: 9999, pointerEvents: "none",
          boxShadow: "0 4px 16px rgba(0,0,0,.6)",
        }}>{tip}</div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ChartProgressStrip({
  demo = {}, vitals = {}, rosState = {}, peState = {},
  mdmComplexity = 0, mdmDomainsCount = 0,
  disposition = "",
  activeSection = "",
  onSectionClick,
}) {
  const ctx = { demo, vitals, rosState, peState, mdmComplexity, mdmDomainsCount, disposition };

  const results = SECTIONS.map(s => ({
    ...s,
    done: s.check(ctx),
    active: activeSection === s.id,
  }));

  const doneCount  = results.filter(s => s.done).length;
  const totalCount = SECTIONS.length;
  const pct        = Math.round((doneCount / totalCount) * 100);
  const allDone    = doneCount === totalCount;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "7px 18px",
      background: "rgba(5,15,30,.85)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(26,53,85,.55)",
      fontFamily: "'DM Sans',sans-serif",
      flexShrink: 0, flexWrap: "wrap",
      position: "sticky", top: 0, zIndex: 50,
    }}>

      {/* Progress bar + count */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <div style={{
          width: 80, height: 5, borderRadius: 3,
          background: "rgba(26,53,85,.7)",
          overflow: "hidden", flexShrink: 0,
        }}>
          <div style={{
            height: "100%", borderRadius: 3,
            width: `${pct}%`,
            background: allDone
              ? "linear-gradient(90deg,#00e5c0,#00b4d8)"
              : "linear-gradient(90deg,#3b9eff,#00e5c0)",
            transition: "width .4s ease",
            boxShadow: allDone ? "0 0 8px rgba(0,229,192,.6)" : "none",
          }}/>
        </div>
        <span style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 10, fontWeight: 700,
          color: allDone ? "#00e5c0" : "#a5b8d8",
          whiteSpace: "nowrap",
          textShadow: allDone ? "0 0 10px rgba(0,229,192,.5)" : "none",
        }}>
          {doneCount}/{totalCount}
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 18, background: "rgba(26,53,85,.8)", flexShrink: 0 }}/>

      {/* Section pills */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {results.map(s => {
          const color = sectionColor(s.done, s.active);
          return (
            <Tooltip key={s.id} tip={s.done ? `${s.label} — complete` : `${s.label} — incomplete`}>
              <button
                onClick={() => onSectionClick?.(s.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "3px 10px", borderRadius: 20,
                  border: `1px solid ${s.done ? "rgba(0,229,192,.35)" : s.active ? "rgba(59,158,255,.4)" : "rgba(26,53,85,.6)"}`,
                  background: s.done ? "rgba(0,229,192,.08)" : s.active ? "rgba(59,158,255,.1)" : "transparent",
                  cursor: onSectionClick ? "pointer" : "default",
                  transition: "all .15s",
                }}>
                <div style={{
                  width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
                  background: color,
                  boxShadow: s.done ? `0 0 5px ${color}` : "none",
                  border: s.done ? "none" : `1px solid ${color}`,
                }}/>
                <span style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 9, fontWeight: 600,
                  color: s.done ? "#00e5c0" : s.active ? "#3b9eff" : "#2e4060",
                  textTransform: "uppercase", letterSpacing: ".06em",
                }}>
                  {s.icon} {s.label}
                </span>
              </button>
            </Tooltip>
          );
        })}
      </div>

      {/* All done badge */}
      {allDone && (
        <div style={{
          marginLeft: "auto", flexShrink: 0,
          fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700,
          color: "#00e5c0", background: "rgba(0,229,192,.1)",
          border: "1px solid rgba(0,229,192,.35)", borderRadius: 20,
          padding: "3px 12px", letterSpacing: ".06em",
          boxShadow: "0 0 12px rgba(0,229,192,.2)",
          animation: "pulse 2s ease-in-out infinite",
        }}>
          ✓ CHART READY TO SIGN
        </div>
      )}
    </div>
  );
}