// ============================================================
// 💳 BlinkGames — checkoutController.js (v12.1 — FINAL)
// Mercado Pago SDK v2 + compat total com cart.js v10.2
// Webhook corrigido: /api/webhooks/mercadopago
// ============================================================

import Order from "../models/Order.js";
import { preference } from "../config/mercadoPago.js";

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

    // Normaliza itens para o Mercado Pago
    const items = cart.map((i) => ({
      title: i.title || "Rifa BlinkGames",
      unit_price: Number(i.price) > 0 ? Number(i.price) : 1,
      quantity: Number(i.quantity) > 0 ? Number(i.quantity) : 1,
      currency_id: "BRL",
    }));

    // URLs de fallback
    const frontendURL =
      process.env.BASE_URL_FRONTEND || "https://blinkgamesrifa.vercel.app";

    const backendURL = (process.env.BASE_URL_BACKEND ||
      "https://blinkgames-backend-p4as.onrender.com")
      .replace(/\/+$/, ""); // 🔥 remove barras sobrando

    // Dados da preferência
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

      // 🔗 Amarra a ordem ao userId
      external_reference: String(userId),

      // Metadata salva tudo
      metadata: { userId: String(userId), cart },

      // 🔥 Agora na rota correta
      notification_url: `${backendURL}/api/webhooks/mercadopago`,
    };

    // Criar preferência (SDK v2)
    const mpRes = await preference.create({ body: prefData });

    // Formatos possíveis da resposta
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

    if (!preferenceId || !initPoint) {
      console.error("❌ Resposta inesperada:", mpRes);
      return res
        .status(500)
        .json({ error: "Falha ao gerar link de pagamento" });
    }

    // Salva Order
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

    // ============================================================
    // 🔥 RESPOSTA FINAL — EXATAMENTE O QUE O FRONT ESPERA
    // ============================================================
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

