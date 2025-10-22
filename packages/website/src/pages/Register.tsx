import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight, MessageCircle, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function Register() {
	const [formData, setFormData] = useState({
		email: '',
		password: '',
		confirmPassword: ''
	})
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [success, setSuccess] = useState(false)
	const navigate = useNavigate()
	const { register, isLoading, isAuthenticated } = useAuth()

	// Redirecionar se já estiver autenticado
	useEffect(() => {
		if (isAuthenticated && success) {
			setTimeout(() => {
				navigate('/perfil', { replace: true })
			}, 2000)
		}
	}, [isAuthenticated, success, navigate])

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

		if (!formData.confirmPassword) {
			newErrors.confirmPassword = 'Confirmação de senha é obrigatória'
		} else if (formData.password !== formData.confirmPassword) {
			newErrors.confirmPassword = 'Senhas não coincidem'
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!validateForm()) return

		setErrors({})

		try {
			await register(formData.email, formData.password)
			
			// Sucesso - mostrar mensagem e depois redirecionar
			setSuccess(true)
			// O useEffect vai redirecionar após 2 segundos
		} catch (error: any) {
			const errorMessage = error.response?.data?.error || error.message || 'Erro ao criar conta'

			// Mapear erros específicos
			if (errorMessage.includes('already exists') || errorMessage.includes('já existe')) {
				setErrors({ general: 'Este email já está cadastrado' })
			} else if (errorMessage.includes('invalid email') || errorMessage.includes('email inválido')) {
				setErrors({ general: 'Email inválido' })
			} else {
				setErrors({ general: errorMessage })
			}
		}
	}

	if (success) {
		return (
			<div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-hero flex items-center justify-center">
				<div className="max-w-md mx-auto text-center">
					<div className="bg-green-500 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
						<CheckCircle className="h-8 w-8 text-white" />
					</div>
					<h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
						Conta criada com sucesso!
					</h1>
					<p className="text-gray-600 dark:text-primary-light mb-6">
						Redirecionando você para o seu perfil...
					</p>
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-yellow mx-auto"></div>
				</div>
			</div>
		)
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
						Crie sua conta
					</h1>
					<p className="text-gray-600 dark:text-primary-light">
						Junte-se à comunidade de leitores que economizam no GibiPromo
					</p>
				</div>

				{/* Form */}
				<div className="card">
					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Erro geral */}
						{errors.general && (
							<div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-3 flex items-start space-x-2">
								<AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
								<p className="text-red-400 text-sm">{errors.general}</p>
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
								<p className="text-red-400 text-sm mt-1">{errors.email}</p>
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
									autoComplete="new-password"
									placeholder="Mínimo 6 caracteres"
									className={`input pl-10 pr-10 w-full ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
									value={formData.password}
									onChange={handleInputChange}
									disabled={isLoading}
								/>
								<button
									type="button"
									className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-primary-light"
									onClick={() => setShowPassword(!showPassword)}
									disabled={isLoading}
								>
									{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
								</button>
							</div>
							{errors.password && (
								<p className="text-red-400 text-sm mt-1">{errors.password}</p>
							)}
						</div>

						{/* Campo Confirmar Senha */}
						<div>
							<label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-primary-light mb-2">
								Confirmar senha
							</label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-dark-400" />
								<input
									id="confirmPassword"
									name="confirmPassword"
									type={showConfirmPassword ? 'text' : 'password'}
									autoComplete="new-password"
									placeholder="Digite a senha novamente"
									className={`input pl-10 pr-10 w-full ${errors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
									value={formData.confirmPassword}
									onChange={handleInputChange}
									disabled={isLoading}
								/>
								<button
									type="button"
									className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-primary-light"
									onClick={() => setShowConfirmPassword(!showConfirmPassword)}
									disabled={isLoading}
								>
									{showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
								</button>
							</div>
							{errors.confirmPassword && (
								<p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
							)}
						</div>

						{/* Termos */}
						<div className="flex items-start">
							<input
								id="terms"
								type="checkbox"
								required
								className="mt-1 rounded border-dark-600 text-purple-600 focus:ring-purple-500 bg-dark-800"
							/>
							<label htmlFor="terms" className="ml-2 text-sm text-gray-600 dark:text-primary-light">
								Concordo com os{' '}
								<Link to="/termos" className="text-purple-600 dark:text-primary-yellow hover:text-purple-700 dark:hover:text-yellow-400">
									Termos de Uso
								</Link>{' '}
								e{' '}
								<Link to="/privacidade" className="text-purple-600 dark:text-primary-yellow hover:text-purple-700 dark:hover:text-yellow-400">
									Política de Privacidade
								</Link>
							</label>
						</div>

						{/* Botão de Cadastro */}
						<button
							type="submit"
							disabled={isLoading}
							className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoading ? (
								<>
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-dark-950"></div>
									<span>Criando conta...</span>
								</>
							) : (
								<>
									<span>Criar conta</span>
									<ArrowRight className="h-4 w-4" />
								</>
							)}
						</button>
					</form>

					{/* Link para login */}
					<div className="mt-6 text-center">
						<p className="text-gray-600 dark:text-primary-light text-sm">
							Já tem uma conta?{' '}
							<Link
								to="/login"
								className="text-purple-600 dark:text-primary-yellow hover:text-purple-700 dark:hover:text-yellow-400 transition-colors font-medium"
							>
								Faça login
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}