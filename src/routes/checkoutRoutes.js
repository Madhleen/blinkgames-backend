// ============================================================
// 💳 BlinkGames — routes/checkoutRoutes.js (v7.3 Produção Final)
// ============================================================

import express from "express";
import { createCheckout } from "../controllers/checkoutController.js";
import { verifyToken } from "../middlewares/auth.js"; // ⬅️ middleware de autenticação

const router = express.Router();

// 🔒 Só cria checkout se o usuário estiver logado
router.post("/", verifyToken, createCheckout);

export default router;

