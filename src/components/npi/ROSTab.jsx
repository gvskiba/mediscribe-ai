import React from "react";
import { ROS_SYSTEMS } from "./npiData";

export default function ROSTab({ rosState, setRosState, rosSymptoms, setRosSymptoms, rosNotes, setRosNotes }) {
  const setROS = (id, state) => setRosState(prev => ({ ...prev, [id]: state }));
  const cycleROS = (id) => { const cur = rosState[id] ?? 0; setROS(id, cur === 0 ? 1 : cur === 1 ? 2 : 0); };
  const toggleSym = (sysId, sym) => {
    setRosSymptoms(prev => {
      const arr = [...(prev[sysId] || [])];
      const i = arr.indexOf(sym);
      if (i === -1) arr.push(sym); else arr.splice(i, 1);
      return { ...prev, [sysId]: arr };
    });
  };
  const markAllROS = (state) => {
    const next = {};
    ROS_SYSTEMS.forEach(s => { next[s.id] = state; });
    setRosState(next);
  };

  return (
    <div>
      <div className="npi-sec-title">🔍 Review of Systems</div>
      <div className="npi-sec-sub">Tri-state toggle: click once = ✓ Normal · click again = ✗ Abnormal · click again = reset</div>
      <div className="npi-ros-toolbar">
        <button className="npi-ros-tool-btn teal" onClick={() => markAllROS(1)}>✓ All Systems Normal</button>
        <button className="npi-ros-tool-btn red" onClick={() => markAllROS(0)}>↺ Reset All</button>
      </div>
      <div className="npi-ros-grid">
        {ROS_SYSTEMS.map(s => {
          const state = rosState[s.id] ?? 0;
          const syms = rosSymptoms[s.id] || [];
          return (
            <div key={s.id} className={`npi-ros-card${state === 1 ? ' s1' : state === 2 ? ' s2' : ''}`} onClick={() => cycleROS(s.id)}>
              <div className="npi-ros-card-header">
                <span className="npi-ros-icon">{s.icon}</span>
                <span className="npi-ros-sys-name">{s.name}</span>
                <div className="npi-ros-state-btns" onClick={e => e.stopPropagation()}>
                  <button className={`npi-rsb norm${state === 1 ? ' active-btn' : ''}`} onClick={e => { e.stopPropagation(); setROS(s.id, 1); }} title="Normal">✓</button>
                  <button className={`npi-rsb abn${state === 2 ? ' active-btn' : ''}`} onClick={e => { e.stopPropagation(); setROS(s.id, 2); }} title="Abnormal">✗</button>
                  <button className={`npi-rsb na${state === 0 ? ' active-btn' : ''}`} onClick={e => { e.stopPropagation(); setROS(s.id, 0); }} title="Not assessed">—</button>
                </div>
              </div>
              {state === 1 && <div className="npi-ros-norm-text">No abnormalities reported in this system</div>}
              {state === 2 && (
                <>
                  <div className="npi-ros-symptoms" onClick={e => e.stopPropagation()}>
                    {s.syms.map(sym => (
                      <div key={sym} className={`npi-ros-sym-chip${syms.includes(sym) ? ' sel-sym' : ''}`} onClick={e => { e.stopPropagation(); toggleSym(s.id, sym); }}>{sym}</div>
                    ))}
                  </div>
                  <div className="npi-ros-abn-wrap open" onClick={e => e.stopPropagation()}>
                    <textarea className="npi-ros-abn-input" value={rosNotes[s.id] || ''} onChange={e => setRosNotes(p => ({ ...p, [s.id]: e.target.value }))} placeholder="Describe abnormal findings..." rows={2} />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}