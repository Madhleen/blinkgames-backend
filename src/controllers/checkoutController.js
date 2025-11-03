// ============================================================
// 💳 BlinkGames — checkoutController.js (v6.9 com external_reference = preferenceId)
// ============================================================

import { Preference } from "mercadopago";
import { client } from "../config/mercadoPago.js";
import Order from "../models/Order.js";

export const createCheckout = async (req, res) => {
  try {
    const { cart } = req.body;
    const userId = req.user?.id || "guest";

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio ou inválido" });
    }

    const items = cart.map((i) => ({
      title: i.title || "Produto BlinkGames",
      unit_price: Number(i.price) > 0 ? Number(i.price) : 1,
      quantity: Number(i.quantity) > 0 ? Number(i.quantity) : 1,
      currency_id: "BRL",
    }));

    const frontendURL = process.env.BASE_URL_FRONTEND || "https://blinkgamesrifa.vercel.app";
    const backendURL = process.env.BASE_URL_BACKEND || "https://blinkgames-backend-p4as.onrender.com";

    const preference = new Preference(client);
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
      notification_url: `${backendURL}/api/webhook/mercadopago`, // caminho principal
    };

    console.log("🟦 Criando preferência:", prefData);
    const response = await preference.create({ body: prefData });

    const preferenceId = response?.id || response?.body?.id || response?.body?.preference_id;
    const initPoint = response?.init_point || response?.body?.init_point;

    if (!preferenceId || !initPoint) {
      console.error("❌ Resposta inesperada do Mercado Pago:", response);
      return res.status(500).json({ error: "Falha ao gerar link de pagamento" });
    }

    // cria a Order já com preferenceId e userId correto
    const total = cart.reduce((acc, i) => acc + Number(i.price || 0) * Number(i.quantity || 1), 0);

    const newOrder = new Order({
      userId,
      mpPreferenceId: preferenceId,
      cart,
      total,
      status: "pending",
    });
    await newOrder.save();
    console.log("🗃️ Order salva:", newOrder._id, "pref:", preferenceId);

    // Atualiza a preferência para amarrar o external_reference ao próprio preferenceId
    try {
      await fetch(`https://api.mercadopago.com/checkout/preferences/${preferenceId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ external_reference: preferenceId }),
      });
      console.log("🔗 external_reference definido:", preferenceId);
    } catch (e) {
      console.warn("⚠️ Falha ao setar external_reference:", e.message);
    }

    return res.status(200).json({ checkoutUrl: initPoint });
  } catch (err) {
    console.error("💥 Erro no checkout:", err);
    return res.status(500).json({
      error: err.response?.data?.message || err.message || "Falha desconhecida ao criar checkout",
    });
  }
};

