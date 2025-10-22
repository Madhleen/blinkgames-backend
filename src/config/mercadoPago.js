import mercadopago from "mercadopago";
import dotenv from "dotenv";

dotenv.config();

mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

// Exportação padrão — mais segura e compatível
export default mercadopago;

