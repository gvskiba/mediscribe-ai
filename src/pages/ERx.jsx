import { useState, useMemo, useCallback } from "react";
import { useDrugsQuery } from "@/components/erx/useDrugsQuery";
import PDMPQueryPanel from "@/components/erx/PDMPQueryPanel";

// Font + CSS
(() => {
  if (document.getElementById("erx-fonts")) return;
  const l = document.createElement("link");
  l.id = "erx-fonts";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
  const s = document.createElement("style");
  s.id = "erx-css";
  s.textContent = `
    @keyframes erx-in {from{opacity:0;transform:translateY(6px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)}}
    @keyframes erx-spin {to{transform:rotate(360deg)}}
    @keyframes erx-shimmer {0%{background-position:-200% center} 100%{background-position:200% center}}
    .erx-in {animation:erx-in .3s cubic-bezier(.34,1.56,.64,1) forwards}
    .erx-shimmer {background:linear-gradient(90deg,#e8f0fe 0%,#fff 30%,#00e5c0 55%,#e8f0fe 100%);background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:erx-shimmer 5s linear infinite}
    .erx-hover {transition:all .18s ease}
    ::-webkit-scrollbar {width:3px} ::-webkit-scrollbar-thumb {background:rgba(42,79,122,0.5);border-radius:2px}
  `;
  document.head.appendChild(s);
})();

const T = {
  bg:"#050f1e",panel:"#081628",card:"#0b1e36",up:"#0e2544",b:"rgba(26,53,85,0.8)",
  txt:"#e8f0fe",txt2:"#8aaccc",txt3:"#4a6a8a",txt4:"#2e4a6a",
  coral:"#ff6b6b",gold:"#f5c842",teal:"#00e5c0",blue:"#3b9eff",
  orange:"#ff9f43",purple:"#9b6dff",green:"#3dffa0",cyan:"#00d4ff",rose:"#f472b6",
};

const glass = (x={}) => ({backdropFilter:"blur(24px) saturate(200%)",WebkitBackdropFilter:"blur(24px) saturate(200%)",background:"rgba(8,22,40,0.75)",border:"1px solid rgba(26,53,85,0.45)",borderRadius:14,...x});
const deep = (x={}) => ({backdropFilter:"blur(40px) saturate(220%)",WebkitBackdropFilter:"blur(40px) saturate(220%)",background:"rgba(5,15,30,0.88)",border:"1px solid rgba(26,53,85,0.7)",...x});

// Placeholder components (import from elsewhere or stub)
function DrugSearchPanel() { return <div>Search panel stub</div>; }
function RxBuilder() { return <div>Builder stub</div>; }
function SignedRxQueue() { return <div>Queue stub</div>; }

export default function ERx() {
  const { drugs, isLoading } = useDrugsQuery();
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [searchQ, setSearchQ] = useState("");

  const filtered = drugs.filter(d => 
    d.name.toLowerCase().includes(searchQ.toLowerCase()) || 
    d.cls.toLowerCase().includes(searchQ.toLowerCase())
  );

  if (isLoading) {
    return (
      <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:T.bg,color:T.txt2,fontFamily:"DM Sans" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:36,marginBottom:10 }}>⏳</div>
          <div>Loading medications from database...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:"flex",height:"100%",gap:0 }}>
      {/* Sidebar */}
      <div style={{ flex:"0 0 340px",background:T.panel,borderRight:`1px solid rgba(26,53,85,0.6)`,display:"flex",flexDirection:"column",overflow:"hidden",color:T.txt,fontFamily:"DM Sans" }}>
        {/* Header */}
        <div style={{ padding:"24px 18px",borderBottom:`1px solid rgba(26,53,85,0.6)`,background:`linear-gradient(135deg,${T.card}99,${T.panel}99)` }}>
          <div style={{ fontFamily:"Playfair Display",fontSize:28,fontWeight:900,marginBottom:14,background:"linear-gradient(135deg,#3b9eff,#00e5c0)",backgroundClip:"text",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>eRx</div>
          <input 
            placeholder="🔍 Search medications..." 
            value={searchQ} 
            onChange={e => setSearchQ(e.target.value)}
            style={{ width:"100%",padding:"10px 14px",borderRadius:10,background:"rgba(14,37,68,0.8)",border:`1px solid ${searchQ?"rgba(59,158,255,0.5)":"rgba(42,77,114,0.3)"}`,color:T.txt,fontSize:13,outline:"none",transition:"border-color .2s",fontFamily:"DM Sans" }} 
          />
        </div>

        {/* Drug list */}
        <div style={{ flex:1,overflowY:"auto",padding:"8px",display:"flex",flexDirection:"column",gap:4 }}>
          {filtered.length === 0 ? (
            <div style={{ padding:"40px 20px",textAlign:"center",color:T.txt3 }}>
              <div style={{ fontSize:24,marginBottom:10 }}>🔍</div>
              <div style={{ fontSize:12 }}>No medications found — {drugs.length} available in database</div>
            </div>
          ) : (
            filtered.map(d => {
              const isActive = selectedDrug?.id === d.id;
              return (
                <button 
                  key={d.id} 
                  onClick={() => setSelectedDrug(d)}
                  style={{
                    padding:"12px 14px",borderRadius:10,textAlign:"left",
                    background:isActive?`linear-gradient(135deg,rgba(59,158,255,0.15),rgba(0,229,192,0.08))`:"rgba(8,22,40,0.4)",
                    border:`1.5px solid ${isActive?"rgba(59,158,255,0.4)":"rgba(42,77,114,0.2)"}`,
                    color:isActive?T.blue:T.txt2,
                    fontSize:13,cursor:"pointer",transition:"all .18s",
                    boxShadow:isActive?`0 0 12px rgba(59,158,255,0.2)`:"none",
                  }}
                  onMouseEnter={e => !isActive && (e.currentTarget.style.background = "rgba(14,37,68,0.6)")}
                  onMouseLeave={e => !isActive && (e.currentTarget.style.background = "rgba(8,22,40,0.4)")}
                >
                  <div style={{ fontWeight:700,color:isActive?T.blue:T.txt }}>{d.name}</div>
                  {d.brand && <div style={{ fontSize:10,color:T.txt4,marginTop:2 }}>Brand: {d.brand}</div>}
                  <div style={{ fontSize:10,color:isActive?"rgba(59,158,255,0.6)":T.txt3,marginTop:3,paddingTop:6,borderTop:`1px solid ${isActive?"rgba(59,158,255,0.2)":"rgba(42,77,114,0.1)"}` }}>{d.cls}</div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden",position:"relative",background:T.bg,color:T.txt,fontFamily:"DM Sans" }}>
        <div style={{ position:"absolute",top:"-20%",right:"-10%",width:"50%",height:"50%",background:"radial-gradient(circle,rgba(59,158,255,0.08) 0%,transparent 70%)",pointerEvents:"none",zIndex:0 }}/>

        {!selectedDrug ? (
          <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",zIndex:1,position:"relative" }}>
            <div>
              <div style={{ fontSize:64,marginBottom:20,opacity:0.9 }}>💊</div>
              <div style={{ fontSize:18,fontWeight:600,color:T.txt,marginBottom:8 }}>Select a Medication</div>
              <div style={{ fontSize:13,color:T.txt3,maxWidth:300 }}>Choose a drug from the sidebar to view details, interactions, and PDMP query tools. {drugs.length} medications loaded from database.</div>
            </div>
          </div>
        ) : (
          <div style={{ flex:1,overflowY:"auto",padding:"32px 40px",zIndex:1,position:"relative" }}>
            <div style={{ maxWidth:1000 }}>
              <button 
                onClick={() => setSelectedDrug(null)}
                style={{ marginBottom:20,padding:"8px 14px",borderRadius:8,background:"rgba(14,37,68,0.7)",border:`1px solid rgba(42,77,114,0.4)`,color:T.txt2,fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(14,37,68,0.9)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(14,37,68,0.7)")}
              >
                ← Back to list
              </button>
              <div style={{ marginBottom:32 }}>
                <div style={{ fontFamily:"Playfair Display",fontSize:24,fontWeight:700,marginBottom:4,color:T.txt }}>{selectedDrug.name}</div>
                <div style={{ fontSize:13,color:T.txt3 }}>{selectedDrug.brand} · {selectedDrug.sub}</div>
                <div style={{ fontSize:12,color:T.txt4,marginTop:8 }}>{selectedDrug.note}</div>
              </div>
              <div style={{ padding:"24px",background:`linear-gradient(135deg,${T.card}88,rgba(8,22,40,0.6))`,borderRadius:16,border:`1px solid rgba(26,53,85,0.6)`,boxShadow:"0 8px 32px rgba(0,0,0,0.3)" }}>
                <PDMPQueryPanel />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}