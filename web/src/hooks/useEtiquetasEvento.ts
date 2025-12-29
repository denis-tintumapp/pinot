/**
 * Hook para cargar etiquetas del evento
 */

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  getFirestore
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../../js/core/firebase-config.ts';

interface Etiqueta {
  id: string;
  etiquetaId: string;
  etiquetaNombre: string;
  naipeId?: string;
  naipeNombre?: string;
  orden: number;
}

export const useEtiquetasEvento = (eventoId: string | null) => {
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarEtiquetas = async () => {
      if (!eventoId) {
        setEtiquetas([]);
        setLoading(false);
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
        const etiquetasRef = collection(db, 'etiquetas');
        const q = query(etiquetasRef, where('eventoId', '==', eventoId));
        const querySnapshot = await getDocs(q);

        const etiquetasData: Etiqueta[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          etiquetasData.push({
            id: docSnap.id,
            etiquetaId: data.etiquetaId || '',
            etiquetaNombre: data.etiquetaNombre || '',
            naipeId: data.naipeId || undefined,
            naipeNombre: data.naipeNombre || undefined,
            orden: data.orden || 0
          });
        });

        // Ordenar por orden
        etiquetasData.sort((a, b) => a.orden - b.orden);

        setEtiquetas(etiquetasData);
      } catch (err: any) {
        console.error('[useEtiquetasEvento] Error:', err);
        setError(err.message || 'Error al cargar etiquetas');
        setEtiquetas([]);
      } finally {
        setLoading(false);
      }
    };

    cargarEtiquetas();
  }, [eventoId]);

  return { etiquetas, loading, error };
};











