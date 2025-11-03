// ============================================================
// 💳 BlinkGames — webhookController.js (v6.9 robusto)
// Aceita query (?topic=payment&id=...), aceita JSON,
// casa por external_reference (preferenceId) e faz fallback para a Order.
// ============================================================

import Order from "../models/Order.js";
import Raffle from "../models/Raffle.js";
import User from "../models/User.js";
import { client } from "../config/mercadoPago.js";
import { Payment } from "mercadopago";

export const handleMercadoPagoWebhook = async (req, res) => {
  try {
    // MP pode mandar via querystring OU JSON
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const topic = body?.type || body?.action || req.query?.topic || req.query?.type;
    const idFromBody = body?.data?.id || body?.id;
    const idFromQuery = req.query?.id;
    const paymentId = idFromBody || idFromQuery;

    // Ignoramos merchant_order (não precisamos dele)
    if (String(topic).includes("merchant_order")) {
      return res.status(200).json({ ok: true, ignored: "merchant_order" });
    }

    if (!paymentId) {
      console.error("⚠️ Webhook sem ID:", { body, query: req.query });
      return res.status(400).json({ error: "Webhook sem ID de pagamento." });
    }

    console.log(`📩 Webhook recebido — topic: ${topic || "?"} | ID: ${paymentId}`);

    // Busca pagamento no MP
    let payment;
    try {
      payment = await new Payment(client).get({ id: paymentId });
    } catch (err) {
      console.error("⚠️ Erro ao consultar pagamento no MP:", err.message);
      return res.status(400).json({ error: "Falha ao consultar pagamento no Mercado Pago." });
    }

    if (!payment || !payment.id) {
      console.error("❌ Pagamento não encontrado no MP:", paymentId);
      return res.status(404).json({ error: "Pagamento não encontrado." });
    }

    const status = payment.status;
    const metadata = payment.metadata || {};
    const ref = payment.external_reference || payment.order?.id; // preferenceId (o que atualizamos no checkout)
    console.log(`💰 Pagamento ${paymentId} (${status}) | ext_ref: ${ref}`);

    // Casa a Order pelo preferenceId salvo (ref)
    let order = null;
    if (ref) {
      order = await Order.findOne({ mpPreferenceId: ref });
    }
    // fallback extra: tenta por mpPaymentId
    if (!order) {
      order = await Order.findOne({ mpPaymentId: paymentId });
    }

    if (!order) {
      console.error("❌ Ordem não encontrada para referência:", ref);
      return res.status(404).json({ error: "Ordem não encontrada." });
    }

    // Atualiza status e fixa id real do pagamento
    order.status = status;
    order.mpPaymentId = paymentId;
    await order.save();

    // Se aprovado, grava na rifa e no usuário
    if (status === "approved") {
      const userId = metadata.userId || order.userId; // fallback se metadata não veio
      const items =
        (Array.isArray(metadata.cart) && metadata.cart.length ? metadata.cart : order.cart) || [];

      if (!userId) {
        console.warn("⚠️ Sem userId para registrar compra. Order:", order._id);
      } else {
        const user = await User.findById(userId);
        if (user) {
          for (const item of items) {
            // atualiza rifa
            if (item.raffleId) {
              const raffle = await Raffle.findById(item.raffleId);
              if (raffle) {
                const nums = Array.isArray(item.numeros) ? item.numeros : [];
                raffle.numerosVendidos.push(...nums);
                await raffle.save();
              }
            }
            // registra no histórico do usuário
            user.purchases.push({
              raffleId: item.raffleId,
              numeros: Array.isArray(item.numeros) ? item.numeros : [],
              precoUnit: Number(item.price) || Number(item.precoUnit) || 0,
              paymentId: String(paymentId),
              date: new Date(),
            });
          }
          await user.save();
          console.log(`🎟️ Compras vinculadas ao usuário ${user.email} (order ${order._id})`);
        } else {
          console.warn("⚠️ Usuário não encontrado para userId:", userId);
        }
      }
    }

    console.log(`✅ Webhook OK — pagamento ${paymentId} (${status})`);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("💥 Erro inesperado no webhook:", err);
    return res.status(500).json({ error: "Erro ao processar webhook." });
  }
};

