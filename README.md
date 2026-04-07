# HL AI App

API em Node.js para gerenciamento de conversas com IA, com historico persistido em Redis e dois fluxos principais:

- `orchestrator`: classifica e estrutura entradas de usuarios em JSON.
- `meditations`: responde perguntas com suporte a RAG sobre meditacoes e conteudo biblico/luterano.

O projeto foi organizado para servir como backend de atendimento conversacional, com autenticacao por `api-key`, memoria por `threadId` e integracao com OpenAI, LangChain, LangGraph, Redis e FAISS.

## Principais recursos

- Criacao, leitura e exclusao de conversas
- Persistencia de historico no Redis
- Fluxo de orquestracao para classificar entradas
- Fluxo de meditacoes com recuperacao semantica
- Filtro simples de palavras indevidas no fluxo do orquestrador
- Base vetorial local com FAISS

## Stack

- Node.js
- Express
- Redis
- OpenAI
- LangChain
- LangGraph
- FAISS

## Estrutura do projeto

```text
src/
  index.js
  app.js
  routes/
  controller/
  service/
  auth_middleware/
  meditations_operations/
  orchestrator_operations/
  redis/
  chatbot_config/
    meditations_config/
    orchestrator_config/
  tests/

assets/
  ...

assets-example/
  meditations/
  bad_words.txt

database/
  meditations_db/
```

## Variaveis de ambiente

Crie um arquivo `.env` na raiz com os valores necessarios:

```env
PORT=8000
LOOPBACK=127.0.0.1
API_TOKEN=sua_chave_interna
REDIS_URL=redis://localhost:6379

OPENAI_API_KEY=sua_chave_openai
JSON_MEDITATIONS_PATH=./assets/meditations

ML_API_TOKEN=seu_token_modelo_auxiliar
ML_BASE_URL=https://sua-url-base
```

## Instalacao

```bash
npm install
```

Copie as variaveis de exemplo antes de rodar localmente:

```bash
cp .env.example .env
```

Se for subir o projeto sem os dados reais, copie a estrutura de exemplo:

```bash
cp -r assets-example assets
```

## Execucao

Suba o Redis localmente e inicie a API:

```bash
npm start
```

Servidor padrao:

```text
http://127.0.0.1:8000
```

## Geração da base vetorial

Se precisar recriar a base FAISS a partir dos JSONs de meditacoes:

```bash
npm run build:db
```

## Testes e CI

Rodar testes localmente:

```bash
npm test
```

O repositorio inclui uma workflow de GitHub Actions em `.github/workflows/ci.yml` para executar a suite automaticamente em `push` e `pull_request`.

## Endpoints

Base: `/api`

### Criar conversa

`POST /conversations`

Body:

```json
{
  "threadId": "opcional",
  "initialMessages": []
}
```

### Enviar mensagem para meditacoes

`POST /conversations/:threadId/meditations`

Body:

```json
{
  "message": "Qual o significado da graca?"
}
```

### Enviar mensagem para o orquestrador

`POST /conversations/:threadId/orchestrator`

Body:

```json
{
  "message": "Quero falar sobre reconciliacao"
}
```

### Consultar historico

`GET /conversations/:threadId`

### Listar conversas

`GET /conversations`

### Excluir conversa

`DELETE /conversations/:threadId`

## Autenticacao

Todas as rotas usam o header:

```text
api-key: <API_TOKEN>
```

## Observacoes para publicacao

- Nao publique seu arquivo `.env`
- Nao publique `node_modules`
- A pasta `assets/` esta ignorada no Git; publique apenas `assets-example/`
- Revise se a base em `database/meditations_db` pode ser exposta publicamente
- Se o repositorio for publico, remova ou anonimiza qualquer dado sensivel dos logs

## Licenca

Este projeto esta licenciado sob a licenca MIT. Veja o arquivo [LICENSE](./LICENSE).
