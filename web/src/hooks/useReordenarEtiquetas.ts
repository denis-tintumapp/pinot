/**
 * Hook para gestionar el reordenamiento de etiquetas (ranking)
 * Permite drag & drop para cambiar el orden de preferencia
 */

import { useCallback } from 'react';
import { ParticipacionState } from './useParticipacion';

export const useReordenarEtiquetas = (
  state: ParticipacionState,
  guardarOrdenEtiquetas: (orden: string[]) => Promise<void>
) => {
  // Reordenar etiquetas moviendo una de una posición a otra
  const reordenarEtiquetas = useCallback(
    async (etiquetaIdOrigen: string, etiquetaIdDestino: string) => {
      const ordenActual = state.ordenEtiquetas.length > 0
        ? [...state.ordenEtiquetas]
        : state.etiquetasDisponibles.map((e) => e.id);

      const indiceOrigen = ordenActual.indexOf(etiquetaIdOrigen);
      const indiceDestino = ordenActual.indexOf(etiquetaIdDestino);

      if (indiceOrigen === -1 || indiceDestino === -1) {
        console.warn('No se encontraron las etiquetas en el orden actual');
        return;
      }

      // Remover del índice original
      ordenActual.splice(indiceOrigen, 1);
      // Insertar en el nuevo índice
      ordenActual.splice(indiceDestino, 0, etiquetaIdOrigen);

      await guardarOrdenEtiquetas(ordenActual);
    },
    [state.ordenEtiquetas, state.etiquetasDisponibles, guardarOrdenEtiquetas]
  );

  // Obtener orden actual de etiquetas (inicializar si está vacío)
  const obtenerOrdenEtiquetas = useCallback(() => {
    if (state.ordenEtiquetas.length > 0) {
      return state.ordenEtiquetas;
    }
    return state.etiquetasDisponibles.map((e) => e.id);
  }, [state.ordenEtiquetas, state.etiquetasDisponibles]);

  // Obtener etiquetas ordenadas según el orden de preferencia
  const obtenerEtiquetasOrdenadas = useCallback(() => {
    const orden = obtenerOrdenEtiquetas();
    return orden
      .map((etiquetaId) => state.etiquetasDisponibles.find((e) => e.id === etiquetaId))
      .filter((e): e is { id: string; nombre: string } => e !== undefined);
  }, [state.etiquetasDisponibles, obtenerOrdenEtiquetas]);

  return {
    reordenarEtiquetas,
    obtenerOrdenEtiquetas,
    obtenerEtiquetasOrdenadas,
    ordenEtiquetas: obtenerOrdenEtiquetas(),
  };
};
