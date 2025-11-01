// ============================================================
// 💳 BlinkGames — services/paymentService.js (v5.3 Final)
// ============================================================

import { client } from "../config/mercadoPago.js";
import { Preference, Payment } from "mercadopago";

/**
 * Cria uma preference de pagamento no Mercado Pago
 */
export async function criarPreference(itens, user, metadata) {
  const preference = new Preference(client);

  const response = await preference.create({
    body: {
      items: itens,
      payer: {
        name: user?.nome,
        email: user?.email,
        identification: { type: "CPF", number: user?.cpf },
      },
      metadata,
      back_urls: {
        success: `${process.env.BASE_URL_FRONTEND}/pagamento/sucesso`,
        failure: `${process.env.BASE_URL_FRONTEND}/pagamento/erro`,
        pending: `${process.env.BASE_URL_FRONTEND}/pagamento/pendente`,
      },
      auto_return: "approved",
      notification_url: `${process.env.BASE_URL_BACKEND}/api/webhooks/mercadopago`,
    },
  });

  return response.body;
}

/**
 * Consulta um pagamento pelo ID
 */
export async function buscarPagamento(paymentId) {
  const payment = new Payment(client);
  const response = await payment.get({ id: paymentId });
  return response;
}

/**
 * Verifica o status de um pagamento (approved, pending, rejected)
 */
export async function verificarStatus(paymentId) {
  const payment = await buscarPagamento(paymentId);
  return payment.status;
}

