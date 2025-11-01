// ============================================================
// 💳 BlinkGames — config/mercadoPago.js (v6.0 funcional)
// ============================================================

import { MercadoPagoConfig, Preference } from "mercadopago";
import dotenv from "dotenv";

dotenv.config();

// ✅ Cria o client Mercado Pago com o token do .env
export const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

// ✅ Instancia Preference corretamente (sem objeto dentro)
export const preference = new Preference(client);

