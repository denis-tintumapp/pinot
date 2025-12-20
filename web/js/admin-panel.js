/**
 * Panel de Administración de Pinot
 * Gestión de anfitriones y participantes
 * Acceso restringido a superusuario
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
  getFirestore,
  collection,
  doc,
  getDocs,
  query,
  where,
  deleteDoc,
  updateDoc,
  Timestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Importar configuración de Firebase
let firebaseConfig;
try {
  const configModule = await import('./core/firebase-config.js');
  firebaseConfig = configModule.firebaseConfig;
} catch (error) {
  console.error('Error al cargar configuración de Firebase:', error);
  alert('Error al cargar la configuración. Por favor, recarga la página.');
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Configuración de superusuario (en producción, esto debería estar en Secret Manager)
// Por ahora, usamos una contraseña simple almacenada en localStorage hasheada
const ADMIN_PASSWORD_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'; // "admin" en SHA-256

// Estado de autenticación
let isAuthenticated = false;
let currentTab = 'anfitriones';

// Elementos del DOM
const loginContainer = document.getElementById('loginContainer');
const adminContainer = document.getElementById('adminContainer');
const loginForm = document.getElementById('loginForm');
const adminPasswordInput = document.getElementById('adminPassword');
const loginError = document.getElementById('loginError');
const logoutButton = document.getElementById('logoutButton');
const tabAnfitriones = document.getElementById('tabAnfitriones');
const tabParticipantes = document.getElementById('tabParticipantes');
const tabContentAnfitriones = document.getElementById('tabContentAnfitriones');
const tabContentParticipantes = document.getElementById('tabContentParticipantes');

// Verificar autenticación al cargar
function verificarAutenticacion() {
  const authToken = localStorage.getItem('admin_auth_token');
  if (authToken && authToken === ADMIN_PASSWORD_HASH) {
    isAuthenticated = true;
    mostrarPanelAdmin();
  } else {
    mostrarLogin();
  }
}

// Mostrar login
function mostrarLogin() {
  loginContainer.classList.remove('hidden');
  adminContainer.classList.add('hidden');
  isAuthenticated = false;
  localStorage.removeItem('admin_auth_token');
}

// Mostrar panel de admin
function mostrarPanelAdmin() {
  loginContainer.classList.add('hidden');
  adminContainer.classList.remove('hidden');
  isAuthenticated = true;
  cargarDatos();
}

// Hash SHA-256 simple (para producción, usar una librería)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Manejar login
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = adminPasswordInput.value;
  
  if (!password) {
    mostrarError('Por favor, ingresa la contraseña');
    return;
  }
  
  const hashedPassword = await hashPassword(password);
  
  if (hashedPassword === ADMIN_PASSWORD_HASH) {
    localStorage.setItem('admin_auth_token', hashedPassword);
    mostrarPanelAdmin();
  } else {
    mostrarError('Contraseña incorrecta');
    adminPasswordInput.value = '';
  }
});

// Manejar logout
logoutButton?.addEventListener('click', () => {
  mostrarLogin();
});

// Manejar tabs
tabAnfitriones?.addEventListener('click', () => cambiarTab('anfitriones'));
tabParticipantes?.addEventListener('click', () => cambiarTab('participantes'));

function cambiarTab(tab) {
  currentTab = tab;
  
  // Actualizar botones de tabs
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active', 'text-purple-600', 'border-purple-600');
    btn.classList.add('text-gray-500', 'border-transparent');
  });
  
  // Ocultar todos los contenidos
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.add('hidden');
  });
  
  // Mostrar tab activo
  if (tab === 'anfitriones') {
    tabAnfitriones.classList.add('active', 'text-purple-600', 'border-purple-600');
    tabAnfitriones.classList.remove('text-gray-500', 'border-transparent');
    tabContentAnfitriones.classList.remove('hidden');
    cargarAnfitriones();
  } else {
    tabParticipantes.classList.add('active', 'text-purple-600', 'border-purple-600');
    tabParticipantes.classList.remove('text-gray-500', 'border-transparent');
    tabContentParticipantes.classList.remove('hidden');
    cargarParticipantes();
  }
}

// Mostrar error
function mostrarError(mensaje) {
  loginError.textContent = mensaje;
  loginError.classList.remove('hidden');
  setTimeout(() => {
    loginError.classList.add('hidden');
  }, 5000);
}

// Cargar datos según el tab activo
function cargarDatos() {
  if (currentTab === 'anfitriones') {
    cargarAnfitriones();
  } else {
    cargarParticipantes();
  }
}

// Cargar anfitriones
async function cargarAnfitriones() {
  const loading = document.getElementById('anfitrionesLoading');
  const table = document.getElementById('anfitrionesTable');
  const tableBody = document.getElementById('anfitrionesTableBody');
  const empty = document.getElementById('anfitrionesEmpty');
  
  loading.classList.remove('hidden');
  table.classList.add('hidden');
  empty.classList.add('hidden');
  
  try {
    const anfitrionesRef = collection(db, 'anfitriones');
    const querySnapshot = await getDocs(anfitrionesRef);
    
    const anfitriones = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      anfitriones.push({
        id: docSnap.id,
        ...data
      });
    });
    
    // Ordenar por fecha de creación (más reciente primero)
    anfitriones.sort((a, b) => {
      const fechaA = a.creadoEn?.toMillis?.() || a.creadoEn || 0;
      const fechaB = b.creadoEn?.toMillis?.() || b.creadoEn || 0;
      return fechaB - fechaA;
    });
    
    loading.classList.add('hidden');
    
    if (anfitriones.length === 0) {
      empty.classList.remove('hidden');
      return;
    }
    
    renderAnfitriones(anfitriones);
    table.classList.remove('hidden');
    
    // Configurar búsqueda y filtros
    configurarFiltrosAnfitriones(anfitriones);
    
  } catch (error) {
    console.error('Error al cargar anfitriones:', error);
    loading.classList.add('hidden');
    mostrarError('Error al cargar anfitriones: ' + error.message);
  }
}

// Renderizar anfitriones
function renderAnfitriones(anfitriones) {
  const tableBody = document.getElementById('anfitrionesTableBody');
  tableBody.innerHTML = '';
  
  anfitriones.forEach(anfitrion => {
    const row = document.createElement('tr');
    row.className = 'table-row';
    
    const fechaCreado = anfitrion.creadoEn?.toDate?.() || 
                       (anfitrion.creadoEn ? new Date(anfitrion.creadoEn) : new Date());
    const fechaFormateada = fechaCreado.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    row.innerHTML = `
      <td class="px-4 py-3 text-sm text-gray-900 font-mono">${anfitrion.id.substring(0, 8)}...</td>
      <td class="px-4 py-3 text-sm text-gray-900 font-medium">${anfitrion.alias || anfitrion.nombreAnfitrion || 'Sin alias'}</td>
      <td class="px-4 py-3 text-sm text-gray-600">${anfitrion.nombreCompleto || '-'}</td>
      <td class="px-4 py-3 text-sm text-gray-900">${anfitrion.email || 'Sin email'}</td>
      <td class="px-4 py-3 text-sm">
        <span class="badge ${anfitrion.tipo === 'efimero' ? 'badge-info' : 'badge-warning'}">
          ${anfitrion.tipo === 'efimero' ? 'Efímero' : 'Persistente'}
        </span>
      </td>
      <td class="px-4 py-3 text-sm">
        <span class="badge ${anfitrion.emailVerificado ? 'badge-success' : 'badge-warning'}">
          ${anfitrion.emailVerificado ? 'Sí' : 'No'}
        </span>
      </td>
      <td class="px-4 py-3 text-sm text-gray-900">${anfitrion.eventosCreados || 0}</td>
      <td class="px-4 py-3 text-sm text-gray-500">${fechaFormateada}</td>
      <td class="px-4 py-3 text-sm">
        <button 
          onclick="verDetallesAnfitrion('${anfitrion.id}')" 
          class="text-blue-600 hover:text-blue-800 mr-2"
          title="Ver detalles"
        >
          Ver
        </button>
        <button 
          onclick="editarAnfitrion('${anfitrion.id}')" 
          class="text-purple-600 hover:text-purple-800 mr-2"
          title="Editar"
        >
          Editar
        </button>
        <button 
          onclick="eliminarAnfitrion('${anfitrion.id}')" 
          class="text-red-600 hover:text-red-800"
          title="Eliminar"
        >
          Eliminar
        </button>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
  
  // Guardar anfitriones para filtros
  window.anfitrionesData = anfitriones;
}

// Configurar filtros de anfitriones
function configurarFiltrosAnfitriones(anfitriones) {
  const searchInput = document.getElementById('searchAnfitriones');
  const filterTipo = document.getElementById('filterTipoAnfitrion');
  
  const aplicarFiltros = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const tipoFiltro = filterTipo.value;
    
    const filtrados = anfitriones.filter(anfitrion => {
      const matchSearch = !searchTerm || 
        ((anfitrion.alias || anfitrion.nombreAnfitrion)?.toLowerCase().includes(searchTerm) ||
         anfitrion.nombreCompleto?.toLowerCase().includes(searchTerm) ||
         anfitrion.email?.toLowerCase().includes(searchTerm));
      const matchTipo = !tipoFiltro || anfitrion.tipo === tipoFiltro;
      
      return matchSearch && matchTipo;
    });
    
    renderAnfitriones(filtrados);
  };
  
  searchInput?.addEventListener('input', aplicarFiltros);
  filterTipo?.addEventListener('change', aplicarFiltros);
}

// Cargar participantes
async function cargarParticipantes() {
  const loading = document.getElementById('participantesLoading');
  const table = document.getElementById('participantesTable');
  const tableBody = document.getElementById('participantesTableBody');
  const empty = document.getElementById('participantesEmpty');
  
  loading.classList.remove('hidden');
  table.classList.add('hidden');
  empty.classList.add('hidden');
  
  try {
    const participantesRef = collection(db, 'participantes');
    const querySnapshot = await getDocs(participantesRef);
    
    const participantes = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      participantes.push({
        id: docSnap.id,
        ...data
      });
    });
    
    // Ordenar por fecha de creación (más reciente primero)
    participantes.sort((a, b) => {
      const fechaA = a.creadoEn?.toMillis?.() || a.creadoEn || 0;
      const fechaB = b.creadoEn?.toMillis?.() || b.creadoEn || 0;
      return fechaB - fechaA;
    });
    
    loading.classList.add('hidden');
    
    if (participantes.length === 0) {
      empty.classList.remove('hidden');
      return;
    }
    
    renderParticipantes(participantes);
    table.classList.remove('hidden');
    
    // Configurar búsqueda
    configurarFiltrosParticipantes(participantes);
    
  } catch (error) {
    console.error('Error al cargar participantes:', error);
    loading.classList.add('hidden');
    mostrarError('Error al cargar participantes: ' + error.message);
  }
}

// Renderizar participantes
function renderParticipantes(participantes) {
  const tableBody = document.getElementById('participantesTableBody');
  tableBody.innerHTML = '';
  
  participantes.forEach(participante => {
    const row = document.createElement('tr');
    row.className = 'table-row';
    
    const fechaCreado = participante.creadoEn?.toDate?.() || 
                       (participante.creadoEn ? new Date(participante.creadoEn) : new Date());
    const fechaFormateada = fechaCreado.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    row.innerHTML = `
      <td class="px-4 py-3 text-sm text-gray-900 font-mono">${participante.id.substring(0, 8)}...</td>
      <td class="px-4 py-3 text-sm text-gray-900">${participante.nombre || 'Sin nombre'}</td>
      <td class="px-4 py-3 text-sm text-gray-900 font-mono">${participante.eventoId?.substring(0, 8) || 'N/A'}...</td>
      <td class="px-4 py-3 text-sm text-gray-500">${fechaFormateada}</td>
      <td class="px-4 py-3 text-sm">
        <button 
          onclick="editarParticipante('${participante.id}')" 
          class="text-purple-600 hover:text-purple-800 mr-2"
          title="Editar"
        >
          Editar
        </button>
        <button 
          onclick="eliminarParticipante('${participante.id}')" 
          class="text-red-600 hover:text-red-800"
          title="Eliminar"
        >
          Eliminar
        </button>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
  
  // Guardar participantes para filtros
  window.participantesData = participantes;
}

// Configurar filtros de participantes
function configurarFiltrosParticipantes(participantes) {
  const searchInput = document.getElementById('searchParticipantes');
  
  searchInput?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    
    const filtrados = participantes.filter(participante => {
      return !searchTerm || 
        (participante.nombre?.toLowerCase().includes(searchTerm) ||
         participante.eventoId?.toLowerCase().includes(searchTerm));
    });
    
    renderParticipantes(filtrados);
  });
}

// Elementos del modal de edición
const editAnfitrionModal = document.getElementById('editAnfitrionModal');
const editAnfitrionForm = document.getElementById('editAnfitrionForm');
const editParticipanteModal = document.getElementById('editParticipanteModal');
const editParticipanteForm = document.getElementById('editParticipanteForm');

// Cerrar modales
document.getElementById('closeEditModal')?.addEventListener('click', () => {
  editAnfitrionModal.classList.add('hidden');
});

document.getElementById('cancelEditButton')?.addEventListener('click', () => {
  editAnfitrionModal.classList.add('hidden');
});

document.getElementById('closeEditParticipanteModal')?.addEventListener('click', () => {
  editParticipanteModal.classList.add('hidden');
});

document.getElementById('cancelEditParticipanteButton')?.addEventListener('click', () => {
  editParticipanteModal.classList.add('hidden');
});

// Cerrar modal al hacer clic fuera
editAnfitrionModal?.addEventListener('click', (e) => {
  if (e.target === editAnfitrionModal) {
    editAnfitrionModal.classList.add('hidden');
  }
});

editParticipanteModal?.addEventListener('click', (e) => {
  if (e.target === editParticipanteModal) {
    editParticipanteModal.classList.add('hidden');
  }
});

// Manejar envío del formulario de edición de anfitrión
editAnfitrionForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const anfitrionId = document.getElementById('editAnfitrionId').value;
  const alias = document.getElementById('editAlias').value.trim();
  const nombreCompleto = document.getElementById('editNombreCompleto').value.trim() || null;
  const email = document.getElementById('editEmail').value.trim().toLowerCase();
  const tipo = document.getElementById('editTipo').value;
  const emailVerificado = document.getElementById('editEmailVerificado').checked;
  const eventosCreados = parseInt(document.getElementById('editEventosCreados').value) || 0;
  
  const errorDiv = document.getElementById('editError');
  const saveButton = document.getElementById('saveEditButton');
  
  errorDiv.classList.add('hidden');
  saveButton.disabled = true;
  saveButton.textContent = 'Guardando...';
  
  try {
    const anfitrionRef = doc(db, 'anfitriones', anfitrionId);
    const updateData = {
      alias: alias,
      email: email,
      tipo: tipo,
      emailVerificado: emailVerificado,
      eventosCreados: eventosCreados
    };
    
    // Solo incluir nombreCompleto si tiene valor
    if (nombreCompleto) {
      updateData.nombreCompleto = nombreCompleto;
    } else {
      // Si se borró, establecer como null
      updateData.nombreCompleto = null;
    }
    
    await updateDoc(anfitrionRef, updateData);
    
    alert('Anfitrión actualizado exitosamente');
    editAnfitrionModal.classList.add('hidden');
    cargarAnfitriones();
    
  } catch (error) {
    console.error('Error al actualizar anfitrión:', error);
    errorDiv.textContent = 'Error al actualizar: ' + error.message;
    errorDiv.classList.remove('hidden');
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = 'Guardar Cambios';
  }
});

// Manejar envío del formulario de edición de participante
editParticipanteForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const participanteId = document.getElementById('editParticipanteId').value;
  const nombre = document.getElementById('editParticipanteNombre').value.trim();
  
  const errorDiv = document.getElementById('editParticipanteError');
  const saveButton = document.getElementById('saveEditParticipanteButton');
  
  errorDiv.classList.add('hidden');
  saveButton.disabled = true;
  saveButton.textContent = 'Guardando...';
  
  try {
    const participanteRef = doc(db, 'participantes', participanteId);
    await updateDoc(participanteRef, {
      nombre: nombre
    });
    
    alert('Participante actualizado exitosamente');
    editParticipanteModal.classList.add('hidden');
    cargarParticipantes();
    
  } catch (error) {
    console.error('Error al actualizar participante:', error);
    errorDiv.textContent = 'Error al actualizar: ' + error.message;
    errorDiv.classList.remove('hidden');
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = 'Guardar Cambios';
  }
});

// Funciones globales para botones
window.editarAnfitrion = async (anfitrionId) => {
  try {
    const anfitrion = window.anfitrionesData?.find(a => a.id === anfitrionId);
    if (!anfitrion) {
      alert('Anfitrión no encontrado');
      return;
    }
    
    // Llenar formulario con datos actuales
    document.getElementById('editAnfitrionId').value = anfitrion.id;
    document.getElementById('editAlias').value = anfitrion.alias || anfitrion.nombreAnfitrion || '';
    document.getElementById('editNombreCompleto').value = anfitrion.nombreCompleto || '';
    document.getElementById('editEmail').value = anfitrion.email || '';
    document.getElementById('editTipo').value = anfitrion.tipo || 'efimero';
    document.getElementById('editEmailVerificado').checked = anfitrion.emailVerificado || false;
    document.getElementById('editEventosCreados').value = anfitrion.eventosCreados || 0;
    document.getElementById('editError').classList.add('hidden');
    
    // Mostrar modal
    editAnfitrionModal.classList.remove('hidden');
    
  } catch (error) {
    console.error('Error al cargar datos para edición:', error);
    alert('Error al cargar datos del anfitrión');
  }
};

window.editarParticipante = async (participanteId) => {
  try {
    const participante = window.participantesData?.find(p => p.id === participanteId);
    if (!participante) {
      alert('Participante no encontrado');
      return;
    }
    
    // Llenar formulario con datos actuales
    document.getElementById('editParticipanteId').value = participante.id;
    document.getElementById('editParticipanteNombre').value = participante.nombre || '';
    document.getElementById('editParticipanteEventoId').value = participante.eventoId || '';
    document.getElementById('editParticipanteError').classList.add('hidden');
    
    // Mostrar modal
    editParticipanteModal.classList.remove('hidden');
    
  } catch (error) {
    console.error('Error al cargar datos para edición:', error);
    alert('Error al cargar datos del participante');
  }
};

window.verDetallesAnfitrion = async (anfitrionId) => {
  try {
    const anfitrion = window.anfitrionesData?.find(a => a.id === anfitrionId);
    if (!anfitrion) {
      alert('Anfitrión no encontrado');
      return;
    }
    
    const detalles = `
ID: ${anfitrion.id}
Alias: ${anfitrion.alias || anfitrion.nombreAnfitrion || 'Sin alias'}
Nombre Completo: ${anfitrion.nombreCompleto || 'No proporcionado'}
Email: ${anfitrion.email || 'Sin email'}
Tipo: ${anfitrion.tipo || 'N/A'}
Email Verificado: ${anfitrion.emailVerificado ? 'Sí' : 'No'}
Sesión ID: ${anfitrion.sesionId || 'N/A'}
Eventos Creados: ${anfitrion.eventosCreados || 0}
Creado: ${anfitrion.creadoEn?.toDate?.()?.toLocaleString() || 'N/A'}
Último Acceso: ${anfitrion.ultimoAcceso?.toDate?.()?.toLocaleString() || 'N/A'}
    `;
    
    alert(detalles);
  } catch (error) {
    console.error('Error al ver detalles:', error);
    alert('Error al cargar detalles');
  }
};

window.eliminarAnfitrion = async (anfitrionId) => {
  if (!confirm('¿Estás seguro de que deseas eliminar este anfitrión? Esta acción no se puede deshacer.')) {
    return;
  }
  
  try {
    const anfitrionRef = doc(db, 'anfitriones', anfitrionId);
    await deleteDoc(anfitrionRef);
    alert('Anfitrión eliminado exitosamente');
    cargarAnfitriones();
  } catch (error) {
    console.error('Error al eliminar anfitrión:', error);
    alert('Error al eliminar anfitrión: ' + error.message);
  }
};

window.eliminarParticipante = async (participanteId) => {
  if (!confirm('¿Estás seguro de que deseas eliminar este participante? Esta acción no se puede deshacer.')) {
    return;
  }
  
  try {
    const participanteRef = doc(db, 'participantes', participanteId);
    await deleteDoc(participanteRef);
    alert('Participante eliminado exitosamente');
    cargarParticipantes();
  } catch (error) {
    console.error('Error al eliminar participante:', error);
    alert('Error al eliminar participante: ' + error.message);
  }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', verificarAutenticacion);
} else {
  verificarAutenticacion();
}
