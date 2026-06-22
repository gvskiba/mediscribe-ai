import { useState, useEffect, useCallback, useRef } from "react";

const MONO = "'JetBrains Mono',monospace";
const SANS = "'DM Sans',sans-serif";
const SERIF = "'Playfair Display',serif";

const SYSTEMS = [
  { id: "general",        label: "General",       key: "G", normal: "General: Alert and oriented x3, no acute distress, well-appearing." },
  { id: "heent",          label: "HEENT",          key: "H", normal: "HEENT: Normocephalic, atraumatic. Pupils equal, round, reactive to light. Oropharynx clear, mucous membranes moist. No lymphadenopathy." },
  { id: "neck",           label: "Neck",           key: "N", normal: "Neck: Supple, full range of motion, no meningismus, no thyromegaly, trachea midline." },
  { id: "cardiovascular", label: "Cardiovascular", key: "C", normal: "Cardiovascular: Regular rate and rhythm, S1 and S2 normal, no murmurs, rubs, or gallops. Distal pulses 2+ and equal bilaterally." },
  { id: "respiratory",    label: "Respiratory",    key: "R", normal: "Respiratory: Clear to auscultation bilaterally, no wheezes, rales, or rhonchi. Respirations non-labored." },
  { id: "abdomen",        label: "Abdomen",        key: "A", normal: "Abdomen: Soft, non-tender, non-distended. Bowel sounds present in all four quadrants. No guarding or rebound. No organomegaly." },
  { id: "back",           label: "Back",           key: "B", normal: "Back: No costovertebral angle tenderness. No spinal tenderness to palpation. No paraspinal muscle spasm." },
  { id: "extremities",    label: "Extremities",    key: "E", normal: "Extremities: No cyanosis, clubbing, or edema. Capillary refill less than 2 seconds bilaterally." },
  { id: "skin",           label: "Skin",           key: "S", normal: "Skin: Warm, dry, intact. No rashes, lesions, or diaphoresis." },
  { id: "neuro",          label: "Neuro",          key: "U", normal: "Neurological: Alert and oriented x3. Cranial nerves II-XII grossly intact. Motor strength 5/5 in all extremities. Sensation intact to light touch. Gait steady." },
  { id: "psych",          label: "Psych",          key: "P", normal: "Psychiatric: Cooperative, appropriate affect, normal mood, no suicidal or homicidal ideation, insight and judgment intact." },
  { id: "msk",            label: "MSK",            key: "M", normal: "Musculoskeletal: No joint swelling, erythema, or deformity. Full range of motion in all extremities. No bony tenderness to palpation." },
];

const KEY_MAP = Object.fromEntries(SYSTEMS.map((s, i) => [s.key, i]));

function buildExamText(statuses, customTexts) {
  return SYSTEMS
    .filter(s => statuses[s.id] !== "unset")
    .map(s => statuses[s.id] === "normal" ? s.normal : (customTexts[s.id] || s.normal))
    .join("\n");
}

export function QuickNoteExamHelper({ exam, onChange }) {
  const panelRef = useRef(null);
  const cardRefs = useRef({});
  const abnormalTextareaRefs = useRef({});

  const initStatuses = () => Object.fromEntries(SYSTEMS.map(s => [s.id, "unset"]));
  const initCustom   = () => Object.fromEntries(SYSTEMS.map(s => [s.id, ""]));

  const [statuses,    setStatuses]    = useState(initStatuses);
  const [customTexts, setCustomTexts] = useState(initCustom);
  const [kbActive,    setKbActive]    = useState(false);
  const [focusedIdx,  setFocusedIdx]  = useState(0);
  const [showLegend,  setShowLegend]  = useState(false);

  const emitChange = useCallback((nextStatuses, nextCustom) => {
    onChange(buildExamText(nextStatuses, nextCustom));
  }, [onChange]);

  const setStatus = useCallback((id, status, nextCustom) => {
    setStatuses(prev => {
      const next = { ...prev, [id]: status };
      emitChange(next, nextCustom || customTexts);
      return next;
    });
  }, [customTexts, emitChange]);

  const markNormal = useCallback((id) => {
    setStatuses(prev => {
      const next = { ...prev, [id]: "normal" };
      emitChange(next, customTexts);
      return next;
    });
  }, [customTexts, emitChange]);

  const markAbnormal = useCallback((id) => {
    setStatuses(prev => {
      const next = { ...prev, [id]: "abnormal" };
      emitChange(next, customTexts);
      return next;
    });
    setTimeout(() => {
      abnormalTextareaRefs.current[id]?.focus();
    }, 60);
  }, [customTexts, emitChange]);

  const clearSystem = useCallback((id) => {
    setStatuses(prev => {
      const next = { ...prev, [id]: "unset" };
      emitChange(next, customTexts);
      return next;
    });
  }, [customTexts, emitChange]);

  const markAllNormal = useCallback(() => {
    const next = Object.fromEntries(SYSTEMS.map(s => [s.id, "normal"]));
    setStatuses(next);
    emitChange(next, customTexts);
  }, [customTexts, emitChange]);

  const resetAll = useCallback(() => {
    const next = initStatuses();
    const nextC = initCustom();
    setStatuses(next);
    setCustomTexts(nextC);
    emitChange(next, nextC);
  }, [emitChange]);

  const handleCustomChange = useCallback((id, val) => {
    setCustomTexts(prev => {
      const next = { ...prev, [id]: val };
      emitChange(statuses, next);
      return next;
    });
  }, [statuses, emitChange]);

  // Keyboard handler
  const handleKeyDown = useCallback((e) => {
    if (!kbActive) return;

    const tag = e.target.tagName;
    const inTextarea = tag === "TEXTAREA" || tag === "INPUT";

    // Esc inside abnormal textarea → revert to normal
    if (e.key === "Escape" && inTextarea) {
      const sys = SYSTEMS[focusedIdx];
      markNormal(sys.id);
      cardRefs.current[sys.id]?.focus();
      e.preventDefault();
      return;
    }

    // Don't intercept letter keys when typing in a textarea
    if (inTextarea) return;

    const meta = e.metaKey || e.ctrlKey;

    if (meta && e.key === "Enter") { e.preventDefault(); markAllNormal(); return; }
    if (meta && e.key === "0")     { e.preventDefault(); resetAll(); return; }
    if (e.key === "?")             { e.preventDefault(); setShowLegend(v => !v); return; }

    // Arrow navigation
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = (focusedIdx - 1 + SYSTEMS.length) % SYSTEMS.length;
      setFocusedIdx(next);
      cardRefs.current[SYSTEMS[next].id]?.focus();
      return;
    }
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = (focusedIdx + 1) % SYSTEMS.length;
      setFocusedIdx(next);
      cardRefs.current[SYSTEMS[next].id]?.focus();
      return;
    }

    // Actions on focused system
    const sys = SYSTEMS[focusedIdx];
    if (e.key === "Enter" || e.key === "1") { e.preventDefault(); markNormal(sys.id);   return; }
    if (e.key === "2")                      { e.preventDefault(); markAbnormal(sys.id); return; }
    if (e.key === "0")                      { e.preventDefault(); clearSystem(sys.id);  return; }

    // System jump (single letter)
    const upper = e.key.toUpperCase();
    if (KEY_MAP[upper] !== undefined) {
      e.preventDefault();
      const idx = KEY_MAP[upper];
      setFocusedIdx(idx);
      cardRefs.current[SYSTEMS[idx].id]?.focus();
    }
  }, [kbActive, focusedIdx, markNormal, markAbnormal, clearSystem, markAllNormal, resetAll]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handlePanelFocus = useCallback((e) => {
    setKbActive(true);
    // If a card was focused, update focusedIdx
    SYSTEMS.forEach((s, i) => {
      if (cardRefs.current[s.id] === e.target) setFocusedIdx(i);
    });
  }, []);

  const handlePanelBlur = useCallback((e) => {
    if (!panelRef.current?.contains(e.relatedTarget)) {
      setKbActive(false);
    }
  }, []);

  const normalCount   = SYSTEMS.filter(s => statuses[s.id] === "normal").length;
  const abnormalCount = SYSTEMS.filter(s => statuses[s.id] === "abnormal").length;
  const focusedSys    = SYSTEMS[focusedIdx];

  return (
    <div
      ref={panelRef}
      onFocus={handlePanelFocus}
      onBlur={handlePanelBlur}
      style={{ display: "flex", flexDirection: "column", gap: 8 }}
    >
      {/* KB Status Bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        background: kbActive ? "rgba(0,229,192,0.08)" : "rgba(11,30,54,0.4)",
        border: `1px solid ${kbActive ? "rgba(0,229,192,0.25)" : "rgba(0,184,154,0.1)"}`,
        borderRadius: 6, padding: "5px 10px",
      }}>
        {/* Dot */}
        <div style={{
          width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
          background: kbActive ? "#00e5c0" : "rgba(200,223,240,0.2)",
        }} />
        {/* Label */}
        <span style={{
          fontFamily: MONO, fontSize: 10, textTransform: "uppercase",
          letterSpacing: "0.07em", flex: 1,
          color: kbActive ? "#00e5c0" : "rgba(200,223,240,0.35)",
        }}>
          {kbActive ? `[${focusedSys.label.toUpperCase()}] focused` : "Focus exam field to activate KB mode"}
        </span>
        {/* Stats */}
        {kbActive && (
          <span style={{ fontFamily: MONO, fontSize: 9.5, color: "rgba(0,229,192,0.6)", whiteSpace: "nowrap" }}>
            {normalCount} normal · {abnormalCount} abnormal
          </span>
        )}
        {/* ? button */}
        <button
          onClick={() => setShowLegend(v => !v)}
          style={{
            fontFamily: MONO, fontSize: 9, padding: "1px 6px",
            border: "1px solid rgba(200,223,240,0.15)", borderRadius: 3,
            background: "transparent", color: "rgba(200,223,240,0.5)", cursor: "pointer",
          }}>?</button>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={markAllNormal}
          style={{
            fontFamily: MONO, fontSize: 10, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.05em", padding: "4px 10px", borderRadius: 5, cursor: "pointer",
            border: "1px solid rgba(0,229,192,0.4)", background: "rgba(0,229,192,0.08)",
            color: "#00e5c0", display: "flex", alignItems: "center", gap: 6,
          }}>
          ✓ All Normal
          {kbActive && <span style={{ color: "rgba(0,229,192,0.4)", fontSize: 9 }}>⌘↵</span>}
        </button>
        <button
          onClick={resetAll}
          style={{
            fontFamily: MONO, fontSize: 10, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.05em", padding: "4px 10px", borderRadius: 5, cursor: "pointer",
            border: "1px solid rgba(200,223,240,0.12)", background: "transparent",
            color: "rgba(200,223,240,0.4)", display: "flex", alignItems: "center", gap: 6,
          }}>
          ↺ Reset
          {kbActive && <span style={{ color: "rgba(200,223,240,0.25)", fontSize: 9 }}>⌘0</span>}
        </button>
      </div>

      {/* System Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: 6,
      }}>
        {SYSTEMS.map((sys, idx) => {
          const status    = statuses[sys.id];
          const isFocused = kbActive && focusedIdx === idx;
          const isNormal   = status === "normal";
          const isAbnormal = status === "abnormal";

          let cardBorder = "1px solid rgba(0,184,154,0.1)";
          let cardBg     = "rgba(11,30,54,0.35)";
          if (isNormal)   { cardBorder = "1px solid rgba(0,184,154,0.4)";  cardBg = "rgba(0,184,154,0.07)"; }
          if (isAbnormal) { cardBorder = "1px solid rgba(255,77,79,0.4)";  cardBg = "rgba(255,77,79,0.06)"; }
          if (isFocused)  { cardBorder = "2px solid #00e5c0";              cardBg = "rgba(0,229,192,0.08)"; }

          const labelColor = isNormal ? "#00b89a" : isAbnormal ? "#ff7a45" : "#a8d4f0";
          const dotColor   = isNormal ? "#00e5c0" : isAbnormal ? "#ff4d4f" : "rgba(200,223,240,0.2)";

          // Trim normal preview: remove "Label: " prefix
          const previewText = sys.normal.replace(/^[^:]+:\s*/, "").slice(0, 60);

          return (
            <div
              key={sys.id}
              ref={el => cardRefs.current[sys.id] = el}
              tabIndex={0}
              onClick={() => { setFocusedIdx(idx); setKbActive(true); cardRefs.current[sys.id]?.focus(); }}
              onFocus={() => { setFocusedIdx(idx); setKbActive(true); }}
              style={{
                border: cardBorder, background: cardBg,
                borderRadius: 7, padding: "7px 10px", cursor: "pointer",
                outline: "none", transition: "border 0.1s, background 0.1s",
              }}
            >
              {/* Card header */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                <span style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: labelColor, flex: 1 }}>
                  {sys.label}
                </span>
                {/* Key badge */}
                <span style={{
                  width: 16, height: 16, borderRadius: 3, flexShrink: 0,
                  border: `1px solid ${isFocused ? "#00e5c0" : "rgba(200,223,240,0.2)"}`,
                  fontFamily: MONO, fontSize: 9, fontWeight: 700,
                  color: isFocused ? "#00e5c0" : "rgba(200,223,240,0.35)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isFocused ? "rgba(0,229,192,0.1)" : "transparent",
                }}>
                  {sys.key}
                </span>
                {/* Status dot */}
                <div style={{
                  width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                  background: dotColor,
                }} />
              </div>

              {/* Normal preview */}
              {isNormal && (
                <div style={{ fontFamily: MONO, fontSize: 10, color: "rgba(0,229,192,0.5)", lineHeight: 1.4 }}>
                  {previewText}…
                </div>
              )}

              {/* Abnormal textarea */}
              {isAbnormal && (
                <textarea
                  ref={el => abnormalTextareaRefs.current[sys.id] = el}
                  rows={2}
                  value={customTexts[sys.id]}
                  placeholder={`${sys.label} findings...`}
                  onChange={e => handleCustomChange(sys.id, e.target.value)}
                  onClick={e => e.stopPropagation()}
                  style={{
                    width: "100%", resize: "none", boxSizing: "border-box",
                    border: "1px solid rgba(255,77,79,0.25)", borderRadius: 4,
                    background: "rgba(11,30,54,0.6)", color: "#c8dff0",
                    fontFamily: SANS, fontSize: 11.5, padding: "4px 6px",
                    outline: "none", marginTop: 2,
                  }}
                />
              )}

              {/* KB action chips when focused */}
              {isFocused && (
                <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                  {[
                    { label: "↵ Normal", color: "#00e5c0", border: "rgba(0,229,192,0.4)", action: () => markNormal(sys.id) },
                    { label: "2 Abnormal", color: "#ff7a45", border: "rgba(255,77,79,0.35)", action: () => markAbnormal(sys.id) },
                    { label: "0 Clear", color: "rgba(200,223,240,0.4)", border: "rgba(200,223,240,0.15)", action: () => clearSystem(sys.id) },
                  ].map(chip => (
                    <button
                      key={chip.label}
                      onClick={e => { e.stopPropagation(); chip.action(); }}
                      style={{
                        flex: 1, fontFamily: MONO, fontSize: 9, fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "0.04em",
                        border: `1px solid ${chip.border}`, borderRadius: 3,
                        background: "transparent", color: chip.color,
                        padding: "2px 0", cursor: "pointer",
                      }}>
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
        <div
          onClick={() => setShowLegend(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(3,8,16,0.75)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#081628", border: "1px solid #1a3555",
              borderRadius: 12, padding: "20px 24px",
              width: 440, maxWidth: "92vw",
              display: "flex", flexDirection: "column", gap: 16,
            }}
          >
            <div style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 700, color: "#00e5c0" }}>
              Keyboard Reference
            </div>

            {/* Jump to System */}
            <div>
              <div style={{ fontFamily: MONO, fontSize: 9, textTransform: "uppercase",
                color: "rgba(200,223,240,0.4)", letterSpacing: "0.08em", marginBottom: 8 }}>
                Jump to System
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {SYSTEMS.map(s => (
                  <LegendRow key={s.id} keyLabel={s.key} desc={s.label} />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div>
              <div style={{ fontFamily: MONO, fontSize: 9, textTransform: "uppercase",
                color: "rgba(200,223,240,0.4)", letterSpacing: "0.08em", marginBottom: 8 }}>
                Actions on Focused System
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <LegendRow keyLabel="Enter / 1" desc="Mark Normal" />
                <LegendRow keyLabel="2" desc="Mark Abnormal (focuses textarea)" />
                <LegendRow keyLabel="0" desc="Clear / Reset" />
                <LegendRow keyLabel="← → ↑ ↓" desc="Navigate systems" />
                <LegendRow keyLabel="Esc" desc="Exit abnormal textarea → revert to Normal" />
              </div>
            </div>

            {/* Global */}
            <div>
              <div style={{ fontFamily: MONO, fontSize: 9, textTransform: "uppercase",
                color: "rgba(200,223,240,0.4)", letterSpacing: "0.08em", marginBottom: 8 }}>
                Global
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <LegendRow keyLabel="⌘ / Ctrl + ↵" desc="Mark ALL systems Normal" />
                <LegendRow keyLabel="⌘ / Ctrl + 0" desc="Reset ALL systems" />
                <LegendRow keyLabel="?" desc="Toggle this legend" />
              </div>
            </div>

            <button
              onClick={() => setShowLegend(false)}
              style={{
                alignSelf: "flex-end", fontFamily: MONO, fontSize: 10,
                fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                padding: "5px 14px", borderRadius: 5, cursor: "pointer",
                border: "1px solid rgba(0,229,192,0.3)", background: "rgba(0,229,192,0.06)",
                color: "#00e5c0",
              }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LegendRow({ keyLabel, desc }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{
        fontFamily: MONO, fontSize: 10, fontWeight: 700, color: "#00e5c0",
        border: "1px solid rgba(0,229,192,0.3)", background: "rgba(0,229,192,0.06)",
        minWidth: 80, padding: "2px 8px", borderRadius: 4,
        display: "inline-block", textAlign: "center",
      }}>
        {keyLabel}
      </span>
      <span style={{ fontFamily: SANS, fontSize: 12, color: "rgba(200,223,240,0.6)" }}>
        {desc}
      </span>
    </div>
  );
}