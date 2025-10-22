/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_URL: string
	readonly VITE_TELEGRAM_BOT_URL: string
	// mais variáveis de ambiente...
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}