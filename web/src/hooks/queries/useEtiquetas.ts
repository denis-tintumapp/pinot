/**
 * Hook de TanStack Query para cargar etiquetas de un evento
 */

import { useQuery } from '@tanstack/react-query';
import {
  collection,
  query,
  where,
  getDocs,
  getFirestore
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../../../js/core/firebase-config';
import { type Etiqueta } from '../../schemas/etiqueta.schema';

/**
 * Función para cargar etiquetas desde Firestore
 */
async function fetchEtiquetas(eventoId: string): Promise<Etiqueta[]> {
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
  const etiquetasUnicas = new Set<string>();

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const etiquetaId = data.etiquetaId || '';
    const etiquetaNombre = data.etiquetaNombre || '';

    if (etiquetaId && etiquetaNombre && !etiquetasUnicas.has(etiquetaId)) {
      etiquetasData.push({
        id: etiquetaId,
        nombre: etiquetaNombre
      });
      etiquetasUnicas.add(etiquetaId);
    }
  });

  return etiquetasData;
}

/**
 * Hook para obtener etiquetas de un evento usando TanStack Query
 */
export function useEtiquetasQuery(eventoId: string | null) {
  return useQuery({
    queryKey: ['etiquetas', eventoId],
    queryFn: () => {
      if (!eventoId) {
        throw new Error('No se especificó un evento');
      }
      return fetchEtiquetas(eventoId);
    },
    enabled: !!eventoId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

