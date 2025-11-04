// ============================================================
// 💳 BlinkGames — webhookController.js (v7.1 Final Revisado)
// Corrigido: busca flexível (userId ou preferenceId), logs otimizados
// ============================================================

import Order from "../models/Order.js";
import Raffle from "../models/Raffle.js";
import User from "../models/User.js";
import { client } from "../config/mercadoPago.js";
import { Payment } from "mercadopago";

export const handleMercadoPagoWebhook = async (req, res) => {
  try {
    // 🔹 Aceita querystring e corpo JSON
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const topic = body?.type || body?.action || req.query?.topic || req.query?.type;
    const idFromBody = body?.data?.id || body?.id;
    const idFromQuery = req.query?.id;
    const paymentId = idFromBody || idFromQuery;

    // Ignora notificações que não sejam pagamento
    if (String(topic).includes("merchant_order")) {
      console.log("ℹ️ Ignorando merchant_order (não é pagamento)");
      return res.status(200).json({ ignored: true });
    }

    if (!paymentId) {
      console.error("⚠️ Webhook sem ID de pagamento:", { body, query: req.query });
      return res.status(400).json({ error: "Webhook sem ID de pagamento." });
    }

    console.log(`📩 Webhook recebido — topic: ${topic || "?"} | ID: ${paymentId}`);

    // 🔹 Consulta o pagamento real no MP
    let payment;
    try {
      payment = await new Payment(client).get({ id: paymentId });
    } catch (err) {
      console.error("⚠️ Falha ao consultar pagamento no Mercado Pago:", err.message);
      return res.status(400).json({ error: "Falha ao consultar pagamento no Mercado Pago." });
    }

    if (!payment || !payment.id) {
      console.error("❌ Pagamento não encontrado:", paymentId);
      return res.status(404).json({ error: "Pagamento não encontrado." });
    }

    const status = payment.status;
    const metadata = payment.metadata || {};
    const ref = payment.external_reference || payment.order?.id;

    console.log(`💰 Pagamento ${paymentId} (${status}) | external_reference: ${ref}`);

    // 🔹 Busca a ordem (agora aceita tanto preferenceId quanto userId)
    let order = await Order.findOne({
      $or: [
        { mpPreferenceId: ref },
        { userId: ref },
        { mpPaymentId: paymentId },
      ],
    });

    if (!order) {
      console.error("❌ Nenhuma ordem encontrada para referência:", ref);
      return res.status(404).json({ error: "Ordem não encontrada." });
    }

    // 🔄 Atualiza status e ID real do pagamento
    order.status = status;
    order.mpPaymentId = paymentId;
    await order.save();

    // 🔹 Processa rifas apenas se aprovado
    if (status === "approved") {
      const userId = metadata.userId || order.userId;
      const cart = Array.isArray(metadata.cart) && metadata.cart.length ? metadata.cart : order.cart;

      if (!userId) {
        console.warn("⚠️ Pagamento aprovado, mas sem userId associado!");
      } else {
        const user = await User.findById(userId);
        if (!user) {
          console.warn("⚠️ Usuário não encontrado:", userId);
        } else {
          for (const item of cart) {
            const raffle = await Raffle.findById(item.raffleId);
            if (raffle) {
              const numeros = Array.isArray(item.numeros) ? item.numeros : [];
              raffle.numerosVendidos = [...new Set([...raffle.numerosVendidos, ...numeros])];
              await raffle.save();
            }

            user.purchases.push({
              raffleId: item.raffleId,
              numeros: Array.isArray(item.numeros) ? item.numeros : [],
              precoUnit: Number(item.price) || Number(item.precoUnit) || 0,
              paymentId,
              date: new Date(),
            });
          }

          await user.save();
          console.log(`🎟️ Rifas registradas com sucesso para ${user.email}`);
        }
      }
    }

    console.log(`✅ Webhook processado — pagamento ${paymentId} (${status})`);
    return res.status(200).json({ ok: true, status });
  } catch (err) {
    console.error("💥 Erro inesperado no webhook:", err);
    return res.status(500).json({ error: "Erro ao processar webhook." });
  }
};

