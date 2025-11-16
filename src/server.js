// ============================================================
// 💫 BlinkGames — server.js (v10 FINAL — Checkout/Webhook Fix + CORS)
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
import webhookRoutes from "./routes/webhookRoutes.js";

dotenv.config();
const app = express();

// ============================================================
// 🔧 Middlewares base
// ============================================================
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// ============================================================
// 🌐 CORS — apenas domínios válidos
// ============================================================
const allowedOrigins = [
  "https://blinkgamesrifa.vercel.app",
  "https://blinkgames-frontend.vercel.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }
      console.warn("🚫 CORS bloqueado para:", origin);
      return callback(new Error("CORS não permitido"));
    },
    credentials: true,
  })
);

// Segurança + logs
app.use(helmet());
app.use(morgan("dev"));

// ============================================================
// 💾 Banco de dados
// ============================================================
connectDB();

// ============================================================
// 🔔 Webhook (carregado ANTES das rotas normais)
// ============================================================
app.use("/api/webhooks", webhookRoutes);

// ============================================================
// 🚀 Rotas principais
// ============================================================
app.use("/api/auth", authRoutes);
app.use("/api/raffles", raffleRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/checkout", checkoutRoutes);

// ============================================================
// 🏁 Rota padrão
// ============================================================
app.get("/", (_, res) => {
  res.json({ message: "🚀 BlinkGames backend ativo!" });
});

// ============================================================
// ⚠️ Middleware global de erros
// ============================================================
app.use((err, req, res, next) => {
  if (err.message === "CORS não permitido") {
    return res.status(403).json({
      error: "CORS bloqueado para esta origem.",
    });
  }
  next(err);
});

app.use(errorHandler);

// ============================================================
// 🚀 Inicialização
// ============================================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));

