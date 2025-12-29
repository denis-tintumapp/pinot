/**
 * Hook de TanStack Query para verificar evento activo del anfitrión
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
import { getUsuarioActualAuth } from '../../../js/auth/auth.js';
import { useAuthStore } from '../../stores/authStore';
import { EventoSchema, type Evento } from '../../schemas/evento.schema';
import { validateFirestoreData } from '../../lib/validation';

/**
 * Función para buscar evento activo del anfitrión
 */
async function fetchEventoActivo(): Promise<Evento | null> {
  // Obtener usuario actual
  const user = getUsuarioActualAuth();
  const { anfitrionId: anfitrionIdFromStore } = useAuthStore.getState();
  let anfitrionId: string | null = null;

  if (user) {
    anfitrionId = user.uid;
  } else {
    anfitrionId = anfitrionIdFromStore;
  }

  if (!anfitrionId) {
    return null;
  }

  // Inicializar Firebase
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

  // Buscar eventos activos del anfitrión
  const eventosRef = collection(db, 'eventos');
  const q = query(
    eventosRef,
    where('anfitrionId', '==', anfitrionId),
    where('activo', '==', true)
  );

  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty && querySnapshot.docs.length > 0) {
    const eventoDoc = querySnapshot.docs[0];
    if (eventoDoc) {
      try {
        return validateFirestoreData(
          EventoSchema,
          {
            id: eventoDoc.id,
            ...eventoDoc.data()
          },
          `evento activo ${eventoDoc.id}`
        );
      } catch (error) {
        console.error('[useEventoActivo] Error validando evento activo:', error);
        return null;
      }
    }
  }

  return null;
}

/**
 * Hook para obtener evento activo usando TanStack Query
 */
export function useEventoActivoQuery() {
  return useQuery({
    queryKey: ['eventoActivo'],
    queryFn: fetchEventoActivo,
    staleTime: 1 * 60 * 1000, // 1 minuto - evento activo puede cambiar
  });
}

