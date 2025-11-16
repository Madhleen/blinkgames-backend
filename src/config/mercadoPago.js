// ============================================================
// 💳 BlinkGames — config/mercadoPago.js (v7.2 — Produção Final CORRETA)
// ============================================================

import { MercadoPagoConfig } from "mercadopago";
import dotenv from "dotenv";
dotenv.config();

// ============================================================
// 🔥 Cliente Mercado Pago — SDK v2
// ============================================================
//
// ❗ IMPORTANTE:
// NÃO criar Preference aqui!
// Ela deve ser criada dentro do orderController
// usando: new Preference(client)
//
// Se exportar Preference fixa, quebra o checkout!
// ============================================================

export const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  options: { sandbox: false }, // produção real
});

