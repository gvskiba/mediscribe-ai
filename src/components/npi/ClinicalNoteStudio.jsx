import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

// ─── STYLES ───────────────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("cns2-css")) return;
  const s = document.createElement("style");
  s.id = "cns2-css";
  s.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;600;700&display=swap');

.cns2 {
  --bg:#050f1e; --panel:#081628; --card:#0b1e36; --up:#0e2544;
  --bd:#1a3555; --bhi:#2a4f7a;
  --teal:#00e5c0; --gold:#f5c842; --coral:#ff6b6b; --blue:#3b9eff;
  --orange:#ff9f43; --purple:#9b6dff; --green:#3dffa0; --red:#ff4444;
  --t:#f2f7ff; --t2:#b8d4f0; --t3:#82aece; --t4:#5a82a8;
  --apso-a:#ff6b6b; --apso-p:#00e5c0; --apso-s:#3b9eff; --apso-o:#f5c842;
}
.cns2 * { box-sizing:border-box; }
.cns2 ::-webkit-scrollbar { width:3px; height:3px; }
.cns2 ::-webkit-scrollbar-thumb { background:var(--bhi); border-radius:2px; }

.cns2 { position:fixed; inset:0; display:flex; flex-direction:column;
  background:var(--bg); font-family:'DM Sans',sans-serif; color:var(--t); }
.cns2.emb { position:relative; inset:auto; height:100%; }

.cns2-top { height:54px; flex-shrink:0; background:var(--panel); border-bottom:1px solid var(--bd);
  display:flex; align-items:center; padding:0 16px; gap:10px; z-index:20;
  overflow-x:auto; overflow-y:hidden; }
.cns2-top::-webkit-scrollbar { height:2px; }
.cns2-emb-top { height:44px; flex-shrink:0; background:rgba(8,22,40,.95);
  border-bottom:1px solid var(--bd); border-top:2px solid rgba(0,229,192,.2);
  display:flex; align-items:center; padding:0 14px; gap:8px; z-index:20; }

.cns2-badge { font-family:'JetBrains Mono',monospace; font-size:9px; letter-spacing:2px;
  background:rgba(0,229,192,.08); border:1px solid rgba(0,229,192,.3);
  color:var(--teal); border-radius:20px; padding:2px 10px; white-space:nowrap; flex-shrink:0; }
.cns2-ptname { font-family:'Playfair Display',serif; font-size:16px; font-weight:700;
  color:var(--t); white-space:nowrap; flex-shrink:0; }
.cns2-meta { font-size:11px; color:var(--t3); white-space:nowrap; flex-shrink:0; }
.cns2-cc   { font-size:11px; color:var(--orange); font-weight:600; white-space:nowrap;
  font-family:'JetBrains Mono',monospace; flex-shrink:0; }
.cns2-esi  { font-size:10px; font-family:'JetBrains Mono',monospace; font-weight:700;
  padding:2px 9px; border-radius:4px; flex-shrink:0;
  background:rgba(255,107,107,.1); color:var(--coral); border:1px solid rgba(255,107,107,.3); }
.cns2-timer { font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:700;
  padding:3px 10px; border-radius:6px; flex-shrink:0; letter-spacing:1px;
  background:rgba(245,200,66,.08); color:var(--gold); border:1px solid rgba(245,200,66,.25); }
.cns2-timer.over { background:rgba(255,107,107,.1); color:var(--coral); border-color:rgba(255,107,107,.3); }
.cns2-acts { margin-left:auto; display:flex; gap:5px; align-items:center; flex-shrink:0; }

.cns2-prog-bar      { width:72px; height:5px; background:var(--up); border-radius:3px; flex-shrink:0; }
.cns2-prog-bar-fill { height:100%; background:linear-gradient(90deg,var(--teal),var(--blue));
  border-radius:3px; transition:width .4s ease; }
.cns2-prog-count    { font-family:'JetBrains Mono',monospace; font-size:9px; color:var(--t4); white-space:nowrap; }
.cns2-emb-prog-bar  { flex:1; height:4px; background:var(--up); border-radius:2px; }
.cns2-emb-prog-fill { height:100%; background:linear-gradient(90deg,var(--teal),var(--blue));
  border-radius:2px; transition:width .4s ease; }

/* APSO completion chips */
.cns2-apso-ind  { display:flex; gap:3px; align-items:center; flex-shrink:0; }
.cns2-apso-chip { font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:900;
  width:24px; height:24px; border-radius:5px; display:flex; align-items:center; justify-content:center;
  border:1px solid var(--bd); background:var(--up); color:var(--t4); transition:all .35s; }
.cns2-apso-chip.partial { background:rgba(59,158,255,.06); color:var(--t3); border-color:rgba(59,158,255,.2); }
.cns2-apso-chip.done    { border-color:currentColor; }

.cns2 .btn { padding:5px 12px; border-radius:7px; font-size:11px; font-weight:600; cursor:pointer;
  display:inline-flex; align-items:center; gap:5px; font-family:'DM Sans',sans-serif;
  transition:all .15s; white-space:nowrap; border:none; }
.cns2 .btn:disabled { opacity:.4; cursor:not-allowed; }
.cns2 .btn-ghost { background:var(--up); border:1px solid var(--bd) !important; color:var(--t2); }
.cns2 .btn-ghost:hover { border-color:var(--bhi) !important; color:var(--t); }
.cns2 .btn-teal  { background:var(--teal); color:var(--bg); }
.cns2 .btn-teal:hover { filter:brightness(1.1); }
.cns2 .btn-gold  { background:rgba(245,200,66,.1); color:var(--gold); border:1px solid rgba(245,200,66,.3) !important; }
.cns2 .btn-gold:hover { background:rgba(245,200,66,.2); }
.cns2 .ibtn { width:26px; height:26px; border-radius:6px; border:1px solid var(--bd);
  background:var(--up); color:var(--t3); font-size:12px; cursor:pointer;
  display:flex; align-items:center; justify-content:center; transition:all .15s; flex-shrink:0; }
.cns2 .ibtn:hover { border-color:var(--bhi); color:var(--t2); }
.cns2 .ibtn:disabled { opacity:.35; cursor:not-allowed; }
.cns2 .ibtn.spin { animation:cns2-spin .8s linear infinite; }
@keyframes cns2-spin { to { transform:rotate(360deg); } }

.cns2-body { flex:1; display:flex; min-height:0; }

/* Sidebar */
.cns2-sb { width:214px; flex-shrink:0; background:var(--panel);
  border-right:1px solid var(--bd); display:flex; flex-direction:column; }
.cns2-sb-head { padding:14px 14px 10px; flex-shrink:0; border-bottom:1px solid rgba(26,53,85,.5); }
.cns2-sb-label { font-family:'JetBrains Mono',monospace; font-size:8px; color:var(--t4);
  letter-spacing:2px; text-transform:uppercase; margin-bottom:8px; }
.cns2-sb-bar  { height:3px; background:var(--up); border-radius:2px; overflow:hidden; margin-bottom:5px; }
.cns2-sb-fill { height:100%; background:linear-gradient(90deg,var(--teal),var(--blue));
  border-radius:2px; transition:width .5s; }
.cns2-sb-sub  { font-family:'JetBrains Mono',monospace; font-size:9px; color:var(--t3); }
.cns2-sb-list { padding:6px; flex:1; display:flex; flex-direction:column; gap:1px; overflow-y:auto; }

.cns2-sb-grp { display:flex; align-items:center; gap:5px; padding:7px 8px 3px; margin-top:4px; }
.cns2-sb-grp-pill { font-family:'JetBrains Mono',monospace; font-size:8px; font-weight:900;
  padding:1px 7px; border-radius:4px; letter-spacing:1px; flex-shrink:0; }
.cns2-sb-grp-lbl  { font-family:'JetBrains Mono',monospace; font-size:8px;
  letter-spacing:1.5px; text-transform:uppercase; opacity:.8; }
.cns2-sb-grp-line { flex:1; height:1px; background:currentColor; opacity:.15; }

.cns2-sb-item { display:flex; align-items:center; gap:7px; padding:6px 8px; border-radius:8px;
  cursor:pointer; transition:all .15s; border:1px solid transparent; }
.cns2-sb-item:hover { background:rgba(59,158,255,.06); border-color:rgba(59,158,255,.2); }
.cns2-sb-item.on { background:rgba(59,158,255,.1); border-color:rgba(59,158,255,.35); }
.cns2-sb-ico  { font-size:13px; flex-shrink:0; }
.cns2-sb-txt  { flex:1; min-width:0; }
.cns2-sb-name { font-size:11px; font-weight:500; color:var(--t2);
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.cns2-sb-item.on .cns2-sb-name { color:var(--t); font-weight:600; }
.cns2-sb-key  { font-family:'JetBrains Mono',monospace; font-size:8px; color:var(--t4);
  background:var(--up); border:1px solid var(--bd); border-radius:3px; padding:1px 4px; flex-shrink:0; }
.cns2-sb-dot  { width:7px; height:7px; border-radius:50%; flex-shrink:0; transition:all .3s; }
.cns2-sb-dot.empty    { background:var(--t4); opacity:.35; }
.cns2-sb-dot.draft    { background:var(--orange); box-shadow:0 0 5px rgba(255,159,67,.5); }
.cns2-sb-dot.complete { background:var(--teal);   box-shadow:0 0 5px rgba(0,229,192,.5); }
.cns2-sb-dot.locked   { background:var(--blue);   box-shadow:0 0 5px rgba(59,158,255,.5); }

.cns2-sc-toggle { width:100%; padding:8px 14px; background:none; border:none;
  border-top:1px solid rgba(26,53,85,.4); cursor:pointer;
  display:flex; align-items:center; justify-content:space-between;
  font-family:'JetBrains Mono',monospace; font-size:9px; color:var(--t4);
  text-align:left; transition:color .15s; flex-shrink:0; }
.cns2-sc-toggle:hover { color:var(--t3); }
.cns2-sc-chev { font-size:9px; transition:transform .2s; }
.cns2-sc-chev.open { transform:rotate(90deg); }
.cns2-sb-legend { padding:8px 14px 12px; flex-shrink:0; }
.cns2-sc-row { display:flex; align-items:center; gap:6px; margin-bottom:4px; }
.cns2-sc-k { font-family:'JetBrains Mono',monospace; font-size:8px; color:var(--t2);
  background:var(--up); border:1px solid var(--bd); border-radius:3px; padding:1px 5px; flex-shrink:0; }
.cns2-sc-d { font-size:10px; color:var(--t4); }

/* Main area */
.cns2-area { flex:1; overflow-y:auto; padding:14px 18px 40px;
  display:flex; flex-direction:column; gap:8px; }

/* APSO group divider */
.cns2-grp-div { display:flex; align-items:center; gap:10px; margin:10px 0 4px; }
.cns2-grp-line { flex:1; height:1px; opacity:.18; background:currentColor; }
.cns2-grp-label { font-family:'JetBrains Mono',monospace; font-size:9px; font-weight:700;
  letter-spacing:2.5px; text-transform:uppercase; padding:3px 12px;
  border-radius:20px; white-space:nowrap; }
.cns2-grp-sub { font-family:'DM Sans',sans-serif; font-size:10px;
  color:var(--t4); white-space:nowrap; font-style:italic; }

/* Section card */
.cns2-sec { background:rgba(8,22,40,.82); border:1px solid rgba(26,53,85,.5);
  border-radius:12px; transition:border-color .2s, box-shadow .2s; }
.cns2-sec.focused { border-color:rgba(59,158,255,.45);
  box-shadow:0 0 0 1px rgba(59,158,255,.12), 0 4px 20px rgba(0,0,0,.3); }
.cns2-sec.grp-A { border-left:2px solid rgba(255,107,107,.3); }
.cns2-sec.grp-A.focused { border-left-color:var(--apso-a); }
.cns2-sec.grp-P { border-left:2px solid rgba(0,229,192,.3); }
.cns2-sec.grp-P.focused { border-left-color:var(--apso-p); }
.cns2-sec.grp-S { border-left:2px solid rgba(59,158,255,.3); }
.cns2-sec.grp-S.focused { border-left-color:var(--apso-s); }
.cns2-sec.grp-O { border-left:2px solid rgba(245,200,66,.3); }
.cns2-sec.grp-O.focused { border-left-color:var(--apso-o); }
.cns2-sec.collapsed .cns2-sec-hdr { border-bottom:none; }

.cns2-sec-hdr { display:flex; align-items:center; gap:9px; padding:10px 14px;
  background:rgba(11,30,54,.6); border-bottom:1px solid rgba(26,53,85,.4);
  cursor:pointer; user-select:none; transition:background .15s;
  border-radius:11px 11px 0 0; }
.cns2-sec.collapsed .cns2-sec-hdr { border-radius:11px; }
.cns2-sec-hdr:hover { background:rgba(14,37,68,.7); }
.cns2-sec-num   { font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:700;
  color:var(--t4); flex-shrink:0; width:16px; text-align:center; }
.cns2-sec-icon  { font-size:15px; flex-shrink:0; }
.cns2-sec-info  { flex:1; min-width:0; }
.cns2-sec-title { font-size:13px; font-weight:600; color:var(--t); }
.cns2-sec-preview { font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--t4);
  margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:360px; }
.cns2-sec-short { font-family:'JetBrains Mono',monospace; font-size:8px; color:var(--t4);
  background:var(--up); border:1px solid var(--bd); border-radius:3px; padding:1px 5px; flex-shrink:0; }
.cns2-sec-acts { display:flex; gap:4px; align-items:center; }
.cns2-status { font-family:'JetBrains Mono',monospace; font-size:8px; font-weight:700;
  padding:2px 8px; border-radius:20px; white-space:nowrap; }
.st-empty    { background:rgba(90,130,168,.1);  color:var(--t4);     border:1px solid rgba(90,130,168,.2); }
.st-draft    { background:rgba(255,159,67,.1);  color:var(--orange); border:1px solid rgba(255,159,67,.3); }
.st-complete { background:rgba(0,229,192,.1);   color:var(--teal);   border:1px solid rgba(0,229,192,.3); }
.st-locked   { background:rgba(59,158,255,.1);  color:var(--blue);   border:1px solid rgba(59,158,255,.3); }
.cns2-chevron { font-size:11px; color:var(--t4); transition:transform .2s; flex-shrink:0; }
.cns2-sec.collapsed .cns2-chevron { transform:rotate(-90deg); }

.cns2-macro-bar { display:flex; gap:5px; flex-wrap:wrap; padding:7px 14px 6px;
  border-bottom:1px solid rgba(26,53,85,.25); }
.macro-pill { font-family:'JetBrains Mono',monospace; font-size:9px; font-weight:500;
  padding:3px 9px; border-radius:20px; cursor:pointer; white-space:nowrap;
  background:rgba(59,158,255,.06); border:1px solid rgba(59,158,255,.2);
  color:var(--t3); transition:all .12s; }
.macro-pill:hover { background:rgba(59,158,255,.14); color:var(--t2); border-color:rgba(59,158,255,.4); }
.macro-pill.teal  { background:rgba(0,229,192,.06);   border-color:rgba(0,229,192,.2);   color:var(--teal);  }
.macro-pill.teal:hover  { background:rgba(0,229,192,.14); }
.macro-pill.coral { background:rgba(255,107,107,.06); border-color:rgba(255,107,107,.2); color:var(--coral); }
.macro-pill.coral:hover { background:rgba(255,107,107,.14); }

.cns2-builder-toggle { display:flex; align-items:center; gap:8px; padding:9px 14px;
  cursor:pointer; font-size:12px; font-weight:600; color:var(--t3);
  border-bottom:1px solid rgba(26,53,85,.25); transition:color .15s;
  user-select:none; font-family:'DM Sans',sans-serif; }
.cns2-builder-toggle:hover { color:var(--t2); }
.cns2-toggle-chev { font-size:10px; color:var(--t4); transition:transform .2s; margin-left:auto; }
.cns2-toggle-chev.open { transform:rotate(90deg); }

.cns2-sec-body { padding:2px 0 0; }
.cns2-ta { width:100%; padding:12px 14px; background:rgba(14,37,68,.4); border:none;
  border-top:1px solid rgba(26,53,85,.5); color:var(--t);
  font-family:'JetBrains Mono',monospace; font-size:12px; line-height:1.8;
  resize:vertical; outline:none; min-height:100px; display:block;
  box-sizing:border-box; transition:background .15s; }
.cns2-ta:focus { background:rgba(14,37,68,.65); border-top-color:rgba(59,158,255,.3); }
.cns2-ta:hover:not(:disabled) { background:rgba(14,37,68,.55); }
.cns2-ta::placeholder { color:var(--t4); font-style:italic; font-size:11px; }
.cns2-ta:disabled { opacity:.45; cursor:default; }
.cns2-ta.locked { background:rgba(59,158,255,.03); color:var(--t2); }
.cns2-sec.grp-A .cns2-ta { min-height:140px; }
.cns2-sec.grp-P .cns2-ta { min-height:110px; }

.cns2-sec-foot { display:flex; align-items:center; padding:4px 14px 8px; gap:10px; }
.cns2-chars { font-family:'JetBrains Mono',monospace; font-size:9px; color:var(--t4); }
.cns2-done-link { margin-left:auto; font-size:9px; font-weight:600; cursor:pointer;
  color:var(--teal); font-family:'JetBrains Mono',monospace; letter-spacing:.5px;
  text-transform:uppercase; transition:opacity .15s; }
.cns2-done-link:hover { opacity:.7; }

.mdm-builder { padding:12px 14px 10px; display:flex; flex-direction:column; gap:10px; }
.mdm-row { display:flex; flex-direction:column; gap:4px; }
.mdm-lbl { font-family:'JetBrains Mono',monospace; font-size:8px; color:var(--t4);
  letter-spacing:1.5px; text-transform:uppercase; }
.mdm-inp { background:var(--up); border:1px solid var(--bd); border-radius:7px;
  padding:7px 11px; font-family:'JetBrains Mono',monospace; font-size:12px;
  color:var(--t); outline:none; width:100%; transition:border-color .15s; }
.mdm-inp:focus { border-color:var(--bhi); }
.mdm-inp::placeholder { color:var(--t4); font-style:italic; }
.risk-row { display:flex; gap:6px; }
.risk-btn { flex:1; padding:8px 6px; border-radius:8px; font-size:11px; font-weight:600;
  cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .15s; text-align:center; border:2px solid transparent; }
.risk-btn.low  { background:rgba(61,255,160,.08);  color:var(--green); border-color:rgba(61,255,160,.2); }
.risk-btn.low.sel  { background:rgba(61,255,160,.18);  border-color:var(--green);  }
.risk-btn.mod  { background:rgba(245,200,66,.08);  color:var(--gold);  border-color:rgba(245,200,66,.2); }
.risk-btn.mod.sel  { background:rgba(245,200,66,.18);  border-color:var(--gold);   }
.risk-btn.high { background:rgba(255,68,68,.08);   color:var(--red);   border-color:rgba(255,68,68,.2); }
.risk-btn.high.sel { background:rgba(255,68,68,.18);   border-color:var(--red);    }
.mdm-data-grid { display:flex; gap:6px; flex-wrap:wrap; }
.data-chip { font-size:10px; font-family:'DM Sans',sans-serif; padding:4px 10px; border-radius:6px;
  cursor:pointer; border:1px solid rgba(59,158,255,.2); background:rgba(59,158,255,.05);
  color:var(--t3); transition:all .12s; user-select:none; }
.data-chip.sel { background:rgba(59,158,255,.15); border-color:var(--blue); color:var(--t2); }
.mdm-plan-list { display:flex; flex-direction:column; gap:4px; }
.mdm-plan-row { display:flex; align-items:center; gap:7px; }
.mdm-plan-num { font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--t4);
  flex-shrink:0; width:16px; }
.mdm-plan-inp { flex:1; background:var(--up); border:1px solid var(--bd); border-radius:6px;
  padding:6px 10px; font-family:'JetBrains Mono',monospace; font-size:11px;
  color:var(--t); outline:none; transition:border-color .15s; }
.mdm-plan-inp:focus { border-color:var(--bhi); }
.mdm-plan-inp::placeholder { color:var(--t4); font-style:italic; }
.mdm-add-btn { font-size:10px; color:var(--teal); background:none; border:none;
  cursor:pointer; font-family:'JetBrains Mono',monospace; padding:2px 0; }
.mdm-build-btn, .dispo-build-btn { align-self:flex-end; background:var(--teal); color:var(--bg);
  border:none; border-radius:7px; padding:7px 16px; font-size:11px; font-weight:700;
  cursor:pointer; font-family:'DM Sans',sans-serif; transition:filter .15s; }
.mdm-build-btn:hover, .dispo-build-btn:hover { filter:brightness(1.1); }

.dispo-builder { padding:12px 14px 10px; display:flex; flex-direction:column; gap:10px; }
.dispo-big-row { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
.dispo-big { padding:12px 8px; border-radius:9px; cursor:pointer; text-align:center;
  font-size:12px; font-weight:600; font-family:'DM Sans',sans-serif; transition:all .15s; border:2px solid transparent; }
.dispo-big.discharge { background:rgba(0,229,192,.08); color:var(--teal);   border-color:rgba(0,229,192,.2); }
.dispo-big.discharge.sel { background:rgba(0,229,192,.18); border-color:var(--teal); }
.dispo-big.admit     { background:rgba(255,107,107,.08); color:var(--coral); border-color:rgba(255,107,107,.2); }
.dispo-big.admit.sel     { background:rgba(255,107,107,.18); border-color:var(--coral); }
.dispo-big.obs       { background:rgba(245,200,66,.08);  color:var(--gold);  border-color:rgba(245,200,66,.2); }
.dispo-big.obs.sel       { background:rgba(245,200,66,.18); border-color:var(--gold); }
.dispo-big.transfer  { background:rgba(155,109,255,.08); color:var(--purple);border-color:rgba(155,109,255,.2); }
.dispo-big.transfer.sel  { background:rgba(155,109,255,.18); border-color:var(--purple); }
.dispo-big-icon { font-size:18px; margin-bottom:4px; }
.dispo-fields { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.dispo-field  { display:flex; flex-direction:column; gap:3px; }
.dispo-precautions { display:flex; gap:5px; flex-wrap:wrap; }
.precaution { font-size:10px; font-family:'DM Sans',sans-serif; padding:4px 9px; border-radius:6px;
  cursor:pointer; user-select:none; transition:all .12s;
  background:rgba(255,159,67,.05); border:1px solid rgba(255,159,67,.2); color:var(--t3); }
.precaution.sel { background:rgba(255,159,67,.15); border-color:var(--orange); color:var(--t2); }

.cns2-sig { background:rgba(8,22,40,.6); border:1px solid rgba(26,53,85,.4);
  border-radius:12px; padding:14px 16px; font-family:'JetBrains Mono',monospace;
  font-size:11px; color:var(--t3); }
.cns2-sig-lbl { font-size:8px; letter-spacing:2px; text-transform:uppercase; color:var(--t4); margin-bottom:7px; }
.cns2-load { height:2px; flex-shrink:0;
  background:linear-gradient(90deg,var(--teal),var(--blue),var(--teal));
  background-size:200% auto; animation:cns2-sweep 1.4s linear infinite; }
@keyframes cns2-sweep { to { background-position:200% center; } }

@media print {
  .cns2-sb,.cns2-acts,.cns2-sec-acts,.cns2-sec-foot,
  .cns2-macro-bar,.cns2-builder-toggle,.mdm-builder,.dispo-builder,
  .btn,.ibtn,.cns2-emb-top,.cns2-grp-sub { display:none !important; }
  .cns2 { position:static; background:white; color:black; }
  .cns2-top { background:white; border-bottom:1px solid #ccc; }
  .cns2-sec { background:white; border:1px solid #ddd; page-break-inside:avoid;
    border-left:3px solid #ccc !important; }
  .cns2-ta { color:black; font-size:11px; }
  .cns2-grp-label { background:#f0f0f0 !important; color:black !important; }
}`;
  document.head.appendChild(s);
})();

// ─── APSO GROUP CONFIG ────────────────────────────────────────────────────────
// Basis: Rosenbloom et al. JAMIA 2010; Vanderbilt EHR implementation studies.
// Front-loading A and P reduces time-to-critical-information 30–60% for
// consulting providers. S and O serve as auditable supporting evidence.
const APSO_GROUPS = {
  header: { label:null,          sublabel:null,                          color:null,      letter:null  },
  A:      { label:"Assessment",  sublabel:"Clinical impression first",   color:"#ff6b6b", letter:"A"   },
  P:      { label:"Plan",        sublabel:"Active management decisions", color:"#00e5c0", letter:"P"   },
  S:      { label:"Subjective",  sublabel:"Patient-reported history",    color:"#3b9eff", letter:"S"   },
  O:      { label:"Objective",   sublabel:"Measured data",               color:"#f5c842", letter:"O"   },
};

// ─── APSO SECTION ORDER ───────────────────────────────────────────────────────
const SECTIONS = [
  { id:"header",     title:"Patient Header",             icon:"👤", key:"1", group:"header" },
  { id:"assessment", title:"Assessment & MDM",           icon:"⚖️", key:"2", group:"A"      },
  { id:"plan",       title:"Plan & Orders",              icon:"📋", key:"3", group:"P"      },
  { id:"dispo",      title:"Disposition",                icon:"🚪", key:"4", group:"P"      },
  { id:"cc",         title:"Chief Complaint",             icon:"💬", key:"5", group:"S"      },
  { id:"hpi",        title:"History of Present Illness",  icon:"📝", key:"6", group:"S"      },
  { id:"pmh",        title:"PMH / Meds / Allergies",      icon:"💊", key:"7", group:"S"      },
  { id:"ros",        title:"Review of Systems",            icon:"🔍", key:"8", group:"S"      },
  { id:"vitals",     title:"Vital Signs",                  icon:"📈", key:"9", group:"O"      },
  { id:"pe",         title:"Physical Examination",         icon:"🩺", key:"0", group:"O"      },
];

const TAB_MAP = {
  header:null, assessment:null, plan:"orders", dispo:"discharge",
  cc:"cc", hpi:"cc", pmh:"meds", ros:"ros", vitals:"vit", pe:"pe",
};

const MACROS = {
  assessment: [
    { label:"Working Dx",  cls:"coral", text:"ASSESSMENT:\n1. \n\nDIFFERENTIAL:\n1. \n2. \n3. " },
    { label:"DDx only",    cls:"",      text:"DIFFERENTIAL DIAGNOSIS:\n1. \n2. \n3. " },
    { label:"MDM: Low",    cls:"teal",  text:"MDM COMPLEXITY: STRAIGHTFORWARD\n  Problems: Self-limited or minor\n  Data: Minimal or none\n  Risk: Minimal" },
    { label:"MDM: Mod",    cls:"",      text:"MDM COMPLEXITY: MODERATE\n  Problems: One or more chronic illness with exacerbation\n  Data: Limited\n  Risk: Prescription drug management" },
    { label:"MDM: High",   cls:"",      text:"MDM COMPLEXITY: HIGH\n  Problems: Severe exacerbation / threat to life\n  Data: Extensive\n  Risk: Drug therapy requiring intensive monitoring" },
    { label:"Risk: Low",   cls:"",      text:"RISK STRATIFICATION: LOW — " },
    { label:"Risk: Mod",   cls:"",      text:"RISK STRATIFICATION: MODERATE — " },
    { label:"Risk: High",  cls:"",      text:"RISK STRATIFICATION: HIGH — " },
  ],
  plan: [
    { label:"IV + Fluids",    cls:"teal", text:"ACTIVE MANAGEMENT:\n  · IV access established\n  · IV fluid resuscitation initiated" },
    { label:"Monitoring",     cls:"",     text:"  · Continuous cardiac monitoring\n  · Pulse oximetry\n  · Serial vital signs" },
    { label:"O₂ therapy",     cls:"",     text:"  · Supplemental O₂ titrated to SpO₂ ≥94%" },
    { label:"Analgesia",      cls:"",     text:"  · Analgesia administered — see eRx" },
    { label:"NPO",            cls:"",     text:"  · Patient maintained NPO" },
    { label:"Labs + Imaging", cls:"",     text:"  · Diagnostic workup initiated — see Orders" },
    { label:"Consult",        cls:"",     text:"  · Specialty consultation placed — see Consults" },
  ],
  ros: [
    { label:"All sys neg",   cls:"teal", text:"REVIEW OF SYSTEMS:\nAll systems reviewed and negative except as noted in HPI." },
    { label:"Pertinent neg", cls:"",     text:"Pertinent negatives: denies fever, chills, nausea, vomiting, diarrhea, headache, vision changes, chest pain, shortness of breath, palpitations, dysuria, rash." },
    { label:"Neg CV/Resp",   cls:"",     text:"  (−) Palpitations  (−) Orthopnea  (−) PND  (−) Leg swelling\n  (−) Cough  (−) Hemoptysis  (−) Wheezing" },
    { label:"Neg GI/GU",     cls:"",     text:"  (−) Nausea  (−) Vomiting  (−) Diarrhea  (−) Constipation\n  (−) Hematochezia  (−) Dysuria  (−) Hematuria" },
    { label:"Neg Neuro",     cls:"",     text:"  (−) Headache  (−) Vision changes  (−) Weakness  (−) Numbness  (−) Syncope" },
  ],
  pe: [
    { label:"Normal adult exam", cls:"teal", text:"PHYSICAL EXAMINATION:\n  Gen:    Alert, oriented x3, well-appearing, no acute distress\n  HEENT:  Normocephalic/atraumatic. PERRL. EOMI. Oropharynx clear.\n  Neck:   Supple. No lymphadenopathy. No JVD. No meningismus.\n  CV:     Regular rate and rhythm. S1/S2 normal. No murmurs/rubs/gallops.\n  Lungs:  Clear to auscultation bilaterally. No wheezes/rales/rhonchi.\n  Abd:    Soft, non-tender, non-distended. Normoactive bowel sounds. No guarding or rigidity.\n  Ext:    No cyanosis, clubbing, or edema. Pulses 2+ bilaterally.\n  Neuro:  Alert and oriented x3. CN II-XII grossly intact. No focal neurological deficits." },
    { label:"Gen: WNL",   cls:"", text:"  Gen:    Alert, oriented x3, well-appearing, no acute distress" },
    { label:"CV: WNL",    cls:"", text:"  CV:     Regular rate and rhythm. S1/S2 normal. No murmurs/rubs/gallops." },
    { label:"Lungs: WNL", cls:"", text:"  Lungs:  Clear to auscultation bilaterally. No wheezes/rales/rhonchi." },
    { label:"Abd: WNL",   cls:"", text:"  Abd:    Soft, non-tender, non-distended. Normoactive bowel sounds. No guarding or rigidity." },
    { label:"Neuro: WNL", cls:"", text:"  Neuro:  Alert and oriented x3. No focal neurological deficits." },
  ],
};

const DATA_OPTS   = ["Labs ordered","Imaging ordered","ECG","External records reviewed","Specialist consulted","New Rx / Rx changed"];
const PRECAUTIONS = ["Worsening symptoms","Fever >101°F","Chest pain","Difficulty breathing","New or worsening pain","Unable to tolerate PO","Falls or altered mental status"];
const TIMER_WARN  = 1200;

// ─── SECTION TEXT ASSEMBLER ───────────────────────────────────────────────────
function assembleSection(id, d = {}) {
  const {
    demo={}, cc={}, vitals={}, medications=[], allergies=[],
    pmhSelected={}, pmhExtra="", surgHx="", famHx="", socHx="",
    rosState={}, rosNotes={}, rosSymptoms={},
    peState={}, peFindings={},
    esiLevel="", registration={},
  } = d;
  const dateStr = new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
  const timeStr = new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
  const name = [demo.firstName,demo.lastName].filter(Boolean).join(" ") || "Unknown Patient";
  const ln = "─".repeat(58);

  switch (id) {
    case "header":
      return [
        "EMERGENCY DEPARTMENT NOTE", ln,
        `Patient:    ${name}`,
        (demo.age||demo.sex)&&`Age / Sex:  ${[demo.age?demo.age+"y":"",demo.sex].filter(Boolean).join(" · ")}`,
        demo.dob&&`DOB:        ${demo.dob}`,
        (registration.mrn||demo.mrn)&&`MRN:        ${registration.mrn||demo.mrn}`,
        registration.room&&`Room:       ${registration.room}`,
        esiLevel&&`ESI Level:  ${esiLevel}`,
        `Date / Time: ${dateStr}  ${timeStr}`,
        allergies.length&&`${ln}\nALLERGIES:  ⚠  ${allergies.join(" · ")}`,
      ].filter(Boolean).join("\n");
    // A — Assessment: starts empty. This is the physician's synthesis;
    // pre-population would undermine the clinical reasoning requirement.
    case "assessment": return "";
    // P — Plan and Disposition: start empty for same reason.
    case "plan":       return "";
    case "dispo":      return "";
    case "cc":         return cc.text ? `Chief Complaint:\n${cc.text}` : "";
    case "hpi":
      if (cc.hpi) return cc.hpi;
      if (!cc.text) return "";
      return [
        `Patient presents with ${cc.text}.`,
        cc.onset&&`Onset ${cc.onset}.`,
        cc.duration&&`Duration ${cc.duration}.`,
        cc.quality&&`Quality described as ${cc.quality}.`,
        cc.severity&&`Severity rated ${cc.severity}/10.`,
        cc.radiation&&`Radiation to ${cc.radiation}.`,
        cc.aggravate&&`Aggravated by ${cc.aggravate}.`,
        cc.relieve&&`Relieved by ${cc.relieve}.`,
        cc.assoc&&`Associated symptoms: ${cc.assoc}.`,
      ].filter(Boolean).join(" ");
    case "pmh": {
      const list = Object.entries(pmhSelected).filter(([,v])=>v).map(([k])=>k);
      const str  = list.length ? list.join(", ")+(pmhExtra?", "+pmhExtra:"") : pmhExtra||"None documented.";
      return [
        "PAST MEDICAL HISTORY:", str,
        surgHx&&`\nSURGICAL HISTORY:\n${surgHx}`,
        famHx&&`\nFAMILY HISTORY:\n${famHx}`,
        socHx&&`\nSOCIAL HISTORY:\n${socHx}`,
        `\nMEDICATIONS:\n${medications.length?medications.join("\n"):"None documented."}`,
        `\nALLERGIES:\n${allergies.length?allergies.join(", "):"NKDA"}`,
      ].filter(Boolean).join("\n");
    }
    case "ros": {
      const fv = rosState?Object.values(rosState)[0]:null;
      const nested = fv&&typeof fv==="object"&&!Array.isArray(fv)&&Object.values(fv)[0]?.status!==undefined;
      if (nested) {
        const ORD=["constitutional","eyes","ent","cardiovascular","respiratory","gi","gu","msk","skin","neuro","psych","endo","heme","allergic"];
        const neg=[],pos=[];
        ORD.forEach(sid=>{
          const sy=rosState[sid]; if(!sy) return;
          if(!Object.values(sy).some(s=>s.status!=="unreviewed")) return;
          const pi=Object.entries(sy).filter(([,v])=>v.status==="pos").map(([s,v])=>s.toLowerCase()+(v.detail?` (${v.detail})`:""));
          const ni=Object.entries(sy).filter(([,v])=>v.status==="neg").map(([s])=>s.toLowerCase());
          const n=sid.charAt(0).toUpperCase()+sid.slice(1);
          if(pi.length) pos.push({name:n,pi,ni}); else if(ni.length) neg.push(n);
        });
        if(!neg.length&&!pos.length) return "";
        const lines=["REVIEW OF SYSTEMS:"];
        if(neg.length) lines.push(`\nNegative: ${neg.join(", ")}.`);
        pos.forEach(p=>lines.push(`\n${p.name}: Positive for ${p.pi.join(", ")}.`+(p.ni.length?` Denies ${p.ni.join(", ")}.`:"")));
        return lines.join("");
      }
      const sk=Object.keys(rosState),sym=Object.keys(rosSymptoms);
      if(!sk.length&&!sym.length) return "";
      const p=sk.filter(s=>rosState[s]==="positive"||rosState[s]===true);
      const n=sk.filter(s=>rosState[s]==="negative"||rosState[s]===false);
      const sp=sym.filter(s=>rosSymptoms[s]===true);
      const ap=[...new Set([...p,...sp])];
      if(!ap.length&&!n.length) return "";
      return ["REVIEW OF SYSTEMS:",
        ap.length&&"\nPOSITIVE:",
        ...ap.map(s=>`  (+) ${s}${rosNotes?.[s]?" — "+rosNotes[s]:""}`),
        n.length&&"\nNEGATIVE (pertinent):",
        ...n.map(s=>`  (−) ${s}`),
      ].filter(Boolean).join("\n");
    }
    case "vitals": {
      const e=[
        ["BP",vitals.bp],["HR",vitals.hr],["RR",vitals.rr],["SpO₂",vitals.spo2],
        ["Temp",vitals.temp],["GCS",vitals.gcs],
        ["Wt",vitals.weight?vitals.weight+" kg":null],
        ["O₂ del",vitals.o2del||null],
        ["Pain",vitals.pain?vitals.pain+"/10":null],
      ].filter(([,v])=>v);
      if(!e.length) return "";
      return "VITAL SIGNS:\n"+e.map(([k,v])=>`  ${k.padEnd(8)}: ${v}`).join("\n");
    }
    case "pe": {
      const sys=Object.keys(peState);
      if(!sys.length) return "";
      return ["PHYSICAL EXAMINATION:",
        ...sys.map(s=>{const f=peFindings?.[s]||peState[s];return f?`  ${s}: ${f}`:null;}).filter(Boolean),
      ].join("\n");
    }
    default: return "";
  }
}

function buildInitialSections(pd) {
  const m={};
  SECTIONS.forEach(s=>{
    const a=assembleSection(s.id,pd);
    m[s.id]={content:a,status:a?"draft":"empty",locked:false,collapsed:false};
  });
  return m;
}

// ─── MDM BUILDER ──────────────────────────────────────────────────────────────
function MDMBuilder({dx,setDx,risk,setRisk,data,setData,plan,setPlan,onApply}){
  const toggleData=useCallback(i=>setData(d=>d.includes(i)?d.filter(x=>x!==i):[...d,i]),[setData]);
  const build=useCallback(()=>{
    const dl=dx.filter(Boolean),pl=plan.filter(Boolean);
    if(!dl.length&&!risk&&!data.length&&!pl.length){toast.error("Fill in at least one field.");return;}
    const lines=["ASSESSMENT:",""];
    if(dl.length){lines.push("Impression:");dl.forEach((d,i)=>lines.push(`  ${i+1}. ${d}`));lines.push("");}
    if(risk){lines.push(`Risk Stratification: ${risk.toUpperCase()}`);lines.push("");}
    if(data.length){lines.push("Data reviewed / ordered:");data.forEach(d=>lines.push(`  · ${d}`));lines.push("");}
    if(pl.length){lines.push("Clinical Reasoning:");pl.forEach((p,i)=>lines.push(`  ${i+1}. ${p}`));}
    onApply(lines.join("\n"));
  },[dx,risk,data,plan,onApply]);
  return (
    <div className="mdm-builder">
      <div className="mdm-row">
        <div className="mdm-lbl">Impression / Diagnosis</div>
        {dx.map((v,i)=>(
          <input key={i} className="mdm-inp" value={v} placeholder={`Diagnosis ${i+1}...`}
            onChange={e=>{const n=[...dx];n[i]=e.target.value;setDx(n);}}/>
        ))}
      </div>
      <div className="mdm-row">
        <div className="mdm-lbl">Risk Stratification</div>
        <div className="risk-row">
          {[["low","Low"],["mod","Moderate"],["high","High"]].map(([v,l])=>(
            <button key={v} className={`risk-btn ${v}${risk===v?" sel":""}`}
              onClick={()=>setRisk(r=>r===v?"":v)}>{l}</button>
          ))}
        </div>
      </div>
      <div className="mdm-row">
        <div className="mdm-lbl">Data / Complexity</div>
        <div className="mdm-data-grid">
          {DATA_OPTS.map(o=>(
            <div key={o} className={`data-chip${data.includes(o)?" sel":""}`} onClick={()=>toggleData(o)}>{o}</div>
          ))}
        </div>
      </div>
      <div className="mdm-row">
        <div className="mdm-lbl">Clinical Reasoning</div>
        <div className="mdm-plan-list">
          {plan.map((v,i)=>(
            <div key={i} className="mdm-plan-row">
              <span className="mdm-plan-num">{i+1}.</span>
              <input className="mdm-plan-inp" value={v} placeholder={`Reasoning ${i+1}...`}
                onChange={e=>{const n=[...plan];n[i]=e.target.value;setPlan(n);}}/>
            </div>
          ))}
          {plan.length<6&&<button className="mdm-add-btn" onClick={()=>setPlan(p=>[...p,""])}>+ add item</button>}
        </div>
      </div>
      <button className="mdm-build-btn" onClick={build}>Apply to Assessment →</button>
    </div>
  );
}

// ─── DISPO BUILDER ────────────────────────────────────────────────────────────
function DispoBuilder({mode,setMode,service,setService,followup,setFollowup,fwTime,setFwTime,prec,setPrec,onApply}){
  const togglePrec=useCallback(i=>setPrec(d=>d.includes(i)?d.filter(x=>x!==i):[...d,i]),[setPrec]);
  const build=useCallback(()=>{
    if(!mode){toast.error("Select a disposition first.");return;}
    const lines=["DISPOSITION:",""];
    if(mode==="discharge") lines.push("Patient discharged home in stable condition.");
    else if(mode==="admit") lines.push(`Admitted to hospital${service?". Service: "+service:"."}`);
    else if(mode==="obs") lines.push("Patient placed in observation status for further monitoring and evaluation.");
    else if(mode==="transfer") lines.push(`Patient transferred to ${service||"receiving facility"} for higher level of care.`);
    lines.push("");
    if(mode==="discharge"){
      lines.push("Discharge instructions provided: Yes");
      if(prec.length){lines.push("Return precautions discussed:");prec.forEach(p=>lines.push(`  · ${p}`));}
    }
    if(followup) lines.push(`\nFollow-up: ${followup}${fwTime?" in "+fwTime:""}`);
    lines.push("\nAttending Physician: ___________   Time: ___________");
    onApply(lines.join("\n"));
  },[mode,service,prec,followup,fwTime,onApply]);
  return (
    <div className="dispo-builder">
      <div className="mdm-row">
        <div className="mdm-lbl">Disposition</div>
        <div className="dispo-big-row">
          {[{v:"discharge",l:"Discharge Home",i:"🏠",c:"discharge"},{v:"admit",l:"Admit",i:"🏥",c:"admit"},
            {v:"obs",l:"Observation",i:"⏱",c:"obs"},{v:"transfer",l:"Transfer",i:"🚑",c:"transfer"}].map(({v,l,i,c})=>(
            <div key={v} className={`dispo-big ${c}${mode===v?" sel":""}`} onClick={()=>setMode(m=>m===v?"":v)}>
              <div className="dispo-big-icon">{i}</div>{l}
            </div>
          ))}
        </div>
      </div>
      {(mode==="admit"||mode==="transfer")&&(
        <div className="dispo-fields">
          <div className="dispo-field">
            <div className="mdm-lbl">{mode==="admit"?"Admitting Service":"Receiving Facility"}</div>
            <input className="mdm-inp" value={service}
              placeholder={mode==="admit"?"e.g. Internal Medicine...":"e.g. UCSF Medical Center..."}
              onChange={e=>setService(e.target.value)}/>
          </div>
        </div>
      )}
      {mode==="discharge"&&(
        <div className="mdm-row">
          <div className="mdm-lbl">Return Precautions</div>
          <div className="dispo-precautions">
            {PRECAUTIONS.map(p=>(
              <div key={p} className={`precaution${prec.includes(p)?" sel":""}`} onClick={()=>togglePrec(p)}>{p}</div>
            ))}
          </div>
        </div>
      )}
      <div className="dispo-fields">
        <div className="dispo-field">
          <div className="mdm-lbl">Follow-up with</div>
          <input className="mdm-inp" value={followup} placeholder="e.g. PCP, Cardiologist..." onChange={e=>setFollowup(e.target.value)}/>
        </div>
        <div className="dispo-field">
          <div className="mdm-lbl">Timeframe</div>
          <input className="mdm-inp" value={fwTime} placeholder="e.g. 5–7 days..." onChange={e=>setFwTime(e.target.value)}/>
        </div>
      </div>
      <button className="dispo-build-btn" onClick={build}>Apply to Disposition →</button>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ClinicalNoteStudio({
  patientData:propData, embedded=false, onBack, onSave:onExternalSave,
}){
  const navigate=useNavigate();
  const location=useLocation();
  const [searchParams]=useSearchParams();
  const urlNoteId=searchParams.get("noteId");

  const patientData=useMemo(
    ()=>propData||location.state?.patientData||{},
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [propData,location.key]
  );
  const {demo={},cc={},medications=[],allergies=[],registration={},esiLevel=""}=patientData;
  const patientName=[demo.firstName,demo.lastName].filter(Boolean).join(" ")||"New Patient";

  const [sections,setSections]  =useState(()=>buildInitialSections(patientData));
  const [focused,setFocused]    =useState("assessment"); // APSO: open on A first
  const [loading,setLoading]    =useState({});
  const [anyBusy,setAnyBusy]    =useState(false);
  const [saved,setSaved]        =useState(false);
  const [startTime]             =useState(()=>Date.now());
  const [elapsed,setElapsed]    =useState(0);
  const [scOpen,setScOpen]      =useState(false);
  const [mdmOpen,setMdmOpen]    =useState(true);   // Assessment builder open by default
  const [dispoOpen,setDispoOpen]=useState(false);

  const [mdmDx,setMdmDx]       =useState(["","",""]);
  const [mdmRisk,setMdmRisk]   =useState("");
  const [mdmData,setMdmData]   =useState([]);
  const [mdmPlan,setMdmPlan]   =useState(["",""]);
  const [dispoMode,setDispoMode]=useState("");
  const [dispoSvc,setDispoSvc] =useState("");
  const [dispoFw,setDispoFw]   =useState("");
  const [dispoFwT,setDispoFwT] =useState("");
  const [dispoPrec,setDispoPrec]=useState([]);

  const sectionsRef   =useRef(sections);
  const secDivRefs    =useRef({});
  const taRefs        =useRef({});
  const savedIdRef    =useRef(urlNoteId||null);

  useEffect(()=>{sectionsRef.current=sections;},[sections]);

  useEffect(()=>{
    const id=setInterval(()=>setElapsed(Math.floor((Date.now()-startTime)/1000)),1000);
    return()=>clearInterval(id);
  },[startTime]);

  const timerStr=useMemo(()=>{
    const m=Math.floor(elapsed/60),s=elapsed%60;
    return `${m}:${String(s).padStart(2,"0")}`;
  },[elapsed]);

  useEffect(()=>{
    if(!urlNoteId||propData) return;
    base44.entities.ClinicalNote.get(urlNoteId).then(note=>{
      savedIdRef.current=urlNoteId;
      if(note?.raw_note) setSections(prev=>({...prev,assessment:{content:note.raw_note,status:"draft",locked:false,collapsed:false}}));
      toast.info("Note loaded.");
    }).catch(()=>{});
  },[urlNoteId,propData]);

  useEffect(()=>{
    Object.keys(sections).forEach(id=>{
      const ta=taRefs.current[id];
      if(!ta) return;
      ta.style.height="auto";
      ta.style.height=ta.scrollHeight+"px";
    });
  },[sections]);

  const completedCount=useMemo(()=>
    SECTIONS.filter(s=>["complete","locked"].includes(sections[s.id]?.status)).length,
  [sections]);

  const getGroupStatus=useCallback(g=>{
    const gs=SECTIONS.filter(s=>s.group===g);
    if(!gs.length) return "empty";
    if(gs.every(s=>["complete","locked"].includes(sections[s.id]?.status))) return "done";
    if(gs.some(s=>["complete","locked","draft"].includes(sections[s.id]?.status))) return "partial";
    return "empty";
  },[sections]);

  const updateSection=useCallback((id,content)=>{
    setSections(prev=>({...prev,[id]:{...prev[id],content,status:content?"draft":"empty"}}));
    setSaved(false);
  },[]);

  const markComplete=useCallback(id=>{
    setSections(prev=>{
      const cur=prev[id];
      const ns=cur.status==="complete"?"draft":"complete";
      return{...prev,[id]:{...cur,status:ns,collapsed:ns==="complete"}};
    });
  },[]);

  const toggleCollapse=useCallback(id=>{
    const was=!!sectionsRef.current[id]?.collapsed;
    if(was) setFocused(id);
    setSections(prev=>({...prev,[id]:{...prev[id],collapsed:!was}}));
  },[]);

  const toggleLock=useCallback(id=>{
    setSections(prev=>({...prev,[id]:{...prev[id],locked:!prev[id].locked,status:!prev[id].locked?"locked":"complete"}}));
  },[]);

  const applyMacro=useCallback((id,text)=>{
    setSections(prev=>{
      const cur=prev[id]?.content||"";
      return{...prev,[id]:{...prev[id],content:cur?cur+"\n"+text:text,status:"draft"}};
    });
    setSaved(false);
    setTimeout(()=>{const ta=taRefs.current[id];if(ta){ta.style.height="auto";ta.style.height=ta.scrollHeight+"px";}},50);
  },[]);

  const applyMDM=useCallback(text=>{updateSection("assessment",text);setMdmOpen(false);toast.success("Assessment applied.");},[updateSection]);
  const applyDispo=useCallback(text=>{updateSection("dispo",text);setDispoOpen(false);toast.success("Disposition applied.");},[updateSection]);

  const generateSection=useCallback(async id=>{
    const sec=SECTIONS.find(s=>s.id===id);
    if(!sec||sectionsRef.current[id]?.locked) return;
    setLoading(l=>({...l,[id]:true}));setAnyBusy(true);
    try{
      const res=await base44.integrations.Core.InvokeLLM({
        prompt:[
          "You are a clinical documentation assistant in an emergency medicine platform.",
          `Generate ONLY the "${sec.title}" section of an ED note in standard EP documentation style.`,
          "Be concise. Return ONLY the section text.",
          `Patient: ${patientName}.  CC: ${cc.text||"not documented"}.`,
          `Current content: ${sectionsRef.current[id]?.content||"(empty)"}`,
        ].join("\n")
      });
      const text=typeof res==="string"?res:JSON.stringify(res);
      setSections(prev=>({...prev,[id]:{...prev[id],content:text,status:"draft"}}));
      setSaved(false);
    }catch{toast.error("AI generation failed.");}
    finally{setLoading(prev=>{const n={...prev,[id]:false};setAnyBusy(Object.values(n).some(Boolean));return n;});}
  },[patientName,cc.text]);

  const generateAll=useCallback(async()=>{
    const empty=SECTIONS.filter(s=>{const sec=sectionsRef.current[s.id];return!sec?.content||sec.status==="empty";});
    if(!empty.length){toast.info("All sections have content.");return;}
    toast.info(`Generating ${empty.length} sections…`);
    for(const s of empty) await generateSection(s.id);
    toast.success("Done.");
  },[generateSection]);

  const rebuildAll=useCallback(()=>{setSections(buildInitialSections(patientData));setSaved(false);toast.success("Note rebuilt.");},[patientData]);

  const copyAll=useCallback(async()=>{
    const div="\n\n"+"─".repeat(58)+"\n\n";
    const full=SECTIONS.map(s=>sectionsRef.current[s.id]?.content).filter(Boolean).join(div);
    try{await navigator.clipboard.writeText(full);toast.success("Note copied.");}
    catch{toast.error("Clipboard access denied.");}
  },[]);

  const printNote=useCallback(()=>window.print(),[]);

  const saveNote=useCallback(async()=>{
    const full=SECTIONS.map(s=>sectionsRef.current[s.id]?.content).filter(Boolean).join("\n\n");
    try{
      if(savedIdRef.current){
        await base44.entities.ClinicalNote.update(savedIdRef.current,{raw_note:full,status:"draft"});
      }else{
        const c=await base44.entities.ClinicalNote.create({
          raw_note:full,patient_name:patientName,
          patient_id:registration.mrn||demo.mrn||"",
          patient_age:demo.age||"",patient_gender:demo.sex||"",
          chief_complaint:cc.text||"",medications,allergies,status:"draft",
        });
        savedIdRef.current=c.id;
      }
      setSaved(true);toast.success("Note saved.");onExternalSave?.();
    }catch(e){toast.error("Save failed: "+(e?.message||"error"));}
  },[patientName,demo,registration,cc,medications,allergies,onExternalSave]);

  const jumpTo=useCallback(id=>{
    setFocused(id);
    setSections(prev=>({...prev,[id]:{...prev[id],collapsed:false}}));
    setTimeout(()=>secDivRefs.current[id]?.scrollIntoView({behavior:"smooth",block:"start"}),50);
  },[]);

  useEffect(()=>{
    const handler=e=>{
      const mod=e.metaKey||e.ctrlKey;
      if(!mod) return;
      if(!embedded){
        const k=e.key;
        const idx=k==="0"?9:parseInt(k,10)-1;
        if(!Number.isNaN(idx)&&idx>=0&&idx<SECTIONS.length){e.preventDefault();jumpTo(SECTIONS[idx].id);return;}
      }
      switch(true){
        case e.key==="g"&&!e.shiftKey:e.preventDefault();generateSection(focused);break;
        case e.key==="g"&&e.shiftKey:e.preventDefault();generateAll();break;
        case e.key==="s"&&!e.shiftKey:e.preventDefault();saveNote();break;
        case e.key==="p"&&!e.shiftKey:e.preventDefault();printNote();break;
        case e.key==="c"&&e.shiftKey:e.preventDefault();copyAll();break;
        case e.key==="r"&&!e.shiftKey:e.preventDefault();rebuildAll();break;
        default:break;
      }
    };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[embedded,focused,generateSection,generateAll,saveNote,printNote,copyAll,rebuildAll,jumpTo]);

  const pct=(completedCount/SECTIONS.length)*100;

  const APSOChips=()=>(
    <div className="cns2-apso-ind">
      {["A","P","S","O"].map(g=>{
        const st=getGroupStatus(g);
        const col=APSO_GROUPS[g].color;
        return(
          <span key={g} className={`cns2-apso-chip ${st}`} title={`${APSO_GROUPS[g].label} — ${st}`}
            style={st!=="empty"?{color:col,borderColor:`${col}60`}:{}}>
            {g}
          </span>
        );
      })}
    </div>
  );

  const ActionBtns=()=>(
    <div className="cns2-acts">
      <button className="btn btn-ghost" onClick={rebuildAll} title="⌘R">↺ Rebuild</button>
      <button className="btn btn-gold"  onClick={generateAll} disabled={anyBusy} title="⌘⇧G">
        {anyBusy?"⟳ Generating…":"✦ Generate All"}
      </button>
      <button className="btn btn-ghost" onClick={copyAll}   title="⌘⇧C">⎘ Copy</button>
      <button className="btn btn-ghost" onClick={printNote} title="⌘P">⎙ Print</button>
      <button className="btn btn-teal"  onClick={saveNote}  title="⌘S">{saved?"✓ Saved":"💾 Save"}</button>
    </div>
  );

  // Build sidebar flat list with group headers
  const sidebarItems=useMemo(()=>{
    const items=[];let last=null;
    SECTIONS.forEach(s=>{
      if(s.group!==last){
        last=s.group;
        const g=APSO_GROUPS[s.group];
        if(g?.label) items.push({type:"group",group:s.group,label:g.label,color:g.color});
      }
      items.push({type:"section",...s});
    });
    return items;
  },[]);

  // Build note area elements with APSO group dividers
  const noteElements=useMemo(()=>{
    const els=[];let last=null;
    SECTIONS.forEach(s=>{
      const g=APSO_GROUPS[s.group];
      if(s.group!==last&&s.group!=="header"){
        last=s.group;
        els.push(
          <div key={`div-${s.group}`} className="cns2-grp-div" style={{color:g.color}}>
            <div className="cns2-grp-line"/>
            <span className="cns2-grp-label"
              style={{background:`${g.color}18`,border:`1px solid ${g.color}35`,color:g.color}}>
              {g.letter} · {g.label}
            </span>
            <span className="cns2-grp-sub">{g.sublabel}</span>
            <div className="cns2-grp-line"/>
          </div>
        );
      }else if(s.group==="header"){last="header";}

      const sec=sections[s.id]||{};
      const st=sec.status||"empty",lk=sec.locked||false,txt=sec.content||"",
            coll=sec.collapsed||false,busy=loading[s.id]||false;
      const hasMacros=!!MACROS[s.id]?.length;
      const isAssess=s.id==="assessment",isDispo=s.id==="dispo";
      const srcTab=TAB_MAP[s.id];

      els.push(
        <div key={s.id}
          ref={el=>{secDivRefs.current[s.id]=el;}}
          className={`cns2-sec grp-${s.group}${focused===s.id?" focused":""}${coll?" collapsed":""}`}
          onClick={()=>{if(coll)toggleCollapse(s.id);else setFocused(s.id);}}>

          <div className="cns2-sec-hdr"
            onClick={e=>{e.stopPropagation();toggleCollapse(s.id);setFocused(s.id);}}>
            <span className="cns2-sec-num">{s.key}</span>
            <span className="cns2-sec-icon">{s.icon}</span>
            <div className="cns2-sec-info">
              <div className="cns2-sec-title">{s.title}</div>
              {coll&&txt&&<div className="cns2-sec-preview">{txt.split("\n").find(l=>l.trim())||""}</div>}
            </div>
            {!embedded&&<span className="cns2-sec-short">⌘{s.key}</span>}
            <div className="cns2-sec-acts" onClick={e=>e.stopPropagation()}>
              {srcTab&&(
                <button className="ibtn" title={`Edit source data → ${srcTab} tab`}
                  onClick={()=>navigate(`/NewPatientInput?tab=${srcTab}`)} style={{fontSize:10}}>↩</button>
              )}
              <span className={`cns2-status st-${st}`}>{st==="locked"?"🔒 locked":st}</span>
              <button className={`ibtn${busy?" spin":""}`} title="AI Generate (⌘G)"
                disabled={lk||busy} onClick={()=>generateSection(s.id)}>
                {busy?"⟳":"✦"}
              </button>
              <button className="ibtn" title={lk?"Unlock":"Lock section"}
                onClick={()=>toggleLock(s.id)} style={lk?{color:"var(--blue)"}:{}}>
                {lk?"🔒":"🔓"}
              </button>
            </div>
            <span className="cns2-chevron">›</span>
          </div>

          {!coll&&hasMacros&&!lk&&(
            <div className="cns2-macro-bar" onClick={e=>e.stopPropagation()}>
              {MACROS[s.id].map(m=>(
                <button key={m.label} className={`macro-pill ${m.cls||""}`}
                  onClick={()=>applyMacro(s.id,m.text)}>{m.label}</button>
              ))}
            </div>
          )}

          {!coll&&isAssess&&!lk&&(
            <div onClick={e=>e.stopPropagation()}>
              <div className="cns2-builder-toggle" onClick={()=>setMdmOpen(o=>!o)}>
                <span style={{fontSize:13}}>⊕</span>
                <span>Assessment Builder (MDM)</span>
                <span className={`cns2-toggle-chev${mdmOpen?" open":""}`}>›</span>
              </div>
              {mdmOpen&&<MDMBuilder dx={mdmDx} setDx={setMdmDx} risk={mdmRisk} setRisk={setMdmRisk}
                data={mdmData} setData={setMdmData} plan={mdmPlan} setPlan={setMdmPlan} onApply={applyMDM}/>}
            </div>
          )}

          {!coll&&isDispo&&!lk&&(
            <div onClick={e=>e.stopPropagation()}>
              <div className="cns2-builder-toggle" onClick={()=>setDispoOpen(o=>!o)}>
                <span style={{fontSize:13}}>⊕</span>
                <span>Disposition Builder</span>
                <span className={`cns2-toggle-chev${dispoOpen?" open":""}`}>›</span>
              </div>
              {dispoOpen&&<DispoBuilder mode={dispoMode} setMode={setDispoMode}
                service={dispoSvc} setService={setDispoSvc}
                followup={dispoFw} setFollowup={setDispoFw}
                fwTime={dispoFwT}  setFwTime={setDispoFwT}
                prec={dispoPrec}   setPrec={setDispoPrec} onApply={applyDispo}/>}
            </div>
          )}

          {!coll&&(
            <div className="cns2-sec-body" onClick={e=>e.stopPropagation()}>
              <textarea
                ref={el=>{taRefs.current[s.id]=el;}}
                className={`cns2-ta${lk?" locked":""}`}
                value={txt} disabled={lk}
                placeholder={
                  isAssess?"Document your clinical impression, differential, and MDM — or use the builder above…"
                  :s.id==="plan"?"Document active management — IV access, monitoring, medications, orders — or use macros above…"
                  :isDispo?"Document disposition — or use the builder above…"
                  :`${s.title}…`
                }
                onChange={e=>updateSection(s.id,e.target.value)}
                onFocus={()=>setFocused(s.id)}
                onInput={e=>{e.target.style.height="auto";e.target.style.height=e.target.scrollHeight+"px";}}
              />
            </div>
          )}

          {!coll&&(
            <div className="cns2-sec-foot" onClick={e=>e.stopPropagation()}>
              <span className="cns2-chars">{txt.length} chars · {txt?txt.split("\n").length:0} lines</span>
              {!lk&&(
                <span className="cns2-done-link" onClick={()=>markComplete(s.id)}>
                  {st==="complete"?"✓ done — expand":"Mark complete ✓"}
                </span>
              )}
            </div>
          )}
        </div>
      );
    });
    return els;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[sections,focused,loading,embedded,mdmOpen,dispoOpen,mdmDx,mdmRisk,mdmData,mdmPlan,
     dispoMode,dispoSvc,dispoFw,dispoFwT,dispoPrec]);

  return (
    <div className={`cns2${embedded?" emb":""}`}>
      {anyBusy&&<div className="cns2-load"/>}

      {embedded?(
        <div className="cns2-emb-top">
          <div className="cns2-badge">NOTE STUDIO</div>
          <APSOChips/>
          <div style={{flex:1,display:"flex",alignItems:"center",gap:7,minWidth:0}}>
            <div className="cns2-emb-prog-bar">
              <div className="cns2-emb-prog-fill" style={{width:`${pct}%`}}/>
            </div>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--t4)",whiteSpace:"nowrap"}}>
              {completedCount}/{SECTIONS.length}
            </span>
          </div>
          <div className={`cns2-timer${elapsed>TIMER_WARN?" over":""}`}>{timerStr}</div>
          <ActionBtns/>
        </div>
      ):(
        <div className="cns2-top">
          <button className="btn btn-ghost" style={{flexShrink:0}}
            onClick={()=>onBack?onBack():navigate(-1)}>← Back</button>
          <div className="cns2-badge">NOTE STUDIO</div>
          <span className="cns2-ptname">{patientName}</span>
          {(demo.age||demo.sex)&&(
            <span className="cns2-meta">{[demo.age?demo.age+"y":"",demo.sex].filter(Boolean).join(" · ")}</span>
          )}
          {cc.text&&<span className="cns2-cc">CC: {cc.text}</span>}
          {esiLevel&&<span className="cns2-esi">ESI {esiLevel}</span>}
          <APSOChips/>
          <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
            <div className="cns2-prog-bar"><div className="cns2-prog-bar-fill" style={{width:`${pct}%`}}/></div>
            <span className="cns2-prog-count">{completedCount}/{SECTIONS.length}</span>
          </div>
          <div className={`cns2-timer${elapsed>TIMER_WARN?" over":""}`}>{timerStr}</div>
          <ActionBtns/>
        </div>
      )}

      <div className="cns2-body">
        <div className="cns2-sb">
          <div className="cns2-sb-head">
            <div className="cns2-sb-label">APSO Note Sections</div>
            <div className="cns2-sb-bar"><div className="cns2-sb-fill" style={{width:`${pct}%`}}/></div>
            <div className="cns2-sb-sub">{completedCount} of {SECTIONS.length} signed off</div>
          </div>
          <div className="cns2-sb-list">
            {sidebarItems.map(item=>{
              if(item.type==="group"){
                const gst=getGroupStatus(item.group);
                return(
                  <div key={`g-${item.group}`} className="cns2-sb-grp" style={{color:item.color}}>
                    <span className="cns2-sb-grp-pill"
                      style={{background:`${item.color}15`,border:`1px solid ${item.color}40`,color:item.color}}>
                      {item.group}
                    </span>
                    <span className="cns2-sb-grp-lbl" style={{color:item.color}}>{item.label}</span>
                    <div className="cns2-sb-grp-line" style={{color:item.color}}/>
                    {gst==="done"&&<span style={{fontSize:9,color:item.color}}>✓</span>}
                  </div>
                );
              }
              const st=sections[item.id]?.status||"empty";
              return(
                <div key={item.id} className={`cns2-sb-item${focused===item.id?" on":""}`}
                  onClick={()=>jumpTo(item.id)}>
                  <span className="cns2-sb-ico">{item.icon}</span>
                  <div className="cns2-sb-txt"><div className="cns2-sb-name">{item.title}</div></div>
                  {!embedded&&<span className="cns2-sb-key">⌘{item.key}</span>}
                  <div className={`cns2-sb-dot ${st}`}/>
                </div>
              );
            })}
          </div>
          <button className="cns2-sc-toggle" onClick={()=>setScOpen(o=>!o)}>
            <span>⌨ Shortcuts</span>
            <span className={`cns2-sc-chev${scOpen?" open":""}`}>›</span>
          </button>
          {scOpen&&(
            <div className="cns2-sb-legend">
              {[
                !embedded&&["⌘ 1–9, 0","Jump to section"],
                ["⌘ G",  "Generate focused"],["⌘ ⇧G","Generate all"],
                ["⌘ R",  "Rebuild from data"],["⌘ S", "Save"],
                ["⌘ P",  "Print"],           ["⌘ ⇧C","Copy note"],
              ].filter(Boolean).map(([k,d])=>(
                <div key={k} className="cns2-sc-row">
                  <span className="cns2-sc-k">{k}</span>
                  <span className="cns2-sc-d">{d}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="cns2-area">
          {noteElements}

          <div style={{padding:"10px 14px",borderRadius:10,background:"rgba(8,22,40,.5)",
            border:"1px solid rgba(26,53,85,.3)",fontSize:10,fontFamily:"'DM Sans',sans-serif",
            color:"var(--t4)",display:"flex",alignItems:"flex-start",gap:10}}>
            <span style={{color:"var(--teal)",flexShrink:0}}>ⓘ</span>
            <span>
              <strong style={{color:"var(--t3)",fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:1}}>
                APSO FORMAT
              </strong>
              {" "}— Assessment and Plan appear first per Rosenbloom et al. (JAMIA 2010).
              Front-loading clinical synthesis reduces time-to-critical-information for consultants by 30–60%.
              Subjective and Objective sections remain as auditable supporting evidence.
            </span>
          </div>

          <div className="cns2-sig">
            <div className="cns2-sig-lbl">Electronic Signature</div>
            <div>Attending Physician: ___________________________  Date: ______________</div>
            <div style={{marginTop:6,fontSize:10,color:"var(--t4)"}}>
              I have personally seen and evaluated this patient and agree with the above documentation.
              Notrya is a clinical decision support tool — verify all clinical decisions independently.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}