import { useState, useEffect } from "react";
import { toast } from "sonner";
import { NURSING_ROLES, NURSING_IVX } from "@/components/npi/npiData";

export default function NursingPanel({
  open, onClose,
  vitals, setVitals, addVitalsSnapshot,
  esiLevel, setEsiLevel, triage, setTriage,
  nursingInterventions, setNursingInterventions,
  nursingNotes, setNursingNotes,
  patientName, demo,
}) {
  const [activeTab,  setActiveTab]  = useState("vitals");
  const [nurseRole,  setNurseRole]  = useState("RN");
  const [nurseName,  setNurseName]  = useState("");
  const [vIn,        setVIn]        = useState({ bp:"", hr:"", rr:"", spo2:"", temp:"", pain:"", avpu:"", o2del:"" });
  const [triageNote, setTriageNote] = useState("");
  const [esiIn,      setEsiIn]      = useState(esiLevel || "");
  const [selIvx,     setSelIvx]     = useState(new Set());
  const [customIvx,  setCustomIvx]  = useState("");
  const [noteText,   setNoteText]   = useState("");

  useEffect(() => { setEsiIn(esiLevel || ""); }, [esiLevel]);

  const tsStr = () => new Date().toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit", hour12:true });
  const byLine = () => (nurseName ? nurseName + " \xb7 " : "") + nurseRole;

  function logVitals() {
    const v = vIn;
    if (!v.bp && !v.hr && !v.rr && !v.spo2 && !v.temp) return;
    const mergedVitals = {
      bp:   v.bp   || vitals.bp   || "",
      hr:   v.hr   || vitals.hr   || "",
      rr:   v.rr   || vitals.rr   || "",
      spo2: v.spo2 || vitals.spo2 || "",
      temp: v.temp || vitals.temp || "",
    };
    setVitals(prev => ({
      ...prev,
      ...(v.bp   ? { bp:v.bp }     : {}),
      ...(v.hr   ? { hr:v.hr }     : {}),
      ...(v.rr   ? { rr:v.rr }     : {}),
      ...(v.spo2 ? { spo2:v.spo2 } : {}),
      ...(v.temp ? { temp:v.temp } : {}),
    }));
    addVitalsSnapshot(`${nurseRole} \u2013 ${tsStr()}`, mergedVitals);
    if (esiIn && esiIn !== esiLevel) setEsiLevel(esiIn);
    if (triageNote.trim()) {
      const stamp = `[${tsStr()} \u2014 ${byLine()}]`;
      setTriage(prev => prev ? `${prev}\n\n${stamp}\n${triageNote.trim()}` : `${stamp}\n${triageNote.trim()}`);
    }
    const entry = { id:Date.now(), type:"vitals", author:byLine(), ts:Date.now(),
      vitals:{ ...v }, esi:esiIn, note:triageNote.trim() };
    setNursingInterventions(p => [entry, ...p]);
    setVIn({ bp:"", hr:"", rr:"", spo2:"", temp:"", pain:"", avpu:"", o2del:"" });
    setTriageNote("");
    toast.success(`${nurseRole} vitals logged${esiIn ? " \u00b7 ESI " + esiIn : ""}`);
  }

  function logInterventions() {
    const items = [...selIvx, ...(customIvx.trim() ? [customIvx.trim()] : [])];
    if (!items.length) return;
    const entry = { id:Date.now(), type:"intervention", author:byLine(), ts:Date.now(), items };
    setNursingInterventions(p => [entry, ...p]);
    setSelIvx(new Set()); setCustomIvx("");
    toast.success(`${items.length} intervention${items.length > 1 ? "s" : ""} logged`);
  }

  function logNote() {
    if (!noteText.trim()) return;
    const entry = { id:Date.now(), type:"note", author:byLine(), ts:Date.now(), text:noteText.trim() };
    setNursingNotes(p => [entry, ...p]);
    setNoteText("");
    toast.success("Nursing note added to chart");
  }

  function toggleIvx(item) {
    setSelIvx(prev => { const n = new Set(prev); n.has(item) ? n.delete(item) : n.add(item); return n; });
  }

  const elapsed = ms => {
    const m = Math.floor((Date.now() - ms) / 60000);
    return m < 1 ? "just now" : m < 60 ? `${m}m ago` : `${Math.floor(m/60)}h ${m%60}m ago`;
  };

  const allEntries = [...nursingInterventions, ...nursingNotes].sort((a,b) => b.ts - a.ts).slice(0, 20);
  const TABS = [
    { id:"vitals",        label:"Vitals",       icon:"📈" },
    { id:"interventions", label:"Actions",       icon:"💉" },
    { id:"notes",         label:"Notes",         icon:"📝" },
    { id:"log",           label:"Log",           icon:"🕐", badge: allEntries.length },
  ];

  const fieldBase = { background:"rgba(8,24,48,0.75)", border:"1px solid rgba(26,53,85,0.55)",
    borderRadius:7, padding:"7px 10px", color:"var(--npi-txt)",
    fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none", boxSizing:"border-box" };
  const labelBase = { fontFamily:"'JetBrains Mono',monospace", fontSize:8,
    color:"var(--npi-txt4)", letterSpacing:.8, textTransform:"uppercase", marginBottom:4 };

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:9982,
        background:"rgba(2,8,18,0.4)", backdropFilter:"blur(2px)" }} />

      <div style={{ position:"fixed", top:0, right:0, bottom:0, width:400, zIndex:9983,
        background:"#060f20", borderLeft:"1px solid rgba(26,53,85,0.7)",
        display:"flex", flexDirection:"column", boxShadow:"-10px 0 44px rgba(0,0,0,0.65)" }}>

        {/* ── Header ── */}
        <div style={{ padding:"12px 16px 10px", borderBottom:"1px solid rgba(26,53,85,0.5)",
          background:"rgba(5,14,28,0.95)", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:16 }}>💉</span>
              <div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
                  fontSize:14, color:"var(--npi-txt)" }}>Nursing Input</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"var(--npi-txt4)", marginTop:1 }}>
                  {patientName}{demo.age ? ` \xb7 ${demo.age}y` : ""}{demo.sex ? ` \xb7 ${demo.sex}` : ""}
                </div>
              </div>
            </div>
            <button onClick={onClose}
              style={{ width:26, height:26, borderRadius:13, border:"1px solid rgba(42,77,114,0.5)",
                background:"rgba(14,37,68,0.7)", color:"var(--npi-txt4)", fontSize:12,
                cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              \u2715
            </button>
          </div>

          {/* Role selector + name */}
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            <div style={{ display:"flex", background:"rgba(8,22,46,0.9)",
              border:"1px solid rgba(26,53,85,0.5)", borderRadius:7, overflow:"hidden", flexShrink:0 }}>
              {NURSING_ROLES.map(r => (
                <button key={r} onClick={() => setNurseRole(r)}
                  style={{ padding:"4px 9px", border:"none", cursor:"pointer",
                    fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:.5,
                    background: nurseRole===r ? "rgba(0,229,192,0.15)" : "transparent",
                    color: nurseRole===r ? "var(--npi-teal)" : "var(--npi-txt4)",
                    transition:"all .12s" }}>
                  {r}
                </button>
              ))}
            </div>
            <input value={nurseName} onChange={e => setNurseName(e.target.value)}
              placeholder="Name (optional)"
              style={{ flex:1, background:"rgba(8,24,48,0.7)", border:"1px solid rgba(26,53,85,0.45)",
                borderRadius:7, padding:"5px 9px", color:"var(--npi-txt)",
                fontFamily:"'DM Sans',sans-serif", fontSize:11, outline:"none" }} />
          </div>
        </div>

        {/* ── Sub-tab bar ── */}
        <div style={{ display:"flex", borderBottom:"1px solid rgba(26,53,85,0.45)",
          background:"rgba(5,12,24,0.7)", flexShrink:0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ flex:1, padding:"8px 4px", border:"none", cursor:"pointer",
                borderBottom: activeTab===t.id ? "2px solid var(--npi-teal)" : "2px solid transparent",
                background:"transparent",
                fontFamily:"'DM Sans',sans-serif", fontSize:11,
                fontWeight: activeTab===t.id ? 700 : 400,
                color: activeTab===t.id ? "var(--npi-teal)" : "var(--npi-txt4)",
                display:"flex", flexDirection:"column", alignItems:"center", gap:2,
                position:"relative", transition:"all .12s" }}>
              <span style={{ fontSize:13 }}>{t.icon}</span>
              <span>{t.label}</span>
              {t.badge > 0 && (
                <span style={{ position:"absolute", top:4, right:"16%", minWidth:14, height:14,
                  borderRadius:7, background:"var(--npi-teal)", color:"#050f1e",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                  display:"flex", alignItems:"center", justifyContent:"center", padding:"0 3px" }}>
                  {t.badge > 9 ? "9+" : t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div style={{ flex:1, overflowY:"auto", padding:"14px 16px" }}>

          {/* ──── VITALS ──── */}
          {activeTab === "vitals" && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                color:"var(--npi-txt4)", letterSpacing:1.5, textTransform:"uppercase" }}>
                Vital Signs
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[
                  { k:"bp",   lbl:"BP (sys/dia)",   ph:"120/80" },
                  { k:"hr",   lbl:"HR (bpm)",        ph:"72"     },
                  { k:"rr",   lbl:"RR (/min)",       ph:"16"     },
                  { k:"spo2", lbl:"SpO\u2082 (%)",   ph:"98"     },
                  { k:"temp", lbl:"Temp (\xb0C/\xb0F)", ph:"98.6" },
                  { k:"o2del",lbl:"O\u2082 Delivery", ph:"RA / NC 2L" },
                ].map(f => (
                  <div key={f.k}>
                    <div style={labelBase}>{f.lbl}</div>
                    <input value={vIn[f.k]} onChange={e => setVIn(p => ({ ...p, [f.k]:e.target.value }))}
                      placeholder={f.ph} style={{ ...fieldBase, width:"100%" }} />
                  </div>
                ))}
              </div>

              {/* AVPU */}
              <div>
                <div style={labelBase}>AVPU</div>
                <div style={{ display:"flex", gap:5 }}>
                  {["Alert","Verbal","Pain","Unresponsive"].map(v => {
                    const active = vIn.avpu === v;
                    return (
                      <button key={v} onClick={() => setVIn(p => ({ ...p, avpu: active ? "" : v }))}
                        style={{ flex:1, padding:"6px 2px", borderRadius:6, cursor:"pointer",
                          border:`1px solid ${active ? "rgba(59,158,255,0.55)" : "rgba(42,77,114,0.4)"}`,
                          background: active ? "rgba(59,158,255,0.1)" : "transparent",
                          color: active ? "#3b9eff" : "var(--npi-txt4)",
                          fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight: active ? 700 : 400 }}>
                        {v.slice(0,1)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pain */}
              <div>
                <div style={labelBase}>Pain Score (0\u201310)</div>
                <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                  {Array.from({length:11},(_,i)=>i).map(i => {
                    const col = i<=3?"#00e5c0":i<=6?"#f5c842":"#ff6b6b";
                    const act = vIn.pain === String(i);
                    return (
                      <button key={i} onClick={() => setVIn(p => ({ ...p, pain: act ? "" : String(i) }))}
                        style={{ width:28, height:28, borderRadius:6, cursor:"pointer",
                          border:`1px solid ${act ? col+"88" : "rgba(42,77,114,0.35)"}`,
                          background: act ? col+"18" : "transparent",
                          color: act ? col : "var(--npi-txt3)",
                          fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight: act ? 700 : 400 }}>
                        {i}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ESI */}
              <div>
                <div style={labelBase}>ESI Level</div>
                <div style={{ display:"flex", gap:5 }}>
                  {[1,2,3,4,5].map(n => {
                    const col = n<=2?"#ff6b6b":n===3?"#f5c842":"#00e5c0";
                    const act = esiIn === String(n);
                    return (
                      <button key={n} onClick={() => setEsiIn(act ? "" : String(n))}
                        style={{ flex:1, padding:"7px 2px", borderRadius:7, cursor:"pointer",
                          border:`2px solid ${act ? col : "rgba(42,77,114,0.4)"}`,
                          background: act ? col+"18" : "rgba(14,37,68,0.5)",
                          color: act ? col : "var(--npi-txt3)",
                          fontFamily:"'JetBrains Mono',monospace", fontSize:17, fontWeight:700 }}>
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Triage note */}
              <div>
                <div style={labelBase}>Triage Note (appends to chart)</div>
                <textarea value={triageNote} onChange={e => setTriageNote(e.target.value)} rows={3}
                  placeholder="Presenting complaint, initial appearance, concerns..."
                  style={{ ...fieldBase, width:"100%", resize:"none", lineHeight:1.55 }} />
              </div>

              <button onClick={logVitals}
                style={{ padding:"10px 18px", borderRadius:9,
                  background:"linear-gradient(135deg,#00e5c0,#00b4d8)", border:"none",
                  color:"#050f1e", fontFamily:"'DM Sans',sans-serif",
                  fontWeight:700, fontSize:13, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                \u2713 Log Vitals to Chart
              </button>
            </div>
          )}

          {/* ──── INTERVENTIONS ──── */}
          {activeTab === "interventions" && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                color:"var(--npi-txt4)", letterSpacing:1.5, textTransform:"uppercase" }}>
                Select Interventions Performed
              </div>

              {NURSING_IVX.map(cat => (
                <div key={cat.cat}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    color:cat.col, letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>
                    {cat.cat}
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                    {cat.items.map(item => {
                      const sel = selIvx.has(item);
                      return (
                        <button key={item} onClick={() => toggleIvx(item)}
                          style={{ padding:"4px 10px", borderRadius:20, cursor:"pointer",
                            fontFamily:"'DM Sans',sans-serif", fontSize:11,
                            fontWeight: sel ? 600 : 400,
                            border:`1px solid ${sel ? cat.col+"88" : "rgba(42,77,114,0.4)"}`,
                            background: sel ? cat.col+"18" : "transparent",
                            color: sel ? cat.col : "var(--npi-txt3)",
                            transition:"all .12s" }}>
                          {sel ? "\u2713 " : ""}{item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div>
                <div style={labelBase}>Custom / Medication Given</div>
                <input value={customIvx} onChange={e => setCustomIvx(e.target.value)}
                  placeholder="e.g. Morphine 4mg IV, Zofran 4mg IV given"
                  style={{ ...fieldBase, width:"100%" }} />
              </div>

              {(selIvx.size > 0 || customIvx.trim()) && (
                <div style={{ padding:"7px 12px", borderRadius:7,
                  background:"rgba(0,229,192,0.06)", border:"1px solid rgba(0,229,192,0.2)",
                  fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--npi-teal)" }}>
                  {selIvx.size + (customIvx.trim() ? 1 : 0)} item{(selIvx.size+(customIvx.trim()?1:0)) > 1 ? "s" : ""} selected
                </div>
              )}

              <button onClick={logInterventions}
                disabled={selIvx.size === 0 && !customIvx.trim()}
                style={{ padding:"10px 18px", borderRadius:9,
                  background: (selIvx.size > 0 || customIvx.trim()) ? "linear-gradient(135deg,#00e5c0,#00b4d8)" : "transparent",
                  border: (selIvx.size > 0 || customIvx.trim()) ? "none" : "1px solid rgba(42,77,114,0.3)",
                  color: (selIvx.size > 0 || customIvx.trim()) ? "#050f1e" : "var(--npi-txt4)",
                  fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:13,
                  cursor: (selIvx.size > 0 || customIvx.trim()) ? "pointer" : "default",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                \u2713 Log Interventions
              </button>
            </div>
          )}

          {/* ──── NOTES ──── */}
          {activeTab === "notes" && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                color:"var(--npi-txt4)", letterSpacing:1.5, textTransform:"uppercase" }}>
                Nursing Note
              </div>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={9}
                placeholder="Assessment, response to treatment, family communication, patient education, observations, concerns..."
                style={{ ...fieldBase, width:"100%", resize:"vertical", lineHeight:1.6 }} />
              <button onClick={logNote} disabled={!noteText.trim()}
                style={{ padding:"10px 18px", borderRadius:9,
                  background: noteText.trim() ? "linear-gradient(135deg,#00e5c0,#00b4d8)" : "transparent",
                  border: noteText.trim() ? "none" : "1px solid rgba(42,77,114,0.3)",
                  color: noteText.trim() ? "#050f1e" : "var(--npi-txt4)",
                  fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:13,
                  cursor: noteText.trim() ? "pointer" : "default" }}>
                \u2713 Add Note to Chart
              </button>
              {nursingNotes.length > 0 && (
                <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:4 }}>
                  <div style={labelBase}>Prior Notes This Encounter</div>
                  {nursingNotes.map(n => (
                    <div key={n.id} style={{ padding:"9px 11px", borderRadius:8,
                      background:"rgba(14,37,68,0.7)", border:"1px solid rgba(26,53,85,0.4)" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                          color:"var(--npi-teal)" }}>{n.author}</span>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                          color:"var(--npi-txt4)" }}>{elapsed(n.ts)}</span>
                      </div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                        color:"var(--npi-txt2)", lineHeight:1.6 }}>{n.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ──── LOG ──── */}
          {activeTab === "log" && (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                color:"var(--npi-txt4)", letterSpacing:1.5, textTransform:"uppercase" }}>
                Nursing Activity Log
              </div>
              {allEntries.length === 0 ? (
                <div style={{ textAlign:"center", color:"var(--npi-txt4)",
                  fontFamily:"'DM Sans',sans-serif", fontSize:12, padding:"28px 0", fontStyle:"italic" }}>
                  No nursing entries yet
                </div>
              ) : allEntries.map(entry => {
                const typeCol = entry.type==="vitals" ? "#3b9eff" : entry.type==="note" ? "#00e5c0" : "#f5c842";
                const typeIcon = entry.type==="vitals" ? "📈" : entry.type==="note" ? "📝" : "💉";
                return (
                  <div key={entry.id} style={{ padding:"10px 12px", borderRadius:9,
                    background:"rgba(14,37,68,0.7)",
                    border:`1px solid ${typeCol}22`,
                    borderLeft:`3px solid ${typeCol}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <span style={{ fontSize:12 }}>{typeIcon}</span>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                          color:typeCol, letterSpacing:.5, textTransform:"uppercase" }}>
                          {entry.type}
                        </span>
                        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                          color:"var(--npi-txt4)" }}>{entry.author}</span>
                      </div>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                        color:"var(--npi-txt4)" }}>{elapsed(entry.ts)}</span>
                    </div>
                    {entry.type === "vitals" && (
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                        color:"var(--npi-txt3)", display:"flex", flexWrap:"wrap", gap:"3px 12px" }}>
                        {entry.vitals.bp   && <span>BP {entry.vitals.bp}</span>}
                        {entry.vitals.hr   && <span>HR {entry.vitals.hr}</span>}
                        {entry.vitals.rr   && <span>RR {entry.vitals.rr}</span>}
                        {entry.vitals.spo2 && <span>SpO2 {entry.vitals.spo2}%</span>}
                        {entry.vitals.temp && <span>T {entry.vitals.temp}</span>}
                        {entry.vitals.pain && <span>Pain {entry.vitals.pain}/10</span>}
                        {entry.vitals.avpu && <span>AVPU:{entry.vitals.avpu.slice(0,1)}</span>}
                        {entry.esi         && <span style={{ color:"#f5c842" }}>ESI {entry.esi}</span>}
                        {entry.note && (
                          <div style={{ width:"100%", marginTop:4, fontFamily:"'DM Sans',sans-serif",
                            fontSize:11, color:"var(--npi-txt3)", lineHeight:1.5 }}>
                            {entry.note.slice(0,100)}{entry.note.length>100?"\u2026":""}
                          </div>
                        )}
                      </div>
                    )}
                    {entry.type === "intervention" && (
                      <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                        {entry.items.map(item => (
                          <span key={item} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                            padding:"2px 7px", borderRadius:3,
                            background:"rgba(245,200,66,0.08)",
                            border:"1px solid rgba(245,200,66,0.2)", color:"#f5c842" }}>
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                    {entry.type === "note" && (
                      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                        color:"var(--npi-txt3)", lineHeight:1.55 }}>
                        {entry.text.slice(0,140)}{entry.text.length>140?"\u2026":""}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}