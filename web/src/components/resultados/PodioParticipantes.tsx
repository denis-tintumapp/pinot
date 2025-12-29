/**
 * Componente para mostrar el podio de participantes
 */

import React from 'react';

interface ParticipantePodio {
  nombre: string;
  puntos: number;
  posicion?: number;
  posicionFinal?: number;
}

interface PodioParticipantesProps {
  podio: ParticipantePodio[];
}

const PodioParticipantes: React.FC<PodioParticipantesProps> = ({ podio }) => {
  if (podio.length === 0) {
    return null;
  }

  // Agrupar por posición
  const podioPorPosicion = {
    1: podio.filter(p => p.posicion === 1),
    2: podio.filter(p => p.posicion === 2),
    3: podio.filter(p => p.posicion === 3)
  };

  const hayEmpate =
    (podioPorPosicion[1] && podioPorPosicion[1].length > 1) ||
    (podioPorPosicion[2] && podioPorPosicion[2].length > 1) ||
    (podioPorPosicion[3] && podioPorPosicion[3].length > 1);

  const tienePosicion1 = podioPorPosicion[1] && podioPorPosicion[1].length > 0;
  const tienePosicion2 = podioPorPosicion[2] && podioPorPosicion[2].length > 0;
  const tienePosicion3 = podioPorPosicion[3] && podioPorPosicion[3].length > 0;

  const medallas = {
    oro: '🥇',
    plata: '🥈',
    bronce: '🥉'
  };

  const colores = {
    oro: { bg: '#fef9c3', border: '#facc15', text: '#854d0e' },
    plata: { bg: '#f3f4f6', border: '#9ca3af', text: '#1f2937' },
    bronce: { bg: '#fed7aa', border: '#fb923c', text: '#9a3412' }
  };

  const crearItemPodio = (participante: ParticipantePodio, posicion: number, tipoMedalla: 'oro' | 'plata' | 'bronce', esEmpate: boolean) => {
    const color = colores[tipoMedalla];
    return (
      <div
        key={`${participante.nombre}-${posicion}`}
        className="flex flex-col items-center"
        style={{ width: '100%', maxWidth: '200px' }}
      >
        <div className="text-6xl mb-2" style={{ height: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {medallas[tipoMedalla]}
        </div>
        <h3
          className="text-lg font-bold mb-1 text-center"
          style={{ color: color.text, wordBreak: 'break-word' }}
        >
          {participante.nombre}
        </h3>
        <div className="text-xl font-bold text-center" style={{ color: color.text }}>
          {participante.puntos} puntos
        </div>
        {esEmpate && (
          <div className="text-xs text-gray-600 mt-1">(Empate)</div>
        )}
      </div>
    );
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-center text-purple-700 mb-6">
        🏆 Podio de Participantes
      </h2>
      <div
        className={`flex items-center justify-center mb-6 flex-wrap ${hayEmpate ? 'flex-col' : 'flex-row'}`}
        style={{ width: '100%' }}
      >
        {hayEmpate ? (
          <>
            {tienePosicion1 && (
              <div className="flex flex-col items-center w-full max-w-xs my-2">
                {podioPorPosicion[1]
                  .sort((a, b) => b.puntos - a.puntos)
                  .map((p, idx) => (
                    <div key={idx} style={{ marginTop: idx > 0 ? '0.5rem' : '0' }}>
                      {crearItemPodio(p, 1, 'oro', podioPorPosicion[1].length > 1)}
                    </div>
                  ))}
              </div>
            )}
            {tienePosicion2 && (
              <div className="flex flex-col items-center w-full max-w-xs my-2">
                {podioPorPosicion[2]
                  .sort((a, b) => b.puntos - a.puntos)
                  .map((p, idx) => (
                    <div key={idx} style={{ marginTop: idx > 0 ? '0.5rem' : '0' }}>
                      {crearItemPodio(p, 2, 'plata', podioPorPosicion[2].length > 1)}
                    </div>
                  ))}
              </div>
            )}
            {tienePosicion3 && (
              <div className="flex flex-col items-center w-full max-w-xs my-2">
                {podioPorPosicion[3]
                  .sort((a, b) => b.puntos - a.puntos)
                  .map((p, idx) => (
                    <div key={idx} style={{ marginTop: idx > 0 ? '0.5rem' : '0' }}>
                      {crearItemPodio(p, 3, 'bronce', podioPorPosicion[3].length > 1)}
                    </div>
                  ))}
              </div>
            )}
          </>
        ) : (
          <>
            {tienePosicion1 && (
              <div className="flex flex-col items-center mx-2 min-w-[120px]">
                {crearItemPodio(podioPorPosicion[1][0], 1, 'oro', false)}
              </div>
            )}
            {tienePosicion2 && (
              <div className="flex flex-col items-center mx-2 min-w-[120px]">
                {crearItemPodio(podioPorPosicion[2][0], 2, 'plata', false)}
              </div>
            )}
            {tienePosicion3 && (
              <div className="flex flex-col items-center mx-2 min-w-[120px]">
                {crearItemPodio(podioPorPosicion[3][0], 3, 'bronce', false)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PodioParticipantes;











