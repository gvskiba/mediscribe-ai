import { useState } from 'react';
import { X, Bell, Clock, Trash2 } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { HUBS } from '@/lib/hubRegistry';
import { notificationService } from '@/lib/notificationService';

export default function NotificationManager({ isOpen, onClose }) {
  const { favorites, toggleNotification, isNotificationEnabled } = useFavorites();
  const [showHistory, setShowHistory] = useState(false);

  if (!isOpen) return null;

  const favoriteHubs = favorites
    .map(route => HUBS.find(h => h.route === route))
    .filter(Boolean);

  const getLastNotificationTime = (route) => {
    const timestamp = notificationService.getLastNotificationTime(route);
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0a1628',
          border: '1px solid rgba(0, 212, 184, 0.2)',
          borderRadius: 12,
          padding: '20px',
          maxWidth: 500,
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={18} style={{ color: '#00d4b8' }} />
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f0f4f8' }}>
              Guideline Alerts
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 16,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: 12,
          }}
        >
          <button
            onClick={() => setShowHistory(false)}
            style={{
              padding: '6px 12px',
              border: 'none',
              borderBottom: showHistory ? 'none' : '2px solid #00d4b8',
              background: 'transparent',
              color: showHistory ? 'rgba(255, 255, 255, 0.5)' : '#00d4b8',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              transition: 'all 0.15s',
            }}
          >
            Settings
          </button>
          <button
            onClick={() => setShowHistory(true)}
            style={{
              padding: '6px 12px',
              border: 'none',
              borderBottom: showHistory ? '2px solid #00d4b8' : 'none',
              background: 'transparent',
              color: showHistory ? '#00d4b8' : 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              transition: 'all 0.15s',
            }}
          >
            History
          </button>
        </div>

        {/* Settings Tab */}
        {!showHistory && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {favoriteHubs.length === 0 ? (
              <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 13, textAlign: 'center' }}>
                No favorited hubs yet. Add favorites to enable alerts.
              </p>
            ) : (
              favoriteHubs.map(hub => {
                const enabled = isNotificationEnabled(hub.route);
                return (
                  <div
                    key={hub.route}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: 'rgba(0, 212, 184, 0.05)',
                      border: `1px solid ${
                        enabled ? 'rgba(0, 212, 184, 0.3)' : 'rgba(255, 255, 255, 0.1)'
                      }`,
                      borderRadius: 8,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#f0f4f8',
                          marginBottom: 2,
                        }}
                      >
                        {hub.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.4)' }}>
                        {enabled ? 'Alerts enabled' : 'Alerts disabled'}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleNotification(hub.route)}
                      style={{
                        padding: '6px 12px',
                        border: `1px solid ${enabled ? '#00d4b8' : 'rgba(255, 255, 255, 0.2)'}`,
                        background: enabled ? 'rgba(0, 212, 184, 0.1)' : 'transparent',
                        color: enabled ? '#00d4b8' : 'rgba(255, 255, 255, 0.5)',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 600,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#00d4b8';
                        e.currentTarget.style.color = '#00d4b8';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = enabled
                          ? '#00d4b8'
                          : 'rgba(255, 255, 255, 0.2)';
                        e.currentTarget.style.color = enabled
                          ? '#00d4b8'
                          : 'rgba(255, 255, 255, 0.5)';
                      }}
                    >
                      {enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* History Tab */}
        {showHistory && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {favoriteHubs.length === 0 ? (
              <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 13, textAlign: 'center' }}>
                No history yet.
              </p>
            ) : (
              favoriteHubs.map(hub => {
                const lastTime = getLastNotificationTime(hub.route);
                return (
                  <div
                    key={hub.route}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#f0f4f8' }}>
                        {hub.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'rgba(255, 255, 255, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          marginTop: 2,
                        }}
                      >
                        <Clock size={12} />
                        {lastTime}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        notificationService.clearNotificationHistory(hub.route)
                      }
                      style={{
                        padding: '4px 8px',
                        border: 'none',
                        background: 'transparent',
                        color: 'rgba(255, 255, 255, 0.4)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#ff6b6b';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)';
                      }}
                      title='Clear history'
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Footer Note */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: 11,
            color: 'rgba(255, 255, 255, 0.4)',
            lineHeight: 1.5,
          }}
        >
          Browser notifications must be enabled in your settings. Alerts trigger when guidelines
          update for your favorited protocols.
        </div>
      </div>
    </div>
  );
}