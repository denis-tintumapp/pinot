/**
 * Componente para reordenar etiquetas mediante drag & drop (ranking)
 */

import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useReordenarEtiquetas } from '../../hooks/useReordenarEtiquetas';
import { ParticipacionState } from '../../hooks/useParticipacion';
import EstrellasCalificacion from './EstrellasCalificacion';

interface EtiquetasRankingProps {
  state: ParticipacionState;
  guardarOrdenEtiquetas: (orden: string[]) => Promise<void>;
  onCalificar?: (etiquetaId: string, calificacion: number) => void;
}

interface SortableEtiquetaItemProps {
  etiqueta: { id: string; nombre: string };
  index: number;
  naipeAsignado?: string;
  calificacion?: number;
  onCalificar?: (etiquetaId: string, calificacion: number) => void;
}

const SortableEtiquetaItem: React.FC<SortableEtiquetaItemProps> = ({
  etiqueta,
  index,
  naipeAsignado,
  calificacion,
  onCalificar,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: etiqueta.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const imagenNaipe = naipeAsignado ? `/images/naipes/${naipeAsignado}.png` : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        border-2 border-dashed border-purple-300 rounded-lg p-3 md:p-4 min-h-[90px]
        flex items-center justify-between gap-2 transition-all
        ${isDragging ? 'border-purple-500 bg-purple-100 z-50' : 'bg-white'}
        cursor-move
      `}
      {...attributes}
      {...listeners}
    >
      <div className="flex-1 flex flex-col justify-center min-w-0">
        {/* Posición en el ranking */}
        <div className="text-xs text-purple-600 font-semibold flex items-center gap-1 mb-1">
          <span className="text-lg">{index + 1}</span>
        </div>

        {/* Nombre de la etiqueta */}
        <div className="font-semibold text-gray-900 text-sm break-words mb-2">
          {etiqueta.nombre}
        </div>

        {/* Calificación con estrellas */}
        {onCalificar && (
          <EstrellasCalificacion
            etiquetaId={etiqueta.id}
            calificacion={calificacion || 0}
            onCalificar={onCalificar}
            size="small"
          />
        )}
      </div>

      {/* Naipe asignado */}
      {naipeAsignado && imagenNaipe && (
        <div className="flex-shrink-0">
          <img
            src={imagenNaipe}
            alt={`Naipe asignado`}
            className="w-12 h-16 md:w-16 md:h-24 object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      )}
    </div>
  );
};

const EtiquetasRanking: React.FC<EtiquetasRankingProps> = ({
  state,
  guardarOrdenEtiquetas,
  onCalificar,
}) => {
  const { obtenerEtiquetasOrdenadas, reordenarEtiquetas } = useReordenarEtiquetas(
    state,
    guardarOrdenEtiquetas
  );

  const etiquetasOrdenadas = obtenerEtiquetasOrdenadas();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = etiquetasOrdenadas.findIndex((e) => e.id === active.id);
    const newIndex = etiquetasOrdenadas.findIndex((e) => e.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      await reordenarEtiquetas(active.id as string, over.id as string);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Ordena las etiquetas según tu preferencia (ranking)
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Arrastra las etiquetas para cambiar su orden. El número indica la posición en el ranking.
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={etiquetasOrdenadas.map((e) => e.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {etiquetasOrdenadas.map((etiqueta, index) => (
              <SortableEtiquetaItem
                key={etiqueta.id}
                etiqueta={etiqueta}
                index={index}
                naipeAsignado={state.seleccionesNaipes[etiqueta.id]}
                calificacion={state.calificacionesEtiquetas[etiqueta.id]}
                onCalificar={onCalificar}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default EtiquetasRanking;




