import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
			'@shared': resolve(__dirname, '../shared/src'),
			// Usa browser.ts para imports de @gibipromo/shared (apenas código browser-safe)
			'@gibipromo/shared': resolve(__dirname, '../shared/src/browser.ts')
		},
		// Força resolução de arquivos .ts antes de .js para evitar CommonJS
		extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
	},
	server: {
		port: 3002,
		host: true
	},
	build: {
		outDir: 'dist',
		sourcemap: true
	}
})