/**
 * Esquema Zod para validación de Anfitriones
 */

import { z } from 'zod';

// Esquema base para Anfitrión
export const AnfitrionSchema = z.object({
  id: z.string(),
  alias: z.string().optional(),
  nombreAnfitrion: z.string().optional(),
  nombreCompleto: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  tipo: z.enum(['efimero', 'persistente', 'permanente']).optional(),
  tipoUsuario: z.enum(['efimero', 'permanente', 'miembro']).optional(),
  emailVerificado: z.boolean().optional(),
  eventosCreados: z.number().int().min(0).optional(),
  habilitado: z.boolean().optional(),
  creadoEn: z.any().optional(), // Timestamp de Firestore
  actualizadoEn: z.any().optional(), // Timestamp de Firestore
});

// Tipo TypeScript inferido del esquema
export type Anfitrion = z.infer<typeof AnfitrionSchema>;

// Esquema para crear un anfitrión
export const CreateAnfitrionSchema = AnfitrionSchema.omit({
  id: true,
  creadoEn: true,
  actualizadoEn: true,
}).partial({
  emailVerificado: true,
  eventosCreados: true,
  habilitado: true,
});

export type CreateAnfitrion = z.infer<typeof CreateAnfitrionSchema>;

// Esquema para actualizar un anfitrión
export const UpdateAnfitrionSchema = AnfitrionSchema.partial().required({
  id: true,
});

export type UpdateAnfitrion = z.infer<typeof UpdateAnfitrionSchema>;

