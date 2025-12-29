/**
 * Componente para mostrar las selecciones de un participante
 */

import React from 'react';

interface SeleccionParticipante {
  id: string;
  nombreParticipante: string;
  seleccionesNaipes: Record<string, string>; // etiquetaId -> naipeId
  seleccionesEtiquetas: Record<string, string>; // etiquetaId -> etiquetaNombre
  ordenEtiquetas: string[];
  finalizado: boolean;
}

interface ParticipanteSeleccionCardProps {
  seleccion: SeleccionParticipante;
  etiquetas: Array<{ id: string; nombre: string }>;
  naipes: Array<{ id: string; nombre: string }>;
}

const ParticipanteSeleccionCard: React.FC<ParticipanteSeleccionCardProps> = ({
  seleccion,
  etiquetas,
  naipes
}) => {
  // Obtener naipes por ID
  const getNaipeNombre = (naipeId: string): string => {
    const naipe = naipes.find(n => n.id === naipeId);
    return naipe ? naipe.nombre : naipeId;
  };

  // Obtener imagen del naipe
  const getNaipeImagen = (naipeId: string): string => {
    return `/images/naipes/${naipeId}.png`;
  };

  // Ordenar etiquetas según el orden del participante
  const etiquetasOrdenadas = seleccion.ordenEtiquetas.length > 0
    ? seleccion.ordenEtiquetas.filter(etiquetaId => seleccion.seleccionesNaipes[etiquetaId])
    : Object.keys(seleccion.seleccionesNaipes);

  const totalEtiquetas = etiquetas.length;
  const seleccionesCompletadas = Object.keys(seleccion.seleccionesNaipes).length;
  const porcentajeCompletado = totalEtiquetas > 0
    ? Math.round((seleccionesCompletadas / totalEtiquetas) * 100)
    : 0;

  return (
    <div className="bg-gray-50 border border-gray-300 rounded-xl p-4 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {seleccion.nombreParticipante || 'Participante sin nombre'}
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${porcentajeCompletado}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-600">
              {seleccionesCompletadas} / {totalEtiquetas}
            </span>
          </div>
        </div>
        {seleccion.finalizado && (
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            ✓ Finalizado
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {etiquetasOrdenadas.map((etiquetaId) => {
          const naipeId = seleccion.seleccionesNaipes[etiquetaId];
          if (!naipeId) return null;
          
          const etiquetaNombre = seleccion.seleccionesEtiquetas[etiquetaId] || etiquetas.find((e) => e.id === etiquetaId)?.nombre || etiquetaId;
          const naipeNombre = getNaipeNombre(naipeId);

          return (
            <div
              key={etiquetaId}
              className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2 shadow-sm"
            >
              <div className="flex-shrink-0">
                <img
                  src={getNaipeImagen(naipeId)}
                  alt={naipeNombre}
                  className="w-12 h-16 object-contain"
                  onError={(e) => {
                    // Fallback si la imagen no existe
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 truncate">{etiquetaNombre}</p>
                <p className="text-sm font-medium text-gray-900 truncate">{naipeNombre}</p>
              </div>
            </div>
          );
        })}
      </div>

      {etiquetasOrdenadas.length === 0 && (
        <p className="text-sm text-gray-500 italic">Aún no ha realizado selecciones</p>
      )}
    </div>
  );
};

export default ParticipanteSeleccionCard;











