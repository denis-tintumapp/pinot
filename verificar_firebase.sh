#!/bin/bash

echo "🔍 Verificando Firebase CLI..."
echo ""

echo "📋 Versión de Firebase CLI:"
firebase --version
echo ""

echo "🔐 Estado de autenticación:"
firebase login:list
echo ""

echo "📦 Proyectos disponibles:"
firebase projects:list
echo ""

echo "✅ Verificación completada"

