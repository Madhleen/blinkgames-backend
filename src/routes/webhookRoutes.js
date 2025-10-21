import express from "express";
import { handleMercadoPagoWebhook } from "../controllers/webhookController.js";

const router = express.Router();

// 🔹 Rota pública para o Mercado Pago enviar notificações
router.post("/mercadopago", handleMercadoPagoWebhook);

export default router;
