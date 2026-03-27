import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

const EDOrders = () => {
  /* ══════════════════════════════════════════
     DESIGN TOKENS & STYLING
  ══════════════════════════════════════════ */
  const T = {
    bg: '#050f1e',
    bgP: '#081628',
    bgC: '#0b1e36',
    bgU: '#0e2544',
    bd: '#1a3555',
    bdHi: '#2a4f7a',
    blue: '#3b9eff',
    teal: '#00e5c0',
    gold: '#f5c842',
    coral: '#ff6b6b',
    orange: '#ff9f43',
    purple: '#9b6dff',
    txt: '#e8f0fe',
    txt2: '#8aaccc',
    txt3: '#4a6a8a',
    txt4: '#2e4a6a',
  };

  const CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; overflow: hidden; }
body { font-family: 'DM Sans', sans-serif; font-size: 14px; color: ${T.txt}; background: ${T.bg}; display: flex; flex-direction: column; }
button { font-family: 'DM Sans', sans-serif; cursor: pointer; }
input, textarea { font-family: 'DM Sans', sans-serif; }
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-thumb { background: ${T.bd}; border-radius: 2px; }
::-webkit-scrollbar-track { background: transparent; }

.topbar { flex-shrink: 0; height: 52px; background: ${T.bgP}; border-bottom: 1px solid ${T.bd}; display: flex; align-items: center; padding: 0 16px; gap: 10px; z-index: 200; }
.logo-box { width: 30px; height: 30px; background: ${T.blue}; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 12px; font-weight: 700; color: #fff; flex-shrink: 0; }
.breadcrumb { display: flex; align-items: center; gap: 5px; font-size: 12px; }
.bc-sep { color: ${T.txt4}; }
.bc-link { color: ${T.txt3}; cursor: pointer; text-decoration: none; transition: color .15s; }
.bc-link:hover { color: ${T.txt2}; }
.bc-cur { color: ${T.txt}; font-weight: 600; }
.vsep { width: 1px; height: 18px; background: ${T.bd}; flex-shrink: 0; }
.pt-pill { background: ${T.bgU}; border: 1px solid ${T.bd}; border-radius: 20px; padding: 3px 11px; display: flex; align-items: center; gap: 6px; font-size: 12px; }
.pt-name { font-family: 'Playfair Display', serif; font-weight: 600; color: ${T.txt}; }
.pt-meta { color: ${T.txt3}; font-size: 11px; }
.allergy-pill { background: rgba(255,107,107,.1); border: 1px solid rgba(255,107,107,.3); border-radius: 20px; padding: 3px 9px; font-size: 11px; color: ${T.coral}; font-weight: 600; display: flex; align-items: center; gap: 4px; cursor: pointer; transition: background .15s; }
.allergy-pill:hover { background: rgba(255,107,107,.18); }
.topbar-right { margin-left: auto; display: flex; align-items: center; gap: 6px; }
.btn-ghost { background: ${T.bgU}; border: 1px solid ${T.bd}; border-radius: 6px; padding: 4px 10px; font-size: 11px; color: ${T.txt2}; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; transition: all .15s; white-space: nowrap; }
.btn-ghost:hover { border-color: ${T.bdHi}; color: ${T.txt}; }
.btn-teal { background: ${T.teal}; color: ${T.bg}; border: none; border-radius: 6px; padding: 4px 11px; font-size: 11px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; transition: filter .15s; white-space: nowrap; }
.btn-teal:hover { filter: brightness(1.12); }
.btn-teal:disabled { background: ${T.bgU}; border: 1px solid ${T.bd}; color: ${T.txt4}; cursor: not-allowed; filter: none; }

.app-layout { flex: 1; display: flex; overflow: hidden; min-height: 0; height: 100%; }
.ai-panel { width: 270px; flex-shrink: 0; background: ${T.bgP}; border-right: 1px solid ${T.bd}; display: flex; flex-direction: column; overflow: hidden; }
.panel-hdr { flex-shrink: 0; padding: 10px 13px 9px; border-bottom: 1px solid ${T.bd}; display: flex; align-items: center; gap: 8px; }
.panel-title { font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 600; color: ${T.txt}; }
.panel-sub { font-size: 10px; color: ${T.txt3}; margin-top: 1px; }
.ai-live-dot { width: 7px; height: 7px; border-radius: 50%; background: ${T.teal}; flex-shrink: 0; animation: aipulse 2s ease-in-out infinite; }
@keyframes aipulse { 0%,100% { box-shadow: 0 0 0 0 rgba(0,229,192,.4); } 50% { box-shadow: 0 0 0 5px rgba(0,229,192,0); } }
.ai-panel-body { flex: 1; overflow-y: auto; padding: 9px 10px; display: flex; flex-direction: column; gap: 7px; }
.add-all-btn { width: 100%; padding: 7px; font-size: 11px; font-weight: 700; background: linear-gradient(135deg,rgba(0,229,192,.13),rgba(59,158,255,.08)); border: 1px solid rgba(0,229,192,.28); border-radius: 8px; color: ${T.teal}; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; transition: all .2s; flex-shrink: 0; }
.add-all-btn:hover { background: linear-gradient(135deg,rgba(0,229,192,.22),rgba(59,158,255,.14)); border-color: rgba(0,229,192,.5); }
.add-all-btn:disabled { opacity: .45; cursor: not-allowed; }

.ai-set { background: ${T.bgC}; border: 1px solid ${T.bd}; border-radius: 12px; overflow: hidden; transition: border-color .15s; }
.ai-set:hover { border-color: ${T.bdHi}; }
.ai-set-hdr { padding: 9px 11px; display: flex; align-items: flex-start; gap: 7px; cursor: pointer; user-select: none; }
.ai-set-hdr:hover { background: rgba(255,255,255,.02); }
.ai-conf { font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 20px; flex-shrink: 0; margin-top: 2px; }
.ai-set-info { flex: 1; min-width: 0; }
.ai-set-name { font-size: 12px; font-weight: 600; color: ${T.txt}; line-height: 1.3; }
.ai-set-basis { font-size: 10px; color: ${T.txt3}; margin-top: 2px; line-height: 1.35; }
.ai-chevron { font-size: 10px; color: ${T.txt4}; transition: transform .2s; flex-shrink: 0; margin-top: 3px; }
.ai-set.open .ai-chevron { transform: rotate(180deg); }
.ai-set-body { display: none; border-top: 1px solid ${T.bd}; padding: 7px 9px; }
.ai-set.open .ai-set-body { display: block; }
.ai-order-row { display: flex; align-items: center; gap: 6px; padding: 4px 5px; border-radius: 6px; font-size: 11px; border: 1px solid transparent; transition: all .12s; cursor: default; }
.ai-order-row.clickable { cursor: pointer; }
.ai-order-row.clickable:hover { background: ${T.bgU}; border-color: ${T.bd}; }
.ai-order-row.clickable:hover .ai-add-icon { background: rgba(0,229,192,.15); border-color: rgba(0,229,192,.5); color: ${T.teal}; }
.ai-order-status-dot { width: 15px; height: 15px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 700; }
.ai-order-status-dot.done { background: rgba(0,229,192,.15); color: ${T.teal}; border: 1px solid rgba(0,229,192,.4); }
.ai-order-status-dot.active { background: rgba(59,158,255,.15); color: ${T.blue}; border: 1px solid rgba(59,158,255,.4); }
.ai-order-status-dot.add { background: rgba(74,106,138,.2); color: ${T.txt3}; border: 1px solid ${T.bd}; }
.ai-order-status-dot.queued { background: rgba(0,229,192,.2); color: ${T.teal}; border: 1px solid rgba(0,229,192,.5); }
.ai-order-status-dot.alert { background: rgba(255,107,107,.15); color: ${T.coral}; border: 1px solid rgba(255,107,107,.3); }
.ai-order-name { flex: 1; color: ${T.txt2}; line-height: 1.3; }
.ai-order-note { font-size: 9px; color: ${T.txt4}; white-space: nowrap; }
.ai-add-icon { width: 18px; height: 18px; border-radius: 4px; flex-shrink: 0; background: ${T.bgU}; border: 1px solid ${T.bd}; color: ${T.txt3}; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; transition: all .12s; }
.ai-set-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 7px; padding-top: 6px; border-top: 1px solid rgba(26,53,85,.5); }
.ai-add-set-btn { font-size: 11px; font-weight: 600; color: ${T.teal}; background: rgba(0,229,192,.1); border: 1px solid rgba(0,229,192,.22); border-radius: 5px; padding: 3px 9px; cursor: pointer; transition: all .15s; }
.ai-add-set-btn:hover { background: rgba(0,229,192,.2); }
.ai-panel-footer { flex-shrink: 0; padding: 8px 10px; border-top: 1px solid ${T.bd}; }
.btn-ai-analyze { width: 100%; padding: 7px; font-size: 11px; font-weight: 600; background: rgba(155,109,255,.1); border: 1px solid rgba(155,109,255,.28); border-radius: 6px; color: ${T.purple}; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; transition: all .2s; }
.btn-ai-analyze:hover { background: rgba(155,109,255,.2); }
.btn-ai-analyze:disabled { opacity: .5; cursor: not-allowed; }

.catalog-panel { flex: 1; background: ${T.bg}; display: flex; flex-direction: column; overflow: hidden; min-width: 0; min-height: 0; }
.search-row { flex-shrink: 0; padding: 10px 14px 8px; border-bottom: 1px solid ${T.bd}; background: ${T.bgP}; }
.search-wrap { position: relative; display: flex; align-items: center; background: ${T.bgU}; border: 1px solid ${T.bd}; border-radius: 10px; padding: 0 11px; gap: 7px; transition: all .15s; }
.search-wrap:focus-within { border-color: rgba(0,229,192,.5); box-shadow: 0 0 0 3px rgba(0,229,192,.07); }
.search-icon { font-size: 13px; flex-shrink: 0; pointer-events: none; opacity: .6; }
.search-input { flex: 1; background: transparent; border: none; outline: none; color: ${T.txt}; font-size: 13px; padding: 9px 0; }
.search-input::placeholder { color: ${T.txt4}; }
.search-clear { background: none; border: none; color: ${T.txt4}; font-size: 13px; cursor: pointer; width: 20px; height: 20px; border-radius: 4px; display: none; align-items: center; justify-content: center; flex-shrink: 0; transition: all .12s; }
.search-clear.vis { display: flex; }
.search-clear:hover { background: rgba(255,107,107,.15); color: ${T.coral}; }

.quick-row { flex-shrink: 0; padding: 6px 13px; border-bottom: 1px solid ${T.bd}; background: ${T.bgP}; display: flex; align-items: center; gap: 5px; overflow-x: auto; }
.quick-lbl { font-size: 10px; color: ${T.txt4}; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; white-space: nowrap; flex-shrink: 0; }
.quick-chip { padding: 3px 9px; border-radius: 20px; font-size: 11px; cursor: pointer; white-space: nowrap; flex-shrink: 0; background: ${T.bgU}; border: 1px solid ${T.bd}; color: ${T.txt3}; transition: all .15s; }
.quick-chip:hover { border-color: ${T.teal}; color: ${T.teal}; background: rgba(0,229,192,.07); }

.cat-row { flex-shrink: 0; display: flex; align-items: center; gap: 3px; padding: 7px 13px; border-bottom: 1px solid ${T.bd}; background: ${T.bgP}; overflow-x: auto; }
.cat-chip { padding: 4px 11px; border-radius: 20px; font-size: 11px; font-weight: 500; cursor: pointer; transition: all .15s; white-space: nowrap; background: ${T.bgU}; border: 1px solid ${T.bd}; color: ${T.txt3}; flex-shrink: 0; }
.cat-chip:hover { border-color: ${T.bdHi}; color: ${T.txt2}; }
.cat-chip.active { background: rgba(59,158,255,.12); border-color: rgba(59,158,255,.4); color: ${T.blue}; font-weight: 600; }

.catalog-body { flex: 1; overflow-y: auto; padding: 13px 14px 64px; display: flex; flex-direction: column; gap: 14px; min-height: 0; }
.cat-section-title { font-size: 10px; color: ${T.txt3}; text-transform: uppercase; letter-spacing: .08em; font-weight: 600; margin-bottom: 7px; display: flex; align-items: center; gap: 6px; }
.cat-section-title::after { content: ''; flex: 1; height: 1px; background: ${T.bd}; }
.orders-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }

.order-card { background: ${T.bgP}; border: 1px solid ${T.bd}; border-radius: 8px; padding: 7px 9px; cursor: pointer; transition: all .15s; display: flex; flex-direction: column; gap: 2px; position: relative; user-select: none; }
.order-card:hover { border-color: ${T.bdHi}; background: ${T.bgC}; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,.3); }
.order-card.in-queue { border-color: rgba(0,229,192,.35); background: rgba(0,229,192,.03); }
.order-card.in-queue:hover { border-color: rgba(255,107,107,.4); background: rgba(255,107,107,.04); }
.oc-top { display: flex; align-items: flex-start; gap: 6px; }
.oc-icon { font-size: 12px; flex-shrink: 0; line-height: 1.2; }
.oc-name { font-size: 11px; font-weight: 600; color: ${T.txt}; line-height: 1.3; flex: 1; padding-right: 18px; }
.oc-check { position: absolute; top: 6px; right: 6px; width: 14px; height: 14px; border-radius: 50%; background: ${T.teal}; color: ${T.bg}; font-size: 8px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.oc-meta { font-size: 9.5px; color: ${T.txt3}; line-height: 1.35; }
.oc-footer { display: flex; align-items: center; gap: 3px; margin-top: 2px; flex-wrap: wrap; }
.prio-badge { font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 20px; }
.prio-STAT { background: rgba(255,107,107,.15); color: ${T.coral}; border: 1px solid rgba(255,107,107,.3); }
.prio-URGENT { background: rgba(255,159,67,.12); color: ${T.orange}; border: 1px solid rgba(255,159,67,.3); }
.prio-ROUTINE { background: rgba(0,229,192,.1); color: ${T.teal}; border: 1px solid rgba(0,229,192,.25); }
.allergy-chip { font-size: 10px; color: ${T.coral}; background: rgba(255,107,107,.1); border: 1px solid rgba(255,107,107,.25); border-radius: 4px; padding: 1px 5px; display: inline-flex; align-items: center; gap: 3px; }
.no-results { padding: 40px 20px; text-align: center; color: ${T.txt3}; font-size: 13px; }

.queue-panel { width: 312px; flex-shrink: 0; background: ${T.bgP}; border-left: 1px solid ${T.bd}; display: flex; flex-direction: column; overflow: hidden; }
.queue-hdr { flex-shrink: 0; padding: 10px 13px 9px; border-bottom: 1px solid ${T.bd}; display: flex; align-items: center; gap: 8px; }
.queue-count-badge { background: rgba(59,158,255,.14); border: 1px solid rgba(59,158,255,.33); border-radius: 20px; padding: 1px 8px; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; color: ${T.blue}; }
.queue-body { flex: 1; overflow-y: auto; padding: 7px 9px; display: flex; flex-direction: column; gap: 4px; }
.empty-queue { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 20px; text-align: center; }
.empty-icon { font-size: 32px; opacity: .25; }
.empty-text { font-size: 13px; color: ${T.txt3}; }
.empty-sub { font-size: 11px; color: ${T.txt4}; }
.empty-hint { margin-top: 4px; font-size: 11px; color: rgba(0,229,192,.5); display: flex; align-items: center; gap: 4px; }

.queue-item { background: ${T.bgC}; border: 1px solid ${T.bd}; border-radius: 8px; overflow: hidden; transition: border-color .15s; animation: qin .2s ease-out; }
@keyframes qin { 0% { opacity: 0; transform: translateX(16px); } 100% { opacity: 1; transform: translateX(0); } }
.queue-item:hover { border-color: ${T.bdHi}; }
.qi-row { display: flex; align-items: center; gap: 7px; padding: 8px 9px; cursor: pointer; user-select: none; }
.prio-pill { font-family: 'JetBrains Mono', monospace; font-size: 8px; font-weight: 700; padding: 2px 5px; border-radius: 3px; flex-shrink: 0; cursor: pointer; transition: all .15s; min-width: 42px; text-align: center; }
.prio-pill.STAT { background: rgba(255,107,107,.18); color: ${T.coral}; border: 1px solid rgba(255,107,107,.35); }
.prio-pill.URGENT { background: rgba(255,159,67,.14); color: ${T.orange}; border: 1px solid rgba(255,159,67,.32); }
.prio-pill.ROUTINE { background: rgba(0,229,192,.1); color: ${T.teal}; border: 1px solid rgba(0,229,192,.28); }
.prio-pill:hover { filter: brightness(1.2); transform: scale(1.05); }
.qi-info { flex: 1; min-width: 0; }
.qi-name { font-size: 12px; font-weight: 600; color: ${T.txt}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.qi-detail { font-size: 10px; color: ${T.txt3}; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.qi-chevron { font-size: 9px; color: ${T.txt4}; transition: transform .2s; flex-shrink: 0; }
.queue-item.open .qi-chevron { transform: rotate(180deg); }
.qi-remove { width: 19px; height: 19px; border-radius: 4px; background: none; border: none; color: ${T.txt4}; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .12s; flex-shrink: 0; }
.qi-remove:hover { background: rgba(255,107,107,.15); color: ${T.coral}; }

.qi-expand { display: none; border-top: 1px solid rgba(26,53,85,.5); padding: 9px; background: rgba(8,22,40,.5); }
.queue-item.open .qi-expand { display: block; }
.qi-field { margin-bottom: 7px; }
.qi-field-lbl { font-size: 9px; color: ${T.txt4}; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 3px; font-weight: 600; }
.qi-input { width: 100%; background: ${T.bgC}; border: 1px solid ${T.bd}; border-radius: 5px; padding: 5px 8px; font-size: 11px; color: ${T.txt}; outline: none; transition: border-color .15s; }
.qi-input:focus { border-color: rgba(0,229,192,.5); }
.prio-selector { display: flex; gap: 3px; }
.prio-sel-btn { flex: 1; padding: 4px 3px; font-size: 9px; font-weight: 700; border-radius: 4px; cursor: pointer; border: 1px solid ${T.bd}; background: ${T.bgC}; color: ${T.txt4}; transition: all .15s; font-family: 'JetBrains Mono', monospace; text-align: center; }
.prio-sel-btn.sel.STAT { background: rgba(255,107,107,.18); border-color: ${T.coral}; color: ${T.coral}; }
.prio-sel-btn.sel.URGENT { background: rgba(255,159,67,.14); border-color: ${T.orange}; color: ${T.orange}; }
.prio-sel-btn.sel.ROUTINE { background: rgba(0,229,192,.1); border-color: ${T.teal}; color: ${T.teal}; }
.prio-sel-btn:hover:not(.sel) { border-color: ${T.bdHi}; color: ${T.txt3}; }
.qi-allergy { display: flex; align-items: center; gap: 5px; background: rgba(255,107,107,.08); border: 1px solid rgba(255,107,107,.25); border-radius: 5px; padding: 5px 7px; font-size: 10px; color: ${T.coral}; margin-top: 5px; font-weight: 600; }

.queue-footer { flex-shrink: 0; padding: 10px 12px; border-top: 1px solid ${T.bd}; display: flex; flex-direction: column; gap: 7px; }
.interaction-warning { display: flex; align-items: flex-start; gap: 5px; background: rgba(245,200,66,.07); border: 1px solid rgba(245,200,66,.22); border-radius: 6px; padding: 6px 8px; font-size: 10.5px; color: ${T.gold}; margin-bottom: 2px; }
.queue-stats { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.sign-btn { width: 100%; padding: 9px; font-size: 13px; font-weight: 700; background: linear-gradient(135deg, ${T.teal}, #00bfaa); color: ${T.bg}; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all .2s; box-shadow: 0 4px 16px rgba(0,229,192,.22); }
.sign-btn:hover:not(:disabled) { filter: brightness(1.1); box-shadow: 0 6px 22px rgba(0,229,192,.34); transform: translateY(-1px); }
.sign-btn:active { transform: translateY(0); }
.sign-btn:disabled { background: ${T.bgU}; border: 1px solid ${T.bd}; color: ${T.txt4}; cursor: not-allowed; box-shadow: none; }
.clear-link { width: 100%; text-align: center; font-size: 11px; color: ${T.txt4}; background: none; border: none; cursor: pointer; padding: 3px; transition: color .15s; }
.clear-link:hover { color: ${T.coral}; }

.badge { font-size: 10px; font-family: 'JetBrains Mono', monospace; padding: 1px 7px; border-radius: 20px; font-weight: 600; }
.badge-coral { background: rgba(255,107,107,.12); color: ${T.coral}; border: 1px solid rgba(255,107,107,.25); }
.badge-teal { background: rgba(0,229,192,.1); color: ${T.teal}; border: 1px solid rgba(0,229,192,.25); }
.badge-muted { background: rgba(74,106,138,.2); color: ${T.txt3}; border: 1px solid ${T.bd}; }

.signed-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(5,15,30,.96); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; animation: fadeIn .28s ease-out; }
@keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
.signed-big-icon { font-size: 60px; animation: bounceIn .45s cubic-bezier(.34,1.56,.64,1); }
@keyframes bounceIn { 0% { transform: scale(0); } 100% { transform: scale(1); } }
.signed-title { font-family: 'Playfair Display', serif; font-size: 22px; color: ${T.teal}; }
.signed-sub { font-size: 13px; color: ${T.txt3}; max-width: 320px; text-align: center; }
.signed-badges { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }

.toast { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%) translateY(0); background: ${T.bgC}; border: 1px solid ${T.bdHi}; border-radius: 8px; padding: 7px 14px; font-size: 12px; color: ${T.txt}; z-index: 9999; pointer-events: none; box-shadow: 0 8px 28px rgba(0,0,0,.5); white-space: nowrap; transition: all .28s; }
.toast.hide { transform: translateX(-50%) translateY(30px); opacity: 0; }
  `;

  /* ══════════════════════════════════════════
     ORDER DATABASE
  ══════════════════════════════════════════ */
  const DB = {
    labs: [
      { id: 'l_trop', cat: 'labs', sub: 'Cardiac', icon: '❤️', name: 'Troponin-I (High Sensitivity)', detail: 'Serial q3h · NSTEMI protocol', meta: '~30 min · Cardiac', priority: 'STAT', alert: null, contrast: false },
      { id: 'l_bnp', cat: 'labs', sub: 'Cardiac', icon: '❤️', name: 'BNP (B-Natriuretic Peptide)', detail: 'Heart failure marker', meta: '~45 min · Cardiac', priority: 'STAT', alert: null, contrast: false },
      { id: 'l_ckmb', cat: 'labs', sub: 'Cardiac', icon: '❤️', name: 'CK-MB', detail: 'Cardiac isoenzyme', meta: '~45 min · Cardiac', priority: 'URGENT', alert: null, contrast: false },
      { id: 'l_ldh', cat: 'labs', sub: 'Cardiac', icon: '❤️', name: 'LDH', detail: 'Lactate dehydrogenase', meta: '~30 min · Cardiac', priority: 'URGENT', alert: null, contrast: false },
      { id: 'l_bmp', cat: 'labs', sub: 'Metabolic', icon: '🧪', name: 'BMP (Basic Metabolic Panel)', detail: 'Na, K, Cl, CO₂, BUN, Cr, Glu · K+ 5.4 trend', meta: '~30 min · Chem', priority: 'STAT', alert: null, contrast: false },
      { id: 'l_cmp', cat: 'labs', sub: 'Metabolic', icon: '🧪', name: 'CMP (Comprehensive Metabolic)', detail: 'Full metabolic + LFTs', meta: '~45 min · Chem', priority: 'ROUTINE', alert: null, contrast: false },
      { id: 'l_mg', cat: 'labs', sub: 'Metabolic', icon: '🧪', name: 'Magnesium (Serum)', detail: 'Electrolyte monitoring', meta: '~30 min · Chem', priority: 'ROUTINE', alert: null, contrast: false },
      { id: 'l_lac', cat: 'labs', sub: 'Metabolic', icon: '🧪', name: 'Lactate (Serum)', detail: 'Perfusion / shock marker', meta: '~25 min · Chem', priority: 'URGENT', alert: null, contrast: false },
      { id: 'l_a1c', cat: 'labs', sub: 'Metabolic', icon: '🩸', name: 'Hemoglobin A1c', detail: 'Diabetes monitoring · Glucose 218', meta: '~2 hr · Endo', priority: 'ROUTINE', alert: null, contrast: false },
      { id: 'l_cbc', cat: 'labs', sub: 'Hematology', icon: '🩸', name: 'CBC with Differential', detail: 'Complete blood count + diff', meta: '~30 min · Heme', priority: 'STAT', alert: null, contrast: false },
      { id: 'l_coag', cat: 'labs', sub: 'Hematology', icon: '🩸', name: 'Coagulation Panel (PT/INR/PTT)', detail: 'Required on Heparin drip · PTT goal 60–100', meta: '~30 min · Heme', priority: 'STAT', alert: null, contrast: false },
      { id: 'l_type', cat: 'labs', sub: 'Hematology', icon: '🩸', name: 'Type & Screen', detail: 'Blood bank · pre-cath lab req.', meta: 'Blood Bank', priority: 'URGENT', alert: null, contrast: false },
    ],
    imaging: [
      { id: 'i_cxr', cat: 'imaging', sub: 'X-Ray', icon: '🫁', name: 'Chest X-Ray PA / Lateral', detail: 'Cardiomegaly, pulm edema, effusion', meta: 'XR · ~15 min', priority: 'STAT', alert: null, contrast: false },
      { id: 'i_tte', cat: 'imaging', sub: 'Echo', icon: '❤️', name: 'Echocardiogram (TTE)', detail: 'LV function, wall motion, EF', meta: 'Echo · ~45 min', priority: 'URGENT', alert: null, contrast: false },
      { id: 'i_ctca', cat: 'imaging', sub: 'CT', icon: '🩻', name: 'CT Coronary Angiography', detail: 'Non-invasive coronary imaging', meta: 'CT W · ~45 min', priority: 'URGENT', alert: 'contrast', contrast: true },
      { id: 'i_ctpe', cat: 'imaging', sub: 'CT', icon: '🩻', name: 'CT Pulmonary Angiography', detail: 'R/O pulmonary embolism', meta: 'CT W · ~30 min', priority: 'STAT', alert: 'contrast', contrast: true },
    ],
    meds: [
      { id: 'm_ntg_sl', cat: 'meds', sub: 'Cardiac', icon: '💊', name: 'Nitroglycerin SL', detail: '0.4 mg SL PRN chest pain q5 min × 3', meta: 'Nitrate · Sublingual', priority: 'STAT', alert: null, contrast: false },
      { id: 'm_ntg_iv', cat: 'meds', sub: 'Cardiac', icon: '💉', name: 'Nitroglycerin Infusion', detail: '5 mcg/min IV, titrate for BP', meta: 'Nitrate drip · IV', priority: 'URGENT', alert: null, contrast: false },
      { id: 'm_metop', cat: 'meds', sub: 'Cardiac', icon: '💉', name: 'Metoprolol IV', detail: '5 mg IV q5 min × 3 PRN HR > 100', meta: 'Beta-blocker · IV', priority: 'URGENT', alert: null, contrast: false },
      { id: 'm_amio', cat: 'meds', sub: 'Cardiac', icon: '💉', name: 'Amiodarone', detail: '150 mg IV over 10 min', meta: 'Antiarrhythmic · IV', priority: 'STAT', alert: null, contrast: false },
      { id: 'm_asp325', cat: 'meds', sub: 'Antiplatelet', icon: '💊', name: 'Aspirin', detail: '325 mg PO × 1 dose', meta: 'Antiplatelet · PO', priority: 'STAT', alert: null, contrast: false },
      { id: 'm_hep', cat: 'meds', sub: 'Anticoagulation', icon: '💉', name: 'Heparin Infusion (UFH)', detail: '80 U/kg bolus → 18 U/kg/hr drip', meta: 'Anticoag · IV drip', priority: 'STAT', alert: null, contrast: false },
      { id: 'm_ticag', cat: 'meds', sub: 'Antiplatelet', icon: '💊', name: 'Ticagrelor (Brilinta)', detail: '180 mg loading dose PO', meta: 'P2Y12 inhibitor · PO', priority: 'STAT', alert: null, contrast: false },
      { id: 'm_pred', cat: 'meds', sub: 'Contrast Prep', icon: '💊', name: 'Prednisone (Contrast Pre-med)', detail: '50 mg PO × 3 doses (13h, 7h, 1h pre)', meta: 'Steroid · PO', priority: 'URGENT', alert: null, contrast: false },
      { id: 'm_codeine', cat: 'meds', sub: 'Symptom Mgmt', icon: '💊', name: 'Codeine', detail: '30 mg PO q4h PRN pain', meta: 'Opioid · PO', priority: 'ROUTINE', alert: 'codeine', contrast: false },
    ],
    procedures: [
      { id: 'p_ecg', cat: 'procedures', sub: 'Cardiac', icon: '⚡', name: '12-Lead ECG', detail: 'ST changes, rhythm eval', meta: '~5 min · Bedside', priority: 'STAT', alert: null, contrast: false },
      { id: 'p_ecg_serial', cat: 'procedures', sub: 'Cardiac', icon: '⚡', name: 'Serial 12-Lead ECG (q4h × 3)', detail: 'NSTEMI monitoring protocol', meta: '~5 min each · Bedside', priority: 'URGENT', alert: null, contrast: false },
      { id: 'p_tele', cat: 'procedures', sub: 'Monitoring', icon: '📡', name: 'Continuous Cardiac Telemetry', detail: 'Real-time arrhythmia monitoring', meta: 'Ongoing · Telemetry', priority: 'STAT', alert: null, contrast: false },
      { id: 'p_o2_2l', cat: 'procedures', sub: 'Monitoring', icon: '💨', name: 'Supplemental O₂ — 2L NC', detail: 'SpO₂ target ≥ 94%', meta: 'Ongoing · Respiratory', priority: 'STAT', alert: null, contrast: false },
    ],
    consults: [
      { id: 'c_cards', cat: 'consults', sub: 'Medical', icon: '🩺', name: 'Cardiology Consult', detail: 'NSTEMI management, cath lab decision', meta: 'URGENT', priority: 'URGENT', alert: null, contrast: false },
      { id: 'c_pharm', cat: 'consults', sub: 'Support', icon: '💊', name: 'Pharmacy Consult', detail: 'Heparin drip adjustment, med reconcile', meta: 'ROUTINE', priority: 'ROUTINE', alert: null, contrast: false },
    ],
  };

  const ALL_ORDERS = Object.values(DB).flat();
  const PT_ALLERGY_MAP = {
    contrast: { name: 'Iodinated Contrast', sev: 'Moderate', reaction: 'Urticaria' },
    codeine: { name: 'Codeine', sev: 'Mild', reaction: 'Nausea/Vomiting' },
    pcn: { name: 'Penicillin', sev: 'SEVERE', reaction: 'Anaphylaxis' },
  };

  const getAllergyWarn = (order) => {
    if (order.alert && PT_ALLERGY_MAP[order.alert]) return PT_ALLERGY_MAP[order.alert];
    if (order.contrast && PT_ALLERGY_MAP.contrast) return PT_ALLERGY_MAP.contrast;
    return null;
  };

  /* ══════════════════════════════════════════
     STATE
  ══════════════════════════════════════════ */
  const [queue, setQueue] = useState([]);
  const [activeCat, setActiveCat] = useState('all');
  const [searchQ, setSearchQ] = useState('');
  const [aiSets, setAiSets] = useState([
    { id: 'nstemi', title: 'NSTEMI Management', conf: 97, confCls: 'coral', basis: 'Troponin-I 0.84 (>20× ULN) · ST depression V4–V6', open: true, orders: [{ id: 'm_asp325', st: 'done', note: 'Given 70 min ago' }, { id: 'm_hep', st: 'active', note: 'Drip running · PTT subtherapeutic' }, { id: 'm_ticag', st: 'done', note: 'Given 9 min ago' }, { id: 'c_cards', st: 'done', note: 'Dr. Chen at bedside' }, { id: 'p_tele', st: 'active', note: 'Active monitoring' }] },
  ]);
  const [toast, setToast] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const toastRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    if (toastRef.current) {
      clearTimeout(toastRef.current);
      toastRef.current = setTimeout(() => setToast(''), 3200);
    }
  };

  const addToQueue = (order) => {
    if (queue.some(q => q.id === order.id)) return;
    const aw = getAllergyWarn(order);
    const newItem = { id: order.id, name: order.name, cat: order.cat, icon: order.icon, priority: order.priority, detail: order.detail, note: '', allergyWarn: aw, open: false };
    setQueue([...queue, newItem]);
    if (aw) showToast(`⚠ ALLERGY: ${aw.name} (${aw.reaction}) — review before signing`);
  };

  const removeFromQueue = (id) => {
    setQueue(queue.filter(q => q.id !== id));
  };

  const getFiltered = () => {
    let orders = ALL_ORDERS;
    if (activeCat !== 'all') orders = orders.filter(o => o.cat === activeCat);
    if (searchQ) {
      const q = searchQ.toLowerCase();
      orders = orders.filter(o => o.name.toLowerCase().includes(q) || (o.detail && o.detail.toLowerCase().includes(q)));
    }
    return orders;
  };

  const escHtml = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const runAIAnalysis = async () => {
    setAiLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an emergency medicine clinical decision support AI. Analyze this patient and recommend order sets.

Patient: Nakamura, Hiroshi | 67y Male | Room 4B
Diagnosis: NSTEMI (Non-ST Elevation MI)
Allergies: Penicillin (anaphylaxis), Iodinated Contrast (urticaria), Codeine (nausea)
Vitals: BP 158/94, HR 108, RR 18, SpO2 93%, Temp 37.1°C
Key findings: Troponin-I 0.84 (>20x ULN), ST depression V4-V6, K+ 5.4, Glucose 218
Current meds: Aspirin 325mg given, Ticagrelor loaded, Heparin drip running

Generate 2-3 clinical order set recommendations with confidence scores. For each set include 3-5 specific orders from this list: l_trop, l_bnp, l_ckmb, l_bmp, l_cmp, l_mg, l_lac, l_a1c, l_cbc, l_coag, l_type, i_cxr, i_tte, i_ctca, i_ctpe, m_ntg_sl, m_ntg_iv, m_metop, m_amio, m_asp325, m_hep, m_ticag, m_pred, p_ecg, p_ecg_serial, p_tele, p_o2_2l, c_cards, c_pharm

IMPORTANT: Do NOT recommend contrast-based imaging (i_ctca, i_ctpe) or codeine (m_codeine) due to allergies.`,
        response_json_schema: {
          type: 'object',
          properties: {
            sets: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  conf: { type: 'number' },
                  basis: { type: 'string' },
                  orders: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        st: { type: 'string' },
                        note: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });
      if (result?.sets?.length) {
        setAiSets(result.sets.map(s => ({ ...s, open: true, confCls: s.conf >= 90 ? 'coral' : s.conf >= 75 ? 'orange' : 'teal' })));
        showToast('✦ AI analysis complete — ' + result.sets.length + ' recommendation sets generated');
      }
    } catch (e) {
      showToast('⚠ AI analysis failed — ' + e.message);
    }
    setAiLoading(false);
  };

  return (
    <div style={{ height: 'calc(100vh - 138px)', margin: '-20px -24px', display: 'flex', flexDirection: 'column', backgroundColor: T.bg, color: T.txt, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{CSS}</style>

      {/* TOP BAR */}
      <header className="topbar">
        <div className="logo-box">Pc</div>
        <nav className="breadcrumb">
          <span className="bc-link">Patients</span>
          <span className="bc-sep">›</span>
          <span className="bc-link">Nakamura, Hiroshi</span>
          <span className="bc-sep">›</span>
          <span className="bc-cur">📋 Orders</span>
        </nav>
        <div className="vsep"></div>
        <div className="pt-pill">
          <span className="pt-name">Nakamura, H.</span>
          <span className="pt-meta">67y M · NSTEMI · ESI-2 · Room 4B</span>
        </div>
        <div className="allergy-pill" title="Known allergies">⚠ PCN · Contrast · Codeine</div>
        <div className="topbar-right">
          <span style={{ fontSize: '11px', color: T.txt4, fontFamily: "'JetBrains Mono', monospace" }}>⌘K to search</span>
          <button className="btn-ghost">⬅ Back to Chart</button>
          <button className="btn-ghost">📚 Saved Sets</button>
          <button className="btn-teal">💾 Save Draft</button>
        </div>
      </header>

      {/* APP LAYOUT */}
      <div className="app-layout">
        {/* AI PANEL */}
        <aside className="ai-panel">
          <div className="panel-hdr">
            <div className="ai-live-dot"></div>
            <div>
              <div className="panel-title">AI Recommendations</div>
              <div className="panel-sub">NSTEMI · HTN · T2DM · based on chart</div>
            </div>
          </div>
          <div className="ai-panel-body">
            {aiSets.length > 0 && (
              <button className="add-all-btn"
                onClick={() => {
                  aiSets.forEach(set => set.orders.forEach(o => {
                    if (o.st === 'add') { const ord = ALL_ORDERS.find(x => x.id === o.id); if (ord) addToQueue(ord); }
                  }));
                }}
              >✦ Add All New ({aiSets.reduce((acc, s) => acc + s.orders.filter(o => o.st === 'add').length, 0)})</button>
            )}
            {aiLoading && (
              <div style={{ textAlign: 'center', padding: '20px 10px', color: T.teal, fontSize: 12 }}>
                <div style={{ fontSize: 24, marginBottom: 8, animation: 'aipulse 1s ease-in-out infinite' }}>✦</div>
                Analyzing patient chart…
              </div>
            )}
            {!aiLoading && aiSets.map(set => (
              <div key={set.id} className={`ai-set ${set.open ? 'open' : ''}`}>
                <div className="ai-set-hdr" onClick={() => setAiSets(prev => prev.map(s => s.id === set.id ? { ...s, open: !s.open } : s))}>
                  <span className="ai-conf" style={{ background: set.conf >= 90 ? 'rgba(255,107,107,.15)' : 'rgba(255,159,67,.12)', color: set.conf >= 90 ? T.coral : T.orange, border: `1px solid ${set.conf >= 90 ? 'rgba(255,107,107,.3)' : 'rgba(255,159,67,.3)'}` }}>{set.conf}%</span>
                  <div className="ai-set-info">
                    <div className="ai-set-name">{set.title}</div>
                    <div className="ai-set-basis">{set.basis}</div>
                  </div>
                  <span className="ai-chevron">▼</span>
                </div>
                <div className="ai-set-body">
                  {set.orders.map((o, i) => {
                    const ord = ALL_ORDERS.find(x => x.id === o.id);
                    const canAdd = o.st === 'add' && ord;
                    return (
                      <div key={i} className={`ai-order-row ${canAdd ? 'clickable' : ''}`} onClick={() => canAdd && addToQueue(ord)}>
                        <div className={`ai-order-status-dot ${o.st}`}>{o.st === 'done' ? '✓' : o.st === 'active' ? '●' : o.st === 'queued' ? '↑' : '+'}</div>
                        <span className="ai-order-name">{ord?.name || o.id}</span>
                        {o.note && <span className="ai-order-note">{o.note}</span>}
                        {canAdd && <div className="ai-add-icon">+</div>}
                      </div>
                    );
                  })}
                  <div className="ai-set-actions">
                    <button className="ai-add-set-btn" onClick={() => set.orders.forEach(o => { if (o.st === 'add') { const ord = ALL_ORDERS.find(x => x.id === o.id); if (ord) addToQueue(ord); } })}>+ Add New</button>
                  </div>
                </div>
              </div>
            ))}
            {!aiLoading && aiSets.length === 0 && (
              <div style={{ textAlign: 'center', padding: '28px 10px', color: T.txt4, fontSize: 12 }}>
                <div style={{ fontSize: 28, opacity: .2, marginBottom: 8 }}>🤖</div>
                Click Live AI Analysis to generate recommendations
              </div>
            )}
          </div>
          <div className="ai-panel-footer">
            <button className="btn-ai-analyze" onClick={runAIAnalysis} disabled={aiLoading}>
              {aiLoading ? '⏳ Analyzing…' : '🤖 Live AI Analysis'}
            </button>
          </div>
        </aside>

        {/* CATALOG */}
        <main className="catalog-panel">
          <div className="search-row">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input type="text" className="search-input" placeholder="Search labs, meds, imaging, procedures, consults…" onChange={(e) => setSearchQ(e.target.value)} value={searchQ} />
              <button className={`search-clear ${searchQ ? 'vis' : ''}`} onClick={() => setSearchQ('')}>✕</button>
            </div>
          </div>
          <div className="quick-row">
            <span className="quick-lbl">⚡ NSTEMI:</span>
            {['l_trop', 'l_bmp', 'i_tte', 'm_ntg_sl'].map(id => {
              const ord = ALL_ORDERS.find(o => o.id === id);
              return ord ? <button key={id} className="quick-chip" onClick={() => addToQueue(ord)}>{ord.name}</button> : null;
            })}
          </div>
          <div className="cat-row">
            {[{ id: 'all', label: 'All' }, { id: 'labs', label: '🧪 Labs' }, { id: 'imaging', label: '🩻 Imaging' }, { id: 'meds', label: '💊 Medications' }, { id: 'procedures', label: '⚡ Procedures' }, { id: 'consults', label: '🩺 Consults' }].map(c => (
              <button key={c.id} className={`cat-chip ${activeCat === c.id ? 'active' : ''}`} onClick={() => setActiveCat(c.id)}>{c.label}</button>
            ))}
          </div>
          <div className="catalog-body">
            {(() => {
              const filtered = getFiltered();
              if (filtered.length === 0) return (
                <div className="no-results">
                  <div style={{ fontSize: '30px', marginBottom: '8px', opacity: '0.25' }}>🔍</div>
                  <div>No results</div>
                </div>
              );
              // Group by sub-category
              const groups = {};
              filtered.forEach(o => {
                if (!groups[o.sub]) groups[o.sub] = [];
                groups[o.sub].push(o);
              });
              return Object.entries(groups).map(([sub, orders]) => (
                <div key={sub}>
                  <div className="cat-section-title">{sub}</div>
                  <div className="orders-grid">
                    {orders.map((order) => {
                      const inQ = queue.some(q => q.id === order.id);
                      const aw = getAllergyWarn(order);
                      return (
                        <div key={order.id} className={`order-card ${inQ ? 'in-queue' : ''}`} onClick={() => inQ ? removeFromQueue(order.id) : addToQueue(order)}>
                          {inQ && <div className="oc-check">✓</div>}
                          <div className="oc-top">
                            <span className="oc-icon">{order.icon}</span>
                            <span className="oc-name">{order.name}</span>
                          </div>
                          <div className="oc-meta">{order.detail}</div>
                          {aw && <div className="allergy-chip">⚠ {aw.name} · {aw.sev}</div>}
                          <div className="oc-footer">
                            <span className={`prio-badge prio-${order.priority}`}>{order.priority}</span>
                            <span style={{ fontSize: '10px', color: T.txt4 }}>{order.meta}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>
        </main>

        {/* QUEUE PANEL */}
        <aside className="queue-panel">
          <div className="queue-hdr">
            <div>
              <div className="panel-title">Order Queue</div>
              <div className="panel-sub">Review, edit priority, then sign</div>
            </div>
            <span className="queue-count-badge">{queue.length}</span>
          </div>
          <div className="queue-body">
            {queue.length === 0 ? (
              <div className="empty-queue">
                <div className="empty-icon">📋</div>
                <div className="empty-text">No orders in queue</div>
                <div className="empty-sub">Click any catalog item to add</div>
              </div>
            ) : (
              queue.map((item) => (
                <div key={item.id} className={`queue-item ${item.open ? 'open' : ''}`}>
                  <div className="qi-row" onClick={() => setQueue(queue.map(q => q.id === item.id ? { ...q, open: !q.open } : q))}>
                    <button className={`prio-pill ${item.priority}`}>{item.priority}</button>
                    <div className="qi-info">
                      <div className="qi-name">{item.icon} {item.name}</div>
                      <div className="qi-detail">{item.detail}</div>
                    </div>
                    <span className="qi-chevron">▼</span>
                    <button className="qi-remove" onClick={(e) => { e.stopPropagation(); removeFromQueue(item.id); }}>✕</button>
                  </div>
                  {item.open && (
                    <div className="qi-expand">
                      <div className="qi-field">
                        <div className="qi-field-lbl">Priority</div>
                        <div className="prio-selector">
                          {['STAT', 'URGENT', 'ROUTINE'].map(p => (
                            <button key={p} className={`prio-sel-btn ${p} ${item.priority === p ? 'sel' : ''}`} onClick={() => setQueue(queue.map(q => q.id === item.id ? { ...q, priority: p } : q))}>{p}</button>
                          ))}
                        </div>
                      </div>
                      {item.allergyWarn && <div className="qi-allergy">⚠ {item.allergyWarn.name} — {item.allergyWarn.sev}</div>}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="queue-footer">
            <button className={`sign-btn`} disabled={queue.length === 0} onClick={() => {
              if (queue.length) showToast(`✓ ${queue.length} orders signed`);
              setQueue([]);
            }}>✍ Sign {queue.length > 0 ? queue.length + ' Order' + (queue.length > 1 ? 's' : '') : 'Orders'}</button>
            {queue.length > 0 && <button className="clear-link" onClick={() => queue.length && setQueue([])}>Clear all orders</button>}
          </div>
        </aside>
      </div>

      {/* TOAST */}
      <div className={`toast ${!toast ? 'hide' : ''}`}>{toast}</div>
    </div>
  );
};

export default EDOrders;