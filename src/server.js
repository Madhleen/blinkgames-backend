// ============================================================
// 💫 BlinkGames — server.js (v7.5 PRODUÇÃO FINAL)
// ============================================================

import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";

// 🔗 Rotas
import authRoutes from "./routes/authRoutes.js";
import raffleRoutes from "./routes/raffleRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";
import { handleMercadoPagoWebhook } from "./controllers/webhookController.js";

dotenv.config();
const app = express();

// ============================================================
// 🧩 Middleware base
// ============================================================
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ============================================================
// 🌐 CORS — domínios liberados (Front + Local)
// ============================================================
const allowedOrigins = [
  "https://blinkgamesrifa.vercel.app",
  "https://blinkgames-frontend.vercel.app",
  "https://blinkgames-frontend-ibl2lz0wx-madhleens-projects.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5500",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      console.warn(`🚫 CORS bloqueado: ${origin}`);
      return callback(new Error("CORS não permitido"));
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
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/checkout", checkoutRoutes);

// ============================================================
// ⚡ Webhook Mercado Pago (produção)
// ============================================================
["/api/webhooks/payment", "/ipn/webhooks/payment", "/ipn/webhooks/mercadopago"].forEach(
  (path) => {
    app.post(path, handleMercadoPagoWebhook);
    app.get(path, (_, res) => res.status(200).send("OK"));
  }
);

// ============================================================
// 🧭 Rota padrão
// ============================================================
app.get("/", (_, res) => {
  res.json({ message: "🚀 BlinkGames backend rodando em produção estável!" });
});

// ============================================================
// ⚠️ Middleware de erro global
// ============================================================
app.use(errorHandler);

// ============================================================
// 🔥 Inicialização do servidor
// ============================================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Servidor ativo na porta ${PORT}`));

