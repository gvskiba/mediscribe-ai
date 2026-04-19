// HandoffTab.jsx
// I-PASS structured shift-handoff sheet.
//
// Framework elements:
//   I — Illness severity (ESI, vitals, AVPU)
//   P — Patient summary (demo, CC, PMH, allergies, medications)
//   A — Action list (consults, sepsis bundle, nursing actions, disposition)
//   S — Situation awareness & contingency (ROS positives, PE findings, SDOH)
//   S — Synthesis by receiver (editable scratchpad)
//
// Export: clipboard copy (plain text) + browser print (print-safe CSS included).
//
// Constraints: no form, no localStorage, no router, no alert, no sonner,
//   straight quotes only, finally { setBusy(false) } on async.
//
// Props:
//   demo, cc, vitals, avpu
//   medications, allergies, pmhSelected
//   rosState, peState, peFindings
//   esiLevel, visitMode, registration
//   sdoh, consults, sepsisBundle, nursingInterventions
//   disposition, dispReason, doorTime, providerName
//   onAdvance

import { useState, useCallback } from "react";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:     "#050f1e", panel: "#081628", card:  "#0b1e36", up: "#0e2544",
  bd:     "rgba(26,53,85,0.8)",
  txt:    "#f2f7ff", txt2:  "#b8d4f0", txt3:  "#82aece", txt4: "#5a82a8",
  teal:   "#00e5c0", gold:  "#f5c842", coral: "#ff6b6b", blue: "#3b9eff",
  orange: "#ff9f43", purple:"#9b6dff",
};

// ── Vital normal ranges (display-only flagging, not clinical decision support) ─
const VITAL_RANGES = {
  hr:   [60,  100],
  rr:   [12,  20 ],
  spo2: [95,  100],
  temp: [97.0, 99.5],
  bp:   [90,  140],   // systolic only
};

function flagVital(key, raw) {
  if (!raw) return { display: "\u2014", abnormal: false };
  const numStr = key === "bp" ? String(raw).split("/")[0] : String(raw);
  const n = parseFloat(numStr);
  if (isNaN(n)) return { display: String(raw), abnormal: false };
  const r = VITAL_RANGES[key];
  return { display: String(raw), abnormal: r ? (n < r[0] || n > r[1]) : false };
}

// ── State extractors ──────────────────────────────────────────────────────────
function extractRosPositives(rosState) {
  if (!rosState || typeof rosState !== "object") return [];
  const out = [];
  Object.entries(rosState).forEach(([sys, val]) => {
    if (val && typeof val === "object") {
      Object.entries(val).forEach(([sym, s]) => {
        if (s === true || s === "positive" || s === "present")
          out.push(`${sym} (${sys})`);
      });
    } else if (val === true || val === "positive") {
      out.push(sys);
    }
  });
  return out;
}

function extractPeAbnormals(peState, peFindings) {
  if (typeof peFindings === "string" && peFindings.trim())
    return [peFindings.trim()];
  if (Array.isArray(peFindings) && peFindings.length)
    return peFindings.map(String);
  if (!peState || typeof peState !== "object") return [];
  const out = [];
  Object.entries(peState).forEach(([sys, val]) => {
    if (typeof val === "string" && val.trim() && !/normal|wnl/i.test(val))
      out.push(`${sys}: ${val}`);
    else if (val && typeof val === "object") {
      const hits = Object.entries(val)
        .filter(([, s]) => s && !/normal|negative|wnl/i.test(String(s)));
      if (hits.length)
        out.push(`${sys}: ${hits.map(([k, v]) => `${k} ${v}`).join(", ")}`);
    }
  });
  return out;
}

const SDOH_LABELS = {
  housing:       "Housing instability",
  food:          "Food insecurity",
  transport:     "Transportation barriers",
  utilities:     "Utility needs",
  interpersonal: "Interpersonal safety concern",
  financial:     "Financial strain",
};
function extractSdohFlags(sdoh) {
  if (!sdoh || typeof sdoh !== "object") return [];
  return Object.entries(sdoh)
    .filter(([, v]) => v === "2" || v === 2 || v === true)
    .map(([k]) => SDOH_LABELS[k] || k);
}

function extractPmh(pmhSelected) {
  if (!pmhSelected || typeof pmhSelected !== "object") return [];
  return Object.entries(pmhSelected).filter(([, v]) => v).map(([k]) => k);
}

function extractConsults(consults) {
  if (!consults || !consults.length) return [];
  return consults.map(c =>
    typeof c === "string" ? c : c.specialty || c.text || c.name || ""
  ).filter(Boolean);
}

function patientName(demo) {
  return (
    [demo.firstName, demo.lastName].filter(Boolean).join(" ") ||
    [demo.first,     demo.last    ].filter(Boolean).join(" ") ||
    demo.name || "Unknown Patient"
  );
}

// ── Severity label ────────────────────────────────────────────────────────────
function severityInfo(esiLevel, visitMode) {
  const esi = parseInt(esiLevel);
  if (esi <= 2 || visitMode === "critical") return { label:"CRITICAL", col:T.coral  };
  if (esi === 3)                            return { label:"GUARDED",  col:T.gold   };
  if (esi >= 4  || visitMode === "simple")  return { label:"STABLE",   col:T.teal   };
  return                                           { label:"UNASSIGNED",col:T.txt4  };
}

// ── Plain-text I-PASS builder (used by copy action) ───────────────────────────
function buildIPassText({
  demo = {}, cc = {}, vitals = {}, avpu,
  medications = [], allergies = [], pmhSelected = {},
  rosState = {}, peState = {}, peFindings,
  esiLevel, visitMode, registration = {},
  sdoh = {}, consults = [], sepsisBundle = {},
  nursingInterventions = [],
  disposition, dispReason, doorTime, providerName,
  scratchpad,
}) {
  const sev     = severityInfo(esiLevel, visitMode);
  const name    = patientName(demo);
  const now     = new Date().toLocaleString([], { dateStyle:"short", timeStyle:"short" });
  const pmh     = extractPmh(pmhSelected);
  const pe      = extractPeAbnormals(peState, peFindings);
  const ros     = extractRosPositives(rosState);
  const social  = extractSdohFlags(sdoh);
  const csults  = extractConsults(consults);
  const nurses  = (nursingInterventions || [])
    .map(n => typeof n === "string" ? n : n.text || n.action || "").filter(Boolean);
  const sBundle = Object.entries(sepsisBundle).filter(([, v]) => v).map(([k]) => k);

  const VITALS_DISPLAY = [
    ["bp","BP"],["hr","HR"],["rr","RR"],["spo2","SpO2"],["temp","T"],
  ].map(([k, lbl]) => {
    const { display, abnormal } = flagVital(k, vitals[k]);
    return display !== "\u2014" ? `${lbl} ${display}${abnormal ? " \u26a0" : ""}` : null;
  }).filter(Boolean).join(" | ");

  const hr  = "\u2500".repeat(60);
  const L   = s => s + "\n";
  let t = "";

  t += L(hr);
  t += L(`I-PASS HANDOFF  \u00b7  ${name}  \u00b7  ${now}`);
  if (providerName) t += L(`Outgoing: ${providerName}  \u2192  Receiving provider`);
  if (doorTime)     t += L(`Time on board: ${doorTime}`);
  t += L(hr);
  t += "\n";

  t += L(`[I] ILLNESS SEVERITY: ${sev.label}${esiLevel ? `  (ESI ${esiLevel})` : ""}`);
  if (VITALS_DISPLAY)    t += L(`    Vitals: ${VITALS_DISPLAY}`);
  if (avpu)              t += L(`    Mental status: ${avpu}`);
  t += "\n";

  t += L("[P] PATIENT SUMMARY");
  const idParts = [
    demo.age ? `${demo.age}y ${demo.sex || ""}`.trim() : null,
    (registration.mrn || demo.mrn) ? `MRN ${registration.mrn || demo.mrn}` : null,
    demo.dob ? `DOB ${demo.dob}` : null,
    registration.room ? `Room ${registration.room}` : null,
  ].filter(Boolean);
  if (idParts.length)   t += L(`    ${idParts.join("  |  ")}`);
  if (cc.text)          t += L(`    CC: ${cc.text}`);
  if (pmh.length)       t += L(`    PMH: ${pmh.join(", ")}`);
  t += L(`    Allergies: ${allergies.length ? allergies.join(", ") : "NKA"}`);
  if (medications.length) {
    t += L(`    Medications (${medications.length}):`);
    medications.forEach(m => { t += L(`      \u2022 ${m}`); });
  }
  t += "\n";

  t += L("[A] ACTION LIST");
  if (!csults.length && !nurses.length && !sBundle.length && !disposition) {
    t += L("    (no pending actions documented)");
  } else {
    csults.forEach(c  => { t += L(`    \u2610 Consult: ${c}`); });
    nurses.forEach(a  => { t += L(`    \u2610 ${a}`); });
    if (sBundle.length) t += L(`    \u2713 Sepsis bundle stamped: ${sBundle.join(", ")}`);
    if (disposition)    t += L(`    \u2610 Disposition: ${disposition}${dispReason ? ` \u2014 ${dispReason}` : ""}`);
  }
  t += "\n";

  t += L("[S] SITUATION AWARENESS");
  if (!ros.length && !pe.length && !social.length) {
    t += L("    (no flags documented)");
  } else {
    if (ros.length)    t += L(`    ROS positives: ${ros.join(", ")}`);
    if (pe.length)     t += L(`    Key exam findings: ${pe.join(" \u00b7 ")}`);
    if (social.length) t += L(`    SDOH flags: ${social.join(", ")}`);
  }
  t += "\n";

  t += L("[S] SYNTHESIS BY RECEIVER");
  t += L(
    scratchpad?.trim()
      ? `    ${scratchpad.trim().replace(/\n/g, "\n    ")}`
      : "    (pending \u2014 complete at handoff)"
  );
  t += "\n";

  t += L(hr);
  t += L("Generated by Notrya  \u00b7  I-PASS Handoff Framework");
  return t;
}

// ── Print stylesheet ──────────────────────────────────────────────────────────
const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  .ipass-sheet, .ipass-sheet * { visibility: visible !important; }
  .ipass-no-print { display: none !important; }
  .ipass-sheet {
    position: fixed; inset: 0; width: 100%;
    padding: 28px 40px; background: #fff !important;
    color: #111 !important; font-family: 'DM Sans', sans-serif; font-size: 11pt;
  }
  .ipass-section {
    border: 1pt solid #ccc !important; background: #fafafa !important;
    border-radius: 0 !important; page-break-inside: avoid; margin-bottom: 10pt !important;
  }
  .ipass-letter-col {
    background: #f0f0f0 !important; border-right: 1pt solid #ccc !important;
  }
  .ipass-section-letter { color: #111 !important; }
  .ipass-section-title  { color: #444 !important; }
  .ipass-chip {
    border: 1pt solid #999 !important; background: transparent !important;
    color: #111 !important;
  }
  .ipass-abnormal { color: #b00 !important; font-weight: 700 !important; }
  .ipass-muted    { color: #666 !important; }
  textarea { border: 1pt solid #ccc !important; background: #fff !important; color: #111 !important; }
}
`;

// ── Sub-components ────────────────────────────────────────────────────────────
function IPassSection({ letter, title, color, children }) {
  return (
    <div className="ipass-section" style={{
      borderRadius: 12, overflow: "hidden",
      border: `1px solid ${color}33`, background: T.card,
    }}>
      <div style={{ display: "flex", alignItems: "stretch" }}>
        <div className="ipass-letter-col" style={{
          width: 48, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: `${color}10`, borderRight: `2px solid ${color}44`,
        }}>
          <span className="ipass-section-letter" style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: 24, fontWeight: 900, color,
          }}>{letter}</span>
        </div>
        <div style={{ flex: 1, padding: "14px 18px", minWidth: 0 }}>
          <div className="ipass-section-title" style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase",
            color, marginBottom: 12,
          }}>{title}</div>
          {children}
        </div>
      </div>
    </div>
  );
}

function Chip({ text, color }) {
  return (
    <span className="ipass-chip" style={{
      display: "inline-block",
      padding: "2px 9px", borderRadius: 5,
      marginRight: 5, marginBottom: 4,
      border: `1px solid ${color}44`, background: `${color}10`,
      fontFamily: "'DM Sans',sans-serif", fontSize: 11, color,
    }}>{text}</span>
  );
}

function ActionRow({ done, text, color }) {
  const fg = color || (done ? T.txt3 : T.txt2);
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 9, marginBottom: 7 }}>
      <span style={{
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: 13, color: done ? T.teal : T.txt4, flexShrink: 0, marginTop: 0,
      }}>{done ? "\u2713" : "\u2610"}</span>
      <span style={{
        fontFamily: "'DM Sans',sans-serif", fontSize: 12,
        color: fg, lineHeight: 1.5,
        textDecoration: done ? "line-through" : "none",
        opacity: done ? 0.7 : 1,
      }}>{text}</span>
    </div>
  );
}

function FieldGrid({ fields }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))",
      gap: "10px 20px", marginBottom: 14,
    }}>
      {fields.filter(f => f.value && f.value !== "\u2014").map(({ label, value }) => (
        <div key={label}>
          <div className="ipass-muted" style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 8, color: T.txt4, letterSpacing: "0.08em", marginBottom: 2,
          }}>{label}</div>
          <div style={{
            fontFamily: "'DM Sans',sans-serif",
            fontSize: 12, color: T.txt, lineHeight: 1.4,
          }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function HandoffTab({
  demo = {}, cc = {}, vitals = {}, avpu,
  medications = [], allergies = [], pmhSelected = {},
  rosState = {}, peState = {}, peFindings,
  esiLevel, visitMode = "standard", registration = {},
  sdoh = {}, consults = [], sepsisBundle = {},
  nursingInterventions = [],
  disposition, dispReason, doorTime, providerName,
  onAdvance,
}) {
  const [scratchpad, setScratchpad] = useState("");
  const [copied,     setCopied]     = useState(false);
  const [copyBusy,   setCopyBusy]   = useState(false);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const sev    = severityInfo(esiLevel, visitMode);
  const name   = patientName(demo);
  const pmh    = extractPmh(pmhSelected);
  const pe     = extractPeAbnormals(peState, peFindings);
  const ros    = extractRosPositives(rosState);
  const social = extractSdohFlags(sdoh);
  const csults = extractConsults(consults);
  const nurses = (nursingInterventions || [])
    .map(n => typeof n === "string" ? n : n.text || n.action || "").filter(Boolean);
  const sBundle = Object.entries(sepsisBundle).filter(([, v]) => v).map(([k]) => k);

  const VITALS_ROW = [
    { key:"bp",   label:"BP",    },
    { key:"hr",   label:"HR",    },
    { key:"rr",   label:"RR",    },
    { key:"spo2", label:"SpO\u2082" },
    { key:"temp", label:"Temp"   },
  ].map(({ key, label }) => ({ key, label, ...flagVital(key, vitals[key]) }))
   .filter(v => v.display !== "\u2014");

  // ── Copy handler ──────────────────────────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    if (copyBusy) return;
    setCopyBusy(true);
    try {
      const text = buildIPassText({
        demo, cc, vitals, avpu, medications, allergies, pmhSelected,
        rosState, peState, peFindings, esiLevel, visitMode, registration,
        sdoh, consults, sepsisBundle, nursingInterventions,
        disposition, dispReason, doorTime, providerName, scratchpad,
      });
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {
      // clipboard unavailable in some embedded contexts — silent
    } finally {
      setCopyBusy(false);
    }
  }, [
    demo, cc, vitals, avpu, medications, allergies, pmhSelected,
    rosState, peState, peFindings, esiLevel, visitMode, registration,
    sdoh, consults, sepsisBundle, nursingInterventions,
    disposition, dispReason, doorTime, providerName, scratchpad, copyBusy,
  ]);

  const handlePrint = useCallback(() => { window.print(); }, []);

  // ── JSX ───────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <style>{PRINT_CSS}</style>

      {/* ── Header bar ── */}
      <div className="ipass-no-print" style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, flexWrap: "wrap", paddingBottom: 16, marginBottom: 18,
        borderBottom: `1px solid ${T.bd}`, flexShrink: 0,
      }}>
        <div>
          <div style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: 17, fontWeight: 700, color: T.txt,
          }}>I-PASS Shift Handoff</div>
          <div style={{
            fontFamily: "'DM Sans',sans-serif",
            fontSize: 11, color: T.txt4, marginTop: 2,
          }}>
            {name}
            {doorTime && (
              <span style={{ color: T.txt4 }}> \u00b7 {doorTime} on board</span>
            )}
          </div>
        </div>
        <div style={{ display:"flex", gap:8, flexShrink:0, flexWrap:"wrap" }}>
          <button onClick={handleCopy} disabled={copyBusy}
            style={{
              padding: "7px 16px", borderRadius: 8,
              border: `1px solid ${copied ? T.teal + "55" : T.bd}`,
              background: copied ? `${T.teal}12` : T.up,
              color: copied ? T.teal : T.txt3,
              fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600,
              cursor: copyBusy ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 6,
              transition: "all .2s",
            }}>
            {copied ? "\u2713 Copied" : "\uD83D\uDCCB Copy I-PASS"}
          </button>
          <button onClick={handlePrint}
            style={{
              padding: "7px 16px", borderRadius: 8,
              border: `1px solid ${T.blue}44`,
              background: `${T.blue}10`, color: T.blue,
              fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}>
            \uD83D\uDDA8 Print
          </button>
          {onAdvance && (
            <button onClick={onAdvance}
              style={{
                padding: "7px 16px", borderRadius: 8, border: "none",
                background: "linear-gradient(135deg,#00e5c0,#00b4d8)",
                color: "#050f1e",
                fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700,
                cursor: "pointer",
              }}>
              Discharge \u2192
            </button>
          )}
        </div>
      </div>

      {/* ── Scrollable sheet ── */}
      <div className="ipass-sheet" style={{
        overflowY: "auto", flex: 1,
        display: "flex", flexDirection: "column", gap: 10,
        paddingBottom: 40,
      }}>

        {/* [I] Illness Severity */}
        <IPassSection letter="I" title="Illness Severity" color={sev.col}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            flexWrap: "wrap", marginBottom: 14,
          }}>
            <span style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 22, fontWeight: 900, color: sev.col,
            }}>{sev.label}</span>
            {esiLevel && (
              <span style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
                padding: "3px 10px", borderRadius: 6,
                border: `1px solid ${sev.col}44`, background: `${sev.col}10`, color: sev.col,
              }}>ESI {esiLevel}</span>
            )}
            {avpu && avpu !== "Alert" && (
              <span style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
                padding: "3px 10px", borderRadius: 6,
                border: "1px solid rgba(255,107,107,.4)",
                background: "rgba(255,107,107,.07)", color: T.coral,
              }}>\u26a0 {avpu}</span>
            )}
          </div>

          {VITALS_ROW.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {VITALS_ROW.map(({ key, label, display, abnormal }) => (
                <div key={key} style={{
                  padding: "7px 13px", borderRadius: 9,
                  border: `1px solid ${abnormal ? T.coral + "55" : "rgba(26,53,85,0.5)"}`,
                  background: abnormal ? "rgba(255,107,107,.06)" : T.up,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
                  minWidth: 52,
                }}>
                  <span className="ipass-muted" style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 8, color: T.txt4, letterSpacing: "1px",
                  }}>{label}</span>
                  <span className={abnormal ? "ipass-abnormal" : ""} style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 15, fontWeight: 700,
                    color: abnormal ? T.coral : T.txt,
                  }}>{display}</span>
                  {abnormal && (
                    <span style={{ fontSize: 9, color: T.coral, lineHeight: 1 }}>\u26a0</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <span className="ipass-muted" style={{
              fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.txt4,
            }}>No vitals entered — complete Vitals tab first.</span>
          )}
        </IPassSection>

        {/* [P] Patient Summary */}
        <IPassSection letter="P" title="Patient Summary" color={T.blue}>
          <FieldGrid fields={[
            { label:"Patient",        value: name },
            { label:"Age / Sex",      value: [demo.age ? `${demo.age}y` : null, demo.sex || null].filter(Boolean).join(" / ") },
            { label:"MRN",            value: registration.mrn || demo.mrn },
            { label:"DOB",            value: demo.dob },
            { label:"Room",           value: registration.room },
            { label:"Chief Complaint",value: cc.text },
          ]} />

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: pmh.length ? 12 : 0 }}>
            <div>
              <div className="ipass-muted" style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 8, color: T.txt4, letterSpacing: "0.08em", marginBottom: 6,
              }}>ALLERGIES</div>
              {allergies.length === 0
                ? <Chip text="NKA" color={T.teal} />
                : allergies.map(a => <Chip key={a} text={a} color={T.coral} />)
              }
            </div>
          </div>

          {pmh.length > 0 && (
            <div style={{ marginBottom: medications.length ? 12 : 0 }}>
              <div className="ipass-muted" style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 8, color: T.txt4, letterSpacing: "0.08em", marginBottom: 6,
              }}>PAST MEDICAL HISTORY</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 0 }}>
                {pmh.map(p => <Chip key={p} text={p} color={T.txt3} />)}
              </div>
            </div>
          )}

          {medications.length > 0 && (
            <div>
              <div className="ipass-muted" style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 8, color: T.txt4, letterSpacing: "0.08em", marginBottom: 6,
              }}>MEDICATIONS ({medications.length})</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 0 }}>
                {medications.map(m => <Chip key={m} text={m} color={T.blue} />)}
              </div>
            </div>
          )}
        </IPassSection>

        {/* [A] Action List */}
        <IPassSection letter="A" title="Action List" color={T.gold}>
          {!csults.length && !nurses.length && !sBundle.length && !disposition ? (
            <span className="ipass-muted" style={{
              fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.txt4,
            }}>No pending actions documented.</span>
          ) : (
            <>
              {csults.map((c, i) => (
                <ActionRow key={`c${i}`} text={`Consult: ${c}`} />
              ))}
              {nurses.map((a, i) => (
                <ActionRow key={`n${i}`} text={a} />
              ))}
              {sBundle.length > 0 && (
                <ActionRow
                  done
                  text={`Sepsis bundle stamped: ${sBundle.join(", ")}`}
                />
              )}
              {disposition && (
                <ActionRow
                  done={["Discharged","Admitted","Transferred","Left AMA"].includes(disposition)}
                  text={`Disposition: ${disposition}${dispReason ? ` \u2014 ${dispReason}` : ""}`}
                  color={T.teal}
                />
              )}
            </>
          )}
        </IPassSection>

        {/* [S] Situation Awareness */}
        <IPassSection letter="S" title="Situation Awareness & Contingency" color={T.purple}>
          {!ros.length && !pe.length && !social.length ? (
            <span className="ipass-muted" style={{
              fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.txt4,
            }}>No flags documented — complete ROS and PE tabs.</span>
          ) : (
            <>
              {ros.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div className="ipass-muted" style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 8, color: T.txt4, letterSpacing: "0.08em", marginBottom: 6,
                  }}>ROS POSITIVES</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 0 }}>
                    {ros.map(r => <Chip key={r} text={r} color={T.orange} />)}
                  </div>
                </div>
              )}
              {pe.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div className="ipass-muted" style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 8, color: T.txt4, letterSpacing: "0.08em", marginBottom: 6,
                  }}>KEY EXAM FINDINGS</div>
                  {pe.map((f, i) => (
                    <div key={i} style={{
                      fontFamily: "'DM Sans',sans-serif", fontSize: 12,
                      color: T.txt2, marginBottom: 4, lineHeight: 1.5,
                    }}>\u2022 {f}</div>
                  ))}
                </div>
              )}
              {social.length > 0 && (
                <div>
                  <div className="ipass-muted" style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 8, color: T.txt4, letterSpacing: "0.08em", marginBottom: 6,
                  }}>SDOH FLAGS</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 0 }}>
                    {social.map(s => <Chip key={s} text={s} color={T.gold} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </IPassSection>

        {/* [S] Synthesis by Receiver */}
        <IPassSection letter="S" title="Synthesis by Receiver" color={T.teal}>
          <div style={{
            fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.txt4,
            marginBottom: 10, lineHeight: 1.65,
          }}>
            Receiving provider: verbally confirm understanding of illness severity, pending actions, and contingency plan.
          </div>
          <textarea
            value={scratchpad}
            onChange={e => setScratchpad(e.target.value)}
            placeholder="Type synthesis notes, open questions, or contingency plan here..."
            rows={5}
            style={{
              width: "100%", boxSizing: "border-box",
              background: T.up, border: `1px solid ${T.teal}44`,
              borderRadius: 8, padding: "10px 12px",
              color: T.txt, fontFamily: "'DM Sans',sans-serif",
              fontSize: 12, lineHeight: 1.6,
              resize: "vertical", outline: "none",
            }}
          />
        </IPassSection>

        {/* Footer */}
        <div className="ipass-muted" style={{
          padding: "10px 14px", borderRadius: 8,
          background: T.up, border: `1px solid ${T.bd}`,
          fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
          color: T.txt4, letterSpacing: "0.08em",
          display: "flex", justifyContent: "space-between",
          flexWrap: "wrap", gap: 6,
        }}>
          <span>I-PASS \u00b7 Illness Severity \u00b7 Patient Summary \u00b7 Action List \u00b7 Situation Awareness \u00b7 Synthesis</span>
          <span>{new Date().toLocaleString([], { dateStyle:"short", timeStyle:"short" })}</span>
        </div>

      </div>
    </div>
  );
}