/**
 * Storybook stories para EtiquetaCard
 */

import type { Meta, StoryObj } from '@storybook/react';
import { DndContext } from '@dnd-kit/core';
import EtiquetaCard from './EtiquetaCard';

const meta: Meta<typeof EtiquetaCard> = {
  title: 'Components/EtiquetaCard',
  component: EtiquetaCard,
  decorators: [
    (Story) => (
      <DndContext>
        <div className="p-8 bg-gray-50 min-h-screen">
          <Story />
        </div>
      </DndContext>
    ),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Tarjeta de etiqueta que permite asignar naipes mediante drag & drop.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EtiquetaCard>;

export const Default: Story = {
  args: {
    etiquetaId: 'etiqueta-1',
    etiquetaNombre: 'Vino Tinto Reserva',
  },
};

export const WithNaipe: Story = {
  args: {
    etiquetaId: 'etiqueta-2',
    etiquetaNombre: 'Vino Blanco',
    naipeAsignado: {
      naipeId: '1-copas',
      naipeNombre: 'As de Copas',
    },
  },
};

export const WithOrder: Story = {
  args: {
    etiquetaId: 'etiqueta-3',
    etiquetaNombre: 'Vino Rosado',
    orden: 0,
  },
};

export const WithOrderAndNaipe: Story = {
  args: {
    etiquetaId: 'etiqueta-4',
    etiquetaNombre: 'Vino Espumoso',
    naipeAsignado: {
      naipeId: '2-espadas',
      naipeNombre: 'Dos de Espadas',
    },
    orden: 1,
  },
};

