/**
 * Utilidades para manejo de participantes
 * Soporte para efímeros, permanentes y miembros
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  updateDoc,
  serverTimestamp,
  getFirestore
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../../js/core/firebase-config';
import { getAuth } from 'firebase/auth';

export type TipoParticipante = 'efimero' | 'permanente' | 'miembro';

export interface ParticipantePermanenteData {
  alias: string;
  nombreCompleto: string;
  email: string;
  telefono: string;
}

export interface ParticipanteData {
  eventoId: string;
  nombre: string;
  tipo: TipoParticipante;
  userId?: string;
  alias?: string;
  nombreCompleto?: string;
  email?: string;
  telefono?: string;
  emailVerificado?: boolean;
  membresiaId?: string;
}

/**
 * Verificar si un usuario tiene membresía activa
 */
export async function verificarMembresiaActiva(userId: string): Promise<{ activa: boolean; membresiaId?: string }> {
  try {
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
    const membresiasRef = collection(db, 'membresias');
    const q = query(
      membresiasRef,
      where('userId', '==', userId),
      where('estado', '==', 'activa')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { activa: false };
    }

    // Verificar que la membresía no haya expirado
    const ahora = new Date();
    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      const fechaFin = data.fechaFin?.toDate?.() || new Date(data.fechaFin);
      
      if (fechaFin > ahora) {
        return { activa: true, membresiaId: docSnap.id };
      }
    }

    return { activa: false };
  } catch (error: any) {
    console.error('[Participantes] Error al verificar membresía:', error);
    return { activa: false };
  }
}

/**
 * Crear participante permanente en un evento
 */
export async function crearParticipantePermanente(
  eventoId: string,
  datos: ParticipantePermanenteData
): Promise<{ success: boolean; participanteId?: string; error?: string }> {
  try {
    // Inicializar Firebase si no está inicializado
    let app;
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    if (!app) {
      throw new Error('No se pudo inicializar Firebase');
    }

    const auth = getAuth(app);
    const user = auth.currentUser;

    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    if (!user.emailVerified) {
      return { success: false, error: 'Debes verificar tu email antes de participar' };
    }

    // Verificar si tiene membresía activa
    const membresia = await verificarMembresiaActiva(user.uid);
    const tipoParticipante: TipoParticipante = membresia.activa ? 'miembro' : 'permanente';

    const db = getFirestore(app);
    const participantesRef = collection(db, 'participantes');

      // Verificar que no exista ya un participante para este usuario en este evento
      // Nota: Esta query requiere un índice compuesto en Firestore
      const q = query(
        participantesRef,
        where('eventoId', '==', eventoId),
        where('userId', '==', user.uid)
      );
      
      let querySnapshot;
      try {
        querySnapshot = await getDocs(q);
      } catch (error: any) {
        // Si falla por índice faltante, intentar sin userId (menos eficiente pero funciona)
        console.warn('[Participantes] Índice compuesto no disponible, usando query alternativa');
        const qAlt = query(participantesRef, where('eventoId', '==', eventoId));
        const snapshotAlt = await getDocs(qAlt);
        querySnapshot = {
          empty: true,
          docs: snapshotAlt.docs.filter(doc => doc.data().userId === user.uid)
        } as any;
      }

      if (!querySnapshot.empty) {
        // Ya existe, actualizar datos
        const participanteDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'participantes', participanteDoc.id), {
          alias: datos.alias,
          nombreCompleto: datos.nombreCompleto,
          email: datos.email,
          telefono: datos.telefono,
          tipo: tipoParticipante,
          membresiaId: membresia.activa ? membresia.membresiaId : undefined,
          actualizadoEn: serverTimestamp()
        });

        return { success: true, participanteId: participanteDoc.id };
      }

    // Crear nuevo participante
    const nuevoParticipante: ParticipanteData = {
      eventoId,
      nombre: datos.alias || datos.nombreCompleto, // Usar alias como nombre principal
      tipo: tipoParticipante,
      userId: user.uid,
      alias: datos.alias,
      nombreCompleto: datos.nombreCompleto,
      email: datos.email,
      telefono: datos.telefono,
      emailVerificado: user.emailVerified,
      membresiaId: membresia.activa ? membresia.membresiaId : undefined,
    };

    const docRef = await addDoc(participantesRef, {
      ...nuevoParticipante,
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp()
    });

    return { success: true, participanteId: docRef.id };
  } catch (error: any) {
    console.error('[Participantes] Error al crear participante permanente:', error);
    return { success: false, error: error.message || 'Error al crear participante' };
  }
}

/**
 * Crear participante efímero (selección de lista)
 */
export async function crearParticipanteEfimero(
  eventoId: string,
  nombre: string
): Promise<{ success: boolean; participanteId?: string; error?: string }> {
  try {
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

    // Verificar que no exista ya un participante con el mismo nombre en el mismo evento
    const q = query(
      participantesRef,
      where('eventoId', '==', eventoId),
      where('nombre', '==', nombre.trim())
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return { success: false, error: 'Ya existe un participante con ese nombre en este evento' };
    }

    const docRef = await addDoc(participantesRef, {
      eventoId,
      nombre: nombre.trim(),
      tipo: 'efimero',
      creadoEn: serverTimestamp()
    });

    return { success: true, participanteId: docRef.id };
  } catch (error: any) {
    console.error('[Participantes] Error al crear participante efímero:', error);
    return { success: false, error: error.message || 'Error al crear participante' };
  }
}

/**
 * Verificar si el usuario actual ya es participante en un evento
 */
export async function verificarParticipacionExistente(
  eventoId: string
): Promise<{ existe: boolean; participanteId?: string; tipo?: TipoParticipante }> {
  try {
    // Inicializar Firebase si no está inicializado
    let app;
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    if (!app) {
      throw new Error('No se pudo inicializar Firebase');
    }

    const auth = getAuth(app);
    const user = auth.currentUser;

    if (!user) {
      return { existe: false };
    }

    const db = getFirestore(app);
    const participantesRef = collection(db, 'participantes');
    let q;
    let querySnapshot;
    
    try {
      q = query(
        participantesRef,
        where('eventoId', '==', eventoId),
        where('userId', '==', user.uid)
      );
      querySnapshot = await getDocs(q);
    } catch (error: any) {
      // Si falla por índice faltante, usar query alternativa
      console.warn('[Participantes] Índice compuesto no disponible, usando query alternativa');
      const qAlt = query(participantesRef, where('eventoId', '==', eventoId));
      const snapshotAlt = await getDocs(qAlt);
      querySnapshot = {
        empty: true,
        docs: snapshotAlt.docs.filter(doc => doc.data().userId === user.uid)
      } as any;
    }

    if (querySnapshot.empty) {
      return { existe: false };
    }

    const participanteDoc = querySnapshot.docs[0];
    const data = participanteDoc.data();

    return {
      existe: true,
      participanteId: participanteDoc.id,
      tipo: data.tipo || 'permanente'
    };
  } catch (error: any) {
    console.error('[Participantes] Error al verificar participación:', error);
    return { existe: false };
  }
}



