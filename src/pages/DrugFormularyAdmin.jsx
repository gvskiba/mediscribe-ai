import { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
const DrugDosing = base44.entities.DrugDosing;

(() => {
  if (document.getElementById("dfa-css")) return;
  const l = document.createElement("link"); l.id = "dfa-f"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style"); s.id = "dfa-css";
  s.textContent = `
    *{box-sizing:border-box;}
    @keyframes dfaIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    @keyframes dfaSpin{to{transform:rotate(360deg)}}
    .dfa-in{animation:dfaIn .2s ease both;}
    .dfa-row:hover{background:rgba(255,255,255,.05)!important;}
    .dfa-row{transition:background .12s;}
    ::-webkit-scrollbar{width:4px;height:4px;}
    ::-webkit-scrollbar-thumb{background:rgba(0,180,216,.25);border-radius:2px;}
    input::placeholder,textarea::placeholder{color:rgba(221,230,240,.2);}
    input:focus,textarea:focus,select:focus{border-color:rgba(0,180,216,.6)!important;outline:none;}
    select option{background:#0d1b2e;}
    .dfa-overlay{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:100;display:flex;align-items:center;justify-content:center;padding:16px;}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#07111f", navy:"#0d1b2e",
  card:"rgba(255,255,255,0.04)", bdr:"rgba(255,255,255,0.08)",
  teal:"#00b4d8", tD:"rgba(0,180,216,0.12)", tB:"rgba(0,180,216,0.25)",
  gold:"#f0a500", gD:"rgba(240,165,0,0.12)",
  coral:"#ff6060", cD:"rgba(255,96,96,0.12)",
  green:"#4ade80", grnD:"rgba(74,222,128,0.1)",
  purple:"#9b6dff", pD:"rgba(155,109,255,0.12)",
  txt:"#dde6f0", mut:"rgba(221,230,240,0.55)", dim:"rgba(221,230,240,0.28)",
};

const gl = (x={}) => ({backdropFilter:"blur(14px)",background:T.card,border:`1px solid ${T.bdr}`,borderRadius:12,...x});
const ib = (x={}) => ({width:"100%",background:"rgba(13,27,46,.8)",border:`1px solid ${T.bdr}`,borderRadius:8,padding:"8px 12px",color:T.txt,fontFamily:"DM Sans,sans-serif",fontSize:13,transition:"border-color .15s",...x});
const ab = (c=T.teal,x={}) => ({padding:"7px 16px",borderRadius:8,cursor:"pointer",border:`1px solid ${c}55`,background:`${c}18`,color:c,fontFamily:"DM Sans,sans-serif",fontSize:12,fontWeight:700,transition:"all .15s",...x});
const tg = (c,x={}) => ({borderRadius:5,padding:"2px 8px",fontSize:10,fontWeight:700,background:`${c}18`,border:`1px solid ${c}30`,color:c,...x});
const lbl = t => <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:4,fontWeight:700}}>{t}</div>;
const Spin = ({c=T.teal}) => <span style={{display:"inline-block",width:12,height:12,border:`2px solid ${c}30`,borderTopColor:c,borderRadius:"50%",animation:"dfaSpin .7s linear infinite"}} />;

const SOURCE_CFG = {
  static:               {c:T.teal,   l:"Static"},
  ai_generated:         {c:T.gold,   l:"AI — Needs Review"},
  fda_extracted:        {c:T.purple, l:"FDA Extracted"},
  pharmacist_verified:  {c:T.green,  l:"Verified"},
};

const CATS = ["antibiotic","analgesic","rsi","sedation","cardiac","reversal","anticoagulant","pressor","neuro","metabolic","other"];

const BLANK_DRUG = {
  drug_id:"", name:"", generic_name:"", category:"antibiotic",
  controlled:false, schedule:"", ismp_high_alert:false,
  standard_dose:"", weight_based:false,
  wt_indication:"", wt_route:"IV", wt_dpkg:"", wt_unit:"mg",
  wt_lo:"", wt_hi:"", wt_max:"", wt_conc:"", wt_note:"",
  is_drip:false, drip_lo:"", drip_hi:"", drip_unit:"mcg/kg/min",
  drip_concs_json:"[]", drip_note:"",
  renal_tiers_json:"[]", standard_sigs_json:"[]",
  interactions_json:"[]", contraindications:"",
  peds_dose:"", hepatic_note:"", monitoring:"",
  dialysis_dose:"", source:"static",
  last_verified: new Date().toISOString().slice(0,10),
};

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({drug, onSave, onClose, saving}) {
  const [d,setD] = useState({...BLANK_DRUG,...drug});
  const f = (k,v) => setD(p=>({...p,[k]:v}));

  const Field = ({label,k,type="text",opts,full,ta,rows=2}) => (
    <div style={full?{gridColumn:"1/-1"}:{}}>
      {lbl(label)}
      {opts ? (
        <select value={d[k]} onChange={e=>f(k,e.target.value)} style={{...ib({cursor:"pointer"})}}>
          {opts.map(o=><option key={o} value={o}>{o}</option>)}
        </select>
      ) : ta ? (
        <textarea value={d[k]} onChange={e=>f(k,e.target.value)} rows={rows}
          style={{...ib({resize:"vertical",lineHeight:1.6})}} />
      ) : type==="checkbox" ? (
        <button onClick={()=>f(k,!d[k])} style={{padding:"6px 14px",borderRadius:7,cursor:"pointer",border:`1px solid ${d[k]?T.teal+"55":T.bdr}`,background:d[k]?T.tD:"transparent",color:d[k]?T.teal:T.mut,fontSize:12,fontWeight:700,fontFamily:"DM Sans,sans-serif"}}>
          {d[k]?"✓ Yes":"No"}
        </button>
      ) : (
        <input type={type} value={d[k]} onChange={e=>f(k,e.target.value)} style={{...ib()}} />
      )}
    </div>
  );

  return (
    <div className="dfa-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{...gl({borderRadius:14,padding:"22px 24px",width:"100%",maxWidth:760,maxHeight:"90vh",overflow:"auto",background:"rgba(10,22,42,.97)"})}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <h2 style={{margin:0,fontFamily:"Playfair Display,serif",fontSize:18,color:T.teal}}>{drug.id?"Edit Drug":"Add New Drug"}</h2>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.mut,cursor:"pointer",fontSize:18,padding:4,lineHeight:1}}>✕</button>
        </div>

        <div style={{fontSize:9,color:T.teal,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Identity</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          <Field label="Drug ID (short key e.g. vanc)" k="drug_id"/>
          <Field label="Display Name" k="name"/>
          <Field label="Generic Name" k="generic_name"/>
          <Field label="Category" k="category" opts={CATS}/>
          <Field label="Controlled" k="controlled" type="checkbox"/>
          <Field label="DEA Schedule (II III IV V)" k="schedule"/>
          <Field label="ISMP High-Alert" k="ismp_high_alert" type="checkbox"/>
          <Field label="Source" k="source" opts={Object.keys(SOURCE_CFG)}/>
        </div>

        <div style={{fontSize:9,color:T.gold,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Standard Dosing</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          <Field label="Standard Adult Dose" k="standard_dose" full/>
          <Field label="Standard Sigs (JSON array)" k="standard_sigs_json" ta full rows={3}/>
        </div>

        <div style={{fontSize:9,color:T.purple,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Weight-Based Dosing</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          <Field label="Weight-Based" k="weight_based" type="checkbox"/>
          <Field label="Indication" k="wt_indication"/>
          <Field label="Route" k="wt_route"/>
          <Field label="Unit (mg or mcg)" k="wt_unit" opts={["mg","mcg"]}/>
          <Field label="Dose/kg" k="wt_dpkg" type="number"/>
          <Field label="Conc (mg/mL or mcg/mL)" k="wt_conc" type="number"/>
          <Field label="Lo (mg/kg or mcg/kg)" k="wt_lo" type="number"/>
          <Field label="Hi (mg/kg or mcg/kg)" k="wt_hi" type="number"/>
          <Field label="Absolute Max Dose" k="wt_max" type="number"/>
          <Field label="Dosing Note" k="wt_note"/>
        </div>

        <div style={{fontSize:9,color:T.coral,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Renal Dosing</div>
        <div style={{...gl({padding:"10px 12px",marginBottom:8,background:T.cD})}}>
          <div style={{fontSize:10,color:T.coral,marginBottom:6}}>Format: JSON array of [label, dose, ok|caution|avoid]</div>
          <div style={{fontSize:10,color:T.dim,marginBottom:8}}>{'Example: [["eGFR >60","Full dose","ok"],["eGFR <30","AVOID","avoid"]]'}</div>
          <textarea value={d.renal_tiers_json} onChange={e=>f("renal_tiers_json",e.target.value)} rows={4}
            style={{...ib({resize:"vertical",lineHeight:1.6,fontFamily:"JetBrains Mono,monospace",fontSize:11})}} />
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          <Field label="Dialysis / CRRT Dose" k="dialysis_dose"/>
          <Field label="Last Verified (YYYY-MM-DD)" k="last_verified"/>
        </div>

        <div style={{fontSize:9,color:T.teal,fontFamily:"JetBrains Mono,monospace",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>Clinical Details</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          <Field label="Interactions (JSON array)" k="interactions_json" ta rows={3}/>
          <Field label="Contraindications (pipe-separated)" k="contraindications" ta rows={3}/>
          <Field label="Peds Dose" k="peds_dose" ta rows={2}/>
          <Field label="Hepatic Note" k="hepatic_note" ta rows={2}/>
          <Field label="Monitoring" k="monitoring" ta full rows={2}/>
        </div>

        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{...ab(T.mut,{padding:"9px 20px",fontSize:13})}}>Cancel</button>
          <button onClick={()=>onSave(d)} disabled={saving||!d.name||!d.drug_id} style={{...ab(T.teal,{padding:"9px 24px",fontSize:13,display:"flex",alignItems:"center",gap:8,opacity:(!d.name||!d.drug_id||saving)?0.5:1})}}>
            {saving?<><Spin/>Saving...</>:"✓ Save Drug"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm ────────────────────────────────────────────────────────────
function DeleteConfirm({drug, onConfirm, onClose, deleting}) {
  return (
    <div className="dfa-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{...gl({borderRadius:14,padding:"24px",width:"100%",maxWidth:400,background:"rgba(10,22,42,.97)"})}}>
        <h3 style={{margin:"0 0 10px",fontFamily:"Playfair Display,serif",fontSize:17,color:T.coral}}>Delete Drug Record?</h3>
        <p style={{fontSize:13,color:T.mut,marginBottom:18,lineHeight:1.6}}>
          This will permanently remove <strong style={{color:T.txt}}>{drug.name}</strong> ({drug.generic_name}) from the DrugDosing entity. This cannot be undone.
        </p>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{...ab(T.mut)}}>Cancel</button>
          <button onClick={onConfirm} disabled={deleting} style={{...ab(T.coral,{display:"flex",alignItems:"center",gap:7,opacity:deleting?0.5:1})}}>
            {deleting?<><Spin c={T.coral}/>Deleting...</>:"Delete Permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DrugFormularyAdmin() {
  const [drugs,setDrugs]   = useState([]);
  const [loading,setLoading] = useState(true);
  const [search,setSearch]  = useState("");
  const [catFilter,setCat]  = useState("all");
  const [srcFilter,setSrc]  = useState("all");
  const [editDrug,setEdit]  = useState(null);
  const [deleteDrug,setDel] = useState(null);
  const [saving,setSaving]  = useState(false);
  const [deleting,setDeleting] = useState(false);
  const [toast,setToast]    = useState(null);

  const showToast = useCallback((msg,c=T.green)=>{setToast({msg,c});setTimeout(()=>setToast(null),2500);},[]);

  const load = useCallback(async()=>{
    setLoading(true);
    try {
      const r = await DrugDosing.list("-created_date", 500);
      setDrugs(r);
    } catch(e){showToast("Failed to load drugs: "+e.message,T.coral);}
    setLoading(false);
  },[showToast]);

  useEffect(()=>{load();},[load]);

  const filtered = useMemo(()=>{
    let list = drugs;
    if(catFilter!=="all") list=list.filter(d=>d.category===catFilter);
    if(srcFilter!=="all") list=list.filter(d=>d.source===srcFilter);
    if(search.trim()) {
      const q=search.toLowerCase();
      list=list.filter(d=>(d.name||"").toLowerCase().includes(q)||(d.generic_name||"").toLowerCase().includes(q)||(d.drug_id||"").toLowerCase().includes(q));
    }
    return list;
  },[drugs,catFilter,srcFilter,search]);

  const stats = useMemo(()=>({
    total: drugs.length,
    pending: drugs.filter(d=>d.source==="ai_generated").length,
    verified: drugs.filter(d=>d.source==="pharmacist_verified").length,
    ismp: drugs.filter(d=>d.ismp_high_alert).length,
  }),[drugs]);

  const handleVerify = async (drug) => {
    try {
      await DrugDosing.update(drug.id,{source:"pharmacist_verified",last_verified:new Date().toISOString().slice(0,10)});
      setDrugs(p=>p.map(d=>d.id===drug.id?{...d,source:"pharmacist_verified",last_verified:new Date().toISOString().slice(0,10)}:d));
      showToast(`✓ ${drug.name} marked as verified`);
    } catch(e){showToast("Update failed: "+e.message,T.coral);}
  };

  const handleSave = async (data) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        wt_dpkg:  data.wt_dpkg  ? parseFloat(data.wt_dpkg)  : null,
        wt_lo:    data.wt_lo    ? parseFloat(data.wt_lo)    : null,
        wt_hi:    data.wt_hi    ? parseFloat(data.wt_hi)    : null,
        wt_max:   data.wt_max   ? parseFloat(data.wt_max)   : null,
        wt_conc:  data.wt_conc  ? parseFloat(data.wt_conc)  : null,
        drip_lo:  data.drip_lo  ? parseFloat(data.drip_lo)  : null,
        drip_hi:  data.drip_hi  ? parseFloat(data.drip_hi)  : null,
        last_verified: data.last_verified||new Date().toISOString().slice(0,10),
      };
      if(data.id){
        await DrugDosing.update(data.id, payload);
        setDrugs(p=>p.map(d=>d.id===data.id?{...d,...payload}:d));
        showToast(`✓ ${data.name} updated`);
      } else {
        const created = await DrugDosing.create(payload);
        setDrugs(p=>[created,...p]);
        showToast(`✓ ${data.name} added to formulary`);
      }
      setEdit(null);
    } catch(e){showToast("Save failed: "+e.message,T.coral);}
    setSaving(false);
  };

  const handleDelete = async () => {
    if(!deleteDrug) return;
    setDeleting(true);
    try {
      await DrugDosing.delete(deleteDrug.id);
      setDrugs(p=>p.filter(d=>d.id!==deleteDrug.id));
      showToast(`${deleteDrug.name} removed from formulary`,T.gold);
      setDel(null);
    } catch(e){showToast("Delete failed: "+e.message,T.coral);}
    setDeleting(false);
  };

  return (
    <div style={{background:T.bg,minHeight:"100vh",padding:"20px 18px 60px",fontFamily:"DM Sans,sans-serif",color:T.txt}}>

      {editDrug!==null&&<EditModal drug={editDrug} onSave={handleSave} onClose={()=>setEdit(null)} saving={saving}/>}
      {deleteDrug&&<DeleteConfirm drug={deleteDrug} onConfirm={handleDelete} onClose={()=>setDel(null)} deleting={deleting}/>}

      {toast&&(
        <div className="dfa-in" style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"rgba(8,20,40,.96)",border:`1px solid ${toast.c}40`,borderRadius:10,padding:"10px 20px",fontSize:13,fontWeight:700,color:toast.c,zIndex:200,pointerEvents:"none"}}>
          {toast.msg}
        </div>
      )}

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22,flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:44,height:44,borderRadius:11,background:T.tD,border:`1px solid ${T.tB}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>💊</div>
          <div>
            <h1 style={{margin:0,fontFamily:"Playfair Display,serif",fontSize:22,color:T.teal,letterSpacing:"-0.5px",lineHeight:1}}>Drug Formulary Admin</h1>
            <p style={{margin:"3px 0 0",fontSize:12,color:T.mut}}>Review · Verify · Edit · Add · DrugDosing entity</p>
          </div>
        </div>
        <button onClick={()=>setEdit({...BLANK_DRUG})} style={{...ab(T.teal,{fontSize:13,padding:"9px 20px"})}}>+ Add Drug</button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:10,marginBottom:20}}>
        {[["Total Drugs",stats.total,T.teal],["Pending Review",stats.pending,T.gold],["Verified",stats.verified,T.green],["ISMP High-Alert",stats.ismp,T.coral]].map(([l,v,c])=>(
          <div key={l} style={{...gl({padding:"12px 14px",borderLeft:`3px solid ${c}`,background:`${c}08`})}}>
            <div style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>{l}</div>
            <div style={{fontFamily:"JetBrains Mono,monospace",fontWeight:700,fontSize:26,color:c,lineHeight:1}}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{...gl({padding:"12px 16px",marginBottom:16,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"})}}>
        <div style={{position:"relative",flex:"1 1 200px",maxWidth:280}}>
          <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",fontSize:13,color:T.teal,pointerEvents:"none"}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, generic, ID..."
            style={{...ib({paddingLeft:36,fontSize:12})}} />
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {[["all","All"],["pending","⚠ Pending"],["verified","✓ Verified"]].map(([k,l])=>{
            const sval = k==="pending"?"ai_generated":k==="verified"?"pharmacist_verified":"all";
            return(
              <button key={k} onClick={()=>setSrc(sval)}
                style={{padding:"5px 12px",borderRadius:7,cursor:"pointer",border:`1px solid ${srcFilter===sval?T.teal+"55":T.bdr}`,background:srcFilter===sval?T.tD:"transparent",color:srcFilter===sval?T.teal:T.mut,fontSize:11,fontWeight:700,fontFamily:"DM Sans,sans-serif"}}>{l}</button>
            );
          })}
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          <button onClick={()=>setCat("all")} style={{padding:"5px 12px",borderRadius:7,cursor:"pointer",border:`1px solid ${catFilter==="all"?T.gold+"55":T.bdr}`,background:catFilter==="all"?T.gD:"transparent",color:catFilter==="all"?T.gold:T.mut,fontSize:11,fontWeight:700,fontFamily:"DM Sans,sans-serif"}}>All Categories</button>
          {CATS.map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{padding:"5px 12px",borderRadius:7,cursor:"pointer",border:`1px solid ${catFilter===c?T.gold+"55":T.bdr}`,background:catFilter===c?T.gD:"transparent",color:catFilter===c?T.gold:T.mut,fontSize:11,fontWeight:600,fontFamily:"DM Sans,sans-serif",textTransform:"capitalize"}}>{c}</button>
          ))}
        </div>
        <button onClick={load} disabled={loading} style={{...ab(T.dim,{marginLeft:"auto",fontSize:11,padding:"5px 12px",display:"flex",alignItems:"center",gap:6})}}>
          {loading?<><Spin c={T.dim}/>Loading</>:"↻ Refresh"}
        </button>
      </div>

      <div style={{fontSize:11,color:T.dim,marginBottom:10}}>{filtered.length} drug{filtered.length!==1?"s":""} shown{search||catFilter!=="all"||srcFilter!=="all"?" (filtered)":""}</div>

      {loading&&!drugs.length?(
        <div style={{textAlign:"center",padding:"60px 20px",color:T.dim}}>
          <Spin/><div style={{marginTop:12,fontSize:13,color:T.mut}}>Loading formulary...</div>
        </div>
      ):(
        <div style={{...gl({overflow:"hidden"})}}>
          <div style={{display:"grid",gridTemplateColumns:"180px 160px 110px 130px 60px 90px 1fr",gap:0,padding:"9px 16px",borderBottom:`1px solid ${T.bdr}`,background:"rgba(0,0,0,.15)"}}>
            {["Drug Name","Generic","Category","Source","ISMP","Verified","Actions"].map(h=>(
              <div key={h} style={{fontSize:8,color:T.dim,fontFamily:"JetBrains Mono,monospace",letterSpacing:1.5,textTransform:"uppercase",fontWeight:700}}>{h}</div>
            ))}
          </div>

          {filtered.length===0?(
            <div style={{padding:"40px",textAlign:"center",color:T.dim,fontSize:13}}>No drugs match current filters</div>
          ):filtered.map((drug,i)=>{
            const src=SOURCE_CFG[drug.source]||SOURCE_CFG.static;
            const isPending=drug.source==="ai_generated"||drug.source==="fda_extracted";
            return(
              <div key={drug.id||i} className="dfa-row" style={{display:"grid",gridTemplateColumns:"180px 160px 110px 130px 60px 90px 1fr",gap:0,padding:"10px 16px",borderBottom:`1px solid ${T.bdr}`,background:isPending?"rgba(240,165,0,.04)":i%2===0?"transparent":"rgba(255,255,255,.015)"}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:isPending?T.gold:T.txt,lineHeight:1.2}}>{drug.name}</div>
                    <div style={{fontSize:9,color:T.dim,fontFamily:"JetBrains Mono,monospace"}}>{drug.drug_id}</div>
                  </div>
                </div>
                <div style={{fontSize:11,color:T.mut,alignSelf:"center"}}>{drug.generic_name}</div>
                <div style={{alignSelf:"center"}}><span style={{fontSize:10,textTransform:"capitalize",color:T.mut}}>{drug.category}</span></div>
                <div style={{alignSelf:"center"}}><span style={{...tg(src.c),fontSize:9}}>{src.l}</span></div>
                <div style={{alignSelf:"center"}}>{drug.ismp_high_alert?<span style={{...tg(T.coral),fontSize:9}}>⚠ Yes</span>:<span style={{fontSize:10,color:T.dim}}>—</span>}</div>
                <div style={{fontSize:10,color:T.dim,alignSelf:"center",fontFamily:"JetBrains Mono,monospace"}}>{drug.last_verified||"—"}</div>
                <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                  <button onClick={()=>setEdit({...drug})} style={{...ab(T.teal,{padding:"4px 10px",fontSize:10})}}>Edit</button>
                  {isPending&&(
                    <button onClick={()=>handleVerify(drug)} style={{...ab(T.green,{padding:"4px 10px",fontSize:10})}}>✓ Verify</button>
                  )}
                  <button onClick={()=>setDel(drug)} style={{...ab(T.coral,{padding:"4px 10px",fontSize:10})}}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {stats.pending>0&&(
        <div className="dfa-in" style={{...gl({padding:"12px 16px",marginTop:16,borderLeft:`3px solid ${T.gold}`,background:T.gD})}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:T.gold,marginBottom:3}}>⚠ {stats.pending} drug{stats.pending!==1?"s":""} pending pharmacist review</div>
              <div style={{fontSize:11,color:T.mut}}>AI-extracted records should be verified against current prescribing references before clinical trust.</div>
            </div>
            <button onClick={()=>setSrc("ai_generated")} style={{...ab(T.gold,{fontSize:11,padding:"6px 14px",flexShrink:0})}}>Show Pending</button>
          </div>
        </div>
      )}

      <div style={{marginTop:40,textAlign:"center"}}>
        <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:9,color:T.dim,letterSpacing:1.5}}>NOTRYA · DRUG FORMULARY ADMIN · VERIFY AI-EXTRACTED RECORDS BEFORE CLINICAL USE · CONSULT PHARMACIST</span>
      </div>
    </div>
  );
}