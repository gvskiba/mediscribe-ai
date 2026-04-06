import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const PREFIX = "pw";

(() => {
  const id = `${PREFIX}-fonts`;
  if (document.getElementById(id)) return;
  const l = document.createElement("link");
  l.id = id; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = `${PREFIX}-css`;
  s.textContent = `
    * { box-sizing:border-box; margin:0; padding:0; }
    ::-webkit-scrollbar { width:3px; } ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:rgba(42,79,122,.5); border-radius:2px; }
    @keyframes ${PREFIX}fade  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes ${PREFIX}shim  { 0%,100%{background-position:-200% center} 50%{background-position:200% center} }
    @keyframes ${PREFIX}pulse { 0%,100%{opacity:1} 50%{opacity:.25} }
    @keyframes ${PREFIX}orb0  { 0%,100%{transform:translate(-50%,-50%) scale(1)}    50%{transform:translate(-50%,-50%) scale(1.1)} }
    @keyframes ${PREFIX}orb1  { 0%,100%{transform:translate(-50%,-50%) scale(1.07)} 50%{transform:translate(-50%,-50%) scale(.92)} }
    @keyframes ${PREFIX}orb2  { 0%,100%{transform:translate(-50%,-50%) scale(.95)}  50%{transform:translate(-50%,-50%) scale(1.09)} }
    .${PREFIX}-fade  { animation:${PREFIX}fade  .22s ease both; }
    .${PREFIX}-pulse { animation:${PREFIX}pulse 1.8s ease-in-out infinite; }
    .${PREFIX}-shim  {
      background:linear-gradient(90deg,#f2f7ff 0%,#00e5c0 35%,#3b9eff 65%,#9b6dff 85%,#f2f7ff 100%);
      background-size:250% auto; -webkit-background-clip:text;
      -webkit-text-fill-color:transparent; background-clip:text;
      animation:${PREFIX}shim 5s linear infinite;
    }
    .${PREFIX}-tab:hover { background:rgba(14,37,68,0.6) !important; color:#b8d4f0 !important; }
    .${PREFIX}-tool-btn:hover { filter:brightness(1.18); transform:translateY(-1px); }
    .${PREFIX}-section-btn:hover { background:rgba(14,37,68,0.7) !important; }
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", red:"#ff4444", green:"#3dffa0",
  blue:"#3b9eff", purple:"#9b6dff", orange:"#ff9f43", coral:"#ff6b6b",
};

const glass = {
  backdropFilter:"blur(20px) saturate(180%)", WebkitBackdropFilter:"blur(20px) saturate(180%)",
  background:"rgba(8,22,40,0.78)", border:"1px solid rgba(42,79,122,0.35)", borderRadius:14,
};

// ── WORKSPACE TABS ────────────────────────────────────────────────────
const TABS = [
  { id:"overview",   icon:"📊", label:"Overview"       },
  { id:"chart",      icon:"📋", label:"Chart"          },
  { id:"notes",      icon:"📝", label:"Notes"          },
  { id:"orders",     icon:"⚡", label:"Orders"         },
  { id:"results",    icon:"🔬", label:"Results"        },
  { id:"meds",       icon:"💊", label:"Medications"    },
  { id:"imaging",    icon:"🩻", label:"Imaging"        },
  { id:"procedures", icon:"✂️", label:"Procedures"     },
  { id:"dispo",      icon:"🚪", label:"Disposition"    },
  { id:"billing",    icon:"💰", label:"Billing / MDM"  },
];

// ── TOOL SHORTCUTS ────────────────────────────────────────────────────
const TOOLS = [
  { icon:"🧠", label:"Narrative",  route:"/narrative-engine", color:T.purple },
  { icon:"📐", label:"DDx",        route:"/ddx-engine",       color:T.blue   },
  { icon:"💊", label:"Dosing",     route:"/smart-dosing",     color:T.green  },
  { icon:"🫀", label:"ECG",        route:"/ecg-hub",          color:T.gold   },
  { icon:"💓", label:"Resus",      route:"/resus-hub",        color:T.red    },
  { icon:"🌬️", label:"Airway",    route:"/airway-hub",       color:T.blue   },
  { icon:"🔬", label:"Labs",       route:"/LabsImaging",      color:T.teal   },
  { icon:"📡", label:"Consult",    route:"/consult-hub",      color:T.purple },
];

// ── VITAL CONFIGS ─────────────────────────────────────────────────────
const VITAL_DEFS = [
  { key:"bp",   label:"BP",    unit:"mmHg", isAbnormal:(v) => { const s = parseInt(v); return s > 140 || s < 90; }},
  { key:"hr",   label:"HR",    unit:"bpm",  isAbnormal:(v) => { const n = parseInt(v); return n > 100 || n < 50; }},
  { key:"rr",   label:"RR",    unit:"/min", isAbnormal:(v) => { const n = parseInt(v); return n > 20 || n < 10; }},
  { key:"spo2", label:"SpO₂",  unit:"%",    isAbnormal:(v) => parseInt(v) < 94 },
  { key:"temp", label:"Temp",  unit:"°F",   isAbnormal:(v) => { const n = parseFloat(v); return n > 100.4 || n < 96; }},
  { key:"gcs",  label:"GCS",   unit:"",     isAbnormal:(v) => parseInt(v) < 13 },
];

// ── HELPERS ───────────────────────────────────────────────────────────
function minsAgo(iso) {
  if (!iso) return null;
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}
function fmtElapsed(m) {
  if (m === null || m === undefined) return "—";
  return m < 60 ? `${m}m` : `${Math.floor(m/60)}h${m%60>0?` ${m%60}m`:""}`;
}
function calcAge(dob) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

// ══════════════════════════════════════════════════════════════════════
//  PRIMITIVES
// ══════════════════════════════════════════════════════════════════════

function AmbientBg() {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
      {[
        { l:"10%", t:"18%", r:320, c:"rgba(0,229,192,0.04)",   a:0 },
        { l:"88%", t:"10%", r:280, c:"rgba(59,158,255,0.04)",  a:1 },
        { l:"74%", t:"78%", r:300, c:"rgba(155,109,255,0.035)",a:2 },
        { l:"20%", t:"82%", r:240, c:"rgba(245,200,66,0.03)",  a:0 },
      ].map((o,i) => (
        <div key={i} style={{
          position:"absolute", left:o.l, top:o.t,
          width:o.r*2, height:o.r*2, borderRadius:"50%",
          background:`radial-gradient(circle,${o.c} 0%,transparent 68%)`,
          transform:"translate(-50%,-50%)",
          animation:`${PREFIX}orb${o.a} ${8+i*1.4}s ease-in-out infinite`,
        }}/>
      ))}
    </div>
  );
}

function Toast({ msg, err }) {
  return (
    <div style={{
      position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
      background:"rgba(8,22,40,0.96)", borderRadius:10, padding:"10px 20px",
      border:`1px solid ${err ? T.red+"55" : T.teal+"45"}`,
      fontFamily:"DM Sans", fontWeight:600, fontSize:13,
      color:err ? T.coral : T.teal, zIndex:99999, pointerEvents:"none",
      animation:`${PREFIX}fade .2s ease both`,
    }}>{msg}</div>
  );
}

function SectionLabel({ children, color }) {
  return (
    <div style={{
      fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700,
      color: color || T.txt4, letterSpacing:2, textTransform:"uppercase", marginBottom:8,
    }}>{children}</div>
  );
}

function Badge({ children, color }) {
  return (
    <span style={{
      fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700,
      padding:"2px 7px", borderRadius:20,
      background:`${color}18`, border:`1px solid ${color}35`, color,
    }}>{children}</span>
  );
}

function EmptyState({ icon, title, sub, action, onAction }) {
  return (
    <div style={{
      ...glass, padding:"36px", textAlign:"center",
      display:"flex", flexDirection:"column", alignItems:"center", gap:10,
    }}>
      <span style={{ fontSize:32 }}>{icon}</span>
      <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:14, color:T.txt2 }}>{title}</div>
      {sub && <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt4 }}>{sub}</div>}
      {action && (
        <button onClick={onAction} style={{
          marginTop:6, fontFamily:"DM Sans", fontWeight:700, fontSize:12,
          padding:"8px 20px", borderRadius:9, cursor:"pointer",
          border:`1px solid ${T.teal}40`, background:`${T.teal}0e`, color:T.teal,
        }}>{action}</button>
      )}
    </div>
  );
}

// ── VITAL CARD ────────────────────────────────────────────────────────
function VitalCard({ def, value }) {
  const abn = value && def.isAbnormal(value);
  const color = abn ? T.red : T.teal;
  return (
    <div style={{
      ...glass, padding:"10px 12px", textAlign:"center",
      borderTop:`2px solid ${color}`,
      background: abn ? `${T.red}08` : "rgba(8,22,40,0.6)",
    }}>
      <div style={{
        fontFamily:"JetBrains Mono", fontWeight:700,
        fontSize:20, color, lineHeight:1,
        ...(abn ? { animation:`${PREFIX}pulse 2s ease-in-out infinite` } : {}),
      }}>{value || "—"}</div>
      <div style={{ fontFamily:"DM Sans", fontSize:9, color:T.txt4, marginTop:3, fontWeight:500 }}>{def.label}</div>
      {def.unit && <div style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4 }}>{def.unit}</div>}
    </div>
  );
}

// ── SECTION WRAPPER ───────────────────────────────────────────────────
function Section({ title, color, children, action, onAction }) {
  return (
    <div style={{ ...glass, padding:"14px 16px", marginBottom:10 }}>
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10,
      }}>
        <SectionLabel color={color}>{title}</SectionLabel>
        {action && (
          <button onClick={onAction} style={{
            fontFamily:"DM Sans", fontWeight:700, fontSize:10,
            padding:"4px 12px", borderRadius:8, cursor:"pointer",
            border:`1px solid ${color}35`, background:`${color}0a`, color,
          }}>{action}</button>
        )}
      </div>
      {children}
    </div>
  );
}

// ── PATIENT SEARCH PANEL ──────────────────────────────────────────────
function PatientSearchPanel({ patients, onSelect }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q.trim()) return patients;
    const ql = q.toLowerCase();
    return patients.filter(p =>
      p.patient_name?.toLowerCase().includes(ql) ||
      p.patient_id?.toLowerCase().includes(ql) ||
      p.chronic_conditions?.some(c => c.toLowerCase().includes(ql))
    );
  }, [patients, q]);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <input
        type="text" value={q} onChange={e => setQ(e.target.value)}
        placeholder="Search by name, MRN, or chief complaint..."
        style={{
          background:"rgba(14,37,68,0.8)",
          border:`1px solid ${q ? T.blue+"55" : "rgba(42,79,122,0.4)"}`,
          borderRadius:10, padding:"10px 14px",
          fontFamily:"DM Sans", fontSize:13, color:T.txt, outline:"none", width:"100%",
        }}
      />
      {filtered.length === 0 && (
        <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt4, textAlign:"center", padding:16 }}>
          {q ? "No patients match your search" : "No patients in the system"}
        </div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:7, maxHeight:"60vh", overflowY:"auto" }}>
        {filtered.map(p => {
          const age = calcAge(p.date_of_birth);
          const mins = minsAgo(p.created_date);
          return (
            <div key={p.id} onClick={() => onSelect(p)} style={{
              ...glass, padding:"12px 14px", cursor:"pointer",
              borderLeft:`3px solid ${T.teal}`,
              transition:"background .15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(14,37,68,0.8)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(8,22,40,0.78)"}
            >
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
                <div>
                  <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:14, color:T.txt }}>{p.patient_name}</div>
                  <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4, marginTop:2 }}>
                    {p.patient_id && `MRN: ${p.patient_id} · `}
                    {age && `${age}y `}{p.gender ? p.gender[0].toUpperCase() : ""}
                    {p.chronic_conditions?.[0] && ` · ${p.chronic_conditions[0]}`}
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4 }}>
                    {mins !== null ? fmtElapsed(mins) + " ago" : "—"}
                  </div>
                  <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.teal, marginTop:2 }}>
                    Rm {p.patient_id || "—"}
                  </div>
                </div>
              </div>
              {p.allergies?.length > 0 && (
                <div style={{ marginTop:6, display:"flex", gap:4, flexWrap:"wrap" }}>
                  {p.allergies.map((a, i) => (
                    <span key={i} style={{
                      fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700,
                      padding:"1px 6px", borderRadius:20,
                      background:`${T.red}0f`, border:`1px solid ${T.red}25`, color:T.coral,
                    }}>⚠️ {a}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── OVERVIEW TAB ──────────────────────────────────────────────────────
function OverviewTab({ patient, notes, navigate }) {
  const age = calcAge(patient.date_of_birth);
  const latestNote = notes[0];
  const mins = minsAgo(patient.created_date);

  return (
    <div className={`${PREFIX}-fade`} style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {/* Demographics */}
      <Section title="Demographics" color={T.teal}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10 }}>
          {[
            { label:"Full Name",   value:patient.patient_name },
            { label:"MRN",         value:patient.patient_id   },
            { label:"Date of Birth",value:patient.date_of_birth },
            { label:"Age",         value:age ? `${age} years` : "—" },
            { label:"Gender",      value:patient.gender       },
            { label:"Phone",       value:patient.contact_number },
            { label:"Insurance",   value:patient.insurance_provider },
            { label:"Member ID",   value:patient.insurance_id  },
            { label:"ED Arrival",  value:mins !== null ? `${fmtElapsed(mins)} ago` : "—" },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:7, color:T.txt4, letterSpacing:1, textTransform:"uppercase", marginBottom:3 }}>{label}</div>
              <div style={{ fontFamily:"DM Sans", fontWeight:600, fontSize:12, color:T.txt }}>{value || "—"}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Allergies */}
      <Section title="Allergies" color={T.red}>
        {!patient.allergies?.length ? (
          <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.green, fontWeight:600 }}>✓ NKDA — No Known Drug Allergies</div>
        ) : (
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {patient.allergies.map((a, i) => (
              <span key={i} style={{
                fontFamily:"DM Sans", fontWeight:700, fontSize:12,
                padding:"4px 12px", borderRadius:20,
                background:`${T.red}12`, border:`1px solid ${T.red}30`, color:T.coral,
              }}>⚠️ {a}</span>
            ))}
          </div>
        )}
      </Section>

      {/* Chronic conditions */}
      <Section title="Problem List / PMH" color={T.orange}>
        {!patient.chronic_conditions?.length ? (
          <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt4, fontStyle:"italic" }}>No chronic conditions documented</div>
        ) : (
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            {patient.chronic_conditions.map((c, i) => (
              <span key={i} style={{
                fontFamily:"DM Sans", fontWeight:500, fontSize:12,
                padding:"4px 12px", borderRadius:20,
                background:"rgba(14,37,68,0.6)", border:"1px solid rgba(42,79,122,0.3)", color:T.txt2,
              }}>{c}</span>
            ))}
          </div>
        )}
      </Section>

      {/* Emergency contact */}
      {patient.emergency_contact && (
        <Section title="Emergency Contact" color={T.blue}>
          <div style={{ fontFamily:"DM Sans", fontSize:13, color:T.txt2 }}>{patient.emergency_contact}</div>
        </Section>
      )}

      {/* Latest note snippet */}
      {latestNote && (
        <Section title="Latest Note" color={T.purple} action="Open Studio" onAction={() => navigate("/ClinicalNoteStudio")}>
          <div style={{ display:"flex", gap:8, marginBottom:8 }}>
            <Badge color={latestNote.status === "finalized" ? T.teal : T.orange}>
              {(latestNote.status || "DRAFT").toUpperCase()}
            </Badge>
            <Badge color={T.txt4}>{latestNote.note_type?.replace(/_/g," ") || "Note"}</Badge>
          </div>
          {latestNote.chief_complaint && (
            <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt3, marginBottom:6 }}>
              <strong style={{ color:T.txt4 }}>CC:</strong> {latestNote.chief_complaint}
            </div>
          )}
          {latestNote.assessment && (
            <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt3, lineHeight:1.6 }}>
              <strong style={{ color:T.txt4 }}>Assessment:</strong> {latestNote.assessment}
            </div>
          )}
        </Section>
      )}
    </div>
  );
}

// ── CHART TAB ─────────────────────────────────────────────────────────
function ChartTab({ patient }) {
  const age = calcAge(patient.date_of_birth);

  return (
    <div className={`${PREFIX}-fade`} style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {/* Identity banner */}
      <div style={{
        ...glass, padding:"14px 16px",
        borderLeft:`4px solid ${T.teal}`,
        background:`${T.teal}07`,
        display:"flex", alignItems:"center", gap:16, flexWrap:"wrap",
      }}>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"Playfair Display", fontWeight:900, fontSize:20, color:T.txt, marginBottom:4 }}>
            {patient.patient_name}
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {[
              patient.patient_id && `MRN: ${patient.patient_id}`,
              age && `${age}y`,
              patient.gender,
              patient.date_of_birth,
            ].filter(Boolean).map((v, i) => (
              <span key={i} style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.txt3 }}>{v}</span>
            ))}
          </div>
        </div>
        {patient.allergies?.length > 0 && (
          <div style={{
            padding:"8px 14px", borderRadius:9,
            background:`${T.red}0f`, border:`1px solid ${T.red}30`,
          }}>
            <div style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.red, marginBottom:4 }}>⚠️ ALLERGIES</div>
            {patient.allergies.map((a, i) => (
              <div key={i} style={{ fontFamily:"DM Sans", fontWeight:600, fontSize:11, color:T.coral }}>{a}</div>
            ))}
          </div>
        )}
      </div>

      {/* Chronic conditions */}
      <Section title="Active Problems" color={T.orange}>
        {patient.chronic_conditions?.length ? (
          <ol style={{ paddingLeft:16, display:"flex", flexDirection:"column", gap:5 }}>
            {patient.chronic_conditions.map((c, i) => (
              <li key={i} style={{ fontFamily:"DM Sans", fontSize:13, color:T.txt2 }}>{c}</li>
            ))}
          </ol>
        ) : (
          <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt4, fontStyle:"italic" }}>No active problems</div>
        )}
      </Section>

      {/* Insurance */}
      {(patient.insurance_provider || patient.insurance_id) && (
        <Section title="Insurance" color={T.blue}>
          <div style={{ display:"flex", gap:24 }}>
            {patient.insurance_provider && (
              <div>
                <div style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4, letterSpacing:1, textTransform:"uppercase", marginBottom:3 }}>Provider</div>
                <div style={{ fontFamily:"DM Sans", fontSize:13, color:T.txt }}>{patient.insurance_provider}</div>
              </div>
            )}
            {patient.insurance_id && (
              <div>
                <div style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4, letterSpacing:1, textTransform:"uppercase", marginBottom:3 }}>Member ID</div>
                <div style={{ fontFamily:"DM Sans", fontSize:13, color:T.txt }}>{patient.insurance_id}</div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Address / contact */}
      {(patient.address || patient.contact_number || patient.email) && (
        <Section title="Contact Information" color={T.txt4}>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {patient.address && (
              <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt2 }}>📍 {patient.address}</div>
            )}
            {patient.contact_number && (
              <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt2 }}>📞 {patient.contact_number}</div>
            )}
            {patient.email && (
              <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt2 }}>✉️ {patient.email}</div>
            )}
            {patient.emergency_contact && (
              <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt2 }}>🆘 {patient.emergency_contact}</div>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}

// ── NOTES TAB ─────────────────────────────────────────────────────────
function NotesTab({ notes, patient, navigate, onRefresh }) {
  const patientNotes = notes.filter(n =>
    n.patient_name === patient.patient_name ||
    n.patient_id === patient.patient_id ||
    n.patient_id === patient.id
  );

  return (
    <div className={`${PREFIX}-fade`} style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={() => navigate("/ClinicalNoteStudio")} style={{
          fontFamily:"DM Sans", fontWeight:700, fontSize:12,
          padding:"9px 18px", borderRadius:9, cursor:"pointer",
          border:`1px solid ${T.purple}40`, background:`${T.purple}10`, color:T.purple,
        }}>🖊️ New Note in Studio</button>
        <button onClick={onRefresh} style={{
          fontFamily:"DM Sans", fontWeight:600, fontSize:11,
          padding:"9px 14px", borderRadius:9, cursor:"pointer",
          border:"1px solid rgba(42,79,122,0.4)", background:"transparent", color:T.txt4,
        }}>↺ Refresh</button>
      </div>

      {patientNotes.length === 0 ? (
        <EmptyState icon="📝" title="No notes yet" sub="Create a note in the Clinical Note Studio" action="Open Note Studio" onAction={() => navigate("/ClinicalNoteStudio")}/>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {patientNotes.map(n => (
            <div key={n.id} style={{
              ...glass, padding:"14px 16px",
              borderLeft:`3px solid ${n.status === "finalized" ? T.teal : n.status === "amended" ? T.blue : T.orange}`,
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, flexWrap:"wrap" }}>
                <Badge color={n.status === "finalized" ? T.teal : T.orange}>
                  {(n.status || "DRAFT").toUpperCase()}
                </Badge>
                <Badge color={T.txt4}>{(n.note_type || "progress_note").replace(/_/g," ").toUpperCase()}</Badge>
                {n.date_of_visit && <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4 }}>{n.date_of_visit}</span>}
              </div>
              {n.chief_complaint && (
                <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt2, marginBottom:5 }}>
                  <strong style={{ color:T.txt4 }}>CC: </strong>{n.chief_complaint}
                </div>
              )}
              {n.assessment && (
                <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt3, lineHeight:1.55 }}>
                  <strong style={{ color:T.txt4 }}>Assessment: </strong>{n.assessment}
                </div>
              )}
              {n.plan && (
                <div style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt3, marginTop:5, lineHeight:1.55 }}>
                  <strong style={{ color:T.txt4 }}>Plan: </strong>{n.plan}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── RESULTS TAB ───────────────────────────────────────────────────────
function ResultsTab({ patient, results }) {
  const patientResults = results.filter(r => r.patient === patient.id);
  const criticals = patientResults.filter(r => r.flag === "critical" && !r.acknowledged);

  const flagColor = (flag) => flag === "critical" ? T.red : flag === "abnormal" ? T.gold : T.green;

  return (
    <div className={`${PREFIX}-fade`} style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {criticals.length > 0 && (
        <div style={{
          ...glass, padding:"10px 14px",
          borderLeft:`3px solid ${T.red}`, background:`${T.red}0b`,
          display:"flex", alignItems:"center", gap:10,
        }}>
          <span className={`${PREFIX}-pulse`} style={{ fontSize:14 }}>🚨</span>
          <span style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:13, color:T.red }}>
            {criticals.length} Unacknowledged Critical Value{criticals.length > 1 ? "s" : ""}
          </span>
        </div>
      )}

      {patientResults.length === 0 ? (
        <EmptyState icon="🔬" title="No results yet" sub="Orders are in progress or no results have been filed"/>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
          {patientResults.map(r => {
            const fc = flagColor(r.flag);
            return (
              <div key={r.id} style={{
                ...glass, padding:"10px 14px",
                display:"flex", alignItems:"center", gap:12,
                borderLeft:`3px solid ${r.acknowledged && r.flag === "critical" ? T.txt4 : fc}`,
                opacity: r.acknowledged && r.flag === "critical" ? 0.6 : 1,
              }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"DM Sans", fontWeight:600, fontSize:13, color:T.txt }}>{r.name}</div>
                  {r.ref_range && <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, marginTop:2 }}>Ref: {r.ref_range}</div>}
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontFamily:"JetBrains Mono", fontWeight:700, fontSize:14, color:fc }}>{r.value}</div>
                  {r.unit && <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4 }}>{r.unit}</div>}
                </div>
                <Badge color={r.acknowledged && r.flag === "critical" ? T.txt4 : fc}>
                  {r.acknowledged && r.flag === "critical" ? "ACKED" : (r.flag || "NORMAL").toUpperCase()}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── PLACEHOLDER TAB ───────────────────────────────────────────────────
function PlaceholderTab({ icon, title, route, navigate }) {
  return (
    <div className={`${PREFIX}-fade`}>
      <EmptyState
        icon={icon}
        title={title}
        sub="This section links to the relevant clinical tool"
        action={`Open ${title}`}
        onAction={() => navigate(route)}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════
export default function PatientWorkspace() {
  const navigate = useNavigate();

  // Read patient ID from URL if present
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedId = urlParams.get("patient");

  const [patients,        setPatients]        = useState([]);
  const [allNotes,        setAllNotes]        = useState([]);
  const [allResults,      setAllResults]      = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeTab,       setActiveTab]       = useState("overview");
  const [toast,           setToast]           = useState({ msg:"", err:false });

  function showToast(msg, err = false) {
    setToast({ msg, err });
    setTimeout(() => setToast({ msg:"", err:false }), 2400);
  }

  const fetchAll = useCallback(async () => {
    try {
      const [pts, nts, res] = await Promise.all([
        base44.entities.Patient.list("-created_date", 50),
        base44.entities.ClinicalNote.list("-updated_date", 100),
        base44.entities.ClinicalResult ? base44.entities.ClinicalResult.list() : Promise.resolve([]),
      ]);
      setPatients(pts || []);
      setAllNotes(nts || []);
      setAllResults(res || []);

      // Auto-select if URL param
      if (preselectedId && pts?.length) {
        const found = pts.find(p => p.id === preselectedId);
        if (found) setSelectedPatient(found);
      }
    } catch {
      showToast("Error loading patients", true);
    } finally {
      setLoading(false);
    }
  }, [preselectedId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const patientNotes = useMemo(() =>
    selectedPatient ? allNotes.filter(n =>
      n.patient_name === selectedPatient.patient_name ||
      n.patient_id === selectedPatient.patient_id ||
      n.patient_id === selectedPatient.id
    ) : [],
  [selectedPatient, allNotes]);

  // Vitals from latest note
  const vitals = useMemo(() => {
    const note = patientNotes[0];
    if (!note?.vital_signs) return {};
    const vs = note.vital_signs;
    return {
      bp:   vs.blood_pressure ? `${vs.blood_pressure.systolic}/${vs.blood_pressure.diastolic}` : null,
      hr:   vs.heart_rate?.value?.toString() || null,
      rr:   vs.respiratory_rate?.value?.toString() || null,
      spo2: vs.oxygen_saturation?.value?.toString() || null,
      temp: vs.temperature?.value?.toString() || null,
      gcs:  null,
    };
  }, [patientNotes]);

  const age = selectedPatient ? calcAge(selectedPatient.date_of_birth) : null;

  return (
    <div style={{
      background:T.bg, minHeight:"100vh", color:T.txt,
      fontFamily:"DM Sans, sans-serif", overflowX:"hidden", position:"relative",
    }}>
      <AmbientBg/>
      {toast.msg && <Toast msg={toast.msg} err={toast.err}/>}

      <div style={{ position:"relative", zIndex:1, display:"flex", minHeight:"100vh" }}>

        {/* ── LEFT SIDEBAR: Patient list ── */}
        <div style={{
          width:300, flexShrink:0, background:"rgba(5,10,20,0.9)",
          borderRight:"1px solid rgba(42,79,122,0.3)",
          display:"flex", flexDirection:"column", height:"100vh",
          position:"sticky", top:0,
        }}>
          {/* Sidebar header */}
          <div style={{
            padding:"14px 16px", borderBottom:"1px solid rgba(42,79,122,0.3)",
            display:"flex", alignItems:"center", gap:10, flexShrink:0,
          }}>
            <button onClick={() => navigate("/command-center")} style={{
              fontFamily:"DM Sans", fontSize:10, fontWeight:600,
              padding:"4px 10px", borderRadius:7, cursor:"pointer",
              border:"1px solid rgba(42,79,122,0.45)", background:"rgba(14,37,68,0.5)", color:T.txt4,
            }}>← Cmd</button>
            <div>
              <div className={`${PREFIX}-shim`} style={{
                fontFamily:"Playfair Display", fontWeight:900, fontSize:16, letterSpacing:-.5,
              }}>Patient Workspace</div>
              <div style={{ fontFamily:"DM Sans", fontSize:9, color:T.txt4 }}>
                {loading ? "Loading..." : `${patients.length} patients`}
              </div>
            </div>
          </div>

          {/* Patient list */}
          <div style={{ flex:1, overflowY:"auto", padding:"10px 12px" }}>
            {loading ? (
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} style={{
                    height:60, borderRadius:10, background:"rgba(14,37,68,0.5)",
                    animation:`${PREFIX}pulse 1.6s ease-in-out ${i*.1}s infinite`,
                  }}/>
                ))}
              </div>
            ) : (
              <PatientSearchPanel
                patients={patients}
                onSelect={p => { setSelectedPatient(p); setActiveTab("overview"); }}
              />
            )}
          </div>

          {/* Add patient */}
          <div style={{ padding:"10px 12px", borderTop:"1px solid rgba(42,79,122,0.25)", flexShrink:0 }}>
            <button onClick={() => navigate("/NewPatientInput")} style={{
              width:"100%", fontFamily:"DM Sans", fontWeight:700, fontSize:12,
              padding:"10px", borderRadius:9, cursor:"pointer",
              border:`1px solid ${T.teal}40`, background:`${T.teal}0e`, color:T.teal,
            }}>+ New Patient</button>
          </div>
        </div>

        {/* ── MAIN WORKSPACE ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:"100vh" }}>

          {/* No patient selected */}
          {!selectedPatient && (
            <div style={{
              flex:1, display:"flex", alignItems:"center", justifyContent:"center",
              flexDirection:"column", gap:16, padding:40,
            }}>
              <div style={{ fontSize:48 }}>👤</div>
              <div style={{ fontFamily:"Playfair Display", fontWeight:900, fontSize:24, color:T.txt3, textAlign:"center" }}>
                Select a patient to begin
              </div>
              <div style={{ fontFamily:"DM Sans", fontSize:13, color:T.txt4 }}>
                Choose from the left panel or create a new patient
              </div>
            </div>
          )}

          {selectedPatient && (
            <>
              {/* ── PATIENT HEADER ── */}
              <div style={{
                background:"rgba(5,10,20,0.9)", borderBottom:"1px solid rgba(42,79,122,0.3)",
                padding:"12px 20px", flexShrink:0,
                position:"sticky", top:0, zIndex:10,
              }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
                  {/* Identity */}
                  <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                    <div style={{
                      width:40, height:40, borderRadius:12, flexShrink:0,
                      background:"linear-gradient(135deg,rgba(0,229,192,0.2),rgba(59,158,255,0.1))",
                      border:"1px solid rgba(0,229,192,0.3)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontFamily:"Playfair Display", fontWeight:900, fontSize:16, color:T.teal,
                    }}>
                      {selectedPatient.patient_name?.[0] || "P"}
                    </div>
                    <div>
                      <div style={{ fontFamily:"Playfair Display", fontWeight:900, fontSize:17, color:T.txt }}>
                        {selectedPatient.patient_name}
                      </div>
                      <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, marginTop:1 }}>
                        {selectedPatient.patient_id && `MRN ${selectedPatient.patient_id} · `}
                        {age && `${age}y `}{selectedPatient.gender ? selectedPatient.gender[0].toUpperCase() : ""}
                      </div>
                    </div>
                  </div>

                  {/* Vitals strip */}
                  <div style={{ display:"flex", gap:6 }}>
                    {VITAL_DEFS.slice(0, 4).map(def => {
                      const val = vitals[def.key];
                      const abn = val && def.isAbnormal(val);
                      return (
                        <div key={def.key} style={{
                          padding:"4px 8px", borderRadius:8, textAlign:"center",
                          background: abn ? `${T.red}0f` : "rgba(14,37,68,0.6)",
                          border:`1px solid ${abn ? T.red+"30" : "rgba(42,79,122,0.3)"}`,
                        }}>
                          <div style={{ fontFamily:"JetBrains Mono", fontSize:12, fontWeight:700, color:abn ? T.red : T.teal, lineHeight:1 }}>
                            {val || "—"}
                          </div>
                          <div style={{ fontFamily:"DM Sans", fontSize:8, color:T.txt4, marginTop:1 }}>{def.label}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Allergy badge */}
                  {selectedPatient.allergies?.length > 0 && (
                    <div style={{
                      padding:"5px 12px", borderRadius:8,
                      background:`${T.red}0f`, border:`1px solid ${T.red}30`,
                    }}>
                      <div style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.red }}>
                        ⚠️ {selectedPatient.allergies.join(", ")}
                      </div>
                    </div>
                  )}

                  {/* Tool shortcut strip */}
                  <div style={{ display:"flex", gap:5 }}>
                    {TOOLS.map(t => (
                      <button
                        key={t.route}
                        onClick={() => navigate(t.route)}
                        className={`${PREFIX}-tool-btn`}
                        title={t.label}
                        style={{
                          width:32, height:32, borderRadius:8, cursor:"pointer",
                          border:`1px solid ${t.color}25`, background:`${t.color}0a`,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:14, transition:"all .15s",
                        }}
                      >{t.icon}</button>
                    ))}
                    <button onClick={() => setSelectedPatient(null)} style={{
                      width:32, height:32, borderRadius:8, cursor:"pointer",
                      border:"1px solid rgba(42,79,122,0.4)", background:"transparent",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:12, color:T.txt4, transition:"all .15s",
                    }}>✕</button>
                  </div>
                </div>
              </div>

              {/* ── VITALS ROW ── */}
              <div style={{
                background:"rgba(8,16,30,0.8)", borderBottom:"1px solid rgba(42,79,122,0.2)",
                padding:"10px 20px", flexShrink:0,
              }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:8 }}>
                  {VITAL_DEFS.map(def => (
                    <VitalCard key={def.key} def={def} value={vitals[def.key]}/>
                  ))}
                </div>
              </div>

              {/* ── TAB BAR ── */}
              <div style={{
                background:"rgba(5,10,20,0.95)", borderBottom:"1px solid rgba(42,79,122,0.25)",
                padding:"0 20px", flexShrink:0, display:"flex", gap:2, overflowX:"auto",
              }}>
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${PREFIX}-tab`}
                    style={{
                      fontFamily:"DM Sans", fontWeight:600, fontSize:11,
                      padding:"11px 14px", borderRadius:0, cursor:"pointer", whiteSpace:"nowrap",
                      border:"none", borderBottom:`2px solid ${activeTab === tab.id ? T.teal : "transparent"}`,
                      background:"transparent",
                      color: activeTab === tab.id ? T.teal : T.txt4,
                      transition:"all .12s",
                    }}
                  >{tab.icon} {tab.label}</button>
                ))}
              </div>

              {/* ── TAB CONTENT ── */}
              <div style={{ flex:1, overflowY:"auto", padding:"16px 20px" }}>
                {activeTab === "overview" && (
                  <OverviewTab patient={selectedPatient} notes={patientNotes} navigate={navigate}/>
                )}
                {activeTab === "chart" && (
                  <ChartTab patient={selectedPatient}/>
                )}
                {activeTab === "notes" && (
                  <NotesTab
                    notes={allNotes} patient={selectedPatient}
                    navigate={navigate} onRefresh={fetchAll}
                  />
                )}
                {activeTab === "orders" && (
                  <PlaceholderTab icon="⚡" title="Orders" route="/NewPatientInput?tab=orders" navigate={navigate}/>
                )}
                {activeTab === "results" && (
                  <ResultsTab patient={selectedPatient} results={allResults}/>
                )}
                {activeTab === "meds" && (
                  <PlaceholderTab icon="💊" title="Medications" route="/erx" navigate={navigate}/>
                )}
                {activeTab === "imaging" && (
                  <PlaceholderTab icon="🩻" title="Imaging" route="/radiology-hub" navigate={navigate}/>
                )}
                {activeTab === "procedures" && (
                  <PlaceholderTab icon="✂️" title="Procedures" route="/procedure-hub" navigate={navigate}/>
                )}
                {activeTab === "dispo" && (
                  <PlaceholderTab icon="🚪" title="Disposition" route="/DispositionBoard" navigate={navigate}/>
                )}
                {activeTab === "billing" && (
                  <PlaceholderTab icon="💰" title="Billing / MDM" route="/billing-submissions" navigate={navigate}/>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}