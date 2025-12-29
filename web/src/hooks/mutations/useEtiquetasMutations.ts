/**
 * Hooks de TanStack Query para mutations de etiquetas
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  getFirestore,
  serverTimestamp
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../../../js/core/firebase-config';
import { registrarCreacion, registrarEliminacion } from '../../utils/logger';
import { CreateEtiquetaFirestoreSchema } from '../../schemas/etiqueta.schema';
import { validateBeforeFirestore } from '../../lib/validation';

interface Etiqueta {
  id: string;
  nombre: string;
}

interface GuardarEtiquetasParams {
  eventoId: string;
  etiquetas: Etiqueta[];
}

/**
 * Hook para guardar etiquetas (reemplaza todas las existentes)
 */
export function useGuardarEtiquetas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventoId, etiquetas }: GuardarEtiquetasParams) => {
      if (etiquetas.length === 0) {
        throw new Error('Cargá al menos una etiqueta');
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
      const etiquetasRef = collection(db, 'etiquetas');
      const q = query(etiquetasRef, where('eventoId', '==', eventoId));
      const querySnapshot = await getDocs(q);

      // Eliminar etiquetas existentes
      const deletePromises: Promise<void>[] = [];
      const logDeletePromises: Promise<void>[] = [];

      querySnapshot.forEach((docSnap) => {
        const datosAnteriores = docSnap.data();
        deletePromises.push(deleteDoc(docSnap.ref));
        logDeletePromises.push(
          registrarEliminacion('etiquetas', docSnap.id, datosAnteriores).catch(err => {
            console.warn('Error al registrar log de eliminación:', err);
          })
        );
      });

      await Promise.all(deletePromises);
      await Promise.all(logDeletePromises);

      // Crear nuevas etiquetas
      const createPromises = etiquetas.map((etq, idx) => {
        // Validar datos antes de guardar
        const nuevaEtiquetaValidada = validateBeforeFirestore(
          CreateEtiquetaFirestoreSchema,
          {
            eventoId: eventoId,
            etiquetaId: etq.id,
            etiquetaNombre: etq.nombre,
            naipeId: '', // Vacío hasta que se revelen los resultados
            naipeNombre: '', // Vacío hasta que se revelen los resultados
            orden: idx + 1,
          },
          `crear etiqueta ${etq.id}`
        );

        const nuevaEtiqueta = {
          ...nuevaEtiquetaValidada,
          creadoEn: serverTimestamp()
        };

        return addDoc(etiquetasRef, nuevaEtiqueta).then(async (docRef) => {
          await registrarCreacion('etiquetas', docRef.id, nuevaEtiqueta).catch(err => {
            console.warn('Error al registrar log de creación:', err);
          });
        });
      });

      await Promise.all(createPromises);
      return { eventoId };
    },
    onSuccess: (data) => {
      // Invalidar query de etiquetas
      if (data?.eventoId) {
        queryClient.invalidateQueries({ queryKey: ['etiquetas', data.eventoId] });
      }
    },
  });
}

