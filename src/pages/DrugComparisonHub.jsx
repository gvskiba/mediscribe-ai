import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
const DrugDosing = base44.entities.DrugDosing;

(() => {
  if (document.getElementById("dcmp-css")) return;
  const l = document.createElement("link"); l.id = "dcmp-f"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "dcmp-css";
  s.textContent = `*{box-sizing:border-box;}@keyframes dcIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}.dc-in{animation:dcIn .2s ease both;}.dc-hov:hover{background:rgba(255,255,255,.06)!important;}::-webkit-scrollbar{width:3px;height:3px;}::-webkit-scrollbar-thumb{background:rgba(0,180,216,.25);border-radius:2px;}select option{background:#0d1b2e;}`;
  document.head.appendChild(s);
})();

const T={bg:"#07111f",card:"rgba(255,255,255,0.04)",bdr:"rgba(255,255,255,0.08)",teal:"#00b4d8",tD:"rgba(0,180,216,0.12)",tB:"rgba(0,180,216,0.25)",gold:"#f0a500",gD:"rgba(240,165,0,0.12)",coral:"#ff6060",cD:"rgba(255,96,96,0.12)",green:"#4ade80",grnD:"rgba(74,222,128,0.1)",purple:"#9b6dff",txt:"#dde6f0",mut:"rgba(221,230,240,0.55)",dim:"rgba(221,230,240,0.28)"};
const gl=(x={})=>({backdropFilter:"blur(14px)",background:T.card,border:`1px solid ${T.bdr}`,borderRadius:12,...x});
const ab=(c=T.teal,x={})=>({padding:"7px 16px",borderRadius:8,cursor:"pointer",border:`1px solid ${c}55`,background:`${c}18`,color:c,fontFamily:"DM Sans,sans-serif",fontSize:12,fontWeight:700,transition:"all .15s",...x});
const tg=(c,x={})=>({borderRadius:5,padding:"2px 8px",fontSize:10,fontWeight:700,background:`${c}18`,border:`1px solid ${c}30`,color:c,...x});

const FLAG={ok:{c:T.green,l:"Normal"},caution:{c:T.gold,l:"Adjust"},avoid:{c:T.coral,l:"AVOID"}};

const normalize=(r)=>({
  id:r.drug_id,name:r.name,gen:r.generic_name,cat:r.category,
  controlled:r.controlled||false,schedule:r.schedule||null,ismp:r.ismp_high_alert||false,
  tiers:(()=>{try{return JSON.parse(r.renal_tiers_json||"[]");}catch{return[];}})(),
  wt:r.weight_based?{dpkg:r.wt_dpkg,unit:r.wt_unit,max:r.wt_max,route:r.wt_route,note:r.wt_note}:null,
  sigs:(()=>{try{return JSON.parse(r.standard_sigs_json||"[]");}catch{return[];}})(),
  interactions:(()=>{try{return JSON.parse(r.interactions_json||"[]");}catch{return[];}})(),
  ci:r.contraindications?r.contraindications.split("|").filter(Boolean):[],
  peds:r.peds_dose||"",hepatic:r.hepatic_note||"",monitoring:r.monitoring||"",
  source:r.source||"static",
});

const COLS=["#00b4d8","#f0a500","#9b6dff","#4ade80"];

const ROWS=[
  {key:"standard_dose",  label:"Standard Adult Dose",    render:(d)=>d.sigs?.[0]||"—"},
  {key:"wt_dose",        label:"Weight-Based",            render:(d)=>d.wt?`${d.wt.dpkg} ${d.wt.unit}/kg ${d.wt.route} (max ${d.wt.max} ${d.wt.unit})`:"Not weight-based"},
  {key:"peds",           label:"Pediatric Dose",          render:(d)=>d.peds||"—"},
  {key:"renal",          label:"Renal Tiers",             render:(d)=>d.tiers},
  {key:"ci",             label:"Contraindications",       render:(d)=>d.ci},
  {key:"interactions",   label:"Key Interactions",        render:(d)=>d.interactions.slice(0,3)},
  {key:"hepatic",        label:"Hepatic Note",            render:(d)=>d.hepatic||"No adjustment"},
  {key:"monitoring",     label:"Monitoring",              render:(d)=>d.monitoring||"—"},
  {key:"ismp",           label:"ISMP High-Alert",         render:(d)=>d.ismp?"⚠ Yes":"No"},
  {key:"controlled",     label:"Controlled Substance",    render:(d)=>d.controlled?`Schedule ${d.schedule}`:"No"},
];

export default function DrugComparisonHub() {
  const [db,setDb]=useState([]);
  const [selected,setSelected]=useState([null,null,null]);
  const [catFilter,setCatFilter]=useState("all");
  const [search,setSearch]=useState("");
  const [slots,setSlots]=useState(2);

  useEffect(()=>{DrugDosing.list(null,500).then(r=>setDb(r.map(normalize))).catch(()=>{});},[]);

  const cats=useMemo(()=>["all",...[...new Set(db.map(d=>d.cat))].sort()],[db]);
  const filtered=useMemo(()=>{
    let list=db;
    if(catFilter!=="all") list=list.filter(d=>d.cat===catFilter);
    if(search.trim()){const q=search.toLowerCase();list=list.filter(d=>d.name.toLowerCase().includes(q)||(d.gen||"").toLowerCase().includes(q));}
    return list;
  },[db,catFilter,search]);

  const setSlot=(idx,drug)=>setSelected(p=>{const n=[...p];n[idx]=drug;return n;});
  const clearSlot=(idx)=>setSelected(p=>{const n=[...p];n[idx]=null;return n;});
  const activeDrugs=selected.slice(0,slots).filter(Boolean);

  const CellVal=({row,drug,color})=>{
    const val=row.render(drug);
    if(row.key==="renal"){
      return(
        <div style={{display:"flex",flexDirection:"column",gap:3}}>
          {drug.tiers.length===0?<span style={{fontSize:11,color:T.dim}}>No data</span>:
          drug.tiers.map((t,i)=>{
            const fc=FLAG[t[2]]||FLAG.ok;
            return<div key={i} style={{display:"flex",gap:6,alignItems:"baseline",padding:"3px 6px",borderRadius:5,background:`${fc.c}0d`,border:`1px solid ${fc.c}20`}}>
              <span style={{fontSize:9,color:fc.c,fontFamily:"JetBrains Mono,monospace",minWidth:70,flexShrink:0}}>{t[0]}</span>
              <span style={{fontSize:11,color:T.txt,lineHeight:1.4}}>{t[1]}</span>
            </div>;
          })}
        </div>
      );
    }
    if(row.key==="ci"||row.key==="interactions"){
      const arr=Array.isArray(val)?val:[];
      return arr.length===0?<span style={{fontSize:11,color:T.dim}}>None documented</span>:
        <div>{arr.map((v,i)=><div key={i} style={{fontSize:11,color:T.mut,padding:"2px 0",lineHeight:1.4,borderBottom:i<arr.length-1?`1px solid ${T.bdr}`:"none"}}>• {v}</div>)}</div>;
    }
    if(row.key==="ismp") return <span style={{fontSize:12,fontWeight:700,color:drug.ismp?T.coral:T.green}}>{val}</span>;
    if(row.key==="controlled") return <span style={{fontSize:12,color:drug.controlled?T.coral:T.mut}}>{val}</span>;
    if(row.key==="wt_dose") return <span style={{fontSize:12,fontFamily:"JetBrains Mono,monospace",color:drug.wt?color:T.dim}}>{val}</span>;
    return <span style={{fontSize:12,color:T.txt,lineHeight:1.55}}>{val}</span>;
  };

  return(
    <div style={{background:T.bg,minHeight:"100vh",padding:"20px 18px 60px",fontFamily:"DM Sans,sans-serif",color:T.txt}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:22}}>
        <div style={{width:44,height:44,borderRadius:11,background:T.tD,border:`1px solid ${T.tB}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>⚖</div>
        <div>
          <h1 style={{margin:0,fontFamily:"Playfair Display,serif",fontSize:22,color:T.teal,letterSpacing:"-0.5px",lineHeight:1}}>Drug Comparison</h1>
          <p style={{margin:"3px 0 0",fontSize:12,color:T.mut}}>Side-by-side class comparison · Renal tiers · Interactions · ISMP flags</p>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:6}}>
          {[2,3].map(n=><button key={n} onClick={()=>setSlots(n)} style={{...ab(slots===n?T.teal:T.mut,{padding:"5px 12px",fontSize:11})}}>{n} Drugs</button>)}
        </div>
      </div>

      {/* Drug selectors */}
      <div style={{display:"grid",gridTemplateColumns:`repeat(${slots},1fr)`,gap:12,marginBottom:20}}>
        {Array.from({length:slots},(_,i)=>(
          <div key={i} style={{...gl({padding:"12px 14px",border:`2px solid ${selected[i]?COLS[i]+"55":T.bdr}`})}}>
            <div style={{fontSize:8,color:COLS[i],fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Drug {i+1}</div>
            {selected[i]?(
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:COLS[i]}}>{selected[i].name}</div>
                  <div style={{fontSize:11,color:T.mut}}>{selected[i].gen}</div>
                  <div style={{display:"flex",gap:5,marginTop:5,flexWrap:"wrap"}}>
                    <span style={{...tg(COLS[i]),fontSize:9}}>{selected[i].cat}</span>
                    {selected[i].ismp&&<span style={{...tg(T.coral),fontSize:9}}>⚠ ISMP</span>}
                  </div>
                </div>
                <button onClick={()=>clearSlot(i)} style={{background:"none",border:"none",color:T.dim,cursor:"pointer",fontSize:16,padding:0,lineHeight:1}}>✕</button>
              </div>
            ):(
              <div style={{fontSize:11,color:T.dim,fontStyle:"italic"}}>Select a drug below →</div>
            )}
          </div>
        ))}
      </div>

      {/* Filter + search */}
      <div style={{...gl({padding:"10px 14px",marginBottom:14,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"})}}>
        <div style={{position:"relative",flex:"1 1 200px",maxWidth:260}}>
          <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",fontSize:13,color:T.teal,pointerEvents:"none"}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search drugs..."
            style={{background:"rgba(13,27,46,.8)",border:`1px solid ${T.bdr}`,borderRadius:8,padding:"7px 11px 7px 34px",color:T.txt,fontFamily:"DM Sans,sans-serif",fontSize:12,width:"100%"}}/>
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {cats.map(c=><button key={c} onClick={()=>setCatFilter(c)} style={{padding:"4px 10px",borderRadius:7,cursor:"pointer",border:`1px solid ${catFilter===c?T.teal+"55":T.bdr}`,background:catFilter===c?T.tD:"transparent",color:catFilter===c?T.teal:T.mut,fontSize:11,fontWeight:600,fontFamily:"DM Sans,sans-serif",textTransform:"capitalize"}}>{c}</button>)}
        </div>
      </div>

      {/* Drug grid picker */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:8,marginBottom:24}}>
        {filtered.map(d=>{
          const selIdx=selected.findIndex(s=>s?.id===d.id);
          const isSel=selIdx>=0;
          return(
            <div key={d.id} className="dc-hov" onClick={()=>{
              if(isSel){clearSlot(selIdx);return;}
              const empty=selected.slice(0,slots).findIndex(s=>s===null);
              if(empty>=0) setSlot(empty,d);
            }} style={{...gl({padding:"10px 12px",cursor:"pointer",border:`1px solid ${isSel?COLS[selIdx]+"55":T.bdr}`,background:isSel?`${COLS[selIdx]}12`:T.card,transition:"all .15s"})}}>
              <div style={{fontSize:12,fontWeight:700,color:isSel?COLS[selIdx]:T.txt,marginBottom:3}}>{d.name}</div>
              <div style={{fontSize:10,color:T.mut,marginBottom:5}}>{d.gen}</div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                <span style={{...tg(T.teal),fontSize:9}}>{d.cat}</span>
                {d.ismp&&<span style={{...tg(T.coral),fontSize:9}}>⚠</span>}
              </div>
              {isSel&&<div style={{fontSize:9,color:COLS[selIdx],marginTop:4,fontWeight:700}}>Slot {selIdx+1} ✓</div>}
            </div>
          );
        })}
        {filtered.length===0&&db.length>0&&(
          <div style={{gridColumn:"1/-1",textAlign:"center",padding:"30px",color:T.dim,fontSize:12}}>No drugs match your filter</div>
        )}
      </div>

      {/* Comparison table */}
      {activeDrugs.length>=2&&(
        <div className="dc-in">
          <div style={{fontSize:9,color:T.teal,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:12}}>Side-by-Side Comparison</div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:500}}>
              <thead>
                <tr>
                  <th style={{padding:"8px 12px",textAlign:"left",fontSize:9,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1.5,textTransform:"uppercase",borderBottom:`1px solid ${T.bdr}`,width:140}}>Field</th>
                  {activeDrugs.map((d,i)=>(
                    <th key={i} style={{padding:"8px 12px",textAlign:"left",borderBottom:`2px solid ${COLS[i]}55`,background:`${COLS[i]}08`}}>
                      <div style={{fontSize:14,fontWeight:700,color:COLS[i],fontFamily:"Playfair Display,serif"}}>{d.name}</div>
                      <div style={{fontSize:10,color:T.mut}}>{d.gen}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row,ri)=>(
                  <tr key={row.key} style={{background:ri%2===0?"transparent":"rgba(255,255,255,.02)"}}>
                    <td style={{padding:"10px 12px",fontSize:9,color:T.dim,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1,textTransform:"uppercase",verticalAlign:"top",borderBottom:`1px solid ${T.bdr}`}}>{row.label}</td>
                    {activeDrugs.map((d,i)=>(
                      <td key={i} style={{padding:"10px 12px",verticalAlign:"top",borderBottom:`1px solid ${T.bdr}`,borderLeft:`2px solid ${COLS[i]}20`}}>
                        <CellVal row={row} drug={d} color={COLS[i]}/>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {activeDrugs.length<2&&(
        <div style={{textAlign:"center",padding:"40px 20px",color:T.dim}}>
          <div style={{fontSize:32,marginBottom:10}}>⚖</div>
          <div style={{fontSize:13,color:T.mut}}>Select at least 2 drugs above to compare</div>
        </div>
      )}

      <div style={{marginTop:40,textAlign:"center"}}>
        <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:9,color:T.dim,letterSpacing:1.5}}>NOTRYA · DRUG COMPARISON · VERIFY ALL DATA AGAINST CURRENT PRESCRIBING REFERENCES</span>
      </div>
    </div>
  );
}