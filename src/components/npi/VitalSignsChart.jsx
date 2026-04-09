import { useMemo } from "react";

// ── Vital config ────────────────────────────────────────────────────────────────
const VITAL_CFG = [
  { key:"hr",   parse:v=>parseFloat(v)||null,                         label:"HR",    unit:"bpm", color:"var(--npi-coral)",  lo:60,  hi:100, min:30,  max:160 },
  { key:"bp",   parse:v=>v?parseFloat(String(v).split("/")[0]):null,  label:"SBP",   unit:"",    color:"var(--npi-blue)",   lo:90,  hi:140, min:50,  max:220 },
  { key:"spo2", parse:v=>parseFloat(v)||null,                         label:"SpO\u2082", unit:"%", color:"var(--npi-teal)", lo:94,  hi:100, min:80,  max:100 },
  { key:"rr",   parse:v=>parseFloat(v)||null,                         label:"RR",    unit:"/m",  color:"var(--npi-orange)", lo:12,  hi:20,  min:6,   max:35  },
];

// ── SVG geometry ────────────────────────────────────────────────────────────────
const W = 480, ROW_H = 58, PL = 42, PR = 28, PT = 15, PB = 8;
const PLOT_W = W - PL - PR;
const PLOT_H = ROW_H - PT - PB;

// ── Helpers ─────────────────────────────────────────────────────────────────────
function yOf(v, min, max) {
  const clamped = Math.max(min, Math.min(max, v));
  return PT + PLOT_H - ((clamped - min) / (max - min)) * PLOT_H;
}

function fmtElapsed(ms) {
  const m = Math.round(ms / 60000);
  if (m < 60) return `+${m}m`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `+${h}h\u202f${r}m` : `+${h}h`;
}

// ── SparkRow ─────────────────────────────────────────────────────────────────────
function SparkRow({ cfg, pts }) {
  const { label, unit, color, lo, hi, min, max } = cfg;
  const valid = pts.filter(p => p.v !== null && !isNaN(p.v));
  if (valid.length === 0) return null;

  const linePath = valid.length > 1
    ? valid.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${yOf(p.v, min, max).toFixed(1)}`).join(" ")
    : null;

  const latest   = valid[valid.length - 1];
  const abnormal = latest.v < lo || latest.v > hi;
  const bandY    = yOf(hi, min, max);
  const bandH    = Math.max(0, yOf(lo, min, max) - bandY);

  return (
    <g>
      {/* Baseline */}
      <line x1={PL} y1={PT + PLOT_H} x2={PL + PLOT_W} y2={PT + PLOT_H}
        stroke="rgba(42,77,114,0.25)" strokeWidth="0.5"/>
      {/* Normal band */}
      <rect x={PL} y={bandY} width={PLOT_W} height={bandH} fill={color} opacity="0.06"/>
      <line x1={PL} y1={bandY}         x2={PL + PLOT_W} y2={bandY}
        stroke={color} strokeWidth="0.5" opacity="0.18" strokeDasharray="3 3"/>
      <line x1={PL} y1={bandY + bandH} x2={PL + PLOT_W} y2={bandY + bandH}
        stroke={color} strokeWidth="0.5" opacity="0.18" strokeDasharray="3 3"/>
      {/* Connecting line */}
      {linePath && (
        <path d={linePath} fill="none" stroke={color} strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round" opacity="0.82"/>
      )}
      {/* Dots + value labels */}
      {valid.map((p, i) => {
        const cy    = yOf(p.v, min, max);
        const isLast = i === valid.length - 1;
        return (
          <g key={i}>
            <circle cx={p.x} cy={cy} r={isLast ? 4 : 3}
              fill={color} opacity={isLast ? 1 : 0.5}
              stroke={isLast && abnormal ? "rgba(255,255,255,0.25)" : "none"} strokeWidth="1.5"/>
            <text x={p.x} y={cy - 7} textAnchor="middle"
              fontFamily="'JetBrains Mono',monospace" fontSize="9"
              fill={color} opacity={isLast ? 1 : 0.5}>
              {p.v}{unit}
            </text>
          </g>
        );
      })}
      {/* Vital name label (left margin) */}
      <text x={PL - 5} y={PT + PLOT_H / 2} textAnchor="end" dominantBaseline="central"
        fontFamily="'JetBrains Mono',monospace" fontSize="9" fontWeight="600"
        fill={color} opacity="0.75">
        {label}
      </text>
      {/* Abnormal dot (right margin) */}
      {abnormal && (
        <circle cx={PL + PLOT_W + 14} cy={PT + PLOT_H / 2} r="3"
          fill={color} opacity="0.9"/>
      )}
    </g>
  );
}

// ── VitalSignsChart ───────────────────────────────────────────────────────────
// vitalsHistory: [{ t:ms, label:string, bp:string, hr:string, rr:string, spo2:string, temp:string }]
// Renders when vitalsHistory.length >= 1. Single entry shows baseline with "reassess to build trend".
export default function VitalSignsChart({ vitalsHistory }) {
  const data = useMemo(() => {
    if (!vitalsHistory?.length) return [];
    const t0 = vitalsHistory[0].t;
    return vitalsHistory.map(v => ({
      elapsed: v.t - t0,
      label:   v.label || "Reading",
      ...Object.fromEntries(VITAL_CFG.map(c => [c.key, c.parse(v[c.key])]))
    }));
  }, [vitalsHistory]);

  if (data.length === 0) return null;

  const span = data.length > 1 ? data[data.length - 1].elapsed : 0;
  const xOf  = i => data.length < 2
    ? PL + PLOT_W / 2
    : PL + (data[i].elapsed / span) * PLOT_W;

  const pts   = data.map((d, i) => ({ ...d, x: xOf(i) }));
  const svgH  = VITAL_CFG.length * ROW_H + 24;

  return (
    <div style={{ background:"var(--npi-card)", border:"1px solid var(--npi-bd)", borderRadius:10, padding:"12px 14px 8px" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"var(--npi-txt4)" }}>
          Vitals trend
        </span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)" }}>
          {data.length} reading{data.length !== 1 ? "s" : ""}
          {span > 0
            ? ` \u00b7 ${fmtElapsed(span).replace("+", "")} span`
            : " \u00b7 reassess to build trend"}
        </span>
      </div>
      {/* Sparklines */}
      <svg width="100%" viewBox={`0 0 ${W} ${svgH}`}>
        {VITAL_CFG.map((cfg, ri) => (
          <g key={cfg.key} transform={`translate(0,${ri * ROW_H})`}>
            <SparkRow cfg={cfg} pts={pts.map(p => ({ ...p, v: p[cfg.key] }))}/>
          </g>
        ))}
        {/* Time axis */}
        <g transform={`translate(0,${VITAL_CFG.length * ROW_H + 5})`}>
          {pts.map((p, i) => (
            <text key={i} x={p.x} y={14} textAnchor="middle"
              fontFamily="'JetBrains Mono',monospace" fontSize="8"
              fill="rgba(74,106,138,0.75)">
              {i === 0 ? p.label : fmtElapsed(p.elapsed)}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}