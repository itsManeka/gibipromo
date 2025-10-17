import React from 'react'
import { TrendingDown, BookOpen, ExternalLink } from 'lucide-react'
import { Product } from '../api/products.service'

/**
 * Card de produto padronizado
 * Usado em: Home (LatestPromotions), Promotions, AddProducts, Profile
 */
interface ProductCardProps {
	product: Product
	className?: string
}

export function ProductCard({ product, className = '' }: ProductCardProps) {
	const discount = Math.round(((product.full_price - product.price) / product.full_price) * 100)

	return (
		<a
			href={product.url}
			target="_blank"
			rel="noopener noreferrer"
			className={`card-product group ${className}`}
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
}
