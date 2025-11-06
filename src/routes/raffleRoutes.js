// ============================================================
// 🎟️ BlinkGames — routes/raffleRoutes.js (v8.0 Produção)
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

import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// 🔹 Rotas públicas
router.get("/", getRaffles);
router.get("/:id", getRaffleById);

// 🔹 Rotas protegidas (admin)
router.post("/", verifyToken, createRaffle);
router.put("/:id", verifyToken, updateRaffle);
router.put("/:id/desativar", verifyToken, deactivateRaffle);

// 🔹 Geração de números
router.post("/:id/generate", verifyToken, generateNumbers);

export default router;

