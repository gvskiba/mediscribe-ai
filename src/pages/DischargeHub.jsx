import { useState, useCallback, useRef } from "react";

(() => {
  if (document.getElementById("sdh-fonts")) return;
  const l = document.createElement("link"); l.id="sdh-fonts"; l.rel="stylesheet";
  l.href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,600;1,400&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id="sdh-css";
  s.textContent=`*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(42,79,122,.5);border-radius:2px}@keyframes sdhfade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes sdhorb0{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.1)}}@keyframes sdhorb1{0%,100%{transform:translate(-50%,-50%) scale(1.07)}50%{transform:translate(-50%,-50%) scale(.92)}}@keyframes sdhorb2{0%,100%{transform:translate(-50%,-50%) scale(.95)}50%{transform:translate(-50%,-50%) scale(1.09)}}@keyframes sdhpulse{0%,100%{opacity:.7}50%{opacity:1}}@keyframes sdhspin{to{transform:rotate(360deg)}}.sdh-fade{animation:sdhfade .25s ease both}.sdh-spin{animation:sdhspin .9s linear infinite}@media print{.sdh-no-print{display:none!important}.sdh-print-only{display:block!important}.sdh-sheet{box-shadow:none!important;border:none!important;background:white!important;padding:20px!important}}`;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e", panel:"rgba(8,22,40,0.78)", card:"rgba(11,30,54,0.65)",
  txt:"#e8f0fe", txt2:"#8aaccc", txt3:"#4a6a8a", txt4:"#2e4a6a",
  teal:"#00e5c0", gold:"#f5c842", red:"#ff4444", coral:"#ff6b6b",
  green:"#3dffa0", blue:"#3b9eff", purple:"#9b6dff", orange:"#ff9f43",
};
const glass = { backdropFilter:"blur(20px) saturate(180%)", WebkitBackdropFilter:"blur(20px) saturate(180%)", background:"rgba(8,22,40,0.78)", border:"1px solid rgba(42,79,122,0.35)", borderRadius:14 };

const LANGS = [["English","English"],["Spanish","Español"],["Simplified English","Plain English (Grade 5)"],["Mandarin Chinese","中文"],["Vietnamese","Tiếng Việt"],["Portuguese","Português"]];
const LEVELS = [["simple","Simple — Explain like I'm 12"],["standard","Standard — Clear adult language"],["detailed","Detailed — Health-literate patient"]];
const MED_STATUS = ["New","Continued","Changed","Stopped","As Needed (PRN)"];
const FOLLOWUP_WHO = ["Primary Care Doctor","Cardiologist","Neurologist","Orthopedic Surgeon","Urologist","OB/GYN","Pulmonologist","Gastroenterologist","Oncologist","Infectious Disease","Wound Clinic","Other Specialist"];

function AmbientBg() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
      {[{l:"10%",t:"15%",r:300,c:"rgba(0,229,192,0.05)"},{l:"85%",t:"10%",r:250,c:"rgba(59,158,255,0.045)"},{l:"75%",t:"75%",r:320,c:"rgba(155,109,255,0.04)"},{l:"18%",t:"78%",r:200,c:"rgba(245,200,66,0.035)"}].map((o,i)=>(
        <div key={i} style={{position:"absolute",left:o.l,top:o.t,width:o.r*2,height:o.r*2,borderRadius:"50%",background:`radial-gradient(circle,${o.c} 0%,transparent 68%)`,transform:"translate(-50%,-50%)",animation:`sdhorb${i%3} ${8+i*1.4}s ease-in-out infinite`}}/>
      ))}
    </div>
  );
}

function MedRow({ med, idx, onChange, onRemove }) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto auto",gap:6,marginBottom:6,alignItems:"center"}}>
      <input value={med.name} onChange={e=>onChange(idx,"name",e.target.value)}
        placeholder="Medication name + dose"
        style={{background:"rgba(14,37,68,0.7)",border:"1px solid rgba(42,79,122,0.4)",borderRadius:8,padding:"6px 10px",color:T.txt,fontFamily:"DM Sans",fontSize:12,outline:"none"}}/>
      <input value={med.freq} onChange={e=>onChange(idx,"freq",e.target.value)}
        placeholder="e.g. twice daily with food"
        style={{background:"rgba(14,37,68,0.7)",border:"1px solid rgba(42,79,122,0.4)",borderRadius:8,padding:"6px 10px",color:T.txt,fontFamily:"DM Sans",fontSize:12,outline:"none"}}/>
      <select value={med.status} onChange={e=>onChange(idx,"status",e.target.value)}
        style={{background:"rgba(14,37,68,0.85)",border:"1px solid rgba(42,79,122,0.4)",borderRadius:8,padding:"6px 9px",color:T.txt,fontFamily:"DM Sans",fontSize:11,outline:"none",cursor:"pointer"}}>
        {MED_STATUS.map(s=><option key={s} value={s}>{s}</option>)}
      </select>
      <button onClick={()=>onRemove(idx)} style={{width:28,height:28,borderRadius:6,border:"1px solid rgba(255,107,107,0.3)",background:"rgba(255,107,107,0.1)",color:T.coral,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
    </div>
  );
}

function FollowUpRow({ fu, idx, onChange, onRemove }) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto auto",gap:6,marginBottom:6,alignItems:"center"}}>
      <select value={fu.who} onChange={e=>onChange(idx,"who",e.target.value)}
        style={{background:"rgba(14,37,68,0.85)",border:"1px solid rgba(42,79,122,0.4)",borderRadius:8,padding:"6px 9px",color:T.txt,fontFamily:"DM Sans",fontSize:11,outline:"none",cursor:"pointer"}}>
        {FOLLOWUP_WHO.map(w=><option key={w} value={w}>{w}</option>)}
      </select>
      <input value={fu.when} onChange={e=>onChange(idx,"when",e.target.value)}
        placeholder="e.g. within 3–5 days"
        style={{background:"rgba(14,37,68,0.7)",border:"1px solid rgba(42,79,122,0.4)",borderRadius:8,padding:"6px 10px",color:T.txt,fontFamily:"DM Sans",fontSize:12,outline:"none"}}/>
      <select value={fu.urgency} onChange={e=>onChange(idx,"urgency",e.target.value)}
        style={{background:"rgba(14,37,68,0.85)",border:"1px solid rgba(42,79,122,0.4)",borderRadius:8,padding:"6px 8px",color:fu.urgency==="urgent"?T.coral:T.green,fontFamily:"DM Sans",fontSize:11,outline:"none",cursor:"pointer"}}>
        <option value="urgent">Urgent</option>
        <option value="routine">Routine</option>
      </select>
      <button onClick={()=>onRemove(idx)} style={{width:28,height:28,borderRadius:6,border:"1px solid rgba(255,107,107,0.3)",background:"rgba(255,107,107,0.1)",color:T.coral,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
    </div>
  );
}

function SheetSection({ icon, title, color, children, bg }) {
  return (
    <div style={{marginBottom:20,borderRadius:12,overflow:"hidden",border:`1px solid ${color}25`,background:bg||`${color}08`}}>
      <div style={{padding:"10px 16px",borderBottom:`1px solid ${color}20`,background:`${color}12`,display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:18}}>{icon}</span>
        <span style={{fontFamily:"Lora",fontWeight:600,fontSize:15,color:color}}>{title}</span>
      </div>
      <div style={{padding:"14px 16px"}}>{children}</div>
    </div>
  );
}

function DischargeSheet({ data, patientName, diagnosis, lang, onCopy, onPrint }) {
  const statusColor = { New:T.teal, Continued:T.txt2, Changed:T.gold, Stopped:T.coral, "As Needed (PRN)":T.purple };
  const statusIcon = { New:"✦", Continued:"●", Changed:"◈", Stopped:"✕", "As Needed (PRN)":"◎" };
  return (
    <div className="sdh-sheet sdh-fade" style={{background:"rgba(8,22,40,0.92)",border:"1px solid rgba(42,79,122,0.4)",borderRadius:16,overflow:"hidden"}}>

      {/* Sheet header */}
      <div style={{background:"linear-gradient(135deg,rgba(0,229,192,0.15),rgba(59,158,255,0.08))",borderBottom:"1px solid rgba(0,229,192,0.25)",padding:"18px 20px"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
          <div>
            <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.teal,letterSpacing:3,textTransform:"uppercase",marginBottom:4}}>Discharge Instructions</div>
            <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:22,color:T.txt,lineHeight:1.2}}>{diagnosis}</div>
            {patientName && <div style={{fontFamily:"DM Sans",fontSize:13,color:T.txt2,marginTop:4}}>For: <strong style={{color:T.txt}}>{patientName}</strong></div>}
            <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,marginTop:4}}>{new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
          </div>
          <div style={{display:"flex",gap:8,flexShrink:0}}>
            <button onClick={onCopy} className="sdh-no-print"
              style={{fontFamily:"DM Sans",fontWeight:600,fontSize:11,padding:"7px 14px",borderRadius:8,cursor:"pointer",border:"1px solid rgba(42,79,122,0.5)",background:"rgba(14,37,68,0.7)",color:T.txt2}}>
              📋 Copy
            </button>
            <button onClick={onPrint} className="sdh-no-print"
              style={{fontFamily:"DM Sans",fontWeight:600,fontSize:11,padding:"7px 14px",borderRadius:8,cursor:"pointer",border:`1px solid ${T.teal}44`,background:`rgba(0,229,192,0.1)`,color:T.teal}}>
              🖨️ Print
            </button>
          </div>
        </div>
        {data.keyReminder && (
          <div style={{marginTop:14,padding:"12px 15px",borderRadius:10,background:"rgba(245,200,66,0.12)",border:"1px solid rgba(245,200,66,0.35)",display:"flex",gap:10,alignItems:"flex-start"}}>
            <span style={{fontSize:20,flexShrink:0}}>⭐</span>
            <div>
              <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.gold,letterSpacing:2,textTransform:"uppercase",marginBottom:3}}>Most Important Thing</div>
              <div style={{fontFamily:"Lora",fontSize:14,color:T.txt,lineHeight:1.55}}>{data.keyReminder}</div>
            </div>
          </div>
        )}
      </div>

      <div style={{padding:"20px"}}>

        {/* What happened */}
        {data.whatHappened && (
          <SheetSection icon="📋" title="Why You Were Here" color={T.blue}>
            <p style={{fontFamily:"Lora",fontSize:14,color:T.txt,lineHeight:1.7}}>{data.whatHappened}</p>
          </SheetSection>
        )}

        {/* What we did */}
        {data.whatWeDid?.length > 0 && (
          <SheetSection icon="🩺" title="What We Found & Did" color={T.teal}>
            {data.whatWeDid.map((item,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:8}}>
                <span style={{color:T.teal,fontSize:11,marginTop:3,flexShrink:0}}>✓</span>
                <span style={{fontFamily:"DM Sans",fontSize:13,color:T.txt,lineHeight:1.55}}>{item}</span>
              </div>
            ))}
          </SheetSection>
        )}

        {/* Return NOW */}
        {data.returnNow?.length > 0 && (
          <SheetSection icon="🚨" title="Call 911 or Return to the ER Immediately If..." color={T.red} bg="rgba(255,68,68,0.07)">
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:8}}>
              {data.returnNow.map((item,i)=>(
                <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",padding:"8px 10px",borderRadius:8,background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)"}}>
                  <span style={{color:T.red,fontSize:13,flexShrink:0,marginTop:1}}>⚠</span>
                  <span style={{fontFamily:"DM Sans",fontWeight:500,fontSize:13,color:T.txt,lineHeight:1.45}}>{item}</span>
                </div>
              ))}
            </div>
          </SheetSection>
        )}

        {/* Call doctor */}
        {data.callDoctor?.length > 0 && (
          <SheetSection icon="📞" title="Call Your Doctor If You Notice..." color={T.orange}>
            {data.callDoctor.map((item,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:7}}>
                <span style={{color:T.orange,fontSize:10,marginTop:4,flexShrink:0}}>▶</span>
                <span style={{fontFamily:"DM Sans",fontSize:13,color:T.txt,lineHeight:1.5}}>{item}</span>
              </div>
            ))}
          </SheetSection>
        )}

        {/* Medications */}
        {data.medications?.length > 0 && (
          <SheetSection icon="💊" title="Your Medications" color={T.purple}>
            <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,marginBottom:12}}>Review every medication listed here before you leave.</div>
            {data.medications.map((med,i)=>{
              const sc = statusColor[med.status]||T.txt2;
              const si = statusIcon[med.status]||"●";
              return (
                <div key={i} style={{padding:"11px 13px",borderRadius:10,marginBottom:8,background:"rgba(14,37,68,0.5)",border:`1px solid ${sc}28`}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                    <span style={{fontFamily:"JetBrains Mono",fontWeight:700,fontSize:13,color:T.txt}}>{med.name}</span>
                    <span style={{fontFamily:"JetBrains Mono",fontSize:8,fontWeight:700,padding:"2px 8px",borderRadius:20,background:`${sc}18`,border:`1px solid ${sc}35`,color:sc}}>{si} {med.status?.toUpperCase()}</span>
                  </div>
                  {med.dose && <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,marginBottom:3}}>Take: <strong style={{color:T.txt}}>{med.dose}</strong></div>}
                  {med.why && <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3,marginBottom:med.warning?4:0}}>Why: {med.why}</div>}
                  {med.warning && <div style={{fontFamily:"DM Sans",fontWeight:600,fontSize:12,color:T.coral,padding:"4px 8px",borderRadius:6,background:"rgba(255,107,107,0.08)",marginTop:4}}>⚠ {med.warning}</div>}
                </div>
              );
            })}
          </SheetSection>
        )}

        {/* Follow up */}
        {data.followUp?.length > 0 && (
          <SheetSection icon="📅" title="Your Follow-Up Plan" color={T.gold}>
            {data.followUp.map((fu,i)=>(
              <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:10,padding:"10px 12px",borderRadius:10,background:"rgba(245,200,66,0.06)",border:"1px solid rgba(245,200,66,0.18)"}}>
                <div style={{width:36,height:36,borderRadius:8,background:`${fu.urgency==="urgent"?T.coral:T.gold}18`,border:`1px solid ${fu.urgency==="urgent"?T.coral:T.gold}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                  {fu.urgency==="urgent"?"🔴":"📅"}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:13,color:T.txt,marginBottom:2}}>{fu.provider}</div>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:11,fontWeight:700,color:fu.urgency==="urgent"?T.coral:T.gold}}>{fu.timeframe}</div>
                  {fu.why && <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3,marginTop:3}}>{fu.why}</div>}
                </div>
              </div>
            ))}
          </SheetSection>
        )}

        {/* Self care */}
        {data.selfCare?.length > 0 && (
          <SheetSection icon="🏠" title="Taking Care of Yourself at Home" color={T.green}>
            {data.selfCare.map((item,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:8}}>
                <span style={{color:T.green,fontSize:11,marginTop:3,flexShrink:0}}>◆</span>
                <span style={{fontFamily:"DM Sans",fontSize:13,color:T.txt,lineHeight:1.55}}>{item}</span>
              </div>
            ))}
          </SheetSection>
        )}

        {/* Clinical handoff — visually distinct */}
        {data.handoffSummary && (
          <div style={{marginTop:24,paddingTop:18,borderTop:"2px dashed rgba(42,79,122,0.35)"}}>
            <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>⚕ For the Next Provider — Clinical Handoff Summary</div>
            <div style={{padding:"14px 16px",borderRadius:12,background:"rgba(155,109,255,0.07)",border:"1px solid rgba(155,109,255,0.2)"}}>
              <p style={{fontFamily:"JetBrains Mono",fontSize:12,color:T.txt2,lineHeight:1.7}}>{data.handoffSummary}</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function FieldLabel({ children }) {
  return <div style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,letterSpacing:2,textTransform:"uppercase",marginBottom:5}}>{children}</div>;
}

function Textarea({ value, onChange, placeholder, rows=3 }) {
  return (
    <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{width:"100%",background:"rgba(14,37,68,0.7)",border:"1px solid rgba(42,79,122,0.4)",borderRadius:8,padding:"8px 11px",color:T.txt,fontFamily:"DM Sans",fontSize:12,outline:"none",resize:"vertical",lineHeight:1.55}}/>
  );
}

function AddButton({ onClick, label }) {
  return (
    <button onClick={onClick}
      style={{fontFamily:"DM Sans",fontWeight:600,fontSize:10,padding:"4px 12px",borderRadius:20,cursor:"pointer",border:`1px solid ${T.teal}35`,background:`rgba(0,229,192,0.07)`,color:T.teal,marginTop:4}}>
      + {label}
    </button>
  );
}

function Toast({ msg }) {
  return (
    <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"rgba(8,22,40,0.96)",border:"1px solid rgba(0,229,192,0.4)",borderRadius:10,padding:"10px 20px",fontFamily:"DM Sans",fontWeight:600,fontSize:13,color:T.teal,zIndex:99999,pointerEvents:"none",animation:"sdhfade .2s ease both"}}>
      {msg}
    </div>
  );
}

export default function DischargeHub({ onBack }) {
  const [tab, setTab] = useState("build");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [output, setOutput] = useState(null);
  const sheetRef = useRef(null);

  // Form state
  const [patientName, setPatientName] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("the patient");
  const [lang, setLang] = useState("English");
  const [level, setLevel] = useState("standard");
  const [findings, setFindings] = useState("");
  const [procedures, setProcedures] = useState("");
  const [special, setSpecial] = useState("");
  const [meds, setMeds] = useState([{ name:"", freq:"", status:"Continued" }]);
  const [followups, setFollowups] = useState([{ who:"Primary Care Doctor", when:"within 3–5 days", urgency:"routine" }]);

  const addMed = useCallback(()=>setMeds(m=>[...m,{name:"",freq:"",status:"Continued"}]),[]);
  const removeMed = useCallback((i)=>setMeds(m=>m.filter((_,idx)=>idx!==i)),[]);
  const changeMed = useCallback((i,k,v)=>setMeds(m=>m.map((med,idx)=>idx===i?{...med,[k]:v}:med)),[]);

  const addFu = useCallback(()=>setFollowups(f=>[...f,{who:"Primary Care Doctor",when:"",urgency:"routine"}]),[]);
  const removeFu = useCallback((i)=>setFollowups(f=>f.filter((_,idx)=>idx!==i)),[]);
  const changeFu = useCallback((i,k,v)=>setFollowups(f=>f.map((fu,idx)=>idx===i?{...fu,[k]:v}:fu)),[]);

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),2200); };

  const generate = useCallback(async () => {
    if (!diagnosis.trim()) { setError("Please enter a diagnosis or reason for visit."); return; }
    setError(""); setLoading(true); setOutput(null);
    const medList = meds.filter(m=>m.name.trim()).map(m=>`${m.name}${m.freq?" — "+m.freq:""} [${m.status}]`).join("\n");
    const fuList = followups.map(f=>`${f.who} ${f.when} (${f.urgency})`).join("; ");
    const prompt = `You are an emergency physician creating discharge instructions. Generate clear, compassionate, diagnosis-specific discharge instructions.

Patient context:
- Name: ${patientName||"not provided"}
- Age/Sex: ${age||"adult"} ${sex}
- Diagnosis/Reason for visit: ${diagnosis}
- Language: ${lang}
- Reading level: ${level==="simple"?"Grade 5-6 plain language — short sentences, no medical jargon":"standard clear adult language"}
- Key findings / what happened: ${findings||"not specified"}
- Treatments/procedures done: ${procedures||"standard emergency care provided"}
- Medications: ${medList||"no medication changes"}
- Follow-up plan: ${fuList||"primary care within 3-5 days"}
- Special instructions: ${special||"none"}

Return ONLY a valid JSON object with exactly these fields. No markdown fences. No preamble.
{
  "whatHappened": "2-3 sentence plain-language explanation of what brought them to the ER and what was found. Write in ${lang}.",
  "whatWeDid": ["bullet: what was done", "bullet: test or treatment", "..."],
  "medications": [
    {"name":"medication name only","dose":"dose and exact schedule in plain language","why":"one sentence why","status":"New|Continued|Changed|Stopped|As Needed (PRN)","warning":"important warning or empty string"}
  ],
  "returnNow": ["specific emergency sign for THIS diagnosis 1", "..."],
  "callDoctor": ["less urgent concern specific to THIS diagnosis 1", "..."],
  "followUp": [
    {"provider":"who to see","timeframe":"when","why":"brief reason","urgency":"urgent|routine"}
  ],
  "selfCare": ["specific home care instruction for THIS diagnosis 1", "..."],
  "handoffSummary": "2-3 sentence clinical paragraph for the next provider: key findings, workup performed, results, outstanding items, and follow-up rationale. Use medical language.",
  "keyReminder": "THE single most important actionable thing for this specific patient"
}

Make the return precautions, self-care, and follow-up SPECIFIC to ${diagnosis} — not generic boilerplate. The patient should feel these were written just for them.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:1800,
          messages:[{role:"user",content:prompt}]
        })
      });
      const data = await res.json();
      const raw = data?.content?.[0]?.text || "";
      const clean = raw.replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(clean);
      setOutput(parsed);
      setTab("preview");
    } catch(e) {
      setError("Generation failed — check connection and try again. "+e.message);
    } finally { setLoading(false); }
  }, [diagnosis, patientName, age, sex, lang, level, findings, procedures, special, meds, followups]);

  const handleCopy = useCallback(()=>{
    if (!output) return;
    const lines = [
      `DISCHARGE INSTRUCTIONS — ${diagnosis}`,
      patientName ? `Patient: ${patientName}` : "",
      new Date().toLocaleDateString(),
      "", "WHY YOU WERE HERE", output.whatHappened||"",
      "", "WHAT WE FOUND & DID", ...(output.whatWeDid||[]).map(x=>"• "+x),
      "", "⚠ RETURN TO ER IMMEDIATELY IF:", ...(output.returnNow||[]).map(x=>"• "+x),
      "", "CALL YOUR DOCTOR IF:", ...(output.callDoctor||[]).map(x=>"• "+x),
      "", "YOUR MEDICATIONS:", ...(output.medications||[]).map(m=>`• ${m.name} — ${m.dose||""} [${m.status}]${m.why?" — "+m.why:""}`),
      "", "FOLLOW-UP PLAN:", ...(output.followUp||[]).map(f=>`• ${f.provider}: ${f.timeframe}`),
      "", "HOME CARE:", ...(output.selfCare||[]).map(x=>"• "+x),
      "", "⭐ MOST IMPORTANT:", output.keyReminder||"",
      "", "--- FOR NEXT PROVIDER ---", output.handoffSummary||"",
    ].filter(l=>l!==undefined).join("\n");
    navigator.clipboard.writeText(lines).then(()=>showToast("Copied to clipboard!")).catch(()=>showToast("Copy failed — use print instead"));
  }, [output, diagnosis, patientName]);

  const handlePrint = useCallback(()=>window.print(),[]);

  const inputStyle = {width:"100%",background:"rgba(14,37,68,0.7)",border:"1px solid rgba(42,79,122,0.4)",borderRadius:8,padding:"7px 10px",color:T.txt,fontFamily:"DM Sans",fontSize:12,outline:"none"};
  const selectStyle = {...inputStyle,cursor:"pointer"};

  return (
    <div style={{fontFamily:"DM Sans, sans-serif",background:T.bg,minHeight:"100vh",position:"relative",overflowX:"hidden",color:T.txt}}>
      <AmbientBg/>
      {toast && <Toast msg={toast}/>}
      <div style={{position:"relative",zIndex:1,maxWidth:1260,margin:"0 auto",padding:"0 16px"}}>

        {/* Header */}
        <div style={{padding:"18px 0 14px"}} className="sdh-no-print">
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:9}}>
            <div style={{backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",background:"rgba(5,15,30,0.9)",border:"1px solid rgba(42,79,122,0.6)",borderRadius:10,padding:"5px 12px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.gold,letterSpacing:3}}>NOTRYA</span>
              <span style={{color:T.txt4,fontFamily:"JetBrains Mono",fontSize:10}}>/</span>
              <span style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.txt3,letterSpacing:2}}>DISCHARGE</span>
            </div>
            <div style={{height:1,flex:1,background:"linear-gradient(90deg,rgba(0,229,192,0.5),transparent)"}}/>
            {onBack && <button onClick={onBack} style={{fontFamily:"DM Sans",fontSize:11,fontWeight:600,padding:"5px 14px",borderRadius:8,cursor:"pointer",border:"1px solid rgba(42,79,122,0.5)",background:"rgba(14,37,68,0.6)",color:T.txt3}}>← Hub</button>}
          </div>
          <h1 style={{fontFamily:"Playfair Display",fontSize:"clamp(24px,4vw,38px)",fontWeight:900,letterSpacing:-1,lineHeight:1.1,marginBottom:4,background:"linear-gradient(90deg,#e8f0fe 0%,#3dffa0 40%,#3b9eff 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>SmartDischargeHub</h1>
          <p style={{fontFamily:"DM Sans",fontSize:12,color:T.txt3}}>AI-Generated · Diagnosis-Specific · Plain Language · Return Precautions · Medication Reconciliation · Clinical Handoff</p>
        </div>

        {/* Tabs */}
        <div className="sdh-no-print" style={{...glass,padding:"5px",display:"flex",gap:4,marginBottom:16}}>
          {[{id:"build",label:"📝  Build Instructions"},{id:"preview",label:"📄  Preview & Print",badge:output?"Ready":""}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{flex:"1 1 auto",fontFamily:"DM Sans",fontWeight:600,fontSize:12,padding:"9px 8px",borderRadius:9,cursor:"pointer",textAlign:"center",transition:"all .15s",
                border:`1px solid ${tab===t.id?"rgba(0,229,192,0.5)":"transparent"}`,
                background:tab===t.id?"linear-gradient(135deg,rgba(0,229,192,0.14),rgba(0,229,192,0.05))":"transparent",
                color:tab===t.id?T.teal:T.txt3}}>
              {t.label}{t.badge&&<span style={{marginLeft:8,fontFamily:"JetBrains Mono",fontSize:8,color:T.green,background:"rgba(61,255,160,0.12)",border:"1px solid rgba(61,255,160,0.3)",borderRadius:20,padding:"1px 7px"}}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* BUILD TAB */}
        {tab==="build" && (
          <div className="sdh-fade sdh-no-print" style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:16}}>

            {/* Left column */}
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{...glass,padding:"16px 18px"}}>
                <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:14,color:T.teal,marginBottom:12}}>Patient & Visit</div>
                <div style={{marginBottom:10}}><FieldLabel>Diagnosis / Reason for Visit *</FieldLabel>
                  <input value={diagnosis} onChange={e=>setDiagnosis(e.target.value)} placeholder="e.g. Right lower lobe pneumonia" style={inputStyle}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                  <div><FieldLabel>Patient Name (optional)</FieldLabel>
                    <input value={patientName} onChange={e=>setPatientName(e.target.value)} placeholder="For personalization" style={inputStyle}/>
                  </div>
                  <div><FieldLabel>Age</FieldLabel>
                    <input value={age} onChange={e=>setAge(e.target.value)} placeholder="e.g. 67-year-old" style={inputStyle}/>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                  <div><FieldLabel>Pronoun / Sex</FieldLabel>
                    <select value={sex} onChange={e=>setSex(e.target.value)} style={selectStyle}>
                      <option value="the patient">Gender-neutral</option>
                      <option value="he">He/Him</option>
                      <option value="she">She/Her</option>
                      <option value="they">They/Them</option>
                    </select>
                  </div>
                  <div><FieldLabel>Language</FieldLabel>
                    <select value={lang} onChange={e=>setLang(e.target.value)} style={selectStyle}>
                      {LANGS.map(([v,l])=><option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div><FieldLabel>Reading Level</FieldLabel>
                  <select value={level} onChange={e=>setLevel(e.target.value)} style={selectStyle}>
                    {LEVELS.map(([v,l])=><option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div style={{...glass,padding:"16px 18px"}}>
                <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:14,color:T.blue,marginBottom:12}}>Clinical Context</div>
                <div style={{marginBottom:10}}><FieldLabel>Key Findings / What Happened</FieldLabel>
                  <Textarea value={findings} onChange={setFindings} placeholder="e.g. CXR: RLL consolidation. WBC 14.2, CRP elevated. Afebrile, O2 sat 96% on RA at discharge. No bacteremia." rows={3}/>
                </div>
                <div><FieldLabel>Treatments & Procedures Done in ED</FieldLabel>
                  <Textarea value={procedures} onChange={setProcedures} placeholder="e.g. IV azithromycin given. Started on levofloxacin. IV fluids. Urine culture sent." rows={3}/>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{...glass,padding:"16px 18px"}}>
                <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:14,color:T.purple,marginBottom:12}}>Medication Reconciliation</div>
                <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt3,marginBottom:10}}>Name + dose/frequency · Select status for each</div>
                {meds.map((med,i)=><MedRow key={i} med={med} idx={i} onChange={changeMed} onRemove={removeMed}/>)}
                <AddButton onClick={addMed} label="Add Medication"/>
              </div>

              <div style={{...glass,padding:"16px 18px"}}>
                <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:14,color:T.gold,marginBottom:12}}>Follow-Up Plan</div>
                <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt3,marginBottom:10}}>Who to see · When · Urgency level</div>
                {followups.map((fu,i)=><FollowUpRow key={i} fu={fu} idx={i} onChange={changeFu} onRemove={removeFu}/>)}
                <AddButton onClick={addFu} label="Add Follow-Up"/>
              </div>

              <div style={{...glass,padding:"16px 18px"}}>
                <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:14,color:T.orange,marginBottom:12}}>Special Instructions</div>
                <FieldLabel>Activity, Diet, Wound Care, Restrictions</FieldLabel>
                <Textarea value={special} onChange={setSpecial} placeholder="e.g. No driving for 24h. Clear liquids advancing to regular diet as tolerated. No heavy lifting > 5 lbs for 2 weeks. Wound check in 3 days." rows={4}/>
              </div>

              {error && <div style={{padding:"10px 14px",borderRadius:10,background:"rgba(255,68,68,0.1)",border:"1px solid rgba(255,68,68,0.3)",fontFamily:"DM Sans",fontSize:12,color:T.coral}}>{error}</div>}

              <button onClick={generate} disabled={loading}
                style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:16,padding:"16px",borderRadius:12,cursor:loading?"wait":"pointer",border:`1px solid ${T.teal}55`,
                  background:loading?"rgba(0,229,192,0.06)":"linear-gradient(135deg,rgba(0,229,192,0.2),rgba(59,158,255,0.12))",
                  color:loading?T.txt3:T.teal,transition:"all .2s",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                {loading
                  ? <><span className="sdh-spin" style={{display:"inline-block",fontSize:18}}>⚙</span> Generating instructions...</>
                  : "✦ Generate Discharge Instructions"}
              </button>
            </div>
          </div>
        )}

        {/* PREVIEW TAB */}
        {tab==="preview" && (
          <div className="sdh-fade" ref={sheetRef}>
            {output
              ? <DischargeSheet data={output} patientName={patientName} diagnosis={diagnosis} lang={lang} onCopy={handleCopy} onPrint={handlePrint}/>
              : (
                <div style={{...glass,padding:"60px 20px",textAlign:"center"}}>
                  <div style={{fontSize:48,marginBottom:16}}>📄</div>
                  <div style={{fontFamily:"Playfair Display",fontWeight:700,fontSize:20,color:T.txt,marginBottom:8}}>No Instructions Generated Yet</div>
                  <div style={{fontFamily:"DM Sans",fontSize:13,color:T.txt3,marginBottom:20,maxWidth:400,margin:"0 auto 20px"}}>Fill in the Build tab with diagnosis, medications, and follow-up plan, then generate.</div>
                  <button onClick={()=>setTab("build")} style={{fontFamily:"DM Sans",fontWeight:600,fontSize:13,padding:"10px 24px",borderRadius:10,cursor:"pointer",border:`1px solid ${T.teal}44`,background:`rgba(0,229,192,0.1)`,color:T.teal}}>← Go to Build Tab</button>
                </div>
              )}
          </div>
        )}

        <div className="sdh-no-print" style={{textAlign:"center",paddingBottom:24,paddingTop:14}}>
          <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,letterSpacing:1.5}}>NOTRYA SMARTDISCHARGE · AI-GENERATED INSTRUCTIONS · REVIEW BEFORE PRINTING · NOT A SUBSTITUTE FOR CLINICAL JUDGMENT</span>
        </div>
      </div>
    </div>
  );
}