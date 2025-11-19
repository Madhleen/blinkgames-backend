// ============================================================
// 📩 BlinkGames — webhookController.js (v12.0 — Produção multi-usuário segura)
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

    const data = payment.body || payment;

    const status = data.status;
    const metadata = data.metadata || {};
    const externalRef = data.external_reference; // AQUI vem o order._id
    const prefFromPayment = data.preference_id;

    console.log("🧾 Resumo MP payment:", {
      id: data.id,
      status: data.status,
      preference_id: data.preference_id,
      external_reference: data.external_reference,
      metadata: data.metadata,
    });

    if (!externalRef) {
      console.warn("⚠️ Webhook sem external_reference, não dá pra casar Order.");
      return res.status(200).send("ok");
    }

    // ============================================================
    // 📦 2. BUSCA Order DIRETO PELO external_reference (order._id)
// ============================================================
    let order;
    try {
      order = await Order.findById(externalRef);
    } catch (e) {
      console.warn("⚠️ external_reference não é um ObjectId válido:", externalRef);
      return res.status(200).send("ok");
    }

    if (!order) {
      console.warn("⚠️ Nenhuma Order encontrada para external_reference:", externalRef);
      return res.status(200).send("ok");
    }

    const prevStatus = order.status; // pra evitar processar 2x

    order.status = status;
    order.mpPaymentId = String(id);
    await order.save();

    console.log("📦 Order atualizada via webhook:", {
      orderId: order._id,
      statusAntes: prevStatus,
      statusDepois: status,
    });

    // carrinho correto
    const cart = metadata.cart || order.cart || [];
    const userId = metadata.userId || order.userId;

    if (!userId) {
      console.warn("⚠️ Webhook sem userId (nem metadata nem order)", {
        externalRef,
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
    // 🟢 3. PROCESSA APROVADO (uma única vez)
// ============================================================
    if (status === "approved") {
      if (prevStatus === "approved") {
        console.log("ℹ️ Pagamento já tinha sido processado antes, ignorando duplicata.");
        return res.status(200).send("ok");
      }

      console.log("🏆 Pagamento aprovado — salvando números...");

      for (const item of cart) {
        const { raffleId, numeros, precoUnit } = item;

        if (!raffleId || !Array.isArray(numeros) || numeros.length === 0) {
          console.warn("⚠️ Item inválido no cart do webhook:", item);
          continue;
        }

        // Atualiza rifa com os números vendidos (sem duplicar)
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
    // ⏳ 4. PENDENTE
    // ============================================================
    if (status === "pending") {
      console.log(`⏳ Pagamento ${id} pendente`);
      return res.status(200).send("ok");
    }

    // ============================================================
    // ❌ 5. NEGADO/CANCELADO
    // ============================================================
    if (["rejected", "cancelled"].includes(status)) {
      console.log(`❌ Pagamento ${id} rejeitado/cancelado`);
      return res.status(200).send("ok");
    }

    // Qualquer outro status, só confirma
    return res.status(200).send("ok");
  } catch (err) {
    console.error("💥 Erro no webhook:", err);
    // Sempre responde 200 pro MP não ficar reenviando infinitamente
    return res.status(200).send("ok");
  }
};

