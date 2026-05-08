// QuickNoteAbnormals.jsx — P1: Abnormal-Only Results Extractor + P6: Manage → MDM
import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";

// ── Expanded lab normal-range ruleset ────────────────────────────────────────
const LAB_RULES = [
  { key:"K",       re:/\bK\+?\s*[:\-=]?\s*([0-9.]+)/i,                              label:"K+",            lo:3.5,  hi:5.0,   unit:"mEq/L"   },
  { key:"Na",      re:/\bNa\+?\s*[:\-=]?\s*([0-9.]+)/i,                             label:"Na+",           lo:136,  hi:145,   unit:"mEq/L"   },
  { key:"Cl",      re:/\bCl\s*[:\-=]?\s*([0-9.]+)/i,                                label:"Cl-",           lo:98,   hi:106,   unit:"mEq/L"   },
  { key:"CO2",     re:/\bCO2\s*[:\-=]?\s*([0-9.]+)/i,                               label:"Bicarb/CO2",    lo:22,   hi:29,    unit:"mEq/L"   },
  { key:"BUN",     re:/\bBUN\s*[:\-=]?\s*([0-9.]+)/i,                               label:"BUN",           lo:7,    hi:20,    unit:"mg/dL"   },
  { key:"Cr",      re:/\b(?:Cr|Creatinine)\s*[:\-=]?\s*([0-9.]+)/i,                 label:"Creatinine",    lo:0.6,  hi:1.2,   unit:"mg/dL"   },
  { key:"Gluc",    re:/\b(?:Glucose|Gluc)\s*[:\-=]?\s*([0-9.]+)/i,                  label:"Glucose",       lo:70,   hi:180,   unit:"mg/dL"   },
  { key:"Ca",      re:/\b(?:Ca|Calcium)\s*[:\-=]?\s*([0-9.]+)/i,                    label:"Calcium",       lo:8.5,  hi:10.5,  unit:"mg/dL"   },
  { key:"Mg",      re:/\b(?:Mg|Magnesium)\s*[:\-=]?\s*([0-9.]+)/i,                  label:"Magnesium",     lo:1.7,  hi:2.4,   unit:"mg/dL"   },
  { key:"Phos",    re:/\b(?:Phos|Phosphorus|Phosphate)\s*[:\-=]?\s*([0-9.]+)/i,     label:"Phosphorus",    lo:2.5,  hi:4.5,   unit:"mg/dL"   },
  { key:"WBC",     re:/\bWBC\s*[:\-=]?\s*([0-9.]+)/i,                               label:"WBC",           lo:4.5,  hi:11.0,  unit:"K/μL"    },
  { key:"Hgb",     re:/\b(?:Hgb|Hb|Hemoglobin)\s*[:\-=]?\s*([0-9.]+)/i,            label:"Hgb",           lo:12.0, hi:17.5,  unit:"g/dL"    },
  { key:"Hct",     re:/\b(?:Hct|Hematocrit)\s*[:\-=]?\s*([0-9.]+)/i,               label:"Hct",           lo:36,   hi:52,    unit:"%"       },
  { key:"Plt",     re:/\b(?:Plt|Platelets)\s*[:\-=]?\s*([0-9.]+)/i,                 label:"Platelets",     lo:150,  hi:400,   unit:"K/μL"    },
  { key:"Trop",    re:/\b(?:Troponin|TropI|TropT)\s*[:\-=]?\s*([0-9.]+)/i,          label:"Troponin",      lo:null, hi:0.04,  unit:"ng/mL"   },
  { key:"INR",     re:/\bINR\s*[:\-=]?\s*([0-9.]+)/i,                               label:"INR",           lo:null, hi:1.5,   unit:""        },
  { key:"PT",      re:/\bPT\s*[:\-=]?\s*([0-9.]+)/i,                                label:"PT",            lo:null, hi:14.5,  unit:"sec"     },
  { key:"PTT",     re:/\b(?:PTT|aPTT)\s*[:\-=]?\s*([0-9.]+)/i,                      label:"PTT",           lo:null, hi:40,    unit:"sec"     },
  { key:"Lac",     re:/\b(?:Lac|Lactate)\s*[:\-=]?\s*([0-9.]+)/i,                   label:"Lactate",       lo:null, hi:2.0,   unit:"mmol/L"  },
  { key:"pH",      re:/\bpH\s*[:\-=]?\s*([0-9.]+)/i,                                label:"pH",            lo:7.35, hi:7.45,  unit:""        },
  { key:"pCO2",    re:/\bpCO2\s*[:\-=]?\s*([0-9.]+)/i,                              label:"pCO2",          lo:35,   hi:45,    unit:"mmHg"    },
  { key:"pO2",     re:/\bpO2\s*[:\-=]?\s*([0-9.]+)/i,                               label:"pO2",           lo:80,   hi:100,   unit:"mmHg"    },
  { key:"ALT",     re:/\b(?:ALT|SGPT)\s*[:\-=]?\s*([0-9.]+)/i,                      label:"ALT",           lo:null, hi:56,    unit:"U/L"     },
  { key:"AST",     re:/\b(?:AST|SGOT)\s*[:\-=]?\s*([0-9.]+)/i,                      label:"AST",           lo:null, hi:40,    unit:"U/L"     },
  { key:"Bili",    re:/\b(?:Bili(?:rubin)?|TBili)\s*[:\-=]?\s*([0-9.]+)/i,          label:"Bilirubin",     lo:null, hi:1.2,   unit:"mg/dL"   },
  { key:"Alb",     re:/\b(?:Alb|Albumin)\s*[:\-=]?\s*([0-9.]+)/i,                   label:"Albumin",       lo:3.5,  hi:5.0,   unit:"g/dL"    },
  { key:"Lipase",  re:/\bLipase\s*[:\-=]?\s*([0-9.]+)/i,                            label:"Lipase",        lo:null, hi:160,   unit:"U/L"     },
  { key:"TSH",     re:/\bTSH\s*[:\-=]?\s*([0-9.]+)/i,                               label:"TSH",           lo:0.4,  hi:4.0,   unit:"mIU/L"   },
  { key:"BNP",     re:/\b(?:BNP|NT-proBNP|proBNP)\s*[:\-=]?\s*([0-9.]+)/i,         label:"BNP/NT-proBNP", lo:null, hi:100,   unit:"pg/mL"   },
  { key:"CRP",     re:/\b(?:CRP|C-Reactive)\s*[:\-=]?\s*([0-9.]+)/i,               label:"CRP",           lo:null, hi:1.0,   unit:"mg/dL"   },
  { key:"Ddimer",  re:/\bD-?[Dd]imer\s*[:\-=]?\s*([0-9.]+)/i,                       label:"D-dimer",       lo:null, hi:0.50,  unit:"μg/mL"   },
  { key:"PCT",     re:/\b(?:Procalcitonin|ProCalc|PCT)\s*[:\-=]?\s*([0-9.]+)/i,     label:"Procalcitonin", lo:null, hi:0.25,  unit:"ng/mL"   },
  { key:"Uric",    re:/\b(?:Uric Acid|UA)\s*[:\-=]?\s*([0-9.]+)/i,                  label:"Uric Acid",     lo:null, hi:7.0,   unit:"mg/dL"   },
  { key:"A1c",     re:/\b(?:HbA1c|A1c|HbA1C)\s*[:\-=]?\s*([0-9.]+)/i,              label:"HbA1c",         lo:null, hi:6.5,   unit:"%"       },
];

function getSeverity(val, lo, hi) {
  const overPct  = hi !== null && val > hi  ? (val - hi)  / hi  : null;
  const underPct = lo !== null && val < lo  ? (lo  - val) / lo  : null;
  const pct = overPct ?? underPct ?? 0;
  if (pct > 0.5) return { bg:"rgba(255,80,80,.14)", bd:"rgba(255,80,80,.5)",  txt:"#ff6b6b", label:"CRITICAL" };
  if (pct > 0.2) return { bg:"rgba(245,200,66,.11)", bd:"rgba(245,200,66,.45)", txt:"var(--qn-gold)", label:"HIGH" };
  return           { bg:"rgba(59,158,255,.09)",  bd:"rgba(59,158,255,.4)",  txt:"var(--qn-blue)", label:"MILD" };
}

// ── Main component ─────────────────────────────────────────────────────────
export function QuickNoteAbnormals({ labs, imaging, ekg, onAddToMDM }) {
  const [imgFindings,    setImgFindings]    = useState(null);
  const [imgBusy,        setImgBusy]        = useState(false);
  const [manageBusy,     setManageBusy]     = useState({});
  const [manageResults,  setManageResults]  = useState({});
  const [addedKeys,      setAddedKeys]      = useState({});

  // ── Parse lab abnormals synchronously ────────────────────────────────────
  const labAbnormals = useMemo(() => {
    if (!labs) return [];
    const found = [];
    LAB_RULES.forEach(rule => {
      const m = labs.match(rule.re);
      if (!m) return;
      const val = parseFloat(m[1]);
      if (isNaN(val)) return;
      const { lo, hi } = rule;
      if ((lo !== null && val < lo) || (hi !== null && val > hi)) {
        const dir    = hi !== null && val > hi ? "H" : "L";
        const sev    = getSeverity(val, lo, hi);
        const range  = [lo !== null ? lo : "", hi !== null ? hi : ""].filter(Boolean).join("–");
        found.push({ key:rule.key, label:rule.label, val, unit:rule.unit, dir, sev, range });
      }
    });
    return found;
  }, [labs]);

  // ── Extract imaging findings (AI) ─────────────────────────────────────────
  const extractImaging = async () => {
    if (!imaging || imgBusy) return;
    setImgBusy(true);
    try {
      const schema = {
        type:"object",
        required:["primary_finding","incidental","follow_up","normal_summary"],
        properties:{
          primary_finding: { type:"string" },
          incidental:      { type:"array", items:{ type:"string" } },
          follow_up:       { type:"string" },
          normal_summary:  { type:"string" },
        },
      };
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`You are a radiologist summarizing a report for an ED physician. Extract ONLY clinically actionable findings.

IMAGING REPORT:
${imaging}

Rules:
- primary_finding: 1 sentence — the main abnormal finding, or "No acute findings" if normal.
- incidental: Array of incidental/secondary abnormals. Empty array if none.
- follow_up: Recommended follow-up from the report (1 sentence). Empty string if none stated.
- normal_summary: A brief phrase (<15 words) summarizing what was explicitly confirmed normal.

Do NOT list normal structures. Surface only abnormals and recommended actions.`,
        response_json_schema: schema,
      });
      setImgFindings(res);
    } catch(e) { console.error("Imaging extract failed:", e); }
    finally { setImgBusy(false); }
  };

  // ── Manage → MDM per abnormal (AI) ──────────────────────────────────────
  const handleManage = async (ab) => {
    const key = ab.key;
    if (manageBusy[key]) return;
    setManageBusy(p => ({ ...p, [key]:true }));
    try {
      const schema = {
        type:"object", required:["sentence"],
        properties:{ sentence:{ type:"string" } },
      };
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:`Write a single medicolegally defensible MDM sentence for this lab abnormality.

ABNORMAL: ${ab.label} = ${ab.val} ${ab.unit} (reference: ${ab.range} ${ab.unit}; ${ab.dir === "H" ? "elevated" : "low"})

Requirements:
- First-person, past tense ("Patient's K+ was elevated at...")
- State the value, clinical context, action taken, and guideline basis if standard of care
- 40-70 words maximum — complete, standalone, paste-ready for EMR MDM field
- Reference specific guideline or evidence base where applicable (KDIGO, AHA/ACC, ADA, etc.)`,
        response_json_schema: schema,
      });
      const text = res?.sentence?.trim();
      if (text) setManageResults(p => ({ ...p, [key]:text }));
    } catch(e) { console.error("Manage failed:", e); }
    finally { setManageBusy(p => ({ ...p, [key]:false })); }
  };

  const addToMDM = (text, key) => {
    onAddToMDM?.(text);
    setAddedKeys(p => ({ ...p, [key]:true }));
  };

  if (!labs && !imaging && !ekg) return null;

  // ── Styles ────────────────────────────────────────────────────────────────
  const s = {
    wrap:     { marginBottom:12, borderRadius:12, border:"1px solid rgba(0,229,192,.22)", background:"rgba(0,229,192,.025)", overflow:"hidden" },
    hdr:      { display:"flex", alignItems:"center", gap:8, padding:"8px 14px", borderBottom:"1px solid rgba(0,229,192,.14)" },
    hdrTitle: { fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700, color:"var(--qn-teal)" },
    badge:    (txt,bg,bd) => ({ fontFamily:"'JetBrains Mono',monospace", fontSize:7, fontWeight:700, letterSpacing:.8, padding:"2px 7px", borderRadius:4, background:bg, border:`1px solid ${bd}`, color:txt }),
    body:     { padding:"10px 14px", display:"flex", flexDirection:"column", gap:12 },
    secLbl:   { fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:"var(--qn-txt4)", letterSpacing:1.2, textTransform:"uppercase", marginBottom:6 },
    grid:     { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(195px,1fr))", gap:8 },
    labCard:  (sev) => ({ background:sev.bg, border:`1px solid ${sev.bd}`, borderRadius:8, padding:"8px 10px" }),
    labTop:   { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:3 },
    labLbl:   { fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700, color:"var(--qn-txt1)" },
    dirBadge: (sev) => ({ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:sev.txt, background:sev.bg, border:`1px solid ${sev.bd}`, borderRadius:4, padding:"1px 6px" }),
    labVal:   (sev) => ({ fontFamily:"'JetBrains Mono',monospace", fontSize:15, fontWeight:700, color:sev.txt }),
    labUnit:  { fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--qn-txt4)", marginLeft:4 },
    labRef:   { fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--qn-txt4)", marginTop:1 },
    manageBtn:(loading) => ({
      marginTop:7, padding:"3px 10px", borderRadius:6, cursor:loading?"not-allowed":"pointer",
      fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, letterSpacing:.5,
      border:`1px solid ${loading?"rgba(42,79,122,.3)":"rgba(0,229,192,.4)"}`,
      background:loading?"rgba(14,37,68,.4)":"rgba(0,229,192,.07)",
      color:loading?"var(--qn-txt4)":"var(--qn-teal)", transition:"all .14s",
    }),
    addBtn: (added) => ({
      padding:"3px 10px", borderRadius:6, cursor:added?"default":"pointer",
      fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, letterSpacing:.5,
      border:`1px solid ${added?"rgba(61,255,160,.4)":"rgba(245,200,66,.4)"}`,
      background:added?"rgba(61,255,160,.07)":"rgba(245,200,66,.07)",
      color:added?"var(--qn-green)":"var(--qn-gold)", transition:"all .14s",
    }),
    managedBox: { marginTop:6, padding:"7px 9px", borderRadius:6, background:"rgba(14,37,68,.45)", border:"1px solid rgba(42,79,122,.3)", fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--qn-txt2)", lineHeight:1.5 },
    managedRow: { display:"flex", gap:7, marginTop:6 },
    imgBlock: { borderRadius:8, padding:"10px 12px", background:"rgba(155,109,255,.05)", border:"1px solid rgba(155,109,255,.22)" },
    imgLbl:   { fontFamily:"'JetBrains Mono',monospace", fontSize:7, fontWeight:700, letterSpacing:.8, textTransform:"uppercase", color:"var(--qn-purple)", marginBottom:4 },
    imgTxt:   { fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"var(--qn-txt1)", lineHeight:1.5 },
    imgSub:   { fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--qn-txt3)", lineHeight:1.4, marginTop:2 },
    normalNote:{ marginTop:7, padding:"5px 9px", borderRadius:6, background:"rgba(14,37,68,.3)", border:"1px solid rgba(42,79,122,.22)", fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--qn-txt4)" },
    extractBtn:(loading) => ({
      padding:"5px 14px", borderRadius:7, cursor:loading?"not-allowed":"pointer",
      fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, letterSpacing:.5,
      border:`1px solid ${loading?"rgba(42,79,122,.3)":"rgba(155,109,255,.4)"}`,
      background:loading?"rgba(14,37,68,.4)":"rgba(155,109,255,.08)",
      color:loading?"var(--qn-txt4)":"var(--qn-purple)", transition:"all .14s",
    }),
    ekgBlock: { padding:"8px 10px", borderRadius:8, background:"rgba(245,200,66,.05)", border:"1px solid rgba(245,200,66,.2)" },
    eRow:     { display:"flex", alignItems:"center", gap:8 },
    smallBtn: { padding:"3px 8px", borderRadius:5, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:8, border:"1px solid rgba(42,79,122,.3)", background:"transparent", color:"var(--qn-txt4)", transition:"all .14s" },
  };

  return (
    <div style={s.wrap}>
      <div style={s.hdr}>
        <span style={s.hdrTitle}>Pertinent Abnormals</span>
        {labAbnormals.length > 0 && (
          <span style={s.badge("#ff6b6b", "rgba(255,80,80,.12)", "rgba(255,80,80,.35)")}>
            {labAbnormals.length} ABNORMAL{labAbnormals.length > 1 ? "S" : ""}
          </span>
        )}
        <span style={s.badge("var(--qn-txt4)", "rgba(0,229,192,.08)", "rgba(0,229,192,.18)")}>
          Normal findings suppressed
        </span>
      </div>
      <div style={s.body}>

        {/* ── Lab abnormals ─────────────────────────────────────────────── */}
        {labs && (
          <div>
            <div style={s.secLbl}>Lab abnormals</div>
            {labAbnormals.length === 0 ? (
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"var(--qn-txt3)", fontStyle:"italic" }}>
                No abnormals detected by pattern matching — review raw values above.
              </div>
            ) : (
              <div style={s.grid}>
                {labAbnormals.map(ab => (
                  <div key={ab.key} style={s.labCard(ab.sev)}>
                    <div style={s.labTop}>
                      <span style={s.labLbl}>{ab.label}</span>
                      <span style={s.dirBadge(ab.sev)}>{ab.dir} {ab.sev.label}</span>
                    </div>
                    <div style={{ display:"flex", alignItems:"baseline" }}>
                      <span style={s.labVal(ab.sev)}>{ab.val}</span>
                      <span style={s.labUnit}>{ab.unit}</span>
                    </div>
                    <div style={s.labRef}>Ref: {ab.range} {ab.unit}</div>

                    {manageResults[ab.key] ? (
                      <div style={s.managedBox}>
                        {manageResults[ab.key]}
                        {onAddToMDM && (
                          <div style={s.managedRow}>
                            <button
                              onClick={() => addToMDM(manageResults[ab.key], ab.key)}
                              disabled={addedKeys[ab.key]}
                              style={s.addBtn(addedKeys[ab.key])}>
                              {addedKeys[ab.key] ? "✓ Added" : "+ Add to MDM"}
                            </button>
                            <button onClick={() => setManageResults(p => { const n={...p}; delete n[ab.key]; return n; })} style={s.smallBtn}>
                              ↩
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleManage(ab)}
                        disabled={!!manageBusy[ab.key]}
                        style={s.manageBtn(manageBusy[ab.key])}>
                        {manageBusy[ab.key] ? "● Generating…" : "✦ Manage → MDM"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Imaging findings ───────────────────────────────────────────── */}
        {imaging && (
          <div>
            <div style={s.secLbl}>Imaging findings</div>
            {!imgFindings ? (
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <button onClick={extractImaging} disabled={imgBusy} style={s.extractBtn(imgBusy)}>
                  {imgBusy ? "● Extracting…" : "✦ Extract Pertinent Findings"}
                </button>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--qn-txt4)" }}>
                  AI strips normals · returns abnormals only
                </span>
              </div>
            ) : (
              <div style={s.imgBlock}>
                <div style={s.imgLbl}>Primary finding</div>
                <div style={s.imgTxt}>{imgFindings.primary_finding}</div>

                {imgFindings.incidental?.length > 0 && (
                  <>
                    <div style={{ ...s.imgLbl, marginTop:9 }}>Incidental / secondary</div>
                    {imgFindings.incidental.map((f,i) => (
                      <div key={i} style={s.imgSub}>• {f}</div>
                    ))}
                  </>
                )}

                {imgFindings.follow_up && (
                  <>
                    <div style={{ ...s.imgLbl, marginTop:9 }}>Follow-up recommendation</div>
                    <div style={s.imgSub}>{imgFindings.follow_up}</div>
                  </>
                )}

                {imgFindings.normal_summary && (
                  <div style={s.normalNote}>✓ Normal: {imgFindings.normal_summary}</div>
                )}

                <div style={{ display:"flex", gap:7, marginTop:9 }}>
                  {onAddToMDM && (
                    <button onClick={() => {
                      const txt = [
                        imgFindings.primary_finding,
                        ...(imgFindings.incidental||[]).map(f => "Incidental: "+f),
                        imgFindings.follow_up ? "Imaging follow-up: "+imgFindings.follow_up : "",
                      ].filter(Boolean).join(" ");
                      addToMDM(txt, "img");
                    }}
                    disabled={addedKeys["img"]}
                    style={s.addBtn(addedKeys["img"])}>
                      {addedKeys["img"] ? "✓ Added" : "+ Add Findings to MDM"}
                    </button>
                  )}
                  <button onClick={() => setImgFindings(null)} style={s.smallBtn}>↩ Re-extract</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── EKG ───────────────────────────────────────────────────────── */}
        {ekg && (
          <div>
            <div style={s.secLbl}>EKG interpretation</div>
            <div style={s.ekgBlock}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"var(--qn-txt2)", lineHeight:1.5 }}>
                {ekg}
              </div>
              {onAddToMDM && (
                <div style={{ marginTop:7 }}>
                  <button
                    onClick={() => addToMDM("EKG: " + ekg, "ekg")}
                    disabled={addedKeys["ekg"]}
                    style={s.addBtn(addedKeys["ekg"])}>
                    {addedKeys["ekg"] ? "✓ Added" : "+ Add EKG to MDM"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}