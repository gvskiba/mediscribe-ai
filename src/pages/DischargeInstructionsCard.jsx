// DischargeInstructionsCard.jsx
// Patient-facing discharge instructions rendered in the four-section format
// Exported: DischargeInstructionsCard

import React, { useState } from "react";

const BOILERPLATE = "Our goal in the emergency department is to identify and treat conditions that require immediate care. For further evaluation or follow-up, please contact your primary care provider.";
const REMINDER    = "These instructions support your care but do not replace medical advice. Contact your provider if symptoms change. Do not stop or adjust medications without speaking to your doctor first.";

function Section({ title, color = "var(--qn-teal)", children }) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
        color, letterSpacing:1.2, textTransform:"uppercase",
        marginBottom:7, paddingBottom:5,
        borderBottom:`1px solid ${color}22` }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export function DischargeInstructionsCard({
  dischargeInstructions: di,
  finalDiagnosis,
  demo,
  onDiagExplanationEdit,
  onCopy,
}) {
  const [editingDx, setEditingDx] = useState(false);
  const [dxDraft,   setDxDraft]   = useState("");
  const [copied,    setCopied]    = useState(false);

  if (!di) return null;

  const diagText = di.diagnosis_explanation || finalDiagnosis || "";

  // Build home care bullet list from available fields
  const homeCareItems = [
    ...(di.home_care_instructions || []),
    ...(di.medications?.length
      ? di.medications.map(m => `Take ${typeof m === "string" ? m : m.medication || m} as prescribed.`)
      : []),
    ...(di.activity ? [di.activity] : []),
    ...(di.diet     ? [di.diet]     : []),
  ];

  const handleCopy = () => {
    const patName = [demo?.firstName, demo?.lastName].filter(Boolean).join(" ");
    const dateStr = new Date().toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" });
    const lines = [
      "DISCHARGE INSTRUCTIONS",
      patName ? `Patient: ${patName}` : null,
      `Date: ${dateStr}`,
      "",
      "WHAT YOU WERE TREATED FOR:",
      diagText || "See your physician for details.",
      "",
      "HOW TO CARE FOR YOURSELF AT HOME:",
      ...(homeCareItems.length
        ? homeCareItems.map(i => `• ${i}`)
        : ["• Follow up with your doctor for specific home care instructions."]),
      "",
    ];
    if (di.return_precautions?.length) {
      lines.push("RETURN TO THE EMERGENCY DEPARTMENT OR CALL 911 IF:");
      di.return_precautions.forEach((r, i) => lines.push(`${i+1}. ${r}`));
      lines.push("");
    }
    lines.push("FOLLOW-UP CARE:");
    lines.push(di.followup || "Contact your primary care provider within 3-5 days.");
    lines.push("");
    lines.push(BOILERPLATE);
    lines.push("");
    lines.push("IMPORTANT REMINDER:");
    lines.push(REMINDER);

    const text = lines.filter(l => l !== null).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      if (onCopy) onCopy(text);
    });
  };

  return (
    <div style={{ marginTop:14, padding:"16px 18px", borderRadius:12,
      background:"rgba(61,255,160,.04)", border:"1px solid rgba(61,255,160,.25)" }}>

      {/* Card header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
          fontSize:14, color:"var(--qn-green)", flex:1 }}>
          Discharge Instructions
        </span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
          color:"rgba(61,255,160,.5)", letterSpacing:.5 }}>
          Patient-facing — no clinical codes
        </span>
        <button onClick={handleCopy}
          style={{ padding:"5px 14px", borderRadius:7, cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:11,
            border:`1px solid ${copied ? "rgba(61,255,160,.6)" : "rgba(61,255,160,.4)"}`,
            background:copied ? "rgba(61,255,160,.15)" : "rgba(61,255,160,.08)",
            color:"var(--qn-green)", transition:"all .15s" }}>
          {copied ? "✓ Copied — Paste for patient" : "🖨 Copy Discharge Instructions"}
          {!copied && <span style={{ fontFamily:"'JetBrains Mono',monospace",
            fontSize:8, opacity:.5, marginLeft:6 }}>[Shift+4]</span>}
        </button>
      </div>

      {/* ── Section 1: What You Were Treated For ─────────────────────────── */}
      <Section title="What You Were Treated For" color="var(--qn-teal)">
        {editingDx ? (
          <div>
            <textarea value={dxDraft} onChange={e => setDxDraft(e.target.value)}
              rows={3} autoFocus
              style={{ width:"100%", padding:"8px 10px", borderRadius:8, resize:"vertical",
                background:"rgba(14,37,68,.8)", border:"1px solid rgba(0,229,192,.4)",
                color:"var(--qn-txt)", fontFamily:"'DM Sans',sans-serif",
                fontSize:12, outline:"none", boxSizing:"border-box", lineHeight:1.65 }} />
            <div style={{ display:"flex", gap:6, marginTop:5 }}>
              <button onClick={() => {
                  if (onDiagExplanationEdit) onDiagExplanationEdit(dxDraft);
                  setEditingDx(false);
                }}
                style={{ padding:"3px 10px", borderRadius:6, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                  border:"1px solid rgba(0,229,192,.4)", background:"rgba(0,229,192,.1)",
                  color:"var(--qn-teal)" }}>Save</button>
              <button onClick={() => setEditingDx(false)}
                style={{ padding:"3px 10px", borderRadius:6, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", fontWeight:500, fontSize:11,
                  border:"1px solid rgba(42,79,122,.4)", background:"transparent",
                  color:"var(--qn-txt4)" }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"var(--qn-txt2)",
              lineHeight:1.75, margin:0, flex:1 }}>
              {diagText || <span style={{ color:"var(--qn-txt4)", fontStyle:"italic" }}>No diagnosis explanation generated</span>}
            </p>
            {onDiagExplanationEdit && (
              <button onClick={() => { setDxDraft(diagText); setEditingDx(true); }}
                style={{ flexShrink:0, padding:"2px 8px", borderRadius:5, cursor:"pointer",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                  border:"1px solid rgba(42,79,122,.4)", background:"transparent",
                  color:"var(--qn-txt4)", letterSpacing:.4 }}>Edit</button>
            )}
          </div>
        )}
      </Section>

      {/* ── Section 2: How to Care for Yourself at Home ───────────────────── */}
      <Section title="How to Care for Yourself at Home" color="var(--qn-blue)">
        {homeCareItems.length > 0 ? (
          <ul style={{ margin:0, paddingLeft:0, listStyle:"none", display:"flex",
            flexDirection:"column", gap:6 }}>
            {homeCareItems.map((item, i) => (
              <li key={i} style={{ display:"flex", gap:9, alignItems:"baseline" }}>
                <span style={{ color:"var(--qn-blue)", fontWeight:700,
                  flexShrink:0, fontSize:13, lineHeight:1 }}>•</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13,
                  color:"var(--qn-txt2)", lineHeight:1.65 }}>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"var(--qn-txt4)",
            fontStyle:"italic", margin:0 }}>
            Follow up with your doctor for specific home care instructions.
          </p>
        )}
      </Section>

      {/* ── Section 3: Return to ED ───────────────────────────────────────── */}
      {di.return_precautions?.length > 0 && (
        <Section title="Return to the Emergency Department or Call 911 If:" color="var(--qn-coral)">
          <ol style={{ margin:0, paddingLeft:0, listStyle:"none", display:"flex",
            flexDirection:"column", gap:6 }}>
            {di.return_precautions.map((r, i) => (
              <li key={i} style={{ display:"flex", gap:9, alignItems:"baseline" }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11,
                  fontWeight:700, color:"var(--qn-coral)", flexShrink:0,
                  minWidth:18 }}>{i + 1}.</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13,
                  color:"var(--qn-txt2)", lineHeight:1.65 }}>
                  {typeof r === "string" ? r : r}
                </span>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* ── Section 4: Follow-Up Care ─────────────────────────────────────── */}
      <Section title="Follow-Up Care" color="var(--qn-gold)">
        <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"var(--qn-txt2)",
          lineHeight:1.75, margin:0 }}>
          {di.followup || "Contact your primary care provider within 3-5 days."}
        </p>
      </Section>

      {/* ── Boilerplate footer ────────────────────────────────────────────── */}
      <div style={{ padding:"12px 14px", borderRadius:9,
        background:"rgba(42,79,122,.15)", border:"1px solid rgba(42,79,122,.3)" }}>
        <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
          color:"var(--qn-txt3)", lineHeight:1.7, margin:"0 0 8px" }}>
          {BOILERPLATE}
        </p>
        <div style={{ paddingTop:8, borderTop:"1px solid rgba(42,79,122,.25)" }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            fontWeight:700, color:"var(--qn-txt4)", letterSpacing:1,
            textTransform:"uppercase" }}>Important Reminder: </span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:"var(--qn-txt3)", lineHeight:1.6 }}>{REMINDER}</span>
        </div>
      </div>
    </div>
  );
}