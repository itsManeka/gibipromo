import { MockProductClassifier } from '../../../src/infrastructure/adapters/gemini/MockProductClassifier';

describe('MockProductClassifier', () => {
	let classifier: MockProductClassifier;

	beforeEach(() => {
		classifier = new MockProductClassifier();
	});

	describe('classify', () => {
		it('deve classificar mangá corretamente', async () => {
			const result = await classifier.classify('My Hero Academia Vol. 1');
			
			expect(result).not.toBeNull();
			expect(result?.category).toBe('Mangá');
			expect(result?.genre).toBe('Ação');
		});

		it('deve classificar HQ corretamente', async () => {
			const result = await classifier.classify('Batman: The Dark Knight Returns');
			
			expect(result).not.toBeNull();
			expect(result?.category).toBe('HQ');
			expect(result?.genre).toBe('Super-heróis');
		});

		it('deve classificar livro de fantasia corretamente', async () => {
			const result = await classifier.classify('Harry Potter e a Pedra Filosofal');
			
			expect(result).not.toBeNull();
			expect(result?.category).toBe('Livro');
			expect(result?.genre).toBe('Fantasia');
		});

		it('deve classificar livro genérico corretamente', async () => {
			const result = await classifier.classify('O Mundo de Sofia');
			
			expect(result).not.toBeNull();
			expect(result?.category).toBe('Livro');
			expect(result?.genre).toBeDefined();
		});

		it('deve retornar null para título vazio', async () => {
			const result = await classifier.classify('');
			
			expect(result).toBeNull();
		});

		it('deve classificar diferentes variações de mangá', async () => {
			const titles = [
				'Naruto Vol. 1',
				'One Piece - Vol. 50',
				'Attack on Titan',
				'Demon Slayer'
			];

			for (const title of titles) {
				const result = await classifier.classify(title);
				expect(result?.category).toBe('Mangá');
			}
		});

		it('deve classificar diferentes variações de HQ', async () => {
			const titles = [
				'Spider-Man: Into the Spider-Verse',
				'Marvel Comics Superman',
				'DC Comics Batman',
				'Graphic Novel - Watchmen'
			];

			for (const title of titles) {
				const result = await classifier.classify(title);
				expect(result?.category).toBe('HQ');
			}
		});

		it('deve identificar gênero aventura', async () => {
			const result = await classifier.classify('As Aventuras de Tom Sawyer');
			
			expect(result).not.toBeNull();
			expect(result?.genre).toBe('Aventura');
		});

		it('deve identificar gênero mistério', async () => {
			const result = await classifier.classify('O Mistério do Cinco Estrelas');
			
			expect(result).not.toBeNull();
			expect(result?.genre).toBe('Mistério');
		});
	});
});

