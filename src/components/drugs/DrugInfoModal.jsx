import { useState } from 'react';

const T = {
  txt: '#f2f7ff', txt2: '#b8d4f0', txt3: '#82aece', txt4: '#5a82a8',
  bg: '#050f1e', panel: '#081628',
  teal: '#00e5c0', blue: '#3b9eff', green: '#3dffa0', orange: '#ff9f43',
  red: '#ff3d3d', gold: '#f5c842',
};

export default function DrugInfoModal({ drug, onClose }) {
  if (!drug) return null;

  const renderRenalTiers = () => {
    if (!drug.renal_tiers_json) return null;
    try {
      const tiers = JSON.parse(drug.renal_tiers_json);
      return (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.txt, marginBottom: 6 }}>
            Renal Dosing
          </div>
          <div style={{ fontSize: 9, color: T.txt3, fontFamily: "'JetBrains Mono', monospace" }}>
            {tiers.map((tier, i) => (
              <div key={i} style={{ marginBottom: 4 }}>
                <span style={{ color: tier[2] === 'ok' ? T.teal : tier[2] === 'caution' ? T.orange : T.red }}>
                  {tier[0]}:
                </span>{' '}
                {tier[1]}
              </div>
            ))}
          </div>
        </div>
      );
    } catch {
      return null;
    }
  };

  const renderDripInfo = () => {
    if (!drug.is_drip) return null;
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.txt, marginBottom: 6 }}>
          Drip Range
        </div>
        <div style={{ fontSize: 10, color: T.txt2, fontFamily: "'JetBrains Mono', monospace" }}>
          {drug.drip_lo} – {drug.drip_hi} {drug.drip_unit || 'mcg/kg/min'}
        </div>
        {drug.drip_note && (
          <div style={{ fontSize: 9, color: T.txt4, marginTop: 4 }}>{drug.drip_note}</div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: T.panel,
          border: `1px solid rgba(59,158,255,0.25)`,
          borderRadius: 12,
          padding: 20,
          maxWidth: 480,
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.txt, marginBottom: 2 }}>
              {drug.name}
            </div>
            {drug.generic_name && (
              <div style={{ fontSize: 11, color: T.txt4 }}>
                {drug.generic_name}
              </div>
            )}
            {drug.badge && (
              <div style={{ fontSize: 8, color: T.blue, fontWeight: 700, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
                {drug.badge}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: T.txt4,
              fontSize: 20,
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        {/* Standard Dose */}
        {drug.standard_dose && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.txt, marginBottom: 6 }}>
              Standard Dose
            </div>
            <div
              style={{
                fontSize: 10,
                color: T.txt2,
                fontFamily: "'JetBrains Mono', monospace",
                padding: 8,
                background: 'rgba(59,158,255,0.08)',
                borderRadius: 6,
                border: '1px solid rgba(59,158,255,0.2)',
              }}
            >
              {drug.standard_dose}
            </div>
          </div>
        )}

        {/* Weight-based */}
        {drug.weight_based && drug.wt_dpkg && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.txt, marginBottom: 6 }}>
              Weight-Based Dosing
            </div>
            <div style={{ fontSize: 10, color: T.txt2, fontFamily: "'JetBrains Mono', monospace" }}>
              <div>{drug.wt_dpkg} {drug.wt_unit}/kg {drug.wt_route}</div>
              {drug.wt_max && (
                <div style={{ color: T.orange, marginTop: 4 }}>Max: {drug.wt_max} {drug.wt_unit}</div>
              )}
              {drug.wt_note && (
                <div style={{ fontSize: 9, color: T.txt4, marginTop: 4 }}>{drug.wt_note}</div>
              )}
            </div>
          </div>
        )}

        {/* Drip */}
        {renderDripInfo()}

        {/* Renal */}
        {renderRenalTiers()}

        {/* Category */}
        {drug.category && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, color: T.txt4, fontFamily: "'JetBrains Mono', monospace" }}>
              Category: {drug.category}
            </div>
          </div>
        )}

        {/* Contraindications */}
        {drug.contraindications && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.red, marginBottom: 6 }}>
              Contraindications
            </div>
            <div style={{ fontSize: 9, color: T.txt3 }}>{drug.contraindications}</div>
          </div>
        )}

        {/* Monitoring */}
        {drug.monitoring && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.txt, marginBottom: 6 }}>
              Monitoring
            </div>
            <div style={{ fontSize: 9, color: T.txt3 }}>{drug.monitoring}</div>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: 10,
            borderRadius: 8,
            border: `1px solid rgba(59,158,255,0.3)`,
            background: 'rgba(59,158,255,0.1)',
            color: T.blue,
            fontWeight: 700,
            fontSize: 11,
            cursor: 'pointer',
            marginTop: 12,
            transition: 'background .15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,158,255,0.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(59,158,255,0.1)')}
        >
          Close
        </button>
      </div>
    </div>
  );
}