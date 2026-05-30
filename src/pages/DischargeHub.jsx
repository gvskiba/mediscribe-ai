import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

const Patient = base44.entities.Patient;
const ClinicalNote = base44.entities.ClinicalNote;

// ─── INJECT FONTS & ANIMATIONS ────────────────────────────────────────────────
(() => {
  if (document.getElementById("dh-fonts")) return;
  const l = document.createElement("link");
  l.id = "dh-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "dh-css";
  s.textContent = `
    @keyframes dh-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    .dh-fade{animation:dh-fade .2s ease forwards}
    @keyframes dh-spin{to{transform:rotate(360deg)}}
    .dh-spin{animation:dh-spin 1s linear infinite}
    @media print{.dh-no-print{display:none!important}.dh-print-card{background:#fff!important;color:#111!important;border:1px solid #ddd!important}}
  `;
  document.head.appendChild(s);
})();

// ─── TOKENS ───────────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", green:"#3dffa0", red:"#ff4444",
};

const gc = (x={}) => ({ background:T.card, border:"1px solid rgba(26,53,85,0.5)", borderRadius:10, ...x });
const label = (txt) => (
  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:T.txt4, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:8 }}>
    {txt}
  </div>
);

// ─── SPINNER ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 0" }}>
      <div className="dh-spin" style={{ width:16, height:16, border:`2px solid rgba(0,229,192,0.2)`, borderTop:`2px solid ${T.teal}`, borderRadius:"50%", flexShrink:0 }} />
      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt4 }}>Generating with AI…</span>
    </div>
  );
}

// ─── AI SECTION BLOCK ─────────────────────────────────────────────────────────
function AISectionBlock({ icon, title, content, loading, accent }) {
  const c = accent || T.teal;
  return (
    <div style={{ ...gc({ borderRadius:12, borderLeft:`3px solid ${c}` }), padding:"14px 16px", marginBottom:12 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <span style={{ fontSize:16 }}>{icon}</span>
        <span style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700, color:c }}>{title}</span>
      </div>
      {loading
        ? <Spinner />
        : content
          ? <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.txt2, lineHeight:1.65, whiteSpace:"pre-wrap" }}>{content}</div>
          : <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt4, fontStyle:"italic" }}>Not yet generated</div>
      }
    </div>
  );
}

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
function SectionHeader({ step, title, sub }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:T.teal, background:"rgba(0,229,192,0.12)", border:`1px solid ${T.teal}40`, borderRadius:6, padding:"3px 9px" }}>
        {step}
      </div>
      <div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:T.txt }}>{title}</div>
        {sub && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4, marginTop:1 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── PRINTABLE CARD ───────────────────────────────────────────────────────────
function PrintableCard({ patient, diagnosis, medications, precautions, followUp }) {
  const today = new Date().toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" });
  return (
    <div className="dh-print-card" style={{ background:T.card, border:"1px solid rgba(26,53,85,0.5)", borderRadius:12, padding:"22px 24px", marginBottom:16 }}>
      {/* Header */}
      <div style={{ borderBottom:"1px solid rgba(26,53,85,0.5)", paddingBottom:12, marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:900, color:T.teal }}>Discharge Instructions</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, marginTop:3 }}>{today}</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700, color:T.txt }}>{patient.name}</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4 }}>{patient.age}yo {patient.sex} · {patient.room}</div>
        </div>
      </div>

      {diagnosis && (
        <div style={{ marginBottom:14 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:T.teal, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:6 }}>What We Found</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.txt2, lineHeight:1.65, whiteSpace:"pre-wrap" }}>{diagnosis}</div>
        </div>
      )}

      {medications && (
        <div style={{ marginBottom:14 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:T.gold, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:6 }}>Your Medications</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.txt2, lineHeight:1.65, whiteSpace:"pre-wrap" }}>{medications}</div>
        </div>
      )}

      {precautions && (
        <div style={{ marginBottom:14 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:T.coral, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:6 }}>Return If…</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.txt2, lineHeight:1.65, whiteSpace:"pre-wrap" }}>{precautions}</div>
        </div>
      )}

      {followUp && (
        <div style={{ marginBottom:6 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:T.blue, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:6 }}>Follow-Up</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.txt2, lineHeight:1.65, whiteSpace:"pre-wrap" }}>{followUp}</div>
        </div>
      )}

      {/* Allergies footer */}
      {patient.allergies && patient.allergies.length > 0 && (
        <div style={{ marginTop:14, borderTop:"1px solid rgba(26,53,85,0.4)", paddingTop:10 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.coral, fontWeight:700 }}>⚠️ ALLERGIES: </span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt3 }}>{patient.allergies.join(", ")}</span>
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function DischargeHub() {
  const params     = new URLSearchParams(window.location.search);
  const patientId  = params.get("patientId");

  const [patient,      setPatient]      = useState(null);
  const [clinicalNote, setClinicalNote] = useState(null);
  const [loading,      setLoading]      = useState(true);

  // Inputs
  const [assessment,  setAssessment]  = useState("");
  const [medsRaw,     setMedsRaw]     = useState("");
  const [followUp,    setFollowUp]    = useState("");

  // AI outputs
  const [diagnosis,   setDiagnosis]   = useState("");
  const [medications, setMedications] = useState("");
  const [precautions, setPrecautions] = useState("");

  // Loading per section
  const [genDx,   setGenDx]   = useState(false);
  const [genMeds, setGenMeds] = useState(false);
  const [genPrec, setGenPrec] = useState(false);
  const [genAll,  setGenAll]  = useState(false);

  const [copied, setCopied] = useState(false);

  // ── Load patient + most recent ClinicalNote ──────────────────────────────────
  useEffect(() => {
    if (!patientId) { setLoading(false); return; }
    Promise.all([
      Patient.filter({ id: patientId }, "-created_date", 1).then(r => r?.[0] || null).catch(() => null),
      ClinicalNote.filter({ patient_id: patientId }, "-created_date", 1)
        .catch(() => []),
    ]).then(([p, notes]) => {
      setPatient(p);
      const note = notes && notes[0];
      if (note) {
        setClinicalNote(note);
        const noteText = [
          note.assessment && `Assessment: ${note.assessment}`,
          note.plan && `Plan: ${note.plan}`,
          note.working_diagnosis && `Working Dx: ${note.working_diagnosis}`,
          note.mdm && `MDM: ${note.mdm}`,
        ].filter(Boolean).join("\n\n");
        if (noteText) setAssessment(noteText);
        // Pre-fill meds from note
        if (note.medications && note.medications.length) {
          setMedsRaw(note.medications.join("\n"));
        }
      }
      setLoading(false);
    });
  }, [patientId]);

  // ── AI generators ─────────────────────────────────────────────────────────────
  const extractText = (res) => typeof res === "string" ? res : res?.text || res?.content || JSON.stringify(res);

  const genDiagnosis = async () => {
    if (!assessment || !patient) return;
    setGenDx(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an emergency physician writing discharge instructions for a patient. Based on the clinical assessment below, write a plain-language explanation of what was found and diagnosed. Use simple, non-medical language that a patient can understand. Keep it to 3-4 sentences.

Patient: ${patient.name}, ${patient.age}yo, CC: ${patient.cc}
Clinical Assessment:
${assessment}`,
      });
      setDiagnosis(extractText(res));
    } finally {
      setGenDx(false);
    }
  };

  const genMedications = async () => {
    if (!medsRaw || !patient) return;
    setGenMeds(true);
    try {
      const allergies = patient?.allergies?.length ? patient.allergies.join(", ") : "None";
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an emergency physician writing discharge instructions. Convert the following medication list into a clear, patient-friendly format. For each medication include: what it is, what it's for, how to take it, and any key warnings. Flag any potential concerns given allergies: ${allergies}.

Medications:
${medsRaw}

Patient: ${patient.name}, ${patient.age}yo`,
      });
      setMedications(extractText(res));
    } finally {
      setGenMeds(false);
    }
  };

  const genPrecautions = async () => {
    if (!patient) return;
    setGenPrec(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an emergency physician writing return precautions for a patient being discharged. Based on the chief complaint and clinical assessment, list 5-7 specific "Return to the ER if…" warning signs in plain language. Be specific and clinically appropriate.

Patient: ${patient.name}, ${patient.age}yo
Chief Complaint: ${patient.cc}
Assessment: ${assessment || "(not provided)"}
PMHx: ${patient?.pmhx?.join(", ") || "None"}`,
      });
      setPrecautions(extractText(res));
    } finally {
      setGenPrec(false);
    }
  };

  const generateAll = async () => {
    if (!patient) return;
    setGenAll(true);
    try {
      await Promise.all([
        assessment ? genDiagnosis() : Promise.resolve(),
        medsRaw    ? genMedications() : Promise.resolve(),
        genPrecautions(),
      ]);
    } finally {
      setGenAll(false);
    }
  };

  // ── Copy text block ──────────────────────────────────────────────────────────
  const buildCopyText = () => {
    const today = new Date().toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" });
    return [
      `DISCHARGE INSTRUCTIONS — ${today}`,
      `Patient: ${patient?.name || ""} | ${patient?.age || ""}yo ${patient?.sex || ""} | Room: ${patient?.room || ""}`,
      `Chief Complaint: ${patient?.cc || ""}`,
      diagnosis   && `\n── WHAT WE FOUND ──\n${diagnosis}`,
      medications && `\n── YOUR MEDICATIONS ──\n${medications}`,
      precautions && `\n── RETURN TO ER IF… ──\n${precautions}`,
      followUp    && `\n── FOLLOW-UP ──\n${followUp}`,
      patient?.allergies?.length && `\nAllergies: ${patient.allergies.join(", ")}`,
    ].filter(Boolean).join("\n");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(buildCopyText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Render states ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:14 }}>
        <div className="dh-spin" style={{ width:32, height:32, border:`3px solid rgba(0,229,192,0.2)`, borderTop:`3px solid ${T.teal}`, borderRadius:"50%" }} />
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.txt4 }}>Loading discharge data…</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:14 }}>
        <div style={{ fontSize:40 }}>⚠️</div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, color:T.txt3 }}>No patient found</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.txt4 }}>Pass ?patientId= in the URL to load a patient.</div>
        <a href="/CommandCenter" style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.teal, textDecoration:"none", border:`1px solid ${T.teal}55`, borderRadius:8, padding:"7px 16px" }}>← Back to Census</a>
      </div>
    );
  }

  const anyGenerated = !!(diagnosis || medications || precautions);

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.txt, fontFamily:"'DM Sans',sans-serif" }}>

      {/* Top bar */}
      <div className="dh-no-print" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", height:52, background:T.panel, borderBottom:"1px solid rgba(26,53,85,0.5)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <a href={`/PatientEncounter?patientId=${patientId}`} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.txt4, background:"transparent", border:"1px solid rgba(26,53,85,0.5)", borderRadius:6, padding:"4px 10px", cursor:"pointer", textDecoration:"none" }}>← Encounter</a>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(26,53,85,0.5)", borderRadius:5, padding:"2px 8px" }}>{patient.room}</span>
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:T.txt }}>{patient.name}</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.txt3 }}>{patient.age}yo {patient.sex}</span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:T.gold }}>· {patient.cc}</span>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {anyGenerated && (
            <button onClick={handleCopy} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:copied ? T.green : T.teal, background: copied ? "rgba(61,255,160,0.08)" : "rgba(0,229,192,0.08)", border:`1px solid ${copied ? T.green : T.teal}55`, borderRadius:8, padding:"6px 14px", cursor:"pointer" }}>
              {copied ? "✓ Copied!" : "📋 Copy Text"}
            </button>
          )}
          {anyGenerated && (
            <button onClick={() => window.print()} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:T.gold, background:"rgba(245,200,66,0.08)", border:`1px solid ${T.gold}55`, borderRadius:8, padding:"6px 14px", cursor:"pointer" }}>
              🖨️ Print
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth:980, margin:"0 auto", padding:"28px 24px 60px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>

        {/* ── LEFT COLUMN: INPUTS ────────────────────────────────────────── */}
        <div className="dh-no-print">

          {/* Section 1 — Patient Info (read-only) */}
          <div style={{ marginBottom:24 }}>
            <SectionHeader step="1" title="Patient Data" sub="Pulled from the Patient entity" />
            <div style={{ ...gc({ borderRadius:12 }), padding:"14px 16px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                <div>
                  {label("Name")}
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.txt }}>{patient.name}</div>
                </div>
                <div>
                  {label("Age / Sex")}
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.txt }}>{patient.age}yo {patient.sex}</div>
                </div>
                <div>
                  {label("Chief Complaint")}
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.gold }}>{patient.cc}</div>
                </div>
                <div>
                  {label("Room")}
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.txt }}>{patient.room}</div>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  {label("PMHx")}
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt3 }}>
                    {patient.pmhx?.length ? patient.pmhx.join(", ") : "None on record"}
                  </div>
                </div>
                <div>
                  {label("Allergies")}
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color: patient.allergies?.length ? T.coral : T.txt4 }}>
                    {patient.allergies?.length ? patient.allergies.join(", ") : "NKDA"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 — Clinical Assessment */}
          <div style={{ marginBottom:24 }}>
            <SectionHeader step="2" title="Clinical Assessment" sub={clinicalNote ? "Auto-filled from most recent ClinicalNote — edit as needed" : "Paste from Note Studio or type below"} />
            <textarea
              value={assessment}
              onChange={e => setAssessment(e.target.value)}
              placeholder="Paste your assessment, working diagnosis, and plan here…"
              rows={8}
              style={{ width:"100%", background:"rgba(11,30,54,0.8)", border:"1px solid rgba(26,53,85,0.6)", borderRadius:10, padding:"12px 14px", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt2, resize:"vertical", outline:"none", boxSizing:"border-box", lineHeight:1.6 }}
            />
            {clinicalNote && (
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.teal, marginTop:4 }}>
                ✓ Loaded from ClinicalNote · {clinicalNote.created_date ? new Date(clinicalNote.created_date).toLocaleDateString() : ""}
              </div>
            )}
          </div>

          {/* Section 3 — Discharge Medications */}
          <div style={{ marginBottom:24 }}>
            <SectionHeader step="3" title="Discharge Medications" sub="From ERx / ClinicalNote meds, or enter manually" />
            <textarea
              value={medsRaw}
              onChange={e => setMedsRaw(e.target.value)}
              placeholder={"e.g.\nIbuprofen 600mg PO TID x 5 days\nAugmentin 875mg PO BID x 10 days\nOndansetron 4mg PO q6h PRN nausea"}
              rows={6}
              style={{ width:"100%", background:"rgba(11,30,54,0.8)", border:"1px solid rgba(26,53,85,0.6)", borderRadius:10, padding:"12px 14px", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt2, resize:"vertical", outline:"none", boxSizing:"border-box", lineHeight:1.6 }}
            />
          </div>

          {/* Section 4 — Follow-up (manual) */}
          <div style={{ marginBottom:24 }}>
            <SectionHeader step="4" title="Follow-Up Instructions" sub="Provider fills in — not AI generated" />
            <textarea
              value={followUp}
              onChange={e => setFollowUp(e.target.value)}
              placeholder={"e.g.\nFollow up with your primary care doctor in 3-5 days.\nReturn to ED immediately if symptoms worsen.\nCardiology referral placed — office will call you within 1 week."}
              rows={5}
              style={{ width:"100%", background:"rgba(11,30,54,0.8)", border:"1px solid rgba(26,53,85,0.6)", borderRadius:10, padding:"12px 14px", fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt2, resize:"vertical", outline:"none", boxSizing:"border-box", lineHeight:1.6 }}
            />
          </div>

          {/* Generate buttons */}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <button
              onClick={generateAll}
              disabled={genAll}
              style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700, color:"#fff", background:`linear-gradient(135deg,${T.teal},${T.blue})`, border:"none", borderRadius:10, padding:"10px 22px", cursor:genAll?"not-allowed":"pointer", opacity:genAll?0.6:1 }}
            >
              {genAll ? "Generating all…" : "✨ Generate All AI Sections"}
            </button>
            <button
              onClick={genDiagnosis}
              disabled={genDx || !assessment}
              style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:T.teal, background:"rgba(0,229,192,0.08)", border:`1px solid ${T.teal}55`, borderRadius:9, padding:"8px 14px", cursor:(genDx||!assessment)?"not-allowed":"pointer", opacity:(genDx||!assessment)?0.5:1 }}
            >
              Dx only
            </button>
            <button
              onClick={genMedications}
              disabled={genMeds || !medsRaw}
              style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:T.gold, background:"rgba(245,200,66,0.08)", border:`1px solid ${T.gold}55`, borderRadius:9, padding:"8px 14px", cursor:(genMeds||!medsRaw)?"not-allowed":"pointer", opacity:(genMeds||!medsRaw)?0.5:1 }}
            >
              Meds only
            </button>
            <button
              onClick={genPrecautions}
              disabled={genPrec}
              style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:T.coral, background:"rgba(255,107,107,0.08)", border:`1px solid ${T.coral}55`, borderRadius:9, padding:"8px 14px", cursor:genPrec?"not-allowed":"pointer", opacity:genPrec?0.5:1 }}
            >
              Precautions only
            </button>
          </div>
        </div>

        {/* ── RIGHT COLUMN: AI OUTPUT ────────────────────────────────────── */}
        <div>
          <div className="dh-no-print" style={{ marginBottom:16 }}>
            <SectionHeader step="5" title="AI-Generated Discharge Card" sub="Plain-language patient-ready output" />
          </div>

          {/* AI sections (always visible for print) */}
          <AISectionBlock icon="🔬" title="What We Found" content={diagnosis} loading={genDx} accent={T.teal} />
          <AISectionBlock icon="💊" title="Your Medications" content={medications} loading={genMeds} accent={T.gold} />
          <AISectionBlock icon="🚨" title="Return Precautions" content={precautions} loading={genPrec} accent={T.coral} />

          {followUp && (
            <div style={{ ...gc({ borderRadius:12, borderLeft:`3px solid ${T.blue}` }), padding:"14px 16px", marginBottom:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <span style={{ fontSize:16 }}>📅</span>
                <span style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700, color:T.blue }}>Follow-Up</span>
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.txt2, lineHeight:1.65, whiteSpace:"pre-wrap" }}>{followUp}</div>
            </div>
          )}

          {/* Printable card below (hidden unless all generated) */}
          {anyGenerated && (
            <div style={{ marginTop:20 }}>
              <div className="dh-no-print" style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, color:T.txt4, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:10 }}>
                Print Preview
              </div>
              <PrintableCard
                patient={patient}
                diagnosis={diagnosis}
                medications={medications}
                precautions={precautions}
                followUp={followUp}
              />
            </div>
          )}

          {!anyGenerated && !genAll && (
            <div style={{ textAlign:"center", padding:"40px 20px", background:"rgba(26,53,85,0.12)", borderRadius:12, border:"1px dashed rgba(26,53,85,0.5)" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>✨</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, color:T.txt3, marginBottom:6 }}>Ready to generate</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.txt4 }}>Fill in the assessment and medications on the left, then click Generate All.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}