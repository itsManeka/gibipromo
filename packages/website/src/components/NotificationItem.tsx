import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
	CheckIcon,
	TrashIcon,
	ShoppingCartIcon,
	TagIcon,
	ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { Notification, NotificationStatus, NotificationType } from '@gibipromo/shared';
import { useNotifications } from '../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationItemProps {
	notification: Notification;
	/** Se true, exibe versão compacta (para dropdown) */
	compact?: boolean;
	/** Callback chamado ao clicar na notificação */
	onClick?: () => void;
	/** Variante de estilo: 'dropdown' para fundo roxo, 'page' para fundo transparente */
	variant?: 'dropdown' | 'page';
	/** Callback chamado após deletar a notificação */
	onDelete?: () => void;
	/** Callback chamado após marcar como lida */
	onMarkAsRead?: () => void;
}

/**
 * Componente para exibir uma notificação individual
 * 
 * Features:
 * - Mostra ícone baseado no tipo da notificação
 * - Destaca notificações não lidas
 * - Exibe timestamp relativo (ex: "há 5 minutos")
 * - Ações: marcar como lida, deletar, ver produto
 * - Suporta modo compacto para dropdown
 * - Suporta variantes de estilo (dropdown/page)
 * 
 * @example
 * ```tsx
 * <NotificationItem notification={notif} />
 * <NotificationItem notification={notif} compact variant="dropdown" onClick={() => closeDropdown()} />
 * <NotificationItem notification={notif} variant="page" />
 * ```
 */
export default function NotificationItem({ notification, compact = false, onClick, variant = 'dropdown', onDelete, onMarkAsRead }: NotificationItemProps) {
	const { markAsRead, deleteNotification } = useNotifications();
	const navigate = useNavigate();

	const isUnread = notification.status === NotificationStatus.UNREAD;

	// Ícone baseado no tipo
	const getIcon = () => {
		switch (notification.type) {
			case NotificationType.PRODUCT_ADDED:
				return <ShoppingCartIcon className="h-5 w-5 text-white" />;
			case NotificationType.PRICE_DROP:
				return <TagIcon className="h-5 w-5 text-white" />;
			default:
				return <CheckIcon className="h-5 w-5 text-white" />;
		}
	};

	// Timestamp relativo
	const getRelativeTime = () => {
		try {
			return formatDistanceToNow(new Date(notification.created_at), {
				addSuffix: true,
				locale: ptBR
			});
		} catch {
			return 'recentemente';
		}
	};

	// Handler para marcar como lida
	const handleMarkAsRead = async (e: React.MouseEvent) => {
		e.stopPropagation();
		if (isUnread) {
			await markAsRead(notification.id);
			onMarkAsRead?.();
		}
	};

	// Handler para deletar
	const handleDelete = async (e: React.MouseEvent) => {
		e.stopPropagation();
		if (confirm('Deseja realmente excluir esta notificação?')) {
			await deleteNotification(notification.id);
			onDelete?.();
		}
	};

	// Handler para ver produto
	const handleViewProduct = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (notification.metadata?.product_id) {
			// Marca como lida ao clicar no produto
			if (isUnread) {
				markAsRead(notification.id);
				onMarkAsRead?.();
			}
			navigate(`/produto/${notification.metadata.product_id}`);
			onClick?.();
		}
	};

	// Handler para abrir Amazon
	const handleViewAmazon = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (notification.metadata?.url) {
			// Marca como lida ao clicar
			if (isUnread) {
				markAsRead(notification.id);
				onMarkAsRead?.();
			}
			window.open(notification.metadata.url, '_blank', 'noopener,noreferrer');
		}
	};

	// Handler para clicar no card
	const handleCardClick = () => {
		// Marca como lida
		if (isUnread) {
			markAsRead(notification.id);
			onMarkAsRead?.();
		}
		
		// Se tiver produto vinculado, navega para ele
		if (notification.metadata?.product_id) {
			navigate(`/produto/${notification.metadata.product_id}`);
		}
		
		// Fecha dropdown (se aplicável)
		onClick?.();
	};

	// Classes de background baseadas na variante
	const getBackgroundClasses = () => {
		if (variant === 'page') {
			// Para a página completa: sem background quando lida, sutil quando não lida
			if (isUnread) {
				return 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/70';
			}
			return 'bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800/30';
		}
		
		// Para o dropdown: backgrounds roxos com hover mais perceptível para lidas
		if (isUnread) {
			return 'bg-purple-50 dark:bg-purple-800/30 hover:bg-purple-100 dark:hover:bg-purple-800/50';
		}
		return 'bg-transparent hover:bg-purple-200/60 dark:hover:bg-purple-600/40';
	};

	return (
		<div
			onClick={handleCardClick}
			className={`
				transition-all cursor-pointer relative
				${getBackgroundClasses()}
				${compact ? 'p-3' : 'p-4'}
				${isUnread && compact ? 'animate-pulse-subtle' : ''}
			`}
		>
			<div className="flex items-start gap-3">
				{/* Ícone */}
				<div className="flex-shrink-0 mt-0.5">
					{getIcon()}
				</div>

				{/* Conteúdo */}
				<div className="flex-1 min-w-0">
					{/* Título e timestamp */}
					<div className="flex items-start justify-between gap-2 mb-1">
						<div className="flex items-center gap-2 flex-1 min-w-0">
							{isUnread && (
								<span className="flex-shrink-0 w-2 h-2 bg-primary-yellow rounded-full" aria-label="Não lida"></span>
							)}
							<h3 className={`
								text-sm font-medium text-white
								${isUnread ? 'font-semibold' : ''}
								${compact ? 'line-clamp-1' : ''}
							`}>
								{notification.title}
							</h3>
						</div>
						<span className="flex-shrink-0 text-xs text-gray-400 whitespace-nowrap">
							{getRelativeTime()}
						</span>
					</div>

					{/* Mensagem */}
					<p className={`
						text-sm text-gray-300
						${compact ? 'line-clamp-2' : 'line-clamp-3'}
					`}>
						{notification.message}
					</p>

					{/* Informações extras no modo compacto */}
					{compact && notification.metadata?.new_price && notification.metadata?.old_price && (
						<div className="flex items-center gap-2 mt-2">
							<span className="text-xs text-gray-400 line-through">
								R$ {notification.metadata.old_price.toFixed(2)}
							</span>
							<span className="text-sm font-semibold text-green-400">
								R$ {notification.metadata.new_price.toFixed(2)}
							</span>
							<span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
								{Math.round(((notification.metadata.old_price - notification.metadata.new_price) / notification.metadata.old_price) * 100)}% OFF
							</span>
						</div>
					)}

					{/* Ações */}
					{!compact && (
						<div className="flex items-center gap-3 mt-3 flex-wrap">
							{/* Ver produto */}
							{notification.metadata?.product_id && (
								<button
									onClick={handleViewProduct}
									className="text-xs font-medium text-primary-yellow hover:text-primary-yellow/80 transition-colors"
								>
									Ver produto
								</button>
							)}

							{/* Ver na Amazon */}
							{notification.metadata?.url && (
								<button
									onClick={handleViewAmazon}
									className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
									aria-label="Ver na Amazon"
								>
									<ArrowTopRightOnSquareIcon className="h-4 w-4" />
									Ver na Amazon
								</button>
							)}

							{/* Marcar como lida */}
							{isUnread && (
								<button
									onClick={handleMarkAsRead}
									className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
									aria-label="Marcar como lida"
								>
									<CheckIcon className="h-4 w-4" />
									Marcar como lida
								</button>
							)}

							{/* Deletar */}
							<button
								onClick={handleDelete}
								className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors ml-auto"
								aria-label="Excluir notificação"
							>
								<TrashIcon className="h-4 w-4" />
								Excluir
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
