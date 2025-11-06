// ============================================================
// 💳 BlinkGames — routes/checkoutRoutes.js (v7.4 Produção Corrigida)
// ============================================================

import express from "express";
import { createCheckout } from "../controllers/checkoutController.js";
import { verifyToken } from "../middleware/auth.js"; // ✅ Caminho corrigido (pasta singular)

const router = express.Router();

// 🔒 Criação de checkout protegida — só usuários autenticados podem prosseguir
router.post("/", verifyToken, createCheckout);

export default router;

