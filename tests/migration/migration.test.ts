/**
 * Tests para funciones de migración de Firestore
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  serializeFirestoreData,
  deserializeFirestoreData,
  generateChecksum,
  validateDocumentStructure,
  type MigrationData,
} from '../../scripts/firestore-migration-utils';
import { Timestamp } from 'firebase-admin/firestore';

describe('Migration Utils', () => {
  describe('serializeFirestoreData', () => {
    it('should serialize Timestamp to object', () => {
      const timestamp = Timestamp.now();
      const serialized = serializeFirestoreData(timestamp);
      
      expect(serialized).toHaveProperty('_type', 'timestamp');
      expect(serialized).toHaveProperty('seconds');
      expect(serialized).toHaveProperty('nanoseconds');
    });

    it('should serialize Date to object', () => {
      const date = new Date();
      const serialized = serializeFirestoreData(date);
      
      expect(serialized).toHaveProperty('_type', 'date');
      expect(serialized).toHaveProperty('iso');
    });

    it('should serialize nested objects', () => {
      const data = {
        timestamp: Timestamp.now(),
        nested: {
          date: new Date(),
          value: 'test',
        },
      };
      
      const serialized = serializeFirestoreData(data);
      
      expect(serialized.timestamp).toHaveProperty('_type', 'timestamp');
      expect(serialized.nested.date).toHaveProperty('_type', 'date');
      expect(serialized.nested.value).toBe('test');
    });

    it('should serialize arrays', () => {
      const data = {
        timestamps: [Timestamp.now(), Timestamp.now()],
        values: [1, 2, 3],
      };
      
      const serialized = serializeFirestoreData(data);
      
      expect(Array.isArray(serialized.timestamps)).toBe(true);
      expect(serialized.timestamps[0]).toHaveProperty('_type', 'timestamp');
      expect(serialized.values).toEqual([1, 2, 3]);
    });
  });

  describe('deserializeFirestoreData', () => {
    it('should deserialize timestamp object to Timestamp', () => {
      const serialized = {
        _type: 'timestamp',
        seconds: 1000,
        nanoseconds: 500000000,
      };
      
      const deserialized = deserializeFirestoreData(serialized);
      
      expect(deserialized).toBeInstanceOf(Timestamp);
      expect(deserialized.seconds).toBe(1000);
      expect(deserialized.nanoseconds).toBe(500000000);
    });

    it('should deserialize date object to Date', () => {
      const date = new Date();
      const serialized = {
        _type: 'date',
        iso: date.toISOString(),
      };
      
      const deserialized = deserializeFirestoreData(serialized);
      
      expect(deserialized).toBeInstanceOf(Date);
      expect(deserialized.toISOString()).toBe(date.toISOString());
    });

    it('should deserialize nested objects', () => {
      const data = {
        timestamp: {
          _type: 'timestamp',
          seconds: 1000,
          nanoseconds: 0,
        },
        nested: {
          date: {
            _type: 'date',
            iso: new Date().toISOString(),
          },
          value: 'test',
        },
      };
      
      const deserialized = deserializeFirestoreData(data);
      
      expect(deserialized.timestamp).toBeInstanceOf(Timestamp);
      expect(deserialized.nested.date).toBeInstanceOf(Date);
      expect(deserialized.nested.value).toBe('test');
    });
  });

  describe('generateChecksum', () => {
    it('should generate consistent checksum for same data', () => {
      const data: MigrationData = {
        collections: {
          test: [{ id: '1', name: 'test' }],
        },
        metadata: {
          exportedAt: new Date().toISOString(),
          source: 'emulator',
          checksum: '',
          collections: ['test'],
          totalDocuments: 1,
        },
      };
      
      const checksum1 = generateChecksum(data);
      const checksum2 = generateChecksum(data);
      
      expect(checksum1).toBe(checksum2);
      expect(checksum1).toHaveLength(64); // SHA256 hex string
    });

    it('should generate different checksums for different data', () => {
      const data1: MigrationData = {
        collections: {
          test: [{ id: '1', name: 'test1' }],
        },
        metadata: {
          exportedAt: new Date().toISOString(),
          source: 'emulator',
          checksum: '',
          collections: ['test'],
          totalDocuments: 1,
        },
      };
      
      const data2: MigrationData = {
        collections: {
          test: [{ id: '1', name: 'test2' }],
        },
        metadata: {
          exportedAt: new Date().toISOString(),
          source: 'emulator',
          checksum: '',
          collections: ['test'],
          totalDocuments: 1,
        },
      };
      
      const checksum1 = generateChecksum(data1);
      const checksum2 = generateChecksum(data2);
      
      expect(checksum1).not.toBe(checksum2);
    });
  });

  describe('validateDocumentStructure', () => {
    it('should validate document with all required fields', () => {
      const document = {
        id: 'test-id',
        name: 'test',
        email: 'test@example.com',
      };
      
      const result = validateDocumentStructure('test', document, ['name', 'email']);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation when required fields are missing', () => {
      const document = {
        id: 'test-id',
        name: 'test',
      };
      
      const result = validateDocumentStructure('test', document, ['name', 'email']);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({
        error: expect.stringContaining('email'),
      }));
    });

    it('should fail validation when id is missing', () => {
      const document = {
        name: 'test',
      };
      
      const result = validateDocumentStructure('test', document);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({
        error: expect.stringContaining('id'),
      }));
    });

    it('should pass validation when no required fields specified', () => {
      const document = {
        id: 'test-id',
        name: 'test',
      };
      
      const result = validateDocumentStructure('test', document);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});

