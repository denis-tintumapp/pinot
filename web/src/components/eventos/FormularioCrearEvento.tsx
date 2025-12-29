/**
 * Componente para el formulario de creación de eventos
 * Refactorizado para usar React Hook Form con Zod
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormInput, FormError, FormButton } from '../forms';

// Esquema de validación para el formulario
const CrearEventoFormSchema = z.object({
  nombre: z
    .string()
    .min(1, 'Por favor, ingresa un nombre para el evento.')
    .max(100, 'El nombre no puede superar los 100 caracteres')
    .trim(),
});

type CrearEventoFormData = z.infer<typeof CrearEventoFormSchema>;

interface FormularioCrearEventoProps {
  onSubmit: (nombre: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const FormularioCrearEvento: React.FC<FormularioCrearEventoProps> = ({ 
  onSubmit, 
  loading, 
  error 
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CrearEventoFormData>({
    resolver: zodResolver(CrearEventoFormSchema),
    mode: 'onBlur',
  });

  const onFormSubmit = async (data: CrearEventoFormData) => {
    await onSubmit(data.nombre);
    reset(); // Limpiar formulario después de éxito
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img
              src="/images/logo-pinot.png"
              alt="Pinot Logo"
              className="h-12 w-auto"
            />
            <h1 className="text-4xl font-bold text-white font-branding">Pinot</h1>
          </div>
          <p className="text-white/80 text-lg">Crear Nuevo Evento</p>
        </div>

        {/* Formulario */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            {/* Input Nombre */}
            <div>
              <FormInput
                label="Nombre del Evento"
                name="nombre"
                type="text"
                register={register}
                error={errors.nombre}
                required
                placeholder="Ej: Cata de Vinos Tintos 2025"
                disabled={loading || isSubmitting}
                maxLength={100}
                autoComplete="off"
              />
              <p className="text-white/60 text-xs mt-1">
                Ingresa un nombre descriptivo para tu evento
              </p>
            </div>

            {/* Mensajes de error */}
            {error && (
              <FormError message={error} type="error" />
            )}

            {/* Botón Submit */}
            <FormButton
              type="submit"
              loading={loading || isSubmitting}
              loadingText="Creando evento..."
            >
              Crear Evento
            </FormButton>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormularioCrearEvento;











