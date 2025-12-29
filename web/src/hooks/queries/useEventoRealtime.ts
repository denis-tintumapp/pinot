/**
 * Hook de TanStack Query con Firestore listeners para sincronización en tiempo real
 * Combina TanStack Query con onSnapshot de Firestore para actualizaciones automáticas
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  doc,
  onSnapshot,
  getFirestore
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../../../js/core/firebase-config';
import { EventoSchema, type Evento } from '../../schemas/evento.schema';
import { validateFirestoreData } from '../../lib/validation';

/**
 * Hook para suscribirse a cambios en tiempo real de un evento
 * Actualiza automáticamente el cache de TanStack Query
 */
export function useEventoRealtime(eventoId: string | null) {
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
      console.error('[useEventoRealtime] No se pudo inicializar Firebase');
      return;
    }

    const db = getFirestore(app);
    const eventoRef = doc(db, 'eventos', eventoId);

    // Suscribirse a cambios en tiempo real
    const unsubscribe = onSnapshot(
      eventoRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          try {
            const eventoValidado = validateFirestoreData(
              EventoSchema,
              {
                id: docSnapshot.id,
                ...docSnapshot.data()
              },
              `evento ${eventoId}`
            );

            // Actualizar el cache de TanStack Query
            queryClient.setQueryData(['evento', eventoId], eventoValidado);

            // Si es el evento activo, también actualizarlo
            const eventoActivo = queryClient.getQueryData(['eventoActivo']);
            if (eventoActivo && (eventoActivo as Evento).id === eventoId) {
              queryClient.setQueryData(['eventoActivo'], eventoValidado);
            }

            // Actualizar en la lista de eventos
            queryClient.setQueryData(['eventos'], (old: Evento[] | undefined) => {
              if (!old) return [eventoValidado];
              return old.map((e) => (e.id === eventoId ? eventoValidado : e));
            });
          } catch (error) {
            console.error(`[useEventoRealtime] Error validando evento ${eventoId}:`, error);
          }
        } else {
          // El evento fue eliminado
          queryClient.setQueryData(['evento', eventoId], undefined);
          
          // Eliminar de la lista de eventos
          queryClient.setQueryData(['eventos'], (old: Evento[] | undefined) => {
            if (!old) return [];
            return old.filter((e) => e.id !== eventoId);
          });

          // Si era el evento activo, limpiarlo
          const eventoActivo = queryClient.getQueryData(['eventoActivo']);
          if (eventoActivo && (eventoActivo as Evento).id === eventoId) {
            queryClient.setQueryData(['eventoActivo'], null);
          }
        }
      },
      (error) => {
        console.error(`[useEventoRealtime] Error en listener de evento ${eventoId}:`, error);
      }
    );

    // Limpiar suscripción al desmontar
    return () => {
      unsubscribe();
    };
  }, [eventoId, queryClient]);
}

