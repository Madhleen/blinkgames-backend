// ============================================================
// 🎯 BlinkGames — routes/raffleRoutes.js (v7.6 Produção Final)
// ============================================================

import express from "express";
import {
  getRaffles,         // ✅ nome correto
  getRaffleById,
  createRaffle,
  updateRaffle,
  deactivateRaffle,
  deleteRaffle,
  generateNumbers,
} from "../controllers/raffleController.js";

import { verifyToken } from "../middlewares/auth.js"; // ✅ caminho correto

const router = express.Router();

// 🔹 Listar rifas
router.get("/", getRaffles);

// 🔹 Obter uma rifa específica
router.get("/:id", getRaffleById);

// 🔹 Criar rifa (somente admin)
router.post("/", verifyToken, createRaffle);

// 🔹 Atualizar rifa (somente admin)
router.put("/:id", verifyToken, updateRaffle);

// 🔹 Desativar rifa (somente admin)
router.patch("/:id/desativar", verifyToken, deactivateRaffle);

// 🔹 Excluir rifa (somente admin)
router.delete("/:id", verifyToken, deleteRaffle);

// 🔹 Gerar números disponíveis antes da compra
router.post("/:id/generate", generateNumbers);

export default router;

