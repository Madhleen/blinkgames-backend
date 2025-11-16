// ============================================================
// 📩 BlinkGames — webhookController.js (v8.3 SAFE — sem quebrar o resto)
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

    // Só processa pagamentos
    if (topic !== "payment") {
      console.log("ℹ️ Ignorando evento que não é pagamento");
      return res.status(200).send("ok");
    }

    // 🔹 Busca o pagamento no MP
    const payment = await new Payment(client).get({ id });

    const status = payment.status;
    const externalRef = payment.external_reference;
    const metadata = payment.metadata || {};
    const cart = metadata.cart || [];

    // 🔥 Correção: userId vem do external_reference SEMPRE
    const userId = externalRef || metadata.userId;

    console.log(`💰 Pagamento ${id} (${status}) | userId: ${userId}`);

    if (!userId) {
      console.warn("⚠️ userId ausente no external_reference e no metadata");
      return res.status(200).send("ok");
    }

    // 🔹 Busca usuário
    const user = await User.findById(userId);
    if (!user) {
      console.warn("⚠️ Usuário não encontrado para pagamento.");
      return res.status(200).send("ok");
    }

    // 🔥 Correção: Order é identificada pela preferenceId = external_reference
    const order = await Order.findOneAndUpdate(
      { userId, status: "pending" },
      { status },
      { new: true }
    );

    if (!order) {
      console.warn("⚠️ Nenhuma Order pending encontrada para este usuário");
    }

    // ============================================================
    // PROCESSAMENTO DE APROVADO
    // ============================================================
    if (status === "approved") {
      console.log("🏆 Pagamento aprovado — processando números...");

      for (const item of cart) {
        if (!item?.raffleId || !Array.isArray(item?.numeros)) continue;

        // Atualiza rifas
        await Raffle.findByIdAndUpdate(item.raffleId, {
          $addToSet: { soldNumbers: { $each: item.numeros } },
        });

        // Salva no histórico do usuário
        user.purchases.push({
          raffleId: item.raffleId,
          numeros: item.numeros,
          precoUnit: item.precoUnit || item.price || 1,
          paymentId: id,
          date: new Date(),
        });
      }

      await user.save();

      console.log(`✅ Números salvos para ${user.name}`);
      return res.status(200).send("ok");
    }

    // ============================================================
    // STATUS PENDENTE
    // ============================================================
    if (status === "pending") {
      console.log(`⏳ Pagamento ${id} pendente`);
      return res.status(200).send("ok");
    }

    // ============================================================
    // CANCELADO / REJEITADO
    // ============================================================
    if (status === "rejected" || status === "cancelled") {
      console.log(`❌ Pagamento ${id} rejeitado/cancelado`);
      return res.status(200).send("ok");
    }

    return res.status(200).send("ok");
  } catch (err) {
    console.error("💥 Erro no webhook:", err);
    return res.status(200).send("ok"); // evitar retry infinito do MP
  }
};

