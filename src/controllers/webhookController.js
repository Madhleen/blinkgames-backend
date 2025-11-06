// ============================================================
// 📩 BlinkGames — webhookController.js (v7.3 Produção Final)
// ============================================================

import Order from "../models/Order.js";
import Raffle from "../models/Raffle.js";
import User from "../models/User.js";
import { client } from "../config/mercadoPago.js";
import { Payment } from "mercadopago";

// ============================================================
// 🔔 Webhook Mercado Pago — produção
// ============================================================
export const handleMercadoPagoWebhook = async (req, res) => {
  try {
    const topic = req.query.topic || req.body.type;
    const id = req.query.id || req.body.data?.id;
    if (!topic || !id) return res.status(400).json({ error: "Webhook inválido." });

    console.log(`📩 Webhook recebido — topic: ${topic} | ID: ${id}`);

    if (topic !== "payment") {
      console.log("ℹ️ Ignorando merchant_order (não é pagamento)");
      return res.status(200).send("ok");
    }

    const payment = await new Payment(client).get({ id });
    const { status, external_reference, metadata } = payment;
    const userId = external_reference;
    const cart = metadata?.cart || [];

    console.log(`💰 Pagamento ${id} (${status}) | userId: ${userId}`);

    if (status !== "approved") {
      console.log("ℹ️ Pagamento ainda não aprovado — ignorando.");
      return res.status(200).send("pending");
    }

    // 🔍 Busca usuário
    const user = await User.findById(userId);
    if (!user) {
      console.warn("⚠️ Pagamento aprovado mas sem usuário logado — ignorando registro.");
      return res.status(400).json({ error: "Usuário não encontrado." });
    }

    // 🔍 Atualiza status da Order
    const order = await Order.findOneAndUpdate(
      { preferenceId: payment.order?.id || payment.id },
      { status: "approved" },
      { new: true }
    );

    // 🔹 Atualiza rifas vendidas
    for (const item of cart) {
      await Raffle.findByIdAndUpdate(item.raffleId, {
        $push: { soldNumbers: { $each: item.numeros, user: userId } },
      });
    }

    // 🔹 Adiciona compra ao histórico do usuário
    user.purchases.push({
      paymentId: id,
      items: cart,
      total: payment.transaction_amount,
    });
    await user.save();

    console.log(`✅ Pagamento ${id} processado com sucesso para ${user.name}`);
    return res.status(200).send("approved");
  } catch (err) {
    console.error("💥 Erro inesperado no webhook:", err);
    return res.status(500).json({ error: "Erro no processamento do webhook." });
  }
};

