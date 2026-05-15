// QuickNoteMDMEnhancer.jsx  v1.0
// Two exports:
//   EMLevel      — real-time CMS 2024 E/M complexity meter (no AI, pure scoring)
//   MDMThread    — longitudinal MDM timeline with AI-drafted addenda
//
// No router · no localStorage · no form · no alert · straight quotes · <1600 lines

import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";

// ── SHARED TOKENS ──────────────────────────────────────────────────────────────
const QN = {
  txt:  "var(--qn-txt)",  txt2: "var(--qn-txt2)", txt3: "var(--qn-txt3)",
  txt4: "var(--qn-txt4)", teal: "var(--qn-teal)", gold: "var(--qn-gold)",
  blue: "var(--qn-blue)", coral:"var(--qn-coral)",green:"var(--qn-green)",
  purple:"var(--qn-purple)",
};

// ── CMS 2024 E/M SCORING ENGINE ───────────────────────────────────────────────
const PROBLEM_PATTERNS = {
  high: [
    /\b(sepsis|septic shock|STEMI|stroke|intubat|mechanical ventil|ICU|life.?threatening|threat to life|cardiac arrest|massive hemorrhage|altered mental status|AMS\b|respiratory failure|airway)\b/i,
    /\b(severe exacerbation|acute decompensation|acute organ failure|DKA|HHS|status epilepticus|PE with hemodynam|tension pneumo|anaphylaxis)\b/i,
  ],
  moderate: [
    /\b(new problem|new diagnosis|undiagnosed|uncertain prognosis|worsening chronic|exacerbation|acute on chronic|pending workup)\b/i,
    /\b(chest pain rule out|rule out ACS|r\/o MI|r\/o PE|new onset|first episode)\b/i,
    /\b(HTN urgency|hypertensive urgency|hypertensive emergency|CHF exacerbation|COPD exacerbation|asthma exacerbation)\b/i,
  ],
  low: [
    /\b(stable chronic|well.controlled|chronic stable|established|chronic pain|chronic headache|stable)\b/i,
    /\b(follow.?up|refill|routine|minor|self.?limited|1-2 self)\b/i,
  ],
};

const DATA_PATTERNS = {
  high: [
    /\b(independent interpretation|interpreted by me|personally reviewed|I read the|I interpreted)\b/i,
    /\b(discussed with specialist|cardiology consult|neurology consult|surgery consult|discussed with (attending|fellow|specialist))\b/i,
  ],
  moderate: [
    /\b(reviewed external|outside records|prior records|transferred records|from (OSH|outside hospital|PCP|primary care))\b/i,
    /\b(CT scan|MRI|echocardiogram|LP|lumbar puncture|cardiac cath|stress test|nuclear)\b/i,
    /\b(discussed with|consulted|spoke with|updated (PCP|attending|specialist))\b/i,
  ],
  low: [
    /\b(labs? (ordered|resulted|reviewed|pending|obtained)|CBC|BMP|CMP|troponin|lactate|UA|urinalysis|BNP|D.dimer)\b/i,
    /\b(CXR|chest x.ray|x.ray|EKG|ECG|ultrasound|point.?of.?care)\b/i,
    /\b(reviewed results|results reviewed|result noted)\b/i,
  ],
};

const RISK_PATTERNS = {
  high: [
    /\b(hospital admission|admit to|admitted to|ICU|critical care|surgical intervention|emergent surgery|intubat|vasopressor|thrombolytic|tPA|heparin drip|IV heparin)\b/i,
    /\b(drug.?requiring.?intensive monitoring|parenteral controlled|IV anticoagul|IV thrombolytic)\b/i,
    /\b(DNR|DNI|comfort care|goals of care|withdrawal of care|hospice)\b/i,
  ],
  moderate: [
    /\b(prescription (drug|medication|antibiotic|opioid|steroid|anticoagulant)|new prescription|started on|prescribed)\b/i,
    /\b(IV fluid|IV antibiotic|IV medication|parenteral|observation|referral to)\b/i,
    /\b(minor (surgery|procedure)|laceration repair|I&D|fracture reduction|joint injection|LP)\b/i,
  ],
  low: [
    /\b(OTC|over.the.counter|ibuprofen|acetaminophen|tylenol|advil|motrin|bandage|splint|ice|rest|RICE)\b/i,
    /\b(discharge (with|home)|home with|outpatient follow|PCP follow|referral)\b/i,
  ],
};

// CMS 2024 MDM table: need 2/3 pillars to meet a level
const EM_LEVELS = [
  { code:"99281", label:"Level 1", color:"#5a82a8", desc:"Self-limited, minimal", prob:0, data:0, risk:0 },
  { code:"99282", label:"Level 2", color:"#3dffa0", desc:"Low-straightforward",   prob:1, data:1, risk:1 },
  { code:"99283", label:"Level 3", color:"#3b9eff", desc:"Low complexity",         prob:2, data:2, risk:2 },
  { code:"99284", label:"Level 4", color:"#f5c842", desc:"Moderate complexity",    prob:3, data:3, risk:3 },
  { code:"99285", label:"Level 5", color:"#ff6b6b", desc:"High complexity",        prob:4, data:4, risk:4 },
];

function scorePillar(text, patterns) {
  if (!text) return 0;
  const hi  = patterns.high.some(p => p.test(text));
  const mid = patterns.moderate.some(p => p.test(text));
  const lo  = patterns.low.some(p => p.test(text));
  if (hi)  return 4;
  if (mid) return 3;
  if (lo)  return 2;
  if (text.trim().length > 60) return 1; // something entered
  return 0;
}

function computeEMLevel(mdmText, hpi, labs, imaging, ekg, newVitals, consults) {
  const fullText = [mdmText, hpi, labs, imaging, ekg, newVitals,
    (consults||[]).map(c => c.service + " " + c.recommendation).join(" ")
  ].filter(Boolean).join("\n");

  const probScore = scorePillar(fullText, PROBLEM_PATTERNS);
  const dataScore = scorePillar(fullText, DATA_PATTERNS);
  const riskScore = scorePillar(fullText, RISK_PATTERNS);

  // Two-of-three rule: level = min of the top 2 out of 3 scores
  const sorted = [probScore, dataScore, riskScore].sort((a,b) => b-a);
  const effectiveScore = sorted[1]; // second-highest (the lower of the top two)

  let levelIdx = 0;
  if (effectiveScore >= 4) levelIdx = 4;
  else if (effectiveScore >= 3) levelIdx = 3;
  else if (effectiveScore >= 2) levelIdx = 2;
  else if (effectiveScore >= 1) levelIdx = 1;
  else levelIdx = 0;

  return { probScore, dataScore, riskScore, levelIdx, level: EM_LEVELS[levelIdx] };
}

function missingItems(score) {
  const items = [];
  if (score.probScore < 4 && score.riskScore < 4 && score.dataScore < 4) {
    if (score.probScore < 3) items.push("Document higher-acuity problem complexity (worsening chronic, new undiagnosed)");
    if (score.dataScore < 3) items.push("Document data reviewed: external records, independent interpretation, or specialist discussion");
    if (score.riskScore < 3) items.push("Document management risk: prescription drug, IV treatment, or procedure");
  }
  return items;
}

// ── PILLAR BAR COMPONENT ──────────────────────────────────────────────────────
function PillarBar({ label, score, color }) {
  const MAX = 4;
  const pct = Math.round((score / MAX) * 100);
  return (
    <div style={{ marginBottom:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
          color:QN.txt4, letterSpacing:.8, textTransform:"uppercase" }}>{label}</span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:score>=3?color:QN.txt4 }}>
          {score === 0 ? "none" : score === 1 ? "minimal" : score === 2 ? "low" : score === 3 ? "moderate" : "high"}
        </span>
      </div>
      <div style={{ height:4, background:"rgba(42,79,122,.25)", borderRadius:2, overflow:"hidden" }}>
        <div style={{ height:"100%", width:pct+"%", background:score>=4?color:score>=3?color+"cc":score>=2?color+"77":color+"44",
          borderRadius:2, transition:"width .4s ease" }} />
      </div>
    </div>
  );
}

// ── EM LEVEL EXPORT ───────────────────────────────────────────────────────────
export function EMLevel({ mdmText, hpi, labs, imaging, ekg, newVitals, consults }) {
  const [result, setResult] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const hasContent = [mdmText, hpi, labs, imaging].some(t => t && t.trim().length > 20);
      if (!hasContent) { setResult(null); return; }
      setResult(computeEMLevel(mdmText, hpi, labs, imaging, ekg, newVitals, consults));
    }, 600);
    return () => clearTimeout(timerRef.current);
  }, [mdmText, hpi, labs, imaging, ekg, newVitals, consults]);

  if (!result) return (
    <div style={{ padding:"8px 12px", borderRadius:8,
      background:"rgba(14,37,68,.35)", border:"1px solid rgba(42,79,122,.25)",
      fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:QN.txt4, letterSpacing:.5 }}>
      ⬡ E/M LEVEL — enter MDM + results to score
    </div>
  );

  const { probScore, dataScore, riskScore, levelIdx, level } = result;
  const gaps = missingItems(result);
  const nextLevel = EM_LEVELS[Math.min(levelIdx + 1, 4)];
  const canUpgrade = levelIdx < 4;

  return (
    <div style={{ borderRadius:10, border:"1px solid "+level.color+"44",
      background:level.color+"08", overflow:"hidden" }}>
      {/* Level badge row */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
        borderBottom:"1px solid "+level.color+"22", flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:10, height:10, borderRadius:"50%", background:level.color,
            boxShadow:"0 0 6px "+level.color+"88", flexShrink:0 }} />
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700,
            color:level.color, letterSpacing:.5 }}>{level.label}</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:level.color+"cc" }}>
            {level.code}
          </span>
        </div>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:QN.txt3 }}>
          {level.desc}
        </span>
        {canUpgrade && (
          <span style={{ marginLeft:"auto", fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:nextLevel.color+"aa", background:nextLevel.color+"10",
            border:"1px solid "+nextLevel.color+"30", borderRadius:4, padding:"2px 7px" }}>
            ↑ next: {nextLevel.label} ({nextLevel.code})
          </span>
        )}
        {!canUpgrade && (
          <span style={{ marginLeft:"auto", fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:QN.green, background:"rgba(61,255,160,.08)",
            border:"1px solid rgba(61,255,160,.25)", borderRadius:4, padding:"2px 7px" }}>
            ✓ max level
          </span>
        )}
      </div>

      {/* Pillar bars */}
      <div style={{ padding:"10px 14px", borderBottom:"1px solid rgba(42,79,122,.2)" }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:QN.txt4,
          letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>
          MDM Pillars — 2 of 3 determine level
        </div>
        <PillarBar label="Problem complexity" score={probScore} color={level.color} />
        <PillarBar label="Data reviewed / ordered" score={dataScore} color={level.color} />
        <PillarBar label="Management risk" score={riskScore} color={level.color} />
      </div>

      {/* Level matrix mini-chart */}
      <div style={{ padding:"8px 14px", display:"flex", gap:4, alignItems:"center" }}>
        {EM_LEVELS.map((lv, i) => (
          <div key={i} title={lv.code+" — "+lv.desc}
            style={{ flex:1, height:6, borderRadius:2,
              background:i <= levelIdx ? lv.color : lv.color+"22",
              transition:"background .3s", cursor:"default" }} />
        ))}
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:QN.txt4, marginLeft:6, whiteSpace:"nowrap" }}>
          {levelIdx+1}/5
        </span>
      </div>

      {/* Gap analysis */}
      {gaps.length > 0 && canUpgrade && (
        <div style={{ padding:"8px 14px", borderTop:"1px solid rgba(42,79,122,.2)" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, fontWeight:700,
            color:nextLevel.color, letterSpacing:1, textTransform:"uppercase", marginBottom:5 }}>
            to reach {nextLevel.label}:
          </div>
          {gaps.slice(0,2).map((g,i) => (
            <div key={i} style={{ display:"flex", gap:5, marginBottom:3 }}>
              <span style={{ color:nextLevel.color, flexShrink:0, fontSize:9 }}>▸</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:QN.txt2,
                lineHeight:1.45 }}>{g}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MDM THREAD / ADDENDUM ENGINE ──────────────────────────────────────────────

function timeLabel(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
}

function elapsed(start, end) {
  if (!start || !end) return "";
  const mins = Math.round((new Date(end) - new Date(start)) / 60000);
  if (mins < 60) return mins + " min";
  return Math.floor(mins/60) + "h " + (mins%60) + "m";
}

async function callClaude(system, user) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: system + "\n\n" + user,
    model: "claude_sonnet_4_6",
  });
  return typeof result === "string" ? result : result?.text || result?.content || JSON.stringify(result);
}

const ADDENDUM_SYSTEM = `You are an emergency medicine clinical documentation assistant embedded in Notrya AI.
Generate a concise MDM addendum note in the voice of the treating physician.
Rules:
- 100-220 words maximum
- Physician first-person voice ("I reviewed...", "Results notable for...")
- Structured: (1) Results/findings summary — only abnormals; (2) Impact on differential; (3) Updated plan
- No fabricated values. Only use what is provided.
- Reference guidelines by name when applicable (e.g. ACEP, AHA/ACC)
- End with updated risk level and disposition intent
- Plain text, no markdown headers`;

// ── MDM THREAD EXPORT ─────────────────────────────────────────────────────────
export function MDMThread({
  cc, hpi, working_diagnosis,
  mdmResult,
  mdmTimestamp,
  labs, imaging, ekg, newVitals, patientResponse,
  consults,
  onAddendumReady,
}) {
  const [entries,  setEntries]  = useState([]);
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState("");
  const [copiedId, setCopiedId] = useState("");
  const cpTimer = useRef(null);

  // Seed the first entry when mdmResult arrives
  useEffect(() => {
    if (!mdmResult || !mdmTimestamp) return;
    setEntries(prev => {
      const already = prev.find(e => e.type === "initial" && e.ts === mdmTimestamp);
      if (already) return prev;
      return [{ id:"init", type:"initial", ts:mdmTimestamp,
        label:"Initial Assessment", text:mdmResult, trigger:"" }, ...prev];
    });
  }, [mdmResult, mdmTimestamp]);

  const copyText = useCallback((text, id) => {
    try { navigator.clipboard.writeText(text); } catch {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    }
    setCopiedId(id);
    clearTimeout(cpTimer.current);
    cpTimer.current = setTimeout(() => setCopiedId(""), 2000);
  }, []);

  const generateAddendum = useCallback(async (trigger) => {
    setBusy(true);
    setError("");
    try {
      const context = `
Chief Complaint: ${cc || ""}
Working Diagnosis: ${working_diagnosis || ""}
Initial MDM: ${mdmResult || ""}

RESULTS SINCE LAST NOTE:
Lab Results: ${labs || "none"}
Imaging: ${imaging || "none"}
EKG: ${ekg || "none"}
Repeat Vitals: ${newVitals || "none"}
Patient Response to Treatment: ${patientResponse || "none"}
Consult Recommendations: ${(consults||[]).map(c => `${c.service}: ${c.recommendation}`).join("; ") || "none"}

Addendum trigger: ${trigger}
      `.trim();

      const draft = await callClaude(ADDENDUM_SYSTEM, context);
      const ts = new Date().toISOString();
      const id = "add-" + Date.now();
      const newEntry = { id, type:"addendum", ts, label:trigger, text:draft, trigger };
      setEntries(prev => [...prev, newEntry]);
      if (onAddendumReady) onAddendumReady(draft);
    } catch(e) {
      setError("API error: " + e.message);
    } finally {
      setBusy(false);
    }
  }, [cc, working_diagnosis, mdmResult, labs, imaging, ekg, newVitals, patientResponse, consults, onAddendumReady]);

  const hasResults = labs?.trim() || imaging?.trim() || ekg?.trim() || newVitals?.trim() || patientResponse?.trim();
  const hasInitial = entries.some(e => e.type === "initial");
  const initTs = entries.find(e => e.type === "initial")?.ts;

  const TRIGGERS = [
    { key:"labs",     label:"Labs Resulted",          icon:"🧪", cond: labs?.trim()            },
    { key:"imaging",  label:"Imaging Resulted",        icon:"🩻", cond: imaging?.trim()         },
    { key:"response", label:"Treatment Response",      icon:"📈", cond: patientResponse?.trim() },
    { key:"vitals",   label:"Repeat Vitals",           icon:"❤️",  cond: newVitals?.trim()        },
    { key:"consult",  label:"Consult Recommendation",  icon:"👨‍⚕️", cond: consults?.length > 0   },
  ];

  const availableTriggers = TRIGGERS.filter(t => t.cond);

  return (
    <div style={{ marginTop:10 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, flexWrap:"wrap" }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
          color:QN.txt4, letterSpacing:1, textTransform:"uppercase", flex:1 }}>
          Clinical Progression Timeline
        </span>
        {hasInitial && hasResults && !busy && (
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:QN.txt4 }}>
            Add addendum:
          </span>
        )}
        {hasInitial && availableTriggers.map(t => (
          <button key={t.key}
            onClick={() => generateAddendum(t.label)}
            disabled={busy}
            title={"Draft addendum: " + t.label}
            style={{ padding:"3px 9px", borderRadius:5, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:600,
              border:"1px solid rgba(0,229,192,.3)", background:"rgba(0,229,192,.07)",
              color:QN.teal, transition:"all .15s",
              opacity:busy ? .5 : 1 }}>
            {t.icon} {t.label}
          </button>
        ))}
        {!hasInitial && (
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:QN.txt4, fontStyle:"italic" }}>
            Appears after initial MDM is generated
          </span>
        )}
      </div>

      {/* Loading */}
      {busy && (
        <div style={{ padding:"10px 14px", borderRadius:8, background:"rgba(0,229,192,.06)",
          border:"1px solid rgba(0,229,192,.2)",
          fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:QN.teal, marginBottom:8 }}>
          ⟳ Drafting addendum from current results...
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding:"8px 12px", borderRadius:7, background:"rgba(255,107,107,.08)",
          border:"1px solid rgba(255,107,107,.3)",
          fontFamily:"'DM Sans',sans-serif", fontSize:11, color:QN.coral, marginBottom:8 }}>
          {error}
        </div>
      )}

      {/* Timeline entries */}
      {entries.length === 0 && (
        <div style={{ padding:"10px 14px", borderRadius:8, background:"rgba(14,37,68,.35)",
          border:"1px dashed rgba(42,79,122,.3)",
          fontFamily:"'DM Sans',sans-serif", fontSize:11, color:QN.txt4, textAlign:"center" }}>
          Timeline builds as MDM progresses through the visit
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
        {entries.map((entry, idx) => {
          const isInit = entry.type === "initial";
          const elapsedStr = !isInit && initTs ? elapsed(initTs, entry.ts) : "";
          const isLast = idx === entries.length - 1;

          return (
            <div key={entry.id} style={{ display:"flex", gap:0 }}>
              {/* Spine */}
              <div style={{ width:20, display:"flex", flexDirection:"column", alignItems:"center",
                flexShrink:0, paddingTop:4 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", flexShrink:0,
                  background:isInit ? QN.blue : QN.teal,
                  border:"2px solid rgba(8,22,44,.9)",
                  boxShadow:"0 0 0 2px "+(isInit?"rgba(59,158,255,.3)":"rgba(0,229,192,.3)") }} />
                {!isLast && (
                  <div style={{ width:1, flex:1, background:"rgba(42,79,122,.35)",
                    marginTop:3, marginBottom:0 }} />
                )}
              </div>

              {/* Card */}
              <div style={{ flex:1, marginLeft:8, marginBottom:isLast ? 0 : 12,
                padding:"10px 12px", borderRadius:9,
                background:isInit ? "rgba(59,158,255,.07)" : "rgba(0,229,192,.06)",
                border:"1px solid "+(isInit ? "rgba(59,158,255,.2)" : "rgba(0,229,192,.2)") }}>
                {/* Card header */}
                <div style={{ display:"flex", alignItems:"center", gap:8,
                  marginBottom:6, flexWrap:"wrap" }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                    color:isInit ? QN.blue : QN.teal,
                    letterSpacing:.5, textTransform:"uppercase" }}>
                    {isInit ? "Initial Assessment" : "Addendum"}
                  </span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:QN.txt4 }}>
                    {timeLabel(entry.ts)}
                    {elapsedStr && <span style={{ color:"rgba(0,229,192,.5)", marginLeft:5 }}>+{elapsedStr}</span>}
                  </span>
                  {!isInit && (
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:QN.txt3,
                      background:"rgba(42,79,122,.2)", borderRadius:4, padding:"1px 6px" }}>
                      {entry.label}
                    </span>
                  )}
                  <button
                    onClick={() => copyText(entry.text, entry.id)}
                    style={{ marginLeft:"auto", padding:"2px 9px", borderRadius:5, cursor:"pointer",
                      fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                      border:"1px solid "+(copiedId===entry.id ? "rgba(61,255,160,.4)" : "rgba(42,79,122,.35)"),
                      background:copiedId===entry.id ? "rgba(61,255,160,.08)" : "transparent",
                      color:copiedId===entry.id ? QN.green : QN.txt4, transition:"all .15s" }}>
                    {copiedId===entry.id ? "✓ copied" : "📋"}
                  </button>
                </div>

                {/* Card body */}
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:QN.txt2,
                  lineHeight:1.65, whiteSpace:"pre-wrap", maxHeight:200, overflowY:"auto",
                  scrollbarWidth:"thin" }}>
                  {entry.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── PATIENT RESPONSE PANEL ────────────────────────────────────────────────────
export function PatientResponsePanel({
  patientResponse, setPatientResponse,
  cc, hpi, working_diagnosis, mdmResult, mdmTimestamp,
  labs, imaging, ekg, newVitals, consults,
  onAddendumReady,
}) {
  return (
    <div>
      {/* Treatment Response field */}
      <div style={{ marginBottom:10 }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
          color:QN.txt4, letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>
          Patient Response to Treatment
        </div>
        <textarea
          rows={3}
          value={patientResponse}
          onChange={e => setPatientResponse(e.target.value)}
          placeholder="e.g. Pain improved 8/10→3/10 with morphine 4mg IV. HR 112→88 bpm after fluids 1L. BP 88/50→106/72 with norepinephrine. Patient more alert and cooperative..."
          style={{ width:"100%", boxSizing:"border-box", resize:"vertical",
            padding:"9px 12px", borderRadius:8,
            background:"rgba(14,37,68,.5)", border:"1px solid rgba(42,79,122,.4)",
            color:QN.txt, fontFamily:"'DM Sans',sans-serif",
            fontSize:13, lineHeight:1.55, outline:"none", transition:"border-color .15s" }}
          onFocus={e => e.target.style.borderColor = "rgba(0,229,192,.5)"}
          onBlur={e => e.target.style.borderColor = "rgba(42,79,122,.4)"}
        />
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7, color:QN.txt4,
          marginTop:3, letterSpacing:.3 }}>
          Documented response populates AI addendum drafts · connects results to evolving MDM
        </div>
      </div>

      {/* Longitudinal thread */}
      <MDMThread
        cc={cc} hpi={hpi} working_diagnosis={working_diagnosis}
        mdmResult={mdmResult} mdmTimestamp={mdmTimestamp}
        labs={labs} imaging={imaging} ekg={ekg}
        newVitals={newVitals} patientResponse={patientResponse}
        consults={consults}
        onAddendumReady={onAddendumReady}
      />
    </div>
  );
}