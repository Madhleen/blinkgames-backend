// ============================================================
// 💳 BlinkGames — checkoutController.js (v7.3 Produção Final)
// ============================================================

import Order from "../models/Order.js";
import { client } from "../config/mercadoPago.js";
import jwt from "jsonwebtoken";

// ============================================================
// 🔹 Criar checkout com usuário autenticado (produção real)
// ============================================================
export const createCheckout = async (req, res) => {
  try {
    // 🔐 Confere se veio token JWT decodificado via middleware
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const { cart } = req.body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio." });
    }

    // 🔹 Itens no formato do Mercado Pago
    const items = cart.map((item) => ({
      title: item.title,
      unit_price: item.price,
      quantity: item.quantity,
      currency_id: "BRL",
    }));

    // 🔹 Configuração real (produção)
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

    // 🔹 Cria preferência no Mercado Pago
    const result = await client.preference.create(preference);

    // 🔹 Registra no banco
    const newOrder = await Order.create({
      user: userId,
      preferenceId: result.id,
      items: cart,
      status: "pending",
    });

    console.log(`🟦 Checkout criado com sucesso — Usuário: ${userId}`);
    console.log(`🗃️ Ordem registrada: ${newOrder._id} — preference: ${result.id}`);

    // 🔹 Retorna para o frontend
    res.json({
      init_point: result.init_point,
      preference_id: result.id,
      orderId: newOrder._id,
    });
  } catch (err) {
    console.error("Erro ao criar checkout:", err);
    res.status(500).json({ error: "Erro ao criar checkout." });
  }
};

