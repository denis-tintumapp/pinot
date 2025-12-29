/**
 * Componente para la experiencia "carta por carta"
 * Muestra un naipe a la vez y permite seleccionar etiquetas
 */

import React, { useEffect } from 'react';
import { useExperienciaCartaPorCarta } from '../../hooks/useExperienciaCartaPorCarta';
import { ParticipacionState } from '../../hooks/useParticipacion';

interface CartaPorCartaViewProps {
  state: ParticipacionState;
  guardarSeleccionNaipe: (etiquetaId: string, naipeId: string) => Promise<void>;
  onFinalizar?: () => void;
}

const CartaPorCartaView: React.FC<CartaPorCartaViewProps> = ({
  state,
  guardarSeleccionNaipe,
  onFinalizar,
}) => {
  const {
    naipesOrdenados,
    indiceCartaActual,
    naipeActual,
    etiquetaConfirmada,
    etiquetaSeleccionadaTemporal,
    etiquetasDisponibles,
    etiquetasConfirmadas,
    tiempoTranscurridoRonda,
    todasLasCartasProcesadas,
    inicializarExperiencia,
    iniciarTemporizadorRonda,
    detenerTemporizadorRonda,
    seleccionarEtiquetaTemporal,
    confirmarSeleccion,
    avanzarCarta,
    retrocederCarta,
  } = useExperienciaCartaPorCarta(state, guardarSeleccionNaipe);

  // Inicializar experiencia al montar
  useEffect(() => {
    inicializarExperiencia();
  }, [inicializarExperiencia]);

  // Iniciar temporizador cuando cambia la carta actual
  useEffect(() => {
    if (naipeActual && !etiquetaConfirmada) {
      iniciarTemporizadorRonda();
    }
    return () => {
      detenerTemporizadorRonda();
    };
  }, [indiceCartaActual, naipeActual, etiquetaConfirmada, iniciarTemporizadorRonda, detenerTemporizadorRonda]);

  // Formatear tiempo
  const formatearTiempo = (segundos: number): string => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${String(minutos).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;
  };

  // Obtener imagen del naipe
  const obtenerImagenNaipe = (naipeId: string): string => {
    return `/images/naipes/${naipeId}.png`;
  };

  // Generar SVG de naipe como fallback
  const generarSVGNaipe = (naipeId: string): string => {
    const [numero, palo] = naipeId.split('-');
    const palos: Record<string, string> = {
      espadas: '♠',
      bastos: '♣',
      oros: '♦',
      copas: '♥',
    };
    const simboloPalo = palos[palo] || '?';
    return `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="140" viewBox="0 0 100 140">
        <rect width="100" height="140" fill="white" stroke="black" stroke-width="2" rx="8"/>
        <text x="50" y="70" font-size="24" text-anchor="middle" fill="black">${numero}</text>
        <text x="50" y="90" font-size="32" text-anchor="middle" fill="black">${simboloPalo}</text>
      </svg>`
    )}`;
  };

  if (todasLasCartasProcesadas) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          ¡Todas las cartas han sido procesadas!
        </h2>
        <p className="text-gray-600 mb-6">
          Has completado la experiencia carta por carta.
        </p>
        {onFinalizar && (
          <button
            onClick={onFinalizar}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
          >
            Finalizar Selecciones
          </button>
        )}
      </div>
    );
  }

  if (!naipeActual) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4 md:p-8">
      {/* Progreso de ronda */}
      <div className="mb-4 text-center">
        <p className="text-lg font-semibold text-gray-700">
          Ronda {indiceCartaActual + 1} de {state.etiquetasDisponibles.length}
        </p>
        {tiempoTranscurridoRonda > 0 && (
          <p className="text-sm text-gray-600 mt-1">
            Tiempo: {formatearTiempo(tiempoTranscurridoRonda)}
          </p>
        )}
      </div>

      {/* Naipe actual */}
      <div className="mb-8 flex flex-col items-center">
        <div className="relative">
          <img
            src={obtenerImagenNaipe(naipeActual.id)}
            alt={naipeActual.nombre}
            className="w-24 h-36 md:w-32 md:h-48 object-contain drop-shadow-2xl"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = generarSVGNaipe(naipeActual.id);
            }}
          />
          {etiquetaConfirmada && (
            <div className="mt-4 bg-green-100 border-2 border-green-400 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Etiqueta confirmada:</p>
              <p className="font-semibold text-green-900 text-lg">
                {state.etiquetasDisponibles.find((e) => e.id === etiquetaConfirmada)?.nombre}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Etiquetas disponibles */}
      {!etiquetaConfirmada && (
        <div className="w-full max-w-2xl mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
            Selecciona una etiqueta para este naipe:
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {etiquetasDisponibles.map((etiqueta) => (
              <button
                key={etiqueta.id}
                onClick={() => seleccionarEtiquetaTemporal(etiqueta.id)}
                className={`
                  p-4 border-2 rounded-lg transition-all duration-200
                  ${
                    etiquetaSeleccionadaTemporal === etiqueta.id
                      ? 'bg-purple-200 border-purple-500 scale-105'
                      : 'bg-white border-purple-300 hover:border-purple-400 hover:bg-purple-50'
                  }
                `}
              >
                <p className="font-semibold text-gray-900 text-sm">{etiqueta.nombre}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Emparejamientos confirmados */}
      {etiquetasConfirmadas.size > 0 && (
        <div className="w-full max-w-2xl mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Emparejamientos confirmados:</h3>
          <div className="space-y-2">
            {Array.from(etiquetasConfirmadas.entries()).map(([naipeId, etiquetaId]) => {
              const etiqueta = state.etiquetasDisponibles.find((e) => e.id === etiquetaId);
              const naipe = state.naipesDisponibles.find((n) => n.id === naipeId);
              if (!etiqueta || !naipe) return null;

              return (
                <div
                  key={`${naipeId}-${etiquetaId}`}
                  className="flex items-center gap-3 bg-green-50 border border-green-300 rounded-lg p-3"
                >
                  <img
                    src={obtenerImagenNaipe(naipe.id)}
                    alt={naipe.nombre}
                    className="w-12 h-16 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = generarSVGNaipe(naipe.id);
                    }}
                  />
                  <span className="text-sm font-semibold text-gray-900">{etiqueta.nombre}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Botones de navegación */}
      <div className="flex gap-4 mt-6">
        {indiceCartaActual > 0 && (
          <button
            onClick={retrocederCarta}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold"
          >
            Anterior
          </button>
        )}
        {!etiquetaConfirmada && etiquetaSeleccionadaTemporal && (
          <button
            onClick={confirmarSeleccion}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            Confirmar Selección
          </button>
        )}
        {etiquetaConfirmada && (
          <button
            onClick={avanzarCarta}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
          >
            Siguiente
          </button>
        )}
      </div>
    </div>
  );
};

export default CartaPorCartaView;




