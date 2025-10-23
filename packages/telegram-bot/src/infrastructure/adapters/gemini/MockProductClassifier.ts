import { ProductClassifier, ProductClassification } from '../../../application/ports/ProductClassifier';
import { createLogger } from '@gibipromo/shared';

const logger = createLogger('MockProductClassifier');

/**
 * Implementação mock do ProductClassifier para desenvolvimento/testes
 * Usa palavras-chave no título para determinar o tipo e gênero
 */
export class MockProductClassifier implements ProductClassifier {
    /**
     * Classifica um produto baseado em palavras-chave no título
     */
    async classify(title: string): Promise<ProductClassification | null> {
        if (!title || title.trim().length === 0) {
            logger.warn('Título vazio fornecido para classificação mock');
            return null;
        }

        try {
            logger.info('Classificando produto (mock)', { title });

            const titleLower = title.toLowerCase();
            let category: 'HQ' | 'Mangá' | 'Livro' = 'Livro';
            let genre = 'Ficção';

            // Determina o tipo baseado em palavras-chave
            if (titleLower.includes('mangá') ||
                titleLower.includes('manga') ||
                titleLower.includes('my hero academia') ||
                titleLower.includes('naruto') ||
                titleLower.includes('one piece') ||
                titleLower.includes('attack on titan') ||
                titleLower.includes('demon slayer')) {
                category = 'Mangá';
                genre = 'Ação';
            } else if (titleLower.includes('hq') ||
                titleLower.includes('comic') ||
                titleLower.includes('batman') ||
                titleLower.includes('superman') ||
                titleLower.includes('spider') ||
                titleLower.includes('marvel') ||
                titleLower.includes('dc comics') ||
                titleLower.includes('graphic novel')) {
                category = 'HQ';
                genre = 'Super-heróis';
            } else {
                category = 'Livro';

                // Determina gênero para livros baseado em palavras-chave
                if (titleLower.includes('fantasia') ||
                    titleLower.includes('harry potter') ||
                    titleLower.includes('senhor dos anéis') ||
                    titleLower.includes('hobbit')) {
                    genre = 'Fantasia';
                } else if (titleLower.includes('ficção') || titleLower.includes('sci-fi')) {
                    genre = 'Ficção Científica';
                } else if (titleLower.includes('romance')) {
                    genre = 'Romance';
                } else if (titleLower.includes('terror') || titleLower.includes('horror')) {
                    genre = 'Terror';
                } else if (titleLower.includes('biografia') || titleLower.includes('autobiografia')) {
                    genre = 'Biografia';
                } else if (titleLower.includes('história') || titleLower.includes('histórico')) {
                    genre = 'História';
                }
            }

            // Ajusta gênero baseado em palavras-chave comuns
            if (titleLower.includes('aventura')) {
                genre = 'Aventura';
            } else if (titleLower.includes('mistério') || titleLower.includes('detetive')) {
                genre = 'Mistério';
            } else if (titleLower.includes('drama')) {
                genre = 'Drama';
            }

            const classification: ProductClassification = { category: category, genre: genre };

            logger.info('Produto classificado com sucesso (mock)', {
                title,
                category: classification.category,
                genre: classification.genre
            });

            return classification;
        } catch (error) {
            logger.error('Erro ao classificar produto (mock)', { title, error });
            return null;
        }
    }
}

