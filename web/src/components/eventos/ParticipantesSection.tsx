/**
 * Componente para gestionar participantes del evento
 * Refactorizado para usar React Hook Form con Zod
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParticipantes } from '../../hooks/useParticipantes';
import { FormInput, FormError, FormButton } from '../forms';

// Esquema de validación para el formulario
const ParticipanteFormSchema = z.object({
  nombre: z
    .string()
    .min(1, 'Ingresá un nombre')
    .max(100, 'El nombre no puede superar los 100 caracteres')
    .trim(),
});

type ParticipanteFormData = z.infer<typeof ParticipanteFormSchema>;

interface ParticipantesSectionProps {
  eventoId: string | null;
}

const ParticipantesSection: React.FC<ParticipantesSectionProps> = ({ eventoId }) => {
  const { participantes, loading, error, agregarParticipante, actualizarParticipante, eliminarParticipante } = useParticipantes(eventoId);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'success' | 'error' | 'info' } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<ParticipanteFormData>({
    resolver: zodResolver(ParticipanteFormSchema),
    mode: 'onBlur',
  });

  // Actualizar el formulario cuando se selecciona un participante para editar
  useEffect(() => {
    if (editandoId) {
      const participante = participantes.find(p => p.id === editandoId);
      if (participante) {
        setValue('nombre', participante.nombre);
        setMensaje({ texto: `Editando: ${participante.nombre}`, tipo: 'info' });
      }
    } else {
      reset();
      setMensaje(null);
    }
  }, [editandoId, participantes, setValue, reset]);

  const onFormSubmit = async (data: ParticipanteFormData) => {
    setMensaje(null);

    if (editandoId) {
      const resultado = await actualizarParticipante(editandoId, data.nombre);
      if (resultado.success) {
        setMensaje({ texto: 'Participante actualizado', tipo: 'success' });
        setEditandoId(null);
        reset();
      } else {
        setMensaje({ texto: resultado.error || 'Error al actualizar participante', tipo: 'error' });
      }
    } else {
      const resultado = await agregarParticipante(data.nombre);
      if (resultado.success) {
        setMensaje({ texto: 'Participante agregado', tipo: 'success' });
        reset();
      } else {
        setMensaje({ texto: resultado.error || 'Error al guardar participante', tipo: 'error' });
      }
    }
  };

  const handleEditar = (participante: { id: string; nombre: string }) => {
    setEditandoId(participante.id);
  };

  const handleEliminar = async (participante: { id: string; nombre: string }) => {
    if (!confirm(`¿Eliminar a "${participante.nombre}" de este evento?`)) {
      return;
    }

    const resultado = await eliminarParticipante(participante.id);
    if (resultado.success) {
      setMensaje({ texto: 'Participante eliminado', tipo: 'success' });
      if (editandoId === participante.id) {
        setEditandoId(null);
        setNombre('');
      }
    } else {
      setMensaje({ texto: resultado.error || 'Error al eliminar participante', tipo: 'error' });
    }
  };

  return (
    <section className="bg-white rounded-xl shadow p-6 mb-6 space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Participantes</h2>
      
      <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <FormInput
            label=""
            name="nombre"
            type="text"
            register={register}
            error={errors.nombre}
            placeholder="Nombre del participante"
            disabled={loading || isSubmitting}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
          />
        </div>
        <FormButton
          type="submit"
          disabled={loading || isSubmitting}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          {editandoId ? 'Guardar cambios' : 'Agregar'}
        </FormButton>
      </form>

      {mensaje && (
        <FormError 
          message={mensaje.texto} 
          type={mensaje.tipo === 'error' ? 'error' : mensaje.tipo === 'success' ? 'success' : 'info'}
          className="text-sm"
        />
      )}

      {error && (
        <FormError message={error} type="error" className="text-sm" />
      )}

      <ul className="mt-3 space-y-2 text-sm text-gray-800">
        {participantes.length === 0 ? (
          <li className="text-gray-500">No hay participantes cargados aún.</li>
        ) : (
          participantes.map((participante) => (
            <li
              key={participante.id}
              className="border border-gray-200 rounded-lg px-4 py-2 flex justify-between items-center gap-2"
            >
              <span>{participante.nombre}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditar(participante)}
                  className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleEliminar(participante)}
                  className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
};

export default ParticipantesSection;











