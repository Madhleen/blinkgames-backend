// ============================================================
// 📬 BlinkGames — routes/webhookRoutes.js (v9.0 — FIX DEFINITIVO MP)
// ============================================================

import express from "express";
import { handleMercadoPagoWebhook } from "../controllers/webhookController.js";

const router = express.Router();

// ============================================================
// 🔔 Webhook Mercado Pago → BlinkGames
// ============================================================
// Aceita QUALQUER tipo de payload que o Mercado Pago mandar.
// Isso evita 404 e garante que o controller sempre será executado.
router.post(
  "/mercadopago",
  express.json({ type: "*/*" }),
  express.urlencoded({ extended: true }),
  handleMercadoPagoWebhook
);

export default router;

