/**
 * Módulo para mostrar eventos históricos completados
 */

import { getDoc, doc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../core/firebase-init';
import { getUsuarioActualAuth } from '../auth/auth';

interface EventoHistorico {
  id: string;
  nombre?: string;
  pin?: string;
  finalizadoEn?: unknown;
  anfitrionId?: string;
  [key: string]: unknown;
}

// Firebase ya está inicializado en firebase-init

// Estado
let eventosHistoricos: EventoHistorico[] = [];
let usuarioActual: { uid: string } | null = null;

// Elementos del DOM
const eventosLoading = document.getElementById('eventosLoading') as HTMLElement | null;
const eventosList = document.getElementById('eventosList') as HTMLElement | null;
const eventosEmpty = document.getElementById('eventosEmpty') as HTMLElement | null;
const buscarEvento = document.getElementById('buscarEvento') as HTMLInputElement | null;
const filtroTipo = document.getElementById('filtroTipo') as HTMLSelectElement | null;

/**
 * Inicializar página
 */
async function inicializar(): Promise<void> {
  usuarioActual = getUsuarioActualAuth();
  
  await cargarEventosHistoricos();
  
  // Event listeners
  if (buscarEvento) {
    buscarEvento.addEventListener('input', filtrarEventos);
  }
  if (filtroTipo) {
    filtroTipo.addEventListener('change', filtrarEventos);
  }
}

/**
 * Cargar eventos históricos
 */
async function cargarEventosHistoricos(): Promise<void> {
  try {
    if (eventosLoading) eventosLoading.classList.remove('hidden');
    if (eventosList) eventosList.classList.add('hidden');
    if (eventosEmpty) eventosEmpty.classList.add('hidden');

    const eventosRef = collection(db, 'eventos');
    const q = query(eventosRef, where('estado', '==', 'finalizado'), orderBy('finalizadoEn', 'desc'), limit(50));
    const eventosSnap = await getDocs(q);

    eventosHistoricos = [];
    eventosSnap.forEach((doc) => {
      eventosHistoricos.push({
        id: doc.id,
        ...doc.data()
      });
    });

    mostrarEventos(eventosHistoricos);
  } catch (error: unknown) {
    console.error('[Historic Events] Error al cargar eventos:', error);
  } finally {
    if (eventosLoading) eventosLoading.classList.add('hidden');
  }
}

/**
 * Mostrar eventos
 */
function mostrarEventos(eventos: EventoHistorico[]): void {
  if (!eventosList) return;

  eventosList.innerHTML = '';

  if (eventos.length === 0) {
    if (eventosList) eventosList.classList.add('hidden');
    if (eventosEmpty) eventosEmpty.classList.remove('hidden');
    return;
  }

  if (eventosList) eventosList.classList.remove('hidden');
  if (eventosEmpty) eventosEmpty.classList.add('hidden');

  eventos.forEach(evento => {
    const card = document.createElement('div');
    card.className = 'event-card bg-white rounded-lg shadow p-4';
    card.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <h3 class="font-semibold text-lg">${evento.nombre || 'Sin nombre'}</h3>
          <p class="text-sm text-gray-600">PIN: ${evento.pin || 'N/A'}</p>
          <p class="text-sm text-gray-600">Finalizado: ${formatearFecha(evento.finalizadoEn)}</p>
        </div>
        <a href="/event/events-result.html?eventoId=${evento.id}" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Ver detalles
        </a>
      </div>
    `;
    eventosList.appendChild(card);
  });
}

/**
 * Filtrar eventos
 */
function filtrarEventos(): void {
  const textoBusqueda = buscarEvento ? buscarEvento.value.toLowerCase() : '';
  const tipoFiltro = filtroTipo ? filtroTipo.value : 'todos';

  let eventosFiltrados = eventosHistoricos;

  // Filtrar por texto
  if (textoBusqueda) {
    eventosFiltrados = eventosFiltrados.filter(e => 
      (e.nombre && e.nombre.toLowerCase().includes(textoBusqueda)) ||
      (e.pin && e.pin.includes(textoBusqueda))
    );
  }

  // Filtrar por tipo
  if (tipoFiltro === 'creados' && usuarioActual) {
    eventosFiltrados = eventosFiltrados.filter(e => e.anfitrionId === usuarioActual.uid);
  } else if (tipoFiltro === 'participados' && usuarioActual) {
    // Filtrar eventos en los que el usuario participó
    // Esto requeriría consultar sesiones, simplificado aquí
  }

  mostrarEventos(eventosFiltrados);
}

/**
 * Formatear fecha
 */
function formatearFecha(timestamp: unknown): string {
  if (!timestamp) return 'N/A';
  let fecha: Date;
  if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp && typeof (timestamp as { toDate: () => Date }).toDate === 'function') {
    fecha = (timestamp as { toDate: () => Date }).toDate();
  } else {
    fecha = new Date(timestamp as string | number);
  }
  return fecha.toLocaleDateString('es-ES');
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}


