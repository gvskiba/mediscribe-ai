// ─────────────────────────────────────────────────────────────────────────────
// Notrya AI — Discharge Planning Center
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const G = {
  navy:"#050f1e", slate:"#0b1d35", panel:"#0d2240", edge:"#162d4f",
  border:"#1e3a5f", muted:"#2a4d72", dim:"#4a7299", text:"#c8ddf0",
  bright:"#e8f4ff", teal:"#00d4bc", amber:"#f5a623", red:"#ff5c6c",
  green:"#2ecc71", purple:"#9b6dff", blue:"#4a90d9", rose:"#f472b6",
};

// ── STATIC CLINICAL REFERENCE DATA ────────────────────────────────────────────
const EDU_LIBRARY = [
  {
    id:"chf", title:"Understanding Heart Failure", icon:"❤️", category:"Cardiac",
    tagline:"What it means and how to manage it at home",
    bullets:[
      "Heart failure means your heart isn't pumping as strongly as it should — not that it has stopped.",
      "Daily weight monitoring is essential: weigh yourself every morning before eating, after using the bathroom.",
      "Call your doctor immediately if you gain more than 3 lbs in one day or 5 lbs in one week.",
      "Limit fluid intake to about 1.5–2 liters (6–8 cups) per day unless told otherwise.",
      "Reduce sodium to less than 2,000 mg per day. Avoid canned soups, processed meats, and fast food.",
      "Elevate the head of your bed 6–8 inches if you feel short of breath lying flat.",
      "Take all medications exactly as prescribed — especially your diuretic (water pill) and heart medications.",
    ],
    warningSigns:["Sudden weight gain (3+ lbs/day)","Increased swelling in legs or ankles","Shortness of breath at rest or with minimal activity","Waking up at night unable to breathe","Chest pain or pressure"],
  },
  {
    id:"anticoag", title:"Anticoagulation Safety (Blood Thinners)", icon:"🩸", category:"Medications",
    tagline:"Taking blood thinners safely and reducing bleeding risk",
    bullets:[
      "Your blood thinner reduces your risk of stroke and dangerous clots.",
      "Take it exactly as prescribed — do not skip doses or double-up on missed doses.",
      "DO NOT take ibuprofen (Advil, Motrin), naproxen, or aspirin unless your doctor specifically says you can.",
      "Use acetaminophen (Tylenol) for pain relief instead.",
      "Tell all your doctors, dentists, and pharmacists you are on a blood thinner.",
      "Do NOT stop taking this medication without speaking to your doctor first.",
      "Minor bleeding (bruising, small cuts that take longer to stop) is expected. Serious bleeding is not.",
    ],
    warningSigns:["Coughing or vomiting blood","Blood in urine (pink, red, or brown)","Black or tarry stools","Severe headache or vision changes","Inability to stop bleeding after 10 minutes of pressure"],
  },
  {
    id:"lowsodium", title:"Low-Sodium Diet Guide", icon:"🧂", category:"Nutrition",
    tagline:"Eating smart to protect your heart and blood pressure",
    bullets:[
      "Goal: Less than 2,000 mg of sodium per day (about 1 teaspoon of table salt total).",
      "Read all food labels — look for 'sodium' content, not just 'salt.' Hidden sodium is everywhere.",
      "Avoid: canned soups, deli meats, frozen meals, fast food, soy sauce, and pickles.",
      "Choose: fresh vegetables, fruits, unseasoned meats, low-sodium canned goods rinsed with water.",
      "Use herbs, lemon juice, garlic, and pepper to flavor food instead of salt.",
      "Restaurant tip: Ask for sauces on the side and choose grilled or baked over fried.",
    ],
    warningSigns:["Increased swelling after a high-sodium meal","Weight gain overnight after eating salty food"],
  },
  {
    id:"diabetes", title:"Diabetes Management at Home", icon:"🩺", category:"Endocrine",
    tagline:"Monitoring blood sugar and staying in your target range",
    bullets:[
      "Check your blood sugar as directed — typically before meals and at bedtime.",
      "Target range: 80–130 mg/dL before meals; less than 180 mg/dL two hours after meals.",
      "Take diabetes medications with food to reduce stomach upset. Never skip meals.",
      "Signs of low blood sugar (hypoglycemia): shakiness, sweating, confusion, heart racing.",
      "If your blood sugar is below 70: eat 15g of fast-acting carbs, recheck in 15 minutes.",
      "Stay well-hydrated. Dehydration worsens blood sugar control and kidney function.",
    ],
    warningSigns:["Blood sugar consistently above 300 mg/dL","Inability to eat or drink","Confusion or altered mental status","Persistent vomiting"],
  },
  {
    id:"htn", title:"Blood Pressure Management", icon:"💊", category:"Cardiac",
    tagline:"Understanding and controlling your blood pressure",
    bullets:[
      "Take your blood pressure medications at the same time every day.",
      "Home monitoring: check BP twice daily (morning and evening) and log results.",
      "Lifestyle: reduce sodium, exercise as tolerated, limit alcohol, avoid smoking.",
      "Do not stop blood pressure medications suddenly — this can cause a dangerous spike.",
      "Position matters: sit quietly for 5 minutes, feet flat, arm at heart level before checking.",
    ],
    warningSigns:["Severe headache with BP above 180/120","Chest pain or pressure","Sudden vision changes","Confusion or difficulty speaking"],
  },
  {
    id:"activity", title:"Activity & Exercise After Hospitalization", icon:"🚶", category:"Recovery",
    tagline:"Getting moving again safely after a hospital stay",
    bullets:[
      "Start with light activity: short walks (5–10 min) 2–3 times per day. Gradually increase each week.",
      "Stop and rest if you experience chest pain, shortness of breath, or lightheadedness.",
      "Avoid heavy lifting or vigorous exercise unless cleared by your doctor.",
      "Cardiac rehab may be recommended — ask your doctor for a referral.",
      "Climbing stairs: take them slowly, one step at a time. Rest as needed.",
      "Listen to your body: fatigue is normal, but sudden severe fatigue should be reported.",
    ],
    warningSigns:["Chest pain or tightness with activity","Shortness of breath that doesn't resolve with rest","Palpitations or irregular heartbeat during exercise","Lightheadedness or near-fainting"],
  },
  {
    id:"ckd", title:"Kidney Health & CKD Management", icon:"🫘", category:"Nephrology",
    tagline:"Protecting your kidneys at home",
    bullets:[
      "Stay well hydrated unless your doctor has placed a fluid restriction.",
      "Avoid NSAIDs (ibuprofen, naproxen) — they can worsen kidney function.",
      "Limit potassium if instructed: avoid bananas, oranges, potatoes, tomatoes in excess.",
      "Limit phosphorus if instructed: avoid dark colas, processed cheese, fast food.",
      "Take all kidney-related medications as prescribed and attend all lab appointments.",
      "Report any decrease in urination, swelling, or extreme fatigue to your doctor promptly.",
    ],
    warningSigns:["Significant decrease in urination","Sudden worsening swelling","Extreme fatigue or confusion","Nausea and vomiting that won't stop"],
  },
  {
    id:"afib", title:"Atrial Fibrillation: Living with AFib", icon:"💓", category:"Cardiac",
    tagline:"Understanding your irregular heartbeat and staying safe",
    bullets:[
      "AFib means your heart beats in an irregular rhythm — it is manageable with proper treatment.",
      "Take your rate-control and anticoagulation medications every day without fail.",
      "Monitor for symptoms: palpitations, dizziness, shortness of breath, chest discomfort.",
      "Limit alcohol and caffeine, which can trigger episodes.",
      "Check your pulse daily — a simple wrist pulse check can detect irregularity.",
      "Carry your medication list and wear a medical ID if possible.",
    ],
    warningSigns:["Sudden onset of severe chest pain","Stroke symptoms: face drooping, arm weakness, speech difficulty","Fainting or near-fainting","Rapid heart rate above 150 with symptoms"],
  },
  {
    id:"wound", title:"Wound Care & Surgical Site Instructions", icon:"🩹", category:"Surgical",
    tagline:"Keeping your wound clean and healing properly",
    bullets:[
      "Keep the wound clean and dry for the first 24–48 hours unless instructed otherwise.",
      "Change dressings as directed by your care team — use clean hands or gloves.",
      "Do not submerge the wound in water (no baths, pools, or hot tubs) until cleared.",
      "Take all prescribed antibiotics for the full course even if you feel better.",
      "Avoid strenuous activity or lifting that puts tension on the wound.",
      "Staples or sutures will be removed at your follow-up appointment — do not remove them at home.",
    ],
    warningSigns:["Increasing redness, warmth, or swelling around the wound","Pus or cloudy discharge","Wound edges separating (dehiscence)","Fever above 101°F (38.3°C)","Severe or worsening pain"],
  },
  {
    id:"pain", title:"Pain Management After Discharge", icon:"💊", category:"Recovery",
    tagline:"Managing discomfort safely at home",
    bullets:[
      "Acetaminophen (Tylenol) is first-line for most pain — take exactly as directed, do not exceed 3,000 mg/day.",
      "Avoid ibuprofen or other NSAIDs unless your doctor specifically approves them.",
      "If prescribed opioids: take only as needed, do not drink alcohol, do not drive.",
      "Pain should gradually improve each day — if it is worsening, contact your doctor.",
      "Ice packs (wrapped in a cloth) can help with localized swelling and pain.",
      "Proper positioning and support pillows can reduce discomfort during recovery.",
    ],
    warningSigns:["Sudden severe or worsening pain","New pain in a different location","Pain with fever, redness, or swelling","Opioid side effects: extreme drowsiness, difficulty breathing"],
  },
];

const RETURN_PRECAUTIONS = [
  { cat:"Breathing",   icon:"🫁", items:["Sudden or worsening shortness of breath at rest","Unable to lie flat due to breathlessness","Breathing significantly faster than usual"] },
  { cat:"Chest",       icon:"❤️", items:["New chest pain, pressure, tightness, or heaviness","Chest pain that radiates to arm, jaw, or back"] },
  { cat:"Weight & Fluid", icon:"⚖️", items:["Weight gain of 3+ lbs in one day or 5+ lbs in one week","Sudden worsening of leg, ankle, or foot swelling"] },
  { cat:"Heart",       icon:"💓", items:["Rapid, racing, or irregular heartbeat","Feeling faint or actually fainting"] },
  { cat:"Bleeding",    icon:"🩸", items:["Blood in urine or stool","Coughing or vomiting blood","Bleeding that won't stop after 10 minutes of pressure"] },
  { cat:"General",     icon:"🌡️", items:["Fever above 101°F / 38.3°C","Confusion or sudden change in mental status","Inability to take medications due to persistent vomiting"] },
];

const EMPTY_INSTRUCTIONS = {
  activity: "",
  diet: "",
  monitoring: "",
  medications: "",
  wounds: "",
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
const fmtDate    = d => d ? new Date(d).toLocaleDateString("en-US",{ month:"short", day:"numeric", year:"numeric" }) : "—";
const fmtDateLong = d => d ? new Date(d).toLocaleDateString("en-US",{ weekday:"short", month:"short", day:"numeric" }) : "—";
const daysUntil  = d => d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null;
const calcAge    = dob => dob ? Math.floor((new Date() - new Date(dob)) / (365.25 * 86400000)) : null;
const calcLOS    = (admitDate, dischargeDate) => {
  if (!admitDate) return "—";
  const end = dischargeDate ? new Date(dischargeDate) : new Date();
  const days = Math.round((end - new Date(admitDate)) / 86400000);
  return `${days} day${days !== 1 ? "s" : ""}`;
};

const statusColors = {
  new:         { bg:"rgba(46,204,113,.12)",  border:"rgba(46,204,113,.35)",  color:G.green  },
  continued:   { bg:"rgba(74,144,217,.1)",   border:"rgba(74,144,217,.3)",   color:G.blue   },
  changed:     { bg:"rgba(245,166,35,.12)",  border:"rgba(245,166,35,.35)",  color:G.amber  },
  discontinued:{ bg:"rgba(255,92,108,.1)",   border:"rgba(255,92,108,.3)",   color:G.red    },
};

const btn = (bg, fg="#fff", br="transparent", p="9px 18px") => ({
  padding:p, borderRadius:8, fontFamily:"inherit", fontSize:12.5, fontWeight:700,
  cursor:"pointer", display:"inline-flex", alignItems:"center", gap:6,
  border:`1px solid ${br}`, background:bg, color:fg, transition:"all .15s", whiteSpace:"nowrap",
});
const badge = (bg, fg, br, p="3px 9px") => ({
  padding:p, borderRadius:20, fontSize:10.5, fontWeight:700,
  background:bg, border:`1px solid ${br}`, color:fg, display:"inline-block",
});
const card = { background:G.panel, border:`1px solid ${G.border}`, borderRadius:13, overflow:"hidden" };
const panelHead = {
  padding:"11px 16px 9px", fontFamily:"'Playfair Display',Georgia,serif",
  fontSize:13, fontWeight:700, color:G.bright,
  borderBottom:`1px solid rgba(30,58,95,.4)`, background:"rgba(11,29,53,.5)",
  display:"flex", alignItems:"center", gap:8, flexShrink:0,
};

function Skeleton({ w="100%", h=13, mb=9 }) {
  return (
    <div style={{ height:h, width:w, borderRadius:4, marginBottom:mb,
      background:`linear-gradient(90deg,${G.edge} 25%,${G.muted} 50%,${G.edge} 75%)`,
      backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite" }}/>
  );
}

function EmptyState({ icon, title, sub, action, actionLabel }) {
  return (
    <div style={{ textAlign:"center", padding:"52px 24px" }}>
      <div style={{ fontSize:48, marginBottom:12, opacity:.4 }}>{icon}</div>
      <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:17, color:G.dim, marginBottom:6 }}>{title}</div>
      <div style={{ fontSize:13, color:G.muted, marginBottom:action?18:0 }}>{sub}</div>
      {action && <button style={btn(`linear-gradient(135deg,${G.teal},#00a896)`)} onClick={action}>{actionLabel}</button>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function DischargePlanning() {
  const navigate = useNavigate();
  // ── Load real data from Base44 ───────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const u = await base44.auth.me();
        setCurrentUser(u);
        const notes = await base44.entities.ClinicalNote.list("-updated_date", 20);
        setClinicalNotes(notes || []);
        if (notes && notes.length > 0) setSelectedNoteId(notes[0].id);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const selectedNote = clinicalNotes.find(n => n.id === selectedNoteId) || null;

  // Derive patient-like fields from ClinicalNote
  const patient = selectedNote ? {
    name: selectedNote.patient_name,
    fullName: selectedNote.patient_name,
    id: selectedNote.patient_id,
    mrn: selectedNote.patient_id,
    dateOfBirth: selectedNote.date_of_birth,
    gender: selectedNote.patient_gender,
    allergies: selectedNote.allergies || [],
    primaryDiagnosis: selectedNote.diagnoses?.[0] || selectedNote.chief_complaint || "—",
    secondaryDiagnoses: selectedNote.diagnoses?.slice(1) || [],
  } : null;

  const encounter = selectedNote ? {
    id: selectedNote.id,
    admitDate: selectedNote.date_of_visit,
    primaryDiagnosis: selectedNote.diagnoses?.[0] || selectedNote.chief_complaint || "—",
    secondaryDiagnoses: selectedNote.diagnoses?.slice(1) || [],
    attendingPhysician: currentUser?.full_name || "—",
    dischargeDisposition: selectedNote.disposition_plan || "—",
    dischargeDate: null,
  } : null;

  const medications = selectedNote?.medications?.map((m, i) => ({
    id: `med-${i}`,
    name: m,
    dose: "",
    frequency: "",
    route: "PO",
    status: "continued",
    instructions: "",
  })) || [];

  // ── UI STATE ─────────────────────────────────────────────────────────────────
  const [activeSection, setActiveSection]   = useState("disposition");
  const [selectedDisposition, setSelectedDisposition] = useState(null);
  const [localMeds, setLocalMeds]           = useState([]);
  const [localFollowups, setLocalFollowups] = useState([]);
  const [selectedEdu, setSelectedEdu]       = useState([]);
  const [instructions, setInstructions]     = useState(EMPTY_INSTRUCTIONS);
  const [summaryText, setSummaryText]       = useState("");
  const [aiGenerating, setAiGenerating]     = useState(false);
  const [completionChecks, setCompletionChecks] = useState({
    disposition:false, summary:false, medications:false, followup:false, education:false, instructions:false,
  });
  const [saving, setSaving]               = useState(false);
  const [toast, setToast]                 = useState(null);
  const [editingMed, setEditingMed]       = useState(null);
  const [addFollowupModal, setAddFollowupModal] = useState(false);
  const [newFollowup, setNewFollowup]     = useState({
    type:"", provider:"", date:"", time:"", location:"", phone:"", priority:"routine", notes:"",
  });
  const toastRef = useRef(null);

  useEffect(() => {
    setLocalMeds(medications?.length ? medications : []);
    setLocalFollowups([]);
    setSelectedEdu([]);
    setInstructions(EMPTY_INSTRUCTIONS);
    setSummaryText(selectedNote?.discharge_summary || "");
    setSelectedDisposition(null);
    setCompletionChecks({ disposition:false, summary:false, medications:false, followup:false, education:false, instructions:false });
  }, [selectedNoteId]);

  const showToast = useCallback((msg, color = G.teal) => {
    clearTimeout(toastRef.current);
    setToast({ msg, color });
    toastRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const completionPct  = Object.values(completionChecks).filter(Boolean).length;
  const totalSections  = Object.keys(completionChecks).length;

  const patientAge        = patient?.dateOfBirth ? calcAge(patient.dateOfBirth) : null;
  const patientName       = patient?.fullName ?? patient?.name ?? "—";
  const patientMRN        = patient?.mrn ?? patient?.id ?? "—";
  const patientGender     = patient?.gender ?? "—";
  const patientDOB        = patient?.dateOfBirth ?? null;

  const primaryDx         = encounter?.primaryDiagnosis ?? "—";
  const secondaryDx       = encounter?.secondaryDiagnoses ?? [];
  const allergies         = patient?.allergies ?? [];
  const codeStatus        = "Full Code";
  const dischargeDisp     = encounter?.dischargeDisposition ?? "—";
  const admitDate         = encounter?.admitDate ?? null;
  const dischargeDate     = encounter?.dischargeDate ?? null;
  const los               = calcLOS(admitDate, dischargeDate);
  const attendingMD       = currentUser?.full_name ?? "—";

  const markComplete = (section) => {
    setCompletionChecks(p => ({ ...p, [section]:true }));
    showToast(`${section.charAt(0).toUpperCase() + section.slice(1)} marked complete ✓`, G.green);
  };

  async function savePlan() {
    if (!selectedNote) { showToast("No patient note selected", G.red); return; }
    setSaving(true);
    try {
      await base44.entities.ClinicalNote.update(selectedNote.id, {
        discharge_summary: summaryText,
      });
      showToast("Discharge plan saved ✓", G.teal);
    } catch (e) {
      showToast("Save failed — please try again", G.red);
    }
    setSaving(false);
  }

  async function generateSummary() {
    setAiGenerating(true);
    setSummaryText("");

    const medList = localMeds
      .filter(m => (m.status ?? "continued") !== "discontinued")
      .map(m => `${m.name ?? m.medicationName} ${m.dose} ${m.frequency ?? m.freq}`)
      .join(", ") || "see medication list";

    const secondaryList = Array.isArray(secondaryDx)
      ? secondaryDx.map(d => (typeof d === "string" ? d : d.name ?? d.description)).join(", ")
      : secondaryDx;

    const allergyList = Array.isArray(allergies)
      ? allergies.map(a => (typeof a === "string" ? a : `${a.allergen} — ${a.reaction ?? a.type ?? ""}`)).join(", ")
      : allergies;

    const prompt = `You are Notrya AI, a clinical documentation expert. Generate a professional, concise hospital discharge summary narrative.

Patient: ${patientName}, ${patientAge ? patientAge + "yo" : ""} ${patientGender}
MRN: ${patientMRN}
Admission: ${fmtDate(admitDate)} | Discharge: ${fmtDate(dischargeDate)} (${los})
Attending: ${attendingMD}
Primary Diagnosis: ${primaryDx}
Secondary Diagnoses: ${secondaryList || "None documented"}
Allergies: ${allergyList || "NKDA"}
Discharge Medications: ${medList}
Discharge Disposition: ${dischargeDisp}
Clinical Notes: ${selectedNote?.raw_note?.slice(0, 800) || ""}
Assessment: ${selectedNote?.assessment || ""}
Plan: ${selectedNote?.plan || ""}

Write a professional discharge summary narrative (3–4 paragraphs) covering:
1. Reason for admission and brief hospital course
2. Key diagnostic findings and interventions performed
3. Medication changes with brief clinical rationale
4. Condition at discharge and discharge plan

Be concise, clinically accurate, and professional. Use standard medical abbreviations.`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({ prompt });
      setSummaryText(result || "");
      setCompletionChecks(p => ({ ...p, summary: true }));
      showToast("Discharge summary generated ✓", G.teal);
    } catch {
      showToast("AI generation unavailable — please type summary manually", G.amber);
    }
    setAiGenerating(false);
  }

  function saveNewFollowup() {
    if (!newFollowup.type || !newFollowup.date) {
      showToast("Appointment type and date are required", G.red); return;
    }
    const entry = { ...newFollowup, id: Date.now() };
    setLocalFollowups(p => [...p, entry]);
    setAddFollowupModal(false);
    setNewFollowup({ type:"", provider:"", date:"", time:"", location:"", phone:"", priority:"routine", notes:"" });
    showToast("Follow-up appointment added ✓", G.purple);
  }

  function deleteFollowup(id) {
    setLocalFollowups(p => p.filter(f => f.id !== id));
  }

  function updateMedInstruction(id, instr) {
    setLocalMeds(prev => prev.map(m => m.id === id ? { ...m, instructions: instr } : m));
  }

  function printPDF() {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) { showToast("Popup blocked — allow popups to generate PDF", G.amber); return; }

    const eduData    = EDU_LIBRARY.filter(e => selectedEdu.includes(e.id));
    const activeMeds = localMeds.filter(m => (m.status ?? "continued") !== "discontinued");
    const discMeds   = localMeds.filter(m => m.status === "discontinued");
    const today      = new Date().toLocaleDateString("en-US",{ weekday:"long", year:"numeric", month:"long", day:"numeric" });
    const docId      = `DS-${patientMRN.replace(/\W/g,"")}-${Date.now().toString(36).toUpperCase()}`;

    const allergyList = Array.isArray(allergies)
      ? allergies.map(a => typeof a === "string" ? a : `${a.allergen}${a.reaction ? " — "+a.reaction : ""}`).join(" · ")
      : (allergies || "NKDA");

    const secondaryList = Array.isArray(secondaryDx)
      ? secondaryDx.map(d => typeof d === "string" ? d : d.name ?? d.description)
      : [];

    printWindow.document.write(`<!DOCTYPE html><html><head>
<meta charset="UTF-8">
<title>Discharge Summary — ${patientName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Source+Sans+3:wght@400;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Source Sans 3',Georgia,sans-serif;font-size:11px;color:#1a1a2e;background:#fff}
  .page{width:100%;max-width:816px;margin:0 auto;padding:36px 48px}
  .doc-header{border-bottom:3px solid #050f1e;padding-bottom:18px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-end}
  .doc-logo{font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:700;color:#050f1e;line-height:1}
  .doc-logo span{color:#00b5a5}
  .doc-logo small{display:block;font-family:'Source Sans 3',sans-serif;font-size:8.5px;font-weight:400;color:#6b7280;letter-spacing:.08em;text-transform:uppercase;margin-top:3px}
  .doc-date{font-size:10px;color:#6b7280;text-align:right}
  .doc-date strong{display:block;font-size:11px;color:#1a1a2e}
  .pt-banner{background:#f0f7ff;border:1.5px solid #bfdbfe;border-radius:8px;padding:14px 16px;margin-bottom:18px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
  .pt-field label{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;display:block;margin-bottom:2px}
  .pt-field span{font-size:11px;font-weight:600;color:#1a1a2e}
  h2{font-family:'Playfair Display',Georgia,serif;font-size:13px;font-weight:700;color:#050f1e;padding:8px 0 6px;border-bottom:1.5px solid #e5e7eb;margin-bottom:10px;margin-top:18px;text-transform:uppercase;letter-spacing:.04em}
  .dx-primary{font-size:12px;font-weight:700;color:#050f1e;margin-bottom:4px}
  .dx-secondary{font-size:10.5px;color:#374151;margin-bottom:2px;padding-left:12px}
  .dx-secondary::before{content:"•";margin-right:5px;color:#6b7280}
  .summary-text{font-size:11.5px;line-height:1.85;color:#1a1a2e;margin-bottom:10px}
  .summary-text p{margin-bottom:8px}
  table{width:100%;border-collapse:collapse;margin-bottom:4px;font-size:10.5px}
  th{background:#050f1e;color:#fff;padding:6px 10px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em}
  td{padding:6px 10px;border-bottom:1px solid #f3f4f6;vertical-align:top;color:#1a1a2e}
  tr:nth-child(even) td{background:#f9fafb}
  .badge{display:inline-block;padding:2px 7px;border-radius:4px;font-size:9px;font-weight:700;letter-spacing:.04em}
  .badge-new{background:#dcfce7;color:#166534}
  .badge-changed{background:#fef3c7;color:#92400e}
  .badge-continued{background:#eff6ff;color:#1e40af}
  .badge-discontinued{background:#fee2e2;color:#991b1b}
  .fu-card{border:1px solid #e5e7eb;border-radius:6px;padding:10px 12px;margin-bottom:8px}
  .edu-section{border:1px solid #e5e7eb;border-radius:6px;padding:12px 14px;margin-bottom:10px}
  .edu-title{font-size:12.5px;font-weight:700;color:#050f1e;margin-bottom:2px}
  .edu-bullet{font-size:10.5px;color:#1a1a2e;margin-bottom:4px;padding-left:14px;position:relative;line-height:1.65}
  .edu-bullet::before{content:"•";position:absolute;left:4px;color:#00b5a5;font-weight:700}
  .warning-box{background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;padding:10px 12px;margin-top:8px}
  .instr-content{font-size:11px;color:#1a1a2e;line-height:1.8;background:#f9fafb;border-left:3px solid #00b5a5;padding:8px 12px;border-radius:0 4px 4px 0;margin-bottom:10px}
  .precaution-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .precaution-cat{background:#fff7ed;border:1px solid #fde68a;border-radius:6px;padding:8px 10px}
  .doc-footer{border-top:1.5px solid #e5e7eb;margin-top:24px;padding-top:12px;display:flex;justify-content:space-between;align-items:flex-end}
  .sig-line{border-top:1px solid #374151;width:200px;margin-top:28px;padding-top:4px;font-size:9.5px;color:#6b7280}
  .footer-note{font-size:9px;color:#9ca3af;text-align:right;max-width:320px;line-height:1.5}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.no-print{display:none!important}.page{padding:24px 36px}}
  .print-bar{background:#050f1e;padding:10px 20px;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:10}
  .print-btn{background:#00d4bc;color:#050f1e;border:none;padding:8px 18px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer}
  .print-title{font-family:'Playfair Display',serif;color:#e8f4ff;font-size:14px}
</style></head><body>
<div class="print-bar no-print">
  <span class="print-title">🖨 Discharge Summary — ${patientName}</span>
  <div style="display:flex;gap:8px">
    <button class="print-btn" onclick="window.print()">🖨 Print / Save PDF</button>
    <button class="print-btn" style="background:#4a90d9" onclick="window.close()">✕ Close</button>
  </div>
</div>
<div class="page">
  <div class="doc-header">
    <div class="doc-logo">Notrya<span> AI</span><small>Discharge Planning Center</small></div>
    <div class="doc-date"><strong>DISCHARGE SUMMARY</strong>${today}<br>Doc ID: ${docId}</div>
  </div>
  <div class="pt-banner">
    <div class="pt-field"><label>Patient Name</label><span>${patientName}</span></div>
    <div class="pt-field"><label>Date of Birth</label><span>${patientDOB ? fmtDate(patientDOB) : "—"}</span></div>
    <div class="pt-field"><label>MRN</label><span>${patientMRN}</span></div>
    <div class="pt-field"><label>Admission Date</label><span>${fmtDate(admitDate)}</span></div>
    <div class="pt-field"><label>Discharge Date</label><span>${fmtDate(dischargeDate)} (${los})</span></div>
    <div class="pt-field"><label>Attending Physician</label><span>${attendingMD}</span></div>
    <div class="pt-field"><label>Disposition</label><span>${dischargeDisp}</span></div>
    <div class="pt-field"><label>Code Status</label><span>${codeStatus}</span></div>
  </div>
  <h2>Diagnoses</h2>
  <div class="dx-primary">PRIMARY: ${primaryDx}</div>
  ${secondaryList.map(d => `<div class="dx-secondary">${d}</div>`).join("")}
  <div style="margin-top:8px;font-size:10.5px"><strong style="color:#991b1b">Allergies:</strong> ${allergyList || "No known allergies"}</div>
  <h2>Hospital Course &amp; Discharge Summary</h2>
  <div class="summary-text">
    ${summaryText
      ? summaryText.split("\n\n").map(p => `<p>${p.replace(/\n/g,"<br>")}</p>`).join("")
      : "<p><em>No discharge summary generated.</em></p>"
    }
  </div>
  <h2>Discharge Instructions</h2>
  ${[
    ["🏃 Activity", instructions.activity],
    ["🧂 Diet", instructions.diet],
    ["📊 Monitoring", instructions.monitoring],
    ["💊 Medications", instructions.medications],
    ["🩹 Wound Care", instructions.wounds],
  ].map(([label, content]) => content ? `<div style="margin-bottom:10px"><div style="font-size:9.5px;font-weight:700;text-transform:uppercase;color:#6b7280;margin-bottom:4px">${label}</div><div class="instr-content">${content}</div></div>` : "").join("")}
  ${activeMeds.length ? `
  <h2>Discharge Medications</h2>
  <table><thead><tr><th>Medication</th><th>Dose / Frequency</th><th>Route</th><th>Status</th><th>Instructions</th></tr></thead><tbody>
    ${activeMeds.map(m => `<tr><td><strong>${m.name||"—"}</strong></td><td>${m.dose||"—"} · ${m.frequency||"—"}</td><td>${m.route||"PO"}</td><td><span class="badge badge-${m.status||"continued"}">${(m.status||"continued").toUpperCase()}</span></td><td>${m.instructions||""}</td></tr>`).join("")}
  </tbody></table>` : ""}
  ${localFollowups.length ? `
  <h2>Follow-up Appointments</h2>
  ${localFollowups.map(f => `<div class="fu-card"><strong>${f.type||"Appointment"}</strong> — ${f.provider||""}<br>📅 ${fmtDateLong(f.date)}${f.time?" at "+f.time:""}${f.location?"<br>📍 "+f.location:""}${f.phone?"<br>📞 "+f.phone:""}</div>`).join("")}` : ""}
  <h2>⚠️ Return to ED If You Experience:</h2>
  <div class="precaution-grid">
    ${RETURN_PRECAUTIONS.map(cat => `<div class="precaution-cat"><strong style="font-size:9.5px;text-transform:uppercase;color:#b45309">${cat.icon} ${cat.cat}</strong><br>${cat.items.map(i=>`<div style="font-size:10.5px;margin-top:3px">• ${i}</div>`).join("")}</div>`).join("")}
  </div>
  ${eduData.length ? `
  <h2>Patient Education</h2>
  ${eduData.map(edu => `<div class="edu-section"><div class="edu-title">${edu.icon} ${edu.title}</div><div style="font-size:10.5px;color:#6b7280;margin-bottom:6px">${edu.tagline}</div>${edu.bullets.map(b=>`<div class="edu-bullet">${b}</div>`).join("")}</div>`).join("")}` : ""}
  <div class="doc-footer">
    <div><div class="sig-line">${attendingMD}<br>Attending Physician</div></div>
    <div class="footer-note">Generated by Notrya AI · ${today} · ${patientMRN}</div>
  </div>
</div></body></html>`);
    printWindow.document.close();
    showToast("PDF document opened — use Print to save as PDF", G.teal);
  }

  // ── SECTION RENDERERS ─────────────────────────────────────────────────────────
  function SummarySection() {
    return (
      <div style={{ padding:24, display:"flex", flexDirection:"column", gap:16 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
          <div>
            <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:19, fontWeight:700, color:G.bright }}>📋 Discharge Summary</div>
            <div style={{ fontSize:12.5, color:G.dim, marginTop:2 }}>AI-generated from encounter data · Editable before finalizing</div>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <button style={btn(`linear-gradient(135deg,${G.purple},#7c5cd6)`)} onClick={generateSummary} disabled={aiGenerating}>
              {aiGenerating ? "✦ Generating…" : "✦ Generate with Notrya AI"}
            </button>
            {summaryText && <button style={btn("transparent",G.green,"rgba(46,204,113,.3)")} onClick={() => markComplete("summary")}>✓ Approve</button>}
          </div>
        </div>

        {isLoading ? (
          <div style={{ ...card, padding:18 }}>{[85,65,90,70].map((w,i) => <Skeleton key={i} w={`${w}%`}/>)}</div>
        ) : !patient ? (
          <EmptyState icon="👤" title="No patient notes found" sub="Create clinical notes first, then return here to plan discharge."
            action={() => navigate(createPageUrl("NewNote"))} actionLabel="➕ Create New Note"/>
        ) : (
          <div style={{ ...card, background:"linear-gradient(135deg,rgba(0,212,188,.04),rgba(74,144,217,.04))" }}>
            <div style={{ padding:"13px 16px", display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
              {[
                ["Patient", patientName],
                ["MRN", patientMRN],
                ["Age / Sex", patientAge ? `${patientAge}yo ${patientGender}` : patientGender],
                ["Visit Date", fmtDate(admitDate)],
                ["Attending", attendingMD],
                ["Disposition", dischargeDisp],
                ["Primary Dx", primaryDx],
                ["Note Type", selectedNote?.note_type || "—"],
                ["Status", selectedNote?.status || "—"],
              ].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:".1em", color:G.dim, marginBottom:2 }}>{l}</div>
                  <div style={{ fontSize:12.5, fontWeight:600, color:G.bright, lineHeight:1.3 }}>{v || "—"}</div>
                </div>
              ))}
            </div>
            {secondaryDx.length > 0 && (
              <div style={{ padding:"10px 16px", borderTop:`1px solid rgba(30,58,95,.4)`, display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                <span style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", color:G.dim }}>Secondary Dx:</span>
                {secondaryDx.map((d, i) => (
                  <span key={i} style={{ fontSize:11, padding:"2px 8px", borderRadius:6, background:"rgba(74,144,217,.1)", border:"1px solid rgba(74,144,217,.25)", color:G.blue }}>
                    {typeof d === "string" ? d : d.name ?? d.description}
                  </span>
                ))}
              </div>
            )}
            {allergies.length > 0 && (
              <div style={{ padding:"8px 16px", borderTop:`1px solid rgba(30,58,95,.3)`, display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                <span style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", color:G.red }}>Allergies:</span>
                {allergies.map((a, i) => (
                  <span key={i} style={{ fontSize:11, padding:"2px 8px", borderRadius:6, background:"rgba(255,92,108,.1)", border:"1px solid rgba(255,92,108,.3)", color:G.red }}>
                    {typeof a === "string" ? a : `${a.allergen}${a.reaction ? " — "+a.reaction : ""}`}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {aiGenerating && (
          <div style={{ ...card, padding:20 }}>
            {[85,100,72,95,60,80].map((w, i) => <Skeleton key={i} w={`${w}%`}/>)}
          </div>
        )}

        {!aiGenerating && (
          <div style={card}>
            <div style={{ ...panelHead }}>
              ✦ Hospital Course &amp; Discharge Summary
              {completionChecks.summary && <span style={{ marginLeft:"auto", ...badge("rgba(46,204,113,.1)",G.green,"rgba(46,204,113,.3)") }}>✓ Complete</span>}
            </div>
            <div style={{ padding:"14px 16px" }}>
              <textarea
                value={summaryText}
                onChange={e => setSummaryText(e.target.value)}
                placeholder="Click '✦ Generate with Notrya AI' to auto-generate a discharge summary, or type directly here."
                style={{ width:"100%", minHeight:280, background:"rgba(11,29,53,.5)", border:`1px solid rgba(30,58,95,.5)`, borderRadius:9, padding:"13px 15px", fontFamily:"'DM Sans',system-ui,sans-serif", fontSize:13, color:G.bright, lineHeight:1.85, resize:"vertical", outline:"none" }}
              />
              <div style={{ display:"flex", gap:8, marginTop:10, justifyContent:"flex-end" }}>
                <button style={btn("transparent",G.dim,G.border)} onClick={() => setSummaryText("")}>Clear</button>
                <button style={btn(`linear-gradient(135deg,${G.teal},#00a896)`)} onClick={() => markComplete("summary")}>✓ Approve Summary</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function MedicationsSection() {
    return (
      <div style={{ padding:24, display:"flex", flexDirection:"column", gap:16 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
          <div>
            <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:19, fontWeight:700, color:G.bright }}>💊 Medication Reconciliation</div>
            <div style={{ fontSize:12.5, color:G.dim, marginTop:2 }}>Review medications · Add patient instructions</div>
          </div>
          <button style={btn("transparent",G.green,"rgba(46,204,113,.3)")} onClick={() => markComplete("medications")}>✓ Approve &amp; Sign</button>
        </div>

        {isLoading && <div style={{ ...card, padding:18 }}>{[80,60,90,70,75].map((w,i) => <Skeleton key={i} w={`${w}%`}/>)}</div>}
        {!isLoading && localMeds.length === 0 && (
          <EmptyState icon="💊" title="No medications found" sub="Medications listed in the clinical note will appear here automatically."/>
        )}

        {!isLoading && localMeds.length > 0 && localMeds.map(med => {
          const sc         = statusColors[med.status ?? "continued"];
          const isEditing  = editingMed === med.id;
          const medName    = med.name ?? med.medicationName ?? "Medication";
          const medStatus  = med.status ?? "continued";
          const medInstr   = med.instructions ?? "";
          return (
            <div key={med.id} style={{ ...card, borderLeft:`3px solid ${sc.color}` }}>
              <div style={{ padding:"13px 16px", display:"flex", alignItems:"flex-start", gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5, flexWrap:"wrap" }}>
                    <span style={{ fontWeight:800, fontSize:14, color:G.bright }}>{medName}</span>
                    <span style={{ ...badge(sc.bg, sc.color, sc.border), fontSize:10, fontWeight:700 }}>{medStatus.toUpperCase()}</span>
                  </div>
                  {!isEditing && (
                    <div style={{ fontSize:12, color:G.dim, lineHeight:1.65, background:"rgba(11,29,53,.5)", borderRadius:7, padding:"8px 12px", borderLeft:`2px solid ${sc.color}55` }}>
                      {medInstr || <span style={{ fontStyle:"italic", opacity:.5 }}>No patient instructions yet — click ✏ to add</span>}
                    </div>
                  )}
                  {isEditing && (
                    <textarea
                      defaultValue={medInstr}
                      onBlur={e => { updateMedInstruction(med.id, e.target.value); setEditingMed(null); }}
                      autoFocus rows={3}
                      placeholder="Enter patient instructions for this medication…"
                      style={{ width:"100%", background:"rgba(22,45,79,.8)", border:`1px solid ${G.teal}`, borderRadius:7, padding:"8px 12px", fontFamily:"inherit", fontSize:12, color:G.bright, lineHeight:1.65, resize:"none", outline:"none" }}
                    />
                  )}
                </div>
                <button style={btn("transparent",G.dim,G.border,"6px 10px")} onClick={() => setEditingMed(isEditing ? null : med.id)}>
                  {isEditing ? "✓" : "✏"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function FollowupSection() {
    const priorityColor = p => p === "urgent" ? G.red : p === "routine" ? G.blue : G.green;
    const sorted = [...localFollowups].sort((a, b) => new Date(a.date) - new Date(b.date));

    return (
      <div style={{ padding:24, display:"flex", flexDirection:"column", gap:16 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
          <div>
            <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:19, fontWeight:700, color:G.bright }}>📅 Follow-up Instructions</div>
            <div style={{ fontSize:12.5, color:G.dim, marginTop:2 }}>Appointments · Lab orders · Referrals</div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button style={btn("transparent",G.purple,"rgba(155,109,255,.3)")} onClick={() => setAddFollowupModal(true)}>＋ Add Appointment</button>
            <button style={btn("transparent",G.green,"rgba(46,204,113,.3)")} onClick={() => markComplete("followup")}>✓ Approve</button>
          </div>
        </div>

        {sorted.length === 0 && (
          <EmptyState icon="📅" title="No follow-up appointments" sub="Add appointments using the button above" action={() => setAddFollowupModal(true)} actionLabel="＋ Add First Appointment"/>
        )}

        {sorted.map(f => {
          const col = priorityColor(f.priority);
          const daysAway = daysUntil(f.date);
          return (
            <div key={f.id} style={{ ...card, borderLeft:`3px solid ${col}` }}>
              <div style={{ padding:"14px 16px", display:"flex", gap:14, alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                    <span style={{ fontWeight:800, fontSize:13.5, color:G.bright }}>{f.provider ?? f.type ?? "Appointment"}</span>
                    <span style={{ ...badge(`${col}18`, col, `${col}44`), fontSize:10 }}>{(f.priority ?? "routine").toUpperCase()}</span>
                    <span style={{ fontSize:11, color:G.dim }}>{f.type}</span>
                  </div>
                  <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:4 }}>
                    {f.date && <span style={{ fontSize:12, color:G.text }}>📅 {fmtDateLong(f.date)}{f.time ? " at "+f.time : ""}</span>}
                    {daysAway !== null && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700, color:col }}>{daysAway}d away</span>}
                  </div>
                  {f.location && <div style={{ fontSize:12, color:G.dim, marginBottom:3 }}>📍 {f.location}</div>}
                  {f.phone && <div style={{ fontSize:12, color:G.dim, marginBottom:3 }}>📞 {f.phone}</div>}
                  {f.notes && <div style={{ fontSize:12, color:G.text, lineHeight:1.65, background:"rgba(11,29,53,.5)", borderRadius:7, padding:"7px 11px", borderLeft:`2px solid ${col}55`, marginTop:6 }}>📌 {f.notes}</div>}
                </div>
                <button style={{ background:"none", border:"none", color:G.muted, cursor:"pointer", fontSize:16, padding:2 }} onClick={() => deleteFollowup(f.id)}>✕</button>
              </div>
            </div>
          );
        })}

        {addFollowupModal && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", backdropFilter:"blur(8px)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={() => setAddFollowupModal(false)}>
            <div style={{ background:G.slate, border:`1px solid ${G.border}`, borderRadius:18, width:520, maxHeight:"88vh", overflowY:"auto" }} onClick={e => e.stopPropagation()}>
              <div style={{ padding:"18px 22px 14px", borderBottom:`1px solid ${G.border}`, display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:20 }}>📅</span>
                <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:18, fontWeight:700, color:G.bright, flex:1 }}>Add Follow-up Appointment</div>
                <button style={{ background:"none", border:"none", color:G.dim, fontSize:20, cursor:"pointer" }} onClick={() => setAddFollowupModal(false)}>✕</button>
              </div>
              <div style={{ padding:"16px 22px", display:"flex", flexDirection:"column", gap:10 }}>
                {[
                  ["Appointment Type", "type", "text", "e.g. Primary Care, Cardiology, Lab"],
                  ["Provider / Organization", "provider", "text", "e.g. Dr. Smith, Quest Diagnostics"],
                  ["Location", "location", "text", "Address or clinic name"],
                  ["Phone Number", "phone", "tel", ""],
                  ["Notes", "notes", "text", "Labs ordered, reason, special instructions…"],
                ].map(([label, key, type, ph]) => (
                  <div key={key} style={{ display:"flex", flexDirection:"column", gap:4 }}>
                    <span style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", color:G.dim }}>{label}</span>
                    <input type={type} placeholder={ph} value={newFollowup[key]} onChange={e => setNewFollowup(p => ({ ...p, [key]:e.target.value }))}
                      style={{ background:"rgba(22,45,79,.8)", border:`1px solid ${G.border}`, borderRadius:8, padding:"8px 12px", fontFamily:"inherit", fontSize:12.5, color:G.bright, outline:"none" }}/>
                  </div>
                ))}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                    <span style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", color:G.dim }}>Date</span>
                    <input type="date" value={newFollowup.date} onChange={e => setNewFollowup(p => ({ ...p, date:e.target.value }))}
                      style={{ background:"rgba(22,45,79,.8)", border:`1px solid ${G.border}`, borderRadius:8, padding:"8px 12px", fontFamily:"inherit", fontSize:12.5, color:G.bright, outline:"none" }}/>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                    <span style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", color:G.dim }}>Time</span>
                    <input type="time" value={newFollowup.time} onChange={e => setNewFollowup(p => ({ ...p, time:e.target.value }))}
                      style={{ background:"rgba(22,45,79,.8)", border:`1px solid ${G.border}`, borderRadius:8, padding:"8px 12px", fontFamily:"inherit", fontSize:12.5, color:G.bright, outline:"none" }}/>
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  <span style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", color:G.dim }}>Priority</span>
                  <select value={newFollowup.priority} onChange={e => setNewFollowup(p => ({ ...p, priority:e.target.value }))}
                    style={{ background:"rgba(22,45,79,.8)", border:`1px solid ${G.border}`, borderRadius:8, padding:"8px 12px", fontFamily:"inherit", fontSize:12.5, color:G.bright, outline:"none" }}>
                    <option value="urgent">Urgent (within 7 days)</option>
                    <option value="routine">Routine (within 2–4 weeks)</option>
                    <option value="elective">Elective (1–3 months)</option>
                  </select>
                </div>
              </div>
              <div style={{ padding:"14px 22px", borderTop:`1px solid ${G.border}`, display:"flex", gap:8, justifyContent:"flex-end" }}>
                <button style={btn("transparent",G.text,G.border)} onClick={() => setAddFollowupModal(false)}>Cancel</button>
                <button style={btn(`linear-gradient(135deg,${G.purple},#7c5cd6)`)} onClick={saveNewFollowup}>＋ Add Appointment</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function EducationSection() {
    return (
      <div style={{ padding:24, display:"flex", flexDirection:"column", gap:16 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
          <div>
            <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:19, fontWeight:700, color:G.bright }}>📚 Patient Education Materials</div>
            <div style={{ fontSize:12.5, color:G.dim, marginTop:2 }}>Select handouts for this patient's discharge packet</div>
          </div>
          <button style={btn("transparent",G.green,"rgba(46,204,113,.3)")} onClick={() => markComplete("education")}>✓ Finalize Selection</button>
        </div>
        <div style={{ fontSize:12, color:G.text, background:"rgba(74,144,217,.07)", border:"1px solid rgba(74,144,217,.25)", borderRadius:9, padding:"10px 14px", lineHeight:1.7 }}>
          ℹ️ <strong style={{ color:G.blue }}>{selectedEdu.length}</strong> material{selectedEdu.length !== 1 ? "s" : ""} selected for this discharge packet.
        </div>
        {EDU_LIBRARY.map(edu => {
        const isSelected = selectedEdu.includes(edu.id);
        return (
          <div key={edu.id} style={{ ...card, border:`1px solid ${isSelected ? "rgba(0,212,188,.35)" : G.border}`, transition:"all .15s" }}>
            <div style={{ padding:"14px 16px" }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                  <div style={{ width:44, height:44, borderRadius:11, background:isSelected?"rgba(0,212,188,.12)":"rgba(22,45,79,.5)", border:`1px solid ${isSelected?"rgba(0,212,188,.35)":G.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
                    {edu.icon}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                      <span style={{ fontWeight:800, fontSize:13.5, color:G.bright }}>{edu.title}</span>
                      <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:6, background:"rgba(74,144,217,.1)", border:"1px solid rgba(74,144,217,.25)", color:G.blue }}>{edu.category}</span>
                    </div>
                    <div style={{ fontSize:12.5, color:G.dim, marginBottom:8 }}>{edu.tagline}</div>
                    {edu.bullets.slice(0, 2).map((b, i) => (
                      <div key={i} style={{ fontSize:11.5, color:G.text, lineHeight:1.55, display:"flex", gap:6, marginBottom:3 }}>
                        <span style={{ color:G.teal, flexShrink:0 }}>·</span>{b}
                      </div>
                    ))}
                    {edu.bullets.length > 2 && <div style={{ fontSize:11, color:G.muted, marginTop:3 }}>+ {edu.bullets.length - 2} more points…</div>}
                  </div>
                  <button
                    onClick={() => setSelectedEdu(prev => isSelected ? prev.filter(x => x !== edu.id) : [...prev, edu.id])}
                    style={{ padding:"8px 14px", borderRadius:8, fontFamily:"inherit", fontSize:12, fontWeight:700, cursor:"pointer", border:`1px solid ${isSelected?"rgba(0,212,188,.4)":G.border}`, background:isSelected?"rgba(0,212,188,.1)":"transparent", color:isSelected?G.teal:G.dim, flexShrink:0 }}>
                    {isSelected ? "✓ Included" : "＋ Include"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function InstructionsSection() {
    const fields = [
      { key:"activity",   label:"🏃 Activity & Exercise Restrictions", color:G.blue,   ph:"Describe activity restrictions, mobility guidelines…" },
      { key:"diet",       label:"🧂 Diet & Nutrition Guidance",         color:G.green,  ph:"Sodium limits, fluid restrictions, dietary modifications…" },
      { key:"monitoring", label:"📊 Monitoring at Home",                color:G.teal,   ph:"Daily weight, BP checks, blood sugar targets…" },
      { key:"medications",label:"💊 Medications Overview",              color:G.amber,  ph:"General medication instructions, new medications to highlight…" },
      { key:"wounds",     label:"🩹 Wound / Incision Care",             color:G.rose,   ph:"Dressing changes, bathing restrictions, signs of infection…" },
    ];
    return (
      <div style={{ padding:24, display:"flex", flexDirection:"column", gap:16 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
          <div>
            <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:19, fontWeight:700, color:G.bright }}>📝 Discharge Instructions</div>
            <div style={{ fontSize:12.5, color:G.dim, marginTop:2 }}>Editable · Printed verbatim in the patient's discharge packet</div>
          </div>
          <button style={btn("transparent",G.green,"rgba(46,204,113,.3)")} onClick={() => markComplete("instructions")}>✓ Finalize Instructions</button>
        </div>
        {fields.map(f => (
          <div key={f.key} style={{ ...card, borderLeft:`3px solid ${f.color}` }}>
            <div style={{ padding:"10px 16px", borderBottom:`1px solid rgba(30,58,95,.4)`, background:"rgba(22,45,79,.3)" }}>
              <span style={{ fontWeight:800, fontSize:12.5, color:G.bright }}>{f.label}</span>
            </div>
            <div style={{ padding:"12px 16px" }}>
              <textarea value={instructions[f.key]} onChange={e => setInstructions(p => ({ ...p, [f.key]:e.target.value }))}
                placeholder={f.ph} rows={4}
                style={{ width:"100%", background:"rgba(11,29,53,.5)", border:`1px solid rgba(30,58,95,.4)`, borderRadius:8, padding:"10px 13px", fontFamily:"'DM Sans',system-ui,sans-serif", fontSize:12.5, color:G.bright, lineHeight:1.8, resize:"vertical", outline:"none" }}
              />
            </div>
          </div>
        ))}
        <div style={card}>
          <div style={{ ...panelHead, background:"rgba(255,92,108,.06)", borderBottom:`1px solid rgba(255,92,108,.25)` }}>
            ⚠️ Return-to-ED Precautions
          </div>
          <div style={{ padding:"14px 16px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {RETURN_PRECAUTIONS.map(cat => (
              <div key={cat.cat} style={{ background:"rgba(245,166,35,.06)", border:"1px solid rgba(245,166,35,.2)", borderRadius:8, padding:"10px 12px" }}>
                <div style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:G.amber, marginBottom:6 }}>{cat.icon} {cat.cat}</div>
                {cat.items.map((item, i) => (
                  <div key={i} style={{ fontSize:12, color:G.text, lineHeight:1.55, marginBottom:3, display:"flex", gap:6 }}>
                    <span style={{ color:G.amber, flexShrink:0 }}>•</span>{item}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const DISPOSITIONS = [
    { id:"home",        icon:"🏠", label:"Discharge Home",       sub:"Patient may safely return home",        color:"#00d4bc", selectedBg:"rgba(0,212,188,.12)",  border:"rgba(0,212,188,.5)"  },
    { id:"floor",       icon:"🏥", label:"Admit — Floor",        sub:"General medical/surgical floor",        color:"#4a90d9", selectedBg:"rgba(74,144,217,.12)", border:"rgba(74,144,217,.5)" },
    { id:"telemetry",   icon:"📡", label:"Admit — Telemetry",    sub:"Continuous cardiac monitoring",         color:"#9b6dff", selectedBg:"rgba(155,109,255,.12)",border:"rgba(155,109,255,.5)"},
    { id:"icu",         icon:"🚨", label:"Admit — ICU",          sub:"Critical care — high acuity",           color:"#ff5c6c", selectedBg:"rgba(255,92,108,.12)", border:"rgba(255,92,108,.5)" },
    { id:"obs",         icon:"🔭", label:"Observation",          sub:"Hospital outpatient status <48h",       color:"#f5a623", selectedBg:"rgba(245,166,35,.12)", border:"rgba(245,166,35,.5)" },
    { id:"transfer",    icon:"🚑", label:"Transfer",             sub:"Higher level / specialty facility",     color:"#4a90d9", selectedBg:"rgba(74,144,217,.12)", border:"rgba(74,144,217,.5)" },
    { id:"ama",         icon:"⚠️", label:"AMA",                  sub:"Against Medical Advice",                color:"#f5a623", selectedBg:"rgba(245,166,35,.12)", border:"rgba(245,166,35,.5)" },
    { id:"expired",     icon:"🕯️", label:"Expired",              sub:"Patient expired in ED",                 color:"#8a9bb0", selectedBg:"rgba(138,155,176,.1)", border:"rgba(138,155,176,.4)"},
  ];

  function DispositionSection() {
    return (
      <div style={{ padding:24, display:"flex", flexDirection:"column", gap:20 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
          <div>
            <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:19, fontWeight:700, color:G.bright }}>🏥 Select Disposition</div>
            <div style={{ fontSize:12.5, color:G.dim, marginTop:2 }}>Choose the patient's disposition at time of discharge</div>
          </div>
          {selectedDisposition && (
            <button style={btn("transparent",G.green,"rgba(46,204,113,.3)")} onClick={() => markComplete("disposition")}>✓ Confirm Disposition</button>
          )}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:10 }}>
          {DISPOSITIONS.map(d => {
            const isSelected = selectedDisposition === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedDisposition(d.id)}
                style={{
                  background: isSelected ? d.selectedBg : "rgba(13,34,64,.7)",
                  border: `2px solid ${isSelected ? d.border : "rgba(30,58,95,.6)"}`,
                  borderRadius: 14,
                  padding: "18px 14px",
                  cursor: "pointer",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                  transition: "all .2s",
                  outline: "none",
                  fontFamily: "inherit",
                  boxShadow: isSelected ? `0 0 0 1px ${d.border}, 0 4px 18px ${d.selectedBg}` : "none",
                }}
              >
                <div style={{ fontSize: 28, lineHeight:1 }}>{d.icon}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: isSelected ? d.color : G.bright, lineHeight: 1.25, marginBottom: 4 }}>{d.label}</div>
                  <div style={{ fontSize: 10.5, color: isSelected ? d.color : G.dim, lineHeight: 1.45, opacity: isSelected ? .9 : .7 }}>{d.sub}</div>
                </div>
              </button>
            );
          })}
        </div>

        {selectedDisposition && (() => {
          const d = DISPOSITIONS.find(x => x.id === selectedDisposition);
          return (
            <div style={{ background: d.selectedBg, border:`1px solid ${d.border}`, borderRadius:12, padding:"16px 20px", display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ fontSize:32 }}>{d.icon}</div>
              <div>
                <div style={{ fontSize:14, fontWeight:800, color:d.color, marginBottom:3 }}>Selected: {d.label}</div>
                <div style={{ fontSize:12.5, color:G.text }}>{d.sub}</div>
              </div>
              <button onClick={() => setSelectedDisposition(null)} style={{ marginLeft:"auto", background:"none", border:"none", color:G.muted, cursor:"pointer", fontSize:18 }}>✕</button>
            </div>
          );
        })()}
      </div>
    );
  }

  const SECTIONS = [
    { id:"disposition",  icon:"🏥", label:"Disposition",                color:G.teal   },
    { id:"summary",      icon:"📋", label:"Discharge Summary",          color:G.teal   },
    { id:"medications",  icon:"💊", label:"Medication Reconciliation",  color:G.amber  },
    { id:"followup",     icon:"📅", label:"Follow-up Instructions",     color:G.purple },
    { id:"education",    icon:"📚", label:"Patient Education",          color:G.blue   },
    { id:"instructions", icon:"📝", label:"Discharge Instructions",     color:G.rose   },
  ];
  const renderActiveSection = () => {
    switch (activeSection) {
      case "summary":      return SummarySection();
      case "medications":  return MedicationsSection();
      case "followup":     return FollowupSection();
      case "education":    return EducationSection();
      case "instructions": return InstructionsSection();
      default:             return DispositionSection();
    }
  };

  return (
    <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif", background:G.navy, minHeight:"100vh", color:G.text, display:"flex", flexDirection:"column", position:"relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#2a4d72;border-radius:2px}
        input:focus,select:focus,textarea:focus{border-color:#00d4bc!important}
        select option{background:#0d2240}
        @keyframes shimmer{to{background-position:-200% 0}}
        .section-btn:hover{background:rgba(0,212,188,.05)!important;border-color:rgba(0,212,188,.2)!important;color:#e8f4ff!important}
        .act-btn:hover{opacity:.85}
      `}</style>

      <div style={{ position:"fixed", inset:0, background:`radial-gradient(ellipse 70% 50% at 8% 5%,rgba(0,168,150,.07),transparent 55%),radial-gradient(ellipse 55% 45% at 92% 92%,rgba(155,109,255,.05),transparent 50%)`, pointerEvents:"none", zIndex:0 }}/>

      {/* PAGE HEADER */}
      <div style={{ position:"relative", zIndex:1, padding:"0 28px 12px", borderBottom:`1px solid rgba(30,58,95,.6)`, background:"rgba(11,29,53,.4)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:46, height:46, background:"rgba(0,212,188,.1)", border:"1px solid rgba(0,212,188,.25)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>🏥</div>
          <div>
            <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:22, fontWeight:700, color:G.bright }}>Discharge Planning</div>
            <div style={{ fontSize:12, color:G.dim, marginTop:2 }}>
              {patient
                ? <><span style={{ color:G.bright, fontWeight:600 }}>{patientName}</span> &nbsp;·&nbsp; {patientMRN} &nbsp;·&nbsp; {primaryDx?.split("(")[0]?.trim() || "Diagnosis pending"}</>
                : <span style={{ color:G.amber }}>Select a patient note below to begin discharge planning</span>
              }
            </div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          {/* Patient selector */}
          {clinicalNotes.length > 0 && (
            <select value={selectedNoteId || ""} onChange={e => setSelectedNoteId(e.target.value)}
              style={{ background:G.edge, border:`1px solid ${G.border}`, borderRadius:8, padding:"6px 12px", fontFamily:"inherit", fontSize:12, color:G.bright, outline:"none", maxWidth:240 }}>
              {clinicalNotes.map(n => (
                <option key={n.id} value={n.id}>{n.patient_name || "Unknown"} — {n.diagnoses?.[0] || n.chief_complaint || "Note"}</option>
              ))}
            </select>
          )}
          {selectedNoteId && (
            <button className="act-btn"
              style={{ ...btn("transparent", G.dim, G.border, "6px 12px"), transition:"all .15s" }}
              onClick={() => navigate(createPageUrl("NoteDetail") + `?id=${selectedNoteId}`)}>
              ↗ Open Note
            </button>
          )}
          {/* Completion ring */}
          <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(22,45,79,.5)", border:`1px solid ${G.border}`, borderRadius:9, padding:"7px 12px" }}>
            <div style={{ position:"relative", width:36, height:36 }}>
              <svg width="36" height="36" viewBox="0 0 36 36" style={{ transform:"rotate(-90deg)" }}>
                <circle cx="18" cy="18" r="14" fill="none" stroke={G.edge} strokeWidth="3.5"/>
                <circle cx="18" cy="18" r="14" fill="none" stroke={completionPct === totalSections ? G.green : G.teal} strokeWidth="3.5"
                  strokeDasharray={`${2 * Math.PI * 14}`}
                  strokeDashoffset={`${2 * Math.PI * 14 * (1 - completionPct / totalSections)}`}
                  strokeLinecap="round" style={{ transition:"stroke-dashoffset .5s" }}/>
              </svg>
              <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:G.bright }}>{completionPct}/{totalSections}</div>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:G.bright, lineHeight:1.2 }}>Sections Complete</div>
              <div style={{ fontSize:10, color:G.dim }}>{completionPct === totalSections ? "Ready to finalize" : "In progress"}</div>
            </div>
          </div>

        </div>
      </div>

      {/* MAIN 3-COL LAYOUT */}
      <div style={{ position:"relative", zIndex:1, display:"grid", gridTemplateColumns:"260px 1fr 280px", flex:1, minHeight:"calc(100vh - 130px)" }}>

        {/* LEFT — Section navigator */}
        <div style={{ borderRight:`1px solid ${G.border}`, background:"rgba(11,29,53,.3)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={panelHead}>📋 Discharge Checklist</div>
          <div style={{ padding:"12px 14px", borderBottom:`1px solid rgba(30,58,95,.4)`, flexShrink:0 }}>
            {isLoading ? (
              <><Skeleton h={36}/><Skeleton w="80%"/></>
            ) : patient ? (
              <>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                  <div style={{ width:36, height:36, borderRadius:9, background:"linear-gradient(135deg,rgba(0,212,188,.15),rgba(74,144,217,.15))", border:`1px solid rgba(0,212,188,.25)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>👤</div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:12.5, color:G.bright, lineHeight:1.2 }}>{patientName}</div>
                    <div style={{ fontSize:10.5, color:G.dim }}>{patientMRN}</div>
                  </div>
                </div>
                <div style={{ fontSize:11.5, color:G.text, background:"rgba(22,45,79,.5)", borderRadius:7, padding:"7px 10px", borderLeft:`2px solid ${G.teal}`, lineHeight:1.4 }}>{primaryDx || "Diagnosis pending"}</div>
              </>
            ) : (
              <div style={{ fontSize:12, color:G.muted, textAlign:"center", padding:"12px 4px", lineHeight:1.6 }}>
                👤 No notes found<br/><span style={{ fontSize:10.5, color:G.dim }}>Create clinical notes first</span>
              </div>
            )}
          </div>
          <div style={{ padding:"8px", flex:1, overflowY:"auto" }}>
            {SECTIONS.map(sec => {
              const done     = completionChecks[sec.id];
              const isActive = activeSection === sec.id;
              return (
                <button key={sec.id} className="section-btn"
                  style={{ width:"100%", textAlign:"left", padding:"11px 12px", background:isActive?`${sec.color}0d`:"transparent", border:`1px solid ${isActive?`${sec.color}44`:"rgba(30,58,95,.5)"}`, borderRadius:9, cursor:"pointer", fontFamily:"inherit", fontSize:12.5, fontWeight:600, color:isActive?G.bright:G.dim, display:"flex", alignItems:"center", gap:10, marginBottom:4, transition:"all .12s" }}
                  onClick={() => setActiveSection(sec.id)}>
                  <span style={{ fontSize:17, width:22 }}>{sec.icon}</span>
                  <span style={{ flex:1, lineHeight:1.3 }}>{sec.label}</span>
                  {done
                    ? <span style={{ width:18, height:18, borderRadius:"50%", background:"rgba(46,204,113,.2)", border:"1px solid rgba(46,204,113,.5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:G.green, flexShrink:0 }}>✓</span>
                    : <span style={{ width:18, height:18, borderRadius:"50%", background:`${sec.color}18`, border:`1px solid ${sec.color}44`, flexShrink:0 }}/>
                  }
                </button>
              );
            })}
          </div>
          {allergies.length > 0 && (
            <div style={{ borderTop:`1px solid rgba(255,92,108,.25)`, flexShrink:0 }}>
              <div style={{ padding:"10px 14px", background:"rgba(255,92,108,.06)" }}>
                <div style={{ fontSize:9.5, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:G.red, marginBottom:5 }}>⚠ Documented Allergies</div>
                {allergies.map((a, i) => (
                  <div key={i} style={{ fontSize:11.5, color:G.rose, lineHeight:1.5, marginBottom:2, display:"flex", gap:5 }}>
                    <span style={{ color:G.red }}>•</span>
                    {typeof a === "string" ? a : `${a.allergen}${a.reaction ? " — "+a.reaction : ""}`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CENTER — Active section */}
        <div style={{ overflowY:"auto", background:"rgba(5,10,20,.3)" }}>
          {renderActiveSection()}
        </div>

        {/* RIGHT — Status + export panel */}
        <div style={{ borderLeft:`1px solid ${G.border}`, background:"rgba(11,29,53,.3)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={panelHead}>📊 Plan Status</div>
          <div style={{ overflowY:"auto", flex:1, padding:10 }}>
            <div style={{ background:G.panel, border:`1px solid ${G.border}`, borderRadius:10, padding:"12px 13px", marginBottom:8 }}>
              <div style={{ fontSize:9.5, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:G.dim, marginBottom:8 }}>Completion</div>
              {SECTIONS.map(sec => {
                const done = completionChecks[sec.id];
                return (
                  <div key={sec.id} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                    <div style={{ width:7, height:7, borderRadius:"50%", background:done?G.green:G.edge, flexShrink:0, border:`1px solid ${done?"rgba(46,204,113,.5)":G.border}` }}/>
                    <span style={{ flex:1, fontSize:11.5, color:done?G.bright:G.dim, fontWeight:done?600:400 }}>{sec.label}</span>
                    {done
                      ? <span style={{ fontSize:10, color:G.green }}>✓</span>
                      : <button style={{ fontSize:9.5, fontWeight:700, color:sec.color, background:`${sec.color}10`, border:`1px solid ${sec.color}30`, borderRadius:5, padding:"2px 7px", cursor:"pointer", fontFamily:"inherit" }}
                          onClick={() => setActiveSection(sec.id)}>Open →</button>
                    }
                  </div>
                );
              })}
              {completionPct === totalSections && (
                <div style={{ marginTop:10, background:"rgba(46,204,113,.08)", border:"1px solid rgba(46,204,113,.25)", borderRadius:8, padding:"9px 11px", fontSize:12, color:G.green, fontWeight:600, textAlign:"center" }}>
                  🎉 All sections complete!<br/><span style={{ fontSize:11, fontWeight:400, color:G.dim }}>Ready to generate PDF</span>
                </div>
              )}
            </div>

            {localFollowups.length > 0 && (
              <div style={{ background:G.panel, border:`1px solid ${G.border}`, borderRadius:10, padding:"12px 13px", marginBottom:8 }}>
                <div style={{ fontSize:9.5, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:G.dim, marginBottom:7 }}>📅 Follow-up ({localFollowups.length})</div>
                {[...localFollowups].sort((a,b)=>new Date(a.date)-new Date(b.date)).map(f => {
                  const days = daysUntil(f.date);
                  const col = f.priority === "urgent" ? G.red : G.blue;
                  return (
                    <div key={f.id} style={{ display:"flex", alignItems:"flex-start", gap:7, marginBottom:7, paddingBottom:7, borderBottom:`1px solid rgba(30,58,95,.3)` }}>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10.5, fontWeight:700, color:col, flexShrink:0, marginTop:1 }}>{days !== null ? days+"d" : "—"}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:11.5, fontWeight:600, color:G.bright, lineHeight:1.25, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.type || "Appointment"}</div>
                        <div style={{ fontSize:10.5, color:G.dim }}>{fmtDateLong(f.date)}{f.provider ? " · "+f.provider.split(",")[0] : ""}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedEdu.length > 0 && (
              <div style={{ background:G.panel, border:`1px solid ${G.border}`, borderRadius:10, padding:"12px 13px", marginBottom:8 }}>
                <div style={{ fontSize:9.5, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:G.dim, marginBottom:7 }}>📚 Education ({selectedEdu.length})</div>
                {EDU_LIBRARY.filter(e => selectedEdu.includes(e.id)).map(e => (
                  <div key={e.id} style={{ fontSize:11.5, color:G.text, marginBottom:4, display:"flex", gap:6, alignItems:"center" }}>
                    <span style={{ fontSize:12 }}>{e.icon}</span>{e.title}
                  </div>
                ))}
              </div>
            )}

            <div style={panelHead}>🖨 Export</div>
            <div style={{ padding:10 }}>
              <button className="act-btn"
                style={{ width:"100%", padding:"9px 12px", borderRadius:8, fontFamily:"inherit", fontSize:12, fontWeight:700, cursor:"pointer", border:`1px solid ${G.border}`, background:"transparent", color:G.text, display:"flex", alignItems:"center", gap:8, transition:"all .15s" }}
                onClick={() => navigator.clipboard?.writeText(summaryText || "").then(()=>showToast("Summary copied ✓",G.teal))}>
                <span style={{ fontSize:15 }}>📋</span>Copy Summary to Clipboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div style={{ position:"sticky", bottom:0, zIndex:10, height:58, background:"rgba(11,29,53,.97)", borderTop:`1px solid ${G.border}`, backdropFilter:"blur(16px)", padding:"0 28px", display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ flex:1, display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:G.dim }}>{patientName} · {patientMRN}</span>
          <span style={{ padding:"4px 10px", borderRadius:20, fontSize:10.5, fontWeight:700, background:completionPct===totalSections?"rgba(46,204,113,.1)":"rgba(245,166,35,.1)", border:`1px solid ${completionPct===totalSections?"rgba(46,204,113,.3)":"rgba(245,166,35,.3)"}`, color:completionPct===totalSections?G.green:G.amber }}>
            {completionPct}/{totalSections} Complete
          </span>
        </div>
        <button className="act-btn" style={{ ...btn("transparent",G.text,G.border,"7px 14px"), transition:"all .15s" }} onClick={savePlan} disabled={saving}>💾 Save Draft</button>
        <button className="act-btn" style={{ ...btn("transparent",G.purple,"rgba(155,109,255,.3)","7px 14px"), transition:"all .15s" }} onClick={generateSummary}>✦ AI Generate Summary</button>
        <button className="act-btn" style={{ ...btn(`linear-gradient(135deg,${G.teal},#00a896)`,undefined,undefined,"7px 16px"), transition:"all .15s" }} onClick={printPDF}>🖨 Generate PDF Discharge Packet</button>
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{ position:"fixed", bottom:76, right:24, zIndex:999 }}>
          <div style={{ background:G.panel, border:`1px solid ${G.border}`, borderLeft:`3px solid ${toast.color}`, borderRadius:10, padding:"11px 16px", fontSize:12.5, fontWeight:600, color:G.bright, boxShadow:"0 8px 24px rgba(0,0,0,.35)", maxWidth:380 }}>{toast.msg}</div>
        </div>
      )}
    </div>
  );
}