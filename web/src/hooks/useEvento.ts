/**
 * Hook para cargar y gestionar datos del evento
 * Refactorizado para usar TanStack Query con sincronización en tiempo real
 */

import { useEventoQuery } from './queries/useEvento';
import { useEventoRealtime } from './queries/useEventoRealtime';

interface EventoData {
  id: string;
  nombre: string;
  pin: string;
  anfitrionId: string;
  activo: boolean;
  naipes?: Array<{ id: string; nombre: string }>;
  [key: string]: any;
}

/**
 * Hook para obtener un evento por ID con sincronización en tiempo real
 * Mantiene la misma interfaz pública para compatibilidad
 */
export const useEvento = (eventoId: string | null) => {
  // Cargar datos iniciales con TanStack Query
  const { data: evento, isLoading: loading, error } = useEventoQuery(eventoId);

  // Activar sincronización en tiempo real
  useEventoRealtime(eventoId);

  // Convertir error a string para mantener compatibilidad
  const errorMessage = error ? (error instanceof Error ? error.message : String(error)) : null;

  return {
    evento: evento || null,
    loading,
    error: errorMessage
  };
};











