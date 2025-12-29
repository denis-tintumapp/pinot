/**
 * Storybook stories para BottomNavigation
 */

import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';

const meta: Meta<typeof BottomNavigation> = {
  title: 'Navigation/BottomNavigation',
  component: BottomNavigation,
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/']}>
        <div className="min-h-screen bg-gray-50">
          <div className="pb-20">
            <p className="p-4">Contenido de la página</p>
          </div>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Navegación inferior de la aplicación con iconos para Inicio, Explorar, Favoritos y Perfil.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof BottomNavigation>;

export const Default: Story = {};

export const OnHomePage: Story = {
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/']}>
        <div className="min-h-screen bg-gray-50">
          <div className="pb-20">
            <p className="p-4">Página de inicio</p>
          </div>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};

export const OnExplorePage: Story = {
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/explore']}>
        <div className="min-h-screen bg-gray-50">
          <div className="pb-20">
            <p className="p-4">Página de explorar</p>
          </div>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};

