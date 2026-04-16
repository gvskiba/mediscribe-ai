// ── npiStyles.js ─────────────────────────────────────────────────────────────
// Single source of truth for all NewPatientInput chrome.
// Inject via:  <style>{NPI_CSS}</style>  in the page root div.
// ─────────────────────────────────────────────────────────────────────────────

export const NPI_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');

/* ── Design tokens ─────────────────────────────────────────────────────────── */
:root {
  --npi-bg:#050f1e; --npi-panel:#081628; --npi-card:#0b1e36; --npi-up:#0e2544;
  --npi-bd:#1a3555; --npi-bhi:#2a4f7a;
  --npi-blue:#3b9eff; --npi-teal:#00e5c0; --npi-gold:#f5c842; --npi-coral:#ff6b6b;
  --npi-orange:#ff9f43; --npi-purple:#9b6dff; --npi-green:#3dffa0; --npi-red:#ff3d3d;
  --npi-txt:#ffffff; --npi-txt2:#d0e8ff; --npi-txt3:#a8c8e8; --npi-txt4:#7aa0c0;
  --npi-wf:190px; --npi-top:88px;
}

/* ── Reset helpers ─────────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; }


/* ══════════════════════════════════════════════════════════════════════════════
   TOP BAR  — fixed, left=rail-width, two rows totalling 88px
══════════════════════════════════════════════════════════════════════════════ */

.npi-top-bar {
  position: fixed; top: 0; left: var(--npi-wf); right: 0;
  height: var(--npi-top);
  background: var(--npi-panel);
  border-bottom: 1px solid var(--npi-bd);
  z-index: 200;
  display: flex; flex-direction: column;
}

/* Row 1 — provider / stats / toolbar */
.npi-top-row-1 {
  height: 44px; flex-shrink: 0;
  display: flex; align-items: center;
  padding: 0 16px; gap: 8px;
  border-bottom: 1px solid rgba(26,53,85,.5);
}

/* Row 2 — patient identity / actions */
.npi-top-row-2 {
  flex: 1; display: flex; align-items: center;
  padding: 0 16px; gap: 8px; overflow: hidden;
}

/* Provider */
.npi-dr-label {
  font-family: 'Playfair Display', serif; font-size: 13px; font-weight: 700;
  color: var(--npi-txt2); white-space: nowrap; flex-shrink: 0;
  display: flex; align-items: center; gap: 6px;
}
.npi-dr-role {
  font-family: 'JetBrains Mono', monospace; font-size: 8px;
  color: var(--npi-txt4); letter-spacing: .1em; text-transform: uppercase;
  background: var(--npi-up); border: 1px solid var(--npi-bd);
  border-radius: 3px; padding: 1px 6px;
}

/* Vertical rule */
.npi-vsep { width: 1px; height: 18px; background: rgba(42,79,122,.6); flex-shrink: 0; }

/* Stats */
.npi-stat { display: flex; align-items: baseline; gap: 4px; flex-shrink: 0; }
.npi-stat-val {
  font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 700;
  color: var(--npi-txt3);
}
.npi-stat-val.alert { color: var(--npi-coral); }
.npi-stat-lbl { font-family: 'DM Sans', sans-serif; font-size: 10px; color: var(--npi-txt4); }

/* Track board link */
.npi-tb-link {
  background: transparent; border: none; color: var(--npi-txt4);
  font-family: 'DM Sans', sans-serif; font-size: 11px; cursor: pointer;
  padding: 3px 8px; border-radius: 5px;
  transition: color .15s, background .15s; white-space: nowrap; flex-shrink: 0;
}
.npi-tb-link:hover { color: var(--npi-txt2); background: var(--npi-up); }

/* Right cluster */
.npi-top-right { margin-left: auto; display: flex; align-items: center; gap: 5px; flex-shrink: 0; }

/* CDS / RN / Attach buttons */
.npi-cds-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 6px;
  border: 1px solid var(--npi-bd); background: var(--npi-up); color: var(--npi-txt4);
  font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600;
  cursor: pointer; transition: all .15s; position: relative;
  white-space: nowrap; flex-shrink: 0;
}
.npi-cds-btn:hover     { border-color: var(--npi-bhi); color: var(--npi-txt3); }
.npi-cds-btn.open      { border-color: rgba(59,158,255,.55); color: var(--npi-blue); background: rgba(59,158,255,.1); }
.npi-cds-btn.cds-alert { border-color: rgba(255,107,107,.5); color: var(--npi-coral); background: rgba(255,107,107,.08); }
.npi-cds-btn.cds-warn  { border-color: rgba(245,200,66,.45); color: var(--npi-gold);  background: rgba(245,200,66,.07); }
.npi-cds-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; opacity: .65; flex-shrink: 0; }

/* AI button */
.npi-ai-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 4px 11px; border-radius: 6px;
  border: 1px solid rgba(155,109,255,.4); background: rgba(155,109,255,.09); color: var(--npi-purple);
  font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700;
  cursor: pointer; transition: all .15s; position: relative; white-space: nowrap; flex-shrink: 0;
}
.npi-ai-btn:hover, .npi-ai-btn.open { background: rgba(155,109,255,.18); border-color: rgba(155,109,255,.65); }
.npi-ai-dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--npi-purple);
  animation: npi-pulse 2.4s ease-in-out infinite; flex-shrink: 0;
}
.npi-ai-badge {
  position: absolute; top: -5px; right: -5px;
  min-width: 14px; height: 14px; border-radius: 7px;
  background: var(--npi-coral); color: #fff;
  font-family: 'JetBrains Mono', monospace; font-size: 8px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; padding: 0 3px; line-height: 1;
}

/* New Patient */
.npi-new-pt {
  padding: 4px 12px; border-radius: 6px;
  border: 1px solid rgba(0,229,192,.35); background: rgba(0,229,192,.08); color: var(--npi-teal);
  font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 600;
  cursor: pointer; transition: all .15s; white-space: nowrap; flex-shrink: 0;
}
.npi-new-pt:hover { background: rgba(0,229,192,.18); border-color: rgba(0,229,192,.6); }

/* Settings */
.npi-tb-settings {
  font-size: 16px; color: var(--npi-txt4); text-decoration: none;
  padding: 4px 6px; border-radius: 6px; transition: all .15s;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.npi-tb-settings:hover { color: var(--npi-txt2); background: var(--npi-up); }


/* ── Row 2 patient strip ──────────────────────────────────────────────────── */

.npi-chart-badge {
  font-family: 'JetBrains Mono', monospace; font-size: 10px; padding: 2px 8px;
  border-radius: 4px; background: var(--npi-up); border: 1px solid var(--npi-bd);
  color: var(--npi-txt4); letter-spacing: .04em; white-space: nowrap; flex-shrink: 0;
  transition: all .2s;
}
.npi-chart-badge.registered { color: var(--npi-teal); border-color: rgba(0,229,192,.35); background: rgba(0,229,192,.07); }

.npi-pt-name {
  font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 700; color: var(--npi-txt);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; flex-shrink: 0;
}
.npi-pt-dob { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--npi-txt4); white-space: nowrap; flex-shrink: 0; }

.npi-door-time {
  font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--npi-txt3);
  background: var(--npi-up); border: 1px solid var(--npi-bd); border-radius: 5px;
  padding: 2px 8px; white-space: nowrap; flex-shrink: 0;
}

/* Allergy strip */
.npi-allergy-wrap {
  display: flex; align-items: center; padding: 2px 9px; border-radius: 5px;
  border: 1px solid rgba(0,229,192,.2); background: rgba(0,229,192,.04);
  cursor: pointer; transition: all .15s; white-space: nowrap; flex-shrink: 0;
  max-width: 190px; overflow: hidden;
}
.npi-allergy-wrap:hover { border-color: rgba(0,229,192,.45); }
.npi-allergy-wrap.has-allergies { border-color: rgba(255,107,107,.4); background: rgba(255,107,107,.07); }
.npi-allergy-nka  { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--npi-teal); }
.npi-allergy-alert { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--npi-coral); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Resume chip */
.npi-resume-chip {
  display: flex; align-items: center; gap: 6px; padding: 3px 10px;
  border-radius: 20px; border: 1px solid rgba(59,158,255,.38); background: rgba(59,158,255,.09);
  color: var(--npi-blue); font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 600;
  cursor: pointer; white-space: nowrap; flex-shrink: 0; animation: npi-fadein .25s ease;
}
.npi-resume-dismiss { font-size: 10px; opacity: .5; padding: 0 2px; transition: opacity .15s; }
.npi-resume-dismiss:hover { opacity: 1; }

/* Action buttons */
.npi-top-acts { margin-left: auto; display: flex; align-items: center; gap: 5px; flex-shrink: 0; }

.npi-btn-ghost {
  padding: 5px 12px; border-radius: 6px; border: 1px solid var(--npi-bd);
  background: transparent; color: var(--npi-txt3);
  font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500;
  cursor: pointer; transition: all .15s; white-space: nowrap;
}
.npi-btn-ghost:hover { border-color: var(--npi-bhi); color: var(--npi-txt); background: var(--npi-up); }

.npi-btn-coral {
  padding: 5px 12px; border-radius: 6px;
  border: 1px solid rgba(255,107,107,.38); background: rgba(255,107,107,.08); color: var(--npi-coral);
  font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 600;
  cursor: pointer; transition: all .15s; white-space: nowrap;
}
.npi-btn-coral:hover { background: rgba(255,107,107,.18); border-color: rgba(255,107,107,.6); }

.npi-btn-primary {
  padding: 5px 14px; border-radius: 6px; border: none;
  background: linear-gradient(135deg,#00e5c0,#00b4d8); color: #050f1e;
  font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 700;
  cursor: pointer; transition: opacity .15s; white-space: nowrap;
  box-shadow: 0 2px 10px rgba(0,229,192,.22);
}
.npi-btn-primary:hover { opacity: .85; }


/* ══════════════════════════════════════════════════════════════════════════════
   MAIN LAYOUT
══════════════════════════════════════════════════════════════════════════════ */

.npi-main-wrap {
  margin-top: var(--npi-top); margin-left: var(--npi-wf);
  min-height: calc(100vh - var(--npi-top)); background: var(--npi-bg);
}
.npi-content { padding: 20px 28px; min-height: calc(100vh - var(--npi-top)); }


/* ══════════════════════════════════════════════════════════════════════════════
   LEFT NAV RAIL  (190px, full height, fixed)
══════════════════════════════════════════════════════════════════════════════ */

.npi-wf-rail {
  position: fixed; top: 0; left: 0; bottom: 0; width: var(--npi-wf);
  background: rgba(5,13,26,.98); border-right: 1px solid var(--npi-bd);
  overflow-y: auto; overflow-x: hidden; z-index: 300;
  display: flex; flex-direction: column;
  scrollbar-width: thin; scrollbar-color: var(--npi-bd) transparent;
}
.npi-wf-rail::-webkit-scrollbar { width: 3px; }
.npi-wf-rail::-webkit-scrollbar-thumb { background: var(--npi-bd); border-radius: 2px; }

/* Patient card */
.npi-wf-pt { padding: 12px 14px 10px; border-bottom: 1px solid rgba(26,53,85,.5); flex-shrink: 0; margin-top: var(--npi-top); }
.npi-wf-pt-name {
  font-family: 'Playfair Display', serif; font-size: 13px; font-weight: 700; color: var(--npi-txt);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 3px;
}
.npi-wf-pt-meta { display: flex; flex-direction: column; gap: 2px; font-family: 'DM Sans', sans-serif; font-size: 10px; color: var(--npi-txt4); }
.npi-wf-pt-cc { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--npi-txt3); font-size: 10.5px; }

/* ESI/room chips */
.npi-wf-esi {
  font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700;
  padding: 1px 6px; border-radius: 3px; border: 1px solid; white-space: nowrap;
}

/* Mini vitals */
.npi-wf-vitals { padding: 7px 14px 9px; border-bottom: 1px solid rgba(26,53,85,.4); display: flex; flex-direction: column; gap: 3px; flex-shrink: 0; }
.npi-wf-v-row  { display: flex; align-items: center; justify-content: space-between; gap: 4px; }
.npi-wf-v-lbl  { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: var(--npi-txt4); letter-spacing: .04em; flex-shrink: 0; min-width: 34px; }
.npi-wf-v-val  { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; color: var(--npi-txt2); text-align: right; }
.npi-wf-v-val.alert { color: var(--npi-coral); }
.npi-wf-v-val.warn  { color: var(--npi-gold);  }

/* Nav groups */
.npi-wf-group { flex-shrink: 0; }

.npi-wf-gh {
  width: 100%; display: flex; align-items: center; gap: 7px;
  padding: 8px 12px 8px 14px;
  border: none; border-top: 1px solid rgba(26,53,85,.3);
  background: transparent; cursor: pointer; transition: background .15s; text-align: left;
}
.npi-wf-group:first-of-type .npi-wf-gh { border-top: none; }
.npi-wf-gh:hover  { background: rgba(26,53,85,.25); }
.npi-wf-gh.active { background: rgba(26,53,85,.45); }
.npi-wf-gh-icon  { font-size: 13px; flex-shrink: 0; width: 18px; text-align: center; line-height: 1; }
.npi-wf-gh-label {
  font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 600; color: var(--npi-txt4);
  flex: 1; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  letter-spacing: .08em; text-transform: uppercase; transition: color .15s;
}
.npi-wf-gh.active .npi-wf-gh-label { color: var(--npi-txt2); }
.npi-wf-gh-badge {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
  background: transparent; border: 1.5px solid rgba(42,79,122,.55); transition: all .2s;
}
.npi-wf-gh-badge.partial  { background: var(--npi-orange); border-color: transparent; }
.npi-wf-gh-badge.complete { background: var(--npi-teal);   border-color: transparent; }
.npi-wf-gh-badge.critical { background: var(--npi-coral);  border-color: transparent; box-shadow: 0 0 5px rgba(255,107,107,.6); animation: npi-pulse 2s ease-in-out infinite; }

/* Group items */
.npi-wf-items { padding: 2px 0 5px; animation: npi-fadein .15s ease; }
.npi-wf-item {
  width: 100%; display: flex; align-items: center; gap: 6px;
  padding: 5px 12px 5px 36px;
  border: none; border-left: 2px solid transparent;
  background: transparent; cursor: pointer; transition: all .12s;
  font-family: 'DM Sans', sans-serif; font-size: 11.5px; color: var(--npi-txt4); text-align: left;
}
.npi-wf-item:hover  { color: var(--npi-txt2); background: rgba(0,229,192,.03); }
.npi-wf-item.active { color: var(--npi-teal); border-left-color: var(--npi-teal); background: rgba(0,229,192,.06); }
.npi-wf-item-icon  { font-size: 12px; flex-shrink: 0; width: 16px; text-align: center; line-height: 1; }
.npi-wf-item-label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.npi-wf-item-sc {
  font-family: 'JetBrains Mono', monospace; font-size: 8px; color: var(--npi-txt4);
  background: var(--npi-up); border: 1px solid var(--npi-bd); border-radius: 3px;
  padding: 0 4px; white-space: nowrap; flex-shrink: 0;
}
.npi-wf-item.active .npi-wf-item-sc { border-color: rgba(0,229,192,.3); color: var(--npi-teal); }
.npi-wf-item-dot {
  width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
  background: transparent; border: 1.5px solid rgba(42,79,122,.5); transition: all .2s;
}
.npi-wf-item-dot.empty    { background: transparent; }
.npi-wf-item-dot.partial  { background: var(--npi-orange); border-color: transparent; }
.npi-wf-item-dot.complete { background: var(--npi-teal);   border-color: transparent; }
.npi-wf-item-dot.critical { background: var(--npi-coral);  border-color: transparent; }


/* ══════════════════════════════════════════════════════════════════════════════
   AI OVERLAY  (full-height right drawer)
══════════════════════════════════════════════════════════════════════════════ */

.npi-scrim { position: fixed; inset: 0; background: rgba(3,8,16,.52); backdrop-filter: blur(3px); z-index: 499; opacity: 0; pointer-events: none; transition: opacity .25s; }
.npi-scrim.open { opacity: 1; pointer-events: auto; }

.npi-overlay {
  position: fixed; top: 0; right: -380px; bottom: 0; width: 360px;
  background: rgba(5,13,26,.97); border-left: 1px solid var(--npi-bd); z-index: 500;
  display: flex; flex-direction: column;
  transition: right .3s cubic-bezier(.25,.1,.25,1);
  box-shadow: -16px 0 56px rgba(0,0,0,.55);
}
.npi-overlay.open { right: 0; }

.npi-n-hdr { flex-shrink: 0; border-bottom: 1px solid var(--npi-bd); background: rgba(8,22,44,.92); }
.npi-n-hdr-top { display: flex; align-items: center; gap: 10px; padding: 14px 16px 12px; }
.npi-n-avatar { width: 36px; height: 36px; border-radius: 10px; background: rgba(155,109,255,.14); border: 1px solid rgba(155,109,255,.32); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.npi-n-hdr-info { flex: 1; min-width: 0; }
.npi-n-hdr-name { font-family: 'Playfair Display', serif; font-size: 13px; font-weight: 700; color: var(--npi-txt); }
.npi-n-hdr-sub  { display: flex; align-items: center; gap: 6px; font-family: 'DM Sans', sans-serif; font-size: 10px; color: var(--npi-txt4); margin-top: 2px; }
.npi-n-hdr-sub .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--npi-teal); animation: npi-pulse 2.2s ease-in-out infinite; flex-shrink: 0; }
.npi-n-close { width: 28px; height: 28px; border-radius: 7px; background: var(--npi-up); border: 1px solid var(--npi-bd); color: var(--npi-txt4); font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s; flex-shrink: 0; }
.npi-n-close:hover { color: var(--npi-txt); border-color: var(--npi-bhi); }

.npi-n-quick { display: flex; flex-wrap: wrap; gap: 5px; padding: 0 14px 12px; }
.npi-n-qbtn  { padding: 3px 10px; border-radius: 20px; border: 1px solid rgba(155,109,255,.28); background: rgba(155,109,255,.07); color: var(--npi-purple); font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 500; cursor: pointer; transition: all .15s; white-space: nowrap; }
.npi-n-qbtn:hover { background: rgba(155,109,255,.18); border-color: rgba(155,109,255,.55); }
.npi-n-qbtn:disabled { opacity: .4; cursor: not-allowed; }

.npi-n-msgs { flex: 1; overflow-y: auto; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; scrollbar-width: thin; scrollbar-color: var(--npi-bd) transparent; }
.npi-n-msgs::-webkit-scrollbar { width: 3px; }
.npi-n-msgs::-webkit-scrollbar-thumb { background: var(--npi-bd); border-radius: 2px; }

.npi-n-msg { font-family: 'DM Sans', sans-serif; font-size: 12.5px; line-height: 1.65; border-radius: 10px; padding: 9px 13px; max-width: 95%; animation: npi-fadein .2s ease; }
.npi-n-msg.user      { align-self: flex-end;  background: rgba(59,158,255,.1);   border: 1px solid rgba(59,158,255,.22);  color: var(--npi-txt2); }
.npi-n-msg.assistant { align-self: flex-start; background: rgba(155,109,255,.09); border: 1px solid rgba(155,109,255,.2);  color: var(--npi-txt); }

.npi-n-dots { display: flex; gap: 5px; align-items: center; padding: 6px 8px; align-self: flex-start; }
.npi-n-dots span { width: 7px; height: 7px; border-radius: 50%; background: var(--npi-purple); opacity: .4; animation: npi-dot-bounce 1s ease-in-out infinite; }
.npi-n-dots span:nth-child(2) { animation-delay: .18s; }
.npi-n-dots span:nth-child(3) { animation-delay: .36s; }

.npi-n-input-bar { display: flex; align-items: flex-end; gap: 8px; padding: 11px 14px; border-top: 1px solid var(--npi-bd); background: rgba(8,22,44,.9); flex-shrink: 0; }
.npi-n-ta { flex: 1; background: rgba(14,37,68,.7); border: 1px solid var(--npi-bd); border-radius: 10px; padding: 9px 12px; color: var(--npi-txt); font-family: 'DM Sans', sans-serif; font-size: 12.5px; resize: none; outline: none; line-height: 1.5; max-height: 90px; transition: border-color .15s; }
.npi-n-ta:focus { border-color: rgba(155,109,255,.5); }
.npi-n-ta::placeholder { color: var(--npi-txt4); }
.npi-n-ta:disabled { opacity: .5; }
.npi-n-send { width: 34px; height: 34px; border-radius: 9px; border: none; background: linear-gradient(135deg,#9b6dff,#7b4de0); color: #fff; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: opacity .15s; flex-shrink: 0; }
.npi-n-send:disabled { opacity: .35; cursor: not-allowed; }
.npi-n-send:hover:not(:disabled) { opacity: .82; }


/* ══════════════════════════════════════════════════════════════════════════════
   CDS OVERLAY  (right drawer, starts below top bar)
══════════════════════════════════════════════════════════════════════════════ */

.npi-cds-scrim { position: fixed; inset: 0; background: rgba(3,8,16,.4); z-index: 398; animation: npi-fadein .2s ease; }
.npi-cds-overlay { position: fixed; top: var(--npi-top); right: -340px; bottom: 0; width: 320px; background: rgba(5,13,26,.97); border-left: 1px solid var(--npi-bd); z-index: 399; display: flex; flex-direction: column; transition: right .3s cubic-bezier(.25,.1,.25,1); box-shadow: -10px 0 40px rgba(0,0,0,.45); }
.npi-cds-overlay.open { right: 0; }
.npi-cds-overlay-hdr { display: flex; align-items: center; justify-content: space-between; padding: 13px 16px; border-bottom: 1px solid var(--npi-bd); flex-shrink: 0; background: rgba(8,22,44,.85); }
.npi-cds-overlay-title { font-family: 'Playfair Display', serif; font-size: 13px; font-weight: 700; color: var(--npi-txt); }
.npi-cds-close { width: 26px; height: 26px; border-radius: 6px; background: var(--npi-up); border: 1px solid var(--npi-bd); color: var(--npi-txt4); font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s; }
.npi-cds-close:hover { color: var(--npi-txt); border-color: var(--npi-bhi); }


/* ══════════════════════════════════════════════════════════════════════════════
   SHORTCUT FAB
══════════════════════════════════════════════════════════════════════════════ */

.npi-sc-hint-fab {
  position: fixed; bottom: 80px; right: 20px;
  width: 32px; height: 32px; border-radius: 50%;
  background: rgba(8,22,44,.92); border: 1px solid rgba(26,53,85,.75);
  color: var(--npi-txt4); font-family: 'JetBrains Mono', monospace;
  font-size: 13px; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  z-index: 490; transition: all .15s; box-shadow: 0 4px 16px rgba(0,0,0,.45);
}
.npi-sc-hint-fab:hover { background: rgba(59,158,255,.12); border-color: rgba(59,158,255,.42); color: var(--npi-blue); }


/* ══════════════════════════════════════════════════════════════════════════════
   ORDERS PANEL
══════════════════════════════════════════════════════════════════════════════ */

.ord-ai-pill   { background: rgba(0,229,192,.1); color: var(--npi-teal); border: 1px solid rgba(0,229,192,.25); border-radius: 20px; padding: 2px 10px; font-size: 10px; font-weight: 700; letter-spacing: .5px; font-family: 'JetBrains Mono', monospace; white-space: nowrap; flex-shrink: 0; }
.ord-btn-teal  { background: var(--npi-teal); color: var(--npi-bg); border: none; border-radius: 7px; padding: 5px 13px; font-size: 11px; font-weight: 700; cursor: pointer; white-space: nowrap; font-family: 'DM Sans', sans-serif; transition: filter .15s; flex-shrink: 0; }
.ord-btn-teal:hover:not(:disabled) { filter: brightness(1.12); }
.ord-btn-teal:disabled { opacity: .4; cursor: not-allowed; }
.ord-btn-ghost { background: var(--npi-up); border: 1px solid var(--npi-bd); border-radius: 7px; padding: 6px 13px; font-size: 12px; color: var(--npi-txt2); cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .15s; }
.ord-btn-ghost:hover { border-color: var(--npi-bhi); color: var(--npi-txt); }
.ord-slbl  { font-size: 9px; font-weight: 700; letter-spacing: 1.5px; color: var(--npi-txt4); font-family: 'JetBrains Mono', monospace; text-transform: uppercase; margin-bottom: 6px; }
.ord-row   { display: flex; align-items: center; gap: 9px; padding: 7px 8px; border-radius: 7px; cursor: pointer; transition: background .12s; }
.ord-row:hover { background: rgba(255,255,255,.04); }
.ord-chk   { width: 16px; height: 16px; border-radius: 4px; border: 1.5px solid rgba(255,255,255,.18); flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all .15s; }
.ord-chk.on { background: var(--npi-teal); border-color: var(--npi-teal); }
.ord-chip  { padding: 4px 10px; border-radius: 20px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); font-size: 11px; color: rgba(255,255,255,.55); cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .15s; }
.ord-chip:hover { background: rgba(0,229,192,.1); border-color: rgba(0,229,192,.28); color: var(--npi-teal); }


/* ══════════════════════════════════════════════════════════════════════════════
   ANIMATIONS
══════════════════════════════════════════════════════════════════════════════ */

@keyframes npi-fadein {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes npi-pulse {
  0%, 100% { opacity: .65; transform: scale(1); }
  50%       { opacity: 1;   transform: scale(1.18); }
}
@keyframes npi-dot-bounce {
  0%, 80%, 100% { transform: translateY(0);    opacity: .4; }
  40%            { transform: translateY(-5px); opacity: 1; }
}
@keyframes npi-ring {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,107,107,.55); }
  50%       { box-shadow: 0 0 0 5px rgba(255,107,107,0); }
}
`;