// ============================================================
// 🧾 BlinkGames — routes/orderRoutes.js (v8.0 Produção)
// ============================================================

import express from "express";
import { createCheckout, getUserOrders } from "../controllers/orderController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// 🔹 Criar pedido (checkout)
router.post("/checkout", verifyToken, createCheckout);

// 🔹 Consultar pedidos do usuário autenticado
router.get("/me", verifyToken, getUserOrders);

export default router;

