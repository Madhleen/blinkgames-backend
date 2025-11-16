// ============================================================
// 💳 BlinkGames — orderController.js (v9.0 — FIX FINAL COMPLETO)
// ============================================================

import Order from "../models/Order.js";
import Raffle from "../models/Raffle.js";
import User from "../models/User.js";
import { gerarNumerosUnicos } from "../utils/numberGenerator.js";
import { client } from "../config/mercadoPago.js";
import { Preference } from "mercadopago";

// ============================================================
// 💰 Criar ordem e preference no Mercado Pago
// ============================================================
export const createCheckout = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { cart } = req.body;

    if (!userId || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio ou usuário inválido." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

    const itens = [];
    const orderItens = [];

    // 🔹 Gera itens e números de rifa
    for (const item of cart) {
      const raffleId = item.raffleId || item.id || item._id;
      const qtd = Math.max(1, Number(item.qtd || item.quantity || 1));

      const rifa = await Raffle.findById(raffleId);
      if (!rifa) continue;

      const numeros = gerarNumerosUnicos(qtd, rifa.totalNumbers, rifa.soldNumbers);

      orderItens.push({
        raffleId: rifa._id,
        numeros,
        precoUnit: Number(rifa.price),
        titulo: rifa.title,
      });

      itens.push({
        title: rifa.title,
        quantity: qtd,
        unit_price: Number(rifa.price),
        currency_id: "BRL",
      });
    }

    if (orderItens.length === 0) {
      return res.status(400).json({ error: "Nenhuma rifa válida encontrada." });
    }

    const total = orderItens.reduce((sum, i) => sum + i.precoUnit * i.numeros.length, 0);

    // ========================================================
    // 🧠 Criação da preferência Mercado Pago (SDK v2)
    // ========================================================
    const preference = new Preference(client);

    const payerData = {
      name: user.name || user.nome || "Cliente BlinkGames",
      email: user.email || "sem-email@blinkgames.com",
    };

    const prefResp = await preference.create({
      body: {
        items: itens,
        payer: payerData,

        // 🔥 Webhook precisa disso
        metadata: { userId, cart: orderItens },

        back_urls: {
          success: `${process.env.BASE_URL_FRONTEND}/sucesso.html`,
          failure: `${process.env.BASE_URL_FRONTEND}/erro.html`,
          pending: `${process.env.BASE_URL_FRONTEND}/aguardando.html`,
        },

        auto_return: "approved",

        // 🔥 Rota PADRÃO do backend
        notification_url: `${process.env.BASE_URL_BACKEND}/api/webhooks/mercadopago`,
      },
    });

    // ========================================================
    // 🔍 Fallback para garantir ID e links
    // ========================================================
    const prefId =
      prefResp?.id ||
      prefResp?.body?.id ||
      prefResp?.response?.id ||
      null;

    const initPoint =
      prefResp?.init_point ||
      prefResp?.body?.init_point ||
      prefResp?.response?.init_point ||
      null;

    const sandboxInitPoint =
      prefResp?.sandbox_init_point ||
      prefResp?.body?.sandbox_init_point ||
      null;

    console.log("✅ Preferência criada:");
    console.log({ prefId, initPoint, sandboxInitPoint });

    if (!prefId || !initPoint) {
      console.error("❌ Preferência inválida:", JSON.stringify(prefResp, null, 2));
      return res.status(500).json({ error: "Erro ao criar preferência no Mercado Pago." });
    }

    // ========================================================
    // 💾 Salva o pedido (CAMPO CORRIGIDO) 
    // ========================================================
    const order = new Order({
      userId,
      itens: orderItens,
      total,
      status: "pending",
      mpPreferenceId: prefId,   // 🔥 CORRIGIDO
    });

    await order.save();
    console.log("💾 Pedido salvo:", order._id, "→ pref:", prefId);

    // ========================================================
    // 🧾 Resposta para o front
    // ========================================================
    return res.json({
      ok: true,
      preference_id: prefId,
      init_point: initPoint,
      sandbox_init_point: sandboxInitPoint || null,
    });

  } catch (err) {
    console.error("❌ Erro ao criar checkout:", err);
    return res.status(500).json({ error: "Erro ao criar checkout." });
  }
};

// ============================================================
// 📦 Ordens do usuário logado (FIX COMPLETE)
// ============================================================
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Usuário não autenticado." });

    const orders = await Order.find({ userId })
      .populate({
        path: "itens.raffleId",
        select: "title image price",
        strictPopulate: false,
      })
      .sort({ createdAt: -1 });

    return res.json(orders);

  } catch (err) {
    console.error("❌ Erro ao buscar ordens:", err);
    return res.status(500).json({ error: "Erro ao buscar ordens." });
  }
};

