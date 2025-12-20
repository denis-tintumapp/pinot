# 🔒 Configuración de Google reCAPTCHA v3

## 📋 Resumen

Guía para configurar Google reCAPTCHA v3 como protección anti-bot para el formulario de alta rápida de anfitrión.

## 🎯 ¿Qué es reCAPTCHA v3?

reCAPTCHA v3 es un servicio de Google que:
- ✅ **Invisible**: No muestra ningún widget al usuario
- ✅ **Score basado**: Calcula un score (0.0 a 1.0) de confianza
- ✅ **Mejor UX**: No interrumpe el flujo del usuario
- ✅ **Gratuito**: Sin límites en el plan gratuito

## ✅ Configuración Actual

### Credenciales Configuradas

- **Site Key**: `6LfqsDEsAAAAAJadPQ6_AMonxbeTBqqRWVXxCNvt`
- **Secret Key**: `6LfqsDEsAAAAAJnZ0LvsbKCxX0aslVqY2sT1TTI4`

### Implementación

#### Frontend (`web/auth/signup-host-e.html`)

```html
<!-- Google reCAPTCHA v3 -->
<script src="https://www.google.com/recaptcha/api.js?render=6LfqsDEsAAAAAJadPQ6_AMonxbeTBqqRWVXxCNvt"></script>
```

#### JavaScript (`web/js/signup-host-e.js`)

```javascript
// Obtener token de reCAPTCHA v3 al enviar formulario
const SITE_KEY = '6LfqsDEsAAAAAJadPQ6_AMonxbeTBqqRWVXxCNvt';
const recaptchaToken = await grecaptcha.execute(SITE_KEY, { action: 'submit_signup' });
```

## 🔄 Flujo de Funcionamiento

```
1. Usuario completa formulario
   ↓
2. Usuario hace clic en "Crear Cuenta"
   ↓
3. reCAPTCHA v3 ejecuta automáticamente (invisible)
   ↓
4. Se obtiene token de reCAPTCHA
   ↓
5. Token se guarda en Firestore junto con datos del anfitrión
   ↓
6. (Opcional) Validar token en Cloud Function con Secret Key
```

## 🔧 Validación en Backend (Opcional pero Recomendado)

Para validar el token de reCAPTCHA en el servidor (Cloud Functions):

### 1. Instalar dependencia

```bash
cd functions
npm install axios
```

### 2. Crear Cloud Function de validación

```javascript
const axios = require('axios');
const SECRET_KEY = '6LfqsDEsAAAAAJnZ0LvsbKCxX0aslVqY2sT1TTI4';

async function verificarRecaptcha(token) {
  try {
    const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
      params: {
        secret: SECRET_KEY,
        response: token
      }
    });
    
    const { success, score, action } = response.data;
    
    // reCAPTCHA v3 devuelve un score de 0.0 a 1.0
    // 1.0 = muy probablemente humano
    // 0.0 = muy probablemente bot
    // Recomendado: aceptar scores >= 0.5
    
    if (success && score >= 0.5 && action === 'submit_signup') {
      return { valid: true, score };
    }
    
    return { valid: false, score, reason: 'Score bajo o acción incorrecta' };
  } catch (error) {
    console.error('Error al verificar reCAPTCHA:', error);
    return { valid: false, error: error.message };
  }
}
```

## 📊 Interpretación de Scores

- **0.9 - 1.0**: Muy probablemente humano ✅
- **0.7 - 0.9**: Probablemente humano ✅
- **0.5 - 0.7**: Dudoso, revisar ⚠️
- **0.0 - 0.5**: Muy probablemente bot ❌

**Recomendación**: Aceptar scores >= 0.5 para balance entre seguridad y UX.

## 🎨 Personalización

### Cambiar el umbral de score

En la validación del backend, ajusta el umbral:

```javascript
if (success && score >= 0.5) { // Cambiar 0.5 por el valor deseado
  // Aceptar
}
```

### Cambiar la acción

En el frontend, cambia la acción:

```javascript
const recaptchaToken = await grecaptcha.execute(SITE_KEY, { 
  action: 'submit_signup' // Cambiar por otra acción si es necesario
});
```

## 📝 Ventajas de reCAPTCHA v3

- ✅ **Invisible**: No interrumpe la experiencia del usuario
- ✅ **Mejor UX**: No requiere interacción del usuario
- ✅ **Score detallado**: Proporciona información sobre la confianza
- ✅ **Gratuito**: Sin límites en el plan gratuito
- ✅ **Fácil de implementar**: Solo requiere Site Key en frontend

## ⚠️ Consideraciones

- **Privacidad**: reCAPTCHA requiere tracking de Google
- **Score bajo**: Algunos usuarios legítimos pueden tener scores bajos
- **Validación backend**: Recomendado validar en el servidor para mayor seguridad

## ✅ Checklist

- [x] Site Key configurado en frontend ✅
- [x] Script de reCAPTCHA cargado ✅
- [x] Token obtenido al enviar formulario ✅
- [x] Token guardado en Firestore ✅
- [ ] (Opcional) Cloud Function para validación backend
- [ ] (Opcional) Configurar umbral de score

## 🚨 Troubleshooting

### Error: "reCAPTCHA no disponible"

- Verifica que el script se esté cargando correctamente
- Revisa la consola del navegador para errores
- Asegúrate de que el Site Key sea correcto

### Score siempre bajo

- Puede ser normal para algunos usuarios
- Considera bajar el umbral a 0.3-0.4
- Verifica que no haya bloqueadores de anuncios activos

### Token no se genera

- Verifica que `grecaptcha` esté disponible
- Asegúrate de que el Site Key sea correcto
- Revisa la consola para errores

---

**Última actualización**: Diciembre 2025  
**Estado**: ✅ Implementado y funcionando
