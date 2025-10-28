// ============================================================
// 💳 BlinkGames — checkoutController.js (v3.0)
// ============================================================
import { preference } from "../config/mercadopago.js";

// Cria a preferência de pagamento (Mercado Pago)
export const createCheckout = async (req, res) => {
  try {
    const { cart } = req.body;

    if (!cart || cart.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio" });
    }

    const items = cart.map((i) => ({
      title: i.title,
      unit_price: Number(i.price) || 0,
      quantity: Number(i.quantity) || 1,
      currency_id: "BRL",
    }));

    const preferenceData = {
      items,
      back_urls: {
        success: `${process.env.BASE_URL_FRONTEND}/sucesso.html`,
        failure: `${process.env.BASE_URL_FRONTEND}/erro.html`,
        pending: `${process.env.BASE_URL_FRONTEND}/aguardando.html`,
      },
      auto_return: "approved",
      statement_descriptor: "BLINKGAMES",
    };

    const result = await preference.create({ body: preferenceData });

    res.json({ checkoutUrl: result.init_point });
  } catch (err) {
    console.error("❌ Erro no checkout:", err.message);
    res.status(500).json({ error: "Falha ao criar checkout" });
  }
};

