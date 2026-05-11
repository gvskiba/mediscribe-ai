// StrokeHub.jsx — Notrya Stroke Protocol Hub
// ALL TABS keyboard-first. Arrow nav · Space/Enter toggle · 0-9 score · U untestable
// No router · no localStorage · no form/alert · straight quotes · <1600 lines

import { useState, useCallback, useRef, useEffect } from "react";
import { StrokeQualityLog } from "@/api/entities";

// ─── PRINT CSS ────────────────────────────────────────────────────────────────
const PRINT_CSS = `
  @media print {
    body { background: #fff !important; margin: 0; padding: 0; }
    .sh-no-print { display: none !important; }
  }
  @media screen { }
`;

// ─── KEYBOARD HINT BAR ────────────────────────────────────────────────────────
function KbHints({ hints }) {
  return (
    <div style={{
      display: "flex", gap: 14, flexWrap: "wrap", padding: "10px 0 2px",
      borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: 16,
    }}>
      {hints.map(({ key, label }) => (
        <span key={key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#4b5563" }}>
          <kbd style={{
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 5, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace",
            fontSize: 10, padding: "2px 6px",
          }}>{key}</kbd>
          {label}
        </span>
      ))}
    </div>
  );
}

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const S = {
  wrap: {
    background: "linear-gradient(160deg,rgba(8,14,36,0.99) 0%,rgba(12,22,52,0.99) 60%,rgba(10,20,44,0.99) 100%)",
    minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", color: "#e8edf5",
    padding: "0 0 64px 0",
  },
  header: {
    background: "rgba(255,255,255,0.03)",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    padding: "0 28px",
    display: "flex", alignItems: "stretch", gap: 0, minHeight: 56,
  },
  backBtn: {
    background: "transparent", border: "none",
    color: "#475569", cursor: "pointer", fontSize: 13,
    padding: "0 16px 0 0", transition: "color .15s", display: "flex", alignItems: "center", gap: 6,
  },
  title: {
    fontFamily: "'Playfair Display',serif", fontSize: 19, fontWeight: 700,
    color: "#f1f5f9", letterSpacing: "-0.3px", display: "flex", alignItems: "center",
  },
  badge: {
    background: "rgba(239,68,68,0.16)", border: "1px solid rgba(239,68,68,0.32)",
    borderRadius: 20, color: "#fca5a5", fontSize: 10, fontWeight: 700,
    padding: "3px 10px", letterSpacing: "0.6px", textTransform: "uppercase",
    display: "flex", alignItems: "center", margin: "auto 0 auto 8px",
  },
  tabBar: {
    display: "flex", gap: 2, padding: "12px 28px 0",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(0,0,0,0.15)", overflowX: "auto",
  },
  tab: (active, accentBg, accentBorder, accentText) => ({
    background: active ? (accentBg || "rgba(20,184,166,0.14)") : "transparent",
    border: active ? ("1px solid " + (accentBorder || "rgba(20,184,166,0.35)")) : "1px solid transparent",
    borderBottom: active ? "1px solid rgba(8,14,36,0.99)" : "1px solid transparent",
    borderRadius: "8px 8px 0 0",
    color: active ? (accentText || "#2dd4bf") : "#475569",
    cursor: "pointer", fontSize: 12, fontWeight: active ? 700 : 500,
    padding: "8px 16px", transition: "all .15s", marginBottom: -1,
    whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6,
  }),
  body: { padding: "22px 28px", maxWidth: 900, margin: "0 auto" },
  card: {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 12, padding: "18px 20px", marginBottom: 14,
  },
  cardTitle: {
    color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: "1px",
    textTransform: "uppercase", marginBottom: 12,
  },
  focusRow: (focused) => ({
    display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 10px",
    borderRadius: 8, cursor: "pointer", transition: "background .1s",
    background: focused ? "rgba(20,184,166,0.1)" : "transparent",
    border: focused ? "1px solid rgba(20,184,166,0.3)" : "1px solid transparent",
    marginBottom: 2,
  }),
  checkbox: (checked, color) => {
    const c = color || "#2dd4bf";
    return {
      width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
      background: checked ? c + "30" : "rgba(255,255,255,0.05)",
      border: "2px solid " + (checked ? c : "rgba(255,255,255,0.15)"),
      display: "flex", alignItems: "center", justifyContent: "center",
    };
  },
  input: {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 8, color: "#e8edf5", fontSize: 14, padding: "8px 12px",
    outline: "none", fontFamily: "'JetBrains Mono',monospace",
  },
};

// ─── NIHSS DATA ───────────────────────────────────────────────────────────────
const NIHSS_ITEMS = [
  { id: "1a", label: "1a. Level of Consciousness", max: 3, opts: ["Alert","Not alert, arousable","Not alert, obtunded","Unresponsive / coma"] },
  { id: "1b", label: "1b. LOC Questions (month / age)", max: 2, opts: ["Both correct","One correct","Neither correct"] },
  { id: "1c", label: "1c. LOC Commands (eyes / grip)", max: 2, opts: ["Both correct","One correct","Neither correct"] },
  { id: "2",  label: "2. Best Gaze", max: 2, opts: ["Normal","Partial gaze palsy","Forced deviation"] },
  { id: "3",  label: "3. Visual Fields", max: 3, opts: ["No visual loss","Partial hemianopia","Complete hemianopia","Bilateral / cortical blindness"] },
  { id: "4",  label: "4. Facial Palsy", max: 3, opts: ["Normal","Minor paralysis","Partial paralysis","Complete paralysis"] },
  { id: "5a", label: "5a. Motor Arm — Left",  max: 4, opts: ["No drift","Drift down","Some effort vs gravity","No effort vs gravity","No movement"], un: true },
  { id: "5b", label: "5b. Motor Arm — Right", max: 4, opts: ["No drift","Drift down","Some effort vs gravity","No effort vs gravity","No movement"], un: true },
  { id: "6a", label: "6a. Motor Leg — Left",  max: 4, opts: ["No drift","Drift down","Some effort vs gravity","No effort vs gravity","No movement"], un: true },
  { id: "6b", label: "6b. Motor Leg — Right", max: 4, opts: ["No drift","Drift down","Some effort vs gravity","No effort vs gravity","No movement"], un: true },
  { id: "7",  label: "7. Limb Ataxia", max: 2, opts: ["Absent","Present in 1 limb","Present in 2 limbs"], un: true },
  { id: "8",  label: "8. Sensory", max: 2, opts: ["Normal","Mild-moderate loss","Severe / total loss"] },
  { id: "9",  label: "9. Best Language", max: 3, opts: ["No aphasia","Mild-moderate aphasia","Severe aphasia","Mute / global aphasia"] },
  { id: "10", label: "10. Dysarthria", max: 2, opts: ["Normal","Mild-moderate slurring","Severe / unintelligible"], un: true },
  { id: "11", label: "11. Extinction / Inattention", max: 2, opts: ["Normal","Inattention to 1 modality","Profound hemi-inattention"] },
];

const nihssSeverity = (n) => {
  if (n === 0)  return { label: "No Stroke",       color: "#4ade80" };
  if (n <= 4)   return { label: "Minor",            color: "#86efac" };
  if (n <= 15)  return { label: "Moderate",         color: "#fbbf24" };
  if (n <= 20)  return { label: "Moderate-Severe",  color: "#fb923c" };
  return               { label: "Severe",           color: "#f87171" };
};

// ─── NIHSS TAB ────────────────────────────────────────────────────────────────
function NIHSSTab({ nihss, setNihss }) {
  const [focusIdx, setFocusIdx] = useState(0);
  const panelRef = useRef(null);
  useEffect(() => { panelRef.current?.focus(); }, []);

  const score = NIHSS_ITEMS.reduce((s, item) => {
    const v = nihss[item.id];
    return (!v || v === "UN") ? s : s + parseInt(v, 10);
  }, 0);
  const sev = nihssSeverity(score);

  const record = useCallback((id, val) => {
    setNihss(prev => ({ ...prev, [id]: val }));
    setFocusIdx(i => Math.min(i + 1, NIHSS_ITEMS.length - 1));
  }, [setNihss]);

  const handleKey = useCallback((e) => {
    const item = NIHSS_ITEMS[focusIdx];
    if (!item) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setFocusIdx(i => Math.min(i + 1, NIHSS_ITEMS.length - 1)); return; }
    if (e.key === "ArrowUp")   { e.preventDefault(); setFocusIdx(i => Math.max(i - 1, 0)); return; }
    if (e.key === "Backspace") { setNihss(p => { const n = { ...p }; delete n[item.id]; return n; }); return; }
    if ((e.key === "u" || e.key === "U") && item.un) { record(item.id, "UN"); return; }
    const n = parseInt(e.key, 10);
    if (!isNaN(n) && n >= 0 && n <= item.max) { e.preventDefault(); record(item.id, String(n)); }
  }, [focusIdx, record, setNihss]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <div style={{
          background: sev.color + "15", border: "1px solid " + sev.color + "40",
          borderRadius: 10, padding: "10px 18px", textAlign: "center", minWidth: 80,
        }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 28, fontWeight: 700, color: sev.color }}>{score}</div>
          <div style={{ color: sev.color, fontSize: 11, fontWeight: 700, marginTop: 2 }}>{sev.label}</div>
        </div>
        <div style={{ color: "#64748b", fontSize: 12 }}>
          {NIHSS_ITEMS.filter(i => nihss[i.id] !== undefined).length} / {NIHSS_ITEMS.length} scored
        </div>
        <button style={{
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 7, color: "#64748b", cursor: "pointer", fontSize: 12,
          padding: "5px 12px", marginLeft: "auto",
        }} onClick={() => setNihss({})}>Reset</button>
      </div>

      <div ref={panelRef} tabIndex={0} onKeyDown={handleKey} style={{ outline: "none" }}>
        {NIHSS_ITEMS.map((item, idx) => {
          const val = nihss[item.id];
          const focused = idx === focusIdx;
          return (
            <div key={item.id} onClick={() => setFocusIdx(idx)} style={S.focusRow(focused)}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: focused ? "#e2e8f0" : "#94a3b8", fontWeight: focused ? 600 : 400 }}>
                    {item.label}
                  </span>
                  {val !== undefined && (
                    <span style={{
                      background: "rgba(20,184,166,0.2)", border: "1px solid rgba(20,184,166,0.4)",
                      borderRadius: 6, color: "#2dd4bf", fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 12, fontWeight: 700, padding: "2px 10px",
                    }}>{val} {val !== "UN" ? "— " + item.opts[parseInt(val, 10)] : "Untestable"}</span>
                  )}
                </div>
                {focused && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                    {item.opts.map((opt, oi) => (
                      <button key={oi}
                        onClick={(e) => { e.stopPropagation(); record(item.id, String(oi)); }}
                        style={{
                          background: val === String(oi) ? "rgba(20,184,166,0.2)" : "rgba(255,255,255,0.05)",
                          border: "1px solid " + (val === String(oi) ? "rgba(20,184,166,0.5)" : "rgba(255,255,255,0.1)"),
                          borderRadius: 6, color: val === String(oi) ? "#2dd4bf" : "#94a3b8",
                          cursor: "pointer", fontSize: 12, padding: "4px 10px",
                        }}>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", color: "#64748b", marginRight: 5 }}>{oi}</span>
                        {opt}
                      </button>
                    ))}
                    {item.un && (
                      <button onClick={(e) => { e.stopPropagation(); record(item.id, "UN"); }}
                        style={{
                          background: val === "UN" ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.05)",
                          border: "1px solid " + (val === "UN" ? "rgba(251,191,36,0.4)" : "rgba(255,255,255,0.1)"),
                          borderRadius: 6, color: val === "UN" ? "#fbbf24" : "#64748b",
                          cursor: "pointer", fontSize: 12, padding: "4px 10px",
                        }}>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", marginRight: 5 }}>U</span>Untestable
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <KbHints hints={[
        { key: "↑ ↓", label: "navigate items" },
        { key: "0 – 4", label: "score" },
        { key: "U", label: "untestable" },
        { key: "⌫", label: "clear score" },
      ]} />
    </div>
  );
}

// ─── WORKUP TAB ───────────────────────────────────────────────────────────────
const WORKUP_WINDOWS = [
  { label: "0 – 10 min", color: "#f87171", tasks: [
    "Stroke code activated",
    "IV access — 2 large bore",
    "12-lead ECG obtained",
    "Fingerstick glucose",
    "Vitals: BP both arms, SpO2, HR, temp",
    "NIHSS initiated",
    "CT head ordered (non-contrast)",
  ]},
  { label: "0 – 25 min", color: "#fb923c", tasks: [
    "CT head completed and read",
    "Labs: CBC, BMP, PT/INR, PTT, type & screen",
    "Troponin + BNP sent",
    "NPO status confirmed",
    "Last known well time documented",
    "Pregnancy test if applicable",
  ]},
  { label: "25 – 60 min", color: "#fbbf24", tasks: [
    "CTA head/neck or CT perfusion",
    "Neurology at bedside",
    "tPA eligibility complete",
    "Informed consent obtained",
    "Family contacted",
    "Foley placed if tPA planned",
  ]},
  { label: "60 – 120 min", color: "#4ade80", tasks: [
    "MRI brain (if CT non-diagnostic)",
    "Telemetry established",
    "BP goal documented",
    "Neurosurgery / IR notified if LVO",
    "ICU / stroke unit bed requested",
    "tPA given or decision documented",
  ]},
];

const WORKUP_FLAT = WORKUP_WINDOWS.flatMap((w, wi) =>
  w.tasks.map((task, ti) => ({ key: wi + "-" + ti, task, window: w.label, color: w.color, isFirst: ti === 0 }))
);

function WorkupTab({ checked, setChecked }) {
  const [focusIdx, setFocusIdx] = useState(0);
  const [times, setTimes] = useState({});
  const panelRef = useRef(null);
  useEffect(() => { panelRef.current?.focus(); }, []);

  const toggle = useCallback((key) => {
    const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setChecked(prev => {
      if (prev[key]) { const n = { ...prev }; delete n[key]; return n; }
      setTimes(t => ({ ...t, [key]: now }));
      return { ...prev, [key]: true };
    });
  }, [setChecked]);

  const handleKey = useCallback((e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setFocusIdx(i => Math.min(i + 1, WORKUP_FLAT.length - 1)); return; }
    if (e.key === "ArrowUp")   { e.preventDefault(); setFocusIdx(i => Math.max(i - 1, 0)); return; }
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      const item = WORKUP_FLAT[focusIdx];
      if (item) { toggle(item.key); setFocusIdx(i => Math.min(i + 1, WORKUP_FLAT.length - 1)); }
    }
    if (e.key === "Backspace") {
      const item = WORKUP_FLAT[focusIdx];
      if (item) setChecked(p => { const n = { ...p }; delete n[item.key]; return n; });
    }
  }, [focusIdx, toggle, setChecked]);

  const done  = Object.keys(checked).length;
  const total = WORKUP_FLAT.length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <div style={{
          background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.3)",
          borderRadius: 10, padding: "8px 16px",
        }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 20, fontWeight: 700, color: "#2dd4bf" }}>{done}</span>
          <span style={{ color: "#64748b", fontSize: 12 }}> / {total}</span>
        </div>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 6, height: 6, overflow: "hidden" }}>
          <div style={{ width: (done / total * 100) + "%", height: "100%",
            background: "linear-gradient(90deg,#2dd4bf,#38bdf8)", transition: "width .3s" }} />
        </div>
        <button style={{
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 7, color: "#64748b", cursor: "pointer", fontSize: 12, padding: "5px 12px",
        }} onClick={() => { setChecked({}); setTimes({}); }}>Reset</button>
      </div>

      <div ref={panelRef} tabIndex={0} onKeyDown={handleKey} style={{ outline: "none" }}>
        {WORKUP_FLAT.map((item, idx) => {
          const focused = idx === focusIdx;
          const isDone = !!checked[item.key];
          return (
            <div key={item.key}>
              {item.isFirst && (
                <div style={{
                  display: "inline-flex", background: item.color + "15",
                  border: "1px solid " + item.color + "40", borderRadius: 20,
                  color: item.color, fontSize: 10, fontWeight: 700, letterSpacing: "0.5px",
                  padding: "3px 12px", margin: "10px 0 6px",
                }}>{item.window}</div>
              )}
              <div onClick={() => { setFocusIdx(idx); toggle(item.key); }} style={S.focusRow(focused)}>
                <div style={S.checkbox(isDone)}>
                  {isDone && <span style={{ color: "#2dd4bf", fontSize: 11 }}>✓</span>}
                </div>
                <span style={{ fontSize: 13, color: isDone ? "#4b5563" : "#94a3b8", flex: 1,
                  textDecoration: isDone ? "line-through" : "none" }}>
                  {item.task}
                </span>
                {isDone && times[item.key] && (
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#4b5563" }}>
                    {times[item.key]}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <KbHints hints={[
        { key: "↑ ↓", label: "navigate" },
        { key: "Space / Enter", label: "check + advance" },
        { key: "⌫", label: "uncheck" },
      ]} />
    </div>
  );
}

// ─── TREATMENT TAB ────────────────────────────────────────────────────────────
const INCL_ITEMS = [
  "Ischemic stroke with measurable deficit (NIHSS >= 4 or significant deficit)",
  "CT head shows no hemorrhage",
  "Symptom onset < 3h (or < 4.5h if extended criteria met)",
  "Age >= 18 years",
  "Consent obtained from patient or surrogate",
];
const EXCL_ABS = [
  "Intracranial hemorrhage on CT",
  "BP > 185/110 after treatment (unable to stabilize)",
  "Active internal bleeding (not menses)",
  "Platelets < 100,000 / mm3",
  "INR > 1.7 or PT > 15 sec",
  "Glucose < 50 or > 400 (uncorrected)",
  "Intracranial / spinal surgery < 3 months",
  "Head trauma or prior stroke < 3 months",
  "History of intracranial hemorrhage",
  "Intracranial neoplasm, AVM, or aneurysm",
  "IV / SC heparin within 48h with elevated aPTT",
  "Direct thrombin or Xa inhibitor within 48h",
];
const EXCL_REL = [
  "Minor / rapidly improving symptoms",
  "Seizure at onset with postictal deficits",
  "Major surgery or trauma < 14 days",
  "GI or urinary hemorrhage < 21 days",
  "Arterial puncture non-compressible site < 7 days",
  "Age > 80 (3-4.5h window only)",
  "NIHSS > 25 (3-4.5h window only)",
  "Diabetes + prior stroke (3-4.5h only)",
  "Antiplatelet use — weigh risk/benefit",
];

const TX_FLAT = [
  ...INCL_ITEMS.map((text, i) => ({ section: "incl", idx: i, text })),
  ...EXCL_ABS.map((text,  i) => ({ section: "abs",  idx: i, text })),
  ...EXCL_REL.map((text,  i) => ({ section: "rel",  idx: i, text })),
];

const BP_TABLE = [
  { condition: "Pre-tPA — BP > 185/110", target: "Labetalol 10-20 mg IV x1-2 or Nicardipine 5 mg/hr", goal: "< 185/110" },
  { condition: "Post-tPA (first 24h)",   target: "Labetalol or Nicardipine per protocol",              goal: "< 180/105" },
  { condition: "Ischemic — no tPA",      target: "Permissive — treat only if > 220/120",               goal: "< 220/120" },
  { condition: "Hemorrhagic transform",  target: "Aggressive reduction",                                goal: "SBP < 140" },
  { condition: "Pre-thrombectomy",       target: "Maintain, avoid hypotension",                         goal: "SBP >= 140" },
];

const SEC_META = {
  incl: { label: "Inclusion — all must be met",          color: "#4ade80" },
  abs:  { label: "Absolute Exclusions — none present",   color: "#f87171" },
  rel:  { label: "Relative Exclusions — 3-4.5h window", color: "#fbbf24" },
};

function TreatmentTab({ demo, vitals, nihss, txChecked, setTxChecked, weight, setWeight }) {
  const [focusIdx, setFocusIdx] = useState(0);
  const [inputActive, setInputActive] = useState(false);
  const checked = txChecked;
  const setChecked = setTxChecked;
  const panelRef = useRef(null);
  const weightRef = useRef(null);
  useEffect(() => { panelRef.current?.focus(); }, []);

  const toggle = useCallback((section, idx) => {
    const key = section + "-" + idx;
    setChecked(p => ({ ...p, [key]: !p[key] }));
  }, []);

  const handleKey = useCallback((e) => {
    if (inputActive) { if (e.key === "Escape") { setInputActive(false); panelRef.current?.focus(); } return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setFocusIdx(i => Math.min(i + 1, TX_FLAT.length - 1)); return; }
    if (e.key === "ArrowUp")   { e.preventDefault(); setFocusIdx(i => Math.max(i - 1, 0)); return; }
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      const row = TX_FLAT[focusIdx];
      if (row) { toggle(row.section, row.idx); setFocusIdx(i => Math.min(i + 1, TX_FLAT.length - 1)); }
    }
    if (e.key === "w" || e.key === "W") { e.preventDefault(); setInputActive(true); weightRef.current?.focus(); }
  }, [focusIdx, toggle, inputActive]);

  const nihssScore = NIHSS_ITEMS.reduce((s, item) => {
    const v = nihss?.[item.id];
    return (!v || v === "UN") ? s : s + parseInt(v, 10);
  }, 0);

  const inclMet    = INCL_ITEMS.every((_, i) => checked["incl-" + i]);
  const exclAbsMet = EXCL_ABS.some((_, i) => checked["abs-" + i]);
  const exclRelMet = EXCL_REL.some((_, i) => checked["rel-" + i]);
  const elig       = !inclMet ? "incomplete" : exclAbsMet ? "contraindicated" : exclRelMet ? "relative" : "eligible";
  const eligColor  = { incomplete: "#94a3b8", contraindicated: "#f87171", relative: "#fbbf24", eligible: "#4ade80" }[elig];
  const eligLabel  = { incomplete: "Checklist Incomplete", contraindicated: "Contraindicated", relative: "Relative Contraindication", eligible: "tPA Eligible" }[elig];

  const wt          = parseFloat(weight) || 0;
  const altepTotal  = wt ? Math.min(parseFloat((wt * 0.9).toFixed(1)), 90) : null;
  const altepBolus  = altepTotal ? parseFloat((altepTotal * 0.1).toFixed(1)) : null;
  const altepInfuse = (altepTotal && altepBolus) ? parseFloat((altepTotal - altepBolus).toFixed(1)) : null;

  let lastSection = null;

  return (
    <div>
      <div style={{
        background: eligColor + "12", border: "1px solid " + eligColor + "35",
        borderRadius: 12, padding: "12px 18px", marginBottom: 16,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: eligColor }}>{eligLabel}</div>
          <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
            NIHSS {nihssScore} · {demo?.age ? "Age " + demo.age : "—"} · BP {(vitals && vitals.bp) || "—"}
          </div>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 30, color: eligColor }}>
          {elig === "eligible" ? "✓" : elig === "contraindicated" ? "✗" : "?"}
        </div>
      </div>

      <div ref={panelRef} tabIndex={0} onKeyDown={handleKey}
        style={{ outline: "none", background: "rgba(255,255,255,0.02)", borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.06)", padding: "14px 16px", marginBottom: 14 }}>
        {TX_FLAT.map((row, idx) => {
          const focused = idx === focusIdx;
          const key = row.section + "-" + row.idx;
          const done = !!checked[key];
          const isNew = row.section !== lastSection;
          lastSection = row.section;
          const sec = SEC_META[row.section];
          const ckColor = row.section === "incl" ? "#4ade80" : row.section === "abs" ? "#f87171" : "#fbbf24";
          return (
            <div key={key}>
              {isNew && (
                <div style={{
                  color: sec.color, fontSize: 10, fontWeight: 700, letterSpacing: "0.7px",
                  textTransform: "uppercase", padding: "14px 0 6px",
                  borderTop: row.section === "incl" ? "none" : "1px solid rgba(255,255,255,0.05)",
                }}>{sec.label}</div>
              )}
              <div onClick={() => { setFocusIdx(idx); toggle(row.section, row.idx); }}
                style={S.focusRow(focused)}>
                <div style={S.checkbox(done, ckColor)}>
                  {done && <span style={{ color: ckColor, fontSize: 10 }}>{row.section === "incl" ? "✓" : "!"}</span>}
                </div>
                <span style={{ fontSize: 13, color: done ? "#4b5563" : "#94a3b8" }}>{row.text}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={S.card}>
        <div style={{ ...S.cardTitle, color: "#2dd4bf" }}>Alteplase Dose (0.9 mg/kg · max 90 mg)</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>WEIGHT (kg) · press W</div>
            <input
              ref={weightRef}
              style={{ ...S.input, width: 110 }}
              value={weight}
              onChange={e => setWeight(e.target.value)}
              onFocus={() => setInputActive(true)}
              onBlur={() => { setInputActive(false); setTimeout(() => panelRef.current?.focus(), 50); }}
              placeholder="70"
            />
          </div>
          {altepTotal && (
            <>
              {[
                { label: "TOTAL",                  val: altepTotal  + " mg", color: "#2dd4bf" },
                { label: "BOLUS — 10% over 1 min", val: altepBolus  + " mg", color: "#fbbf24" },
                { label: "INFUSION — 90%/60 min",  val: altepInfuse + " mg", color: "#38bdf8" },
              ].map(({ label, val, color }) => (
                <div key={label} style={{
                  background: color + "10", border: "1px solid " + color + "30", borderRadius: 9, padding: "8px 14px",
                }}>
                  <div style={{ color: "#64748b", fontSize: 10 }}>{label}</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, color, fontWeight: 700 }}>{val}</div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>BP Management</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr>{["Scenario","Agent","Target"].map(h => (
            <th key={h} style={{ color: "#64748b", fontWeight: 600, padding: "6px 10px",
              borderBottom: "1px solid rgba(255,255,255,0.08)", textAlign: "left" }}>{h}</th>
          ))}</tr></thead>
          <tbody>{BP_TABLE.map((r, i) => (
            <tr key={i}>
              <td style={{ padding: "8px 10px", color: "#94a3b8", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{r.condition}</td>
              <td style={{ padding: "8px 10px", color: "#e2e8f0", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{r.target}</td>
              <td style={{ padding: "8px 10px", color: "#fbbf24", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{r.goal}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <KbHints hints={[
        { key: "↑ ↓", label: "navigate" },
        { key: "Space / Enter", label: "toggle + advance" },
        { key: "W", label: "jump to weight" },
        { key: "Esc", label: "back to checklist" },
      ]} />
    </div>
  );
}

// ─── NEURO CONSULT TAB ────────────────────────────────────────────────────────
const CONSULT_ITEMS = [
  "Stroke history and LKW documented",
  "NIHSS scored and recorded",
  "CT head reviewed",
  "CTA / CTP reviewed — LVO excluded or identified",
  "tPA eligibility determination documented",
  "tPA administered or exclusion reason charted",
  "BP management orders placed",
  "Antiplatelet / anticoagulation plan reviewed",
  "Statin initiated (ischemic stroke)",
  "Swallowing screen ordered",
  "PT / OT / Speech consults placed",
  "Echocardiogram ordered",
  "Telemetry for AF detection",
  "Carotid imaging ordered or scheduled",
  "Stroke unit / ICU bed confirmed",
];

function NeuroConsultTab({ demo, vitals, nihss, consultChecked, setConsultChecked, times, setTimes, notes, setNotes, workupChecked, txChecked }) {
  const [focusIdx, setFocusIdx] = useState(0);
  const [inputActive, setInputActive] = useState(false);
  const [saveState, setSaveState] = useState("idle");
  const checked = consultChecked;
  const setChecked = setConsultChecked;
  const panelRef = useRef(null);
  const timeArrivalRef = useRef(null);
  const notesRef = useRef(null);
  useEffect(() => { panelRef.current?.focus(); }, []);

  const handleKey = useCallback((e) => {
    if (inputActive) { if (e.key === "Escape") { setInputActive(false); panelRef.current?.focus(); } return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setFocusIdx(i => Math.min(i + 1, CONSULT_ITEMS.length - 1)); return; }
    if (e.key === "ArrowUp")   { e.preventDefault(); setFocusIdx(i => Math.max(i - 1, 0)); return; }
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      setChecked(p => ({ ...p, [focusIdx]: !p[focusIdx] }));
      setFocusIdx(i => Math.min(i + 1, CONSULT_ITEMS.length - 1));
    }
    if (e.key === "Backspace") { setChecked(p => ({ ...p, [focusIdx]: false })); }
    if (e.key === "t" || e.key === "T") { e.preventDefault(); setInputActive(true); timeArrivalRef.current?.focus(); }
    if (e.key === "n" || e.key === "N") { e.preventDefault(); setInputActive(true); notesRef.current?.focus(); }
  }, [focusIdx, inputActive]);

  const nihssScore = NIHSS_ITEMS.reduce((s, item) => {
    const v = nihss?.[item.id];
    return (!v || v === "UN") ? s : s + parseInt(v, 10);
  }, 0);
  const sev = nihssSeverity(nihssScore);
  const nihssItemsScored = NIHSS_ITEMS.filter(item => nihss?.[item.id] !== undefined).length;

  const dtn = (() => {
    if (!times.arrival || !times.tpa) return null;
    const p = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
    const d = p(times.tpa) - p(times.arrival);
    return d >= 0 ? d : d + 1440;
  })();

  const done = Object.values(checked).filter(Boolean).length;

  const tpaEligibility = (() => {
    if (!txChecked) return "incomplete";
    const inclMet    = Array.from({ length: 5  }, (_, i) => txChecked["incl-" + i]).every(Boolean);
    const exclAbsMet = Array.from({ length: 12 }, (_, i) => txChecked["abs-"  + i]).some(Boolean);
    const exclRelMet = Array.from({ length: 9  }, (_, i) => txChecked["rel-"  + i]).some(Boolean);
    if (!inclMet)    return "incomplete";
    if (exclAbsMet)  return "contraindicated";
    if (exclRelMet)  return "relative";
    return "eligible";
  })();

  const workupDone  = workupChecked ? Object.keys(workupChecked).length : 0;
  const workupTotal = 25;

  const saveRecord = useCallback(async () => {
    setSaveState("saving");
    try {
      const record = {
        encounter_date:          new Date().toISOString().split("T")[0],
        nihss_score:             nihssScore > 0 ? nihssScore : undefined,
        nihss_severity:          nihssScore > 0 ? sev.label : undefined,
        nihss_items_scored:      nihssItemsScored > 0 ? nihssItemsScored : undefined,
        tpa_given:               !!times.tpa,
        tpa_time:                times.tpa || undefined,
        tpa_eligible:            tpaEligibility,
        arrival_time:            times.arrival || undefined,
        consult_time:            times.consult || undefined,
        neurology_consulted:     !!times.consult,
        dtn_minutes:             dtn !== null ? dtn : undefined,
        dtn_goal_met:            dtn !== null ? dtn <= 60 : undefined,
        workup_tasks_completed:  workupDone,
        workup_tasks_total:      workupTotal,
        consult_items_completed: done,
        provider_notes:          notes || undefined,
      };
      const clean = Object.fromEntries(Object.entries(record).filter(([, v]) => v !== undefined));
      await StrokeQualityLog.create(clean);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 4000);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 4000);
    }
  }, [nihssScore, sev, nihssItemsScored, times, tpaEligibility, dtn, workupDone, done, notes]);

  const summary = [
    demo?.age ? (demo.age + (demo.sex ? " " + demo.sex : "") + " with acute stroke.") : null,
    nihssScore > 0 ? ("NIHSS " + nihssScore + " — " + sev.label + ".") : null,
    times.arrival ? ("Arrival: " + times.arrival + ".") : null,
    times.consult ? ("Neurology called: " + times.consult + ".") : null,
    times.tpa ? ("tPA: " + times.tpa + (dtn !== null ? " (DTN " + dtn + " min)" : "") + ".") : null,
    notes || null,
  ].filter(Boolean).join(" ");

  return (
    <div>
      <div style={S.card}>
        <div style={S.cardTitle}>Stroke Times · press T</div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
          {[
            { key: "arrival", label: "Door / Arrival",   inputRef: timeArrivalRef },
            { key: "consult", label: "Neurology Called",  inputRef: null },
            { key: "tpa",     label: "tPA Given",         inputRef: null },
          ].map(({ key, label, inputRef }) => (
            <div key={key}>
              <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>{label.toUpperCase()}</div>
              <input ref={inputRef} type="time" style={{ ...S.input, width: 130 }}
                value={times[key]}
                onChange={e => setTimes(t => ({ ...t, [key]: e.target.value }))}
                onFocus={() => setInputActive(true)}
                onBlur={() => { setInputActive(false); setTimeout(() => panelRef.current?.focus(), 50); }}
              />
            </div>
          ))}
          {dtn !== null && (
            <div style={{
              padding: "8px 16px", borderRadius: 9,
              background: dtn <= 60 ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
              border: "1px solid " + (dtn <= 60 ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"),
            }}>
              <div style={{ color: "#64748b", fontSize: 10 }}>DOOR-TO-NEEDLE</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, fontWeight: 700,
                color: dtn <= 60 ? "#4ade80" : "#f87171" }}>
                {dtn} min {dtn <= 60 ? "✓" : "✗ >60"}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ ...S.card, padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={S.cardTitle}>Neuro Recommendations</div>
          <span style={{ color: "#2dd4bf", fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>
            {done} / {CONSULT_ITEMS.length}
          </span>
        </div>
        <div ref={panelRef} tabIndex={0} onKeyDown={handleKey} style={{ outline: "none" }}>
          {CONSULT_ITEMS.map((item, idx) => {
            const focused = idx === focusIdx;
            const isDone = !!checked[idx];
            return (
              <div key={idx} onClick={() => { setFocusIdx(idx); setChecked(p => ({ ...p, [idx]: !p[idx] })); }}
                style={S.focusRow(focused)}>
                <div style={S.checkbox(isDone)}>
                  {isDone && <span style={{ color: "#2dd4bf", fontSize: 11 }}>✓</span>}
                </div>
                <span style={{ fontSize: 13, color: isDone ? "#4b5563" : "#94a3b8",
                  textDecoration: isDone ? "line-through" : "none" }}>{item}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Notes · press N</div>
        <textarea ref={notesRef} rows={3}
          style={{ ...S.input, resize: "vertical", lineHeight: 1.6, width: "100%", boxSizing: "border-box" }}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onFocus={() => setInputActive(true)}
          onBlur={() => { setInputActive(false); setTimeout(() => panelRef.current?.focus(), 50); }}
          placeholder="Neuro recommendations, disposition, plan..."
        />
        {summary && (
          <div style={{ marginTop: 10, background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8,
            padding: "10px 14px", fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>
            <div style={{ color: "#4b5563", fontSize: 10, marginBottom: 4 }}>AUTO-SUMMARY</div>
            {summary}
          </div>
        )}
      </div>

      <KbHints hints={[
        { key: "↑ ↓", label: "navigate" },
        { key: "Space / Enter", label: "check + advance" },
        { key: "⌫", label: "uncheck" },
        { key: "T", label: "jump to times" },
        { key: "N", label: "jump to notes" },
        { key: "Esc", label: "back to checklist" },
      ]} />

      <div style={{ marginTop: 16, padding: "14px 18px", borderRadius: 12,
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>
              Save to Quality Log
            </div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#4b5563", marginTop: 3 }}>
              De-identified record — NIHSS, DTN, tPA status, checklist completion. No patient identifiers stored.
            </div>
          </div>
          <button onClick={saveRecord} disabled={saveState === "saving" || saveState === "saved"}
            style={{
              fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 13,
              padding: "10px 22px", borderRadius: 9,
              cursor: saveState === "saving" ? "wait" : saveState === "saved" ? "default" : "pointer",
              transition: "all .2s",
              background: saveState === "saved"  ? "linear-gradient(135deg,rgba(74,222,128,0.25),rgba(74,222,128,0.12))"
                        : saveState === "error"  ? "linear-gradient(135deg,rgba(248,113,113,0.25),rgba(248,113,113,0.12))"
                        : saveState === "saving" ? "rgba(255,255,255,0.05)"
                        : "linear-gradient(135deg,rgba(20,184,166,0.25),rgba(20,184,166,0.12))",
              border: saveState === "saved"  ? "1px solid rgba(74,222,128,0.5)"
                    : saveState === "error"  ? "1px solid rgba(248,113,113,0.5)"
                    : "1px solid rgba(20,184,166,0.4)",
              color: saveState === "saved"  ? "#4ade80"
                   : saveState === "error"  ? "#f87171"
                   : saveState === "saving" ? "#64748b"
                   : "#2dd4bf",
            }}>
            {saveState === "saving" ? "Saving..." : saveState === "saved" ? "✓ Saved" : saveState === "error" ? "✗ Error — retry" : "Save to Quality Log"}
          </button>
        </div>
        <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
          {[
            nihssScore > 0                  && { label: "NIHSS",       val: nihssScore + " — " + sev.label,                   color: "#2dd4bf" },
            times.tpa                       && { label: "tPA",          val: "Given " + times.tpa,                             color: "#4ade80" },
            !times.tpa                      && { label: "tPA",          val: "Not given",                                       color: "#64748b" },
            dtn !== null                    && { label: "DTN",          val: dtn + " min " + (dtn <= 60 ? "✓" : "✗ >60"),    color: dtn <= 60 ? "#4ade80" : "#f87171" },
            tpaEligibility !== "incomplete" && { label: "Eligibility",  val: tpaEligibility,                                   color: tpaEligibility === "eligible" ? "#4ade80" : tpaEligibility === "contraindicated" ? "#f87171" : "#fbbf24" },
            workupDone > 0                  && { label: "Workup",       val: workupDone + " / " + workupTotal + " tasks",      color: "#94a3b8" },
            done > 0                        && { label: "Consult",      val: done + " / " + CONSULT_ITEMS.length + " items",  color: "#94a3b8" },
          ].filter(Boolean).map((item, i) => (
            <div key={i} style={{
              background: item.color + "12", border: "1px solid " + item.color + "35",
              borderRadius: 7, padding: "4px 10px",
            }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "#64748b", marginRight: 5 }}>{item.label}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: item.color, fontWeight: 700 }}>{item.val}</span>
            </div>
          ))}
          {nihssScore === 0 && !times.arrival && !times.tpa && (
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#4b5563" }}>
              Complete NIHSS, times, or tPA fields to generate a meaningful log entry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PRINT CARDS TAB ──────────────────────────────────────────────────────────
const SENTENCES = [
  "You know how.",
  "Down to earth.",
  "I got home from work.",
  "Near the table in the dining room.",
  "They heard him speak on the radio last night.",
];
const NAMING_ITEMS = ["Pen / pencil", "Hand", "Chair", "Glasses", "Cane"];
const DYSARTHRIA_WORDS = ["MAMA", "TIP-TOP", "FIFTY-FIFTY", "THANKS", "HUCKLEBERRY", "BASEBALL PLAYER"];
const COOKIE_CUES = [
  "Boy stealing cookies from the jar",
  "Boy standing on a tipping stool",
  "Woman washing dishes — sink overflowing",
  "Woman handing cookie to girl",
  "Window, curtains, outdoor scene",
];

function PrintCardsTab() {
  const pCard = {
    background: "#fff", border: "2px solid #1e293b", borderRadius: 10,
    padding: "24px 28px", color: "#0f172a", fontFamily: "'DM Sans',Arial,sans-serif",
  };
  const pSectionTitle = (title) => (
    <div style={{
      fontFamily: "'Playfair Display',Georgia,serif",
      fontSize: 18, fontWeight: 700, color: "#0f172a",
      borderBottom: "2px solid #0f172a", paddingBottom: 8, marginBottom: 16,
    }}>{title}</div>
  );
  const pLabel = (text) => (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "#64748b", marginBottom: 6 }}>
      {text}
    </div>
  );
  const pInstruction = (text) => (
    <div style={{ background: "#f1f5f9", borderRadius: 6, padding: "8px 12px", fontSize: 11, color: "#475569", fontStyle: "italic", marginBottom: 14 }}>
      {text}
    </div>
  );

  return (
    <div>
      <style>{PRINT_CSS}</style>
      <div className="sh-no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 12, color: "#64748b" }}>Patient-facing stimulus cards · items 9 and 10</div>
        <button onClick={() => window.print()} style={{
          background: "linear-gradient(135deg,rgba(20,184,166,0.22),rgba(20,184,166,0.1))",
          border: "1px solid rgba(20,184,166,0.38)", borderRadius: 8,
          color: "#2dd4bf", cursor: "pointer", fontSize: 13, fontWeight: 700, padding: "8px 20px",
        }}>⎙ Print Page</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Item 9 */}
        <div style={pCard}>
          {pSectionTitle("Item 9 — Best Language")}

          {pLabel("READING SENTENCES · Ask patient to read aloud")}
          {pInstruction("Please read each sentence aloud. Score on fluency, word substitutions, and paraphrasic errors. Do not help or prompt.")}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {SENTENCES.map((s, i) => (
              <div key={i} style={{
                background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8,
                padding: "12px 16px", fontFamily: "'Playfair Display',Georgia,serif",
                fontSize: 22, fontWeight: 700, color: "#0f172a", lineHeight: 1.3,
              }}>{s}</div>
            ))}
          </div>

          {pLabel("NAMING · Ask patient to name each object")}
          {pInstruction("Show each item or point to object in the room. Record errors and perseverations.")}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 20 }}>
            {NAMING_ITEMS.map(item => (
              <div key={item} style={{
                border: "2px solid #1e293b", borderRadius: 8, padding: "12px 6px", textAlign: "center",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{item}</div>
              </div>
            ))}
          </div>

          {pLabel("COOKIE THEFT PICTURE · Show NIH card — Tell me everything you see happening")}
          <div style={{ border: "2px dashed #94a3b8", borderRadius: 8, padding: "14px 18px", background: "#f8fafc" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.8px" }}>
              SCENE ELEMENTS TO LISTEN FOR
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
              {COOKIE_CUES.map((cue, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "#334155" }}>
                  <span style={{ color: "#94a3b8", flexShrink: 0 }}>□</span>{cue}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 10, color: "#94a3b8", fontStyle: "italic" }}>
              Attach official NIH/AHA Cookie Theft stimulus card for full administration.
            </div>
          </div>
        </div>

        {/* Item 10 */}
        <div style={pCard}>
          {pSectionTitle("Item 10 — Dysarthria")}

          {pLabel("WORD LIST · Show to patient or read aloud for repeat")}
          {pInstruction("Please read each word aloud. If unable to read, say the word and ask the patient to repeat it. If intubated or physical barrier: score UN (Untestable).")}

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 22 }}>
            {DYSARTHRIA_WORDS.map(word => (
              <div key={word} style={{
                background: "#0f172a", borderRadius: 10, padding: "16px 22px",
                fontFamily: "'JetBrains Mono','Courier New',monospace",
                fontSize: 32, fontWeight: 700, color: "#f1f5f9",
                letterSpacing: "4px", textAlign: "center",
              }}>{word}</div>
            ))}
          </div>

          {pLabel("SCORING RUBRIC")}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {[
              { score: "0",  label: "Normal articulation",                                     color: "#4ade80" },
              { score: "1",  label: "Mild-moderate slurring — can be understood with effort",  color: "#fbbf24" },
              { score: "2",  label: "Severe — unintelligible or mute (not aphasia)",            color: "#f87171" },
              { score: "UN", label: "Untestable — intubated or physical barrier",               color: "#94a3b8" },
            ].map(({ score, label, color }) => (
              <div key={score} style={{
                display: "flex", alignItems: "center", gap: 14,
                background: color + "12", border: "1px solid " + color + "40",
                borderRadius: 8, padding: "10px 14px",
              }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, fontWeight: 700, color, minWidth: 32, textAlign: "center" }}>{score}</div>
                <div style={{ fontSize: 13, color: "#0f172a" }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", fontSize: 11, color: "#92400e" }}>
            <strong>Clinical note:</strong> Distinguish dysarthria from aphasia. A globally aphasic patient scoring 3 on Item 9
            should not automatically receive a high Item 10 score unless motor speech impairment is separately identifiable.
          </div>
        </div>

        <div style={{ textAlign: "center", fontSize: 10, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace", paddingTop: 4 }}>
          Notrya · StrokeHub · NIHSS Stimulus Reference · Not a substitute for certified NIHSS training
        </div>
      </div>
    </div>
  );
}

// ─── STROKREHUB ───────────────────────────────────────────────────────────────
const TABS = [
  { label: "NIHSS",         accent: null },
  { label: "Workup",        accent: null },
  { label: "Treatment",     accent: null },
  { label: "Neuro Consult", accent: null },
  { label: "Print Cards",   bg: "rgba(71,85,105,0.14)", border: "rgba(71,85,105,0.35)", text: "#94a3b8" },
];

export default function StrokeHub({
  embedded = false,
  onBack,
  demo = {},
  vitals = {},
  cc = {},
  nihssInit = {},
}) {
  const [tab, setTab]                                 = useState(0);
  const [nihss, setNihss]                             = useState(nihssInit);
  const [workupChecked, setWorkupChecked]             = useState({});
  const [txChecked, setTxChecked]                     = useState({});
  const [weight, setWeight]                           = useState("");
  const [consultChecked, setConsultChecked]           = useState({});
  const [times, setTimes]                             = useState({ arrival: "", consult: "", tpa: "" });
  const [notes, setNotes]                             = useState("");
  const wrapRef = useRef(null);

  const handleBack = useCallback(() => {
    if (onBack) { onBack(); } else { window.history.back(); }
  }, [onBack]);

  useEffect(() => {
    const handler = (e) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (!wrapRef.current?.contains(e.target)) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 5) { e.preventDefault(); setTab(n - 1); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const nihssScore = NIHSS_ITEMS.reduce((s, item) => {
    const v = nihss[item.id];
    return (!v || v === "UN") ? s : s + parseInt(v, 10);
  }, 0);
  const sev = nihssSeverity(nihssScore);
  const workupDone = Object.keys(workupChecked).length;

  return (
    <div ref={wrapRef} style={embedded ? { fontFamily: "'DM Sans',sans-serif", color: "#e8edf5" } : S.wrap}>

      {/* ── Header ── */}
      <div style={S.header} className="sh-no-print">
        <button style={S.backBtn} onClick={handleBack}>← Back</button>
        <div style={{ width: 1, background: "rgba(255,255,255,0.07)", margin: "12px 6px" }} />
        <div style={{ ...S.title, padding: "0 14px" }}>StrokeHub</div>
        <div style={S.badge}>STROKE</div>

        {nihssScore > 0 && (
          <div style={{
            marginLeft: 14, display: "flex", alignItems: "center", gap: 8,
            background: sev.color + "12", border: "1px solid " + sev.color + "30",
            borderRadius: 20, padding: "4px 14px",
          }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", color: sev.color, fontSize: 13, fontWeight: 700 }}>
              NIHSS {nihssScore}
            </span>
            <span style={{ color: sev.color, fontSize: 11, opacity: 0.8 }}>{sev.label}</span>
          </div>
        )}

        {workupDone > 0 && (
          <div style={{
            marginLeft: 8, display: "flex", alignItems: "center", gap: 6,
            background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)",
            borderRadius: 20, padding: "4px 12px",
          }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", color: "#2dd4bf", fontSize: 11 }}>
              {workupDone}/{WORKUP_FLAT.length}
            </span>
            <span style={{ color: "#64748b", fontSize: 10 }}>workup</span>
          </div>
        )}

        {tab === 4 && (
          <button onClick={() => window.print()} style={{
            marginLeft: "auto", background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7,
            color: "#94a3b8", cursor: "pointer", fontSize: 12, fontWeight: 700,
            padding: "0 16px", display: "flex", alignItems: "center", gap: 6,
          }}>⎙ Print</button>
        )}
      </div>

      {/* ── Tab bar ── */}
      <div style={S.tabBar} className="sh-no-print">
        {TABS.map((t, i) => (
          <button key={t.label} style={S.tab(i === tab, t.bg, t.border, t.text)} onClick={() => setTab(i)}>
            <span style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
              color: i === tab ? (t.text || "#14b8a6") : "#374151",
            }}>
              {String.fromCharCode(8984)}{i + 1}
            </span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Body ── */}
      <div style={S.body}>
        {tab === 0 && <NIHSSTab nihss={nihss} setNihss={setNihss} />}
        {tab === 1 && <WorkupTab checked={workupChecked} setChecked={setWorkupChecked} />}
        {tab === 2 && <TreatmentTab demo={demo} vitals={vitals} nihss={nihss}
          txChecked={txChecked} setTxChecked={setTxChecked}
          weight={weight} setWeight={setWeight} />}
        {tab === 3 && <NeuroConsultTab demo={demo} vitals={vitals} nihss={nihss}
          consultChecked={consultChecked} setConsultChecked={setConsultChecked}
          times={times} setTimes={setTimes}
          notes={notes} setNotes={setNotes}
          workupChecked={workupChecked}
          txChecked={txChecked} />}
        {tab === 4 && <PrintCardsTab />}
      </div>
    </div>
  );
}