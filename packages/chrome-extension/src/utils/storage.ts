/**
 * Storage wrapper para chrome.storage.sync
 * Fornece interface tipada e promises para armazenamento
 */

export interface StorageData {
	gibipromo_token?: string;
	gibipromo_user?: string;
}

/**
 * Busca valor do storage
 */
export async function get(key: keyof StorageData): Promise<string | null> {
	return new Promise((resolve) => {
		chrome.storage.sync.get([key], (result) => {
			resolve(result[key] || null);
		});
	});
}

/**
 * Salva valor no storage
 */
export async function set(key: keyof StorageData, value: string): Promise<void> {
	return new Promise((resolve, reject) => {
		chrome.storage.sync.set({ [key]: value }, () => {
			if (chrome.runtime.lastError) {
				reject(chrome.runtime.lastError);
			} else {
				resolve();
			}
		});
	});
}

/**
 * Remove valor do storage
 */
export async function remove(key: keyof StorageData): Promise<void> {
	return new Promise((resolve, reject) => {
		chrome.storage.sync.remove(key, () => {
			if (chrome.runtime.lastError) {
				reject(chrome.runtime.lastError);
			} else {
				resolve();
			}
		});
	});
}

/**
 * Limpa todo o storage
 */
export async function clear(): Promise<void> {
	return new Promise((resolve, reject) => {
		chrome.storage.sync.clear(() => {
			if (chrome.runtime.lastError) {
				reject(chrome.runtime.lastError);
			} else {
				resolve();
			}
		});
	});
}

/**
 * Busca múltiplas chaves de uma vez
 */
export async function getMultiple(keys: (keyof StorageData)[]): Promise<Partial<StorageData>> {
	return new Promise((resolve) => {
		chrome.storage.sync.get(keys, (result) => {
			resolve(result);
		});
	});
}

