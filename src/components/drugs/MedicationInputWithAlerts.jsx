import { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import MedicationInteractionAlert from './MedicationInteractionAlert';
import { useMedicationInteractionCheck } from '@/hooks/useMedicationInteractionCheck';

const T = {
  txt: '#f2f7ff',
  txt3: '#82aece',
  bg: '#050f1e',
  panel: '#081628',
  blue: '#3b9eff',
  border: '#1a2a42',
};

export default function MedicationInputWithAlerts({ 
  onAddMedication, 
  existingMedications = [],
  placeholder = "Enter medication name (e.g., vancomycin, fentanyl)"
}) {
  const [input, setInput] = useState('');
  const { alerts, checkInteractions, dismissAlert, clearAlerts } = useMedicationInteractionCheck();

  const handleInputChange = useCallback(
    (e) => {
      const value = e.target.value;
      setInput(value);
      
      // Check interactions in real-time as user types
      if (value.trim().length > 2) {
        checkInteractions(value, existingMedications);
      } else {
        clearAlerts();
      }
    },
    [existingMedications, checkInteractions, clearAlerts]
  );

  const handleAddMedication = useCallback(() => {
    if (!input.trim()) return;

    // Final interaction check before adding
    checkInteractions(input, existingMedications);

    // Call the parent handler
    if (onAddMedication) {
      onAddMedication(input.trim());
    }

    // Reset
    setInput('');
    clearAlerts();
  }, [input, existingMedications, checkInteractions, onAddMedication, clearAlerts]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMedication();
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Interaction Alerts */}
      {alerts.length > 0 && (
        <MedicationInteractionAlert 
          alerts={alerts} 
          onDismiss={dismissAlert}
        />
      )}

      {/* Input Field */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 8,
            border: `1px solid ${T.border}`,
            background: T.panel,
            color: T.txt,
            fontSize: 12,
            fontFamily: 'inherit',
            outline: 'none',
            transition: 'border-color .15s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = T.blue;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = T.border;
          }}
        />
        <button
          onClick={handleAddMedication}
          disabled={!input.trim()}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: `1px solid ${T.blue}`,
            background: `rgba(59, 158, 255, 0.1)`,
            color: T.blue,
            fontWeight: 700,
            fontSize: 11,
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            opacity: input.trim() ? 1 : 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all .15s',
          }}
          onMouseEnter={(e) => {
            if (input.trim()) {
              e.currentTarget.style.background = `rgba(59, 158, 255, 0.2)`;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `rgba(59, 158, 255, 0.1)`;
          }}
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {/* Existing Meds List */}
      {existingMedications.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 10, color: T.txt3, marginBottom: 8, fontWeight: 700 }}>
            CURRENT MEDICATIONS ({existingMedications.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {existingMedications.map((med, i) => (
              <div
                key={i}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  background: `rgba(59, 158, 255, 0.1)`,
                  border: `1px solid rgba(59, 158, 255, 0.25)`,
                  color: T.txt,
                  fontSize: 11,
                }}
              >
                {med}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}