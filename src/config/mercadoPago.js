// ============================================================
// 💳 BlinkGames — Mercado Pago Config (v3.2 corrigido e padronizado)
// ============================================================

import { MercadoPagoConfig, Preference } from "mercadopago";
import dotenv from "dotenv";

dotenv.config();

// 🔹 Cria o cliente global usando o Access Token
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

// 🔹 Exporta a classe Preference (não a instância)
export { client, Preference };

