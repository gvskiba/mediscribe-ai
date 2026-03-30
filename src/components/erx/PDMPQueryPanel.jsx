import { useState } from "react";

const T = {
  bg:"#050f1e",panel:"#081628",card:"#0b1e36",up:"#0e2544",
  txt:"#e8f0fe",txt2:"#8aaccc",txt3:"#4a6a8a",txt4:"#2e4a6a",
  coral:"#ff6b6b",gold:"#f5c842",teal:"#00e5c0",blue:"#3b9eff",
  orange:"#ff9f43",purple:"#9b6dff",green:"#3dffa0",cyan:"#00d4ff",
};
const glass = (x={}) => ({backdropFilter:"blur(24px) saturate(200%)",WebkitBackdropFilter:"blur(24px) saturate(200%)",background:"rgba(8,22,40,0.78)",border:"1px solid rgba(26,53,85,0.5)",borderRadius:14,...x});
const inp = (focus) => ({width:"100%",background:"rgba(14,37,68,0.8)",border:`1px solid ${focus?"rgba(59,158,255,0.6)":"rgba(26,53,85,0.55)"}`,borderRadius:9,padding:"9px 13px",color:T.txt,fontFamily:"DM Sans",fontSize:13,outline:"none",boxSizing:"border-box",transition:"border-color .15s"});

function Badge({ label, color }) {
  return (
    <span style={{ fontFamily:"JetBrains Mono",fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:20,background:`${color}18`,border:`1px solid ${color}44`,color,whiteSpace:"nowrap",textTransform:"uppercase",letterSpacing:1 }}>
      {label}
    </span>
  );
}

const schedCol = s => ({ "II":T.coral, "III":T.orange, "IV":T.gold, "V":T.green })[s] || null;

const US_STATES = [
  {code:"AL",name:"Alabama",pdmpName:"Alabama Prescription Drug Monitoring Program",network:"PMP InterConnect"},
  {code:"AK",name:"Alaska",pdmpName:"Alaska Prescription Drug Monitoring Program",network:"PMP InterConnect"},
  {code:"AZ",name:"Arizona",pdmpName:"AZPMP",network:"PMP InterConnect"},
  {code:"AR",name:"Arkansas",pdmpName:"Arkansas PMP",network:"PMP InterConnect"},
  {code:"CA",name:"California",pdmpName:"CURES 2.0 (Controlled Substance Utilization Review and Evaluation System)",network:"Direct / CURES"},
  {code:"CO",name:"Colorado",pdmpName:"Colorado Prescription Drug Monitoring Program (PDMP)",network:"PMP InterConnect"},
  {code:"CT",name:"Connecticut",pdmpName:"Connecticut PMP",network:"PMP InterConnect"},
  {code:"DE",name:"Delaware",pdmpName:"Delaware PDMP",network:"PMP InterConnect"},
  {code:"DC",name:"D.C.",pdmpName:"DC PMP",network:"PMP InterConnect"},
  {code:"FL",name:"Florida",pdmpName:"Florida PDMP — E-FORCSE",network:"PMP InterConnect"},
  {code:"GA",name:"Georgia",pdmpName:"Georgia Prescription Monitoring Program",network:"PMP InterConnect"},
  {code:"HI",name:"Hawaii",pdmpName:"Hawaii PDMP",network:"PMP InterConnect"},
  {code:"ID",name:"Idaho",pdmpName:"Idaho PMP",network:"PMP InterConnect"},
  {code:"IL",name:"Illinois",pdmpName:"Illinois Prescription Monitoring Program (PMP)",network:"PMP InterConnect"},
  {code:"IN",name:"Indiana",pdmpName:"Indiana Scheduled Prescription Electronic Collection & Tracking (INSPECT)",network:"PMP InterConnect"},
  {code:"IA",name:"Iowa",pdmpName:"Iowa Prescription Monitoring Program",network:"PMP InterConnect"},
  {code:"KS",name:"Kansas",pdmpName:"Kansas Prescription Monitoring Program",network:"PMP InterConnect"},
  {code:"KY",name:"Kentucky",pdmpName:"Kentucky All Schedule Prescription Electronic Reporting (KASPER)",network:"PMP InterConnect"},
  {code:"LA",name:"Louisiana",pdmpName:"Louisiana PMP",network:"PMP InterConnect"},
  {code:"ME",name:"Maine",pdmpName:"Maine Prescription Monitoring Program",network:"PMP InterConnect"},
  {code:"MD",name:"Maryland",pdmpName:"Maryland PDMP",network:"PMP InterConnect"},
  {code:"MA",name:"Massachusetts",pdmpName:"Massachusetts PMP — Appriss NarxCare",network:"PMP InterConnect"},
  {code:"MI",name:"Michigan",pdmpName:"Michigan Automated Prescription System (MAPS)",network:"PMP InterConnect"},
  {code:"MN",name:"Minnesota",pdmpName:"Minnesota PDMP",network:"PMP InterConnect"},
  {code:"MS",name:"Mississippi",pdmpName:"Mississippi PMP",network:"PMP InterConnect"},
  {code:"MO",name:"Missouri",pdmpName:"Missouri PDMP",network:"PMP InterConnect"},
  {code:"MT",name:"Montana",pdmpName:"Montana PDMP",network:"PMP InterConnect"},
  {code:"NE",name:"Nebraska",pdmpName:"Nebraska PMP",network:"PMP InterConnect"},
  {code:"NV",name:"Nevada",pdmpName:"Nevada PMP",network:"PMP InterConnect"},
  {code:"NH",name:"New Hampshire",pdmpName:"New Hampshire PDMP",network:"PMP InterConnect"},
  {code:"NJ",name:"New Jersey",pdmpName:"NJ Prescription Monitoring Program",network:"PMP InterConnect"},
  {code:"NM",name:"New Mexico",pdmpName:"New Mexico PMP",network:"PMP InterConnect"},
  {code:"NY",name:"New York",pdmpName:"New York State Prescription Monitoring Program (I-STOP)",network:"PMP InterConnect"},
  {code:"NC",name:"North Carolina",pdmpName:"NC STOP Act — Controlled Substances Reporting System (CSRS)",network:"PMP InterConnect"},
  {code:"ND",name:"North Dakota",pdmpName:"North Dakota PDMP",network:"PMP InterConnect"},
  {code:"OH",name:"Ohio",pdmpName:"Ohio Automated Rx Reporting System (OARRS)",network:"PMP InterConnect"},
  {code:"OK",name:"Oklahoma",pdmpName:"Oklahoma PDMP",network:"PMP InterConnect"},
  {code:"OR",name:"Oregon",pdmpName:"Oregon PDMP",network:"PMP InterConnect"},
  {code:"PA",name:"Pennsylvania",pdmpName:"Pennsylvania Prescription Drug Monitoring Program",network:"PMP InterConnect"},
  {code:"RI",name:"Rhode Island",pdmpName:"Rhode Island PDMP",network:"PMP InterConnect"},
  {code:"SC",name:"South Carolina",pdmpName:"South Carolina PDMP",network:"PMP InterConnect"},
  {code:"SD",name:"South Dakota",pdmpName:"South Dakota PDMP",network:"PMP InterConnect"},
  {code:"TN",name:"Tennessee",pdmpName:"Tennessee Controlled Substance Monitoring Database (CSMD)",network:"PMP InterConnect"},
  {code:"TX",name:"Texas",pdmpName:"Texas Prescription Monitoring Program (TXPMP)",network:"PMP InterConnect"},
  {code:"UT",name:"Utah",pdmpName:"Utah Controlled Substance Database",network:"PMP InterConnect"},
  {code:"VT",name:"Vermont",pdmpName:"Vermont PDMP",network:"PMP InterConnect"},
  {code:"VA",name:"Virginia",pdmpName:"Virginia Prescription Monitoring Program",network:"PMP InterConnect"},
  {code:"WA",name:"Washington",pdmpName:"Washington PMP",network:"PMP InterConnect"},
  {code:"WV",name:"West Virginia",pdmpName:"West Virginia Controlled Substances Monitoring Program (CSMP)",network:"PMP InterConnect"},
  {code:"WI",name:"Wisconsin",pdmpName:"Wisconsin PDMP",network:"PMP InterConnect"},
  {code:"WY",name:"Wyoming",pdmpName:"Wyoming PDMP",network:"PMP InterConnect"},
];

const MOCK_PDMP_RESULTS = {
  low: {
    riskLevel:"low", narxOpioid:72, narxSedative:45, narxStimulant:18,
    overdoseRisk:"Low", mme:12, flags:[],
    prescriptions:[
      {drug:"Hydrocodone/APAP 5/325mg",qty:30,days:30,filled:"2025-10-14",prescriber:"Dr. Maria Santos MD",prescriberDEA:"FS1234567",pharmacy:"CVS #4421, Springfield",schedule:"II",mme:5.0},
      {drug:"Lorazepam 0.5mg",qty:30,days:30,filled:"2025-10-01",prescriber:"Dr. James Weller MD",prescriberDEA:"FW9876543",pharmacy:"Walgreens #2210, Springfield",schedule:"IV",mme:0},
      {drug:"Tramadol 50mg",qty:20,days:10,filled:"2025-07-22",prescriber:"Dr. Maria Santos MD",prescriberDEA:"FS1234567",pharmacy:"CVS #4421, Springfield",schedule:"IV",mme:1.5},
    ],
    prescriberCount:2, pharmacyCount:2, statesBeyond:0, lastQueryDate:"2025-11-18",
  },
  moderate: {
    riskLevel:"moderate", narxOpioid:385, narxSedative:290, narxStimulant:42,
    overdoseRisk:"Moderate", mme:48,
    flags:[
      {type:"warning", msg:"2 prescribers for opioids in last 90 days"},
      {type:"warning", msg:"2 pharmacies dispensing controlled substances"},
      {type:"warning", msg:"Concurrent opioid + benzodiazepine (FDA Black Box risk)"},
      {type:"warning", msg:"MME approaching threshold: 48 MME/day (threshold 50)"},
    ],
    prescriptions:[
      {drug:"Oxycodone 10mg",qty:60,days:30,filled:"2025-11-10",prescriber:"Dr. A. Rodriguez MD",prescriberDEA:"AR3345678",pharmacy:"Rite Aid #1102, Riverside",schedule:"II",mme:15.0},
      {drug:"Alprazolam 1mg",qty:90,days:30,filled:"2025-11-05",prescriber:"Dr. B. Chen MD",prescriberDEA:"BC8891234",pharmacy:"Walgreens #5503, Riverside",schedule:"IV",mme:0},
      {drug:"Oxycodone 5mg",qty:60,days:30,filled:"2025-10-10",prescriber:"Dr. A. Rodriguez MD",prescriberDEA:"AR3345678",pharmacy:"Rite Aid #1102, Riverside",schedule:"II",mme:7.5},
      {drug:"Alprazolam 1mg",qty:90,days:30,filled:"2025-10-03",prescriber:"Dr. B. Chen MD",prescriberDEA:"BC8891234",pharmacy:"CVS #2211, Riverside",schedule:"IV",mme:0},
      {drug:"Hydrocodone/APAP 10/325mg",qty:30,days:15,filled:"2025-09-14",prescriber:"Dr. C. Park MD",prescriberDEA:"CP5567890",pharmacy:"Walgreens #5503, Riverside",schedule:"II",mme:10.0},
      {drug:"Zolpidem 10mg",qty:30,days:30,filled:"2025-08-28",prescriber:"Dr. B. Chen MD",prescriberDEA:"BC8891234",pharmacy:"CVS #2211, Riverside",schedule:"IV",mme:0},
    ],
    prescriberCount:3, pharmacyCount:3, statesBeyond:0, lastQueryDate:null,
  },
  high: {
    riskLevel:"high", narxOpioid:741, narxSedative:612, narxStimulant:88,
    overdoseRisk:"High", mme:142,
    flags:[
      {type:"critical", msg:"5 opioid prescribers in last 90 days — potential 'doctor shopping'"},
      {type:"critical", msg:"4 pharmacies dispensing controlled substances in 90 days"},
      {type:"critical", msg:"MME: 142/day — EXCEEDS 90 MME/day high-risk threshold (CDC 2022)"},
      {type:"critical", msg:"Out-of-state controlled substance fill detected (2 states)"},
      {type:"critical", msg:"Concurrent Schedule II opioid + benzodiazepine + stimulant"},
      {type:"warning",  msg:"Early refill pattern: 3 fills in last 90 days with < 80% days supply elapsed"},
      {type:"warning",  msg:"Naloxone not currently prescribed — co-prescribe recommended"},
    ],
    prescriptions:[
      {drug:"Oxycodone ER 40mg",qty:60,days:30,filled:"2025-11-12",prescriber:"Dr. D. Williams MD",prescriberDEA:"DW1122334",pharmacy:"Express Scripts (mail-order)",schedule:"II",mme:60.0},
      {drug:"Oxycodone 10mg",qty:60,days:30,filled:"2025-11-08",prescriber:"Dr. E. Thompson MD",prescriberDEA:"ET4455667",pharmacy:"CVS #8801, Metro City",schedule:"II",mme:15.0},
      {drug:"Clonazepam 2mg",qty:90,days:30,filled:"2025-11-05",prescriber:"Dr. F. Martinez MD",prescriberDEA:"FM7788990",pharmacy:"Walgreens #3309, Metro City",schedule:"IV",mme:0},
      {drug:"Amphetamine Salts 30mg",qty:60,days:30,filled:"2025-11-01",prescriber:"Dr. G. Lee MD",prescriberDEA:"GL2233445",pharmacy:"Rite Aid #0041, Metro City",schedule:"II",mme:0},
      {drug:"Morphine ER 30mg",qty:60,days:30,filled:"2025-10-25",prescriber:"Dr. H. Patel MD (OUT OF STATE — TX)",prescriberDEA:"HP9900112",pharmacy:"Kroger Pharmacy, Houston TX",schedule:"II",mme:30.0},
      {drug:"Hydromorphone 4mg",qty:60,days:30,filled:"2025-10-10",prescriber:"Dr. D. Williams MD",prescriberDEA:"DW1122334",pharmacy:"Express Scripts (mail-order)",schedule:"II",mme:26.0},
      {drug:"Alprazolam 2mg",qty:90,days:30,filled:"2025-10-06",prescriber:"Dr. F. Martinez MD",prescriberDEA:"FM7788990",pharmacy:"CVS #8801, Metro City",schedule:"IV",mme:0},
      {drug:"Oxycodone 20mg",qty:60,days:30,filled:"2025-09-28",prescriber:"Dr. I. Nguyen MD (OUT OF STATE — NV)",prescriberDEA:"IN5566778",pharmacy:"Walgreens, Las Vegas NV",schedule:"II",mme:30.0},
    ],
    prescriberCount:6, pharmacyCount:5, statesBeyond:2, lastQueryDate:null,
  },
};

export default function PDMPQueryPanel() {
  const [selectedState, setSelectedState] = useState("CA");
  const [firstName,  setFirstName]  = useState("");
  const [lastName,   setLastName]   = useState("");
  const [dob,        setDob]        = useState("");
  const [ssnLast4,   setSsnLast4]   = useState("");
  const [attested,   setAttested]   = useState(false);
  const [querying,   setQuerying]   = useState(false);
  const [queryResult,setQueryResult]= useState(null);
  const [queryTime,  setQueryTime]  = useState(null);
  const [queryError, setQueryError] = useState(null);
  const [demoProfile,setDemoProfile]= useState("moderate");
  const [showRaw,    setShowRaw]    = useState(false);

  const stateInfo = US_STATES.find(s=>s.code===selectedState);
  const canQuery = firstName.trim() && lastName.trim() && dob && attested;

  const handleQuery = async () => {
    if (!canQuery) return;
    setQuerying(true); setQueryResult(null); setQueryError(null);
    await new Promise(r => setTimeout(r, 1800 + Math.random()*800));
    setQuerying(false);
    setQueryResult(MOCK_PDMP_RESULTS[demoProfile]);
    setQueryTime(new Date().toLocaleString());
  };

  const narxColor = (score) => {
    if (score < 200) return T.green;
    if (score < 450) return T.gold;
    if (score < 650) return T.orange;
    return T.coral;
  };

  const narxLabel = (score) => {
    if (score < 200) return "Low";
    if (score < 450) return "Moderate";
    if (score < 650) return "High";
    return "Very High";
  };

  const riskBg = (level) => ({
    low:      {bg:"rgba(61,255,160,0.08)",  border:"rgba(61,255,160,0.3)",   color:T.green},
    moderate: {bg:"rgba(245,200,66,0.08)",  border:"rgba(245,200,66,0.35)",  color:T.gold},
    high:     {bg:"rgba(255,107,107,0.10)", border:"rgba(255,107,107,0.45)", color:T.coral},
  })[level] || {bg:"rgba(8,22,40,0.8)",border:"rgba(26,53,85,0.5)",color:T.txt3};

  const scheduleColor = (sch) => ({II:T.coral,III:T.orange,IV:T.gold,V:T.green})[sch]||T.txt3;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* Connection status */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div style={{...glass({borderRadius:12,background:"rgba(0,229,192,0.06)",borderColor:"rgba(0,229,192,0.3)"}),padding:"12px 16px"}}>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.teal,textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>🟢 NETWORK STATUS</div>
          <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:13,color:T.txt,marginBottom:2}}>PMP InterConnect</div>
          <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3}}>Nationwide PDMP hub · 50 states connected</div>
          {queryTime && <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.teal,marginTop:6}}>Last query: {queryTime}</div>}
        </div>
        <div style={{...glass({borderRadius:12}),padding:"12px 16px"}}>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt3,textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>STATE SYSTEM</div>
          <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:12,color:T.txt,marginBottom:2,lineHeight:1.4}}>{stateInfo?.pdmpName||"—"}</div>
          <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.blue}}>via {stateInfo?.network}</div>
        </div>
      </div>

      {/* Query form */}
      <div style={{...glass({borderRadius:14}),padding:"18px 20px"}}>
        <div style={{fontFamily:"JetBrains Mono",fontSize:10,color:T.coral,textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>🔍 PATIENT PDMP QUERY</div>
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontFamily:"DM Sans",fontSize:10,fontWeight:600,color:T.txt3,textTransform:"uppercase",letterSpacing:".06em",marginBottom:5}}>Query State <span style={{color:T.coral}}>*</span></label>
          <select value={selectedState} onChange={e=>setSelectedState(e.target.value)}
            style={{...inp(false),cursor:"pointer",fontWeight:600}}>
            {US_STATES.map(s=><option key={s.code} value={s.code}>{s.code} — {s.name}</option>)}
          </select>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
          <div>
            <label style={{display:"block",fontFamily:"DM Sans",fontSize:10,fontWeight:600,color:T.txt3,textTransform:"uppercase",letterSpacing:".06em",marginBottom:5}}>Patient First Name <span style={{color:T.coral}}>*</span></label>
            <input value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="First name" style={inp(!!firstName)}/>
          </div>
          <div>
            <label style={{display:"block",fontFamily:"DM Sans",fontSize:10,fontWeight:600,color:T.txt3,textTransform:"uppercase",letterSpacing:".06em",marginBottom:5}}>Patient Last Name <span style={{color:T.coral}}>*</span></label>
            <input value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Last name" style={inp(!!lastName)}/>
          </div>
          <div>
            <label style={{display:"block",fontFamily:"DM Sans",fontSize:10,fontWeight:600,color:T.txt3,textTransform:"uppercase",letterSpacing:".06em",marginBottom:5}}>Date of Birth <span style={{color:T.coral}}>*</span></label>
            <input type="date" value={dob} onChange={e=>setDob(e.target.value)} style={{...inp(!!dob),cursor:"pointer"}}/>
          </div>
          <div>
            <label style={{display:"block",fontFamily:"DM Sans",fontSize:10,fontWeight:600,color:T.txt3,textTransform:"uppercase",letterSpacing:".06em",marginBottom:5}}>SSN Last 4 (optional)</label>
            <input value={ssnLast4} onChange={e=>setSsnLast4(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="xxxx" maxLength={4}
              style={{...inp(false),letterSpacing:4,fontFamily:"JetBrains Mono",fontSize:14}}/>
          </div>
        </div>
        <div style={{marginBottom:14,padding:"10px 14px",background:"rgba(59,158,255,0.06)",border:"1px solid rgba(59,158,255,0.2)",borderRadius:10}}>
          <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.blue,textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>🎓 DEMO MODE — Select Simulated Risk Profile</div>
          <div style={{display:"flex",gap:8}}>
            {[{id:"low",label:"Low Risk",c:T.green},{id:"moderate",label:"Moderate Risk",c:T.gold},{id:"high",label:"High Risk / Flags",c:T.coral}].map(p=>(
              <button key={p.id} onClick={()=>setDemoProfile(p.id)}
                style={{flex:1,padding:"7px 10px",borderRadius:8,border:`1px solid ${demoProfile===p.id?p.c+"66":"rgba(42,77,114,0.35)"}`,background:demoProfile===p.id?`${p.c}18`:"transparent",color:demoProfile===p.id?p.c:T.txt4,fontFamily:"DM Sans",fontWeight:700,fontSize:11.5,cursor:"pointer"}}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:16,padding:"12px 14px",background:attested?"rgba(61,255,160,0.07)":"rgba(255,107,107,0.06)",border:`1px solid ${attested?"rgba(61,255,160,0.3)":"rgba(255,107,107,0.3)"}`,borderRadius:10}}>
          <button onClick={()=>setAttested(!attested)}
            style={{display:"flex",alignItems:"flex-start",gap:10,background:"transparent",border:"none",cursor:"pointer",padding:0,width:"100%",textAlign:"left"}}>
            <div style={{width:20,height:20,borderRadius:5,background:attested?T.green:"transparent",border:`2px solid ${attested?T.green:T.coral}`,flexShrink:0,marginTop:2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#050f1e",transition:"all .15s"}}>
              {attested && "✓"}
            </div>
            <div>
              <div style={{fontFamily:"DM Sans",fontWeight:700,fontSize:12.5,color:attested?T.green:T.coral,marginBottom:3}}>
                Provider Attestation — Required by {stateInfo?.name} state law
              </div>
              <div style={{fontFamily:"DM Sans",fontSize:11.5,color:T.txt2,lineHeight:1.6}}>
                I attest that I am a licensed healthcare provider authorized to access the {stateInfo?.name} PDMP for a legitimate medical purpose, as required under {stateInfo?.code} state law.
              </div>
            </div>
          </button>
        </div>
        <button onClick={handleQuery} disabled={!canQuery||querying}
          style={{width:"100%",padding:"13px",borderRadius:11,background:canQuery&&!querying?`linear-gradient(135deg,${T.coral},#c0392b)`:"rgba(26,53,85,0.4)",border:"none",color:canQuery&&!querying?"#fff":T.txt4,fontWeight:700,fontSize:14,cursor:canQuery&&!querying?"pointer":"not-allowed",fontFamily:"DM Sans",transition:"all .2s",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          {querying ? (
            <><div style={{width:16,height:16,border:`2px solid ${T.coral}`,borderTopColor:"transparent",borderRadius:"50%",animation:"erx-spin 1s linear infinite"}}/>Querying {stateInfo?.pdmpName}…</>
          ) : !attested ? "✓ Complete Attestation to Query PDMP" : `🔍 Query ${selectedState} PDMP — ${firstName||"Patient"} ${lastName||""}`}
        </button>
        {queryError && <div style={{marginTop:10,padding:"10px 14px",background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.35)",borderRadius:9,fontFamily:"DM Sans",fontSize:12,color:T.coral}}>⚠ Query failed: {queryError}</div>}
      </div>

      {/* Results */}
      {queryResult && (() => {
        const r = queryResult;
        const rb = riskBg(r.riskLevel);
        return (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{...glass({borderRadius:14,background:rb.bg,borderColor:rb.border}),padding:"16px 20px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,marginBottom:12}}>
                <div>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:rb.color,textTransform:"uppercase",letterSpacing:2,marginBottom:4}}>PDMP RESULTS — {firstName} {lastName} · {stateInfo?.code} · {queryTime}</div>
                  <div style={{fontFamily:"Playfair Display",fontSize:18,fontWeight:700,color:T.txt}}>Overall Risk: <span style={{color:rb.color}}>{r.overdoseRisk}</span></div>
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <div style={{padding:"6px 14px",borderRadius:20,background:`${rb.color}22`,border:`1px solid ${rb.color}55`,fontFamily:"JetBrains Mono",fontSize:11,fontWeight:700,color:rb.color}}>{r.prescriberCount} Prescribers</div>
                  <div style={{padding:"6px 14px",borderRadius:20,background:`${rb.color}22`,border:`1px solid ${rb.color}55`,fontFamily:"JetBrains Mono",fontSize:11,fontWeight:700,color:rb.color}}>{r.pharmacyCount} Pharmacies</div>
                  {r.statesBeyond > 0 && <div style={{padding:"6px 14px",borderRadius:20,background:"rgba(255,107,107,0.2)",border:"1px solid rgba(255,107,107,0.5)",fontFamily:"JetBrains Mono",fontSize:11,fontWeight:700,color:T.coral}}>⚠ {r.statesBeyond} Out-of-State Fill{r.statesBeyond>1?"s":""}</div>}
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:12}}>
                {[{label:"NarxScore™ Opioid",val:r.narxOpioid,icon:"💊"},{label:"NarxScore™ Sedative",val:r.narxSedative,icon:"😴"},{label:"NarxScore™ Stimulant",val:r.narxStimulant,icon:"⚡"}].map((ns,i)=>{
                  const nc = narxColor(ns.val);
                  return (
                    <div key={i} style={{background:"rgba(5,15,30,0.7)",borderRadius:12,padding:"12px 14px",border:`1px solid ${nc}33`}}>
                      <div style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3,marginBottom:6}}>{ns.icon} {ns.label}</div>
                      <div style={{fontFamily:"JetBrains Mono",fontWeight:900,fontSize:28,color:nc,lineHeight:1}}>{ns.val}</div>
                      <div style={{fontFamily:"DM Sans",fontSize:10,color:nc,marginBottom:6}}>{narxLabel(ns.val)} risk · /999</div>
                      <div style={{background:"rgba(26,53,85,0.5)",borderRadius:3,height:5,overflow:"hidden"}}>
                        <div style={{width:`${(ns.val/999)*100}%`,height:"100%",background:`linear-gradient(90deg,${nc}99,${nc})`,borderRadius:3}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{padding:"10px 14px",background:"rgba(5,15,30,0.6)",borderRadius:10,display:"flex",alignItems:"center",gap:12}}>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,textTransform:"uppercase",letterSpacing:2,marginBottom:2}}>Current MME / Day</div>
                  <div style={{background:"rgba(26,53,85,0.5)",borderRadius:4,height:8,overflow:"hidden",position:"relative"}}>
                    <div style={{position:"absolute",left:`${(50/200)*100}%`,top:0,height:"100%",width:1,background:T.gold,zIndex:2}}/>
                    <div style={{position:"absolute",left:`${(90/200)*100}%`,top:0,height:"100%",width:1,background:T.coral,zIndex:2}}/>
                    <div style={{width:`${Math.min((r.mme/200)*100,100)}%`,height:"100%",background:r.mme>=90?T.coral:r.mme>=50?T.orange:T.green,borderRadius:4}}/>
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontFamily:"JetBrains Mono",fontWeight:900,fontSize:26,color:r.mme>=90?T.coral:r.mme>=50?T.orange:T.green}}>{r.mme}</div>
                  <div style={{fontFamily:"DM Sans",fontSize:10,color:T.txt3}}>MME/day</div>
                </div>
              </div>
            </div>
            {r.flags.length > 0 && (
              <div style={{...glass({borderRadius:12,background:r.flags.some(f=>f.type==="critical")?"rgba(255,107,107,0.07)":"rgba(245,200,66,0.06)",borderColor:r.flags.some(f=>f.type==="critical")?"rgba(255,107,107,0.35)":"rgba(245,200,66,0.3)"}),padding:"14px 16px"}}>
                <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:r.flags.some(f=>f.type==="critical")?T.coral:T.gold,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>⚠ CLINICAL DECISION SUPPORT FLAGS ({r.flags.length})</div>
                {r.flags.map((f,i)=>(
                  <div key={i} style={{display:"flex",gap:10,padding:"9px 12px",background:f.type==="critical"?"rgba(255,107,107,0.08)":"rgba(245,200,66,0.06)",border:`1px solid ${f.type==="critical"?"rgba(255,107,107,0.25)":"rgba(245,200,66,0.2)"}`,borderRadius:8,marginBottom:6}}>
                    <span style={{color:f.type==="critical"?T.coral:T.gold,fontSize:14,flexShrink:0}}>{f.type==="critical"?"🚨":"⚠"}</span>
                    <span style={{fontFamily:"DM Sans",fontSize:12.5,color:T.txt,lineHeight:1.5,fontWeight:600}}>{f.msg}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{...glass({borderRadius:12}),overflow:"hidden"}}>
              <div style={{padding:"10px 16px",borderBottom:"1px solid rgba(26,53,85,0.4)",display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt3,textTransform:"uppercase",letterSpacing:2,flex:1}}>CONTROLLED SUBSTANCE HISTORY — {r.prescriptions.length} FILLS</span>
                <button onClick={()=>setShowRaw(!showRaw)} style={{padding:"3px 10px",borderRadius:6,background:"transparent",border:"1px solid rgba(42,77,114,0.4)",color:T.txt4,fontSize:10,cursor:"pointer",fontFamily:"DM Sans"}}>{showRaw?"Hide":"Show"} raw data</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 2fr 2fr 1fr",borderBottom:"1px solid rgba(26,53,85,0.4)",background:"rgba(5,15,30,0.3)"}}>
                {["Drug / Strength","Qty","Days","Prescriber","Pharmacy","Filled"].map(h=>(
                  <div key={h} style={{padding:"8px 12px",fontFamily:"DM Sans",fontSize:10,fontWeight:700,color:T.txt4,textTransform:"uppercase"}}>{h}</div>
                ))}
              </div>
              {r.prescriptions.map((rx,i)=>{
                const sc = scheduleColor(rx.schedule);
                const isOOS = (rx.prescriber||"").includes("OUT OF STATE");
                return (
                  <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 2fr 2fr 1fr",borderBottom:"1px solid rgba(26,53,85,0.2)",background:i%2===0?"rgba(14,37,68,0.15)":"transparent"}}>
                    <div style={{padding:"9px 12px"}}>
                      <span style={{fontFamily:"DM Sans",fontWeight:700,fontSize:12,color:T.txt,display:"block"}}>{rx.drug}</span>
                      <div style={{display:"flex",gap:5,marginTop:3,flexWrap:"wrap"}}>
                        <span style={{fontFamily:"JetBrains Mono",fontSize:8,fontWeight:700,color:sc,background:`${sc}18`,padding:"1px 5px",borderRadius:3}}>Sch {rx.schedule}</span>
                        {rx.mme > 0 && <span style={{fontFamily:"JetBrains Mono",fontSize:8,color:T.txt4,background:"rgba(26,53,85,0.5)",padding:"1px 5px",borderRadius:3}}>{rx.mme} MME</span>}
                        {isOOS && <span style={{fontFamily:"JetBrains Mono",fontSize:8,fontWeight:700,color:T.coral,background:"rgba(255,107,107,0.15)",padding:"1px 5px",borderRadius:3}}>OUT OF STATE</span>}
                      </div>
                    </div>
                    <div style={{padding:"9px 12px",fontFamily:"JetBrains Mono",fontSize:12,color:T.txt2,alignSelf:"center"}}>{rx.qty}</div>
                    <div style={{padding:"9px 12px",fontFamily:"JetBrains Mono",fontSize:12,color:T.txt2,alignSelf:"center"}}>{rx.days}d</div>
                    <div style={{padding:"9px 12px",alignSelf:"center"}}>
                      <div style={{fontFamily:"DM Sans",fontSize:11.5,color:T.txt}}>{rx.prescriber.replace(/ \(OUT OF STATE[^)]*\)/g,"")}</div>
                      {showRaw && <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.txt4,marginTop:2}}>DEA: {rx.prescriberDEA}</div>}
                    </div>
                    <div style={{padding:"9px 12px",alignSelf:"center"}}><div style={{fontFamily:"DM Sans",fontSize:11.5,color:T.txt}}>{rx.pharmacy}</div></div>
                    <div style={{padding:"9px 12px",fontFamily:"JetBrains Mono",fontSize:11,color:T.txt3,alignSelf:"center"}}>{rx.filled}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* CDC CDS */}
      <div style={{...glass({borderRadius:12}),padding:"16px 18px"}}>
        <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.teal,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>CDC CLINICAL DECISION SUPPORT — OPIOID PRESCRIBING</div>
        {[
          {title:"Prescribe lowest effective dose",desc:"Start with immediate-release opioids; avoid long-acting/ER for acute pain"},
          {title:"Use evidence-based thresholds",desc:"≥ 50 MME/day increases overdose risk; ≥ 90 MME/day markedly increases risk"},
          {title:"Co-prescribe naloxone",desc:"For patients on ≥ 50 MME/day or concurrent BZD + opioid"},
          {title:"Short duration for acute pain",desc:"3–7 days for most acute pain; ≤ 3 days for many post-procedure"},
          {title:"Avoid concurrent BZD + opioid",desc:"FDA Black Box: combination dramatically increases fatal overdose risk"},
        ].map((item,i)=>(
          <div key={i} style={{display:"flex",gap:10,padding:"9px 12px",background:"rgba(14,37,68,0.5)",border:"1px solid rgba(26,53,85,0.35)",borderRadius:9,marginBottom:6}}>
            <span style={{color:T.teal,fontSize:12,marginTop:2,flexShrink:0}}>▸</span>
            <div>
              <div style={{fontFamily:"DM Sans",fontWeight:600,fontSize:13,color:T.txt,marginBottom:2}}>{item.title}</div>
              <div style={{fontFamily:"DM Sans",fontSize:12,color:T.txt2,lineHeight:1.55}}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{...glass({borderRadius:12}),padding:"14px 16px"}}>
        <div style={{fontFamily:"JetBrains Mono",fontSize:9,color:T.purple,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>CONTROLLED SUBSTANCE SCHEDULE REFERENCE</div>
        {[
          {sch:"II",ex:"Oxycodone, Hydrocodone, Morphine, Fentanyl, Methylphenidate, Amphetamine",rule:"No refills; written Rx or EPCS; 30-day supply"},
          {sch:"III",ex:"Buprenorphine (OBOT), Codeine combinations, Ketamine",rule:"Up to 5 refills in 6 months; e-prescribe permitted"},
          {sch:"IV",ex:"Benzodiazepines, Tramadol, Zolpidem, Carisoprodol",rule:"Up to 5 refills in 6 months; e-prescribe permitted"},
          {sch:"V",ex:"Pregabalin, Cough preparations with <200mg codeine/100mL",rule:"Some OTC; prescription varies by state"},
        ].map((item,i)=>(
          <div key={i} style={{padding:"10px 12px",background:"rgba(14,37,68,0.45)",border:`1px solid ${schedCol(item.sch)}33`,borderRadius:9,marginBottom:6}}>
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4}}>
              <Badge label={`Schedule ${item.sch}`} color={schedCol(item.sch)}/>
              <span style={{fontFamily:"DM Sans",fontSize:11,color:T.txt3}}>{item.rule}</span>
            </div>
            <div style={{fontFamily:"DM Sans",fontSize:11.5,color:T.txt2,fontStyle:"italic"}}>{item.ex}</div>
          </div>
        ))}
      </div>
    </div>
  );
}