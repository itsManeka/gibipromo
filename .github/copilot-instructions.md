# Copilot Instructions — GibiPromo

## Objetivo do Projeto
Criar um bot de Telegram em **TypeScript** para monitoramento de preços da Amazon, utilizando **Clean Architecture**, **AWS Free Tier** (Lambda, DynamoDB, S3), e boas práticas de performance e custo.

---

## Estilo de Código
- Linguagem: **TypeScript**
- Arquitetura: **Clean Architecture**
- Padrões: **Clean Code**
- Documentação: **JSDoc/TypeDoc**
- Testes: unitários + integrados (cobertura mínima 80%)

---

## Banco de Dados (DynamoDB)
- Sempre use **snake_case** para nomes de colunas  
- Tabelas principais:
  - `Users`
  - `Products`
  - `Actions`
  - `ActionConfigs` (configuração de agendamentos)
- Flags booleanas devem ser sempre `true`/`false`, nunca strings
- Sempre filtre ações por `is_processed = 0 (false)` antes de executá-las
- Após processar com sucesso, atualizar `is_processed = 1 (true)`

---

## Fluxos Principais
### Telegram
- `/start` → Ativa monitoramento (`Users.enabled = true`)
- `/stop` → Desativa monitoramento (`Users.enabled = false`)
- `/help` → Lista comandos disponíveis
- `/addlink` → Registra ação para monitorar um produto da Amazon

### Ações (Actions)
- Todas as operações são registradas como **ações** no DynamoDB
- Scheduler deve buscar apenas ações **pendentes** (`is_processed = 0 (false)`)
- Após execução, marcar como `is_processed = 1 (true)`

### Agendamento
- Use **toad-scheduler** ou **croner**
- Nunca use valores hardcoded para intervalos
- Leia os intervalos da tabela `ActionConfigs`
- Campos da `ActionConfigs`:
  - `action_type` (string)
  - `interval_minutes` (number)
  - `enabled` (boolean)

---

## AWS
- Ambiente `dev`: DynamoDB local via Docker + mock da Amazon PA-API
- Ambiente `prod`: AWS Lambda, DynamoDB, S3
- Evite custos desnecessários (ex.: não consulte a PA-API em testes)
- Sempre isole variáveis em `.env` (usando `dotenv`)

---

## Boas Práticas
- Sempre escreva código desacoplado e testável
- Prefira **funções puras** onde possível
- Sempre logue ações críticas para debug
- **Antes de enviar alterações, rode `npm run dev` e valide os fluxos principais no Telegram**

---

## Testes e Validação

### Casos de Teste e Interações
- Criar casos de teste para:
  - Erros já reportados
  - Problemas existentes
  - Novas funcionalidades
  - Melhorias aplicadas

### Padrão de Qualidade
- Todos os testes devem ter **100% de sucesso**
- Cobertura mínima de **80%**
- Criar **mocks** para APIs externas (ex.: Amazon PA-API)
- Conferir **lint** (ESLint) antes de commit
- Validar **logs** de execução para garantir que fluxos críticos foram percorridos

### Regra para Qualquer Alteração
- Criar testes unitários e integrados
- Documentar o código (JSDoc/TypeDoc)
- Atualizar **README.md** com mudanças relevantes

---

## Exemplo: Fluxo `/addlink`
1. Usuário envia `/addlink <url>`
2. Bot responde no Telegram confirmando o recebimento
3. Cria ação no DynamoDB (`type = ADD_PRODUCT`, `is_processed = 0 (false)`)
4. Scheduler executa ações `ADD_PRODUCT` pendentes
5. Consulta produto na Amazon (mock em dev)
6. Atualiza ou cria produto no `Products`
7. Se preço cair → cria ação `NOTIFY_PRICE`
