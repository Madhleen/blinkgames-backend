// ============================================================
// 💳 BlinkGames — routes/checkoutRoutes.js (v8.3 — Usando checkoutController CORRETO)
// ============================================================

import express from "express";
import { createCheckout } from "../controllers/checkoutController.js"; // ✅ AQUI É O AJUSTE
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/**
 * @route POST /api/checkout
 * @desc Cria um Preference do Mercado Pago
 * @access Privado (Token obrigatório)
 */
router.post("/", verifyToken, createCheckout);

export default router;

