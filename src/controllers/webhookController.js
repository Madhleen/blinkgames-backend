// ============================================================
// 📩 BlinkGames — webhookController.js (v8.2 Produção Integrada)
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
      console.log("ℹ️ Ignorando evento que não é pagamento");
      return res.status(200).send("ok");
    }

    // 🔹 Busca pagamento no Mercado Pago
    const payment = await new Payment(client).get({ id });
    const { status, metadata } = payment;
    const userId = metadata?.userId;
    const cart = metadata?.cart || [];

    console.log(`💰 Pagamento ${id} (${status}) | userId: ${userId}`);

    if (!userId) {
      console.warn("⚠️ Nenhum userId recebido no metadata!");
      return res.status(400).json({ error: "Pagamento sem referência de usuário." });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.warn("⚠️ Usuário não encontrado para pagamento aprovado.");
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    // 🔹 Atualiza status da Order
    const order = await Order.findOneAndUpdate(
      { mpPreferenceId: metadata?.preferenceId || payment.order?.id || payment.id },
      { status },
      { new: true }
    );

    if (status === "approved") {
      for (const item of cart) {
        if (!item?.raffleId || !Array.isArray(item?.numeros)) continue;

        // Atualiza rifas vendidas
        await Raffle.findByIdAndUpdate(item.raffleId, {
          $addToSet: { soldNumbers: { $each: item.numeros } },
        });

        // Adiciona compra ao histórico do usuário
        user.purchases.push({
          raffleId: item.raffleId,
          numeros: item.numeros,
          precoUnit: item.precoUnit || item.price || 1,
          paymentId: id,
          date: new Date(),
        });
      }

      await user.save();
      console.log(`✅ Pagamento ${id} aprovado e salvo para ${user.name}`);

      return res.redirect(`${process.env.BASE_URL_FRONTEND}/sucesso.html`);
    }

    if (status === "pending") {
      console.log(`⏳ Pagamento ${id} pendente.`);
      return res.redirect(`${process.env.BASE_URL_FRONTEND}/aguardando.html`);
    }

    if (status === "rejected" || status === "cancelled") {
      console.log(`❌ Pagamento ${id} rejeitado/cancelado.`);
      return res.redirect(`${process.env.BASE_URL_FRONTEND}/erro.html`);
    }

    return res.status(200).send("ok");
  } catch (err) {
    console.error("💥 Erro no webhook:", err);
    return res.status(500).json({ error: "Erro no processamento do webhook." });
  }
};

