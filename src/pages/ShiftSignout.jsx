import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const PREFIX = "sso";

(() => {
  const id = `${PREFIX}-fonts`;
  if (document.getElementById(id)) return;
  const l = document.createElement("link");
  l.id = id; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = `${PREFIX}-css`;
  s.textContent = `
    * { box-sizing:border-box; margin:0; padding:0; }
    ::-webkit-scrollbar { width:3px; } ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:rgba(42,79,122,.5); border-radius:2px; }
    @keyframes ${PREFIX}fade  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes ${PREFIX}shim  { 0%,100%{background-position:-200% center} 50%{background-position:200% center} }
    @keyframes ${PREFIX}pulse { 0%,100%{opacity:1} 50%{opacity:.25} }
    @keyframes ${PREFIX}orb0  { 0%,100%{transform:translate(-50%,-50%) scale(1)}    50%{transform:translate(-50%,-50%) scale(1.1)}  }
    @keyframes ${PREFIX}orb1  { 0%,100%{transform:translate(-50%,-50%) scale(1.07)} 50%{transform:translate(-50%,-50%) scale(.92)}  }
    @keyframes ${PREFIX}think { 0%{opacity:.3;transform:scale(.9)} 50%{opacity:1;transform:scale(1)} 100%{opacity:.3;transform:scale(.9)} }
    .${PREFIX}-fade  { animation:${PREFIX}fade  .22s ease both; }
    .${PREFIX}-pulse { animation:${PREFIX}pulse 1.8s ease-in-out infinite; }
    .${PREFIX}-think { animation:${PREFIX}think 1.2s ease-in-out infinite; }
    .${PREFIX}-shim  {
      background:linear-gradient(90deg,#f2f7ff 0%,#00e5c0 35%,#3b9eff 65%,#9b6dff 85%,#f2f7ff 100%);
      background-size:250% auto; -webkit-background-clip:text;
      -webkit-text-fill-color:transparent; background-clip:text;
      animation:${PREFIX}shim 5s linear infinite;
    }
    .${PREFIX}-card:hover { background:rgba(14,37,68,0.85) !important; }
    .${PREFIX}-row:hover  { background:rgba(14,37,68,0.7) !important; }
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", red:"#ff4444", green:"#3dffa0",
  blue:"#3b9eff", purple:"#9b6dff", orange:"#ff9f43", coral:"#ff6b6b",
};

const glass = {
  backdropFilter:"blur(20px) saturate(180%)", WebkitBackdropFilter:"blur(20px) saturate(180%)",
  background:"rgba(8,22,40,0.78)", border:"1px solid rgba(42,79,122,0.35)", borderRadius:14,
};

// ── I-PASS SECTIONS ───────────────────────────────────────────────────
const IPASS_SECTIONS = [
  { key:"illness_severity", label:"I — Illness Severity", color:T.red,    placeholder:"Critical / Unstable / Stable / Good" },
  { key:"patient_summary",  label:"P — Patient Summary",  color:T.blue,   placeholder:"Brief clinical summary: diagnosis, relevant PMH, active issues…" },
  { key:"action_list",      label:"A — Action List",       color:T.gold,   placeholder:"Pending tasks, expected results, decisions needed (numbered list)…" },
  { key:"situation",        label:"S — Situation Awareness",color:T.purple,"placeholder":"If X happens, do Y. Contingency plans and anticipated events…" },
  { key:"synthesis",        label:"S — Synthesis by Receiver",color:T.teal,placeholder:"One sentence summary for incoming provider…" },
];

const SEVERITY_OPTIONS = ["Critical", "Unstable", "Watcher", "Stable", "Good"];
const SEVERITY_COLORS  = { Critical:T.red, Unstable:T.orange, Watcher:T.gold, Stable:T.teal, Good:T.green };

// ── HELPERS ───────────────────────────────────────────────────────────
function calcAge(dob) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

function nowISO() { return new Date().toISOString(); }

function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
}

// ── PRIMITIVES ────────────────────────────────────────────────────────
function AmbientBg() {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
      {[
        { l:"10%", t:"18%", r:300, c:"rgba(59,158,255,0.04)",   a:0 },
        { l:"88%", t:"12%", r:260, c:"rgba(0,229,192,0.04)",    a:1 },
        { l:"72%", t:"80%", r:320, c:"rgba(155,109,255,0.035)", a:0 },
      ].map((o, i) => (
        <div key={i} style={{
          position:"absolute", left:o.l, top:o.t,
          width:o.r*2, height:o.r*2, borderRadius:"50%",
          background:`radial-gradient(circle,${o.c} 0%,transparent 68%)`,
          transform:"translate(-50%,-50%)",
          animation:`${PREFIX}orb${o.a} ${8+i*1.4}s ease-in-out infinite`,
        }}/>
      ))}
    </div>
  );
}

function Toast({ msg, err }) {
  return (
    <div style={{
      position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
      background:"rgba(8,22,40,0.96)", borderRadius:10, padding:"10px 20px",
      border:`1px solid ${err ? T.red+"55" : T.teal+"45"}`,
      fontFamily:"DM Sans", fontWeight:600, fontSize:13,
      color:err ? T.coral : T.teal, zIndex:99999, pointerEvents:"none",
      animation:`${PREFIX}fade .2s ease both`,
    }}>{msg}</div>
  );
}

function ThinkDots() {
  return (
    <div style={{ display:"flex", gap:4 }}>
      {[0,1,2].map(i => (
        <div key={i} className={`${PREFIX}-think`}
          style={{ width:5, height:5, borderRadius:"50%", background:T.purple, animationDelay:`${i*.2}s` }}/>
      ))}
    </div>
  );
}

function SectionLabel({ children, color }) {
  return (
    <div style={{
      fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
      color: color || T.txt4, letterSpacing:2, textTransform:"uppercase", marginBottom:8,
    }}>{children}</div>
  );
}

function Badge({ children, color }) {
  return (
    <span style={{
      fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700,
      padding:"2px 7px", borderRadius:20,
      background:`${color}18`, border:`1px solid ${color}35`, color,
    }}>{children}</span>
  );
}

// ── PATIENT SIGNOUT CARD ──────────────────────────────────────────────
function PatientSignoutCard({ patient, signout, onChange, onAIGenerate, generating }) {
  const age = calcAge(patient.date_of_birth);
  const sev = signout.severity || "Stable";
  const sevColor = SEVERITY_COLORS[sev] || T.teal;

  const taStyle = (focus) => ({
    background:"rgba(14,37,68,0.8)",
    border:`1px solid ${focus ? T.blue+"55" : "rgba(42,79,122,0.35)"}`,
    borderRadius:8, padding:"8px 10px",
    fontFamily:"DM Sans", fontSize:12, color:T.txt,
    outline:"none", width:"100%", resize:"vertical", lineHeight:1.6, minHeight:52,
  });

  return (
    <div className={`${PREFIX}-card ${PREFIX}-fade`} style={{
      ...glass, padding:"14px 16px", marginBottom:10,
      borderLeft:`4px solid ${sevColor}`,
      background: sev === "Critical" ? `${T.red}07` : sev === "Unstable" ? `${T.orange}06` : "rgba(8,22,40,0.78)",
      transition:"background .15s",
    }}>
      {/* Patient header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:12, flexWrap:"wrap" }}>
        <div>
          <div style={{ fontFamily:"Playfair Display", fontWeight:900, fontSize:16, color:T.txt, marginBottom:2 }}>
            {patient.patient_name}
          </div>
          <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4 }}>
            {patient.patient_id && `MRN ${patient.patient_id} · `}
            {age && `${age}y `}{patient.gender ? patient.gender[0].toUpperCase() : ""}
            {patient.chronic_conditions?.[0] && ` · ${patient.chronic_conditions[0]}`}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
          {/* Severity selector */}
          <div style={{ display:"flex", gap:4 }}>
            {SEVERITY_OPTIONS.map(opt => (
              <button key={opt} onClick={() => onChange("severity", opt)} style={{
                fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
                padding:"3px 8px", borderRadius:20, cursor:"pointer",
                border:`1px solid ${signout.severity === opt ? SEVERITY_COLORS[opt]+"55" : "rgba(42,79,122,0.3)"}`,
                background: signout.severity === opt ? `${SEVERITY_COLORS[opt]}14` : "transparent",
                color: signout.severity === opt ? SEVERITY_COLORS[opt] : T.txt4,
              }}>{opt}</button>
            ))}
          </div>
          {/* AI generate */}
          <button onClick={onAIGenerate} disabled={generating} style={{
            fontFamily:"DM Sans", fontWeight:700, fontSize:10,
            padding:"5px 12px", borderRadius:8, cursor:generating ? "not-allowed" : "pointer",
            border:`1px solid ${T.purple}40`, background:`${T.purple}0e`, color:T.purple,
            opacity:generating ? .6 : 1, display:"flex", alignItems:"center", gap:5,
          }}>
            {generating ? <><ThinkDots/> Drafting…</> : "🤖 AI Draft"}
          </button>
        </div>
      </div>

      {/* Allergies */}
      {patient.allergies?.length > 0 && (
        <div style={{ marginBottom:10, display:"flex", gap:5, flexWrap:"wrap" }}>
          {patient.allergies.map((a, i) => (
            <span key={i} style={{
              fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700,
              padding:"1px 7px", borderRadius:20,
              background:`${T.red}0f`, border:`1px solid ${T.red}28`, color:T.coral,
            }}>⚠️ {a}</span>
          ))}
        </div>
      )}

      {/* I-PASS fields */}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {IPASS_SECTIONS.map(sec => (
          <div key={sec.key} style={{
            padding:"9px 11px", borderRadius:9,
            borderLeft:`3px solid ${sec.color}`, background:`${sec.color}07`,
          }}>
            <div style={{
              fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700,
              color:sec.color, letterSpacing:1.5, textTransform:"uppercase", marginBottom:5,
            }}>{sec.label}</div>
            {sec.key === "illness_severity" ? (
              <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:14, color:sevColor }}>
                {sev}
              </div>
            ) : (
              <textarea
                value={signout[sec.key] || ""}
                onChange={e => onChange(sec.key, e.target.value)}
                placeholder={sec.placeholder}
                rows={2}
                style={taStyle(false)}
                onFocus={e => e.target.style.borderColor = T.blue+"55"}
                onBlur={e => e.target.style.borderColor  = "rgba(42,79,122,0.35)"}
              />
            )}
          </div>
        ))}
      </div>

      {/* Notes / flags */}
      <div style={{ marginTop:10 }}>
        <div style={{
          fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700,
          color:T.gold, letterSpacing:1.5, textTransform:"uppercase", marginBottom:5,
        }}>⚑ Special Flags / Pending Items</div>
        <textarea
          value={signout.flags || ""}
          onChange={e => onChange("flags", e.target.value)}
          placeholder="Pending labs, imaging, consults, callbacks, family discussions, code status…"
          rows={2}
          style={{
            background:"rgba(14,37,68,0.8)", border:`1px solid rgba(42,79,122,0.35)`,
            borderRadius:8, padding:"8px 10px",
            fontFamily:"DM Sans", fontSize:12, color:T.txt,
            outline:"none", width:"100%", resize:"vertical", lineHeight:1.6,
          }}
          onFocus={e => e.target.style.borderColor = T.gold+"55"}
          onBlur={e => e.target.style.borderColor  = "rgba(42,79,122,0.35)"}
        />
      </div>

      {/* Timestamp */}
      {signout.updated_at && (
        <div style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4, marginTop:8 }}>
          Last updated {fmtTime(signout.updated_at)}
        </div>
      )}
    </div>
  );
}

// ── SUMMARY PANEL ─────────────────────────────────────────────────────
function SummaryPanel({ patients, signouts }) {
  const criticalPts  = patients.filter(p => (signouts[p.id]?.severity || "Stable") === "Critical");
  const unstablePts  = patients.filter(p => (signouts[p.id]?.severity || "Stable") === "Unstable");
  const watcherPts   = patients.filter(p => (signouts[p.id]?.severity || "Stable") === "Watcher");
  const stablePts    = patients.filter(p => ["Stable","Good"].includes(signouts[p.id]?.severity || "Stable"));
  const completedCt  = patients.filter(p => {
    const s = signouts[p.id] || {};
    return s.patient_summary && s.action_list && s.situation;
  }).length;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {/* Progress */}
      <div style={{ ...glass, padding:"12px 14px" }}>
        <SectionLabel color={T.teal}>Signout Progress</SectionLabel>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
          <div style={{ flex:1, height:6, borderRadius:3, background:"rgba(42,79,122,0.3)", overflow:"hidden" }}>
            <div style={{
              height:"100%", borderRadius:3,
              background: completedCt === patients.length ? T.teal : T.blue,
              width:`${patients.length ? (completedCt/patients.length)*100 : 0}%`,
              transition:"width .4s ease",
            }}/>
          </div>
          <span style={{ fontFamily:"JetBrains Mono", fontWeight:700, fontSize:12, color:T.teal, flexShrink:0 }}>
            {completedCt}/{patients.length}
          </span>
        </div>
        <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4 }}>
          {completedCt === patients.length && patients.length > 0
            ? "✅ All patients documented"
            : `${patients.length - completedCt} patient${patients.length - completedCt !== 1 ? "s" : ""} need documentation`}
        </div>
      </div>

      {/* By severity */}
      <div style={{ ...glass, padding:"12px 14px" }}>
        <SectionLabel color={T.txt4}>By Severity</SectionLabel>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {[
            { label:"Critical",  pts:criticalPts,  color:T.red    },
            { label:"Unstable",  pts:unstablePts,  color:T.orange },
            { label:"Watcher",   pts:watcherPts,   color:T.gold   },
            { label:"Stable/Good",pts:stablePts,   color:T.green  },
          ].map(({ label, pts, color }) => (
            <div key={label} style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{
                width:8, height:8, borderRadius:"50%", background:color, flexShrink:0,
              }}/>
              <span style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt2, flex:1 }}>{label}</span>
              <span style={{ fontFamily:"JetBrains Mono", fontWeight:700, fontSize:13, color }}>
                {pts.length}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Critical & Unstable detail */}
      {(criticalPts.length > 0 || unstablePts.length > 0) && (
        <div style={{ ...glass, padding:"12px 14px", borderLeft:`3px solid ${T.red}`, background:`${T.red}07` }}>
          <SectionLabel color={T.red}>High Acuity Patients</SectionLabel>
          <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
            {[...criticalPts, ...unstablePts].map(p => {
              const s   = signouts[p.id] || {};
              const sev = s.severity || "Stable";
              const col = SEVERITY_COLORS[sev] || T.teal;
              return (
                <div key={p.id} style={{ padding:"7px 9px", borderRadius:8, background:"rgba(14,37,68,0.5)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3 }}>
                    <Badge color={col}>{sev.toUpperCase()}</Badge>
                    <span style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:12, color:T.txt }}>
                      {p.patient_name}
                    </span>
                  </div>
                  {s.patient_summary && (
                    <div style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt3, lineHeight:1.5 }}>
                      {s.patient_summary.slice(0, 120)}{s.patient_summary.length > 120 ? "…" : ""}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick print hint */}
      <div style={{ ...glass, padding:"10px 12px", background:"rgba(8,22,40,0.5)" }}>
        <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4, textAlign:"center" }}>
          💡 Use <kbd style={{
            fontFamily:"JetBrains Mono", fontSize:9,
            background:"rgba(42,79,122,0.3)", borderRadius:4, padding:"1px 5px",
            border:"1px solid rgba(42,79,122,0.5)", color:T.txt3,
          }}>⌘P</kbd> to print / PDF your signout
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════
export default function ShiftSignout() {
  const navigate  = useNavigate();
  const [patients,    setPatients]    = useState([]);
  const [signouts,    setSignouts]    = useState({});   // { patientId: { severity, patient_summary, … } }
  const [loading,     setLoading]     = useState(true);
  const [generating,  setGenerating]  = useState({});   // { patientId: bool }
  const [search,      setSearch]      = useState("");
  const [filterSev,   setFilterSev]   = useState("All");
  const [saved,       setSaved]       = useState({});
  const [toast,       setToast]       = useState({ msg:"", err:false });

  function showToast(msg, err = false) {
    setToast({ msg, err });
    setTimeout(() => setToast({ msg:"", err:false }), 2400);
  }

  // ── Fetch patients ────────────────────────────────────────────────
  const fetchPatients = useCallback(async () => {
    try {
      const pts = await base44.entities.Patient.list("-created_date", 100);
      setPatients(pts || []);

      // Initialize signout entries for any new patients
      setSignouts(prev => {
        const next = { ...prev };
        (pts || []).forEach(p => {
          if (!next[p.id]) {
            next[p.id] = {
              severity: "Stable",
              patient_summary: "",
              action_list: "",
              situation: "",
              synthesis: "",
              flags: "",
              updated_at: null,
            };
          }
        });
        return next;
      });
    } catch {
      showToast("Error loading patients", true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  // ── Handle field change ───────────────────────────────────────────
  const handleChange = useCallback((patientId, field, value) => {
    setSignouts(prev => ({
      ...prev,
      [patientId]: {
        ...prev[patientId],
        [field]: value,
        updated_at: nowISO(),
      },
    }));
    // Mark as unsaved
    setSaved(prev => ({ ...prev, [patientId]: false }));
  }, []);

  // ── AI Draft ─────────────────────────────────────────────────────
  const handleAIDraft = useCallback(async (patient) => {
    setGenerating(prev => ({ ...prev, [patient.id]: true }));
    try {
      const age = calcAge(patient.date_of_birth);
      const context = [
        `Patient: ${patient.patient_name}, ${age}y ${patient.gender || ""}`,
        patient.patient_id ? `MRN: ${patient.patient_id}` : "",
        patient.allergies?.length ? `Allergies: ${patient.allergies.join(", ")}` : "NKDA",
        patient.chronic_conditions?.length ? `PMH: ${patient.chronic_conditions.join(", ")}` : "",
      ].filter(Boolean).join("\n");

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an emergency medicine physician handing off patients at end of shift.
        
Generate a complete I-PASS signout for this patient. Be clinical, specific, and concise.

${context}

Return ONLY valid JSON:
{
  "severity": "Critical|Unstable|Watcher|Stable|Good",
  "patient_summary": "2-3 sentence clinical summary with diagnosis, key findings, and active issues",
  "action_list": "Numbered list of pending tasks, expected results, and decisions needed",
  "situation": "If X happens, do Y — specific contingency plans and anticipated overnight events",
  "synthesis": "One sentence summary for the incoming provider",
  "flags": "Any special flags: pending labs/imaging, family discussions, code status, callbacks"
}`,
        add_context_from_previous_calls: false,
      });

      const text = typeof res === "string" ? res : res?.content || "{}";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());

      setSignouts(prev => ({
        ...prev,
        [patient.id]: {
          ...prev[patient.id],
          ...parsed,
          updated_at: nowISO(),
        },
      }));
      setSaved(prev => ({ ...prev, [patient.id]: false }));
      showToast(`Signout drafted for ${patient.patient_name}`);
    } catch {
      showToast("AI draft failed", true);
    } finally {
      setGenerating(prev => ({ ...prev, [patient.id]: false }));
    }
  }, []);

  // ── Save to local storage ─────────────────────────────────────────
  const handleSaveAll = useCallback(() => {
    try {
      localStorage.setItem("notrya_signouts", JSON.stringify(signouts));
      const newSaved = {};
      patients.forEach(p => { newSaved[p.id] = true; });
      setSaved(newSaved);
      showToast("All signouts saved locally");
    } catch {
      showToast("Save failed", true);
    }
  }, [signouts, patients]);

  // ── Load from local storage on mount ─────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem("notrya_signouts");
      if (stored) {
        const parsed = JSON.parse(stored);
        setSignouts(prev => {
          const merged = { ...prev };
          Object.entries(parsed).forEach(([id, data]) => {
            if (merged[id]) merged[id] = { ...merged[id], ...data };
          });
          return merged;
        });
      }
    } catch {}
  }, []);

  // ── Copy full signout text ────────────────────────────────────────
  const handleCopyAll = useCallback(() => {
    const lines = [];
    patients.forEach(p => {
      const s = signouts[p.id] || {};
      const age = calcAge(p.date_of_birth);
      lines.push(`═══ ${p.patient_name} (${age}y ${p.gender?.[0]?.toUpperCase() || ""}) ${p.patient_id ? `MRN:${p.patient_id}` : ""} ═══`);
      lines.push(`SEVERITY: ${s.severity || "Stable"}`);
      if (p.allergies?.length) lines.push(`ALLERGIES: ${p.allergies.join(", ")}`);
      if (s.patient_summary) lines.push(`\nPATIENT SUMMARY:\n${s.patient_summary}`);
      if (s.action_list)     lines.push(`\nACTION LIST:\n${s.action_list}`);
      if (s.situation)       lines.push(`\nSITUATION AWARENESS:\n${s.situation}`);
      if (s.synthesis)       lines.push(`\nSYNTHESIS:\n${s.synthesis}`);
      if (s.flags)           lines.push(`\nFLAGS:\n${s.flags}`);
      lines.push("");
    });
    navigator.clipboard?.writeText(lines.join("\n"));
    showToast("Signout copied to clipboard");
  }, [patients, signouts]);

  // ── Filtered patients ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return patients.filter(p => {
      const matchSearch = !q ||
        p.patient_name?.toLowerCase().includes(q) ||
        p.patient_id?.toLowerCase().includes(q) ||
        p.chronic_conditions?.some(c => c.toLowerCase().includes(q));
      const matchSev = filterSev === "All" ||
        (signouts[p.id]?.severity || "Stable") === filterSev;
      return matchSearch && matchSev;
    });
  }, [patients, search, filterSev, signouts]);

  const completedCount = useMemo(() =>
    patients.filter(p => {
      const s = signouts[p.id] || {};
      return s.patient_summary && s.action_list && s.situation;
    }).length,
  [patients, signouts]);

  return (
    <div style={{
      background:T.bg, minHeight:"100vh", color:T.txt,
      fontFamily:"DM Sans, sans-serif", overflowX:"hidden", position:"relative",
    }}>
      <AmbientBg/>
      {toast.msg && <Toast msg={toast.msg} err={toast.err}/>}

      <div style={{ position:"relative", zIndex:1, padding:"0 16px 40px" }}>

        {/* ── HEADER ───────────────────────────────────────────── */}
        <div style={{
          ...glass, padding:"12px 16px", margin:"14px 0 14px",
          borderRadius:12, display:"flex", alignItems:"center",
          justifyContent:"space-between", flexWrap:"wrap", gap:10,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button onClick={() => navigate("/command-center")} style={{
              fontFamily:"DM Sans", fontWeight:600, fontSize:11,
              padding:"4px 10px", borderRadius:7, cursor:"pointer",
              border:"1px solid rgba(42,79,122,0.45)", background:"rgba(14,37,68,0.5)", color:T.txt4,
            }}>← Cmd</button>
            <div>
              <div className={`${PREFIX}-shim`} style={{
                fontFamily:"Playfair Display", fontWeight:900,
                fontSize:"clamp(18px,2.5vw,26px)", letterSpacing:-.5, lineHeight:1,
              }}>Shift Signout</div>
              <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4, marginTop:2 }}>
                I-PASS Handoff · {new Date().toLocaleDateString([], { weekday:"long", month:"short", day:"numeric" })}
              </div>
            </div>
          </div>

          {/* Progress indicator */}
          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            <div style={{
              fontFamily:"JetBrains Mono", fontWeight:700, fontSize:13,
              color:completedCount === patients.length && patients.length > 0 ? T.teal : T.gold,
            }}>{completedCount}/{patients.length} Complete</div>

            <button onClick={handleCopyAll} style={{
              fontFamily:"DM Sans", fontWeight:700, fontSize:11,
              padding:"6px 14px", borderRadius:8, cursor:"pointer",
              border:`1px solid ${T.blue}40`, background:`${T.blue}0e`, color:T.blue,
            }}>📋 Copy All</button>

            <button onClick={handleSaveAll} style={{
              fontFamily:"DM Sans", fontWeight:700, fontSize:11,
              padding:"6px 14px", borderRadius:8, cursor:"pointer",
              border:`1px solid ${T.teal}40`, background:`${T.teal}0e`, color:T.teal,
            }}>💾 Save</button>

            <button onClick={() => navigate("/NewPatientInput")} style={{
              fontFamily:"DM Sans", fontWeight:700, fontSize:11,
              padding:"6px 14px", borderRadius:8, cursor:"pointer",
              border:`1px solid ${T.purple}40`, background:`${T.purple}0e`, color:T.purple,
            }}>+ New Patient</button>
          </div>
        </div>

        {/* ── TWO-COLUMN LAYOUT ─────────────────────────────────── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:14, alignItems:"start" }}>

          {/* LEFT: Patient signout list */}
          <div>
            {/* Search + filter bar */}
            <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search patients…"
                style={{
                  flex:1, minWidth:200,
                  background:"rgba(14,37,68,0.8)",
                  border:`1px solid ${search ? T.blue+"55" : "rgba(42,79,122,0.4)"}`,
                  borderRadius:9, padding:"8px 12px",
                  fontFamily:"DM Sans", fontSize:12, color:T.txt, outline:"none",
                }}
              />
              <div style={{ display:"flex", gap:5 }}>
                {["All", ...SEVERITY_OPTIONS].map(opt => (
                  <button key={opt} onClick={() => setFilterSev(opt)} style={{
                    fontFamily:"DM Sans", fontWeight:600, fontSize:11,
                    padding:"6px 12px", borderRadius:8, cursor:"pointer",
                    border:`1px solid ${filterSev===opt ? (SEVERITY_COLORS[opt]||T.teal)+"55" : "rgba(42,79,122,0.35)"}`,
                    background: filterSev===opt ? `${SEVERITY_COLORS[opt]||T.teal}12` : "transparent",
                    color: filterSev===opt ? (SEVERITY_COLORS[opt]||T.teal) : T.txt4,
                  }}>{opt}</button>
                ))}
              </div>
            </div>

            {/* Loading skeletons */}
            {loading && (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} style={{
                    ...glass, height:220, borderRadius:14,
                    animation:`${PREFIX}pulse 1.6s ease-in-out ${i*.1}s infinite`,
                  }}/>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
              <div style={{
                ...glass, padding:"40px", textAlign:"center",
                display:"flex", flexDirection:"column", alignItems:"center", gap:10,
              }}>
                <span style={{ fontSize:36 }}>🩺</span>
                <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:15, color:T.txt2 }}>
                  {patients.length === 0 ? "No patients yet" : "No patients match filters"}
                </div>
                {patients.length === 0 && (
                  <button onClick={() => navigate("/NewPatientInput")} style={{
                    fontFamily:"DM Sans", fontWeight:700, fontSize:12,
                    padding:"9px 20px", borderRadius:9, cursor:"pointer",
                    border:`1px solid ${T.teal}40`, background:`${T.teal}0e`, color:T.teal, marginTop:6,
                  }}>+ Add Patient</button>
                )}
              </div>
            )}

            {/* Patient cards */}
            {!loading && filtered.map(patient => (
              <PatientSignoutCard
                key={patient.id}
                patient={patient}
                signout={signouts[patient.id] || {}}
                onChange={(field, value) => handleChange(patient.id, field, value)}
                onAIGenerate={() => handleAIDraft(patient)}
                generating={!!generating[patient.id]}
              />
            ))}
          </div>

          {/* RIGHT: Summary panel — sticky */}
          <div style={{ position:"sticky", top:14 }}>
            <SummaryPanel patients={patients} signouts={signouts}/>
          </div>

        </div>
      </div>
    </div>
  );
}