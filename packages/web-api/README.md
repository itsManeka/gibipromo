# Web API - GibiPromo

REST API para o website e extensão Chrome do GibiPromo.

## � Índice

- [Início Rápido](#-início-rápido)
- [Infraestrutura DynamoDB](#-infraestrutura-dynamodb)
- [Testes](#-testes)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Arquitetura](#-arquitetura)
- [API Endpoints](#-api-endpoints)
  - [Authentication](#authentication)
    - [POST /auth/register](#post-apiv1authregister)
    - [POST /auth/login](#post-apiv1authlogin)
  - [User Profile (Protected)](#user-profile-protected)
    - [GET /users/profile](#get-apiv1usersprofile)
    - [PUT /users/profile](#put-apiv1usersprofile)
  - [User Preferences (Protected)](#user-preferences-protected)
    - [GET /users/preferences](#get-apiv1userspreferences)
    - [PUT /users/preferences](#put-apiv1userspreferences)
  - [Products (Protected)](#products-protected)
    - [GET /products](#get-apiv1products)
    - [POST /products](#post-apiv1products)
  - [Product Actions (Protected)](#product-actions-protected)
    - [POST /products/add](#post-apiv1productsadd)
    - [POST /products/add-multiple](#post-apiv1productsadd-multiple)
    - [POST /products/validate-url](#post-apiv1productsvalidate-url)
  - [Promotions (Public/Protected)](#promotions-publicprotected)
    - [GET /products/promotions](#get-apiv1productspromotions)
    - [GET /products/filter-options](#get-apiv1productsfilter-options)
  - [Health Check](#health-check)
    - [GET /health](#get-apiv1health)
    - [GET /health/detailed](#get-apiv1healthdetailed)
- [Debug](#-debug)
- [Recursos Adicionais](#-recursos-adicionais)
- [Contribuindo](#-contribuindo)

## �🚀 Início Rápido

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

## 📡 API Endpoints

### Resumo dos Endpoints

| Método | Endpoint | Autenticação | Descrição |
|--------|----------|--------------|-----------|
| **Authentication** |
| POST | `/api/v1/auth/register` | ❌ Público | Criar nova conta de usuário |
| POST | `/api/v1/auth/login` | ❌ Público | Autenticar e obter token JWT |
| **User Profile** |
| GET | `/api/v1/users/profile` | ✅ JWT | Obter perfil do usuário |
| PUT | `/api/v1/users/profile` | ✅ JWT | Atualizar perfil do usuário |
| **User Preferences** |
| GET | `/api/v1/users/preferences` | ✅ JWT | Obter preferências do usuário |
| PUT | `/api/v1/users/preferences` | ✅ JWT | Atualizar preferências |
| **Products** |
| GET | `/api/v1/products` | ✅ JWT | Listar produtos monitorados |
| POST | `/api/v1/products` | ✅ JWT | Adicionar produto (legado) |
| **Product Actions** |
| POST | `/api/v1/products/add` | ✅ JWT | Adicionar produto único via URL |
| POST | `/api/v1/products/add-multiple` | ✅ JWT | Adicionar múltiplos produtos (máx 10) |
| POST | `/api/v1/products/validate-url` | ❌ Público | Validar URL da Amazon |
| **Promotions** |
| GET | `/api/v1/products/promotions` | ⚠️ Opcional | Listar produtos em promoção com filtros |
| GET | `/api/v1/products/filter-options` | ❌ Público | Obter opções de filtro disponíveis |
| **Health Check** |
| GET | `/api/v1/health` | ❌ Público | Status básico da API |
| GET | `/api/v1/health/detailed` | ❌ Público | Status detalhado (inclui DynamoDB) |

---

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

### Product Actions (Protected)

#### POST `/api/v1/products/add`
Adicionar produto único para monitoramento via URL da Amazon.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "url": "https://www.amazon.com.br/dp/B09876543"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Produto adicionado com sucesso! Processaremos em breve.",
  "data": {
    "action_id": "action-uuid-v4"
  }
}
```

**Validações:**
- URL é obrigatória
- URL não pode estar vazia
- URL deve ser de um domínio Amazon válido (`amazon.com`, `amazon.com.br`, `amzn.to`, `a.co`, etc.)
- Usuário deve estar autenticado
- Usuário deve estar ativo (`enabled: true`)

**Erros:**

**400 Bad Request:**
```json
{
  "success": false,
  "error": "URL é obrigatória"
}
```

```json
{
  "success": false,
  "error": "URL não pode estar vazia"
}
```

```json
{
  "success": false,
  "error": "URL deve ser da Amazon (amazon.com, amazon.com.br, amzn.to, a.co, etc.)"
}
```

```json
{
  "success": false,
  "error": "Usuário não encontrado"
}
```

```json
{
  "success": false,
  "error": "Usuário não está ativo"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Authentication required"
}
```

#### POST `/api/v1/products/add-multiple`
Adicionar múltiplos produtos para monitoramento em lote (máximo 10 URLs por requisição).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "urls": [
    "https://www.amazon.com.br/dp/B09876543",
    "https://www.amazon.com/dp/B12345678",
    "https://amzn.to/abc123"
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "3 produtos adicionados com sucesso!",
  "data": {
    "success_count": 3,
    "failed_count": 0,
    "failed_urls": []
  }
}
```

**Response com Falhas Parciais (201):**
```json
{
  "success": true,
  "message": "2 de 3 produtos adicionados. 1 falhou.",
  "data": {
    "success_count": 2,
    "failed_count": 1,
    "failed_urls": [
      "https://invalid-url.com/product"
    ]
  }
}
```

**Validações:**
- `urls` deve ser um array
- Array não pode estar vazio
- Máximo de 10 URLs por requisição
- Cada URL deve ser de um domínio Amazon válido
- Usuário deve estar autenticado
- Usuário deve estar ativo (`enabled: true`)

**Erros:**

**400 Bad Request:**
```json
{
  "success": false,
  "error": "URLs deve ser um array"
}
```

```json
{
  "success": false,
  "error": "Lista de URLs não pode estar vazia"
}
```

```json
{
  "success": false,
  "error": "Máximo de 10 URLs por vez"
}
```

```json
{
  "success": false,
  "error": "Usuário não encontrado"
}
```

```json
{
  "success": false,
  "error": "Usuário não está ativo"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Authentication required"
}
```

**Notas:**
- Endpoint retorna **201** mesmo em caso de falhas parciais
- URLs inválidas são retornadas no array `failed_urls`
- Cada URL válida cria uma Action pendente para processamento assíncrono
- O processamento das Actions é feito pelo telegram-bot scheduler
- Suporta URLs encurtadas (`amzn.to`, `a.co`) que serão resolvidas

#### POST `/api/v1/products/validate-url`
Validar se uma URL é válida da Amazon (endpoint público, não requer autenticação).

**Request Body:**
```json
{
  "url": "https://www.amazon.com.br/dp/B09876543"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "URL validation result",
  "data": {
    "valid": true
  }
}
```

**Response para URL Inválida (200):**
```json
{
  "success": true,
  "message": "URL validation result",
  "data": {
    "valid": false
  }
}
```

**Validações:**
- URL é obrigatória
- URL não pode estar vazia

**Erros:**

**400 Bad Request:**
```json
{
  "success": false,
  "error": "URL é obrigatória"
}
```

```json
{
  "success": false,
  "error": "URL não pode estar vazia"
}
```

**Notas:**
- Endpoint **público** (não requer autenticação)
- Útil para validação no frontend antes de enviar
- Retorna sempre **200** com campo `valid: true/false`
- Valida domínios: `amazon.com`, `amazon.com.br`, `amazon.co.uk`, `amzn.to`, `a.co`, `amzlink.to`

**Exemplo de uso completo:**
```bash
# 1. Validar URL antes de adicionar
curl -X POST http://localhost:3001/api/v1/products/validate-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.amazon.com.br/dp/B09876543"}'

# 2. Adicionar produto único
curl -X POST http://localhost:3001/api/v1/products/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{"url": "https://www.amazon.com.br/dp/B09876543"}'

# 3. Adicionar múltiplos produtos
curl -X POST http://localhost:3001/api/v1/products/add-multiple \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "urls": [
      "https://www.amazon.com.br/dp/B09876543",
      "https://www.amazon.com/dp/B12345678",
      "https://amzn.to/abc123"
    ]
  }'
```

### Promotions (Public/Protected)

#### GET `/api/v1/products/promotions`
Listar produtos em promoção com filtros avançados. Suporta acesso público (todos os produtos) ou autenticado (com filtro "Meus Produtos").

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição | Exemplo |
|-----------|------|-------------|-----------|---------|
| `page` | number | Não | Número da página (padrão: 1) | `page=2` |
| `limit` | number | Não | Itens por página (1-100, padrão: 20) | `limit=50` |
| `sortBy` | string | Não | Ordenação: `discount`, `price-low`, `price-high`, `name`, `updated`, `created` (padrão: `discount`) | `sortBy=updated` |
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

## 📚 Recursos Adicionais

- [AWS SDK DynamoDB Documentation](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/dynamodb-examples.html)
- [DynamoDB Local Guide](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

## 🧪 Cobertura de Testes

A Web API possui testes unitários completos para todos os endpoints e serviços:

### Estrutura de Testes

```
tests/
├── controllers/          # Testes de controllers (HTTP)
│   ├── AuthController.test.ts
│   ├── ProductActionsController.test.ts
│   ├── ProductsController.test.ts
│   ├── UserProfileController.test.ts
│   └── UserPreferencesController.test.ts
├── services/            # Testes de serviços (lógica de negócio)
│   ├── AuthService.test.ts
│   ├── ProductActionsService.test.ts
│   ├── ProductsService.test.ts
│   ├── UserProfileService.test.ts
│   └── UserPreferencesService.test.ts
├── middleware/          # Testes de middleware
│   └── auth.test.ts
├── routes/             # Testes de rotas
│   └── health.test.ts
└── infrastructure/     # Testes de infraestrutura
    └── config/
        └── dynamodb.test.ts
```

### Padrões de Teste

- **Mock Repositories**: Implementações completas de interfaces para isolamento
- **Supertest**: Testes HTTP para controllers
- **Jest**: Framework de testes principal
- **Coverage**: Relatórios de cobertura com Istanbul

### Executar Testes

```bash
# Todos os testes
npm test -- --maxWorkers=1

# Testes específicos
npm test -- ProductActions --maxWorkers=1

# Com cobertura
npm run test:coverage

# Watch mode
npm run test:watch
```

## 🤝 Contribuindo

1. Siga as regras do `.github/copilot-instructions.md`
2. Sempre use `snake_case` para colunas do DynamoDB
3. Escreva testes (cobertura mínima 80%)
4. Execute `npm run lint:fix` antes de commit
5. Documente com JSDoc/TypeDoc

## 📄 Licença

[Ver LICENSE](../../LICENSE)
