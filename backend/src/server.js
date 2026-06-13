const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// Garante que a pasta de dados existe
const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rotas
app.use("/api/todos", require("./routes/todos"));

// Health check — usado pelo Docker e pela pipeline
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✅ Backend rodando em http://localhost:${PORT}`);
});

module.exports = app;
