/**
 * Componente para controlar el timer del evento
 */

import React, { useState } from 'react';
import { useTimerEvento } from '../../hooks/useTimerEvento';

interface TimerControlProps {
  eventoId: string | null;
}

const TimerControl: React.FC<TimerControlProps> = ({ eventoId }) => {
  const {
    timer,
    loading,
    minutosRestantes,
    segundosRestantes,
    activarTimer,
    desactivarTimer,
    aumentarTiempo
  } = useTimerEvento(eventoId);

  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  const handleActivar = async () => {
    const resultado = await activarTimer(30);
    if (resultado.success) {
      setMostrarConfirmacion(false);
    } else {
      alert(resultado.error || 'Error al activar el timer');
    }
  };

  const handleDesactivar = async () => {
    if (confirm('¿Desactivar el timer del evento?')) {
      const resultado = await desactivarTimer();
      if (!resultado.success) {
        alert(resultado.error || 'Error al desactivar el timer');
      }
    }
  };

  const handleAumentar = async () => {
    const resultado = await aumentarTiempo(5);
    if (!resultado.success) {
      alert(resultado.error || 'Error al aumentar el tiempo');
    }
  };

  const formatearTiempo = (minutos: number, segundos: number): string => {
    return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <p className="text-gray-600">Cargando timer...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Timer del Evento</h2>

      {timer.timerActivo ? (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-5xl font-bold text-purple-600 mb-2 font-mono">
              {formatearTiempo(minutosRestantes, segundosRestantes)}
            </div>
            <p className="text-sm text-gray-600">
              {minutosRestantes > 0 || segundosRestantes > 0
                ? 'Tiempo restante'
                : '⏰ Tiempo agotado'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAumentar}
              className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              +5 minutos
            </button>
            <button
              onClick={handleDesactivar}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Desactivar Timer
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 mb-4">El timer no está activo</p>
          </div>
          {!mostrarConfirmacion ? (
            <button
              onClick={() => setMostrarConfirmacion(true)}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Activar Timer (30 minutos)
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center">
                ¿Activar timer de 30 minutos?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleActivar}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Sí, activar
                </button>
                <button
                  onClick={() => setMostrarConfirmacion(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimerControl;











