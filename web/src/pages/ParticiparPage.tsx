/**
 * Página de Participación
 * Migración completa desde participar.js
 * Incluye todos los pasos: nombre, asignación de naipes, calificaciones, ranking y resultados
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DndContext, DragEndEvent, DragOverlay, closestCenter } from '@dnd-kit/core';
import { useParticipacion } from '../hooks/useParticipacion';
import { useCalificaciones } from '../hooks/useCalificaciones';
import { useTimerEvento } from '../hooks/useTimerEvento';
import { useVerificarResultados } from '../hooks/useVerificarResultados';
import { useAuth } from '../contexts/AuthContext';
import { verificarParticipacionExistente } from '../utils/participantes';
import { PinEventoSchema, type PinEvento } from '../schemas/usuario.schema';
import { PinInput } from '../components/forms/PinInput';
import { FormButton, FormError } from '../components/forms';
import NaipeCard from '../components/naipes/NaipeCard';
import EtiquetaCard from '../components/etiquetas/EtiquetaCard';
import Timer from '../components/Timer';
import CartaPorCartaView from '../components/participacion/CartaPorCartaView';
import EtiquetasRanking from '../components/participacion/EtiquetasRanking';
import EstrellasCalificacion from '../components/participacion/EstrellasCalificacion';

const ParticiparPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const pinFromURL = searchParams.get('pin');
  const eventoIdFromURL = searchParams.get('evento');
  
  const [eventoId, setEventoId] = useState<string | null>(eventoIdFromURL);
  const [mostrarFormularioPIN, setMostrarFormularioPIN] = useState(!eventoId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    setError: setFormError,
  } = useForm<PinEvento>({
    resolver: zodResolver(PinEventoSchema),
    mode: 'onBlur',
    defaultValues: {
      pin: pinFromURL || '',
    },
  });
  const [nombreSeleccionado, setNombreSeleccionado] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mostrarOpcionesRegistro, setMostrarOpcionesRegistro] = useState(false);
  const [verificandoParticipacion, setVerificandoParticipacion] = useState(false);
  const [modoCartaPorCarta, setModoCartaPorCarta] = useState(false);

  const { user, isAuthenticated } = useAuth();
  const {
    state,
    loading,
    error,
    guardarSeleccionNaipe,
    guardarNombreParticipante,
    quitarSeleccionNaipe,
    guardarCalificaciones,
    guardarOrdenEtiquetas,
    finalizarParticipacion,
  } = useParticipacion(eventoId);

  const { calificarEtiqueta, validarCalificacionesCompletas } = useCalificaciones(
    eventoId,
    state,
    guardarCalificaciones
  );

  const { timer, minutosRestantes, segundosRestantes } = useTimerEvento(
    eventoId,
    async () => {
      // Timer expirado, finalizar automáticamente
      if (!state.finalizado) {
        await finalizarParticipacion();
      }
    }
  );

  const { resultadosRevelados } = useVerificarResultados(eventoId, () => {
    // Cuando los resultados son revelados, actualizar el paso
    if (state.pasoActual !== 4) {
      // Forzar actualización del estado para mostrar resultados
      window.location.reload();
    }
  });

  // Verificar si el usuario autenticado ya es participante permanente/miembro
  useEffect(() => {
    const verificarParticipacion = async () => {
      if (!eventoId || !isAuthenticated || !user) return;
      
      setVerificandoParticipacion(true);
      try {
        const participacion = await verificarParticipacionExistente(eventoId);
        if (participacion.existe && participacion.tipo !== 'efimero') {
          setMostrarOpcionesRegistro(false);
        } else if (!state.nombreParticipante) {
          setMostrarOpcionesRegistro(true);
        }
      } catch (err) {
        console.error('Error al verificar participación:', err);
      } finally {
        setVerificandoParticipacion(false);
      }
    };

    verificarParticipacion();
  }, [eventoId, isAuthenticated, user, state.nombreParticipante]);

  // Buscar evento por PIN
  const buscarEventoPorPIN = async (pin: string) => {
    try {
      const { buscarEventoPorPIN: buscar } = await import('../../js/firestore');
      const resultado = await buscar(pin);
      
      if (resultado && resultado.ok && resultado.data) {
        const evento = resultado.data as any;
        setEventoId(evento.id || pin);
        setMostrarFormularioPIN(false);
        navigate(`/participar?pin=${pin}&evento=${evento.id || pin}`, { replace: true });
      } else {
        setFormError('pin', {
          message: 'PIN no encontrado. Por favor, verifica el código.',
        });
      }
    } catch (err: any) {
      console.error('Error al buscar evento:', err);
      setFormError('root', {
        message: 'Error al buscar el evento. Por favor, intenta nuevamente.',
      });
    }
  };

  const onSubmitPIN = async (data: PinEvento) => {
    await buscarEventoPorPIN(data.pin);
  };

  const handleSeleccionarNombre = async (nombre: string) => {
    if (state.nombresOcupados.has(nombre.toLowerCase())) {
      alert(`"${nombre}" ya fue seleccionado por otro participante. Por favor, elegí otro.`);
      return;
    }
    
    try {
      await guardarNombreParticipante(nombre);
      setNombreSeleccionado(nombre);
    } catch (err: any) {
      console.error('Error al guardar nombre:', err);
      alert('Error al guardar el nombre. Por favor, intenta nuevamente.');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === 'naipe' && overData?.type === 'etiqueta') {
      const naipeId = activeData.naipeId;
      const etiquetaId = overData.etiquetaId;

      try {
        await guardarSeleccionNaipe(etiquetaId, naipeId);
      } catch (err: any) {
        console.error('Error al guardar selección:', err);
        alert('Error al guardar la selección. Por favor, intenta nuevamente.');
      }
    }
  };

  const handleQuitarNaipe = async (etiquetaId: string) => {
    try {
      await quitarSeleccionNaipe(etiquetaId);
    } catch (err: any) {
      console.error('Error al quitar naipe:', err);
      alert('Error al quitar el naipe. Por favor, intenta nuevamente.');
    }
  };

  const handleCalificar = async (etiquetaId: string, calificacion: number) => {
    try {
      await calificarEtiqueta(etiquetaId, calificacion);
    } catch (err: any) {
      console.error('Error al calificar:', err);
      alert('Error al guardar la calificación. Por favor, intenta nuevamente.');
    }
  };

  const handleAvanzarACalificaciones = async () => {
    // Verificar que todas las etiquetas tengan naipe asignado
    const todasAsignadas = state.etiquetasDisponibles.every(
      (etiqueta) => state.seleccionesNaipes[etiqueta.id]
    );

    if (!todasAsignadas) {
      alert('Por favor, asigna un naipe a todas las etiquetas antes de continuar.');
      return;
    }

    // Si no hay participantes, finalizar directamente
    if (state.participantesDisponibles.length === 0) {
      await handleFinalizar();
      return;
    }

    // Avanzar al paso de calificaciones (paso 3)
    // El paso se actualizará automáticamente cuando se guarden las calificaciones
  };

  const handleAvanzarARanking = () => {
    // Verificar que todas las selecciones estén calificadas
    const validacion = validarCalificacionesCompletas();
    
    if (!validacion.completas && state.participantesDisponibles.length > 0) {
      alert(validacion.mensaje);
      return;
    }

    // Avanzar al paso de ranking (paso 4)
  };

  const handleFinalizar = async () => {
    if (state.finalizado) return;

    const todasAsignadas = state.etiquetasDisponibles.every(
      (etiqueta) => state.seleccionesNaipes[etiqueta.id]
    );

    if (!todasAsignadas) {
      alert('Por favor, asigna un naipe a todas las etiquetas antes de finalizar.');
      return;
    }

    // Si hay participantes, verificar calificaciones
    if (state.participantesDisponibles.length > 0) {
      const validacion = validarCalificacionesCompletas();
      if (!validacion.completas) {
        alert(validacion.mensaje);
        return;
      }
    }

    if (window.confirm('¿Estás seguro de que querés finalizar? No podrás hacer más cambios.')) {
      try {
        await finalizarParticipacion();
      } catch (err: any) {
        console.error('Error al finalizar:', err);
        alert('Error al finalizar. Por favor, intenta nuevamente.');
      }
    }
  };

  // Determinar paso actual basado en el estado
  const todasAsignadas = state.etiquetasDisponibles.length > 0 && 
    state.etiquetasDisponibles.every((etiqueta) => state.seleccionesNaipes[etiqueta.id]);
  
  const todasCalificadas = state.participantesDisponibles.length > 0 &&
    todasAsignadas &&
    state.etiquetasDisponibles
      .filter((etiqueta) => state.seleccionesNaipes[etiqueta.id])
      .every((etiqueta) => {
        const calificacion = state.calificacionesEtiquetas[etiqueta.id];
        return calificacion && calificacion > 0;
      });

  const pasoActual = state.finalizado
    ? 4
    : state.pasoActual === 1 || !state.nombreParticipante
    ? 1
    : !todasAsignadas
    ? 2
    : state.participantesDisponibles.length > 0 && !todasCalificadas
    ? 3
    : todasCalificadas || (todasAsignadas && state.participantesDisponibles.length === 0)
    ? 4
    : 2;

  // Mostrar formulario de PIN si no hay eventoId
  if (mostrarFormularioPIN) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <img
                src="/images/logo-pinot.png"
                alt="Pinot Logo"
                className="h-12 w-auto"
              />
              <h1 className="text-4xl font-bold text-white font-branding">Pinot</h1>
            </div>
            <p className="text-white/80 text-lg">Ingresa con tu PIN</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
            <form onSubmit={handleSubmit(onSubmitPIN)} className="space-y-6">
              <div>
                <label htmlFor="pin" className="block text-white font-medium mb-2">
                  PIN del Evento <span className="text-red-300">*</span>
                </label>
                <PinInput
                  name="pin"
                  register={register}
                  error={errors.pin}
                  disabled={isSubmitting}
                  className="text-center text-2xl tracking-widest"
                />
              </div>

              {errors.root && (
                <FormError message={errors.root.message} type="error" />
              )}

              <FormButton
                type="submit"
                disabled={isSubmitting}
                loading={isSubmitting}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:from-purple-600 hover:to-purple-800 transition-all"
              >
                Ingresar
              </FormButton>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border inline-block w-12 h-12 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Cargando evento...</p>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => setMostrarFormularioPIN(true)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Paso 1: Seleccionar nombre o mostrar opciones de registro
  if (pasoActual === 1) {
    if (isAuthenticated && mostrarOpcionesRegistro && !verificandoParticipacion) {
      return (
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {state.eventoData?.nombre || 'Evento'}
              </h2>
              {state.eventoData?.fecha && (
                <p className="text-gray-600">
                  Fecha: {new Date(state.eventoData.fecha).toLocaleDateString('es-AR')}
                </p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                ¿Cómo querés participar?
              </h3>
              
              <div className="space-y-4">
                <div className="border-2 border-purple-500 rounded-lg p-4 hover:bg-purple-50 transition-colors">
                  <h4 className="font-semibold text-gray-900 mb-2">Participante Permanente</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Regístrate como participante permanente para mantener tu historial y datos guardados.
                  </p>
                  <button
                    onClick={() => navigate(`/auth/registro-participante?eventoId=${eventoId}`)}
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold py-2 rounded-lg hover:from-purple-600 hover:to-purple-800 transition-all"
                  >
                    Registrarse como Participante Permanente
                  </button>
                </div>

                <div className="border-2 border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <h4 className="font-semibold text-gray-900 mb-2">Participante Invitado (Efímero)</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Participa sin registro. Solo selecciona tu nombre de la lista.
                  </p>
                  <button
                    onClick={() => setMostrarOpcionesRegistro(false)}
                    className="w-full bg-gray-600 text-white font-semibold py-2 rounded-lg hover:bg-gray-700 transition-all"
                  >
                    Participar como Invitado
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {state.eventoData?.nombre || 'Evento'}
            </h2>
            {state.eventoData?.fecha && (
              <p className="text-gray-600">
                Fecha: {new Date(state.eventoData.fecha).toLocaleDateString('es-AR')}
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Seleccioná tu nombre
            </h3>
            
            {isAuthenticated && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Estás participando como invitado. Si querés registrarte como participante permanente,{' '}
                  <a href={`/auth/registro-participante?eventoId=${eventoId}`} className="underline font-semibold">
                    haz clic aquí
                  </a>.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {state.participantesDisponibles.map((nombre) => {
                const isOcupado = state.nombresOcupados.has(nombre.toLowerCase());
                const isSeleccionado = nombreSeleccionado === nombre;
                
                return (
                  <button
                    key={nombre}
                    onClick={() => !isOcupado && handleSeleccionarNombre(nombre)}
                    disabled={isOcupado}
                    className={`
                      px-4 py-3 rounded-lg border-2 transition-all
                      ${isOcupado 
                        ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : isSeleccionado
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                      }
                    `}
                  >
                    {nombre}
                    {isOcupado && <span className="text-xs block mt-1">(Ocupado)</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Paso 2: Asignar naipes a etiquetas (o experiencia carta por carta)
  if (pasoActual === 2 && !modoCartaPorCarta) {
    return (
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={(event) => setActiveId(event.active.id as string)}
        onDragEnd={handleDragEnd}
      >
        <div className="min-h-screen bg-gray-50 p-4">
          <Timer expiraEn={state.timerExpiraEn} />

          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {state.eventoData?.nombre || 'Evento'}
                  </h2>
                  <p className="text-gray-600">
                    Participante: <span className="font-semibold">{state.nombreParticipante}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setModoCartaPorCarta(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Modo Carta por Carta
                  </button>
                  <button
                    onClick={handleAvanzarACalificaciones}
                    disabled={
                      state.finalizado ||
                      Object.keys(state.seleccionesNaipes).length < state.etiquetasDisponibles.length
                    }
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {state.participantesDisponibles.length > 0 ? 'Continuar a Calificaciones' : 'Finalizar'}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Columna de Naipes */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Naipes Disponibles
                </h3>
                <div className="bg-white rounded-lg shadow-lg p-4">
                  <div className="grid grid-cols-4 gap-3">
                    {state.naipesDisponibles.map((naipe) => {
                      const isAsignado = Object.values(state.seleccionesNaipes).includes(naipe.id);
                      return (
                        <NaipeCard
                          key={naipe.id}
                          naipeId={naipe.id}
                          naipeNombre={naipe.nombre}
                          isDisabled={isAsignado}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Columna de Etiquetas */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Etiquetas
                </h3>
                <div className="space-y-4">
                  {state.etiquetasDisponibles.map((etiqueta) => {
                    const naipeId = state.seleccionesNaipes[etiqueta.id];
                    const naipe = naipeId 
                      ? state.naipesDisponibles.find((n) => n.id === naipeId)
                      : null;

                    return (
                      <EtiquetaCard
                        key={etiqueta.id}
                        etiquetaId={etiqueta.id}
                        etiquetaNombre={etiqueta.nombre}
                        naipeAsignado={naipe ? { naipeId: naipe.id, naipeNombre: naipe.nombre } : null}
                        onRemove={() => handleQuitarNaipe(etiqueta.id)}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="opacity-50">
              {state.naipesDisponibles
                .filter((n) => `naipe-${n.id}` === activeId)
                .map((naipe) => (
                  <NaipeCard
                    key={naipe.id}
                    naipeId={naipe.id}
                    naipeNombre={naipe.nombre}
                  />
                ))}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  }

  // Experiencia carta por carta
  if (pasoActual === 2 && modoCartaPorCarta) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Timer expiraEn={state.timerExpiraEn} />

        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {state.eventoData?.nombre || 'Evento'}
                </h2>
                <p className="text-gray-600">
                  Participante: <span className="font-semibold">{state.nombreParticipante}</span>
                </p>
              </div>
              <button
                onClick={() => setModoCartaPorCarta(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Modo Normal
              </button>
            </div>
          </div>

          <CartaPorCartaView
            state={state}
            guardarSeleccionNaipe={guardarSeleccionNaipe}
            onFinalizar={() => {
              setModoCartaPorCarta(false);
              if (state.participantesDisponibles.length > 0) {
                handleAvanzarACalificaciones();
              } else {
                handleFinalizar();
              }
            }}
          />
        </div>
      </div>
    );
  }

  // Paso 3: Calificar etiquetas (solo si hay participantes)
  if (pasoActual === 3) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Timer expiraEn={state.timerExpiraEn} />

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Calificar Etiquetas
                </h2>
                <p className="text-gray-600">
                  Califica cada etiqueta con estrellas (1-5)
                </p>
              </div>
              <button
                onClick={handleAvanzarARanking}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Continuar a Ranking
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {state.etiquetasDisponibles
              .filter((etiqueta) => state.seleccionesNaipes[etiqueta.id])
              .map((etiqueta) => {
                const naipeId = state.seleccionesNaipes[etiqueta.id];
                const naipe = state.naipesDisponibles.find((n) => n.id === naipeId);
                const calificacion = state.calificacionesEtiquetas[etiqueta.id] || 0;

                return (
                  <div
                    key={etiqueta.id}
                    className="bg-white rounded-lg shadow-lg p-6 border-2 border-purple-200"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {etiqueta.nombre}
                        </h3>
                        {naipe && (
                          <div className="flex items-center gap-3 mb-4">
                            <img
                              src={`/images/naipes/${naipe.id}.png`}
                              alt={naipe.nombre}
                              className="w-16 h-24 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            <span className="text-sm text-gray-600">{naipe.nombre}</span>
                          </div>
                        )}
                        <EstrellasCalificacion
                          etiquetaId={etiqueta.id}
                          calificacion={calificacion}
                          onCalificar={handleCalificar}
                          size="large"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  }

  // Paso 4: Ranking y resultados
  if (pasoActual === 4 || state.finalizado) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {resultadosRevelados ? 'Resultados del Evento' : 'Selecciones Finalizadas'}
            </h2>
            <p className="text-gray-600">
              Participante: <span className="font-semibold">{state.nombreParticipante}</span>
            </p>
          </div>

          {!resultadosRevelados ? (
            <>
              {/* Ranking de etiquetas */}
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <EtiquetasRanking
                  state={state}
                  guardarOrdenEtiquetas={guardarOrdenEtiquetas}
                  onCalificar={handleCalificar}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="text-blue-800 text-center">
                  Gracias por participar. Los resultados se mostrarán cuando el anfitrión los revele.
                </p>
              </div>
            </>
          ) : (
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-green-800 mb-4">
                ✅ Resultados Revelados
              </h3>
              <p className="text-green-700">
                Los resultados han sido revelados por el anfitrión. Redirigiendo...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default ParticiparPage;
