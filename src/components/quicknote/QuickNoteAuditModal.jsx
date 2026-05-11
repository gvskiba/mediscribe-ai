import { useState } from "react";

export default function QuickNoteAuditModal({ note, onClose }) {
  const [copied, setCopied] = useState(false);
  const savedAt = note.created_date
    ? new Date(note.created_date).toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"})
    : "Unknown";
  const copyText = () => {
    navigator.clipboard.writeText(note.full_note_text||note.raw_note||"").then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    });
  };
  return (
    <div style={{ position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",
      justifyContent:"center",background:"rgba(3,8,20,.88)",backdropFilter:"blur(6px)",padding:"16px" }}>
      <div style={{ width:"100%",maxWidth:720,maxHeight:"88vh",display:"flex",flexDirection:"column",
        background:"rgba(8,22,40,.98)",border:"1px solid rgba(61,255,160,.3)",
        borderRadius:16,overflow:"hidden",boxShadow:"0 24px 80px rgba(0,0,0,.65)" }}>
        <div style={{ display:"flex",alignItems:"center",gap:12,padding:"13px 18px",
          borderBottom:"1px solid rgba(42,79,122,.35)",background:"rgba(61,255,160,.04)",flexShrink:0 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:15,color:"var(--qn-green)" }}>
              Saved Note — Audit View
            </div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"rgba(107,158,200,.5)",marginTop:3 }}>
              Saved {savedAt} · ID: {note.id}
            </div>
          </div>
          <button onClick={copyText} style={{ padding:"5px 13px",borderRadius:7,cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,
            border:`1px solid ${copied?"rgba(61,255,160,.5)":"rgba(42,79,122,.4)"}`,
            background:copied?"rgba(61,255,160,.1)":"transparent",
            color:copied?"var(--qn-green)":"var(--qn-txt3)" }}>
            {copied?"✓ Copied":"Copy text"}
          </button>
          <button onClick={onClose} style={{ padding:"5px 11px",borderRadius:7,cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace",fontSize:9,
            border:"1px solid rgba(42,79,122,.4)",background:"transparent",color:"var(--qn-txt4)" }}>
            ✕ Close
          </button>
        </div>
        <div style={{ display:"flex",gap:7,flexWrap:"wrap",padding:"10px 18px",
          borderBottom:"1px solid rgba(42,79,122,.2)",background:"rgba(14,37,68,.3)",flexShrink:0 }}>
          {[{l:"CC",v:note.cc},{l:"Diagnosis",v:note.working_diagnosis},{l:"MDM",v:note.mdm_level},{l:"Disposition",v:note.disposition}]
            .filter(f=>f.v).map(({l,v}) => (
            <div key={l} style={{ display:"flex",alignItems:"center",gap:5,padding:"3px 9px",
              borderRadius:5,background:"rgba(42,79,122,.2)",border:"1px solid rgba(42,79,122,.35)" }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:"var(--qn-txt4)",letterSpacing:.8,textTransform:"uppercase" }}>{l}</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"var(--qn-txt2)",fontWeight:600 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ flex:1,overflowY:"auto",padding:"14px 18px" }}>
          <pre style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,lineHeight:1.8,
            color:"var(--qn-txt2)",background:"rgba(14,37,68,.5)",border:"1px solid rgba(42,79,122,.25)",
            borderRadius:8,padding:"12px 14px",whiteSpace:"pre-wrap",wordBreak:"break-word",margin:0 }}>
            {note.full_note_text||note.raw_note||"No note text found."}
          </pre>
        </div>
        <div style={{ padding:"9px 18px",borderTop:"1px solid rgba(42,79,122,.2)",
          background:"rgba(14,37,68,.35)",flexShrink:0,display:"flex",alignItems:"center",gap:8 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:"rgba(107,158,200,.35)",flex:1 }}>
            Exact content saved to ClinicalNote entity. Verify before closing encounter.
          </span>
          <button onClick={onClose} style={{ padding:"6px 16px",borderRadius:7,cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:12,
            border:"1px solid rgba(0,229,192,.4)",background:"rgba(0,229,192,.08)",color:"var(--qn-teal)" }}>
            Verified — Close
          </button>
        </div>
      </div>
    </div>
  );
}