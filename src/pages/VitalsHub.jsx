// VitalsHub.jsx
// Serial vital signs trend visualization for Emergency Medicine
// Multi-parameter input — paste one nurse note block, all six parameters chart simultaneously
// SIRS criteria, qSOFA, Shock Index auto-calculated per time point
// Pre-populates from QuickNote via ?v= URL param
// No data saved — clinical decision support scratchpad

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts";

// ─── STYLE INJECTION ─────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("vh-css")) return;
  const s = document.createElement("style"); s.id = "vh-css";
  s.textContent = `
    :root{
      --vh-bg:#050f1e;--vh-card:#0b1e36;
      --vh-txt:#f2f7ff;--vh-txt2:#b8d4f0;--vh-txt3:#82aece;--vh-txt4:#6b9ec8;
      --vh-teal:#00e5c0;--vh-gold:#f5c842;--vh-coral:#ff6b6b;
      --vh-blue:#3b9eff;--vh-purple:#9b6dff;--vh-green:#3dffa0;
      --vh-red:#ff4444;--vh-bd:rgba(42,79,122,0.4);
    }
    @keyframes vhfade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    .vh-fade{animation:vhfade .2s ease both}
    .vh-ta{
      background:rgba(14,37,68,.75);border:1px solid var(--vh-bd);
      border-radius:10px;padding:10px 12px;color:var(--vh-txt);
      font-family:"JetBrains Mono",monospace;font-size:11px;outline:none;
      width:100%;box-sizing:border-box;resize:vertical;line-height:1.65;
      transition:border-color .15s;
    }
    .vh-ta:focus{border-color:rgba(0,229,192,.5);box-shadow:0 0 0 2px rgba(0,229,192,.08)}
    .vh-ta::placeholder{color:rgba(130,174,206,.3)}
  `;
  document.head.appendChild(s);
  if (!document.getElementById("vh-fonts")) {
    const l = document.createElement("link"); l.id="vh-fonts"; l.rel="stylesheet";
    l.href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
    document.head.appendChild(l);
  }
})();

// ─── PARAMETER CONFIG ─────────────────────────────────────────────────────────
const PARAMS = {
  hr:   { label:"Heart Rate",    unit:"bpm",  color:"#ff6b6b", decimals:0,
          refs:[{ v:100, label:">100", dash:"5 3", color:"rgba(255,107,107,.5)" },
                { v:60,  label:"<60",  dash:"4 4", color:"rgba(59,158,255,.4)"  }] },
  sbp:  { label:"Systolic BP",   unit:"mmHg", color:"#3b9eff", decimals:0,
          refs:[{ v:90,  label:"<90 (shock)",   dash:"5 3", color:"rgba(255,68,68,.5)"   },
                { v:160, label:">160 (HTN)",     dash:"4 4", color:"rgba(255,159,67,.4)"  }] },
  dbp:  { label:"Diastolic BP",  unit:"mmHg", color:"#60a5fa", decimals:0,
          refs:[{ v:110, label:">110",           dash:"4 4", color:"rgba(255,159,67,.4)"  }] },
  map:  { label:"MAP",           unit:"mmHg", color:"#9b6dff", decimals:0,
          refs:[{ v:65,  label:"<65 (shock)",    dash:"5 3", color:"rgba(255,68,68,.5)"   }] },
  rr:   { label:"Resp Rate",     unit:"/min", color:"#f5c842", decimals:0,
          refs:[{ v:20,  label:"SIRS >20",        dash:"5 3", color:"rgba(255,159,67,.5)"  },
                { v:22,  label:"qSOFA ≥22",       dash:"3 3", color:"rgba(255,107,107,.4)" }] },
  spo2: { label:"SpO2",          unit:"%",    color:"#3dffa0", decimals:0,
          refs:[{ v:94,  label:"<94%",            dash:"5 3", color:"rgba(255,159,67,.5)"  },
                { v:90,  label:"<90%",            dash:"4 4", color:"rgba(255,68,68,.4)"   }] },
  temp: { label:"Temperature",   unit:"°C",   color:"#fb923c", decimals:1,
          refs:[{ v:38.3,label:"SIRS >38.3°C",    dash:"5 3", color:"rgba(255,107,107,.4)" },
                { v:36,  label:"SIRS <36°C",      dash:"4 4", color:"rgba(59,158,255,.4)"  }] },
};

// ─── VITALS PARSER ─────────────────────────────────────────────────────────────
function parseVitalsSeries(raw) {
  if (!raw.trim()) return [];
  const blocks = raw.split(/\n/).filter(l => l.trim());
  const results = [];
  const now = Date.now();

  blocks.forEach((line, idx) => {
    const trimmed = line.trim();
    const timeMatch = trimmed.match(/^(\d{1,2}):?(\d{2})\s*:?\s*/);
    let ts, label, rest;
    if (timeMatch) {
      const h = parseInt(timeMatch[1]); const m = parseInt(timeMatch[2]);
      const d = new Date(); d.setHours(h, m, 0, 0);
      ts = d.getTime(); label = `${timeMatch[1]}:${timeMatch[2]}`;
      rest = trimmed.slice(timeMatch[0].length);
    } else {
      ts = now - (blocks.length - 1 - idx) * 30 * 60000;
      label = `T${idx === 0 ? "0" : "+" + (idx * 30) + "m"}`;
      rest = trimmed;
    }

    const extract = (pattern) => {
      const m = rest.match(pattern);
      return m ? parseFloat(m[1]) : null;
    };
    const hr   = extract(/\bhr\s*(\d+)/i)   || extract(/\bpulse\s*(\d+)/i);
    const bpM  = rest.match(/\bbp\s*(\d+)\/(\d+)/i);
    const sbp  = bpM ? parseFloat(bpM[1]) : null;
    const dbp  = bpM ? parseFloat(bpM[2]) : null;
    const map  = sbp && dbp ? Math.round(dbp + (sbp - dbp) / 3) : null;
    const rr   = extract(/\brr\s*(\d+)/i)   || extract(/\bresp\s*(\d+)/i);
    const spo2 = extract(/spo2\s*(\d+)/i)   || extract(/o2\s+sat\s*(\d+)/i) || extract(/sat\s*(\d+)/i);
    const temp = extract(/\bt\s*([\d.]+)/i) || extract(/temp\s*([\d.]+)/i);

    const point = { ts, label, hr, sbp, dbp, map, rr, spo2, temp };
    if (Object.values({ hr, sbp, rr, spo2, temp }).some(v => v !== null)) {
      results.push(point);
    }
  });
  return results.sort((a,b) => a.ts - b.ts);
}

// ─── CLINICAL CALCULATORS ─────────────────────────────────────────────────────
function calcSIRS(p) {
  const criteria = [];
  if (p.hr  !== null && p.hr   > 90)   criteria.push("HR >90");
  if (p.rr  !== null && p.rr   > 20)   criteria.push("RR >20");
  if (p.temp!== null && p.temp > 38.3) criteria.push("T >38.3°C");
  if (p.temp!== null && p.temp < 36)   criteria.push("T <36°C");
  return criteria;
}

function calcQSOFA(p) {
  const criteria = [];
  if (p.rr  !== null && p.rr  >= 22)  criteria.push("RR ≥22");
  if (p.sbp !== null && p.sbp <= 100) criteria.push("SBP ≤100");
  return criteria;
}

function calcShockIndex(p) {
  if (p.hr === null || p.sbp === null || p.sbp === 0) return null;
  return parseFloat((p.hr / p.sbp).toFixed(2));
}

// ─── MINI CHART ───────────────────────────────────────────────────────────────
function MiniChart({ paramKey, data }) {
  const cfg = PARAMS[paramKey];
  if (!cfg) return null;
  const vals = data.map(d => d[paramKey]).filter(v => v !== null);
  if (!vals.length) return (
    <div style={{ height:120, display:"flex", alignItems:"center", justifyContent:"center",
      border:"1px dashed rgba(42,79,122,.3)", borderRadius:8 }}>
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
        color:"var(--vh-txt4)" }}>no data</span>
    </div>
  );

  const allVals = [...vals, ...cfg.refs.map(r => r.v)].filter(Boolean);
  const yMin = Math.max(0, Math.min(...allVals) * 0.9);
  const yMax = Math.max(...allVals) * 1.1;

  const chartData = data.map(d => ({ time:d.label, value:d[paramKey] }))
    .filter(d => d.value !== null);

  const latest = vals[vals.length - 1];
  const first  = vals[0];
  const trend  = latest > first ? "↑" : latest < first ? "↓" : "→";
  const trendColor = (() => {
    if (paramKey === "hr"  ) return latest < first ? "var(--vh-green)" : latest > 100 ? "var(--vh-red)"  : "var(--vh-gold)";
    if (paramKey === "sbp" ) return latest > first ? "var(--vh-green)" : latest < 90  ? "var(--vh-red)"  : "var(--vh-gold)";
    if (paramKey === "rr"  ) return latest < first ? "var(--vh-green)" : latest > 22  ? "var(--vh-red)"  : "var(--vh-gold)";
    if (paramKey === "spo2") return latest > first ? "var(--vh-green)" : latest < 90  ? "var(--vh-red)"  : "var(--vh-gold)";
    if (paramKey === "temp") return Math.abs(latest - 37) < Math.abs(first - 37) ? "var(--vh-green)" : "var(--vh-coral)";
    if (paramKey === "map" ) return latest > first ? "var(--vh-green)" : latest < 65  ? "var(--vh-red)"  : "var(--vh-gold)";
    return "var(--vh-txt3)";
  })();

  return (
    <div style={{ padding:"8px 10px", borderRadius:10,
      background:"rgba(8,22,40,.65)", border:`1px solid ${cfg.color}22` }}>
      <div style={{ display:"flex", alignItems:"center", marginBottom:4 }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          fontWeight:700, color:cfg.color, letterSpacing:1, textTransform:"uppercase",
          flex:1 }}>{cfg.label}</span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
          fontSize:14, color:cfg.color }}>
          {latest.toFixed(cfg.decimals)}
        </span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:"var(--vh-txt4)", marginLeft:3 }}>{cfg.unit}</span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11,
          color:trendColor, marginLeft:5 }}>{trend}</span>
      </div>
      <ResponsiveContainer width="100%" height={80}>
        <LineChart data={chartData} margin={{ top:2, right:4, bottom:0, left:-24 }}>
          <CartesianGrid strokeDasharray="2 2" stroke="rgba(42,79,122,.2)" vertical={false} />
          <XAxis dataKey="time" hide />
          <YAxis domain={[yMin, yMax]} hide />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              return (
                <div style={{ background:"rgba(8,22,40,.95)", border:"1px solid rgba(42,79,122,.5)",
                  borderRadius:6, padding:"4px 8px",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:10 }}>
                  <span style={{ color:cfg.color }}>{payload[0]?.value?.toFixed(cfg.decimals)} {cfg.unit}</span>
                </div>
              );
            }}
          />
          {cfg.refs.map((ref, i) => (
            <ReferenceLine key={i} y={ref.v} stroke={ref.color}
              strokeDasharray={ref.dash} strokeWidth={1.5} />
          ))}
          <Line type="monotone" dataKey="value"
            stroke={cfg.color} strokeWidth={2}
            dot={{ fill:cfg.color, r:3, strokeWidth:0 }}
            activeDot={{ r:5, fill:cfg.color }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── FORMAT VITALS FOR QUICKNOTE ──────────────────────────────────────────────
function formatVitalsString(point) {
  const parts = [];
  if (point.hr   !== null) parts.push(`HR ${point.hr}`);
  if (point.sbp  !== null && point.dbp !== null)
    parts.push(`BP ${point.sbp}/${point.dbp}`);
  if (point.rr   !== null) parts.push(`RR ${point.rr}`);
  if (point.spo2 !== null) parts.push(`SpO2 ${point.spo2}%`);
  if (point.temp !== null) parts.push(`T ${point.temp.toFixed(1)}°C`);
  return parts.join("  ");
}

function sendToQuickNote(point) {
  const v = formatVitalsString(point);
  if (!v) return;
  window.location.href = "/QuickNote?vitals=" + encodeURIComponent(v);
}

// ─── TIME POINT ROW ──────────────────────────────────────────────────────────
function TimePointRow({ point }) {
  const sirs = calcSIRS(point);
  const qsofa = calcQSOFA(point);
  const si = calcShockIndex(point);
  const siFlag = si && si >= 1.0 ? "red" : si && si >= 0.9 ? "gold" : null;

  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap",
      padding:"7px 12px", borderRadius:8,
      background: sirs.length >= 2 ? "rgba(255,68,68,.06)" : "rgba(8,22,40,.5)",
      border:`1px solid ${sirs.length >= 2 ? "rgba(255,68,68,.25)" : "rgba(42,79,122,.3)"}` }}>

      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
        fontWeight:700, color:"var(--vh-txt3)", minWidth:44 }}>{point.label}</span>

      {[
        ["HR", point.hr, PARAMS.hr],
        ["BP", point.sbp && point.dbp ? `${point.sbp}/${point.dbp}` : null, PARAMS.sbp],
        ["MAP", point.map, PARAMS.map],
        ["RR", point.rr, PARAMS.rr],
        ["SpO2", point.spo2 ? `${point.spo2}%` : null, PARAMS.spo2],
        ["T", point.temp, PARAMS.temp],
      ].filter(([,v]) => v !== null).map(([lbl, val, pcfg]) => (
        <span key={lbl} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
          color: pcfg.color }}>
          <span style={{ color:"var(--vh-txt4)", fontSize:8 }}>{lbl} </span>
          {typeof val === "number" ? val.toFixed(pcfg.decimals) : val}
        </span>
      ))}

      <div style={{ display:"flex", gap:5, marginLeft:"auto", flexWrap:"wrap",
        alignItems:"center" }}>
        {si !== null && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            padding:"1px 6px", borderRadius:4, fontWeight:700,
            color: siFlag === "red" ? "var(--vh-red)" : siFlag === "gold" ? "var(--vh-gold)" : "var(--vh-txt4)",
            background: siFlag === "red" ? "rgba(255,68,68,.12)" : siFlag === "gold" ? "rgba(245,200,66,.08)" : "rgba(42,79,122,.15)",
            border: `1px solid ${siFlag === "red" ? "rgba(255,68,68,.3)" : siFlag === "gold" ? "rgba(245,200,66,.25)" : "rgba(42,79,122,.3)"}` }}>
            SI {si}
          </span>
        )}
        {sirs.length >= 2 && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            padding:"1px 6px", borderRadius:4, fontWeight:700,
            color:"var(--vh-coral)", background:"rgba(255,107,107,.1)",
            border:"1px solid rgba(255,107,107,.3)" }}>
            SIRS {sirs.length}
          </span>
        )}
        {qsofa.length >= 2 && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            padding:"1px 6px", borderRadius:4, fontWeight:700,
            color:"var(--vh-red)", background:"rgba(255,68,68,.12)",
            border:"1px solid rgba(255,68,68,.35)" }}>
            qSOFA+
          </span>
        )}
        <button onClick={() => sendToQuickNote(point)}
          title="Send these vitals to QuickNote Triage Vitals field"
          style={{ padding:"2px 8px", borderRadius:5, cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
            border:"1px solid rgba(0,229,192,.3)", background:"rgba(0,229,192,.07)",
            color:"var(--vh-teal)", letterSpacing:.4, transition:"all .15s",
            whiteSpace:"nowrap" }}
          onMouseEnter={e => { e.currentTarget.style.background="rgba(0,229,192,.18)"; e.currentTarget.style.borderColor="rgba(0,229,192,.6)"; }}
          onMouseLeave={e => { e.currentTarget.style.background="rgba(0,229,192,.07)"; e.currentTarget.style.borderColor="rgba(0,229,192,.3)"; }}>
          → QN
        </button>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function VitalsHub() {
  const [rawInput, setRawInput] = useState("");
  const [copied,   setCopied]   = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const v = params.get("v");
      if (v) setRawInput(decodeURIComponent(v));
    } catch {}
  }, []);

  const points = useMemo(() => parseVitalsSeries(rawInput), [rawInput]);

  const trajectory = useMemo(() => {
    if (points.length < 2) return null;
    const first = points[0]; const last = points[points.length - 1];
    const improving = [
      last.hr  !== null && first.hr  !== null && last.hr  < first.hr,
      last.sbp !== null && first.sbp !== null && last.sbp > first.sbp,
      last.rr  !== null && first.rr  !== null && last.rr  < first.rr,
      last.spo2!== null && first.spo2!== null && last.spo2> first.spo2,
    ].filter(Boolean).length;
    const worsening = [
      last.hr  !== null && first.hr  !== null && last.hr  > first.hr  && last.hr  > 90,
      last.sbp !== null && first.sbp !== null && last.sbp < first.sbp && last.sbp < 100,
      last.rr  !== null && first.rr  !== null && last.rr  > first.rr  && last.rr  > 20,
      last.spo2!== null && first.spo2!== null && last.spo2< first.spo2,
    ].filter(Boolean).length;
    if (improving > worsening) return "improving";
    if (worsening > improving) return "worsening";
    return "stable";
  }, [points]);

  const copySummary = useCallback(() => {
    if (!points.length) return;
    const now = new Date().toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
    const lines = [`VITAL SIGNS TREND — ${now}`];
    points.forEach(p => {
      const parts = [p.label];
      if (p.hr   !== null) parts.push(`HR ${p.hr}`);
      if (p.sbp  !== null) parts.push(`BP ${p.sbp}/${p.dbp}`);
      if (p.map  !== null) parts.push(`MAP ${p.map}`);
      if (p.rr   !== null) parts.push(`RR ${p.rr}`);
      if (p.spo2 !== null) parts.push(`SpO2 ${p.spo2}%`);
      if (p.temp !== null) parts.push(`T ${p.temp.toFixed(1)}°C`);
      const si = calcShockIndex(p);
      if (si !== null) parts.push(`SI ${si}`);
      const sirs = calcSIRS(p);
      if (sirs.length >= 2) parts.push(`SIRS(${sirs.length})`);
      if (calcQSOFA(p).length >= 2) parts.push("qSOFA+");
      lines.push(`  ${parts.join("  ")}`);
    });
    if (trajectory) lines.push(`\nOverall: ${trajectory.toUpperCase()}`);
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    });
  }, [points, trajectory]);

  const trajConfig = {
    improving:{ color:"var(--vh-green)",  bg:"rgba(61,255,160,.1)",  bd:"rgba(61,255,160,.3)",  icon:"↓", label:"Improving" },
    worsening:{ color:"var(--vh-red)",    bg:"rgba(255,68,68,.1)",   bd:"rgba(255,68,68,.3)",   icon:"↑", label:"Worsening" },
    stable:   { color:"var(--vh-gold)",   bg:"rgba(245,200,66,.08)", bd:"rgba(245,200,66,.3)",  icon:"→", label:"Stable"    },
  };
  const tc = trajectory ? trajConfig[trajectory] : null;

  const placeholder = `0800: HR 122 BP 88/54 RR 24 SpO2 92% T 38.9
0830: HR 108 BP 96/62 RR 20 SpO2 96% T 38.6
0900: HR 94  BP 112/72 RR 18 SpO2 99% T 38.1`;

  return (
    <div style={{ minHeight:"100vh", background:"var(--vh-bg)",
      fontFamily:"'DM Sans',sans-serif", color:"var(--vh-txt)",
      padding:"24px 20px 60px" }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom:20 }}>
          <button onClick={() => window.history.back()}
            style={{ marginBottom:12, display:"inline-flex", alignItems:"center", gap:7,
              fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
              background:"rgba(14,37,68,.7)", border:"1px solid rgba(42,79,122,.5)",
              borderRadius:8, padding:"5px 14px", color:"var(--vh-txt3)", cursor:"pointer" }}>
            ← Back
          </button>
          <div style={{ display:"flex", alignItems:"flex-start", gap:14, flexWrap:"wrap" }}>
            <div>
              <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900,
                fontSize:"clamp(22px,4vw,34px)", letterSpacing:-.5,
                margin:"0 0 4px", color:"var(--vh-txt)" }}>
                Vitals Hub
              </h1>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                color:"var(--vh-txt4)", margin:0, lineHeight:1.6 }}>
                Serial vital signs · SIRS criteria · qSOFA · Shock Index ·
                Paste nurse note format — no data saved
              </p>
            </div>
            <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
              {tc && (
                <span style={{ display:"inline-flex", alignItems:"center", gap:6,
                  padding:"5px 14px", borderRadius:20,
                  background:tc.bg, border:`1px solid ${tc.bd}`,
                  fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:13,
                  color:tc.color }}>
                  <span style={{ fontSize:16 }}>{tc.icon}</span>
                  {tc.label}
                </span>
              )}
              {points.length > 0 && (
                <button onClick={copySummary}
                  style={{ padding:"6px 14px", borderRadius:8, cursor:"pointer",
                    fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
                    border:`1px solid ${copied ? "rgba(61,255,160,.5)" : "rgba(42,79,122,.45)"}`,
                    background:copied ? "rgba(61,255,160,.1)" : "rgba(14,37,68,.7)",
                    color:copied ? "var(--vh-green)" : "var(--vh-txt4)",
                    letterSpacing:.5, textTransform:"uppercase", transition:"all .15s" }}>
                  {copied ? "✓ Copied" : "Copy Summary"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Safety note */}
        <div style={{ marginBottom:14, padding:"8px 14px", borderRadius:8,
          background:"rgba(245,200,66,.06)", border:"1px solid rgba(245,200,66,.22)",
          display:"flex", gap:9, alignItems:"center" }}>
          <span style={{ fontSize:13, flexShrink:0 }}>⚠</span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:"var(--vh-gold)", lineHeight:1.5 }}>
            Clinical decision support only — verify all values in your EHR.
            SIRS and qSOFA require clinical context; individual patient baseline always takes precedence.
          </span>
        </div>

        {/* Input + time point list */}
        <div style={{ display:"grid", gridTemplateColumns:"320px 1fr", gap:16, marginBottom:16 }}>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              color:"var(--vh-txt4)", letterSpacing:1.2, textTransform:"uppercase",
              marginBottom:6 }}>Enter Serial Vitals</div>
            <textarea className="vh-ta" rows={8}
              value={rawInput}
              onChange={e => setRawInput(e.target.value)}
              placeholder={placeholder}
              style={{ borderColor: rawInput ? "rgba(0,229,192,.4)" : undefined }} />
            <div style={{ marginTop:6, fontFamily:"'JetBrains Mono',monospace",
              fontSize:8, color:"var(--vh-txt4)", lineHeight:1.7 }}>
              Format: <span style={{ color:"var(--vh-txt3)" }}>0800: HR 102 BP 148/92 RR 18 SpO2 96% T 37.4</span><br/>
              One visit per line · Timestamp optional · All params optional
            </div>
          </div>

          <div>
            {points.length > 0 ? (
              <>
                <div style={{ display:"flex", alignItems:"center", marginBottom:6, gap:10 }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                    color:"var(--vh-txt4)", letterSpacing:1.2, textTransform:"uppercase",
                    flex:1 }}>
                    Time Points · {points.length} recorded
                  </div>
                  <button onClick={() => sendToQuickNote(points[0])}
                    title="Send arrival vitals (first time point) to QuickNote"
                    style={{ padding:"3px 10px", borderRadius:6, cursor:"pointer",
                      fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                      border:"1px solid rgba(0,229,192,.4)", background:"rgba(0,229,192,.1)",
                      color:"var(--vh-teal)", letterSpacing:.4, transition:"all .15s",
                      whiteSpace:"nowrap" }}>
                    Send First → QuickNote
                  </button>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  {points.map((p, i) => <TimePointRow key={i} point={p} idx={i} />)}
                </div>
              </>
            ) : (
              <div style={{ height:"100%", display:"flex", alignItems:"center",
                justifyContent:"center", border:"1px dashed rgba(42,79,122,.35)",
                borderRadius:10 }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:28, opacity:.3, marginBottom:8 }}>💓</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                    color:"var(--vh-txt4)" }}>
                    Paste serial vitals to begin trending
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Charts grid */}
        {points.length >= 2 && (
          <div className="vh-fade">
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              color:"var(--vh-txt4)", letterSpacing:1.2, textTransform:"uppercase",
              marginBottom:10 }}>
              Trend Charts — {points[0].label} → {points[points.length-1].label}
            </div>
            <div style={{ display:"grid",
              gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))",
              gap:10 }}>
              {Object.keys(PARAMS).map(key => (
                points.some(p => p[key] !== null) && (
                  <MiniChart key={key} paramKey={key} data={points} />
                )
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop:28, textAlign:"center",
          fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:"rgba(107,158,200,.4)", letterSpacing:1.5 }}>
          NOTRYA VITALS HUB · CLINICAL DECISION SUPPORT · NOT A SUBSTITUTE FOR BEDSIDE MONITORING
        </div>
      </div>
    </div>
  );
}