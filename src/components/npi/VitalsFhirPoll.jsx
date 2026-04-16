import { useState, useCallback } from "react";
 
// ── LOINC → local vitals key ──────────────────────────────────────────────────
// BP is a panel (85354-9) with components; everything else is a simple value.
const LOINC_SIMPLE = {
  "8867-4":  "hr",      // Heart rate
  "9279-1":  "rr",      // Respiratory rate
  "59408-5": "spo2",    // O2 saturation by pulse ox
  "2708-6":  "spo2",    // O2 saturation (alt code)
  "8310-5":  "temp",    // Body temperature
  "8331-1":  "temp",    // Oral temperature
  "8332-9":  "temp",    // Rectal temperature
  "29463-7": "weight",  // Body weight
  "8302-2":  "height",  // Body height
};
const BP_CODE        = "85354-9";
const SYSTOLIC_CODE  = "8480-6";
const DIASTOLIC_CODE = "8462-4";
 
function celsiusToF(c) {
  return Math.round((c * 9 / 5 + 32) * 10) / 10;
}
 
function mapObservation(obs) {
  const codings = obs.code?.coding || [];
  const loincCode = codings.find(c =>
    c.system?.toLowerCase().includes("loinc")
  )?.code || codings[0]?.code || "";
 
  // Blood pressure panel
  if (loincCode === BP_CODE || codings.some(c => c.code === BP_CODE)) {
    const comps = obs.component || [];
    const sysCmp = comps.find(c => c.code?.coding?.some(x => x.code === SYSTOLIC_CODE));
    const diaCmp = comps.find(c => c.code?.coding?.some(x => x.code === DIASTOLIC_CODE));
    const sv = sysCmp?.valueQuantity?.value;
    const dv = diaCmp?.valueQuantity?.value;
    if (sv != null && dv != null) {
      return { key: "bp", value: `${Math.round(sv)}/${Math.round(dv)}` };
    }
    return null;
  }
 
  const localKey = LOINC_SIMPLE[loincCode];
  if (!localKey) return null;
 
  const val  = obs.valueQuantity?.value;
  const unit = (obs.valueQuantity?.unit || obs.valueQuantity?.code || "").toLowerCase();
  if (val == null) return null;
 
  if (localKey === "spo2")   return { key: "spo2",   value: String(Math.round(val)) };
  if (localKey === "hr")     return { key: "hr",     value: String(Math.round(val)) };
  if (localKey === "rr")     return { key: "rr",     value: String(Math.round(val)) };
  if (localKey === "weight") return { key: "weight", value: String(Math.round(val * 10) / 10) };
  if (localKey === "height") return { key: "height", value: String(Math.round(val)) };
  if (localKey === "temp") {
    const f = unit === "cel" || unit === "c" || unit.includes("celsius")
      ? celsiusToF(val)
      : Math.round(val * 10) / 10;
    return { key: "temp", value: String(f) };
  }
  return null;
}
 
// ── Main component ────────────────────────────────────────────────────────────
export default function VitalsFhirPoll({
  vitals, setVitals, onToast,
  patientMrn, patientFhirId,
}) {
  const [busy,       setBusy]       = useState(false);
  const [lastPolled, setLastPolled] = useState(null);
  const [lastCount,  setLastCount]  = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const [fhirBase,   setFhirBase]   = useState("");
 
  const poll = useCallback(async () => {
    const base = fhirBase.trim().replace(/\/$/, "");
    if (!base) {
      setShowConfig(true);
      onToast?.("Enter a FHIR base URL first.", "error");
      return;
    }
    const patId = patientFhirId || patientMrn;
    if (!patId) {
      onToast?.("No patient FHIR ID or MRN available — enter demographics first.", "error");
      return;
    }
    setBusy(true);
    try {
      const url = `${base}/Observation?patient=${encodeURIComponent(patId)}&category=vital-signs&_sort=-date&_count=20`;
      const res = await fetch(url, {
        headers: { Accept: "application/fhir+json" },
      });
      if (!res.ok) throw new Error(`FHIR server returned ${res.status}`);
      const bundle  = await res.json();
      const entries = bundle.entry || [];
 
      // Build updates — first occurrence of each key wins (newest-first with _sort=-date)
      const updates = {};
      entries.forEach(e => {
        const obs = e.resource;
        if (!obs || obs.resourceType !== "Observation") return;
        const mapped = mapObservation(obs);
        if (mapped && !(mapped.key in updates)) {
          updates[mapped.key] = mapped.value;
        }
      });
 
      const count = Object.keys(updates).length;
      if (count === 0) {
        onToast?.("No recent vital signs found in FHIR response.", "error");
      } else {
        setVitals(prev => ({ ...prev, ...updates }));
        setLastCount(count);
        onToast?.(`${count} vital sign${count > 1 ? "s" : ""} updated from FHIR.`, "success");
      }
      setLastPolled(new Date());
    } catch (err) {
      onToast?.(`FHIR poll failed: ${err.message}`, "error");
    } finally {
      setBusy(false);
    }
  }, [fhirBase, patientFhirId, patientMrn, setVitals, onToast]);
 
  const ts = lastPolled
    ? lastPolled.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
    : null;
 
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0, position: "relative" }}>
 
      {/* ── Gear / config toggle ──────────────────────────────────────────── */}
      <button
        onClick={() => setShowConfig(s => !s)}
        title="Configure FHIR endpoint"
        style={{
          width: 27, height: 27, borderRadius: 6, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: fhirBase ? "rgba(0,229,192,0.08)" : "rgba(42,77,114,0.18)",
          border: `1px solid ${fhirBase ? "rgba(0,229,192,0.28)" : "rgba(42,77,114,0.35)"}`,
          color: fhirBase ? "#00e5c0" : "#5a82a8",
          fontSize: 13, transition: "all .15s", flexShrink: 0,
        }}
      >
        ⚙
      </button>
 
      {/* ── Poll button ───────────────────────────────────────────────────── */}
      <button
        onClick={poll}
        disabled={busy}
        title={ts ? `Last polled ${ts} — click to refresh` : "Fetch latest vitals from FHIR R4"}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "5px 11px", borderRadius: 7,
          cursor: busy ? "not-allowed" : "pointer",
          background: busy ? "rgba(0,229,192,0.05)" : "rgba(0,229,192,0.1)",
          border: `1px solid ${busy ? "rgba(0,229,192,0.12)" : "rgba(0,229,192,0.3)"}`,
          color: busy ? "#3d8a74" : "#00e5c0",
          fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600,
          whiteSpace: "nowrap", transition: "all .15s",
        }}
      >
        <span style={{
          display: "inline-block", fontSize: 14,
          animation: busy ? "fhir-spin .9s linear infinite" : "none",
        }}>
          ⟳
        </span>
        FHIR
      </button>
 
      {/* ── Last-polled stamp ─────────────────────────────────────────────── */}
      {ts && (
        <span style={{
          fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
          color: "#2a5a88", letterSpacing: 0.4, whiteSpace: "nowrap",
        }}>
          {lastCount > 0 ? `+${lastCount} ` : ""}{ts}
        </span>
      )}
 
      {/* ── Config dropdown ───────────────────────────────────────────────── */}
      {showConfig && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0,
            background: "#081628", border: "1px solid rgba(26,53,85,0.72)",
            borderRadius: 11, padding: "15px 17px", zIndex: 500,
            boxShadow: "0 16px 48px rgba(0,0,0,0.55)", width: 330,
          }}
        >
          <div style={{
            fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
            color: "#2a5a88", letterSpacing: 1, textTransform: "uppercase", marginBottom: 7,
          }}>
            FHIR R4 Base URL
          </div>
          <input
            type="text"
            placeholder="https://fhir.hospital.org/R4"
            value={fhirBase}
            onChange={e => setFhirBase(e.target.value)}
            style={{
              width: "100%", boxSizing: "border-box",
              background: "rgba(14,37,68,0.7)", border: "1px solid rgba(26,53,85,0.55)",
              borderRadius: 7, padding: "7px 11px",
              color: "#f2f7ff", fontFamily: "'DM Sans',sans-serif",
              fontSize: 12, outline: "none",
            }}
            onFocus={e =>  { e.target.style.borderColor = "rgba(0,229,192,0.45)"; }}
            onBlur={e =>   { e.target.style.borderColor = "rgba(26,53,85,0.55)"; }}
          />
 
          <div style={{
            fontFamily: "'DM Sans',sans-serif", fontSize: 10,
            color: "#2a5a88", marginTop: 8, lineHeight: 1.65,
          }}>
            Patient: <span style={{ color: "#3b9eff", fontFamily: "'JetBrains Mono',monospace" }}>
              {patientFhirId || patientMrn || "not set"}
            </span><br />
            Endpoint: <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9 }}>
              /Observation?patient=…&category=vital-signs
            </span>
          </div>
 
          <div style={{
            marginTop: 10, padding: "7px 10px", borderRadius: 7,
            background: "rgba(42,77,114,0.12)", border: "1px solid rgba(42,77,114,0.25)",
            fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "#3a5a7a", lineHeight: 1.55,
          }}>
            Maps LOINC codes: HR (8867-4), BP (85354-9), RR (9279-1), SpO2 (59408-5), Temp (8310-5), Weight (29463-7), Height (8302-2)
          </div>
 
          <button
            onClick={() => setShowConfig(false)}
            style={{
              marginTop: 11, width: "100%", padding: "7px 0", borderRadius: 7,
              background: "rgba(0,229,192,0.1)", border: "1px solid rgba(0,229,192,0.3)",
              color: "#00e5c0", fontFamily: "'DM Sans',sans-serif",
              fontSize: 11, fontWeight: 600, cursor: "pointer",
            }}
          >
            Done
          </button>
        </div>
      )}
 
      {/* Spin keyframe */}
      <style>{`@keyframes fhir-spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}