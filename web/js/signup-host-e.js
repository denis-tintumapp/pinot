/**
 * Módulo para el alta rápida de anfitrión
 * Incluye validación de formulario y protección anti-bot con Google reCAPTCHA v3
 */


import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
  getFirestore,
  collection,
  doc,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js';
import { handleModuleError, validateModule } from './error-handler.js';

// Manejo de errores para importación de configuración
let firebaseConfig;
try {
  const configModule = await import('./core/firebase-config.js');
  validateModule(configModule, 'firebase-config');
  firebaseConfig = configModule.firebaseConfig;
  
  if (!firebaseConfig || !firebaseConfig.apiKey) {
    throw new Error('Configuración de Firebase inválida o incompleta');
  }
} catch (error) {
  const errorMessage = handleModuleError(error, './core/firebase-config.js');
  console.error(errorMessage);
  
  // Mostrar error amigable al usuario
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mostrarErrorConfig);
  } else {
    mostrarErrorConfig();
  }
  
  function mostrarErrorConfig() {
    const mensajeDiv = document.getElementById('mensaje');
    if (mensajeDiv) {
      mensajeDiv.textContent = 'Error al cargar la configuración. Por favor, recarga la página.';
      mensajeDiv.className = 'error-message rounded-lg p-4 text-sm text-red-200';
      mensajeDiv.classList.remove('hidden');
    }
  }
  
  throw error;
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// Configurar Functions con la región correcta
// Para funciones callable, Firebase SDK maneja CORS automáticamente
// cuando se llama desde el mismo proyecto de Firebase Hosting
const functions = getFunctions(app, 'us-central1');

// Elementos del DOM - Formulario de Alta
const form = document.getElementById('formSignupHost');
const aliasInput = document.getElementById('alias');
const nombreCompletoInput = document.getElementById('nombreCompleto');
const emailInput = document.getElementById('email');
const btnEnviar = document.getElementById('btnEnviar');
const btnText = document.getElementById('btnText');
const mensajeDiv = document.getElementById('mensaje');
const mensajeExito = document.getElementById('mensajeExito');

// Elementos del DOM - Formulario de Login
const loginForm = document.getElementById('formLoginHost');
const loginEmailInput = document.getElementById('loginEmail');
const loginSesionIdInput = document.getElementById('loginSesionId');
const btnLoginEnviar = document.getElementById('btnLoginEnviar');
const btnLoginText = document.getElementById('btnLoginText');
const loginMensajeDiv = document.getElementById('loginMensaje');

// Contenedores
const signupFormContainer = document.getElementById('signupFormContainer');
const loginFormContainer = document.getElementById('loginFormContainer');
const pageSubtitle = document.getElementById('pageSubtitle');
const footerText = document.getElementById('footerText');

// Botones de alternancia
const btnYaSoyAnfitrion = document.getElementById('btnYaSoyAnfitrion');
const btnCrearCuenta = document.getElementById('btnCrearCuenta');

// Estado del formulario
let isSubmitting = false;

// Log inicial para verificar que el script se carga
console.log('🔵 signup-host-e.js: Script cargado, esperando DOMContentLoaded...');

// Función para inicializar todo
function inicializarTodo() {
  console.log('🔵 Inicializando formularios...');
  inicializarFormulario();
  inicializarLoginForm();
  inicializarAlternancia();
  console.log('🔵 Formularios inicializados');
  
  // Inicializar reCAPTCHA v3 solo si estamos en la página de signup
  const esPaginaSignup = window.location.pathname.includes('signup-host-e');
  if (esPaginaSignup) {
    inicializarRecaptcha();
  }
}

// Verificar estado del DOM
if (document.readyState === 'loading') {
  console.log('🔵 DOM aún cargando, agregando listener...');
  // Inicializar cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🔵 DOMContentLoaded disparado - Iniciando inicialización...');
    inicializarTodo();
  });
} else {
  console.log('🔵 DOM ya cargado (readyState:', document.readyState + '), ejecutando inmediatamente...');
  // DOM ya está listo, ejecutar inmediatamente
  inicializarTodo();
}

/**
 * Inicializar el formulario
 */
function inicializarFormulario() {
  if (!form) return;
  
  // Validación en tiempo real
  aliasInput?.addEventListener('input', validarAlias);
  nombreCompletoInput?.addEventListener('input', validarNombreCompleto);
  emailInput?.addEventListener('input', validarEmail);
  
  // Submit del formulario
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    if (await validarFormulario()) {
      await enviarFormulario();
    }
  });
}

/**
 * Inicializar Google reCAPTCHA v3
 * reCAPTCHA v3 es invisible y calcula un score en segundo plano
 * Solo se inicializa en la página de signup (no en login)
 */
function inicializarRecaptcha() {
  // Verificar que estamos en la página de signup (no en login)
  const esPaginaSignup = window.location.pathname.includes('signup-host-e');
  
  if (!esPaginaSignup) {
    console.log('ℹ️ reCAPTCHA no necesario en esta página, saltando inicialización');
    return;
  }
  
  const SITE_KEY = '6LfqsDEsAAAAAJadPQ6_AMonxbeTBqqRWVXxCNvt';
  
  // Verificar que reCAPTCHA esté cargado
  if (typeof grecaptcha === 'undefined') {
    console.warn('⚠️ reCAPTCHA no está cargado, reintentando...');
    // Limitar reintentos para evitar loops infinitos
    if (!window.recaptchaRetryCount) {
      window.recaptchaRetryCount = 0;
    }
    
    if (window.recaptchaRetryCount < 10) {
      window.recaptchaRetryCount++;
      setTimeout(inicializarRecaptcha, 500);
    } else {
      console.error('❌ reCAPTCHA no se pudo cargar después de múltiples intentos');
      window.recaptchaRetryCount = 0; // Reset para futuros intentos
    }
    return;
  }
  
  // Reset contador si se cargó exitosamente
  window.recaptchaRetryCount = 0;
  console.log('✅ reCAPTCHA v3 cargado correctamente');
  
  // Inicializar reCAPTCHA
  grecaptcha.ready(function() {
    console.log('✅ reCAPTCHA v3 listo');
  });
}

/**
 * Validar alias
 */
function validarAlias() {
  const alias = aliasInput.value.trim();
  if (alias.length < 2) {
    aliasInput.setCustomValidity('El alias debe tener al menos 2 caracteres');
    return false;
  }
  if (alias.length > 50) {
    aliasInput.setCustomValidity('El alias no puede tener más de 50 caracteres');
    return false;
  }
  aliasInput.setCustomValidity('');
  return true;
}

/**
 * Validar nombre completo (opcional)
 */
function validarNombreCompleto() {
  const nombreCompleto = nombreCompletoInput.value.trim();
  if (nombreCompleto.length > 100) {
    nombreCompletoInput.setCustomValidity('El nombre completo no puede tener más de 100 caracteres');
    return false;
  }
  nombreCompletoInput.setCustomValidity('');
  return true;
}

/**
 * Validar email
 */
function validarEmail() {
  const email = emailInput.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    emailInput.setCustomValidity('Por favor, ingresa un correo electrónico válido');
    return false;
  }
  emailInput.setCustomValidity('');
  return true;
}

/**
 * Validar formulario completo
 */
async function validarFormulario() {
  // Validar campos básicos
  if (!validarAlias() || !validarEmail()) {
    mostrarError('Por favor, completa todos los campos correctamente.');
    return false;
  }
  
  // reCAPTCHA v3 se ejecuta automáticamente al enviar el formulario
  // No requiere validación previa ya que es invisible
  
  // Verificar que el email no esté ya registrado
  const email = emailInput.value.trim().toLowerCase();
  const emailExiste = await verificarEmailExistente(email);
  
  if (emailExiste) {
    mostrarError('Este correo electrónico ya está registrado. Por favor, usa otro.');
    return false;
  }
  
  return true;
}

/**
 * Verificar si el email ya existe en la base de datos
 */
async function verificarEmailExistente(email) {
  try {
    const anfitrionesRef = collection(db, 'anfitriones');
    const q = query(anfitrionesRef, where('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error al verificar email:', error);
    
    // Verificar si el error es por contenido HTML inesperado
    if (error.message && error.message.includes('Unexpected token')) {
      console.error('El servidor devolvió HTML en lugar de datos. Verifica la configuración de Firestore.');
      mostrarError('Error de conexión con el servidor. Por favor, intenta nuevamente.');
    }
    
    // En caso de error, permitir continuar (no bloquear por error de red)
    return false;
  }
}

/**
 * Enviar formulario
 */
async function enviarFormulario() {
  if (isSubmitting) return;
  
  isSubmitting = true;
  ocultarMensaje();
  actualizarEstadoBoton(true);
  
  try {
    const alias = aliasInput.value.trim();
    const nombreCompleto = nombreCompletoInput.value.trim() || null; // Opcional, puede ser null
    const email = emailInput.value.trim().toLowerCase();
    
    // Obtener token de reCAPTCHA v3
    const SITE_KEY = '6LfqsDEsAAAAAJadPQ6_AMonxbeTBqqRWVXxCNvt';
    let recaptchaToken = null;
    
    try {
      if (typeof grecaptcha !== 'undefined' && grecaptcha.ready) {
        recaptchaToken = await grecaptcha.execute(SITE_KEY, { action: 'submit_signup' });
        console.log('✅ Token de reCAPTCHA obtenido');
      } else {
        console.warn('⚠️ reCAPTCHA no disponible, continuando sin validación');
      }
    } catch (recaptchaError) {
      console.error('❌ Error al obtener token de reCAPTCHA:', recaptchaError);
      // Continuar sin token si hay error (no bloquear el flujo)
    }
    
    // Generar sesión ID único
    const sesionId = `ANF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Crear documento de anfitrión en Firestore
    const anfitrionData = {
      tipo: 'efimero',
      sesionId: sesionId,
      alias: alias, // Alias (nombre visible)
      nombreCompleto: nombreCompleto, // Nombre completo (opcional, para uso interno)
      email: email,
      emailVerificado: false, // Se verificará cuando abra el link del email
      tokenVerificacion: generarTokenVerificacion(),
      recaptchaToken: recaptchaToken, // Guardar token de reCAPTCHA para validación en backend
      creadoEn: serverTimestamp(),
      ultimoAcceso: serverTimestamp(),
      eventosCreados: 0
    };
    
    const anfitrionesRef = collection(db, 'anfitriones');
    const docRef = await addDoc(anfitrionesRef, anfitrionData);
    
    console.log('Anfitrión creado con ID:', docRef.id);
    
    // Guardar en localStorage para sesión
    localStorage.setItem('anfitrion_sesion_id', sesionId);
    localStorage.setItem('anfitrion_id', docRef.id);
    localStorage.setItem('anfitrion_alias', alias);
    localStorage.setItem('anfitrion_email', email);
    
    // Enviar email de verificación
    try {
      console.log('📧 Llamando a Cloud Function para enviar email...');
      
      // Usar rewrite de Firebase Hosting para evitar problemas de CORS
      // El rewrite mapea /api/enviarEmailConfirmacion a la función HTTP
      // Firebase Hosting actúa como proxy, por lo que NO necesita invoker público
      const response = await fetch('/api/enviarEmailConfirmacion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          nombre: alias, // Usar alias para el email
          tokenVerificacion: anfitrionData.tokenVerificacion,
          anfitrionId: docRef.id,
          recaptchaToken: recaptchaToken // Enviar token para validación en backend
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `Error HTTP: ${response.status}` };
        }
        throw new Error(errorData.error || errorData.message || `Error HTTP: ${response.status}`);
      }
      
      const emailResult = await response.json();
      console.log('✅ Email de confirmación enviado exitosamente:', emailResult);
    } catch (emailError) {
      console.error('❌ Error al enviar email:', emailError);
      console.error('Detalles del error:', {
        code: emailError.code,
        message: emailError.message,
        details: emailError.details
      });
      
      // Mostrar mensaje al usuario sobre el error de email
      // No bloquear el flujo, pero informar al usuario
      if (mensajeDiv) {
        const errorAnterior = mensajeDiv.textContent;
        mensajeDiv.textContent = '⚠️ Cuenta creada, pero hubo un problema al enviar el email de confirmación. Por favor, contacta al administrador.';
        mensajeDiv.className = 'error-message rounded-lg p-4 text-sm text-yellow-200';
        mensajeDiv.classList.remove('hidden');
        
        // Restaurar mensaje anterior después de 5 segundos
        setTimeout(() => {
          if (errorAnterior) {
            mensajeDiv.textContent = errorAnterior;
          } else {
            mensajeDiv.classList.add('hidden');
          }
        }, 5000);
      }
    }
    
    mostrarExito();
    form.reset();
    
    // Redirigir a login después de 5 segundos
    setTimeout(() => {
      window.location.href = '/auth/login-host.html';
    }, 5000);
    
  } catch (error) {
    console.error('Error al crear anfitrión:', error);
    
    // Manejo específico de errores de MIME type o HTML inesperado
    if (error.message && (error.message.includes('Unexpected token') || error.message.includes('JSON'))) {
      mostrarError('Error de comunicación con el servidor. Por favor, verifica tu conexión y recarga la página.');
    } else if (error.code === 'permission-denied') {
      mostrarError('No tienes permisos para realizar esta acción. Por favor, contacta al administrador.');
    } else if (error.code === 'unavailable') {
      mostrarError('El servicio no está disponible temporalmente. Por favor, intenta más tarde.');
    } else {
      mostrarError('Error al crear la cuenta. Por favor, intenta nuevamente.');
    }
  } finally {
    isSubmitting = false;
    actualizarEstadoBoton(false);
  }
}

/**
 * Generar token de verificación para email
 */
function generarTokenVerificacion() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Date.now().toString(36);
}

/**
 * Actualizar estado del botón
 */
function actualizarEstadoBoton(loading) {
  if (loading) {
    btnEnviar.disabled = true;
    btnText.innerHTML = '<span class="spinner"></span>Creando cuenta...';
  } else {
    btnEnviar.disabled = false;
    btnText.textContent = 'Crear Cuenta de Anfitrión';
  }
}

/**
 * Mostrar mensaje de error
 */
function mostrarError(mensaje) {
  mensajeDiv.textContent = mensaje;
  mensajeDiv.className = 'error-message rounded-lg p-4 text-sm text-red-200';
  mensajeDiv.classList.remove('hidden');
  mensajeDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Mostrar mensaje de éxito
 */
function mostrarExito() {
  form.classList.add('hidden');
  mensajeExito.classList.remove('hidden');
  mensajeExito.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Ocultar mensaje
 */
function ocultarMensaje() {
  mensajeDiv.classList.add('hidden');
}

/**
 * Inicializar formulario de login
 */
function inicializarLoginForm() {
  if (!loginForm) return;
  
  // Validación en tiempo real
  loginEmailInput?.addEventListener('input', validarLoginEmail);
  
  // Submit del formulario
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    if (validarLoginFormulario()) {
      await enviarLogin();
    }
  });
}

/**
 * Validar email de login
 */
function validarLoginEmail() {
  const email = loginEmailInput.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    loginEmailInput.setCustomValidity('Por favor, ingresa un correo electrónico válido');
    return false;
  }
  loginEmailInput.setCustomValidity('');
  return true;
}

/**
 * Validar formulario de login
 */
function validarLoginFormulario() {
  if (!validarLoginEmail()) {
    mostrarLoginError('Por favor, completa todos los campos correctamente.');
    return false;
  }
  return true;
}

/**
 * Enviar formulario de login
 */
async function enviarLogin() {
  if (isSubmitting) return;
  
  isSubmitting = true;
  ocultarLoginMensaje();
  actualizarEstadoBotonLogin(true);
  
  try {
    const email = loginEmailInput.value.trim().toLowerCase();
    const sesionId = loginSesionIdInput.value.trim();
    
    // Buscar anfitrión por email o sesionId
    const anfitrionesRef = collection(db, 'anfitriones');
    let querySnapshot;
    
    if (sesionId && sesionId.startsWith('ANF-')) {
      // Buscar por sesionId
      const q = query(anfitrionesRef, where('sesionId', '==', sesionId));
      querySnapshot = await getDocs(q);
    } else {
      // Buscar por email
      const q = query(anfitrionesRef, where('email', '==', email));
      querySnapshot = await getDocs(q);
    }
    
    if (querySnapshot.empty) {
      mostrarLoginError('No se encontró una cuenta con esos datos. Verifica tu email o ID de sesión.');
      return;
    }
    
    // Obtener el primer resultado
    const anfitrionDoc = querySnapshot.docs[0];
    const anfitrionData = anfitrionDoc.data();
    
    // Guardar en localStorage
    localStorage.setItem('anfitrion_sesion_id', anfitrionData.sesionId);
    localStorage.setItem('anfitrion_id', anfitrionDoc.id);
    localStorage.setItem('anfitrion_alias', anfitrionData.alias || '');
    localStorage.setItem('anfitrion_email', anfitrionData.email);
    
    // Actualizar último acceso
    const anfitrionRef = doc(db, 'anfitriones', anfitrionDoc.id);
    await updateDoc(anfitrionRef, {
      ultimoAcceso: serverTimestamp()
    });
    
    // Mostrar éxito y redirigir
    mostrarLoginExito();
    
    // Redirigir después de 1 segundo
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
    
  } catch (error) {
    console.error('Error al hacer login:', error);
    
    if (error.message && (error.message.includes('Unexpected token') || error.message.includes('JSON'))) {
      mostrarLoginError('Error de comunicación con el servidor. Por favor, verifica tu conexión y recarga la página.');
    } else {
      mostrarLoginError('Error al iniciar sesión. Por favor, intenta nuevamente.');
    }
  } finally {
    isSubmitting = false;
    actualizarEstadoBotonLogin(false);
  }
}

/**
 * Inicializar alternancia entre formularios
 */
function inicializarAlternancia() {
  // Botón "Ya soy anfitrión" -> mostrar login
  btnYaSoyAnfitrion?.addEventListener('click', () => {
    mostrarLoginForm();
  });
  
  // Botón "Crear nueva cuenta" -> mostrar signup
  btnCrearCuenta?.addEventListener('click', () => {
    mostrarSignupForm();
  });
}

/**
 * Mostrar formulario de login
 */
function mostrarLoginForm() {
  signupFormContainer?.classList.add('hidden');
  loginFormContainer?.classList.remove('hidden');
  if (pageSubtitle) pageSubtitle.textContent = 'Iniciar Sesión';
  if (footerText) footerText.textContent = 'Al iniciar sesión, aceptas nuestros términos de servicio';
  
  // Resetear formulario de signup
  form?.reset();
  ocultarMensaje();
  
  // Focus en email
  setTimeout(() => {
    loginEmailInput?.focus();
  }, 100);
}

/**
 * Mostrar formulario de alta
 */
function mostrarSignupForm() {
  loginFormContainer?.classList.add('hidden');
  signupFormContainer?.classList.remove('hidden');
  if (pageSubtitle) pageSubtitle.textContent = 'Alta Rápida de Anfitrión';
  if (footerText) footerText.textContent = 'Al registrarte, aceptas nuestros términos de servicio';
  
  // Resetear formulario de login
  loginForm?.reset();
  ocultarLoginMensaje();
  
  // Focus en alias
  setTimeout(() => {
    aliasInput?.focus();
  }, 100);
}

/**
 * Actualizar estado del botón de login
 */
function actualizarEstadoBotonLogin(loading) {
  if (loading) {
    btnLoginEnviar.disabled = true;
    btnLoginText.innerHTML = '<span class="spinner"></span>Ingresando...';
  } else {
    btnLoginEnviar.disabled = false;
    btnLoginText.textContent = 'Ingresar';
  }
}

/**
 * Mostrar mensaje de error en login
 */
function mostrarLoginError(mensaje) {
  loginMensajeDiv.textContent = mensaje;
  loginMensajeDiv.className = 'error-message rounded-lg p-4 text-sm text-red-200';
  loginMensajeDiv.classList.remove('hidden');
  loginMensajeDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Mostrar mensaje de éxito en login
 */
function mostrarLoginExito() {
  loginMensajeDiv.textContent = '✓ Sesión iniciada correctamente. Redirigiendo...';
  loginMensajeDiv.className = 'success-message rounded-lg p-4 text-sm text-green-200';
  loginMensajeDiv.classList.remove('hidden');
}

/**
 * Ocultar mensaje de login
 */
function ocultarLoginMensaje() {
  loginMensajeDiv.classList.add('hidden');
}
