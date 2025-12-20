# 🎭 Guía de Alta Rápida de Anfitrión

## 📋 Resumen

Sistema de alta rápida para anfitriones efímeros con validación de email y protección anti-bot.

## 🎯 Características

- ✅ **Formulario moderno** con diseño glassmorphism
- ✅ **Validación en tiempo real** de nombre y email
- ✅ **Protección anti-bot** con Cloudflare Turnstile
- ✅ **Verificación de email único** (previene duplicados)
- ✅ **Persistencia en localStorage** para sesión
- ✅ **Integración con Firestore** para almacenamiento

## 📁 Archivos Creados

1. **`/web/auth/signup-host-e.html`**
   - Página HTML del formulario
   - Diseño responsive y moderno
   - Integración de Cloudflare Turnstile

2. **`/web/js/signup-host-e.js`**
   - Lógica del formulario
   - Validación de campos
   - Integración con Firestore
   - Manejo de sesión

3. **`/CONFIGURAR_TURNSTILE.md`**
   - Guía para configurar Cloudflare Turnstile
   - Instrucciones paso a paso

## 🔧 Configuración Requerida

### 1. Cloudflare Turnstile

Antes de usar el formulario, necesitas:

1. Crear cuenta en Cloudflare (gratis)
2. Obtener Site Key y Secret Key
3. Actualizar `auth/signup-host-e.html` y `js/signup-host-e.js` con tu Site Key

Ver `CONFIGURAR_TURNSTILE.md` para instrucciones detalladas.

### 2. Firestore Rules

Las reglas de seguridad ya están actualizadas en `cata-pwa-dev/firestore.rules`:

```javascript
match /anfitriones/{anfitrionId} {
  allow read: if true;
  allow create: if request.auth == null;
  allow update: if 
    (request.auth == null && 
     resource.data.sesionId == request.resource.data.sesionId) ||
    (request.auth != null &&
     resource.data.userId == request.auth.uid);
  allow delete: if false;
}
```

## 📊 Estructura de Datos

### Colección `anfitriones`

```javascript
{
  tipo: 'efimero',
  sesionId: 'ANF-1702834567890-abc123xyz',
  nombreAnfitrion: 'Juan Pérez',
  email: 'juan@example.com',
  emailVerificado: false,
  tokenVerificacion: 'abc123xyz...',
  turnstileToken: '0.abc123...', // Token de Turnstile para auditoría
  creadoEn: timestamp,
  ultimoAcceso: timestamp,
  eventosCreados: 0
}
```

### Evento con Anfitrión Actualizado

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
    nombreAnfitrion: "Juan Pérez", // Ahora incluye nombre
    email: "juan@example.com", // Ahora incluye email
    userId: null,
    email: null
  }
}
```

## 🔄 Flujo de Usuario

1. **Usuario accede a `/alta-anfitrion.html`**
2. **Completa el formulario**:
   - Nombre (mínimo 2 caracteres)
   - Email (validación de formato)
3. **Completa verificación Turnstile** (anti-bot)
4. **Sistema valida**:
   - Formato de campos
   - Email único (no duplicado)
   - Token de Turnstile
5. **Se crea el anfitrión** en Firestore
6. **Se guarda en localStorage**:
   - `anfitrion_sesion_id`
   - `anfitrion_id`
   - `anfitrion_nombre`
   - `anfitrion_email`
7. **Mensaje de éxito** con instrucciones

## 🔐 Seguridad

### Protección Anti-Bot

- **Cloudflare Turnstile**: Verificación invisible o con desafío mínimo
- **Token almacenado**: Para auditoría y validación backend (futuro)

### Validaciones

- ✅ Nombre: 2-50 caracteres
- ✅ Email: Formato válido
- ✅ Email único: No permite duplicados
- ✅ Turnstile: Token válido requerido

### Firestore Rules

- ✅ Crear: Sin autenticación (alta rápida)
- ✅ Leer: Público (para verificación de sesión)
- ✅ Actualizar: Solo si `sesionId` coincide
- ✅ Eliminar: No permitido

## 📧 Verificación de Email (Futuro)

Para implementar verificación de email:

1. **Cloud Function** para enviar emails
2. **Link de verificación** con token único
3. **Página de verificación** (`/auth/verify-email.html?token=...`)
4. **Actualizar `emailVerificado`** en Firestore

## 🔗 Integración con Creación de Eventos

El sistema ahora usa `obtenerOcrearAnfitrion()` en `eventos.js`:

```javascript
const { obtenerOcrearAnfitrion } = await import('./firestore.js');
const anfitrionInfo = await obtenerOcrearAnfitrion();
```

Esto significa que:
- Si el usuario completó el alta rápida, se usa esa información
- Si no, se crea un anfitrión efímero básico

## 🎨 Personalización

### Colores y Estilos

Los estilos están en `alta-anfitrion.html` dentro de `<style>`. Puedes personalizar:

- Gradiente de fondo: `background: linear-gradient(...)`
- Efecto glass: `.glass-effect`
- Colores de botones: `.btn-primary`

### Mensajes

Los mensajes están en español. Para cambiar:

- Buscar `textContent` en `alta-anfitrion.js`
- Actualizar strings según necesidad

## ✅ Checklist de Implementación

- [x] HTML del formulario creado
- [x] JavaScript de validación implementado
- [x] Integración con Firestore
- [x] Protección Turnstile integrada
- [x] Firestore rules actualizadas
- [x] Función `obtenerOcrearAnfitrion()` creada
- [x] Integración con creación de eventos
- [ ] Configurar Site Key de Turnstile
- [ ] (Futuro) Cloud Function para verificación de email
- [ ] (Futuro) Página de verificación de email

## 🚀 Próximos Pasos

1. **Configurar Turnstile**: Seguir `CONFIGURAR_TURNSTILE.md`
2. **Probar formulario**: Acceder a `/alta-anfitrion.html`
3. **Verificar datos**: Revisar colección `anfitriones` en Firestore
4. **Implementar verificación de email**: (Opcional, futuro)

---

**Última actualización**: Diciembre 2025


