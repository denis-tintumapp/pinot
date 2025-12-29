/**
 * Componente de tarjeta de naipe
 * Muestra un naipe con su imagen y permite drag & drop
 */

import React from 'react';
import { useDraggable } from '@dnd-kit/core';

interface NaipeCardProps {
  naipeId: string;
  naipeNombre: string;
  isSelected?: boolean;
  isDisabled?: boolean;
}

const NaipeCard: React.FC<NaipeCardProps> = ({ 
  naipeId, 
  naipeNombre, 
  isSelected = false,
  isDisabled = false 
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `naipe-${naipeId}`,
    data: {
      type: 'naipe',
      naipeId,
      naipeNombre,
    },
    disabled: isDisabled,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const imagenNaipe = `/images/naipes/${naipeId}.png`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        relative w-20 h-28 bg-white rounded-lg shadow-md cursor-grab active:cursor-grabbing
        transition-all duration-200 hover:shadow-lg hover:scale-105
        ${isDragging ? 'opacity-50 z-50' : ''}
        ${isSelected ? 'ring-2 ring-purple-500 ring-offset-2' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <img
        src={imagenNaipe}
        alt={naipeNombre}
        className="w-full h-full object-contain rounded-lg"
        onError={(e) => {
          // Fallback a SVG si la imagen no carga
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = document.createElement('div');
          fallback.className = 'w-full h-full flex items-center justify-center text-xs text-gray-600';
          fallback.textContent = naipeNombre;
          target.parentElement?.appendChild(fallback);
        }}
      />
      {isSelected && (
        <div className="absolute top-1 right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">✓</span>
        </div>
      )}
    </div>
  );
};

export default NaipeCard;











