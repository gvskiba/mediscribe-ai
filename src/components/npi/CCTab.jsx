import React from "react";
import { CC_LIST } from "./npiData";
import { toast } from "sonner";

const S = {
  bg: '#050f1e', panel: '#081628', up: '#0e2544',
  border: '#1a3555', borderHi: '#2a4f7a',
  blue: '#3b9eff', teal: '#00e5c0', gold: '#f5c842', coral: '#ff6b6b', orange: '#ff9f43',
  txt: '#e8f0fe', txt2: '#8aaccc', txt3: '#4a6a8a', txt4: '#2e4a6a',
};

const input = {
  width: '100%', background: S.up, border: `1px solid ${S.border}`,
  borderRadius: 6, padding: '7px 10px', color: S.txt, fontSize: 12,
  outline: 'none', fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box',
};

const label = {
  fontSize: 10, color: S.txt3, textTransform: 'uppercase',
  letterSpacing: '0.05em', fontWeight: 600, marginBottom: 5, display: 'block',
};

const card = {
  background: S.panel, border: `1px solid ${S.border}`,
  borderRadius: 12, padding: '16px 18px',
};

const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };

export default function CCTab({ cc, setCC, selectedCC, setSelectedCC }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>🗣️</span>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600, color: S.txt }}>Chief Complaint</div>
          <div style={{ fontSize: 12, color: S.txt3, marginTop: 1 }}>Select a quick complaint or type directly</div>
        </div>
      </div>

      {/* Free-text CC */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 16 }}>✏️</span>
          <div style={{ fontSize: 14, fontWeight: 600, color: S.txt }}>Chief Complaint</div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={label}>Free text</label>
          <input
            style={input}
            value={cc.text}
            onChange={e => setCC(p => ({ ...p, text: e.target.value }))}
            placeholder='e.g. "Chest pain for 2 hours, radiating to left arm"'
          />
        </div>
        <div style={{
          fontSize: 11, color: S.txt4, background: 'rgba(59,158,255,0.05)',
          border: `1px solid rgba(59,158,255,0.15)`, borderRadius: 6,
          padding: '6px 10px',
        }}>
          💡 Selecting a quick complaint will highlight the most relevant ROS systems on the Review of Systems tab
        </div>
      </div>

      {/* Quick Select Grid */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 16 }}>⚡</span>
          <div style={{ fontSize: 14, fontWeight: 600, color: S.txt }}>Quick Select</div>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: 8,
        }}>
          {CC_LIST.map((c, i) => (
            <button
              key={i}
              onClick={() => {
                setSelectedCC(i);
                setCC(p => ({ ...p, text: c.label }));
                toast.info(`ROS highlighted for "${c.label}"`);
              }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '10px 8px', borderRadius: 8, cursor: 'pointer',
                border: `1px solid ${selectedCC === i ? S.teal : S.border}`,
                background: selectedCC === i ? 'rgba(0,229,192,0.08)' : S.up,
                color: selectedCC === i ? S.teal : S.txt2,
                transition: 'all 0.15s', fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <span style={{ fontSize: 18 }}>{c.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 500, textAlign: 'center', lineHeight: 1.3 }}>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* OLDCARTS Details */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 16 }}>📋</span>
          <div style={{ fontSize: 14, fontWeight: 600, color: S.txt }}>OLDCARTS Details</div>
        </div>

        <div style={{ ...grid2, marginBottom: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={label}>Onset</label>
            <select style={{ ...input, cursor: 'pointer' }} value={cc.onset} onChange={e => setCC(p => ({ ...p, onset: e.target.value }))}>
              <option value="">— Select —</option>
              {['Sudden', 'Gradual', 'Minutes ago', 'Hours ago', 'Days ago', 'Weeks ago', 'Months ago'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={label}>Duration</label>
            <input style={input} value={cc.duration} onChange={e => setCC(p => ({ ...p, duration: e.target.value }))} placeholder='e.g. "2 hours", "3 days"' />
          </div>
        </div>

        <div style={{ ...grid2, marginBottom: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={label}>Severity (0–10)</label>
            <input style={{ ...input, fontFamily: "'JetBrains Mono',monospace" }} type="number" min="0" max="10" value={cc.severity} onChange={e => setCC(p => ({ ...p, severity: e.target.value }))} placeholder="0–10" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={label}>Character / Quality</label>
            <input style={input} value={cc.quality} onChange={e => setCC(p => ({ ...p, quality: e.target.value }))} placeholder='e.g. "crushing", "sharp", "burning"' />
          </div>
        </div>

        <div style={{ ...grid2, marginBottom: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={label}>Radiation / Location</label>
            <input style={input} value={cc.radiation} onChange={e => setCC(p => ({ ...p, radiation: e.target.value }))} placeholder='e.g. "left arm, jaw"' />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={label}>Aggravating Factors</label>
            <input style={input} value={cc.aggravate} onChange={e => setCC(p => ({ ...p, aggravate: e.target.value }))} placeholder="What makes it worse?" />
          </div>
        </div>

        <div style={{ ...grid2, marginBottom: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={label}>Relieving Factors</label>
            <input style={input} value={cc.relieve} onChange={e => setCC(p => ({ ...p, relieve: e.target.value }))} placeholder="What makes it better?" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={label}>Associated Symptoms</label>
            <input style={input} value={cc.assoc} onChange={e => setCC(p => ({ ...p, assoc: e.target.value }))} placeholder="Other symptoms present" />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={label}>HPI — History of Presenting Illness</label>
          <textarea
            style={{ ...input, minHeight: 85, resize: 'vertical' }}
            value={cc.hpi}
            onChange={e => setCC(p => ({ ...p, hpi: e.target.value }))}
            placeholder="Narrative history of presenting illness..."
          />
        </div>
      </div>

    </div>
  );
}