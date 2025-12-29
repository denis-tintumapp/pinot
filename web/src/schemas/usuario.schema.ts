/**
 * Esquema Zod para validación de Usuarios
 */

import { z } from 'zod';

// Esquema base para Usuario (relacionado con autenticación)
export const UsuarioSchema = z.object({
  uid: z.string().min(1, 'El UID del usuario es requerido'),
  email: z.string().email('Email inválido').optional(),
  emailVerificado: z.boolean().optional(),
  displayName: z.string().optional(),
  photoURL: z.string().url('URL de foto inválida').optional(),
  disabled: z.boolean().optional(),
  metadata: z.object({
    creationTime: z.string().optional(),
    lastSignInTime: z.string().optional(),
  }).optional(),
});

// Tipo TypeScript inferido del esquema
export type Usuario = z.infer<typeof UsuarioSchema>;

// Esquema para datos de registro de usuario (anfitrión efímero)
export const RegisterUsuarioSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es requerido')
    .email('El email debe tener formato válido (ej: usuario@dominio.com)')
    .toLowerCase(),
  alias: z
    .string()
    .min(1, 'El alias es requerido')
    .min(2, 'El alias debe tener al menos 2 caracteres')
    .max(20, 'El alias no puede superar los 20 caracteres'),
  nombreCompleto: z.string().max(100).optional(),
});

export type RegisterUsuario = z.infer<typeof RegisterUsuarioSchema>;

// Esquema para login de usuario
export const LoginUsuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type LoginUsuario = z.infer<typeof LoginUsuarioSchema>;

// Esquema para PIN de evento
export const PinEventoSchema = z.object({
  pin: z
    .string()
    .length(5, 'El PIN debe tener exactamente 5 dígitos')
    .regex(/^[0-9]{5}$/, 'El PIN solo puede contener números'),
});

export type PinEvento = z.infer<typeof PinEventoSchema>;

// Esquema para reset password
export const ResetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es requerido')
    .email('Debe ser un correo electrónico válido')
    .toLowerCase()
    .trim(),
});

export type ResetPassword = z.infer<typeof ResetPasswordSchema>;

