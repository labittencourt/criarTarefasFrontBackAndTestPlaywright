const express = require("express");
const router = express.Router();
const db = require("../database");

// GET /api/todos — listar todas as tarefas
router.get("/", (req, res) => {
  const todos = db.prepare("SELECT * FROM todos ORDER BY created_at DESC").all();
  res.json(todos);
});

// POST /api/todos — criar nova tarefa
router.post("/", (req, res) => {
  const { title } = req.body;

  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "O título é obrigatório" });
  }

  const result = db
    .prepare("INSERT INTO todos (title) VALUES (?)")
    .run(title.trim());

  const todo = db
    .prepare("SELECT * FROM todos WHERE id = ?")
    .get(result.lastInsertRowid);

  res.status(201).json(todo);
});

// PUT /api/todos/:id — editar tarefa
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;

  const todo = db.prepare("SELECT * FROM todos WHERE id = ?").get(id);
  if (!todo) return res.status(404).json({ error: "Tarefa não encontrada" });

  const newTitle = title !== undefined ? title.trim() : todo.title;
  const newCompleted = completed !== undefined ? (completed ? 1 : 0) : todo.completed;

  if (newTitle === "") {
    return res.status(400).json({ error: "O título é obrigatório" });
  }

  db.prepare("UPDATE todos SET title = ?, completed = ? WHERE id = ?")
    .run(newTitle, newCompleted, id);

  const updated = db.prepare("SELECT * FROM todos WHERE id = ?").get(id);
  res.json(updated);
});

// DELETE /api/todos/:id — deletar tarefa
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  const todo = db.prepare("SELECT * FROM todos WHERE id = ?").get(id);
  if (!todo) return res.status(404).json({ error: "Tarefa não encontrada" });

  db.prepare("DELETE FROM todos WHERE id = ?").run(id);
  res.status(204).send();
});

module.exports = router;
