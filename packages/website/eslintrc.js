module.exports = {
	root: true,
	env: { browser: true, es2020: true, jest: true },
	extends: [
		'eslint:recommended',
		'@typescript-eslint/recommended',
		'plugin:react-hooks/recommended',
	],
	ignorePatterns: ['dist', '.eslintrc.cjs'],
	parser: '@typescript-eslint/parser',
	plugins: ['react-refresh'],
	rules: {
		"indent": [
			"error",
			"tab"
		],
		'react-refresh/only-export-components': [
			'warn',
			{ allowConstantExport: true },
		],
		'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
		'@typescript-eslint/no-unused-imports': 'off',
		'prefer-const': 'error',
		'no-var': 'error',
	},
}