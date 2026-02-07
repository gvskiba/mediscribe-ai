import React, { useState } from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

export default function RatingComponent({ queryId, initialRating, onRate }) {
  const [rating, setRating] = useState(initialRating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleRate = async (value) => {
    setRating(value);
    if (onRate) {
      await onRate(queryId, value);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 font-medium">Rate this answer:</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <motion.button
            key={value}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleRate(value)}
            onMouseEnter={() => setHoveredRating(value)}
            onMouseLeave={() => setHoveredRating(0)}
            className="focus:outline-none"
          >
            <Star
              className={`w-4 h-4 transition-colors ${
                value <= (hoveredRating || rating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-300"
              }`}
            />
          </motion.button>
        ))}
      </div>
      {rating > 0 && (
        <span className="text-xs text-slate-400 ml-1">({rating}/5)</span>
      )}
    </div>
  );
}