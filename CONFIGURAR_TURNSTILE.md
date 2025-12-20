# 🔒 Configuración de Cloudflare Turnstile

## 📋 Resumen

Guía para configurar Cloudflare Turnstile como protección anti-bot para el formulario de alta rápida de anfitrión.

## 🎯 ¿Qué es Turnstile?

Cloudflare Turnstile es una alternativa moderna a reCAPTCHA que:
- ✅ No requiere cookies de tracking
- ✅ Es más privado y rápido
- ✅ Tiene mejor UX (menos intrusivo)
- ✅ Es gratuito

## 📝 Pasos para Configurar

### 1. Crear cuenta en Cloudflare (si no tienes)

1. Ve a [cloudflare.com](https://www.cloudflare.com)
2. Crea una cuenta gratuita
3. No necesitas agregar un dominio para usar Turnstile

### 2. Obtener Site Key y Secret Key

1. Ve al [Dashboard de Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile)
2. Haz clic en **"Add Site"** o **"Agregar Sitio"**
3. Completa el formulario:
   - **Site name**: `Pinot - Alta Anfitrión`
   - **Domain**: `pinot.tintum.app` (o `pinot-tintum.web.app` para desarrollo)
   - **Widget mode**: `Managed` (recomendado)
   - **Pre-Clearance**: Opcional (para mejor UX)
4. Haz clic en **"Create"**
5. Copia:
   - **Site Key** (público, va en el HTML)
   - **Secret Key** (privado, para validación en backend)

### 3. Actualizar el Código

#### En `auth/signup-host-e.html`:

```html
<!-- Reemplazar TU_SITE_KEY_AQUI con tu Site Key -->
<div id="turnstile-widget" class="cf-turnstile" 
     data-sitekey="TU_SITE_KEY_AQUI"
     data-theme="light"
     data-size="normal">
</div>
```

#### En `js/signup-host-e.js`:

```javascript
// Reemplazar TU_SITE_KEY_AQUI con tu Site Key
const widgetId = turnstile.render('#turnstile-widget', {
  sitekey: 'TU_SITE_KEY_AQUI', // Tu Site Key aquí
  // ...
});
```

### 4. Validación en Backend (Opcional pero Recomendado)

Para validar el token de Turnstile en el servidor (Cloud Functions), necesitarás:

```javascript
// En una Cloud Function
const SECRET_KEY = 'TU_SECRET_KEY_AQUI';

async function verificarTurnstile(token) {
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      secret: SECRET_KEY,
      response: token
    })
  });
  
  const data = await response.json();
  return data.success === true;
}
```

## 🔧 Modos de Widget

### Managed (Recomendado)
- Cloudflare decide automáticamente si mostrar un desafío
- Mejor UX para usuarios legítimos
- Usa: `data-widget-mode="managed"` o no especificar

### Non-interactive
- Nunca muestra desafío visual
- Solo verificación en background
- Usa: `data-widget-mode="non-interactive"`

### Invisible
- Completamente invisible
- Verificación automática
- Usa: `data-widget-mode="invisible"`

## 🎨 Temas

- `light`: Tema claro (recomendado para fondos claros)
- `dark`: Tema oscuro (recomendado para fondos oscuros)
- `auto`: Se adapta según preferencias del sistema

## 📊 Límites y Consideraciones

- **Gratis**: Hasta 1 millón de verificaciones/mes
- **Rate limiting**: Cloudflare maneja automáticamente
- **Privacidad**: No requiere cookies de tracking
- **Compliance**: GDPR/CCPA friendly

## 🚀 Alternativas

Si prefieres no usar Turnstile, puedes usar:

1. **reCAPTCHA v3** (Google)
   - Más común pero requiere tracking
   - Menos privado

2. **hCaptcha**
   - Alternativa a reCAPTCHA
   - Más privado que reCAPTCHA

3. **Validación manual simple**
   - Rate limiting en Firestore
   - Verificación de email obligatoria

## ✅ Checklist

- [ ] Cuenta de Cloudflare creada
- [ ] Site creado en Turnstile
- [ ] Site Key copiada
- [ ] Secret Key guardada de forma segura
- [ ] Site Key actualizada en `auth/signup-host-e.html`
- [ ] Site Key actualizada en `js/signup-host-e.js`
- [ ] (Opcional) Cloud Function para validación backend
- [ ] Prueba del formulario funcionando

---

**Última actualización**: Diciembre 2025


