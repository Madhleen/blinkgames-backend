import express from "express";
import { createCheckout, getUserOrders } from "../controllers/orderController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

/**
 * @route POST /api/order/checkout
 * @desc Cria uma preferência de pagamento no Mercado Pago
 * @access Privado (usuário autenticado)
 */
router.post("/checkout", authMiddleware, createCheckout);

/**
 * @route GET /api/order/me
 * @desc Retorna todas as ordens do usuário autenticado
 * @access Privado (usuário autenticado)
 */
router.get("/me", authMiddleware, getUserOrders);

export default router;

