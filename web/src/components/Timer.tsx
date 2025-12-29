/**
 * Componente de Timer
 * Muestra el tiempo restante de votación
 */

import React, { useEffect, useState } from 'react';

interface TimerProps {
  expiraEn: number | null; // Timestamp en milisegundos
  onExpire?: () => void;
}

const Timer: React.FC<TimerProps> = ({ expiraEn, onExpire }) => {
  const [tiempoRestante, setTiempoRestante] = useState<string>('');

  useEffect(() => {
    if (!expiraEn) {
      setTiempoRestante('');
      return;
    }

    const actualizarTimer = () => {
      const ahora = Date.now();
      const diferencia = expiraEn - ahora;

      if (diferencia <= 0) {
        setTiempoRestante('00:00');
        if (onExpire) {
          onExpire();
        }
        return;
      }

      const minutos = Math.floor(diferencia / 60000);
      const segundos = Math.floor((diferencia % 60000) / 1000);
      setTiempoRestante(`${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`);
    };

    // Actualizar inmediatamente
    actualizarTimer();

    // Actualizar cada segundo
    const interval = setInterval(actualizarTimer, 1000);

    return () => clearInterval(interval);
  }, [expiraEn, onExpire]);

  if (!expiraEn || !tiempoRestante) {
    return null;
  }

  const ahora = Date.now();
  const diferencia = expiraEn - ahora;
  const isUrgente = diferencia < 300000; // Menos de 5 minutos

  return (
    <div
      className={`
        fixed top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50
        ${isUrgente ? 'bg-red-50 border-2 border-red-500' : 'border border-gray-300'}
      `}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Tiempo restante:</span>
        <span
          className={`
            text-2xl font-bold font-mono
            ${isUrgente ? 'text-red-600' : 'text-purple-600'}
          `}
        >
          {tiempoRestante}
        </span>
      </div>
    </div>
  );
};

export default Timer;











