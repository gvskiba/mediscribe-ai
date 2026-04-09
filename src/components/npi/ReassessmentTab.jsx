import { useState, useEffect, useCallback } from "react";

// ─── VITAL DELTA HELPER ────────────────────────────────────────────────────────
function vitalDelta(field, initial, repeat) {
  if (!initial || !repeat) return null;
  if (field === "bp") {
    const [si] = String(initial).split("/").map(Number);
    const [sr] = String(repeat).split("/").map(Number);
    if (isNaN(si) || isNaN(sr)) return null;
    const d = sr - si;
    const initAbn = si > 140 || si < 90;
    const repAbn  = sr > 140 || sr < 90;
    const dir = initAbn && !repAbn ? "better" : !initAbn && repAbn ? "worse" : "neutral";
    return { val: `${d > 0 ? "+" : ""}${d}`, dir };
  }
  const ni = parseFloat(initial), nr = parseFloat(repeat);
  if (isNaN(ni) || isNaN(nr)) return null;
  const d = nr - ni;
  let dir = "neutral";
  if (field === "hr")   dir = (ni > 100 && nr <= 100) || (ni < 50 && nr >= 50) ? "better" : (ni <= 100 && nr > 100) || (ni >= 50 && nr < 50) ? "worse" : "neutral";
  if (field === "spo2") dir = d > 0 ? "better" : d < 0 ? "worse" : "neutral";
  if (field === "rr")   dir = (ni > 20 && nr <= 20) ? "better" : (ni <= 20 && nr > 20) ? "worse" : "neutral";
  if (field === "temp") {
    const closer = Math.abs(nr - 37) < Math.abs(ni - 37);
    dir = closer ? "better" : !closer && Math.abs(nr - 37) > Math.abs(ni - 37) ? "worse" : "neutral";
  }
  return { val: `${d > 0 ? "+" : ""}${d % 1 === 0 ? d : d.toFixed(1)}`, dir };
}

function DeltaBadge({ field, initial, repeat }) {
  const d = vitalDelta(field, initial, repeat);
  if (!d) return null;
  const color = d.dir === "better" ? "#00e5c0" : d.dir === "worse" ? "#ff6b6b" : "#7aa0c0";
  return (
    <span style={{
      fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 600,
      color, background: `${color}18`, border: `1px solid ${color}40`,
      borderRadius: 4, padding: "1px 5px", marginLeft: 4, flexShrink: 0,
    }}>
      {d.val}
    </span>
  );
}

// ─── CONDITION OPTIONS ─────────────────────────────────────────────────────────
const CONDITIONS = [
  { id: "improved",  label: "Improved",        color: "#00e5c0", bg: "rgba(0,229,192,.1)",   border: "rgba(0,229,192,.35)"   },
  { id: "stable",    label: "Stable",           color: "#3b9eff", bg: "rgba(59,158,255,.1)", border: "rgba(59,158,255,.35)"  },
  { id: "worsened",  label: "Worsened",         color: "#ff9f43", bg: "rgba(255,159,67,.1)", border: "rgba(255,159,67,.35)"  },
  { id: "critical",  label: "Critical change",  color: "#ff6b6b", bg: "rgba(255,107,107,.1)", border: "rgba(255,107,107,.4)" },
];

const FL = {
  fontSize: 9, color: "var(--npi-txt4)", fontFamily: "'JetBrains Mono',monospace",
  textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 5,
};
const TA = {
  width: "100%", background: "rgba(8,22,40,.6)", border: "1px solid var(--npi-bd)",
  borderRadius: 8, padding: "10px 14px", color: "var(--npi-txt)", fontFamily: "'DM Sans',sans-serif",
  fontSize: 13, lineHeight: 1.65, resize: "vertical", outline: "none", boxSizing: "border-box",
  transition: "border-color .15s",
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function ReassessmentTab({ initialVitals = {}, onStateChange, onAdvance }) {
  const [reassessTime, setReassessTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  });
  const [condition,    setCondition]    = useState("");
  const [rvBP,         setRvBP]         = useState("");
  const [rvHR,         setRvHR]         = useState("");
  const [rvRR,         setRvRR]         = useState("");
  const [rvSpo2,       setRvSpo2]       = useState("");
  const [rvTemp,       setRvTemp]       = useState("");
  const [rxResponse,   setRxResponse]   = useState("");
  const [reassessNote, setReassessNote] = useState("");

  useEffect(() => {
    onStateChange?.({
      time: reassessTime, condition,
      vitals: { bp: rvBP, hr: rvHR, rr: rvRR, spo2: rvSpo2, temp: rvTemp },
      response: rxResponse, note: reassessNote,
    });
  }, [reassessTime, condition, rvBP, rvHR, rvRR, rvSpo2, rvTemp, rxResponse, reassessNote, onStateChange]);

  const condObj = CONDITIONS.find(c => c.id === condition);

  return (
    <>
      <style>{CSS}</style>
      <div className="rxt-wrap">

        {/* ── HEADER ───────────────────────────────────────────────────── */}
        <div className="rxt-hdr">
          <div className="rxt-hdr-left">
            <span className="rxt-title">Reassessment</span>
            <span className="rxt-guideline">Required before disposition  ·  SAEM / WikEM</span>
          </div>
          <div className="rxt-hdr-time">
            <span style={FL}>Time</span>
            <input
              className="rxt-time-input"
              type="time"
              value={reassessTime}
              onChange={e => setReassessTime(e.target.value)}
            />
          </div>
          {condObj && (
            <span className="rxt-cond-badge" style={{ color: condObj.color, background: condObj.bg, borderColor: condObj.border }}>
              {condObj.label}
            </span>
          )}
        </div>

        <div className="rxt-body">

          {/* ── CONDITION CHANGE ─────────────────────────────────────── */}
          <div className="rxt-section">
            <div style={FL}>Clinical condition</div>
            <div className="rxt-cond-grid">
              {CONDITIONS.map(c => (
                <button
                  key={c.id}
                  className={`rxt-cond-btn${condition === c.id ? " active" : ""}`}
                  style={condition === c.id ? { borderColor: c.border, background: c.bg, color: c.color } : {}}
                  onClick={() => setCondition(prev => prev === c.id ? "" : c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── REPEAT VITALS ────────────────────────────────────────── */}
          <div className="rxt-section">
            <div style={{ ...FL, marginBottom: 8 }}>
              Repeat vitals
              <span style={{ textTransform: "none", letterSpacing: 0, color: "var(--npi-txt4)", marginLeft: 6 }}>
                — enter only those that changed
              </span>
            </div>
            <div className="rxt-vitals-grid">
              {[
                { key: "bp",   label: "BP",    placeholder: "120/80", val: rvBP,   set: setRvBP,   init: initialVitals.bp   },
                { key: "hr",   label: "HR",    placeholder: "72",     val: rvHR,   set: setRvHR,   init: initialVitals.hr   },
                { key: "rr",   label: "RR",    placeholder: "16",     val: rvRR,   set: setRvRR,   init: initialVitals.rr   },
                { key: "spo2", label: "SpO₂",  placeholder: "98",     val: rvSpo2, set: setRvSpo2, init: initialVitals.spo2 },
                { key: "temp", label: "Temp",  placeholder: "37.0",   val: rvTemp, set: setRvTemp, init: initialVitals.temp },
              ].map(({ key, label, placeholder, val, set, init }) => (
                <div key={key} className="rxt-vital-cell">
                  <div className="rxt-vital-lbl">
                    {label}
                    {init && <span className="rxt-vital-init">was {init}</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <input
                      className="rxt-vital-inp"
                      value={val}
                      onChange={e => set(e.target.value)}
                      placeholder={placeholder}
                    />
                    <DeltaBadge field={key} initial={init} repeat={val} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RESPONSE TO TREATMENT ────────────────────────────────── */}
          <div className="rxt-section">
            <div style={FL}>Response to treatment</div>
            <textarea
              style={TA}
              rows={2}
              placeholder="Patient received 1L NS IV — HR improved from 112 to 88. Pain reduced from 8/10 to 4/10 after morphine 4mg IV…"
              value={rxResponse}
              onChange={e => setRxResponse(e.target.value)}
            />
          </div>

          {/* ── REASSESSMENT NOTE ────────────────────────────────────── */}
          <div className="rxt-section">
            <div style={FL}>Reassessment exam / clinical note</div>
            <textarea
              style={TA}
              rows={3}
              placeholder="Patient reassessed prior to disposition. Repeat exam: alert and oriented, improved from initial presentation. Abdomen softer, less tender. Vitals improving as above. Patient ambulatory without difficulty…"
              value={reassessNote}
              onChange={e => setReassessNote(e.target.value)}
            />
          </div>

          {/* ── ADVANCE ──────────────────────────────────────────────── */}
          {onAdvance && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
              <button
                onClick={onAdvance}
                disabled={!condition}
                style={{
                  padding: "8px 20px", borderRadius: 8,
                  background: condition ? "var(--npi-teal)" : "rgba(255,255,255,.05)",
                  color: condition ? "#050f1e" : "var(--npi-txt4)",
                  border: "none", fontFamily: "'DM Sans',sans-serif",
                  fontSize: 12, fontWeight: 700, cursor: condition ? "pointer" : "not-allowed",
                  transition: "all .15s",
                }}
              >
                → Discharge
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
.rxt-wrap{display:flex;flex-direction:column;height:100%;background:var(--npi-bg);border-radius:12px;border:1px solid var(--npi-bd);overflow:hidden}
.rxt-hdr{display:flex;align-items:center;gap:12px;padding:10px 18px;background:var(--npi-panel);border-bottom:1px solid var(--npi-bd);flex-shrink:0;flex-wrap:wrap}
.rxt-hdr-left{display:flex;flex-direction:column;gap:2px;flex:1}
.rxt-title{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;color:var(--npi-txt)}
.rxt-guideline{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--npi-txt4);letter-spacing:.03em}
.rxt-hdr-time{display:flex;flex-direction:column;gap:2px;align-items:flex-end}
.rxt-time-input{background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:6px;color:var(--npi-txt2);font-family:'JetBrains Mono',monospace;font-size:12px;padding:4px 8px;outline:none;width:88px}
.rxt-time-input:focus{border-color:var(--npi-teal)}
.rxt-cond-badge{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;padding:3px 12px;border-radius:20px;border:1px solid;white-space:nowrap;flex-shrink:0}

.rxt-body{flex:1;overflow-y:auto;padding:16px 18px;display:flex;flex-direction:column;gap:18px;scrollbar-width:thin;scrollbar-color:#1a3555 transparent}
.rxt-body::-webkit-scrollbar{width:3px}
.rxt-body::-webkit-scrollbar-thumb{background:#1a3555;border-radius:2px}
.rxt-section{display:flex;flex-direction:column;gap:6px}

.rxt-cond-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.rxt-cond-btn{padding:8px 10px;border-radius:8px;border:1px solid var(--npi-bd);background:rgba(255,255,255,.03);color:var(--npi-txt3);font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;text-align:center}
.rxt-cond-btn:hover{background:rgba(255,255,255,.06);border-color:var(--npi-bhi)}
.rxt-cond-btn.active{font-weight:700}

.rxt-vitals-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
.rxt-vital-cell{display:flex;flex-direction:column;gap:4px}
.rxt-vital-lbl{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--npi-txt4);text-transform:uppercase;letter-spacing:.08em}
.rxt-vital-init{color:var(--npi-txt4);font-size:8px;margin-left:5px;font-family:'JetBrains Mono',monospace}
.rxt-vital-inp{width:100%;background:rgba(8,22,40,.6);border:1px solid var(--npi-bd);border-radius:6px;padding:6px 8px;color:var(--npi-txt);font-family:'JetBrains Mono',monospace;font-size:12px;outline:none;transition:border-color .15s;box-sizing:border-box}
.rxt-vital-inp:focus{border-color:var(--npi-teal)}
.rxt-vital-inp::placeholder{color:var(--npi-txt4)}

@media(max-width:700px){
  .rxt-cond-grid{grid-template-columns:repeat(2,1fr)}
  .rxt-vitals-grid{grid-template-columns:repeat(3,1fr)}
}
`;