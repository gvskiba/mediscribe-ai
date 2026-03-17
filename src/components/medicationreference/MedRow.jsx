import { useState } from "react";
import MedDetailModal from "./MedDetailModal";

const CAT_COLOR = {
  all: "#00c4a0", anticoag: "#ef4444", cardiac: "#f97316", psych: "#8b5cf6",
  analgesic: "#fb7185", abx: "#22c55e", gi: "#f59e0b", other: "#06b6d4",
};

export default function MedRow({ med, weightKg, isSelected, onSelect }) {
  const [showModal, setShowModal] = useState(false);
  const color = CAT_COLOR[med.category] || "#00c4a0";
  const dosing = med.dosing?.[0];
  const doseStr = dosing?.dose || "";
  const wDose = weightKg && med.ped?.mgkg
    ? { low: Math.round(weightKg * med.ped.mgkg * 10) / 10, unit: med.ped.unit }
    : null;

  return (
    <>
      <div
        className="mrow"
        style={isSelected ? { background: "rgba(0,196,160,0.12)", borderColor: "rgba(0,196,160,0.4)", cursor: "pointer" } : { cursor: "pointer" }}
        onClick={() => setShowModal(true)}
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
            onClick={e => e.stopPropagation()}
            style={{ cursor: "pointer", width: 16, height: 16 }}
            title="Select for interaction check"
          />
          <button className="obtn" onClick={e => e.stopPropagation()}>Order →</button>
        </div>
      </div>

      {showModal && <MedDetailModal med={med} onClose={() => setShowModal(false)} />}
    </>
  );
}