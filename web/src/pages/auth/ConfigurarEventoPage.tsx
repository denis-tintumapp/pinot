/**
 * Página de Configuración de Evento
 * Migración desde configurar-evento.html
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventoActivo } from '../../hooks/useEventoActivo';
import { useCrearEvento } from '../../hooks/useCrearEvento';
import EventoActivoCard from '../../components/eventos/EventoActivoCard';
import FormularioCrearEvento from '../../components/eventos/FormularioCrearEvento';
import { useAuth } from '../../contexts/AuthContext';
import { verificarPermisosUsuario } from '../../utils/permisos';

const ConfigurarEventoPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { eventoActivo, loading: eventoLoading } = useEventoActivo();
  const { crearEvento, loading: crearLoading, error: crearError } = useCrearEvento();
  const [permisos, setPermisos] = useState<{ puedeCrearEventos: boolean; tipoUsuario: string | null; loading: boolean }>({
    puedeCrearEventos: false,
    tipoUsuario: null,
    loading: true
  });

  // Verificar autenticación
  useEffect(() => {
    if (!authLoading && !user) {
      // Redirigir a login si no está autenticado
      navigate('/auth/login?redirect=/auth/configurar-evento');
    }
  }, [user, authLoading, navigate]);

  // Verificar email verificado
  useEffect(() => {
    if (user && !user.emailVerified) {
      navigate('/auth/verify-email');
    }
  }, [user, navigate]);

  // Verificar permisos del usuario
  useEffect(() => {
    const verificarPermisos = async () => {
      if (!user) {
        setPermisos({ puedeCrearEventos: false, tipoUsuario: null, loading: false });
        return;
      }

      try {
        const permisosUsuario = await verificarPermisosUsuario(user.uid);
        setPermisos({
          puedeCrearEventos: permisosUsuario.puedeCrearEventos,
          tipoUsuario: permisosUsuario.tipoUsuario,
          loading: false
        });

        // Si no puede crear eventos, mostrar mensaje informativo
        if (!permisosUsuario.puedeCrearEventos && permisosUsuario.tipoUsuario === 'efimero') {
          // No redirigir, solo mostrar mensaje en la UI
        }
      } catch (error) {
        console.error('Error al verificar permisos:', error);
        setPermisos({ puedeCrearEventos: false, tipoUsuario: null, loading: false });
      }
    };

    if (user && user.emailVerified) {
      verificarPermisos();
    }
  }, [user]);

  const handleCrearEvento = async (nombre: string) => {
    const resultado = await crearEvento(nombre);
    
    if (resultado.success && resultado.eventoId) {
      // Redirigir a la página de armado del evento
      navigate(`/auth/armar-evento?eventoId=${resultado.eventoId}`);
    }
  };

  // Mostrar loading mientras se verifica autenticación, evento activo o permisos
  if (authLoading || eventoLoading || permisos.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
        <div className="text-white text-lg">Cargando...</div>
      </div>
    );
  }

  // Si hay un evento activo, mostrar la tarjeta
  if (eventoActivo) {
    return <EventoActivoCard evento={eventoActivo} />;
  }

  // Si el usuario no puede crear eventos (es efímero), mostrar mensaje
  if (!permisos.puedeCrearEventos && permisos.tipoUsuario === 'efimero') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 text-center">
            <div className="mb-6">
              <img
                src="/images/logo-pinot.png"
                alt="Pinot Logo"
                className="w-full max-w-[560px] mx-auto mb-4"
                style={{ height: 'clamp(5rem, 7.5vw, 8.125rem)' }}
              />
              <h2 className="text-2xl font-bold text-white mb-2">Crear Eventos</h2>
            </div>
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-6">
              <p className="text-yellow-200 text-sm">
                Solo los usuarios <strong>permanentes</strong> o <strong>miembros</strong> pueden crear eventos.
              </p>
              <p className="text-yellow-200 text-sm mt-2">
                Los usuarios efímeros solo pueden participar en eventos existentes ingresando con un PIN.
              </p>
            </div>
            <div className="space-y-3">
              <a
                href="/auth/signup"
                className="block w-full bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:from-purple-600 hover:to-purple-800 transition-all"
              >
                Registrarse como Usuario Permanente
              </a>
              <a
                href="/"
                className="block w-full bg-white/20 text-white font-semibold py-3 rounded-lg hover:bg-white/30 transition-all"
              >
                Participar en un Evento Existente
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar formulario de creación (solo para usuarios permanentes/miembros)
  return (
    <FormularioCrearEvento
      onSubmit={handleCrearEvento}
      loading={crearLoading}
      error={crearError}
    />
  );
};

export default ConfigurarEventoPage;











