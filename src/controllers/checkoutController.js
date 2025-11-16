// ============================================================
// 💳 BlinkGames — checkoutController.js (v14.0 — FINAL REAL)
// ============================================================

import Order from "../models/Order.js";
import { preference } from "../config/mercadoPago.js";

export const createCheckout = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ error: "Usuário não autenticado." });

    const { cart } = req.body;
    if (!Array.isArray(cart) || cart.length === 0)
      return res.status(400).json({ error: "Carrinho vazio." });

    // ============================================================
    // 🔹 Monta os itens do Mercado Pago
    // ============================================================
    const items = cart.map((i) => ({
      title: i.title || "Rifa BlinkGames",
      unit_price: Number(i.price) || 1,
      quantity: Number(i.quantity) || 1,
      currency_id: "BRL",
    }));

    // URLs
    const frontendURL =
      process.env.BASE_URL_FRONTEND || "https://blinkgamesrifa.vercel.app";

    const backendURL =
      (process.env.BASE_URL_BACKEND ||
        "https://blinkgames-backend-p4as.onrender.com").replace(/\/+$/, "");

    // ============================================================
    // 🔥 Dados da preferência REAL usados pelo Mercado Pago
    // ============================================================
    const prefData = {
      items,

      back_urls: {
        success: `${frontendURL}/sucesso.html`,
        failure: `${frontendURL}/erro.html`,
        pending: `${frontendURL}/aguardando.html`,
      },

      auto_return: "approved",
      statement_descriptor: "BLINKGAMES",
      binary_mode: true,

      // 🔥 Fundamental
      external_reference: String(userId),

      // 🔥 Envia apenas o que o webhook realmente usa
      metadata: {
        userId: String(userId),
      },

      notification_url: `${backendURL}/api/webhooks/mercadopago`,
    };

    // Cria preferência
    const mpRes = await preference.create({ body: prefData });

    const preferenceId =
      mpRes?.id ||
      mpRes?.body?.id ||
      mpRes?.body?.preference_id ||
      null;

    const initPoint =
      mpRes?.init_point ||
      mpRes?.body?.init_point ||
      null;

    const sandboxInitPoint =
      mpRes?.sandbox_init_point ||
      mpRes?.body?.sandbox_init_point ||
      null;

    console.log("💳 MP Preference criada:", {
      preferenceId,
      initPoint,
      sandboxInitPoint,
    });

    if (!preferenceId || !initPoint)
      return res
        .status(500)
        .json({ error: "Falha ao gerar link de pagamento" });

    // ============================================================
    // 🧾 Salva Order — compatível com webhook + orderController
    // ============================================================
    const total = cart.reduce(
      (acc, i) => acc + Number(i.price || 0) * Number(i.quantity || 1),
      0
    );

    await Order.create({
      userId,
      mpPreferenceId: preferenceId, // 🔥 CAMPO FINAL E CORRETO
      cart, // o webhook não usa, mas sua área de pedidos usa
      total,
      status: "pending",
    });

    return res.status(200).json({
      ok: true,
      preference_id: preferenceId,
      init_point: initPoint,
      sandbox_init_point: sandboxInitPoint,
    });
  } catch (err) {
    console.error("💥 Erro ao criar checkout:", err);
    return res.status(500).json({
      error:
        err?.response?.data?.message ||
        err?.message ||
        "Erro ao criar checkout",
    });
  }
};

