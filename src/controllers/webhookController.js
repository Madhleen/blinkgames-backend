// ============================================================
// 📩 BlinkGames — webhookController.js (v9.0 — COMPATÍVEL com order v9.0)
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

    if (!topic || !id) return res.status(400).json({ error: "Webhook inválido." });
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
    const prefId = payment.preference_id;      // 🔥 chave correta
    const metadata = payment.metadata || {};

    const userId = metadata.userId;
    const cart = metadata.cart || [];

    console.log(`💰 Pagamento ${id} (${status}) | userId: ${userId} | prefId: ${prefId}`);

    if (!userId || !prefId) {
      console.warn("⚠️ Webhook sem userId OU preference_id!");
      return res.status(200).send("ok");
    }

    // ============================================================
    // 👤 2. BUSCA USUÁRIO
    // ============================================================
    const user = await User.findById(userId);
    if (!user) {
      console.warn("⚠️ Usuário não encontrado.");
      return res.status(200).send("ok");
    }

    // ============================================================
    // 📦 3. BUSCA ORDER CORRETA
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

    // ============================================================
    // 🟢 4. PROCESSAMENTO DE APROVADO
    // ============================================================
    if (status === "approved") {
      console.log("🏆 Pagamento aprovado — salvando números...");

      for (const item of cart) {
        if (!item?.raffleId || !Array.isArray(item?.numeros)) continue;

        // 👉 Atualiza a rifa
        await Raffle.findByIdAndUpdate(item.raffleId, {
          $addToSet: { soldNumbers: { $each: item.numeros } },
        });

        // 👉 Adiciona no histórico do usuário
        user.purchases.push({
          raffleId: item.raffleId,
          numeros: item.numeros,
          precoUnit: item.precoUnit || item.price || 1,
          paymentId: id,
          date: new Date(),
        });
      }

      await user.save();

      console.log(`✅ Números adicionados a ${user.name}`);
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

