# @gibipromo/shared

Pacote compartilhado do GibiPromo Platform contendo entidades, repositórios, utilitários e tipos compartilhados entre todos os pacotes (telegram-bot, web-api, website).

## 📦 Estrutura

```
src/
├── constants/          # Constantes e enums globais
├── entities/           # Entidades do domínio
├── repositories/       # Interfaces de repositórios
├── infrastructure/     # Implementações de infraestrutura
│   ├── config/        # Configurações (DynamoDB, etc)
│   └── dynamodb/      # Implementações DynamoDB
├── types/             # Tipos TypeScript compartilhados
└── utils/             # Utilitários e helpers
```

## 🎯 Entidades

### User
Representa um usuário no sistema (Telegram ou Website).

**Campos principais:**
- `id`: UUID
- `telegram_id`: ID do Telegram (opcional)
- `email`: Email para autenticação web (opcional)
- `username`: Nome de usuário
- `enabled`: Se o monitoramento está ativo
- `origin`: Origem do usuário (`TELEGRAM`, `SITE`, `BOTH`)

**Factories:**
- `UserFactory.createTelegramUser()` - Cria usuário do Telegram
- `UserFactory.createWebsiteUser()` - Cria usuário do site

### Product
Representa um produto da Amazon monitorado.

**Campos principais:**
- `id`: ASIN da Amazon
- `title`: Título do produto
- `price`: Preço atual
- `old_price`: Preço anterior
- `lowest_price`: Menor preço histórico
- `url`: URL na Amazon
- `in_stock`: Se está em estoque

### Action
Representa uma ação a ser processada pelo sistema.

**Tipos:**
- `ADD_PRODUCT`: Adicionar produto para monitorar
- `CHECK_PRODUCT`: Verificar preço do produto
- `NOTIFY_PRICE`: Notificar queda de preço

**Campos principais:**
- `id`: UUID
- `type`: Tipo da ação
- `value`: Valor (URL ou ID do produto)
- `origin`: Origem da ação (`TELEGRAM`, `SITE`)
- `is_processed`: 0 = pendente, 1 = processado

### Notification
Representa uma notificação para usuários do site.

**Tipos:**
- `PRODUCT_ADDED`: Produto adicionado com sucesso
- `PRICE_DROP`: Preço do produto caiu

**Campos principais:**
- `id`: UUID
- `user_id`: ID do usuário (FK -> Users)
- `type`: Tipo da notificação
- `title`: Título curto
- `message`: Mensagem completa
- `status`: `UNREAD` ou `READ`
- `metadata`: Dados adicionais (product_id, prices, url)
- `sent_via`: Canais de envio (`['SITE']` ou `['SITE', 'EMAIL']`)
- `created_at`: Data de criação
- `read_at`: Data de leitura

**Factories:**
```typescript
import { createProductAddedNotification, createPriceDropNotification } from '@gibipromo/shared';

// Produto adicionado
const notification = createProductAddedNotification(
  'user-123',
  'Batman: Ano Um',
  'B08X123456',
  'https://amazon.com.br/dp/B08X123456'
);

// Queda de preço
const notification = createPriceDropNotification(
  'user-123',
  'Batman: Ano Um',
  'B08X123456',
  'https://amazon.com.br/dp/B08X123456',
  89.90,
  59.90
);
```

## 📚 Repositórios

### NotificationRepository

Interface para gerenciar notificações no DynamoDB.

**Métodos principais:**

#### `findByUserId(userId, options?)`
Busca notificações de um usuário com **paginação cursor-based**.

```typescript
// Primeira página (20 notificações)
const page1 = await notificationRepo.findByUserId('user-123', { 
  limit: 20 
});

console.log(page1.items);      // Array de notificações
console.log(page1.hasMore);    // true se há mais páginas
console.log(page1.lastKey);    // Cursor para próxima página

// Segunda página
const page2 = await notificationRepo.findByUserId('user-123', { 
  limit: 20,
  lastKey: page1.lastKey 
});

// Filtrar por status
const unread = await notificationRepo.findByUserId('user-123', { 
  status: NotificationStatus.UNREAD 
});
```

**Por que paginação cursor-based?**
- ✅ Melhor performance em DynamoDB
- ✅ Consistente mesmo com novas inserções
- ✅ Não pula itens em listas dinâmicas
- ❌ Não permite ir para página específica (mas não é necessário)

#### `findUnreadByUserId(userId)`
Busca todas as notificações não lidas.

```typescript
const unread = await notificationRepo.findUnreadByUserId('user-123');
console.log(`${unread.length} notificações não lidas`);
```

#### `countUnreadByUserId(userId)`
Conta notificações não lidas (mais eficiente que buscar todas).

```typescript
const count = await notificationRepo.countUnreadByUserId('user-123');
console.log(`${count} notificações não lidas`);
```

#### `markAsRead(notificationId)`
Marca notificação como lida.

```typescript
await notificationRepo.markAsRead('notif-123');
```

#### `markAllAsRead(userId)`
Marca todas as notificações de um usuário como lidas.

```typescript
const updated = await notificationRepo.markAllAsRead('user-123');
console.log(`${updated} notificações marcadas como lidas`);
```

#### `deleteOldNotifications(daysOld)`
Deleta notificações mais antigas que X dias.

```typescript
// Deletar notificações com mais de 30 dias
const deleted = await notificationRepo.deleteOldNotifications(30);
console.log(`${deleted} notificações antigas deletadas`);
```

#### `enforceUserLimit(userId, maxNotifications)`
Garante que usuário não exceda limite de notificações.

```typescript
// Antes de criar nova notificação
await notificationRepo.enforceUserLimit('user-123', 100);
await notificationRepo.create(newNotification);
```

**Nota:** O método `create()` já chama `enforceUserLimit()` automaticamente com `MAX_NOTIFICATIONS_PER_USER = 100`.

### Índices DynamoDB

A tabela `Notifications` usa os seguintes índices para performance:

1. **UserIdCreatedIndex** (user_id + created_at)
   - Buscar notificações por usuário ordenadas por data
   - Usado em: `findByUserId()`, `enforceUserLimit()`

2. **UserIdStatusIndex** (user_id + status)
   - Filtrar notificações por status
   - Usado em: `findUnreadByUserId()`, `countUnreadByUserId()`, `markAllAsRead()`

## 🔧 Constantes

### Enums

```typescript
// Origem do usuário
enum UserOrigin {
  TELEGRAM = 'TELEGRAM',  // Usuário do bot Telegram
  SITE = 'SITE',          // Usuário do website
  BOTH = 'BOTH'           // Ambas as plataformas
}

// Origem da ação
enum ActionOrigin {
  TELEGRAM = 'TELEGRAM',  // Ação criada via bot
  SITE = 'SITE'           // Ação criada via site
}

// Tipo de notificação
enum NotificationType {
  PRODUCT_ADDED = 'PRODUCT_ADDED',  // Produto adicionado
  PRICE_DROP = 'PRICE_DROP'         // Preço caiu
}

// Status da notificação
enum NotificationStatus {
  UNREAD = 'UNREAD',  // Não lida
  READ = 'READ'       // Lida
}
```

### Configurações

```typescript
// Limite máximo de notificações por usuário
export const MAX_NOTIFICATIONS_PER_USER = 100;

// Tempo de retenção de notificações (dias)
export const NOTIFICATION_RETENTION_DAYS = 30;
```

## 🛠️ Uso

### Instalação

```bash
npm install @gibipromo/shared
```

### Importação

```typescript
// Entidades
import { User, Product, Action, Notification } from '@gibipromo/shared';

// Enums e constantes
import { 
  UserOrigin, 
  ActionOrigin, 
  NotificationType, 
  NotificationStatus,
  MAX_NOTIFICATIONS_PER_USER 
} from '@gibipromo/shared';

// Factories
import { 
  UserFactory,
  createProductAddedNotification,
  createPriceDropNotification 
} from '@gibipromo/shared';

// Repositórios
import { 
  UserRepository,
  NotificationRepository,
  DynamoDBUserRepository,
  DynamoDBNotificationRepository 
} from '@gibipromo/shared';

// Utilitários
import { createLogger, resolveShortUrl } from '@gibipromo/shared';
```

## 📝 Convenções

### Nomenclatura DynamoDB

- **Tabelas:** PascalCase (`Users`, `Products`, `Notifications`)
- **Campos:** snake_case (`user_id`, `created_at`, `is_processed`)
- **Índices:** PascalCase + "Index" (`UserIdCreatedIndex`)

### Booleanos

Sempre use números no DynamoDB:
- `0` = false
- `1` = true

**Exceção:** Campos opcionais como `enabled` podem ser `boolean` TypeScript.

### Timestamps

Sempre use ISO 8601 string:
```typescript
const now = new Date().toISOString(); // "2025-10-17T12:34:56.789Z"
```

### IDs

Use UUID v4 para chaves primárias:
```typescript
import { v4 as uuidv4 } from 'uuid';
const id = uuidv4();
```

## 🧪 Testes

```bash
npm run test
npm run test:coverage
```

## 🏗️ Build

```bash
npm run build
```

## 📄 Licença

ISC
