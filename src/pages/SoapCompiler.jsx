import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const T = {
  navy:   "#050f1e",
  slate:  "#0b1d35",
  panel:  "#0e2340",
  edge:   "#162d4f",
  border: "#1e3a5f",
  muted:  "#2a4d72",
  dim:    "#4a7299",
  text:   "#c8ddf0",
  bright: "#e8f4ff",
  teal:   "#00d4bc",
  amber:  "#f5a623",
  red:    "#ff5c6c",
  green:  "#2ecc71",
  purple: "#9b6dff",
  rose:   "#f472b6",
};

const NOTE_STYLES = [
  { value: "standard_soap",  label: "Standard SOAP" },
  { value: "expanded_soap",  label: "Expanded SOAP (full H&P)" },
  { value: "ed_note",        label: "ED Note" },
  { value: "progress_note",  label: "Progress Note" },
  { value: "discharge",      label: "Discharge Summary" },
];

const VERBOSITY = [
  { value: "concise",   label: "Concise" },
  { value: "standard",  label: "Standard" },
  { value: "detailed",  label: "Detailed" },
];

const STYLE_INSTRUCTIONS = {
  standard_soap:  "Write a standard SOAP note with four clearly labeled sections: SUBJECTIVE, OBJECTIVE, ASSESSMENT, and PLAN. Each section should be complete and cohesive.",
  expanded_soap:  "Write an expanded SOAP note including full History of Present Illness, complete Review of Systems, detailed Physical Exam by system, full Assessment with differential, and comprehensive Plan with all sub-elements.",
  ed_note:        "Write an Emergency Department note formatted for ED documentation: include CC, HPI, PMH/Meds/Allergies, ROS, Physical Exam, MDM (Medical Decision Making), Assessment, and Disposition.",
  progress_note:  "Write a concise progress note in SOAP format appropriate for an ongoing encounter or inpatient update.",
  discharge:      "Write a Discharge Summary including: Admission Diagnosis, Hospital Course, Procedures Performed, Discharge Condition, Discharge Medications, Follow-Up Instructions, and Return Precautions.",
};

function buildFallbackNote(encounter, subj, obj, assess, plan, user) {
  const vitals = `T ${obj?.vitals?.temp || obj?.temperature || "—"} | HR ${obj?.vitals?.hr || obj?.heartRate || "—"} | BP ${obj?.vitals?.bp || obj?.bloodPressure || "—"} | RR ${obj?.vitals?.rr || obj?.respiratoryRate || "—"} | SpO2 ${obj?.vitals?.spo2 || obj?.oxygenSaturation || "—"}%`;

  const lines = [
    `SOAP NOTE`,
    `Patient: ${encounter?.patient_initials || "—"} | Age/Sex: ${encounter?.patient_age || "—"}y ${encounter?.patient_sex || "—"}`,
    `Date of Service: ${encounter?.arrival_time ? format(new Date(encounter.arrival_time), "MMMM d, yyyy") : "—"}`,
    `Provider: ${user?.full_name || "—"}`,
    `Chief Complaint: ${encounter?.chief_complaint || "—"}`,
    `Allergies: ${encounter?.allergies || "NKDA"}`,
    "",
    "SUBJECTIVE",
    `Chief Complaint: ${subj?.chief_complaint || encounter?.chief_complaint || "[Not documented]"}`,
    `HPI: ${subj?.history_of_present_illness || "[Not documented]"}`,
    `Past Medical History: ${subj?.medical_history || "[Not documented]"}`,
    `Medications: ${Array.isArray(subj?.medications) ? subj.medications.join(", ") : subj?.medications || "[Not documented]"}`,
    `Allergies: ${Array.isArray(subj?.allergies) ? subj.allergies.join(", ") : encounter?.allergies || "NKDA"}`,
    `Review of Systems: ${subj?.review_of_systems || "[Not documented]"}`,
    "",
    "OBJECTIVE",
    `Vitals: ${vitals}`,
    `Physical Exam: ${subj?.physical_exam || obj?.physical_exam || "[Not documented]"}`,
    `Labs: ${obj?.lab_results || (Array.isArray(subj?.lab_findings) ? subj.lab_findings.map(l => `${l.test_name}: ${l.result}`).join(", ") : "[Not documented]")}`,
    `Imaging: ${obj?.imaging_results || (Array.isArray(subj?.imaging_findings) ? subj.imaging_findings.map(i => `${i.study_type}: ${i.impression}`).join("; ") : "[Not documented]")}`,
    "",
    "ASSESSMENT",
    `Primary Diagnosis: ${assess?.primary_diagnosis || subj?.assessment || "[Not documented]"}`,
    `ICD-10: ${assess?.icd10_code || "[Not documented]"}`,
    `Clinical Reasoning: ${assess?.clinical_reasoning || "[Not documented]"}`,
    "",
    "PLAN",
    `${plan?.plan || subj?.plan || "[Not documented]"}`,
    `Disposition: ${assess?.disposition || plan?.disposition || "[Not documented]"}`,
    "",
    "SIGNATURE",
    "_______________________________",
    `${user?.full_name || "Provider"}`,
    `Electronically signed via Notrya AI · ${new Date().toLocaleString()}`,
  ];
  return lines.join("\n");
}

function ShimmerBlock() {
  const lines = [
    { width: "40%", height: "28px", mb: "20px" },
    { width: "15%", height: "16px", mb: "8px" },
    { width: "100%", height: "14px", mb: "6px" },
    { width: "95%", height: "14px", mb: "6px" },
    { width: "88%", height: "14px", mb: "20px" },
    { width: "15%", height: "16px", mb: "8px" },
    { width: "100%", height: "14px", mb: "6px" },
    { width: "92%", height: "14px", mb: "6px" },
    { width: "80%", height: "14px", mb: "20px" },
    { width: "15%", height: "16px", mb: "8px" },
    { width: "100%", height: "14px", mb: "6px" },
    { width: "97%", height: "14px", mb: "6px" },
  ];
  return (
    <div style={{ padding: "32px", maxWidth: 760, margin: "0 auto" }}>
      {lines.map((l, i) => (
        <div key={i} style={{
          width: l.width, height: l.height, marginBottom: l.mb,
          borderRadius: 6,
          background: `linear-gradient(90deg, rgba(30,58,95,0.6) 25%, rgba(74,114,153,0.3) 50%, rgba(30,58,95,0.6) 75%)`,
          backgroundSize: "200% 100%",
          animation: "shimmer 1.4s infinite",
        }} />
      ))}
    </div>
  );
}

export default function SoapCompiler() {
  const params = new URLSearchParams(window.location.search);
  const encounterId = params.get("encounterId");

  const [user, setUser] = useState(null);
  const [noteStyle, setNoteStyle] = useState("standard_soap");
  const [verbosity, setVerbosity] = useState("standard");
  const [includeSections, setIncludeSections] = useState(["header", "subjective", "objective", "assessment", "plan", "signature"]);
  const [compiledNote, setCompiledNote] = useState(null);
  const [compiledNoteId, setCompiledNoteId] = useState(null);
  const [compileInProgress, setCompileInProgress] = useState(false);
  const [noteEdited, setNoteEdited] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [copyLabel, setCopyLabel] = useState("📋 Copy");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const noteBodyRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const showToast = (msg, color = T.teal) => {
    setToastMsg({ msg, color });
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Load encounter
  const { data: encounter } = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: () => base44.entities.encounters.get(encounterId),
    enabled: !!encounterId,
  });

  // Load latest clinical note for this encounter (subjective data)
  const { data: clinicalNote } = useQuery({
    queryKey: ["clinicalNote-soap", encounterId],
    queryFn: async () => {
      const notes = await base44.entities.ClinicalNote.list("-updated_date", 50);
      return notes.find(n => n.encounter_id === encounterId) || null;
    },
    enabled: !!encounterId,
  });

  // Load orders for plan data
  const { data: orders = [] } = useQuery({
    queryKey: ["orders-soap", encounterId],
    queryFn: async () => {
      const all = await base44.entities.orders.list("-ordered_at", 100);
      return all.filter(o => o.encounter_id === encounterId);
    },
    enabled: !!encounterId,
  });

  // Check for existing compiled note
  const { data: existingCompiledNote } = useQuery({
    queryKey: ["compiledNote", encounterId],
    queryFn: async () => {
      const notes = await base44.entities.ClinicalNotes.list("-created_date", 20);
      return notes.find(n => n.encounter_id === encounterId && n.note_type === "progress_note" && n.status !== "signed") || null;
    },
    enabled: !!encounterId,
  });

  useEffect(() => {
    if (existingCompiledNote) {
      setCompiledNote({ content: existingCompiledNote.content, createdAt: existingCompiledNote.created_date, format: noteStyle, status: existingCompiledNote.status });
      setCompiledNoteId(existingCompiledNote.id);
      if (existingCompiledNote.status === "signed") setIsSigned(true);
    }
  }, [existingCompiledNote]);

  const createNoteMutation = useMutation({
    mutationFn: (data) => base44.entities.ClinicalNotes.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["compiledNote"] }),
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ClinicalNotes.update(id, data),
  });

  const updateEncounterMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.encounters.update(id, data),
  });

  // Build data objects from loaded entities
  const subjectiveData = clinicalNote ? {
    chief_complaint: clinicalNote.chief_complaint,
    history_of_present_illness: clinicalNote.history_of_present_illness,
    review_of_systems: clinicalNote.review_of_systems,
    medical_history: clinicalNote.medical_history,
    medications: clinicalNote.medications,
    allergies: clinicalNote.allergies,
    physical_exam: clinicalNote.physical_exam,
    lab_findings: clinicalNote.lab_findings,
    imaging_findings: clinicalNote.imaging_findings,
  } : null;

  const objectiveData = clinicalNote ? {
    vitals: clinicalNote.vital_signs,
    temperature: clinicalNote.vital_signs?.temperature?.value,
    heartRate: clinicalNote.vital_signs?.heart_rate?.value,
    bloodPressure: clinicalNote.vital_signs?.blood_pressure ? `${clinicalNote.vital_signs.blood_pressure.systolic}/${clinicalNote.vital_signs.blood_pressure.diastolic}` : null,
    respiratoryRate: clinicalNote.vital_signs?.respiratory_rate?.value,
    oxygenSaturation: clinicalNote.vital_signs?.oxygen_saturation?.value,
    physical_exam: clinicalNote.physical_exam,
    lab_results: Array.isArray(clinicalNote.lab_findings) ? clinicalNote.lab_findings.map(l => `${l.test_name}: ${l.result} ${l.unit || ""} (${l.status || ""})`).join("\n") : null,
    imaging_results: Array.isArray(clinicalNote.imaging_findings) ? clinicalNote.imaging_findings.map(i => `${i.study_type} ${i.location || ""}: ${i.impression || i.findings || ""}`).join("\n") : null,
  } : null;

  const assessmentData = clinicalNote ? {
    primary_diagnosis: clinicalNote.assessment,
    icd10_code: Array.isArray(clinicalNote.diagnoses) ? clinicalNote.diagnoses.join(", ") : clinicalNote.diagnoses,
    clinical_reasoning: clinicalNote.mdm,
    disposition: clinicalNote.disposition_plan,
  } : encounter ? {
    primary_diagnosis: encounter.primary_diagnosis,
    icd10_code: encounter.icd10_code,
    disposition: encounter.disposition,
  } : null;

  const planData = {
    plan: clinicalNote?.plan,
    medications: orders.filter(o => o.order_type === "medication").map(o => o.order_name).join(", ") || null,
    labs_ordered: orders.filter(o => o.order_type === "lab").map(o => o.order_name).join(", ") || null,
    imaging_ordered: orders.filter(o => o.order_type === "imaging").map(o => o.order_name).join(", ") || null,
    consults: orders.filter(o => o.order_type === "consult").map(o => o.order_name).join(", ") || null,
    disposition: clinicalNote?.disposition_plan || encounter?.disposition,
    discharge_summary: clinicalNote?.discharge_summary,
  };

  const sourceStatus = {
    subjective: !!subjectiveData?.chief_complaint || !!subjectiveData?.history_of_present_illness,
    objective: !!objectiveData?.temperature || !!objectiveData?.heartRate,
    assessment: !!assessmentData?.primary_diagnosis,
    plan: !!planData?.plan || !!planData?.medications,
  };

  const hasAnyData = Object.values(sourceStatus).some(Boolean);

  const buildPrompt = () => {
    const subj = subjectiveData;
    const obj = objectiveData;
    const assess = assessmentData;
    const plan = planData;

    const formatObj = (o) => {
      if (!o) return "[No data available]";
      return Object.entries(o)
        .filter(([, v]) => v && v !== "" && (typeof v !== "object" || (Array.isArray(v) ? v.length > 0 : Object.keys(v).length > 0)))
        .map(([k, v]) => `${k.replace(/_/g, " ")}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
        .join("\n") || "[No data available]";
    };

    return `Compile the following four sections of clinical data for one patient encounter into a single, complete ${NOTE_STYLES.find(s => s.value === noteStyle)?.label} clinical note.

PATIENT CONTEXT:
- Patient: ${encounter?.patient_initials || "—"}, ${encounter?.patient_age || "—"}y ${encounter?.patient_sex || "—"}
- Chief Complaint: ${encounter?.chief_complaint || "—"}
- Date of Service: ${encounter?.arrival_time ? format(new Date(encounter.arrival_time), "MMMM d, yyyy") : "—"}
- Provider: ${user?.full_name || "—"}
- Allergies: ${encounter?.allergies || "NKDA"}

═══════════════════════════════
SUBJECTIVE DATA
═══════════════════════════════
${formatObj(subj)}

═══════════════════════════════
OBJECTIVE DATA
═══════════════════════════════
${formatObj(obj)}

═══════════════════════════════
ASSESSMENT DATA
═══════════════════════════════
${formatObj(assess)}

═══════════════════════════════
PLAN DATA
═══════════════════════════════
${formatObj(plan)}

═══════════════════════════════
INSTRUCTIONS
═══════════════════════════════
Note style: ${noteStyle}
Detail level: ${verbosity}
Include sections: ${includeSections.join(", ")}

${STYLE_INSTRUCTIONS[noteStyle]}

IMPORTANT:
- Use exactly the data provided. Do not add information not present above.
- Omit any sub-section where no data was provided.
- Format vitals on one line: T {temp} | HR {hr} | BP {bp} | RR {rr} | SpO2 {spo2}%
- Use consistent professional medical writing.
- Each main section (S, O, A, P) must have a bold uppercase heading.
- Output plain text only — no markdown symbols, no asterisks, no bullet characters. Use plain dashes for lists.`;
  };

  const compileSoapNote = async () => {
    if (compileInProgress) return;
    setCompileInProgress(true);
    setCompiledNote(null);
    setNoteEdited(false);
    setIsSigned(false);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: buildPrompt(),
        response_json_schema: null,
      });

      const content = typeof result === "string" ? result : JSON.stringify(result);
      setCompiledNote({ content, createdAt: new Date().toISOString(), format: noteStyle, status: "drafted" });

      // Save to ClinicalNotes
      const provider_id = user?.id || user?.email || "";
      const saved = await createNoteMutation.mutateAsync({
        encounter_id: encounterId,
        provider_id,
        note_type: "progress_note",
        status: "drafted",
        content,
      });
      if (saved?.id) setCompiledNoteId(saved.id);
      showToast("Note compiled ✓", T.purple);
    } catch (e) {
      console.error("AI compile failed, using fallback", e);
      const fallback = buildFallbackNote(encounter, subjectiveData, objectiveData, assessmentData, planData, user);
      setCompiledNote({ content: fallback, createdAt: new Date().toISOString(), format: noteStyle, status: "drafted" });
      showToast("AI unavailable — note compiled from source data directly", T.amber);
    } finally {
      setCompileInProgress(false);
    }
  };

  const copyNoteToClipboard = async () => {
    const text = noteBodyRef.current?.innerText || compiledNote?.content || "";
    await navigator.clipboard.writeText(text);
    setCopyLabel("✓ Copied!");
    showToast("Note copied to clipboard ✓", T.teal);
    setTimeout(() => setCopyLabel("📋 Copy"), 2000);
  };

  const printNote = () => {
    window.print();
  };

  const downloadNotePDF = async () => {
    setPdfLoading(true);
    try {
      if (!window.html2pdf) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      const el = document.getElementById("note-document");
      const dateStr = encounter?.arrival_time ? format(new Date(encounter.arrival_time), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
      const filename = `SOAP-Note-${encounter?.room || encounter?.patient_initials || "patient"}-${dateStr}.pdf`;
      await window.html2pdf().set({
        margin: [12, 14, 12, 14],
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "letter", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      }).from(el).save();
      showToast("PDF downloaded ✓", "#4a90d9");
    } catch (e) {
      showToast("PDF generation failed", T.red);
    } finally {
      setPdfLoading(false);
    }
  };

  const signAndSaveNote = async () => {
    if (!compiledNoteId) return;
    const finalContent = noteBodyRef.current?.innerText || compiledNote?.content || "";
    await updateNoteMutation.mutateAsync({ id: compiledNoteId, data: { content: finalContent, status: "signed", signed_at: new Date().toISOString() } });
    if (encounterId) {
      await updateEncounterMutation.mutateAsync({ id: encounterId, data: { note_status: "signed" } });
    }
    setIsSigned(true);
    setNoteEdited(false);
    showToast("Note signed and saved ✓", T.green);
  };

  const saveNoteEdits = async () => {
    if (!compiledNoteId || !noteEdited) return;
    const content = noteBodyRef.current?.innerText || "";
    await updateNoteMutation.mutateAsync({ id: compiledNoteId, data: { content } });
  };

  const toggleSection = (val) => {
    if (val === "header") return;
    setIncludeSections(prev => prev.includes(val) ? prev.filter(s => s !== val) : [...prev, val]);
  };

  if (!encounterId) {
    return (
      <div style={{ background: T.navy, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "DM Sans, sans-serif" }}>
        <div style={{ textAlign: "center", color: T.dim }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: T.bright, marginBottom: 8 }}>No encounter selected</h2>
          <p>Return to the patient board and select an encounter.</p>
          <Link to={createPageUrl("Shift")} style={{ color: T.teal, textDecoration: "none", marginTop: 16, display: "inline-block" }}>← Back to Shift Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: T.navy, minHeight: "100vh", fontFamily: "DM Sans, sans-serif", display: "flex", flexDirection: "column", color: T.text }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes noteReveal { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @media print {
          body { background: #fff !important; color: #000 !important; }
          #navbar, #page-header, #patient-context-bar, #compiler-controls, #action-bar { display: none !important; }
          #note-preview-panel { padding: 0 !important; overflow: visible !important; }
          #note-document { box-shadow: none !important; border-radius: 0 !important; max-width: 100% !important; margin: 0 !important; padding: 20mm 18mm !important; font-size: 12pt !important; line-height: 1.8 !important; }
          @page { size: letter portrait; margin: 0; }
        }
      `}</style>

      {/* Navbar */}
      <nav id="navbar" style={{ height: 54, background: "rgba(11,29,53,0.96)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", padding: "0 24px", gap: 24, position: "sticky", top: 0, zIndex: 100, flexShrink: 0 }}>
        <div style={{ fontFamily: "Playfair Display, serif", fontSize: 16, fontWeight: 700, color: T.bright, marginRight: 8 }}>
          Notrya<span style={{ color: T.purple }}> AI</span>
          <span style={{ fontSize: 10, color: T.dim, fontFamily: "DM Sans, sans-serif", marginLeft: 6, fontWeight: 400 }}>by MedNu</span>
        </div>
        <div style={{ display: "flex", gap: 4, flex: 1 }}>
          {[
            { label: "Dashboard", page: "Dashboard" },
            { label: "Shift", page: "Shift" },
            { label: "Procedures", page: "Procedures" },
          ].map(l => (
            <Link key={l.page} to={createPageUrl(l.page)} style={{ padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, color: T.dim, textDecoration: "none", transition: "all 0.15s" }}
              onMouseEnter={e => { e.target.style.color = T.bright; e.target.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { e.target.style.color = T.dim; e.target.style.background = "transparent"; }}>
              {l.label}
            </Link>
          ))}
        </div>
        <Link to={createPageUrl("Shift")} style={{ fontSize: 12, color: T.teal, textDecoration: "none", fontWeight: 600 }}>← Back to Shift</Link>
      </nav>

      {/* Page Header */}
      <div id="page-header" style={{ padding: "18px 28px 12px", borderBottom: `1px solid rgba(30,58,95,0.6)`, background: "rgba(11,29,53,0.4)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 28 }}>📄</span>
          <div>
            <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 700, color: T.bright, margin: 0 }}>SOAP Note Compiler</h1>
            <p style={{ fontSize: 12, color: T.dim, margin: "3px 0 0" }}>Pulls data from Subjective, Objective, Assessment & Plan and compiles one complete clinical note.</p>
          </div>
        </div>
        <div style={{ padding: "4px 12px", borderRadius: 20, background: "rgba(155,109,255,0.1)", border: `1px solid rgba(155,109,255,0.25)`, fontSize: 11, fontWeight: 600, color: T.purple }}>
          ✦ Powered by Notrya AI
        </div>
      </div>

      {/* Patient Context Bar */}
      <div id="patient-context-bar" style={{ padding: "12px 28px", background: "rgba(22,45,79,0.45)", borderBottom: `1px solid rgba(30,58,95,0.5)`, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
          {encounter ? (
            <>
              <div>
                <span style={{ fontSize: 9, color: T.dim, textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>Patient</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.bright }}>{encounter.patient_initials || "—"} · {encounter.patient_age || "—"}y {encounter.patient_sex || "—"}</span>
              </div>
              <div>
                <span style={{ fontSize: 9, color: T.dim, textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>CC</span>
                <span style={{ fontSize: 12, color: T.text }}>{encounter.chief_complaint || "—"}</span>
              </div>
              <div>
                <span style={{ fontSize: 9, color: T.dim, textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>Date</span>
                <span style={{ fontSize: 12, fontFamily: "JetBrains Mono, monospace", color: T.text }}>{encounter.arrival_time ? format(new Date(encounter.arrival_time), "MMM d, yyyy") : "—"}</span>
              </div>
              <div>
                <span style={{ fontSize: 9, color: T.dim, textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>Provider</span>
                <span style={{ fontSize: 12, color: T.text }}>{user?.full_name || "—"}</span>
              </div>
              {encounter.room && (
                <div>
                  <span style={{ fontSize: 9, color: T.dim, textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>Room</span>
                  <span style={{ fontSize: 12, color: T.text }}>{encounter.room}</span>
                </div>
              )}
            </>
          ) : (
            <span style={{ color: T.dim, fontSize: 12 }}>Loading encounter…</span>
          )}
        </div>
        {/* Source status chips */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, color: T.dim, fontWeight: 600 }}>Data Sources:</span>
          {[
            { key: "subjective", label: "S Subjective" },
            { key: "objective",  label: "O Objective" },
            { key: "assessment", label: "A Assessment" },
            { key: "plan",       label: "P Plan" },
          ].map(s => (
            <span key={s.key} style={{
              padding: "2px 10px", borderRadius: 12, fontSize: 10.5, fontWeight: 600,
              background: sourceStatus[s.key] ? "rgba(46,204,113,0.1)" : "rgba(255,92,108,0.1)",
              border: `1px solid ${sourceStatus[s.key] ? "rgba(46,204,113,0.3)" : "rgba(255,92,108,0.3)"}`,
              color: sourceStatus[s.key] ? T.green : T.red,
            }}>{s.label}</span>
          ))}
          {!hasAnyData && <span style={{ fontSize: 11, color: T.amber, marginLeft: 8 }}>⚠ No SOAP data found for this encounter.</span>}
        </div>
      </div>

      {/* Compiler Controls */}
      <div id="compiler-controls" style={{ padding: "14px 28px", borderBottom: `1px solid rgba(30,58,95,0.5)`, background: "rgba(11,29,53,0.35)", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
        <div>
          <label style={{ fontSize: 10, color: T.dim, display: "block", marginBottom: 4, fontWeight: 600, textTransform: "uppercase" }}>Note Style</label>
          <select value={noteStyle} onChange={e => setNoteStyle(e.target.value)}
            style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 7, padding: "7px 12px", color: T.bright, fontSize: 12, outline: "none" }}>
            {NOTE_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 10, color: T.dim, display: "block", marginBottom: 4, fontWeight: 600, textTransform: "uppercase" }}>Detail Level</label>
          <select value={verbosity} onChange={e => setVerbosity(e.target.value)}
            style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 7, padding: "7px 12px", color: T.bright, fontSize: 12, outline: "none" }}>
            {VERBOSITY.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 10, color: T.dim, display: "block", marginBottom: 4, fontWeight: 600, textTransform: "uppercase" }}>Include Sections</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["header","subjective","objective","assessment","plan","signature"].map(s => (
              <button key={s} onClick={() => toggleSection(s)}
                style={{
                  padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: s === "header" ? "default" : "pointer",
                  background: includeSections.includes(s) ? "rgba(155,109,255,0.15)" : "transparent",
                  border: `1px solid ${includeSections.includes(s) ? "rgba(155,109,255,0.4)" : T.border}`,
                  color: includeSections.includes(s) ? T.purple : T.dim,
                }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={compileSoapNote}
          disabled={compileInProgress}
          style={{
            marginLeft: "auto", background: compileInProgress ? "rgba(155,109,255,0.3)" : "linear-gradient(135deg, #9b6dff, #7c5cd6)",
            color: "#fff", fontWeight: 700, fontSize: 14, padding: "10px 22px", borderRadius: 9, border: "none",
            cursor: compileInProgress ? "not-allowed" : "pointer", transition: "all 0.2s",
          }}>
          {compileInProgress ? "⏳ Compiling…" : "✦ Compile Note"}
        </button>
      </div>

      {/* Note Preview Panel */}
      <div id="note-preview-panel" style={{ flex: 1, overflowY: "auto", padding: "28px" }}>
        {compileInProgress ? (
          <ShimmerBlock />
        ) : compiledNote ? (
          <motion.div key="note" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {isSigned && (
              <div style={{ maxWidth: 760, margin: "0 auto 12px", background: "rgba(46,204,113,0.1)", border: `1px solid rgba(46,204,113,0.3)`, borderRadius: 8, padding: "10px 16px", fontSize: 12, color: T.green, fontWeight: 600 }}>
                ✅ Electronically signed — {user?.full_name || "Provider"} · {new Date().toLocaleString()}
              </div>
            )}
            <div
              id="note-document"
              role="document"
              aria-label="Compiled SOAP Clinical Note"
              style={{
                background: "#ffffff", color: "#1a1a2e", borderRadius: 12,
                boxShadow: "0 8px 48px rgba(0,0,0,0.4)", maxWidth: 760, margin: "0 auto",
                padding: "48px 56px", fontFamily: "'DM Sans', sans-serif", fontSize: "13.5px", lineHeight: 1.85,
              }}
            >
              {/* Note Header */}
              <div style={{ borderBottom: "2px solid #1a1a2e", paddingBottom: 16, marginBottom: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#555", marginBottom: 2 }}>Notrya AI | Clinical Documentation</div>
                    <div style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 700, color: "#1a1a2e" }}>
                      {NOTE_STYLES.find(s => s.value === compiledNote.format)?.label || "SOAP Note"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 12, color: "#444" }}>
                    <div><strong>Date of Service:</strong> {encounter?.arrival_time ? format(new Date(encounter.arrival_time), "MMMM d, yyyy") : "—"}</div>
                    <div><strong>Provider:</strong> {user?.full_name || "—"}</div>
                    <div><strong>Compiled:</strong> {format(new Date(compiledNote.createdAt), "MMM d, yyyy h:mm a")}</div>
                  </div>
                </div>
                <div style={{ marginTop: 14, padding: "10px 14px", background: "#f4f7ff", borderRadius: 7, border: "1px solid #dde4f0", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, fontSize: 12 }}>
                  {[
                    { label: "Patient", value: encounter?.patient_initials || "—" },
                    { label: "Age / Sex", value: `${encounter?.patient_age || "—"}y ${encounter?.patient_sex || "—"}` },
                    { label: "Chief Complaint", value: encounter?.chief_complaint || "—" },
                    { label: "Allergies", value: encounter?.allergies || "NKDA" },
                    { label: "Encounter ID", value: encounterId?.slice(0, 8) + "…" },
                    { label: "Room", value: encounter?.room || "—" },
                  ].map(f => (
                    <div key={f.label}>
                      <div style={{ fontSize: 10, color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{f.label}</div>
                      <div style={{ color: "#1a1a2e", fontWeight: 500 }}>{f.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Note Body — editable */}
              <div
                id="note-body"
                ref={noteBodyRef}
                contentEditable={!isSigned}
                suppressContentEditableWarning
                onInput={() => setNoteEdited(true)}
                onBlur={saveNoteEdits}
                style={{ outline: "none", whiteSpace: "pre-wrap", color: "#2d2d3a", fontSize: "13.5px", lineHeight: 1.9 }}
              >
                {compiledNote.content}
              </div>

              {/* Signature Block */}
              {includeSections.includes("signature") && (
                <div style={{ marginTop: 36, paddingTop: 18, borderTop: "1px solid #dde4f0", display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ color: "#999", marginBottom: 4 }}>_______________________________</div>
                    <div style={{ fontWeight: 700, color: "#1a1a2e" }}>{user?.full_name || "Provider"}</div>
                    <div style={{ color: "#555", fontSize: 12 }}>MD / DO / APP</div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 12, color: "#555" }}>
                    <div>Date: _______________</div>
                    <div>Time: _______________</div>
                    <div style={{ fontSize: 10, color: "#aaa", marginTop: 8 }}>Electronically signed via Notrya AI</div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, color: T.dim, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
            <h3 style={{ fontSize: 18, color: T.text, marginBottom: 8 }}>Ready to Compile</h3>
            <p style={{ fontSize: 13, maxWidth: 440, lineHeight: 1.7 }}>Configure options above, then click Compile Note. Notrya AI will pull data from all four SOAP pages and produce a complete clinical note.</p>
          </div>
        )}
      </div>

      {/* Action Bar */}
      {compiledNote && (
        <div id="action-bar" style={{ position: "sticky", bottom: 0, height: 62, background: "rgba(11,29,53,0.97)", borderTop: `1px solid ${T.border}`, backdropFilter: "blur(16px)", padding: "0 28px", display: "flex", alignItems: "center", gap: 10, zIndex: 100, flexShrink: 0 }}>
          <div>
            {noteEdited && <span style={{ fontSize: 12, color: T.amber, fontWeight: 600 }}>● Unsaved edits</span>}
            {compiledNote?.createdAt && <span style={{ fontSize: 11, color: T.dim, fontFamily: "JetBrains Mono, monospace", marginLeft: noteEdited ? 12 : 0 }}>Compiled {format(new Date(compiledNote.createdAt), "MMM d 'at' h:mm a")}</span>}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button onClick={compileSoapNote} style={{ padding: "8px 14px", borderRadius: 7, background: "transparent", border: `1px solid ${T.border}`, color: T.dim, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>↺ Recompile</button>
            <button onClick={copyNoteToClipboard} style={{ padding: "8px 14px", borderRadius: 7, background: "transparent", border: `1px solid ${T.border}`, color: T.teal, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>{copyLabel}</button>
            <button onClick={printNote} style={{ padding: "8px 14px", borderRadius: 7, background: "transparent", border: `1px solid #4a90d9`, color: "#4a90d9", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>🖨 Print</button>
            <button onClick={downloadNotePDF} disabled={pdfLoading} style={{ padding: "8px 14px", borderRadius: 7, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", fontSize: 12, cursor: pdfLoading ? "not-allowed" : "pointer", fontWeight: 600, border: "none" }}>
              {pdfLoading ? "⏳ Generating…" : "⬇ Download PDF"}
            </button>
            {!isSigned && (
              <button onClick={signAndSaveNote} disabled={!compiledNoteId} style={{ padding: "8px 16px", borderRadius: 7, background: "linear-gradient(135deg,#2ecc71,#27ae60)", color: "#fff", fontSize: 12, cursor: compiledNoteId ? "pointer" : "not-allowed", fontWeight: 700, border: "none" }}>
                ✅ Sign & Save
              </button>
            )}
            {isSigned && <span style={{ padding: "8px 16px", fontSize: 12, color: T.green, fontWeight: 700 }}>✅ Signed</span>}
          </div>
        </div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{ position: "fixed", bottom: 80, right: 24, background: T.slate, border: `1px solid ${toastMsg.color}`, color: toastMsg.color, padding: "10px 18px", borderRadius: 8, fontSize: 12, fontWeight: 600, zIndex: 999, boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}
          >
            {toastMsg.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}