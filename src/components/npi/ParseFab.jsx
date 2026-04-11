import { useState, useRef, useEffect } from "react";

export default function ParseFab({ parseText, setParseText, parsing, onParse, tabLabel }) {
  const [open, setOpen] = useState(false);
  const taRef = useRef(null);
  useEffect(() => { if (open) setTimeout(() => taRef.current?.focus(), 120); }, [open]);

  return (
    <div style={{ position:"fixed", bottom:72, right:18, zIndex:9990 }}>
      {open && (
        <div style={{ position:"absolute", bottom:56, right:0, width:318,
          background:"#081628", border:"1px solid #1a3555", borderRadius:12,
          padding:"14px 16px", boxShadow:"0 16px 56px rgba(0,0,0,.65)" }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--npi-txt4)",
            letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
            Paste & Parse → {tabLabel}
          </div>
          <textarea ref={taRef} value={parseText} onChange={e => setParseText(e.target.value)} rows={5}
            placeholder="Paste triage note, EMS report, nursing note, or any clinical text..."
            style={{ width:"100%", background:"rgba(8,24,48,0.85)",
              border:"1px solid rgba(26,53,85,0.65)", borderRadius:8,
              padding:"8px 10px", color:"var(--npi-txt)",
              fontFamily:"'DM Sans',sans-serif", fontSize:12, outline:"none",
              resize:"none", boxSizing:"border-box", marginBottom:10 }} />
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
            <button onClick={() => setOpen(false)}
              style={{ padding:"6px 12px", borderRadius:7,
                border:"1px solid rgba(42,77,114,0.5)", background:"transparent",
                color:"var(--npi-txt4)", fontFamily:"'DM Sans',sans-serif", fontSize:11, cursor:"pointer" }}>
              Cancel
            </button>
            <button onClick={() => { onParse(); setOpen(false); }}
              disabled={parsing || !parseText.trim()}
              style={{ padding:"6px 14px", borderRadius:7,
                border:"1px solid rgba(0,229,192,0.4)",
                background: parsing ? "transparent" : "rgba(0,229,192,0.1)",
                color: parsing ? "var(--npi-txt4)" : "var(--npi-teal)",
                fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
                cursor: parsing ? "default" : "pointer" }}>
              {parsing ? "Parsing..." : "✨ Parse"}
            </button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen(o => !o)}
        title="Paste & Parse clinical text into current section"
        style={{ width:44, height:44, borderRadius:22,
          border:`1px solid ${open ? "rgba(0,229,192,0.6)" : "rgba(0,229,192,0.35)"}`,
          background: open ? "rgba(0,229,192,0.18)" : "rgba(8,22,46,0.95)",
          color:"var(--npi-teal)", fontSize:17, cursor:"pointer",
          boxShadow:"0 4px 20px rgba(0,0,0,.5)", display:"flex",
          alignItems:"center", justifyContent:"center",
          backdropFilter:"blur(8px)" }}>
        {open ? "✕" : "📋"}
      </button>
    </div>
  );
}