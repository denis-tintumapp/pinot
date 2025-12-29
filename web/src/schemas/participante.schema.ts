/**
 * Esquema Zod para validación de Participantes
 */

import { z } from 'zod';

// Esquema base para Participante
export const ParticipanteSchema = z.object({
  id: z.string(),
  nombre: z.string().min(1, 'El nombre del participante es requerido'),
  eventoId: z.string().min(1, 'El ID del evento es requerido'),
  tipo: z.enum(['efimero', 'permanente', 'miembro']).optional(),
  creadoEn: z.any().optional(), // Timestamp de Firestore
  actualizadoEn: z.any().optional(), // Timestamp de Firestore
});

// Tipo TypeScript inferido del esquema
export type Participante = z.infer<typeof ParticipanteSchema>;

// Esquema para crear un participante (sin id, creadoEn, etc.)
export const CreateParticipanteSchema = ParticipanteSchema.omit({
  id: true,
  creadoEn: true,
  actualizadoEn: true,
}).partial({
  tipo: true,
});

export type CreateParticipante = z.infer<typeof CreateParticipanteSchema>;

// Esquema para actualizar un participante
export const UpdateParticipanteSchema = ParticipanteSchema.partial().required({
  id: true,
});

export type UpdateParticipante = z.infer<typeof UpdateParticipanteSchema>;

