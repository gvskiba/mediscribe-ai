import { useState, useEffect } from 'react';

const FAVORITES_KEY = 'notrya_favorite_hubs';
const NOTIFICATIONS_KEY = 'notrya_favorite_notifications';

export function useFavorites() {
  const [favorites, setFavorites] = useState([]);
  const [notifications, setNotifications] = useState({});
  const [loaded, setLoaded] = useState(false);

  // Load favorites and notification preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem(FAVORITES_KEY);
      const savedNotifications = localStorage.getItem(NOTIFICATIONS_KEY);
      setFavorites(savedFavorites ? JSON.parse(savedFavorites) : []);
      setNotifications(savedNotifications ? JSON.parse(savedNotifications) : {});
    } catch (e) {
      console.error('Failed to load favorites/notifications:', e);
    }
    setLoaded(true);
  }, []);

  // Persist to localStorage whenever favorites or notifications change
  useEffect(() => {
    if (loaded) {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
  }, [favorites, loaded]);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
    }
  }, [notifications, loaded]);

  const isFavorite = (route) => favorites.includes(route);

  const toggleFavorite = (route) => {
    setFavorites(prev =>
      prev.includes(route)
        ? prev.filter(r => r !== route)
        : [...prev, route]
    );
  };

  const removeFavorite = (route) => {
    setFavorites(prev => prev.filter(r => r !== route));
    setNotifications(prev => {
      const updated = { ...prev };
      delete updated[route];
      return updated;
    });
  };

  const toggleNotification = (route) => {
    setNotifications(prev => ({
      ...prev,
      [route]: !prev[route],
    }));
  };

  const isNotificationEnabled = (route) => notifications[route] === true;

  return { 
    favorites, 
    isFavorite, 
    toggleFavorite, 
    removeFavorite, 
    notifications,
    toggleNotification,
    isNotificationEnabled,
    loaded 
  };
}