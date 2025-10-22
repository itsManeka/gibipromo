import React, { useState, useEffect } from 'react'
import { Link2, Clock, AlertCircle, Loader2, CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import { productsService, Product } from '../api/products.service'
import { ProductCard } from '../components'
import { useLinkStatus } from '../hooks/useLinkStatus'
import { Link } from 'react-router-dom'

/**
 * Página para adicionar múltiplos produtos para monitoramento
 * Permite adicionar vários links de uma vez
 * Usa padrão de cards consistente com a tela Promotions
 */
export function AddProducts() {
	// Estado do formulário
	const [urls, setUrls] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [results, setResults] = useState<Array<{ url: string; success: boolean; message: string }>>([])
	const { isLinking } = useLinkStatus()

	// Estado dos produtos recentes
	const [recentProducts, setRecentProducts] = useState<Product[]>([])
	const [isLoadingRecent, setIsLoadingRecent] = useState(true)

	// Buscar produtos recentemente adicionados
	useEffect(() => {
		fetchRecentProducts()
	}, [])

	const fetchRecentProducts = async () => {
		try {
			setIsLoadingRecent(true)
			// Pegar os 6 mais recentes (já vem ordenados por created_at)
			const response = await productsService.getUserProducts(6, 'created')
			setRecentProducts(response)
		} catch (error) {
			console.error('Erro ao buscar produtos recentes:', error)
		} finally {
			setIsLoadingRecent(false)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setResults([])

		// Extrair URLs (separadas por quebra de linha ou espaço)
		const urlList = urls
			.split(/[\n\s]+/)
			.map(url => url.trim())
			.filter(url => url.length > 0)

		if (urlList.length === 0) {
			setResults([{ url: '', success: false, message: 'Nenhuma URL informada' }])
			return
		}

		setIsSubmitting(true)

		// Processar cada URL
		const processResults: Array<{ url: string; success: boolean; message: string }> = []

		for (const url of urlList) {
			try {
				const response = await productsService.addProductByUrl(url)
				processResults.push({
					url,
					success: true,
					message: response.message || 'Produto adicionado com sucesso'
				})
			} catch (error: any) {
				processResults.push({
					url,
					success: false,
					message: error.message || 'Erro ao adicionar produto'
				})
			}
		}

		setResults(processResults)
		setIsSubmitting(false)

		// Limpar formulário se todos tiveram sucesso
		const allSuccess = processResults.every(r => r.success)
		if (allSuccess) {
			setUrls('')
		}
	}

	return (
		<div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
			<div className="max-w-5xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white mb-2">
						🛍️ Adicionar Produtos
					</h1>
					<p className="text-gray-600 dark:text-dark-300">
						Cole os links dos produtos da Amazon que você deseja monitorar
					</p>
				</div>

				{/* Alerta de Vínculo */}
				{isLinking && (
					<div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
						<p className="text-sm text-blue-700 dark:text-blue-300">
							⏳ Vínculo em andamento. Aguarde a conclusão para adicionar produtos.
						</p>
					</div>
				)}

				{/* Formulário Principal */}
				<div className="card mb-8">
					<div className="flex items-center gap-3 mb-6">
						<div className="p-3 rounded-xl">
							<Link2 className="h-6 w-6 text-dark dark:text-white" />
						</div>
						<div>
							<h2 className="text-xl font-bold text-gray-900 dark:text-white">Cole os Links</h2>
							<p className="text-sm text-gray-600 dark:text-dark-300">Você pode adicionar múltiplos produtos de uma vez</p>
						</div>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label htmlFor="urls" className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
								URLs dos Produtos
							</label>
							<textarea
								id="urls"
								value={urls}
								onChange={(e) => setUrls(e.target.value)}
								placeholder="Cole um ou mais links da Amazon (um por linha)&#10;https://www.amazon.com.br/produto1&#10;https://www.amazon.com.br/produto2&#10;https://amzn.to/xyz"
								rows={6}
								className="input w-full resize-none"
								disabled={isSubmitting}
							/>
							<p className="mt-2 text-sm text-gray-500 dark:text-dark-400">
								Você pode usar links diretos ou encurtados (amzn.to, a.co). Separe múltiplos links por linha.
							</p>
						</div>

						{/* Aviso de Processamento */}
						<div className="bg-purple-100 dark:bg-yellow-500/10 border border-purple-200 dark:border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
							<Clock className="h-5 w-5 text-purple-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
							<div className="text-sm text-purple-800 dark:text-yellow-200">
								<strong className="font-semibold">Tempo de processamento:</strong> Os produtos podem levar até 5 minutos para serem processados e aparecerem na sua lista.
							</div>
						</div>

						{/* Botão Submit */}
						<button
							type="submit"
							disabled={isSubmitting || !urls.trim() || isLinking}
							className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
						>
							{isSubmitting ? (
								<>
									<Loader2 className="w-5 h-5 animate-spin" />
									Adicionando produtos...
								</>
							) : (
								<>
									<Link2 className="w-5 h-5" />
									Adicionar Produtos
								</>
							)}
						</button>
					</form>

					{/* Resultados */}
					{results.length > 0 && (
						<div className="mt-6 space-y-2">
							<h3 className="font-semibold text-white mb-3">Resultados:</h3>
							{results.map((result, index) => (
								<div
									key={index}
									className={`p-3 rounded-lg border flex items-start gap-3 ${
										result.success
											? 'bg-green-500/10 border-green-500/20'
											: 'bg-red-500/10 border-red-500/20'
									}`}
								>
									{result.success ? (
										<CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
									) : (
										<XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
									)}
									<div className="flex-1 min-w-0">
										<p className={`text-sm font-medium ${result.success ? 'text-green-400' : 'text-red-400'}`}>
											{result.message}
										</p>
										{result.url && (
											<p className="text-xs text-dark-400 truncate mt-1">{result.url}</p>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Produtos Monitorados - Mesmo padrão da tela Promotions */}
				<div className="mb-8">
					<div className="flex items-center justify-between mb-6">
						<div>
							<h2 className="text-2xl font-display font-bold text-white mb-1">
								Últimos produtos adicionados
							</h2>
							<p className="text-dark-300 text-sm">
								{isLoadingRecent ? 'Carregando...' : `${recentProducts.length} produto${recentProducts.length !== 1 ? 's' : ''} recente${recentProducts.length !== 1 ? 's' : ''}`}
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

					{/* Loading */}
					{isLoadingRecent && (
						<div className="text-center py-12">
							<Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
							<p className="text-dark-300">Carregando seus produtos...</p>
						</div>
					)}

					{/* Empty State */}
					{!isLoadingRecent && recentProducts.length === 0 && (
						<div className="text-center py-12 border border-dark-700 rounded-xl">
							<AlertCircle className="h-12 w-12 text-dark-600 mx-auto mb-4" />
							<h3 className="text-lg font-semibold text-white mb-2">
								Nenhum produto monitorado ainda
							</h3>
							<p className="text-dark-300">
								Adicione produtos usando o formulário acima para começar a monitorar preços
							</p>
						</div>
					)}

					{/* Grid de Produtos - Mesmo padrão da tela Promotions */}
					{!isLoadingRecent && recentProducts.length > 0 && (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
							{recentProducts.map((product) => (
								<ProductCard key={product.id} product={product} />
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
