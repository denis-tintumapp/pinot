/**
 * Hook de TanStack Query con Firestore listeners para sincronización en tiempo real
 * Combina TanStack Query con onSnapshot de Firestore para actualizaciones automáticas de participantes
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  collection,
  query,
  where,
  onSnapshot,
  getFirestore
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../../../js/core/firebase-config';
import { ParticipanteSchema, type Participante } from '../../schemas/participante.schema';
import { validateFirestoreData } from '../../lib/validation';

/**
 * Hook para suscribirse a cambios en tiempo real de participantes de un evento
 * Actualiza automáticamente el cache de TanStack Query
 */
export function useParticipantesRealtime(eventoId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!eventoId) {
      return;
    }

    let app;
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    if (!app) {
      console.error('[useParticipantesRealtime] No se pudo inicializar Firebase');
      return;
    }

    const db = getFirestore(app);
    const participantesRef = collection(db, 'participantes');
    const q = query(participantesRef, where('eventoId', '==', eventoId));

    // Suscribirse a cambios en tiempo real
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
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
            console.error(`[useParticipantesRealtime] Error validando participante ${docSnap.id}:`, error);
          }
        });

        // Actualizar el cache de TanStack Query
        queryClient.setQueryData(['participantes', eventoId], participantesData);
      },
      (error) => {
        console.error(`[useParticipantesRealtime] Error en listener de participantes para evento ${eventoId}:`, error);
      }
    );

    // Limpiar suscripción al desmontar
    return () => {
      unsubscribe();
    };
  }, [eventoId, queryClient]);
}

