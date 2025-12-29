/**
 * Utilidades para verificar permisos basados en tipo de usuario
 * Separa el concepto de "tipo de usuario" (permanente/miembro/efímero) 
 * del concepto de "rol" (participante/anfitrión)
 */

import { 
  doc, 
  getDoc,
  getFirestore,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../../js/core/firebase-config';
import { getAuth } from 'firebase/auth';
import { verificarMembresiaActiva } from './participantes';

export type TipoUsuario = 'permanente' | 'miembro' | 'efimero';

export interface PermisosUsuario {
  puedeCrearEventos: boolean;
  puedeSerAnfitrion: boolean;
  puedeParticipar: boolean;
  tipoUsuario: TipoUsuario | null;
  tieneOnboarding: boolean;
}

/**
 * Obtener el tipo de usuario desde Firestore
 * Verifica si es permanente, miembro o efímero
 */
export async function obtenerTipoUsuario(userId: string): Promise<TipoUsuario | null> {
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

    // Verificar si existe como participante permanente/miembro
    const participantesRef = collection(db, 'participantes');
    const q = query(participantesRef, where('userId', '==', userId));
    const participantesSnapshot = await getDocs(q);

    if (!participantesSnapshot.empty) {
      // Encontrar el participante más reciente para determinar el tipo
      let participanteMasReciente = null;
      let fechaMasReciente = null;

      participantesSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const tipo = data.tipo as TipoUsuario;
        
        // Si es miembro, tiene prioridad
        if (tipo === 'miembro') {
          participanteMasReciente = tipo;
          return;
        }
        
        // Si es permanente y no hemos encontrado miembro, guardarlo
        if (tipo === 'permanente' && participanteMasReciente !== 'miembro') {
          const fechaCreacion = data.creadoEn?.toDate?.() || data.creadoEn;
          if (!fechaMasReciente || (fechaCreacion && fechaCreacion > fechaMasReciente)) {
            fechaMasReciente = fechaCreacion;
            participanteMasReciente = tipo;
          }
        }
      });

      if (participanteMasReciente === 'miembro') {
        // Verificar que la membresía esté activa
        const membresia = await verificarMembresiaActiva(userId);
        return membresia.activa ? 'miembro' : 'permanente';
      }

      if (participanteMasReciente === 'permanente') {
        return 'permanente';
      }
    }

    // Verificar si existe como anfitrión
    const anfitrionRef = doc(db, 'anfitriones', userId);
    const anfitrionSnap = await getDoc(anfitrionRef);

    if (anfitrionSnap.exists()) {
      const anfitrionData = anfitrionSnap.data();
      
      // Priorizar tipoUsuario (nuevo campo) sobre tipo (compatibilidad)
      if (anfitrionData.tipoUsuario) {
        // Verificar membresía si es permanente para determinar si es miembro
        if (anfitrionData.tipoUsuario === 'permanente') {
          const membresia = await verificarMembresiaActiva(userId);
          return membresia.activa ? 'miembro' : 'permanente';
        }
        return anfitrionData.tipoUsuario as TipoUsuario;
      }
      
      // Fallback: usar tipo para compatibilidad con datos antiguos
      if (anfitrionData.userId && anfitrionData.tipo !== 'efimero') {
        // Verificar membresía para determinar si es miembro
        const membresia = await verificarMembresiaActiva(userId);
        return membresia.activa ? 'miembro' : 'permanente';
      }
      
      // Si es efímero, retornar efímero
      if (anfitrionData.tipo === 'efimero') {
        return 'efimero';
      }
    }

    // Si no se encuentra en ninguna colección, asumir efímero por defecto
    return 'efimero';
  } catch (error: any) {
    console.error('[Permisos] Error al obtener tipo de usuario:', error);
    return null;
  }
}

/**
 * Verificar permisos del usuario actual
 */
export async function verificarPermisosUsuario(userId: string | null): Promise<PermisosUsuario> {
  if (!userId) {
    return {
      puedeCrearEventos: false,
      puedeSerAnfitrion: false,
      puedeParticipar: true, // Los efímeros pueden participar sin autenticación
      tipoUsuario: 'efimero',
      tieneOnboarding: false
    };
  }

  const tipoUsuario = await obtenerTipoUsuario(userId);

  if (!tipoUsuario) {
    return {
      puedeCrearEventos: false,
      puedeSerAnfitrion: false,
      puedeParticipar: true,
      tipoUsuario: 'efimero',
      tieneOnboarding: false
    };
  }

  const esPermanenteOMiembro = tipoUsuario === 'permanente' || tipoUsuario === 'miembro';
  const tieneOnboarding = esPermanenteOMiembro;

  return {
    puedeCrearEventos: esPermanenteOMiembro,
    puedeSerAnfitrion: esPermanenteOMiembro,
    puedeParticipar: true, // Todos pueden participar
    tipoUsuario,
    tieneOnboarding
  };
}

/**
 * Verificar si el usuario actual puede crear eventos
 */
export async function puedeCrearEventos(userId: string | null): Promise<boolean> {
  const permisos = await verificarPermisosUsuario(userId);
  return permisos.puedeCrearEventos;
}


