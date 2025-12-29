/**
 * Hook para cargar y gestionar etiquetas en el panel de administración
 */

import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getFirestore,
  getDoc
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../../js/core/firebase-config.ts';

interface Etiqueta {
  id: string;
  etiquetaId?: string;
  etiquetaNombre?: string;
  eventoId?: string;
  naipeId?: string;
  naipeNombre?: string;
  orden?: number;
  votacionesAcumuladas?: Record<string, number>;
  creadoEn?: any;
}

export const useAdminEtiquetas = () => {
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarEtiquetas = async () => {
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
      const etiquetasRef = collection(db, 'etiquetas');
      const querySnapshot = await getDocs(etiquetasRef);

      const etiquetasData: Etiqueta[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        etiquetasData.push({
          id: docSnap.id,
          ...data
        } as Etiqueta);
      });

      // Cargar selecciones de participantes para calcular votaciones acumuladas
      const seleccionesRef = collection(db, 'selecciones');
      const seleccionesSnapshot = await getDocs(seleccionesRef);

      const votacionesPorEtiqueta: Record<string, Record<string, number>> = {};

      seleccionesSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.finalizado && data.sesionId !== 'ANFITRION' && data.seleccionesNaipes) {
          Object.keys(data.seleccionesNaipes).forEach(etiquetaId => {
            const naipeId = data.seleccionesNaipes[etiquetaId];
            if (naipeId) {
              if (!votacionesPorEtiqueta[etiquetaId]) {
                votacionesPorEtiqueta[etiquetaId] = {};
              }
              if (!votacionesPorEtiqueta[etiquetaId][naipeId]) {
                votacionesPorEtiqueta[etiquetaId][naipeId] = 0;
              }
              votacionesPorEtiqueta[etiquetaId][naipeId]++;
            }
          });
        }
      });

      // Agregar votaciones acumuladas a cada etiqueta
      etiquetasData.forEach(etiqueta => {
        etiqueta.votacionesAcumuladas = votacionesPorEtiqueta[etiqueta.etiquetaId || ''] || {};
      });

      // Ordenar por fecha de creación (más reciente primero)
      etiquetasData.sort((a, b) => {
        const fechaA = a.creadoEn?.toMillis?.() || a.creadoEn || 0;
        const fechaB = b.creadoEn?.toMillis?.() || b.creadoEn || 0;
        return fechaB - fechaA;
      });

      setEtiquetas(etiquetasData);
    } catch (err: any) {
      console.error('[useAdminEtiquetas] Error:', err);
      setError(err.message || 'Error al cargar etiquetas');
    } finally {
      setLoading(false);
    }
  };

  const actualizarEtiqueta = async (id: string, datos: Partial<Etiqueta>): Promise<{ success: boolean; error?: string }> => {
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
      const etiquetaRef = doc(db, 'etiquetas', id);
      
      // Obtener datos anteriores antes de actualizar
      const etiquetaSnap = await getDoc(etiquetaRef);
      const datosAnteriores = etiquetaSnap.exists() ? etiquetaSnap.data() : null;
      
      await updateDoc(etiquetaRef, datos);

      // Registrar acción en el log
      await registrarActualizacion('etiquetas', id, datos, datosAnteriores);

      await cargarEtiquetas();
      return { success: true };
    } catch (err: any) {
      console.error('[useAdminEtiquetas] Error al actualizar:', err);
      return { success: false, error: err.message || 'Error al actualizar etiqueta' };
    }
  };

  const eliminarEtiqueta = async (id: string): Promise<{ success: boolean; error?: string }> => {
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
      const etiquetaRef = doc(db, 'etiquetas', id);
      
      // Obtener datos antes de eliminar
      const etiquetaSnap = await getDoc(etiquetaRef);
      const datosAnteriores = etiquetaSnap.exists() ? etiquetaSnap.data() : null;
      
      await deleteDoc(etiquetaRef);

      // Registrar acción en el log
      if (datosAnteriores) {
        await registrarEliminacion('etiquetas', id, datosAnteriores);
      }

      await cargarEtiquetas();
      return { success: true };
    } catch (err: any) {
      console.error('[useAdminEtiquetas] Error al eliminar:', err);
      return { success: false, error: err.message || 'Error al eliminar etiqueta' };
    }
  };

  useEffect(() => {
    cargarEtiquetas();
  }, []);

  return {
    etiquetas,
    loading,
    error,
    cargarEtiquetas,
    actualizarEtiqueta,
    eliminarEtiqueta
  };
};











