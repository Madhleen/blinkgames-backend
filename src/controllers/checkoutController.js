// ============================================================
// 💳 BlinkGames — checkoutController.js (v15.1 — FIX 2025)
// ============================================================

import Order from "../models/Order.js";
import { Preference } from "mercadopago";
import { client } from "../config/mercadoPago.js";

export const createCheckout = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ error: "Usuário não autenticado." });

    const { cart } = req.body;
    if (!Array.isArray(cart) || cart.length === 0)
      return res.status(400).json({ error: "Carrinho vazio." });

    // ============================================================
    // 🔹 Normaliza itens do MP
    // ============================================================
    const items = cart.map((i) => ({
      title: i.title || "Rifa BlinkGames",
      unit_price: Number(i.price) || 1,
      quantity: Number(i.quantity) || 1,
      currency_id: "BRL",
    }));

    const frontendURL =
      process.env.BASE_URL_FRONTEND || "https://blinkgamesrifa.vercel.app";

    const backendURL =
      (process.env.BASE_URL_BACKEND ||
        "https://blinkgames-backend-p4as.onrender.com").replace(/\/+$/, "");

    // ============================================================
    // 🔥 1) Cria preferência INICIAL
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

        external_reference: "TEMP",

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

    if (!preferenceId) {
      return res.status(500).json({ error: "Falha ao gerar preferência." });
    }

    console.log("💳 Preferência criada:", {
      preferenceId,
      initPoint,
      sandboxInitPoint,
    });

    // ============================================================
    // 🔥 2) Adiciona metadata REAL no Mercado Pago
    // ============================================================
    await preference.update({
      id: preferenceId,
      body: {
        external_reference: preferenceId,
        metadata: {
          userId: String(userId),
          preferenceId: String(preferenceId),
          cart, // 🔥 cart completo → usado no webhook
        },
      },
    });

    console.log("🔗 Preferência atualizada com metadata + external_reference");

    // ============================================================
    // 🧾 3) Salva Order no banco
    // ============================================================
    const total = cart.reduce(
      (acc, i) => acc + Number(i.price || 0) * Number(i.quantity || 1),
      0
    );

    await Order.create({
      userId,
      mpPreferenceId: preferenceId,
      cart,
      total,
      status: "pending",
    });

    console.log("💾 Order salva com sucesso:", preferenceId);

    // ============================================================
    // 🎯 4) Resposta final
    // ============================================================
    return res.status(200).json({
      ok: true,
      preference_id: preferenceId,
      init_point: initPoint,
      sandbox_init_point: sandboxInitPoint,
    });
  } catch (err) {
    console.error("💥 Erro no createCheckout:", err);
    return res.status(500).json({
      error: err?.response?.data?.message || err?.message,
    });
  }
};

