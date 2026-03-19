import React from "react";
import { PE_SYSTEMS } from "./npiData";

export default function PETab({ peState, setPeState, peFindings, setPeFindings }) {
  const setPE = (id, state) => {
    setPeState(prev => ({ ...prev, [id]: state }));
    if (state === 1) {
      const def = PE_SYSTEMS.find(s => s.id === id);
      if (def) setPeFindings(prev => ({ ...prev, [id]: def.normal }));
    }
  };
  const markAllPE = (state) => {
    const next = {};
    PE_SYSTEMS.forEach(s => { next[s.id] = state; });
    setPeState(next);
    if (state === 1) {
      const findings = {};
      PE_SYSTEMS.forEach(s => { findings[s.id] = s.normal; });
      setPeFindings(findings);
    }
  };

  return (
    <div>
      <div className="npi-sec-title">🩺 Physical Examination</div>
      <div className="npi-sec-sub">Tri-state toggle: click once = ✓ Normal · click again = ✗ Abnormal · click again = reset</div>
      <div className="npi-ros-toolbar">
        <button className="npi-ros-tool-btn teal" onClick={() => markAllPE(1)}>✓ Normal Exam (All Systems)</button>
        <button className="npi-ros-tool-btn red" onClick={() => markAllPE(0)}>↺ Reset Exam</button>
      </div>
      <div className="npi-pe-grid">
        {PE_SYSTEMS.map(s => {
          const state = peState[s.id] ?? 0;
          return (
            <div key={s.id} className={`npi-pe-card${state === 1 ? ' s1' : state === 2 ? ' s2' : ''}`}>
              <div className="npi-pe-card-header">
                <span className="npi-ros-icon">{s.icon}</span>
                <span className="npi-ros-sys-name">{s.name}</span>
                <div className="npi-ros-state-btns">
                  <button className={`npi-rsb norm${state === 1 ? ' active-btn' : ''}`} onClick={() => setPE(s.id, 1)}>✓</button>
                  <button className={`npi-rsb abn${state === 2 ? ' active-btn' : ''}`} onClick={() => setPE(s.id, 2)}>✗</button>
                  <button className={`npi-rsb na${state === 0 ? ' active-btn' : ''}`} onClick={() => setPE(s.id, 0)}>—</button>
                </div>
              </div>
              {state === 1 && <div className="npi-pe-normal-preview">{s.normal}</div>}
              {state === 2 && (
                <div className="npi-pe-findings-wrap open">
                  <textarea className="npi-pe-findings" value={peFindings[s.id] || s.normal} onChange={e => setPeFindings(p => ({ ...p, [s.id]: e.target.value }))} rows={3} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}