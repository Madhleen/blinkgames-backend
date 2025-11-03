// ============================================================
// 💫 BlinkGames — server.js (v6.9 FINAL — Webhooks unificados + Segurança aprimorada)
// ============================================================

import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Rotas
import authRoutes from "./routes/authRoutes.js";
import raffleRoutes from "./routes/raffleRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";

// Controller direto — para evitar conflitos com sub-rotas do webhook
import { handleMercadoPagoWebhook } from "./controllers/webhookController.js";

// ============================================================
// ⚙️ Configurações iniciais
// ============================================================
dotenv.config();
const app = express();

// 🔹 Middleware JSON — aceita tudo (MP manda com text/plain às vezes)
app.use(express.json({ limit: "2mb", type: "*/*" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(express.text({ type: "*/*", limit: "2mb" }));

// ============================================================
// 🌐 CORS — liberado para domínios oficiais
// ============================================================
const allowedOrigins = [
  "https://blinkgamesrifa.vercel.app",
  "https://blinkgames-frontend.vercel.app",
  "https://blinkgames-frontend-ibl2lz0wx-madhleens-projects.vercel.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS não permitido"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-admin-key"],
  })
);

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
app.use("/api/checkout", checkoutRoutes);

// ============================================================
// ⚡ Webhook Mercado Pago — aceita todas as variações de rota
// ============================================================
const webhookPaths = [
  "/api/webhook/mercadopago",
  "/api/webhooks/mercadopago",
  "/ipn/webhook/mercadopago",
  "/ipn/webhooks/mercadopago",
  "/ipn/webhooks/payment",
  "/ipn/webhooks/merchant_order",
];

// POST — recebe eventos
app.post(webhookPaths, handleMercadoPagoWebhook);

// GET — validação do MP (para evitar erro 404)
app.get(webhookPaths, (_, res) => res.status(200).send("OK"));

// ============================================================
// 🧭 Rota padrão
// ============================================================
app.get("/", (req, res) => {
  res.json({ message: "🚀 BlinkGames API rodando perfeitamente!" });
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
  console.log("🌍 Webhooks ativos nos caminhos:");
  webhookPaths.forEach((p) => console.log(`   → ${p}`));
});

// ============================================================
// 🧭 Debug de rotas registradas
// ============================================================
app._router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log("🛣️ Rota registrada:", r.route.path);
  }
});

