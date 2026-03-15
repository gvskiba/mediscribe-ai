import { useState } from "react";

export default function DrugInteractionChecker({ selectedMeds, medications }) {
  if (selectedMeds.length < 2) return null;

  // Find all interactions between selected medications
  const interactions = [];
  const selectedIds = new Set(selectedMeds.map(m => m.id));

  selectedMeds.forEach((med, idx) => {
    if (!med.interactions) return;
    
    // Parse interactions - could be array or string
    const interactionList = Array.isArray(med.interactions) ? med.interactions : 
                           typeof med.interactions === 'string' ? med.interactions.split(',').map(s => s.trim()) : [];
    
    interactionList.forEach(interaction => {
      // Check if this interaction involves another selected medication
      const conflictingMed = selectedMeds.find(m => 
        m.id !== med.id && (
          m.name.toLowerCase().includes(interaction.toLowerCase()) ||
          m.drugClass.toLowerCase().includes(interaction.toLowerCase()) ||
          interaction.toLowerCase().includes(m.name.toLowerCase())
        )
      );

      if (conflictingMed) {
        const key = [med.id, conflictingMed.id].sort().join('-');
        if (!interactions.find(i => i.key === key)) {
          interactions.push({
            key,
            med1: med,
            med2: conflictingMed,
            interaction: interaction,
            severity: interaction.toLowerCase().includes('major') ? 'major' : 
                     interaction.toLowerCase().includes('moderate') ? 'moderate' : 'minor'
          });
        }
      }
    });
  });

  const severityColors = {
    major: { bg: '#ef4444', bgLight: 'rgba(239,68,68,0.1)', text: '#ef4444' },
    moderate: { bg: '#f59e0b', bgLight: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
    minor: { bg: '#3b82f6', bgLight: 'rgba(59,130,246,0.1)', text: '#3b82f6' }
  };

  return (
    <div style={{
      background: 'var(--c1)',
      border: '1px solid var(--br)',
      borderRadius: 'var(--r2)',
      padding: '13px 15px',
      marginBottom: '16px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        paddingBottom: 12,
        borderBottom: '1px solid var(--br)'
      }}>
        <span style={{ fontSize: 16 }}>⚠️</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx)' }}>
            Drug-Drug Interactions ({interactions.length})
          </div>
          <div style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 1 }}>
            {selectedMeds.length} medications selected
          </div>
        </div>
      </div>

      {interactions.length === 0 ? (
        <div style={{ fontSize: 11, color: 'var(--tx2)' }}>✓ No major interactions detected</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {interactions.map(inter => {
            const colors = severityColors[inter.severity];
            return (
              <div key={inter.key} style={{
                background: colors.bgLight,
                border: `1px solid ${colors.bg}30`,
                borderRadius: 'var(--r)',
                padding: '8px 11px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10
              }}>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 3,
                  background: colors.bg,
                  color: '#fff',
                  textTransform: 'uppercase',
                  letterSpacing: '.04em',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  marginTop: 1
                }}>
                  {inter.severity}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx)' }}>
                    {inter.med1.name} ↔ {inter.med2.name}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--tx2)', marginTop: 2 }}>
                    {inter.interaction}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}