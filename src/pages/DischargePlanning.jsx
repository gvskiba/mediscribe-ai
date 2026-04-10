import { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

// ─── FONT INJECTION ───────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("dc-fonts")) return;
  const l = document.createElement("link");
  l.id = "dc-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600&display=swap";
  document.head.appendChild(l);
})();

// ─── TOKENS ───────────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36", up:"#0e2544",
  bd:"rgba(26,53,85,0.7)", bhi:"rgba(42,79,122,0.9)",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", orange:"#ff9f43",
  blue:"#3b9eff", green:"#3dffa0",
};

// ─── STATIC DATA ──────────────────────────────────────────────────────────────
const DISPOSITIONS = [
  { id:"discharge",  label:"Discharge Home",     icon:"🏠", color: T.teal   },
  { id:"ama",        label:"AMA",                icon:"⚠️", color: T.gold   },
  { id:"transfer",   label:"Transfer",           icon:"🚑", color: T.blue   },
  { id:"admit",      label:"Admit",              icon:"🏥", color: T.orange },
];

const CONDITIONS = [
  { id:"stable",   label:"Stable",   color: T.teal   },
  { id:"improved", label:"Improved", color: T.green  },
  { id:"guarded",  label:"Guarded",  color: T.gold   },
];

const PRECAUTIONS = [
  "Fever > 38.5°C (101.3°F)",
  "Chest pain or pressure",
  "Shortness of breath",
  "Worsening or uncontrolled pain",
  "Inability to tolerate food or fluids",
  "Persistent vomiting or diarrhea",
  "Confusion or altered mental status",
  "Near-fainting or loss of consciousness",
  "New or spreading redness / swelling",
  "No improvement within 24–48 hours",
];

const FOLLOWUP_SERVICES = [
  "Primary Care", "Cardiology", "Orthopedics", "Neurology",
  "Surgery", "Urology", "Ob/Gyn", "Psychiatry", "ENT",
  "Ophthalmology", "Pulmonology", "Hematology/Oncology",
];

const FOLLOWUP_TIMES = [
  "Within 24 hours", "24–48 hours", "3–5 days",
  "1 week", "2 weeks", "1 month", "As needed",
];

// ─── INLINE CSS ───────────────────────────────────────────────────────────────
const DC_CSS = `
.dc-wrap *{box-sizing:border-box;margin:0;padding:0;}
.dc-wrap{font-family:'DM Sans',sans-serif;background:${T.bg};color:${T.txt};min-height:100%;display:flex;flex-direction:column;}
.dc-header{padding:12px 20px 10px;background:${T.panel};border-bottom:1px solid ${T.bd};display:flex;align-items:center;gap:12px;flex-shrink:0;}
.dc-hdr-name{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:${T.txt};}
.dc-hdr-meta{font-family:'JetBrains Mono',monospace;font-size:10px;color:${T.txt4};display:flex;align-items:center;gap:8px;}
.dc-hdr-badge{background:rgba(0,229,192,0.08);border:1px solid rgba(0,229,192,0.22);border-radius:4px;padding:1px 8px;color:${T.teal};font-size:9px;font-weight:700;letter-spacing:.5px;}
.dc-body{display:grid;grid-template-columns:55% 45%;flex:1;overflow:hidden;}
.dc-left{padding:16px 18px;display:flex;flex-direction:column;gap:14px;overflow-y:auto;border-right:1px solid ${T.bd};}
.dc-right{padding:16px 18px;display:flex;flex-direction:column;gap:14px;overflow-y:auto;}
.dc-section-lbl{font-family:'JetBrains Mono',monospace;font-size:9px;color:${T.txt4};letter-spacing:1.5px;text-transform:uppercase;margin-bottom:7px;}
.dc-card{background:${T.card};border:1px solid ${T.bd};border-radius:10px;padding:13px 14px;}
.dc-card-teal{background:rgba(0,229,192,0.04);border:1px solid rgba(0,229,192,0.18);border-radius:10px;padding:13px 14px;}
.dc-chips{display:flex;gap:6px;flex-wrap:wrap;}
.dc-chip{display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:8px;border:1px solid ${T.bd};background:${T.up};cursor:pointer;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;color:${T.txt3};transition:all .12s;}
.dc-chip:hover{border-color:${T.bhi};color:${T.txt2};}
.dc-chip.active{font-weight:600;}
.dc-input{width:100%;background:rgba(8,24,48,0.7);border:1px solid ${T.bd};border-radius:8px;padding:8px 11px;color:${T.txt};font-family:'DM Sans',sans-serif;font-size:13px;outline:none;transition:border-color .18s;}
.dc-input:focus{border-color:rgba(0,229,192,0.4);}
.dc-ta{width:100%;background:rgba(8,24,48,0.7);border:1px solid ${T.bd};border-radius:8px;padding:9px 12px;color:${T.txt};font-family:'DM Sans',sans-serif;font-size:12.5px;line-height:1.7;resize:vertical;outline:none;transition:border-color .18s;min-height:120px;}
.dc-ta:focus{border-color:rgba(0,229,192,0.4);}
.dc-ai-btn{display:flex;align-items:center;gap:7px;padding:7px 14px;background:rgba(0,229,192,0.08);border:1px solid rgba(0,229,192,0.3);border-radius:7px;color:${T.teal};font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s;align-self:flex-start;}
.dc-ai-btn:hover:not(:disabled){background:rgba(0,229,192,0.15);}
.dc-ai-btn:disabled{opacity:.5;cursor:not-allowed;}
.dc-check-row{display:flex;align-items:flex-start;gap:9px;padding:5px 0;cursor:pointer;transition:opacity .12s;}
.dc-check-row:hover{opacity:.85;}
.dc-chk{width:15px;height:15px;border-radius:4px;border:1.5px solid rgba(122,160,192,0.5);flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;transition:all .12s;}
.dc-chk.on{background:${T.teal};border-color:${T.teal};}
.dc-check-lbl{font-size:12px;color:${T.txt3};line-height:1.4;}
.dc-fu-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.dc-select{width:100%;background:rgba(8,24,48,0.7);border:1px solid ${T.bd};border-radius:7px;padding:7px 10px;color:${T.txt};font-family:'DM Sans',sans-serif;font-size:12px;outline:none;cursor:pointer;}
.dc-select option{background:${T.panel};}
.dc-med-row{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(26,53,85,0.4);}
.dc-med-row:last-child{border-bottom:none;}
.dc-med-name{flex:1;font-size:12px;color:${T.txt2};}
.dc-med-badge{font-family:'JetBrains Mono',monospace;font-size:9px;padding:2px 7px;border-radius:20px;font-weight:700;white-space:nowrap;}
.dc-badge-cont{background:rgba(0,229,192,0.1);color:${T.teal};border:1px solid rgba(0,229,192,0.25);}
.dc-badge-stop{background:rgba(255,107,107,0.1);color:${T.coral};border:1px solid rgba(255,107,107,0.25);}
.dc-sign-btn{width:100%;padding:12px;background:${T.teal};color:${T.bg};border:none;border-radius:9px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:filter .15s;letter-spacing:.02em;}
.dc-sign-btn:hover:not(:disabled){filter:brightness(1.12);}
.dc-sign-btn:disabled{opacity:.5;cursor:not-allowed;}
.dc-sign-btn.signed{background:rgba(0,229,192,0.12);color:${T.teal};border:1px solid rgba(0,229,192,0.35);cursor:default;filter:none;}
.dc-custom-row{display:flex;gap:7px;margin-top:6px;}
.dc-allergy-pill{display:inline-flex;padding:2px 8px;border-radius:20px;font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;background:rgba(255,107,107,0.1);color:${T.coral};border:1px solid rgba(255,107,107,0.25);white-space:nowrap;}
.dc-nka{font-size:11px;color:${T.teal};font-family:'JetBrains Mono',monospace;}
`;

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function DischargePlanning({
  embedded = false,
  patientName = "New Patient",
  patientAge = "",
  patientSex = "",
  chiefComplaint = "",
  vitals = {},
  medications = [],
  allergies = [],
}) {
  const [disposition,   setDisposition]   = useState("discharge");
  const [condition,     setCondition]     = useState("stable");
  const [diagnosis,     setDiagnosis]     = useState("");
  const [instructions,  setInstructions]  = useState("");
  const [generating,    setGenerating]    = useState(false);
  const [checkedPrec,   setCheckedPrec]   = useState(new Set());
  const [customPrec,    setCustomPrec]    = useState("");
  const [extraPrecs,    setExtraPrecs]    = useState([]);
  const [fuService,     setFuService]     = useState("");
  const [fuTime,        setFuTime]        = useState("");
  const [fuNotes,       setFuNotes]       = useState("");
  const [medStatus,     setMedStatus]     = useState({});
  const [signed,        setSigned]        = useState(false);

  const togglePrec = useCallback((label) => {
    setCheckedPrec(prev => {
      const n = new Set(prev);
      n.has(label) ? n.delete(label) : n.add(label);
      return n;
    });
  }, []);

  const addCustomPrec = useCallback(() => {
    const t = customPrec.trim();
    if (!t) return;
    setExtraPrecs(prev => [...prev, t]);
    setCustomPrec("");
  }, [customPrec]);

  const toggleMed = useCallback((med) => {
    setMedStatus(prev => ({ ...prev, [med]: prev[med] === "stop" ? "cont" : "stop" }));
  }, []);

  const generateInstructions = useCallback(async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const dx = diagnosis || chiefComplaint || "unspecified";
      const disp = DISPOSITIONS.find(d => d.id === disposition)?.label || "Discharge";
      const cond = CONDITIONS.find(c => c.id === condition)?.label || "Stable";
      const allergiesStr = allergies.length ? allergies.join(", ") : "NKDA";
      const precList = [...checkedPrec, ...extraPrecs].join("; ") || "standard";

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an emergency medicine physician writing patient discharge instructions.
Patient: ${patientName}, ${patientAge || "unknown age"} ${patientSex || ""}.
Diagnosis: ${dx}. Condition: ${cond}. Disposition: ${disp}.
Allergies: ${allergiesStr}.
Return precautions selected: ${precList}.

Write clear, plain-language discharge instructions (no jargon). Include:
1. What happened / brief diagnosis explanation (1-2 sentences)
2. What to do at home (activity, diet, wound care if relevant)
3. Medications to take (if any)
4. When to return to the ED immediately

Keep it concise — 150-200 words total. Write directly to the patient ("You were seen...").`,
      });
      const text = typeof result === "string" ? result : JSON.stringify(result);
      setInstructions(text);
      toast.success("Instructions generated.");
    } catch {
      toast.error("Could not generate instructions.");
    } finally { setGenerating(false); }
  }, [generating, diagnosis, chiefComplaint, disposition, condition, patientName, patientAge, patientSex, allergies, checkedPrec, extraPrecs]);

  const handleSign = useCallback(async () => {
    if (!diagnosis.trim()) { toast.error("Please enter a working diagnosis before signing."); return; }
    if (!instructions.trim()) { toast.error("Please add discharge instructions before signing."); return; }
    setSigned(true);
    toast.success("Discharge note signed and finalized.");
  }, [diagnosis, instructions]);

  const activeDisp = DISPOSITIONS.find(d => d.id === disposition);
  const visibleMeds = medications.length > 0 ? medications : [];

  return (
    <div className="dc-wrap" style={{ height: embedded ? "100%" : "100vh" }}>
      <style>{DC_CSS}</style>

      {!embedded && (
        <div className="dc-header">
          <div>
            <div className="dc-hdr-name">{patientName}</div>
            <div className="dc-hdr-meta">
              {patientAge && <span>{patientAge}y {patientSex ? `· ${patientSex}` : ""}</span>}
              {chiefComplaint && <span>· {chiefComplaint}</span>}
            </div>
          </div>
          <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
            <span className="dc-hdr-badge">DISCHARGE PLANNING</span>
          </div>
        </div>
      )}

      <div className="dc-body">

        {/* ── LEFT: Disposition + Diagnosis + Instructions ────────────── */}
        <div className="dc-left">

          {/* Disposition */}
          <div>
            <div className="dc-section-lbl">Disposition</div>
            <div className="dc-chips">
              {DISPOSITIONS.map(d => (
                <button key={d.id} className={`dc-chip${disposition === d.id ? " active" : ""}`}
                  onClick={() => setDisposition(d.id)}
                  style={disposition === d.id ? { borderColor: d.color + "55", background: d.color + "14", color: d.color } : {}}>
                  <span style={{ fontSize:13 }}>{d.icon}</span>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Diagnosis + Condition */}
          <div>
            <div className="dc-section-lbl">Working Diagnosis</div>
            <input className="dc-input" placeholder="e.g. Acute appendicitis, Atrial fibrillation with RVR…"
              value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
          </div>

          <div>
            <div className="dc-section-lbl">Condition at Discharge</div>
            <div className="dc-chips">
              {CONDITIONS.map(c => (
                <button key={c.id} className={`dc-chip${condition === c.id ? " active" : ""}`}
                  onClick={() => setCondition(c.id)}
                  style={condition === c.id ? { borderColor: c.color + "55", background: c.color + "14", color: c.color } : {}}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Discharge Instructions */}
          <div style={{ display:"flex", flexDirection:"column", gap:7, flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div className="dc-section-lbl" style={{ marginBottom:0 }}>Discharge Instructions</div>
              <button className="dc-ai-btn" onClick={generateInstructions} disabled={generating || signed}>
                {generating
                  ? <><span style={{ fontSize:12 }}>⏳</span> Generating…</>
                  : <><span style={{ fontSize:11 }}>✦</span> AI Generate</>}
              </button>
            </div>
            <textarea className="dc-ta"
              placeholder="Write or generate discharge instructions for the patient…"
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              rows={8} disabled={signed}
              style={{ flex:1, minHeight:150 }} />
          </div>

          {/* Return Precautions */}
          <div>
            <div className="dc-section-lbl">Return Precautions</div>
            <div className="dc-card">
              {PRECAUTIONS.map(p => (
                <div key={p} className="dc-check-row" onClick={() => !signed && togglePrec(p)}>
                  <div className={`dc-chk${checkedPrec.has(p) ? " on" : ""}`}>
                    {checkedPrec.has(p) && <span style={{ color: T.bg, fontSize:9, fontWeight:800, lineHeight:1 }}>✓</span>}
                  </div>
                  <span className="dc-check-lbl">{p}</span>
                </div>
              ))}
              {extraPrecs.map((p, i) => (
                <div key={i} className="dc-check-row">
                  <div className="dc-chk on">
                    <span style={{ color: T.bg, fontSize:9, fontWeight:800, lineHeight:1 }}>✓</span>
                  </div>
                  <span className="dc-check-lbl" style={{ color: T.teal }}>{p}</span>
                </div>
              ))}
              {!signed && (
                <div className="dc-custom-row">
                  <input className="dc-input" style={{ fontSize:11 }}
                    placeholder="Add custom precaution…"
                    value={customPrec} onChange={e => setCustomPrec(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addCustomPrec()} />
                  <button className="dc-ai-btn" style={{ whiteSpace:"nowrap" }}
                    onClick={addCustomPrec}>+ Add</button>
                </div>
              )}
            </div>
          </div>

        </div>{/* end left */}

        {/* ── RIGHT: Meds + Allergies + Follow-up + CTA ───────────────── */}
        <div className="dc-right">

          {/* Allergies */}
          <div>
            <div className="dc-section-lbl">Allergies</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {allergies.length === 0
                ? <span className="dc-nka">✓ No Known Allergies</span>
                : allergies.map(a => <span key={a} className="dc-allergy-pill">⚠ {a}</span>)}
            </div>
          </div>

          {/* Medications at Discharge */}
          <div>
            <div className="dc-section-lbl">Medications — Discharge Status</div>
            <div className="dc-card">
              {visibleMeds.length === 0 ? (
                <div style={{ fontSize:11, color: T.txt4, fontStyle:"italic" }}>
                  No medications on record — add in Meds &amp; PMH
                </div>
              ) : visibleMeds.map((med, i) => {
                const stopped = medStatus[med] === "stop";
                return (
                  <div key={i} className="dc-med-row">
                    <span className="dc-med-name" style={{ textDecoration: stopped ? "line-through" : "none", opacity: stopped ? .55 : 1 }}>{med}</span>
                    {!signed && (
                      <button onClick={() => toggleMed(med)}
                        style={{ background:"none", border:"none", cursor:"pointer", padding:0 }}>
                        <span className={`dc-med-badge ${stopped ? "dc-badge-stop" : "dc-badge-cont"}`}>
                          {stopped ? "STOP" : "CONT"}
                        </span>
                      </button>
                    )}
                    {signed && (
                      <span className={`dc-med-badge ${stopped ? "dc-badge-stop" : "dc-badge-cont"}`}>
                        {stopped ? "STOP" : "CONT"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Follow-up */}
          <div>
            <div className="dc-section-lbl">Follow-up Appointment</div>
            <div className="dc-card-teal" style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <div className="dc-fu-row">
                <div>
                  <div style={{ fontSize:10, color: T.txt4, marginBottom:4 }}>Service</div>
                  <select className="dc-select" value={fuService}
                    onChange={e => setFuService(e.target.value)} disabled={signed}>
                    <option value="">— Select service —</option>
                    {FOLLOWUP_SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                    <option value="none">No follow-up needed</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize:10, color: T.txt4, marginBottom:4 }}>Timeframe</div>
                  <select className="dc-select" value={fuTime}
                    onChange={e => setFuTime(e.target.value)} disabled={signed}>
                    <option value="">— When —</option>
                    {FOLLOWUP_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <input className="dc-input" style={{ fontSize:11 }}
                placeholder="Additional notes (clinic name, phone, referral reason)…"
                value={fuNotes} onChange={e => setFuNotes(e.target.value)} disabled={signed} />
            </div>
          </div>

          {/* Discharge Summary card */}
          <div className="dc-card" style={{ display:"flex", flexDirection:"column", gap:7 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color: T.txt4, letterSpacing:1.5, textTransform:"uppercase", marginBottom:2 }}>Discharge Summary</div>
            {[
              { lbl:"Disposition",  val: activeDisp?.label, color: activeDisp?.color },
              { lbl:"Diagnosis",    val: diagnosis || "—" },
              { lbl:"Condition",    val: CONDITIONS.find(c => c.id === condition)?.label },
              { lbl:"Follow-up",    val: fuService ? `${fuService}${fuTime ? " — " + fuTime : ""}` : "—" },
              { lbl:"Precautions",  val: `${checkedPrec.size + extraPrecs.length} selected` },
            ].map(r => (
              <div key={r.lbl} style={{ display:"flex", alignItems:"baseline", gap:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color: T.txt4, width:80, flexShrink:0 }}>{r.lbl}</span>
                <span style={{ fontSize:12, color: r.color || T.txt2, fontWeight:500 }}>{r.val || "—"}</span>
              </div>
            ))}
          </div>

          {/* Sign CTA */}
          <div style={{ marginTop:"auto" }}>
            {signed ? (
              <button className="dc-sign-btn signed" disabled>
                ✓ Discharge Signed &amp; Finalized
              </button>
            ) : (
              <button className="dc-sign-btn" onClick={handleSign}>
                ✍ Sign &amp; Finalize Discharge
              </button>
            )}
            {!signed && (
              <div style={{ fontSize:10, color: T.txt4, textAlign:"center", marginTop:6, fontFamily:"'DM Sans',sans-serif" }}>
                Requires diagnosis and instructions before signing
              </div>
            )}
          </div>

        </div>{/* end right */}
      </div>{/* end body */}
    </div>
  );
}