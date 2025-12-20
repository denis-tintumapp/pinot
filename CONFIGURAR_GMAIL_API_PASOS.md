# 🚀 Pasos para Configurar Gmail API

## ✅ Estado Actual

- ✅ Google Cloud SDK instalado
- ✅ Proyecto detectado: `pinot-tintum`
- ⏳ Pendiente: Autenticación y configuración OAuth2

## 📝 Pasos a Seguir

### Paso 1: Autenticarse con gcloud

```bash
gcloud auth login
```

Esto abrirá tu navegador. Inicia sesión con `denis@tintum.app`.

### Paso 2: Verificar/Configurar Proyecto

```bash
# Ver proyecto actual
gcloud config get-value project

# Si quieres usar otro proyecto o crear uno nuevo:
gcloud projects list
gcloud config set project TU_PROJECT_ID
```

### Paso 3: Habilitar Gmail API

```bash
gcloud services enable gmail.googleapis.com
```

### Paso 4: Configurar OAuth Consent Screen

Abre esta URL en tu navegador:
```
https://console.cloud.google.com/apis/credentials/consent?project=pinot-tintum
```

Configura:
- **User Type**: Internal (si tienes Google Workspace) o External
- **App name**: `Pinot Email Service`
- **User support email**: `denis@tintum.app`
- **Developer contact**: `denis@tintum.app`
- **Scopes**: Agrega `https://www.googleapis.com/auth/gmail.send`
- Guarda y continúa

### Paso 5: Crear Credenciales OAuth2

Abre esta URL:
```
https://console.cloud.google.com/apis/credentials?project=pinot-tintum
```

1. Haz clic en **Create Credentials** → **OAuth client ID**
2. Si es la primera vez, completa el OAuth consent screen (Paso 4)
3. **Application type**: `Desktop app`
4. **Name**: `Pinot Gmail API`
5. Haz clic en **Create**
6. **Copia el Client ID y Client Secret** (los necesitarás)

### Paso 6: Obtener Refresh Token

```bash
cd /Users/denispaiva/proyectos/pinot/functions
npm install googleapis
node get-refresh-token.js
```

Sigue las instrucciones:
1. Ingresa el Client ID
2. Ingresa el Client Secret
3. Visita la URL que se muestra
4. Autoriza la aplicación
5. Copia el código de autorización
6. Pégalo en la terminal
7. Copia el Refresh Token que se muestra

### Paso 7: Configurar Firebase Functions

```bash
cd /Users/denispaiva/proyectos/pinot

firebase functions:config:set gmail.client_id="TU_CLIENT_ID"
firebase functions:config:set gmail.client_secret="TU_CLIENT_SECRET"
firebase functions:config:set gmail.refresh_token="TU_REFRESH_TOKEN"
firebase functions:config:set gmail.user="hello@tintum.app"
firebase functions:config:set gmail.oauth_email="denis@tintum.app"
```

### Paso 8: Verificar Configuración

```bash
firebase functions:config:get
```

Deberías ver:
```json
{
  "gmail": {
    "client_id": "...",
    "client_secret": "...",
    "refresh_token": "...",
    "user": "hello@tintum.app",
    "oauth_email": "denis@tintum.app"
  }
}
```

### Paso 9: Instalar Dependencias y Desplegar

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### Paso 10: Probar

1. Completa el formulario en: `https://pinot.tintum.app/auth/signup-host-e.html`
2. Verifica que el email llegue desde `hello@tintum.app`
3. Revisa los logs si hay problemas:
   ```bash
   firebase functions:log --only enviarEmailConfirmacion
   ```

## 🎯 Resumen Rápido

```bash
# 1. Autenticarse
gcloud auth login

# 2. Habilitar Gmail API
gcloud services enable gmail.googleapis.com

# 3. Configurar OAuth en consola web (ver URLs arriba)

# 4. Obtener Refresh Token
cd functions && npm install googleapis && node get-refresh-token.js

# 5. Configurar Firebase
firebase functions:config:set gmail.*="..."

# 6. Desplegar
cd functions && npm install && cd .. && firebase deploy --only functions
```

---

**Última actualización**: Diciembre 2025


