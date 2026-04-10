import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

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
}
.cns2 * { box-sizing: border-box; }
.cns2 ::-webkit-scrollbar { width: 3px; height: 3px; }
.cns2 ::-webkit-scrollbar-thumb { background: var(--bhi); border-radius: 2px; }

.cns2 { position:fixed; inset:0; display:flex; flex-direction:column;
  background:var(--bg); font-family:'DM Sans',sans-serif; color:var(--t); }
.cns2.emb { position:relative; inset:auto; height:100%; }

/* ── Full standalone top bar ─────────────────────────────────── */
.cns2-top { height:54px; flex-shrink:0; background:var(--panel);
  border-bottom:1px solid var(--bd);
  display:flex; align-items:center; padding:0 16px; gap:10px; z-index:20;
  overflow-x:auto; overflow-y:hidden; }
.cns2-top::-webkit-scrollbar { height:2px; }
.cns2-badge { font-family:'JetBrains Mono',monospace; font-size:9px; letter-spacing:2px;
  background:rgba(0,229,192,.08); border:1px solid rgba(0,229,192,.3);
  color:var(--teal); border-radius:20px; padding:2px 10px; white-space:nowrap; flex-shrink:0; }
.cns2-ptname { font-family:'Playfair Display',serif; font-size:16px; font-weight:700;
  color:var(--t); white-space:nowrap; flex-shrink:0; }
.cns2-meta { font-size:11px; color:var(--t3); white-space:nowrap; flex-shrink:0; }
.cns2-cc { font-size:11px; color:var(--orange); font-weight:600; white-space:nowrap;
  font-family:'JetBrains Mono',monospace; flex-shrink:0; }
.cns2-esi { font-size:10px; font-family:'JetBrains Mono',monospace; font-weight:700;
  padding:2px 9px; border-radius:4px; flex-shrink:0;
  background:rgba(255,107,107,.1); color:var(--coral); border:1px solid rgba(255,107,107,.3); }
.cns2-timer { font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:700;
  padding:3px 10px; border-radius:6px; flex-shrink:0; letter-spacing:1px;
  background:rgba(245,200,66,.08); color:var(--gold); border:1px solid rgba(245,200,66,.25); }
.cns2-timer.over { background:rgba(255,107,107,.1); color:var(--coral); border-color:rgba(255,107,107,.3); }
.cns2-acts { margin-left:auto; display:flex; gap:5px; align-items:center; flex-shrink:0; }
.cns2-prog-wrap { display:flex; align-items:center; gap:6px; flex-shrink:0; }
.cns2-prog-bar { width:72px; height:5px; background:var(--up); border-radius:3px; overflow:hidden; flex-shrink:0; }
.cns2-prog-bar-fill { height:100%; background:linear-gradient(90deg,var(--teal),var(--blue));
  border-radius:3px; transition:width .4s ease; }
.cns2-prog-count { font-family:'JetBrains Mono',monospace; font-size:9px; color:var(--t4); white-space:nowrap; }

/* ── Slim embedded top bar ───────────────────────────────────── */
.cns2-emb-top { height:44px; flex-shrink:0;
  background:rgba(8,22,40,.95); border-bottom:1px solid var(--bd);
  border-top:2px solid rgba(0,229,192,.2);
  display:flex; align-items:center; padding:0 14px; gap:8px; z-index:20; }
.cns2-emb-prog-wrap { flex:1; display:flex; align-items:center; gap:7px; min-width:0; }
.cns2-emb-prog-bar { flex:1; height:4px; background:var(--up); border-radius:2px; overflow:hidden; }
.cns2-emb-prog-fill { height:100%; background:linear-gradient(90deg,var(--teal),var(--blue));
  border-radius:2px; transition:width .4s ease; }

/* ── Shared button styles ────────────────────────────────────── */
.cns2 .btn { padding:5px 12px; border-radius:7px; font-size:11px; font-weight:600; cursor:pointer;
  display:inline-flex; align-items:center; gap:5px; font-family:'DM Sans',sans-serif;
  transition:all .15s; white-space:nowrap; border:none; }
.cns2 .btn:disabled { opacity:.4; cursor:not-allowed; }
.cns2 .btn-ghost { background:var(--up); border:1px solid var(--bd) !important; color:var(--t2); }
.cns2 .btn-ghost:hover { border-color:var(--bhi) !important; color:var(--t); }
.cns2 .btn-teal { background:var(--teal); color:var(--bg); }
.cns2 .btn-teal:hover { filter:brightness(1.1); }
.cns2 .btn-gold { background:rgba(245,200,66,.1); color:var(--gold); border:1px solid rgba(245,200,66,.3) !important; }
.cns2 .btn-gold:hover { background:rgba(245,200,66,.2); }
.cns2 .btn-sm { padding:4px 9px; font-size:10px; }

/* ── Body layout ─────────────────────────────────────────────── */
.cns2-body { flex:1; display:flex; min-height:0; }

/* ── Left sidebar ────────────────────────────────────────────── */
.cns2-sb { width:210px; flex-shrink:0; background:var(--panel);
  border-right:1px solid var(--bd); display:flex; flex-direction:column; }
.cns2-sb-head { padding:14px 14px 10px; flex-shrink:0; border-bottom:1px solid rgba(26,53,85,.5); }
.cns2-sb-label { font-family:'JetBrains Mono',monospace; font-size:8px; color:var(--t4);
  letter-spacing:2px; text-transform:uppercase; margin-bottom:8px; }
.cns2-sb-bar { height:3px; background:var(--up); border-radius:2px; overflow:hidden; margin-bottom:5px; }
.cns2-sb-fill { height:100%; background:linear-gradient(90deg,var(--teal),var(--blue));
  border-radius:2px; transition:width .5s ease; }
.cns2-sb-sub { font-family:'JetBrains Mono',monospace; font-size:9px; color:var(--t3); }
.cns2-sb-list { padding:6px; flex:1; display:flex; flex-direction:column; gap:1px; overflow-y:auto; }
.cns2-sb-item { display:flex; align-items:center; gap:7px; padding:6px 8px; border-radius:8px;
  cursor:pointer; transition:all .15s; border:1px solid transparent; }
.cns2-sb-item:hover { background:rgba(59,158,255,.06); border-color:rgba(59,158,255,.2); }
.cns2-sb-item.on { background:rgba(59,158,255,.1); border-color:rgba(59,158,255,.35); }
.cns2-sb-ico { font-size:13px; flex-shrink:0; }
.cns2-sb-txt { flex:1; min-width:0; }
.cns2-sb-name { font-size:11px; font-weight:500; color:var(--t2);
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.cns2-sb-item.on .cns2-sb-name { color:var(--t); font-weight:600; }
.cns2-sb-key { font-family:'JetBrains Mono',monospace; font-size:8px; color:var(--t4);
  background:var(--up); border:1px solid var(--bd); border-radius:3px; padding:1px 4px; flex-shrink:0; }
.cns2-sb-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; transition:all .3s; }
.cns2-sb-dot.empty    { background:var(--t4); opacity:.35; }
.cns2-sb-dot.draft    { background:var(--orange); box-shadow:0 0 5px rgba(255,159,67,.5); }
.cns2-sb-dot.complete { background:var(--teal);   box-shadow:0 0 5px rgba(0,229,192,.5); }
.cns2-sb-dot.locked   { background:var(--blue);   box-shadow:0 0 5px rgba(59,158,255,.5); }

/* Collapsible shortcut legend */
.cns2-sc-toggle { width:100%; padding:8px 14px; background:none; border:none;
  border-top:1px solid rgba(26,53,85,.4); cursor:pointer;
  display:flex; align-items:center; justify-content:space-between;
  font-family:'JetBrains Mono',monospace; font-size:9px; color:var(--t4);
  text-align:left; transition:color .15s; flex-shrink:0; }
.cns2-sc-toggle:hover { color:var(--t3); }
.cns2-sc-toggle-chev { font-size:9px; transition:transform .2s; }
.cns2-sc-toggle-chev.open { transform:rotate(90deg); }
.cns2-sb-legend { padding:8px 14px 12px; border-top:none; flex-shrink:0; }
.cns2-sc-row { display:flex; align-items:center; gap:6px; margin-bottom:4px; }
.cns2-sc-k { font-family:'JetBrains Mono',monospace; font-size:8px; color:var(--t2);
  background:var(--up); border:1px solid var(--bd); border-radius:3px; padding:1px 5px; flex-shrink:0; }
.cns2-sc-d { font-size:10px; color:var(--t4); }

/* ── Main note area ───────────────────────────────────────────── */
.cns2-area { flex:1; overflow-y:auto; padding:14px 18px 40px; display:flex; flex-direction:column; gap:8px; }

.cns2-sec { background:rgba(8,22,40,.82); border:1px solid rgba(26,53,85,.5);
  border-radius:12px; transition:border-color .2s, box-shadow .2s; }
.cns2-sec:focus-within { border-color:var(--bhi); }
.cns2-sec.focused { border-color:rgba(59,158,255,.45);
  box-shadow:0 0 0 1px rgba(59,158,255,.12), 0 4px 20px rgba(0,0,0,.3); }
.cns2-sec-hdr { display:flex; align-items:center; gap:9px; padding:10px 14px;
  background:rgba(11,30,54,.6); border-bottom:1px solid rgba(26,53,85,.4);
  cursor:pointer; user-select:none; transition:background .15s; }
.cns2-sec.collapsed .cns2-sec-hdr { border-bottom:none; }
.cns2-sec-hdr:hover { background:rgba(14,37,68,.7); }
.cns2-sec-num { font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:700;
  color:var(--t4); flex-shrink:0; width:16px; text-align:center; }
.cns2-sec-icon { font-size:15px; flex-shrink:0; }
.cns2-sec-info { flex:1; min-width:0; }
.cns2-sec-title { font-size:13px; font-weight:600; color:var(--t); letter-spacing:.01em; }
.cns2-sec-preview { font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--t4);
  margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:360px; }
.cns2-sec-short { font-family:'JetBrains Mono',monospace; font-size:8px;
  color:var(--t4); background:var(--up); border:1px solid var(--bd);
  border-radius:3px; padding:1px 5px; flex-shrink:0; }
.cns2-sec-acts { display:flex; gap:4px; align-items:center; }
.cns2-status { font-family:'JetBrains Mono',monospace; font-size:8px; font-weight:700;
  padding:2px 8px; border-radius:20px; white-space:nowrap; }
.st-empty    { background:rgba(90,130,168,.1);  color:var(--t4);     border:1px solid rgba(90,130,168,.2); }
.st-draft    { background:rgba(255,159,67,.1);  color:var(--orange); border:1px solid rgba(255,159,67,.3); }
.st-complete { background:rgba(0,229,192,.1);   color:var(--teal);   border:1px solid rgba(0,229,192,.3); }
.st-locked   { background:rgba(59,158,255,.1);  color:var(--blue);   border:1px solid rgba(59,158,255,.3); }
.cns2 .ibtn { width:26px; height:26px; border-radius:6px; border:1px solid var(--bd);
  background:var(--up); color:var(--t3); font-size:12px; cursor:pointer;
  display:flex; align-items:center; justify-content:center; transition:all .15s; flex-shrink:0; }
.cns2 .ibtn:hover { border-color:var(--bhi); color:var(--t2); }
.cns2 .ibtn:disabled { opacity:.35; cursor:not-allowed; }
.cns2 .ibtn.spin { animation:cns2-spin .8s linear infinite; }
@keyframes cns2-spin { to { transform:rotate(360deg); } }
.cns2-chevron { font-size:11px; color:var(--t4); transition:transform .2s; flex-shrink:0; }
.cns2-sec.collapsed .cns2-chevron { transform:rotate(-90deg); }

/* ── Builder disclosure toggle ───────────────────────────────── */
.cns2-builder-toggle {
  display:flex; align-items:center; gap:8px; padding:9px 14px;
  cursor:pointer; font-size:12px; font-weight:600; color:var(--t3);
  border-bottom:1px solid rgba(26,53,85,.25); transition:color .15s;
  user-select:none; font-family:'DM Sans',sans-serif; }
.cns2-builder-toggle:hover { color:var(--t2); }
.cns2-builder-icon { font-size:13px; }
.cns2-toggle-chev { font-size:10px; color:var(--t4); transition:transform .2s; margin-left:auto; }
.cns2-toggle-chev.open { transform:rotate(90deg); }

/* ── Macro bar ───────────────────────────────────────────────── */
.cns2-macro-bar { display:flex; gap:5px; flex-wrap:wrap; padding:7px 14px 6px;
  border-bottom:1px solid rgba(26,53,85,.25); width:100%; }
.macro-pill { font-family:'JetBrains Mono',monospace; font-size:9px; font-weight:500;
  padding:3px 9px; border-radius:20px; cursor:pointer; white-space:nowrap;
  background:rgba(59,158,255,.06); border:1px solid rgba(59,158,255,.2);
  color:var(--t3); transition:all .12s; }
.macro-pill:hover { background:rgba(59,158,255,.14); color:var(--t2); border-color:rgba(59,158,255,.4); }
.macro-pill.teal { background:rgba(0,229,192,.06); border-color:rgba(0,229,192,.2); color:var(--teal); }
.macro-pill.teal:hover { background:rgba(0,229,192,.14); }

/* ── Textarea ─────────────────────────────────────────────────── */
.cns2-sec-body { padding:2px 0 0; }
.cns2-ta { width:100%; padding:12px 14px; background:rgba(14,37,68,.4); border:none;
  border-top:1px solid rgba(26,53,85,.5);
  color:var(--t); font-family:'JetBrains Mono',monospace; font-size:12px;
  line-height:1.8; resize:vertical; outline:none; min-height:100px; display:block; box-sizing:border-box;
  transition:background .15s; }
.cns2-ta:focus { background:rgba(14,37,68,.65); border-top-color:rgba(59,158,255,.3); }
.cns2-ta:hover:not(:disabled) { background:rgba(14,37,68,.55); }
.cns2-ta::placeholder { color:var(--t4); font-style:italic; font-size:11px; }
.cns2-ta:disabled { opacity:.45; cursor:default; }
.cns2-ta.locked { background:rgba(59,158,255,.03); color:var(--t2); }
.cns2-sec-foot { display:flex; align-items:center; padding:4px 14px 8px; gap:10px; }
.cns2-chars { font-family:'JetBrains Mono',monospace; font-size:9px; color:var(--t4); }
.cns2-done-link { margin-left:auto; font-size:9px; font-weight:600; cursor:pointer;
  color:var(--teal); font-family:'JetBrains Mono',monospace; letter-spacing:.5px;
  text-transform:uppercase; transition:opacity .15s; }
.cns2-done-link:hover { opacity:.7; }

/* ── MDM Builder ─────────────────────────────────────────────── */
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
.risk-btn.low  { background:rgba(61,255,160,.08); color:var(--green); border-color:rgba(61,255,160,.2); }
.risk-btn.low.sel  { background:rgba(61,255,160,.18); border-color:var(--green); box-shadow:0 0 10px rgba(61,255,160,.2); }
.risk-btn.mod  { background:rgba(245,200,66,.08); color:var(--gold); border-color:rgba(245,200,66,.2); }
.risk-btn.mod.sel  { background:rgba(245,200,66,.18); border-color:var(--gold); box-shadow:0 0 10px rgba(245,200,66,.2); }
.risk-btn.high { background:rgba(255,68,68,.08); color:var(--red); border-color:rgba(255,68,68,.2); }
.risk-btn.high.sel { background:rgba(255,68,68,.18); border-color:var(--red); box-shadow:0 0 10px rgba(255,68,68,.2); }
.mdm-data-grid { display:flex; gap:6px; flex-wrap:wrap; }
.data-chip { font-size:10px; font-family:'DM Sans',sans-serif; padding:4px 10px; border-radius:6px;
  cursor:pointer; border:1px solid rgba(59,158,255,.2); background:rgba(59,158,255,.05);
  color:var(--t3); transition:all .12px; user-select:none; }
.data-chip.sel { background:rgba(59,158,255,.15); border-color:var(--blue); color:var(--t2); }
.mdm-plan-list { display:flex; flex-direction:column; gap:4px; }
.mdm-plan-row { display:flex; align-items:center; gap:7px; }
.mdm-plan-num { font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--t4); flex-shrink:0; width:16px; }
.mdm-plan-inp { flex:1; background:var(--up); border:1px solid var(--bd); border-radius:6px;
  padding:6px 10px; font-family:'JetBrains Mono',monospace; font-size:11px;
  color:var(--t); outline:none; transition:border-color .15s; }
.mdm-plan-inp:focus { border-color:var(--bhi); }
.mdm-plan-inp::placeholder { color:var(--t4); font-style:italic; }
.mdm-add-btn { font-size:10px; color:var(--teal); background:none; border:none;
  cursor:pointer; font-family:'JetBrains Mono',monospace; padding:2px 0; text-align:left; }
.mdm-build-btn, .dispo-build-btn { align-self:flex-end; background:var(--teal); color:var(--bg);
  border:none; border-radius:7px; padding:7px 16px; font-size:11px; font-weight:700;
  cursor:pointer; font-family:'DM Sans',sans-serif; transition:filter .15s; }
.mdm-build-btn:hover, .dispo-build-btn:hover { filter:brightness(1.1); }

/* ── Dispo Builder ───────────────────────────────────────────── */
.dispo-builder { padding:12px 14px 10px; display:flex; flex-direction:column; gap:10px; }
.dispo-big-row { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
.dispo-big { padding:12px 8px; border-radius:9px; cursor:pointer; text-align:center;
  font-size:12px; font-weight:600; font-family:'DM Sans',sans-serif;
  transition:all .15s; border:2px solid transparent; }
.dispo-big.discharge { background:rgba(0,229,192,.08); color:var(--teal); border-color:rgba(0,229,192,.2); }
.dispo-big.discharge.sel { background:rgba(0,229,192,.18); border-color:var(--teal); box-shadow:0 0 12px rgba(0,229,192,.2); }
.dispo-big.admit { background:rgba(255,107,107,.08); color:var(--coral); border-color:rgba(255,107,107,.2); }
.dispo-big.admit.sel { background:rgba(255,107,107,.18); border-color:var(--coral); box-shadow:0 0 12px rgba(255,107,107,.2); }
.dispo-big.obs { background:rgba(245,200,66,.08); color:var(--gold); border-color:rgba(245,200,66,.2); }
.dispo-big.obs.sel { background:rgba(245,200,66,.18); border-color:var(--gold); box-shadow:0 0 12px rgba(245,200,66,.2); }
.dispo-big.transfer { background:rgba(155,109,255,.08); color:var(--purple); border-color:rgba(155,109,255,.2); }
.dispo-big.transfer.sel { background:rgba(155,109,255,.18); border-color:var(--purple); box-shadow:0 0 12px rgba(155,109,255,.2); }
.dispo-big-icon { font-size:18px; margin-bottom:4px; }
.dispo-fields { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.dispo-field { display:flex; flex-direction:column; gap:3px; }
.dispo-precautions { display:flex; gap:5px; flex-wrap:wrap; }
.precaution { font-size:10px; font-family:'DM Sans',sans-serif; padding:4px 9px; border-radius:6px;
  cursor:pointer; user-select:none; transition:all .12s;
  background:rgba(255,159,67,.05); border:1px solid rgba(255,159,67,.2); color:var(--t3); }
.precaution.sel { background:rgba(255,159,67,.15); border-color:var(--orange); color:var(--t2); }

/* ── Signature block ─────────────────────────────────────────── */
.cns2-sig { background:rgba(8,22,40,.6); border:1px solid rgba(26,53,85,.4);
  border-radius:12px; padding:14px 16px; font-family:'JetBrains Mono',monospace;
  font-size:11px; color:var(--t3); }
.cns2-sig-lbl { font-size:8px; letter-spacing:2px; text-transform:uppercase; color:var(--t4); margin-bottom:7px; }

/* ── Loading bar ─────────────────────────────────────────────── */
.cns2-load { height:2px; flex-shrink:0;
  background:linear-gradient(90deg,var(--teal),var(--blue),var(--teal));
  background-size:200% auto; animation:cns2-sweep 1.4s linear infinite; }
@keyframes cns2-sweep { to { background-position:200% center; } }

/* ── Print ───────────────────────────────────────────────────── */
@media print {
  .cns2-sb, .cns2-acts, .cns2-sec-acts, .cns2-sec-foot,
  .cns2-macro-bar, .cns2-builder-toggle, .mdm-builder, .dispo-builder,
  .btn, .ibtn, .cns2-emb-top { display:none !important; }
  .cns2 { position:static; background:white; color:black; }
  .cns2-top { background:white; border-bottom:1px solid #ccc; }
  .cns2-sec { background:white; border:1px solid #ddd; page-break-inside:avoid; }
  .cns2-ta { color:black; font-size:11px; }
}`;
  document.head.appendChild(s);
})();

// ─── TAB MAP ──────────────────────────────────────────────────────────────────
const TAB_MAP = {
  header: "demo",
  cc:     "cc",
  hpi:    "cc",
  pmh:    "meds",
  ros:    "ros",
  vitals: "vit",
  pe:     "pe",
  mdm:    null,
  dispo:  "discharge",
};

// ─── SECTIONS ─────────────────────────────────────────────────────────────────
const SECTIONS = [
  { id:"header", title:"Patient Header",             icon:"👤", key:"1" },
  { id:"cc",     title:"Chief Complaint",             icon:"💬", key:"2" },
  { id:"hpi",    title:"History of Present Illness",  icon:"📝", key:"3" },
  { id:"pmh",    title:"PMH / Meds / Allergies",      icon:"💊", key:"4" },
  { id:"ros",    title:"Review of Systems",            icon:"🔍", key:"5" },
  { id:"vitals", title:"Vital Signs",                  icon:"📈", key:"6" },
  { id:"pe",     title:"Physical Examination",         icon:"🩺", key:"7" },
  { id:"mdm",    title:"Assessment & Plan",            icon:"⚖️", key:"8" },
  { id:"dispo",  title:"Disposition",                  icon:"🚪", key:"9" },
];

// ─── MACROS ───────────────────────────────────────────────────────────────────
const MACROS = {
  ros: [
    { label:"All sys neg",   cls:"teal", text:"REVIEW OF SYSTEMS:\nAll systems reviewed and negative except as noted in HPI." },
    { label:"Pertinent neg", cls:"",     text:"Pertinent negatives: denies fever, chills, nausea, vomiting, diarrhea, headache, vision changes, chest pain, shortness of breath, palpitations, dysuria, rash." },
    { label:"Neg CV/Resp",   cls:"",     text:"  (−) Palpitations  (−) Orthopnea  (−) PND  (−) Leg swelling\n  (−) Cough  (−) Hemoptysis  (−) Wheezing" },
    { label:"Neg GI/GU",     cls:"",     text:"  (−) Nausea  (−) Vomiting  (−) Diarrhea  (−) Constipation  (−) Melena\n  (−) Hematochezia  (−) Dysuria  (−) Hematuria  (−) Frequency" },
    { label:"Neg Neuro",     cls:"",     text:"  (−) Headache  (−) Vision changes  (−) Weakness  (−) Numbness  (−) Tingling  (−) Syncope" },
  ],
  pe: [
    { label:"Normal adult exam", cls:"teal", text:"PHYSICAL EXAMINATION:\n  Gen:    Alert, oriented x3, well-appearing, no acute distress\n  HEENT:  Normocephalic/atraumatic. PERRL. EOMI. Oropharynx clear.\n  Neck:   Supple. No lymphadenopathy. No JVD. No meningismus.\n  CV:     Regular rate and rhythm. S1/S2 normal. No murmurs/rubs/gallops.\n  Lungs:  Clear to auscultation bilaterally. No wheezes/rales/rhonchi.\n  Abd:    Soft, non-tender, non-distended. Normoactive bowel sounds. No guarding or rigidity.\n  Ext:    No cyanosis, clubbing, or edema. Pulses 2+ bilaterally.\n  Neuro:  Alert and oriented x3. CN II-XII grossly intact. No focal neurological deficits." },
    { label:"Gen: WNL",    cls:"", text:"  Gen:    Alert, oriented x3, well-appearing, no acute distress" },
    { label:"CV: WNL",     cls:"", text:"  CV:     Regular rate and rhythm. S1/S2 normal. No murmurs/rubs/gallops." },
    { label:"Lungs: WNL",  cls:"", text:"  Lungs:  Clear to auscultation bilaterally. No wheezes/rales/rhonchi." },
    { label:"Abd: WNL",    cls:"", text:"  Abd:    Soft, non-tender, non-distended. Normoactive bowel sounds. No guarding or rigidity." },
    { label:"Neuro: WNL",  cls:"", text:"  Neuro:  Alert and oriented x3. No focal neurological deficits." },
  ],
};

const DATA_OPTS       = ["Labs ordered","Imaging ordered","ECG","External records reviewed","Specialist consulted","New Rx / Rx changed"];
const PRECAUTIONS     = ["Worsening symptoms","Fever >101°F","Chest pain","Difficulty breathing","New or worsening pain","Unable to tolerate PO","Falls or altered mental status"];
const TIMER_WARN_SECS = 1200; // 20 minutes before timer turns red

// ─── ASSEMBLE SECTION ─────────────────────────────────────────────────────────
function assembleSection(id, d = {}) {
  const {
    demo = {}, cc = {}, vitals = {}, medications = [], allergies = [],
    pmhSelected = {}, pmhExtra = "", surgHx = "", famHx = "", socHx = "",
    rosState = {}, rosNotes = {}, rosSymptoms = {},
    peState = {}, peFindings = {},
    esiLevel = "", registration = {},
  } = d;
  const dateStr = new Date().toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
  const timeStr = new Date().toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" });
  const name = [demo.firstName, demo.lastName].filter(Boolean).join(" ") || "Unknown Patient";
  const ln = "─".repeat(58);

  switch (id) {
    case "header":
      return [
        "EMERGENCY DEPARTMENT NOTE", ln,
        `Patient:    ${name}`,
        (demo.age || demo.sex) && `Age / Sex:  ${[demo.age ? demo.age + "y" : "", demo.sex].filter(Boolean).join(" · ")}`,
        demo.dob && `DOB:        ${demo.dob}`,
        (registration.mrn || demo.mrn) && `MRN:        ${registration.mrn || demo.mrn}`,
        registration.room && `Room:       ${registration.room}`,
        esiLevel && `ESI Level:  ${esiLevel}`,
        `Date / Time: ${dateStr}  ${timeStr}`,
        allergies.length && `${ln}\nALLERGIES:  ⚠  ${allergies.join(" · ")}`,
      ].filter(Boolean).join("\n");
    case "cc":
      return cc.text ? `Chief Complaint:\n${cc.text}` : "";
    case "hpi":
      if (cc.hpi) return cc.hpi;
      if (!cc.text) return "";
      return [
        `Patient presents with ${cc.text}.`,
        cc.onset     && `Onset ${cc.onset}.`,
        cc.duration  && `Duration ${cc.duration}.`,
        cc.quality   && `Quality described as ${cc.quality}.`,
        cc.severity  && `Severity rated ${cc.severity}/10.`,
        cc.radiation && `Radiation to ${cc.radiation}.`,
        cc.aggravate && `Aggravated by ${cc.aggravate}.`,
        cc.relieve   && `Relieved by ${cc.relieve}.`,
        cc.assoc     && `Associated symptoms: ${cc.assoc}.`,
      ].filter(Boolean).join(" ");
    case "pmh": {
      const pmhList = Object.entries(pmhSelected).filter(([, v]) => v).map(([k]) => k);
      const pmhStr = pmhList.length
        ? pmhList.join(", ") + (pmhExtra ? ", " + pmhExtra : "")
        : pmhExtra || "None documented.";
      return [
        "PAST MEDICAL HISTORY:", pmhStr,
        surgHx && `\nSURGICAL HISTORY:\n${surgHx}`,
        famHx  && `\nFAMILY HISTORY:\n${famHx}`,
        socHx  && `\nSOCIAL HISTORY:\n${socHx}`,
        `\nMEDICATIONS:\n${medications.length ? medications.join("\n") : "None documented."}`,
        `\nALLERGIES:\n${allergies.length ? allergies.join(", ") : "NKDA"}`,
      ].filter(Boolean).join("\n");
    }
    case "ros": {
      const firstVal = rosState ? Object.values(rosState)[0] : null;
      const isNested = firstVal && typeof firstVal === "object" && !Array.isArray(firstVal) &&
        Object.values(firstVal)[0]?.status !== undefined;

      if (isNested) {
        const ORDER = ["constitutional","eyes","ent","cardiovascular","respiratory","gi","gu","msk","skin","neuro","psych","endo","heme","allergic"];
        const negSystems = [], posSystems = [];
        ORDER.forEach(sysId => {
          const syms = rosState[sysId];
          if (!syms) return;
          const vals = Object.values(syms);
          if (!vals.some(s => s.status !== "unreviewed")) return;
          const posItems = Object.entries(syms)
            .filter(([, v]) => v.status === "pos")
            .map(([sym, v]) => sym.toLowerCase() + (v.detail ? ` (${v.detail})` : ""));
          const negItems = Object.entries(syms)
            .filter(([, v]) => v.status === "neg")
            .map(([sym]) => sym.toLowerCase());
          const sysName = sysId.charAt(0).toUpperCase() + sysId.slice(1);
          if (posItems.length) posSystems.push({ name: sysName, posItems, negItems });
          else if (negItems.length) negSystems.push(sysName);
        });
        if (!negSystems.length && !posSystems.length) return "";
        const lines = ["REVIEW OF SYSTEMS:"];
        if (negSystems.length) lines.push(`\nNegative: ${negSystems.join(", ")}.`);
        posSystems.forEach(ps => {
          lines.push(`\n${ps.name}: Positive for ${ps.posItems.join(", ")}.` +
            (ps.negItems.length ? ` Denies ${ps.negItems.join(", ")}.` : ""));
        });
        return lines.join("");
      }

      // Legacy flat format
      const sk = Object.keys(rosState), sym = Object.keys(rosSymptoms);
      if (!sk.length && !sym.length) return "";
      const pos    = sk.filter(s => rosState[s] === "positive" || rosState[s] === true);
      const neg    = sk.filter(s => rosState[s] === "negative" || rosState[s] === false);
      const symPos = sym.filter(s => rosSymptoms[s] === true);
      const allPos = [...new Set([...pos, ...symPos])];
      if (!allPos.length && !neg.length) return "";
      return ["REVIEW OF SYSTEMS:",
        allPos.length && "\nPOSITIVE:",
        ...allPos.map(s => `  (+) ${s}${rosNotes?.[s] ? " — " + rosNotes[s] : ""}`),
        neg.length    && "\nNEGATIVE (pertinent):",
        ...neg.map(s => `  (−) ${s}`),
      ].filter(Boolean).join("\n");
    }
    case "vitals": {
      const entries = [
        ["BP",    vitals.bp],
        ["HR",    vitals.hr],
        ["RR",    vitals.rr],
        ["SpO₂",  vitals.spo2],
        ["Temp",  vitals.temp],
        ["GCS",   vitals.gcs],
        ["Wt",    vitals.weight ? vitals.weight + " kg" : null],
        ["O₂ del",vitals.o2del || null],
        ["Pain",  vitals.pain  ? vitals.pain + "/10"  : null],
      ].filter(([, v]) => v);
      if (!entries.length) return "";
      return "VITAL SIGNS:\n" + entries.map(([k, v]) => `  ${k.padEnd(8)}: ${v}`).join("\n");
    }
    case "pe": {
      const sys = Object.keys(peState);
      if (!sys.length) return "";
      return ["PHYSICAL EXAMINATION:",
        ...sys.map(s => { const f = peFindings?.[s] || peState[s]; return f ? `  ${s}: ${f}` : null; }).filter(Boolean),
      ].join("\n");
    }
    case "mdm":
    case "dispo":
      return "";
    default:
      return "";
  }
}

function buildInitialSections(patientData) {
  const m = {};
  SECTIONS.forEach(s => {
    const auto = assembleSection(s.id, patientData);
    m[s.id] = { content: auto, status: auto ? "draft" : "empty", locked: false, collapsed: false };
  });
  return m;
}

// ─── MDM BUILDER ──────────────────────────────────────────────────────────────
function MDMBuilder({ dx, setDx, risk, setRisk, data, setData, plan, setPlan, onApply }) {
  const toggleData = useCallback(
    item => setData(d => d.includes(item) ? d.filter(x => x !== item) : [...d, item]),
    [setData]
  );

  const build = useCallback(() => {
    const dxList   = dx.filter(Boolean);
    const planList = plan.filter(Boolean);
    if (!dxList.length && !risk && !data.length && !planList.length) {
      toast.error("Fill in at least one field before applying.");
      return;
    }
    const lines = ["MEDICAL DECISION MAKING:", ""];
    if (dxList.length) {
      lines.push("Impression:");
      dxList.forEach((d, i) => lines.push(`  ${i + 1}. ${d}`));
      lines.push("");
    }
    if (risk) { lines.push(`Risk Stratification: ${risk.toUpperCase()}`); lines.push(""); }
    if (data.length) {
      lines.push("Data reviewed / ordered:");
      data.forEach(d => lines.push(`  · ${d}`));
      lines.push("");
    }
    if (planList.length) {
      lines.push("Plan:");
      planList.forEach((p, i) => lines.push(`  ${i + 1}. ${p}`));
    }
    onApply(lines.join("\n"));
  }, [dx, risk, data, plan, onApply]);

  return (
    <div className="mdm-builder">
      <div className="mdm-row">
        <div className="mdm-lbl">Impression / Diagnosis</div>
        {dx.map((v, i) => (
          <input key={i} className="mdm-inp" value={v}
            placeholder={`Diagnosis ${i + 1}...`}
            onChange={e => { const n = [...dx]; n[i] = e.target.value; setDx(n); }} />
        ))}
      </div>
      <div className="mdm-row">
        <div className="mdm-lbl">Risk Stratification</div>
        <div className="risk-row">
          {[["low","Low"],["mod","Moderate"],["high","High"]].map(([v, label]) => (
            <button key={v} className={`risk-btn ${v}${risk === v ? " sel" : ""}`}
              onClick={() => setRisk(r => r === v ? "" : v)}>{label}</button>
          ))}
        </div>
      </div>
      <div className="mdm-row">
        <div className="mdm-lbl">Data / Complexity</div>
        <div className="mdm-data-grid">
          {DATA_OPTS.map(opt => (
            <div key={opt} className={`data-chip${data.includes(opt) ? " sel" : ""}`}
              onClick={() => toggleData(opt)}>{opt}</div>
          ))}
        </div>
      </div>
      <div className="mdm-row">
        <div className="mdm-lbl">Plan</div>
        <div className="mdm-plan-list">
          {plan.map((v, i) => (
            <div key={i} className="mdm-plan-row">
              <span className="mdm-plan-num">{i + 1}.</span>
              <input className="mdm-plan-inp" value={v}
                placeholder={`Plan item ${i + 1}...`}
                onChange={e => { const n = [...plan]; n[i] = e.target.value; setPlan(n); }} />
            </div>
          ))}
          {plan.length < 6 && (
            <button className="mdm-add-btn" onClick={() => setPlan(p => [...p, ""])}>+ add item</button>
          )}
        </div>
      </div>
      <button className="mdm-build-btn" onClick={build}>Apply to Note →</button>
    </div>
  );
}

// ─── DISPO BUILDER ────────────────────────────────────────────────────────────
function DispoBuilder({ mode, setMode, service, setService, followup, setFollowup, fwTime, setFwTime, prec, setPrec, onApply }) {
  const togglePrec = useCallback(
    item => setPrec(d => d.includes(item) ? d.filter(x => x !== item) : [...d, item]),
    [setPrec]
  );

  const build = useCallback(() => {
    if (!mode) { toast.error("Select a disposition first."); return; }
    const lines = ["DISPOSITION:", ""];
    if (mode === "discharge")     lines.push("Patient discharged home in stable condition.");
    else if (mode === "admit")    lines.push(`Admitted to hospital${service ? ". Service: " + service : "."}`);
    else if (mode === "obs")      lines.push("Patient placed in observation status for further monitoring and evaluation.");
    else if (mode === "transfer") lines.push(`Patient transferred to ${service || "receiving facility"} for higher level of care.`);
    lines.push("");
    if (mode === "discharge") {
      lines.push("Discharge instructions provided: Yes");
      if (prec.length) { lines.push("Return precautions discussed:"); prec.forEach(p => lines.push(`  · ${p}`)); }
    }
    if (followup) lines.push(`\nFollow-up: ${followup}${fwTime ? " in " + fwTime : ""}`);
    lines.push("\nAttending Physician: ___________   Time: ___________");
    onApply(lines.join("\n"));
  }, [mode, service, prec, followup, fwTime, onApply]);

  return (
    <div className="dispo-builder">
      <div className="mdm-row">
        <div className="mdm-lbl">Disposition</div>
        <div className="dispo-big-row">
          {[
            { v:"discharge", label:"Discharge Home", icon:"🏠", cls:"discharge" },
            { v:"admit",     label:"Admit",           icon:"🏥", cls:"admit"     },
            { v:"obs",       label:"Observation",     icon:"⏱",  cls:"obs"       },
            { v:"transfer",  label:"Transfer",        icon:"🚑", cls:"transfer"  },
          ].map(({ v, label, icon, cls }) => (
            <div key={v} className={`dispo-big ${cls}${mode === v ? " sel" : ""}`}
              onClick={() => setMode(m => m === v ? "" : v)}>
              <div className="dispo-big-icon">{icon}</div>
              {label}
            </div>
          ))}
        </div>
      </div>
      {(mode === "admit" || mode === "transfer") && (
        <div className="dispo-fields">
          <div className="dispo-field">
            <div className="mdm-lbl">{mode === "admit" ? "Admitting Service" : "Receiving Facility"}</div>
            <input className="mdm-inp" value={service}
              placeholder={mode === "admit" ? "e.g. Internal Medicine..." : "e.g. UCSF Medical Center..."}
              onChange={e => setService(e.target.value)} />
          </div>
        </div>
      )}
      {mode === "discharge" && (
        <div className="mdm-row">
          <div className="mdm-lbl">Return Precautions</div>
          <div className="dispo-precautions">
            {PRECAUTIONS.map(p => (
              <div key={p} className={`precaution${prec.includes(p) ? " sel" : ""}`}
                onClick={() => togglePrec(p)}>{p}</div>
            ))}
          </div>
        </div>
      )}
      <div className="dispo-fields">
        <div className="dispo-field">
          <div className="mdm-lbl">Follow-up with</div>
          <input className="mdm-inp" value={followup} placeholder="e.g. PCP, Cardiologist..."
            onChange={e => setFollowup(e.target.value)} />
        </div>
        <div className="dispo-field">
          <div className="mdm-lbl">Timeframe</div>
          <input className="mdm-inp" value={fwTime} placeholder="e.g. 5–7 days..."
            onChange={e => setFwTime(e.target.value)} />
        </div>
      </div>
      <button className="dispo-build-btn" onClick={build}>Apply to Note →</button>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ClinicalNoteStudio({
  patientData: propData,
  embedded   = false,
  onBack,
  onSave:     onExternalSave,   // optional: called after a successful internal save
}) {
  const navigate       = useNavigate();
  const location       = useLocation();
  const [searchParams] = useSearchParams();
  const urlNoteId      = searchParams.get("noteId");

  // Accept patientData as a single prop object (the correct pattern),
  // falling back to location.state for standalone/deep-link use.
  const patientData = useMemo(
    () => propData || location.state?.patientData || {},
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [propData, location.key]
  );

  const { demo = {}, cc = {}, medications = [], allergies = [], registration = {}, esiLevel = "" } = patientData;
  const patientName = [demo.firstName, demo.lastName].filter(Boolean).join(" ") || "New Patient";

  // ── Core state ──────────────────────────────────────────────────────────────
  const [sections,  setSections]  = useState(() => buildInitialSections(patientData));
  const [focused,   setFocused]   = useState("header");
  const [loading,   setLoading]   = useState({});
  const [anyBusy,   setAnyBusy]   = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [startTime] = useState(() => Date.now());
  const [elapsed,   setElapsed]   = useState(0);
  const [scOpen,    setScOpen]    = useState(false);   // shortcut legend toggle

  // ── Builder state (MDM & Dispo) ─────────────────────────────────────────────
  const [mdmBuilderOpen,   setMdmBuilderOpen]   = useState(false);
  const [dispoBuilderOpen, setDispoBuilderOpen] = useState(false);
  const [mdmDx,            setMdmDx]            = useState(["", "", ""]);
  const [mdmRisk,          setMdmRisk]          = useState("");
  const [mdmData,          setMdmData]          = useState([]);
  const [mdmPlan,          setMdmPlan]          = useState(["", "", ""]);
  const [dispoMode,        setDispoMode]        = useState("");
  const [dispoService,     setDispoService]     = useState("");
  const [dispoFollowup,    setDispoFollowup]    = useState("");
  const [dispoFwTime,      setDispoFwTime]      = useState("");
  const [dispoPrec,        setDispoPrec]        = useState([]);

  const sectionsRef    = useRef(sections);
  const sectionDivRefs = useRef({});
  const textareaRefs   = useRef({});
  const savedNoteIdRef = useRef(urlNoteId || null);

  useEffect(() => { sectionsRef.current = sections; }, [sections]);

  // ── Timer ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startTime]);

  const timerStr = useMemo(() => {
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }, [elapsed]);

  // ── Load existing note by URL noteId ────────────────────────────────────────
  useEffect(() => {
    if (!urlNoteId || propData) return;
    base44.entities.ClinicalNote.get(urlNoteId)
      .then(note => {
        savedNoteIdRef.current = urlNoteId;
        if (note?.raw_note) {
          setSections(prev => ({
            ...prev,
            mdm: { content: note.raw_note, status: "draft", locked: false, collapsed: false },
          }));
        }
        toast.info("Note loaded.");
      })
      .catch(() => {});
  }, [urlNoteId, propData]);

  // ── Auto-resize textareas ────────────────────────────────────────────────────
  useEffect(() => {
    Object.keys(sections).forEach(id => {
      const ta = textareaRefs.current[id];
      if (!ta) return;
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + "px";
    });
  }, [sections]);

  const completedCount = useMemo(() =>
    SECTIONS.filter(s => ["complete", "locked"].includes(sections[s.id]?.status)).length,
  [sections]);

  // ── Section operations ──────────────────────────────────────────────────────
  const updateSection = useCallback((id, content) => {
    setSections(prev => ({ ...prev, [id]: { ...prev[id], content, status: content ? "draft" : "empty" } }));
    setSaved(false);
  }, []);

  const markComplete = useCallback((id) => {
    setSections(prev => {
      const cur       = prev[id];
      const newStatus = cur.status === "complete" ? "draft" : "complete";
      return { ...prev, [id]: { ...cur, status: newStatus, collapsed: newStatus === "complete" } };
    });
  }, []);

  const toggleCollapse = useCallback((id) => {
    const wasCollapsed = !!sectionsRef.current[id]?.collapsed;
    if (wasCollapsed) setFocused(id);
    setSections(prev => ({ ...prev, [id]: { ...prev[id], collapsed: !wasCollapsed } }));
  }, []);

  const toggleLock = useCallback((id) => {
    setSections(prev => ({
      ...prev,
      [id]: { ...prev[id], locked: !prev[id].locked, status: !prev[id].locked ? "locked" : "complete" },
    }));
  }, []);

  const applyMacro = useCallback((id, text) => {
    setSections(prev => {
      const cur = prev[id]?.content || "";
      return { ...prev, [id]: { ...prev[id], content: cur ? cur + "\n" + text : text, status: "draft" } };
    });
    setSaved(false);
    setTimeout(() => {
      const ta = textareaRefs.current[id];
      if (ta) { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; }
    }, 50);
  }, []);

  const applyMDM = useCallback((text) => {
    updateSection("mdm", text);
    setMdmBuilderOpen(false);
    toast.success("MDM applied.");
  }, [updateSection]);

  const applyDispo = useCallback((text) => {
    updateSection("dispo", text);
    setDispoBuilderOpen(false);
    toast.success("Disposition applied.");
  }, [updateSection]);

  // ── AI generation ───────────────────────────────────────────────────────────
  const generateSection = useCallback(async (id) => {
    const sec = SECTIONS.find(s => s.id === id);
    if (!sec || sectionsRef.current[id]?.locked) return;
    setLoading(l => ({ ...l, [id]: true }));
    setAnyBusy(true);
    const prompt = [
      "You are a clinical documentation assistant in an emergency medicine platform.",
      `Generate ONLY the "${sec.title}" section of an ED note in standard EP documentation style.`,
      "Be concise. Return ONLY the section text — no labels, no preamble.",
      `Patient: ${patientName}.  CC: ${cc.text || "not documented"}.`,
      `Current content: ${sectionsRef.current[id]?.content || "(empty)"}`,
    ].join("\n");
    try {
      const res  = await base44.integrations.Core.InvokeLLM({ prompt });
      const text = typeof res === "string" ? res : JSON.stringify(res);
      setSections(prev => ({ ...prev, [id]: { ...prev[id], content: text, status: "draft" } }));
      setSaved(false);
    } catch { toast.error("AI generation failed."); }
    finally {
      setLoading(prev => {
        const next = { ...prev, [id]: false };
        setAnyBusy(Object.values(next).some(Boolean));
        return next;
      });
    }
  }, [patientName, cc.text]);

  const generateAll = useCallback(async () => {
    const empty = SECTIONS.filter(s => {
      const sec = sectionsRef.current[s.id];
      return !sec?.content || sec.status === "empty";
    });
    if (!empty.length) { toast.info("All sections have content."); return; }
    toast.info(`Generating ${empty.length} sections…`);
    for (const s of empty) await generateSection(s.id);
    toast.success("Done.");
  }, [generateSection]);

  const rebuildAll = useCallback(() => {
    setSections(buildInitialSections(patientData));
    setSaved(false);
    toast.success("Note rebuilt from patient data.");
  }, [patientData]);

  const copyAll = useCallback(async () => {
    const divider = "\n\n" + "─".repeat(58) + "\n\n";
    const full = SECTIONS.map(s => sectionsRef.current[s.id]?.content).filter(Boolean).join(divider);
    try { await navigator.clipboard.writeText(full); toast.success("Note copied."); }
    catch { toast.error("Clipboard access denied."); }
  }, []);

  const printNote = useCallback(() => window.print(), []);

  // ── Save — CNS owns persistence; calls onExternalSave as callback if provided
  const saveNote = useCallback(async () => {
    const full = SECTIONS.map(s => sectionsRef.current[s.id]?.content).filter(Boolean).join("\n\n");
    try {
      if (savedNoteIdRef.current) {
        await base44.entities.ClinicalNote.update(savedNoteIdRef.current, { raw_note: full, status: "draft" });
      } else {
        const created = await base44.entities.ClinicalNote.create({
          raw_note:        full,
          patient_name:    patientName,
          patient_id:      registration.mrn || demo.mrn || "",
          patient_age:     demo.age    || "",
          patient_gender:  demo.sex    || "",
          chief_complaint: cc.text     || "",
          medications,
          allergies,
          status: "draft",
        });
        savedNoteIdRef.current = created.id;
      }
      setSaved(true);
      toast.success("Note saved.");
      onExternalSave?.();           // notify parent if hooked in
    } catch (e) { toast.error("Save failed: " + (e?.message || "error")); }
  }, [patientName, demo, registration, cc, medications, allergies, onExternalSave]);

  // ── Helper: focus + scroll to a section ─────────────────────────────────────
  const jumpTo = useCallback((id) => {
    setFocused(id);
    setSections(prev => ({ ...prev, [id]: { ...prev[id], collapsed: false } }));
    setTimeout(() => sectionDivRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }, []);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  // In embedded mode: ⌘1-9 are owned by NPI for workflow navigation, so we skip
  // those but keep all other CNS shortcuts (⌘G, ⌘S, ⌘P, ⌘R, ⌘⇧C, ⌘⇧G).
  useEffect(() => {
    const handler = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      // Section jump shortcuts — standalone mode only (embedded: NPI owns ⌘1-9)
      if (!embedded) {
        const sIdx = parseInt(e.key, 10) - 1;
        if (!Number.isNaN(sIdx) && sIdx >= 0 && sIdx < SECTIONS.length) {
          e.preventDefault();
          jumpTo(SECTIONS[sIdx].id);
          return;
        }
      }

      switch (true) {
        case e.key === "g" && !e.shiftKey: e.preventDefault(); generateSection(focused); break;
        case e.key === "g" &&  e.shiftKey: e.preventDefault(); generateAll();            break;
        case e.key === "s" && !e.shiftKey: e.preventDefault(); saveNote();               break;
        case e.key === "p":                e.preventDefault(); printNote();              break;
        case e.key === "c" &&  e.shiftKey: e.preventDefault(); copyAll();               break;
        case e.key === "r" && !e.shiftKey: e.preventDefault(); rebuildAll();             break;
        default: break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [embedded, focused, generateSection, generateAll, saveNote, printNote, copyAll, rebuildAll, jumpTo]);

  // ── Shared progress indicators ───────────────────────────────────────────────
  const progressPct = (completedCount / SECTIONS.length) * 100;

  const ProgressBar = ({ className, fillClass }) => (
    <div className={className}>
      <div className={fillClass} style={{ width: `${progressPct}%` }} />
    </div>
  );

  // ── Action buttons (shared between both top bars) ────────────────────────────
  const ActionButtons = () => (
    <div className="cns2-acts">
      <button className="btn btn-ghost" onClick={rebuildAll}                   title="⌘R">↺ Rebuild</button>
      <button className="btn btn-gold"  onClick={generateAll} disabled={anyBusy} title="⌘⇧G">
        {anyBusy ? "⟳ Generating…" : "✦ Generate All"}
      </button>
      <button className="btn btn-ghost" onClick={copyAll}    title="⌘⇧C">⎘ Copy</button>
      <button className="btn btn-ghost" onClick={printNote}  title="⌘P">⎙ Print</button>
      <button className="btn btn-teal"  onClick={saveNote}   title="⌘S">{saved ? "✓ Saved" : "💾 Save"}</button>
    </div>
  );

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className={`cns2${embedded ? " emb" : ""}`}>
      {anyBusy && <div className="cns2-load" />}

      {/* ── Slim embedded header — no redundant patient info (NPI already shows it) */}
      {embedded ? (
        <div className="cns2-emb-top">
          <div className="cns2-badge">NOTE STUDIO</div>
          <div className="cns2-emb-prog-wrap">
            <ProgressBar className="cns2-emb-prog-bar" fillClass="cns2-emb-prog-fill" />
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"var(--t4)", whiteSpace:"nowrap" }}>
              {completedCount}/{SECTIONS.length} signed off
            </span>
          </div>
          <div className={`cns2-timer${elapsed > TIMER_WARN_SECS ? " over" : ""}`} title="Time since note opened">
            {timerStr}
          </div>
          <ActionButtons />
        </div>
      ) : (
        /* ── Full standalone header */
        <div className="cns2-top">
          <button className="btn btn-ghost" style={{ flexShrink:0 }}
            onClick={() => onBack ? onBack() : navigate(-1)}>← Back</button>
          <div className="cns2-badge">NOTE STUDIO</div>
          <span className="cns2-ptname">{patientName}</span>
          {(demo.age || demo.sex) && (
            <span className="cns2-meta">{[demo.age ? demo.age + "y" : "", demo.sex].filter(Boolean).join(" · ")}</span>
          )}
          {cc.text   && <span className="cns2-cc">CC: {cc.text}</span>}
          {esiLevel  && <span className="cns2-esi">ESI {esiLevel}</span>}
          <div className="cns2-prog-wrap">
            <ProgressBar className="cns2-prog-bar" fillClass="cns2-prog-bar-fill" />
            <span className="cns2-prog-count">{completedCount}/{SECTIONS.length}</span>
          </div>
          <div className={`cns2-timer${elapsed > TIMER_WARN_SECS ? " over" : ""}`} title="Time since note opened">
            {timerStr}
          </div>
          <ActionButtons />
        </div>
      )}

      <div className="cns2-body">
        {/* ── Left sidebar ──────────────────────────────────────────────────── */}
        <div className="cns2-sb">
          <div className="cns2-sb-head">
            <div className="cns2-sb-label">Sections</div>
            <div className="cns2-sb-bar">
              <div className="cns2-sb-fill" style={{ width:`${progressPct}%` }} />
            </div>
            <div className="cns2-sb-sub">{completedCount} of {SECTIONS.length} signed off</div>
          </div>

          <div className="cns2-sb-list">
            {SECTIONS.map(s => {
              const st = sections[s.id]?.status || "empty";
              return (
                <div key={s.id}
                  className={`cns2-sb-item${focused === s.id ? " on" : ""}`}
                  onClick={() => jumpTo(s.id)}>
                  <span className="cns2-sb-ico">{s.icon}</span>
                  <div className="cns2-sb-txt"><div className="cns2-sb-name">{s.title}</div></div>
                  {/* Hide ⌘1-9 hint in embedded mode since NPI owns those shortcuts */}
                  {!embedded && <span className="cns2-sb-key">⌘{s.key}</span>}
                  <div className={`cns2-sb-dot ${st}`} />
                </div>
              );
            })}
          </div>

          {/* Collapsible shortcut legend */}
          <button className="cns2-sc-toggle" onClick={() => setScOpen(o => !o)}>
            <span>⌨ Shortcuts</span>
            <span className={`cns2-sc-toggle-chev${scOpen ? " open" : ""}`}>›</span>
          </button>
          {scOpen && (
            <div className="cns2-sb-legend">
              {[
                !embedded && ["⌘ 1–9","Jump section"],
                ["⌘ G",    "AI generate"],
                ["⌘ ⇧G",   "Generate all"],
                ["⌘ R",    "Rebuild"],
                ["⌘ S",    "Save"],
                ["⌘ P",    "Print"],
                ["⌘ ⇧C",   "Copy all"],
              ].filter(Boolean).map(([k, d]) => (
                <div key={k} className="cns2-sc-row">
                  <span className="cns2-sc-k">{k}</span>
                  <span className="cns2-sc-d">{d}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Main note area ─────────────────────────────────────────────────── */}
        <div className="cns2-area">
          {SECTIONS.map(s => {
            const sec      = sections[s.id] || {};
            const st       = sec.status    || "empty";
            const lk       = sec.locked    || false;
            const txt      = sec.content   || "";
            const coll     = sec.collapsed || false;
            const busy     = loading[s.id] || false;
            const hasMacros = !!MACROS[s.id]?.length;
            const isMDM    = s.id === "mdm";
            const isDispo  = s.id === "dispo";
            const srcTab   = TAB_MAP[s.id];

            return (
              <div key={s.id}
                ref={el => { sectionDivRefs.current[s.id] = el; }}
                className={`cns2-sec${focused === s.id ? " focused" : ""}${coll ? " collapsed" : ""}`}
                onClick={() => { if (coll) toggleCollapse(s.id); else setFocused(s.id); }}>

                {/* Section header */}
                <div className="cns2-sec-hdr"
                  onClick={e => { e.stopPropagation(); toggleCollapse(s.id); setFocused(s.id); }}>
                  <span className="cns2-sec-num">{s.key}</span>
                  <span className="cns2-sec-icon">{s.icon}</span>
                  <div className="cns2-sec-info">
                    <div className="cns2-sec-title">{s.title}</div>
                    {coll && txt && (
                      <div className="cns2-sec-preview">{txt.split("\n").find(l => l.trim()) || ""}</div>
                    )}
                  </div>
                  {!embedded && <span className="cns2-sec-short">⌘{s.key}</span>}
                  <div className="cns2-sec-acts" onClick={e => e.stopPropagation()}>
                    {/* "Edit source data" — navigates to the originating NPI tab */}
                    {srcTab && (
                      <button className="ibtn"
                        title={`Edit source data → ${srcTab} tab`}
                        onClick={() => navigate(`/NewPatientInput?tab=${srcTab}`)}
                        style={{ fontSize:10 }}>↩</button>
                    )}
                    <span className={`cns2-status st-${st}`}>{st === "locked" ? "🔒 locked" : st}</span>
                    <button className={`ibtn${busy ? " spin" : ""}`} title="AI Generate (⌘G)"
                      disabled={lk || busy} onClick={() => generateSection(s.id)}>
                      {busy ? "⟳" : "✦"}
                    </button>
                    <button className="ibtn" title={lk ? "Unlock" : "Lock section"}
                      onClick={() => toggleLock(s.id)}
                      style={{ color: lk ? "var(--blue)" : undefined }}>
                      {lk ? "🔒" : "🔓"}
                    </button>
                  </div>
                  <span className="cns2-chevron">›</span>
                </div>

                {/* Macro bar */}
                {!coll && hasMacros && !lk && (
                  <div className="cns2-macro-bar" onClick={e => e.stopPropagation()}>
                    {MACROS[s.id].map(m => (
                      <button key={m.label} className={`macro-pill ${m.cls || ""}`}
                        onClick={() => applyMacro(s.id, m.text)}>{m.label}</button>
                    ))}
                  </div>
                )}

                {/* MDM builder — collapsed by default, disclosure toggle */}
                {!coll && isMDM && !lk && (
                  <div onClick={e => e.stopPropagation()}>
                    <div className="cns2-builder-toggle"
                      onClick={() => setMdmBuilderOpen(o => !o)}>
                      <span className="cns2-builder-icon">⊕</span>
                      <span>Open Assessment &amp; Plan Builder</span>
                      <span className={`cns2-toggle-chev${mdmBuilderOpen ? " open" : ""}`}>›</span>
                    </div>
                    {mdmBuilderOpen && (
                      <MDMBuilder
                        dx={mdmDx}      setDx={setMdmDx}
                        risk={mdmRisk}  setRisk={setMdmRisk}
                        data={mdmData}  setData={setMdmData}
                        plan={mdmPlan}  setPlan={setMdmPlan}
                        onApply={applyMDM}
                      />
                    )}
                  </div>
                )}

                {/* Dispo builder — collapsed by default, disclosure toggle */}
                {!coll && isDispo && !lk && (
                  <div onClick={e => e.stopPropagation()}>
                    <div className="cns2-builder-toggle"
                      onClick={() => setDispoBuilderOpen(o => !o)}>
                      <span className="cns2-builder-icon">⊕</span>
                      <span>Open Disposition Builder</span>
                      <span className={`cns2-toggle-chev${dispoBuilderOpen ? " open" : ""}`}>›</span>
                    </div>
                    {dispoBuilderOpen && (
                      <DispoBuilder
                        mode={dispoMode}         setMode={setDispoMode}
                        service={dispoService}   setService={setDispoService}
                        followup={dispoFollowup} setFollowup={setDispoFollowup}
                        fwTime={dispoFwTime}     setFwTime={setDispoFwTime}
                        prec={dispoPrec}         setPrec={setDispoPrec}
                        onApply={applyDispo}
                      />
                    )}
                  </div>
                )}

                {/* Textarea */}
                {!coll && (
                  <div className="cns2-sec-body" onClick={e => e.stopPropagation()}>
                    <textarea
                      ref={el => { textareaRefs.current[s.id] = el; }}
                      className={`cns2-ta${lk ? " locked" : ""}`}
                      value={txt}
                      disabled={lk}
                      placeholder={
                        isMDM || isDispo
                          ? "Use the builder above, or type directly here…"
                          : `${s.title}…`
                      }
                      onChange={e => updateSection(s.id, e.target.value)}
                      onFocus={() => setFocused(s.id)}
                      onInput={e => {
                        e.target.style.height = "auto";
                        e.target.style.height = e.target.scrollHeight + "px";
                      }}
                    />
                  </div>
                )}

                {/* Footer */}
                {!coll && (
                  <div className="cns2-sec-foot" onClick={e => e.stopPropagation()}>
                    <span className="cns2-chars">
                      {txt.length} chars · {txt ? txt.split("\n").length : 0} lines
                    </span>
                    {!lk && (
                      <span className="cns2-done-link" onClick={() => markComplete(s.id)}>
                        {st === "complete" ? "✓ done — expand" : "Mark complete ✓"}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div className="cns2-sig">
            <div className="cns2-sig-lbl">Electronic Signature</div>
            <div>Attending Physician: ___________________________  Date: ______________</div>
            <div style={{ marginTop:6, fontSize:10, color:"var(--t4)" }}>
              I have personally seen and evaluated this patient and agree with the above documentation.
              Notrya is a clinical decision support tool — verify all clinical decisions independently.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}