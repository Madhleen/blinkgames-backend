// ============================================================
// 💳 BlinkGames — webhookController.js (v7.0 FINAL — compatível com checkout atualizado)
// ============================================================

import Order from "../models/Order.js";
import Raffle from "../models/Raffle.js";
import User from "../models/User.js";
import { client } from "../config/mercadoPago.js";
import { Payment } from "mercadopago";

export const handleMercadoPagoWebhook = async (req, res) => {
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const { action, data, type, id } = body;
    const paymentId = data?.id || id;

    if (!paymentId) {
      console.error("⚠️ Webhook recebido sem ID de pagamento:", body);
      return res.status(400).json({ error: "Webhook sem ID de pagamento." });
    }

    console.log(`📩 Webhook recebido — ${action || type} | ID: ${paymentId}`);

    // 🔹 Consulta o pagamento no Mercado Pago
    let payment;
    try {
      payment = await new Payment(client).get({ id: paymentId });
    } catch (err) {
      console.error("⚠️ Erro ao consultar pagamento:", err.message);
      return res.status(400).json({ error: "Falha ao consultar pagamento no Mercado Pago." });
    }

    if (!payment || !payment.id) {
      console.error("❌ Pagamento não encontrado:", paymentId);
      return res.status(404).json({ error: "Pagamento não encontrado." });
    }

    const status = payment.status;
    const metadata = payment.metadata || {};
    const ref = payment.external_reference || metadata.preferenceId || metadata.ref;

    console.log(`💰 Pagamento ${paymentId} (${status}) | Ref: ${ref}`);

    // 🔍 Busca a ordem associada
    const order = await Order.findOne({
      mpPreferenceId: ref,
    });

    if (!order) {
      console.error("❌ Ordem não encontrada para referência:", ref);
      return res.status(404).json({ error: "Ordem não encontrada." });
    }

    // 🔄 Atualiza status da ordem
    order.status = status;
    order.mpPaymentId = paymentId;
    await order.save();

    // 🔹 Se pagamento aprovado, vincula números ao usuário e à rifa
    if (status === "approved" && metadata?.cart && metadata?.userId) {
      const user = await User.findById(metadata.userId);

      if (user) {
        for (const item of metadata.cart) {
          const raffle = await Raffle.findById(item.raffleId);

          if (raffle) {
            // ✅ Usa o campo correto
            raffle.numerosVendidos.push(...(item.numeros || []));
            await raffle.save();
          }

          user.purchases.push({
            raffleId: item.raffleId,
            numeros: item.numeros || [],
            precoUnit: item.price || 0,
            paymentId,
            date: new Date(),
          });
        }

        await user.save();
        console.log(`🎟️ Números adicionados à conta de ${user.email}`);
      }
    }

    console.log(`✅ Webhook processado com sucesso: ${paymentId}`);
    return res.status(200).json({ message: "Webhook processado com sucesso." });
  } catch (err) {
    console.error("💥 Erro inesperado no webhook:", err);
    return res.status(500).json({ error: "Erro ao processar webhook." });
  }
};

