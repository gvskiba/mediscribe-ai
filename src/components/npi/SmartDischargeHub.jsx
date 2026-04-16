import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { DC_SECTIONS, buildDCPrompt, buildSectionPrompt, DISPOSITION_OPTS, FOLLOW_UP_METHODS } from "@/components/npi/npiData";

export default function DischargeInstructionsTab({
  demo, cc, vitals, medications, allergies, pmhSelected,
  disposition, dispReason, dispTime, consults, sdoh,
  esiLevel, registration, providerName, doorTime,
  // FIX: nursing documentation now flows into discharge summary
  nursingNotes = [], nursingInterventions = [],
}) {
  const [content,    setContent]    = useState(() => Object.fromEntries(DC_SECTIONS.map(s => [s.key, ""])));
  const [genState,   setGenState]   = useState("idle");
  const [lang,       setLang]       = useState("standard");
  const [copied,     setCopied]     = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [teachback,  setTeachback]  = useState(false);

  // Structured follow-up (CEDR 2025 discharge coordination measure)
  const [followUpProvider,  setFollowUpProvider]  = useState("");
  const [followUpSpecialty, setFollowUpSpecialty] = useState("");
  const [followUpDate,      setFollowUpDate]      = useState("");
  const [followUpMethod,    setFollowUpMethod]    = useState("");

  const patientName     = [demo.firstName, demo.lastName].filter(Boolean).join(" ") || "Patient";
  const hasContent      = DC_SECTIONS.some(s => content[s.key]);
  const isGeneratingAll = genState === "all";
  const anyGenerating   = genState === "all" || genState.startsWith("section:");
  const transportRisk   = sdoh?.transport === "2";
  const phq2Score       = parseInt(sdoh?.phq2q1||"0") + parseInt(sdoh?.phq2q2||"0");
  const phq2Positive    = Boolean(sdoh?.phq2q1 && sdoh?.phq2q2 && phq2Score >= 3);
  const auditcScore     = parseInt(sdoh?.auditcq1||"0") + parseInt(sdoh?.auditcq2||"0") + parseInt(sdoh?.auditcq3||"0");
  const auditcSexLower  = (demo?.sex||"").toLowerCase();
  const auditcThresh    = auditcSexLower === "female" || auditcSexLower === "f" ? 3 : 4;
  const auditcPositive  = Boolean(sdoh?.auditcq1 && sdoh?.auditcq2 && sdoh?.auditcq3 && auditcScore >= auditcThresh);
  const dispOpt         = DISPOSITION_OPTS.find(o => o.val === disposition);
  const isGeneratingSec = key => genState === `section:${key}`;

  const followUp = followUpProvider
    ? { provider: followUpProvider, specialty: followUpSpecialty, date: followUpDate, method: followUpMethod }
    : null;

  // ── Build nursing context string ─────────────────────────────────────────
  function buildNursingContext() {
    const interventionLines = nursingInterventions
      .map(n => `- Intervention: ${typeof n === "string" ? n : n.label || n.text || ""}`)
      .filter(Boolean);
    const noteLines = nursingNotes
      .map(n => `- Note: ${typeof n === "string" ? n : n.text || n.note || ""}`)
      .filter(Boolean);
    const all = [...interventionLines, ...noteLines];
    return all.length
      ? `\n\nNURSING DOCUMENTATION (incorporate relevant items into home care and activity sections):\n${all.join("\n")}`
      : "";
  }

  async function generateAll(overrideLang, andCopy = false) {
    const useLang = overrideLang || lang;
    setGenState("all");
    setEditingKey(null);
    try {
      // Append nursing context to the base prompt
      const basePrompt = buildDCPrompt(demo, cc, vitals, medications, allergies, pmhSelected,
        disposition, dispReason, consults, useLang, followUp);
      const prompt = basePrompt + buildNursingContext();

      const schema = {
        type: "object",
        properties: Object.fromEntries(DC_SECTIONS.map(s => [s.key, { type:"string" }])),
      };
      const res = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
      if (res && typeof res === "object") {
        setContent(prev => {
          const newContent = { ...prev, ...res };
          // Auto-copy immediately if requested — use the fresh result directly
          if (andCopy) {
            const text = buildFullTextFromContent(newContent);
            navigator.clipboard.writeText(text).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
            });
          }
          return newContent;
        });
      }
      setGenState("done");
    } catch(_) { setGenState("error"); }
  }

  async function regenerateSection(sec) {
    setGenState(`section:${sec.key}`);
    try {
      const prompt = buildSectionPrompt(sec.key, sec.label, demo, cc, vitals, medications,
        allergies, disposition, lang);
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: { type:"object", properties:{ [sec.key]:{ type:"string" } } },
      });
      if (res?.[sec.key]) setContent(prev => ({ ...prev, [sec.key]: res[sec.key] }));
      setGenState("done");
    } catch(_) { setGenState("done"); }
  }

  function buildFollowUpSummary() {
    if (!followUpProvider) return "";
    const parts = [followUpProvider];
    if (followUpSpecialty) parts.push(`(${followUpSpecialty})`);
    if (followUpDate) parts.push(`on ${followUpDate}`);
    if (followUpMethod) parts.push(`— ${followUpMethod}`);
    return parts.join(" ");
  }

  // Accepts optional content override so generateAll can copy before state settles
  function buildFullTextFromContent(c) {
    const date = new Date().toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" });
    const fuLine = buildFollowUpSummary();

    const nursingItems = [
      ...nursingInterventions.map(n => `- ${typeof n === "string" ? n : n.label || n.text || ""}`),
      ...nursingNotes.map(n => `- ${typeof n === "string" ? n : n.text || n.note || ""}`),
    ].filter(Boolean);

    return [
      "DISCHARGE INSTRUCTIONS",
      `Patient: ${patientName}${demo.age ? ", " + demo.age + "y" : ""}${demo.sex ? " " + demo.sex : ""}`,
      cc.text ? `Visit reason: ${cc.text}` : "",
      `Date: ${date}`,
      `Prepared by: ${providerName || "ED Provider"}`,
      fuLine ? `Follow-up: ${fuLine}` : "",
      "",
      ...DC_SECTIONS
        .filter(s => c[s.key])
        .flatMap(s => [s.label.toUpperCase(), c[s.key], ""]),
      // Nursing documentation section — appended if present
      ...(nursingItems.length ? [
        "NURSING DOCUMENTATION",
        nursingItems.join("\n"),
        "",
      ] : []),
      "If you have questions or your condition worsens, call your primary care provider or return to the Emergency Department.",
    ].filter(l => l !== undefined && l !== "").join("\n");
  }

  function buildFullText() {
    return buildFullTextFromContent(content);
  }

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(buildFullText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch(_) {}
  }

  function printInstructions() {
    const win = window.open("", "_blank", "width=720,height=920");
    if (!win) return;
    const date = new Date().toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" });
    const fuLine = buildFollowUpSummary();
    const fuHTML = fuLine ? `<div class="fu-block"><strong>Follow-up appointment:</strong> ${fuLine.replace(/</g,"&lt;")}</div>` : "";
    const sectionsHTML = DC_SECTIONS
      .filter(s => content[s.key])
      .map(s => `<section><h2>${s.icon} ${s.label}</h2><p>${(content[s.key] || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br>")}</p></section>`)
      .join("");

    const nursingItems = [
      ...nursingInterventions.map(n => `• ${typeof n === "string" ? n : n.label || n.text || ""}`),
      ...nursingNotes.map(n => `• ${typeof n === "string" ? n : n.text || n.note || ""}`),
    ].filter(Boolean);
    const nursingHTML = nursingItems.length
      ? `<section><h2>🩺 Nursing Documentation</h2><p>${nursingItems.join("<br>")}</p></section>`
      : "";

    win.document.write(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Discharge Instructions \u2014 ${patientName}</title>
      <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Georgia,serif;font-size:13.5px;color:#111;background:#fff;max-width:660px;margin:40px auto;padding:0 28px}header{border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:24px}h1{font-size:20px;font-weight:700;margin-bottom:6px}.meta{font-size:12px;color:#444;line-height:1.7}.fu-block{margin-top:8px;padding:7px 10px;background:#f0f8f0;border-left:3px solid #2a7d4f;font-size:12px;color:#1a4d31}section{margin-bottom:22px}h2{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#111;border-left:3px solid #333;padding-left:9px;margin-bottom:7px}p{line-height:1.72;white-space:pre-wrap}footer{margin-top:32px;padding-top:12px;border-top:1px solid #ccc;font-size:11px;color:#555;line-height:1.6}@media print{body{margin:20px 28px}}</style></head><body>
      <header><h1>Discharge Instructions</h1><div class="meta"><strong>${patientName}</strong>${demo.age ? " &bull; " + demo.age + "y" : ""}${demo.sex ? " &bull; " + demo.sex : ""}${registration.mrn ? " &bull; MRN " + registration.mrn : ""}<br>${cc.text ? "Visit reason: " + cc.text.replace(/</g,"&lt;") + "<br>" : ""}Date: ${date} &bull; Prepared by: ${(providerName || "ED Provider").replace(/</g,"&lt;")}</div>${fuHTML}</header>
      ${sectionsHTML}${nursingHTML}
      <footer>If you have questions or your condition worsens, call your primary care provider or return to the Emergency Department. Keep this document for your records.</footer>
      </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  }

  const btnGhost = {
    padding:"6px 12px", borderRadius:7,
    border:"1px solid rgba(42,77,114,0.5)", background:"transparent",
    fontFamily:"'DM Sans',sans-serif", fontSize:11, cursor:"pointer",
  };

  // Nursing note count for badge
  const nursingCount = nursingInterventions.length + nursingNotes.length;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflowY:"auto" }}>

      <div style={{ padding:"11px 20px 12px", borderBottom:"1px solid rgba(26,53,85,0.4)",
        background:"rgba(5,15,30,0.6)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          flexWrap:"wrap", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
                fontSize:15, color:"var(--npi-txt)" }}>Discharge Instructions</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:"var(--npi-txt4)", marginTop:1 }}>
                {patientName}{demo.age ? ` \xb7 ${demo.age}y` : ""}{demo.sex ? ` \xb7 ${demo.sex}` : ""}
                {registration.mrn ? ` \xb7 MRN ${registration.mrn}` : ""}
              </div>
            </div>
            {cc.text && (
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
                padding:"3px 9px", borderRadius:20, background:"rgba(59,158,255,0.1)",
                border:"1px solid rgba(59,158,255,0.25)", color:"#3b9eff" }}>
                {cc.text}
              </span>
            )}
            {dispOpt && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                padding:"2px 8px", borderRadius:4, letterSpacing:.5, textTransform:"uppercase",
                background:`${dispOpt.color}15`, border:`1px solid ${dispOpt.color}44`,
                color:dispOpt.color }}>
                {dispOpt.icon} {dispOpt.label}
              </span>
            )}
            {/* Nursing documentation badge */}
            {nursingCount > 0 && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                padding:"2px 8px", borderRadius:4, letterSpacing:.5,
                background:"rgba(0,229,192,0.08)", border:"1px solid rgba(0,229,192,0.28)",
                color:"var(--npi-teal)" }}>
                \u{1F9B8} {nursingCount} nursing item{nursingCount > 1 ? "s" : ""} included
              </span>
            )}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <div style={{ display:"flex", background:"rgba(8,22,46,0.9)",
              border:"1px solid rgba(26,53,85,0.5)", borderRadius:8, overflow:"hidden" }}>
              {[["standard","Standard"],["simple","Plain English"]].map(([val,lbl]) => (
                <button key={val} onClick={() => setLang(val)}
                  style={{ padding:"5px 11px", border:"none", cursor:"pointer",
                    fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
                    background: lang===val ? "rgba(0,229,192,0.15)" : "transparent",
                    color: lang===val ? "var(--npi-teal)" : "var(--npi-txt4)",
                    transition:"all .12s" }}>
                  {lbl}
                </button>
              ))}
            </div>
            {hasContent && (
              <>
                <button onClick={copyAll} style={{ ...btnGhost,
                  color: copied ? "var(--npi-teal)" : "var(--npi-txt4)" }}>
                  {copied ? "\u2713 Copied" : "Copy"}
                </button>
                <button onClick={printInstructions} style={{ ...btnGhost, color:"var(--npi-txt4)" }}>
                  Print
                </button>
              </>
            )}
            <button onClick={() => generateAll()} disabled={anyGenerating}
              style={{ padding:"7px 18px", borderRadius:9, cursor: anyGenerating ? "default" : "pointer",
                background: anyGenerating ? "transparent" : "linear-gradient(135deg,#00e5c0,#00b4d8)",
                border: anyGenerating ? "1px solid rgba(0,229,192,0.3)" : "none",
                color: anyGenerating ? "var(--npi-teal)" : "#050f1e",
                fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:12,
                display:"flex", alignItems:"center", gap:6 }}>
              {isGeneratingAll ? "Generating\u2026" : `\u2728 ${hasContent ? "Regenerate All" : "Generate Instructions"}`}
            </button>
          </div>
        </div>
      </div>

      {transportRisk && (
        <div style={{ margin:"14px 20px 0", padding:"10px 14px", borderRadius:9,
          background:"rgba(255,159,67,0.07)", border:"1px solid rgba(255,159,67,0.3)",
          borderLeft:"3px solid #ff9f43",
          fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#ffb870",
          display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:15 }}>&#x1F697;</span>
          <span><strong>Transportation barrier</strong> \u2014 patient reported a major transport access issue. Confirm how patient will get home before discharge.</span>
        </div>
      )}

      {phq2Positive && (
        <div style={{ margin:"14px 20px 0", padding:"10px 14px", borderRadius:9,
          background:"rgba(155,109,255,0.07)", border:"1px solid rgba(155,109,255,0.3)",
          borderLeft:"3px solid #9b6dff",
          fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#c4a0ff",
          display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:15 }}>&#x1F9E0;</span>
          <span>
            <strong>PHQ-2 positive (score {phq2Score}/6)</strong> \u2014 document behavioral health follow-up or referral in discharge instructions. Consider safety assessment before discharge and ensure outpatient mental health linkage is addressed in the follow-up plan.
          </span>
        </div>
      )}

      {auditcPositive && (
        <div style={{ margin:"14px 20px 0", padding:"10px 14px", borderRadius:9,
          background:"rgba(255,159,67,0.07)", border:"1px solid rgba(255,159,67,0.3)",
          borderLeft:"3px solid #ff9f43",
          fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#ffb870",
          display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:15 }}>&#x1F37A;</span>
          <span>
            <strong>AUDIT-C positive (score {auditcScore}/12, threshold \u2265{auditcThresh})</strong> \u2014 document brief alcohol counseling or referral in discharge instructions to satisfy MIPS #431. Note follow-up resources and any referral to addiction medicine or primary care.
          </span>
        </div>
      )}

      {/* ── Structured Follow-up Coordination (CEDR 2025) ─────────────────── */}
      <div style={{ margin:"14px 20px 0", padding:"13px 16px", borderRadius:10,
        background:"rgba(14,37,68,0.7)",
        border:"1px solid rgba(0,229,192,0.18)", borderTop:"2px solid rgba(0,229,192,0.45)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:11, flexWrap:"wrap", gap:6 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:1.5,
              textTransform:"uppercase", color:"var(--npi-teal)" }}>
              Follow-up Coordination
            </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, letterSpacing:1,
              padding:"2px 7px", borderRadius:4, background:"rgba(0,229,192,0.08)",
              border:"1px solid rgba(0,229,192,0.25)", color:"var(--npi-teal)" }}>
              CEDR 2025
            </span>
          </div>
          {followUpProvider && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              color:"var(--npi-teal)", letterSpacing:.5 }}>
              \u2713 Documented
            </span>
          )}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--npi-txt4)",
              letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>Provider / Clinic</div>
            <input value={followUpProvider} onChange={e => setFollowUpProvider(e.target.value)}
              placeholder="Dr. Smith or Primary Care Clinic"
              style={{ width:"100%", background:"rgba(8,24,48,0.7)",
                border:"1px solid rgba(26,53,85,0.6)", borderRadius:7,
                padding:"6px 9px", color:"var(--npi-txt)",
                fontFamily:"'DM Sans',sans-serif", fontSize:12, outline:"none",
                boxSizing:"border-box" }} />
          </div>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--npi-txt4)",
              letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>Specialty</div>
            <input value={followUpSpecialty} onChange={e => setFollowUpSpecialty(e.target.value)}
              placeholder="e.g. Cardiology, PCP, Orthopedics"
              style={{ width:"100%", background:"rgba(8,24,48,0.7)",
                border:"1px solid rgba(26,53,85,0.6)", borderRadius:7,
                padding:"6px 9px", color:"var(--npi-txt)",
                fontFamily:"'DM Sans',sans-serif", fontSize:12, outline:"none",
                boxSizing:"border-box" }} />
          </div>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--npi-txt4)",
              letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>Date / Timeframe</div>
            <input value={followUpDate} onChange={e => setFollowUpDate(e.target.value)}
              placeholder="e.g. 05/20/2025 or within 1 week"
              style={{ width:"100%", background:"rgba(8,24,48,0.7)",
                border:"1px solid rgba(26,53,85,0.6)", borderRadius:7,
                padding:"6px 9px", color:"var(--npi-txt)",
                fontFamily:"'DM Sans',sans-serif", fontSize:12, outline:"none",
                boxSizing:"border-box" }} />
          </div>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"var(--npi-txt4)",
              letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>Method</div>
            <select value={followUpMethod} onChange={e => setFollowUpMethod(e.target.value)}
              style={{ width:"100%", background:"rgba(8,24,48,0.7)",
                border:"1px solid rgba(26,53,85,0.6)", borderRadius:7,
                padding:"6px 9px", color: followUpMethod ? "var(--npi-txt)" : "var(--npi-txt4)",
                fontFamily:"'DM Sans',sans-serif", fontSize:12, outline:"none",
                boxSizing:"border-box", appearance:"none" }}>
              <option value="">Select method...</option>
              {FOLLOW_UP_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        {!followUpProvider && (
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"var(--npi-txt4)", lineHeight:1.5 }}>
            CEDR requires a provider name, date, and communication method for the discharge coordination measure. Fill these fields before generating instructions.
          </div>
        )}
      </div>

      {genState === "error" && (
        <div style={{ margin:"14px 20px 0", padding:"10px 14px", borderRadius:9,
          background:"rgba(255,107,107,0.07)", border:"1px solid rgba(255,107,107,0.3)",
          borderLeft:"3px solid #ff6b6b", fontFamily:"'DM Sans',sans-serif", fontSize:12,
          color:"#ff8a8a", display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
          <span>\u26a0 AI generation failed \u2014 try again or fill sections manually.</span>
          <button onClick={() => setGenState("idle")} style={{ ...btnGhost, color:"var(--npi-txt4)", padding:"4px 10px" }}>Dismiss</button>
        </div>
      )}

      {!hasContent && !anyGenerating && genState !== "error" && (
        <div style={{ flex:1, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", padding:"40px 20px", gap:16 }}>
          <div style={{ fontSize:38 }}>&#x1F6AA;</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700,
            color:"var(--npi-txt)", textAlign:"center" }}>
            Generate discharge instructions
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"var(--npi-txt3)",
            textAlign:"center", maxWidth:380, lineHeight:1.65 }}>
            AI builds patient-friendly instructions across six sections from this encounter \u2014
            visit summary, medications, return precautions, follow-up, activity, and home care.
            {nursingCount > 0 && ` Nursing documentation (${nursingCount} item${nursingCount > 1 ? "s" : ""}) will be incorporated.`}
          </div>
          {!cc.text && (
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
              color:"var(--npi-gold)", padding:"6px 12px", borderRadius:6,
              background:"rgba(245,200,66,0.08)", border:"1px solid rgba(245,200,66,0.25)" }}>
              \u26a0 No chief complaint set \u2014 add one in the CC tab for better results
            </div>
          )}
          <div style={{ display:"flex", gap:10, marginTop:4, flexWrap:"wrap", justifyContent:"center" }}>
            {[["standard","Standard English"],["simple","Plain English (Grade 6)"]].map(([val,lbl]) => (
              <button key={val} onClick={() => { setLang(val); generateAll(val); }}
                style={{ padding:"10px 22px", borderRadius:9, cursor:"pointer",
                  border:`2px solid ${lang===val ? "rgba(0,229,192,0.55)" : "rgba(42,77,114,0.45)"}`,
                  background: lang===val ? "rgba(0,229,192,0.1)" : "rgba(14,37,68,0.6)",
                  color: lang===val ? "var(--npi-teal)" : "var(--npi-txt3)",
                  fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600 }}>
                \u2728 {lbl}
              </button>
            ))}
            {/* Generate & Copy — one-click discharge shortcut */}
            <button onClick={() => { setLang(lang); generateAll(lang, true); }}
              disabled={anyGenerating}
              title="Generate instructions and immediately copy to clipboard"
              style={{ padding:"10px 22px", borderRadius:9, cursor:"pointer",
                border:"2px solid rgba(59,158,255,0.45)",
                background:"rgba(59,158,255,0.09)",
                color:"var(--npi-blue)",
                fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600 }}>
              \u26a1 Generate &amp; Copy
            </button>
          </div>
        </div>
      )}

      {isGeneratingAll && (
        <div style={{ padding:"18px 20px", display:"flex", flexDirection:"column", gap:11 }}>
          <style>{`@keyframes dc-pulse{0%,100%{opacity:.4}50%{opacity:.9}}`}</style>
          {DC_SECTIONS.map((s, si) => (
            <div key={s.key} style={{ padding:"14px 16px", borderRadius:10,
              background:"rgba(14,37,68,0.5)", border:"1px solid rgba(26,53,85,0.3)",
              borderTop:`2px solid ${s.color}33` }}>
              <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:10 }}>
                <span style={{ fontSize:14 }}>{s.icon}</span>
                <div style={{ height:9, width:110, borderRadius:4,
                  background:`${s.color}25`, animation:`dc-pulse 1.5s ${si*0.1}s ease-in-out infinite` }} />
              </div>
              {[78,55,88].map((w,i) => (
                <div key={i} style={{ height:8, width:`${w}%`, borderRadius:3, marginBottom:6,
                  background:"rgba(42,77,114,0.22)",
                  animation:`dc-pulse 1.5s ${si*0.1+i*0.15}s ease-in-out infinite` }} />
              ))}
            </div>
          ))}
        </div>
      )}

      {hasContent && !isGeneratingAll && (
        <div style={{ padding:"16px 20px", display:"flex", flexDirection:"column",
          gap:11, paddingBottom:60 }}>
          {DC_SECTIONS.map(sec => {
            const text     = content[sec.key] || "";
            const isGenSec = isGeneratingSec(sec.key);
            const isEmpty  = !text;
            const isEditing = editingKey === sec.key;
            return (
              <div key={sec.key} style={{ borderRadius:11, overflow:"hidden",
                background:"rgba(14,37,68,0.7)",
                border:`1px solid ${sec.color}18`, borderTop:`2px solid ${sec.color}55` }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                  padding:"9px 14px 8px", borderBottom:"1px solid rgba(26,53,85,0.35)",
                  background:"rgba(8,18,36,0.35)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:14 }}>{sec.icon}</span>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                      color:sec.color, letterSpacing:1.5, textTransform:"uppercase" }}>
                      {sec.label}
                    </span>
                    {isEmpty && !isGenSec && (
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                        color:"var(--npi-txt4)", padding:"1px 5px", borderRadius:3,
                        background:"rgba(42,77,114,0.2)", border:"1px solid rgba(42,77,114,0.3)", letterSpacing:.5 }}>
                        empty
                      </span>
                    )}
                  </div>
                  <div style={{ display:"flex", gap:5 }}>
                    {!isEmpty && !isEditing && !isGenSec && (
                      <button onClick={() => setEditingKey(sec.key)}
                        style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                          letterSpacing:1, textTransform:"uppercase",
                          padding:"3px 8px", borderRadius:4, cursor:"pointer",
                          border:"1px solid rgba(42,77,114,0.4)", background:"transparent",
                          color:"var(--npi-txt4)" }}>
                        Edit
                      </button>
                    )}
                    {isEditing && (
                      <button onClick={() => setEditingKey(null)}
                        style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                          letterSpacing:1, textTransform:"uppercase",
                          padding:"3px 8px", borderRadius:4, cursor:"pointer",
                          border:"1px solid rgba(0,229,192,0.4)",
                          background:"rgba(0,229,192,0.08)", color:"var(--npi-teal)" }}>
                        Done
                      </button>
                    )}
                    <button onClick={() => regenerateSection(sec)} disabled={anyGenerating}
                      style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                        letterSpacing:1, textTransform:"uppercase",
                        padding:"3px 9px", borderRadius:4, cursor: anyGenerating ? "default" : "pointer",
                        border:`1px solid ${isGenSec ? sec.color+"55" : "rgba(42,77,114,0.4)"}`,
                        background: isGenSec ? `${sec.color}12` : "transparent",
                        color: isGenSec ? sec.color : "var(--npi-txt4)", transition:"all .12s" }}>
                      {isGenSec ? "\u22ef" : isEmpty ? "\u2728 Generate" : "\u21ba Redo"}
                    </button>
                  </div>
                </div>
                <div style={{ padding:"11px 14px 13px" }}>
                  {isGenSec ? (
                    <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                      {[75,55,85,62].map((w,i) => (
                        <div key={i} style={{ height:8, width:`${w}%`, borderRadius:3,
                          background:`${sec.color}18`,
                          animation:`dc-pulse 1.2s ${i*0.15}s ease-in-out infinite` }} />
                      ))}
                    </div>
                  ) : isEditing ? (
                    <textarea value={text}
                      onChange={e => setContent(p => ({ ...p, [sec.key]: e.target.value }))}
                      rows={5}
                      style={{ width:"100%", background:"rgba(8,24,48,0.75)",
                        border:"1px solid rgba(26,53,85,0.6)", borderRadius:8,
                        padding:"8px 10px", color:"var(--npi-txt)",
                        fontFamily:"'DM Sans',sans-serif", fontSize:13, lineHeight:1.65,
                        outline:"none", resize:"vertical", boxSizing:"border-box" }} />
                  ) : isEmpty ? (
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                      color:"var(--npi-txt4)", fontStyle:"italic" }}>
                      {sec.hint} \u2014 click \u2728 Generate to fill this section
                    </div>
                  ) : (
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13,
                      color:"var(--npi-txt2)", lineHeight:1.72, whiteSpace:"pre-wrap" }}>
                      {text}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Nursing documentation summary card — shown if nursing data present */}
          {nursingCount > 0 && (
            <div style={{ borderRadius:11, overflow:"hidden",
              background:"rgba(14,37,68,0.7)",
              border:"1px solid rgba(0,229,192,0.18)", borderTop:"2px solid rgba(0,229,192,0.55)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8,
                padding:"9px 14px 8px", borderBottom:"1px solid rgba(26,53,85,0.35)",
                background:"rgba(8,18,36,0.35)" }}>
                <span style={{ fontSize:14 }}>🩺</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                  color:"var(--npi-teal)", letterSpacing:1.5, textTransform:"uppercase" }}>
                  Nursing Documentation
                </span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  color:"var(--npi-txt4)", padding:"1px 5px", borderRadius:3,
                  background:"rgba(0,229,192,0.08)", border:"1px solid rgba(0,229,192,0.2)" }}>
                  included in summary
                </span>
              </div>
              <div style={{ padding:"11px 14px 13px", display:"flex", flexDirection:"column", gap:4 }}>
                {nursingInterventions.map((n, i) => (
                  <div key={i} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                    color:"var(--npi-txt2)", display:"flex", gap:8 }}>
                    <span style={{ color:"var(--npi-teal)", flexShrink:0 }}>✓</span>
                    <span>{typeof n === "string" ? n : n.label || n.text || ""}</span>
                  </div>
                ))}
                {nursingNotes.map((n, i) => (
                  <div key={i} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                    color:"var(--npi-txt3)", display:"flex", gap:8 }}>
                    <span style={{ color:"var(--npi-txt4)", flexShrink:0 }}>📝</span>
                    <span>{typeof n === "string" ? n : n.text || n.note || ""}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ padding:"10px 14px", borderRadius:9,
            background:"rgba(8,18,36,0.6)", border:"1px solid rgba(26,53,85,0.35)",
            display:"flex", alignItems:"center", justifyContent:"space-between",
            flexWrap:"wrap", gap:10 }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:"var(--npi-txt4)", display:"flex", gap:16, flexWrap:"wrap" }}>
              <span>By: <strong style={{ color:"var(--npi-txt3)" }}>{providerName || "ED Provider"}</strong></span>
              {doorTime  && <span>Door-to-doc: <strong style={{ color:"var(--npi-txt3)" }}>{doorTime}</strong></span>}
              {dispTime  && <span>Disposition: <strong style={{ color:"var(--npi-txt3)" }}>{dispTime}</strong></span>}
              <span><strong style={{ color:"var(--npi-txt3)" }}>{new Date().toLocaleDateString()}</strong></span>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={copyAll} style={{ ...btnGhost,
                color: copied ? "var(--npi-teal)" : "var(--npi-txt4)",
                borderColor: copied ? "rgba(0,229,192,0.4)" : undefined }}>
                {copied ? "\u2713 Copied" : "\uD83D\uDCCB Copy All"}
              </button>
              <button onClick={printInstructions} style={{ ...btnGhost, color:"var(--npi-txt4)" }}>
                \uD83D\uDDA8 Print
              </button>
            </div>
          </div>

          {/* ── Teach-back confirmation (Joint Commission EP.5) ── */}
          <button onClick={() => setTeachback(t => !t)}
            style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
              borderRadius:9, cursor:"pointer", textAlign:"left", width:"100%",
              background: teachback ? "rgba(0,229,192,0.07)" : "rgba(8,18,36,0.45)",
              border:`1px solid ${teachback ? "rgba(0,229,192,0.3)" : "rgba(26,53,85,0.35)"}`,
              transition:"all .15s" }}>
            <div style={{ width:16, height:16, borderRadius:4, flexShrink:0,
              background: teachback ? "var(--npi-teal)" : "transparent",
              border:`1.5px solid ${teachback ? "var(--npi-teal)" : "rgba(42,77,114,0.55)"}`,
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              {teachback && <span style={{ color:"#050f1e", fontSize:11, fontWeight:900, lineHeight:1 }}>&#x2713;</span>}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
                color: teachback ? "var(--npi-teal)" : "var(--npi-txt3)" }}>
                Teach-back confirmed
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"var(--npi-txt4)", marginTop:1 }}>
                Patient verbalized understanding of key instructions \u2014 Joint Commission EP.5 &middot; CMS discharge education standard
              </div>
            </div>
            {teachback && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, letterSpacing:1,
                padding:"2px 7px", borderRadius:4, background:"rgba(0,229,192,0.1)",
                border:"1px solid rgba(0,229,192,0.3)", color:"var(--npi-teal)", flexShrink:0 }}>
                Documented
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}