#!/usr/bin/env node

/**
 * Script de build para Pinot PWA
 * Compila CSS con Tailwind y JS con Vite, luego copia assets
 */

import { execSync } from 'child_process';
import { copySync, ensureDirSync } from 'fs-extra';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { resolve, join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Iniciando build de Pinot PWA...\n');

// Definir rutas primero
const distPath = resolve(__dirname, '..', 'dist');
const webPath = resolve(__dirname, '..', 'web');

// 1. Compilar CSS
console.log('📦 Compilando CSS con Tailwind...');
try {
  execSync('pnpm run build:css', { stdio: 'inherit' });
  console.log('✅ CSS compilado\n');
} catch (error: any) {
  console.error('❌ Error al compilar CSS:', error.message);
  process.exit(1);
}

// 2. Build con Vite
console.log('📦 Compilando JavaScript con Vite...');
console.log('   Modo: Producción (source maps: hidden)\n');
try {
  // Asegurar que NODE_ENV esté configurado para producción
  const env = { ...process.env, NODE_ENV: 'production' };
  // Vite compilará los módulos JavaScript necesarios
  execSync('vite build', { stdio: 'inherit', env, cwd: resolve(__dirname, '..') });
  console.log('✅ JavaScript compilado\n');
} catch (error: any) {
  console.error('❌ Error al compilar con Vite:', error.message);
  process.exit(1);
}

// 2.5. Compilar TypeScript a JavaScript (para archivos legacy que se usan directamente)
console.log('📦 Compilando TypeScript a JavaScript...');
try {
  ensureDirSync(join(distPath, 'js', 'auth'));
  
  const tsFiles = [
    { src: join(webPath, 'js', 'auth', 'auth.ts'), dest: join(distPath, 'js', 'auth', 'auth.js') },
    { src: join(webPath, 'js', 'auth', 'auth-guard.ts'), dest: join(distPath, 'js', 'auth', 'auth-guard.js') },
    { src: join(webPath, 'js', 'auth', 'verify.ts'), dest: join(distPath, 'js', 'auth', 'verify.js') },
    { src: join(webPath, 'js', 'constantes.ts'), dest: join(distPath, 'js', 'constantes.js') }
  ];
  
  let compiled = 0;
  tsFiles.forEach(({ src, dest }) => {
    if (existsSync(src)) {
      try {
        // Compilar archivo individual con tsc
        execSync(`tsc ${src} --target ES2022 --module ESNext --moduleResolution bundler --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck --outDir ${dirname(dest)} --rootDir ${dirname(src)}`, { 
          stdio: 'pipe',
          cwd: resolve(__dirname, '..')
        });
        
        // Verificar si se generó el archivo compilado
        const expectedPath = join(dirname(dest), basename(src, '.ts') + '.js');
        if (existsSync(expectedPath)) {
          // Mover al destino correcto si es necesario
          if (expectedPath !== dest) {
            renameSync(expectedPath, dest);
          }
          compiled++;
        }
      } catch (error) {
        // Si falla la compilación, intentar copiar el archivo tal cual (para desarrollo)
        console.warn(`  ⚠️  Error al compilar ${basename(src)}, copiando tal cual`);
        copySync(src, dest.replace('.js', '.ts'), { overwrite: true });
      }
    }
  });
  
  if (compiled > 0) {
    console.log(`✅ ${compiled} archivo(s) TypeScript compilado(s)\n`);
  } else {
    console.warn('⚠️  No se compilaron archivos TypeScript, se copiarán tal cual\n');
  }
} catch (error: any) {
  console.warn('⚠️  Error al compilar TypeScript (continuando con copia directa):', error.message);
  console.log('   Los archivos .ts se copiarán tal cual\n');
}

// 3. Copiar assets estáticos
console.log('📁 Copiando assets estáticos...');

const assetsToCopy = [
  { from: join(webPath, 'images'), to: join(distPath, 'images') },
  { from: join(webPath, 'api'), to: join(distPath, 'api') },
  { from: join(webPath, 'css', 'fonts.css'), to: join(distPath, 'css', 'fonts.css') },
  { from: join(webPath, 'css', 'styles.css'), to: join(distPath, 'css', 'styles.css') },
  { from: join(webPath, 'manifest.json'), to: join(distPath, 'manifest.json') },
  { from: join(webPath, 'sw.js'), to: join(distPath, 'sw.js') },
];

assetsToCopy.forEach(({ from, to }) => {
  if (existsSync(from)) {
    try {
      const stats = statSync(from);
      if (stats.isDirectory()) {
        copySync(from, to, { overwrite: true });
      } else {
        ensureDirSync(dirname(to));
        copySync(from, to, { overwrite: true });
      }
    } catch (error: any) {
      console.warn(`  ⚠️  Error al copiar ${from}:`, error.message);
    }
  }
});

// 4. Copiar archivos HTML legacy (si existen)
console.log('📄 Copiando archivos HTML legacy...');

const htmlFilesToCopy = [
  'auth/login.html',
  'auth/signup.html',
  'auth/verify.html',
  'auth/pin.html',
  'event/events-result.html',
  'explore.html',
  'favs.html',
  'hero.html',
  'profile.html',
  'ui/admin.html',
  'ui/profile.html',
];

htmlFilesToCopy.forEach((htmlFile) => {
  const src = join(webPath, htmlFile);
  const dest = join(distPath, htmlFile);
  
  if (existsSync(src)) {
    try {
      ensureDirSync(dirname(dest));
      copySync(src, dest, { overwrite: true });
      console.log(`  ✓ Copiado: ${htmlFile}`);
    } catch (error: any) {
      console.warn(`  ⚠️  Error al copiar ${htmlFile}:`, error.message);
    }
  }
});

// 5. Copiar directorios JS legacy (para compatibilidad)
console.log('📦 Copiando directorios JS legacy...');

const jsDirsToCopy = [
  'js/hero',
  'js/explore',
  'js/profile',
  'js/favs',
  'js/core',
  'js/ui',
];

jsDirsToCopy.forEach((jsDir) => {
  const src = join(webPath, jsDir);
  const dest = join(distPath, jsDir);
  
  if (existsSync(src)) {
    try {
      copySync(src, dest, { overwrite: true });
      console.log(`  ✓ Copiado: ${jsDir}`);
    } catch (error: any) {
      console.warn(`  ⚠️  Error al copiar ${jsDir}:`, error.message);
    }
  }
});

// 6. Copiar hero.html como index.html para página por defecto
console.log('🔄 Copiando hero.html como index.html para página por defecto...');
const heroHtmlSrc = join(webPath, 'hero.html');
const indexHtmlDest = join(distPath, 'index.html');
if (existsSync(heroHtmlSrc)) {
  try {
    copySync(heroHtmlSrc, indexHtmlDest, { overwrite: true });
    console.log('✅ hero.html copiado como index.html (página por defecto)');
  } catch (error: any) {
    console.warn('⚠️  Error al copiar hero.html:', error.message);
  }
}

// 7. Verificar source maps y actualizar referencias en HTML
console.log('\n📊 Verificando source maps...');
const jsDistDir = join(distPath, 'js');
if (existsSync(jsDistDir)) {
  const mapFiles = readdirSync(jsDistDir).filter(f => f.endsWith('.map'));
  if (mapFiles.length > 0) {
    console.log(`   ⚠️  ${mapFiles.length} source map(s) generados (hidden - no expuestos en producción)`);
  }
}

// 8. Actualizar referencias en HTML a archivos compilados
console.log('🔧 Actualizando referencias en HTML a archivos compilados...');

const updateHtmlReferences = (htmlFile: string) => {
  const htmlPath = join(distPath, htmlFile);
  if (!existsSync(htmlPath)) return;
  
  let htmlContent = readFileSync(htmlPath, 'utf-8');
  let updated = false;
  
  // Buscar referencias a archivos JS y actualizarlas
  const jsRefs = htmlContent.match(/<script[^>]+src=["']([^"']+\.js)["']/g) || [];
  
  jsRefs.forEach((scriptTag) => {
    const srcMatch = scriptTag.match(/src=["']([^"']+)["']/);
    if (!srcMatch) return;
    
    const originalSrc = srcMatch[1];
    // Buscar el archivo compilado correspondiente
    const originalName = basename(originalSrc, '.js');
    const jsFiles = readdirSync(jsDistDir).filter(f => 
      f.startsWith(originalName + '-') && f.endsWith('.js') && !f.endsWith('.map')
    );
    
    if (jsFiles.length > 0) {
      const newSrc = '/js/' + jsFiles[0];
      htmlContent = htmlContent.replace(originalSrc, newSrc);
      updated = true;
    }
  });
  
  if (updated) {
    writeFileSync(htmlPath, htmlContent, 'utf-8');
    console.log(`  ✓ Actualizado: ${htmlFile}`);
    return true;
  }
  
  return false;
};

// Actualizar HTMLs de auth
['auth/login.html', 'auth/signup.html', 'auth/verify.html', 'auth/pin.html'].forEach(updateHtmlReferences);
updateHtmlReferences('event/events-result.html');

// 9. Limpiar archivos duplicados sin hash
console.log('\n🧹 Eliminando archivos duplicados sin hash...');

const jsFiles = readdirSync(jsDistDir).filter(f => f.endsWith('.js') && !f.endsWith('.map'));

const removeDuplicates = () => {
  const hashedFiles = new Map<string, string>();
  const unhashedFiles: string[] = [];
  
  jsFiles.forEach(file => {
    const baseName = file.replace(/-[a-f0-9]+\.js$/, '.js');
    if (file.includes('-') && file.match(/-[a-f0-9]{8,}\.js$/)) {
      // Archivo con hash
      hashedFiles.set(baseName, file);
    } else if (!file.includes('-')) {
      // Archivo sin hash
      unhashedFiles.push(file);
    }
  });
  
  let removed = 0;
  unhashedFiles.forEach(file => {
    if (hashedFiles.has(file)) {
      try {
        unlinkSync(join(jsDistDir, file));
        removed++;
        console.log(`  ✓ Eliminado: ${file} (existe versión compilada: ${hashedFiles.get(file)})`);
      } catch (error: any) {
        console.warn(`  ⚠️  Error al eliminar ${file}:`, error.message);
      }
    }
  });
  
  return removed;
};

const removedCount = removeDuplicates();
if (removedCount > 0) {
  console.log(`✅ ${removedCount} archivo(s) duplicado(s) eliminado(s)`);
}

console.log('\n✨ Build completado exitosamente!');
console.log(`📂 Archivos compilados en: ${distPath}\n`);
console.log('💡 Tip: Para desarrollo con source maps, usa: pnpm run build:dev\n');

