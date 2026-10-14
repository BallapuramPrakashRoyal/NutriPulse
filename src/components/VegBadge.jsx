import React from 'react';

export default function VegBadge({ veg, size = 'sm' }) {
  const boxSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <span
      title={veg ? '100% Vegetarian (FSSAI Certified Symbol)' : 'Non-Vegetarian (FSSAI Certified Symbol)'}
      className={`inline-flex items-center justify-center rounded-[3px] border bg-slate-950/95 backdrop-blur-md shrink-0 ${boxSize} ${
        veg ? 'border-emerald-500' : 'border-rose-500'
      }`}
    >
      {veg ? (
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
      ) : (
        <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 fill-rose-500">
          <polygon points="6,2 10.5,10 1.5,10" />
        </svg>
      )}
    </span>
  );
}
