#!/usr/bin/env tsx
/**
 * Script para verificar migración post-import
 * 
 * Uso:
 *   pnpm run migrate:verify --project=pinot-dev
 */

import { getFirestore } from 'firebase-admin/firestore';
import {
  initializeFirebaseAdminForProject,
  loadMigrationData,
} from './firestore-migration-utils';

interface VerificationResult {
  success: boolean;
  collections: Record<string, {
    expected: number;
    actual: number;
    match: boolean;
  }>;
  errors: string[];
}

async function verifyCollection(
  db: ReturnType<typeof getFirestore>,
  collectionName: string,
  expectedCount: number
): Promise<{ actual: number; match: boolean }> {
  try {
    const snapshot = await db.collection(collectionName).count().get();
    const actual = snapshot.data().count;
    return {
      actual,
      match: actual === expectedCount,
    };
  } catch (error: any) {
    return {
      actual: 0,
      match: false,
    };
  }
}

async function verifyMigration(
  db: ReturnType<typeof getFirestore>,
  migrationDataPath: string
): Promise<VerificationResult> {
  console.log('🔍 Verifying migration...');
  console.log('');

  const migrationData = loadMigrationData(migrationDataPath);
  const result: VerificationResult = {
    success: true,
    collections: {},
    errors: [],
  };

  for (const [collectionName, documents] of Object.entries(migrationData.collections)) {
    const expectedCount = documents.length;
    console.log(`📦 Verifying ${collectionName} (expected: ${expectedCount})...`);

    const verification = await verifyCollection(db, collectionName, expectedCount);

    result.collections[collectionName] = {
      expected: expectedCount,
      actual: verification.actual,
      match: verification.match,
    };

    if (!verification.match) {
      result.success = false;
      const error = `${collectionName}: Expected ${expectedCount}, got ${verification.actual}`;
      result.errors.push(error);
      console.log(`   ❌ ${error}`);
    } else {
      console.log(`   ✅ Match: ${verification.actual} documents`);
    }
  }

  return result;
}

async function main() {
  const args = process.argv.slice(2);

  const projectIndex = args.findIndex(arg => arg.startsWith('--project='));
  const pathIndex = args.findIndex(arg => arg.startsWith('--path='));

  const projectId = projectIndex !== -1
    ? args[projectIndex].split('=')[1]
    : 'pinot-dev';

  const migrationDataPath = pathIndex !== -1
    ? args[pathIndex].split('=')[1]
    : './migration-data.json';

  console.log('🔍 Starting Migration Verification');
  console.log(`🎯 Project: ${projectId}`);
  console.log(`📁 Migration data: ${migrationDataPath}`);
  console.log('');

  try {
    // Inicializar Firebase Admin
    console.log('[1/2] Initializing Firebase Admin...');
    const app = initializeFirebaseAdminForProject(projectId);
    const db = getFirestore(app);
    console.log(`✅ Connected to ${projectId}`);

    // Verificar migración
    console.log('');
    console.log('[2/2] Verifying migration...');
    const result = await verifyMigration(db, migrationDataPath);

    // Imprimir reporte
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 VERIFICATION REPORT');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    for (const [collectionName, stats] of Object.entries(result.collections)) {
      const icon = stats.match ? '✅' : '❌';
      console.log(`${icon} ${collectionName}: ${stats.actual}/${stats.expected}`);
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    if (result.success) {
      console.log('✅ VERIFICATION PASSED');
    } else {
      console.log('❌ VERIFICATION FAILED');
      console.log('');
      console.log('Errors:');
      for (const error of result.errors) {
        console.log(`   - ${error}`);
      }
    }
    console.log('═══════════════════════════════════════════════════════════');

    // Guardar reporte
    const reportPath = './migration-verification-report.json';
    const fs = await import('fs');
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`💾 Verification report saved to: ${reportPath}`);

    if (!result.success) {
      process.exit(1);
    }

    process.exit(0);
  } catch (error: any) {
    console.error('');
    console.error('❌ Verification failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

