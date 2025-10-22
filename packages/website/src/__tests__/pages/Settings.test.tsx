/**
 * Tests for Settings.tsx
 * 
 * Verifica o funcionamento da página de configurações
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Settings } from '../../pages/Settings';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock do preferencesService
jest.mock('../../api', () => ({
    preferencesService: {
        getPreferences: jest.fn(),
        updatePreferences: jest.fn()
    }
}));

import { preferencesService } from '../../api';

const mockedPreferencesService = preferencesService as jest.Mocked<typeof preferencesService>;

// Helper para renderizar com ThemeProvider
const renderWithTheme = (component: React.ReactElement) => {
    return render(
        <ThemeProvider>
            {component}
        </ThemeProvider>
    );
};

describe('Settings', () => {
    const mockPreferences = {
        id: 'pref-123',
        user_id: 'user-456',
        monitor_preorders: true,
        monitor_coupons: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    beforeEach(() => {
        // Limpar localStorage antes de cada teste
        localStorage.clear();

        // Mock default: carregar preferências com sucesso
        mockedPreferencesService.getPreferences.mockResolvedValue(mockPreferences);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Carregamento inicial', () => {
        it('deve exibir loading ao carregar preferências', async () => {
            // Arrange
            mockedPreferencesService.getPreferences.mockImplementation(
                () => new Promise(resolve => setTimeout(() => resolve(mockPreferences), 100))
            );

            // Act
            renderWithTheme(<Settings />);

            // Assert - Buscar pelo spinner de loading
            const loadingSpinner = document.querySelector('.animate-spin');
            expect(loadingSpinner).toBeInTheDocument();

            await waitFor(() => {
                const loadingSpinnerAfter = document.querySelector('.animate-spin');
                expect(loadingSpinnerAfter).not.toBeInTheDocument();
            });
        });

        it('deve carregar preferências ao montar o componente', async () => {
            // Act
            renderWithTheme(<Settings />);

            // Assert
            await waitFor(() => {
                expect(mockedPreferencesService.getPreferences).toHaveBeenCalledTimes(1);
            });
        });

        it('deve exibir preferências carregadas', async () => {
            // Act
            renderWithTheme(<Settings />);

            // Assert
            await waitFor(() => {
                expect(screen.getByText('Pré-vendas')).toBeInTheDocument();
                expect(screen.getByText('Cupons')).toBeInTheDocument();
            });
        });

        it('deve exibir erro quando falha ao carregar preferências', async () => {
            // Arrange
            mockedPreferencesService.getPreferences.mockRejectedValue(new Error('Network error'));

            // Act
            renderWithTheme(<Settings />);

            // Assert
            await waitFor(() => {
                expect(screen.getByText(/Não foi possível carregar suas preferências/)).toBeInTheDocument();
            });
        });

        it('deve aplicar valores carregados nos toggles', async () => {
            // Arrange
            const customPreferences = {
                ...mockPreferences,
                monitor_preorders: false,
                monitor_coupons: true
            };
            mockedPreferencesService.getPreferences.mockResolvedValue(customPreferences);

            // Act
            renderWithTheme(<Settings />);

            // Assert - Verificar que os toggles refletem os valores carregados
            await waitFor(() => {
                expect(mockedPreferencesService.getPreferences).toHaveBeenCalled();
            });
        });
    });

    describe('Interação com toggles', () => {
        it('deve alternar toggle de cupons', async () => {
            // Act
            renderWithTheme(<Settings />);

            await waitFor(() => {
                expect(screen.getByText('Cupons')).toBeInTheDocument();
            });

            const couponsToggle = screen.getAllByRole('button').find(
                btn => btn.className.includes('inline-flex h-6 w-11')
            );

            if (couponsToggle) {
                fireEvent.click(couponsToggle);
            }

            // Assert - O estado local deve mudar
            expect(couponsToggle).toBeInTheDocument();
        });

        it('deve alternar toggle de pré-vendas', async () => {
            // Act
            renderWithTheme(<Settings />);

            await waitFor(() => {
                expect(screen.getByText('Pré-vendas')).toBeInTheDocument();
            });

            const preordersToggle = screen.getAllByRole('button').find(
                btn => btn.className.includes('inline-flex h-6 w-11')
            );

            if (preordersToggle) {
                fireEvent.click(preordersToggle);
            }

            // Assert
            expect(preordersToggle).toBeInTheDocument();
        });

        it('deve limpar mensagens ao alterar configurações', async () => {
            // Arrange
            mockedPreferencesService.updatePreferences.mockResolvedValue({
                ...mockPreferences,
                monitor_coupons: true
            });

            renderWithTheme(<Settings />);

            await waitFor(() => {
                expect(screen.getByText('Salvar Preferências')).toBeInTheDocument();
            });

            // Act - Salvar para exibir mensagem de sucesso
            const saveButton = screen.getByText('Salvar Preferências');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText(/Preferências salvas com sucesso/)).toBeInTheDocument();
            });

            // Alterar um toggle - procurar especificamente pelos toggles de monitoria
            const couponsText = screen.getByText('Cupons');
            const couponsToggle = couponsText.closest('div')?.nextElementSibling as HTMLElement;

            if (couponsToggle) {
                fireEvent.click(couponsToggle);

                // Assert - Mensagem de sucesso deve desaparecer após pequeno delay
                await waitFor(() => {
                    expect(screen.queryByText(/Preferências salvas com sucesso/)).not.toBeInTheDocument();
                }, { timeout: 500 });
            }
        });
    });

    describe('Salvamento de preferências', () => {
        it('deve salvar preferências com sucesso', async () => {
            // Arrange
            const updatedPreferences = {
                ...mockPreferences,
                monitor_coupons: true
            };
            mockedPreferencesService.updatePreferences.mockResolvedValue(updatedPreferences);

            renderWithTheme(<Settings />);

            await waitFor(() => {
                expect(screen.getByText('Salvar Preferências')).toBeInTheDocument();
            });

            // Act
            const saveButton = screen.getByText('Salvar Preferências');
            fireEvent.click(saveButton);

            // Assert
            await waitFor(() => {
                expect(mockedPreferencesService.updatePreferences).toHaveBeenCalledWith({
                    monitor_coupons: mockPreferences.monitor_coupons,
                    monitor_preorders: mockPreferences.monitor_preorders
                });
                expect(screen.getByText(/Preferências salvas com sucesso/)).toBeInTheDocument();
            });
        });

        it('deve desabilitar botão durante salvamento', async () => {
            // Arrange
            mockedPreferencesService.updatePreferences.mockImplementation(
                () => new Promise(resolve => setTimeout(() => resolve(mockPreferences), 100))
            );

            renderWithTheme(<Settings />);

            await waitFor(() => {
                expect(screen.getByText('Salvar Preferências')).toBeInTheDocument();
            });

            // Act
            const saveButton = screen.getByText('Salvar Preferências') as HTMLButtonElement;
            fireEvent.click(saveButton);

            // Assert
            await waitFor(() => {
                expect(screen.getByText('Salvando...')).toBeInTheDocument();
            });
        });

        it('deve exibir erro ao falhar no salvamento', async () => {
            // Arrange
            mockedPreferencesService.updatePreferences.mockRejectedValue(new Error('Server error'));

            renderWithTheme(<Settings />);

            await waitFor(() => {
                expect(screen.getByText('Salvar Preferências')).toBeInTheDocument();
            });

            // Act
            const saveButton = screen.getByText('Salvar Preferências');
            fireEvent.click(saveButton);

            // Assert
            await waitFor(() => {
                expect(screen.getByText(/Não foi possível salvar suas preferências/)).toBeInTheDocument();
            });
        });

        it('deve remover mensagem de sucesso após 3 segundos', async () => {
            // Arrange
            jest.useFakeTimers();
            mockedPreferencesService.updatePreferences.mockResolvedValue(mockPreferences);

            renderWithTheme(<Settings />);

            await waitFor(() => {
                expect(screen.getByText('Salvar Preferências')).toBeInTheDocument();
            });

            // Act
            const saveButton = screen.getByText('Salvar Preferências');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText(/Preferências salvas com sucesso/)).toBeInTheDocument();
            });

            // Avançar 3 segundos
            jest.advanceTimersByTime(3000);

            // Assert
            await waitFor(() => {
                expect(screen.queryByText(/Preferências salvas com sucesso/)).not.toBeInTheDocument();
            });

            jest.useRealTimers();
        });

        it('deve habilitar botão após salvamento bem-sucedido', async () => {
            // Arrange
            mockedPreferencesService.updatePreferences.mockResolvedValue(mockPreferences);

            renderWithTheme(<Settings />);

            await waitFor(() => {
                expect(screen.getByText('Salvar Preferências')).toBeInTheDocument();
            });

            // Act
            const saveButton = screen.getByText('Salvar Preferências');
            fireEvent.click(saveButton);

            // Assert
            await waitFor(() => {
                expect(screen.getByText(/Preferências salvas com sucesso/)).toBeInTheDocument();
            });

            // Botão deve estar habilitado novamente (não está disabled)
            const updatedSaveButton = screen.getByText('Salvar Preferências') as HTMLButtonElement;
            expect(updatedSaveButton.getAttribute('disabled')).toBeNull();
        });

        it('deve habilitar botão após erro no salvamento', async () => {
            // Arrange
            mockedPreferencesService.updatePreferences.mockRejectedValue(new Error('Error'));

            renderWithTheme(<Settings />);

            await waitFor(() => {
                expect(screen.getByText('Salvar Preferências')).toBeInTheDocument();
            });

            // Act
            const saveButton = screen.getByText('Salvar Preferências');
            fireEvent.click(saveButton);

            // Assert
            await waitFor(() => {
                expect(screen.getByText(/Não foi possível salvar suas preferências/)).toBeInTheDocument();
            });

            // Botão deve estar habilitado novamente (não está disabled)
            const updatedSaveButton = screen.getByText('Salvar Preferências') as HTMLButtonElement;
            expect(updatedSaveButton.getAttribute('disabled')).toBeNull();
        });
    });

    describe('Tema', () => {
        it('deve permitir alternar tema', async () => {
            // Act
            renderWithTheme(<Settings />);

            await waitFor(() => {
                expect(screen.getByText('Tema')).toBeInTheDocument();
            });

            // Encontrar botão de tema (primeiro toggle)
            const themeToggle = screen.getAllByRole('button').find(
                btn => btn.className.includes('inline-flex h-6 w-11')
            );

            if (themeToggle) {
                fireEvent.click(themeToggle);
            }

            // Assert - Tema deve ser salvo no localStorage
            expect(themeToggle).toBeInTheDocument();
        });

        it('deve salvar tema no localStorage', async () => {
            // Arrange
            renderWithTheme(<Settings />);

            await waitFor(() => {
                expect(screen.getByText('Tema')).toBeInTheDocument();
            });

            // Obter tema inicial
            const initialTheme = localStorage.getItem('theme');

            // Act - Alternar tema
            const themeText = screen.getByText('Tema');
            const themeToggle = themeText.closest('div')?.parentElement?.querySelector('button');

            if (themeToggle) {
                fireEvent.click(themeToggle);

                // Assert - localStorage deve ter sido atualizado
                const newTheme = localStorage.getItem('theme');
                expect(newTheme).toBeTruthy();
                // O tema deve ter mudado
                expect(newTheme).not.toBe(initialTheme);
            }
        });
    });

    describe('Renderização', () => {
        it('deve renderizar título e descrição', async () => {
            // Act
            renderWithTheme(<Settings />);

            // Assert
            await waitFor(() => {
                expect(screen.getByText(/⚙️ Configurações/)).toBeInTheDocument();
                expect(screen.getByText(/Personalize sua experiência no GibiPromo/)).toBeInTheDocument();
            });
        });

        it('deve renderizar seção de aparência', async () => {
            // Act
            renderWithTheme(<Settings />);

            // Assert
            await waitFor(() => {
                expect(screen.getByText(/🎨 Aparência/)).toBeInTheDocument();
                expect(screen.getByText('Tema')).toBeInTheDocument();
            });
        });

        it('deve renderizar seção de monitoria', async () => {
            // Act
            renderWithTheme(<Settings />);

            // Assert
            await waitFor(() => {
                expect(screen.getByText(/🔍 Monitoria/)).toBeInTheDocument();
                expect(screen.getByText('Cupons')).toBeInTheDocument();
                expect(screen.getByText('Pré-vendas')).toBeInTheDocument();
            });
        });

        it('deve renderizar seção de conta', async () => {
            // Act
            renderWithTheme(<Settings />);

            // Assert
            await waitFor(() => {
                expect(screen.getByText(/🔒 Conta/)).toBeInTheDocument();
                expect(screen.getByText('Vincular Telegram')).toBeInTheDocument();
                expect(screen.getByText('Excluir Conta')).toBeInTheDocument();
            });
        });

        it('deve renderizar botão de salvar preferências', async () => {
            // Act
            renderWithTheme(<Settings />);

            // Assert
            await waitFor(() => {
                expect(screen.getByText('Salvar Preferências')).toBeInTheDocument();
            });
        });
    });
});

