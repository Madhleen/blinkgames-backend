import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import corsOptions from "./src/config/cors.js";
import { errorHandler } from "./src/middleware/errorHandler.js";

// Import das rotas
import authRoutes from "./src/routes/authRoutes.js";
import raffleRoutes from "./src/routes/raffleRoutes.js";
import orderRoutes from "./src/routes/orderRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import webhookRoutes from "./src/routes/webhookRoutes.js";

// Configurações iniciais
dotenv.config();
const app = express();

// Middlewares principais
app.use(express.json());
app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan("dev"));

// Conexão com o banco
connectDB();

// Rotas principais
app.use("/api/auth", authRoutes);
app.use("/api/rifas", raffleRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/webhooks", webhookRoutes);

// Rota padrão
app.get("/", (req, res) => {
  res.json({ message: "BlinkGames API rodando 🚀" });
});

// Middleware de erro
app.use(errorHandler);

// Inicialização do servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
