/** @type {import('jest').Config} */
export default {
	preset: 'ts-jest',
	testEnvironment: 'jsdom',
	roots: ['<rootDir>/src'],
	setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
	testMatch: [
		'<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
		'<rootDir>/src/**/*.(test|spec).{js,jsx,ts,tsx}'
	],
	collectCoverageFrom: [
		'src/**/*.{js,jsx,ts,tsx}',
		'!src/**/*.d.ts',
		'!src/main.tsx',
		'!src/vite-env.d.ts'
	],
	coverageThreshold: {
		global: {
			branches: 80,
			functions: 80,
			lines: 80,
			statements: 80
		}
	},
	moduleNameMapping: {
		'^@/(.*)$': '<rootDir>/src/$1',
		'^@shared/(.*)$': '<rootDir>/../shared/src/$1',
		'\\.(css|less|scss|sass)$': 'identity-obj-proxy'
	},
	transform: {
		'^.+\\.tsx?$': ['ts-jest', {
			tsconfig: 'tsconfig.json'
		}]
	},
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
	transformIgnorePatterns: [
		'node_modules/(?!(lucide-react)/)'
	]
}