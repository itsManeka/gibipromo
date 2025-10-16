# Web API - GibiPromo

REST API para o website e extensão Chrome do GibiPromo.

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+
- Docker (para DynamoDB Local)
- npm ou yarn

### Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Iniciar DynamoDB Local (Docker)
docker-compose up -d

# Inicializar tabelas do DynamoDB
npm run init:dynamo

# Iniciar em modo desenvolvimento
npm run dev
```

## 📦 Infraestrutura DynamoDB

A Web API reutiliza a infraestrutura de banco de dados já implementada no telegram-bot.

### Configuração

A configuração do DynamoDB está em `src/infrastructure/config/dynamodb.ts`:

```typescript
import { dynamodb, documentClient } from './infrastructure/config/dynamodb';
```

- **dynamodb**: Cliente low-level AWS SDK
- **documentClient**: Cliente high-level (recomendado para CRUD)

### Ambientes

#### Development (Local)
- Usa DynamoDB Local via Docker
- Endpoint: `http://localhost:8000`
- Credenciais: `local`/`local`

#### Production
- Usa AWS DynamoDB
- Configurado via variáveis de ambiente AWS

### Usando os Repositórios

#### Opção 1: DynamoDBHelper (Recomendado)

Para operações simples, use o helper:

```typescript
import { DynamoDBHelper, TableNames } from './infrastructure/factories/repositories';
import { User } from '@gibipromo/shared';

// Buscar todos os usuários
const users = await DynamoDBHelper.scanTable<User>(TableNames.USERS);

// Buscar por ID
const user = await DynamoDBHelper.getById<User>(TableNames.USERS, 'user-123');

// Criar/Atualizar
const newUser = { id: 'user-456', telegram_id: '123456789', enabled: true };
await DynamoDBHelper.put(TableNames.USERS, newUser);

// Deletar
await DynamoDBHelper.delete(TableNames.USERS, 'user-456');
```

#### Opção 2: DocumentClient Direto

Para queries complexas:

```typescript
import { db } from './infrastructure/factories/repositories';

// Query com índice
const result = await db.query({
  TableName: 'Products',
  IndexName: 'telegram_id-index',
  KeyConditionExpression: 'telegram_id = :tid',
  ExpressionAttributeValues: {
    ':tid': '123456789'
  }
}).promise();

// Scan com filtro
const activeProducts = await db.scan({
  TableName: 'Products',
  FilterExpression: 'enabled = :enabled',
  ExpressionAttributeValues: {
    ':enabled': true
  }
}).promise();
```

### Tabelas Disponíveis

As seguintes tabelas estão disponíveis via `TableNames`:

- `TableNames.USERS` - Usuários do sistema
- `TableNames.PRODUCTS` - Produtos monitorados
- `TableNames.PRODUCT_USERS` - Relacionamento produto-usuário
- `TableNames.ACTIONS` - Ações pendentes
- `TableNames.ACTION_CONFIGS` - Configurações de agendamento
- `TableNames.PRODUCT_STATS` - Estatísticas de produtos

### Exemplos Completos

Veja `src/infrastructure/examples/dynamodb-usage.ts` para exemplos completos de:
- Operações CRUD
- Queries com índices
- Operações em lote (batch)
- Updates parciais
- Filtros complexos

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Executar testes com cobertura
npm run test:coverage

# Executar testes em modo watch
npm run test:watch

# Testes de conectividade DynamoDB
npm test -- tests/infrastructure/config/dynamodb.test.ts --maxWorkers=1
```

### Estrutura de Testes

- **Unit tests**: Lógica de negócio isolada
- **Integration tests**: Testes com DynamoDB Local
- **Coverage mínima**: 80%

### Executando com DynamoDB

Para testes de integração que usam DynamoDB:

1. Certifique-se que Docker está rodando
2. Inicie o DynamoDB Local: `docker-compose up -d`
3. Execute: `npm test -- --maxWorkers=1`

## 📝 Variáveis de Ambiente

Configure as seguintes variáveis no arquivo `.env`:

```bash
# Ambiente
NODE_ENV=development

# Servidor
PORT=3001
API_PREFIX=/api/v1

# AWS DynamoDB
AWS_REGION=us-east-1
DYNAMODB_ENDPOINT=http://localhost:8000  # Apenas em development

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Logging
LOG_LEVEL=info
```

## 🏗️ Arquitetura

```
src/
├── controllers/        # Controllers REST
├── routes/            # Definição de rotas
├── services/          # Lógica de negócio
├── infrastructure/    # Infraestrutura compartilhada
│   ├── config/       # Configurações (DynamoDB, etc)
│   ├── factories/    # Factories de repositórios
│   └── examples/     # Exemplos de uso
└── types/            # Definições de tipos
```

## 🔗 Integração com Outros Pacotes

### @gibipromo/shared
- Entidades (User, Product, Action, etc)
- Tipos compartilhados
- Utilitários (Logger)

### telegram-bot
- Compartilha a mesma base de dados DynamoDB
- Implementações de repositórios disponíveis via `@gibipromo/shared` (futuro)

## 🐛 Debug

### DynamoDB Local não conecta

```bash
# Verificar se Docker está rodando
docker ps

# Reiniciar containers
docker-compose restart

# Ver logs
docker-compose logs dynamodb
```

### Tabelas não existem

```bash
# Inicializar tabelas
npm run init:dynamo
```

### Testes falhando

```bash
# Executar com flag maxWorkers=1
npm test -- --maxWorkers=1

# Ver logs detalhados
NODE_ENV=development npm test
```

## � API Endpoints

### Authentication

#### POST `/api/v1/auth/register`
Criar nova conta de usuário.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "uuid-v4",
    "token": "jwt-token"
  }
}
```

#### POST `/api/v1/auth/login`
Autenticar usuário e obter token JWT.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt-token",
    "userId": "uuid-v4"
  }
}
```

### User Profile (Protected)

#### GET `/api/v1/users/profile`
Obter perfil do usuário autenticado.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "profile-uuid",
    "user_id": "user-uuid",
    "nick": "MyNickname",
    "created_at": "2025-10-15T19:59:30.842Z",
    "updated_at": "2025-10-15T19:59:30.842Z"
  }
}
```

#### PUT `/api/v1/users/profile`
Atualizar perfil do usuário autenticado.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "nick": "NewNickname"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "profile-uuid",
    "user_id": "user-uuid",
    "nick": "NewNickname",
    "created_at": "2025-10-15T19:59:30.842Z",
    "updated_at": "2025-10-15T20:15:45.123Z"
  }
}
```

### User Preferences (Protected)

#### GET `/api/v1/users/preferences`
Obter preferências do usuário autenticado.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Preferences retrieved successfully",
  "data": {
    "id": "preferences-uuid",
    "user_id": "user-uuid",
    "monitor_preorders": true,
    "monitor_coupons": true,
    "created_at": "2025-10-15T19:59:30.842Z",
    "updated_at": "2025-10-15T19:59:30.842Z"
  }
}
```

#### PUT `/api/v1/users/preferences`
Atualizar preferências do usuário autenticado.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "monitor_preorders": false,
  "monitor_coupons": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Preferences updated successfully",
  "data": {
    "id": "preferences-uuid",
    "user_id": "user-uuid",
    "monitor_preorders": false,
    "monitor_coupons": true,
    "created_at": "2025-10-15T19:59:30.842Z",
    "updated_at": "2025-10-15T20:15:45.123Z"
  }
}
```

### Products (Protected)

#### GET `/api/v1/products`
Listar produtos monitorados pelo usuário autenticado.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "id": "ASIN123",
      "title": "Product Title",
      "price": 29.99,
      "old_price": 39.99,
      "url": "https://amazon.com/...",
      "image": "https://...",
      "in_stock": true,
      "preorder": false,
      "created_at": "2025-10-15T19:59:30.842Z",
      "updated_at": "2025-10-15T19:59:30.842Z"
    }
  ]
}
```

#### POST `/api/v1/products`
Adicionar novo produto para monitoramento.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "url": "https://amazon.com/dp/ASIN123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Product added successfully",
  "data": {
    "productId": "ASIN123",
    "userId": "user-uuid"
  }
}
```

### Promotions (Public/Protected)

#### GET `/api/v1/products/promotions`
Listar produtos em promoção com filtros avançados. Suporta acesso público (todos os produtos) ou autenticado (com filtro "Meus Produtos").

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição | Exemplo |
|-----------|------|-------------|-----------|---------|
| `page` | number | Não | Número da página (padrão: 1) | `page=2` |
| `limit` | number | Não | Itens por página (1-100, padrão: 20) | `limit=50` |
| `sortBy` | string | Não | Ordenação: `discount`, `price_asc`, `price_desc`, `newest`, `oldest` (padrão: `discount`) | `sortBy=price_asc` |
| `q` | string | Não | Busca por título ou contributors | `q=spider-man` |
| `category` | string | Não | Filtrar por categoria | `category=HQs` |
| `publisher` | string | Não | Filtrar por editora | `publisher=Panini` |
| `genre` | string | Não | Filtrar por gênero | `genre=Superheroes` |
| `format` | string | Não | Filtrar por formato | `format=Capa%20Dura` |
| `contributors` | string | Não | Filtrar por autores/ilustradores (separados por `\|`) | `contributors=Stan%20Lee\|Jack%20Kirby` |
| `preorder` | boolean | Não | Filtrar pré-vendas (padrão: false) | `preorder=true` |
| `inStock` | boolean | Não | Apenas em estoque (padrão: true) | `inStock=false` |
| `onlyMyProducts` | boolean | Não | Apenas produtos do usuário autenticado (padrão: false) | `onlyMyProducts=true` |

**Headers (Opcionais):**
```
Authorization: Bearer <jwt-token>  # Apenas para onlyMyProducts=true
```

**Exemplo de Request:**
```bash
# Buscar HQs do Stan Lee com mais de 30% de desconto
GET /api/v1/products/promotions?category=HQs&contributors=Stan%20Lee&sortBy=discount&limit=10

# Buscar apenas produtos em estoque do usuário autenticado
GET /api/v1/products/promotions?onlyMyProducts=true&inStock=true
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Promotions retrieved successfully",
  "data": {
    "products": [
      {
        "id": "B09876543",
        "title": "Homem-Aranha: Coleção Definitiva Vol. 1",
        "price": 49.90,
        "full_price": 99.90,
        "old_price": 89.90,
        "lowest_price": 45.00,
        "discount_percentage": 50.05,
        "url": "https://amazon.com.br/dp/B09876543",
        "image": "https://m.media-amazon.com/images/I/81xyz.jpg",
        "in_stock": true,
        "preorder": false,
        "offer_id": "AMAZON",
        "store": "Amazon",
        "category": "HQs",
        "publisher": "Panini",
        "genre": "Superheroes",
        "format": "Capa Dura",
        "contributors": ["Stan Lee", "Steve Ditko"],
        "created_at": "2025-10-10T10:00:00.000Z",
        "updated_at": "2025-10-16T14:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 143,
      "totalPages": 8
    },
    "appliedFilters": {
      "category": "HQs",
      "contributors": ["Stan Lee"],
      "sortBy": "discount"
    }
  }
}
```

**Notas:**
- Cache de 3 minutos para consultas públicas
- Produtos com `price >= full_price` são excluídos automaticamente
- Filtro `contributors` usa delimitador `|` para suportar nomes com vírgula (ex: "Lee, Stan")
- Ordenação `discount` mostra maior desconto percentual primeiro
- `onlyMyProducts=true` requer autenticação JWT

#### GET `/api/v1/products/filter-options`
Obter valores únicos disponíveis para filtros (categorias, editoras, gêneros, formatos, contributors).

**Response (200):**
```json
{
  "success": true,
  "message": "Filter options retrieved successfully",
  "data": {
    "categories": ["HQs", "Mangás", "Graphic Novels"],
    "publishers": ["Panini", "DC Comics", "Marvel", "JBC", "NewPOP"],
    "genres": ["Superheroes", "Ação", "Fantasia", "Terror", "Drama"],
    "formats": ["Capa Dura", "Brochura"],
    "contributors": [
      "Stan Lee",
      "Jack Kirby",
      "Alan Moore",
      "Frank Miller",
      "Akira Toriyama"
    ]
  }
}
```

**Notas:**
- Cache de 5 minutos
- Retorna apenas valores de produtos cadastrados no sistema
- Contributors ordenados alfabeticamente
- Acesso público (sem autenticação necessária)

**Exemplo curl:**
```bash
# Obter opções de filtro
curl -X GET http://localhost:3000/api/v1/products/filter-options

# Buscar promoções com múltiplos filtros
curl -X GET "http://localhost:3000/api/v1/products/promotions?category=HQs&publisher=Panini&contributors=Millar%2C%20Mark|Buckingham%2C%20Mark&inStock=true&sortBy=discount&page=1&limit=20"

# Buscar produtos do usuário autenticado
curl -X GET "http://localhost:3000/api/v1/products/promotions?onlyMyProducts=true" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Health Check

#### GET `/api/v1/health`
Verificar status básico da API.

**Response (200):**
```json
{
  "success": true,
  "message": "API is healthy",
  "data": {
    "status": "ok",
    "timestamp": "2025-10-15T20:00:00.000Z"
  }
}
```

#### GET `/api/v1/health/detailed`
Verificar status detalhado incluindo DynamoDB.

**Response (200):**
```json
{
  "success": true,
  "message": "Detailed health check",
  "data": {
    "status": "ok",
    "timestamp": "2025-10-15T20:00:00.000Z",
    "database": {
      "dynamodb": "connected"
    }
  }
}
```

### Error Responses

Todas as rotas podem retornar os seguintes erros:

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Validation error message"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Authentication required"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## �📚 Recursos Adicionais

- [AWS SDK DynamoDB Documentation](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/dynamodb-examples.html)
- [DynamoDB Local Guide](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

## 🤝 Contribuindo

1. Siga as regras do `.github/copilot-instructions.md`
2. Sempre use `snake_case` para colunas do DynamoDB
3. Escreva testes (cobertura mínima 80%)
4. Execute `npm run lint:fix` antes de commit
5. Documente com JSDoc/TypeDoc

## 📄 Licença

[Ver LICENSE](../../LICENSE)
