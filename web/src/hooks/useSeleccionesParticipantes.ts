/**
 * Hook para cargar selecciones de participantes en tiempo real
 */

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  getFirestore
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../../js/core/firebase-config.ts';

interface SeleccionParticipante {
  id: string;
  nombreParticipante: string;
  sesionId: string;
  eventoId: string;
  seleccionesNaipes: Record<string, string>; // etiquetaId -> naipeId
  seleccionesEtiquetas: Record<string, string>; // etiquetaId -> etiquetaNombre
  ordenEtiquetas: string[];
  finalizado: boolean;
  creadoEn?: any;
  actualizadoEn?: any;
}

export const useSeleccionesParticipantes = (eventoId: string | null) => {
  const [selecciones, setSelecciones] = useState<SeleccionParticipante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventoId) {
      setSelecciones([]);
      setLoading(false);
      return;
    }

    let app;
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    if (!app) {
      setError('No se pudo inicializar Firebase');
      setLoading(false);
      return;
    }

    const db = getFirestore(app);
    const seleccionesRef = collection(db, 'selecciones');
    const q = query(
      seleccionesRef,
      where('eventoId', '==', eventoId)
    );

    // Escuchar cambios en tiempo real
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        try {
          const seleccionesData: SeleccionParticipante[] = [];

          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            // Excluir selecciones del anfitrión (sesionId === 'ANFITRION')
            if (data.sesionId !== 'ANFITRION') {
              seleccionesData.push({
                id: docSnap.id,
                ...data
              } as SeleccionParticipante);
            }
          });

          // Ordenar por nombre del participante
          seleccionesData.sort((a, b) => {
            const nombreA = a.nombreParticipante || '';
            const nombreB = b.nombreParticipante || '';
            return nombreA.localeCompare(nombreB);
          });

          setSelecciones(seleccionesData);
          setError(null);
        } catch (err: any) {
          console.error('[useSeleccionesParticipantes] Error:', err);
          setError(err.message || 'Error al cargar selecciones');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('[useSeleccionesParticipantes] Error en snapshot:', err);
        setError(err.message || 'Error al escuchar selecciones');
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [eventoId]);

  return { selecciones, loading, error };
};











