import express from "express";
import {
  getRaffles,
  getRaffleById,
  createRaffle,
  updateRaffle,
  deactivateRaffle,
  generateNumbers,
} from "../controllers/raffleController.js";

import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";

const router = express.Router();

// 🔹 Rotas públicas
router.get("/", getRaffles);
router.get("/:id", getRaffleById);

// 🔹 Rotas autenticadas e administrativas
router.post("/", authMiddleware, adminMiddleware, createRaffle);
router.put("/:id", authMiddleware, adminMiddleware, updateRaffle);
router.put("/:id/deactivate", authMiddleware, adminMiddleware, deactivateRaffle);

// 🔹 Gerar números disponíveis (usuário logado)
router.post("/:id/generate", authMiddleware, generateNumbers);

export default router;
