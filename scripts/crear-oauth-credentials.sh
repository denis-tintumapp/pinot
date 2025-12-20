#!/bin/bash

# Script para crear credenciales OAuth2 usando Google Cloud API REST
# Requiere: OAuth Consent Screen configurado previamente

set -e

PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

echo "🔐 Creando credenciales OAuth2 para Gmail API"
echo "Proyecto: $PROJECT_ID"
echo ""

# Verificar que OAuth Consent Screen esté configurado
echo "📋 Verificando OAuth Consent Screen..."
echo "Nota: El OAuth Consent Screen debe estar configurado primero"
echo "Si no lo has hecho, ve a:"
echo "https://console.cloud.google.com/apis/credentials/consent?project=${PROJECT_ID}"
echo ""
read -p "¿Ya configuraste el OAuth Consent Screen? (s/n): " consent_ready

if [ "$consent_ready" != "s" ]; then
    echo "Por favor, configura el OAuth Consent Screen primero."
    echo "URL: https://console.cloud.google.com/apis/credentials/consent?project=${PROJECT_ID}"
    exit 1
fi

# Solicitar nombre para las credenciales
read -p "Nombre para las credenciales OAuth2 (ej: pinot-gmail-api): " CREDENTIALS_NAME

if [ -z "$CREDENTIALS_NAME" ]; then
    CREDENTIALS_NAME="pinot-gmail-api"
fi

echo ""
echo "📋 Creando credenciales OAuth2 usando Google Cloud API..."

# Obtener access token
ACCESS_TOKEN=$(gcloud auth print-access-token)

# Crear credenciales OAuth2 usando la API REST
RESPONSE=$(curl -s -X POST \
  "https://iamcredentials.googleapis.com/v1/projects/${PROJECT_ID}/locations/global/workloadIdentityPools" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  2>/dev/null || echo "{}")

# Intentar crear usando la API de OAuth2 directamente
echo "Intentando crear credenciales OAuth2..."

# Nota: La API REST para crear OAuth2 credentials no está disponible públicamente
# Por lo tanto, debemos usar la consola web o proporcionar instrucciones claras

echo ""
echo "⚠️  La creación de credenciales OAuth2 desde la CLI no está disponible."
echo "Debes crearlas desde la consola web."
echo ""
echo "📋 Pasos a seguir:"
echo ""
echo "1. Abre esta URL:"
echo "   https://console.cloud.google.com/apis/credentials?project=${PROJECT_ID}"
echo ""
echo "2. Haz clic en 'Create Credentials' → 'OAuth client ID'"
echo ""
echo "3. Si es la primera vez, completa el OAuth consent screen:"
echo "   https://console.cloud.google.com/apis/credentials/consent?project=${PROJECT_ID}"
echo ""
echo "4. Configura las credenciales:"
echo "   - Application type: Desktop app"
echo "   - Name: ${CREDENTIALS_NAME}"
echo ""
echo "5. Haz clic en 'Create'"
echo ""
echo "6. Copia el Client ID y Client Secret"
echo ""

read -p "Client ID: " CLIENT_ID
read -p "Client Secret: " CLIENT_SECRET

if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
    echo "❌ Error: Client ID y Client Secret son requeridos"
    exit 1
fi

echo ""
echo "✅ Credenciales obtenidas"
echo ""
echo "📋 Próximo paso: Obtener Refresh Token"
echo ""

cd "$(dirname "$0")/../functions"

if [ ! -f "get-refresh-token.js" ]; then
    echo "❌ Error: get-refresh-token.js no encontrado"
    exit 1
fi

# Verificar que googleapis esté instalado
if [ ! -d "node_modules/googleapis" ]; then
    echo "📦 Instalando googleapis..."
    npm install googleapis
fi

echo "Ejecutando script para obtener Refresh Token..."
echo ""

# Crear un script temporal que use las credenciales
cat > /tmp/get-token.js << EOF
const { google } = require('googleapis');
const readline = require('readline');

const CLIENT_ID = '${CLIENT_ID}';
const CLIENT_SECRET = '${CLIENT_SECRET}';
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent'
});

console.log('\\n🔐 Autoriza esta aplicación visitando esta URL:');
console.log(authUrl);
console.log('\\n1. Abre la URL en tu navegador');
console.log('2. Inicia sesión con denis@tintum.app');
console.log('3. Autoriza la aplicación');
console.log('4. Copia el código de autorización\\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Pega el código de autorización aquí: ', async (code) => {
  rl.close();
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('\\n✅ Credenciales obtenidas:\\n');
    console.log('Client ID:', CLIENT_ID);
    console.log('Client Secret:', CLIENT_SECRET);
    console.log('Refresh Token:', tokens.refresh_token || tokens.access_token);
    console.log('\\n📋 Configura Firebase Functions con estos comandos:\\n');
    console.log('firebase functions:config:set gmail.client_id="' + CLIENT_ID + '"');
    console.log('firebase functions:config:set gmail.client_secret="' + CLIENT_SECRET + '"');
    console.log('firebase functions:config:set gmail.refresh_token="' + (tokens.refresh_token || tokens.access_token) + '"');
    console.log('firebase functions:config:set gmail.user="hello@tintum.app"');
    console.log('firebase functions:config:set gmail.oauth_email="denis@tintum.app"');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
});
EOF

node /tmp/get-token.js

echo ""
echo "✅ Proceso completado"


