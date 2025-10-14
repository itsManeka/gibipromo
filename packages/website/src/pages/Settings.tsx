import React, { useState } from 'react'
import { Save, Bell, Moon, Sun, Volume2, Smartphone, Mail } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

export function Settings() {
	const { theme, toggleTheme } = useTheme()
	const [settings, setSettings] = useState({
		monitor_coupons: true,
		monitor_preorders: false,
	})

	const handleMonitorCoupons = (key: string, value: boolean) => {
		setSettings(prev => ({
			...prev,
			monitor_coupons: value
		}))
	}

	const handleMonitorPreorders = (key: string, value: boolean) => {
		setSettings(prev => ({
			...prev,
			monitor_preorders: value
		}))
	}

	const handleSave = () => {
		// Aqui seria feita a chamada para a API
		console.log('Salvando configurações:', settings)
		// Mostrar feedback de sucesso
	}

	return (
		<div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-display font-bold text-white mb-2">
						⚙️ Configurações
					</h1>
					<p className="text-primary-light">
						Personalize sua experiência no GibiPromo
					</p>
				</div>

				<div className="space-y-8">
					{/* Aparência */}
					<div className="card">
						<h2 className="text-xl font-semibold text-white mb-6">
							🎨 Aparência
						</h2>

						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-3">
									<div className="bg-purple-600 rounded-full p-2">
										{theme === 'dark' ? (
											<Moon className="h-5 w-5 text-white" />
										) : (
											<Sun className="h-5 w-5 text-white" />
										)}
									</div>
									<div>
										<p className="text-white font-medium">Tema</p>
										<p className="text-sm text-primary-light">
											{theme === 'dark' ? 'Modo escuro ativo' : 'Modo claro ativo'}
										</p>
									</div>
								</div>
								<button
									onClick={toggleTheme}
									className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${theme === 'dark' ? 'bg-purple-600' : 'bg-gray-300'
										}`}
								>
									<span
										className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
											}`}
									/>
								</button>
							</div>
						</div>
					</div>

					{/* Monitoria */}
					<div className="card">
						<h2 className="text-xl font-semibold text-white mb-6">
							🔍 Monitoria
						</h2>

						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-white font-medium">Cupons</p>
									<p className="text-sm text-primary-light">
										Receber notificações de cupons disponíveis
									</p>
								</div>
								<button
									onClick={() => handleMonitorCoupons('monitor_coupons', !settings.monitor_coupons)}
									className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.monitor_coupons ? 'bg-purple-600' : 'bg-gray-600'
										}`}
								>
									<span
										className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.monitor_coupons ? 'translate-x-6' : 'translate-x-1'
											}`}
									/>
								</button>
							</div>

							<div className="flex items-center justify-between">
								<div>
									<p className="text-white font-medium">Pré-vendas</p>
									<p className="text-sm text-primary-light">
										Receber notificações de pré-vendas de lançamentos
									</p>
								</div>
								<button
									onClick={() => handleMonitorPreorders('monitor_preorders', !settings.monitor_preorders)}
									className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.monitor_preorders ? 'bg-purple-600' : 'bg-gray-600'
										}`}
								>
									<span
										className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.monitor_preorders ? 'translate-x-6' : 'translate-x-1'
											}`}
									/>
								</button>
							</div>
						</div>
						{/* Divisor */}
						<hr className="my-6 border-dark-700" />
						{/* Botão Salvar */}
						<div className="flex justify-end">
							<button
								onClick={handleSave}
								className="btn-primary inline-flex items-center space-x-2"
							>
								<Save className="h-5 w-5" />
								<span>Salvar Preferências</span>
							</button>
						</div>
					</div>

					{/* Conta */}
					<div className="card">
						<h2 className="text-xl font-semibold text-white mb-6">
							🔒 Conta
						</h2>

						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<button className="w-full btn-secondary text-sm py-2">
									Vincular Telegram
								</button>
							</div>
							<button className="w-full btn-ghost text-sm py-2 text-red-400 hover:text-red-300">
								Excluir Conta
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}