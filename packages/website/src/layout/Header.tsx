import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Settings, User, Home, Tag, LogOut, ChevronDown, Plus } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import NotificationBell from '../components/NotificationBell'

export function Header() {
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
	const location = useLocation()
	const navigate = useNavigate()
	const { theme, toggleTheme } = useTheme()
	const { user, isAuthenticated, logout } = useAuth()
	const { profile } = useProfile()

	const navigation = [
		{ name: 'Início', href: '/', icon: Home, public: true },
		{ name: 'Promoções', href: '/promocoes', icon: Tag, public: true },
		{ name: 'Adicionar Produtos', href: '/adicionar-produtos', icon: Plus, public: false }
	]

	const mobileNavigation = [
		...navigation,
		{ name: 'Perfil', href: '/perfil', icon: User, public: false },
		{ name: 'Configurações', href: '/configuracoes', icon: Settings, public: false },
	]

	const isActive = (path: string) => location.pathname === path

	const handleLogout = () => {
		logout()
		setIsUserMenuOpen(false)
		setIsMenuOpen(false)
		navigate('/')
	}

	return (
		<header className="bg-purple-100 dark:bg-purple-600 text-gray-900 dark:text-white shadow-lg sticky top-0 z-50 border-b border-purple-200 dark:border-transparent">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					{/* Logo */}
					<Link to="/" className="flex items-center space-x-3 group">
						<div className="bg-primary-yellow rounded-full group-hover:bg-yellow-400 transition-colors">
							<img src="/images/logo.png" alt="Gibi" className="h-12 w-12 rounded-full" />
						</div>
						<span className="text-xl font-display font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-primary-yellow transition-colors">
							GibiPromo
						</span>
					</Link>

					{/* Desktop Navigation */}
					<nav className="hidden md:flex items-center space-x-8">
						{navigation
							.filter(item => item.public || isAuthenticated)
							.map((item) => {
								const Icon = item.icon
								return (
									<Link
										key={item.name}
										to={item.href}
										className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 font-medium ${isActive(item.href)
											? 'bg-purple-200 dark:bg-purple-700 text-purple-900 dark:text-primary-yellow'
											: 'text-purple-900 dark:text-gray-100 hover:bg-purple-200 dark:hover:bg-purple-700 hover:text-purple-950 dark:hover:text-primary-yellow'
										}`}
									>
										<Icon className="h-4 w-4" />
										<span>{item.name}</span>
									</Link>
								)
							})}

						{/* Auth Section */}
						<div className="flex items-center space-x-4 border-l border-purple-300 dark:border-purple-500 pl-4">
							{isAuthenticated ? (
								<>
									{/* Notification Bell */}
									<NotificationBell />

									{/* User Menu Dropdown */}
									<div className="relative">
										<button
											onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
											className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors font-medium text-purple-900 dark:text-gray-100 hover:bg-purple-200 dark:hover:bg-purple-700"
										>
											<User className="h-4 w-4" />
											<span className="max-w-[150px] truncate">
												{profile?.nick ?? user?.email}
											</span>
											<ChevronDown className={`h-4 w-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
										</button>

										{isUserMenuOpen && (
											<div className="absolute right-0 mt-2 w-48 bg-white dark:bg-purple-700 border border-gray-200 dark:border-transparent rounded-lg shadow-lg py-1 z-50">
												<Link
													to="/perfil"
													onClick={() => setIsUserMenuOpen(false)}
													className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-purple-600 transition-colors"
												>
													<User className="h-4 w-4" />
													<span>Meu Perfil</span>
												</Link>
												<Link
													to="/configuracoes"
													onClick={() => setIsUserMenuOpen(false)}
													className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-purple-600 transition-colors"
												>
													<Settings className="h-4 w-4" />
													<span>Configurações</span>
												</Link>
												<hr className="my-1 border-gray-200 dark:border-purple-500" />
												<button
													onClick={handleLogout}
													className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-purple-600 transition-colors w-full text-left"
												>
													<LogOut className="h-4 w-4" />
													<span>Sair</span>
												</button>
											</div>
										)}
									</div>
								</>
							) : (
								/* Login/Register Links */
								<>
									<Link
										to="/login"
										className={`
											px-3 py-2 rounded-lg transition-all duration-200 font-medium
											${
												isActive('/login')
													? 'bg-purple-200 dark:bg-purple-700 text-purple-900 dark:text-primary-yellow'
													: 'text-purple-900 dark:text-gray-100 hover:bg-purple-200 dark:hover:bg-purple-700'
											}`
										}
									>
										Entrar
									</Link>
									<Link
										to="/registro"
										className="btn-primary text-sm py-2 px-4"
									>
										Cadastrar
									</Link>
								</>
							)}
						</div>

						{/* Theme Toggle */}
						<button
							onClick={toggleTheme}
							className="p-2 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-700 transition-colors"
							title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
						>
							{theme === 'dark' ? '🌞' : '🌙'}
						</button>
					</nav>

					{/* Mobile menu button */}
					<div className="md:hidden flex items-center gap-2">
						<button
							onClick={toggleTheme}
							className="p-2 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-700 transition-colors"
							title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
						>
							{theme === 'dark' ? '🌞' : '🌙'}
						</button>
						<button
							onClick={() => setIsMenuOpen(!isMenuOpen)}
							className="p-2 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-700 transition-colors"
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
				<div className="md:hidden bg-purple-50 dark:bg-purple-700 border-t border-purple-200 dark:border-purple-500">
					<div className="px-2 pt-2 pb-3 space-y-1">
						{mobileNavigation
							.filter(item => item.public || isAuthenticated)
							.map((item) => {
								const Icon = item.icon
								return (
									<Link
										key={item.name}
										to={item.href}
										onClick={() => setIsMenuOpen(false)}
										className={`
											flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200
											${isActive(item.href)
												? 'bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-primary-yellow'
												: 'text-purple-900 dark:text-white hover:bg-purple-200 dark:hover:bg-purple-600'
											}`
										}
									>
										<Icon className="h-5 w-5" />
										<span className="font-medium">{item.name}</span>
									</Link>
								)
							})}

						{/* Mobile Auth Section */}
						<div className="border-t border-gray-200 dark:border-purple-500 pt-3 mt-3 space-y-1">
							{isAuthenticated ? (
								<>
									{/* User Info */}
									<div className="px-3 py-2 text-gray-600 dark:text-primary-light">
										<div className="text-xs text-gray-500 dark:text-primary-light/70">Conectado como</div>
										<div className="text-sm font-medium truncate">{user?.email}</div>
									</div>

									{/* Logout Button */}
									<button
										onClick={handleLogout}
										className="flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-purple-600 transition-colors w-full"
									>
										<LogOut className="h-5 w-5" />
										<span className="font-medium">Sair</span>
									</button>
								</>
							) : (
								<>
									<Link
										to="/login"
										onClick={() => setIsMenuOpen(false)}
										className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200
											${isActive('/login')
												? 'bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-primary-yellow'
												: 'text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-purple-600'
											}`
										}
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
								</>
							)}
						</div>
					</div>
				</div>
			)}
		</header>
	)
}