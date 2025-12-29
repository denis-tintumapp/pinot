/**
 * Hook para gestionar naipes del evento
 */

import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, getFirestore } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../../js/core/firebase-config.ts';
import { NAIPES_TRUCO } from '../../js/constantes.ts';

interface NaipeSeleccionado {
  id: string;
  nombre: string;
}

export const useNaipes = (eventoId: string | null) => {
  const [naipesSeleccionados, setNaipesSeleccionados] = useState<NaipeSeleccionado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarNaipes = async () => {
    if (!eventoId) {
      setNaipesSeleccionados([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let app;
      if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
      } else {
        app = getApps()[0];
      }

      if (!app) {
        throw new Error('No se pudo inicializar Firebase');
      }

      const db = getFirestore(app);
      const eventoRef = doc(db, 'eventos', eventoId);
      const eventoSnap = await getDoc(eventoRef);

      if (eventoSnap.exists()) {
        const eventoData = eventoSnap.data();
        const naipesArray = eventoData.naipes || [];

        // Convertir el array de naipes a formato esperado
        const naipes = naipesArray.map((n: any) => ({
          id: n.id || n,
          nombre: n.nombre || n
        }));

        setNaipesSeleccionados(naipes);
      } else {
        setNaipesSeleccionados([]);
      }
    } catch (err: any) {
      console.error('[useNaipes] Error al cargar:', err);
      setError(err.message || 'Error al cargar naipes');
      setNaipesSeleccionados([]);
    } finally {
      setLoading(false);
    }
  };

  const agregarNaipe = (naipeId: string): { success: boolean; error?: string } => {
    const naipe = NAIPES_TRUCO.find(n => n.id === naipeId);
    if (!naipe) {
      return { success: false, error: 'Naipe inválido' };
    }

    if (naipesSeleccionados.some(n => n.id === naipeId)) {
      return { success: false, error: 'Ese naipe ya fue seleccionado. Elegí otro' };
    }

    setNaipesSeleccionados([...naipesSeleccionados, { id: naipe.id, nombre: naipe.nombre }]);
    return { success: true };
  };

  const quitarNaipe = (naipeId: string) => {
    setNaipesSeleccionados(naipesSeleccionados.filter(n => n.id !== naipeId));
  };

  const sugerirNaipes = (maxNaipes: number): { success: boolean; sugeridos: number; error?: string } => {
    const ya = naipesSeleccionados.length;
    const faltan = maxNaipes - ya;

    if (faltan <= 0) {
      return { success: false, sugeridos: 0, error: 'Ya tenés asignados naipes para todas las etiquetas' };
    }

    const disponibles = NAIPES_TRUCO.filter(
      n => !naipesSeleccionados.some(sel => sel.id === n.id)
    ).slice(0, faltan);

    const nuevosNaipes = disponibles.map(n => ({ id: n.id, nombre: n.nombre }));
    setNaipesSeleccionados([...naipesSeleccionados, ...nuevosNaipes]);

    return { success: true, sugeridos: disponibles.length };
  };

  const guardarNaipes = async (): Promise<{ success: boolean; error?: string }> => {
    if (!eventoId) {
      return { success: false, error: 'No hay evento seleccionado' };
    }

    try {
      let app;
      if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
      } else {
        app = getApps()[0];
      }

      if (!app) {
        throw new Error('No se pudo inicializar Firebase');
      }

      const db = getFirestore(app);
      const eventoRef = doc(db, 'eventos', eventoId);
      const naipesArray = naipesSeleccionados.map(n => ({
        id: n.id,
        nombre: n.nombre
      }));

      await updateDoc(eventoRef, {
        naipes: naipesArray
      });

      // Registrar log (opcional)
      try {
        const { registrarLog } = await import('../../js/admin/admin-logger.js');
        await registrarLog(
          'update',
          'eventos',
          eventoId,
          { naipes: naipesArray },
          undefined,
          `Naipes guardados en evento: ${naipesArray.length} naipes`,
          'Anfitrión'
        );
      } catch (logError) {
        console.warn('Error al registrar log de naipes:', logError);
      }

      return { success: true };
    } catch (err: any) {
      console.error('[useNaipes] Error al guardar:', err);
      return { success: false, error: err.message || 'Error al guardar naipes' };
    }
  };

  useEffect(() => {
    if (eventoId) {
      cargarNaipes();
    }
  }, [eventoId]);

  return {
    naipesSeleccionados,
    loading,
    error,
    cargarNaipes,
    agregarNaipe,
    quitarNaipe,
    sugerirNaipes,
    guardarNaipes
  };
};











