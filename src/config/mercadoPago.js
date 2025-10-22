import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import dotenv from "dotenv";

dotenv.config();

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

export { client, Payment, Preference };

