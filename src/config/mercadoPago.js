// ============================================================
// 💳 BlinkGames — config/mercadoPago.js (v6.1 produção real)
// ============================================================

import { MercadoPagoConfig, Preference } from "mercadopago";
import dotenv from "dotenv";
dotenv.config();

// ✅ Client configurado para AMBIENTE DE PRODUÇÃO
export const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  options: {
    sandbox: false, // 🚀 PRODUÇÃO REAL
  },
});

// ✅ Instancia Preference com client ativo
export const preference = new Preference(client);

