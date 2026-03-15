import { useState } from "react";
import { base44 } from "@/api/base44Client";

export default function SaveCaseModal({ weight, pedAge, pedUnit, pedWt, pedCat, bz, onClose, onSaved }) {
  const [patientName, setPatientName] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!patientName.trim()) return;
    setSaving(true);
    const ageLabel = pedAge ? `${pedAge} ${pedUnit}` : "";
    await base44.entities.SavedCase.create({
      patient_name: patientName.trim(),
      patient_age: ageLabel,
      weight_kg: weight,
      weight_source: pedWt ? "measured" : "age-estimated",
      broselow_zone: bz?.zone || "",
      notes: notes.trim(),
      category_filter: pedCat,
    });
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:1000,
      display:"flex",alignItems:"center",justifyContent:"center"
    }}>
      <div style={{
        background:"#0d1628",border:"1px solid rgba(0,196,160,0.25)",borderRadius:14,
        padding:24,width:380,maxWidth:"90vw"
      }}>
        <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0",marginBottom:4}}>💾 Save Case</div>
        <div style={{fontSize:11,color:"#4a6080",marginBottom:18}}>
          Weight: <span style={{color:"#00c4a0",fontWeight:600}}>{weight} kg</span>
          {bz && <span style={{marginLeft:8,color:bz.hex}}>● {bz.zone}</span>}
        </div>

        <label style={{display:"block",fontSize:10,letterSpacing:".08em",textTransform:"uppercase",color:"#4a6080",marginBottom:5}}>
          Patient Name / ID *
        </label>
        <input
          autoFocus
          value={patientName}
          onChange={e=>setPatientName(e.target.value)}
          placeholder="e.g. J. Smith, MRN-1234..."
          style={{
            width:"100%",background:"#162240",border:"1px solid rgba(0,196,160,0.15)",
            borderRadius:8,padding:"8px 11px",color:"#e2e8f0",fontSize:13,
            outline:"none",marginBottom:14,fontFamily:"inherit",boxSizing:"border-box"
          }}
        />

        <label style={{display:"block",fontSize:10,letterSpacing:".08em",textTransform:"uppercase",color:"#4a6080",marginBottom:5}}>
          Clinical Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={e=>setNotes(e.target.value)}
          placeholder="Allergies, diagnosis, attending, etc..."
          rows={3}
          style={{
            width:"100%",background:"#162240",border:"1px solid rgba(0,196,160,0.15)",
            borderRadius:8,padding:"8px 11px",color:"#e2e8f0",fontSize:13,
            outline:"none",resize:"vertical",fontFamily:"inherit",boxSizing:"border-box"
          }}
        />

        <div style={{display:"flex",gap:8,marginTop:18,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{
            padding:"7px 16px",borderRadius:7,fontSize:12,fontWeight:500,cursor:"pointer",
            border:"1px solid rgba(0,196,160,0.2)",background:"transparent",color:"#94a3b8",fontFamily:"inherit"
          }}>Cancel</button>
          <button onClick={handleSave} disabled={saving||!patientName.trim()} style={{
            padding:"7px 16px",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",
            background:"#00c4a0",border:"none",color:"#080e1a",fontFamily:"inherit",
            opacity:(saving||!patientName.trim())?0.4:1
          }}>{saving?"Saving...":"Save Case"}</button>
        </div>
      </div>
    </div>
  );
}