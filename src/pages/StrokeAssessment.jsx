// StrokeHub.jsx — Notrya Stroke Protocol Hub
// Tabs: NIHSS | Workup | Treatment | Neuro Consult
// Constraints: no router, no localStorage, no form/alert, straight quotes, <1600 lines

import { useState, useCallback, useRef, useEffect } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const S = {
  wrap: {
    background: "linear-gradient(135deg,rgba(10,18,42,0.97) 0%,rgba(14,26,52,0.97) 100%)",
    minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: "#e8edf5",
    padding: "0 0 48px 0",
  },
  header: {
    background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)",
    padding: "14px 24px", display: "flex", alignItems: "center", gap: 14,
  },
  backBtn: {
    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 8, color: "#94a3b8", cursor: "pointer", fontSize: 13,
    padding: "6px 12px", transition: "all .15s",
  },
  title: {
    fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700,
    color: "#f1f5f9", letterSpacing: "-0.3px",
  },
  badge: {
    background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.35)",
    borderRadius: 20, color: "#fca5a5", fontSize: 11, fontWeight: 700,
    padding: "3px 10px", letterSpacing: "0.5px", textTransform: "uppercase",
  },
  tabs: {
    display: "flex", gap: 4, padding: "16px 24px 0",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  tab: (active) => ({
    background: active ? "rgba(20,184,166,0.15)" : "transparent",
    border: active ? "1px solid rgba(20,184,166,0.35)" : "1px solid transparent",
    borderBottom: active ? "1px solid rgba(10,18,42,0.97)" : "1px solid transparent",
    borderRadius: "8px 8px 0 0", color: active ? "#2dd4bf" : "#64748b",
    cursor: "pointer", fontSize: 13, fontWeight: active ? 700 : 500,
    padding: "9px 18px", transition: "all .15s", marginBottom: -1,
  }),
  body: { padding: "24px" },
  card: {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12, padding: "18px 20px", marginBottom: 14,
  },
  cardTitle: {
    color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "0.8px",
    textTransform: "uppercase", marginBottom: 12,
  },
  row: {
    display: "flex", alignItems: "center", gap: 12, padding: "8px 0",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  tealBtn: {
    background: "linear-gradient(135deg,rgba(20,184,166,0.25),rgba(20,184,166,0.15))",
    border: "1px solid rgba(20,184,166,0.4)", borderRadius: 8, color: "#2dd4bf",
    cursor: "pointer", fontSize: 13, fontWeight: 600, padding: "8px 18px",
    transition: "all .15s",
  },
  goldBtn: {
    background: "linear-gradient(135deg,rgba(251,191,36,0.2),rgba(251,191,36,0.1))",
    border: "1px solid rgba(251,191,36,0.4)", borderRadius: 8, color: "#fbbf24",
    cursor: "pointer", fontSize: 13, fontWeight: 600, padding: "8px 18px",
    transition: "all .15s",
  },
  input: {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 8, color: "#e8edf5", fontSize: 14, padding: "8px 12px",
    outline: "none", width: "100%", fontFamily: "'JetBrains Mono', monospace",
  },
  scoreBox: (score) => {
    const color = score <= 4 ? "#4ade80" : score <= 15 ? "#fbbf24" : "#f87171";
    return {
      background: `rgba(${score <= 4 ? "74,222,128" : score <= 15 ? "251,191,36" : "248,113,113"},0.12)`,
      border: `1px solid ${color}40`, borderRadius: 10, padding: "12px 18px",
      textAlign: "center", minWidth: 80,
    };
  },
};

// ─── NIHSS DATA ───────────────────────────────────────────────────────────────
const NIHSS_ITEMS = [
  { id: "1a", label: "1a. Level of Consciousness", max: 3, opts: ["0 — Alert","1 — Not alert, arousable","2 — Not alert, obtunded","3 — Unresponsive/coma"] },
  { id: "1b", label: "1b. LOC Questions (month/age)", max: 2, opts: ["0 — Both correct","1 — One correct","2 — Neither correct"] },
  { id: "1c", label: "1c. LOC Commands (open/close eyes, grip)", max: 2, opts: ["0 — Both correct","1 — One correct","2 — Neither correct"] },
  { id: "2",  label: "2. Best Gaze", max: 2, opts: ["0 — Normal","1 — Partial gaze palsy","2 — Forced deviation"] },
  { id: "3",  label: "3. Visual Fields", max: 3, opts: ["0 — No visual loss","1 — Partial hemianopia","2 — Complete hemianopia","3 — Bilateral/cortical blindness"] },
  { id: "4",  label: "4. Facial Palsy", max: 3, opts: ["0 — Normal","1 — Minor paralysis","2 — Partial paralysis","3 — Complete paralysis"] },
  { id: "5a", label: "5a. Motor Arm — Left", max: 4, opts: ["0 — No drift","1 — Drift down","2 — Some effort vs gravity","3 — No effort vs gravity","4 — No movement","UN — Amputation/joint fusion"] },
  { id: "5b", label: "5b. Motor Arm — Right", max: 4, opts: ["0 — No drift","1 — Drift down","2 — Some effort vs gravity","3 — No effort vs gravity","4 — No movement","UN — Amputation/joint fusion"] },
  { id: "6a", label: "6a. Motor Leg — Left", max: 4, opts: ["0 — No drift","1 — Drift down","2 — Some effort vs gravity","3 — No effort vs gravity","4 — No movement","UN — Amputation/joint fusion"] },
  { id: "6b", label: "6b. Motor Leg — Right", max: 4, opts: ["0 — No drift","1 — Drift down","2 — Some effort vs gravity","3 — No effort vs gravity","4 — No movement","UN — Amputation/joint fusion"] },
  { id: "7",  label: "7. Limb Ataxia", max: 2, opts: ["0 — Absent","1 — Present in 1 limb","2 — Present in 2 limbs","UN — Paralyzed/amputee"] },
  { id: "8",  label: "8. Sensory", max: 2, opts: ["0 — Normal","1 — Mild-moderate loss","2 — Severe/total loss"] },
  { id: "9",  label: "9. Best Language", max: 3, opts: ["0 — No aphasia","1 — Mild-moderate aphasia","2 — Severe aphasia","3 — Mute/global aphasia"] },
  { id: "10", label: "10. Dysarthria", max: 2, opts: ["0 — Normal","1 — Mild-moderate slurring","2 — Severe/unintelligible","UN — Intubated"] },
  { id: "11", label: "11. Extinction/Inattention", max: 2, opts: ["0 — Normal","1 — Inattention to 1 modality","2 — Profound hemi-inattention"] },
];

const NIHSS_SEVERITY = (n) => {
  if (n === 0)    return { label: "No Stroke", color: "#4ade80" };
  if (n <= 4)     return { label: "Minor Stroke", color: "#86efac" };
  if (n <= 15)    return { label: "Moderate Stroke", color: "#fbbf24" };
  if (n <= 20)    return { label: "Moderate-Severe", color: "#fb923c" };
  return           { label: "Severe Stroke", color: "#f87171" };
};

// ─── NIHSS TAB ────────────────────────────────────────────────────────────────
function NIHSSTab({ nihss, setNihss }) {
  const [focusIdx, setFocusIdx] = useState(0);
  const panelRef = useRef(null);

  const score = NIHSS_ITEMS.reduce((sum, item) => {
    const v = nihss[item.id];
    if (!v || v === "UN") return sum;
    return sum + parseInt(v, 10);
  }, 0);

  const sev = NIHSS_SEVERITY(score);

  const setItem = useCallback((id, val) => {
    setNihss(prev => ({ ...prev, [id]: val }));
    setFocusIdx(i => Math.min(i + 1, NIHSS_ITEMS.length - 1));
  }, [setNihss]);

  useEffect(() => { panelRef.current?.focus(); }, []);

  const handleKey = useCallback((e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setFocusIdx(i => Math.min(i + 1, NIHSS_ITEMS.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setFocusIdx(i => Math.max(i - 1, 0)); }
    const item = NIHSS_ITEMS[focusIdx];
    if (!item) return;
    const n = parseInt(e.key, 10);
    if (!isNaN(n) && n <= item.max) setItem(item.id, String(n));
    if (e.key === "u" || e.key === "U") setItem(item.id, "UN");
  }, [focusIdx, setItem]);

  return (
    <div>
      {/* Score Summary */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <div style={S.scoreBox(score)}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 700, color: sev.color }}>{score}</div>
          <div style={{ color: sev.color, fontSize: 11, fontWeight: 700, marginTop: 2 }}>{sev.label}</div>
        </div>
        <div>
          <div style={{ color: "#64748b", fontSize: 12, marginBottom: 4 }}>
            Keyboard: <span style={{ color: "#94a3b8" }}>↑↓ navigate · 0-4 score · U = untestable</span>
          </div>
          <div style={{ color: "#64748b", fontSize: 12 }}>
            {NIHSS_ITEMS.filter(i => nihss[i.id] !== undefined).length}/{NIHSS_ITEMS.length} items scored
          </div>
        </div>
        <button style={{ ...S.tealBtn, marginLeft: "auto" }}
          onClick={() => setNihss({})}>
          Reset
        </button>
      </div>

      {/* NIHSS Items */}
      <div ref={panelRef} tabIndex={0} onKeyDown={handleKey}
        style={{ outline: "none", display: "flex", flexDirection: "column", gap: 6 }}>
        {NIHSS_ITEMS.map((item, idx) => {
          const val = nihss[item.id];
          const focused = idx === focusIdx;
          return (
            <div key={item.id}
              onClick={() => setFocusIdx(idx)}
              style={{
                background: focused ? "rgba(20,184,166,0.1)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${focused ? "rgba(20,184,166,0.4)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: 10, padding: "10px 14px", cursor: "pointer", transition: "all .1s",
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontSize: 13, color: focused ? "#e2e8f0" : "#94a3b8", fontWeight: focused ? 600 : 400, flex: 1 }}>
                  {item.label}
                </div>
                {val !== undefined && (
                  <div style={{
                    background: "rgba(20,184,166,0.2)", border: "1px solid rgba(20,184,166,0.4)",
                    borderRadius: 6, color: "#2dd4bf", fontSize: 12, fontWeight: 700,
                    padding: "2px 10px", minWidth: 32, textAlign: "center",
                  }}>{val}</div>
                )}
              </div>
              {focused && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                  {item.opts.map((opt, oi) => {
                    const optVal = opt.startsWith("UN") ? "UN" : String(oi);
                    return (
                      <button key={oi}
                        onClick={(e) => { e.stopPropagation(); setItem(item.id, optVal); }}
                        style={{
                          background: val === optVal ? "rgba(20,184,166,0.25)" : "rgba(255,255,255,0.05)",
                          border: `1px solid ${val === optVal ? "rgba(20,184,166,0.5)" : "rgba(255,255,255,0.1)"}`,
                          borderRadius: 6, color: val === optVal ? "#2dd4bf" : "#94a3b8",
                          cursor: "pointer", fontSize: 12, padding: "5px 10px",
                        }}>
                        {!opt.startsWith("UN") && <span style={{ fontFamily: "'JetBrains Mono', monospace", marginRight: 4, color: "#64748b" }}>{oi}</span>}
                        {opt.split(" — ").pop()}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Cookie Theft Card */}
      <div style={{ ...S.card, marginTop: 20 }}>
        <div style={S.cardTitle}>Patient Assessment Materials</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <div style={{ color: "#64748b", fontSize: 11, marginBottom: 6 }}>READING SENTENCE (item 9)</div>
            <div style={{ color: "#e2e8f0", fontSize: 14, fontStyle: "italic", lineHeight: 1.6 }}>
              "You know how."<br />
              "Down to earth."<br />
              "I got home from work."<br />
              "Near the table in the dining room."<br />
              "They heard him speak on the radio last night."
            </div>
          </div>
          <div>
            <div style={{ color: "#64748b", fontSize: 11, marginBottom: 6 }}>DYSARTHRIA WORDS (item 10)</div>
            <div style={{ color: "#e2e8f0", fontSize: 14, fontFamily: "'JetBrains Mono', monospace", lineHeight: 2 }}>
              MAMA &nbsp; TIP-TOP<br />
              FIFTY-FIFTY<br />
              THANKS &nbsp; HUCKLEBERRY<br />
              BASEBALL PLAYER
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── WORKUP TAB ───────────────────────────────────────────────────────────────
const WORKUP_TIMELINE = [
  {
    window: "0 – 10 min", color: "#f87171",
    tasks: [
      "Activate stroke team / stroke code called",
      "IV access established (2 large bore)",
      "12-lead ECG obtained",
      "Point-of-care glucose checked",
      "Vital signs: BP both arms, SpO2, HR, Temp",
      "Brief neuro exam / NIHSS initiated",
      "CT head ordered (non-contrast)",
    ],
  },
  {
    window: "0 – 25 min", color: "#fb923c",
    tasks: [
      "CT head completed and read",
      "Labs drawn: CBC, BMP, PT/INR, PTT, type & screen",
      "Troponin and BNP sent",
      "NPO status confirmed",
      "Last known well time documented",
      "Pregnancy test (females of childbearing age)",
    ],
  },
  {
    window: "25 – 60 min", color: "#fbbf24",
    tasks: [
      "CT perfusion or CT angiography head/neck",
      "Neurology / stroke team at bedside",
      "tPA eligibility determination complete",
      "Informed consent obtained (if tPA candidate)",
      "Family/surrogate at bedside or contacted",
      "Foley catheter placed (if tPA planned)",
    ],
  },
  {
    window: "60 – 120 min", color: "#4ade80",
    tasks: [
      "MRI brain (if CT non-diagnostic)",
      "Carotid ultrasound or CTA neck (if not done)",
      "Telemetry/cardiac monitoring established",
      "BP goal documented per treatment decision",
      "Neurosurgery or IR notified (if LVO/thrombectomy)",
      "ICU/stroke unit bed requested",
      "tPA administered or decision documented",
    ],
  },
];

function WorkupTab({ checked, setChecked }) {
  const [times, setTimes] = useState({});

  const toggle = (key) => {
    const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setChecked(prev => {
      const next = { ...prev };
      if (next[key]) { delete next[key]; }
      else { next[key] = true; setTimes(t => ({ ...t, [key]: now })); }
      return next;
    });
  };

  const total = WORKUP_TIMELINE.reduce((s, w) => s + w.tasks.length, 0);
  const done  = Object.keys(checked).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <div style={{
          background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.3)",
          borderRadius: 10, padding: "10px 18px",
        }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: "#2dd4bf" }}>{done}</span>
          <span style={{ color: "#64748b", fontSize: 13 }}>/{total} tasks</span>
        </div>
        <div style={{
          flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 8, height: 8, overflow: "hidden",
        }}>
          <div style={{
            width: `${(done / total) * 100}%`, height: "100%",
            background: "linear-gradient(90deg,#2dd4bf,#38bdf8)", transition: "width .3s",
          }} />
        </div>
        <button style={S.tealBtn} onClick={() => { setChecked({}); setTimes({}); }}>Reset</button>
      </div>

      {WORKUP_TIMELINE.map((window) => (
        <div key={window.window} style={{ ...S.card, borderLeft: `3px solid ${window.color}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{
              background: `${window.color}20`, border: `1px solid ${window.color}50`,
              borderRadius: 20, color: window.color, fontSize: 11, fontWeight: 700,
              padding: "3px 12px",
            }}>{window.window}</div>
          </div>
          {window.tasks.map((task, ti) => {
            const key = `${window.window}-${ti}`;
            const done = !!checked[key];
            return (
              <div key={ti} onClick={() => toggle(key)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
                  opacity: done ? 0.6 : 1,
                }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                  background: done ? "rgba(20,184,166,0.3)" : "rgba(255,255,255,0.06)",
                  border: `2px solid ${done ? "#2dd4bf" : "rgba(255,255,255,0.15)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {done && <span style={{ color: "#2dd4bf", fontSize: 12 }}>✓</span>}
                </div>
                <span style={{ fontSize: 13, color: done ? "#4b5563" : "#94a3b8", flex: 1,
                  textDecoration: done ? "line-through" : "none" }}>{task}</span>
                {done && times[key] && (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#4b5563" }}>
                    {times[key]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── TREATMENT TAB ────────────────────────────────────────────────────────────
const TPA_INCLUSION = [
  "Ischemic stroke with measurable deficit (NIHSS ≥ 4 or significant deficit)",
  "CT head shows no hemorrhage",
  "Symptom onset < 3 hours (or < 4.5 hours if extended criteria met)",
  "Age ≥ 18 years",
  "Patient / surrogate able to provide consent",
];
const TPA_EXCLUSION_ABS = [
  "Intracranial hemorrhage on CT",
  "BP > 185/110 after treatment (unable to stabilize)",
  "Active internal bleeding (not menses)",
  "Platelets < 100,000/mm³",
  "INR > 1.7 or PT > 15 sec",
  "Glucose < 50 or > 400 mg/dL (uncorrected)",
  "Recent intracranial/spinal surgery < 3 months",
  "Head trauma or prior stroke < 3 months",
  "History of intracranial hemorrhage",
  "Intracranial neoplasm, AVM, or aneurysm (symptomatic)",
  "IV or SC heparin within 48 hr with elevated aPTT",
  "Direct thrombin or factor Xa inhibitor use within 48 hr",
];
const TPA_EXCLUSION_REL = [
  "Minor or rapidly improving stroke symptoms",
  "Seizure at stroke onset with postictal deficits",
  "Major surgery or trauma < 14 days",
  "GI or urinary tract hemorrhage < 21 days",
  "Arterial puncture at non-compressible site < 7 days",
  "Age > 80 years (3-4.5h window only)",
  "NIHSS > 25 (3-4.5h window only)",
  "Diabetes + prior stroke (3-4.5h window only)",
  "Antiplatelet use (relative — weigh risk/benefit)",
];
const BP_TABLE = [
  { condition: "Pre-tPA (eligible, BP > 185/110)", target: "Labetalol 10-20 mg IV × 1-2 or Nicardipine 5 mg/hr IV (titrate)", goal: "< 185/110 before tPA" },
  { condition: "Post-tPA (first 24h)", target: "Labetalol or Nicardipine per protocol", goal: "< 180/105" },
  { condition: "Ischemic, not tPA candidate", target: "Permissive hypertension — treat only if > 220/120", goal: "< 220/120" },
  { condition: "Hemorrhagic transformation", target: "Aggressive BP reduction", goal: "SBP < 140" },
  { condition: "Thrombectomy candidate (pre-procedure)", target: "Maintain BP, avoid hypotension", goal: "SBP ≥ 140" },
];

function TreatmentTab({ demo, vitals, nihss }) {
  const [incl, setIncl] = useState({});
  const [exclAbs, setExclAbs] = useState({});
  const [exclRel, setExclRel] = useState({});
  const [weight, setWeight] = useState("");

  const sbp = vitals?.sbp || vitals?.bp?.split("/")?.[0] || "";
  const dbp = vitals?.dbp || vitals?.bp?.split("/")?.[1] || "";
  const wt  = parseFloat(weight) || 0;
  const altepTotal  = wt ? Math.min((wt * 0.9).toFixed(1), 90) : null;
  const altepBolus  = altepTotal ? (altepTotal * 0.1).toFixed(1) : null;
  const altepInfuse = altepTotal && altepBolus ? (altepTotal - altepBolus).toFixed(1) : null;

  const inclMet   = TPA_INCLUSION.every((_, i) => incl[i]);
  const exclAbsMet = Object.values(exclAbs).some(Boolean);
  const exclRelMet = Object.values(exclRel).some(Boolean);

  const eligibility = !inclMet ? "incomplete"
    : exclAbsMet ? "contraindicated"
    : exclRelMet ? "relative"
    : "eligible";

  const eligColor = { incomplete: "#94a3b8", contraindicated: "#f87171", relative: "#fbbf24", eligible: "#4ade80" }[eligibility];
  const eligLabel = { incomplete: "Checklist Incomplete", contraindicated: "Contraindicated", relative: "Relative Contraindication — Discuss", eligible: "tPA Eligible" }[eligibility];

  const nihssScore = NIHSS_ITEMS.reduce((sum, item) => {
    const v = nihss?.[item.id];
    if (!v || v === "UN") return sum;
    return sum + parseInt(v, 10);
  }, 0);

  return (
    <div>
      {/* Eligibility Banner */}
      <div style={{
        background: `${eligColor}15`, border: `1px solid ${eligColor}40`,
        borderRadius: 12, padding: "14px 18px", marginBottom: 20,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: eligColor }}>
            {eligLabel}
          </div>
          <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
            NIHSS: {nihssScore} · {demo?.age ? `Age ${demo.age}` : "Age not set"} · BP {sbp || "--"}/{dbp || "--"}
          </div>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, color: eligColor }}>{
          eligibility === "eligible" ? "✓" : eligibility === "contraindicated" ? "✗" : "?"
        }</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Inclusion */}
        <div style={S.card}>
          <div style={{ ...S.cardTitle, color: "#4ade80" }}>Inclusion Criteria (all must be met)</div>
          {TPA_INCLUSION.map((c, i) => (
            <div key={i} onClick={() => setIncl(p => ({ ...p, [i]: !p[i] }))}
              style={{ display: "flex", gap: 10, padding: "7px 0", cursor: "pointer",
                borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
                background: incl[i] ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.05)",
                border: `2px solid ${incl[i] ? "#4ade80" : "rgba(255,255,255,0.15)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{incl[i] && <span style={{ color: "#4ade80", fontSize: 11 }}>✓</span>}</div>
              <span style={{ fontSize: 12, color: incl[i] ? "#6b7280" : "#94a3b8" }}>{c}</span>
            </div>
          ))}
        </div>

        {/* Absolute Exclusions */}
        <div style={S.card}>
          <div style={{ ...S.cardTitle, color: "#f87171" }}>Absolute Exclusions (none must be present)</div>
          {TPA_EXCLUSION_ABS.map((c, i) => (
            <div key={i} onClick={() => setExclAbs(p => ({ ...p, [i]: !p[i] }))}
              style={{ display: "flex", gap: 10, padding: "7px 0", cursor: "pointer",
                borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
                background: exclAbs[i] ? "rgba(248,113,113,0.3)" : "rgba(255,255,255,0.05)",
                border: `2px solid ${exclAbs[i] ? "#f87171" : "rgba(255,255,255,0.15)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{exclAbs[i] && <span style={{ color: "#f87171", fontSize: 11 }}>✗</span>}</div>
              <span style={{ fontSize: 12, color: exclAbs[i] ? "#f87171" : "#94a3b8" }}>{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Relative Exclusions */}
      <div style={S.card}>
        <div style={{ ...S.cardTitle, color: "#fbbf24" }}>Relative Exclusions (3-4.5h window — discuss with neurology)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
          {TPA_EXCLUSION_REL.map((c, i) => (
            <div key={i} onClick={() => setExclRel(p => ({ ...p, [i]: !p[i] }))}
              style={{ display: "flex", gap: 10, padding: "7px 0", cursor: "pointer",
                borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
                background: exclRel[i] ? "rgba(251,191,36,0.3)" : "rgba(255,255,255,0.05)",
                border: `2px solid ${exclRel[i] ? "#fbbf24" : "rgba(255,255,255,0.15)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{exclRel[i] && <span style={{ color: "#fbbf24", fontSize: 11 }}>~</span>}</div>
              <span style={{ fontSize: 12, color: exclRel[i] ? "#fbbf24" : "#94a3b8" }}>{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Alteplase Dose Calculator */}
      <div style={S.card}>
        <div style={{ ...S.cardTitle, color: "#2dd4bf" }}>Alteplase Dose (0.9 mg/kg, max 90 mg)</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>WEIGHT (kg)</div>
            <input
              style={{ ...S.input, width: 120 }}
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="kg"
            />
          </div>
          {altepTotal && (
            <>
              <div style={{ ...S.card, background: "rgba(20,184,166,0.08)", marginBottom: 0, padding: "10px 16px" }}>
                <div style={{ color: "#64748b", fontSize: 11 }}>TOTAL DOSE</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: "#2dd4bf", fontWeight: 700 }}>
                  {altepTotal} mg
                </div>
              </div>
              <div style={{ ...S.card, background: "rgba(251,191,36,0.06)", marginBottom: 0, padding: "10px 16px" }}>
                <div style={{ color: "#64748b", fontSize: 11 }}>IV BOLUS (10% over 1 min)</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: "#fbbf24", fontWeight: 700 }}>
                  {altepBolus} mg
                </div>
              </div>
              <div style={{ ...S.card, background: "rgba(56,189,248,0.06)", marginBottom: 0, padding: "10px 16px" }}>
                <div style={{ color: "#64748b", fontSize: 11 }}>INFUSION (90% over 60 min)</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: "#38bdf8", fontWeight: 700 }}>
                  {altepInfuse} mg
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* BP Management */}
      <div style={S.card}>
        <div style={S.cardTitle}>BP Management</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {["Clinical Scenario","Intervention","Target"].map(h => (
                  <th key={h} style={{ color: "#64748b", fontWeight: 600, padding: "6px 10px",
                    borderBottom: "1px solid rgba(255,255,255,0.08)", textAlign: "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BP_TABLE.map((row, i) => (
                <tr key={i}>
                  <td style={{ padding: "8px 10px", color: "#94a3b8", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{row.condition}</td>
                  <td style={{ padding: "8px 10px", color: "#e2e8f0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{row.target}</td>
                  <td style={{ padding: "8px 10px", color: "#fbbf24", borderBottom: "1px solid rgba(255,255,255,0.04)", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700 }}>{row.goal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Thrombectomy Criteria */}
      <div style={S.card}>
        <div style={{ ...S.cardTitle, color: "#fb923c" }}>Thrombectomy Criteria (AHA/ASA 2019)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 20px", fontSize: 12, color: "#94a3b8" }}>
          {[
            "NIHSS ≥ 6",
            "Pre-stroke mRS 0–1",
            "Causative occlusion of ICA or MCA M1",
            "Age ≥ 18",
            "CT/CTA/MRI confirms LVO",
            "Treatment can be initiated within 6 hr of onset",
            "ASPECTS score ≥ 6 (CT perfusion CTP/DWI)",
            "Extended window 6-24h: DAWN or DEFUSE-3 criteria",
          ].map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 8, padding: "5px 0",
              borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ color: "#fb923c" }}>▸</span>{c}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── NEURO CONSULT TAB ────────────────────────────────────────────────────────
const CONSULT_CHECKLIST = [
  "Stroke history and symptom timeline reviewed",
  "NIHSS documented",
  "CT head reviewed with radiology",
  "CTA/CTP reviewed — LVO identified / excluded",
  "tPA eligibility determination documented",
  "tPA administration or exclusion discussed",
  "BP management orders placed",
  "Antiplatelet or anticoagulation plan reviewed",
  "Statin initiated (if ischemic)",
  "Swallowing screen ordered",
  "PT/OT/Speech consults placed",
  "Echocardiogram ordered",
  "Telemetry for AF detection",
  "Carotid imaging ordered or scheduled",
  "Stroke unit or ICU bed confirmed",
];

function NeuroConsultTab({ demo, vitals, nihss }) {
  const [times, setTimes] = useState({ arrival: "", consult: "", tpa: "", needle: "" });
  const [recs, setRecs] = useState({});
  const [notes, setNotes] = useState("");

  const nihssScore = NIHSS_ITEMS.reduce((sum, item) => {
    const v = nihss?.[item.id];
    if (!v || v === "UN") return sum;
    return sum + parseInt(v, 10);
  }, 0);
  const sev = NIHSS_SEVERITY(nihssScore);

  const dtn = (() => {
    if (!times.arrival || !times.tpa) return null;
    const parse = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
    const diff = parse(times.tpa) - parse(times.arrival);
    return diff >= 0 ? diff : diff + 1440;
  })();

  const summary = [
    demo?.age    ? `${demo.age}${demo.sex ? " " + demo.sex : ""} presenting with acute stroke syndrome.` : null,
    `NIHSS ${nihssScore} — ${sev.label}.`,
    times.arrival ? `Arrival: ${times.arrival}.` : null,
    times.consult ? `Neurology consulted: ${times.consult}.` : null,
    times.tpa     ? `tPA administered: ${times.tpa}${dtn !== null ? ` (DTN ${dtn} min)` : ""}.` : null,
    notes || null,
  ].filter(Boolean).join(" ");

  return (
    <div>
      {/* Time Tracker */}
      <div style={S.card}>
        <div style={S.cardTitle}>Stroke Time Tracker</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { key: "arrival", label: "Door / Arrival" },
            { key: "consult",  label: "Neurology Called" },
            { key: "tpa",      label: "tPA Given" },
            { key: "needle",   label: "Needle Time" },
          ].map(({ key, label }) => (
            <div key={key}>
              <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>{label}</div>
              <input
                type="time"
                style={S.input}
                value={times[key]}
                onChange={e => setTimes(t => ({ ...t, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        {dtn !== null && (
          <div style={{
            marginTop: 14, padding: "10px 16px",
            background: dtn <= 60 ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
            border: `1px solid ${dtn <= 60 ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
            borderRadius: 8, display: "flex", justifyContent: "space-between",
          }}>
            <span style={{ color: "#94a3b8", fontSize: 13 }}>Door-to-Needle Time</span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700,
              color: dtn <= 60 ? "#4ade80" : "#f87171",
            }}>{dtn} min {dtn <= 60 ? "✓ Goal met" : "✗ > 60 min goal"}</span>
          </div>
        )}
      </div>

      {/* Recommendations Checklist */}
      <div style={S.card}>
        <div style={S.cardTitle}>Neuro Recommendations</div>
        {CONSULT_CHECKLIST.map((item, i) => (
          <div key={i} onClick={() => setRecs(p => ({ ...p, [i]: !p[i] }))}
            style={{ display: "flex", gap: 10, padding: "8px 0", cursor: "pointer",
              borderBottom: "1px solid rgba(255,255,255,0.04)", opacity: recs[i] ? 0.5 : 1 }}>
            <div style={{
              width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
              background: recs[i] ? "rgba(20,184,166,0.3)" : "rgba(255,255,255,0.05)",
              border: `2px solid ${recs[i] ? "#2dd4bf" : "rgba(255,255,255,0.15)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{recs[i] && <span style={{ color: "#2dd4bf", fontSize: 11 }}>✓</span>}</div>
            <span style={{ fontSize: 13, color: recs[i] ? "#4b5563" : "#94a3b8",
              textDecoration: recs[i] ? "line-through" : "none" }}>{item}</span>
          </div>
        ))}
      </div>

      {/* Case Summary */}
      <div style={S.card}>
        <div style={S.cardTitle}>Case Summary</div>
        <textarea
          rows={4}
          style={{ ...S.input, resize: "vertical", lineHeight: 1.6 }}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Additional neuro recommendations, disposition plan..."
        />
        {summary && (
          <div style={{
            marginTop: 12, background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8,
            padding: "12px 14px", fontSize: 13, color: "#94a3b8", lineHeight: 1.7,
          }}>
            <span style={{ color: "#64748b", fontSize: 11, display: "block", marginBottom: 6 }}>AUTO-SUMMARY</span>
            {summary}
          </div>
        )}
      </div>

      {/* Secondary Prevention Quick Reference */}
      <div style={S.card}>
        <div style={{ ...S.cardTitle, color: "#38bdf8" }}>Secondary Prevention (by stroke type)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
          {[
            { type: "Cardioembolic (AF)", rx: "Anticoagulation (DOAC preferred); rate control" },
            { type: "Large vessel atherosclerosis", rx: "Dual antiplatelet × 21d then single; high-intensity statin" },
            { type: "Small vessel (lacunar)", rx: "Single antiplatelet; BP control target < 130/80" },
            { type: "Cryptogenic", rx: "Antiplatelet; prolonged cardiac monitoring; statin" },
            { type: "All ischemic strokes", rx: "Statin therapy; BP target < 130/80; lifestyle mod" },
            { type: "Hemorrhagic stroke", rx: "No antiplatelet/anticoag acutely; aggressive BP control" },
          ].map((row, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ color: "#38bdf8", fontWeight: 600, marginBottom: 4 }}>{row.type}</div>
              <div style={{ color: "#94a3b8" }}>{row.rx}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── STROKEHUB ─────────────────────────────────────────────────────────────────
const TABS = ["NIHSS", "Workup", "Treatment", "Neuro Consult"];

export default function StrokeHub({ embedded = false, onBack, demo = {}, vitals = {}, cc = {}, nihssInit = {} }) {
  const [tab, setTab]         = useState(0);
  const [nihss, setNihss]     = useState(nihssInit);
  const [checked, setChecked] = useState({});

  const handleBack = useCallback(() => {
    if (onBack) { onBack(); } else { window.history.back(); }
  }, [onBack]);

  const nihssScore = NIHSS_ITEMS.reduce((sum, item) => {
    const v = nihss[item.id];
    if (!v || v === "UN") return sum;
    return sum + parseInt(v, 10);
  }, 0);

  return (
    <div style={embedded ? { background: "transparent", color: "#e8edf5", fontFamily: "'DM Sans', sans-serif" } : S.wrap}>
      {/* Header */}
      <div style={S.header}>
        <button style={S.backBtn} onClick={handleBack}>← Back</button>
        <div style={S.title}>StrokeHub</div>
        <div style={S.badge}>STROKE PROTOCOL</div>
        {nihssScore > 0 && (
          <div style={{
            marginLeft: "auto", fontFamily: "'JetBrains Mono', monospace",
            color: NIHSS_SEVERITY(nihssScore).color, fontSize: 14, fontWeight: 700,
          }}>
            NIHSS {nihssScore} — {NIHSS_SEVERITY(nihssScore).label}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {TABS.map((t, i) => (
          <button key={t} style={S.tab(i === tab)} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>

      {/* Body */}
      <div style={S.body}>
        {tab === 0 && <NIHSSTab nihss={nihss} setNihss={setNihss} />}
        {tab === 1 && <WorkupTab checked={checked} setChecked={setChecked} />}
        {tab === 2 && <TreatmentTab demo={demo} vitals={vitals} nihss={nihss} />}
        {tab === 3 && <NeuroConsultTab demo={demo} vitals={vitals} nihss={nihss} />}
      </div>
    </div>
  );
}