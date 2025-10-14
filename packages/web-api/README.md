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

## 📚 Recursos Adicionais

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
