// ============================================================
// 💳 BlinkGames — routes/checkoutRoutes.js (v7.5 Produção Corrigida)
// ============================================================

import express from "express";
import { createCheckout } from "../controllers/checkoutController.js";
import { verifyToken } from "../middlewares/auth.js"; // ✅ Caminho corrigido (middlewares no plural)

const router = express.Router();

// 🔒 Protege o endpoint — apenas usuários logados podem criar checkout
router.post("/", verifyToken, createCheckout);

export default router;

