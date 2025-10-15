# Copilot Instructions — GibiPromo

## Objetivo do Projeto
Plataforma completa de monitoramento de preços da Amazon em **TypeScript**, composta por:
- **Bot Telegram** para notificações em tempo real
- **Web API** RESTful para integrações
- **Website** React para gerenciamento visual
- **Chrome Extension** para integração na Amazon

Utilizando **Clean Architecture**, **AWS Free Tier** (Lambda, DynamoDB, S3), e boas práticas de performance, custo e escalabilidade.

---

## Arquitetura do Projeto

### Estrutura de Monorepo
```
gibipromo-platform/
├── packages/
│   ├── shared/            # Entidades, tipos e utilitários compartilhados
│   ├── telegram-bot/      # Bot Telegram + Schedulers + Processadores
│   ├── web-api/           # API REST Express
│   ├── website/           # Dashboard React + Vite + Tailwind
│   └── chrome-extension/  # Extensão para Amazon
├── scripts/               # Scripts de infra (init-dynamo.js, etc)
├── docker/                # Containers para desenvolvimento local
└── .github/               # CI/CD e documentação
```

### Camadas por Pacote

#### **@gibipromo/shared**
```
src/
├── entities/          # User, Product, Action, ProductUser, Session, etc.
├── constants/         # Constantes globais (comandos, intervalos, URLs)
└── utils/            # Logger, helpers compartilhados
```

#### **@gibipromo/telegram-bot**
```
src/
├── application/
│   ├── ports/        # Interfaces (repositories, APIs)
│   ├── usecases/     # ActionScheduler, ProductStatsService
│   └── factories/    # Criação de dependências
├── domain/           # Lógica de negócio pura
└── infrastructure/
    ├── adapters/     # Telegram, Amazon PA-API, DynamoDB
    ├── config/       # Configurações (dynamodb.ts, telegram.ts)
    └── utils/        # urlResolver, helpers específicos
```

#### **@gibipromo/web-api**
```
src/
├── controllers/      # AuthController, ProductsController, etc.
├── services/         # Lógica de negócio da API
├── routes/          # Definição de rotas Express
├── middleware/      # auth.ts (JWT validation)
└── infrastructure/
    ├── config/      # dynamodb.ts
    └── factories/   # repositories.ts
```

#### **@gibipromo/website**
```
src/
├── pages/           # Home, Login, Profile, Promotions, Settings
├── components/      # Componentes React reutilizáveis
├── contexts/        # ThemeContext, AuthContext
├── layout/          # Header, Footer, AppLayout
└── routes/          # Configuração de rotas React Router
```

---

## Estilo de Código

### Geral
- **Linguagem:** TypeScript 5.9.2+
- **Arquitetura:** Clean Architecture + SOLID
- **Padrões:** Clean Code, DDD onde aplicável
- **Documentação:** JSDoc/TypeDoc para funções públicas
- **Testes:** Cobertura mínima de **80%**

### Convenções de Nomenclatura
- **Arquivos:** PascalCase para classes/componentes, camelCase para utilitários
- **Variáveis/Funções:** camelCase
- **Constantes:** UPPER_SNAKE_CASE
- **Interfaces:** PascalCase sem prefixo `I`
- **Types:** PascalCase

### TypeScript
- Sempre use tipos explícitos em parâmetros de função
- Evite `any`, prefira `unknown` quando necessário
- Use type guards para validações de tipo
- Exporte tipos e interfaces quando compartilhados

### React (Website)
- **Componentes funcionais** com TypeScript
- **Hooks personalizados** para lógica reutilizável
- **Context API** para estado global (Theme, Auth)
- **React Router** para navegação
- **Tailwind CSS** para estilização
- Props sempre tipadas com interface

### Express (Web API)
- **Controllers** herdam de `BaseController`
- **Services** herdam de `BaseService`
- Use `asyncHandler` para rotas assíncronas
- Middleware de autenticação JWT em rotas protegidas
- Validação de entrada sempre antes da lógica

---

## Banco de Dados (DynamoDB)

### Convenções
- **Nomenclatura:** `snake_case` para todos os campos
- **Booleanos:** `true`/`false` (nunca strings `"true"`/`"false"`)
- **Timestamps:** ISO 8601 string (`created_at`, `updated_at`)
- **IDs:** UUID v4 para chaves primárias

### Tabelas Principais
```typescript
Users
├── id (PK)                 // UUID
├── telegram_id             // String (GSI)
├── email                   // String (GSI)
├── username
├── name
├── enabled                 // Boolean
├── session_id
├── password_hash
└── created_at / updated_at

Products
├── id (PK)                 // ASIN
├── title
├── price
├── full_price
├── old_price
├── lowest_price
├── url
├── image
├── in_stock                // Boolean
├── preorder                // Boolean
├── offer_id
├── store
└── created_at / updated_at

ProductUser (relação N:N)
├── id (PK)                 // UUID
├── user_id (FK → Users)
├── product_id (FK → Products)
├── desired_price           // Number | undefined
└── created_at / updated_at

Actions
├── id (PK)                 // UUID
├── user_id (FK)
├── type                    // ActionType enum
├── value                   // String (URL, ASIN, etc)
├── is_processed            // Boolean (0 = pendente, 1 = processado)
├── metadata                // JSON
└── created_at

ActionConfigs
├── action_type (PK)
├── interval_minutes
└── enabled                 // Boolean
```

### Boas Práticas DynamoDB
- **Sempre use índices secundários** para buscas não-PK (ex: `TelegramIdIndex`, `EmailIndex`)
- **Batch operations** para operações em lote (GetItem, PutItem)
- **Filtragem de ações pendentes:** `is_processed = 0` antes de processar
- **Atualização após processamento:** `is_processed = 1` após sucesso
- Use `documentClient` para operações simplificadas

---

## Fluxos de Negócio

### Telegram Bot

#### Comandos
```typescript
/start    → Cria usuário (enabled: false) + /enable
/enable   → Users.enabled = true
/disable  → Users.enabled = false
/addlink  → Cria Action(ADD_PRODUCT, is_processed: 0)
/list     → Lista produtos do usuário (paginado, 5 por página)
/delete   → Remove usuário + produtos + ações
/help     → Exibe comandos disponíveis
```

#### Fluxo `/addlink`
1. Usuário envia `/addlink`
2. Bot define estado `awaitingLinks` no mapa `userStates`
3. Usuário envia link(s) da Amazon (suporta múltiplos links)
4. Bot:
   - Valida links (Amazon ou encurtados: `amzn.to`, `a.co`, `amzlink.to`)
   - Cria `Action(ADD_PRODUCT)` para cada link
   - Remove estado `awaitingLinks`
5. Scheduler processa ações pendentes:
   - Resolve URLs encurtadas
   - Consulta PA-API (ou mock em dev)
   - Cria/atualiza `Products`
   - Cria relação `ProductUser`
   - Marca `is_processed = 1`

#### Callbacks Inline
```typescript
product:{id}              → Exibe detalhes do produto
page:{number}             → Navega lista de produtos
stop_monitor:{id}:{uid}   → Remove ProductUser
update_price:{id}:{uid}:{price} → Atualiza desired_price
delete:yes|no             → Confirma exclusão de conta
```

### Web API

#### Endpoints
```typescript
GET  /api/v1/health           → Status da API
GET  /api/v1/health/detailed  → Health check completo
POST /api/v1/auth/register    → Criar conta (email/senha)
POST /api/v1/auth/login       → Login JWT
GET  /api/v1/products         → Listar produtos do usuário (protegido)
POST /api/v1/products         → Adicionar produto (protegido)
GET  /api/v1/profile          → Perfil do usuário (protegido)
PUT  /api/v1/profile          → Atualizar perfil (protegido)
GET  /api/v1/preferences      → Preferências (protegido)
PUT  /api/v1/preferences      → Atualizar preferências (protegido)
```

#### Autenticação
- **JWT** em header `Authorization: Bearer <token>`
- Middleware `auth.ts` valida token e injeta `req.userId`
- Tokens armazenados em `Sessions` (DynamoDB)

### Website (React)

#### Páginas
```typescript
/               → Home (landing page)
/login          → Login
/register       → Registro
/profile        → Perfil do usuário (protegido)
/promotions     → Lista de produtos monitorados (protegido)
/settings       → Configurações (protegido)
```

#### Contextos
- **ThemeContext:** Dark/Light mode (persiste em localStorage)
- **AuthContext:** Estado de autenticação, userId, token

---

## Processadores de Ações (Telegram Bot)

### AddProductActionProcessor
- **Entrada:** `Action(ADD_PRODUCT)` com URL da Amazon
- **Processo:**
  1. Valida usuário ativo (`enabled: true`)
  2. Resolve URL (se encurtada)
  3. Extrai ASIN da URL
  4. Consulta PA-API (batch de até 10 ASINs)
  5. Cria/atualiza `Products`
  6. Cria relação `ProductUser`
  7. Notifica usuário via Telegram
- **Batch:** Processa até 10 ações por execução

### CheckProductActionProcessor
- **Entrada:** Produtos em `Products` (round-robin)
- **Processo:**
  1. Busca produtos para verificar (limitado por batch)
  2. Consulta PA-API para preços atualizados
  3. Compara com `old_price`
  4. Se preço caiu → cria `Action(NOTIFY_PRICE)`
  5. Atualiza `Products` com novo preço
- **Agendamento:** Conforme `ActionConfigs.interval_minutes`

### NotifyPriceActionProcessor
- **Entrada:** `Action(NOTIFY_PRICE)`
- **Processo:**
  1. Busca produto e usuários monitorando
  2. Verifica `desired_price` (se definido)
  3. Envia notificação Telegram com:
     - Preço antigo vs novo
     - Percentual de redução
     - Botões: Ver produto, Parar monitoria, Atualizar preço
  4. Marca ação como processada

---

## Schedulers e Agendamento

### Configuração
- **Biblioteca:** `toad-scheduler`
- **Fonte de intervalos:** Tabela `ActionConfigs`
- **Campos:** `action_type`, `interval_minutes`, `enabled`

### Exemplo de Job
```typescript
new AsyncTask(
  `process-ADD_PRODUCT`,
  async () => {
    const count = await processor.processNext(10);
    logger.info(`Processadas ${count} ações ADD_PRODUCT`);
  },
  (error) => logger.error('Erro no processamento', error)
);
```

### Jobs Configurados
```typescript
ADD_PRODUCT     → 5 min  (adicionar produtos)
CHECK_PRODUCT   → 30 min (verificar preços)
NOTIFY_PRICE    → 1 min  (enviar notificações)
```

---

## Amazon PA-API

### Ambientes
- **Dev:** `USE_MOCK_PAAPI=true` → [`MockAmazonPAAPIClient`](packages/telegram-bot/src/infrastructure/adapters/amazon/MockAmazonPAAPIClient.ts)
- **Prod:** `USE_MOCK_PAAPI=false` → [`AmazonPAAPIClient`](packages/telegram-bot/src/infrastructure/adapters/amazon/AmazonPAAPIClient.ts)

### Mock (Desenvolvimento)
- Gera produtos consistentes por ASIN (hash-based)
- Simula preços, estoques, pré-vendas
- Suporta batch de múltiplos ASINs
- **Nunca chama API real** (zero custo)

### Cliente Real
- Usa `paapi5-nodejs-sdk`
- Requer credenciais: `AMAZON_ACCESS_KEY`, `AMAZON_SECRET_KEY`, `AMAZON_PARTNER_TAG`
- Suporta batch de até 10 itens por request
- Extrai: título, preços, imagens, estoque, gênero, autor, editora

### URL Resolver
- **Função:** [`resolveShortUrl`](packages/telegram-bot/src/infrastructure/utils/urlResolver.ts)
- **Suporta:** `amzn.to`, `a.co`, `amzlink.to`
- **Processo:** Segue até 10 redirecionamentos HTTP 301/302
- **Validação:** Verifica se URL final é domínio Amazon válido

---

## Testes

### Estrutura
```
tests/
├── unit/              # Testes isolados de funções/classes
├── integration/       # Testes com dependências reais (DynamoDB local)
└── e2e/              # Testes end-to-end (bot + scheduler + API)
```

### Padrão de Qualidade
- ✅ **Cobertura mínima:** 80% (lines, functions, branches)
- ✅ **Todos os testes devem passar:** 100% sucesso
- ✅ **Mocks para APIs externas:** PA-API, Telegram
- ✅ **DynamoDB local:** Via Docker para testes integrados
- ✅ **Factories de teste:** [`createTestUser`](packages/telegram-bot/tests/test-helpers/factories.ts), [`createProduct`](packages/telegram-bot/tests/test-helpers/factories.ts), etc.

### Comandos
```bash
npm run test                      # Executa todos os testes
npm run test:coverage             # Gera relatório de cobertura
npm run test -- --maxWorkers=1    # Evita travamento (obrigatório)
npm run test:watch                # Modo watch
```

### Exemplo de Teste (Telegram Bot)
```typescript
describe('TelegramBot - /addlink', () => {
  it('deve criar ação ADD_PRODUCT para link válido', async () => {
    // Arrange
    const mockUser = createTestUser({ enabled: true });
    mockUserRepo.findByTelegramId.mockResolvedValue(mockUser);

    // Act
    await handler(mockCtx);

    // Assert
    expect(mockActionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ActionType.ADD_PRODUCT,
        is_processed: 0
      })
    );
  });
});
```

### Regras para Novos Testes
1. Criar teste **antes** ou **junto** com funcionalidade
2. Cobrir casos de **sucesso** e **erro**
3. Usar **mocks** para dependências externas
4. Validar **chamadas de repositório** (com `toHaveBeenCalledWith`)
5. Testar **edge cases** (usuário desabilitado, produto não encontrado, etc.)

---

## Logging

### Logger Compartilhado
- **Localização:** [`@gibipromo/shared/utils/Logger`](packages/shared/src/utils/Logger.ts)
- **Uso:** `const logger = createLogger('ModuleName')`
- **Níveis:** `info`, `warn`, `error`, `debug`

### Exemplo
```typescript
import { createLogger } from '@gibipromo/shared';

const logger = createLogger('AddProductProcessor');

logger.info('Processando ação', { actionId: action.id, userId: action.user_id });
logger.error('Erro ao consultar PA-API', error);
```

### Boas Práticas
- ✅ **Use logger em vez de `console.log`**
- ✅ Logue **ações críticas** (criação de produto, erro de API, notificação enviada)
- ✅ Inclua **contexto** (userId, productId, actionType)
- ❌ Não logue **dados sensíveis** (tokens, senhas)

---

## Variáveis de Ambiente

### Estrutura
```
.env                    # Root (geral)
packages/telegram-bot/.env
packages/web-api/.env
packages/website/.env
```

### Variáveis Principais
```bash
# Geral
NODE_ENV=development|production
AWS_REGION=us-east-1

# DynamoDB
DYNAMODB_ENDPOINT=http://localhost:8000  # Local apenas
AWS_ACCESS_KEY_ID=local                  # Local apenas
AWS_SECRET_ACCESS_KEY=local              # Local apenas

# Telegram Bot
TELEGRAM_BOT_TOKEN=<token>
USE_MOCK_PAAPI=true|false

# Amazon PA-API
AMAZON_ACCESS_KEY=<key>
AMAZON_SECRET_KEY=<secret>
AMAZON_PARTNER_TAG=<tag>
AMAZON_PARTNER_TYPE=Associates

# Web API
PORT=3000
JWT_SECRET=<secret>
API_PREFIX=/api/v1

# Website
VITE_API_URL=http://localhost:3000/api/v1
```

### Regras
- ✅ Sempre use `dotenv` para carregar `.env`
- ✅ Nunca commite `.env` (use `.env.example`)
- ✅ Valide variáveis críticas no startup

---

## Comandos do Projeto

### Desenvolvimento
```bash
npm install                      # Instala dependências (root + workspaces)
npm run dev:bot                  # Inicia bot Telegram
npm run dev:api                  # Inicia Web API
npm run dev:web                  # Inicia Website
docker compose up -d             # Sobe DynamoDB local
node scripts/init-dynamo.js      # Cria tabelas locais
```

### Build
```bash
npm run build                    # Compila todos os pacotes
npm run build --workspace=@gibipromo/telegram-bot
npm run build --workspace=@gibipromo/web-api
npm run build --workspace=@gibipromo/website
```

### Testes
```bash
npm run test                     # Todos os testes
npm run test:coverage            # Com cobertura
npm run test -- --maxWorkers=1   # Evita travamento (obrigatório)
npm run test --workspace=@gibipromo/telegram-bot
```

### Lint e Type-Check
```bash
npm run lint                     # ESLint em todos os pacotes
npm run lint:fix                 # Auto-correção
npm run type-check               # TypeScript check
```

### Workspaces (npm 8+)
```bash
npm run <script> --workspace=@gibipromo/<package>
npm install <dep> --workspace=@gibipromo/<package>
```

---

## Boas Práticas de Código

### Geral
- ✅ **Desacoplamento:** Use interfaces (ports) para dependências
- ✅ **Injeção de Dependência:** Sempre via construtor
- ✅ **Funções puras:** Prefira funções sem efeitos colaterais
- ✅ **Single Responsibility:** Uma classe/função faz uma coisa
- ✅ **DRY:** Não repita código (use `@gibipromo/shared`)

### Clean Architecture
```
domain/          → Entidades puras, sem dependências externas
application/     → Casos de uso, interfaces (ports)
infrastructure/  → Implementações (adapters): DB, APIs, frameworks
```

### Exemplo de Port + Adapter
```typescript
// application/ports/ProductRepository.ts
export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  create(product: Product): Promise<void>;
}

// infrastructure/adapters/dynamodb/DynamoDBProductRepository.ts
export class DynamoDBProductRepository implements ProductRepository {
  async findById(id: string): Promise<Product | null> {
    // Implementação DynamoDB
  }
}
```

### Controllers (Web API)
```typescript
export class ProductsController extends BaseController {
  constructor(private productsService: ProductsService) {
    super();
  }

  getProducts = this.asyncHandler(async (req, res) => {
    const userId = req.userId; // Injetado por middleware auth
    const products = await this.productsService.getUserProducts(userId);
    this.sendSuccess(res, products);
  });
}
```

### Services (Web API)
```typescript
export class ProductsService extends BaseService {
  constructor(private productRepo: ProductRepository) {
    super('ProductsService');
  }

  async getUserProducts(userId: string): Promise<Product[]> {
    this.logAction('Buscando produtos do usuário', { userId });
    return this.productRepo.findByUserId(userId);
  }
}
```

---

## Fluxo de Desenvolvimento

### Adicionando Nova Funcionalidade
1. **Entender requisito:** Onde se encaixa (bot, API, website)?
2. **Criar entidade (se necessário):** Em `@gibipromo/shared/entities`
3. **Criar interface (port):** Em `application/ports`
4. **Implementar adapter:** Em `infrastructure/adapters`
5. **Criar caso de uso:** Em `application/usecases`
6. **Adicionar testes:**
   - Unit tests para lógica pura
   - Integration tests para adapters
7. **Documentar:** JSDoc + README se necessário
8. **Validar:**
   ```bash
   npm run lint
   npm run test -- --maxWorkers=1
   npm run build
   ```
9. **Testar manualmente:**
   ```bash
   npm run dev:bot  # ou dev:api, dev:web
   ```

### Corrigindo Bug
1. **Reproduzir:** Criar teste que falha
2. **Corrigir:** Implementar correção
3. **Validar:** Teste deve passar + cobertura mantida
4. **Commit:** Com mensagem descritiva

---

## CI/CD e Deploy

### Ambientes
- **Development:** Local com Docker
- **Staging:** AWS (opcional)
- **Production:** AWS Lambda + DynamoDB + S3

### Deploy (Futuro)
```bash
npm run deploy                   # Deploy todos os pacotes
npm run deploy:bot               # Só bot
npm run deploy:api               # Só API
```

### AWS Resources
```
Lambda Functions:
├── telegram-bot-handler         # Handler principal do bot
├── action-scheduler             # Scheduler de ações
└── web-api-handler              # API Express

DynamoDB Tables:
├── Users
├── Products
├── ProductUser
├── Actions
├── ActionConfigs
└── Sessions

S3 Buckets:
└── gibipromo-assets             # Imagens, arquivos estáticos
```

---

## Resolução de Problemas

### Bot não responde comandos
1. Verificar `TELEGRAM_BOT_TOKEN` no `.env`
2. Verificar se bot está rodando: `npm run dev:bot`
3. Verificar logs no console
4. Verificar se DynamoDB local está up: `docker ps`

### Testes travando
- **Solução:** Sempre use `--maxWorkers=1`
  ```bash
  npm run test -- --maxWorkers=1
  ```

### Erro "Credenciais da Amazon PA-API não configuradas"
- **Dev:** Use `USE_MOCK_PAAPI=true`
- **Prod:** Configure `AMAZON_ACCESS_KEY`, `AMAZON_SECRET_KEY`, `AMAZON_PARTNER_TAG`

### DynamoDB "ResourceNotFoundException"
- **Solução:** Recriar tabelas locais:
  ```bash
  node scripts/init-dynamo.js
  ```

---

## Regras Absolutas

1. ✅ **Sempre execute testes com `--maxWorkers=1`**
2. ✅ **Use logger em vez de `console.log`**
3. ✅ **Nunca commite `.env` com credenciais reais**
4. ✅ **Sempre valide entrada de usuário** (bot e API)
5. ✅ **Sempre marque ações como processadas** (`is_processed = 1`)
6. ✅ **Use TypeScript strict mode** (configurado em `tsconfig.json`)
7. ✅ **80%+ cobertura de testes** antes de PR
8. ✅ **Documentar funções públicas** com JSDoc
9. ✅ **Atualizar README.md** ao adicionar features
10. ✅ **Seguir Clean Architecture** (domain → application → infrastructure)

---

## Recursos e Links

### Documentação
- [README Principal](../../README.md)
- [Telegram Bot README](../../packages/telegram-bot/README.md)
- [Web API README](../../packages/web-api/README.md)
- [Website README](../../packages/website/README.md)

### Tecnologias
- [TypeScript](https://www.typescriptlang.org/)
- [Telegraf](https://telegraf.js.org/)
- [Express](https://expressjs.com/)
- [React](https://react.dev/)
- [DynamoDB](https://docs.aws.amazon.com/dynamodb/)
- [Amazon PA-API](https://webservices.amazon.com/paapi5/documentation/)

### Ferramentas
- [Jest](https://jestjs.io/) - Testes
- [ESLint](https://eslint.org/) - Linting
- [Vite](https://vitejs.dev/) - Build (Website)
- [Tailwind CSS](https://tailwindcss.com/) - Estilização

---

## Contribuindo

### Fluxo de PR
1. Fork do repositório
2. Branch para feature: `git checkout -b feature/nova-funcionalidade`
3. Commit com mensagem clara: `git commit -m 'Add: nova funcionalidade X'`
4. Push: `git push origin feature/nova-funcionalidade`
