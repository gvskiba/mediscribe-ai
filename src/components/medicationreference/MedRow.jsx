const CAT_COLOR = {
  all: "#00c4a0", anticoag: "#ef4444", cardiac: "#f97316", psych: "#8b5cf6",
  analgesic: "#fb7185", abx: "#22c55e", gi: "#f59e0b", other: "#06b6d4",
};

export default function MedRow({ med, isExpanded, onToggle, weightKg, isSelected, onSelect }) {
  const color = CAT_COLOR[med.category] || "#00c4a0";
  const dosing = med.dosing?.[0];
  const doseStr = dosing?.dose || "";
  const wDose = weightKg && med.ped?.mgkg
    ? { low: Math.round(weightKg * med.ped.mgkg * 10) / 10, unit: med.ped.unit }
    : null;

  return (
    <>
      <div
        className={`mrow ${isExpanded ? "ex" : ""}`}
        style={isSelected ? { background: "rgba(0,196,160,0.12)", borderColor: "rgba(0,196,160,0.4)" } : {}}
        onClick={onToggle}
      >
        <div className="mdot" style={{ background: color }} />
        <div className="mrm">
          <div className="mrn">
            {med.name}
            {med.highAlert && (
              <span className="mlb" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
                HIGH ALERT
              </span>
            )}
            {wDose && (
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(0,196,160,0.12)", border: "1px solid rgba(0,196,160,0.3)", color: "#00c4a0", fontFamily: "monospace", fontWeight: 700 }}>
                ⚖ {wDose.low} {wDose.unit}
              </span>
            )}
          </div>
          <div className="mrs">{med.drugClass} · {typeof med.indications === "string" ? med.indications.split(",")[0].trim() : ""}</div>
        </div>
        <div className="mrr">
          <span className="dpill">{doseStr.slice(0, 40)}{doseStr.length > 40 ? "…" : ""}</span>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={e => { e.stopPropagation(); onSelect(!isSelected); }}
            style={{ cursor: "pointer", width: 16, height: 16 }}
            title="Select for interaction check"
          />
          <button className="obtn" onClick={e => e.stopPropagation()}>Order →</button>
          <span style={{ color: "var(--tx3)", fontSize: 11, transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform .15s" }}>▼</span>
        </div>
      </div>

      {isExpanded && (
        <div className="mdet">
          {med.mechanism && (
            <div style={{ marginBottom: 11, padding: "8px 12px", background: "rgba(0,196,160,0.05)", border: "1px solid rgba(0,196,160,0.18)", borderRadius: "var(--r)" }}>
              <div className="dlbl" style={{ marginBottom: 4 }}>Mechanism of Action</div>
              <div style={{ fontSize: 12, color: "var(--tx2)", lineHeight: 1.6 }}>{med.mechanism}</div>
            </div>
          )}
          <div className="dgrid">
            <div>
              <div className="dlbl">Adult Dose</div>
              <div className="dval tl">{med.dosing?.[0]?.dose || "See dosing table"}</div>
            </div>
            <div>
              <div className="dlbl">Onset / Duration</div>
              <div className="dval"><span style={{ color: "var(--teal)" }}>{med.halfLife}</span></div>
            </div>
            <div>
              <div className="dlbl">Pregnancy Category</div>
              <div className="dval tl">{med.pregnancy}</div>
            </div>
          </div>
          <div className="dgrid">
            <div>
              <div className="dlbl">Contraindications</div>
              {med.contraindications?.slice(0, 3).map((ci, i) => (
                <div key={i} className="cir"><span style={{ flexShrink: 0 }}>✕</span><span>{ci}</span></div>
              ))}
            </div>
            <div>
              <div className="dlbl">Warnings</div>
              {med.warnings?.slice(0, 3).map((w, i) => (
                <div key={i} className="wr"><span style={{ color: "var(--yel)", flexShrink: 0 }}>⚠</span><span>{w}</span></div>
              ))}
            </div>
            <div>
              <div className="dlbl">Monitoring</div>
              <div style={{ fontSize: 11, color: "var(--tx2)", lineHeight: 1.5 }}>{med.monitoring}</div>
            </div>
          </div>
          <div className="rtags">
            <span style={{ fontSize: 10, color: "var(--tx3)", alignSelf: "center" }}>Key Info:</span>
            <span className="rtag">{med.drugClass}</span>
            <span className="rtag">Category: {med.pregnancy}</span>
            {med.highAlert && <span className="rvtag">HIGH ALERT</span>}
          </div>
        </div>
      )}
    </>
  );
}