import { URL } from 'url';
import https from 'https';
import http from 'http';

/**
 * Interface para resultado da resolução de URL
 */
export interface UrlResolutionResult {
    /** URL final após seguir todos os redirecionamentos */
    finalUrl: string | null;
    /** Indica se a URL final é de um domínio Amazon válido */
    isAmazonUrl: boolean;
    /** Indica se a operação foi bem-sucedida */
    success: boolean;
    /** Mensagem de erro, se houver */
    error?: string;
}

/**
 * Domínios Amazon válidos para verificação
 */
const AMAZON_DOMAINS = [
    'amazon.com',
    'amazon.com.br',
    'amazon.co.uk',
    'amazon.de',
    'amazon.fr',
    'amazon.it',
    'amazon.es',
    'amazon.ca',
    'amazon.com.au',
    'amazon.co.jp',
    'amazon.in'
];

/**
 * Faz uma requisição HEAD para verificar redirecionamentos
 * @param url URL para fazer a requisição
 * @returns Promise com a resposta
 */
function makeHeadRequest(url: string): Promise<{ status: number; location?: string }> {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;

        const req = client.request({
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: 'HEAD',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }, (res) => {
            resolve({
                status: res.statusCode || 0,
                location: res.headers.location
            });
        });

        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}
const AMAZON_SHORT_DOMAINS = [
    'amzn.to',
    'amzlink.to',
    'a.co'
];

/**
 * Resolve redirecionamentos de URLs encurtadas até a URL final
 * Suporta redirecionamentos HTTP 301/302 e valida se o domínio final é da Amazon
 * 
 * @param url - URL original a ser resolvida
 * @param maxRedirects - Número máximo de redirecionamentos a seguir (padrão: 10)
 * @returns Resultado da resolução com a URL final e informações de validação
 * 
 * @example
 * ```typescript
 * const result = await resolveShortUrl('https://amzn.to/43PBc2v');
 * if (result.success && result.isAmazonUrl) {
 *   console.log('URL final:', result.finalUrl);
 * }
 * ```
 */
export async function resolveShortUrl(
    url: string,
    maxRedirects: number = 10
): Promise<UrlResolutionResult> {
    try {
        // Valida se a URL é válida
        let currentUrl: URL;
        try {
            currentUrl = new URL(url);
        } catch {
            return {
                finalUrl: null,
                isAmazonUrl: false,
                success: false,
                error: 'URL inválida'
            };
        }

        // Se já é uma URL Amazon completa, retorna diretamente
        if (isAmazonDomain(currentUrl.hostname)) {
            return {
                finalUrl: currentUrl.toString(),
                isAmazonUrl: true,
                success: true
            };
        }

        // Verifica se é um domínio de link encurtado conhecido
        if (!isShortUrlDomain(currentUrl.hostname)) {
            return {
                finalUrl: currentUrl.toString(),
                isAmazonUrl: false,
                success: true,
                error: 'Não é um link encurtado da Amazon conhecido'
            };
        }

        // Segue redirecionamentos
        let redirectCount = 0;
        let finalUrl = currentUrl.toString();

        while (redirectCount < maxRedirects) {
            try {
                const response = await makeHeadRequest(finalUrl);

                // Se não há redirecionamento, para
                if (response.status < 300 || response.status >= 400) {
                    break;
                }

                // Obtém a nova URL do cabeçalho Location
                const location = response.location;
                if (!location) {
                    break;
                }

                // Resolve URL relativa se necessário
                finalUrl = new URL(location, finalUrl).toString();
                redirectCount++;

                // Verifica se chegamos em um domínio Amazon
                const urlObj = new URL(finalUrl);
                if (isAmazonDomain(urlObj.hostname)) {
                    return {
                        finalUrl,
                        isAmazonUrl: true,
                        success: true
                    };
                }
            } catch (error) {
                return {
                    finalUrl: null,
                    isAmazonUrl: false,
                    success: false,
                    error: `Erro ao seguir redirecionamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
                };
            }
        }

        // Verifica se atingiu o limite de redirecionamentos
        if (redirectCount >= maxRedirects) {
            return {
                finalUrl: null,
                isAmazonUrl: false,
                success: false,
                error: 'Muitos redirecionamentos'
            };
        }

        // Verifica se a URL final é da Amazon
        const finalUrlObj = new URL(finalUrl);
        const isAmazon = isAmazonDomain(finalUrlObj.hostname);

        return {
            finalUrl,
            isAmazonUrl: isAmazon,
            success: true,
            error: isAmazon ? undefined : 'URL final não é da Amazon'
        };

    } catch (error) {
        return {
            finalUrl: null,
            isAmazonUrl: false,
            success: false,
            error: `Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        };
    }
}

/**
 * Verifica se um hostname é de um domínio Amazon válido
 * 
 * @param hostname - Hostname a ser verificado
 * @returns true se é um domínio Amazon válido
 */
function isAmazonDomain(hostname: string): boolean {
    const lowerHostname = hostname.toLowerCase();
    return AMAZON_DOMAINS.some(domain =>
        lowerHostname === domain || lowerHostname.endsWith(`.${domain}`)
    );
}

/**
 * Verifica se um hostname é de um domínio de link encurtado da Amazon conhecido
 * 
 * @param hostname - Hostname a ser verificado
 * @returns true se é um domínio de link encurtado conhecido
 */
function isShortUrlDomain(hostname: string): boolean {
    const lowerHostname = hostname.toLowerCase();
    return AMAZON_SHORT_DOMAINS.some(domain =>
        lowerHostname === domain || lowerHostname.endsWith(`.${domain}`)
    );
}