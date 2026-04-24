// LabTrendHub.jsx
// Serial lab result trend visualization for Emergency Medicine
// Supports: Troponin, Creatinine, Lactate, Hemoglobin, BNP, Glucose, Custom
// Recharts-based time-aware line chart with clinical threshold reference lines
// KDIGO AKI staging, troponin delta, lactate clearance auto-calculated
// No patient data stored — scratchpad tool for active encounter decision support

import { useState, useCallback, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Label,
} from "recharts";

// ─── STYLE INJECTION ─────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("lth-css")) return;
  const s = document.createElement("style"); s.id = "lth-css";
  s.textContent = `
    :root {
      --lth-bg:#050f1e; --lth-panel:#081628; --lth-card:#0b1e36;
      --lth-txt:#f2f7ff; --lth-txt2:#b8d4f0; --lth-txt3:#82aece; --lth-txt4:#6b9ec8;
      --lth-teal:#00e5c0; --lth-gold:#f5c842; --lth-coral:#ff6b6b;
      --lth-blue:#3b9eff; --lth-purple:#9b6dff; --lth-green:#3dffa0;
      --lth-red:#ff4444; --lth-bd:rgba(42,79,122,0.4);
    }
    @keyframes lthfade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
    .lth-fade{animation:lthfade .2s ease both}
    .lth-ta{
      background:rgba(14,37,68,.75); border:1px solid rgba(42,79,122,.5);
      border-radius:10px; padding:10px 12px; color:var(--lth-txt);
      font-family:"JetBrains Mono",monospace; font-size:11px; outline:none;
      width:100%; box-sizing:border-box; resize:vertical; line-height:1.65;
      transition:border-color .15s;
    }
    .lth-ta:focus{border-color:rgba(0,229,192,.5); box-shadow:0 0 0 2px rgba(0,229,192,.08)}
    .lth-ta::placeholder{color:rgba(130,174,206,.3)}
  `;
  document.head.appendChild(s);
  if (!document.getElementById("lth-fonts")) {
    const l = document.createElement("link"); l.id = "lth-fonts"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
    document.head.appendChild(l);
  }
})();

// ─── ANALYTE CONFIGURATION ────────────────────────────────────────────────────
const ANALYTES = {
  troponin: {
    label:"Troponin",
    unit:"ng/mL",
    color:"#ff6b6b",
    decimals:3,
    references:[
      { value:0.04, label:"Delta threshold (ACS)", color:"rgba(255,107,107,.6)", dash:"8 4" },
      { value:0.012, label:"URL (hsTnI)", color:"rgba(245,200,66,.5)", dash:"4 4" },
    ],
    interpret: (points) => {
      if (points.length < 2) return null;
      const sorted = [...points].sort((a,b) => a.ts - b.ts);
      const deltas = [];
      for (let i = 1; i < sorted.length; i++) {
        const delta = sorted[i].value - sorted[i-1].value;
        const hDiff = (sorted[i].ts - sorted[i-1].ts) / 3600000;
        deltas.push({ delta, hours:hDiff, abs:Math.abs(delta) });
      }
      const maxDelta = deltas.reduce((m,d) => d.abs > m.abs ? d : m, deltas[0]);
      const rising = sorted[sorted.length-1].value > sorted[0].value;
      const significantRise = deltas.some(d => d.delta >= 0.04);
      return {
        trend: rising ? "worsening" : "improving",
        flags: significantRise
          ? [`⚠ Delta ≥0.04 ng/mL detected — meets ACC/AHA 2023 ACS protocol threshold`]
          : [`Max delta: ${maxDelta.delta >= 0 ? "+" : ""}${maxDelta.delta.toFixed(3)} ng/mL over ${maxDelta.hours.toFixed(1)}h`],
        guideline: "ACC/AHA 2023 Chest Pain Guideline",
      };
    },
  },

  creatinine: {
    label:"Creatinine",
    unit:"mg/dL",
    color:"#3b9eff",
    decimals:2,
    references:[
      { value:null, label:"KDIGO thresholds calculated from baseline", color:"rgba(59,158,255,.4)", dash:"6 3" },
    ],
    interpret: (points) => {
      if (points.length < 2) return null;
      const sorted = [...points].sort((a,b) => a.ts - b.ts);
      const baseline = sorted[0].value;
      const latest   = sorted[sorted.length-1].value;
      const rise48h  = sorted.filter(p => (sorted[sorted.length-1].ts - p.ts) <= 48*3600000);
      const maxRise48 = Math.max(...rise48h.map(p => latest - p.value));
      let stage = 0;
      const flags = [];
      if (latest >= baseline * 3)        { stage = 3; flags.push("⚠ AKI Stage 3 (3× baseline) — nephrology consult indicated"); }
      else if (latest >= baseline * 2)   { stage = 2; flags.push("⚠ AKI Stage 2 (2× baseline)"); }
      else if (latest >= baseline * 1.5 || maxRise48 >= 0.3) {
        stage = 1;
        flags.push(maxRise48 >= 0.3
          ? `⚠ AKI Stage 1 (≥0.3 mg/dL rise in 48h: +${maxRise48.toFixed(2)})`
          : `⚠ AKI Stage 1 (≥1.5× baseline)`);
      }
      if (!flags.length) flags.push(`No KDIGO AKI criteria met · Latest ${latest.toFixed(2)} vs baseline ${baseline.toFixed(2)} mg/dL`);
      return {
        trend: latest > baseline ? "worsening" : latest < baseline ? "improving" : "stable",
        stage: stage || null,
        flags,
        guideline: "KDIGO AKI 2012",
      };
    },
  },

  lactate: {
    label:"Lactate",
    unit:"mmol/L",
    color:"#ff9f43",
    decimals:1,
    references:[
      { value:2,   label:"Elevated (>2 mmol/L)", color:"rgba(255,159,67,.5)",  dash:"6 3" },
      { value:4,   label:"High risk (>4 mmol/L)", color:"rgba(255,68,68,.5)",  dash:"4 4" },
    ],
    interpret: (points) => {
      if (points.length < 2) return null;
      const sorted = [...points].sort((a,b) => a.ts - b.ts);
      const first  = sorted[0].value;
      const latest = sorted[sorted.length-1].value;
      const clearance = ((first - latest) / first * 100);
      const flags = [];
      if (clearance >= 10) flags.push(`✓ Lactate clearance ${clearance.toFixed(0)}% — ≥10% clearance meets Surviving Sepsis target`);
      else if (first > 2)  flags.push(`⚠ Inadequate clearance (${clearance.toFixed(0)}%) — target ≥10% per SSC 2021`);
      if (latest > 4)      flags.push(`⚠ Lactate >4 mmol/L — high risk; consider ICU`);
      else if (latest > 2) flags.push(`Lactate still elevated (${latest.toFixed(1)} mmol/L) — continue resuscitation`);
      return {
        trend: latest < first ? "improving" : latest > first ? "worsening" : "stable",
        flags,
        guideline:"Surviving Sepsis Campaign 2021",
      };
    },
  },

  hemoglobin: {
    label:"Hemoglobin",
    unit:"g/dL",
    color:"#3dffa0",
    decimals:1,
    references:[
      { value:7,  label:"Transfusion threshold (7 g/dL)", color:"rgba(255,68,68,.5)",   dash:"5 4" },
      { value:8,  label:"Cardiac threshold (8 g/dL)",     color:"rgba(255,159,67,.4)",  dash:"4 4" },
    ],
    interpret: (points) => {
      if (points.length < 2) return null;
      const sorted = [...points].sort((a,b) => a.ts - b.ts);
      const first  = sorted[0].value;
      const latest = sorted[sorted.length-1].value;
      const drop   = first - latest;
      const flags  = [];
      if (drop >= 2)   flags.push(`⚠ Drop ≥2 g/dL (${drop.toFixed(1)} g/dL) — significant hemorrhage`);
      if (latest <= 7) flags.push(`⚠ Hgb ≤7 g/dL — meets transfusion threshold (most patients)`);
      if (!flags.length) flags.push(`Hgb stable · Total change: ${drop >= 0 ? "-" : "+"}${Math.abs(drop).toFixed(1)} g/dL`);
      return {
        trend: latest < first ? "worsening" : "improving",
        flags,
        guideline:"AABB Clinical Practice Guideline 2016",
      };
    },
  },

  bnp: {
    label:"BNP / NT-proBNP",
    unit:"pg/mL",
    color:"#9b6dff",
    decimals:0,
    references:[
      { value:100, label:"BNP cutoff (100 pg/mL)",     color:"rgba(155,109,255,.4)", dash:"6 3" },
      { value:900, label:"NT-proBNP age >75 (900)",    color:"rgba(245,200,66,.4)",  dash:"4 4" },
    ],
    interpret: (points) => {
      if (points.length < 2) return null;
      const sorted = [...points].sort((a,b) => a.ts - b.ts);
      const first = sorted[0].value; const latest = sorted[sorted.length-1].value;
      const pct = ((first - latest) / first * 100);
      const flags = [];
      if (pct >= 30 && latest < first) flags.push(`✓ BNP decrease ${pct.toFixed(0)}% — ≥30% reduction suggests treatment response`);
      else if (latest > first) flags.push(`⚠ BNP rising — incomplete decongestion`);
      if (latest > 100) flags.push(`BNP >100 pg/mL threshold — consistent with elevated filling pressures`);
      return {
        trend: latest < first ? "improving" : "worsening",
        flags,
        guideline:"ACC/AHA 2022 Heart Failure Guideline",
      };
    },
  },

  glucose: {
    label:"Glucose",
    unit:"mg/dL",
    color:"#f5c842",
    decimals:0,
    references:[
      { value:70,  label:"Hypoglycemia (<70)",   color:"rgba(59,158,255,.5)",  dash:"5 3" },
      { value:180, label:"Hyperglycemia (>180)", color:"rgba(255,107,107,.4)", dash:"4 4" },
      { value:250, label:"DKA threshold (>250)", color:"rgba(255,68,68,.5)",   dash:"3 4" },
    ],
    interpret: (points) => {
      if (points.length < 2) return null;
      const sorted = [...points].sort((a,b) => a.ts - b.ts);
      const first = sorted[0].value; const latest = sorted[sorted.length-1].value;
      const flags = [];
      if (latest < 70)  flags.push(`⚠ Glucose <70 mg/dL — hypoglycemia; recheck in 15 min after treatment`);
      if (latest > 250) flags.push(`⚠ Glucose >250 mg/dL — evaluate for DKA/HHS`);
      const improving = (first > 180 && latest < first) || (first < 70 && latest > first);
      return {
        trend: improving ? "improving" : latest > first ? "worsening" : "stable",
        flags: flags.length ? flags : [`Glucose ${latest} mg/dL · Change: ${latest > first ? "+" : ""}${(latest-first).toFixed(0)} mg/dL`],
        guideline:"",
      };
    },
  },

  custom: {
    label:"Custom",
    unit:"",
    color:"#82aece",
    decimals:2,
    references:[],
    interpret: (points) => {
      if (points.length < 2) return null;
      const sorted = [...points].sort((a,b) => a.ts - b.ts);
      const first = sorted[0].value; const latest = sorted[sorted.length-1].value;
      const pct = first !== 0 ? ((latest - first) / first * 100) : 0;
      return {
        trend: latest < first ? "improving" : latest > first ? "worsening" : "stable",
        flags: [`Change: ${latest > first ? "+" : ""}${(latest-first).toFixed(2)} (${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%)`],
        guideline:"",
      };
    },
  },
};

// ─── RESULT PARSER ────────────────────────────────────────────────────────────
// Handles formats:
//   "0800 1.8\n1200 2.4"  (time value)
//   "1.8 / 2.4 / 2.1"    (slash-separated, evenly spaced 1h apart)
//   "08:00: 1.8"          (with colons/labels)
//   "1.8, 2.4, 2.1"       (comma-separated)
function parseResults(raw, analyteType) {
  if (!raw.trim()) return [];
  const lines = raw.split(/[\n,]/).map(l => l.trim()).filter(Boolean);
  const now = Date.now();
  const results = [];

  // Try slash-separated on single line
  if (lines.length === 1 && raw.includes("/")) {
    const parts = raw.split("/").map(p => p.trim()).filter(Boolean);
    parts.forEach((p, i) => {
      const val = parseFloat(p.replace(/[^\d.]/g, ""));
      if (!isNaN(val)) results.push({
        ts: now - (parts.length - 1 - i) * 3600000,
        value: val,
        label: `T${i === 0 ? "0" : "+" + i + "h"}`,
      });
    });
    return results;
  }

  // Try time + value pairs
  lines.forEach(line => {
    // Match patterns: "0800 1.8", "08:00 1.8", "0800: 1.8", "T+3h: 1.8", "3h 1.8"
    const timeValMatch = line.match(/^(\d{1,2}:?\d{2})\s*:?\s*([\d.]+)/);
    const relMatch     = line.match(/^[Tt]\+?(\d+\.?\d*)\s*h[:\s]+?([\d.]+)/i);
    const justVal      = line.match(/^([\d.]+)\s*$/);

    if (timeValMatch) {
      const timeStr = timeValMatch[1].replace(":", "");
      const h = parseInt(timeStr.slice(0, -2) || "0");
      const m = parseInt(timeStr.slice(-2));
      const base = new Date(); base.setHours(h, m, 0, 0);
      results.push({ ts: base.getTime(), value: parseFloat(timeValMatch[2]), label: timeValMatch[1] });
    } else if (relMatch) {
      const hoursAgo = parseFloat(relMatch[1]);
      results.push({ ts: now - hoursAgo * 3600000, value: parseFloat(relMatch[2]), label: `T+${relMatch[1]}h` });
    } else if (justVal) {
      results.push({ ts: now - (lines.length - results.length - 1) * 3600000, value: parseFloat(justVal[1]), label: `#${results.length + 1}` });
    }
  });

  return results.filter(r => !isNaN(r.value)).sort((a, b) => a.ts - b.ts);
}

// ─── CUSTOM TOOLTIP ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, unit, decimals }) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  return (
    <div style={{ background:"rgba(8,22,40,.95)", border:"1px solid rgba(42,79,122,.6)",
      borderRadius:8, padding:"8px 12px",
      fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}>
      <div style={{ color:"var(--lth-txt4)", marginBottom:3 }}>{label}</div>
      <div style={{ color:payload[0]?.color || "var(--lth-teal)", fontWeight:700, fontSize:14 }}>
        {typeof val === "number" ? val.toFixed(decimals) : val} {unit}
      </div>
    </div>
  );
}

// ─── TREND BADGE ─────────────────────────────────────────────────────────────
function TrendBadge({ trend }) {
  if (!trend) return null;
  const cfg = {
    improving: { color:"var(--lth-green)",  bg:"rgba(61,255,160,.1)",  bd:"rgba(61,255,160,.3)",  icon:"↓", label:"Improving" },
    worsening: { color:"var(--lth-red)",    bg:"rgba(255,68,68,.1)",   bd:"rgba(255,68,68,.3)",   icon:"↑", label:"Worsening" },
    stable:    { color:"var(--lth-gold)",   bg:"rgba(245,200,66,.08)", bd:"rgba(245,200,66,.3)",  icon:"→", label:"Stable"    },
  }[trend] || {};
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5,
      padding:"3px 10px", borderRadius:20,
      background:cfg.bg, border:`1px solid ${cfg.bd}`,
      fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:12,
      color:cfg.color }}>
      <span style={{ fontSize:14 }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

// ─── ANALYTE PANEL ────────────────────────────────────────────────────────────
function AnalytePanel({ defaultType, onRemove, panelId }) {
  const [analyteType, setAnalyteType] = useState(defaultType || "troponin");
  const [rawInput,    setRawInput]    = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [customUnit,  setCustomUnit]  = useState("");

  const cfg = ANALYTES[analyteType];
  const label = analyteType === "custom" && customLabel ? customLabel : cfg.label;
  const unit  = analyteType === "custom" ? customUnit : cfg.unit;

  const points = useMemo(() => parseResults(rawInput, analyteType), [rawInput, analyteType]);
  const interp = useMemo(() => {
    if (points.length < 2) return null;
    return cfg.interpret(points);
  }, [points, cfg]);

  // Build chart data — format x-axis as HH:MM
  const chartData = useMemo(() => points.map(p => ({
    time:  p.label,
    value: p.value,
    ts:    p.ts,
  })), [points]);

  // Dynamic y-axis domain with padding
  const yVals  = points.map(p => p.value);
  const refVals = cfg.references.filter(r => r.value).map(r => r.value);
  const allVals = [...yVals, ...refVals];
  const yMin = allVals.length ? Math.max(0, Math.min(...allVals) * 0.85) : 0;
  const yMax = allVals.length ? Math.max(...allVals) * 1.15 : 10;

  const placeholder = {
    troponin:   "0800: 0.012\n1100: 0.031\n1400: 0.067",
    creatinine: "0900: 1.1\n1500: 1.6\n2100: 2.0",
    lactate:    "08:00: 4.2\n10:00: 3.1\n12:00: 2.0",
    hemoglobin: "10:00: 10.2\n14:00: 8.8\n18:00: 7.1",
    bnp:        "0800: 820\n1400: 640\n2000: 490",
    glucose:    "0800: 380\n1000: 290\n1200: 220",
    custom:     "08:00: 5.2\n10:00: 4.8\n12:00: 4.1",
  }[analyteType];

  return (
    <div className="lth-fade" style={{
      background:"rgba(8,22,40,.65)", backdropFilter:"blur(16px)",
      border:`1px solid ${cfg.color}33`,
      borderRadius:16, padding:"18px 20px", marginBottom:16,
    }}>
      {/* Panel header */}
      <div style={{ display:"flex", alignItems:"center", gap:10,
        marginBottom:14, flexWrap:"wrap" }}>
        <div style={{ width:10, height:10, borderRadius:"50%",
          background:cfg.color, flexShrink:0,
          boxShadow:`0 0 8px ${cfg.color}` }} />
        <select value={analyteType} onChange={e => { setAnalyteType(e.target.value); setRawInput(""); }}
          style={{ background:"rgba(14,37,68,.8)", border:"1px solid rgba(42,79,122,.5)",
            borderRadius:8, padding:"5px 10px", color:"var(--lth-txt)",
            fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:13,
            outline:"none", cursor:"pointer" }}>
          {Object.entries(ANALYTES).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        {analyteType === "custom" && (
          <>
            <input value={customLabel} onChange={e => setCustomLabel(e.target.value)}
              placeholder="Label"
              style={{ padding:"5px 9px", borderRadius:7, width:100,
                background:"rgba(14,37,68,.7)", border:"1px solid rgba(42,79,122,.5)",
                color:"var(--lth-txt)", fontFamily:"'DM Sans',sans-serif",
                fontSize:12, outline:"none" }} />
            <input value={customUnit} onChange={e => setCustomUnit(e.target.value)}
              placeholder="Unit"
              style={{ padding:"5px 9px", borderRadius:7, width:70,
                background:"rgba(14,37,68,.7)", border:"1px solid rgba(42,79,122,.5)",
                color:"var(--lth-txt)", fontFamily:"'DM Sans',sans-serif",
                fontSize:12, outline:"none" }} />
          </>
        )}
        {interp && <TrendBadge trend={interp.trend} />}
        {interp?.stage && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
            fontWeight:700, color:"var(--lth-red)", background:"rgba(255,68,68,.1)",
            border:"1px solid rgba(255,68,68,.3)", borderRadius:5,
            padding:"2px 9px", letterSpacing:.5 }}>
            AKI Stage {interp.stage}
          </span>
        )}
        <div style={{ flex:1 }} />
        <button onClick={() => onRemove(panelId)}
          style={{ background:"transparent", border:"1px solid rgba(42,79,122,.4)",
            borderRadius:7, cursor:"pointer", padding:"4px 10px",
            fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:"var(--lth-txt4)", transition:"all .15s" }}>
          Remove
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"260px 1fr", gap:16 }}>
        {/* Left: input */}
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
            color:"var(--lth-txt4)", letterSpacing:1.2, textTransform:"uppercase",
            marginBottom:6 }}>
            Enter Results
          </div>
          <textarea className="lth-ta" rows={8}
            value={rawInput}
            onChange={e => setRawInput(e.target.value)}
            placeholder={placeholder}
            style={{ borderColor: rawInput ? `${cfg.color}44` : undefined }}
          />
          <div style={{ marginTop:6, fontFamily:"'JetBrains Mono',monospace",
            fontSize:8, color:"var(--lth-txt4)", lineHeight:1.6 }}>
            Formats: <span style={{ color:"var(--lth-txt3)" }}>0800: 1.8</span> ·{" "}
            <span style={{ color:"var(--lth-txt3)" }}>T+3h: 2.1</span> ·{" "}
            <span style={{ color:"var(--lth-txt3)" }}>1.8 / 2.4 / 2.1</span><br/>
            One result per line · Timestamps optional
          </div>
          {points.length > 0 && (
            <div style={{ marginTop:10, display:"flex", flexDirection:"column", gap:4 }}>
              {points.map((p, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center",
                  gap:8, padding:"4px 8px", borderRadius:6,
                  background:`${cfg.color}08`, border:`1px solid ${cfg.color}22` }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                    color:"var(--lth-txt4)", minWidth:36 }}>{p.label}</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                    fontSize:13, color:cfg.color }}>
                    {p.value.toFixed(cfg.decimals)}
                  </span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                    color:"var(--lth-txt4)" }}>{unit}</span>
                  {i > 0 && (
                    <span style={{ marginLeft:"auto",
                      fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                      color: p.value > points[i-1].value ? "var(--lth-red)"
                           : p.value < points[i-1].value ? "var(--lth-green)"
                           : "var(--lth-gold)" }}>
                      {p.value > points[i-1].value ? "↑" : p.value < points[i-1].value ? "↓" : "→"}
                      {Math.abs(p.value - points[i-1].value).toFixed(cfg.decimals)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: chart + interpretation */}
        <div>
          {points.length >= 2 ? (
            <>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                color:"var(--lth-txt4)", letterSpacing:1.2, textTransform:"uppercase",
                marginBottom:8 }}>Trend Chart — {label} ({unit})</div>

              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top:8, right:16, bottom:8, left:8 }}>
                  <CartesianGrid strokeDasharray="3 3"
                    stroke="rgba(42,79,122,.3)" vertical={false} />
                  <XAxis dataKey="time"
                    tick={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                      fill:"var(--lth-txt4)" }}
                    tickLine={false} axisLine={{ stroke:"rgba(42,79,122,.4)" }} />
                  <YAxis domain={[yMin, yMax]}
                    tick={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                      fill:"var(--lth-txt4)" }}
                    tickLine={false} axisLine={false}
                    tickFormatter={v => v.toFixed(cfg.decimals)} />
                  <Tooltip content={<ChartTooltip unit={unit} decimals={cfg.decimals} />} />
                  {cfg.references.filter(r => r.value).map((ref, i) => (
                    <ReferenceLine key={i} y={ref.value}
                      stroke={ref.color} strokeDasharray={ref.dash} strokeWidth={1.5}>
                      <Label value={ref.label} position="insideTopRight"
                        style={{ fontFamily:"'JetBrains Mono',monospace",
                          fontSize:8, fill:ref.color }} />
                    </ReferenceLine>
                  ))}
                  <Line type="monotone" dataKey="value"
                    stroke={cfg.color} strokeWidth={2.5}
                    dot={{ fill:cfg.color, r:5, strokeWidth:0 }}
                    activeDot={{ r:7, fill:cfg.color,
                      stroke:"rgba(255,255,255,.3)", strokeWidth:2 }} />
                </LineChart>
              </ResponsiveContainer>

              {/* Clinical interpretation */}
              {interp && (
                <div style={{ marginTop:10, padding:"10px 12px", borderRadius:10,
                  background:`${cfg.color}08`, border:`1px solid ${cfg.color}22` }}>
                  {interp.flags.map((flag, i) => (
                    <div key={i} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                      color: flag.startsWith("⚠") ? "var(--lth-coral)"
                           : flag.startsWith("✓") ? "var(--lth-green)"
                           : "var(--lth-txt2)",
                      lineHeight:1.5, marginBottom: i < interp.flags.length-1 ? 4 : 0 }}>
                      {flag}
                    </div>
                  ))}
                  {interp.guideline && (
                    <div style={{ marginTop:6, fontFamily:"'JetBrains Mono',monospace",
                      fontSize:8, color:"var(--lth-blue)", letterSpacing:.3 }}>
                      {interp.guideline}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div style={{ height:220, display:"flex", alignItems:"center",
              justifyContent:"center", flexDirection:"column", gap:10,
              border:"1px dashed rgba(42,79,122,.4)", borderRadius:12 }}>
              <div style={{ fontSize:28, opacity:.3 }}>📈</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                color:"var(--lth-txt4)", textAlign:"center" }}>
                {points.length === 1
                  ? "Enter at least 2 results to render trend"
                  : "Enter serial results to render trend chart"}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function LabTrendHub() {
  const [panels, setPanels] = useState([
    { id:"p1", type:"troponin" },
  ]);
  const idRef = { current: panels.length + 1 };

  const addPanel = (type) => {
    const id = `p${Date.now()}`;
    setPanels(prev => [...prev, { id, type }]);
  };

  const removePanel = useCallback((id) => {
    setPanels(prev => prev.filter(p => p.id !== id));
  }, []);

  return (
    <div style={{ minHeight:"100vh", background:"var(--lth-bg)",
      fontFamily:"'DM Sans',sans-serif", color:"var(--lth-txt)",
      padding:"24px 20px 60px" }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom:22 }}>
          <button onClick={() => window.history.back()}
            style={{ marginBottom:12, display:"inline-flex", alignItems:"center", gap:7,
              fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
              background:"rgba(14,37,68,.7)", border:"1px solid rgba(42,79,122,.5)",
              borderRadius:8, padding:"5px 14px", color:"var(--lth-txt3)", cursor:"pointer" }}>
            ← Back
          </button>
          <div style={{ display:"flex", alignItems:"flex-start", gap:14, flexWrap:"wrap" }}>
            <div>
              <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900,
                fontSize:"clamp(22px,4vw,34px)", letterSpacing:-.5,
                margin:"0 0 4px", color:"var(--lth-txt)" }}>
                Lab Trend
              </h1>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                color:"var(--lth-txt4)", margin:0, lineHeight:1.6 }}>
                Serial lab visualization · KDIGO AKI · Troponin delta · Lactate clearance ·
                Clinical decision support scratchpad — no data saved
              </p>
            </div>
            <div style={{ marginLeft:"auto", display:"flex", gap:7, flexWrap:"wrap" }}>
              {Object.entries(ANALYTES).map(([k, v]) => (
                <button key={k} onClick={() => addPanel(k)}
                  style={{ padding:"6px 12px", borderRadius:8, cursor:"pointer",
                    fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                    border:`1px solid ${v.color}33`,
                    background:`${v.color}0c`,
                    color:v.color, transition:"all .15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = v.color + "1e"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = v.color + "0c"; }}>
                  + {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Safety note */}
        <div style={{ marginBottom:16, padding:"8px 14px", borderRadius:8,
          background:"rgba(245,200,66,.06)", border:"1px solid rgba(245,200,66,.22)",
          display:"flex", gap:9, alignItems:"center" }}>
          <span style={{ fontSize:13, flexShrink:0 }}>⚠</span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:"var(--lth-gold)", lineHeight:1.5 }}>
            Clinical decision support only — verify all values in your EHR. Thresholds are
            population-based guidelines; individual patient context always takes precedence.
          </span>
        </div>

        {/* Panels */}
        {panels.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 0" }}>
            <div style={{ fontSize:36, marginBottom:12 }}>📈</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16,
              color:"var(--lth-txt)", marginBottom:8 }}>No analytes added</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:"var(--lth-txt4)" }}>Click an analyte button above to start trending</div>
          </div>
        ) : (
          panels.map(p => (
            <AnalytePanel key={p.id} panelId={p.id}
              defaultType={p.type} onRemove={removePanel} />
          ))
        )}

        <div style={{ marginTop:24, textAlign:"center",
          fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:"rgba(107,158,200,.4)", letterSpacing:1.5 }}>
          NOTRYA LAB TREND · CLINICAL DECISION SUPPORT · NOT A SUBSTITUTE FOR EHR REVIEW
        </div>
      </div>
    </div>
  );
}