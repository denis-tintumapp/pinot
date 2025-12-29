/**
 * Esquema Zod para validación de Etiquetas
 */

import { z } from 'zod';

// Esquema base para Etiqueta (en memoria/local)
export const EtiquetaSchema = z.object({
  id: z.string(),
  nombre: z.string().min(1, 'El nombre de la etiqueta es requerido'),
});

// Tipo TypeScript inferido del esquema
export type Etiqueta = z.infer<typeof EtiquetaSchema>;

// Esquema para Etiqueta en Firestore (con más campos)
export const EtiquetaFirestoreSchema = z.object({
  id: z.string().optional(), // ID del documento en Firestore
  eventoId: z.string().min(1, 'El ID del evento es requerido'),
  etiquetaId: z.string().min(1, 'El ID de la etiqueta es requerido'),
  etiquetaNombre: z.string().min(1, 'El nombre de la etiqueta es requerido'),
  naipeId: z.string().optional(),
  naipeNombre: z.string().optional(),
  orden: z.number().optional(),
  creadoEn: z.any().optional(), // Timestamp de Firestore
});

export type EtiquetaFirestore = z.infer<typeof EtiquetaFirestoreSchema>;

// Esquema para crear una etiqueta en Firestore
export const CreateEtiquetaFirestoreSchema = EtiquetaFirestoreSchema.omit({
  id: true,
}).partial({
  naipeId: true,
  naipeNombre: true,
  orden: true,
  creadoEn: true,
});

export type CreateEtiquetaFirestore = z.infer<typeof CreateEtiquetaFirestoreSchema>;

