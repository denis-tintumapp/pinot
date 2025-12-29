/**
 * Hook para gestionar etiquetas del evento
 * Refactorizado para usar TanStack Query
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useEtiquetasQuery } from './queries/useEtiquetas';
import { useGuardarEtiquetas } from './mutations/useEtiquetasMutations';

interface Etiqueta {
  id: string;
  nombre: string;
}

/**
 * Hook para gestionar etiquetas
 * Mantiene la misma interfaz pública para compatibilidad
 * Nota: agregarEtiqueta y actualizarEtiqueta trabajan en estado local
 * hasta que se llama a guardarEtiquetas
 */
export const useEtiquetas = (eventoId: string | null) => {
  const queryClient = useQueryClient();
  const { data: etiquetasCargadas = [], isLoading: loading, error } = useEtiquetasQuery(eventoId);
  const guardarMutation = useGuardarEtiquetas();
  
  // Estado local para etiquetas editadas (antes de guardar)
  const [etiquetasLocales, setEtiquetasLocales] = useState<Etiqueta[]>([]);
  const [etiquetasInicializadas, setEtiquetasInicializadas] = useState(false);

  // Sincronizar etiquetas locales con las cargadas
  if (etiquetasCargadas.length > 0 && !etiquetasInicializadas) {
    setEtiquetasLocales(etiquetasCargadas);
    setEtiquetasInicializadas(true);
  }

  // Usar etiquetas locales si hay, sino las cargadas
  const etiquetas = etiquetasLocales.length > 0 ? etiquetasLocales : etiquetasCargadas;

  // Convertir error a string para mantener compatibilidad
  const errorMessage = error ? (error instanceof Error ? error.message : String(error)) : null;

  const cargarEtiquetas = async () => {
    if (eventoId) {
      await queryClient.invalidateQueries({ queryKey: ['etiquetas', eventoId] });
      // Resetear estado local después de cargar
      setEtiquetasInicializadas(false);
    }
  };

  const agregarEtiqueta = (nombre: string): Etiqueta | null => {
    if (!nombre || !nombre.trim()) {
      return null;
    }

    const id = `ETQ-${etiquetas.length + 1}`;
    const nuevaEtiqueta: Etiqueta = { id, nombre: nombre.trim() };
    const nuevasEtiquetas = [...etiquetas, nuevaEtiqueta];
    setEtiquetasLocales(nuevasEtiquetas);
    return nuevaEtiqueta;
  };

  const actualizarEtiqueta = (etiquetaId: string, nombre: string): boolean => {
    if (!nombre || !nombre.trim()) {
      return false;
    }

    const nuevasEtiquetas = etiquetas.map(e => (e.id === etiquetaId ? { ...e, nombre: nombre.trim() } : e));
    setEtiquetasLocales(nuevasEtiquetas);
    return true;
  };

  const guardarEtiquetas = async (): Promise<{ success: boolean; error?: string }> => {
    if (!eventoId) {
      return { success: false, error: 'No hay evento seleccionado' };
    }

    if (etiquetas.length === 0) {
      return { success: false, error: 'Cargá al menos una etiqueta' };
    }

    try {
      await guardarMutation.mutateAsync({ eventoId, etiquetas });
      // Limpiar estado local después de guardar
      setEtiquetasLocales([]);
      setEtiquetasInicializadas(false);
      return { success: true };
    } catch (err: any) {
      console.error('[useEtiquetas] Error al guardar:', err);
      return { success: false, error: err.message || 'Error al guardar la configuración' };
    }
  };

  return {
    etiquetas,
    loading,
    error: errorMessage,
    cargarEtiquetas,
    agregarEtiqueta,
    actualizarEtiqueta,
    guardarEtiquetas
  };
};











