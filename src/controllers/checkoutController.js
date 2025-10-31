// ============================================================
// 💳 BlinkGames — checkoutController.js (v4.0 Final)
// ============================================================

import { client, preference } from "../config/mercadoPago.js";

// ============================================================
// 🧾 Cria a preferência de pagamento (Mercado Pago)
// ============================================================
export const createCheckout = async (req, res) => {
  try {
    const { cart } = req.body;

    // 🔸 Verifica se o carrinho veio vazio
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio ou inválido" });
    }

    // 🔹 Mapeia os itens para o formato esperado pelo Mercado Pago
    const items = cart.map((i) => ({
      title: i.title || "Produto BlinkGames",
      unit_price: Number(i.price) || 0,
      quantity: Number(i.quantity) || 1,
      currency_id: "BRL",
    }));

    // 🔹 URL base do frontend (fallback se env não estiver setado)
    const frontendURL = process.env.BASE_URL_FRONTEND || "https://blinkgames.vercel.app";

    // 🔹 Monta a preferência de pagamento
    const preferenceData = {
      items,
      back_urls: {
        success: `${frontendURL}/sucesso.html`,
        failure: `${frontendURL}/erro.html`,
        pending: `${frontendURL}/aguardando.html`,
      },
      auto_return: "approved",
      statement_descriptor: "BLINKGAMES",
      binary_mode: true, // ⚙️ Força retorno instantâneo de aprovado/rejeitado
    };

    console.log("🟦 Enviando preferência ao Mercado Pago:", JSON.stringify(preferenceData, null, 2));

    // 🔹 Cria a preferência
    const result = await preference.create({ body: preferenceData });

    // 🔸 Verifica se o Mercado Pago retornou o link de checkout
    if (!result || !result.init_point) {
      console.error("❌ Erro: resposta inesperada do Mercado Pago:", result);
      return res.status(500).json({ error: "Falha ao gerar link de pagamento" });
    }

    console.log("✅ Checkout criado com sucesso:", result.init_point);

    // 🔹 Retorna o link de checkout para o frontend
    res.status(200).json({ checkoutUrl: result.init_point });

  } catch (err) {
    console.error("❌ Erro no checkout:", err);
    const msg =
      err.response?.data?.message ||
      err.message ||
      "Falha desconhecida ao criar checkout";
    res.status(500).json({ error: msg });
  }
};

