import { MercadoPagoConfig, Preference } from "mercadopago";
import dotenv from "dotenv";

dotenv.config();

// 🔹 Cria o cliente global usando o Access Token
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

// 🔹 Exporta a instância de Preference com o client configurado
const preference = new Preference(client);

export { client, preference };

