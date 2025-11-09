// ============================================================
// 🎟️ BlinkGames — routes/raffleRoutes.js (v8.2 — público p/ reserve/generate)
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

// 🔹 Públicas
router.get("/", getRaffles);
router.get("/:id", getRaffleById);

// 🔹 Admin/CRUD
router.post("/", verifyToken, createRaffle);
router.put("/:id", verifyToken, updateRaffle);
router.put("/:id/desativar", verifyToken, deactivateRaffle);

// 🔹 Números (público: usuário pode reservar antes de pagar)
router.post("/:id/generate", generateNumbers);
router.post("/:id/reserve", reserveNumbers);

export default router;

