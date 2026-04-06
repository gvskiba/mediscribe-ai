import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const PREFIX = "ptb";

(() => {
  const fontId = `${PREFIX}-fonts`;
  if (document.getElementById(fontId)) return;
  const l = document.createElement("link");
  l.id = fontId; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = `${PREFIX}-css`;
  s.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    ::-webkit-scrollbar { width: 3px; height: 3px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(42,79,122,.5); border-radius: 2px; }
    @keyframes ${PREFIX}fade { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
    @keyframes ${PREFIX}shim { 0%,100% { background-position:-200% center } 50% { background-position:200% center } }
    @keyframes ${PREFIX}orb0 { 0%,100% { transform:translate(-50%,-50%) scale(1) }    50% { transform:translate(-50%,-50%) scale(1.1)  } }
    @keyframes ${PREFIX}orb1 { 0%,100% { transform:translate(-50%,-50%) scale(1.07) } 50% { transform:translate(-50%,-50%) scale(.92)   } }
    @keyframes ${PREFIX}orb2 { 0%,100% { transform:translate(-50%,-50%) scale(.95) }  50% { transform:translate(-50%,-50%) scale(1.09)  } }
    @keyframes ${PREFIX}pulse { 0%,100% { opacity:1 } 50% { opacity:0.35 } }
    .${PREFIX}-fade  { animation: ${PREFIX}fade .22s ease both; }
    .${PREFIX}-shim  {
      background: linear-gradient(90deg,#f2f7ff 0%,#fff 25%,#00e5c0 50%,#3b9eff 75%,#f2f7ff 100%);
      background-size: 250% auto;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: ${PREFIX}shim 6s linear infinite;
    }
    .${PREFIX}-pulse { animation: ${PREFIX}pulse 2s ease-in-out infinite; }
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", red:"#ff4444", coral:"#ff6b6b",
  green:"#3dffa0", blue:"#3b9eff", purple:"#9b6dff", orange:"#ff9f43",
};

const glass = {
  backdropFilter:"blur(20px) saturate(180%)", WebkitBackdropFilter:"blur(20px) saturate(180%)",
  background:"rgba(8,22,40,0.78)", border:"1px solid rgba(42,79,122,0.35)", borderRadius:14,
};

const STATUS = {
  critical:{ label:"CRITICAL",  color:T.red    },
  results: { label:"RESULTS ▶", color:T.blue   },
  pending: { label:"PENDING",   color:T.gold   },
  stable:  { label:"STABLE",    color:T.teal   },
  waiting: { label:"WAITING",   color:T.txt4   },
};

const FLAG = {
  critical:{ color:T.red,   label:"CRIT" },
  abnormal:{ color:T.gold,  label:"ABN"  },
  normal:  { color:T.green, label:"WNL"  },
};

const NOTIF_TYPES = {
  critical_status:  { icon:"🚨", color:"#ff4444", label:"Critical Status"   },
  new_result:       { icon:"🔬", color:"#3b9eff", label:"New Result"        },
  critical_result:  { icon:"⚠️", color:"#ff4444", label:"Critical Result"   },
  unsigned_note:    { icon:"📝", color:"#ff9f43", label:"Unsigned Note"     },
  status_change:    { icon:"🔄", color:"#9b6dff", label:"Status Changed"    },
  new_patient:      { icon:"🏥", color:"#00e5c0", label:"New Patient"       },
};

function diffPatients(prev, next) {
  const alerts = [];
  const prevMap = Object.fromEntries(prev.map(p => [p.id, p]));
  next.forEach(p => {
    const old = prevMap[p.id];
    if (!old) {
      alerts.push({ id:`${p.id}-new`, patientId:p.id, patientName:p.patient_name, type:"new_patient", message:`${p.patient_name} admitted — ${p.cc}` });
      return;
    }
    if (old.status !== p.status) {
      alerts.push({ id:`${p.id}-st-${Date.now()}`, patientId:p.id, patientName:p.patient_name, type: p.status==="critical" ? "critical_status" : "status_change", message:`${p.patient_name}: status changed to ${p.status.toUpperCase()}` });
    }
    if (!old.noteDraft && p.noteDraft) {
      alerts.push({ id:`${p.id}-note-${Date.now()}`, patientId:p.id, patientName:p.patient_name, type:"unsigned_note", message:`${p.patient_name}: note requires signature` });
    }
    if (p.results.length > old.results.length) {
      const newCrit = p.results.slice(old.results.length).filter(r => r.flag==="critical");
      if (newCrit.length) {
        alerts.push({ id:`${p.id}-crit-${Date.now()}`, patientId:p.id, patientName:p.patient_name, type:"critical_result", message:`${p.patient_name}: CRITICAL result — ${newCrit[0].name}` });
      } else {
        alerts.push({ id:`${p.id}-res-${Date.now()}`, patientId:p.id, patientName:p.patient_name, type:"new_result", message:`${p.patient_name}: new result available` });
      }
    }
  });
  return alerts;
}

function NotificationPanel({ notifications, onDismiss, onDismissAll, onPatientClick, onClose }) {
  const unread = notifications.filter(n => !n.read);
  return (
    <div style={{ position:"fixed", top:0, right:0, bottom:0, width:340, zIndex:2000, display:"flex", flexDirection:"column", background:"rgba(5,10,20,0.97)", backdropFilter:"blur(24px)", borderLeft:"1px solid rgba(42,79,122,0.5)", boxShadow:"-12px 0 48px rgba(0,0,0,0.6)" }}>
      <div style={{ padding:"16px", borderBottom:"1px solid rgba(42,79,122,0.4)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontFamily:"JetBrains Mono", fontSize:11, fontWeight:700, color:T.txt, letterSpacing:2 }}>ALERTS</span>
          {unread.length > 0 && (
            <span style={{ fontFamily:"JetBrains Mono", fontSize:10, fontWeight:700, background:T.red, color:"#fff", borderRadius:20, padding:"2px 8px" }}>{unread.length}</span>
          )}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {notifications.length > 0 && (
            <button onClick={onDismissAll} style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4, background:"none", border:"none", cursor:"pointer" }}>Clear all</button>
          )}
          <button onClick={onClose} style={{ background:"rgba(42,79,122,0.3)", border:"1px solid rgba(42,79,122,0.5)", borderRadius:7, color:T.txt3, cursor:"pointer", fontFamily:"DM Sans", fontSize:13, fontWeight:600, padding:"3px 10px" }}>✕</button>
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"10px 12px", display:"flex", flexDirection:"column", gap:6 }}>
        {notifications.length === 0 && (
          <div style={{ textAlign:"center", padding:"40px 0", display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:28 }}>✅</span>
            <span style={{ fontFamily:"DM Sans", fontSize:13, color:T.txt3 }}>No active alerts</span>
          </div>
        )}
        {notifications.map(n => {
          const nt = NOTIF_TYPES[n.type] || NOTIF_TYPES.status_change;
          return (
            <div key={n.id} onClick={() => { onPatientClick(n.patientId); onClose(); }} style={{ background: n.read ? "rgba(8,22,40,0.5)" : `${nt.color}0f`, border:`1px solid ${n.read ? "rgba(42,79,122,0.25)" : nt.color+"35"}`, borderLeft:`3px solid ${n.read ? "rgba(42,79,122,0.3)" : nt.color}`, borderRadius:10, padding:"10px 12px", cursor:"pointer", display:"flex", alignItems:"flex-start", gap:10, opacity:n.read?0.55:1, transition:"all .15s" }}>
              <span style={{ fontSize:16, flexShrink:0, lineHeight:1.4 }}>{nt.icon}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:"DM Sans", fontWeight:n.read?500:700, fontSize:12, color:n.read?T.txt3:T.txt, lineHeight:1.4 }}>{n.message}</div>
                <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, marginTop:3 }}>{new Date(n.timestamp).toLocaleTimeString()}</div>
              </div>
              <button onClick={e => { e.stopPropagation(); onDismiss(n.id); }} style={{ background:"none", border:"none", color:T.txt4, cursor:"pointer", fontSize:12, flexShrink:0, padding:"2px" }}>✕</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NotifBell({ count, onClick }) {
  return (
    <button onClick={onClick} style={{ position:"relative", background:count>0?`${T.red}14`:"rgba(14,37,68,0.6)", border:`1px solid ${count>0?T.red+"50":"rgba(42,79,122,0.5)"}`, borderRadius:8, padding:"5px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:6, transition:"all .15s" }}>
      <span style={{ fontSize:14, lineHeight:1 }}>{count>0 ? "🔔" : "🔕"}</span>
      {count > 0 && <span style={{ fontFamily:"JetBrains Mono", fontSize:10, fontWeight:700, color:T.red }}>{count}</span>}
      {count > 0 && <span className={`${PREFIX}-pulse`} style={{ position:"absolute", top:4, right:4, width:6, height:6, borderRadius:"50%", background:T.red }} />}
    </button>
  );
}

function AmbientBg() {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
      {[
        { l:"10%", t:"15%", r:300, c:"rgba(0,229,192,0.055)"   },
        { l:"88%", t:"10%", r:260, c:"rgba(59,158,255,0.050)"  },
        { l:"78%", t:"78%", r:340, c:"rgba(155,109,255,0.040)" },
        { l:"18%", t:"80%", r:220, c:"rgba(245,200,66,0.040)"  },
      ].map((o, i) => (
        <div key={i} style={{ position:"absolute", left:o.l, top:o.t, width:o.r*2, height:o.r*2, borderRadius:"50%", background:`radial-gradient(circle,${o.c} 0%,transparent 68%)`, transform:"translate(-50%,-50%)", animation:`${PREFIX}orb${i%3} ${8+i*1.3}s ease-in-out infinite` }}/>
      ))}
    </div>
  );
}

function StatTile({ value, label, sub, color }) {
  return (
    <div style={{ ...glass, padding:"9px 13px", borderRadius:10, borderLeft:`3px solid ${color}`, background:`linear-gradient(135deg,${color}12,rgba(8,22,40,0.8))` }}>
      <div style={{ fontFamily:"JetBrains Mono", fontSize:13, fontWeight:700, color, lineHeight:1 }}>{value}</div>
      <div style={{ fontFamily:"DM Sans", fontWeight:600, color:T.txt, fontSize:10, margin:"3px 0" }}>{label}</div>
      {sub && <div style={{ fontFamily:"DM Sans", fontSize:9, color:T.txt4 }}>{sub}</div>}
    </div>
  );
}

function Toast({ msg }) {
  return (
    <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", background:"rgba(8,22,40,0.96)", border:"1px solid rgba(0,229,192,0.4)", borderRadius:10, padding:"10px 20px", fontFamily:"DM Sans", fontWeight:600, fontSize:13, color:T.teal, zIndex:99999, pointerEvents:"none", animation:`${PREFIX}fade .2s ease both` }}>{msg}</div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ ...glass, height:175, borderRadius:14, background:"linear-gradient(135deg,rgba(14,37,68,0.5),rgba(8,22,40,0.3))", animation:`${PREFIX}pulse 1.8s ease-in-out infinite` }}/>
  );
}

function QuickBtn({ icon, label, count, color, onClick }) {
  const c = color || T.teal;
  return (
    <button onClick={onClick} style={{ flex:"1 1 auto", display:"flex", alignItems:"center", justifyContent:"center", gap:4, fontFamily:"DM Sans", fontWeight:600, fontSize:11, padding:"5px 8px", borderRadius:8, cursor:"pointer", border:`1px solid ${c}2e`, background:`${c}0e`, color:c, transition:"all .12s" }}>
      <span style={{ fontSize:11 }}>{icon}</span>
      <span>{label}</span>
      {count > 0 && <span style={{ background:c, color:"#050f1e", borderRadius:20, padding:"1px 5px", fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, lineHeight:"14px" }}>{count}</span>}
    </button>
  );
}

function PatientCard({ patient, onNote, onOrders, onResults, onStudio, hasUnread }) {
  const st   = STATUS[patient.status] || STATUS.waiting;
  const pend = patient.orders.filter(o => o.status === "pending");
  const crit = patient.results.filter(r => r.flag === "critical" && !r.acknowledged);
  const mins = patient.arrived;
  const arrTxt = mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}h ${mins%60}m`;

  return (
    <div className={`${PREFIX}-fade`} style={{ ...glass, padding:0, overflow:"hidden", borderLeft:`3px solid ${st.color}`, position:"relative", boxShadow: hasUnread ? `0 0 0 2px ${T.red}60, 0 4px 24px ${T.red}18` : undefined }}>
      {patient.status === "critical" && (
        <div className={`${PREFIX}-pulse`} style={{ position:"absolute", inset:0, pointerEvents:"none", background:`radial-gradient(ellipse at 20% 20%,${T.red}0b 0%,transparent 65%)` }}/>
      )}
      <div style={{ padding:"10px 12px 8px", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
          <span style={{ fontFamily:"JetBrains Mono", fontSize:22, fontWeight:700, color:st.color, lineHeight:1, minWidth:28 }}>{patient.room}</span>
          <div>
            <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:13, color:T.txt, lineHeight:1.2 }}>{patient.cc}</div>
            <div style={{ fontFamily:"DM Sans", fontSize:10, color:T.txt4, marginTop:1 }}>{patient.age}{patient.sex} · {arrTxt} ago</div>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3, flexShrink:0 }}>
          <span style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, padding:"2px 7px", borderRadius:20, background:`${st.color}18`, border:`1px solid ${st.color}40`, color:st.color, letterSpacing:.5 }}>{st.label}</span>
          {patient.noteDraft && <span style={{ fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, padding:"2px 6px", borderRadius:20, background:`${T.orange}13`, border:`1px solid ${T.orange}36`, color:T.orange }}>NOTE DRAFT</span>}
        </div>
      </div>
      <div style={{ borderTop:"1px solid rgba(42,79,122,0.28)", padding:"6px 12px", display:"flex", gap:8 }}>
        <div style={{ flex:1, display:"flex", alignItems:"center", gap:5 }}>
          <span style={{ fontSize:10 }}>🩺</span>
          <span style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt2, fontWeight:500 }}>{patient.provider}</span>
        </div>
        <div style={{ flex:1, display:"flex", alignItems:"center", gap:5 }}>
          <span style={{ fontSize:10 }}>👩‍⚕️</span>
          <span style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt3 }}>{patient.nurse}</span>
        </div>
      </div>
      {pend.length > 0 && (
        <div style={{ borderTop:"1px solid rgba(42,79,122,0.28)", padding:"5px 12px", display:"flex", flexWrap:"wrap", gap:4 }}>
          {pend.map(o => (
            <span key={o.id} style={{ fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, padding:"2px 7px", borderRadius:20, background:`${T.gold}0f`, border:`1px solid ${T.gold}30`, color:T.gold }}>
              {o.urgency === "stat" ? "⚡ " : "· "}{o.name}
            </span>
          ))}
        </div>
      )}
      <div style={{ borderTop:"1px solid rgba(42,79,122,0.28)", padding:"7px 10px", display:"flex", gap:5 }}>
        <QuickBtn icon="📝" label="Note"    color={patient.noteDraft ? T.orange : T.teal} onClick={onNote}    />
        <QuickBtn icon="⚡" label="Orders"  color={T.gold}  count={pend.length}           onClick={onOrders}  />
        <QuickBtn icon="🔬" label="Results" color={crit.length > 0 ? T.red : T.blue} count={patient.results.length} onClick={onResults} />
        <QuickBtn icon="🖊️" label="Studio"  color={T.purple}                              onClick={onStudio}  />
      </div>
    </div>
  );
}

function NotePanel({ patient, onSignNote, onStudio }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {[
        { key:"hpi",        label:"HPI",       color:T.teal },
        { key:"assessment", label:"ASSESSMENT", color:T.gold },
        { key:"plan",       label:"PLAN",       color:T.blue },
      ].map(({ key, label, color }) => (
        <div key={key} style={{ ...glass, padding:"12px 14px", borderLeft:`3px solid ${color}`, background:`${color}07` }}>
          <div style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color, letterSpacing:2, textTransform:"uppercase", marginBottom:7 }}>{label}</div>
          <p style={{ fontFamily:"DM Sans", fontSize:13, color:T.txt2, lineHeight:1.65 }}>
            {patient.note[key] || <span style={{ color:T.txt4, fontStyle:"italic" }}>Not yet documented</span>}
          </p>
        </div>
      ))}
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={onStudio} style={{ flex:1, fontFamily:"DM Sans", fontWeight:700, fontSize:12, padding:"10px", borderRadius:9, cursor:"pointer", border:`1px solid ${T.purple}40`, background:`${T.purple}10`, color:T.purple }}>🖊️ Open Note Studio</button>
        {patient.noteDraft && (
          <button onClick={() => onSignNote(patient.id)} style={{ flex:1, fontFamily:"DM Sans", fontWeight:700, fontSize:12, padding:"10px", borderRadius:9, cursor:"pointer", border:`1px solid ${T.green}40`, background:`${T.green}10`, color:T.green }}>✅ Sign Note</button>
        )}
      </div>
    </div>
  );
}

function OrdersPanel({ patient, onAddOrder }) {
  const [showForm,   setShowForm]   = useState(false);
  const [newName,    setNewName]    = useState("");
  const [newUrgency, setNewUrgency] = useState("routine");
  const [submitting, setSubmitting] = useState(false);
  const pend     = patient.orders.filter(o => o.status === "pending");
  const resulted = patient.orders.filter(o => o.status !== "pending");

  async function submitOrder() {
    if (!newName.trim()) return;
    setSubmitting(true);
    await onAddOrder(patient.id, newName.trim(), newUrgency);
    setNewName(""); setNewUrgency("routine"); setShowForm(false); setSubmitting(false);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {pend.length > 0 && (
        <div>
          <div style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.gold, letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>Pending Orders</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {pend.map(o => (
              <div key={o.id} style={{ ...glass, padding:"10px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", borderLeft:`3px solid ${T.gold}`, background:`${T.gold}09` }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span className={`${PREFIX}-pulse`} style={{ display:"inline-block", width:7, height:7, borderRadius:"50%", background:T.gold, flexShrink:0 }}/>
                  <span style={{ fontFamily:"DM Sans", fontWeight:600, fontSize:13, color:T.txt }}>{o.name}</span>
                </div>
                <span style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, padding:"2px 8px", borderRadius:20, background:o.urgency==="stat"?`${T.red}14`:`${T.txt4}14`, border:`1px solid ${o.urgency==="stat"?T.red:T.txt4}36`, color:o.urgency==="stat"?T.red:T.txt4 }}>{o.urgency.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {resulted.length > 0 && (
        <div>
          <div style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.txt4, letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>Resulted</div>
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            {resulted.map(o => (
              <div key={o.id} style={{ ...glass, padding:"8px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(8,22,40,0.5)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ color:T.green, fontSize:10 }}>✓</span>
                  <span style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt3 }}>{o.name}</span>
                </div>
                <span style={{ fontFamily:"JetBrains Mono", fontSize:8, color:T.txt4 }}>{o.urgency.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {showForm ? (
        <div style={{ ...glass, padding:"12px", display:"flex", flexDirection:"column", gap:8 }}>
          <div style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, color:T.blue, letterSpacing:2, textTransform:"uppercase", marginBottom:2 }}>New Order</div>
          <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Order name (e.g. CBC, CT Head w/o)"
            style={{ background:"rgba(14,37,68,0.8)", border:`1px solid ${newName?T.blue+"55":"rgba(42,79,122,0.4)"}`, borderRadius:8, padding:"8px 12px", fontFamily:"DM Sans", fontSize:12, color:T.txt, outline:"none", width:"100%" }}
          />
          <div style={{ display:"flex", gap:6 }}>
            {["stat","routine"].map(u => (
              <button key={u} onClick={() => setNewUrgency(u)} style={{ flex:1, fontFamily:"JetBrains Mono", fontSize:9, fontWeight:700, padding:"6px", borderRadius:8, cursor:"pointer", textTransform:"uppercase", letterSpacing:1, border:`1px solid ${newUrgency===u?(u==="stat"?T.red:T.teal)+"55":"rgba(42,79,122,0.35)"}`, background:newUrgency===u?`${u==="stat"?T.red:T.teal}14`:"transparent", color:newUrgency===u?(u==="stat"?T.red:T.teal):T.txt3 }}>{u}</button>
            ))}
          </div>
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={submitOrder} disabled={!newName.trim()||submitting} style={{ flex:2, fontFamily:"DM Sans", fontWeight:700, fontSize:12, padding:"9px", borderRadius:8, cursor:newName.trim()&&!submitting?"pointer":"not-allowed", border:`1px solid ${T.blue}40`, background:newName.trim()?`${T.blue}14`:"rgba(14,37,68,0.4)", color:newName.trim()?T.blue:T.txt4 }}>
              {submitting ? "Ordering..." : "Place Order"}
            </button>
            <button onClick={() => { setShowForm(false); setNewName(""); }} style={{ flex:1, fontFamily:"DM Sans", fontWeight:600, fontSize:12, padding:"9px", borderRadius:8, cursor:"pointer", border:"1px solid rgba(42,79,122,0.4)", background:"transparent", color:T.txt4 }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:12, padding:"11px", borderRadius:9, cursor:"pointer", border:`1px solid ${T.blue}40`, background:`${T.blue}10`, color:T.blue }}>+ Add Order</button>
      )}
    </div>
  );
}

function ResultsPanel({ patient, onAcknowledge }) {
  const unackedCrits = patient.results.filter(r => r.flag === "critical" && !r.acknowledged);
  if (!patient.results.length) {
    return (
      <div style={{ ...glass, padding:"36px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:28 }}>⏳</span>
        <span style={{ fontFamily:"DM Sans", fontSize:13, color:T.txt3 }}>No results yet</span>
        <span style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4 }}>Orders are in progress</span>
      </div>
    );
  }
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {unackedCrits.length > 0 && (
        <div style={{ ...glass, padding:"9px 14px", background:`${T.red}0f`, borderLeft:`3px solid ${T.red}`, display:"flex", alignItems:"center", gap:8 }}>
          <span className={`${PREFIX}-pulse`} style={{ fontSize:14 }}>🚨</span>
          <span style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:12, color:T.red }}>{unackedCrits.length} Unacknowledged Critical Value{unackedCrits.length>1?"s":""}</span>
        </div>
      )}
      {patient.results.map(r => {
        const f = FLAG[r.flag] || FLAG.normal;
        const isAcked = r.acknowledged && r.flag === "critical";
        return (
          <div key={r.id} style={{ ...glass, padding:"10px 14px", display:"flex", alignItems:"center", gap:10, borderLeft:`3px solid ${isAcked?T.txt4:f.color}`, background:`${f.color}09`, opacity:isAcked?0.6:1 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"DM Sans", fontWeight:600, fontSize:13, color:T.txt }}>{r.name}</div>
              {r.ref_range && <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, marginTop:2 }}>Ref: {r.ref_range}</div>}
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:"JetBrains Mono", fontSize:12, fontWeight:700, color:f.color }}>{r.value}</div>
              {r.unit && <div style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4 }}>{r.unit}</div>}
            </div>
            <span style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, padding:"2px 7px", borderRadius:20, background:`${f.color}1a`, border:`1px solid ${f.color}40`, color:f.color, flexShrink:0 }}>{isAcked?"ACKED":f.label}</span>
          </div>
        );
      })}
      {unackedCrits.length > 0 && (
        <button onClick={() => onAcknowledge(patient.id)} style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:12, padding:"10px", borderRadius:9, cursor:"pointer", border:`1px solid ${T.red}40`, background:`${T.red}12`, color:T.red }}>🚨 Acknowledge Critical Values</button>
      )}
    </div>
  );
}

function PatientModal({ patient, initialTab, onClose, onToast, onSignNote, onAddOrder, onAcknowledge, onStudio }) {
  const [tab, setTab] = useState(initialTab || "note");
  const st     = STATUS[patient.status] || STATUS.waiting;
  const pendCt = patient.orders.filter(o => o.status === "pending").length;
  const resCt  = patient.results.length;
  const critCt = patient.results.filter(r => r.flag === "critical" && !r.acknowledged).length;

  const MODAL_TABS = [
    { id:"note",    icon:"📝", label:"Note",    color:patient.noteDraft?T.orange:T.teal, badge:patient.noteDraft?"DRAFT":null, count:0      },
    { id:"orders",  icon:"⚡", label:"Orders",  color:T.gold,                             badge:null,                           count:pendCt },
    { id:"results", icon:"🔬", label:"Results", color:critCt>0?T.red:T.blue,             badge:null,                           count:resCt  },
  ];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(3,8,18,0.88)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }} onClick={onClose}>
      <div style={{ ...glass, width:"100%", maxWidth:520, maxHeight:"88vh", overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:`0 24px 80px rgba(0,0,0,0.7),0 0 40px ${st.color}14`, borderColor:`${st.color}28` }} onClick={e => e.stopPropagation()}>
        <div style={{ padding:"14px 16px 10px", borderBottom:"1px solid rgba(42,79,122,0.35)", display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:10 }}>
            <span style={{ fontFamily:"JetBrains Mono", fontSize:24, fontWeight:700, color:st.color, lineHeight:1 }}>Rm {patient.room}</span>
            <div>
              <div style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:15, color:T.txt }}>{patient.cc}</div>
              <div style={{ fontFamily:"DM Sans", fontSize:11, color:T.txt4 }}>{patient.age}{patient.sex} · {patient.provider} · {patient.nurse}</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button onClick={onStudio} style={{ fontFamily:"DM Sans", fontWeight:600, fontSize:11, padding:"4px 10px", borderRadius:7, cursor:"pointer", border:`1px solid ${T.purple}40`, background:`${T.purple}12`, color:T.purple }}>🖊️ Studio</button>
            <span style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, padding:"2px 8px", borderRadius:20, background:`${st.color}18`, border:`1px solid ${st.color}44`, color:st.color, flexShrink:0 }}>{st.label}</span>
            <button onClick={onClose} style={{ background:"rgba(42,79,122,0.28)", border:"1px solid rgba(42,79,122,0.5)", borderRadius:8, color:T.txt3, cursor:"pointer", fontFamily:"DM Sans", fontSize:13, fontWeight:600, padding:"4px 10px" }}>✕</button>
          </div>
        </div>
        <div style={{ ...glass, margin:"10px 12px 0", padding:"4px", display:"flex", gap:4, borderRadius:10, flexShrink:0 }}>
          {MODAL_TABS.map(mt => (
            <button key={mt.id} onClick={() => setTab(mt.id)} style={{ flex:1, fontFamily:"DM Sans", fontWeight:600, fontSize:12, padding:"8px 6px", borderRadius:8, cursor:"pointer", border:`1px solid ${tab===mt.id?mt.color+"55":"transparent"}`, background:tab===mt.id?`${mt.color}16`:"transparent", color:tab===mt.id?mt.color:T.txt3, display:"flex", alignItems:"center", justifyContent:"center", gap:5, transition:"all .12s" }}>
              <span>{mt.icon}</span>
              <span>{mt.label}</span>
              {mt.count > 0 && <span style={{ fontFamily:"JetBrains Mono", fontSize:8, fontWeight:700, background:mt.color, color:"#050f1e", borderRadius:20, padding:"1px 5px" }}>{mt.count}</span>}
              {mt.badge && <span style={{ fontFamily:"JetBrains Mono", fontSize:7, fontWeight:700, background:`${T.orange}1a`, color:T.orange, borderRadius:20, padding:"1px 5px", border:`1px solid ${T.orange}38` }}>{mt.badge}</span>}
            </button>
          ))}
        </div>
        <div className={`${PREFIX}-fade`} style={{ flex:1, overflowY:"auto", padding:"12px" }}>
          {tab==="note"    && <NotePanel    patient={patient} onSignNote={onSignNote} onStudio={onStudio}/>}
          {tab==="orders"  && <OrdersPanel  patient={patient} onAddOrder={onAddOrder}/>}
          {tab==="results" && <ResultsPanel patient={patient} onAcknowledge={onAcknowledge}/>}
        </div>
      </div>
    </div>
  );
}

export default function TrackingBoard() {
  const navigate = useNavigate();
  const [patients,        setPatients]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [lastFetch,       setLastFetch]       = useState(null);
  const [boardView,       setBoardView]       = useState("all");
  const [currentProvider, setCurrentProvider] = useState("");
  const [modal,           setModal]           = useState(null);
  const [toast,           setToast]           = useState("");
  const [notifications,   setNotifications]   = useState([]);
  const [showNotifPanel,  setShowNotifPanel]  = useState(false);
  const prevPatientsRef = useRef([]);

  const fetchAll = useCallback(async () => {
    try {
      const [pts, notes] = await Promise.all([
        base44.entities.Patient.list(),
        base44.entities.ClinicalNote.list(),
      ]);
      const enriched = pts.map(p => ({
        ...p,
        room:      p.patient_id || "—",
        cc:        p.chronic_conditions?.[0] || "Unknown CC",
        age:       p.date_of_birth ? `${new Date().getFullYear() - new Date(p.date_of_birth).getFullYear()}` : "—",
        sex:       p.gender ? p.gender[0].toUpperCase() : "",
        provider:  p.created_by || "Unassigned",
        nurse:     "Unassigned",
        status:    "waiting",
        arrived:   Math.round((Date.now() - new Date(p.created_date)) / 60000),
        orders:    [],
        results:   [],
        note:      notes.find(n => n.patient_id === p.id || n.patient_name === p.patient_name) ?? { hpi:"", assessment:"", plan:"" },
        noteDraft: !(notes.find(n => n.patient_id === p.id)?.status === "finalized"),
      }));
      if (prevPatientsRef.current.length > 0) {
        const newAlerts = diffPatients(prevPatientsRef.current, enriched);
        if (newAlerts.length > 0) {
          setNotifications(prev => [
            ...newAlerts.map(a => ({ ...a, timestamp: Date.now(), read: false })),
            ...prev,
          ].slice(0, 50));
        }
      }
      prevPatientsRef.current = enriched;
      setPatients(enriched);
      setLastFetch(new Date());
    } catch (err) {
      console.error("TrackBoard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  useEffect(() => {
    if (!currentProvider && patients.length > 0) setCurrentProvider(patients[0].provider);
  }, [patients, currentProvider]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }, []);

  const handleSignNote = useCallback(async (patientId) => {
    try {
      const notes = await base44.entities.ClinicalNote.filter({ patient_id: patientId });
      if (notes.length) await base44.entities.ClinicalNote.update(notes[0].id, { status: "finalized" });
      showToast("Note signed!"); fetchAll();
    } catch { showToast("Error signing note"); }
  }, [fetchAll, showToast]);

  const handleAddOrder = useCallback(async (patientId, name) => {
    showToast(`${name} ordered`); fetchAll();
  }, [fetchAll, showToast]);

  const handleAcknowledge = useCallback(async () => {
    showToast("Critical values acknowledged"); fetchAll();
  }, [fetchAll, showToast]);

  const openStudio = useCallback((patient) => {
    navigate("/ClinicalNoteStudio", {
      state: {
        patientData: {
          demo: { firstName: patient.patient_name?.split(" ")[0] || "", lastName: patient.patient_name?.split(" ").slice(1).join(" ") || "", age: patient.age, sex: patient.sex, mrn: patient.patient_id || "" },
          cc: { text: patient.cc }, vitals: {}, medications: patient.medications || [], allergies: patient.allergies || [],
          esiLevel: "", registration: { room: patient.room },
        },
      },
    });
  }, [navigate]);

  const openModal = useCallback((patient, tab) => {
    setModal({ patient, tab });
    setNotifications(prev => prev.map(n => n.patientId === patient.id ? { ...n, read:true } : n));
  }, []);

  const dismissNotif    = useCallback((id) => setNotifications(prev => prev.filter(n => n.id !== id)), []);
  const dismissAllNotif = useCallback(() => setNotifications([]), []);
  const unreadCount     = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const goToPatient = useCallback((patientId) => {
    const p = patients.find(x => x.id === patientId);
    if (p) openModal(p, "note");
  }, [patients, openModal]);

  const PROVIDERS = useMemo(() => [...new Set(patients.map(p => p.provider))].filter(Boolean).sort(), [patients]);

  const visible = useMemo(() => {
    if (boardView === "mine")    return patients.filter(p => p.provider === currentProvider);
    if (boardView === "pending") return patients.filter(p => p.orders.some(o => o.status === "pending") || p.noteDraft);
    return patients;
  }, [boardView, currentProvider, patients]);

  const sorted = useMemo(() => {
    const rank = { critical:0, results:1, pending:2, stable:3, waiting:4 };
    return [...visible].sort((a, b) => (rank[a.status] ?? 4) - (rank[b.status] ?? 4));
  }, [visible]);

  const stats = useMemo(() => ({
    total:    patients.length,
    critical: patients.filter(p => p.status === "critical").length,
    pending:  patients.filter(p => p.orders.some(o => o.status === "pending")).length,
    mine:     patients.filter(p => p.provider === currentProvider).length,
  }), [patients, currentProvider]);

  const BOARD_TABS = [
    { id:"all",     icon:"🏥", label:"All Patients" },
    { id:"mine",    icon:"👤", label:"My Board"     },
    { id:"pending", icon:"⏳", label:"Pending"      },
  ];

  return (
    <div style={{ fontFamily:"DM Sans, sans-serif", background:T.bg, minHeight:"100vh", position:"relative", overflowX:"hidden", color:T.txt }}>
      <AmbientBg/>
      {toast && <Toast msg={toast}/>}
      {modal && (
        <PatientModal
          patient={modal.patient} initialTab={modal.tab}
          onClose={() => setModal(null)} onToast={showToast}
          onSignNote={handleSignNote} onAddOrder={handleAddOrder}
          onAcknowledge={handleAcknowledge}
          onStudio={() => { setModal(null); openStudio(modal.patient); }}
        />
      )}
      {showNotifPanel && (
        <NotificationPanel notifications={notifications} onDismiss={dismissNotif} onDismissAll={dismissAllNotif} onPatientClick={goToPatient} onClose={() => setShowNotifPanel(false)} />
      )}

      <div style={{ position:"relative", zIndex:1, maxWidth:1400, margin:"0 auto", padding:"0 16px" }}>
        <div style={{ padding:"18px 0 14px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <div style={{ backdropFilter:"blur(40px)", background:"rgba(5,15,30,0.9)", border:"1px solid rgba(42,79,122,0.6)", borderRadius:10, padding:"5px 12px", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.gold, letterSpacing:3 }}>NOTRYA</span>
              <span style={{ color:T.txt4, fontFamily:"JetBrains Mono", fontSize:10 }}>/</span>
              <span style={{ fontFamily:"JetBrains Mono", fontSize:10, color:T.txt3, letterSpacing:2 }}>TRACKBOARD</span>
            </div>
            <div style={{ height:1, flex:1, background:"linear-gradient(90deg,rgba(0,229,192,0.5),transparent)" }}/>
            <div style={{ display:"flex", gap:6 }}>
              <button onClick={() => navigate("/NewPatientInput")} style={{ fontFamily:"DM Sans", fontWeight:600, fontSize:11, padding:"5px 14px", borderRadius:8, cursor:"pointer", border:`1px solid ${T.teal}40`, background:`${T.teal}10`, color:T.teal }}>+ New Patient</button>
              <button onClick={() => navigate("/ClinicalNoteStudio")} style={{ fontFamily:"DM Sans", fontWeight:600, fontSize:11, padding:"5px 14px", borderRadius:8, cursor:"pointer", border:`1px solid ${T.purple}40`, background:`${T.purple}10`, color:T.purple }}>🖊️ Note Studio</button>
              <button onClick={() => navigate("/DispositionBoard")} style={{ fontFamily:"DM Sans", fontWeight:600, fontSize:11, padding:"5px 14px", borderRadius:8, cursor:"pointer", border:`1px solid ${T.teal}40`, background:`${T.teal}0a`, color:T.teal }}>🚪 Dispo Board</button>
              <button onClick={() => navigate("/critical-inbox")} style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:11, padding:"5px 14px", borderRadius:8, cursor:"pointer", border:`1px solid ${T.red}50`, background:`${T.red}14`, color:T.red }}>🔴 Critical Inbox</button>
              <NotifBell count={unreadCount} onClick={() => setShowNotifPanel(p => !p)} />
            </div>
          </div>
          <h1 className={`${PREFIX}-shim`} style={{ fontFamily:"Playfair Display", fontSize:"clamp(22px,3.5vw,36px)", fontWeight:900, letterSpacing:-1, lineHeight:1.1, marginBottom:4 }}>ED Tracking Board</h1>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:6 }}>
            <p style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt3 }}>Live patient census · Provider assignments · Orders & results at a glance</p>
            {lastFetch && <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, letterSpacing:.5 }}>● Updated {lastFetch.toLocaleTimeString()}</span>}
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:10, marginBottom:16 }}>
          <StatTile value={loading?"—":stats.total}    label="Total Patients" sub="ED census"        color={T.teal} />
          <StatTile value={loading?"—":stats.critical} label="Critical"       sub="Needs attention"  color={T.red}  />
          <StatTile value={loading?"—":stats.pending}  label="Pending Orders" sub="Awaiting results" color={T.gold} />
          <StatTile value={loading?"—":stats.mine}     label="My Patients"    sub={currentProvider}  color={T.blue} />
        </div>

        <div style={{ ...glass, padding:"5px", display:"flex", gap:4, marginBottom:12 }}>
          {BOARD_TABS.map(bt => (
            <button key={bt.id} onClick={() => setBoardView(bt.id)} style={{ flex:"1 1 auto", fontFamily:"DM Sans", fontWeight:600, fontSize:12, padding:"9px 8px", borderRadius:9, cursor:"pointer", textAlign:"center", transition:"all .15s", border:`1px solid ${boardView===bt.id?T.teal+"50":"transparent"}`, background:boardView===bt.id?`linear-gradient(135deg,${T.teal}16,${T.teal}06)`:"transparent", color:boardView===bt.id?T.teal:T.txt3 }}>
              {bt.icon} {bt.label}
            </button>
          ))}
        </div>

        {boardView === "mine" && (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, flexWrap:"wrap" }}>
            <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, letterSpacing:1.5, textTransform:"uppercase" }}>Viewing as:</span>
            {PROVIDERS.map(p => (
              <button key={p} onClick={() => setCurrentProvider(p)} style={{ fontFamily:"DM Sans", fontWeight:600, fontSize:11, padding:"4px 12px", borderRadius:20, cursor:"pointer", border:`1px solid ${currentProvider===p?T.blue+"60":"rgba(42,79,122,0.4)"}`, background:currentProvider===p?`${T.blue}14`:"transparent", color:currentProvider===p?T.blue:T.txt3, transition:"all .12s" }}>{p}</button>
            ))}
          </div>
        )}

        {loading && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12, marginBottom:24 }}>
            {[...Array(6)].map((_, i) => <SkeletonCard key={i}/>)}
          </div>
        )}

        {!loading && sorted.length === 0 && (
          <div style={{ ...glass, padding:"40px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:32 }}>🏥</span>
            <span style={{ fontFamily:"DM Sans", fontSize:14, color:T.txt2, fontWeight:600 }}>No patients</span>
            <span style={{ fontFamily:"DM Sans", fontSize:12, color:T.txt4 }}>{boardView==="mine" ? `No patients assigned to ${currentProvider}` : "No patients match this filter"}</span>
            <button onClick={() => navigate("/NewPatientInput")} style={{ fontFamily:"DM Sans", fontWeight:700, fontSize:12, padding:"9px 20px", borderRadius:9, cursor:"pointer", border:`1px solid ${T.teal}40`, background:`${T.teal}10`, color:T.teal, marginTop:8 }}>+ Add New Patient</button>
          </div>
        )}

        {!loading && sorted.length > 0 && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12, marginBottom:24 }}>
            {sorted.map(p => (
              <PatientCard
                key={p.id} patient={p}
                onNote={()    => openModal(p, "note")}
                onOrders={()  => openModal(p, "orders")}
                onResults={() => openModal(p, "results")}
                onStudio={() => openStudio(p)}
                hasUnread={notifications.some(n => n.patientId === p.id && !n.read)}
              />
            ))}
          </div>
        )}

        <div style={{ textAlign:"center", paddingBottom:24 }}>
          <span style={{ fontFamily:"JetBrains Mono", fontSize:9, color:T.txt4, letterSpacing:1.5 }}>NOTRYA · ED TRACKING BOARD · CLINICAL DECISION SUPPORT ONLY</span>
        </div>
      </div>
    </div>
  );
}