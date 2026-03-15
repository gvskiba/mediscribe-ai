import { useState } from "react";

export default function WeightWidget({ weight, weightUnit, onWeightChange, onUnitChange, onClear }) {
  const [inputVal, setInputVal] = useState(weight ? String(weight) : "");

  const handleChange = (e) => {
    setInputVal(e.target.value);
    const val = parseFloat(e.target.value);
    onWeightChange(isNaN(val) ? null : val);
  };

  const handleUnitToggle = () => {
    const newUnit = weightUnit === "kg" ? "lbs" : "kg";
    onUnitChange(newUnit);
    if (weight) {
      const converted = newUnit === "kg" ? Math.round(weight / 2.205 * 10) / 10 : Math.round(weight * 2.205 * 10) / 10;
      setInputVal(String(converted));
      onWeightChange(converted);
    }
  };

  const weightKg = weight ? (weightUnit === "lbs" ? Math.round(weight / 2.205 * 10) / 10 : weight) : null;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: weight ? "rgba(0,196,160,0.06)" : "rgba(13,22,40,0.8)",
      border: `1px solid ${weight ? "rgba(0,196,160,0.25)" : "rgba(0,196,160,0.1)"}`,
      borderRadius: 10, padding: "8px 14px", flexShrink: 0
    }}>
      <span style={{ fontSize: 14 }}>⚖️</span>
      <div>
        <div style={{ fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: "#4a6080", marginBottom: 3 }}>
          PATIENT WEIGHT
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="number"
            min="0"
            step="0.1"
            value={inputVal}
            onChange={handleChange}
            placeholder="—"
            style={{
              width: 60, background: "transparent", border: "none", outline: "none",
              color: weight ? "#00c4a0" : "#94a3b8", fontSize: 18, fontWeight: 700,
              fontFamily: "monospace", padding: 0
            }}
          />
          <button onClick={handleUnitToggle} style={{
            fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
            border: "1px solid rgba(0,196,160,0.2)", background: "transparent",
            color: "#94a3b8", cursor: "pointer", fontFamily: "inherit"
          }}>{weightUnit}</button>
          {weight && weightUnit === "lbs" && (
            <span style={{ fontSize: 10, color: "#4a6080" }}>({weightKg} kg)</span>
          )}
          {weight && (
            <button onClick={() => { setInputVal(""); onClear(); }} style={{
              fontSize: 10, background: "transparent", border: "none", color: "#4a6080",
              cursor: "pointer", padding: "0 2px"
            }}>✕</button>
          )}
        </div>
      </div>
      {weightKg && (
        <div style={{ marginLeft: 4, paddingLeft: 10, borderLeft: "1px solid rgba(0,196,160,0.15)" }}>
          <div style={{ fontSize: 9, color: "#4a6080", letterSpacing: ".08em", marginBottom: 2 }}>DOSE MODE</div>
          <div style={{ fontSize: 10, color: "#00c4a0", fontWeight: 600 }}>Weight-based active</div>
        </div>
      )}
    </div>
  );
}