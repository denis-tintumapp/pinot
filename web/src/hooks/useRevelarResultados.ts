/**
 * Hook para revelar resultados del evento
 */

import { useState } from 'react';
import { revelarResultadosEvento } from '../../js/firestore.js'; // firestore.js aún se usa, pero ahora usa firebase-config.ts

export const useRevelarResultados = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const revelar = async (eventoId: string): Promise<{ success: boolean; error?: string }> => {
    if (!eventoId) {
      return { success: false, error: 'Evento ID es requerido' };
    }

    try {
      setLoading(true);
      setError(null);

      const resultado = await revelarResultadosEvento(eventoId);

      if (resultado.ok) {
        return { success: true };
      } else {
        const errorMsg = resultado.error || 'Error al revelar resultados';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: any) {
      console.error('[useRevelarResultados] Error:', err);
      const errorMsg = err.message || 'Error al revelar resultados';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  return { revelar, loading, error };
};











