import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const T = {
  navy:"#050f1e", panel:"#0d2240", edge:"#162d4f",
  border:"#1e3a5f", muted:"#2a4d72", dim:"#4a7299", text:"#c8ddf0",
  bright:"#e8f4ff", teal:"#00d4bc", amber:"#f5a623",
  red:"#ff5c6c", green:"#2ecc71", purple:"#9b6dff", blue:"#4a90d9",
};

const FIELDS = [
  { key:"mrsa",       label:"MRSA Prevalence",              color:T.red    },
  { key:"esbl",       label:"ESBL E. coli / Klebsiella",    color:T.amber  },
  { key:"pseudo",     label:"Pseudomonas pip/tazo-R",        color:T.amber  },
  { key:"fqec",       label:"FQ-resistant E. coli",          color:T.blue   },
  { key:"spneu",      label:"Pen-R S. pneumoniae",           color:T.purple },
  { key:"carbapenem_r",label:"Carbapenem-resistant (CRE)",   color:T.red    },
  { key:"vre",        label:"Vancomycin-resistant Enterococcus",color:T.rose||"#f472b6" },
];

const BLANK = { facility_name:"", department:"", year: new Date().getFullYear(), mrsa:"", esbl:"", pseudo:"", fqec:"", spneu:"", carbapenem_r:"", vre:"", notes:"", is_active:true, source:"manual" };

const inputStyle = {
  background:"rgba(22,45,79,.8)", border:`1px solid ${T.border}`, borderRadius:8,
  padding:"8px 11px", fontFamily:"'DM Sans',sans-serif", fontSize:12.5,
  color:T.bright, outline:"none", width:"100%", boxSizing:"border-box",
};
const labelStyle = { fontSize:"9.5px", fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", color:T.dim, display:"block", marginBottom:4 };

export default function AntibiogramManager({ onApply, currentResist }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [editId, setEditId] = useState(null);
  const [csvText, setCsvText] = useState("");
  const [showCsvModal, setShowCsvModal] = useState(false);
  const qc = useQueryClient();

  const { data: antibiograms = [] } = useQuery({
    queryKey: ["antibiograms"],
    queryFn: () => base44.entities.Antibiogram.list("-year", 50),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editId
      ? base44.entities.Antibiogram.update(editId, data)
      : base44.entities.Antibiogram.create(data),
    onSuccess: () => { qc.invalidateQueries(["antibiograms"]); setShowForm(false); setForm(BLANK); setEditId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Antibiogram.delete(id),
    onSuccess: () => qc.invalidateQueries(["antibiograms"]),
  });

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function startEdit(ab) {
    setForm({ ...ab });
    setEditId(ab.id);
    setShowForm(true);
  }

  function handleApply(ab) {
    const mapped = {};
    FIELDS.forEach(f => { if (ab[f.key] !== undefined && ab[f.key] !== "") mapped[f.key] = String(ab[f.key]); });
    onApply(mapped);
  }

  function parseCsv() {
    // Expect header row: facility_name,year,department,mrsa,esbl,pseudo,fqec,spneu,carbapenem_r,vre,notes
    const lines = csvText.trim().split("\n").filter(Boolean);
    if (lines.length < 2) return;
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const row = lines[1].split(",").map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] || ""; });
    setForm({ ...BLANK, ...obj, source:"uploaded", is_active:true });
    setShowCsvModal(false);
    setShowForm(true);
  }

  const activeAb = antibiograms.find(a => a.is_active);

  return (
    <div style={{ background:"rgba(0,212,188,.03)", border:"1px solid rgba(0,212,188,.18)", borderRadius:13, overflow:"hidden", marginBottom:18 }}>
      {/* Header */}
      <div style={{ padding:"12px 16px", borderBottom:`1px solid rgba(0,212,188,.15)`, display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:28, height:28, borderRadius:7, background:"rgba(0,212,188,.12)", border:"1px solid rgba(0,212,188,.28)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>📊</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.teal }}>Local Antibiogram</div>
          <div style={{ fontSize:11, color:T.dim, marginTop:1 }}>
            {activeAb ? `Active: ${activeAb.facility_name} — ${activeAb.year}` : "No antibiogram loaded — using manual rates below"}
          </div>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <button onClick={() => setShowCsvModal(true)} style={{ fontSize:11, fontWeight:700, padding:"5px 11px", borderRadius:7, background:"rgba(74,144,217,.1)", border:"1px solid rgba(74,144,217,.3)", color:T.blue, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>⬆ Import CSV</button>
          <button onClick={() => { setForm(BLANK); setEditId(null); setShowForm(s=>!s); }} style={{ fontSize:11, fontWeight:700, padding:"5px 11px", borderRadius:7, background:"rgba(0,212,188,.08)", border:"1px solid rgba(0,212,188,.25)", color:T.teal, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>{showForm && !editId ? "✕ Cancel" : "＋ New"}</button>
        </div>
      </div>

      {/* Saved antibiograms list */}
      {antibiograms.length > 0 && !showForm && (
        <div style={{ maxHeight:200, overflowY:"auto" }}>
          {antibiograms.map(ab => (
            <div key={ab.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 14px", borderBottom:`1px solid rgba(30,58,95,.35)`, background: ab.is_active ? "rgba(0,212,188,.05)" : "transparent" }}>
              <div style={{ flex:1 }}>
                <span style={{ fontWeight:700, fontSize:12, color:T.bright }}>{ab.facility_name}</span>
                <span style={{ fontSize:11, color:T.dim, marginLeft:8 }}>{ab.department || "All Depts"} · {ab.year}</span>
                {ab.is_active && <span style={{ marginLeft:8, fontSize:9.5, fontWeight:800, padding:"2px 7px", borderRadius:8, background:"rgba(0,212,188,.12)", color:T.teal, border:"1px solid rgba(0,212,188,.25)" }}>ACTIVE</span>}
              </div>
              <div style={{ display:"flex", gap:5 }}>
                <button onClick={() => handleApply(ab)} style={{ fontSize:10.5, fontWeight:700, padding:"4px 9px", borderRadius:6, background:"rgba(46,204,113,.1)", border:"1px solid rgba(46,204,113,.25)", color:T.green, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Apply</button>
                <button onClick={() => startEdit(ab)} style={{ fontSize:10.5, fontWeight:700, padding:"4px 9px", borderRadius:6, background:"rgba(74,144,217,.08)", border:"1px solid rgba(74,144,217,.22)", color:T.blue, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Edit</button>
                <button onClick={() => deleteMutation.mutate(ab.id)} style={{ fontSize:10.5, fontWeight:700, padding:"4px 9px", borderRadius:6, background:"rgba(255,92,108,.08)", border:"1px solid rgba(255,92,108,.22)", color:T.red, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {antibiograms.length === 0 && !showForm && (
        <div style={{ padding:"14px 16px", fontSize:12, color:T.muted, textAlign:"center" }}>
          No antibiograms saved yet. Add one manually or import a CSV.
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
            <div>
              <label style={labelStyle}>Facility Name *</label>
              <input style={inputStyle} value={form.facility_name} onChange={e=>set("facility_name",e.target.value)} placeholder="e.g. Memorial Hospital" />
            </div>
            <div>
              <label style={labelStyle}>Department / Unit</label>
              <input style={inputStyle} value={form.department} onChange={e=>set("department",e.target.value)} placeholder="ICU, ED, General…" />
            </div>
            <div>
              <label style={labelStyle}>Year</label>
              <input type="number" style={inputStyle} value={form.year} onChange={e=>set("year",e.target.value)} />
            </div>
          </div>

          <div style={{ fontSize:"9.5px", fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:T.dim, marginTop:4 }}>Resistance Rates (%)</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {FIELDS.map(f => (
              <div key={f.key} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:T.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{f.label}</div>
                  <div style={{ width:"100%", height:3, borderRadius:2, background:T.edge, overflow:"hidden", marginTop:3 }}>
                    <div style={{ height:"100%", borderRadius:2, background:f.color, width:Math.min(parseFloat(form[f.key])||0,100)+"%", transition:"width .3s" }}/>
                  </div>
                </div>
                <input type="number" min="0" max="100" value={form[f.key]} onChange={e=>set(f.key,e.target.value)} placeholder="—"
                  style={{ width:52, textAlign:"center", background:"rgba(22,45,79,.7)", border:`1px solid ${T.border}`, borderRadius:6, padding:"5px 6px", fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700, color:T.bright, outline:"none" }} />
                <span style={{ fontSize:10, color:T.dim }}>%</span>
              </div>
            ))}
          </div>

          <div>
            <label style={labelStyle}>Notes</label>
            <input style={inputStyle} value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Data source, collection period, caveats…" />
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:12, color:T.text }}>
              <input type="checkbox" checked={form.is_active} onChange={e=>set("is_active",e.target.checked)} style={{ cursor:"pointer" }} />
              Set as active antibiogram
            </label>
            <div style={{ flex:1 }}/>
            <button onClick={() => { setShowForm(false); setEditId(null); }} style={{ padding:"7px 14px", borderRadius:7, fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, cursor:"pointer", background:"transparent", border:`1px solid ${T.border}`, color:T.text }}>Cancel</button>
            <button
              onClick={() => {
                if (!form.facility_name) return;
                const payload = { ...form };
                FIELDS.forEach(f => { payload[f.key] = parseFloat(payload[f.key]) || 0; });
                payload.year = parseInt(payload.year) || new Date().getFullYear();
                saveMutation.mutate(payload);
              }}
              style={{ padding:"7px 16px", borderRadius:7, fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, cursor:"pointer", background:"linear-gradient(135deg,#00d4bc,#00a896)", border:"none", color:"#fff" }}
            >
              {editId ? "Update" : "Save"} Antibiogram
            </button>
            {form.facility_name && (
              <button
                onClick={() => {
                  const mapped = {};
                  FIELDS.forEach(f => { if (form[f.key] !== "" && form[f.key] !== undefined) mapped[f.key] = String(form[f.key]); });
                  onApply(mapped);
                }}
                style={{ padding:"7px 14px", borderRadius:7, fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, cursor:"pointer", background:"rgba(155,109,255,.12)", border:"1px solid rgba(155,109,255,.3)", color:T.purple }}
              >
                ↗ Apply Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)", backdropFilter:"blur(6px)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={()=>setShowCsvModal(false)}>
          <div style={{ background:T.panel, border:`1px solid ${T.border}`, borderRadius:16, width:520, padding:24 }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:T.bright, marginBottom:6 }}>Import Antibiogram CSV</div>
            <div style={{ fontSize:11.5, color:T.dim, marginBottom:12, lineHeight:1.6 }}>
              Paste CSV with a header row and one data row. Expected columns:<br/>
              <code style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10.5, color:T.teal }}>facility_name, year, department, mrsa, esbl, pseudo, fqec, spneu, carbapenem_r, vre, notes</code>
            </div>
            <textarea
              value={csvText} onChange={e=>setCsvText(e.target.value)}
              rows={5}
              placeholder={"facility_name,year,department,mrsa,esbl,pseudo,fqec,spneu,carbapenem_r,vre,notes\nMemorial Hospital,2025,ICU,32,18,24,27,12,4,3,Source: Pharmacy antibiogram report"}
              style={{ ...inputStyle, resize:"vertical", fontFamily:"'JetBrains Mono',monospace", fontSize:11.5, lineHeight:1.6 }}
            />
            <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:12 }}>
              <button onClick={()=>setShowCsvModal(false)} style={{ padding:"8px 16px", borderRadius:7, fontFamily:"'DM Sans',sans-serif", fontSize:12.5, fontWeight:700, cursor:"pointer", background:"transparent", border:`1px solid ${T.border}`, color:T.text }}>Cancel</button>
              <button onClick={parseCsv} style={{ padding:"8px 18px", borderRadius:7, fontFamily:"'DM Sans',sans-serif", fontSize:12.5, fontWeight:700, cursor:"pointer", background:"linear-gradient(135deg,#00d4bc,#00a896)", border:"none", color:"#fff" }}>Parse &amp; Fill Form</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}