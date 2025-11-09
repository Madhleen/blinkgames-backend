// ============================================================
// 📩 BlinkGames — webhookController.js (v8.0 Produção Final Corrigido)
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

    if (!topic || !id)
      return res.status(400).json({ error: "Webhook inválido." });

    console.log(`📩 Webhook recebido — topic: ${topic} | ID: ${id}`);

    if (topic !== "payment") {
      console.log("ℹ️ Ignorando evento que não é pagamento");
      return res.status(200).send("ok");
    }

    // 🔹 Busca pagamento no Mercado Pago
    const payment = await new Payment(client).get({ id });
    const { status, external_reference, metadata } = payment;
    const userId = external_reference;
    const cart = metadata?.cart || [];

    console.log(`💰 Pagamento ${id} (${status}) | userId: ${userId}`);

    // 🔹 Busca usuário
    const user = await User.findById(userId);
    if (!user) {
      console.warn("⚠️ Usuário não encontrado para pagamento aprovado.");
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    // 🔹 Atualiza status da Order
    await Order.findOneAndUpdate(
      { preferenceId: payment.order?.id || payment.id },
      { status },
      { new: true }
    );

    if (status === "approved") {
      // 🔹 Atualiza rifas vendidas
      for (const item of cart) {
        await Raffle.findByIdAndUpdate(item.raffleId, {
          $addToSet: { soldNumbers: { $each: item.numeros } },
        });

        // 🔹 Adiciona compra ao histórico do usuário
        user.purchases.push({
          raffleId: item.raffleId,
          numeros: item.numeros,
          precoUnit: item.price,
          paymentId: id,
          date: new Date(),
        });
      }

      await user.save();

      console.log(`✅ Pagamento ${id} aprovado e salvo para ${user.name}`);
      return res.redirect("https://blinkgames-frontend.vercel.app/sucesso.html");
    }

    if (status === "pending") {
      console.log(`⏳ Pagamento ${id} pendente.`);
      return res.redirect("https://blinkgames-frontend.vercel.app/aguardando.html");
    }

    if (status === "rejected" || status === "cancelled") {
      console.log(`❌ Pagamento ${id} rejeitado/cancelado.`);
      return res.redirect("https://blinkgames-frontend.vercel.app/erro.html");
    }

    return res.status(200).send("ok");
  } catch (err) {
    console.error("💥 Erro no webhook:", err);
    return res.status(500).json({ error: "Erro no processamento do webhook." });
  }
};

