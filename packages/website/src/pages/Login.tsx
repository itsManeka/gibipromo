import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, MessageCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function Login() {
	const [formData, setFormData] = useState({
		email: '',
		password: ''
	})
	const [showPassword, setShowPassword] = useState(false)
	const [errors, setErrors] = useState<Record<string, string>>({})
	const navigate = useNavigate()
	const location = useLocation()
	const { login, isLoading, isAuthenticated } = useAuth()

	// Redirecionar se já estiver autenticado
	useEffect(() => {
		if (isAuthenticated) {
			const from = (location.state as any)?.from?.pathname || '/perfil'
			navigate(from, { replace: true })
		}
	}, [isAuthenticated, navigate, location])

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		setFormData(prev => ({ ...prev, [name]: value }))

		if (errors[name]) {
			setErrors(prev => ({ ...prev, [name]: '' }))
		}
	}

	const validateForm = () => {
		const newErrors: Record<string, string> = {}

		if (!formData.email) {
			newErrors.email = 'Email é obrigatório'
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = 'Email inválido'
		}

		if (!formData.password) {
			newErrors.password = 'Senha é obrigatória'
		} else if (formData.password.length < 6) {
			newErrors.password = 'Senha deve ter pelo menos 6 caracteres'
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!validateForm()) return

		setErrors({})

		try {
			await login(formData.email, formData.password)
			// Sucesso - o useEffect acima vai redirecionar automaticamente
		} catch (error: any) {
			const errorMessage = error.response?.data?.error || error.message || 'Erro ao fazer login'

			// Mapear erros específicos
			if (errorMessage.includes('Invalid credentials') || errorMessage.includes('incorretos')) {
				setErrors({ general: 'Email ou senha incorretos' })
			} else if (errorMessage.includes('disabled') || errorMessage.includes('desabilitada')) {
				setErrors({ general: 'Conta desabilitada. Entre em contato com o suporte.' })
			} else if (errorMessage.includes('not found') || errorMessage.includes('não encontrado')) {
				setErrors({ general: 'Usuário não encontrado' })
			} else {
				setErrors({ general: errorMessage })
			}
		}
	}

	return (
		<div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-hero">
			<div className="max-w-md mx-auto">
				{/* Header */}
				<div className="text-center mb-8">
					<div className="bg-primary-purple dark:bg-primary-yellow rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
						<img src="/images/logo.png" alt="Gibi" className="h-14 w-14 rounded-full" />
					</div>
					<h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
						Bem-vindo de volta!
					</h1>
					<p className="text-gray-600 dark:text-primary-light">
						Entre na sua conta para acompanhar suas promoções favoritas
					</p>
				</div>

				{/* Form */}
				<div className="card">
					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Erro geral */}
						{errors.general && (
							<div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-3 flex items-start space-x-2">
								<AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
								<p className="text-red-600 dark:text-red-400 text-sm">{errors.general}</p>
							</div>
						)}

						{/* Campo Email */}
						<div>
							<label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-primary-light mb-2">
								Email
							</label>
							<div className="relative">
								<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-dark-400" />
								<input
									id="email"
									name="email"
									type="email"
									autoComplete="email"
									placeholder="seu@email.com"
									className={`input pl-10 w-full ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
									value={formData.email}
									onChange={handleInputChange}
									disabled={isLoading}
								/>
							</div>
							{errors.email && (
								<p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.email}</p>
							)}
						</div>

						{/* Campo Senha */}
						<div>
							<label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-primary-light mb-2">
								Senha
							</label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-dark-400" />
								<input
									id="password"
									name="password"
									type={showPassword ? 'text' : 'password'}
									autoComplete="current-password"
									placeholder="Sua senha"
									className={`input pl-10 pr-10 w-full ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
									value={formData.password}
									onChange={handleInputChange}
									disabled={isLoading}
								/>
								<button
									type="button"
									className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-primary-light"
									onClick={() => setShowPassword(!showPassword)}
									disabled={isLoading}
								>
									{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
								</button>
							</div>
							{errors.password && (
								<p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.password}</p>
							)}
						</div>

						{/* Opções */}
						<div className="flex items-center justify-between">
							<label className="flex items-center">
								<input
									type="checkbox"
									className="rounded border-gray-300 dark:border-dark-600 text-purple-600 focus:ring-purple-500 bg-gray-100 dark:bg-dark-800"
								/>
								<span className="ml-2 text-sm text-gray-700 dark:text-primary-light">Lembrar de mim</span>
							</label>
							<Link
								to="/esqueci-senha"
								className="text-sm text-purple-600 dark:text-primary-yellow hover:text-purple-700 dark:hover:text-yellow-400 transition-colors"
							>
								Esqueci minha senha
							</Link>
						</div>

						{/* Botão de Login */}
						<button
							type="submit"
							disabled={isLoading}
							className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoading ? (
								<>
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
									<span>Entrando...</span>
								</>
							) : (
								<>
									<span>Entrar</span>
									<ArrowRight className="h-4 w-4" />
								</>
							)}
						</button>
					</form>

					{/* Link para cadastro */}
					<div className="mt-6 text-center">
						<p className="text-gray-600 dark:text-primary-light text-sm">
							Ainda não tem uma conta?{' '}
							<Link
								to="/registro"
								className="text-purple-600 dark:text-primary-yellow hover:text-purple-700 dark:hover:text-yellow-400 transition-colors font-medium"
							>
								Cadastre-se grátis
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}