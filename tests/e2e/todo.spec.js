import { test, expect } from "@playwright/test";

const API_URL = process.env.API_URL || "http://localhost/api/todos";

// Limpa as tarefas antes de cada teste via API para garantir isolamento
test.beforeEach(async ({ request }) => {
  for (let i = 0; i < 3; i++) {
    const res = await request.get(API_URL);
    const list = await res.json();
    if (list.length === 0) break;
    for (const todo of list) {
      await request.delete(`${API_URL}/${todo.id}`);
    }
  }
});

// ── SMOKE TEST ────────────────────────────────────────────
test("deve carregar a página corretamente", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Todo List/);
  await expect(page.getByTestId("todo-input")).toBeVisible();
  await expect(page.getByTestId("add-btn")).toBeVisible();
  await expect(page.getByTestId("todo-list")).toBeAttached();
});

// ── CRIAR TAREFA ──────────────────────────────────────────
test("deve criar uma nova tarefa", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("todo-input").fill("Comprar leite");
  await page.getByTestId("add-btn").click();

  await expect(page.locator('[data-testid^="todo-title-"]')).toContainText("Comprar leite");
  await expect(page.getByTestId("todo-input")).toHaveValue("");
});

test("deve criar tarefa pressionando Enter", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("todo-input").fill("Estudar Playwright");
  await page.getByTestId("todo-input").press("Enter");

  await expect(page.locator('[data-testid^="todo-title-"]')).toContainText("Estudar Playwright");
});

// ── VALIDAÇÃO ─────────────────────────────────────────────
test("deve exibir erro ao tentar criar tarefa vazia", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("add-btn").click();

  await expect(page.getByTestId("error-msg")).toBeVisible();
  await expect(page.getByTestId("error-msg")).toContainText("vazio");
});

test("deve limpar mensagem de erro após criar tarefa válida", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("add-btn").click();
  await expect(page.getByTestId("error-msg")).toBeVisible();

  await page.getByTestId("todo-input").fill("Nova tarefa");
  await page.getByTestId("add-btn").click();
  await expect(page.getByTestId("error-msg")).toHaveText("");
});

// ── MARCAR COMO CONCLUÍDA ─────────────────────────────────
test("deve marcar uma tarefa como concluída", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("todo-input").fill("Tarefa para concluir");
  await page.getByTestId("add-btn").click();

  const item = page.locator('[data-testid^="todo-item-"]').first();
  const checkbox = item.locator('[data-testid^="checkbox-"]');

  await checkbox.check();

  await expect(item).toHaveClass(/completed/);
});

test("deve desmarcar uma tarefa concluída", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("todo-input").fill("Tarefa para desmarcar");
  await page.getByTestId("add-btn").click();

  const item = page.locator('[data-testid^="todo-item-"]').first();
  const checkbox = item.locator('[data-testid^="checkbox-"]');

  await checkbox.check();
  await expect(item).toHaveClass(/completed/);

  await checkbox.uncheck();
  await expect(item).not.toHaveClass(/completed/);
});

// ── EDITAR TAREFA ─────────────────────────────────────────
test("deve editar o título de uma tarefa", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("todo-input").fill("Título original");
  await page.getByTestId("add-btn").click();

  await page.locator('[data-testid^="edit-btn-"]').first().click();

  await expect(page.getByTestId("edit-modal")).toBeVisible();

  await page.getByTestId("edit-input").fill("Título editado");
  await page.getByTestId("save-edit-btn").click();

  await expect(page.getByTestId("edit-modal")).toBeHidden();
  await expect(page.locator('[data-testid^="todo-title-"]')).toContainText("Título editado");
});

test("deve fechar o modal de edição ao clicar em Cancelar", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("todo-input").fill("Qualquer tarefa");
  await page.getByTestId("add-btn").click();

  await page.locator('[data-testid^="edit-btn-"]').first().click();
  await expect(page.getByTestId("edit-modal")).toBeVisible();

  await page.getByTestId("cancel-edit-btn").click();
  await expect(page.getByTestId("edit-modal")).toBeHidden();
});

// ── DELETAR TAREFA ────────────────────────────────────────
test("deve deletar uma tarefa", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("todo-input").fill("Tarefa para deletar");
  await page.getByTestId("add-btn").click();

  await expect(page.locator('[data-testid^="todo-title-"]')).toContainText("Tarefa para deletar");

  await page.locator('[data-testid^="delete-btn-"]').first().click();

  await expect(page.locator('[data-testid^="todo-item-"]')).toHaveCount(0);
});

// ── FILTROS ───────────────────────────────────────────────
test("deve filtrar tarefas pendentes", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("todo-input").fill("Tarefa Pendente");
  await page.getByTestId("add-btn").click();
  await page.getByTestId("todo-input").fill("Tarefa Concluida");
  await page.getByTestId("add-btn").click();

  // Marca pelo título exato, independente da ordem na lista
  const itemConcluida = page.locator('[data-testid^="todo-item-"]')
    .filter({ hasText: "Tarefa Concluida" });
  await itemConcluida.locator('[data-testid^="checkbox-"]').check();

  await page.getByTestId("filter-active").click();

  const visible = page.locator('[data-testid^="todo-title-"]');
  await expect(visible).toHaveCount(1);
  await expect(visible).toContainText("Tarefa Pendente");
});

test("deve filtrar tarefas concluídas", async ({ page, request }) => {
  await page.goto("/");

  await page.getByTestId("todo-input").fill("Tarefa Pendente");
  await page.getByTestId("add-btn").click();
  await page.getByTestId("todo-input").fill("Tarefa Concluida");
  await page.getByTestId("add-btn").click();

  // Marca pelo título exato, independente da ordem na lista
  const itemConcluida = page.locator('[data-testid^="todo-item-"]')
    .filter({ hasText: "Tarefa Concluida" });
  await itemConcluida.locator('[data-testid^="checkbox-"]').check();

  await page.getByTestId("filter-completed").click();

  const visible = page.locator('[data-testid^="todo-title-"]');
  await expect(visible).toHaveCount(1);
  await expect(visible).toContainText("Tarefa Concluida");
});

// ── CONTADOR ──────────────────────────────────────────────
test("deve atualizar o contador ao adicionar tarefas", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("todo-input").fill("Tarefa 1");
  await page.getByTestId("add-btn").click();
  await page.getByTestId("todo-input").fill("Tarefa 2");
  await page.getByTestId("add-btn").click();

  await expect(page.getByTestId("counter")).toContainText("2 tarefa(s)");
});