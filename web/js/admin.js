import { 
  listarEventos as getEventosFirestore, 
  listarParticipantes as getParticipantesFirestore, 
  listarEtiquetas as getEtiquetasFirestore, 
  formatearFechaParaUI 
} from './firestore.js';

let adminVisible = false;

/**
 * Inicializar el panel de admin
 */
export function initAdmin() {
  console.log('🔧 Inicializando panel de admin...');
  const btnAdmin = document.getElementById('btnAdmin');
  const seccionAdmin = document.getElementById('seccionAdmin');
  
  console.log('btnAdmin:', btnAdmin);
  console.log('seccionAdmin:', seccionAdmin);
  
  if (!btnAdmin || !seccionAdmin) {
    console.error('❌ Elementos del admin no encontrados');
    console.error('btnAdmin existe:', !!btnAdmin);
    console.error('seccionAdmin existe:', !!seccionAdmin);
    return;
  }
  
  btnAdmin.onclick = () => {
    console.log('👆 Click en botón Admin');
    toggleAdmin();
  };
  initCerrarAdmin();
  console.log('✅ Panel de admin inicializado correctamente');
}

/**
 * Mostrar/ocultar panel de admin
 */
function toggleAdmin() {
  console.log('🔄 toggleAdmin llamado, adminVisible:', adminVisible);
  const seccionAdmin = document.getElementById('seccionAdmin');
  adminVisible = !adminVisible;
  
  if (adminVisible) {
    console.log('📂 Mostrando panel de admin');
    seccionAdmin.classList.remove('hidden');
    cargarDatosAdmin();
  } else {
    console.log('📁 Ocultando panel de admin');
    seccionAdmin.classList.add('hidden');
  }
}

/**
 * Inicializar botón de cerrar admin
 */
function initCerrarAdmin() {
  const btnCerrar = document.getElementById('btnCerrarAdmin');
  if (btnCerrar) {
    btnCerrar.onclick = () => toggleAdmin();
  }
}

/**
 * Cargar todos los datos para el panel de admin
 */
async function cargarDatosAdmin() {
  const contenedorAdmin = document.getElementById('contenedorAdmin');
  if (!contenedorAdmin) return;
  
  contenedorAdmin.innerHTML = '<p class="text-gray-600">Cargando datos...</p>';
  
  try {
    // Obtener todos los eventos
    const rEventos = await getEventosFirestore();
    
    if (!rEventos.ok || !rEventos.data) {
      contenedorAdmin.innerHTML = '<p class="text-red-600">Error al cargar eventos</p>';
      return;
    }
    
    const eventos = rEventos.data;
    
    if (eventos.length === 0) {
      contenedorAdmin.innerHTML = '<p class="text-gray-600">No hay eventos registrados</p>';
      return;
    }
    
    // Cargar participantes y etiquetas para cada evento
    const eventosConDatos = await Promise.all(
      eventos.map(async (evento) => {
        const [rParticipantes, rEtiquetas] = await Promise.all([
          getParticipantesFirestore(evento.id),
          getEtiquetasFirestore(evento.id)
        ]);
        
        return {
          ...evento,
          participantes: rParticipantes.ok ? rParticipantes.data : [],
          etiquetas: rEtiquetas.ok ? rEtiquetas.data : []
        };
      })
    );
    
    renderAdmin(eventosConDatos);
    
  } catch (error) {
    console.error('Error al cargar datos del admin:', error);
    contenedorAdmin.innerHTML = '<p class="text-red-600">Error inesperado al cargar datos</p>';
  }
}

/**
 * Renderizar la vista de admin con todos los eventos
 */
function renderAdmin(eventos) {
  const contenedorAdmin = document.getElementById('contenedorAdmin');
  if (!contenedorAdmin) return;
  
  // Ordenar eventos por fecha (más reciente primero)
  eventos.sort((a, b) => {
    const fechaA = new Date(a.fecha || 0);
    const fechaB = new Date(b.fecha || 0);
    return fechaB - fechaA;
  });
  
  const fragment = document.createDocumentFragment();
  
  eventos.forEach((evento, index) => {
    const card = crearCardEvento(evento, index);
    fragment.appendChild(card);
  });
  
  contenedorAdmin.innerHTML = '';
  contenedorAdmin.appendChild(fragment);
}

/**
 * Crear card para un evento con sus datos
 */
function crearCardEvento(evento, index) {
  const div = document.createElement('div');
  div.className = 'bg-white rounded-xl shadow p-6 space-y-4 border-2 ' + 
    (evento.activo ? 'border-purple-500' : 'border-gray-200');
  
  // Header del evento
  const header = document.createElement('div');
  header.className = 'flex items-start justify-between';
  
  const info = document.createElement('div');
  info.className = 'flex-1';
  
  const titulo = document.createElement('h3');
  titulo.className = 'text-lg font-semibold text-gray-900';
  const fechaMostrar = formatearFechaParaUI(evento.fecha);
  titulo.textContent = `${fechaMostrar} — ${evento.nombre || 'Sin nombre'}`;
  
  const badges = document.createElement('div');
  badges.className = 'flex gap-2 mt-2';
  
  if (evento.activo) {
    const badgeActivo = document.createElement('span');
    badgeActivo.className = 'text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700';
    badgeActivo.textContent = 'Activo';
    badges.appendChild(badgeActivo);
  }
  
  const badgeParticipantes = document.createElement('span');
  badgeParticipantes.className = 'text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700';
  badgeParticipantes.textContent = `${evento.participantes?.length || 0} participantes`;
  badges.appendChild(badgeParticipantes);
  
  const badgeEtiquetas = document.createElement('span');
  badgeEtiquetas.className = 'text-xs px-2 py-1 rounded-full bg-green-100 text-green-700';
  badgeEtiquetas.textContent = `${evento.etiquetas?.length || 0} etiquetas`;
  badges.appendChild(badgeEtiquetas);
  
  info.appendChild(titulo);
  info.appendChild(badges);
  
  // Botón expandir/colapsar
  const btnExpandir = document.createElement('button');
  btnExpandir.className = 'text-gray-500 hover:text-gray-700 text-sm px-3 py-1 rounded border';
  btnExpandir.textContent = 'Ver detalles';
  btnExpandir.onclick = () => toggleDetalles(evento.id);
  
  header.appendChild(info);
  header.appendChild(btnExpandir);
  
  // Contenedor de detalles (inicialmente oculto)
  const detalles = document.createElement('div');
  detalles.id = `detalles-${evento.id}`;
  detalles.className = 'hidden mt-4 pt-4 border-t space-y-4';
  
  // Participantes
  const seccionParticipantes = crearSeccionDetalles(
    'Participantes',
    evento.participantes || [],
    (p) => p.nombre
  );
  
  // Etiquetas
  const seccionEtiquetas = crearSeccionDetalles(
    'Etiquetas y Naipes',
    evento.etiquetas || [],
    (e) => `${e.etiquetaNombre || 'Sin nombre'} → ${e.naipeNombre || 'Sin naipe'}`
  );
  
  detalles.appendChild(seccionParticipantes);
  detalles.appendChild(seccionEtiquetas);
  
  div.appendChild(header);
  div.appendChild(detalles);
  
  return div;
}

/**
 * Crear sección de detalles (participantes o etiquetas)
 */
function crearSeccionDetalles(titulo, items, formatearItem) {
  const seccion = document.createElement('div');
  
  const tituloSeccion = document.createElement('h4');
  tituloSeccion.className = 'text-sm font-semibold text-gray-700 mb-2';
  tituloSeccion.textContent = `${titulo} (${items.length})`;
  
  const lista = document.createElement('ul');
  lista.className = 'space-y-1 text-sm text-gray-600';
  
  if (items.length === 0) {
    const li = document.createElement('li');
    li.className = 'text-gray-400 italic';
    li.textContent = `No hay ${titulo.toLowerCase()}`;
    lista.appendChild(li);
  } else {
    items.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'px-2 py-1 bg-gray-50 rounded';
      li.textContent = formatearItem(item);
      lista.appendChild(li);
    });
  }
  
  seccion.appendChild(tituloSeccion);
  seccion.appendChild(lista);
  
  return seccion;
}

/**
 * Expandir/colapsar detalles de un evento
 */
function toggleDetalles(eventoId) {
  const detalles = document.getElementById(`detalles-${eventoId}`);
  if (!detalles) return;
  
  const estaOculto = detalles.classList.contains('hidden');
  
  if (estaOculto) {
    detalles.classList.remove('hidden');
    // Cambiar texto del botón
    const btn = detalles.previousElementSibling?.querySelector('button');
    if (btn) btn.textContent = 'Ocultar detalles';
  } else {
    detalles.classList.add('hidden');
    const btn = detalles.previousElementSibling?.querySelector('button');
    if (btn) btn.textContent = 'Ver detalles';
  }
}

export { toggleAdmin };

