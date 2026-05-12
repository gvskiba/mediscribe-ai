import { Star } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';

export default function FavoriteButton({ route, size = 16 }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(route);

  return (
    <button
      onClick={() => toggleFavorite(route)}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        color: favorite ? '#fbbf24' : 'rgba(255, 255, 255, 0.4)',
        transition: 'color 0.15s',
      }}
      title={favorite ? 'Remove from favorites' : 'Add to favorites'}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = '#fbbf24';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = favorite ? '#fbbf24' : 'rgba(255, 255, 255, 0.4)';
      }}
    >
      <Star size={size} fill={favorite ? '#fbbf24' : 'none'} />
    </button>
  );
}