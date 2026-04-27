// QuickNoteStyle.jsx
// CSS injection for QuickNote UI
// Exported: injectQNStyles

export function injectQNStyles() {
  if (document.getElementById("qn-css")) return;
  const s = document.createElement("style"); s.id = "qn-css";
  s.textContent = `
    :root{
      --qn-bg:#050f1e;--qn-panel:#081628;--qn-card:#0b1e36;
      --qn-txt:#f2f7ff;--qn-txt2:#b8d4f0;--qn-txt3:#82aece;--qn-txt4:#6b9ec8;
      --qn-teal:#00e5c0;--qn-gold:#f5c842;--qn-coral:#ff6b6b;
      --qn-blue:#3b9eff;--qn-purple:#9b6dff;--qn-green:#3dffa0;
      --qn-red:#ff4444;--qn-orange:#ff9f43;
      --qn-bd:rgba(42,79,122,0.4);--qn-up:rgba(14,37,68,0.75);
    }
    @keyframes qnfade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    .qn-fade{animation:qnfade .2s ease both}
    @keyframes qnshim{0%{background-position:-200% center}100%{background-position:200% center}}
    .qn-shim{
      background:linear-gradient(90deg,#e8f0fe 0%,#fff 25%,#00e5c0 50%,#3b9eff 75%,#e8f0fe 100%);
      background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;animation:qnshim 6s linear infinite
    }
    @keyframes qnpulse{0%,100%{opacity:.5}50%{opacity:1}}
    .qn-busy-dot{animation:qnpulse 1.2s ease-in-out infinite}
    .qn-ta{
      background:var(--qn-up);border:1px solid var(--qn-bd);border-radius:10px;
      padding:10px 12px;color:var(--qn-txt);font-family:'JetBrains Mono',monospace;
      font-size:11px;outline:none;width:100%;box-sizing:border-box;
      transition:border-color .15s;resize:vertical;line-height:1.65;
    }
    .qn-ta:focus{border-color:rgba(0,229,192,.5);box-shadow:0 0 0 2px rgba(0,229,192,.08)}
    .qn-ta::placeholder{color:rgba(130,174,206,.35)}
    .qn-ta.active-phase{border-color:rgba(0,229,192,.35)}
    .qn-ta.p2-active{border-color:rgba(59,158,255,.35)}
    .qn-btn{
      padding:10px 0;border-radius:10px;cursor:pointer;transition:all .15s;
      font-family:'DM Sans',sans-serif;font-weight:700;font-size:13px;
      display:flex;align-items:center;justify-content:center;gap:8px
    }
    .qn-btn:disabled{cursor:not-allowed;opacity:.45}
    .qn-section-lbl{
      font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;
      color:var(--qn-txt4);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px
    }
    .qn-card{
      background:rgba(8,22,40,.6);border:1px solid var(--qn-bd);
      border-radius:12px;padding:14px 16px
    }
    @media print{
      .no-print{display:none!important}
      body{background:#fff!important}
      .print-body{color:#111!important;background:#fff!important;padding:20px}
      .print-body *{color:#111!important;background:transparent!important;border-color:#ccc!important}
    }
  `;
  document.head.appendChild(s);
  if (!document.getElementById("qn-fonts")) {
    const l = document.createElement("link"); l.id = "qn-fonts"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
    document.head.appendChild(l);
  }
}