// ============================================================
// 💳 BlinkGames — config/mercadoPago.js (v7.3 ESTÁVEL)
// ============================================================

import { MercadoPagoConfig, Payment } from "mercadopago";
import dotenv from "dotenv";

dotenv.config();

// ============================================================
// 🧩 Inicialização do SDK
// ============================================================
export const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  options: { timeout: 5000 },
});

// ============================================================
// 💰 Exporta classes principais (Payment etc.)
// ============================================================
export { Payment };

// ============================================================
// ✅ Log de confirmação
// ============================================================
console.log("💳 Mercado Pago configurado com sucesso!");

