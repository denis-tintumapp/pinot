/**
 * Hook de TanStack Query para listar eventos
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
 * Función para cargar eventos desde Firestore
 */
async function fetchEventos(anfitrionId?: string): Promise<Evento[]> {
  // Verificar autenticación
  const user = getUsuarioActualAuth();
  const { anfitrionId: anfitrionIdFromStore } = useAuthStore.getState();
  let anfitrionIdToUse: string | null = null;

  if (user) {
    anfitrionIdToUse = user.uid;
  } else {
    anfitrionIdToUse = anfitrionIdFromStore;
  }

  if (!anfitrionIdToUse && !anfitrionId) {
    throw new Error('No autenticado');
  }

  const finalAnfitrionId = anfitrionId || anfitrionIdToUse;

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
  const eventosRef = collection(db, 'eventos');
  
  // Si se especifica anfitrionId, filtrar por él
  const q = finalAnfitrionId
    ? query(eventosRef, where('anfitrionId', '==', finalAnfitrionId))
    : query(eventosRef);

  const querySnapshot = await getDocs(q);

  const eventosData: Evento[] = [];
  querySnapshot.forEach((docSnap) => {
    try {
      const eventoValidado = validateFirestoreData(
        EventoSchema,
        {
          id: docSnap.id,
          ...docSnap.data()
        },
        `evento ${docSnap.id}`
      );
      eventosData.push(eventoValidado);
    } catch (error) {
      console.error(`[useEventos] Error validando evento ${docSnap.id}:`, error);
      // Continuar con otros eventos aunque uno falle
    }
  });

  // Ordenar por fecha de creación (más reciente primero)
  eventosData.sort((a, b) => {
    const fechaA = a.creadoEn?.toMillis?.() || a.creadoEn || 0;
    const fechaB = b.creadoEn?.toMillis?.() || b.creadoEn || 0;
    return fechaB - fechaA;
  });

  return eventosData;
}

/**
 * Hook para obtener lista de eventos usando TanStack Query
 */
export function useEventosQuery(anfitrionId?: string) {
  return useQuery({
    queryKey: ['eventos', anfitrionId],
    queryFn: () => fetchEventos(anfitrionId),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

