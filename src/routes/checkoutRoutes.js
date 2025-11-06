// ============================================================
// 💳 BlinkGames — routes/checkoutRoutes.js (v7.6 Produção Final Corrigida)
// ============================================================

import express from "express";
import { createCheckout } from "../controllers/checkoutController.js";
import { verifyToken } from "../middleware/auth.js"; // ✅ Caminho corrigido (pasta singular)

// 🔧 Cria o router
const router = express.Router();

// 🔒 Protege o endpoint — apenas usuários autenticados podem criar checkout
router.post("/", verifyToken, createCheckout);

// 🚀 Exporta o router
export default router;

