import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
			'@shared': resolve(__dirname, '../shared/src')
		}
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