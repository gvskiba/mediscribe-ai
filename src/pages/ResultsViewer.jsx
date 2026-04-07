import { useState, useCallback, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const PREFIX = "rv";

(() => {
  const id = `${PREFIX}-css`;
  if (document.getElementById(id)) return;
  const s = document.createElement("style");
  s.id = id;
  s.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;600;700&display=swap');
.rv-wrap{padding:18px 0;display:flex;flex-direction:column;gap:16px;font-family:'DM Sans',sans-serif;}
.rv-critical-banner{background:rgba(255,68,68,.08);border:1px solid rgba(255,68,68,.3);border-left:4px solid #ff4444;border-radius:0 10px 10px 0;padding:10px 14px;display:flex;align-items:flex-start;gap:10px;}
.rv-crit-icon{font-size:16px;flex-shrink:0;margin-top:1px;}
.rv-crit-title{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#ff4444;margin-bottom:5px;}
.rv-crit-list{display:flex;flex-direction:column;gap:4px;}
.rv-crit-item{font-family:'DM Sans',sans-serif;font-size:12px;color:#f2f7ff;display:flex;align-items:center;gap:8px;}
.rv-crit-val{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:#ff4444;}
.rv-tabs{display:flex;gap:2px;border-bottom:1px solid #1a3555;padding-bottom:0;}
.rv-tab{padding:8px 18px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;color:#5a82a8;background:none;border:none;cursor:pointer;border-bottom:2px solid transparent;transition:all .15s;position:relative;top:1px;white-space:nowrap;}
.rv-tab:hover{color:#b8d4f0;}
.rv-tab.active{color:#3b9eff;border-bottom-color:#3b9eff;font-weight:600;}
.rv-tab-count{display:inline-flex;align-items:center;justify-content:center;width:17px;height:17px;border-radius:50%;background:rgba(59,158,255,.15);color:#3b9eff;font-size:9px;font-weight:700;margin-left:5px;}
.rv-tab-count.crit{background:rgba(255,68,68,.15);color:#ff4444;}
.rv-card{background:rgba(8,22,40,.8);border:1px solid rgba(26,53,85,.5);border-radius:10px;overflow:hidden;}
.rv-card-hdr{padding:10px 14px;border-bottom:1px solid rgba(26,53,85,.4);display:flex;align-items:center;gap:8px;}
.rv-card-title{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#5a82a8;flex:1;}
.rv-card-meta{font-family:'JetBrains Mono',monospace;font-size:9px;color:#5a82a8;}
.rv-lab-hdr{display:grid;grid-template-columns:1.6fr .8fr 1fr .7fr .7fr;gap:8px;padding:6px 14px;background:rgba(14,37,68,.4);}
.rv-lab-hdr span{font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#5a82a8;}
.rv-lab-row{display:grid;grid-template-columns:1.6fr .8fr 1fr .7fr .7fr;gap:8px;padding:7px 14px;border-top:1px solid rgba(26,53,85,.25);align-items:center;transition:background .12s;}
.rv-lab-row:hover{background:rgba(14,37,68,.3);}
.rv-lab-row.crit{background:rgba(255,68,68,.05);border-left:3px solid #ff4444;}
.rv-lab-row.abn-hi{background:rgba(255,107,107,.04);}
.rv-lab-row.abn-lo{background:rgba(59,158,255,.04);}
.rv-lab-name{font-family:'DM Sans',sans-serif;font-size:12px;color:#b8d4f0;}
.rv-lab-val{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:#f2f7ff;display:flex;align-items:center;gap:4px;}
.rv-lab-val.hi{color:#ff6b6b;}
.rv-lab-val.lo{color:#3b9eff;}
.rv-lab-val.crit-hi{color:#ff4444;}
.rv-lab-val.crit-lo{color:#ff4444;}
.rv-lab-ref{font-family:'JetBrains Mono',monospace;font-size:10px;color:#5a82a8;}
.rv-lab-flag{font-family:'JetBrains Mono',monospace;font-size:7px;font-weight:700;padding:2px 5px;border-radius:3px;}
.rv-lab-flag.H{background:rgba(255,107,107,.15);color:#ff6b6b;}
.rv-lab-flag.L{background:rgba(59,158,255,.15);color:#3b9eff;}
.rv-lab-flag.HH{background:rgba(255,68,68,.2);color:#ff4444;animation:rv-pulse 2s ease-in-out infinite;}
.rv-lab-flag.LL{background:rgba(255,68,68,.2);color:#ff4444;animation:rv-pulse 2s ease-in-out infinite;}
@keyframes rv-pulse{0%,100%{opacity:1}50%{opacity:.4}}
.rv-lab-time{font-family:'JetBrains Mono',monospace;font-size:9px;color:#5a82a8;}
.rv-lab-status{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;padding:1px 6px;border-radius:3px;}
.rv-lab-status.final{background:rgba(0,229,192,.1);color:#00e5c0;}
.rv-lab-status.pending{background:rgba(245,200,66,.1);color:#f5c842;}
.rv-group-lbl{font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#2a4f7a;padding:8px 14px 4px;background:rgba(8,15,30,.4);}
.rv-report{padding:14px;}
.rv-report-meta{display:flex;gap:12px;margin-bottom:10px;flex-wrap:wrap;}
.rv-report-tag{font-family:'JetBrains Mono',monospace;font-size:9px;color:#5a82a8;background:rgba(14,37,68,.5);border:1px solid rgba(26,53,85,.4);border-radius:4px;padding:2px 7px;}
.rv-report-section{margin-bottom:12px;}
.rv-report-section-lbl{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#5a82a8;margin-bottom:5px;}
.rv-report-text{font-family:'DM Sans',sans-serif;font-size:12px;color:#b8d4f0;line-height:1.7;}
.rv-report-impression{font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;color:#f2f7ff;line-height:1.6;background:rgba(0,229,192,.04);border:1px solid rgba(0,229,192,.15);border-radius:8px;padding:10px 12px;}
.rv-empty{text-align:center;padding:40px 24px;}
.rv-empty-ico{font-size:32px;opacity:.3;margin-bottom:10px;}
.rv-empty-txt{font-family:'DM Sans',sans-serif;font-size:13px;color:#5a82a8;}
.rv-btn-ghost{padding:4px 12px;border-radius:6px;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;background:rgba(14,37,68,.6);border:1px solid #1a3555;color:#b8d4f0;cursor:pointer;transition:all .13s;}
.rv-btn-ghost:hover{border-color:#2a4f7a;color:#f2f7ff;}
.rv-ecg-findings{display:flex;flex-direction:column;gap:8px;padding:14px;}
.rv-ecg-row{display:flex;align-items:center;gap:10px;}
.rv-ecg-key{font-family:'JetBrains Mono',monospace;font-size:9px;color:#5a82a8;width:80px;flex-shrink:0;}
.rv-ecg-val{font-family:'JetBrains Mono',monospace;font-size:12px;color:#f2f7ff;}
.rv-ecg-val.abn{color:#ff6b6b;font-weight:700;}
.rv-ecg-interp{font-family:'DM Sans',sans-serif;font-size:12px;color:#f2f7ff;background:rgba(245,200,66,.05);border:1px solid rgba(245,200,66,.2);border-radius:8px;padding:10px 12px;margin-top:4px;}
.rv-loading{display:flex;align-items:center;justify-content:center;padding:40px;gap:10px;font-family:'DM Sans',sans-serif;font-size:13px;color:#5a82a8;}
`;
  document.head.appendChild(s);
})();

const T = {
  t:"#f2f7ff",t2:"#b8d4f0",t3:"#82aece",t4:"#5a82a8",
  teal:"#00e5c0",gold:"#f5c842",coral:"#ff6b6b",blue:"#3b9eff",
  red:"#ff4444",green:"#3dffa0",orange:"#ff9f43",purple:"#9b6dff",
};

const FLAG_ORDER = { "HH":0,"LL":0,"H":1,"L":1,"":2 };

function extractCriticals(labs) {
  return labs.filter(l => l.flag === "HH" || l.flag === "LL");
}

// ── Map ClinicalResult entity rows → lab display rows ──────────────────────
function mapEntityToLab(r) {
  const status = r.status || "final";
  let flag = "";
  if (r.flag === "critical_high" || r.flag === "HH") flag = "HH";
  else if (r.flag === "critical_low" || r.flag === "LL") flag = "LL";
  else if (r.flag === "high" || r.flag === "H" || r.flag === "abnormal") flag = "H";
  else if (r.flag === "low" || r.flag === "L") flag = "L";
  return {
    group: r.category || r.result_type || "Lab",
    name:  r.test_name || r.name || "Unknown",
    val:   r.value     || r.result || "—",
    ref:   r.reference_range || r.ref || "",
    unit:  r.unit      || "",
    flag,
    time:  r.resulted_at ? new Date(r.resulted_at).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }) : (r.time || "—"),
    status,
  };
}

function mapEntityToImaging(r) {
  return {
    type:       r.study_type  || r.name || "Imaging Study",
    time:       r.resulted_at ? new Date(r.resulted_at).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }) : (r.time || "—"),
    status:     r.status      || "final",
    technician: r.technician  || r.radiologist || "—",
    technique:  r.technique   || "",
    findings:   r.findings    || r.report_text || "",
    impression: r.impression  || r.summary || "",
    impressionFlag: (r.impression_flag || r.impression || "").toLowerCase().includes("normal") ? "normal" : "abnormal",
  };
}

// ── Sub-components ─────────────────────────────────────────────────────────
function CriticalBanner({ criticals }) {
  if (!criticals.length) return null;
  return (
    <div className="rv-critical-banner">
      <span className="rv-crit-icon">🚨</span>
      <div style={{ flex:1 }}>
        <div className="rv-crit-title">Critical Values — Requires Immediate Acknowledgment</div>
        <div className="rv-crit-list">
          {criticals.map((c, i) => (
            <div key={i} className="rv-crit-item">
              <span>{c.name}:</span>
              <span className="rv-crit-val">{c.val} {c.unit}</span>
              <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.t4 }}>ref {c.ref}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LabsPanel({ labs }) {
  const groups = useMemo(() => {
    const g = {};
    [...labs].sort((a,b) => (FLAG_ORDER[a.flag]??2) - (FLAG_ORDER[b.flag]??2))
      .forEach(l => { (g[l.group] = g[l.group] || []).push(l); });
    return g;
  }, [labs]);

  const rowClass = (flag) => {
    if (flag === "HH" || flag === "LL") return "rv-lab-row crit";
    if (flag === "H") return "rv-lab-row abn-hi";
    if (flag === "L") return "rv-lab-row abn-lo";
    return "rv-lab-row";
  };
  const valClass = (flag) => {
    if (flag === "HH") return "rv-lab-val crit-hi";
    if (flag === "LL") return "rv-lab-val crit-lo";
    if (flag === "H")  return "rv-lab-val hi";
    if (flag === "L")  return "rv-lab-val lo";
    return "rv-lab-val";
  };

  if (!labs.length) return (
    <div className="rv-card">
      <div className="rv-card-hdr"><div className="rv-card-title">Laboratory Results</div></div>
      <div className="rv-empty"><div className="rv-empty-ico">🧪</div><div className="rv-empty-txt">No lab results available</div></div>
    </div>
  );

  return (
    <div className="rv-card">
      <div className="rv-card-hdr">
        <div className="rv-card-title">Laboratory Results</div>
        <div className="rv-card-meta">{labs.filter(l => l.status === "final").length} resulted · {labs.filter(l => l.status === "pending").length} pending</div>
      </div>
      <div className="rv-lab-hdr">
        <span>Test</span><span>Result</span><span>Reference</span><span>Time</span><span>Status</span>
      </div>
      {Object.entries(groups).map(([grp, rows]) => (
        <div key={grp}>
          <div className="rv-group-lbl">{grp}</div>
          {rows.map((r, i) => (
            <div key={i} className={rowClass(r.flag)}>
              <div className="rv-lab-name">{r.name}</div>
              <div className={valClass(r.flag)}>
                {r.val}
                {r.unit && <span style={{ fontSize:9, color:T.t4, marginLeft:2 }}>{r.unit}</span>}
                {r.flag && <span className={`rv-lab-flag ${r.flag}`}>{r.flag}</span>}
              </div>
              <div className="rv-lab-ref">{r.ref} {r.unit}</div>
              <div className="rv-lab-time">{r.time}</div>
              <span className={`rv-lab-status ${r.status}`}>{r.status}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function ImagingPanel({ reports }) {
  const [open, setOpen] = useState(0);
  if (!reports.length) {
    return (
      <div className="rv-card">
        <div className="rv-card-hdr"><div className="rv-card-title">Radiology / Imaging</div></div>
        <div className="rv-empty"><div className="rv-empty-ico">🩻</div><div className="rv-empty-txt">No imaging orders resulted</div></div>
      </div>
    );
  }
  return (
    <div className="rv-card">
      <div className="rv-card-hdr">
        <div className="rv-card-title">Radiology / Imaging</div>
        <div className="rv-card-meta">{reports.length} report{reports.length !== 1 ? "s" : ""}</div>
      </div>
      {reports.map((r, i) => (
        <div key={i}>
          <div className="rv-card-hdr" style={{ cursor:"pointer", borderTop: i>0 ? "1px solid rgba(26,53,85,.4)" : "none" }} onClick={() => setOpen(open === i ? -1 : i)}>
            <div style={{ fontFamily:"DM Sans", fontSize:13, fontWeight:600, color:T.t }}>{r.type}</div>
            <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
              <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.t4 }}>{r.time}</span>
              <span className={`rv-lab-status ${r.status}`}>{r.status}</span>
              <span style={{ color:T.t4, fontSize:11 }}>{open === i ? "▴" : "▾"}</span>
            </div>
          </div>
          {open === i && (
            <div className="rv-report">
              <div className="rv-report-meta">
                <span className="rv-report-tag">Tech: {r.technician}</span>
                <span className="rv-report-tag">{r.time}</span>
              </div>
              {r.technique && (
                <div className="rv-report-section">
                  <div className="rv-report-section-lbl">Technique</div>
                  <div className="rv-report-text">{r.technique}</div>
                </div>
              )}
              <div className="rv-report-section">
                <div className="rv-report-section-lbl">Findings</div>
                <div className="rv-report-text">{r.findings}</div>
              </div>
              <div className="rv-report-section">
                <div className="rv-report-section-lbl">Impression</div>
                <div className="rv-report-impression" style={{ borderColor: r.impressionFlag === "normal" ? "rgba(0,229,192,.2)" : "rgba(245,200,66,.3)", color: r.impressionFlag === "normal" ? T.teal : T.t }}>
                  {r.impression}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ECGPanel({ ecg }) {
  if (!ecg) {
    return (
      <div className="rv-card">
        <div className="rv-card-hdr"><div className="rv-card-title">ECG</div></div>
        <div className="rv-empty"><div className="rv-empty-ico">🫀</div><div className="rv-empty-txt">No ECG ordered or resulted</div></div>
      </div>
    );
  }
  const rows = [
    ["Rate",      ecg.rate,      false],
    ["Rhythm",    ecg.rhythm,    false],
    ["Axis",      ecg.axis,      false],
    ["Intervals", ecg.intervals, false],
    ["ST",        ecg.stChanges, ecg.stChanges && (ecg.stChanges.includes("elevation") || ecg.stChanges.includes("depression"))],
    ["T-Wave",    ecg.tWave,     ecg.tWave && (ecg.tWave.includes("flattening") || ecg.tWave.includes("inversion"))],
  ];
  return (
    <div className="rv-card">
      <div className="rv-card-hdr">
        <div className="rv-card-title">ECG / 12-Lead</div>
        <div className="rv-card-meta">{ecg.time} · {ecg.performed}</div>
      </div>
      <div className="rv-ecg-findings">
        {rows.map(([k, v, abn]) => v ? (
          <div key={k} className="rv-ecg-row">
            <span className="rv-ecg-key">{k}</span>
            <span className={`rv-ecg-val${abn ? " abn" : ""}`}>{v}</span>
          </div>
        ) : null)}
        {ecg.impression && (
          <div style={{ marginTop:8 }}>
            <div className="rv-report-section-lbl">Interpretation</div>
            <div className="rv-ecg-interp" style={{ borderColor: ecg.impressionFlag === "abnormal" ? "rgba(245,200,66,.35)" : "rgba(0,229,192,.2)" }}>
              {ecg.impression}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────
export default function ResultsViewer({
  patientName    = "Patient",
  patientMrn     = "",
  patientAge     = "",
  patientSex     = "",
  allergies      = [],
  chiefComplaint = "",
  vitals         = {},
}) {
  const [activeTab, setActiveTab] = useState("labs");
  const [aiNote,    setAiNote]    = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // ── Real data state ──────────────────────────────────────────────────────
  const [labs,    setLabs]    = useState([]);
  const [imaging, setImaging] = useState([]);
  const [ecg,     setEcg]     = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch from ClinicalResult entity ────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // Fetch all results; filter by patient MRN if available
        const filter = patientMrn ? { patient_id: patientMrn } : {};
        const results = await base44.entities.ClinicalResult.filter(filter, "-created_date", 100);

        if (cancelled) return;

        const labRows     = [];
        const imagingRows = [];
        let   ecgRow      = null;

        results.forEach(r => {
          const type = (r.result_type || r.category || "").toLowerCase();
          if (type === "ecg" || type === "ekg" || type === "electrocardiogram") {
            if (!ecgRow) ecgRow = {
              time:          r.resulted_at ? new Date(r.resulted_at).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }) : "—",
              performed:     r.device || r.technician || "12-lead",
              rate:          r.rate          || "",
              rhythm:        r.rhythm        || "",
              axis:          r.axis          || "",
              intervals:     r.intervals     || "",
              stChanges:     r.st_changes    || "",
              tWave:         r.t_wave        || "",
              impression:    r.impression    || r.report_text || "",
              impressionFlag: (r.impression || "").toLowerCase().includes("normal") && !(r.impression || "").toLowerCase().includes("abnormal") ? "normal" : "abnormal",
            };
          } else if (type === "imaging" || type === "radiology" || type === "xray" || type === "ct" || type === "mri" || type === "ultrasound") {
            imagingRows.push(mapEntityToImaging(r));
          } else {
            labRows.push(mapEntityToLab(r));
          }
        });

        setLabs(labRows);
        setImaging(imagingRows);
        setEcg(ecgRow);
      } catch {
        // On error, leave empty arrays — UI shows "no results" state
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [patientMrn]);

  const criticals = useMemo(() => extractCriticals(labs), [labs]);
  const abnCount  = useMemo(() => labs.filter(l => l.flag && l.flag !== "").length, [labs]);

  const interpretResults = useCallback(async () => {
    setAiLoading(true);
    setAiNote("");
    try {
      const labSummary = labs.filter(l => l.flag).map(l => `${l.name}: ${l.val} ${l.unit} [${l.flag}]`).join(", ");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI. Interpret these ED results for ${patientName}${patientAge ? ", " + patientAge + "y" : ""}${chiefComplaint ? ", CC: " + chiefComplaint : ""}.\n\nAbnormal labs: ${labSummary || "none"}.\nECG: ${ecg?.impression || "not available"}.\nImaging: ${imaging.map(i => i.impression).join("; ") || "not available"}.\n\nProvide a 3–5 sentence clinical interpretation. Lead with the most actionable finding. Be concise and direct.`
      });
      setAiNote(typeof res === "string" ? res : JSON.stringify(res));
    } catch {
      setAiNote("⚠ AI interpretation unavailable.");
    } finally {
      setAiLoading(false);
    }
  }, [labs, ecg, imaging, patientName, patientAge, chiefComplaint]);

  const TABS = [
    { id:"labs",    label:"Labs",    count: abnCount,       countCrit: criticals.length > 0 },
    { id:"imaging", label:"Imaging", count: imaging.length, countCrit: false },
    { id:"ecg",     label:"ECG",     count: ecg ? 1 : 0,   countCrit: false },
  ];

  if (loading) {
    return (
      <div className="rv-wrap">
        <div className="rv-loading">
          <span style={{ animation:"rv-pulse 1.2s ease-in-out infinite" }}>⟳</span>
          Loading results…
        </div>
      </div>
    );
  }

  return (
    <div className="rv-wrap">
      <CriticalBanner criticals={criticals}/>

      {/* AI Interpretation */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
        <button className="rv-btn-ghost" onClick={interpretResults} disabled={aiLoading} style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
          {aiLoading ? "⟳ Interpreting…" : "✦ AI Interpret Results"}
        </button>
        {aiNote && (
          <div style={{ flex:1, fontFamily:"DM Sans", fontSize:12, color:T.t2, background:"rgba(155,109,255,.06)", border:"1px solid rgba(155,109,255,.2)", borderRadius:8, padding:"8px 12px", lineHeight:1.65 }}>
            {aiNote}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="rv-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`rv-tab${activeTab===t.id?" active":""}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
            {t.count > 0 && <span className={`rv-tab-count${t.countCrit ? " crit" : ""}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "labs"    && <LabsPanel    labs={labs}/>}
      {activeTab === "imaging" && <ImagingPanel reports={imaging}/>}
      {activeTab === "ecg"     && <ECGPanel     ecg={ecg}/>}
    </div>
  );
}