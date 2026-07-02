import React from 'react';

const CEFR_META = {
  A1: { name: 'Novice', color: '#4CAF50' },
  A2: { name: 'Amigo', color: '#2196F3' },
  B1: { name: 'Duro', color: '#8B5CF6' },
  B2: { name: 'Experto', color: '#F59E0B' },
  C1: { name: 'Maestro', color: '#E8634A' },
};

export default function CefrBadge({ level, size = 'sm', showName = true }) {
  const meta = CEFR_META[level] || CEFR_META.A1;
  const sizeClasses = size === 'lg'
    ? 'px-3 py-1.5 text-sm'
    : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold text-white ${sizeClasses}`}
      style={{ backgroundColor: meta.color }}
    >
      {level}
      {showName && <span className="opacity-90 font-medium">{meta.name}</span>}
    </span>
  );
}