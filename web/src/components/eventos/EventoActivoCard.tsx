/**
 * Componente para mostrar información de un evento activo existente
 */

import React from 'react';
import { Link } from 'react-router-dom';

interface EventoActivoCardProps {
  evento: {
    id: string;
    nombre: string;
    pin: string;
  };
}

const EventoActivoCard: React.FC<EventoActivoCardProps> = ({ evento }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img
              src="/images/logo-pinot.png"
              alt="Pinot Logo"
              className="h-12 w-auto"
            />
            <h1 className="text-4xl font-bold text-white font-branding">Pinot</h1>
          </div>
          <p className="text-white/80 text-lg">Gestión de Evento</p>
        </div>

        {/* Card de Evento Activo */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="text-center space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Evento en Curso</h2>
              <p className="text-white/80 text-lg mb-4">{evento.nombre || 'Sin nombre'}</p>
              <p className="text-white/70 text-sm">
                PIN: <span className="font-mono font-bold">{evento.pin || 'N/A'}</span>
              </p>
            </div>

            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
              <p className="text-white text-sm">
                Ya tienes un evento activo. Solo puedes tener un evento por vez.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                to={`/auth/armar-evento?eventoId=${evento.id}`}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:from-purple-600 hover:to-purple-800 transition-all text-center"
              >
                Gestionar Evento
              </Link>

              <Link
                to="/"
                className="text-white/80 hover:text-white text-sm underline text-center"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventoActivoCard;











