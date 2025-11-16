// ============================================================
// 📩 BlinkGames — webhookController.js (v11 FINAL — Compatível c/ checkout v15)
// ============================================================

import Order from "../models/Order.js";
import Raffle from "../models/Raffle.js";
import User from "../models/User.js";
import { client } from "../config/mercadoPago.js";
import { Payment } from "mercadopago";

export const handleMercadoPagoWebhook = async (req, res) => {
  try {
    const topic = req.query.topic || req.body.type;
    const id = req.query.id || req.body.data?.id;

    if (!topic || !id) {
      return res.status(400).json({ error: "Webhook inválido." });
    }

    console.log(`📩 Webhook recebido — topic: ${topic} | ID: ${id}`);

    if (topic !== "payment") {
      console.log("ℹ️ Ignorando evento que não é pagamento");
      return res.status(200).send("ok");
    }

    // ============================================================
    // 🧾 1. BUSCA PAGAMENTO
    // ============================================================
    const payment = await new Payment(client).get({ id });

    const status = payment.status;
    const prefId = payment.preference_id || payment.external_reference;
    const metadata = payment.metadata || {};

    console.log(
      `💰 Pagamento ${id} (${status}) | prefId: ${prefId} | metadata.userId: ${metadata.userId}`
    );

    if (!prefId) {
      console.warn("⚠️ Webhook sem preference_id!");
      return res.status(200).send("ok");
    }

    // ============================================================
    // 📦 2. BUSCA ORDER CORRETA
    // ============================================================
    const order = await Order.findOneAndUpdate(
      { mpPreferenceId: prefId },
      { status },
      { new: true }
    );

    if (!order) {
      console.warn("⚠️ Order não encontrada para:", prefId);
      return res.status(200).send("ok");
    }

    console.log("📦 Order encontrada:", order._id);

    // cart correto:
    const cart = metadata.cart || order.cart || [];

    const userId = metadata.userId || order.userId;

    if (!userId) {
      console.warn("⚠️ Webhook sem userId");
      return res.status(200).send("ok");
    }

    const user = await User.findById(userId);
    if (!user) {
      console.warn("⚠️ Usuário não encontrado:", userId);
      return res.status(200).send("ok");
    }

    // ============================================================
    // 🟢 3. PROCESSA APROVADO
    // ============================================================
    if (status === "approved") {
      console.log("🏆 Pagamento aprovado — salvando números...");

      for (const item of cart) {
        const { raffleId, numeros, precoUnit } = item;

        if (!raffleId || !Array.isArray(numeros)) continue;

        // salva na rifa
        await Raffle.findByIdAndUpdate(raffleId, {
          $addToSet: { soldNumbers: { $each: numeros } }
        });

        // salva no usuário
        user.purchases.push({
          raffleId,
          numeros,
          precoUnit: precoUnit || item.price || 1,
          paymentId: id,
          date: new Date(),
        });
      }

      await user.save();

      console.log("✅ Números associados com sucesso.");
      return res.status(200).send("ok");
    }

    // ============================================================
    // ⏳ PENDENTE
    // ============================================================
    if (status === "pending") {
      console.log(`⏳ Pagamento ${id} pendente`);
      return res.status(200).send("ok");
    }

    // ============================================================
    // ❌ NEGADO/CANCELADO
    // ============================================================
    if (["rejected", "cancelled"].includes(status)) {
      console.log(`❌ Pagamento ${id} rejeitado/cancelado`);
      return res.status(200).send("ok");
    }

    return res.status(200).send("ok");

  } catch (err) {
    console.error("💥 Erro no webhook:", err);
    return res.status(200).send("ok");
  }
};

