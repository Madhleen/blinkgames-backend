// ============================================================
// 💳 BlinkGames — checkoutController.js (v7.3 PRODUÇÃO REAL)
// ============================================================

import { Preference } from "mercadopago";
import { client } from "../config/mercadoPago.js";
import Order from "../models/Order.js";

// ============================================================
// 🔹 Criar checkout com usuário autenticado
// ============================================================
export const createCheckout = async (req, res) => {
  try {
    const { cart } = req.body;
    const userId = req.user?.id || "guest";

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio ou inválido" });
    }

    // Monta itens
    const items = cart.map((item) => ({
      title: item.title || "Produto BlinkGames",
      unit_price: Number(item.price) > 0 ? Number(item.price) : 1,
      quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
      currency_id: "BRL",
    }));

    // URLs dinâmicas
    const frontendURL =
      process.env.BASE_URL_FRONTEND || "https://blinkgamesrifa.vercel.app";
    const backendURL =
      process.env.BASE_URL_BACKEND ||
      "https://blinkgames-backend-p4as.onrender.com";

    // Cria instância de Preference
    const preference = new Preference(client);

    // Monta dados da preferência
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
      external_reference: userId,
    };

    console.log("🟦 Enviando preferência ao Mercado Pago:", prefData);

    // Cria preferência no Mercado Pago
    const response = await preference.create({ body: prefData });

    const preferenceId =
      response?.id || response?.body?.id || response?.body?.preference_id;
    const initPoint =
      response?.init_point || response?.body?.init_point;

    if (!preferenceId || !initPoint) {
      console.error("❌ Resposta inesperada do Mercado Pago:", response);
      return res.status(500).json({ error: "Falha ao gerar link de pagamento" });
    }

    // Salva ordem no banco
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

    // Retorna link de pagamento
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

