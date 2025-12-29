/**
 * Hook para cargar y gestionar logs del sistema (changelog)
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  where,
  getFirestore,
  Timestamp
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../../js/core/firebase-config.ts';

export interface AdminLog {
  id: string;
  accion: 'create' | 'update' | 'delete' | 'read';
  coleccion: string;
  documentoId: string;
  datos?: any;
  datosAnteriores?: any;
  descripcion?: string;
  titulo?: string; // Título descriptivo del evento
  usuario?: string;
  timestamp: Timestamp | Date;
}

interface UseAdminLogsReturn {
  logs: AdminLog[];
  loading: boolean;
  error: string | null;
  cargarLogs: () => Promise<void>;
}

interface UseAdminLogsOptions {
  activeActions?: Set<string>;
  activeCollection?: string;
  searchTerm?: string;
  logLimit?: number;
}

export const useAdminLogs = (options: UseAdminLogsOptions = {}): UseAdminLogsReturn => {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    activeActions = new Set(['create', 'update', 'delete', 'read']),
    activeCollection = '',
    searchTerm = '',
    logLimit = 100
  } = options;

  const cargarLogs = useCallback(async () => {
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
      const logsRef = collection(db, 'admin_logs');
      
      // Construir query base
      let q;
      
      // Si hay filtro de colección, usar índice compuesto
      if (activeCollection) {
        q = query(
          logsRef, 
          where('coleccion', '==', activeCollection), 
          orderBy('timestamp', 'desc'), 
          limit(logLimit)
        );
      } else {
        // Sin filtro, solo ordenar por timestamp
        q = query(
          logsRef, 
          orderBy('timestamp', 'desc'), 
          limit(logLimit)
        );
      }
      
      const querySnapshot = await getDocs(q);
      const logsData: AdminLog[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        logsData.push({
          id: doc.id,
          accion: data.accion,
          coleccion: data.coleccion,
          documentoId: data.documentoId,
          datos: data.datos,
          datosAnteriores: data.datosAnteriores,
          descripcion: data.descripcion,
          titulo: data.titulo || data.descripcion, // Usar título si existe, sino descripción
          usuario: data.usuario,
          timestamp: data.timestamp
        });
      });
      
      // Filtrar por acciones activas
      let filteredLogs = logsData.filter(log => activeActions.has(log.accion));
      
      // Filtrar por término de búsqueda
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredLogs = filteredLogs.filter(log => {
          return (
            log.coleccion?.toLowerCase().includes(searchLower) ||
            log.documentoId?.toLowerCase().includes(searchLower) ||
            log.usuario?.toLowerCase().includes(searchLower) ||
            log.descripcion?.toLowerCase().includes(searchLower) ||
            JSON.stringify(log.datos || {}).toLowerCase().includes(searchLower)
          );
        });
      }
      
      setLogs(filteredLogs);
    } catch (err: any) {
      console.error('[useAdminLogs] Error al cargar logs:', err);
      
      // Detectar si es un error de índice faltante o en construcción
      if (err.message && (err.message.includes('index') || err.message.includes('requires an index'))) {
        const errorMsg = err.message.includes('create it here') 
          ? 'El índice de Firestore está siendo construido. Por favor, espera 5-10 minutos y recarga la página. Si el problema persiste después de 30 minutos, verifica el estado del índice en Firebase Console: https://console.firebase.google.com/project/pinot-tintum/firestore/indexes'
          : 'El índice de Firestore está siendo construido. Esto puede tardar 5-30 minutos dependiendo de la cantidad de documentos. Por favor, espera y recarga la página más tarde.';
        setError(errorMsg);
      } else {
        setError(err.message || 'Error al cargar changelog');
      }
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [activeActions, activeCollection, searchTerm, logLimit]);

  // Serializar activeActions para usar en dependencias
  const activeActionsKey = Array.from(activeActions).sort().join(',');

  useEffect(() => {
    cargarLogs();
  }, [cargarLogs, activeActionsKey]);

  return {
    logs,
    loading,
    error,
    cargarLogs
  };
};

/**
 * Formatear timestamp para mostrar en UI
 */
export const formatearTimestamp = (timestamp: Timestamp | Date | null | undefined): string => {
  if (!timestamp) return 'N/A';
  
  let date: Date;
  if (timestamp instanceof Timestamp) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    return 'N/A';
  }
  
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};






