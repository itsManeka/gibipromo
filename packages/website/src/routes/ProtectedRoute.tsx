import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
	children: React.ReactNode
}

/**
 * Componente de rota protegida
 * Bloqueia acesso a páginas que requerem autenticação
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
	const { isAuthenticated, isLoading } = useAuth()
	const location = useLocation()

	// Mostrar loading enquanto verifica autenticação
	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-dark-950">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-yellow mx-auto mb-4"></div>
					<p className="text-primary-light">Verificando autenticação...</p>
				</div>
			</div>
		)
	}

	// Redirecionar para login se não autenticado
	if (!isAuthenticated) {
		// Salvar rota desejada para redirect após login
		return <Navigate to="/login" state={{ from: location }} replace />
	}

	// Usuário autenticado - renderizar conteúdo protegido
	return <>{children}</>
}
