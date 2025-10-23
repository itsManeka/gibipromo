const path = require('path');
const fs = require('fs');
const webpack = require('webpack');

module.exports = (env, argv) => {
	const isProduction = argv.mode === 'production';

	return {
		mode: isProduction ? 'production' : 'development',
		devtool: isProduction ? false : 'inline-source-map',
		entry: {
			'background/service-worker': './src/background/service-worker.ts',
			'content/index': './src/content/index.ts',
			'popup/popup': './src/popup/popup.ts',
		},
		output: {
			path: path.resolve(__dirname, 'dist'),
			filename: '[name].js',
			clean: true,
		},
		resolve: {
			extensions: ['.ts', '.js'],
			alias: {
				'@gibipromo/shared': path.resolve(__dirname, '../shared/src/browser'),
				'@': path.resolve(__dirname, 'src'),
			},
		},
		module: {
			rules: [
				{
					test: /\.ts$/,
					use: 'ts-loader',
					exclude: /node_modules/,
				},
			],
		},
		plugins: [
			new webpack.DefinePlugin({
				'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
				'process.env.API_URL': JSON.stringify(process.env.API_URL || 'http://localhost:3001/api/v1'),
			}),
			{
				apply: (compiler) => {
					compiler.hooks.afterEmit.tap('CopyFilesPlugin', () => {
						const distPath = path.resolve(__dirname, 'dist');

						// Copy manifest.json
						fs.copyFileSync(
							path.resolve(__dirname, 'src/manifest.json'),
							path.join(distPath, 'manifest.json')
						);

						// Copy popup.html
						if (!fs.existsSync(path.join(distPath, 'popup'))) {
							fs.mkdirSync(path.join(distPath, 'popup'), { recursive: true });
						}
						fs.copyFileSync(
							path.resolve(__dirname, 'src/popup/popup.html'),
							path.join(distPath, 'popup/popup.html')
						);

						// Copy styles
						if (!fs.existsSync(path.join(distPath, 'styles'))) {
							fs.mkdirSync(path.join(distPath, 'styles'), { recursive: true });
						}
						const stylesDir = path.resolve(__dirname, 'src/styles');
						if (fs.existsSync(stylesDir)) {
							const files = fs.readdirSync(stylesDir);
							files.forEach(file => {
								fs.copyFileSync(
									path.join(stylesDir, file),
									path.join(distPath, 'styles', file)
								);
							});
						}

						// Copy icons (if exist)
						const iconsDir = path.resolve(__dirname, 'public/icons');
						if (fs.existsSync(iconsDir)) {
							if (!fs.existsSync(path.join(distPath, 'icons'))) {
								fs.mkdirSync(path.join(distPath, 'icons'), { recursive: true });
							}
							const files = fs.readdirSync(iconsDir);
							files.forEach(file => {
								const filePath = path.join(iconsDir, file);
								if (fs.statSync(filePath).isFile()) {
									fs.copyFileSync(
										filePath,
										path.join(distPath, 'icons', file)
									);
								}
							});
						}
					});
				}
			}
		],
		optimization: {
			minimize: false, // Desabilitar minificação para evitar problema com ajv/terser
		},
	};
};

