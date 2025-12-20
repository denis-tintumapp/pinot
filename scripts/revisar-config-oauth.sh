#!/bin/bash

# Script para revisar configuración OAuth2 desde Google Cloud Shell

echo "🔍 Revisando configuración OAuth2 para proyecto: pinot-tintum"
echo ""

# Verificar autenticación
echo "✅ Autenticación:"
gcloud auth list --filter="status:ACTIVE" --format="value(account)"
echo ""

# Verificar proyecto
echo "✅ Proyecto activo:"
gcloud config get-value project
echo ""

# Verificar Gmail API
echo "✅ Gmail API habilitada:"
gcloud services list --enabled --filter="name:gmail.googleapis.com" --format="value(name)" || echo "❌ No habilitada"
echo ""

# Información del proyecto
echo "✅ Información del proyecto:"
gcloud projects describe pinot-tintum --format="table(projectId,name,projectNumber)"
echo ""

# URLs importantes
echo "📋 URLs de configuración:"
echo "  - OAuth Consent Screen: https://console.cloud.google.com/apis/credentials/consent?project=pinot-tintum"
echo "  - Credentials: https://console.cloud.google.com/apis/credentials?project=pinot-tintum"
echo "  - Gmail API: https://console.cloud.google.com/apis/library/gmail.googleapis.com?project=pinot-tintum"
echo ""

# Nota sobre OAuth clients
echo "ℹ️  Nota: Los OAuth2 clients deben revisarse desde la consola web:"
echo "   https://console.cloud.google.com/apis/credentials?project=pinot-tintum"
echo ""

echo "✅ Revisión completada"
