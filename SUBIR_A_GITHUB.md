# 📤 Subir Documentación a GitHub - Repositorio "pinot"

## 📋 Pasos para Subir a GitHub

### Paso 1: Crear Repositorio en GitHub

1. Ve a [GitHub](https://github.com) e inicia sesión
2. Haz clic en el botón **"+"** (arriba a la derecha) > **"New repository"**
3. Nombre del repositorio: **`pinot`**
4. Descripción (opcional): "PWA para catas a ciegas - Pinot"
5. Selecciona **Private** o **Public** (según prefieras)
6. **NO** marques "Initialize this repository with a README" (ya tenemos archivos)
7. Haz clic en **"Create repository"**

### Paso 2: Configurar Remote en el Proyecto Local

Una vez creado el repositorio en GitHub, ejecuta:

```bash
cd /Users/denispaiva/proyectos/pinot

# Agregar el remote (reemplaza TU_USUARIO con tu usuario de GitHub)
git remote add origin https://github.com/TU_USUARIO/pinot.git

# O si prefieres SSH:
# git remote add origin git@github.com:TU_USUARIO/pinot.git
```

### Paso 3: Agregar Archivos de Documentación

```bash
# Agregar todos los archivos .md del directorio raíz
git add *.md

# Agregar .gitignore
git add .gitignore

# Ver qué se va a commitear
git status
```

### Paso 4: Hacer Commit

```bash
git commit -m "docs: Documentación inicial del proyecto Pinot"
```

### Paso 5: Subir a GitHub

```bash
# Primera vez (establecer upstream)
git push -u origin master

# O si tu rama se llama main:
# git branch -M main
# git push -u origin main
```

## 📝 Archivos de Documentación a Subir

Los siguientes archivos `.md` en el directorio raíz se subirán:

- `README.md` - Documentación principal
- `GUIA_CONFIGURAR_FIREBASE.md` - Guía de configuración
- `CONFIGURAR_FIREBASE_SIN_GITHUB.md` - Configuración sin GitHub Actions
- `SOLUCION_ERROR_GITHUB_ACTIONS.md` - Solución de errores
- Y otros archivos `.md` de documentación

## ⚠️ Archivos Excluidos

El `.gitignore` excluye:
- `node_modules/` - Dependencias
- `.firebase/` - Archivos de Firebase local
- Archivos temporales y de build

## 🔧 Comandos Rápidos

```bash
# Ver estado
git status

# Agregar todos los .md
git add *.md .gitignore

# Commit
git commit -m "docs: Documentación del proyecto Pinot"

# Push
git push -u origin master
```

## 📚 Estructura Recomendada

Si quieres organizar mejor la documentación:

```
pinot/
├── README.md
├── docs/
│   ├── configuracion/
│   ├── desarrollo/
│   └── despliegue/
└── ...
```

---

**Última actualización**: Diciembre 2025
