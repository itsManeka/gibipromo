/** @type {import('jest').JestConfigWithTsJest} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/src', '<rootDir>/tests'],
	collectCoverageFrom: [
		'src/**/*.ts',
		'!src/**/*.d.ts',
		'!src/types/**/*.ts'
	],
	coverageThreshold: {
		global: {
			branches: 80,
			functions: 80,
			lines: 80,
			statements: 80
		}
	},
	maxWorkers: '50%',
	setupFiles: ['dotenv/config'],
	setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
		'^domain/(.*)$': '<rootDir>/src/domain/$1',
		'^infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
		'^application/(.*)$': '<rootDir>/src/application/$1'
	},
	transform: {
		'^.+\\.ts$': ['ts-jest', {
			tsconfig: 'tsconfig.json',
			diagnostics: {
				warnOnly: true
			}
		}]
	},
	moduleDirectories: ['node_modules', '<rootDir>/src'],
	detectOpenHandles: true,
	forceExit: true
};