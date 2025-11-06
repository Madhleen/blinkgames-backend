// ============================================================
// 💳 BlinkGames — routes/checkoutRoutes.js (v7.7 Produção Corrigida FINAL)
// ============================================================

import express from "express";
import { createCheckout } from "../controllers/checkoutController.js";
import { verifyToken } from "../middleware/auth.js"; // ✅ singular

const router = express.Router();

// 🔒 Protege o endpoint — apenas usuários logados podem criar checkout
router.post("/", verifyToken, createCheckout);

export default router;

