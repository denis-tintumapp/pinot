/**
 * Hook para gestionar la experiencia "carta por carta"
 * Ordena naipes por rank y permite navegación entre ellos
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { NAIPES_TRUCO, Naipe } from '../../js/constantes';
import { ParticipacionState } from './useParticipacion';

interface ExperienciaCartaPorCartaState {
  naipesOrdenados: Array<{ id: string; nombre: string }>;
  indiceCartaActual: number;
  etiquetasConfirmadas: Map<string, string>; // { naipeId: etiquetaId }
  etiquetaSeleccionadaTemporal: string | null;
  tiemposRondas: Record<string, number>; // { naipeId: segundos }
  tiempoInicioRonda: number | null;
}

export const useExperienciaCartaPorCarta = (
  state: ParticipacionState,
  guardarSeleccionNaipe: (etiquetaId: string, naipeId: string) => Promise<void>
) => {
  const [experienciaState, setExperienciaState] = useState<ExperienciaCartaPorCartaState>({
    naipesOrdenados: [],
    indiceCartaActual: 0,
    etiquetasConfirmadas: new Map(),
    etiquetaSeleccionadaTemporal: null,
    tiemposRondas: {},
    tiempoInicioRonda: null,
  });

  const tiempoRondaIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializar experiencia: ordenar naipes por rank descendente
  const inicializarExperiencia = useCallback(() => {
    const naipesOrdenados = [...state.naipesDisponibles].sort((a, b) => {
      const naipeA = NAIPES_TRUCO.find((n) => n.id === a.id);
      const naipeB = NAIPES_TRUCO.find((n) => n.id === b.id);
      const rankA = naipeA ? naipeA.rank : 999;
      const rankB = naipeB ? naipeB.rank : 999;
      return rankA - rankB; // Menor rank = más fuerte, va primero
    });

    // Convertir selecciones previas a confirmadas
    const etiquetasConfirmadas = new Map<string, string>();
    Object.keys(state.seleccionesNaipes).forEach((etiquetaId) => {
      const naipeId = state.seleccionesNaipes[etiquetaId];
      if (naipeId) {
        etiquetasConfirmadas.set(naipeId, etiquetaId);
      }
    });

    setExperienciaState({
      naipesOrdenados,
      indiceCartaActual: 0,
      etiquetasConfirmadas,
      etiquetaSeleccionadaTemporal: null,
      tiemposRondas: {},
      tiempoInicioRonda: null,
    });

    // Detener cualquier temporizador anterior
    if (tiempoRondaIntervalRef.current) {
      clearInterval(tiempoRondaIntervalRef.current);
      tiempoRondaIntervalRef.current = null;
    }
  }, [state.naipesDisponibles, state.seleccionesNaipes]);

  // Iniciar temporizador de ronda
  const iniciarTemporizadorRonda = useCallback(() => {
    if (tiempoRondaIntervalRef.current) {
      clearInterval(tiempoRondaIntervalRef.current);
    }

    setExperienciaState((prev) => ({
      ...prev,
      tiempoInicioRonda: Date.now(),
    }));
  }, []);

  // Detener temporizador de ronda
  const detenerTemporizadorRonda = useCallback(() => {
    if (tiempoRondaIntervalRef.current) {
      clearInterval(tiempoRondaIntervalRef.current);
      tiempoRondaIntervalRef.current = null;
    }
  }, []);

  // Seleccionar etiqueta temporalmente (antes de confirmar)
  const seleccionarEtiquetaTemporal = useCallback((etiquetaId: string) => {
    setExperienciaState((prev) => ({
      ...prev,
      etiquetaSeleccionadaTemporal: etiquetaId,
    }));
  }, []);

  // Confirmar selección de etiqueta para el naipe actual
  const confirmarSeleccion = useCallback(async () => {
    if (!experienciaState.etiquetaSeleccionadaTemporal) return;

    const naipeActual = experienciaState.naipesOrdenados[experienciaState.indiceCartaActual];
    if (!naipeActual) return;

    // Calcular y guardar tiempo de la ronda
    let tiempoTranscurrido = 0;
    if (experienciaState.tiempoInicioRonda) {
      tiempoTranscurrido = Math.floor((Date.now() - experienciaState.tiempoInicioRonda) / 1000);
    }

    // Guardar emparejamiento confirmado
    const nuevasEtiquetasConfirmadas = new Map(experienciaState.etiquetasConfirmadas);
    nuevasEtiquetasConfirmadas.set(naipeActual.id, experienciaState.etiquetaSeleccionadaTemporal);

    const nuevosTiemposRondas = {
      ...experienciaState.tiemposRondas,
      [naipeActual.id]: tiempoTranscurrido,
    };

    // Guardar en Firestore
    await guardarSeleccionNaipe(
      experienciaState.etiquetaSeleccionadaTemporal,
      naipeActual.id
    );

    // Limpiar selección temporal y avanzar
    setExperienciaState((prev) => ({
      ...prev,
      etiquetasConfirmadas: nuevasEtiquetasConfirmadas,
      tiemposRondas: nuevosTiemposRondas,
      etiquetaSeleccionadaTemporal: null,
      tiempoInicioRonda: null,
    }));

    detenerTemporizadorRonda();
    avanzarCarta();
  }, [
    experienciaState.etiquetaSeleccionadaTemporal,
    experienciaState.indiceCartaActual,
    experienciaState.naipesOrdenados,
    experienciaState.tiempoInicioRonda,
    experienciaState.etiquetasConfirmadas,
    experienciaState.tiemposRondas,
    guardarSeleccionNaipe,
    detenerTemporizadorRonda,
  ]);

  // Avanzar a la siguiente carta
  const avanzarCarta = useCallback(() => {
    setExperienciaState((prev) => {
      const nuevoIndice = prev.indiceCartaActual + 1;
      return {
        ...prev,
        indiceCartaActual: nuevoIndice,
        etiquetaSeleccionadaTemporal: null,
      };
    });
  }, []);

  // Retroceder a la carta anterior
  const retrocederCarta = useCallback(() => {
    if (experienciaState.indiceCartaActual > 0) {
      detenerTemporizadorRonda();

      const naipeActual = experienciaState.naipesOrdenados[experienciaState.indiceCartaActual];
      const nuevasEtiquetasConfirmadas = new Map(experienciaState.etiquetasConfirmadas);
      const nuevosTiemposRondas = { ...experienciaState.tiemposRondas };

      if (naipeActual) {
        const etiquetaConfirmada = nuevasEtiquetasConfirmadas.get(naipeActual.id);
        if (etiquetaConfirmada) {
          nuevasEtiquetasConfirmadas.delete(naipeActual.id);
          delete nuevosTiemposRondas[naipeActual.id];
        }
      }

      setExperienciaState((prev) => ({
        ...prev,
        indiceCartaActual: prev.indiceCartaActual - 1,
        etiquetasConfirmadas: nuevasEtiquetasConfirmadas,
        tiemposRondas: nuevosTiemposRondas,
        etiquetaSeleccionadaTemporal: null,
        tiempoInicioRonda: null,
      }));
    }
  }, [
    experienciaState.indiceCartaActual,
    experienciaState.naipesOrdenados,
    experienciaState.etiquetasConfirmadas,
    experienciaState.tiemposRondas,
    detenerTemporizadorRonda,
  ]);

  // Obtener naipe actual
  const naipeActual = experienciaState.naipesOrdenados[experienciaState.indiceCartaActual] || null;

  // Obtener etiqueta confirmada para el naipe actual
  const etiquetaConfirmada = naipeActual
    ? experienciaState.etiquetasConfirmadas.get(naipeActual.id) || null
    : null;

  // Obtener etiquetas disponibles (excluyendo las ya confirmadas, excepto la del naipe actual)
  const etiquetasDisponibles = state.etiquetasDisponibles.filter((etiqueta) => {
    const etiquetasConfirmadasArray = Array.from(experienciaState.etiquetasConfirmadas.values());
    if (etiquetasConfirmadasArray.includes(etiqueta.id)) {
      return etiqueta.id === etiquetaConfirmada;
    }
    return true;
  });

  // Verificar si todas las cartas han sido procesadas
  const todasLasCartasProcesadas =
    experienciaState.indiceCartaActual >= experienciaState.naipesOrdenados.length;

  // Calcular tiempo transcurrido de la ronda actual
  const tiempoTranscurridoRonda = experienciaState.tiempoInicioRonda
    ? Math.floor((Date.now() - experienciaState.tiempoInicioRonda) / 1000)
    : 0;

  // Limpiar interval al desmontar
  useEffect(() => {
    return () => {
      if (tiempoRondaIntervalRef.current) {
        clearInterval(tiempoRondaIntervalRef.current);
      }
    };
  }, []);

  return {
    naipesOrdenados: experienciaState.naipesOrdenados,
    indiceCartaActual: experienciaState.indiceCartaActual,
    naipeActual,
    etiquetaConfirmada,
    etiquetaSeleccionadaTemporal: experienciaState.etiquetaSeleccionadaTemporal,
    etiquetasDisponibles,
    etiquetasConfirmadas: experienciaState.etiquetasConfirmadas,
    tiemposRondas: experienciaState.tiemposRondas,
    tiempoTranscurridoRonda,
    todasLasCartasProcesadas,
    inicializarExperiencia,
    iniciarTemporizadorRonda,
    detenerTemporizadorRonda,
    seleccionarEtiquetaTemporal,
    confirmarSeleccion,
    avanzarCarta,
    retrocederCarta,
  };
};
