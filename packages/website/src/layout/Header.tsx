import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, BookOpen, Settings, User, Home, Tag } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

export function Header() {
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const location = useLocation()
	const { theme, toggleTheme } = useTheme()

	const navigation = [
		{ name: 'Início', href: '/', icon: Home },
		{ name: 'Promoções', href: '/promocoes', icon: Tag },
		{ name: 'Perfil', href: '/perfil', icon: User },
		{ name: 'Configurações', href: '/configuracoes', icon: Settings },
	]

	const isActive = (path: string) => location.pathname === path

	return (
		<header className="bg-purple-600 text-white shadow-lg sticky top-0 z-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					{/* Logo */}
					<Link to="/" className="flex items-center space-x-3 group">
						<div className="bg-primary-yellow rounded-full group-hover:bg-yellow-400 transition-colors">
							<img src="/images/logo.png" alt="Gibi" className="h-12 w-12 rounded-full" />
						</div>
						<span className="text-xl font-display font-bold text-white group-hover:text-primary-yellow transition-colors">
							GibiPromo
						</span>
					</Link>

					{/* Desktop Navigation */}
					<nav className="hidden md:flex items-center space-x-8">
						{navigation.map((item) => {
							const Icon = item.icon
							return (
								<Link
									key={item.name}
									to={item.href}
									className={`nav-link flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${isActive(item.href)
											? 'nav-link-active bg-purple-700'
											: 'hover:bg-purple-700'
										}`}
								>
									<Icon className="h-4 w-4" />
									<span>{item.name}</span>
								</Link>
							)
						})}

						{/* Auth Links */}
						<div className="flex items-center space-x-4 border-l border-purple-500 pl-4">
							<Link
								to="/login"
								className={`nav-link px-3 py-2 rounded-lg transition-all duration-200 ${
									isActive('/login') 
										? 'nav-link-active bg-purple-700' 
										: 'hover:bg-purple-700'
								}`}
							>
								Entrar
							</Link>
							<Link
								to="/registro"
								className="btn-primary text-sm py-2 px-4"
							>
								Cadastrar
							</Link>
						</div>

						{/* Theme Toggle */}
						<button
							onClick={toggleTheme}
							className="p-2 rounded-lg hover:bg-purple-700 transition-colors"
							title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
						>
							{theme === 'dark' ? '🌞' : '🌙'}
						</button>
					</nav>

					{/* Mobile menu button */}
					<div className="md:hidden">
						<button
							onClick={() => setIsMenuOpen(!isMenuOpen)}
							className="p-2 rounded-lg hover:bg-purple-700 transition-colors"
						>
							{isMenuOpen ? (
								<X className="h-6 w-6" />
							) : (
								<Menu className="h-6 w-6" />
							)}
						</button>
					</div>
				</div>
			</div>

			{/* Mobile Navigation */}
			{isMenuOpen && (
				<div className="md:hidden bg-purple-700 border-t border-purple-500">
					<div className="px-2 pt-2 pb-3 space-y-1">
						{navigation.map((item) => {
							const Icon = item.icon
							return (
								<Link
									key={item.name}
									to={item.href}
									onClick={() => setIsMenuOpen(false)}
									className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${isActive(item.href)
											? 'bg-purple-800 text-primary-yellow'
											: 'text-white hover:bg-purple-600'
										}`}
								>
									<Icon className="h-5 w-5" />
									<span className="font-medium">{item.name}</span>
								</Link>
							)
						})}

						{/* Mobile Auth Links */}
						<div className="border-t border-purple-500 pt-3 mt-3 space-y-1">
							<Link
								to="/login"
								onClick={() => setIsMenuOpen(false)}
								className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
									isActive('/login') 
										? 'bg-purple-800 text-primary-yellow' 
										: 'text-white hover:bg-purple-600'
								}`}
							>
								<User className="h-5 w-5" />
								<span className="font-medium">Entrar</span>
							</Link>
							<Link
								to="/registro"
								onClick={() => setIsMenuOpen(false)}
								className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-primary-yellow text-dark-950 hover:bg-yellow-400 transition-colors font-medium"
							>
								<User className="h-5 w-5" />
								<span>Cadastrar</span>
							</Link>
						</div>

						{/* Mobile Theme Toggle */}
						<button
							onClick={() => {
								toggleTheme()
								setIsMenuOpen(false)
							}}
							className="flex items-center space-x-3 px-3 py-2 rounded-lg text-white hover:bg-purple-600 transition-colors w-full"
						>
							<span className="text-lg">{theme === 'dark' ? '🌞' : '🌙'}</span>
							<span className="font-medium">
								{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
							</span>
						</button>
					</div>
				</div>
			)}
		</header>
	)
}