import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { User, Edit3, Save, X, Bell, Star, TrendingDown, BookOpen, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import { formatDate } from '../utils/date'

export function Profile() {
	const { user } = useAuth()
	const { profile, isLoading, error, updateProfile } = useProfile()
	const [isEditing, setIsEditing] = useState(false)
	const [editedNick, setEditedNick] = useState('')
	const [updateError, setUpdateError] = useState<string | null>(null)

	// Inicializa o nick editável quando o perfil carrega
	useEffect(() => {
		if (profile?.nick) {
			setEditedNick(profile.nick)
		}
	}, [profile])

	const handleSave = async () => {
		if (!editedNick.trim()) {
			setUpdateError('O nickname não pode estar vazio')
			return
		}

		try {
			setUpdateError(null)
			await updateProfile(editedNick.trim())
			setIsEditing(false)
		} catch (err) {
			setUpdateError(err instanceof Error ? err.message : 'Erro ao atualizar perfil')
		}
	}

	const handleCancel = () => {
		setEditedNick(profile?.nick || '')
		setUpdateError(null)
		setIsEditing(false)
	}

	if (isLoading && !profile) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-yellow mx-auto mb-4"></div>
					<p className="text-primary-light">Carregando perfil...</p>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center px-4">
				<div className="card max-w-md w-full text-center">
					<AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
					<h2 className="text-xl font-semibold text-white mb-2">Erro ao carregar perfil</h2>
					<p className="text-primary-light mb-4">{error}</p>
					<button 
						onClick={() => window.location.reload()} 
						className="btn-primary"
					>
						Tentar novamente
					</button>
				</div>
			</div>
		)
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
								</div>

								{/* Informações */}
								<div className="flex-1 space-y-4">
									<div>
										<label className="block text-sm font-medium text-primary-light mb-1">
											Nickname
										</label>
										{isEditing ? (
											<div>
												<input
													type="text"
													className="input w-full"
													value={editedNick}
													onChange={(e) => setEditedNick(e.target.value)}
													placeholder="Digite seu nickname"
												/>
												{updateError && (
													<p className="text-red-400 text-sm mt-1">{updateError}</p>
												)}
											</div>
										) : (
											<p className="text-white">{profile?.nick || 'Não definido'}</p>
										)}
									</div>

									<div>
										<label className="block text-sm font-medium text-primary-light mb-1">
											Email
										</label>
										<p className="text-white">{user?.email}</p>
									</div>

									<div>
										<label className="block text-sm font-medium text-primary-light mb-1">
											Membro desde
										</label>
										<p className="text-sm text-gray-400">
											{user?.created_at ? formatDate(user.created_at) : 'Data não disponível'}
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
									Vincular Telegram
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
								⭐ Últimas promoções
							</h2>
							{/* Link para as promoções */}
							<Link to="/promocoes" className="btn-ghost inline-flex items-center space-x-2 text-sm">
								<span>Ver todas as promoções</span>
							</Link>
						</div>

						{/* Placeholder - será implementado quando integrar com produtos */}
						<div className="text-center py-12">
							<BookOpen className="h-12 w-12 text-primary-light mx-auto mb-4 opacity-50" />
							<p className="text-primary-light">
								Você ainda não tem produtos monitorados.
							</p>
							<Link to="/promocoes" className="btn-primary mt-4 inline-block">
								Adicionar produto
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}