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
						{navigation
							.filter(item => item.public || isAuthenticated)
							.map((item) => {
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

						{/* Auth Section */}
						<div className="flex items-center space-x-4 border-l border-purple-500 pl-4">
							{isAuthenticated ? (
								<>
									{/* Notification Bell */}
									<NotificationBell />

									{/* User Menu Dropdown */}
									<div className="relative">
										<button
											onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
											className="nav-link flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors"
										>
											<User className="h-4 w-4" />
											<span className="max-w-[150px] truncate">
												{profile?.nick ?? user?.email}
											</span>
											<ChevronDown className={`h-4 w-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
										</button>

										{isUserMenuOpen && (
											<div className="absolute right-0 mt-2 w-48 bg-purple-700 rounded-lg shadow-lg py-1 z-50">
												<Link
													to="/perfil"
													onClick={() => setIsUserMenuOpen(false)}
													className="nav-link flex items-center space-x-2 px-4 py-2 text-sm"
												>
													<User className="h-4 w-4" />
													<span>Meu Perfil</span>
												</Link>
												<Link
													to="/configuracoes"
													onClick={() => setIsUserMenuOpen(false)}
													className="nav-link flex items-center space-x-2 px-4 py-2 text-sm"
												>
													<Settings className="h-4 w-4" />
													<span>Configurações</span>
												</Link>
												<hr className="my-1 border-l border-purple-500" />
												<button
													onClick={handleLogout}
													className="nav-link flex items-center space-x-2 px-4 py-2 text-sm"
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
											nav-link px-3 py-2 rounded-lg transition-all duration-200 
											${
												isActive('/login')
													? 'nav-link-active bg-purple-700'
													: 'hover:bg-purple-700'
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
												? 'bg-purple-800 text-primary-yellow'
												: 'text-white hover:bg-purple-600'
											}`
										}
									>
										<Icon className="h-5 w-5" />
										<span className="font-medium">{item.name}</span>
									</Link>
								)
							})}

						{/* Mobile Auth Section */}
						<div className="border-t border-purple-500 pt-3 mt-3 space-y-1">
							{isAuthenticated ? (
								<>
									{/* User Info */}
									<div className="px-3 py-2 text-primary-light">
										<div className="text-xs text-primary-light/70">Conectado como</div>
										<div className="text-sm font-medium truncate">{user?.email}</div>
									</div>

									{/* Logout Button */}
									<button
										onClick={handleLogout}
										className="flex items-center space-x-3 px-3 py-2 rounded-lg text-red-400 hover:bg-purple-600 transition-colors w-full"
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
												? 'bg-purple-800 text-primary-yellow'
												: 'text-white hover:bg-purple-600'
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