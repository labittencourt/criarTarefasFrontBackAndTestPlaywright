import { test, expect } from "@playwright/test";

const API_URL = process.env.API_URL || "http://localhost/api/todos";
const HEALTH_URL = (process.env.BASE_URL || "http://localhost").replace(/\/$/, "") + "/health";

// Limpa as tarefas antes de cada teste para garantir isolamento
test.beforeEach(async ({ request }) => {
  const res = await request.get(API_URL);
  const list = await res.json();
  for (const todo of list) {
    await request.delete(`${API_URL}/${todo.id}`);
  }
});

test.describe("GET /api/todos", () => {
  test("deve retornar lista vazia quando não há tarefas", async ({ request }) => {
    const res = await request.get(API_URL);

    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  test("deve listar tarefas criadas", async ({ request }) => {
    await request.post(API_URL, { data: { title: "Tarefa 1" } });
    await request.post(API_URL, { data: { title: "Tarefa 2" } });

    const list = await (await request.get(API_URL)).json();

    expect(list).toHaveLength(2);
  });
});

test.describe("POST /api/todos", () => {
  test("deve criar uma nova tarefa", async ({ request }) => {
    const res = await request.post(API_URL, { data: { title: "Comprar leite" } });

    expect(res.status()).toBe(201);

    const todo = await res.json();
    expect(todo).toMatchObject({ title: "Comprar leite", completed: 0 });
    expect(todo.id).toBeDefined();
  });

  test("deve remover espaços extras do título", async ({ request }) => {
    const res = await request.post(API_URL, { data: { title: "  Com espaços  " } });

    expect((await res.json()).title).toBe("Com espaços");
  });

  test("deve retornar erro 400 ao criar tarefa sem título", async ({ request }) => {
    const res = await request.post(API_URL, { data: { title: "" } });

    expect(res.status()).toBe(400);
    expect((await res.json()).error).toContain("obrigatório");
  });

  test("deve retornar erro 400 ao criar tarefa com título só de espaços", async ({ request }) => {
    const res = await request.post(API_URL, { data: { title: "   " } });

    expect(res.status()).toBe(400);
  });
});

test.describe("PUT /api/todos/:id", () => {
  test("deve atualizar o título da tarefa", async ({ request }) => {
    const created = await (await request.post(API_URL, { data: { title: "Título original" } })).json();

    const res = await request.put(`${API_URL}/${created.id}`, { data: { title: "Título editado" } });

    expect(res.status()).toBe(200);
    expect((await res.json()).title).toBe("Título editado");
  });

  test("deve marcar tarefa como concluída", async ({ request }) => {
    const created = await (await request.post(API_URL, { data: { title: "Tarefa" } })).json();

    const res = await request.put(`${API_URL}/${created.id}`, { data: { completed: true } });

    expect((await res.json()).completed).toBe(1);
  });

  test("deve retornar erro 400 ao atualizar com título vazio", async ({ request }) => {
    const created = await (await request.post(API_URL, { data: { title: "Tarefa" } })).json();

    const res = await request.put(`${API_URL}/${created.id}`, { data: { title: "" } });

    expect(res.status()).toBe(400);
  });

  test("deve retornar erro 404 ao atualizar tarefa inexistente", async ({ request }) => {
    const res = await request.put(`${API_URL}/999999`, { data: { title: "Não existe" } });

    expect(res.status()).toBe(404);
  });
});

test.describe("DELETE /api/todos/:id", () => {
  test("deve deletar uma tarefa existente", async ({ request }) => {
    const created = await (await request.post(API_URL, { data: { title: "Tarefa para deletar" } })).json();

    const res = await request.delete(`${API_URL}/${created.id}`);
    expect(res.status()).toBe(204);

    const list = await (await request.get(API_URL)).json();
    expect(list.find(t => t.id === created.id)).toBeUndefined();
  });

  test("deve retornar erro 404 ao deletar tarefa inexistente", async ({ request }) => {
    const res = await request.delete(`${API_URL}/999999`);

    expect(res.status()).toBe(404);
  });
});

test.describe("GET /health", () => {
  test("deve retornar status ok", async ({ request }) => {
    const res = await request.get(HEALTH_URL);

    expect(res.status()).toBe(200);
    expect((await res.json()).status).toBe("ok");
  });
});
