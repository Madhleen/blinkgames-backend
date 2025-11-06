// ============================================================
// 💳 BlinkGames — checkoutController.js (v7.0 FINAL)
// ============================================================

import Order from "../models/Order.js";
import { client } from "../config/mercadoPago.js";
import jwt from "jsonwebtoken";

// ============================================================
// 🔹 Criar checkout com usuário autenticado
// ============================================================
export const createCheckout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    // Decodifica token JWT
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const { cart } = req.body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio." });
    }

    // Cria itens no formato esperado pelo Mercado Pago
    const items = cart.map((item) => ({
      title: item.title,
      unit_price: item.price,
      quantity: item.quantity,
      currency_id: "BRL",
    }));

    // Configuração do pagamento
    const preference = {
      items,
      back_urls: {
        success: "https://blinkgamesrifa.vercel.app/sucesso.html",
        failure: "https://blinkgamesrifa.vercel.app/erro.html",
        pending: "https://blinkgamesrifa.vercel.app/aguardando.html",
      },
      auto_return: "approved",
      statement_descriptor: "BLINKGAMES",
      binary_mode: true,
      metadata: { userId, cart },
      external_reference: userId,
      notification_url: "https://blinkgames-backend-p4as.onrender.com/ipn/webhooks/payment",
    };

    // Cria a preferência de pagamento no MP
    const result = await client.preference.create(preference);

    // Registra no banco
    const newOrder = await Order.create({
      user: userId,
      preferenceId: result.id,
      items: cart,
      status: "pending",
    });

    console.log(`🗃️ Ordem registrada: ${newOrder._id} — preference: ${result.id}`);

    res.json({
      init_point: result.init_point,
      preference_id: result.id,
      orderId: newOrder._id,
    });
  } catch (err) {
    console.error("Erro ao criar checkout:", err);
    res.status(500).json({ error: "Erro ao criar checkout" });
  }
};

