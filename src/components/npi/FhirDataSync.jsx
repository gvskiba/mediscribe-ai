// FhirDataSync.jsx
// Modal FHIR R4 data sync panel for the NPI workflow.
// Pulls: Vitals (Observation), Demographics (Patient), Allergies
// (AllergyIntolerance), Medications (MedicationStatement /
// MedicationRequest), and Problem List (Condition).
//
// Each resource type can be pulled independently or all at once.
// Conflicts (e.g. a FHIR value vs. an already-typed value) are
// surfaced with "Keep existing / Use FHIR" chips — not silently overwritten.
//
// Props:
//   open, onClose              — modal visibility + dismiss handler
//   demo, setDemo              — demographics state (required for Pull Demographics)
//   vitals, setVitals
//   medications, setMedications
//   allergies, setAllergies
//   pmhSelected, setPmhSelected
//   patientMrn, patientFhirId
//   onToast  (msg: string, type: "success"|"error"|"info") => void
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

// ── LOINC vital-sign map ──────────────────────────────────────────────────────
const LOINC_SIMPLE = {
  "8867-4":"hr", "9279-1":"rr", "59408-5":"spo2", "2708-6":"spo2",
  "8310-5":"temp", "8331-1":"temp", "8332-9":"temp",
  "29463-7":"weight", "8302-2":"height",
};
const BP_CODE = "85354-9", SYS_CODE = "8480-6", DIA_CODE = "8462-4";

function celsiusToF(c) { return Math.round((c * 9/5 + 32) * 10) / 10; }

function mapVitalObs(obs) {
  const codings = obs.code?.coding || [];
  const code = codings.find(c => c.system?.toLowerCase().includes("loinc"))?.code || codings[0]?.code || "";
  if (code === BP_CODE || codings.some(c => c.code === BP_CODE)) {
    const comps = obs.component || [];
    const sv = comps.find(c => c.code?.coding?.some(x => x.code === SYS_CODE))?.valueQuantity?.value;
    const dv = comps.find(c => c.code?.coding?.some(x => x.code === DIA_CODE))?.valueQuantity?.value;
    return sv != null && dv != null ? { key:"bp", value:`${Math.round(sv)}/${Math.round(dv)}` } : null;
  }
  const localKey = LOINC_SIMPLE[code];
  if (!localKey) return null;
  const val = obs.valueQuantity?.value;
  if (val == null) return null;
  const unit = (obs.valueQuantity?.unit || obs.valueQuantity?.code || "").toLowerCase();
  if (localKey === "spo2" || localKey === "hr" || localKey === "rr" || localKey === "weight" || localKey === "height")
    return { key:localKey, value:String(Math.round(val * 10) / 10) };
  if (localKey === "temp") {
    const f = unit === "cel" || unit === "c" || unit.includes("celsius") ? celsiusToF(val) : Math.round(val * 10) / 10;
    return { key:"temp", value:String(f) };
  }
  return null;
}

// ── FHIR helpers ──────────────────────────────────────────────────────────────
function fhirFetch(base, path) {
  return fetch(`${base}/${path}`, { headers:{ Accept:"application/fhir+json" } })
    .then(r => { if (!r.ok) throw new Error(`FHIR ${r.status} — ${path}`); return r.json(); });
}

function extractBundle(bundle) {
  return (bundle?.entry || []).map(e => e.resource).filter(Boolean);
}

// ── Parse Patient resource ────────────────────────────────────────────────────
function parsePatient(resource) {
  if (!resource || resource.resourceType !== "Patient") return null;
  const official = resource.name?.find(n => n.use === "official") || resource.name?.[0];
  const firstName = official?.given?.join(" ") || "";
  const lastName  = official?.family || "";
  const dob       = resource.birthDate || "";
  const gender    = resource.gender || "";
  const mrn       = resource.identifier?.find(i => i.type?.coding?.some(c => c.code === "MR"))?.value
                  || resource.identifier?.[0]?.value || "";
  const phone     = resource.telecom?.find(t => t.system === "phone")?.value || "";
  return { firstName, lastName, dob, gender, mrn, phone };
}

// ── Parse AllergyIntolerance resources ───────────────────────────────────────
function parseAllergies(resources) {
  return resources
    .filter(r => r.resourceType === "AllergyIntolerance" && r.clinicalStatus?.coding?.some(c => c.code === "active"))
    .map(r => {
      const sub  = r.code?.text || r.code?.coding?.[0]?.display || "Unknown substance";
      const reac = r.reaction?.[0]?.manifestation?.[0]?.text
               || r.reaction?.[0]?.manifestation?.[0]?.coding?.[0]?.display || "";
      return reac ? `${sub} (${reac})` : sub;
    });
}

// ── Parse MedicationStatement / MedicationRequest resources ──────────────────
function parseMedications(resources) {
  return resources
    .filter(r => r.resourceType === "MedicationStatement" || r.resourceType === "MedicationRequest")
    .filter(r => {
      const status = r.status || "";
      return ["active","intended","on-hold","unknown"].includes(status);
    })
    .map(r => {
      const name = r.medicationCodeableConcept?.text
               || r.medicationCodeableConcept?.coding?.[0]?.display
               || r.medication?.concept?.text
               || r.medication?.concept?.coding?.[0]?.display
               || "Unknown medication";
      const dose = r.dosage?.[0]?.text || r.dosageInstruction?.[0]?.text || "";
      return dose ? `${name} — ${dose}` : name;
    });
}

// ── Parse Condition resources (problem list) ──────────────────────────────────
function parseConditions(resources) {
  return resources
    .filter(r => r.resourceType === "Condition")
    .filter(r => r.clinicalStatus?.coding?.some(c => ["active","recurrence","relapse"].includes(c.code)))
    .map(r => r.code?.text || r.code?.coding?.[0]?.display || "Unknown condition");
}

// ── Conflict resolver row ─────────────────────────────────────────────────────
function ChoiceButton({ label, color, onClick }) {
  return (
    <button onClick={onClick}
      style={{
        marginTop: 5, padding: "2px 10px", borderRadius: 4,
        border: `1px solid ${color}44`, background: "transparent", color,
        fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 600,
        cursor: "pointer",
      }}>
      {label}
    </button>
  );
}

function ConflictRow({ label, existing, incoming, onKeep, onUse }) {
  return (
    <div style={{ padding:"9px 12px", borderRadius:8, background:T.up, border:`1px solid ${T.gold}33`, marginBottom:6 }}>
      <div style={{
        fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.gold,
        letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6,
      }}>
        {label} — conflict
      </div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"flex-start" }}>
        <div style={{ flex:1, minWidth:120 }}>
          <div style={{
            fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.txt4,
            letterSpacing:"0.08em", marginBottom:3,
          }}>EXISTING</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt3, lineHeight:1.5 }}>
            {existing || "\u2014"}
          </div>
          <ChoiceButton label="Keep" color={T.teal} onClick={onKeep} />
        </div>
        <div style={{ flex:1, minWidth:120 }}>
          <div style={{
            fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.blue,
            letterSpacing:"0.08em", marginBottom:3,
          }}>FROM FHIR</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt2, lineHeight:1.5 }}>
            {incoming}
          </div>
          <ChoiceButton label="Use FHIR" color={T.blue} onClick={onUse} />
        </div>
      </div>
    </div>
  );
}

// ── Resource tile ─────────────────────────────────────────────────────────────
function ResourceTile({ icon, label, count, status, onPull, busy }) {
  const colMap = { idle:T.txt4, ok:T.teal, error:T.coral, loading:T.blue };
  const col = colMap[status] || T.txt4;
  return (
    <div style={{
      padding: "10px 12px", borderRadius: 10,
      background: T.up,
      border: `1px solid ${col === T.txt4 ? T.bd : col + "33"}`,
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <span style={{ fontSize:16, lineHeight:1, flexShrink:0 }}>{icon}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:T.txt }}>{label}</div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:col, marginTop:1 }}>
          {status === "loading" ? "Fetching\u2026"
            : status === "ok" ? (count != null ? `${count} record${count !== 1 ? "s" : ""} synced` : "Synced")
            : status === "error" ? "Failed — check FHIR URL"
            : "Not yet pulled"}
        </div>
      </div>
      <button onClick={onPull} disabled={busy}
        style={{
          padding: "5px 12px", borderRadius: 6,
          border: `1px solid ${T.teal}44`, background: `${T.teal}10`,
          color: busy ? T.txt4 : T.teal,
          fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600,
          cursor: busy ? "not-allowed" : "pointer",
          flexShrink: 0, transition: "all .15s",
        }}>
        {busy ? "\u29c9" : "Pull"}
      </button>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function FhirDataSync({
  open = true, onClose,
  demo = {}, setDemo,
  vitals = {}, setVitals,
  medications = [], setMedications,
  allergies = [], setAllergies,
  pmhSelected = {}, setPmhSelected,
  patientMrn, patientFhirId,
  onToast,
}) {
  const [fhirBase,   setFhirBase]   = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [busy,       setBusy]       = useState({});   // { vitals|demographics|allergies|medications|conditions: bool }
  const [statuses,   setStatuses]   = useState({});   // { resourceKey: "idle"|"ok"|"error" }
  const [counts,     setCounts]     = useState({});
  const [conflicts,  setConflicts]  = useState([]);   // [{ id, label, existing, incoming, field, value }]
  const [allBusy,    setAllBusy]    = useState(false);

  const base = fhirBase.trim().replace(/\/$/, "");
  const patId = patientFhirId || patientMrn || demo?.mrn;

  const setResourceStatus = (key, status) => setStatuses(p => ({ ...p, [key]:status }));
  const setResourceBusy   = (key, val)    => setBusy(p => ({ ...p, [key]:val }));
  const setResourceCount  = (key, n)      => setCounts(p => ({ ...p, [key]:n }));

  // ── Conflict helpers ────────────────────────────────────────────────────────
  const addConflict = (conf) => setConflicts(p => [...p.filter(c => c.id !== conf.id), conf]);
  const resolveConflict = useCallback((id, useIncoming) => {
    const c = conflicts.find(x => x.id === id);
    if (!c) return;
    if (useIncoming) {
      if (c.setter && c.value != null) c.setter(c.value);
    }
    setConflicts(p => p.filter(x => x.id !== id));
  }, [conflicts]);

  // ── Pull vitals ─────────────────────────────────────────────────────────────
  const pullVitals = useCallback(async () => {
    if (!base) { setShowConfig(true); return; }
    if (!patId) { onToast?.("No patient ID — enter demographics first.", "error"); return; }
    setResourceBusy("vitals", true);
    setResourceStatus("vitals", "loading");
    try {
      const bundle  = await fhirFetch(base, `Observation?patient=${encodeURIComponent(patId)}&category=vital-signs&_sort=-date&_count=20`);
      const updates = {};
      extractBundle(bundle).forEach(obs => {
        const mapped = mapVitalObs(obs);
        if (mapped && !(mapped.key in updates)) updates[mapped.key] = mapped.value;
      });
      const count = Object.keys(updates).length;
      if (count === 0) { onToast?.("No vitals found in FHIR.", "error"); setResourceStatus("vitals","error"); return; }
      setVitals(prev => ({ ...prev, ...updates }));
      setResourceCount("vitals", count);
      setResourceStatus("vitals","ok");
      onToast?.(`${count} vital sign${count>1?"s":""} imported from FHIR.`, "success");
    } catch(err) {
      setResourceStatus("vitals","error");
      onToast?.(`Vitals: ${err.message}`, "error");
    } finally { setResourceBusy("vitals",false); }
  }, [base, patId, setVitals, onToast]);

  // ── Pull demographics ────────────────────────────────────────────────────────
  const pullDemographics = useCallback(async () => {
    if (!base) { setShowConfig(true); return; }
    if (!patId) { onToast?.("No patient ID available.", "error"); return; }
    if (!setDemo) { onToast?.("Demographics setter not wired — parent must pass setDemo.", "error"); return; }
    setResourceBusy("demographics", true);
    setResourceStatus("demographics","loading");
    try {
      const resource = await fhirFetch(base, `Patient/${encodeURIComponent(patId)}`);
      const parsed   = parsePatient(resource);
      if (!parsed) throw new Error("Could not parse Patient resource");

      // Check each field for conflict vs. existing data
      const fields = [
        { id:"demo_fn",  label:"First Name",    field:"firstName", existing:demo.firstName, incoming:parsed.firstName },
        { id:"demo_ln",  label:"Last Name",     field:"lastName",  existing:demo.lastName,  incoming:parsed.lastName  },
        { id:"demo_dob", label:"Date of Birth", field:"dob",       existing:demo.dob,       incoming:parsed.dob       },
        { id:"demo_gen", label:"Gender",        field:"gender",    existing:demo.gender,    incoming:parsed.gender    },
        { id:"demo_mrn", label:"MRN",           field:"mrn",       existing:demo.mrn,       incoming:parsed.mrn       },
      ];

      const directApply = {};
      fields.forEach(f => {
        if (!f.incoming) return;
        if (!f.existing || f.existing === f.incoming) {
          directApply[f.field] = f.incoming;
        } else {
          addConflict({
            ...f,
            setter: (val) => setDemo(prev => ({ ...prev, [f.field]: val })),
            value: f.incoming,
          });
        }
      });
      if (Object.keys(directApply).length) setDemo(prev => ({ ...prev, ...directApply }));
      setResourceCount("demographics", 1);
      setResourceStatus("demographics","ok");
      onToast?.("Demographics imported from FHIR.", "success");
    } catch(err) {
      setResourceStatus("demographics","error");
      onToast?.(`Demographics: ${err.message}`, "error");
    } finally { setResourceBusy("demographics",false); }
  }, [base, patId, demo, setDemo, onToast]);

  // ── Pull allergies ───────────────────────────────────────────────────────────
  const pullAllergies = useCallback(async () => {
    if (!base) { setShowConfig(true); return; }
    if (!patId) { onToast?.("No patient ID available.", "error"); return; }
    setResourceBusy("allergies",true);
    setResourceStatus("allergies","loading");
    try {
      const bundle  = await fhirFetch(base, `AllergyIntolerance?patient=${encodeURIComponent(patId)}&_count=50`);
      const parsed  = parseAllergies(extractBundle(bundle));
      if (!parsed.length) { onToast?.("No active allergies in FHIR.", "info"); setResourceStatus("allergies","ok"); return; }

      const existing = new Set(allergies.map(a => a.toLowerCase()));
      const novel    = parsed.filter(a => !existing.has(a.toLowerCase()));
      setAllergies(prev => [...prev, ...novel]);
      setResourceCount("allergies", parsed.length);
      setResourceStatus("allergies","ok");
      onToast?.(`${novel.length} new allerg${novel.length!==1?"ies":"y"} added from FHIR.`, "success");
    } catch(err) {
      setResourceStatus("allergies","error");
      onToast?.(`Allergies: ${err.message}`, "error");
    } finally { setResourceBusy("allergies",false); }
  }, [base, patId, allergies, setAllergies, onToast]);

  // ── Pull medications ─────────────────────────────────────────────────────────
  const pullMedications = useCallback(async () => {
    if (!base) { setShowConfig(true); return; }
    if (!patId) { onToast?.("No patient ID available.", "error"); return; }
    setResourceBusy("medications",true);
    setResourceStatus("medications","loading");
    try {
      const [stmtBundle, reqBundle] = await Promise.all([
        fhirFetch(base, `MedicationStatement?patient=${encodeURIComponent(patId)}&status=active&_count=50`).catch(() => ({ entry:[] })),
        fhirFetch(base, `MedicationRequest?patient=${encodeURIComponent(patId)}&status=active&_count=50`).catch(() => ({ entry:[] })),
      ]);
      const parsed = parseMedications([...extractBundle(stmtBundle), ...extractBundle(reqBundle)]);
      if (!parsed.length) { onToast?.("No active medications found.", "info"); setResourceStatus("medications","ok"); return; }

      const existing = new Set(medications.map(m => m.toLowerCase()));
      const novel    = parsed.filter(m => !existing.has(m.toLowerCase()));
      setMedications(prev => [...prev, ...novel]);
      setResourceCount("medications", parsed.length);
      setResourceStatus("medications","ok");
      onToast?.(`${novel.length} medication${novel.length!==1?"s":""} added from FHIR.`, "success");
    } catch(err) {
      setResourceStatus("medications","error");
      onToast?.(`Medications: ${err.message}`, "error");
    } finally { setResourceBusy("medications",false); }
  }, [base, patId, medications, setMedications, onToast]);

  // ── Pull conditions (PMH) ────────────────────────────────────────────────────
  const pullConditions = useCallback(async () => {
    if (!base) { setShowConfig(true); return; }
    if (!patId) { onToast?.("No patient ID available.", "error"); return; }
    setResourceBusy("conditions",true);
    setResourceStatus("conditions","loading");
    try {
      const bundle = await fhirFetch(base, `Condition?patient=${encodeURIComponent(patId)}&category=problem-list-item&_count=50`);
      const parsed = parseConditions(extractBundle(bundle));
      if (!parsed.length) { onToast?.("No active conditions in problem list.", "info"); setResourceStatus("conditions","ok"); return; }

      // Use raw display name as the pmhSelected key — matches the convention
      // used by CCDASmartParse.onApplyPmh in NewPatientInput.jsx so FHIR-pulled
      // conditions land in the same slots as typed/CCDA-imported ones.
      const updates = {};
      parsed.forEach(name => { updates[name] = true; });
      setPmhSelected?.(prev => ({ ...prev, ...updates }));
      setResourceCount("conditions", parsed.length);
      setResourceStatus("conditions","ok");
      onToast?.(`${parsed.length} condition${parsed.length!==1?"s":""} imported from FHIR.`, "success");
    } catch(err) {
      setResourceStatus("conditions","error");
      onToast?.(`Conditions: ${err.message}`, "error");
    } finally { setResourceBusy("conditions",false); }
  }, [base, patId, setPmhSelected, onToast]);

  // ── Pull all ─────────────────────────────────────────────────────────────────
  const pullAll = useCallback(async () => {
    if (!base) { setShowConfig(true); return; }
    if (!patId) { onToast?.("No patient ID available.", "error"); return; }
    setAllBusy(true);
    await Promise.allSettled([pullDemographics(), pullVitals(), pullAllergies(), pullMedications(), pullConditions()]);
    setAllBusy(false);
  }, [base, patId, pullDemographics, pullVitals, pullAllergies, pullMedications, pullConditions, onToast]);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const anyBusy   = allBusy || Object.values(busy).some(Boolean);
  const syncedAny = Object.values(statuses).some(s => s === "ok");

  const TILES = [
    { key:"demographics", icon:"\uD83D\uDC64", label:"Demographics",    pull:pullDemographics },
    { key:"vitals",       icon:"\uD83D\uDCCA", label:"Vital Signs",      pull:pullVitals       },
    { key:"allergies",    icon:"\uD83C\uDF3F", label:"Allergies",        pull:pullAllergies    },
    { key:"medications",  icon:"\uD83D\uDC8A", label:"Medications",      pull:pullMedications  },
    { key:"conditions",   icon:"\uD83E\uDFE9", label:"Problem List / PMH",pull:pullConditions  },
  ];

  if (!open) return null;

  return (
    <div onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(3,8,16,0.82)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}>
      <div onClick={e => e.stopPropagation()}
        style={{
          width: 680, maxWidth: "96vw",
          height: "88vh", maxHeight: 760,
          borderRadius: 14, overflow: "hidden",
          border: `1px solid ${T.bd}`,
          boxShadow: "0 32px 96px rgba(0,0,0,0.7)",
        }}>
        <div style={{
          display: "flex", flexDirection: "column",
          background: T.bg, color: T.txt,
          fontFamily: "'DM Sans',sans-serif",
          height: "100%",
        }}>

      {/* ── Header ── */}
      <div style={{ padding:"16px 22px 14px", borderBottom:`1px solid ${T.bd}`, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap", marginBottom:12 }}>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:T.txt }}>
              FHIR R4 Data Sync
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.txt4, marginTop:2 }}>
              Pull patient data from a FHIR R4-compliant EHR endpoint
            </div>
          </div>
          <div style={{ display:"flex", gap:7, flexShrink:0, alignItems:"center" }}>
            <button onClick={() => setShowConfig(s => !s)}
              style={{
                padding: "7px 14px", borderRadius: 8,
                border: `1px solid ${fhirBase ? "rgba(0,229,192,.35)" : T.bd}`,
                background: fhirBase ? "rgba(0,229,192,.08)" : T.up,
                color: fhirBase ? T.teal : T.txt4,
                fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
              }}>
              \u2699\uFE0F {showConfig ? "Hide Config" : "Config"}
            </button>
            <button onClick={pullAll} disabled={anyBusy || !base}
              style={{
                padding: "7px 16px", borderRadius: 8, border: "none",
                background: base ? "linear-gradient(135deg,#00e5c0,#00b4d8)" : "rgba(42,77,114,.3)",
                color: base ? "#050f1e" : T.txt4,
                fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 700,
                cursor: base && !anyBusy ? "pointer" : "not-allowed",
                transition: "all .15s",
              }}>
              {anyBusy ? "\u29c9 Syncing\u2026" : "\u21bb Sync All"}
            </button>
            {onClose && (
              <button onClick={onClose} title="Close"
                style={{
                  width: 30, height: 30, borderRadius: 8,
                  border: `1px solid ${T.bd}`, background: T.up,
                  color: T.txt3, fontSize: 14, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                &#x2715;
              </button>
            )}
          </div>
        </div>

        {/* FHIR config panel */}
        {showConfig && (
          <div style={{ padding:"14px 16px", borderRadius:10, background:T.panel, border:`1px solid ${T.bd}`, marginBottom:0 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.txt4, letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:7 }}>
              FHIR R4 Base URL
            </div>
            <input
              type="text"
              placeholder="https://fhir.hospital.org/R4"
              value={fhirBase}
              onChange={e => setFhirBase(e.target.value)}
              style={{
                width: "100%", background: T.up, border: `1px solid ${T.bd}`,
                borderRadius: 7, padding: "8px 12px", color: T.txt,
                fontFamily: "'DM Sans',sans-serif", fontSize: 12,
                outline: "none", boxSizing: "border-box",
              }}
            />
            <div style={{ marginTop:9, display:"flex", flexWrap:"wrap", gap:14 }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4, lineHeight:1.6 }}>
                Patient ID: <span style={{ fontFamily:"'JetBrains Mono',monospace", color:T.blue, fontSize:9 }}>{patId || "not set"}</span>
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4, lineHeight:1.6 }}>
                Resources: Patient, Observation (vitals), AllergyIntolerance, MedicationStatement, MedicationRequest, Condition
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ overflowY:"auto", flex:1, padding:"16px 22px 40px", display:"flex", flexDirection:"column", gap:10 }}>

        {/* No endpoint callout */}
        {!base && (
          <div style={{
            padding: "12px 14px", borderRadius: 9,
            background: "rgba(59,158,255,.06)", border: "1px solid rgba(59,158,255,.2)",
            fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.txt3,
            lineHeight: 1.6, display: "flex", gap: 9, alignItems: "flex-start",
          }}>
            <span style={{ fontSize:16, flexShrink:0, lineHeight:1.3 }}>\uD83D\uDD17</span>
            <span>No FHIR endpoint configured. Click <strong style={{ color:T.teal }}>Config</strong> above to enter your FHIR R4 base URL, then pull data by resource type or all at once.</span>
          </div>
        )}

        {/* Status: not synced callout */}
        {base && !syncedAny && (
          <div style={{
            padding: "10px 14px", borderRadius: 8,
            background: "rgba(42,77,114,.12)", border: `1px solid ${T.bd}`,
            fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.txt4,
            lineHeight: 1.6,
          }}>
            FHIR endpoint set: <span style={{ fontFamily:"'JetBrains Mono',monospace", color:T.blue, fontSize:10 }}>{base}</span>
            <span style={{ color:T.txt4 }}> \u00b7 Patient: </span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", color:T.teal, fontSize:10 }}>{patId || "not set"}</span>
          </div>
        )}

        {/* ── Resource tiles ── */}
        {TILES.map(tile => (
          <ResourceTile
            key={tile.key}
            icon={tile.icon}
            label={tile.label}
            count={counts[tile.key]}
            status={statuses[tile.key] || "idle"}
            onPull={tile.pull}
            busy={busy[tile.key] || allBusy}
          />
        ))}

        {/* ── Conflict resolution ── */}
        {conflicts.length > 0 && (
          <div style={{ marginTop:6 }}>
            <div style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
              color: T.gold, letterSpacing: "1.5px", textTransform: "uppercase",
              marginBottom: 10, display: "flex", alignItems: "center", gap: 7,
            }}>
              <div style={{ width:6, height:6, borderRadius:3, background:T.gold }} />
              Conflicts — review before applying ({conflicts.length})
            </div>
            {conflicts.map(c => (
              <ConflictRow
                key={c.id}
                label={c.label}
                existing={c.existing}
                incoming={c.incoming}
                onKeep={() => resolveConflict(c.id, false)}
                onUse={() => resolveConflict(c.id, true)}
              />
            ))}
          </div>
        )}

        {/* ── Summary strip ── */}
        {syncedAny && conflicts.length === 0 && (() => {
          const totalRecords = Object.values(counts).reduce((a, b) => a + b, 0);
          const okTypes      = Object.values(statuses).filter(s => s === "ok").length;
          return (
            <div style={{
              padding: "10px 14px", borderRadius: 9,
              background: "rgba(0,229,192,.05)", border: "1px solid rgba(0,229,192,.2)",
              fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.teal,
              display: "flex", alignItems: "center", gap: 9,
            }}>
              <span style={{ fontSize:15 }}>\u2713</span>
              FHIR sync complete \u2014 {totalRecords} record{totalRecords !== 1 ? "s" : ""} imported across {okTypes} resource type{okTypes !== 1 ? "s" : ""}.
            </div>
          );
        })()}

        {/* ── Info note ── */}
        <div style={{ padding:"10px 14px", borderRadius:8, background:T.up, border:`1px solid ${T.bd}`, fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.txt4, lineHeight:1.7 }}>
          <strong style={{ color:T.txt3 }}>How it works:</strong> Each Pull makes a direct FHIR R4 REST call from your browser to the configured base URL.
          No data is sent to Notrya servers. Requires CORS headers on the FHIR server or a proxy. Medications and allergies are merged (no duplicates overwritten).
          Demographics conflicts are flagged above for your review.
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}