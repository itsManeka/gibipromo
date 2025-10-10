import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { User, Edit3, Save, X, Bell, Star, TrendingDown, BookOpen } from 'lucide-react'

// Mock data do usuário
const mockUser = {
	id: '1',
	name: 'João Silva',
	email: 'joao@email.com',
	telegramUsername: '@joaosilva',
	avatar: '/api/placeholder/100/100',
	joinedAt: '2024-01-15',
	stats: {
		totalSavings: 285.50,
		alertsReceived: 42,
		favoriteProducts: 18
	}
}

// Mock data dos produtos favoritos
const favoriteProducts = [
	{
		id: '1',
		title: 'One Piece - Vol. 1',
		author: 'Eiichiro Oda',
		currentPrice: 19.90,
		targetPrice: 15.00,
		cover: '/api/placeholder/150/200'
	},
	{
		id: '2',
		title: 'Batman: Ano Um',
		author: 'Frank Miller',
		currentPrice: 35.50,
		targetPrice: 25.00,
		cover: '/api/placeholder/150/200'
	},
	{
		id: '3',
		title: 'Attack on Titan - Vol. 1',
		author: 'Hajime Isayama',
		currentPrice: 22.45,
		targetPrice: 18.00,
		cover: '/api/placeholder/150/200'
	}
]

export function Profile() {
	const [isEditing, setIsEditing] = useState(false)
	const [editedUser, setEditedUser] = useState(mockUser)

	const handleSave = () => {
		// Aqui seria feita a chamada para a API
		console.log('Salvando dados:', editedUser)
		setIsEditing(false)
	}

	const handleCancel = () => {
		setEditedUser(mockUser)
		setIsEditing(false)
	}

	return (
		<div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-display font-bold text-white mb-2">
						👤 Meu Perfil
					</h1>
					<p className="text-primary-light">
						Gerencie suas informações
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Informações do Perfil */}
					<div className="lg:col-span-2">
						<div className="card">
							<div className="flex justify-between items-start mb-6">
								<h2 className="text-xl font-semibold text-white">
									Informações Pessoais
								</h2>
								{!isEditing ? (
									<button
										onClick={() => setIsEditing(true)}
										className="btn-ghost inline-flex items-center space-x-2"
									>
										<Edit3 className="h-4 w-4" />
										<span>Editar</span>
									</button>
								) : (
									<div className="flex space-x-2">
										<button
											onClick={handleSave}
											className="btn-secondary inline-flex items-center space-x-2 text-sm py-2 px-4"
										>
											<Save className="h-4 w-4" />
											<span>Salvar</span>
										</button>
										<button
											onClick={handleCancel}
											className="btn-ghost inline-flex items-center space-x-2 text-sm py-2 px-4"
										>
											<X className="h-4 w-4" />
											<span>Cancelar</span>
										</button>
									</div>
								)}
							</div>

							<div className="flex items-start space-x-6 mb-6">
								{/* Avatar */}
								<div className="flex-shrink-0">
									<div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center">
										<User className="h-12 w-12 text-white" />
									</div>
									{isEditing && (
										<button className="text-primary-yellow text-sm mt-2 hover:underline">
											Alterar foto
										</button>
									)}
								</div>

								{/* Informações */}
								<div className="flex-1 space-y-4">
									<div>
										<label className="block text-sm font-medium text-primary-light mb-1">
											Nome
										</label>
										{isEditing ? (
											<input
												type="text"
												className="input w-full"
												value={editedUser.name}
												onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
											/>
										) : (
											<p className="text-white">{mockUser.name}</p>
										)}
									</div>

									<div>
										<label className="block text-sm font-medium text-primary-light mb-1">
											Email
										</label>
										<p className="text-white">{mockUser.email}</p>
									</div>

									<div>
										<label className="block text-sm font-medium text-primary-light mb-1">
											Membro desde
										</label>
										<p className="text-primary-light">
											{new Date(mockUser.joinedAt).toLocaleDateString('pt-BR')}
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Quick Actions */}
					<div className="space-y-6">
						<div className="card">
							<h3 className="text-lg font-semibold text-white mb-4">
								⚡ Ações Rápidas
							</h3>
							<div className="space-y-3">
								<button className="w-full btn-secondary text-sm py-2">
									Conectar Telegram
								</button>
								<button className="w-full btn-ghost text-sm py-2 text-red-400 hover:text-red-300">
									Excluir Conta
								</button>
							</div>
						</div>
					</div>
				</div>

				{/* Produtos Favoritos */}
				<div className="mt-12">
					<div className="card">
						<div className="flex justify-between items-center mb-6">
							<h2 className="text-xl font-semibold text-white">
								⭐ Ultimas promoções
							</h2>
							{/* Link para as promoções */}
							<Link to="/promocoes" className="btn-ghost inline-flex items-center space-x-2 text-sm">
								<span>Ver todas as promoções</span>
							</Link>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{favoriteProducts.map((product) => (
								<div key={product.id} className="bg-dark-800 rounded-xl p-4 border border-dark-700">
									<div className="flex space-x-3">
										<div className="w-16 h-20 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
											<BookOpen className="h-8 w-8 text-white opacity-50" />
										</div>
										<div className="flex-1 min-w-0">
											<h3 className="font-medium text-white text-sm line-clamp-2 mb-1">
												{product.title}
											</h3>
											<p className="text-xs text-primary-light mb-2">
												{product.author}
											</p>
											<div className="flex justify-between items-center">
												<div>
													<p className="text-xs text-primary-light">Atual</p>
													<p className="text-sm font-semibold text-white">
														R$ {product.currentPrice.toFixed(2)}
													</p>
												</div>
												<div className="text-right">
													<p className="text-xs text-primary-light">Meta</p>
													<p className="text-sm font-semibold text-primary-yellow">
														R$ {product.targetPrice.toFixed(2)}
													</p>
												</div>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}