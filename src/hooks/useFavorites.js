import { useState, useEffect } from 'react';

const FAVORITES_KEY = 'notrya_favorite_hubs';

export function useFavorites() {
  const [favorites, setFavorites] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      setFavorites(saved ? JSON.parse(saved) : []);
    } catch (e) {
      console.error('Failed to load favorites:', e);
    }
    setLoaded(true);
  }, []);

  // Persist to localStorage whenever favorites change
  useEffect(() => {
    if (loaded) {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
  }, [favorites, loaded]);

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
  };

  return { favorites, isFavorite, toggleFavorite, removeFavorite, loaded };
}