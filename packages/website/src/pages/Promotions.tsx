import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { BookOpen, ExternalLink, TrendingDown, Loader2, AlertCircle, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { PromotionFilters, AddProductForm } from '../components'
import { 
	productsService, 
	PromotionFilters as IPromotionFilters,
	FilterOptions,
	Product,
	PromotionSortType,
	PaginatedResult
} from '../api/products.service'

export function Promotions() {
	// Estados
	const [products, setProducts] = useState<Product[]>([])
	const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null)
	const [pagination, setPagination] = useState<PaginatedResult<Product>['pagination'] | null>(null)
	const [filters, setFilters] = useState<IPromotionFilters>({
		inStock: true,
		onlyMyProducts: false
	})
	const [sortBy, setSortBy] = useState<PromotionSortType>('discount')
	const [currentPage, setCurrentPage] = useState(1)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [showAddForm, setShowAddForm] = useState(false)
	
	const { isAuthenticated } = useAuth()

	// Carregar opções de filtros
	useEffect(() => {
		const loadFilterOptions = async () => {
			try {
				const options = await productsService.getFilterOptions()
				setFilterOptions(options)
			} catch (err) {
				console.error('Erro ao carregar opções de filtros:', err)
				setFilterOptions({
					categories: [],
					publishers: [],
					genres: [],
					formats: [],
					contributors: []
				})
			}
		}

		loadFilterOptions()
	}, [])

	// Carregar promoções
	useEffect(() => {
		const loadPromotions = async () => {
			if (!filterOptions) return

			setIsLoading(true)
			setError(null)

			try {
				const result = await productsService.getPromotions(
					filters,
					currentPage,
					20,
					sortBy
				)

				setProducts(result.data)
				setPagination(result.pagination)
			} catch (err) {
				console.error('Erro ao carregar promoções:', err)
				setError(
					err instanceof Error 
						? err.message 
						: 'Erro ao carregar promoções. Tente novamente.'
				)
			} finally {
				setIsLoading(false)
			}
		}

		loadPromotions()
	}, [filters, currentPage, sortBy, filterOptions])

	// Handlers
	const handleFilterChange = (newFilters: IPromotionFilters) => {
		setFilters(newFilters)
		setCurrentPage(1)
	}

	const handleSortChange = (newSort: PromotionSortType) => {
		setSortBy(newSort)
		setCurrentPage(1)
	}

	const handlePageChange = (page: number) => {
		setCurrentPage(page)
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	const calculateDiscount = (product: Product): number => {
		return Math.round(((product.full_price - product.price) / product.full_price) * 100)
	}

	if (!filterOptions) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
					<p className="text-dark-300">Carregando filtros...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
						<h1 className="text-3xl md:text-4xl font-display font-bold text-white">
							🔥 Promoções Ativas
						</h1>
						{isAuthenticated && (
							<button
								onClick={() => setShowAddForm(!showAddForm)}
								className={`${showAddForm ? 'btn-ghost' : 'btn-primary'} inline-flex items-center space-x-2`}
							>
								{showAddForm ? (
									<>
										<X className="w-5 h-5" />
										Fechar
									</>
								) : (
									<>
										<Plus className="w-5 h-5" />
										Adicionar Produto
									</>
								)}
							</button>
						)}
					</div>
					<p className="text-dark-300">
						{pagination ? (
							<>
								<span className="text-primary font-semibold">{pagination.total}</span> promoções encontradas
							</>
						) : (
							'Carregando promoções...'
						)}
					</p>
				</div>

				{/* Add Product Form */}
				{showAddForm && (
					<div className="mb-6">
						<AddProductForm
							compact
							onSuccess={() => {
								setShowAddForm(false)
							}}
						/>
					</div>
				)}

				{/* Filtros */}
				<PromotionFilters
					filters={filters}
					filterOptions={filterOptions}
					onFilterChange={handleFilterChange}
				/>

				{/* Ordenação */}
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
					<p className="text-sm text-dark-300">
						Página {pagination?.page || 1} de {pagination?.totalPages || 1}
					</p>
					<div className="flex items-center gap-2">
						<label htmlFor="sort" className="text-sm text-dark-300">
							Ordenar por:
						</label>
						<select
							id="sort"
							value={sortBy}
							onChange={(e) => handleSortChange(e.target.value as PromotionSortType)}
							className="input text-sm py-2"
						>
							<option value="discount">Maior Desconto</option>
							<option value="price-low">Menor Preço</option>
							<option value="price-high">Maior Preço</option>
							<option value="name">Nome (A-Z)</option>
						</select>
					</div>
				</div>

				{/* Loading */}
				{isLoading && (
					<div className="text-center py-20">
						<Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
						<p className="text-dark-300">Buscando promoções...</p>
					</div>
				)}

				{/* Erro */}
				{!isLoading && error && (
					<div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
						<AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
						<h3 className="text-lg font-semibold text-white mb-2">Erro ao carregar promoções</h3>
						<p className="text-dark-300 mb-4">{error}</p>
						<button
							onClick={() => window.location.reload()}
							className="btn-primary"
						>
							Tentar Novamente
						</button>
					</div>
				)}

				{/* Lista de Produtos */}
				{!isLoading && !error && products.length > 0 && (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
						{products.map((product) => {
							const discount = calculateDiscount(product)
							return (
								<a
									key={product.id}
									href={product.url}
									target="_blank"
									rel="noopener noreferrer"
									className="card-product group"
								>
									<div className="relative mb-4">
										<div className="aspect-[2/3] bg-dark-800 rounded-xl overflow-hidden">
											{product.image ? (
												<img
													src={product.image}
													alt={product.title}
													className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
													loading="lazy"
												/>
											) : (
												<div className="w-full h-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
													<BookOpen className="h-16 w-16 text-white opacity-50" />
												</div>
											)}
										</div>

										{/* Badge de desconto */}
										{discount > 0 && (
											<div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg text-sm font-semibold flex items-center gap-1 shadow-lg">
												<TrendingDown className="h-3 w-3" />
												<span>-{discount}%</span>
											</div>
										)}

										{/* Badges de status */}
										<div className="absolute top-2 left-2 flex flex-col gap-1">
											{product.format && (
												<div className="bg-purple-600 text-white px-2 py-1 rounded-lg text-xs font-medium shadow-lg">
													{product.format}
												</div>
											)}
											{product.preorder && (
												<div className="bg-yellow-500 text-dark-900 px-2 py-1 rounded-lg text-xs font-medium shadow-lg">
													Pré-venda
												</div>
											)}
											{!product.in_stock && (
												<div className="bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-medium shadow-lg">
													Sem Estoque
												</div>
											)}
										</div>
									</div>

									<div className="space-y-3">
										<div>
											<h3 className="font-semibold text-white line-clamp-2 group-hover:text-primary transition-colors mb-1">
												{product.title}
											</h3>
											{product.contributors && product.contributors.length > 0 && (
												<p className="text-dark-300 text-sm line-clamp-1">
													{product.contributors.join(', ')}
												</p>
											)}
											<div className="flex flex-wrap gap-1 mt-1">
												{product.category && (
													<span className="text-dark-400 text-xs">{product.category}</span>
												)}
												{product.publisher && (
													<>
														<span className="text-dark-600 text-xs">•</span>
														<span className="text-dark-400 text-xs">{product.publisher}</span>
													</>
												)}
											</div>
										</div>

										<div className="flex items-baseline gap-2">
											<span className="text-xl font-bold text-primary">
												R$ {product.price.toFixed(2)}
											</span>
											<span className="text-sm text-dark-400 line-through">
												R$ {product.full_price.toFixed(2)}
											</span>
										</div>

										<button className="w-full btn-primary text-sm py-2 inline-flex items-center justify-center gap-2">
											<ExternalLink className="h-4 w-4" />
											<span>Ver na Amazon</span>
										</button>
									</div>
								</a>
							)
						})}
					</div>
				)}

				{/* Sem resultados */}
				{!isLoading && !error && products.length === 0 && (
					<div className="text-center py-20">
						<BookOpen className="h-16 w-16 text-dark-600 mx-auto mb-4" />
						<h3 className="text-xl font-semibold text-white mb-2">
							Nenhuma promoção encontrada
						</h3>
						<p className="text-dark-300 mb-6">
							Tente ajustar os filtros para encontrar mais produtos
						</p>
						<button
							onClick={() => handleFilterChange({ inStock: true, onlyMyProducts: false })}
							className="btn-ghost"
						>
							Limpar Filtros
						</button>
					</div>
				)}

				{/* Paginação */}
				{!isLoading && !error && pagination && pagination.totalPages > 1 && (
					<div className="flex justify-center mt-12">
						<div className="flex items-center gap-2">
							<button
								onClick={() => handlePageChange(currentPage - 1)}
								disabled={!pagination.hasPreviousPage}
								className="btn-ghost px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
							>
								<ChevronLeft className="h-4 w-4" />
								<span className="hidden sm:inline">Anterior</span>
							</button>

							{Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
								let pageNumber: number

								if (pagination.totalPages <= 5) {
									pageNumber = i + 1
								} else if (currentPage <= 3) {
									pageNumber = i + 1
								} else if (currentPage >= pagination.totalPages - 2) {
									pageNumber = pagination.totalPages - 4 + i
								} else {
									pageNumber = currentPage - 2 + i
								}

								return (
									<button
										key={pageNumber}
										onClick={() => handlePageChange(pageNumber)}
										className={`px-4 py-2 rounded-lg transition-colors ${
											currentPage === pageNumber
												? 'bg-primary text-dark-900 font-semibold'
												: 'btn-ghost'
										}`}
									>
										{pageNumber}
									</button>
								)
							})}

							<button
								onClick={() => handlePageChange(currentPage + 1)}
								disabled={!pagination.hasNextPage}
								className="btn-ghost px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
							>
								<span className="hidden sm:inline">Próximo</span>
								<ChevronRight className="h-4 w-4" />
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
