import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";

/* ─── DESIGN TOKENS ─────────────────────────────────────────────── */
const C = {
  bg:        "linear-gradient(135deg, #060d1a 0%, #0a1628 50%, #06111f 100%)",
  glass:     "rgba(255,255,255,0.04)",
  glassHov:  "rgba(255,255,255,0.07)",
  glassBrd:  "rgba(255,255,255,0.08)",
  glassBrdHi:"rgba(255,255,255,0.16)",
  overlay:   "rgba(0,8,20,0.75)",
  teal:      "#00e5c0",
  tealDim:   "rgba(0,229,192,0.12)",
  gold:      "#f5c842",
  goldDim:   "rgba(245,200,66,0.12)",
  coral:     "#ff6b6b",
  coralDim:  "rgba(255,107,107,0.12)",
  blue:      "#3b9eff",
  blueDim:   "rgba(59,158,255,0.12)",
  purple:    "#9b6dff",
  purpleDim: "rgba(155,109,255,0.12)",
  orange:    "#ff9f43",
  orangeDim: "rgba(255,159,67,0.12)",
  green:     "#3dffa0",
  greenDim:  "rgba(61,255,160,0.12)",
  pink:      "#f472b6",
  pinkDim:   "rgba(244,114,182,0.12)",
  txt:       "#e8f0fe",
  txt2:      "#8aaccc",
  txt3:      "#3a5a7a",
  txt4:      "#1e3550",
};

const SHIFT_TYPES = [
  { id:"day",    label:"Day Shift",    icon:"🌅", color:C.blue,   dim:C.blueDim,   hours:12 },
  { id:"night",  label:"Night Shift",  icon:"🌙", color:C.purple, dim:C.purpleDim, hours:12 },
  { id:"call",   label:"On-Call",      icon:"📟", color:C.orange, dim:C.orangeDim, hours:24 },
  { id:"split",  label:"Split Shift",  icon:"⚡", color:C.teal,   dim:C.tealDim,   hours:12 },
  { id:"admin",  label:"Admin",        icon:"🗂️",  color:C.green,  dim:C.greenDim,  hours:8  },
  { id:"cme",    label:"CME / Conf",   icon:"📚", color:C.gold,   dim:C.goldDim,   hours:8  },
  { id:"pto",    label:"PTO",          icon:"🏖️", color:C.pink,   dim:C.pinkDim,   hours:0  },
  { id:"meeting",label:"Meeting",      icon:"🤝", color:C.teal,   dim:C.tealDim,   hours:1  },
  { id:"sick",   label:"Sick Day",     icon:"🤒", color:C.coral,  dim:C.coralDim,  hours:0  },
];

const DEPTS = [
  { id:"all",    label:"All Departments"      },
  { id:"ed",     label:"Emergency Dept."      },
  { id:"icu",    label:"ICU / Critical Care"  },
  { id:"hosp",   label:"Hospitalist"          },
  { id:"or",     label:"OR / Surgery"         },
  { id:"ob",     label:"OB / Labor & Delivery"},
  { id:"clinic", label:"Outpatient Clinic"    },
  { id:"tele",   label:"Telemedicine"         },
  { id:"other",  label:"Other"                },
];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW    = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const fmt = (y,m,d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
const shiftOf = id => SHIFT_TYPES.find(s=>s.id===id) || SHIFT_TYPES[0];
const today = () => { const n=new Date(); return fmt(n.getFullYear(),n.getMonth(),n.getDate()); };

/* ─── GLASS BOX ─────────────────────────────────────────────────── */
const Glass = ({ children, style={}, onClick, onMouseEnter, onMouseLeave, className="" }) => (
  <div onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} className={className} style={{
    background:C.glass, backdropFilter:"blur(16px) saturate(1.4)",
    WebkitBackdropFilter:"blur(16px) saturate(1.4)",
    border:`1px solid ${C.glassBrd}`, ...style
  }}>{children}</div>
);

/* ─── SHIFT PILL ─────────────────────────────────────────────────── */
function ShiftPill({ shift, onClick, compact=false }) {
  const st = shiftOf(shift.type);
  const [hov, setHov] = useState(false);
  return (
    <div onClick={e=>{e.stopPropagation();onClick&&onClick(shift);}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      title={`${st.label}${shift.title?" — "+shift.title:""}${shift.dept&&shift.dept!=="all"?" · "+DEPTS.find(d=>d.id===shift.dept)?.label:""}`}
      style={{
        display:"flex",alignItems:"center",gap:compact?3:5,
        padding:compact?"2px 6px":"3px 8px",
        borderRadius:6,cursor:"pointer",transition:"all .15s",
        background:hov?st.color:st.dim,
        border:`1px solid ${hov?"transparent":st.color}44`,
        fontSize:compact?9:10,fontWeight:600,color:hov?"#060d1a":st.color,
        overflow:"hidden",maxWidth:"100%",flexShrink:0,
      }}>
      <span style={{fontSize:compact?9:11,flexShrink:0}}>{st.icon}</span>
      {!compact && <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
        {shift.title||st.label}
      </span>}
      {!compact && shift.start && <span style={{opacity:.7,fontSize:9,flexShrink:0}}>{shift.start}</span>}
    </div>
  );
}

/* ─── QUICK-ADD POPOVER ──────────────────────────────────────────── */
function QuickAdd({ dateStr, pos, onAdd, onFullAdd, onClose }) {
  const ref = useRef();
  useEffect(()=>{
    const h = e => { if(ref.current && !ref.current.contains(e.target)) onClose(); };
    setTimeout(()=>document.addEventListener("mousedown",h),0);
    return ()=>document.removeEventListener("mousedown",h);
  },[onClose]);

  const [hovId, setHovId] = useState(null);
  const d = new Date(dateStr+"T12:00:00");
  const label = `${DOW[d.getDay()]}, ${MONTHS[d.getMonth()].slice(0,3)} ${d.getDate()}`;

  return (
    <div ref={ref} style={{
      position:"fixed", zIndex:200,
      left:Math.min(pos.x, window.innerWidth-280),
      top:Math.min(pos.y, window.innerHeight-380),
      width:260,
      background:"rgba(8,14,26,0.92)",
      backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",
      border:`1px solid ${C.glassBrdHi}`,borderRadius:14,
      boxShadow:"0 24px 64px rgba(0,0,0,0.6)",
      overflow:"hidden",animation:"fadeInPop .15s ease",
    }}>
      <style>{`@keyframes fadeInPop{from{opacity:0;transform:scale(.96) translateY(-4px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
      <div style={{padding:"12px 14px 8px",borderBottom:`1px solid ${C.glassBrd}`}}>
        <div style={{fontSize:11,fontWeight:700,color:C.teal,textTransform:"uppercase",letterSpacing:".08em"}}>{label}</div>
        <div style={{fontSize:10,color:C.txt3,marginTop:2}}>Click a shift type to add instantly</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,padding:"10px 10px 8px"}}>
        {SHIFT_TYPES.map(st=>(
          <button key={st.id} onClick={()=>{onAdd({type:st.id,date:dateStr,title:"",dept:"all",start:"",end:"",hours:st.hours,notes:"",id:Date.now()+Math.random()+""}); onClose();}}
            onMouseEnter={()=>setHovId(st.id)} onMouseLeave={()=>setHovId(null)}
            style={{
              padding:"8px 4px",borderRadius:8,border:`1px solid ${hovId===st.id?st.color:st.color+"33"}`,
              background:hovId===st.id?st.color:st.dim,cursor:"pointer",transition:"all .15s",
              display:"flex",flexDirection:"column",alignItems:"center",gap:3,
              color:hovId===st.id?"#060d1a":st.color,
            }}>
            <span style={{fontSize:16}}>{st.icon}</span>
            <span style={{fontSize:9,fontWeight:700,textAlign:"center",lineHeight:1.2}}>{st.label}</span>
            {st.hours>0&&<span style={{fontSize:8,opacity:.7}}>{st.hours}h</span>}
          </button>
        ))}
      </div>
      <div style={{padding:"0 10px 10px"}}>
        <button onClick={()=>{onFullAdd(dateStr);onClose();}} style={{
          width:"100%",padding:"8px",borderRadius:8,border:`1px solid ${C.glassBrd}`,
          background:C.tealDim,color:C.teal,fontWeight:600,fontSize:11,cursor:"pointer",
          transition:"all .15s",fontFamily:"inherit",
        }}>⚙ Custom shift details…</button>
      </div>
    </div>
  );
}

/* ─── FULL SHIFT MODAL ────────────────────────────────────────────── */
function ShiftModal({ shift, dateStr, onSave, onDelete, onClose }) {
  const initial = shift || { type:"day",date:dateStr||today(),title:"",dept:"all",start:"",end:"",hours:12,notes:"",location:"" };
  const [form, setForm] = useState(initial);
  const st = shiftOf(form.type);
  const isEdit = !!shift;

  const inp = (field,val) => setForm(p=>({...p,[field]:val}));
  const inputStyle = {
    width:"100%",padding:"8px 10px",background:"rgba(255,255,255,0.05)",
    border:`1px solid ${C.glassBrd}`,borderRadius:8,color:C.txt,fontSize:12,
    outline:"none",fontFamily:"inherit",boxSizing:"border-box",transition:"border .15s",
  };

  return (
    <div style={{position:"fixed",inset:0,background:C.overlay,display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,backdropFilter:"blur(4px)"}}
      onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:"92%",maxWidth:480,maxHeight:"90vh",overflowY:"auto",
        background:"rgba(8,14,26,0.96)",backdropFilter:"blur(32px)",
        border:`1px solid ${C.glassBrdHi}`,borderRadius:16,
        boxShadow:"0 32px 80px rgba(0,0,0,0.7)",
        animation:"fadeInPop .18s ease",
      }}>
        <style>{`@keyframes fadeInPop{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}`}</style>

        {/* Header */}
        <div style={{padding:"16px 18px 12px",borderBottom:`1px solid ${C.glassBrd}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:C.txt,fontFamily:"'Playfair Display',serif"}}>{isEdit?"Edit Shift":"New Shift"}</div>
            <div style={{fontSize:10,color:C.txt3,marginTop:1}}>
              {new Date(form.date+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
            </div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.txt3,cursor:"pointer",fontSize:20,lineHeight:1,padding:"4px"}}>×</button>
        </div>

        <div style={{padding:"14px 18px",display:"flex",flexDirection:"column",gap:14}}>
          {/* Type selector */}
          <div>
            <div style={{fontSize:10,fontWeight:600,color:C.txt3,textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>Shift Type</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
              {SHIFT_TYPES.map(s=>(
                <button key={s.id} onClick={()=>setForm(p=>({...p,type:s.id,hours:s.hours}))} style={{
                  padding:"8px 6px",borderRadius:8,cursor:"pointer",transition:"all .15s",
                  border:`1px solid ${form.type===s.id?s.color:s.color+"33"}`,
                  background:form.type===s.id?s.color:s.dim,
                  color:form.type===s.id?"#060d1a":s.color,
                  display:"flex",flexDirection:"column",alignItems:"center",gap:3,fontFamily:"inherit",
                }}>
                  <span style={{fontSize:16}}>{s.icon}</span>
                  <span style={{fontSize:9,fontWeight:700}}>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date + Title */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              <div style={{fontSize:10,color:C.txt3,textTransform:"uppercase",letterSpacing:".07em",marginBottom:5,fontWeight:600}}>Date</div>
              <input type="date" value={form.date} onChange={e=>inp("date",e.target.value)} style={inputStyle} />
            </div>
            <div>
              <div style={{fontSize:10,color:C.txt3,textTransform:"uppercase",letterSpacing:".07em",marginBottom:5,fontWeight:600}}>Label (optional)</div>
              <input type="text" value={form.title} onChange={e=>inp("title",e.target.value)} placeholder={st.label} style={inputStyle} />
            </div>
          </div>

          {/* Times + Hours */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 80px",gap:10}}>
            <div>
              <div style={{fontSize:10,color:C.txt3,textTransform:"uppercase",letterSpacing:".07em",marginBottom:5,fontWeight:600}}>Start</div>
              <input type="time" value={form.start} onChange={e=>inp("start",e.target.value)} style={inputStyle} />
            </div>
            <div>
              <div style={{fontSize:10,color:C.txt3,textTransform:"uppercase",letterSpacing:".07em",marginBottom:5,fontWeight:600}}>End</div>
              <input type="time" value={form.end} onChange={e=>inp("end",e.target.value)} style={inputStyle} />
            </div>
            <div>
              <div style={{fontSize:10,color:C.txt3,textTransform:"uppercase",letterSpacing:".07em",marginBottom:5,fontWeight:600}}>Hours</div>
              <input type="number" min="0" max="24" value={form.hours} onChange={e=>inp("hours",+e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Dept + Location */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              <div style={{fontSize:10,color:C.txt3,textTransform:"uppercase",letterSpacing:".07em",marginBottom:5,fontWeight:600}}>Department</div>
              <select value={form.dept} onChange={e=>inp("dept",e.target.value)} style={{...inputStyle}}>
                {DEPTS.map(d=><option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:10,color:C.txt3,textTransform:"uppercase",letterSpacing:".07em",marginBottom:5,fontWeight:600}}>Location</div>
              <input type="text" value={form.location||""} onChange={e=>inp("location",e.target.value)} placeholder="Unit / floor" style={inputStyle} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <div style={{fontSize:10,color:C.txt3,textTransform:"uppercase",letterSpacing:".07em",marginBottom:5,fontWeight:600}}>Notes</div>
            <textarea value={form.notes} onChange={e=>inp("notes",e.target.value)} placeholder="Coverage details, reminders…"
              rows={2} style={{...inputStyle,resize:"vertical",minHeight:56}} />
          </div>

          {/* Actions */}
          <div style={{display:"flex",gap:8,paddingTop:4}}>
            <button onClick={()=>onSave({...form,id:isEdit?shift.id:Date.now()+Math.random()+""})} style={{
              flex:1,padding:"10px",borderRadius:9,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,
              background:st.color,color:"#060d1a",transition:"all .15s",fontFamily:"inherit",
            }}>
              {st.icon} {isEdit?"Save Changes":"Add Shift"}
            </button>
            {isEdit && (
              <button onClick={()=>{onDelete(shift.id);onClose();}} style={{
                padding:"10px 14px",borderRadius:9,border:`1px solid ${C.coral}44`,cursor:"pointer",fontWeight:600,fontSize:12,
                background:C.coralDim,color:C.coral,transition:"all .15s",fontFamily:"inherit",
              }}>🗑</button>
            )}
            <button onClick={onClose} style={{
              padding:"10px 14px",borderRadius:9,border:`1px solid ${C.glassBrd}`,cursor:"pointer",fontWeight:600,fontSize:12,
              background:C.glass,color:C.txt2,transition:"all .15s",fontFamily:"inherit",
            }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── SIDEBAR ────────────────────────────────────────────────────── */
function Sidebar({ shifts, currentDate, selectedDept, setSelectedDept, onNewShift }) {
  const monthShifts = shifts.filter(s=>{
    const d=new Date(s.date+"T12:00:00");
    const match = d.getFullYear()===currentDate.getFullYear() && d.getMonth()===currentDate.getMonth();
    return match && (selectedDept==="all"||s.dept===selectedDept);
  });
  const totalHours = monthShifts.reduce((a,s)=>a+(s.hours||0),0);
  const targetHours = 160;
  const pct = Math.min(Math.round(totalHours/targetHours*100),100);

  const upcomingDate = today();
  const upcoming = shifts
    .filter(s=>s.date>=upcomingDate)
    .sort((a,b)=>a.date.localeCompare(b.date))
    .slice(0,5);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12,height:"100%",overflowY:"auto"}}>

      {/* New Shift CTA */}
      <button onClick={()=>onNewShift(today())} style={{
        width:"100%",padding:"11px",borderRadius:10,border:`1px solid ${C.teal}44`,
        background:`linear-gradient(135deg,${C.tealDim},rgba(0,229,192,0.06))`,
        color:C.teal,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",
        display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all .2s",
      }} onMouseEnter={e=>e.currentTarget.style.background=`linear-gradient(135deg,rgba(0,229,192,0.2),rgba(0,229,192,0.1))`}
         onMouseLeave={e=>e.currentTarget.style.background=`linear-gradient(135deg,${C.tealDim},rgba(0,229,192,0.06))`}>
        <span style={{fontSize:16}}>+</span> New Shift
      </button>

      {/* Monthly stats */}
      <Glass style={{borderRadius:12,padding:"14px",overflow:"hidden"}}>
        <div style={{fontSize:11,fontWeight:700,color:C.txt,marginBottom:12,fontFamily:"'Playfair Display',serif"}}>
          {MONTHS[currentDate.getMonth()].slice(0,3)} {currentDate.getFullYear()}
        </div>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <div style={{flex:1,background:C.tealDim,border:`1px solid ${C.teal}33`,borderRadius:8,padding:"10px",textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:700,color:C.teal,fontFamily:"'JetBrains Mono',monospace"}}>{monthShifts.length}</div>
            <div style={{fontSize:9,color:C.txt3,textTransform:"uppercase",letterSpacing:".06em",marginTop:2}}>Shifts</div>
          </div>
          <div style={{flex:1,background:C.goldDim,border:`1px solid ${C.gold}33`,borderRadius:8,padding:"10px",textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:700,color:C.gold,fontFamily:"'JetBrains Mono',monospace"}}>{totalHours}</div>
            <div style={{fontSize:9,color:C.txt3,textTransform:"uppercase",letterSpacing:".06em",marginTop:2}}>Hours</div>
          </div>
        </div>
        <div style={{marginBottom:4,display:"flex",justifyContent:"space-between",fontSize:9,color:C.txt3}}>
          <span>Monthly target</span><span style={{color:C.txt2}}>{pct}% · {totalHours}/{targetHours}h</span>
        </div>
        <div style={{height:6,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${C.teal},${C.blue})`,borderRadius:3,transition:"width .4s"}} />
        </div>
      </Glass>

      {/* Upcoming */}
      <Glass style={{borderRadius:12,padding:"12px 14px",flex:1,minHeight:0,display:"flex",flexDirection:"column"}}>
        <div style={{fontSize:11,fontWeight:700,color:C.txt,marginBottom:10,fontFamily:"'Playfair Display',serif"}}>Upcoming</div>
        {upcoming.length===0 && <div style={{fontSize:11,color:C.txt3,textAlign:"center",padding:"16px 0"}}>No upcoming shifts</div>}
        <div style={{display:"flex",flexDirection:"column",gap:6,overflowY:"auto"}}>
          {upcoming.map(s=>{
            const st=shiftOf(s.type);
            const d=new Date(s.date+"T12:00:00");
            const isToday=s.date===today();
            return (
              <div key={s.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 9px",borderRadius:8,background:isToday?st.dim:"rgba(255,255,255,0.02)",border:`1px solid ${isToday?st.color+"33":C.glassBrd}`}}>
                <div style={{width:34,flexShrink:0,textAlign:"center"}}>
                  <div style={{fontSize:10,fontWeight:700,color:st.color,fontFamily:"'JetBrains Mono',monospace"}}>{DOW[d.getDay()]}</div>
                  <div style={{fontSize:13,fontWeight:700,color:C.txt,fontFamily:"'JetBrains Mono',monospace",lineHeight:1}}>{d.getDate()}</div>
                </div>
                <div style={{fontSize:14,flexShrink:0}}>{st.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,fontWeight:600,color:C.txt,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.title||st.label}</div>
                  {s.start && <div style={{fontSize:9,color:C.txt3}}>{s.start}{s.end?` – ${s.end}`:""}</div>}
                </div>
                {s.hours>0 && <div style={{fontSize:9,fontWeight:700,color:st.color,fontFamily:"'JetBrains Mono',monospace",flexShrink:0}}>{s.hours}h</div>}
              </div>
            );
          })}
        </div>
      </Glass>

      {/* Department filter */}
      <Glass style={{borderRadius:12,padding:"12px 14px"}}>
        <div style={{fontSize:11,fontWeight:700,color:C.txt,marginBottom:9,fontFamily:"'Playfair Display',serif"}}>Department</div>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {DEPTS.map(d=>(
            <button key={d.id} onClick={()=>setSelectedDept(d.id)} style={{
              display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:7,border:"none",cursor:"pointer",
              background:selectedDept===d.id?C.blueDim:"transparent",
              color:selectedDept===d.id?C.blue:C.txt2,fontSize:11,fontWeight:selectedDept===d.id?700:400,
              transition:"all .15s",fontFamily:"inherit",textAlign:"left",
            }}>
              {selectedDept===d.id && <span style={{width:4,height:4,borderRadius:"50%",background:C.blue,flexShrink:0,display:"inline-block"}} />}
              {d.label}
            </button>
          ))}
        </div>
      </Glass>
    </div>
  );
}

/* ─── MONTH VIEW ─────────────────────────────────────────────────── */
function MonthView({ currentDate, shifts, selectedDept, onDayClick, onShiftClick }) {
  const [popover, setPopover] = useState(null); // {dateStr, x, y}
  const year = currentDate.getFullYear(), month = currentDate.getMonth();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();
  const todayStr = today();

  const getShifts = dateStr => shifts.filter(s=>s.date===dateStr && (selectedDept==="all"||s.dept===selectedDept));

  const handleDayClick = (dateStr, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopover({ dateStr, x: rect.left + rect.width/2 - 130, y: rect.bottom + 8 });
  };

  const closePopover = useCallback(()=>setPopover(null),[]);

  // Build 6-week grid
  const cells = [];
  for(let i=0;i<firstDow;i++) cells.push(null);
  for(let d=1;d<=daysInMonth;d++) cells.push(d);
  while(cells.length%7!==0) cells.push(null);

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",userSelect:"none"}}>
      {/* DOW headers */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6,marginBottom:8}}>
        {DOW.map(d=>(
          <div key={d} style={{textAlign:"center",fontSize:10,fontWeight:700,color:C.txt3,textTransform:"uppercase",letterSpacing:".08em",padding:"4px 0"}}>
            {d}
          </div>
        ))}
      </div>
      {/* Week rows */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gridTemplateRows:`repeat(${cells.length/7},1fr)`,gap:6,flex:1}}>
        {cells.map((day,i)=>{
          if(!day) return <div key={`e${i}`} style={{borderRadius:10,background:"rgba(255,255,255,0.01)",border:`1px solid ${C.glassBrd}22`}} />;
          const dateStr = fmt(year,month,day);
          const dayShifts = getShifts(dateStr);
          const isToday = dateStr===todayStr;
          const isWeekend = [0,6].includes((firstDow+day-1)%7);

          return (
            <DayCell key={dateStr} day={day} dateStr={dateStr} shifts={dayShifts}
              isToday={isToday} isWeekend={isWeekend}
              onClick={handleDayClick} onShiftClick={onShiftClick} />
          );
        })}
      </div>
      {popover && (
        <QuickAdd dateStr={popover.dateStr} pos={{x:popover.x,y:popover.y}}
          onAdd={s=>{onShiftClick(null,s,true);}} // null = new shift pre-filled
          onFullAdd={dateStr=>{onDayClick(dateStr);}}
          onClose={closePopover} />
      )}
    </div>
  );
}

function DayCell({ day, dateStr, shifts, isToday, isWeekend, onClick, onShiftClick }) {
  const [hov, setHov] = useState(false);
  const MAX = 3;
  return (
    <div onClick={e=>onClick(dateStr,e)}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        borderRadius:10,padding:"7px 8px",cursor:"pointer",transition:"all .18s",
        background:isToday?`linear-gradient(135deg,rgba(0,229,192,0.1),rgba(59,158,255,0.06))`
          :hov?C.glassHov:isWeekend?"rgba(255,255,255,0.018)":C.glass,
        border:`1px solid ${isToday?C.teal:hov?C.glassBrdHi:C.glassBrd}`,
        backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",
        display:"flex",flexDirection:"column",minHeight:0,
      }}>
      <div style={{
        fontSize:12,fontWeight:700,color:isToday?C.teal:isWeekend?C.txt2:C.txt,
        marginBottom:4,display:"flex",alignItems:"center",gap:5,
        fontFamily:"'JetBrains Mono',monospace",
      }}>
        {day}
        {isToday && <span style={{fontSize:8,fontWeight:700,color:C.teal,background:C.tealDim,border:`1px solid ${C.teal}44`,padding:"1px 5px",borderRadius:20}}>TODAY</span>}
        {hov && shifts.length===0 && <span style={{marginLeft:"auto",fontSize:14,color:C.teal,opacity:.6,lineHeight:1}}>+</span>}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:2,flex:1,overflow:"hidden",minHeight:0}}>
        {shifts.slice(0,MAX).map(s=><ShiftPill key={s.id} shift={s} onClick={sh=>onShiftClick(sh)} compact={false} />)}
        {shifts.length>MAX && (
          <div style={{fontSize:9,color:C.txt3,fontWeight:600,paddingLeft:2}}>+{shifts.length-MAX} more</div>
        )}
      </div>
    </div>
  );
}

/* ─── WEEK VIEW ──────────────────────────────────────────────────── */
function WeekView({ currentDate, shifts, selectedDept, onDayClick, onShiftClick }) {
  const todayStr = today();
  // Find start of week (Sunday)
  const ref = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  const startOfWeek = new Date(ref);
  startOfWeek.setDate(ref.getDate() - ref.getDay());

  const days = Array.from({length:7},(_,i)=>{
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate()+i);
    return { date:d, dateStr:fmt(d.getFullYear(),d.getMonth(),d.getDate()) };
  });

  const getShifts = dateStr => shifts.filter(s=>s.date===dateStr&&(selectedDept==="all"||s.dept===selectedDept));

  const [popover, setPopover] = useState(null);
  const closePopover = useCallback(()=>setPopover(null),[]);

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8,flex:1}}>
        {days.map(({date,dateStr})=>{
          const dayShifts = getShifts(dateStr);
          const isToday = dateStr===todayStr;
          const isWeekend = date.getDay()===0||date.getDay()===6;
          return (
            <div key={dateStr} style={{display:"flex",flexDirection:"column",gap:6}}>
              {/* Day header */}
              <div onClick={e=>{const rect=e.currentTarget.getBoundingClientRect();setPopover({dateStr,x:rect.left,y:rect.bottom+6});}}
                style={{
                  textAlign:"center",padding:"10px 4px",borderRadius:10,cursor:"pointer",
                  background:isToday?`linear-gradient(135deg,${C.tealDim},${C.blueDim})`:C.glass,
                  border:`1px solid ${isToday?C.teal:C.glassBrd}`,backdropFilter:"blur(12px)",
                  transition:"all .18s",
                }}
                onMouseEnter={e=>e.currentTarget.style.borderColor=C.glassBrdHi}
                onMouseLeave={e=>e.currentTarget.style.borderColor=isToday?C.teal:C.glassBrd}>
                <div style={{fontSize:9,fontWeight:700,color:isToday?C.teal:C.txt3,textTransform:"uppercase",letterSpacing:".09em"}}>{DOW[date.getDay()]}</div>
                <div style={{fontSize:22,fontWeight:700,color:isToday?C.teal:isWeekend?C.txt2:C.txt,fontFamily:"'Playfair Display',serif",lineHeight:1.3}}>{date.getDate()}</div>
                {isToday && <div style={{width:5,height:5,borderRadius:"50%",background:C.teal,margin:"4px auto 0"}} />}
              </div>
              {/* Shift stack */}
              <div style={{display:"flex",flexDirection:"column",gap:5,flex:1}}>
                {dayShifts.map(s=>{
                  const st=shiftOf(s.type);
                  return (
                    <div key={s.id} onClick={()=>onShiftClick(s)}
                      style={{
                        padding:"9px 10px",borderRadius:9,cursor:"pointer",transition:"all .15s",
                        background:st.dim,border:`1px solid ${st.color}44`,
                        backdropFilter:"blur(8px)",
                      }}
                      onMouseEnter={e=>e.currentTarget.style.border=`1px solid ${st.color}`}
                      onMouseLeave={e=>e.currentTarget.style.border=`1px solid ${st.color}44`}>
                      <div style={{fontSize:16,marginBottom:4}}>{st.icon}</div>
                      <div style={{fontSize:11,fontWeight:700,color:st.color}}>{s.title||st.label}</div>
                      {s.start&&<div style={{fontSize:9,color:C.txt3,marginTop:2}}>{s.start}{s.end?` – ${s.end}`:""}</div>}
                      {s.hours>0&&<div style={{fontSize:9,color:C.txt2,marginTop:2,fontFamily:"'JetBrains Mono',monospace"}}>{s.hours}h</div>}
                      {s.notes&&<div style={{fontSize:9,color:C.txt3,marginTop:3,lineHeight:1.4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{s.notes}</div>}
                    </div>
                  );
                })}
                {dayShifts.length===0 && (
                  <div onClick={e=>{const rect=e.currentTarget.getBoundingClientRect();setPopover({dateStr,x:rect.left,y:rect.bottom+6});}}
                    style={{
                      padding:"10px 6px",borderRadius:9,cursor:"pointer",border:`1px dashed ${C.glassBrd}`,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      color:C.txt4,fontSize:18,transition:"all .18s",flex:1,minHeight:48,
                    }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=C.teal;e.currentTarget.style.color=C.teal;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.glassBrd;e.currentTarget.style.color=C.txt4;}}>
                    +
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {popover && (
        <QuickAdd dateStr={popover.dateStr} pos={popover}
          onAdd={s=>{onShiftClick(null,s,true);}}
          onFullAdd={dateStr=>{onDayClick(dateStr);}}
          onClose={closePopover} />
      )}
    </div>
  );
}

/* ─── MAIN CALENDAR PAGE ─────────────────────────────────────────── */
export default function CalendarPage() {
  const [current, setCurrent] = useState(new Date());
  const [view, setView] = useState("month"); // "month" | "week"
  const [shifts, setShifts] = useState([]);
  const [selectedDept, setSelectedDept] = useState("all");
  const [modal, setModal] = useState(null); // null | { shift?, dateStr }

  // Helper: CalendarEvent <-> shift object
  const toShift = ev => {
    let extra = {};
    try { extra = JSON.parse(ev.description||"{}")} catch{}
    return { id:ev.id, date:ev.date, title:ev.title||"" , type:ev.color||"day",
      start:ev.time||"", end:extra.end||"", hours:extra.hours??12,
      dept:extra.dept||"all", notes:extra.notes||"", location:extra.location||"" };
  };
  const toEvent = s => ({
    title: s.title || shiftOf(s.type).label,
    date: s.date,
    time: s.start || "",
    color: s.type,
    description: JSON.stringify({ end:s.end, hours:s.hours, dept:s.dept, notes:s.notes, location:s.location }),
  });

  // Load
  useEffect(()=>{
    base44.entities.CalendarEvent.list("-date", 500)
      .then(evs => setShifts(evs.map(toShift)))
      .catch(()=>{});
  },[]);

  const saveShift = async s => {
    const eventData = toEvent(s);
    if(s.id && shifts.find(p=>p.id===s.id)) {
      await base44.entities.CalendarEvent.update(s.id, eventData);
      setShifts(prev=>prev.map(p=>p.id===s.id?{...s}:p));
    } else {
      const created = await base44.entities.CalendarEvent.create(eventData);
      setShifts(prev=>[...prev, toShift(created)]);
    }
    setModal(null);
  };
  const deleteShift = async id => {
    await base44.entities.CalendarEvent.delete(id);
    setShifts(p=>p.filter(s=>s.id!==id));
    setModal(null);
  };

  const handleShiftClick = (shift, prefilled=null, quickSave=false) => {
    if(quickSave && prefilled){ saveShift(prefilled); return; }
    if(shift) setModal({shift, dateStr:shift.date});
    else if(prefilled) setModal({shift:null, dateStr:prefilled.date, prefilled});
  };

  const navigatePrev = () => {
    if(view==="month") setCurrent(d=>new Date(d.getFullYear(),d.getMonth()-1,1));
    else setCurrent(d=>{const n=new Date(d);n.setDate(d.getDate()-7);return n;});
  };
  const navigateNext = () => {
    if(view==="month") setCurrent(d=>new Date(d.getFullYear(),d.getMonth()+1,1));
    else setCurrent(d=>{const n=new Date(d);n.setDate(d.getDate()+7);return n;});
  };

  const todayObj = new Date();
  const navLabel = view==="month"
    ? `${MONTHS[current.getMonth()]} ${current.getFullYear()}`
    : (()=>{
        const start=new Date(current);start.setDate(current.getDate()-current.getDay());
        const end=new Date(start);end.setDate(start.getDate()+6);
        return `${MONTHS[start.getMonth()].slice(0,3)} ${start.getDate()} – ${MONTHS[end.getMonth()].slice(0,3)} ${end.getDate()}, ${end.getFullYear()}`;
      })();

  return (
    <div style={{
      minHeight:"100vh", background:C.bg, color:C.txt,
      fontFamily:"'DM Sans',sans-serif", display:"flex", flexDirection:"column",
      padding:"80px 16px 16px", gap:14, boxSizing:"border-box",
    }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px}
        input,select,textarea,button{font-family:inherit;outline:none;}
        select option{background:#0a1628}
        input[type=date]::-webkit-calendar-picker-indicator,
        input[type=time]::-webkit-calendar-picker-indicator{filter:invert(0.5)}
      `}</style>

      {/* ── Header ── */}
      <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{fontSize:22,lineHeight:1}}>🩺</div>
          <div>
            <div style={{fontSize:18,fontWeight:700,color:C.txt,fontFamily:"'Playfair Display',serif",lineHeight:1}}>Provider Schedule</div>
            <div style={{fontSize:10,color:C.txt3}}>Shift calendar · Click any day to add</div>
          </div>
        </div>

        {/* Nav */}
        <div style={{display:"flex",alignItems:"center",gap:6,margin:"0 auto"}}>
          <button onClick={navigatePrev} style={{width:32,height:32,borderRadius:8,border:`1px solid ${C.glassBrd}`,background:C.glass,color:C.txt2,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(12px)"}}>‹</button>
          <div style={{fontSize:15,fontWeight:700,color:C.txt,minWidth:220,textAlign:"center",fontFamily:"'Playfair Display',serif"}}>{navLabel}</div>
          <button onClick={navigateNext} style={{width:32,height:32,borderRadius:8,border:`1px solid ${C.glassBrd}`,background:C.glass,color:C.txt2,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(12px)"}}>›</button>
          <button onClick={()=>{setCurrent(new Date());}} style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${C.teal}44`,background:C.tealDim,color:C.teal,fontSize:11,fontWeight:700,cursor:"pointer",marginLeft:4}}>Today</button>
        </div>

        {/* View toggle + add */}
        <div style={{display:"flex",gap:8,marginLeft:"auto"}}>
          <div style={{display:"flex",borderRadius:9,overflow:"hidden",border:`1px solid ${C.glassBrd}`}}>
            {["month","week"].map(v=>(
              <button key={v} onClick={()=>setView(v)} style={{
                padding:"6px 14px",border:"none",cursor:"pointer",fontSize:11,fontWeight:700,
                background:view===v?C.tealDim:"transparent",color:view===v?C.teal:C.txt3,
                transition:"all .2s",backdropFilter:"blur(12px)",
              }}>{v.charAt(0).toUpperCase()+v.slice(1)}</button>
            ))}
          </div>
          <button onClick={()=>setModal({shift:null,dateStr:today()})} style={{
            padding:"6px 16px",borderRadius:9,border:`1px solid ${C.teal}44`,background:C.tealDim,
            color:C.teal,fontWeight:700,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:6,
          }}>
            <span style={{fontSize:16,lineHeight:1}}>+</span> New Shift
          </button>
        </div>
      </div>

      {/* ── Shift type legend strip ── */}
      <Glass style={{borderRadius:10,padding:"8px 14px",display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:9,fontWeight:700,color:C.txt3,textTransform:"uppercase",letterSpacing:".08em",marginRight:4}}>Shift types</span>
        {SHIFT_TYPES.map(st=>(
          <div key={st.id} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 9px",borderRadius:20,background:st.dim,border:`1px solid ${st.color}44`}}>
            <span style={{fontSize:11}}>{st.icon}</span>
            <span style={{fontSize:10,fontWeight:600,color:st.color}}>{st.label}</span>
            {st.hours>0&&<span style={{fontSize:9,color:C.txt3}}>{st.hours}h</span>}
          </div>
        ))}
      </Glass>

      {/* ── Main grid ── */}
      <div style={{display:"grid",gridTemplateColumns:"220px 1fr",gap:14,flex:1,minHeight:0,height:"calc(100vh - 180px)"}}>
        <Sidebar shifts={shifts} currentDate={current} selectedDept={selectedDept}
          setSelectedDept={setSelectedDept} onNewShift={dateStr=>setModal({shift:null,dateStr})} />
        <Glass style={{borderRadius:14,padding:"16px",overflow:"hidden",display:"flex",flexDirection:"column"}}>
          {view==="month"
            ? <MonthView currentDate={current} shifts={shifts} selectedDept={selectedDept}
                onDayClick={dateStr=>setModal({shift:null,dateStr})}
                onShiftClick={(s,pre,quick)=>handleShiftClick(s,pre,quick)} />
            : <WeekView currentDate={current} shifts={shifts} selectedDept={selectedDept}
                onDayClick={dateStr=>setModal({shift:null,dateStr})}
                onShiftClick={(s,pre,quick)=>handleShiftClick(s,pre,quick)} />
          }
        </Glass>
      </div>

      {/* ── Shift modal ── */}
      {modal && (
        <ShiftModal
          shift={modal.shift || (modal.prefilled ? {...modal.prefilled, id:""} : null)}
          dateStr={modal.dateStr}
          onSave={saveShift}
          onDelete={deleteShift}
          onClose={()=>setModal(null)}
        />
      )}
    </div>
  );
}