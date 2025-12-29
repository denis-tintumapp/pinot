/**
 * Esquema Zod para validación de Selecciones
 */

import { z } from 'zod';

// Esquema base para Selección de Participante
export const SeleccionSchema = z.object({
  id: z.string(),
  nombreParticipante: z.string().min(1, 'El nombre del participante es requerido'),
  sesionId: z.string().min(1, 'El ID de sesión es requerido'),
  eventoId: z.string().min(1, 'El ID del evento es requerido'),
  seleccionesNaipes: z.record(z.string(), z.string()), // etiquetaId -> naipeId
  seleccionesEtiquetas: z.record(z.string(), z.string()), // etiquetaId -> etiquetaNombre
  ordenEtiquetas: z.array(z.string()),
  finalizado: z.boolean().default(false),
  calificacionesEtiquetas: z.record(z.string(), z.number().int().min(1).max(5)).optional(),
  seleccionesNaipesTimestamps: z.record(z.string(), z.any()).optional(), // Timestamps de Firestore
  creadoEn: z.any().optional(), // Timestamp de Firestore
  actualizadoEn: z.any().optional(), // Timestamp de Firestore
});

// Tipo TypeScript inferido del esquema
export type Seleccion = z.infer<typeof SeleccionSchema>;

// Esquema para crear una selección
export const CreateSeleccionSchema = SeleccionSchema.omit({
  id: true,
  creadoEn: true,
  actualizadoEn: true,
}).partial({
  finalizado: true,
  calificacionesEtiquetas: true,
  seleccionesNaipesTimestamps: true,
});

export type CreateSeleccion = z.infer<typeof CreateSeleccionSchema>;

// Esquema para actualizar una selección
export const UpdateSeleccionSchema = SeleccionSchema.partial().required({
  id: true,
});

export type UpdateSeleccion = z.infer<typeof UpdateSeleccionSchema>;

