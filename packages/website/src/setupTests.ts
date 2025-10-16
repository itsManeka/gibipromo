import '@testing-library/jest-dom'

// Mock do módulo client.ts para evitar problemas com import.meta.env
jest.mock('./api/client');

// Mock do import.meta.env (Vite environment variables)
// @ts-ignore - import.meta não existe no Node.js/Jest
global.import = {
	meta: {
		env: {
			VITE_API_URL: 'http://localhost:3000/api/v1',
			VITE_TELEGRAM_BOT_URL: 'https://t.me/test_bot',
			MODE: 'test',
			DEV: false,
			PROD: false,
		}
	}
}

// Mock do matchMedia para os testes
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: jest.fn().mockImplementation(query => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: jest.fn(), // deprecated
		removeListener: jest.fn(), // deprecated
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		dispatchEvent: jest.fn(),
	})),
})

// Mock do localStorage
const localStorageMock = {
	getItem: jest.fn(),
	setItem: jest.fn(),
	removeItem: jest.fn(),
	clear: jest.fn(),
	length: 0,
	key: jest.fn(),
}
Object.defineProperty(global, 'localStorage', {
	value: localStorageMock
})

// Mock do scrollTo
global.scrollTo = jest.fn()

// Suprimir warnings de console durante os testes
const originalConsoleError = console.error
beforeAll(() => {
	console.error = (...args: any[]) => {
		if (
			typeof args[0] === 'string' &&
			args[0].includes('Warning: ReactDOM.render is no longer supported')
		) {
			return
		}
		return originalConsoleError.call(console, ...args)
	}
})

afterAll(() => {
	console.error = originalConsoleError
})