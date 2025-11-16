// ============================================================
// 📩 BlinkGames — webhookController.js (v10 — Compatível com order v11)
// ============================================================

import Order from "../models/Order.js";
import Raffle from "../models/Raffle.js";
import User from "../models/User.js";
import { client } from "../config/mercadoPago.js";
import { Payment } from "mercadopago";

// ============================================================
// 🔔 Webhook Mercado Pago — Produção
// ============================================================
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
    const prefId = payment.preference_id;
    const metadata = payment.metadata || {};

    console.log(
      `💰 Pagamento ${id} (${status}) | prefId: ${prefId} | metadata.userId: ${metadata.userId}`
    );

    if (!prefId) {
      console.warn("⚠️ Webhook sem preference_id!");
      return res.status(200).send("ok");
    }

    // ============================================================
    // 📦 2. BUSCA ORDER CORRETA E ATUALIZA STATUS
    // ============================================================
    const order = await Order.findOneAndUpdate(
      { mpPreferenceId: prefId },
      { status },
      { new: true }
    );

    if (!order) {
      console.warn("⚠️ Nenhuma Order encontrada para mpPreferenceId:", prefId);
      return res.status(200).send("ok");
    }

    console.log("📦 Order encontrada:", order._id);

    const userId = metadata.userId || order.userId;
    const cart = order.itens || [];

    if (!userId) {
      console.warn("⚠️ Order sem userId associado.");
      return res.status(200).send("ok");
    }

    // ============================================================
    // 👤 3. BUSCA USUÁRIO
    // ============================================================
    const user = await User.findById(userId);
    if (!user) {
      console.warn("⚠️ Usuário não encontrado para userId:", userId);
      return res.status(200).send("ok");
    }

    // ============================================================
    // 🟢 4. PROCESSAMENTO DE APROVADO
    // ============================================================
    if (status === "approved") {
      console.log("🏆 Pagamento aprovado — salvando números...");

      for (const item of cart) {
        if (!item?.raffleId || !Array.isArray(item?.numeros)) continue;

        await Raffle.findByIdAndUpdate(item.raffleId, {
          $addToSet: { soldNumbers: { $each: item.numeros } },
        });

        user.purchases.push({
          raffleId: item.raffleId,
          numeros: item.numeros,
          precoUnit: item.precoUnit || item.price || 1,
          paymentId: id,
          date: new Date(),
        });
      }

      await user.save();

      console.log(`✅ Números adicionados ao usuário ${user.name || user.nome}`);
      return res.status(200).send("ok");
    }

    // ============================================================
    // ⏳ 5. STATUS PENDENTE
    // ============================================================
    if (status === "pending") {
      console.log(`⏳ Pagamento ${id} pendente`);
      return res.status(200).send("ok");
    }

    // ============================================================
    // ❌ 6. STATUS NEGADO/CANCELADO
    // ============================================================
    if (status === "rejected" || status === "cancelled") {
      console.log(`❌ Pagamento ${id} rejeitado/cancelado`);
      return res.status(200).send("ok");
    }

    return res.status(200).send("ok");
  } catch (err) {
    console.error("💥 Erro no webhook:", err);
    return res.status(200).send("ok"); // evita reenvio infinito do MP
  }
};

