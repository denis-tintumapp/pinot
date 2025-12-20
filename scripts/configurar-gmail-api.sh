#!/bin/bash

# Script para configurar Gmail API usando Google Cloud CLI
# Requiere: gcloud CLI instalado y autenticado

set -e

echo "🔐 Configuración de Gmail API con Google Cloud CLI"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que gcloud está instalado
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Error: gcloud CLI no está instalado${NC}"
    echo "Instala desde: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Verificar autenticación
echo -e "${YELLOW}📋 Verificando autenticación...${NC}"
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo -e "${YELLOW}⚠️  No estás autenticado. Iniciando autenticación...${NC}"
    gcloud auth login
fi

ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1)
echo -e "${GREEN}✅ Autenticado como: ${ACTIVE_ACCOUNT}${NC}"
echo ""

# Solicitar o usar proyecto existente
echo -e "${YELLOW}📋 Configuración del proyecto${NC}"
read -p "¿Quieres crear un nuevo proyecto? (s/n): " crear_proyecto

if [ "$crear_proyecto" = "s" ]; then
    read -p "Nombre del proyecto (ej: pinot-email-service): " PROJECT_NAME
    PROJECT_ID="${PROJECT_NAME}-$(date +%s)"
    
    echo -e "${BLUE}Creando proyecto: ${PROJECT_ID}${NC}"
    gcloud projects create "$PROJECT_ID" --name="$PROJECT_NAME"
    gcloud config set project "$PROJECT_ID"
    
    echo -e "${BLUE}Habilitando facturación (si es necesario)...${NC}"
    echo "Nota: Gmail API es gratuito hasta 2,000 emails/día"
else
    echo -e "${BLUE}Proyectos disponibles:${NC}"
    gcloud projects list --format="table(projectId,name)"
    read -p "Ingresa el Project ID: " PROJECT_ID
    gcloud config set project "$PROJECT_ID"
fi

echo -e "${GREEN}✅ Proyecto configurado: ${PROJECT_ID}${NC}"
echo ""

# Habilitar Gmail API
echo -e "${YELLOW}📋 Habilitando Gmail API...${NC}"
gcloud services enable gmail.googleapis.com
echo -e "${GREEN}✅ Gmail API habilitada${NC}"
echo ""

# Configurar OAuth Consent Screen
echo -e "${YELLOW}📋 Configuración de OAuth Consent Screen${NC}"
echo "Nota: Esto debe hacerse manualmente en la consola web"
echo ""
echo "1. Ve a: https://console.cloud.google.com/apis/credentials/consent?project=${PROJECT_ID}"
echo "2. Configura:"
echo "   - User Type: Internal (si tienes Google Workspace) o External"
echo "   - App name: Pinot Email Service"
echo "   - User support email: denis@tintum.app"
echo "   - Scopes: https://www.googleapis.com/auth/gmail.send"
echo ""
read -p "Presiona Enter cuando hayas completado la configuración del OAuth Consent Screen..."

# Crear credenciales OAuth2
echo -e "${YELLOW}📋 Creando credenciales OAuth2...${NC}"
read -p "Nombre para las credenciales (ej: pinot-gmail-api): " CREDENTIALS_NAME

# Crear credenciales OAuth2 (requiere configuración manual)
echo -e "${BLUE}Creando credenciales OAuth2...${NC}"
echo ""
echo "⚠️  Nota: La creación de credenciales OAuth2 debe hacerse desde la consola web:"
echo "   https://console.cloud.google.com/apis/credentials?project=${PROJECT_ID}"
echo ""
echo "Pasos:"
echo "1. Haz clic en 'Create Credentials' → 'OAuth client ID'"
echo "2. Application type: Desktop app"
echo "3. Name: ${CREDENTIALS_NAME}"
echo "4. Haz clic en 'Create'"
echo "5. Copia el Client ID y Client Secret"
echo ""

read -p "Client ID: " CLIENT_ID
read -p "Client Secret: " CLIENT_SECRET

if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
    echo -e "${RED}❌ Error: Client ID y Client Secret son requeridos${NC}"
    exit 1
fi

# Obtener Refresh Token usando el script de Node.js
echo -e "${YELLOW}📋 Obteniendo Refresh Token...${NC}"
echo "Ejecutando script de Node.js..."
echo ""

cd "$(dirname "$0")/../functions"

if [ ! -f "get-refresh-token.js" ]; then
    echo -e "${RED}❌ Error: get-refresh-token.js no encontrado${NC}"
    exit 1
fi

# Ejecutar script de Node.js
node get-refresh-token.js << EOF
${CLIENT_ID}
${CLIENT_SECRET}
EOF

# Leer refresh token del output o solicitar manualmente
echo ""
read -p "Refresh Token: " REFRESH_TOKEN

if [ -z "$REFRESH_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  No se ingresó Refresh Token. Puedes obtenerlo ejecutando:${NC}"
    echo "   cd functions && node get-refresh-token.js"
    exit 0
fi

# Configurar Firebase Functions
echo ""
echo -e "${YELLOW}📋 Configurando Firebase Functions...${NC}"
cd "$(dirname "$0")/.."

# Verificar que estamos en el directorio correcto
if [ ! -f "firebase.json" ]; then
    echo -e "${RED}❌ Error: firebase.json no encontrado. Asegúrate de estar en el directorio raíz del proyecto${NC}"
    exit 1
fi

echo -e "${BLUE}Configurando variables de Firebase Functions...${NC}"
firebase functions:config:set gmail.client_id="${CLIENT_ID}"
firebase functions:config:set gmail.client_secret="${CLIENT_SECRET}"
firebase functions:config:set gmail.refresh_token="${REFRESH_TOKEN}"
firebase functions:config:set gmail.user="hello@tintum.app"
firebase functions:config:set gmail.oauth_email="denis@tintum.app"

echo ""
echo -e "${GREEN}✅ Configuración completada!${NC}"
echo ""
echo -e "${BLUE}Verificando configuración:${NC}"
firebase functions:config:get

echo ""
echo -e "${GREEN}📝 Próximos pasos:${NC}"
echo "1. Instalar dependencias: cd functions && npm install"
echo "2. Desplegar: firebase deploy --only functions"
echo "3. Probar: Completa el formulario en https://pinot.tintum.app/auth/signup-host-e.html"
echo ""


