/**
 * Componente de tarjeta de etiqueta
 * Muestra una etiqueta y permite drop de naipes
 */

import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface EtiquetaCardProps {
  etiquetaId: string;
  etiquetaNombre: string;
  naipeAsignado?: {
    naipeId: string;
    naipeNombre: string;
  } | null;
  orden?: number;
  onRemove?: () => void;
}

const EtiquetaCard: React.FC<EtiquetaCardProps> = ({
  etiquetaId,
  etiquetaNombre,
  naipeAsignado,
  orden,
  onRemove,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `etiqueta-${etiquetaId}`,
    data: {
      type: 'etiqueta',
      etiquetaId,
      etiquetaNombre,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        relative min-h-32 p-4 bg-white rounded-lg shadow-md border-2 border-dashed
        transition-all duration-200
        ${isOver ? 'border-purple-500 bg-purple-50 scale-105' : 'border-gray-300'}
        ${naipeAsignado ? 'border-solid border-purple-500 bg-purple-50' : ''}
      `}
    >
      {/* Orden/Posición */}
      {orden !== undefined && (
        <div className="absolute top-2 left-2 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
          {orden + 1}
        </div>
      )}

      {/* Nombre de la etiqueta */}
      <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center">
        {etiquetaNombre}
      </h3>

      {/* Naipe asignado */}
      {naipeAsignado ? (
        <div className="flex flex-col items-center justify-center">
          <img
            src={`/images/naipes/${naipeAsignado.naipeId}.png`}
            alt={naipeAsignado.naipeNombre}
            className="w-16 h-24 object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.className = 'w-16 h-24 flex items-center justify-center text-xs text-gray-600 bg-gray-100 rounded';
              fallback.textContent = naipeAsignado.naipeNombre;
              target.parentElement?.appendChild(fallback);
            }}
          />
          <p className="text-xs text-gray-600 mt-1">{naipeAsignado.naipeNombre}</p>
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="mt-2 px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
            >
              Quitar
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
          {isOver ? 'Suelta aquí' : 'Arrastra un naipe'}
        </div>
      )}
    </div>
  );
};

export default EtiquetaCard;











