// ============================================================
// 🎟️ BlinkGames — routes/raffleRoutes.js (v8.3 Produção Segura e Padronizada)
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

// ============================================================
// 🔹 Rotas públicas (listagem e consulta)
// ============================================================
router.get("/", getRaffles);
router.get("/:id", getRaffleById);

// ============================================================
// 🔹 Admin / CRUD (somente usuários autenticados)
// ============================================================
router.post("/", verifyToken, createRaffle);
router.put("/:id", verifyToken, updateRaffle);
router.put("/:id/desativar", verifyToken, deactivateRaffle);

// ============================================================
// 🔹 Números (geração e reserva temporária)
// ============================================================
// Qualquer usuário pode gerar e reservar números *antes* do pagamento.
// O backend agora não grava a reserva no banco, apenas confirma disponibilidade.
router.post("/:id/generate", generateNumbers);
router.post("/:id/reserve", reserveNumbers);

export default router;

