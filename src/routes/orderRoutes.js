// ============================================================
// 🧾 BlinkGames — routes/orderRoutes.js (v8.2 Corrigido 2025)
// ============================================================

import express from "express";
import { getUserOrders } from "../controllers/orderController.js";
import { createCheckout } from "../controllers/checkoutController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// ============================================================
// 💳 Criar pedido (checkout)
// ============================================================
// Agora o checkout REAL vem do checkoutController.js
router.post("/", verifyToken, createCheckout);

// ============================================================
// 📦 Buscar pedidos do usuário logado
// ============================================================
router.get("/my", verifyToken, getUserOrders);

export default router;

