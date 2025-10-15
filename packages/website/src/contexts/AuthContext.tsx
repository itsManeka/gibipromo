import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService, AuthResponse } from '../api'

/**
 * Dados do usuário autenticado
 */
interface User {
	id: string
	email: string
	enabled: boolean
}

/**
 * Contexto de autenticação
 */
interface AuthContextType {
	user: User | null
	token: string | null
	isAuthenticated: boolean
	isLoading: boolean
	login: (email: string, password: string) => Promise<void>
	register: (email: string, password: string) => Promise<void>
	logout: () => void
	validateSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Provider de autenticação
 * Gerencia estado global de login, persistência e validação de sessão
 */
export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null)
	const [token, setToken] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	/**
	 * Restaura sessão do localStorage ao carregar
	 */
	useEffect(() => {
		const restoreSession = () => {
			try {
				const savedToken = localStorage.getItem('gibipromo_token')
				const savedUser = localStorage.getItem('gibipromo_user')

				if (savedToken && savedUser) {
					setToken(savedToken)
					setUser(JSON.parse(savedUser))
				}
			} catch (error) {
				console.error('Erro ao restaurar sessão:', error)
				// Limpar dados corrompidos
				localStorage.removeItem('gibipromo_token')
				localStorage.removeItem('gibipromo_user')
			} finally {
				setIsLoading(false)
			}
		}

		restoreSession()
	}, [])

	/**
	 * Valida se a sessão atual ainda é válida
	 */
	const validateSession = async () => {
		const savedToken = localStorage.getItem('gibipromo_token')

		if (!savedToken) {
			logout()
			return
		}

		try {
			const isValid = await authService.validateToken(savedToken)

			if (!isValid) {
				logout()
			}
		} catch (error) {
			console.error('Erro ao validar sessão:', error)
			logout()
		}
	}

	/**
	 * Salva dados de autenticação
	 */
	const saveAuthData = (authData: AuthResponse) => {
		// Salvar no localStorage
		localStorage.setItem('gibipromo_token', authData.token)
		localStorage.setItem('gibipromo_user', JSON.stringify(authData.user))

		// Atualizar estado
		setToken(authData.token)
		setUser(authData.user)
	}

	/**
	 * Realiza login do usuário
	 */
	const login = async (email: string, password: string) => {
		setIsLoading(true)

		try {
			const response = await authService.login({ email, password })
			saveAuthData(response)
		} finally {
			setIsLoading(false)
		}
	}

	/**
	 * Registra novo usuário
	 */
	const register = async (email: string, password: string) => {
		setIsLoading(true)

		try {
			const response = await authService.register({ email, password })
			saveAuthData(response)
		} finally {
			setIsLoading(false)
		}
	}

	/**
	 * Realiza logout do usuário
	 */
	const logout = () => {
		// Limpar localStorage
		localStorage.removeItem('gibipromo_token')
		localStorage.removeItem('gibipromo_user')

		// Limpar estado
		setToken(null)
		setUser(null)
	}

	const value: AuthContextType = {
		user,
		token,
		isAuthenticated: !!user && !!token,
		isLoading,
		login,
		register,
		logout,
		validateSession,
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook para consumir o contexto de autenticação
 */
export function useAuth() {
	const context = useContext(AuthContext)

	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider')
	}

	return context
}
