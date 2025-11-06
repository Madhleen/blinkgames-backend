// ============================================================
// 💳 BlinkGames — checkoutController.js (v7.3 Produção Final)
// Corrige userId "guest" e garante vínculo real com o usuário logado.
// ============================================================

import { Preference } from "mercadopago";
import { client } from "../config/mercadoPago.js";
import Order from "../models/Order.js";

export const createCheckout = async (req, res) => {
  try {
    const { cart } = req.body;

    // ✅ Garante que o ID do usuário venha do token decodificado
    const userId =
      req.user?.id || req.user?.userId || "guest"; // cobre os dois formatos

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio ou inválido" });
    }

    // ============================================================
    // 🔹 Monta os itens enviados ao Mercado Pago
    // ============================================================
    const items = cart.map((i) => ({
      title: i.title || "Produto BlinkGames",
      unit_price: Number(i.price) > 0 ? Number(i.price) : 1,
      quantity: Number(i.quantity) > 0 ? Number(i.quantity) : 1,
      currency_id: "BRL",
    }));

    const frontendURL =
      process.env.BASE_URL_FRONTEND || "https://blinkgamesrifa.vercel.app";
    const backendURL =
      process.env.BASE_URL_BACKEND ||
      "https://blinkgames-backend-p4as.onrender.com";

    const preference = new Preference(client);

    // ============================================================
    // 💰 Cria a preferência (com external_reference e metadata)
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
      metadata: { userId, cart },
      notification_url: `${backendURL.replace(/\/$/, "")}/ipn/webhooks/payment`,
      external_reference: userId, // 👈 vai agora com o ID real
    };

    console.log("🟦 Enviando preferência ao Mercado Pago:", prefData);
    const response = await preference.create({ body: prefData });

    const preferenceId =
      response?.id || response?.body?.id || response?.body?.preference_id;
    const initPoint =
      response?.init_point || response?.body?.init_point;

    if (!preferenceId || !initPoint) {
      console.error("❌ Resposta inesperada do Mercado Pago:", response);
      return res
        .status(500)
        .json({ error: "Falha ao gerar link de pagamento" });
    }

    // ============================================================
    // 🧾 Salva a ordem no banco
    // ============================================================
    const total = cart.reduce(
      (acc, i) => acc + Number(i.price || 0) * Number(i.quantity || 1),
      0
    );

    const newOrder = new Order({
      userId,
      mpPreferenceId: preferenceId,
      cart,
      total,
      status: "pending",
    });

    await newOrder.save();
    console.log("🗃️ Ordem registrada:", newOrder._id, "— preference:", preferenceId);

    // ============================================================
    // ✅ Retorna o link de pagamento ao frontend
    // ============================================================
    return res.status(200).json({ checkoutUrl: initPoint });
  } catch (err) {
    console.error("💥 Erro ao criar checkout:", err);
    return res.status(500).json({
      error:
        err.response?.data?.message ||
        err.message ||
        "Falha desconhecida ao criar checkout",
    });
  }
};

