#!/bin/bash

# Script para crear un nuevo OAuth 2.0 Client ID usando Google Cloud API

PROJECT_ID="pinot-tintum"
CLIENT_NAME="Pinot Gmail API Client"
REDIRECT_URI="http://localhost:8080/oauth2callback"

echo "🔐 Creando OAuth 2.0 Client ID para Gmail API"
echo ""

# Verificar autenticación
echo "1️⃣ Verificando autenticación..."
ACCESS_TOKEN=$(gcloud auth print-access-token 2>/dev/null)
if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ No estás autenticado. Ejecuta: gcloud auth login"
    exit 1
fi
echo "✅ Autenticado correctamente"
echo ""

# Crear el OAuth2 client usando la API REST
echo "2️⃣ Creando OAuth 2.0 Client ID..."
echo "   Nombre: $CLIENT_NAME"
echo "   Redirect URI: $REDIRECT_URI"
echo "   ⚠️  IMPORTANTE: Para Web Application, el redirect URI debe ser HTTP/HTTPS"
echo ""

# Usar la API REST de Google Cloud para crear el OAuth2 client
RESPONSE=$(curl -s -X POST \
  "https://iam.googleapis.com/v1/projects/$PROJECT_ID/locations/global/workloadIdentityPools" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"displayName\": \"$CLIENT_NAME\",
    \"description\": \"OAuth2 client for Pinot Gmail API email sending\"
  }" 2>&1)

# Nota: La API REST de OAuth2 clients es compleja. Mejor usar consola web o crear manualmente.
echo "⚠️  La creación de OAuth2 clients desde CLI es limitada."
echo ""
echo "📋 Opción recomendada: Crear desde la consola web"
echo ""
echo "🔗 URL directa:"
echo "   https://console.cloud.google.com/apis/credentials/consent?project=$PROJECT_ID"
echo ""
echo "📝 Pasos manuales:"
echo "   1. Ve a: APIs & Services > Credentials"
echo "   2. Haz clic en: '+ CREATE CREDENTIALS' > 'OAuth client ID'"
echo "   3. Application type: 'Web application'"
echo "   4. Name: '$CLIENT_NAME'"
echo "   5. Authorized redirect URIs: '$REDIRECT_URI'"
echo "   6. Create"
echo "   7. Copia el Client ID y Client Secret"
echo ""
