/**
 * Página del Anfitrión
 * Migración desde anfitrion.html
 * Vista en tiempo real del evento con selecciones de participantes
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEvento } from '../hooks/useEvento';
import { useSeleccionesParticipantes } from '../hooks/useSeleccionesParticipantes';
import { useEtiquetasEvento } from '../hooks/useEtiquetasEvento';
import { useRevelarResultados } from '../hooks/useRevelarResultados';
import { useNaipes } from '../hooks/useNaipes';
import TimerControl from '../components/anfitrion/TimerControl';
import ParticipanteSeleccionCard from '../components/anfitrion/ParticipanteSeleccionCard';
import { useAuth } from '../contexts/AuthContext';

const AnfitrionPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventoId = searchParams.get('evento');
  const { user, loading: authLoading } = useAuth();
  const { evento, loading: eventoLoading, error: eventoError } = useEvento(eventoId);
  const { selecciones, loading: seleccionesLoading } = useSeleccionesParticipantes(eventoId);
  const { etiquetas, loading: etiquetasLoading } = useEtiquetasEvento(eventoId);
  const { naipesSeleccionados } = useNaipes(eventoId);
  const { revelar, loading: revelando } = useRevelarResultados();
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  // Verificar autenticación
  useEffect(() => {
    if (!authLoading && !user) {
      // Verificar también sistema antiguo
      const anfitrionId = localStorage.getItem('anfitrion_id');
      if (!anfitrionId) {
        navigate('/auth/login?redirect=/anfitrion');
      }
    }
  }, [user, authLoading, navigate]);

  // Redirigir si no hay eventoId
  useEffect(() => {
    if (!eventoId && !eventoLoading) {
      alert('No se especificó un evento. Redirigiendo...');
      navigate('/');
    }
  }, [eventoId, eventoLoading, navigate]);

  // Verificar permisos
  useEffect(() => {
    if (evento && user) {
      const anfitrionId = user.uid || localStorage.getItem('anfitrion_id');
      if (evento.anfitrionId !== anfitrionId) {
        alert('No tienes permiso para ver este evento.');
        navigate('/');
      }
    }
  }, [evento, user, navigate]);

  const handleRevelarResultados = async () => {
    if (!eventoId) return;

    if (!mostrarConfirmacion) {
      setMostrarConfirmacion(true);
      return;
    }

    const resultado = await revelar(eventoId);
    if (resultado.success) {
      setMostrarConfirmacion(false);
      // Redirigir a resultados
      navigate(`/resultados?evento=${eventoId}`);
    } else {
      alert(resultado.error || 'Error al revelar resultados');
    }
  };

  if (authLoading || eventoLoading || seleccionesLoading || etiquetasLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-lg">Cargando...</div>
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

  const participantesFinalizados = selecciones.filter((s: any) => s.finalizado).length;
  const totalParticipantes = selecciones.length;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="bg-white shadow-sm mb-6 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 font-branding">Vista del Anfitrión</h1>
              <p className="text-gray-600 text-sm mt-1">{evento.nombre || 'Evento sin nombre'}</p>
              <p className="text-gray-500 text-xs mt-1">
                PIN: <span className="font-mono font-bold">{evento.pin || 'N/A'}</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {!mostrarConfirmacion ? (
                <button
                  onClick={handleRevelarResultados}
                  disabled={revelando || evento.resultadosRevelados}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {evento.resultadosRevelados ? 'Resultados Ya Revelados' : 'Revelar Resultados'}
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleRevelarResultados}
                    disabled={revelando}
                    className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all disabled:opacity-50"
                  >
                    {revelando ? 'Revelando...' : 'Confirmar Revelar'}
                  </button>
                  <button
                    onClick={() => setMostrarConfirmacion(false)}
                    disabled={revelando}
                    className="px-6 py-2 bg-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Total Participantes</p>
            <p className="text-3xl font-bold text-gray-900">{totalParticipantes}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Finalizados</p>
            <p className="text-3xl font-bold text-green-600">{participantesFinalizados}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-sm text-gray-600 mb-1">En Progreso</p>
            <p className="text-3xl font-bold text-yellow-600">{totalParticipantes - participantesFinalizados}</p>
          </div>
        </div>

        {/* Timer Control */}
        <TimerControl eventoId={eventoId} />

        {/* Selecciones de Participantes */}
        <section className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Selecciones de Participantes
            {selecciones.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-600">
                ({selecciones.length} {selecciones.length === 1 ? 'participante' : 'participantes'})
              </span>
            )}
          </h2>

          {selecciones.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Aún no hay participantes que hayan realizado selecciones.
            </p>
          ) : (
            <div className="space-y-4">
              {selecciones.map((seleccion: any) => (
                <ParticipanteSeleccionCard
                  key={seleccion.id}
                  seleccion={seleccion}
                  etiquetas={etiquetas.map((e: any) => ({ id: e.etiquetaId, nombre: e.etiquetaNombre }))}
                  naipes={naipesSeleccionados}
                />
              ))}
            </div>
          )}
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

export default AnfitrionPage;











