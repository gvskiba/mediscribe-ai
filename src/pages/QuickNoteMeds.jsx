// QuickNoteMeds.jsx
// Medications and allergies input + smart-parse + structured table
// Exported: MedsAllergyZone

import { useState } from "react";

function SectionLabel({ children, style: extraStyle }) {
  return (
    <div className="qn-section-lbl" style={{ ...(extraStyle || {}) }}>
      {children}
    </div>
  );
}

// ─── MEDICATIONS & ALLERGIES ZONE ────────────────────────────────────────────
export function MedsAllergyZone({
  medsRaw, setMedsRaw, allergiesRaw, setAllergiesRaw,
  parsedMeds, parsedAllergies, onParse, parsing, parseError,
  onEditMed, onRemoveMed, onEditAllergy, onRemoveAllergy,
}) {
  const [copiedTable, setCopiedTable] = useState(false);
  const [medsExpanded, setMedsExpanded] = useState(true);

  const copyMedsTable = () => {
    if (!parsedMeds.length && !parsedAllergies.length) return;
    const header = "MEDICATION\tDOSE\tROUTE\tFREQUENCY";
    const divider = "─".repeat(60);
    const rows = parsedMeds.map(m =>
      [m.name, m.dose, m.route, m.frequency].join("\t")
    );
    const allergyLine = parsedAllergies.length
      ? "\nALLERGIES: " + parsedAllergies.map(a => `${a.allergen} (${a.reaction})`).join(", ")
      : "";
    const text = [header, divider, ...rows, allergyLine].filter(Boolean).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopiedTable(true);
      setTimeout(() => setCopiedTable(false), 2500);
    });
  };

  const hasParsed = parsedMeds.length > 0 || parsedAllergies.length > 0;
  const hasInput  = medsRaw.trim() || allergiesRaw.trim();

  return (
    <div style={{ marginBottom:12 }}>
      {/* Section header */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6,
        cursor:"pointer" }} onClick={() => setMedsExpanded(e => !e)}>
        <SectionLabel style={{ marginBottom:0, flex:1 }}>
          Medications &amp; Allergies
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"rgba(107,158,200,.5)", background:"rgba(42,79,122,.2)",
            border:"1px solid rgba(42,79,122,.35)", borderRadius:4,
            padding:"1px 6px", marginLeft:7, letterSpacing:.5,
            verticalAlign:"middle" }}>Smart-Parse</span>
        </SectionLabel>
        {hasParsed && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"var(--qn-green)", letterSpacing:.5 }}>
            {parsedMeds.length} meds · {parsedAllergies.length} allergies
          </span>
        )}
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
          color:"var(--qn-txt4)" }}>{medsExpanded ? "▲" : "▼"}</span>
      </div>

      {medsExpanded && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          {/* Left: inputs */}
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:"var(--qn-txt4)", letterSpacing:1, textTransform:"uppercase",
                marginBottom:4 }}>Current Medications</div>
              <textarea value={medsRaw} onChange={e => setMedsRaw(e.target.value)}
                rows={5} placeholder={"metoprolol 25mg PO BID\nlisinopril 10mg daily\natorvastatin 40mg QHS\n\nor paste full med list…"}
                style={{ background:"rgba(14,37,68,.75)", border:"1px solid rgba(42,79,122,.5)",
                  borderRadius:10, padding:"8px 10px", color:"var(--qn-txt)",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:10, outline:"none",
                  width:"100%", boxSizing:"border-box", resize:"vertical",
                  lineHeight:1.6, transition:"border-color .15s" }}
                onFocus={e => e.target.style.borderColor = "rgba(0,229,192,.5)"}
                onBlur={e  => e.target.style.borderColor = "rgba(42,79,122,.5)"} />
            </div>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:"var(--qn-txt4)", letterSpacing:1, textTransform:"uppercase",
                marginBottom:4 }}>Allergies</div>
              <textarea value={allergiesRaw} onChange={e => setAllergiesRaw(e.target.value)}
                rows={2} placeholder="Penicillin — anaphylaxis\nSulfa — rash"
                style={{ background:"rgba(14,37,68,.75)", border:"1px solid rgba(42,79,122,.5)",
                  borderRadius:10, padding:"8px 10px", color:"var(--qn-txt)",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:10, outline:"none",
                  width:"100%", boxSizing:"border-box", resize:"vertical",
                  lineHeight:1.6, transition:"border-color .15s" }}
                onFocus={e => e.target.style.borderColor = "rgba(0,229,192,.5)"}
                onBlur={e  => e.target.style.borderColor = "rgba(42,79,122,.5)"} />
            </div>
            {hasInput && (
              <button onClick={onParse} disabled={parsing}
                style={{ padding:"6px 14px", borderRadius:7, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:11,
                  border:`1px solid ${parsing ? "rgba(42,79,122,.3)" : "rgba(0,229,192,.4)"}`,
                  background:parsing ? "rgba(14,37,68,.4)" : "rgba(0,229,192,.1)",
                  color:parsing ? "var(--qn-txt4)" : "var(--qn-teal)",
                  alignSelf:"flex-start", transition:"all .15s" }}>
                {parsing ? "Parsing…" : "✦ Smart-Parse"}
              </button>
            )}
            {parseError && (
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                color:"var(--qn-coral)" }}>{parseError}</div>
            )}
          </div>

          {/* Right: structured table */}
          <div>
            {hasParsed ? (
              <div>
                <div style={{ display:"flex", alignItems:"center", marginBottom:6 }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                    color:"var(--qn-teal)", letterSpacing:1, textTransform:"uppercase",
                    flex:1 }}>Structured Table</div>
                  <button onClick={copyMedsTable}
                    style={{ padding:"2px 9px", borderRadius:5, cursor:"pointer",
                      fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700,
                      border:`1px solid ${copiedTable ? "rgba(61,255,160,.5)" : "rgba(0,229,192,.35)"}`,
                      background:copiedTable ? "rgba(61,255,160,.1)" : "rgba(0,229,192,.07)",
                      color:copiedTable ? "var(--qn-green)" : "var(--qn-teal)",
                      letterSpacing:.4, transition:"all .15s" }}>
                    {copiedTable ? "✓ Copied" : "Copy Table"}
                  </button>
                </div>

                {/* Medications table */}
                {parsedMeds.length > 0 && (
                  <div style={{ marginBottom:8, border:"1px solid rgba(0,229,192,.2)",
                    borderRadius:8, overflow:"hidden" }}>
                    {/* Table header */}
                    <div style={{ display:"grid",
                      gridTemplateColumns:"1fr 70px 50px 80px 24px",
                      background:"rgba(0,229,192,.06)",
                      borderBottom:"1px solid rgba(0,229,192,.15)" }}>
                      {["Medication","Dose","Route","Frequency",""].map((h,i) => (
                        <div key={i} style={{ padding:"4px 8px",
                          fontFamily:"'JetBrains Mono',monospace", fontSize:7,
                          fontWeight:700, color:"var(--qn-teal)", letterSpacing:1,
                          textTransform:"uppercase" }}>{h}</div>
                      ))}
                    </div>
                    {parsedMeds.map((med, i) => (
                      <div key={i} style={{ display:"grid",
                        gridTemplateColumns:"1fr 70px 50px 80px 24px",
                        borderBottom: i < parsedMeds.length-1 ? "1px solid rgba(42,79,122,.2)" : "none" }}>
                        {[med.name, med.dose, med.route, med.frequency].map((val, ci) => (
                          <div key={ci} contentEditable suppressContentEditableWarning
                            onBlur={e => onEditMed && onEditMed(i,
                              ["name","dose","route","frequency"][ci],
                              e.currentTarget.textContent)}
                            style={{ padding:"4px 8px",
                              fontFamily:"'JetBrains Mono',monospace",
                              fontSize:9, color: ci === 0 ? "var(--qn-txt)" : "var(--qn-txt3)",
                              outline:"none", cursor:"text",
                              background: ci === 0 ? "transparent" : "rgba(8,22,40,.4)" }}>
                            {val || "—"}
                          </div>
                        ))}
                        <div style={{ padding:"4px 4px", display:"flex",
                          alignItems:"center", justifyContent:"center" }}>
                          <button onClick={() => onRemoveMed && onRemoveMed(i)}
                            style={{ background:"transparent", border:"none",
                              cursor:"pointer", color:"var(--qn-txt4)", fontSize:12,
                              lineHeight:1, opacity:.5 }}>×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Allergies */}
                {parsedAllergies.length > 0 && (
                  <div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                      color:"var(--qn-coral)", letterSpacing:1, textTransform:"uppercase",
                      marginBottom:4 }}>Allergies</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                      {parsedAllergies.map((a, i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center",
                          gap:7, padding:"4px 8px", borderRadius:6,
                          background:"rgba(255,107,107,.06)",
                          border:"1px solid rgba(255,107,107,.2)" }}>
                          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                            fontWeight:600, color:"var(--qn-coral)", flex:1 }}>
                            {a.allergen}
                          </span>
                          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                            color:"var(--qn-txt4)" }}>{a.reaction}</span>
                          <button onClick={() => onRemoveAllergy && onRemoveAllergy(i)}
                            style={{ background:"transparent", border:"none",
                              cursor:"pointer", color:"var(--qn-txt4)", fontSize:12,
                              opacity:.5 }}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginTop:6, fontFamily:"'JetBrains Mono',monospace",
                  fontSize:7, color:"rgba(107,158,200,.5)", lineHeight:1.5 }}>
                  Click any cell to edit · × to remove ·
                  Included in MDM and Full Note
                </div>
              </div>
            ) : (
              <div style={{ height:"100%", display:"flex", alignItems:"center",
                justifyContent:"center", border:"1px dashed rgba(42,79,122,.35)",
                borderRadius:10, padding:16 }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:20, opacity:.3, marginBottom:6 }}>💊</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    color:"var(--qn-txt4)" }}>
                    Paste med list → Smart-Parse
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}