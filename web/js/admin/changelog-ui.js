/**
 * @deprecated Este archivo está siendo migrado a React.
 * 
 * La funcionalidad ha sido migrada a:
 * - src/pages/admin/AdminChangelogPage.tsx (componente principal)
 * - src/hooks/useAdminLogs.ts (carga y filtrado de logs)
 * 
 * Este archivo se mantiene temporalmente para referencia durante la migración.
 * NO se debe usar en producción. Usar React Router y los componentes React en su lugar.
 * 
 * Módulo para mostrar changelog detallado de administración
 */

import { collection, query, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';
import { db } from '../core/firebase-init';

// Firebase ya está inicializado en firebase-init

// Estado
let logs = [];
let lastDoc = null;
let currentPage = 0;
const pageSize = 20;

// Elementos del DOM
const logsLoading = document.getElementById('logsLoading');
const logsList = document.getElementById('logsList');
const logsEmpty = document.getElementById('logsEmpty');
const buscarLog = document.getElementById('buscarLog');
const filtroAccion = document.getElementById('filtroAccion');
const filtroColeccion = document.getElementById('filtroColeccion');
const filtroFecha = document.getElementById('filtroFecha');
const btnAnterior = document.getElementById('btnAnterior');
const btnSiguiente = document.getElementById('btnSiguiente');
const infoPaginacion = document.getElementById('infoPaginacion');

/**
 * Inicializar página
 */
async function inicializar() {
  // Verificar autenticación admin (simplificado)
  const authToken = localStorage.getItem('admin_auth_token');
  if (!authToken) {
    window.location.href = '/admin/admin-ui.html';
    return;
  }

  await cargarLogs();

  // Event listeners
  if (buscarLog) buscarLog.addEventListener('input', filtrarLogs);
  if (filtroAccion) filtroAccion.addEventListener('change', filtrarLogs);
  if (filtroColeccion) filtroColeccion.addEventListener('change', filtrarLogs);
  if (filtroFecha) filtroFecha.addEventListener('change', filtrarLogs);
  if (btnAnterior) btnAnterior.addEventListener('click', paginaAnterior);
  if (btnSiguiente) btnSiguiente.addEventListener('click', paginaSiguiente);
}

/**
 * Cargar logs
 */
async function cargarLogs() {
  try {
    if (logsLoading) logsLoading.classList.remove('hidden');
    if (logsList) logsList.classList.add('hidden');
    if (logsEmpty) logsEmpty.classList.add('hidden');

    const logsRef = collection(db, 'admin_logs');
    let q = query(logsRef, orderBy('timestamp', 'desc'), limit(pageSize));

    if (lastDoc) {
      q = query(logsRef, orderBy('timestamp', 'desc'), startAfter(lastDoc), limit(pageSize));
    }

    const logsSnap = await getDocs(q);

    logs = [];
    logsSnap.forEach((doc) => {
      logs.push({
        id: doc.id,
        ...doc.data()
      });
    });

    if (logsSnap.docs.length > 0) {
      lastDoc = logsSnap.docs[logsSnap.docs.length - 1];
    }

    mostrarLogs(logs);
    actualizarEstadisticas();
    actualizarPaginacion();
  } catch (error) {
    console.error('[Admin Changelog] Error al cargar logs:', error);
  } finally {
    if (logsLoading) logsLoading.classList.add('hidden');
  }
}

/**
 * Mostrar logs
 */
function mostrarLogs(logsFiltrados) {
  if (!logsList) return;

  logsList.innerHTML = '';

  if (logsFiltrados.length === 0) {
    if (logsList) logsList.classList.add('hidden');
    if (logsEmpty) logsEmpty.classList.remove('hidden');
    return;
  }

  if (logsList) logsList.classList.remove('hidden');
  if (logsEmpty) logsEmpty.classList.add('hidden');

  logsFiltrados.forEach(log => {
    const entry = document.createElement('div');
    entry.className = 'log-entry bg-gray-50 rounded-lg p-4 border border-gray-200';
    entry.innerHTML = `
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <span class="badge badge-${log.accion}">${log.accion.toUpperCase()}</span>
            <span class="text-sm text-gray-600">${log.coleccion}</span>
          </div>
          <p class="text-sm text-gray-800">${log.descripcion || 'Sin descripción'}</p>
          <p class="text-xs text-gray-500 mt-1">${formatearFecha(log.timestamp)}</p>
        </div>
        <button class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600" onclick="verDetalles('${log.id}')">
          Ver
        </button>
      </div>
    `;
    logsList.appendChild(entry);
  });
}

/**
 * Filtrar logs
 */
function filtrarLogs() {
  const textoBusqueda = buscarLog ? buscarLog.value.toLowerCase() : '';
  const accionFiltro = filtroAccion ? filtroAccion.value : '';
  const coleccionFiltro = filtroColeccion ? filtroColeccion.value : '';

  let logsFiltrados = logs;

  if (textoBusqueda) {
    logsFiltrados = logsFiltrados.filter(l => 
      (l.descripcion && l.descripcion.toLowerCase().includes(textoBusqueda)) ||
      (l.coleccion && l.coleccion.toLowerCase().includes(textoBusqueda))
    );
  }

  if (accionFiltro) {
    logsFiltrados = logsFiltrados.filter(l => l.accion === accionFiltro);
  }

  if (coleccionFiltro) {
    logsFiltrados = logsFiltrados.filter(l => l.coleccion === coleccionFiltro);
  }

  mostrarLogs(logsFiltrados);
}

/**
 * Actualizar estadísticas
 */
function actualizarEstadisticas() {
  const totalLogs = document.getElementById('totalLogs');
  const totalCreaciones = document.getElementById('totalCreaciones');
  const totalActualizaciones = document.getElementById('totalActualizaciones');
  const totalEliminaciones = document.getElementById('totalEliminaciones');

  if (totalLogs) totalLogs.textContent = logs.length;
  if (totalCreaciones) totalCreaciones.textContent = logs.filter(l => l.accion === 'create').length;
  if (totalActualizaciones) totalActualizaciones.textContent = logs.filter(l => l.accion === 'update').length;
  if (totalEliminaciones) totalEliminaciones.textContent = logs.filter(l => l.accion === 'delete').length;
}

/**
 * Actualizar paginación
 */
function actualizarPaginacion() {
  if (infoPaginacion) {
    infoPaginacion.textContent = `Página ${currentPage + 1}`;
  }
  if (btnAnterior) {
    btnAnterior.disabled = currentPage === 0;
  }
  if (btnSiguiente) {
    btnSiguiente.disabled = logs.length < pageSize;
  }
}

/**
 * Página anterior
 */
function paginaAnterior() {
  if (currentPage > 0) {
    currentPage--;
    lastDoc = null;
    cargarLogs();
  }
}

/**
 * Página siguiente
 */
function paginaSiguiente() {
  if (logs.length === pageSize) {
    currentPage++;
    cargarLogs();
  }
}

/**
 * Formatear fecha
 */
function formatearFecha(timestamp) {
  if (!timestamp) return 'N/A';
  const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return fecha.toLocaleString('es-ES');
}

// Función global para ver detalles
window.verDetalles = function(logId) {
  const log = logs.find(l => l.id === logId);
  if (!log) return;

  const modal = document.getElementById('modalDetalles');
  const modalContenido = document.getElementById('modalContenido');
  const modalTitulo = document.getElementById('modalTitulo');
  const cerrarModal = document.getElementById('cerrarModal');

  if (modalTitulo) modalTitulo.textContent = `Log: ${log.accion.toUpperCase()}`;
  if (modalContenido) {
    modalContenido.innerHTML = `
      <div class="space-y-2">
        <p><strong>Acción:</strong> ${log.accion}</p>
        <p><strong>Colección:</strong> ${log.coleccion}</p>
        <p><strong>ID:</strong> ${log.documentoId}</p>
        <p><strong>Descripción:</strong> ${log.descripcion || 'N/A'}</p>
        <p><strong>Fecha:</strong> ${formatearFecha(log.timestamp)}</p>
        <pre class="bg-gray-100 p-4 rounded text-xs overflow-auto">${JSON.stringify(log.datos || {}, null, 2)}</pre>
      </div>
    `;
  }
  if (modal) modal.classList.remove('hidden');

  if (cerrarModal) {
    cerrarModal.onclick = () => {
      if (modal) modal.classList.add('hidden');
    };
  }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}


