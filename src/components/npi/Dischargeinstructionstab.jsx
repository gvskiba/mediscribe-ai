import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { DC_SECTIONS, buildDCPrompt, buildSectionPrompt, DISPOSITION_OPTS } from "@/components/npi/npiData";

export default function DischargeInstructionsTab({
  demo, cc, vitals, medications, allergies, pmhSelected,
  disposition, dispReason, dispTime, consults, sdoh,
  esiLevel, registration, providerName, doorTime,
}) {
  const [content,    setContent]    = useState(() => Object.fromEntries(DC_SECTIONS.map(s => [s.key, ""])));
  const [genState,   setGenState]   = useState("idle");
  const [lang,       setLang]       = useState("standard");
  const [copied,     setCopied]     = useState(false);
  const [editingKey, setEditingKey] = useState(null);

  const patientName     = [demo.firstName, demo.lastName].filter(Boolean).join(" ") || "Patient";
  const hasContent      = DC_SECTIONS.some(s => content[s.key]);
  const isGeneratingAll = genState === "all";
  const anyGenerating   = genState === "all" || genState.startsWith("section:");
  const transportRisk   = sdoh?.transport === "2";
  const dispOpt         = DISPOSITION_OPTS.find(o => o.val === disposition);
  const isGeneratingSec = key => genState === `section:${key}`;

  async function generateAll(overrideLang) {
    const useLang = overrideLang || lang;
    setGenState("all");
    setEditingKey(null);
    try {
      const prompt = buildDCPrompt(demo, cc, vitals, medications, allergies, pmhSelected,
        disposition, dispReason, consults, useLang);
      const schema = {
        type: "object",
        properties: Object.fromEntries(DC_SECTIONS.map(s => [s.key, { type:"string" }])),
      };
      const res = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
      if (res && typeof res === "object") setContent(prev => ({ ...prev, ...res }));
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

  function buildFullText() {
    const date = new Date().toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" });
    return [
      "DISCHARGE INSTRUCTIONS",
      `Patient: ${patientName}${demo.age ? ", " + demo.age + "y" : ""}${demo.sex ? " " + demo.sex : ""}`,
      cc.text ? `Visit reason: ${cc.text}` : "",
      `Date: ${date}`,
      `Prepared by: ${providerName || "ED Provider"}`,
      "",
      ...DC_SECTIONS
        .filter(s => content[s.key])
        .flatMap(s => [s.label.toUpperCase(), content[s.key], ""]),
      "If you have questions or your condition worsens, call your primary care provider or return to the Emergency Department.",
    ].filter(l => l !== undefined).join("\n");
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
    const sectionsHTML = DC_SECTIONS
      .filter(s => content[s.key])
      .map(s => `<section><h2>${s.icon} ${s.label}</h2><p>${(content[s.key] || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br>")}</p></section>`)
      .join("");
    win.document.write(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Discharge Instructions \u2014 ${patientName}</title>
      <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Georgia,serif;font-size:13.5px;color:#111;background:#fff;max-width:660px;margin:40px auto;padding:0 28px}header{border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:24px}h1{font-size:20px;font-weight:700;margin-bottom:6px}.meta{font-size:12px;color:#444;line-height:1.7}section{margin-bottom:22px}h2{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#111;border-left:3px solid #333;padding-left:9px;margin-bottom:7px}p{line-height:1.72;white-space:pre-wrap}footer{margin-top:32px;padding-top:12px;border-top:1px solid #ccc;font-size:11px;color:#555;line-height:1.6}@media print{body{margin:20px 28px}}</style></head><body>
      <header><h1>Discharge Instructions</h1><div class="meta"><strong>${patientName}</strong>${demo.age ? " &bull; " + demo.age + "y" : ""}${demo.sex ? " &bull; " + demo.sex : ""}${registration.mrn ? " &bull; MRN " + registration.mrn : ""}<br>${cc.text ? "Visit reason: " + cc.text.replace(/</g,"&lt;") + "<br>" : ""}Date: ${date} &bull; Prepared by: ${(providerName || "ED Provider").replace(/</g,"&lt;")}</div></header>
      ${sectionsHTML}
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
          </div>
          {!cc.text && (
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
              color:"var(--npi-gold)", padding:"6px 12px", borderRadius:6,
              background:"rgba(245,200,66,0.08)", border:"1px solid rgba(245,200,66,0.25)" }}>
              \u26a0 No chief complaint set \u2014 add one in the CC tab for better results
            </div>
          )}
          <div style={{ display:"flex", gap:10, marginTop:4 }}>
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
        </div>
      )}
    </div>
  );
}