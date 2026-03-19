import React from "react";
import { VITAL_DEFS } from "./npiData";

function getVitalStatus(id, vitals) {
  const def = VITAL_DEFS.find(v => v.id === id);
  if (!def) return '';
  const val = parseFloat(vitals[id]);
  if (isNaN(val)) return '';
  if (def.hi !== null && val > def.hi) return 'abn';
  if (def.lo !== null && val < def.lo) return 'lo';
  return 'ok';
}

export default function VitalsTab({ vitals, setVitals, avpu, setAvpu, o2del, setO2del, pain, setPain, triage, setTriage }) {
  return (
    <div>
      <div className="npi-sec-title">📊 Vital Signs</div>
      <div className="npi-sec-sub">Enter available vitals — abnormal values flag automatically (red = high, blue = low)</div>
      <div className="npi-vitals-grid">
        {VITAL_DEFS.map(v => {
          const status = getVitalStatus(v.id, vitals);
          return (
            <div key={v.id} className={`npi-vit-field${status === 'abn' ? ' abn-field' : status === 'lo' ? ' lo-field' : ''}`}>
              <div className={`npi-vit-status${status ? ' ' + status : ''}`} />
              <div className="npi-vit-icon">{v.icon}</div>
              <div className="npi-vit-label-txt">{v.label}</div>
              <input className="npi-vit-input" type={v.isText ? 'text' : 'number'} value={vitals[v.id] || ''} onChange={e => setVitals(p => ({ ...p, [v.id]: e.target.value }))} placeholder={v.ph} />
              <div className="npi-vit-unit">{v.unit}</div>
            </div>
          );
        })}
      </div>
      <div className="npi-hdiv" />
      <div className="npi-grid-3">
        <div className="npi-field"><div className="npi-label">AVPU</div>
          <select className="npi-select" value={avpu} onChange={e => setAvpu(e.target.value)}>
            <option value="">—</option>
            {['A — Alert', 'V — Voice', 'P — Pain', 'U — Unresponsive'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="npi-field"><div className="npi-label">Oxygen Delivery</div>
          <select className="npi-select" value={o2del} onChange={e => setO2del(e.target.value)}>
            <option value="">—</option>
            {['Room air', 'Nasal cannula 2L', 'Nasal cannula 4L', 'Simple face mask', 'Non-rebreather mask 15L', 'High-flow nasal oxygen', 'BiPAP', 'Intubated / Ventilated'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="npi-field"><div className="npi-label">Pain Score (0–10)</div><input className="npi-input" style={{ fontFamily: "'JetBrains Mono',monospace" }} type="number" min="0" max="10" value={pain} onChange={e => setPain(e.target.value)} placeholder="0–10" /></div>
      </div>
      <div className="npi-field" style={{ maxWidth: 300 }}>
        <div className="npi-label">Triage / Acuity</div>
        <select className="npi-select" value={triage} onChange={e => setTriage(e.target.value)}>
          <option value="">— Select —</option>
          {['ESI 1 / ATS 1 — Immediate', 'ESI 2 / ATS 2 — Emergent', 'ESI 3 / ATS 3 — Urgent', 'ESI 4 / ATS 4 — Semi-Urgent', 'ESI 5 / ATS 5 — Non-Urgent'].map(o => <option key={o}>{o}</option>)}
        </select>
      </div>
    </div>
  );
}