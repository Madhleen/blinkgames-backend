// ============================================================
// 💫 BlinkGames — server.js (v6.2 Final Estável + Suporte Webhooks MP)
// ============================================================

import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Rotas
import authRoutes from "./routes/authRoutes.js";
import raffleRoutes from "./routes/raffleRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";

// ============================================================
// ⚙️ Configurações iniciais
// ============================================================
dotenv.config();
const app = express();

// 🔹 Aceita JSON, texto puro e URL encoded — necessário pro Mercado Pago
app.use(express.json({ limit: "2mb" }));
app.use(express.text({ type: "*/*", limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// ============================================================
// 🌐 CORS — manual e seguro para Vercel + Render + Mercado Pago
// ============================================================
const allowedOrigins = [
  "https://blinkgamesrifa.vercel.app",
  "https://blinkgames-frontend.vercel.app",
  "https://blinkgames-frontend-ibl2lz0wx-madhleens-projects.vercel.app",
  "http://localhost:5173",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-admin-key"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// ============================================================
// 🧩 Corrige preflight global (Render bugfix)
// ============================================================
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-admin-key"
  );
  res.sendStatus(200);
});

// ============================================================
// 🔒 Segurança e logs
// ============================================================
app.use(helmet());
app.use(morgan("dev"));

// ============================================================
// 💾 Banco de dados
// ============================================================
connectDB();

// ============================================================
// 🚀 Rotas principais
// ============================================================
app.use("/api/auth", authRoutes);
app.use("/api/raffles", raffleRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/webhooks", webhookRoutes); // 🔹 Webhook Mercado Pago
app.use("/api/checkout", checkoutRoutes);

// ============================================================
// 🧭 Rota padrão
// ============================================================
app.get("/", (req, res) => {
  res.json({ message: "BlinkGames API rodando 🚀" });
});

// ============================================================
// ⚠️ Middleware de erro
// ============================================================
app.use(errorHandler);

// ============================================================
// 🔥 Inicialização do servidor
// ============================================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

// 🔍 Debug de rotas
app._router.stack.forEach(r => {
  if (r.route && r.route.path) {
    console.log("🛣️ Rota registrada:", r.route.path);
  }
});

