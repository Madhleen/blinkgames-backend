// ============================================================
// 💳 BlinkGames — config/mercadoPago.js (v4.0 compatível)
// ============================================================
import { MercadoPagoConfig, Preference } from "mercadopago";
import dotenv from "dotenv";

dotenv.config();

// 🔹 Configura o client Mercado Pago
export const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

// 🔹 Cria uma instância da Preference (necessário na SDK nova)
export const preference = new Preference(client);

