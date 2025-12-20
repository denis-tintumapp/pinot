#!/bin/bash

echo "🔥 Configurando Firebase para hello-app"
echo ""

# Verificar autenticación
echo "1️⃣ Verificando autenticación..."
if ! firebase login:list | grep -q "@"; then
    echo "⚠️ No estás autenticado. Ejecutando firebase login..."
    firebase login
else
    echo "✅ Autenticado correctamente"
fi
echo ""

# Verificar si el proyecto existe
echo "2️⃣ Verificando proyecto hello-app..."
PROJECT_EXISTS=$(firebase projects:list | grep -c "hello-app" || echo "0")

if [ "$PROJECT_EXISTS" -eq "0" ]; then
    echo "⚠️ Proyecto hello-app no encontrado"
    echo "📝 Opciones:"
    echo "   A) Crear desde Firebase Console: https://console.firebase.google.com"
    echo "   B) Crear desde CLI (si tienes permisos): firebase projects:create hello-app"
    read -p "¿Quieres crear el proyecto ahora? (s/n): " crear
    if [ "$crear" = "s" ]; then
        firebase projects:create hello-app
    else
        echo "⏭️ Saltando creación. Crea el proyecto manualmente y vuelve a ejecutar este script."
        exit 1
    fi
else
    echo "✅ Proyecto hello-app encontrado"
fi
echo ""

# Inicializar Firebase Hosting
echo "3️⃣ Inicializando Firebase Hosting..."
echo "📁 Directorio actual: $(pwd)"
echo ""
echo "⚠️ IMPORTANTE: Cuando se te pregunte:"
echo "   - Public directory: dist (si usas Vite) o public (si es estático)"
echo "   - Single-page app: Yes"
echo "   - GitHub Actions: No"
echo ""
read -p "¿Continuar con firebase init hosting? (s/n): " continuar

if [ "$continuar" = "s" ]; then
    firebase init hosting
    echo "✅ Firebase Hosting inicializado"
else
    echo "⏭️ Saltando inicialización"
fi
echo ""

# Configurar proyecto por defecto
echo "4️⃣ Configurando proyecto por defecto..."
firebase use hello-app
echo "✅ Proyecto hello-app configurado como default"
echo ""

echo "✅ Configuración completada!"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Configurar custom domain en Firebase Console"
echo "   2. Configurar DNS en Namecheap"
echo "   3. Desplegar: firebase deploy --only hosting"

