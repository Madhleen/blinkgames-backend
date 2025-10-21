import express from "express";
import { createCheckout, getUserOrders } from "../controllers/orderController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// 🔹 Criar checkout (gera preference do Mercado Pago)
router.post("/checkout", authMiddleware, createCheckout);

// 🔹 Listar ordens do usuário logado
router.get("/me", authMiddleware, getUserOrders);

export default router;
