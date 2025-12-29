/**
 * Página de Onboarding para Anfitrión Persistente
 * Se muestra cuando un email ya ha sido usado para crear eventos
 */

import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const OnboardingPersistentePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="min-h-screen bg-purple-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/images/logo-pinot.png"
              alt="Pinot Logo"
              className="w-full max-w-[560px]"
            />
          </div>
          <p className="text-white/90 text-lg font-medium">Onboarding de Anfitrión Persistente</p>
        </div>

        {/* Contenido */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                ¡Bienvenido de nuevo!
              </h2>
              {email && (
                <p className="text-white/90 mb-4">
                  Detectamos que el email <strong>{email}</strong> ya ha sido usado para crear eventos.
                </p>
              )}
              <p className="text-white/90 mb-4">
                Para continuar creando eventos, te invitamos a completar el proceso de registro como <strong>Anfitrión Persistente</strong>.
              </p>
            </div>

            <div className="bg-white/10 rounded-lg p-4 space-y-3">
              <h3 className="text-white font-semibold">Beneficios de ser Anfitrión Persistente:</h3>
              <ul className="text-white/90 text-sm space-y-2 list-disc list-inside">
                <li>Gestión de múltiples eventos</li>
                <li>Historial de eventos creados</li>
                <li>Estadísticas y métricas</li>
                <li>Acceso prioritario a nuevas funcionalidades</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate('/auth/signup')}
                className="flex-1 bg-purple-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:bg-purple-800 transition-all"
              >
                Completar Registro
              </button>
              <button
                onClick={() => navigate('/auth/login')}
                className="flex-1 bg-white/20 text-white font-semibold py-3 rounded-lg hover:bg-white/30 transition-all"
              >
                Ya tengo cuenta
              </button>
            </div>

            <div className="text-center mt-4">
              <a href="/" className="text-white/80 hover:text-white text-sm underline">
                Volver al inicio
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPersistentePage;











