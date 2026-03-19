import React from "react";
import { CC_LIST } from "./npiData";
import { toast } from "sonner";

export default function CCTab({ cc, setCC, selectedCC, setSelectedCC }) {
  return (
    <div>
      <div className="npi-sec-title">🗣️ Chief Complaint</div>
      <div className="npi-sec-sub">Tap a quick complaint or type directly</div>
      <div className="npi-hint">💡 Selecting a chief complaint will highlight the most relevant ROS systems on the Review of Systems tab</div>
      <div className="npi-field" style={{ marginBottom: 12 }}>
        <div className="npi-label">Chief Complaint (free text)</div>
        <input className="npi-input" value={cc.text} onChange={e => setCC(p => ({ ...p, text: e.target.value }))} placeholder='e.g. "Chest pain for 2 hours, radiating to left arm"' />
      </div>
      <div className="npi-sec-sub" style={{ marginBottom: 7 }}>Quick select — tap to auto-fill:</div>
      <div className="npi-cc-grid">
        {CC_LIST.map((c, i) => (
          <button key={i} className={`npi-cc-btn${selectedCC === i ? ' selected' : ''}`} onClick={() => {
            setSelectedCC(i);
            setCC(p => ({ ...p, text: c.label }));
            toast.info(`ROS systems highlighted for "${c.label}"`);
          }}>
            <span className="npi-cc-icon">{c.icon}</span>
            <span className="npi-cc-label">{c.label}</span>
          </button>
        ))}
      </div>
      <div className="npi-hdiv" />
      <div className="npi-grid-2">
        <div className="npi-field"><div className="npi-label">Onset</div>
          <select className="npi-select" value={cc.onset} onChange={e => setCC(p => ({ ...p, onset: e.target.value }))}>
            <option value="">— Select —</option>
            {['Sudden', 'Gradual', 'Minutes ago', 'Hours ago', 'Days ago', 'Weeks ago', 'Months ago'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="npi-field"><div className="npi-label">Duration</div><input className="npi-input" value={cc.duration} onChange={e => setCC(p => ({ ...p, duration: e.target.value }))} placeholder='e.g. "2 hours", "3 days"' /></div>
      </div>
      <div className="npi-grid-2">
        <div className="npi-field"><div className="npi-label">Severity (0–10)</div><input className="npi-input" style={{ fontFamily: "'JetBrains Mono',monospace" }} type="number" min="0" max="10" value={cc.severity} onChange={e => setCC(p => ({ ...p, severity: e.target.value }))} placeholder="0–10" /></div>
        <div className="npi-field"><div className="npi-label">Character / Quality</div><input className="npi-input" value={cc.quality} onChange={e => setCC(p => ({ ...p, quality: e.target.value }))} placeholder='e.g. "crushing", "sharp", "burning"' /></div>
      </div>
      <div className="npi-grid-2">
        <div className="npi-field"><div className="npi-label">Radiation / Location</div><input className="npi-input" value={cc.radiation} onChange={e => setCC(p => ({ ...p, radiation: e.target.value }))} placeholder='e.g. "left arm, jaw"' /></div>
        <div className="npi-field"><div className="npi-label">Aggravating Factors</div><input className="npi-input" value={cc.aggravate} onChange={e => setCC(p => ({ ...p, aggravate: e.target.value }))} placeholder="What makes it worse?" /></div>
      </div>
      <div className="npi-grid-2">
        <div className="npi-field"><div className="npi-label">Relieving Factors</div><input className="npi-input" value={cc.relieve} onChange={e => setCC(p => ({ ...p, relieve: e.target.value }))} placeholder="What makes it better?" /></div>
        <div className="npi-field"><div className="npi-label">Associated Symptoms</div><input className="npi-input" value={cc.assoc} onChange={e => setCC(p => ({ ...p, assoc: e.target.value }))} placeholder="Other symptoms present" /></div>
      </div>
      <div className="npi-field"><div className="npi-label">HPI — History of Presenting Illness</div>
        <textarea className="npi-textarea" style={{ minHeight: 85 }} value={cc.hpi} onChange={e => setCC(p => ({ ...p, hpi: e.target.value }))} placeholder="Narrative history of presenting illness..." />
      </div>
    </div>
  );
}