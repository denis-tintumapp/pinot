/**
 * Hook personalizado para gestionar la participación
 * Maneja sesión, estado y sincronización con Firestore
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  doc, 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../../js/core/firebase-config';
import { useParticipacionStore } from '../stores/participacionStore';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export interface ParticipacionState {
  sesionId: string | null;
  eventoId: string | null;
  nombreParticipante: string;
  eventoData: any | null;
  participantesDisponibles: string[];
  nombresOcupados: Set<string>;
  etiquetasDisponibles: Array<{ id: string; nombre: string }>;
  naipesDisponibles: Array<{ id: string; nombre: string }>;
  seleccionesNaipes: Record<string, string>; // { etiquetaId: naipeId }
  seleccionesNaipesTimestamps: Record<string, number>; // { etiquetaId: timestamp }
  ordenEtiquetas: string[];
  calificacionesEtiquetas: Record<string, number>; // { etiquetaId: calificacion (1-5) }
  pasoActual: number; // 1: nombre, 2: etiquetas, 3: naipes, 4: ranking
  timerExpiraEn: number | null;
  finalizado: boolean;
}

const initialState: ParticipacionState = {
  sesionId: null,
  eventoId: null,
  nombreParticipante: '',
  eventoData: null,
  participantesDisponibles: [],
  nombresOcupados: new Set(),
  etiquetasDisponibles: [],
  naipesDisponibles: [],
  seleccionesEtiquetas: {},
  seleccionesNaipes: {},
  seleccionesNaipesTimestamps: {},
  ordenEtiquetas: [],
  calificacionesEtiquetas: {},
  pasoActual: 1,
  timerExpiraEn: null,
  finalizado: false,
};

export const useParticipacion = (eventoId: string | null) => {
  const [state, setState] = useState<ParticipacionState>(initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inicializar sesión usando participacionStore
  const { getSesionId, setSesionId } = useParticipacionStore();
  
  const inicializarSesion = useCallback(() => {
    if (!eventoId) return;

    let sesionId = getSesionId(eventoId);

    if (!sesionId) {
      sesionId = `SES-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setSesionId(eventoId, sesionId);
    }

    setState((prev) => ({ ...prev, sesionId, eventoId }));
  }, [eventoId, getSesionId, setSesionId]);

  // Cargar evento
  const cargarEvento = useCallback(async () => {
    if (!eventoId) return;

    try {
      setLoading(true);
      const eventoRef = doc(db, 'eventos', eventoId);
      const eventoSnap = await getDoc(eventoRef);

      if (!eventoSnap.exists()) {
        setError('Evento no encontrado');
        return;
      }

      const eventoData = eventoSnap.data();
      setState((prev) => ({ ...prev, eventoData }));

      // Cargar participantes
      const participantesRef = collection(db, 'participantes');
      const participantesQuery = query(
        participantesRef,
        where('eventoId', '==', eventoId)
      );
      const participantesSnapshot = await getDocs(participantesQuery);
      const participantes = participantesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return data.nombre || '';
      }).filter(Boolean);
      const nombresOcupados = new Set(participantes);

      // Cargar etiquetas
      const etiquetasRef = collection(db, 'etiquetas');
      const etiquetasQuery = query(
        etiquetasRef,
        where('eventoId', '==', eventoId)
      );
      const etiquetasSnapshot = await getDocs(etiquetasQuery);
      const etiquetas = etiquetasSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          nombre: data.nombre || '',
        };
      });

      // Cargar naipes del evento
      const naipes = eventoData.naipes || [];

      setState((prev) => ({
        ...prev,
        participantesDisponibles: participantes,
        nombresOcupados,
        etiquetasDisponibles: etiquetas,
        naipesDisponibles: naipes.map((n: any) => ({
          id: n.id || n,
          nombre: n.nombre || n,
        })),
      }));

      // Escuchar timer
      if (eventoData.timerActivo && eventoData.timerExpiraEn) {
        const expiraEn = eventoData.timerExpiraEn.toMillis();
        setState((prev) => ({ ...prev, timerExpiraEn: expiraEn }));
      }
    } catch (err: any) {
      console.error('Error al cargar evento:', err);
      setError(err.message || 'Error al cargar el evento');
    } finally {
      setLoading(false);
    }
  }, [eventoId]);

  // Cargar progreso guardado
  const cargarProgreso = useCallback(async () => {
    if (!eventoId || !state.sesionId) return;

    try {
      const seleccionesRef = collection(db, 'selecciones');
      const q = query(
        seleccionesRef,
        where('sesionId', '==', state.sesionId),
        where('eventoId', '==', eventoId)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0]?.data();
        if (docData) {
          setState((prev) => ({
            ...prev,
            nombreParticipante: docData.nombreParticipante || '',
            seleccionesEtiquetas: docData.seleccionesEtiquetas || {},
            seleccionesNaipes: docData.seleccionesNaipes || {},
            seleccionesNaipesTimestamps: docData.seleccionesNaipesTimestamps || {},
            ordenEtiquetas: docData.ordenEtiquetas || [],
            calificacionesEtiquetas: docData.calificacionesEtiquetas || {},
            finalizado: docData.finalizado || false,
            pasoActual: docData.finalizado ? 4 : docData.nombreParticipante ? 3 : 1,
          }));
        }
      }
    } catch (err: any) {
      console.error('Error al cargar progreso:', err);
    }
  }, [eventoId, state.sesionId]);

  // Guardar selección de naipe
  const guardarSeleccionNaipe = useCallback(async (
    etiquetaId: string,
    naipeId: string
  ) => {
    if (!eventoId || !state.sesionId) return;

    try {
      const seleccionesRef = collection(db, 'selecciones');
      const q = query(
        seleccionesRef,
        where('sesionId', '==', state.sesionId),
        where('eventoId', '==', eventoId)
      );
      const querySnapshot = await getDocs(q);

      const timestamp = Date.now();
      const seleccionesNaipes = {
        ...state.seleccionesNaipes,
        [etiquetaId]: naipeId,
      };
      const seleccionesNaipesTimestamps = {
        ...state.seleccionesNaipesTimestamps,
        [etiquetaId]: timestamp,
      };

      if (querySnapshot.empty) {
        // Crear nuevo documento
        await addDoc(seleccionesRef, {
          eventoId,
          sesionId: state.sesionId,
          nombreParticipante: state.nombreParticipante,
          seleccionesEtiquetas,
          seleccionesNaipes,
          seleccionesNaipesTimestamps,
          finalizado: false,
          creadoEn: serverTimestamp(),
          actualizadoEn: serverTimestamp(),
        });
      } else {
        // Actualizar documento existente
        const firstDoc = querySnapshot.docs[0];
        if (firstDoc) {
          const docRef = firstDoc.ref;
          await updateDoc(docRef, {
            seleccionesEtiquetas,
            seleccionesNaipes,
            seleccionesNaipesTimestamps,
            actualizadoEn: serverTimestamp(),
          });
        }
      }

      setState((prev) => ({
        ...prev,
        seleccionesEtiquetas,
        seleccionesNaipes,
        seleccionesNaipesTimestamps,
      }));
    } catch (err: any) {
      console.error('Error al guardar selección:', err);
      throw err;
    }
  }, [eventoId, state.sesionId, state.nombreParticipante, state.seleccionesNaipes, state.seleccionesNaipesTimestamps]);

  // Guardar nombre de participante
  const guardarNombreParticipante = useCallback(async (nombre: string) => {
    if (!eventoId || !state.sesionId) return;

    try {
      const seleccionesRef = collection(db, 'selecciones');
      const q = query(
        seleccionesRef,
        where('sesionId', '==', state.sesionId),
        where('eventoId', '==', eventoId)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty && querySnapshot.docs[0]) {
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, {
          nombreParticipante: nombre,
          actualizadoEn: serverTimestamp(),
        });
      } else {
        await addDoc(seleccionesRef, {
          eventoId,
          sesionId: state.sesionId,
          nombreParticipante: nombre,
          seleccionesEtiquetas: {},
          seleccionesNaipes: {},
          seleccionesNaipesTimestamps: {},
          finalizado: false,
          creadoEn: serverTimestamp(),
          actualizadoEn: serverTimestamp(),
        });
      }

      setState((prev) => ({
        ...prev,
        nombreParticipante: nombre,
        pasoActual: 2,
      }));
    } catch (err: any) {
      console.error('Error al guardar nombre:', err);
      throw err;
    }
  }, [eventoId, state.sesionId]);

  // Quitar selección de naipe
  const quitarSeleccionNaipe = useCallback(async (etiquetaId: string) => {
    if (!eventoId || !state.sesionId) return;

    try {
      const seleccionesEtiquetas = { ...state.seleccionesEtiquetas };
      const seleccionesNaipes = { ...state.seleccionesNaipes };
      const seleccionesNaipesTimestamps = { ...state.seleccionesNaipesTimestamps };
      const calificacionesEtiquetas = { ...state.calificacionesEtiquetas };

      // Mantener el nombre de la etiqueta si no está guardado
      const etiqueta = state.etiquetasDisponibles.find((e) => e.id === etiquetaId);
      if (etiqueta && !seleccionesEtiquetas[etiquetaId]) {
        seleccionesEtiquetas[etiquetaId] = etiqueta.nombre;
      }

      // Eliminar selección y timestamp
      if (seleccionesNaipes[etiquetaId]) {
        delete seleccionesNaipes[etiquetaId];
      }
      if (seleccionesNaipesTimestamps[etiquetaId]) {
        delete seleccionesNaipesTimestamps[etiquetaId];
      }
      // También eliminar calificación si existe
      if (calificacionesEtiquetas[etiquetaId]) {
        delete calificacionesEtiquetas[etiquetaId];
      }

      // Guardar en Firestore
      const seleccionesRef = collection(db, 'selecciones');
      const q = query(
        seleccionesRef,
        where('sesionId', '==', state.sesionId),
        where('eventoId', '==', eventoId)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty && querySnapshot.docs[0]) {
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, {
          seleccionesNaipes,
          seleccionesNaipesTimestamps,
          calificacionesEtiquetas,
          actualizadoEn: serverTimestamp(),
        });
      }

      setState((prev) => ({
        ...prev,
        seleccionesNaipes,
        seleccionesNaipesTimestamps,
        calificacionesEtiquetas,
      }));
    } catch (err: any) {
      console.error('Error al quitar selección:', err);
      throw err;
    }
  }, [eventoId, state.sesionId, state.etiquetasDisponibles, state.seleccionesEtiquetas, state.seleccionesNaipes, state.seleccionesNaipesTimestamps, state.calificacionesEtiquetas]);

  // Guardar calificaciones
  const guardarCalificaciones = useCallback(async (calificaciones: Record<string, number>) => {
    if (!eventoId || !state.sesionId) return;

    try {
      const seleccionesRef = collection(db, 'selecciones');
      const q = query(
        seleccionesRef,
        where('sesionId', '==', state.sesionId),
        where('eventoId', '==', eventoId)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty && querySnapshot.docs[0]) {
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, {
          calificacionesEtiquetas: calificaciones,
          actualizadoEn: serverTimestamp(),
        });
      } else {
        await addDoc(seleccionesRef, {
          eventoId,
          sesionId: state.sesionId,
          nombreParticipante: state.nombreParticipante,
          seleccionesEtiquetas: state.seleccionesEtiquetas,
          seleccionesNaipes: state.seleccionesNaipes,
          seleccionesNaipesTimestamps: state.seleccionesNaipesTimestamps,
          calificacionesEtiquetas: calificaciones,
          ordenEtiquetas: state.ordenEtiquetas,
          finalizado: false,
          creadoEn: serverTimestamp(),
          actualizadoEn: serverTimestamp(),
        });
      }

      setState((prev) => ({
        ...prev,
        calificacionesEtiquetas: calificaciones,
      }));
    } catch (err: any) {
      console.error('Error al guardar calificaciones:', err);
      throw err;
    }
  }, [eventoId, state.sesionId, state.nombreParticipante, state.seleccionesEtiquetas, state.seleccionesNaipes, state.seleccionesNaipesTimestamps, state.ordenEtiquetas]);

  // Guardar orden de etiquetas
  const guardarOrdenEtiquetas = useCallback(async (orden: string[]) => {
    if (!eventoId || !state.sesionId) return;

    try {
      const seleccionesRef = collection(db, 'selecciones');
      const q = query(
        seleccionesRef,
        where('sesionId', '==', state.sesionId),
        where('eventoId', '==', eventoId)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty && querySnapshot.docs[0]) {
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, {
          ordenEtiquetas: orden,
          actualizadoEn: serverTimestamp(),
        });
      } else {
        await addDoc(seleccionesRef, {
          eventoId,
          sesionId: state.sesionId,
          nombreParticipante: state.nombreParticipante,
          seleccionesNaipes: state.seleccionesNaipes,
          seleccionesNaipesTimestamps: state.seleccionesNaipesTimestamps,
          ordenEtiquetas: orden,
          calificacionesEtiquetas: state.calificacionesEtiquetas,
          finalizado: false,
          creadoEn: serverTimestamp(),
          actualizadoEn: serverTimestamp(),
        });
      }

      setState((prev) => ({
        ...prev,
        ordenEtiquetas: orden,
      }));
    } catch (err: any) {
      console.error('Error al guardar orden:', err);
      throw err;
    }
  }, [eventoId, state.sesionId, state.nombreParticipante, state.seleccionesNaipes, state.seleccionesNaipesTimestamps, state.calificacionesEtiquetas]);

  // Finalizar participación
  const finalizarParticipacion = useCallback(async () => {
    if (!eventoId || !state.sesionId) return;

    try {
      // Si se está finalizando y hay participantes, asignar 0 a las selecciones sin calificar
      const calificacionesFinales = { ...state.calificacionesEtiquetas };
      if (state.participantesDisponibles.length > 0) {
        Object.keys(state.seleccionesNaipes).forEach((etiquetaId) => {
          if (!calificacionesFinales[etiquetaId] || calificacionesFinales[etiquetaId] === 0) {
            calificacionesFinales[etiquetaId] = 0;
          }
        });
      }

      const seleccionesRef = collection(db, 'selecciones');
      const q = query(
        seleccionesRef,
        where('sesionId', '==', state.sesionId),
        where('eventoId', '==', eventoId)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty && querySnapshot.docs[0]) {
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, {
          finalizado: true,
          calificacionesEtiquetas: calificacionesFinales,
          actualizadoEn: serverTimestamp(),
        });
      }

      setState((prev) => ({
        ...prev,
        finalizado: true,
        pasoActual: 4,
        calificacionesEtiquetas: calificacionesFinales,
      }));
    } catch (err: any) {
      console.error('Error al finalizar:', err);
      throw err;
    }
  }, [eventoId, state.sesionId, state.calificacionesEtiquetas, state.seleccionesNaipes, state.participantesDisponibles]);

  // Escucha en tiempo real de nombres ocupados
  const nombresOcupadosUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!eventoId) return;

    // Limpiar suscripción anterior
    if (nombresOcupadosUnsubscribeRef.current) {
      nombresOcupadosUnsubscribeRef.current();
      nombresOcupadosUnsubscribeRef.current = null;
    }

    const seleccionesRef = collection(db, 'selecciones');
    const q = query(seleccionesRef, where('eventoId', '==', eventoId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const nombresOcupados = new Set<string>();
        snapshot.forEach((doc) => {
          const data = doc.data();
          const nombre = data.nombreParticipante || '';
          const sesionIdDoc = data.sesionId || '';
          // Solo considerar nombres ocupados de otras sesiones
          if (nombre && sesionIdDoc !== state.sesionId) {
            nombresOcupados.add(nombre);
          }
        });

        setState((prev) => ({
          ...prev,
          nombresOcupados,
        }));
      },
      (err) => {
        console.error('Error al escuchar nombres ocupados:', err);
      }
    );

    nombresOcupadosUnsubscribeRef.current = unsubscribe;

    return () => {
      if (nombresOcupadosUnsubscribeRef.current) {
        nombresOcupadosUnsubscribeRef.current();
        nombresOcupadosUnsubscribeRef.current = null;
      }
    };
  }, [eventoId, state.sesionId]);

  // Escucha en tiempo real del timer
  const timerUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!eventoId) return;

    // Limpiar suscripción anterior
    if (timerUnsubscribeRef.current) {
      timerUnsubscribeRef.current();
      timerUnsubscribeRef.current = null;
    }

    const eventoRef = doc(db, 'eventos', eventoId);

    const unsubscribe = onSnapshot(
      eventoRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const eventoData = docSnapshot.data();
          
          // Verificar si el evento está finalizado
          if (eventoData.eventoFinalizado) {
            setState((prev) => ({
              ...prev,
              timerExpiraEn: null,
              finalizado: true,
            }));
            return;
          }

          // Actualizar timer
          if (eventoData.timerActivo && eventoData.timerExpiraEn) {
            const expiraEn = eventoData.timerExpiraEn instanceof Timestamp
              ? eventoData.timerExpiraEn.toMillis()
              : eventoData.timerExpiraEn;

            setState((prev) => ({
              ...prev,
              timerExpiraEn: expiraEn,
            }));

            // Verificar si el timer expiró
            const ahora = Date.now();
            if (expiraEn <= ahora) {
              // Timer expirado, finalizar automáticamente si no está finalizado
              if (!state.finalizado) {
                finalizarParticipacion().catch((err) => {
                  console.error('Error al finalizar automáticamente:', err);
                });
              }
            }
          } else {
            setState((prev) => ({
              ...prev,
              timerExpiraEn: null,
            }));
          }
        }
      },
      (err) => {
        console.error('Error al escuchar timer:', err);
      }
    );

    timerUnsubscribeRef.current = unsubscribe;

    return () => {
      if (timerUnsubscribeRef.current) {
        timerUnsubscribeRef.current();
        timerUnsubscribeRef.current = null;
      }
    };
  }, [eventoId, state.finalizado, finalizarParticipacion]);

  // Efectos
  useEffect(() => {
    if (eventoId) {
      inicializarSesion();
      cargarEvento();
    }
  }, [eventoId, inicializarSesion, cargarEvento]);

  useEffect(() => {
    if (eventoId && state.sesionId) {
      cargarProgreso();
    }
  }, [eventoId, state.sesionId, cargarProgreso]);

  return {
    state,
    loading,
    error,
    guardarSeleccionNaipe,
    guardarNombreParticipante,
    quitarSeleccionNaipe,
    guardarCalificaciones,
    guardarOrdenEtiquetas,
    finalizarParticipacion,
    setState,
  };
};











