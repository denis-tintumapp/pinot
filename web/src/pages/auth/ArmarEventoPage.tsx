/**
 * Página para armar/configurar el evento
 * Migración desde armar-evento.html
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEvento } from '../../hooks/useEvento';
import { useParticipantes } from '../../hooks/useParticipantes';
import { useEtiquetas } from '../../hooks/useEtiquetas';
import { useAuthStore } from '../../stores/authStore';
import ParticipantesSection from '../../components/eventos/ParticipantesSection';
import EtiquetasNaipesSection from '../../components/eventos/EtiquetasNaipesSection';
import ConfirmacionFinalizacion from '../../components/eventos/ConfirmacionFinalizacion';
import { useAuth } from '../../hooks/useAuth';

const ArmarEventoPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventoId = searchParams.get('eventoId');
  const { user, loading: authLoading } = useAuth();
  const { evento, loading: eventoLoading, error: eventoError } = useEvento(eventoId);
  const { participantes } = useParticipantes(eventoId);
  const { etiquetas, guardarEtiquetas } = useEtiquetas(eventoId);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  // Verificar autenticación
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth/login?redirect=/auth/armar-evento');
    }
  }, [user, authLoading, navigate]);

  // Redirigir si no hay eventoId (sin mostrar alert)
  useEffect(() => {
    if (!eventoId && !eventoLoading) {
      navigate('/auth/configurar-evento', { replace: true });
    }
  }, [eventoId, eventoLoading, navigate]);

  // Redirigir si hay error de permisos
  useEffect(() => {
    if (eventoError && eventoError.includes('permiso')) {
      alert('No tienes permiso para configurar este evento.');
      navigate('/auth/configurar-evento');
    }
  }, [eventoError, navigate]);

  const handleFinalizar = async () => {
    // Verificar que tenga al menos 2 participantes y 2 etiquetas
    if (participantes.length < 2) {
      alert('El evento debe tener al menos 2 participantes para poder finalizar.');
      return;
    }

    if (etiquetas.length < 2) {
      alert('El evento debe tener al menos 2 etiquetas para poder finalizar.');
      return;
    }

    // Guardar configuración de etiquetas (sin naipes, se asignarán al revelar resultados)
    if (etiquetas.length > 0) {
      const resultado = await guardarEtiquetas();
      if (!resultado.success) {
        alert('Error al guardar la configuración. Por favor, intenta nuevamente.');
        return;
      }
    }

    // Enviar email de confirmación con QR (opcional, no bloquea)
    try {
      const { anfitrionEmail, anfitrionAlias } = useAuthStore.getState();
      const finalAlias = anfitrionAlias || 'Anfitrión';
      
      if (anfitrionEmail && evento) {
        const urlBase = window.location.origin;
        const cloudRunUrl = 'https://proxyenviaremail-d3iusyvfpa-uc.a.run.app';
        
        const response = await fetch(cloudRunUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tipo: 'confirmacion_evento',
            email: anfitrionEmail,
            nombre: finalAlias,
            eventoNombre: evento.nombre || 'Evento sin nombre',
            eventoPIN: evento.pin || '',
            eventoId: evento.id,
            urlBase: urlBase
          })
        });
        
        if (!response.ok) {
          // Email no crítico, continuar sin error
        }
      }
    } catch (error) {
      console.error('Error al enviar email de confirmación:', error);
      // No bloquear el flujo si falla el envío de email
    }

    // Mostrar pantalla de confirmación
    setMostrarConfirmacion(true);
  };

  if (authLoading || eventoLoading) {
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="bg-white shadow-sm mb-6 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <img src="/images/logo-pinot.png" alt="Pinot Logo" className="h-10 w-auto" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800 font-branding">Armar Evento</h1>
                <p className="text-gray-600 text-sm">{evento.nombre || 'Evento sin nombre'}</p>
              </div>
            </div>
            <button
              onClick={handleFinalizar}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              Finalizar Configuración
            </button>
          </div>
        </header>

        {/* Sección de confirmación */}
        {mostrarConfirmacion && evento.pin && (
          <ConfirmacionFinalizacion
            pin={evento.pin}
            onCerrar={() => setMostrarConfirmacion(false)}
          />
        )}

        {/* Participantes */}
        <ParticipantesSection eventoId={eventoId} />

        {/* Etiquetas / Naipes */}
        <EtiquetasNaipesSection eventoId={eventoId} />

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

export default ArmarEventoPage;











