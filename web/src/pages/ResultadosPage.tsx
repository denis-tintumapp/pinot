/**
 * Página de Resultados
 * Migración desde resultados.html
 * Muestra respuestas correctas, podio de participantes y selecciones
 */

import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEventoPublico } from '../hooks/useEventoPublico';
import { useRespuestasCorrectas } from '../hooks/useRespuestasCorrectas';
import { useResultadosParticipantes } from '../hooks/useResultadosParticipantes';
import { useSeleccionesParticipantes } from '../hooks/useSeleccionesParticipantes';
import { useEtiquetasEvento } from '../hooks/useEtiquetasEvento';
import { useNaipes } from '../hooks/useNaipes';
import PodioParticipantes from '../components/resultados/PodioParticipantes';
import EstrellasCalificacion from '../components/resultados/EstrellasCalificacion';

const ResultadosPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const eventoId = searchParams.get('evento');
  const { evento, loading: eventoLoading, error: eventoError } = useEventoPublico(eventoId);
  const { respuestas, loading: respuestasLoading } = useRespuestasCorrectas(eventoId);
  const { podio, resto, loading: resultadosLoading } = useResultadosParticipantes(eventoId);
  const { selecciones } = useSeleccionesParticipantes(eventoId);
  const { etiquetas } = useEtiquetasEvento(eventoId);
  const { naipesSeleccionados } = useNaipes(eventoId);

  useEffect(() => {
    if (!eventoId && !eventoLoading) {
      alert('No se especificó un evento. Redirigiendo...');
      navigate('/');
    }
  }, [eventoId, eventoLoading, navigate]);

  const formatearFecha = (fechaISO: string) => {
    if (!fechaISO) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaISO)) {
      const [yyyy, mm, dd] = fechaISO.split('-');
      return `${dd}-${mm}-${yyyy}`;
    }
    return fechaISO;
  };

  const obtenerImagenNaipe = (naipeId: string) => {
    return `/images/naipes/${naipeId}.png`;
  };

  const getNaipeNombre = (naipeId: string): string => {
    const naipe = naipesSeleccionados.find(n => n.id === naipeId);
    return naipe ? naipe.nombre : naipeId;
  };

  if (eventoLoading || respuestasLoading || resultadosLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-lg">Cargando resultados...</div>
      </div>
    );
  }

  if (eventoError || !evento) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600 text-lg">{eventoError || 'Error al cargar el evento'}</div>
      </div>
    );
  }

  // Obtener respuestas correctas como mapa para comparación
  const respuestasCorrectasMap: Record<string, string> = {};
  respuestas.forEach(r => {
    respuestasCorrectasMap[r.etiquetaId] = r.naipeId;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="bg-white shadow-sm mb-6 rounded-lg p-4">
          <h1 id="nombreEvento" className="text-2xl font-bold text-gray-800 font-branding">
            {evento.nombre || 'Evento sin nombre'}
          </h1>
          {evento.fecha && (
            <p id="fechaEvento" className="text-gray-600 text-sm mt-1">
              Fecha: {formatearFecha(evento.fecha)}
            </p>
          )}
          <p className="text-gray-500 text-xs mt-1">
            PIN: <span className="font-mono font-bold">{evento.pin || 'N/A'}</span>
          </p>
        </header>

        {/* Respuestas Correctas */}
        <section className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Respuestas Correctas</h2>
          <div id="contenedorRespuestasCorrectas">
            {respuestas.length === 0 ? (
              <p className="text-gray-600">
                No se encontraron respuestas correctas. El anfitrión aún no ha finalizado su solución.
              </p>
            ) : (
              <div className="space-y-3">
                {respuestas.map((respuesta) => (
                  <div
                    key={respuesta.etiquetaId}
                    className="bg-white border border-green-300 rounded-lg p-3 flex justify-between items-center"
                  >
                    <div className="flex-1 flex items-center gap-3">
                      <p className="font-semibold text-gray-900">{respuesta.etiquetaNombre}</p>
                      <div className="flex-shrink-0">
                        <img
                          src={obtenerImagenNaipe(respuesta.naipeId)}
                          alt={respuesta.naipeNombre}
                          className="w-14 h-20 object-contain drop-shadow-md"
                          title={respuesta.naipeNombre}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-green-600 text-xl">✓</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Resultados de Participantes */}
        <section className="bg-white rounded-xl shadow p-6 mb-6">
          <div id="contenedorResultados">
            {/* Podio */}
            {podio.length > 0 && <PodioParticipantes podio={podio} />}

            {/* Resto de participantes */}
            {resto.length > 0 && (
              <>
                <h2 className="text-xl font-bold text-gray-700 mb-4">Resto de participantes</h2>
                <div className="space-y-4">
                  {resto.map((participante) => (
                    <div
                      key={participante.nombre}
                      className="bg-gray-50 border border-gray-300 rounded-xl p-6 space-y-4"
                    >
                      <div className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl font-bold text-purple-600">
                            #{participante.posicion}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {participante.nombre}
                          </h3>
                        </div>
                        <div className="text-xl font-bold text-purple-700">
                          {participante.puntos} puntos
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {participante.ordenEtiquetas
                          .filter(etiquetaId => participante.seleccionesNaipes[etiquetaId])
                          .map((etiquetaId) => {
                            const naipeIdSeleccionado = participante.seleccionesNaipes[etiquetaId];
                            const naipeCorrecto = respuestasCorrectasMap[etiquetaId];
                            const esCorrecta =
                              naipeIdSeleccionado &&
                              naipeCorrecto &&
                              String(naipeIdSeleccionado).trim() === String(naipeCorrecto).trim();

                            return (
                              <div key={etiquetaId} className="flex gap-2">
                                {esCorrecta ? (
                                  <div className="border-2 rounded-lg p-2 flex items-center justify-center bg-green-50 border-green-400">
                                    <img
                                      src={obtenerImagenNaipe(naipeIdSeleccionado)}
                                      alt={getNaipeNombre(naipeIdSeleccionado)}
                                      className="w-12 h-16 object-contain drop-shadow-md"
                                      title="Acierto"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <>
                                    <div className="border-2 rounded-lg p-2 flex items-center justify-center bg-gray-50 border-gray-300">
                                      <img
                                        src={obtenerImagenNaipe(naipeIdSeleccionado)}
                                        alt={getNaipeNombre(naipeIdSeleccionado)}
                                        className="w-12 h-16 object-contain drop-shadow-md opacity-50 grayscale"
                                        title="Fallo"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    </div>
                                    {naipeCorrecto && (
                                      <div className="border-2 rounded-lg p-2 flex items-center justify-center bg-green-50 border-green-400">
                                        <img
                                          src={obtenerImagenNaipe(naipeCorrecto)}
                                          alt={getNaipeNombre(naipeCorrecto)}
                                          className="w-12 h-16 object-contain drop-shadow-md"
                                          title="Solución correcta"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                          }}
                                        />
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {podio.length === 0 && resto.length === 0 && (
              <p className="text-gray-600">No hay participantes que hayan finalizado.</p>
            )}
          </div>
        </section>

        {/* Selecciones de Todos los Participantes */}
        <section className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Selecciones de Todos los Participantes
          </h2>
          <div id="contenedorSeleccionesParticipantes">
            {selecciones.length === 0 ? (
              <p className="text-gray-600">No hay selecciones para mostrar.</p>
            ) : (
              <div className="space-y-4">
                {selecciones.map((seleccion) => {
                  const calificaciones = (seleccion as any).calificacionesEtiquetas || {};
                  return (
                    <div
                      key={seleccion.id}
                      className="bg-gray-50 border border-gray-300 rounded-xl p-4"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {seleccion.nombreParticipante || 'Participante sin nombre'}
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {seleccion.ordenEtiquetas
                          .filter(etiquetaId => seleccion.seleccionesNaipes[etiquetaId])
                          .map((etiquetaId) => {
                            const naipeId = seleccion.seleccionesNaipes[etiquetaId];
                            const naipeCorrecto = respuestasCorrectasMap[etiquetaId];
                            const esCorrecta =
                              naipeId &&
                              naipeCorrecto &&
                              String(naipeId).trim() === String(naipeCorrecto).trim();
                            const calificacion = calificaciones[etiquetaId] || 0;

                            return (
                              <div
                                key={etiquetaId}
                                className="flex flex-col items-center"
                                style={{ width: 'fit-content' }}
                              >
                                <div
                                  className={`${
                                    esCorrecta
                                      ? 'border-3 border-green-500'
                                      : 'border-2 border-red-500 opacity-50'
                                  } rounded-lg`}
                                  style={{
                                    borderWidth: esCorrecta ? '3px' : '2px',
                                    borderColor: esCorrecta ? '#22c55e' : '#ef4444'
                                  }}
                                >
                                  <img
                                    src={obtenerImagenNaipe(naipeId)}
                                    alt={getNaipeNombre(naipeId)}
                                    className="w-16 h-auto rounded shadow-sm"
                                    style={{
                                      filter: esCorrecta ? 'none' : 'grayscale(100%) opacity(0.5)'
                                    }}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                                {calificacion > 0 && (
                                  <EstrellasCalificacion calificacion={calificacion} size="small" />
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Link a inicio */}
        <div className="text-center mb-6">
          <a href="/" className="text-gray-600 hover:text-gray-800 text-sm underline">
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
};

export default ResultadosPage;











