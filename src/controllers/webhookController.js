// ============================================================
// 💳 BlinkGames — webhookController.js (v6.5 Final Compatível MP)
// ============================================================

import Order from "../models/Order.js";
import Raffle from "../models/Raffle.js";
import User from "../models/User.js";
import { client } from "../config/mercadoPago.js";
import { Payment } from "mercadopago";

// ============================================================
// 📬 Recebe notificações do Mercado Pago (webhook)
// ============================================================
export const handleMercadoPagoWebhook = async (req, res) => {
  try {
    // 🧩 Garante que o corpo seja JSON válido
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const { action, data, type, id } = body;

    const paymentId = data?.id || id;
    if (!paymentId) {
      console.error("⚠️ Webhook recebido sem paymentId válido:", body);
      return res.status(400).json({ error: "Webhook sem ID de pagamento." });
    }

    console.log(`📩 Webhook recebido — action: ${action || type}, ID: ${paymentId}`);

    // 🔹 Busca o pagamento no Mercado Pago
    let payment;
    try {
      payment = await new Payment(client).get({ id: paymentId });
    } catch (err) {
      console.error("⚠️ Erro ao buscar pagamento no Mercado Pago:", err.message);
      return res.status(400).json({ error: "Falha ao consultar pagamento no Mercado Pago." });
    }

    if (!payment || !payment.id) {
      console.error("❌ Pagamento não encontrado no Mercado Pago:", paymentId);
      return res.status(404).json({ error: "Pagamento não encontrado." });
    }

    const status = payment.status;
    const metadata = payment.metadata || {};
    console.log(`💰 Pagamento ${paymentId} status: ${status}`);

    // 🔍 Busca a ordem relacionada usando external_reference ou order.id
    const order = await Order.findOne({
      mpPreferenceId: payment.external_reference || payment.order?.id
    });

    if (!order) {
      console.error("❌ Ordem não encontrada:", payment.external_reference || payment.order?.id);
      return res.status(404).json({ error: "Ordem não encontrada." });
    }

    // Atualiza status
    order.status = status;
    order.mpPaymentId = paymentId;
    await order.save();

    // 🔹 Se aprovado, salva dados na rifa e no usuário
    if (status === "approved" && metadata?.cart && metadata?.userId) {
      const user = await User.findById(metadata.userId);

      if (user) {
        for (const item of metadata.cart) {
          const rifa = await Raffle.findById(item.raffleId);
          if (rifa) {
            rifa.numerosVendidos.push(...item.numeros);
            await rifa.save();
          }

          user.purchases.push({
            raffleId: item.raffleId,
            numeros: item.numeros,
            precoUnit: item.precoUnit,
            paymentId,
            date: new Date(),
          });
        }

        await user.save();
      }
    }

    console.log(`✅ Webhook processado com sucesso — pagamento ${paymentId} (${status})`);
    return res.status(200).json({ message: "Webhook processado com sucesso." });
  } catch (err) {
    console.error("💥 Erro inesperado no webhook:", err);
    return res.status(500).json({ error: "Erro ao processar webhook." });
  }
};

