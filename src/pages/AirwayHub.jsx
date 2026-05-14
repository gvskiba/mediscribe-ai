import { useNavigate } from "react-router-dom";
import NotryaHubHeader from "@/components/HubHeader/NotryaHubHeader";

const T = {
  bg:"#050f1e",panel:"#081628",b:"rgba(26,53,85,0.8)",
  txt:"#f0f6ff",txt2:"#b8d4f0",txt3:"#7eb8e0",txt4:"#6698c0",
  coral:"#ff6b6b",gold:"#f5c842",teal:"#00e5c0",blue:"#3b9eff",
  orange:"#ff9f43",purple:"#9b6dff",green:"#3dffa0",cyan:"#00d4ff",
};

const HUBS = [
  {
    id:"RSIPage",icon:"💉",title:"Intubation Suite",
    sub:"RSI · Difficult Airway · DSI · Pediatric · Awake Intubation",
    color:"#f5c842",gl:"rgba(245,200,66,0.07)",br:"rgba(245,200,66,0.28)",
    badge:"DAS 2022",
    conditions:["RSI Protocol","Difficult Airway","DSI Protocol","Pediatric Airway","Awake Intubation"],
    tools:["RSI Proc Note","SOAP-ME Checklist","LEMON / HEAVEN","Push-Dose Epi","CICO Mode","Peds Tube Sizing"],
  },
  {
    id:"NIVPage",icon:"🌬️",title:"Oxygenation & NIV",
    sub:"Supplemental O₂ · HFNC · CPAP · BiPAP · ABG Interpreter",
    color:"#00d4ff",gl:"rgba(0,212,255,0.07)",br:"rgba(0,212,255,0.28)",
    badge:"BTS 2017",
    conditions:["Supplemental O₂","HFNC","CPAP","BiPAP / NIV"],
    tools:["ROX Index Tracker","ABG Interpreter","Nebulized Meds","MDM Snippets","Order Sets","HFNC Failure Criteria"],
  },
  {
    id:"VentPage",icon:"⚙️",title:"Invasive Ventilation",
    sub:"ARDS · ARDSNet · Vent Management · Weaning & Liberation",
    color:"#ff6b6b",gl:"rgba(255,107,107,0.07)",br:"rgba(255,107,107,0.28)",
    badge:"ARDSNet 2000",
    conditions:["ARDS / ARDSNet","Ventilator Management","Weaning & Liberation"],
    tools:["ARDSNet Calculator","Vent Settings Checker","RSBI Calculator","Prone Criteria","ABCDEF Bundle","Order Sets"],
  },
];

const STATS = [
  {icon:"⏱",label:"Pre-oxygenation",val:"≥3 min",color:"#f5c842"},
  {icon:"🏃",label:"Max attempts",val:"≤3 total",color:"#ff6b6b"},
  {icon:"📊",label:"ETT confirm",val:"ETCO₂ waveform",color:"#00e5c0"},
  {icon:"💤",label:"RASS target",val:"-1 to 0",color:"#3b9eff"},
];

const EV = ["DAS 2022","ARDSNet NEJM 2000","PROSEVA 2013","FLORALI 2015","BTS 2017","PADIS 2018","ABC Trial 2008","Roca ROX 2019","Hernandez JAMA 2016"];

export default function AirwayHub() {
  const navigate = useNavigate();
  return (
    <div style={{height:"100vh",background:T.bg,color:T.txt,fontFamily:"'DM Sans',sans-serif",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(26,53,85,0.9);border-radius:2px}button,input,textarea{font-family:inherit}`}</style>

      <NotryaHubHeader hubName="Airway Hub" category="Critical Care" homeUrl="/" />
      <div style={{background:T.panel,borderBottom:`1px solid ${T.b}`,padding:"10px 20px",flexShrink:0}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
          {STATS.map((s,i)=>(
            <div key={i} style={{background:"rgba(14,37,68,0.5)",border:`1px solid ${s.color}28`,borderRadius:9,padding:"8px 10px",textAlign:"center"}}>
              <div style={{fontSize:16,marginBottom:3}}>{s.icon}</div>
              <div style={{fontSize:8,color:T.txt2,textTransform:"uppercase",letterSpacing:".06em",marginBottom:2}}>{s.label}</div>
              <div style={{fontSize:12,fontWeight:700,color:s.color,fontFamily:"monospace"}}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"20px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:14,marginBottom:16}}>
          {HUBS.map(h=>(
            <div key={h.id} onClick={()=>navigate(`/${h.id}`)}
              style={{background:h.gl,border:`1px solid ${h.br}`,borderRadius:14,padding:"20px",cursor:"pointer",transition:"all .22s",position:"relative",overflow:"hidden",minHeight:230}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 14px 36px ${h.color}20`}}
              onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none"}}>
              <div style={{position:"absolute",top:-40,right:-40,width:120,height:120,borderRadius:"50%",background:`${h.color}08`,pointerEvents:"none"}} />
              <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:16}}>
                <div style={{width:50,height:50,borderRadius:13,background:h.gl,border:`1px solid ${h.br}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>{h.icon}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                    <span style={{fontSize:15,fontWeight:700,color:T.txt,fontFamily:"'Playfair Display',serif"}}>{h.title}</span>
                    <span style={{fontSize:8,fontWeight:700,padding:"2px 7px",borderRadius:20,background:`${h.color}12`,border:`1px solid ${h.color}35`,color:h.color,fontFamily:"monospace"}}>{h.badge}</span>
                  </div>
                  <div style={{fontSize:10,color:T.txt3}}>{h.sub}</div>
                </div>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontSize:9,color:T.txt2,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>Conditions</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {h.conditions.map(c=><span key={c} style={{fontSize:9,padding:"3px 9px",borderRadius:20,background:`${h.color}12`,border:`1px solid ${h.color}28`,color:h.color}}>{c}</span>)}
                </div>
              </div>
              <div>
                <div style={{fontSize:9,color:T.txt2,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>Clinical Tools</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {h.tools.map(t=><span key={t} style={{fontSize:9,padding:"3px 9px",borderRadius:20,background:"rgba(14,37,68,0.55)",border:`1px solid ${T.b}`,color:T.txt2}}>{t}</span>)}
                </div>
              </div>
              <div style={{position:"absolute",bottom:16,right:16,fontSize:20,color:h.color,opacity:.5,fontWeight:700}}>→</div>
            </div>
          ))}
        </div>

        <div style={{padding:"10px 16px",background:"rgba(14,37,68,0.4)",border:`1px solid ${T.b}`,borderRadius:10,display:"flex",gap:14,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:9,fontWeight:700,color:T.txt2,textTransform:"uppercase",letterSpacing:".07em",flexShrink:0}}>Evidence Base</span>
          {EV.map(e=><span key={e} style={{fontSize:9,color:T.txt2,fontFamily:"monospace"}}>{e}</span>)}
        </div>
      </div>
    </div>
  );
}