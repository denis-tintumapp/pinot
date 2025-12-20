# 📋 Guía Completa: Configurar OAuth para Gmail API

## 🎯 Objetivo

Configurar OAuth2 para que Gmail API pueda enviar emails desde `hello@tintum.app`.

## 📝 Pasos Detallados

### Paso 1: Iniciar Sesión en Google Cloud Console

1. Ve a: https://console.cloud.google.com
2. Inicia sesión con `denis@tintum.app`
3. Selecciona el proyecto: **pinot-tintum**

### Paso 2: Acceder a OAuth Consent Screen

**Opción A: Desde el menú**
1. En el menú lateral izquierdo, busca **"APIs & Services"**
2. Haz clic en **"OAuth consent screen"**

**Opción B: URL directa**
1. Ve a: https://console.cloud.google.com/apis/credentials/consent?project=pinot-tintum

### Paso 3: Configurar OAuth Consent Screen

Si es la primera vez o necesitas editar:

1. Haz clic en **"EDIT APP"** o **"Editar aplicación"** (si está visible)

2. **App information** (si se solicita):
   - **App name**: `Pinot Email Service`
   - **User support email**: `denis@tintum.app`
   - **Developer contact**: `denis@tintum.app`

3. **Scopes**:
   - Haz clic en **"ADD OR REMOVE SCOPES"** o **"Agregar o quitar scopes"**
   - Busca: `gmail.send`
   - O ingresa manualmente: `https://www.googleapis.com/auth/gmail.send`
   - Selecciónalo
   - Haz clic en **"UPDATE"** o **"Actualizar"**

4. **Test users** (si el Publishing status es "Testing"):
   - Busca la sección **"Test users"** o **"Users"**
   - Puede estar en una pestaña separada o debajo de "Publishing status"
   - Haz clic en **"ADD USERS"** o **"Agregar usuarios"**
   - Ingresa: `denis@tintum.app`
   - Haz clic en **"ADD"** o **"Agregar"**

5. **Guardar**:
   - Haz clic en **"SAVE AND CONTINUE"** o **"Guardar y continuar"**
   - Completa todos los pasos hasta llegar a "Summary"
   - Haz clic en **"BACK TO DASHBOARD"** o **"Volver al panel"**

### Paso 4: Obtener Refresh Token

Una vez configurado el OAuth Consent Screen:

1. Ejecuta el script:
   ```bash
   cd /Users/denispaiva/proyectos/pinot/functions
   node get-token-now.js
   ```

2. Abre la URL que se muestra

3. Si aparece advertencia "Google hasn't verified this app":
   - Haz clic en **"Advanced"**
   - Luego **"Go to Pinot PWA (unsafe)"**

4. Autoriza la aplicación

5. Copia el código de autorización

6. Pégalo en la terminal

7. Copia el **Refresh Token** que se muestra

### Paso 5: Configurar Firebase Functions

```bash
cd /Users/denispaiva/proyectos/pinot

firebase functions:config:set gmail.client_id="TU_CLIENT_ID_AQUI"
firebase functions:config:set gmail.client_secret="TU_CLIENT_SECRET_AQUI"
firebase functions:config:set gmail.refresh_token="TU_REFRESH_TOKEN_AQUI"
firebase functions:config:set gmail.user="hello@tintum.app"
firebase functions:config:set gmail.oauth_email="denis@tintum.app"
```

Reemplaza `TU_REFRESH_TOKEN_AQUI` con el Refresh Token obtenido.

### Paso 6: Verificar y Desplegar

```bash
# Verificar configuración
firebase functions:config:get

# Instalar dependencias
cd functions
npm install

# Desplegar
cd ..
firebase deploy --only functions
```

## 🚨 Troubleshooting

### Error 400: invalid_request
- Verifica que el OAuth Consent Screen esté completamente configurado
- Verifica que `denis@tintum.app` esté en test users (si está en Testing)
- Verifica que el scope `gmail.send` esté agregado

### Error: Access blocked
- Agrega `denis@tintum.app` como test user
- Verifica que el OAuth Consent Screen esté guardado

### No se obtiene Refresh Token
- Asegúrate de usar `prompt: 'consent'` en la URL de autorización
- Si ya autorizaste antes, revoca el acceso y autoriza nuevamente

---

**Última actualización**: Diciembre 2025

