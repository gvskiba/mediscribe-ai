// CCDASmartParse.jsx
// Structured clinical document import modal.
// Accepts C-CDA / CCD XML or plain-text clinical documents.
// Detects C-CDA format, parses sections via DOMParser,
// then routes extracted data to the encounter via callbacks.
// Falls back to AI extraction for unstructured text.
//
// Props:
//   open, onClose
//   onApplyDemographics  ({ firstName, lastName, dob, sex }) => void
//   onApplyMedications   (string[]) => void
//   onApplyAllergies     (string[]) => void
//   onApplyPmh           (string[]) => void
//   onApplyVitals        ({}) => void
//   onToast              (msg, type) => void
//
// Constraints: no form, no localStorage, no router, no sonner, no alert,
//   straight quotes only, border before borderTop/etc.

import { useState, useCallback } from "react";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36", up:"#0e2544",
  bd:"rgba(26,53,85,0.8)", txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff",
};

// ── C-CDA section LOINC codes ─────────────────────────────────────────────────
const CCDA_SECTIONS = {
  medications: ["10160-0"],
  allergies:   ["48765-2"],
  problems:    ["11450-4", "46240-8"],
  vitals:      ["8716-3"],
  results:     ["30954-2"],
  social:      ["29762-2"],
  procedures:  ["47519-4"],
  encounters:  ["46240-8"],
};

// ── Detect C-CDA ──────────────────────────────────────────────────────────────
function isCCDA(text) {
  const t = text.trim();
  return (
    t.startsWith("<?xml") ||
    t.includes("<ClinicalDocument") ||
    t.includes("urn:hl7-org:v3") ||
    t.includes("<ContinuityOfCareDocument") ||
    t.includes("2.16.840.1.113883")
  );
}

// ── DOM-based C-CDA parser ────────────────────────────────────────────────────
function parseCCDA(xmlText) {
  let doc;
  try {
    doc = new DOMParser().parseFromString(xmlText, "application/xml");
  } catch {
    return null;
  }
  const parseError = doc.querySelector("parsererror");
  if (parseError) return null;

  // ── Patient demographics ────────────────────────────────────────────────
  const patient = doc.querySelector("patient");
  const firstName = patient?.querySelector("given")?.textContent?.trim() || "";
  const lastName  = patient?.querySelector("family")?.textContent?.trim() || "";
  const dob       = doc.querySelector("birthTime")?.getAttribute("value") || "";
  const dobFormatted = dob.length >= 8
    ? `${dob.slice(4,6)}/${dob.slice(6,8)}/${dob.slice(0,4)}`
    : dob;
  const genderCode  = doc.querySelector("administrativeGenderCode")?.getAttribute("code") || "";
  const genderDisp  = doc.querySelector("administrativeGenderCode")?.getAttribute("displayName") || "";
  const sex = genderDisp || (genderCode === "M" ? "Male" : genderCode === "F" ? "Female" : "");

  // ── Section extractor ────────────────────────────────────────────────────
  // Finds sections by LOINC code in the component/structuredBody
  function findSection(loincs) {
    const sections = Array.from(doc.querySelectorAll("section"));
    return sections.find(sec => {
      const code = sec.querySelector("code");
      const c = code?.getAttribute("code") || "";
      return loincs.includes(c);
    }) || null;
  }

  // ── Extract medication names ─────────────────────────────────────────────
  const medSection = findSection(CCDA_SECTIONS.medications);
  const medications = [];
  if (medSection) {
    medSection.querySelectorAll("manufacturedMaterial code").forEach(c => {
      const name = c.getAttribute("displayName") || c.getAttribute("originalText") || "";
      if (name && !medications.includes(name)) medications.push(name);
    });
    // Fallback: text content of entry items
    if (!medications.length) {
      medSection.querySelectorAll("entry").forEach(entry => {
        const text = entry.querySelector("originalText, name");
        if (text?.textContent?.trim()) medications.push(text.textContent.trim());
      });
    }
  }

  // ── Extract allergies ────────────────────────────────────────────────────
  const allergySection = findSection(CCDA_SECTIONS.allergies);
  const allergies = [];
  if (allergySection) {
    allergySection.querySelectorAll("participant participantRole playingEntity code").forEach(c => {
      const name = c.getAttribute("displayName") || "";
      if (name && !allergies.includes(name)) allergies.push(name);
    });
    allergySection.querySelectorAll("observation value").forEach(v => {
      const name = v.getAttribute("displayName") || "";
      if (name && !allergies.includes(name)) allergies.push(name);
    });
  }

  // ── Extract problems ─────────────────────────────────────────────────────
  const problemSection = findSection(CCDA_SECTIONS.problems);
  const problems = [];
  if (problemSection) {
    problemSection.querySelectorAll("observation value").forEach(v => {
      const name = v.getAttribute("displayName") || "";
      if (name && !problems.includes(name)) problems.push(name);
    });
    // Fallback: text entries
    if (!problems.length) {
      problemSection.querySelectorAll("entry text, title").forEach(t => {
        const txt = t.textContent.trim();
        if (txt && txt.length > 3 && txt.length < 100 && !problems.includes(txt)) {
          problems.push(txt);
        }
      });
    }
  }

  // ── Extract vitals ───────────────────────────────────────────────────────
  const vitalSection = findSection(CCDA_SECTIONS.vitals);
  const vitals = {};
  if (vitalSection) {
    const VITAL_LOINC = {
      "8867-4":"hr","85354-9":"bp","9279-1":"rr",
      "59408-5":"spo2","8310-5":"temp","29463-7":"weight","8302-2":"height",
    };
    vitalSection.querySelectorAll("observation").forEach(obs => {
      const loinc = obs.querySelector("code")?.getAttribute("code") || "";
      const key   = VITAL_LOINC[loinc];
      if (!key || vitals[key]) return;
      const val = obs.querySelector("value")?.getAttribute("value") ||
                  obs.querySelector("value")?.textContent?.trim();
      const unit = obs.querySelector("value")?.getAttribute("unit") || "";
      if (val) {
        if (key === "temp" && (unit === "Cel" || unit === "C")) {
          vitals[key] = String(Math.round((parseFloat(val) * 9/5 + 32) * 10) / 10);
        } else {
          vitals[key] = val;
        }
      }
    });
  }

  // ── Extract most recent encounter note (for AI summary) ─────────────────
  const narrativeBlocks = Array.from(doc.querySelectorAll("text")).slice(0, 5);
  const narrativeText = narrativeBlocks
    .map(el => el.textContent.replace(/\s+/g," ").trim())
    .filter(t => t.length > 50)
    .join("\n\n")
    .slice(0, 2000);

  return {
    demographics: { firstName, lastName, dob:dobFormatted, sex },
    medications,
    allergies,
    problems,
    vitals,
    narrativeText,
    hasDemographics: Boolean(firstName || lastName || dob),
    hasMeds:        medications.length > 0,
    hasAllergies:   allergies.length > 0,
    hasProblems:    problems.length > 0,
    hasVitals:      Object.keys(vitals).length > 0,
  };
}

// ── AI fallback parser ────────────────────────────────────────────────────────
async function parseWithAI(text) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST", headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      model:"claude-sonnet-4-20250514", max_tokens:900,
      system:`Extract structured clinical data from the provided document.
Return ONLY valid JSON with these keys (omit keys if data not present):
{
  "firstName": "string",
  "lastName": "string",
  "dob": "MM/DD/YYYY",
  "sex": "Male|Female|Other",
  "medications": ["med name", ...],
  "allergies": ["allergen", ...],
  "problems": ["condition name", ...],
  "vitals": { "hr":"", "bp":"", "spo2":"", "temp":"", "rr":"" }
}
Extract only what is clearly present. Do not infer or fabricate values.`,
      messages:[{ role:"user", content:`Extract clinical data from this document:\n\n${text.slice(0,4000)}` }],
    }),
  });
  const data = await res.json();
  const raw = (data.content?.[0]?.text || "{}").replace(/```json|```/g,"").trim();
  const parsed = JSON.parse(raw);
  return {
    demographics: { firstName:parsed.firstName||"", lastName:parsed.lastName||"", dob:parsed.dob||"", sex:parsed.sex||"" },
    medications:  parsed.medications || [],
    allergies:    parsed.allergies   || [],
    problems:     parsed.problems    || [],
    vitals:       parsed.vitals      || {},
    hasDemographics: Boolean(parsed.firstName || parsed.lastName || parsed.dob),
    hasMeds:        (parsed.medications||[]).length > 0,
    hasAllergies:   (parsed.allergies||[]).length > 0,
    hasProblems:    (parsed.problems||[]).length > 0,
    hasVitals:      Object.keys(parsed.vitals||{}).length > 0,
  };
}

// ── Section preview ───────────────────────────────────────────────────────────
function ResultSection({ icon, label, color, items, selected, onToggle }) {
  if (!items || (Array.isArray(items) ? !items.length : !Object.keys(items).length)) return null;
  const list   = Array.isArray(items) ? items : Object.entries(items).map(([k,v]) => `${k.toUpperCase()}: ${v}`);
  const selCnt = list.filter(i => selected[i]).length;

  return (
    <div style={{ marginBottom:10, borderRadius:9, background:T.card, border:`1px solid ${color}28`, borderLeft:`3px solid ${color}` }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", borderBottom:`1px solid ${T.bd}` }}>
        <span style={{ fontSize:13 }}>{icon}</span>
        <span style={{ fontFamily:"'Playfair Display',serif", fontSize:12, fontWeight:700, color }}>
          {label}
        </span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4 }}>
          {selCnt}/{list.length}
        </span>
        <button onClick={() => onToggle("all", list, selCnt === list.length)}
          style={{ marginLeft:"auto", fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4, background:"transparent", border:"none", cursor:"pointer", letterSpacing:"0.5px", textTransform:"uppercase" }}>
          {selCnt === list.length ? "Deselect all" : "Select all"}
        </button>
      </div>
      <div style={{ padding:"8px 12px", display:"flex", flexDirection:"column", gap:4 }}>
        {list.map(item => (
          <label key={item} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
            <input type="checkbox" checked={!!selected[item]} onChange={() => onToggle("one", [item])}
              style={{ accentColor:color, width:13, height:13, flexShrink:0 }} />
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt2 }}>{item}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function CCDASmartParse({
  open, onClose,
  onApplyDemographics, onApplyMedications, onApplyAllergies,
  onApplyPmh, onApplyVitals, onToast,
}) {
  const [rawText,  setRawText]  = useState("");
  const [parsed,   setParsed]   = useState(null);
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState(null);
  const [isCCDADoc,setIsCCDADoc]= useState(false);

  // selected: { meds:{...}, allergies:{...}, problems:{...}, vitals:{...} }
  const [selected, setSelected] = useState({ meds:{}, allergies:{}, problems:{}, vitals:{} });

  const toggleSection = useCallback((section, mode, items, allSelected) => {
    setSelected(prev => {
      const sec = { ...prev[section] };
      if (mode === "all") {
        items.forEach(i => { sec[i] = !allSelected; });
      } else {
        items.forEach(i => { sec[i] = !sec[i]; });
      }
      return { ...prev, [section]: sec };
    });
  }, []);

  const handleParse = useCallback(async () => {
    if (!rawText.trim()) return;
    setBusy(true); setError(null); setParsed(null);
    const cdda = isCCDA(rawText);
    setIsCCDADoc(cdda);
    try {
      let result;
      if (cdda) {
        result = parseCCDA(rawText);
        if (!result) {
          // DOM parse failed — fall back to AI
          result = await parseWithAI(rawText);
        }
      } else {
        result = await parseWithAI(rawText);
      }
      setParsed(result);

      // Pre-select everything
      const meds      = Object.fromEntries((result.medications||[]).map(m => [m, true]));
      const allergies = Object.fromEntries((result.allergies||[]).map(a => [a, true]));
      const problems  = Object.fromEntries((result.problems||[]).map(p => [p, true]));
      const vitals    = Object.fromEntries(Object.entries(result.vitals||{}).map(([k,v]) => [`${k.toUpperCase()}: ${v}`, true]));
      setSelected({ meds, allergies, problems, vitals });

      const total = (result.medications?.length||0) + (result.allergies?.length||0) + (result.problems?.length||0) + Object.keys(result.vitals||{}).length;
      onToast?.(`${cdda ? "C-CDA" : "Document"} parsed — ${total} items extracted.`, "success");
    } catch (err) {
      setError("Parsing failed: " + err.message);
      onToast?.("Document parsing failed.", "error");
    } finally {
      setBusy(false);
    }
  }, [rawText, onToast]);

  const handleApply = useCallback(() => {
    if (!parsed) return;
    let count = 0;

    // Demographics (all-or-nothing)
    if (parsed.hasDemographics && onApplyDemographics) {
      onApplyDemographics(parsed.demographics);
      count++;
    }

    // Medications
    const selMeds = (parsed.medications||[]).filter(m => selected.meds[m]);
    if (selMeds.length && onApplyMedications) { onApplyMedications(selMeds); count += selMeds.length; }

    // Allergies
    const selAllergies = (parsed.allergies||[]).filter(a => selected.allergies[a]);
    if (selAllergies.length && onApplyAllergies) { onApplyAllergies(selAllergies); count += selAllergies.length; }

    // Problems → PMH
    const selProblems = (parsed.problems||[]).filter(p => selected.problems[p]);
    if (selProblems.length && onApplyPmh) { onApplyPmh(selProblems); count += selProblems.length; }

    // Vitals
    const selVitalsKeys = Object.entries(selected.vitals)
      .filter(([,v]) => v)
      .map(([k]) => k.split(":")[0].trim().toLowerCase());
    if (selVitalsKeys.length && onApplyVitals) {
      const vObj = Object.fromEntries(
        selVitalsKeys.map(k => [k, parsed.vitals[k]]).filter(([,v]) => v)
      );
      onApplyVitals(vObj);
      count += selVitalsKeys.length;
    }

    onToast?.(`${count} item${count !== 1 ? "s" : ""} applied to encounter.`, "success");
    onClose?.();
  }, [parsed, selected, onApplyDemographics, onApplyMedications, onApplyAllergies, onApplyPmh, onApplyVitals, onToast, onClose]);

  if (!open) return null;

  const totalSelected = Object.values(selected).flatMap(s => Object.values(s)).filter(Boolean).length;
  const hasDemoApplicable = parsed?.hasDemographics;

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:9990, background:"rgba(3,8,16,.72)", backdropFilter:"blur(4px)" }} />
      <div style={{ position:"fixed", inset:0, zIndex:9991, display:"flex", alignItems:"center", justifyContent:"center", padding:16, pointerEvents:"none" }}>
        <div onClick={e => e.stopPropagation()}
          style={{ width:"100%", maxWidth:620, maxHeight:"88vh", display:"flex", flexDirection:"column", background:T.panel, border:"1px solid rgba(26,53,85,.7)", borderTop:"3px solid #9b6dff", borderRadius:14, boxShadow:"0 32px 96px rgba(0,0,0,.7)", overflow:"hidden", pointerEvents:"auto" }}>

          {/* Header */}
          <div style={{ padding:"14px 18px 12px", borderBottom:`1px solid ${T.bd}`, flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:T.purple }}>
                  Import Clinical Document
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4, marginTop:1 }}>
                  C-CDA / CCD XML \u00b7 Visit summaries \u00b7 Discharge notes \u00b7 Referral letters
                </div>
              </div>
              <button onClick={onClose} style={{ width:27, height:27, borderRadius:13, border:`1px solid ${T.bd}`, background:T.up, color:T.txt4, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>\u2715</button>
            </div>
          </div>

          {/* Body */}
          <div style={{ overflowY:"auto", flex:1, padding:"14px 18px" }}>

            {!parsed && (
              <>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4, lineHeight:1.7, marginBottom:10 }}>
                  Paste a C-CDA XML document, CCD, visit summary, or any clinical document.
                  <strong style={{ color:T.txt }}> C-CDA XML</strong> is parsed directly via the browser.
                  <strong style={{ color:T.txt }}> Plain-text documents</strong> are extracted by AI.
                </div>
                <textarea
                  value={rawText} onChange={e => setRawText(e.target.value)}
                  rows={14}
                  placeholder={"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<ClinicalDocument xmlns=\"urn:hl7-org:v3\">\n  ...\n</ClinicalDocument>\n\nOR paste any clinical document, discharge summary, or referral letter."}
                  style={{ width:"100%", background:T.up, border:`1px solid ${T.bd}`, borderRadius:8, padding:"10px 12px", color:T.txt, fontFamily:"'JetBrains Mono',monospace", fontSize:11, lineHeight:1.6, resize:"vertical", outline:"none", boxSizing:"border-box", transition:"border-color .15s" }}
                  onFocus={e => e.target.style.borderColor="rgba(155,109,255,.5)"}
                  onBlur={e  => e.target.style.borderColor=T.bd}
                />
                {rawText.trim() && (
                  <div style={{ marginTop:8, fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4 }}>
                    {isCCDA(rawText)
                      ? "\u2713 C-CDA XML detected \u2014 will parse directly via DOMParser"
                      : "Plain text detected \u2014 will extract via AI"}
                  </div>
                )}
                {error && (
                  <div style={{ marginTop:8, padding:"8px 11px", borderRadius:7, background:"rgba(255,107,107,.08)", border:"1px solid rgba(255,107,107,.3)", fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.coral }}>
                    {error}
                  </div>
                )}
              </>
            )}

            {busy && (
              <div style={{ padding:"28px 16px", display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
                <style>{`@keyframes ccda-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
                <span style={{ fontSize:28, display:"inline-block", animation:"ccda-spin .9s linear infinite", color:T.purple }}>⟳</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt4 }}>
                  {isCCDADoc ? "Parsing C-CDA structure\u2026" : "Extracting data with AI\u2026"}
                </span>
              </div>
            )}

            {parsed && !busy && (
              <>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, padding:"9px 12px", borderRadius:8, background:"rgba(155,109,255,.07)", border:"1px solid rgba(155,109,255,.25)" }}>
                  <span style={{ fontSize:14 }}>{isCCDADoc ? "\uD83D\uDCCB" : "\u2728"}</span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.purple, fontWeight:600 }}>
                    {isCCDADoc ? "C-CDA parsed via DOMParser" : "Extracted via AI"}
                  </span>
                  <button onClick={() => { setParsed(null); setRawText(""); }}
                    style={{ marginLeft:"auto", fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4, background:"transparent", border:"none", cursor:"pointer", letterSpacing:"0.5px", textTransform:"uppercase" }}>
                    Paste New
                  </button>
                </div>

                {/* Demographics */}
                {hasDemoApplicable && (
                  <div style={{ marginBottom:10, padding:"10px 12px", borderRadius:9, background:T.card, border:`1px solid rgba(59,158,255,.25)`, borderLeft:`3px solid ${T.blue}` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                      <span style={{ fontSize:13 }}>\uD83D\uDC64</span>
                      <span style={{ fontFamily:"'Playfair Display',serif", fontSize:12, fontWeight:700, color:T.blue }}>Demographics</span>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4 }}>will apply all</span>
                    </div>
                    <div style={{ display:"flex", gap:16, flexWrap:"wrap", fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt2 }}>
                      {parsed.demographics.firstName && <span>First: <strong>{parsed.demographics.firstName}</strong></span>}
                      {parsed.demographics.lastName  && <span>Last: <strong>{parsed.demographics.lastName}</strong></span>}
                      {parsed.demographics.dob       && <span>DOB: <strong>{parsed.demographics.dob}</strong></span>}
                      {parsed.demographics.sex       && <span>Sex: <strong>{parsed.demographics.sex}</strong></span>}
                    </div>
                  </div>
                )}

                <ResultSection
                  icon="\uD83D\uDC8A" label="Medications" color={T.purple}
                  items={parsed.medications}
                  selected={selected.meds}
                  onToggle={(mode, items, allSel) => toggleSection("meds", mode, items, allSel)}
                />
                <ResultSection
                  icon="\u26A0\uFE0F" label="Allergies" color={T.coral}
                  items={parsed.allergies}
                  selected={selected.allergies}
                  onToggle={(mode, items, allSel) => toggleSection("allergies", mode, items, allSel)}
                />
                <ResultSection
                  icon="\uD83D\uDCCB" label="Problem List / PMH" color={T.gold}
                  items={parsed.problems}
                  selected={selected.problems}
                  onToggle={(mode, items, allSel) => toggleSection("problems", mode, items, allSel)}
                />
                <ResultSection
                  icon="\uD83D\uDCCA" label="Vitals" color={T.teal}
                  items={Object.entries(parsed.vitals||{}).map(([k,v]) => `${k.toUpperCase()}: ${v}`)}
                  selected={selected.vitals}
                  onToggle={(mode, items, allSel) => toggleSection("vitals", mode, items, allSel)}
                />

                {!parsed.hasMeds && !parsed.hasAllergies && !parsed.hasProblems && !parsed.hasVitals && !hasDemoApplicable && (
                  <div style={{ padding:"20px 16px", textAlign:"center", color:T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:12 }}>
                    No structured data could be extracted from this document.
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding:"12px 18px", borderTop:`1px solid ${T.bd}`, flexShrink:0, display:"flex", gap:8, justifyContent:"space-between", alignItems:"center" }}>
            <button onClick={onClose} style={{ padding:"8px 16px", borderRadius:7, border:`1px solid ${T.bd}`, background:"transparent", color:T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:12, cursor:"pointer" }}>
              Cancel
            </button>
            {!parsed
              ? (
                <button onClick={handleParse} disabled={busy || !rawText.trim()}
                  style={{ padding:"8px 22px", borderRadius:7, border:"none", background: rawText.trim() ? "linear-gradient(135deg,#9b6dff,#7b4de0)" : "rgba(42,77,114,.3)", color: rawText.trim() ? "#fff" : T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, cursor: rawText.trim() ? "pointer" : "not-allowed" }}>
                  {busy ? "\u22ef Parsing\u2026" : "\u2728 Parse Document"}
                </button>
              )
              : (
                <button onClick={handleApply} disabled={totalSelected === 0 && !hasDemoApplicable}
                  style={{ padding:"8px 22px", borderRadius:7, border:"none", background: totalSelected > 0 || hasDemoApplicable ? "linear-gradient(135deg,#00e5c0,#00b4d8)" : "rgba(42,77,114,.3)", color: totalSelected > 0 || hasDemoApplicable ? "#050f1e" : T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, cursor: totalSelected > 0 || hasDemoApplicable ? "pointer" : "not-allowed" }}>
                  Apply to Encounter
                  {(totalSelected > 0 || hasDemoApplicable) && ` (${totalSelected + (hasDemoApplicable ? 1 : 0)} items)`}
                </button>
              )
            }
          </div>
        </div>
      </div>
    </>
  );
}