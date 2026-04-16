// CCDASmartParse.jsx
// Accepts pasted C-CDA / CCD XML (or plain text) and extracts:
//   demographics, allergies, medications, problem list (PMH), and vitals.
// Two modes:
//   1. XML mode  — pure client-side DOM parser (no AI credits) for valid C-CDA
//   2. AI mode   — InvokeLLM fallback for non-standard / free-text CCD summaries
//
// Props:
//   setDemo          (partial demo obj) => void
//   setVitals        (partial vitals obj) => void
//   setMedications   (string[]) => void  — merges, no duplicates
//   setAllergies     (string[]) => void  — merges, no duplicates
//   setPmhSelected   (obj) => void       — merges
//   onToast          (msg, type) => void
//
// Constraints: no form, no localStorage, no router, no sonner, no alert,
//   straight quotes only, border before borderTop/etc.

import { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36", up:"#0e2544",
  bd:"rgba(26,53,85,0.8)", txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43",
};

// ── C-CDA template OIDs ───────────────────────────────────────────────────────
const OID_ALLERGIES   = "2.16.840.1.113883.10.20.22.2.6.1";
const OID_MEDICATIONS = "2.16.840.1.113883.10.20.22.2.1.1";
const OID_PROBLEMS    = "2.16.840.1.113883.10.20.22.2.5.1";
const OID_VITALS      = "2.16.840.1.113883.10.20.22.2.4.1";

// LOINC vital codes → local key
const VITAL_LOINC = {
  "8867-4":"hr", "8480-6":"bp_sys", "8462-4":"bp_dia",
  "9279-1":"rr",  "59408-5":"spo2", "8310-5":"temp",
  "29463-7":"weight", "8302-2":"height",
};

// ── XML helpers ───────────────────────────────────────────────────────────────
function getAttr(el, attr) { return el?.getAttribute(attr) || ""; }
function getTag(el, tag)   { return el?.querySelector(tag) || null; }
function getAllTags(el, tag){ return [...(el?.querySelectorAll(tag) || [])]; }

function getText(el, selector) {
  const node = el?.querySelector(selector);
  return node?.textContent?.trim() || "";
}

function getDisplayName(el) {
  // Try displayName attr first, then originalText, then value
  const orig = getText(el, "originalText");
  if (orig) return orig;
  const disp = el?.querySelector("[displayName]");
  return disp ? getAttr(disp, "displayName") : "";
}

// ── Parse demographics from C-CDA <recordTarget> ──────────────────────────────
function parseDemographics(doc) {
  const patient = doc.querySelector("recordTarget patientRole patient");
  if (!patient) return null;
  const nameEl    = patient.querySelector("name");
  const firstName = [...getAllTags(nameEl, "given")].map(e => e.textContent.trim()).join(" ");
  const lastName  = getText(nameEl, "family");
  const dob       = getText(patient, "birthTime")?.replace(/^(\d{4})(\d{2})(\d{2}).*/, "$1-$2-$3") || "";
  const genderCode= patient.querySelector("administrativeGenderCode")?.getAttribute("code") || "";
  const gender    = genderCode === "M" ? "male" : genderCode === "F" ? "female" : genderCode.toLowerCase() || "";
  const mrn       = doc.querySelector("recordTarget patientRole id")?.getAttribute("extension") || "";
  return { firstName, lastName, dob, gender, mrn };
}

// ── Find section by templateId OID ────────────────────────────────────────────
function findSection(doc, oid) {
  return [...doc.querySelectorAll("section")].find(s =>
    [...s.querySelectorAll("templateId")].some(t => getAttr(t, "root") === oid)
  ) || null;
}

// ── Parse allergies ────────────────────────────────────────────────────────────
function parseAllergies(doc) {
  const sec = findSection(doc, OID_ALLERGIES);
  if (!sec) return [];
  return getAllTags(sec, "act").flatMap(act => {
    const obs = act.querySelector("observation");
    if (!obs) return [];
    // Get substance name
    const substanceEl = obs.querySelector("participant participantRole playingEntity");
    const substance = getText(substanceEl, "name") || getDisplayName(obs.querySelector("participant participantRole playingEntity code")) || "";
    if (!substance) return [];
    // Get reaction
    const reaction = obs.querySelector("entryRelationship observation value");
    const reactionText = reaction ? (getAttr(reaction, "displayName") || getText(reaction.parentElement, "originalText")) : "";
    return [reactionText ? `${substance} (${reactionText})` : substance];
  }).filter(Boolean);
}

// ── Parse medications ──────────────────────────────────────────────────────────
function parseMedications(doc) {
  const sec = findSection(doc, OID_MEDICATIONS);
  if (!sec) return [];
  return getAllTags(sec, "substanceAdministration").map(sa => {
    // Status check — skip completed/historical
    const statusCode = sa.querySelector("statusCode")?.getAttribute("code") || "";
    if (statusCode === "completed" || statusCode === "aborted") return null;

    const product = sa.querySelector("manufacturedProduct manufacturedMaterial");
    const name = getText(product, "name")
              || getDisplayName(sa.querySelector("consumable manufacturedProduct manufacturedMaterial code"))
              || "";
    if (!name) return null;

    // Dose
    const dose  = sa.querySelector("doseQuantity")?.getAttribute("value") || "";
    const unit  = sa.querySelector("doseQuantity")?.getAttribute("unit") || "";
    const route = sa.querySelector("routeCode")?.getAttribute("displayName") || "";
    const parts = [name];
    if (dose) parts.push(`${dose}${unit}`);
    if (route) parts.push(route);
    return parts.join(" ");
  }).filter(Boolean);
}

// ── Parse problem list ─────────────────────────────────────────────────────────
function parseProblems(doc) {
  const sec = findSection(doc, OID_PROBLEMS);
  if (!sec) return [];
  return getAllTags(sec, "observation").map(obs => {
    // Only active
    const status = obs.querySelector("value")?.getAttribute("code") || "";
    // SNOMED "55561003" = Active, skip resolved (73425007)
    if (status === "73425007") return null;
    const valueEl = obs.querySelector("value");
    return getAttr(valueEl, "displayName") || getText(obs, "originalText") || null;
  }).filter(Boolean);
}

// ── Parse vitals ───────────────────────────────────────────────────────────────
function parseVitals(doc) {
  const sec = findSection(doc, OID_VITALS);
  if (!sec) return {};

  const result = {};
  const bpParts = {};

  // Grab the most recent organizer
  const organizers = getAllTags(sec, "organizer");
  const organizer  = organizers[0]; // first = most recent in sorted doc
  if (!organizer) return result;

  getAllTags(organizer, "observation").forEach(obs => {
    const loincCode = obs.querySelector("code")?.getAttribute("code") || "";
    const localKey  = VITAL_LOINC[loincCode];
    if (!localKey) return;

    const valEl = obs.querySelector("value");
    const val   = valEl?.getAttribute("value") || valEl?.textContent?.trim() || "";
    const unit  = valEl?.getAttribute("unit") || "";
    if (!val) return;

    if (localKey === "temp") {
      // Convert C to F if needed
      const numVal = parseFloat(val);
      const finalVal = (unit === "Cel" || unit === "C") ? String(Math.round((numVal * 9/5 + 32) * 10) / 10) : String(Math.round(numVal * 10) / 10);
      result.temp = finalVal;
    } else if (localKey === "bp_sys") {
      bpParts.sys = Math.round(parseFloat(val));
    } else if (localKey === "bp_dia") {
      bpParts.dia = Math.round(parseFloat(val));
    } else if (localKey === "spo2") {
      result.spo2 = String(Math.round(parseFloat(val)));
    } else if (localKey === "weight") {
      // Convert lbs to kg if needed
      const numVal = parseFloat(val);
      result.weight = unit === "[lb_av]" ? String(Math.round(numVal * 0.453592 * 10) / 10) : String(Math.round(numVal * 10) / 10);
    } else {
      result[localKey] = String(Math.round(parseFloat(val) * 10) / 10);
    }
  });

  if (bpParts.sys && bpParts.dia) result.bp = `${bpParts.sys}/${bpParts.dia}`;

  return result;
}

// ── XML parse entry point ──────────────────────────────────────────────────────
function parseCCDA(xmlText) {
  const parser = new DOMParser();
  const doc    = parser.parseFromString(xmlText, "application/xml");

  // Check for parse error
  if (doc.querySelector("parsererror")) {
    throw new Error("Invalid XML — try AI mode");
  }

  return {
    demographics: parseDemographics(doc),
    allergies:    parseAllergies(doc),
    medications:  parseMedications(doc),
    problems:     parseProblems(doc),
    vitals:       parseVitals(doc),
  };
}

// ── AI fallback prompt ─────────────────────────────────────────────────────────
const AI_SCHEMA = {
  type:"object",
  properties:{
    demographics:{
      type:"object",
      properties:{
        firstName:{type:"string"}, lastName:{type:"string"},
        dob:{type:"string"}, gender:{type:"string"}, mrn:{type:"string"},
      }
    },
    allergies:  { type:"array", items:{type:"string"} },
    medications:{ type:"array", items:{type:"string"} },
    problems:   { type:"array", items:{type:"string"} },
    vitals:{
      type:"object",
      properties:{
        bp:{type:"string"}, hr:{type:"string"}, rr:{type:"string"},
        spo2:{type:"string"}, temp:{type:"string"}, weight:{type:"string"}, height:{type:"string"},
      }
    },
  }
};

async function aiParseCCDA(text) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a clinical data extraction engine. Parse the following clinical summary document (C-CDA, CCD, or structured clinical text) and extract all available clinical data.

Document:
${text.slice(0, 8000)}

Return a JSON object with these sections:
- demographics: { firstName, lastName, dob (YYYY-MM-DD), gender (male/female/other), mrn }
- allergies: array of strings like "Penicillin (hives)" or "Latex"
- medications: array of strings like "Lisinopril 10mg daily"
- problems: array of active problem/diagnosis strings
- vitals: { bp ("120/80"), hr ("72"), rr ("16"), spo2 ("98"), temp ("98.6"), weight (kg), height (cm) }

Only include fields you are confident about. Omit absent or unclear data.`,
    response_json_schema: AI_SCHEMA,
  });
  return result;
}

// ── Result preview section ─────────────────────────────────────────────────────
function PreviewSection({ icon, title, color, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:color, letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:6, display:"flex", alignItems:"center", gap:6 }}>
        <span style={{ fontSize:12 }}>{icon}</span>{title} ({items.length})
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
        {items.map((item, i) => (
          <span key={i} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, padding:"2px 9px", borderRadius:20, background:`${color}12`, border:`1px solid ${color}30`, color:color }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function VitalsPreview({ vitals, color }) {
  const entries = Object.entries(vitals || {}).filter(([, v]) => v);
  if (!entries.length) return null;
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:color, letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:6, display:"flex", alignItems:"center", gap:6 }}>
        <span style={{ fontSize:12 }}>📊</span>Vitals ({entries.length})
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
        {entries.map(([k, v]) => (
          <span key={k} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, padding:"2px 9px", borderRadius:20, background:`${color}12`, border:`1px solid ${color}30`, color:color }}>
            {k.toUpperCase()}: {v}
          </span>
        ))}
      </div>
    </div>
  );
}

function DemoPreview({ demo, color }) {
  if (!demo) return null;
  const parts = [demo.firstName, demo.lastName].filter(Boolean).join(" ");
  if (!parts && !demo.dob && !demo.mrn) return null;
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:color, letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:6, display:"flex", alignItems:"center", gap:6 }}>
        <span style={{ fontSize:12 }}>👤</span>Demographics
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
        {[
          parts && `Name: ${parts}`,
          demo.dob && `DOB: ${demo.dob}`,
          demo.gender && `Gender: ${demo.gender}`,
          demo.mrn && `MRN: ${demo.mrn}`,
        ].filter(Boolean).map((item, i) => (
          <span key={i} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, padding:"2px 9px", borderRadius:20, background:`${color}12`, border:`1px solid ${color}30`, color:color }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function CCDASmartParse({
  setDemo, setVitals, setMedications, setAllergies, setPmhSelected, onToast,
}) {
  const [open,    setOpen]    = useState(false);
  const [text,    setText]    = useState("");
  const [busy,    setBusy]    = useState(false);
  const [mode,    setMode]    = useState("xml");   // "xml" | "ai"
  const [parsed,  setParsed]  = useState(null);    // { demographics, allergies, medications, problems, vitals }
  const [error,   setError]   = useState("");

  const close = useCallback(() => {
    if (busy) return;
    setOpen(false);
    setText("");
    setParsed(null);
    setError("");
  }, [busy]);

  // ── Parse ──────────────────────────────────────────────────────────────────
  const parse = useCallback(async () => {
    if (!text.trim()) return;
    setBusy(true);
    setParsed(null);
    setError("");
    try {
      let result;
      if (mode === "xml") {
        result = parseCCDA(text.trim());
      } else {
        result = await aiParseCCDA(text.trim());
      }

      const totalFields = [
        result.demographics?.firstName || result.demographics?.lastName,
        result.allergies?.length,
        result.medications?.length,
        result.problems?.length,
        Object.keys(result.vitals || {}).length,
      ].filter(Boolean).length;

      if (totalFields === 0) {
        setError("No clinical data found. Try switching to AI mode or paste valid C-CDA XML.");
      } else {
        setParsed(result);
      }
    } catch (err) {
      setError(err.message || "Parse failed.");
      if (mode === "xml") {
        setMode("ai");
        onToast?.("XML parse failed — switching to AI mode. Click Extract again.", "error");
      }
    } finally {
      setBusy(false);
    }
  }, [text, mode, onToast]);

  // ── Apply ──────────────────────────────────────────────────────────────────
  const apply = useCallback(() => {
    if (!parsed) return;
    let applied = 0;

    // Demographics
    if (parsed.demographics) {
      const d = parsed.demographics;
      const patch = {};
      if (d.firstName) patch.firstName = d.firstName;
      if (d.lastName)  patch.lastName  = d.lastName;
      if (d.dob)       patch.dob       = d.dob;
      if (d.gender)    patch.gender    = d.gender;
      if (d.mrn)       patch.mrn       = d.mrn;
      if (Object.keys(patch).length) { setDemo?.(prev => ({ ...prev, ...patch })); applied++; }
    }

    // Vitals
    if (parsed.vitals && Object.keys(parsed.vitals).length > 0) {
      setVitals?.(prev => ({ ...prev, ...parsed.vitals }));
      applied++;
    }

    // Allergies (merge, no duplicates)
    if (parsed.allergies?.length) {
      setAllergies?.(prev => {
        const existing = new Set(prev.map(a => a.toLowerCase()));
        const novel = parsed.allergies.filter(a => !existing.has(a.toLowerCase()));
        return [...prev, ...novel];
      });
      applied++;
    }

    // Medications (merge, no duplicates)
    if (parsed.medications?.length) {
      setMedications?.(prev => {
        const existing = new Set(prev.map(m => m.toLowerCase()));
        const novel = parsed.medications.filter(m => !existing.has(m.toLowerCase()));
        return [...prev, ...novel];
      });
      applied++;
    }

    // Problems → pmhSelected
    if (parsed.problems?.length) {
      const pmhPatch = {};
      parsed.problems.forEach(p => {
        const key = p.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "").slice(0, 40);
        if (key) pmhPatch[key] = true;
      });
      setPmhSelected?.(prev => ({ ...prev, ...pmhPatch }));
      applied++;
    }

    if (applied > 0) {
      onToast?.(`C-CDA data applied: demographics, ${parsed.allergies?.length || 0} allergies, ${parsed.medications?.length || 0} meds, ${parsed.problems?.length || 0} problems, vitals.`, "success");
    }
    close();
  }, [parsed, setDemo, setVitals, setAllergies, setMedications, setPmhSelected, onToast, close]);

  const totalItems = parsed
    ? [
        parsed.demographics?.firstName || parsed.demographics?.lastName ? 1 : 0,
        parsed.allergies?.length || 0,
        parsed.medications?.length || 0,
        parsed.problems?.length || 0,
        Object.keys(parsed.vitals || {}).length > 0 ? 1 : 0,
      ].reduce((a, b) => a + b, 0)
    : 0;

  return (
    <>
      {/* ── Trigger button ── */}
      <button onClick={() => setOpen(true)}
        title="Import C-CDA / CCD clinical summary document"
        style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 11px", borderRadius:7, cursor:"pointer", background:"rgba(155,109,255,0.1)", border:"1px solid rgba(155,109,255,0.3)", color:"#9b6dff", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, whiteSpace:"nowrap", transition:"all .15s" }}>
        📋 C-CDA Import
      </button>

      {/* ── Modal ── */}
      {open && (
        <div onClick={close}
          style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(3,8,16,0.82)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:T.panel, border:`1px solid ${T.bd}`, borderTop:`3px solid #9b6dff`, borderRadius:16, padding:"22px 26px", width:560, maxWidth:"96vw", maxHeight:"88vh", display:"flex", flexDirection:"column", boxShadow:"0 32px 96px rgba(0,0,0,.7)" }}>

            {/* Header */}
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
              <div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:T.txt }}>C-CDA Smart Import</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4, marginTop:2, lineHeight:1.5 }}>
                  Paste C-CDA XML or a CCD summary. Extracts demographics, allergies, medications, problems, and vitals.
                </div>
              </div>
              <button onClick={close}
                style={{ width:28, height:28, borderRadius:14, border:`1px solid ${T.bd}`, background:T.up, color:T.txt4, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginLeft:8 }}>
                ✕
              </button>
            </div>

            {/* Mode selector */}
            <div style={{ display:"flex", gap:4, marginBottom:12 }}>
              {[
                { id:"xml", label:"XML Mode", hint:"Native C-CDA parser — no AI credits" },
                { id:"ai",  label:"AI Mode",  hint:"LLM fallback for non-standard documents" },
              ].map(m => (
                <button key={m.id} onClick={() => { setMode(m.id); setParsed(null); setError(""); }}
                  title={m.hint}
                  style={{ padding:"5px 14px", borderRadius:7, border:`1px solid ${mode===m.id ? "#9b6dff88" : T.bd}`, background:mode===m.id ? "rgba(155,109,255,.12)" : "transparent", color:mode===m.id ? "#9b6dff" : T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600, cursor:"pointer", transition:"all .15s" }}>
                  {m.label}
                </button>
              ))}
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4, alignSelf:"center", marginLeft:4 }}>
                {mode === "xml" ? "Client-side — no data sent externally" : "Uses LLM integration credits"}
              </span>
            </div>

            {/* Paste area */}
            <textarea
              rows={7}
              autoFocus
              placeholder={mode === "xml"
                ? "Paste C-CDA / CCD XML here…\n\n<?xml version=\"1.0\"?>\n<ClinicalDocument xmlns=\"urn:hl7-org:v3\" …>"
                : "Paste a C-CDA document, CCD summary, or any structured clinical text…"}
              value={text}
              onChange={e => { setText(e.target.value); setParsed(null); setError(""); }}
              style={{ width:"100%", boxSizing:"border-box", background:T.up, border:`1px solid ${T.bd}`, borderRadius:9, padding:"10px 13px", color:T.txt, fontFamily:"'JetBrains Mono',monospace", fontSize:11, resize:"vertical", outline:"none", lineHeight:1.55, flexShrink:0 }}
            />

            {/* Error */}
            {error && (
              <div style={{ padding:"8px 11px", borderRadius:7, background:"rgba(255,107,107,.07)", border:"1px solid rgba(255,107,107,.25)", fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.coral, marginTop:8 }}>
                {error}
              </div>
            )}

            {/* Preview */}
            {parsed && totalItems > 0 && (
              <div style={{ marginTop:12, padding:"12px 14px", borderRadius:10, background:"rgba(155,109,255,.06)", border:"1px solid rgba(155,109,255,.22)", overflowY:"auto", maxHeight:240 }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"#9b6dff", letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:10 }}>
                  Extracted — review before applying
                </div>
                <DemoPreview     demo={parsed.demographics} color="#9b6dff" />
                <VitalsPreview   vitals={parsed.vitals}     color={T.teal} />
                <PreviewSection  icon="🌿" title="Allergies"   color={T.coral}  items={parsed.allergies} />
                <PreviewSection  icon="💊" title="Medications" color={T.gold}   items={parsed.medications} />
                <PreviewSection  icon="🩺" title="Problems"    color={T.blue}   items={parsed.problems} />
              </div>
            )}

            {/* Actions */}
            <div style={{ display:"flex", gap:8, marginTop:14, justifyContent:"flex-end", flexShrink:0 }}>
              <button onClick={close} disabled={busy}
                style={{ padding:"7px 16px", borderRadius:8, cursor:busy?"not-allowed":"pointer", background:"transparent", border:`1px solid ${T.bd}`, color:T.txt4, fontFamily:"'DM Sans',sans-serif", fontSize:12 }}>
                Cancel
              </button>
              {parsed && totalItems > 0 ? (
                <button onClick={apply}
                  style={{ padding:"7px 22px", borderRadius:8, cursor:"pointer", background:"linear-gradient(135deg,#9b6dff,#7b4fdd)", border:"none", color:"#fff", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700 }}>
                  ✓ Apply {totalItems} Section{totalItems !== 1 ? "s" : ""}
                </button>
              ) : (
                <button onClick={parse} disabled={busy || !text.trim()}
                  style={{ padding:"7px 22px", borderRadius:8, cursor:busy||!text.trim()?"not-allowed":"pointer", background:busy||!text.trim()?"rgba(155,109,255,.06)":"rgba(155,109,255,.18)", border:"1px solid rgba(155,109,255,.35)", color:busy||!text.trim()?T.txt4:"#9b6dff", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, transition:"all .15s" }}>
                  {busy ? "Parsing…" : mode === "xml" ? "Parse XML" : "Extract with AI"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}