# GibiPromo 📚

Monitor de preços da Amazon em TypeScript usando arquitetura limpa e AWS. Bot do Telegram que notifica quando os preços baixam!

## Funcionalidades 🚀

- **Monitoramento de Preços**: Acompanha as variações de preço na Amazon
- **Notificações Automáticas**: Avisa quando o preço baixa
- **Suporte Multi-usuário**: Cada usuário pode monitorar seus próprios produtos
- **Botão Direto**: Link rápido para a Amazon nas notificações

## Tecnologias 🛠

- **TypeScript**: Linguagem principal
- **Clean Architecture**: Organização do código
- **AWS (Free Tier)**:
  - Lambda: Execução serverless
  - DynamoDB: Banco de dados
  - S3: Armazenamento de arquivos
- **Telegram Bot API**: Interface com usuários
- **Jest**: Testes automatizados
- **ESLint**: Qualidade do código

## Configuração 🔧

1. **Pré-requisitos**:
   - Node.js 18+
   - Docker (para DynamoDB local)
   - NPM ou Yarn

2. **Instalação**:
   ```bash
   # Instalar dependências
   npm install

   # Configurar ambiente
   cp .env.example .env
   # Edite .env com suas credenciais

   # Iniciar DynamoDB local
   docker compose up -d

   # Criar tabelas
   node scripts/init-dynamo.js
   ```

3. **Configuração do Ambiente**:
   - `NODE_ENV`: Define o ambiente (`development`/`production`)
   - `USE_MOCK_PAAPI`: Controla uso do mock da PA-API
     - `true`: Usa mock (recomendado para dev)
     - `false`: Usa PA-API real (necessário em prod)

3. **Desenvolvimento**:
   ```bash
   # Iniciar em modo desenvolvimento
   npm run dev

   # Rodar testes
   npm test

   # Verificar cobertura
   npm run test:coverage

   # Verificar lint
   npm run lint
   ```

## Comandos do Bot 🤖

- `/start`: Inicia o bot e cria sua conta
- `/enable`: Ativa a monitoria de preços
- `/disable`: Desativa a monitoria
- `/addlink`: Adiciona produto(s) para monitorar
- `/list`: Lista produtos monitorados
- `/delete`: Exclui sua conta permanentemente
- `/help`: Lista os comandos disponíveis

## Estrutura do Projeto 📁

```
src/
├── application/     # Casos de uso e portas
├── domain/         # Entidades e regras de negócio
├── infrastructure/ # Adaptadores externos
└── types/          # Definições de tipos
```

## Estratégias de Consulta 📊

1. **Processamento em Lote**:
   - System busca até 10 ações `ADD_PRODUCT` pendentes
   - Extrai os ASINs únicos de todas as ações
   - Consulta a PA-API uma única vez para todos os produtos
   - Cria/atualiza produtos em massa
   - Reduz chamadas à API e melhora performance

2. **Round-Robin de Verificação**:
   - Usa paginação do DynamoDB com `LastEvaluatedKey`
   - A cada execução, busca próximo lote de produtos
   - Quando chega ao fim da lista, reinicia do início
   - Garante que todos os produtos são verificados
   - Evita sobrecarga em produtos específicos

## Fluxo de Funcionamento 🔄

1. **Criação de Conta**:
   - Usuário envia `/start`
   - Bot cria conta do usuário
   - Usuário pode usar `/enable` para ativar monitoramento

2. **Adição de Produto**:
   - Usuário envia `/addlink`
   - Bot pede os links
   - Usuário envia link(s) da Amazon
   - Sistema processa em lote para eficiência

3. **Monitoramento**:
   - Sistema verifica preços em lotes
   - Quando há redução, cria ação de notificação
   - Bot envia mensagem com o novo preço
   - Botão direto para a Amazon

4. **Gerenciamento de Conta**:
   - `/enable` / `/disable` para controlar monitoramento
   - `/list` para ver produtos monitorados
   - `/delete` para excluir conta permanentemente

## Contribuindo 🤝

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nome`)
3. Commit suas mudanças (`git commit -m 'Adiciona feature'`)
4. Push para a branch (`git push origin feature/nome`)
5. Abra um Pull Request

## Licença 📝

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.