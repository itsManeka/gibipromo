import React from 'react'
import { Link } from 'react-router-dom'
import { Home, BookOpen, ArrowLeft } from 'lucide-react'

export function NotFound() {
	return (
		<div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full text-center">
				{/* Ilustração de erro */}
				<div className="mb-8">
					<div className="bg-gradient-card rounded-3xl p-8 mx-auto w-fit">
						<div className="bg-dark-800 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
							<BookOpen className="h-12 w-12 text-primary-light opacity-50" />
						</div>
						<div className="text-6xl font-bold text-primary-yellow mb-2">404</div>
					</div>
				</div>

				{/* Conteúdo */}
				<div className="space-y-4 mb-8">
					<h1 className="text-2xl font-display font-bold text-white">
						Página não encontrada
					</h1>
					<p className="text-primary-light leading-relaxed">
						Ops! Parece que nossa gatinha não conseguiu encontrar essa página.
						Ela deve estar ocupada procurando promoções incríveis para você! 🐱
					</p>
				</div>

				{/* Ações */}
				<div className="space-y-4">
					<Link
						to="/"
						className="btn-primary inline-flex items-center space-x-2 w-full justify-center"
					>
						<Home className="h-5 w-5" />
						<span>Voltar ao Início</span>
					</Link>

					<button
						onClick={() => window.history.back()}
						className="btn-ghost inline-flex items-center space-x-2 w-full justify-center"
					>
						<ArrowLeft className="h-5 w-5" />
						<span>Página Anterior</span>
					</button>
				</div>

				{/* Links úteis */}
				<div className="mt-12 pt-8 border-t border-dark-700">
					<p className="text-primary-light text-sm mb-4">
						Ou explore essas seções populares:
					</p>
					<div className="flex justify-center space-x-6 text-sm">
						<Link
							to="/promocoes"
							className="text-primary-yellow hover:text-yellow-400 transition-colors"
						>
							Promoções
						</Link>
						<Link
							to="/perfil"
							className="text-primary-yellow hover:text-yellow-400 transition-colors"
						>
							Meu Perfil
						</Link>
						<Link
							to="/configuracoes"
							className="text-primary-yellow hover:text-yellow-400 transition-colors"
						>
							Configurações
						</Link>
					</div>
				</div>
			</div>
		</div>
	)
}