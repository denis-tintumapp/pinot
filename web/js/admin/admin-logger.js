/**
 * Módulo de logging para el sistema
 * Registra operaciones CRUD en la colección admin_logs
 */

import { 
  collection,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../core/firebase-init';

// Firebase ya está inicializado en firebase-init

/**
 * Registrar una operación en el log del sistema
 * @param {string} accion - 'create', 'update', 'delete', 'read'
 * @param {string} coleccion - Nombre de la colección
 * @param {string} documentoId - ID del documento
 * @param {object} datos - Datos nuevos (opcional)
 * @param {object} datosAnteriores - Datos anteriores (opcional)
 * @param {string} descripcion - Descripción de la operación (opcional)
 * @param {string} usuario - Usuario que realizó la acción (opcional)
 */
export async function registrarLog(accion, coleccion, documentoId, datos = null, datosAnteriores = null, descripcion = null, usuario = null) {
  try {
    const logsRef = collection(db, 'admin_logs');
    await addDoc(logsRef, {
      accion: accion, // 'create', 'update', 'delete', 'read'
      coleccion: coleccion,
      documentoId: documentoId,
      datos: datos,
      datosAnteriores: datosAnteriores,
      descripcion: descripcion || `${accion.toUpperCase()} en ${coleccion}`,
      usuario: usuario || 'Sistema',
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error al registrar log:', error);
    // No bloquear el flujo si falla el logging
  }
}

