import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, BookOpen, ArrowRight, MessageCircle } from 'lucide-react'

// Mock data para demonstração
const mockUser = {
	email: 'usuario@exemplo.com',
	password: '123456',
}

export function Login() {
	const [formData, setFormData] = useState({
		email: '',
		password: ''
	})
	const [showPassword, setShowPassword] = useState(false)
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [isLoading, setIsLoading] = useState(false)
	const navigate = useNavigate()

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		setFormData(prev => ({
			...prev,
			[name]: value
		}))

		// Limpar erro quando usuário digita
		if (errors[name]) {
			setErrors(prev => ({
				...prev,
				[name]: ''
			}))
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

		setIsLoading(true)
		setErrors({})

		try {
			// Simular chamada de API
			await new Promise(resolve => setTimeout(resolve, 1500))

			// Mock de validação
			if (formData.email === mockUser.email && formData.password === mockUser.password) {
				// Login bem-sucedido
				console.log('Login realizado com sucesso:', { email: formData.email })

				// Simular armazenamento do token
				localStorage.setItem('gibipromo_token', 'mock_jwt_token_12345')
				localStorage.setItem('gibipromo_user', JSON.stringify(mockUser))

				// Redirecionar para o perfil
				navigate('/perfil')
			} else {
				setErrors({ general: 'Email ou senha incorretos' })
			}
		} catch (error) {
			setErrors({ general: 'Erro ao fazer login. Tente novamente.' })
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-hero">
			<div className="max-w-md mx-auto">
				{/* Header */}
				<div className="text-center mb-8">
					<div className="bg-primary-yellow rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
						<img src="/images/logo.png" alt="Gibi" className="h-14 w-14 rounded-full" />
					</div>
					<h1 className="text-3xl font-display font-bold text-white mb-2">
						Bem-vindo de volta!
					</h1>
					<p className="text-primary-light">
						Entre na sua conta para acompanhar suas promoções favoritas
					</p>
				</div>

				{/* Form */}
				<div className="card">
					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Erro geral */}
						{errors.general && (
							<div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-3">
								<p className="text-red-400 text-sm">{errors.general}</p>
							</div>
						)}

						{/* Campo Email */}
						<div>
							<label htmlFor="email" className="block text-sm font-medium text-primary-light mb-2">
								Email
							</label>
							<div className="relative">
								<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-dark-400" />
								<input
									id="email"
									name="email"
									type="email"
									autoComplete="email"
									placeholder="seu@email.com"
									className={`input pl-10 w-full ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
									value={formData.email}
									onChange={handleInputChange}
								/>
							</div>
							{errors.email && (
								<p className="text-red-400 text-sm mt-1">{errors.email}</p>
							)}
						</div>

						{/* Campo Senha */}
						<div>
							<label htmlFor="password" className="block text-sm font-medium text-primary-light mb-2">
								Senha
							</label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-dark-400" />
								<input
									id="password"
									name="password"
									type={showPassword ? 'text' : 'password'}
									autoComplete="current-password"
									placeholder="Sua senha"
									className={`input pl-10 pr-10 w-full ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
									value={formData.password}
									onChange={handleInputChange}
								/>
								<button
									type="button"
									className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-primary-light"
									onClick={() => setShowPassword(!showPassword)}
								>
									{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
								</button>
							</div>
							{errors.password && (
								<p className="text-red-400 text-sm mt-1">{errors.password}</p>
							)}
						</div>

						{/* Opções */}
						<div className="flex items-center justify-between">
							<label className="flex items-center">
								<input
									type="checkbox"
									className="rounded border-dark-600 text-purple-600 focus:ring-purple-500 bg-dark-800"
								/>
								<span className="ml-2 text-sm text-primary-light">Lembrar de mim</span>
							</label>
							<Link
								to="/esqueci-senha"
								className="text-sm text-primary-yellow hover:text-yellow-400 transition-colors"
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
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-dark-950"></div>
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
						<p className="text-primary-light text-sm">
							Ainda não tem uma conta?{' '}
							<Link
								to="/registro"
								className="text-primary-yellow hover:text-yellow-400 transition-colors font-medium"
							>
								Cadastre-se grátis
							</Link>
						</p>
					</div>
				</div>

				{/* Informações sobre o Mock */}
				<div className="mt-8 p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
					<h3 className="text-blue-400 font-medium mb-2">💡 Demo - Dados para Teste</h3>
					<div className="text-blue-300 text-sm space-y-1">
						<p><strong>Email:</strong> usuario@exemplo.com</p>
						<p><strong>Senha:</strong> 123456</p>
						<p className="text-xs text-blue-400 mt-2">
							Use estes dados para testar o login na demonstração
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}