/**
 * Popup Script
 * Gerencia interface de login/logout da extensão
 */

import { authService } from '../api/auth.service';
import { profileService } from '../api/profile.service';
import { logger } from '../utils/logger';

/**
 * Estados do popup
 */
const states = {
	loading: document.getElementById('loading-state')!,
	loggedOut: document.getElementById('logged-out-state')!,
	loggedIn: document.getElementById('logged-in-state')!,
};

/**
 * Elementos do formulário
 */
const loginForm = document.getElementById('login-form') as HTMLFormElement;
const emailInput = document.getElementById('email') as HTMLInputElement;
const passwordInput = document.getElementById('password') as HTMLInputElement;
const errorMessage = document.getElementById('error-message')!;
const logoutBtn = document.getElementById('logout-btn')!;
const userNickElement = document.getElementById('user-nick')!;

/**
 * Mostra estado específico
 */
function showState(state: 'loading' | 'loggedOut' | 'loggedIn'): void {
	Object.values(states).forEach((el) => (el.style.display = 'none'));

	switch (state) {
		case 'loading':
			states.loading.style.display = 'block';
			break;
		case 'loggedOut':
			states.loggedOut.style.display = 'block';
			break;
		case 'loggedIn':
			states.loggedIn.style.display = 'block';
			break;
	}
}

/**
 * Mostra mensagem de erro
 */
function showError(message: string): void {
	errorMessage.textContent = message;
	errorMessage.style.display = 'block';
}

/**
 * Esconde mensagem de erro
 */
function hideError(): void {
	errorMessage.style.display = 'none';
}

/**
 * Carrega estado de autenticação
 */
async function loadAuthState(): Promise<void> {
	showState('loading');

	try {
		const isAuthenticated = await authService.isAuthenticated();

		if (isAuthenticated) {
			await loadUserProfile();
			showState('loggedIn');
		} else {
			showState('loggedOut');
		}
	} catch (error) {
		logger.error('Erro ao verificar autenticação:', error);
		showState('loggedOut');
	}
}

/**
 * Carrega perfil do usuário
 */
async function loadUserProfile(): Promise<void> {
	try {
		const profile = await profileService.getProfile();
		userNickElement.textContent = profile.nick || 'Usuário';
	} catch (error) {
		logger.error('Erro ao carregar perfil:', error);
		userNickElement.textContent = 'Usuário';
	}
}

/**
 * Handle login
 */
async function handleLogin(event: Event): Promise<void> {
	event.preventDefault();
	hideError();

	const email = emailInput.value.trim();
	const password = passwordInput.value;

	if (!email || !password) {
		showError('Preencha todos os campos');
		return;
	}

	const submitBtn = loginForm.querySelector('button[type="submit"]') as HTMLButtonElement;
	submitBtn.disabled = true;
	submitBtn.textContent = 'Entrando...';

	try {
		await authService.login({ email, password });

		// Notificar background script
		chrome.runtime.sendMessage({ action: 'LOGIN_SUCCESS' });

		logger.info('Login realizado com sucesso');

		// Recarregar estado
		await loadAuthState();
	} catch (error: any) {
		logger.error('Erro no login:', error);
		showError(error.message || 'Erro ao fazer login. Verifique suas credenciais.');
	} finally {
		submitBtn.disabled = false;
		submitBtn.textContent = 'Entrar';
	}
}

/**
 * Handle logout
 */
async function handleLogout(): Promise<void> {
	try {
		await authService.logout();

		// Notificar background script
		chrome.runtime.sendMessage({ action: 'LOGOUT' });

		logger.info('Logout realizado');

		// Recarregar estado
		await loadAuthState();
	} catch (error) {
		logger.error('Erro no logout:', error);
		alert('Erro ao fazer logout. Tente novamente.');
	}
}

/**
 * Inicializa popup
 */
function init(): void {
	logger.info('Popup inicializado');

	// Event listeners
	loginForm.addEventListener('submit', handleLogin);
	logoutBtn.addEventListener('click', handleLogout);

	// Carregar estado inicial
	loadAuthState();
}

// Inicializar quando DOM carregar
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}

