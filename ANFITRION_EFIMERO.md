# 🎭 Anfitrión Efímero - Modelo de Datos

## 📋 Resumen

Implementación de un perfil de **Anfitrión Efímero** para usuarios esporádicos que crean eventos lúdicos sin necesidad de registrarse o autenticarse.

## 🎯 Tipos de Anfitriones

### 1. Anfitrión Registrado/Autenticado
- **Características**:
  - Se registra e identifica con datos rigurosos
  - Datos persisten en el tiempo
  - Usuario que eligió enrolarse en la app
  - Tiene perfil de usuario en Firebase Auth
  - Historial de eventos creados
  - Estadísticas y métricas

- **Uso**: Usuarios frecuentes, profesionales, empresas

### 2. Anfitrión Efímero (Nuevo)
- **Características**:
  - Se autoasigna el rol para generar un evento lúdico
  - No requiere registro ni autenticación
  - No tiene perfil de usuario persistente
  - Datos del evento se guardan pero no se vinculan a un usuario
  - Puede no usar la app más después del evento

- **Uso**: Usuarios esporádicos, eventos casuales con amigos

## 📊 Modelo de Datos

### Estructura del Evento

```javascript
{
  nombre: string,
  fecha: string (ISO 8601),
  pin: string (5 dígitos),
  activo: boolean,
  creadoEn: timestamp,
  
  // NUEVO: Información del anfitrión
  anfitrion: {
    tipo: 'registrado' | 'efimero',
    // Si es registrado:
    userId: string (Firebase Auth UID), // Solo si tipo === 'registrado'
    email: string, // Solo si tipo === 'registrado'
    // Si es efímero:
    sesionId: string, // Solo si tipo === 'efimero' (similar a participantes)
    nombreAnfitrion: string // Opcional, nombre que se autoasigna
  }
}
```

### Colección `anfitriones` (Opcional - para tracking)

```javascript
{
  sesionId: string, // ID único de sesión (para efímeros)
  userId: string | null, // Firebase Auth UID (null para efímeros)
  tipo: 'registrado' | 'efimero',
  nombre: string, // Nombre autoasignado (solo para efímeros)
  eventosCreados: number,
  primerEvento: timestamp,
  ultimoEvento: timestamp,
  creadoEn: timestamp
}
```

## 🔧 Implementación

### Flujo para Anfitrión Efímero

1. **Usuario accede a `/setup.html`**
2. **No requiere autenticación**
3. **Crea evento**:
   - Se genera un `sesionId` único (similar a participantes)
   - Se guarda en `localStorage` para la sesión
   - El evento se crea con `anfitrion.tipo = 'efimero'`
   - `anfitrion.sesionId = sesionId`
   - `anfitrion.userId = null`

4. **Gestión del evento**:
   - El anfitrión puede gestionar el evento mientras la sesión esté activa
   - La sesión se mantiene en `localStorage`
   - Si cierra el navegador, puede recuperar la sesión si el evento sigue activo

### Flujo para Anfitrión Registrado

1. **Usuario se autentica** (Firebase Auth)
2. **Accede a `/setup.html`**
3. **Crea evento**:
   - El evento se crea con `anfitrion.tipo = 'registrado'`
   - `anfitrion.userId = auth.currentUser.uid`
   - `anfitrion.email = auth.currentUser.email`
   - `anfitrion.sesionId = null`

4. **Gestión del evento**:
   - Puede gestionar cualquier evento que haya creado
   - Historial de eventos disponible
   - Estadísticas y métricas

## 📝 Cambios Necesarios

### 1. Actualizar `crearEvento()` en `firestore.js`

```javascript
export async function crearEvento(nombre, fechaISO, participantesSeleccionados = [], etiquetasSeleccionadas = [], anfitrionInfo = null) {
  // ...
  const nuevoEvento = {
    nombre: nombre || 'Cata sin nombre',
    fecha: fechaISO,
    pin: pin,
    activo: true,
    creadoEn: serverTimestamp(),
    // NUEVO: Información del anfitrión
    anfitrion: anfitrionInfo || {
      tipo: 'efimero',
      sesionId: generarSesionId(), // Generar sesión única
      nombreAnfitrion: null // Opcional
    }
  };
  // ...
}
```

### 2. Generar Sesión para Anfitrión Efímero

```javascript
function generarSesionIdAnfitrion() {
  return `ANF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

### 3. Guardar Sesión en localStorage

```javascript
const STORAGE_KEY_ANFITRION_SESION = 'anfitrion_sesion_id';
const STORAGE_KEY_ANFITRION_EVENTO = 'anfitrion_evento_id';

function guardarSesionAnfitrion(sesionId, eventoId) {
  localStorage.setItem(STORAGE_KEY_ANFITRION_SESION, sesionId);
  localStorage.setItem(STORAGE_KEY_ANFITRION_EVENTO, eventoId);
}
```

### 4. Verificar Sesión al Cargar `/setup.html` o `/anfitrion.html`

```javascript
async function verificarSesionAnfitrion() {
  const sesionId = localStorage.getItem(STORAGE_KEY_ANFITRION_SESION);
  const eventoId = localStorage.getItem(STORAGE_KEY_ANFITRION_EVENTO);
  
  if (sesionId && eventoId) {
    // Verificar que el evento existe y está activo
    const eventoRef = doc(db, 'eventos', eventoId);
    const eventoSnap = await getDoc(eventoRef);
    
    if (eventoSnap.exists() && eventoSnap.data().activo === true) {
      const eventoData = eventoSnap.data();
      // Verificar que la sesión coincide
      if (eventoData.anfitrion?.tipo === 'efimero' && 
          eventoData.anfitrion?.sesionId === sesionId) {
        return { sesionId, eventoId, eventoData };
      }
    }
  }
  
  return null;
}
```

## 🔒 Reglas de Seguridad

### Firestore Rules para Eventos

```javascript
match /eventos/{eventoId} {
  allow read: if true; // Cualquiera puede leer eventos
  
  allow create: if request.auth == null; // Permitir crear sin auth (efímero)
  
  allow update: if 
    // Anfitrión efímero: verificar sesionId en el evento
    (request.auth == null && 
     resource.data.anfitrion.tipo == 'efimero' &&
     request.resource.data.anfitrion.sesionId == resource.data.anfitrion.sesionId) ||
    // Anfitrión registrado: verificar userId
    (request.auth != null &&
     resource.data.anfitrion.tipo == 'registrado' &&
     resource.data.anfitrion.userId == request.auth.uid);
  
  allow delete: if false; // No permitir eliminar eventos
}
```

## 📊 Ventajas del Modelo

### Para Anfitrión Efímero:
- ✅ **Sin fricción**: No requiere registro
- ✅ **Adopción rápida**: Puede crear evento inmediatamente
- ✅ **Privacidad**: No se guarda información personal
- ✅ **Espontaneidad**: Ideal para eventos casuales

### Para Anfitrión Registrado:
- ✅ **Persistencia**: Historial de eventos
- ✅ **Estadísticas**: Métricas y análisis
- ✅ **Seguridad**: Autenticación robusta
- ✅ **Escalabilidad**: Múltiples eventos gestionados

## 🔄 Migración

Los eventos existentes pueden migrarse:
- Si no tienen `anfitrion`, se asume `tipo: 'efimero'` con `sesionId: null`
- Los eventos antiguos seguirán funcionando

---

**Última actualización**: Diciembre 2025


