/**
 * Hooks de TanStack Query para mutations de participantes
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../../../js/core/firebase-config';
import { registrarCreacion, registrarActualizacion, registrarEliminacion } from '../../utils/logger';
import type { TipoParticipante } from '../../utils/participantes';
import { CreateParticipanteSchema } from '../../schemas/participante.schema';
import { validateBeforeFirestore } from '../../lib/validation';

interface CreateParticipanteParams {
  eventoId: string;
  nombre: string;
}

interface UpdateParticipanteParams {
  participanteId: string;
  nombre: string;
}

/**
 * Hook para crear un participante
 * Con optimistic updates para mejor UX
 */
export function useCreateParticipante() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventoId, nombre }: CreateParticipanteParams) => {
      if (!nombre || !nombre.trim()) {
        throw new Error('Ingresá un nombre');
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
      const participantesRef = collection(db, 'participantes');
      
      // Validar datos antes de guardar
      const nuevoParticipante = validateBeforeFirestore(
        CreateParticipanteSchema,
        {
          eventoId: eventoId,
          nombre: nombre.trim(),
          tipo: 'efimero' as TipoParticipante,
        },
        'crear participante'
      );

      const participanteData = {
        ...nuevoParticipante,
        creadoEn: serverTimestamp()
      };

      const participanteDocRef = await addDoc(participantesRef, participanteData);

      // Registrar acción en el log
      await registrarCreacion('participantes', participanteDocRef.id, participanteData);

      return { participanteId: participanteDocRef.id, eventoId, nombre: nombre.trim() };
    },
    // Optimistic update: actualizar cache antes de que se complete la mutation
    onMutate: async ({ eventoId, nombre }) => {
      // Cancelar queries en progreso para evitar sobrescribir el optimistic update
      await queryClient.cancelQueries({ queryKey: ['participantes', eventoId] });

      // Snapshot del valor anterior
      const previousParticipantes = queryClient.getQueryData(['participantes', eventoId]);

      // Optimistic update: agregar el participante temporalmente
      queryClient.setQueryData(['participantes', eventoId], (old: any[] = []) => {
        const tempId = `temp-${Date.now()}`;
        return [
          ...old,
          {
            id: tempId,
            nombre: nombre.trim(),
            eventoId,
            tipo: 'efimero',
            _optimistic: true, // Marcar como optimistic
          },
        ];
      });

      // Retornar contexto para rollback
      return { previousParticipantes };
    },
    // Si hay error, hacer rollback
    onError: (err, variables, context) => {
      if (context?.previousParticipantes) {
        queryClient.setQueryData(['participantes', variables.eventoId], context.previousParticipantes);
      }
    },
    // Siempre invalidar para sincronizar con el servidor
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['participantes', variables.eventoId] });
    },
  });
}

/**
 * Hook para actualizar un participante
 * Con optimistic updates para mejor UX
 */
export function useUpdateParticipante() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ participanteId, nombre }: UpdateParticipanteParams) => {
      if (!nombre || !nombre.trim()) {
        throw new Error('Ingresá un nombre');
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
      const participanteRef = doc(db, 'participantes', participanteId);

      // Obtener datos anteriores para el log
      const participanteSnap = await getDoc(participanteRef);
      const datosAnteriores = participanteSnap.exists() ? participanteSnap.data() : null;

      if (!participanteSnap.exists()) {
        throw new Error('Participante no encontrado');
      }

      const eventoId = participanteSnap.data()?.eventoId;

      await updateDoc(participanteRef, {
        nombre: nombre.trim()
      });

      // Registrar acción en el log
      await registrarActualizacion('participantes', participanteId, { nombre: nombre.trim() }, datosAnteriores || undefined);

      return { participanteId, eventoId, nombre: nombre.trim() };
    },
    // Optimistic update
    onMutate: async ({ participanteId, nombre }) => {
      // Necesitamos obtener el eventoId primero
      let app;
      if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
      } else {
        app = getApps()[0];
      }

      if (!app) {
        return { previousParticipantes: null };
      }

      const db = getFirestore(app);
      const participanteRef = doc(db, 'participantes', participanteId);
      const participanteSnap = await getDoc(participanteRef);
      const eventoId = participanteSnap.data()?.eventoId;

      if (!eventoId) {
        return { previousParticipantes: null };
      }

      // Cancelar queries en progreso
      await queryClient.cancelQueries({ queryKey: ['participantes', eventoId] });

      // Snapshot del valor anterior
      const previousParticipantes = queryClient.getQueryData(['participantes', eventoId]);

      // Optimistic update: actualizar el participante en el cache
      queryClient.setQueryData(['participantes', eventoId], (old: any[] = []) => {
        return old.map((p) =>
          p.id === participanteId
            ? { ...p, nombre: nombre.trim(), _optimistic: true }
            : p
        );
      });

      return { previousParticipantes, eventoId };
    },
    // Si hay error, hacer rollback
    onError: (err, variables, context) => {
      if (context?.previousParticipantes && context?.eventoId) {
        queryClient.setQueryData(['participantes', context.eventoId], context.previousParticipantes);
      }
    },
    // Siempre invalidar para sincronizar con el servidor
    onSettled: (data) => {
      if (data?.eventoId) {
        queryClient.invalidateQueries({ queryKey: ['participantes', data.eventoId] });
      }
    },
  });
}

/**
 * Hook para eliminar un participante
 * Con optimistic updates para mejor UX
 */
export function useDeleteParticipante() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (participanteId: string) => {
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
      const participanteRef = doc(db, 'participantes', participanteId);

      // Obtener datos antes de eliminar para el log
      const participanteSnap = await getDoc(participanteRef);
      const datosAnteriores = participanteSnap.exists() ? participanteSnap.data() : null;

      if (!participanteSnap.exists()) {
        throw new Error('Participante no encontrado');
      }

      const eventoId = participanteSnap.data()?.eventoId;

      await deleteDoc(participanteRef);

      // Registrar acción en el log
      if (datosAnteriores) {
        await registrarEliminacion('participantes', participanteId, datosAnteriores);
      }

      return { eventoId, participanteId };
    },
    // Optimistic update
    onMutate: async (participanteId) => {
      // Necesitamos obtener el eventoId primero
      let app;
      if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
      } else {
        app = getApps()[0];
      }

      if (!app) {
        return { previousParticipantes: null };
      }

      const db = getFirestore(app);
      const participanteRef = doc(db, 'participantes', participanteId);
      const participanteSnap = await getDoc(participanteRef);
      const eventoId = participanteSnap.data()?.eventoId;

      if (!eventoId) {
        return { previousParticipantes: null };
      }

      // Cancelar queries en progreso
      await queryClient.cancelQueries({ queryKey: ['participantes', eventoId] });

      // Snapshot del valor anterior
      const previousParticipantes = queryClient.getQueryData(['participantes', eventoId]);

      // Optimistic update: eliminar el participante del cache
      queryClient.setQueryData(['participantes', eventoId], (old: any[] = []) => {
        return old.filter((p) => p.id !== participanteId);
      });

      return { previousParticipantes, eventoId };
    },
    // Si hay error, hacer rollback
    onError: (err, variables, context) => {
      if (context?.previousParticipantes && context?.eventoId) {
        queryClient.setQueryData(['participantes', context.eventoId], context.previousParticipantes);
      }
    },
    // Siempre invalidar para sincronizar con el servidor
    onSettled: (data) => {
      if (data?.eventoId) {
        queryClient.invalidateQueries({ queryKey: ['participantes', data.eventoId] });
      }
    },
  });
}

