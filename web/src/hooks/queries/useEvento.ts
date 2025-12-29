/**
 * Hook de TanStack Query para cargar datos de un evento
 */

import { useQuery } from '@tanstack/react-query';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../../../js/core/firebase-config';
import { getUsuarioActualAuth } from '../../../js/auth/auth.js';
import { useAuthStore } from '../../stores/authStore';
import { EventoSchema, type Evento } from '../../schemas/evento.schema';
import { validateFirestoreData } from '../../lib/validation';

/**
 * Función para cargar un evento desde Firestore
 */
async function fetchEvento(eventoId: string): Promise<Evento> {
  // Verificar autenticación
  const user = getUsuarioActualAuth();
  const { anfitrionId: anfitrionIdFromStore } = useAuthStore.getState();
  let anfitrionId: string | null = null;

  if (user) {
    anfitrionId = user.uid;
  } else {
    anfitrionId = anfitrionIdFromStore;
  }

  if (!anfitrionId) {
    throw new Error('No autenticado');
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

  // Cargar evento
  const eventoRef = doc(db, 'eventos', eventoId);
  const eventoSnap = await getDoc(eventoRef);

  if (!eventoSnap.exists()) {
    throw new Error('El evento no existe');
  }

  const eventoData = eventoSnap.data();

  // Validar datos con Zod
  const eventoValidado = validateFirestoreData(
    EventoSchema,
    {
      ...eventoData,
      id: eventoSnap.id
    },
    `evento ${eventoId}`
  );

  // Verificar que el evento pertenece al anfitrión
  if (eventoValidado.anfitrionId !== anfitrionId) {
    throw new Error('No tienes permiso para configurar este evento');
  }

  return eventoValidado;
}

/**
 * Hook para obtener un evento por ID usando TanStack Query
 */
export function useEventoQuery(eventoId: string | null) {
  return useQuery({
    queryKey: ['evento', eventoId],
    queryFn: () => {
      if (!eventoId) {
        throw new Error('No se especificó un evento');
      }
      return fetchEvento(eventoId);
    },
    enabled: !!eventoId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

