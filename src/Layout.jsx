import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Patient, ClinicalResult, Order, ClinicalNote, DispositionRecord } from "@/api/entities";
import { InvokeLLM } from "@/integrations/Core";

const PREFIX = "ptw";

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
    @keyframes ${PREFIX}rise  { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
    @keyframes ${PREFIX}think { 0%{opacity:.3;transform:scale(.9)} 50%{opacity:1;transform:scale(1)} 100%{opacity:.3;transform:scale(.9)} }
    @keyframes ${PREFIX}orb0  { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-50%) scale(1.1)} }
    @keyframes ${PREFIX}orb1  { 0%,100%{transform:translate(-50%,-50%) scale(1.07)} 50%{transform:translate(-50%,-50%) scale(.92)} }
    .${PREFIX}-fade  { animation:${PREFIX}fade .22s ease both; }
    .${PREFIX}-pulse { animation:${PREFIX}pulse 1.8s ease-in-out infinite; }
    .${PREFIX}-rise  { animation:${PREFIX}rise .3s cubic-bezier(.2,.8,.3,1) both; }
    .${PREFIX}-think { animation:${PREFIX}think 1.2s ease-in-out infinite; }
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
  background:"rgba(8,22,40,0.82)", border:"1px solid rgba(42,79,122,0.35)", borderRadius:14,
};

const STATUS_CFG = {
  critical:{ color:T.red },  results:{ color:T.blue },
  pending: { color:T.gold }, stable:{ color:T.teal }, waiting:{ color:T.txt4 },
};

const FLAG_CFG = {
  critical:{ color:T.red,    label:"CRIT" },
  abnormal:{ color:T.gold,   label:"ABN"  },
  normal:  { color:T.green,  label:"WNL"  },
};

const CONV_CFG = {
  complete:  { color:T.teal,   label:"COMPLETE",   icon:"✓" },
  converging:{ color:T.green,  label:"CONVERGING", icon:"→" },
  developing:{ color:T.gold,   label:"DEVELOPING", icon:"◎" },
  fragmented:{ color:T.red,    label:"FRAGMENTED", icon:"⚡" },
};

// ── CC → relevant high-risk drugs for renal dosing display ────────────
const CC_DRUGS = {
  "chest pain"       :["Heparin","Enoxaparin","Aspirin","Metoprolol","Morphine"],
  "shortness of breath":["Furosemide","Enoxaparin","Levofloxacin","Vancomycin","Digoxin"],
  "sepsis"           :["Vancomycin","Pip-Tazo","Meropenem","Gentamicin","Levofloxacin"],
  "altered mental"   :["Levetiracetam","Phenytoin","Haloperidol","Lorazepam","Vancomycin"],
  "abdominal pain"   :["Pip-Tazo","Metronidazole","Ketorolac","Morphine","Ceftriaxone"],
  "back pain"        :["Ketorolac","Cyclobenzaprine","Morphine","Gabapentin","Naproxen"],
  "pneumonia"        :["Levofloxacin","Azithromycin","Pip-Tazo","Ceftriaxone","Vancomycin"],
  "uti"              :["Ceftriaxone","TMP-SMX","Levofloxacin","Ampicillin","Nitrofurantoin"],
  "default"          :["Vancomycin","Enoxaparin","Morphine","Ketorolac","Metoprolol"],
};

const DRUG_RENAL_FLAGS = {
  "Vancomycin":    { flag:"caution", note:"Renally cleared — dose per CrCl"      },
  "Enoxaparin":    { flag:"caution", note:"Reduce to q24h if CrCl <30"           },
  "Morphine":      { flag:"avoid",   note:"Active metabolite — use fentanyl <30" },
  "Ketorolac":     { flag:"avoid",   note:"Nephrotoxic NSAID — avoid CrCl <30"   },
  "Pip-Tazo":      { flag:"caution", note:"Reduce dose at eGFR <40"              },
  "Meropenem":     { flag:"caution", note:"Dose adjust at eGFR <50"              },
  "Gentamicin":    { flag:"avoid",   note:"Avoid CrCl <30 — nephrotoxic"        },
  "Levofloxacin":  { flag:"caution", note:"Reduce dose at CrCl <50"             },
  "TMP-SMX":       { flag:"avoid",   note:"Contraindicated CrCl <15"            },
  "Levetiracetam": { flag:"caution", note:"Dose reduce at CrCl <80"             },
  "Digoxin":       { flag:"avoid",   note:"Major toxicity risk in renal failure" },
  "Furosemide":    { flag:"ok",      note:"Higher doses may be needed in CKD"   },
  "Gabapentin":    { flag:"caution", note:"Major reductions required in CKD"    },
  "Metoprolol":    { flag:"ok",      note:"No renal adjustment needed"          },
  "Ceftriaxone":   { flag:"ok",      note:"No dose adjustment needed"           },
  "Azithromycin":  { flag:"ok",      note:"No renal adjustment"                  },
  "Metronidazole": { flag:"ok",      note:"Reduce in severe hepatic disease"    },
  "Aspirin":       { flag:"caution", note:"Use with caution in renal failure"   },
  "Heparin":       { flag:"ok",      note:"Preferred anticoagulant in ESRD"     },
  "Ampicillin":    { flag:"caution", note:"Adjust interval at CrCl <30"        },
  "Haloperidol":   { flag:"ok",      note:"No significant renal adjustment"     },
  "Lorazepam":     { flag:"ok",      note:"No renal adjustment"                  },
  "Nitrofurantoin":{ flag:"avoid",   note:"Contraindicated CrCl <45"           },
  "Cyclobenzaprine":{ flag:"caution",note:"Use caution in older patients"       },
  "Naproxen":      { flag:"avoid",   note:"Nephrotoxic NSAID — avoid in CKD"   },
  "Phenytoin":     { flag:"caution", note:"Monitor free level in renal failure" },
};

// ── HELPERS ───────────────────────────────────────────────────────────
function minsAgo(iso) {
  if (!iso) return null;
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

function fmtElapsed(mins) {
  if (mins === null || mins === undefined) return "—";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60); const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
}

function calcCrCl(age, weight, scr, sex, height) {
  if (!age || !weight || !scr || scr <= 0) return null;
  const ibwBase = sex === "F" ? 45.5 : 50;
  const inchOver60 = height ? Math.max(0, (height / 2.54) - 60) : 0;
  const ibw = ibwBase + 2.3 * inchOver60;
  const useWt = ibw > 0 && weight > ibw ? ibw : weight;
  const base = ((140 - age) * useWt) / (72 * scr);
  return sex === "F" ? base * 0.85 : base;
}

function convState(patient, orders, results, notes, dispos) {
  const note  = notes.find(n => n.patient === patient.id);
  const dispo = dispos.find(d => d.patient === patient.id);
  const ptRes = results.filter(r => r.patient === patient.id);
  const ptOrd = orders.filter(o => o.patient === patient.id);
  const mins  = minsAgo(patient.arrived_at);
  if (dispo?.dispo_status === "complete" || dispo?.dispo_status === "ready") return "complete";
  if (ptRes.some(r => r.flag === "critical" && !r.acknowledged)) return "fragmented";
  if (!note?.assessment && mins > 120) return "fragmented";
  if (ptOrd.some(o => o.status === "pending" && o.urgency === "stat")) return "developing";
  if (!note?.assessment) return "developing";
  return note?.signed ? "converging" : "developing";
}

function getDrugsForCC(cc) {
  const ccLow = (cc || "").toLowerCase();
  for (const [k, drugs] of Object.entries(CC_DRUGS)) {
    if (k !== "default" && ccLow.includes(k)) return drugs;
  }
  return CC_DRUGS["default"];
}

function buildContext(patient, orders, results, notes, dispos) {
  const note  = notes.find(n => n.patient === patient.id);
  const dispo = dispos.find(d => d.patient === patient.id);
  const ptRes = results.filter(r => r.patient === patient.id);
  const ptOrd = orders.filter(o => o.patient === patient.id);
  const lines = [
    `PATIENT: ${patient.age}${patient.sex}, Room ${patient.room}, ${fmtElapsed(minsAgo(patient.arrived_at))} in ED`,
    `CC: ${patient.cc} | Provider: ${patient.provider || "Unassigned"} | Nurse: ${patient.nurse || "—"}`,
  ];
  if (ptRes.length) {
    lines.push("RESULTS:");
    ptRes.forEach(r => lines.push(`  ${r.name}: ${r.value}${r.unit?" "+r.unit:""} [${(r.flag||"normal").toUpperCase()}]${r.flag==="critical"&&!r.acknowledged?" ⚠ UNACKNOWLEDGED":""}`));
  }
  if (ptOrd.length) {
    lines.push("ORDERS:");
    ptOrd.forEach(o => lines.push(`  ${o.name}: ${(o.status||"").toUpperCase()} (${o.urgency||""})`));
  }
  if (note) {
    if (note.hpi)        lines.push(`HPI: ${note.hpi}`);
    if (note.assessment) lines.push(`ASSESSMENT: ${note.assessment}`);
    if (note.plan)       lines.push(`PLAN: ${note.plan}`);
  }
  if (dispo) lines.push(`DISPO: ${(dispo.dispo_type||"undecided").toUpperCase()} — ${(dispo.dispo_status||"").toUpperCase()}`);
  return lines.join("\n");
}

// ══════════════════════════════════════════════════════════════════════
//  MODULE-SCOPE PRIMITIVES
// ══════════════════════════════════════════════════════════════════════

function AmbientBg() {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
      {[
        { l:"12%", t:"20%", r:300, c:"rgba(0,229,192,0.045)",   a:0 },
        { l:"88%", t:"15%", r:260, c:"rgba(59,158,255,0.04)",   a:1 },
        { l:"70%", t:"75%", r:320, c:"rgba(155,109,255,0.035)", a:0 },
      ].map((o,i) => (
        <div key={i} style={{
          position:"absolute", left:o.l, top:o.t, width:o.r*2, height:o.r*2,
          borderRadius:"50%", background:`radial-gradient(circle,${o.c} 0%,transparent 68%)`,
          transform:"translate(-50%,-50%)",
          animation:`${PREFIX}orb${o.a} ${9+i*1.5}s ease-in-out infinite`,
        }}/>
      ))}
    </div>
  );
}

function Toast({ msg, err }) {
  return (
    <div style={{
      position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)",
      background:"rgba(8,22,40,0.96)", borderRadius:10, padding:"10px 20px",
      border:`1px solid ${err ? T.red+"55" : T.teal+"45"}`,
      fontFamily:"DM Sans", fontWeight:600, fontSize:13,
      color:err ? T.coral : T.teal, zIndex:9999, pointerEvents:"none",
      animation:`${PREFIX}fade .2s ease both`,
    }}>{msg}</div>
  );
}

function ThinkDots() {
  return (
    <div style={{ display:"flex", gap:4 }}>
      {[0,1,2].map(i => (
        <div key={i} className={`${PREFIX}-think`} style={{ width:5, height:5, borderRadius:"50%", background:T.purple, animationDelay:`${i*.2}s` }}/>
      ))}
    </div>
  );
}

function QHeader({ label, color, right }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
      <div style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:color||T.txt4, letterSpacing:2, textTransform:"uppercase" }}>
        {label}
      </div>
      {right}
    </div>
  );
}

function Chip({ label, color, pulse }) {
  return (
    <span className={pulse ? `${PREFIX}-pulse` : ""} style={{
      fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700,
      padding:"2px 7px", borderRadius:20, display:"inline-block",
      background:`${color}16`, border:`1px solid ${color}38`, color,
    }}>{label}</span>
  );
}

// ── Story Quadrant ────────────────────────────────────────────────────
function StoryQuadrant({ narrative, onGenerate, hasDispo }) {
  if (narrative?.status === "loading") {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10, padding:"28px 0" }}>
        <ThinkDots/>
        <span style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4 }}>Synthesizing clinical story...</span>
      </div>
    );
  }

  const conv = narrative?.convergence;
  const cc   = conv ? (CONV_CFG[conv] || CONV_CFG.developing) : null;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
      {!narrative || narrative.status === "idle" ? (
        <div style={{ textAlign:"center", padding:"20px 0" }}>
          <button onClick={onGenerate} style={{
            fontFamily:"DM Sans", fontWeight:700, fontSize:12,
            padding:"10px 22px", borderRadius:9, cursor:"pointer",
            border:`1px solid ${T.purple}45`, background:`${T.purple}10`, color:T.purple,
          }}>🧠 Generate Story</button>
        </div>
      ) : (
        <>
          {conv && cc && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <Chip label={`${cc.icon} ${cc.label}`} color={cc.color}/>
              <button onClick={onGenerate} style={{
                fontFamily:"JetBrains Mono", fontSize:8, cursor:"pointer",
                background:"none", border:"none", color:T.txt4,
              }}>↺ Refresh</button>
            </div>
          )}
          <p style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt, lineHeight:1.75, fontStyle:"italic" }}>
            {narrative.text}
          </p>
          {narrative.watchFor && (
            <div style={{ padding:"8px 10px", borderRadius:8, borderLeft:`3px solid ${T.gold}`, background:`${T.gold}08` }}>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:7, color:T.gold, letterSpacing:1.5, textTransform:"uppercase", marginBottom:3 }}>Watch For</div>
              <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt2 }}>{narrative.watchFor}</div>
            </div>
          )}
          {narrative.breaks?.map((b, i) => (
            <div key={i} style={{ padding:"8px 10px", borderRadius:8, borderLeft:`3px solid ${T.red}`, background:`${T.red}09` }}>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.red, marginBottom:3 }}>⚡ {b.finding}</div>
              <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt2 }}>{b.concern}</div>
            </div>
          ))}
          {narrative.status === "error" && (
            <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.coral }}>Generation failed</div>
          )}
        </>
      )}
    </div>
  );
}

// ── Results + Orders Quadrant ─────────────────────────────────────────
function ResultsOrdersQuadrant({ results, orders, onAck, onAddOrder, patientId, showToast }) {
  const [addOpen,    setAddOpen]    = useState(false);
  const [newName,    setNewName]    = useState("");
  const [newUrgency, setNewUrgency] = useState("routine");
  const [saving,     setSaving]     = useState(false);

  const pend = orders.filter(o => o.status === "pending");
  const done = orders.filter(o => o.status !== "pending");

  async function submitOrder() {
    if (!newName.trim()) return;
    setSaving(true);
    await onAddOrder(patientId, newName.trim(), newUrgency);
    setNewName(""); setNewUrgency("routine"); setAddOpen(false); setSaving(false);
  }

  const iStyle = {
    background:"rgba(14,37,68,0.8)", border:"1px solid rgba(42,79,122,0.4)",
    borderRadius:7, padding:"6px 10px",
    fontFamily:"DM Sans", fontSize:11, color:T.txt, outline:"none",
    width:"100%",
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
      {/* Results */}
      {results.length === 0 ? (
        <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4, fontStyle:"italic" }}>No results yet</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
          {results.map(r => {
            const fc = FLAG_CFG[r.flag] || FLAG_CFG.normal;
            const isUnacked = r.flag === "critical" && !r.acknowledged;
            return (
              <div key={r.id} style={{
                padding:"7px 10px", borderRadius:8,
                border:`1px solid ${isUnacked ? T.red+"40" : "rgba(42,79,122,0.2)"}`,
                borderLeft:`3px solid ${isUnacked ? T.red : fc.color}`,
                background:`${fc.color}07`,
                display:"flex", alignItems:"center", gap:8,
              }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"DM Sans", fontWeight:600, fontSize:12, color:T.txt }}>{r.name}</div>
                  {r.ref_range && <div style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4 }}>ref {r.ref_range}</div>}
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontFamily:"JetBrains Mono", fontWeight:700, fontSize:13, color:fc.color }}>{r.value}</div>
                  {r.unit && <div style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4 }}>{r.unit}</div>}
                </div>
                <Chip label={r.acknowledged && r.flag==="critical" ? "ACKED" : fc.label} color={fc.color}/>
                {isUnacked && (
                  <button onClick={() => onAck(r.id)} style={{
                    fontFamily:"DM Sans", fontWeight:700, fontSize:9, padding:"3px 8px",
                    borderRadius:6, cursor:"pointer", border:`1px solid ${T.green}45`,
                    background:`${T.green}12`, color:T.green, flexShrink:0,
                  }}>Ack</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Orders */}
      <div style={{ borderTop:"1px solid rgba(42,79,122,0.25)", paddingTop:9 }}>
        <div style={{ fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, color:T.txt4, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>
          Orders ({orders.length})
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          {pend.map(o => (
            <div key={o.id} style={{ display:"flex", alignItems:"center", gap:7, padding:"5px 9px", borderRadius:7, background:`${T.gold}09`, borderLeft:`2px solid ${T.gold}` }}>
              <span className={`${PREFIX}-pulse`} style={{ width:6, height:6, borderRadius:"50%", background:T.gold, flexShrink:0, display:"inline-block" }}/>
              <span style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt, flex:1 }}>{o.name}</span>
              <span style={{ fontFamily:"JetBrains Mono", fontSize:8, color:o.urgency==="stat"?T.red:T.txt4 }}>{(o.urgency||"").toUpperCase()}</span>
            </div>
          ))}
          {done.map(o => (
            <div key={o.id} style={{ display:"flex", alignItems:"center", gap:7, padding:"4px 9px", borderRadius:7, background:"rgba(14,37,68,0.3)" }}>
              <span style={{ color:T.green, fontSize:10 }}>✓</span>
              <span style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt3, flex:1 }}>{o.name}</span>
            </div>
          ))}
        </div>
      </div>

      {addOpen ? (
        <div style={{ ...glass, padding:10, display:"flex", flexDirection:"column", gap:7, borderRadius:9 }}>
          <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Order name (e.g. CBC, CT Head w/o)" style={iStyle}/>
          <div style={{ display:"flex", gap:5 }}>
            {["stat","routine"].map(u => (
              <button key={u} onClick={() => setNewUrgency(u)} style={{
                flex:1, fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700,
                padding:"5px", borderRadius:7, cursor:"pointer", textTransform:"uppercase",
                border:`1px solid ${newUrgency===u?(u==="stat"?T.red:T.teal)+"55":"rgba(42,79,122,0.35)"}`,
                background:newUrgency===u?`${u==="stat"?T.red:T.teal}12`:"transparent",
                color:newUrgency===u?(u==="stat"?T.red:T.teal):T.txt3,
              }}>{u}</button>
            ))}
          </div>
          <div style={{ display:"flex", gap:5 }}>
            <button onClick={submitOrder} disabled={!newName.trim()||saving} style={{
              flex:2, fontFamily:"DM Sans", fontWeight:700, fontSize:11, padding:"7px",
              borderRadius:7, cursor:newName.trim()&&!saving?"pointer":"not-allowed",
              border:`1px solid ${T.blue}40`, background:`${T.blue}10`, color:T.blue,
              opacity:!newName.trim()||saving?.5:1,
            }}>{saving?"Ordering...":"Place Order"}</button>
            <button onClick={() => { setAddOpen(false); setNewName(""); }} style={{
              flex:1, fontFamily:"DM Sans", fontWeight:600, fontSize:11, padding:"7px",
              borderRadius:7, cursor:"pointer", border:"1px solid rgba(42,79,122,0.4)",
              background:"transparent", color:T.txt4,
            }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAddOpen(true)} style={{
          fontFamily:"DM Sans", fontWeight:600, fontSize:11, padding:"7px",
          borderRadius:8, cursor:"pointer", border:`1px solid ${T.blue}30`,
          background:`${T.blue}08`, color:T.blue,
        }}>+ Add Order</button>
      )}
    </div>
  );
}

// ── Note Quadrant ─────────────────────────────────────────────────────
function NoteQuadrant({ note, patientId, onSave, onSign, onDraft, drafting }) {
  const [editing,  setEditing]  = useState(false);
  const [hpi,      setHpi]      = useState(note?.hpi        || "");
  const [assess,   setAssess]   = useState(note?.assessment || "");
  const [plan,     setPlan]     = useState(note?.plan       || "");
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    setHpi(note?.hpi || ""); setAssess(note?.assessment || ""); setPlan(note?.plan || "");
  }, [note]);

  async function handleSave() {
    setSaving(true);
    await onSave(patientId, { hpi, assessment:assess, plan, patient:patientId });
    setEditing(false);
    setSaving(false);
  }

  const taStyle = {
    background:"rgba(14,37,68,0.8)", border:"1px solid rgba(0,229,192,0.25)",
    borderRadius:8, padding:"8px 10px",
    fontFamily:"DM Sans", fontSize:12, color:T.txt,
    outline:"none", width:"100%", resize:"vertical", lineHeight:1.6,
  };

  const SECTIONS = [
    { key:"hpi", label:"HPI", color:T.teal, val:hpi, set:setHpi },
    { key:"ass", label:"Assessment", color:T.gold, val:assess, set:setAssess },
    { key:"plan",label:"Plan", color:T.blue, val:plan, set:setPlan },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
      {drafting && (
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <ThinkDots/>
          <span style={{ fontFamily:"DM Sans", fontSize:11, color:T.purple }}>Drafting note sections...</span>
        </div>
      )}

      {SECTIONS.map(({ key, label, color, val, set }) => (
        <div key={key} style={{ padding:"9px 11px", borderRadius:9, borderLeft:`3px solid ${color}`, background:`${color}07` }}>
          <div style={{ fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, color, letterSpacing:1.5, textTransform:"uppercase", marginBottom:5 }}>{label}</div>
          {editing ? (
            <textarea value={val} onChange={e => set(e.target.value)} rows={3} style={taStyle}/>
          ) : (
            <p style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt2, lineHeight:1.65 }}>
              {val || <span style={{ color:T.txt4, fontStyle:"italic" }}>Not yet documented</span>}
            </p>
          )}
        </div>
      ))}

      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {editing ? (
          <>
            <button onClick={handleSave} disabled={saving} style={{
              flex:2, fontFamily:"DM Sans", fontWeight:700, fontSize:11, padding:"8px",
              borderRadius:8, cursor:"pointer", border:`1px solid ${T.teal}40`,
              background:`${T.teal}10`, color:T.teal, opacity:saving?.6:1,
            }}>{saving ? "Saving..." : "Save Note"}</button>
            <button onClick={() => setEditing(false)} style={{
              flex:1, fontFamily:"DM Sans", fontWeight:600, fontSize:11, padding:"8px",
              borderRadius:8, cursor:"pointer", border:"1px solid rgba(42,79,122,0.4)",
              background:"transparent", color:T.txt4,
            }}>Cancel</button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(true)} style={{
              flex:1, fontFamily:"DM Sans", fontWeight:600, fontSize:11, padding:"7px",
              borderRadius:8, cursor:"pointer", border:`1px solid rgba(42,79,122,0.4)`,
              background:"transparent", color:T.txt3,
            }}>✏️ Edit</button>
            <button onClick={onDraft} disabled={drafting} style={{
              flex:1, fontFamily:"DM Sans", fontWeight:600, fontSize:11, padding:"7px",
              borderRadius:8, cursor:"pointer", border:`1px solid ${T.purple}35`,
              background:`${T.purple}0a`, color:T.purple, opacity:drafting?.6:1,
            }}>🤖 AI Draft</button>
            {!note?.signed && (
              <button onClick={onSign} style={{
                flex:1, fontFamily:"DM Sans", fontWeight:700, fontSize:11, padding:"7px",
                borderRadius:8, cursor:"pointer", border:`1px solid ${T.green}40`,
                background:`${T.green}10`, color:T.green,
              }}>✅ Sign</button>
            )}
            {note?.signed && <Chip label="SIGNED" color={T.green}/>}
          </>
        )}
      </div>
    </div>
  );
}

// ── Dispo + Dosing Quadrant ───────────────────────────────────────────
function DispoDosingQuadrant({ dispo, patient, orders, results, notes, dispos }) {
  const crcl = calcCrCl(parseFloat(patient.age), parseFloat(patient.weight), parseFloat(patient.scr), patient.sex, parseFloat(patient.height));
  const drugs = getDrugsForCC(patient.cc);
  const renalTier = !crcl ? "unknown" : crcl >= 60 ? "normal" : crcl >= 30 ? "moderate" : "severe";
  const renalColor = renalTier === "normal" ? T.green : renalTier === "moderate" ? T.gold : renalTier === "severe" ? T.red : T.txt4;

  const boardMins = dispo?.boarding_start ? minsAgo(dispo.boarding_start) : null;
  const dtCfg     = { admit:{color:T.blue}, discharge:{color:T.green}, transfer:{color:T.purple}, observation:{color:T.teal} };
  const dc        = dispo ? (dtCfg[dispo.dispo_type] || { color:T.txt4 }) : null;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
      {/* Dispo block */}
      {dispo ? (
        <div style={{ padding:"10px 12px", borderRadius:9, borderLeft:`3px solid ${dc.color}`, background:`${dc.color}09` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
            <div style={{ fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700, color:dc.color }}>
              {(dispo.dispo_type||"UNDECIDED").toUpperCase()}
            </div>
            <Chip label={(dispo.dispo_status||"").toUpperCase()} color={dc.color}/>
          </div>
          {dispo.accepting_service && (
            <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt, fontWeight:600 }}>{dispo.accepting_service}</div>
          )}
          {dispo.accepting_physician && (
            <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt3 }}>{dispo.accepting_physician}</div>
          )}
          {dispo.destination && (
            <div style={{ fontFamily:"JetBrains Mono", fontSize:10, color:dc.color, marginTop:2 }}>→ {dispo.destination}</div>
          )}
          {boardMins !== null && (
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:6, paddingTop:6, borderTop:"1px solid rgba(42,79,122,0.2)" }}>
              <span style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4, letterSpacing:1.5 }}>BOARDING</span>
              <span style={{ fontFamily:"JetBrains Mono", fontWeight:700, fontSize:16, color:boardMins>=240?T.red:boardMins>=120?T.orange:T.teal }}>
                {fmtElapsed(boardMins)}
              </span>
            </div>
          )}
          {dispo.est_dispo_time && (
            <div style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4, marginTop:4 }}>Est: {dispo.est_dispo_time}</div>
          )}
        </div>
      ) : (
        <div style={{ padding:"10px 12px", borderRadius:9, background:"rgba(14,37,68,0.4)", border:"1px solid rgba(42,79,122,0.25)", fontFamily:"DM Sans", fontSize:11, color:T.txt4, fontStyle:"italic" }}>
          No disposition set yet
        </div>
      )}

      {/* Renal status */}
      <div style={{ borderTop:"1px solid rgba(42,79,122,0.25)", paddingTop:9 }}>
        <div style={{ fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, color:T.txt4, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>
          Renal Dosing
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
          {crcl !== null ? (
            <>
              <span style={{ fontFamily:"JetBrains Mono", fontWeight:700, fontSize:20, color:renalColor }}>{Math.round(crcl)}</span>
              <span style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4 }}>mL/min CrCl</span>
              <Chip label={renalTier.toUpperCase()} color={renalColor}/>
            </>
          ) : (
            <span style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4, fontStyle:"italic" }}>Enter SCr/Wt/Age for CrCl</span>
          )}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          {drugs.map(drug => {
            const dr = DRUG_RENAL_FLAGS[drug];
            const fc = !dr ? { color:T.txt4, flag:"ok" } : dr.flag==="ok" ? { color:T.green } : dr.flag==="caution" ? { color:T.gold } : { color:T.red };
            return (
              <div key={drug} style={{ display:"flex", alignItems:"center", gap:7, padding:"4px 8px", borderRadius:7, background:"rgba(14,37,68,0.35)" }}>
                <span style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt, flex:1 }}>{drug}</span>
                {dr && <span style={{ fontFamily:"JetBrains Mono", fontSize:8, color:fc.color }}>{dr.flag.toUpperCase()}</span>}
                {dr && crcl && <span style={{ fontFamily:"DM Sans", fontSize:9, color:T.txt4 }}>{dr.note}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Slide-up Panel ────────────────────────────────────────────────────
function SlidePanel({ title, color, children, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, display:"flex", flexDirection:"column", justifyContent:"flex-end" }} onClick={onClose}>
      <div
        className={`${PREFIX}-rise`}
        onClick={e => e.stopPropagation()}
        style={{
          ...glass, borderRadius:"16px 16px 0 0", maxHeight:"72vh",
          border:"1px solid rgba(42,79,122,0.4)",
          borderBottom:"none",
          boxShadow:`0 -16px 60px rgba(0,0,0,0.6),0 0 40px ${color}10`,
          display:"flex", flexDirection:"column",
        }}
      >
        <div style={{ padding:"14px 18px 10px", borderBottom:"1px solid rgba(42,79,122,0.3)", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <span style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:14, color:T.txt }}>{title}</span>
          <button onClick={onClose} style={{ fontFamily:"DM Sans", fontSize:12, fontWeight:600, padding:"4px 10px", borderRadius:7, cursor:"pointer", border:"1px solid rgba(42,79,122,0.45)", background:"rgba(14,37,68,0.6)", color:T.txt3 }}>✕</button>
        </div>
        <div style={{ overflowY:"auto", padding:"12px 18px 18px", flex:1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════

export default function PatientWorkspace({ patient: initPatient, patientId, onBack, onNavigate }) {
  const [patient,   setPatient]   = useState(initPatient || null);
  const [results,   setResults]   = useState([]);
  const [orders,    setOrders]    = useState([]);
  const [note,      setNote]      = useState(null);
  const [dispo,     setDispo]     = useState(null);
  const [allNotes,  setAllNotes]  = useState([]);
  const [allDispos, setAllDispos] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [narrative, setNarrative] = useState({ status:"idle" });
  const [panel,     setPanel]     = useState(null); // "ddx"|"consult"|"handoff"|"safety"
  const [panelData, setPanelData] = useState({});
  const [drafting,  setDrafting]  = useState(false);
  const [toast,     setToast]     = useState({ msg:"", err:false });
  const autoRan = useRef(false);

  const pid = patient?.id || patientId;

  function showToast(msg, err = false) { setToast({ msg, err }); setTimeout(() => setToast({ msg:"", err:false }), 2400); }

  // ── Fetch ─────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!pid) return;
    try {
      const [pts, res, ords, nts, dps] = await Promise.all([
        initPatient ? Promise.resolve([initPatient]) : Patient.filter({ id:pid }),
        ClinicalResult.filter({ patient:pid }),
        Order.filter({ patient:pid }),
        ClinicalNote.list(), DispositionRecord.list(),
      ]);
      if (pts?.length) setPatient(pts[0]);
      setResults(res || []);
      setOrders(ords || []);
      setAllNotes(nts || []);
      setAllDispos(dps || []);
      setNote((nts || []).find(n => n.patient === pid) || null);
      setDispo((dps || []).find(d => d.patient === pid) || null);
    } catch { showToast("Error loading patient data", true); }
    finally { setLoading(false); }
  }, [pid]);

  useEffect(() => { fetchAll(); const t = setInterval(fetchAll, 30000); return () => clearInterval(t); }, [fetchAll]);

  // ── Auto-generate narrative once ──────────────────────────────────
  useEffect(() => {
    if (autoRan.current || loading || !patient) return;
    autoRan.current = true;
    generateNarrative();
  }, [loading, patient]);

  // ── AI: Narrative ─────────────────────────────────────────────────
  async function generateNarrative() {
    if (!patient) return;
    setNarrative({ status:"loading" });
    try {
      const ctx = buildContext(patient, orders, results, allNotes, allDispos);
      const raw = await InvokeLLM({
        prompt:`You are a senior emergency medicine attending. Synthesize a living clinical narrative.\n\n${ctx}\n\nReturn ONLY valid JSON:\n{"oneliner":"one sentence","text":"3-5 sentence curbside report with specific values","convergence":"converging|developing|fragmented|complete","breaks":[{"finding":"specific","concern":"why it contradicts the story"}],"watchFor":"single next decision point"}`,
        add_context_from_previous_calls:false,
      });
      const parsed = JSON.parse((typeof raw === "string" ? raw : raw?.content || "{}").replace(/```json|```/g,"").trim());
      setNarrative({ ...parsed, status:"done" });
    } catch { setNarrative({ status:"error" }); }
  }

  // ── AI: Note Draft ────────────────────────────────────────────────
  async function draftNote() {
    if (!patient) return;
    setDrafting(true);
    try {
      const ctx = buildContext(patient, orders, results, allNotes, allDispos);
      const raw = await InvokeLLM({
        prompt:`You are an emergency medicine physician. Draft the note for this patient.\n\n${ctx}\n\nReturn ONLY valid JSON:\n{"hpi":"detailed HPI paragraph","assessment":"assessment paragraph with diagnosis and key findings","plan":"numbered plan as a single string"}`,
        add_context_from_previous_calls:false,
      });
      const parsed = JSON.parse((typeof raw === "string" ? raw : raw?.content || "{}").replace(/```json|```/g,"").trim());
      const existing = allNotes.find(n => n.patient === pid);
      const payload  = { patient:pid, hpi:parsed.hpi||"", assessment:parsed.assessment||"", plan:parsed.plan||"" };
      if (existing) await ClinicalNote.update(existing.id, payload);
      else await ClinicalNote.create(payload);
      showToast("Note drafted");
      fetchAll();
    } catch { showToast("Draft failed", true); }
    finally { setDrafting(false); }
  }

  // ── AI: Panel content ─────────────────────────────────────────────
  async function openPanel(type) {
    setPanel(type);
    if (panelData[type]) return;
    setPanelData(prev => ({ ...prev, [type]:{ status:"loading" } }));
    try {
      const ctx = buildContext(patient, orders, results, allNotes, allDispos);
      let prompt = "";
      if (type === "safety") {
        prompt = `Patient safety pre-discharge review.\n\n${ctx}\n\nReturn ONLY valid JSON:\n{"safeToDischarge":true/false,"overallRisk":"low|moderate|high","concerns":[{"category":"labs|diagnosis|medications|followup","issue":"specific issue","action":"what to do"}],"confirmBefore":["item to verify"],"summary":"1-2 sentence assessment"}`;
      } else if (type === "handoff") {
        prompt = `Generate I-PASS handoff for shift change.\n\n${ctx}\n\nFormat as plain text with these headers:\n**I — ILLNESS SEVERITY:** [Critical/Unstable/Stable/Good]\n**P — PATIENT SUMMARY:** [2-3 sentences]\n**A — ACTION LIST:**\n  1. [pending item]\n**S — SITUATION AWARENESS:**\n  - If [trigger]: [action]\n**S — SYNTHESIS:** [one sentence for incoming provider]`;
      } else if (type === "ddx") {
        prompt = `Emergency medicine differential for this patient.\n\n${ctx}\n\nReturn ONLY valid JSON:\n{"differentials":[{"rank":1,"diagnosis":"name","tier":"must_rule_out|high|moderate|low","rationale":"1-2 sentences","next":["next step"]}],"insight":"one clinical pearl"}`;
      } else if (type === "consult") {
        return; // consult uses free-text input, handled separately
      }
      const raw     = await InvokeLLM({ prompt, add_context_from_previous_calls:false });
      const textRaw = typeof raw === "string" ? raw : raw?.content || "";
      let content;
      try { content = JSON.parse(textRaw.replace(/```json|```/g,"").trim()); }
      catch { content = { text: textRaw }; }
      setPanelData(prev => ({ ...prev, [type]:{ status:"done", ...content } }));
    } catch { setPanelData(prev => ({ ...prev, [type]:{ status:"error" } })); }
  }

  // ── Write helpers ─────────────────────────────────────────────────
  const handleAck = useCallback(async (id) => {
    try {
      await ClinicalResult.update(id, { acknowledged:true, acknowledged_at:new Date().toISOString() });
      showToast("Acknowledged"); fetchAll();
    } catch { showToast("Error", true); }
  }, [fetchAll]);

  const handleAddOrder = useCallback(async (pid, name, urgency) => {
    try {
      await Order.create({ patient:pid, name, urgency, status:"pending" });
      showToast(`${name} ordered`); fetchAll();
    } catch { showToast("Error", true); }
  }, [fetchAll]);

  const handleSaveNote = useCallback(async (pid, payload) => {
    try {
      const existing = allNotes.find(n => n.patient === pid);
      if (existing) await ClinicalNote.update(existing.id, payload);
      else await ClinicalNote.create(payload);
      showToast("Note saved"); fetchAll();
    } catch { showToast("Error saving note", true); }
  }, [allNotes, fetchAll]);

  const handleSignNote = useCallback(async () => {
    try {
      const n = allNotes.find(nn => nn.patient === pid);
      if (n) { await ClinicalNote.update(n.id, { signed:true }); showToast("Note signed"); fetchAll(); }
    } catch { showToast("Error signing note", true); }
  }, [allNotes, pid, fetchAll]);

  if (!patient && loading) {
    return (
      <div style={{ background:T.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ fontFamily:"DM Sans", fontSize:14, color:T.txt4 }}>Loading patient...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div style={{ background:T.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ fontFamily:"DM Sans", fontSize:14, color:T.coral }}>Patient not found</div>
      </div>
    );
  }

  const stColor = (STATUS_CFG[patient.status] || STATUS_CFG.waiting).color;
  const conv    = convState(patient, orders, results, allNotes, allDispos);
  const cc      = CONV_CFG[conv] || CONV_CFG.developing;
  const ptMins  = minsAgo(patient.arrived_at);
  const critCt  = results.filter(r => r.flag === "critical" && !r.acknowledged).length;

  const Q_HEIGHT = 340;

  return (
    <div style={{ background:T.bg, minHeight:"100vh", color:T.txt, fontFamily:"DM Sans, sans-serif", position:"relative", overflowX:"hidden", paddingBottom:72 }}>
      <AmbientBg/>
      {toast.msg && <Toast msg={toast.msg} err={toast.err}/>}

      {/* Panels */}
      {panel === "ddx" && (
        <SlidePanel title="DDx Engine" color={T.purple} onClose={() => setPanel(null)}>
          {panelData.ddx?.status === "loading" && <div style={{ display:"flex", gap:8, alignItems:"center", padding:"20px 0" }}><ThinkDots/><span style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt4 }}>Generating differential...</span></div>}
          {panelData.ddx?.status === "error" && <div style={{ color:T.coral, fontFamily:"DM Sans", fontSize:12 }}>Generation failed</div>}
          {panelData.ddx?.differentials?.map((dx, i) => {
            const tc = { must_rule_out:T.red, high:T.orange, moderate:T.gold, low:T.teal }[dx.tier] || T.txt4;
            return (
              <div key={i} style={{ padding:"10px 12px", borderRadius:10, borderLeft:`3px solid ${tc}`, background:`${tc}08`, marginBottom:7 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <span style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:13, color:T.txt }}>{dx.rank}. {dx.diagnosis}</span>
                  <Chip label={dx.tier.replace("_"," ").toUpperCase()} color={tc}/>
                </div>
                <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt3, lineHeight:1.6 }}>{dx.rationale}</div>
                {dx.next?.length > 0 && <div style={{ fontFamily:"DM Sans", fontSize:10, color:T.teal, marginTop:5 }}>{dx.next.join(" · ")}</div>}
              </div>
            );
          })}
          {panelData.ddx?.insight && <div style={{ padding:"9px 12px", borderRadius:9, background:`${T.gold}09`, borderLeft:`3px solid ${T.gold}`, fontFamily:"DM Sans", fontSize:12, color:T.txt2, marginTop:8 }}>💡 {panelData.ddx.insight}</div>}
        </SlidePanel>
      )}

      {panel === "handoff" && (
        <SlidePanel title="I-PASS Handoff" color={T.blue} onClose={() => setPanel(null)}>
          {panelData.handoff?.status === "loading" && <div style={{ display:"flex", gap:8, alignItems:"center", padding:"20px 0" }}><ThinkDots/><span style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt4 }}>Generating handoff...</span></div>}
          {panelData.handoff?.text && (
            <>
              <div style={{ ...glass, padding:14, whiteSpace:"pre-wrap", fontFamily:"DM Sans", fontSize:12, color:T.txt, lineHeight:1.75, borderLeft:`3px solid ${T.blue}`, background:`${T.blue}07`, marginBottom:10 }}>
                {panelData.handoff.text}
              </div>
              <button onClick={() => { if (navigator.clipboard) navigator.clipboard.writeText(panelData.handoff.text); showToast("Copied"); }} style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:11, padding:"8px 16px", borderRadius:8, cursor:"pointer", border:`1px solid ${T.teal}40`, background:`${T.teal}10`, color:T.teal }}>📋 Copy</button>
            </>
          )}
        </SlidePanel>
      )}

      {panel === "safety" && (
        <SlidePanel title="Pre-Discharge Safety Check" color={T.green} onClose={() => setPanel(null)}>
          {panelData.safety?.status === "loading" && <div style={{ display:"flex", gap:8, alignItems:"center", padding:"20px 0" }}><ThinkDots/><span style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt4 }}>Reviewing case for discharge safety...</span></div>}
          {panelData.safety?.status === "done" && (
            <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
              <div style={{ padding:"11px 13px", borderRadius:10, borderLeft:`4px solid ${panelData.safety.safeToDischarge ? T.green : T.red}`, background:`${panelData.safety.safeToDischarge ? T.green : T.red}0b` }}>
                <div style={{ fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700, color:panelData.safety.safeToDischarge ? T.green : T.red, letterSpacing:1.5, marginBottom:4 }}>{panelData.safety.safeToDischarge ? "✅ CLEARED" : "⚠️ CONCERNS — REVIEW BEFORE DISCHARGE"}</div>
                <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt2 }}>{panelData.safety.summary}</div>
              </div>
              {panelData.safety.concerns?.map((c, i) => (
                <div key={i} style={{ padding:"9px 12px", borderRadius:9, background:"rgba(14,37,68,0.5)", borderLeft:`3px solid ${T.orange}` }}>
                  <div style={{ fontFamily:"DM Sans", fontWeight:600, fontSize:12, color:T.txt, marginBottom:2 }}>{c.issue}</div>
                  <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.teal }}>▸ {c.action}</div>
                </div>
              ))}
              {panelData.safety.confirmBefore?.length > 0 && (
                <div style={{ ...glass, padding:"10px 13px", borderLeft:`3px solid ${T.purple}`, background:`${T.purple}07` }}>
                  <div style={{ fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, color:T.purple, letterSpacing:1.5, textTransform:"uppercase", marginBottom:7 }}>Confirm Before Discharge</div>
                  {panelData.safety.confirmBefore.map((item, i) => (
                    <div key={i} style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt, marginBottom:5, display:"flex", gap:6 }}>
                      <span style={{ color:T.teal }}>□</span>{item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </SlidePanel>
      )}

      {panel === "consult" && (
        <SlidePanel title="Quick Consult" color={T.purple} onClose={() => setPanel(null)}>
          <ConsultPanel patient={patient} context={buildContext(patient, orders, results, allNotes, allDispos)}/>
        </SlidePanel>
      )}

      <div style={{ position:"relative", zIndex:1 }}>

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <div style={{
          ...glass, margin:"12px 12px 10px", padding:"10px 14px",
          borderRadius:12, borderLeft:`3px solid ${stColor}`,
          display:"flex", alignItems:"center", gap:12, flexWrap:"wrap",
        }}>
          <span style={{ fontFamily:"JetBrains Mono", fontWeight:700, fontSize:26, color:stColor, lineHeight:1 }}>
            Rm {patient.room}
          </span>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
              <span style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:16, color:T.txt }}>{patient.cc}</span>
              <Chip label={`${cc.icon} ${cc.label}`} color={cc.color}/>
              {critCt > 0 && <Chip label={`🚨 ${critCt} CRIT`} color={T.red} pulse/>}
            </div>
            <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4, marginTop:2 }}>
              {patient.age}{patient.sex} · {patient.provider || "—"} · {patient.nurse || "—"} · {fmtElapsed(ptMins)} in ED
            </div>
          </div>
          {onBack && (
            <button onClick={onBack} style={{
              fontFamily:"DM Sans", fontWeight:600, fontSize:11, padding:"5px 12px",
              borderRadius:8, cursor:"pointer", border:"1px solid rgba(42,79,122,0.5)",
              background:"rgba(14,37,68,0.6)", color:T.txt3,
            }}>← Back</button>
          )}
        </div>

        {/* ── 2×2 GRID ───────────────────────────────────────────── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, padding:"0 12px" }}>

          {/* TL: Story */}
          <div style={{ ...glass, padding:"12px 14px", overflow:"hidden" }}>
            <QHeader label="Clinical Story" color={T.purple}
              right={<button onClick={generateNarrative} style={{ fontFamily:"JetBrains Mono", fontSize:8, cursor:"pointer", background:"none", border:"none", color:T.txt4 }}>↺</button>}
            />
            <div style={{ maxHeight:Q_HEIGHT, overflowY:"auto" }}>
              <StoryQuadrant narrative={narrative} onGenerate={generateNarrative} hasDispo={!!dispo}/>
            </div>
          </div>

          {/* TR: Results + Orders */}
          <div style={{ ...glass, padding:"12px 14px" }}>
            <QHeader label={`Results (${results.length}) · Orders (${orders.length})`} color={T.blue}/>
            <div style={{ maxHeight:Q_HEIGHT, overflowY:"auto" }}>
              <ResultsOrdersQuadrant
                results={results} orders={orders}
                onAck={handleAck} onAddOrder={handleAddOrder}
                patientId={pid} showToast={showToast}
              />
            </div>
          </div>

          {/* BL: Note */}
          <div style={{ ...glass, padding:"12px 14px" }}>
            <QHeader label={note?.signed ? "Note — Signed" : "Note — Draft"} color={note?.signed ? T.green : T.gold}
              right={!note?.signed && <Chip label="UNSIGNED" color={T.orange}/>}
            />
            <div style={{ maxHeight:Q_HEIGHT, overflowY:"auto" }}>
              <NoteQuadrant note={note} patientId={pid} onSave={handleSaveNote} onSign={handleSignNote} onDraft={draftNote} drafting={drafting}/>
            </div>
          </div>

          {/* BR: Dispo + Dosing */}
          <div style={{ ...glass, padding:"12px 14px" }}>
            <QHeader label="Dispo + Dosing" color={T.teal}/>
            <div style={{ maxHeight:Q_HEIGHT, overflowY:"auto" }}>
              <DispoDosingQuadrant dispo={dispo} patient={patient} orders={orders} results={results} notes={allNotes} dispos={allDispos}/>
            </div>
          </div>

        </div>
      </div>

      {/* ── PERSISTENT ACTION BAR ─────────────────────────────────── */}
      <div style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:200,
        backdropFilter:"blur(20px) saturate(180%)", WebkitBackdropFilter:"blur(20px) saturate(180%)",
        background:"rgba(5,10,20,0.94)",
        borderTop:"1px solid rgba(42,79,122,0.4)",
        padding:"8px 16px",
        display:"flex", gap:8,
      }}>
        {[
          { id:"ddx",     icon:"🔍", label:"DDx Engine",    color:T.purple },
          { id:"safety",  icon:"🛡", label:"Safety Check",  color:T.green  },
          { id:"handoff", icon:"📋", label:"Handoff",       color:T.blue   },
          { id:"consult", icon:"🤖", label:"Quick Consult", color:T.teal   },
        ].map(a => (
          <button key={a.id} onClick={() => openPanel(a.id)} style={{
            flex:1, fontFamily:"DM Sans", fontWeight:700,
            fontSize:"clamp(10px,1.4vw,13px)",
            padding:"9px 8px", borderRadius:9, cursor:"pointer",
            border:`1px solid ${panel===a.id ? a.color+"55" : a.color+"22"}`,
            background: panel===a.id ? `${a.color}18` : `${a.color}08`,
            color:a.color, display:"flex", alignItems:"center", justifyContent:"center", gap:5,
            transition:"all .12s",
          }}>
            <span>{a.icon}</span>
            <span>{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Quick Consult (module-scope — used inside SlidePanel) ─────────────
function ConsultPanel({ patient, context }) {
  const [q,    setQ]    = useState("");
  const [ans,  setAns]  = useState("");
  const [busy, setBusy] = useState(false);

  const QUICK = [
    "What is the safest opioid for this patient?",
    "Which antibiotics should I avoid?",
    "Is this patient safe for contrast?",
    "What is the discharge plan for this diagnosis?",
    "Are there drug interactions I should know about?",
  ];

  async function ask() {
    if (!q.trim()) return;
    setBusy(true); setAns("");
    try {
      const raw = await InvokeLLM({
        prompt: `You are a senior emergency medicine attending. Answer concisely and clinically.\n\nPATIENT CONTEXT:\n${context}\n\nQUESTION: ${q}\n\nRespond in 3-5 sentences maximum. Be direct, specific, and use actual values from the context where relevant.`,
        add_context_from_previous_calls:false,
      });
      setAns(typeof raw === "string" ? raw : raw?.content || "No response");
    } catch { setAns("Consult unavailable. Please contact clinical pharmacist or specialist."); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
        {QUICK.map(prompt => (
          <button key={prompt} onClick={() => setQ(prompt)} style={{
            fontFamily:"DM Sans", fontSize:10, fontWeight:500, padding:"4px 10px",
            borderRadius:20, cursor:"pointer", border:`1px solid ${T.teal}28`,
            background:`${T.teal}07`, color:T.txt3,
          }}>{prompt}</button>
        ))}
      </div>
      <textarea value={q} onChange={e => setQ(e.target.value)} rows={3}
        placeholder="Ask any clinical question — patient context is included automatically..."
        style={{
          background:"rgba(14,37,68,0.8)", border:`1px solid ${q ? T.teal+"45" : "rgba(42,79,122,0.4)"}`,
          borderRadius:10, padding:"10px 12px", fontFamily:"DM Sans", fontSize:12,
          color:T.txt, outline:"none", width:"100%", resize:"none", lineHeight:1.55,
        }}
      />
      <button onClick={ask} disabled={!q.trim() || busy} style={{
        fontFamily:"DM Sans", fontWeight:700, fontSize:13, padding:"10px",
        borderRadius:9, cursor:q.trim() && !busy ? "pointer" : "not-allowed",
        border:`1px solid ${T.teal}40`, background:`${T.teal}10`, color:T.teal,
        opacity:!q.trim() || busy ? .5 : 1,
      }}>{busy ? "Consulting..." : "Ask"}</button>
      {busy && <div style={{ display:"flex", gap:8, alignItems:"center" }}><ThinkDots/><span style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4 }}>Thinking...</span></div>}
      {ans && !busy && (
        <div className={`${PREFIX}-fade`} style={{ ...glass, padding:14, borderLeft:`3px solid ${T.teal}`, background:`${T.teal}06`, fontFamily:"DM Sans", fontSize:13, color:T.txt, lineHeight:1.7 }}>
          {ans}
        </div>
      )}
    </div>
  );
}