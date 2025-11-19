// ============================================================
// 💳 BlinkGames — checkoutController.js (v16.0 — Order primeiro, seguro)
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

    const frontendURL =
      process.env.BASE_URL_FRONTEND || "https://blinkgamesrifa.vercel.app";

    const backendURL = (
      process.env.BASE_URL_BACKEND ||
      "https://blinkgames-backend-p4as.onrender.com"
    ).replace(/\/+$/, "");

    // ============================================================
    // 🔹 Normaliza cart para salvar e mandar pro MP
    // ============================================================
    const normalizedCart = cart.map((item) => ({
      raffleId: String(item.raffleId || item._id || item.id || ""),
      title: item.title || "Rifa BlinkGames",
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      numeros: Array.isArray(item.numeros || item.numbers)
        ? (item.numeros || item.numbers)
        : [],
    }));

    const total = normalizedCart.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0
    );

    // ============================================================
    // 🧾 1) Cria Order PENDENTE primeiro
    // ============================================================
    const order = await Order.create({
      userId,
      cart: normalizedCart,
      total,
      status: "pending",
    });

    console.log("💾 Order criada antes do MP:", order._id.toString());

    // ============================================================
    // 🧮 2) Monta itens pro Mercado Pago
    // ============================================================
    const items = normalizedCart.map((i) => ({
      title: i.title,
      unit_price: i.price || 1,
      quantity: i.quantity || 1,
      currency_id: "BRL",
    }));

    // ============================================================
    // 🔥 3) Cria preferência AMARRADA à Order
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

        // 👇 Chave de ouro: é ISSO que o webhook usa
        external_reference: String(order._id),

        notification_url: `${backendURL}/api/webhooks/mercadopago`,

        // Ajuda o webhook / auditoria, mas o dono da verdade é a Order
        metadata: {
          userId: String(userId),
          orderId: String(order._id),
          // cart: normalizedCart, // se quiser muito, pode deixar, mas não é obrigatório
        },
      },
    });

    const preferenceId =
      pref?.id || pref?.body?.id || pref?.response?.id || null;

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
      console.error("❌ Falha ao criar preferência MP:", pref);
      // Se quiser, você pode marcar a Order como erro aqui
      order.status = "error";
      await order.save();
      return res
        .status(500)
        .json({ error: "Falha ao gerar preferência de pagamento." });
    }

    console.log("💳 Preferência criada:", {
      orderId: order._id.toString(),
      preferenceId,
      initPoint,
      sandboxInitPoint,
    });

    // ============================================================
    // 📝 4) Atualiza Order com mpPreferenceId
    // ============================================================
    order.mpPreferenceId = preferenceId;
    await order.save();

    // ============================================================
    // 🎯 5) Resposta final pro front
    // ============================================================
    return res.status(200).json({
      ok: true,
      orderId: order._id,
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

