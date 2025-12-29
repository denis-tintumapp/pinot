/**
 * Hook para gestionar calificaciones de etiquetas con estrellas
 */

import { useCallback } from 'react';
import { useParticipacion, ParticipacionState } from './useParticipacion';

export const useCalificaciones = (
  eventoId: string | null,
  state: ParticipacionState,
  guardarCalificaciones: (calificaciones: Record<string, number>) => Promise<void>
) => {
  // Calificar una etiqueta específica
  const calificarEtiqueta = useCallback(
    async (etiquetaId: string, calificacion: number) => {
      if (calificacion < 1 || calificacion > 5) {
        console.warn('Calificación debe estar entre 1 y 5');
        return;
      }

      const nuevasCalificaciones = {
        ...state.calificacionesEtiquetas,
        [etiquetaId]: calificacion,
      };

      await guardarCalificaciones(nuevasCalificaciones);
    },
    [state.calificacionesEtiquetas, guardarCalificaciones]
  );

  // Validar que todas las etiquetas estén calificadas
  const validarCalificacionesCompletas = useCallback(() => {
    const etiquetasConSeleccion = Object.keys(state.seleccionesNaipes);
    
    if (etiquetasConSeleccion.length === 0) {
      return { completas: false, mensaje: 'No hay selecciones para calificar' };
    }

    const sinCalificar: string[] = [];
    etiquetasConSeleccion.forEach((etiquetaId) => {
      const calificacion = state.calificacionesEtiquetas[etiquetaId];
      if (!calificacion || calificacion === 0) {
        const etiqueta = state.etiquetasDisponibles.find((e) => e.id === etiquetaId);
        if (etiqueta) {
          sinCalificar.push(etiqueta.nombre);
        }
      }
    });

    return {
      completas: sinCalificar.length === 0,
      sinCalificar,
      mensaje:
        sinCalificar.length > 0
          ? `Faltan calificar: ${sinCalificar.join(', ')}`
          : 'Todas las selecciones están calificadas',
    };
  }, [state.seleccionesNaipes, state.calificacionesEtiquetas, state.etiquetasDisponibles]);

  // Obtener calificación de una etiqueta
  const obtenerCalificacion = useCallback(
    (etiquetaId: string): number => {
      return state.calificacionesEtiquetas[etiquetaId] || 0;
    },
    [state.calificacionesEtiquetas]
  );

  return {
    calificarEtiqueta,
    validarCalificacionesCompletas,
    obtenerCalificacion,
    calificaciones: state.calificacionesEtiquetas,
  };
};
