/**
 * Storybook stories para NaipeCard
 */

import type { Meta, StoryObj } from '@storybook/react';
import { DndContext } from '@dnd-kit/core';
import NaipeCard from './NaipeCard';

const meta: Meta<typeof NaipeCard> = {
  title: 'Components/NaipeCard',
  component: NaipeCard,
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
        component: 'Tarjeta de naipe que permite drag & drop para asignar a etiquetas.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NaipeCard>;

export const Default: Story = {
  args: {
    naipeId: '1-copas',
    naipeNombre: 'As de Copas',
  },
};

export const Selected: Story = {
  args: {
    naipeId: '2-espadas',
    naipeNombre: 'Dos de Espadas',
    isSelected: true,
  },
};

export const Disabled: Story = {
  args: {
    naipeId: '3-oros',
    naipeNombre: 'Tres de Oros',
    isDisabled: true,
  },
};

export const MultipleCards: Story = {
  render: () => (
    <div className="flex gap-4">
      <NaipeCard naipeId="1-copas" naipeNombre="As de Copas" />
      <NaipeCard naipeId="2-espadas" naipeNombre="Dos de Espadas" isSelected />
      <NaipeCard naipeId="3-oros" naipeNombre="Tres de Oros" />
      <NaipeCard naipeId="4-bastos" naipeNombre="Cuatro de Bastos" isDisabled />
    </div>
  ),
};

