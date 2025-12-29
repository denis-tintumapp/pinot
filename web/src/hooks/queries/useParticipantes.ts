/**
 * Hook de TanStack Query para cargar participantes de un evento
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
import { ParticipanteSchema, type Participante } from '../../schemas/participante.schema';
import { validateFirestoreData } from '../../lib/validation';

/**
 * Función para cargar participantes desde Firestore
 */
async function fetchParticipantes(eventoId: string): Promise<Participante[]> {
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
  const participantesRef = collection(db, 'participantes');
  const q = query(participantesRef, where('eventoId', '==', eventoId));
  const querySnapshot = await getDocs(q);

  const participantesData: Participante[] = [];
  querySnapshot.forEach((docSnap) => {
    try {
      const participanteValidado = validateFirestoreData(
        ParticipanteSchema,
        {
          id: docSnap.id,
          ...docSnap.data()
        },
        `participante ${docSnap.id}`
      );
      participantesData.push(participanteValidado);
    } catch (error) {
      console.error(`[useParticipantes] Error validando participante ${docSnap.id}:`, error);
      // Continuar con otros participantes aunque uno falle
    }
  });

  return participantesData;
}

/**
 * Hook para obtener participantes de un evento usando TanStack Query
 */
export function useParticipantesQuery(eventoId: string | null) {
  return useQuery({
    queryKey: ['participantes', eventoId],
    queryFn: () => {
      if (!eventoId) {
        throw new Error('No se especificó un evento');
      }
      return fetchParticipantes(eventoId);
    },
    enabled: !!eventoId,
    staleTime: 2 * 60 * 1000, // 2 minutos - participantes cambian más frecuentemente
  });
}

