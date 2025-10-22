import React, { useState, useEffect } from 'react'
import { Save, Bell, Moon, Sun, Volume2, Smartphone, Mail, CheckCircle, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useLinkStatus } from '../hooks/useLinkStatus'
import { preferencesService } from '../api'
import LinkTelegramButton from '../components/LinkTelegramButton'

export function Settings() {
	const { theme, toggleTheme } = useTheme()
	const { isLinking } = useLinkStatus()
	const [settings, setSettings] = useState({
		monitor_coupons: true,
		monitor_preorders: false,
	})
	const [loading, setLoading] = useState(false)
	const [initialLoading, setInitialLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)

	// Carregar preferências ao montar o componente
	useEffect(() => {
		loadPreferences()
	}, [])

	const loadPreferences = async () => {
		try {
			setInitialLoading(true)
			setError(null)
			const preferences = await preferencesService.getPreferences()
			setSettings({
				monitor_coupons: preferences.monitor_coupons,
				monitor_preorders: preferences.monitor_preorders,
			})
		} catch (err) {
			console.error('Erro ao carregar preferências:', err)
			setError('Não foi possível carregar suas preferências. Tente novamente.')
		} finally {
			setInitialLoading(false)
		}
	}

	const handleMonitorCoupons = (key: string, value: boolean) => {
		setSettings(prev => ({
			...prev,
			monitor_coupons: value
		}))
		// Limpar mensagens ao alterar configurações
		setSuccess(null)
		setError(null)
	}

	const handleMonitorPreorders = (key: string, value: boolean) => {
		setSettings(prev => ({
			...prev,
			monitor_preorders: value
		}))
		// Limpar mensagens ao alterar configurações
		setSuccess(null)
		setError(null)
	}

	const handleSave = async () => {
		try {
			setLoading(true)
			setError(null)
			setSuccess(null)

			await preferencesService.updatePreferences({
				monitor_coupons: settings.monitor_coupons,
				monitor_preorders: settings.monitor_preorders,
			})

			setSuccess('Preferências salvas com sucesso!')

			// Limpar mensagem de sucesso após 3 segundos
			setTimeout(() => {
				setSuccess(null)
			}, 3000)
		} catch (err) {
			console.error('Erro ao salvar preferências:', err)
			setError('Não foi possível salvar suas preferências. Tente novamente.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
						⚙️ Configurações
					</h1>
					<p className="text-gray-600 dark:text-primary-light">
						Personalize sua experiência no GibiPromo
					</p>
				</div>

				{/* Mensagens de Feedback */}
				{isLinking && (
					<div className="mb-6 p-4 bg-blue-100 dark:bg-blue-900/20 border border-blue-400 dark:border-blue-700 rounded-lg flex items-center space-x-3">
						<AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
						<span className="text-blue-800 dark:text-blue-300">
							⏳ Vínculo em andamento. Aguarde a conclusão para alterar configurações.
						</span>
					</div>
				)}

				{success && (
					<div className="mb-6 p-4 bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-700 rounded-lg flex items-center space-x-3">
						<CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
						<span className="text-green-800 dark:text-green-300">{success}</span>
					</div>
				)}

				{error && (
					<div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 rounded-lg flex items-center space-x-3">
						<AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
						<span className="text-red-800 dark:text-red-300">{error}</span>
					</div>
				)}

				{/* Loading inicial */}
				{initialLoading ? (
					<div className="card">
						<div className="flex items-center justify-center py-12">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
						</div>
					</div>
				) : (
					<div className="space-y-8">
						{/* Aparência */}
						<div className="card">
							<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
								🎨 Aparência
							</h2>

							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-3">
										<div className="bg-purple-600 rounded-full p-2">
											{theme === 'dark' ? (
												<Moon className="h-5 w-5 text-white dark:text-white" />
											) : (
												<Sun className="h-5 w-5 text-white dark:text-white" />
											)}
										</div>
										<div>
											<p className="text-gray-900 dark:text-white font-medium">Tema</p>
											<p className="text-sm text-gray-600 dark:text-primary-light">
												{theme === 'dark' ? 'Modo escuro ativo' : 'Modo claro ativo'}
											</p>
										</div>
									</div>
									<button
										onClick={toggleTheme}
										className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${theme === 'dark' ? 'bg-purple-600' : 'bg-gray-600'
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
							<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
								🔍 Monitoria
							</h2>

							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-gray-900 dark:text-white font-medium">Cupons</p>
										<p className="text-sm text-gray-600 dark:text-primary-light">
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
										<p className="text-gray-900 dark:text-white font-medium">Pré-vendas</p>
										<p className="text-sm text-gray-600 dark:text-primary-light">
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
									disabled={loading || isLinking}
									className="btn-primary inline-flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{loading ? (
										<>
											<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
											<span>Salvando...</span>
										</>
									) : (
										<>
											<Save className="h-5 w-5" />
											<span>Salvar Preferências</span>
										</>
									)}
								</button>
							</div>
						</div>

						{/* Conta */}
						<div className="card">
							<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
								🔒 Conta
							</h2>

							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<LinkTelegramButton />
								</div>
								<button className="w-full btn-ghost text-sm py-2 text-red-400 dark:text-red-400 hover:text-red-300 dark:hover:text-red-600">
									Excluir Conta
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}