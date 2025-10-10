import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, TrendingDown, Bell, Star, BookOpen, Sparkles } from 'lucide-react'

// Mock data para as promoções
const mockPromotions = [
	{
		id: '1',
		title: 'One Piece - Vol. 1',
		author: 'Eiichiro Oda',
		currentPrice: 19.90,
		originalPrice: 29.90,
		discount: 33,
		cover: '/api/placeholder/200/300',
		rating: 4.8,
		reviews: 1250
	},
	{
		id: '2',
		title: 'Attack on Titan - Vol. 1',
		author: 'Hajime Isayama',
		currentPrice: 22.45,
		originalPrice: 34.90,
		discount: 36,
		cover: '/api/placeholder/200/300',
		rating: 4.9,
		reviews: 890
	},
	{
		id: '3',
		title: 'Batman: Ano Um',
		author: 'Frank Miller',
		currentPrice: 35.50,
		originalPrice: 49.90,
		discount: 29,
		cover: '/api/placeholder/200/300',
		rating: 4.7,
		reviews: 567
	}
]

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
								<h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white leading-tight mb-6">
									Descubra as melhores{' '}
									<span className="text-primary-yellow animate-bounce-gentle inline-block">
										promoções
									</span>{' '}
									de quadrinhos e mangás
								</h1>

								<p className="text-xl text-primary-light mb-8 leading-relaxed">
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
								<div className="bg-primary-yellow rounded-full w-64 h-64 mx-auto mb-6 flex items-center justify-center">
									<img src="/images/logo.png" alt="Gibi" className="h-60 w-60 rounded-full" />
								</div>
								<h3 className="text-xl font-display font-semibold text-white mb-2">
									Gibi
								</h3>
								<p className="text-primary-light">
									Sua companheira na busca pelos melhores descontos!
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="py-16 px-4 sm:px-6 lg:px-8 bg-dark-900">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-12">
						<h2 className="text-3xl font-display font-bold text-white mb-4">
							Como funciona?
						</h2>
						<p className="text-primary-light text-lg">
							Simples e eficiente como deve ser!
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						<div className="card text-center">
							<div className="bg-primary-yellow rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
								<Bell className="h-8 w-8 text-dark-950" />
							</div>
							<h3 className="text-xl font-semibold text-white mb-2">
								Configure Alertas
							</h3>
							<p className="text-primary-light">
								Adicione seus quadrinhos favoritos e defina o preço desejado
							</p>
						</div>

						<div className="card text-center">
							<div className="bg-primary-yellow rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
								<TrendingDown className="h-8 w-8 text-dark-950" />
							</div>
							<h3 className="text-xl font-semibold text-white mb-2">
								Monitoramento 24/7
							</h3>
							<p className="text-primary-light">
								Nossa gatinha monitora os preços na Amazon constantemente
							</p>
						</div>

						<div className="card text-center">
							<div className="bg-primary-yellow rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
								<Sparkles className="h-8 w-8 text-dark-950" />
							</div>
							<h3 className="text-xl font-semibold text-white mb-2">
								Notificação Instantânea
							</h3>
							<p className="text-primary-light">
								Receba alertas no Telegram quando o preço baixar
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Latest Promotions Section */}
			<section className="py-16 px-4 sm:px-6 lg:px-8">
				<div className="max-w-7xl mx-auto">
					<div className="flex justify-between items-center mb-12">
						<div>
							<h2 className="text-3xl font-display font-bold text-white mb-2">
								🔥 Últimas Promoções
							</h2>
							<p className="text-primary-light">
								As melhores ofertas encontradas pela nossa gatinha
							</p>
						</div>
						<Link
							to="/promocoes"
							className="btn-ghost inline-flex items-center space-x-2"
						>
							<span>Ver todas</span>
							<ArrowRight className="h-4 w-4" />
						</Link>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{mockPromotions.map((promo) => (
							<div key={promo.id} className="card-product">
								<div className="relative mb-4">
									<div className="aspect-[2/3] bg-dark-800 rounded-xl overflow-hidden">
										<div className="w-full h-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
											<BookOpen className="h-16 w-16 text-white opacity-50" />
										</div>
									</div>
									<div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg text-sm font-semibold">
										-{promo.discount}%
									</div>
								</div>

								<div className="space-y-2">
									<h3 className="font-semibold text-white line-clamp-2 group-hover:text-primary-yellow transition-colors">
										{promo.title}
									</h3>
									<p className="text-primary-light text-sm">{promo.author}</p>

									<div className="flex items-center space-x-1 mb-2">
										<Star className="h-4 w-4 text-yellow-400 fill-current" />
										<span className="text-sm text-primary-light">
											{promo.rating} ({promo.reviews})
										</span>
									</div>

									<div className="flex items-baseline space-x-2">
										<span className="text-xl font-bold text-primary-yellow">
											R$ {promo.currentPrice.toFixed(2)}
										</span>
										<span className="text-sm text-primary-light line-through">
											R$ {promo.originalPrice.toFixed(2)}
										</span>
									</div>

									<button className="w-full btn-primary mt-4">
										Ver na Amazon
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-card">
				<div className="max-w-4xl mx-auto text-center">
					<h2 className="text-3xl font-display font-bold text-white mb-4">
						Pronto para economizar em quadrinhos?
					</h2>
					<p className="text-primary-light text-lg mb-8">
						Junte-se a milhares de leitores que já economizam com a nossa gatinha!
					</p>
					<a
						href="https://t.me/gibipromo_bot"
						target="_blank"
						rel="noopener noreferrer"
						className="btn-primary inline-flex items-center space-x-2"
					>
						<Bell className="h-5 w-5" />
						<span>Começar no Telegram</span>
						<ArrowRight className="h-5 w-5" />
					</a>
				</div>
			</section>
		</div>
	)
}