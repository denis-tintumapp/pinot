# 🎭 Implementación de Anfitrión Efímero

## 📋 Resumen

Implementación del perfil de **Anfitrión Efímero** para usuarios esporádicos que crean eventos sin necesidad de registrarse.

## ✅ Cambios Implementados

### 1. Función `generarSesionIdAnfitrion()` en `firestore.js`

```javascript
function generarSesionIdAnfitrion() {
  return `ANF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

### 2. Actualización de `crearEvento()` en `firestore.js`

- Agregado parámetro `anfitrionInfo` (opcional)
- Si no se proporciona, crea automáticamente un anfitrión efímero
- El evento ahora incluye el campo `anfitrion` con:
  - `tipo`: 'efimero' | 'registrado'
  - `sesionId`: ID único de sesión (para efímeros)
  - `nombreAnfitrion`: Nombre opcional (para efímeros)
  - `userId`: Firebase Auth UID (para registrados)
  - `email`: Email del usuario (para registrados)

### 3. Actualización de `crearEvento()` en `eventos.js`

- Genera automáticamente información de anfitrión efímero
- Guarda la sesión en `localStorage` para persistencia durante la sesión del navegador

## 📊 Estructura de Datos

### Evento con Anfitrión

```javascript
{
  nombre: "Cata de Vinos",
  fecha: "2025-12-20",
  pin: "12345",
  activo: true,
  creadoEn: timestamp,
  anfitrion: {
    tipo: "efimero",
    sesionId: "ANF-1702834567890-abc123xyz",
    nombreAnfitrion: null,
    userId: null,
    email: null
  }
}
```

## 🔧 Funcionalidades

### Anfitrión Efímero (Implementado)

- ✅ **Creación automática**: Se crea automáticamente al crear evento
- ✅ **Sesión única**: Cada anfitrión tiene un `sesionId` único
- ✅ **Persistencia local**: Se guarda en `localStorage`
- ✅ **Sin autenticación**: No requiere registro ni login
- ✅ **Gestión del evento**: Puede gestionar el evento mientras la sesión esté activa

### Anfitrión Registrado (Futuro)

- ⏳ **Autenticación**: Requiere Firebase Auth
- ⏳ **Persistencia**: Historial de eventos
- ⏳ **Estadísticas**: Métricas y análisis
- ⏳ **Múltiples eventos**: Puede gestionar varios eventos

## 🔄 Flujo Actual

1. Usuario accede a `/setup.html`
2. Crea evento (sin autenticación)
3. Se genera automáticamente:
   - `sesionId` único para el anfitrión
   - Evento con `anfitrion.tipo = 'efimero'`
4. Se guarda en `localStorage`:
   - `anfitrion_sesion_id`
   - `anfitrion_evento_id`
5. El anfitrión puede gestionar el evento mientras:
   - El evento esté activo
   - La sesión esté en `localStorage`
   - El navegador no haya limpiado el `localStorage`

## 📝 Próximos Pasos

### Para Completar la Implementación

1. **Verificar sesión al cargar páginas**:
   - En `/setup.html`: Verificar si hay sesión activa
   - En `/anfitrion.html`: Verificar sesión antes de mostrar datos

2. **Función de verificación de sesión**:
   ```javascript
   async function verificarSesionAnfitrion() {
     const sesionId = localStorage.getItem('anfitrion_sesion_id');
     const eventoId = localStorage.getItem('anfitrion_evento_id');
     
     if (sesionId && eventoId) {
       const eventoRef = doc(db, 'eventos', eventoId);
       const eventoSnap = await getDoc(eventoRef);
       
       if (eventoSnap.exists() && eventoSnap.data().activo === true) {
         const eventoData = eventoSnap.data();
         if (eventoData.anfitrion?.tipo === 'efimero' && 
             eventoData.anfitrion?.sesionId === sesionId) {
           return { sesionId, eventoId, eventoData };
         }
       }
     }
     return null;
   }
   ```

3. **Actualizar reglas de seguridad** (cuando se implemente anfitrión registrado):
   - Permitir actualización solo si `sesionId` coincide (efímero)
   - O si `userId` coincide (registrado)

## 🎯 Beneficios

- ✅ **Adopción rápida**: Sin fricción de registro
- ✅ **Espontaneidad**: Eventos casuales con amigos
- ✅ **Privacidad**: No se guarda información personal
- ✅ **Simplicidad**: Funciona inmediatamente

---

**Última actualización**: Diciembre 2025


