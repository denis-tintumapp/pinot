/**
 * Componente para gestionar etiquetas y naipes del evento
 * Refactorizado parcialmente para usar React Hook Form con Zod
 */

import React, { useState, FormEvent, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEtiquetas } from '../../hooks/useEtiquetas';
import { useNaipes } from '../../hooks/useNaipes';
import { FormInput, FormError, FormButton } from '../forms';
// @ts-ignore - Importar desde JS hasta que se migre completamente
import { NAIPES_TRUCO } from '../../../js/constantes.ts';

// Esquema de validación para el formulario de etiquetas
const EtiquetaFormSchema = z.object({
  nombre: z
    .string()
    .min(1, 'Ingresá un nombre para la etiqueta (vino)')
    .max(100, 'El nombre no puede superar los 100 caracteres')
    .trim(),
});

type EtiquetaFormData = z.infer<typeof EtiquetaFormSchema>;

interface EtiquetasNaipesSectionProps {
  eventoId: string | null;
}

const EtiquetasNaipesSection: React.FC<EtiquetasNaipesSectionProps> = ({ eventoId }) => {
  const { etiquetas, loading: etiquetasLoading, agregarEtiqueta, actualizarEtiqueta, guardarEtiquetas } = useEtiquetas(eventoId);
  const { naipesSeleccionados, loading: naipesLoading, agregarNaipe, quitarNaipe, sugerirNaipes, guardarNaipes } = useNaipes(eventoId);
  
  const [etiquetaEditando, setEtiquetaEditando] = useState<{ id: string; nombre: string } | null>(null);
  const [naipeSeleccionado, setNaipeSeleccionado] = useState('');
  const [mensajeEtiquetas, setMensajeEtiquetas] = useState<{ texto: string; tipo: 'success' | 'error' | 'info' } | null>(null);
  const [mensajeNaipes, setMensajeNaipes] = useState<{ texto: string; tipo: 'success' | 'error' | 'info' } | null>(null);
  const [mensajeGuardar, setMensajeGuardar] = useState<{ texto: string; tipo: 'success' | 'error' | 'info' } | null>(null);

  const {
    register: registerEtiqueta,
    handleSubmit: handleSubmitEtiqueta,
    formState: { errors: errorsEtiqueta, isSubmitting: isSubmittingEtiqueta },
    reset: resetEtiqueta,
    setValue: setValueEtiqueta,
  } = useForm<EtiquetaFormData>({
    resolver: zodResolver(EtiquetaFormSchema),
    mode: 'onBlur',
  });

  // Naipes ordenados por rank
  const naipesOrdenados = [...NAIPES_TRUCO].sort((a, b) => a.rank - b.rank);

  // Actualizar el formulario cuando se selecciona una etiqueta para editar
  useEffect(() => {
    if (etiquetaEditando) {
      setValueEtiqueta('nombre', etiquetaEditando.nombre);
      setMensajeEtiquetas({ texto: `Editando: ${etiquetaEditando.nombre}`, tipo: 'info' });
    } else {
      resetEtiqueta();
      setMensajeEtiquetas(null);
    }
  }, [etiquetaEditando, setValueEtiqueta, resetEtiqueta]);

  const onAgregarEtiqueta = async (data: EtiquetaFormData) => {
    setMensajeEtiquetas(null);

    if (etiquetaEditando) {
      if (actualizarEtiqueta(etiquetaEditando.id, data.nombre)) {
        setMensajeEtiquetas({ texto: 'Etiqueta actualizada', tipo: 'success' });
        setEtiquetaEditando(null);
        resetEtiqueta();
      }
    } else {
      const nuevaEtiqueta = agregarEtiqueta(data.nombre);
      if (nuevaEtiqueta) {
        setMensajeEtiquetas({ texto: 'Etiqueta agregada', tipo: 'success' });
        resetEtiqueta();
      }
    }
  };

  const handleEditarEtiqueta = (etiqueta: { id: string; nombre: string }) => {
    setEtiquetaEditando(etiqueta);
  };

  const handleAgregarNaipe = (e: FormEvent) => {
    e.preventDefault();
    setMensajeNaipes(null);

    if (!etiquetas.length) {
      setMensajeNaipes({ texto: 'Antes de asignar naipes, cargá al menos una etiqueta', tipo: 'error' });
      return;
    }

    const max = etiquetas.length;
    if (naipesSeleccionados.length >= max) {
      setMensajeNaipes({ texto: `Ya seleccionaste el máximo de naipes (${max}) para las etiquetas cargadas`, tipo: 'error' });
      return;
    }

    if (!naipeSeleccionado) {
      setMensajeNaipes({ texto: 'Seleccioná un naipe de la lista', tipo: 'error' });
      return;
    }

    const resultado = agregarNaipe(naipeSeleccionado);
    if (resultado.success) {
      setNaipeSeleccionado('');
      setMensajeNaipes(null);
    } else {
      setMensajeNaipes({ texto: resultado.error || 'Error al agregar naipe', tipo: 'error' });
    }
  };

  const handleSugerirNaipes = () => {
    if (!etiquetas.length) {
      setMensajeNaipes({ texto: 'Cargá las etiquetas antes de sugerir naipes', tipo: 'error' });
      return;
    }

    const max = etiquetas.length;
    const resultado = sugerirNaipes(max);
    
    if (resultado.success) {
      setMensajeNaipes({ texto: `Se sugirieron automáticamente ${resultado.sugeridos} naipes según el ranking de Truco`, tipo: 'success' });
    } else {
      setMensajeNaipes({ texto: resultado.error || 'Error al sugerir naipes', tipo: 'error' });
    }
  };

  const handleGuardarConfig = async () => {
    setMensajeGuardar(null);

    if (!etiquetas.length) {
      setMensajeGuardar({ texto: 'Cargá al menos una etiqueta', tipo: 'error' });
      return;
    }

    // Guardar etiquetas
    const resultadoEtiquetas = await guardarEtiquetas();
    if (!resultadoEtiquetas.success) {
      setMensajeGuardar({ texto: resultadoEtiquetas.error || 'Error al guardar etiquetas', tipo: 'error' });
      return;
    }

    // Guardar naipes
    const resultadoNaipes = await guardarNaipes();
    if (!resultadoNaipes.success) {
      setMensajeGuardar({ texto: resultadoNaipes.error || 'Error al guardar naipes', tipo: 'error' });
      return;
    }

    setMensajeGuardar({ texto: 'Configuración guardada exitosamente', tipo: 'success' });
  };

  return (
    <section className="bg-white rounded-xl shadow p-6 mb-6 space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Etiquetas / Naipes</h2>
      
      {/* Alta / edición de etiquetas */}
      <form onSubmit={handleSubmitEtiqueta(onAgregarEtiqueta)} className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="flex-1 w-full">
          <FormInput
            label=""
            name="nombre"
            type="text"
            register={registerEtiqueta}
            error={errorsEtiqueta.nombre}
            placeholder="Nombre de la etiqueta (vino)"
            disabled={etiquetasLoading || isSubmittingEtiqueta}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
          />
        </div>
        <FormButton
          type="submit"
          disabled={etiquetasLoading || isSubmittingEtiqueta}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          {etiquetaEditando ? 'Guardar etiqueta' : 'Nueva etiqueta'}
        </FormButton>
      </form>
      
      {mensajeEtiquetas && (
        <FormError 
          message={mensajeEtiquetas.texto} 
          type={mensajeEtiquetas.tipo === 'error' ? 'error' : mensajeEtiquetas.tipo === 'success' ? 'success' : 'info'}
          className="text-sm"
        />
      )}

      {/* Selección de naipes */}
      <form onSubmit={handleAgregarNaipe} className="flex flex-col sm:flex-row gap-3 items-center">
        <label htmlFor="naipeSelect" className="text-sm text-gray-700 font-medium">
          Naipe:
        </label>
        <select
          id="naipeSelect"
          value={naipeSeleccionado}
          onChange={(e) => setNaipeSeleccionado(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 flex-1 min-w-[180px] focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          disabled={naipesLoading || !etiquetas.length}
        >
          <option value="">Seleccioná un naipe…</option>
          {naipesOrdenados.map((naipe) => (
            <option key={naipe.id} value={naipe.id}>
              {naipe.nombre}
            </option>
          ))}
        </select>
        
        <button
          type="submit"
          disabled={naipesLoading || !etiquetas.length || naipesSeleccionados.length >= etiquetas.length}
          className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Agregar naipe
        </button>
        
        <button
          type="button"
          onClick={handleSugerirNaipes}
          disabled={naipesLoading || !etiquetas.length || naipesSeleccionados.length >= etiquetas.length}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Sugerir naipes
        </button>
      </form>
      
      {mensajeNaipes && (
        <p className={`text-sm ${mensajeNaipes.tipo === 'error' ? 'text-red-600' : mensajeNaipes.tipo === 'success' ? 'text-green-600' : 'text-gray-600'}`}>
          {mensajeNaipes.texto}
        </p>
      )}

      {/* Listas Etiquetas / Naipes */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Etiquetas {etiquetas.length > 0 && `(${etiquetas.length})`}
          </h3>
          <ul className="space-y-2 text-sm text-gray-800">
            {etiquetas.length === 0 ? (
              <li className="text-gray-500">No hay etiquetas cargadas aún.</li>
            ) : (
              etiquetas.map((etq, idx) => {
                const naipe = naipesSeleccionados[idx];
                return (
                  <li
                    key={etq.id}
                    className="flex justify-between items-center gap-2 border border-gray-200 rounded-lg px-3 py-2"
                  >
                    <span>
                      Etiqueta #{idx + 1} — {etq.nombre}
                      {naipe && ` → ${naipe.nombre}`}
                    </span>
                    <button
                      onClick={() => handleEditarEtiqueta(etq)}
                      className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                    >
                      Editar
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          {etiquetas.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              Total de etiquetas: {etiquetas.length}. Máximo de naipes: {etiquetas.length}.
            </p>
          )}
        </div>
        
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Naipes seleccionados ({naipesSeleccionados.length} / {etiquetas.length})
          </h3>
          <ul className="space-y-2 text-sm text-gray-800">
            {naipesSeleccionados.length === 0 ? (
              <li className="text-gray-500">No hay naipes asignados aún.</li>
            ) : (
              naipesSeleccionados.map((n, idx) => (
                <li
                  key={n.id}
                  className="flex justify-between items-center gap-2 border border-gray-200 rounded-lg px-3 py-2"
                >
                  <span>#{idx + 1} — {n.nombre}</span>
                  <button
                    onClick={() => quitarNaipe(n.id)}
                    className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    Quitar
                  </button>
                </li>
              ))
            )}
          </ul>
          {naipesSeleccionados.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              Naipes seleccionados: {naipesSeleccionados.length} / {etiquetas.length} etiquetas.
            </p>
          )}
        </div>
      </div>
      
      {/* Guardar configuración */}
      <div className="pt-4 border-t">
        <button
          onClick={handleGuardarConfig}
          disabled={etiquetasLoading || naipesLoading || !etiquetas.length}
          className="px-6 py-2 bg-purple-700 text-white rounded-lg w-full hover:bg-purple-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Guardar configuración
        </button>
        {mensajeGuardar && (
          <p className={`text-sm mt-2 ${mensajeGuardar.tipo === 'error' ? 'text-red-600' : mensajeGuardar.tipo === 'success' ? 'text-green-600' : 'text-gray-600'}`}>
            {mensajeGuardar.texto}
          </p>
        )}
      </div>
    </section>
  );
};

export default EtiquetasNaipesSection;











