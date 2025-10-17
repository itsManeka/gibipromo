import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { productsService, Product } from '../api/products.service'
import { ProductCard } from './ProductCard'

/**
 * Componente de Últimas Promoções
 * Exibe as 3 promoções mais recentes na home page
 * Ordenadas por updated_at (data de atualização do preço)
 * Usa o mesmo padrão visual da tela Promotions via ProductCard
 */
export function LatestPromotions() {
	const [products, setProducts] = useState<Product[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		fetchLatestPromotions()
	}, [])

	const fetchLatestPromotions = async () => {
		try {
			setIsLoading(true)
			setError(null)
			const data = await productsService.getLatestPromotions(3)
			setProducts(data)
		} catch (err) {
			console.error('Erro ao buscar últimas promoções:', err)
			setError('Não foi possível carregar as promoções')
		} finally {
			setIsLoading(false)
		}
	}

	// Loading state
	if (isLoading) {
		return (
			<section className="py-16 bg-dark-800">
				<div className="max-w-7xl mx-auto px-4">
					<div className="text-center">
						<Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
						<p className="text-dark-300">Carregando promoções...</p>
					</div>
				</div>
			</section>
		)
	}

	// Error state
	if (error) {
		return (
			<section className="py-16 bg-dark-800">
				<div className="max-w-7xl mx-auto px-4">
					<div className="text-center bg-red-500/10 border border-red-500/20 rounded-xl p-8">
						<AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
						<p className="text-red-400">{error}</p>
					</div>
				</div>
			</section>
		)
	}

	// Empty state
	if (products.length === 0) {
		return null
	}

	return (
		<section className="py-16 px-4 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="flex justify-between items-center mb-8">
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

				{/* Grid de Produtos - Mesmo padrão da tela Promotions */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{products.map((product) => (
						<ProductCard key={product.id} product={product} />
					))}
				</div>
			</div>
		</section>
	)
}
