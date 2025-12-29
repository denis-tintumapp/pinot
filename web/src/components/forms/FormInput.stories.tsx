/**
 * Storybook stories para FormInput
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { FormInput } from './FormInput';

// Wrapper para usar con React Hook Form
const FormInputWrapper = (args: any) => {
  const { register, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
      password: '',
      nombre: '',
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 p-8">
      <div className="max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
        <FormInput
          {...args}
          register={register}
          error={errors[args.name as keyof typeof errors]}
        />
      </div>
    </div>
  );
};

const meta: Meta<typeof FormInput> = {
  title: 'Forms/FormInput',
  component: FormInputWrapper,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
    },
    required: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    showCharCount: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormInputWrapper>;

export const Default: Story = {
  args: {
    label: 'Correo Electrónico',
    name: 'email',
    type: 'email',
    placeholder: 'tu@email.com',
    required: true,
    autoComplete: 'email',
  },
};

export const WithError: Story = {
  args: {
    label: 'Correo Electrónico',
    name: 'email',
    type: 'email',
    placeholder: 'tu@email.com',
    required: true,
    error: {
      type: 'validation',
      message: 'El email debe tener formato válido',
    },
  },
};

export const Password: Story = {
  args: {
    label: 'Contraseña',
    name: 'password',
    type: 'password',
    placeholder: 'Tu contraseña',
    required: true,
    autoComplete: 'current-password',
  },
};

export const WithCharCount: Story = {
  args: {
    label: 'Alias',
    name: 'nombre',
    type: 'text',
    placeholder: 'Ej: Juan, María',
    required: true,
    maxLength: 20,
    showCharCount: true,
    value: 'Test',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Campo Deshabilitado',
    name: 'nombre',
    type: 'text',
    placeholder: 'No se puede editar',
    disabled: true,
    value: 'Valor fijo',
  },
};

