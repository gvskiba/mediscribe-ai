import { useState, useEffect, useCallback, useRef } from "react";

const MONO = "'JetBrains Mono',monospace";
const SANS = "'DM Sans',sans-serif";
const SERIF = "'Playfair Display',serif";

const SYSTEMS = [
  { id: "constitutional", label: "Constitutional", key: "C", symptoms: ["Fever","Chills","Fatigue","Weight loss","Night sweats","Malaise"] },
  { id: "heent",          label: "HEENT",          key: "H", symptoms: ["Headache","Vision change","Eye pain","Ear pain","Hearing loss","Sore throat","Nasal congestion","Epistaxis"] },
  { id: "cardiovascular", label: "Cardiovascular",  key: "V", symptoms: ["Chest pain","Palpitations","Leg swelling","Orthopnea","PND","Syncope","Near-syncope"] },
  { id: "respiratory",    label: "Respiratory",     key: "R", symptoms: ["Shortness of breath","Cough","Wheezing","Hemoptysis","Pleuritic chest pain","Dyspnea on exertion"] },
  { id: "gi",             label: "GI / Abdomen",    key: "G", symptoms: ["Nausea","Vomiting","Diarrhea","Constipation","Abdominal pain","Hematochezia","Melena","Dysphagia","Heartburn"] },
  { id: "gu",             label: "Genitourinary",   key: "U", symptoms: ["Dysuria","Hematuria","Urinary frequency","Urinary urgency","Flank pain","Discharge","Pelvic pain"] },
  { id: "msk",            label: "MSK",             key: "M", symptoms: ["Joint pain","Joint swelling","Back pain","Muscle pain","Weakness","Limited ROM","Morning stiffness"] },
  { id: "neuro",          label: "Neurological",    key: "N", symptoms: ["Headache","Dizziness","Numbness","Tingling","Weakness","Confusion","Memory loss","Seizure","Tremor"] },
  { id: "skin",           label: "Skin",            key: "S", symptoms: ["Rash","Pruritus","Wound","Lesion","Bruising","Jaundice","Hair loss"] },
  { id: "psych",          label: "Psychiatric",     key: "P", symptoms: ["Depression","Anxiety","Suicidal ideation","Hallucinations","Sleep disturbance","Mood changes"] },
  { id: "endocrine",      label: "Endocrine",       key: "E", symptoms: ["Polydipsia","Polyuria","Heat intolerance","Cold intolerance","Increased appetite","Decreased appetite"] },
  { id: "heme",           label: "Heme / Immune",   key: "I", symptoms: ["Easy bruising","Bleeding","Lymphadenopathy","Frequent infections","Transfusion history"] },
];

const KEY_MAP = Object.fromEntries(SYSTEMS.map((s, i) => [s.key, i]));

// Additional systems NOT in the main KB grid — available via the "Other Systems" picker.
const ADDITIONAL_SYSTEMS = [
  "Endocrine",
  "Heme / Immune",
  "Reproductive / OB-GYN",
  "Psychiatric",
  "Allergic / Immunologic",
  "Eyes (Ophthalmologic)",
  "Ears / Nose / Throat",
  "Vascular / Peripheral",
  "Lymphatic",
  "Integumentary",
];

function buildRosText(statuses, positives) {
  return SYSTEMS
    .filter(s => statuses[s.id] !== "unset")
    .map(s => {
      if (statuses[s.id] === "all-negative") return `${s.label}: Negative.`;
      const pos = positives[s.id] || [];
      const neg = s.symptoms.filter(sym => !pos.includes(sym));
      const posPart = pos.length ? `Positive for ${pos.join(", ")}` : "";
      const negPart = neg.length ? `Denies ${neg.join(", ")}` : "";
      return `${s.label}: ${[posPart, negPart].filter(Boolean).join("; ")}.`;
    })
    .join("\n");
}

export function QuickNoteROSHelper({ ros, onChange, defaultText }) {
  const panelRef  = useRef(null);
  const cardRefs  = useRef({});

  const initStatuses  = () => Object.fromEntries(SYSTEMS.map(s => [s.id, "unset"]));
  const initPositives = () => Object.fromEntries(SYSTEMS.map(s => [s.id, []]));

  const [mode,    setMode]    = useState(defaultText ? "text" : "kb");
  const [textVal, setTextVal] = useState(defaultText || "");

  // Sync defaultText into textVal when it changes from outside
  // (CC selection, AI generation).
  useEffect(() => {
    if (defaultText && defaultText !== textVal) {
      setTextVal(defaultText);
      setMode("text");
      onChange(defaultText);
    }
  }, [defaultText]);

  const [statuses,      setStatuses]      = useState(initStatuses);
  const [positives,     setPositives]     = useState(initPositives);
  const [kbActive,      setKbActive]      = useState(false);
  const [focusedIdx,    setFocusedIdx]    = useState(0);
  const [focusedSymIdx, setFocusedSymIdx] = useState(null);
  const [showLegend,    setShowLegend]    = useState(false);

  // Other Systems — additional systems not in the main KB grid
  const [otherSystems,    setOtherSystems]    = useState([]);
  const [showOtherPicker, setShowOtherPicker] = useState(false);
  const [otherFreeText,   setOtherFreeText]   = useState("");

  const emit = useCallback((nextStatuses, nextPositives) => {
    if (!onChange) return;
    const mainText = buildRosText(nextStatuses, nextPositives);
    const combined = [mainText,
      ...otherSystems.filter(s => s.text.trim()).map(s => `${s.system}: ${s.text.trim()}`)
    ].filter(Boolean).join("\n");
    onChange(combined);
  }, [onChange, otherSystems]);

  const markAllNegative = useCallback((id, nextStatuses, nextPositives) => {
    const ns = nextStatuses || { ...statuses, [id]: "all-negative" };
    const np = nextPositives || { ...positives, [id]: [] };
    if (!nextStatuses) setStatuses(ns);
    if (!nextPositives) setPositives(np);
    emit(ns, np);
    return { ns, np };
  }, [statuses, positives, emit]);

  const clearSystem = useCallback((id) => {
    const ns = { ...statuses, [id]: "unset" };
    const np = { ...positives, [id]: [] };
    setStatuses(ns); setPositives(np);
    emit(ns, np);
  }, [statuses, positives, emit]);

  const markAllNegAll = useCallback(() => {
    const ns = Object.fromEntries(SYSTEMS.map(s => [s.id, "all-negative"]));
    const np = initPositives();
    setStatuses(ns); setPositives(np);
    emit(ns, np);
  }, [emit]);

  const resetAll = useCallback(() => {
    const ns = initStatuses();
    const np = initPositives();
    setStatuses(ns); setPositives(np);
    emit(ns, np);
  }, [emit]);

  const toggleSymptom = useCallback((id, symptom) => {
    setPositives(prev => {
      const cur = prev[id] || [];
      const next = cur.includes(symptom) ? cur.filter(s => s !== symptom) : [...cur, symptom];
      const np = { ...prev, [id]: next };
      const ns = { ...statuses, [id]: next.length > 0 ? "partial" : "unset" };
      setStatuses(ns);
      emit(ns, np);
      return np;
    });
  }, [statuses, emit]);

  const setSymPositive = useCallback((id, symptom) => {
    setPositives(prev => {
      const cur = prev[id] || [];
      if (cur.includes(symptom)) return prev;
      const np = { ...prev, [id]: [...cur, symptom] };
      const ns = { ...statuses, [id]: "partial" };
      setStatuses(ns);
      emit(ns, np);
      return np;
    });
  }, [statuses, emit]);

  const setSymNegative = useCallback((id, symptom) => {
    setPositives(prev => {
      const cur = prev[id] || [];
      if (!cur.includes(symptom)) return prev;
      const np = { ...prev, [id]: cur.filter(s => s !== symptom) };
      const ns = { ...statuses, [id]: np[id].length > 0 ? "partial" : "unset" };
      setStatuses(ns);
      emit(ns, np);
      return np;
    });
  }, [statuses, emit]);

  const moveSys = useCallback((dir) => {
    const next = (focusedIdx + dir + SYSTEMS.length) % SYSTEMS.length;
    setFocusedIdx(next);
    setFocusedSymIdx(null);
    cardRefs.current[SYSTEMS[next].id]?.focus();
  }, [focusedIdx]);

  const handleKeyDown = useCallback((e) => {
    if (!kbActive) return;
    if (e.target.tagName === "INPUT") return;
    const meta = e.metaKey || e.ctrlKey;

    if (meta && e.key === "Enter") { e.preventDefault(); markAllNegAll(); return; }
    if (meta && e.key === "0")     { e.preventDefault(); resetAll(); return; }
    if (e.key === "?")             { e.preventDefault(); setShowLegend(v => !v); return; }

    const sys = SYSTEMS[focusedIdx];

    // Symptom level
    if (focusedSymIdx !== null) {
      const symptoms = sys.symptoms;
      if (e.key === "ArrowLeft")  { e.preventDefault(); setFocusedSymIdx((focusedSymIdx - 1 + symptoms.length) % symptoms.length); return; }
      if (e.key === "ArrowRight") { e.preventDefault(); setFocusedSymIdx((focusedSymIdx + 1) % symptoms.length); return; }
      if (e.key === " ")          { e.preventDefault(); toggleSymptom(sys.id, symptoms[focusedSymIdx]); return; }
      if (e.key === "+")          { e.preventDefault(); setSymPositive(sys.id, symptoms[focusedSymIdx]); return; }
      if (e.key === "-")          { e.preventDefault(); setSymNegative(sys.id, symptoms[focusedSymIdx]); return; }
      if (e.key === "ArrowUp" || e.key === "Escape") { e.preventDefault(); setFocusedSymIdx(null); return; }
      if (e.key === "ArrowDown")  { e.preventDefault(); setFocusedSymIdx(null); moveSys(1); return; }
      return;
    }

    // System level
    if (e.key === "Escape")      { e.preventDefault(); setKbActive(false); return; }
    if (e.key === "Enter" || e.key === "1") { e.preventDefault(); const ns = { ...statuses, [sys.id]: "all-negative" }; const np = { ...positives, [sys.id]: [] }; setStatuses(ns); setPositives(np); emit(ns, np); return; }
    if (e.key === "0")           { e.preventDefault(); clearSystem(sys.id); return; }
    if (e.key === " " || e.key === "ArrowDown") { e.preventDefault(); setFocusedSymIdx(0); return; }
    if (e.key === "ArrowUp")     { e.preventDefault(); moveSys(-1); return; }

    // System jump
    const upper = e.key.toUpperCase();
    if (KEY_MAP[upper] !== undefined) {
      e.preventDefault();
      const idx = KEY_MAP[upper];
      setFocusedIdx(idx);
      setFocusedSymIdx(null);
      cardRefs.current[SYSTEMS[idx].id]?.focus();
    }
  }, [kbActive, focusedIdx, focusedSymIdx, statuses, positives, emit, markAllNegAll, resetAll, toggleSymptom, setSymPositive, setSymNegative, moveSys, clearSystem]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handlePanelFocus = useCallback((e) => {
    setKbActive(true);
    SYSTEMS.forEach((s, i) => { if (cardRefs.current[s.id] === e.target) setFocusedIdx(i); });
  }, []);

  const handlePanelBlur = useCallback((e) => {
    if (!panelRef.current?.contains(e.relatedTarget)) setKbActive(false);
  }, []);

  const negCount   = SYSTEMS.filter(s => statuses[s.id] === "all-negative").length;
  const allPos     = SYSTEMS.flatMap(s => (positives[s.id] || []).map(sym => ({ sysId: s.id, sysLabel: s.label, sym })));
  const partialCount = SYSTEMS.filter(s => statuses[s.id] === "partial").length;
  const setCount   = negCount + partialCount;
  const focusedSys = SYSTEMS[focusedIdx];

  let statusLabel = "Focus exam field to activate KB mode";
  if (kbActive) {
    if (focusedSymIdx !== null) {
      statusLabel = `${focusedSys.label} › ${focusedSys.symptoms[focusedSymIdx]}`;
    } else {
      statusLabel = `[${focusedSys.label.toUpperCase()}] (← → symptoms · Space toggle · 1 all-neg)`;
    }
  }

  const mainRosText = mode === "text" ? textVal : buildRosText(statuses, positives);

  return (
    <div
      ref={panelRef}
      onFocus={handlePanelFocus}
      onBlur={handlePanelBlur}
      style={{ display: "flex", flexDirection: "column", gap: 8 }}
    >
      {/* Mode Toggle */}
      <div style={{
        display:"flex", alignItems:"center", gap:6, marginBottom:8,
      }}>
        <button
          onClick={() => setMode("text")}
          style={{
            padding:"2px 10px", borderRadius:5, cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace", fontSize:7,
            fontWeight:700, letterSpacing:.4,
            border: mode==="text"
              ? "1px solid rgba(0,229,192,.5)"
              : "1px solid rgba(42,79,122,.3)",
            background: mode==="text"
              ? "rgba(0,229,192,.1)" : "transparent",
            color: mode==="text" ? "var(--qn-teal)" : "var(--qn-txt4)",
          }}
        >
          ✎ Text
        </button>
        <button
          onClick={() => setMode("kb")}
          style={{
            padding:"2px 10px", borderRadius:5, cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace", fontSize:7,
            fontWeight:700, letterSpacing:.4,
            border: mode==="kb"
              ? "1px solid rgba(0,229,192,.5)"
              : "1px solid rgba(42,79,122,.3)",
            background: mode==="kb"
              ? "rgba(0,229,192,.1)" : "transparent",
            color: mode==="kb" ? "var(--qn-teal)" : "var(--qn-txt4)",
          }}
        >
          ⊞ KB Mode
        </button>
        {defaultText && mode==="kb" && (
          <span style={{
            fontFamily:"'JetBrains Mono',monospace", fontSize:7,
            color:"rgba(245,200,66,.5)",
          }}>
            AI-generated ROS available — switch to Text to view
          </span>
        )}
      </div>

      {mode === "text" && (
        <textarea
          value={textVal}
          onChange={e => {
            setTextVal(e.target.value);
            const combined = [e.target.value,
              ...otherSystems.filter(s => s.text.trim()).map(s => `${s.system}: ${s.text.trim()}`)
            ].filter(Boolean).join("\n");
            onChange(combined);
          }}
          rows={6}
          style={{
            width:"100%", boxSizing:"border-box",
            resize:"vertical", padding:"9px 12px",
            borderRadius:8, background:"rgba(14,37,68,.6)",
            border:"1px solid rgba(42,79,122,.4)",
            color:"var(--qn-txt)", fontFamily:"'DM Sans',sans-serif",
            fontSize:12, lineHeight:1.7, outline:"none",
          }}
          onFocus={e => { e.target.style.borderColor="rgba(0,229,192,.5)"; }}
          onBlur={e  => { e.target.style.borderColor="rgba(42,79,122,.4)"; }}
          placeholder="Review of systems — edit or switch to KB Mode..."
        />
      )}

      {mode === "kb" && (
        <>
      {/* KB Status Bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        background: kbActive ? "rgba(0,229,192,0.08)" : "rgba(11,30,54,0.4)",
        border: `1px solid ${kbActive ? "rgba(0,229,192,0.25)" : "rgba(0,184,154,0.1)"}`,
        borderRadius: 6, padding: "5px 10px",
      }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: kbActive ? "#00e5c0" : "rgba(200,223,240,0.2)" }} />
        <span style={{ fontFamily: MONO, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em", flex: 1, color: kbActive ? "#00e5c0" : "rgba(200,223,240,0.35)" }}>
          {statusLabel}
        </span>
        {kbActive && (
          <span style={{ fontFamily: MONO, fontSize: 9.5, color: "rgba(0,229,192,0.6)", whiteSpace: "nowrap" }}>
            {negCount} neg · {allPos.length} pos({partialCount} sys) · {setCount}/12
          </span>
        )}
        <button onClick={() => setShowLegend(v => !v)} style={{ fontFamily: MONO, fontSize: 9, padding: "1px 6px", border: "1px solid rgba(200,223,240,0.15)", borderRadius: 3, background: "transparent", color: "rgba(200,223,240,0.5)", cursor: "pointer" }}>?</button>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={markAllNegAll} style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "4px 10px", borderRadius: 5, cursor: "pointer", border: "1px solid rgba(0,229,192,0.4)", background: "rgba(0,229,192,0.08)", color: "#00e5c0", display: "flex", alignItems: "center", gap: 6 }}>
          ✓ All Negative
          {kbActive && <span style={{ color: "rgba(0,229,192,0.4)", fontSize: 9 }}>⌘↵</span>}
        </button>
        <button onClick={resetAll} style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "4px 10px", borderRadius: 5, cursor: "pointer", border: "1px solid rgba(200,223,240,0.12)", background: "transparent", color: "rgba(200,223,240,0.4)", display: "flex", alignItems: "center", gap: 6 }}>
          ↺ Reset
          {kbActive && <span style={{ color: "rgba(200,223,240,0.25)", fontSize: 9 }}>⌘0</span>}
        </button>
      </div>

      {/* Positive findings strip */}
      {allPos.length > 0 && (
        <div style={{ background: "rgba(255,77,79,0.06)", border: "1px solid rgba(255,77,79,0.2)", borderRadius: 6, padding: "7px 10px", display: "flex", flexWrap: "wrap", gap: 5 }}>
          {allPos.map(({ sysId, sysLabel, sym }) => (
            <span key={`${sysId}-${sym}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, border: "1px solid rgba(255,77,79,0.35)", background: "rgba(255,77,79,0.08)", borderRadius: 4, padding: "2px 6px" }}>
              <span style={{ fontFamily: MONO, fontSize: 9, color: "rgba(255,120,80,0.6)" }}>{sysLabel.slice(0,3).toUpperCase()}</span>
              <span style={{ fontFamily: SANS, fontSize: 10, color: "#ff7a45" }}>{sym}</span>
              <button onClick={() => toggleSymptom(sysId, sym)} style={{ fontFamily: MONO, fontSize: 9, color: "rgba(255,77,79,0.6)", background: "transparent", border: "none", cursor: "pointer", padding: 0, lineHeight: 1 }}>✕</button>
            </span>
          ))}
        </div>
      )}

      {/* System Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 6 }}>
        {SYSTEMS.map((sys, idx) => {
          const status     = statuses[sys.id];
          const posSyms    = positives[sys.id] || [];
          const isFocused  = kbActive && focusedIdx === idx;
          const isNeg      = status === "all-negative";
          const isPartial  = status === "partial";

          let cardBorder = "1px solid rgba(0,184,154,0.1)";
          let cardBg     = "rgba(11,30,54,0.35)";
          if (isNeg)     { cardBorder = "1px solid rgba(0,184,154,0.4)";  cardBg = "rgba(0,184,154,0.07)"; }
          if (isPartial) { cardBorder = "1px solid rgba(255,165,0,0.4)";  cardBg = "rgba(255,165,0,0.05)"; }
          if (isFocused) { cardBorder = "2px solid #00e5c0";              cardBg = "rgba(0,229,192,0.08)"; }

          const labelColor = isNeg ? "#00b89a" : isPartial ? "#f5a623" : "#a8d4f0";
          const dotColor   = isNeg ? "#00e5c0" : isPartial ? "#f5a623" : "rgba(200,223,240,0.2)";

          const showSymptoms = isFocused || isPartial;

          return (
            <div
              key={sys.id}
              ref={el => cardRefs.current[sys.id] = el}
              tabIndex={0}
              onClick={() => { setFocusedIdx(idx); setFocusedSymIdx(null); setKbActive(true); cardRefs.current[sys.id]?.focus(); }}
              onFocus={() => { setFocusedIdx(idx); setKbActive(true); }}
              style={{ border: cardBorder, background: cardBg, borderRadius: 7, padding: "7px 10px", cursor: "pointer", outline: "none", transition: "border 0.1s, background 0.1s" }}
            >
              {/* Card header */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                <span style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: labelColor, flex: 1 }}>{sys.label}</span>
                <span style={{ width: 16, height: 16, borderRadius: 3, flexShrink: 0, border: `1px solid ${isFocused ? "#00e5c0" : "rgba(200,223,240,0.2)"}`, fontFamily: MONO, fontSize: 9, fontWeight: 700, color: isFocused ? "#00e5c0" : "rgba(200,223,240,0.35)", display: "flex", alignItems: "center", justifyContent: "center", background: isFocused ? "rgba(0,229,192,0.1)" : "transparent" }}>{sys.key}</span>
                <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: dotColor }} />
              </div>

              {/* Partial summary when not focused */}
              {isPartial && !isFocused && posSyms.length > 0 && (
                <div style={{ fontFamily: SANS, fontSize: 10, color: "#f5a623", marginBottom: 4, lineHeight: 1.4 }}>
                  + {posSyms.join(", ")}
                </div>
              )}

              {/* Symptom chips */}
              {showSymptoms && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: isFocused ? 6 : 0 }}>
                  {sys.symptoms.map((sym, si) => {
                    const isPos = posSyms.includes(sym);
                    const isKbFocused = isFocused && focusedSymIdx === si;
                    let chipBorder = "rgba(200,223,240,0.15)";
                    let chipColor  = "rgba(200,223,240,0.5)";
                    let chipBg     = "rgba(11,30,54,0.4)";
                    let chipFw     = 400;
                    if (isPos)       { chipBorder = "rgba(255,77,79,0.5)";    chipColor = "#ff7a45"; chipBg = "rgba(255,77,79,0.1)";  chipFw = 600; }
                    if (isKbFocused) { chipBorder = "#00e5c0";                chipColor = "#00e5c0"; chipBg = "rgba(0,229,192,0.1)";  }
                    return (
                      <span
                        key={sym}
                        onClick={e => { e.stopPropagation(); toggleSymptom(sys.id, sym); }}
                        style={{ fontFamily: SANS, fontSize: 10, fontWeight: chipFw, border: `1px solid ${chipBorder}`, color: chipColor, background: chipBg, borderRadius: 4, padding: "2px 6px", cursor: "pointer" }}
                      >
                        {sym}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* KB action chips when focused and no symptom focused */}
              {isFocused && focusedSymIdx === null && (
                <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
                  {[
                    { label: "↵ All Neg", color: "#00e5c0", border: "rgba(0,229,192,0.4)", action: () => { const ns = { ...statuses, [sys.id]: "all-negative" }; const np = { ...positives, [sys.id]: [] }; setStatuses(ns); setPositives(np); emit(ns, np); } },
                    { label: "↓ Symptoms", color: "rgba(0,229,192,0.5)", border: "rgba(0,229,192,0.2)", action: () => setFocusedSymIdx(0) },
                    { label: "0 Clear", color: "rgba(200,223,240,0.4)", border: "rgba(200,223,240,0.15)", action: () => clearSystem(sys.id) },
                  ].map(chip => (
                    <button key={chip.label} onClick={e => { e.stopPropagation(); chip.action(); }} style={{ flex: 1, fontFamily: MONO, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", border: `1px solid ${chip.border}`, borderRadius: 3, background: "transparent", color: chip.color, padding: "2px 0", cursor: "pointer" }}>
                      {chip.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend Overlay */}
      {showLegend && (
        <div onClick={() => setShowLegend(false)} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(3,8,16,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#081628", border: "1px solid #1a3555", borderRadius: 12, padding: "20px 24px", width: 440, maxWidth: "92vw", display: "flex", flexDirection: "column", gap: 16, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 700, color: "#00e5c0" }}>ROS Keyboard Reference</div>

            <LegendSection title="Jump to System">
              {SYSTEMS.map(s => <LegendRow key={s.id} keyLabel={s.key} desc={s.label} />)}
            </LegendSection>

            <LegendSection title="System-Level Actions">
              <LegendRow keyLabel="Enter / 1" desc="Mark all-negative" />
              <LegendRow keyLabel="Space / ↓" desc="Enter symptom navigation" />
              <LegendRow keyLabel="↑" desc="Move to previous system" />
              <LegendRow keyLabel="0" desc="Clear this system" />
              <LegendRow keyLabel="Esc" desc="Exit KB mode" />
            </LegendSection>

            <LegendSection title="Symptom-Level Actions">
              <LegendRow keyLabel="← →" desc="Move between symptoms" />
              <LegendRow keyLabel="Space" desc="Toggle positive / negative" />
              <LegendRow keyLabel="+" desc="Mark positive" />
              <LegendRow keyLabel="-" desc="Mark negative" />
              <LegendRow keyLabel="↑ / Esc" desc="Return to system level" />
              <LegendRow keyLabel="↓" desc="Move to next system" />
            </LegendSection>

            <LegendSection title="Global">
              <LegendRow keyLabel="⌘ / Ctrl + ↵" desc="Mark ALL systems negative" />
              <LegendRow keyLabel="⌘ / Ctrl + 0" desc="Reset ALL systems" />
              <LegendRow keyLabel="?" desc="Toggle this legend" />
            </LegendSection>

            <button onClick={() => setShowLegend(false)} style={{ alignSelf: "flex-end", fontFamily: MONO, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "5px 14px", borderRadius: 5, cursor: "pointer", border: "1px solid rgba(0,229,192,0.3)", background: "rgba(0,229,192,0.06)", color: "#00e5c0" }}>
              Close
            </button>
          </div>
        </div>
      )}
        </>
      )}

      {/* Other Systems */}
      <div style={{ marginTop: 12, borderTop: "1px solid rgba(42,79,122,.2)", paddingTop: 10 }}>

        {/* Render each added other system */}
        {otherSystems.map((s, idx) => (
          <div key={s.system} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <span style={{
              fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
              color:"var(--qn-txt4)", letterSpacing:.8, textTransform:"uppercase",
              minWidth:160, flexShrink:0,
            }}>
              {s.system}:
            </span>
            <input
              autoFocus={idx === otherSystems.length - 1}
              value={s.text}
              onChange={e => {
                const updated = otherSystems.map((sys, i) =>
                  i === idx ? { ...sys, text: e.target.value, done: e.target.value.trim().length > 0 } : sys
                );
                setOtherSystems(updated);
                const combined = [mainRosText,
                  ...updated.filter(sys => sys.text.trim()).map(sys => `${sys.system}: ${sys.text.trim()}`)
                ].filter(Boolean).join("\n");
                onChange(combined);
              }}
              placeholder={`(+/-) findings for ${s.system}...`}
              style={{
                flex:1, padding:"5px 10px", borderRadius:7,
                background:"rgba(14,37,68,.6)",
                border:"1px solid rgba(42,79,122,.4)",
                color:"var(--qn-txt)", fontFamily:"'DM Sans',sans-serif",
                fontSize:12, outline:"none",
              }}
              onFocus={e => { e.target.style.borderColor = "rgba(0,229,192,.5)"; }}
              onBlur={e  => { e.target.style.borderColor = "rgba(42,79,122,.4)"; }}
            />
            <button
              onClick={() => {
                const updated = otherSystems.filter((_, i) => i !== idx);
                setOtherSystems(updated);
                const combined = [mainRosText,
                  ...updated.filter(sys => sys.text.trim()).map(sys => `${sys.system}: ${sys.text.trim()}`)
                ].filter(Boolean).join("\n");
                onChange(combined);
              }}
              style={{
                padding:"3px 8px", borderRadius:5, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                border:"1px solid rgba(255,77,79,.2)", background:"transparent",
                color:"rgba(255,77,79,.4)",
              }}
            >
              ✕
            </button>
          </div>
        ))}

        {/* Add system button and picker */}
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <button
            onClick={() => setShowOtherPicker(p => !p)}
            style={{
              padding:"4px 12px", borderRadius:7, cursor:"pointer",
              fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
              letterSpacing:.5, textTransform:"uppercase",
              border:"1px solid rgba(0,229,192,.35)",
              background: showOtherPicker ? "rgba(0,229,192,.1)" : "transparent",
              color:"var(--qn-teal)",
            }}
          >
            + Add System
          </button>

          {/* Free-text other entry */}
          <input
            value={otherFreeText}
            onChange={e => setOtherFreeText(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && otherFreeText.trim()) {
                const newSystem = { system: "Other", text: otherFreeText.trim(), done: true };
                const updated = [...otherSystems, newSystem];
                setOtherSystems(updated);
                setOtherFreeText("");
                const combined = [mainRosText,
                  ...updated.filter(s => s.text.trim()).map(s => `${s.system}: ${s.text.trim()}`)
                ].filter(Boolean).join("\n");
                onChange(combined);
              }
            }}
            placeholder="Type finding + Enter to add..."
            style={{
              flex:1, minWidth:180, padding:"4px 10px", borderRadius:7,
              background:"rgba(14,37,68,.5)",
              border:"1px solid rgba(42,79,122,.3)",
              color:"var(--qn-txt)", fontFamily:"'DM Sans',sans-serif",
              fontSize:11, outline:"none",
            }}
            onFocus={e => { e.target.style.borderColor = "rgba(0,229,192,.4)"; }}
            onBlur={e  => { e.target.style.borderColor = "rgba(42,79,122,.3)"; }}
          />
        </div>

        {/* System picker dropdown */}
        {showOtherPicker && (
          <div style={{
            marginTop:8, display:"flex", flexWrap:"wrap", gap:6,
          }}>
            {ADDITIONAL_SYSTEMS
              .filter(s => !otherSystems.find(o => o.system === s))
              .map(sys => (
                <button
                  key={sys}
                  onClick={() => {
                    setOtherSystems(prev => [...prev, { system: sys, text: "", done: false }]);
                    setShowOtherPicker(false);
                  }}
                  style={{
                    padding:"4px 12px", borderRadius:16, cursor:"pointer",
                    fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:500,
                    border:"1px solid rgba(42,79,122,.4)",
                    background:"rgba(14,37,68,.5)",
                    color:"var(--qn-txt2)",
                  }}
                >
                  {sys}
                </button>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}

function LegendSection({ title, children }) {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 9, textTransform: "uppercase", color: "rgba(200,223,240,0.4)", letterSpacing: "0.08em", marginBottom: 8 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>{children}</div>
    </div>
  );
}

function LegendRow({ keyLabel, desc }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: "#00e5c0", border: "1px solid rgba(0,229,192,0.3)", background: "rgba(0,229,192,0.06)", minWidth: 80, padding: "2px 8px", borderRadius: 4, display: "inline-block", textAlign: "center" }}>{keyLabel}</span>
      <span style={{ fontFamily: SANS, fontSize: 12, color: "rgba(200,223,240,0.6)" }}>{desc}</span>
    </div>
  );
}

export default QuickNoteROSHelper;