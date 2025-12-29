/**
 * Storybook stories para FormTextarea
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { FormTextarea } from './FormTextarea';

// Wrapper para usar con React Hook Form
const FormTextareaWrapper = (args: any) => {
  const { register, formState: { errors } } = useForm({
    defaultValues: {
      descripcion: '',
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 p-8">
      <div className="max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
        <FormTextarea
          {...args}
          register={register}
          error={errors[args.name as keyof typeof errors]}
        />
      </div>
    </div>
  );
};

const meta: Meta<typeof FormTextarea> = {
  title: 'Forms/FormTextarea',
  component: FormTextareaWrapper,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    required: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    rows: {
      control: 'number',
    },
    showCharCount: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormTextareaWrapper>;

export const Default: Story = {
  args: {
    label: 'Descripción',
    name: 'descripcion',
    placeholder: 'Escribe una descripción...',
    rows: 4,
  },
};

export const WithCharCount: Story = {
  args: {
    label: 'Comentario',
    name: 'descripcion',
    placeholder: 'Escribe un comentario...',
    rows: 4,
    maxLength: 200,
    showCharCount: true,
    value: 'Este es un comentario de ejemplo',
  },
};

export const WithError: Story = {
  args: {
    label: 'Descripción',
    name: 'descripcion',
    placeholder: 'Escribe una descripción...',
    rows: 4,
    required: true,
    error: {
      type: 'validation',
      message: 'La descripción es requerida',
    },
  },
};

export const Disabled: Story = {
  args: {
    label: 'Descripción',
    name: 'descripcion',
    placeholder: 'No se puede editar',
    rows: 4,
    disabled: true,
    value: 'Este campo está deshabilitado',
  },
};

