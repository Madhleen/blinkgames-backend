// ============================================================
// 💳 BlinkGames — config/mercadoPago.js (v7.1 — Produção Final)
// ============================================================

import { MercadoPagoConfig, Preference } from "mercadopago";
import dotenv from "dotenv";
dotenv.config();

// ✅ Cliente configurado para PRODUÇÃO
export const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  options: { sandbox: false }, // 🚀 produção real
});

// ✅ Exporta instância de Preference (necessária no checkoutController)
export const preference = new Preference(client);

