# QA Portfolio — Todo List

Projeto completo de demonstração de QA com frontend, backend, banco de dados e testes E2E e de API automatizados com Playwright.

---

## Stack

| Camada     | Tecnologia              |
|------------|-------------------------|
| Frontend   | HTML + CSS + JavaScript |
| Backend    | Node.js + Express       |
| Banco      | SQLite                  |
| Testes     | Playwright              |
| CI/CD      | GitHub Actions          |
| Infra      | Docker + Docker Compose |

---

## Como rodar localmente

### Pré-requisitos
- Docker Desktop instalado e rodando
- Portas `80` e `3001` livres na máquina (usadas pelo frontend e backend)

### Clonar o repositório
```bash
git clone https://github.com/labittencourt/criarTarefasFrontBackAndTestPlaywright.git
cd criarTarefasFrontBackAndTestPlaywright
```

### Subir o ambiente
```bash
docker compose up -d backend frontend
```

> ⏳ Na primeira execução o Docker precisa construir as imagens e instalar as dependências — pode levar alguns minutos.
> 🐧 Em Linux, expor a porta `80` pode exigir `sudo`.

Acesse: http://localhost

### Parar o ambiente
```bash
docker compose down
```

Para remover também os dados do banco SQLite (volume persistente):
```bash
docker compose down -v
```

### Rodar os testes
```bash
docker compose --profile test up tests
```

O relatório HTML será gerado em `tests/playwright-report/`.

### Rodar os testes em modo UI (interativo)

Com o ambiente já rodando (`docker compose up -d backend frontend`), execute localmente:

```bash
cd tests
npm install
npx playwright install
npx playwright test --ui
```

Isso abre a interface visual do Playwright, onde é possível selecionar, executar e depurar os testes passo a passo (com time travel).

### Visualizar o relatório de testes
```bash
npx playwright show-report tests/playwright-report
```

Ou abra diretamente o arquivo `tests/playwright-report/index.html` no navegador.

---

## Estrutura do projeto

```
criarTarefasFrontBackAndTestPlaywright/
├── .github/
│   └── workflows/
│       └── ci.yml         # Pipeline CI/CD (GitHub Actions)
├── frontend/
│   ├── index.html        # Interface da aplicação
│   ├── style.css         # Estilos
│   ├── app.js            # Lógica do frontend
│   └── Dockerfile
├── backend/
│   ├── src/
│   │   ├── server.js     # Servidor Express
│   │   ├── database.js   # Configuração do SQLite
│   │   └── routes/
│   │       └── todos.js  # Rotas da API REST
│   └── Dockerfile
├── tests/
│   ├── e2e/
│   │   └── todo.spec.js  # Testes E2E (UI) com Playwright
│   ├── api/
│   │   └── todos.spec.js # Testes de API (backend) com Playwright
│   ├── playwright.config.js
│   └── package.json
└── docker-compose.yml
```

---

## API

| Método   | Rota              | Descrição              |
|----------|-------------------|------------------------|
| GET      | /api/todos        | Lista todas as tarefas |
| POST     | /api/todos        | Cria uma nova tarefa   |
| PUT      | /api/todos/:id    | Edita uma tarefa       |
| DELETE   | /api/todos/:id    | Deleta uma tarefa      |
| GET      | /health           | Health check           |

---

## Cenários de teste cobertos

| Cenário                                        | Tipo         |
|------------------------------------------------|--------------|
| Carrega a página corretamente                  | Smoke        |
| Cria nova tarefa pelo botão                    | Happy path   |
| Cria nova tarefa pressionando Enter            | Happy path   |
| Exibe erro ao tentar criar tarefa vazia        | Negativo     |
| Limpa erro após criar tarefa válida            | Negativo     |
| Marca tarefa como concluída                    | Happy path   |
| Desmarca tarefa concluída                      | Happy path   |
| Edita o título de uma tarefa                   | Happy path   |
| Fecha modal de edição ao clicar em Cancelar    | Happy path   |
| Deleta uma tarefa                              | Happy path   |
| Filtra tarefas pendentes                       | Happy path   |
| Filtra tarefas concluídas                      | Happy path   |
| Atualiza o contador ao adicionar tarefas       | Happy path   |

---

## Testes de API (backend)

Além dos testes E2E de UI, há testes de API (`tests/api/todos.spec.js`) que validam o backend diretamente, via `request` do Playwright.

| Cenário                                              | Tipo       |
|-------------------------------------------------------|------------|
| Lista vazia quando não há tarefas                      | Smoke      |
| Lista as tarefas criadas                               | Happy path |
| Cria uma nova tarefa (201)                             | Happy path |
| Remove espaços extras do título                        | Happy path |
| Erro 400 ao criar tarefa sem título                    | Negativo   |
| Erro 400 ao criar tarefa com título só de espaços      | Negativo   |
| Atualiza o título de uma tarefa                        | Happy path |
| Marca tarefa como concluída via API                    | Happy path |
| Erro 400 ao atualizar com título vazio                 | Negativo   |
| Erro 404 ao atualizar tarefa inexistente               | Negativo   |
| Deleta uma tarefa existente (204)                      | Happy path |
| Erro 404 ao deletar tarefa inexistente                 | Negativo   |
| Health check (`/health`) retorna status "ok"           | Smoke      |

### Executar por tipo de teste

```bash
cd tests
npx playwright test --project=e2e   # apenas testes de UI
npx playwright test --project=api   # apenas testes de API
```

---

## CI/CD (GitHub Actions)

A pipeline está definida em [`.github/workflows/ci.yml`](.github/workflows/ci.yml) e é composta por dois jobs.

### Gatilhos (`on`)

| Gatilho   | Configuração                  | Quando dispara                            |
|-----------|--------------------------------|--------------------------------------------|
| Push      | `push: branches: [main]`       | A cada push na branch `main`                |
| Manual    | `workflow_dispatch`             | Sob demanda, pela aba **Actions** do GitHub |
| Agendado  | `schedule: cron: "0 6 * * *"`  | Diariamente às 06:00 UTC                    |

### Job 1 — `e2e-tests`

Reaproveita o mesmo `docker-compose.yml` usado localmente:

1. `docker compose build` — constrói as imagens de backend e frontend
2. `docker compose up -d backend frontend` — sobe o ambiente (aguarda o backend ficar `healthy` via healthcheck)
3. `docker compose run --rm tests` — executa a suíte Playwright (projetos `e2e` e `api`), gerando `tests/playwright-report/` e `tests/junit.xml` no runner via bind mount
4. Upload dos relatórios como **artefatos** (`actions/upload-artifact`), com `if: always()` para preservá-los mesmo se os testes falharem
5. `docker compose down -v` — encerra e limpa containers e volumes

### Job 2 — `publish-report`

Depende do job anterior (`needs: e2e-tests`) e roda mesmo se ele falhar (`if: always()`), garantindo que o relatório de uma execução com falhas também fique disponível:

1. Baixa o artefato `playwright-report`
2. `actions/configure-pages` + `actions/upload-pages-artifact` + `actions/deploy-pages` publicam o conteúdo no **GitHub Pages**

> ⚠️ Para o deploy funcionar é necessário habilitar o GitHub Pages no repositório (Settings → Pages → Source: **GitHub Actions**) — configuração feita uma única vez, manualmente.

### Conceitos utilizados

- **Triggers (`on`)**: `push`, `workflow_dispatch` (execução manual) e `schedule` (cron) combinados no mesmo workflow
- **Jobs e `needs`**: o job de publicação depende do job de testes, formando uma pipeline sequencial
- **`if: always()`**: garante que artefatos e publicação aconteçam mesmo com testes falhando — essencial para depurar falhas
- **Artefatos** (`actions/upload-artifact` / `download-artifact`): armazenam o relatório HTML e o JUnit para download manual, com retenção de 7 dias
- **GitHub Pages via Actions**: `permissions: pages/id-token`, `environment: github-pages` e as actions oficiais (`configure-pages`, `upload-pages-artifact`, `deploy-pages`) publicam o relatório como site estático
- **`concurrency`**: evita deploys simultâneos no Pages

### Onde ver os resultados

- **Aba "Actions"** do repositório → logs de cada execução e link para download dos artefatos
- **GitHub Pages** (URL disponível em Settings → Pages após o primeiro deploy) → relatório HTML navegável da última execução
