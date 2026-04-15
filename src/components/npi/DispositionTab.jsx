// DispositionTab.jsx — keyboard-first rebuild
//
// Hotkeys (inactive when textarea/input focused):
//   D  discharge    A  admit        B  obs (bed/observation)
//   T  transfer     M  ama          W  lwbs
//   E  expired      C  cath_lab     O  or
//   Arrow keys  — grid navigation
//   ⌘+T         — stamp current departure time
//   ⌘+Enter     — advance to handoff
//   Esc         — clear selection
//
// Downstream panels auto-focus first field on open.
// AdmitPanel unit keys: F/O/S/T/I/C/N/P/R/L (active only when no input focused)
// TransferPanel transport keys: A/B/C/H/P
//
// Props:
//   disposition, setDisposition, dispReason, setDispReason, dispTime, setDispTime
//   doorTime, demo, cc, vitals, mdmState, providerName
//   onAdvance, onGoToDischarge, onToast
//
// Constraints: no form, no localStorage, no router, straight quotes only,
//   single react import, border before borderTop/etc.

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { DISPOSITION_OPTS } from "@/components/npi/npiData";
import CapacityAMAModule from "@/components/npi/CapacityAMAModule";

// ── Tokens ────────────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", card:"#0b1e36",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", red:"#ff4444",
};

// ── Hotkey → disposition val ──────────────────────────────────────────────────
const HOTKEYS = {
  d:"discharge", a:"admit",    b:"obs",
  t:"transfer",  m:"ama",      w:"lwbs",
  e:"expired",   c:"cath_lab", o:"or",
};
const VAL_TO_KEY = Object.fromEntries(
  Object.entries(HOTKEYS).map(([k, v]) => [v, k.toUpperCase()])
);

// ── Unit types (admit panel) ──────────────────────────────────────────────────
const UNIT_TYPES = [
  { id:"floor",     label:"Med/Surg Floor",   color:T.teal,   key:"F" },
  { id:"obs",       label:"Observation",       color:T.blue,   key:"O" },
  { id:"stepdown",  label:"Step-Down / IMC",   color:T.gold,   key:"S" },
  { id:"telemetry", label:"Telemetry",          color:T.orange, key:"T" },
  { id:"icu",       label:"ICU",               color:T.coral,  key:"I" },
  { id:"ccu",       label:"CCU / Cardiac",     color:T.red,    key:"C" },
  { id:"nicu",      label:"Neuro ICU",          color:T.purple, key:"N" },
  { id:"picu",      label:"PICU",              color:T.gold,   key:"P" },
  { id:"or_unit",   label:"Operating Room",    color:T.orange, key:"R" },
  { id:"cath",      label:"Cath Lab",          color:T.red,    key:"L" },
];

// ── Transport modes (transfer panel) ──────────────────────────────────────────
const TRANSPORT_MODES = [
  { id:"als",     label:"ALS Ambulance",          key:"A" },
  { id:"bls",     label:"BLS Ambulance",          key:"B" },
  { id:"cctn",    label:"Critical Care Transport", key:"C" },
  { id:"air",     label:"Air / Helicopter",       key:"H" },
  { id:"private", label:"Private Vehicle",        key:"P" },
];

// ── LOS hook ──────────────────────────────────────────────────────────────────
function useLOS(doorTime) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(p => p + 1), 60000);
    return () => clearInterval(id);
  }, []);
  return useMemo(() => {
    if (!doorTime) return null;
    const m = doorTime.match(/(\d{1,2}):(\d{2})/);
    if (!m) return null;
    const d = new Date();
    d.setHours(parseInt(m[1]), parseInt(m[2]), 0, 0);
    const min = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
    const h   = Math.floor(min / 60);
    const mm  = min % 60;
    return { min, display: h > 0 ? `${h}h ${mm}m` : `${mm}m` };
  }, [doorTime, tick]);
}

function losColor(min) {
  if (min === null || min === undefined) return T.teal;
  return min < 180 ? T.teal : min < 300 ? T.gold : T.coral;
}

// ── Keyboard badge ─────────────────────────────────────────────────────────────
function KBD({ k, color }) {
  return (
    <span style={{ fontFamily:"'JetBrains Mono',monospace",
      fontSize:7, fontWeight:700, letterSpacing:1,
      padding:"1px 5px", borderRadius:3,
      border:`1px solid ${color || T.txt4}44`,
      background:`${color || T.txt4}10`,
      color:color || T.txt4 }}>
      {k}
    </span>
  );
}

// ── Pill selector ─────────────────────────────────────────────────────────────
function PillGroup({ options, selected, onSelect }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
      {options.map(opt => {
        const active = selected === opt.id;
        const c      = opt.color || T.blue;
        return (
          <button key={opt.id} onClick={() => onSelect(active ? "" : opt.id)}
            style={{ display:"flex", alignItems:"center", gap:5,
              fontFamily:"'DM Sans',sans-serif", fontWeight:600,
              fontSize:11, padding:"4px 11px", borderRadius:20,
              cursor:"pointer", transition:"all .12s",
              border:`1px solid ${active ? c+"77" : c+"33"}`,
              background:active ? `${c}18` : `${c}08`,
              color:active ? c : T.txt4,
              outline:"none" }}>
            {opt.label}
            {opt.key && <KBD k={opt.key} color={active ? c : null} />}
          </button>
        );
      })}
    </div>
  );
}

// ── Labelled input ────────────────────────────────────────────────────────────
function LabelInput({ label, value, onChange, placeholder, type, fwdRef, autoFocus }) {
  return (
    <div>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
        color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
        marginBottom:4 }}>{label}</div>
      <input ref={fwdRef} type={type || "text"} value={value}
        autoFocus={!!autoFocus}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || ""}
        style={{ width:"100%", padding:"7px 10px",
          background:"rgba(14,37,68,0.75)",
          border:`1px solid ${value
            ? "rgba(42,122,160,0.55)" : "rgba(26,53,85,0.45)"}`,
          borderRadius:7, outline:"none",
          fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt }} />
    </div>
  );
}

// ── Labelled textarea ─────────────────────────────────────────────────────────
function LabelArea({ label, value, onChange, placeholder, rows, accentColor }) {
  return (
    <div>
      {label && (
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
          marginBottom:4 }}>{label}</div>
      )}
      <textarea value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder || ""} rows={rows || 2}
        style={{ width:"100%", resize:"none",
          background:"rgba(8,24,48,0.65)",
          border:`1px solid ${value
            ? (accentColor || T.blue) + "44" : "rgba(26,53,85,0.45)"}`,
          borderRadius:7, padding:"8px 10px",
          color:"var(--npi-txt, #f2f7ff)",
          fontFamily:"'DM Sans',sans-serif", fontSize:12,
          outline:"none", lineHeight:1.55 }} />
    </div>
  );
}

// ── Downstream: Discharge ─────────────────────────────────────────────────────
function DischargePanel({ onGoToDischarge }) {
  return (
    <div style={{ padding:"12px 14px", borderRadius:10,
      background:"linear-gradient(135deg,rgba(0,229,192,0.07),rgba(8,22,40,0.95))",
      border:"1px solid rgba(0,229,192,0.3)" }}>
      <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
        fontSize:13, color:T.teal, marginBottom:4 }}>
        Discharge Instructions
      </div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
        color:T.txt3, lineHeight:1.6, marginBottom:10 }}>
        AI discharge instructions with medication reconciliation, Beers flags,
        return precautions, and follow-up routing.
      </div>
      <button onClick={onGoToDischarge}
        style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700,
          fontSize:12, padding:"7px 18px", borderRadius:8,
          cursor:"pointer", border:"1px solid rgba(0,229,192,0.5)",
          background:"rgba(0,229,192,0.1)", color:T.teal }}>
        Open Smart Discharge →
      </button>
    </div>
  );
}

// ── Downstream: Admit ─────────────────────────────────────────────────────────
function AdmitPanel({ s, set }) {
  const firstRef = useRef(null);

  // Unit hotkeys — active only when no input/textarea is focused
  useEffect(() => {
    const handler = e => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const k = e.key.toUpperCase();
      const match = UNIT_TYPES.find(u => u.key === k);
      if (match) {
        e.preventDefault();
        set("unit", s.unit === match.id ? "" : match.id);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [s.unit, set]);

  useEffect(() => {
    const t = setTimeout(() => firstRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
          marginBottom:6 }}>Admission Unit</div>
        <PillGroup options={UNIT_TYPES} selected={s.unit}
          onSelect={v => set("unit", v)} />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <LabelInput label="Admitting Service" fwdRef={firstRef}
          value={s.service || ""} onChange={v => set("service", v)}
          placeholder="e.g. Cardiology, Hospitalist" autoFocus />
        <LabelInput label="Accepting Physician"
          value={s.physician || ""} onChange={v => set("physician", v)}
          placeholder="Name of accepting provider" />
      </div>
      <LabelArea label="Bed Request Note"
        value={s.bedNote || ""} onChange={v => set("bedNote", v)}
        placeholder="Bed request called at [time] — awaiting [unit] bed"
        accentColor={T.blue} />
      {(s.unit || s.service) && (
        <div style={{ padding:"5px 10px", borderRadius:7,
          background:"rgba(59,158,255,0.07)",
          border:"1px solid rgba(59,158,255,0.28)",
          fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:T.blue, letterSpacing:0.5 }}>
          {[
            s.service   && `Admitting: ${s.service}`,
            s.unit      && `Unit: ${UNIT_TYPES.find(u => u.id===s.unit)?.label}`,
            s.physician && `Accepting: ${s.physician}`,
          ].filter(Boolean).join("  ·  ")}
        </div>
      )}
    </div>
  );
}

// ── Downstream: Transfer ──────────────────────────────────────────────────────
function TransferPanel({ s, set }) {
  const firstRef = useRef(null);

  // Transport hotkeys
  useEffect(() => {
    const handler = e => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const k = e.key.toUpperCase();
      const match = TRANSPORT_MODES.find(t => t.key === k);
      if (match) {
        e.preventDefault();
        set("transport", s.transport === match.id ? "" : match.id);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [s.transport, set]);

  useEffect(() => {
    const t = setTimeout(() => firstRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <LabelInput label="Receiving Facility" fwdRef={firstRef}
          value={s.facility || ""} onChange={v => set("facility", v)}
          placeholder="Hospital name" />
        <LabelInput label="Accepting Physician"
          value={s.physician || ""} onChange={v => set("physician", v)}
          placeholder="Name and specialty" />
        <LabelInput label="Accepting Unit / Service"
          value={s.unit || ""} onChange={v => set("unit", v)}
          placeholder="e.g. Neurosurgery, Cardiac ICU" />
        <LabelInput label="Acceptance Time" type="time"
          value={s.acceptTime || ""} onChange={v => set("acceptTime", v)} />
      </div>
      <div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.txt4, letterSpacing:1.5, textTransform:"uppercase",
          marginBottom:6 }}>Transport Mode</div>
        <PillGroup options={TRANSPORT_MODES} selected={s.transport}
          onSelect={v => set("transport", v)} />
      </div>
      <LabelArea label="Transfer Documentation"
        value={s.notes || ""} onChange={v => set("notes", v)}
        placeholder="Records sent, imaging on disc, medications sent, family notified..."
        accentColor={T.gold} />
      {(s.facility || s.physician) && (
        <div style={{ padding:"5px 10px", borderRadius:7,
          background:"rgba(245,200,66,0.07)",
          border:"1px solid rgba(245,200,66,0.28)",
          fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:T.gold, letterSpacing:0.5 }}>
          {[
            s.facility    && `To: ${s.facility}`,
            s.physician   && `Accepting: ${s.physician}`,
            s.transport   && `Via: ${TRANSPORT_MODES.find(t => t.id===s.transport)?.label}`,
            s.acceptTime  && `Accepted: ${s.acceptTime}`,
          ].filter(Boolean).join("  ·  ")}
        </div>
      )}
    </div>
  );
}

// ── Downstream: Observation ───────────────────────────────────────────────────
function ObsPanel({ s, set }) {
  const firstRef = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => firstRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ padding:"7px 10px", borderRadius:7,
        background:"rgba(59,158,255,0.06)",
        border:"1px solid rgba(59,158,255,0.22)",
        fontFamily:"'DM Sans',sans-serif", fontSize:10,
        color:T.txt4, lineHeight:1.55 }}>
        Observation (23-hour hold) — patient does not meet inpatient criteria.
        Document clinical indication clearly — affects billing and patient rights.
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <LabelInput label="Observation Indication" fwdRef={firstRef}
          value={s.indication || ""} onChange={v => set("indication", v)}
          placeholder="Clinical reason" />
        <LabelInput label="Managing Service"
          value={s.service || ""} onChange={v => set("service", v)}
          placeholder="e.g. Medicine, Cardiology" />
      </div>
      <LabelArea label="Observation Goals"
        value={s.goals || ""} onChange={v => set("goals", v)}
        placeholder="Serial troponins, monitor for arrhythmia, reassess after IV fluids..."
        accentColor={T.blue} />
    </div>
  );
}

// ── Downstream: LWBS ──────────────────────────────────────────────────────────
function LWBSPanel({ s, set }) {
  const firstRef = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => firstRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ padding:"7px 10px", borderRadius:7,
        background:"rgba(255,107,107,0.06)",
        border:"1px solid rgba(255,107,107,0.25)",
        fontFamily:"'DM Sans',sans-serif", fontSize:10,
        color:T.coral, lineHeight:1.55 }}>
        ⚠ Document any attempted contact before marking LWBS.
        Callback time must be recorded — high medicolegal risk.
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <LabelInput label="Last Contact Time" type="time" fwdRef={firstRef}
          value={s.lastContactTime || ""}
          onChange={v => set("lastContactTime", v)} />
        <LabelInput label="Callback Attempted" type="time"
          value={s.callbackTime || ""}
          onChange={v => set("callbackTime", v)} />
      </div>
      <LabelArea label="Documentation"
        value={s.notes || ""} onChange={v => set("notes", v)}
        placeholder="Patient left without notification. Callback attempted at [time]. Triage level and vitals documented."
        accentColor={T.coral} />
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function DispositionTab({
  disposition, setDisposition,
  dispReason,  setDispReason,
  dispTime,    setDispTime,
  doorTime,
  demo, cc, vitals, mdmState, providerName,
  onAdvance, onGoToDischarge, onToast,
}) {
  // Per-disposition structured state
  const [admitS,    setAdmitSRaw]    = useState({ unit:"", service:"", physician:"", bedNote:"" });
  const [transferS, setTransferSRaw] = useState({ facility:"", physician:"", unit:"", transport:"", acceptTime:"", notes:"" });
  const [obsS,      setObsSRaw]      = useState({ indication:"", service:"", goals:"" });
  const [lwbsS,     setLwbsSRaw]     = useState({ lastContactTime:"", callbackTime:"", notes:"" });
  const setAdmit    = useCallback((k,v) => setAdmitSRaw(p    => ({ ...p, [k]:v })), []);
  const setTransfer = useCallback((k,v) => setTransferSRaw(p => ({ ...p, [k]:v })), []);
  const setObs      = useCallback((k,v) => setObsSRaw(p      => ({ ...p, [k]:v })), []);
  const setLwbs     = useCallback((k,v) => setLwbsSRaw(p     => ({ ...p, [k]:v })), []);
  const [showAMA,   setShowAMA]      = useState(false);

  // Grid focus index for arrow-key nav
  const [focusIdx,  setFocusIdx]  = useState(-1);
  const cardRefs  = useRef([]);
  const reasonRef = useRef(null);
  const sectionRef= useRef(null);

  const opts     = DISPOSITION_OPTS || [];
  const selected = opts.find(d => d.val === disposition);
  const los      = useLOS(doorTime);
  const lc       = los ? losColor(los.min) : T.txt4;

  // ── Stamp time ──────────────────────────────────────────────────────────────
  const stampTime = useCallback(() => {
    const n  = new Date();
    const hh = String(n.getHours()).padStart(2,"0");
    const mm = String(n.getMinutes()).padStart(2,"0");
    setDispTime(`${hh}:${mm}`);
    onToast?.("Departure time stamped", "success");
  }, [setDispTime, onToast]);

  // ── Select disposition ──────────────────────────────────────────────────────
  const handleSelect = useCallback((val) => {
    const next = disposition === val ? "" : val;
    setDisposition(next);
    if (next === "ama") setShowAMA(true);
    // Auto-focus reason textarea after downstream panel renders
    if (next) {
      setTimeout(() => reasonRef.current?.focus(), 80);
    }
  }, [disposition, setDisposition]);

  // ── Global keydown ───────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = e => {
      const tag    = document.activeElement?.tagName;
      const inText = tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT";

      // ⌘+Enter → advance
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault(); onAdvance?.(); return;
      }
      // ⌘+T → stamp
      if ((e.metaKey || e.ctrlKey) && e.key === "t") {
        e.preventDefault(); stampTime(); return;
      }
      // Esc → clear
      if (e.key === "Escape" && !inText) {
        e.preventDefault(); setDisposition(""); setFocusIdx(-1); return;
      }

      if (inText) return;

      // Single-letter disposition hotkeys
      if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const val = HOTKEYS[e.key.toLowerCase()];
        if (val) {
          e.preventDefault();
          if (opts.find(o => o.val === val)) {
            handleSelect(val);
            const idx = opts.findIndex(o => o.val === val);
            if (idx >= 0) {
              setFocusIdx(idx);
              cardRefs.current[idx]?.focus();
            }
          }
          return;
        }
      }

      // Arrow key grid navigation
      if (["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)) {
        e.preventDefault();
        const w    = sectionRef.current?.offsetWidth || 600;
        const cols = Math.max(1, Math.floor(w / 160));
        const len  = opts.length;
        let next   = focusIdx < 0 ? 0 : focusIdx;
        if (e.key === "ArrowRight") next = Math.min(len-1, next+1);
        if (e.key === "ArrowLeft")  next = Math.max(0, next-1);
        if (e.key === "ArrowDown")  next = Math.min(len-1, next+cols);
        if (e.key === "ArrowUp")    next = Math.max(0, next-cols);
        setFocusIdx(next);
        cardRefs.current[next]?.focus();
        return;
      }

      // Enter/Space on focused card
      if ((e.key === "Enter" || e.key === " ") && focusIdx >= 0) {
        e.preventDefault();
        const opt = opts[focusIdx];
        if (opt) handleSelect(opt.val);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [opts, focusIdx, disposition, handleSelect, stampTime, onAdvance, setDisposition]);

  // Panel routing
  const showDischarge = disposition === "discharge";
  const showAdmit     = disposition === "admit";
  const showObs       = disposition === "obs";
  const showTransfer  = disposition === "transfer";
  const showAMAPanel  = disposition === "ama";
  const showLWBS      = disposition === "lwbs";

  return (
    <div ref={sectionRef} tabIndex={-1}
      style={{ display:"flex", flexDirection:"column", gap:16,
        fontFamily:"'DM Sans',sans-serif", color:T.txt,
        outline:"none" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center",
        justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:"var(--npi-txt4)", letterSpacing:1.5,
          textTransform:"uppercase" }}>
          Patient Disposition
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8,
          flexWrap:"wrap" }}>

          {/* Hint strip */}
          <div style={{ display:"flex", alignItems:"center", gap:5,
            padding:"3px 9px", borderRadius:6,
            background:"rgba(42,79,122,0.1)",
            border:"1px solid rgba(42,79,122,0.3)" }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:8, color:T.txt4, letterSpacing:1 }}>
              D/A/B/T/M/W
            </span>
            <span style={{ color:T.txt4, fontSize:9, margin:"0 1px" }}>·</span>
            <KBD k="⌘T" color={T.txt4} />
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:8, color:T.txt4 }}>stamp</span>
            <span style={{ color:T.txt4, fontSize:9, margin:"0 1px" }}>·</span>
            <KBD k="⌘↵" color={T.txt4} />
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:8, color:T.txt4 }}>advance</span>
            <span style={{ color:T.txt4, fontSize:9, margin:"0 1px" }}>·</span>
            <KBD k="Esc" color={T.txt4} />
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:8, color:T.txt4 }}>clear</span>
          </div>

          {/* LOS chip */}
          {los && (
            <div style={{ display:"flex", alignItems:"center", gap:5,
              padding:"4px 11px", borderRadius:20,
              background:`${lc}0d`, border:`1px solid ${lc}35` }}>
              <div style={{ width:6, height:6, borderRadius:"50%",
                background:lc, flexShrink:0 }} />
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:9, fontWeight:700, color:lc, letterSpacing:1 }}>
                LOS {los.display}
              </span>
              {doorTime && (
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:8, color:T.txt4 }}>
                  Door {doorTime}
                </span>
              )}
              {los.min >= 300 && (
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:8, color:T.coral, letterSpacing:1 }}>
                  · LONG STAY
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Disposition grid ─────────────────────────────────────────────────── */}
      <div style={{ display:"grid",
        gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",
        gap:8 }}>
        {opts.map((opt, idx) => {
          const isSel = disposition === opt.val;
          const isFoc = focusIdx === idx;
          const hk    = VAL_TO_KEY[opt.val];
          return (
            <button key={opt.val}
              ref={el => { cardRefs.current[idx] = el; }}
              onClick={() => handleSelect(opt.val)}
              onFocus={() => setFocusIdx(idx)}
              style={{ position:"relative", padding:"12px 10px",
                borderRadius:10, cursor:"pointer",
                textAlign:"center", transition:"all .15s",
                background: isSel
                  ? `linear-gradient(135deg,${opt.color}22,${opt.color}08)`
                  : isFoc ? "rgba(42,79,122,0.22)" : "rgba(14,37,68,0.7)",
                border: isSel
                  ? `1px solid ${opt.color}88`
                  : isFoc ? "1px solid rgba(59,158,255,0.5)"
                  : "1px solid rgba(26,53,85,0.55)",
                borderLeft:`3px solid ${isSel
                  ? opt.color : isFoc ? T.blue : "transparent"}`,
                boxShadow: isSel ? `0 0 14px ${opt.color}15` : "none",
                color: isSel ? opt.color : "var(--npi-txt3)",
                outline:"none" }}>

              {/* Hotkey badge */}
              {hk && (
                <span style={{ position:"absolute", top:5, right:6 }}>
                  <KBD k={hk} color={isSel ? opt.color : null} />
                </span>
              )}

              <div style={{ fontSize:20, marginBottom:5 }}>{opt.icon}</div>
              <div style={{ fontSize:12, fontWeight:700,
                color:isSel ? opt.color : "var(--npi-txt2)" }}>
                {opt.label}
              </div>
              {opt.desc && (
                <div style={{ fontSize:9, marginTop:2, opacity:.8,
                  color:isSel ? opt.color : "var(--npi-txt4)",
                  fontFamily:"'JetBrains Mono',monospace",
                  letterSpacing:0.5 }}>
                  {opt.desc}
                </div>
              )}
              {isSel && (
                <div style={{ height:2, width:18, borderRadius:1,
                  background:opt.color, margin:"5px auto 0" }} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Post-selection panel ─────────────────────────────────────────────── */}
      {disposition && (
        <div style={{ padding:"14px 16px", borderRadius:12,
          background:"rgba(8,22,40,0.75)",
          border:`1px solid ${selected?.color
            ? selected.color + "40" : "rgba(26,53,85,0.5)"}`,
          borderTop:`3px solid ${selected?.color || T.teal}`,
          display:"flex", flexDirection:"column", gap:12 }}>

          {/* Panel header */}
          <div style={{ display:"flex", alignItems:"center",
            gap:8, flexWrap:"wrap" }}>
            <span style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:14,
              color:selected?.color || T.teal }}>
              {selected?.icon} {selected?.label}
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:8, color:T.txt4, letterSpacing:1.5,
              textTransform:"uppercase" }}>
              {showAdmit && "— Admission Details"}
              {showObs   && "— Observation Details"}
              {showTransfer && "— Transfer Documentation"}
              {showDischarge && "— Discharge Instructions"}
              {showAMAPanel && "— AMA & Capacity"}
              {showLWBS && "— LWBS Documentation"}
            </span>
            <span style={{ marginLeft:"auto",
              fontFamily:"'JetBrains Mono',monospace",
              fontSize:8, color:T.txt4 }}>
              <KBD k="Esc" color={T.txt4} /> to clear
            </span>
          </div>

          {/* Reason textarea */}
          <LabelArea
            label={disposition === "ama"
              ? "Clinical Context & Risk Discussion"
              : "Reason / Notes"}
            value={dispReason}
            onChange={setDispReason}
            rows={3}
            accentColor={selected?.color || T.teal}
            placeholder={
              disposition === "admit"
                ? "Reason for admission — clinical indication..."
              : disposition === "transfer"
                ? "Reason for transfer — clinical necessity..."
              : disposition === "discharge"
                ? "Discharge summary notes..."
              : disposition === "ama"
                ? "Patient expressed desire to leave AMA. Risks discussed including..."
              : disposition === "lwbs"
                ? "Patient left without notification at approximately..."
              : `Reason for ${selected?.label || disposition}...`
            } />

          {/* Departure time */}
          <div style={{ display:"flex", alignItems:"flex-end",
            gap:10, flexWrap:"wrap" }}>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
                marginBottom:4, display:"flex", alignItems:"center", gap:6 }}>
                Departure Time
                <KBD k="⌘T" color={T.txt4} />
              </div>
              <input type="time" value={dispTime}
                onChange={e => setDispTime(e.target.value)}
                style={{ background:"rgba(8,24,48,0.65)",
                  border:`1px solid ${dispTime
                    ? (selected?.color || T.teal)+"55"
                    : "rgba(26,53,85,0.55)"}`,
                  borderRadius:7, padding:"6px 10px",
                  color:dispTime
                    ? (selected?.color || T.teal)
                    : "var(--npi-txt4)",
                  fontFamily:"'JetBrains Mono',monospace",
                  fontSize:14, fontWeight:700, outline:"none" }} />
            </div>
            {!dispTime && (
              <button onClick={stampTime}
                style={{ padding:"6px 13px", borderRadius:7,
                  cursor:"pointer", marginBottom:1,
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600,
                  fontSize:11,
                  border:"1px solid rgba(42,79,122,0.45)",
                  background:"rgba(42,79,122,0.12)", color:T.txt4 }}>
                Stamp Now
              </button>
            )}
            {dispTime && (
              <div style={{ display:"flex", alignItems:"center", gap:5,
                padding:"4px 11px", borderRadius:20, marginBottom:1,
                background:`${selected?.color || T.teal}0d`,
                border:`1px solid ${selected?.color || T.teal}30` }}>
                <div style={{ width:5, height:5, borderRadius:"50%",
                  background:selected?.color || T.teal }} />
                <span style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:9, color:selected?.color || T.teal }}>
                  {selected?.label} at {dispTime}
                  {los && ` · LOS ${los.display}`}
                </span>
              </div>
            )}
          </div>

          {/* Downstream panel divider */}
          {(showDischarge || showAdmit || showObs ||
            showTransfer || showAMAPanel || showLWBS) && (
            <div style={{ borderTop:"1px solid rgba(26,53,85,0.35)" }} />
          )}

          {showDischarge && onGoToDischarge && (
            <DischargePanel onGoToDischarge={onGoToDischarge} />
          )}
          {showAdmit && (
            <AdmitPanel s={admitS} set={setAdmit} />
          )}
          {showObs && (
            <ObsPanel s={obsS} set={setObs} />
          )}
          {showTransfer && (
            <TransferPanel s={transferS} set={setTransfer} />
          )}
          {showLWBS && (
            <LWBSPanel s={lwbsS} set={setLwbs} />
          )}
          {showAMAPanel && (
            <div>
              <div style={{ display:"flex", alignItems:"center",
                justifyContent:"space-between", marginBottom:8 }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace",
                  fontSize:8, color:T.coral, letterSpacing:1.5,
                  textTransform:"uppercase" }}>
                  AMA & Capacity Documentation
                </div>
                <button onClick={() => setShowAMA(p => !p)}
                  style={{ fontFamily:"'JetBrains Mono',monospace",
                    fontSize:8, padding:"3px 10px", borderRadius:6,
                    cursor:"pointer", letterSpacing:1,
                    textTransform:"uppercase",
                    border:"1px solid rgba(42,79,122,0.4)",
                    background:"transparent", color:T.txt4 }}>
                  {showAMA ? "Collapse" : "Expand"}
                </button>
              </div>
              {showAMA && (
                <CapacityAMAModule embedded
                  demo={demo} cc={cc} vitals={vitals}
                  mdmState={mdmState} providerName={providerName}
                  onToast={onToast} />
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Advance button ────────────────────────────────────────────────────── */}
      {onAdvance && (
        <div style={{ display:"flex", justifyContent:"flex-end",
          alignItems:"center", gap:9, marginTop:4 }}>
          <KBD k="⌘↵" color={T.txt4} />
          <button onClick={onAdvance}
            style={{ padding:"9px 22px", borderRadius:9,
              background:"linear-gradient(135deg,#00e5c0,#00b4d8)",
              border:"none", color:"#050f1e",
              fontFamily:"'DM Sans',sans-serif",
              fontWeight:700, fontSize:13, cursor:"pointer" }}>
            Continue to Handoff &#9654;
          </button>
        </div>
      )}
    </div>
  );
}