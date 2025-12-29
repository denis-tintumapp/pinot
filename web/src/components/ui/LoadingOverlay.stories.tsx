/**
 * Storybook stories para LoadingOverlay
 */

import type { Meta, StoryObj } from '@storybook/react';
import { LoadingOverlay } from './LoadingOverlay';
import { useUIStore } from '../../stores/uiStore';

// Wrapper para mostrar loading overlay
const LoadingOverlayWrapper = () => {
  const setGlobalLoading = useUIStore((state) => state.setGlobalLoading);
  const globalLoading = useUIStore((state) => state.globalLoading);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 p-8">
      <div className="max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 space-y-4">
        <h2 className="text-white text-xl font-bold mb-4">Loading Overlay</h2>
        
        <button
          onClick={() => setGlobalLoading(true, 'Cargando datos...')}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700"
        >
          Mostrar Loading Overlay
        </button>

        <button
          onClick={() => setGlobalLoading(false)}
          className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
        >
          Ocultar Loading Overlay
        </button>

        <p className="text-white/80 text-sm">
          Estado: {globalLoading ? 'Cargando' : 'Oculto'}
        </p>

        <LoadingOverlay />
      </div>
    </div>
  );
};

const meta: Meta<typeof LoadingOverlay> = {
  title: 'UI/LoadingOverlay',
  component: LoadingOverlayWrapper,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LoadingOverlayWrapper>;

export const Interactive: Story = {
  render: () => <LoadingOverlayWrapper />,
};

