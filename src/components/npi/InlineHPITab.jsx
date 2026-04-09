import { useState, useRef, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

// ─── INLINE HPI TAB ───────────────────────────────────────────────────────────
// Keyboard-first AI-driven symptom checklist that builds an HPI narrative.
//
// Keyboard contract (scan phase):
//   Arrow Up/Down  — navigate symptom rows
//   Y / Enter      — mark yes / present (yesno)
//   N              — mark no / absent  (yesno)
//   Space          — skip symptom
//   0-9            — answer pain scale (scale type) or pick option 1-N (choice type)
//   Backspace      — go back one row (when current row unanswered)
//   Esc            — finish and build narrative
export default function InlineHPITab({ cc, setCC, onAdvance }) {
  const [phase, setPhase]         = useState("idle");
  const [symptoms, setSymptoms]   = useState([]);
  const [answers, setAnswers]     = useState({});
  const [focusIdx, setFocusIdx]   = useState(0);
  const [narrative, setNarrative] = useState(cc.hpi || "");
  const panelRef = useRef(null);

  const answerColor = (ans) => {
    if (!ans || ans === "skip") return "var(--npi-txt4)";
    if (ans === "yes")  return "var(--npi-coral)";
    if (ans === "no")   return "var(--npi-teal)";
    return "var(--npi-blue)";
  };

  const answerLabel = (sym, ans) => {
    if (!ans || ans === "skip") return "\u2014";
    if (ans === "yes") return sym.hint || "Present";
    if (ans === "no")  return "Absent";
    return ans;
  };

  const buildNarrative = useCallback((ans) => {
    const yes     = symptoms.filter(s => ans[s.id] === "yes").map(s => (s.hint || s.label).toLowerCase());
    const no      = symptoms.filter(s => ans[s.id] === "no").map(s => (s.hint || s.label).toLowerCase());
    const details = symptoms
      .filter(s => ans[s.id] && !["yes","no","skip"].includes(ans[s.id]))
      .map(s => `${s.label}: ${ans[s.id]}`);
    let text = cc.text ? `${cc.text}.` : "Chief complaint not specified.";
    if (details.length) text += ` ${details.join("; ")}.`;
    if (yes.length)     text += ` Associated with ${yes.join(", ")}.`;
    if (no.length)      text += ` Denies ${no.join(", ")}.`;
    return text;
  }, [symptoms, cc.text]);

  const finishScan = useCallback((ans) => {
    const text = buildNarrative(ans);
    setNarrative(text);
    setCC(prev => ({ ...prev, hpi: text }));
    setPhase("narrative");
  }, [buildNarrative, setCC]);

  const advance = useCallback((newAnswers, idx) => {
    if (idx + 1 >= symptoms.length) { finishScan(newAnswers); }
    else { setFocusIdx(idx + 1); }
  }, [symptoms.length, finishScan]);

  const generateSymptoms = async () => {
    if (!cc.text.trim()) { toast.error("Enter a chief complaint first (Cmd+2)."); return; }
    setPhase("loading");
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a clinical documentation assistant for emergency medicine.
For the chief complaint: "${cc.text}"
Generate a focused HPI symptom checklist using OPQRST framework plus relevant associated symptoms.
Return ONLY valid JSON — no preamble, no backticks:
{"symptoms":[
  {"id":"onset","label":"Onset","type":"choice","opts":["Sudden","Gradual","Woke from sleep","Unknown"]},
  {"id":"duration","label":"Duration","type":"choice","opts":["<1 hr","1-6 hrs","6-24 hrs","1-3 days","3-7 days",">1 week"]},
  {"id":"severity","label":"Severity","type":"scale","hint":"0=none, 9=worst ever"},
  {"id":"quality","label":"Quality","type":"choice","opts":["Sharp","Dull","Pressure/squeezing","Burning","Crampy","Aching","Throbbing"]},
  {"id":"radiation","label":"Radiation","type":"yesno","hint":"radiates elsewhere"},
  {"id":"aggravate","label":"Aggravated by","type":"choice","opts":["Exertion","Movement","Deep breath","Food/drink","Lying flat","Nothing","Unknown"]},
  {"id":"relieve","label":"Relieved by","type":"choice","opts":["Rest","Position change","Antacids","Nitroglycerin","Nothing","Unknown"]},
  {"id":"prior","label":"Prior episodes","type":"yesno","hint":"prior similar episodes"},
  {"id":"assoc1","label":"Nausea/Vomiting","type":"yesno","hint":"nausea or vomiting"},
  {"id":"assoc2","label":"Diaphoresis","type":"yesno","hint":"diaphoresis"},
  {"id":"assoc3","label":"Dyspnea","type":"yesno","hint":"shortness of breath"}
]}
Customize the symptom list to be clinically relevant for "${cc.text}". Keep 8-12 symptoms. Labels max 3 words.`,
        response_json_schema: {
          type: "object",
          properties: {
            symptoms: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id:    { type: "string" }, label: { type: "string" },
                  type:  { type: "string" }, hint:  { type: "string" },
                  opts:  { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
      });
      const parsed = typeof result === "object" ? result : JSON.parse(String(result).replace(/```json|```/g, "").trim());
      setSymptoms(parsed.symptoms || []);
      setAnswers({});
      setFocusIdx(0);
      setPhase("scan");
    } catch {
      toast.error("Could not generate HPI template. Check your connection.");
      setPhase("idle");
    }
  };

  useEffect(() => {
    if (phase === "scan") setTimeout(() => panelRef.current?.focus(), 60);
  }, [phase]);

  const handleKey = useCallback((e) => {
    if (phase !== "scan") return;
    const sym = symptoms[focusIdx];
    if (!sym) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setFocusIdx(i => Math.min(i + 1, symptoms.length - 1)); return; }
    if (e.key === "ArrowUp")   { e.preventDefault(); setFocusIdx(i => Math.max(i - 1, 0)); return; }
    if (e.key === "Escape")    { finishScan(answers); return; }
    if (e.key === "Backspace" && !answers[sym.id]) { setFocusIdx(i => Math.max(i - 1, 0)); return; }
    if (sym.type === "yesno") {
      if (e.key === "y" || e.key === "Y" || e.key === "Enter") {
        const a = { ...answers, [sym.id]: "yes" }; setAnswers(a); advance(a, focusIdx);
      } else if (e.key === "n" || e.key === "N") {
        const a = { ...answers, [sym.id]: "no" }; setAnswers(a); advance(a, focusIdx);
      } else if (e.key === " ") {
        e.preventDefault();
        const a = { ...answers, [sym.id]: "skip" }; setAnswers(a); advance(a, focusIdx);
      }
    } else if (sym.type === "scale") {
      if (/^[0-9]$/.test(e.key)) {
        const a = { ...answers, [sym.id]: `${e.key}/10` }; setAnswers(a); advance(a, focusIdx);
      }
    } else if (sym.type === "choice" && sym.opts) {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= sym.opts.length) {
        const a = { ...answers, [sym.id]: sym.opts[n - 1] }; setAnswers(a); advance(a, focusIdx);
      } else if (e.key === " ") {
        e.preventDefault();
        const a = { ...answers, [sym.id]: "skip" }; setAnswers(a); advance(a, focusIdx);
      }
    }
  }, [phase, symptoms, focusIdx, answers, advance, finishScan]);

  // ── idle / loading ──────────────────────────────────────────────────────────
  if (phase === "idle" || phase === "loading") {
    return (
      <div className="hpi-idle">
        <div className="hpi-cc-row">
          <span className="hpi-field-lbl">Chief Complaint</span>
          <span className="hpi-cc-val">
            {cc.text || <span className="hpi-muted">Not set — navigate to CC first (Cmd+2)</span>}
          </span>
        </div>
        {cc.text && (
          <button className="hpi-gen-btn" onClick={generateSymptoms} disabled={phase === "loading"}>
            {phase === "loading"
              ? <><span className="hpi-spinner">⏳</span> Generating symptom checklist…</>
              : <><span>✦</span> Generate AI Symptom Template</>}
          </button>
        )}
        {cc.hpi && (
          <div style={{ marginTop: 24 }}>
            <div className="hpi-field-lbl">Current HPI</div>
            <textarea className="hpi-ta" value={narrative} rows={6}
              onChange={e => { setNarrative(e.target.value); setCC(prev => ({ ...prev, hpi: e.target.value })); }}
            />
          </div>
        )}
        <div className="hpi-kbd-legend">
          <span className="hpi-kbd-item"><kbd>↑↓</kbd> Navigate</span>
          <span className="hpi-kbd-item"><kbd>Y</kbd> Present</span>
          <span className="hpi-kbd-item"><kbd>N</kbd> Absent</span>
          <span className="hpi-kbd-item"><kbd>Space</kbd> Skip</span>
          <span className="hpi-kbd-item"><kbd>0-9</kbd> Scale / option</span>
          <span className="hpi-kbd-item"><kbd>Esc</kbd> Build narrative</span>
        </div>
      </div>
    );
  }

  // ── scan phase ──────────────────────────────────────────────────────────────
  if (phase === "scan") {
    const done = Object.keys(answers).filter(k => answers[k] !== "skip").length;
    const pct  = symptoms.length ? Math.round((Object.keys(answers).length / symptoms.length) * 100) : 0;
    return (
      <div ref={panelRef} tabIndex={0} onKeyDown={handleKey} className="hpi-scan" style={{ outline: "none" }}>
        <div className="hpi-scan-hdr">
          <div className="hpi-scan-hdr-left">
            <span className="hpi-cc-val">{cc.text}</span>
            <span className="hpi-prog">{Object.keys(answers).length} / {symptoms.length}</span>
          </div>
          <div className="hpi-scan-bar-wrap"><div className="hpi-scan-bar" style={{ width: pct + "%" }} /></div>
          <div className="hpi-hint-strip">
            <kbd>↑↓</kbd> nav &nbsp;·&nbsp; <kbd>Y</kbd> yes &nbsp;·&nbsp; <kbd>N</kbd> no &nbsp;·&nbsp;
            <kbd>Space</kbd> skip &nbsp;·&nbsp; <kbd>0-9</kbd> scale/option &nbsp;·&nbsp; <kbd>Esc</kbd> done
          </div>
        </div>
        <div className="hpi-sym-list">
          {symptoms.map((sym, i) => {
            const ans = answers[sym.id]; const active = i === focusIdx;
            return (
              <div key={sym.id}
                className={`hpi-sym-row${active ? " active" : ""}${ans ? " answered" : ""}`}
                onClick={() => setFocusIdx(i)}>
                <div className="hpi-sym-idx">{String(i + 1).padStart(2, "0")}</div>
                <div className="hpi-sym-body">
                  <div className="hpi-sym-label">{sym.label}
                    {sym.type === "scale"  && <span className="hpi-type-badge">scale</span>}
                    {sym.type === "yesno"  && <span className="hpi-type-badge">Y/N</span>}
                    {sym.type === "choice" && <span className="hpi-type-badge">choice</span>}
                  </div>
                  {active && sym.hint && <div className="hpi-sym-hint">{sym.hint}</div>}
                  {active && sym.type === "choice" && sym.opts && (
                    <div className="hpi-sym-opts">
                      {sym.opts.map((opt, oi) => (
                        <span key={opt} className="hpi-opt-chip">
                          <span className="hpi-opt-key">{oi + 1}</span>{opt}
                        </span>
                      ))}
                    </div>
                  )}
                  {active && sym.type === "scale" && (
                    <div className="hpi-sym-opts">
                      {[0,1,2,3,4,5,6,7,8,9].map(n => (
                        <span key={n} className="hpi-opt-chip hpi-opt-scale">
                          <span className="hpi-opt-key">{n}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  {active && sym.type === "yesno" && (
                    <div className="hpi-sym-opts">
                      <span className="hpi-opt-chip"><span className="hpi-opt-key">Y</span>Present</span>
                      <span className="hpi-opt-chip"><span className="hpi-opt-key">N</span>Absent</span>
                      <span className="hpi-opt-chip"><span className="hpi-opt-key">Space</span>Skip</span>
                    </div>
                  )}
                </div>
                <div className="hpi-sym-ans" style={{ color: answerColor(ans) }}>{answerLabel(sym, ans)}</div>
                <div className={`hpi-sym-dot${ans && ans !== "skip" ? " done" : ans === "skip" ? " skip" : ""}`} />
              </div>
            );
          })}
        </div>
        <div className="hpi-scan-footer">
          <button className="hpi-done-btn" onClick={() => finishScan(answers)}>
            Build Narrative ({done} answered) &rarr;
          </button>
          <button className="hpi-ghost-btn" onClick={() => setPhase("idle")}>&#8635; Restart</button>
        </div>
      </div>
    );
  }

  // ── narrative phase ─────────────────────────────────────────────────────────
  return (
    <div className="hpi-narrative">
      <div className="hpi-narr-hdr">
        <span className="hpi-cc-val">{cc.text}</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="hpi-ghost-btn" onClick={() => setPhase("scan")}>&#8592; Edit Answers</button>
          <button className="hpi-ghost-btn" onClick={() => setPhase("idle")}>&#8635; Restart</button>
          {onAdvance && (
            <button className="hpi-done-btn" onClick={onAdvance}>Continue to ROS &rarr;</button>
          )}
        </div>
      </div>
      {onAdvance && (
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
          <kbd style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"var(--npi-blue)", background:"rgba(59,158,255,.1)", border:"1px solid rgba(59,158,255,.2)", borderRadius:4, padding:"1px 6px" }}>⌘ Enter</kbd>
          <span style={{ fontSize:11, color:"var(--npi-txt4)", fontFamily:"'DM Sans',sans-serif" }}>Continue to ROS</span>
        </div>
      )}
      <div className="hpi-field-lbl" style={{ marginBottom: 8 }}>HPI Narrative — edit freely</div>
      <textarea className="hpi-ta" value={narrative} autoFocus rows={7}
        onChange={e => { setNarrative(e.target.value); setCC(prev => ({ ...prev, hpi: e.target.value })); }}
        onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); onAdvance?.(); } }}
      />
      <div className="hpi-badge-row">
        {symptoms.filter(s => answers[s.id] && answers[s.id] !== "skip").map(sym => (
          <div key={sym.id} className="hpi-badge"
            style={{ borderColor: answerColor(answers[sym.id]) + "44", color: answerColor(answers[sym.id]) }}>
            <span className="hpi-badge-label">{sym.label}</span>
            <span className="hpi-badge-val">{answerLabel(sym, answers[sym.id])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}