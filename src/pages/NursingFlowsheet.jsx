import React, { useState, useEffect } from "react";

const BODY_HTML = `<div id="app">

<nav>
  <span class="logo">Notrya</span>
  <div class="sep"></div>
  <span class="nav-badge">NURSING FLOWSHEET</span>
  <div id="upill" class="npill crit" style="display:none;"><div class="dot"></div><span id="ucnt">0</span>&nbsp;UNACK'D</div>
  <div class="sp"></div>
  <div class="pstrip">
    <div><div class="pname">Margaret T. Sullivan</div><div class="psub">67y F · Room TR-1 · Dr. Rivera · NPO</div></div>
    <div class="sep"></div>
    <div style="text-align:right;">
      <span class="pill" style="background:rgba(255,92,108,.15);color:var(--red);border:1px solid rgba(255,92,108,.35);">Full Code</span>
      <div style="font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--muted);margin-top:3px;">⚠ PCN · ASA Allergy</div>
    </div>
  </div>
  <div class="sep"></div>
  <button class="abtn" onclick="openModal()">🔔 Alert Provider</button>
  <button class="nbtn" onclick="sw('chat')">💬 Chat MD</button>
  <button class="nbtn" onclick="sw('orders')">📋 Orders</button>
  <span class="clk" id="clk">--:--</span>
</nav>

<div id="sbar2">
  <div class="sg"><span class="sl">HR</span><span class="sv" id="s-hr">—</span><span class="su">bpm</span><span class="sf" id="s-hrf" style="display:none;"></span></div>
  <div class="sg"><span class="sl">BP</span><span class="sv" id="s-bp">—</span><span class="su">mmHg</span><span class="sf" id="s-bpf" style="display:none;"></span></div>
  <div class="sg"><span class="sl">SpO₂</span><span class="sv" id="s-sp">—</span><span class="su">%</span><span class="sf" id="s-spf" style="display:none;"></span></div>
  <div class="sg"><span class="sl">Temp</span><span class="sv" id="s-tp">—</span><span class="su">°F</span><span class="sf" id="s-tpf" style="display:none;"></span></div>
  <div class="sg"><span class="sl">Pain</span><span class="sv" id="s-pn">—</span><span class="su">/10</span></div>
  <div class="sg"><span class="sl">I/O</span><span class="sv" id="s-io">—/—</span><span class="su">mL</span></div>
  <div style="margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--muted);">Admitted 10/14 08:14 · Chest pain, r/o NSTEMI</div>
</div>

<div id="main">
  <div id="sidebar">
    <button class="tb on" data-t="flow" onclick="sw('flow')"><span class="ti">📊</span><span class="tl">FLOWSHEET</span></button>
    <button class="tb" data-t="chat" onclick="sw('chat')"><span class="ti">💬</span><span class="tl">CHAT MD</span><span class="tbadge" id="bc" style="display:none;background:var(--blue);"></span></button>
    <button class="tb" data-t="alerts" onclick="sw('alerts')"><span class="ti">🔔</span><span class="tl">ALERTS</span><span class="tbadge" id="ba" style="display:none;background:var(--red);"></span></button>
    <button class="tb" data-t="orders" onclick="sw('orders')"><span class="ti">📋</span><span class="tl">ORDERS</span><span class="tbadge" id="bo" style="display:none;background:var(--amber);"></span></button>
    <button class="tb" data-t="labs" onclick="sw('labs')"><span class="ti">🧪</span><span class="tl">LABS &amp; MEDS</span></button>
    <button class="tb" data-t="sum" onclick="sw('sum')"><span class="ti">✦</span><span class="tl">AI SUMMARY</span></button>
    <div class="pcard" style="margin-top:auto;">
      <div style="font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;color:var(--teal);letter-spacing:.1em;margin-bottom:7px;">PATIENT</div>
      <div class="pcr"><span class="pck">MRN</span><span class="pcv">884412</span></div>
      <div class="pcr"><span class="pck">Room</span><span class="pcv">TR-1-A</span></div>
      <div class="pcr"><span class="pck">Diet</span><span class="pcv">NPO</span></div>
      <div class="pcr"><span class="pck">Code</span><span class="pcv" style="color:var(--red);">Full</span></div>
      <div class="pcr"><span class="pck">Wt</span><span class="pcv">72 kg</span></div>
      <div class="pcr"><span class="pck">Iso</span><span class="pcv">Standard</span></div>
    </div>
  </div>

  <div id="content">

    <!-- FLOWSHEET -->
    <div class="pane on" id="pane-flow">
      <div class="card">
        <div class="ch"><span class="ci">❤️</span><span class="ct" style="color:var(--rose);">VITAL SIGNS FLOWSHEET</span><span class="pill" id="crit-pill" style="background:rgba(255,92,108,.14);color:var(--red);border:1px solid rgba(255,92,108,.3);display:none;"></span></div>
        <div class="cb" style="padding:0;overflow-x:auto;">
          <table class="vtbl" id="vtbl">
            <thead><tr>
              <th style="text-align:left;padding-left:14px;">TIME</th>
              <th>HR<br><span style="font-weight:400;opacity:.7;">bpm</span></th>
              <th>SBP<br><span style="font-weight:400;opacity:.7;">mmHg</span></th>
              <th>DBP<br><span style="font-weight:400;opacity:.7;">mmHg</span></th>
              <th>RR<br><span style="font-weight:400;opacity:.7;">/min</span></th>
              <th>SpO₂<br><span style="font-weight:400;opacity:.7;">%</span></th>
              <th>Temp<br><span style="font-weight:400;opacity:.7;">°F</span></th>
              <th>Pain<br><span style="font-weight:400;opacity:.7;">/10</span></th>
              <th>GCS<br><span style="font-weight:400;opacity:.7;">/15</span></th>
              <th>Glucose<br><span style="font-weight:400;opacity:.7;">mg/dL</span></th>
              <th>UOP<br><span style="font-weight:400;opacity:.7;">mL/hr</span></th>
            </tr></thead>
            <tbody id="vbody"></tbody>
            <tfoot><tr style="background:rgba(0,212,188,.04);border-top:1px solid var(--border);">
              <td style="padding:7px 7px 7px 10px;"><input class="ic" style="width:68px;" id="nv-t" placeholder="HH:MM"></td>
              <td><input class="ic" id="nv-hr" placeholder="—"></td>
              <td><input class="ic" id="nv-sbp" placeholder="—"></td>
              <td><input class="ic" id="nv-dbp" placeholder="—"></td>
              <td><input class="ic" id="nv-rr" placeholder="—"></td>
              <td><input class="ic" id="nv-sp" placeholder="—"></td>
              <td><input class="ic" id="nv-tp" placeholder="—"></td>
              <td><input class="ic" id="nv-pn" placeholder="—"></td>
              <td><input class="ic" id="nv-gc" placeholder="—"></td>
              <td><input class="ic" id="nv-gl" placeholder="—"></td>
              <td><input class="ic" id="nv-up" placeholder="—"></td>
            </tr></tfoot>
          </table>
          <div style="padding:8px 14px;display:flex;justify-content:flex-end;gap:8px;border-top:1px solid var(--border);">
            <button class="btn bsm" style="background:linear-gradient(135deg,var(--rose),#e060a0);" onclick="addV()">+ Add Vitals</button>
            <button class="btn bsm bgh" onclick="clrV()">Clear</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="ch"><span class="ci">💧</span><span class="ct" style="color:var(--blue);">INTAKE &amp; OUTPUT</span><span class="pill" id="balpill" style="background:rgba(74,144,217,.12);color:var(--blue);border:1px solid rgba(74,144,217,.3);">Balance: 0 mL</span></div>
        <div class="cb">
          <div class="iosummary">
            <div class="iobox" style="background:rgba(74,144,217,.07);border-color:rgba(74,144,217,.25);"><div class="ionum" style="color:var(--blue);" id="ti">0</div><div class="iolbl" style="color:var(--blue);">TOTAL INTAKE (mL)</div></div>
            <div class="iobox" style="background:rgba(244,114,182,.07);border-color:rgba(244,114,182,.25);"><div class="ionum" style="color:var(--rose);" id="to">0</div><div class="iolbl" style="color:var(--rose);">TOTAL OUTPUT (mL)</div></div>
            <div class="iobox" id="balbox" style="background:rgba(46,204,113,.07);border-color:rgba(46,204,113,.25);"><div class="ionum" style="color:var(--green);" id="bal">0</div><div class="iolbl" style="color:var(--green);" id="ballbl">NET BALANCE (mL)</div></div>
          </div>
          <div style="overflow-x:auto;"><table class="vtbl" id="iotbl">
            <thead><tr><th style="text-align:left;padding-left:10px;">TIME</th><th style="text-align:left;">TYPE</th><th style="text-align:left;">ROUTE</th><th>AMOUNT</th><th>DIR</th><th style="text-align:left;">NOTE</th></tr></thead>
            <tbody id="iobody"></tbody>
          </table></div>
          <div style="display:grid;grid-template-columns:68px 1fr 1fr 80px 90px 1fr auto;gap:6px;margin-top:10px;align-items:center;">
            <input class="inp" id="ni-t" placeholder="HH:MM" style="padding:5px 7px;font-size:11px;">
            <input class="inp" id="ni-ty" placeholder="Type (IV Fluid, Urine…)" style="padding:5px 8px;">
            <input class="inp" id="ni-ro" placeholder="Route" style="padding:5px 8px;">
            <input class="inp" id="ni-am" placeholder="mL" type="number" style="padding:5px 7px;font-size:11px;">
            <select class="inp" id="ni-dr" style="padding:5px 7px;cursor:pointer;"><option>IN</option><option>OUT</option></select>
            <input class="inp" id="ni-no" placeholder="Note" style="padding:5px 8px;">
            <button class="btn bsm" style="background:linear-gradient(135deg,var(--blue),#3a7bc8);white-space:nowrap;" onclick="addIO()">+ Add</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="ch"><span class="ci">📋</span><span class="ct" style="color:var(--green);">NURSING ASSESSMENT</span><span class="pill" id="acpill" style="background:rgba(46,204,113,.1);color:var(--green);border:1px solid rgba(46,204,113,.25);">0 items</span><span style="margin-left:8px;font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--muted);">Time:</span><input class="ic" id="atm" style="width:68px;margin-left:4px;"></div>
        <div class="cb">
          <div class="stabs" id="stabs"></div>
          <div class="cgrid" id="cgrid"></div>
          <textarea class="inp" id="anotes" rows="2" placeholder="Additional notes for this system…" style="margin-top:4px;"></textarea>
        </div>
      </div>
    </div>

    <!-- CHAT -->
    <div class="cpane" id="pane-chat">
      <div id="cmsg"></div>
      <div id="cia">
        <div class="fstg" id="fstg" style="display:none;"></div>
        <div class="crow">
          <button class="atbtn" onclick="document.getElementById('fup').click()" title="Attach file or image">📎</button>
          <input type="file" id="fup" multiple accept="image/*,.pdf,.doc,.docx,.txt" style="display:none;" onchange="stgF(this)">
          <div class="tawrap"><textarea id="cta" rows="1" placeholder="Message Dr. Rivera… (Enter to send · Shift+Enter for newline)" onkeydown="ckd(event)" oninput="gta(this)"></textarea></div>
          <button class="sndbtn" id="csnd" onclick="sndC()" disabled>↑</button>
        </div>
        <div class="cft">SECURE INTERNAL MESSAGING · HIPAA COMPLIANT · FILES UP TO 25 MB</div>
      </div>
    </div>

    <!-- ALERTS -->
    <div class="pane" id="pane-alerts">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px;">
        <div style="font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--bright);">Provider Alerts</div>
        <div style="flex:1;"></div>
        <button class="btn" style="background:linear-gradient(135deg,var(--red),#e04050);" onclick="openModal()">🔔 New Alert</button>
      </div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:.08em;margin-bottom:16px;">TAP ANY CARD TO PREFILL · ALL ALERTS ALSO SENT TO CHAT</div>
      <div class="lbl">QUICK FIRE</div>
      <div class="qgrid" id="qgrid"></div>
      <div class="card">
        <div class="ch"><span class="ci">📋</span><span class="ct" style="color:var(--amber);">ALERT LOG</span><span class="pill" id="alc" style="background:rgba(245,166,35,.12);color:var(--amber);border:1px solid rgba(245,166,35,.28);">0</span></div>
        <div class="cb" id="alog"><div style="text-align:center;padding:20px;color:var(--muted);font-size:12px;">No alerts yet.</div></div>
      </div>
    </div>

    <!-- ORDERS -->
    <div class="pane" id="pane-orders">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <div style="font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--bright);">Active Orders</div>
        <div id="pbanner" style="display:none;padding:4px 12px;border-radius:8px;background:rgba(245,166,35,.12);border:1px solid rgba(245,166,35,.3);font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:var(--amber);animation:pulse 1.8s infinite;"></div>
      </div>
      <div id="olist"></div>
    </div>

    <!-- LABS & MEDS -->
    <div class="pane" id="pane-labs">
      <div style="font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--bright);margin-bottom:4px;">Labs &amp; Medications</div>
      <div class="card">
        <div class="ch"><span class="ci">🧪</span><span class="ct" style="color:var(--teal);">ADD LAB RESULT</span><span style="font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--muted);">Critical values auto-alert provider</span></div>
        <div class="cb">
          <div style="display:grid;grid-template-columns:110px 1fr 90px 90px 1fr auto;gap:8px;align-items:end;margin-bottom:10px;">
            <div><div class="lbl">TIME</div><input class="inp" id="lt" style="padding:6px 8px;"></div>
            <div><div class="lbl">TEST NAME</div><input class="inp" id="ln" placeholder="Troponin I, WBC…"></div>
            <div><div class="lbl">VALUE</div><input class="inp" id="lv" placeholder="Result"></div>
            <div><div class="lbl">UNITS</div><input class="inp" id="lu" placeholder="ng/mL…"></div>
            <div><div class="lbl">REF RANGE</div><input class="inp" id="lr" placeholder="0.00–0.04"></div>
            <div style="display:flex;gap:6px;align-items:flex-end;">
              <div><div class="lbl">FLAG</div><select class="inp" id="lf" style="cursor:pointer;padding:6px 7px;"><option value="WNL">WNL</option><option value="LOW">↓ Low</option><option value="HIGH">↑ High</option><option value="CRIT">⚡ Critical</option><option value="PANIC">🚨 Panic</option></select></div>
              <button class="btn bsm" style="background:linear-gradient(135deg,var(--teal),var(--teal2));margin-bottom:1px;" onclick="addLab()">+ Add</button>
            </div>
          </div>
          <div id="llist" style="display:flex;flex-direction:column;gap:6px;"></div>
        </div>
      </div>
      <div class="card">
        <div class="ch"><span class="ci">💊</span><span class="ct" style="color:var(--purple);">MEDICATION ADMINISTRATION RECORD (MAR)</span></div>
        <div class="cb">
          <div style="display:grid;grid-template-columns:100px 1fr 100px 80px 1fr auto;gap:8px;align-items:end;margin-bottom:10px;">
            <div><div class="lbl">TIME</div><input class="inp" id="mt" style="padding:6px 8px;"></div>
            <div><div class="lbl">MEDICATION</div><input class="inp" id="mn" placeholder="Drug name and dose…"></div>
            <div><div class="lbl">ROUTE</div><select class="inp" id="mr2" style="cursor:pointer;padding:6px 7px;"><option>IV Push</option><option>IV Infusion</option><option>PO</option><option>SQ</option><option>IM</option><option>Topical</option><option>Other</option></select></div>
            <div><div class="lbl">DOSE</div><input class="inp" id="md2" placeholder="Dose"></div>
            <div><div class="lbl">NOTE / RESPONSE</div><input class="inp" id="mno" placeholder="Tolerance, response…"></div>
            <button class="btn bsm" style="background:linear-gradient(135deg,var(--purple),#7b5adf);margin-bottom:1px;" onclick="addMed()">+ Give</button>
          </div>
          <div id="mlist" style="display:flex;flex-direction:column;gap:6px;"></div>
        </div>
      </div>
      <div class="card">
        <div class="ch"><span class="ci">📌</span><span class="ct" style="color:var(--amber);">NURSE FINDINGS &amp; NOTES</span></div>
        <div class="cb">
          <div style="display:grid;grid-template-columns:100px 1fr auto auto;gap:8px;align-items:end;margin-bottom:10px;">
            <div><div class="lbl">TIME</div><input class="inp" id="ft" style="padding:6px 8px;"></div>
            <div><div class="lbl">FINDING / NOTE</div><input class="inp" id="fx" placeholder="Describe finding or note…"></div>
            <div><div class="lbl">ALERT MD</div><select class="inp" id="fa" style="cursor:pointer;padding:6px 7px;"><option value="no">No</option><option value="yes">Yes — Routine</option><option value="urgent">Yes — Urgent</option></select></div>
            <button class="btn bsm" style="background:linear-gradient(135deg,var(--amber),#d4891e);margin-bottom:1px;" onclick="addFinding()">+ Add</button>
          </div>
          <div id="flist" style="display:flex;flex-direction:column;gap:6px;"></div>
        </div>
      </div>
    </div>

    <!-- AI SUMMARY -->
    <div id="spane" id="pane-sum">
      <div id="tsbr">
        <div class="lbl" style="margin-bottom:10px;padding:0 2px;">NOTE TEMPLATES</div>
        <button class="tbtn" id="tb-shift"        onclick="selTmpl('shift')"><span class="tic2">🔄</span><div><div class="tnm">Shift Assessment</div><div class="tfd">6 fields</div></div></button>
        <button class="tbtn" id="tb-admission"    onclick="selTmpl('admission')"><span class="tic2">🏥</span><div><div class="tnm">Admission Assessment</div><div class="tfd">7 fields</div></div></button>
        <button class="tbtn" id="tb-discharge"    onclick="selTmpl('discharge')"><span class="tic2">🏠</span><div><div class="tnm">Discharge Teaching</div><div class="tfd">5 fields</div></div></button>
        <button class="tbtn" id="tb-postproc"     onclick="selTmpl('postproc')"><span class="tic2">⚕️</span><div><div class="tnm">Post-Procedure Note</div><div class="tfd">5 fields</div></div></button>
        <button class="tbtn" id="tb-critical"     onclick="selTmpl('critical')"><span class="tic2">🚨</span><div><div class="tnm">Critical Event Note</div><div class="tfd">5 fields</div></div></button>
        <button class="tbtn" id="tb-iv"           onclick="selTmpl('iv')"><span class="tic2">💉</span><div><div class="tnm">IV / Line Note</div><div class="tfd">5 fields</div></div></button>
        <button class="tbtn" id="tb-pain"         onclick="selTmpl('pain')"><span class="tic2">😖</span><div><div class="tnm">Pain Assessment</div><div class="tfd">4 fields</div></div></button>
        <div class="sdiv"></div>
        <div class="lbl" style="margin-bottom:10px;padding:0 2px;">SHIFT SUMMARY</div>
        <button class="btn" style="background:linear-gradient(135deg,var(--purple),#7b5adf);margin-bottom:8px;" onclick="genSBAR()"><span id="sbt">✦ Generate SBAR</span></button>
        <div style="font-size:10px;color:var(--muted);line-height:1.55;padding:0 2px;">AI synthesizes vitals, assessments, alerts &amp; orders into a structured SBAR note.</div>
      </div>
      <div id="tcnt">
        <div id="sbar-out" style="display:none;">
          <div class="card">
            <div class="ch"><span class="ci">✦</span><span class="ct" style="color:var(--purple);">AI-GENERATED SBAR SUMMARY</span><button class="btn bsm bgh" onclick="cpySBAR()">📋 Copy</button><button class="btn bsm bgh" style="margin-left:4px;" onclick="genSBAR()">↻ Regen</button></div>
            <div class="cb"><div class="aout" id="sbar-txt"></div></div>
          </div>
        </div>
        <div id="tmpl-wrap" style="display:none;">
          <div class="card">
            <div class="ch"><span class="ci" id="t-icon"></span><span class="ct" id="t-title" style="color:var(--teal);"></span><button class="btn bsm bgh" onclick="cpyNote()">📋 Copy Note</button><button class="btn bsm bgh" style="margin-left:4px;" onclick="genNote()">↻ Regen</button></div>
            <div class="cb">
              <div id="t-fields" style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px;"></div>
              <button class="btn" id="gnbtn" style="background:linear-gradient(135deg,var(--teal),var(--teal2));width:100%;" onclick="genNote()"><span id="gnbtxt">✦ Generate Note</span></button>
              <div id="note-out" style="display:none;margin-top:12px;"><div class="aout" id="note-txt"></div></div>
            </div>
          </div>
        </div>
        <div id="tmpl-empty" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 20px;text-align:center;">
          <div style="font-size:52px;margin-bottom:16px;opacity:.1;">✦</div>
          <div style="font-family:'Playfair Display',serif;font-size:24px;font-weight:700;color:var(--bright);margin-bottom:10px;">AI Documentation Assistant</div>
          <div style="font-size:13px;color:var(--muted);line-height:1.75;max-width:400px;">Select a template on the left, or click <strong style="color:var(--purple);">Generate SBAR</strong> for a complete shift summary.</div>
        </div>
      </div>
    </div>

  </div>
</div>
</div>

<!-- MODAL -->
<div id="moverlay" onclick="closeM(event)">
  <div id="modal">
    <div class="mtit">Alert Provider</div>
    <div class="msub">NOTIFY DR. RIVERA IMMEDIATELY</div>
    <div class="lbl">ALERT TYPE</div>
    <div class="qagrid" id="mgrid"></div>
    <div class="lbl">PRIORITY</div>
    <div class="prirow">
      <button class="prib" id="p-CRITICAL" onclick="selP('CRITICAL')" style="border-color:rgba(255,92,108,.5);background:rgba(255,92,108,.09);color:var(--red);">CRITICAL</button>
      <button class="prib" id="p-URGENT"   onclick="selP('URGENT')">URGENT</button>
      <button class="prib" id="p-ROUTINE"  onclick="selP('ROUTINE')">ROUTINE</button>
    </div>
    <div class="lbl">MESSAGE TO PROVIDER</div>
    <textarea class="inp" id="mmsg" rows="4" placeholder="Describe the clinical finding, values, or concern…" style="margin-bottom:16px;"></textarea>
    <div class="mact">
      <button class="btn" style="flex:1;background:linear-gradient(135deg,var(--red),#e04050);" onclick="fireA()">🔔 Send Alert to Dr. Rivera</button>
      <button class="btn bgh" onclick="document.getElementById('moverlay').classList.remove('show')">Cancel</button>
    </div>
  </div>
</div>`;

export default function NursingFlowsheet() {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Notrya — Nursing Flowsheet</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --navy:#050f1e;--slate:#0b1d35;--panel:#0d2240;--edge:#162d4f;
  --border:#1e3a5f;--muted:#2a4d72;--dim:#4a7299;--text:#c8ddf0;
  --bright:#e8f4ff;--teal:#00d4bc;--teal2:#00b8a5;
  --amber:#f5a623;--red:#ff5c6c;--green:#2ecc71;
  --purple:#9b6dff;--blue:#4a90d9;--rose:#f472b6;
}
html,body{height:100%;background:var(--navy);color:var(--text);font-family:'DM Sans',sans-serif;overflow:hidden}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}
@keyframes popIn{from{opacity:0;transform:scale(.94) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
#app{height:100vh;display:flex;flex-direction:column}
nav{height:54px;background:rgba(11,29,53,.98);border-bottom:1px solid var(--border);backdrop-filter:blur(20px);display:flex;align-items:center;padding:0 18px;gap:10px;flex-shrink:0;z-index:200}
.logo{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--bright);letter-spacing:-.02em;cursor:pointer}
.sep{width:1px;height:18px;background:var(--border);flex-shrink:0}
.nav-badge{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:var(--rose);letter-spacing:.14em}
.sp{flex:1}
.npill{display:flex;align-items:center;gap:5px;padding:3px 11px;border-radius:8px;font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700}
.npill.live{background:rgba(0,212,188,.08);border:1px solid rgba(0,212,188,.25);color:var(--teal)}
.npill.live .dot{width:6px;height:6px;border-radius:50%;background:var(--teal);animation:blink 1.6s infinite}
.npill.crit{background:rgba(255,92,108,.12);border:1px solid rgba(255,92,108,.35);color:var(--red);animation:pulse 1.4s infinite}
.npill.crit .dot{width:6px;height:6px;border-radius:50%;background:var(--red)}
.pstrip{display:flex;align-items:center;gap:12px;padding:6px 14px;border-radius:10px;background:var(--edge);border:1px solid var(--border)}
.pname{font-weight:700;font-size:13px;color:var(--bright);line-height:1}
.psub{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--dim);margin-top:3px}
.abtn{display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:9px;font-size:11px;font-weight:700;cursor:pointer;border:none;background:linear-gradient(135deg,var(--red),#e04050);color:#fff;transition:all .15s}
.abtn:hover{transform:scale(1.03);box-shadow:0 4px 18px rgba(255,92,108,.35)}
.nbtn{padding:4px 10px;border-radius:8px;font-size:10px;font-weight:600;cursor:pointer;border:1px solid var(--border);background:var(--edge);color:var(--dim);font-family:'DM Sans',sans-serif;transition:all .15s}
.nbtn:hover{color:var(--text);border-color:var(--dim)}
.clk{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:var(--bright)}
#sbar2{background:var(--slate);border-bottom:1px solid var(--border);padding:6px 18px;display:flex;gap:20px;align-items:center;flex-shrink:0;flex-wrap:wrap}
.sg{display:flex;align-items:baseline;gap:5px}
.sl{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--muted)}
.sv{font-family:'JetBrains Mono',monospace;font-size:17px;font-weight:700;color:var(--text);line-height:1}
.su{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--muted)}
.sf{font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;padding:1px 5px;border-radius:5px}
.fc{background:rgba(255,92,108,.15);color:var(--red);border:1px solid rgba(255,92,108,.3)}
.fh{background:rgba(245,166,35,.13);color:var(--amber);border:1px solid rgba(245,166,35,.3)}
.fw{background:rgba(46,204,113,.08);color:var(--green);border:1px solid rgba(46,204,113,.25)}
#main{flex:1;display:flex;overflow:hidden}
#sidebar{width:148px;flex-shrink:0;background:var(--panel);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:10px 8px;gap:3px;overflow-y:auto}
.tb{display:flex;align-items:center;gap:8px;padding:10px 9px;border-radius:10px;cursor:pointer;background:transparent;border:1px solid transparent;text-align:left;position:relative;transition:all .12s;font-family:'DM Sans',sans-serif;width:100%}
.tb.on{background:rgba(0,212,188,.1);border-color:rgba(0,212,188,.3)}
.tb:hover:not(.on){background:rgba(255,255,255,.03);border-color:rgba(255,255,255,.06)}
.ti{font-size:14px;flex-shrink:0}
.tl{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;color:var(--dim);letter-spacing:.06em}
.tb.on .tl{color:var(--teal)}
.tbadge{position:absolute;top:4px;right:6px;min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;color:#fff;padding:0 4px}
.pcard{margin-top:auto;padding:10px 9px;background:var(--edge);border-radius:10px;border:1px solid var(--border)}
.pcr{display:flex;justify-content:space-between;margin-bottom:3px}
.pck{font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--muted)}
.pcv{font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--text);font-weight:700}
#content{flex:1;overflow:hidden;display:flex;flex-direction:column}
.pane{flex:1;overflow-y:auto;padding:16px 18px;display:none;flex-direction:column;gap:16px;animation:fadeUp .2s ease}
.pane.on{display:flex}
.cpane{flex:1;overflow:hidden;display:none;flex-direction:column}
.cpane.on{display:flex}
#spane{flex:1;overflow:hidden;display:none}
#spane.on{display:flex}
.card{background:var(--panel);border:1px solid var(--border);border-radius:14px;overflow:hidden}
.ch{padding:9px 14px;background:rgba(0,0,0,.2);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px}
.ci{font-size:14px}
.ct{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;letter-spacing:.1em;flex:1}
.cb{padding:14px}
.pill{font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;padding:2px 7px;border-radius:6px;display:inline-flex;align-items:center}
.inp{background:var(--edge);border:1px solid var(--border);border-radius:8px;padding:7px 10px;color:var(--text);font-family:'DM Sans',sans-serif;font-size:12px;outline:none;width:100%;transition:border-color .15s}
.inp:focus{border-color:var(--dim)}
.inp::placeholder{color:var(--muted)}
select.inp option{background:var(--slate)}
textarea.inp{resize:vertical;line-height:1.65}
.btn{padding:7px 16px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;border:none;color:var(--navy);transition:all .15s;display:inline-flex;align-items:center;gap:6px;justify-content:center;font-family:'DM Sans',sans-serif}
.btn:hover:not(:disabled){filter:brightness(1.12);transform:translateY(-1px)}
.btn:disabled{opacity:.45;cursor:not-allowed;transform:none}
.bsm{padding:4px 10px;border-radius:7px;font-size:10px}
.bgh{background:transparent;border:1px solid var(--border);color:var(--dim);font-weight:600}
.bgh:hover:not(:disabled){border-color:var(--dim);color:var(--text);filter:none;transform:none}
.lbl{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;color:var(--dim);letter-spacing:.1em;margin-bottom:6px}
.vtbl{width:100%;border-collapse:collapse;font-size:11px}
.vtbl th{padding:6px 8px;text-align:center;font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;color:var(--dim);letter-spacing:.07em;border-bottom:1px solid var(--border);background:var(--slate);white-space:nowrap}
.vtbl th:first-child{text-align:left;padding-left:14px}
.vtbl td{padding:7px 6px;text-align:center;border-bottom:1px solid var(--edge)}
.vtbl td:first-child{text-align:left;padding-left:14px;font-family:'JetBrains Mono',monospace;font-weight:700;font-size:11px;color:var(--text)}
.vtbl tr:nth-child(even) td{background:rgba(11,29,53,.5)}
.vv{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700}
.vf{font-family:'JetBrains Mono',monospace;font-size:7px;margin-top:2px}
.ic{background:var(--edge);border:1px solid var(--border);border-radius:6px;padding:4px 5px;color:var(--text);font-family:'JetBrains Mono',monospace;font-size:11px;outline:none;width:58px;text-align:center;transition:border-color .15s}
.ic:focus{border-color:var(--teal)}
.ic::placeholder{color:var(--muted)}
.iosummary{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px}
.iobox{text-align:center;padding:10px;border-radius:10px;border:1px solid}
.ionum{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;line-height:1}
.iolbl{font-family:'JetBrains Mono',monospace;font-size:8px;margin-top:4px}
.stabs{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:12px}
.stab{padding:4px 11px;border-radius:7px;font-size:10px;font-weight:700;cursor:pointer;font-family:'JetBrains Mono',monospace;letter-spacing:.05em;background:transparent;border:1px solid var(--border);color:var(--dim);transition:all .12s}
.stab.on{background:rgba(46,204,113,.12);border-color:rgba(46,204,113,.35);color:var(--green)}
.cgrid{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:10px}
.chip{display:flex;align-items:center;gap:6px;padding:5px 10px;border-radius:8px;cursor:pointer;background:transparent;border:1px solid var(--border);transition:all .12s;font-family:'DM Sans',sans-serif;font-size:11px;color:var(--dim)}
.chip:hover{border-color:rgba(0,212,188,.35)}
.chip.on{background:rgba(46,204,113,.1);border-color:rgba(46,204,113,.35);color:var(--bright)}
.cbox{width:14px;height:14px;border-radius:4px;border:2px solid var(--muted);background:transparent;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .12s}
.chip.on .cbox{background:var(--green);border-color:var(--green)}
#cmsg{flex:1;overflow-y:auto;padding:16px 18px}
.mr{display:flex;gap:10px;margin-bottom:20px;align-items:flex-start;animation:fadeUp .2s ease}
.mr.me{flex-direction:row-reverse}
.av{width:36px;height:36px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;margin-top:2px}
.av.rn{background:rgba(0,212,188,.12);border:1.5px solid rgba(0,212,188,.35);color:var(--teal)}
.av.md{background:rgba(74,144,217,.12);border:1.5px solid rgba(74,144,217,.35);color:var(--blue)}
.av.sys{background:rgba(155,109,255,.12);border:1.5px solid rgba(155,109,255,.35);color:var(--purple);font-size:14px}
.bwrap{max-width:72%}
.bmeta{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--muted);margin-bottom:4px}
.mr.me .bmeta{text-align:right}
.bub{padding:11px 14px;position:relative}
.bub.rn{background:rgba(0,212,188,.09);border:1px solid rgba(0,212,188,.28);border-radius:14px 4px 14px 14px}
.bub.md{background:var(--panel);border:1px solid var(--border);border-radius:4px 14px 14px 14px}
.bub.al{border-radius:12px}
.btxt{font-size:13px;color:var(--bright);line-height:1.75}
.burg{position:absolute;top:-7px;right:10px;padding:2px 7px;border-radius:6px;background:var(--red);font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;color:#fff}
.fprev{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.fchip{display:flex;gap:7px;align-items:center;padding:5px 10px;border-radius:8px;background:var(--edge);border:1px solid var(--border);cursor:pointer;transition:all .12s}
.fchip:hover{border-color:var(--teal)}
.fn{font-size:11px;font-weight:600;color:var(--bright)}
.fs{font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--dim);margin-top:1px}
#cia{background:rgba(11,29,53,.96);border-top:1px solid var(--border);padding:12px 16px;flex-shrink:0}
.fstg{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.sff{display:flex;gap:7px;align-items:center;padding:4px 10px;border-radius:8px;background:var(--edge);border:1px solid var(--border)}
.srm{background:none;border:none;color:var(--muted);cursor:pointer;font-size:12px;padding:0 2px;transition:color .12s}
.srm:hover{color:var(--red)}
.crow{display:flex;gap:8px;align-items:flex-end}
.atbtn{padding:10px 11px;border-radius:10px;border:1px solid var(--border);background:var(--edge);color:var(--dim);cursor:pointer;font-size:15px;flex-shrink:0;transition:all .15s}
.atbtn:hover{border-color:var(--teal);color:var(--teal)}
.tawrap{flex:1;background:var(--edge);border:1px solid var(--border);border-radius:12px;padding:10px 14px;transition:border-color .15s}
.tawrap:focus-within{border-color:rgba(74,144,217,.55)}
#cta{width:100%;background:transparent;border:none;outline:none;color:var(--bright);font-family:'DM Sans',sans-serif;font-size:13px;line-height:1.6;resize:none;min-height:22px;max-height:100px;overflow-y:auto;display:block}
#cta::placeholder{color:var(--muted)}
.sndbtn{width:44px;height:44px;border-radius:11px;border:none;cursor:pointer;background:linear-gradient(135deg,var(--blue),#3a7bc8);color:#fff;font-size:18px;font-weight:700;flex-shrink:0;transition:all .18s}
.sndbtn:disabled{background:var(--edge);color:var(--muted);cursor:not-allowed;opacity:.5}
.sndbtn:not(:disabled):hover{box-shadow:0 4px 18px rgba(74,144,217,.35);transform:scale(1.05)}
.cft{text-align:center;margin-top:8px;font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--muted)}
.qgrid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:20px}
.qcard{background:var(--panel);border:1px solid var(--border);border-radius:11px;padding:12px 10px;cursor:pointer;text-align:center;transition:all .15s}
.qcard:hover{transform:translateY(-2px)}
.qi{font-size:22px;margin-bottom:6px}
.ql{font-size:10px;font-weight:700;color:var(--text);margin-bottom:4px}
.arow{padding:13px 16px;border-radius:12px;margin-bottom:8px;display:flex;gap:12px;align-items:flex-start;transition:all .15s}
.aicn{font-size:18px;flex-shrink:0}
.abdy{flex:1}
.amet{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:5px}
.atxt{font-size:12px;color:var(--text);line-height:1.65}
.aack{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--green)}
.ocard{background:var(--panel);border:1px solid var(--border);border-radius:13px;padding:14px 16px;display:flex;gap:12px;align-items:flex-start;transition:all .15s;margin-bottom:10px}
.ocard:hover{background:rgba(0,212,188,.02)}
.osta{width:34px;height:34px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;margin-top:2px;font-size:14px}
.obdy{flex:1}
.omet{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:5px}
.otxt{font-size:13px;font-weight:600;color:var(--bright);line-height:1.6;margin-bottom:4px}
.onot{font-size:11px;color:var(--dim);margin-bottom:6px}
.oack{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--green)}
.oact{display:flex;flex-direction:column;gap:6px;flex-shrink:0}
#tsbr{width:220px;flex-shrink:0;border-right:1px solid var(--border);padding:14px 10px;overflow-y:auto;display:flex;flex-direction:column;gap:3px}
#tcnt{flex:1;overflow-y:auto;padding:16px 18px;display:flex;flex-direction:column;gap:14px}
.tbtn{display:flex;gap:8px;align-items:flex-start;padding:10px 9px;border-radius:10px;cursor:pointer;background:transparent;border:1px solid var(--border);transition:all .12s;width:100%;text-align:left;font-family:'DM Sans',sans-serif}
.tbtn:hover{background:rgba(0,212,188,.04);border-color:rgba(0,212,188,.2)}
.tbtn.on{background:rgba(0,212,188,.09);border-color:rgba(0,212,188,.3)}
.tic2{font-size:16px;flex-shrink:0}
.tnm{font-size:11px;font-weight:700;color:var(--text);line-height:1.3;margin-bottom:2px}
.tbtn.on .tnm{color:var(--teal)}
.tfd{font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--muted)}
.sdiv{margin:14px 0;border-top:1px solid var(--border);padding-top:14px}
.aout{background:rgba(155,109,255,.05);border:1px solid rgba(155,109,255,.2);border-radius:10px;padding:14px 16px;line-height:1.8;font-size:13px;color:var(--text);white-space:pre-wrap;max-height:380px;overflow-y:auto}
.skel{height:12px;border-radius:6px;margin-bottom:9px;background:linear-gradient(90deg,var(--edge) 0%,rgba(42,77,114,.5) 50%,var(--edge) 100%);background-size:600px 100%;animation:shimmer 1.4s infinite}
#moverlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(5px);display:none;align-items:center;justify-content:center;z-index:500}
#moverlay.show{display:flex}
#modal{background:var(--slate);border:1px solid var(--border);border-radius:18px;padding:24px;width:100%;max-width:520px;box-shadow:0 24px 64px rgba(0,0,0,.5);animation:popIn .2s ease}
.mtit{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:var(--bright);margin-bottom:4px}
.msub{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--dim);letter-spacing:.08em;margin-bottom:18px}
.qagrid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:14px}
.qaopt{display:flex;gap:8px;align-items:center;padding:8px 10px;border-radius:9px;cursor:pointer;border:1px solid var(--border);background:transparent;text-align:left;transition:all .12s;font-family:'DM Sans',sans-serif;width:100%}
.qaopt.sel{border-color:rgba(255,92,108,.5);background:rgba(255,92,108,.09)}
.qanm{font-size:11px;font-weight:600;color:var(--text);display:block}
.prirow{display:flex;gap:6px;margin-bottom:14px}
.prib{flex:1;padding:7px;border-radius:8px;font-size:10px;font-weight:700;cursor:pointer;font-family:'JetBrains Mono',monospace;background:transparent;border:1px solid var(--border);color:var(--muted);transition:all .12s}
.mact{display:flex;gap:10px;margin-top:16px}
</style>
</head>
<body>
${BODY_HTML}
<script>${SCRIPT_CONTENT}</script>
</body>
</html>`;

  return (
    <div style={{ height: "100vh", width: "100vw", overflow: "hidden" }}>
      <iframe
        srcDoc={htmlContent}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block"
        }}
        title="Nursing Flowsheet"
      />
    </div>
  );
}

const SCRIPT_CONTENT = `const VD=[{id:"hr",lo:60,hi:100,clo:40,chi:150},{id:"sbp",lo:90,hi:180,clo:70,chi:220},{id:"dbp",lo:60,hi:110,clo:40,chi:130},{id:"rr",lo:12,hi:20,clo:8,chi:30},{id:"spo2",lo:95,hi:100,clo:88,chi:null},{id:"temp",lo:97,hi:99,clo:94,chi:104},{id:"pain",lo:0,hi:3,clo:null,chi:8},{id:"gcs",lo:14,hi:15,clo:null,chi:null},{id:"gluc",lo:70,hi:140,clo:50,chi:400},{id:"uop",lo:30,hi:999,clo:null,chi:null}];

<nav>
  <span class="logo">Notrya</span>
  <div class="sep"></div>
  <span class="nav-badge">NURSING FLOWSHEET</span>
  <div id="upill" class="npill crit" style="display:none;"><div class="dot"></div><span id="ucnt">0</span>&nbsp;UNACK'D</div>
  <div class="sp"></div>
  <div class="pstrip">
    <div><div class="pname">Margaret T. Sullivan</div><div class="psub">67y F · Room TR-1 · Dr. Rivera · NPO</div></div>
    <div class="sep"></div>
    <div style="text-align:right;">
      <span class="pill" style="background:rgba(255,92,108,.15);color:var(--red);border:1px solid rgba(255,92,108,.35);">Full Code</span>
      <div style="font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--muted);margin-top:3px;">⚠ PCN · ASA Allergy</div>
    </div>
  </div>
  <div class="sep"></div>
  <button class="abtn" onclick="openModal()">🔔 Alert Provider</button>
  <button class="nbtn" onclick="sw('chat')">💬 Chat MD</button>
  <button class="nbtn" onclick="sw('orders')">📋 Orders</button>
  <span class="clk" id="clk">--:--</span>
</nav>

<div id="sbar2">
  <div class="sg"><span class="sl">HR</span><span class="sv" id="s-hr">—</span><span class="su">bpm</span><span class="sf" id="s-hrf" style="display:none;"></span></div>
  <div class="sg"><span class="sl">BP</span><span class="sv" id="s-bp">—</span><span class="su">mmHg</span><span class="sf" id="s-bpf" style="display:none;"></span></div>
  <div class="sg"><span class="sl">SpO₂</span><span class="sv" id="s-sp">—</span><span class="su">%</span><span class="sf" id="s-spf" style="display:none;"></span></div>
  <div class="sg"><span class="sl">Temp</span><span class="sv" id="s-tp">—</span><span class="su">°F</span><span class="sf" id="s-tpf" style="display:none;"></span></div>
  <div class="sg"><span class="sl">Pain</span><span class="sv" id="s-pn">—</span><span class="su">/10</span></div>
  <div class="sg"><span class="sl">I/O</span><span class="sv" id="s-io">—/—</span><span class="su">mL</span></div>
  <div style="margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--dim);">Admitted 10/14 08:14 · Chest pain, r/o NSTEMI</div>
</div>

<div id="main">
  <div id="sidebar">
    <button class="tb on" data-t="flow" onclick="sw('flow')"><span class="ti">📊</span><span class="tl">FLOWSHEET</span></button>
    <button class="tb" data-t="chat" onclick="sw('chat')"><span class="ti">💬</span><span class="tl">CHAT MD</span><span class="tbadge" id="bc" style="display:none;background:var(--blue);"></span></button>
    <button class="tb" data-t="alerts" onclick="sw('alerts')"><span class="ti">🔔</span><span class="tl">ALERTS</span><span class="tbadge" id="ba" style="display:none;background:var(--red);"></span></button>
    <button class="tb" data-t="orders" onclick="sw('orders')"><span class="ti">📋</span><span class="tl">ORDERS</span><span class="tbadge" id="bo" style="display:none;background:var(--amber);"></span></button>
    <button class="tb" data-t="labs" onclick="sw('labs')"><span class="ti">🧪</span><span class="tl">LABS &amp; MEDS</span></button>
    <button class="tb" data-t="sum" onclick="sw('sum')"><span class="ti">✦</span><span class="tl">AI SUMMARY</span></button>
    <div class="pcard" style="margin-top:auto;">
      <div style="font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;color:var(--teal);letter-spacing:.1em;margin-bottom:7px;">PATIENT</div>
      <div class="pcr"><span class="pck">MRN</span><span class="pcv">884412</span></div>
      <div class="pcr"><span class="pck">Room</span><span class="pcv">TR-1-A</span></div>
      <div class="pcr"><span class="pck">Diet</span><span class="pcv">NPO</span></div>
      <div class="pcr"><span class="pck">Code</span><span class="pcv" style="color:var(--red);">Full</span></div>
      <div class="pcr"><span class="pck">Wt</span><span class="pcv">72 kg</span></div>
      <div class="pcr"><span class="pck">Iso</span><span class="pcv">Standard</span></div>
    </div>
  </div>

  <div id="content">

    <!-- FLOWSHEET -->
    <div class="pane on" id="pane-flow">
      <div class="card">
        <div class="ch"><span class="ci">❤️</span><span class="ct" style="color:var(--rose);">VITAL SIGNS FLOWSHEET</span><span class="pill" id="crit-pill" style="background:rgba(255,92,108,.14);color:var(--red);border:1px solid rgba(255,92,108,.3);display:none;"></span></div>
        <div class="cb" style="padding:0;overflow-x:auto;">
          <table class="vtbl" id="vtbl">
            <thead><tr>
              <th style="text-align:left;padding-left:14px;">TIME</th>
              <th>HR<br><span style="font-weight:400;opacity:.7;">bpm</span></th>
              <th>SBP<br><span style="font-weight:400;opacity:.7;">mmHg</span></th>
              <th>DBP<br><span style="font-weight:400;opacity:.7;">mmHg</span></th>
              <th>RR<br><span style="font-weight:400;opacity:.7;">/min</span></th>
              <th>SpO₂<br><span style="font-weight:400;opacity:.7;">%</span></th>
              <th>Temp<br><span style="font-weight:400;opacity:.7;">°F</span></th>
              <th>Pain<br><span style="font-weight:400;opacity:.7;">/10</span></th>
              <th>GCS<br><span style="font-weight:400;opacity:.7;">/15</span></th>
              <th>Glucose<br><span style="font-weight:400;opacity:.7;">mg/dL</span></th>
              <th>UOP<br><span style="font-weight:400;opacity:.7;">mL/hr</span></th>
            </tr></thead>
            <tbody id="vbody"></tbody>
            <tfoot><tr style="background:rgba(0,212,188,.04);border-top:1px solid var(--border);">
              <td style="padding:7px 7px 7px 10px;"><input class="ic" style="width:68px;" id="nv-t" placeholder="HH:MM"></td>
              <td><input class="ic" id="nv-hr" placeholder="—"></td>
              <td><input class="ic" id="nv-sbp" placeholder="—"></td>
              <td><input class="ic" id="nv-dbp" placeholder="—"></td>
              <td><input class="ic" id="nv-rr" placeholder="—"></td>
              <td><input class="ic" id="nv-sp" placeholder="—"></td>
              <td><input class="ic" id="nv-tp" placeholder="—"></td>
              <td><input class="ic" id="nv-pn" placeholder="—"></td>
              <td><input class="ic" id="nv-gc" placeholder="—"></td>
              <td><input class="ic" id="nv-gl" placeholder="—"></td>
              <td><input class="ic" id="nv-up" placeholder="—"></td>
            </tr></tfoot>
          </table>
          <div style="padding:8px 14px;display:flex;justify-content:flex-end;gap:8px;border-top:1px solid var(--border);">
            <button class="btn bsm" style="background:linear-gradient(135deg,var(--rose),#e060a0);" onclick="addV()">+ Add Vitals</button>
            <button class="btn bsm bgh" onclick="clrV()">Clear</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="ch"><span class="ci">💧</span><span class="ct" style="color:var(--blue);">INTAKE &amp; OUTPUT</span><span class="pill" id="balpill" style="background:rgba(74,144,217,.12);color:var(--blue);border:1px solid rgba(74,144,217,.3);">Balance: 0 mL</span></div>
        <div class="cb">
          <div class="iosummary">
            <div class="iobox" style="background:rgba(74,144,217,.07);border-color:rgba(74,144,217,.25);"><div class="ionum" style="color:var(--blue);" id="ti">0</div><div class="iolbl" style="color:var(--blue);">TOTAL INTAKE (mL)</div></div>
            <div class="iobox" style="background:rgba(244,114,182,.07);border-color:rgba(244,114,182,.25);"><div class="ionum" style="color:var(--rose);" id="to">0</div><div class="iolbl" style="color:var(--rose);">TOTAL OUTPUT (mL)</div></div>
            <div class="iobox" id="balbox" style="background:rgba(46,204,113,.07);border-color:rgba(46,204,113,.25);"><div class="ionum" style="color:var(--green);" id="bal">0</div><div class="iolbl" style="color:var(--green);" id="ballbl">NET BALANCE (mL)</div></div>
          </div>
          <div style="overflow-x:auto;"><table class="vtbl" id="iotbl">
            <thead><tr><th style="text-align:left;padding-left:10px;">TIME</th><th style="text-align:left;">TYPE</th><th style="text-align:left;">ROUTE</th><th>AMOUNT</th><th>DIR</th><th style="text-align:left;">NOTE</th></tr></thead>
            <tbody id="iobody"></tbody>
          </table></div>
          <div style="display:grid;grid-template-columns:68px 1fr 1fr 80px 90px 1fr auto;gap:6px;margin-top:10px;align-items:center;">
            <input class="inp" id="ni-t" placeholder="HH:MM" style="padding:5px 7px;font-size:11px;">
            <input class="inp" id="ni-ty" placeholder="Type (IV Fluid, Urine…)" style="padding:5px 8px;">
            <input class="inp" id="ni-ro" placeholder="Route" style="padding:5px 8px;">
            <input class="inp" id="ni-am" placeholder="mL" type="number" style="padding:5px 7px;font-size:11px;">
            <select class="inp" id="ni-dr" style="padding:5px 7px;cursor:pointer;"><option>IN</option><option>OUT</option></select>
            <input class="inp" id="ni-no" placeholder="Note" style="padding:5px 8px;">
            <button class="btn bsm" style="background:linear-gradient(135deg,var(--blue),#3a7bc8);white-space:nowrap;" onclick="addIO()">+ Add</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="ch"><span class="ci">📋</span><span class="ct" style="color:var(--green);">NURSING ASSESSMENT</span><span class="pill" id="acpill" style="background:rgba(46,204,113,.1);color:var(--green);border:1px solid rgba(46,204,113,.25);">0 items</span><span style="margin-left:8px;font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--muted);">Time:</span><input class="ic" id="atm" style="width:68px;margin-left:4px;"></div>
        <div class="cb">
          <div class="stabs" id="stabs"></div>
          <div class="cgrid" id="cgrid"></div>
          <textarea class="inp" id="anotes" rows="2" placeholder="Additional notes for this system…" style="margin-top:4px;"></textarea>
        </div>
      </div>
    </div>

    <!-- CHAT -->
    <div class="cpane" id="pane-chat">
      <div id="cmsg"></div>
      <div id="cia">
        <div class="fstg" id="fstg" style="display:none;"></div>
        <div class="crow">
          <button class="atbtn" onclick="document.getElementById('fup').click()" title="Attach file or image">📎</button>
          <input type="file" id="fup" multiple accept="image/*,.pdf,.doc,.docx,.txt" style="display:none;" onchange="stgF(this)">
          <div class="tawrap"><textarea id="cta" rows="1" placeholder="Message Dr. Rivera… (Enter to send · Shift+Enter for newline)" onkeydown="ckd(event)" oninput="gta(this)"></textarea></div>
          <button class="sndbtn" id="csnd" onclick="sndC()" disabled>↑</button>
        </div>
        <div class="cft">SECURE INTERNAL MESSAGING · HIPAA COMPLIANT · FILES UP TO 25 MB</div>
      </div>
    </div>

    <!-- ALERTS -->
    <div class="pane" id="pane-alerts">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px;">
        <div style="font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--bright);">Provider Alerts</div>
        <div style="flex:1;"></div>
        <button class="btn" style="background:linear-gradient(135deg,var(--red),#e04050);" onclick="openModal()">🔔 New Alert</button>
      </div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:.08em;margin-bottom:16px;">TAP ANY CARD TO PREFILL · ALL ALERTS ALSO SENT TO CHAT</div>
      <div class="lbl">QUICK FIRE</div>
      <div class="qgrid" id="qgrid"></div>
      <div class="card">
        <div class="ch"><span class="ci">📋</span><span class="ct" style="color:var(--amber);">ALERT LOG</span><span class="pill" id="alc" style="background:rgba(245,166,35,.12);color:var(--amber);border:1px solid rgba(245,166,35,.28);">0</span></div>
        <div class="cb" id="alog"><div style="text-align:center;padding:20px;color:var(--muted);font-size:12px;">No alerts yet.</div></div>
      </div>
    </div>

    <!-- ORDERS -->
    <div class="pane" id="pane-orders">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <div style="font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--bright);">Active Orders</div>
        <div id="pbanner" style="display:none;padding:4px 12px;border-radius:8px;background:rgba(245,166,35,.12);border:1px solid rgba(245,166,35,.3);font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:var(--amber);animation:pulse 1.8s infinite;"></div>
      </div>
      <div id="olist"></div>
    </div>

    <!-- LABS & MEDS -->
    <div class="pane" id="pane-labs">
      <div style="font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--bright);margin-bottom:4px;">Labs &amp; Medications</div>
      <div class="card">
        <div class="ch"><span class="ci">🧪</span><span class="ct" style="color:var(--teal);">ADD LAB RESULT</span><span style="font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--muted);">Critical values auto-alert provider</span></div>
        <div class="cb">
          <div style="display:grid;grid-template-columns:110px 1fr 90px 90px 1fr auto;gap:8px;align-items:end;margin-bottom:10px;">
            <div><div class="lbl">TIME</div><input class="inp" id="lt" style="padding:6px 8px;"></div>
            <div><div class="lbl">TEST NAME</div><input class="inp" id="ln" placeholder="Troponin I, WBC…"></div>
            <div><div class="lbl">VALUE</div><input class="inp" id="lv" placeholder="Result"></div>
            <div><div class="lbl">UNITS</div><input class="inp" id="lu" placeholder="ng/mL…"></div>
            <div><div class="lbl">REF RANGE</div><input class="inp" id="lr" placeholder="0.00–0.04"></div>
            <div style="display:flex;gap:6px;align-items:flex-end;">
              <div><div class="lbl">FLAG</div><select class="inp" id="lf" style="cursor:pointer;padding:6px 7px;"><option value="WNL">WNL</option><option value="LOW">↓ Low</option><option value="HIGH">↑ High</option><option value="CRIT">⚡ Critical</option><option value="PANIC">🚨 Panic</option></select></div>
              <button class="btn bsm" style="background:linear-gradient(135deg,var(--teal),var(--teal2));margin-bottom:1px;" onclick="addLab()">+ Add</button>
            </div>
          </div>
          <div id="llist" style="display:flex;flex-direction:column;gap:6px;"></div>
        </div>
      </div>
      <div class="card">
        <div class="ch"><span class="ci">💊</span><span class="ct" style="color:var(--purple);">MEDICATION ADMINISTRATION RECORD (MAR)</span></div>
        <div class="cb">
          <div style="display:grid;grid-template-columns:100px 1fr 100px 80px 1fr auto;gap:8px;align-items:end;margin-bottom:10px;">
            <div><div class="lbl">TIME</div><input class="inp" id="mt" style="padding:6px 8px;"></div>
            <div><div class="lbl">MEDICATION</div><input class="inp" id="mn" placeholder="Drug name and dose…"></div>
            <div><div class="lbl">ROUTE</div><select class="inp" id="mr2" style="cursor:pointer;padding:6px 7px;"><option>IV Push</option><option>IV Infusion</option><option>PO</option><option>SQ</option><option>IM</option><option>Topical</option><option>Other</option></select></div>
            <div><div class="lbl">DOSE</div><input class="inp" id="md2" placeholder="Dose"></div>
            <div><div class="lbl">NOTE / RESPONSE</div><input class="inp" id="mno" placeholder="Tolerance, response…"></div>
            <button class="btn bsm" style="background:linear-gradient(135deg,var(--purple),#7b5adf);margin-bottom:1px;" onclick="addMed()">+ Give</button>
          </div>
          <div id="mlist" style="display:flex;flex-direction:column;gap:6px;"></div>
        </div>
      </div>
      <div class="card">
        <div class="ch"><span class="ci">📌</span><span class="ct" style="color:var(--amber);">NURSE FINDINGS &amp; NOTES</span></div>
        <div class="cb">
          <div style="display:grid;grid-template-columns:100px 1fr auto auto;gap:8px;align-items:end;margin-bottom:10px;">
            <div><div class="lbl">TIME</div><input class="inp" id="ft" style="padding:6px 8px;"></div>
            <div><div class="lbl">FINDING / NOTE</div><input class="inp" id="fx" placeholder="Describe finding or note…"></div>
            <div><div class="lbl">ALERT MD</div><select class="inp" id="fa" style="cursor:pointer;padding:6px 7px;"><option value="no">No</option><option value="yes">Yes — Routine</option><option value="urgent">Yes — Urgent</option></select></div>
            <button class="btn bsm" style="background:linear-gradient(135deg,var(--amber),#d4891e);margin-bottom:1px;" onclick="addFinding()">+ Add</button>
          </div>
          <div id="flist" style="display:flex;flex-direction:column;gap:6px;"></div>
        </div>
      </div>
    </div>

    <!-- AI SUMMARY -->
    <div id="spane" id="pane-sum">
      <div id="tsbr">
        <div class="lbl" style="margin-bottom:10px;padding:0 2px;">NOTE TEMPLATES</div>
        <button class="tbtn" id="tb-shift"        onclick="selTmpl('shift')"><span class="tic2">🔄</span><div><div class="tnm">Shift Assessment</div><div class="tfd">6 fields</div></div></button>
        <button class="tbtn" id="tb-admission"    onclick="selTmpl('admission')"><span class="tic2">🏥</span><div><div class="tnm">Admission Assessment</div><div class="tfd">7 fields</div></div></button>
        <button class="tbtn" id="tb-discharge"    onclick="selTmpl('discharge')"><span class="tic2">🏠</span><div><div class="tnm">Discharge Teaching</div><div class="tfd">5 fields</div></div></button>
        <button class="tbtn" id="tb-postproc"     onclick="selTmpl('postproc')"><span class="tic2">⚕️</span><div><div class="tnm">Post-Procedure Note</div><div class="tfd">5 fields</div></div></button>
        <button class="tbtn" id="tb-critical"     onclick="selTmpl('critical')"><span class="tic2">🚨</span><div><div class="tnm">Critical Event Note</div><div class="tfd">5 fields</div></div></button>
        <button class="tbtn" id="tb-iv"           onclick="selTmpl('iv')"><span class="tic2">💉</span><div><div class="tnm">IV / Line Note</div><div class="tfd">5 fields</div></div></button>
        <button class="tbtn" id="tb-pain"         onclick="selTmpl('pain')"><span class="tic2">😖</span><div><div class="tnm">Pain Assessment</div><div class="tfd">4 fields</div></div></button>
        <div class="sdiv"></div>
        <div class="lbl" style="margin-bottom:10px;padding:0 2px;">SHIFT SUMMARY</div>
        <button class="btn" style="background:linear-gradient(135deg,var(--purple),#7b5adf);margin-bottom:8px;" onclick="genSBAR()"><span id="sbt">✦ Generate SBAR</span></button>
        <div style="font-size:10px;color:var(--muted);line-height:1.55;padding:0 2px;">AI synthesizes vitals, assessments, alerts &amp; orders into a structured SBAR note.</div>
      </div>
      <div id="tcnt">
        <div id="sbar-out" style="display:none;">
          <div class="card">
            <div class="ch"><span class="ci">✦</span><span class="ct" style="color:var(--purple);">AI-GENERATED SBAR SUMMARY</span><button class="btn bsm bgh" onclick="cpySBAR()">📋 Copy</button><button class="btn bsm bgh" style="margin-left:4px;" onclick="genSBAR()">↻ Regen</button></div>
            <div class="cb"><div class="aout" id="sbar-txt"></div></div>
          </div>
        </div>
        <div id="tmpl-wrap" style="display:none;">
          <div class="card">
            <div class="ch"><span class="ci" id="t-icon"></span><span class="ct" id="t-title" style="color:var(--teal);"></span><button class="btn bsm bgh" onclick="cpyNote()">📋 Copy Note</button><button class="btn bsm bgh" style="margin-left:4px;" onclick="genNote()">↻ Regen</button></div>
            <div class="cb">
              <div id="t-fields" style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px;"></div>
              <button class="btn" id="gnbtn" style="background:linear-gradient(135deg,var(--teal),var(--teal2));width:100%;" onclick="genNote()"><span id="gnbtxt">✦ Generate Note</span></button>
              <div id="note-out" style="display:none;margin-top:12px;"><div class="aout" id="note-txt"></div></div>
            </div>
          </div>
        </div>
        <div id="tmpl-empty" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 20px;text-align:center;">
          <div style="font-size:52px;margin-bottom:16px;opacity:.1;">✦</div>
          <div style="font-family:'Playfair Display',serif;font-size:24px;font-weight:700;color:var(--bright);margin-bottom:10px;">AI Documentation Assistant</div>
          <div style="font-size:13px;color:var(--muted);line-height:1.75;max-width:400px;">Select a template on the left, or click <strong style="color:var(--purple);">Generate SBAR</strong> for a complete shift summary.</div>
        </div>
      </div>
    </div>

  </div>
</div>
</div>

<!-- MODAL -->
<div id="moverlay" onclick="closeM(event)">
  <div id="modal">
    <div class="mtit">Alert Provider</div>
    <div class="msub">NOTIFY DR. RIVERA IMMEDIATELY</div>
    <div class="lbl">ALERT TYPE</div>
    <div class="qagrid" id="mgrid"></div>
    <div class="lbl">PRIORITY</div>
    <div class="prirow">
      <button class="prib" id="p-CRITICAL" onclick="selP('CRITICAL')" style="border-color:rgba(255,92,108,.5);background:rgba(255,92,108,.09);color:var(--red);">CRITICAL</button>
      <button class="prib" id="p-URGENT"   onclick="selP('URGENT')">URGENT</button>
      <button class="prib" id="p-ROUTINE"  onclick="selP('ROUTINE')">ROUTINE</button>
    </div>
    <div class="lbl">MESSAGE TO PROVIDER</div>
    <textarea class="inp" id="mmsg" rows="4" placeholder="Describe the clinical finding, values, or concern…" style="margin-bottom:16px;"></textarea>
    <div class="mact">
      <button class="btn" style="flex:1;background:linear-gradient(135deg,var(--red),#e04050);" onclick="fireA()">🔔 Send Alert to Dr. Rivera</button>
      <button class="btn bgh" onclick="document.getElementById('moverlay').classList.remove('show')">Cancel</button>
    </div>
  </div>
</div>`;

let VR=[
  {t:"08:30",hr:"108",sbp:"88",dbp:"60",rr:"20",spo2:"94",temp:"98.6",pain:"7",gcs:"15",gluc:"",uop:""},
  {t:"09:00",hr:"102",sbp:"92",dbp:"64",rr:"18",spo2:"96",temp:"98.8",pain:"6",gcs:"15",gluc:"142",uop:"30"},
  {t:"09:30",hr:"96", sbp:"98",dbp:"66",rr:"17",spo2:"97",temp:"98.7",pain:"5",gcs:"15",gluc:"",uop:"35"},
];
let IO=[
  {t:"08:30",ty:"NS Bolus",ro:"IV",am:500,dr:"IN", no:"500mL over 30 min"},
  {t:"09:00",ty:"Urine",   ro:"Foley",am:80,dr:"OUT",no:"Clear yellow"},
  {t:"09:15",ty:"Zofran 4mg",ro:"IV Push",am:50,dr:"IN",no:"For nausea"},
];
const AT={
  neuro:  ["Alert and oriented x4","Pupils equal, round, reactive","No focal neuro deficits","GCS 15","Follows commands","Speech clear"],
  resp:   ["Breath sounds clear bilaterally","No respiratory distress","Maintaining SpO₂ ≥95%","No wheezing or crackles","No cyanosis"],
  cardio: ["Regular rate and rhythm","No peripheral edema","Pulses 2+ all extremities","Cap refill <2 sec","No JVD"],
  gi:     ["Abdomen soft, non-tender","Bowel sounds x4 quadrants","No nausea/vomiting","Tolerating PO","No distension"],
  gu:     ["Voiding without difficulty","Urine clear, yellow","Foley intact and draining","No hematuria","Adequate UOP"],
  skin:   ["Skin warm, dry, intact","No pressure injuries","IV site clean, no infiltration","Wound dressing clean, dry, intact"],
  pain:   ["Pain assessed (numeric scale)","Adequately controlled","Non-pharmacologic offered","Reassessment completed"],
  safety: ["Call light within reach","Bed lowest, brakes locked","Side rails up x2","Fall precautions taught","ID band verified"],
};
const SL={neuro:"Neuro",resp:"Respiratory",cardio:"Cardiovascular",gi:"GI/Abdomen",gu:"GU/Renal",skin:"Skin/Wound",pain:"Pain",safety:"Safety"};
const QA=[
  {id:"lc",icon:"🧪",lbl:"Critical Lab",   color:"var(--red)",   p:"CRITICAL"},
  {id:"vs",icon:"❤️", lbl:"Vital Change",   color:"var(--red)",   p:"CRITICAL"},
  {id:"rs",icon:"💨", lbl:"Resp Change",    color:"var(--red)",   p:"CRITICAL"},
  {id:"nc",icon:"🧠", lbl:"Neuro Change",   color:"var(--red)",   p:"CRITICAL"},
  {id:"bl",icon:"🩸", lbl:"Bleeding",       color:"var(--red)",   p:"URGENT"},
  {id:"pn",icon:"😖", lbl:"Uncontrolled Pain",color:"var(--amber)",p:"URGENT"},
  {id:"fa",icon:"⚠️", lbl:"Fall / Safety",  color:"var(--amber)", p:"URGENT"},
  {id:"mq",icon:"💊", lbl:"Med Question",   color:"var(--blue)",  p:"ROUTINE"},
  {id:"iv",icon:"💉", lbl:"IV / Line Issue",color:"var(--dim)",   p:"ROUTINE"},
  {id:"ot",icon:"📋", lbl:"Other / General",color:"var(--dim)",   p:"ROUTINE"},
];
const PS={CRITICAL:{c:"var(--red)",bg:"rgba(255,92,108,.12)",br:"rgba(255,92,108,.35)"},URGENT:{c:"var(--amber)",bg:"rgba(245,166,35,.11)",br:"rgba(245,166,35,.3)"},ROUTINE:{c:"var(--blue)",bg:"rgba(74,144,217,.1)",br:"rgba(74,144,217,.28)"}};
const TMPL={
  shift:{icon:"🔄",name:"Shift Assessment",fields:["Current clinical status","Vital sign trends","Systems assessment summary","Abnormal findings","Medications administered this shift","Pending items / follow-up needed"]},
  admission:{icon:"🏥",name:"Admission Assessment",fields:["Chief complaint and HPI","Allergies and home medications","Past medical / surgical history","Social history","Review of systems","Physical examination findings","Plan as communicated by provider"]},
  discharge:{icon:"🏠",name:"Discharge Teaching",fields:["Discharge diagnosis","Medications sent home (list all)","Follow-up appointment instructions","Return precautions explained","Patient verbalized understanding","Mode of transport and who accompanied patient"]},
  postproc:{icon:"⚕️",name:"Post-Procedure Note",fields:["Procedure performed and time","Time-out completed","Patient tolerance during procedure","Vital signs post-procedure","Complications or concerns","Patient education provided"]},
  critical:{icon:"🚨",name:"Critical Event Note",fields:["Event description and time","Interventions performed","Team response (who notified)","Patient status and outcome","Family notification","Follow-up plan"]},
  iv:{icon:"💉",name:"IV / Line Note",fields:["IV site location and gauge","Number of attempts","Securement and dressing applied","Patient tolerance","Fluid / medication connected","Flush verification and patency"]},
  pain:{icon:"😖",name:"Pain Assessment",fields:["Pain location, quality, severity (0–10)","Onset, duration, radiation","Aggravating and relieving factors","Non-pharmacologic interventions","Pharmacologic interventions given","Reassessment score and time"]},
};

let chats=[
  {id:1,r:"md",s:"Dr. Rivera",t:"08:45",tx:"Troponin back at 0.22. Hold aspirin given allergy. Start heparin weight-based protocol.",urg:true},
  {id:2,r:"rn",s:"Nurse Kim",t:"08:48",tx:"Starting heparin now. She's in moderate pain and requesting something for nausea."},
  {id:3,r:"md",s:"Dr. Rivera",t:"08:52",tx:"Zofran 4mg IV PRN ordered. EKG shows NSR with non-specific ST changes — no STEMI pattern."},
];
let alerts=[
  {id:1,ic:"🧪",lb:"Critical Lab",p:"CRITICAL",t:"09:15",tx:"Troponin I: 0.22 ng/mL — CRITICAL HIGH. Verbal report to Dr. Rivera at 09:16.",ack:true,ab:"Dr. Rivera",at:"09:18"},
  {id:2,ic:"❤️",lb:"Vital Change",p:"CRITICAL",t:"08:30",tx:"BP 88/60 on admission, HR 108. Patient diaphoretic. Dr. Rivera notified.",ack:true,ab:"Dr. Rivera",at:"08:35"},
];
let orders=[
  {id:1,t:"08:52",ty:"Medication",p:"ROUTINE",tx:"Ondansetron (Zofran) 4mg IV Q6H PRN nausea",st:"pending",pv:"Dr. Rivera"},
  {id:2,t:"08:48",ty:"Medication",p:"URGENT", tx:"Heparin weight-based protocol — initiate per ED order set (72 kg)",st:"pending",pv:"Dr. Rivera"},
  {id:3,t:"08:40",ty:"Lab",       p:"ROUTINE",tx:"Troponin I serial — repeat at 3 hours (due 11:14)",st:"pending",pv:"Dr. Rivera"},
  {id:4,t:"08:38",ty:"Imaging",   p:"URGENT", tx:"Portable CXR — r/o pulmonary edema",st:"completed",pv:"Dr. Rivera",no:"Completed 08:55"},
  {id:5,t:"08:36",ty:"Nursing",   p:"ROUTINE",tx:"Continuous cardiac monitoring · 12-lead EKG · O₂ titrate per SpO₂",st:"completed",pv:"Dr. Rivera"},
];
let labs=[],meds=[],findings=[],staged=[],atype=null,apri="CRITICAL",asys="neuro",atmpl=null,anotes={};

function nw(){return new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:false})}

window.addEventListener("DOMContentLoaded",()=>{
  setInterval(()=>document.getElementById("clk").textContent=nw(),10000);
  document.getElementById("clk").textContent=nw();
  document.getElementById("atm").value=nw();
  document.getElementById("lt").value=nw();
  document.getElementById("mt").value=nw();
  document.getElementById("ft").value=nw();
  document.getElementById("ni-t").value=nw();
  document.getElementById("nv-t").value=nw();
  rV();rIO();initA();rChat();rAlerts();rOrders();rQA();
});

function vf(d,v){if(!v||isNaN(+v))return null;const n=+v;if(d.clo!=null&&n<=d.clo)return"CRIT";if(d.chi!=null&&n>=d.chi)return"CRIT";if(d.lo!=null&&n<d.lo)return"LOW";if(d.hi!=null&&n>d.hi)return"HIGH";return"WNL";}
const FC={CRIT:{c:"var(--red)",bg:"rgba(255,92,108,.14)",cl:"fc"},LOW:{c:"var(--amber)",bg:"rgba(245,166,35,.12)",cl:"fh"},HIGH:{c:"var(--amber)",bg:"rgba(245,166,35,.12)",cl:"fh"},WNL:{c:"var(--green)",bg:"transparent",cl:"fw"}};

function rV(){
  const tb=document.getElementById("vbody");tb.innerHTML="";let cr=0;
  VR.forEach((row,ri)=>{
    const tr=document.createElement("tr");tr.style.background=ri%2===0?"var(--panel)":"rgba(11,29,53,.5)";
    let h=\`<td style="padding-left:14px;">\${row.t}</td>\`;
    VIDS.forEach((id,i)=>{
      const d=VD[i],val=row[id],fl=val?vf(d,val):null,fc=fl?FC[fl]:null;
      const bg=fc&&fl!=="WNL"?fc.bg:"transparent",an=fl==="CRIT"?"animation:pulse 1.5s infinite;":"";
      if(fl==="CRIT")cr++;
      h+=\\\`<td style="background:\\\${bg};\\\${an}"><div class="vv" style="color:\\\${fc?.c||"var(--text)"};">\\\${val||"—"}</div>\\\${fc&&fl!=="WNL"?\\\`<div class="vf \\\${fc.cl}">\\\${fl==="CRIT"?"⚡ CRIT":fl}</div>\\\`:""}</td>\\\`;
    });
    tr.innerHTML=h;tb.appendChild(tr);
  });
  updSB();
  const cp=document.getElementById("crit-pill");if(cr>0){cp.textContent=\\\`\\\${cr} CRIT\\\`;cp.style.display="inline-flex";}else cp.style.display="none";
}

function addV(){
  const r={t:document.getElementById("nv-t").value||nw()};
  VIDS.forEach(id=>r[id]=document.getElementById(\\\`nv-\\\${id==="spo2"?"sp":id==="temp"?"tp":id==="pain"?"pn":id==="gcs"?"gc":id==="gluc"?"gl":id==="uop"?"up":id}\\\`).value.trim());
  VR.push(r);rV();clrV();autoAV(r);
}

function clrV(){VIDS.forEach(id=>document.getElementById(\\\`nv-\\\${id==="spo2"?"sp":id==="temp"?"tp":id==="pain"?"pn":id==="gcs"?"gc":id==="gluc"?"gl":id==="uop"?"up":id}\\\`).value="");document.getElementById("nv-t").value=nw();}

function updSB(){
  if(!VR.length)return;const r=VR[VR.length-1];
  function sv(vid,fid,val,def){
    const e=document.getElementById(vid),f=document.getElementById(fid);
    e.textContent=val||"—";const fl=vf(def,val),fc=fl?FC[fl]:null;e.style.color=fc?.c||"var(--text)";
    if(fc&&fl!=="WNL"){f.textContent=fl==="CRIT"?"⚡ CRIT":fl;f.className="sf "+fc.cl;f.style.display="inline-flex";}else f.style.display="none";
  }
  sv("s-hr","s-hrf",r.hr,VD[0]);sv("s-bp","s-bpf",r.sbp?\\\`\\\${r.sbp}/\\\${r.dbp}\\\`:"",VD[1],r.sbp);
  sv("s-sp","s-spf",r.spo2,VD[4]);sv("s-tp","s-tpf",r.temp,VD[5]);
  const pe=document.getElementById("s-pn");pe.textContent=r.pain||"—";pe.style.color=r.pain>=8?"var(--red)":r.pain>=5?"var(--amber)":"var(--text)";
}

function autoAV(r){
  const c=[];
  if(+r.sbp<90)c.push(\\\`BP \\\${r.sbp}/\\\${r.dbp}mmHg — hypotensive\\\`);
  if(+r.spo2<92)c.push(\\\`SpO₂ \\\${r.spo2}% — critical hypoxia\\\`);
  if(+r.hr>130)c.push(\\\`HR \\\${r.hr}bpm — tachycardia\\\`);
  if(c.length)mkAlert("vs","❤️","Vital Sign Change","CRITICAL",\\\`Auto-detected at \\\${r.t}: \\\${c.join("; ")}\\\`);
}

function rIO(){
  const tb=document.getElementById("iobody");tb.innerHTML="";let ti=0,to2=0;
  IO.forEach((row,i)=>{
    if(row.dr==="IN")ti+=+row.am;else to2+=+row.am;
    const tr=document.createElement("tr");tr.style.borderBottom="1px solid var(--edge)";
    tr.innerHTML=\\\`<td style="padding:7px 10px;font-family:'JetBrains Mono',monospace;font-weight:700;">\\\${row.t}</td><td style="padding:7px 8px;color:var(--bright);font-weight:600;">\\\${row.ty}</td><td style="padding:7px 8px;color:var(--dim);">\\\${row.ro}</td><td style="text-align:center;font-family:'JetBrains Mono',monospace;font-weight:700;">\\\${row.am} mL</td><td style="text-align:center;"><span class="pill" style="background:\\\${row.dr==="IN"?"rgba(74,144,217,.12)":"rgba(244,114,182,.12)"};color:\\\${row.dr==="IN"?"var(--blue)":"var(--rose)"};border:1px solid \\\${row.dr==="IN"?"rgba(74,144,217,.3)":"rgba(244,114,182,.3)"};">\\\${row.dr}</span></td><td style="padding:7px 8px;color:var(--dim);font-size:11px;">\\\${row.no||""}</td>\\\`;
    tb.appendChild(tr);
  });
  document.getElementById("ti").textContent=ti;document.getElementById("to").textContent=to2;
  const b=ti-to2;document.getElementById("bal").textContent=(b>=0?"+":"")+b;
  document.getElementById("balpill").textContent=\\\`Balance: \\\${b>=0?"+":""}\\\${b} mL\\\`;
  document.getElementById("s-io").textContent=\\\`\\\${ti}/\\\${to2}\\\`;
  const bb=document.getElementById("balbox");bb.style.background=b<0?"rgba(255,92,108,.07)":"rgba(46,204,113,.07)";bb.style.borderColor=b<0?"rgba(255,92,108,.25)":"rgba(46,204,113,.25)";document.getElementById("bal").style.color=b<0?"var(--red)":"var(--green)";
}

function addIO(){
  const ty=document.getElementById("ni-ty").value.trim(),am=document.getElementById("ni-am").value.trim();
  if(!ty||!am)return;
  IO.push({t:document.getElementById("ni-t").value||nw(),ty,ro:document.getElementById("ni-ro").value,am:+am,dr:document.getElementById("ni-dr").value,no:document.getElementById("ni-no").value});
  rIO();["ty","ro","am","no"].forEach(id=>document.getElementById(\\\`ni-\\\${id}\\\`).value="");document.getElementById("ni-t").value=nw();
}

function initA(){
  const st=document.getElementById("stabs");
  Object.entries(SL).forEach(([k,v])=>{
    const b=document.createElement("button");b.className="stab"+(k===asys?" on":"");b.dataset.s=k;b.textContent=v;b.onclick=()=>sws(k);st.appendChild(b);
  });
  rChips();
}

function sws(s){
  anotes[asys]=document.getElementById("anotes").value;asys=s;
  document.querySelectorAll(".stab").forEach(b=>b.classList.toggle("on",b.dataset.s===s));
  rChips();document.getElementById("anotes").value=anotes[s]||"";
  document.querySelectorAll(".stab").forEach(b=>{const c=(AT[b.dataset.s]||[]).filter(x=>(window.ASS||{})[b.dataset.s]?.includes(x)).length;b.textContent=c>0?\\\`\\\${SL[b.dataset.s]} (\\\${c})\\\`:SL[b.dataset.s];b.classList.toggle("on",b.dataset.s===asys);});
}

window.ASS={neuro:[],resp:[],cardio:[],gi:[],gu:[],skin:[],pain:[],safety:[]};

function rChips(){
  const c=document.getElementById("cgrid");c.innerHTML="";
  (AT[asys]||[]).forEach(item=>{
    const chk=(window.ASS[asys]||[]).includes(item);
    const ch=document.createElement("div");ch.className="chip"+(chk?" on":"");
    ch.innerHTML=\\\`<div class="cbox">\\\${chk?'<span style="font-size:9px;color:var(--navy);font-weight:700;">✓</span>':""}</div><span>\\\${item}</span>\\\`;
    ch.onclick=()=>{if(!window.ASS[asys])window.ASS[asys]=[];const i=window.ASS[asys].indexOf(item);if(i>=0)window.ASS[asys].splice(i,1);else window.ASS[asys].push(item);rChips();sws(asys);};
    c.appendChild(ch);
  });
  const tot=Object.values(window.ASS).flat().length;document.getElementById("acpill").textContent=\\\`\\\${tot} items\\\`;
}

function rChat(){
  const w=document.getElementById("cmsg");w.innerHTML="";chats.forEach(m=>w.appendChild(mkBub(m)));scChat();
}

function mkBub(m){
  const me=m.r==="rn",row=document.createElement("div");row.className="mr"+(me?" me":"");
  const avc=m.r==="md"?"md":m.r==="sys"?"sys":"rn",avl=m.r==="md"?"MD":m.r==="sys"?"✦":"RN";
  const bub=m.r==="md"?"md":"rn";
  let alHead="";if(m.ap){const ps=PS[m.ap];alHead=\\\`<div style="font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;color:\\\${ps.c};margin-bottom:5px;">⚡ ALERT — \\\${m.ap}</div>\\\`;}
  let files="";if(m.files?.length){files=\\\`<div class="fprev">\\\${m.files.map(f=>\\\`<div class="fchip"><span style="font-size:16px;">\\\${f.type?.includes("image")?"🖼️":"📄"}</span><div><div class="fn">\\\${f.name}</div><div class="fs">\\\${f.sz}</div></div></div>\\\`).join("")}</div>\\\`;}
  const bs=m.ap?\\\`background:\\\${PS[m.ap].bg};border:1px solid \\\${PS[m.ap].br};border-radius:12px;\\\`:"";
  row.innerHTML=\\\`<div class="av \\\${avc}">\\\${avl}</div><div class="bwrap"><div class="bmeta">\\\${m.s} · \\\${m.t}</div><div class="bub \\\${bub}" style="\\\${bs}">\\\${m.urg?'<div class="burg">URGENT ORDER</div>':""}\ \\\${alHead}<div class="btxt">\\\${m.tx||""}</div>\\\${files}</div></div>\\\`;
  return row;
}

function scChat(){const w=document.getElementById("cmsg");w.scrollTop=w.scrollHeight;}

function stgF(input){staged=[...staged,...Array.from(input.files||[])];rStg();input.value="";}
function rStg(){const s=document.getElementById("fstg");if(!staged.length){s.style.display="none";return;}s.style.display="flex";s.innerHTML=staged.map((f,i)=>\\\`<div class="sff"><span style="font-size:14px;">\\\${f.type?.includes("image")?"🖼️":"📄"}</span><span style="font-size:11px;color:var(--bright);">\\\${f.name}</span><span style="font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--dim);">\\\${(f.size/1024).toFixed(0)}KB</span><button class="srm" onclick="staged.splice(\\\${i},1);rStg()">✕</button></div>\\\`).join("");}
document.getElementById("cta").addEventListener("input",function(){document.getElementById("csnd").disabled=!this.value.trim()&&!staged.length;});
function gta(el){el.style.height="auto";el.style.height=Math.min(el.scrollHeight,100)+"px";}
function ckd(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sndC();}}
function sndC(){const ta=document.getElementById("cta"),tx=ta.value.trim();if(!tx&&!staged.length)return;const m={id:Date.now(),r:"rn",s:"Nurse Kim",t:nw(),tx,files:staged.map(f=>({name:f.name,sz:\\\`\\\${(f.size/1024).toFixed(0)}KB\\\`,type:f.type}))};chats.push(m);document.getElementById("cmsg").appendChild(mkBub(m));scChat();ta.value="";ta.style.height="auto";staged=[];rStg();document.getElementById("csnd").disabled=true;}

function rQA(){const g=document.getElementById("qgrid");g.innerHTML="";QA.forEach(qa=>{const c=document.createElement("div");c.className="qcard";c.innerHTML=\\\`<div class="qi">\\\${qa.icon}</div><div class="ql">\\\${qa.lbl}</div><span class="pill" style="background:\\\${PS[qa.p].bg};color:\\\${PS[qa.p].c};border:1px solid \\\${PS[qa.p].br};font-size:7px;">\\\${qa.p}</span>\\\`;c.addEventListener("mouseenter",()=>{c.style.borderColor=qa.color;c.style.background=\\\`\\\${qa.color}12\\\`.replace("var(--","").replace(")","");});c.addEventListener("mouseleave",()=>{c.style.borderColor="var(--border)";c.style.background="var(--panel)";});c.onclick=()=>{atype=qa.id;apri=qa.p;openModal();};g.appendChild(c);});}

function mkAlert(id,icon,lbl,pri,txt){
  alerts.unshift({id:Date.now(),ic:icon,lb:lbl,p:pri,t:nw(),tx:txt,ack:false});
  chats.push({id:Date.now()+1,r:"rn",s:"Nurse Kim",t:nw(),tx:\\\`\\\${icon} \\\${lbl}: \\\${txt}\\\`,ap:pri});
  rAlerts();rChat();
}

function rAlerts(){
  const un=alerts.filter(a=>!a.ack).length;
  const ba=document.getElementById("ba"),up=document.getElementById("upill"),uc=document.getElementById("ucnt");
  ba.textContent=un;ba.style.display=un>0?"flex":"none";up.style.display=un>0?"flex":"none";uc.textContent=un;
  document.getElementById("alc").textContent=\\\`\\\${alerts.length} alert\\\${alerts.length!==1?"s":""}\\\`;
  const log=document.getElementById("alog");if(!alerts.length){log.innerHTML='<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px;">No alerts yet.</div>';return;}
  log.innerHTML="";alerts.forEach(a=>{
    const ps=PS[a.p];const div=document.createElement("div");div.className="arow";div.style.background=a.ack?"transparent":ps.bg;div.style.border=\\\`1px solid \\\${a.ack?"var(--border)":ps.br}\\\`;
    div.innerHTML=\\\`<div class="aicn">\\\${a.ic}</div><div class="abdy"><div class="amet"><span class="pill" style="background:\\\${ps.bg};color:\\\${ps.c};border:1px solid \\\${ps.br};">\\\${a.p}</span><span style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:var(--text);">\\\${a.lb}</span><span style="font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--dim);margin-left:auto;">\\\${a.t}</span></div><div class="atxt">\\\${a.tx}</div>\\\${a.ack?\\\`<div class="aack">✓ Acknowledged by \\\${a.ab} at \\\${a.at}</div>\\\`:""}</div>\\\${!a.ack?\\\`<button class="btn bsm bgh" style="flex-shrink:0;border-color:rgba(46,204,113,.35);color:var(--green);" onclick="ackA(\\\${a.id})">✓ Ack'd</button>\\\`:""}\\\`;
    log.appendChild(div);
  });
}

function ackA(id){const a=alerts.find(x=>x.id===id);if(a){a.ack=true;a.ab="Dr. Rivera";a.at=nw();}rAlerts();}

function openModal(){bldMGrid();document.getElementById("moverlay").classList.add("show");document.getElementById("mmsg").focus();}
function closeM(e){if(e.target===document.getElementById("moverlay"))document.getElementById("moverlay").classList.remove("show");}

function bldMGrid(){
  const g=document.getElementById("mgrid");g.innerHTML="";
  QA.forEach(qa=>{const b=document.createElement("button");b.className="qaopt"+(atype===qa.id?" sel":"");b.dataset.id=qa.id;b.innerHTML=\\\`<span style="font-size:18px;">\\\${qa.icon}</span><div><span class="qanm">\\\${qa.lbl}</span><span class="pill" style="background:\\\${PS[qa.p].bg};color:\\\${PS[qa.p].c};border:1px solid \\\${PS[qa.p].br};font-size:7px;margin-top:3px;">\\\${qa.p}</span></div>\\\`;b.onclick=()=>{atype=qa.id;apri=qa.p;document.querySelectorAll(".qaopt").forEach(x=>x.classList.toggle("sel",x.dataset.id===qa.id));selP(qa.p);};g.appendChild(b);});
  selP(apri||"CRITICAL");
}

function selP(p){
  apri=p;const ps=PS[p];
  ["CRITICAL","URGENT","ROUTINE"].forEach(k=>{const b=document.getElementById(\\\`p-\\\${k}\\\`);if(k===p){b.style.background=PS[p].bg;b.style.borderColor=PS[p].c;b.style.color=PS[p].c;}else{b.style.background="transparent";b.style.borderColor="var(--border)";b.style.color="var(--muted)";}});
}

function fireA(){
  const tx=document.getElementById("mmsg").value.trim();const qa=QA.find(q=>q.id===atype)||QA[QA.length-1];
  if(!tx){document.getElementById("mmsg").focus();return;}
  mkAlert(qa.id,qa.icon,qa.lbl,apri,tx);
  document.getElementById("moverlay").classList.remove("show");document.getElementById("mmsg").value="";atype=null;sw("alerts");
}

function rOrders(){
  const list=document.getElementById("olist"),pend=orders.filter(o=>o.st==="pending").length;
  const pb=document.getElementById("pbanner");pb.textContent=\\\`\\\${pend} ORDER\\\${pend!==1?"S":""} PENDING ACTION\\\`;pb.style.display=pend>0?"flex":"none";
  const bo=document.getElementById("bo");bo.textContent=pend;bo.style.display=pend>0?"flex":"none";
  list.innerHTML="";orders.forEach(o=>{
    const done=o.st==="completed"||o.st==="acknowledged",ps=PS[o.p];
    const div=document.createElement("div");div.className="ocard";div.style.borderColor=done?"var(--border)":ps.br;
    div.innerHTML=\\\`<div class="osta" style="background:\\\${done?"rgba(46,204,113,.12)":ps.bg};border:1.5px solid \\\${done?"rgba(46,204,113,.3)":ps.br};">\\\${done?"✓":"!"}</div><div class="obdy"><div class="omet"><span class="pill" style="background:\\\${done?"rgba(46,204,113,.1)":ps.bg};color:\\\${done?"var(--green)":ps.c};border:1px solid \\\${done?"rgba(46,204,113,.3)":ps.br};">\\\${done?"DONE":o.p}</span><span class="pill" style="background:rgba(74,144,217,.1);color:var(--blue);border:1px solid rgba(74,144,217,.28);font-size:7px;">\\\${o.ty.toUpperCase()}</span><span style="font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--dim);">Ordered \\\${o.t} · \\\${o.pv}</span></div><div class="otxt">\\\${o.tx}</div>\\\${o.no?\\\`<div class="onot">\\\${o.no}</div>\\\`:""}\\\${o.ab?\\\`<div class="oack">✓ Acknowledged by \\\${o.ab} at \\\${o.at}</div>\\\`:""}</div>\\\${!done?\\\`<div class="oact"><button class="btn bsm" style="background:linear-gradient(135deg,var(--green),#27ae60);" onclick="ackO(\\\${o.id})">✓ Acknowledge</button><button class="btn bsm bgh" onclick="msgO('\\\${o.tx.substring(0,55)}')">💬 Ask MD</button></div>\\\`:""}\\\`;
    list.appendChild(div);
  });
}

function ackO(id){const o=orders.find(x=>x.id===id);if(!o)return;o.st="acknowledged";o.ab="Nurse Kim";o.at=nw();chats.push({id:Date.now(),r:"rn",s:"Nurse Kim",t:nw(),tx:\\\`✓ Order acknowledged: \\\${o.tx}\\\`});rOrders();rChat();}
function msgO(tx){document.getElementById("cta").value=\\\`Re order: "\\\${tx}" — \\\`;sw("chat");document.getElementById("cta").focus();}

function addLab(){
  const n=document.getElementById("ln").value.trim(),v=document.getElementById("lv").value.trim();if(!n||!v)return;
  const fl=document.getElementById("lf").value;
  labs.unshift({t:document.getElementById("lt").value||nw(),n,v,u:document.getElementById("lu").value,r:document.getElementById("lr").value,fl});
  rLabs();if(fl==="CRIT"||fl==="PANIC"){mkAlert("lc","🧪","Critical Lab","CRITICAL",\\\`\\\${n}: \\\${v} \\\${document.getElementById("lu").value} — \\\${fl}. Ref: \\\${document.getElementById("lr").value||"—"}.\\\`);sw("alerts");}
  ["ln","lv","lu","lr"].forEach(id=>document.getElementById(id).value="");document.getElementById("lf").value="WNL";document.getElementById("lt").value=nw();
}

function rLabs(){
  document.getElementById("llist").innerHTML=labs.map(l=>{
    const fs={WNL:{c:"var(--green)",bg:"rgba(46,204,113,.08)"},LOW:{c:"var(--amber)",bg:"rgba(245,166,35,.1)"},HIGH:{c:"var(--amber)",bg:"rgba(245,166,35,.1)"},CRIT:{c:"var(--red)",bg:"rgba(255,92,108,.12)"},PANIC:{c:"var(--red)",bg:"rgba(255,92,108,.18)"}}[l.fl]||{c:"var(--dim)",bg:"transparent"};
    return\\\`<div style="display:flex;align-items:center;gap:12px;padding:9px 12px;border-radius:9px;background:\\\${fs.bg};border:1px solid \\\${fs.c}30;"><span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--dim);">\\\${l.t}</span><span style="font-weight:700;color:var(--bright);font-size:13px;flex:1;">\\\${l.n}</span><span style="font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700;color:\\\${fs.c};">\\\${l.v} \\\${l.u}</span><span style="font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--muted);">Ref: \\\${l.r||"—"}</span><span class="pill" style="background:\\\${fs.bg};color:\\\${fs.c};border:1px solid \\\${fs.c}40;">\\\${l.fl}</span></div>\\\`;
  }).join("");
}

function addMed(){const n=document.getElementById("mn").value.trim();if(!n)return;meds.unshift({t:document.getElementById("mt").value||nw(),n,d:document.getElementById("md2").value,r:document.getElementById("mr2").value,no:document.getElementById("mno").value});rMeds();["mn","md2","mno"].forEach(id=>document.getElementById(id).value="");document.getElementById("mt").value=nw();}
function rMeds(){document.getElementById("mlist").innerHTML=meds.map(m=>\\\`<div style="display:flex;align-items:center;gap:12px;padding:9px 12px;border-radius:9px;background:rgba(155,109,255,.06);border:1px solid rgba(155,109,255,.2);"><span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--dim);">\\\${m.t}</span><span style="font-weight:700;color:var(--bright);font-size:13px;flex:1;">\\\${m.n}\\\${m.d?\\\` — \\\${m.d}\\\`:""}</span><span class="pill" style="background:rgba(155,109,255,.1);color:var(--purple);border:1px solid rgba(155,109,255,.3);">\\\${m.r}</span>\\\${m.no?\\\`<span style="font-size:11px;color:var(--dim);">\\\${m.no}</span>\\\`:""}</div>\\\`).join("");}

function addFinding(){const tx=document.getElementById("fx").value.trim();if(!tx)return;const al=document.getElementById("fa").value;findings.unshift({t:document.getElementById("ft").value||nw(),tx,al});rFindings();if(al!=="no"){const p=al==="urgent"?"URGENT":"ROUTINE";mkAlert("ot","📌","Nurse Finding",p,tx);if(al==="urgent")sw("alerts");}document.getElementById("fx").value="";document.getElementById("fa").value="no";document.getElementById("ft").value=nw();}
function rFindings(){document.getElementById("flist").innerHTML=findings.map(f=>\\\`<div style="display:flex;align-items:center;gap:12px;padding:9px 12px;border-radius:9px;background:\\\${f.al!=="no"?"rgba(245,166,35,.08)":"var(--panel)"};border:1px solid \\\${f.al!=="no"?"rgba(245,166,35,.28)":"var(--border)"};"><span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--dim);">\\\${f.t}</span><span style="font-size:13px;color:var(--text);flex:1;">\\\${f.tx}</span>\\\${f.al!=="no"?'<span class="pill" style="background:rgba(245,166,35,.12);color:var(--amber);border:1px solid rgba(245,166,35,.3);">MD ALERTED</span>':""}</div>\\\`).join("");}

function sw(t){
  document.querySelectorAll(".tb").forEach(b=>b.classList.toggle("on",b.dataset.t===t));
  document.querySelectorAll(".pane").forEach(p=>p.classList.toggle("on",p.id===\\\`pane-\\\${t}\\\`));
  document.querySelectorAll(".cpane").forEach(p=>p.classList.toggle("on",p.id===\\\`pane-\\\${t}\\\`));
  document.getElementById("spane").classList.toggle("on",t==="sum");
  if(t==="chat")setTimeout(scChat,80);
}

function bldCtx(){
  const r=VR[VR.length-1]||{};
  const ti=IO.filter(x=>x.dr==="IN").reduce((s,x)=>s+(+x.am||0),0);
  const to=IO.filter(x=>x.dr==="OUT").reduce((s,x)=>s+(+x.am||0),0);
  const ass=Object.entries(window.ASS).filter(([,v])=>v.length>0).map(([k,v])=>\\\`\\\${SL[k]}: \\\${v.join("; ")}\\\`).join("\\\\n")||"Not yet documented";
  return\\\`PATIENT: Margaret T. Sullivan, 67y F, Room TR-1\\\\nDX: Chest pain, r/o NSTEMI\\\\nALLERGIES: PCN, ASA\\\\nPROVIDER: Dr. Rivera\\\\nCODE: Full Code\\\\n\\\\nLATEST VITALS: HR \\\${r.hr||"—"}, BP \\\${r.sbp||"—"}/\\\${r.dbp||"—"}, SpO₂ \\\${r.spo2||"—"}%, Temp \\\${r.temp||"—"}°F, Pain \\\${r.pain||"—"}/10, RR \\\${r.rr||"—"}\\\\nI&O: IN \\\${ti}mL / OUT \\\${to}mL / Balance \\\${ti-to>=0?"+":""}\\\${ti-to}mL\\\\n\\\\nASSESSMENT:\\\\n\\\${ass}\\\\n\\\\nALERTS: \\\${alerts.slice(0,3).map(a=>\\\`\\\${a.p}: \\\${a.tx}\\\`).join("; ")||"None"}\\\\nPENDING ORDERS: \\\${orders.filter(o=>o.st==="pending").length}\\\`;
}

async function genSBAR(){
  const btn=document.getElementById("sbt");btn.textContent="Generating…";
  document.getElementById("sbar-out").style.display="block";document.getElementById("tmpl-empty").style.display="none";
  const te=document.getElementById("sbar-txt");
  te.innerHTML=[80,65,90,55,75].map(w=>\\\`<div class="skel" style="width:\\\${w}%;"></div>\\\`).join("");
  try{
    const rsp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1200,messages:[{role:"user",content:\\\`You are a clinical documentation AI assisting an ED nurse. Generate a professional nursing SBAR shift summary.\\\\n\\\\n\\\${bldCtx()}\\\\n\\\\nWrite a clear SBAR note:\\\\n**S — Situation** (1-2 sentences)\\\\n**B — Background** (2-3 sentences)\\\\n**A — Assessment** (bullet-point system review)\\\\n**R — Recommendation** (nursing actions, pending items)\\\\n\\\\nUse standard clinical nursing language. Be specific and accurate.\\\`}]})});
    const d=await rsp.json();te.textContent=d.content?.find(b=>b.type==="text")?.text||"Generation failed.";
  }catch(e){te.textContent="Generation failed. Check connection.";}
  btn.textContent="✦ Generate SBAR";
}
function cpySBAR(){navigator.clipboard.writeText(document.getElementById("sbar-txt").textContent);}
function cpyNote(){navigator.clipboard.writeText(document.getElementById("note-txt").textContent);}

function selTmpl(id){
  atmpl=id;document.querySelectorAll(".tbtn").forEach(b=>b.classList.toggle("on",b.id===\\\`tb-\\\${id}\\\`));
  const tmpl=TMPL[id];
  document.getElementById("tmpl-empty").style.display="none";document.getElementById("tmpl-wrap").style.display="block";
  document.getElementById("t-icon").textContent=tmpl.icon;document.getElementById("t-title").textContent=tmpl.name.toUpperCase();
  const c=document.getElementById("t-fields");c.innerHTML="";
  tmpl.fields.forEach(f=>{const d=document.createElement("div");d.innerHTML=\\\`<div class="lbl">\\\${f.toUpperCase()}</div><textarea class="inp" rows="2" data-f="\\\${f}" placeholder="Enter \\\${f.toLowerCase()}…"></textarea>\\\`;c.appendChild(d);});
  document.getElementById("note-out").style.display="none";document.getElementById("gnbtxt").textContent=\\\`✦ Generate \\\${tmpl.name}\\\`;
}

async function genNote(){
  if(!atmpl)return;const tmpl=TMPL[atmpl];const fi={};document.querySelectorAll("#t-fields textarea").forEach(ta=>{if(ta.value.trim())fi[ta.dataset.f]=ta.value.trim();});
  const gb=document.getElementById("gnbtn");gb.disabled=true;document.getElementById("gnbtxt").textContent="Generating…";
  const fs=Object.entries(fi).map(([k,v])=>\\\`\\\${k}: \\\${v}\\\`).join("\\\\n")||"(No additional context)";
  try{
    const rsp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1200,messages:[{role:"user",content:\\\`You are a clinical documentation AI assisting an ED nurse. Generate a complete, professional \\\${tmpl.name} for the medical record.\\\\n\\\\n\\\${bldCtx()}\\\\n\\\\nNURSE-PROVIDED INFO:\\\\n\\\${fs}\\\\n\\\\nWrite a complete nursing \\\${tmpl.name} suitable for the medical record. Use standard clinical format. Include date/time and nurse signature line. No AI disclaimers.\\\`}]})});
    const d=await rsp.json();const tx=d.content?.find(b=>b.type==="text")?.text||"Generation failed.";
    document.getElementById("note-txt").textContent=tx;document.getElementById("note-out").style.display="block";
  }catch(e){document.getElementById("note-txt").textContent="Generation failed.";document.getElementById("note-out").style.display="block";}
  gb.disabled=false;document.getElementById("gnbtxt").textContent='✦ Generate ' + tmpl.name;
}`;