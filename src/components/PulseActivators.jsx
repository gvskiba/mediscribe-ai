import { useState, useEffect } from "react";

const C = {
  teal:      "#18D9A4",
  tealSoft:  "rgba(24,217,164,0.50)",
  tealGhost: "rgba(24,217,164,0.10)",
  tealBrd:   "rgba(24,217,164,0.42)",
  tealGlow:  "rgba(24,217,164,0.18)",
  mono:      "'JetBrains Mono','Courier New',monospace",
};

export const PULSE_EVENT = "notrya:pulse:open";

const CSS = `
  @keyframes paFabRip {
    0%   { transform:scale(0.72); opacity:0.84; }
    100% { transform:scale(2.85); opacity:0; }
  }
  @keyframes paNavFlash {
    0%   { opacity:0.9; transform:scale(1); }
    50%  { opacity:1;   transform:scale(1.05); }
    100% { opacity:0;   transform:scale(1.14); }
  }
  @keyframes paNavDot {
    0%,100% { opacity:1; }
    50%     { opacity:0.35; }
  }
  .pa-fab-ring { position:absolute; inset:-6px; border-radius:50%; pointer-events:none; }
  .pa-fab-ring-1 { border:2px   solid rgba(24,217,164,0.78); animation:paFabRip 0.74s ease-out           forwards; }
  .pa-fab-ring-2 { border:1.5px solid rgba(24,217,164,0.52); animation:paFabRip 0.74s ease-out 0.14s     forwards; }
  .pa-fab-ring-3 { border:1px   solid rgba(24,217,164,0.28); animation:paFabRip 0.74s ease-out 0.28s     forwards; }
  .pa-fab-btn:hover  { border-color:rgba(24,217,164,0.72)!important; box-shadow:0 0 30px rgba(24,217,164,0.30),0 4px 20px rgba(0,0,0,0.7)!important; }
  .pa-nav-btn:hover  { background:rgba(24,217,164,0.18)!important; border-color:rgba(24,217,164,0.68)!important; }
`;

let _cssInjected = false;
function injectCSS() {
  if (_cssInjected) return;
  _cssInjected = true;
  const el = document.createElement("style");
  el.textContent = CSS;
  document.head.appendChild(el);
}

export function PulseRippleMark({ size = 40, rings = 3, color }) {
  const f = color || C.teal;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display:"block", flexShrink:0 }} aria-hidden="true">
      <circle cx="50" cy="50" r="7"  fill={f} />
      {rings >= 1 && <circle cx="50" cy="50" r="18" stroke={f} strokeWidth="2.5" fill="none" opacity="0.88" />}
      {rings >= 2 && <circle cx="50" cy="50" r="31" stroke={f} strokeWidth="1.8" fill="none" opacity="0.52" />}
      {rings >= 3 && <circle cx="50" cy="50" r="46" stroke={f} strokeWidth="1.1" fill="none" opacity="0.24" />}
    </svg>
  );
}

export function PulseFAB() {
  const [ringing, setRinging] = useState(false);
  const [ringKey, setRingKey] = useState(0);
  useEffect(() => { injectCSS(); }, []);

  function activate() {
    setRingKey(k => k + 1);
    setRinging(false);
    setTimeout(() => setRinging(true), 10);
    setTimeout(() => setRinging(false), 800);
    window.dispatchEvent(new CustomEvent(PULSE_EVENT));
  }

  return (
    <div style={{ position:"fixed", top:90, right:22, zIndex:8900 }} aria-label="Open Pulse rapid orders">
      <div style={{ position:"relative", width:52, height:52 }}>
        {ringing && (
          <div key={ringKey} aria-hidden="true">
            <div className="pa-fab-ring pa-fab-ring-1" />
            <div className="pa-fab-ring pa-fab-ring-2" />
            <div className="pa-fab-ring pa-fab-ring-3" />
          </div>
        )}
        <button
          className="pa-fab-btn"
          onClick={activate}
          title="Pulse — Ctrl+Space"
          style={{
            position:"relative", zIndex:1,
            width:52, height:52, borderRadius:"50%",
            background:"linear-gradient(140deg,#0B1A30,#060C19)",
            border:"1.5px solid " + C.tealBrd,
            boxShadow:"0 0 22px " + C.tealGlow + ",0 4px 18px rgba(0,0,0,0.65)",
            cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            transition:"border-color 0.18s,box-shadow 0.18s",
          }}
        >
          <PulseRippleMark size={32} rings={3} />
        </button>
      </div>
    </div>
  );
}

export function PulseNavBadge({ label = "PULSE" }) {
  const [flashing, setFlashing] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  useEffect(() => { injectCSS(); }, []);

  function activate() {
    setFlashKey(k => k + 1);
    setFlashing(false);
    setTimeout(() => setFlashing(true), 10);
    setTimeout(() => setFlashing(false), 540);
    window.dispatchEvent(new CustomEvent(PULSE_EVENT));
  }

  return (
    <div style={{ position:"relative", display:"inline-flex" }}>
      {flashing && (
        <div
          key={flashKey}
          aria-hidden="true"
          style={{
            position:"absolute", inset:-5, borderRadius:12,
            border:"1.5px solid rgba(24,217,164,0.72)",
            animation:"paNavFlash 0.54s ease-out forwards",
            pointerEvents:"none",
          }}
        />
      )}
      <button
        className="pa-nav-btn"
        onClick={activate}
        title="Pulse — Ctrl+Space"
        style={{
          display:"flex", alignItems:"center", gap:6,
          padding:"5px 11px",
          background:C.tealGhost,
          border:"1px solid " + C.tealBrd,
          borderRadius:8,
          cursor:"pointer",
          transition:"background 0.15s,border-color 0.15s",
          position:"relative", zIndex:1,
        }}
      >
        <PulseRippleMark size={16} rings={2} />
        <span style={{ fontFamily:C.mono, fontSize:9, fontWeight:700, color:C.teal, letterSpacing:"1.5px", userSelect:"none" }}>
          {label}
        </span>
        <div style={{ width:5, height:5, borderRadius:"50%", background:C.teal, animation:"paNavDot 2.4s ease-in-out infinite", marginLeft:2 }} />
      </button>
    </div>
  );
}

export default function PulseActivators() {
  return <PulseFAB />;
}