import React, { useState, useRef, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationDropdown from './NotificationDropdown';

/**
 * Componente de ícone de sino com badge de notificações não lidas
 * 
 * Features:
 * - Exibe contador de notificações não lidas
 * - Ícone muda quando há notificações não lidas
 * - Dropdown com preview das últimas notificações
 * - Fecha ao clicar fora
 * 
 * @example
 * ```tsx
 * <NotificationBell />
 * ```
 */
export default function NotificationBell() {
	const { unreadCount } = useNotifications();
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Fecha dropdown ao clicar fora
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => {
				document.removeEventListener('mousedown', handleClickOutside);
			};
		}
	}, [isOpen]);

	const toggleDropdown = () => {
		setIsOpen(!isOpen);
	};

	const hasUnread = unreadCount > 0;
	const Icon = hasUnread ? BellIconSolid : BellIcon;

	return (
		<div className="relative" ref={dropdownRef}>
			{/* Botão do sino */}
			<button
				onClick={toggleDropdown}
				className={`
					relative p-2 rounded-full transition-colors
					${hasUnread
						? 'text-purple-900 dark:text-gray-100 hover:bg-purple-200 dark:hover:bg-purple-700'
						: 'text-purple-900 dark:text-gray-100 hover:bg-purple-200 dark:hover:bg-purple-700'
					}
				`}
				aria-label="Notificações"
				aria-haspopup="true"
				aria-expanded={isOpen}
			>
				<Icon className="h-6 w-6" />

				{/* Badge de contador */}
				{hasUnread && (
					<span
						className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] text-white font-bold bg-red-600 rounded-full"
						aria-label={`${unreadCount} notificações não lidas`}
					>
						{unreadCount > 99 ? '99+' : unreadCount}
					</span>
				)}
			</button>

			{/* Dropdown */}
			{isOpen && (
				<NotificationDropdown onClose={() => setIsOpen(false)} />
			)}
		</div>
	);
}
