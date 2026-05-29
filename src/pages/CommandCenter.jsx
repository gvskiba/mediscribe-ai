<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Lakonyx — Command Center</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#050f1e;--panel:#081628;--card:#0b1e36;
  --txt:#f2f7ff;--txt2:#b8d4f0;--txt3:#82aece;--txt4:#5a82a8;
  --line:rgba(26,53,85,0.5);--line-hi:rgba(26,53,85,0.8);
  --teal:#00e5c0;--gold:#f5c842;--coral:#ff6b6b;--blue:#3b9eff;
  --orange:#ff9f43;--purple:#9b6dff;--green:#3dffa0;--red:#ff4444;--cyan:#00d4ff;
  --ff-serif:'Playfair Display',serif;
  --ff-mono:'JetBrains Mono',monospace;
  --ff-sans:'DM Sans',sans-serif;
}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.42}}
@keyframes fade-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
@keyframes modal-in{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
.pulse{animation:pulse 1.6s ease-in-out infinite}
.fade-in{animation:fade-in .18s ease forwards}
html,body{height:100%;background:var(--bg);color:var(--txt);font-family:var(--ff-sans)}
body{overflow:hidden}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:6px}
/* ── layout ── */
#root{display:flex;flex-direction:column;height:100vh;overflow:hidden}
#topbar{display:flex;align-items:center;justify-content:space-between;padding:0 24px;height:58px;min-height:58px;background:var(--panel);border-bottom:1px solid var(--line);flex-shrink:0;gap:16px}
#main{display:flex;flex:1;overflow:hidden}
/* ── glass panel ── */
.glass{background:var(--card);border:1px solid var(--line);border-radius:10px}
/* ── buttons ── */
.btn{display:inline-flex;align-items:center;gap:6px;font-family:var(--ff-sans);font-size:12px;font-weight:600;border-radius:8px;padding:7px 15px;cursor:pointer;transition:all .15s;white-space:nowrap;border:none}
.btn-sm{padding:4px 10px;font-size:11px}
.btn-teal{color:var(--teal);background:rgba(0,229,192,0.1);border:1px solid rgba(0,229,192,0.35)}
.btn-gold{color:var(--gold);background:rgba(245,200,66,0.1);border:1px solid rgba(245,200,66,0.35)}
.btn-coral{color:var(--coral);background:rgba(255,107,107,0.1);border:1px solid rgba(255,107,107,0.35)}
.btn-blue{color:var(--blue);background:rgba(59,158,255,0.1);border:1px solid rgba(59,158,255,0.35)}
.btn-purple{color:var(--purple);background:rgba(155,109,255,0.1);border:1px solid rgba(155,109,255,0.35)}
.btn-ghost{color:var(--txt4);background:rgba(255,255,255,0.04);border:1px solid var(--line)}
.btn:hover{filter:brightness(1.15)}
/* ── badges ── */
.badge{display:inline-flex;align-items:center;font-family:var(--ff-mono);font-size:9px;font-weight:700;border-radius:5px;padding:2px 7px;white-space:nowrap;flex-shrink:0}
.dispo-dot{width:4px;height:4px;border-radius:50%;display:inline-block;flex-shrink:0;margin-right:4px}
/* ── chip ── */
.chip{display:inline-flex;align-items:center;gap:3px;font-family:var(--ff-mono);font-size:8px;font-weight:500;border-radius:5px;padding:2px 6px;white-space:nowrap;flex-shrink:0}
/* ── census panel ── */
#census{width:292px;min-width:292px;display:flex;flex-direction:column;border-right:1px solid var(--line);background:var(--panel);height:100%}
#census-header{padding:14px 16px 10px;border-bottom:1px solid var(--line);flex-shrink:0}
#census-list{flex:1;overflow-y:auto;padding-bottom:8px}
.patient-card{padding:10px 16px;border-left:3px solid transparent;border-bottom:1px solid rgba(26,53,85,0.3);cursor:pointer;transition:all .12s;display:flex;flex-direction:column;gap:4px}
.patient-card:hover{background:linear-gradient(135deg,rgba(0,229,192,0.07),transparent);border-left-color:rgba(0,229,192,0.44)}
.patient-card.selected{background:linear-gradient(135deg,rgba(0,229,192,0.12),rgba(0,229,192,0.06));border-left-color:var(--teal)}
.patient-card .name{font-family:var(--ff-serif);font-size:13px;font-weight:700;line-height:1.2;color:var(--txt)}
.patient-card .meta{display:flex;align-items:center;gap:6px;overflow:hidden}
.patient-card .cc{font-size:11px;color:var(--txt3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* ── workspace ── */
#workspace{flex:1;display:flex;flex-direction:column;overflow:hidden;background:var(--bg)}
#ws-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:var(--bg)}
#ws-header{padding:14px 20px 12px;border-bottom:1px solid var(--line);background:var(--panel);flex-shrink:0}
#ws-vitals{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-top:10px}
.vital-card{background:var(--card);border-radius:8px;padding:8px 6px 6px;text-align:center;border-top:2px solid var(--line)}
.vital-val{font-family:var(--ff-mono);font-weight:700;line-height:1}
.vital-unit{font-family:var(--ff-sans);font-size:9px;color:var(--txt4);margin-top:3px}
#ws-timeline{padding:10px 20px;border-bottom:1px solid rgba(26,53,85,0.35);background:linear-gradient(180deg,rgba(5,15,30,0.4),transparent);flex-shrink:0}
.tl-wrap{display:flex;align-items:flex-start}
.tl-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;position:relative}
.tl-connector{flex:1;height:2px;background:rgba(90,130,168,0.28);align-self:center;margin-top:-20px}
.tl-node{width:8px;height:8px;border-radius:50%;background:transparent;border:1.5px solid rgba(90,130,168,0.4);flex-shrink:0}
.tl-node.done{background:var(--teal);border-color:var(--teal);box-shadow:0 0 5px rgba(0,229,192,0.44)}
.tl-node.active{width:12px;height:12px;background:var(--gold);border:2px solid var(--gold);box-shadow:0 0 8px rgba(245,200,66,0.55)}
.tl-label{font-family:var(--ff-mono);font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:.07em}
.tl-time{font-family:var(--ff-sans);font-size:8px;color:var(--txt4)}
#ws-tabs{display:flex;background:var(--bg);border-bottom:1px solid var(--line);flex-shrink:0}
.tab-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:9px 4px 7px;background:transparent;border:none;border-bottom:2px solid transparent;color:var(--txt4);cursor:pointer;transition:all .15s}
.tab-btn:hover{color:var(--txt3)}
.tab-btn.active{background:rgba(0,229,192,0.07);border-bottom-color:var(--teal);color:var(--teal)}
.tab-btn .tab-icon{font-size:14px;line-height:1}
.tab-btn .tab-label{font-family:var(--ff-mono);font-size:8px;font-weight:700;letter-spacing:.05em}
.tab-btn .tab-hint{font-family:var(--ff-mono);font-size:7px;opacity:.5}
#ws-content{flex:1;overflow-y:auto}
#ws-footer{padding:9px 18px 11px;border-top:1px solid var(--line);display:flex;align-items:center;gap:8px;flex-shrink:0;background:var(--panel)}
/* ── shift rail ── */
#shift-rail{width:258px;min-width:258px;border-left:1px solid var(--line);background:var(--panel);display:flex;flex-direction:column;overflow-y:auto}
.sr-section{padding:12px}
.sr-section-title{font-family:var(--ff-mono);font-size:8px;font-weight:700;color:var(--txt4);text-transform:uppercase;letter-spacing:.12em;margin-bottom:8px}
.sr-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:14px}
.sr-metric{background:var(--card);border-radius:9px;padding:10px 11px;text-align:center;border:1px solid var(--line)}
.sr-metric-val{font-family:var(--ff-mono);font-size:20px;font-weight:700;line-height:1}
.sr-metric-label{font-family:var(--ff-sans);font-size:10px;color:var(--txt4);margin-top:4px}
.sr-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px}
.sr-row-label{font-family:var(--ff-sans);font-size:10px;color:var(--txt3)}
.sr-row-sub{font-family:var(--ff-mono);font-size:8px;color:var(--txt4);margin-top:1px}
.sr-row-val{font-family:var(--ff-mono);font-size:14px;font-weight:700}
.sr-card{border-radius:9px;padding:8px 10px;margin-bottom:6px;cursor:pointer;border:1px solid var(--line);background:var(--card)}
.sr-card:hover{border-color:rgba(26,53,85,0.8)}
.esi-bar-row{display:flex;align-items:center;gap:8px;margin-bottom:5px}
.esi-bar-track{flex:1;height:5px;background:rgba(26,53,85,0.5);border-radius:3px;overflow:hidden}
.esi-bar-fill{height:100%;border-radius:3px;transition:width .4s}
/* ── tab content ── */
.tab-pane{padding:14px 18px;display:flex;flex-direction:column;gap:14px}
.section-title{font-family:var(--ff-mono);font-size:8px;font-weight:700;color:var(--txt4);text-transform:uppercase;letter-spacing:.12em;margin-bottom:8px}
/* orders split */
.orders-pane{display:flex;height:100%;overflow:hidden}
.orders-catalog{flex:0 0 55%;display:flex;flex-direction:column;border-right:1px solid var(--line);overflow:hidden}
.orders-active{flex:1;display:flex;flex-direction:column;overflow:hidden}
.cat-tabs{display:flex;background:var(--bg);border-bottom:1px solid var(--line);flex-shrink:0}
.cat-tab{flex:1;padding:8px 2px 6px;background:transparent;border:none;border-bottom:2px solid transparent;color:var(--txt4);cursor:pointer;font-family:var(--ff-mono);font-size:8px;text-transform:capitalize;transition:all .12s}
.cat-tab.active{border-bottom-color:var(--teal);color:var(--teal);font-weight:700;background:rgba(0,229,192,0.08)}
.order-list{flex:1;overflow-y:auto;padding:4px 10px 8px}
.order-row{display:flex;align-items:center;gap:9px;padding:7px 8px 7px 10px;border-radius:8px;cursor:pointer;margin-bottom:2px;transition:all .1s;border:1px solid transparent}
.order-row:hover{background:rgba(26,53,85,0.3);border-color:var(--line)}
.order-row.sel{background:rgba(0,229,192,0.09);border-color:rgba(0,229,192,0.33)}
.order-chk{width:13px;height:13px;border-radius:4px;background:transparent;border:1.5px solid rgba(90,130,168,0.45);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#000}
.order-chk.checked{background:var(--teal);border-color:var(--teal)}
.order-cart{padding:9px 10px 10px;border-top:1px solid var(--line);background:var(--bg);flex-shrink:0}
.cart-pills{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;max-height:54px;overflow-y:auto}
.cart-pill{display:inline-flex;align-items:center;gap:4px;font-family:var(--ff-mono);font-size:8px;color:var(--teal);background:rgba(0,229,192,0.08);border:1px solid rgba(0,229,192,0.25);border-radius:20px;padding:3px 8px;cursor:pointer}
/* results table */
.results-table{border-radius:12px;overflow:hidden;margin-bottom:14px}
.results-table .thead{display:grid;grid-template-columns:110px 1fr 110px 60px 64px 80px;padding:7px 12px;background:rgba(26,53,85,0.3);border-bottom:1px solid var(--line)}
.results-table .trow{display:grid;grid-template-columns:110px 1fr 110px 60px 64px 80px;padding:9px 12px;border-bottom:1px solid rgba(26,53,85,0.18);align-items:center;border-left:3px solid transparent}
.results-table .trow.crit{background:rgba(255,68,68,0.05)}
.results-table .th{font-family:var(--ff-mono);font-size:7px;font-weight:700;color:var(--txt4);text-transform:uppercase;letter-spacing:.1em}
.results-table .td-name{font-family:var(--ff-mono);font-size:11px;color:var(--txt3)}
.results-table .td-val{font-family:var(--ff-mono);font-weight:700}
.results-table .td-ref{font-family:var(--ff-mono);font-size:10px;color:var(--txt4)}
.results-table .td-delta{font-family:var(--ff-mono);font-size:10px}
.results-table .td-ts{font-family:var(--ff-mono);font-size:10px;color:var(--txt4)}
/* vitals trend */
.trend-table{border-radius:12px;overflow:hidden}
.trend-row{display:grid;padding:10px 12px;border-bottom:1px solid rgba(26,53,85,0.12);align-items:center}
.trend-label{font-family:var(--ff-mono);font-size:11px;font-weight:700;color:var(--txt2)}
.trend-unit{font-family:var(--ff-sans);font-size:9px;color:var(--txt4)}
.trend-cell{text-align:center;padding:4px 3px;border-radius:6px}
.trend-cell.last{font-weight:700}
.trend-arrow{text-align:center;font-family:var(--ff-mono);font-size:14px;font-weight:700}
/* meds */
.allergy-card{border-radius:10px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.med-row{display:flex;align-items:center;gap:12px;padding:10px 14px;border-bottom:1px solid rgba(26,53,85,0.25)}
/* doc sections */
.doc-row{display:flex;align-items:center;gap:9px;padding:7px 10px;border-radius:7px;margin-bottom:5px}
/* command palette */
#palette-overlay{position:fixed;inset:0;z-index:9999;background:rgba(5,15,30,0.85);backdrop-filter:blur(14px);display:flex;align-items:flex-start;justify-content:center;padding-top:100px}
#palette-overlay.hidden{display:none}
#palette{width:100%;max-width:600px;border-radius:14px;overflow:hidden;background:var(--panel);border:1px solid rgba(0,229,192,0.44);box-shadow:0 32px 100px rgba(0,0,0,0.9);animation:modal-in .2s ease}
#pal-input-row{display:flex;align-items:center;gap:10px;padding:0 18px;border-bottom:1px solid var(--line)}
#pal-input-row .cmd-icon{font-family:var(--ff-mono);font-size:16px;color:var(--txt4);flex-shrink:0}
#pal-input{flex:1;background:transparent;border:none;outline:none;font-family:var(--ff-sans);font-size:15px;color:var(--txt);padding:16px 0}
#pal-results{max-height:420px;overflow-y:auto}
.pal-section{padding:7px 16px 3px;font-family:var(--ff-mono);font-size:8px;font-weight:700;color:var(--txt4);text-transform:uppercase;letter-spacing:.12em;border-top:1px solid var(--line);margin-top:4px}
.pal-section:first-child{border-top:none;margin-top:0}
.pal-item{display:flex;align-items:center;gap:10px;padding:9px 16px;cursor:pointer;border-left:2px solid transparent;transition:all .08s}
.pal-item:hover,.pal-item.active{background:rgba(0,229,192,0.1);border-left-color:var(--teal)}
.pal-item .p-icon{font-size:15px;flex-shrink:0;line-height:1}
.pal-item .p-label{font-family:var(--ff-sans);font-size:13px;font-weight:600;color:var(--txt2)}
.pal-item:hover .p-label,.pal-item.active .p-label{color:var(--txt)}
.pal-item .p-sub{font-family:var(--ff-sans);font-size:10px;color:var(--txt4);margin-top:1px}
.pal-item .p-badge{font-family:var(--ff-mono);font-size:8px;font-weight:600;border-radius:4px;padding:2px 6px;margin-left:auto;flex-shrink:0}
#pal-footer{padding:7px 16px;border-top:1px solid var(--line);display:flex;align-items:center;gap:14px}
.pal-key{display:flex;align-items:center;gap:4px}
.pal-key kbd{font-family:var(--ff-mono);font-size:9px;color:var(--txt3);background:rgba(26,53,85,0.5);border:1px solid var(--line-hi);border-radius:4px;padding:1px 5px}
.pal-key span{font-family:var(--ff-sans);font-size:10px;color:var(--txt4)}
/* input search */
.search-box{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.04);border:1px solid var(--line);border-radius:8px;padding:7px 10px}
.search-box input{flex:1;background:transparent;border:none;outline:none;font-family:var(--ff-sans);font-size:12px;color:var(--txt)}
/* provider row */
.prov-row{display:flex;align-items:center;gap:10px;flex-wrap:nowrap;overflow:hidden}
.prov-item{display:inline-flex;align-items:center;gap:3px;flex-shrink:0}
.prov-role{font-family:var(--ff-mono);font-size:8px;font-weight:700;border-radius:3px;padding:1px 4px;line-height:1.5}
.prov-name{font-family:var(--ff-sans);font-size:11px;color:var(--txt3);white-space:nowrap}
/* misc */
.divider{height:1px;background:var(--line);margin:8px 0}
.spinner{width:10px;height:10px;border-radius:50%;border:2px solid rgba(0,229,192,0.3);border-top:2px solid var(--teal);animation:spin 1s linear infinite;display:inline-block}
</style>
</head>
<body>
<div id="root">
  <div id="topbar">
    <div style="display:flex;align-items:center;gap:10px">
      <div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,var(--teal),var(--purple));display:flex;align-items:center;justify-content:center;font-size:16px">⚡</div>
      <div>
        <div style="font-family:var(--ff-serif);font-size:15px;font-weight:900;letter-spacing:.03em">LAKONYX</div>
        <div style="font-family:var(--ff-mono);font-size:8px;color:var(--txt4);letter-spacing:.16em;margin-top:-1px">COMMAND CENTER</div>
      </div>
      <button class="btn btn-ghost" onclick="openPalette()" style="margin-left:12px;gap:7px">
        <span style="font-size:12px">🔍</span><span>Search</span>
        <kbd style="font-family:var(--ff-mono);font-size:9px;color:var(--txt4);background:rgba(26,53,85,0.6);border:1px solid var(--line-hi);border-radius:4px;padding:1px 6px;margin-left:2px">⌘K</kbd>
      </button>
    </div>
    <div style="display:flex;align-items:center;gap:14px">
      <div style="text-align:center">
        <div id="clock" style="font-family:var(--ff-mono);font-size:20px;font-weight:700;letter-spacing:.04em"></div>
        <div id="date" style="font-family:var(--ff-sans);font-size:10px;color:var(--txt4);margin-top:-2px"></div>
      </div>
      <div style="background:rgba(0,229,192,0.08);border:1px solid rgba(0,229,192,0.3);border-radius:8px;padding:4px 12px;display:flex;align-items:center;gap:6px">
        <span style="width:6px;height:6px;border-radius:50%;background:var(--teal);display:inline-block"></span>
        <span style="font-family:var(--ff-mono);font-size:10px;color:var(--teal);font-weight:700">On Shift</span>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:8px">
      <button class="btn btn-teal" onclick="toast('Quick Note — opening...')">✏️ Quick Note</button>
      <button class="btn btn-coral" onclick="toast('Rapid Order — opening...')">⚡ Rapid Order</button>
      <button class="btn btn-gold" onclick="toast('New Patient — opening...')">+ New Patient</button>
      <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--coral),var(--purple));display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;font-family:var(--ff-sans)">G</div>
    </div>
  </div>
  <div id="main">
    <div id="census">
      <div id="census-header">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:9px">
          <span id="census-title" style="font-family:var(--ff-mono);font-size:8px;font-weight:700;color:var(--txt4);text-transform:uppercase;letter-spacing:.12em">Patient Census</span>
          <span id="census-count" class="badge" style="background:rgba(0,229,192,0.1);border:1px solid rgba(0,229,192,0.3);color:var(--teal)">9</span>
        </div>
        <div style="display:flex;background:rgba(255,255,255,0.03);border:1px solid var(--line);border-radius:8px;overflow:hidden;margin-bottom:9px">
          <button id="filter-mine" onclick="setFilter('mine')" style="flex:1;display:flex;align-items:center;justify-content:flex-start;gap:5px;padding:5px 10px;background:transparent;border:none;border-right:1px solid var(--line);color:var(--txt4);font-family:var(--ff-mono);font-size:9px;cursor:pointer;transition:all .15s">My Patients<span class="badge" style="background:rgba(26,53,85,0.4);color:var(--txt4)">3</span></button>
          <button id="filter-all" onclick="setFilter('all')" style="flex:none;display:flex;align-items:center;justify-content:center;gap:5px;padding:5px 12px;background:rgba(0,229,192,0.1);border:none;color:var(--teal);font-family:var(--ff-mono);font-size:9px;font-weight:700;cursor:pointer;transition:all .15s">All<span class="badge" style="background:rgba(0,229,192,0.15);color:var(--teal)">9</span></button>
        </div>
        <div class="search-box">
          <span style="font-size:12px;color:var(--txt4)">🔍</span>
          <input id="census-search" placeholder="Room, name, CC..." oninput="renderCensus()">
          <button onclick="document.getElementById('census-search').value='';renderCensus()" style="background:none;border:none;color:var(--txt4);cursor:pointer;font-size:11px">✕</button>
        </div>
      </div>
      <div id="census-list"></div>
    </div>
    <div id="workspace">
      <div id="ws-empty">
        <div style="font-size:52px">🏥</div>
        <div style="font-family:var(--ff-serif);font-size:22px;color:var(--txt3)">Select a patient</div>
        <div style="font-family:var(--ff-sans);font-size:13px;color:var(--txt4);text-align:center;max-width:280px;line-height:1.6">Choose a patient from the census to open their encounter workspace</div>
      </div>
      <div id="ws-body" style="display:none;flex-direction:column;height:100%;overflow:hidden">
        <div id="ws-header"></div>
        <div id="ws-timeline"></div>
        <div id="ws-tabs"></div>
        <div id="ws-content" style="flex:1;overflow-y:auto"></div>
        <div id="ws-footer"></div>
      </div>
    </div>
    <div id="shift-rail">
      <div style="padding:14px 14px 10px;border-bottom:1px solid var(--line);flex-shrink:0">
        <div class="sr-section-title">Shift Overview</div>
      </div>
      <div id="shift-content" style="padding:12px 12px 0;flex:1"></div>
    </div>
  </div>
</div>

<div id="palette-overlay" class="hidden" onclick="if(event.target===this)closePalette()">
  <div id="palette" onclick="event.stopPropagation()">
    <div id="pal-input-row">
      <span class="cmd-icon">⌘</span>
      <input id="pal-input" placeholder="Search patients, hubs, or actions..." oninput="renderPalette()" onkeydown="palKey(event)">
      <button onclick="closePalette()" style="background:none;border:none;color:var(--txt4);cursor:pointer;font-size:13px;padding:2px 4px">✕</button>
    </div>
    <div id="pal-results"></div>
    <div id="pal-footer">
      <div class="pal-key"><kbd>↑↓</kbd><span>navigate</span></div>
      <div class="pal-key"><kbd>↵</kbd><span>open</span></div>
      <div class="pal-key"><kbd>esc</kbd><span>close</span></div>
      <div style="flex:1"></div>
      <span style="font-family:var(--ff-mono);font-size:8px;color:var(--txt4);letter-spacing:.06em">LAKONYX · ⌘K</span>
    </div>
  </div>
</div>

<script>
// ── TOKENS ──────────────────────────────────────────────────────────────────
const T={bg:"#050f1e",panel:"#081628",card:"#0b1e36",txt:"#f2f7ff",txt2:"#b8d4f0",txt3:"#82aece",txt4:"#5a82a8",teal:"#00e5c0",gold:"#f5c842",coral:"#ff6b6b",blue:"#3b9eff",orange:"#ff9f43",purple:"#9b6dff",green:"#3dffa0",red:"#ff4444",cyan:"#00d4ff"};
const esiColor=n=>({1:T.red,2:T.orange,3:T.gold,4:T.green,5:T.txt4}[n]||T.txt4);
const fmtTime=m=>m<60?`${m}m`:`${Math.floor(m/60)}h${m%60}m`;
const iHash=s=>s.split("").reduce((a,c)=>(a*31+c.charCodeAt(0))&0xffff,0);

// ── MOCK DATA ────────────────────────────────────────────────────────────────
const PATIENTS=[
  {id:"p1",esi:1,room:"Trauma 1",name:"R. Kellerman",age:58,sex:"M",cc:"Cardiac arrest, ROSC",mins:12,flags:["STEMI"],dispo:"admitted",providers:[{role:"MD",name:"Skiba"},{role:"RN",name:"Torres"}]},
  {id:"p2",esi:2,room:"A4",name:"L. Sanchez",age:71,sex:"F",cc:"Right-sided weakness, last known well 40m",mins:28,flags:["Stroke"],dispo:"awaiting_consult",providers:[{role:"MD",name:"Skiba"},{role:"RN",name:"Kim"},{role:"R",name:"Brown (R2)"}]},
  {id:"p3",esi:2,room:"A7",name:"T. Johnson",age:64,sex:"M",cc:"Fever, hypotension, ALOC",mins:95,flags:["Sepsis"],dispo:"admitted",providers:[{role:"MD",name:"Chen"},{role:"RN",name:"Davis"}]},
  {id:"p4",esi:3,room:"A2",name:"C. Anderson",age:44,sex:"F",cc:"RLQ abdominal pain, nausea/vomiting",mins:140,flags:[],dispo:"obs",providers:[{role:"MD",name:"Chen"},{role:"RN",name:"Torres"}]},
  {id:"p5",esi:3,room:"A5",name:"B. Stewart",age:33,sex:"M",cc:"Laceration, R forearm, 4cm",mins:165,flags:[],dispo:"dc_ready",providers:[{role:"MD",name:"Skiba"},{role:"RN",name:"Kim"}]},
  {id:"p6",esi:3,room:"A6",name:"J. Garcia",age:27,sex:"F",cc:"Palpitations, near-syncope",mins:52,flags:["Critical Lab"],dispo:"awaiting_consult",providers:[{role:"MD",name:"Skiba"},{role:"RN",name:"Lee"}]},
  {id:"p7",esi:4,room:"Fast 1",name:"P. Adams",age:19,sex:"M",cc:"Ankle injury, weight-bearing pain",mins:78,flags:[],dispo:"dc_ready",providers:[{role:"MD",name:"Chen"},{role:"RN",name:"Davis"}]},
  {id:"p8",esi:2,room:"WR",name:"D. Nguyen",age:49,sex:"M",cc:"Chest pain, diaphoretic",mins:22,flags:[],dispo:null,providers:[]},
  {id:"p9",esi:4,room:"WR",name:"M. Rivera",age:8,sex:"F",cc:"Fever, ear pain, 2 days",mins:47,flags:[],dispo:null,providers:[]},
];
const DISPO_MAP={dc_ready:{label:"D/C Ready",color:T.green},admitted:{label:"Bed Pending",color:T.cyan},obs:{label:"Obs Pending",color:T.gold},awaiting_consult:{label:"Consult Pending",color:T.purple},transfer:{label:"Transfer",color:T.orange},boarding:{label:"Boarding",color:T.blue}};
const ROLE_COLOR={MD:T.teal,RN:T.gold,R:T.purple,NP:T.blue,PA:T.cyan};
const FLAG_COLOR={STEMI:T.red,Stroke:T.red,Sepsis:T.red,"Critical Lab":T.orange,"Psych Hold":T.gold,Trauma:T.orange,Isolation:T.blue};
const LAB_PROFILES={
  cardiac:[{n:"WBC",v:14.2,u:"K/μL",lo:4.5,hi:11.0,d:"+2.1"},{n:"Hgb",v:13.8,u:"g/dL",lo:12,hi:17.5,d:null},{n:"Plt",v:198,u:"K/μL",lo:150,hi:400,d:null},{n:"Na",v:136,u:"mEq/L",lo:136,hi:145,d:null},{n:"K",v:3.8,u:"mEq/L",lo:3.5,hi:5.0,d:"−0.2"},{n:"Cr",v:1.2,u:"mg/dL",lo:0.6,hi:1.2,d:null},{n:"Glc",v:158,u:"mg/dL",lo:70,hi:100,d:null},{n:"Trop I",v:"CRITICAL 0.84",u:"ng/mL",crit:true,lo:0,hi:0.04,d:null}],
  sepsis:[{n:"WBC",v:18.4,u:"K/μL",lo:4.5,hi:11.0,d:"+6.2"},{n:"Hgb",v:11.2,u:"g/dL",lo:12,hi:17.5,d:null},{n:"Plt",v:142,u:"K/μL",lo:150,hi:400,d:"−28"},{n:"K",v:4.2,u:"mEq/L",lo:3.5,hi:5.0,d:null},{n:"Cr",v:2.1,u:"mg/dL",lo:0.6,hi:1.2,d:null},{n:"Lactate",v:"CRITICAL 4.2",u:"mmol/L",crit:true,lo:0.5,hi:2.0,d:null}],
  default:[{n:"WBC",v:9.2,u:"K/μL",lo:4.5,hi:11.0,d:null},{n:"Hgb",v:13.4,u:"g/dL",lo:12,hi:17.5,d:null},{n:"Na",v:140,u:"mEq/L",lo:136,hi:145,d:null},{n:"K",v:4.0,u:"mEq/L",lo:3.5,hi:5.0,d:null},{n:"Cr",v:0.9,u:"mg/dL",lo:0.6,hi:1.2,d:null},{n:"Glc",v:98,u:"mg/dL",lo:70,hi:100,d:null}]
};
const ROC_INLINE={
  labs:[{id:"bmp-cbc",n:"BMP + CBC",c:true},{id:"trop",n:"Troponin I (High-Sens.)",c:true},{id:"lactate",n:"Lactate",c:true},{id:"ua",n:"Urinalysis w/ Reflex Cx",c:true},{id:"bc",n:"Blood Cultures ×2",c:true},{id:"coags",n:"PT / INR / PTT",c:false},{id:"ddimer",n:"D-Dimer",c:false},{id:"abg",n:"ABG",c:false},{id:"lfts",n:"LFTs",c:false},{id:"lipase",n:"Lipase",c:false}],
  imaging:[{id:"cxr",n:"CXR PA & Lateral",c:true},{id:"ct-head",n:"CT Head w/o Contrast",c:true},{id:"ct-pe",n:"CT Chest CTA — PE",c:true},{id:"ct-ap",n:"CT Abd/Pelvis w/ Contrast",c:true},{id:"us-ruq",n:"US Abdomen RUQ",c:true},{id:"us-dvt",n:"US Lower Extremity DVT",c:false},{id:"ct-csp",n:"CT C-Spine w/o",c:false}],
  meds:[{id:"keto",n:"Ketorolac 30mg IV",c:true},{id:"zofran",n:"Ondansetron 4mg IV",c:true},{id:"morph",n:"Morphine 4mg IV",c:true},{id:"ns1l",n:"Normal Saline 1L IV",c:true},{id:"asa",n:"Aspirin 324mg PO",c:true},{id:"hep",n:"Heparin IV (ACS protocol)",c:false},{id:"mag",n:"Magnesium Sulf. 2g IV",c:false}],
  consults:[{id:"cards",n:"Cardiology",c:true},{id:"neuro",n:"Neurology",c:true},{id:"surg",n:"General Surgery",c:true},{id:"ortho",n:"Orthopedics",c:false},{id:"psych",n:"Psychiatry",c:false},{id:"id",n:"Infectious Disease",c:false}],
};
const HUBS=[["ECGHub","ECG Interpreter","💓"],["StrokeHub","Stroke Assessment","🧠"],["SepsisHub","Sepsis Protocol","🦠"],["ToxicologyHub","Toxicology","☣️"],["PsychHub","Psych Evaluation","🧩"],["AirwayHub","Airway Management","🫁"],["OrderGeneratorHub","Order Generator","📋"],["AutocoderHub","Auto-Coder / ICD-10","🏷️"],["ImagingInterpreter","Imaging Interpreter","🩻"],["ElectrolyteAcidBaseHub","Electrolytes & Acid-Base","⚗️"],["PediatricHub","Pediatric Hub","👶"],["AbdominalPainHub","Abdominal Pain","🔴"]];

// ── STATE ────────────────────────────────────────────────────────────────────
const state={selectedId:null,activeTab:"overview",filter:"all",paletteOpen:false,orderCat:"labs",selOrders:{},ackedLabs:{},placing:false,placed:false,showMoreCats:{}};

// ── HELPERS ──────────────────────────────────────────────────────────────────
function getPatient(){return PATIENTS.find(p=>p.id===state.selectedId)||null}
function deriveLabs(p){const cc=(p.cc||"").toLowerCase();const k=["chest","stemi","cardiac","arrest"].some(k=>cc.includes(k))?"cardiac":["sepsis","fever","hypotension"].some(k=>cc.includes(k))?"sepsis":"default";return LAB_PROFILES[k].map(r=>({...r,ts:"14:"+(38+iHash(p.id+r.n)%12).toString().padStart(2,"0")}))}
function vitalSet(p,i){const cc=(p.cc||"").toLowerCase(),imp=["arrest","shock","hypotension","sepsis"].some(k=>cc.includes(k)),f=imp?i/3:0;const hr0=imp?124:88,bp0=imp?[82,52]:[138,88];const hr=Math.round(hr0-(hr0-72)*f),sys=Math.round(bp0[0]+(((imp?88:120)-bp0[0])*f)),dia=Math.round(bp0[1]+(((imp?58:70)-bp0[1])*f));return{HR:hr,BP:`${sys}/${dia}`,SpO2:Math.round((imp?93:98)+((99-(imp?93:98))*f)),RR:Math.round((imp?24:16)+((16-(imp?24:16))*f)),Temp:(98.4).toFixed(1),GCS:Math.min(15,Math.round((imp?13:15)+((15-(imp?13:15))*f)))};}
function vColor(key,val){const ranges={HR:[60,100],SpO2:[95,100],RR:[12,20],Temp:[97,99],GCS:[14,15]};if(key==="BP"){const s=parseInt(val);return s>=180||s<90?T.red:s>=160||s<100?T.gold:T.green;}if(!ranges[key])return T.txt;const[lo,hi]=ranges[key],n=typeof val==="number"?val:parseFloat(val);if(isNaN(n))return T.txt;if(n<lo||n>hi)return T.red;const band=(hi-lo)*0.12;return(n<=lo+band||n>=hi-band)?T.gold:T.green;}
function trendArrow(key,vals){const first=vals[0],last=vals[vals.length-1];const f=typeof first==="number"?first:parseFloat(first),l=typeof last==="number"?last:parseFloat(last);if(isNaN(f)||isNaN(l)||Math.abs(l-f)<1)return{icon:"→",color:T.txt4};const diff=l-f,imp=(key==="HR"||key==="RR")?diff<0:diff>0;return{icon:diff>0?"↑":"↓",color:imp?T.green:T.red};}
function flagColor(r){if(r.crit)return T.red;if(!r.lo&&!r.hi)return T.txt3;const n=typeof r.v==="number"?r.v:parseFloat(r.v);if(isNaN(n))return T.txt3;if(n<r.lo||n>r.hi)return(n<r.lo*0.85||n>r.hi*1.15)?T.red:T.gold;return T.green;}
function e(t,s,c="")  {return`<${t} ${s?"style='"+s+"'":""} ${c?'class="'+c+'"':""}>`}
function badge(txt,color){return`<span class="badge" style="color:${color};background:${color}18;border:1px solid ${color}44">${txt}</span>`}
function dispoBadge(status){const d=DISPO_MAP[status];if(!d)return"";return`<span class="badge" style="color:${d.color};background:${d.color}14;border:1px solid ${d.color}44"><span class="dispo-dot" style="background:${d.color}"></span>${d.label}</span>`}
function esiBadge(esi){const c=esiColor(esi);return`<span class="badge" style="color:${c};background:${c}18;border:1px solid ${c}45">ESI ${esi}</span>`}
function timeBadge(mins){const c=mins>120?T.red:mins>60?T.gold:T.txt4;return`<span style="font-family:var(--ff-mono);font-size:11px;color:${c}">${fmtTime(mins)}</span>`}
function provRow(providers,compact=false){if(!providers?.length)return"";return`<div class="prov-row">${providers.map(pv=>`<div class="prov-item"><span class="prov-role" style="color:${ROLE_COLOR[pv.role]||T.teal};background:${ROLE_COLOR[pv.role]||T.teal}18;border:1px solid ${ROLE_COLOR[pv.role]||T.teal}44">${pv.role}</span><span class="prov-name" style="font-size:${compact?9:11}px">${pv.name}</span></div>`).join("")}</div>`}
function toast(msg){const t=document.createElement("div");t.textContent=msg;Object.assign(t.style,{position:"fixed",bottom:"20px",right:"20px",background:T.panel,border:"1px solid var(--line)",borderRadius:"8px",padding:"10px 16px",fontFamily:"var(--ff-sans)",fontSize:"12px",color:T.txt3,zIndex:9998,animation:"fade-in .2s ease"});document.body.appendChild(t);setTimeout(()=>t.remove(),2200);}

// ── CENSUS RENDER ────────────────────────────────────────────────────────────
function renderCensus(){
  const q=(document.getElementById("census-search")?.value||"").toLowerCase();
  let pts=PATIENTS.filter(p=>[p.name,p.cc,p.room].some(s=>(s||"").toLowerCase().includes(q)));
  if(state.filter==="mine")pts=pts.filter(p=>p.providers?.some(pr=>pr.role==="MD"&&pr.name==="Skiba"));
  pts.sort((a,b)=>a.esi!==b.esi?a.esi-b.esi:b.mins-a.mins);
  const list=document.getElementById("census-list");
  if(!list)return;
  list.innerHTML=pts.length===0?`<div style="padding:32px 16px;text-align:center"><div style="font-size:28px;margin-bottom:10px">👤</div><div style="font-family:var(--ff-sans);font-size:12px;color:var(--txt4)">No patients match</div></div>`:pts.map(p=>{
    const hasCrit=false;
    const fc=p.flags.length?FLAG_COLOR[p.flags[0]]||T.orange:null;
    return`<div class="patient-card ${p.id===state.selectedId?"selected":""}" onclick="selectPatient('${p.id}')">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:5px"><span style="font-family:var(--ff-mono);font-size:9px;color:${p.id===state.selectedId?T.teal:T.txt4}">${p.room}</span>${hasCrit?`<span style="width:5px;height:5px;border-radius:50%;background:${T.red};display:inline-block"></span>`:""}</div>
        <div style="display:flex;align-items:center;gap:6px">${esiBadge(p.esi)}${timeBadge(p.mins)}</div>
      </div>
      <div class="name">${p.name}</div>
      ${provRow(p.providers,true)}
      <div class="meta">
        <span style="font-family:var(--ff-mono);font-size:9px;color:var(--txt4);flex-shrink:0">${p.age}${p.sex}</span>
        <span style="color:var(--txt4);font-size:9px;flex-shrink:0">·</span>
        <span class="cc">${p.cc}</span>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:4px">
        <div style="display:flex;gap:4px;flex-wrap:nowrap;overflow:hidden">${p.flags.map(f=>`<span class="chip" style="color:${FLAG_COLOR[f]||T.gold};background:${FLAG_COLOR[f]||T.gold}14;border:1px solid ${FLAG_COLOR[f]||T.gold}44">${f}</span>`).join("")}</div>
        ${dispoBadge(p.dispo)}
      </div>
    </div>`;
  }).join("");
}

function setFilter(f){
  state.filter=f;
  document.getElementById("filter-mine").style.cssText=`flex:1;display:flex;align-items:center;justify-content:flex-start;gap:5px;padding:5px 10px;background:${f==="mine"?"rgba(0,229,192,0.1)":"transparent"};border:none;border-right:1px solid var(--line);color:${f==="mine"?"var(--teal)":"var(--txt4)"};font-family:var(--ff-mono);font-size:9px;${f==="mine"?"font-weight:700;":""}cursor:pointer`;
  document.getElementById("filter-all").style.cssText=`flex:none;display:flex;align-items:center;justify-content:center;gap:5px;padding:5px 12px;background:${f==="all"?"rgba(0,229,192,0.1)":"transparent"};border:none;color:${f==="all"?"var(--teal)":"var(--txt4)"};font-family:var(--ff-mono);font-size:9px;${f==="all"?"font-weight:700;":""}cursor:pointer`;
  renderCensus();
}

// ── WORKSPACE RENDER ─────────────────────────────────────────────────────────
function selectPatient(id){
  state.selectedId=id;state.activeTab="overview";state.selOrders={};state.placed=false;state.placing=false;state.ackedLabs={};
  renderCensus();renderWorkspace();
}

function renderWorkspace(){
  const p=getPatient();
  document.getElementById("ws-empty").style.display=p?"none":"flex";
  const body=document.getElementById("ws-body");
  body.style.display=p?"flex":"none";
  if(!p)return;
  renderWsHeader(p);renderWsTimeline(p);renderWsTabs();renderWsContent();renderWsFooter(p);
}

function renderWsHeader(p){
  const vDefs=[{k:"HR",lo:60,hi:100},{k:"BP",lo:null,hi:null},{k:"SpO2",lo:95,hi:100},{k:"RR",lo:12,hi:20},{k:"Temp",lo:97,hi:99},{k:"GCS",lo:14,hi:15}];
  const vs=vitalSet(p,3);
  const vCards=vDefs.map(d=>{const val=vs[d.k],c=vColor(d.k,val);return`<div class="vital-card" style="border-top-color:${c};background:${c===T.red?"rgba(255,68,68,0.06)":T.card}"><div style="font-family:var(--ff-mono);font-size:7px;color:var(--txt4);text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px">${d.k}</div><div class="vital-val" style="color:${c};font-size:${d.k==="BP"?11:16}px">${val}</div><div class="vital-unit">${d.k==="HR"?"bpm":d.k==="SpO2"?"%":d.k==="RR"?"/min":d.k==="Temp"?"°F":""}</div></div>`;}).join("");
  document.getElementById("ws-header").innerHTML=`
    <div style="margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
        <span style="font-family:var(--ff-mono);font-size:9px;color:var(--txt4);background:rgba(26,53,85,0.6);border:1px solid var(--line-hi);border-radius:5px;padding:2px 7px">${p.room}</span>
        ${esiBadge(p.esi)}${timeBadge(p.mins)}${dispoBadge(p.dispo)}
      </div>
      <div style="font-family:var(--ff-serif);font-size:20px;font-weight:900;line-height:1.15;margin-bottom:3px">${p.name}</div>
      <div style="font-family:var(--ff-sans);font-size:12px;color:var(--teal);margin-bottom:4px">${p.age}${p.sex} · ${p.cc}</div>
      ${provRow(p.providers)}
    </div>
    <div id="ws-vitals" style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px">${vCards}</div>`;
}

function renderWsTimeline(p){
  const h=iHash(p.id),mins=p.mins||0;
  const done=[true,true,mins>10,mins>40,!!p.dispo,["dc_ready","admitted","transfer"].includes(p.dispo)];
  const activeIdx=done.findIndex(d=>!d);
  const labels=["Triage","Assessed","Orders","Results","Dispo","Out"];
  const DASH="repeating-linear-gradient(90deg,rgba(90,130,168,0.28) 0,rgba(90,130,168,0.28) 5px,transparent 5px,transparent 10px)";
  const arr=new Date(Date.now()-mins*60000);
  const t=add=>new Date(arr.getTime()+add*60000).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:false});
  const times=[t(2),t(10+h%10),done[2]?t(18+h%8):null,done[3]?t(38+h%15):null,done[4]?"Set":null,done[5]?"Ready":null];
  let html=`<div style="display:flex;align-items:center">`;
  labels.forEach((label,i)=>{
    const d=done[i],active=i===activeIdx;
    const nSz=active?12:8,nBg=d?T.teal:active?T.gold:"transparent",nBd=d?T.teal:active?T.gold:"rgba(90,130,168,0.4)";
    const prevDone=i===0?true:done[i-1];
    const connBg=prevDone&&d?T.teal:active?`linear-gradient(90deg,${T.teal},${T.gold})`:DASH;
    html+=`<div style="flex:1;display:flex;align-items:center">`;
    if(i>0)html+=`<div style="flex:1;height:1.5px;background:${connBg};align-self:center"></div>`;
    html+=`<div style="display:flex;flex-direction:column;align-items:center;gap:2px">
      <div class="${active&&!d?"pulse":""}" style="width:${nSz}px;height:${nSz}px;border-radius:50%;background:${nBg};border:${d||active?2:1.5}px solid ${nBd};box-shadow:${active?`0 0 8px ${T.gold}88`:d?`0 0 5px ${T.teal}44`:"none"}"></div>
      <span style="font-family:var(--ff-mono);font-size:7px;font-weight:700;color:${d?T.txt3:active?T.gold:T.txt4};text-transform:uppercase;letter-spacing:.07em">${label}</span>
      <span style="font-family:var(--ff-sans);font-size:8px;color:${active?T.gold:T.txt4};opacity:${d||active?1:.25}">${times[i]||"·"}</span>
    </div>`;
    if(i<labels.length-1){const next=done[i+1];html+=`<div style="flex:1;height:1.5px;background:${d&&next?T.teal:next&&i+1===activeIdx?`linear-gradient(90deg,${T.teal},${T.gold})`:DASH};align-self:center"></div>`;}
    html+=`</div>`;
  });
  html+=`</div>`;
  document.getElementById("ws-timeline").innerHTML=html;
}

function renderWsTabs(){
  const tabs=[{k:"overview",l:"Overview",i:"🗂️"},{k:"orders",l:"Orders",i:"📋"},{k:"results",l:"Results",i:"🧪"},{k:"vitals",l:"Vitals",i:"📈"},{k:"meds",l:"Meds & Rx",i:"💊"}];
  document.getElementById("ws-tabs").innerHTML=tabs.map((t,idx)=>`<button class="tab-btn ${state.activeTab===t.k?"active":""}" onclick="switchTab('${t.k}')"><span class="tab-icon">${t.i}</span><span class="tab-label">${t.l}</span><span class="tab-hint">${idx+1}</span></button>`).join("");
}

function switchTab(tab){state.activeTab=tab;renderWsTabs();renderWsContent();}

function renderWsContent(){
  const p=getPatient();if(!p)return;
  const el=document.getElementById("ws-content");
  if(state.activeTab==="overview")el.innerHTML=renderOverviewTab(p);
  else if(state.activeTab==="orders")el.innerHTML=renderOrdersTab(p);
  else if(state.activeTab==="results")el.innerHTML=renderResultsTab(p);
  else if(state.activeTab==="vitals")el.innerHTML=renderVitalsTab(p);
  else if(state.activeTab==="meds")el.innerHTML=renderMedsTab(p);
  // attach events after render
  if(state.activeTab==="orders")attachOrderEvents();
}

function renderWsFooter(p){
  document.getElementById("ws-footer").innerHTML=`
    <span style="font-family:var(--ff-mono);font-size:7px;color:var(--txt4);text-transform:uppercase;letter-spacing:.14em;margin-right:4px">Quick</span>
    <button class="btn btn-coral btn-sm" onclick="toast('Rapid Order — opening...')">⚡ Rapid order</button>
    <button class="btn btn-gold btn-sm" onclick="toast('Note — opening...')">📝 Note</button>
    <button class="btn btn-purple btn-sm" onclick="toast('Dispo — opening...')">🚪 Dispo</button>
    ${state.activeTab!=="orders"?`<button class="btn btn-teal btn-sm" onclick="switchTab('orders')">📋 Orders tab</button>`:""}
    <div style="flex:1"></div>
    <button class="btn btn-blue btn-sm" onclick="toast('Opening full encounter...')">Full encounter →</button>`;
}

// ── TAB: OVERVIEW ────────────────────────────────────────────────────────────
function renderOverviewTab(p){
  const docStatus={hpi:p.mins>20,ros:p.mins>30,pe:p.mins>25,mdm:false,signed:false};
  const completed=["hpi","ros","pe","mdm"].filter(k=>docStatus[k]).length;
  const disp=p.dispo,dm=DISPO_MAP[disp];
  const docSections=[{k:"hpi",l:"History of Present Illness",i:"📝"},{k:"ros",l:"Review of Systems",i:"📋"},{k:"pe",l:"Physical Exam",i:"🩺"},{k:"mdm",l:"Medical Decision Making",i:"🧠"}];
  return`<div class="tab-pane fade-in">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      <div class="glass" style="overflow:hidden">
        <div style="padding:10px 13px 8px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between">
          <div class="section-title" style="margin-bottom:0">Documentation</div>
          <span class="badge" style="color:${docStatus.signed?T.green:T.gold};background:${docStatus.signed?"rgba(61,255,160,0.1)":"rgba(245,200,66,0.1)"};border:1px solid ${docStatus.signed?T.green:T.gold}44">${docStatus.signed?"✓ SIGNED":"UNSIGNED"}</span>
        </div>
        <div style="height:3px;background:rgba(26,53,85,0.5)"><div style="height:100%;width:${(completed/4)*100}%;background:linear-gradient(90deg,var(--teal),var(--green));transition:width .4s ease"></div></div>
        <div style="padding:10px 12px;display:flex;flex-direction:column;gap:5px">
          ${docSections.map(({k,l,i})=>{const done=docStatus[k];return`<div class="doc-row" style="background:${done?"rgba(61,255,160,0.05)":"rgba(26,53,85,0.2)"};border:1px solid ${done?T.green+"30":"rgba(26,53,85,0.4)"}"><span style="font-size:12px">${i}</span><span style="font-family:var(--ff-sans);font-size:11px;color:${done?T.txt:T.txt3};flex:1">${l}</span><span style="font-family:var(--ff-mono);font-size:10px;font-weight:700;color:${done?T.green:T.txt4}">${done?"✓":"—"}</span></div>`;}).join("")}
        </div>
        <div style="padding:8px 12px;border-top:1px solid var(--line);display:flex;gap:6px">
          <button class="btn btn-gold btn-sm" onclick="toast('Opening note...')">📝 Open Note</button>
          ${completed===4&&!docStatus.signed?`<button class="btn btn-sm" style="color:var(--green);background:rgba(61,255,160,0.1);border:1px solid rgba(61,255,160,0.35)" onclick="toast('Signing chart...')">✓ Sign Chart</button>`:""}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div class="glass" style="padding:13px">
          <div class="section-title">Disposition</div>
          ${dispoBadge(disp)||`<span style="font-family:var(--ff-mono);font-size:9px;color:var(--txt4)">Not yet determined</span>`}
          <div style="display:flex;flex-direction:column;gap:7px;margin-top:12px">
            <button class="btn btn-purple" onclick="toast('Dispo planning — opening...')">🚪 Dispo Planning →</button>
            <button class="btn btn-teal" onclick="switchTab('orders')">📋 Go to Orders tab</button>
          </div>
        </div>
        <div class="glass" style="padding:13px;flex:1">
          <div class="section-title">Full encounter</div>
          <div style="font-family:var(--ff-sans);font-size:11px;color:var(--txt3);line-height:1.6;margin-bottom:10px">Advanced documentation, procedure logs, and split/shared attestation.</div>
          <button class="btn btn-blue" onclick="toast('Opening full encounter...')">Open Full Encounter →</button>
        </div>
      </div>
    </div>
  </div>`;
}

// ── TAB: ORDERS ──────────────────────────────────────────────────────────────
function renderOrdersTab(p){
  const orders=p.orders||[{n:"BMP / CBC",type:"lab",status:"pending",ts:"14:20"},{n:"Troponin I (hsTn)",type:"lab",status:"pending",ts:"14:21"},{n:"CT Head w/o",type:"imaging",status:"pending",ts:"14:25"},{n:"NS 1L IV bolus",type:"med",status:"running",ts:"14:15"},{n:"Aspirin 324mg PO",type:"med",status:"given",ts:"14:10"}];
  const catList=ROC_INLINE[state.orderCat]||[];
  const acc=T.cyan;
  const catColors={labs:T.cyan,imaging:T.purple,meds:T.gold,consults:T.blue};
  const cats=Object.keys(catColors);
  const selCount=Object.keys(state.selOrders).length;
  const tyColor={lab:T.cyan,imaging:T.purple,med:T.gold,consult:T.blue};
  const stColor={pending:T.gold,given:T.green,running:T.teal};
  return`<div class="orders-pane fade-in" style="height:100%">
    <div class="orders-catalog">
      <div class="cat-tabs">
        ${cats.map(c=>`<button class="cat-tab ${state.orderCat===c?"active":""}" onclick="state.orderCat='${c}';switchTab('orders')" style="${state.orderCat===c?"border-bottom-color:"+catColors[c]+";color:"+catColors[c]+";background:"+catColors[c]+"10":""}">${c}</button>`).join("")}
      </div>
      <div class="order-list">
        <div style="font-family:var(--ff-mono);font-size:7px;font-weight:700;color:var(--txt4);text-transform:uppercase;letter-spacing:.12em;padding:5px 2px 4px">Common</div>
        ${catList.filter(o=>o.c).map(o=>`<div class="order-row ${state.selOrders[o.id]?"sel":""}" onclick="toggleOrder('${o.id}','${o.n}')"><div class="order-chk ${state.selOrders[o.id]?"checked":""}">${state.selOrders[o.id]?"✓":""}</div><span style="font-family:var(--ff-sans);font-size:12px;color:${state.selOrders[o.id]?T.txt:T.txt2};flex:1">${o.n}</span></div>`).join("")}
        <div style="font-family:var(--ff-mono);font-size:7px;font-weight:700;color:var(--txt4);text-transform:uppercase;letter-spacing:.12em;padding:7px 2px 4px;border-top:1px solid rgba(26,53,85,0.3);margin-top:4px">More</div>
        ${catList.filter(o=>!o.c).map(o=>`<div class="order-row ${state.selOrders[o.id]?"sel":""}" onclick="toggleOrder('${o.id}','${o.n}')"><div class="order-chk ${state.selOrders[o.id]?"checked":""}">${state.selOrders[o.id]?"✓":""}</div><span style="font-family:var(--ff-sans);font-size:12px;color:${state.selOrders[o.id]?T.txt:T.txt2};flex:1">${o.n}</span></div>`).join("")}
      </div>
      <div class="order-cart">
        ${selCount>0?`<div class="cart-pills">${Object.entries(state.selOrders).map(([id,n])=>`<span class="cart-pill" onclick="toggleOrder('${id}','${n}')">${n} <span style="color:var(--txt4);font-size:9px">✕</span></span>`).join("")}</div>`:""}
        <div style="display:flex;align-items:center;gap:7px">
          <button id="stat-btn" onclick="toggleStat()" style="display:flex;align-items:center;gap:5px;padding:6px 10px;background:rgba(26,53,85,0.28);border:1px solid var(--line);border-radius:7px;color:var(--txt4);cursor:pointer;font-family:var(--ff-mono);font-size:9px;font-weight:700">
            <span style="width:6px;height:6px;border-radius:50%;background:var(--txt4);display:inline-block" id="stat-dot"></span><span id="stat-label">Routine</span>
          </button>
          ${selCount>0?`<button onclick="clearOrders()" style="padding:6px 9px;background:transparent;border:1px solid var(--line);border-radius:7px;color:var(--txt4);cursor:pointer;font-family:var(--ff-mono);font-size:9px">Clear</button>`:""}
          <div style="flex:1"></div>
          <button id="place-btn" onclick="placeOrders()" style="display:flex;align-items:center;gap:7px;padding:7px 16px;background:${selCount>0||state.placed?`linear-gradient(135deg,${T.teal}2a,${T.teal}0a)`:"rgba(26,53,85,0.18)"};border:1.5px solid ${selCount>0||state.placed?T.teal+"55":"rgba(26,53,85,0.35)"};border-radius:9px;color:${selCount>0||state.placed?T.teal:T.txt4};cursor:${selCount>0?"pointer":"not-allowed"};font-family:var(--ff-sans);font-size:12px;font-weight:700;transition:all .18s">
            ${state.placing?`<span class="spinner"></span> Placing...`:state.placed?`✓ Orders placed`:`Place orders ${selCount>0?`<span style="font-family:var(--ff-mono);font-size:10px;background:rgba(0,0,0,0.2);border-radius:10px;padding:1px 6px">${selCount}</span>`:""}`}
          </button>
        </div>
      </div>
    </div>
    <div class="orders-active">
      <div style="padding:9px 12px 7px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
        <div class="section-title" style="margin-bottom:0">Active orders</div>
        <div style="display:flex;gap:5px">
          <span class="badge" style="color:var(--gold);background:rgba(245,200,66,0.1);border:1px solid rgba(245,200,66,0.3)">${orders.filter(o=>o.status==="pending").length} pending</span>
          <span class="badge" style="color:var(--teal);background:rgba(0,229,192,0.1);border:1px solid rgba(0,229,192,0.3)">${orders.length} total</span>
        </div>
      </div>
      <div style="flex:1;overflow-y:auto;padding:6px 10px">
        ${orders.map(o=>`<div style="display:flex;align-items:flex-start;padding:8px 8px 8px 11px;border-bottom:1px solid rgba(26,53,85,0.2);border-left:2px solid ${tyColor[o.type]||T.txt3};margin-bottom:3px;background:rgba(26,53,85,0.15);border-radius:0 6px 6px 0">
          <div style="flex:1;min-width:0">
            <div style="font-family:var(--ff-sans);font-size:11px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:4px">${o.n}</div>
            <div style="display:flex;align-items:center;gap:6px">
              <span class="badge" style="color:${tyColor[o.type]||T.txt3};background:${tyColor[o.type]||T.txt3}18;border:1px solid ${tyColor[o.type]||T.txt3}33;text-transform:uppercase;letter-spacing:.06em">${o.type}</span>
              <span style="font-family:var(--ff-mono);font-size:8px;color:${stColor[o.status]||T.txt4}">${o.status}</span>
              <span style="font-family:var(--ff-mono);font-size:8px;color:var(--txt4)">${o.ts}</span>
            </div>
          </div>
        </div>`).join("")}
      </div>
    </div>
  </div>`;
}

function attachOrderEvents(){/* clicks handled via inline onclick */}
function toggleOrder(id,name){if(state.selOrders[id])delete state.selOrders[id];else state.selOrders[id]=name;renderWsContent();}
function clearOrders(){state.selOrders={};state.placed=false;renderWsContent();}
function toggleStat(){state.stat=!state.stat;const btn=document.getElementById("stat-btn");const dot=document.getElementById("stat-dot");const lbl=document.getElementById("stat-label");if(btn){btn.style.background=state.stat?"rgba(255,68,68,0.1)":"rgba(26,53,85,0.28)";btn.style.borderColor=state.stat?T.red+"55":"rgba(26,53,85,0.5)";btn.style.color=state.stat?T.red:T.txt4;}if(dot)dot.style.background=state.stat?T.red:T.txt4;if(lbl)lbl.textContent=state.stat?"STAT":"Routine";}
function placeOrders(){if(Object.keys(state.selOrders).length===0||state.placing||state.placed)return;state.placing=true;renderWsContent();setTimeout(()=>{state.placing=false;state.placed=true;renderWsContent();setTimeout(()=>{state.selOrders={};state.placed=false;renderWsContent();},2000);},1300);}

// ── TAB: RESULTS ─────────────────────────────────────────────────────────────
function renderResultsTab(p){
  const labs=deriveLabs(p);
  const acked=state.ackedLabs;
  const rows=labs.map((r,i)=>{
    const fc=flagColor(r);
    const fl=r.crit?"CRITICAL":typeof r.v==="number"&&r.lo!=null?(r.v<r.lo?"LOW":r.v>r.hi?"HIGH":null):null;
    return`<div class="trow ${r.crit&&!acked[i]?"pulse":""}" style="border-left-color:${fc===T.green?"transparent":fc};background:${r.crit?"rgba(255,68,68,0.05)":"transparent"}">
      <span class="td-name">${r.n}</span>
      <span class="td-val" style="color:${fc};font-size:${r.crit?11:14}px">${r.v}</span>
      <span class="td-ref">${r.lo!=null&&r.hi!=null?`${r.lo} – ${r.hi}`:""}</span>
      <span class="td-delta" style="color:${r.d?T.gold:T.txt4}">${r.d||"—"}</span>
      <span class="td-ts">${r.ts||""}</span>
      <span>${fl?(r.crit&&!acked[i]?`<button onclick="ackLab(${i})" style="font-family:var(--ff-mono);font-size:8px;font-weight:700;color:${T.red};background:rgba(255,68,68,0.12);border:1px solid ${T.red}55;border-radius:5px;padding:2px 8px;cursor:pointer">ACK CRIT</button>`:`<span class="badge" style="color:${r.crit&&acked[i]?T.green:fc};background:${r.crit&&acked[i]?T.green:fc}18;border:1px solid ${r.crit&&acked[i]?T.green:fc}44">${r.crit&&acked[i]?"✓ ACKD":fl}</span>`):""}</span>
    </div>`;}).join("");
  return`<div class="tab-pane fade-in">
    <div class="section-title">Lab results</div>
    <div class="glass results-table" style="margin-bottom:14px">
      <div class="thead"><span class="th">Test</span><span class="th">Value</span><span class="th">Ref. range</span><span class="th">Δ</span><span class="th">Time</span><span class="th">Flag</span></div>
      ${rows}
    </div>
    <div class="section-title">Imaging</div>
    <div class="glass" style="padding:14px;font-family:var(--ff-sans);font-size:12px;color:var(--txt4);text-align:center">
      ${p.mins>20?`<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--line)"><div><div style="font-family:var(--ff-sans);font-size:12px;font-weight:600;margin-bottom:3px">CT Head w/o Contrast</div><div style="font-family:var(--ff-mono);font-size:9px;color:var(--txt4)">14:25 · pending</div></div><span class="badge" style="color:var(--gold);background:rgba(245,200,66,0.1);border:1px solid rgba(245,200,66,0.3)">pending</span></div>`:
      `No imaging orders active for this encounter.`}
    </div>
  </div>`;
}
function ackLab(i){state.ackedLabs[i]=true;renderWsContent();}

// ── TAB: VITALS TREND ────────────────────────────────────────────────────────
function renderVitalsTab(p){
  const sets=[0,1,2,3].map(i=>({...vitalSet(p,i),ts:new Date(Date.now()-((3-i)*Math.max(15,Math.floor(p.mins/4)))*60000).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:false})}));
  const defs=["HR","BP","SpO2","RR","Temp","GCS"];
  const rows=defs.map(key=>{
    const vals=sets.map(s=>s[key]);
    const tr=trendArrow(key,vals);
    return`<div class="trend-row glass" style="display:grid;grid-template-columns:100px repeat(4,1fr) 40px;background:var(--card);border-radius:0;margin-bottom:1px">
      <div><div class="trend-label">${key}</div><div class="trend-unit">${{HR:"bpm",BP:"mmHg",SpO2:"%",RR:"/min",Temp:"°F",GCS:""}[key]||""}</div></div>
      ${vals.map((val,i)=>{const c=vColor(key,val),isLast=i===3;return`<div class="trend-cell ${isLast?"last":""}" style="background:${isLast&&c!==T.green?c+"0f":"transparent"}"><span style="font-family:var(--ff-mono);font-size:${key==="BP"?11:15}px;font-weight:${isLast?700:400};color:${c}">${val}</span></div>`}).join("")}
      <div class="trend-arrow" style="color:${tr.color}">${tr.icon}</div>
    </div>`;}).join("");
  return`<div class="tab-pane fade-in">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <div class="section-title" style="margin-bottom:0">Vital trend — last 4 sets</div>
      <span style="font-family:var(--ff-mono);font-size:9px;color:var(--txt4)">most recent column highlighted →</span>
    </div>
    <div class="glass" style="overflow:hidden;border-radius:12px">
      <div style="display:grid;grid-template-columns:100px repeat(4,1fr) 40px;padding:8px 12px;background:rgba(26,53,85,0.3);border-bottom:1px solid var(--line)">
        <span style="font-family:var(--ff-mono);font-size:8px;color:var(--txt4);text-transform:uppercase;letter-spacing:.1em">Vital</span>
        ${sets.map(s=>`<span style="font-family:var(--ff-mono);font-size:8px;color:var(--txt4);text-align:center">${s.ts}</span>`).join("")}
        <span style="font-family:var(--ff-mono);font-size:8px;color:var(--txt4);text-align:center">Trend</span>
      </div>
      ${rows}
    </div>
    <div style="font-family:var(--ff-sans);font-size:11px;color:var(--txt4);margin-top:10px;line-height:1.6">Red = outside normal · Gold = borderline · Green = within normal · Trend arrows account for expected direction per vital.</div>
  </div>`;
}

// ── TAB: MEDS ────────────────────────────────────────────────────────────────
function renderMedsTab(p){
  const cc=(p.cc||"").toLowerCase();
  const isCardiac=["chest","stemi","cardiac","arrest"].some(k=>cc.includes(k));
  const isSepsis=["sepsis","fever","hypotension"].some(k=>cc.includes(k));
  const allergies=isCardiac?[{allergen:"Penicillin",reaction:"Rash",sev:"moderate"}]:isSepsis?[{allergen:"Ibuprofen",reaction:"GI bleeding",sev:"severe"}]:[];
  const sevColor={severe:T.red,moderate:T.orange,mild:T.gold};
  const activeMeds=[{n:"Aspirin 324mg PO",status:"given",ts:"14:10"},{n:"NS 1L IV bolus",status:"running",ts:"14:15"}];
  const homeMeds=isCardiac?["Metoprolol succinate 50mg PO daily","Atorvastatin 40mg PO daily","Aspirin 81mg PO daily"]:isSepsis?["Lisinopril 10mg PO daily","Metformin 500mg PO BID"]:["No home medications on file"];
  const stColor={given:T.green,running:T.teal,pending:T.gold};
  return`<div class="tab-pane fade-in">
    <div>
      <div class="section-title">Allergies</div>
      ${allergies.length===0?`<div class="glass" style="padding:10px 14px;color:var(--green);font-family:var(--ff-sans);font-size:12px;border-left:3px solid var(--green)">✓ No known allergies on file</div>`:
      allergies.map(a=>`<div class="allergy-card glass" style="border-left:3px solid ${sevColor[a.sev]||T.gold}">
        <div><div style="font-family:var(--ff-sans);font-size:12px;font-weight:600;margin-bottom:3px">${a.allergen}</div><div style="font-family:var(--ff-sans);font-size:11px;color:var(--txt3)">Reaction: ${a.reaction}</div></div>
        <span class="badge" style="color:${sevColor[a.sev]||T.gold};background:${sevColor[a.sev]||T.gold}18;border:1px solid ${sevColor[a.sev]||T.gold}44;text-transform:capitalize">${a.sev}</span>
      </div>`).join("")}
    </div>
    <div>
      <div class="section-title">ED medications — this encounter</div>
      <div class="glass" style="overflow:hidden;border-radius:12px">
        ${activeMeds.map(m=>`<div class="med-row" style="border-left:2px solid ${stColor[m.status]||T.txt4}">
          <div style="flex:1;min-width:0"><div style="font-family:var(--ff-sans);font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.n}</div><div style="font-family:var(--ff-mono);font-size:9px;color:var(--txt4);margin-top:3px">${m.ts}</div></div>
          <span class="badge" style="color:${stColor[m.status]||T.txt4};background:${stColor[m.status]||T.txt4}14;border:1px solid ${stColor[m.status]||T.txt4}44">${m.status}</span>
        </div>`).join("")}
      </div>
    </div>
    <div>
      <div class="section-title">Home medications</div>
      <div class="glass" style="overflow:hidden;border-radius:12px">
        ${homeMeds.map(m=>`<div class="med-row" style="border-left:2px solid rgba(90,130,168,0.35)">
          <span style="font-family:var(--ff-sans);font-size:12px;color:var(--txt2);flex:1">${m}</span>
          <span class="badge" style="color:var(--txt4);background:rgba(26,53,85,0.4)">home</span>
        </div>`).join("")}
      </div>
      <div style="margin-top:10px;display:flex;gap:8px">
        <button class="btn btn-teal btn-sm" onclick="toast('Add medication — opening...')">+ Add medication</button>
        <button class="btn btn-gold btn-sm" onclick="toast('Med reconciliation — opening...')">Reconcile home meds</button>
      </div>
    </div>
  </div>`;
}

// ── SHIFT RAIL ───────────────────────────────────────────────────────────────
function renderShiftRail(){
  const pts=PATIENTS;
  const critPts=pts.filter(p=>p.flags.some(f=>["STEMI","Stroke","Sepsis"].includes(f)));
  const avgLOS=pts.length?Math.round(pts.reduce((s,p)=>s+p.mins,0)/pts.length):0;
  const stalePts=pts.filter(p=>p.mins>80);
  const esiCounts={1:0,2:0,3:0,4:0,5:0};pts.forEach(p=>esiCounts[p.esi]=(esiCounts[p.esi]||0)+1);
  const dtdColor=m=>m>60?T.red:m>30?T.gold:T.green;
  const esiBarColor={1:T.red,2:T.orange,3:T.gold,4:T.green,5:T.txt4};
  document.getElementById("shift-content").innerHTML=`
    <div class="sr-grid">
      <div class="sr-metric"><div class="sr-metric-val" style="color:var(--teal)">${pts.length}</div><div class="sr-metric-label">Total Pts</div></div>
      <div class="sr-metric"><div class="sr-metric-val" style="color:var(--coral)">${pts.filter(p=>p.esi<=2).length}</div><div class="sr-metric-label">ESI 1–2</div></div>
      <div class="sr-metric"><div class="sr-metric-val" style="color:var(--red)">${critPts.length}</div><div class="sr-metric-label">Crit Alerts</div></div>
      <div class="sr-metric"><div class="sr-metric-val" style="color:var(--gold)">${avgLOS}m</div><div class="sr-metric-label">Avg LOS</div></div>
    </div>
    <div class="glass" style="padding:11px 12px;margin-bottom:14px;border-radius:10px">
      <div class="sr-section-title">Time-to-Event</div>
      <div class="sr-row"><div><div class="sr-row-label">Avg Door-to-Doc</div><div class="sr-row-sub">Target ≤30m</div></div><div class="sr-row-val" style="color:${dtdColor(22)}">22m</div></div>
      <div class="sr-row"><div><div class="sr-row-label">Longest Door-to-Doc</div><div class="sr-row-sub">A4 · L. Sanchez</div></div><div class="sr-row-val" style="color:${dtdColor(47)}">47m</div></div>
      <div style="height:1px;background:var(--line);margin:8px 0"></div>
      <div class="sr-row"><div class="sr-row-label">EKG ≤10m (Cardiac)</div><div class="sr-row-val" style="color:var(--green)">2 / 2</div></div>
      <div class="sr-row"><div><div class="sr-row-label">Stale Workups >30m</div><div class="sr-row-sub">LOS >45m, no new orders</div></div><div class="sr-row-val" style="color:${stalePts.length>2?T.red:stalePts.length>0?T.gold:T.green}">${stalePts.length}</div></div>
    </div>
    ${stalePts.length>0?`
    <div style="margin-bottom:14px">
      <div class="sr-section-title" style="color:var(--gold)">Stale Workups</div>
      ${stalePts.slice(0,3).map(p=>`<div class="sr-card" onclick="selectPatient('${p.id}')" style="border-left:3px solid var(--gold);background:rgba(245,200,66,0.04)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px">
          <span style="font-family:var(--ff-sans);font-size:11px;font-weight:600">${p.name.split(" ")[0]}</span>
          <span style="font-family:var(--ff-mono);font-size:9px;font-weight:700;color:var(--gold)">${p.mins}m</span>
        </div>
        <div style="font-family:var(--ff-mono);font-size:8px;color:var(--txt4)">${p.room} · LOS extended</div>
      </div>`).join("")}
    </div>`:""}
    ${critPts.length>0?`
    <div style="margin-bottom:14px">
      <div class="sr-section-title" style="color:var(--red)">Critical — Needs Attention</div>
      ${critPts.map(p=>`<div class="sr-card" onclick="selectPatient('${p.id}')" style="border-left:3px solid var(--red);background:rgba(255,68,68,0.05)">
        <div style="font-family:var(--ff-sans);font-size:12px;font-weight:600;margin-bottom:2px">${p.name}</div>
        <div style="font-family:var(--ff-mono);font-size:9px;color:var(--txt4);margin-bottom:4px">${p.room} · ${p.cc.substring(0,30)}</div>
        ${p.flags.map(f=>`<div style="font-family:var(--ff-sans);font-size:11px;color:var(--red);line-height:1.4">🚨 ${f} alert</div>`).join("")}
      </div>`).join("")}
    </div>`:""}
    <div style="margin-bottom:14px">
      <div class="sr-section-title">ESI Breakdown</div>
      ${[1,2,3,4,5].map(esi=>{const c=esiBarColor[esi],cnt=esiCounts[esi]||0,pct=pts.length?(cnt/pts.length)*100:0;return`<div class="esi-bar-row"><span style="font-family:var(--ff-mono);font-size:9px;color:${c};min-width:36px">ESI ${esi}</span><div class="esi-bar-track"><div class="esi-bar-fill" style="width:${pct}%;background:${c}"></div></div><span style="font-family:var(--ff-mono);font-size:9px;color:var(--txt4);min-width:12px;text-align:right">${cnt}</span></div>`;}).join("")}
    </div>`;
}

// ── COMMAND PALETTE ──────────────────────────────────────────────────────────
let palIdx=0;
function openPalette(){state.paletteOpen=true;document.getElementById("palette-overlay").classList.remove("hidden");document.getElementById("pal-input").value="";document.getElementById("pal-input").focus();palIdx=0;renderPalette();}
function closePalette(){state.paletteOpen=false;document.getElementById("palette-overlay").classList.add("hidden");}
function renderPalette(){
  const q=(document.getElementById("pal-input")?.value||"").toLowerCase().trim();
  const items=[];
  // actions
  items.push({type:"section",label:"Actions"});
  [{icon:"✏️",label:"Quick Note",sub:"Fast bedside documentation",badge:"Action",bc:T.teal},{icon:"⚡",label:"Command Center",sub:"Return to census board",badge:"Action",bc:T.purple}].filter(a=>!q||a.label.toLowerCase().includes(q)).forEach(a=>items.push({type:"item",...a}));
  // patients
  const pts=PATIENTS.filter(p=>!q||[p.name,p.cc,p.room].some(s=>(s||"").toLowerCase().includes(q)));
  if(pts.length){items.push({type:"section",label:"Patients"});pts.slice(0,5).forEach(p=>items.push({type:"item",icon:"👤",label:p.name,sub:`${p.room} · ${p.cc} · ESI ${p.esi}`,badge:`ESI ${p.esi}`,bc:esiColor(p.esi),action:()=>selectPatient(p.id)}));}
  // hubs
  const hubs=HUBS.filter(([k,l])=>!q||l.toLowerCase().includes(q)||k.toLowerCase().includes(q));
  if(hubs.length){items.push({type:"section",label:"Clinical Hubs"});hubs.slice(0,8).forEach(([k,l,i])=>items.push({type:"item",icon:i,label:l,sub:"Clinical hub",badge:"Hub",bc:T.purple}));}
  // render
  const itemEls=items.filter(i=>i.type==="item");
  document.getElementById("pal-results").innerHTML=items.map((item,idx)=>{
    if(item.type==="section")return`<div class="pal-section">${item.label}</div>`;
    const iIdx=itemEls.indexOf(item);
    return`<div class="pal-item ${iIdx===palIdx?"active":""}" onmouseenter="palIdx=${iIdx}" onclick="palActivate(${iIdx})">
      <span class="p-icon">${item.icon}</span>
      <div style="flex:1;min-width:0"><div class="p-label">${item.label}</div><div class="p-sub">${item.sub||""}</div></div>
      <span class="p-badge" style="color:${item.bc};background:${item.bc}18;border:1px solid ${item.bc}33">${item.badge}</span>
    </div>`;
  }).join("")||`<div style="padding:32px 20px;text-align:center"><div style="font-size:28px;margin-bottom:8px">🔍</div><div style="font-family:var(--ff-sans);font-size:13px;color:var(--txt4)">No results</div></div>`;
  window._palItems=itemEls;
}
function palActivate(idx){const items=window._palItems||[];if(items[idx]?.action){items[idx].action();closePalette();}else{toast(items[idx]?.label||"Opening...");closePalette();}}
function palKey(e){const items=window._palItems||[];if(e.key==="ArrowDown"){e.preventDefault();palIdx=Math.min(palIdx+1,items.length-1);renderPalette();}else if(e.key==="ArrowUp"){e.preventDefault();palIdx=Math.max(palIdx-1,0);renderPalette();}else if(e.key==="Enter"){e.preventDefault();palActivate(palIdx);}else if(e.key==="Escape"){closePalette();}}

// ── CLOCK ────────────────────────────────────────────────────────────────────
function updateClock(){
  const now=new Date();
  const cl=document.getElementById("clock");const dt=document.getElementById("date");
  if(cl)cl.textContent=now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
  if(dt)dt.textContent=now.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
}

// ── KEYBOARD ─────────────────────────────────────────────────────────────────
document.addEventListener("keydown",e=>{
  if((e.metaKey||e.ctrlKey)&&e.key==="k"){e.preventDefault();state.paletteOpen?closePalette():openPalette();return;}
  if(state.paletteOpen)return;
  const tag=(e.target?.tagName||"");
  if(tag==="INPUT"||tag==="TEXTAREA")return;
  const n=parseInt(e.key);
  if(n>=1&&n<=5&&state.selectedId){e.preventDefault();switchTab(["overview","orders","results","vitals","meds"][n-1]);}
  if(e.key==="Escape")closePalette();
});

// ── INIT ─────────────────────────────────────────────────────────────────────
updateClock();setInterval(updateClock,1000);
renderCensus();renderShiftRail();
</script>
</body>
</html>