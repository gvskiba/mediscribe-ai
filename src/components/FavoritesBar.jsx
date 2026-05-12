import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, X, ChevronDown, ChevronUp, Bell, BellOff } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { HUBS } from '@/lib/hubRegistry';

export default function FavoritesBar() {
  const navigate = useNavigate();
  const { favorites, removeFavorite, toggleNotification, isNotificationEnabled } = useFavorites();
  const [expanded, setExpanded] = useState(true);

  if (favorites.length === 0) return null;

  const favoriteHubs = favorites
    .map(route => HUBS.find(h => h.route === route))
    .filter(Boolean);

  return (
    <div style={{
      background: 'rgba(0, 212, 184, 0.05)',
      border: '1px solid rgba(0, 212, 184, 0.2)',
      borderRadius: 8,
      marginBottom: 12,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          padding: '10px 12px',
          background: 'transparent',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#00d4b8',
          fontWeight: 600,
          fontSize: 12,
          cursor: 'pointer',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Star size={14} fill='#00d4b8' />
          <span>Favorites ({favoriteHubs.length})</span>
        </div>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Content */}
      {expanded && (
        <div style={{
          borderTop: '1px solid rgba(0, 212, 184, 0.1)',
          padding: '6px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}>
          {favoriteHubs.map(hub => {
            const notifEnabled = isNotificationEnabled(hub.route);
            return (
              <div
                key={hub.route}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 10px',
                  gap: 8,
                  borderBottom: '1px solid rgba(0, 212, 184, 0.05)',
                }}
              >
                <button
                  onClick={() => navigate(hub.route)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    padding: '4px 6px',
                    color: 'rgba(226, 232, 244, 0.8)',
                    fontSize: 12,
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: 4,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 212, 184, 0.1)';
                    e.currentTarget.style.color = '#00d4b8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(226, 232, 244, 0.8)';
                  }}
                >
                  {hub.name}
                </button>

                {/* Notification toggle */}
                <button
                  onClick={() => toggleNotification(hub.route)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: notifEnabled ? '#00d4b8' : 'rgba(255, 255, 255, 0.3)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#00d4b8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = notifEnabled ? '#00d4b8' : 'rgba(255, 255, 255, 0.3)';
                  }}
                  title={notifEnabled ? 'Disable guideline alerts' : 'Enable guideline alerts'}
                >
                  {notifEnabled ? <Bell size={14} /> : <BellOff size={14} />}
                </button>

                <button
                  onClick={() => removeFavorite(hub.route)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.4)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title='Remove from favorites'
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}