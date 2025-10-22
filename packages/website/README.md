# 🌐 GibiPromo Website

Website oficial do GibiPromo - uma plataforma moderna e responsiva para monitoramento de preços de quadrinhos e mangás.

## 🧰 Tecnologias

- **React 18** + **TypeScript**
- **Vite** (build tool rápido)
- **TailwindCSS** (estilização utilitária)
- **React Router** (roteamento SPA)
- **Lucide React** (ícones modernos)
- **Jest** + **Testing Library** (testes)

## 🎨 Design System

### Paleta de Cores
- **Roxo principal**: `#6C2BD9`
- **Amarelo destaque**: `#F5C542`
- **Grafite escuro**: `#1E1E2A`
- **Lilás claro**: `#C8B8FF`
- **Branco gelo**: `#F5F5F5`

### Tipografia
- **Display**: Rubik (títulos)
- **Texto**: Inter (corpo do texto)

## 🧱 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
├── contexts/           # Contextos React (Theme, etc.)
├── layout/             # Layout principal (Header, Footer)
├── pages/              # Páginas da aplicação
├── routes/             # Configuração de rotas
├── __tests__/          # Testes globais
└── index.css           # Estilos globais + TailwindCSS
```

## 🧭 Páginas

- **`/`** - Home (Hero + últimas promoções)
- **`/promocoes`** - Lista completa de promoções
- **`/perfil`** - Página do usuário
- **`/configuracoes`** - Preferências e configurações

## 🚀 Comandos

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview

# Executar testes
npm test

# Testes em modo watch
npm run test:watch

# Cobertura de testes
npm run test:coverage

# Lint do código
npm run lint

# Fix automático do lint
npm run lint:fix
```

## 🧪 Testes

- **Cobertura mínima**: 80%
- **Framework**: Jest + Testing Library
- **Mocks**: Lucide React, LocalStorage, MatchMedia
- **Comando**: `npm test -- --maxWorkers=1`

### Executar testes específicos
```bash
npm test -- ThemeContext
npm test -- Header
npm test -- Home
```

## 🎯 Features Implementadas

### ✅ Layout Base
- [x] Header responsivo com navegação
- [x] Footer com links e informações
- [x] Menu hambúrguer para mobile
- [x] Toggle de tema claro/escuro

### ✅ Páginas Principais
- [x] **Home**: Hero section + grid de promoções
- [x] **Promoções**: Lista filtrada e pesquisável
- [x] **Perfil**: Dados do usuário + estatísticas
- [x] **Configurações**: Preferências personalizáveis
- [x] **404**: Página de erro amigável

### ✅ Funcionalidades
- [x] Sistema de temas (dark/light)
- [x] Navegação com React Router
- [x] Layout totalmente responsivo
- [x] Filtros e busca nas promoções
- [x] Cards de produtos interativos
- [x] Animações suaves com CSS

### ✅ Qualidade
- [x] TypeScript com strict mode
- [x] Testes unitários e de integração
- [x] ESLint configurado
- [x] CSS classes utilitárias organizadas
- [x] Performance otimizada

## 🎨 Componentes Visuais

### Cards de Produto
- Hover com elevação e borda colorida
- Badge de desconto em destaque
- Avaliações com estrelas
- Preços com comparação
- Botões de ação integrados

### Navegação
- Header fixo com background roxo
- Links com hover amarelo
- Indicador de página ativa
- Menu mobile responsivo

### Formulários
- Inputs com foco roxo
- Switches customizados
- Selects estilizados
- Validação visual

## 🔌 Integração API

```typescript
// Estrutura preparada para consumir APIs
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})
```

## 📱 Responsividade

- **Mobile**: 320px+ (menu hambúrguer, grid 1 coluna)
- **Tablet**: 768px+ (grid 2 colunas, navegação expandida)
- **Desktop**: 1024px+ (grid 3-4 colunas, layout completo)

## 🎭 Animações

- **Fade in**: Elementos aparecem suavemente
- **Slide up**: Cards sobem ao carregar
- **Hover**: Transformações suaves
- **Loading**: Estados de carregamento
- **Float**: Animação flutuante no hero

## 🔧 Configuração do Ambiente

### Variáveis de Ambiente
```env
VITE_API_URL=http://localhost:3001
VITE_TELEGRAM_BOT_URL=https://t.me/gibipromo_bot
```

### PostCSS + TailwindCSS
Configuração otimizada para purge de CSS não usado e autoprefixer.

### Vite Configuration
- Hot reload rápido
- Path aliases (`@/` para `src/`)
- Porta 3002 (diferente do backend)

## 🧩 Próximos Passos

1. **Integração com API REST** (`/products`, `/users`)
2. **Autenticação com JWT**
3. **PWA (Progressive Web App)**
4. **Analytics e métricas**
5. **SEO e meta tags dinâmicas**
6. **Lazy loading de imagens**

---

## 📝 Notas de Desenvolvimento

- Sempre executar testes com `--maxWorkers=1`
- Manter cobertura acima de 80%
- Usar conventional commits
- Testar responsividade em múltiplos devices
- Validar acessibilidade (WCAG)

**Feito com 💜 pela equipe GibiPromo**