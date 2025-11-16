// ============================================================
// 💳 BlinkGames — orderController.js (v11 — Ajuste de URLs)
// ============================================================

import Order from "../models/Order.js";
import Raffle from "../models/Raffle.js";
import User from "../models/User.js";
import { client } from "../config/mercadoPago.js";
import { Preference } from "mercadopago";

// ============================================================
// 💰 Criar checkout (SEM gerar números aqui!)
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

    // ============================================================
    // 🔥 NÃO GERAR NÚMEROS AQUI — somente validar rifas
    // ============================================================
    const itensMP = [];
    const itensPedido = [];

    for (const item of cart) {
      const raffleId = item.raffleId || item.id || item._id;
      const quantidade = Number(item.quantity) || 1;

      const rifa = await Raffle.findById(raffleId);
      if (!rifa) continue;

      itensPedido.push({
        raffleId,
        numeros: item.numeros || item.numbers || [],
        precoUnit: Number(rifa.price),
        titulo: rifa.title,
      });

      itensMP.push({
        title: rifa.title,
        quantity: quantidade,
        unit_price: Number(rifa.price),
        currency_id: "BRL",
      });
    }

    if (itensPedido.length === 0) {
      return res.status(400).json({ error: "Nenhuma rifa válida encontrada." });
    }

    const total = itensPedido.reduce(
      (sum, r) => sum + r.precoUnit * r.numeros.length,
      0
    );

    // ============================================================
    // 🧠 Criação da preferência
    // ============================================================
    const preference = new Preference(client);

    const payerData = {
      name: user.name || user.nome,
      email: user.email,
    };

    const FRONT = process.env.BASE_URL_FRONTEND.replace(/\/$/, "");
    const BACK = process.env.BASE_URL_BACKEND.replace(/\/$/, "");

    const pref = await preference.create({
      body: {
        items: itensMP,

        payer: payerData,

        metadata: { userId },

        back_urls: {
          success: `${FRONT}/sucesso.html`,
          failure: `${FRONT}/erro.html`,
          pending:  `${FRONT}/aguardando.html`,
        },

        auto_return: "approved",

        notification_url: `${BACK}/api/webhooks/mercadopago`,
      },
    });

    // ============================================================
    // 🔍 Pega init_point corretamente
    // ============================================================
    const prefId = pref?.id || null;
    const initPoint = pref?.init_point || null;
    const sandbox = pref?.sandbox_init_point || null;

    console.log("🔗 Preferência criada:", { prefId, initPoint });

    if (!prefId || !initPoint) {
      console.error("❌ Preferência inválida:", pref);
      return res.status(500).json({ error: "Falha ao gerar link de pagamento." });
    }

    // ============================================================
    // 💾 Salva pedido PENDING
    // ============================================================
    const order = new Order({
      userId,
      itens: itensPedido,
      total,
      status: "pending",
      mpPreferenceId: prefId,
    });

    await order.save();

    console.log("💾 Pedido criado:", order._id);

    return res.json({
      ok: true,
      preference_id: prefId,
      init_point: initPoint,
      sandbox_init_point: sandbox,
    });

  } catch (err) {
    console.error("❌ Erro ao criar checkout:", err);
    return res.status(500).json({ error: "Erro ao criar checkout." });
  }
};

// ============================================================
// 📦 Ordens do usuário
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

