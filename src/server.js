// ============================================================
// 💫 BlinkGames — server.js (v8.0 Produção Final Corrigido CORS + Segurança)
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

// ============================================================
// ⚙️ Configurações iniciais
// ============================================================
dotenv.config();
const app = express();

// ============================================================
// 🧩 Middlewares base
// ============================================================
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ============================================================
// 🌐 CORS — domínios liberados
// ============================================================
const allowedOrigins = [
  "https://blinkgamesrifa.vercel.app",
  "https://blinkgames-frontend.vercel.app",
  "https://blinkgames-frontend-ibl2lz0wx-madhleens-projects.vercel.app",
  "https://blinkgames-frontend-r0eo0jk1q-madhleens-projects.vercel.app",
  "https://blinkgames-frontend-4qx5kvagp-madhleens-projects.vercel.app",
  "https://blinkgames-frontend-twakpm6m7-madhleens-projects.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5500",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        /\.vercel\.app$/.test(origin)
      ) {
        return callback(null, true);
      }
      console.warn(`🚫 CORS bloqueado: ${origin}`);
      return callback(new Error("CORS não permitido"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-admin-key",
      "Origin",
      "Accept",
    ],
    exposedHeaders: ["Authorization"],
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
// ⚡ Webhook Mercado Pago
// ============================================================
[
  "/api/webhooks/payment",
  "/ipn/webhooks/payment",
  "/ipn/webhooks/mercadopago",
].forEach((path) => {
  app.post(path, handleMercadoPagoWebhook);
  app.get(path, (_, res) => res.status(200).send("OK"));
});

// ============================================================
// 🧭 Rota padrão
// ============================================================
app.get("/", (_, res) => {
  res.json({ message: "🚀 BlinkGames backend rodando com CORS liberado!" });
});

// ============================================================
// ⚠️ Middleware global de erro
// ============================================================
app.use((err, req, res, next) => {
  if (err.message === "CORS não permitido") {
    console.error(`🚫 Rejeitado CORS: ${req.headers.origin}`);
    return res.status(403).json({ error: "CORS não permitido para esta origem." });
  }
  next(err);
});

app.use(errorHandler);

// ============================================================
// 🔥 Inicialização do servidor
// ============================================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Servidor ativo na porta ${PORT}`));

