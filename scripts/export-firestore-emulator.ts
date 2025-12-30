#!/usr/bin/env tsx
/**
 * Script para exportar datos desde Firestore Emulator local
 * 
 * Uso:
 *   pnpm run migrate:export --emulator
 *   pnpm run migrate:export --emulator --output ./migration-data.json
 */

import { getFirestore } from 'firebase-admin/firestore';
import {
  initializeFirebaseAdminForEmulator,
  exportAllCollections,
  serializeFirestoreData,
  saveMigrationData,
  type MigrationData,
} from './firestore-migration-utils';

// Colecciones principales a migrar
const COLLECTIONS_TO_MIGRATE = [
  'anfitriones',
  'eventos',
  'participantes',
  'etiquetas',
  'selecciones',
  'membresias',
  'usuarios',
  'plantillasParticipantes',
  'plantillasEtiquetas',
  'fcmTokens',
  'admin_config',
  'admin_logs',
  'registros_pendientes',
  'oauth_states',
];

async function main() {
  const args = process.argv.slice(2);
  const outputIndex = args.indexOf('--output');
  const outputPath = outputIndex !== -1 && args[outputIndex + 1]
    ? args[outputIndex + 1]
    : './migration-data.json';

  console.log('🚀 Starting Firestore Emulator Export');
  console.log(`📁 Output path: ${outputPath}`);
  console.log('');

  try {
    // Inicializar Firebase Admin para emulador
    console.log('[1/4] Initializing Firebase Admin for emulator...');
    const app = initializeFirebaseAdminForEmulator();
    
    // Para Admin SDK, configurar variable de entorno para emulador
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    
    const db = getFirestore(app);
    console.log('✅ Connected to Firestore emulator (localhost:8080)');

    // Exportar todas las colecciones
    console.log('');
    console.log('[2/4] Exporting collections...');
    const collections = await exportAllCollections(db, COLLECTIONS_TO_MIGRATE);

    // Serializar datos
    console.log('');
    console.log('[3/4] Serializing data...');
    const serializedCollections: Record<string, any[]> = {};
    let totalDocuments = 0;

    for (const [collectionName, documents] of Object.entries(collections)) {
      serializedCollections[collectionName] = documents.map(doc => serializeFirestoreData(doc));
      totalDocuments += documents.length;
    }

    // Crear objeto de migración
    const migrationData: MigrationData = {
      collections: serializedCollections,
      metadata: {
        exportedAt: new Date().toISOString(),
        source: 'emulator',
        checksum: '', // Se calculará al guardar
        collections: Object.keys(serializedCollections),
        totalDocuments,
      },
    };

    // Guardar datos
    console.log('');
    console.log('[4/4] Saving migration data...');
    saveMigrationData(migrationData, outputPath);

    console.log('');
    console.log('✅ Export completed successfully!');
    console.log(`📊 Total collections: ${migrationData.metadata.collections.length}`);
    console.log(`📄 Total documents: ${totalDocuments}`);
    console.log(`💾 Saved to: ${outputPath}`);

    process.exit(0);
  } catch (error: any) {
    console.error('');
    console.error('❌ Export failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

