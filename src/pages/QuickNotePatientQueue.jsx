// QuickNotePatientQueue — the 4-slot patient queue bar
export default function QuickNotePatientQueue({
  slots, activeSlot, slotCacheIds, slotSaveTimes, slotSaving,
  switchToSlot, saveAllSlots, setShowKbHelp, slotsRestored, slotsRestoredCount, setSlotsRestored,
}) {
  const getSaveLabel = (ts) => {
    if (!ts) return null;
    const min = Math.floor((Date.now() - ts) / 60000);
    if (min < 1) return "just now";
    if (min === 1) return "1m ago";
    if (min < 60) return `${min}m ago`;
    return `${Math.floor(min / 60)}h ago`;
  };

  const etMap = { adult:"ED", peds:"Peds", psych:"Psych", trauma:"Trauma", obs:"Obs" };

  return (
    <div style={{marginBottom:10}} className="no-print">
      {slotsRestored&&(
        <div className="qn-fade" style={{display:"flex",alignItems:"center",gap:10,
          padding:"8px 14px",marginBottom:8,borderRadius:10,
          background:"rgba(0,229,192,.06)",border:"1px solid rgba(0,229,192,.3)"}}>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--qn-teal)"}}>↻</span>
          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"var(--qn-txt2)",flex:1}}>
            <strong style={{color:"var(--qn-teal)"}}>{slotsRestoredCount} patient slot{slotsRestoredCount>1?"s":""}</strong> restored from your last session
          </span>
          <button onClick={()=>setSlotsRestored(false)}
            style={{padding:"2px 8px",borderRadius:5,cursor:"pointer",
              fontFamily:"'JetBrains Mono',monospace",fontSize:8,
              border:"1px solid rgba(42,79,122,.4)",background:"transparent",
              color:"var(--qn-txt4)"}}>✕</button>
        </div>
      )}

      <div style={{display:"flex",gap:6,padding:"8px 10px",borderRadius:12,
        background:"rgba(8,22,40,.7)",border:"1px solid rgba(42,79,122,.35)"}}>
        {slots.map((slot,i)=>{
          const isActive = i === activeSlot;
          const isEmpty = !slot.cc && !slot.hpi && !slot.mdmResult;
          const isSaved = !!slot.savedNoteId;
          const hasDisp = !!slot.dispResult;
          const hasMDM = !!slot.mdmResult;
          const hasP2Data = !!(slot.labs||slot.imaging||slot.newVitals);
          const hasP1Data = !!(slot.cc||slot.hpi);
          const hasCacheId = !!slotCacheIds[i];
          const status = isEmpty ? null
            : isSaved  ? {label:"Saved",     color:"var(--qn-green)",  bg:"rgba(61,255,160,.12)",  bd:"rgba(61,255,160,.4)"}
            : hasDisp  ? {label:"Dispo Done",color:"var(--qn-purple)", bg:"rgba(155,109,255,.12)", bd:"rgba(155,109,255,.4)"}
            : hasMDM&&hasP2Data ? {label:"Phase 2",color:"var(--qn-blue)",  bg:"rgba(59,158,255,.12)",  bd:"rgba(59,158,255,.4)"}
            : hasMDM   ? {label:"MDM Done",  color:"var(--qn-teal)",   bg:"rgba(0,229,192,.12)",   bd:"rgba(0,229,192,.4)"}
            : hasP1Data? {label:"Phase 1",   color:"var(--qn-gold)",   bg:"rgba(245,200,66,.1)",   bd:"rgba(245,200,66,.35)"}
            : null;
          const displayName = slot.patientName||(slot.cc?slot.cc.slice(0,22)+(slot.cc.length>22?"…":""):null);
          const minutesAgo = slot.lastActivity?Math.floor((Date.now()-slot.lastActivity)/60000):null;
          const timeLabel = minutesAgo!==null&&minutesAgo<120&&!isActive
            ? minutesAgo<1?"just now":minutesAgo===1?"1m ago":`${minutesAgo}m ago` : null;
          const etLabel = slot.encounterType&&slot.encounterType!=="adult"?etMap[slot.encounterType]||slot.encounterType:null;
          const saveLabel = getSaveLabel(slotSaveTimes[i]);
          return (
            <button key={i} onClick={()=>switchToSlot(i)}
              style={{flex:1,padding:"8px 10px",borderRadius:9,cursor:"pointer",
                textAlign:"left",transition:"all .15s",position:"relative",
                border:`1px solid ${isActive?"rgba(0,229,192,.55)":isEmpty?"rgba(42,79,122,.2)":"rgba(42,79,122,.45)"}`,
                background:isActive?"rgba(0,229,192,.1)":isEmpty?"rgba(8,22,40,.3)":"rgba(14,37,68,.55)"}}>
              <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:isEmpty?0:4}}>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:700,letterSpacing:.5,color:isActive?"var(--qn-teal)":"var(--qn-txt4)"}}>P{i+1}</span>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:"rgba(42,79,122,.5)"}}>Ctrl+{i+1}</span>
                <div style={{flex:1}} />
                {isSaved&&<div style={{width:7,height:7,borderRadius:"50%",background:"var(--qn-green)",boxShadow:"0 0 5px rgba(61,255,160,.6)",flexShrink:0}} />}
                {isActive&&!isSaved&&<div style={{width:6,height:6,borderRadius:"50%",background:"var(--qn-teal)",flexShrink:0,animation:"qnpulse 1.2s ease-in-out infinite"}} />}
                {hasCacheId&&!isSaved&&<div style={{width:5,height:5,borderRadius:"50%",background:"rgba(59,158,255,.6)",flexShrink:0}} />}
              </div>
              {isEmpty?(
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"rgba(42,79,122,.5)",fontStyle:"italic"}}>Empty</div>
              ):(
                <>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:isActive?700:600,
                    color:isActive?"var(--qn-txt)":"var(--qn-txt2)",lineHeight:1.25,marginBottom:4,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {displayName||"No CC entered"}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
                    {slot.patientAge&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--qn-txt4)"}}>{slot.patientAge}yo</span>}
                    {etLabel&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:"rgba(107,158,200,.6)",background:"rgba(42,79,122,.2)",borderRadius:4,padding:"1px 5px"}}>{etLabel}</span>}
                    {timeLabel&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:"rgba(107,158,200,.4)",marginLeft:"auto"}}>{timeLabel}</span>}
                  </div>
                  {status&&(
                    <div style={{marginTop:5,display:"inline-flex",alignItems:"center",gap:4,padding:"2px 7px",borderRadius:5,background:status.bg,border:`1px solid ${status.bd}`}}>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,fontWeight:700,color:status.color,letterSpacing:.5,textTransform:"uppercase"}}>{status.label}</span>
                    </div>
                  )}
                  <div style={{display:"flex",alignItems:"center",gap:4,marginTop:5}}>
                    {saveLabel&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:"rgba(59,158,255,.5)",flex:1}}>☁ {saveLabel}</span>}
                    <button onClick={e=>{e.stopPropagation();saveAllSlots(true);}} disabled={slotSaving}
                      style={{padding:"1px 7px",borderRadius:4,cursor:"pointer",
                        fontFamily:"'JetBrains Mono',monospace",fontSize:7,fontWeight:700,
                        border:`1px solid ${slotSaving?"rgba(42,79,122,.25)":"rgba(59,158,255,.4)"}`,
                        background:slotSaving?"rgba(14,37,68,.3)":"rgba(59,158,255,.08)",
                        color:slotSaving?"var(--qn-txt4)":"var(--qn-blue)"}}>
                      {slotSaving?"●":"↑ Save"}
                    </button>
                  </div>
                </>
              )}
            </button>
          );
        })}
        <div style={{display:"flex",flexDirection:"column",justifyContent:"center",padding:"0 2px"}}>
          <div style={{width:1,height:40,background:"rgba(42,79,122,.35)"}} />
        </div>
        <button onClick={()=>setShowKbHelp(h=>!h)} title="Keyboard shortcuts (Shift+?)"
          style={{alignSelf:"center",padding:"6px 10px",borderRadius:7,cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,
            border:"1px solid rgba(42,79,122,.4)",background:"transparent",
            color:"var(--qn-txt4)",flexShrink:0}}>?</button>
      </div>

      {slots.some(s=>!!(s.cc||s.hpi||s.mdmResult))&&(
        <div style={{display:"flex",gap:10,marginTop:5,paddingLeft:4,flexWrap:"wrap",alignItems:"center"}}>
          {[
            {label:"Phase 1",color:"var(--qn-gold)"},{label:"MDM Done",color:"var(--qn-teal)"},
            {label:"Phase 2",color:"var(--qn-blue)"},{label:"Dispo Done",color:"var(--qn-purple)"},
            {label:"Saved",color:"var(--qn-green)"},
          ].map(({label,color})=>(
            <div key={label} style={{display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:color,flexShrink:0}} />
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:"rgba(107,158,200,.5)",letterSpacing:.4}}>{label}</span>
            </div>
          ))}
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:"rgba(59,158,255,.6)",flexShrink:0}} />
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:"rgba(107,158,200,.5)"}}>Session saved</span>
          </div>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:"rgba(42,79,122,.5)",marginLeft:4}}>Ctrl+1–4 switch · Ctrl+S save all</span>
        </div>
      )}
    </div>
  );
}