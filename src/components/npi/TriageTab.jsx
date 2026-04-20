import { useState, useEffect, useCallback, useRef } from "react";
import { ESI_CFG, ISAR_QUESTIONS } from "@/components/npi/npiData";

// ─── AVPU shortcut map ─────────────────────────────────────────────────────────
const AVPU_OPTS = ["Alert","Verbal","Pain","Unresponsive"];
const AVPU_KEY  = { a:"Alert", v:"Verbal", p:"Pain", u:"Unresponsive" };

export default function TriageTab({
  esiLevel, setEsiLevel,
  triage, setTriage,
  avpu, setAvpu,
  pain, setPain,
  patientAge,
  isarState, setIsarState,
  onAdvance,
}) {
  const isGeriatric = parseInt(patientAge || "0") >= 65;

  // ── Active ISAR question index — keyboard navigation state ────────────────
  // -1 means no ISAR question is keyboard-focused.
  const [activeIsarIdx, setActiveIsarIdx] = useState(-1);

  const textareaRef = useRef(null);

  // ── ISAR score calculation ─────────────────────────────────────────────────
  // q3 is reversed: "Do you see well?" — No = 1 point (impaired vision is risk).
  const isarScore = isarState
    ? (isarState.q1===true?1:0)+(isarState.q2===true?1:0)+
      (isarState.q3===false?1:0)+(isarState.q4===true?1:0)+
      (isarState.q5===true?1:0)+(isarState.q6===true?1:0)
    : 0;
  const isarAnswered = isarState && Object.values(isarState).some(v => v !== null);
  const isarComplete = isarState && Object.values(isarState).every(v => v !== null);
  const isarHighRisk = isarComplete && isarScore >= 2;

  // ── Helper: is focus inside the triage textarea? ───────────────────────────
  const inTextarea = useCallback(() =>
    document.activeElement === textareaRef.current, []);

  // ── Auto-focus triage textarea on mount ───────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => textareaRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  // ── Cmd+Enter — advance to Demographics from anywhere ─────────────────────
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        onAdvance?.();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onAdvance]);

  // ── 1–5 — ESI level shortcut (not in textarea) ────────────────────────────
  useEffect(() => {
    const h = (e) => {
      if (inTextarea() || e.ctrlKey || e.metaKey) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 5) {
        setEsiLevel(prev => String(prev) === String(n) ? "" : String(n));
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [setEsiLevel, inTextarea]);

  // ── A/V/P/U — AVPU mental status (not in textarea) ───────────────────────
  useEffect(() => {
    const h = (e) => {
      if (inTextarea() || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const match = AVPU_KEY[e.key.toLowerCase()];
      if (match) setAvpu(prev => prev === match ? "" : match);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [setAvpu, inTextarea]);

  // ── 0–9 — pain score (not in textarea, not shifted) ───────────────────────
  useEffect(() => {
    const h = (e) => {
      if (inTextarea() || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (/^[0-9]$/.test(e.key)) {
        setPain(prev => prev === e.key ? "" : e.key);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [setPain, inTextarea]);

  // ── ISAR keyboard navigation (only when isGeriatric) ──────────────────────
  // ArrowDown/Up navigate between questions; Y/N answer the active question.
  // Pressing ArrowDown from the last question advances to Demographics.
  useEffect(() => {
    if (!isGeriatric) return;
    const h = (e) => {
      if (inTextarea() || e.ctrlKey || e.metaKey) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIsarIdx(i => {
          const next = i + 1;
          if (next >= ISAR_QUESTIONS.length) { onAdvance?.(); return i; }
          return next;
        });
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIsarIdx(i => Math.max(i - 1, 0));
        return;
      }

      if (activeIsarIdx < 0 || activeIsarIdx >= ISAR_QUESTIONS.length) return;

      const { key: qKey, yesScores } = ISAR_QUESTIONS[activeIsarIdx];
      if (e.key === "y" || e.key === "Y") {
        setIsarState(p => ({ ...p, [qKey]: true }));
        setActiveIsarIdx(i => Math.min(i + 1, ISAR_QUESTIONS.length - 1));
      } else if (e.key === "n" || e.key === "N") {
        setIsarState(p => ({ ...p, [qKey]: false }));
        setActiveIsarIdx(i => Math.min(i + 1, ISAR_QUESTIONS.length - 1));
      } else if (e.key === "Escape") {
        setActiveIsarIdx(-1);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isGeriatric, activeIsarIdx, setIsarState, inTextarea, onAdvance]);

  // ── Click on ISAR question also sets keyboard focus ───────────────────────
  const handleIsarClick = useCallback((idx, qKey, answer) => {
    setActiveIsarIdx(idx);
    setIsarState(p => ({ ...p, [qKey]: p?.[qKey] === answer ? null : answer }));
  }, [setIsarState]);

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* ── ESI Level ─────────────────────────────────────────────────── */}
      <div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>
          ESI Level — Emergency Severity Index
          <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0, color:"#4a6a8a", marginLeft:8 }}>(press 1–5)</span>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {ESI_CFG.map(({ level, label, color, desc }) => {
            const active = esiLevel === String(level);
            return (
              <button key={level} onClick={() => setEsiLevel(active ? "" : String(level))}
                style={{ flex:1, padding:"12px 6px", borderRadius:10, cursor:"pointer", transition:"all .14s",
                  border:`2px solid ${active ? color : "rgba(42,77,114,0.4)"}`,
                  background: active ? `${color}18` : "rgba(14,37,68,0.5)" }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:24, fontWeight:700, color: active ? color : "var(--npi-txt3)" }}>
                  {level}
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600, marginTop:2, color: active ? color : "var(--npi-txt3)" }}>
                  {label}
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"var(--npi-txt4)", marginTop:3 }}>
                  {desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Triage assessment note ───────────────────────────────────── */}
      <div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
          Triage Assessment Note
        </div>
        <textarea ref={textareaRef} value={triage} onChange={e => setTriage(e.target.value)} rows={4}
          placeholder="Document presenting complaint, initial appearance, chief concern..."
          style={{ width:"100%", background:"rgba(14,37,68,0.8)",
            border:"1px solid rgba(26,53,85,0.55)", borderTop:"2px solid rgba(0,229,192,0.3)",
            borderRadius:9, padding:"9px 12px", color:"var(--npi-txt)",
            fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none",
            resize:"none", boxSizing:"border-box" }} />
      </div>

      {/* ── AVPU ──────────────────────────────────────────────────────── */}
      <div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
          Mental Status — AVPU
          <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0, color:"#4a6a8a", marginLeft:8 }}>(press A / V / P / U)</span>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {AVPU_OPTS.map(v => {
            const active = avpu === v;
            const kbdKey = v[0].toUpperCase();
            return (
              <button key={v} onClick={() => setAvpu(active ? "" : v)}
                style={{ flex:1, padding:"9px 4px", borderRadius:8, cursor:"pointer",
                  border:`1px solid ${active ? "rgba(59,158,255,0.5)" : "rgba(42,77,114,0.4)"}`,
                  background: active ? "rgba(59,158,255,0.1)" : "transparent",
                  color: active ? "#3b9eff" : "var(--npi-txt3)",
                  fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight: active ? 600 : 400,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                <kbd style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                  background: active ? "rgba(59,158,255,0.18)" : "rgba(42,77,114,0.3)",
                  border:`1px solid ${active ? "rgba(59,158,255,0.4)" : "rgba(42,77,114,0.4)"}`,
                  borderRadius:3, padding:"0 4px", color: active ? "#3b9eff" : "var(--npi-txt4)" }}>
                  {kbdKey}
                </kbd>
                {v}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Pain score ────────────────────────────────────────────────── */}
      <div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
          Pain Score (0–10)
          <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0, color:"#4a6a8a", marginLeft:8 }}>(press 0–9)</span>
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {Array.from({ length:11 }, (_, i) => i).map(i => {
            const col    = i <= 3 ? "#00e5c0" : i <= 6 ? "#f5c842" : "#ff6b6b";
            const active = pain === String(i);
            return (
              <button key={i} onClick={() => setPain(active ? "" : String(i))}
                style={{ width:38, height:38, borderRadius:8, cursor:"pointer",
                  border:`1px solid ${active ? col+"88" : "rgba(42,77,114,0.35)"}`,
                  background: active ? col+"18" : "transparent",
                  color: active ? col : "var(--npi-txt3)",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight: active ? 700 : 400 }}>
                {i}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── ISAR-6 Geriatric Fall Risk (age ≥ 65) ────────────────────── */}
      {isGeriatric && (
        <div style={{ borderTop:"1px solid rgba(26,53,85,0.4)", paddingTop:18 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, flexWrap:"wrap", gap:8 }}>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:4 }}>
                ISAR-6 — Identification of Seniors At Risk
                <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0, color:"#4a6a8a", marginLeft:8 }}>(↓ to navigate · Y/N to answer)</span>
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--npi-txt4)" }}>
                Validated ED fall risk screen · Score ≥2 = high risk for adverse outcomes
              </div>
            </div>
            {isarComplete && (
              <div style={{ padding:"5px 12px", borderRadius:7,
                background: isarHighRisk ? "rgba(255,107,107,0.1)" : "rgba(0,229,192,0.08)",
                border:`1px solid ${isarHighRisk ? "rgba(255,107,107,0.35)" : "rgba(0,229,192,0.25)"}` }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700,
                  color: isarHighRisk ? "#ff8a8a" : "var(--npi-teal)" }}>
                  {isarScore}/6 — {isarHighRisk ? "⚠ High Risk" : "✓ Low Risk"}
                </span>
              </div>
            )}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
            {ISAR_QUESTIONS.map(({ key: qKey, q, yesScores, hint }, idx) => {
              const val         = isarState?.[qKey];
              const posAnswer   = yesScores;   // which boolean answer scores 1 point
              const isRisk      = val === posAnswer;
              const kbFocused   = activeIsarIdx === idx;
              return (
                <div key={qKey}
                  style={{ padding:"9px 12px", borderRadius:9, cursor:"pointer",
                    background: isRisk ? "rgba(245,200,66,0.06)" : "rgba(14,37,68,0.55)",
                    border:`1px solid ${kbFocused ? "rgba(59,158,255,0.5)" : isRisk ? "rgba(245,200,66,0.25)" : "rgba(26,53,85,0.4)"}`,
                    boxShadow: kbFocused ? "0 0 0 2px rgba(59,158,255,0.15)" : "none",
                    transition:"border-color .15s, box-shadow .15s" }}
                  onClick={() => setActiveIsarIdx(idx)}>
                  <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:6 }}>
                    {kbFocused && (
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                        color:"var(--npi-blue)", background:"rgba(59,158,255,0.12)",
                        border:"1px solid rgba(59,158,255,0.3)", borderRadius:3,
                        padding:"1px 5px", flexShrink:0 }}>
                        active
                      </span>
                    )}
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--npi-txt3)",
                      lineHeight:1.4, flex:1 }}>
                      {q}
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                        color:"var(--npi-txt4)", marginLeft:6 }}>
                        ({hint})
                      </span>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    {[true, false].map(answer => {
                      const active      = val === answer;
                      const answersRisk = answer === posAnswer;
                      const col = active && answersRisk ? "#f5c842"
                                : active                ? "var(--npi-teal)"
                                : "rgba(42,77,114,0.5)";
                      const kbdHint = kbFocused ? (answer ? "Y" : "N") : null;
                      return (
                        <button key={String(answer)}
                          onClick={e => { e.stopPropagation(); handleIsarClick(idx, qKey, answer); }}
                          style={{ flex:1, padding:"6px 4px", borderRadius:7, cursor:"pointer",
                            fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight: active ? 600 : 400,
                            border:`1px solid ${active ? col+"88" : "rgba(42,77,114,0.35)"}`,
                            background: active ? col+"18" : "transparent",
                            color: active ? col : "var(--npi-txt4)", transition:"all .12s",
                            display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                          {kbdHint && (
                            <kbd style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                              background:"rgba(59,158,255,0.15)", border:"1px solid rgba(59,158,255,0.3)",
                              borderRadius:3, padding:"0 4px", color:"var(--npi-blue)" }}>
                              {kbdHint}
                            </kbd>
                          )}
                          {answer ? "Yes" : "No"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {isarHighRisk && (
            <div style={{ marginTop:10, padding:"9px 12px", borderRadius:8,
              background:"rgba(255,107,107,0.07)", border:"1px solid rgba(255,107,107,0.28)",
              fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#ff8a8a", lineHeight:1.55 }}>
              <strong>ISAR ≥2 — High Risk.</strong> Consider geriatric consultation, PT/OT evaluation, fall prevention order set, and home safety assessment before discharge. Document in MDM (Moderate-High risk — functional decline, readmission, and adverse outcome risk).
            </div>
          )}
          {isarAnswered && !isarComplete && (
            <div style={{ marginTop:8, fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              color:"var(--npi-txt4)", letterSpacing:1 }}>
              {Object.values(isarState).filter(v => v !== null).length}/6 questions answered
            </div>
          )}
        </div>
      )}

      {/* ── Summary strip ─────────────────────────────────────────────── */}
      {(esiLevel || triage || avpu) && (
        <div style={{ padding:"10px 14px", borderRadius:9,
          background:"rgba(0,229,192,0.05)", border:"1px solid rgba(0,229,192,0.2)",
          fontFamily:"'DM Sans',sans-serif", fontSize:12, display:"flex", gap:12, flexWrap:"wrap" }}>
          {esiLevel && <span><span style={{ color:"var(--npi-teal)", fontWeight:700 }}>ESI {esiLevel}</span></span>}
          {avpu      && <span style={{ color:"var(--npi-txt3)" }}>AVPU: {avpu}</span>}
          {pain      && <span style={{ color:"var(--npi-txt3)" }}>Pain: {pain}/10</span>}
        </div>
      )}

      {/* ── Keyboard legend ───────────────────────────────────────────── */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:12, padding:"8px 12px",
        background:"rgba(14,37,68,.5)", border:"1px solid rgba(26,53,85,0.4)", borderRadius:8 }}>
        {[
          ["1–5",     "ESI level"],
          ["A/V/P/U", "AVPU status"],
          ["0–9",     "Pain score"],
          ...(isGeriatric ? [["↓↑","ISAR nav"],["Y/N","ISAR answer"]] : []),
          ["⌘↵",      "→ Demographics"],
        ].map(([k, d]) => (
          <div key={k} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"var(--npi-txt4)" }}>
            <kbd style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              background:"var(--npi-up)", border:"1px solid var(--npi-bhi)",
              borderRadius:3, padding:"0 5px", color:"var(--npi-blue)" }}>{k}</kbd>
            {d}
          </div>
        ))}
        <div style={{ marginLeft:"auto", fontSize:10, color:"var(--npi-txt4)", fontStyle:"italic" }}>
          shortcuts active when triage note is not focused
        </div>
      </div>

      {/* ── Advance button ────────────────────────────────────────────── */}
      {onAdvance && (
        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:8 }}>
          <button onClick={onAdvance}
            style={{ padding:"9px 22px", borderRadius:9, background:"linear-gradient(135deg,#00e5c0,#00b4d8)",
              border:"none", color:"#050f1e", fontFamily:"'DM Sans',sans-serif", fontWeight:700,
              fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
            Continue to Demographics
            <kbd style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              background:"rgba(5,15,30,.3)", borderRadius:3, padding:"0 5px",
              color:"rgba(5,15,30,.8)" }}>⌘↵</kbd>
          </button>
        </div>
      )}
    </div>
  );
}