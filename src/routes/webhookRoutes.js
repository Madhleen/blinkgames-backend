// ============================================================
// 📬 BlinkGames — routes/webhookRoutes.js (v8.0 Produção)
// ============================================================

import express from "express";
import { handleMercadoPagoWebhook } from "../controllers/webhookController.js";

const router = express.Router();

// 🔹 Webhook de pagamento (Mercado Pago → BlinkGames)
router.post("/payment", handleMercadoPagoWebhook);

export default router;

