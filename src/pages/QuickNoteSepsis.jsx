// QuickNoteSepsis.jsx
// Sepsis/SIRS criteria auto-check from vitals + labs text (pure logic, no AI)
// Exported: useSepsisCheck, SepsisBanner

import React from "react";

// ─── SEPSIS / SIRS CHECKER ────────────────────────────────────────────────────
export function useSepsisCheck(vitalsText, labsText) {
  const criteria = [];
  const warnings = [];

  if (!vitalsText && !labsText) return { criteria:[], warnings:[], sirsCount:0, sepsisRisk:false };

  const v = vitalsText || "";
  const l = labsText   || "";

  // HR > 100
  const hrMatch = v.match(/HR\s*([0-9]+)/i);
  if (hrMatch) {
    const hr = parseInt(hrMatch[1]);
    if (hr > 100) criteria.push({ label:"HR", value:`${hr} bpm`, threshold:">100", met:true });
    else criteria.push({ label:"HR", value:`${hr} bpm`, threshold:">100", met:false });
  }

  // RR > 20
  const rrMatch = v.match(/RR\s*([0-9]+)/i);
  if (rrMatch) {
    const rr = parseInt(rrMatch[1]);
    if (rr > 20) criteria.push({ label:"RR", value:`${rr}`, threshold:">20", met:true });
    else criteria.push({ label:"RR", value:`${rr}`, threshold:">20", met:false });
  }

  // Temp > 38.0 or < 36.0
  const tempMatch = v.match(/T(?:emp)?\s*([0-9]+\.?[0-9]*)/i);
  if (tempMatch) {
    const temp = parseFloat(tempMatch[1]);
    const isF = temp > 45; // Fahrenheit if > 45
    const tempC = isF ? (temp - 32) * 5/9 : temp;
    const display = isF ? `${temp}°F (${tempC.toFixed(1)}°C)` : `${temp}°C`;
    if (tempC > 38.0 || tempC < 36.0) criteria.push({ label:"Temp", value:display, threshold:">38 or <36°C", met:true });
    else criteria.push({ label:"Temp", value:display, threshold:">38 or <36°C", met:false });
  }

  // WBC > 12 or < 4 (from labs)
  const wbcMatch = l.match(/WBC\s*[:\-]?\s*([0-9.]+)/i);
  if (wbcMatch) {
    const wbc = parseFloat(wbcMatch[1]);
    if (wbc > 12 || wbc < 4) criteria.push({ label:"WBC", value:`${wbc}k`, threshold:">12 or <4", met:true });
    else criteria.push({ label:"WBC", value:`${wbc}k`, threshold:">12 or <4", met:false });
  }

  // SpO2 < 94%
  const spo2Match = v.match(/SpO2\s*([0-9]+)/i);
  if (spo2Match) {
    const spo2 = parseInt(spo2Match[1]);
    if (spo2 < 94) warnings.push({ label:"SpO2", value:`${spo2}%`, msg:"Hypoxemia — consider sepsis organ dysfunction" });
  }

  // Lactate > 2
  const lactateMatch = l.match(/lactate\s*[:\-]?\s*([0-9.]+)/i);
  if (lactateMatch) {
    const lac = parseFloat(lactateMatch[1]);
    if (lac >= 2) warnings.push({ label:"Lactate", value:`${lac}`, msg: lac >= 4 ? "Lactate ≥4 — Septic shock criteria, resuscitation bundle NOW" : "Lactate ≥2 — Sepsis-3 organ dysfunction indicator" });
  }

  // Creatinine > 2 (AKI as organ dysfunction)
  const creatMatch = l.match(/creatinine\s*[:\-]?\s*([0-9.]+)/i);
  if (creatMatch) {
    const cr = parseFloat(creatMatch[1]);
    if (cr > 2) warnings.push({ label:"Creatinine", value:cr, msg:"AKI — possible sepsis organ dysfunction" });
  }

  // BP < 90 systolic (hypotension)
  const bpMatch = v.match(/BP\s*([0-9]+)\s*\/\s*([0-9]+)/i);
  if (bpMatch) {
    const sbp = parseInt(bpMatch[1]);
    if (sbp < 90) warnings.push({ label:"SBP", value:`${sbp}`, msg:"Hypotension — septic shock if refractory to fluids" });
  }

  const sirsCount = criteria.filter(c => c.met).length;
  const sepsisRisk = sirsCount >= 2;

  // Check if lactate not ordered (reminder)
  const lactateOrdered = /lactate/i.test(l);
  if (sepsisRisk && !lactateOrdered) {
    warnings.push({ label:"Lactate", value:"not found", msg:"SIRS ≥2 — consider lactate to evaluate sepsis organ dysfunction" });
  }

  return { criteria, warnings, sirsCount, sepsisRisk };
}

// ─── SEPSIS BANNER COMPONENT ──────────────────────────────────────────────────
export function SepsisBanner({ vitalsText, labsText }) {
  const { criteria, warnings, sirsCount, sepsisRisk } = useSepsisCheck(vitalsText, labsText);

  // Only show if we have at least 2 parseable criteria
  if (criteria.length < 2) return null;

  const lactateWarning = warnings.find(w => w.label === "Lactate");
  const isSepticShock  = warnings.some(w => w.msg.includes("Septic shock"));
  const borderColor    = isSepticShock ? "rgba(255,68,68,.6)" : sirsCount >= 2 ? "rgba(255,159,67,.5)" : "rgba(42,79,122,.4)";
  const bgColor        = isSepticShock ? "rgba(255,68,68,.08)" : sirsCount >= 2 ? "rgba(255,159,67,.07)" : "rgba(8,22,40,.4)";
  const headerColor    = isSepticShock ? "var(--qn-red)" : sirsCount >= 2 ? "var(--qn-orange)" : "var(--qn-txt4)";

  return (
    <div style={{ marginBottom:10, padding:"10px 14px", borderRadius:10,
      background:bgColor, border:`1px solid ${borderColor}` }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
          color:headerColor, letterSpacing:1, textTransform:"uppercase", flex:1 }}>
          {isSepticShock ? "⚡ Septic Shock Criteria" :
           sirsCount >= 2 ? `⚠ SIRS Criteria Met (${sirsCount}/4) — Evaluate for Sepsis` :
           `SIRS Check (${sirsCount}/4 criteria)`}
        </span>
        {sirsCount >= 2 && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
            color:"rgba(255,159,67,.7)", letterSpacing:.4 }}>
            Sepsis-3 · SSC Guidelines
          </span>
        )}
      </div>

      {/* Criteria chips */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:warnings.length ? 8 : 0 }}>
        {criteria.map((c, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:5,
            padding:"3px 9px", borderRadius:6,
            background: c.met ? "rgba(255,159,67,.12)" : "rgba(61,255,160,.08)",
            border:`1px solid ${c.met ? "rgba(255,159,67,.4)" : "rgba(61,255,160,.3)"}` }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              fontWeight:700, color:c.met ? "var(--qn-orange)" : "var(--qn-green)" }}>
              {c.met ? "✓" : "−"} {c.label}
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:c.met ? "rgba(255,159,67,.8)" : "rgba(61,255,160,.7)" }}>
              {c.value}
            </span>
          </div>
        ))}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          {warnings.map((w, i) => (
            <div key={i} style={{ display:"flex", alignItems:"baseline", gap:7,
              fontFamily:"'DM Sans',sans-serif", fontSize:10, lineHeight:1.4 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                fontWeight:700, color:"var(--qn-red)", flexShrink:0 }}>{w.label}:</span>
              <span style={{ color:"rgba(255,180,130,.9)" }}>{w.msg}</span>
            </div>
          ))}
        </div>
      )}

      {sirsCount >= 2 && (
        <div style={{ marginTop:7, fontFamily:"'JetBrains Mono',monospace", fontSize:7,
          color:"rgba(255,159,67,.5)", letterSpacing:.4 }}>
          Hour-1 SSC bundle: Blood cultures → Antibiotics → Lactate → 30mL/kg IVF if hypotensive/lactate ≥4
        </div>
      )}
    </div>
  );
}