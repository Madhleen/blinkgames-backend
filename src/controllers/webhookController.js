// ============================================================
// 💳 BlinkGames — webhookController.js (v4.2 corrigido)
// ============================================================

import Order from "../models/Order.js";
import Raffle from "../models/Raffle.js";
import User from "../models/User.js";
import { mercadopagoClient } from "../config/mercadoPago.js";
import { Payment } from "mercadopago"; // ✅ SDK oficial

// ============================================================
// 📬 Recebe notificações do Mercado Pago (webhook)
// ============================================================
export const handleMercadoPagoWebhook = async (req, res) => {
  try {
    const { action, data } = req.body;

    // Ignora eventos irrelevantes
    if (action !== "payment.created" && action !== "payment.updated") {
      console.log("ℹ️ Evento ignorado:", action);
      return res.status(200).json({ message: "Evento ignorado." });
    }

    const paymentId = data.id;
    console.log(`📩 Webhook recebido: ${action} (ID: ${paymentId})`);

    // ✅ Busca o pagamento com o SDK novo
    const payment = await new Payment(mercadopagoClient).get({ id: paymentId });

    if (!payment || !payment.id) {
      console.error("❌ Pagamento não encontrado no Mercado Pago:", paymentId);
      return res.status(404).json({ error: "Pagamento não encontrado." });
    }

    const status = payment.status;
    const metadata = payment.metadata || {};
    console.log(`💰 Pagamento ${paymentId} status: ${status}`);

    // 🔍 Encontra a ordem vinculada
    const order = await Order.findOne({ mpPreferenceId: payment.order?.id });
    if (!order) {
      console.error("❌ Ordem não encontrada:", payment.order?.id);
      return res.status(404).json({ error: "Ordem não encontrada." });
    }

    // 🔄 Atualiza status da ordem
    order.status = status;
    order.mpPaymentId = paymentId;
    await order.save();

    // ✅ Se o pagamento foi aprovado, vincula números ao usuário e rifa
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
    res.status(200).json({ message: "Webhook processado com sucesso." });
  } catch (err) {
    console.error("💥 Erro no webhook:", err);
    res.status(500).json({ error: "Erro ao processar webhook." });
  }
};

