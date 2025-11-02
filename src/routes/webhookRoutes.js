// ============================================================
// 💳 BlinkGames — webhookRoutes.js (v6.4 Final Seguro)
// ============================================================

import express from "express";
import { handleMercadoPagoWebhook } from "../controllers/webhookController.js";

const router = express.Router();

// 🔹 Rota pública oficial do Mercado Pago (POST)
router.post("/mercadopago", handleMercadoPagoWebhook);

// 🔸 Rota GET opcional — útil pra testar no navegador
router.get("/mercadopago", (req, res) => {
  res.status(200).json({ message: "✅ Webhook ativo e pronto para receber POST do Mercado Pago." });
});

// 🔸 Rota catch-all (opcional) — evita 404 silencioso
router.all("*", (req, res) => {
  res.status(405).json({ error: "Método não permitido para este endpoint." });
});

export default router;

