/**
 * @deprecated Este archivo está siendo migrado a React.
 * 
 * La funcionalidad ha sido migrada a:
 * - src/pages/admin/AdminPage.tsx (componente principal)
 * - src/hooks/useAdminAuth.ts (autenticación admin)
 * - src/hooks/useAdminAnfitriones.ts (gestión de anfitriones)
 * - src/hooks/useAdminParticipantes.ts (gestión de participantes)
 * - src/hooks/useAdminEventos.ts (gestión de eventos)
 * - src/hooks/useAdminEtiquetas.ts (gestión de etiquetas)
 * - src/components/admin/AdminLogin.tsx (componente de login)
 * - src/components/admin/ChangePasswordModal.tsx (cambio de contraseña)
 * 
 * Este archivo se mantiene temporalmente para referencia durante la migración.
 * NO se debe usar en producción. Usar React Router y los componentes React en su lugar.
 * 
 * Panel de Administración de Pinot
 * Gestión de anfitriones y participantes
 * Acceso restringido a superusuario
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  query,
  where,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

// Importar configuración de Firebase
import { firebaseConfig } from '../core/firebase-config.js';

// Inicializar Firebase
if (!firebaseConfig) {
  console.error('Error: firebaseConfig no está definido');
  alert('Error al cargar la configuración de Firebase. Por favor, recarga la página.');
  throw new Error('Firebase config no disponible');
}

// Firebase ya está inicializado en firebase-init

// Función para registrar logs de operaciones
async function registrarLog(accion, coleccion, documentoId, datos = null, datosAnteriores = null, descripcion = null) {
  try {
    const logsRef = collection(db, 'admin_logs');
    await addDoc(logsRef, {
      accion: accion, // 'create', 'update', 'delete', 'read'
      coleccion: coleccion,
      documentoId: documentoId,
      datos: datos,
      datosAnteriores: datosAnteriores,
      descripcion: descripcion || `${accion.toUpperCase()} en ${coleccion}`,
      usuario: 'Admin Panel',
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error al registrar log:', error);
    // No bloquear el flujo si falla el logging
  }
}

// Configuración de superusuario (en producción, esto debería estar en Secret Manager)
// Por ahora, usamos una contraseña simple almacenada en localStorage hasheada
const ADMIN_PASSWORD_HASH = '7bf7c752cb6584691a81d44f29ea5b3bbe9f5b8dc7f81e9347388edc3d03a46f'; // "PinotAdmin" en SHA-256

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
const changePasswordButton = document.getElementById('changePasswordButton');
const changePasswordModal = document.getElementById('changePasswordModal');
const changePasswordForm = document.getElementById('changePasswordForm');
const cancelChangePassword = document.getElementById('cancelChangePassword');
const currentPasswordInput = document.getElementById('currentPassword');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const changePasswordError = document.getElementById('changePasswordError');
const changePasswordSuccess = document.getElementById('changePasswordSuccess');
const tabAnfitriones = document.getElementById('tabAnfitriones');
const tabParticipantes = document.getElementById('tabParticipantes');
const tabEventos = document.getElementById('tabEventos');
const tabEtiquetas = document.getElementById('tabEtiquetas');
const tabContentAnfitriones = document.getElementById('tabContentAnfitriones');
const tabContentParticipantes = document.getElementById('tabContentParticipantes');
const tabContentEventos = document.getElementById('tabContentEventos');
const tabContentEtiquetas = document.getElementById('tabContentEtiquetas');

// Verificar autenticación al cargar
async function verificarAutenticacion() {
  try {
    const authToken = localStorage.getItem('admin_auth_token');
    console.log('🔐 Verificando autenticación, token en localStorage:', authToken ? 'existe' : 'no existe');
    
    if (!authToken) {
      console.log('ℹ️ No hay token, mostrando login');
      mostrarLogin();
      return;
    }
    
    // Obtener el hash actual desde Firestore
    const currentHash = await obtenerPasswordHash();
    console.log('🔑 Hash actual obtenido:', currentHash ? 'existe' : 'no existe');
    console.log('🔑 Comparando tokens:', {
      authTokenLength: authToken.length,
      currentHashLength: currentHash.length,
      coinciden: authToken === currentHash
    });
    
    if (authToken === currentHash) {
      console.log('✅ Autenticación exitosa');
      isAuthenticated = true;
      mostrarPanelAdmin();
    } else {
      console.warn('⚠️ Token no coincide, limpiando y mostrando login');
      // El token no coincide con la contraseña actual, limpiar y mostrar login
      localStorage.removeItem('admin_auth_token');
      mostrarLogin();
    }
  } catch (error) {
    console.error('❌ Error al verificar autenticación:', error);
    // En caso de error, mostrar login para que el usuario pueda intentar ingresar
    mostrarLogin();
  }
}

// Mostrar login
function mostrarLogin() {
  if (loginContainer) {
    loginContainer.classList.remove('hidden');
  }
  if (adminContainer) {
    adminContainer.classList.add('hidden');
  }
  isAuthenticated = false;
  localStorage.removeItem('admin_auth_token');
  // Enfocar el campo de contraseña
  if (adminPasswordInput) {
    adminPasswordInput.focus();
  }
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

// Obtener hash de contraseña desde Firestore (o usar el por defecto)
async function obtenerPasswordHash() {
  try {
    const configRef = doc(db, 'admin_config', 'password');
    const configSnap = await getDoc(configRef);
    
    if (configSnap.exists()) {
      const data = configSnap.data();
      if (data.passwordHash && typeof data.passwordHash === 'string' && data.passwordHash.length === 64) {
        console.log('✅ Hash encontrado en Firestore');
        return data.passwordHash;
      } else {
        console.warn('⚠️ Documento existe pero passwordHash inválido, usando hash por defecto');
      }
    } else {
      console.log('ℹ️ No hay documento en Firestore, usando hash por defecto (PinotAdmin)');
    }
    
    // Si no existe en Firestore o el hash es inválido, usar el hash por defecto
    return ADMIN_PASSWORD_HASH;
  } catch (error) {
    console.error('❌ Error al obtener password hash desde Firestore:', error);
    console.log('ℹ️ Usando hash por defecto debido al error');
    // En caso de error, usar el hash por defecto
    return ADMIN_PASSWORD_HASH;
  }
}

// Actualizar contraseña en Firestore
async function actualizarPassword(nuevaPassword) {
  try {
    const nuevoHash = await hashPassword(nuevaPassword);
    const configRef = doc(db, 'admin_config', 'password');
    await setDoc(configRef, {
      passwordHash: nuevoHash
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error al actualizar password:', error);
    return false;
  }
}

// Manejar login
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = adminPasswordInput.value;
  
  if (!password) {
    mostrarError('Por favor, ingresa la contraseña');
    return;
  }
  
  try {
    console.log('🔐 Procesando login...');
    const hashedPassword = await hashPassword(password);
    console.log('🔑 Hash de contraseña ingresada:', hashedPassword);
    
    // Obtener el hash actual desde Firestore
    const currentHash = await obtenerPasswordHash();
    console.log('🔑 Hash esperado:', currentHash);
    console.log('🔑 Comparación:', {
      hashedPasswordLength: hashedPassword.length,
      currentHashLength: currentHash.length,
      coinciden: hashedPassword === currentHash
    });
    
    if (hashedPassword === currentHash) {
      console.log('✅ Contraseña correcta, guardando token');
      localStorage.setItem('admin_auth_token', hashedPassword);
      mostrarPanelAdmin();
    } else {
      console.warn('⚠️ Contraseña incorrecta');
      mostrarError('Contraseña incorrecta');
      if (adminPasswordInput) {
        adminPasswordInput.value = '';
        adminPasswordInput.focus();
      }
    }
  } catch (error) {
    console.error('❌ Error al procesar login:', error);
    mostrarError('Error al procesar el login. Por favor, intenta nuevamente.');
  }
});

// Manejar logout
logoutButton?.addEventListener('click', () => {
  mostrarLogin();
});

// Funciones para el modal de cambio de contraseña
function mostrarModalCambiarPassword() {
  if (changePasswordModal) {
    changePasswordModal.classList.remove('hidden');
    if (currentPasswordInput) {
      currentPasswordInput.focus();
    }
  }
}

function ocultarModalCambiarPassword() {
  if (changePasswordModal) {
    changePasswordModal.classList.add('hidden');
    if (changePasswordForm) {
      changePasswordForm.reset();
    }
    if (changePasswordError) {
      changePasswordError.classList.add('hidden');
      changePasswordError.textContent = '';
    }
    if (changePasswordSuccess) {
      changePasswordSuccess.classList.add('hidden');
      changePasswordSuccess.textContent = '';
    }
  }
}

function mostrarErrorCambioPassword(mensaje) {
  if (changePasswordError) {
    changePasswordError.textContent = mensaje;
    changePasswordError.classList.remove('hidden');
  }
  if (changePasswordSuccess) {
    changePasswordSuccess.classList.add('hidden');
  }
}

function mostrarExitoCambioPassword(mensaje) {
  if (changePasswordSuccess) {
    changePasswordSuccess.textContent = mensaje;
    changePasswordSuccess.classList.remove('hidden');
  }
  if (changePasswordError) {
    changePasswordError.classList.add('hidden');
  }
}

// Event listeners para el modal de cambio de contraseña
changePasswordButton?.addEventListener('click', () => {
  mostrarModalCambiarPassword();
});

cancelChangePassword?.addEventListener('click', () => {
  ocultarModalCambiarPassword();
});

// Cerrar modal al hacer clic fuera de él
changePasswordModal?.addEventListener('click', (e) => {
  if (e.target === changePasswordModal) {
    ocultarModalCambiarPassword();
  }
});

// Manejar envío del formulario de cambio de contraseña
changePasswordForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const currentPassword = currentPasswordInput?.value;
  const newPassword = newPasswordInput?.value;
  const confirmPassword = confirmPasswordInput?.value;
  
  // Validaciones
  if (!currentPassword || !newPassword || !confirmPassword) {
    mostrarErrorCambioPassword('Por favor, completa todos los campos');
    return;
  }
  
  if (newPassword.length < 6) {
    mostrarErrorCambioPassword('La nueva contraseña debe tener al menos 6 caracteres');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    mostrarErrorCambioPassword('Las contraseñas no coinciden');
    return;
  }
  
  // Verificar que la contraseña actual sea correcta
  const currentHash = await hashPassword(currentPassword);
  const storedHash = await obtenerPasswordHash();
  
  if (currentHash !== storedHash) {
    mostrarErrorCambioPassword('La contraseña actual es incorrecta');
    if (currentPasswordInput) {
      currentPasswordInput.value = '';
      currentPasswordInput.focus();
    }
    return;
  }
  
  // Actualizar la contraseña
  const exito = await actualizarPassword(newPassword);
  
  if (exito) {
    // Actualizar el token en localStorage
    const nuevoHash = await hashPassword(newPassword);
    localStorage.setItem('admin_auth_token', nuevoHash);
    
    mostrarExitoCambioPassword('Contraseña actualizada correctamente');
    
    // Cerrar el modal después de 2 segundos
    setTimeout(() => {
      ocultarModalCambiarPassword();
    }, 2000);
  } else {
    mostrarErrorCambioPassword('Error al actualizar la contraseña. Por favor, intenta nuevamente.');
  }
});

// Manejar tabs
tabAnfitriones?.addEventListener('click', () => cambiarTab('anfitriones'));
tabParticipantes?.addEventListener('click', () => cambiarTab('participantes'));
tabEventos?.addEventListener('click', () => cambiarTab('eventos'));
tabEtiquetas?.addEventListener('click', () => cambiarTab('etiquetas'));

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
  } else if (tab === 'participantes') {
    tabParticipantes.classList.add('active', 'text-purple-600', 'border-purple-600');
    tabParticipantes.classList.remove('text-gray-500', 'border-transparent');
    tabContentParticipantes.classList.remove('hidden');
    cargarParticipantes();
  } else if (tab === 'eventos') {
    tabEventos.classList.add('active', 'text-purple-600', 'border-purple-600');
    tabEventos.classList.remove('text-gray-500', 'border-transparent');
    tabContentEventos.classList.remove('hidden');
    cargarEventos();
  } else if (tab === 'etiquetas') {
    tabEtiquetas.classList.add('active', 'text-purple-600', 'border-purple-600');
    tabEtiquetas.classList.remove('text-gray-500', 'border-transparent');
    tabContentEtiquetas.classList.remove('hidden');
    cargarEtiquetas();
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
  } else if (currentTab === 'participantes') {
    cargarParticipantes();
  } else if (currentTab === 'eventos') {
    cargarEventos();
  } else if (currentTab === 'etiquetas') {
    cargarEtiquetas();
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

// Renderizar anfitriones con edición inline
function renderAnfitriones(anfitriones) {
  const tableBody = document.getElementById('anfitrionesTableBody');
  tableBody.innerHTML = '';
  
  anfitriones.forEach(anfitrion => {
    const row = document.createElement('tr');
    row.className = 'table-row';
    row.dataset.anfitrionId = anfitrion.id;
    row.dataset.editing = 'false';
    
    const fechaCreado = anfitrion.creadoEn?.toDate?.() || 
                       (anfitrion.creadoEn ? new Date(anfitrion.creadoEn) : new Date());
    const fechaFormateada = fechaCreado.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Guardar datos originales para cancelar edición
    row.dataset.originalData = JSON.stringify({
      alias: anfitrion.alias || anfitrion.nombreAnfitrion || '',
      nombreCompleto: anfitrion.nombreCompleto || '',
      email: anfitrion.email || '',
      telefono: anfitrion.telefono || '',
      instagram: anfitrion.instagram || '',
      tipo: anfitrion.tipo || 'efimero',
      emailVerificado: anfitrion.emailVerificado || false,
      eventosCreados: anfitrion.eventosCreados || 0
    });
    
    row.innerHTML = `
      <td class="px-4 py-3 text-sm text-gray-900 font-mono">${anfitrion.id.substring(0, 8)}...</td>
      <td class="px-4 py-3 text-sm">
        <span class="view-mode inline-block font-medium">${anfitrion.alias || anfitrion.nombreAnfitrion || 'Sin alias'}</span>
        <input 
          type="text" 
          value="${(anfitrion.alias || anfitrion.nombreAnfitrion || '').replace(/"/g, '&quot;')}" 
          class="edit-mode hidden w-full px-2 py-1 border border-gray-300 rounded text-sm"
          data-field="alias"
        />
      </td>
      <td class="px-4 py-3 text-sm">
        <span class="view-mode inline-block text-gray-600">${anfitrion.nombreCompleto || '-'}</span>
        <input 
          type="text" 
          value="${(anfitrion.nombreCompleto || '').replace(/"/g, '&quot;')}" 
          class="edit-mode hidden w-full px-2 py-1 border border-gray-300 rounded text-sm"
          data-field="nombreCompleto"
        />
      </td>
      <td class="px-4 py-3 text-sm">
        <span class="view-mode inline-block text-gray-900">${anfitrion.email || 'Sin email'}</span>
        <input 
          type="email" 
          value="${(anfitrion.email || '').replace(/"/g, '&quot;')}" 
          class="edit-mode hidden w-full px-2 py-1 border border-gray-300 rounded text-sm"
          data-field="email"
        />
      </td>
      <td class="px-4 py-3 text-sm">
        <span class="view-mode inline-block text-gray-600">${anfitrion.telefono || '-'}</span>
        <input 
          type="tel" 
          value="${(anfitrion.telefono || '').replace(/"/g, '&quot;')}" 
          class="edit-mode hidden w-full px-2 py-1 border border-gray-300 rounded text-sm"
          data-field="telefono"
          placeholder="Teléfono"
        />
      </td>
      <td class="px-4 py-3 text-sm">
        <span class="view-mode inline-block text-gray-600">${anfitrion.instagram || '-'}</span>
        <input 
          type="text" 
          value="${(anfitrion.instagram || '').replace(/"/g, '&quot;')}" 
          class="edit-mode hidden w-full px-2 py-1 border border-gray-300 rounded text-sm"
          data-field="instagram"
          placeholder="@instagram"
        />
      </td>
      <td class="px-4 py-3 text-sm">
        <span class="view-mode">
          <span class="badge ${anfitrion.tipo === 'efimero' ? 'badge-info' : 'badge-warning'}">
            ${anfitrion.tipo === 'efimero' ? 'Efímero' : 'Persistente'}
          </span>
        </span>
        <select 
          class="edit-mode hidden w-full px-2 py-1 border border-gray-300 rounded text-sm"
          data-field="tipo"
        >
          <option value="efimero" ${anfitrion.tipo === 'efimero' ? 'selected' : ''}>Efímero</option>
          <option value="persistente" ${anfitrion.tipo === 'persistente' ? 'selected' : ''}>Persistente</option>
        </select>
      </td>
      <td class="px-4 py-3 text-sm">
        <span class="view-mode">
          <span class="badge ${anfitrion.emailVerificado ? 'badge-success' : 'badge-warning'}">
            ${anfitrion.emailVerificado ? 'Sí' : 'No'}
          </span>
        </span>
        <label class="edit-mode hidden flex items-center">
          <input 
            type="checkbox" 
            ${anfitrion.emailVerificado ? 'checked' : ''}
            class="w-4 h-4 text-purple-600 border-gray-300 rounded"
            data-field="emailVerificado"
          />
          <span class="ml-2 text-sm">Verificado</span>
        </label>
      </td>
      <td class="px-4 py-3 text-sm">
        <span class="view-mode inline-block text-gray-900">${anfitrion.eventosCreados || 0}</span>
        <input 
          type="number" 
          value="${anfitrion.eventosCreados || 0}" 
          min="0"
          class="edit-mode hidden w-full px-2 py-1 border border-gray-300 rounded text-sm"
          data-field="eventosCreados"
        />
      </td>
      <td class="px-4 py-3 text-sm text-gray-500">${fechaFormateada}</td>
      <td class="px-4 py-3 text-sm">
        <div class="view-mode">
          <button 
            onclick="verDetallesAnfitrion('${anfitrion.id}')" 
            class="text-blue-600 hover:text-blue-800 mr-2"
            title="Ver detalles"
          >
            Ver
          </button>
          <button 
            onclick="iniciarEdicionInline('${anfitrion.id}')" 
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
        </div>
        <div class="edit-mode hidden">
          <button 
            onclick="guardarEdicionInline('${anfitrion.id}')" 
            class="text-green-600 hover:text-green-800 mr-2"
            title="Guardar"
          >
            ✓
          </button>
          <button 
            onclick="cancelarEdicionInline('${anfitrion.id}')" 
            class="text-gray-600 hover:text-gray-800"
            title="Cancelar"
          >
            ✗
          </button>
        </div>
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

// Renderizar participantes con edición inline
function renderParticipantes(participantes) {
  const tableBody = document.getElementById('participantesTableBody');
  tableBody.innerHTML = '';
  
  participantes.forEach(participante => {
    const row = document.createElement('tr');
    row.className = 'table-row';
    row.dataset.participanteId = participante.id;
    row.dataset.editing = 'false';
    
    const fechaCreado = participante.creadoEn?.toDate?.() || 
                       (participante.creadoEn ? new Date(participante.creadoEn) : new Date());
    const fechaFormateada = fechaCreado.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Guardar datos originales para cancelar edición
    row.dataset.originalData = JSON.stringify({
      nombre: participante.nombre || ''
    });
    
    row.innerHTML = `
      <td class="px-4 py-3 text-sm text-gray-900 font-mono">${participante.id.substring(0, 8)}...</td>
      <td class="px-4 py-3 text-sm">
        <span class="view-mode inline-block text-gray-900">${participante.nombre || 'Sin nombre'}</span>
        <input 
          type="text" 
          value="${(participante.nombre || '').replace(/"/g, '&quot;')}" 
          class="edit-mode hidden w-full px-2 py-1 border border-gray-300 rounded text-sm"
          data-field="nombre"
        />
      </td>
      <td class="px-4 py-3 text-sm text-gray-900 font-mono">${participante.eventoId?.substring(0, 8) || 'N/A'}...</td>
      <td class="px-4 py-3 text-sm text-gray-500">${fechaFormateada}</td>
      <td class="px-4 py-3 text-sm">
        <div class="view-mode">
          <button 
            onclick="verDetallesParticipante('${participante.id}')" 
            class="text-blue-600 hover:text-blue-800 mr-2"
            title="Ver detalles"
          >
            Ver
          </button>
          <button 
            onclick="iniciarEdicionInlineParticipante('${participante.id}')" 
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
        </div>
        <div class="edit-mode hidden">
          <button 
            onclick="guardarEdicionInlineParticipante('${participante.id}')" 
            class="text-green-600 hover:text-green-800 mr-2"
            title="Guardar"
          >
            ✓
          </button>
          <button 
            onclick="cancelarEdicionInlineParticipante('${participante.id}')" 
            class="text-gray-600 hover:text-gray-800"
            title="Cancelar"
          >
            ✗
          </button>
        </div>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
  
  // Guardar participantes para filtros
  window.participantesData = participantes;
}

// Cargar eventos
async function cargarEventos() {
  const loading = document.getElementById('eventosLoading');
  const table = document.getElementById('eventosTable');
  const tableBody = document.getElementById('eventosTableBody');
  const empty = document.getElementById('eventosEmpty');
  
  loading.classList.remove('hidden');
  table.classList.add('hidden');
  empty.classList.add('hidden');
  
  try {
    const eventosRef = collection(db, 'eventos');
    const querySnapshot = await getDocs(eventosRef);
    
    const eventos = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      eventos.push({
        id: docSnap.id,
        ...data
      });
    });
    
    // Ordenar por fecha de creación (más reciente primero)
    eventos.sort((a, b) => {
      const fechaA = a.creadoEn?.toMillis?.() || a.creadoEn || 0;
      const fechaB = b.creadoEn?.toMillis?.() || b.creadoEn || 0;
      return fechaB - fechaA;
    });
    
    // Cargar información adicional (participantes y etiquetas) para cada evento
    for (const evento of eventos) {
      // Contar participantes
      const participantesRef = collection(db, 'participantes');
      const qParticipantes = query(participantesRef, where('eventoId', '==', evento.id));
      const participantesSnapshot = await getDocs(qParticipantes);
      evento.cantidadParticipantes = participantesSnapshot.size;
      
      // Contar etiquetas únicas
      const etiquetasRef = collection(db, 'etiquetas');
      const qEtiquetas = query(etiquetasRef, where('eventoId', '==', evento.id));
      const etiquetasSnapshot = await getDocs(qEtiquetas);
      const etiquetasUnicas = new Set();
      etiquetasSnapshot.forEach((doc) => {
        const data = doc.data();
        const etiquetaId = data.etiquetaId || '';
        if (etiquetaId) {
          etiquetasUnicas.add(etiquetaId);
        }
      });
      evento.cantidadEtiquetas = etiquetasUnicas.size;
    }
    
    loading.classList.add('hidden');
    
    if (eventos.length === 0) {
      empty.classList.remove('hidden');
      return;
    }
    
    renderEventos(eventos);
    table.classList.remove('hidden');
    
    // Configurar búsqueda y filtros
    configurarFiltrosEventos(eventos);
    
  } catch (error) {
    console.error('Error al cargar eventos:', error);
    loading.classList.add('hidden');
    mostrarError('Error al cargar eventos: ' + error.message);
  }
}

// Renderizar eventos con edición inline
function renderEventos(eventos) {
  const tableBody = document.getElementById('eventosTableBody');
  tableBody.innerHTML = '';
  
  eventos.forEach(evento => {
    const row = document.createElement('tr');
    row.className = 'table-row';
    row.dataset.eventoId = evento.id;
    row.dataset.editing = 'false';
    
    const fechaCreado = evento.creadoEn?.toDate?.() || 
                       (evento.creadoEn ? new Date(evento.creadoEn) : new Date());
    const fechaFormateada = fechaCreado.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Guardar datos originales para cancelar edición
    row.dataset.originalData = JSON.stringify({
      nombre: evento.nombre || '',
      pin: evento.pin || '',
      activo: evento.activo !== undefined ? evento.activo : true
    });
    
    row.innerHTML = `
      <td class="px-4 py-3 text-sm text-gray-900 font-mono">${evento.id.substring(0, 8)}...</td>
      <td class="px-4 py-3 text-sm">
        <span class="view-mode inline-block font-medium">${evento.nombre || 'Sin nombre'}</span>
        <input 
          type="text" 
          value="${(evento.nombre || '').replace(/"/g, '&quot;')}" 
          class="edit-mode hidden w-full px-2 py-1 border border-gray-300 rounded text-sm"
          data-field="nombre"
        />
      </td>
      <td class="px-4 py-3 text-sm">
        <span class="view-mode inline-block text-gray-900 font-mono">${evento.pin || 'N/A'}</span>
        <input 
          type="text" 
          value="${(evento.pin || '').replace(/"/g, '&quot;')}" 
          pattern="[0-9]{5}"
          maxlength="5"
          class="edit-mode hidden w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
          data-field="pin"
          placeholder="00000"
        />
      </td>
      <td class="px-4 py-3 text-sm text-gray-600 font-mono">${evento.anfitrionId?.substring(0, 8) || 'N/A'}...</td>
      <td class="px-4 py-3 text-sm">
        <span class="view-mode">
          <span class="badge ${evento.activo ? 'badge-success' : 'badge-warning'}">
            ${evento.activo ? 'Activo' : 'Inactivo'}
          </span>
        </span>
        <label class="edit-mode hidden flex items-center">
          <input 
            type="checkbox" 
            ${evento.activo ? 'checked' : ''}
            class="w-4 h-4 text-purple-600 border-gray-300 rounded"
            data-field="activo"
          />
          <span class="ml-2 text-sm">Activo</span>
        </label>
      </td>
      <td class="px-4 py-3 text-sm text-gray-900">${evento.cantidadParticipantes || 0}</td>
      <td class="px-4 py-3 text-sm text-gray-900">${evento.cantidadEtiquetas || 0}</td>
      <td class="px-4 py-3 text-sm text-gray-500">${fechaFormateada}</td>
      <td class="px-4 py-3 text-sm">
        <div class="view-mode">
          <button 
            onclick="verDetallesEvento('${evento.id}')" 
            class="text-blue-600 hover:text-blue-800 mr-2"
            title="Ver detalles"
          >
            Ver
          </button>
          <button 
            onclick="iniciarEdicionInlineEvento('${evento.id}')" 
            class="text-purple-600 hover:text-purple-800 mr-2"
            title="Editar"
          >
            Editar
          </button>
          <button 
            onclick="eliminarEvento('${evento.id}')" 
            class="text-red-600 hover:text-red-800"
            title="Eliminar"
          >
            Eliminar
          </button>
        </div>
        <div class="edit-mode hidden">
          <button 
            onclick="guardarEdicionInlineEvento('${evento.id}')" 
            class="text-green-600 hover:text-green-800 mr-2"
            title="Guardar"
          >
            ✓
          </button>
          <button 
            onclick="cancelarEdicionInlineEvento('${evento.id}')" 
            class="text-gray-600 hover:text-gray-800"
            title="Cancelar"
          >
            ✗
          </button>
        </div>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
  
  // Guardar eventos para filtros
  window.eventosData = eventos;
}

// Configurar filtros de eventos
function configurarFiltrosEventos(eventos) {
  const searchInput = document.getElementById('searchEventos');
  const filterEstado = document.getElementById('filterEstadoEvento');
  
  const aplicarFiltros = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const estadoFiltro = filterEstado.value;
    
    const filtrados = eventos.filter(evento => {
      const matchSearch = !searchTerm || 
        evento.nombre?.toLowerCase().includes(searchTerm) ||
        evento.pin?.includes(searchTerm);
      const matchEstado = !estadoFiltro || 
        (estadoFiltro === 'activo' && evento.activo === true) ||
        (estadoFiltro === 'inactivo' && evento.activo === false);
      
      return matchSearch && matchEstado;
    });
    
    renderEventos(filtrados);
  };
  
  searchInput?.addEventListener('input', aplicarFiltros);
  filterEstado?.addEventListener('change', aplicarFiltros);
}

// Funciones globales para edición inline de eventos
window.iniciarEdicionInlineEvento = (eventoId) => {
  const row = document.querySelector(`tr[data-evento-id="${eventoId}"]`);
  if (!row || row.dataset.editing === 'true') return;
  
  row.dataset.editing = 'true';
  
  // Ocultar modo vista, mostrar modo edición
  row.querySelectorAll('.view-mode').forEach(el => el.classList.add('hidden'));
  row.querySelectorAll('.edit-mode').forEach(el => el.classList.remove('hidden'));
};

window.cancelarEdicionInlineEvento = (eventoId) => {
  const row = document.querySelector(`tr[data-evento-id="${eventoId}"]`);
  if (!row) return;
  
  // Restaurar datos originales
  const originalData = JSON.parse(row.dataset.originalData || '{}');
  
  row.querySelectorAll('[data-field]').forEach(input => {
    const field = input.dataset.field;
    if (field === 'activo') {
      input.checked = originalData[field] !== undefined ? originalData[field] : true;
    } else {
      input.value = originalData[field] || '';
    }
  });
  
  row.dataset.editing = 'false';
  
  // Mostrar modo vista, ocultar modo edición
  row.querySelectorAll('.view-mode').forEach(el => el.classList.remove('hidden'));
  row.querySelectorAll('.edit-mode').forEach(el => el.classList.add('hidden'));
};

window.guardarEdicionInlineEvento = async (eventoId) => {
  const row = document.querySelector(`tr[data-evento-id="${eventoId}"]`);
  if (!row) return;
  
  try {
    // Recopilar datos editados
    const updateData = {};
    row.querySelectorAll('[data-field]').forEach(input => {
      const field = input.dataset.field;
      if (field === 'activo') {
        updateData[field] = input.checked;
      } else if (field === 'pin') {
        const pin = input.value.trim();
        if (pin && !/^[0-9]{5}$/.test(pin)) {
          alert('El PIN debe tener exactamente 5 dígitos numéricos.');
          throw new Error('PIN inválido');
        }
        updateData[field] = pin || null;
      } else {
        const value = input.value.trim();
        updateData[field] = value || null;
      }
    });
    
    // Validar que el nombre no esté vacío
    if (!updateData.nombre) {
      alert('El nombre del evento es requerido.');
      return;
    }
    
    // Actualizar en Firestore
    const eventoRef = doc(db, 'eventos', eventoId);
    await updateDoc(eventoRef, updateData);
    
    // Actualizar datos originales
    row.dataset.originalData = JSON.stringify(updateData);
    
    // Actualizar vista con nuevos valores
    const nombre = updateData.nombre || 'Sin nombre';
    const pin = updateData.pin || 'N/A';
    const activo = updateData.activo !== undefined ? updateData.activo : true;
    
    // Actualizar elementos de vista
    const viewNombre = row.querySelector('td:nth-child(2) .view-mode');
    if (viewNombre) viewNombre.textContent = nombre;
    
    const viewPin = row.querySelector('td:nth-child(3) .view-mode');
    if (viewPin) viewPin.textContent = pin;
    
    const viewActivo = row.querySelector('td:nth-child(5) .view-mode');
    if (viewActivo) {
      viewActivo.innerHTML = `<span class="badge ${activo ? 'badge-success' : 'badge-warning'}">${activo ? 'Activo' : 'Inactivo'}</span>`;
    }
    
    // Salir del modo edición
    row.dataset.editing = 'false';
    row.querySelectorAll('.view-mode').forEach(el => el.classList.remove('hidden'));
    row.querySelectorAll('.edit-mode').forEach(el => el.classList.add('hidden'));
    
    // Actualizar datos en memoria
    const evento = window.eventosData?.find(e => e.id === eventoId);
    if (evento) {
      Object.assign(evento, updateData);
    }
    
  } catch (error) {
    console.error('Error al guardar cambios:', error);
    if (error.message !== 'PIN inválido') {
      alert('Error al guardar cambios: ' + error.message);
    }
  }
};

window.verDetallesEvento = async (eventoId) => {
  try {
    const evento = window.eventosData?.find(e => e.id === eventoId);
    if (!evento) {
      alert('Evento no encontrado');
      return;
    }
    
    const fechaCreado = evento.creadoEn?.toDate?.()?.toLocaleString() || 'N/A';
    
    const detalles = `
ID: ${evento.id}
Nombre: ${evento.nombre || 'Sin nombre'}
PIN: ${evento.pin || 'N/A'}
Anfitrión ID: ${evento.anfitrionId || 'N/A'}
Tipo: ${evento.tipo || 'N/A'}
Estado: ${evento.activo ? 'Activo' : 'Inactivo'}
Participantes: ${evento.cantidadParticipantes || 0}
Etiquetas: ${evento.cantidadEtiquetas || 0}
Creado: ${fechaCreado}
    `;
    
    alert(detalles);
  } catch (error) {
    console.error('Error al ver detalles:', error);
    alert('Error al cargar detalles');
  }
};

window.eliminarEvento = async (eventoId) => {
  if (!confirm('¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.')) {
    return;
  }
  
  try {
    // Obtener datos antes de eliminar para el log
    const eventoRef = doc(db, 'eventos', eventoId);
    const eventoSnap = await getDoc(eventoRef);
    const datosAnteriores = eventoSnap.exists() ? eventoSnap.data() : null;
    
    await deleteDoc(eventoRef);
    
    // Registrar log
    await registrarLog('delete', 'eventos', eventoId, null, datosAnteriores, `Evento eliminado: ${datosAnteriores?.nombre || eventoId}`);
    
    alert('Evento eliminado exitosamente');
    cargarEventos();
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    alert('Error al eliminar evento: ' + error.message);
  }
};

// Cargar etiquetas
async function cargarEtiquetas() {
  const loading = document.getElementById('etiquetasLoading');
  const table = document.getElementById('etiquetasTable');
  const tableBody = document.getElementById('etiquetasTableBody');
  const empty = document.getElementById('etiquetasEmpty');
  
  loading.classList.remove('hidden');
  table.classList.add('hidden');
  empty.classList.add('hidden');
  
  try {
    const etiquetasRef = collection(db, 'etiquetas');
    const querySnapshot = await getDocs(etiquetasRef);
    
    const etiquetas = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      etiquetas.push({
        id: docSnap.id,
        ...data
      });
    });
    
    // Cargar selecciones de participantes para calcular votaciones acumuladas
    const seleccionesRef = collection(db, 'selecciones');
    const seleccionesSnapshot = await getDocs(seleccionesRef);
    
    // Mapa para acumular votaciones: { etiquetaId: { naipeId: cantidad } }
    const votacionesPorEtiqueta = {};
    
    seleccionesSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // Solo contar selecciones finalizadas de participantes (no del anfitrión)
      if (data.finalizado && data.sesionId !== 'ANFITRION' && data.seleccionesNaipes) {
        Object.keys(data.seleccionesNaipes).forEach(etiquetaId => {
          const naipeId = data.seleccionesNaipes[etiquetaId];
          if (naipeId) {
            if (!votacionesPorEtiqueta[etiquetaId]) {
              votacionesPorEtiqueta[etiquetaId] = {};
            }
            if (!votacionesPorEtiqueta[etiquetaId][naipeId]) {
              votacionesPorEtiqueta[etiquetaId][naipeId] = 0;
            }
            votacionesPorEtiqueta[etiquetaId][naipeId]++;
          }
        });
      }
    });
    
    // Agregar votaciones acumuladas a cada etiqueta
    etiquetas.forEach(etiqueta => {
      etiqueta.votacionesAcumuladas = votacionesPorEtiqueta[etiqueta.etiquetaId] || {};
    });
    
    // Ordenar por fecha de creación (más reciente primero)
    etiquetas.sort((a, b) => {
      const fechaA = a.creadoEn?.toMillis?.() || a.creadoEn || 0;
      const fechaB = b.creadoEn?.toMillis?.() || b.creadoEn || 0;
      return fechaB - fechaA;
    });
    
    loading.classList.add('hidden');
    
    if (etiquetas.length === 0) {
      empty.classList.remove('hidden');
      return;
    }
    
    renderEtiquetas(etiquetas);
    table.classList.remove('hidden');
    
    // Configurar búsqueda y filtros
    configurarFiltrosEtiquetas(etiquetas);
    
  } catch (error) {
    console.error('Error al cargar etiquetas:', error);
    loading.classList.add('hidden');
    mostrarError('Error al cargar etiquetas: ' + error.message);
  }
}

// Renderizar etiquetas con edición inline
function renderEtiquetas(etiquetas) {
  const tableBody = document.getElementById('etiquetasTableBody');
  tableBody.innerHTML = '';
  
  etiquetas.forEach(etiqueta => {
    const row = document.createElement('tr');
    row.className = 'table-row';
    row.dataset.etiquetaId = etiqueta.id;
    row.dataset.editing = 'false';
    
    const fechaCreado = etiqueta.creadoEn?.toDate?.() || 
                       (etiqueta.creadoEn ? new Date(etiqueta.creadoEn) : new Date());
    const fechaFormateada = fechaCreado.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Guardar datos originales para cancelar edición (naipeId y naipeNombre no son editables)
    row.dataset.originalData = JSON.stringify({
      etiquetaId: etiqueta.etiquetaId || '',
      etiquetaNombre: etiqueta.etiquetaNombre || '',
      orden: etiqueta.orden !== undefined ? etiqueta.orden : 0
    });
    
    row.innerHTML = `
      <td class="px-4 py-3 text-sm text-gray-900 font-mono">${etiqueta.id.substring(0, 8)}...</td>
      <td class="px-4 py-3 text-sm">
        <span class="view-mode inline-block font-mono text-gray-900">${etiqueta.etiquetaId || 'N/A'}</span>
        <input 
          type="text" 
          value="${(etiqueta.etiquetaId || '').replace(/"/g, '&quot;')}" 
          class="edit-mode hidden w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
          data-field="etiquetaId"
        />
      </td>
      <td class="px-4 py-3 text-sm">
        <span class="view-mode inline-block font-medium">${etiqueta.etiquetaNombre || 'Sin nombre'}</span>
        <input 
          type="text" 
          value="${(etiqueta.etiquetaNombre || '').replace(/"/g, '&quot;')}" 
          class="edit-mode hidden w-full px-2 py-1 border border-gray-300 rounded text-sm"
          data-field="etiquetaNombre"
        />
      </td>
      <td class="px-4 py-3 text-sm text-gray-600 font-mono">${etiqueta.eventoId?.substring(0, 8) || 'N/A'}...</td>
      <td class="px-4 py-3 text-sm">
        <span class="view-mode inline-block font-mono ${etiqueta.naipeId ? 'text-gray-900' : 'text-gray-400 italic'}">
          ${etiqueta.naipeId || ''}
        </span>
        <!-- naipeId no es editable manualmente, solo se completa al revelar resultados -->
      </td>
      <td class="px-4 py-3 text-sm">
        <span class="view-mode inline-block ${etiqueta.naipeNombre ? 'text-gray-900' : 'text-gray-400 italic'}">
          ${etiqueta.naipeNombre || ''}
        </span>
        <!-- naipeNombre no es editable manualmente, solo se completa al revelar resultados -->
      </td>
      <td class="px-4 py-3 text-sm">
        <div class="view-mode text-xs">
          ${Object.keys(etiqueta.votacionesAcumuladas || {}).length > 0 
            ? Object.entries(etiqueta.votacionesAcumuladas)
                .sort((a, b) => b[1] - a[1]) // Ordenar por cantidad descendente
                .map(([naipeId, cantidad]) => `<span class="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded mr-1 mb-1">${naipeId}: ${cantidad}</span>`)
                .join('')
            : '<span class="text-gray-400 italic">Sin votaciones</span>'
          }
        </div>
      </td>
      <td class="px-4 py-3 text-sm">
        <span class="view-mode inline-block text-gray-900">${etiqueta.orden !== undefined ? etiqueta.orden : 0}</span>
        <input 
          type="number" 
          value="${etiqueta.orden !== undefined ? etiqueta.orden : 0}" 
          class="edit-mode hidden w-full px-2 py-1 border border-gray-300 rounded text-sm"
          data-field="orden"
          min="0"
        />
      </td>
      <td class="px-4 py-3 text-sm text-gray-500">${fechaFormateada}</td>
      <td class="px-4 py-3 text-sm">
        <div class="view-mode">
          <button 
            onclick="verDetallesEtiqueta('${etiqueta.id}')" 
            class="text-blue-600 hover:text-blue-800 mr-2"
            title="Ver detalles"
          >
            Ver
          </button>
          <button 
            onclick="iniciarEdicionInlineEtiqueta('${etiqueta.id}')" 
            class="text-purple-600 hover:text-purple-800 mr-2"
            title="Editar"
          >
            Editar
          </button>
          <button 
            onclick="eliminarEtiqueta('${etiqueta.id}')" 
            class="text-red-600 hover:text-red-800"
            title="Eliminar"
          >
            Eliminar
          </button>
        </div>
        <div class="edit-mode hidden">
          <button 
            onclick="guardarEdicionInlineEtiqueta('${etiqueta.id}')" 
            class="text-green-600 hover:text-green-800 mr-2"
            title="Guardar"
          >
            ✓
          </button>
          <button 
            onclick="cancelarEdicionInlineEtiqueta('${etiqueta.id}')" 
            class="text-gray-600 hover:text-gray-800"
            title="Cancelar"
          >
            ✗
          </button>
        </div>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
  
  // Guardar etiquetas para filtros
  window.etiquetasData = etiquetas;
}

// Configurar filtros de etiquetas
function configurarFiltrosEtiquetas(etiquetas) {
  const searchInput = document.getElementById('searchEtiquetas');
  const filterEvento = document.getElementById('filterEventoEtiqueta');
  
  // Cargar lista de eventos únicos para el filtro
  const eventosUnicos = [...new Set(etiquetas.map(e => e.eventoId).filter(Boolean))];
  filterEvento.innerHTML = '<option value="">Todos los eventos</option>';
  eventosUnicos.forEach(eventoId => {
    const option = document.createElement('option');
    option.value = eventoId;
    option.textContent = eventoId.substring(0, 8) + '...';
    filterEvento.appendChild(option);
  });
  
  const aplicarFiltros = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const eventoFiltro = filterEvento.value;
    
    const filtrados = etiquetas.filter(etiqueta => {
      const matchSearch = !searchTerm || 
        etiqueta.etiquetaNombre?.toLowerCase().includes(searchTerm) ||
        etiqueta.etiquetaId?.toLowerCase().includes(searchTerm) ||
        etiqueta.naipeNombre?.toLowerCase().includes(searchTerm) ||
        etiqueta.eventoId?.toLowerCase().includes(searchTerm);
      const matchEvento = !eventoFiltro || etiqueta.eventoId === eventoFiltro;
      
      return matchSearch && matchEvento;
    });
    
    renderEtiquetas(filtrados);
  };
  
  searchInput?.addEventListener('input', aplicarFiltros);
  filterEvento?.addEventListener('change', aplicarFiltros);
}

// Funciones globales para edición inline de etiquetas
window.iniciarEdicionInlineEtiqueta = (etiquetaId) => {
  const row = document.querySelector(`tr[data-etiqueta-id="${etiquetaId}"]`);
  if (!row || row.dataset.editing === 'true') return;
  
  row.dataset.editing = 'true';
  
  // Ocultar modo vista, mostrar modo edición
  row.querySelectorAll('.view-mode').forEach(el => el.classList.add('hidden'));
  row.querySelectorAll('.edit-mode').forEach(el => el.classList.remove('hidden'));
};

window.cancelarEdicionInlineEtiqueta = (etiquetaId) => {
  const row = document.querySelector(`tr[data-etiqueta-id="${etiquetaId}"]`);
  if (!row) return;
  
    // Restaurar datos originales (naipeId y naipeNombre no son editables)
    const originalData = JSON.parse(row.dataset.originalData || '{}');
    
    row.querySelectorAll('[data-field]').forEach(input => {
      const field = input.dataset.field;
      // No restaurar naipeId ni naipeNombre ya que no son editables
      if (field === 'naipeId' || field === 'naipeNombre') {
        return; // Saltar estos campos
      }
      if (field === 'orden') {
        input.value = originalData[field] !== undefined ? originalData[field] : 0;
      } else {
        input.value = originalData[field] || '';
      }
    });
  
  row.dataset.editing = 'false';
  
  // Mostrar modo vista, ocultar modo edición
  row.querySelectorAll('.view-mode').forEach(el => el.classList.remove('hidden'));
  row.querySelectorAll('.edit-mode').forEach(el => el.classList.add('hidden'));
};

window.guardarEdicionInlineEtiqueta = async (etiquetaId) => {
  const row = document.querySelector(`tr[data-etiqueta-id="${etiquetaId}"]`);
  if (!row) return;
  
  try {
    // Recopilar datos editados (naipeId y naipeNombre no son editables)
    const updateData = {};
    row.querySelectorAll('[data-field]').forEach(input => {
      const field = input.dataset.field;
      // No permitir editar naipeId ni naipeNombre manualmente
      if (field === 'naipeId' || field === 'naipeNombre') {
        return; // Saltar estos campos
      }
      if (field === 'orden') {
        const orden = parseInt(input.value) || 0;
        updateData[field] = orden;
      } else {
        const value = input.value.trim();
        updateData[field] = value || null;
      }
    });
    
    // Obtener datos anteriores para el log
    const etiquetaRef = doc(db, 'etiquetas', etiquetaId);
    const etiquetaSnap = await getDoc(etiquetaRef);
    const datosAnteriores = etiquetaSnap.exists() ? etiquetaSnap.data() : null;
    
    // Actualizar en Firestore
    await updateDoc(etiquetaRef, updateData);
    
    // Registrar log
    await registrarLog('update', 'etiquetas', etiquetaId, updateData, datosAnteriores, `Etiqueta actualizada: ${updateData.etiquetaNombre || etiquetaId}`);
    
    // Actualizar datos originales
    row.dataset.originalData = JSON.stringify(updateData);
    
    // Actualizar vista con nuevos valores (naipeId y naipeNombre se mantienen como están)
    const etiquetaIdValue = updateData.etiquetaId || 'N/A';
    const etiquetaNombre = updateData.etiquetaNombre || 'Sin nombre';
    const orden = updateData.orden !== undefined ? updateData.orden : 0;
    
    // Obtener naipeId y naipeNombre actuales (no se editan)
    const etiqueta = window.etiquetasData?.find(e => e.id === etiquetaId);
    const naipeId = etiqueta?.naipeId || null;
    const naipeNombre = etiqueta?.naipeNombre || null;
    
    // Actualizar elementos de vista
    const viewEtiquetaId = row.querySelector('td:nth-child(2) .view-mode');
    if (viewEtiquetaId) viewEtiquetaId.textContent = etiquetaIdValue;
    
    const viewEtiquetaNombre = row.querySelector('td:nth-child(3) .view-mode');
    if (viewEtiquetaNombre) viewEtiquetaNombre.textContent = etiquetaNombre;
    
    const viewNaipeId = row.querySelector('td:nth-child(5) .view-mode');
    if (viewNaipeId) {
      if (naipeId) {
        viewNaipeId.textContent = naipeId;
        viewNaipeId.className = 'view-mode inline-block font-mono text-gray-900';
      } else {
        viewNaipeId.textContent = '';
        viewNaipeId.className = 'view-mode inline-block font-mono text-gray-400 italic';
      }
    }
    
    const viewNaipeNombre = row.querySelector('td:nth-child(6) .view-mode');
    if (viewNaipeNombre) {
      if (naipeNombre) {
        viewNaipeNombre.textContent = naipeNombre;
        viewNaipeNombre.className = 'view-mode inline-block text-gray-900';
      } else {
        viewNaipeNombre.textContent = '';
        viewNaipeNombre.className = 'view-mode inline-block text-gray-400 italic';
      }
    }
    
    const viewOrden = row.querySelector('td:nth-child(8) .view-mode');
    if (viewOrden) viewOrden.textContent = orden;
    
    // Salir del modo edición
    row.dataset.editing = 'false';
    row.querySelectorAll('.view-mode').forEach(el => el.classList.remove('hidden'));
    row.querySelectorAll('.edit-mode').forEach(el => el.classList.add('hidden'));
    
    // Actualizar datos en memoria (reutilizar la variable etiqueta ya declarada arriba)
    if (etiqueta) {
      Object.assign(etiqueta, updateData);
    }
    
  } catch (error) {
    console.error('Error al guardar cambios:', error);
    alert('Error al guardar cambios: ' + error.message);
  }
};

window.verDetallesEtiqueta = async (etiquetaId) => {
  try {
    const etiqueta = window.etiquetasData?.find(e => e.id === etiquetaId);
    if (!etiqueta) {
      alert('Etiqueta no encontrada');
      return;
    }
    
    const fechaCreado = etiqueta.creadoEn?.toDate?.()?.toLocaleString() || 'N/A';
    
    // Formatear votaciones acumuladas
    const votacionesTexto = Object.keys(etiqueta.votacionesAcumuladas || {}).length > 0
      ? Object.entries(etiqueta.votacionesAcumuladas)
          .sort((a, b) => b[1] - a[1])
          .map(([naipeId, cantidad]) => `${naipeId}: ${cantidad} votos`)
          .join('\\n')
      : 'Sin votaciones';
    
    const detalles = `
ID: ${etiqueta.id}
Etiqueta ID: ${etiqueta.etiquetaId || 'N/A'}
Nombre: ${etiqueta.etiquetaNombre || 'Sin nombre'}
Evento ID: ${etiqueta.eventoId || 'N/A'}
Naipe ID: ${etiqueta.naipeId || ''}
Naipe Nombre: ${etiqueta.naipeNombre || ''}
Scoring:
${votacionesTexto}
Orden: ${etiqueta.orden !== undefined ? etiqueta.orden : 0}
Creado: ${fechaCreado}
    `;
    
    alert(detalles);
  } catch (error) {
    console.error('Error al ver detalles:', error);
    alert('Error al cargar detalles');
  }
};

window.eliminarEtiqueta = async (etiquetaId) => {
  if (!confirm('¿Estás seguro de que deseas eliminar esta etiqueta? Esta acción no se puede deshacer.')) {
    return;
  }
  
  try {
    // Obtener datos antes de eliminar para el log
    const etiquetaRef = doc(db, 'etiquetas', etiquetaId);
    const etiquetaSnap = await getDoc(etiquetaRef);
    const datosAnteriores = etiquetaSnap.exists() ? etiquetaSnap.data() : null;
    
    await deleteDoc(etiquetaRef);
    
    // Registrar log
    await registrarLog('delete', 'etiquetas', etiquetaId, null, datosAnteriores, `Etiqueta eliminada: ${datosAnteriores?.etiquetaNombre || etiquetaId}`);
    
    alert('Etiqueta eliminada exitosamente');
    cargarEtiquetas();
  } catch (error) {
    console.error('Error al eliminar etiqueta:', error);
    alert('Error al eliminar etiqueta: ' + error.message);
  }
};

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
    
    // Obtener datos anteriores para el log
    const anfitrionSnap = await getDoc(anfitrionRef);
    const datosAnteriores = anfitrionSnap.exists() ? anfitrionSnap.data() : null;
    
    await updateDoc(anfitrionRef, updateData);
    
    // Registrar log
    await registrarLog('update', 'anfitriones', anfitrionId, updateData, datosAnteriores, `Anfitrión actualizado: ${updateData.alias || anfitrionId}`);
    
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
    
    // Obtener datos anteriores para el log
    const participanteSnap = await getDoc(participanteRef);
    const datosAnteriores = participanteSnap.exists() ? participanteSnap.data() : null;
    
    await updateDoc(participanteRef, {
      nombre: nombre
    });
    
    // Registrar log
    await registrarLog('update', 'participantes', participanteId, { nombre }, datosAnteriores, `Participante actualizado: ${nombre}`);
    
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

// Funciones globales para edición inline de anfitriones
window.iniciarEdicionInline = (anfitrionId) => {
  const row = document.querySelector(`tr[data-anfitrion-id="${anfitrionId}"]`);
  if (!row || row.dataset.editing === 'true') return;
  
  row.dataset.editing = 'true';
  
  // Ocultar modo vista, mostrar modo edición
  row.querySelectorAll('.view-mode').forEach(el => el.classList.add('hidden'));
  row.querySelectorAll('.edit-mode').forEach(el => el.classList.remove('hidden'));
};

window.cancelarEdicionInline = (anfitrionId) => {
  const row = document.querySelector(`tr[data-anfitrion-id="${anfitrionId}"]`);
  if (!row) return;
  
  // Restaurar datos originales
  const originalData = JSON.parse(row.dataset.originalData || '{}');
  
  row.querySelectorAll('[data-field]').forEach(input => {
    const field = input.dataset.field;
    if (field === 'emailVerificado') {
      input.checked = originalData[field] || false;
    } else {
      input.value = originalData[field] || '';
    }
  });
  
  row.dataset.editing = 'false';
  
  // Mostrar modo vista, ocultar modo edición
  row.querySelectorAll('.view-mode').forEach(el => el.classList.remove('hidden'));
  row.querySelectorAll('.edit-mode').forEach(el => el.classList.add('hidden'));
};

window.guardarEdicionInline = async (anfitrionId) => {
  const row = document.querySelector(`tr[data-anfitrion-id="${anfitrionId}"]`);
  if (!row) return;
  
  try {
    // Recopilar datos editados
    const updateData = {};
    row.querySelectorAll('[data-field]').forEach(input => {
      const field = input.dataset.field;
      if (field === 'emailVerificado') {
        updateData[field] = input.checked;
      } else if (field === 'eventosCreados') {
        updateData[field] = parseInt(input.value) || 0;
      } else {
        const value = input.value.trim();
        updateData[field] = value || null;
      }
    });
    
    // Obtener datos anteriores para el log
    const anfitrionRef = doc(db, 'anfitriones', anfitrionId);
    const anfitrionSnap = await getDoc(anfitrionRef);
    const datosAnteriores = anfitrionSnap.exists() ? anfitrionSnap.data() : null;
    
    // Actualizar en Firestore
    await updateDoc(anfitrionRef, updateData);
    
    // Registrar log
    await registrarLog('update', 'anfitriones', anfitrionId, updateData, datosAnteriores, `Anfitrión actualizado (inline): ${updateData.alias || anfitrionId}`);
    
    // Actualizar datos originales
    row.dataset.originalData = JSON.stringify(updateData);
    
    // Actualizar vista con nuevos valores
    const alias = updateData.alias || 'Sin alias';
    const nombreCompleto = updateData.nombreCompleto || '-';
    const email = updateData.email || 'Sin email';
    const tipo = updateData.tipo || 'efimero';
    const emailVerificado = updateData.emailVerificado || false;
    const eventosCreados = updateData.eventosCreados || 0;
    
    // Actualizar elementos de vista
    const viewAlias = row.querySelector('td:nth-child(2) .view-mode');
    if (viewAlias) viewAlias.textContent = alias;
    
    const viewNombreCompleto = row.querySelector('td:nth-child(3) .view-mode');
    if (viewNombreCompleto) {
      viewNombreCompleto.textContent = nombreCompleto;
      viewNombreCompleto.className = nombreCompleto === '-' ? 'view-mode inline-block text-gray-600' : 'view-mode inline-block text-gray-600';
    }
    
    const viewEmail = row.querySelector('td:nth-child(4) .view-mode');
    if (viewEmail) viewEmail.textContent = email;
    
    const viewTipo = row.querySelector('td:nth-child(5) .view-mode');
    if (viewTipo) {
      viewTipo.innerHTML = `<span class="badge ${tipo === 'efimero' ? 'badge-info' : 'badge-warning'}">${tipo === 'efimero' ? 'Efímero' : 'Persistente'}</span>`;
    }
    
    const viewEmailVerificado = row.querySelector('td:nth-child(6) .view-mode');
    if (viewEmailVerificado) {
      viewEmailVerificado.innerHTML = `<span class="badge ${emailVerificado ? 'badge-success' : 'badge-warning'}">${emailVerificado ? 'Sí' : 'No'}</span>`;
    }
    
    const viewEventosCreados = row.querySelector('td:nth-child(7) .view-mode');
    if (viewEventosCreados) viewEventosCreados.textContent = eventosCreados;
    
    // Salir del modo edición
    row.dataset.editing = 'false';
    row.querySelectorAll('.view-mode').forEach(el => el.classList.remove('hidden'));
    row.querySelectorAll('.edit-mode').forEach(el => el.classList.add('hidden'));
    
    // Actualizar datos en memoria
    const anfitrion = window.anfitrionesData?.find(a => a.id === anfitrionId);
    if (anfitrion) {
      Object.assign(anfitrion, updateData);
    }
    
  } catch (error) {
    console.error('Error al guardar cambios:', error);
    alert('Error al guardar cambios: ' + error.message);
  }
};

// Funciones globales para edición inline de participantes
window.iniciarEdicionInlineParticipante = (participanteId) => {
  const row = document.querySelector(`tr[data-participante-id="${participanteId}"]`);
  if (!row || row.dataset.editing === 'true') return;
  
  row.dataset.editing = 'true';
  
  // Ocultar modo vista, mostrar modo edición
  row.querySelectorAll('.view-mode').forEach(el => el.classList.add('hidden'));
  row.querySelectorAll('.edit-mode').forEach(el => el.classList.remove('hidden'));
};

window.cancelarEdicionInlineParticipante = (participanteId) => {
  const row = document.querySelector(`tr[data-participante-id="${participanteId}"]`);
  if (!row) return;
  
  // Restaurar datos originales
  const originalData = JSON.parse(row.dataset.originalData || '{}');
  
  row.querySelectorAll('[data-field]').forEach(input => {
    input.value = originalData[input.dataset.field] || '';
  });
  
  row.dataset.editing = 'false';
  
  // Mostrar modo vista, ocultar modo edición
  row.querySelectorAll('.view-mode').forEach(el => el.classList.remove('hidden'));
  row.querySelectorAll('.edit-mode').forEach(el => el.classList.add('hidden'));
};

window.guardarEdicionInlineParticipante = async (participanteId) => {
  const row = document.querySelector(`tr[data-participante-id="${participanteId}"]`);
  if (!row) return;
  
  try {
    // Recopilar datos editados
    const nombre = row.querySelector('[data-field="nombre"]').value.trim();
    
    if (!nombre) {
      alert('El nombre es requerido');
      return;
    }
    
    // Obtener datos anteriores para el log
    const participanteRef = doc(db, 'participantes', participanteId);
    const participanteSnap = await getDoc(participanteRef);
    const datosAnteriores = participanteSnap.exists() ? participanteSnap.data() : null;
    
    // Actualizar en Firestore
    await updateDoc(participanteRef, { nombre });
    
    // Registrar log
    await registrarLog('update', 'participantes', participanteId, { nombre }, datosAnteriores, `Participante actualizado (inline): ${nombre}`);
    
    // Actualizar datos originales
    row.dataset.originalData = JSON.stringify({ nombre });
    
    // Actualizar vista
    const viewNombre = row.querySelector('td:nth-child(2) .view-mode');
    if (viewNombre) viewNombre.textContent = nombre;
    
    // Salir del modo edición
    row.dataset.editing = 'false';
    row.querySelectorAll('.view-mode').forEach(el => el.classList.remove('hidden'));
    row.querySelectorAll('.edit-mode').forEach(el => el.classList.add('hidden'));
    
    // Actualizar datos en memoria
    const participante = window.participantesData?.find(p => p.id === participanteId);
    if (participante) {
      participante.nombre = nombre;
    }
    
  } catch (error) {
    console.error('Error al guardar cambios:', error);
    alert('Error al guardar cambios: ' + error.message);
  }
};

// Funciones globales para botones (mantener compatibilidad con modal si se necesita)
window.editarAnfitrion = async (anfitrionId) => {
  // Usar edición inline en lugar de modal
  iniciarEdicionInline(anfitrionId);
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

window.verDetallesParticipante = async (participanteId) => {
  try {
    const participante = window.participantesData?.find(p => p.id === participanteId);
    if (!participante) {
      alert('Participante no encontrado');
      return;
    }
    
    // Cargar información adicional de selecciones
    let seleccionesInfo = 'No tiene selecciones guardadas';
    try {
      const seleccionesRef = collection(db, 'selecciones');
      const qSelecciones = query(seleccionesRef, where('participanteId', '==', participanteId));
      const seleccionesSnapshot = await getDocs(qSelecciones);
      
      if (!seleccionesSnapshot.empty) {
        const seleccion = seleccionesSnapshot.docs[0].data();
        const finalizado = seleccion.finalizado ? 'Sí' : 'No';
        const cantidadSelecciones = seleccion.seleccionesNaipes ? Object.keys(seleccion.seleccionesNaipes).length : 0;
        const tiemposRondas = seleccion.tiemposRondas ? Object.keys(seleccion.tiemposRondas).length : 0;
        
        seleccionesInfo = `
Estado: ${finalizado}
Selecciones completadas: ${cantidadSelecciones}
Rondas con tiempo registrado: ${tiemposRondas}`;
      }
    } catch (error) {
      console.error('Error al cargar selecciones:', error);
      seleccionesInfo = 'Error al cargar selecciones';
    }
    
    const fechaCreado = participante.creadoEn?.toDate?.()?.toLocaleString() || 'N/A';
    
    const detalles = `
ID: ${participante.id}
Nombre: ${participante.nombre || 'Sin nombre'}
Evento ID: ${participante.eventoId || 'N/A'}
Creado: ${fechaCreado}

Selecciones:
${seleccionesInfo}
    `;
    
    alert(detalles);
  } catch (error) {
    console.error('Error al ver detalles:', error);
    alert('Error al cargar detalles');
  }
};

window.eliminarAnfitrion = async (anfitrionId) => {
  if (!confirm('¿Estás seguro de que deseas eliminar este anfitrión? Esta acción eliminará el usuario de Firebase Auth y Firestore. No se puede deshacer.')) {
    return;
  }
  
  try {
    // Obtener datos antes de eliminar para el log
    const anfitrionRef = doc(db, 'anfitriones', anfitrionId);
    const anfitrionSnap = await getDoc(anfitrionRef);
    const datosAnteriores = anfitrionSnap.exists() ? anfitrionSnap.data() : null;
    
    // Eliminar usuario de Firebase Auth usando Cloud Function
    try {
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const functions = getFunctions(app, 'us-central1');
      const eliminarUsuarioAuth = httpsCallable(functions, 'eliminarUsuarioAuth');
      
      const result = await eliminarUsuarioAuth({ userId: anfitrionId });
      
      console.log('[Admin] ✅ Usuario eliminado de Firebase Auth:', result.data);
    } catch (authError) {
      console.warn('[Admin] ⚠️ Error al eliminar usuario de Firebase Auth (continuando con eliminación de Firestore):', authError);
      // Continuar con la eliminación de Firestore aunque falle Auth
    }
    
    // Eliminar documento de Firestore
    await deleteDoc(anfitrionRef);
    
    // Registrar log
    await registrarLog('delete', 'anfitriones', anfitrionId, null, datosAnteriores, `Anfitrión eliminado: ${datosAnteriores?.alias || anfitrionId}`);
    
    alert('Anfitrión eliminado exitosamente de Firebase Auth y Firestore');
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
    // Obtener datos antes de eliminar para el log
    const participanteRef = doc(db, 'participantes', participanteId);
    const participanteSnap = await getDoc(participanteRef);
    const datosAnteriores = participanteSnap.exists() ? participanteSnap.data() : null;
    
    await deleteDoc(participanteRef);
    
    // Registrar log
    await registrarLog('delete', 'participantes', participanteId, null, datosAnteriores, `Participante eliminado: ${datosAnteriores?.nombre || participanteId}`);
    
    alert('Participante eliminado exitosamente');
    cargarParticipantes();
  } catch (error) {
    console.error('Error al eliminar participante:', error);
    alert('Error al eliminar participante: ' + error.message);
  }
};

// Función de depuración (disponible en consola)
window.debugAdminAuth = async () => {
  console.log('=== DEBUG ADMIN AUTH ===');
  const token = localStorage.getItem('admin_auth_token');
  console.log('Token en localStorage:', token);
  const hash = await obtenerPasswordHash();
  console.log('Hash esperado:', hash);
  console.log('Hash por defecto (PinotAdmin):', ADMIN_PASSWORD_HASH);
  console.log('Coinciden:', token === hash);
  console.log('=======================');
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🔵 DOM cargado, verificando autenticación...');
    verificarAutenticacion();
  });
} else {
  console.log('🔵 DOM ya listo, verificando autenticación...');
  verificarAutenticacion();
}

