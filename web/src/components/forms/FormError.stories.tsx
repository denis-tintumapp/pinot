/**
 * Storybook stories para FormError
 */

import type { Meta, StoryObj } from '@storybook/react';
import { FormError } from './FormError';

const meta: Meta<typeof FormError> = {
  title: 'Forms/FormError',
  component: FormError,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['error', 'success', 'info'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormError>;

export const Error: Story = {
  args: {
    message: 'Error al iniciar sesión. Verifica tus credenciales.',
    type: 'error',
  },
};

export const Success: Story = {
  args: {
    message: '¡Registro exitoso! Te hemos enviado un email con tu contraseña temporal.',
    type: 'success',
  },
};

export const Info: Story = {
  args: {
    message: 'Recibirás una contraseña temporal de 6 caracteres alfanuméricos por correo',
    type: 'info',
  },
};

export const LongMessage: Story = {
  args: {
    message: 'Este es un mensaje de error más largo que puede contener múltiples líneas de texto para explicar al usuario qué salió mal y cómo puede solucionarlo.',
    type: 'error',
  },
};

