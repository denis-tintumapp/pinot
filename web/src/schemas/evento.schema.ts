/**
 * Esquema Zod para validación de Eventos
 */

import { z } from 'zod';

// Esquema para naipe
const NaipeSchema = z.object({
  id: z.string(),
  nombre: z.string(),
});

// Esquema base para Evento
export const EventoSchema = z.object({
  id: z.string(),
  nombre: z.string().min(1, 'El nombre del evento es requerido'),
  pin: z.string().length(5, 'El PIN debe tener 5 dígitos'),
  anfitrionId: z.string().min(1, 'El ID del anfitrión es requerido'),
  activo: z.boolean().default(false),
  naipes: z.array(NaipeSchema).optional(),
  fecha: z.string().optional(),
  habilitado: z.boolean().optional(),
  cantidadParticipantes: z.number().optional(),
  cantidadEtiquetas: z.number().optional(),
  timerIniciadoEn: z.any().optional(), // Timestamp de Firestore
  timerExpiraEn: z.any().optional(), // Timestamp de Firestore
  creadoEn: z.any().optional(), // Timestamp de Firestore
  actualizadoEn: z.any().optional(), // Timestamp de Firestore
});

// Tipo TypeScript inferido del esquema
export type Evento = z.infer<typeof EventoSchema>;

// Esquema para crear un evento (sin id, creadoEn, etc.)
export const CreateEventoSchema = EventoSchema.omit({
  id: true,
  creadoEn: true,
  actualizadoEn: true,
}).partial({
  activo: true,
  naipes: true,
  fecha: true,
  habilitado: true,
  cantidadParticipantes: true,
  cantidadEtiquetas: true,
  timerIniciadoEn: true,
  timerExpiraEn: true,
}).required({
  nombre: true,
  pin: true,
  anfitrionId: true,
});

export type CreateEvento = z.infer<typeof CreateEventoSchema>;

// Esquema para actualizar un evento (todos los campos opcionales excepto id)
export const UpdateEventoSchema = EventoSchema.partial().required({
  id: true,
});

export type UpdateEvento = z.infer<typeof UpdateEventoSchema>;


