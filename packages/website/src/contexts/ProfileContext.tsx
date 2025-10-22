import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { profileService, UserProfile } from '../api';
import { useAuth } from './AuthContext';

/**
 * Contexto do perfil do usuário
 */
interface ProfileContextType {
	profile: UserProfile | null;
	isLoading: boolean;
	error: string | null;
	fetchProfile: () => Promise<void>;
	updateProfile: (nick: string) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

/**
 * Provider do perfil do usuário
 * Gerencia estado global do perfil e sincronização com a API
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { isAuthenticated } = useAuth();

	/**
	 * Busca o perfil do usuário autenticado
	 */
	const fetchProfile = async () => {
		if (!isAuthenticated) {
			setProfile(null);
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const data = await profileService.getProfile();
			setProfile(data);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar perfil';
			setError(errorMessage);
			console.error('Erro ao buscar perfil:', err);
		} finally {
			setIsLoading(false);
		}
	};

	/**
	 * Atualiza o nickname do usuário
	 * @param nick - Novo nickname
	 */
	const updateProfile = async (nick: string) => {
		setIsLoading(true);
		setError(null);

		try {
			const updated = await profileService.updateProfile({ nick });
			setProfile(updated);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar perfil';
			setError(errorMessage);
			console.error('Erro ao atualizar perfil:', err);
			throw err; // Re-throw para que o componente possa tratar
		} finally {
			setIsLoading(false);
		}
	};

	/**
	 * Carrega perfil automaticamente quando usuário autentica
	 */
	useEffect(() => {
		if (isAuthenticated) {
			fetchProfile();
		} else {
			setProfile(null);
			setError(null);
		}
	}, [isAuthenticated]);

	const value: ProfileContextType = {
		profile,
		isLoading,
		error,
		fetchProfile,
		updateProfile,
	};

	return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

/**
 * Hook para consumir o contexto de perfil
 */
export function useProfile() {
	const context = useContext(ProfileContext);

	if (context === undefined) {
		throw new Error('useProfile must be used within a ProfileProvider');
	}

	return context;
}
