/**
 * Script para empacotar extensão para Chrome Web Store
 */

const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'dist');
const OUTPUT_FILE = path.join(__dirname, '..', 'extension.zip');

/**
 * Cria arquivo ZIP da extensão
 */
async function packageExtension() {
	console.log('📦 Empacotando extensão...');

	// Verificar se dist existe
	if (!fs.existsSync(OUTPUT_DIR)) {
		console.error('❌ Pasta dist/ não encontrada. Execute npm run build primeiro.');
		process.exit(1);
	}

	// Remover ZIP antigo se existir
	if (fs.existsSync(OUTPUT_FILE)) {
		fs.unlinkSync(OUTPUT_FILE);
	}

	// Criar arquivo ZIP
	const output = fs.createWriteStream(OUTPUT_FILE);
	const archive = archiver('zip', { zlib: { level: 9 } });

	return new Promise((resolve, reject) => {
		output.on('close', () => {
			const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
			console.log(`✅ Extensão empacotada: extension.zip (${sizeMB} MB)`);
			resolve();
		});

		archive.on('error', (err) => {
			console.error('❌ Erro ao empacotar:', err);
			reject(err);
		});

		archive.pipe(output);
		archive.directory(OUTPUT_DIR, false);
		archive.finalize();
	});
}

packageExtension().catch((error) => {
	console.error(error);
	process.exit(1);
});

