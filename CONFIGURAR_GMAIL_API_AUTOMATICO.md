# 🚀 Configuración Automática de Gmail API

## 📋 Resumen

Guía para configurar Gmail API usando scripts automatizados y Google Cloud CLI.

## ✅ Requisitos Previos

1. **Google Cloud CLI (gcloud)** instalado
   ```bash
   # macOS
   brew install google-cloud-sdk
   
   # O descarga desde:
   # https://cloud.google.com/sdk/docs/install
   ```

2. **Node.js** instalado (para el script de refresh token)

3. **Firebase CLI** instalado y autenticado

## 🎯 Opción 1: Script Automatizado (Recomendado)

### Paso 1: Ejecutar Script de Configuración

```bash
cd /Users/denispaiva/proyectos/pinot
./scripts/configurar-gmail-api.sh
```

El script te guiará paso a paso:
- ✅ Verifica autenticación de gcloud
- ✅ Crea o selecciona proyecto en Google Cloud
- ✅ Habilita Gmail API
- ✅ Te guía para crear credenciales OAuth2
- ✅ Obtiene Refresh Token
- ✅ Configura Firebase Functions automáticamente

### Paso 2: Completar Configuración Manual (OAuth Consent Screen)

El script te indicará cuándo necesitas:
1. Configurar OAuth Consent Screen en la consola web
2. Crear credenciales OAuth2 en la consola web
3. Copiar Client ID y Client Secret

## 🎯 Opción 2: Script de Refresh Token Solo

Si ya tienes Client ID y Client Secret:

```bash
cd /Users/denispaiva/proyectos/pinot/functions
npm install googleapis
node get-refresh-token.js
```

El script te pedirá:
1. Client ID
2. Client Secret
3. Te dará una URL para autorizar
4. Código de autorización
5. Te mostrará los comandos para configurar Firebase

## 🎯 Opción 3: Usando Google Cloud CLI Directamente

### 1. Autenticarse

```bash
gcloud auth login
gcloud auth application-default login
```

### 2. Crear o Seleccionar Proyecto

```bash
# Crear nuevo proyecto
gcloud projects create pinot-email-service-$(date +%s) --name="Pinot Email Service"

# O seleccionar existente
gcloud projects list
gcloud config set project TU_PROJECT_ID
```

### 3. Habilitar Gmail API

```bash
gcloud services enable gmail.googleapis.com
```

### 4. Configurar OAuth Consent Screen (Consola Web)

```bash
# Abrir directamente en el navegador
open "https://console.cloud.google.com/apis/credentials/consent?project=$(gcloud config get-value project)"
```

Configura:
- **User Type**: Internal (Google Workspace) o External
- **App name**: `Pinot Email Service`
- **User support email**: `denis@tintum.app`
- **Scopes**: `https://www.googleapis.com/auth/gmail.send`

### 5. Crear Credenciales OAuth2 (Consola Web)

```bash
# Abrir directamente en el navegador
open "https://console.cloud.google.com/apis/credentials?project=$(gcloud config get-value project)"
```

1. Haz clic en **Create Credentials** → **OAuth client ID**
2. **Application type**: `Desktop app`
3. **Name**: `Pinot Gmail API`
4. Copia **Client ID** y **Client Secret**

### 6. Obtener Refresh Token

```bash
cd /Users/denispaiva/proyectos/pinot/functions
npm install googleapis
node get-refresh-token.js
```

Sigue las instrucciones del script.

### 7. Configurar Firebase Functions

```bash
cd /Users/denispaiva/proyectos/pinot

firebase functions:config:set gmail.client_id="TU_CLIENT_ID"
firebase functions:config:set gmail.client_secret="TU_CLIENT_SECRET"
firebase functions:config:set gmail.refresh_token="TU_REFRESH_TOKEN"
firebase functions:config:set gmail.user="hello@tintum.app"
firebase functions:config:set gmail.oauth_email="denis@tintum.app"
```

### 8. Verificar y Desplegar

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

## 🔍 Verificar Configuración

### Verificar que Gmail API está habilitada

```bash
gcloud services list --enabled | grep gmail
```

### Verificar credenciales OAuth2

```bash
gcloud auth list
gcloud config get-value project
```

### Verificar configuración de Firebase

```bash
firebase functions:config:get
```

## 🚨 Troubleshooting

### Error: "gcloud: command not found"

Instala Google Cloud SDK:
```bash
# macOS
brew install google-cloud-sdk

# O desde:
# https://cloud.google.com/sdk/docs/install
```

### Error: "Permission denied"

Asegúrate de tener permisos en el proyecto:
```bash
gcloud projects get-iam-policy $(gcloud config get-value project)
```

### Error: "API not enabled"

Habilita Gmail API:
```bash
gcloud services enable gmail.googleapis.com
```

### Error: "Invalid refresh token"

Regenera el refresh token:
```bash
cd functions
node get-refresh-token.js
```

## 📝 Notas Importantes

- ✅ El alias `hello@tintum.app` ya está configurado
- ✅ Los scripts guardan credenciales en `.env.local` (no se sube a Git)
- ✅ Las credenciales en Firebase Functions están encriptadas
- ⚠️  No compartas tus credenciales OAuth2

## 🎯 Resumen Rápido

```bash
# Opción más rápida: Script automatizado
./scripts/configurar-gmail-api.sh

# O manualmente:
gcloud auth login
gcloud services enable gmail.googleapis.com
# (Configurar OAuth en consola web)
cd functions && node get-refresh-token.js
firebase functions:config:set gmail.*="..."
firebase deploy --only functions
```

---

**Última actualización**: Diciembre 2025


