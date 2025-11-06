// ============================================================
// 🎟️ BlinkGames — routes/raffleRoutes.js (v7.7 Produção Corrigida FINAL)
// ============================================================

import express from "express";
import {
  getRaffles,
  getRaffleById,
  createRaffle,
  updateRaffle,
  deactivateRaffle,
  generateNumbers,
} from "../controllers/raffleController.js";

// ✅ Caminhos corrigidos (middleware no singular)
import { verifyToken } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";

const router = express.Router();

// 🔹 Rotas públicas
router.get("/", getRaffles);
router.get("/:id", getRaffleById);

// 🔹 Rotas de administrador
router.post("/", verifyToken, adminMiddleware, createRaffle);
router.put("/:id", verifyToken, adminMiddleware, updateRaffle);
router.put("/:id/deactivate", verifyToken, adminMiddleware, deactivateRaffle);

// 🔹 Gerar números disponíveis (usuário logado)
router.post("/:id/generate", verifyToken, generateNumbers);

export default router;

