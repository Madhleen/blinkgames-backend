// ============================================================
// 💳 BlinkGames — checkoutController.js (v6.2 FINAL para SDK nova)
// ============================================================

import { Preference } from "mercadopago";
import { client } from "../config/mercadoPago.js";

export const createCheckout = async (req, res) => {
  try {
    const { cart } = req.body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio ou inválido" });
    }

    const items = cart.map((i) => ({
      title: i.title || "Produto BlinkGames",
      unit_price: Number(i.price) > 0 ? Number(i.price) : 1,
      quantity: Number(i.quantity) > 0 ? Number(i.quantity) : 1,
      currency_id: "BRL",
    }));

    console.log("🧾 Itens enviados ao Mercado Pago:", items);

    const frontendURL =
      process.env.BASE_URL_FRONTEND || "https://blinkgamesrifa.vercel.app";

    // ✅ Cria instância Preference com o client configurado
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
    };

    console.log("🟦 Enviando preferência ao Mercado Pago:", preferenceData);

    // ✅ Cria a preferência corretamente
    const response = await preference.create({ body: preferenceData });

    // 🔧 SDK nova: às vezes retorna direto, às vezes dentro de body
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

