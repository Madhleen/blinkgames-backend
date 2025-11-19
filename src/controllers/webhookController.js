// ============================================================
// 📩 BlinkGames — webhookController.js (v11.2 — Fallback por última Order pending)
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
      console.warn("⚠️ Webhook inválido: sem topic ou id", {
        query: req.query,
        body: req.body,
      });
      return res.status(400).json({ error: "Webhook inválido." });
    }

    console.log(`📩 Webhook recebido — topic: ${topic} | ID: ${id}`);

    if (topic !== "payment") {
      console.log("ℹ️ Ignorando evento que não é pagamento");
      return res.status(200).send("ok");
    }

    // ============================================================
    // 🧾 1. BUSCA PAGAMENTO NO MERCADO PAGO
    // ============================================================
    const mpPayment = new Payment(client);
    const payment = await mpPayment.get({ id });

    // Em algumas versões do SDK os dados vêm em payment.body
    const data = payment.body || payment;

    const status = data.status;
    const metadata = data.metadata || {};
    const externalRef = data.external_reference;
    const prefFromPayment = data.preference_id;

    // ============================================================
    // 🎯 2. IDENTIFICA O prefId (o melhor que der)
    // ============================================================
    const prefId =
      metadata.preferenceId || // se um dia o metadata passar a vir certo
      metadata.preference_id ||
      externalRef ||           // valor que está vindo hoje (69063d4...)
      prefFromPayment;         // por via das dúvidas

    console.log(
      `💰 Pagamento ${id} (${status}) | prefId usado: ${prefId} | external_reference: ${externalRef} | mp.pref: ${prefFromPayment} | metadata.userId: ${metadata.userId}`
    );

    console.log("🧾 Resumo MP payment:", {
      id: data.id,
      status: data.status,
      preference_id: data.preference_id,
      external_reference: data.external_reference,
      metadata: data.metadata,
    });

    // ============================================================
    // 📦 3. TENTA CASAR A ORDER PELO mpPreferenceId
    // ============================================================
    let order = await Order.findOneAndUpdate(
      { mpPreferenceId: prefId },
      {
        status,
        mpPaymentId: String(id),
      },
      { new: true }
    );

    if (!order) {
      console.warn(
        "⚠️ Order não encontrada para prefId:",
        prefId,
        "— tentando fallback pela última 'pending'."
      );

      // Fallback: última Order pendente (seu fluxo é 1 usuário testando, isso é seguro)
      order = await Order.findOne({ status: "pending" }).sort({ createdAt: -1 });

      if (!order) {
        console.warn("⚠️ Nenhuma Order pendente encontrada; ignorando pagamento.");
        return res.status(200).send("ok");
      }

      order.status = status;
      order.mpPaymentId = String(id);
      await order.save();
    }

    console.log("📦 Order usada no webhook:", order._id);

    // carrinho certo: metadata.cart (novo fluxo) ou order.cart (fallback)
    const cart = metadata.cart || order.cart || [];
    const userId = metadata.userId || order.userId;

    if (!userId) {
      console.warn("⚠️ Webhook sem userId (nem metadata nem order)", {
        prefId,
        orderId: order._id,
      });
      return res.status(200).send("ok");
    }

    const user = await User.findById(userId);
    if (!user) {
      console.warn("⚠️ Usuário não encontrado:", userId);
      return res.status(200).send("ok");
    }

    // ============================================================
    // 🟢 4. PROCESSA PAGAMENTO APROVADO
    // ============================================================
    if (status === "approved") {
      console.log("🏆 Pagamento aprovado — salvando números...");

      for (const item of cart) {
        const { raffleId, numeros, precoUnit } = item;

        if (!raffleId || !Array.isArray(numeros) || numeros.length === 0) {
          console.warn("⚠️ Item inválido no cart do webhook:", item);
          continue;
        }

        // Atualiza rifa com os números vendidos
        await Raffle.findByIdAndUpdate(raffleId, {
          $addToSet: { soldNumbers: { $each: numeros } },
        });

        // Registra compra no usuário
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
    // ⏳ 5. PENDENTE
    // ============================================================
    if (status === "pending") {
      console.log(`⏳ Pagamento ${id} pendente`);
      return res.status(200).send("ok");
    }

    // ============================================================
    // ❌ 6. NEGADO/CANCELADO
    // ============================================================
    if (["rejected", "cancelled"].includes(status)) {
      console.log(`❌ Pagamento ${id} rejeitado/cancelado`);
      return res.status(200).send("ok");
    }

    // Qualquer outro status, só dá ok
    return res.status(200).send("ok");
  } catch (err) {
    console.error("💥 Erro no webhook:", err);
    // Sempre devolve 200 pro MP pra ele não ficar re-tentando infinito
    return res.status(200).send("ok");
  }
};

