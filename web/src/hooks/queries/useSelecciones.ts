/**
 * Hook de TanStack Query para cargar selecciones de participantes
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
import { SeleccionSchema, type Seleccion } from '../../schemas/seleccion.schema';
import { validateFirestoreData } from '../../lib/validation';

/**
 * Función para cargar selecciones desde Firestore
 */
async function fetchSelecciones(eventoId: string): Promise<Seleccion[]> {
  if (!eventoId) {
    throw new Error('No se especificó un evento');
  }

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
  const seleccionesRef = collection(db, 'selecciones');
  const q = query(
    seleccionesRef,
    where('eventoId', '==', eventoId)
  );

  const querySnapshot = await getDocs(q);

  const seleccionesData: Seleccion[] = [];
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    
    // Excluir selecciones del anfitrión (sesionId === 'ANFITRION')
    if (data.sesionId !== 'ANFITRION') {
      try {
        const seleccionValidada = validateFirestoreData(
          SeleccionSchema,
          {
            id: docSnap.id,
            ...data
          },
          `seleccion ${docSnap.id}`
        );
        seleccionesData.push(seleccionValidada);
      } catch (error) {
        console.error(`[useSelecciones] Error validando selección ${docSnap.id}:`, error);
        // Continuar con otras selecciones aunque una falle
      }
    }
  });

  // Ordenar por nombre del participante
  seleccionesData.sort((a, b) => {
    return a.nombreParticipante.localeCompare(b.nombreParticipante);
  });

  return seleccionesData;
}

/**
 * Hook para obtener selecciones de un evento usando TanStack Query
 */
export function useSeleccionesQuery(eventoId: string | null) {
  return useQuery({
    queryKey: ['selecciones', eventoId],
    queryFn: () => {
      if (!eventoId) {
        throw new Error('No se especificó un evento');
      }
      return fetchSelecciones(eventoId);
    },
    enabled: !!eventoId,
    staleTime: 1 * 60 * 1000, // 1 minuto (datos que cambian frecuentemente)
  });
}

