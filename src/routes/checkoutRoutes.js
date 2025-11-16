// ============================================================
// 💳 BlinkGames — routes/checkoutRoutes.js (v8.1 — Correção Final)
// ============================================================

import express from "express";
import { createCheckout } from "../controllers/orderController.js"; // ✅ CORRIGIDO
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// 🔒 Usuário precisa estar autenticado
router.post("/", verifyToken, createCheckout);

export default router;

