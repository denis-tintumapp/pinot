/**
 * Utilidades para migración de datos de Firestore
 * Funciones helper para exportar, importar y validar datos
 */

import { getFirestore, Timestamp, DocumentData } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';

export interface MigrationData {
  collections: Record<string, DocumentData[]>;
  metadata: {
    exportedAt: string;
    source: 'emulator' | 'json';
    checksum: string;
    collections: string[];
    totalDocuments: number;
  };
}

export interface MigrationReport {
  success: boolean;
  collections: Record<string, {
    exported: number;
    imported: number;
    errors: number;
    skipped: number;
  }>;
  errors: Array<{
    collection: string;
    documentId: string;
    error: string;
  }>;
  duration: number;
  timestamp: string;
}

/**
 * Inicializar Firebase Admin para emulador local
 */
export function initializeFirebaseAdminForEmulator(): App {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0]!;
  }

  // Para emuladores, no necesitamos credenciales
  return initializeApp({
    projectId: 'pinot-test',
  }, 'emulator');
}

/**
 * Inicializar Firebase Admin para proyecto real
 */
export function initializeFirebaseAdminForProject(projectId: string, serviceAccountPath?: string): App {
  // Buscar app existente con el mismo projectId
  const existingApps = getApps();
  const existingApp = existingApps.find(app => app.options.projectId === projectId);
  if (existingApp) {
    return existingApp;
  }

  const config: any = {
    projectId,
  };

  // Si hay serviceAccountPath, usarlo; si no, usar Application Default Credentials
  if (serviceAccountPath && existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
    config.credential = cert(serviceAccount);
  }

  return initializeApp(config, projectId);
}

/**
 * Exportar colección completa desde Firestore
 */
export async function exportCollection(
  db: ReturnType<typeof getFirestore>,
  collectionName: string
): Promise<DocumentData[]> {
  console.log(`[Export] Exporting collection: ${collectionName}`);
  
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();
  
  const documents: DocumentData[] = [];
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    documents.push({
      id: doc.id,
      ...data,
    });
  });
  
  console.log(`[Export] Exported ${documents.length} documents from ${collectionName}`);
  return documents;
}

/**
 * Exportar todas las colecciones
 */
export async function exportAllCollections(
  db: ReturnType<typeof getFirestore>,
  collectionNames: string[]
): Promise<Record<string, DocumentData[]>> {
  const collections: Record<string, DocumentData[]> = {};
  let totalDocuments = 0;
  
  for (const collectionName of collectionNames) {
    try {
      const documents = await exportCollection(db, collectionName);
      collections[collectionName] = documents;
      totalDocuments += documents.length;
    } catch (error: any) {
      console.error(`[Export] Error exporting collection ${collectionName}:`, error.message);
      collections[collectionName] = [];
    }
  }
  
  console.log(`[Export] Total documents exported: ${totalDocuments}`);
  return collections;
}

/**
 * Generar checksum de datos exportados
 */
export function generateChecksum(data: MigrationData): string {
  const dataString = JSON.stringify(data.collections);
  return createHash('sha256').update(dataString).digest('hex');
}

/**
 * Guardar datos exportados a archivo JSON
 */
export function saveMigrationData(data: MigrationData, outputPath: string): void {
  const checksum = generateChecksum(data);
  data.metadata.checksum = checksum;
  
  writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`[Export] Data saved to ${outputPath}`);
  console.log(`[Export] Checksum: ${checksum}`);
}

/**
 * Cargar datos de migración desde archivo JSON
 */
export function loadMigrationData(filePath: string): MigrationData {
  if (!existsSync(filePath)) {
    throw new Error(`Migration data file not found: ${filePath}`);
  }
  
  const data = JSON.parse(readFileSync(filePath, 'utf-8')) as MigrationData;
  
  // Validar checksum
  const expectedChecksum = generateChecksum(data);
  if (data.metadata.checksum !== expectedChecksum) {
    console.warn('[Load] ⚠️ Checksum mismatch! Data may be corrupted.');
  }
  
  return data;
}

/**
 * Convertir Timestamp de Firestore a formato serializable
 */
export function serializeFirestoreData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (data instanceof Timestamp) {
    return {
      _type: 'timestamp',
      seconds: data.seconds,
      nanoseconds: data.nanoseconds,
    };
  }
  
  if (data instanceof Date) {
    return {
      _type: 'date',
      iso: data.toISOString(),
    };
  }
  
  if (Array.isArray(data)) {
    return data.map(serializeFirestoreData);
  }
  
  if (typeof data === 'object') {
    const serialized: any = {};
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializeFirestoreData(value);
    }
    return serialized;
  }
  
  return data;
}

/**
 * Deserializar datos de Firestore desde JSON
 */
export function deserializeFirestoreData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data === 'object' && data._type === 'timestamp') {
    return Timestamp.fromMillis(data.seconds * 1000 + data.nanoseconds / 1000000);
  }
  
  if (typeof data === 'object' && data._type === 'date') {
    return new Date(data.iso);
  }
  
  if (Array.isArray(data)) {
    return data.map(deserializeFirestoreData);
  }
  
  if (typeof data === 'object') {
    const deserialized: any = {};
    for (const [key, value] of Object.entries(data)) {
      deserialized[key] = deserializeFirestoreData(value);
    }
    return deserialized;
  }
  
  return data;
}

/**
 * Validar estructura de documento
 */
export function validateDocumentStructure(
  collectionName: string,
  document: DocumentData,
  expectedFields?: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!document.id) {
    errors.push('Document missing id field');
  }
  
  if (expectedFields) {
    for (const field of expectedFields) {
      if (!(field in document)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Crear reporte de migración
 */
export function createMigrationReport(
  collections: Record<string, DocumentData[]>,
  results: Record<string, { imported: number; errors: number; skipped: number }>,
  errors: Array<{ collection: string; documentId: string; error: string }>,
  startTime: number
): MigrationReport {
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  const report: MigrationReport = {
    success: errors.length === 0,
    collections: {},
    errors,
    duration,
    timestamp: new Date().toISOString(),
  };
  
  for (const [collectionName, documents] of Object.entries(collections)) {
    const result = results[collectionName] || { imported: 0, errors: 0, skipped: 0 };
    report.collections[collectionName] = {
      exported: documents.length,
      imported: result.imported,
      errors: result.errors,
      skipped: result.skipped,
    };
  }
  
  return report;
}

/**
 * Guardar reporte de migración
 */
export function saveMigrationReport(report: MigrationReport, outputPath: string): void {
  writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`[Report] Migration report saved to ${outputPath}`);
}

