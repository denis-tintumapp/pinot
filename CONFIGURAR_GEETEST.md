# 🔒 Configuración de GeeTest CAPTCHA

## 📋 Resumen

Guía para configurar GeeTest CAPTCHA como protección anti-bot para el formulario de alta rápida de anfitrión.

## 🎯 ¿Qué es GeeTest?

GeeTest es un servicio de CAPTCHA que ofrece:
- ✅ Verificación de deslizamiento interactiva
- ✅ Mejor UX que reCAPTCHA tradicional
- ✅ Protección contra bots avanzada
- ✅ Plan gratuito disponible

## 📝 Pasos para Configurar

### 1. Crear cuenta en GeeTest

1. Ve a [geetest.com](https://www.geetest.com)
2. Crea una cuenta gratuita
3. Verifica tu email

### 2. Crear un CAPTCHA

1. Ve al [Dashboard de GeeTest](https://account.geetest.com/)
2. Haz clic en **"Crear CAPTCHA"** o **"Add CAPTCHA"**
3. Completa el formulario:
   - **Nombre**: `Pinot - Alta Anfitrión`
   - **Dominio**: `pinot.tintum.app` (o `pinot-tintum.web.app` para desarrollo)
   - **Tipo**: `CAPTCHA de deslizamiento` (recomendado)
4. Haz clic en **"Crear"**
5. Copia tu **Captcha ID** (público, va en el código)

### 3. Actualizar el Código

#### En `auth/signup-host-e.html`:

El script de GeeTest ya está incluido:
```html
<script src="https://static.geetest.com/static/js/gt.0.5.0.js"></script>
```

#### En `js/signup-host-e.js`:

El Captcha ID ya está configurado:

```javascript
const captchaId = '3d1ea9bb38c9ad5061f8eab22bb5f6a9';
```

**Nota**: El Private Key (`2f8d30d9538937e421c7a41fa5347d4f`) se usará en el backend si implementas validación del servidor (opcional).

### 4. Configuración Avanzada (Opcional)

Puedes personalizar el comportamiento de GeeTest en `inicializarGeeTest()`:

```javascript
initGeetest({
  gt: captchaId,
  challenge: '', // Se obtiene del servidor en producción
  offline: false,
  new_captcha: true,
  product: 'popup', // popup, float, bind, custom
  width: '100%',
  lang: 'es' // Idioma español
}, function (captchaObj) {
  // ...
});
```

**Opciones de `product`**:
- `popup`: Muestra un popup modal (recomendado)
- `float`: Flotante en la esquina
- `bind`: Integrado en el formulario
- `custom`: Personalizado

### 5. Validación en Backend (Opcional pero Recomendado)

Para validar el CAPTCHA en el servidor (Cloud Functions), necesitarás:

1. **Obtener tu Private Key** desde el dashboard de GeeTest
2. **Implementar validación en Cloud Function**:

```javascript
// En una Cloud Function
const SECRET_KEY = '2f8d30d9538937e421c7a41fa5347d4f';

async function verificarGeeTest(challenge, validate, seccode) {
  const response = await fetch('https://api.geetest.com/validate.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      geetest_challenge: challenge,
      geetest_validate: validate,
      geetest_seccode: seccode,
      secret_key: SECRET_KEY
    })
  });
  
  const data = await response.json();
  return data.status === 'success';
}
```

## 🎨 Personalización

### Estilos CSS

GeeTest se renderiza en el contenedor `#geetest-captcha`. Puedes personalizar los estilos en `signup-host-e.html`:

```css
#geetest-captcha {
  margin: 0 auto;
  max-width: 300px;
}
```

## 📊 Límites y Consideraciones

- **Plan Gratuito**: Hasta 10,000 verificaciones/mes
- **Plan Pago**: Límites más altos según el plan
- **Rate limiting**: GeeTest maneja automáticamente
- **Privacidad**: Cumple con GDPR

## 🚀 Alternativas

Si prefieres no usar GeeTest, puedes usar:

1. **Cloudflare Turnstile** (anteriormente usado)
   - Más privado
   - Sin límites en plan gratuito

2. **reCAPTCHA v3** (Google)
   - Más común pero requiere tracking
   - Menos privado

3. **hCaptcha**
   - Alternativa a reCAPTCHA
   - Más privado que reCAPTCHA

## ✅ Checklist

- [x] Cuenta de GeeTest creada
- [x] CAPTCHA creado en el dashboard
- [x] Captcha ID copiado
- [x] Captcha ID actualizado en `js/signup-host-e.js` ✅ Configurado: `3d1ea9bb38c9ad5061f8eab22bb5f6a9`
- [x] Private Key guardada: `2f8d30d9538937e421c7a41fa5347d4f`
- [ ] (Opcional) Cloud Function para validación backend
- [ ] Prueba del formulario funcionando

## 🚨 Troubleshooting

### Error: "GeeTest no está cargado"

- Verifica que el script esté incluido en el HTML
- Revisa la consola del navegador para errores
- Asegúrate de que la conexión a internet funcione

### Error: "Captcha ID no configurado"

- Verifica que hayas reemplazado `TU_CAPTCHA_ID` con tu ID real
- Asegúrate de que el ID sea correcto (sin espacios)

### El CAPTCHA no aparece

- Verifica que el contenedor `#geetest-captcha` exista
- Revisa que el dominio esté configurado correctamente en GeeTest
- Verifica que no haya errores en la consola

---

**Última actualización**: Diciembre 2025


