#!/usr/bin/env tsx
/**
 * Script para importar datos a pinot-dev
 * 
 * Uso:
 *   pnpm run migrate:import --project=pinot-dev --source=json --path=./migration-data.json
 *   pnpm run migrate:import --project=pinot-dev --source=json --path=./migration-data.json --collections=eventos,participantes --strategy=overwrite
 */

import { getFirestore, WriteBatch } from 'firebase-admin/firestore';
import {
  initializeFirebaseAdminForProject,
  loadMigrationData,
  deserializeFirestoreData,
  createMigrationReport,
  saveMigrationReport,
  type MigrationData,
  type MigrationReport,
} from './firestore-migration-utils';

type ConflictStrategy = 'overwrite' | 'merge' | 'skip';

interface ImportOptions {
  projectId: string;
  source: 'json' | 'emulator';
  jsonPath?: string;
  collections?: string[];
  strategy: ConflictStrategy;
  batchSize?: number;
}

async function importCollection(
  db: ReturnType<typeof getFirestore>,
  collectionName: string,
  documents: any[],
  strategy: ConflictStrategy,
  batchSize: number = 500
): Promise<{ imported: number; errors: number; skipped: number; errorsList: Array<{ documentId: string; error: string }> }> {
  const result = {
    imported: 0,
    errors: 0,
    skipped: 0,
    errorsList: [] as Array<{ documentId: string; error: string }>,
  };

  console.log(`📦 Importing collection: ${collectionName} (${documents.length} documents)`);

  // Procesar en lotes
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = db.batch();
    const batchDocs = documents.slice(i, i + batchSize);
    let batchCount = 0;

    for (const docData of batchDocs) {
      try {
        const { id, ...data } = docData;
        const docRef = db.collection(collectionName).doc(id);

        // Deserializar datos de Firestore
        const deserializedData = deserializeFirestoreData(data);

        // Verificar si documento existe
        const exists = await docRef.get().then(snap => snap.exists);

        if (exists && strategy === 'skip') {
          result.skipped++;
          continue;
        }

        if (exists && strategy === 'merge') {
          const existing = await docRef.get();
          const existingData = existing.data() || {};
          const mergedData = { ...existingData, ...deserializedData };
          batch.set(docRef, mergedData, { merge: true });
        } else {
          batch.set(docRef, deserializedData);
        }

        batchCount++;
      } catch (error: any) {
        result.errors++;
        result.errorsList.push({
          documentId: docData.id || 'unknown',
          error: error.message || 'Unknown error',
        });
        console.error(`   ❌ Error importing document ${docData.id}:`, error.message);
      }
    }

    // Ejecutar batch
    if (batchCount > 0) {
      try {
        await batch.commit();
        result.imported += batchCount;
        console.log(`   ✅ Imported batch ${Math.floor(i / batchSize) + 1} (${batchCount} documents)`);
      } catch (error: any) {
        result.errors += batchCount;
        console.error(`   ❌ Error committing batch:`, error.message);
        for (const docData of batchDocs) {
          result.errorsList.push({
            documentId: docData.id || 'unknown',
            error: `Batch commit failed: ${error.message}`,
          });
        }
      }
    }
  }

  console.log(`   📊 Collection ${collectionName}: ${result.imported} imported, ${result.errors} errors, ${result.skipped} skipped`);
  return result;
}

async function importMigrationData(
  db: ReturnType<typeof getFirestore>,
  migrationData: MigrationData,
  options: ImportOptions
): Promise<MigrationReport> {
  const startTime = Date.now();
  const collectionsToImport = options.collections && options.collections.length > 0
    ? options.collections
    : Object.keys(migrationData.collections);

  console.log(`🚀 Starting import to ${options.projectId}`);
  console.log(`📦 Collections to import: ${collectionsToImport.join(', ')}`);
  console.log(`🔀 Conflict strategy: ${options.strategy}`);
  console.log('');

  const results: Record<string, { imported: number; errors: number; skipped: number }> = {};
  const errors: Array<{ collection: string; documentId: string; error: string }> = [];

  for (const collectionName of collectionsToImport) {
    const documents = migrationData.collections[collectionName] || [];
    
    if (documents.length === 0) {
      console.log(`⏭️  Skipping empty collection: ${collectionName}`);
      results[collectionName] = { imported: 0, errors: 0, skipped: 0 };
      continue;
    }

    const result = await importCollection(
      db,
      collectionName,
      documents,
      options.strategy,
      options.batchSize || 500
    );

    results[collectionName] = {
      imported: result.imported,
      errors: result.errors,
      skipped: result.skipped,
    };

    // Agregar errores a la lista global
    for (const error of result.errorsList) {
      errors.push({
        collection: collectionName,
        documentId: error.documentId,
        error: error.error,
      });
    }
  }

  return createMigrationReport(migrationData.collections, results, errors, startTime);
}

async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  const projectIndex = args.findIndex(arg => arg.startsWith('--project='));
  const sourceIndex = args.findIndex(arg => arg.startsWith('--source='));
  const pathIndex = args.findIndex(arg => arg.startsWith('--path='));
  const collectionsIndex = args.findIndex(arg => arg.startsWith('--collections='));
  const strategyIndex = args.findIndex(arg => arg.startsWith('--strategy='));

  const projectId = projectIndex !== -1
    ? args[projectIndex].split('=')[1]
    : 'pinot-dev';

  const source = sourceIndex !== -1
    ? args[sourceIndex].split('=')[1] as 'json' | 'emulator'
    : 'json';

  const jsonPath = pathIndex !== -1
    ? args[pathIndex].split('=')[1]
    : './migration-data.json';

  const collections = collectionsIndex !== -1
    ? args[collectionsIndex].split('=')[1].split(',')
    : undefined;

  const strategy = strategyIndex !== -1
    ? args[strategyIndex].split('=')[1] as ConflictStrategy
    : 'skip';

  console.log('🚀 Starting Migration Import');
  console.log(`🎯 Project: ${projectId}`);
  console.log(`📂 Source: ${source}`);
  console.log(`📁 Path: ${jsonPath}`);
  console.log(`🔀 Strategy: ${strategy}`);
  if (collections) {
    console.log(`📦 Collections: ${collections.join(', ')}`);
  }
  console.log('');

  try {
    // Inicializar Firebase Admin
    console.log('[1/4] Initializing Firebase Admin...');
    const app = initializeFirebaseAdminForProject(projectId);
    const db = getFirestore(app);
    console.log(`✅ Connected to ${projectId}`);

    // Cargar datos de migración
    console.log('');
    console.log('[2/4] Loading migration data...');
    let migrationData: MigrationData;

    if (source === 'emulator') {
      console.error('❌ Emulator import not supported. Please export to JSON first.');
      process.exit(1);
    } else {
      migrationData = loadMigrationData(jsonPath);
      console.log(`✅ Loaded ${migrationData.metadata.totalDocuments} documents from ${migrationData.metadata.collections.length} collections`);
    }

    // Importar datos
    console.log('');
    console.log('[3/4] Importing data...');
    const report = await importMigrationData(db, migrationData, {
      projectId,
      source,
      jsonPath,
      collections,
      strategy,
    });

    // Guardar reporte
    console.log('');
    console.log('[4/4] Generating report...');
    saveMigrationReport(report, './migration-report.json');

    // Imprimir resumen
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 MIGRATION REPORT');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log(`⏱️  Duration: ${(report.duration / 1000).toFixed(2)}s`);
    console.log('');

    let totalImported = 0;
    let totalErrors = 0;
    let totalSkipped = 0;

    for (const [collectionName, stats] of Object.entries(report.collections)) {
      console.log(`📦 ${collectionName}:`);
      console.log(`   Exported: ${stats.exported}`);
      console.log(`   ✅ Imported: ${stats.imported}`);
      console.log(`   ⏭️  Skipped: ${stats.skipped}`);
      console.log(`   ❌ Errors: ${stats.errors}`);
      console.log('');
      totalImported += stats.imported;
      totalErrors += stats.errors;
      totalSkipped += stats.skipped;
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📊 Total: ${totalImported} imported, ${totalSkipped} skipped, ${totalErrors} errors`);
    console.log('═══════════════════════════════════════════════════════════');

    if (report.success) {
      console.log('');
      console.log('✅ Migration completed successfully!');
      process.exit(0);
    } else {
      console.log('');
      console.error('⚠️  Migration completed with errors. Check report for details.');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('');
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

