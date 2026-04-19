import { useState, useRef, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

// ─── INLINE HPI TAB ───────────────────────────────────────────────────────────
// Keyboard-first AI-driven symptom checklist that builds an HPI narrative.
// Phase flow: idle → loading → scan → narrative (with auto-DDx on entry)
//
// Keyboard contract (scan phase):
//   Arrow Up/Down  — navigate symptom rows
//   Y / Enter      — mark yes / present (yesno)
//   N              — mark no / absent  (yesno)
//   Space          — skip symptom
//   0-9            — answer pain scale (scale type) or pick option 1-N (choice type)
//   Backspace      — go back one row (when current row unanswered)
//   Esc            — finish and build narrative
//
// DDx integration:
//   Auto-fires on scan completion using positives/negatives + patient context.
//   Uses response_json_schema for structured output; degrades gracefully.
//
// Constraints: no form, no localStorage, no router, no alert, no sonner direct
//   import — uses onToast prop. straight quotes only. finally { setBusy } on async.

// ─── HPI CSS ──────────────────────────────────────────────────────────────────
// Self-contained: does not rely on parent NPI_CSS for hpi-* rules.
const HPI_CSS = `
/* ── Containers ── */
.hpi-idle     { display:flex; flex-direction:column; gap:14px; padding:4px 0; }
.hpi-scan     { display:flex; flex-direction:column; height:100%; outline:none; }
.hpi-narrative{ display:flex; flex-direction:column; gap:10px; }

/* ── CC row (idle) ── */
.hpi-cc-row   { display:flex; flex-direction:column; gap:4px; padding:12px 16px;
                border-radius:10px; background:rgba(14,37,68,0.55);
                border:1px solid rgba(26,53,85,0.5); }
.hpi-field-lbl{ font-family:'JetBrains Mono',monospace; font-size:9px;
                letter-spacing:1.5px; text-transform:uppercase; color:var(--npi-txt4);
                margin-bottom:3px; }
.hpi-cc-val   { font-family:'Playfair Display',serif; font-size:15px;
                font-weight:700; color:var(--npi-txt); }
.hpi-muted    { font-family:'DM Sans',sans-serif; font-size:13px;
                color:var(--npi-txt4); font-style:italic; }

/* ── Generate button ── */
.hpi-gen-btn  { display:flex; align-items:center; gap:9px;
                padding:13px 20px; border-radius:11px; cursor:pointer;
                background:linear-gradient(135deg,rgba(0,229,192,.12),rgba(0,180,216,.08));
                border:1px solid rgba(0,229,192,.35);
                color:var(--npi-teal); font-family:'DM Sans',sans-serif;
                font-size:14px; font-weight:700; transition:all .15s; }
.hpi-gen-btn:hover:not(:disabled) { background:linear-gradient(135deg,rgba(0,229,192,.2),rgba(0,180,216,.14));
                                     border-color:rgba(0,229,192,.6); }
.hpi-gen-btn:disabled { opacity:.55; cursor:not-allowed; }
.hpi-spinner  { display:inline-block; animation:hpi-spin 1s linear infinite; }
@keyframes hpi-spin { to { transform:rotate(360deg); } }

/* ── Textarea ── */
.hpi-ta       { width:100%; box-sizing:border-box; padding:10px 12px;
                border-radius:8px; border:1px solid rgba(26,53,85,0.6);
                background:rgba(8,22,46,0.6); color:var(--npi-txt);
                font-family:'DM Sans',sans-serif; font-size:13px;
                line-height:1.65; resize:vertical; outline:none; }
.hpi-ta:focus { border-color:rgba(0,229,192,.4); }

/* ── Keyboard legend ── */
.hpi-kbd-legend { display:flex; flex-wrap:wrap; gap:6px 14px;
                  padding:10px 14px; border-radius:8px;
                  background:rgba(8,18,36,0.5);
                  border:1px solid rgba(26,53,85,0.35); margin-top:4px; }
.hpi-kbd-item   { display:flex; align-items:center; gap:5px;
                  font-family:'DM Sans',sans-serif; font-size:11px; color:var(--npi-txt4); }
.hpi-kbd-item kbd {
  font-family:'JetBrains Mono',monospace; font-size:9px;
  padding:2px 6px; border-radius:4px;
  background:rgba(14,37,68,0.8); border:1px solid rgba(42,77,114,0.5);
  color:var(--npi-txt3); }

/* ── Scan header ── */
.hpi-scan-hdr     { padding:12px 16px 10px; border-bottom:1px solid rgba(26,53,85,0.4);
                    flex-shrink:0; display:flex; flex-direction:column; gap:7px; }
.hpi-scan-hdr-left{ display:flex; align-items:baseline; gap:12px; }
.hpi-prog         { font-family:'JetBrains Mono',monospace; font-size:10px;
                    color:var(--npi-txt4); letter-spacing:.5px; }
.hpi-scan-bar-wrap{ height:3px; background:rgba(26,53,85,0.4); border-radius:2px; overflow:hidden; }
.hpi-scan-bar     { height:100%; background:linear-gradient(90deg,#00e5c0,#00b4d8);
                    border-radius:2px; transition:width .3s; }
.hpi-hint-strip   { font-family:'DM Sans',sans-serif; font-size:11px;
                    color:var(--npi-txt4); }
.hpi-hint-strip kbd {
  font-family:'JetBrains Mono',monospace; font-size:9px;
  padding:1px 5px; border-radius:3px;
  background:rgba(14,37,68,0.8); border:1px solid rgba(42,77,114,0.4);
  color:var(--npi-txt3); }

/* ── Symptom list ── */
.hpi-sym-list   { flex:1; overflow-y:auto; padding:8px 0; }
.hpi-sym-row    { display:grid; grid-template-columns:36px 1fr auto 10px;
                  align-items:start; gap:0 10px;
                  padding:9px 16px; border-bottom:1px solid rgba(26,53,85,0.2);
                  cursor:pointer; transition:background .1s; }
.hpi-sym-row:hover  { background:rgba(14,37,68,0.4); }
.hpi-sym-row.active { background:rgba(14,37,68,0.75);
                      border-left:2px solid var(--npi-teal);
                      padding-left:14px; }
.hpi-sym-row.answered { opacity:.8; }
.hpi-sym-idx    { font-family:'JetBrains Mono',monospace; font-size:10px;
                  color:var(--npi-txt4); padding-top:1px; }
.hpi-sym-body   { display:flex; flex-direction:column; gap:5px; }
.hpi-sym-label  { font-family:'DM Sans',sans-serif; font-size:13px;
                  font-weight:600; color:var(--npi-txt); display:flex; align-items:center; gap:7px; }
.hpi-type-badge { font-family:'JetBrains Mono',monospace; font-size:8px;
                  letter-spacing:.5px; text-transform:uppercase;
                  padding:1px 6px; border-radius:3px;
                  background:rgba(42,77,114,0.4); color:var(--npi-txt4); }
.hpi-sym-hint   { font-family:'DM Sans',sans-serif; font-size:11px;
                  color:var(--npi-txt4); font-style:italic; }
.hpi-sym-opts   { display:flex; flex-wrap:wrap; gap:5px; margin-top:2px; }
.hpi-opt-chip   { display:flex; align-items:center; gap:4px;
                  padding:3px 9px; border-radius:5px;
                  border:1px solid rgba(42,77,114,0.4);
                  background:rgba(14,37,68,0.6);
                  font-family:'DM Sans',sans-serif; font-size:11px; color:var(--npi-txt3); }
.hpi-opt-scale  { padding:3px 7px; }
.hpi-opt-key    { font-family:'JetBrains Mono',monospace; font-size:9px;
                  font-weight:700; color:var(--npi-teal); margin-right:1px; }
.hpi-sym-ans    { font-family:'JetBrains Mono',monospace; font-size:11px;
                  padding-top:2px; text-align:right; }
.hpi-sym-dot    { width:7px; height:7px; border-radius:50%; margin-top:5px;
                  background:rgba(42,77,114,0.4); flex-shrink:0; }
.hpi-sym-dot.done { background:var(--npi-teal);
                    box-shadow:0 0 5px rgba(0,229,192,0.5); }
.hpi-sym-dot.skip { background:rgba(42,77,114,0.6); }

/* ── Scan footer ── */
.hpi-scan-footer { display:flex; align-items:center; gap:10px;
                   padding:12px 16px; border-top:1px solid rgba(26,53,85,0.4);
                   flex-shrink:0; }

/* ── Buttons ── */
.hpi-done-btn { padding:9px 20px; border-radius:9px; cursor:pointer;
                background:linear-gradient(135deg,#00e5c0,#00b4d8);
                border:none; color:#050f1e;
                font-family:'DM Sans',sans-serif; font-size:13px; font-weight:700; }
.hpi-ghost-btn{ padding:7px 14px; border-radius:8px; cursor:pointer;
                background:transparent;
                border:1px solid rgba(42,77,114,0.5); color:var(--npi-txt3);
                font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600; }
.hpi-ghost-btn:hover { border-color:rgba(0,229,192,.35); color:var(--npi-teal); }

/* ── Narrative phase ── */
.hpi-narr-hdr { display:flex; align-items:center; justify-content:space-between;
                gap:12px; flex-wrap:wrap; margin-bottom:4px; }
.hpi-badge-row{ display:flex; flex-wrap:wrap; gap:5px; margin-top:2px; }
.hpi-badge    { display:flex; align-items:center; gap:5px; padding:3px 9px;
                border-radius:5px; border:1px solid; font-size:11px; }
.hpi-badge-label { font-family:'JetBrains Mono',monospace; font-size:9px;
                   letter-spacing:.5px; opacity:.7; }
.hpi-badge-val   { font-family:'DM Sans',sans-serif; font-weight:600; }
`;

// ─── DDx HELPERS ─────────────────────────────────────────────────────────────
function likelyCol(likelihood) {
  if (!likelihood) return "var(--npi-txt4)";
  const l = likelihood.toLowerCase();
  if (l === "high")     return "#ff6b6b";
  if (l === "moderate") return "#f5c842";
  return "#00e5c0";
}

function buildDdxPrompt(
  cc, answers, symptoms,
  patientAge, patientSex, vitals, medications, allergies, pmhSelected,
) {
  const positives = symptoms
    .filter(s => answers[s.id] && !["skip","no"].includes(answers[s.id]))
    .map(s => `${s.label}: ${answers[s.id] === "yes" ? (s.hint || "present") : answers[s.id]}`);
  const negatives = symptoms
    .filter(s => answers[s.id] === "no")
    .map(s => s.hint || s.label.toLowerCase());
  const pmhList = Object.keys(pmhSelected || {}).filter(k => pmhSelected[k]).slice(0, 6).join(", ");
  return [
    "You are an emergency physician generating a ranked differential diagnosis list.",
    "Return ONLY valid JSON: { \"differentials\": [ { rank, diagnosis, likelihood (\"High\"|\"Moderate\"|\"Low\"), supporting: string[], against: string[], workup: string[], note: string } ] }",
    "Generate exactly 4-5 differentials, ranked by clinical probability. Be specific — not generic.",
    "",
    `Chief complaint: ${cc.text || "unspecified"}.`,
    patientAge ? `Patient: ${patientAge}y ${patientSex || ""}.` : "",
    vitals?.bp ? `Vitals: BP ${vitals.bp} HR ${vitals.hr||"-"} SpO2 ${vitals.spo2||"-"} T ${vitals.temp||"-"}.` : "",
    medications?.length ? `Medications: ${medications.slice(0,6).join("; ")}.` : "",
    allergies?.length   ? `Allergies: ${allergies.join(", ")}.`               : "",
    pmhList             ? `PMH: ${pmhList}.`                                   : "",
    positives.length    ? `Positive findings from HPI scan: ${positives.join("; ")}.`    : "No specific positive HPI findings documented.",
    negatives.length    ? `Negative findings (patient denies): ${negatives.join(", ")}.` : "",
    "",
    "Rules:",
    "- supporting and against arrays MUST reference the actual findings listed above (keep each item ≤5 words)",
    "- workup: 2-4 practical next steps ordered by priority",
    "- note: one clinical pearl sentence relevant to ED management of this diagnosis",
  ].filter(Boolean).join("\n");
}

const DDX_SCHEMA = {
  type: "object",
  properties: {
    differentials: {
      type: "array",
      items: {
        type: "object",
        properties: {
          rank:       { type: "number" },
          diagnosis:  { type: "string" },
          likelihood: { type: "string" },
          supporting: { type: "array", items: { type: "string" } },
          against:    { type: "array", items: { type: "string" } },
          workup:     { type: "array", items: { type: "string" } },
          note:       { type: "string" },
        },
      },
    },
  },
};

const SYMPTOM_SCHEMA = {
  type: "object",
  properties: {
    symptoms: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id:   { type: "string" },
          label:{ type: "string" },
          type: { type: "string" },
          hint: { type: "string" },
          opts: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function InlineHPITab({
  // FIX 1: cc defaults to {} — prevents useState(cc.hpi) crash on undefined mount
  cc = {}, setCC, onAdvance,
  // FIX 5: onToast replaces direct sonner import
  onToast,
  // Context props for DDx (optional — degrades gracefully if absent)
  patientAge, patientSex, vitals, medications, allergies, pmhSelected,
}) {
  const [phase,     setPhase]     = useState("idle");
  const [loading,   setLoading]   = useState(false);   // FIX 4: separate loading bool for finally
  const [symptoms,  setSymptoms]  = useState([]);
  const [answers,   setAnswers]   = useState({});
  const [focusIdx,  setFocusIdx]  = useState(0);
  const [narrative, setNarrative] = useState(cc.hpi || "");

  // ── DDx state ──────────────────────────────────────────────────────────────
  const [ddx,        setDdx]        = useState(null);
  const [ddxLoading, setDdxLoading] = useState(false);
  const [ddxError,   setDdxError]   = useState(false);
  const [ddxOpen,    setDdxOpen]    = useState(true);

  const panelRef = useRef(null);

  // ── Toast helper — falls back to console if onToast not wired ──────────────
  const showToast = useCallback((msg, type = "success") => {
    if (onToast) { onToast(msg, type); return; }
    if (type === "error") console.error("[HPI]", msg);
    else console.log("[HPI]", msg);
  }, [onToast]);

  // ── Answer display helpers ─────────────────────────────────────────────────
  const answerColor = (ans) => {
    if (!ans || ans === "skip") return "var(--npi-txt4)";
    if (ans === "yes") return "var(--npi-coral)";
    if (ans === "no")  return "var(--npi-teal)";
    return "var(--npi-blue)";
  };

  const answerLabel = (sym, ans) => {
    if (!ans || ans === "skip") return "\u2014";
    if (ans === "yes") return sym.hint || "Present";
    if (ans === "no")  return "Absent";
    return ans;
  };

  // ── Narrative builder ──────────────────────────────────────────────────────
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

  // ── Scan completion ────────────────────────────────────────────────────────
  const finishScan = useCallback((ans) => {
    const text = buildNarrative(ans);
    setNarrative(text);
    setCC(prev => ({ ...prev, hpi: text }));
    setPhase("narrative");
    // DDx triggered by useEffect on phase change
  }, [buildNarrative, setCC]);

  const advance = useCallback((newAnswers, idx) => {
    if (idx + 1 >= symptoms.length) { finishScan(newAnswers); }
    else { setFocusIdx(idx + 1); }
  }, [symptoms.length, finishScan]);

  // ── DDx generation ─────────────────────────────────────────────────────────
  const runDDx = useCallback(async () => {
    if (ddxLoading) return;
    setDdxLoading(true);
    setDdxError(false);
    setDdx(null);
    try {
      const prompt = buildDdxPrompt(
        cc, answers, symptoms,
        patientAge, patientSex, vitals, medications, allergies, pmhSelected,
      );
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: DDX_SCHEMA,
      });
      const parsed = typeof res === "object"
        ? res
        : JSON.parse(String(res).replace(/```json|```/g, "").trim());
      setDdx(parsed.differentials || []);
    } catch(_) {
      setDdxError(true);
    } finally {
      setDdxLoading(false);
    }
  }, [cc, answers, symptoms, patientAge, patientSex, vitals, medications, allergies, pmhSelected, ddxLoading]);

  // ── DDx auto-trigger — fires once on scan completion ──────────────────────
  useEffect(() => {
    if (phase === "narrative" && symptoms.length > 0 && !ddx && !ddxLoading) {
      runDDx();
    }
  }, [phase, runDDx, symptoms.length, ddx, ddxLoading]);

  // ── Append DDx summary to HPI narrative ───────────────────────────────────
  const appendDdxToHpi = useCallback(() => {
    if (!ddx || !ddx.length) return;
    const summary = ddx
      .map((d, i) => {
        const sup = (d.supporting || []).slice(0, 2).join(", ");
        return `(${i+1}) ${d.diagnosis} [${d.likelihood}]${sup ? ` \u2014 ${sup}` : ""}`;
      })
      .join("; ");
    const appended = narrative + `\n\nDifferential diagnoses considered: ${summary}.`;
    setNarrative(appended);
    setCC(prev => ({ ...prev, hpi: appended }));
    showToast("DDx appended to HPI narrative");
  }, [ddx, narrative, setCC, showToast]);

  // ── Restart helpers ────────────────────────────────────────────────────────
  const goToIdle = useCallback(() => { setPhase("idle"); setDdx(null); setDdxError(false); }, []);
  const goToScan = useCallback(() => { setPhase("scan"); setDdx(null); setDdxError(false); }, []);

  // ── Symptom generation ─────────────────────────────────────────────────────
  // FIX 3: (cc.text || "").trim() — safe if cc.text is undefined
  // FIX 4: finally { setLoading(false) } — loading state always clears
  const generateSymptoms = useCallback(async () => {
    if (!(cc.text || "").trim()) {
      showToast("Enter a chief complaint first (Cmd+2).", "error");
      return;
    }
    setLoading(true);
    setPhase("loading");
    setDdx(null);
    setDdxError(false);
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
        response_json_schema: SYMPTOM_SCHEMA,
      });
      const parsed = typeof result === "object"
        ? result
        : JSON.parse(String(result).replace(/```json|```/g, "").trim());
      setSymptoms(parsed.symptoms || []);
      setAnswers({});
      setFocusIdx(0);
      setPhase("scan");
    } catch(_) {
      showToast("Could not generate HPI template. Check your connection.", "error");
      setPhase("idle");
    } finally {
      setLoading(false);
    }
  }, [cc.text, showToast]);

  useEffect(() => {
    if (phase === "scan") setTimeout(() => panelRef.current?.focus(), 60);
  }, [phase]);

  // ── Keyboard handler ───────────────────────────────────────────────────────
  const handleKey = useCallback((e) => {
    if (phase !== "scan") return;
    const sym = symptoms[focusIdx];
    if (!sym) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIdx(i => Math.min(i + 1, symptoms.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIdx(i => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Escape")    { finishScan(answers); return; }
    if (e.key === "Backspace" && !answers[sym.id]) {
      setFocusIdx(i => Math.max(i - 1, 0));
      return;
    }
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

  // ── IDLE / LOADING ─────────────────────────────────────────────────────────
  if (phase === "idle" || phase === "loading") {
    return (
      <div className="hpi-idle">
        <style>{HPI_CSS}</style>
        <div className="hpi-cc-row">
          <span className="hpi-field-lbl">Chief Complaint</span>
          <span className="hpi-cc-val">
            {cc.text || (
              <span className="hpi-muted">Not set — navigate to CC first (Cmd+2)</span>
            )}
          </span>
        </div>
        {cc.text && (
          <button className="hpi-gen-btn" onClick={generateSymptoms} disabled={loading}>
            {loading
              ? <><span className="hpi-spinner">&#x23F3;</span> Generating symptom checklist&hellip;</>
              : <><span>&#10022;</span> Generate AI Symptom Template</>}
          </button>
        )}
        {cc.hpi && (
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <div className="hpi-field-lbl">Current HPI</div>
            <textarea className="hpi-ta" value={narrative} rows={6}
              onChange={e => {
                setNarrative(e.target.value);
                setCC(prev => ({ ...prev, hpi: e.target.value }));
              }}
            />
          </div>
        )}
        <div className="hpi-kbd-legend">
          <span className="hpi-kbd-item"><kbd>&#x2191;&#x2193;</kbd> Navigate</span>
          <span className="hpi-kbd-item"><kbd>Y</kbd> Present</span>
          <span className="hpi-kbd-item"><kbd>N</kbd> Absent</span>
          <span className="hpi-kbd-item"><kbd>Space</kbd> Skip</span>
          <span className="hpi-kbd-item"><kbd>0-9</kbd> Scale / option</span>
          <span className="hpi-kbd-item"><kbd>Esc</kbd> Build narrative</span>
        </div>
      </div>
    );
  }

  // ── SCAN PHASE ─────────────────────────────────────────────────────────────
  if (phase === "scan") {
    const done = Object.keys(answers).filter(k => answers[k] !== "skip").length;
    const pct  = symptoms.length
      ? Math.round((Object.keys(answers).length / symptoms.length) * 100)
      : 0;
    return (
      <div ref={panelRef} tabIndex={0} onKeyDown={handleKey} className="hpi-scan" style={{ outline:"none" }}>
        <style>{HPI_CSS}</style>
        <div className="hpi-scan-hdr">
          <div className="hpi-scan-hdr-left">
            <span className="hpi-cc-val">{cc.text}</span>
            <span className="hpi-prog">{Object.keys(answers).length} / {symptoms.length}</span>
          </div>
          <div className="hpi-scan-bar-wrap">
            <div className="hpi-scan-bar" style={{ width: pct + "%" }} />
          </div>
          <div className="hpi-hint-strip">
            <kbd>&#x2191;&#x2193;</kbd> nav &nbsp;&middot;&nbsp;
            <kbd>Y</kbd> yes &nbsp;&middot;&nbsp;
            <kbd>N</kbd> no &nbsp;&middot;&nbsp;
            <kbd>Space</kbd> skip &nbsp;&middot;&nbsp;
            <kbd>0-9</kbd> scale/option &nbsp;&middot;&nbsp;
            <kbd>Esc</kbd> done
          </div>
        </div>
        <div className="hpi-sym-list">
          {symptoms.map((sym, i) => {
            const ans    = answers[sym.id];
            const active = i === focusIdx;
            return (
              <div key={sym.id}
                className={`hpi-sym-row${active ? " active" : ""}${ans ? " answered" : ""}`}
                onClick={() => setFocusIdx(i)}>
                <div className="hpi-sym-idx">{String(i + 1).padStart(2, "0")}</div>
                <div className="hpi-sym-body">
                  <div className="hpi-sym-label">
                    {sym.label}
                    {sym.type === "scale"  && <span className="hpi-type-badge">scale</span>}
                    {sym.type === "yesno"  && <span className="hpi-type-badge">Y/N</span>}
                    {sym.type === "choice" && <span className="hpi-type-badge">choice</span>}
                  </div>
                  {active && sym.hint && (
                    <div className="hpi-sym-hint">{sym.hint}</div>
                  )}
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
                <div className="hpi-sym-ans" style={{ color: answerColor(ans) }}>
                  {answerLabel(sym, ans)}
                </div>
                <div className={`hpi-sym-dot${ans && ans !== "skip" ? " done" : ans === "skip" ? " skip" : ""}`} />
              </div>
            );
          })}
        </div>
        <div className="hpi-scan-footer">
          <button className="hpi-done-btn" onClick={() => finishScan(answers)}>
            Build Narrative ({done} answered) &rarr;
          </button>
          <button className="hpi-ghost-btn" onClick={goToIdle}>&#8635; Restart</button>
        </div>
      </div>
    );
  }

  // ── NARRATIVE PHASE ────────────────────────────────────────────────────────
  const answeredCount = Object.keys(answers).filter(k => answers[k] && answers[k] !== "skip").length;

  return (
    <div className="hpi-narrative">
      <style>{HPI_CSS}</style>

      <div className="hpi-narr-hdr">
        <span className="hpi-cc-val">{cc.text}</span>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <button className="hpi-ghost-btn" onClick={goToScan}>&#8592; Edit Answers</button>
          <button className="hpi-ghost-btn" onClick={goToIdle}>&#8635; Restart</button>
          {onAdvance && (
            <button className="hpi-done-btn" onClick={onAdvance}>Continue to ROS &rarr;</button>
          )}
        </div>
      </div>

      {onAdvance && (
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
          <kbd style={{
            fontFamily: "'JetBrains Mono',monospace", fontSize:10, color:"var(--npi-blue)",
            background: "rgba(59,158,255,.1)", border:"1px solid rgba(59,158,255,.2)",
            borderRadius: 4, padding:"1px 6px",
          }}>&#8984; Enter</kbd>
          <span style={{ fontSize:11, color:"var(--npi-txt4)", fontFamily:"'DM Sans',sans-serif" }}>
            Continue to ROS
          </span>
        </div>
      )}

      {/* ── Two-column layout: narrative left, DDx right ── */}
      <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>

        {/* Left: narrative + answer badges */}
        <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:8 }}>
          <div className="hpi-field-lbl" style={{ marginBottom:0 }}>HPI Narrative — edit freely</div>
          <textarea className="hpi-ta" value={narrative} autoFocus rows={7}
            onChange={e => {
              setNarrative(e.target.value);
              setCC(prev => ({ ...prev, hpi: e.target.value }));
            }}
            onKeyDown={e => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                onAdvance?.();
              }
            }}
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

        {/* Right: DDx panel */}
        <div style={{ width:330, flexShrink:0 }}>
          <div style={{
            border: "1px solid rgba(26,53,85,0.6)",
            borderTop: "2px solid rgba(163,146,254,0.55)",
            borderRadius: 11, overflow: "hidden",
            background: "rgba(10,20,40,0.75)",
          }}>

            {/* DDx header */}
            <div style={{
              padding: "10px 14px 9px",
              borderBottom: "1px solid rgba(26,53,85,0.45)",
              background: "rgba(5,12,28,0.7)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                <span style={{ fontSize:14 }}>&#x1F9E0;</span>
                <div>
                  <div style={{
                    fontFamily: "'JetBrains Mono',monospace", fontSize:9,
                    color: "#a29bfe", letterSpacing:1.5, textTransform:"uppercase",
                  }}>Differential Diagnoses</div>
                  <div style={{
                    fontFamily: "'DM Sans',sans-serif", fontSize:10,
                    color: "var(--npi-txt4)", marginTop:1,
                  }}>
                    {ddxLoading
                      ? "Generating from scan data\u2026"
                      : ddx
                      ? `${ddx.length} diagnoses \xb7 ${answeredCount} findings used`
                      : `Based on ${answeredCount} answered symptoms`}
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                {(ddx || ddxError) && !ddxLoading && (
                  <button onClick={runDDx} style={{
                    fontFamily: "'JetBrains Mono',monospace", fontSize:8,
                    letterSpacing:1, textTransform:"uppercase",
                    padding: "3px 8px", borderRadius:4, cursor:"pointer",
                    border: "1px solid rgba(163,146,254,0.35)",
                    background: "transparent", color:"#a29bfe",
                  }}>
                    &#x21BA; Redo
                  </button>
                )}
                <button onClick={() => setDdxOpen(o => !o)} style={{
                  fontFamily: "'JetBrains Mono',monospace", fontSize:10,
                  padding: "3px 7px", borderRadius:4, cursor:"pointer",
                  border: "1px solid rgba(42,77,114,0.4)",
                  background: "transparent", color:"var(--npi-txt4)",
                }}>
                  {ddxOpen ? "\u2212" : "\u002B"}
                </button>
              </div>
            </div>

            {ddxOpen && (
              <div style={{ padding:"10px 12px", display:"flex", flexDirection:"column", gap:9 }}>

                {/* Loading skeleton */}
                {ddxLoading && (
                  <>
                    <style>{`@keyframes ddx-pulse{0%,100%{opacity:.35}50%{opacity:.8}}`}</style>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{
                        padding: "10px 11px", borderRadius:8,
                        background: "rgba(14,37,68,0.5)",
                        border: "1px solid rgba(26,53,85,0.3)",
                      }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                          <div style={{ height:9, width:120, borderRadius:4,
                            background: "rgba(163,146,254,0.2)",
                            animation:`ddx-pulse 1.4s ${i*0.12}s ease-in-out infinite` }} />
                          <div style={{ height:9, width:44, borderRadius:10,
                            background: "rgba(163,146,254,0.15)",
                            animation:`ddx-pulse 1.4s ${i*0.12+0.2}s ease-in-out infinite` }} />
                        </div>
                        {[65,45].map((w,j) => (
                          <div key={j} style={{ height:7, width:`${w}%`, borderRadius:3, marginBottom:5,
                            background: "rgba(42,77,114,0.2)",
                            animation:`ddx-pulse 1.4s ${i*0.12+j*0.1}s ease-in-out infinite` }} />
                        ))}
                      </div>
                    ))}
                  </>
                )}

                {/* Error state */}
                {ddxError && !ddxLoading && (
                  <div style={{
                    padding: "12px", borderRadius:8,
                    background: "rgba(255,107,107,0.07)",
                    border: "1px solid rgba(255,107,107,0.25)",
                    fontFamily: "'DM Sans',sans-serif", fontSize:12,
                    color: "#ff8a8a", display:"flex", flexDirection:"column", gap:8,
                  }}>
                    <span>&#x26A0; DDx generation failed</span>
                    <button onClick={runDDx} style={{
                      padding: "5px 12px", borderRadius:6, cursor:"pointer",
                      border: "1px solid rgba(255,107,107,0.35)",
                      background: "transparent", color:"#ff8a8a",
                      fontFamily: "'DM Sans',sans-serif", fontSize:11,
                    }}>Try again</button>
                  </div>
                )}

                {/* Waiting for first generation */}
                {!ddx && !ddxLoading && !ddxError && (
                  <div style={{
                    padding: "16px 10px", textAlign:"center",
                    fontFamily: "'DM Sans',sans-serif", fontSize:11,
                    color: "var(--npi-txt4)", fontStyle:"italic",
                  }}>
                    Generating differentials from your scan data&hellip;
                  </div>
                )}

                {/* DDx cards */}
                {ddx && !ddxLoading && ddx.map((d, i) => {
                  const col = likelyCol(d.likelihood);
                  return (
                    <div key={i} style={{
                      padding: "10px 11px", borderRadius:9,
                      background: "rgba(14,37,68,0.65)",
                      border: `1px solid ${col}18`,
                      borderLeft: `3px solid ${col}`,
                    }}>
                      <div style={{
                        display: "flex", alignItems:"center",
                        justifyContent: "space-between", marginBottom:7, gap:6,
                      }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 9, color:"var(--npi-txt4)", letterSpacing:.5,
                          }}>{String(i+1).padStart(2,"0")}</span>
                          <span style={{
                            fontFamily: "'DM Sans',sans-serif",
                            fontSize: 12, fontWeight:700, color:"var(--npi-txt)", lineHeight:1.2,
                          }}>{d.diagnosis}</span>
                        </div>
                        <span style={{
                          fontFamily: "'JetBrains Mono',monospace", fontSize:8,
                          padding: "2px 7px", borderRadius:10, letterSpacing:.5,
                          background: `${col}18`, border:`1px solid ${col}44`, color:col,
                          whiteSpace: "nowrap", flexShrink:0,
                        }}>{d.likelihood || "Unknown"}</span>
                      </div>

                      {d.supporting?.length > 0 && (
                        <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:5 }}>
                          {d.supporting.map(s => (
                            <span key={s} style={{
                              fontFamily: "'DM Sans',sans-serif", fontSize:10,
                              padding: "2px 7px", borderRadius:3,
                              background: "rgba(255,107,107,0.1)",
                              border: "1px solid rgba(255,107,107,0.22)",
                              color: "#ff8a8a", display:"flex", alignItems:"center", gap:3,
                            }}>
                              <span style={{ fontSize:8 }}>&#x2713;</span>{s}
                            </span>
                          ))}
                        </div>
                      )}

                      {d.against?.length > 0 && (
                        <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:5 }}>
                          {d.against.map(s => (
                            <span key={s} style={{
                              fontFamily: "'DM Sans',sans-serif", fontSize:10,
                              padding: "2px 7px", borderRadius:3,
                              background: "rgba(0,229,192,0.06)",
                              border: "1px solid rgba(0,229,192,0.2)",
                              color: "var(--npi-teal)", display:"flex", alignItems:"center", gap:3,
                            }}>
                              <span style={{ fontSize:8 }}>&#x2717;</span>{s}
                            </span>
                          ))}
                        </div>
                      )}

                      {d.workup?.length > 0 && (
                        <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:6 }}>
                          {d.workup.map(w => (
                            <span key={w} style={{
                              fontFamily: "'JetBrains Mono',monospace", fontSize:9,
                              padding: "2px 7px", borderRadius:3,
                              background: "rgba(59,158,255,0.08)",
                              border: "1px solid rgba(59,158,255,0.22)",
                              color: "#3b9eff",
                            }}>{w}</span>
                          ))}
                        </div>
                      )}

                      {d.note && (
                        <div style={{
                          fontFamily: "'DM Sans',sans-serif", fontSize:10,
                          color: "var(--npi-txt4)", fontStyle:"italic",
                          lineHeight: 1.5, paddingTop:4,
                          borderTop: "1px solid rgba(26,53,85,0.3)",
                        }}>
                          &#x26A1; {d.note}
                        </div>
                      )}
                    </div>
                  );
                })}

                {ddx && !ddxLoading && (
                  <button onClick={appendDdxToHpi} style={{
                    padding: "8px 14px", borderRadius:8, cursor:"pointer",
                    border: "1px solid rgba(163,146,254,0.35)",
                    background: "rgba(163,146,254,0.08)",
                    color: "#a29bfe", fontFamily:"'DM Sans',sans-serif",
                    fontSize: 11, fontWeight:600,
                    display: "flex", alignItems:"center", justifyContent:"center", gap:6,
                  }}>
                    &#x2B07; Append DDx Summary to HPI
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}