import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts'
import { Loader2, TrendingDown, Calendar } from 'lucide-react'
import { productsService, ProductStats } from '../api/products.service'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Props do componente PriceHistoryChart
 */
interface PriceHistoryChartProps {
	productId: string
	className?: string
}

/**
 * Período de visualização do gráfico
 */
type Period = 30 | 90 | 180 | 365

/**
 * Componente de gráfico de histórico de preços
 * Usa Recharts para visualizar mudanças de preço ao longo do tempo
 */
export function PriceHistoryChart({ productId, className = '' }: PriceHistoryChartProps) {
	const [stats, setStats] = useState<ProductStats[]>([])
	const [period, setPeriod] = useState<Period>(30)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Carregar estatísticas quando período mudar
	useEffect(() => {
		loadStats()
	}, [productId, period])

	/**
	 * Carregar estatísticas da API
	 */
	const loadStats = async () => {
		setIsLoading(true)
		setError(null)

		try {
			const data = await productsService.getProductStats(productId, period)
			setStats(data)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas')
		} finally {
			setIsLoading(false)
		}
	}

	/**
	 * Formatar dados para o Recharts
	 */
	const chartData = stats.map(stat => ({
		date: new Date(stat.created_at).getTime(),
		price: stat.price,
		old_price: stat.old_price,
		formatted_date: format(new Date(stat.created_at), 'dd/MM/yyyy', { locale: ptBR })
	}))

	/**
	 * Calcular menor e maior preço para range do gráfico
	 */
	const prices = stats.map(s => s.price)
	const minPrice = prices.length > 0 ? Math.min(...prices) : 0
	const maxPrice = prices.length > 0 ? Math.max(...prices) : 100

	/**
	 * Adicionar padding ao range do gráfico
	 */
	const priceRange = maxPrice - minPrice
	const yAxisMin = Math.max(0, minPrice - priceRange * 0.1)
	const yAxisMax = maxPrice + priceRange * 0.1

	/**
	 * Tooltip customizado
	 */
	const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
		if (active && payload && payload.length) {
			const data = payload[0].payload
			const percentageChange = ((data.old_price - data.price) / data.old_price) * 100

			return (
				<div className="bg-dark-800 border border-dark-700 rounded-lg p-3 shadow-lg">
					<p className="text-dark-300 text-sm mb-2 flex items-center gap-1">
						<Calendar className="h-3 w-3" />
						{data.formatted_date}
					</p>
					<p className="text-white font-semibold text-lg mb-1">
						R$ {data.price.toFixed(2)}
					</p>
					{data.old_price !== data.price && (
						<p className="text-dark-400 text-sm flex items-center gap-1">
							<TrendingDown className="h-3 w-3 text-green-500" />
							<span className="line-through">R$ {data.old_price.toFixed(2)}</span>
							<span className="text-green-500 ml-1">
								-{percentageChange.toFixed(1)}%
							</span>
						</p>
					)}
				</div>
			)
		}
		return null
	}

	return (
		<div className={`bg-dark-900 border border-dark-700 rounded-2xl p-6 ${className}`}>
			{/* Header com seletor de período */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
				<h3 className="text-xl font-semibold text-white flex items-center gap-2">
					<TrendingDown className="h-5 w-5 text-primary" />
					Histórico de Preços
				</h3>

				<div className="flex gap-2">
					{([30, 90, 180, 365] as Period[]).map((p) => (
						<button
							key={p}
							onClick={() => setPeriod(p)}
							className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
								period === p
									? 'bg-purple-600 text-white'
									: 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white'
							}`}
							disabled={isLoading}
						>
							{p}d
						</button>
					))}
				</div>
			</div>

			{/* Loading */}
			{isLoading && (
				<div className="flex items-center justify-center py-20">
					<Loader2 className="h-8 w-8 text-primary animate-spin" />
				</div>
			)}

			{/* Erro */}
			{!isLoading && error && (
				<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
					<p className="text-red-500">{error}</p>
					<button
						onClick={loadStats}
						className="mt-3 text-sm text-white hover:text-primary transition-colors"
					>
						Tentar novamente
					</button>
				</div>
			)}

			{/* Empty state */}
			{!isLoading && !error && stats.length === 0 && (
				<div className="text-center py-20">
					<TrendingDown className="h-12 w-12 text-dark-600 mx-auto mb-4" />
					<p className="text-dark-400">
						Nenhuma alteração de preço registrada nos últimos {period} dias
					</p>
				</div>
			)}

			{/* Gráfico */}
			{!isLoading && !error && stats.length > 0 && (
				<div className="w-full h-80">
					<ResponsiveContainer width="100%" height="100%">
						<LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
							<CartesianGrid strokeDasharray="3 3" stroke="#44444F" />
							<XAxis
								dataKey="formatted_date"
								stroke="#9191A3"
								tick={{ fill: '#9191A3', fontSize: 12 }}
								angle={-45}
								textAnchor="end"
								height={80}
							/>
							<YAxis
								stroke="#9191A3"
								tick={{ fill: '#9191A3', fontSize: 12 }}
								domain={[yAxisMin, yAxisMax]}
								tickFormatter={(value) => `R$ ${value.toFixed(0)}`}
							/>
							<Tooltip content={<CustomTooltip />} />
							<Line
								type="monotone"
								dataKey="price"
								stroke="#6C2BD9"
								strokeWidth={2}
								dot={{ fill: '#6C2BD9', r: 4 }}
								activeDot={{ r: 6, fill: '#F5C542' }}
							/>
						</LineChart>
					</ResponsiveContainer>

					{/* Estatísticas resumidas */}
					<div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-dark-700">
						<div>
							<p className="text-dark-400 text-sm mb-1">Menor Preço</p>
							<p className="text-green-500 font-semibold text-lg">
								R$ {minPrice.toFixed(2)}
							</p>
						</div>
						<div>
							<p className="text-dark-400 text-sm mb-1">Maior Preço</p>
							<p className="text-red-500 font-semibold text-lg">
								R$ {maxPrice.toFixed(2)}
							</p>
						</div>
						<div className="col-span-2 sm:col-span-1">
							<p className="text-dark-400 text-sm mb-1">Alterações</p>
							<p className="text-white font-semibold text-lg">
								{stats.length} registro{stats.length !== 1 ? 's' : ''}
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

