/**
 * Storybook stories para FormSelect
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { FormSelect } from './FormSelect';

// Wrapper para usar con React Hook Form
const FormSelectWrapper = (args: any) => {
  const { register, formState: { errors } } = useForm({
    defaultValues: {
      tipo: '',
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 p-8">
      <div className="max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
        <FormSelect
          {...args}
          register={register}
          error={errors[args.name as keyof typeof errors]}
        />
      </div>
    </div>
  );
};

const meta: Meta<typeof FormSelect> = {
  title: 'Forms/FormSelect',
  component: FormSelectWrapper,
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
  },
};

export default meta;
type Story = StoryObj<typeof FormSelectWrapper>;

const options = [
  { value: 'efimero', label: 'Efímero' },
  { value: 'permanente', label: 'Permanente' },
  { value: 'miembro', label: 'Miembro' },
];

export const Default: Story = {
  args: {
    label: 'Tipo de Usuario',
    name: 'tipo',
    options,
    placeholder: 'Selecciona un tipo',
    required: true,
  },
};

export const WithError: Story = {
  args: {
    label: 'Tipo de Usuario',
    name: 'tipo',
    options,
    placeholder: 'Selecciona un tipo',
    required: true,
    error: {
      type: 'validation',
      message: 'Debes seleccionar un tipo',
    },
  },
};

export const Disabled: Story = {
  args: {
    label: 'Tipo de Usuario',
    name: 'tipo',
    options,
    placeholder: 'Selecciona un tipo',
    disabled: true,
  },
};

