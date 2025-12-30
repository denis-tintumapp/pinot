#!/usr/bin/env tsx
/**
 * Script para validar datos de migración
 * 
 * Uso:
 *   pnpm run migrate:validate --source=json --path=./migration-data.json
 *   pnpm run migrate:validate --source=emulator
 */

import { existsSync } from 'fs';
import {
  loadMigrationData,
  deserializeFirestoreData,
  validateDocumentStructure,
  type MigrationData,
} from './firestore-migration-utils';

// Esquemas esperados por colección (campos requeridos)
const COLLECTION_SCHEMAS: Record<string, string[]> = {
  anfitriones: ['userId', 'tipo'],
  eventos: ['anfitrionId', 'nombre', 'pin'],
  participantes: ['eventoId', 'nombre', 'tipo'],
  etiquetas: ['eventoId', 'nombre'],
  selecciones: ['eventoId', 'participanteId'],
  membresias: ['userId'],
  usuarios: [],
  plantillasParticipantes: [],
  plantillasEtiquetas: [],
  fcmTokens: ['token'],
  admin_config: [],
  admin_logs: [],
  registros_pendientes: ['email', 'verificationToken'],
  oauth_states: ['expiresAt'],
};

interface ValidationResult {
  valid: boolean;
  errors: Array<{
    collection: string;
    documentId: string;
    error: string;
  }>;
  warnings: Array<{
    collection: string;
    documentId: string;
    warning: string;
  }>;
  statistics: {
    totalCollections: number;
    totalDocuments: number;
    validDocuments: number;
    invalidDocuments: number;
  };
}

function validateMigrationData(data: MigrationData): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    statistics: {
      totalCollections: 0,
      totalDocuments: 0,
      validDocuments: 0,
      invalidDocuments: 0,
    },
  };

  console.log('🔍 Validating migration data...');
  console.log('');

  // Validar metadata
  if (!data.metadata) {
    result.errors.push({
      collection: 'metadata',
      documentId: 'root',
      error: 'Missing metadata',
    });
    result.valid = false;
  }

  if (!data.collections) {
    result.errors.push({
      collection: 'collections',
      documentId: 'root',
      error: 'Missing collections',
    });
    result.valid = false;
    return result;
  }

  // Validar cada colección
  for (const [collectionName, documents] of Object.entries(data.collections)) {
    result.statistics.totalCollections++;
    console.log(`📦 Validating collection: ${collectionName} (${documents.length} documents)`);

    const expectedFields = COLLECTION_SCHEMAS[collectionName];

    for (const document of documents) {
      result.statistics.totalDocuments++;

      // Usar documento directamente (la deserialización se hará durante importación)
      const deserialized = document;

      // Validar estructura
      const validation = validateDocumentStructure(collectionName, deserialized, expectedFields);
      
      if (!validation.valid) {
        result.valid = false;
        result.statistics.invalidDocuments++;
        for (const error of validation.errors) {
          result.errors.push({
            collection: collectionName,
            documentId: deserialized.id || 'unknown',
            error,
          });
        }
      } else {
        result.statistics.validDocuments++;
      }

      // Validaciones específicas por colección
      if (collectionName === 'eventos') {
        if (!deserialized.pin || !/^\d{5}$/.test(deserialized.pin)) {
          result.warnings.push({
            collection: collectionName,
            documentId: deserialized.id || 'unknown',
            warning: 'PIN format invalid (should be 5 digits)',
          });
        }
      }

      if (collectionName === 'participantes') {
        if (deserialized.tipo === 'permanente' && !deserialized.userId) {
          result.errors.push({
            collection: collectionName,
            documentId: deserialized.id || 'unknown',
            error: 'Permanent participant missing userId',
          });
          result.valid = false;
          result.statistics.invalidDocuments++;
        }
      }
    }
  }

  return result;
}

function printValidationReport(result: ValidationResult): void {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 VALIDATION REPORT');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  console.log('📈 Statistics:');
  console.log(`   Total collections: ${result.statistics.totalCollections}`);
  console.log(`   Total documents: ${result.statistics.totalDocuments}`);
  console.log(`   ✅ Valid documents: ${result.statistics.validDocuments}`);
  console.log(`   ❌ Invalid documents: ${result.statistics.invalidDocuments}`);
  console.log('');

  if (result.warnings.length > 0) {
    console.log(`⚠️  Warnings: ${result.warnings.length}`);
    for (const warning of result.warnings.slice(0, 10)) {
      console.log(`   - ${warning.collection}/${warning.documentId}: ${warning.warning}`);
    }
    if (result.warnings.length > 10) {
      console.log(`   ... and ${result.warnings.length - 10} more warnings`);
    }
    console.log('');
  }

  if (result.errors.length > 0) {
    console.log(`❌ Errors: ${result.errors.length}`);
    for (const error of result.errors.slice(0, 20)) {
      console.log(`   - ${error.collection}/${error.documentId}: ${error.error}`);
    }
    if (result.errors.length > 20) {
      console.log(`   ... and ${result.errors.length - 20} more errors`);
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════');
  if (result.valid) {
    console.log('✅ VALIDATION PASSED');
  } else {
    console.log('❌ VALIDATION FAILED');
  }
  console.log('═══════════════════════════════════════════════════════════');
}

async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  const sourceIndex = args.findIndex(arg => arg.startsWith('--source='));
  const pathIndex = args.findIndex(arg => arg.startsWith('--path='));
  
  const source = sourceIndex !== -1
    ? args[sourceIndex].split('=')[1]
    : 'json';
  
  const jsonPath = pathIndex !== -1
    ? args[pathIndex].split('=')[1]
    : './migration-data.json';

  console.log('🔍 Starting Migration Data Validation');
  console.log(`📂 Source: ${source}`);
  console.log(`📁 Path: ${jsonPath}`);
  console.log('');

  try {
    let migrationData: MigrationData;

    if (source === 'emulator') {
      console.log('⚠️  Emulator validation not yet implemented');
      console.log('   Please export data first using: pnpm run migrate:export');
      process.exit(1);
    } else {
      // Cargar datos desde JSON
      if (!existsSync(jsonPath)) {
        console.error(`❌ Migration data file not found: ${jsonPath}`);
        process.exit(1);
      }

      console.log('[1/2] Loading migration data...');
      migrationData = loadMigrationData(jsonPath);
      console.log(`✅ Loaded ${migrationData.metadata.totalDocuments} documents from ${migrationData.metadata.collections.length} collections`);
    }

    // Validar datos
    console.log('');
    console.log('[2/2] Validating data...');
    const result = validateMigrationData(migrationData);

    // Imprimir reporte
    printValidationReport(result);

    // Guardar reporte
    const reportPath = './migration-validation-report.json';
    const fs = await import('fs');
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`💾 Validation report saved to: ${reportPath}`);

    // Exit code basado en resultado
    if (!result.valid) {
      console.log('');
      console.error('❌ Validation failed. Please fix errors before importing.');
      process.exit(1);
    }

    console.log('');
    console.log('✅ Validation passed! Data is ready for migration.');
    process.exit(0);
  } catch (error: any) {
    console.error('');
    console.error('❌ Validation failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

