import express from "express";
import {
  getDashboard,
  listUsers,
  listRaffles,
  listPayments,
  exportCSV,
} from "../controllers/adminController.js";

import { createRaffle } from "../controllers/rifaController.js"; // ✅ importa função que já cria rifas
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";

const router = express.Router();

// 🔹 Dashboard
router.get("/dashboard", authMiddleware, adminMiddleware, getDashboard);

// 🔹 Listagens
router.get("/users", authMiddleware, adminMiddleware, listUsers);
router.get("/raffles", authMiddleware, adminMiddleware, listRaffles);
router.get("/payments", authMiddleware, adminMiddleware, listPayments);

// 🔹 Exportação CSV
router.get("/export", authMiddleware, adminMiddleware, exportCSV);

// ✅ NOVA ROTA: criação de rifas com chave admin
router.post("/rifas", adminMiddleware, createRaffle);

export default router;

