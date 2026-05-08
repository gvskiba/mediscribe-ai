// MedTermHighlighter.jsx
// Scans clinical text for known medical terms and renders them as
// highlighted, clickable chips that open a mini popover linking to
// the relevant hub in the Notrya suite.

import { useState, useRef, useEffect, useMemo } from "react";

// ─── Term → Hub mapping ────────────────────────────────────────────────────────
// Each entry: { terms: string[], hub: route, label, color, icon }
const TERM_HUBS = [
  // Cardiac
  { terms: ["stemi","nstemi","acs","myocardial infarction","chest pain","afib","atrial fibrillation",
            "troponin","svt","bradycardia","tachycardia","ekg","ecg","heart block","pea","vfib",
            "ventricular fibrillation","wide complex","lvef","heart failure","chf","pericarditis",
            "tamponade","aortic dissection"],
    hub: "/cardiac-hub", label: "Cardiac Hub", color: "#ff6b6b", icon: "🫀" },

  // Stroke / Neuro
  { terms: ["stroke","tia","nihss","tpa","alteplase","thrombectomy","facial droop","aphasia",
            "hemiplegia","diplopia","ataxia","dysarthria","ischemic stroke","hemorrhagic stroke",
            "intracranial hemorrhage","ich","subdural","epidural hematoma","subarachnoid"],
    hub: "/StrokeAssessment", label: "Neuro Hub", color: "#9b6dff", icon: "🧠" },

  // Sepsis
  { terms: ["sepsis","septic shock","sofa","lactate","bacteremia","source control","qsofa",
            "sirs","hour-1 bundle","blood cultures","broad-spectrum antibiotics","sep-1"],
    hub: "/sepsis-hub", label: "Sepsis Hub", color: "#f5c842", icon: "🦠" },

  // Airway
  { terms: ["rsi","rapid sequence","intubation","cric","cricothyrotomy","lma","bvm",
            "sellick","succinylcholine","rocuronium","etomidate","ketamine","airway",
            "sglt","failed airway","cico","difficult airway","video laryngoscopy"],
    hub: "/airway-hub", label: "Airway Hub", color: "#3b9eff", icon: "🌬️" },

  // Trauma
  { terms: ["trauma","atls","primary survey","abcde","massive transfusion","mtp",
            "hemorrhage control","permissive hypotension","damage control","fast exam",
            "focused assessment","pneumothorax","hemothorax","tension pneumo","flail chest"],
    hub: "/trauma-hub", label: "Trauma Hub", color: "#ff9f43", icon: "🩹" },

  // PE / DVT
  { terms: ["pulmonary embolism","pe","deep vein thrombosis","dvt","wells score",
            "perc rule","ctpa","d-dimer","anticoagulation","heparin","enoxaparin",
            "rivaroxaban","apixaban","doac","vte"],
    hub: "/dvt-hub", label: "DVT / PE Hub", color: "#3b9eff", icon: "🩸" },

  // Tox
  { terms: ["overdose","toxidrome","naloxone","n-acetylcysteine","acetaminophen",
            "salicylate","serotonin syndrome","nms","opioid","organophosphate",
            "carbon monoxide","anticholinergic","cholinergic","sympathomimetic"],
    hub: "/tox-hub", label: "Tox Hub", color: "#3dffa0", icon: "☠️" },

  // OB
  { terms: ["pre-eclampsia","eclampsia","hellp","pph","postpartum hemorrhage",
            "magnesium","placenta previa","abruption","ectopic","gestational",
            "ob arrest","obstetric emergency","perimortem cesarean"],
    hub: "/ob-hub", label: "OB/GYN Hub", color: "#ff6b9d", icon: "🤰" },

  // Peds
  { terms: ["pediatric","pals","broselow","weight-based","neonatal","croup","bronchiolitis",
            "intussusception","febrile seizure","kawasaki","meningitis peds"],
    hub: "/peds-hub", label: "Peds Hub", color: "#b99bff", icon: "👶" },

  // Shock
  { terms: ["shock","hypotension","vasopressor","norepinephrine","dopamine","epinephrine drip",
            "cardiogenic shock","distributive shock","obstructive shock","hypovolemic"],
    hub: "/shock-hub", label: "Shock Hub", color: "#ff6b6b", icon: "🚨" },

  // Pharmacology / Dosing
  { terms: ["vancomycin","pip-tazo","piperacillin","ceftriaxone","azithromycin","metronidazole",
            "meropenem","ciprofloxacin","dexamethasone","morphine","fentanyl","lorazepam",
            "diazepam","labetalol","metoprolol","nitroglycerin","furosemide","amiodarone"],
    hub: "/unified-pharma", label: "PharmacologyHub", color: "#00b4d8", icon: "⚗" },

  // Radiology
  { terms: ["ct scan","cxr","chest x-ray","mri","ultrasound","pocus","aortic","pulmonary",
            "opacity","infiltrate","effusion","pneumonia pattern","ct head","ct abdomen"],
    hub: "/radiology-hub", label: "Radiology Hub", color: "#00d4ff", icon: "🩻" },

  // Dyspnea
  { terms: ["dyspnea","shortness of breath","wheezing","stridor","crackles","rales",
            "copd","asthma","acute respiratory","blue protocol","respiratory failure"],
    hub: "/DyspneaHub", label: "Dyspnea Hub", color: "#3b9eff", icon: "💨" },

  // Headache
  { terms: ["headache","thunderclap","worst headache","subarachnoid hemorrhage","sah",
            "migraine","lumbar puncture","ottawa sah","snoop"],
    hub: "/HeadacheHub", label: "Headache Hub", color: "#9b6dff", icon: "🤕" },

  // Abdominal pain
  { terms: ["appendicitis","cholecystitis","pancreatitis","alvarado","bisap",
            "gi bleed","hematemesis","melena","bowel obstruction","ischemic colitis"],
    hub: "/AbdominalPainHub", label: "Abdominal Pain Hub", color: "#ff9f43", icon: "🔴" },

  // Seizure
  { terms: ["seizure","status epilepticus","benzodiazepine","levetiracetam","phenytoin",
            "keppra","postictal","ncse","convulsion","epilepsy"],
    hub: "/seizure-hub", label: "Seizure Hub", color: "#9b6dff", icon: "⚡" },

  // Resus
  { terms: ["cardiac arrest","cpr","acls","rosc","post-rosc","defibrillation",
            "pulseless","ventricular tachycardia","asystole","epinephrine cardiac"],
    hub: "/resus-hub", label: "Resus Hub", color: "#ff4444", icon: "💓" },

  // Psych
  { terms: ["agitation","psychosis","serotonin","neuroleptic malignant",
            "suicide","self-harm","psychiatric","bipolar","schizophrenia","delirium"],
    hub: "/psyche-hub", label: "Psychiatry Hub", color: "#9b6dff", icon: "🧠" },
];

// Build a flat lookup: lowercase term → hub entry
const buildTermMap = () => {
  const map = new Map();
  TERM_HUBS.forEach(entry => {
    entry.terms.forEach(t => map.set(t.toLowerCase(), entry));
  });
  return map;
};
const TERM_MAP = buildTermMap();

// Sorted by length descending so multi-word phrases match before single words
const SORTED_TERMS = [...TERM_MAP.keys()].sort((a, b) => b.length - a.length);

// ─── Tokenize text into segments: { text, match?: hubEntry } ─────────────────
function tokenize(text) {
  if (!text) return [{ text: "" }];
  const segments = [];
  let remaining = text;
  let pos = 0;

  while (remaining.length > 0) {
    let matched = false;
    for (const term of SORTED_TERMS) {
      const idx = remaining.toLowerCase().indexOf(term);
      if (idx === -1) continue;

      // Only match on word boundaries
      const before = remaining[idx - 1];
      const after  = remaining[idx + term.length];
      const wbBefore = !before || /\W/.test(before);
      const wbAfter  = !after  || /\W/.test(after);
      if (!wbBefore || !wbAfter) continue;

      // Push text before the match
      if (idx > 0) segments.push({ text: remaining.slice(0, idx) });

      // Push the match
      segments.push({ text: remaining.slice(idx, idx + term.length), match: TERM_MAP.get(term) });
      remaining = remaining.slice(idx + term.length);
      matched = true;
      break;
    }
    if (!matched) {
      segments.push({ text: remaining });
      remaining = "";
    }
  }
  return segments;
}

// ─── Popover component ────────────────────────────────────────────────────────
function TermPopover({ term, entry, onClose }) {
  return (
    <div style={{
      position: "absolute",
      bottom: "calc(100% + 8px)",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      minWidth: 220,
      background: "rgba(5,15,30,.98)",
      border: `1px solid ${entry.color}55`,
      borderRadius: 10,
      padding: "10px 13px",
      boxShadow: `0 8px 32px rgba(0,0,0,.7), 0 0 0 1px ${entry.color}22`,
      pointerEvents: "all",
    }}>
      {/* Arrow */}
      <div style={{
        position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)",
        width: 10, height: 10, background: "rgba(5,15,30,.98)",
        borderRight: `1px solid ${entry.color}55`, borderBottom: `1px solid ${entry.color}55`,
        rotate: "45deg",
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
        <span style={{ fontSize: 16 }}>{entry.icon}</span>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
            color: entry.color, fontWeight: 700, letterSpacing: 1.2,
            textTransform: "uppercase" }}>{entry.label}</div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11,
            color: "rgba(221,230,240,.8)", fontWeight: 600, lineHeight: 1.3 }}>
            "{term}"
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <a href={entry.hub}
          style={{ flex: 1, padding: "5px 0", borderRadius: 7, cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 11,
            background: `${entry.color}22`, border: `1px solid ${entry.color}55`,
            color: entry.color, textDecoration: "none",
            textAlign: "center", transition: "all .15s" }}
          onClick={onClose}>
          Open Hub →
        </a>
        <a href={entry.hub} target="_blank" rel="noreferrer"
          style={{ padding: "5px 9px", borderRadius: 7, cursor: "pointer",
            fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 9,
            background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)",
            color: "rgba(221,230,240,.5)", textDecoration: "none",
            textAlign: "center", transition: "all .15s", letterSpacing: .5 }}
          title="Open in new tab"
          onClick={onClose}>
          ↗
        </a>
      </div>
    </div>
  );
}

// ─── Highlighted Chip ─────────────────────────────────────────────────────────
function HighlightedTerm({ text, entry }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <span ref={ref} style={{ position: "relative", display: "inline" }}>
      <span
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        style={{
          background: `${entry.color}18`,
          borderBottom: `2px solid ${entry.color}80`,
          borderRadius: "3px 3px 0 0",
          color: entry.color,
          cursor: "pointer",
          fontWeight: 600,
          padding: "0 2px",
          transition: "background .15s",
        }}
        title={`${entry.label} — click for reference`}
      >
        {text}
      </span>
      {open && <TermPopover term={text} entry={entry} onClose={() => setOpen(false)} />}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MedTermHighlighter({ text, style }) {
  const segments = useMemo(() => tokenize(text), [text]);

  if (!text?.trim()) return null;

  const hasMatches = segments.some(s => s.match);
  if (!hasMatches) return null;

  return (
    <div style={{
      marginTop: 8,
      padding: "10px 13px",
      borderRadius: 9,
      background: "rgba(0,180,216,.04)",
      border: "1px solid rgba(0,180,216,.18)",
      fontFamily: "'DM Sans',sans-serif",
      fontSize: 12,
      lineHeight: 1.8,
      color: "rgba(221,230,240,.75)",
      ...style,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
          fontWeight: 700, color: "#00b4d8", letterSpacing: 1.5,
          textTransform: "uppercase" }}>
          🔗 Clinical Term References
        </span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7,
          color: "rgba(221,230,240,.3)", letterSpacing: .5 }}>
          click highlighted terms to open hubs
        </span>
      </div>
      <div style={{ lineHeight: 1.85 }}>
        {segments.map((seg, i) =>
          seg.match
            ? <HighlightedTerm key={i} text={seg.text} entry={seg.match} />
            : <span key={i}>{seg.text}</span>
        )}
      </div>
    </div>
  );
}