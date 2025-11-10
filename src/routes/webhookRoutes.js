// ============================================================
// 📬 BlinkGames — routes/webhookRoutes.js (v8.1 Produção Segura e Compatível MP)
// ============================================================

import express from "express";
import { handleMercadoPagoWebhook } from "../controllers/webhookController.js";

const router = express.Router();

// ============================================================
// 🔔 Webhook Mercado Pago → BlinkGames
// ============================================================
// ⚠️ Importante: o Mercado Pago envia requisições sem cabeçalho JSON padrão.
// Precisamos garantir que o Express aceite tanto JSON quanto URL-encoded.
router.post(
  "/mercadopago",
  express.json({ type: ["application/json", "text/plain"] }),
  handleMercadoPagoWebhook
);

export default router;

