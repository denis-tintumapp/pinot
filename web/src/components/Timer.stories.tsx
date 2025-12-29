/**
 * Storybook stories para Timer
 */

import type { Meta, StoryObj } from '@storybook/react';
import Timer from './Timer';

const meta: Meta<typeof Timer> = {
  title: 'Components/Timer',
  component: Timer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Componente de timer que muestra el tiempo restante hasta una fecha de expiración.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Timer>;

export const Default: Story = {
  args: {
    expiraEn: Date.now() + 5 * 60 * 1000, // 5 minutos desde ahora
  },
};

export const OneMinute: Story = {
  args: {
    expiraEn: Date.now() + 60 * 1000, // 1 minuto desde ahora
  },
};

export const ThirtySeconds: Story = {
  args: {
    expiraEn: Date.now() + 30 * 1000, // 30 segundos desde ahora
  },
};

export const Expired: Story = {
  args: {
    expiraEn: Date.now() - 1000, // Ya expirado
    onExpire: () => {
      console.log('Timer expirado');
    },
  },
};

export const NoExpiration: Story = {
  args: {
    expiraEn: null,
  },
};

