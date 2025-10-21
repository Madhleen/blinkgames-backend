import { mercadopagoClient } from "../config/mercadoPago.js";

/**
 * Cria uma preference de pagamento no Mercado Pago
 */
export async function criarPreference(itens, user, metadata) {
  const preference = await mercadopagoClient.preferences.create({
    items: itens,
    payer: {
      name: user.nome,
      email: user.email,
      identification: { type: "CPF", number: user.cpf },
    },
    metadata,
    back_urls: {
      success: `${process.env.BASE_URL_FRONTEND}/pagamento/sucesso`,
      failure: `${process.env.BASE_URL_FRONTEND}/pagamento/erro`,
      pending: `${process.env.BASE_URL_FRONTEND}/pagamento/pendente`,
    },
    auto_return: "approved",
    notification_url: `${process.env.BASE_URL_BACKEND}/api/webhooks/mercadopago`,
  });
  return preference;
}

/**
 * Consulta um pagamento pelo ID
 */
export async function buscarPagamento(paymentId) {
  const payment = await mercadopagoClient.payment.findById(paymentId);
  return payment.body;
}

/**
 * Verifica o status de um pagamento (approved, pending, rejected)
 */
export async function verificarStatus(paymentId) {
  const payment = await buscarPagamento(paymentId);
  return payment.status;
}
