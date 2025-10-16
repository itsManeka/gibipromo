import React, { useState } from 'react'
import { Search, Filter, X, ChevronDown } from 'lucide-react'
import { PromotionFilters as IPromotionFilters, FilterOptions } from '../api/products.service'
import { useAuth } from '../contexts/AuthContext'

interface PromotionFiltersProps {
	filters: IPromotionFilters
	filterOptions: FilterOptions
	onFilterChange: (filters: IPromotionFilters) => void
}

/**
 * Componente de filtros para promoções
 * Responsivo e otimizado para mobile
 */
export function PromotionFilters({ filters, filterOptions, onFilterChange }: PromotionFiltersProps) {
	const { isAuthenticated } = useAuth()
	const [isExpanded, setIsExpanded] = useState(false) // Começa fechado
	const [contributorsSearch, setContributorsSearch] = useState('')

	const updateFilter = <K extends keyof IPromotionFilters>(
		key: K,
		value: IPromotionFilters[K]
	) => {
		onFilterChange({ ...filters, [key]: value })
	}

	const toggleContributor = (contributor: string) => {
		const current = filters.contributors || []
		const isSelected = current.includes(contributor)

		if (isSelected) {
			updateFilter('contributors', current.filter(c => c !== contributor))
		} else {
			updateFilter('contributors', [...current, contributor])
		}
	}

	const clearAllFilters = () => {
		onFilterChange({
			inStock: true, // Mantém padrão
			onlyMyProducts: false
		})
		setContributorsSearch('')
	}

	const hasActiveFilters = () => {
		return !!(
			filters.query ||
			filters.category ||
			filters.publisher ||
			filters.genre ||
			filters.format ||
			(filters.contributors && filters.contributors.length > 0) ||
			filters.preorder ||
			filters.onlyMyProducts
		)
	}

	// Filtrar contributors para busca
	const filteredContributors = filterOptions.contributors.filter(c =>
		c.toLowerCase().includes(contributorsSearch.toLowerCase())
	)

	return (
		<div className="bg-dark-900 rounded-2xl overflow-hidden mb-8">
			{/* Header com toggle (mobile) */}
			<div className="p-4 md:p-6 border-b border-dark-700">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Filter className="h-5 w-5 text-primary" />
						<h2 className="text-lg font-semibold text-white">Filtros</h2>
						{hasActiveFilters() && (
							<span className="px-2 py-1 text-xs font-medium bg-primary/20 text-primary rounded-full">
								Ativos
							</span>
						)}
					</div>
					<div className="flex items-center gap-2">
						{hasActiveFilters() && (
							<button
								onClick={clearAllFilters}
								className="text-sm text-dark-400 hover:text-primary transition-colors flex items-center gap-1"
							>
								<X className="h-4 w-4" />
								<span className="hidden sm:inline">Limpar</span>
							</button>
						)}
						<button
							onClick={() => setIsExpanded(!isExpanded)}
							className="p-2 hover:bg-dark-800 rounded-lg transition-colors flex items-center gap-2"
							aria-label={isExpanded ? 'Recolher filtros' : 'Expandir filtros'}
						>
							<span className="text-sm text-dark-300 hidden sm:inline">
								{isExpanded ? 'Recolher' : 'Expandir'}
							</span>
							<ChevronDown
								className={`h-5 w-5 text-dark-400 transition-transform ${
									isExpanded ? 'rotate-180' : ''
								}`}
							/>
						</button>
					</div>
				</div>
			</div>

			{/* Filtros (colapsável em mobile) */}
			<div className={`${isExpanded ? 'block' : 'hidden'}`}>
				<div className="p-4 md:p-6 space-y-6">
					{/* Grid de filtros */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
						{/* Filtro "Meus Produtos" - Apenas se logado */}
						{isAuthenticated && (
							<div className="sm:col-span-2 lg:col-span-1">
								<label className="block text-sm font-medium text-primary-light mb-2">
									Escopo
								</label>
								<select
									className="input w-full"
									value={filters.onlyMyProducts ? 'mine' : 'all'}
									onChange={e => updateFilter('onlyMyProducts', e.target.value === 'mine')}
								>
									<option value="all">Todos os Produtos</option>
									<option value="mine">Meus Produtos</option>
								</select>
							</div>
						)}

						{/* Busca */}
						<div className={`${isAuthenticated ? 'sm:col-span-2 lg:col-span-2' : 'sm:col-span-2 lg:col-span-3'}`}>
							<label className="block text-sm font-medium text-primary-light mb-2">
								Buscar
							</label>
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark-400" />
								<input
									type="text"
									placeholder="Título ou Autores e Ilustradores..."
									className="input pl-10 w-full"
									value={filters.query || ''}
									onChange={e => updateFilter('query', e.target.value)}
								/>
								{filters.query && (
									<button
										onClick={() => updateFilter('query', undefined)}
										className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-white"
									>
										<X className="h-4 w-4" />
									</button>
								)}
							</div>
						</div>

						{/* Categoria */}
						<div>
							<label className="block text-sm font-medium text-primary-light mb-2">
								Categoria
							</label>
							<select
								className="input w-full"
								value={filters.category || ''}
								onChange={e => updateFilter('category', e.target.value || undefined)}
							>
								<option value="">Todas</option>
								{filterOptions.categories.map(cat => (
									<option key={cat} value={cat}>
										{cat}
									</option>
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
								value={filters.publisher || ''}
								onChange={e => updateFilter('publisher', e.target.value || undefined)}
							>
								<option value="">Todas</option>
								{filterOptions.publishers.map(pub => (
									<option key={pub} value={pub}>
										{pub}
									</option>
								))}
							</select>
						</div>

						{/* Gênero */}
						<div>
							<label className="block text-sm font-medium text-primary-light mb-2">
								Gênero
							</label>
							<select
								className="input w-full"
								value={filters.genre || ''}
								onChange={e => updateFilter('genre', e.target.value || undefined)}
							>
								<option value="">Todos</option>
								{filterOptions.genres.map(genre => (
									<option key={genre} value={genre}>
										{genre}
									</option>
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
								value={filters.format || ''}
								onChange={e => updateFilter('format', e.target.value || undefined)}
							>
								<option value="">Todos</option>
								{filterOptions.formats.map(format => (
									<option key={format} value={format}>
										{format}
									</option>
								))}
							</select>
						</div>
					</div>

					{/* Multi-select de Autores e Ilustradores */}
					{filterOptions.contributors.length > 0 && (
						<div>
							<label className="block text-sm font-medium text-primary-light mb-2">
								Autores e Ilustradores
								{filters.contributors && filters.contributors.length > 0 && (
									<span className="ml-2 text-xs text-primary">
										({filters.contributors.length} selecionados)
									</span>
								)}
							</label>

							{/* Busca de contributors */}
							<div className="relative mb-3">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark-400" />
								<input
									type="text"
									placeholder="Buscar autor ou ilustrador..."
									className="input pl-10 w-full"
									value={contributorsSearch}
									onChange={e => setContributorsSearch(e.target.value)}
								/>
								{contributorsSearch && (
									<button
										onClick={() => setContributorsSearch('')}
										className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-white"
									>
										<X className="h-4 w-4" />
									</button>
								)}
							</div>

							{/* Lista de contributors */}
							<div className="max-h-48 overflow-y-auto border border-dark-700 rounded-lg p-2 space-y-1">
								{filteredContributors.length > 0 ? (
									filteredContributors.map(contributor => {
										const isSelected = filters.contributors?.includes(contributor) || false
										return (
											<label
												key={contributor}
												className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
													isSelected
														? 'bg-primary/20 text-primary'
														: 'hover:bg-dark-800 text-dark-300'
												}`}
											>
												<input
													type="checkbox"
													checked={isSelected}
													onChange={() => toggleContributor(contributor)}
													className="form-checkbox h-4 w-4 text-primary rounded border-dark-600 focus:ring-primary focus:ring-offset-dark-900"
												/>
												<span className="text-sm font-medium">{contributor}</span>
											</label>
										)
									})
								) : (
									<p className="text-sm text-dark-400 text-center py-4">
										Nenhum resultado encontrado
									</p>
								)}
							</div>
						</div>
					)}

					{/* Checkboxes */}
					<div className="flex flex-wrap items-center gap-4 pt-4 border-t border-dark-700">
						<label className="flex items-center gap-2 cursor-pointer group">
							<input
								type="checkbox"
								checked={filters.inStock !== false}
								onChange={e => updateFilter('inStock', e.target.checked)}
								className="form-checkbox h-5 w-5 text-primary rounded border-dark-600 focus:ring-primary focus:ring-offset-dark-900"
							/>
							<span className="text-sm font-medium text-dark-300 group-hover:text-white transition-colors">
								Apenas em Estoque
							</span>
						</label>

						<label className="flex items-center gap-2 cursor-pointer group">
							<input
								type="checkbox"
								checked={filters.preorder || false}
								onChange={e => updateFilter('preorder', e.target.checked)}
								className="form-checkbox h-5 w-5 text-primary rounded border-dark-600 focus:ring-primary focus:ring-offset-dark-900"
							/>
							<span className="text-sm font-medium text-dark-300 group-hover:text-white transition-colors">
								Apenas Pré-vendas
							</span>
						</label>
					</div>
				</div>
			</div>
		</div>
	)
}
