import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

const CAT_COLORS = {
  scoring:   '#A78BFA',
  criteria:  '#34D399',
  checklist: '#F59E0B',
  threshold: '#12CCE6',
  formula:   '#FB923C',
};

export default function GuidelineSuggestionStrip({ diagnoses, assessment, chiefComplaint, rawNote, noteId }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(new Set());
  const debounceRef = useRef(null);

  useEffect(() => {
    const hasContent = (diagnoses?.length > 0) || assessment || chiefComplaint || rawNote;
    if (!hasContent && !noteId) { setSuggestions([]); return; }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await base44.functions.invoke('suggestClinicalGuidelines', {
          diagnoses,
          assessment,
          chief_complaint: chiefComplaint,
          raw_note: rawNote,
          noteId,
        });
        setSuggestions(res.data?.suggestions || []);
      } catch (_) {
        // silent fail — suggestions are advisory only
      } finally {
        setLoading(false);
      }
    }, 800);

    return () => clearTimeout(debounceRef.current);
  }, [
    JSON.stringify(diagnoses),
    assessment,
    chiefComplaint,
    rawNote,
    noteId,
  ]);

  const visible = suggestions.filter(s => !dismissed.has(s.id));
  if (!loading && visible.length === 0) return null;

  return (
    <div style={{
      background: 'rgba(167,139,250,0.05)',
      border: '1px solid rgba(167,139,250,0.25)',
      borderRadius: 10,
      padding: '10px 14px',
      marginBottom: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.8)', fontFamily: 'monospace' }}>
          CommandKit Suggestions
        </span>
        {loading && (
          <span style={{ fontSize: 9, color: 'rgba(167,139,250,0.5)', fontFamily: 'monospace' }}>scanning…</span>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {visible.map(s => {
          const color = CAT_COLORS[s.category] || '#A78BFA';
          return (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: color + '12', border: '1px solid ' + color + '40',
              borderRadius: 7, padding: '5px 10px',
              cursor: s.hubLink ? 'pointer' : 'default',
            }}
              onClick={() => s.hubLink && (window.location.href = '/' + s.hubLink)}
              title={s.clinicalUse}
            >
              <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 600, color }}>{s.name}</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                {s.hubLink ? '→' : ''}
              </span>
              <button
                onClick={e => { e.stopPropagation(); setDismissed(p => new Set([...p, s.id])); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', fontSize: 10, lineHeight: 1, padding: 0, marginLeft: 2 }}
                title="Dismiss"
              >×</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}