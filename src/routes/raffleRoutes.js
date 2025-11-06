// ============================================================
// 🎟️ BlinkGames — routes/raffleRoutes.js (v7.6 Produção Corrigida)
// ============================================================

import express from "express";
import {
  getAllRaffles,
  getRaffleById,
  createRaffle,
  updateRaffle,
  deleteRaffle,
} from "../controllers/raffleController.js";
import { verifyToken } from "../middleware/auth.js"; // ✅ Caminho corrigido (singular)

const router = express.Router();

// 🔹 Rotas públicas
router.get("/", getAllRaffles);
router.get("/:id", getRaffleById);

// 🔒 Rotas protegidas — apenas admins logados
router.post("/", verifyToken, createRaffle);
router.put("/:id", verifyToken, updateRaffle);
router.delete("/:id", verifyToken, deleteRaffle);

export default router;

