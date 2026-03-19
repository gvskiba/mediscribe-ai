export default function MedicationCategoryFilter({ drugs, onFilterChange, selectedCategory }) {
  const CATEGORIES = {
    anticoag: { label: '🩸 Anticoagulants', color: '#ff6b6b' },
    cardiac: { label: '❤️ Cardiac', color: '#3b9eff' },
    psych: { label: '🧠 Psychiatry', color: '#9b6dff' },
    analgesic: { label: '💊 Analgesics', color: '#f5c842' },
    abx: { label: '🦠 Antibiotics', color: '#00e5c0' },
    gi: { label: '🤢 GI', color: '#ff9f43' },
    other: { label: '📋 Other', color: '#8aaccc' },
  };

  // Count drugs by category
  const categoryCounts = drugs.reduce((acc, drug) => {
    const cat = drug.category || 'other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ padding: '11px 12px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: 10, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8, fontWeight: 600 }}>
        💊 Filter by Category
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* All button */}
        <button
          onClick={() => onFilterChange(null)}
          style={{
            padding: '8px 11px',
            borderRadius: 8,
            border: selectedCategory === null ? '1.5px solid var(--teal)' : '1px solid var(--border)',
            background: selectedCategory === null ? 'rgba(0,229,192,.1)' : 'var(--bg-card)',
            color: selectedCategory === null ? 'var(--teal)' : 'var(--txt2)',
            fontSize: 12,
            fontWeight: selectedCategory === null ? 600 : 500,
            cursor: 'pointer',
            transition: 'all .15s',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>All Medications</span>
          <span style={{ fontSize: 10, fontFamily: 'monospace', opacity: 0.7 }}>{drugs.length}</span>
        </button>

        {/* Category buttons */}
        {Object.entries(CATEGORIES).map(([catKey, catInfo]) => {
          const count = categoryCounts[catKey] || 0;
          const isSelected = selectedCategory === catKey;
          return (
            <button
              key={catKey}
              onClick={() => onFilterChange(isSelected ? null : catKey)}
              style={{
                padding: '8px 11px',
                borderRadius: 8,
                border: isSelected ? `1.5px solid ${catInfo.color}` : '1px solid var(--border)',
                background: isSelected ? `rgba(${parseInt(catInfo.color.slice(1, 3), 16)},${parseInt(catInfo.color.slice(3, 5), 16)},${parseInt(catInfo.color.slice(5, 7), 16)},.1)` : 'var(--bg-card)',
                color: isSelected ? catInfo.color : 'var(--txt2)',
                fontSize: 12,
                fontWeight: isSelected ? 600 : 500,
                cursor: 'pointer',
                transition: 'all .15s',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>{catInfo.label}</span>
              {count > 0 && (
                <span style={{ fontSize: 10, fontFamily: 'monospace', opacity: 0.7 }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}