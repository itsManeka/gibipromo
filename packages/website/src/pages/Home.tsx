import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, TrendingDown, Bell, Sparkles } from 'lucide-react'
import { LatestPromotions } from '../components/LatestPromotions'
import { CallToActionRegister } from '../components/CallToActionRegister'

export function Home() {
	return (
		<div className="min-h-screen">
			{/* Hero Section */}
			<section className="gradient-hero texture-subtle py-20 px-4 sm:px-6 lg:px-8">
				<div className="max-w-7xl mx-auto">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
						{/* Conteúdo textual */}
						<div className="text-center lg:text-left">
							<div className="animate-fade-in">
								<h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-gray-900 dark:text-white leading-tight mb-6">
									Descubra as melhores{' '}
									<span className="text-primary-yellow animate-bounce-gentle inline-block">
										promoções
									</span>{' '}
									de quadrinhos e mangás
								</h1>

								<p className="text-xl text-gray-700 dark:text-primary-light mb-8 leading-relaxed">
									A gatinha que monitora preços na Amazon e te avisa das melhores ofertas
									de HQs e mangás direto no Telegram! 📚✨
								</p>

								<div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
									<Link to="/promocoes" className="btn-primary inline-flex items-center space-x-2">
										<Sparkles className="h-5 w-5" />
										<span>Explorar Promoções</span>
										<ArrowRight className="h-5 w-5" />
									</Link>

									<a
										href="https://t.me/gibipromo_bot"
										target="_blank"
										rel="noopener noreferrer"
										className="btn-secondary inline-flex items-center space-x-2"
									>
										<Bell className="h-5 w-5" />
										<span>Bot no Telegram</span>
									</a>
								</div>
							</div>
						</div>

						{/* Ilustração/Placeholder */}
						<div className="animate-float">
							<div className="bg-gradient-card rounded-3xl p-8 text-center filter-drop-shadow">
								<div className="bg-primary-purple dark:bg-primary-yellow rounded-full w-64 h-64 mx-auto mb-6 flex items-center justify-center border-4 border-transparent">
									<img src="/images/logo.png" alt="Gibi" className="h-60 w-60 rounded-full" />
								</div>
								<h3 className="text-xl font-display font-semibold text-gray-900 dark:text-white mb-2">
									Gibi
								</h3>
								<p className="text-gray-700 dark:text-primary-light">
									Sua companheira na busca pelos melhores descontos!
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* CTA de Registro */}
			<CallToActionRegister />

			{/* Últimas Promoções */}
			<LatestPromotions />

			{/* Features Section */}
			<section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-dark-900 mb-16">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-12">
						<h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-4">
							Como funciona?
						</h2>
						<p className="text-gray-600 dark:text-primary-light text-lg">
							Simples e eficiente como deve ser!
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						<div className="card text-center">
							<div className="bg-primary-yellow rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
								<Bell className="h-8 w-8 text-dark-950" />
							</div>
							<h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
								Configure Alertas
							</h3>
							<p className="text-gray-600 dark:text-primary-light">
								Adicione seus quadrinhos favoritos e defina o preço desejado
							</p>
						</div>

						<div className="card text-center">
							<div className="bg-primary-yellow rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
								<TrendingDown className="h-8 w-8 text-dark-950" />
							</div>
							<h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
								Monitoramento 24/7
							</h3>
							<p className="text-gray-600 dark:text-primary-light">
								Nossa gatinha monitora os preços na Amazon constantemente
							</p>
						</div>

						<div className="card text-center">
							<div className="bg-primary-yellow rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
								<Sparkles className="h-8 w-8 text-dark-950" />
							</div>
							<h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
								Notificação Instantânea
							</h3>
							<p className="text-gray-600 dark:text-primary-light">
								Receba alertas no Telegram quando o preço baixar
							</p>
						</div>
					</div>
				</div>
			</section>
		</div>
	)
}