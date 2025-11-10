// ============================================================
// 🧾 BlinkGames — routes/orderRoutes.js (v8.1 Produção Integrada)
// ============================================================

import express from "express";
import { createCheckout, getUserOrders } from "../controllers/orderController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// ============================================================
// 💳 Criar pedido (checkout)
// ============================================================
router.post("/", verifyToken, createCheckout); // ✅ mantém compatível com /api/orders no CheckoutAPI

// ============================================================
// 📦 Buscar pedidos do usuário logado
// ============================================================
// ✅ compatível com OrdersAPI.getMyOrders(token)
router.get("/my", verifyToken, getUserOrders);

export default router;

