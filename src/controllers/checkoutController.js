// ============================================================
// 💳 BlinkGames — checkoutController.js (v7.0 FINAL — webhook validado)
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

    // ============================================================
    // 🔹 Monta itens enviados ao Mercado Pago
    // ============================================================
    const items = cart.map((i) => ({
      title: i.title || "Produto BlinkGames",
      unit_price: Number(i.price) > 0 ? Number(i.price) : 1,
      quantity: Number(i.quantity) > 0 ? Number(i.quantity) : 1,
      currency_id: "BRL",
    }));

    console.log("🧾 Itens enviados ao Mercado Pago:", items);

    const frontendURL =
      process.env.BASE_URL_FRONTEND || "https://blinkgamesrifa.vercel.app";
    const backendURL =
      process.env.BASE_URL_BACKEND || "https://blinkgames-backend-p4as.onrender.com";

    // ============================================================
    // 💰 Criação da preferência no Mercado Pago
    // ============================================================
    const preference = new Preference(client);

    const preferenceData = {
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
      // 🔧 CORRIGIDO: sem o "s" no caminho
      notification_url: `${backendURL}/api/webhook/mercadopago`,
    };

    console.log("🟦 Enviando preferência ao Mercado Pago:", preferenceData);

    const response = await preference.create({ body: preferenceData });

    const preferenceId =
      response?.id || response?.body?.id || response?.body?.preference_id;
    const initPoint =
      response?.init_point || response?.body?.init_point;

    if (!preferenceId || !initPoint) {
      console.error("❌ Resposta inesperada do Mercado Pago:", response);
      return res.status(500).json({ error: "Falha ao gerar link de pagamento" });
    }

    // ============================================================
    // 🧾 Salva a ordem no banco (agora com preferenceId correto)
    // ============================================================
    const total = cart.reduce(
      (acc, i) => acc + Number(i.price || 0) * Number(i.quantity || 1),
      0
    );

    const newOrder = new Order({
      userId,
      mpPreferenceId: preferenceId, // usado no webhook
      cart,
      total,
      status: "pending",
    });

    await newOrder.save();
    console.log("🗃️ Nova ordem registrada:", newOrder._id, "para usuário:", userId);

    // ============================================================
    // 🔁 Atualiza a preferência com external_reference
    // ============================================================
    try {
      await fetch(`https://api.mercadopago.com/checkout/preferences/${preferenceId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          external_reference: preferenceId,
        }),
      });
      console.log(`🔗 External reference vinculada ao preference ${preferenceId}`);
    } catch (err) {
      console.warn("⚠️ Falha ao atualizar external_reference:", err.message);
    }

    // ============================================================
    // ✅ Retorna o link de pagamento
    // ============================================================
    console.log("✅ Checkout criado com sucesso:", initPoint);
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

