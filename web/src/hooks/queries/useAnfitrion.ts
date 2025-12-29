/**
 * Hook de TanStack Query para obtener datos de un anfitrión
 */

import { useQuery } from '@tanstack/react-query';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../../../js/core/firebase-config';
import { AnfitrionSchema, type Anfitrion } from '../../schemas/anfitrion.schema';
import { validateFirestoreData } from '../../lib/validation';

/**
 * Función para cargar un anfitrión desde Firestore
 */
async function fetchAnfitrion(anfitrionId: string): Promise<Anfitrion> {
  if (!anfitrionId) {
    throw new Error('No se especificó un anfitrión');
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
  const anfitrionRef = doc(db, 'anfitriones', anfitrionId);
  const anfitrionSnap = await getDoc(anfitrionRef);

  if (!anfitrionSnap.exists()) {
    throw new Error('El anfitrión no existe');
  }

  // Validar datos con Zod
  const anfitrionValidado = validateFirestoreData(
    AnfitrionSchema,
    {
      id: anfitrionSnap.id,
      ...anfitrionSnap.data()
    },
    `anfitrion ${anfitrionId}`
  );

  return anfitrionValidado;
}

/**
 * Hook para obtener un anfitrión por ID usando TanStack Query
 */
export function useAnfitrionQuery(anfitrionId: string | null) {
  return useQuery({
    queryKey: ['anfitrion', anfitrionId],
    queryFn: () => {
      if (!anfitrionId) {
        throw new Error('No se especificó un anfitrión');
      }
      return fetchAnfitrion(anfitrionId);
    },
    enabled: !!anfitrionId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

