// ============================================================
// 💳 BlinkGames — checkoutController.js (v6.3 FINAL)
// ============================================================

import { Preference } from "mercadopago";
import { client } from "../config/mercadoPago.js";

export const createCheckout = async (req, res) => {
  try {
    const { cart } = req.body;
    const userId = req.user?.id || null; // ✅ Captura o usuário autenticado, se existir

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio ou inválido" });
    }

    // ============================================================
    // 🔹 Monta os itens
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

    // ============================================================
    // 💰 Criação da preferência
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
      metadata: {
        userId, // ✅ Para o webhook saber quem comprou
        cart,   // ✅ Envia o conteúdo da compra
      },
      notification_url: `${process.env.BASE_URL_BACKEND}/api/webhooks/mercadopago`, // ✅ Fundamental
    };

    console.log("🟦 Enviando preferência ao Mercado Pago:", preferenceData);

    const response = await preference.create({ body: preferenceData });

    const initPoint = response?.init_point || response?.body?.init_point;

    if (!initPoint) {
      console.error("❌ Resposta inesperada do Mercado Pago:", response);
      return res.status(500).json({ error: "Falha ao gerar link de pagamento" });
    }

    console.log("✅ Checkout criado com sucesso:", initPoint);
    res.status(200).json({ checkoutUrl: initPoint });

  } catch (err) {
    console.error("💥 Erro ao criar checkout:", err);
    res.status(500).json({
      error:
        err.response?.data?.message ||
        err.message ||
        "Falha desconhecida ao criar checkout",
    });
  }
};

