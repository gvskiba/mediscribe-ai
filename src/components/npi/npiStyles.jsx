// ─── NPI DESIGN SYSTEM STYLES ────────────────────────────────────────────────
// Extracted from NewPatientInput.jsx to keep the page file under ceiling.
// Import and inject via: <style>{NPI_CSS}</style> in the page root.
export const NPI_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');

:root {
  --npi-bg:#050f1e;--npi-panel:#081628;--npi-card:#0b1e36;--npi-up:#0e2544;
  --npi-bd:#1a3555;--npi-bhi:#2a4f7a;--npi-blue:#3b9eff;--npi-teal:#00e5c0;
  --npi-gold:#f5c842;--npi-coral:#ff6b6b;--npi-orange:#ff9f43;--npi-purple:#9b6dff;
  --npi-txt:#ffffff;--npi-txt2:#d0e8ff;--npi-txt3:#a8c8e8;--npi-txt4:#7aa0c0;
  --npi-wf:190px;--npi-top:88px;
}

/* ── OrdersPanel classes ─────────────────────────────────────────────────── */
.ord-ai-pill{background:rgba(0,229,192,.1);color:var(--npi-teal);border:1px solid rgba(0,229,192,.25);border-radius:20px;padding:2px 10px;font-size:10px;font-weight:700;letter-spacing:.5px;font-family:'JetBrains Mono',monospace;white-space:nowrap;flex-shrink:0}
.ord-btn-teal{background:var(--npi-teal);color:var(--npi-bg);border:none;border-radius:7px;padding:5px 13px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;font-family:'DM Sans',sans-serif;transition:filter .15s;flex-shrink:0}
.ord-btn-teal:hover:not(:disabled){filter:brightness(1.12)}
.ord-btn-teal:disabled{opacity:.4;cursor:not-allowed}
.ord-btn-ghost{background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:7px;padding:6px 13px;font-size:12px;color:var(--npi-txt2);cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s}
.ord-btn-ghost:hover{border-color:var(--npi-bhi);color:var(--npi-txt)}
.ord-slbl{font-size:9px;font-weight:700;letter-spacing:1.5px;color:var(--npi-txt4);font-family:'JetBrains Mono',monospace;text-transform:uppercase;margin-bottom:6px}
.ord-row{display:flex;align-items:center;gap:9px;padding:7px 8px;border-radius:7px;cursor:pointer;transition:background .12s}
.ord-row:hover{background:rgba(255,255,255,.04)}
.ord-chk{width:16px;height:16px;border-radius:4px;border:1.5px solid rgba(255,255,255,.18);flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .15s}
.ord-chk.on{background:var(--npi-teal);border-color:var(--npi-teal)}
.ord-chip{padding:4px 10px;border-radius:20px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);font-size:11px;color:rgba(255,255,255,.55);cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s}
.ord-chip:hover{background:rgba(0,229,192,.1);border-color:rgba(0,229,192,.28);color:var(--npi-teal)}

/* ── Top bar & layout ────────────────────────────────────────────────────── */
.npi-tb-settings{font-size:16px;color:var(--npi-txt4);text-decoration:none;padding:4px 6px;border-radius:6px;transition:all .15s;display:flex;align-items:center;justify-content:center}
.npi-tb-settings:hover{color:var(--npi-txt2);background:var(--npi-up)}
.npi-top-bar{position:fixed;top:0;left:var(--npi-wf);right:0;height:var(--npi-top);background:var(--npi-panel);border-bottom:1px solid var(--npi-bd);z-index:200;display:flex;flex-direction:column}
.npi-top-row-1{height:44px;flex-shrink:0;display:flex;align-items:center;padding:0 14px;gap:8px;border-bottom:1px solid rgba(26,53,85,.5)}
.npi-dr-label{font-size:12px;font-weight:500;color:var(--npi-txt2);white-space:nowrap;flex-shrink:0}
.npi-dr-role{font-size:10px;font-weight:400;color:var(--npi-txt4);margin-left:3px}
.npi-tb-link{background:none;border:1px solid var(--npi-bd);border-radius:6px;padding:3px 9px;font-size:11px;color:var(--npi-txt3);cursor:pointer;white-space:nowrap;transition:all .15s;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:4px}
.npi-tb-link:hover{border-color:var(--npi-bhi);color:var(--npi-txt2);background:var(--npi-up)}
.npi-ai-btn{display:flex;align-items:center;gap:5px;background:rgba(0,229,192,.08);border:1px solid rgba(0,229,192,.3);border-radius:6px;padding:3px 10px;font-size:11px;font-weight:600;color:var(--npi-teal);cursor:pointer;position:relative;transition:all .15s;font-family:'DM Sans',sans-serif}
.npi-ai-btn:hover{background:rgba(0,229,192,.15)}
.npi-ai-btn.open{background:rgba(255,107,107,.1);border-color:rgba(255,107,107,.4);color:var(--npi-coral)}
.npi-ai-dot{width:6px;height:6px;border-radius:50%;background:var(--npi-teal);animation:npi-ai-pulse 2s ease-in-out infinite;flex-shrink:0}
.npi-ai-btn.open .npi-ai-dot{background:var(--npi-coral);animation:none}
.npi-ai-badge{position:absolute;top:-5px;right:-5px;min-width:16px;height:16px;border-radius:8px;background:var(--npi-coral);color:#fff;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;border:1.5px solid var(--npi-panel);padding:0 3px}
.npi-vsep{width:1px;height:20px;background:var(--npi-bd);flex-shrink:0}
.npi-stat{display:flex;align-items:center;gap:5px;background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:6px;padding:3px 10px;cursor:pointer}
.npi-stat-val{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;color:var(--npi-txt)}
.npi-stat-val.alert{color:var(--npi-gold)}
.npi-stat-lbl{font-size:9px;color:var(--npi-txt3);text-transform:uppercase;letter-spacing:.04em}
.npi-top-right{margin-left:auto;display:flex;align-items:center;gap:6px}
@keyframes npi-ai-pulse{0%,100%{box-shadow:0 0 0 0 rgba(0,229,192,.4)}50%{box-shadow:0 0 0 5px rgba(0,229,192,0)}}
.npi-new-pt{background:var(--npi-teal);color:var(--npi-bg);border:none;border-radius:6px;padding:4px 12px;font-size:11px;font-weight:700;cursor:pointer;transition:filter .15s;white-space:nowrap}
.npi-new-pt:hover{filter:brightness(1.15)}
.npi-top-row-2{height:44px;flex-shrink:0;display:flex;align-items:center;padding:0 14px;gap:8px;overflow:hidden}
.npi-chart-badge{font-family:'JetBrains Mono',monospace;font-size:10px;background:rgba(255,159,67,.08);border:1px solid rgba(255,159,67,.3);border-radius:20px;padding:1px 8px;color:var(--npi-orange);white-space:nowrap;flex-shrink:0}
.npi-chart-badge.registered{background:rgba(59,158,255,.08);border-color:rgba(59,158,255,.3);color:var(--npi-blue)}
.npi-pt-name{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:var(--npi-txt);white-space:nowrap;flex-shrink:0;letter-spacing:-.01em}
.npi-pt-dob{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--npi-txt4);background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:4px;padding:2px 7px;white-space:nowrap;flex-shrink:0;letter-spacing:.02em}
.npi-resume-chip{display:flex;align-items:center;gap:6px;padding:3px 10px 3px 8px;background:rgba(186,117,23,.1);border:1px solid rgba(186,117,23,.3);border-radius:20px;font-size:11px;font-weight:500;color:#ef9f27;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif;white-space:nowrap;flex-shrink:0;animation:npi-resume-in .2s ease}
.npi-resume-chip:hover{background:rgba(186,117,23,.18);border-color:rgba(186,117,23,.5)}
.npi-resume-dismiss{font-size:9px;color:rgba(239,159,39,.6);transition:color .12s;line-height:1;padding:0 2px}
.npi-resume-dismiss:hover{color:#ef9f27}
@keyframes npi-resume-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
.npi-door-time{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--npi-txt4);white-space:nowrap;flex-shrink:0;letter-spacing:.02em}
.npi-allergy-wrap{display:flex;align-items:center;cursor:pointer;flex-shrink:0;transition:opacity .15s}
.npi-allergy-wrap:hover{opacity:.85}
.npi-allergy-nka{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:500;color:var(--npi-teal);background:rgba(0,229,192,.06);border:1px solid rgba(0,229,192,.2);border-radius:6px;padding:2px 8px;white-space:nowrap}
.npi-allergy-alert{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;color:#fff;background:var(--npi-coral);border:1px solid rgba(255,107,107,.5);border-radius:6px;padding:3px 10px;white-space:nowrap;animation:npi-allergy-pulse 3s ease-in-out infinite}
@keyframes npi-allergy-pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,107,107,.3)}50%{box-shadow:0 0 0 4px rgba(255,107,107,0)}}
.npi-top-acts{margin-left:auto;display:flex;align-items:center;gap:5px;flex-shrink:0}
.npi-btn-ghost{background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:6px;padding:4px 10px;font-size:11px;color:var(--npi-txt2);cursor:pointer;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;transition:all .15s;font-family:'DM Sans',sans-serif}
.npi-btn-ghost:hover{border-color:var(--npi-bhi);color:var(--npi-txt)}
.npi-btn-primary{background:var(--npi-teal);color:var(--npi-bg);border:none;border-radius:6px;padding:4px 12px;font-size:11px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;transition:filter .15s;font-family:'DM Sans',sans-serif}
.npi-btn-primary:hover{filter:brightness(1.15)}
.npi-btn-coral{background:rgba(255,107,107,.15);color:var(--npi-coral);border:1px solid rgba(255,107,107,.3);border-radius:6px;padding:4px 12px;font-size:11px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;transition:all .15s;font-family:'DM Sans',sans-serif}
.npi-btn-coral:hover{background:rgba(255,107,107,.25)}
.npi-main-wrap{position:fixed;top:var(--npi-top);left:var(--npi-wf);right:0;bottom:0;display:flex;background:var(--npi-bg)}
.npi-content{flex:1;overflow-y:auto;padding:18px 28px 24px;display:flex;flex-direction:column;gap:18px;min-height:0}

/* ── Workflow rail ───────────────────────────────────────────────────────── */
.npi-wf-rail{position:fixed;top:0;left:0;bottom:0;width:var(--npi-wf);background:var(--npi-panel);border-right:1px solid var(--npi-bd);z-index:250;display:flex;flex-direction:column;overflow-y:auto;overflow-x:hidden}
.npi-wf-rail::-webkit-scrollbar{width:3px}
.npi-wf-rail::-webkit-scrollbar-thumb{background:var(--npi-bd);border-radius:2px}
.npi-wf-pt{flex-shrink:0;padding:10px 12px 8px;display:flex;flex-direction:column;gap:3px;border-bottom:1px solid var(--npi-bd);background:rgba(8,22,40,.8)}
.npi-wf-pt-name{font-family:'Playfair Display',serif;font-size:13px;font-weight:600;color:var(--npi-txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.npi-wf-pt-meta{display:flex;flex-direction:column;gap:2px}
.npi-wf-pt-meta span{font-size:10px;color:var(--npi-txt4);font-family:'DM Sans',sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.npi-wf-pt-cc{color:var(--npi-teal) !important;font-size:10px !important}
.npi-wf-esi{display:inline-block;font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;padding:1px 7px;border-radius:4px;border:1px solid;align-self:flex-start}
.npi-wf-vitals{margin-top:6px;padding-top:6px;border-top:1px solid rgba(26,53,85,.5);display:flex;flex-direction:column;gap:3px}
.npi-wf-v-row{display:flex;align-items:center;justify-content:space-between;gap:4px}
.npi-wf-v-lbl{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--npi-txt4);flex-shrink:0;min-width:32px}
.npi-wf-v-val{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;color:var(--npi-txt2)}
.npi-wf-v-val.warn{color:var(--npi-orange)}
.npi-wf-v-val.abn{color:var(--npi-coral);animation:npi-glow-red 2s ease-in-out infinite}
@keyframes npi-glow-red{0%,100%{text-shadow:0 0 4px rgba(255,107,107,.3)}50%{text-shadow:0 0 8px rgba(255,107,107,.8)}}
.npi-wf-group{border-bottom:1px solid rgba(26,53,85,.5);flex-shrink:0}
.npi-wf-gh{width:100%;display:flex;align-items:center;gap:8px;padding:9px 12px;background:none;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;transition:background .15s;position:relative;text-align:left}
.npi-wf-gh:hover{background:rgba(255,255,255,.03)}
.npi-wf-gh.active{background:rgba(59,158,255,.05)}
.npi-wf-gh.active::before{content:'';position:absolute;left:0;top:7px;bottom:7px;width:3px;background:var(--npi-blue);border-radius:0 2px 2px 0}
.npi-wf-gh.note-grp.active{background:rgba(0,229,192,.05)}
.npi-wf-gh.note-grp.active::before{background:var(--npi-teal)}
.npi-wf-gh-icon{font-size:14px;flex-shrink:0;line-height:1}
.npi-wf-gh-label{font-size:10px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--npi-txt4);flex:1;transition:color .15s}
.npi-wf-gh:hover .npi-wf-gh-label{color:var(--npi-txt3)}
.npi-wf-gh.active .npi-wf-gh-label{color:var(--npi-blue)}
.npi-wf-gh.note-grp.active .npi-wf-gh-label{color:var(--npi-teal)}
.npi-wf-gh-badge{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.npi-wf-gh-badge.done{background:var(--npi-teal);box-shadow:0 0 4px rgba(0,229,192,.4)}
.npi-wf-gh-badge.partial{background:var(--npi-orange)}
.npi-wf-gh-badge.empty{background:transparent;border:1.5px solid rgba(26,53,85,.8)}
.npi-wf-items{padding:2px 0 6px}
.npi-wf-item{width:100%;display:flex;align-items:center;gap:7px;padding:6px 12px 6px 22px;background:none;border:none;cursor:pointer;transition:all .12s;font-family:'DM Sans',sans-serif;text-align:left;position:relative}
.npi-wf-item:hover{background:rgba(255,255,255,.025)}
.npi-wf-item.active{background:rgba(59,158,255,.08)}
.npi-wf-item.active::before{content:'';position:absolute;left:10px;top:50%;transform:translateY(-50%);width:2px;height:12px;background:var(--npi-blue);border-radius:1px}
.npi-wf-item-icon{font-size:12px;flex-shrink:0;opacity:.65;line-height:1}
.npi-wf-item-label{font-size:11px;color:var(--npi-txt3);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;transition:color .12s;line-height:1.2}
.npi-wf-item.active .npi-wf-item-label,.npi-wf-item:hover .npi-wf-item-label{color:var(--npi-txt2)}
.npi-wf-item.active .npi-wf-item-label{font-weight:500;color:var(--npi-txt)}
.npi-wf-item-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.npi-wf-item-dot.done{background:var(--npi-teal);box-shadow:0 0 3px rgba(0,229,192,.4)}
.npi-wf-item-dot.partial{background:var(--npi-orange)}
.npi-wf-item-dot.empty{background:transparent;border:1px solid rgba(122,160,192,.4)}
.npi-wf-item-sc{font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--npi-txt4);background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:3px;padding:0 4px;opacity:0;transition:opacity .12s;flex-shrink:0}
.npi-wf-item:hover .npi-wf-item-sc{opacity:1}
.npi-wf-sys-item{width:100%;display:flex;align-items:center;gap:6px;padding:5px 12px 5px 28px;background:none;border:none;cursor:pointer;transition:all .12s;font-family:'DM Sans',sans-serif;text-align:left;position:relative}
.npi-wf-sys-item:hover{background:rgba(255,255,255,.02)}
.npi-wf-sys-item.active{background:rgba(0,229,192,.06)}
.npi-wf-sys-item.active::before{content:'';position:absolute;left:16px;top:50%;transform:translateY(-50%);width:2px;height:10px;background:var(--npi-teal);border-radius:1px}
.npi-wf-sys-icon{font-size:11px;flex-shrink:0;line-height:1;opacity:.6}
.npi-wf-sys-label{font-size:10px;color:var(--npi-txt3);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;transition:color .12s}
.npi-wf-sys-item:hover .npi-wf-sys-label{color:var(--npi-txt2)}
.npi-wf-sys-item.active .npi-wf-sys-label{color:var(--npi-teal);font-weight:500}
.npi-wf-chip{display:flex;align-items:center;gap:7px;padding:6px 12px 6px 14px;font-size:11px;font-family:'DM Sans',sans-serif;margin:2px 6px;border-radius:7px;transition:all .12s;border:1px solid transparent}
.npi-wf-chip.active{color:var(--npi-teal);background:rgba(0,229,192,.08);border-color:rgba(0,229,192,.2);font-weight:600}
.npi-wf-chip.done{color:var(--npi-teal);background:rgba(0,229,192,.04);border-color:rgba(0,229,192,.12)}
.npi-wf-chip.todo{color:var(--npi-txt4)}
.npi-wf-chip.todo:hover{color:var(--npi-txt2);background:var(--npi-up);border-color:var(--npi-bd)}
.npi-wf-chip-icon{font-size:12px;flex-shrink:0;line-height:1}
.npi-wf-note-kbd{padding:6px 14px 8px;display:flex;flex-direction:column;gap:5px}
.npi-wf-note-kbd span{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--npi-txt4);display:flex;align-items:center;gap:5px}
.npi-wf-note-kbd kbd{background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:3px;padding:0 5px;color:var(--npi-blue);font-family:'JetBrains Mono',monospace;font-size:9px}

/* ── AI overlay ──────────────────────────────────────────────────────────── */
.npi-scrim{position:fixed;inset:0;z-index:9997;background:rgba(3,8,16,.4);backdrop-filter:blur(2px);opacity:0;pointer-events:none;transition:opacity .3s}
.npi-scrim.open{opacity:1;pointer-events:auto}
.npi-overlay{position:fixed;bottom:24px;right:24px;z-index:9998;width:330px;height:500px;background:#081628;border:1px solid var(--npi-bd);border-radius:18px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.55);opacity:0;transform:translateY(20px) scale(.94);pointer-events:none;transition:all .35s cubic-bezier(.34,1.56,.64,1)}
.npi-overlay.open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}
.npi-n-hdr{padding:14px 14px 10px;flex-shrink:0;border-bottom:1px solid var(--npi-bd);background:linear-gradient(180deg,rgba(0,229,192,.05) 0%,transparent 100%)}
.npi-n-hdr-top{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.npi-n-avatar{width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,var(--npi-teal),var(--npi-blue));display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
.npi-n-hdr-info{flex:1}
.npi-n-hdr-name{font-family:'Playfair Display',serif;font-size:14px;font-weight:600;color:var(--npi-txt)}
.npi-n-hdr-sub{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--npi-txt3);margin-top:2px;display:flex;align-items:center;gap:4px}
.npi-n-hdr-sub .dot{width:5px;height:5px;border-radius:50%;background:var(--npi-teal)}
.npi-n-close{width:28px;height:28px;border-radius:7px;border:1px solid var(--npi-bd);background:var(--npi-up);color:var(--npi-txt3);font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0}
.npi-n-close:hover{border-color:var(--npi-bhi);color:var(--npi-txt2)}
.npi-n-quick{display:flex;flex-wrap:wrap;gap:4px}
.npi-n-qbtn{padding:4px 10px;border-radius:20px;font-size:11px;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .2s;background:var(--npi-up);border:1px solid var(--npi-bd);color:var(--npi-txt2);display:flex;align-items:center;gap:4px}
.npi-n-qbtn:hover{border-color:rgba(0,229,192,.4);color:var(--npi-teal);background:rgba(0,229,192,.06)}
.npi-n-qbtn:disabled{opacity:.4;cursor:not-allowed}
.npi-n-msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:7px}
.npi-n-msgs::-webkit-scrollbar{width:4px}
.npi-n-msgs::-webkit-scrollbar-thumb{background:var(--npi-bd);border-radius:2px}
.npi-n-msg{padding:9px 12px;border-radius:11px;font-size:12px;line-height:1.6;max-width:88%;font-family:'DM Sans',sans-serif}
.npi-n-msg.sys{background:rgba(14,37,68,.6);color:var(--npi-txt3);border:1px solid rgba(26,53,85,.5);align-self:center;max-width:100%;text-align:center;font-size:11px;font-style:italic;border-radius:7px}
.npi-n-msg.user{background:rgba(59,158,255,.12);border:1px solid rgba(59,158,255,.22);color:var(--npi-txt);align-self:flex-end;border-radius:12px 12px 3px 12px}
.npi-n-msg.bot{background:rgba(0,229,192,.06);border:1px solid rgba(0,229,192,.15);color:var(--npi-txt);align-self:flex-start;border-radius:12px 12px 12px 3px}
.npi-n-dots{display:flex;gap:5px;padding:10px 12px;align-self:flex-start;align-items:center}
.npi-n-dots span{width:6px;height:6px;border-radius:50%;background:var(--npi-teal);animation:npi-bounce 1.2s ease-in-out infinite}
.npi-n-dots span:nth-child(2){animation-delay:.15s}
.npi-n-dots span:nth-child(3){animation-delay:.3s}
@keyframes npi-bounce{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-6px);opacity:1}}
.npi-n-input-bar{padding:9px 12px 14px;flex-shrink:0;border-top:1px solid var(--npi-bd);display:flex;gap:7px;align-items:flex-end}
.npi-n-ta{flex:1;background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:10px;padding:8px 11px;color:var(--npi-txt);font-family:'DM Sans',sans-serif;font-size:12px;outline:none;resize:none;min-height:36px;max-height:90px;line-height:1.5;transition:border-color .2s}
.npi-n-ta:focus{border-color:var(--npi-teal)}
.npi-n-ta::placeholder{color:var(--npi-txt4)}
.npi-n-ta:disabled{opacity:.5}
.npi-n-send{width:36px;height:36px;flex-shrink:0;background:linear-gradient(135deg,var(--npi-teal),#00b4d8);border:none;border-radius:10px;color:var(--npi-bg);font-size:17px;font-weight:700;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center}
.npi-n-send:hover{transform:scale(1.08)}
.npi-n-send:disabled{opacity:.4;cursor:not-allowed;transform:none}
.npi-sc-hint-fab{position:fixed;bottom:76px;left:10px;z-index:9990;width:26px;height:26px;border-radius:50%;background:var(--npi-up);border:1px solid var(--npi-bd);color:var(--npi-txt4);font-size:12px;font-family:'JetBrains Mono',monospace;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s}
.npi-sc-hint-fab:hover{border-color:var(--npi-bhi);color:var(--npi-txt2);background:var(--npi-card)}

/* ── InlineHPITab ────────────────────────────────────────────────────────── */
.hpi-idle,.hpi-scan,.hpi-narrative{display:flex;flex-direction:column;gap:16px;max-width:780px;font-family:'DM Sans',sans-serif}
.hpi-cc-row{display:flex;align-items:baseline;gap:12px;padding:14px 16px;background:rgba(0,229,192,.05);border:1px solid rgba(0,229,192,.2);border-radius:10px}
.hpi-field-lbl{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--npi-txt4);text-transform:uppercase;letter-spacing:.1em;flex-shrink:0}
.hpi-cc-val{font-family:'Playfair Display',serif;font-size:16px;font-weight:600;color:var(--npi-txt)}
.hpi-muted{color:var(--npi-txt4);font-family:'DM Sans',sans-serif;font-size:13px;font-style:italic}
.hpi-gen-btn{display:flex;align-items:center;gap:8px;padding:12px 22px;background:linear-gradient(135deg,rgba(0,229,192,.15),rgba(59,158,255,.1));border:1px solid rgba(0,229,192,.35);border-radius:10px;color:var(--npi-teal);font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;align-self:flex-start}
.hpi-gen-btn:hover{background:linear-gradient(135deg,rgba(0,229,192,.25),rgba(59,158,255,.18));transform:translateY(-1px)}
.hpi-gen-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
.hpi-ta{width:100%;padding:12px 14px;background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:8px;color:var(--npi-txt);font-family:'DM Sans',sans-serif;font-size:13px;line-height:1.65;resize:vertical;outline:none;transition:border-color .2s;box-sizing:border-box}
.hpi-ta:focus{border-color:var(--npi-blue)}
.hpi-kbd-legend{display:flex;flex-wrap:wrap;gap:8px;padding:10px 14px;background:rgba(14,37,68,.5);border:1px solid var(--npi-bd);border-radius:8px}
.hpi-kbd-item{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--npi-txt4)}
.hpi-kbd-item kbd{font-family:'JetBrains Mono',monospace;font-size:10px;background:var(--npi-up);border:1px solid var(--npi-bhi);border-radius:4px;padding:1px 6px;color:var(--npi-blue)}
.hpi-scan-hdr{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:12px 16px;background:rgba(14,37,68,.6);border:1px solid var(--npi-bd);border-radius:10px;flex-shrink:0}
.hpi-scan-hdr-left{display:flex;align-items:center;gap:10px;flex:1}
.hpi-prog{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--npi-teal);background:rgba(0,229,192,.1);border:1px solid rgba(0,229,192,.25);border-radius:20px;padding:1px 9px}
.hpi-scan-bar-wrap{width:100%;height:3px;background:var(--npi-bd);border-radius:2px;overflow:hidden}
.hpi-scan-bar{height:100%;background:linear-gradient(90deg,var(--npi-teal),var(--npi-blue));border-radius:2px;transition:width .3s}
.hpi-hint-strip{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--npi-txt4)}
.hpi-hint-strip kbd{background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:3px;padding:0 4px;color:var(--npi-blue)}
.hpi-sym-list{display:flex;flex-direction:column;gap:3px;flex:1;overflow-y:auto;max-height:50vh}
.hpi-sym-row{display:flex;align-items:flex-start;gap:12px;padding:10px 14px;border-radius:8px;cursor:pointer;transition:all .15s;border:1px solid transparent}
.hpi-sym-row:hover{background:rgba(255,255,255,.03)}
.hpi-sym-row.active{background:rgba(59,158,255,.08);border-color:rgba(59,158,255,.25)}
.hpi-sym-row.answered{opacity:.75}
.hpi-sym-idx{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--npi-txt4);width:22px;flex-shrink:0;padding-top:2px}
.hpi-sym-body{flex:1;display:flex;flex-direction:column;gap:6px}
.hpi-sym-label{font-size:13px;font-weight:500;color:var(--npi-txt);display:flex;align-items:center;gap:7px}
.hpi-type-badge{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--npi-txt4);background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:3px;padding:1px 5px}
.hpi-sym-hint{font-size:11px;color:var(--npi-txt4);font-style:italic}
.hpi-sym-opts{display:flex;flex-wrap:wrap;gap:5px}
.hpi-opt-chip{display:flex;align-items:center;gap:4px;padding:3px 10px;background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:6px;font-size:11px;color:var(--npi-txt2);cursor:pointer;transition:all .15s}
.hpi-opt-scale{padding:3px 7px;min-width:32px;justify-content:center}
.hpi-opt-key{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;color:var(--npi-blue);background:rgba(59,158,255,.12);border-radius:3px;padding:0 4px;margin-right:2px}
.hpi-sym-ans{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;flex-shrink:0;min-width:70px;text-align:right;padding-top:2px}
.hpi-sym-dot{width:8px;height:8px;border-radius:50%;border:1.5px solid var(--npi-bd);flex-shrink:0;margin-top:4px;transition:all .2s}
.hpi-sym-dot.done{background:var(--npi-teal);border-color:var(--npi-teal);box-shadow:0 0 5px rgba(0,229,192,.4)}
.hpi-sym-dot.skip{background:var(--npi-txt4);border-color:var(--npi-txt4)}
.hpi-scan-footer{display:flex;gap:10px;align-items:center;padding-top:4px}
.hpi-done-btn{padding:9px 20px;background:var(--npi-teal);color:var(--npi-bg);border:none;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:filter .15s}
.hpi-done-btn:hover{filter:brightness(1.1)}
.hpi-ghost-btn{padding:8px 14px;background:var(--npi-up);border:1px solid var(--npi-bd);border-radius:8px;color:var(--npi-txt3);font-family:'DM Sans',sans-serif;font-size:12px;cursor:pointer;transition:all .15s}
.hpi-ghost-btn:hover{border-color:var(--npi-bhi);color:var(--npi-txt2)}
.hpi-narr-hdr{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:4px}
.hpi-badge-row{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
.hpi-badge{display:flex;align-items:center;gap:7px;padding:4px 11px;border-radius:20px;border:1px solid;font-size:11px}
.hpi-badge-label{font-family:'JetBrains Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.07em;opacity:.7}
.hpi-badge-val{font-weight:600;font-size:11px}

/* ── CDS badge button ────────────────────────────────────────────── */
.npi-cds-btn{display:flex;align-items:center;gap:5px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:6px;padding:3px 10px;font-size:11px;font-weight:600;color:var(--npi-txt3);cursor:pointer;position:relative;transition:all .15s;font-family:'DM Sans',sans-serif}
.npi-cds-btn:hover{background:rgba(255,255,255,.1);color:var(--npi-txt2)}
.npi-cds-btn.open{background:rgba(245,200,66,.1);border-color:rgba(245,200,66,.35);color:var(--npi-gold)}
.npi-cds-btn.cds-warn{border-color:rgba(255,159,67,.35);color:var(--npi-orange)}
.npi-cds-btn.cds-alert{border-color:rgba(255,107,107,.4);color:var(--npi-coral)}
.npi-cds-btn.cds-alert.open{background:rgba(255,107,107,.1);border-color:rgba(255,107,107,.45);color:var(--npi-coral)}
.npi-cds-dot{width:6px;height:6px;border-radius:50%;background:currentColor;flex-shrink:0;opacity:.7}
.npi-cds-btn.cds-alert .npi-cds-dot{animation:npi-ai-pulse 2s ease-in-out infinite}
/* ── CDS overlay ─────────────────────────────────────────────────── */
.npi-cds-scrim{position:fixed;inset:0;z-index:498;background:rgba(3,8,16,.25)}
.npi-cds-overlay{position:fixed;top:var(--npi-top);right:0;bottom:0;z-index:499;width:300px;background:var(--npi-panel);border-left:1px solid var(--npi-bd);display:flex;flex-direction:column;overflow:hidden;transform:translateX(100%);transition:transform .28s cubic-bezier(.4,0,.2,1);pointer-events:none}
.npi-cds-overlay.open{transform:translateX(0);pointer-events:auto}
.npi-cds-overlay-hdr{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--npi-bd);flex-shrink:0}
.npi-cds-overlay-title{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--npi-txt4)}
.npi-cds-close{width:24px;height:24px;border-radius:5px;border:1px solid var(--npi-bd);background:var(--npi-up);color:var(--npi-txt4);font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}
.npi-cds-close:hover{border-color:var(--npi-bhi);color:var(--npi-txt2)}
`;