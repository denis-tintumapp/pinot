/**
 * Hook para cargar datos del evento (versión pública, sin autenticación)
 */

import { useState, useEffect } from 'react';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../../js/core/firebase-config.ts';

interface EventoData {
  id: string;
  nombre: string;
  pin: string;
  fecha?: string;
  activo?: boolean;
  resultadosRevelados?: boolean;
  [key: string]: any;
}

export const useEventoPublico = (eventoId: string | null) => {
  const [evento, setEvento] = useState<EventoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarEvento = async () => {
      if (!eventoId) {
        setError('No se especificó un evento');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

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

        // Cargar evento (sin verificación de permisos)
        const eventoRef = doc(db, 'eventos', eventoId);
        const eventoSnap = await getDoc(eventoRef);

        if (!eventoSnap.exists()) {
          setError('El evento no existe');
          setLoading(false);
          return;
        }

        const eventoData = eventoSnap.data() as EventoData;

        setEvento({
          ...eventoData,
          id: eventoSnap.id
        } as EventoData);
      } catch (err: any) {
        console.error('[useEventoPublico] Error:', err);
        setError(err.message || 'Error al cargar el evento');
      } finally {
        setLoading(false);
      }
    };

    cargarEvento();
  }, [eventoId]);

  return { evento, loading, error };
};











