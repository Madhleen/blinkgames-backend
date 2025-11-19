// ============================================================
// 💳 BlinkGames — checkoutController.js (v16.0 — Produção multi-usuário segura)
// ============================================================

import Order from "../models/Order.js";
import { Preference } from "mercadopago";
import { client } from "../config/mercadoPago.js";

export const createCheckout = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const { cart } = req.body;
    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio." });
    }

    // ============================================================
    // 💰 Total da compra
    // ============================================================
    const total = cart.reduce(
      (acc, i) => acc + Number(i.price || 0) * Number(i.quantity || 1),
      0
    );

    // ============================================================
    // 📦 1) Cria a Order primeiro no Mongo
    // ============================================================
    const order = await Order.create({
      userId,
      cart,
      total,
      status: "pending",
    });

    const orderRef = String(order._id); // vamos usar isso como external_reference

    // ============================================================
    // 🔹 Normaliza itens para Mercado Pago
    // ============================================================
    const items = cart.map((i) => ({
      title: i.title || "Rifa BlinkGames",
      unit_price: Number(i.price) || 1,
      quantity: Number(i.quantity) || 1,
      currency_id: "BRL",
    }));

    const frontendURL =
      process.env.BASE_URL_FRONTEND || "https://blinkgamesrifa.vercel.app";

    const backendURL = (
      process.env.BASE_URL_BACKEND ||
      "https://blinkgames-backend-p4as.onrender.com"
    ).replace(/\/+$/, "");

    // ============================================================
    // 🔥 2) Cria preferência no Mercado Pago
    //      external_reference = order._id (AMARRAÇÃO FORTE)
// ============================================================
    const preference = new Preference(client);

    const pref = await preference.create({
      body: {
        items,
        back_urls: {
          success: `${frontendURL}/sucesso.html`,
          failure: `${frontendURL}/erro.html`,
          pending: `${frontendURL}/aguardando.html`,
        },
        auto_return: "approved",
        binary_mode: true,
        statement_descriptor: "BLINKGAMES",

        // ⚡ PONTO CRÍTICO: agora é SEMPRE o ID da Order
        external_reference: orderRef,

        // Se o MP respeitar isso, melhor ainda:
        metadata: {
          userId: String(userId),
          orderId: String(orderRef),
          cart,
        },

        notification_url: `${backendURL}/api/webhooks/mercadopago`,
      },
    });

    const preferenceId =
      pref?.id ||
      pref?.body?.id ||
      pref?.response?.id ||
      null;

    const initPoint =
      pref?.init_point ||
      pref?.body?.init_point ||
      pref?.response?.init_point ||
      null;

    const sandboxInitPoint =
      pref?.sandbox_init_point ||
      pref?.body?.sandbox_init_point ||
      pref?.response?.sandbox_init_point ||
      null;

    if (!preferenceId || !initPoint) {
      console.error("❌ Falha ao criar preferência:", pref);
      return res.status(500).json({ error: "Falha ao gerar preferência." });
    }

    console.log("💳 Preferência criada:", {
      preferenceId,
      initPoint,
      sandboxInitPoint,
      external_reference: orderRef,
    });

    // ============================================================
    // 🔗 3) Atualiza Order com o mpPreferenceId (controle interno)
// ============================================================
    order.mpPreferenceId = preferenceId;
    await order.save();

    console.log("💾 Order ligada à preferência:", {
      orderId: order._id,
      mpPreferenceId: preferenceId,
    });

    // ============================================================
    // 🎯 4) Resposta final
    // ============================================================
    return res.status(200).json({
      ok: true,
      order_id: orderRef,
      preference_id: preferenceId,
      init_point: initPoint,
      sandbox_init_point: sandboxInitPoint,
    });
  } catch (err) {
    console.error("💥 Erro no createCheckout:", err);
    return res.status(500).json({
      error:
        err?.response?.data?.message ||
        err?.message ||
        "Erro interno no checkout.",
    });
  }
};

