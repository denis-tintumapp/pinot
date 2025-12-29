/**
 * Storybook stories para PinInput
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { PinInput } from './PinInput';

// Wrapper para usar con React Hook Form
const PinInputWrapper = (args: any) => {
  const { register, formState: { errors } } = useForm({
    defaultValues: {
      pin: '',
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 p-8">
      <div className="max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
        <PinInput
          {...args}
          register={register}
          error={errors.pin}
        />
      </div>
    </div>
  );
};

const meta: Meta<typeof PinInputWrapper> = {
  title: 'Forms/PinInput',
  component: PinInputWrapper,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Componente especializado para entrada de PIN con animación. Compatible con React Hook Form.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PinInputWrapper>;

export const Default: Story = {
  args: {
    name: 'pin',
  },
};

export const WithError: Story = {
  args: {
    name: 'pin',
  },
  render: (args) => {
    const { register, formState: { errors }, setError } = useForm({
      defaultValues: {
        pin: '',
      }
    });

    // Simular error
    React.useEffect(() => {
      setError('pin', { type: 'manual', message: 'PIN inválido' });
    }, [setError]);

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 p-8">
        <div className="max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <PinInput
            {...args}
            register={register}
            error={errors.pin}
          />
        </div>
      </div>
    );
  },
};

export const Disabled: Story = {
  args: {
    name: 'pin',
    disabled: true,
  },
};

