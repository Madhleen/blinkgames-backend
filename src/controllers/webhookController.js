// ============================================================
// 📩 BlinkGames — webhookController.js (v11.1 FINAL — Compatível c/ checkout v15)
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
    // 🎯 2. IDENTIFICA O prefId CERTO (O MESMO QUE SALVAMOS NA ORDER)
    // ============================================================
    const prefId =
      metadata.preferenceId ||       // 🔥 definido no checkoutController
      metadata.preference_id ||      // fallback, se vier assim
      externalRef ||                 // 🔥 external_reference que atualizamos
      prefFromPayment;               // por último, o preference_id cru do MP

    console.log(
      `💰 Pagamento ${id} (${status}) | prefId usado: ${prefId} | external_reference: ${externalRef} | mp.pref: ${prefFromPayment} | metadata.userId: ${metadata.userId}`
    );

    if (!prefId) {
      console.warn("⚠️ Pagamento sem prefId utilizável:", { id, data });
      return res.status(200).send("ok");
    }

    // ============================================================
    // 📦 3. BUSCA / ATUALIZA A ORDER
    // ============================================================
    const order = await Order.findOneAndUpdate(
      { mpPreferenceId: prefId },
      {
        status,
        mpPaymentId: String(id),
      },
      { new: true }
    );

    if (!order) {
      console.warn("⚠️ Order não encontrada para prefId:", prefId);
      return res.status(200).send("ok");
    }

    console.log("📦 Order encontrada:", order._id);

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

