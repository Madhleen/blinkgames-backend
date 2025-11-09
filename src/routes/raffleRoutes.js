// ============================================================
// 🎟️ BlinkGames — routes/raffleRoutes.js (v8.1 Corrigido)
// ============================================================

import express from "express";
import {
  getRaffles,
  getRaffleById,
  createRaffle,
  updateRaffle,
  deactivateRaffle,
  generateNumbers,
  reserveNumbers,
} from "../controllers/raffleController.js";

import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// 🔹 Rotas públicas
router.get("/", getRaffles);
router.get("/:id", getRaffleById);

// 🔹 Rotas protegidas
router.post("/", verifyToken, createRaffle);
router.put("/:id", verifyToken, updateRaffle);
router.put("/:id/desativar", verifyToken, deactivateRaffle);

// 🔹 Geração e reserva de números
router.post("/:id/generate", verifyToken, generateNumbers);
router.post("/:id/reserve", verifyToken, reserveNumbers);

export default router;

