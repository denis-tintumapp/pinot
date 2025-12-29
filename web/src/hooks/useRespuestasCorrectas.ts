/**
 * Hook para cargar respuestas correctas del anfitrión
 */

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  getFirestore
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../../js/core/firebase-config.ts';
import { NAIPES_TRUCO } from '../../js/constantes.ts';

interface RespuestaCorrecta {
  etiquetaId: string;
  etiquetaNombre: string;
  naipeId: string;
  naipeNombre: string;
  naipeRank: number;
}

export const useRespuestasCorrectas = (eventoId: string | null) => {
  const [respuestas, setRespuestas] = useState<RespuestaCorrecta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      if (!eventoId) {
        setRespuestas([]);
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

        // Buscar selección del anfitrión
        const seleccionesRef = collection(db, 'selecciones');
        const q = query(
          seleccionesRef,
          where('eventoId', '==', eventoId),
          where('sesionId', '==', 'ANFITRION'),
          where('finalizado', '==', true)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setRespuestas([]);
          setLoading(false);
          return;
        }

        const anfitrionDoc = querySnapshot.docs[0];
        const anfitrionData = anfitrionDoc.data();
        const seleccionesNaipes = anfitrionData.seleccionesNaipes || {};
        const seleccionesEtiquetas = anfitrionData.seleccionesEtiquetas || {};

        // Cargar etiquetas del evento
        const etiquetasRef = collection(db, 'etiquetas');
        const etiquetasQuery = query(etiquetasRef, where('eventoId', '==', eventoId));
        const etiquetasSnapshot = await getDocs(etiquetasQuery);

        const etiquetas: Array<{ id: string; nombre: string }> = [];
        etiquetasSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.etiquetaId && data.etiquetaNombre) {
            etiquetas.push({
              id: data.etiquetaId,
              nombre: data.etiquetaNombre
            });
          }
        });

        // Cargar naipes desde el documento del evento
        const eventoRef = doc(db, 'eventos', eventoId);
        const eventoSnap = await getDoc(eventoRef);
        const naipes: Array<{ id: string; nombre: string }> = [];

        if (eventoSnap.exists()) {
          const eventoData = eventoSnap.data();
          const naipesArray = eventoData.naipes || [];
          naipes.push(...naipesArray.map((n: any) => ({
            id: n.id || n,
            nombre: n.nombre || n
          })));
        }

        // Crear array de etiquetas con sus naipes
        const etiquetasConNaipes: RespuestaCorrecta[] = [];
        Object.keys(seleccionesNaipes).forEach((etiquetaId) => {
          const naipeId = seleccionesNaipes[etiquetaId];
          const etiquetaNombre = seleccionesEtiquetas[etiquetaId] || etiquetas.find(e => e.id === etiquetaId)?.nombre || 'Etiqueta desconocida';
          const naipe = naipes.find(n => n.id === naipeId);
          const naipeNombre = naipe ? naipe.nombre : 'Naipe desconocido';

          // Obtener el rank del naipe desde NAIPES_TRUCO
          const naipeInfo = NAIPES_TRUCO.find((n: any) => n.id === naipeId);
          const naipeRank = naipeInfo ? naipeInfo.rank : 999;

          etiquetasConNaipes.push({
            etiquetaId,
            etiquetaNombre,
            naipeId,
            naipeNombre,
            naipeRank
          });
        });

        // Ordenar por rank del naipe (menor rank = más fuerte, va primero)
        etiquetasConNaipes.sort((a, b) => {
          if (a.naipeRank !== b.naipeRank) {
            return a.naipeRank - b.naipeRank;
          }
          return a.etiquetaNombre.localeCompare(b.etiquetaNombre);
        });

        setRespuestas(etiquetasConNaipes);
      } catch (err: any) {
        console.error('[useRespuestasCorrectas] Error:', err);
        setError(err.message || 'Error al cargar respuestas correctas');
        setRespuestas([]);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [eventoId]);

  return { respuestas, loading, error };
};











