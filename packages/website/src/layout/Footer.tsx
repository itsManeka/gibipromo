import React from 'react'
import { Link } from 'react-router-dom'
import { Heart, Mail, BookOpen, Instagram } from 'lucide-react'

export function Footer() {
	const currentYear = new Date().getFullYear()

	return (
		<footer className="bg-purple-100 dark:bg-purple-600 text-gray-900 dark:text-white mt-auto border-t border-purple-200 dark:border-transparent">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
					{/* Logo e Descrição */}
					<div className="col-span-1 md:col-span-2">
						<div className="flex items-center space-x-3 mb-4">
							<div className="bg-primary-yellow h-12 w-12 rounded-full items-center">
								<img src="/images/logo.png" alt="Gibi" className="h-12 w-12 rounded-full" />
							</div>
							<span className="text-xl font-display font-bold">GibiPromo</span>
						</div>
						<p className="text-purple-800 dark:text-primary-light text-sm leading-relaxed mb-4">
							A gatinha que ama quadrinhos e descontos! Monitore preços de HQs e mangás
							na Amazon e receba alertas das melhores promoções direto no seu Telegram.
						</p>
						<div className="flex items-center space-x-1 text-sm text-purple-800 dark:text-white">
							<span>Feito com</span>
							<Heart className="h-4 w-4 text-red-500 dark:text-red-400 fill-current" />
							<span>pela equipe GibiPromo</span>
						</div>
					</div>

					{/* Links Rápidos */}
					<div>
						<h3 className="font-display font-semibold mb-4">Links Rápidos</h3>
						<ul className="space-y-2 text-sm">
							<li>
								<Link to="/" className="text-purple-800 dark:text-primary-light hover:text-purple-950 dark:hover:text-primary-yellow transition-colors">
									Início
								</Link>
							</li>
							<li>
								<Link to="/promocoes" className="text-purple-800 dark:text-primary-light hover:text-purple-950 dark:hover:text-primary-yellow transition-colors">
									Promoções
								</Link>
							</li>
							<li>
								<Link to="/perfil" className="text-purple-800 dark:text-primary-light hover:text-purple-950 dark:hover:text-primary-yellow transition-colors">
									Perfil
								</Link>
							</li>
							<li>
								<Link to="/configuracoes" className="text-purple-800 dark:text-primary-light hover:text-purple-950 dark:hover:text-primary-yellow transition-colors">
									Configurações
								</Link>
							</li>
						</ul>
					</div>

					{/* Suporte */}
					<div>
						<h3 className="font-display font-semibold mb-4">Suporte</h3>
						<ul className="space-y-2 text-sm">
							<li>
								<a
									href="/sobre"
									className="text-purple-800 dark:text-primary-light hover:text-purple-950 dark:hover:text-primary-yellow transition-colors"
								>
									Sobre
								</a>
							</li>
							<li>
								<a
									href="/contato"
									className="text-purple-800 dark:text-primary-light hover:text-purple-950 dark:hover:text-primary-yellow transition-colors"
								>
									Contato
								</a>
							</li>
							<li>
								<a
									href="/privacidade"
									className="text-purple-800 dark:text-primary-light hover:text-purple-950 dark:hover:text-primary-yellow transition-colors"
								>
									Política de Privacidade
								</a>
							</li>
							<li>
								<a
									href="/termos"
									className="text-purple-800 dark:text-primary-light hover:text-purple-950 dark:hover:text-primary-yellow transition-colors"
								>
									Termos de Uso
								</a>
							</li>
						</ul>
					</div>
				</div>

				{/* Separador */}
				<div className="border-t border-purple-200 dark:border-purple-500 mt-8 pt-8">
					<div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
						<div className="text-sm text-purple-800 dark:text-primary-light">
							© {currentYear} GibiPromo. Todos os direitos reservados.
						</div>

						{/* Links Sociais */}
						<div className="flex items-center space-x-4">
							<a
								href="mailto:contato.gibipromo@gmail.com"
								className="text-purple-800 dark:text-primary-light hover:text-purple-950 dark:hover:text-primary-yellow transition-colors"
								title="Email"
							>
								<Mail className="h-5 w-5" />
							</a>
							<a
								href="https://www.instagram.com/gibipromo/"
								className="text-purple-800 dark:text-primary-light hover:text-purple-950 dark:hover:text-primary-yellow transition-colors"
								title="Instagram"
							>
								<Instagram className="h-5 w-5" />
							</a>
						</div>
					</div>
				</div>
			</div>
		</footer>
	)
}