const API = `${window.location.protocol}//${window.location.hostname}/api/todos`;

let todos = [];
let currentFilter = "all";
let editingId = null;

// ── Elementos do DOM ──────────────────────────────────────
const input      = document.getElementById("todo-input");
const addBtn     = document.getElementById("add-btn");
const list       = document.getElementById("todo-list");
const errorMsg   = document.getElementById("error-msg");
const counter    = document.getElementById("counter");
const editModal  = document.getElementById("edit-modal");
const editInput  = document.getElementById("edit-input");
const saveBtn    = document.getElementById("save-edit-btn");
const cancelBtn  = document.getElementById("cancel-edit-btn");
const overlay    = document.getElementById("modal-overlay");
const filterBtns = document.querySelectorAll(".filter-btn");

// ── Carregar tarefas ──────────────────────────────────────
async function loadTodos() {
  const res = await fetch(API);
  todos = await res.json();
  renderTodos();
}

// ── Renderizar lista ──────────────────────────────────────
function renderTodos() {
  const filtered = todos.filter(t => {
    if (currentFilter === "active")    return !t.completed;
    if (currentFilter === "completed") return t.completed;
    return true;
  });

  list.innerHTML = "";

  if (filtered.length === 0) {
    list.innerHTML = `<li class="empty-state">Nenhuma tarefa encontrada.</li>`;
  } else {
    filtered.forEach(todo => {
      const li = document.createElement("li");
      li.className = `todo-item${todo.completed ? " completed" : ""}`;
      li.setAttribute("data-testid", `todo-item-${todo.id}`);
      li.innerHTML = `
        <input
          type="checkbox"
          ${todo.completed ? "checked" : ""}
          data-testid="checkbox-${todo.id}"
          onchange="toggleTodo(${todo.id}, this.checked)"
        />
        <span class="todo-title" data-testid="todo-title-${todo.id}">${todo.title}</span>
        <button class="edit-btn" data-testid="edit-btn-${todo.id}" onclick="openEdit(${todo.id})">Editar</button>
        <button class="delete-btn" data-testid="delete-btn-${todo.id}" onclick="deleteTodo(${todo.id})">Excluir</button>
      `;
      list.appendChild(li);
    });
  }

  const total     = todos.length;
  const completed = todos.filter(t => t.completed).length;
  const pending   = total - completed;
  counter.textContent = `${total} tarefa(s) — ${pending} pendente(s), ${completed} concluída(s)`;
}

// ── Criar tarefa ──────────────────────────────────────────
addBtn.addEventListener("click", createTodo);
input.addEventListener("keydown", e => { if (e.key === "Enter") createTodo(); });

async function createTodo() {
  const title = input.value.trim();
  errorMsg.textContent = "";

  if (!title) {
    errorMsg.textContent = "O título não pode estar vazio.";
    return;
  }

  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });

  if (!res.ok) {
    const data = await res.json();
    errorMsg.textContent = data.error;
    return;
  }

  input.value = "";
  await loadTodos();
}

// ── Marcar como concluída ─────────────────────────────────
async function toggleTodo(id, completed) {
  await fetch(`${API}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completed }),
  });
  await loadTodos();
}

// ── Editar tarefa ─────────────────────────────────────────
function openEdit(id) {
  const todo = todos.find(t => t.id === id);
  editingId = id;
  editInput.value = todo.title;
  editModal.classList.remove("hidden");
  overlay.classList.remove("hidden");
  editInput.focus();
}

function closeEdit() {
  editModal.classList.add("hidden");
  overlay.classList.add("hidden");
  editingId = null;
}

saveBtn.addEventListener("click", async () => {
  const title = editInput.value.trim();
  if (!title) return;

  await fetch(`${API}/${editingId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });

  closeEdit();
  await loadTodos();
});

cancelBtn.addEventListener("click", closeEdit);
overlay.addEventListener("click", closeEdit);

// ── Deletar tarefa ────────────────────────────────────────
async function deleteTodo(id) {
  await fetch(`${API}/${id}`, { method: "DELETE" });
  await loadTodos();
}

// ── Filtros ───────────────────────────────────────────────
filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderTodos();
  });
});

// ── Init ──────────────────────────────────────────────────
loadTodos();