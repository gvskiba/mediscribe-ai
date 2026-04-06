import { useState, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";

const PREFIX = "ddx";

(() => {
  if (document.getElementById(`${PREFIX}-css`)) return;
  const s = document.createElement("style"); s.id = `${PREFIX}-css`;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
    @keyframes ${PREFIX}fade { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes ${PREFIX}shim { 0%,100%{background-position:-200% center} 50%{background-position:200% center} }
    @keyframes ${PREFIX}spin { to{transform:rotate(360deg)} }
    @keyframes ${PREFIX}orb0 { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-50%) scale(1.12)} }
    @keyframes ${PREFIX}orb1 { 0%,100%{transform:translate(-50%,-50%) scale(1.08)} 50%{transform:translate(-50%,-50%) scale(0.9)} }
    @keyframes ${PREFIX}orb2 { 0%,100%{transform:translate(-50%,-50%) scale(0.94)} 50%{transform:translate(-50%,-50%) scale(1.1)} }
    @keyframes ${PREFIX}pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
    @keyframes ${PREFIX}bar { from{width:0%} to{width:100%} }
    .${PREFIX}-fade  { animation:${PREFIX}fade .25s ease both; }
    .${PREFIX}-pulse { animation:${PREFIX}pulse 1.8s ease-in-out infinite; }
    .${PREFIX}-spin  { animation:${PREFIX}spin .8s linear infinite; display:inline-block; }
    .${PREFIX}-shim  {
      background:linear-gradient(90deg,#f2f7ff 0%,#fff 20%,#00e5c0 45%,#3b9eff 70%,#f2f7ff 100%);
      background-size:250% auto; -webkit-background-clip:text;
      -webkit-text-fill-color:transparent; background-clip:text;
      animation:${PREFIX}shim 5s linear infinite;
    }
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", red:"#ff4444", coral:"#ff6b6b",
  blue:"#3b9eff", purple:"#9b6dff", orange:"#ff9f43", green:"#3dffa0",
};

const glass = {
  backdropFilter:"blur(20px) saturate(180%)", WebkitBackdropFilter:"blur(20px) saturate(180%)",
  background:"rgba(8,22,40,0.82)", border:"1px solid rgba(42,79,122,0.38)", borderRadius:14,
};

// ── LIKELIHOOD CONFIG ────────────────────────────────────────────────
const LIKELIHOOD = [
  { key:"must_rule_out", label:"Must Rule Out",  color:"#ff4444", icon:"⚡", desc:"Life-threatening — cannot miss" },
  { key:"likely",        label:"Most Likely",    color:"#3b9eff", icon:"🎯", desc:"Highest probability" },
  { key:"consider",      label:"Consider",       color:"#f5c842", icon:"🔍", desc:"Reasonable differential" },
  { key:"less_likely",   label:"Less Likely",    color:"#5a82a8", icon:"📋", desc:"Lower probability, keep in mind" },
];

// ── QUICK TEMPLATES ──────────────────────────────────────────────────
const TEMPLATES = [
  { label:"Chest Pain",        icon:"💔",
    prompt:"55M with sudden onset severe tearing chest pain radiating to the back, diaphoresis, BP 180/100" },
  { label:"Dyspnea",           icon:"🫁",
    prompt:"68F with 3 days progressive shortness of breath, orthopnea, +2 pitting edema bilateral ankles" },
  { label:"Altered Mental Status", icon:"🧠",
    prompt:"72M brought in by EMS with acute confusion, fever 39.2°C, urinary incontinence, no focal deficits" },
  { label:"Abdominal Pain",    icon:"🫃",
    prompt:"28F with 24h severe RLQ pain migrating from periumbilical, nausea, anorexia, rebound tenderness" },
  { label:"Syncope",           icon:"😵",
    prompt:"45M with sudden LOC at rest, no prodrome, rapid recovery, HTN, family history of sudden death" },
  { label:"Headache",          icon:"🤕",
    prompt:"38F with worst headache of life, sudden onset, thunderclap quality, nuchal rigidity" },
  { label:"Sepsis",            icon:"🦠",
    prompt:"82F from nursing home, fever 38.8°C, HR 118, BP 88/52, AMS, cloudy urine, creatinine 2.4" },
  { label:"Pediatric Fever",   icon:"👶",
    prompt:"3yo M with fever 40°C x 2 days, irritable, neck stiffness, petechial rash on trunk" },
];

// ── HELPERS ──────────────────────────────────────────────────────────
function AmbientBg() {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
      {[
        { l:"8%",  t:"18%", r:300, c:"rgba(59,158,255,0.055)"  },
        { l:"88%", t:"10%", r:260, c:"rgba(0,229,192,0.045)"   },
        { l:"80%", t:"78%", r:340, c:"rgba(155,109,255,0.038)" },
        { l:"18%", t:"80%", r:220, c:"rgba(245,200,66,0.038)"  },
      ].map((o, i) => (
        <div key={i} style={{
          position:"absolute", left:o.l, top:o.t,
          width:o.r*2, height:o.r*2, borderRadius:"50%",
          background:`radial-gradient(circle,${o.c} 0%,transparent 68%)`,
          transform:"translate(-50%,-50%)",
          animation:`${PREFIX}orb${i%3} ${8+i*1.4}s ease-in-out infinite`,
        }}/>
      ))}
    </div>
  );
}

function Chip({ label, active, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, letterSpacing:1,
      padding:"4px 10px", borderRadius:20, cursor:"pointer", transition:"all .15s",
      textTransform:"uppercase",
      border:`1px solid ${active ? color+"66" : color+"25"}`,
      background: active ? `${color}16` : `${color}06`,
      color: active ? color : T.txt3,
    }}>{label}</button>
  );
}

function DiagnosisCard({ dx, index, onNote, onBookmark, bookmarked }) {
  const [open, setOpen] = useState(false);
  const cfg = LIKELIHOOD.find(l => l.key === dx.likelihood) || LIKELIHOOD[1];

  const urgencyBar = dx.urgency >= 8
    ? T.red
    : dx.urgency >= 5
    ? T.gold
    : T.green;

  return (
    <div className={`${PREFIX}-fade`} style={{
      ...glass,
      borderLeft:`3px solid ${cfg.color}`,
      overflow:"hidden",
      animationDelay:`${index * 0.06}s`,
      background: dx.likelihood === "must_rule_out"
        ? `linear-gradient(135deg,${T.red}0b,rgba(8,22,40,0.82))`
        : "rgba(8,22,40,0.82)",
    }}>
      {/* Card Header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ padding:"12px 14px", cursor:"pointer", display:"flex", alignItems:"flex-start", gap:10 }}
      >
        {/* Rank badge */}
        <div style={{
          flexShrink:0, width:28, height:28, borderRadius:"50%",
          background:`${cfg.color}18`, border:`1.5px solid ${cfg.color}40`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontFamily:"JetBrains Mono", fontSize:11, fontWeight:700, color:cfg.color,
        }}>{index + 1}</div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap", marginBottom:4 }}>
            <span style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:14, color:T.txt }}>{dx.diagnosis}</span>
            {dx.icd10 && (
              <span style={{
                fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4,
                background:"rgba(14,37,68,0.7)", border:"1px solid rgba(42,79,122,0.35)",
                padding:"1px 6px", borderRadius:4,
              }}>{dx.icd10}</span>
            )}
            <span style={{
              fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700,
              padding:"1px 7px", borderRadius:20,
              background:`${cfg.color}14`, border:`1px solid ${cfg.color}35`,
              color:cfg.color, letterSpacing:.5,
            }}>{cfg.icon} {cfg.label.toUpperCase()}</span>
          </div>
          <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt3, lineHeight:1.5 }}>
            {dx.reasoning}
          </div>
          {/* Urgency bar */}
          {dx.urgency && (
            <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:6 }}>
              <span style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4, width:40 }}>URGENCY</span>
              <div style={{ flex:1, height:4, background:"rgba(42,79,122,0.3)", borderRadius:2, overflow:"hidden" }}>
                <div style={{
                  height:"100%", width:`${dx.urgency * 10}%`,
                  background:urgencyBar, borderRadius:2,
                  transition:"width 0.6s ease",
                }}/>
              </div>
              <span style={{ fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700, color:urgencyBar }}>{dx.urgency}/10</span>
            </div>
          )}
        </div>

        <div style={{ display:"flex", gap:5, flexShrink:0 }}>
          <button
            onClick={e => { e.stopPropagation(); onBookmark(); }}
            style={{
              width:26, height:26, borderRadius:6, cursor:"pointer",
              border:`1px solid ${bookmarked ? T.gold+"44" : "rgba(42,79,122,0.35)"}`,
              background: bookmarked ? `${T.gold}14` : "transparent",
              color: bookmarked ? T.gold : T.txt4, fontSize:12,
              display:"flex", alignItems:"center", justifyContent:"center",
            }}
          >★</button>
          <span style={{ color:T.txt4, fontSize:11, lineHeight:"26px" }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Expanded */}
      {open && (
        <div className={`${PREFIX}-fade`} style={{ borderTop:"1px solid rgba(42,79,122,0.28)", padding:"12px 14px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
            {dx.key_features?.length > 0 && (
              <DetailBlock label="Supporting Features" color={T.teal} items={dx.key_features} />
            )}
            {dx.against?.length > 0 && (
              <DetailBlock label="Against This Dx" color={T.coral} items={dx.against} />
            )}
          </div>
          {dx.workup?.length > 0 && (
            <div style={{ marginBottom:8 }}>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, color:T.blue, letterSpacing:1.5, textTransform:"uppercase", marginBottom:5 }}>
                Recommended Workup
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {dx.workup.map((w, i) => (
                  <span key={i} style={{
                    fontFamily:"DM Sans", fontSize:11, padding:"3px 9px", borderRadius:20,
                    background:`${T.blue}0e`, border:`1px solid ${T.blue}2a`, color:T.txt2,
                  }}>{w}</span>
                ))}
              </div>
            </div>
          )}
          {dx.management && (
            <div style={{
              ...glass, padding:"8px 12px", borderLeft:`3px solid ${T.purple}`,
              background:`${T.purple}06`, borderRadius:10,
            }}>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, color:T.purple, letterSpacing:1.5, textTransform:"uppercase", marginBottom:3 }}>Initial Management</div>
              <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt2, lineHeight:1.55 }}>{dx.management}</div>
            </div>
          )}
          {/* Notes input */}
          <div style={{ marginTop:8 }}>
            <button onClick={() => onNote(dx.diagnosis)} style={{
              fontFamily:"DM Sans", fontSize:10, fontWeight:600,
              padding:"4px 10px", borderRadius:7, cursor:"pointer",
              border:`1px solid ${T.teal}28`, background:`${T.teal}08`, color:T.teal,
            }}>+ Add Note</button>
            {dx.note && (
              <div style={{
                marginTop:6, fontFamily:"DM Sans", fontSize:11,
                color:T.txt3, background:"rgba(14,37,68,0.5)",
                padding:"6px 10px", borderRadius:8, borderLeft:`2px solid ${T.teal}`,
              }}>{dx.note}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailBlock({ label, color, items }) {
  return (
    <div>
      <div style={{ fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, color, letterSpacing:1.5, textTransform:"uppercase", marginBottom:5 }}>{label}</div>
      <ul style={{ margin:0, padding:0, listStyle:"none" }}>
        {items.map((item, i) => (
          <li key={i} style={{ display:"flex", alignItems:"flex-start", gap:5, marginBottom:3 }}>
            <span style={{ color, fontSize:8, marginTop:3, flexShrink:0 }}>●</span>
            <span style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt2, lineHeight:1.45 }}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════
export default function DDxEngine({ onBack }) {
  const [presentation, setPresentation] = useState("");
  const [vitals,        setVitals]       = useState("");
  const [pmh,           setPmh]          = useState("");
  const [labs,          setLabs]         = useState("");
  const [results,       setResults]      = useState(null);
  const [loading,       setLoading]      = useState(false);
  const [activeFilter,  setActiveFilter] = useState("all");
  const [bookmarks,     setBookmarks]    = useState(new Set());
  const [noteModal,     setNoteModal]    = useState(null);
  const [noteText,      setNoteText]     = useState("");
  const [toast,         setToast]        = useState("");
  const textareaRef = useRef(null);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 2200); }

  function toggleBookmark(dx) {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(dx)) next.delete(dx); else next.add(dx);
      return next;
    });
  }

  function handleNote(dxName) {
    setNoteModal(dxName);
    const existing = results?.diagnoses.find(d => d.diagnosis === dxName)?.note || "";
    setNoteText(existing);
  }

  function saveNote() {
    if (!noteModal) return;
    setResults(prev => ({
      ...prev,
      diagnoses: prev.diagnoses.map(d =>
        d.diagnosis === noteModal ? { ...d, note: noteText } : d
      ),
    }));
    setNoteModal(null);
    setNoteText("");
    showToast("Note saved");
  }

  const generate = useCallback(async () => {
    if (!presentation.trim()) return;
    setLoading(true);
    setResults(null);
    try {
      const prompt = `You are an expert emergency medicine attending physician. Generate a comprehensive differential diagnosis.

Clinical Presentation: ${presentation}
${vitals ? `Vital Signs: ${vitals}` : ""}
${pmh ? `Past Medical History / Medications / Allergies: ${pmh}` : ""}
${labs ? `Available Labs / Imaging / ECG: ${labs}` : ""}

Return a JSON object with this EXACT schema:
{
  "summary": "2-sentence clinical synthesis",
  "red_flags": ["list of critical red flags present in this case"],
  "diagnoses": [
    {
      "diagnosis": "Diagnosis name",
      "icd10": "ICD-10 code",
      "likelihood": "must_rule_out" | "likely" | "consider" | "less_likely",
      "urgency": 8,
      "reasoning": "2-3 sentence explanation why this fits",
      "key_features": ["supporting feature 1", "feature 2"],
      "against": ["feature arguing against", "another"],
      "workup": ["Test 1", "Test 2", "Test 3"],
      "management": "Brief initial management steps"
    }
  ],
  "cant_miss": "The single most dangerous diagnosis that must be excluded first and why",
  "next_step": "The single most important next action right now"
}

Rules:
- Include 6–10 diagnoses spanning must_rule_out → less_likely
- Always include at least 1 must_rule_out life-threatening diagnosis
- Urgency 1–10 (10 = immediate life threat)
- Be specific and clinically accurate
- Sort diagnoses: must_rule_out first, then by probability`;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary:    { type: "string" },
            red_flags:  { type: "array", items: { type: "string" } },
            diagnoses:  { type: "array" },
            cant_miss:  { type: "string" },
            next_step:  { type: "string" },
          },
        },
      });
      setResults(typeof res === "string" ? JSON.parse(res) : res);
    } catch (e) {
      showToast("Generation failed — check your inputs and try again");
    } finally {
      setLoading(false);
    }
  }, [presentation, vitals, pmh, labs]);

  const filtered = results?.diagnoses?.filter(d =>
    activeFilter === "all" ||
    (activeFilter === "bookmarked" && bookmarks.has(d.diagnosis)) ||
    d.likelihood === activeFilter
  ) || [];

  const mustRuleOut = results?.diagnoses?.filter(d => d.likelihood === "must_rule_out") || [];

  async function copyReport() {
    if (!results) return;
    const lines = [
      `DIFFERENTIAL DIAGNOSIS REPORT`,
      `Generated: ${new Date().toLocaleString()}`,
      ``,
      `PRESENTATION: ${presentation}`,
      ``,
      `CLINICAL SUMMARY: ${results.summary}`,
      ``,
      `CAN'T MISS: ${results.cant_miss}`,
      `NEXT STEP: ${results.next_step}`,
      ``,
      `RED FLAGS: ${results.red_flags?.join(", ")}`,
      ``,
      `DIFFERENTIAL DIAGNOSES:`,
      ...(results.diagnoses || []).map((d, i) =>
        `${i+1}. [${d.likelihood?.toUpperCase()}] ${d.diagnosis} (ICD: ${d.icd10 || "—"}) — Urgency ${d.urgency}/10\n   ${d.reasoning}`
      ),
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
    showToast("Report copied to clipboard");
  }

  const iField = {
    background:"rgba(14,37,68,0.8)", border:"1px solid rgba(42,79,122,0.4)",
    borderRadius:10, padding:"10px 13px", fontFamily:"DM Sans", fontSize:13,
    color:T.txt, outline:"none", width:"100%", resize:"vertical",
    lineHeight:1.6, transition:"border-color .12s",
  };

  return (
    <div style={{
      fontFamily:"DM Sans, sans-serif", background:T.bg, minHeight:"100vh",
      position:"relative", overflowX:"hidden", color:T.txt,
    }}>
      <AmbientBg/>

      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
          background:"rgba(8,22,40,0.96)", border:"1px solid rgba(0,229,192,0.4)",
          borderRadius:10, padding:"10px 20px", fontFamily:"DM Sans",
          fontWeight:600, fontSize:13, color:T.teal, zIndex:99999,
          pointerEvents:"none", animation:`${PREFIX}fade .2s ease both`,
        }}>{toast}</div>
      )}

      {/* Note Modal */}
      {noteModal && (
        <div
          style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(3,8,18,0.88)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
          onClick={() => setNoteModal(null)}
        >
          <div style={{ ...glass, width:"100%", maxWidth:480 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding:"14px 16px 10px", borderBottom:"1px solid rgba(42,79,122,0.35)" }}>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700, color:T.teal, letterSpacing:2, marginBottom:3 }}>NOTE</div>
              <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:15, color:T.txt }}>{noteModal}</div>
            </div>
            <div style={{ padding:14 }}>
              <textarea
                value={noteText} onChange={e => setNoteText(e.target.value)}
                placeholder="Add clinical notes, bedside observations, or reasoning..."
                rows={4} style={{ ...iField, fontSize:12 }}
              />
              <div style={{ display:"flex", gap:8, marginTop:10 }}>
                <button onClick={saveNote} style={{
                  flex:1, fontFamily:"DM Sans", fontWeight:700, fontSize:13,
                  padding:"10px", borderRadius:9, cursor:"pointer",
                  border:`1px solid ${T.teal}40`, background:`${T.teal}12`, color:T.teal,
                }}>Save Note</button>
                <button onClick={() => setNoteModal(null)} style={{
                  fontFamily:"DM Sans", fontSize:12, padding:"10px 16px", borderRadius:9,
                  cursor:"pointer", border:"1px solid rgba(42,79,122,0.4)",
                  background:"transparent", color:T.txt3,
                }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ position:"relative", zIndex:1, maxWidth:1300, margin:"0 auto", padding:"0 16px" }}>

        {/* Header */}
        <div style={{ padding:"18px 0 14px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:9 }}>
            <div style={{
              backdropFilter:"blur(40px)", WebkitBackdropFilter:"blur(40px)",
              background:"rgba(5,15,30,0.9)", border:"1px solid rgba(42,79,122,0.6)",
              borderRadius:10, padding:"5px 12px", display:"flex", alignItems:"center", gap:8,
            }}>
              <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.gold, letterSpacing:3 }}>NOTRYA</span>
              <span style={{ color:T.txt4, fontFamily:"JetBrains Mono", fontSize:10 }}>/</span>
              <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.txt3, letterSpacing:2 }}>DDx ENGINE</span>
            </div>
            <div style={{ height:1, flex:1, background:"linear-gradient(90deg,rgba(0,229,192,0.5),transparent)" }}/>
            {onBack && (
              <button onClick={onBack} style={{
                fontFamily:"DM Sans", fontSize:11, fontWeight:600, padding:"5px 14px",
                borderRadius:8, cursor:"pointer", border:"1px solid rgba(42,79,122,0.5)",
                background:"rgba(14,37,68,0.6)", color:T.txt3,
              }}>← Hub</button>
            )}
          </div>
          <h1 className={`${PREFIX}-shim`} style={{
            fontFamily:"Playfair Display", fontSize:"clamp(24px,3.5vw,38px)",
            fontWeight:900, letterSpacing:-1, lineHeight:1.1, marginBottom:5,
          }}>
            Differential Diagnosis Engine
          </h1>
          <p style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt3 }}>
            AI-powered DDx generation · Life-threat identification · Evidence-based workup · Clinical reasoning support
          </p>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"380px 1fr", gap:14, alignItems:"start" }}>

          {/* LEFT: Input panel */}
          <div style={{ display:"flex", flexDirection:"column", gap:10, position:"sticky", top:14 }}>
            {/* Quick templates */}
            <div style={{ ...glass, padding:"12px 14px" }}>
              <div style={{
                fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.teal,
                letterSpacing:2, textTransform:"uppercase", marginBottom:8,
              }}>Quick Templates</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:5 }}>
                {TEMPLATES.map(t => (
                  <button key={t.label} onClick={() => setPresentation(t.prompt)} style={{
                    fontFamily:"DM Sans", fontWeight:500, fontSize:11,
                    padding:"6px 8px", borderRadius:8, cursor:"pointer", textAlign:"left",
                    border:`1px solid rgba(42,79,122,0.35)`,
                    background:"rgba(14,37,68,0.5)", color:T.txt3,
                    transition:"all .12s",
                    display:"flex", alignItems:"center", gap:5,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,229,192,0.35)"; e.currentTarget.style.color = T.txt2; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(42,79,122,0.35)"; e.currentTarget.style.color = T.txt3; }}
                  >
                    <span style={{ fontSize:13 }}>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input form */}
            <div style={{ ...glass, padding:"14px" }}>
              <div style={{
                fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.blue,
                letterSpacing:2, textTransform:"uppercase", marginBottom:10,
              }}>Clinical Presentation *</div>
              <textarea
                ref={textareaRef}
                value={presentation}
                onChange={e => setPresentation(e.target.value)}
                placeholder="Age, sex, chief complaint, onset, duration, quality, severity, associated symptoms, relevant context..."
                rows={5}
                style={{
                  ...iField,
                  border:`1px solid ${presentation ? "rgba(59,158,255,0.4)" : "rgba(42,79,122,0.4)"}`,
                  marginBottom:10,
                }}
              />

              <div style={{
                fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.txt4,
                letterSpacing:2, textTransform:"uppercase", marginBottom:4,
              }}>Vital Signs (optional)</div>
              <textarea
                value={vitals}
                onChange={e => setVitals(e.target.value)}
                placeholder="HR, BP, RR, SpO2, Temp, GCS..."
                rows={2}
                style={{ ...iField, fontSize:12, marginBottom:10 }}
              />

              <div style={{
                fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.txt4,
                letterSpacing:2, textTransform:"uppercase", marginBottom:4,
              }}>PMH / Meds / Allergies (optional)</div>
              <textarea
                value={pmh}
                onChange={e => setPmh(e.target.value)}
                placeholder="Past medical history, current medications, allergies..."
                rows={2}
                style={{ ...iField, fontSize:12, marginBottom:10 }}
              />

              <div style={{
                fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.txt4,
                letterSpacing:2, textTransform:"uppercase", marginBottom:4,
              }}>Labs / Imaging / ECG (optional)</div>
              <textarea
                value={labs}
                onChange={e => setLabs(e.target.value)}
                placeholder="Troponin, BNP, CBC, CXR, CT findings, ECG interpretation..."
                rows={2}
                style={{ ...iField, fontSize:12, marginBottom:12 }}
              />

              <button
                onClick={generate}
                disabled={!presentation.trim() || loading}
                style={{
                  width:"100%", fontFamily:"DM Sans", fontWeight:700, fontSize:14,
                  padding:"13px", borderRadius:10, cursor: loading || !presentation.trim() ? "not-allowed" : "pointer",
                  border:`1px solid ${T.teal}40`,
                  background: loading || !presentation.trim() ? "rgba(0,229,192,0.06)" : `linear-gradient(135deg,${T.teal}22,${T.blue}16)`,
                  color: !presentation.trim() ? T.txt4 : T.teal,
                  opacity: !presentation.trim() ? 0.55 : 1,
                  transition:"all .15s",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                }}
              >
                {loading ? (
                  <>
                    <span className={`${PREFIX}-spin`}>⟳</span>
                    Generating DDx...
                  </>
                ) : (
                  <> ✦ Generate Differential </>
                )}
              </button>

              {presentation.trim() && !loading && (
                <button
                  onClick={() => { setPresentation(""); setVitals(""); setPmh(""); setLabs(""); setResults(null); }}
                  style={{
                    width:"100%", marginTop:6, fontFamily:"DM Sans", fontWeight:500, fontSize:11,
                    padding:"7px", borderRadius:8, cursor:"pointer",
                    border:"1px solid rgba(42,79,122,0.3)", background:"transparent", color:T.txt4,
                  }}
                >Clear All</button>
              )}
            </div>
          </div>

          {/* RIGHT: Results panel */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

            {/* Empty state */}
            {!results && !loading && (
              <div style={{
                ...glass, padding:"48px 24px", textAlign:"center",
                display:"flex", flexDirection:"column", alignItems:"center", gap:12,
              }}>
                <div style={{ fontSize:48, lineHeight:1 }}>🧠</div>
                <div style={{ fontFamily:"Playfair Display", fontSize:20, fontWeight:700, color:T.txt }}>
                  DDx Engine Ready
                </div>
                <div style={{ fontFamily:"DM Sans", fontSize:13, color:T.txt3, maxWidth:340, lineHeight:1.6 }}>
                  Enter a clinical presentation or select a template to generate an evidence-based differential diagnosis with life-threat identification, workup, and management guidance.
                </div>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ ...glass, padding:"18px", borderLeft:`3px solid ${T.blue}` }}>
                  <div className={`${PREFIX}-pulse`} style={{ fontFamily:"DM Sans", fontSize:13, color:T.blue }}>
                    ✦ Analyzing clinical presentation and generating differential...
                  </div>
                  <div style={{
                    height:3, background:"rgba(42,79,122,0.2)", borderRadius:2, marginTop:12, overflow:"hidden",
                  }}>
                    <div className={`${PREFIX}-pulse`} style={{
                      height:"100%", width:"60%",
                      background:`linear-gradient(90deg,${T.teal},${T.blue})`,
                      borderRadius:2,
                    }}/>
                  </div>
                </div>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`${PREFIX}-pulse`} style={{
                    ...glass, height:90, borderRadius:14,
                    animationDelay:`${i * 0.15}s`,
                  }}/>
                ))}
              </div>
            )}

            {/* Results */}
            {results && !loading && (
              <>
                {/* Summary card */}
                <div className={`${PREFIX}-fade`} style={{
                  ...glass, padding:"14px 16px",
                  borderTop:`3px solid ${T.teal}`,
                  background:`linear-gradient(135deg,${T.teal}07,rgba(8,22,40,0.82))`,
                }}>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, flexWrap:"wrap" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.teal, letterSpacing:2, textTransform:"uppercase", marginBottom:5 }}>Clinical Synthesis</div>
                      <div style={{ fontFamily:"DM Sans", fontSize:13, color:T.txt2, lineHeight:1.6 }}>{results.summary}</div>
                    </div>
                    <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                      <button onClick={copyReport} style={{
                        fontFamily:"DM Sans", fontSize:11, fontWeight:600,
                        padding:"5px 12px", borderRadius:8, cursor:"pointer",
                        border:`1px solid ${T.teal}30`, background:`${T.teal}0a`, color:T.teal,
                      }}>⎘ Copy Report</button>
                    </div>
                  </div>
                </div>

                {/* Can't Miss + Next Step */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div style={{ ...glass, padding:"12px 14px", borderLeft:`3px solid ${T.red}`, background:`${T.red}08` }}>
                    <div style={{ fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, color:T.red, letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>⚡ Can't Miss</div>
                    <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt2, lineHeight:1.5 }}>{results.cant_miss}</div>
                  </div>
                  <div style={{ ...glass, padding:"12px 14px", borderLeft:`3px solid ${T.gold}`, background:`${T.gold}08` }}>
                    <div style={{ fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, color:T.gold, letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>→ Next Step</div>
                    <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt2, lineHeight:1.5 }}>{results.next_step}</div>
                  </div>
                </div>

                {/* Red flags */}
                {results.red_flags?.length > 0 && (
                  <div style={{ ...glass, padding:"10px 14px", borderLeft:`3px solid ${T.coral}`, background:`${T.coral}07` }}>
                    <div style={{ fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, color:T.coral, letterSpacing:2, textTransform:"uppercase", marginBottom:6 }}>🚨 Red Flags Present</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                      {results.red_flags.map((rf, i) => (
                        <span key={i} style={{
                          fontFamily:"DM Sans", fontSize:11, padding:"2px 9px", borderRadius:20,
                          background:`${T.coral}12`, border:`1px solid ${T.coral}30`, color:T.txt2,
                        }}>{rf}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Filter tabs */}
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  <Chip label={`All (${results.diagnoses?.length})`} active={activeFilter==="all"} color={T.teal} onClick={() => setActiveFilter("all")} />
                  {LIKELIHOOD.map(l => {
                    const cnt = results.diagnoses?.filter(d => d.likelihood === l.key).length || 0;
                    if (!cnt) return null;
                    return <Chip key={l.key} label={`${l.label} (${cnt})`} active={activeFilter===l.key} color={l.color} onClick={() => setActiveFilter(l.key)} />;
                  })}
                  {bookmarks.size > 0 && (
                    <Chip label={`★ Saved (${bookmarks.size})`} active={activeFilter==="bookmarked"} color={T.gold} onClick={() => setActiveFilter("bookmarked")} />
                  )}
                </div>

                {/* Diagnoses list */}
                <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:24 }}>
                  {filtered.length === 0 ? (
                    <div style={{ ...glass, padding:"24px", textAlign:"center", color:T.txt4, fontFamily:"DM Sans", fontSize:13 }}>
                      No diagnoses match this filter
                    </div>
                  ) : filtered.map((dx, i) => (
                    <DiagnosisCard
                      key={dx.diagnosis}
                      dx={dx}
                      index={i}
                      onNote={handleNote}
                      onBookmark={() => toggleBookmark(dx.diagnosis)}
                      bookmarked={bookmarks.has(dx.diagnosis)}
                    />
                  ))}
                </div>

                {/* Disclaimer */}
                <div style={{
                  ...glass, padding:"10px 14px", marginBottom:24,
                  background:`${T.gold}07`, borderLeft:`3px solid ${T.gold}`,
                }}>
                  <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4, lineHeight:1.6 }}>
                    ⚠️ <strong style={{ color:T.gold }}>Clinical Decision Support Only.</strong>{" "}
                    AI-generated differential diagnoses require clinical verification. This tool does not replace physician judgment, physical examination, or direct patient care. Always confirm with clinical pharmacist, specialist, or attending as appropriate.
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}