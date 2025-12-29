/**
 * Storybook stories para NotificationContainer
 */

import type { Meta, StoryObj } from '@storybook/react';
import { NotificationContainer } from './NotificationContainer';
import { useUIStore } from '../../stores/uiStore';

// Wrapper para mostrar notificaciones
const NotificationContainerWrapper = () => {
  const addNotification = useUIStore((state) => state.addNotification);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 p-8">
      <div className="max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 space-y-4">
        <h2 className="text-white text-xl font-bold mb-4">Notificaciones</h2>
        
        <button
          onClick={() => addNotification({
            type: 'success',
            message: 'Operación exitosa!',
          })}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
        >
          Mostrar Notificación de Éxito
        </button>

        <button
          onClick={() => addNotification({
            type: 'error',
            message: 'Error al procesar la solicitud',
          })}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
        >
          Mostrar Notificación de Error
        </button>

        <button
          onClick={() => addNotification({
            type: 'info',
            message: 'Información importante para el usuario',
          })}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
        >
          Mostrar Notificación de Info
        </button>

        <button
          onClick={() => addNotification({
            type: 'warning',
            message: 'Advertencia: verifica los datos ingresados',
          })}
          className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700"
        >
          Mostrar Notificación de Advertencia
        </button>

        <NotificationContainer />
      </div>
    </div>
  );
};

const meta: Meta<typeof NotificationContainer> = {
  title: 'UI/NotificationContainer',
  component: NotificationContainerWrapper,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NotificationContainerWrapper>;

export const Interactive: Story = {
  render: () => <NotificationContainerWrapper />,
};

