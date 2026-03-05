import React, { useEffect, useRef } from "react";

export default function SoapCompilerStandalone() {
  const initialized = useRef(false);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SOAP Note Compiler — Notrya AI</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script>
<style>
:root {
  --navy:   #050f1e;
  --slate:  #0b1d35;
  --panel:  #0d2240;
  --edge:   #162d4f;
  --border: #1e3a5f;
  --muted:  #2a4d72;
  --dim:    #4a7299;
  --text:   #c8ddf0;
  --bright: #e8f4ff;
  --teal:   #00d4bc;
  --teal2:  #00a896;
  --amber:  #f5a623;
  --red:    #ff5c6c;
  --green:  #2ecc71;
  --purple: #9b6dff;
  --blue:   #4a90d9;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  background: var(--navy);
  color: var(--text);
  font-family: 'DM Sans', sans-serif;
  min-height: 100vh;
  overflow-x: hidden;
}
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse 70% 50% at 8% 5%, rgba(0,168,150,0.07), transparent 55%),
    radial-gradient(ellipse 55% 45% at 92% 92%, rgba(155,109,255,0.05), transparent 50%);
  pointer-events: none;
  z-index: 0;
}
body::after {
  content: '';
  position: fixed;
  inset: 0;
  background-image: linear-gradient(rgba(30,58,95,0.18) 1px, transparent 1px),
    linear-gradient(90deg, rgba(30,58,95,0.18) 1px, transparent 1px);
  background-size: 44px 44px;
  pointer-events: none;
  z-index: 0;
}
.navbar {
  position: sticky;
  top: 0;
  z-index: 90;
  height: 54px;
  background: rgba(11,29,53,0.96);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 22px;
  gap: 32px;
}
.wordmark {
  font-family: 'Playfair Display', serif;
  font-size: 19px;
  font-weight: 700;
  color: var(--bright);
  text-decoration: none;
  white-space: nowrap;
  display: flex;
  flex-direction: column;
  line-height: 1;
}
.wordmark span { color: var(--teal); }
.wordmark small { font-family: 'DM Sans', sans-serif; font-size: 9px; font-weight: 400; color: var(--dim); letter-spacing: 0.04em; margin-top: 2px; }
.nav-links { display: flex; gap: 2px; flex: 1; }
.nav-link {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--dim);
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.15s;
}
.nav-link:hover { color: var(--text); background: rgba(30,58,95,0.5); }
.nav-link.active { color: var(--teal); background: rgba(0,212,188,0.08); }
.live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); animation: livePulse 2s ease-in-out infinite; }
.page-header {
  position: relative;
  z-index: 1;
  padding: 20px 28px 16px;
  border-bottom: 1px solid rgba(30,58,95,0.6);
  background: rgba(11,29,53,0.4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.page-header-left { display: flex; align-items: center; gap: 14px; }
.page-icon {
  width: 46px; height: 46px;
  background: rgba(74,144,217,0.1);
  border: 1px solid rgba(74,144,217,0.25);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
}
.page-title { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: var(--bright); }
.page-subtitle { font-size: 12px; color: var(--dim); margin-top: 2px; }
.ai-badge {
  display: flex; align-items: center; gap: 7px;
  background: rgba(155,109,255,0.1);
  border: 1px solid rgba(155,109,255,0.25);
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  color: var(--purple);
}
.context-bar {
  position: relative;
  z-index: 1;
  background: rgba(22,45,79,0.45);
  border-bottom: 1px solid rgba(30,58,95,0.5);
  padding: 12px 28px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}
.ctx-field { display: flex; flex-direction: column; gap: 2px; }
.ctx-label { font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--dim); font-weight: 600; }
.ctx-input {
  background: rgba(22,45,79,0.7);
  border: 1px solid var(--border);
  border-radius: 7px;
  padding: 6px 10px;
  font-family: 'DM Sans', sans-serif;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--bright);
  outline: none;
  transition: border-color 0.15s;
  min-width: 100px;
}
.ctx-input:focus { border-color: var(--teal); }
.source-chips { display: flex; align-items: center; gap: 7px; margin-left: auto; }
.source-chip {
  font-size: 10.5px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid;
  transition: all 0.2s;
}
.src-empty  { color: var(--dim); border-color: var(--border); background: transparent; }
.src-filled { color: var(--green); border-color: rgba(46,204,113,0.3); background: rgba(46,204,113,0.08); }
.main-layout {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 420px 1fr;
  height: calc(100vh - 54px - 62px - 68px - 57px);
  min-height: 500px;
}
.soap-input-panel {
  border-right: 1px solid var(--border);
  overflow-y: auto;
  background: rgba(11,29,53,0.3);
  display: flex;
  flex-direction: column;
}
.soap-tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
  background: rgba(11,29,53,0.6);
  position: sticky;
  top: 0;
  z-index: 5;
}
.soap-tab {
  flex: 1;
  padding: 12px 8px;
  font-size: 11.5px;
  font-weight: 700;
  text-align: center;
  cursor: pointer;
  border: none;
  background: transparent;
  color: var(--dim);
  transition: all 0.15s;
  border-bottom: 2px solid transparent;
  letter-spacing: 0.03em;
}
.soap-tab.active { color: var(--bright); border-bottom-color: var(--teal); background: rgba(0,212,188,0.05); }
.soap-tab:hover:not(.active) { color: var(--text); background: rgba(30,58,95,0.3); }
.soap-tab .tab-letter {
  display: block;
  font-size: 18px;
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 2px;
}
.soap-tab.s-tab .tab-letter { color: var(--blue); }
.soap-tab.o-tab .tab-letter { color: var(--teal); }
.soap-tab.a-tab .tab-letter { color: var(--purple); }
.soap-tab.p-tab .tab-letter { color: var(--green); }
.soap-section { display: none; flex-direction: column; gap: 0; padding: 16px; }
.soap-section.active { display: flex; }
.field-group { margin-bottom: 14px; }
.field-group label {
  display: block;
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--dim);
  margin-bottom: 5px;
}
.field-input, .field-textarea, .field-select {
  width: 100%;
  background: rgba(22,45,79,0.6);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 11px;
  font-family: 'DM Sans', sans-serif;
  font-size: 12.5px;
  color: var(--bright);
  outline: none;
  transition: border-color 0.15s, background 0.15s;
  resize: none;
}
.field-input:focus, .field-textarea:focus, .field-select:focus {
  border-color: var(--teal);
  background: rgba(22,45,79,0.9);
}
.field-textarea { line-height: 1.7; }
.field-select option { background: #0d2240; }
.vitals-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.vital-block { display: flex; flex-direction: column; gap: 4px; }
.vital-block label { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--dim); }
.vital-input {
  background: rgba(22,45,79,0.6);
  border: 1px solid var(--border);
  border-radius: 7px;
  padding: 7px 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  color: var(--bright);
  outline: none;
  transition: border-color 0.15s;
  text-align: center;
}
.vital-input:focus { border-color: var(--teal); background: rgba(22,45,79,0.9); }
.section-divider {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted);
  padding: 8px 0 6px;
  border-top: 1px solid rgba(30,58,95,0.5);
  margin-top: 4px;
  margin-bottom: 2px;
}
.compiler-controls {
  position: relative;
  z-index: 1;
  padding: 12px 28px;
  background: rgba(11,29,53,0.5);
  border-bottom: 1px solid rgba(30,58,95,0.5);
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.control-group { display: flex; flex-direction: column; gap: 3px; }
.control-label { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--dim); }
.control-select {
  background: rgba(22,45,79,0.8);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 7px 28px 7px 11px;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: var(--bright);
  outline: none;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%234a7299' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  transition: border-color 0.15s;
}
.control-select:focus { border-color: var(--teal); }
.control-select option { background: #0d2240; }
.btn-compile {
  margin-left: auto;
  padding: 10px 24px;
  background: linear-gradient(135deg, #9b6dff, #7c5cd6);
  border: none;
  border-radius: 9px;
  color: #fff;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.18s;
  white-space: nowrap;
}
.btn-compile:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(155,109,255,0.4); }
.btn-compile:active { transform: translateY(0); }
.btn-compile:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.note-preview-panel {
  overflow-y: auto;
  background: rgba(5,10,20,0.6);
  padding: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 14px;
  padding: 40px;
}
.empty-icon { font-size: 52px; opacity: 0.4; }
.empty-title { font-family: 'Playfair Display', serif; font-size: 22px; color: var(--dim); font-weight: 700; }
.empty-body { font-size: 13px; color: var(--muted); max-width: 320px; line-height: 1.7; }
.empty-steps { display: flex; flex-direction: column; gap: 8px; text-align: left; margin-top: 8px; }
.empty-step { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--dim); }
.step-num {
  width: 22px; height: 22px;
  border-radius: 50%;
  background: rgba(0,212,188,0.1);
  border: 1px solid rgba(0,212,188,0.25);
  color: var(--teal);
  font-size: 10px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.loading-state { width: 100%; max-width: 760px; }
.shimmer-block { background: var(--panel); border-radius: 12px; padding: 48px 56px; }
.shimmer-line {
  height: 14px;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--edge) 25%, var(--muted) 50%, var(--edge) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  margin-bottom: 10px;
}
.shimmer-line.title { height: 28px; width: 45%; margin-bottom: 28px; border-radius: 6px; }
.shimmer-line.heading { height: 16px; width: 20%; margin-bottom: 10px; }
.note-document {
  background: #ffffff;
  color: #1a1a2e;
  border-radius: 12px;
  box-shadow: 0 8px 64px rgba(0,0,0,0.5);
  width: 100%;
  max-width: 760px;
  padding: 48px 56px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13.5px;
  line-height: 1.85;
  animation: noteReveal 0.4s ease both;
  position: relative;
}
.note-practice-line { font-size: 11px; color: #666; letter-spacing: 0.03em; margin-bottom: 4px; }
.note-type-line { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 700; color: #1a1a2e; margin-bottom: 14px; }
.note-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
.note-meta-item { font-size: 12px; color: #444; }
.note-meta-label { font-weight: 700; color: #1a1a2e; }
.note-patient-banner {
  background: #f4f7ff;
  border: 1px solid #dde4f0;
  border-radius: 8px;
  padding: 12px 16px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 0;
}
.banner-field { display: flex; flex-direction: column; gap: 2px; }
.banner-label { font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #888; }
.banner-value { font-size: 12.5px; font-weight: 600; color: #1a1a2e; }
.note-divider { border: none; border-top: 2px solid #1a1a2e; margin: 18px 0 22px; }
.note-section-heading {
  display: block;
  font-size: 11.5px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #1a1a2e;
  border-bottom: 1px solid #dde4f0;
  padding-bottom: 5px;
  margin-top: 24px;
  margin-bottom: 12px;
}
.note-sub-label { font-weight: 700; color: #1a1a2e; }
.note-body {
  outline: none;
  font-family: 'DM Sans', sans-serif;
  font-size: 13.5px;
  line-height: 1.9;
  color: #2d2d3a;
  min-height: 80px;
  cursor: text;
  white-space: pre-wrap;
}
.note-body:focus { background: rgba(0,84,255,0.02); border-radius: 4px; }
.note-signature {
  margin-top: 36px;
  padding-top: 18px;
  border-top: 1px solid #dde4f0;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.sig-left, .sig-right { display: flex; flex-direction: column; gap: 4px; }
.sig-line { font-size: 13px; color: #444; }
.sig-name { font-weight: 700; font-size: 13px; color: #1a1a2e; }
.sig-stamp { font-size: 9.5px; color: #aaa; font-style: italic; margin-top: 6px; }
.signed-badge {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(46,204,113,0.12);
  border: 1px solid rgba(46,204,113,0.4);
  color: #2ecc71;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: uppercase;
}
.action-bar {
  position: sticky;
  bottom: 0;
  z-index: 10;
  height: 62px;
  background: rgba(11,29,53,0.97);
  border-top: 1px solid var(--border);
  backdrop-filter: blur(16px);
  padding: 0 28px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.action-bar-left { display: flex; align-items: center; gap: 14px; flex: 1; }
.edited-badge { font-size: 11.5px; font-weight: 600; color: var(--amber); display: flex; align-items: center; gap: 5px; }
.compiled-ts { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; color: var(--dim); }
.action-bar-right { display: flex; align-items: center; gap: 8px; }
.btn {
  padding: 9px 16px;
  border-radius: 8px;
  font-family: 'DM Sans', sans-serif;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
  white-space: nowrap;
  border: 1px solid transparent;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-ghost { background: transparent; border-color: var(--border); color: var(--text); }
.btn-ghost:hover { background: rgba(30,58,95,0.5); color: var(--bright); }
.btn-teal { background: rgba(0,212,188,0.1); border-color: rgba(0,212,188,0.3); color: var(--teal); }
.btn-teal:hover { background: rgba(0,212,188,0.2); }
.btn-teal.success { background: rgba(46,204,113,0.15); border-color: rgba(46,204,113,0.4); color: var(--green); }
.btn-blue { background: linear-gradient(135deg, #4a90d9, #2f6db5); border-color: transparent; color: #fff; }
.btn-blue:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(74,144,217,0.35); }
.btn-blue-outline { background: transparent; border-color: var(--blue); color: var(--blue); }
.btn-blue-outline:hover { background: rgba(74,144,217,0.1); }
.btn-green { background: linear-gradient(135deg, #2ecc71, #25a55b); border-color: transparent; color: #fff; }
.btn-green:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(46,204,113,0.3); }
.btn-green.signed { background: rgba(46,204,113,0.1); border-color: rgba(46,204,113,0.3); color: var(--green); cursor: default; transform: none; box-shadow: none; }
.toast-container { position: fixed; bottom: 80px; right: 24px; z-index: 999; display: flex; flex-direction: column; gap: 8px; }
.toast {
  background: var(--panel);
  border: 1px solid var(--border);
  border-left: 3px solid var(--teal);
  border-radius: 10px;
  padding: 12px 18px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--bright);
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  animation: toastIn 0.3s ease both;
  max-width: 300px;
}
/* ICD-10 AUTOCOMPLETE */
.icd-wrap { position: relative; width: 100%; }
.icd-input-row { display: flex; gap: 6px; align-items: center; }
.icd-badge {
  display: inline-flex; align-items: center; gap: 5px;
  background: rgba(0,212,188,0.12);
  border: 1px solid rgba(0,212,188,0.35);
  border-radius: 6px;
  padding: 5px 9px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--teal);
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 68px;
  justify-content: center;
}
.icd-badge.empty { color: var(--muted); border-color: var(--border); background: transparent; font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500; }
.icd-clear { background: transparent; border: none; cursor: pointer; color: var(--dim); font-size: 13px; padding: 2px 4px; border-radius: 4px; line-height: 1; }
.icd-clear:hover { color: var(--red); }
.icd-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0; right: 0;
  background: #0d2240;
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.5);
  z-index: 200;
  max-height: 280px;
  overflow-y: auto;
  overflow-x: hidden;
}
.icd-dropdown-header {
  padding: 8px 12px 6px;
  font-size: 9.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--dim);
  border-bottom: 1px solid rgba(30,58,95,0.6);
}
.icd-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  cursor: pointer;
  transition: background 0.12s;
  border-bottom: 1px solid rgba(30,58,95,0.3);
}
.icd-item:last-child { border-bottom: none; }
.icd-item:hover, .icd-item.active { background: rgba(0,212,188,0.07); }
.icd-item-code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--teal);
  min-width: 56px;
  flex-shrink: 0;
}
.icd-item-name { font-size: 12.5px; color: var(--bright); font-weight: 500; line-height: 1.35; }
.icd-item-cat { font-size: 10px; color: var(--dim); margin-top: 1px; }
.icd-no-results { padding: 20px 12px; text-align: center; font-size: 12px; color: var(--dim); }
.icd-searching { padding: 16px 12px; text-align: center; font-size: 12px; color: var(--dim); }
.toast.fade-out { animation: toastOut 0.3s ease both; }
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--muted); border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: var(--dim); }
@keyframes livePulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(46,204,113,0.4); }
  50% { box-shadow: 0 0 0 5px rgba(46,204,113,0); }
}
@keyframes shimmer { to { background-position: -200% 0; } }
@keyframes noteReveal { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes toastIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
@keyframes toastOut { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(20px); } }
@media print {
  body { background: #fff !important; color: #000 !important; }
  body::before, body::after { display: none !important; }
  .navbar, .page-header, .context-bar, .compiler-controls,
  .soap-input-panel, .action-bar, .empty-state, .loading-state,
  .toast-container { display: none !important; }
  .main-layout { display: block !important; height: auto !important; }
  .note-preview-panel { padding: 0 !important; overflow: visible !important; background: #fff !important; display: block !important; }
  .note-document { box-shadow: none !important; border-radius: 0 !important; max-width: 100% !important; margin: 0 !important; padding: 15mm 18mm !important; font-size: 12pt !important; color: #000 !important; }
  @page { size: letter portrait; margin: 0; }
}
</style>
</head>
<body>
<nav class="navbar">
  <a href="#" class="wordmark">Notrya<span> AI</span><small>by MedNu</small></a>
  <div class="nav-links">
    <a href="#" class="nav-link">Dashboard</a>
    <a href="#" class="nav-link">Shift</a>
    <a href="#" class="nav-link">Patients</a>
    <a href="#" class="nav-link active">Procedures</a>
    <a href="#" class="nav-link">Guidelines</a>
    <a href="#" class="nav-link">News</a>
  </div>
  <div class="live-dot"></div>
</nav>
<div class="page-header">
  <div class="page-header-left">
    <div class="page-icon">📄</div>
    <div>
      <div class="page-title">SOAP Note Compiler</div>
      <div class="page-subtitle">Pull from Subjective, Objective, Assessment &amp; Plan — compile one complete clinical note</div>
    </div>
  </div>
  <div class="ai-badge">✦ Powered by Notrya AI</div>
</div>
<div class="context-bar">
  <div class="ctx-field">
    <span class="ctx-label">Patient Initials</span>
    <input class="ctx-input" id="ctx-initials" placeholder="J.D." style="width:80px">
  </div>
  <div class="ctx-field">
    <span class="ctx-label">Age</span>
    <input class="ctx-input" id="ctx-age" type="number" placeholder="—" style="width:60px">
  </div>
  <div class="ctx-field">
    <span class="ctx-label">Sex</span>
    <select class="ctx-input" id="ctx-sex" style="width:75px">
      <option value="">—</option>
      <option>M</option><option>F</option><option>Other</option>
    </select>
  </div>
  <div class="ctx-field">
    <span class="ctx-label">Chief Complaint</span>
    <input class="ctx-input" id="ctx-cc" placeholder="e.g. Chest pain" style="width:180px">
  </div>
  <div class="ctx-field">
    <span class="ctx-label">Allergies</span>
    <input class="ctx-input" id="ctx-allergies" placeholder="NKDA" style="width:120px">
  </div>
  <div class="ctx-field">
    <span class="ctx-label">Provider</span>
    <input class="ctx-input" id="ctx-provider" placeholder="Dr. Smith" style="width:130px">
  </div>
  <div class="source-chips">
    <span id="src-s" class="source-chip src-empty">S Subjective</span>
    <span id="src-o" class="source-chip src-empty">O Objective</span>
    <span id="src-a" class="source-chip src-empty">A Assessment</span>
    <span id="src-p" class="source-chip src-empty">P Plan</span>
  </div>
</div>
<div class="compiler-controls">
  <div class="control-group">
    <span class="control-label">Note Style</span>
    <select class="control-select" id="note-style">
      <option value="standard_soap">Standard SOAP</option>
      <option value="expanded_soap">Expanded SOAP (Full H&amp;P)</option>
      <option value="ed_note">ED Note</option>
      <option value="progress_note">Progress Note</option>
      <option value="discharge">Discharge Summary</option>
    </select>
  </div>
  <div class="control-group">
    <span class="control-label">Detail Level</span>
    <select class="control-select" id="verbosity">
      <option value="concise">Concise</option>
      <option value="standard" selected>Standard</option>
      <option value="detailed">Detailed</option>
    </select>
  </div>
  <button class="btn-compile" id="compile-btn" onclick="compileSoapNote()">
    <span id="compile-btn-icon">✦</span>
    <span id="compile-btn-text">Compile Note</span>
  </button>
</div>
<div class="main-layout">
  <div class="soap-input-panel">
    <div class="soap-tabs">
      <button class="soap-tab s-tab active" onclick="switchTab('S')">
        <span class="tab-letter">S</span>Subjective
      </button>
      <button class="soap-tab o-tab" onclick="switchTab('O')">
        <span class="tab-letter">O</span>Objective
      </button>
      <button class="soap-tab a-tab" onclick="switchTab('A')">
        <span class="tab-letter">A</span>Assessment
      </button>
      <button class="soap-tab p-tab" onclick="switchTab('P')">
        <span class="tab-letter">P</span>Plan
      </button>
    </div>
    <div class="soap-section active" id="section-S">
      <div class="field-group">
        <label>HPI — History of Present Illness</label>
        <textarea class="field-textarea" id="s-hpi" rows="5" placeholder="Describe the onset, location, duration, character, aggravating/relieving factors, radiation, and timing of the chief complaint…" oninput="updateChip('S')"></textarea>
      </div>
      <div class="field-group">
        <label>Review of Systems (ROS)</label>
        <textarea class="field-textarea" id="s-ros" rows="3" placeholder="Pertinent positives and negatives by system…" oninput="updateChip('S')"></textarea>
      </div>
      <div class="section-divider">PAST HISTORY</div>
      <div class="field-group">
        <label>Past Medical History (PMH)</label>
        <textarea class="field-textarea" id="s-pmh" rows="2" placeholder="Hypertension, DM type 2, CAD…" oninput="updateChip('S')"></textarea>
      </div>
      <div class="field-group">
        <label>Surgical History</label>
        <input class="field-input" id="s-surgical" placeholder="e.g. Appendectomy 2018, CABG 2020" oninput="updateChip('S')">
      </div>
      <div class="field-group">
        <label>Current Medications</label>
        <textarea class="field-textarea" id="s-medications" rows="3" placeholder="Lisinopril 10mg daily, Metformin 500mg BID…" oninput="updateChip('S')"></textarea>
      </div>
      <div class="field-group">
        <label>Family History</label>
        <input class="field-input" id="s-family" placeholder="e.g. Father: MI at 55, Mother: breast cancer" oninput="updateChip('S')">
      </div>
      <div class="field-group">
        <label>Social History</label>
        <textarea class="field-textarea" id="s-social" rows="2" placeholder="Tobacco, alcohol, drugs, occupation, living situation…" oninput="updateChip('S')"></textarea>
      </div>
    </div>
    <div class="soap-section" id="section-O">
      <div class="section-divider">VITAL SIGNS</div>
      <div class="vitals-grid" style="margin-bottom:14px">
        <div class="vital-block"><label>Temp (°F)</label><input class="vital-input" id="o-temp" placeholder="98.6" oninput="updateChip('O')"></div>
        <div class="vital-block"><label>Heart Rate (bpm)</label><input class="vital-input" id="o-hr" placeholder="72" oninput="updateChip('O')"></div>
        <div class="vital-block"><label>Blood Pressure</label><input class="vital-input" id="o-bp" placeholder="120/80" oninput="updateChip('O')"></div>
        <div class="vital-block"><label>Resp Rate</label><input class="vital-input" id="o-rr" placeholder="16" oninput="updateChip('O')"></div>
        <div class="vital-block"><label>SpO₂ (%)</label><input class="vital-input" id="o-spo2" placeholder="98" oninput="updateChip('O')"></div>
        <div class="vital-block"><label>Weight (lbs)</label><input class="vital-input" id="o-weight" placeholder="—" oninput="updateChip('O')"></div>
      </div>
      <div class="section-divider">PHYSICAL EXAMINATION</div>
      <div class="field-group"><label>General Appearance</label><input class="field-input" id="o-general" placeholder="Alert, oriented, no acute distress" oninput="updateChip('O')"></div>
      <div class="field-group"><label>Cardiovascular</label><input class="field-input" id="o-cardio" placeholder="RRR, no murmurs/rubs/gallops" oninput="updateChip('O')"></div>
      <div class="field-group"><label>Pulmonary</label><input class="field-input" id="o-pulm" placeholder="CTA bilaterally, no wheeze/rales/rhonchi" oninput="updateChip('O')"></div>
      <div class="field-group"><label>Abdomen</label><input class="field-input" id="o-abdomen" placeholder="Soft, non-tender, non-distended, NABS" oninput="updateChip('O')"></div>
      <div class="field-group"><label>Neurological</label><input class="field-input" id="o-neuro" placeholder="A&amp;Ox3, CN II-XII intact, strength 5/5" oninput="updateChip('O')"></div>
      <div class="field-group"><label>Extremities / Skin</label><input class="field-input" id="o-ext" placeholder="No edema, pulses 2+ bilaterally" oninput="updateChip('O')"></div>
      <div class="field-group"><label>Additional Exam Findings</label><textarea class="field-textarea" id="o-other-exam" rows="2" placeholder="HEENT, musculoskeletal, GU, or any other pertinent findings…" oninput="updateChip('O')"></textarea></div>
      <div class="section-divider">DIAGNOSTICS</div>
      <div class="field-group"><label>Laboratory Results</label><textarea class="field-textarea" id="o-labs" rows="3" placeholder="CBC: WBC 8.2, Hgb 13.4, Plt 220" oninput="updateChip('O')"></textarea></div>
      <div class="field-group"><label>Imaging Results</label><textarea class="field-textarea" id="o-imaging" rows="2" placeholder="CXR: No infiltrate, no pneumothorax" oninput="updateChip('O')"></textarea></div>
      <div class="field-group"><label>Other Diagnostics</label><textarea class="field-textarea" id="o-other-dx" rows="2" placeholder="Echo, stress test, EEG, spirometry results…" oninput="updateChip('O')"></textarea></div>
    </div>
    <div class="soap-section" id="section-A">
      <div class="field-group">
        <label>Primary Diagnosis + ICD-10 Code</label>
        <div class="icd-wrap" id="icd-primary-wrap">
          <div class="icd-input-row">
            <input class="field-input" id="a-primary-dx" placeholder="Type diagnosis name to search ICD-10…" autocomplete="off"
              oninput="icdSearch('primary', this.value); updateChip('A')"
              onfocus="if(this.value.length>=2) icdSearch('primary',this.value)"
              onkeydown="icdKeydown(event,'primary')">
            <span class="icd-badge empty" id="icd-primary-badge">No code</span>
            <button class="icd-clear" id="icd-primary-clear" onclick="icdClear('primary')" style="display:none" title="Clear code">✕</button>
          </div>
          <div class="icd-dropdown" id="icd-primary-dropdown" style="display:none"></div>
          <input type="hidden" id="a-icd10-primary">
        </div>
      </div>
      <div class="field-group"><label>Secondary / Comorbid Diagnoses</label><textarea class="field-textarea" id="a-secondary-dx" rows="3" placeholder="1. Hypertension — I10" oninput="updateChip('A')"></textarea></div>
      <div class="field-group"><label>Clinical Reasoning / MDM</label><textarea class="field-textarea" id="a-reasoning" rows="4" placeholder="Describe the clinical reasoning, risk stratification, and decision-making process…" oninput="updateChip('A')"></textarea></div>
      <div class="field-group"><label>Differential Diagnoses</label><textarea class="field-textarea" id="a-differential" rows="3" placeholder="1. Acute coronary syndrome&#10;2. Pulmonary embolism" oninput="updateChip('A')"></textarea></div>
      <div class="field-group">
        <label>Acuity / Severity</label>
        <select class="field-select" id="a-acuity" oninput="updateChip('A')">
          <option value="">— Select —</option>
          <option>ESI 1 — Immediate</option><option>ESI 2 — Emergent</option><option>ESI 3 — Urgent</option>
          <option>ESI 4 — Less Urgent</option><option>ESI 5 — Non-Urgent</option>
          <option>Stable</option><option>Guarded</option><option>Critical</option>
        </select>
      </div>
      <div class="field-group"><label>Prognosis</label><input class="field-input" id="a-prognosis" placeholder="e.g. Good with treatment compliance; close follow-up recommended" oninput="updateChip('A')"></div>
    </div>
    <div class="soap-section" id="section-P">
      <div class="field-group"><label>Medications Ordered / Prescribed</label><textarea class="field-textarea" id="p-medications" rows="4" placeholder="1. Aspirin 325mg PO once, then 81mg daily" oninput="updateChip('P')"></textarea></div>
      <div class="field-group"><label>Procedures Performed / Ordered</label><textarea class="field-textarea" id="p-procedures" rows="2" placeholder="IV access placed, 12-lead ECG obtained, continuous cardiac monitoring initiated" oninput="updateChip('P')"></textarea></div>
      <div class="field-group"><label>Labs / Imaging Ordered</label><textarea class="field-textarea" id="p-orders" rows="2" placeholder="Repeat troponin in 3 hours, BMP, PT/PTT, repeat ECG in 1 hour" oninput="updateChip('P')"></textarea></div>
      <div class="field-group"><label>Consults</label><textarea class="field-textarea" id="p-consults" rows="2" placeholder="Cardiology consult placed — NSTEMI protocol" oninput="updateChip('P')"></textarea></div>
      <div class="field-group">
        <label>Disposition</label>
        <select class="field-select" id="p-disposition" oninput="updateChip('P')">
          <option value="">— Select —</option>
          <option>Admit to telemetry</option><option>Admit to ICU/CCU</option><option>Admit to observation</option>
          <option>Transfer to higher level of care</option><option>Discharge home</option>
          <option>Discharge to skilled nursing facility</option><option>AMA</option><option>Pending workup</option>
        </select>
      </div>
      <div class="field-group"><label>Patient Education</label><textarea class="field-textarea" id="p-education" rows="2" placeholder="Patient and family educated regarding diagnosis, treatment plan, warning signs, and return precautions." oninput="updateChip('P')"></textarea></div>
      <div class="field-group"><label>Follow-Up Instructions</label><input class="field-input" id="p-followup" placeholder="e.g. Cardiology in 1 week, PCP in 2 weeks" oninput="updateChip('P')"></div>
      <div class="field-group"><label>Return Precautions</label><textarea class="field-textarea" id="p-return-precautions" rows="2" placeholder="Return to ED immediately for: worsening chest pain, shortness of breath, palpitations, syncope." oninput="updateChip('P')"></textarea></div>
      <div class="field-group"><label>Additional Plan Details</label><textarea class="field-textarea" id="p-additional" rows="2" placeholder="Any other plan elements not captured above…" oninput="updateChip('P')"></textarea></div>
    </div>
  </div>
  <div class="note-preview-panel" id="note-preview-panel">
    <div class="empty-state" id="empty-state">
      <div class="empty-icon">📄</div>
      <div class="empty-title">Ready to Compile</div>
      <div class="empty-body">Fill in the SOAP sections on the left, then click Compile Note to generate a complete clinical document.</div>
      <div class="empty-steps">
        <div class="empty-step"><div class="step-num">S</div>Enter Subjective history and ROS</div>
        <div class="empty-step"><div class="step-num">O</div>Record vitals, exam, and diagnostics</div>
        <div class="empty-step"><div class="step-num">A</div>Add diagnoses and clinical reasoning</div>
        <div class="empty-step"><div class="step-num">P</div>Document the complete plan</div>
      </div>
    </div>
    <div class="loading-state" id="loading-state" style="display:none">
      <div class="shimmer-block">
        <div class="shimmer-line title"></div>
        <div class="shimmer-line" style="width:30%;height:18px;margin-bottom:20px"></div>
        <div class="shimmer-line heading"></div>
        <div class="shimmer-line" style="width:100%"></div>
        <div class="shimmer-line" style="width:93%"></div>
        <div class="shimmer-line" style="width:88%;margin-bottom:20px"></div>
        <div class="shimmer-line heading"></div>
        <div class="shimmer-line" style="width:100%"></div>
        <div class="shimmer-line" style="width:96%"></div>
        <div class="shimmer-line" style="width:85%;margin-bottom:20px"></div>
        <div class="shimmer-line heading"></div>
        <div class="shimmer-line" style="width:100%"></div>
        <div class="shimmer-line" style="width:91%"></div>
        <div class="shimmer-line" style="width:80%"></div>
      </div>
    </div>
    <div class="note-document" id="note-document" style="display:none">
      <div id="signed-badge" class="signed-badge" style="display:none">✓ Signed</div>
      <div class="note-practice-line">Notrya AI &nbsp;|&nbsp; <span id="doc-facility">Emergency Department</span></div>
      <div class="note-type-line" id="doc-note-type">SOAP Note</div>
      <div class="note-meta-grid">
        <div class="note-meta-item"><span class="note-meta-label">Date of Service:</span> <span id="doc-date"></span></div>
        <div class="note-meta-item"><span class="note-meta-label">Provider:</span> <span id="doc-provider"></span></div>
      </div>
      <div class="note-patient-banner">
        <div class="banner-field"><span class="banner-label">Patient</span><span class="banner-value" id="doc-patient">—</span></div>
        <div class="banner-field"><span class="banner-label">Age / Sex</span><span class="banner-value" id="doc-age-sex">—</span></div>
        <div class="banner-field"><span class="banner-label">Chief Complaint</span><span class="banner-value" id="doc-cc">—</span></div>
        <div class="banner-field"><span class="banner-label">Allergies</span><span class="banner-value" id="doc-allergies">—</span></div>
        <div class="banner-field"><span class="banner-label">Acuity</span><span class="banner-value" id="doc-acuity">—</span></div>
        <div class="banner-field"><span class="banner-label">Diagnosis</span><span class="banner-value" id="doc-dx">—</span></div>
      </div>
      <hr class="note-divider">
      <div id="note-body" class="note-body" contenteditable="true" oninput="onNoteEdit()"></div>
      <div class="note-signature">
        <div class="sig-left">
          <div class="sig-line">_______________________________</div>
          <div class="sig-name" id="doc-sig-name">Provider Signature</div>
          <div class="sig-stamp" id="doc-sig-stamp"></div>
        </div>
        <div class="sig-right">
          <div class="sig-line">Date: _______________</div>
          <div class="sig-line">Time: _______________</div>
        </div>
      </div>
    </div>
  </div>
</div>
<div class="action-bar">
  <div class="action-bar-left">
    <div class="edited-badge" id="edited-badge" style="display:none">● Unsaved edits</div>
    <div class="compiled-ts" id="compiled-ts"></div>
  </div>
  <div class="action-bar-right">
    <button class="btn btn-ghost" id="btn-recompile" onclick="compileSoapNote()" style="display:none">↺ Recompile</button>
    <button class="btn btn-teal" id="btn-copy" onclick="copyNote()" style="display:none">📋 Copy</button>
    <button class="btn btn-blue-outline" id="btn-print" onclick="printNote()" style="display:none">🖨 Print</button>
    <button class="btn btn-blue" id="btn-pdf" onclick="downloadPDF()" style="display:none">⬇ Download PDF</button>
    <button class="btn btn-green" id="btn-sign" onclick="signNote()" style="display:none">✅ Sign &amp; Save</button>
  </div>
</div>
<div class="toast-container" id="toast-container"></div>
<script>
let compiledNote = null, noteEdited = false, noteSigned = false, compileInProgress = false, compiledAt = null;
function switchTab(letter) {
  document.querySelectorAll('.soap-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.soap-section').forEach(s => s.classList.remove('active'));
  document.querySelector('.' + letter.toLowerCase() + '-tab').classList.add('active');
  document.getElementById('section-' + letter).classList.add('active');
}
function updateChip(section) {
  const fieldMap = { S:['s-hpi','s-ros','s-pmh','s-medications','s-social'], O:['o-temp','o-hr','o-bp','o-general','o-labs'], A:['a-primary-dx','a-reasoning'], P:['p-medications','p-disposition','p-procedures'] };
  const hasData = fieldMap[section].some(id => { const el = document.getElementById(id); return el && el.value.trim().length > 0; });
  const chip = document.getElementById('src-' + section.toLowerCase());
  chip.className = 'source-chip ' + (hasData ? 'src-filled' : 'src-empty');
}
function gatherPatientContext() { return { initials: document.getElementById('ctx-initials').value.trim() || 'Unknown', age: document.getElementById('ctx-age').value.trim() || '—', sex: document.getElementById('ctx-sex').value || '—', cc: document.getElementById('ctx-cc').value.trim() || 'Not specified', allergies: document.getElementById('ctx-allergies').value.trim() || 'NKDA', provider: document.getElementById('ctx-provider').value.trim() || 'Attending Physician' }; }
function gatherSubjective() { return { hpi: document.getElementById('s-hpi').value.trim(), ros: document.getElementById('s-ros').value.trim(), pmh: document.getElementById('s-pmh').value.trim(), surgical: document.getElementById('s-surgical').value.trim(), medications: document.getElementById('s-medications').value.trim(), family: document.getElementById('s-family').value.trim(), social: document.getElementById('s-social').value.trim() }; }
function gatherObjective() { return { temp: document.getElementById('o-temp').value.trim(), hr: document.getElementById('o-hr').value.trim(), bp: document.getElementById('o-bp').value.trim(), rr: document.getElementById('o-rr').value.trim(), spo2: document.getElementById('o-spo2').value.trim(), weight: document.getElementById('o-weight').value.trim(), general: document.getElementById('o-general').value.trim(), cardio: document.getElementById('o-cardio').value.trim(), pulm: document.getElementById('o-pulm').value.trim(), abdomen: document.getElementById('o-abdomen').value.trim(), neuro: document.getElementById('o-neuro').value.trim(), ext: document.getElementById('o-ext').value.trim(), otherExam: document.getElementById('o-other-exam').value.trim(), labs: document.getElementById('o-labs').value.trim(), imaging: document.getElementById('o-imaging').value.trim(), otherDx: document.getElementById('o-other-dx').value.trim() }; }
function gatherAssessment() { return { primaryDx: document.getElementById('a-primary-dx').value.trim(), icd10: document.getElementById('a-icd10-primary').value.trim(), secondaryDx: document.getElementById('a-secondary-dx').value.trim(), reasoning: document.getElementById('a-reasoning').value.trim(), differential: document.getElementById('a-differential').value.trim(), acuity: document.getElementById('a-acuity').value.trim(), prognosis: document.getElementById('a-prognosis').value.trim() }; }
function gatherPlan() { return { medications: document.getElementById('p-medications').value.trim(), procedures: document.getElementById('p-procedures').value.trim(), orders: document.getElementById('p-orders').value.trim(), consults: document.getElementById('p-consults').value.trim(), disposition: document.getElementById('p-disposition').value.trim(), education: document.getElementById('p-education').value.trim(), followup: document.getElementById('p-followup').value.trim(), returnPrec: document.getElementById('p-return-precautions').value.trim(), additional: document.getElementById('p-additional').value.trim() }; }
function buildPrompt(pt, s, o, a, p, style, verbosity) {
  const styleMap = { standard_soap:'Standard SOAP Note with SUBJECTIVE, OBJECTIVE, ASSESSMENT, PLAN sections.', expanded_soap:'Expanded SOAP Note with full HPI, ROS, Physical Exam, MDM, and comprehensive Plan.', ed_note:'Emergency Department Note: CC, HPI, PMH/Medications/Allergies, ROS, Physical Exam, MDM, Assessment, Disposition.', progress_note:'Concise Progress Note in SOAP format.', discharge:'Discharge Summary: Admission Diagnosis, Hospital Course, Procedures, Discharge Condition, Medications, Follow-Up, Return Precautions.' };
  const verbMap = { concise:'Write concisely. Use brief, direct sentences.', standard:'Write clearly and completely. Standard medical documentation style.', detailed:'Write in full narrative prose. Include all clinical details.' };
  const vitals = [o.temp&&'T '+o.temp+'°F', o.hr&&'HR '+o.hr+' bpm', o.bp&&'BP '+o.bp, o.rr&&'RR '+o.rr, o.spo2&&'SpO2 '+o.spo2+'%', o.weight&&'Wt '+o.weight+' lbs'].filter(Boolean).join(' | ');
  const examLines = [o.general&&'General: '+o.general, o.cardio&&'Cardiovascular: '+o.cardio, o.pulm&&'Pulmonary: '+o.pulm, o.abdomen&&'Abdomen: '+o.abdomen, o.neuro&&'Neurological: '+o.neuro, o.ext&&'Extremities/Skin: '+o.ext, o.otherExam&&'Other: '+o.otherExam].filter(Boolean).join('\n');
  return 'You are Notrya AI. Compile the following clinical data into one complete clinical note.\n\nPATIENT:\n- Initials: '+pt.initials+'\n- Age/Sex: '+pt.age+'y '+pt.sex+'\n- CC: '+pt.cc+'\n- Allergies: '+pt.allergies+'\n- Provider: '+pt.provider+'\n- Date: '+new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})+'\n\nSUBJECTIVE:\nHPI: '+(s.hpi||'[Not provided]')+'\n'+(s.ros?'ROS: '+s.ros+'\n':'')+(s.pmh?'PMH: '+s.pmh+'\n':'')+(s.surgical?'Surgical: '+s.surgical+'\n':'')+(s.medications?'Medications: '+s.medications+'\n':'')+(s.family?'Family History: '+s.family+'\n':'')+(s.social?'Social: '+s.social+'\n':'')+'\nOBJECTIVE:\n'+(vitals?'Vitals: '+vitals+'\n':'')+(examLines?'Exam:\n'+examLines+'\n':'')+(o.labs?'Labs:\n'+o.labs+'\n':'')+(o.imaging?'Imaging:\n'+o.imaging+'\n':'')+(o.otherDx?'Other Diagnostics:\n'+o.otherDx+'\n':'')+'\nASSESSMENT:\nPrimary Dx: '+(a.primaryDx||'[Not specified]')+(a.icd10?' ('+a.icd10+')':'')+'\n'+(a.secondaryDx?'Secondary:\n'+a.secondaryDx+'\n':'')+(a.reasoning?'MDM: '+a.reasoning+'\n':'')+(a.differential?'Differential:\n'+a.differential+'\n':'')+(a.acuity?'Acuity: '+a.acuity+'\n':'')+(a.prognosis?'Prognosis: '+a.prognosis+'\n':'')+'\nPLAN:\n'+(p.medications?'Medications:\n'+p.medications+'\n':'')+(p.procedures?'Procedures: '+p.procedures+'\n':'')+(p.orders?'Orders: '+p.orders+'\n':'')+(p.consults?'Consults:\n'+p.consults+'\n':'')+(p.disposition?'Disposition: '+p.disposition+'\n':'')+(p.education?'Education: '+p.education+'\n':'')+(p.followup?'Follow-Up: '+p.followup+'\n':'')+(p.returnPrec?'Return Precautions: '+p.returnPrec+'\n':'')+(p.additional?'Additional: '+p.additional+'\n':'')+'\nINSTRUCTIONS:\nFormat: '+styleMap[style]+'\nDetail: '+verbMap[verbosity]+'\nRULES: Use ONLY the data provided. Plain text only — no markdown. Each section (SUBJECTIVE, OBJECTIVE, ASSESSMENT, PLAN) must start on its own UPPERCASE line. No header block — it is added separately.';
}
async function compileSoapNote() {
  if (compileInProgress) return;
  const pt=gatherPatientContext(), s=gatherSubjective(), o=gatherObjective(), a=gatherAssessment(), p=gatherPlan();
  const style=document.getElementById('note-style').value, verbosity=document.getElementById('verbosity').value;
  setCompileLoading(true);
  const styleLabels={standard_soap:'SOAP Note',expanded_soap:'Expanded SOAP Note',ed_note:'Emergency Department Note',progress_note:'Progress Note',discharge:'Discharge Summary'};
  try {
    const prompt=buildPrompt(pt,s,o,a,p,style,verbosity);
    const response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer OPENAI_PLACEHOLDER'},body:JSON.stringify({model:'gpt-4o-mini',max_tokens:2000,messages:[{role:'user',content:prompt}]})});
    const data=await response.json();
    const text=data.choices?.[0]?.message?.content||'';
    if(!text) throw new Error('Empty response');
    renderNote(pt,a,style,styleLabels[style],text);
    toast('Note compiled successfully ✓','#9b6dff');
  } catch(err) {
    const text=buildFallbackNote(pt,s,o,a,p);
    renderNote(pt,a,style,styleLabels[style],text);
    toast('Note compiled from source data ✓','#f5a623');
  }
}
function renderNote(pt,a,style,styleLabel,text) {
  compiledNote=text; compiledAt=new Date(); noteEdited=false; noteSigned=false;
  document.getElementById('doc-note-type').textContent=styleLabel;
  document.getElementById('doc-date').textContent=new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
  document.getElementById('doc-provider').textContent=pt.provider;
  document.getElementById('doc-patient').textContent=pt.initials||'—';
  document.getElementById('doc-age-sex').textContent=(pt.age!=='—'?pt.age+'y ':'')+(pt.sex!=='—'?pt.sex:'')||'—';
  document.getElementById('doc-cc').textContent=pt.cc||'—';
  document.getElementById('doc-allergies').textContent=pt.allergies||'NKDA';
  document.getElementById('doc-acuity').textContent=a.acuity||'—';
  document.getElementById('doc-dx').textContent=(a.primaryDx||'—')+(a.icd10?' ('+a.icd10+')':'');
  document.getElementById('doc-sig-name').textContent=pt.provider;
  document.getElementById('doc-sig-stamp').textContent='';
  document.getElementById('signed-badge').style.display='none';
  const noteBody=document.getElementById('note-body');
  noteBody.textContent=text;
  formatNoteBody(noteBody);
  document.getElementById('compiled-ts').textContent='Compiled '+compiledAt.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
  setCompileLoading(false);
  showNoteDoc(true);
  showActionButtons(true);
  document.getElementById('edited-badge').style.display='none';
}
function formatNoteBody(el) {
  const text=el.textContent;
  const sections=['SUBJECTIVE','OBJECTIVE','ASSESSMENT','PLAN','CC','HPI','HISTORY','PHYSICAL EXAM','MEDICATIONS','LABS','IMAGING','DIAGNOSTICS','MEDICAL DECISION','DISPOSITION','DISCHARGE'];
  let html=text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  sections.forEach(sec=>{html=html.replace(new RegExp('(^|\\n)('+sec+'[^\\n]*)','g'),'$1<span class="note-section-heading">$2</span>');});
  el.innerHTML=html;
}
function buildFallbackNote(pt,s,o,a,p) {
  const v=[o.temp&&'T '+o.temp+'°F',o.hr&&'HR '+o.hr+' bpm',o.bp&&'BP '+o.bp,o.rr&&'RR '+o.rr,o.spo2&&'SpO2 '+o.spo2+'%',o.weight&&'Wt '+o.weight+' lbs'].filter(Boolean).join(' | ');
  let note='SUBJECTIVE\n';
  if(s.hpi) note+='HPI: '+s.hpi+'\n';
  if(s.ros) note+='\nReview of Systems: '+s.ros+'\n';
  if(s.pmh) note+='\nPMH: '+s.pmh+'\n';
  if(s.surgical) note+='Surgical History: '+s.surgical+'\n';
  if(s.medications) note+='Medications: '+s.medications+'\n';
  if(s.family) note+='Family History: '+s.family+'\n';
  if(s.social) note+='Social History: '+s.social+'\n';
  note+='\nOBJECTIVE\n';
  if(v) note+='Vitals: '+v+'\n';
  const exam=[o.general&&'General: '+o.general,o.cardio&&'Cardiovascular: '+o.cardio,o.pulm&&'Pulmonary: '+o.pulm,o.abdomen&&'Abdomen: '+o.abdomen,o.neuro&&'Neurological: '+o.neuro,o.ext&&'Extremities/Skin: '+o.ext,o.otherExam&&'Other: '+o.otherExam].filter(Boolean);
  if(exam.length) note+='\nPhysical Exam:\n'+exam.join('\n')+'\n';
  if(o.labs) note+='\nLaboratory Results:\n'+o.labs+'\n';
  if(o.imaging) note+='\nImaging:\n'+o.imaging+'\n';
  if(o.otherDx) note+='\nOther Diagnostics:\n'+o.otherDx+'\n';
  note+='\nASSESSMENT\n';
  if(a.primaryDx) note+='Primary Diagnosis: '+a.primaryDx+(a.icd10?' ('+a.icd10+')':'')+'\n';
  if(a.secondaryDx) note+='\nSecondary Diagnoses:\n'+a.secondaryDx+'\n';
  if(a.reasoning) note+='\nClinical Reasoning / MDM:\n'+a.reasoning+'\n';
  if(a.differential) note+='\nDifferential Diagnoses:\n'+a.differential+'\n';
  if(a.acuity) note+='Acuity: '+a.acuity+'\n';
  if(a.prognosis) note+='Prognosis: '+a.prognosis+'\n';
  note+='\nPLAN\n';
  if(p.medications) note+='Medications:\n'+p.medications+'\n';
  if(p.procedures) note+='\nProcedures: '+p.procedures+'\n';
  if(p.orders) note+='\nLabs / Imaging Ordered: '+p.orders+'\n';
  if(p.consults) note+='\nConsults:\n'+p.consults+'\n';
  if(p.disposition) note+='\nDisposition: '+p.disposition+'\n';
  if(p.education) note+='\nPatient Education: '+p.education+'\n';
  if(p.followup) note+='\nFollow-Up: '+p.followup+'\n';
  if(p.returnPrec) note+='\nReturn Precautions: '+p.returnPrec+'\n';
  if(p.additional) note+='\nAdditional: '+p.additional+'\n';
  return note.trim();
}
function setCompileLoading(loading) {
  compileInProgress=loading;
  const btn=document.getElementById('compile-btn'), icon=document.getElementById('compile-btn-icon'), txt=document.getElementById('compile-btn-text');
  btn.disabled=loading; icon.textContent=loading?'⏳':'✦'; txt.textContent=loading?'Compiling…':'Compile Note';
  document.getElementById('empty-state').style.display=loading?'none':(compiledNote?'none':'flex');
  document.getElementById('loading-state').style.display=loading?'block':'none';
  document.getElementById('note-document').style.display=loading?'none':(compiledNote?'block':'none');
}
function showNoteDoc(show) {
  document.getElementById('empty-state').style.display=show?'none':'flex';
  document.getElementById('loading-state').style.display='none';
  document.getElementById('note-document').style.display=show?'block':'none';
}
function showActionButtons(show) { ['btn-recompile','btn-copy','btn-print','btn-pdf','btn-sign'].forEach(id=>{document.getElementById(id).style.display=show?'flex':'none';}); }
function onNoteEdit() { noteEdited=true; document.getElementById('edited-badge').style.display='flex'; }
async function copyNote() {
  const body=document.getElementById('note-body').innerText;
  const header=document.getElementById('doc-note-type').textContent+'\nDate: '+document.getElementById('doc-date').textContent+' | Provider: '+document.getElementById('doc-provider').textContent+'\nPatient: '+document.getElementById('doc-patient').textContent+' | '+document.getElementById('doc-age-sex').textContent+' | CC: '+document.getElementById('doc-cc').textContent+'\nAllergies: '+document.getElementById('doc-allergies').textContent+'\n'+'─'.repeat(50)+'\n\n';
  try {
    await navigator.clipboard.writeText(header+body);
    const btn=document.getElementById('btn-copy');
    btn.innerHTML='✓ Copied!'; btn.classList.add('success');
    setTimeout(()=>{btn.innerHTML='📋 Copy';btn.classList.remove('success');},2000);
    toast('Copied to clipboard ✓','#00d4bc');
  } catch(e) { toast('Copy failed — please select and copy manually','#ff5c6c'); }
}
function printNote() { window.print(); }
function downloadPDF() {
  if(typeof html2pdf==='undefined'){toast('PDF library loading, please try again…','#f5a623');return;}
  const btn=document.getElementById('btn-pdf');
  btn.disabled=true; btn.innerHTML='⏳ Generating…';
  const el=document.getElementById('note-document');
  const pt=document.getElementById('doc-patient').textContent.replace(/\s+/g,'_');
  const date=new Date().toISOString().slice(0,10);
  const opt={margin:[12,14,12,14],filename:'SOAP-Note-'+pt+'-'+date+'.pdf',image:{type:'jpeg',quality:0.98},html2canvas:{scale:2,useCORS:true,logging:false},jsPDF:{unit:'mm',format:'letter',orientation:'portrait'},pagebreak:{mode:['avoid-all','css','legacy']}};
  el.removeAttribute('contenteditable');
  html2pdf().set(opt).from(el).save().then(()=>{el.setAttribute('contenteditable','true');btn.disabled=false;btn.innerHTML='⬇ Download PDF';toast('PDF downloaded ✓','#4a90d9');}).catch(()=>{el.setAttribute('contenteditable','true');btn.disabled=false;btn.innerHTML='⬇ Download PDF';toast('PDF generation failed','#ff5c6c');});
}
function signNote() {
  if(noteSigned) return; noteSigned=true;
  const now=new Date().toLocaleString('en-US',{month:'long',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
  document.getElementById('doc-sig-stamp').textContent='Electronically signed via Notrya AI · '+now;
  document.getElementById('signed-badge').style.display='flex';
  const btn=document.getElementById('btn-sign');
  btn.innerHTML='✅ Signed'; btn.classList.add('signed');
  document.getElementById('edited-badge').style.display='none';
  noteEdited=false;
  toast('Note signed and saved ✓','#2ecc71');
}
function toast(msg, color='#00d4bc') {
  const container=document.getElementById('toast-container');
  const el=document.createElement('div');
  el.className='toast'; el.style.borderLeftColor=color; el.textContent=msg;
  container.appendChild(el);
  setTimeout(()=>{el.classList.add('fade-out');setTimeout(()=>el.remove(),300);},3200);
}
document.addEventListener('DOMContentLoaded',()=>{document.getElementById('doc-date').textContent=new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});});

// ─── ICD-10 DATABASE (300+ common ED/inpatient codes) ─────────────────────────
const ICD10_DB = [
  // Cardiovascular
  {code:'I10',name:'Essential (primary) hypertension',cat:'Cardiovascular'},
  {code:'I11.9',name:'Hypertensive heart disease without heart failure',cat:'Cardiovascular'},
  {code:'I20.9',name:'Angina pectoris, unspecified',cat:'Cardiovascular'},
  {code:'I21.3',name:'ST elevation (STEMI) myocardial infarction, unspecified',cat:'Cardiovascular'},
  {code:'I21.4',name:'Non-ST elevation (NSTEMI) myocardial infarction',cat:'Cardiovascular'},
  {code:'I25.10',name:'Atherosclerotic heart disease of native coronary artery without angina',cat:'Cardiovascular'},
  {code:'I26.99',name:'Pulmonary embolism without acute cor pulmonale',cat:'Cardiovascular'},
  {code:'I48.0',name:'Paroxysmal atrial fibrillation',cat:'Cardiovascular'},
  {code:'I48.11',name:'Longstanding persistent atrial fibrillation',cat:'Cardiovascular'},
  {code:'I48.19',name:'Other persistent atrial fibrillation',cat:'Cardiovascular'},
  {code:'I48.20',name:'Chronic atrial fibrillation, unspecified',cat:'Cardiovascular'},
  {code:'I49.3',name:'Ventricular premature depolarization',cat:'Cardiovascular'},
  {code:'I47.1',name:'Supraventricular tachycardia',cat:'Cardiovascular'},
  {code:'I47.2',name:'Ventricular tachycardia',cat:'Cardiovascular'},
  {code:'I50.9',name:'Heart failure, unspecified',cat:'Cardiovascular'},
  {code:'I50.22',name:'Acute systolic (congestive) heart failure',cat:'Cardiovascular'},
  {code:'I50.32',name:'Acute diastolic (congestive) heart failure',cat:'Cardiovascular'},
  {code:'I60.9',name:'Subarachnoid hemorrhage, unspecified',cat:'Cardiovascular'},
  {code:'I61.9',name:'Intracerebral hemorrhage, unspecified',cat:'Cardiovascular'},
  {code:'I63.9',name:'Cerebral infarction, unspecified',cat:'Cardiovascular'},
  {code:'I65.29',name:'Occlusion and stenosis of unspecified carotid artery',cat:'Cardiovascular'},
  {code:'I70.201',name:'Atherosclerosis of native arteries of extremities',cat:'Cardiovascular'},
  {code:'I83.90',name:'Varicose veins of unspecified lower extremity',cat:'Cardiovascular'},
  // Pulmonary
  {code:'J00',name:'Acute nasopharyngitis (common cold)',cat:'Pulmonary/ENT'},
  {code:'J02.9',name:'Acute pharyngitis, unspecified',cat:'Pulmonary/ENT'},
  {code:'J06.9',name:'Acute upper respiratory infection, unspecified',cat:'Pulmonary/ENT'},
  {code:'J18.9',name:'Pneumonia, unspecified organism',cat:'Pulmonary'},
  {code:'J18.1',name:'Lobar pneumonia, unspecified organism',cat:'Pulmonary'},
  {code:'J20.9',name:'Acute bronchitis, unspecified',cat:'Pulmonary'},
  {code:'J44.0',name:'COPD with acute lower respiratory infection',cat:'Pulmonary'},
  {code:'J44.1',name:'COPD with acute exacerbation',cat:'Pulmonary'},
  {code:'J45.20',name:'Mild intermittent asthma, uncomplicated',cat:'Pulmonary'},
  {code:'J45.41',name:'Moderate persistent asthma with acute exacerbation',cat:'Pulmonary'},
  {code:'J45.51',name:'Severe persistent asthma with acute exacerbation',cat:'Pulmonary'},
  {code:'J96.00',name:'Acute respiratory failure, unspecified whether with hypoxia or hypercapnia',cat:'Pulmonary'},
  {code:'J93.11',name:'Primary spontaneous pneumothorax',cat:'Pulmonary'},
  {code:'J93.12',name:'Secondary spontaneous pneumothorax',cat:'Pulmonary'},
  {code:'J98.01',name:'Acute bronchospasm',cat:'Pulmonary'},
  // Gastrointestinal
  {code:'K21.0',name:'Gastro-esophageal reflux disease with esophagitis',cat:'Gastrointestinal'},
  {code:'K21.9',name:'Gastro-esophageal reflux disease without esophagitis',cat:'Gastrointestinal'},
  {code:'K25.9',name:'Gastric ulcer, unspecified',cat:'Gastrointestinal'},
  {code:'K27.9',name:'Peptic ulcer, unspecified, without hemorrhage or perforation',cat:'Gastrointestinal'},
  {code:'K29.70',name:'Gastritis, unspecified, without bleeding',cat:'Gastrointestinal'},
  {code:'K35.80',name:'Acute appendicitis without abscess',cat:'Gastrointestinal'},
  {code:'K37',name:'Unspecified appendicitis',cat:'Gastrointestinal'},
  {code:'K40.90',name:'Unilateral inguinal hernia, without obstruction or gangrene',cat:'Gastrointestinal'},
  {code:'K56.60',name:'Unspecified intestinal obstruction',cat:'Gastrointestinal'},
  {code:'K57.30',name:'Diverticulosis of large intestine without perforation or abscess',cat:'Gastrointestinal'},
  {code:'K57.32',name:'Diverticulitis of large intestine without perforation or abscess without bleeding',cat:'Gastrointestinal'},
  {code:'K59.00',name:'Constipation, unspecified',cat:'Gastrointestinal'},
  {code:'K70.30',name:'Alcoholic cirrhosis of liver without ascites',cat:'Gastrointestinal'},
  {code:'K72.90',name:'Hepatic failure, unspecified without coma',cat:'Gastrointestinal'},
  {code:'K74.60',name:'Unspecified cirrhosis of liver',cat:'Gastrointestinal'},
  {code:'K80.20',name:'Calculus of gallbladder without cholecystitis, without obstruction',cat:'Gastrointestinal'},
  {code:'K81.0',name:'Acute cholecystitis',cat:'Gastrointestinal'},
  {code:'K85.90',name:'Acute pancreatitis without necrosis or infection, unspecified',cat:'Gastrointestinal'},
  {code:'K92.1',name:'Melena',cat:'Gastrointestinal'},
  {code:'K92.0',name:'Hematemesis',cat:'Gastrointestinal'},
  // Endocrine/Metabolic
  {code:'E11.9',name:'Type 2 diabetes mellitus without complications',cat:'Endocrine'},
  {code:'E10.9',name:'Type 1 diabetes mellitus without complications',cat:'Endocrine'},
  {code:'E11.65',name:'Type 2 diabetes mellitus with hyperglycemia',cat:'Endocrine'},
  {code:'E11.641',name:'Type 2 diabetes mellitus with hypoglycemia with coma',cat:'Endocrine'},
  {code:'E13.10',name:'Diabetic ketoacidosis without coma',cat:'Endocrine'},
  {code:'E05.00',name:'Thyrotoxicosis with diffuse goiter without thyrotoxic crisis',cat:'Endocrine'},
  {code:'E03.9',name:'Hypothyroidism, unspecified',cat:'Endocrine'},
  {code:'E87.1',name:'Hypo-osmolality and hyponatremia',cat:'Endocrine'},
  {code:'E87.5',name:'Hyperkalemia',cat:'Endocrine'},
  {code:'E87.6',name:'Hypokalemia',cat:'Endocrine'},
  {code:'E11.51',name:'Type 2 diabetes mellitus with diabetic peripheral angiopathy without gangrene',cat:'Endocrine'},
  {code:'E66.9',name:'Obesity, unspecified',cat:'Endocrine'},
  // Neurological
  {code:'G43.909',name:'Migraine, unspecified, not intractable, without status migrainosus',cat:'Neurology'},
  {code:'G43.119',name:'Migraine with aura, intractable, without status migrainosus',cat:'Neurology'},
  {code:'G40.909',name:'Epilepsy, unspecified, not intractable, without status epilepticus',cat:'Neurology'},
  {code:'G40.201',name:'Localization-related symptomatic epilepsy with complex partial seizures',cat:'Neurology'},
  {code:'G45.9',name:'Transient cerebral ischemic attack, unspecified',cat:'Neurology'},
  {code:'G89.29',name:'Other chronic pain',cat:'Neurology'},
  {code:'G20',name:'Parkinson disease',cat:'Neurology'},
  {code:'G30.9',name:'Alzheimer disease, unspecified',cat:'Neurology'},
  {code:'G35',name:'Multiple sclerosis',cat:'Neurology'},
  {code:'R51.9',name:'Headache, unspecified',cat:'Neurology'},
  {code:'R55',name:'Syncope and collapse',cat:'Neurology'},
  {code:'G91.9',name:'Hydrocephalus, unspecified',cat:'Neurology'},
  // Musculoskeletal
  {code:'M54.5',name:'Low back pain',cat:'Musculoskeletal'},
  {code:'M54.2',name:'Cervicalgia',cat:'Musculoskeletal'},
  {code:'M79.3',name:'Panniculitis',cat:'Musculoskeletal'},
  {code:'M10.9',name:'Gout, unspecified',cat:'Musculoskeletal'},
  {code:'M25.561',name:'Pain in right knee',cat:'Musculoskeletal'},
  {code:'M25.562',name:'Pain in left knee',cat:'Musculoskeletal'},
  {code:'M17.11',name:'Primary osteoarthritis, right knee',cat:'Musculoskeletal'},
  {code:'M17.12',name:'Primary osteoarthritis, left knee',cat:'Musculoskeletal'},
  {code:'M81.0',name:'Age-related osteoporosis without current pathological fracture',cat:'Musculoskeletal'},
  {code:'M06.9',name:'Rheumatoid arthritis, unspecified',cat:'Musculoskeletal'},
  {code:'M32.9',name:'Systemic lupus erythematosus, unspecified',cat:'Musculoskeletal'},
  {code:'M65.9',name:'Synovitis and tenosynovitis, unspecified',cat:'Musculoskeletal'},
  {code:'M72.0',name:'Palmar fascial fibromatosis (Dupuytren)',cat:'Musculoskeletal'},
  // Infectious Disease
  {code:'A09',name:'Infectious gastroenteritis and colitis, unspecified',cat:'Infectious Disease'},
  {code:'A41.9',name:'Sepsis, unspecified organism',cat:'Infectious Disease'},
  {code:'A41.51',name:'Sepsis due to Escherichia coli',cat:'Infectious Disease'},
  {code:'A41.01',name:'Sepsis due to Methicillin susceptible Staphylococcus aureus',cat:'Infectious Disease'},
  {code:'A41.02',name:'Sepsis due to Methicillin resistant Staphylococcus aureus',cat:'Infectious Disease'},
  {code:'B20',name:'Human immunodeficiency virus (HIV) disease',cat:'Infectious Disease'},
  {code:'B34.9',name:'Viral infection, unspecified',cat:'Infectious Disease'},
  {code:'J10.1',name:'Influenza due to identified novel influenza A virus with other respiratory manifestations',cat:'Infectious Disease'},
  {code:'J11.1',name:'Influenza due to unidentified influenza virus with other respiratory manifestations',cat:'Infectious Disease'},
  {code:'N39.0',name:'Urinary tract infection, site not specified',cat:'Infectious Disease'},
  {code:'L03.90',name:'Cellulitis, unspecified',cat:'Infectious Disease'},
  {code:'L03.011',name:'Cellulitis of right finger',cat:'Infectious Disease'},
  {code:'L02.91',name:'Cutaneous abscess, unspecified',cat:'Infectious Disease'},
  {code:'G03.9',name:'Meningitis, unspecified',cat:'Infectious Disease'},
  // Renal/Urologic
  {code:'N17.9',name:'Acute kidney failure, unspecified',cat:'Renal/Urology'},
  {code:'N18.9',name:'Chronic kidney disease, unspecified',cat:'Renal/Urology'},
  {code:'N18.3',name:'Chronic kidney disease, stage 3 (moderate)',cat:'Renal/Urology'},
  {code:'N18.5',name:'Chronic kidney disease, stage 5',cat:'Renal/Urology'},
  {code:'N20.0',name:'Calculus of kidney',cat:'Renal/Urology'},
  {code:'N20.1',name:'Calculus of ureter',cat:'Renal/Urology'},
  {code:'N40.0',name:'Benign prostatic hyperplasia without lower urinary tract symptoms',cat:'Renal/Urology'},
  {code:'N10',name:'Acute pyelonephritis',cat:'Renal/Urology'},
  // Psychiatric
  {code:'F32.9',name:'Major depressive disorder, single episode, unspecified',cat:'Psychiatry'},
  {code:'F33.9',name:'Major depressive disorder, recurrent, unspecified',cat:'Psychiatry'},
  {code:'F41.1',name:'Generalized anxiety disorder',cat:'Psychiatry'},
  {code:'F41.0',name:'Panic disorder without agoraphobia',cat:'Psychiatry'},
  {code:'F20.9',name:'Schizophrenia, unspecified',cat:'Psychiatry'},
  {code:'F31.9',name:'Bipolar disorder, unspecified',cat:'Psychiatry'},
  {code:'F10.20',name:'Alcohol use disorder, moderate, uncomplicated',cat:'Psychiatry'},
  {code:'F10.10',name:'Alcohol abuse, uncomplicated',cat:'Psychiatry'},
  {code:'F11.20',name:'Opioid dependence, uncomplicated',cat:'Psychiatry'},
  {code:'F19.10',name:'Other psychoactive substance abuse, uncomplicated',cat:'Psychiatry'},
  {code:'F43.10',name:'Post-traumatic stress disorder, unspecified',cat:'Psychiatry'},
  {code:'F60.3',name:'Borderline personality disorder',cat:'Psychiatry'},
  // Hematology/Oncology
  {code:'D50.9',name:'Iron deficiency anemia, unspecified',cat:'Hematology'},
  {code:'D51.9',name:'Vitamin B12 deficiency anemia, unspecified',cat:'Hematology'},
  {code:'D64.9',name:'Anemia, unspecified',cat:'Hematology'},
  {code:'D68.9',name:'Coagulation defect, unspecified',cat:'Hematology'},
  {code:'C34.10',name:'Malignant neoplasm of upper lobe, unspecified bronchus or lung',cat:'Oncology'},
  {code:'C50.911',name:'Malignant neoplasm of unspecified site of right female breast',cat:'Oncology'},
  {code:'C61',name:'Malignant neoplasm of prostate',cat:'Oncology'},
  {code:'C18.9',name:'Malignant neoplasm of colon, unspecified',cat:'Oncology'},
  // Trauma/Injury
  {code:'S09.90XA',name:'Unspecified injury of head, initial encounter',cat:'Trauma'},
  {code:'S06.0X0A',name:'Concussion without loss of consciousness, initial encounter',cat:'Trauma'},
  {code:'S52.501A',name:'Unspecified fracture of lower end of right radius, initial encounter',cat:'Trauma'},
  {code:'S72.001A',name:'Fracture of unspecified part of neck of right femur, initial encounter',cat:'Trauma'},
  {code:'T14.90',name:'Injury, unspecified',cat:'Trauma'},
  {code:'T07',name:'Unspecified multiple injuries',cat:'Trauma'},
  {code:'S00.01XA',name:'Unspecified superficial injury of scalp, initial encounter',cat:'Trauma'},
  // Symptoms/Signs
  {code:'R00.0',name:'Tachycardia, unspecified',cat:'Symptoms'},
  {code:'R00.1',name:'Bradycardia, unspecified',cat:'Symptoms'},
  {code:'R05.9',name:'Cough, unspecified',cat:'Symptoms'},
  {code:'R06.00',name:'Dyspnea, unspecified',cat:'Symptoms'},
  {code:'R06.09',name:'Other forms of dyspnea',cat:'Symptoms'},
  {code:'R07.9',name:'Chest pain, unspecified',cat:'Symptoms'},
  {code:'R07.4',name:'Chest pain on breathing',cat:'Symptoms'},
  {code:'R09.02',name:'Hypoxemia',cat:'Symptoms'},
  {code:'R10.9',name:'Unspecified abdominal pain',cat:'Symptoms'},
  {code:'R10.0',name:'Acute abdomen',cat:'Symptoms'},
  {code:'R11.0',name:'Nausea',cat:'Symptoms'},
  {code:'R11.10',name:'Vomiting, unspecified',cat:'Symptoms'},
  {code:'R17',name:'Unspecified jaundice',cat:'Symptoms'},
  {code:'R19.7',name:'Diarrhea, unspecified',cat:'Symptoms'},
  {code:'R20.2',name:'Paraesthesia of skin',cat:'Symptoms'},
  {code:'R41.3',name:'Other amnesia',cat:'Symptoms'},
  {code:'R50.9',name:'Fever, unspecified',cat:'Symptoms'},
  {code:'R53.83',name:'Other fatigue',cat:'Symptoms'},
  {code:'R56.9',name:'Unspecified convulsions',cat:'Symptoms'},
  {code:'R57.0',name:'Cardiogenic shock',cat:'Symptoms'},
  {code:'R57.9',name:'Shock, unspecified',cat:'Symptoms'},
  {code:'R73.09',name:'Other abnormal glucose',cat:'Symptoms'},
  {code:'R79.89',name:'Other specified abnormal findings of blood chemistry',cat:'Symptoms'},
  // Dermatology
  {code:'L20.9',name:'Atopic dermatitis, unspecified',cat:'Dermatology'},
  {code:'L50.9',name:'Urticaria, unspecified',cat:'Dermatology'},
  {code:'L60.0',name:'Ingrowing nail',cat:'Dermatology'},
  {code:'L89.90',name:'Pressure ulcer of unspecified site, unspecified stage',cat:'Dermatology'},
  {code:'B02.9',name:'Zoster without complications (shingles)',cat:'Dermatology'},
  // OB/GYN
  {code:'N94.6',name:'Dysmenorrhoea, unspecified',cat:'OB/GYN'},
  {code:'N83.20',name:'Unspecified ovarian cyst',cat:'OB/GYN'},
  {code:'N92.0',name:'Excessive and frequent menstruation with regular cycle',cat:'OB/GYN'},
  {code:'O20.0',name:'Threatened abortion',cat:'OB/GYN'},
  {code:'O80',name:'Encounter for full-term uncomplicated delivery',cat:'OB/GYN'},
];

// ─── ICD-10 AUTOCOMPLETE ENGINE ───────────────────────────────────────────────
let icdTimers = {};
let icdSelected = {};
let icdFocusIdx = {};

function icdSearch(id, query) {
  clearTimeout(icdTimers[id]);
  const dropdown = document.getElementById('icd-' + id + '-dropdown');
  if (!query || query.length < 2) { dropdown.style.display = 'none'; return; }
  icdTimers[id] = setTimeout(() => {
    const q = query.toLowerCase();
    // Try open API first, fall back to internal DB
    fetch('https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?terms=' + encodeURIComponent(query) + '&maxList=8&sf=code,name')
      .then(r => r.json())
      .then(data => {
        // API returns [totalCount, codes, extra, displayStrings]
        const items = (data[3] || []).map((d,i) => ({ code: d[0], name: d[1] }));
        renderDropdown(id, items.length ? items : searchInternalDB(q));
      })
      .catch(() => renderDropdown(id, searchInternalDB(q)));
  }, 180);
}

function searchInternalDB(q) {
  return ICD10_DB.filter(item =>
    item.name.toLowerCase().includes(q) ||
    item.code.toLowerCase().includes(q) ||
    (item.cat && item.cat.toLowerCase().includes(q))
  ).slice(0, 10);
}

function renderDropdown(id, items) {
  const dropdown = document.getElementById('icd-' + id + '-dropdown');
  if (!items.length) {
    dropdown.innerHTML = '<div class="icd-no-results">No matches found. Try a different term.</div>';
    dropdown.style.display = 'block';
    return;
  }
  icdFocusIdx[id] = -1;
  dropdown.innerHTML = '<div class="icd-dropdown-header">ICD-10 Results — click to auto-fill</div>' +
    items.map((item, i) =>
      '<div class="icd-item" data-idx="' + i + '" data-code="' + (item.code||'') + '" data-name="' + ((item.name||'').replace(/"/g,'&quot;')) + '" onmousedown="icdSelect(event,\'' + id + '\',\'' + (item.code||'').replace(/'/g,"\\'") + '\',\'' + ((item.name||'').replace(/'/g,"\\'").replace(/"/g,'&quot;')) + '\')">' +
        '<span class="icd-item-code">' + (item.code||'') + '</span>' +
        '<span class="icd-item-name">' + (item.name||item[1]||'') + '</span>' +
      '</div>'
    ).join('');
  dropdown.style.display = 'block';
}

function icdSelect(event, id, code, name) {
  event.preventDefault();
  // Fill the diagnosis text input with the full name
  const dxInput = document.getElementById('a-primary-dx');
  if (dxInput && !dxInput.value.trim()) dxInput.value = name;
  // Set the hidden ICD-10 code
  document.getElementById('a-icd10-' + id).value = code;
  // Update badge
  const badge = document.getElementById('icd-' + id + '-badge');
  badge.textContent = code;
  badge.classList.remove('empty');
  // Show clear button
  document.getElementById('icd-' + id + '-clear').style.display = 'inline-flex';
  // Hide dropdown
  document.getElementById('icd-' + id + '-dropdown').style.display = 'none';
  icdSelected[id] = { code, name };
  updateChip('A');
  toast('ICD-10 code ' + code + ' applied ✓', '#00d4bc');
}

function icdClear(id) {
  document.getElementById('a-icd10-' + id).value = '';
  const badge = document.getElementById('icd-' + id + '-badge');
  badge.textContent = 'No code'; badge.classList.add('empty');
  document.getElementById('icd-' + id + '-clear').style.display = 'none';
  icdSelected[id] = null;
}

function icdKeydown(e, id) {
  const dropdown = document.getElementById('icd-' + id + '-dropdown');
  if (dropdown.style.display === 'none') return;
  const items = dropdown.querySelectorAll('.icd-item');
  if (!items.length) return;
  if (e.key === 'ArrowDown') { e.preventDefault(); icdFocusIdx[id] = Math.min((icdFocusIdx[id]||0)+1, items.length-1); icdHighlight(id, items); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); icdFocusIdx[id] = Math.max((icdFocusIdx[id]||0)-1, 0); icdHighlight(id, items); }
  else if (e.key === 'Enter' && icdFocusIdx[id] >= 0) { e.preventDefault(); const item = items[icdFocusIdx[id]]; icdSelect(e, id, item.dataset.code, item.dataset.name); }
  else if (e.key === 'Escape') { dropdown.style.display = 'none'; }
}

function icdHighlight(id, items) {
  items.forEach((el,i) => el.classList.toggle('active', i === icdFocusIdx[id]));
  if (icdFocusIdx[id] >= 0) items[icdFocusIdx[id]].scrollIntoView({block:'nearest'});
}

// Close dropdown on outside click
document.addEventListener('click', e => {
  if (!e.target.closest('.icd-wrap')) {
    document.querySelectorAll('.icd-dropdown').forEach(d => d.style.display = 'none');
  }
});
<\/script>
</body>
</html>`;

  return (
    <iframe
      srcDoc={html}
      style={{ width: "100%", height: "100vh", border: "none", display: "block" }}
      title="SOAP Note Compiler"
    />
  );
}