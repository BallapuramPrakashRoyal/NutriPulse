import React, { useState, useEffect } from 'react';
import { Utensils } from 'lucide-react';

export const FALLBACK_FOOD_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

export default function FoodImage({ src, alt, className = '' }) {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK_FOOD_IMAGE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setImgSrc(src || FALLBACK_FOOD_IMAGE);
    setLoaded(false);
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-slate-900 ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 animate-pulse flex items-center justify-center">
          <Utensils className="w-4 h-4 text-slate-600 opacity-50" />
        </div>
      )}
      <img
        src={imgSrc}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (imgSrc !== FALLBACK_FOOD_IMAGE) setImgSrc(FALLBACK_FOOD_IMAGE);
          setLoaded(true);
        }}
        className={`w-full h-full object-cover transition-all duration-500 ${
          loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
        }`}
      />
    </div>
  );
}
