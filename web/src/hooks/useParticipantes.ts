/**
 * Hook para gestionar participantes del evento
 * Refactorizado para usar TanStack Query
 */

import { useQueryClient } from '@tanstack/react-query';
import { useParticipantesQuery } from './queries/useParticipantes';
import { useParticipantesRealtime } from './queries/useParticipantesRealtime';
import {
  useCreateParticipante,
  useUpdateParticipante,
  useDeleteParticipante
} from './mutations/useParticipantesMutations';

interface Participante {
  id: string;
  nombre: string;
  eventoId: string;
  creadoEn?: any;
}

/**
 * Hook para gestionar participantes
 * Mantiene la misma interfaz pública para compatibilidad
 */
export const useParticipantes = (eventoId: string | null) => {
  const queryClient = useQueryClient();
  const { data: participantes = [], isLoading: loading, error } = useParticipantesQuery(eventoId);
  const createMutation = useCreateParticipante();
  const updateMutation = useUpdateParticipante();
  const deleteMutation = useDeleteParticipante();

  // Activar sincronización en tiempo real
  useParticipantesRealtime(eventoId);

  // Convertir error a string para mantener compatibilidad
  const errorMessage = error ? (error instanceof Error ? error.message : String(error)) : null;

  const cargarParticipantes = async () => {
    if (eventoId) {
      await queryClient.invalidateQueries({ queryKey: ['participantes', eventoId] });
    }
  };

  const agregarParticipante = async (nombre: string): Promise<{ success: boolean; error?: string }> => {
    if (!eventoId) {
      return { success: false, error: 'No hay evento seleccionado' };
    }

    try {
      await createMutation.mutateAsync({ eventoId, nombre });
      return { success: true };
    } catch (err: any) {
      console.error('[useParticipantes] Error al agregar:', err);
      return { success: false, error: err.message || 'Error al guardar participante' };
    }
  };

  const actualizarParticipante = async (
    participanteId: string,
    nombre: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await updateMutation.mutateAsync({ participanteId, nombre });
      return { success: true };
    } catch (err: any) {
      console.error('[useParticipantes] Error al actualizar:', err);
      return { success: false, error: err.message || 'Error al actualizar participante' };
    }
  };

  const eliminarParticipante = async (participanteId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await deleteMutation.mutateAsync(participanteId);
      return { success: true };
    } catch (err: any) {
      console.error('[useParticipantes] Error al eliminar:', err);
      return { success: false, error: err.message || 'Error al eliminar participante' };
    }
  };

  return {
    participantes,
    loading,
    error: errorMessage,
    cargarParticipantes,
    agregarParticipante,
    actualizarParticipante,
    eliminarParticipante
  };
};











