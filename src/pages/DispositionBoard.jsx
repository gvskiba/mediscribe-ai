import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const T = {
  bg: "#04080f", panel: "#081628", card: "#0b1e36", up: "#0e2544",
  border: "#1a3555", borderHi: "#2a4f7a",
  blue: "#3b9eff", teal: "#00e5c0", gold: "#f5c842", coral: "#ff6b6b",
  orange: "#ff9f43", purple: "#9b6dff", green: "#3dffa0",
  txt: "#f2f7ff", txt2: "#b8d4f0", txt3: "#82aece", txt4: "#5a82a8",
};

const DISPO_TYPES = [
  { id: "discharge", label: "Discharge Home", icon: "🏠", color: T.teal },
  { id: "admit",     label: "Admit",           icon: "🏥", color: T.coral },
  { id: "obs",       label: "Observation",     icon: "⏱",  color: T.gold  },
  { id: "transfer",  label: "Transfer",         icon: "🚑", color: T.purple },
  { id: "ama",       label: "AMA",              icon: "⚠️", color: T.orange },
  { id: "lwbs",      label: "LWBS",             icon: "🚶", color: T.txt4  },
];

const ADMIT_SERVICES = [
  "Internal Medicine", "Cardiology", "Pulmonology", "Neurology",
  "Surgery", "Orthopedics", "OB/GYN", "Psychiatry", "ICU / CCU",
  "Pediatrics", "Oncology", "Other",
];

const FOLLOW_UP_OPTIONS = [
  "PCP in 1–2 days", "PCP in 1 week", "Cardiologist", "Neurologist",
  "Orthopedics", "Pulmonology", "ED return PRN", "Urgent care PRN",
  "No follow-up needed",
];

const RETURN_PRECAUTIONS = [
  "Worsening symptoms", "Fever > 101°F", "Chest pain or SOB",
  "Uncontrolled pain", "Inability to tolerate PO", "New neurological symptoms",
  "Wound redness / purulent discharge", "Falls or syncope",
];

const EMPTY_FORM = {
  patient_name: "", patient_mrn: "", chief_complaint: "",
  dispo_type: "", admit_service: "", transfer_destination: "",
  follow_up: "", return_precautions: [],
  discharge_meds: "", discharge_instructions: "",
  notes: "", attending: "", status: "pending",
};

function StatusBadge({ status }) {
  const cfg = {
    pending:   { color: T.gold,   label: "Pending"   },
    complete:  { color: T.teal,   label: "Complete"  },
    inprogress:{ color: T.blue,   label: "In Progress"},
    cancelled: { color: T.txt4,   label: "Cancelled" },
  }[status] || { color: T.txt4, label: status };
  return (
    <span style={{
      fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
      padding: "2px 9px", borderRadius: 20,
      background: `${cfg.color}18`, border: `1px solid ${cfg.color}40`, color: cfg.color,
    }}>{cfg.label}</span>
  );
}

function DispoTypeBadge({ type }) {
  const cfg = DISPO_TYPES.find(d => d.id === type);
  if (!cfg) return null;
  return (
    <span style={{
      fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
      padding: "2px 9px", borderRadius: 20,
      background: `${cfg.color}15`, border: `1px solid ${cfg.color}35`, color: cfg.color,
    }}>{cfg.icon} {cfg.label}</span>
  );
}

export default function DispositionBoard() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await base44.entities.ClinicalNote.list("-created_date", 100);
      // Filter to records that have a disposition plan
      setRecords(data.filter(r => r.disposition_plan));
    } catch {
      toast.error("Failed to load records");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (rec) => {
    const dp = rec._dispo || {};
    setForm({
      patient_name: rec.patient_name || "",
      patient_mrn: rec.patient_id || "",
      chief_complaint: rec.chief_complaint || "",
      dispo_type: dp.dispo_type || "",
      admit_service: dp.admit_service || "",
      transfer_destination: dp.transfer_destination || "",
      follow_up: dp.follow_up || "",
      return_precautions: dp.return_precautions || [],
      discharge_meds: dp.discharge_meds || "",
      discharge_instructions: rec.discharge_summary || "",
      notes: dp.notes || "",
      attending: dp.attending || "",
      status: dp.status || "pending",
    });
    setEditId(rec.id);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.patient_name.trim()) { toast.error("Patient name required"); return; }
    if (!form.dispo_type) { toast.error("Select a disposition type"); return; }
    setSaving(true);
    try {
      const payload = {
        patient_name: form.patient_name,
        patient_id: form.patient_mrn,
        chief_complaint: form.chief_complaint,
        discharge_summary: form.discharge_instructions,
        disposition_plan: form.dispo_type,
        _dispo: {
          dispo_type: form.dispo_type,
          admit_service: form.admit_service,
          transfer_destination: form.transfer_destination,
          follow_up: form.follow_up,
          return_precautions: form.return_precautions,
          discharge_meds: form.discharge_meds,
          notes: form.notes,
          attending: form.attending,
          status: form.status,
        },
      };
      if (editId) {
        await base44.entities.ClinicalNote.update(editId, payload);
        toast.success("Disposition updated");
      } else {
        await base44.entities.ClinicalNote.create({ ...payload, raw_note: `Disposition: ${form.dispo_type} — ${form.patient_name}` });
        toast.success("Disposition created");
      }
      setShowForm(false);
      load();
    } catch (e) {
      toast.error("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!confirm("Delete this disposition record?")) return;
    try {
      await base44.entities.ClinicalNote.delete(id);
      toast.success("Deleted");
      load();
    } catch {
      toast.error("Delete failed");
    }
  };

  const togglePrec = (p) => {
    setForm(f => ({
      ...f,
      return_precautions: f.return_precautions.includes(p)
        ? f.return_precautions.filter(x => x !== p)
        : [...f.return_precautions, p],
    }));
  };

  const filtered = records.filter(r => {
    const dp = r._dispo || {};
    const matchType = filterType === "all" || dp.dispo_type === filterType;
    const matchStatus = filterStatus === "all" || dp.status === filterStatus;
    const matchSearch = !search || r.patient_name?.toLowerCase().includes(search.toLowerCase()) || r.patient_id?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchStatus && matchSearch;
  });

  const counts = DISPO_TYPES.reduce((acc, d) => {
    acc[d.id] = records.filter(r => r._dispo?.dispo_type === d.id).length;
    return acc;
  }, {});

  const inp = {
    background: T.up, border: `1px solid ${T.border}`, borderRadius: 7,
    padding: "8px 12px", color: T.txt, fontFamily: "'DM Sans', sans-serif",
    fontSize: 12, outline: "none", width: "100%", transition: "border-color .15s",
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.txt, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        .db-inp:focus { border-color: #3b9eff !important; box-shadow: 0 0 0 2px rgba(59,158,255,.12); }
        .db-row:hover { background: rgba(14,37,68,.7) !important; }
        .db-chip { cursor:pointer; transition: all .15s; }
        .db-chip:hover { filter: brightness(1.3); }
        .db-chip.sel { outline: 2px solid currentColor; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #1a3555; border-radius: 2px; }
      `}</style>

      {/* TOP BAR */}
      <div style={{ background: T.panel, borderBottom: `1px solid ${T.border}`, padding: "0 28px", display: "flex", alignItems: "center", gap: 14, height: 58 }}>
        <button onClick={() => navigate(-1)} style={{ background: T.up, border: `1px solid ${T.border}`, borderRadius: 7, padding: "5px 12px", color: T.txt2, fontSize: 12, cursor: "pointer" }}>← Back</button>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(0,229,192,.12)", border: "1px solid rgba(0,229,192,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🚪</div>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: T.txt }}>Disposition Board</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.teal, letterSpacing: 2, textTransform: "uppercase" }}>ED Patient Disposition Tracker</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={load} style={{ background: T.up, border: `1px solid ${T.border}`, borderRadius: 7, padding: "6px 14px", color: T.txt2, fontSize: 12, cursor: "pointer" }}>↺ Refresh</button>
          <button onClick={openNew} style={{ background: T.teal, color: T.bg, border: "none", borderRadius: 7, padding: "6px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ New Disposition</button>
        </div>
      </div>

      <div style={{ padding: "20px 28px", display: "flex", flexDirection: "column", gap: 18 }}>

        {/* SUMMARY CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
          {DISPO_TYPES.map(d => (
            <div key={d.id} onClick={() => setFilterType(f => f === d.id ? "all" : d.id)}
              style={{ background: filterType === d.id ? `${d.color}14` : T.card, border: `1px solid ${filterType === d.id ? d.color + "50" : T.border}`, borderRadius: 10, padding: "12px 16px", cursor: "pointer", transition: "all .15s" }}>
              <div style={{ fontSize: 20, marginBottom: 5 }}>{d.icon}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: d.color }}>{counts[d.id] || 0}</div>
              <div style={{ fontSize: 11, color: T.txt3, marginTop: 2 }}>{d.label}</div>
            </div>
          ))}
        </div>

        {/* FILTERS */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input className="db-inp" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search patient…" style={{ ...inp, maxWidth: 240, width: "auto" }} />
          <div style={{ display: "flex", gap: 5 }}>
            {["all", "pending", "inprogress", "complete"].map(s => (
              <button key={s} onClick={() => setFilterStatus(st => st === s ? "all" : s)}
                style={{ padding: "5px 12px", borderRadius: 20, fontSize: 11, cursor: "pointer", fontWeight: filterStatus === s ? 600 : 400,
                  background: filterStatus === s ? "rgba(59,158,255,.15)" : T.up,
                  border: `1px solid ${filterStatus === s ? "rgba(59,158,255,.4)" : T.border}`,
                  color: filterStatus === s ? T.blue : T.txt3 }}>
                {s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <span style={{ marginLeft: "auto", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.txt4 }}>{filtered.length} records</span>
        </div>

        {/* RECORDS TABLE */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: T.txt4 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: T.txt4 }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: .3 }}>🚪</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16 }}>No disposition records found</div>
            <button onClick={openNew} style={{ marginTop: 16, background: T.teal, color: T.bg, border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Create First Record</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1.2fr 1fr 1fr auto", gap: 12, padding: "6px 16px", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.txt4, textTransform: "uppercase", letterSpacing: 1 }}>
              <span>Patient</span><span>MRN</span><span>Chief Complaint</span><span>Disposition</span><span>Status</span><span></span>
            </div>
            {filtered.map(rec => {
              const dp = rec._dispo || {};
              const expanded = expandedId === rec.id;
              return (
                <div key={rec.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
                  <div className="db-row" onClick={() => setExpandedId(e => e === rec.id ? null : rec.id)}
                    style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1.2fr 1fr 1fr auto", gap: 12, padding: "12px 16px", cursor: "pointer", alignItems: "center" }}>
                    <span style={{ fontWeight: 600, color: T.txt, fontSize: 13 }}>{rec.patient_name || "—"}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.teal }}>{rec.patient_id || "—"}</span>
                    <span style={{ fontSize: 12, color: T.txt2 }}>{rec.chief_complaint || "—"}</span>
                    <DispoTypeBadge type={dp.dispo_type} />
                    <StatusBadge status={dp.status || "pending"} />
                    <div style={{ display: "flex", gap: 5 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEdit(rec)} style={{ background: T.up, border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 10px", fontSize: 11, color: T.txt2, cursor: "pointer" }}>Edit</button>
                      <button onClick={() => del(rec.id)} style={{ background: "rgba(255,107,107,.08)", border: "1px solid rgba(255,107,107,.25)", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: T.coral, cursor: "pointer" }}>✕</button>
                    </div>
                  </div>
                  {expanded && (
                    <div style={{ borderTop: `1px solid ${T.border}`, padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                      {dp.attending && <div><div style={{ fontSize: 9, color: T.txt4, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Attending</div><div style={{ fontSize: 12, color: T.txt }}>{dp.attending}</div></div>}
                      {(dp.admit_service || dp.transfer_destination) && <div><div style={{ fontSize: 9, color: T.txt4, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{dp.dispo_type === "transfer" ? "Destination" : "Service"}</div><div style={{ fontSize: 12, color: T.txt }}>{dp.admit_service || dp.transfer_destination}</div></div>}
                      {dp.follow_up && <div><div style={{ fontSize: 9, color: T.txt4, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Follow-up</div><div style={{ fontSize: 12, color: T.txt }}>{dp.follow_up}</div></div>}
                      {dp.return_precautions?.length > 0 && (
                        <div style={{ gridColumn: "1 / -1" }}><div style={{ fontSize: 9, color: T.txt4, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>Return Precautions</div>
                          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                            {dp.return_precautions.map(p => <span key={p} style={{ fontSize: 10, background: "rgba(255,159,67,.1)", border: "1px solid rgba(255,159,67,.3)", color: T.orange, borderRadius: 5, padding: "2px 8px" }}>{p}</span>)}
                          </div>
                        </div>
                      )}
                      {rec.discharge_summary && <div style={{ gridColumn: "1 / -1" }}><div style={{ fontSize: 9, color: T.txt4, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Instructions</div><div style={{ fontSize: 12, color: T.txt2, lineHeight: 1.6 }}>{rec.discharge_summary}</div></div>}
                      {dp.notes && <div style={{ gridColumn: "1 / -1" }}><div style={{ fontSize: 9, color: T.txt4, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Notes</div><div style={{ fontSize: 12, color: T.txt2, lineHeight: 1.6 }}>{dp.notes}</div></div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(3,8,16,.75)", backdropFilter: "blur(4px)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto", padding: "28px 30px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700 }}>{editId ? "Edit Disposition" : "New Disposition"}</div>
              <button onClick={() => setShowForm(false)} style={{ background: T.up, border: `1px solid ${T.border}`, borderRadius: 6, width: 30, height: 30, color: T.txt3, fontSize: 14, cursor: "pointer" }}>✕</button>
            </div>

            {/* Patient Info */}
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.txt4, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Patient Info</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <input className="db-inp" style={inp} placeholder="Patient Name *" value={form.patient_name} onChange={e => setForm(f => ({ ...f, patient_name: e.target.value }))} />
              <input className="db-inp" style={inp} placeholder="MRN" value={form.patient_mrn} onChange={e => setForm(f => ({ ...f, patient_mrn: e.target.value }))} />
              <input className="db-inp" style={{ ...inp, gridColumn: "1 / -1" }} placeholder="Chief Complaint" value={form.chief_complaint} onChange={e => setForm(f => ({ ...f, chief_complaint: e.target.value }))} />
              <input className="db-inp" style={inp} placeholder="Attending Physician" value={form.attending} onChange={e => setForm(f => ({ ...f, attending: e.target.value }))} />
              <select className="db-inp" style={{ ...inp }} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="pending">Pending</option>
                <option value="inprogress">In Progress</option>
                <option value="complete">Complete</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Disposition Type */}
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.txt4, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Disposition Type *</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
              {DISPO_TYPES.map(d => (
                <button key={d.id} onClick={() => setForm(f => ({ ...f, dispo_type: d.id }))}
                  style={{ padding: "10px", borderRadius: 9, cursor: "pointer", transition: "all .15s", textAlign: "center",
                    background: form.dispo_type === d.id ? `${d.color}18` : T.up,
                    border: `2px solid ${form.dispo_type === d.id ? d.color : T.border}`,
                    color: form.dispo_type === d.id ? d.color : T.txt3 }}>
                  <div style={{ fontSize: 18, marginBottom: 3 }}>{d.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{d.label}</div>
                </button>
              ))}
            </div>

            {/* Conditional fields */}
            {(form.dispo_type === "admit" || form.dispo_type === "obs") && (
              <>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.txt4, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Admitting Service</div>
                <select className="db-inp" style={{ ...inp, marginBottom: 16 }} value={form.admit_service} onChange={e => setForm(f => ({ ...f, admit_service: e.target.value }))}>
                  <option value="">Select service…</option>
                  {ADMIT_SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </>
            )}
            {form.dispo_type === "transfer" && (
              <>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.txt4, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Transfer Destination</div>
                <input className="db-inp" style={{ ...inp, marginBottom: 16 }} placeholder="Receiving facility…" value={form.transfer_destination} onChange={e => setForm(f => ({ ...f, transfer_destination: e.target.value }))} />
              </>
            )}
            {form.dispo_type === "discharge" && (
              <>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.txt4, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Follow-up</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 16 }}>
                  {FOLLOW_UP_OPTIONS.map(opt => (
                    <button key={opt} onClick={() => setForm(f => ({ ...f, follow_up: opt }))}
                      style={{ padding: "4px 11px", borderRadius: 20, fontSize: 11, cursor: "pointer",
                        background: form.follow_up === opt ? "rgba(0,229,192,.15)" : T.up,
                        border: `1px solid ${form.follow_up === opt ? "rgba(0,229,192,.45)" : T.border}`,
                        color: form.follow_up === opt ? T.teal : T.txt3 }}>
                      {opt}
                    </button>
                  ))}
                </div>

                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.txt4, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Return Precautions</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 16 }}>
                  {RETURN_PRECAUTIONS.map(p => (
                    <button key={p} onClick={() => togglePrec(p)}
                      style={{ padding: "4px 11px", borderRadius: 20, fontSize: 11, cursor: "pointer",
                        background: form.return_precautions.includes(p) ? "rgba(255,159,67,.12)" : T.up,
                        border: `1px solid ${form.return_precautions.includes(p) ? "rgba(255,159,67,.45)" : T.border}`,
                        color: form.return_precautions.includes(p) ? T.orange : T.txt3 }}>
                      {p}
                    </button>
                  ))}
                </div>

                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.txt4, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Discharge Medications</div>
                <textarea className="db-inp" style={{ ...inp, resize: "vertical", lineHeight: 1.6, marginBottom: 16 }} rows={3} placeholder="Medication name · Dose · Frequency · Duration…" value={form.discharge_meds} onChange={e => setForm(f => ({ ...f, discharge_meds: e.target.value }))} />

                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.txt4, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Discharge Instructions</div>
                <textarea className="db-inp" style={{ ...inp, resize: "vertical", lineHeight: 1.6, marginBottom: 16 }} rows={4} placeholder="Patient instructions…" value={form.discharge_instructions} onChange={e => setForm(f => ({ ...f, discharge_instructions: e.target.value }))} />
              </>
            )}

            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.txt4, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Additional Notes</div>
            <textarea className="db-inp" style={{ ...inp, resize: "vertical", lineHeight: 1.6, marginBottom: 22 }} rows={3} placeholder="Provider notes…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowForm(false)} style={{ background: T.up, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 20px", fontSize: 12, color: T.txt2, cursor: "pointer" }}>Cancel</button>
              <button onClick={save} disabled={saving} style={{ background: T.teal, color: T.bg, border: "none", borderRadius: 8, padding: "8px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: saving ? .6 : 1 }}>
                {saving ? "Saving…" : editId ? "Save Changes" : "Create Disposition"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}