import { AlertCircle, AlertTriangle, X } from 'lucide-react';

const T = {
  txt: '#f2f7ff',
  bg: '#050f1e',
  panel: '#081628',
  red: '#ff3d3d',
  orange: '#ff9f43',
  yellow: '#ffd93d',
};

export default function MedicationInteractionAlert({ alerts, onDismiss }) {
  if (!alerts || alerts.length === 0) return null;

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case 'critical':
        return {
          border: `1px solid ${T.red}`,
          background: `rgba(255, 61, 61, 0.08)`,
          icon: AlertCircle,
          color: T.red,
        };
      case 'warning':
      default:
        return {
          border: `1px solid ${T.orange}`,
          background: `rgba(255, 159, 67, 0.08)`,
          icon: AlertTriangle,
          color: T.orange,
        };
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        marginBottom: 16,
        maxHeight: '400px',
        overflowY: 'auto',
      }}
    >
      {alerts.map((alert) => {
        const styles = getSeverityStyles(alert.severity);
        const IconComponent = styles.icon;

        return (
          <div
            key={alert.id}
            style={{
              border: styles.border,
              background: styles.background,
              borderRadius: 8,
              padding: 12,
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
            }}
          >
            <IconComponent
              size={18}
              style={{
                color: styles.color,
                flexShrink: 0,
                marginTop: 2,
              }}
            />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: styles.color,
                  marginBottom: 4,
                }}
              >
                {alert.title}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: T.txt,
                  lineHeight: '1.4',
                  wordBreak: 'break-word',
                }}
              >
                {alert.description}
              </div>
              {alert.type === 'interaction' && (
                <div
                  style={{
                    fontSize: 10,
                    color: '#82aece',
                    marginTop: 6,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Conflict: {alert.existingDrug} ↔ {alert.newDrug}
                </div>
              )}
            </div>

            <button
              onClick={() => onDismiss(alert.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: T.txt,
                opacity: 0.6,
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}