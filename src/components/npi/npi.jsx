@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');

.npi-root {
  --bg:#050f1e;--bg-panel:#081628;--bg-card:#0b1e36;--bg-up:#0e2544;
  --border:#1a3555;--border-hi:#2a4f7a;
  --blue:#3b9eff;--cyan:#00d4ff;--teal:#00e5c0;--gold:#f5c842;
  --purple:#9b6dff;--coral:#ff6b6b;--green:#3dffa0;--orange:#ff9f43;
  --txt:#e8f0fe;--txt2:#8aaccc;--txt3:#4a6a8a;--txt4:#2e4a6a;
  background:var(--bg);color:var(--txt);
  font-family:'DM Sans',sans-serif;font-size:13px;
  display:flex;flex-direction:column;overflow:hidden;
  height:100vh;margin-left:72px;
}
.npi-root * { box-sizing:border-box; }
.npi-root input, .npi-root select, .npi-root textarea { font-family:'DM Sans',sans-serif; }

/* NAVBAR */
.npi-nav{height:44px;background:#040d1a;border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:10px;flex-shrink:0}
.npi-logo{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:var(--txt)}
.npi-ndiv{width:1px;height:16px;background:var(--border)}
.npi-ntitle{font-size:12px;color:var(--txt2);font-style:italic;font-family:'DM Sans',sans-serif}
.npi-nav-right{margin-left:auto;display:flex;align-items:center;gap:7px}
.npi-nav-btn{height:30px;padding:0 13px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;display:flex;align-items:center;gap:5px}
.npi-nav-btn.new{background:#0a2040;border:1px solid var(--blue);color:var(--blue)}
.npi-nav-btn.new:hover{background:#0e2a55}
.npi-nav-btn.kb{background:#0a2535;border:1px solid rgba(0,212,255,.3);color:var(--cyan)}
.npi-nav-btn.kb:hover{background:#0e3040}
.npi-save-btn{height:30px;padding:0 14px;background:var(--teal);border:none;border-radius:6px;color:#050f1e;font-size:12px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;display:flex;align-items:center;gap:5px}
.npi-save-btn:hover{background:#00ffd0}
.npi-avatar{width:30px;height:30px;border-radius:50%;background:#0a2040;border:1.5px solid var(--border-hi);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--blue);cursor:pointer;flex-shrink:0}

/* VITALS BAR */
.npi-vbar{height:36px;background:#060f1c;border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 12px;gap:6px;overflow-x:auto;flex-shrink:0}
.npi-vbar::-webkit-scrollbar{display:none}
.npi-vchip{display:flex;align-items:center;gap:5px;background:var(--bg-card);border:1px solid var(--border);border-radius:5px;padding:2px 8px;flex-shrink:0}
.npi-vl{font-size:9px;color:var(--txt3);text-transform:uppercase;letter-spacing:.5px;font-family:'JetBrains Mono',monospace}
.npi-vv{font-size:12px;font-weight:600;color:var(--txt);font-family:'JetBrains Mono',monospace}
.npi-vv.abn{color:var(--coral)}
.npi-vv.lo{color:var(--blue)}
.npi-vsep{width:1px;height:18px;background:var(--border);flex-shrink:0}
.npi-pt-chip{display:flex;align-items:center;gap:6px;background:#0a1e35;border:1px solid var(--border-hi);border-radius:5px;padding:2px 9px;flex-shrink:0}
.npi-pt-name{font-family:'Playfair Display',serif;font-size:11px;color:var(--txt)}
.npi-pt-mrn{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--txt3)}
.npi-prog-wrap{flex:1;max-width:180px;margin-left:auto;margin-right:6px}
.npi-prog-label{font-size:9px;color:var(--txt3);margin-bottom:2px;display:flex;justify-content:space-between}
.npi-prog-track{height:4px;background:var(--bg-up);border-radius:2px;overflow:hidden}
.npi-prog-fill{height:100%;background:linear-gradient(90deg,var(--teal),var(--blue));border-radius:2px;transition:width .4s ease}

/* LAYOUT */
.npi-layout{display:flex;flex:1;overflow:hidden}

/* SIDEBAR */
.npi-sb{flex-shrink:0;background:#060e1c;border-right:1px solid var(--border);padding:10px 0;transition:width .25s cubic-bezier(.4,0,.2,1);overflow:hidden}
.npi-sb.open{width:210px}
.npi-sb.collapsed{width:36px;overflow-y:hidden}
.npi-sb::-webkit-scrollbar{width:3px}
.npi-sb::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
.npi-sb-toggle{display:flex;align-items:center;justify-content:center;padding:8px 0;cursor:pointer;color:var(--txt4);font-size:16px;transition:color .15s;flex-shrink:0}
.npi-sb-toggle:hover{color:var(--teal)}
.npi-sb.collapsed .npi-sb-inner{display:none}
.npi-sb-inner{min-width:210px;overflow-y:auto;max-height:calc(100vh - 120px)}
.npi-sb-inner::-webkit-scrollbar{width:3px}
.npi-sb-inner::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
.npi-sb-head{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--txt4);padding:5px 12px 3px}
.npi-sb-item{display:flex;align-items:center;gap:7px;padding:7px 12px;cursor:pointer;transition:background .15s;border-left:2px solid transparent;font-size:12px;color:var(--txt2);white-space:nowrap}
.npi-sb-item:hover{background:var(--bg-card);color:var(--txt)}
.npi-sb-item.active{background:#0a2040;border-left-color:var(--blue);color:var(--blue);font-weight:500}
.npi-pt-summary{margin:8px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:9px 11px}
.npi-pts-name{font-family:'Playfair Display',serif;font-size:12px;font-weight:600;color:var(--txt);margin-bottom:2px}
.npi-pts-meta{font-size:10px;color:var(--txt2);margin-bottom:5px}
.npi-pts-cc-label{font-size:9px;color:var(--txt3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
.npi-pts-cc-val{font-size:11px;color:var(--orange);font-style:italic;margin-bottom:6px}
.npi-pts-step{display:flex;align-items:center;gap:5px;padding:2px 0}
.npi-step-dot{width:7px;height:7px;border-radius:50%;background:var(--bg-up);border:1.5px solid var(--border);flex-shrink:0;transition:all .3s}
.npi-step-dot.done{background:var(--teal);border-color:var(--teal)}
.npi-step-label{font-size:10px;color:var(--txt3)}

/* MAIN */
.npi-main{flex:1;overflow-y:auto;padding:16px 18px 100px;min-width:0}
.npi-main::-webkit-scrollbar{width:4px}
.npi-main::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}

/* PANELS */
.npi-panel{display:none;animation:npi-fadeup .22s ease}
.npi-panel.active{display:block}
@keyframes npi-fadeup{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}

/* FORM ELEMENTS */
.npi-sec-title{font-family:'Playfair Display',serif;font-size:17px;font-weight:600;color:var(--txt);margin-bottom:3px}
.npi-sec-sub{font-size:11px;color:var(--txt3);margin-bottom:14px}
.npi-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}
.npi-grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px}
.npi-grid-auto{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px;margin-bottom:14px}
.npi-field{display:flex;flex-direction:column;gap:3px}
.npi-label{font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.5px;font-weight:600}
.npi-label .opt{color:var(--txt4);font-weight:400;text-transform:none;letter-spacing:0}
.npi-input{height:35px;background:var(--bg-card);border:1.5px solid var(--border);border-radius:8px;padding:0 10px;color:var(--txt);font-size:13px;outline:none;transition:all .2s;width:100%}
.npi-input:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(59,158,255,.1)}
.npi-input::placeholder{color:var(--txt4)}
.npi-select{height:35px;background:var(--bg-card);border:1.5px solid var(--border);border-radius:8px;padding:0 10px;color:var(--txt);font-size:13px;outline:none;cursor:pointer;width:100%;appearance:none;transition:border-color .2s}
.npi-select:focus{border-color:var(--blue)}
.npi-textarea{background:var(--bg-card);border:1.5px solid var(--border);border-radius:8px;padding:7px 10px;color:var(--txt);font-size:13px;outline:none;resize:vertical;width:100%;min-height:68px;transition:border-color .2s;line-height:1.5}
.npi-textarea:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(59,158,255,.1)}
.npi-textarea::placeholder{color:var(--txt4)}
.npi-hdiv{height:1px;background:var(--border);margin:16px 0}
.npi-hint{font-size:11px;color:var(--txt2);padding:6px 10px;background:var(--bg-card);border:1px solid var(--border);border-radius:5px;border-left:3px solid var(--blue);margin-bottom:12px}

/* PARSE BOX */
.npi-parse-box{background:linear-gradient(135deg,#081628 0%,#0a1e38 100%);border:1.5px solid var(--border-hi);border-radius:12px;padding:14px 16px;margin-bottom:18px;position:relative;overflow:hidden}
.npi-parse-title{font-size:12px;font-weight:600;color:var(--teal);margin-bottom:3px}
.npi-parse-sub{font-size:11px;color:var(--txt3);margin-bottom:8px}
.npi-parse-btn{margin-top:8px;height:32px;padding:0 14px;background:#052520;border:1.5px solid var(--teal);border-radius:7px;color:var(--teal);font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;font-family:'DM Sans',sans-serif}
.npi-parse-btn:hover{background:#0a3530}
.npi-parse-btn:disabled{opacity:.5;cursor:wait}

/* CC GRID */
.npi-cc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:7px;margin-bottom:14px}
.npi-cc-btn{padding:8px 10px;background:var(--bg-card);border:1.5px solid var(--border);border-radius:8px;color:var(--txt2);font-size:11px;cursor:pointer;transition:all .18s;text-align:left;display:flex;flex-direction:column;gap:3px}
.npi-cc-btn:hover{border-color:var(--border-hi);color:var(--txt);background:var(--bg-up)}
.npi-cc-btn.selected{background:#0a2040;border-color:var(--blue);color:var(--blue)}
.npi-cc-icon{font-size:17px}
.npi-cc-label{font-size:11px;font-weight:500;line-height:1.2}

/* VITALS GRID */
.npi-vitals-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-bottom:16px}
.npi-vit-field{background:var(--bg-card);border:1.5px solid var(--border);border-radius:8px;padding:10px 12px;transition:all .2s;position:relative}
.npi-vit-field:focus-within{border-color:var(--blue);box-shadow:0 0 0 3px rgba(59,158,255,.1)}
.npi-vit-field.abn-field{border-color:var(--coral)!important;box-shadow:0 0 0 3px rgba(255,107,107,.1)!important}
.npi-vit-field.lo-field{border-color:var(--blue)!important}
.npi-vit-icon{font-size:15px;margin-bottom:3px}
.npi-vit-label-txt{font-size:9px;color:var(--txt3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}
.npi-vit-input{width:100%;background:transparent;border:none;outline:none;font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:600;color:var(--txt)}
.npi-vit-input::placeholder{color:var(--txt4);font-size:13px;font-weight:400}
.npi-vit-unit{font-size:9px;color:var(--txt3);margin-top:2px}
.npi-vit-status{position:absolute;top:7px;right:7px;width:7px;height:7px;border-radius:50%;background:var(--border)}
.npi-vit-status.abn{background:var(--coral)}
.npi-vit-status.lo{background:var(--blue)}
.npi-vit-status.ok{background:var(--teal)}

/* MED TAGS */
.npi-med-tags{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px;min-height:34px;background:var(--bg-card);border:1.5px solid var(--border);border-radius:8px;padding:5px 9px;align-items:center;cursor:text;transition:border-color .2s}
.npi-med-tags:focus-within{border-color:var(--cyan)}
.npi-med-tag{display:flex;align-items:center;gap:4px;background:#052535;border:1px solid rgba(0,212,255,.25);border-radius:4px;padding:2px 7px;font-size:11px;color:var(--cyan);flex-shrink:0}
.npi-allergy-tag{background:#1a0808;border-color:rgba(255,107,107,.3);color:var(--coral)}
.npi-med-tag-x{cursor:pointer;color:var(--txt3);font-size:11px;transition:color .15s}
.npi-med-tag-x:hover{color:var(--coral)}
.npi-med-tag-input{border:none;outline:none;background:transparent;color:var(--txt);font-size:12px;min-width:80px;flex:1}
.npi-med-tag-input::placeholder{color:var(--txt4)}
.npi-med-hint{font-size:10px;color:var(--txt3);margin-bottom:10px}
.npi-quick-med{color:var(--cyan);cursor:pointer;margin-right:2px}
.npi-quick-med:hover{text-decoration:underline}

/* PMH SYSTEMS */
.npi-pmh-systems{display:flex;flex-direction:column;gap:6px;margin-bottom:12px}
.npi-pmh-sys{background:var(--bg-card);border:1.5px solid var(--border);border-radius:10px;overflow:hidden;transition:border-color .2s}
.npi-pmh-sys.has-sel{border-color:var(--blue)}
.npi-pmh-sys-hdr{display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;user-select:none;transition:background .15s}
.npi-pmh-sys-hdr:hover{background:var(--bg-up)}
.npi-pmh-sys-ico{font-size:16px;flex-shrink:0}
.npi-pmh-sys-name{font-size:12px;font-weight:600;color:var(--txt);flex:1}
.npi-pmh-sys-count{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;padding:1px 7px;border-radius:10px;background:#0a2040;color:var(--blue);min-width:20px;text-align:center}
.npi-pmh-sys-count.zero{background:var(--bg-up);color:var(--txt4)}
.npi-pmh-sys-chevron{font-size:11px;color:var(--txt3);transition:transform .2s;flex-shrink:0}
.npi-pmh-sys-chevron.open{transform:rotate(90deg)}
.npi-pmh-sys-body{padding:8px 12px 10px;border-top:1px solid var(--border);display:none;flex-wrap:wrap;gap:5px}
.npi-pmh-sys-body.open{display:flex}
.npi-pmh-chip{padding:4px 10px;border-radius:5px;border:1.5px solid var(--border);background:transparent;color:var(--txt3);font-size:11px;cursor:pointer;transition:all .18s;user-select:none}
.npi-pmh-chip:hover{border-color:var(--border-hi);color:var(--txt2)}
.npi-pmh-chip.sel{background:#0a2040;border-color:var(--blue);color:var(--blue);font-weight:500}
.npi-pmh-chip.active-pmh{background:#062020;border-color:var(--teal);color:var(--teal)}

/* ROS */
.npi-ros-toolbar{display:flex;align-items:center;gap:7px;margin-bottom:12px;flex-wrap:wrap}
.npi-ros-tool-btn{padding:5px 12px;border-radius:5px;font-size:11px;cursor:pointer;transition:all .18s;font-family:'DM Sans',sans-serif;border:1.5px solid var(--border);background:transparent;color:var(--txt2)}
.npi-ros-tool-btn.teal{border-color:rgba(0,229,192,.4);color:var(--teal);background:#052520}
.npi-ros-tool-btn.red{border-color:rgba(255,107,107,.4);color:var(--coral);background:#1a0808}
.npi-ros-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;margin-bottom:18px}
.npi-ros-card{background:var(--bg-card);border:1.5px solid var(--border);border-radius:12px;padding:12px 14px;transition:all .2s;cursor:pointer;user-select:none;position:relative;overflow:hidden}
.npi-ros-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--bg-up);transition:background .2s}
.npi-ros-card.s1{border-color:rgba(0,229,192,.35);background:#051e18}
.npi-ros-card.s1::before{background:var(--teal)}
.npi-ros-card.s2{border-color:rgba(255,107,107,.35);background:#1a0808}
.npi-ros-card.s2::before{background:var(--coral)}
.npi-ros-card-header{display:flex;align-items:center;gap:7px;margin-bottom:7px}
.npi-ros-icon{font-size:16px}
.npi-ros-sys-name{font-size:12px;font-weight:600;color:var(--txt);flex:1}
.npi-ros-state-btns{display:flex;gap:3px}
.npi-rsb{width:24px;height:20px;border-radius:4px;border:1px solid var(--border);background:transparent;cursor:pointer;font-size:11px;transition:all .15s;display:flex;align-items:center;justify-content:center}
.npi-rsb.norm{border-color:rgba(0,229,192,.4);color:var(--teal)}
.npi-rsb.norm.active-btn{background:#062020;border-color:var(--teal)}
.npi-rsb.abn{border-color:rgba(255,107,107,.4);color:var(--coral)}
.npi-rsb.abn.active-btn{background:#1a0808;border-color:var(--coral)}
.npi-rsb.na{border-color:var(--border);color:var(--txt4)}
.npi-rsb.na.active-btn{background:var(--bg-up);color:var(--txt3)}
.npi-ros-norm-text{font-size:10px;color:var(--teal);margin-top:5px}
.npi-ros-symptoms{display:flex;flex-wrap:wrap;gap:4px;margin-top:7px}
.npi-ros-sym-chip{padding:2px 7px;border-radius:4px;font-size:10px;border:1px solid var(--border);color:var(--txt3);cursor:pointer;transition:all .15px}
.npi-ros-sym-chip:hover{border-color:var(--border-hi);color:var(--txt2)}
.npi-ros-sym-chip.sel-sym{background:#1a0808;border-color:var(--coral);color:var(--coral)}
.npi-ros-abn-wrap{margin-top:7px;display:none}
.npi-ros-abn-wrap.open{display:block}
.npi-ros-abn-input{width:100%;background:rgba(255,107,107,.06);border:1px solid rgba(255,107,107,.25);border-radius:5px;padding:5px 8px;color:var(--txt);font-size:11px;font-family:'DM Sans',sans-serif;outline:none;resize:none;min-height:48px;line-height:1.4}
.npi-ros-abn-input:focus{border-color:rgba(255,107,107,.5)}

/* PE */
.npi-pe-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;margin-bottom:18px}
.npi-pe-card{background:var(--bg-card);border:1.5px solid var(--border);border-radius:12px;padding:12px 14px;transition:all .2s;position:relative;overflow:hidden}
.npi-pe-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--bg-up);transition:background .2s}
.npi-pe-card.s1{border-color:rgba(0,229,192,.35);background:#051e18}
.npi-pe-card.s1::before{background:var(--teal)}
.npi-pe-card.s2{border-color:rgba(255,107,107,.35);background:#1a0808}
.npi-pe-card.s2::before{background:var(--coral)}
.npi-pe-card-header{display:flex;align-items:center;gap:7px;margin-bottom:7px}
.npi-pe-normal-preview{font-size:10px;color:rgba(0,229,192,.7);line-height:1.5;margin-top:2px;font-style:italic;display:none}
.npi-pe-card.s1 .npi-pe-normal-preview{display:block}
.npi-pe-findings-wrap{margin-top:7px;display:none}
.npi-pe-findings-wrap.open{display:block}
.npi-pe-findings{width:100%;background:rgba(255,107,107,.06);border:1px solid rgba(255,107,107,.25);border-radius:5px;padding:5px 8px;color:var(--txt);font-size:11px;font-family:'DM Sans',sans-serif;outline:none;resize:none;min-height:55px;line-height:1.5}
.npi-pe-findings:focus{border-color:rgba(255,107,107,.5)}

/* SUMMARY */
.npi-sum-block{background:var(--bg-card);border:1.5px solid var(--border);border-radius:12px;padding:13px 15px;margin-bottom:10px}
.npi-sum-block-title{font-family:'Playfair Display',serif;font-size:14px;font-weight:600;color:var(--txt);margin-bottom:7px;display:flex;align-items:center;gap:7px}
.npi-sum-table{width:100%;border-collapse:collapse}
.npi-sum-table td{padding:4px 0;font-size:12px;border-bottom:1px solid rgba(26,53,85,.5);vertical-align:top}
.npi-sum-table td:first-child{color:var(--txt3);width:38%;padding-right:10px;font-size:11px}
.npi-sum-table td:last-child{color:var(--txt)}
.npi-sum-table tr:last-child td{border-bottom:none}
.npi-ros-item{display:inline-flex;align-items:center;gap:3px;padding:2px 6px;border-radius:3px;font-size:10px;font-weight:600;margin:2px}
.npi-ros-item.norm{background:#062020;color:var(--teal)}
.npi-ros-item.abn{background:#1a0808;color:var(--coral)}
.npi-sum-btns{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.npi-sum-generate-btn{height:34px;padding:0 16px;background:var(--teal);border:none;border-radius:8px;color:#050f1e;font-size:12px;font-weight:700;cursor:pointer;transition:all .2s;font-family:'DM Sans',sans-serif}
.npi-sum-generate-btn:hover{background:#00ffd0}
.npi-sum-studio-btn{height:34px;padding:0 16px;background:#0a2040;border:1px solid var(--blue);border-radius:8px;color:var(--blue);font-size:12px;font-weight:700;cursor:pointer;transition:all .2s;font-family:'DM Sans',sans-serif}
.npi-sum-studio-btn:hover{background:#0e2a55}

/* AI PANEL */
.npi-ai-panel{width:280px;flex-shrink:0;background:#060e1c;border-left:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden}
.npi-ai-header{padding:11px 13px 9px;border-bottom:1px solid var(--border);background:#040d1a;flex-shrink:0}
.npi-ai-hrow{display:flex;align-items:center;gap:7px;margin-bottom:7px}
.npi-ai-dot{width:7px;height:7px;border-radius:50%;background:var(--teal);animation:npi-pulse 2s infinite}
@keyframes npi-pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(0,229,192,.4)}50%{opacity:.8;box-shadow:0 0 0 4px rgba(0,229,192,0)}}
.npi-ai-title{font-size:12px;font-weight:600;color:var(--txt);flex:1}
.npi-ai-model{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--txt4);background:var(--bg-up);padding:2px 6px;border-radius:3px}
.npi-ai-qbtns{display:flex;flex-wrap:wrap;gap:4px}
.npi-ai-qbtn{padding:3px 8px;font-size:10px;background:var(--bg-up);border:1px solid var(--border);border-radius:5px;color:var(--txt3);cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif}
.npi-ai-qbtn:hover{border-color:var(--teal);color:var(--teal)}
.npi-ai-chat{flex:1;padding:11px 13px;overflow-y:auto}
.npi-ai-chat::-webkit-scrollbar{width:3px}
.npi-ai-chat::-webkit-scrollbar-thumb{background:var(--border)}
.npi-ai-msg{padding:8px 10px;border-radius:8px;margin-bottom:7px;font-size:11.5px;line-height:1.6}
.npi-ai-msg.sys{background:var(--bg-up);border:1px solid var(--border);color:var(--txt2)}
.npi-ai-msg.user{background:#0a2040;border:1px solid rgba(59,158,255,.2);color:var(--txt);text-align:right}
.npi-ai-msg.bot{background:#062020;border:1px solid rgba(0,229,192,.15);color:var(--txt2)}
.npi-ai-msg.loading{display:flex;gap:4px;align-items:center;background:var(--bg-up);border:1px solid var(--border);padding:11px}
.npi-ai-lbl{font-size:9px;text-transform:uppercase;letter-spacing:.6px;color:var(--teal);margin-bottom:3px;font-weight:600}
.npi-tdot{width:6px;height:6px;border-radius:50%;background:var(--teal);animation:npi-bounce 1.2s infinite}
.npi-tdot:nth-child(2){animation-delay:.2s}
.npi-tdot:nth-child(3){animation-delay:.4s}
@keyframes npi-bounce{0%,80%,100%{transform:scale(.6);opacity:.5}40%{transform:scale(1);opacity:1}}
.npi-ai-input-wrap{padding:9px 13px;border-top:1px solid var(--border);flex-shrink:0}
.npi-ai-row{display:flex;gap:6px}
.npi-ai-input{flex:1;height:33px;background:var(--bg-up);border:1px solid var(--border);border-radius:7px;padding:0 9px;color:var(--txt);font-size:12px;font-family:'DM Sans',sans-serif;outline:none;transition:border-color .2s}
.npi-ai-input:focus{border-color:var(--teal)}
.npi-ai-input::placeholder{color:var(--txt4)}
.npi-ai-send{width:33px;height:33px;background:#062020;border:1px solid rgba(0,229,192,.3);border-radius:7px;color:var(--teal);font-size:14px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s}
.npi-ai-send:hover{background:#0a3030}

/* BOTTOM NAV */
.npi-bnav{position:sticky;bottom:0;background:rgba(4,13,26,.96);backdrop-filter:blur(12px);border-top:1px solid var(--border);flex-shrink:0;z-index:50;padding:7px 16px 8px;display:flex;align-items:center;justify-content:center;gap:6px}
.npi-bnav-tabs{display:flex;align-items:center;gap:2px;background:#060f1e;border:1px solid var(--border);border-radius:12px;padding:3px;overflow-x:auto;max-width:100%}
.npi-bnav-tabs::-webkit-scrollbar{display:none}
.npi-btab{display:flex;align-items:center;gap:5px;padding:5px 11px;border-radius:9px;border:none;background:transparent;color:var(--txt3);font-size:11px;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .18s;white-space:nowrap;flex-shrink:0;font-weight:500}
.npi-btab:hover{background:var(--bg-up);color:var(--txt2)}
.npi-btab.active{background:linear-gradient(135deg,#0a2040,#0d2a52);color:var(--blue);font-weight:600;box-shadow:0 1px 6px rgba(59,158,255,.2)}
.npi-btab-icon{font-size:13px;line-height:1}
.npi-bnav-divider{width:1px;height:22px;background:var(--border);margin:0 3px;flex-shrink:0}
.npi-btab-er{color:var(--teal)!important}
.npi-btab-er:hover{background:rgba(0,229,192,.08)!important;color:var(--teal)!important}
.npi-btab-rx{color:var(--blue)!important}
.npi-btab-rx:hover{background:rgba(59,158,255,.08)!important}
.npi-bnav-nav{display:flex;align-items:center;gap:5px;margin-left:6px;flex-shrink:0}
.npi-bnav-back{height:28px;padding:0 12px;background:var(--bg-up);border:1px solid var(--border);border-radius:7px;color:var(--txt2);font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s}
.npi-bnav-back:hover{border-color:var(--border-hi);color:var(--txt)}
.npi-bnav-next{height:28px;padding:0 14px;background:var(--blue);border:none;border-radius:7px;color:#fff;font-size:11px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s}
.npi-bnav-next:hover{filter:brightness(1.15)}