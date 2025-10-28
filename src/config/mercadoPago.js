// ============================================================
// 💳 BlinkGames — config/mercadoPago.js (versão corrigida)
// ============================================================
import { MercadoPagoConfig, Preference } from "mercadopago";
import dotenv from "dotenv";

dotenv.config();

// 🔹 Cria o cliente global Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

// 🔹 Instância de Preference vinculada ao client
const preference = new Preference(client);

// 🔹 Exportações consistentes com o controller
export { client, preference };

