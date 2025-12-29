/**
 * Hook para verificar si el anfitrión tiene un evento activo
 * Refactorizado para usar TanStack Query
 */

import { useEventoActivoQuery } from './queries/useEventoActivo';

interface EventoActivo {
  id: string;
  nombre: string;
  pin: string;
  activo: boolean;
  [key: string]: any;
}

/**
 * Hook para obtener evento activo
 * Mantiene la misma interfaz pública para compatibilidad
 */
export const useEventoActivo = () => {
  const { data: eventoActivo, isLoading: loading, error } = useEventoActivoQuery();

  // Convertir error a string para mantener compatibilidad
  const errorMessage = error ? (error instanceof Error ? error.message : String(error)) : null;

  return {
    eventoActivo: eventoActivo || null,
    loading,
    error: errorMessage
  };
};











