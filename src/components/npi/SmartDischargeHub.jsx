// SmartDischargeHub.jsx
// AI-powered discharge instructions with medication reconciliation,
// Beers Criteria flagging, return precaution generation, follow-up routing,
// and reading-level adjustment.
//
// Drop-in replacement for DischargeInstructionsTab.
// Update case "discharge" in NewPatientInput to import this instead.
//
// Props: demo, cc, vitals, medications, allergies, pmhSelected,
//        disposition, dispReason, dispTime, consults, sdoh,
//        esiLevel, registration, providerName, doorTime
//
// Constraints: no form, no localStorage, no router, straight quotes only,
//   single react import, border before borderTop/etc.,
//   finally { setBusy(false) } on all async functions

import { useState, useEffect, useCallback, useMemo } from "react";
import { useEncounterSummary } from "@/components/npi/useEncounterSummary";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  b:"rgba(26,53,85,0.8)", bhi:"rgba(42,79,122,0.9)",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0", cyan:"#00d4ff",
};

// ── Beers Criteria 2023 — common ED-relevant drugs ────────────────────────────
// Flagged when patient age >= 65
const BEERS_TERMS = [
  "diphenhydramine","benadryl","hydroxyzine","atarax","vistaril",
  "diazepam","valium","lorazepam","ativan","alprazolam","xanax",
  "clonazepam","klonopin","triazolam","zolpidem","ambien","zaleplon",
  "eszopiclone","lunesta","temazepam","restoril","chlordiazepoxide",
  "oxybutynin","ditropan","dicyclomine","bentyl","hyoscyamine","levsin",
  "scopolamine","promethazine","phenergan","methocarbamol","robaxin",
  "cyclobenzaprine","flexeril","carisoprodol","soma","orphenadrine",
  "meperidine","demerol","pentazocine","indomethacin","indocin",
  "ketorolac","toradol","piroxicam","meloxicam",
  "digoxin","amiodarone","nifedipine",
  "metoclopramide","reglan","trimethobenzamide",
  "glyburide","diabeta","chlorpropamide","glipizide",
  "haloperidol","haldol","thioridazine",
  "doxylamine","unisom","nyquil",
];

function isBeersDrug(name) {
  if (!name) return false;
  const n = name.toLowerCase();
  return BEERS_TERMS.some(t => n.includes(t));
}

function isAllergyConflict(name, allergies) {
  if (!name || !allergies?.length) return false;
  const n = name.toLowerCase();
  return allergies.some(a => {
    const al = (typeof a === "string" ? a : a.name || "").toLowerCase();
    return al && al.length > 2 && (n.includes(al) || al.includes(n));
  });
}

// ── Return precaution templates keyed by clinical category ────────────────────
const UNIVERSAL_PRECS = [
  "Fever greater than 101 degrees Fahrenheit (38.3 degrees Celsius)",
  "Symptoms worsen significantly or do not improve within 24 to 48 hours",
  "New or severe pain not controlled with prescribed medications",
  "Inability to keep down fluids or prescribed medications",
  "Any new concern that worries you — when in doubt, return",
];

const CATEGORY_PRECS = {
  cardiac:[
    "Chest pain, pressure, tightness, or heaviness at rest or with exertion",
    "Shortness of breath that is new or worsening",
    "Sweating, nausea, or arm/jaw pain with any discomfort",
    "Palpitations, racing heart, or feeling that your heart is skipping beats",
    "Dizziness, lightheadedness, or fainting",
    "Swelling in the legs or ankles that is new or rapidly worsening",
  ],
  neuro:[
    "Sudden severe headache unlike any previous headache",
    "Weakness, numbness, or tingling in the face, arm, or leg",
    "Difficulty speaking, understanding speech, or sudden confusion",
    "Vision changes — blurred, double, or sudden loss",
    "Difficulty walking, loss of balance, or coordination problems",
    "Seizure activity — convulsions, uncontrolled shaking, loss of consciousness",
    "Stiff neck with fever and headache together",
  ],
  respiratory:[
    "Shortness of breath at rest or with minimal activity",
    "Worsening cough, increased mucus production, or coughing up blood",
    "Oxygen saturation below 94 percent if you have a home monitor",
    "Wheezing or chest tightness not relieved by prescribed inhalers",
    "High fever with worsening cough or difficulty breathing",
  ],
  abdominal:[
    "Severe or rapidly worsening abdominal pain",
    "Vomiting blood or passing black, tarry, or bloody stools",
    "Yellowing of skin or eyes (jaundice)",
    "Inability to keep down any fluids for more than 8 hours",
    "Abdomen becomes rigid, board-like, or extremely tender to touch",
    "High fever with abdominal pain",
  ],
  musculoskeletal:[
    "Severe or rapidly increasing pain at the injury site",
    "Numbness, tingling, or weakness in the fingers or toes beyond the injury",
    "Cast or splint becomes too tight — fingers or toes cool, pale, or blue",
    "Signs of infection at the wound site — redness, warmth, swelling, pus, or red streaks",
    "Unable to bear weight after a previously weight-bearing injury",
    "Loss of motion or sensation that is new or worsening",
  ],
  wound:[
    "Increasing redness, swelling, warmth, or pus at the wound site",
    "Red streaks spreading away from the wound",
    "Wound edges pulling apart or wound reopening",
    "Fever with wound pain",
    "Numbness or tingling near the wound that is new",
  ],
  psych:[
    "Thoughts of harming yourself or others",
    "Inability to care for yourself or ensure your own safety",
    "Symptoms are significantly worsening despite medications",
    "Medication side effects that concern you",
  ],
};

function suggestPrecautions(cc, dispReason) {
  const text = ((cc || "") + " " + (dispReason || "")).toLowerCase();
  const precs = [...UNIVERSAL_PRECS];
  const seen  = new Set(UNIVERSAL_PRECS);
  const add   = (arr) => arr.forEach(p => { if (!seen.has(p)) { precs.push(p); seen.add(p); } });

  if (/chest|cardiac|heart|mi\b|acs|troponin|palpitat|syncope/.test(text)) add(CATEGORY_PRECS.cardiac);
  if (/head|neuro|stroke|seizure|tia|altered|mental|syncope|dizz/.test(text)) add(CATEGORY_PRECS.neuro);
  if (/breath|respiratory|pulm|copd|asthma|pneum|sob|hypox/.test(text)) add(CATEGORY_PRECS.respiratory);
  if (/abdom|belly|nausea|vomit|bowel|gi\b|gastro|appy|colitis/.test(text)) add(CATEGORY_PRECS.abdominal);
  if (/fractur|sprain|strain|lacerat|wound|cut|injury|ortho/.test(text)) add(CATEGORY_PRECS.musculoskeletal);
  if (/lacerat|wound|cut|suture|repair|abscess|i.d|i&d/.test(text)) add(CATEGORY_PRECS.wound);
  if (/psych|suicid|SI|depress|anxiety|mania|psychos/.test(text)) add(CATEGORY_PRECS.psych);

  return precs;
}

// ── Collapse panel wrapper ────────────────────────────────────────────────────
function Panel({ title, badge, badgeColor, accent, open, onToggle, children }) {
  const ac = accent || T.teal;
  return (
    <div style={{ marginBottom:10 }}>
      <button onClick={onToggle}
        style={{ display:"flex", alignItems:"center", gap:8, width:"100%",
          padding:"10px 14px",
          background: open
            ? `linear-gradient(135deg,${ac}12,rgba(8,22,40,0.92))`
            : "rgba(8,22,40,0.65)",
          border:`1px solid ${open ? ac+"55" : "rgba(26,53,85,0.45)"}`,
          borderRadius: open ? "10px 10px 0 0" : 10,
          cursor:"pointer", textAlign:"left", transition:"all .15s" }}>
        <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
          fontSize:13, color: open ? ac : T.txt3, flex:1 }}>{title}</span>
        {badge && (
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            fontWeight:700, padding:"2px 8px", borderRadius:4,
            background:`${badgeColor || ac}18`,
            border:`1px solid ${badgeColor || ac}40`,
            color:badgeColor || ac, letterSpacing:1,
            textTransform:"uppercase" }}>{badge}</span>
        )}
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color: open ? ac : T.txt4, letterSpacing:1, marginLeft:6 }}>
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && (
        <div style={{ padding:"12px 14px 10px",
          background:"rgba(8,22,40,0.65)",
          border:`1px solid ${ac}40`,
          borderTop:"none", borderRadius:"0 0 10px 10px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── Medication row ────────────────────────────────────────────────────────────
function MedRow({ med, onStatus, onRemove, patientAge, allergies }) {
  const name      = med.name || med.raw || "";
  const beers     = isBeersDrug(name) && parseInt(patientAge) >= 65;
  const conflict  = isAllergyConflict(name, allergies);
  const statusCol = med.status === "continue"     ? T.teal
    : med.status === "discontinue" ? T.coral
    : T.gold;

  return (
    <div style={{ display:"flex", alignItems:"center", gap:8,
      padding:"7px 10px", borderRadius:8, marginBottom:4,
      background:"rgba(14,37,68,0.55)",
      border:`1px solid ${conflict ? T.coral+"55" : beers ? T.gold+"44" : "rgba(26,53,85,0.35)"}` }}>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
            color:T.txt }}>{name}</span>
          {med.dose && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              color:T.txt4 }}>{med.dose}</span>
          )}
          {beers && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.gold, background:"rgba(245,200,66,0.1)",
              border:"1px solid rgba(245,200,66,0.3)",
              borderRadius:4, padding:"1px 6px", letterSpacing:1 }}>
              ⚠ BEERS
            </span>
          )}
          {conflict && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.coral, background:"rgba(255,107,107,0.1)",
              border:"1px solid rgba(255,107,107,0.35)",
              borderRadius:4, padding:"1px 6px", letterSpacing:1 }}>
              ⛔ ALLERGY
            </span>
          )}
        </div>
        {beers && (
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
            color:T.gold, marginTop:2 }}>
            Beers Criteria — potentially inappropriate in patients ≥65
          </div>
        )}
        {conflict && (
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
            color:T.coral, marginTop:2 }}>
            Possible allergy conflict — verify before prescribing
          </div>
        )}
      </div>

      {/* Status toggle */}
      <div style={{ display:"flex", gap:4, flexShrink:0 }}>
        {["continue","hold","discontinue"].map(s => (
          <button key={s} onClick={() => onStatus(s)}
            style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              padding:"3px 8px", borderRadius:5, cursor:"pointer",
              letterSpacing:1, textTransform:"uppercase",
              transition:"all .1s",
              border:`1px solid ${med.status===s ? statusCol+"77" : "rgba(26,53,85,0.4)"}`,
              background: med.status===s ? `${statusCol}18` : "transparent",
              color: med.status===s ? statusCol : T.txt4 }}>
            {s}
          </button>
        ))}
      </div>

      <button onClick={onRemove}
        style={{ background:"none", border:"none", color:T.txt4,
          cursor:"pointer", fontSize:12, padding:"2px 4px",
          flexShrink:0, lineHeight:1 }}>✕</button>
    </div>
  );
}

// ── Precaution row ────────────────────────────────────────────────────────────
function PrecRow({ text, onRemove }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:7,
      padding:"6px 10px", borderRadius:7, marginBottom:3,
      background:"rgba(14,37,68,0.5)",
      border:"1px solid rgba(26,53,85,0.3)" }}>
      <span style={{ color:T.coral, fontSize:8, marginTop:3, flexShrink:0 }}>▸</span>
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
        color:T.txt2, flex:1, lineHeight:1.55 }}>{text}</span>
      <button onClick={onRemove}
        style={{ background:"none", border:"none", color:T.txt4,
          cursor:"pointer", fontSize:11, padding:"1px 3px",
          flexShrink:0, lineHeight:1 }}>✕</button>
    </div>
  );
}

// ── Output section card ───────────────────────────────────────────────────────
function OutputSection({ label, content, color }) {
  if (!content) return null;
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
        color:color || T.teal, letterSpacing:1.5, textTransform:"uppercase",
        marginBottom:5, paddingBottom:4,
        borderBottom:`1px solid ${color || T.teal}28` }}>
        {label}
      </div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
        color:T.txt2, lineHeight:1.75, whiteSpace:"pre-wrap" }}>
        {content}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function SmartDischargeHub({
  demo, cc, vitals, medications, allergies, pmhSelected,
  disposition, dispReason, dispTime, consults, sdoh,
  esiLevel, registration, providerName, doorTime,
  nursingNotes = [], nursingInterventions = [],
}) {
  // ── Shared encounter preamble — prepended to AI call ────────────────────
  const { buildPreamble } = useEncounterSummary({
    demo, cc, vitals, medications, allergies,
    pmhSelected, sdoh, esiLevel, registration, disposition,
  });
  // ── Medication reconciliation state ──────────────────────────────────────
  const initMeds = useMemo(() => {
    const raw = (medications || []).map((m, i) => ({
      id: i,
      raw: typeof m === "string" ? m : (m.name || ""),
      name: typeof m === "string" ? m : (m.name || ""),
      dose: typeof m === "object" ? (m.dose || m.sig || "") : "",
      status: "continue",
    })).filter(m => m.name);
    return raw;
  }, [medications]);

  const [reconMeds,    setReconMeds]    = useState(initMeds);
  const [newMedName,   setNewMedName]   = useState("");
  const [newMedSig,    setNewMedSig]    = useState("");

  // ── Return precautions state ──────────────────────────────────────────────
  const initPrecs = useMemo(() =>
    suggestPrecautions(cc?.text || "", dispReason || ""),
    [cc, dispReason]
  );
  const [precautions,  setPrecautions]  = useState(initPrecs);
  const [newPrec,      setNewPrec]      = useState("");

  // ── Follow-up state ───────────────────────────────────────────────────────
  const [followupWith,  setFollowupWith]  = useState("");
  const [followupWhen,  setFollowupWhen]  = useState("1 week");
  const [followupNotes, setFollowupNotes] = useState("");

  // ── Settings ──────────────────────────────────────────────────────────────
  const [readingLevel,  setReadingLevel]  = useState("8th grade");
  const [language,      setLanguage]      = useState("English");

  // ── Panel open state ─────────────────────────────────────────────────────
  const [pMeds,    setPMeds]    = useState(true);
  const [pPrecs,   setPPrecs]   = useState(true);
  const [pFollowup,setPFollowup]= useState(true);
  const [pOutput,  setPOutput]  = useState(false);

  // ── AI state ──────────────────────────────────────────────────────────────
  const [busy,     setBusy]     = useState(false);
  const [result,   setResult]   = useState(null);
  const [aiErr,    setAiErr]    = useState(null);
  const [copied,   setCopied]   = useState(false);

  // ── Beers / conflict counts for badge ────────────────────────────────────
  const beersCount    = reconMeds.filter(m => isBeersDrug(m.name) && parseInt(demo?.age) >= 65).length;
  const conflictCount = reconMeds.filter(m => isAllergyConflict(m.name, allergies)).length;

  // ── Medication handlers ───────────────────────────────────────────────────
  const setMedStatus = useCallback((id, status) =>
    setReconMeds(p => p.map(m => m.id === id ? { ...m, status } : m)), []);
  const removeMed = useCallback((id) =>
    setReconMeds(p => p.filter(m => m.id !== id)), []);
  const addMed = useCallback(() => {
    if (!newMedName.trim()) return;
    setReconMeds(p => [...p, {
      id: Date.now(), raw:newMedName.trim(),
      name:newMedName.trim(), dose:newMedSig.trim(), status:"continue",
    }]);
    setNewMedName(""); setNewMedSig("");
  }, [newMedName, newMedSig]);

  // ── Precaution handlers ───────────────────────────────────────────────────
  const removePrec = useCallback((i) =>
    setPrecautions(p => p.filter((_, idx) => idx !== i)), []);
  const addPrec = useCallback(() => {
    if (!newPrec.trim()) return;
    setPrecautions(p => [...p, newPrec.trim()]);
    setNewPrec("");
  }, [newPrec]);

  // ── Build AI prompt ───────────────────────────────────────────────────────
  const buildPrompt = useCallback(() => {
    const contMeds = reconMeds.filter(m => m.status === "continue");
    const holdMeds = reconMeds.filter(m => m.status === "hold");
    const discMeds = reconMeds.filter(m => m.status === "discontinue");

    const medSection = [
      contMeds.length ? `Continue: ${contMeds.map(m => m.name + (m.dose ? " — " + m.dose : "")).join(", ")}` : "",
      holdMeds.length ? `Hold until follow-up: ${holdMeds.map(m => m.name).join(", ")}` : "",
      discMeds.length ? `Discontinue: ${discMeds.map(m => m.name).join(", ")}` : "",
    ].filter(Boolean).join("\n");

    return `${buildPreamble()}

Generate comprehensive emergency department discharge instructions.

PATIENT CONTEXT:
Age/Sex: ${demo?.age || "Unknown"}yo ${demo?.sex || ""}
Chief Complaint / Diagnosis: ${cc?.text || dispReason || "ED visit"}
Disposition: ${disposition || "discharge"} — ${dispReason || ""}
ESI Level: ${esiLevel || ""}
Provider: ${providerName || "ED Physician"}
Allergies: ${(allergies || []).join(", ") || "NKDA"}
PMH: ${(pmhSelected || []).join(", ") || "none documented"}

MEDICATIONS:
${medSection || "No medication changes"}

RETURN PRECAUTIONS (incorporate all of these):
${precautions.map((p, i) => `${i + 1}. ${p}`).join("\n")}

FOLLOW-UP:
With: ${followupWith || "primary care physician"}
When: ${followupWhen}
${followupNotes ? `Notes: ${followupNotes}` : ""}

READING LEVEL: ${readingLevel}
LANGUAGE: ${language}
${(nursingInterventions.length || nursingNotes.length) ? `
NURSING DOCUMENTATION (incorporate relevant items into home care and activity sections):
${nursingInterventions.map(n => `- Intervention: ${n}`).join("\n")||""}
${nursingNotes.map(n => `- Note: ${typeof n === "string" ? n : n.text || ""}`).filter(Boolean).join("\n")||""}
` : ""}

INSTRUCTIONS:
Write complete, warm, and clear discharge instructions at a ${readingLevel} reading level.
${language !== "English" ? `Write the instructions in ${language}.` : ""}
Use plain language — avoid medical jargon without explanation.
Format using clear section headers.
Be empathetic and reassuring while being specific about when to return.

Respond ONLY with valid JSON, no markdown fences:
{
  "diagnosis_summary": "Brief plain-language explanation of what happened",
  "home_care": "Specific home care instructions",
  "medications": "Detailed medication instructions for each listed above",
  "activity": "Activity restrictions and recommendations",
  "diet": "Dietary instructions if relevant",
  "wound_care": "Wound/procedure care if applicable — omit if not relevant",
  "return_precautions": "When to return to the ED — formatted as a readable paragraph incorporating all listed precautions",
  "followup": "Follow-up instructions with timeframe and provider type",
  "closing": "Brief warm closing message"
}`;
  }, [reconMeds, precautions, followupWith, followupWhen, followupNotes,
      readingLevel, language, demo, cc, dispReason, disposition, esiLevel,
      providerName, allergies, pmhSelected]);

  // ── Generate instructions ──────────────────────────────────────────────────
  const handleGenerate = useCallback(async (andCopy = false) => {
    setBusy(true);
    setAiErr(null);
    setResult(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "anthropic-dangerous-direct-browser-access":"true",
        },
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:2000,
          system:"You are an emergency medicine documentation assistant generating patient discharge instructions. Always respond with valid JSON only — no markdown, no preamble.",
          messages:[{ role:"user", content:buildPrompt() }],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const raw    = data.content?.find(b => b.type === "text")?.text || "{}";
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      setResult(parsed);
      setPOutput(true);
      if (andCopy) {
        // Build copy text from fresh result — state hasn't updated yet
        const nursingSection = (() => {
          const items = [
            ...nursingInterventions.map(n => `- ${n}`),
            ...nursingNotes.map(n => `- ${typeof n === "string" ? n : n.text || ""}`).filter(Boolean),
          ];
          return items.length ? `NURSING NOTES\n${items.join("\n")}` : "";
        })();
        const text = [
          parsed.diagnosis_summary  && `DIAGNOSIS\n${parsed.diagnosis_summary}`,
          parsed.home_care          && `HOME CARE\n${parsed.home_care}`,
          parsed.medications        && `MEDICATIONS\n${parsed.medications}`,
          parsed.activity           && `ACTIVITY\n${parsed.activity}`,
          parsed.diet               && `DIET\n${parsed.diet}`,
          parsed.wound_care         && `WOUND CARE\n${parsed.wound_care}`,
          parsed.return_precautions && `WHEN TO RETURN TO THE ED\n${parsed.return_precautions}`,
          parsed.followup           && `FOLLOW-UP\n${parsed.followup}`,
          nursingSection            || null,
          parsed.closing            && parsed.closing,
        ].filter(Boolean).join("\n\n");
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        });
      }
    } catch (e) {
      setAiErr("Error generating instructions: " + (e.message || "Check API connectivity"));
    } finally {
      setBusy(false);
    }
  }, [buildPrompt, nursingNotes, nursingInterventions]);

  const copyAll = useCallback(() => {
    if (!result) return;
    const nursingSection = (() => {
      const items = [
        ...nursingInterventions.map(n => `- ${n}`),
        ...nursingNotes.map(n => `- ${typeof n === "string" ? n : n.text || ""}`).filter(Boolean),
      ];
      return items.length ? `NURSING NOTES\n${items.join("\n")}` : "";
    })();
    const sections = [
      result.diagnosis_summary  && `DIAGNOSIS\n${result.diagnosis_summary}`,
      result.home_care          && `HOME CARE\n${result.home_care}`,
      result.medications        && `MEDICATIONS\n${result.medications}`,
      result.activity           && `ACTIVITY\n${result.activity}`,
      result.diet               && `DIET\n${result.diet}`,
      result.wound_care         && `WOUND CARE\n${result.wound_care}`,
      result.return_precautions && `WHEN TO RETURN TO THE ED\n${result.return_precautions}`,
      result.followup           && `FOLLOW-UP\n${result.followup}`,
      nursingSection            || null,
      result.closing            && result.closing,
    ].filter(Boolean).join("\n\n");
    navigator.clipboard.writeText(sections).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, [result, nursingNotes, nursingInterventions]);

  // ── Patient context strip ─────────────────────────────────────────────────
  const diagnosis = cc?.text || dispReason || "ED Visit";

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", color:T.txt }}>

      {/* Context strip */}
      <div style={{ padding:"10px 13px", borderRadius:10, marginBottom:12,
        background:"rgba(8,22,40,0.7)",
        border:"1px solid rgba(26,53,85,0.4)",
        display:"flex", flexWrap:"wrap", gap:12, alignItems:"center" }}>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif",
            fontWeight:700, fontSize:15, color:T.teal }}>
            Smart Discharge Instructions
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
            color:T.txt4, marginTop:1 }}>
            Medication reconciliation · AI-generated · Reading-level adjusted
          </div>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginLeft:"auto" }}>
          {[
            demo?.age && demo?.sex ? `${demo.age}yo ${demo.sex}` : null,
            diagnosis,
            esiLevel ? `ESI ${esiLevel}` : null,
            providerName || null,
          ].filter(Boolean).map(v => (
            <span key={v} style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:9, color:T.txt3, background:"rgba(42,79,122,0.2)",
              border:"1px solid rgba(42,79,122,0.35)",
              borderRadius:5, padding:"2px 8px", letterSpacing:0.5 }}>
              {v}
            </span>
          ))}
        </div>
      </div>

      {/* ── Panel 1: Medication Reconciliation ─────────────────────────────── */}
      <Panel
        title="Medication Reconciliation"
        accent={beersCount || conflictCount ? T.gold : T.teal}
        badge={
          conflictCount ? `${conflictCount} allergy conflict${conflictCount>1?"s":""}` :
          beersCount    ? `${beersCount} Beers flag${beersCount>1?"s":""}` :
          `${reconMeds.filter(m=>m.status==="continue").length} continuing`
        }
        badgeColor={conflictCount ? T.coral : beersCount ? T.gold : T.teal}
        open={pMeds} onToggle={() => setPMeds(p => !p)}>

        {reconMeds.length === 0 && (
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
            color:T.txt4, marginBottom:8, fontStyle:"italic" }}>
            No medications entered in this encounter — add below as needed.
          </div>
        )}

        {reconMeds.map(m => (
          <MedRow key={m.id} med={m}
            onStatus={s => setMedStatus(m.id, s)}
            onRemove={() => removeMed(m.id)}
            patientAge={demo?.age}
            allergies={allergies} />
        ))}

        {/* Add new med */}
        <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
          <input value={newMedName} onChange={e => setNewMedName(e.target.value)}
            placeholder="Add medication name..."
            onKeyDown={e => e.key === "Enter" && addMed()}
            style={{ flex:2, minWidth:160, padding:"6px 10px",
              background:"rgba(14,37,68,0.7)",
              border:"1px solid rgba(42,79,122,0.4)",
              borderRadius:7, outline:"none",
              fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt }} />
          <input value={newMedSig} onChange={e => setNewMedSig(e.target.value)}
            placeholder="Sig / dose..."
            onKeyDown={e => e.key === "Enter" && addMed()}
            style={{ flex:1, minWidth:120, padding:"6px 10px",
              background:"rgba(14,37,68,0.7)",
              border:"1px solid rgba(42,79,122,0.4)",
              borderRadius:7, outline:"none",
              fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt }} />
          <button onClick={addMed}
            style={{ padding:"6px 14px", borderRadius:7, cursor:"pointer",
              border:"1px solid rgba(0,229,192,0.4)",
              background:"rgba(0,229,192,0.09)", color:T.teal,
              fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12 }}>
            + Add
          </button>
        </div>

        {(beersCount > 0 || conflictCount > 0) && (
          <div style={{ marginTop:10, padding:"7px 10px", borderRadius:7,
            background:"rgba(245,200,66,0.07)",
            border:"1px solid rgba(245,200,66,0.25)",
            fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.gold,
            lineHeight:1.55 }}>
            {conflictCount > 0 && `⛔ ${conflictCount} potential allergy conflict${conflictCount>1?"s":""} detected — review before discharge. `}
            {beersCount > 0 && `⚠ ${beersCount} Beers Criteria medication${beersCount>1?"s":""} flagged for patient age ≥65 — consider alternatives or explicit indication documentation.`}
          </div>
        )}
      </Panel>

      {/* ── Panel 2: Return Precautions ─────────────────────────────────────── */}
      <Panel
        title="Return Precautions"
        accent={T.coral}
        badge={`${precautions.length} listed`}
        open={pPrecs} onToggle={() => setPPrecs(p => !p)}>

        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:T.txt4, letterSpacing:1, textTransform:"uppercase",
          marginBottom:7 }}>
          Auto-suggested from chief complaint — remove or add as needed
        </div>

        {precautions.map((p, i) => (
          <PrecRow key={i} text={p} onRemove={() => removePrec(i)} />
        ))}

        <div style={{ display:"flex", gap:6, marginTop:8 }}>
          <input value={newPrec} onChange={e => setNewPrec(e.target.value)}
            placeholder="Add custom return precaution..."
            onKeyDown={e => e.key === "Enter" && addPrec()}
            style={{ flex:1, padding:"6px 10px",
              background:"rgba(14,37,68,0.7)",
              border:"1px solid rgba(42,79,122,0.4)",
              borderRadius:7, outline:"none",
              fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt }} />
          <button onClick={addPrec}
            style={{ padding:"6px 14px", borderRadius:7, cursor:"pointer",
              border:"1px solid rgba(255,107,107,0.4)",
              background:"rgba(255,107,107,0.09)", color:T.coral,
              fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12 }}>
            + Add
          </button>
        </div>
      </Panel>

      {/* ── Panel 3: Follow-up Plan ──────────────────────────────────────────── */}
      <Panel
        title="Follow-up Plan"
        accent={T.purple}
        open={pFollowup} onToggle={() => setPFollowup(p => !p)}>

        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:8 }}>
          <div style={{ flex:2, minWidth:180 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
              marginBottom:4 }}>Follow up with</div>
            <input value={followupWith} onChange={e => setFollowupWith(e.target.value)}
              placeholder="e.g. Primary care, Cardiology, Orthopedics"
              style={{ width:"100%", padding:"7px 10px",
                background:"rgba(14,37,68,0.7)",
                border:"1px solid rgba(42,79,122,0.4)",
                borderRadius:7, outline:"none",
                fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt }} />
          </div>
          <div style={{ flex:1, minWidth:130 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
              marginBottom:4 }}>Timeframe</div>
            <div style={{ position:"relative" }}>
              <select value={followupWhen} onChange={e => setFollowupWhen(e.target.value)}
                style={{ width:"100%", padding:"7px 28px 7px 10px",
                  background:"rgba(14,37,68,0.7)",
                  border:"1px solid rgba(42,79,122,0.4)",
                  borderRadius:7, outline:"none",
                  appearance:"none", WebkitAppearance:"none",
                  fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt,
                  cursor:"pointer" }}>
                {["24–48 hours","2–3 days","1 week","2 weeks","4–6 weeks","As needed","Per specialist recommendation"].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
              <span style={{ position:"absolute", right:10, top:"50%",
                transform:"translateY(-50%)", color:T.txt4,
                fontSize:9, pointerEvents:"none" }}>▼</span>
            </div>
          </div>
        </div>
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
            marginBottom:4 }}>Additional Follow-up Notes</div>
          <input value={followupNotes} onChange={e => setFollowupNotes(e.target.value)}
            placeholder="e.g. Call for appointment, results pending at follow-up, imaging to repeat"
            style={{ width:"100%", padding:"7px 10px",
              background:"rgba(14,37,68,0.7)",
              border:"1px solid rgba(42,79,122,0.4)",
              borderRadius:7, outline:"none",
              fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt }} />
        </div>
      </Panel>

      {/* ── Settings bar ─────────────────────────────────────────────────────── */}
      <div style={{ padding:"10px 13px", borderRadius:10, marginBottom:12,
        background:"rgba(8,22,40,0.65)",
        border:"1px solid rgba(26,53,85,0.4)",
        display:"flex", gap:16, flexWrap:"wrap", alignItems:"center" }}>

        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
            marginBottom:5 }}>Reading Level</div>
          <div style={{ display:"flex", gap:4 }}>
            {["6th grade","8th grade","10th grade","Professional"].map(l => (
              <button key={l} onClick={() => setReadingLevel(l)}
                style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  fontWeight:700, padding:"3px 10px", borderRadius:20,
                  cursor:"pointer", letterSpacing:1, textTransform:"uppercase",
                  transition:"all .12s",
                  border:`1px solid ${readingLevel===l ? T.purple+"77" : "rgba(42,79,122,0.35)"}`,
                  background:readingLevel===l ? "rgba(155,109,255,0.18)" : "transparent",
                  color:readingLevel===l ? T.purple : T.txt4 }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
            marginBottom:5 }}>Language</div>
          <div style={{ display:"flex", gap:4 }}>
            {["English","Spanish","French","Portuguese","Mandarin"].map(l => (
              <button key={l} onClick={() => setLanguage(l)}
                style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                  fontWeight:700, padding:"3px 10px", borderRadius:20,
                  cursor:"pointer", letterSpacing:1, textTransform:"uppercase",
                  transition:"all .12s",
                  border:`1px solid ${language===l ? T.cyan+"77" : "rgba(42,79,122,0.35)"}`,
                  background:language===l ? "rgba(0,212,255,0.12)" : "transparent",
                  color:language===l ? T.cyan : T.txt4 }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Generate button ───────────────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:12, flexWrap:"wrap" }}>
        <button onClick={() => handleGenerate(false)} disabled={busy}
          style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700,
            fontSize:13, padding:"11px 28px", borderRadius:10,
            cursor:busy ? "not-allowed" : "pointer",
            border:`1px solid ${busy ? "rgba(42,79,122,0.3)" : "rgba(0,229,192,0.55)"}`,
            background:busy
              ? "rgba(42,79,122,0.15)"
              : "linear-gradient(135deg,rgba(0,229,192,0.22),rgba(0,229,192,0.06))",
            color:busy ? T.txt4 : T.teal, transition:"all .15s" }}>
          {busy ? "⚙ Generating..." : "✨ Generate Discharge Instructions"}
        </button>
        {/* Generate & Copy — one-click for providers ready to discharge */}
        {!result && (
          <button onClick={() => handleGenerate(true)} disabled={busy}
            title="Generate instructions and immediately copy to clipboard"
            style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
              fontSize:12, padding:"11px 20px", borderRadius:10,
              cursor:busy ? "not-allowed" : "pointer",
              border:"1px solid rgba(59,158,255,0.4)",
              background:"rgba(59,158,255,0.09)",
              color:busy ? T.txt4 : T.blue, transition:"all .15s" }}>
            ⚡ Generate & Copy
          </button>
        )}
        {result && (
          <button onClick={copyAll}
            style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600,
              fontSize:12, padding:"11px 20px", borderRadius:10,
              cursor:"pointer", transition:"all .15s",
              border:`1px solid ${copied ? T.green+"77" : "rgba(42,79,122,0.4)"}`,
              background:copied ? "rgba(61,255,160,0.1)" : "rgba(42,79,122,0.15)",
              color:copied ? T.green : T.txt3 }}>
            {copied ? "✓ Copied" : "Copy All"}
          </button>
        )}
      </div>

      {/* Error */}
      {aiErr && (
        <div style={{ padding:"9px 12px", borderRadius:8, marginBottom:10,
          background:"rgba(255,107,107,0.08)",
          border:"1px solid rgba(255,107,107,0.3)",
          fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.coral }}>
          {aiErr}
        </div>
      )}

      {/* ── Output panel ─────────────────────────────────────────────────────── */}
      {result && (
        <Panel
          title="Generated Discharge Instructions"
          accent={T.teal}
          badge={`${readingLevel} · ${language}`}
          open={pOutput} onToggle={() => setPOutput(p => !p)}>

          <div style={{ padding:"4px 0" }}>
            <OutputSection label="Diagnosis / What Happened"
              content={result.diagnosis_summary} color={T.blue} />
            <OutputSection label="Home Care Instructions"
              content={result.home_care} color={T.teal} />
            <OutputSection label="Medications"
              content={result.medications} color={T.purple} />
            <OutputSection label="Activity"
              content={result.activity} color={T.gold} />
            {result.diet && (
              <OutputSection label="Diet" content={result.diet} color={T.orange} />
            )}
            {result.wound_care && (
              <OutputSection label="Wound / Procedure Care"
                content={result.wound_care} color={T.coral} />
            )}
            <OutputSection label="When to Return to the Emergency Department"
              content={result.return_precautions} color={T.coral} />
            <OutputSection label="Follow-up"
              content={result.followup} color={T.green} />
            {result.closing && (
              <div style={{ marginTop:10, padding:"9px 12px", borderRadius:8,
                background:"rgba(0,229,192,0.06)",
                border:"1px solid rgba(0,229,192,0.2)",
                fontFamily:"'DM Sans',sans-serif", fontSize:12,
                color:T.txt2, lineHeight:1.7, fontStyle:"italic" }}>
                {result.closing}
              </div>
            )}
          </div>

          <div style={{ marginTop:8,
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"rgba(42,79,122,0.55)", letterSpacing:1 }}>
            NOTRYA SMART DISCHARGE · {readingLevel.toUpperCase()} · {language.toUpperCase()} · AI-GENERATED — PHYSICIAN REVIEW REQUIRED BEFORE DELIVERY
          </div>
        </Panel>
      )}
    </div>
  );
}