// ============================================================
// 💳 BlinkGames — config/mercadoPago.js (PROD)
// ============================================================
import { MercadoPagoConfig, Preference } from "mercadopago";
import dotenv from "dotenv";
dotenv.config();

// Cliente Mercado Pago em PRODUÇÃO
export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  options: { sandbox: false },
});

// Instância de Preference usando o client acima
export const preference = new Preference(mpClient);

