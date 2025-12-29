/**
 * Utilidad mejorada para registrar logs de acciones del usuario
 * NO registra acciones automáticas del sistema
 */

import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  getDoc,
  doc
} from 'firebase/firestore';
import { firebaseConfig } from '../../js/core/firebase-config.ts';
import { getUsuarioActualAuth } from '../../js/auth/auth.ts';

// Inicializar Firebase
let app;
let db;

function getDb() {
  if (!app) {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
  }
  if (!db) {
    db = getFirestore(app);
  }
  return db;
}

/**
 * Obtener título descriptivo del evento basado en la colección y datos
 */
function obtenerTituloEvento(
  accion: 'create' | 'update' | 'delete',
  coleccion: string,
  datos?: any,
  datosAnteriores?: any
): string {
  switch (coleccion) {
    case 'anfitriones':
      if (accion === 'create') {
        return `Anfitrión creado: ${datos?.nombreAnfitrion || datos?.alias || 'N/A'}`;
      } else if (accion === 'update') {
        return `Anfitrión actualizado: ${datos?.nombreAnfitrion || datos?.alias || datosAnteriores?.nombreAnfitrion || datosAnteriores?.alias || 'N/A'}`;
      } else {
        return `Anfitrión eliminado: ${datosAnteriores?.nombreAnfitrion || datosAnteriores?.alias || 'N/A'}`;
      }
    
    case 'participantes':
      if (accion === 'create') {
        return `Participante creado: ${datos?.nombre || 'N/A'}`;
      } else if (accion === 'update') {
        return `Participante actualizado: ${datos?.nombre || datosAnteriores?.nombre || 'N/A'}`;
      } else {
        return `Participante eliminado: ${datosAnteriores?.nombre || 'N/A'}`;
      }
    
    case 'eventos':
      if (accion === 'create') {
        return `Evento creado: ${datos?.nombre || 'N/A'} (PIN: ${datos?.pin || 'N/A'})`;
      } else if (accion === 'update') {
        return `Evento actualizado: ${datos?.nombre || datosAnteriores?.nombre || 'N/A'}`;
      } else {
        return `Evento eliminado: ${datosAnteriores?.nombre || 'N/A'}`;
      }
    
    case 'etiquetas':
      if (accion === 'create') {
        return `Etiqueta creada: ${datos?.etiquetaNombre || datos?.nombre || 'N/A'}`;
      } else if (accion === 'update') {
        return `Etiqueta actualizada: ${datos?.etiquetaNombre || datos?.nombre || datosAnteriores?.etiquetaNombre || datosAnteriores?.nombre || 'N/A'}`;
      } else {
        return `Etiqueta eliminada: ${datosAnteriores?.etiquetaNombre || datosAnteriores?.nombre || 'N/A'}`;
      }
    
    case 'selecciones':
      if (accion === 'create') {
        return `Selección creada: ${datos?.nombreParticipante || 'N/A'}`;
      } else if (accion === 'update') {
        return `Selección actualizada: ${datos?.nombreParticipante || datosAnteriores?.nombreParticipante || 'N/A'}`;
      } else {
        return `Selección eliminada: ${datosAnteriores?.nombreParticipante || 'N/A'}`;
      }
    
    default:
      return `${accion.toUpperCase()} en ${coleccion}`;
  }
}

/**
 * Obtener usuario actual o 'Sistema' si no hay usuario autenticado
 */
function obtenerUsuario(): string {
  try {
    const user = getUsuarioActualAuth();
    if (user) {
      return user.displayName || user.email || 'Usuario';
    }
  } catch (error) {
    // Si falla, continuar con 'Sistema'
  }
  return 'Sistema';
}

/**
 * Registrar una acción del usuario en el log del sistema
 * Solo debe llamarse para acciones manuales del usuario, NO para acciones automáticas
 * 
 * @param accion - 'create', 'update', 'delete'
 * @param coleccion - Nombre de la colección
 * @param documentoId - ID del documento
 * @param datos - Datos nuevos (opcional)
 * @param datosAnteriores - Datos anteriores (opcional, requerido para update/delete)
 * @param titulo - Título personalizado del evento (opcional, se genera automáticamente si no se proporciona)
 */
export async function registrarAccion(
  accion: 'create' | 'update' | 'delete',
  coleccion: string,
  documentoId: string,
  datos?: any,
  datosAnteriores?: any,
  titulo?: string
): Promise<void> {
  try {
    const dbInstance = getDb();
    const logsRef = collection(dbInstance, 'admin_logs');
    
    // Obtener datos anteriores si no se proporcionaron y es necesario
    if ((accion === 'update' || accion === 'delete') && !datosAnteriores) {
      try {
        const docRef = doc(dbInstance, coleccion, documentoId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          datosAnteriores = docSnap.data();
        }
      } catch (error) {
        console.warn('[Logger] No se pudieron obtener datos anteriores:', error);
      }
    }
    
    // Generar título si no se proporciona
    const tituloEvento = titulo || obtenerTituloEvento(accion, coleccion, datos, datosAnteriores);
    
    // Obtener usuario
    const usuario = obtenerUsuario();
    
    await addDoc(logsRef, {
      accion: accion,
      coleccion: coleccion,
      documentoId: documentoId,
      datos: datos,
      datosAnteriores: datosAnteriores,
      titulo: tituloEvento, // Nuevo campo: título descriptivo del evento
      descripcion: tituloEvento, // Mantener compatibilidad con campo existente
      usuario: usuario,
      timestamp: serverTimestamp()
    });
    
    console.log(`[Logger] ✅ Acción registrada: ${tituloEvento}`);
  } catch (error) {
    console.error('[Logger] Error al registrar log:', error);
    // No bloquear el flujo si falla el logging
  }
}

/**
 * Helper para registrar creación
 */
export async function registrarCreacion(
  coleccion: string,
  documentoId: string,
  datos: any,
  titulo?: string
): Promise<void> {
  return registrarAccion('create', coleccion, documentoId, datos, undefined, titulo);
}

/**
 * Helper para registrar actualización
 */
export async function registrarActualizacion(
  coleccion: string,
  documentoId: string,
  datos: any,
  datosAnteriores?: any,
  titulo?: string
): Promise<void> {
  return registrarAccion('update', coleccion, documentoId, datos, datosAnteriores, titulo);
}

/**
 * Helper para registrar eliminación
 */
export async function registrarEliminacion(
  coleccion: string,
  documentoId: string,
  datosAnteriores: any,
  titulo?: string
): Promise<void> {
  return registrarAccion('delete', coleccion, documentoId, undefined, datosAnteriores, titulo);
}



