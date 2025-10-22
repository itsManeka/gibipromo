import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
	BookOpen,
	Loader2,
	AlertCircle,
	ExternalLink,
	ChevronDown,
	ChevronUp,
	Eye,
	EyeOff,
	Home,
	ChevronRight,
	TrendingDown,
	Package,
	Tag
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { productsService, Product } from '../api/products.service'
import { PriceHistoryChart } from '../components/PriceHistoryChart'
import { normalizeContributors } from '../utils/format'

/**
 * Página de detalhes do produto
 * Rota: /produto/:id
 */
export function ProductDetails() {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const { isAuthenticated } = useAuth()

	// Estados do produto
	const [product, setProduct] = useState<Product | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Estados de monitoramento
	const [isMonitoring, setIsMonitoring] = useState(false)
	const [isMonitoringLoading, setIsMonitoringLoading] = useState(false)
	const [monitorError, setMonitorError] = useState<string | null>(null)

	// Estado do gráfico (lazy loading)
	const [showChart, setShowChart] = useState(false)

	// Carregar produto
	useEffect(() => {
		if (id) {
			loadProduct()
			if (isAuthenticated) {
				checkMonitoringStatus()
			}
		}
	}, [id, isAuthenticated])

	/**
	 * Carregar dados do produto
	 */
	const loadProduct = async () => {
		if (!id) return

		setIsLoading(true)
		setError(null)

		try {
			const data = await productsService.getProduct(id)
			setProduct(data)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Erro ao carregar produto')
		} finally {
			setIsLoading(false)
		}
	}

	/**
	 * Verificar se está monitorando
	 */
	const checkMonitoringStatus = async () => {
		if (!id) return

		try {
			const monitoring = await productsService.isMonitoring(id)
			setIsMonitoring(monitoring)
		} catch (err) {
			// Falha silenciosa
			console.error('Erro ao verificar status de monitoramento:', err)
		}
	}

	/**
	 * Adicionar ao monitoramento
	 */
	const handleMonitor = async () => {
		if (!id) return

		setIsMonitoringLoading(true)
		setMonitorError(null)

		try {
			await productsService.monitorProduct(id)
			setIsMonitoring(true)
		} catch (err) {
			setMonitorError(err instanceof Error ? err.message : 'Erro ao monitorar produto')
		} finally {
			setIsMonitoringLoading(false)
		}
	}

	/**
	 * Remover do monitoramento
	 */
	const handleUnmonitor = async () => {
		if (!id) return

		setIsMonitoringLoading(true)
		setMonitorError(null)

		try {
			await productsService.unmonitorProduct(id)
			setIsMonitoring(false)
		} catch (err) {
			setMonitorError(err instanceof Error ? err.message : 'Erro ao parar de monitorar')
		} finally {
			setIsMonitoringLoading(false)
		}
	}

	/**
	 * Toggle exibição do gráfico
	 */
	const toggleChart = () => {
		setShowChart(!showChart)
	}

	// Loading
	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<Loader2 className="h-12 w-12 text-purple-600 dark:text-primary animate-spin mx-auto mb-4" />
					<p className="text-gray-600 dark:text-dark-300">Carregando produto...</p>
				</div>
			</div>
		)
	}

	// Erro
	if (error || !product) {
		return (
			<div className="min-h-screen flex items-center justify-center px-4">
				<div className="text-center max-w-md">
					<AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Produto não encontrado</h1>
					<p className="text-gray-600 dark:text-dark-300 mb-6">{error || 'O produto que você procura não existe'}</p>
					<Link to="/promocoes" className="btn-primary">
						Ver Promoções
					</Link>
				</div>
			</div>
		)
	}

	// Calcular desconto
	const discount = product.full_price > 0
		? Math.round(((product.full_price - product.price) / product.full_price) * 100)
		: 0

	return (
		<div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 pb-20">
			<div className="max-w-6xl mx-auto">
				{/* Breadcrumb */}
				<nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-dark-400 mb-6">
					<Link to="/" className="hover:text-purple-600 dark:hover:text-primary transition-colors flex items-center gap-1">
						<Home className="h-4 w-4" />
						Home
					</Link>
					<ChevronRight className="h-4 w-4" />
					<Link to="/promocoes" className="hover:text-purple-600 dark:hover:text-primary transition-colors">
						Promoções
					</Link>
					<ChevronRight className="h-4 w-4" />
					<span className="text-gray-700 dark:text-dark-300 truncate max-w-[200px]">{product.title}</span>
				</nav>

				{/* Produto */}
				<div className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-2xl overflow-hidden mb-6">
					<div className="grid md:grid-cols-5 gap-6 p-6">
						{/* Imagem do produto */}
						<div className="md:col-span-2">
							<div className="relative">
								<div className="aspect-[2/3] bg-gray-200 dark:bg-dark-800 rounded-xl overflow-hidden">
									{product.image ? (
										<img
											src={product.image}
											alt={product.title}
											className="w-full h-full object-cover"
										/>
									) : (
										<div className="w-full h-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
											<BookOpen className="h-24 w-24 text-white opacity-50" />
										</div>
									)}
								</div>

								{/* Badge de desconto */}
								{discount > 0 && (
									<div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-2 rounded-lg text-lg font-bold flex items-center gap-1 shadow-lg">
										<TrendingDown className="h-5 w-5" />
										<span>-{discount}%</span>
									</div>
								)}

								{/* Badges de status */}
								<div className="absolute top-3 left-3 flex flex-col gap-2">
									{product.format && (
										<div className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg">
											{product.format}
										</div>
									)}
									{product.preorder && (
										<div className="bg-yellow-500 text-dark-900 px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg">
											Pré-venda
										</div>
									)}
									{!product.in_stock && (
										<div className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg">
											Sem Estoque
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Informações do produto */}
						<div className="md:col-span-3 flex flex-col">
							{/* Título e categoria */}
							<div className="mb-4">
								<div className="flex flex-wrap gap-2 mb-2">
									{product.category && (
										<span className="bg-purple-100 dark:bg-dark-800 text-purple-700 dark:text-primary-light px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1">
											<Tag className="h-3 w-3" />
											{product.category}
										</span>
									)}
									{product.genre && (
										<span className="bg-gray-200 dark:bg-dark-800 text-gray-700 dark:text-dark-300 px-3 py-1 rounded-lg text-sm">
											{product.genre}
										</span>
									)}
								</div>
								<h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
									{product.title}
								</h1>
								{product.contributors && product.contributors.length > 0 && (
									<p className="text-gray-600 dark:text-dark-300 mb-2">
										Por: <span className="text-gray-900 dark:text-white">{normalizeContributors(product.contributors).join(' • ')}</span>
									</p>
								)}
								{product.publisher && (
									<p className="text-gray-500 dark:text-dark-400 text-sm">
										Editora: {product.publisher}
									</p>
								)}
							</div>

							{/* Preços */}
							<div className="mb-6">
								<div className="flex items-baseline gap-3 mb-2">
									<span className="text-4xl font-bold text-green-600 dark:text-primary">
										R$ {product.price.toFixed(2)}
									</span>
									{product.full_price > product.price && (
										<span className="text-xl text-gray-500 dark:text-dark-400 line-through">
											R$ {product.full_price.toFixed(2)}
										</span>
									)}
								</div>
								{product.lowest_price < product.price && (
									<p className="text-sm text-gray-600 dark:text-dark-400 flex items-center gap-1">
										<Package className="h-4 w-4" />
										Menor preço histórico: R$ {product.lowest_price.toFixed(2)}
									</p>
								)}
							</div>

							{/* Botões de ação */}
							<div className="flex flex-col gap-3 mt-auto">
								{/* Ver na Amazon */}
								<a
									href={product.url}
									target="_blank"
									rel="noopener noreferrer"
									className="btn-primary text-center flex items-center justify-center gap-2"
								>
									<ExternalLink className="h-5 w-5" />
									Ver na Amazon
								</a>

								{/* Botão de monitoramento (apenas para autenticados) */}
								{isAuthenticated && (
									<div>
										{!isMonitoring ? (
											<button
												onClick={handleMonitor}
												disabled={isMonitoringLoading}
												className="w-full btn-secondary flex items-center justify-center gap-2"
											>
												{isMonitoringLoading ? (
													<Loader2 className="h-5 w-5 animate-spin" />
												) : (
													<Eye className="h-5 w-5" />
												)}
												{isMonitoringLoading ? 'Adicionando...' : 'Monitorar Produto'}
											</button>
										) : (
											<button
												onClick={handleUnmonitor}
												disabled={isMonitoringLoading}
												className="w-full bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-500 transition-all duration-200 flex items-center justify-center gap-2"
											>
												{isMonitoringLoading ? (
													<Loader2 className="h-5 w-5 animate-spin" />
												) : (
													<EyeOff className="h-5 w-5" />
												)}
												{isMonitoringLoading ? 'Removendo...' : 'Monitorando'}
											</button>
										)}
										{monitorError && (
											<p className="text-red-500 text-sm mt-2">{monitorError}</p>
										)}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Seção de Estatísticas (Expansível) */}
				<div className="mb-6">
					<button
						onClick={toggleChart}
						className="w-full bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-2xl p-6 hover:border-purple-600 transition-colors text-left flex items-center justify-between"
					>
						<div className="flex items-center gap-3">
							<TrendingDown className="h-6 w-6 text-purple-600 dark:text-primary" />
							<div>
								<h2 className="text-xl font-semibold text-gray-900 dark:text-white">
									Histórico de Preços
								</h2>
								<p className="text-gray-600 dark:text-dark-400 text-sm">
									Visualize as mudanças de preço ao longo do tempo
								</p>
							</div>
						</div>
						{showChart ? (
							<ChevronUp className="h-6 w-6 text-gray-600 dark:text-dark-400" />
						) : (
							<ChevronDown className="h-6 w-6 text-gray-600 dark:text-dark-400" />
						)}
					</button>

					{/* Gráfico (Lazy Loading) */}
					{showChart && (
						<div className="mt-4 animate-slide-up">
							<PriceHistoryChart productId={product.id} />
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

