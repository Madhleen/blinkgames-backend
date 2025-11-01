// ============================================================
// 💳 BlinkGames — config/mercadoPago.js (v5.2 Final)
// ============================================================

import { MercadoPagoConfig, Preference } from "mercadopago";
import dotenv from "dotenv";

dotenv.config();

// ✅ Configura o cliente Mercado Pago
export const mercadopagoClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

// ✅ Cria a instância de Preference (nova SDK exige isso)
export const preference = new Preference({ client: mercadopagoClient });

