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

- `/start`: Ativa o monitoramento
- `/stop`: Desativa o monitoramento
- `/addlink`: Adiciona produto(s) para monitorar
- `/help`: Lista os comandos disponíveis

## Estrutura do Projeto 📁

```
src/
├── application/     # Casos de uso e portas
├── domain/         # Entidades e regras de negócio
├── infrastructure/ # Adaptadores externos
└── types/          # Definições de tipos
```

## Fluxo de Funcionamento 🔄

1. **Adição de Produto**:
   - Usuário envia `/addlink`
   - Bot pede os links
   - Usuário envia link(s) da Amazon
   - Sistema registra para monitoramento

2. **Monitoramento**:
   - Sistema verifica preços periodicamente
   - Quando há redução, cria ação de notificação
   - Bot envia mensagem com o novo preço
   - Botão direto para a Amazon

## Contribuindo 🤝

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nome`)
3. Commit suas mudanças (`git commit -m 'Adiciona feature'`)
4. Push para a branch (`git push origin feature/nome`)
5. Abra um Pull Request

## Licença 📝

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.