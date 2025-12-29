/**
 * Hook de TanStack Query con Firestore listeners para sincronización en tiempo real
 * Combina TanStack Query con onSnapshot de Firestore para actualizaciones automáticas de selecciones
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
import { SeleccionSchema, type Seleccion } from '../../schemas/seleccion.schema';
import { validateFirestoreData } from '../../lib/validation';

/**
 * Hook para suscribirse a cambios en tiempo real de selecciones de un evento
 * Actualiza automáticamente el cache de TanStack Query
 */
export function useSeleccionesRealtime(eventoId: string | null) {
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
      console.error('[useSeleccionesRealtime] No se pudo inicializar Firebase');
      return;
    }

    const db = getFirestore(app);
    const seleccionesRef = collection(db, 'selecciones');
    const q = query(
      seleccionesRef,
      where('eventoId', '==', eventoId)
    );

    // Suscribirse a cambios en tiempo real
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
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
              console.error(`[useSeleccionesRealtime] Error validando selección ${docSnap.id}:`, error);
            }
          }
        });

        // Ordenar por nombre del participante
        seleccionesData.sort((a, b) => {
          return a.nombreParticipante.localeCompare(b.nombreParticipante);
        });

        // Actualizar el cache de TanStack Query
        queryClient.setQueryData(['selecciones', eventoId], seleccionesData);
      },
      (error) => {
        console.error(`[useSeleccionesRealtime] Error en listener de selecciones para evento ${eventoId}:`, error);
      }
    );

    // Limpiar suscripción al desmontar
    return () => {
      unsubscribe();
    };
  }, [eventoId, queryClient]);
}

