# 🔐 Acceso Directo a OAuth Consent Screen

## ❌ Problema

Al intentar acceder a OAuth Consent Screen, te redirige a la página de autenticación.

## ✅ Solución

### Paso 1: Iniciar Sesión

1. En la página que se abrió (https://console.cloud.google.com/auth/overview?project=pinot-tintum):
   - Ingresa tu email: `denis@tintum.app`
   - Haz clic en **"Next"** o **"Siguiente"**
   - Completa la autenticación (puede requerir verificación en 2 pasos)

### Paso 2: Acceder Directamente

**Después de iniciar sesión**, usa esta URL directa:

```
https://console.cloud.google.com/apis/credentials/consent?project=pinot-tintum
```

### Paso 3: Navegación Manual (Alternativa)

Si la URL directa no funciona:

1. En la consola de Google Cloud, busca el **menú lateral (☰)** en la esquina superior izquierda

2. Haz clic en el menú y busca:
   - **"APIs & Services"** o **"APIs y servicios"**

3. En el submenú de APIs & Services, busca:
   - **"OAuth consent screen"** o **"Pantalla de consentimiento de OAuth"**

4. Haz clic en él

### Paso 4: Verificar que Estás en el Proyecto Correcto

Antes de configurar, verifica que estés en el proyecto correcto:

1. En la parte superior de la página, busca el **selector de proyectos**
2. Debe decir: **pinot-tintum**
3. Si no, haz clic y selecciona **pinot-tintum**

## 🎯 Una Vez que Accedas

Cuando finalmente veas la página de OAuth Consent Screen:

1. **Si ves información ya configurada:**
   - Verifica que tenga el scope `gmail.send`
   - Verifica que `denis@tintum.app` esté en test users (si está en Testing)

2. **Si ves "EDIT APP" o botón de edición:**
   - Haz clic para configurar
   - Completa los campos necesarios
   - Agrega test users si es necesario
   - Guarda

## 📝 Nota

La redirección a la página de autenticación es normal si:
- No has iniciado sesión en el navegador
- Tu sesión expiró
- Estás usando una ventana de incógnito

**Solución**: Inicia sesión primero, luego accede a OAuth Consent Screen.

---

**Última actualización**: Diciembre 2025

