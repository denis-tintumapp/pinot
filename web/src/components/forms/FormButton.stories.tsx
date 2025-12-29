/**
 * Storybook stories para FormButton
 */

import type { Meta, StoryObj } from '@storybook/react';
import { FormButton } from './FormButton';

const meta: Meta<typeof FormButton> = {
  title: 'Forms/FormButton',
  component: FormButton,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
    },
    disabled: {
      control: 'boolean',
    },
    loading: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormButton>;

export const Primary: Story = {
  args: {
    children: 'Iniciar Sesión',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Cancelar',
    variant: 'secondary',
  },
};

export const Danger: Story = {
  args: {
    children: 'Eliminar',
    variant: 'danger',
  },
};

export const Loading: Story = {
  args: {
    children: 'Cargando...',
    variant: 'primary',
    loading: true,
    loadingText: 'Procesando...',
  },
};

export const Disabled: Story = {
  args: {
    children: 'Deshabilitado',
    variant: 'primary',
    disabled: true,
  },
};

