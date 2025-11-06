// ============================================================
// 🛠️ BlinkGames — routes/adminRoutes.js (v8.0 Produção)
// ============================================================

import express from "express";
import {
  getDashboard,
  listUsers,
  listRaffles,
  listPayments,
  exportCSV,
} from "../controllers/adminController.js";
import { createRaffle } from "../controllers/raffleController.js";
import { adminMiddleware } from "../middleware/admin.js";

const router = express.Router();

// 🔹 Dashboard
router.get("/dashboard", adminMiddleware, getDashboard);

// 🔹 Listagens
router.get("/users", adminMiddleware, listUsers);
router.get("/raffles", adminMiddleware, listRaffles);
router.get("/payments", adminMiddleware, listPayments);

// 🔹 Exportação CSV
router.get("/export", adminMiddleware, exportCSV);

// 🔹 Criar rifa
router.post("/rifas", adminMiddleware, createRaffle);

export default router;

