// ============================================================
// 🎟️ BlinkGames — routes/raffleRoutes.js (v7.6 Produção Corrigida)
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

import { verifyToken } from "../middlewares/auth.js"; // ✅ Caminho e nome corrigidos
import { adminMiddleware } from "../middlewares/admin.js"; // ✅ Mantém padrão plural

const router = express.Router();

// 🔹 Rotas públicas (abertas)
router.get("/", getRaffles);
router.get("/:id", getRaffleById);

// 🔹 Rotas restritas para administradores
router.post("/", verifyToken, adminMiddleware, createRaffle);
router.put("/:id", verifyToken, adminMiddleware, updateRaffle);
router.put("/:id/deactivate", verifyToken, adminMiddleware, deactivateRaffle);

// 🔹 Gerar números disponíveis (usuário logado)
router.post("/:id/generate", verifyToken, generateNumbers);

export default router;

