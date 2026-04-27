// QuickNoteKeyboardHelp.jsx
// Keyboard shortcut help modal for QuickNote
export default function QuickNoteKeyboardHelp({ onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999,
      background:"rgba(5,15,30,.85)", display:"flex",
      alignItems:"center", justifyContent:"center",
      backdropFilter:"blur(4px)" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{ background:"rgba(8,22,40,.98)",
          border:"1px solid rgba(42,79,122,.6)", borderRadius:16,
          padding:"24px 28px", maxWidth:560, width:"90%",
          maxHeight:"80vh", overflowY:"auto",
          boxShadow:"0 20px 60px rgba(0,0,0,.7)" }}>
        <div style={{ display:"flex", alignItems:"center", marginBottom:18 }}>
          <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
            fontSize:18, color:"var(--qn-txt)", flex:1 }}>
            Keyboard Shortcuts
          </span>
          <button onClick={onClose}
            style={{ background:"transparent", border:"none",
              cursor:"pointer", color:"var(--qn-txt4)", fontSize:18 }}>✕</button>
        </div>
        {[
          { section:"EHR Copy Workflow", items:[
            ["Shift+1","Copy Initial Note (Phase 1) → paste into EHR"],
            ["Shift+2","Copy Reevaluation & Disposition (Phase 2) → paste into EHR"],
            ["C",      "Copy full combined note"],
            ["Shift+C","Copy HPI / ROS / PE only"],
          ]},
          { section:"Generation", items:[
            ["Cmd+Enter","Generate MDM (Phase 1) or Disposition (Phase 2)"],
            ["Ctrl+T",   "Open CC / template picker"],
          ]},
          { section:"Field Navigation", items:[
            ["Alt+H","Jump to HPI field"],
            ["Alt+R","Jump to ROS field"],
            ["Alt+E","Jump to Physical Exam field"],
            ["Alt+L","Jump to Labs field"],
            ["Tab",  "Advance to next field"],
          ]},
          { section:"SmartFill", items:[
            ["1–N",     "Select SmartFill option"],
            ["Tab / →", "Skip current blank"],
            ["Enter",   "Confirm free-text input"],
            ["Esc",     "Exit SmartFill"],
          ]},
          { section:"Interface", items:[
            ["Shift+?","Toggle this help panel"],
            ["E",      "Edit MDM narrative (when visible)"],
            ["P",      "Print page"],
          ]},
        ].map(({ section, items }) => (
          <div key={section} style={{ marginBottom:16 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
              fontWeight:700, color:"var(--qn-teal)", letterSpacing:1.5,
              textTransform:"uppercase", marginBottom:8, paddingBottom:4,
              borderBottom:"1px solid rgba(0,229,192,.15)" }}>{section}</div>
            {items.map(([key, desc]) => (
              <div key={key} style={{ display:"flex", gap:12,
                alignItems:"baseline", marginBottom:5 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                  fontWeight:700, color:"var(--qn-txt)",
                  background:"rgba(42,79,122,.3)",
                  border:"1px solid rgba(42,79,122,.5)", borderRadius:5,
                  padding:"2px 8px", flexShrink:0, minWidth:80,
                  textAlign:"center" }}>{key}</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
                  color:"var(--qn-txt3)", lineHeight:1.4 }}>{desc}</span>
              </div>
            ))}
          </div>
        ))}
        <div style={{ marginTop:8, fontFamily:"'JetBrains Mono',monospace",
          fontSize:8, color:"rgba(107,158,200,.4)", letterSpacing:.5 }}>
          Shift+? or click outside to close
        </div>
      </div>
    </div>
  );
}