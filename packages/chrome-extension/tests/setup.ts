/**
 * Setup para testes
 * Mocks da API do Chrome
 */

// Mock chrome.storage
const mockStorage = {
	sync: {
		get: jest.fn((keys, callback) => {
			callback({});
		}),
		set: jest.fn((items, callback) => {
			if (callback) callback();
		}),
		remove: jest.fn((keys, callback) => {
			if (callback) callback();
		}),
		clear: jest.fn((callback) => {
			if (callback) callback();
		}),
	},
};

// Mock chrome.runtime
const mockRuntime = {
	lastError: undefined,
	sendMessage: jest.fn((message, callback) => {
		if (callback) callback({});
	}),
	onMessage: {
		addListener: jest.fn(),
		removeListener: jest.fn(),
	},
	onInstalled: {
		addListener: jest.fn(),
	},
};

// Mock chrome.tabs
const mockTabs = {
	query: jest.fn((queryInfo, callback) => {
		callback([]);
	}),
	sendMessage: jest.fn((tabId, message, callback) => {
		if (callback) callback({});
	}),
};

// Adicionar ao global
global.chrome = {
	storage: mockStorage,
	runtime: mockRuntime,
	tabs: mockTabs,
} as any;

// Mock fetch
global.fetch = jest.fn(() =>
	Promise.resolve({
		ok: true,
		status: 200,
		json: () => Promise.resolve({}),
	} as Response)
);

// Limpar mocks entre testes
afterEach(() => {
	jest.clearAllMocks();
});

