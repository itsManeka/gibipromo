import React, { useState, useMemo } from 'react'
import { Search, Filter, Star, BookOpen, ExternalLink, TrendingDown } from 'lucide-react'

// Mock data expandido para promoções
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
		reviews: 1250,
		category: 'Mangá',
		publisher: 'Panini',
		format: 'Físico'
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
		reviews: 890,
		category: 'Mangá',
		publisher: 'Panini',
		format: 'Físico'
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
		reviews: 567,
		category: 'DC Comics',
		publisher: 'Panini',
		format: 'Físico'
	},
	{
		id: '4',
		title: 'Demon Slayer - Vol. 1',
		author: 'Koyoharu Gotouge',
		currentPrice: 18.90,
		originalPrice: 27.90,
		discount: 32,
		cover: '/api/placeholder/200/300',
		rating: 4.9,
		reviews: 2100,
		category: 'Mangá',
		publisher: 'Panini',
		format: 'Digital'
	},
	{
		id: '5',
		title: 'Homem-Aranha: Volta ao Lar',
		author: 'Dan Slott',
		currentPrice: 28.90,
		originalPrice: 39.90,
		discount: 28,
		cover: '/api/placeholder/200/300',
		rating: 4.5,
		reviews: 345,
		category: 'Marvel',
		publisher: 'Panini',
		format: 'Físico'
	},
	{
		id: '6',
		title: 'Naruto - Vol. 1',
		author: 'Masashi Kishimoto',
		currentPrice: 17.90,
		originalPrice: 26.90,
		discount: 33,
		cover: '/api/placeholder/200/300',
		rating: 4.8,
		reviews: 1890,
		category: 'Mangá',
		publisher: 'Panini',
		format: 'Físico'
	}
]

export function Promotions() {
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedCategory, setSelectedCategory] = useState('all')
	const [selectedPublisher, setSelectedPublisher] = useState('all')
	const [selectedFormat, setSelectedFormat] = useState('all')
	const [sortBy, setSortBy] = useState('discount')

	// Filtros únicos
	const categories = [...new Set(mockPromotions.map(p => p.category))]
	const publishers = [...new Set(mockPromotions.map(p => p.publisher))]
	const formats = [...new Set(mockPromotions.map(p => p.format))]

	// Filtrar e ordenar promoções
	const filteredPromotions = useMemo(() => {
		let filtered = mockPromotions.filter(promo => {
			const matchesSearch = promo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
				promo.author.toLowerCase().includes(searchTerm.toLowerCase())
			const matchesCategory = selectedCategory === 'all' || promo.category === selectedCategory
			const matchesPublisher = selectedPublisher === 'all' || promo.publisher === selectedPublisher
			const matchesFormat = selectedFormat === 'all' || promo.format === selectedFormat

			return matchesSearch && matchesCategory && matchesPublisher && matchesFormat
		})

		// Ordenar
		filtered.sort((a, b) => {
			switch (sortBy) {
				case 'discount':
					return b.discount - a.discount
				case 'price-low':
					return a.currentPrice - b.currentPrice
				case 'price-high':
					return b.currentPrice - a.currentPrice
				case 'rating':
					return b.rating - a.rating
				default:
					return 0
			}
		})

		return filtered
	}, [searchTerm, selectedCategory, selectedPublisher, selectedFormat, sortBy])

	return (
		<div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-display font-bold text-white mb-2">
						🔥 Promoções Ativas
					</h1>
					<p className="text-primary-light">
						{filteredPromotions.length} promoções encontradas pela nossa gatinha
					</p>
				</div>

				{/* Filtros */}
				<div className="bg-dark-900 rounded-2xl p-6 mb-8">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
						{/* Busca */}
						<div className="lg:col-span-2">
							<label className="block text-sm font-medium text-primary-light mb-2">
								Buscar
							</label>
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark-400" />
								<input
									type="text"
									placeholder="Título ou autor..."
									className="input pl-10 w-full"
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
								/>
							</div>
						</div>

						{/* Categoria */}
						<div>
							<label className="block text-sm font-medium text-primary-light mb-2">
								Categoria
							</label>
							<select
								className="input w-full"
								value={selectedCategory}
								onChange={(e) => setSelectedCategory(e.target.value)}
							>
								<option value="all">Todas</option>
								{categories.map(category => (
									<option key={category} value={category}>{category}</option>
								))}
							</select>
						</div>

						{/* Editora */}
						<div>
							<label className="block text-sm font-medium text-primary-light mb-2">
								Editora
							</label>
							<select
								className="input w-full"
								value={selectedPublisher}
								onChange={(e) => setSelectedPublisher(e.target.value)}
							>
								<option value="all">Todas</option>
								{publishers.map(publisher => (
									<option key={publisher} value={publisher}>{publisher}</option>
								))}
							</select>
						</div>

						{/* Formato */}
						<div>
							<label className="block text-sm font-medium text-primary-light mb-2">
								Formato
							</label>
							<select
								className="input w-full"
								value={selectedFormat}
								onChange={(e) => setSelectedFormat(e.target.value)}
							>
								<option value="all">Todos</option>
								{formats.map(format => (
									<option key={format} value={format}>{format}</option>
								))}
							</select>
						</div>

						{/* Ordenar */}
						<div>
							<label className="block text-sm font-medium text-primary-light mb-2">
								Ordenar por
							</label>
							<select
								className="input w-full"
								value={sortBy}
								onChange={(e) => setSortBy(e.target.value)}
							>
								<option value="discount">Maior desconto</option>
								<option value="price-low">Menor preço</option>
								<option value="price-high">Maior preço</option>
								<option value="rating">Melhor avaliação</option>
							</select>
						</div>
					</div>
				</div>

				{/* Grid de Promoções */}
				{filteredPromotions.length === 0 ? (
					<div className="text-center py-12">
						<BookOpen className="h-16 w-16 text-dark-600 mx-auto mb-4" />
						<h3 className="text-xl font-semibold text-white mb-2">
							Nenhuma promoção encontrada
						</h3>
						<p className="text-primary-light">
							Tente ajustar os filtros ou aguarde novas ofertas da nossa gatinha!
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
						{filteredPromotions.map((promo) => (
							<div key={promo.id} className="card-product">
								<div className="relative mb-4">
									<div className="aspect-[2/3] bg-dark-800 rounded-xl overflow-hidden">
										<div className="w-full h-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
											<BookOpen className="h-16 w-16 text-white opacity-50" />
										</div>
									</div>

									{/* Badge de desconto */}
									<div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg text-sm font-semibold flex items-center space-x-1">
										<TrendingDown className="h-3 w-3" />
										<span>-{promo.discount}%</span>
									</div>

									{/* Badge de formato */}
									<div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded-lg text-xs font-medium">
										{promo.format}
									</div>
								</div>

								<div className="space-y-3">
									<div>
										<h3 className="font-semibold text-white line-clamp-2 group-hover:text-primary-yellow transition-colors mb-1">
											{promo.title}
										</h3>
										<p className="text-primary-light text-sm">{promo.author}</p>
										<p className="text-primary-light text-xs">{promo.category} • {promo.publisher}</p>
									</div>

									<div className="flex items-baseline space-x-2">
										<span className="text-xl font-bold text-primary-yellow">
											R$ {promo.currentPrice.toFixed(2)}
										</span>
										<span className="text-sm text-primary-light line-through">
											R$ {promo.originalPrice.toFixed(2)}
										</span>
									</div>

									<div className="flex space-x-2">
										<button className="flex-1 btn-primary text-sm py-2 inline-flex items-center justify-center space-x-1">
											<ExternalLink className="h-4 w-4" />
											<span>Amazon</span>
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				)}

				{/* Paginação (placeholder) */}
				{filteredPromotions.length > 0 && (
					<div className="flex justify-center mt-12">
						<div className="flex space-x-2">
							<button className="btn-ghost px-4 py-2">Anterior</button>
							<button className="bg-purple-600 text-white px-4 py-2 rounded-lg">1</button>
							<button className="btn-ghost px-4 py-2">2</button>
							<button className="btn-ghost px-4 py-2">3</button>
							<button className="btn-ghost px-4 py-2">Próximo</button>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}