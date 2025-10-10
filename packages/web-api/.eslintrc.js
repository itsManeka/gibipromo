module.exports = {
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	extends: [
		'eslint:recommended'
	],
	root: true,
	env: {
		node: true,
		jest: true,
	},
	ignorePatterns: ['.eslintrc.js', 'dist/', 'coverage/', 'node_modules/'],
	rules: {
		'prefer-const': 'error',
		'no-var': 'error',
		'no-unused-vars': 'off',
		'@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
	},
};