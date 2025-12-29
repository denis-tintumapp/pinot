/**
 * Componente para mostrar la confirmación después de finalizar la configuración
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ConfirmacionFinalizacionProps {
  pin: string;
  onCerrar: () => void;
}

const ConfirmacionFinalizacion: React.FC<ConfirmacionFinalizacionProps> = ({ pin, onCerrar }) => {
  const navigate = useNavigate();

  const handleIngresarComoParticipante = () => {
    navigate(`/?pin=${pin}`);
  };

  return (
    <section className="bg-white rounded-xl shadow-lg p-8 mb-6 space-y-6">
      <div className="text-center">
        <div className="mb-4">
          <span className="text-6xl">✅</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Evento configurado exitosamente!</h2>
        <p className="text-gray-600">El evento está listo para recibir participantes</p>
      </div>
      
      <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6 space-y-4">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">PIN del evento:</p>
          <p className="text-4xl font-bold text-purple-700 font-mono tracking-wider mb-4">{pin}</p>
        </div>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={handleIngresarComoParticipante}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all text-lg"
          >
            🎯 Ingresar como participante
          </button>
          <button
            onClick={onCerrar}
            className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </section>
  );
};

export default ConfirmacionFinalizacion;











