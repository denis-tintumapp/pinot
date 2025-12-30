/**
 * @deprecated Este archivo está siendo migrado a React.
 * 
 * La funcionalidad de dashboard ha sido integrada en:
 * - src/pages/admin/AdminPage.tsx (componente principal)
 * 
 * Este archivo se mantiene temporalmente para referencia durante la migración.
 * NO se debe usar en producción. Usar React Router y los componentes React en su lugar.
 * 
 * Dashboard de Administración - Panel de resumen
 * Carga datos KPI, gráfico de crecimiento y tabla de eventos recientes
 */

import { 
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../core/firebase-init';

// Firebase ya está inicializado en firebase-init

// Variables globales
let userGrowthChart = null;
let eventosData = [];
let participantesData = [];

// Hash SHA-256 para verificación
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Hash por defecto (PinotAdmin)
const ADMIN_PASSWORD_HASH = '7bf7c752cb6584691a81d44f29ea5b3bbe9f5b8dc7f81e9347388edc3d03a46f';

// Obtener hash de contraseña desde Firestore
async function obtenerPasswordHash() {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const configRef = doc(db, 'admin_config', 'password');
    const configSnap = await getDoc(configRef);
    
    if (configSnap.exists()) {
      const data = configSnap.data();
      if (data.passwordHash && typeof data.passwordHash === 'string' && data.passwordHash.length === 64) {
        return data.passwordHash;
      }
    }
    
    return ADMIN_PASSWORD_HASH;
  } catch (error) {
    console.error('Error al obtener password hash:', error);
    return ADMIN_PASSWORD_HASH;
  }
}

// Verificar autenticación antes de cargar datos
async function verificarAutenticacion() {
  try {
    const authToken = localStorage.getItem('admin_auth_token');
    if (!authToken) {
      console.warn('⚠️ No hay token de autenticación');
      mostrarMensajeLogin();
      return false;
    }
    
    // Obtener el hash actual desde Firestore
    const currentHash = await obtenerPasswordHash();
    
    if (authToken === currentHash) {
      console.log('✅ Autenticación exitosa');
      return true;
    } else {
      console.warn('⚠️ Token no coincide, limpiando y mostrando login');
      localStorage.removeItem('admin_auth_token');
      mostrarMensajeLogin();
      return false;
    }
  } catch (error) {
    console.error('Error al verificar autenticación:', error);
    mostrarMensajeLogin();
    return false;
  }
}

// Mostrar mensaje de login requerido
function mostrarMensajeLogin() {
  document.body.innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
      <div class="text-center bg-white p-8 rounded-lg shadow-lg max-w-md mx-4">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Acceso Requerido</h2>
        <p class="text-gray-700 mb-6">Debes iniciar sesión para acceder al dashboard</p>
        <a href="/admin/admin-ui.html" class="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold">
          Ir al Login
        </a>
      </div>
    </div>
  `;
}

// Cargar datos de KPI
async function cargarKPIs() {
  try {
    // Eventos activos (activo === true)
    const eventosActivosQuery = query(
      collection(db, 'eventos'),
      where('activo', '==', true)
    );
    const eventosActivosSnapshot = await getDocs(eventosActivosQuery);
    const eventosActivos = eventosActivosSnapshot.size;
    
    // Calcular eventos de esta semana
    const unaSemanaAtras = new Date();
    unaSemanaAtras.setDate(unaSemanaAtras.getDate() - 7);
    let eventosEstaSemana = 0;
    eventosActivosSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.creadoEn) {
        const fechaCreacion = data.creadoEn.toDate ? data.creadoEn.toDate() : new Date(data.creadoEn);
        if (fechaCreacion >= unaSemanaAtras) {
          eventosEstaSemana++;
        }
      }
    });
    
    // Usuarios activos (participantes con userId)
    const participantesQuery = query(
      collection(db, 'participantes'),
      where('userId', '!=', null)
    );
    const participantesSnapshot = await getDocs(participantesQuery);
    const usuariosActivos = participantesSnapshot.size;
    
    // Calcular nuevos usuarios esta semana
    let nuevosUsuarios = 0;
    participantesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.creadoEn) {
        const fechaCreacion = data.creadoEn.toDate ? data.creadoEn.toDate() : new Date(data.creadoEn);
        if (fechaCreacion >= unaSemanaAtras) {
          nuevosUsuarios++;
        }
      }
    });
    
    // Eventos totales
    const eventosTotalesQuery = query(collection(db, 'eventos'));
    const eventosTotalesSnapshot = await getDocs(eventosTotalesQuery);
    const eventosTotales = eventosTotalesSnapshot.size;
    
    // Productos/Etiquetas totales
    const etiquetasQuery = query(collection(db, 'etiquetas'));
    const etiquetasSnapshot = await getDocs(etiquetasQuery);
    const productos = etiquetasSnapshot.size;
    
    // Calcular productos nuevos esta semana
    let productosNuevos = 0;
    etiquetasSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.creadoEn) {
        const fechaCreacion = data.creadoEn.toDate ? data.creadoEn.toDate() : new Date(data.creadoEn);
        if (fechaCreacion >= unaSemanaAtras) {
          productosNuevos++;
        }
      }
    });
    
    // Actualizar UI
    document.getElementById('kpiEventosActivos').textContent = eventosActivos;
    document.getElementById('kpiEventosActivosSub').textContent = `+${eventosEstaSemana} eventos esta semana`;
    
    document.getElementById('kpiUsuariosActivos').textContent = usuariosActivos.toLocaleString();
    document.getElementById('kpiUsuariosActivosSub').textContent = `+${nuevosUsuarios} nuevos usuarios`;
    
    document.getElementById('kpiEventosTotales').textContent = eventosTotales;
    
    document.getElementById('kpiProductos').textContent = productos.toLocaleString();
    document.getElementById('kpiProductosSub').textContent = `+${productosNuevos} productos nuevos`;
    
  } catch (error) {
    console.error('Error al cargar KPIs:', error);
    // Mostrar valores por defecto en caso de error
    document.getElementById('kpiEventosActivos').textContent = '0';
    document.getElementById('kpiUsuariosActivos').textContent = '0';
    document.getElementById('kpiEventosTotales').textContent = '0';
    document.getElementById('kpiProductos').textContent = '0';
  }
}

// Cargar datos históricos para gráfico
async function cargarDatosGrafico() {
  try {
    // Obtener todos los participantes ordenados por fecha de creación
    const participantesQuery = query(
      collection(db, 'participantes'),
      orderBy('creadoEn', 'asc')
    );
    const participantesSnapshot = await getDocs(participantesQuery);
    
    // Obtener fecha actual y calcular últimos 7 meses
    const ahora = new Date();
    const meses = [];
    const valores = [];
    
    // Generar array de últimos 7 meses
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const mesNombre = fecha.toLocaleDateString('es-ES', { month: 'short' });
      meses.push(mesNombre);
      valores.push(0);
    }
    
    // Agrupar participantes por mes
    participantesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.creadoEn) {
        const fecha = data.creadoEn.toDate ? data.creadoEn.toDate() : new Date(data.creadoEn);
        
        // Calcular diferencia de meses desde ahora
        const diffMeses = (ahora.getFullYear() - fecha.getFullYear()) * 12 + (ahora.getMonth() - fecha.getMonth());
        
        // Si está dentro de los últimos 7 meses
        if (diffMeses >= 0 && diffMeses <= 6) {
          const mesIndex = 6 - diffMeses; // Invertir índice (mes más reciente al final)
          if (mesIndex >= 0 && mesIndex < valores.length) {
            valores[mesIndex]++;
          }
        }
      }
    });
    
    // Si no hay datos, usar valores de ejemplo para demostración
    if (valores.every(v => v === 0)) {
      // Generar datos de ejemplo con tendencia creciente
      const baseValue = 50;
      valores.forEach((_, index) => {
        valores[index] = baseValue + (index * 20) + Math.floor(Math.random() * 30);
      });
    }
    
    // Renderizar gráfico
    renderizarGrafico(meses, valores);
    
  } catch (error) {
    console.error('Error al cargar datos del gráfico:', error);
    // Renderizar gráfico con datos de ejemplo
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'];
    const valoresEjemplo = [120, 180, 250, 320, 380, 450, 520];
    renderizarGrafico(meses, valoresEjemplo);
  }
}

// Renderizar gráfico con Chart.js
function renderizarGrafico(meses, valores) {
  const ctx = document.getElementById('userGrowthChart');
  if (!ctx) return;
  
  // Destruir gráfico anterior si existe
  if (userGrowthChart) {
    userGrowthChart.destroy();
  }
  
  userGrowthChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: meses,
      datasets: [{
        label: 'Nuevos Usuarios',
        data: valores,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: {
              family: 'DM Sans',
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            family: 'DM Sans',
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            family: 'DM Sans',
            size: 12
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: Math.max(...valores, 600),
          ticks: {
            stepSize: 150,
            font: {
              family: 'DM Sans',
              size: 11
            },
            color: '#6b7280'
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          ticks: {
            font: {
              family: 'DM Sans',
              size: 11
            },
            color: '#6b7280'
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// Cargar eventos recientes
async function cargarEventosRecientes() {
  try {
    const eventosQuery = query(
      collection(db, 'eventos'),
      orderBy('creadoEn', 'desc'),
      limit(10)
    );
    const eventosSnapshot = await getDocs(eventosQuery);
    
    eventosData = [];
    eventosSnapshot.forEach(doc => {
      eventosData.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    renderizarTablaEventos(eventosData);
    
  } catch (error) {
    console.error('Error al cargar eventos recientes:', error);
    document.getElementById('eventsTableBody').innerHTML = 
      '<tr><td colspan="5" class="text-center py-8 text-red-500">Error al cargar eventos</td></tr>';
  }
}

// Renderizar tabla de eventos
function renderizarTablaEventos(eventos) {
  const tbody = document.getElementById('eventsTableBody');
  if (!tbody) return;
  
  if (eventos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-500">No hay eventos recientes</td></tr>';
    return;
  }
  
  tbody.innerHTML = eventos.map((evento, index) => {
    // Generar ID de evento en formato EVT-001, EVT-002, etc.
    const eventoId = `EVT-${String(index + 1).padStart(3, '0')}`;
    const nombre = evento.nombre || 'Sin nombre';
    const activo = evento.activo === true;
    const estado = activo ? 'En curso' : 'Próximo';
    const estadoClass = activo ? 'status-en-curso' : 'status-proximo';
    
    // Formatear fecha
    let fechaStr = 'N/A';
    if (evento.creadoEn) {
      const fecha = evento.creadoEn.toDate ? evento.creadoEn.toDate() : new Date(evento.creadoEn);
      fechaStr = fecha.toISOString().split('T')[0];
    }
    
    // Contar participantes (sitios)
    const sitios = evento.participantes?.length || 0;
    
    // Iconos según el tipo - mayoría con corona, algunos con escudo
    const icono = index % 3 === 0 ? '🛡️' : '👑';
    
    return `
      <tr>
        <td class="font-mono text-sm">${eventoId}</td>
        <td>
          <div class="flex items-center gap-2">
            <span class="text-base">${icono}</span>
            <span>${nombre}</span>
          </div>
        </td>
        <td>
          <span class="status-badge ${estadoClass}">${estado}</span>
        </td>
        <td>${sitios}</td>
        <td>${fechaStr}</td>
      </tr>
    `;
  }).join('');
}

// Función de búsqueda
function inicializarBusqueda() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;
  
  searchInput.addEventListener('input', (e) => {
    const termino = e.target.value.toLowerCase().trim();
    
    if (termino === '') {
      renderizarTablaEventos(eventosData);
      return;
    }
    
    const eventosFiltrados = eventosData.filter(evento => {
      const nombre = (evento.nombre || '').toLowerCase();
      const id = evento.id.toLowerCase();
      return nombre.includes(termino) || id.includes(termino);
    });
    
    renderizarTablaEventos(eventosFiltrados);
  });
}

// Inicializar menú móvil
function inicializarMenuMovil() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const menuButton = document.getElementById('mobileMenuButton');
  
  if (!sidebar || !overlay || !menuButton) return;
  
  // Abrir sidebar
  menuButton.addEventListener('click', () => {
    sidebar.classList.add('mobile-open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
  
  // Cerrar sidebar al hacer clic en overlay
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  });
  
  // Cerrar sidebar al hacer clic en un enlace (solo en móvil)
  if (window.innerWidth <= 768) {
    const menuItems = sidebar.querySelectorAll('.sidebar-menu-item');
    menuItems.forEach(item => {
      item.addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }
}

// Inicializar dashboard
async function inicializarDashboard() {
  // Verificar autenticación
  const autenticado = await verificarAutenticacion();
  
  if (!autenticado) {
    return;
  }
  
  // Inicializar menú móvil
  inicializarMenuMovil();
  
  // Cargar todos los datos
  await Promise.all([
    cargarKPIs(),
    cargarDatosGrafico(),
    cargarEventosRecientes()
  ]);
  
  // Inicializar búsqueda
  inicializarBusqueda();
  
  console.log('✅ Dashboard inicializado correctamente');
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarDashboard);
} else {
  inicializarDashboard();
}














