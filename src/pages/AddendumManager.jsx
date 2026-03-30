import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

// ─── Design Tokens ────────────────────────────────────────────────────────
const G = {
  navy:"#050f1e", slate:"#0b1d35", panel:"#0d2240", edge:"#162d4f",
  border:"#1e3a5f", muted:"#2a4d72", dim:"#4a7299", text:"#c8ddf0",
  bright:"#e8f4ff", teal:"#00d4bc", amber:"#f5a623", red:"#ff5c6c",
  green:"#2ecc71", purple:"#9b6dff", blue:"#4a90d9", rose:"#f472b6",
  gold:"#f0c040", orange:"#ff8c42", cyan:"#22d3ee",
};
const F = {
  display:"'Playfair Display', Georgia, serif",
  body:"'DM Sans','Segoe UI',sans-serif",
  mono:"'JetBrains Mono','Fira Code',monospace",
};

const ADDENDUM_TYPES = [
  { id:"addendum",    label:"Late-Entry Addendum",  icon:"📝", color:G.teal,   desc:"Add information discovered after signing" },
  { id:"amendment",   label:"Amendment",             icon:"✏️",  color:G.amber,  desc:"Correct an error in the original note" },
  { id:"attestation", label:"Attending Attestation", icon:"✅",  color:G.green,  desc:"Supervising physician attestation of resident note" },
  { id:"cosign",      label:"Co-Signature",          icon:"🤝",  color:G.purple, desc:"Required co-signature for billing or compliance" },
];

const AUDIT_ACTIONS = {
  created:          { label:"Created",          color:G.blue,   icon:"✦" },
  signed:           { label:"Signed",           color:G.green,  icon:"✓" },
  cosign_requested: { label:"Co-sign Requested",color:G.amber,  icon:"↗" },
  cosigned:         { label:"Co-signed",        color:G.purple, icon:"🤝" },
  rejected:         { label:"Rejected",         color:G.red,    icon:"✕" },
  amended:          { label:"Amended",          color:G.orange, icon:"✏" },
  viewed:           { label:"Viewed",           color:G.dim,    icon:"👁" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────
const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d) ? "—" : d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
};
const fmtDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d) ? "—" : d.toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});
};
const hoursAgo = (iso) => {
  const diff = (Date.now() - new Date(iso)) / 3600000;
  if(diff < 1) return `${Math.round(diff*60)}m ago`;
  if(diff < 24) return `${diff.toFixed(1)}h ago`;
  return `${Math.floor(diff/24)}d ago`;
};

// ─── Status Badge ─────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    signed:         { c:G.green,  label:"Signed" },
    pending_cosign: { c:G.amber,  label:"Awaiting Co-sign" },
    draft:          { c:G.blue,   label:"Draft" },
    rejected:       { c:G.red,    label:"Rejected" },
  }[status] || { c:G.dim, label:status };
  return (
    <span style={{
      fontFamily:F.mono, fontSize:"10px", fontWeight:700, letterSpacing:"0.07em",
      padding:"3px 8px", borderRadius:"10px",
      background:cfg.c+"1f", color:cfg.c, border:`1px solid ${cfg.c}40`,
    }}>{cfg.label}</span>
  );
}

// ─── Type Badge ───────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const cfg = ADDENDUM_TYPES.find(t=>t.id===type) || { icon:"📄", color:G.dim, label:type };
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:"5px",
      fontFamily:F.mono, fontSize:"10px", fontWeight:700, letterSpacing:"0.06em",
      padding:"3px 9px", borderRadius:"10px",
      background:cfg.color+"18", color:cfg.color, border:`1px solid ${cfg.color}35`,
    }}>
      {cfg.icon} {cfg.label || type.replace(/_/g," ").toUpperCase()}
    </span>
  );
}

// ─── Audit Trail ──────────────────────────────────────────────────────────
function AuditTrail({ entries }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"0" }}>
      {entries.map((e,i) => {
        const ac = AUDIT_ACTIONS[e.action] || { label:e.action, color:G.dim, icon:"•" };
        return (
          <div key={i} style={{ display:"flex", gap:"12px", position:"relative", paddingBottom:"12px" }}>
            {i<entries.length-1&&<div style={{ position:"absolute", left:"11px", top:"20px", bottom:0, width:"1px", background:G.border }}/>}
            <div style={{
              width:"22px", height:"22px", borderRadius:"50%", flexShrink:0,
              background:ac.color+"20", border:`1px solid ${ac.color}50`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"9px", color:ac.color, fontFamily:F.mono, fontWeight:700,
            }}>{ac.icon}</div>
            <div style={{ flex:1, paddingTop:"2px" }}>
              <div style={{ display:"flex", gap:"8px", alignItems:"center", flexWrap:"wrap" }}>
                <span style={{ fontFamily:F.body, fontSize:"12px", fontWeight:600, color:G.text }}>{ac.label}</span>
                <span style={{ fontFamily:F.mono, fontSize:"10px", color:G.dim }}>{e.by}</span>
              </div>
              <div style={{ fontFamily:F.mono, fontSize:"10px", color:G.muted, marginTop:"2px" }}>
                {fmtDateTime(e.at)} · {e.note}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Addendum Card ────────────────────────────────────────────────────────
function AddendumCard({ add, onCosign, isCurrentUser }) {
  const [expanded, setExpanded] = useState(false);
  const [showAudit, setShowAudit] = useState(false);

  return (
    <div style={{
      background:G.edge, border:`1px solid ${G.border}`,
      borderRadius:"10px", overflow:"hidden",
      borderLeft:`3px solid ${ADDENDUM_TYPES.find(t=>t.id===add.type)?.color||G.dim}`,
    }}>
      <div style={{
        padding:"11px 14px", display:"flex", alignItems:"center", gap:"10px",
        cursor:"pointer", background:expanded?G.panel+"80":"transparent",
      }} onClick={()=>setExpanded(v=>!v)}>
        <TypeBadge type={add.type}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:F.body, fontSize:"12px", color:G.dim, marginBottom:"1px" }}>
            {add.reason}
          </div>
          <div style={{ display:"flex", gap:"10px", alignItems:"center", flexWrap:"wrap" }}>
            <span style={{ fontFamily:F.mono, fontSize:"10px", color:G.dim }}>{add.author}</span>
            <span style={{ fontFamily:F.mono, fontSize:"10px", color:G.muted }}>·</span>
            <span style={{ fontFamily:F.mono, fontSize:"10px", color:G.muted }}>{fmtDateTime(add.createdAt)}</span>
            {add.lateEntry&&(
              <span style={{
                fontFamily:F.mono, fontSize:"9px", padding:"1px 6px", borderRadius:"8px",
                background:G.orange+"1a", color:G.orange, border:`1px solid ${G.orange}35`,
              }}>⏱ LATE +{add.hoursAfter}h</span>
            )}
          </div>
        </div>
        <StatusBadge status={add.status}/>
        <span style={{ color:G.dim, fontSize:"11px", flexShrink:0 }}>{expanded?"▴":"▾"}</span>
      </div>

      {expanded&&(
        <div style={{ padding:"0 14px 14px", borderTop:`1px solid ${G.border}` }}>
          <div style={{
            margin:"12px 0", padding:"12px", borderRadius:"8px",
            background:G.slate, border:`1px solid ${G.border}`,
            fontFamily:F.body, fontSize:"13px", color:G.text, lineHeight:1.7,
            whiteSpace:"pre-wrap",
          }}>{add.text}</div>

          {add.cosignRequired&&(
            <div style={{
              display:"flex", alignItems:"center", gap:"10px",
              padding:"10px 12px", borderRadius:"8px", marginBottom:"10px",
              background:add.cosignedBy?G.green+"0f":G.amber+"0f",
              border:`1px solid ${add.cosignedBy?G.green+"35":G.amber+"35"}`,
            }}>
              <span style={{ fontSize:"14px" }}>{add.cosignedBy?"✅":"⏳"}</span>
              <div>
                <div style={{ fontFamily:F.mono, fontSize:"10px", fontWeight:700,
                  color:add.cosignedBy?G.green:G.amber, letterSpacing:"0.07em" }}>
                  {add.cosignedBy?"CO-SIGNATURE COMPLETE":"CO-SIGNATURE REQUIRED"}
                </div>
                <div style={{ fontFamily:F.body, fontSize:"11px", color:G.dim, marginTop:"2px" }}>
                  {add.cosignedBy||add.cosignRequestedFrom}
                </div>
              </div>
              {!add.cosignedBy&&isCurrentUser&&(
                <button onClick={()=>onCosign(add)} style={{
                  marginLeft:"auto", padding:"6px 14px", borderRadius:"8px",
                  background:G.green+"20", border:`1px solid ${G.green}50`,
                  color:G.green, fontFamily:F.body, fontSize:"12px", fontWeight:700, cursor:"pointer",
                }}>Sign Now</button>
              )}
            </div>
          )}

          <button onClick={()=>setShowAudit(v=>!v)} style={{
            background:"transparent", border:`1px solid ${G.border}`, borderRadius:"8px",
            padding:"6px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:"6px",
            fontFamily:F.mono, fontSize:"10px", color:G.dim, marginBottom:showAudit?"10px":0,
          }}>
            <span>🕐</span> {showAudit?"Hide":"Show"} Audit Trail ({add.auditLog?.length||0} events)
          </button>

          {showAudit&&add.auditLog&&<AuditTrail entries={add.auditLog}/>}
        </div>
      )}
    </div>
  );
}

// ─── Note Row ─────────────────────────────────────────────────────────────
function NoteRow({ note, onSelectNote, isSelected }) {
  const addenda = note.section_references || [];
  const hasOpen = addenda.some(a=>a.status==="pending_cosign");
  return (
    <div onClick={()=>onSelectNote(note)} style={{
      padding:"12px 14px", cursor:"pointer", borderBottom:`1px solid ${G.border}`,
      background:isSelected?G.panel+"dd":"transparent",
      borderLeft:isSelected?`3px solid ${G.teal}`:"3px solid transparent",
      transition:"all 0.12s",
    }}
    onMouseEnter={e=>{if(!isSelected)e.currentTarget.style.background=G.edge;}}
    onMouseLeave={e=>{if(!isSelected)e.currentTarget.style.background="transparent";}}
    >
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"5px" }}>
        <div style={{ display:"flex", gap:"7px", alignItems:"center", flexWrap:"wrap" }}>
          <span style={{
            fontFamily:F.mono, fontSize:"10px", padding:"2px 7px", borderRadius:"8px",
            background:G.blue+"1a", color:G.blue, border:`1px solid ${G.blue}35`,
          }}>{note.note_type||"Note"}</span>
          {hasOpen&&<div style={{ width:"7px", height:"7px", borderRadius:"50%", background:G.amber, animation:"pulse 1.5s infinite" }}/>}
        </div>
        <span style={{ fontFamily:F.mono, fontSize:"10px", color:G.muted, flexShrink:0 }}>{fmtDate(note.date_of_visit)}</span>
      </div>
      <div style={{ fontFamily:F.body, fontSize:"13px", fontWeight:600, color:G.bright, marginBottom:"3px" }}>
        {note.patient_name} <span style={{ color:G.muted, fontWeight:400, fontSize:"11px" }}>{note.patient_id}</span>
      </div>
      <div style={{ fontFamily:F.body, fontSize:"11px", color:G.dim, marginBottom:"5px" }}>{note.created_by}</div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontFamily:F.body, fontSize:"11px", color:G.muted }}>
          {addenda.length===0?"No addenda":`${addenda.length} addend${addenda.length===1?"um":"a"}`}
        </span>
        {hasOpen&&<span style={{ fontFamily:F.mono, fontSize:"9px", color:G.amber }}>⏳ PENDING</span>}
      </div>
    </div>
  );
}

// ─── New Addendum Modal ───────────────────────────────────────────────────
function NewAddendumModal({ note, onClose, onSubmit, currentUser }) {
  const [type, setType] = useState("addendum");
  const [reason, setReason] = useState("");
  const [text, setText] = useState("");
  const [requireCosign, setRequireCosign] = useState(false);
  const [cosignFrom, setCosignFrom] = useState("");
  const [isAIGen, setIsAIGen] = useState(false);

  const generateAI = async () => {
    if(!text||text.length<10) return;
    setIsAIGen(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Notrya AI helping a physician write a clinical note ${type}. Based on the physician's key points, generate a professional, compliant ${type} text.

Note type being amended: ${note.note_type}
Patient: ${note.patient_name}
Original note preview: ${note.summary}

Physician's key points:
${text}

Addendum/Amendment type: ${type}
Reason: ${reason}

Generate a professional, medico-legally sound ${type} paragraph. Be concise, factual, and use appropriate medical language. For amendments, clearly state what is being corrected. For attestations, follow standard attending attestation language.`,
      });
      const txt = typeof result === "string" ? result : result.data || "";
      setText(txt);
    } catch { }
    finally { setIsAIGen(false); }
  };

  return (
    <div style={{
      position:"fixed", inset:0, background:"#000000bb",
      backdropFilter:"blur(4px)", zIndex:1000,
      display:"flex", alignItems:"center", justifyContent:"center", padding:"20px",
    }}>
      <div style={{
        width:"100%", maxWidth:"640px", maxHeight:"90vh", overflowY:"auto",
        background:G.panel, border:`1px solid ${G.border}`, borderRadius:"16px",
        boxShadow:`0 24px 60px ${G.navy}cc`,
      }}>
        <div style={{ padding:"20px 24px", borderBottom:`1px solid ${G.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <h2 style={{ fontFamily:F.display, fontSize:"20px", color:G.bright, margin:0 }}>Add to Note</h2>
            <p style={{ fontFamily:F.body, fontSize:"12px", color:G.dim, margin:"3px 0 0" }}>
              {note.note_type} · {note.patient_name} · {fmtDate(note.date_of_visit)}
            </p>
          </div>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:G.dim, cursor:"pointer", fontSize:"20px" }}>✕</button>
        </div>

        <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:"16px" }}>
          <div>
            <label style={{ fontFamily:F.mono, fontSize:"10px", color:G.dim, letterSpacing:"0.1em", display:"block", marginBottom:"8px" }}>
              ENTRY TYPE
            </label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"7px" }}>
              {ADDENDUM_TYPES.map(t=>(
                <div key={t.id} onClick={()=>setType(t.id)} style={{
                  padding:"10px 12px", borderRadius:"10px", cursor:"pointer",
                  background:type===t.id?t.color+"18":G.edge,
                  border:`1px solid ${type===t.id?t.color+"55":G.border}`,
                  transition:"all 0.12s",
                }}>
                  <div style={{ display:"flex", gap:"7px", alignItems:"center", marginBottom:"3px" }}>
                    <span style={{ fontSize:"14px" }}>{t.icon}</span>
                    <span style={{ fontFamily:F.body, fontSize:"12px", fontWeight:700, color:type===t.id?t.color:G.text }}>{t.label}</span>
                  </div>
                  <p style={{ fontFamily:F.body, fontSize:"11px", color:G.dim, margin:0 }}>{t.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontFamily:F.mono, fontSize:"10px", color:G.dim, letterSpacing:"0.1em", display:"block", marginBottom:"6px" }}>
              REASON / TITLE *
            </label>
            <input value={reason} onChange={e=>setReason(e.target.value)}
              placeholder="e.g. Late entry — lab results received after signing"
              style={{ width:"100%", background:G.edge, border:`1px solid ${G.border}`, borderRadius:"8px",
                padding:"9px 12px", color:G.text, fontFamily:F.body, fontSize:"13px",
                outline:"none", boxSizing:"border-box" }}/>
          </div>

          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
              <label style={{ fontFamily:F.mono, fontSize:"10px", color:G.dim, letterSpacing:"0.1em" }}>
                CONTENT *
              </label>
              <button onClick={generateAI} disabled={isAIGen||!text} style={{
                padding:"4px 10px", borderRadius:"7px", background:G.purple+"18",
                border:`1px solid ${G.purple}45`, color:G.purple, fontFamily:F.mono,
                fontSize:"10px", cursor:isAIGen||!text?"not-allowed":"pointer", fontWeight:700,
                opacity:!text?0.4:1,
              }}>{isAIGen?"✦ Drafting…":"✦ Polish with AI"}</button>
            </div>
            <textarea value={text} onChange={e=>setText(e.target.value)}
              placeholder="Enter the addendum text, or type key points and use AI to polish..."
              rows={6} style={{ width:"100%", background:G.edge, border:`1px solid ${G.border}`,
                borderRadius:"8px", padding:"10px 12px", color:G.text, fontFamily:F.body,
                fontSize:"13px", lineHeight:1.7, resize:"vertical", outline:"none", boxSizing:"border-box" }}/>
          </div>

          <div style={{
            padding:"12px 14px", borderRadius:"10px",
            background:requireCosign?G.purple+"0f":G.edge,
            border:`1px solid ${requireCosign?G.purple+"40":G.border}`,
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontFamily:F.body, fontSize:"13px", fontWeight:600, color:G.text }}>Require Co-signature</div>
                <div style={{ fontFamily:F.body, fontSize:"11px", color:G.dim, marginTop:"2px" }}>Request attending or supervisor sign-off</div>
              </div>
              <div onClick={()=>setRequireCosign(v=>!v)} style={{
                width:"40px", height:"22px", borderRadius:"11px", cursor:"pointer",
                background:requireCosign?G.purple:G.muted, position:"relative", transition:"all 0.2s",
              }}>
                <div style={{
                  width:"16px", height:"16px", borderRadius:"50%", background:G.bright,
                  position:"absolute", top:"3px", transition:"all 0.2s",
                  left:requireCosign?"21px":"3px",
                }}/>
              </div>
            </div>
            {requireCosign&&(
              <input value={cosignFrom} onChange={e=>setCosignFrom(e.target.value)}
                placeholder="Co-signer name / role…"
                style={{ marginTop:"10px", width:"100%", background:G.slate, border:`1px solid ${G.border}`,
                  borderRadius:"7px", padding:"8px 10px", color:G.text, fontFamily:F.body,
                  fontSize:"12px", outline:"none", boxSizing:"border-box" }}/>
            )}
          </div>

          <div style={{
            padding:"10px 12px", borderRadius:"8px",
            background:G.amber+"0a", border:`1px solid ${G.amber}25`,
            fontFamily:F.body, fontSize:"11px", color:G.dim, lineHeight:1.6,
          }}>
            ⚖️ By signing this entry, I attest that this {type} accurately reflects information pertaining to the care of this patient. All addenda are time-stamped and permanently appended to the original note in compliance with institutional policy.
          </div>

          <div style={{ display:"flex", gap:"10px" }}>
            <button onClick={onClose} style={{
              flex:1, background:G.muted+"18", border:`1px solid ${G.border}`, borderRadius:"10px",
              padding:"10px", cursor:"pointer", fontFamily:F.body, fontSize:"13px", color:G.dim,
            }}>Cancel</button>
            <button
              disabled={!reason||!text}
              onClick={()=>onSubmit({ type, reason, text, requireCosign, cosignFrom })}
              style={{
                flex:2, background:`linear-gradient(135deg,${G.teal}22,${G.blue}18)`,
                border:`1px solid ${G.teal}50`, borderRadius:"10px",
                padding:"10px", cursor:(!reason||!text)?"not-allowed":"pointer",
                fontFamily:F.body, fontSize:"13px", fontWeight:700, color:G.teal,
                opacity:(!reason||!text)?0.4:1,
              }}>✓ Sign &amp; Append</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Full Audit Panel ─────────────────────────────────────────────────────
function FullAuditPanel({ notes }) {
  const allEvents = notes.flatMap(n =>
    (n.section_references || []).flatMap(a =>
      (a.auditLog || []).map(e => ({ ...e, noteId:n.id, noteType:n.note_type, patient:n.patient_name, addType:a.type, addReason:a.reason }))
    )
  ).sort((a,b) => new Date(b.at) - new Date(a.at));

  const [filterType, setFilterType] = useState("all");
  const filtered = filterType==="all" ? allEvents : allEvents.filter(e=>e.action===filterType);

  return (
    <div>
      <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"16px" }}>
        {["all","created","signed","cosign_requested","cosigned","rejected"].map(f=>(
          <button key={f} onClick={()=>setFilterType(f)} style={{
            padding:"4px 10px", borderRadius:"10px", border:"none", cursor:"pointer",
            fontFamily:F.mono, fontSize:"9px", fontWeight:filterType===f?700:400, letterSpacing:"0.06em",
            background:filterType===f?G.teal:G.edge, color:filterType===f?G.navy:G.dim,
          }}>{f.replace(/_/g," ").toUpperCase()}</button>
        ))}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
        {filtered.length===0&&<p style={{ color:G.muted, fontSize:"13px", textAlign:"center", padding:"20px" }}>No events found</p>}
        {filtered.map((e,i)=>{
          const ac = AUDIT_ACTIONS[e.action]||{ label:e.action, color:G.dim, icon:"•" };
          return (
            <div key={i} style={{
              display:"flex", gap:"12px", alignItems:"flex-start",
              padding:"10px 12px", borderRadius:"9px",
              background:G.edge, border:`1px solid ${G.border}`,
              borderLeft:`3px solid ${ac.color}60`,
            }}>
              <div style={{
                width:"26px", height:"26px", borderRadius:"50%", flexShrink:0,
                background:ac.color+"1a", border:`1px solid ${ac.color}40`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"10px", color:ac.color, fontFamily:F.mono,
              }}>{ac.icon}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:"8px" }}>
                  <span style={{ fontFamily:F.body, fontSize:"13px", fontWeight:600, color:G.text }}>{ac.label}</span>
                  <span style={{ fontFamily:F.mono, fontSize:"10px", color:G.muted, flexShrink:0 }}>{fmtDateTime(e.at)}</span>
                </div>
                <div style={{ fontFamily:F.mono, fontSize:"10px", color:G.dim, marginTop:"2px" }}>
                  {e.by} · {e.noteType} · {e.patient}
                </div>
                <div style={{ fontFamily:F.body, fontSize:"11px", color:G.muted, marginTop:"2px" }}>{e.note}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function AddendumManager() {
  const { data: allNotes = [], isLoading } = useQuery({
    queryKey: ["ClinicalNote"],
    queryFn: () => base44.entities.ClinicalNote.list("-updated_date", 100),
  });

  const [selectedNote, setSelectedNote] = useState(null);
  const [activeTab, setActiveTab] = useState("addenda");
  const [showModal, setShowModal] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [searchQ, setSearchQ] = useState("");
  const [pendingOnly, setPendingOnly] = useState(false);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    setNotes(allNotes.map(n => ({
      ...n,
      section_references: n.section_references || [],
      pendingCosign: (n.section_references || []).some(a => a.status === "pending_cosign"),
    })));
  }, [allNotes]);

  useEffect(() => {
    if(allNotes.length > 0 && !selectedNote) {
      setSelectedNote(allNotes[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allNotes]);

  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch {}
    };
    getUser();
  }, []);

  const toast = (msg, type = "info") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };

  const handleSubmit = (data) => {
    const now = new Date().toISOString();
    const newAdd = {
      id: `add-${Date.now()}`,
      noteId: selectedNote.id,
      type: data.type,
      author: currentUser?.full_name || "Current User",
      authorId: currentUser?.id || "current-user",
      createdAt: now,
      status: data.requireCosign ? "pending_cosign" : "signed",
      reason: data.reason,
      text: data.text,
      lateEntry: selectedNote.date_of_visit ? (Date.now() - new Date(selectedNote.date_of_visit)) / 3600000 > 1 : false,
      hoursAfter: selectedNote.date_of_visit ? Math.round((Date.now() - new Date(selectedNote.date_of_visit)) / 3600000 * 10) / 10 : 0,
      cosignRequired: data.requireCosign,
      cosignedBy: null,
      cosignRequestedFrom: data.cosignFrom || null,
      cosignRequestedAt: data.requireCosign ? now : null,
      auditLog: [
        { action: "created", by: currentUser?.full_name || "Current User", at: now, note: "Addendum created" },
        ...(!data.requireCosign ? [{ action: "signed", by: currentUser?.full_name || "Current User", at: now, note: "Signed and appended" }] : [
          { action: "cosign_requested", by: currentUser?.full_name || "Current User", at: now, note: `Co-sign requested from ${data.cosignFrom}` }
        ]),
      ],
    };
    setNotes(prev => prev.map(n => n.id === selectedNote.id
      ? { ...n, section_references: [...(n.section_references || []), newAdd], pendingCosign: data.requireCosign || n.pendingCosign }
      : n
    ));
    setSelectedNote(prev => ({ ...prev, section_references: [...(prev?.section_references || []), newAdd] }));
    setShowModal(false);
    toast(`${data.type} signed and appended`, "success");
  };

  const handleCosign = (add) => {
    const now = new Date().toISOString();
    setNotes(prev => prev.map(n => ({
      ...n, section_references: (n.section_references || []).map(a => a.id === add.id ? {
        ...a, status: "signed", cosignedBy: currentUser?.full_name || "Current User",
        auditLog: [...(a.auditLog || []), { action: "cosigned", by: currentUser?.full_name || "Current User", at: now, note: "Co-signature applied" }],
      } : a),
      pendingCosign: (n.section_references || []).filter(a => a.id !== add.id).some(a => a.status === "pending_cosign"),
    })));
    setSelectedNote(prev => ({
      ...prev,
      section_references: (prev?.section_references || []).map(a => a.id === add.id ? { ...a, status: "signed", cosignedBy: currentUser?.full_name || "Current User" } : a),
    }));
    toast("Co-signature applied", "success");
  };

  const totalPending = notes.reduce((s, n) => s + (n.section_references || []).filter(a => a.status === "pending_cosign").length, 0);
  const totalAddenda = notes.reduce((s, n) => s + (n.section_references || []).length, 0);

  const filteredNotes = notes.filter(n => {
    const q = searchQ.toLowerCase();
    const matchQ = !q || n.patient_name?.toLowerCase().includes(q) || n.created_by?.toLowerCase().includes(q) || n.patient_id?.toLowerCase().includes(q) || n.note_type?.toLowerCase().includes(q);
    const matchPending = !pendingOnly || n.pendingCosign;
    return matchQ && matchPending;
  });

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: G.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: G.text, fontSize: "18px" }}>Loading clinical notes...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: G.navy, fontFamily: F.body, position: "relative" }}>
      <div style={{
        height: "54px", background: G.slate, borderBottom: `1px solid ${G.border}`,
        display: "flex", alignItems: "center", padding: "0 20px", gap: "14px",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <span style={{ fontFamily: F.display, fontSize: "18px", color: G.bright, letterSpacing: "-0.01em" }}>Notrya</span>
        <span style={{ color: G.border }}>|</span>
        <span style={{ fontFamily: F.mono, fontSize: "11px", color: G.amber, letterSpacing: "0.08em" }}>ADDENDUM &amp; AMENDMENT MANAGER</span>
        <div style={{ flex: 1 }} />
        {totalPending > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: "7px",
            padding: "4px 12px", borderRadius: "20px",
            background: G.amber + "1a", border: `1px solid ${G.amber}45`,
          }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: G.amber, animation: "pulse 1.2s infinite" }} />
            <span style={{ fontFamily: F.mono, fontSize: "11px", color: G.amber, fontWeight: 700 }}>
              {totalPending} PENDING CO-SIGN
            </span>
          </div>
        )}
      </div>

      <div style={{
        background: G.slate, borderBottom: `1px solid ${G.border}`,
        padding: "14px 20px", display: "flex", alignItems: "center", gap: "16px",
      }}>
        <div style={{
          width: "42px", height: "42px", borderRadius: "10px",
          background: `linear-gradient(135deg,${G.amber}22,${G.orange}18)`,
          border: `1px solid ${G.amber}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px",
        }}>📋</div>
        <div>
          <h1 style={{ fontFamily: F.display, fontSize: "22px", color: G.bright, margin: 0, letterSpacing: "-0.02em" }}>
            Addendum &amp; Amendment Manager
          </h1>
          <p style={{ fontFamily: F.body, fontSize: "12px", color: G.dim, margin: 0 }}>
            Late entries · Attestations · Co-sign workflows · Full compliance audit trail
          </p>
        </div>
        <div style={{ flex: 1 }} />
        {[
          { label: "Notes", val: notes.length, c: G.blue },
          { label: "Addenda", val: totalAddenda, c: G.teal },
          { label: "Pending", val: totalPending, c: G.amber },
        ].map(s => (
          <div key={s.label} style={{
            textAlign: "center", padding: "8px 16px", borderRadius: "10px",
            background: G.panel, border: `1px solid ${s.val > 0 && s.label === "Pending" ? G.amber + "40" : G.border}`,
          }}>
            <div style={{ fontFamily: F.mono, fontSize: "20px", fontWeight: 700, color: s.c }}>{s.val}</div>
            <div style={{ fontFamily: F.body, fontSize: "10px", color: G.dim }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 54px - 70px)" }}>
        <div style={{ width: "280px", flexShrink: 0, background: G.panel, borderRight: `1px solid ${G.border}`, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 14px", borderBottom: `1px solid ${G.border}` }}>
            <input placeholder="Search notes, patients…" value={searchQ} onChange={e => setSearchQ(e.target.value)}
              style={{
                width: "100%", background: G.edge, border: `1px solid ${G.border}`, borderRadius: "8px",
                padding: "8px 11px", color: G.text, fontFamily: F.body, fontSize: "12px",
                outline: "none", boxSizing: "border-box", marginBottom: "8px"
              }} />
            <button onClick={() => setPendingOnly(v => !v)} style={{
              width: "100%", padding: "7px", borderRadius: "8px", cursor: "pointer",
              background: pendingOnly ? G.amber + "18" : G.edge, border: `1px solid ${pendingOnly ? G.amber + "50" : G.border}`,
              color: pendingOnly ? G.amber : G.dim, fontFamily: F.mono, fontSize: "10px", fontWeight: pendingOnly ? 700 : 400,
              letterSpacing: "0.07em",
            }}>⏳ {pendingOnly ? "SHOW ALL" : "PENDING ONLY"}</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filteredNotes.length === 0 && (
              <p style={{ textAlign: "center", color: G.muted, fontSize: "13px", padding: "24px" }}>No notes found</p>
            )}
            {filteredNotes.map(n => (
              <NoteRow key={n.id} note={n} onSelectNote={setSelectedNote} isSelected={selectedNote?.id === n.id} />
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {!selectedNote ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontFamily: F.body, fontSize: "14px", color: G.muted }}>Select a note to view addenda</p>
            </div>
          ) : (
            <>
              <div style={{ padding: "16px 20px", background: G.panel, borderBottom: `1px solid ${G.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px", flexWrap: "wrap" }}>
                      <span style={{
                        fontFamily: F.mono, fontSize: "10px", padding: "2px 8px", borderRadius: "8px",
                        background: G.blue + "1a", color: G.blue, border: `1px solid ${G.blue}35`,
                      }}>{selectedNote.note_type || "Note"}</span>
                      <StatusBadge status={selectedNote.status || "draft"} />
                    </div>
                    <h2 style={{ fontFamily: F.display, fontSize: "18px", color: G.bright, margin: "0 0 4px", letterSpacing: "-0.01em" }}>
                      {selectedNote.patient_name}
                      <span style={{ fontFamily: F.mono, fontSize: "12px", color: G.dim, fontWeight: 400, marginLeft: "10px" }}>
                        {selectedNote.patient_id}
                      </span>
                    </h2>
                    <div style={{ fontFamily: F.body, fontSize: "12px", color: G.dim }}>
                      {selectedNote.created_by} · {fmtDateTime(selectedNote.created_date)}
                    </div>
                  </div>
                  <button onClick={() => setShowModal(true)} style={{
                    display: "flex", alignItems: "center", gap: "7px",
                    padding: "9px 16px", borderRadius: "10px",
                    background: `linear-gradient(135deg,${G.amber}20,${G.orange}14)`,
                    border: `1px solid ${G.amber}50`, color: G.amber,
                    fontFamily: F.body, fontSize: "13px", fontWeight: 700, cursor: "pointer",
                    flexShrink: 0,
                  }}>+ Add Addendum</button>
                </div>

                <div style={{
                  marginTop: "12px", padding: "10px 14px", borderRadius: "8px",
                  background: G.edge, border: `1px solid ${G.border}`,
                  fontFamily: F.body, fontSize: "12px", color: G.dim, lineHeight: 1.6,
                }}>
                  <span style={{ fontFamily: F.mono, fontSize: "9px", color: G.muted, letterSpacing: "0.08em" }}>ORIGINAL NOTE PREVIEW  </span>
                  {selectedNote.summary || "No summary available"}
                </div>

                <div style={{ display: "flex", gap: "4px", marginTop: "14px" }}>
                  {[
                    { id: "addenda", label: `Addenda (${(selectedNote.section_references || []).length})` },
                    { id: "audit", label: "Full Audit Trail" },
                  ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                      padding: "7px 14px", border: "none", background: "transparent",
                      borderBottom: activeTab === tab.id ? `2px solid ${G.amber}` : "2px solid transparent",
                      color: activeTab === tab.id ? G.bright : G.dim,
                      fontFamily: F.body, fontSize: "13px", fontWeight: activeTab === tab.id ? 600 : 400,
                      cursor: "pointer", letterSpacing: "0.01em",
                    }}>{tab.label}</button>
                  ))}
                </div>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
                {activeTab === "addenda" && (
                  <>
                    {(selectedNote.section_references || []).length === 0 && (
                      <div style={{ textAlign: "center", padding: "40px 20px" }}>
                        <div style={{ fontSize: "36px", marginBottom: "12px" }}>📝</div>
                        <p style={{ fontFamily: F.body, fontSize: "13px", color: G.muted }}>No addenda for this note yet.</p>
                        <button onClick={() => setShowModal(true)} style={{
                          marginTop: "12px", padding: "8px 18px", borderRadius: "10px",
                          background: G.amber + "18", border: `1px solid ${G.amber}45`, color: G.amber,
                          fontFamily: F.body, fontSize: "13px", cursor: "pointer", fontWeight: 600,
                        }}>+ Add First Addendum</button>
                      </div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {(selectedNote.section_references || []).map(add => (
                        <AddendumCard key={add.id} add={add}
                          onCosign={handleCosign}
                          isCurrentUser={true}
                        />
                      ))}
                    </div>
                  </>
                )}
                {activeTab === "audit" && (
                  <AuditTrail entries={(selectedNote.section_references || []).flatMap(a => a.auditLog || [])} />
                )}
              </div>
            </>
          )}
        </div>

        <div style={{ width: "294px", flexShrink: 0, background: G.panel, borderLeft: `1px solid ${G.border}`, display: "flex", flexDirection: "column", overflowY: "auto" }}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${G.border}` }}>
            <p style={{ fontFamily: F.mono, fontSize: "10px", color: G.amber, letterSpacing: "0.1em", margin: "0 0 10px" }}>
              ⏳ PENDING CO-SIGNATURES
            </p>
            {totalPending === 0 ? (
              <div style={{
                padding: "10px", borderRadius: "8px", background: G.green + "0f",
                border: `1px solid ${G.green}30`, textAlign: "center",
                fontFamily: F.body, fontSize: "12px", color: G.green,
              }}>✓ All caught up</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                {notes.flatMap(n => (n.section_references || []).filter(a => a.status === "pending_cosign").map(a => ({ ...a, notePt: n.patient_name, noteType: n.note_type, noteId: n.id }))).map(a => (
                  <div key={a.id} style={{
                    padding: "10px 12px", borderRadius: "9px",
                    background: G.amber + "0f", border: `1px solid ${G.amber}30`,
                  }}>
                    <div style={{ fontFamily: F.body, fontSize: "12px", fontWeight: 600, color: G.text, marginBottom: "3px" }}>
                      {a.notePt}
                    </div>
                    <div style={{ fontFamily: F.mono, fontSize: "10px", color: G.amber, marginBottom: "4px" }}>
                      {a.noteType} · {a.type}
                    </div>
                    <div style={{ fontFamily: F.body, fontSize: "11px", color: G.dim, marginBottom: "8px" }}>
                      Requested from: {a.cosignRequestedFrom}
                    </div>
                    <button onClick={() => {
                      setSelectedNote(notes.find(n => n.id === a.noteId));
                      handleCosign(a);
                    }} style={{
                      width: "100%", padding: "6px", borderRadius: "7px",
                      background: G.green + "1a", border: `1px solid ${G.green}45`, color: G.green,
                      fontFamily: F.body, fontSize: "11px", fontWeight: 700, cursor: "pointer",
                    }}>Sign Now</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${G.border}` }}>
            <p style={{ fontFamily: F.mono, fontSize: "10px", color: G.dim, letterSpacing: "0.1em", margin: "0 0 10px" }}>
              📊 COMPLIANCE SUMMARY
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              {[
                { label: "Late Entries (>24h)", val: notes.flatMap(n => n.section_references || []).filter(a => a.hoursAfter > 24).length, c: G.red, warn: true },
                { label: "Late Entries (1–24h)", val: notes.flatMap(n => n.section_references || []).filter(a => a.hoursAfter >= 1 && a.hoursAfter <= 24).length, c: G.amber },
                { label: "Amendments", val: notes.flatMap(n => n.section_references || []).filter(a => a.type === "amendment").length, c: G.orange },
                { label: "Attestations", val: notes.flatMap(n => n.section_references || []).filter(a => a.type === "attestation").length, c: G.green },
                { label: "Co-signs Complete", val: notes.flatMap(n => n.section_references || []).filter(a => a.cosignRequired && a.cosignedBy).length, c: G.teal },
              ].map(s => (
                <div key={s.label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "7px 10px", borderRadius: "8px",
                  background: s.warn && s.val > 0 ? G.red + "0a" : G.edge,
                  border: `1px solid ${s.warn && s.val > 0 ? G.red + "30" : G.border}`,
                }}>
                  <span style={{ fontFamily: F.body, fontSize: "11px", color: G.dim }}>{s.label}</span>
                  <span style={{ fontFamily: F.mono, fontSize: "14px", fontWeight: 700, color: s.c }}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: "14px 16px", flex: 1 }}>
            <p style={{ fontFamily: F.mono, fontSize: "10px", color: G.dim, letterSpacing: "0.1em", margin: "0 0 10px" }}>
              🕐 GLOBAL AUDIT FEED
            </p>
            <FullAuditPanel notes={notes} />
          </div>
        </div>
      </div>

      {showModal && selectedNote && (
        <NewAddendumModal note={selectedNote} onClose={() => setShowModal(false)} onSubmit={handleSubmit} currentUser={currentUser} />
      )}

      <div style={{ position: "fixed", bottom: "20px", right: "20px", display: "flex", flexDirection: "column", gap: "7px", zIndex: 9999 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: t.type === "success" ? G.green + "1f" : t.type === "error" ? G.red + "1f" : G.blue + "1f",
            border: `1px solid ${t.type === "success" ? G.green + "55" : t.type === "error" ? G.red + "55" : G.blue + "55"}`,
            color: t.type === "success" ? G.green : t.type === "error" ? G.red : G.text,
            padding: "10px 16px", borderRadius: "10px", fontFamily: F.body, fontSize: "13px",
            backdropFilter: "blur(8px)", animation: "slideIn 0.2s ease",
            boxShadow: `0 4px 20px ${G.navy}80`,
          }}>{t.msg}</div>
        ))}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes slideIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#1e3a5f; border-radius:3px; }
      `}</style>
    </div>
  );
}